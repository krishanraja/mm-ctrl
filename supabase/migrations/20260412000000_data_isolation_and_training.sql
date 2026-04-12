-- =========================================================================
-- Data Isolation Hardening + Extraction Guardrails + Training Material
-- Branch: claude/fix-data-isolation-bugs-57cay
-- =========================================================================
-- This migration is idempotent: every CREATE uses IF NOT EXISTS and every
-- DROP POLICY uses IF EXISTS so it can be replayed safely.

-- A2. Tighten the service-role policy on user_memory. The old policy
--     (USING true WITH CHECK true) was a blank cheque that let any caller
--     satisfy the FOR ALL clause. Replace with an explicit service-role gate.
DROP POLICY IF EXISTS "Service role can manage all memory" ON public.user_memory;
CREATE POLICY "Service role can manage all memory"
  ON public.user_memory FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- B4. fact_subtype column — preferences MUST map to one of four subtypes or
--     be downgraded. Nullable for non-preference categories.
ALTER TABLE public.user_memory
  ADD COLUMN IF NOT EXISTS fact_subtype text;

COMMENT ON COLUMN public.user_memory.fact_subtype IS
  'For fact_category=preference: one of communication_style | decision_style | work_style | tool_or_method. Null for other categories.';

-- Track which training-material version a row was written under, for
-- regression triage when the anchor.yaml is edited.
ALTER TABLE public.user_memory
  ADD COLUMN IF NOT EXISTS training_material_version int DEFAULT 0;

-- B2/B6. fact_extraction_log — every reject the guardrails make gets a row.
--        This is the observability backbone for tuning the reject rules.
CREATE TABLE IF NOT EXISTS public.fact_extraction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  raw_fact jsonb NOT NULL,
  reason_id text NOT NULL,
  reason text NOT NULL,
  training_material_version int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_extraction_log_user
  ON public.fact_extraction_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fact_extraction_log_reason
  ON public.fact_extraction_log(reason_id, created_at DESC);

ALTER TABLE public.fact_extraction_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own extraction log" ON public.fact_extraction_log;
CREATE POLICY "Users can view their own extraction log"
  ON public.fact_extraction_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages extraction log" ON public.fact_extraction_log;
CREATE POLICY "Service role manages extraction log"
  ON public.fact_extraction_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- C. user_briefing_directives — simple per-user text field for personal
--    briefing rules. Free-form prose, injected verbatim under a
--    <user-directives> block in the briefing system prompt.
CREATE TABLE IF NOT EXISTS public.user_briefing_directives (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_briefing_directives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own directives" ON public.user_briefing_directives;
CREATE POLICY "Users manage their own directives"
  ON public.user_briefing_directives FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role reads directives" ON public.user_briefing_directives;
CREATE POLICY "Service role reads directives"
  ON public.user_briefing_directives FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- E1/E3. training_material — versioned store for the anchor YAML. body_raw
--        keeps the source, body_parsed holds the validated JSON for fast
--        reads. Only one row per (scope, user_id) is active at a time.
CREATE TABLE IF NOT EXISTS public.training_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global', 'cohort', 'user')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_key text,
  body_raw text NOT NULL,
  body_parsed jsonb NOT NULL,
  version int NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_material_active_global
  ON public.training_material(scope)
  WHERE scope = 'global' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_material_active_user
  ON public.training_material(scope, user_id)
  WHERE scope = 'user' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_training_material_version
  ON public.training_material(scope, version DESC);

ALTER TABLE public.training_material ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read global training material" ON public.training_material;
CREATE POLICY "Users read global training material"
  ON public.training_material FOR SELECT
  USING (scope = 'global' AND is_active = true);

DROP POLICY IF EXISTS "Users read their own training material" ON public.training_material;
CREATE POLICY "Users read their own training material"
  ON public.training_material FOR SELECT
  USING (scope = 'user' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages training material" ON public.training_material;
CREATE POLICY "Service role manages training material"
  ON public.training_material FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- A3. Quarantine any orphaned user_memory rows (null or missing user). We
--     don't delete - we flip is_current=false so the data is auditable.
UPDATE public.user_memory
SET is_current = false
WHERE user_id IS NULL
   OR user_id NOT IN (SELECT id FROM auth.users);

-- A4. Backfill: any inferred-looking fact that has verification_status=
--     'verified' without a verified_at timestamp was likely mis-seeded.
--     Drop such rows back to inferred so the stat stops reading 100%.
UPDATE public.user_memory
SET verification_status = 'inferred'
WHERE verification_status = 'verified'
  AND verified_at IS NULL
  AND is_current = true;

-- B5. Cleanup of obvious junk already stored as preferences — typography
--     rules captured as user facts. Idempotent: only touches matching rows.
UPDATE public.user_memory
SET is_current = false
WHERE is_current = true
  AND fact_category = 'preference'
  AND (
    fact_value ~* '(em\s*dash|en\s*dash|\u2014|\u2013|bullet\s*point|markdown|\bformat(?:ting)?\b|word\s*count|concise|verbose|brevity|typography)'
    OR fact_context ~* '^(don''?t|do not|avoid|never|stop|please stop|make sure you|you should)\b'
  );

-- B6. Observability view: kept vs rejected per day per reason.
CREATE OR REPLACE VIEW public.extraction_health AS
SELECT
  date_trunc('day', created_at) AS day,
  reason_id,
  COUNT(*) AS rejections,
  training_material_version
FROM public.fact_extraction_log
GROUP BY 1, 2, 4
ORDER BY 1 DESC, 3 DESC;

GRANT SELECT ON public.extraction_health TO authenticated;

COMMENT ON TABLE public.fact_extraction_log IS
  'Rejection log for every fact the guardrails drop before insertion. Drives the extraction_health view.';
COMMENT ON TABLE public.user_briefing_directives IS
  'Per-user free-form text injected under <user-directives> in the briefing system prompt.';
COMMENT ON TABLE public.training_material IS
  'Versioned store of the anchor YAML (voice, reject rules, export voice cards). Read by fact-guardrails, generate-briefing, memory-context-builder.';
