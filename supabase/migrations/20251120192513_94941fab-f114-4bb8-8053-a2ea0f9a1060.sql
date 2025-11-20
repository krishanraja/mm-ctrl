-- CP3: Add leader_id support for anonymous assessments
-- Step 1: Add leader_id column
ALTER TABLE prompt_library_profiles 
ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES leaders(id);

-- Step 2: Delete orphaned rows (can't be linked, not retrievable anyway)
-- These are from before leader_id support existed
DELETE FROM prompt_library_profiles
WHERE user_id IS NULL AND leader_id IS NULL;

-- Step 3: Add check constraint
ALTER TABLE prompt_library_profiles
DROP CONSTRAINT IF EXISTS user_or_leader_required;

ALTER TABLE prompt_library_profiles
ADD CONSTRAINT user_or_leader_required 
CHECK (user_id IS NOT NULL OR leader_id IS NOT NULL);

-- Step 4: Add index for leader_id lookups
CREATE INDEX IF NOT EXISTS idx_prompt_library_profiles_leader_id 
ON prompt_library_profiles(leader_id);

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'CP3 Complete: prompt_library_profiles now supports leader_id for anonymous users';
END $$;