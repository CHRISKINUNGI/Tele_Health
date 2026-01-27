'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, UserCircle, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateConversation } from '@/lib/actions/messages';
import { useRouter } from 'next/navigation';

interface StartChatDialogProps {
    currentUserId: string;
    currentUserRole: string;
    onConversationCreated?: (conversationId: string) => void;
}

export function StartChatDialog({
    currentUserId,
    currentUserRole,
    onConversationCreated
}: StartChatDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const targetRole = currentUserRole === 'doctor' ? 'patient' : 'doctor';

    useEffect(() => {
        if (open) {
            loadProfiles();
        }
    }, [open, search]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', targetRole)
                .neq('id', currentUserId)
                .order('name');

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            const { data, error } = await query.limit(5);

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(true);
            // Simulate minor delay for UI feel
            setTimeout(() => setLoading(false), 200);
        }
    };

    const handleStartChat = async (targetId: string) => {
        setCreating(targetId);
        try {
            const patientId = currentUserRole === 'patient' ? currentUserId : targetId;
            const doctorId = currentUserRole === 'doctor' ? currentUserId : targetId;

            const conversation = await getOrCreateConversation(
                patientId,
                doctorId
            );

            setOpen(false);
            if (onConversationCreated) {
                onConversationCreated(conversation.id);
            } else {
                router.push(`/messages?conversation=${conversation.id}`);
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setCreating(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    New Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={`Search ${targetRole}s...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {loading ? (
                            <div className="py-8 text-center text-gray-400">Loading...</div>
                        ) : profiles.length > 0 ? (
                            profiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                                                {profile.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900">{profile.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleStartChat(profile.id)}
                                        disabled={creating === profile.id}
                                    >
                                        {creating === profile.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                        ) : (
                                            <MessageSquare className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <UserCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No {targetRole}s found</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
