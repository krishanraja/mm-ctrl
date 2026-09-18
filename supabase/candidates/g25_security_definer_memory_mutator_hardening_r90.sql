-- G25 memory-mutator hardening candidate R90
-- Isolated test only. Every browser mutation is caller-bound; only touch telemetry keeps a service route.

BEGIN;

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
  SET verification_status = 'disputed',
      is_current = false
  WHERE id = p_fact_id
    AND user_id = v_caller_id;

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

CREATE OR REPLACE FUNCTION public.strengthen_memory_fact(p_fact_id uuid)
RETURNS public.user_memory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_row public.user_memory;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_memory
  SET confidence_score = least(1, confidence_score + 0.15),
      verification_status = 'verified',
      verified_at = now()
  WHERE id = p_fact_id
    AND user_id = v_caller_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Fact not found or not owned by caller';
  END IF;

  RETURN v_row;
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
    SET verification_status = 'verified',
        verified_at = now()
    WHERE id = p_fact_id
      AND user_id = v_caller_id;
  ELSIF p_is_correct AND p_new_value IS NOT NULL THEN
    UPDATE public.user_memory
    SET verification_status = 'corrected',
        fact_value = p_new_value,
        verified_at = now()
    WHERE id = p_fact_id
      AND user_id = v_caller_id;

    INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
    VALUES (v_caller_id, p_fact_id, 'user_corrected', jsonb_build_object(
      'fact_key', v_fact_key,
      'fact_label', v_fact_label,
      'prior_value', v_prior_value,
      'new_value', p_new_value
    ));
  ELSE
    UPDATE public.user_memory
    SET verification_status = 'rejected',
        is_current = false,
        verified_at = now()
    WHERE id = p_fact_id
      AND user_id = v_caller_id;

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

REVOKE EXECUTE ON FUNCTION public.fix_memory_fact(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fix_memory_fact(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.strengthen_memory_fact(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.strengthen_memory_fact(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.touch_memory_fact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_memory_fact(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.touch_memory_facts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_memory_facts(uuid[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.verify_memory_fact(uuid, text, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.verify_memory_fact(uuid, text, boolean) TO authenticated;

COMMIT;
