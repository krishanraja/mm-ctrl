-- Migration SQL for Deep Context & Meeting Prep Feature
-- Run this in your Supabase SQL Editor

-- Create company_context table for enriched company intelligence
CREATE TABLE IF NOT EXISTS public.company_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID REFERENCES public.leaders(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  apollo_data JSONB DEFAULT '{}'::jsonb,
  website_url TEXT,
  website_content TEXT,
  board_deck_urls TEXT[] DEFAULT '{}',
  board_deck_content JSONB DEFAULT '[]'::jsonb,
  calendar_connected BOOLEAN DEFAULT false,
  calendar_events JSONB DEFAULT '[]'::jsonb,
  enrichment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'partial', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meeting_prep_sessions table for generated meeting prep materials
CREATE TABLE IF NOT EXISTS public.meeting_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  company_context_id UUID REFERENCES public.company_context(id) ON DELETE SET NULL,
  meeting_title TEXT NOT NULL,
  meeting_date DATE,
  agenda_text TEXT NOT NULL,
  prep_materials JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add has_deep_context column to leader_assessments
ALTER TABLE public.leader_assessments 
ADD COLUMN IF NOT EXISTS has_deep_context BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_context_leader_id ON public.company_context(leader_id);
CREATE INDEX IF NOT EXISTS idx_company_context_assessment_id ON public.company_context(assessment_id);
CREATE INDEX IF NOT EXISTS idx_meeting_prep_sessions_assessment_id ON public.meeting_prep_sessions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_meeting_prep_sessions_company_context_id ON public.meeting_prep_sessions(company_context_id);
CREATE INDEX IF NOT EXISTS idx_meeting_prep_sessions_meeting_date ON public.meeting_prep_sessions(meeting_date);

-- Enable RLS on new tables
ALTER TABLE public.company_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_prep_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_context table
CREATE POLICY "Users can view their own company context"
  ON public.company_context FOR SELECT
  USING (
    leader_id IN (
      SELECT id FROM public.leaders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own company context"
  ON public.company_context FOR INSERT
  WITH CHECK (
    leader_id IN (
      SELECT id FROM public.leaders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own company context"
  ON public.company_context FOR UPDATE
  USING (
    leader_id IN (
      SELECT id FROM public.leaders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR id::text = auth.uid()::text
    )
  );

CREATE POLICY "Service can insert company context"
  ON public.company_context FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update company context"
  ON public.company_context FOR UPDATE
  USING (true);

-- RLS Policies for meeting_prep_sessions table
CREATE POLICY "Users can view their own meeting prep sessions"
  ON public.meeting_prep_sessions FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR l.id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own meeting prep sessions"
  ON public.meeting_prep_sessions FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own meeting prep sessions"
  ON public.meeting_prep_sessions FOR UPDATE
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR l.id::text = auth.uid()::text
    )
  );

CREATE POLICY "Service can insert meeting prep sessions"
  ON public.meeting_prep_sessions FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at on company_context
CREATE OR REPLACE FUNCTION update_company_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_context_updated_at_trigger
  BEFORE UPDATE ON public.company_context
  FOR EACH ROW
  EXECUTE FUNCTION update_company_context_updated_at();

-- Create trigger for updated_at on meeting_prep_sessions
CREATE OR REPLACE FUNCTION update_meeting_prep_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_prep_sessions_updated_at_trigger
  BEFORE UPDATE ON public.meeting_prep_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_prep_sessions_updated_at();

COMMENT ON TABLE public.company_context IS 'Stores enriched company intelligence from Apollo.io and user-provided context';
COMMENT ON TABLE public.meeting_prep_sessions IS 'Stores generated meeting prep materials combining diagnostic results with meeting agendas';
