-- G25 SECURITY DEFINER trigger ACL verification R85
-- Read only. Verifies ACLs, definitions and trigger attachments without invoking a trigger function.

WITH expected(signature, definition_digest) AS (
  VALUES
    ('handle_new_user()', '872c29bcbd7f5f3c80592d8bacf18512'),
    ('handle_new_user_profile()', '6b81e9f2af22853784a8849434c2fc85'),
    ('log_booking_request()', '0efe6654718e4f3cf222444bf4ab979a'),
    ('log_consent_change()', '3c0cc5bdaad4fa200d4d978ac4d23a7a'),
    ('trigger_analytics_sheets_sync()', 'fce07e2ebee74a3e6d9605080cda421d'),
    ('trigger_booking_http_sync()', '6d29d1788b9a1bb618488bee869d03b2'),
    ('trigger_booking_requests_sync()', '9e9375385f4c41e82edce9599f0a6f4e'),
    ('trigger_booking_sheets_sync()', '14fd08a0e39b9a3ce9f1732aca953879'),
    ('trigger_booking_sync()', '350015fcd979bd1da2142b0682e9891f'),
    ('trigger_business_context_sync()', 'd14779a9d0294ac6da8eeb92bf2b48b3'),
    ('trigger_contact_collection_sync()', '88001823c33c13d4147f36d63a4eea80'),
    ('trigger_google_sheets_edge_function()', 'f2a0484f33948e2154631ae2344c5d18'),
    ('trigger_lead_score_sheets_sync()', '319757431db5c0d7ceb4087f8f4f0893'),
    ('update_profile_from_insights()', '1c20f9519d0dba89e426cd749ee5b010'),
    ('update_updated_at_column()', '7be3d094bf7781418fbcac3630a25c24')
), resolved AS (
  SELECT e.signature, e.definition_digest, to_regprocedure('public.' || e.signature) AS oid
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
), attachments AS (
  SELECT g.oid, g.tgenabled
  FROM resolved r
  JOIN pg_trigger g ON g.tgfoid = r.oid AND NOT g.tgisinternal
), direct_definition_callers AS (
  SELECT DISTINCT r.signature, p.oid AS caller_oid
  FROM resolved r
  JOIN pg_proc p ON p.prokind = 'f' AND p.proname <> split_part(r.signature, '(', 1)
  WHERE position(split_part(r.signature, '(', 1) in pg_get_functiondef(p.oid)) > 0
)
SELECT
  count(*) AS target_count,
  count(*) FILTER (WHERE oid IS NOT NULL) AS resolved_count,
  count(*) FILTER (WHERE anon_denied) AS anon_denied_count,
  count(*) FILTER (WHERE authenticated_denied) AS authenticated_denied_count,
  count(*) FILTER (WHERE service_allowed) AS service_allowed_count,
  count(*) FILTER (WHERE owner_allowed) AS owner_allowed_count,
  count(*) FILTER (WHERE definition_unchanged) AS definition_unchanged_count,
  (SELECT count(*) FROM attachments) AS attachment_count,
  (SELECT count(*) FROM attachments WHERE tgenabled = 'O') AS enabled_attachment_count,
  (SELECT count(*) FROM direct_definition_callers) AS direct_definition_caller_count,
  md5(string_agg(
    concat_ws('|', signature, anon_denied, authenticated_denied, service_allowed, owner_allowed, definition_unchanged),
    E'\n' ORDER BY signature
  )) AS acl_verification_digest
FROM evidence;
