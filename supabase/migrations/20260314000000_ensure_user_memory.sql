-- Ensure user_memory table exists (safe to run multiple times)
-- This migration creates the table if it doesn't exist

DO $$ 
BEGIN
  -- Create fact_category enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fact_category') THEN
    CREATE TYPE public.fact_category AS ENUM (
      'identity', 'business', 'objective', 'blocker', 'preference'
    );
  END IF;
  
  -- Create verification_status enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM (
      'inferred', 'verified', 'corrected', 'rejected'
    );
  END IF;
  
  -- Create memory_source_type enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_source_type') THEN
    CREATE TYPE public.memory_source_type AS ENUM (
      'voice', 'form', 'linkedin', 'calendar', 'enrichment'
    );
  END IF;
END $$;

-- Create user_memory table if not exists
CREATE TABLE IF NOT EXISTS public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_category public.fact_category NOT NULL,
  fact_label TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  fact_context TEXT,
  confidence_score NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  is_high_stakes BOOLEAN DEFAULT false,
  verification_status public.verification_status DEFAULT 'inferred',
  verified_at TIMESTAMPTZ,
  source_type public.memory_source_type NOT NULL DEFAULT 'voice',
  source_session_id UUID,
  source_transcript_id UUID,
  is_current BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES public.user_memory(id),
  supersedes UUID REFERENCES public.user_memory(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON public.user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_category ON public.user_memory(fact_category);
CREATE INDEX IF NOT EXISTS idx_user_memory_current ON public.user_memory(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_memory_verification ON public.user_memory(verification_status);

-- Enable RLS
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe)
DROP POLICY IF EXISTS "Users can view their own memory" ON public.user_memory;
DROP POLICY IF EXISTS "Users can insert their own memory" ON public.user_memory;
DROP POLICY IF EXISTS "Users can update their own memory" ON public.user_memory;
DROP POLICY IF EXISTS "Service role can manage all memory" ON public.user_memory;

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

-- Create or replace functions
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

GRANT EXECUTE ON FUNCTION get_pending_verifications TO authenticated;
