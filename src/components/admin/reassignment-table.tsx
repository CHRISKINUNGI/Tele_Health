'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ReassignDialog } from './reassign-dialog';
import type { QueueEntry } from '@/lib/types';

interface ReassignmentTableProps {
    flaggedEntries: QueueEntry[];
    onReassign: (appointmentId: string, newDoctorId: string) => Promise<void>;
}

export function ReassignmentTable({ flaggedEntries, onReassign }: ReassignmentTableProps) {
    const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);

    if (flaggedEntries.length === 0) {
        return (
            <div className="text-center py-20 bg-white border border-dashed rounded-xl">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-200 mx-auto mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">System Balanced</h3>
                <p className="text-xs text-gray-500 mt-1">No appointments currently flagged for reassignment.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="font-bold text-gray-700">Patient</TableHead>
                        <TableHead className="font-bold text-gray-700">Current Provider</TableHead>
                        <TableHead className="font-bold text-gray-700 text-center">Delay</TableHead>
                        <TableHead className="font-bold text-gray-700">Triage Reason</TableHead>
                        <TableHead className="font-bold text-gray-700 text-right pr-6">Management</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {flaggedEntries.map((entry) => {
                        const appointment = entry.appointment;
                        if (!appointment) return null;

                        const patient = (appointment.patient as any)?.name || 'Unknown';
                        const doctor = (appointment.doctor as any)?.name || 'Unknown';

                        // Calculate delay
                        let delayMinutes = 0;
                        if (appointment.actual_start && appointment.scheduled_time) {
                            const start = new Date(entry.check_in_time);
                            const scheduled = new Date(appointment.scheduled_time);
                            delayMinutes = Math.floor((start.getTime() - scheduled.getTime()) / (1000 * 60));
                        } else {
                            // If not started, use current time vs scheduled
                            const now = new Date();
                            const scheduled = new Date(appointment.scheduled_time);
                            delayMinutes = Math.max(0, Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60)));
                        }

                        return (
                            <TableRow key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                                <TableCell className="font-semibold text-gray-900">{patient}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                                            {doctor.charAt(0)}
                                        </div>
                                        <span>Dr. {doctor}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                                        +{delayMinutes} min
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                                    {entry.reassignment_reason || 'Extended session delay'}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedEntry(entry)}
                                        className="bg-blue-600 hover:bg-blue-700 font-bold"
                                    >
                                        Reassign
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {selectedEntry && (
                <ReassignDialog
                    open={!!selectedEntry}
                    onOpenChange={(open) => !open && setSelectedEntry(null)}
                    appointmentId={selectedEntry.appointment_id}
                    currentDoctorId={selectedEntry.doctor_id}
                    onReassign={onReassign}
                />
            )}
        </div>
    );
}

import { CheckCircle2 } from 'lucide-react';
