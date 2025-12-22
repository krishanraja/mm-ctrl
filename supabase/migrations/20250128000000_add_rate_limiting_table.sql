-- Create rate_limit_logs table for distributed rate limiting
-- Replaces in-memory rate limiting for production scalability

CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_limit_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_key_created 
  ON public.rate_limit_logs(rate_limit_key, created_at DESC);

-- Enable RLS (service role only)
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate limit logs"
  ON public.rate_limit_logs
  FOR ALL
  USING (false);

-- Add comment
COMMENT ON TABLE public.rate_limit_logs IS 'Stores rate limit request logs for distributed rate limiting across edge function instances';


