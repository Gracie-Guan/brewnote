-- Allow unauthenticated users to read household name when validating an invite link.
-- Without this, InvitePage can't join to households and falls back to "a household".
CREATE POLICY "households_select_via_invite" ON households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM household_invites
      WHERE used = false AND expires_at > now()
    )
  );

-- Add sort_order to brew_profiles for drag-to-reorder support.
ALTER TABLE brew_profiles ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Initialise sort_order for existing rows based on their creation order per household.
UPDATE brew_profiles p
SET sort_order = (
  SELECT COUNT(*)
  FROM brew_profiles p2
  WHERE p2.household_id = p.household_id
    AND p2.created_at < p.created_at
);
