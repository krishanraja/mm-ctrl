-- Notification preferences for ongoing loop

CREATE TABLE IF NOT EXISTS public.leader_notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NULL,

  weekly_checkin_enabled BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NULL,
  preferred_day TEXT NULL CHECK (preferred_day IN ('mon','tue','wed','thu','fri','sat','sun')),

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.leader_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leader_notification_prefs_own_rows"
  ON public.leader_notification_prefs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

