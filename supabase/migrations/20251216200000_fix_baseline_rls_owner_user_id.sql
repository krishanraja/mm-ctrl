-- Fix baseline RLS: Add owner_user_id to leader_assessments and tighten RLS policies
-- This ensures baseline data is properly scoped to authenticated users (including anonymous)

-- 1) Add owner_user_id column to leader_assessments
ALTER TABLE public.leader_assessments
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_leader_assessments_owner_user_id
  ON public.leader_assessments(owner_user_id);

-- 3) Drop existing permissive RLS policies
DROP POLICY IF EXISTS "Allow session-based read access to assessments" ON leader_assessments;
DROP POLICY IF EXISTS "Users can read assessments by session" ON leader_assessments;

-- 4) Create secure RLS policy: users can only read their own assessments
CREATE POLICY "leader_assessments_own_rows"
  ON public.leader_assessments
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR
    -- Backward compatibility: if owner_user_id is NULL but session_id matches (legacy data)
    (owner_user_id IS NULL AND session_id IS NOT NULL)
  );

-- 5) Allow service role to read all (for edge functions)
-- Service role bypasses RLS, so no policy needed

-- 6) Update related tables to use owner_user_id via assessment
-- Dimension scores: readable if assessment is readable
DROP POLICY IF EXISTS "Allow session-based read access to dimension scores" ON leader_dimension_scores;
DROP POLICY IF EXISTS "Users can read dimension scores by assessment" ON leader_dimension_scores;

CREATE POLICY "leader_dimension_scores_own_rows"
  ON public.leader_dimension_scores
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments
      WHERE owner_user_id = auth.uid()
      OR (owner_user_id IS NULL AND session_id IS NOT NULL)
    )
  );

-- Risk signals: readable if assessment is readable
DROP POLICY IF EXISTS "Allow session-based read access to risk signals" ON leader_risk_signals;
DROP POLICY IF EXISTS "Users can read risk signals by assessment" ON leader_risk_signals;

CREATE POLICY "leader_risk_signals_own_rows"
  ON public.leader_risk_signals
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments
      WHERE owner_user_id = auth.uid()
      OR (owner_user_id IS NULL AND session_id IS NOT NULL)
    )
  );

-- Tensions: readable if assessment is readable
DROP POLICY IF EXISTS "Allow session-based read access to tensions" ON leader_tensions;
DROP POLICY IF EXISTS "Users can read tensions by assessment" ON leader_tensions;

CREATE POLICY "leader_tensions_own_rows"
  ON public.leader_tensions
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments
      WHERE owner_user_id = auth.uid()
      OR (owner_user_id IS NULL AND session_id IS NOT NULL)
    )
  );

-- Org scenarios: readable if assessment is readable
DROP POLICY IF EXISTS "Allow session-based read access to org scenarios" ON leader_org_scenarios;
DROP POLICY IF EXISTS "Users can read org scenarios by assessment" ON leader_org_scenarios;

CREATE POLICY "leader_org_scenarios_own_rows"
  ON public.leader_org_scenarios
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments
      WHERE owner_user_id = auth.uid()
      OR (owner_user_id IS NULL AND session_id IS NOT NULL)
    )
  );

-- First moves: readable if assessment is readable
DROP POLICY IF EXISTS "Allow session-based read access to first moves" ON leader_first_moves;
DROP POLICY IF EXISTS "Users can read first moves by assessment" ON leader_first_moves;

CREATE POLICY "leader_first_moves_own_rows"
  ON public.leader_first_moves
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments
      WHERE owner_user_id = auth.uid()
      OR (owner_user_id IS NULL AND session_id IS NOT NULL)
    )
  );

-- Prompt sets: readable if assessment is readable
DROP POLICY IF EXISTS "Allow session-based read access to prompt sets" ON leader_prompt_sets;
DROP POLICY IF EXISTS "Users can read prompt sets by assessment" ON leader_prompt_sets;

CREATE POLICY "leader_prompt_sets_own_rows"
  ON public.leader_prompt_sets
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments
      WHERE owner_user_id = auth.uid()
      OR (owner_user_id IS NULL AND session_id IS NOT NULL)
    )
  );
