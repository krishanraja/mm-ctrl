-- Memory Privacy Settings Table
-- Stores user preferences for memory storage, retention, and privacy controls

-- Create user memory settings table
CREATE TABLE IF NOT EXISTS public.user_memory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Privacy toggles
  store_memory_enabled BOOLEAN DEFAULT true,
  store_voice_transcripts BOOLEAN DEFAULT true,
  auto_summarize_enabled BOOLEAN DEFAULT true,
  
  -- Retention policy: NULL = forever, 30 = 30 days, 90 = 90 days
  retention_days INTEGER DEFAULT NULL CHECK (retention_days IS NULL OR retention_days IN (30, 90)),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_memory_settings_user_id ON public.user_memory_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_memory_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings"
  ON public.user_memory_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_memory_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_memory_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.user_memory_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_memory_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_memory_settings_updated_at_trigger
  BEFORE UPDATE ON public.user_memory_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_settings_updated_at();

-- Function to get or create user settings
CREATE OR REPLACE FUNCTION get_or_create_memory_settings(p_user_id UUID)
RETURNS public.user_memory_settings AS $$
DECLARE
  v_settings public.user_memory_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings
  FROM public.user_memory_settings
  WHERE user_id = p_user_id;
  
  -- If not found, create default settings
  IF NOT FOUND THEN
    INSERT INTO public.user_memory_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_or_create_memory_settings TO authenticated;

COMMENT ON TABLE public.user_memory_settings IS 'User preferences for memory storage, retention, and privacy controls';
