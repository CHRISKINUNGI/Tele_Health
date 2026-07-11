'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Loader2, CheckCircle2, RotateCcw, Download } from 'lucide-react';
import { getDoctorInvoices, setInvoiceStatus } from '@/lib/actions/invoices';
import { formatKes } from '@/lib/utils/currency';
import { downloadInvoice } from '@/lib/utils/invoice-document';
import { CreateInvoiceDialog } from './create-invoice-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Invoice } from '@/lib/types';

interface DoctorInvoicesClientProps {
    doctorId: string;
    defaultAmount?: number | null;
}

export function DoctorInvoicesClient({ doctorId, defaultAmount }: DoctorInvoicesClientProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await getDoctorInvoices(doctorId);
            setInvoices((data as Invoice[]) || []);
        } catch (error) {
            console.error('Error loading invoices:', error);
            toast.error('Could not load invoices');
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleStatus = async (invoice: Invoice) => {
        const next = invoice.status === 'paid' ? 'unpaid' : 'paid';
        setUpdating(invoice.id);
        try {
            await setInvoiceStatus(invoice.id, next);
            setInvoices((prev) =>
                prev.map((i) => (i.id === invoice.id ? { ...i, status: next } : i))
            );
            toast.success(next === 'paid' ? 'Marked as paid' : 'Marked as unpaid');
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast.error('Failed to update invoice');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <CreateInvoiceDialog
                    doctorId={doctorId}
                    defaultAmount={defaultAmount}
                    onInvoiceCreated={load}
                />
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
            ) : invoices.length > 0 ? (
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <Card key={invoice.id} className="border-gray-200">
                            <CardContent className="p-5 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {invoice.patient?.name || 'Patient'}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {invoice.description || 'Consultation'}
                                        <span className="mx-1.5 text-gray-300">•</span>
                                        {format(new Date(invoice.created_at), 'PP')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="font-bold text-gray-900">
                                        {formatKes(invoice.amount)}
                                    </span>
                                    <StatusBadge status={invoice.status} />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                        onClick={() => downloadInvoice(invoice)}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                        onClick={() => toggleStatus(invoice)}
                                        disabled={updating === invoice.id}
                                    >
                                        {updating === invoice.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : invoice.status === 'paid' ? (
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        ) : (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        )}
                                        {invoice.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <Receipt className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
                    <p className="text-sm text-gray-500">Create an invoice to bill a patient.</p>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: 'paid' | 'unpaid' }) {
    return status === 'paid' ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
            Paid
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
            Unpaid
        </span>
    );
}
