-- ============================================================
-- The Edge: Leadership Amplifier
-- Synthesized strengths/weaknesses profile with AI capabilities
-- ============================================================

-- Edge profile: synthesized strengths, weaknesses, and intelligence gaps
CREATE TABLE IF NOT EXISTS edge_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  weaknesses JSONB NOT NULL DEFAULT '[]',
  intelligence_gaps JSONB NOT NULL DEFAULT '[]',
  profile_version INTEGER NOT NULL DEFAULT 1,
  last_synthesized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synthesis_inputs JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT edge_profiles_user_id_key UNIQUE (user_id)
);

-- Edge actions: generated artifacts (drafts, frameworks, etc.)
CREATE TABLE IF NOT EXISTS edge_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('sharpen', 'cover')),
  capability_key TEXT NOT NULL,
  target_key TEXT NOT NULL,
  title TEXT NOT NULL,
  input_context JSONB DEFAULT '{}',
  output_content TEXT,
  output_format TEXT NOT NULL DEFAULT 'markdown',
  delivered_via TEXT CHECK (delivered_via IN ('app', 'email', 'both')),
  delivered_to_email TEXT,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  was_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Edge feedback: confirm/reject strength/weakness classifications
CREATE TABLE IF NOT EXISTS edge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'strength_confirm', 'strength_reject', 'weakness_confirm', 'weakness_reject'
  )),
  target_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Edge subscriptions: Stripe subscription state
CREATE TABLE IF NOT EXISTS edge_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'past_due', 'canceled', 'inactive')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT edge_subscriptions_user_id_key UNIQUE (user_id)
);

-- Delivery email preference on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS edge_delivery_email TEXT;

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_edge_profiles_user_id ON edge_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_actions_user_id ON edge_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_actions_user_type ON edge_actions(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_edge_feedback_user_id ON edge_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_subscriptions_user_id ON edge_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_subscriptions_stripe ON edge_subscriptions(stripe_subscription_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE edge_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_subscriptions ENABLE ROW LEVEL SECURITY;

-- Edge profiles: users can read/update their own, service role can upsert
CREATE POLICY "Users can view own edge profile"
  ON edge_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage edge profiles"
  ON edge_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Edge actions: users can read their own, service role can insert
CREATE POLICY "Users can view own edge actions"
  ON edge_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can rate own edge actions"
  ON edge_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage edge actions"
  ON edge_actions FOR ALL
  USING (auth.role() = 'service_role');

-- Edge feedback: users can insert and read their own
CREATE POLICY "Users can view own edge feedback"
  ON edge_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit edge feedback"
  ON edge_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage edge feedback"
  ON edge_feedback FOR ALL
  USING (auth.role() = 'service_role');

-- Edge subscriptions: users can read their own, service role manages
CREATE POLICY "Users can view own edge subscription"
  ON edge_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage edge subscriptions"
  ON edge_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
