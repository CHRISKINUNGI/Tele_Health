'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import type { Conversation } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversationId?: string;
    onSelectConversation: (conversation: Conversation) => void;
    currentUserId: string;
}

export function ConversationList({
    conversations,
    selectedConversationId,
    onSelectConversation,
    currentUserId,
}: ConversationListProps) {
    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.patient_id === currentUserId
            ? conversation.doctor
            : conversation.patient;
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (conversations.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">No conversations yet</p>
                    <p className="text-sm mt-2">Start a conversation from an appointment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = conversation.id === selectedConversationId;
                const hasUnread = (conversation.unread_count || 0) > 0;

                return (
                    <Card
                        key={conversation.id}
                        className={cn(
                            'cursor-pointer transition-all hover:bg-gray-50 border-l-4 mb-2',
                            isSelected ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent',
                            hasUnread && !isSelected && 'bg-blue-50/50'
                        )}
                        onClick={() => onSelectConversation(conversation)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12 bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                    {otherParticipant?.name?.charAt(0) || '?'}
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={cn(
                                            'font-semibold truncate',
                                            hasUnread && 'text-blue-700'
                                        )}>
                                            {otherParticipant?.name || 'Unknown'}
                                        </h3>
                                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                            {formatTime(conversation.last_message_at)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {otherParticipant?.role === 'doctor'
                                            ? `Dr. ${otherParticipant.name} • ${(otherParticipant as any).specialization || 'General Practice'}`
                                            : 'Patient'
                                        }
                                    </p>

                                    {hasUnread && (
                                        <Badge className="mt-2 bg-blue-500 text-white">
                                            {conversation.unread_count} new
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
