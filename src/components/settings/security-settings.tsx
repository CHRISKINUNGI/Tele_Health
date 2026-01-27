'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, KeyRound } from 'lucide-react';
import { updateUserPassword } from '@/lib/actions/user';
import { toast } from 'sonner';

export function SecuritySettings() {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            await updateUserPassword(password);
            toast.success('Password updated successfully');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Security Credentials
                </CardTitle>
                <CardDescription>
                    Update your account password to maintain system security.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Min 8 characters"
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-type new password"
                            className="bg-white"
                        />
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900 mb-1 leading-none pt-1">Security Standards</p>
                            <p className="text-xs text-blue-700 leading-normal">
                                Ensure your password contains uppercase letters, numbers, and symbols for maximum protection.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gray-900 hover:bg-black text-white font-bold gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="h-4 w-4" />
                            )}
                            Update Password
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
