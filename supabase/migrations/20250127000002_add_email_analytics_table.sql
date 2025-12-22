-- Email analytics table for tracking Resend email events
-- Tracks opens, clicks, bounces, and other email engagement metrics

CREATE TABLE IF NOT EXISTS public.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL, -- Resend email ID
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'confirmation', 'booking', 'diagnostic', 'reminder', 'notification'
  subject TEXT,
  
  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Click tracking
  click_url TEXT, -- URL that was clicked (for 'clicked' events)
  
  -- Bounce/complaint details
  bounce_type TEXT, -- 'hard_bounce', 'soft_bounce', etc.
  bounce_reason TEXT,
  complaint_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional event data from Resend
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_email_analytics_email_id ON public.email_analytics(email_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_recipient ON public.email_analytics(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON public.email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_email_type ON public.email_analytics(email_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_user_id ON public.email_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_created_at ON public.email_analytics(created_at);

-- Enable Row Level Security
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email analytics
CREATE POLICY "Users can view their own email analytics"
  ON public.email_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Service role can manage all email analytics (for webhooks)
CREATE POLICY "Service role can manage email analytics"
  ON public.email_analytics
  FOR ALL
  USING (false); -- Effectively blocks all access except service role

-- Function to get email statistics
CREATE OR REPLACE FUNCTION public.get_email_statistics(
  p_email_type TEXT DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  email_type TEXT,
  total_sent INTEGER,
  total_delivered INTEGER,
  total_opened INTEGER,
  total_clicked INTEGER,
  total_bounced INTEGER,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p_email_type, ea.email_type) as email_type,
    COUNT(*) FILTER (WHERE ea.event_type = 'sent')::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE ea.event_type = 'delivered')::INTEGER as total_delivered,
    COUNT(*) FILTER (WHERE ea.event_type = 'opened')::INTEGER as total_opened,
    COUNT(*) FILTER (WHERE ea.event_type = 'clicked')::INTEGER as total_clicked,
    COUNT(*) FILTER (WHERE ea.event_type = 'bounced')::INTEGER as total_bounced,
    CASE 
      WHEN COUNT(*) FILTER (WHERE ea.event_type = 'delivered') > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE ea.event_type = 'opened')::NUMERIC / 
           COUNT(*) FILTER (WHERE ea.event_type = 'delivered')::NUMERIC) * 100,
          2
        )
      ELSE 0
    END as open_rate,
    CASE 
      WHEN COUNT(*) FILTER (WHERE ea.event_type = 'delivered') > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE ea.event_type = 'clicked')::NUMERIC / 
           COUNT(*) FILTER (WHERE ea.event_type = 'delivered')::NUMERIC) * 100,
          2
        )
      ELSE 0
    END as click_rate,
    CASE 
      WHEN COUNT(*) FILTER (WHERE ea.event_type = 'sent') > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE ea.event_type = 'bounced')::NUMERIC / 
           COUNT(*) FILTER (WHERE ea.event_type = 'sent')::NUMERIC) * 100,
          2
        )
      ELSE 0
    END as bounce_rate
  FROM public.email_analytics ea
  WHERE 
    (p_email_type IS NULL OR ea.email_type = p_email_type)
    AND (p_start_date IS NULL OR ea.created_at >= p_start_date)
    AND (p_end_date IS NULL OR ea.created_at <= p_end_date)
  GROUP BY COALESCE(p_email_type, ea.email_type);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_email_statistics TO service_role;







