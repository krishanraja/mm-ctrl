-- G25 R36 prepared-intelligence subject reconsent reservation candidate.
-- This is a non-migration overlay for R23 and R30.
-- It must not be applied to a linked database.
-- The receipt reserves a new scope but cannot create or reopen a Brain.

create table public.brain_prepared_reconsent_reservations (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.prepared-intelligence-subject-reconsent-reservation.r36'),
  previous_workspace_id uuid not null
    references public.brain_workspaces(id) on delete restrict,
  previous_custody_principal_id uuid not null
    references private.brain_custody_principals(id) on delete restrict,
  subject_id uuid not null
    references private.brain_subject_principals(id) on delete restrict,
  consented_by_user_id uuid not null,
  operator_principal_id uuid not null
    references private.brain_operator_principals(id) on delete restrict,
  reserved_workspace_id uuid not null unique,
  reserved_custody_principal_id uuid not null unique,
  reserved_tenant_key text not null unique
    check (reserved_tenant_key ~ '^[a-z0-9][a-z0-9._:-]{2,127}$'),
  statement_version text not null
    check (statement_version = 'brain-restart-consent.v1'),
  purpose text not null check (purpose = 'prepared_intelligence'),
  consent_fingerprint text not null check (consent_fingerprint ~ '^[0-9a-f]{64}$'),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint brain_prepared_reconsent_scope_fingerprint_key
    unique (previous_workspace_id, subject_id, consent_fingerprint),
  check (reserved_workspace_id <> previous_workspace_id)
);

create index brain_prepared_reconsent_reservations_subject_idx
  on public.brain_prepared_reconsent_reservations (subject_id, occurred_at desc);

alter table public.brain_prepared_reconsent_reservations enable row level security;
alter table public.brain_prepared_reconsent_reservations force row level security;

create or replace function private.brain_reserve_reconsented_prepared_scope(
  p_consent jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  consent_id uuid;
  previous_workspace_id uuid;
  previous_custody_principal_id uuid;
  subject_id uuid;
  consented_by_user_id uuid;
  operator_principal_id uuid;
  reserved_workspace_id uuid;
  reserved_custody_principal_id uuid;
  reserved_tenant_key text;
  statement_version text;
  purpose text;
  request_sha256 text;
  occurred_at timestamptz;
  consent_projection jsonb;
  consent_fingerprint text;
  existing public.brain_prepared_reconsent_reservations%rowtype;
begin
  if jsonb_typeof(p_consent) <> 'object' then raise exception 'reconsent_object_required'; end if;
  if (
    select count(*) <> 14
      or count(*) filter (where key = any(array[
        'schema_version', 'consent_id', 'previous_workspace_id',
        'previous_custody_principal_id', 'subject_id', 'consented_by_user_id',
        'operator_principal_id', 'reserved_workspace_id',
        'reserved_custody_principal_id', 'reserved_tenant_key',
        'statement_version', 'purpose', 'request_sha256', 'occurred_at'
      ])) <> 14
    from jsonb_object_keys(p_consent) as member(key)
  ) then raise exception 'reconsent_shape_invalid'; end if;
  if p_consent ->> 'schema_version'
    <> 'ctrl.prepared-intelligence-subject-reconsent-reservation.r36'
  then raise exception 'reconsent_schema_version_invalid'; end if;

  consent_id := (p_consent ->> 'consent_id')::uuid;
  previous_workspace_id := (p_consent ->> 'previous_workspace_id')::uuid;
  previous_custody_principal_id := (p_consent ->> 'previous_custody_principal_id')::uuid;
  subject_id := (p_consent ->> 'subject_id')::uuid;
  consented_by_user_id := (p_consent ->> 'consented_by_user_id')::uuid;
  operator_principal_id := (p_consent ->> 'operator_principal_id')::uuid;
  reserved_workspace_id := (p_consent ->> 'reserved_workspace_id')::uuid;
  reserved_custody_principal_id := (p_consent ->> 'reserved_custody_principal_id')::uuid;
  reserved_tenant_key := p_consent ->> 'reserved_tenant_key';
  statement_version := p_consent ->> 'statement_version';
  purpose := p_consent ->> 'purpose';
  request_sha256 := p_consent ->> 'request_sha256';
  occurred_at := (p_consent ->> 'occurred_at')::timestamptz;

  if reserved_workspace_id = previous_workspace_id then
    raise exception 'reconsent_new_workspace_required';
  end if;
  if reserved_tenant_key !~ '^[a-z0-9][a-z0-9._:-]{2,127}$' then
    raise exception 'reconsent_tenant_key_invalid';
  end if;
  if statement_version <> 'brain-restart-consent.v1' then
    raise exception 'reconsent_statement_version_invalid';
  end if;
  if purpose <> 'prepared_intelligence' then raise exception 'reconsent_purpose_invalid'; end if;
  if request_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'reconsent_request_fingerprint_invalid';
  end if;
  if occurred_at > statement_timestamp() then raise exception 'reconsent_time_in_future'; end if;

  if not exists (
    select 1
    from public.brain_workspaces workspace_row
    join private.brain_custody_principals custody_row
      on custody_row.workspace_id = workspace_row.id
    where workspace_row.id = previous_workspace_id
      and workspace_row.subject_id = subject_id
      and custody_row.id = previous_custody_principal_id
  ) then raise exception 'reconsent_previous_scope_invalid'; end if;

  if not exists (
    select 1
    from public.brain_prepared_custody_subject_erasure_tombstones tombstone_row
    where tombstone_row.workspace_id = previous_workspace_id
      and tombstone_row.custody_principal_id = previous_custody_principal_id
      and tombstone_row.subject_id = subject_id
  ) then raise exception 'reconsent_previous_scope_not_erased'; end if;

  if not exists (
    select 1
    from private.brain_subject_auth_links subject_link
    where subject_link.subject_principal_id = subject_id
      and subject_link.user_id = consented_by_user_id
      and subject_link.linked_at <= occurred_at
      and (subject_link.revoked_at is null or subject_link.revoked_at > occurred_at)
  ) then raise exception 'reconsent_subject_auth_link_invalid'; end if;

  if not exists (
    select 1
    from private.brain_operator_principals operator_row
    where operator_row.id = operator_principal_id
      and operator_row.retired_at is null
      and exists (
        select 1
        from private.brain_operator_auth_links operator_link
        where operator_link.operator_principal_id = operator_row.id
          and operator_link.linked_at <= occurred_at
          and (operator_link.revoked_at is null or operator_link.revoked_at > occurred_at)
      )
  ) then raise exception 'reconsent_operator_inactive'; end if;

  if exists (
    select 1 from public.brain_workspaces workspace_row
    where workspace_row.id = reserved_workspace_id
      or workspace_row.tenant_key = reserved_tenant_key
  ) or exists (
    select 1 from private.brain_custody_principals custody_row
    where custody_row.id = reserved_custody_principal_id
  ) then raise exception 'reconsent_reserved_scope_collision'; end if;

  consent_projection := jsonb_build_object(
    'schema_version', 'ctrl.prepared-intelligence-subject-reconsent-reservation.r36',
    'previous_workspace_id', previous_workspace_id,
    'previous_custody_principal_id', previous_custody_principal_id,
    'subject_id', subject_id,
    'consented_by_user_id', consented_by_user_id,
    'operator_principal_id', operator_principal_id,
    'reserved_workspace_id', reserved_workspace_id,
    'reserved_custody_principal_id', reserved_custody_principal_id,
    'reserved_tenant_key', reserved_tenant_key,
    'statement_version', statement_version,
    'purpose', purpose,
    'occurred_at', to_char(occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  );
  consent_fingerprint := encode(sha256(convert_to(
    'prepared-subject-reconsent-reservation-r36' || chr(10)
      || private.brain_canonical_jsonb(consent_projection),
    'UTF8'
  )), 'hex');

  select * into existing
  from public.brain_prepared_reconsent_reservations consent_row
  where consent_row.id = consent_id;
  if found then
    if existing.consent_fingerprint = consent_fingerprint
      and existing.request_sha256 = request_sha256
    then
      return jsonb_build_object(
        'status', 'idempotent',
        'consent_id', existing.id,
        'reserved_workspace_id', existing.reserved_workspace_id,
        'reserved_custody_principal_id', existing.reserved_custody_principal_id,
        'scope_status', 'reserved_not_created'
      );
    end if;
    raise exception 'reconsent_identity_conflict';
  end if;

  insert into public.brain_prepared_reconsent_reservations (
    id, schema_version, previous_workspace_id, previous_custody_principal_id,
    subject_id, consented_by_user_id, operator_principal_id,
    reserved_workspace_id, reserved_custody_principal_id, reserved_tenant_key,
    statement_version, purpose, consent_fingerprint, request_sha256, occurred_at
  ) values (
    consent_id, 'ctrl.prepared-intelligence-subject-reconsent-reservation.r36',
    previous_workspace_id, previous_custody_principal_id, subject_id,
    consented_by_user_id, operator_principal_id, reserved_workspace_id,
    reserved_custody_principal_id, reserved_tenant_key, statement_version,
    purpose, consent_fingerprint, request_sha256, occurred_at
  )
  on conflict on constraint brain_prepared_reconsent_scope_fingerprint_key do nothing
  returning * into existing;

  if not found then
    select * into existing
    from public.brain_prepared_reconsent_reservations consent_row
    where consent_row.previous_workspace_id = previous_workspace_id
      and consent_row.subject_id = subject_id
      and consent_row.consent_fingerprint = consent_fingerprint;
    return jsonb_build_object(
      'status', 'converged',
      'consent_id', existing.id,
      'reserved_workspace_id', existing.reserved_workspace_id,
      'reserved_custody_principal_id', existing.reserved_custody_principal_id,
      'scope_status', 'reserved_not_created'
    );
  end if;

  return jsonb_build_object(
    'status', 'reserved',
    'consent_id', consent_id,
    'reserved_workspace_id', reserved_workspace_id,
    'reserved_custody_principal_id', reserved_custody_principal_id,
    'scope_status', 'reserved_not_created'
  );
end;
$$;

revoke all on table public.brain_prepared_reconsent_reservations
  from public, anon, authenticated, service_role;
grant select on table public.brain_prepared_reconsent_reservations to service_role;

revoke all on function private.brain_reserve_reconsented_prepared_scope(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_reserve_reconsented_prepared_scope(jsonb)
  to service_role;
