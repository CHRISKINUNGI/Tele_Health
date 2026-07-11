-- INVOICES (record-only billing)
-- Run after 004_consultation_fee.sql
--
-- Invoices are created manually by a doctor (or admin) and viewed by the
-- patient. Payment is tracked as a simple status toggle (unpaid/paid) — there
-- is no payment-gateway integration. Amounts are in KES (Ksh).

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_doctor ON invoices(doctor_id, created_at DESC);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Patients can view their own invoices
CREATE POLICY "Patients can view their invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Doctors can view invoices they issued
CREATE POLICY "Doctors can view their invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

-- Admins can view every invoice
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Doctors can issue invoices for themselves; admins for anyone
CREATE POLICY "Doctors and admins can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Doctors can update their own invoices (e.g. mark paid); admins any
CREATE POLICY "Doctors and admins can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
