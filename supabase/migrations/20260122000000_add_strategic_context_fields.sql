-- Add Strategic Context Fields to Leaders Table
-- Purpose: Capture industry, sector, problems, obstacles, fears for personalized coaching
-- Date: 2026-01-22

-- Add new fields to leaders table
ALTER TABLE public.leaders
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_stage TEXT,
  ADD COLUMN IF NOT EXISTS strategic_problem TEXT,
  ADD COLUMN IF NOT EXISTS biggest_obstacle TEXT,
  ADD COLUMN IF NOT EXISTS biggest_fear TEXT,
  ADD COLUMN IF NOT EXISTS strategic_goal TEXT,
  ADD COLUMN IF NOT EXISTS quarterly_focus TEXT,
  ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- Create index on industry for benchmarking queries
CREATE INDEX IF NOT EXISTS idx_leaders_industry
  ON public.leaders(industry)
  WHERE industry IS NOT NULL AND archived_at IS NULL;

-- Create index on company_stage for filtering
CREATE INDEX IF NOT EXISTS idx_leaders_company_stage
  ON public.leaders(company_stage)
  WHERE company_stage IS NOT NULL AND archived_at IS NULL;

-- Create index on profile_completeness for analytics
CREATE INDEX IF NOT EXISTS idx_leaders_profile_completeness
  ON public.leaders(profile_completeness)
  WHERE archived_at IS NULL;

-- Add profile completeness calculation function
CREATE OR REPLACE FUNCTION calculate_profile_completeness(leader_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completeness INTEGER := 0;
  leader_record RECORD;
BEGIN
  SELECT * INTO leader_record FROM public.leaders WHERE id = leader_id;

  IF leader_record IS NULL THEN
    RETURN 0;
  END IF;

  -- Basic fields (10 points each) = 20 points
  IF leader_record.name IS NOT NULL AND leader_record.name != '' THEN
    completeness := completeness + 10;
  END IF;
  IF leader_record.email IS NOT NULL AND leader_record.email != '' THEN
    completeness := completeness + 10;
  END IF;

  -- Context fields (15 points each) = 60 points
  IF leader_record.role IS NOT NULL AND leader_record.role != '' THEN
    completeness := completeness + 15;
  END IF;
  IF leader_record.title IS NOT NULL AND leader_record.title != '' THEN
    completeness := completeness + 15;
  END IF;
  IF leader_record.company IS NOT NULL AND leader_record.company != '' THEN
    completeness := completeness + 10;
  END IF;
  IF leader_record.industry IS NOT NULL AND leader_record.industry != '' THEN
    completeness := completeness + 20;
  END IF;

  -- Strategic fields (5 points each) = 20 points
  IF leader_record.strategic_problem IS NOT NULL AND leader_record.strategic_problem != '' THEN
    completeness := completeness + 5;
  END IF;
  IF leader_record.biggest_obstacle IS NOT NULL AND leader_record.biggest_obstacle != '' THEN
    completeness := completeness + 5;
  END IF;
  IF leader_record.biggest_fear IS NOT NULL AND leader_record.biggest_fear != '' THEN
    completeness := completeness + 5;
  END IF;
  IF leader_record.strategic_goal IS NOT NULL AND leader_record.strategic_goal != '' THEN
    completeness := completeness + 5;
  END IF;

  -- Cap at 100
  IF completeness > 100 THEN
    completeness := 100;
  END IF;

  RETURN completeness;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_profile_completeness TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profile_completeness TO service_role;

-- Create trigger to auto-update profile_completeness on leaders table changes
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_completeness ON public.leaders;

CREATE TRIGGER trigger_update_profile_completeness
  BEFORE INSERT OR UPDATE ON public.leaders
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completeness();

-- Add comments for documentation
COMMENT ON COLUMN public.leaders.title IS 'Official job title (e.g., "VP of Product")';
COMMENT ON COLUMN public.leaders.industry IS 'Industry sector for benchmarking (e.g., "SaaS", "Fintech")';
COMMENT ON COLUMN public.leaders.company_stage IS 'Company stage (e.g., "Startup", "Growth", "Enterprise")';
COMMENT ON COLUMN public.leaders.strategic_problem IS 'User''s biggest business challenge or problem';
COMMENT ON COLUMN public.leaders.biggest_obstacle IS 'Primary obstacle holding user back';
COMMENT ON COLUMN public.leaders.biggest_fear IS 'User''s biggest fear or concern (sensitive, optional)';
COMMENT ON COLUMN public.leaders.strategic_goal IS 'User''s strategic goal or desired outcome';
COMMENT ON COLUMN public.leaders.quarterly_focus IS 'Current quarterly focus or priority';
COMMENT ON COLUMN public.leaders.profile_completeness IS 'Calculated completeness percentage (0-100)';

-- Update existing records to calculate completeness
UPDATE public.leaders
SET profile_completeness = calculate_profile_completeness(id)
WHERE archived_at IS NULL;
