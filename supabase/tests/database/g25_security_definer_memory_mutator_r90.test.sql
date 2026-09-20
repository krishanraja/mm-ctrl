-- G25 memory-mutator hardening runtime smoke R90
-- Runs only as an isolated test migration. Every fixture row is removed before success.

DO $test$
DECLARE
  v_user_a uuid := '00000000-0000-4000-8000-000000000091';
  v_user_b uuid := '00000000-0000-4000-8000-000000000092';
  v_fact_a uuid := '00000000-0000-4000-8000-000000000191';
  v_fact_b uuid := '00000000-0000-4000-8000-000000000192';
  v_touched integer;
  v_result boolean;
  v_count integer;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_memory WHERE id IN (v_fact_a, v_fact_b)) THEN
    RAISE EXCEPTION 'memory-mutator smoke fixture already exists';
  END IF;

  INSERT INTO auth.users (
    id, email, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
  ) VALUES
    (v_user_a, 'r90-memory-a@example.invalid', '{"username":"r90_memory_a"}'::jsonb, now(), now(), false, false),
    (v_user_b, 'r90-memory-b@example.invalid', '{"username":"r90_memory_b"}'::jsonb, now(), now(), false, false);

  INSERT INTO public.user_memory (
    id, user_id, fact_key, fact_category, fact_label, fact_value, fact_context,
    verification_status, is_current, is_high_stakes, confidence_score, source_type
  ) VALUES
    (v_fact_a, v_user_a, 'r90_memory_a', 'preference', 'R90 memory A', 'fixture A', 'isolated runtime smoke', 'inferred', true, false, 0.50, 'manual'),
    (v_fact_b, v_user_b, 'r90_memory_b', 'preference', 'R90 memory B', 'fixture B', 'isolated runtime smoke', 'inferred', true, false, 0.50, 'manual');

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text,
    true
  );

  v_result := public.fix_memory_fact(v_fact_b);
  IF v_result THEN
    RAISE EXCEPTION 'cross-subject fix was not blocked';
  END IF;

  v_result := public.verify_memory_fact(v_fact_b, 'not allowed', true);
  IF v_result THEN
    RAISE EXCEPTION 'cross-subject verification was not blocked';
  END IF;

  BEGIN
    PERFORM public.strengthen_memory_fact(v_fact_b);
    RAISE EXCEPTION 'cross-subject strengthen was not blocked';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cross-subject strengthen was not blocked' THEN
      RAISE;
    END IF;
  END;

  PERFORM public.touch_memory_fact(v_fact_b);
  SELECT reference_count INTO v_count FROM public.user_memory WHERE id = v_fact_b;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'cross-subject single touch was not blocked';
  END IF;

  v_touched := public.touch_memory_facts(ARRAY[v_fact_a, v_fact_b]);
  IF v_touched <> 1 THEN
    RAISE EXCEPTION 'authenticated batch touch did not stay inside the caller subject';
  END IF;

  PERFORM public.strengthen_memory_fact(v_fact_a);
  v_result := public.verify_memory_fact(v_fact_a, 'fixture A corrected', true);
  IF NOT v_result THEN
    RAISE EXCEPTION 'owned verification failed';
  END IF;

  v_result := public.fix_memory_fact(v_fact_a);
  IF NOT v_result THEN
    RAISE EXCEPTION 'owned fix failed';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.memory_events
  WHERE fact_id = v_fact_a
    AND kind IN ('user_corrected', 'user_disputed');
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'owned correction events did not persist exactly once';
  END IF;

  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  BEGIN
    PERFORM public.touch_memory_fact(v_fact_b);
    RAISE EXCEPTION 'anonymous touch body guard did not block';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  v_touched := public.touch_memory_facts(ARRAY[v_fact_b]);
  IF v_touched <> 1 THEN
    RAISE EXCEPTION 'service touch route was not preserved';
  END IF;

  PERFORM set_config('request.jwt.claims', '{}'::text, true);

  DELETE FROM public.memory_events WHERE fact_id IN (v_fact_a, v_fact_b);
  DELETE FROM public.memory_edges WHERE from_fact_id IN (v_fact_a, v_fact_b) OR to_fact_id IN (v_fact_a, v_fact_b);
  DELETE FROM public.user_memory WHERE id IN (v_fact_a, v_fact_b);
  DELETE FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.profiles WHERE id IN (v_user_a, v_user_b);
  DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b);

  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_memory WHERE id IN (v_fact_a, v_fact_b))
    OR EXISTS (SELECT 1 FROM public.memory_events WHERE fact_id IN (v_fact_a, v_fact_b)) THEN
    RAISE EXCEPTION 'memory-mutator smoke fixture cleanup failed';
  END IF;
END
$test$;
