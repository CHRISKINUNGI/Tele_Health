'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, Loader2 } from 'lucide-react';
import { getPatientInvoices } from '@/lib/actions/invoices';
import { formatKes } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Invoice } from '@/lib/types';

interface PatientInvoicesClientProps {
    patientId: string;
}

export function PatientInvoicesClient({ patientId }: PatientInvoicesClientProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await getPatientInvoices(patientId);
                setInvoices((data as Invoice[]) || []);
            } catch (error) {
                console.error('Error loading invoices:', error);
                toast.error('Could not load your invoices');
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId]);

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
                <h3 className="text-lg font-medium text-gray-900">No invoices</h3>
                <p className="text-sm text-gray-500">You don&apos;t have any bills yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {totalOutstanding > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-5 flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-800">Outstanding balance</span>
                        <span className="text-lg font-bold text-amber-900">
                            {formatKes(totalOutstanding)}
                        </span>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {invoices.map((invoice) => (
                    <Card key={invoice.id} className="border-gray-200">
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {invoice.description || 'Consultation'}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    Dr. {invoice.doctor?.name || 'Provider'}
                                    {invoice.doctor?.specialization && (
                                        <>
                                            <span className="mx-1.5 text-gray-300">•</span>
                                            {invoice.doctor.specialization}
                                        </>
                                    )}
                                    <span className="mx-1.5 text-gray-300">•</span>
                                    {format(new Date(invoice.created_at), 'PP')}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="font-bold text-gray-900">{formatKes(invoice.amount)}</span>
                                {invoice.status === 'paid' ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                                        Paid
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                                        Unpaid
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
