import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PatientInvoicesClient } from '@/components/patient/invoices-client';

export default async function PatientBillingPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'patient') redirect('/login');

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
                <p className="text-gray-600">View your invoices and payment status.</p>
            </div>

            <PatientInvoicesClient patientId={user.id} />
        </div>
    );
}
