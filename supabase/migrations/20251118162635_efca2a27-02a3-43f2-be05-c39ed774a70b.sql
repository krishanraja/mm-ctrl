-- Add AI learning style cohort tracking to index_participant_data
ALTER TABLE index_participant_data 
ADD COLUMN ai_learning_style TEXT,
ADD COLUMN deep_profile_data JSONB;

-- Add index for efficient cohort queries
CREATE INDEX idx_learning_style ON index_participant_data(ai_learning_style);

-- Add consent flag for cohort analysis
COMMENT ON COLUMN index_participant_data.ai_learning_style IS 'AI Learning Style cohort: strategic_visionary, pragmatic_executor, collaborative_builder, analytical_optimizer, or adaptive_explorer';
COMMENT ON COLUMN index_participant_data.deep_profile_data IS 'Full deep profile questionnaire responses for cohort analysis';