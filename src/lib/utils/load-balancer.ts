import { createClient } from '../supabase/server';
import { DoctorLoad, ReassignmentSuggestion, Appointment, QueueEntry } from '../types';

const DELAY_THRESHOLD_MINUTES = 15;

/**
 * Calculate current load for a specific doctor
 */
export async function calculateDoctorLoad(doctorId: string): Promise<DoctorLoad> {
    const supabase = await createClient();

    // Get doctor's profile
    const { data: doctor } = await supabase
        .from('profiles')
        .select('specialization')
        .eq('id', doctorId)
        .single();

    // Get current active session
    const { data: activeAppointment } = await supabase
        .from('appointments')
        .select('actual_start')
        .eq('doctor_id', doctorId)
        .eq('status', 'in_session')
        .single();

    // Calculate session duration
    let currentSessionDuration = 0;
    if (activeAppointment?.actual_start) {
        const startTime = new Date(activeAppointment.actual_start);
        const now = new Date();
        currentSessionDuration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    }

    // Get queue length
    const { count: queueLength } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .in('current_stage', ['check_in', 'nurse_review', 'waiting']);

    return {
        doctor_id: doctorId,
        current_session_duration_minutes: currentSessionDuration,
        queue_length: queueLength || 0,
        is_available: !activeAppointment,
        specialization: doctor?.specialization || '',
    };
}

/**
 * Find available doctor with matching specialization
 */
export async function findAvailableDoctor(specialization: string): Promise<string | null> {
    const supabase = await createClient();

    // Get all doctors with matching specialization
    const { data: doctors } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'doctor')
        .eq('specialization', specialization);

    if (!doctors || doctors.length === 0) return null;

    // Calculate load for each doctor
    const doctorLoads = await Promise.all(
        doctors.map(doc => calculateDoctorLoad(doc.id))
    );

    // Find available doctor with lowest queue
    const availableDoctors = doctorLoads
        .filter(load => load.is_available)
        .sort((a, b) => a.queue_length - b.queue_length);

    if (availableDoctors.length > 0) {
        return availableDoctors[0].doctor_id;
    }

    // If no available doctors, find one with shortest current session
    const busyDoctors = doctorLoads
        .filter(load => !load.is_available)
        .sort((a, b) => a.current_session_duration_minutes - b.current_session_duration_minutes);

    return busyDoctors.length > 0 ? busyDoctors[0].doctor_id : null;
}

/**
 * Check for appointments running late and flag for reassignment
 */
export async function checkForDelays(): Promise<ReassignmentSuggestion[]> {
    const supabase = await createClient();

    // Get all in-session appointments
    const { data: activeAppointments } = await supabase
        .from('appointments')
        .select(`
      id,
      doctor_id,
      actual_start,
      scheduled_time,
      doctor:profiles!appointments_doctor_id_fkey(specialization)
    `)
        .eq('status', 'in_session');

    if (!activeAppointments) return [];

    const suggestions: ReassignmentSuggestion[] = [];
    const now = new Date();

    for (const appointment of activeAppointments) {
        if (!appointment.actual_start) continue;

        const startTime = new Date(appointment.actual_start);
        const scheduledTime = new Date(appointment.scheduled_time);
        const sessionDuration = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
        const delayMinutes = Math.floor((startTime.getTime() - scheduledTime.getTime()) / (1000 * 60));

        // Check if running late
        if (sessionDuration >= DELAY_THRESHOLD_MINUTES || delayMinutes >= DELAY_THRESHOLD_MINUTES) {
            // Find alternative doctor
            const specialization = (appointment.doctor as any)?.specialization || '';
            const alternativeDoctor = await findAvailableDoctor(specialization);

            if (alternativeDoctor && alternativeDoctor !== appointment.doctor_id) {
                suggestions.push({
                    appointment_id: appointment.id,
                    current_doctor_id: appointment.doctor_id,
                    suggested_doctor_id: alternativeDoctor,
                    reason: `Current session running ${sessionDuration} minutes. Delay: ${delayMinutes} minutes.`,
                    delay_minutes: Math.max(sessionDuration, delayMinutes),
                });

                // Flag in queue_entries
                await supabase
                    .from('queue_entries')
                    .update({
                        flagged_for_reassignment: true,
                        reassignment_reason: `Doctor running ${Math.max(sessionDuration, delayMinutes)} minutes late`,
                    })
                    .eq('appointment_id', appointment.id);
            }
        }
    }

    return suggestions;
}

/**
 * Suggest reassignment for a specific appointment
 */
export async function suggestReassignment(appointmentId: string): Promise<ReassignmentSuggestion | null> {
    const supabase = await createClient();

    const { data: appointment } = await supabase
        .from('appointments')
        .select(`
      id,
      doctor_id,
      actual_start,
      scheduled_time,
      doctor:profiles!appointments_doctor_id_fkey(specialization)
    `)
        .eq('id', appointmentId)
        .single();

    if (!appointment) return null;

    const specialization = (appointment.doctor as any)?.specialization || '';
    const alternativeDoctor = await findAvailableDoctor(specialization);

    if (!alternativeDoctor || alternativeDoctor === appointment.doctor_id) {
        return null;
    }

    let delayMinutes = 0;
    if (appointment.actual_start) {
        const startTime = new Date(appointment.actual_start);
        const scheduledTime = new Date(appointment.scheduled_time);
        delayMinutes = Math.floor((startTime.getTime() - scheduledTime.getTime()) / (1000 * 60));
    }

    return {
        appointment_id: appointment.id,
        current_doctor_id: appointment.doctor_id,
        suggested_doctor_id: alternativeDoctor,
        reason: 'Alternative doctor available with shorter queue',
        delay_minutes: delayMinutes,
    };
}

/**
 * Calculate estimated wait time for a queue entry
 */
export async function calculateEstimatedWaitTime(queueEntryId: string): Promise<number> {
    const supabase = await createClient();

    const { data: queueEntry } = await supabase
        .from('queue_entries')
        .select('doctor_id, check_in_time')
        .eq('id', queueEntryId)
        .single();

    if (!queueEntry) return 0;

    // Get doctor's current load
    const load = await calculateDoctorLoad(queueEntry.doctor_id);

    // Base wait time: 15 minutes per patient in queue + current session remaining time
    const averageSessionTime = 15;
    const estimatedWait = (load.queue_length * averageSessionTime) +
        (load.is_available ? 0 : Math.max(0, averageSessionTime - load.current_session_duration_minutes));

    return Math.round(estimatedWait);
}
