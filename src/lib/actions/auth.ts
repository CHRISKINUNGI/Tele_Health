'use server';

import { createAdminClient } from '../supabase/admin';

/**
 * Register a new patient without triggering Supabase's confirmation email.
 *
 * Public sign-up: always creates a PATIENT (role is never taken from input).
 * Uses the admin client with email_confirm=true so no email is sent — this
 * avoids the built-in SMTP rate limit and lets the user sign in immediately.
 */
export async function registerPatient(data: {
    name: string;
    email: string;
    password: string;
}): Promise<{ success: true }> {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (name.length < 2) throw new Error('Please enter your full name');
    if (data.password.length < 6) throw new Error('Password must be at least 6 characters');

    const admin = createAdminClient();

    const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name },
    });

    if (error) {
        const message = error.message || '';
        if ((error as any).code === 'email_exists' || /already|registered|exists/i.test(message)) {
            throw new Error('An account with this email already exists. Please sign in.');
        }
        console.error('Error registering patient:', error);
        throw new Error('Could not create account. Please try again.');
    }

    // The profile trigger creates the row from metadata; upsert defensively to
    // guarantee the correct role and name even if the trigger is absent.
    if (created?.user) {
        const { error: profileError } = await admin
            .from('profiles')
            .upsert({ id: created.user.id, role: 'patient', name });
        if (profileError) {
            console.error('Error setting up patient profile:', profileError);
        }
    }

    return { success: true };
}
