-- AI Confidante Dashboard: Tables for daily prompts, reflections, and pattern detection
-- This migration creates the foundation for the AI Confidante experience

-- Track user reflections (stream of consciousness)
CREATE TABLE IF NOT EXISTS leader_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  prompt_id TEXT NOT NULL,
  response_text TEXT,
  response_audio_url TEXT,
  sentiment_score FLOAT,
  extracted_themes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track detected patterns
CREATE TABLE IF NOT EXISTS leader_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  pattern_type TEXT, -- 'avoidance', 'strength', 'blind_spot'
  description TEXT,
  evidence_reflection_ids UUID[],
  confidence_score FLOAT,
  surfaced_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

-- Prevent prompt repeats
CREATE TABLE IF NOT EXISTS leader_prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  prompt_id TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  responded BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE leader_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_prompt_history ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can only access their own data)
CREATE POLICY "Users can manage own reflections" ON leader_reflections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own patterns" ON leader_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prompt history" ON leader_prompt_history
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leader_reflections_user_id ON leader_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_leader_reflections_created_at ON leader_reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leader_reflections_prompt_id ON leader_reflections(prompt_id);

CREATE INDEX IF NOT EXISTS idx_leader_patterns_user_id ON leader_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_leader_patterns_surfaced_at ON leader_patterns(surfaced_at DESC);

CREATE INDEX IF NOT EXISTS idx_leader_prompt_history_user_id ON leader_prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_leader_prompt_history_prompt_id ON leader_prompt_history(prompt_id);
CREATE INDEX IF NOT EXISTS idx_leader_prompt_history_shown_at ON leader_prompt_history(shown_at DESC);
