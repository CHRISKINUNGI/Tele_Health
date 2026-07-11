-- CONSULTATION FEE
-- Run after 003_profile_trigger.sql
--
-- Adds a per-doctor consultation fee (Kenyan Shillings) to profiles.
-- Fees are informational in the app UI; actual payment is handled billing-side.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2);

COMMENT ON COLUMN profiles.consultation_fee IS
  'Doctor consultation fee in KES (Ksh). NULL means "fee on request". Ignored for non-doctor roles.';

-- Give the existing seeded doctor a fee so the specialty list has content.
UPDATE profiles
SET consultation_fee = 2500
WHERE role = 'doctor' AND consultation_fee IS NULL;
