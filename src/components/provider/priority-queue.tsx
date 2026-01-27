'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PriorityQueueProps {
    appointments: Appointment[];
}

export function PriorityQueue({ appointments }: PriorityQueueProps) {
    // Sort by priority score (highest first) and take top 3
    const topPriority = appointments
        .filter(apt => ['scheduled', 'checked_in', 'in_nurse_review', 'waiting'].includes(apt.status))
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, 3);

    const getPriorityColor = (score: number) => {
        if (score >= 70) return 'bg-red-500';
        if (score >= 50) return 'bg-orange-500';
        if (score >= 30) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const getPriorityLabel = (score: number) => {
        if (score >= 70) return 'Urgent';
        if (score >= 50) return 'High';
        if (score >= 30) return 'Medium';
        return 'Low';
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Next Patients</CardTitle>
                <p className="text-sm text-muted-foreground">Prioritized by urgency</p>
            </CardHeader>
            <CardContent className="space-y-3">
                {topPriority.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No patients in queue
                    </p>
                ) : (
                    topPriority.map((appointment, index) => (
                        <div
                            key={appointment.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-sm truncate">
                                            {(appointment.patient as any)?.name || 'Patient'}
                                        </p>
                                        <Badge
                                            className={cn('text-white text-xs ml-2', getPriorityColor(appointment.priority_score))}
                                        >
                                            {appointment.priority_score}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>
                                            {appointment.type === 'virtual' ? '💻 Virtual' : '🏥 In-Person'}
                                        </span>
                                        <span>•</span>
                                        <span>{getPriorityLabel(appointment.priority_score)}</span>
                                    </div>
                                    {appointment.scheduled_time && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(appointment.scheduled_time).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
