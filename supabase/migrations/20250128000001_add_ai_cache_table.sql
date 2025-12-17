-- Create ai_response_cache table for caching AI responses
-- Reduces API costs and improves response times for similar prompts

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT NOT NULL,
  model TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash_model 
  ON public.ai_response_cache(prompt_hash, model);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires 
  ON public.ai_response_cache(expires_at);

-- Enable RLS (service role only)
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for AI cache"
  ON public.ai_response_cache
  FOR ALL
  USING (false);

-- Add comment
COMMENT ON TABLE public.ai_response_cache IS 'Caches AI responses to reduce API costs and improve response times';

-- Create function to automatically clean up expired entries (optional)
-- Can be called via pg_cron or manually
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_response_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_ai_cache() IS 'Cleans up expired AI response cache entries. Returns count of deleted rows.';
