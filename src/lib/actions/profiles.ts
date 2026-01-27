'use server';

import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Get all profiles for user management
 */
export async function getAllProfiles() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching all profiles:', error);
        throw new Error('Failed to fetch user profiles');
    }

    return data;
}

/**
 * Update user profile (Admin function)
 */
export async function adminUpdateProfile(userId: string, updates: any) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile as admin:', error);
        throw new Error('Failed to update profile');
    }

    return data;
}

/**
 * Create a new system user (Admin function)
 */
export async function createSystemUser(userData: {
    name: string;
    email: string;
    role: 'doctor' | 'patient' | 'admin';
    specialization?: string;
}) {
    const adminSupabase = createAdminClient();

    // 1. Create the Auth user
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
        email: userData.email,
        password: 'ChangeMe123!', // Temporary password
        email_confirm: true,
        user_metadata: { name: userData.name }
    });

    if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Failed to create authentication account: ${authError.message}`);
    }

    // 2. Create or Update the Profile record
    // We use upsert to ensure the row exists even if a trigger hasn't fired yet
    // or if the trigger is missing.
    const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert({
            id: authUser.user.id,
            name: userData.name,
            role: userData.role,
            specialization: userData.specialization || null
        });

    if (profileError) {
        console.error('Error creating/updating profile for new user:', profileError);
        // We throw here for admin creation because we need the profile to be correct
        throw new Error(`User created but profile setup failed: ${profileError.message}`);
    }

    revalidatePath('/admin');
    return authUser.user;
}
