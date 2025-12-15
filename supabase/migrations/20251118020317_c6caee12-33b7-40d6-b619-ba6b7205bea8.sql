-- Fix assessment_type constraint to include all valid types
-- Current constraint only allows 'voice' and 'quiz', but code uses 'ai_leadership_benchmark'

ALTER TABLE index_participant_data 
DROP CONSTRAINT IF EXISTS index_participant_data_assessment_type_check;

ALTER TABLE index_participant_data 
ADD CONSTRAINT index_participant_data_assessment_type_check 
CHECK (assessment_type = ANY (ARRAY['voice'::text, 'quiz'::text, 'ai_leadership_benchmark'::text]));