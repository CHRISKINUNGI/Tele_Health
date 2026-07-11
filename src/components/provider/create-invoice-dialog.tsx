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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createInvoice } from '@/lib/actions/invoices';
import { toast } from 'sonner';

interface CreateInvoiceDialogProps {
    doctorId: string;
    /** Doctor's default consultation fee, used to pre-fill the amount. */
    defaultAmount?: number | null;
    onInvoiceCreated?: () => void;
}

export function CreateInvoiceDialog({
    doctorId,
    defaultAmount,
    onInvoiceCreated,
}: CreateInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
    const supabase = createClient();

    const [patientId, setPatientId] = useState('');
    const [amount, setAmount] = useState(defaultAmount != null ? String(defaultAmount) : '');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (open) {
            loadPatients();
            // Reset the amount to the doctor's default each time the dialog opens
            setAmount(defaultAmount != null ? String(defaultAmount) : '');
        }
    }, [open]);

    const loadPatients = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('role', 'patient')
            .order('name');
        if (error) {
            console.error('Error loading patients:', error);
            toast.error('Could not load patient list');
            return;
        }
        setPatients(data || []);
    };

    const handleSubmit = async () => {
        if (!patientId) {
            toast.error('Please select a patient');
            return;
        }
        const numericAmount = Number(amount);
        if (amount.trim() === '' || !Number.isFinite(numericAmount) || numericAmount < 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            await createInvoice({
                patientId,
                doctorId,
                amount: numericAmount,
                description,
            });
            toast.success('Invoice created');
            setOpen(false);
            setPatientId('');
            setDescription('');
            onInvoiceCreated?.();
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="h-4 w-4" />
                    New Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        Create Invoice
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="invoice-patient">Patient</Label>
                        <Select value={patientId} onValueChange={setPatientId}>
                            <SelectTrigger id="invoice-patient" className="w-full">
                                <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.length > 0 ? (
                                    patients.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No patients found
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invoice-amount">Amount (Ksh)</Label>
                        <Input
                            id="invoice-amount"
                            type="number"
                            min={0}
                            step={100}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 2500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invoice-description">Description (optional)</Label>
                        <Textarea
                            id="invoice-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Consultation on 11 Jul 2026"
                            rows={2}
                        />
                    </div>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Invoice
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
