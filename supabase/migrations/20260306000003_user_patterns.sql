-- Migration: User patterns table for behavioral pattern recognition

CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('preference', 'anti_preference', 'behavior', 'blindspot', 'strength')),
  pattern_text TEXT NOT NULL,
  evidence_count INTEGER DEFAULT 1,
  first_observed_at TIMESTAMPTZ DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ DEFAULT now(),
  confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT DEFAULT 'emerging' CHECK (status IN ('emerging', 'confirmed', 'deprecated')),
  source_facts UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own patterns"
  ON user_patterns FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on patterns"
  ON user_patterns FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_status
  ON user_patterns(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_type
  ON user_patterns(user_id, pattern_type);

CREATE INDEX IF NOT EXISTS idx_user_patterns_confidence
  ON user_patterns(user_id, confidence DESC);

-- Function to get active patterns
CREATE OR REPLACE FUNCTION get_active_patterns(p_user_id UUID)
RETURNS SETOF user_patterns
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_patterns
  WHERE user_id = p_user_id
    AND status != 'deprecated'
  ORDER BY confidence DESC, evidence_count DESC;
END;
$$;
