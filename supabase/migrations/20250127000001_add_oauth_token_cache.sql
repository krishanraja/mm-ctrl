-- OAuth token cache table for Google/Vertex AI tokens
-- Reduces API calls by caching tokens until expiration

CREATE TABLE IF NOT EXISTS public.oauth_token_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_key TEXT NOT NULL UNIQUE, -- e.g., 'vertex_ai:cloud-platform' or 'google_sheets:spreadsheets'
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_oauth_token_cache_key ON public.oauth_token_cache(token_key);
CREATE INDEX IF NOT EXISTS idx_oauth_token_cache_expires ON public.oauth_token_cache(expires_at);

-- Enable Row Level Security (restrictive - only service role can access)
ALTER TABLE public.oauth_token_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (edge functions use service role key)
CREATE POLICY "Service role only for oauth tokens"
  ON public.oauth_token_cache
  FOR ALL
  USING (false); -- Effectively blocks all access except service role

-- Function to get or refresh OAuth token
CREATE OR REPLACE FUNCTION public.get_or_refresh_oauth_token(
  p_token_key TEXT,
  p_access_token TEXT,
  p_expires_in_seconds INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_cached_token TEXT;
BEGIN
  -- Calculate expiration time (subtract 5 minutes for safety margin)
  v_expires_at := v_now + ((p_expires_in_seconds - 300) || ' seconds')::INTERVAL;
  
  -- Check for existing valid token
  SELECT access_token INTO v_cached_token
  FROM public.oauth_token_cache
  WHERE token_key = p_token_key
    AND expires_at > v_now
  LIMIT 1;
  
  -- If valid token exists, return it
  IF v_cached_token IS NOT NULL THEN
    RETURN v_cached_token;
  END IF;
  
  -- Otherwise, insert or update with new token
  INSERT INTO public.oauth_token_cache (token_key, access_token, expires_at)
  VALUES (p_token_key, p_access_token, v_expires_at)
  ON CONFLICT (token_key) DO UPDATE
  SET
    access_token = EXCLUDED.access_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = v_now;
  
  RETURN p_access_token;
END;
$$;

-- Function to clean up expired tokens (can be called by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.oauth_token_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_refresh_oauth_token TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_oauth_tokens TO service_role;







