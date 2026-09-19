-- Read-only verification for G25 memory-mutator hardening candidate R90.

WITH targets(signature, expect_service) AS (
  VALUES
    ('public.fix_memory_fact(uuid)', false),
    ('public.strengthen_memory_fact(uuid)', false),
    ('public.touch_memory_fact(uuid)', true),
    ('public.touch_memory_facts(uuid[])', true),
    ('public.verify_memory_fact(uuid,text,boolean)', false)
), resolved AS (
  SELECT signature, expect_service, to_regprocedure(signature) AS oid
  FROM targets
), evidence AS (
  SELECT
    signature,
    resolved.oid IS NOT NULL AS resolves,
    p.prosecdef,
    NOT has_function_privilege('anon', resolved.oid, 'EXECUTE') AS anon_denied,
    has_function_privilege('authenticated', resolved.oid, 'EXECUTE') AS authenticated_allowed,
    has_function_privilege('service_role', resolved.oid, 'EXECUTE') = expect_service AS service_matches,
    NOT EXISTS (
      SELECT 1
      FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      WHERE acl.grantee = 0
        AND acl.privilege_type = 'EXECUTE'
    ) AS public_denied,
    md5(pg_get_functiondef(resolved.oid)) AS definition_digest
  FROM resolved
  LEFT JOIN pg_proc p ON p.oid = resolved.oid
)
SELECT
  count(*) AS target_count,
  count(*) FILTER (WHERE resolves) AS resolved_count,
  count(*) FILTER (WHERE prosecdef) AS definer_count,
  count(*) FILTER (WHERE anon_denied) AS anon_denied_count,
  count(*) FILTER (WHERE authenticated_allowed) AS authenticated_allowed_count,
  count(*) FILTER (WHERE service_matches) AS service_match_count,
  count(*) FILTER (WHERE public_denied) AS public_denied_count,
  position('v_caller_id IS NULL' IN pg_get_functiondef('public.fix_memory_fact(uuid)'::regprocedure)) > 0 AS fix_null_guard,
  position('IS DISTINCT FROM v_caller_id' IN pg_get_functiondef('public.verify_memory_fact(uuid,text,boolean)'::regprocedure)) > 0 AS verify_exact_owner_guard,
  position('v_service boolean := auth.role() = ''service_role''' IN pg_get_functiondef('public.touch_memory_facts(uuid[])'::regprocedure)) > 0 AS touch_service_guard,
  jsonb_object_agg(signature, definition_digest ORDER BY signature) AS definition_digests
FROM evidence;
