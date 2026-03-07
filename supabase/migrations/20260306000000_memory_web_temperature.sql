-- Migration: Add temperature tiering to user_memory
-- Enables hot/warm/cold context management for the memory web

ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'warm'
  CHECK (temperature IN ('hot', 'warm', 'cold'));
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS last_referenced_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS reference_count INTEGER DEFAULT 0;
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index for temperature-based loading
CREATE INDEX IF NOT EXISTS idx_user_memory_temperature
  ON user_memory(user_id, temperature)
  WHERE archived_at IS NULL AND is_current = true;

-- Index for aging queries
CREATE INDEX IF NOT EXISTS idx_user_memory_last_referenced
  ON user_memory(user_id, last_referenced_at);

-- Index for archived facts
CREATE INDEX IF NOT EXISTS idx_user_memory_archived
  ON user_memory(user_id, archived_at)
  WHERE archived_at IS NOT NULL;

-- Function to touch (reference) a memory fact
CREATE OR REPLACE FUNCTION touch_memory_fact(p_fact_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_memory
  SET reference_count = reference_count + 1,
      last_referenced_at = now()
  WHERE id = p_fact_id
    AND is_current = true;
END;
$$;

-- Function to get facts by temperature
CREATE OR REPLACE FUNCTION get_memory_by_temperature(p_user_id UUID, p_temperature TEXT)
RETURNS SETOF user_memory
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_memory
  WHERE user_id = p_user_id
    AND temperature = p_temperature
    AND archived_at IS NULL
    AND is_current = true
  ORDER BY last_referenced_at DESC;
END;
$$;
