import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScheduleClient } from '@/components/provider/schedule-client';

export default async function ProviderSchedulePage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, availability')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'doctor') redirect('/login');

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
                <p className="text-gray-600">Your working hours and upcoming appointments.</p>
            </div>

            <ScheduleClient doctorId={user.id} availability={profile.availability} />
        </div>
    );
}
