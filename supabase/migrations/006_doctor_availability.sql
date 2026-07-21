-- DOCTOR AVAILABILITY
-- Run after 005_invoices.sql
--
-- Per-doctor weekly schedule. JSONB keyed by weekday ('0'=Sunday .. '6'=Saturday):
--   { "1": {"enabled": true, "start": 9, "end": 16}, "3": {"enabled": false, ...}, ... }
-- NULL means "use the default clinic hours" (Mon-Sat 08:00-17:00). Non-doctor
-- roles ignore this column.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS availability JSONB;

COMMENT ON COLUMN profiles.availability IS
  'Doctor weekly schedule keyed by weekday (0=Sun..6=Sat): {enabled,start,end}. NULL = default clinic hours.';
