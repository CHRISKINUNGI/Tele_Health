-- TELEHEALTH PORTAL SEED DATA
-- Run this in the Supabase SQL Editor AFTER running the initial schema migration.

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Define reusable IDs and hashed password
DO $$
DECLARE
  doctor_id UUID := 'd0ca0000-0000-0000-0000-000000000001';
  admin_id UUID := 'ad0a0000-0000-0000-0000-000000000002';
  patient_id UUID := 'pa1e0000-0000-0000-0000-000000000003';
  hashed_password TEXT := crypt('demo123', gen_salt('bf'));
BEGIN

  -- CREATE DOCTOR (if not exists)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'doctor@example.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (doctor_id, '00000000-0000-0000-0000-000000000000', 'doctor@example.com', hashed_password, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    
    INSERT INTO public.profiles (id, role, name, specialization)
    VALUES (doctor_id, 'doctor', 'Dr. Sarah Johnson', 'General Practice');
  END IF;

  -- CREATE ADMIN (if not exists)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@example.com', hashed_password, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    
    INSERT INTO public.profiles (id, role, name)
    VALUES (admin_id, 'admin', 'System Administrator');
  END IF;

  -- CREATE PATIENT (if not exists)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'patient@example.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (patient_id, '00000000-0000-0000-0000-000000000000', 'patient@example.com', hashed_password, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    
    INSERT INTO public.profiles (id, role, name)
    VALUES (patient_id, 'patient', 'John Doe');
  END IF;

  -- 3. Insert Demo Appointments
  -- Create a few more patients for a realistic queue
  -- (Using gen_random_uuid() for these extra ones)
  
  -- Active Session for Dr. Johnson
  INSERT INTO public.appointments (patient_id, doctor_id, type, priority_score, status, scheduled_time, actual_start)
  VALUES (patient_id, doctor_id, 'in_person', 85, 'in_session', now() - INTERVAL '30 minutes', now() - INTERVAL '30 minutes');
  
  -- Waiting patient (High Priority)
  INSERT INTO public.appointments (patient_id, doctor_id, type, priority_score, status, scheduled_time)
  VALUES (patient_id, doctor_id, 'virtual', 92, 'waiting', now());
  
  -- Upcoming patient
  INSERT INTO public.appointments (patient_id, doctor_id, type, priority_score, status, scheduled_time)
  VALUES (patient_id, doctor_id, 'in_person', 45, 'scheduled', now() + INTERVAL '1 hour');

  -- 4. Populate Queue Entries for the active items
  INSERT INTO public.queue_entries (appointment_id, doctor_id, current_stage, estimated_wait_minutes, check_in_time)
  SELECT id, doctor_id, 'in_consultation', 0, actual_start
  FROM public.appointments 
  WHERE status = 'in_session'
  ON CONFLICT (appointment_id) DO NOTHING;

  INSERT INTO public.queue_entries (appointment_id, doctor_id, current_stage, estimated_wait_minutes, check_in_time)
  SELECT id, doctor_id, 'waiting', 15, now() - INTERVAL '10 minutes'
  FROM public.appointments 
  WHERE status = 'waiting'
  ON CONFLICT (appointment_id) DO NOTHING;

END $$;
