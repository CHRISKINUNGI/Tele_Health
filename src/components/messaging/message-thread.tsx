'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import type { Message, Conversation } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
    conversation: Conversation;
    messages: Message[];
    currentUserId: string;
    onSendMessage: (content: string) => Promise<void>;
}

export function MessageThread({
    conversation,
    messages,
    currentUserId,
    onSendMessage,
}: MessageThreadProps) {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await onSendMessage(newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const otherParticipant = conversation.patient_id === currentUserId
        ? conversation.doctor
        : conversation.patient;

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                        {otherParticipant?.name?.charAt(0) || '?'}
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{otherParticipant?.name || 'Unknown'}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {otherParticipant?.role === 'doctor'
                                ? `${(otherParticipant as any).specialization || 'General Practice'}`
                                : 'Patient'
                            }
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender_id === currentUserId;

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex',
                                    isOwn ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        'max-w-[70%] rounded-lg px-4 py-2',
                                        isOwn
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-xs mt-1',
                                            isOwn ? 'text-blue-100' : 'text-gray-500'
                                        )}
                                    >
                                        {formatTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
                <div className="flex gap-2">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="resize-none"
                        rows={2}
                        disabled={sending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </Card>
    );
}
