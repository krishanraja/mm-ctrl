-- Briefing v2 Item 4: persistent semantic negative feedback.
--
-- Lens items are ephemeral — regenerated per briefing — so the canonical way
-- to persist a "don't show me stories like this" signal is by signature of
-- (type + normalized text), not by the ephemeral lens_item_id. Two signal
-- sources both land here:
--
--   1. source='kill' — explicit user tap on the "Don't show me stories like
--      this" action in SegmentCard. weight_delta = -1.0 (effectively removes
--      the item from the lens).
--   2. source='not_useful_aggregate' — automatic promotion of repeated
--      thumbs-down on the same lens signature. weight_delta = -0.4.
--
-- Unique constraint on (user_id, lens_item_signature, source) so the two
-- sources coexist independently and each one is idempotent per signature.

CREATE TABLE IF NOT EXISTS briefing_lens_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lens_item_signature TEXT NOT NULL,
  lens_item_type TEXT NOT NULL,
  lens_item_text TEXT NOT NULL,
  weight_delta NUMERIC NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('kill', 'not_useful_aggregate')),
  evidence_count INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lens_item_signature, source)
);

CREATE INDEX IF NOT EXISTS idx_briefing_lens_feedback_user_active
  ON briefing_lens_feedback (user_id)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_briefing_lens_feedback_signature
  ON briefing_lens_feedback (user_id, lens_item_signature)
  WHERE is_active;

ALTER TABLE briefing_lens_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS briefing_lens_feedback_self_select ON briefing_lens_feedback;
CREATE POLICY briefing_lens_feedback_self_select
  ON briefing_lens_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Writes go through the service-role edge functions (kill, aggregate) so end
-- users don't hand-forge rows. No INSERT/UPDATE/DELETE policies for
-- authenticated users; service role bypasses RLS implicitly.

COMMENT ON TABLE briefing_lens_feedback IS
  'Persistent negative weight deltas on lens item signatures. Feeds into buildImportanceLens to suppress or down-weight items the user has rejected.';

COMMENT ON COLUMN briefing_lens_feedback.lens_item_signature IS
  'SHA-256 hex of normalized "type|text". Stable across daily lens regenerations.';

COMMENT ON COLUMN briefing_lens_feedback.evidence_count IS
  'For aggregate rows: the number of individual not_useful reactions that contributed. Useful for diagnostics.';
