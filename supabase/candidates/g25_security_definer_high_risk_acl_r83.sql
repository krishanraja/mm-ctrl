-- G25 SECURITY DEFINER high-risk ACL candidate R83
-- Candidate only. Apply to the approved blank recovery project before any production consideration.
-- This changes execution privileges only. It does not replace, invoke or delete a function.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.get_or_create_profile(text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_automator_usage(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_pending_sync_logs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_sync_processing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_north_star() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sp_aggregate_briefing_feedback(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_lead_to_sheets(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_referral_conversion(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_google_sheets_sync(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_or_create_profile(text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_automator_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_pending_sync_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.schedule_sync_processing() TO service_role;
GRANT EXECUTE ON FUNCTION public.snapshot_north_star() TO service_role;
GRANT EXECUTE ON FUNCTION public.sp_aggregate_briefing_feedback(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_lead_to_sheets(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.track_referral_conversion(text, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_google_sheets_sync(text) TO service_role;

COMMIT;
