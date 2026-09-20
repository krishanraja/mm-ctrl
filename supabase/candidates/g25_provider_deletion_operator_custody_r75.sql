-- G25 R75 stable-custody human recovery candidate.
-- Apply only after dormant R23, R73 and R74 candidates in an empty,
-- disposable database. This is not an authorised migration.

create or replace function private.brain_append_provider_deletion_dispatch_operator_event(p_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  dispatch_workspace_id uuid;
  current_operator_principal_id uuid;
begin
  if p_event ->> 'event_kind' not in ('operator_recovery_requested', 'operator_recovery_linked')
  then raise exception 'provider_deletion_dispatch_operator_event_invalid'; end if;

  caller_id := auth.uid();
  if caller_id is null
    or coalesce(((auth.jwt()) ->> 'is_anonymous')::boolean, true)
  then raise exception 'provider_deletion_dispatch_operator_session_required'; end if;

  select dispatch.workspace_id into dispatch_workspace_id
  from private.brain_provider_deletion_dispatches dispatch
  where dispatch.id = (p_event ->> 'dispatch_id')::uuid;
  if dispatch_workspace_id is null
  then raise exception 'provider_deletion_dispatch_not_found'; end if;

  if not exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = dispatch_workspace_id
      and role_row.user_id = caller_id
      and role_row.role = 'operator'
      and role_row.revoked_at is null
  ) then raise exception 'provider_deletion_dispatch_operator_scope_denied'; end if;

  select assignment.operator_principal_id into current_operator_principal_id
  from private.brain_custody_principals custody
  join private.brain_custody_assignments assignment
    on assignment.custody_principal_id = custody.id
    and assignment.ended_at is null
  join private.brain_operator_principals operator
    on operator.id = assignment.operator_principal_id
    and operator.retired_at is null
  join private.brain_operator_auth_links auth_link
    on auth_link.operator_principal_id = operator.id
    and auth_link.user_id = caller_id
    and auth_link.revoked_at is null
  where custody.workspace_id = dispatch_workspace_id
    and custody.closed_at is null;
  if current_operator_principal_id is null
  then raise exception 'provider_deletion_dispatch_operator_custody_denied'; end if;

  return private.brain_append_provider_deletion_dispatch_event_core(p_event, 'operator', null);
end;
$$;

revoke all on function private.brain_append_provider_deletion_dispatch_operator_event(jsonb)
  from public, anon, service_role, provider_dispatch_issuer,
    provider_handle_crypto_writer, provider_deletion_worker, provider_deletion_operator;
grant usage on schema private to authenticated;
grant execute on function private.brain_append_provider_deletion_dispatch_operator_event(jsonb)
  to authenticated;
