-- Audit P2 cleanup: cheap, safe data-layer fixes from the Week 6 plan.
--
--  P2-1 — briefing_feedback (briefing_id, created_at DESC) composite index.
--    Existing index is on briefing_id alone. "Latest 5 reactions per
--    briefing" sorts an unindexed timestamp; with monthly briefing
--    rotation that becomes a table scan. Composite covers both predicates.
--
--  P2-2 — briefing_feedback DELETE policy.
--    Users can SELECT and INSERT their own feedback but the prior
--    migration didn't grant DELETE. Inconsistent CRUD; users have no way
--    to retract a reaction they didn't mean to send.
--
--  P2-3 + P2-9 (cache cleanup index + cron) deferred — the
--  ai_response_cache table referenced by supabase/functions/_shared/
--  ai-cache.ts does NOT exist in prod. The cache helper's try/catch
--  swallows the relation-missing error and returns null on every read,
--  so caching is silently disabled across every edge function that
--  uses it (lens, embeddings, model routing). That's a pre-existing
--  bug outside this batch's scope; logging it for follow-up rather
--  than fixing here, because re-introducing the table requires
--  reviewing every cache call-site and deciding TTL semantics.

-- ---------------------------------------------------------------------------
-- P2-1: briefing_feedback composite index.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_briefing_feedback_briefing_created
  ON public.briefing_feedback (briefing_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- P2-2: briefing_feedback DELETE policy.
-- ---------------------------------------------------------------------------
-- Match the SELECT/INSERT pattern: a user can act on a feedback row only
-- if its parent briefing belongs to them. We dereference briefing_id ->
-- briefings.user_id. Service role still bypasses via the existing
-- service_role policies on this table.
DROP POLICY IF EXISTS "Users can delete their own briefing feedback"
  ON public.briefing_feedback;
CREATE POLICY "Users can delete their own briefing feedback"
  ON public.briefing_feedback FOR DELETE
  TO authenticated
  USING (
    briefing_id IN (
      SELECT id FROM public.briefings WHERE user_id = auth.uid()
    )
  );

-- (P2-3 + P2-9 intentionally omitted — see header comment.)
