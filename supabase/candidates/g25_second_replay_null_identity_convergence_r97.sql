-- G25 second-replay null-identity convergence R97
-- Applies the exact R92 final payload after the R89, R90 and R91 hardening stages.
-- Candidate only. It refuses baseline, partially hardened or otherwise drifted state.

BEGIN;

DO $preflight$
DECLARE
  v_expected jsonb := jsonb_build_object(
    'public.get_pending_verifications(uuid)', '8e14b094b48208ee9b53aea064713eea',
    'public.has_role(uuid,app_role)', '27fb57c94990e1e8b76993c8c5639e60',
    'public.fix_memory_fact(uuid)', '7bfc0b216b9102b831edc52ca8a4da2c',
    'public.touch_memory_fact(uuid)', '84e289e5cf89baab91b9250d6ffe7e16',
    'public.touch_memory_facts(uuid[])', '3d25b2b52734d93094943a3db9dbce05',
    'public.verify_memory_fact(uuid,text,boolean)', 'ab2dcd761a18a741441a3b138f4b58e1',
    'public.pin_decision(uuid)', '00a04460113c474969b496aa691341d7'
  );
  v_signature text;
  v_oid regprocedure;
BEGIN
  FOR v_signature IN SELECT jsonb_object_keys(v_expected) LOOP
    v_oid := to_regprocedure(v_signature);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'R97 preflight: missing function %', v_signature;
    END IF;
    IF md5(pg_get_functiondef(v_oid)) IS DISTINCT FROM v_expected->>v_signature THEN
      RAISE EXCEPTION 'R97 preflight: definition drift for %', v_signature;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
      WHERE p.oid=v_oid
        AND acl.grantee=0
        AND acl.privilege_type='EXECUTE'
    ) THEN
      RAISE EXCEPTION 'R97 preflight: inherited PUBLIC execution for %', v_signature;
    END IF;
  END LOOP;

  IF has_function_privilege('anon','public.get_pending_verifications(uuid)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.get_pending_verifications(uuid)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.get_pending_verifications(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'R97 preflight: pending-verification ACL drift';
  END IF;

  IF NOT has_function_privilege('anon','public.has_role(uuid,app_role)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.has_role(uuid,app_role)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.has_role(uuid,app_role)','EXECUTE') THEN
    RAISE EXCEPTION 'R97 preflight: role-helper ACL drift';
  END IF;

  IF has_function_privilege('anon','public.fix_memory_fact(uuid)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.fix_memory_fact(uuid)','EXECUTE')
    OR has_function_privilege('service_role','public.fix_memory_fact(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.verify_memory_fact(uuid,text,boolean)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.verify_memory_fact(uuid,text,boolean)','EXECUTE')
    OR has_function_privilege('service_role','public.verify_memory_fact(uuid,text,boolean)','EXECUTE')
    OR has_function_privilege('anon','public.pin_decision(uuid)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.pin_decision(uuid)','EXECUTE')
    OR has_function_privilege('service_role','public.pin_decision(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'R97 preflight: owner-mutation ACL drift';
  END IF;

  IF has_function_privilege('anon','public.touch_memory_fact(uuid)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.touch_memory_fact(uuid)','EXECUTE')
    OR NOT has_function_privilege('service_role','public.touch_memory_fact(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.touch_memory_facts(uuid[])','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.touch_memory_facts(uuid[])','EXECUTE')
    OR NOT has_function_privilege('service_role','public.touch_memory_facts(uuid[])','EXECUTE') THEN
    RAISE EXCEPTION 'R97 preflight: reliance-telemetry ACL drift';
  END IF;
END
$preflight$;

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
    um.id, um.fact_key, um.fact_category, um.fact_label,
    um.fact_value, um.fact_context, um.confidence_score
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
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    WHEN auth.uid() IS NOT NULL AND _user_id = auth.uid() THEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END
$function$;

CREATE OR REPLACE FUNCTION public.fix_memory_fact(p_fact_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_user_id uuid;
  v_fact_key text;
  v_fact_label text;
  v_prior_value text;
BEGIN
  SELECT user_id, fact_key, fact_label, fact_value
    INTO v_user_id, v_fact_key, v_fact_label, v_prior_value
  FROM public.user_memory
  WHERE id = p_fact_id;

  IF v_caller_id IS NULL OR v_user_id IS DISTINCT FROM v_caller_id THEN
    RETURN false;
  END IF;

  UPDATE public.user_memory
  SET verification_status = 'disputed', is_current = false
  WHERE id = p_fact_id AND user_id = v_caller_id;

  UPDATE public.memory_edges
  SET is_active = false
  WHERE user_id = v_caller_id
    AND (from_fact_id = p_fact_id OR to_fact_id = p_fact_id);

  INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
  VALUES (v_caller_id, p_fact_id, 'user_disputed', jsonb_build_object(
    'fact_key', v_fact_key,
    'fact_label', v_fact_label,
    'prior_value', v_prior_value
  ));

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.touch_memory_fact(p_fact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_service boolean := auth.role() = 'service_role';
BEGIN
  IF v_caller_id IS NULL AND NOT v_service THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_memory
  SET reference_count = reference_count + 1,
      last_referenced_at = now()
  WHERE id = p_fact_id
    AND is_current = true
    AND (user_id = v_caller_id OR v_service);
END;
$function$;

CREATE OR REPLACE FUNCTION public.touch_memory_facts(p_fact_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_service boolean := auth.role() = 'service_role';
  v_touched integer;
BEGIN
  IF v_caller_id IS NULL AND NOT v_service THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_fact_ids IS NULL OR array_length(p_fact_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.user_memory
  SET reference_count = reference_count + 1,
      last_referenced_at = now()
  WHERE id = ANY(p_fact_ids)
    AND is_current = true
    AND (user_id = v_caller_id OR v_service);

  GET DIAGNOSTICS v_touched = ROW_COUNT;
  RETURN v_touched;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_memory_fact(
  p_fact_id uuid,
  p_new_value text DEFAULT NULL,
  p_is_correct boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_user_id uuid;
  v_fact_key text;
  v_fact_label text;
  v_prior_value text;
BEGIN
  SELECT user_id, fact_key, fact_label, fact_value
    INTO v_user_id, v_fact_key, v_fact_label, v_prior_value
  FROM public.user_memory
  WHERE id = p_fact_id;

  IF v_caller_id IS NULL OR v_user_id IS DISTINCT FROM v_caller_id THEN
    RETURN false;
  END IF;

  IF p_is_correct AND p_new_value IS NULL THEN
    UPDATE public.user_memory
    SET verification_status = 'verified', verified_at = now()
    WHERE id = p_fact_id AND user_id = v_caller_id;
  ELSIF p_is_correct AND p_new_value IS NOT NULL THEN
    UPDATE public.user_memory
    SET verification_status = 'corrected', fact_value = p_new_value, verified_at = now()
    WHERE id = p_fact_id AND user_id = v_caller_id;
    INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
    VALUES (v_caller_id, p_fact_id, 'user_corrected', jsonb_build_object(
      'fact_key', v_fact_key,
      'fact_label', v_fact_label,
      'prior_value', v_prior_value,
      'new_value', p_new_value
    ));
  ELSE
    UPDATE public.user_memory
    SET verification_status = 'rejected', is_current = false, verified_at = now()
    WHERE id = p_fact_id AND user_id = v_caller_id;
    INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
    VALUES (v_caller_id, p_fact_id, 'user_rejected', jsonb_build_object(
      'fact_key', v_fact_key,
      'fact_label', v_fact_label,
      'prior_value', v_prior_value
    ));
  END IF;

  RETURN true;
END;
$function$;

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
  WHERE user_id = v_caller_id AND pinned_at IS NOT NULL AND id <> p_case_id;

  UPDATE public.decision_cases
  SET pinned_at = now()
  WHERE id = p_case_id AND user_id = v_caller_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_pending_verifications(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_verifications(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.fix_memory_fact(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fix_memory_fact(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.touch_memory_fact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_memory_fact(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.touch_memory_facts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_memory_facts(uuid[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.verify_memory_fact(uuid, text, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.verify_memory_fact(uuid, text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.pin_decision(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.pin_decision(uuid) TO authenticated;

COMMIT;
