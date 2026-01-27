'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Appointment } from '@/lib/types';

export function useAppointmentStatus(appointmentId: string) {
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Initial fetch
        const fetchAppointment = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('appointments')
                    .select(`
            *,
            patient:profiles!appointments_patient_id_fkey(id, name),
            doctor:profiles!appointments_doctor_id_fkey(id, name, specialization)
          `)
                    .eq('id', appointmentId)
                    .single();

                if (fetchError) throw fetchError;

                setAppointment(data);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        };

        fetchAppointment();

        // Set up realtime subscription
        const channel = supabase
            .channel(`appointment_${appointmentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `id=eq.${appointmentId}`,
                },
                () => {
                    fetchAppointment(); // Refetch to get joined data
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appointmentId]);

    return { appointment, loading, error };
}
