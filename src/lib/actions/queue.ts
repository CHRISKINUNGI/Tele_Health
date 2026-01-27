'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateEstimatedWaitTime } from '../utils/load-balancer';
import type { QueueStage } from '../types';

/**
 * Add appointment to queue (on check-in)
 */
export async function addToQueue(appointmentId: string) {
    const supabase = await createClient();

    // Get appointment details
    const { data: appointment } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('id', appointmentId)
        .single();

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    // Create queue entry
    const { data, error } = await supabase
        .from('queue_entries')
        .insert({
            appointment_id: appointmentId,
            doctor_id: appointment.doctor_id,
            current_stage: 'check_in',
            estimated_wait_minutes: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding to queue:', error);
        throw new Error('Failed to add to queue');
    }

    // Update appointment status
    await supabase
        .from('appointments')
        .update({ status: 'checked_in' })
        .eq('id', appointmentId);

    // Calculate estimated wait time
    const estimatedWait = await calculateEstimatedWaitTime(data.id);

    await supabase
        .from('queue_entries')
        .update({ estimated_wait_minutes: estimatedWait })
        .eq('id', data.id);

    revalidatePath('/admin');
    revalidatePath('/provider');
    revalidatePath('/patient');

    return data;
}

/**
 * Update queue stage
 */
export async function updateQueueStage(queueId: string, stage: QueueStage) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('queue_entries')
        .update({ current_stage: stage })
        .eq('id', queueId)
        .select()
        .single();

    if (error) {
        console.error('Error updating queue stage:', error);
        throw new Error('Failed to update queue stage');
    }

    // Update appointment status based on stage
    const statusMap: Record<QueueStage, string> = {
        check_in: 'checked_in',
        nurse_review: 'in_nurse_review',
        waiting: 'waiting',
        in_consultation: 'in_session',
        completed: 'completed',
    };

    await supabase
        .from('appointments')
        .update({ status: statusMap[stage] })
        .eq('id', data.appointment_id);

    revalidatePath('/admin');
    revalidatePath('/provider');
    revalidatePath('/patient');

    return data;
}

/**
 * Get queue position for an appointment
 */
export async function getQueuePosition(appointmentId: string) {
    const supabase = await createClient();

    const { data: queueEntry } = await supabase
        .from('queue_entries')
        .select('doctor_id, check_in_time, current_stage')
        .eq('appointment_id', appointmentId)
        .single();

    if (!queueEntry) {
        return { position: 0, estimatedWait: 0 };
    }

    // Count patients ahead in queue
    const { count } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', queueEntry.doctor_id)
        .in('current_stage', ['check_in', 'nurse_review', 'waiting'])
        .lt('check_in_time', queueEntry.check_in_time);

    const position = (count || 0) + 1;
    const estimatedWait = position * 15; // 15 minutes per patient

    return { position, estimatedWait };
}

/**
 * Get all queue entries for a doctor
 */
export async function getDoctorQueue(doctorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('queue_entries')
        .select(`
      *,
      appointment:appointments(
        *,
        patient:profiles!appointments_patient_id_fkey(id, name)
      )
    `)
        .eq('doctor_id', doctorId)
        .in('current_stage', ['check_in', 'nurse_review', 'waiting', 'in_consultation'])
        .order('check_in_time', { ascending: true });

    if (error) {
        console.error('Error fetching doctor queue:', error);
        throw new Error('Failed to fetch queue');
    }

    return data;
}

/**
 * Get flagged queue entries for admin
 */
export async function getFlaggedQueueEntries() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('queue_entries')
        .select(`
      *,
      appointment:appointments(
        *,
        patient:profiles!appointments_patient_id_fkey(id, name),
        doctor:profiles!appointments_doctor_id_fkey(id, name, specialization)
      )
    `)
        .eq('flagged_for_reassignment', true)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching flagged entries:', error);
        throw new Error('Failed to fetch flagged entries');
    }

    return data;
}

/**
 * Get system-wide doctor loads for admin monitoring
 */
export async function getDoctorLoads() {
    const supabase = await createClient();

    // Get all doctors
    const { data: doctors, error: doctorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('name');

    if (doctorError) {
        console.error('Error fetching doctors for load grid:', doctorError);
        throw new Error('Failed to fetch doctors');
    }

    // Get all active queue entries
    const { data: queueEntries, error: queueError } = await supabase
        .from('queue_entries')
        .select('*, appointment:appointments(patient:profiles!appointments_patient_id_fkey(name))')
        .in('current_stage', ['check_in', 'nurse_review', 'waiting', 'in_consultation']);

    if (queueError) {
        console.error('Error fetching queue entries for load grid:', queueError);
        throw new Error('Failed to fetch queue entries');
    }

    // Map loads to doctors
    const doctorLoads = doctors.map(doctor => {
        const doctorEntries = queueEntries.filter(entry => entry.doctor_id === doctor.id);
        const currentSession = doctorEntries.find(entry => entry.current_stage === 'in_consultation');
        const queueLength = doctorEntries.filter(entry => entry.current_stage !== 'in_consultation').length;

        return {
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization,
            currentPatient: (currentSession?.appointment as any)?.patient?.name || null,
            queueLength,
            status: currentSession ? 'busy' : 'available'
        };
    });

    return doctorLoads;
}
