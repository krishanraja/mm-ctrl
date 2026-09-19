-- G25 authenticated-product hardening runtime smoke R91
-- Runs only as an isolated test migration. Every fixture row is removed before success.

DO $test$
DECLARE
  v_user_a uuid := '00000000-0000-4000-8000-000000000093';
  v_user_b uuid := '00000000-0000-4000-8000-000000000094';
  v_case_pin uuid := '00000000-0000-4000-8000-000000000193';
  v_case_record uuid := '00000000-0000-4000-8000-000000000194';
  v_case_resolve uuid := '00000000-0000-4000-8000-000000000195';
  v_case_b uuid := '00000000-0000-4000-8000-000000000196';
  v_token_id uuid;
  v_token jsonb;
  v_contest jsonb;
  v_count integer;
  v_bool boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.decision_cases WHERE id IN (v_case_pin, v_case_record, v_case_resolve, v_case_b)) THEN
    RAISE EXCEPTION 'authenticated-product smoke fixture already exists';
  END IF;

  INSERT INTO auth.users (
    id, email, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
  ) VALUES
    (v_user_a, 'r91-product-a@example.invalid', '{"username":"r91_product_a"}'::jsonb, now(), now(), false, false),
    (v_user_b, 'r91-product-b@example.invalid', '{"username":"r91_product_b"}'::jsonb, now(), now(), false, false);

  INSERT INTO public.decision_cases (id, user_id, statement, title)
  VALUES
    (v_case_pin, v_user_a, 'R91 pin fixture', 'R91 pin'),
    (v_case_record, v_user_a, 'R91 outcome fixture', 'R91 outcome'),
    (v_case_resolve, v_user_a, 'R91 resolve fixture', 'R91 resolve'),
    (v_case_b, v_user_b, 'R91 other subject fixture', 'R91 other subject');

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_a::text, 'role', 'authenticated')::text,
    true
  );

  BEGIN
    PERFORM * FROM public.get_track_record(v_user_b);
    RAISE EXCEPTION 'cross-subject track record read was not blocked';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cross-subject track record read was not blocked' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    PERFORM public.pin_decision(v_case_b);
    RAISE EXCEPTION 'cross-subject pin was not blocked';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.record_decision_outcome(v_case_b, NULL::text, 'true', 5::smallint, 'not allowed', 'r91');
    RAISE EXCEPTION 'cross-subject outcome was not blocked';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cross-subject outcome was not blocked' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    PERFORM public.resolve_decision(v_case_b, 'true', 'not allowed');
    RAISE EXCEPTION 'cross-subject resolve was not blocked';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cross-subject resolve was not blocked' THEN
      RAISE;
    END IF;
  END;

  PERFORM public.pin_decision(v_case_pin);
  IF NOT EXISTS (SELECT 1 FROM public.decision_cases WHERE id = v_case_pin AND pinned_at IS NOT NULL) THEN
    RAISE EXCEPTION 'owned pin failed';
  END IF;

  PERFORM public.record_decision_outcome(v_case_record, NULL::text, 'true', 5::smallint, 'owned outcome', 'r91');
  IF NOT EXISTS (
    SELECT 1 FROM public.decision_outcomes
    WHERE decision_case_id = v_case_record AND user_id = v_user_a AND applied_to_brain = true
  ) THEN
    RAISE EXCEPTION 'owned outcome was not recorded and applied';
  END IF;

  PERFORM public.resolve_decision(v_case_resolve, 'too_early', 'owned resolve');
  IF NOT EXISTS (
    SELECT 1 FROM public.decision_cases
    WHERE id = v_case_resolve AND user_id = v_user_a AND status = 'decided'
  ) THEN
    RAISE EXCEPTION 'owned resolve did not close the decision';
  END IF;

  SELECT count(*) INTO v_count FROM public.get_track_record(v_user_a);
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'owned track record did not return the three fixture decisions';
  END IF;

  v_token := public.mint_mcp_token('R91 fixture', true);
  v_token_id := (v_token->>'id')::uuid;
  IF v_token_id IS NULL OR position('ctrl_mcp_' IN (v_token->>'token')) <> 1 THEN
    RAISE EXCEPTION 'owned MCP token mint failed';
  END IF;

  SELECT count(*) INTO v_count FROM public.list_mcp_tokens();
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'owned MCP token list failed';
  END IF;

  v_bool := public.revoke_mcp_token(v_token_id);
  IF NOT v_bool OR NOT EXISTS (SELECT 1 FROM public.mcp_tokens WHERE id = v_token_id AND revoked_at IS NOT NULL) THEN
    RAISE EXCEPTION 'owned MCP token revoke failed';
  END IF;

  v_contest := public.submit_contest('visual', NULL, NULL, 'r91-smoke', 'fixture', 'owned contest', '{}'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM public.contest_reports
    WHERE id = (v_contest->>'report_id')::uuid AND user_id = v_user_a
  ) THEN
    RAISE EXCEPTION 'owned contest submission failed';
  END IF;

  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  SELECT count(*) INTO v_count FROM public.get_track_record(v_user_b);
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'service track-record route was not preserved';
  END IF;

  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  BEGIN
    PERFORM public.pin_decision(v_case_b);
    RAISE EXCEPTION 'anonymous pin body guard did not block';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('request.jwt.claims', '{}'::text, true);

  DELETE FROM public.contest_reports WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.mcp_tokens WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.decision_outcomes WHERE decision_case_id IN (v_case_pin, v_case_record, v_case_resolve, v_case_b);
  DELETE FROM public.decision_cases WHERE id IN (v_case_pin, v_case_record, v_case_resolve, v_case_b);
  DELETE FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b);
  DELETE FROM public.profiles WHERE id IN (v_user_a, v_user_b);
  DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b);

  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.decision_cases WHERE id IN (v_case_pin, v_case_record, v_case_resolve, v_case_b))
    OR EXISTS (SELECT 1 FROM public.decision_outcomes WHERE decision_case_id IN (v_case_pin, v_case_record, v_case_resolve, v_case_b))
    OR EXISTS (SELECT 1 FROM public.mcp_tokens WHERE user_id IN (v_user_a, v_user_b))
    OR EXISTS (SELECT 1 FROM public.contest_reports WHERE user_id IN (v_user_a, v_user_b)) THEN
    RAISE EXCEPTION 'authenticated-product smoke fixture cleanup failed';
  END IF;
END
$test$;
