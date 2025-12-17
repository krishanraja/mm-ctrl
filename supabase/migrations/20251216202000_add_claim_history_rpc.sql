-- RPC function to claim anonymous user history when upgrading to authenticated account
-- This allows users to merge their anonymous data with their authenticated account

CREATE OR REPLACE FUNCTION public.claim_user_history(
  old_user_id UUID,
  new_user_id UUID,
  table_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name NOT IN (
    'leader_checkins',
    'leader_decision_captures',
    'leader_weekly_actions',
    'leader_drift_flags',
    'leader_notification_prefs',
    'leader_peer_snippets',
    'leader_sharing_consent'
  ) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Update user_id in the specified table
  EXECUTE format(
    'UPDATE public.%I SET user_id = $1 WHERE user_id = $2',
    table_name
  ) USING new_user_id, old_user_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_user_history(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_user_history(UUID, UUID, TEXT) TO anon;
