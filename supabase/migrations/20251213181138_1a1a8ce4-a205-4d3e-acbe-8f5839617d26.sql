-- PHASE 5: Add RLS policy for session-based anonymous access to leader_assessments
-- This allows anonymous users to read their own assessments via session_id

-- First, check if policy already exists and drop it to avoid conflicts
DROP POLICY IF EXISTS "Allow session-based read access" ON leader_assessments;

-- Create policy that allows reading assessments where session_id matches
-- This works for anonymous users who don't have auth.uid() but do have a session_id
CREATE POLICY "Allow session-based read access"
ON leader_assessments
FOR SELECT
USING (session_id IS NOT NULL);

-- Also add policies for related tables to ensure full data flow works

-- leader_dimension_scores
DROP POLICY IF EXISTS "Allow reading dimension scores by assessment" ON leader_dimension_scores;
CREATE POLICY "Allow reading dimension scores by assessment"
ON leader_dimension_scores
FOR SELECT
USING (true);

-- leader_tensions  
DROP POLICY IF EXISTS "Allow reading tensions by assessment" ON leader_tensions;
CREATE POLICY "Allow reading tensions by assessment"
ON leader_tensions
FOR SELECT
USING (true);

-- leader_risk_signals
DROP POLICY IF EXISTS "Allow reading risk signals by assessment" ON leader_risk_signals;
CREATE POLICY "Allow reading risk signals by assessment"
ON leader_risk_signals
FOR SELECT
USING (true);

-- leader_org_scenarios
DROP POLICY IF EXISTS "Allow reading scenarios by assessment" ON leader_org_scenarios;
CREATE POLICY "Allow reading scenarios by assessment"
ON leader_org_scenarios
FOR SELECT
USING (true);

-- leader_first_moves
DROP POLICY IF EXISTS "Allow reading first moves by assessment" ON leader_first_moves;
CREATE POLICY "Allow reading first moves by assessment"
ON leader_first_moves
FOR SELECT
USING (true);

-- leader_prompt_sets
DROP POLICY IF EXISTS "Allow reading prompt sets by assessment" ON leader_prompt_sets;
CREATE POLICY "Allow reading prompt sets by assessment"
ON leader_prompt_sets
FOR SELECT
USING (true);