-- Phase 1: Action Pathways - Mission System
-- Create leader_missions table for tracking action commitments

CREATE TABLE IF NOT EXISTS leader_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES leader_assessments(id) ON DELETE SET NULL,
  
  -- Mission content
  mission_text TEXT NOT NULL,
  mission_type TEXT, -- optional categorization (e.g., 'strategic_planning', 'team_enablement')
  
  -- Scheduling
  start_date TIMESTAMPTZ DEFAULT NOW(),
  check_in_date TIMESTAMPTZ NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped', 'archived')),
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  
  -- Email tracking
  check_in_email_sent BOOLEAN DEFAULT FALSE,
  check_in_email_sent_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_missions_leader ON leader_missions(leader_id);
CREATE INDEX idx_missions_status ON leader_missions(status, check_in_date);
CREATE INDEX idx_missions_assessment ON leader_missions(assessment_id);
CREATE INDEX idx_missions_check_in ON leader_missions(check_in_date) WHERE status = 'active' AND check_in_email_sent = false;

-- RLS policies
ALTER TABLE leader_missions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own missions
CREATE POLICY "Users can view own missions"
  ON leader_missions
  FOR SELECT
  USING (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create their own missions
CREATE POLICY "Users can create own missions"
  ON leader_missions
  FOR INSERT
  WITH CHECK (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own missions
CREATE POLICY "Users can update own missions"
  ON leader_missions
  FOR UPDATE
  USING (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can manage all missions (for automated check-ins)
CREATE POLICY "Service role can manage all missions"
  ON leader_missions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_leader_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leader_missions_updated_at
  BEFORE UPDATE ON leader_missions
  FOR EACH ROW
  EXECUTE FUNCTION update_leader_missions_updated_at();

-- Comments for documentation
COMMENT ON TABLE leader_missions IS 'Tracks action commitments (missions) that leaders select from assessment results';
COMMENT ON COLUMN leader_missions.mission_text IS 'The specific action the leader committed to taking';
COMMENT ON COLUMN leader_missions.check_in_date IS 'When we should check in with the leader about this mission';
COMMENT ON COLUMN leader_missions.status IS 'active: in progress, completed: done, skipped: abandoned, archived: old';
