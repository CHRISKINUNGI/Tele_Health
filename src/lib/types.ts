export type UserRole = 'doctor' | 'admin' | 'patient';

export type AppointmentStatus =
    | 'scheduled'
    | 'checked_in'
    | 'in_nurse_review'
    | 'waiting'
    | 'in_session'
    | 'completed'
    | 'cancelled';

export type AppointmentType = 'virtual' | 'in_person';

export type QueueStage =
    | 'check_in'
    | 'nurse_review'
    | 'waiting'
    | 'in_consultation'
    | 'completed';

export interface Profile {
    id: string;
    role: UserRole;
    name: string;
    specialization?: string;
    /** Doctor consultation fee in KES (Ksh). Null/undefined means "fee on request". */
    consultation_fee?: number | null;
    created_at: string;
}

export interface SymptomData {
    severity: number; // 0-40
    duration: number; // 0-30
    preExisting: number; // 0-30
}

export interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    status: AppointmentStatus;
    type: AppointmentType;
    priority_score: number;
    scheduled_time: string;
    actual_start?: string;
    actual_end?: string;
    symptom_data?: SymptomData;
    created_at: string;
    // Joined data
    patient?: Profile;
    doctor?: Profile;
}

export interface QueueEntry {
    id: string;
    appointment_id: string;
    doctor_id: string;
    estimated_wait_minutes: number;
    check_in_time: string;
    current_stage: QueueStage;
    flagged_for_reassignment: boolean;
    reassignment_reason?: string;
    updated_at: string;
    // Joined data
    appointment?: Appointment;
    doctor?: Profile;
}

export interface DoctorLoad {
    doctor_id: string;
    current_session_duration_minutes: number;
    queue_length: number;
    is_available: boolean;
    specialization: string;
}

export interface ReassignmentSuggestion {
    appointment_id: string;
    current_doctor_id: string;
    suggested_doctor_id: string;
    reason: string;
    delay_minutes: number;
}

// ============================================
// MESSAGING TYPES
// ============================================

export interface Conversation {
    id: string;
    appointment_id?: string;
    patient_id: string;
    doctor_id: string;
    last_message_at: string;
    created_at: string;
    patient?: Profile;
    doctor?: Profile;
    messages?: Message[];
    unread_count?: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    read: boolean;
    created_at: string;
    sender?: Profile;
}

// ============================================
// CLINICAL NOTES TYPES
// ============================================

export interface ClinicalNote {
    id: string;
    appointment_id: string;
    doctor_id: string;
    patient_id: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    vital_signs?: VitalSigns;
    diagnosis_codes?: string[];
    is_finalized: boolean;
    created_at: string;
    updated_at: string;
    appointment?: Appointment;
    doctor?: Profile;
    patient?: Profile;
}

export interface VitalSigns {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
}

// ============================================
// MEDICAL DOCUMENTS TYPES
// ============================================

export interface MedicalDocument {
    id: string;
    patient_id: string;
    uploaded_by: string;
    appointment_id?: string;
    file_name: string;
    file_type: string;
    file_url: string;
    file_size_bytes?: number;
    mime_type?: string;
    description?: string;
    category: DocumentCategory;
    is_visible_to_patient: boolean;
    created_at: string;
    uploader?: Profile;
}

export type DocumentCategory =
    | 'insurance'
    | 'lab_result'
    | 'prescription'
    | 'imaging'
    | 'other';

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    sent_via_email: boolean;
    sent_via_sms: boolean;
    created_at: string;
}

export type NotificationType =
    | 'new_message'
    | 'appointment_reminder'
    | 'appointment_update'
    | 'document_uploaded'
    | 'note_available'
    | 'prescription_ready';

// ============================================
// BILLING / INVOICE TYPES
// ============================================

export type InvoiceStatus = 'unpaid' | 'paid';

export interface Invoice {
    id: string;
    patient_id: string;
    doctor_id: string;
    appointment_id?: string | null;
    /** Amount in KES (Ksh). */
    amount: number;
    status: InvoiceStatus;
    description?: string | null;
    created_by?: string | null;
    paid_at?: string | null;
    created_at: string;
    // Joined data
    patient?: Profile;
    doctor?: Profile;
}
