-- SAMPLE INVOICES
-- Self-contained: creates the invoices table (migration 005) if missing,
-- then seeds a few sample invoices for real patients. Idempotent.
-- Amounts in KES (Ksh).

-- 1. Table + RLS (from migration 005) --------------------------------------
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

DROP POLICY IF EXISTS "Patients can view their invoices" ON invoices;
CREATE POLICY "Patients can view their invoices"
  ON invoices FOR SELECT TO authenticated USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can view their invoices" ON invoices;
CREATE POLICY "Doctors can view their invoices"
  ON invoices FOR SELECT TO authenticated USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Doctors and admins can create invoices" ON invoices;
CREATE POLICY "Doctors and admins can create invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Doctors and admins can update invoices" ON invoices;
CREATE POLICY "Doctors and admins can update invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add to realtime publication only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
  END IF;
END $$;

-- 2. Sample invoices --------------------------------------------------------
-- Patients: John Doe (8ffee40f...), chris (9597de70...)
-- Doctors:  Amber Ray (b3f5c6df...), Dr. Sarah Johnson (927fc689...)
-- Guarded so re-running does not create duplicates.
INSERT INTO invoices (patient_id, doctor_id, amount, status, description, created_by, paid_at, created_at)
SELECT * FROM (VALUES
  ('8ffee40f-bbee-493e-8f7d-f2bbba75385b'::uuid, 'b3f5c6df-7e6e-459e-96cf-1f346d211107'::uuid, 2500::numeric, 'unpaid', 'General consultation', 'b3f5c6df-7e6e-459e-96cf-1f346d211107'::uuid, NULL::timestamptz, now() - INTERVAL '2 days'),
  ('8ffee40f-bbee-493e-8f7d-f2bbba75385b'::uuid, '927fc689-e41c-4174-8d49-ed61853d1442'::uuid, 3500::numeric, 'paid',   'Follow-up visit',      '927fc689-e41c-4174-8d49-ed61853d1442'::uuid, now() - INTERVAL '5 days', now() - INTERVAL '7 days'),
  ('9597de70-3e94-466e-aad8-f3a61319330b'::uuid, 'b3f5c6df-7e6e-459e-96cf-1f346d211107'::uuid, 4500::numeric, 'unpaid', 'Cardiology consultation', 'b3f5c6df-7e6e-459e-96cf-1f346d211107'::uuid, NULL::timestamptz, now() - INTERVAL '1 day'),
  ('9597de70-3e94-466e-aad8-f3a61319330b'::uuid, '927fc689-e41c-4174-8d49-ed61853d1442'::uuid, 1500::numeric, 'paid',   'Lab result review',    '927fc689-e41c-4174-8d49-ed61853d1442'::uuid, now() - INTERVAL '3 days', now() - INTERVAL '4 days')
) AS v(patient_id, doctor_id, amount, status, description, created_by, paid_at, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM invoices i
  WHERE i.patient_id = v.patient_id AND i.doctor_id = v.doctor_id AND i.description = v.description
);
