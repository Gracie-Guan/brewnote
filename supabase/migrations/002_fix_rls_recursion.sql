-- Fix: infinite recursion in household_members RLS policy
-- The original household_members_select policy referenced household_members
-- from within itself, causing PostgreSQL error 42P17.
--
-- Solution: a SECURITY DEFINER function that bypasses RLS when checking
-- membership, so no policy ever calls itself recursively.
-- Run this in the Supabase SQL editor.

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id
    AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- HOUSEHOLDS
-- ============================================================

DROP POLICY IF EXISTS "households_select" ON households;
CREATE POLICY "households_select" ON households
  FOR SELECT USING (
    owner_id = auth.uid()
    OR public.is_household_member(id)
  );

-- households_insert and households_update are fine as-is (no subquery on household_members)

-- ============================================================
-- HOUSEHOLD_MEMBERS
-- ============================================================

DROP POLICY IF EXISTS "household_members_select" ON household_members;
CREATE POLICY "household_members_select" ON household_members
  FOR SELECT USING (public.is_household_member(household_id));

-- household_members_insert and household_members_delete are fine as-is

-- ============================================================
-- HOUSEHOLD_INVITES
-- ============================================================

DROP POLICY IF EXISTS "household_invites_select" ON household_invites;
CREATE POLICY "household_invites_select" ON household_invites
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "household_invites_insert" ON household_invites;
CREATE POLICY "household_invites_insert" ON household_invites
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND public.is_household_member(household_id)
  );

-- ============================================================
-- BEANS
-- ============================================================

DROP POLICY IF EXISTS "beans_select" ON beans;
CREATE POLICY "beans_select" ON beans
  FOR SELECT USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "beans_insert" ON beans;
CREATE POLICY "beans_insert" ON beans
  FOR INSERT WITH CHECK (
    added_by = auth.uid()
    AND public.is_household_member(household_id)
  );

DROP POLICY IF EXISTS "beans_update" ON beans;
CREATE POLICY "beans_update" ON beans
  FOR UPDATE USING (public.is_household_member(household_id));

-- ============================================================
-- RATINGS
-- ============================================================

DROP POLICY IF EXISTS "ratings_select" ON ratings;
CREATE POLICY "ratings_select" ON ratings
  FOR SELECT USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "ratings_insert" ON ratings;
CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.is_household_member(household_id)
  );

-- ============================================================
-- BREW_NOTES
-- ============================================================

DROP POLICY IF EXISTS "brew_notes_select" ON brew_notes;
CREATE POLICY "brew_notes_select" ON brew_notes
  FOR SELECT USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "brew_notes_insert" ON brew_notes;
CREATE POLICY "brew_notes_insert" ON brew_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.is_household_member(household_id)
  );

-- ============================================================
-- BREW_PROFILES
-- ============================================================

DROP POLICY IF EXISTS "brew_profiles_select" ON brew_profiles;
CREATE POLICY "brew_profiles_select" ON brew_profiles
  FOR SELECT USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "brew_profiles_insert" ON brew_profiles;
CREATE POLICY "brew_profiles_insert" ON brew_profiles
  FOR INSERT WITH CHECK (public.is_household_member(household_id));

DROP POLICY IF EXISTS "brew_profiles_update" ON brew_profiles;
CREATE POLICY "brew_profiles_update" ON brew_profiles
  FOR UPDATE USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "brew_profiles_delete" ON brew_profiles;
CREATE POLICY "brew_profiles_delete" ON brew_profiles
  FOR DELETE USING (public.is_household_member(household_id));

-- ============================================================
-- CONSUMPTION_LOGS
-- ============================================================

DROP POLICY IF EXISTS "consumption_logs_select" ON consumption_logs;
CREATE POLICY "consumption_logs_select" ON consumption_logs
  FOR SELECT USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS "consumption_logs_insert" ON consumption_logs;
CREATE POLICY "consumption_logs_insert" ON consumption_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.is_household_member(household_id)
  );
