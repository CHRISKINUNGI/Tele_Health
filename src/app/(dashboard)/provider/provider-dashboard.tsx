'use client';

import { useEffect, useState } from 'react';
import { AppointmentTile } from '@/components/provider/appointment-tile';
import { PriorityQueue } from '@/components/provider/priority-queue';
import { getDoctorAppointments } from '@/lib/actions/appointments';
import { updateAppointmentStatus } from '@/lib/actions/appointments';
import { useRealtimeQueue } from '@/hooks/use-realtime-queue';
import type { Appointment } from '@/lib/types';

interface ProviderDashboardProps {
    doctorId: string;
    doctorName: string;
    specialization: string;
}

export function ProviderDashboard({ doctorId, doctorName, specialization }: ProviderDashboardProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const { queueEntries } = useRealtimeQueue(doctorId);

    useEffect(() => {
        loadAppointments();
    }, [doctorId, queueEntries]);

    const loadAppointments = async () => {
        try {
            const data = await getDoctorAppointments(doctorId);
            setAppointments(data as Appointment[]);
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async (appointmentId: string) => {
        try {
            await updateAppointmentStatus(appointmentId, 'in_session');
            await loadAppointments();
        } catch (error) {
            console.error('Error starting session:', error);
        }
    };

    const handleCompleteSession = async (appointmentId: string) => {
        try {
            await updateAppointmentStatus(appointmentId, 'completed');
            await loadAppointments();
        } catch (error) {
            console.error('Error completing session:', error);
        }
    };

    const activeAppointment = appointments.find(apt => apt.status === 'in_session');
    const waitingAppointments = appointments.filter(apt =>
        ['waiting', 'in_nurse_review', 'checked_in'].includes(apt.status)
    );
    const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Provider Command Center</h1>
                    <p className="text-gray-600 mt-2">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Grid - 3 columns */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Active Session */}
                        {activeAppointment && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Session</h2>
                                <AppointmentTile
                                    appointment={activeAppointment}
                                    onCompleteSession={() => handleCompleteSession(activeAppointment.id)}
                                    doctorId={doctorId}
                                />
                            </div>
                        )}

                        {/* Waiting Patients */}
                        {waitingAppointments.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                                    Waiting ({waitingAppointments.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {waitingAppointments.map(appointment => (
                                        <AppointmentTile
                                            key={appointment.id}
                                            appointment={appointment}
                                            onStartSession={() => handleStartSession(appointment.id)}
                                            doctorId={doctorId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Scheduled Appointments */}
                        {scheduledAppointments.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                                    Scheduled ({scheduledAppointments.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {scheduledAppointments.map(appointment => (
                                        <AppointmentTile
                                            key={appointment.id}
                                            appointment={appointment}
                                            doctorId={doctorId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {appointments.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No appointments today</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="lg:col-span-1">
                        <PriorityQueue appointments={appointments} />
                    </div>
                </div>
            </div>
        </div>
    );
}
