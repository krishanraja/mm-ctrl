-- G25 anonymous-reader hardening runtime smoke R89
-- Runs only as an isolated test migration. Every fixture row is removed before success.

DO $test$
DECLARE
  v_user_a uuid := '00000000-0000-4000-8000-000000000089';
  v_user_b uuid := '00000000-0000-4000-8000-000000000090';
  v_fact_a uuid := '00000000-0000-4000-8000-000000000189';
  v_fact_b uuid := '00000000-0000-4000-8000-000000000190';
  v_count integer;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_memory WHERE id IN (v_fact_a, v_fact_b)) THEN
    RAISE EXCEPTION 'anonymous-reader smoke fixture already exists';
  END IF;

  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  ) VALUES
    (
      v_user_a,
      'r89-reader-a@example.invalid',
      '{"username":"r89_reader_a","display_name":"R89 Reader A"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      v_user_b,
      'r89-reader-b@example.invalid',
      '{"username":"r89_reader_b","display_name":"R89 Reader B"}'::jsonb,
      now(),
      now(),
      false,
      false
    );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_b, 'facilitator'::public.app_role);

  INSERT INTO public.user_memory (
    id,
    user_id,
    fact_key,
    fact_category,
    fact_label,
    fact_value,
    fact_context,
    verification_status,
    is_current,
    is_high_stakes,
    confidence_score,
    source_type
  ) VALUES
    (
      v_fact_a,
      v_user_a,
      'r89_reader_a_fact',
      'preference'::public.fact_category,
      'R89 reader A fact',
      'fixture A',
      'isolated runtime smoke',
      'inferred'::public.verification_status,
      true,
      false,
      0.75,
      'manual'::public.memory_source_type
    ),
    (
      v_fact_b,
      v_user_b,
      'r89_reader_b_fact',
      'preference'::public.fact_category,
      'R89 reader B fact',
      'fixture B',
      'isolated runtime smoke',
      'inferred'::public.verification_status,
      true,
      false,
      0.75,
      'manual'::public.memory_source_type
    );

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text,
    true
  );

  SELECT count(*) INTO v_count
  FROM public.get_pending_verifications(v_user_a);
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'authenticated caller could not read its own pending verification';
  END IF;

  BEGIN
    PERFORM * FROM public.get_pending_verifications(v_user_b);
    RAISE EXCEPTION 'cross-subject pending verification read was not blocked';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  IF public.has_role(v_user_b, 'facilitator'::public.app_role) THEN
    RAISE EXCEPTION 'authenticated caller could enumerate another user role';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_b::text, 'role', 'authenticated')::text,
    true
  );

  SELECT count(*) INTO v_count
  FROM public.get_pending_verifications(v_user_b);
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'second authenticated caller could not read its own pending verification';
  END IF;

  IF NOT public.has_role(v_user_b, 'facilitator'::public.app_role) THEN
    RAISE EXCEPTION 'authenticated caller could not read its own facilitator role';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('role', 'service_role')::text,
    true
  );

  SELECT count(*) INTO v_count
  FROM public.get_pending_verifications(v_user_a);
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'service route could not read the requested pending verification';
  END IF;

  IF NOT public.has_role(v_user_b, 'facilitator'::public.app_role) THEN
    RAISE EXCEPTION 'service route could not read the requested user role';
  END IF;

  PERFORM set_config('request.jwt.claims', '{}'::text, true);

  DELETE FROM public.user_memory WHERE id IN (v_fact_a, v_fact_b);
  DELETE FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.profiles WHERE id IN (v_user_a, v_user_b);
  DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b);

  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_memory WHERE id IN (v_fact_a, v_fact_b)) THEN
    RAISE EXCEPTION 'anonymous-reader smoke fixture cleanup failed';
  END IF;
END
$test$;
