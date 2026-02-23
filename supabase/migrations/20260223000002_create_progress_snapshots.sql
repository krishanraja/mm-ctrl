-- Phase 2: Progress Tracking - Create progress snapshots table
-- Tracks dimension scores over time to show improvement

CREATE TABLE IF NOT EXISTS leader_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES leader_assessments(id) ON DELETE SET NULL,
  
  -- Snapshot metadata
  snapshot_type TEXT DEFAULT 'monthly' CHECK (snapshot_type IN ('baseline', 'monthly', 'quarterly', 'milestone')),
  snapshot_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dimension scores at this point in time
  dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Format: { "ai_strategy": 75, "momentum": 82, "learning_orientation": 68, "integration_depth": 71 }
  
  -- Comparison to baseline (delta)
  comparison_to_baseline JSONB DEFAULT '{}'::jsonb,
  -- Format: { "ai_strategy": +15, "momentum": +8, ... }
  
  -- Context at time of snapshot
  completed_missions_count INT DEFAULT 0,
  active_missions_count INT DEFAULT 0,
  benchmark_tier TEXT,
  benchmark_score INT,
  
  -- Optional notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_snapshots_leader ON leader_progress_snapshots(leader_id);
CREATE INDEX idx_snapshots_date ON leader_progress_snapshots(snapshot_date DESC);
CREATE INDEX idx_snapshots_type ON leader_progress_snapshots(snapshot_type);
CREATE INDEX idx_snapshots_leader_date ON leader_progress_snapshots(leader_id, snapshot_date DESC);

-- RLS policies
ALTER TABLE leader_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own snapshots
CREATE POLICY "Users can view own snapshots"
  ON leader_progress_snapshots
  FOR SELECT
  USING (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create their own snapshots
CREATE POLICY "Users can create own snapshots"
  ON leader_progress_snapshots
  FOR INSERT
  WITH CHECK (
    leader_id IN (
      SELECT id FROM leaders WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can manage all snapshots
CREATE POLICY "Service role can manage all snapshots"
  ON leader_progress_snapshots
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snapshots_updated_at
  BEFORE UPDATE ON leader_progress_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_snapshots_updated_at();

-- Comments
COMMENT ON TABLE leader_progress_snapshots IS 'Tracks leader dimension scores over time for progress visualization';
COMMENT ON COLUMN leader_progress_snapshots.dimension_scores IS 'Current scores for all dimensions at this snapshot';
COMMENT ON COLUMN leader_progress_snapshots.comparison_to_baseline IS 'Delta from baseline assessment (+/- for each dimension)';
COMMENT ON COLUMN leader_progress_snapshots.snapshot_type IS 'baseline: initial assessment, monthly: scheduled snapshot, milestone: significant achievement';
