-- Add INSERT/UPDATE/DELETE RLS policies for assessment tables
-- P1-6: Assessment tables have SELECT policies but missing write policies

-- Leader Assessments: Add write policies
-- Note: leader_assessments already has owner_user_id from migration 20251216200000

-- Allow users to insert their own assessments
CREATE POLICY "leader_assessments_insert_own"
  ON public.leader_assessments
  FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid()
  );

-- Allow users to update their own assessments
CREATE POLICY "leader_assessments_update_own"
  ON public.leader_assessments
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Allow users to delete their own assessments (GDPR compliance)
CREATE POLICY "leader_assessments_delete_own"
  ON public.leader_assessments
  FOR DELETE
  USING (owner_user_id = auth.uid());

-- Leader Dimension Scores: Add write policies
CREATE POLICY "leader_dimension_scores_insert_own"
  ON public.leader_dimension_scores
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_dimension_scores_update_own"
  ON public.leader_dimension_scores
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_dimension_scores_delete_own"
  ON public.leader_dimension_scores
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

-- Leader Risk Signals: Add write policies
CREATE POLICY "leader_risk_signals_insert_own"
  ON public.leader_risk_signals
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_risk_signals_update_own"
  ON public.leader_risk_signals
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_risk_signals_delete_own"
  ON public.leader_risk_signals
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

-- Leader Tensions: Add write policies
CREATE POLICY "leader_tensions_insert_own"
  ON public.leader_tensions
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_tensions_update_own"
  ON public.leader_tensions
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_tensions_delete_own"
  ON public.leader_tensions
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

-- Leader Org Scenarios: Add write policies
CREATE POLICY "leader_org_scenarios_insert_own"
  ON public.leader_org_scenarios
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_org_scenarios_update_own"
  ON public.leader_org_scenarios
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_org_scenarios_delete_own"
  ON public.leader_org_scenarios
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

-- Leader First Moves: Add write policies
CREATE POLICY "leader_first_moves_insert_own"
  ON public.leader_first_moves
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_first_moves_update_own"
  ON public.leader_first_moves
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_first_moves_delete_own"
  ON public.leader_first_moves
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

-- Leader Prompt Sets: Add write policies
CREATE POLICY "leader_prompt_sets_insert_own"
  ON public.leader_prompt_sets
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_prompt_sets_update_own"
  ON public.leader_prompt_sets
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "leader_prompt_sets_delete_own"
  ON public.leader_prompt_sets
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
    )
  );

-- Leader Insights: Enable RLS if not already and add policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'leader_insights' 
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'leader_insights table does not exist, skipping';
  ELSE
    ALTER TABLE public.leader_insights ENABLE ROW LEVEL SECURITY;
    
    -- Check if policy exists before creating
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'leader_insights' 
      AND policyname = 'leader_insights_select_own'
    ) THEN
      EXECUTE 'CREATE POLICY "leader_insights_select_own"
        ON public.leader_insights
        FOR SELECT
        USING (
          assessment_id IN (
            SELECT id FROM leader_assessments WHERE owner_user_id = auth.uid()
          )
        )';
    END IF;
  END IF;
END $$;


