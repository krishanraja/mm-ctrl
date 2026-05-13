-- Phase C of the UX overhaul: persist generated drafts/exports/frameworks/
-- briefings/skills so users can find them again. Today the only thing that
-- survives a sheet close is the skill ZIP on disk; everything else vanishes.
--
-- This is intentionally one table, not five: every artifact is a markdown
-- body plus a kind discriminator plus a tiny metadata blob. Skills carry a
-- zip_filename so the install flow can re-trigger; drafts/frameworks carry
-- the source seed reference; briefings carry the briefing_type and
-- generation parameters.

CREATE TABLE IF NOT EXISTS public.generated_artifacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN (
                'skill', 'draft', 'export', 'framework', 'briefing_custom'
              )),
  name        text NOT NULL,
  body        text NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_artifacts_user_created
  ON public.generated_artifacts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_artifacts_user_kind
  ON public.generated_artifacts(user_id, kind);

ALTER TABLE public.generated_artifacts ENABLE ROW LEVEL SECURITY;

-- Read own artifacts
DROP POLICY IF EXISTS "users read own artifacts" ON public.generated_artifacts;
CREATE POLICY "users read own artifacts"
  ON public.generated_artifacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own artifacts (edge functions use service role; this policy is for
-- any future client-side writes, e.g. local-only library entries)
DROP POLICY IF EXISTS "users insert own artifacts" ON public.generated_artifacts;
CREATE POLICY "users insert own artifacts"
  ON public.generated_artifacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete own artifacts (Library lets users remove items)
DROP POLICY IF EXISTS "users delete own artifacts" ON public.generated_artifacts;
CREATE POLICY "users delete own artifacts"
  ON public.generated_artifacts
  FOR DELETE
  USING (auth.uid() = user_id);
