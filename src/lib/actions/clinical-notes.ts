'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import type { ClinicalNote, VitalSigns } from '../types';

/**
 * Create or update a clinical note
 */
export async function saveClinicalNote(data: {
    id?: string;
    appointmentId: string;
    doctorId: string;
    patientId: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    vitalSigns?: VitalSigns;
    diagnosisCodes?: string[];
    isFinalized?: boolean;
}) {
    const supabase = await createClient();

    const noteData = {
        appointment_id: data.appointmentId,
        doctor_id: data.doctorId,
        patient_id: data.patientId,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        vital_signs: data.vitalSigns,
        diagnosis_codes: data.diagnosisCodes,
        is_finalized: data.isFinalized || false,
    };

    if (data.id) {
        // Update existing note
        const { data: note, error } = await supabase
            .from('clinical_notes')
            .update(noteData)
            .eq('id', data.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating clinical note:', error);
            throw new Error('Failed to update clinical note');
        }

        revalidatePath('/provider');
        return note;
    } else {
        // Create new note
        const { data: note, error } = await supabase
            .from('clinical_notes')
            .insert(noteData)
            .select()
            .single();

        if (error) {
            console.error('Error creating clinical note:', error);
            throw new Error('Failed to create clinical note');
        }

        revalidatePath('/provider');
        return note;
    }
}

/**
 * Get clinical note for an appointment
 */
export async function getClinicalNoteByAppointment(appointmentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clinical_notes')
        .select(`
      *,
      appointment:appointments(*),
      doctor:profiles!clinical_notes_doctor_id_fkey(id, name, specialization),
      patient:profiles!clinical_notes_patient_id_fkey(id, name)
    `)
        .eq('appointment_id', appointmentId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching clinical note:', error);
        throw new Error('Failed to fetch clinical note');
    }

    return data as ClinicalNote | null;
}

/**
 * Get all clinical notes for a patient
 */
export async function getPatientClinicalNotes(patientId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clinical_notes')
        .select(`
      *,
      appointment:appointments(*),
      doctor:profiles!clinical_notes_doctor_id_fkey(id, name, specialization)
    `)
        .eq('patient_id', patientId)
        .eq('is_finalized', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching patient notes:', error);
        throw new Error('Failed to fetch patient notes');
    }

    return data as ClinicalNote[];
}

/**
 * Get all clinical notes by a doctor
 */
export async function getDoctorClinicalNotes(doctorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clinical_notes')
        .select(`
      *,
      appointment:appointments(*),
      patient:profiles!clinical_notes_patient_id_fkey(id, name)
    `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching doctor notes:', error);
        throw new Error('Failed to fetch doctor notes');
    }

    return data as ClinicalNote[];
}

/**
 * Finalize a clinical note (make it visible to patient)
 */
export async function finalizeClinicalNote(noteId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clinical_notes')
        .update({ is_finalized: true })
        .eq('id', noteId)
        .select()
        .single();

    if (error) {
        console.error('Error finalizing note:', error);
        throw new Error('Failed to finalize note');
    }

    revalidatePath('/provider');
    revalidatePath('/patient');

    return data;
}

/**
 * Delete a clinical note (only if not finalized)
 */
export async function deleteClinicalNote(noteId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('clinical_notes')
        .delete()
        .eq('id', noteId)
        .eq('is_finalized', false);

    if (error) {
        console.error('Error deleting note:', error);
        throw new Error('Failed to delete note');
    }

    revalidatePath('/provider');
}
