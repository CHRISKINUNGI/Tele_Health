import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PatientAppointmentsClient } from '@/components/patient/appointments-client';

export default async function PatientAppointmentsPage() {
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

    if (!profile || profile.role !== 'patient') redirect('/login');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
                <p className="text-gray-600">View and manage your scheduled healthcare visits.</p>
            </div>

            <PatientAppointmentsClient patientId={user.id} />
        </div>
    );
}
