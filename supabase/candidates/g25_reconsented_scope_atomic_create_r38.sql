-- G25 R38 reconsented Brain-scope atomic creator candidate.
-- This is a non-migration overlay for R23, R30 and R36.
-- It must not be applied to a linked database.
-- It consumes one accepted reservation without clearing the old erasure scope.

alter table public.brain_workspaces
  drop constraint brain_workspaces_check;

comment on column public.brain_workspaces.owner_id is
  'Immutable workspace-scoped historical identity. Current subject access and operator custody are separate.';

alter table private.brain_custody_assignments
  drop constraint brain_custody_assignments_authorization_kind_check,
  drop constraint brain_custody_assignments_check1,
  add constraint brain_custody_assignments_authorization_kind_check
    check (authorization_kind in (
      'legacy_backfill', 'customer_authorized_transfer', 'subject_reconsent'
    )),
  add constraint brain_custody_assignments_authorization_check
    check (
      (authorization_kind = 'legacy_backfill' and authorization_sha256 is null)
      or
      (authorization_kind in ('customer_authorized_transfer', 'subject_reconsent')
        and authorization_sha256 ~ '^[0-9a-f]{64}$')
    );

create table public.brain_prepared_reconsent_scope_creations (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.prepared-intelligence-reconsent-scope-creation.r38'),
  consent_id uuid not null unique
    references public.brain_prepared_reconsent_reservations(id) on delete restrict,
  previous_workspace_id uuid not null
    references public.brain_workspaces(id) on delete restrict,
  created_workspace_id uuid not null unique
    references public.brain_workspaces(id) on delete restrict,
  created_custody_principal_id uuid not null unique
    references private.brain_custody_principals(id) on delete restrict,
  workspace_historical_principal_id uuid not null unique
    references private.brain_historical_principals(id) on delete restrict,
  subject_id uuid not null
    references private.brain_subject_principals(id) on delete restrict,
  operator_principal_id uuid not null
    references private.brain_operator_principals(id) on delete restrict,
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (created_workspace_id <> previous_workspace_id),
  check (workspace_historical_principal_id = created_workspace_id)
);

alter table public.brain_prepared_reconsent_scope_creations enable row level security;
alter table public.brain_prepared_reconsent_scope_creations force row level security;

create or replace function private.brain_create_reconsented_prepared_scope(
  p_creation jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  creation_id uuid;
  consent_id uuid;
  request_sha256 text;
  occurred_at timestamptz;
  reservation public.brain_prepared_reconsent_reservations%rowtype;
  existing public.brain_prepared_reconsent_scope_creations%rowtype;
  operator_access_count integer;
begin
  if jsonb_typeof(p_creation) <> 'object' then raise exception 'scope_creation_object_required'; end if;
  if (
    select count(*) <> 5
      or count(*) filter (where key = any(array[
        'schema_version', 'creation_id', 'consent_id', 'request_sha256', 'occurred_at'
      ])) <> 5
    from jsonb_object_keys(p_creation) as member(key)
  ) then raise exception 'scope_creation_shape_invalid'; end if;
  if p_creation ->> 'schema_version'
    <> 'ctrl.prepared-intelligence-reconsent-scope-creation.r38'
  then raise exception 'scope_creation_schema_version_invalid'; end if;

  creation_id := (p_creation ->> 'creation_id')::uuid;
  consent_id := (p_creation ->> 'consent_id')::uuid;
  request_sha256 := p_creation ->> 'request_sha256';
  occurred_at := (p_creation ->> 'occurred_at')::timestamptz;
  if request_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'scope_creation_request_fingerprint_invalid';
  end if;
  if occurred_at > statement_timestamp() then raise exception 'scope_creation_time_in_future'; end if;

  select * into reservation
  from public.brain_prepared_reconsent_reservations reservation_row
  where reservation_row.id = consent_id
  for update;
  if not found then raise exception 'scope_creation_consent_not_found'; end if;
  if occurred_at < reservation.occurred_at then raise exception 'scope_creation_before_consent'; end if;

  select * into existing
  from public.brain_prepared_reconsent_scope_creations creation_row
  where creation_row.consent_id = consent_id;
  if found then
    if existing.id = creation_id and existing.request_sha256 = request_sha256 then
      return jsonb_build_object(
        'status', 'idempotent',
        'creation_id', existing.id,
        'consent_id', existing.consent_id,
        'workspace_id', existing.created_workspace_id,
        'custody_principal_id', existing.created_custody_principal_id,
        'scope_status', 'active_new_scope'
      );
    end if;
    raise exception 'scope_creation_consent_already_consumed';
  end if;

  if not exists (
    select 1
    from public.brain_prepared_custody_subject_erasure_tombstones tombstone_row
    where tombstone_row.workspace_id = reservation.previous_workspace_id
      and tombstone_row.custody_principal_id = reservation.previous_custody_principal_id
      and tombstone_row.subject_id = reservation.subject_id
  ) then raise exception 'scope_creation_old_erasure_missing'; end if;

  if not exists (
    select 1
    from private.brain_subject_auth_links subject_link
    where subject_link.subject_principal_id = reservation.subject_id
      and subject_link.user_id = reservation.consented_by_user_id
      and subject_link.linked_at <= occurred_at
      and (subject_link.revoked_at is null or subject_link.revoked_at > occurred_at)
  ) then raise exception 'scope_creation_subject_access_inactive'; end if;

  if not exists (
    select 1
    from private.brain_operator_principals operator_row
    where operator_row.id = reservation.operator_principal_id
      and operator_row.retired_at is null
      and exists (
        select 1
        from private.brain_operator_auth_links operator_link
        where operator_link.operator_principal_id = operator_row.id
          and operator_link.linked_at <= occurred_at
          and (operator_link.revoked_at is null or operator_link.revoked_at > occurred_at)
      )
  ) then raise exception 'scope_creation_operator_inactive'; end if;

  if exists (
    select 1 from public.brain_workspaces workspace_row
    where workspace_row.id = reservation.reserved_workspace_id
      or workspace_row.tenant_key = reservation.reserved_tenant_key
  ) or exists (
    select 1 from private.brain_custody_principals custody_row
    where custody_row.id = reservation.reserved_custody_principal_id
  ) or exists (
    select 1 from private.brain_historical_principals historical_row
    where historical_row.id = reservation.reserved_workspace_id
  ) then raise exception 'scope_creation_reserved_identity_collision'; end if;

  insert into private.brain_historical_principals (id, origin)
  values (reservation.reserved_workspace_id, 'workspace_scoped_v2');

  insert into public.brain_workspaces (
    id, subject_id, owner_id, tenant_key, workspace_kind, lifecycle_state
  ) values (
    reservation.reserved_workspace_id,
    reservation.subject_id,
    reservation.reserved_workspace_id,
    reservation.reserved_tenant_key,
    'personal',
    'active'
  );

  insert into public.brain_workspace_roles (workspace_id, user_id, role, granted_by)
  values (
    reservation.reserved_workspace_id,
    reservation.consented_by_user_id,
    'owner',
    reservation.consented_by_user_id
  );

  insert into public.brain_workspace_roles (workspace_id, user_id, role, granted_by)
  select
    reservation.reserved_workspace_id,
    operator_link.user_id,
    'operator',
    reservation.consented_by_user_id
  from private.brain_operator_auth_links operator_link
  where operator_link.operator_principal_id = reservation.operator_principal_id
    and operator_link.linked_at <= occurred_at
    and (operator_link.revoked_at is null or operator_link.revoked_at > occurred_at)
  on conflict do nothing;
  get diagnostics operator_access_count = row_count;
  if operator_access_count < 1 then raise exception 'scope_creation_operator_access_missing'; end if;

  insert into public.brain_audience_grants (
    id, workspace_id, grantee_user_id, audience, purpose, granted_by
  ) values (
    gen_random_uuid(),
    reservation.reserved_workspace_id,
    reservation.consented_by_user_id,
    'person_private',
    'prepared_intelligence',
    reservation.consented_by_user_id
  );

  insert into private.brain_custody_principals (id, workspace_id)
  values (reservation.reserved_custody_principal_id, reservation.reserved_workspace_id);

  insert into private.brain_custody_assignments (
    custody_principal_id, operator_principal_id, accepted_at,
    authorization_kind, authorization_sha256
  ) values (
    reservation.reserved_custody_principal_id,
    reservation.operator_principal_id,
    occurred_at,
    'subject_reconsent',
    reservation.consent_fingerprint
  );

  insert into public.brain_prepared_reconsent_scope_creations (
    id, schema_version, consent_id, previous_workspace_id,
    created_workspace_id, created_custody_principal_id,
    workspace_historical_principal_id, subject_id, operator_principal_id,
    request_sha256, occurred_at
  ) values (
    creation_id, 'ctrl.prepared-intelligence-reconsent-scope-creation.r38',
    consent_id, reservation.previous_workspace_id,
    reservation.reserved_workspace_id, reservation.reserved_custody_principal_id,
    reservation.reserved_workspace_id, reservation.subject_id,
    reservation.operator_principal_id, request_sha256, occurred_at
  ) returning * into existing;

  return jsonb_build_object(
    'status', 'created',
    'creation_id', existing.id,
    'consent_id', existing.consent_id,
    'workspace_id', existing.created_workspace_id,
    'custody_principal_id', existing.created_custody_principal_id,
    'scope_status', 'active_new_scope'
  );
end;
$$;

revoke all on table public.brain_prepared_reconsent_scope_creations
  from public, anon, authenticated, service_role;
grant select on table public.brain_prepared_reconsent_scope_creations to service_role;

revoke all on function private.brain_create_reconsented_prepared_scope(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_create_reconsented_prepared_scope(jsonb)
  to service_role;
