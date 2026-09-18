-- G25 second replay extension runtime proof R98.
-- Runs only on an isolated recovery target. Every fixture is removed before success.

DO $test$
DECLARE
  v_user uuid := '00000000-0000-4000-8000-000000000298';
  v_exact_fact uuid := '00000000-0000-4000-8000-000000000498';
  v_orthogonal_fact uuid := '00000000-0000-4000-8000-000000000499';
  v_named_job bigint;
  v_id_job bigint;
  v_ids uuid[];
  v_similarities double precision[];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname IN ('g25_r98_named_fixture', 'g25_r98_id_fixture')
  ) OR EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = v_user
  ) OR EXISTS (
    SELECT 1
    FROM public.user_memory
    WHERE id IN (v_exact_fact, v_orthogonal_fact)
  ) THEN
    RAISE EXCEPTION 'R98 extension fixture already exists';
  END IF;

  v_named_job := cron.schedule(
    'g25_r98_named_fixture',
    '0 0 1 1 *',
    'select 1'
  );

  IF v_named_job IS NULL OR NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobid = v_named_job
      AND jobname = 'g25_r98_named_fixture'
      AND schedule = '0 0 1 1 *'
      AND command = 'select 1'
  ) THEN
    RAISE EXCEPTION 'R98 named cron schedule was not readable';
  END IF;

  IF NOT cron.unschedule('g25_r98_named_fixture') THEN
    RAISE EXCEPTION 'R98 named cron unschedule failed';
  END IF;

  v_id_job := cron.schedule('0 0 1 1 *', 'select 1');
  IF v_id_job IS NULL OR NOT cron.unschedule(v_id_job) THEN
    RAISE EXCEPTION 'R98 ID cron unschedule failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'g25_r98_named_fixture'
  ) THEN
    RAISE EXCEPTION 'R98 cron fixture cleanup failed';
  END IF;

  INSERT INTO auth.users (
    id, email, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
  ) VALUES (
    v_user,
    'r98-vector@example.invalid',
    '{"username":"r98_vector"}'::jsonb,
    now(),
    now(),
    false,
    false
  );

  INSERT INTO public.user_memory (
    id, user_id, fact_key, fact_category, fact_label, fact_value, fact_context,
    verification_status, is_current, is_high_stakes, confidence_score, source_type,
    embedding
  ) VALUES
    (
      v_exact_fact, v_user, 'r98_vector_exact', 'preference', 'R98 exact vector',
      'exact', 'isolated extension runtime proof', 'inferred', true, false, 0.50,
      'manual',
      (ARRAY[1::real] || array_fill(0::real, ARRAY[1535]))::public.vector
    ),
    (
      v_orthogonal_fact, v_user, 'r98_vector_orthogonal', 'preference',
      'R98 orthogonal vector', 'orthogonal', 'isolated extension runtime proof',
      'inferred', true, false, 0.50, 'manual',
      (ARRAY[0::real, 1::real] || array_fill(0::real, ARRAY[1534]))::public.vector
    );

  SELECT array_agg(result.id), array_agg(result.similarity)
  INTO v_ids, v_similarities
  FROM public.match_user_memory(
    (ARRAY[1::real] || array_fill(0::real, ARRAY[1535]))::public.vector,
    10,
    v_user,
    -1
  ) AS result;

  IF cardinality(v_ids) <> 2
    OR v_ids[1] IS DISTINCT FROM v_exact_fact
    OR v_ids[2] IS DISTINCT FROM v_orthogonal_fact
    OR abs(v_similarities[1] - 1::double precision) > 0.000001
    OR abs(v_similarities[2] - 0::double precision) > 0.000001 THEN
    RAISE EXCEPTION 'R98 vector runtime result drifted: ids %, similarities %',
      v_ids, v_similarities;
  END IF;

  DELETE FROM public.user_memory
  WHERE id IN (v_exact_fact, v_orthogonal_fact);

  DELETE FROM public.user_roles
  WHERE user_id = v_user;

  DELETE FROM public.profiles
  WHERE id = v_user;

  DELETE FROM auth.users
  WHERE id = v_user;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user)
    OR EXISTS (
      SELECT 1
      FROM public.user_memory
      WHERE id IN (v_exact_fact, v_orthogonal_fact)
    ) THEN
    RAISE EXCEPTION 'R98 vector fixture cleanup failed';
  END IF;
END;
$test$;

SELECT
  NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'g25_r98_named_fixture'
  ) AS cron_fixture_clean,
  NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = '00000000-0000-4000-8000-000000000298'
  ) AS vector_auth_fixture_clean,
  NOT EXISTS (
    SELECT 1
    FROM public.user_memory
    WHERE id IN (
      '00000000-0000-4000-8000-000000000498',
      '00000000-0000-4000-8000-000000000499'
    )
  ) AS vector_fact_fixture_clean;
