-- G25 authenticated-product hardening candidate R91
-- Isolated test only. Removes anonymous and unnecessary service execution from signed-in product actions.

BEGIN;

CREATE OR REPLACE FUNCTION public.pin_decision(p_case_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.decision_cases
  WHERE id = p_case_id;

  IF v_caller_id IS NULL OR v_user_id IS DISTINCT FROM v_caller_id THEN
    RAISE EXCEPTION 'Decision not found for this user' USING ERRCODE = '42501';
  END IF;

  UPDATE public.decision_cases
  SET pinned_at = NULL
  WHERE user_id = v_caller_id
    AND pinned_at IS NOT NULL
    AND id <> p_case_id;

  UPDATE public.decision_cases
  SET pinned_at = now()
  WHERE id = p_case_id
    AND user_id = v_caller_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_track_record(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_track_record(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.list_mcp_tokens() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_mcp_tokens() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mint_mcp_token(text, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.mint_mcp_token(text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.pin_decision(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.pin_decision(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_decision_outcome(uuid, text, text, smallint, text, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_decision_outcome(uuid, text, text, smallint, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.resolve_decision(uuid, text, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_decision(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.revoke_mcp_token(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_mcp_token(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_contest(text, text, uuid, text, text, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.submit_contest(text, text, uuid, text, text, text, jsonb) TO authenticated;

COMMIT;
