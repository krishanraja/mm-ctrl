-- Briefing v2 Item 2: user-declared briefing interests.
--
-- Beats (topics) and entities (people/companies) become lens items with
-- weight 1.0, seeding the importance lens directly from user intent rather
-- than inferred signals. Exclusions post-filter the candidate pool so the
-- user can permanently kill topics they don't want to see.
--
-- Kept in a dedicated table, NOT user_memory: these are declared
-- preferences with their own UX + lifecycle + explicit kind enum. Mixing
-- with AI-extracted facts complicates both systems.

CREATE TABLE IF NOT EXISTS briefing_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('beat', 'entity', 'exclude')),
  text TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefing_interests_user_active
  ON briefing_interests (user_id)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_briefing_interests_user_kind
  ON briefing_interests (user_id, kind)
  WHERE is_active;

ALTER TABLE briefing_interests ENABLE ROW LEVEL SECURITY;

-- Users fully manage their own rows. Service role bypasses RLS implicitly.
DROP POLICY IF EXISTS briefing_interests_self_select ON briefing_interests;
CREATE POLICY briefing_interests_self_select
  ON briefing_interests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS briefing_interests_self_insert ON briefing_interests;
CREATE POLICY briefing_interests_self_insert
  ON briefing_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS briefing_interests_self_update ON briefing_interests;
CREATE POLICY briefing_interests_self_update
  ON briefing_interests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS briefing_interests_self_delete ON briefing_interests;
CREATE POLICY briefing_interests_self_delete
  ON briefing_interests FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE briefing_interests IS
  'User-declared interests that seed the importance lens. beat = topic, entity = person/company, exclude = never-show-me.';

COMMENT ON COLUMN briefing_interests.source IS
  'Provenance: manual (user added), seed_accepted (tapped an industry seed), feedback_promoted (system promoted from repeated likes).';
