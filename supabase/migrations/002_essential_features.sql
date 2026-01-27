-- ESSENTIAL FEATURES DATABASE MIGRATION
-- Run this after the initial schema migration (001_initial_schema.sql)

-- ============================================
-- 1. SECURE MESSAGING SYSTEM
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_patient ON conversations(patient_id, last_message_at DESC);
CREATE INDEX idx_conversations_doctor ON conversations(doctor_id, last_message_at DESC);
CREATE INDEX idx_messages_unread ON messages(recipient_id, read) WHERE read = false;

-- ============================================
-- 2. CLINICAL DOCUMENTATION (SOAP NOTES)
-- ============================================

CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  
  -- SOAP Format
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  
  -- Additional clinical data
  vital_signs JSONB,
  diagnosis_codes TEXT[],
  
  -- Status
  is_finalized BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id, created_at DESC);
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_clinical_notes_doctor ON clinical_notes(doctor_id, created_at DESC);

-- Auto-update timestamp
CREATE TRIGGER update_clinical_notes_updated_at
BEFORE UPDATE ON clinical_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. MEDICAL DOCUMENTS & FILE STORAGE
-- ============================================

CREATE TABLE medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  appointment_id UUID REFERENCES appointments(id),
  
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  description TEXT,
  category TEXT, -- 'insurance', 'lab_result', 'prescription', 'imaging', 'other'
  is_visible_to_patient BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_patient ON medical_documents(patient_id, created_at DESC);
CREATE INDEX idx_documents_appointment ON medical_documents(appointment_id);
CREATE INDEX idx_documents_category ON medical_documents(category, created_at DESC);

-- ============================================
-- 4. NOTIFICATION SYSTEM
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  read BOOLEAN DEFAULT false,
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_sms BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Conversations: Patients and doctors can only see their own conversations
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
TO authenticated
USING (patient_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Users can create conversations they are part of"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid() OR doctor_id = auth.uid());

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.patient_id = auth.uid() OR conversations.doctor_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Clinical Notes: Only doctors can create, patients can view their own
CREATE POLICY "Doctors can manage clinical notes"
ON clinical_notes FOR ALL
TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Patients can view their clinical notes"
ON clinical_notes FOR SELECT
TO authenticated
USING (patient_id = auth.uid() AND is_finalized = true);

-- Medical Documents: Patients and doctors can view, upload restrictions
CREATE POLICY "Users can view relevant documents"
ON medical_documents FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid() 
  OR uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = medical_documents.appointment_id
    AND appointments.doctor_id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents"
ON medical_documents FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- Notifications: Users can only see their own
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE clinical_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE medical_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Trigger to notify recipient of new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  PERFORM create_notification(
    NEW.recipient_id,
    'new_message',
    'New Message from ' || sender_name,
    LEFT(NEW.content, 100),
    '/messages?conversation=' || NEW.conversation_id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
-- FIX RLS FOR PATIENT BOOKING AND VIEWING DOCTORS

-- 1. Allow all authenticated users to view doctor profiles
CREATE POLICY "Anyone can view doctor profiles"
ON profiles FOR SELECT
TO authenticated
USING (role = 'doctor');

-- 2. Allow patients to schedule their own appointments
CREATE POLICY "Patients can schedule their own appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid());

-- 3. Ensure patients can update their own appointments (e.g., if they need to cancel)
CREATE POLICY "Patients can update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());
