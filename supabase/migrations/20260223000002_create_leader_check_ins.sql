-- Leader Check-ins: weekly reflections with AI-generated responses
CREATE TABLE IF NOT EXISTS leader_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES leader_missions(id),
  check_in_text TEXT NOT NULL,
  ai_reflection TEXT,
  ai_recommendation TEXT,
  ai_suggested_move TEXT,
  accepted_as_mission BOOLEAN DEFAULT false,
  voice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leader_check_ins_leader_id ON leader_check_ins(leader_id);
CREATE INDEX idx_leader_check_ins_mission_id ON leader_check_ins(mission_id);
CREATE INDEX idx_leader_check_ins_created_at ON leader_check_ins(created_at);

-- RLS
ALTER TABLE leader_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-ins"
  ON leader_check_ins FOR SELECT
  USING (leader_id = auth.uid());

CREATE POLICY "Users can insert their own check-ins"
  ON leader_check_ins FOR INSERT
  WITH CHECK (leader_id = auth.uid());

CREATE POLICY "Users can update their own check-ins"
  ON leader_check_ins FOR UPDATE
  USING (leader_id = auth.uid());
