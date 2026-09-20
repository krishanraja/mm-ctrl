-- G25 Auth user profile trigger verification R86
-- Read only. Verifies the exact attachment, enabled state and function identity.

SELECT
  count(*) AS trigger_count,
  count(*) FILTER (WHERE g.tgenabled = 'O') AS enabled_count,
  count(*) FILTER (WHERE fnn.nspname = 'public' AND p.proname = 'handle_new_user_profile') AS correct_function_count,
  count(*) FILTER (WHERE md5(pg_get_functiondef(p.oid)) = '6b81e9f2af22853784a8849434c2fc85') AS function_definition_unchanged_count,
  md5(string_agg(pg_get_triggerdef(g.oid, true), E'\n' ORDER BY pg_get_triggerdef(g.oid, true))) AS trigger_definition_digest
FROM pg_trigger g
JOIN pg_class c ON c.oid = g.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = g.tgfoid
JOIN pg_namespace fnn ON fnn.oid = p.pronamespace
WHERE NOT g.tgisinternal
  AND n.nspname = 'auth'
  AND c.relname = 'users'
  AND g.tgname = 'on_auth_user_created';
