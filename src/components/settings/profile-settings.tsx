'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Loader2, Save, GraduationCap } from 'lucide-react';
import { updateUserProfile } from '@/lib/actions/user';
import { toast } from 'sonner';

interface ProfileSettingsProps {
    initialData: {
        name: string;
        role: string;
        specialization?: string;
    };
}

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(initialData.name);
    const [specialization, setSpecialization] = useState(initialData.specialization || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateUserProfile({
                name,
                specialization: initialData.role === 'doctor' ? specialization : undefined
            });
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                </CardTitle>
                <CardDescription>
                    Update your public display name and professional credentials.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter your full name"
                            className="bg-white"
                        />
                    </div>

                    {initialData.role === 'doctor' && (
                        <div className="space-y-2">
                            <Label htmlFor="spec">Medical Specialization</Label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="spec"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="e.g. Pediatrics, Cardiology"
                                    className="pl-9 bg-white"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 font-bold gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
