-- SAMPLE DOCTORS ACROSS SPECIALTIES
-- Run in the Supabase SQL Editor AFTER 004_consultation_fee.sql.
--
-- Populates a spread of specialties (each with multiple doctors) so the
-- "New Message" specialty picker has realistic content. Fees are in KES.
-- Idempotent: safe to re-run (creates auth users + profiles only if missing).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  hashed_password TEXT := crypt('demo123', gen_salt('bf'));
  d RECORD;
  sample_doctors CONSTANT JSONB := '[
    {"id": "d0c00001-0000-0000-0000-000000000001", "email": "cardio1@example.com",  "name": "Dr. Amina Otieno",   "spec": "Cardiology",     "fee": 4500},
    {"id": "d0c00002-0000-0000-0000-000000000002", "email": "cardio2@example.com",  "name": "Dr. James Mwangi",   "spec": "Cardiology",     "fee": 4000},
    {"id": "d0c00003-0000-0000-0000-000000000003", "email": "peds1@example.com",    "name": "Dr. Grace Wanjiru",  "spec": "Pediatrics",     "fee": 3000},
    {"id": "d0c00004-0000-0000-0000-000000000004", "email": "peds2@example.com",    "name": "Dr. Peter Kamau",    "spec": "Pediatrics",     "fee": 2800},
    {"id": "d0c00005-0000-0000-0000-000000000005", "email": "derma1@example.com",   "name": "Dr. Fatuma Ali",     "spec": "Dermatology",    "fee": 3500},
    {"id": "d0c00006-0000-0000-0000-000000000006", "email": "psych1@example.com",   "name": "Dr. David Kimani",   "spec": "Psychiatry",     "fee": 5000},
    {"id": "d0c00007-0000-0000-0000-000000000007", "email": "gp1@example.com",      "name": "Dr. Susan Achieng",  "spec": "General Practice", "fee": 2000}
  ]'::jsonb;
BEGIN
  FOR d IN SELECT * FROM jsonb_to_recordset(sample_doctors)
    AS x(id UUID, email TEXT, name TEXT, spec TEXT, fee NUMERIC)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = d.email) THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        role, aud, confirmation_token
      )
      VALUES (
        d.id, '00000000-0000-0000-0000-000000000000', d.email, hashed_password, now(),
        '{"provider":"email","providers":["email"]}', '{}', now(), now(),
        'authenticated', 'authenticated', ''
      );
    END IF;

    INSERT INTO public.profiles (id, role, name, specialization, consultation_fee)
    VALUES (d.id, 'doctor', d.name, d.spec, d.fee)
    ON CONFLICT (id) DO UPDATE SET
      specialization = EXCLUDED.specialization,
      consultation_fee = EXCLUDED.consultation_fee;
  END LOOP;
END $$;
