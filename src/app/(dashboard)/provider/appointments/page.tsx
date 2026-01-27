import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProviderAppointmentsClient } from '@/components/provider/appointments-client';

export default async function ProviderAppointmentsPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'doctor') redirect('/login');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Manage Appointments</h1>
                <p className="text-gray-600">Track your daily schedule and manage patient encounters.</p>
            </div>

            <ProviderAppointmentsClient doctorId={user.id} />
        </div>
    );
}
