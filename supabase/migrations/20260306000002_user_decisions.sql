-- Migration: User decisions table for institutional memory

CREATE TABLE IF NOT EXISTS user_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  decision_text TEXT NOT NULL,
  rationale TEXT,
  context_snapshot JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'reversed')),
  superseded_by UUID REFERENCES user_decisions(id),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'check_in', 'mission', 'assessment')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own decisions"
  ON user_decisions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on decisions"
  ON user_decisions FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_decisions_user_status
  ON user_decisions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_decisions_created
  ON user_decisions(user_id, created_at DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_user_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_decisions_updated_at
  BEFORE UPDATE ON user_decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_decisions_updated_at();
