'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DocumentList } from '@/components/shared/document-list';
import { FileText, Calendar, User, Activity } from 'lucide-react';
import type { ClinicalNote } from '@/lib/types';

interface ClinicalRecordsClientProps {
    patientId: string;
}

export function ClinicalRecordsClient({ patientId }: ClinicalRecordsClientProps) {
    const [notes, setNotes] = useState<ClinicalNote[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadNotes();
    }, [patientId]);

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('clinical_notes')
                .select(`
                    *,
                    doctor:profiles!clinical_notes_doctor_id_fkey(*)
                `)
                .eq('patient_id', patientId)
                .eq('is_finalized', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error loading clinical notes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-lg"></div>)}
    </div>;

    return (
        <div className="space-y-8">
            <Tabs defaultValue="notes" className="w-full">
                <TabsList className="bg-gray-100/50 p-1">
                    <TabsTrigger value="notes">Clinical Visit Notes</TabsTrigger>
                    <TabsTrigger value="docs">Document Vault</TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="mt-6 space-y-6">
                    {notes.length > 0 ? (
                        notes.map((note) => (
                            <Card key={note.id} className="overflow-hidden border-2 border-gray-100 hover:border-blue-100 transition-colors">
                                <CardHeader className="bg-white border-b px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">
                                                    Visit with Dr. {note.doctor?.name || 'Assigned Physician'}
                                                </CardTitle>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(note.created_at).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                            Finalized Report
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subjective Observations</h4>
                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {note.subjective || 'No subjective observations recorded.'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Clinical Assessment</h4>
                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {note.assessment || 'No assessment recorded.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 border-l pl-8 border-gray-100">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended Plan</h4>
                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {note.plan || 'No plan recorded.'}
                                                </p>
                                            </div>
                                            {note.vital_signs && (
                                                <div className="pt-4 mt-4 border-t border-gray-50">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Activity className="h-3.5 w-3.5" />
                                                        Vital Signs
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {note.vital_signs.blood_pressure && (
                                                            <div className="bg-gray-50 p-2 rounded text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold">BP</p>
                                                                <p className="text-sm font-semibold">{note.vital_signs.blood_pressure}</p>
                                                            </div>
                                                        )}
                                                        {note.vital_signs.heart_rate && (
                                                            <div className="bg-gray-50 p-2 rounded text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold">HR</p>
                                                                <p className="text-sm font-semibold">{note.vital_signs.heart_rate} bpm</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-white border border-dashed rounded-xl">
                            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mx-auto mb-4">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No clinical notes available</h3>
                            <p className="text-sm text-gray-500 mt-1">Finalized notes from your healthcare visits will appear here.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="docs" className="mt-6">
                    <DocumentList patientId={patientId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
