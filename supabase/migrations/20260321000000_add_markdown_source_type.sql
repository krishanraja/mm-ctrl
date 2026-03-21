-- Add 'markdown' to memory_source_type enum for markdown file imports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'markdown'
    AND enumtypid = 'public.memory_source_type'::regtype
  ) THEN
    ALTER TYPE public.memory_source_type ADD VALUE 'markdown';
  END IF;
END $$;
