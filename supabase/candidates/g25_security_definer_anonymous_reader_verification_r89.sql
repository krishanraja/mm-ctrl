-- Read-only verification for G25 anonymous-reader hardening candidate R89.

WITH targets(signature, expect_definer, expect_anon, expect_authenticated, expect_service) AS (
  VALUES
    ('public.calculate_bootstrap_ci(numeric[],numeric,integer)', false, true, true, true),
    ('public.calculate_conversion_metrics(uuid)', true, false, false, true),
    ('public.get_intake_for_registration(uuid)', true, true, true, true),
    ('public.get_pending_verifications(uuid)', true, false, true, true),
    ('public.get_share_card(uuid)', true, true, true, true),
    ('public.has_role(uuid,app_role)', true, true, true, true),
    ('public.has_role(uuid,text)', true, false, false, true),
    ('public.hash_company_identifier(text)', true, false, false, true)
), resolved AS (
  SELECT
    signature,
    expect_definer,
    expect_anon,
    expect_authenticated,
    expect_service,
    to_regprocedure(signature) AS oid
  FROM targets
), evidence AS (
  SELECT
    signature,
    resolved.oid IS NOT NULL AS resolves,
    p.prosecdef = expect_definer AS definer_matches,
    has_function_privilege('anon', resolved.oid, 'EXECUTE') = expect_anon AS anon_matches,
    has_function_privilege('authenticated', resolved.oid, 'EXECUTE') = expect_authenticated AS authenticated_matches,
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
  count(*) FILTER (WHERE definer_matches) AS definer_match_count,
  count(*) FILTER (WHERE anon_matches) AS anon_match_count,
  count(*) FILTER (WHERE authenticated_matches) AS authenticated_match_count,
  count(*) FILTER (WHERE service_matches) AS service_match_count,
  count(*) FILTER (WHERE public_denied) AS public_denied_count,
  position('auth.uid()' IN pg_get_functiondef('public.get_pending_verifications(uuid)'::regprocedure)) > 0 AS pending_has_subject_guard,
  position('auth.role()' IN pg_get_functiondef('public.get_pending_verifications(uuid)'::regprocedure)) > 0 AS pending_has_service_route,
  position('auth.uid()' IN pg_get_functiondef('public.has_role(uuid,public.app_role)'::regprocedure)) > 0 AS role_has_subject_guard,
  position('auth.role()' IN pg_get_functiondef('public.has_role(uuid,public.app_role)'::regprocedure)) > 0 AS role_has_service_route,
  (
    SELECT count(*)
    FROM pg_policies
    WHERE coalesce(qual, '') ILIKE '%has_role%'
       OR coalesce(with_check, '') ILIKE '%has_role%'
  ) AS role_policy_dependency_count,
  jsonb_object_agg(signature, definition_digest ORDER BY signature) AS definition_digests
FROM evidence;
