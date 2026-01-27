import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { SOAPNoteForm } from '@/components/provider/soap-note-form';
import { getClinicalNoteByAppointment } from '@/lib/actions/clinical-notes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface PageProps {
    params: {
        appointmentId: string;
    };
}

export default async function ClinicalNotePage({ params }: PageProps) {
    // Resolve the appointmentId from params
    const { appointmentId } = await params;

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect('/login');

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'doctor') redirect('/login');

    // Get appointment details
    const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:profiles!appointments_patient_id_fkey(*)
        `)
        .eq('id', appointmentId)
        .single();

    if (aptError || !appointment) notFound();

    // Ensure the doctor is the one assigned to this appointment
    if (appointment.doctor_id !== user.id) redirect('/provider');

    const initialNote = await getClinicalNoteByAppointment(appointmentId);

    const patientName = appointment.patient?.name || 'Unknown Patient';

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-50/30">
            {/* Header with Patient context */}
            <div className="bg-white border-b px-8 py-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-blue-100">
                            <AvatarFallback className="bg-blue-50 text-blue-700 font-bold">
                                {patientName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{patientName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 capitalize">
                                    {appointment.type} Visit
                                </Badge>
                                <span className="text-gray-400 text-xs">•</span>
                                <span className="text-gray-500 text-sm">
                                    Appointment ID: {appointmentId.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto h-full">
                    <SOAPNoteForm
                        appointmentId={appointmentId}
                        doctorId={user.id}
                        patientId={appointment.patient_id}
                        initialData={initialNote}
                    />
                </div>
            </div>
        </div>
    );
}
