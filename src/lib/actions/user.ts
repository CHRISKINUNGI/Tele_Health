'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Update the user's profile information
 */
export async function updateUserProfile(userData: {
    name: string;
    specialization?: string;
    consultationFee?: number | null;
}) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('profiles')
        .update({
            name: userData.name,
            specialization: userData.specialization,
            consultation_fee: userData.consultationFee ?? null
        })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating user profile:', error);
        throw new Error('Failed to update profile');
    }

    revalidatePath('/settings');
    return { success: true };
}

/**
 * Update the user's password
 */
export async function updateUserPassword(password: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        console.error('Error updating password:', error);
        throw new Error(error.message || 'Failed to update password');
    }

    return { success: true };
}
