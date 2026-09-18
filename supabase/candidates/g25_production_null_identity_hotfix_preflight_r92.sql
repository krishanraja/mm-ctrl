-- Read-only production preflight for G25 null-identity hotfix R92.

WITH targets(signature, expected_digest) AS (
  VALUES
    ('public.get_pending_verifications(uuid)', 'b6b8d00b09ef8a01879e67cb86940941'),
    ('public.has_role(uuid,app_role)', '4cb6b1479aeaa4d44cd3a37e4e14bd80'),
    ('public.fix_memory_fact(uuid)', 'c1c7e57308e9ec6a38fc279506dbac05'),
    ('public.touch_memory_fact(uuid)', 'dacde13c6dfedc8ac349be305ba90d59'),
    ('public.touch_memory_facts(uuid[])', '20a2bc3fd1e19888a10c1cf6626d2ad6'),
    ('public.verify_memory_fact(uuid,text,boolean)', '3143e98bbec21b8d6f13a323d6425d51'),
    ('public.pin_decision(uuid)', '0a655cecd221f10df277238b2aa27f6d')
), resolved AS (
  SELECT *, to_regprocedure(signature) AS oid FROM targets
)
SELECT
  count(*) AS target_count,
  count(*) FILTER (WHERE oid IS NOT NULL) AS resolved_count,
  count(*) FILTER (WHERE md5(pg_get_functiondef(oid)) = expected_digest) AS definition_match_count,
  count(*) FILTER (WHERE has_function_privilege('anon', oid, 'EXECUTE')) AS anon_allowed_count,
  count(*) FILTER (WHERE has_function_privilege('authenticated', oid, 'EXECUTE')) AS authenticated_allowed_count,
  count(*) FILTER (WHERE has_function_privilege('service_role', oid, 'EXECUTE')) AS service_allowed_count
FROM resolved;
