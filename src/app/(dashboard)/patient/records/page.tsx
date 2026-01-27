import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClinicalRecordsClient } from '@/components/patient/clinical-records-client';

export default async function PatientRecordsPage() {
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
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Medical Clinical Records</h1>
                <p className="text-gray-600">Access your historical clinical visit notes and shared medical documents.</p>
            </div>

            <ClinicalRecordsClient patientId={user.id} />
        </div>
    );
}
