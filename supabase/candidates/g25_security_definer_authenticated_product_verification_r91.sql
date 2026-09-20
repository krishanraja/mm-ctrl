-- Read-only verification for G25 authenticated-product hardening candidate R91.

WITH targets(signature, expect_service) AS (
  VALUES
    ('public.get_track_record(uuid)', true),
    ('public.list_mcp_tokens()', false),
    ('public.mint_mcp_token(text,boolean)', false),
    ('public.pin_decision(uuid)', false),
    ('public.record_decision_outcome(uuid,text,text,smallint,text,text)', false),
    ('public.resolve_decision(uuid,text,text)', false),
    ('public.revoke_mcp_token(uuid)', false),
    ('public.submit_contest(text,text,uuid,text,text,text,jsonb)', false)
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
  position('v_caller_id IS NULL' IN pg_get_functiondef('public.pin_decision(uuid)'::regprocedure)) > 0 AS pin_null_guard,
  position('IS DISTINCT FROM v_caller_id' IN pg_get_functiondef('public.pin_decision(uuid)'::regprocedure)) > 0 AS pin_exact_owner_guard,
  jsonb_object_agg(signature, definition_digest ORDER BY signature) AS definition_digests
FROM evidence;
