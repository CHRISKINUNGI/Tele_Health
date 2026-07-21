'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getOrCreateConversation } from '@/lib/actions/messages';
import { formatDoctorName } from '@/lib/utils/doctor-name';
import { useState } from 'react';
import type { Appointment } from '@/lib/types';

interface StatusCardProps {
    appointment: Appointment;
    estimatedWaitMinutes: number;
    patientId: string;
}

export function StatusCard({ appointment, estimatedWaitMinutes, patientId }: StatusCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const getStatusMessage = () => {
        switch (appointment.status) {
            case 'scheduled':
                return 'Your appointment is scheduled';
            case 'checked_in':
                return 'You have checked in';
            case 'in_nurse_review':
                return 'A nurse is reviewing your information';
            case 'waiting':
                return 'Waiting for your doctor';
            case 'in_session':
                return 'You are with the doctor';
            case 'completed':
                return 'Your appointment is complete';
            default:
                return 'Status unknown';
        }
    };

    const getStatusIcon = () => {
        switch (appointment.status) {
            case 'scheduled': return '📅';
            case 'checked_in': return '✅';
            case 'in_nurse_review': return '🩺';
            case 'waiting': return '⏳';
            case 'in_session': return '👨‍⚕️';
            case 'completed': return '✅';
            default: return '❓';
        }
    };

    const handleMessageDoctor = async () => {
        if (!appointment.doctor_id) return;
        setLoading(true);
        try {
            const conversation = await getOrCreateConversation(
                patientId,
                appointment.doctor_id,
                appointment.id
            );
            router.push(`/messages?conversation=${conversation.id}`);
        } catch (error) {
            console.error('Error starting conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="overflow-hidden border-2">
            <CardHeader className="bg-white border-b">
                <CardTitle className="text-center text-2xl py-2">
                    {getStatusIcon()} {getStatusMessage()}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {(appointment.doctor as any)?.name?.charAt(0) || 'D'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Attending Physician</p>
                            <p className="font-bold text-gray-900 truncate">
                                {formatDoctorName((appointment.doctor as any)?.name)}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={handleMessageDoctor}
                            disabled={loading}
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                            {appointment.type === 'virtual' ? '💻' : '🏥'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Visit Type</p>
                            <p className="font-bold text-gray-900 capitalize">{appointment.type} Consultation</p>
                        </div>
                    </div>
                </div>

                {appointment.status !== 'completed' && appointment.status !== 'in_session' && (
                    <div className="text-center p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
                        <p className="text-blue-100 text-sm font-medium mb-1">Estimated Remaining Wait</p>
                        <p className="text-4xl font-black">
                            {estimatedWaitMinutes} <span className="text-xl font-normal opacity-80">min</span>
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                            {new Date(appointment.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                            {new Date(appointment.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {appointment.status === 'in_session' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold gap-2 shadow-md">
                        Join Secure Video Session
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
