import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DoctorInvoicesClient } from '@/components/provider/invoices-client';

export default async function ProviderBillingPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, consultation_fee')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'doctor') redirect('/login');

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
                <p className="text-gray-600">Issue invoices to patients and track their payment status.</p>
            </div>

            <DoctorInvoicesClient doctorId={user.id} defaultAmount={profile.consultation_fee} />
        </div>
    );
}
