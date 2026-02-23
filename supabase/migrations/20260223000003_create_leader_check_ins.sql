-- Phase 3: Continuous AI Coach - Create check-ins table
-- Tracks weekly reflections and AI-generated coaching

CREATE TABLE IF NOT EXISTS leader_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  
  -- User input
  check_in_text TEXT NOT NULL,
  check_in_audio_url TEXT, -- optional voice recording
  check_in_type TEXT DEFAULT 'weekly' CHECK (check_in_type IN ('weekly', 'daily', 'milestone', 'ad_hoc')),
  
  -- AI-generated responses
  ai_reflection TEXT,
  ai_recommendation TEXT,
  ai_suggested_move TEXT,
  move_accepted BOOLEAN DEFAULT FALSE,
  
  -- Context used for AI generation
  context_snapshot JSONB, -- snapshot of user's progress, missions, etc at time of check-in
  
  -- Email tracking
  check_in_email_sent BOOLEAN DEFAULT FALSE,
  check_in_email_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_checkins_leader ON leader_check_ins(leader_id);
CREATE INDEX idx_checkins_created ON leader_check_ins(created_at DESC);
CREATE INDEX idx_checkins_type ON leader_check_ins(check_in_type);

-- RLS policies
ALTER TABLE leader_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins"
  ON leader_check_ins
  FOR SELECT
  USING (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own check-ins"
  ON leader_check_ins
  FOR INSERT
  WITH CHECK (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own check-ins"
  ON leader_check_ins
  FOR UPDATE
  USING (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all check-ins"
  ON leader_check_ins
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE TRIGGER checkins_updated_at
  BEFORE UPDATE ON leader_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_leader_missions_updated_at();

COMMENT ON TABLE leader_check_ins IS 'Weekly reflections with AI coaching responses';
COMMENT ON COLUMN leader_check_ins.ai_reflection IS 'AI analysis of what changed for the leader this week';
COMMENT ON COLUMN leader_check_ins.ai_suggested_move IS 'Concrete next action suggested by AI';
