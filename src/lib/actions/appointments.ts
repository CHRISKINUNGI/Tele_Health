'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import type { AppointmentStatus, AppointmentType } from '../types';

/**
 * Schedule a new appointment
 */
export async function scheduleAppointment(data: {
    patientId: string;
    doctorId: string;
    type: AppointmentType;
    scheduledTime: string;
    priorityScore: number;
}) {
    const supabase = await createClient();

    const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
            patient_id: data.patientId,
            doctor_id: data.doctorId,
            type: data.type,
            scheduled_time: data.scheduledTime,
            priority_score: data.priorityScore,
            status: 'scheduled',
        })
        .select()
        .single();

    if (error) {
        console.error('Error scheduling appointment:', error);
        throw new Error('Failed to schedule appointment');
    }

    revalidatePath('/admin');
    revalidatePath('/provider');
    revalidatePath('/patient');

    return appointment;
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus
) {
    const supabase = await createClient();

    const updateData: any = { status };

    // Set actual_start when moving to in_session
    if (status === 'in_session') {
        updateData.actual_start = new Date().toISOString();
    }

    // Set actual_end when completing
    if (status === 'completed') {
        updateData.actual_end = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating appointment status:', error);
        throw new Error('Failed to update appointment status');
    }

    revalidatePath('/admin');
    revalidatePath('/provider');
    revalidatePath('/patient');

    return data;
}

/**
 * Reassign appointment to a different doctor
 */
export async function reassignAppointment(
    appointmentId: string,
    newDoctorId: string
) {
    const supabase = await createClient();

    // Update appointment
    const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ doctor_id: newDoctorId })
        .eq('id', appointmentId);

    if (appointmentError) {
        console.error('Error reassigning appointment:', appointmentError);
        throw new Error('Failed to reassign appointment');
    }

    // Update queue entry
    const { error: queueError } = await supabase
        .from('queue_entries')
        .update({
            doctor_id: newDoctorId,
            flagged_for_reassignment: false,
            reassignment_reason: null,
        })
        .eq('appointment_id', appointmentId);

    if (queueError) {
        console.error('Error updating queue:', queueError);
    }

    revalidatePath('/admin');
    revalidatePath('/provider');
    revalidatePath('/patient');

    return { success: true };
}

/**
 * Get appointments for a specific doctor
 */
export async function getDoctorAppointments(doctorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(id, name),
      queue_entries(*)
    `)
        .eq('doctor_id', doctorId)
        .in('status', ['scheduled', 'checked_in', 'in_nurse_review', 'waiting', 'in_session'])
        .order('priority_score', { ascending: false });

    if (error) {
        console.error('Error fetching doctor appointments:', error);
        throw new Error('Failed to fetch appointments');
    }

    return data;
}

/**
 * Get all available doctors for booking (Discovery)
 */
export async function getDoctorProfiles() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('name');

    if (error) {
        console.error('Error fetching doctor profiles:', error);
        return [];
    }

    return data;
}

/**
 * Get appointments for a specific patient
 */
export async function getPatientAppointments(patientId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      doctor:profiles!appointments_doctor_id_fkey(id, name, specialization)
    `)
        .eq('patient_id', patientId)
        .order('scheduled_time', { ascending: false });

    if (error) {
        console.error('Error fetching patient appointments:', error);
        throw new Error('Failed to fetch appointments');
    }

    return data;
}
