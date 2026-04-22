-- Briefing redesign: staging table for medium-confidence interests inferred
-- from user_memory by infer-briefing-interests edge function.
--
-- High-confidence inferences (>= 0.85) go directly into briefing_interests
-- with source='inferred_auto'. Medium-confidence (0.55..0.85) land here so
-- the user can one-tap accept or dismiss them on the Briefing tab. This
-- keeps the "don't ask twice" principle while avoiding noisy false positives
-- in the live interests set.

CREATE TABLE IF NOT EXISTS suggested_briefing_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('beat', 'entity', 'exclude')),
  text TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'inferred_suggested',
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_suggested_briefing_interests_kind_text
  ON suggested_briefing_interests (user_id, kind, lower(text));

CREATE INDEX IF NOT EXISTS idx_suggested_briefing_interests_user_open
  ON suggested_briefing_interests (user_id)
  WHERE accepted_at IS NULL AND dismissed_at IS NULL;

ALTER TABLE suggested_briefing_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suggested_briefing_interests_self_select ON suggested_briefing_interests;
CREATE POLICY suggested_briefing_interests_self_select
  ON suggested_briefing_interests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS suggested_briefing_interests_self_update ON suggested_briefing_interests;
CREATE POLICY suggested_briefing_interests_self_update
  ON suggested_briefing_interests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts come from service-role edge functions; no client INSERT policy.

COMMENT ON TABLE suggested_briefing_interests IS
  'Medium-confidence (0.55..0.85) interests inferred from user_memory. User accepts to promote to briefing_interests, or dismisses.';

COMMENT ON COLUMN suggested_briefing_interests.confidence IS
  'LLM-reported confidence 0..1. Suggested when 0.55..0.85; auto-added directly to briefing_interests when >= 0.85.';
