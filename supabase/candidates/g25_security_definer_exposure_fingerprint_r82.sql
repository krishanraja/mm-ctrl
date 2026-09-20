-- G25 SECURITY DEFINER exposure fingerprint R82
-- Read only. Returns aggregate counts and a digest, never routine bodies or row data.

WITH fn AS (
  SELECT
    n.nspname AS schema_name,
    p.oid::regprocedure::text AS signature,
    pg_get_function_result(p.oid) AS result_type,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
    EXISTS (
      SELECT 1
      FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      WHERE acl.grantee = 0
        AND acl.privilege_type = 'EXECUTE'
    ) AS public_execute,
    pg_get_functiondef(p.oid) ~* 'auth[.]uid[[:space:]]*[(]' AS auth_uid_marker,
    pg_get_functiondef(p.oid) ~* '(current_user|session_user|current_role)' AS role_marker,
    pg_get_functiondef(p.oid) ~* '(^|[^[:alnum:]_])(insert[[:space:]]+into|update[[:space:]]+|delete[[:space:]]+from|truncate[[:space:]]+)' AS write_marker,
    pg_get_functiondef(p.oid) ~* '(http_post|http_get|net[.])' AS network_marker,
    md5(pg_get_functiondef(p.oid)) AS definition_digest
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private', 'ctrl_discovery')
    AND p.prosecdef
    AND p.prokind = 'f'
    AND (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
), lines AS (
  SELECT
    *,
    concat_ws(
      '|',
      schema_name,
      signature,
      result_type,
      anon_execute::text,
      authenticated_execute::text,
      public_execute::text,
      auth_uid_marker::text,
      role_marker::text,
      write_marker::text,
      network_marker::text,
      definition_digest
    ) AS line
  FROM fn
)
SELECT
  count(*) AS callable_security_definer_count,
  count(*) FILTER (WHERE anon_execute) AS anon_count,
  count(*) FILTER (WHERE authenticated_execute) AS authenticated_count,
  count(*) FILTER (WHERE public_execute) AS public_default_count,
  count(*) FILTER (WHERE result_type = 'trigger') AS trigger_result_count,
  count(*) FILTER (WHERE result_type <> 'trigger') AS non_trigger_count,
  count(*) FILTER (WHERE result_type <> 'trigger' AND anon_execute) AS anon_non_trigger_count,
  count(*) FILTER (WHERE result_type <> 'trigger' AND write_marker) AS write_non_trigger_count,
  count(*) FILTER (
    WHERE result_type <> 'trigger'
      AND anon_execute
      AND write_marker
      AND NOT auth_uid_marker
      AND NOT role_marker
  ) AS anon_write_no_auth_marker_count,
  count(*) FILTER (
    WHERE result_type <> 'trigger'
      AND anon_execute
      AND NOT write_marker
      AND NOT auth_uid_marker
      AND NOT role_marker
  ) AS anon_read_no_auth_marker_count,
  md5(string_agg(line, E'\n' ORDER BY line)) AS exposure_digest
FROM lines;
