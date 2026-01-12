-- Operator Decision Engine: Database Schema
-- Creates tables for multi-venture operator profiles, prescriptions, and advisor sessions

-- Operator profiles
CREATE TABLE IF NOT EXISTS operator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_lines JSONB DEFAULT '[]'::jsonb,
  inbox_count INTEGER DEFAULT 0,
  technical_comfort INTEGER CHECK (technical_comfort BETWEEN 1 AND 5),
  monthly_budget TEXT,
  top_pain_points TEXT[] DEFAULT '{}',
  decision_stuck_on TEXT[] DEFAULT '{}',
  delivery_preference TEXT DEFAULT 'text' CHECK (delivery_preference IN ('text', 'voice', 'video')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly prescriptions
CREATE TABLE IF NOT EXISTS operator_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_profile_id UUID REFERENCES operator_profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  decision_text TEXT NOT NULL,
  why_text TEXT,
  implementation_steps JSONB DEFAULT '[]'::jsonb,
  time_estimate TEXT,
  cost_estimate TEXT,
  delivery_format TEXT DEFAULT 'text',
  delivery_content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Advisor sessions
CREATE TABLE IF NOT EXISTS operator_advisor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_profile_id UUID REFERENCES operator_profiles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_audio_url TEXT,
  recommendation TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  risk_assessment TEXT,
  alternative_suggestion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operator_profiles_user ON operator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_operator_prescriptions_profile ON operator_prescriptions(operator_profile_id);
CREATE INDEX IF NOT EXISTS idx_operator_prescriptions_week ON operator_prescriptions(week_start_date);
CREATE INDEX IF NOT EXISTS idx_operator_advisor_profile ON operator_advisor_sessions(operator_profile_id);

-- Enable RLS
ALTER TABLE operator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_advisor_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own operator profiles"
  ON operator_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own prescriptions"
  ON operator_prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles 
      WHERE id = operator_prescriptions.operator_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own prescriptions"
  ON operator_prescriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operator_profiles 
      WHERE id = operator_prescriptions.operator_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own prescriptions"
  ON operator_prescriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles 
      WHERE id = operator_prescriptions.operator_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own advisor sessions"
  ON operator_advisor_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles 
      WHERE id = operator_advisor_sessions.operator_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own advisor sessions"
  ON operator_advisor_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operator_profiles 
      WHERE id = operator_advisor_sessions.operator_profile_id 
      AND user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_operator_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operator_profiles_updated_at
  BEFORE UPDATE ON operator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_operator_profiles_updated_at();
