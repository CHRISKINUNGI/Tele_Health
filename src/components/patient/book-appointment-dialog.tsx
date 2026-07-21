'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { scheduleAppointment, getDoctorProfiles, getDoctorBookedSlots } from '@/lib/actions/appointments';
import { formatKes } from '@/lib/utils/currency';
import { formatDoctorName } from '@/lib/utils/doctor-name';
import { generateDaySlots, isDayOpen, isPast, nextOpenDay } from '@/lib/utils/availability';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { WeeklyAvailability } from '@/lib/types';

interface BookAppointmentDialogProps {
    patientId: string;
    onAppointmentBooked?: () => void;
}

export function BookAppointmentDialog({
    patientId,
    onAppointmentBooked
}: BookAppointmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);

    // Form State
    const [doctorId, setDoctorId] = useState('');
    const [type, setType] = useState<'virtual' | 'in_person'>('virtual');
    const [date, setDate] = useState<Date | undefined>(() => nextOpenDay(new Date()));
    const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);

    const selectedDoctor = doctors.find((d) => d.id === doctorId);
    const doctorAvailability = (selectedDoctor?.availability ?? undefined) as WeeklyAvailability | undefined;

    // Availability
    const [bookedHours, setBookedHours] = useState<Set<number>>(new Set());
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadDoctors();
        }
    }, [open]);

    const loadDoctors = async () => {
        try {
            const data = await getDoctorProfiles();
            setDoctors(data || []);
        } catch (error) {
            console.error('Error loading doctors:', error);
            toast.error('Could not load provider list');
        }
    };

    // Whenever the doctor or date changes, refresh which slots are occupied.
    const loadAvailability = useCallback(async () => {
        if (!doctorId || !date) {
            setBookedHours(new Set());
            return;
        }
        setSlotsLoading(true);
        setSelectedSlotIso(null);
        try {
            const booked = await getDoctorBookedSlots(doctorId, date.toISOString());
            setBookedHours(new Set(booked.map((iso) => new Date(iso).getHours())));
        } catch (error) {
            console.error('Error loading availability:', error);
            setBookedHours(new Set());
        } finally {
            setSlotsLoading(false);
        }
    }, [doctorId, date]);

    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);

    // If the picked date is a day the selected doctor is off, jump to their next open day.
    useEffect(() => {
        if (doctorId && date && !isDayOpen(date, doctorAvailability)) {
            setDate(nextOpenDay(date, doctorAvailability));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctorId]);

    const slots = date ? generateDaySlots(date, doctorAvailability) : [];

    const handleBook = async () => {
        if (!doctorId) {
            toast.error('Please select a doctor');
            return;
        }
        if (!selectedSlotIso) {
            toast.error('Please pick an available time slot');
            return;
        }

        setLoading(true);
        try {
            await scheduleAppointment({
                patientId,
                doctorId,
                type,
                scheduledTime: selectedSlotIso,
                priorityScore: 0,
            });

            toast.success('Appointment booked successfully');
            setOpen(false);
            if (onAppointmentBooked) onAppointmentBooked();
        } catch (error) {
            console.error('Error booking appointment:', error);
            toast.error('Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Book New Visit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Book a New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="doctor-select">Select Doctor</Label>
                        <Select value={doctorId} onValueChange={setDoctorId}>
                            <SelectTrigger id="doctor-select" className="w-full">
                                <SelectValue placeholder="Select a healthcare provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.length > 0 ? (
                                    doctors.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDoctorName(doc.name)}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {doc.specialization || 'General Practice'}
                                                    <span className="mx-1.5 text-muted-foreground/50">•</span>
                                                    <span className="text-emerald-600 font-medium">
                                                        {formatKes(doc.consultation_fee)}
                                                    </span>
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No providers currently available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Consultation Type</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="virtual">💻 Virtual Consultation</SelectItem>
                                <SelectItem value="in_person">🏥 In-person Visit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={'w-full justify-start text-left font-normal'}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(d) =>
                                        d < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                        !isDayOpen(d, doctorAvailability)
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Availability slot picker */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Available Times</Label>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Free
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-gray-300" /> Occupied
                                </span>
                            </div>
                        </div>

                        {!doctorId ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Select a doctor to see their availability.
                            </p>
                        ) : slotsLoading ? (
                            <div className="py-6 text-center">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                            </div>
                        ) : slots.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                {formatDoctorName(selectedDoctor?.name)} is not available on this day. Please pick another date.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map((slot) => {
                                    const iso = slot.toISOString();
                                    const occupied = bookedHours.has(slot.getHours());
                                    const past = isPast(slot);
                                    const disabled = occupied || past;
                                    const selected = selectedSlotIso === iso;
                                    return (
                                        <button
                                            key={iso}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => setSelectedSlotIso(iso)}
                                            className={cn(
                                                'rounded-lg border py-2 text-sm font-medium transition-colors',
                                                selected && 'border-blue-600 bg-blue-600 text-white',
                                                !selected && !disabled &&
                                                    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
                                                disabled &&
                                                    'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                            )}
                                            title={occupied ? 'Occupied' : past ? 'Past' : 'Available'}
                                        >
                                            {format(slot, 'HH:mm')}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleBook}
                        disabled={loading || !selectedSlotIso}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
