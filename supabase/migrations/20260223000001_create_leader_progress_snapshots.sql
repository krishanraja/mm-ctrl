-- Leader Progress Snapshots: periodic dimension score captures for trend tracking
CREATE TABLE IF NOT EXISTS leader_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES leader_assessments(id),
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  comparison_to_baseline JSONB DEFAULT '{}',
  benchmark_score NUMERIC,
  benchmark_tier TEXT,
  snapshot_type TEXT DEFAULT 'assessment' CHECK (snapshot_type IN ('assessment', 'check_in', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leader_progress_snapshots_leader_id ON leader_progress_snapshots(leader_id);
CREATE INDEX idx_leader_progress_snapshots_created_at ON leader_progress_snapshots(created_at);

-- RLS
ALTER TABLE leader_progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress snapshots"
  ON leader_progress_snapshots FOR SELECT
  USING (leader_id = auth.uid());

CREATE POLICY "Users can insert their own progress snapshots"
  ON leader_progress_snapshots FOR INSERT
  WITH CHECK (leader_id = auth.uid());
