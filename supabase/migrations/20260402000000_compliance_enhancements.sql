-- Compliance Enhancements Migration
-- Adds columns and tables for SOC2, HIPAA, GDPR, CCPA, ISO 27001 compliance

-- 1. Add terms acceptance tracking to leaders table
ALTER TABLE public.leaders
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;

-- 2. Create compliance events table for tracking compliance-relevant events
CREATE TABLE IF NOT EXISTS public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own compliance events
CREATE POLICY "Users can view their own compliance events"
  ON public.compliance_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all compliance events
CREATE POLICY "Service role can manage compliance events"
  ON public.compliance_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_compliance_events_user_type
  ON public.compliance_events(user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_compliance_events_created
  ON public.compliance_events(created_at DESC);

-- 3. Ensure consent_audit table exists (may already exist from earlier migrations)
CREATE TABLE IF NOT EXISTS public.consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  previous_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.consent_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent audit"
  ON public.consent_audit
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage consent audit"
  ON public.consent_audit
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own consent audit records
CREATE POLICY "Users can insert their own consent audit"
  ON public.consent_audit
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_consent_audit_user
  ON public.consent_audit(user_id, changed_at DESC);

-- 4. Ensure security_audit_log table exists
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage security audit log"
  ON public.security_audit_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_audit_user
  ON public.security_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_action
  ON public.security_audit_log(action, created_at DESC);
