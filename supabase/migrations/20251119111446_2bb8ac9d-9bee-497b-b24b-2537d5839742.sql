-- Phase 1: Create leader-centric database schema for AI Leadership Growth Benchmark v2

-- Create leaders table
CREATE TABLE IF NOT EXISTS public.leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT,
  company TEXT,
  company_size_band TEXT,
  primary_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leader_assessments table
CREATE TABLE IF NOT EXISTS public.leader_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID REFERENCES public.leaders(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('quiz', 'voice')),
  benchmark_score INTEGER CHECK (benchmark_score >= 0 AND benchmark_score <= 100),
  benchmark_tier TEXT CHECK (benchmark_tier IN ('AI-Emerging', 'AI-Aware', 'AI-Confident', 'AI-Orchestrator')),
  learning_style TEXT,
  has_deep_profile BOOLEAN DEFAULT false,
  has_full_diagnostic BOOLEAN DEFAULT false,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leader_dimension_scores table
CREATE TABLE IF NOT EXISTS public.leader_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  dimension_key TEXT NOT NULL CHECK (dimension_key IN ('ai_fluency', 'decision_velocity', 'experimentation_cadence', 'delegation_augmentation', 'alignment_communication', 'risk_governance')),
  score_numeric INTEGER CHECK (score_numeric >= 0 AND score_numeric <= 100),
  dimension_tier TEXT CHECK (dimension_tier IN ('AI-Emerging', 'AI-Aware', 'AI-Confident', 'AI-Orchestrator')),
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leader_tensions table
CREATE TABLE IF NOT EXISTS public.leader_tensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  dimension_key TEXT NOT NULL,
  summary_line TEXT NOT NULL,
  priority_rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leader_risk_signals table
CREATE TABLE IF NOT EXISTS public.leader_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  risk_key TEXT NOT NULL CHECK (risk_key IN ('shadow_ai', 'skills_gap', 'roi_leakage', 'decision_friction')),
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  priority_rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leader_org_scenarios table
CREATE TABLE IF NOT EXISTS public.leader_org_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  scenario_key TEXT NOT NULL CHECK (scenario_key IN ('stagnation_loop', 'shadow_ai_instability', 'high_velocity_path', 'culture_capability_mismatch')),
  summary TEXT NOT NULL,
  priority_rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leader_first_moves table
CREATE TABLE IF NOT EXISTS public.leader_first_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  move_number INTEGER NOT NULL CHECK (move_number IN (1, 2, 3)),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(assessment_id, move_number)
);

-- Create leader_prompt_sets table
CREATE TABLE IF NOT EXISTS public.leader_prompt_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  category_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  what_its_for TEXT,
  when_to_use TEXT,
  how_to_use TEXT,
  prompts_json JSONB DEFAULT '[]'::jsonb,
  priority_rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leader_assessments_leader_id ON public.leader_assessments(leader_id);
CREATE INDEX IF NOT EXISTS idx_leader_assessments_session_id ON public.leader_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_leader_dimension_scores_assessment_id ON public.leader_dimension_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leader_tensions_assessment_id ON public.leader_tensions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leader_risk_signals_assessment_id ON public.leader_risk_signals(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leader_org_scenarios_assessment_id ON public.leader_org_scenarios(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leader_first_moves_assessment_id ON public.leader_first_moves(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leader_prompt_sets_assessment_id ON public.leader_prompt_sets(assessment_id);

-- Enable RLS on all tables
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_tensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_org_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_first_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_prompt_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leaders table
CREATE POLICY "Users can view their own leader profile"
  ON public.leaders FOR SELECT
  USING (auth.uid()::text = id::text OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own leader profile"
  ON public.leaders FOR INSERT
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own leader profile"
  ON public.leaders FOR UPDATE
  USING (auth.uid()::text = id::text OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for leader_assessments table
CREATE POLICY "Users can view their own assessments"
  ON public.leader_assessments FOR SELECT
  USING (
    leader_id IN (SELECT id FROM public.leaders WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    OR leader_id IN (SELECT id FROM public.leaders WHERE id::text = auth.uid()::text)
  );

CREATE POLICY "Users can insert their own assessments"
  ON public.leader_assessments FOR INSERT
  WITH CHECK (
    leader_id IN (SELECT id FROM public.leaders WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update their own assessments"
  ON public.leader_assessments FOR UPDATE
  USING (
    leader_id IN (SELECT id FROM public.leaders WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- RLS Policies for leader_dimension_scores table
CREATE POLICY "Users can view their own dimension scores"
  ON public.leader_dimension_scores FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service can insert dimension scores"
  ON public.leader_dimension_scores FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leader_tensions table
CREATE POLICY "Users can view their own tensions"
  ON public.leader_tensions FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service can insert tensions"
  ON public.leader_tensions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leader_risk_signals table
CREATE POLICY "Users can view their own risk signals"
  ON public.leader_risk_signals FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service can insert risk signals"
  ON public.leader_risk_signals FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leader_org_scenarios table
CREATE POLICY "Users can view their own org scenarios"
  ON public.leader_org_scenarios FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service can insert org scenarios"
  ON public.leader_org_scenarios FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leader_first_moves table
CREATE POLICY "Users can view their own first moves"
  ON public.leader_first_moves FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service can insert first moves"
  ON public.leader_first_moves FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leader_prompt_sets table
CREATE POLICY "Users can view their own prompt sets"
  ON public.leader_prompt_sets FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service can insert prompt sets"
  ON public.leader_prompt_sets FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at on leaders
CREATE OR REPLACE FUNCTION update_leaders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaders_updated_at_trigger
  BEFORE UPDATE ON public.leaders
  FOR EACH ROW
  EXECUTE FUNCTION update_leaders_updated_at();

-- Create trigger for updated_at on leader_assessments
CREATE OR REPLACE FUNCTION update_leader_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leader_assessments_updated_at_trigger
  BEFORE UPDATE ON public.leader_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_leader_assessments_updated_at();