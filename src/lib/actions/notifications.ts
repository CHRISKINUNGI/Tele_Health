'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import type { Notification } from '../types';

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
    }

    return data as Notification[];
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string) {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
    }

    revalidatePath('/');
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
    }

    revalidatePath('/');
}

/**
 * Create a notification (typically called by triggers, but can be manual)
 */
export async function createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
}) {
    const supabase = await createClient();

    const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
            user_id: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
    }

    revalidatePath('/');

    return notification;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
    }

    revalidatePath('/');
}
