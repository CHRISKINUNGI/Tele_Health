-- ROBUST RLS FIX (100% Loop-Proof)
-- Run this in the Supabase SQL Editor.

-- 1. Remove all old problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient and doctor profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_doctor_read" ON public.profiles;

-- 2. Apply a clean, non-recursive policy
-- This allows any logged-in user to see the names and roles of others.
-- In a clinical portal, this is necessary for lookup and dashboard displays.
CREATE POLICY "authenticated_can_read_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. (Optional) If you want to restrict UPDATES, use this:
CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
