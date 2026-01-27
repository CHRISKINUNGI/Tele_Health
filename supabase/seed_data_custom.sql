-- TELEHEALTH PORTAL SEED DATA (TAILORED)
-- Run this in the Supabase SQL Editor to link your manually created users to the portal logic.

-- 1. Insert Profiles for your specific User IDs
INSERT INTO public.profiles (id, role, name, specialization) VALUES
  ('927fc689-e41c-4174-8d49-ed61853d1442', 'doctor', 'Dr. Sarah Johnson', 'General Practice'),
  ('2fc382cf-51ba-4afd-8b9a-8c6b4d2217cf', 'admin', 'Admin User', NULL),
  ('8ffee40f-bbee-493e-8f7d-f2bbba75385b', 'patient', 'John Doe', NULL)
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role, 
  name = EXCLUDED.name, 
  specialization = EXCLUDED.specialization;

-- 2. Insert Demo Appointments
-- Patient with Doctor (In-Session)
INSERT INTO public.appointments (patient_id, doctor_id, type, priority_score, status, scheduled_time, actual_start)
VALUES (
  '8ffee40f-bbee-493e-8f7d-f2bbba75385b', 
  '927fc689-e41c-4174-8d49-ed61853d1442', 
  'in_person', 
  85, 
  'in_session', 
  now() - INTERVAL '45 minutes', 
  now() - INTERVAL '40 minutes'
);

-- Another Appointment (Waiting/Urgent)
INSERT INTO public.appointments (patient_id, doctor_id, type, priority_score, status, scheduled_time)
VALUES (
  '8ffee40f-bbee-493e-8f7d-f2bbba75385b', 
  '927fc689-e41c-4174-8d49-ed61853d1442', 
  'virtual', 
  95, 
  'waiting', 
  now()
);

-- 3. Populate Queue Entries
-- Active Session
INSERT INTO public.queue_entries (appointment_id, doctor_id, current_stage, estimated_wait_minutes, check_in_time)
SELECT id, doctor_id, 'in_consultation', 0, actual_start
FROM public.appointments 
WHERE status = 'in_session' AND doctor_id = '927fc689-e41c-4174-8d49-ed61853d1442'
ON CONFLICT (appointment_id) DO NOTHING;

-- Waiting Entry
INSERT INTO public.queue_entries (appointment_id, doctor_id, current_stage, estimated_wait_minutes, check_in_time)
SELECT id, doctor_id, 'waiting', 15, now() - INTERVAL '15 minutes'
FROM public.appointments 
WHERE status = 'waiting' AND doctor_id = '927fc689-e41c-4174-8d49-ed61853d1442'
ON CONFLICT (appointment_id) DO NOTHING;
