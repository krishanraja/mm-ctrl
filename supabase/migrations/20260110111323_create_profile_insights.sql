-- Create profile_insights table and enhance leader_dimension_scores
-- Purpose: Store rich insights as a second layer capturing meaning in context
-- This enables compound knowledge building across all user interactions

-- 1. Create profile_insights table
CREATE TABLE IF NOT EXISTS public.profile_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Profile and source linking
  profile_id UUID NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
  source_event_id UUID REFERENCES public.assessment_events(id) ON DELETE SET NULL,
  source_event_ids UUID[] DEFAULT '{}', -- Array of event IDs that contributed to this insight
  
  -- Insight dimensions
  dimension_name TEXT NOT NULL, -- e.g. 'ai_posture', 'risk_appetite', 'momentum', 'learning_style'
  dimension_key TEXT, -- Links to insight_dimensions table if it exists
  
  -- Scores and labels
  score NUMERIC CHECK (score >= 0 AND score <= 100), -- 0-100 or 1-5 scale
  label TEXT, -- e.g. "AI-aware", "high urgency", "experimental"
  
  -- Rich context
  llm_summary TEXT, -- 1-3 sentences summarizing the insight
  context_snapshot JSONB DEFAULT '{}', -- Key inputs used to generate this insight
  evidence TEXT[] DEFAULT '{}', -- Array of evidence strings supporting this insight
  
  -- Metadata
  tool_name TEXT, -- Which tool/flow generated this (leaders/teams/partners)
  flow_name TEXT, -- Specific flow within the tool
  generated_by TEXT DEFAULT 'system', -- 'system', 'llm', 'deterministic'
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Confidence and quality
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  surprise_factor TEXT, -- 'high', 'medium', 'low' - unexpected insights
  contradiction_flag BOOLEAN DEFAULT FALSE, -- True if this contradicts other insights
  
  -- Expiration (for time-sensitive insights)
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_insights_profile_id 
  ON public.profile_insights(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_insights_dimension_name 
  ON public.profile_insights(dimension_name);

CREATE INDEX IF NOT EXISTS idx_profile_insights_dimension_key 
  ON public.profile_insights(dimension_key) 
  WHERE dimension_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_insights_tool_name 
  ON public.profile_insights(tool_name) 
  WHERE tool_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_insights_generated_at 
  ON public.profile_insights(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_insights_source_event_ids 
  ON public.profile_insights USING GIN(source_event_ids);

-- Enable RLS
ALTER TABLE public.profile_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view insights for their own profile
CREATE POLICY "Users can view insights for their own profile"
  ON public.profile_insights
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.leaders 
      WHERE user_id = auth.uid() 
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Service role can manage all insights
CREATE POLICY "Service can manage profile insights"
  ON public.profile_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Enhance leader_dimension_scores with insight fields
ALTER TABLE public.leader_dimension_scores
  ADD COLUMN IF NOT EXISTS llm_summary TEXT,
  ADD COLUMN IF NOT EXISTS context_snapshot JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evidence TEXT[] DEFAULT '{}';

-- Add index on llm_summary for full-text search (if needed)
-- CREATE INDEX IF NOT EXISTS idx_dimension_scores_llm_summary 
--   ON public.leader_dimension_scores USING GIN(to_tsvector('english', llm_summary))
--   WHERE llm_summary IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.profile_insights IS 
  'Rich insights layer capturing meaning in context. Second layer beyond dimension_scores, storing LLM-generated insights, evidence, and context snapshots. Enables compound knowledge building.';

COMMENT ON COLUMN public.profile_insights.dimension_name IS 
  'Core dimension name (e.g. ai_posture, data_posture, value_pressure, decision_cadence, sponsor_strength, willingness). Maps to insight_dimensions if that table exists.';

COMMENT ON COLUMN public.profile_insights.context_snapshot IS 
  'JSONB snapshot of key inputs used to generate this insight. Enables understanding how the insight was derived.';

COMMENT ON COLUMN public.profile_insights.source_event_ids IS 
  'Array of assessment_event IDs that contributed to this insight. Enables full traceability back to raw user inputs.';

COMMENT ON COLUMN public.leader_dimension_scores.llm_summary IS 
  'LLM-generated summary explaining this dimension score. Provides context beyond the numeric score.';

COMMENT ON COLUMN public.leader_dimension_scores.context_snapshot IS 
  'JSONB snapshot of key inputs used to calculate this dimension score. Enables transparency and debugging.';

COMMENT ON COLUMN public.leader_dimension_scores.evidence IS 
  'Array of evidence strings supporting this dimension score. Links back to specific user responses.';

-- Create trigger for updated_at on profile_insights
CREATE OR REPLACE FUNCTION update_profile_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_insights_updated_at_trigger
  BEFORE UPDATE ON public.profile_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_insights_updated_at();

-- Create function to get latest insights for a profile by dimension
CREATE OR REPLACE FUNCTION get_latest_profile_insights(
  p_profile_id UUID,
  p_dimension_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  dimension_name TEXT,
  score NUMERIC,
  label TEXT,
  llm_summary TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  tool_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.dimension_name,
    pi.score,
    pi.label,
    pi.llm_summary,
    pi.generated_at,
    pi.tool_name
  FROM public.profile_insights pi
  WHERE pi.profile_id = p_profile_id
    AND (p_dimension_name IS NULL OR pi.dimension_name = p_dimension_name)
    AND (pi.expires_at IS NULL OR pi.expires_at > NOW())
  ORDER BY pi.generated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_profile_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_profile_insights TO service_role;
