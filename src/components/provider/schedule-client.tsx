'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Loader2, Clock, User, Video, Building2, Settings } from 'lucide-react';
import { getDoctorSchedule } from '@/lib/actions/appointments';
import { WEEKDAY_LABELS, scheduleForDate, DEFAULT_AVAILABILITY } from '@/lib/utils/availability';
import type { Appointment, WeeklyAvailability } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ScheduleClientProps {
    doctorId: string;
    availability?: WeeklyAvailability | null;
}

// Monday-first display order (weekday indexes).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function hourLabel(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
}

const STATUS_STYLES: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700',
    checked_in: 'bg-indigo-50 text-indigo-700',
    in_nurse_review: 'bg-amber-50 text-amber-700',
    waiting: 'bg-amber-50 text-amber-700',
    in_session: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-gray-100 text-gray-500',
};

export function ScheduleClient({ doctorId, availability }: ScheduleClientProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await getDoctorSchedule(doctorId);
                setAppointments((data as Appointment[]) || []);
            } catch (error) {
                console.error('Error loading schedule:', error);
                toast.error('Could not load your schedule');
            } finally {
                setLoading(false);
            }
        })();
    }, [doctorId]);

    // Group upcoming appointments by calendar day.
    const groups = new Map<string, Appointment[]>();
    for (const apt of appointments) {
        const key = new Date(apt.scheduled_time).toDateString();
        const existing = groups.get(key);
        if (existing) existing.push(apt);
        else groups.set(key, [apt]);
    }
    const dayGroups = Array.from(groups.entries());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly hours */}
            <div className="lg:col-span-1">
                <Card className="border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarClock className="h-5 w-5 text-blue-600" />
                            Working Hours
                        </CardTitle>
                        <Link
                            href="/settings"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <Settings className="h-3.5 w-3.5" /> Edit
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                        {DAY_ORDER.map((weekday) => {
                            // Build a reference date for this weekday to read its schedule.
                            const ref = new Date();
                            ref.setDate(ref.getDate() + ((weekday - ref.getDay() + 7) % 7));
                            const sched = scheduleForDate(ref, availability) ?? DEFAULT_AVAILABILITY[String(weekday)];
                            const isToday = weekday === new Date().getDay();
                            return (
                                <div
                                    key={weekday}
                                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                                        isToday ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <span className={sched.enabled ? 'font-medium text-gray-900' : 'text-gray-400'}>
                                        {WEEKDAY_LABELS[weekday]}
                                        {isToday && <span className="ml-1.5 text-[10px] text-blue-600 font-bold">TODAY</span>}
                                    </span>
                                    <span className={sched.enabled ? 'text-gray-600' : 'text-gray-400'}>
                                        {sched.enabled ? `${hourLabel(sched.start)} – ${hourLabel(sched.end)}` : 'Day off'}
                                    </span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming appointments */}
            <div className="lg:col-span-2 space-y-6">
                {loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                ) : dayGroups.length === 0 ? (
                    <Card className="border-gray-200">
                        <CardContent className="py-16 text-center">
                            <CalendarClock className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No upcoming appointments</h3>
                            <p className="text-sm text-gray-500">Your schedule is clear for now.</p>
                        </CardContent>
                    </Card>
                ) : (
                    dayGroups.map(([dayKey, dayAppointments]) => {
                        const dayDate = new Date(dayKey);
                        const isToday = dayKey === new Date().toDateString();
                        return (
                            <div key={dayKey}>
                                <div className="flex items-center gap-2 mb-3">
                                    <h2 className="text-sm font-bold text-gray-900">
                                        {isToday ? 'Today' : format(dayDate, 'EEEE')}
                                    </h2>
                                    <span className="text-xs text-gray-400">{format(dayDate, 'PP')}</span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                    <span className="text-xs text-gray-400">
                                        {dayAppointments.length} appt{dayAppointments.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dayAppointments.map((apt) => (
                                        <Card key={apt.id} className="border-gray-200">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="flex flex-col items-center justify-center w-16 shrink-0">
                                                    <span className="text-lg font-black text-gray-900 tabular-nums">
                                                        {format(new Date(apt.scheduled_time), 'HH:mm')}
                                                    </span>
                                                    <Clock className="h-3.5 w-3.5 text-gray-300" />
                                                </div>
                                                <div className="h-10 w-px bg-gray-100" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        {apt.patient?.name || 'Patient'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        {apt.type === 'virtual' ? (
                                                            <><Video className="h-3.5 w-3.5" /> Virtual</>
                                                        ) : (
                                                            <><Building2 className="h-3.5 w-3.5" /> In-person</>
                                                        )}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={`capitalize ${STATUS_STYLES[apt.status] || 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    {apt.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
