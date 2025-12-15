-- Fix #4: Add idempotency to assessment_events
-- Prevent duplicate events when user retries answering questions

-- Add unique constraint on (assessment_id, question_id, session_id)
-- This ensures the same question+answer for the same assessment+session is only stored once
ALTER TABLE assessment_events
ADD CONSTRAINT unique_assessment_question_session 
UNIQUE (assessment_id, question_id, session_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_events_unique_lookup 
ON assessment_events(assessment_id, question_id, session_id);

COMMENT ON CONSTRAINT unique_assessment_question_session ON assessment_events IS 
'Ensures idempotency: same question+answer for same assessment+session is only stored once';
