-- Allow anyone to read a household's name when a valid (unused, non-expired)
-- invite exists for it. This lets the InvitePage show the real household name
-- to users who are not yet members.
CREATE POLICY "households_select_via_invite" ON households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM household_invites
      WHERE used = false AND expires_at > now()
    )
  );
