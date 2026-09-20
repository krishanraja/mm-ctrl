-- G25 anonymous-reader hardening candidate R89
-- Isolated test only. Narrows execution and binds subject-sensitive reads to the caller.

BEGIN;

ALTER FUNCTION public.calculate_bootstrap_ci(numeric[], numeric, integer) SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.get_pending_verifications(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  fact_key text,
  fact_category public.fact_category,
  fact_label text,
  fact_value text,
  fact_context text,
  confidence_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RAISE EXCEPTION 'Cannot read another user''s pending verifications'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    um.id,
    um.fact_key,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.fact_context,
    um.confidence_score
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
    AND um.is_current = true
    AND um.verification_status = 'inferred'
  ORDER BY um.is_high_stakes DESC, um.confidence_score DESC
  LIMIT 50;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.role() = 'service_role' THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
    WHEN auth.uid() IS NOT NULL AND _user_id = auth.uid() THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
    ELSE false
  END
$function$;

REVOKE EXECUTE ON FUNCTION public.calculate_bootstrap_ci(numeric[], numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_bootstrap_ci(numeric[], numeric, integer) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.calculate_conversion_metrics(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_conversion_metrics(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_intake_for_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_intake_for_registration(uuid) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_pending_verifications(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_verifications(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_share_card(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_share_card(uuid) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.hash_company_identifier(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hash_company_identifier(text) TO service_role;

COMMIT;
