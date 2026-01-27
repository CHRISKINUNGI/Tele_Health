-- Create custom types
CREATE TYPE user_role AS ENUM ('doctor', 'admin', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'checked_in', 'in_nurse_review', 'waiting', 'in_session', 'completed', 'cancelled');
CREATE TYPE appointment_type AS ENUM ('virtual', 'in_person');
CREATE TYPE queue_stage AS ENUM ('check_in', 'nurse_review', 'waiting', 'in_consultation', 'completed');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  name TEXT NOT NULL,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  type appointment_type NOT NULL,
  priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  symptom_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue entries table
CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  current_stage queue_stage NOT NULL DEFAULT 'check_in',
  flagged_for_reassignment BOOLEAN DEFAULT FALSE,
  reassignment_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_appointments_doctor_status ON appointments(doctor_id, status);
CREATE INDEX idx_appointments_patient_scheduled ON appointments(patient_id, scheduled_time);
CREATE INDEX idx_queue_doctor_stage ON queue_entries(doctor_id, current_stage);
CREATE INDEX idx_queue_flagged ON queue_entries(flagged_for_reassignment) WHERE flagged_for_reassignment = TRUE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for queue_entries updated_at
CREATE TRIGGER update_queue_entries_updated_at
BEFORE UPDATE ON queue_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Doctors can view patient and doctor profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
    AND role IN ('patient', 'doctor')
  );

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments"
  ON appointments FOR SELECT
  USING (
    patient_id = auth.uid()
  );

CREATE POLICY "Doctors can view their assigned appointments"
  ON appointments FOR SELECT
  USING (
    doctor_id = auth.uid()
  );

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins and doctors can update appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

-- RLS Policies for queue_entries
CREATE POLICY "Patients can view their own queue entries"
  ON queue_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = queue_entries.appointment_id
      AND appointments.patient_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their queue entries"
  ON queue_entries FOR SELECT
  USING (
    doctor_id = auth.uid()
  );

CREATE POLICY "Admins can view all queue entries"
  ON queue_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert queue entries"
  ON queue_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins and doctors can update queue entries"
  ON queue_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
