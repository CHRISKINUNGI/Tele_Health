import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DocumentList } from '@/components/shared/document-list';
import { FileUploader } from '@/components/shared/file-uploader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Activity } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: {
        patientId: string;
    };
}

export default async function PatientDetailsPage({ params }: PageProps) {
    const { patientId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    // Get patient profile
    const { data: patient, error: patientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .eq('role', 'patient')
        .single();

    if (patientError || !patient) notFound();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/provider/patients">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-blue-100">
                        <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-lg">
                            {patient.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                        <p className="text-sm text-gray-500">Patient Record • {patient.email}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="bg-gray-100/50 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="clinical-notes">Clinical Notes</TabsTrigger>
                    <TabsTrigger value="documents">Medical Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Biographical Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-gray-500">Full Name</p>
                                        <p className="font-medium">{patient.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-500">Email Address</p>
                                        <p className="font-medium">{patient.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-500">Phone Number</p>
                                        <p className="font-medium">Not provided</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-500">Date of Birth</p>
                                        <p className="font-medium">Not provided</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-600" />
                                    Latest Vitals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 italic">No historical vitals recorded yet.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="clinical-notes" className="mt-6 text-center py-20 bg-white border rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-4">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Clinical History</h3>
                    <p className="text-sm text-gray-500 mt-1">Finalized SOAP notes will appear here once visit documentation is complete.</p>
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <DocumentList patientId={patientId} />
                        </div>
                        <div className="lg:col-span-1 border-l pl-8 border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Add Document</h3>
                            <FileUploader
                                patientId={patientId}
                                uploadedBy={user.id}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
