-- Enhance assessment_questions table for better context linking
-- Purpose: Ensure question metadata supports linking to assessment_events
-- This enables queries like "Given everything this person said, how does their ai_posture look?"

-- Note: assessment_questions table already exists from previous migration
-- This migration adds missing fields and improves linking

-- Add question_block column if it doesn't exist (for grouping questions)
ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS question_block TEXT;

-- Add question_id column if it doesn't exist (to match assessment_events.question_id)
-- Note: existing table uses question_key, we'll add question_id as an alias
ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS question_id TEXT;

-- Populate question_id from question_key if question_id is null
UPDATE public.assessment_questions
SET question_id = question_key
WHERE question_id IS NULL AND question_key IS NOT NULL;

-- Add index on question_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question_id 
  ON public.assessment_questions(question_id) 
  WHERE question_id IS NOT NULL;

-- Add index on question_block for grouping
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question_block 
  ON public.assessment_questions(question_block) 
  WHERE question_block IS NOT NULL;

-- Ensure tool_name includes all valid values
-- Note: We can't modify CHECK constraint easily, but we'll document the valid values
-- Valid tool_name values: 'quiz', 'voice', 'chat', 'deep_profile', 'bootcamp', 'sprint', 'compass'

-- Add function to link assessment_events to assessment_questions
-- This enables joining events to question metadata via (tool_name, question_id)
CREATE OR REPLACE FUNCTION get_question_metadata(
  p_tool_name TEXT,
  p_question_id TEXT
)
RETURNS TABLE (
  id UUID,
  question_key TEXT,
  tool_name TEXT,
  dimension_key TEXT,
  question_text TEXT,
  weight NUMERIC,
  question_block TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aq.id,
    aq.question_key,
    aq.tool_name,
    aq.dimension_key,
    aq.question_text,
    aq.weight,
    aq.question_block
  FROM public.assessment_questions aq
  WHERE aq.tool_name = p_tool_name
    AND (aq.question_id = p_question_id OR aq.question_key = p_question_id)
    AND aq.active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_question_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_question_metadata TO service_role;

-- Add comments explaining the linking strategy
COMMENT ON COLUMN public.assessment_questions.question_id IS 
  'Identifier matching assessment_events.question_id. Populated from question_key if not set. Used to link events to question metadata.';

COMMENT ON COLUMN public.assessment_questions.question_block IS 
  'Groups questions into blocks (e.g. pre_workshop, voice_assessment, bootcamp_simulation). Enables context linking across question blocks.';

COMMENT ON FUNCTION get_question_metadata IS 
  'Retrieves question metadata for a given tool_name and question_id. Enables linking assessment_events to question metadata.';
