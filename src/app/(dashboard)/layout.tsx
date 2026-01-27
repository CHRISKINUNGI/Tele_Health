import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/shared/dashboard-layout';

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    const userRole = profile.role as 'doctor' | 'patient' | 'admin';
    const userDetails = profile.role === 'doctor'
        ? (profile.specialization || 'General Practice')
        : profile.role === 'admin'
            ? 'Administrator'
            : 'Patient';

    return (
        <DashboardLayout
            userRole={userRole}
            userId={user.id}
            userName={profile.name}
            userDetails={userDetails}
        >
            {children}
        </DashboardLayout>
    );
}
