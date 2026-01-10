-- Create audit logging tables for data and AI usage tracking
-- Purpose: Full audit trail for all data operations and LLM calls

-- 1. Data audit log table
CREATE TABLE IF NOT EXISTS public.data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.leaders(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'UPSERT')),
  table_name TEXT NOT NULL,
  record_id UUID,
  
  -- Data changes
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context (IP, user agent, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_audit_user_id 
  ON public.data_audit_log(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_data_audit_profile_id 
  ON public.data_audit_log(profile_id) 
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_data_audit_action_type 
  ON public.data_audit_log(action_type);

CREATE INDEX IF NOT EXISTS idx_data_audit_table_name 
  ON public.data_audit_log(table_name);

CREATE INDEX IF NOT EXISTS idx_data_audit_created_at 
  ON public.data_audit_log(created_at DESC);

-- 2. AI usage audit table
CREATE TABLE IF NOT EXISTS public.ai_usage_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.leaders(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  
  -- Tool and flow context
  tool_name TEXT NOT NULL,
  flow_name TEXT,
  
  -- Model and usage
  model TEXT NOT NULL, -- e.g. 'gpt-4o', 'gemini-2.0-flash'
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10, 6), -- Estimated cost in USD
  
  -- Performance
  response_time_ms INTEGER, -- Response time in milliseconds
  cached BOOLEAN DEFAULT FALSE, -- Whether response was from cache
  
  -- Error tracking
  error TEXT, -- Error message if call failed
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional context (prompt preview, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_audit_user_id 
  ON public.ai_usage_audit(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_audit_profile_id 
  ON public.ai_usage_audit(profile_id) 
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_audit_tool_name 
  ON public.ai_usage_audit(tool_name);

CREATE INDEX IF NOT EXISTS idx_ai_audit_created_at 
  ON public.ai_usage_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_audit_model 
  ON public.ai_usage_audit(model);

-- Enable RLS
ALTER TABLE public.data_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own audit logs
CREATE POLICY "Users can view their own data audit logs"
  ON public.data_audit_log
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert data audit logs"
  ON public.data_audit_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own AI usage audit logs"
  ON public.ai_usage_audit
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert AI usage audit logs"
  ON public.ai_usage_audit
  FOR INSERT
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.data_audit_log IS 
  'Audit trail for all data operations (SELECT, INSERT, UPDATE, DELETE, UPSERT). Tracks user actions, data changes, and context.';

COMMENT ON TABLE public.ai_usage_audit IS 
  'Audit trail for all LLM/AI calls. Tracks model usage, token consumption, costs, performance, and errors.';

COMMENT ON COLUMN public.data_audit_log.old_values IS 
  'JSONB snapshot of record values before the operation (for UPDATE/DELETE).';

COMMENT ON COLUMN public.data_audit_log.new_values IS 
  'JSONB snapshot of record values after the operation (for INSERT/UPDATE/UPSERT).';

COMMENT ON COLUMN public.ai_usage_audit.cost_estimate IS 
  'Estimated cost in USD based on model pricing and token usage.';
