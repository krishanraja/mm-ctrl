-- Create the missing ai_response_cache table.
--
-- The supabase/functions/_shared/ai-cache.ts helper has been deployed
-- since at least early 2025 and is called from briefing-lens, briefing-
-- scoring (lens item embeddings), model-router, AA cache, and a few
-- other places. Each call-site specifies its own TTL via the helper's
-- cacheTtlMs parameter, so there's nothing global to decide here — the
-- table just needs to exist for the helper's queries to succeed.
--
-- Until now the helper's try/catch swallowed the missing-relation error
-- on every read and every write, so cache was permanently disabled
-- (every getCachedResponse returned null; every setCachedResponse
-- logged-and-shrugged). With this table in place caching actually works,
-- which immediately reduces external-API spend on the briefing pipeline
-- (lens reweight, embedding lookups, AA model benchmarks).
--
-- Schema is minimal and append-only. Cleanup is via a DELETE expires_at
-- < now() pattern — see cleanupExpiredCache in ai-cache.ts. Wire to
-- pg_cron (15 4 * * *) once we have a maintenance window picked.

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash  TEXT NOT NULL,
  model        TEXT NOT NULL,
  response     JSONB NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Read path: getCachedResponse queries (prompt_hash, model) with an
-- expires_at floor and an ORDER BY created_at DESC LIMIT 1. The composite
-- index covers all three predicates without a separate sort.
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_lookup
  ON public.ai_response_cache (prompt_hash, model, expires_at DESC);

-- Cleanup path: DELETE WHERE expires_at < NOW(). Range scan benefits
-- from a btree on expires_at alone.
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires_at
  ON public.ai_response_cache (expires_at);

-- This table is service-role only — every call-site uses the service-
-- role supabase client. No end-user access path. RLS-on with no
-- authenticated policy = service-role-only by default.
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Explicit service-role policy guarantees the table stays write-able
-- by edge functions even if Supabase changes its bypass defaults.
DROP POLICY IF EXISTS "service_role_only_ai_response_cache"
  ON public.ai_response_cache;
CREATE POLICY "service_role_only_ai_response_cache"
  ON public.ai_response_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.ai_response_cache IS
  'AI response cache. Per-call-site TTL via expires_at; cleanup via DELETE WHERE expires_at < NOW(). Service-role only.';
