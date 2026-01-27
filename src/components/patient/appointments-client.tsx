'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getOrCreateConversation } from '@/lib/actions/messages';
import { BookAppointmentDialog } from './book-appointment-dialog';

interface PatientAppointmentsClientProps {
    patientId: string;
}

export function PatientAppointmentsClient({ patientId }: PatientAppointmentsClientProps) {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagingLoading, setMessagingLoading] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadAppointments();
    }, [patientId]);

    const loadAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctor:profiles!appointments_doctor_id_fkey(*)
                `)
                .eq('patient_id', patientId)
                .order('scheduled_time', { ascending: false });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageDoctor = async (doctorId: string, appointmentId: string) => {
        setMessagingLoading(appointmentId);
        try {
            const conversation = await getOrCreateConversation(
                patientId,
                doctorId,
                appointmentId
            );
            router.push(`/messages?conversation=${conversation.id}`);
        } catch (error) {
            console.error('Error starting chat:', error);
        } finally {
            setMessagingLoading(null);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'default';
            case 'cancelled': return 'destructive';
            case 'in_session': return 'secondary';
            default: return 'outline';
        }
    };

    if (loading) return <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
    </div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Appointment History</h2>
                <BookAppointmentDialog
                    patientId={patientId}
                    onAppointmentBooked={loadAppointments}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {appointments.length > 0 ? (
                    appointments.map((apt) => (
                        <Card key={apt.id} className="hover:border-blue-100 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                Dr. {apt.doctor?.name || 'Assigned Provider'}
                                            </h3>
                                            <p className="text-sm text-gray-500">{apt.doctor?.specialization || 'Telehealth Specialist'}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge variant={getStatusVariant(apt.status)} className="capitalize">
                                                    {apt.status.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-xs text-gray-400">•</span>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {new Date(apt.scheduled_time).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(apt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {['waiting', 'in_session', 'completed'].includes(apt.status) && (
                                            <Button
                                                variant="outline"
                                                className="gap-2 flex-1 md:flex-none"
                                                onClick={() => handleMessageDoctor(apt.doctor_id, apt.id)}
                                                disabled={messagingLoading === apt.id}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                Message Doctor
                                            </Button>
                                        )}
                                        {apt.status === 'in_session' && (
                                            <Button className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none">
                                                Join Call
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="py-20 text-center bg-white border border-dashed rounded-xl">
                        <p className="text-gray-500">You haven't scheduled any appointments yet.</p>
                        <Button variant="link" className="text-blue-600 mt-2">Schedule your first visit</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
