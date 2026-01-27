import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessagesPageClient } from './messages-page-client';

export default async function MessagesPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    return <MessagesPageClient userId={user.id} userRole={profile.role} />;
}
