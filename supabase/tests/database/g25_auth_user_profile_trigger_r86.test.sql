-- G25 Auth user profile trigger runtime smoke R86
-- Runs only as an isolated test migration. Every fixture row is removed before success.

DO $test$
DECLARE
  v_user_id uuid := '00000000-0000-4000-8000-000000000086';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'signup smoke fixture already exists';
  END IF;

  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  ) VALUES (
    v_user_id,
    'r86-signup-smoke@example.invalid',
    '{"username":"r86_signup","display_name":"R86 Signup"}'::jsonb,
    now(),
    now(),
    false,
    false
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_user_id
      AND username = 'r86_signup'
      AND email = 'r86-signup-smoke@example.invalid'
  ) THEN
    RAISE EXCEPTION 'signup trigger did not create the expected profile';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = v_user_id
      AND role::text = 'user'
  ) THEN
    RAISE EXCEPTION 'signup trigger did not create the expected user role';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'signup smoke fixture cleanup failed';
  END IF;
END
$test$;
