'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import type { Conversation, Message } from '../types';

/**
 * Get or create a conversation between patient and doctor
 */
export async function getOrCreateConversation(
    patientId: string,
    doctorId: string,
    appointmentId?: string
) {
    const supabase = await createClient();

    // Try to find existing conversation
    let { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .maybeSingle();

    if (existing) {
        return existing;
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_id: appointmentId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        throw new Error('Failed to create conversation');
    }

    return conversation;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('conversations')
        .select(`
      *,
      patient:profiles!conversations_patient_id_fkey(id, name, role),
      doctor:profiles!conversations_doctor_id_fkey(id, name, role, specialization)
    `)
        .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error('Failed to fetch conversations');
    }

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('recipient_id', userId)
                .eq('read', false);

            return {
                ...conv,
                unread_count: count || 0,
            };
        })
    );

    return conversationsWithUnread as Conversation[];
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, name, role)
    `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        throw new Error('Failed to fetch messages');
    }

    return data as Message[];
}

/**
 * Send a message
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            recipient_id: recipientId,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message');
    }

    revalidatePath('/messages');

    return data;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string, userId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Error marking messages as read:', error);
        throw new Error('Failed to mark messages as read');
    }

    revalidatePath('/messages');
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string) {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
}
