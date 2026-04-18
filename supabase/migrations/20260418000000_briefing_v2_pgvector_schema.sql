-- Briefing v2: pgvector + schema_version + richer feedback
--
-- Adds evidence-based relevance infrastructure:
--  * pgvector extension for embedding-based dedupe and scoring
--  * schema_version on briefings so analytics can cleanly filter v1 vs v2
--  * lens_item_id / dwell_ms / replayed on briefing_feedback so the next
--    generation can learn from per-lens-item engagement, not just tags
--
-- All column additions are idempotent and backwards-compatible; v1 rows
-- remain valid (schema_version defaults to 1, new columns are nullable).

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE briefings
  ADD COLUMN IF NOT EXISTS schema_version INT NOT NULL DEFAULT 1;

ALTER TABLE briefing_feedback
  ADD COLUMN IF NOT EXISTS lens_item_id TEXT,
  ADD COLUMN IF NOT EXISTS dwell_ms INT,
  ADD COLUMN IF NOT EXISTS replayed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_briefing_feedback_lens_item
  ON briefing_feedback (lens_item_id)
  WHERE lens_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_briefings_schema_version
  ON briefings (schema_version);

COMMENT ON COLUMN briefings.schema_version IS
  'Output-contract version. 1 = legacy prompt-flattened pipeline. 2 = evidence-based lens pipeline (segments carry lens_item_id, relevance_score, matched_profile_fact).';

COMMENT ON COLUMN briefing_feedback.lens_item_id IS
  'The LensItem id the reacted segment matched against. Used to weight future generations.';

COMMENT ON COLUMN briefing_feedback.dwell_ms IS
  'Milliseconds the user kept the segment open. Signal beyond the binary reaction.';

COMMENT ON COLUMN briefing_feedback.replayed IS
  'True if the user replayed the segment audio. Strong positive signal.';
