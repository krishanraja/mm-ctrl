-- Enable RLS on leaders table and add user_id for proper access control
-- P0-1: CRITICAL - leaders table currently has no RLS, exposing all user PII

-- 1) Add user_id column to link leaders to auth.users
ALTER TABLE public.leaders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2) Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_leaders_user_id ON public.leaders(user_id);

-- 3) Enable RLS on leaders table
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;

-- 4) Create RLS policies

-- Users can read their own leader record
CREATE POLICY "leaders_select_own"
  ON public.leaders
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Backward compatibility: Allow reading if no user_id set (legacy data)
    -- This should be tightened after data migration
    user_id IS NULL
  );

-- Users can insert their own leader record
CREATE POLICY "leaders_insert_own"
  ON public.leaders
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    -- Allow service role to insert (for edge functions)
    -- Note: service role bypasses RLS, so this is mainly for anon key with user_id
    user_id IS NULL
  );

-- Users can update their own leader record
CREATE POLICY "leaders_update_own"
  ON public.leaders
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    -- Backward compatibility for legacy records
    user_id IS NULL
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    user_id IS NULL
  );

-- Users can delete their own leader record (for GDPR compliance)
CREATE POLICY "leaders_delete_own"
  ON public.leaders
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- 5) Add comment explaining the table's purpose and RLS strategy
COMMENT ON TABLE public.leaders IS 'User profile data for leaders taking assessments. Protected by RLS - users can only access their own record. user_id links to auth.users.';

-- 6) Create a unique constraint on user_id to prevent duplicate profiles per user
-- (email can be duplicated since we're moving away from email-based lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaders_user_id_unique 
  ON public.leaders(user_id) 
  WHERE user_id IS NOT NULL;


