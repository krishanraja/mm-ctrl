-- G25 SECURITY DEFINER high-risk ACL verification R83
-- Read only. Verifies permissions and definition identity without invoking any target function.

WITH expected(signature, definition_digest) AS (
  VALUES
    ('get_or_create_profile(text,text,text,text,text)', 'ba35154406871e3f865ecdcab99903f8'),
    ('increment_automator_usage(uuid,text)', 'f060a7898db5107b666698f4f444e66b'),
    ('process_pending_sync_logs()', '28cabc31bacf845c08e3c962e9375053'),
    ('schedule_sync_processing()', '5aa0afc73711bdef25063df8eb2cc22c'),
    ('snapshot_north_star()', '8c1249538f4664dd71a16d505419488f'),
    ('sp_aggregate_briefing_feedback(integer,integer)', 'b11fdfdb59dce7c067ef8a3b23063c71'),
    ('sync_lead_to_sheets(uuid,uuid,text)', 'a1120289263b933a6f40810e53469c8f'),
    ('track_referral_conversion(text,uuid,text,text)', '98b060afbec832eae49d1791a3420da8'),
    ('trigger_google_sheets_sync(text)', '3eeb826608015b5e75527624029dea1e')
), resolved AS (
  SELECT
    e.signature,
    e.definition_digest,
    to_regprocedure('public.' || e.signature) AS oid
  FROM expected e
), evidence AS (
  SELECT
    signature,
    oid,
    NOT has_function_privilege('anon', oid, 'EXECUTE') AS anon_denied,
    NOT has_function_privilege('authenticated', oid, 'EXECUTE') AS authenticated_denied,
    has_function_privilege('service_role', oid, 'EXECUTE') AS service_allowed,
    has_function_privilege('postgres', oid, 'EXECUTE') AS owner_allowed,
    md5(pg_get_functiondef(oid)) = definition_digest AS definition_unchanged
  FROM resolved
), internal_callers AS (
  SELECT count(*)::integer AS caller_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proname <> 'sync_lead_to_sheets'
    AND position('sync_lead_to_sheets' in pg_get_functiondef(p.oid)) > 0
)
SELECT
  count(*) AS target_count,
  count(*) FILTER (WHERE oid IS NOT NULL) AS resolved_count,
  count(*) FILTER (WHERE anon_denied) AS anon_denied_count,
  count(*) FILTER (WHERE authenticated_denied) AS authenticated_denied_count,
  count(*) FILTER (WHERE service_allowed) AS service_allowed_count,
  count(*) FILTER (WHERE owner_allowed) AS owner_allowed_count,
  count(*) FILTER (WHERE definition_unchanged) AS definition_unchanged_count,
  (SELECT caller_count FROM internal_callers) AS sync_lead_internal_caller_count,
  md5(string_agg(
    concat_ws('|', signature, anon_denied, authenticated_denied, service_allowed, owner_allowed, definition_unchanged),
    E'\n' ORDER BY signature
  )) AS acl_verification_digest
FROM evidence;
