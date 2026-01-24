-- Memory Encryption and Retention Enhancements
-- Adds encrypted content storage and retention expiration tracking

-- Add encrypted content column to user_memory
ALTER TABLE public.user_memory 
  ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
  ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

-- Add index for retention cleanup
CREATE INDEX IF NOT EXISTS idx_user_memory_retention_expires 
  ON public.user_memory(retention_expires_at) 
  WHERE retention_expires_at IS NOT NULL;

-- Add source column for manual vs system entries
DO $$
BEGIN
  -- Check if 'manual' is already in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'manual' 
    AND enumtypid = 'public.memory_source_type'::regtype
  ) THEN
    ALTER TYPE public.memory_source_type ADD VALUE 'manual';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'system' 
    AND enumtypid = 'public.memory_source_type'::regtype
  ) THEN
    ALTER TYPE public.memory_source_type ADD VALUE 'system';
  END IF;
END $$;

-- Function to set retention expiration based on user settings
CREATE OR REPLACE FUNCTION set_memory_retention_expiration()
RETURNS TRIGGER AS $$
DECLARE
  v_retention_days INTEGER;
BEGIN
  -- Get user's retention setting
  SELECT retention_days INTO v_retention_days
  FROM public.user_memory_settings
  WHERE user_id = NEW.user_id;
  
  -- Set expiration if retention is configured
  IF v_retention_days IS NOT NULL THEN
    NEW.retention_expires_at = NEW.created_at + (v_retention_days || ' days')::INTERVAL;
  ELSE
    NEW.retention_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new memories
DROP TRIGGER IF EXISTS set_memory_retention_trigger ON public.user_memory;
CREATE TRIGGER set_memory_retention_trigger
  BEFORE INSERT ON public.user_memory
  FOR EACH ROW
  EXECUTE FUNCTION set_memory_retention_expiration();

-- Function to update retention for all user memories when settings change
CREATE OR REPLACE FUNCTION update_user_memory_retention()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.retention_days IS DISTINCT FROM NEW.retention_days THEN
    IF NEW.retention_days IS NULL THEN
      -- Remove expiration for all memories
      UPDATE public.user_memory
      SET retention_expires_at = NULL
      WHERE user_id = NEW.user_id;
    ELSE
      -- Update expiration for all memories
      UPDATE public.user_memory
      SET retention_expires_at = created_at + (NEW.retention_days || ' days')::INTERVAL
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings changes
DROP TRIGGER IF EXISTS update_memory_retention_on_settings_change ON public.user_memory_settings;
CREATE TRIGGER update_memory_retention_on_settings_change
  AFTER UPDATE ON public.user_memory_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_retention();

-- Function to cleanup expired memories (called by scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_memory
    WHERE retention_expires_at IS NOT NULL
      AND retention_expires_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user memory as JSON
CREATE OR REPLACE FUNCTION export_user_memory(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(m))
    FROM (
      SELECT 
        id,
        fact_key,
        fact_category,
        fact_label,
        fact_value,
        fact_context,
        confidence_score,
        verification_status,
        source_type,
        created_at,
        updated_at
      FROM public.user_memory
      WHERE user_id = p_user_id
        AND is_current = true
      ORDER BY created_at DESC
    ) m
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_memories TO service_role;
GRANT EXECUTE ON FUNCTION export_user_memory TO authenticated;

COMMENT ON COLUMN public.user_memory.encrypted_content IS 'AES-256-GCM encrypted fact_value and fact_context';
COMMENT ON COLUMN public.user_memory.encryption_version IS 'Version of encryption scheme used';
COMMENT ON COLUMN public.user_memory.retention_expires_at IS 'When this memory should be auto-deleted based on user retention settings';
