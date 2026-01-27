'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Download,
    Trash2,
    ExternalLink,
    FileIcon,
    ImageIcon,
    Search
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { MedicalDocument } from '@/lib/types';

interface DocumentListProps {
    patientId: string;
}

export function DocumentList({ patientId }: DocumentListProps) {
    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadDocuments();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`documents_${patientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'medical_documents',
                    filter: `patient_id=eq.${patientId}`,
                },
                () => {
                    loadDocuments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [patientId]);

    const loadDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('medical_documents')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (document: MedicalDocument) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            // 1. Delete from Storage (if you have the path)
            const path = document.file_url.split('/medical-documents/').pop();
            if (path) {
                await supabase.storage
                    .from('medical-documents')
                    .remove([path]);
            }

            // 2. Delete from DB
            const { error } = await supabase
                .from('medical_documents')
                .delete()
                .eq('id', document.id);

            if (error) throw error;

            toast.success("Document deleted");
            loadDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error("Failed to delete document");
        }
    };

    const getFileIcon = (type: string) => {
        if (['jpg', 'jpeg', 'png'].includes(type.toLowerCase())) {
            return <ImageIcon className="h-5 w-5 text-purple-500" />;
        }
        return <FileText className="h-5 w-5 text-blue-500" />;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>)}
        </div>;
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-4">
                    <Search className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                <p className="text-sm text-gray-500 mt-1">Upload files to see them here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {documents.map((doc) => (
                <Card key={doc.id} className="hover:border-blue-200 transition-colors shadow-none border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="h-12 w-12 rounded bg-gray-50 flex items-center justify-center">
                                {getFileIcon(doc.file_type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{doc.file_name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">{formatSize(doc.file_size_bytes || 0)}</span>
                                    <span className="text-gray-300 text-xs">•</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 capitalize border-gray-100 text-gray-600">
                                        {doc.category}
                                    </Badge>
                                    <span className="text-gray-300 text-xs">•</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(doc)}
                                    className="text-gray-500 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
