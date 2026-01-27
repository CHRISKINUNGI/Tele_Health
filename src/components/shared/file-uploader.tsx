'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface FileUploaderProps {
    patientId: string;
    uploadedBy: string;
    appointmentId?: string;
    onUploadComplete?: (documentId: string) => void;
}

export function FileUploader({
    patientId,
    uploadedBy,
    appointmentId,
    onUploadComplete
}: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${patientId}/${fileName}`;

            const { data: storageData, error: storageError } = await supabase.storage
                .from('medical-documents')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (storageError) throw storageError;

            // 2. Get Public URL or signed URL
            const { data: { publicUrl } } = supabase.storage
                .from('medical-documents')
                .getPublicUrl(filePath);

            // 3. Create database record via server action (simulated here for brevity)
            const { data: docData, error: docError } = await supabase
                .from('medical_documents')
                .insert({
                    patient_id: patientId,
                    uploaded_by: uploadedBy,
                    appointment_id: appointmentId,
                    file_name: file.name,
                    file_type: fileExt,
                    file_url: publicUrl,
                    file_size_bytes: file.size,
                    mime_type: file.type,
                    category: 'other' // Default category
                })
                .select()
                .single();

            if (docError) throw docError;

            toast.success("File uploaded successfully");
            setFile(null);
            if (onUploadComplete) onUploadComplete(docData.id);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error("Upload failed", {
                description: error.message || "An unexpected error occurred."
            });
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
            <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    {!file ? (
                        <>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                                <Upload className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Upload medical document</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-6">
                                Drag and drop your file here, or click to browse.<br />
                                PDF, JPEG, PNG up to 10MB.
                            </p>
                            <label className="cursor-pointer">
                                <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Select File
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                            </label>
                        </>
                    ) : (
                        <div className="w-full">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 mb-4">
                                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                    <File className="h-5 w-5" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                {!uploading && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setFile(null)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {uploading ? (
                                <div className="space-y-2">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-xs text-gray-500">Uploading... {progress}%</p>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleUpload}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        Start Upload
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setFile(null)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
