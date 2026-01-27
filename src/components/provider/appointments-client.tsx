'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppointmentTile } from '@/components/provider/appointment-tile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon, Filter } from 'lucide-react';
import type { Appointment } from '@/lib/types';

interface ProviderAppointmentsClientProps {
    doctorId: string;
}

export function ProviderAppointmentsClient({ doctorId }: ProviderAppointmentsClientProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const supabase = createClient();

    useEffect(() => {
        loadAppointments();
    }, [doctorId]);

    const loadAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patient:profiles!appointments_patient_id_fkey(*)
                `)
                .eq('doctor_id', doctorId)
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(apt =>
        (apt.patient as any)?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const upcoming = filteredAppointments.filter(a => ['scheduled', 'checked_in', 'waiting', 'in_nurse_review'].includes(a.status));
    const completed = filteredAppointments.filter(a => a.status === 'completed');
    const inSession = filteredAppointments.filter(a => a.status === 'in_session');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by patient name..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Today's Schedule
                    </h2>
                </div>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="bg-gray-100/50">
                    <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                    <TabsTrigger value="in-session">In Session ({inSession.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                    {upcoming.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcoming.map(apt => (
                                <AppointmentTile
                                    key={apt.id}
                                    appointment={apt}
                                    doctorId={doctorId}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white border border-dashed rounded-xl">
                            <p className="text-gray-500">No upcoming appointments found.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="in-session" className="mt-6">
                    {inSession.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inSession.map(apt => (
                                <AppointmentTile
                                    key={apt.id}
                                    appointment={apt}
                                    doctorId={doctorId}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white border border-dashed rounded-xl">
                            <p className="text-gray-500">No active sessions.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    {completed.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completed.map(apt => (
                                <AppointmentTile
                                    key={apt.id}
                                    appointment={apt}
                                    doctorId={doctorId}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white border border-dashed rounded-xl">
                            <p className="text-gray-500">No completed sessions recorded.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
