-- Read-only verification for G25 production null-identity hotfix candidate R92.

WITH targets(signature, expected_digest, expect_anon, expect_service) AS (
  VALUES
    ('public.get_pending_verifications(uuid)', 'ff5645d77ee87cf085fe0199dcedb056', false, true),
    ('public.has_role(uuid,app_role)', '69b10171b9fc6bd483b03f5cb5bf7809', true, true),
    ('public.fix_memory_fact(uuid)', '51d901710dd937d1cf29b1437c5f2bb6', false, false),
    ('public.touch_memory_fact(uuid)', '84e289e5cf89baab91b9250d6ffe7e16', false, true),
    ('public.touch_memory_facts(uuid[])', '6d57896b69cc7727e4113b843ab64b31', false, true),
    ('public.verify_memory_fact(uuid,text,boolean)', 'd65b21eb6b5d329355613fba323c5e80', false, false),
    ('public.pin_decision(uuid)', '4e4fe71601c7b580d0a9a53bb5c58247', false, false)
), resolved AS (
  SELECT *, to_regprocedure(signature) AS oid FROM targets
), evidence AS (
  SELECT
    signature,
    resolved.oid IS NOT NULL AS resolves,
    md5(pg_get_functiondef(resolved.oid)) = expected_digest AS definition_matches,
    has_function_privilege('anon', resolved.oid, 'EXECUTE') = expect_anon AS anon_matches,
    has_function_privilege('authenticated', resolved.oid, 'EXECUTE') AS authenticated_allowed,
    has_function_privilege('service_role', resolved.oid, 'EXECUTE') = expect_service AS service_matches,
    NOT EXISTS (
      SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
    ) AS public_denied
  FROM resolved
  LEFT JOIN pg_proc p ON p.oid = resolved.oid
)
SELECT
  count(*) AS target_count,
  count(*) FILTER (WHERE resolves) AS resolved_count,
  count(*) FILTER (WHERE definition_matches) AS definition_match_count,
  count(*) FILTER (WHERE anon_matches) AS anon_match_count,
  count(*) FILTER (WHERE authenticated_allowed) AS authenticated_allowed_count,
  count(*) FILTER (WHERE service_matches) AS service_match_count,
  count(*) FILTER (WHERE public_denied) AS public_denied_count
FROM evidence;
