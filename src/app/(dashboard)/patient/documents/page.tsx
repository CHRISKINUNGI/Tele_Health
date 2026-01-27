import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DocumentList } from '@/components/shared/document-list';
import { FileUploader } from '@/components/shared/file-uploader';

export default async function PatientDocumentsPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'patient') redirect('/login');

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Medical Documents</h1>
                <p className="text-gray-600">Securely manage and view your healthcare records, lab results, and imaging.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Upload New Document</h2>
                            <FileUploader
                                patientId={user.id}
                                uploadedBy={user.id}
                            />
                        </section>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
                            <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
                                <li>Ensure files are clearly named (e.g., "LabResults_Jan2026")</li>
                                <li>Supported formats: PDF, JPG, PNG</li>
                                <li>Maximum file size: 10MB per document</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <section>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Document History</h2>
                        <DocumentList patientId={user.id} />
                    </section>
                </div>
            </div>
        </div>
    );
}
