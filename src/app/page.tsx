import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('Home Page - No session, redirecting to login');
    redirect('/login');
  }

  // Get user profile to determine role
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // HEALING LOGIC: If profile is missing, try to create a default one
  if (profileError && profileError.code === 'PGRST116') {
    console.warn(`Home Page - Profile missing for user ${user.id}. Attempting recovery...`);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSupabase = createAdminClient();

        console.log('Home Page - Provisioning default profile via Admin Client...');
        const { data: newProfile, error: upsertError } = await adminSupabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: user.email?.split('@')[0] || 'New User',
            role: 'patient'
          })
          .select('role')
          .single();

        if (!upsertError && newProfile) {
          console.log('Home Page - Recovery successful.');
          profile = newProfile;
          profileError = null;
        } else {
          console.error('Home Page - Recovery failed during upsert:', upsertError);
        }
      } catch (e) {
        console.error('Home Page - Recovery failed during admin client init:', e);
      }
    } else {
      console.error('Home Page - Recovery skipped: SUPABASE_SERVICE_ROLE_KEY is not defined in environment.');
    }
  }

  if (profileError) {
    console.error('Home Page - Profile Query Error (Final):', JSON.stringify(profileError, null, 2));
    console.error(`Error Details: ${profileError.message} (${profileError.code})`);
    redirect('/login');
  }

  console.log(`Home Page - User ${user.id} has role: ${profile?.role}`);

  // Redirect based on role
  if (profile?.role === 'doctor') {
    redirect('/provider');
  } else if (profile?.role === 'admin') {
    redirect('/admin');
  } else if (profile?.role === 'patient') {
    redirect('/patient');
  }

  console.log('Home Page - Role unknown, redirecting to login');
  redirect('/login');
}
