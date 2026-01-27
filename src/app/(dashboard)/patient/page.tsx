import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PatientDashboard } from './patient-dashboard';
import { DashboardLayout } from '@/components/shared/dashboard-layout';

export default async function PatientPage() {
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

    if (!profile || profile.role !== 'patient') {
        redirect('/login');
    }

    return (
        <PatientDashboard patientId={user.id} patientName={profile.name} />
    );
}
