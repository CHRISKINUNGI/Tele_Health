-- SEED DOCTOR AVAILABILITY
-- Self-contained: adds the availability column (migration 006) if missing,
-- then assigns varied weekly schedules so the booking slot picker shows real
-- differences between doctors. Idempotent. Weekday keys: '0'=Sun .. '6'=Sat.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability JSONB;

COMMENT ON COLUMN profiles.availability IS
  'Doctor weekly schedule keyed by weekday (0=Sun..6=Sat): {enabled,start,end}. NULL = default clinic hours.';

-- Base schedule for every doctor: Mon–Sat 08:00–17:00, closed Sunday.
UPDATE profiles SET availability = '{
  "0": {"enabled": false, "start": 8, "end": 17},
  "1": {"enabled": true,  "start": 8, "end": 17},
  "2": {"enabled": true,  "start": 8, "end": 17},
  "3": {"enabled": true,  "start": 8, "end": 17},
  "4": {"enabled": true,  "start": 8, "end": 17},
  "5": {"enabled": true,  "start": 8, "end": 17},
  "6": {"enabled": true,  "start": 8, "end": 17}
}'::jsonb
WHERE role = 'doctor';

-- Part-time, Wednesday off (Mon,Tue,Thu,Fri 09:00–16:00).
UPDATE profiles SET availability = '{
  "0": {"enabled": false, "start": 9, "end": 16},
  "1": {"enabled": true,  "start": 9, "end": 16},
  "2": {"enabled": true,  "start": 9, "end": 16},
  "3": {"enabled": false, "start": 9, "end": 16},
  "4": {"enabled": true,  "start": 9, "end": 16},
  "5": {"enabled": true,  "start": 9, "end": 16},
  "6": {"enabled": false, "start": 9, "end": 16}
}'::jsonb
WHERE role = 'doctor' AND name IN ('Dr. Amina Otieno', 'Dr. Fatuma Ali', 'Dr. Mary Njeri');

-- Late shift, Tuesday–Saturday 10:00–18:00 (Mon & Sun off).
UPDATE profiles SET availability = '{
  "0": {"enabled": false, "start": 10, "end": 18},
  "1": {"enabled": false, "start": 10, "end": 18},
  "2": {"enabled": true,  "start": 10, "end": 18},
  "3": {"enabled": true,  "start": 10, "end": 18},
  "4": {"enabled": true,  "start": 10, "end": 18},
  "5": {"enabled": true,  "start": 10, "end": 18},
  "6": {"enabled": true,  "start": 10, "end": 18}
}'::jsonb
WHERE role = 'doctor' AND name IN ('Dr. James Mwangi', 'Dr. David Kimani', 'Dr. Brian Kiptoo');

-- Mornings + Saturday clinic (Mon,Tue,Thu,Fri 08:00–14:00; Sat 09:00–12:00; Wed off).
UPDATE profiles SET availability = '{
  "0": {"enabled": false, "start": 8, "end": 14},
  "1": {"enabled": true,  "start": 8, "end": 14},
  "2": {"enabled": true,  "start": 8, "end": 14},
  "3": {"enabled": false, "start": 8, "end": 14},
  "4": {"enabled": true,  "start": 8, "end": 14},
  "5": {"enabled": true,  "start": 8, "end": 14},
  "6": {"enabled": true,  "start": 9, "end": 12}
}'::jsonb
WHERE role = 'doctor' AND name IN ('Dr. Grace Wanjiru', 'Dr. Esther Wambui', 'Dr. Joseph Maina');
