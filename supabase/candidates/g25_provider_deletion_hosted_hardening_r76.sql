-- G25 R76 hosted Supabase hardening found by the disposable branch advisors.
-- Apply only after R49, R51, R63, R65, R67 and R73 in an empty disposable
-- environment. This is not an authorised product migration.

alter table public.brain_workspace_roles enable row level security;
alter table public.brain_workspace_roles force row level security;
alter table public.brain_audience_grants enable row level security;
alter table public.brain_audience_grants force row level security;

revoke all on public.brain_workspace_roles, public.brain_audience_grants
  from authenticated;

create policy brain_workspace_roles_r76_deny_all
  on public.brain_workspace_roles for all using (false) with check (false);
create policy brain_audience_grants_r76_deny_all
  on public.brain_audience_grants for all using (false) with check (false);
create policy brain_prepared_authority_corrections_r76_deny_all
  on public.brain_prepared_authority_corrections for all using (false) with check (false);
create policy brain_prepared_subject_erasure_tombstones_r76_deny_all
  on public.brain_prepared_subject_erasure_tombstones for all using (false) with check (false);

create policy brain_provider_exchanges_r76_deny_all
  on private.brain_provider_exchanges for all using (false) with check (false);
create policy brain_provider_exchange_events_r76_deny_all
  on private.brain_provider_exchange_events for all using (false) with check (false);
create policy brain_provider_closure_facts_r76_deny_all
  on private.brain_provider_closure_facts for all using (false) with check (false);
create policy brain_provider_deletion_handles_r76_deny_all
  on private.brain_provider_deletion_handles for all using (false) with check (false);
create policy brain_provider_handle_authority_spends_r76_deny_all
  on private.brain_provider_handle_authority_spends for all using (false) with check (false);
create policy brain_provider_deletion_dispatches_r76_deny_all
  on private.brain_provider_deletion_dispatches for all using (false) with check (false);
create policy brain_provider_deletion_dispatch_events_r76_deny_all
  on private.brain_provider_deletion_dispatch_events for all using (false) with check (false);

create index brain_provider_deletion_handles_closure_fact_r76_idx
  on private.brain_provider_deletion_handles (closure_fact_id)
  where closure_fact_id is not null;
create index brain_provider_deletion_dispatches_workspace_r76_idx
  on private.brain_provider_deletion_dispatches (workspace_id, recorded_at desc);
create index brain_provider_deletion_dispatches_receipt_r76_idx
  on private.brain_provider_deletion_dispatches (receipt_id);
create index brain_provider_deletion_dispatches_predecessor_r76_idx
  on private.brain_provider_deletion_dispatches (predecessor_dispatch_id)
  where predecessor_dispatch_id is not null;
create index brain_provider_deletion_dispatch_events_predecessor_r76_idx
  on private.brain_provider_deletion_dispatch_events (predecessor_event_id)
  where predecessor_event_id is not null;
