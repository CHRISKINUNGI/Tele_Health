'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { QueueEntry } from '@/lib/types';

export function useRealtimeQueue(doctorId?: string, appointmentId?: string) {
    const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Initial fetch
        const fetchQueue = async () => {
            try {
                let query = supabase
                    .from('queue_entries')
                    .select(`
            *,
            appointment:appointments(
              *,
              patient:profiles!appointments_patient_id_fkey(id, name),
              doctor:profiles!appointments_doctor_id_fkey(id, name, specialization)
            )
          `);

                if (doctorId) {
                    query = query.eq('doctor_id', doctorId);
                }

                if (appointmentId) {
                    query = query.eq('appointment_id', appointmentId);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;

                setQueueEntries(data || []);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        };

        fetchQueue();

        // Set up realtime subscription
        const channel = supabase
            .channel('queue_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue_entries',
                    filter: doctorId ? `doctor_id=eq.${doctorId}` : undefined,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        fetchQueue(); // Refetch to get joined data
                    } else if (payload.eventType === 'UPDATE') {
                        fetchQueue(); // Refetch to get joined data
                    } else if (payload.eventType === 'DELETE') {
                        setQueueEntries((prev) =>
                            prev.filter((entry) => entry.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [doctorId, appointmentId]);

    return { queueEntries, loading, error };
}
