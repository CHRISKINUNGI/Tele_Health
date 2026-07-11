-- SAMPLE DOCTORS ACROSS SPECIALTIES
-- Run in the Supabase SQL Editor AFTER 004_consultation_fee.sql.
--
-- Populates a spread of specialties (each with multiple doctors) so the
-- "New Message" specialty picker has realistic content. Fees are in KES.
-- Idempotent: safe to re-run.
--
-- NOTE: the profile trigger (003) auto-creates a profile (role 'patient',
-- name = email) when the auth user is inserted, so the ON CONFLICT clause
-- MUST overwrite role and name — otherwise doctors get stuck as patients.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  hashed_password TEXT := crypt('demo123', gen_salt('bf'));
  d RECORD;
  sample_doctors CONSTANT JSONB := '[
    {"id": "d0c00001-0000-0000-0000-000000000001", "email": "cardio1@example.com", "name": "Dr. Amina Otieno",   "spec": "Cardiology",                "fee": 4500},
    {"id": "d0c00002-0000-0000-0000-000000000002", "email": "cardio2@example.com", "name": "Dr. James Mwangi",   "spec": "Cardiology",                "fee": 4000},
    {"id": "d0c00003-0000-0000-0000-000000000003", "email": "peds1@example.com",   "name": "Dr. Grace Wanjiru",  "spec": "Pediatrics",                "fee": 3000},
    {"id": "d0c00004-0000-0000-0000-000000000004", "email": "peds2@example.com",   "name": "Dr. Peter Kamau",    "spec": "Pediatrics",                "fee": 2800},
    {"id": "d0c00005-0000-0000-0000-000000000005", "email": "derma1@example.com",  "name": "Dr. Fatuma Ali",     "spec": "Dermatology",               "fee": 3500},
    {"id": "d0c00006-0000-0000-0000-000000000006", "email": "psych1@example.com",  "name": "Dr. David Kimani",   "spec": "Psychiatry",                "fee": 5000},
    {"id": "d0c00007-0000-0000-0000-000000000007", "email": "gp1@example.com",     "name": "Dr. Susan Achieng",  "spec": "General Practice",          "fee": 2000},
    {"id": "d0c00008-0000-0000-0000-000000000008", "email": "gyn1@example.com",    "name": "Dr. Mary Njeri",     "spec": "Gynecology & Obstetrics",   "fee": 4000},
    {"id": "d0c00009-0000-0000-0000-000000000009", "email": "gyn2@example.com",    "name": "Dr. Lucy Adhiambo",  "spec": "Gynecology & Obstetrics",   "fee": 4200},
    {"id": "d0c0000a-0000-0000-0000-00000000000a", "email": "ortho1@example.com",  "name": "Dr. Brian Kiptoo",   "spec": "Orthopedics",               "fee": 4800},
    {"id": "d0c0000b-0000-0000-0000-00000000000b", "email": "ortho2@example.com",  "name": "Dr. Daniel Mutua",   "spec": "Orthopedics",               "fee": 4500},
    {"id": "d0c0000c-0000-0000-0000-00000000000c", "email": "neuro1@example.com",  "name": "Dr. Esther Wambui",  "spec": "Neurology",                 "fee": 5500},
    {"id": "d0c0000d-0000-0000-0000-00000000000d", "email": "neuro2@example.com",  "name": "Dr. Samuel Ochieng", "spec": "Neurology",                 "fee": 5200},
    {"id": "d0c0000e-0000-0000-0000-00000000000e", "email": "ent1@example.com",    "name": "Dr. Joseph Maina",   "spec": "ENT (Ear, Nose & Throat)",  "fee": 3800},
    {"id": "d0c0000f-0000-0000-0000-00000000000f", "email": "ent2@example.com",    "name": "Dr. Rose Chebet",    "spec": "ENT (Ear, Nose & Throat)",  "fee": 3600}
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

    -- Upsert the profile. Overwrite role/name too, since the profile trigger
    -- may have already created this row as a 'patient' named by email.
    INSERT INTO public.profiles (id, role, name, specialization, consultation_fee)
    VALUES (d.id, 'doctor', d.name, d.spec, d.fee)
    ON CONFLICT (id) DO UPDATE SET
      role = 'doctor',
      name = EXCLUDED.name,
      specialization = EXCLUDED.specialization,
      consultation_fee = EXCLUDED.consultation_fee;
  END LOOP;
END $$;
