-- G25 R32 prepared-intelligence runtime cutover candidate.
-- This is a non-migration privilege overlay for R10 through R31.
-- It must not be applied to a linked database.

alter function private.brain_store_prepared_custody_receipt(jsonb, jsonb)
  security definer;
alter function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)
  security definer;

revoke execute on function private.brain_store_prepared_receipt(jsonb, jsonb)
  from service_role;
revoke execute on function private.brain_invalidate_prepared_receipts_for_correction(jsonb)
  from service_role;
revoke execute on function private.brain_erase_prepared_subject(jsonb)
  from service_role;

revoke insert on table public.brain_prepared_receipts from service_role;
revoke insert on table public.brain_prepared_receipt_dependencies from service_role;
revoke insert on table public.brain_prepared_receipt_events from service_role;
revoke insert on table public.brain_prepared_authority_corrections from service_role;
revoke insert on table public.brain_prepared_custody_receipts from service_role;
revoke insert on table public.brain_prepared_custody_receipt_dependencies from service_role;
revoke insert on table public.brain_prepared_custody_receipt_events from service_role;
revoke insert on table public.brain_prepared_custody_corrections from service_role;

revoke update (invalidated_at)
  on table public.brain_prepared_receipts from service_role;
revoke update (affected_receipt_count)
  on table public.brain_prepared_authority_corrections from service_role;
revoke update (invalidated_at)
  on table public.brain_prepared_custody_receipts from service_role;
revoke update (legacy_affected_receipt_count, custody_affected_receipt_count)
  on table public.brain_prepared_custody_corrections from service_role;

grant execute on function private.brain_store_prepared_custody_receipt(jsonb, jsonb)
  to service_role;
grant execute on function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)
  to service_role;
grant execute on function private.brain_erase_both_prepared_generations(jsonb)
  to service_role;
grant execute on function private.brain_read_current_prepared_intelligence(jsonb)
  to service_role;
