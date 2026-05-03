-- BrewNote initial schema
-- Run this in the Supabase SQL editor.

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE households (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  owner_id   uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE household_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households NOT NULL,
  user_id      uuid REFERENCES auth.users NOT NULL,
  joined_at    timestamptz DEFAULT now(),
  UNIQUE (household_id, user_id)
);

CREATE TABLE household_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households NOT NULL,
  token        text UNIQUE NOT NULL,
  created_by   uuid REFERENCES auth.users NOT NULL,
  expires_at   timestamptz NOT NULL,
  used         boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE beans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     uuid REFERENCES households NOT NULL,
  name             text NOT NULL,
  roaster          text NOT NULL,
  process          text,
  roast_date       date,
  total_weight_g   integer NOT NULL,
  current_weight_g integer NOT NULL,
  flavor_tags      text[] DEFAULT '{}',
  status           text CHECK (status IN ('active','archived')) DEFAULT 'active',
  added_by         uuid REFERENCES auth.users NOT NULL,
  created_at       timestamptz DEFAULT now(),
  archived_at      timestamptz
);

CREATE TABLE ratings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_id      uuid REFERENCES beans NOT NULL,
  household_id uuid REFERENCES households NOT NULL,
  user_id      uuid REFERENCES auth.users NOT NULL,
  score        numeric(2,1) CHECK (score BETWEEN 1 AND 5) NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE brew_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_id      uuid REFERENCES beans NOT NULL,
  household_id uuid REFERENCES households NOT NULL,
  user_id      uuid REFERENCES auth.users NOT NULL,
  note         text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE brew_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households NOT NULL,
  method_name  text NOT NULL,
  portion      integer NOT NULL,
  grams        integer NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE consumption_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_id         uuid REFERENCES beans NOT NULL,
  household_id    uuid REFERENCES households NOT NULL,
  user_id         uuid REFERENCES auth.users NOT NULL,
  brew_profile_id uuid REFERENCES brew_profiles,
  grams_used      integer NOT NULL,
  logged_at       timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE beans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_logs  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of a given household?
-- Used inline in policies below.

-- households: visible to owner + members; insertable by anyone (on registration)
CREATE POLICY "households_select" ON households
  FOR SELECT USING (
    owner_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = id
    )
  );

CREATE POLICY "households_insert" ON households
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "households_update" ON households
  FOR UPDATE USING (owner_id = auth.uid());

-- household_members: see your own household's members; insert on invite acceptance
CREATE POLICY "household_members_select" ON household_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM household_members hm2
      WHERE hm2.household_id = household_members.household_id
    )
  );

CREATE POLICY "household_members_insert" ON household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "household_members_delete" ON household_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR auth.uid() IN (
      SELECT owner_id FROM households WHERE id = household_id
    )
  );

-- household_invites: members of the household can manage invites
CREATE POLICY "household_invites_select" ON household_invites
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = household_invites.household_id
    )
    OR token IN (SELECT token FROM household_invites WHERE TRUE) -- public read for invite validation
  );

CREATE POLICY "household_invites_insert" ON household_invites
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = household_invites.household_id
    )
  );

CREATE POLICY "household_invites_update" ON household_invites
  FOR UPDATE USING (TRUE); -- invite acceptance needs to mark token used

-- beans: household members only
CREATE POLICY "beans_select" ON beans
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = beans.household_id
    )
  );

CREATE POLICY "beans_insert" ON beans
  FOR INSERT WITH CHECK (
    added_by = auth.uid()
    AND auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = beans.household_id
    )
  );

CREATE POLICY "beans_update" ON beans
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = beans.household_id
    )
  );

-- ratings: household members only
CREATE POLICY "ratings_select" ON ratings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = ratings.household_id
    )
  );

CREATE POLICY "ratings_insert" ON ratings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = ratings.household_id
    )
  );

-- brew_notes: household members only
CREATE POLICY "brew_notes_select" ON brew_notes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = brew_notes.household_id
    )
  );

CREATE POLICY "brew_notes_insert" ON brew_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = brew_notes.household_id
    )
  );

-- brew_profiles: household members can read; any member can modify
CREATE POLICY "brew_profiles_select" ON brew_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = brew_profiles.household_id
    )
  );

CREATE POLICY "brew_profiles_insert" ON brew_profiles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = brew_profiles.household_id
    )
  );

CREATE POLICY "brew_profiles_update" ON brew_profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = brew_profiles.household_id
    )
  );

CREATE POLICY "brew_profiles_delete" ON brew_profiles
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = brew_profiles.household_id
    )
  );

-- consumption_logs: household members only
CREATE POLICY "consumption_logs_select" ON consumption_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = consumption_logs.household_id
    )
  );

CREATE POLICY "consumption_logs_insert" ON consumption_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND auth.uid() IN (
      SELECT user_id FROM household_members WHERE household_id = consumption_logs.household_id
    )
  );
