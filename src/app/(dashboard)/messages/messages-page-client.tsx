'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from '@/components/messaging/conversation-list';
import { MessageThread } from '@/components/messaging/message-thread';
import { StartChatDialog } from '@/components/messaging/start-chat-dialog';
import {
    getUserConversations,
    getConversationMessages,
    sendMessage,
    markMessagesAsRead
} from '@/lib/actions/messages';
import { createClient } from '@/lib/supabase/client';
import type { Conversation, Message } from '@/lib/types';

interface MessagesPageClientProps {
    userId: string;
    userRole: string;
}

export function MessagesPageClient({ userId, userRole }: MessagesPageClientProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadConversations();

        // Subscribe to real-time conversation updates
        const conversationsChannel = supabase
            .channel(`conversations_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `patient_id=eq.${userId},doctor_id=eq.${userId}`,
                },
                () => {
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(conversationsChannel);
        };
    }, [userId]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            markMessagesAsRead(selectedConversation.id, userId);

            // Subscribe to real-time message updates
            const messagesChannel = supabase
                .channel(`messages_${selectedConversation.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${selectedConversation.id}`,
                    },
                    (payload) => {
                        setMessages((prev) => [...prev, payload.new as Message]);
                        markMessagesAsRead(selectedConversation.id, userId);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(messagesChannel);
            };
        }
    }, [selectedConversation?.id]);

    const loadConversations = async () => {
        try {
            const data = await getUserConversations(userId);
            setConversations(data);

            // Auto-select first conversation if none selected
            if (!selectedConversation && data.length > 0) {
                setSelectedConversation(data[0]);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const data = await getConversationMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSelectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedConversation) return;

        const recipientId = selectedConversation.patient_id === userId
            ? selectedConversation.doctor_id
            : selectedConversation.patient_id;

        await sendMessage(
            selectedConversation.id,
            userId,
            recipientId,
            content
        );

        // Refresh conversations to update last_message_at
        await loadConversations();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                        <p className="text-gray-600 mt-2">
                            Secure communication with your {userRole === 'patient' ? 'healthcare providers' : 'patients'}
                        </p>
                    </div>
                    <StartChatDialog
                        currentUserId={userId}
                        currentUserRole={userRole}
                        onConversationCreated={(id) => {
                            loadConversations();
                            // Optional: navigate to specific conversation
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                    {/* Conversation List - 1 column */}
                    <div className="lg:col-span-1 overflow-hidden">
                        <ConversationList
                            conversations={conversations}
                            selectedConversationId={selectedConversation?.id}
                            onSelectConversation={handleSelectConversation}
                            currentUserId={userId}
                        />
                    </div>

                    {/* Message Thread - 2 columns */}
                    <div className="lg:col-span-2">
                        {selectedConversation ? (
                            <MessageThread
                                conversation={selectedConversation}
                                messages={messages}
                                currentUserId={userId}
                                onSendMessage={handleSendMessage}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-white rounded-lg border">
                                <p className="text-muted-foreground">Select a conversation to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
