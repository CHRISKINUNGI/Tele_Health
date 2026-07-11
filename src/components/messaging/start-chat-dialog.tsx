'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
    Search,
    Plus,
    UserCircle,
    MessageSquare,
    Stethoscope,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateConversation } from '@/lib/actions/messages';
import { formatKes } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

interface StartChatDialogProps {
    currentUserId: string;
    currentUserRole: string;
    onConversationCreated?: (conversationId: string) => void;
}

const UNSPECIFIED_SPECIALTY = 'General Practice';

export function StartChatDialog({
    currentUserId,
    currentUserRole,
    onConversationCreated
}: StartChatDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState<string | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const targetRole = currentUserRole === 'doctor' ? 'patient' : 'doctor';
    // Patients browse doctors by specialty; doctors browse patients as a flat list.
    const browsingDoctors = targetRole === 'doctor';

    useEffect(() => {
        if (open) {
            loadProfiles();
        } else {
            // Reset navigation state when the dialog closes
            setSelectedSpecialty(null);
            setSearch('');
        }
    }, [open, search, browsingDoctors]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', targetRole)
                .neq('id', currentUserId)
                .order('name');

            if (browsingDoctors) {
                // Load the full roster so we can group it by specialty client-side.
                query = query.limit(200);
            } else {
                // Doctor searching patients: keep the lightweight name search.
                if (search) {
                    query = query.ilike('name', `%${search}%`);
                }
                query = query.limit(5);
            }

            const { data, error } = await query;

            if (error) throw error;
            setProfiles((data as Profile[]) || []);
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            // Slight delay so the loading state is perceptible
            setTimeout(() => setLoading(false), 200);
        }
    };

    // Group doctors by specialty: [{ specialty, doctors[] }], sorted by specialty name.
    const specialties = useMemo(() => {
        const groups = new Map<string, Profile[]>();
        for (const doc of profiles) {
            const key = doc.specialization?.trim() || UNSPECIFIED_SPECIALTY;
            const existing = groups.get(key);
            if (existing) {
                existing.push(doc);
            } else {
                groups.set(key, [doc]);
            }
        }
        return Array.from(groups.entries())
            .map(([specialty, doctors]) => ({ specialty, doctors }))
            .sort((a, b) => a.specialty.localeCompare(b.specialty));
    }, [profiles]);

    const visibleSpecialties = useMemo(() => {
        if (!search) return specialties;
        const q = search.toLowerCase();
        return specialties.filter((g) => g.specialty.toLowerCase().includes(q));
    }, [specialties, search]);

    const doctorsInSpecialty = useMemo(() => {
        if (!selectedSpecialty) return [];
        return specialties.find((g) => g.specialty === selectedSpecialty)?.doctors ?? [];
    }, [specialties, selectedSpecialty]);

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

    const dialogTitle = browsingDoctors
        ? selectedSpecialty ?? 'Choose a Specialty'
        : 'New Message';

    // Doctor viewing patients: name + role, no specialty/fee.
    const renderPatientRow = (profile: Profile) => (
        <div
            key={profile.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
        >
            <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                        {profile.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                </div>
            </div>
            <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
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
    );

    const renderDoctorRow = (profile: Profile) => (
        <div
            key={profile.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
        >
            <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                        {profile.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                        {profile.specialization || UNSPECIFIED_SPECIALTY}
                        <span className="mx-1.5 text-gray-300">•</span>
                        <span className="font-medium text-emerald-600">
                            {formatKes(profile.consultation_fee)}
                        </span>
                    </p>
                </div>
            </div>
            <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
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
    );

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
                    <DialogTitle className="flex items-center gap-2">
                        {browsingDoctors && selectedSpecialty && (
                            <button
                                type="button"
                                onClick={() => setSelectedSpecialty(null)}
                                className="text-gray-400 hover:text-gray-700 transition-colors"
                                aria-label="Back to specialties"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        {dialogTitle}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Search: specialties when browsing, patients otherwise. Hidden inside a specialty. */}
                    {!(browsingDoctors && selectedSpecialty) && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={browsingDoctors ? 'Search specialties...' : 'Search patients...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    )}

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {loading ? (
                            <div className="py-8 text-center text-gray-400">Loading...</div>
                        ) : browsingDoctors ? (
                            selectedSpecialty ? (
                                // Step 2: doctors within the selected specialty
                                doctorsInSpecialty.length > 0 ? (
                                    doctorsInSpecialty.map(renderDoctorRow)
                                ) : (
                                    <div className="py-12 text-center">
                                        <UserCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No doctors in this specialty</p>
                                    </div>
                                )
                            ) : (
                                // Step 1: list of specialties
                                visibleSpecialties.length > 0 ? (
                                    visibleSpecialties.map((group) => (
                                        <button
                                            key={group.specialty}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSpecialty(group.specialty);
                                                setSearch('');
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{group.specialty}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {group.doctors.length}{' '}
                                                        {group.doctors.length === 1 ? 'doctor' : 'doctors'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <Stethoscope className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No specialties available</p>
                                    </div>
                                )
                            )
                        ) : (
                            // Doctor viewing patients: original flat list
                            profiles.length > 0 ? (
                                profiles.map(renderPatientRow)
                            ) : (
                                <div className="py-12 text-center">
                                    <UserCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No patients found</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
