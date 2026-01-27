import { createClient } from '@supabase/supabase-js'

/**
 * Administrative Supabase client using service_role key.
 * This client bypasses RLS and can manage Auth users.
 * ONLY use this in Server Actions or API routes.
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
