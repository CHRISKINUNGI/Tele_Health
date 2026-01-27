'use client';

import { useEffect, useState } from 'react';
import { ProgressTracker } from '@/components/patient/progress-tracker';
import { StatusCard } from '@/components/patient/status-card';
import { getPatientAppointments } from '@/lib/actions/appointments';
import { getQueuePosition } from '@/lib/actions/queue';
import { useAppointmentStatus } from '@/hooks/use-appointment-status';
import { useRealtimeQueue } from '@/hooks/use-realtime-queue';
import { Activity } from 'lucide-react';
import type { Appointment, QueueStage } from '@/lib/types';

interface PatientDashboardProps {
    patientId: string;
    patientName: string;
}

export function PatientDashboard({ patientId, patientName }: PatientDashboardProps) {
    const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
    const [queueStage, setQueueStage] = useState<QueueStage>('check_in');
    const [estimatedWait, setEstimatedWait] = useState(0);
    const [loading, setLoading] = useState(true);

    // Real-time updates
    const { appointment: realtimeAppointment } = useAppointmentStatus(currentAppointment?.id || '');
    const { queueEntries } = useRealtimeQueue(undefined, currentAppointment?.id);

    useEffect(() => {
        loadCurrentAppointment();
    }, [patientId]);

    useEffect(() => {
        if (realtimeAppointment) {
            setCurrentAppointment(realtimeAppointment);
        }
    }, [realtimeAppointment]);

    useEffect(() => {
        if (queueEntries.length > 0) {
            const entry = queueEntries[0];
            setQueueStage(entry.current_stage);
            setEstimatedWait(entry.estimated_wait_minutes);
        }
    }, [queueEntries]);

    const loadCurrentAppointment = async () => {
        try {
            const appointments = await getPatientAppointments(patientId);

            // Find the most recent active appointment
            const active = appointments.find((apt: Appointment) =>
                ['scheduled', 'checked_in', 'in_nurse_review', 'waiting', 'in_session'].includes(apt.status)
            );

            if (active) {
                setCurrentAppointment(active as Appointment);

                // Get queue info
                const queueInfo = await getQueuePosition(active.id);
                setEstimatedWait(queueInfo.estimatedWait);
            }
        } catch (error) {
            console.error('Error loading appointment:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointment...</p>
                </div>
            </div>
        );
    }

    if (!currentAppointment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">No active appointments</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        You don't have any upcoming appointments
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Appointment Overview</h1>
                <p className="text-gray-600">Track your progress and communicate with your care team in real-time.</p>
            </div>

            <div className="space-y-6">
                {/* Status Card */}
                <StatusCard
                    appointment={currentAppointment}
                    estimatedWaitMinutes={estimatedWait}
                    patientId={patientId}
                />

                {/* Progress Tracker */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Visit Journey
                    </h2>
                    <ProgressTracker
                        currentStage={queueStage}
                        estimatedWaitMinutes={estimatedWait}
                    />
                </div>
            </div>
        </div>
    );
}
