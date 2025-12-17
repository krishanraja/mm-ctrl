-- Ongoing cognition partner: longitudinal loop tables
-- Adds:
-- - leader_checkins (weekly micro check-ins)
-- - leader_decision_captures (moment-of-friction captures)
-- - leader_weekly_actions (one action per week)
-- - leader_drift_flags (drift detection outputs)
-- Also expands voice_instrumentation.module_name enum-like check.

-- 1) Expand voice instrumentation module_name constraint to support more voice surfaces
ALTER TABLE IF EXISTS public.voice_instrumentation
  DROP CONSTRAINT IF EXISTS voice_instrumentation_module_name_check;

ALTER TABLE IF EXISTS public.voice_instrumentation
  ADD CONSTRAINT voice_instrumentation_module_name_check
  CHECK (module_name IN ('compass', 'roi', 'deep_profile', 'checkin', 'capture'));

-- 2) Weekly micro-check-ins
CREATE TABLE IF NOT EXISTS public.leader_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_id UUID NULL REFERENCES public.leaders(id) ON DELETE SET NULL,
  session_id UUID NULL,

  asked_prompt_key TEXT NOT NULL DEFAULT 'weekly_default',
  transcript TEXT NOT NULL,
  extracted_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leader_checkins_user_id_created_at
  ON public.leader_checkins(user_id, created_at DESC);

-- 3) Decision captures (moment of friction)
CREATE TABLE IF NOT EXISTS public.leader_decision_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_id UUID NULL REFERENCES public.leaders(id) ON DELETE SET NULL,
  session_id UUID NULL,

  transcript TEXT NOT NULL,
  context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  three_questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_step TEXT NULL,
  watchout TEXT NULL,

  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leader_decision_captures_user_id_created_at
  ON public.leader_decision_captures(user_id, created_at DESC);

-- 4) One action per week (constraint creates action)
CREATE TABLE IF NOT EXISTS public.leader_weekly_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_id UUID NULL REFERENCES public.leaders(id) ON DELETE SET NULL,

  iso_week TEXT NOT NULL,
  action_text TEXT NOT NULL,
  why_text TEXT NULL,
  source TEXT NOT NULL DEFAULT 'generated',

  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, iso_week)
);

CREATE INDEX IF NOT EXISTS idx_leader_weekly_actions_user_id_week
  ON public.leader_weekly_actions(user_id, iso_week);

-- 5) Drift detection (advisor nudge)
CREATE TABLE IF NOT EXISTS public.leader_drift_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_id UUID NULL REFERENCES public.leaders(id) ON DELETE SET NULL,

  status TEXT NOT NULL CHECK (status IN ('ok', 'drifting', 'stale')),
  message TEXT NOT NULL,
  computed_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leader_drift_flags_user_id_computed_at
  ON public.leader_drift_flags(user_id, computed_at DESC);

-- 6) RLS
ALTER TABLE public.leader_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_decision_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_weekly_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_drift_flags ENABLE ROW LEVEL SECURITY;

-- Read/write only own rows (works for anonymous + logged-in sessions)
CREATE POLICY "leader_checkins_own_rows"
  ON public.leader_checkins
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leader_decision_captures_own_rows"
  ON public.leader_decision_captures
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leader_weekly_actions_own_rows"
  ON public.leader_weekly_actions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "leader_drift_flags_own_rows"
  ON public.leader_drift_flags
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

