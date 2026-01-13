-- User Memory System: Voice-First Context Extraction & Verification
-- Purpose: Store extracted facts about users from voice conversations with confidence scoring

-- Create fact category enum
CREATE TYPE public.fact_category AS ENUM (
  'identity',      -- role, title, department, seniority
  'business',      -- company, vertical, size, stage
  'objective',     -- goals, priorities, success metrics
  'blocker',       -- personal, team, org challenges
  'preference'     -- communication style, decision making
);

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM (
  'inferred',      -- AI extracted, not yet verified
  'verified',      -- User confirmed
  'corrected',     -- User edited
  'rejected'       -- User said this is wrong
);

-- Create source type enum
CREATE TYPE public.memory_source_type AS ENUM (
  'voice',         -- Voice transcript
  'form',          -- Form input
  'linkedin',      -- LinkedIn import
  'calendar',      -- Calendar integration
  'enrichment'     -- Apollo/company enrichment
);

-- Main user memory table
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Fact identity
  fact_key TEXT NOT NULL,                    -- e.g., "role", "company", "blocker_1"
  fact_category public.fact_category NOT NULL,
  fact_label TEXT NOT NULL,                  -- Human-readable label: "Your Role"
  
  -- Fact content
  fact_value TEXT NOT NULL,                  -- The actual extracted value
  fact_context TEXT,                         -- Original transcript snippet that led to extraction
  
  -- Confidence & verification
  confidence_score NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  is_high_stakes BOOLEAN DEFAULT false,      -- Should be verified by user
  verification_status public.verification_status DEFAULT 'inferred',
  verified_at TIMESTAMPTZ,
  
  -- Provenance
  source_type public.memory_source_type NOT NULL DEFAULT 'voice',
  source_session_id UUID,
  source_transcript_id UUID,
  
  -- Temporal versioning
  is_current BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES public.user_memory(id),
  supersedes UUID REFERENCES public.user_memory(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_memory_user_id ON public.user_memory(user_id);
CREATE INDEX idx_user_memory_category ON public.user_memory(fact_category);
CREATE INDEX idx_user_memory_current ON public.user_memory(user_id, is_current) WHERE is_current = true;
CREATE INDEX idx_user_memory_verification ON public.user_memory(verification_status);
CREATE INDEX idx_user_memory_high_stakes ON public.user_memory(user_id, is_high_stakes) WHERE is_high_stakes = true AND verification_status = 'inferred';

-- Enable RLS
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own memory"
  ON public.user_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory"
  ON public.user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory"
  ON public.user_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all memory"
  ON public.user_memory FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_memory_updated_at_trigger
  BEFORE UPDATE ON public.user_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_updated_at();

-- Function to get current memory for a user (verified + high confidence inferred)
CREATE OR REPLACE FUNCTION get_user_memory_context(p_user_id UUID)
RETURNS TABLE (
  fact_key TEXT,
  fact_category public.fact_category,
  fact_label TEXT,
  fact_value TEXT,
  confidence_score NUMERIC,
  verification_status public.verification_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.fact_key,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.confidence_score,
    um.verification_status
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
    AND um.is_current = true
    AND (
      um.verification_status IN ('verified', 'corrected')
      OR um.confidence_score >= 0.7
    )
  ORDER BY 
    CASE um.verification_status 
      WHEN 'verified' THEN 1 
      WHEN 'corrected' THEN 2 
      ELSE 3 
    END,
    um.fact_category,
    um.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending verifications
CREATE OR REPLACE FUNCTION get_pending_verifications(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  fact_key TEXT,
  fact_category public.fact_category,
  fact_label TEXT,
  fact_value TEXT,
  fact_context TEXT,
  confidence_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id,
    um.fact_key,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.fact_context,
    um.confidence_score
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
    AND um.is_current = true
    AND um.is_high_stakes = true
    AND um.verification_status = 'inferred'
  ORDER BY um.confidence_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify a fact
CREATE OR REPLACE FUNCTION verify_memory_fact(
  p_fact_id UUID,
  p_new_value TEXT DEFAULT NULL,
  p_is_correct BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id for the fact
  SELECT user_id INTO v_user_id FROM public.user_memory WHERE id = p_fact_id;
  
  -- Verify ownership
  IF v_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  IF p_is_correct AND p_new_value IS NULL THEN
    -- User confirmed the fact as-is
    UPDATE public.user_memory
    SET verification_status = 'verified',
        verified_at = now()
    WHERE id = p_fact_id;
  ELSIF p_is_correct AND p_new_value IS NOT NULL THEN
    -- User corrected the fact
    UPDATE public.user_memory
    SET verification_status = 'corrected',
        fact_value = p_new_value,
        verified_at = now()
    WHERE id = p_fact_id;
  ELSE
    -- User rejected the fact
    UPDATE public.user_memory
    SET verification_status = 'rejected',
        is_current = false,
        verified_at = now()
    WHERE id = p_fact_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_memory_context TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION verify_memory_fact TO authenticated;

COMMENT ON TABLE public.user_memory IS 'Stores extracted facts about users from voice conversations with confidence scoring and verification status';
