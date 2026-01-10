-- Enhance Profiles: Add soft delete and improve matching
-- Purpose: Support email+name matching, prevent duplicates, add archival

-- 1. Add archived_at column for soft deletes (if not exists)
ALTER TABLE public.leaders
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 2. Add index on archived_at for filtering active profiles
CREATE INDEX IF NOT EXISTS idx_leaders_archived_at 
  ON public.leaders(archived_at) 
  WHERE archived_at IS NULL;

-- 3. Add index on normalized email for faster lookups
-- Note: We'll use LOWER() in queries, but this index helps
CREATE INDEX IF NOT EXISTS idx_leaders_email_lower 
  ON public.leaders(LOWER(email));

-- 4. Add index on normalized name for name-based matching
-- Note: We'll use LOWER() and TRIM() in queries
CREATE INDEX IF NOT EXISTS idx_leaders_name_lower 
  ON public.leaders(LOWER(TRIM(name))) 
  WHERE name IS NOT NULL;

-- 5. Create unique partial index on (email, name) where both not null and not archived
-- This prevents duplicate profiles for the same email+name combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaders_email_name_unique
  ON public.leaders(LOWER(email), LOWER(TRIM(name)))
  WHERE email IS NOT NULL 
    AND name IS NOT NULL 
    AND archived_at IS NULL;

-- 6. Add comment explaining the matching strategy
COMMENT ON TABLE public.leaders IS 
  'User profile data for leaders. Matching strategy: 1) user_id (most reliable), 2) email+name (normalized, case-insensitive), 3) email only. Soft deletes via archived_at.';

-- 7. Create function to safely archive a profile (soft delete)
CREATE OR REPLACE FUNCTION archive_leader_profile(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.leaders
  SET archived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_profile_id
    AND archived_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission
GRANT EXECUTE ON FUNCTION archive_leader_profile TO authenticated;
GRANT EXECUTE ON FUNCTION archive_leader_profile TO service_role;

-- 9. Add comment on archived_at column
COMMENT ON COLUMN public.leaders.archived_at IS 
  'Timestamp when profile was archived (soft deleted). NULL means active profile.';
