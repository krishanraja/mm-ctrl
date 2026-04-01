-- CTRL Briefing: personalised AI news briefings
-- Migration: create briefings + briefing_feedback tables

CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  briefing_date DATE NOT NULL,
  script_text TEXT NOT NULL,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  context_snapshot JSONB,
  news_sources JSONB,
  generation_model TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, briefing_date)
);

CREATE TABLE IF NOT EXISTS briefing_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID REFERENCES briefings(id) ON DELETE CASCADE NOT NULL,
  segment_index INTEGER NOT NULL,
  reaction TEXT CHECK (reaction IN ('useful', 'not_useful', 'save')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_briefings_user_date ON briefings(user_id, briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_briefing_feedback_briefing ON briefing_feedback(briefing_id);

-- RLS
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own briefings" ON briefings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts briefings" ON briefings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role updates briefings" ON briefings
  FOR UPDATE USING (true);

CREATE POLICY "Users read own feedback" ON briefing_feedback
  FOR SELECT USING (
    briefing_id IN (SELECT id FROM briefings WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert own feedback" ON briefing_feedback
  FOR INSERT WITH CHECK (
    briefing_id IN (SELECT id FROM briefings WHERE user_id = auth.uid())
  );

-- Storage bucket (must be created via dashboard or supabase CLI separately)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ctrl-briefings', 'ctrl-briefings', false)
-- ON CONFLICT DO NOTHING;
