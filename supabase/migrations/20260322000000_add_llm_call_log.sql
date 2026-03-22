-- LLM Call Logging Table
-- Tracks every LLM API call for cost monitoring, latency analysis, and error tracking
CREATE TABLE IF NOT EXISTS public.llm_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  function_name text NOT NULL,
  model text NOT NULL,
  provider text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  latency_ms int,
  cached boolean NOT NULL DEFAULT false,
  error text,
  user_id uuid REFERENCES auth.users(id),
  estimated_cost_usd numeric(10,6)
);

-- Index for cost dashboard queries (by day + model)
CREATE INDEX IF NOT EXISTS idx_llm_call_log_created_model
  ON public.llm_call_log (created_at DESC, model);

-- Index for per-user cost tracking
CREATE INDEX IF NOT EXISTS idx_llm_call_log_user
  ON public.llm_call_log (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Index for error monitoring
CREATE INDEX IF NOT EXISTS idx_llm_call_log_errors
  ON public.llm_call_log (created_at DESC)
  WHERE error IS NOT NULL;

-- Disable RLS (service role only — edge functions use service key)
ALTER TABLE public.llm_call_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read logs
CREATE POLICY "Service role full access on llm_call_log"
  ON public.llm_call_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Cost dashboard view
CREATE OR REPLACE VIEW public.llm_cost_dashboard AS
SELECT
  date_trunc('day', created_at) AS day,
  model,
  provider,
  count(*) AS call_count,
  count(*) FILTER (WHERE cached) AS cache_hits,
  count(*) FILTER (WHERE error IS NOT NULL) AS errors,
  sum(total_tokens) AS total_tokens,
  avg(latency_ms)::int AS avg_latency_ms,
  sum(estimated_cost_usd)::numeric(10,4) AS total_cost_usd
FROM public.llm_call_log
GROUP BY 1, 2, 3
ORDER BY 1 DESC, total_cost_usd DESC;

-- Auto-cleanup: delete logs older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_llm_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.llm_call_log
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;
