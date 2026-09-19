-- Trigger functions execute through their triggers. They are not public RPCs.
begin;

revoke all on function public.set_capture_source_manifest() from public, anon, authenticated;
revoke all on function public.validate_capture_proposal_manifest() from public, anon, authenticated;
revoke all on function public.queue_standard_change_request_from_decision() from public, anon, authenticated;

commit;
