'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { createClient } from '@/lib/supabase/client';
import { scheduleAppointment, getDoctorProfiles } from '@/lib/actions/appointments';
import { toast } from 'sonner';

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
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('09:00');

    useEffect(() => {
        if (open) {
            loadDoctors();
        }
    }, [open]);

    const loadDoctors = async () => {
        try {
            console.log('Loading doctors for booking...');
            const data = await getDoctorProfiles();
            console.log('Doctors loaded:', data?.length || 0);
            setDoctors(data || []);
        } catch (error) {
            console.error('Error loading doctors:', error);
            toast.error("Could not load provider list");
        }
    };

    const handleBook = async () => {
        if (!doctorId || !date) {
            toast.error("Please select a doctor and date");
            return;
        }

        setLoading(true);
        try {
            // Combine date and time
            const [hours, minutes] = time.split(':');
            const scheduledTime = new Date(date);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes));

            await scheduleAppointment({
                patientId,
                doctorId,
                type,
                scheduledTime: scheduledTime.toISOString(),
                priorityScore: 0 // Default priority
            });

            toast.success("Appointment booked successfully");
            setOpen(false);
            if (onAppointmentBooked) onAppointmentBooked();
        } catch (error) {
            console.error('Error booking appointment:', error);
            toast.error("Failed to book appointment");
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
            <DialogContent className="sm:max-w-[425px]">
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
                                                <span className="font-medium">Dr. {doc.name}</span>
                                                {doc.specialization && (
                                                    <span className="text-xs text-muted-foreground">{doc.specialization}</span>
                                                )}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={"w-full justify-start text-left font-normal"}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleBook}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
