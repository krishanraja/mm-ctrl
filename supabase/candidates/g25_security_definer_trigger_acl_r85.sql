-- G25 SECURITY DEFINER trigger ACL candidate R85
-- Candidate only. Removes direct ordinary-role execution without changing trigger objects or function bodies.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_booking_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_consent_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_analytics_sheets_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_booking_http_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_booking_requests_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_booking_sheets_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_booking_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_business_context_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_contact_collection_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_google_sheets_edge_function() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_lead_score_sheets_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_from_insights() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_booking_request() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_consent_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_analytics_sheets_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_booking_http_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_booking_requests_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_booking_sheets_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_booking_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_business_context_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_contact_collection_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_google_sheets_edge_function() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_lead_score_sheets_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_profile_from_insights() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

COMMIT;
