'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import type { InvoiceStatus } from '../types';

/**
 * Create an invoice for a patient (doctor/admin action).
 */
export async function createInvoice(data: {
    patientId: string;
    doctorId: string;
    amount: number;
    description?: string;
    appointmentId?: string;
}) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    if (!Number.isFinite(data.amount) || data.amount < 0) {
        throw new Error('Invoice amount must be a non-negative number');
    }

    const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
            patient_id: data.patientId,
            doctor_id: data.doctorId,
            amount: data.amount,
            description: data.description?.trim() || null,
            appointment_id: data.appointmentId || null,
            created_by: user.id,
            status: 'unpaid',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating invoice:', error);
        throw new Error('Failed to create invoice');
    }

    revalidatePath('/provider/billing');
    revalidatePath('/patient/billing');
    return invoice;
}

/**
 * Update an invoice's payment status (doctor/admin action).
 */
export async function setInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('invoices')
        .update({
            status,
            paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) {
        console.error('Error updating invoice status:', error);
        throw new Error('Failed to update invoice');
    }

    revalidatePath('/provider/billing');
    revalidatePath('/patient/billing');
    return data;
}

/**
 * Get invoices for a patient (their own bills).
 */
export async function getPatientInvoices(patientId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('invoices')
        .select(`
      *,
      doctor:profiles!invoices_doctor_id_fkey(id, name, specialization)
    `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching patient invoices:', error);
        throw new Error('Failed to fetch invoices');
    }

    return data;
}

/**
 * Get invoices a doctor has issued.
 */
export async function getDoctorInvoices(doctorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('invoices')
        .select(`
      *,
      patient:profiles!invoices_patient_id_fkey(id, name)
    `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching doctor invoices:', error);
        throw new Error('Failed to fetch invoices');
    }

    return data;
}
