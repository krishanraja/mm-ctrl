-- Leader Missions: tracks the "first move" a leader commits to after assessment
CREATE TABLE IF NOT EXISTS leader_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES leader_assessments(id),
  first_move_id UUID REFERENCES leader_first_moves(id),
  mission_text TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped', 'extended')),
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leader_missions_leader_id ON leader_missions(leader_id);
CREATE INDEX idx_leader_missions_status ON leader_missions(status);
CREATE INDEX idx_leader_missions_check_in_date ON leader_missions(check_in_date);

-- RLS
ALTER TABLE leader_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own missions"
  ON leader_missions FOR SELECT
  USING (leader_id = auth.uid());

CREATE POLICY "Users can insert their own missions"
  ON leader_missions FOR INSERT
  WITH CHECK (leader_id = auth.uid());

CREATE POLICY "Users can update their own missions"
  ON leader_missions FOR UPDATE
  USING (leader_id = auth.uid());
