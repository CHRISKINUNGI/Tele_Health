'use client';

import { useState } from 'react';
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
    SelectValue
} from '@/components/ui/select';
import { UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { createSystemUser } from '@/lib/actions/profiles';
import { toast } from 'sonner';

export function CreateUserDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'doctor' | 'patient' | 'admin'>('patient');
    const [specialization, setSpecialization] = useState('');
    const [consultationFee, setConsultationFee] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createSystemUser({
                name,
                email,
                role,
                specialization: role === 'doctor' ? specialization : undefined,
                consultationFee: role === 'doctor' && consultationFee.trim() !== '' ? Number(consultationFee) : null
            });

            toast.success('User created successfully. A temporary password (ChangeMe123!) has been set.');
            setOpen(false);
            resetForm();
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setRole('patient');
        setSpecialization('');
        setConsultationFee('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
                    <UserPlus className="h-4 w-4" />
                    Provision User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        Administrative Provisioning
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-gray-50/50"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@telehealth.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-50/50"
                        />
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label>Access Role</Label>
                        <Select value={role} onValueChange={(val: any) => setRole(val)}>
                            <SelectTrigger className="bg-gray-50/50">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="patient">Patient (Standard Access)</SelectItem>
                                <SelectItem value="doctor">Doctor (Clinical Access)</SelectItem>
                                <SelectItem value="admin">Administrator (System Access)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Specialization (only if doctor) */}
                    {role === 'doctor' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="spec">Medical Specialization</Label>
                            <Input
                                id="spec"
                                placeholder="e.g. Cardiology, General Medicine"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                required
                                className="bg-gray-50/50"
                            />
                            <Label htmlFor="fee">Consultation Fee (Ksh)</Label>
                            <Input
                                id="fee"
                                type="number"
                                min={0}
                                step={100}
                                placeholder="e.g. 2500 (optional)"
                                value={consultationFee}
                                onChange={(e) => setConsultationFee(e.target.value)}
                                className="bg-gray-50/50"
                            />
                        </div>
                    )}

                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                        <p className="text-[10px] text-amber-800 font-medium">
                            <strong className="block mb-0.5 uppercase tracking-wider text-[8px]">Security Note:</strong>
                            New accounts are created with the temporary password <code>ChangeMe123!</code>. Users will be able to change this upon login.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Provisioning...
                            </>
                        ) : (
                            'Complete Provisioning'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
