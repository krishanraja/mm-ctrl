-- Close the wide-open RLS policies on the assessment schema.
--
-- Discovery during the data-path audit (Week 2):
-- Each of the 6 assessment-child tables had a policy whose USING clause was
-- literally `true` — meaning anyone (including anon) could SELECT all rows.
-- The proper "Users can view their own X" policies already existed but were
-- being shadowed (Postgres OR's policies; the loosest wins). The leader_
-- assessments table had a similar leak via "Allow session-based read access"
-- (USING session_id IS NOT NULL), introduced in 20250128000000 as a stated
-- temporary measure.
--
-- This migration removes the loose policies. The existing per-user policies
-- (which join leader_assessments → leaders → auth.users on email) become
-- the effective access rule. No new policies are added — the proper ones
-- have been there the whole time.
--
-- Verified pre-migration: 89 of 89 leader_assessments rows have leader_id
-- set, so no anonymous-funnel data is orphaned by tightening the rules.

-- leader_assessments: drop the session-based read.
DROP POLICY IF EXISTS "Allow session-based read access"
  ON public.leader_assessments;

-- 6 child tables: drop the always-true policies (public read + by-assessment).
DROP POLICY IF EXISTS "Allow public read access to dimension scores"
  ON public.leader_dimension_scores;
DROP POLICY IF EXISTS "Allow reading dimension scores by assessment"
  ON public.leader_dimension_scores;

DROP POLICY IF EXISTS "Allow public read access to risk signals"
  ON public.leader_risk_signals;
DROP POLICY IF EXISTS "Allow reading risk signals by assessment"
  ON public.leader_risk_signals;

DROP POLICY IF EXISTS "Allow public read access to tensions"
  ON public.leader_tensions;
DROP POLICY IF EXISTS "Allow reading tensions by assessment"
  ON public.leader_tensions;

DROP POLICY IF EXISTS "Allow public read access to org scenarios"
  ON public.leader_org_scenarios;
DROP POLICY IF EXISTS "Allow reading scenarios by assessment"
  ON public.leader_org_scenarios;

DROP POLICY IF EXISTS "Allow public read access to first moves"
  ON public.leader_first_moves;
DROP POLICY IF EXISTS "Allow reading first moves by assessment"
  ON public.leader_first_moves;

DROP POLICY IF EXISTS "Allow public read access to prompt sets"
  ON public.leader_prompt_sets;
DROP POLICY IF EXISTS "Allow reading prompt sets by assessment"
  ON public.leader_prompt_sets;

-- Note for future audits: the surviving "Users can view their own X" policies
-- match on leaders.email = (auth.users where id = auth.uid()).email — not
-- leaders.user_id. That's how the existing data is keyed; if a future
-- migration normalises to leaders.user_id NOT NULL, those USING clauses
-- should be simplified to (leader_id IN (SELECT id FROM leaders WHERE user_id = auth.uid())).
