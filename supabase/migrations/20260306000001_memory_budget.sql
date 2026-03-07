-- Migration: Memory budget tracking table

CREATE TABLE IF NOT EXISTS user_memory_budget (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hot_token_count INTEGER DEFAULT 0,
  hot_max_tokens INTEGER DEFAULT 4000,
  warm_token_count INTEGER DEFAULT 0,
  warm_max_tokens INTEGER DEFAULT 8000,
  total_facts INTEGER DEFAULT 0,
  last_cleanup_at TIMESTAMPTZ DEFAULT now(),
  last_audit_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_memory_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget"
  ON user_memory_budget FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own budget"
  ON user_memory_budget FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget"
  ON user_memory_budget FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role access
CREATE POLICY "Service role full access on budget"
  ON user_memory_budget FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_memory_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memory_budget_updated_at
  BEFORE UPDATE ON user_memory_budget
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_budget_updated_at();

-- Get or create budget for a user
CREATE OR REPLACE FUNCTION get_or_create_memory_budget(p_user_id UUID)
RETURNS user_memory_budget
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result user_memory_budget;
BEGIN
  SELECT * INTO result
  FROM user_memory_budget
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_memory_budget (user_id)
    VALUES (p_user_id)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;
