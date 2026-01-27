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

-- 4. Allow patients to initiate conversations
DROP POLICY IF EXISTS "Doctors can create conversations" ON conversations;
CREATE POLICY "Users can create conversations they are part of"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid() OR doctor_id = auth.uid());

