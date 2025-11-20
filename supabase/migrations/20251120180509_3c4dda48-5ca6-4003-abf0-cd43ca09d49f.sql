-- Phase 1 & 4: Assessment persistence and referral tracking

-- Add generation status tracking to leader_assessments
ALTER TABLE leader_assessments
ADD COLUMN IF NOT EXISTS generation_status JSONB DEFAULT '{
  "insights_generated": false,
  "prompts_generated": false,
  "risks_computed": false,
  "tensions_computed": false,
  "scenarios_generated": false,
  "first_moves_generated": false,
  "last_updated": null,
  "error_log": []
}'::JSONB;

-- Create referral tracking table
CREATE TABLE IF NOT EXISTS assessment_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_assessment_id UUID REFERENCES leader_assessments(id) ON DELETE CASCADE,
  referrer_email TEXT NOT NULL,
  referrer_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referee_email TEXT,
  referee_name TEXT,
  referee_assessment_id UUID REFERENCES leader_assessments(id) ON DELETE SET NULL,
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast referral lookups
CREATE INDEX IF NOT EXISTS idx_assessment_referrals_code ON assessment_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_assessment_referrals_referrer ON assessment_referrals(referrer_assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_referrals_referee ON assessment_referrals(referee_assessment_id);

-- Enable RLS
ALTER TABLE assessment_referrals ENABLE ROW LEVEL SECURITY;

-- Allow users to view referrals they created
CREATE POLICY "Users can view their own referrals" ON assessment_referrals
  FOR SELECT USING (
    referrer_assessment_id IN (
      SELECT la.id FROM leader_assessments la
      JOIN leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Allow service to manage referrals
CREATE POLICY "Service can manage referrals" ON assessment_referrals
  FOR ALL USING (true) WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(
  p_assessment_id UUID,
  p_email TEXT
) RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_timestamp TEXT;
  v_hash TEXT;
BEGIN
  -- Create timestamp component
  v_timestamp := EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Create hash from assessment + email + timestamp
  v_hash := encode(
    digest(p_assessment_id::TEXT || p_email || v_timestamp, 'sha256'),
    'base64'
  );
  
  -- Take first 12 characters and make URL-safe
  v_code := UPPER(
    substring(
      regexp_replace(v_hash, '[+/=]', '', 'g'),
      1, 12
    )
  );
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to track referral conversion
CREATE OR REPLACE FUNCTION track_referral_conversion(
  p_referral_code TEXT,
  p_referee_assessment_id UUID,
  p_referee_email TEXT,
  p_referee_name TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_email TEXT;
  v_company_hash TEXT;
BEGIN
  -- Update referral record
  UPDATE assessment_referrals
  SET 
    referee_assessment_id = p_referee_assessment_id,
    referee_email = p_referee_email,
    referee_name = p_referee_name,
    converted = TRUE,
    converted_at = NOW()
  WHERE referral_code = p_referral_code
  RETURNING referrer_email INTO v_referrer_email;
  
  IF v_referrer_email IS NOT NULL THEN
    -- Extract company from email domain
    v_company_hash := hash_company_identifier(
      split_part(v_referrer_email, '@', 2)
    );
    
    -- Update company momentum (increment referral count)
    UPDATE adoption_momentum
    SET 
      verified_referrals = COALESCE(verified_referrals, 0) + 1,
      referred_companies = COALESCE(referred_companies, 0) + 1,
      updated_at = NOW()
    WHERE company_identifier_hash = v_company_hash;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;