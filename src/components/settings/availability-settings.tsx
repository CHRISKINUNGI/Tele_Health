'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CalendarClock, Loader2, Save } from 'lucide-react';
import { updateDoctorAvailability } from '@/lib/actions/user';
import { DEFAULT_AVAILABILITY } from '@/lib/utils/availability';
import type { WeeklyAvailability } from '@/lib/types';
import { toast } from 'sonner';

interface AvailabilitySettingsProps {
    initialAvailability?: WeeklyAvailability | null;
}

// Display order: Monday first, Sunday last.
const DAY_ORDER: { key: string; label: string }[] = [
    { key: '1', label: 'Monday' },
    { key: '2', label: 'Tuesday' },
    { key: '3', label: 'Wednesday' },
    { key: '4', label: 'Thursday' },
    { key: '5', label: 'Friday' },
    { key: '6', label: 'Saturday' },
    { key: '0', label: 'Sunday' },
];

const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 – 21:00

function formatHour(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
}

export function AvailabilitySettings({ initialAvailability }: AvailabilitySettingsProps) {
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<WeeklyAvailability>(() => {
        const base: WeeklyAvailability = {};
        for (const { key } of DAY_ORDER) {
            base[key] = initialAvailability?.[key] ?? { ...DEFAULT_AVAILABILITY[key] };
        }
        return base;
    });

    const updateDay = (key: string, patch: Partial<WeeklyAvailability[string]>) => {
        setSchedule((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    };

    const handleSave = async () => {
        // Validate: enabled days must have end > start.
        for (const { key, label } of DAY_ORDER) {
            const day = schedule[key];
            if (day.enabled && day.end <= day.start) {
                toast.error(`${label}: closing time must be after opening time`);
                return;
            }
        }

        setLoading(true);
        try {
            await updateDoctorAvailability(schedule);
            toast.success('Availability updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update availability');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-blue-600" />
                    Weekly Availability
                </CardTitle>
                <CardDescription>
                    Set the days and hours you see patients. Patients only see free slots within these windows.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {DAY_ORDER.map(({ key, label }) => {
                        const day = schedule[key];
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0"
                            >
                                <div className="flex items-center gap-3 w-40 shrink-0">
                                    <Switch
                                        checked={day.enabled}
                                        onCheckedChange={(checked) => updateDay(key, { enabled: checked })}
                                        aria-label={`Toggle ${label}`}
                                    />
                                    <span className={day.enabled ? 'font-medium text-gray-900' : 'text-gray-400'}>
                                        {label}
                                    </span>
                                </div>

                                {day.enabled ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <HourSelect
                                            value={day.start}
                                            onChange={(v) => updateDay(key, { start: v })}
                                        />
                                        <span className="text-gray-400">to</span>
                                        <HourSelect
                                            value={day.end}
                                            onChange={(v) => updateDay(key, { end: v })}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">Day off</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="pt-6">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 font-bold gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Availability
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
            <SelectTrigger className="w-24 h-9">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                        {formatHour(h)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
