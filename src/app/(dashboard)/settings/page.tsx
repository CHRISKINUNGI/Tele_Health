'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { User, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        };
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Account Settings</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Manage your clinical profile credentials and security preferences.
                    </p>
                </div>
                <div className="bg-white border rounded-2xl px-6 py-4 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Authenticated As</p>
                    <p className="text-lg font-black text-gray-900 leading-none">{profile?.name}</p>
                    <p className="text-xs text-blue-600 font-bold uppercase mt-1 tracking-tighter">{profile?.role}</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-white border p-1 rounded-xl shadow-sm inline-flex">
                    <TabsTrigger value="profile" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <User className="h-4 w-4" />
                        Clinical Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Shield className="h-4 w-4" />
                        Credentials & Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="outline-none">
                    <ProfileSettings initialData={profile} />
                </TabsContent>

                <TabsContent value="security" className="outline-none">
                    <SecuritySettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
