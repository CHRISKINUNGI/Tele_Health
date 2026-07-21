'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, ChevronRight, Loader2 } from 'lucide-react';
import { getDoctorProfiles } from '@/lib/actions/appointments';
import { getDoctorQueue } from '@/lib/actions/queue';
import { formatDoctorName } from '@/lib/utils/doctor-name';

interface ReassignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
    currentDoctorId: string;
    onReassign: (appointmentId: string, newDoctorId: string) => Promise<void>;
}

export function ReassignDialog({
    open,
    onOpenChange,
    appointmentId,
    currentDoctorId,
    onReassign
}: ReassignDialogProps) {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [reassigning, setReassigning] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadDoctorOptions();
        }
    }, [open]);

    const loadDoctorOptions = async () => {
        setLoading(true);
        try {
            const allDoctors = await getDoctorProfiles();
            // Filter out current doctor
            const candidates = allDoctors.filter(d => d.id !== currentDoctorId);

            // For each doctor, get their current queue length for better decision making
            const doctorsWithLoad = await Promise.all(candidates.map(async (doc) => {
                const queue = await getDoctorQueue(doc.id);
                return {
                    ...doc,
                    queueLength: queue.length
                };
            }));

            setDoctors(doctorsWithLoad.sort((a, b) => a.queueLength - b.queueLength));
        } catch (error) {
            console.error('Error loading doctors for reassignment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = async (doctorId: string) => {
        setReassigning(doctorId);
        try {
            await onReassign(appointmentId, doctorId);
            onOpenChange(false);
        } catch (error) {
            console.error('Error in reassign dialog:', error);
        } finally {
            setReassigning(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Reassign Appointment</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Select a secondary provider to handle this delayed appointment. Doctors are sorted by existing queue length.
                    </p>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {loading ? (
                            <div className="py-12 text-center text-gray-400">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <p>Finding available providers...</p>
                            </div>
                        ) : doctors.length > 0 ? (
                            doctors.map((doctor) => (
                                <button
                                    key={doctor.id}
                                    onClick={() => handleSelectDoctor(doctor.id)}
                                    disabled={reassigning !== null}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-100">
                                            {doctor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{formatDoctorName(doctor.name)}</p>
                                            <p className="text-xs text-gray-500">{doctor.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase">
                                                <Users className="h-3 w-3" />
                                                <span>Queue</span>
                                            </div>
                                            <p className={`font-bold ${doctor.queueLength > 3 ? 'text-amber-600' : 'text-blue-600'}`}>
                                                {doctor.queueLength} patients
                                            </p>
                                        </div>
                                        {reassigning === doctor.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center text-gray-500">
                                No alternative providers available.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
