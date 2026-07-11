'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Receipt, Loader2, Download } from 'lucide-react';
import { getAllInvoices, setInvoiceStatus } from '@/lib/actions/invoices';
import { formatKes } from '@/lib/utils/currency';
import { downloadInvoice } from '@/lib/utils/invoice-document';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Invoice } from '@/lib/types';

export function AdminInvoicesPanel() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await getAllInvoices();
            setInvoices((data as Invoice[]) || []);
        } catch (error) {
            console.error('Error loading invoices:', error);
            toast.error('Could not load invoices');
        } finally {
            setLoading(false);
        }
    }, []);

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

    const totalBilled = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalOutstanding = invoices
        .filter((i) => i.status === 'unpaid')
        .reduce((sum, i) => sum + Number(i.amount), 0);

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="py-20 text-center">
                <Receipt className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
                <p className="text-sm text-gray-500">Invoices issued by doctors will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard label="Total invoices" value={String(invoices.length)} />
                <SummaryCard label="Total billed" value={formatKes(totalBilled)} />
                <SummaryCard label="Outstanding" value={formatKes(totalOutstanding)} accent />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.patient?.name || '—'}</TableCell>
                                <TableCell>{invoice.doctor?.name || '—'}</TableCell>
                                <TableCell className="text-gray-500">{invoice.description || 'Consultation'}</TableCell>
                                <TableCell className="text-gray-500 whitespace-nowrap">
                                    {format(new Date(invoice.created_at), 'PP')}
                                </TableCell>
                                <TableCell className="text-right font-semibold whitespace-nowrap">
                                    {formatKes(invoice.amount)}
                                </TableCell>
                                <TableCell>
                                    {invoice.status === 'paid' ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                                            Paid
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                                            Unpaid
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1.5"
                                            onClick={() => downloadInvoice(invoice)}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleStatus(invoice)}
                                            disabled={updating === invoice.id}
                                        >
                                            {updating === invoice.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : invoice.status === 'paid' ? (
                                                'Mark unpaid'
                                            ) : (
                                                'Mark paid'
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className={`rounded-xl border p-5 ${accent ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-white'}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`text-2xl font-black mt-1 ${accent ? 'text-amber-900' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}
