'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrCreateConversation } from '@/lib/actions/messages';
import type { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AppointmentTileProps {
    appointment: Appointment;
    onStartSession?: () => void;
    onCompleteSession?: () => void;
    doctorId?: string;
}

export function AppointmentTile({
    appointment,
    onStartSession,
    onCompleteSession,
    doctorId
}: AppointmentTileProps) {
    const router = useRouter();
    const [messagingLoading, setMessagingLoading] = useState(false);

    const getStatusColor = () => {
        switch (appointment.status) {
            case 'in_session':
                return 'bg-green-100 border-green-500 text-green-900';
            case 'waiting':
            case 'in_nurse_review':
                return 'bg-amber-100 border-amber-500 text-amber-900';
            case 'scheduled':
            case 'checked_in':
                return 'bg-white border-gray-300 text-gray-900';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-600';
        }
    };

    const getStatusLabel = () => {
        switch (appointment.status) {
            case 'in_session':
                return 'Active';
            case 'waiting':
                return 'Waiting';
            case 'in_nurse_review':
                return 'In Review';
            case 'checked_in':
                return 'Checked In';
            case 'scheduled':
                return 'Scheduled';
            default:
                return appointment.status;
        }
    };

    const getPriorityColor = (score: number) => {
        if (score >= 70) return 'bg-red-500';
        if (score >= 50) return 'bg-orange-500';
        if (score >= 30) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const handleMessagePatient = async () => {
        if (!doctorId || !appointment.patient_id) return;

        setMessagingLoading(true);
        try {
            const conversation = await getOrCreateConversation(
                appointment.patient_id,
                doctorId,
                appointment.id
            );
            router.push(`/messages?conversation=${conversation.id}`);
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setMessagingLoading(false);
        }
    };

    return (
        <Card className={cn('border-2 transition-all hover:shadow-md', getStatusColor())}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">
                            {(appointment.patient as any)?.name || 'Patient'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {appointment.type === 'virtual' ? '💻 Virtual' : '🏥 In-Person'}
                        </p>
                    </div>
                    <Badge className={cn('text-white', getPriorityColor(appointment.priority_score))}>
                        Priority: {appointment.priority_score}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant="outline">{getStatusLabel()}</Badge>
                    </div>

                    {appointment.scheduled_time && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Scheduled:</span>
                            <span className="text-sm">
                                {new Date(appointment.scheduled_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    )}

                    {appointment.actual_start && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Started:</span>
                            <span className="text-sm">
                                {new Date(appointment.actual_start).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        {appointment.status === 'waiting' && onStartSession && (
                            <Button
                                onClick={onStartSession}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                Start Session
                            </Button>
                        )}
                        {appointment.status === 'in_session' && onCompleteSession && (
                            <Button
                                onClick={onCompleteSession}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                Complete
                            </Button>
                        )}
                        {doctorId && appointment.patient_id && (
                            <Button
                                onClick={handleMessagePatient}
                                variant="outline"
                                className="gap-2"
                                disabled={messagingLoading}
                            >
                                <MessageSquare className="h-4 w-4" />
                                Message
                            </Button>
                        )}
                        {(appointment.status === 'in_session' || appointment.status === 'completed') && (
                            <Link href={`/provider/notes/${appointment.id}`} className="flex-1">
                                <Button variant="outline" className="w-full gap-2">
                                    <FileText className="h-4 w-4" />
                                    Note
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
