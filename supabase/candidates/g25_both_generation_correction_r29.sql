-- G25 R29 both-generation prepared-intelligence correction candidate.
-- This is not a migration and must not be applied to a linked database.
-- One stable-custody correction invalidates affected legacy and custody-native
-- derivatives atomically without rewriting either generation's history.

create table public.brain_prepared_custody_corrections (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.prepared-intelligence-custody-correction.r29'),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  custody_principal_id uuid not null
    references private.brain_custody_principals(id) on delete cascade,
  subject_id uuid not null
    references private.brain_subject_principals(id) on delete restrict,
  audience text not null check (audience in ('person_private', 'delivery_team_private')),
  purpose text not null check (purpose = 'prepared_intelligence'),
  correction_mode text not null check (correction_mode = 'replaced'),
  affected_authority_kind text not null
    check (affected_authority_kind in ('brain_item_version', 'external_source_receipt')),
  affected_authority_record_id uuid not null,
  replacement_authority_record_id uuid not null,
  replacement_authority_version text not null
    check (replacement_authority_version ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'),
  replacement_authority_sha256 text not null
    check (replacement_authority_sha256 ~ '^[0-9a-f]{64}$'),
  correction_fingerprint text not null check (correction_fingerprint ~ '^[0-9a-f]{64}$'),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  legacy_affected_receipt_count integer not null default 0
    check (legacy_affected_receipt_count >= 0),
  custody_affected_receipt_count integer not null default 0
    check (custody_affected_receipt_count >= 0),
  recorded_at timestamptz not null default now(),
  constraint brain_custody_corrections_scope_fingerprint_key
    unique (workspace_id, custody_principal_id, correction_fingerprint),
  constraint brain_custody_corrections_identity_scope_key
    unique (id, workspace_id, custody_principal_id, subject_id)
);

create index brain_prepared_custody_corrections_scope_idx
  on public.brain_prepared_custody_corrections
    (workspace_id, custody_principal_id, subject_id, occurred_at);
create index brain_prepared_custody_corrections_affected_idx
  on public.brain_prepared_custody_corrections
    (affected_authority_kind, affected_authority_record_id);

alter table public.brain_prepared_custody_corrections enable row level security;
alter table public.brain_prepared_custody_corrections force row level security;

create or replace function private.brain_invalidate_both_prepared_generations_for_correction(
  p_correction jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  correction_id uuid;
  workspace_id uuid;
  custody_principal_id uuid;
  subject_id uuid;
  audience text;
  purpose text;
  correction_mode text;
  affected_authority_kind text;
  affected_authority_record_id uuid;
  replacement_authority_record_id uuid;
  replacement_authority_version text;
  replacement_authority_sha256 text;
  request_sha256 text;
  occurred_at timestamptz;
  correction_projection jsonb;
  correction_fingerprint text;
  replacement_authority jsonb;
  existing public.brain_prepared_custody_corrections%rowtype;
  legacy_affected_count integer;
  custody_affected_count integer;
begin
  if jsonb_typeof(p_correction) <> 'object' then raise exception 'correction_object_required'; end if;
  if (
    select count(*) <> 15
      or count(*) filter (where key = any(array[
        'schema_version', 'correction_id', 'workspace_id', 'custody_principal_id',
        'subject_id', 'audience', 'purpose', 'correction_mode',
        'affected_authority_kind', 'affected_authority_record_id',
        'replacement_authority_record_id', 'replacement_authority_version',
        'replacement_authority_sha256', 'request_sha256', 'occurred_at'
      ])) <> 15
    from jsonb_object_keys(p_correction) as member(key)
  ) then raise exception 'correction_shape_invalid'; end if;
  if p_correction ->> 'schema_version' <> 'ctrl.prepared-intelligence-custody-correction.r29' then
    raise exception 'correction_schema_version_invalid';
  end if;

  correction_id := (p_correction ->> 'correction_id')::uuid;
  workspace_id := (p_correction ->> 'workspace_id')::uuid;
  custody_principal_id := (p_correction ->> 'custody_principal_id')::uuid;
  subject_id := (p_correction ->> 'subject_id')::uuid;
  audience := p_correction ->> 'audience';
  purpose := p_correction ->> 'purpose';
  correction_mode := p_correction ->> 'correction_mode';
  affected_authority_kind := p_correction ->> 'affected_authority_kind';
  affected_authority_record_id := (p_correction ->> 'affected_authority_record_id')::uuid;
  replacement_authority_record_id := (p_correction ->> 'replacement_authority_record_id')::uuid;
  replacement_authority_version := p_correction ->> 'replacement_authority_version';
  replacement_authority_sha256 := p_correction ->> 'replacement_authority_sha256';
  request_sha256 := p_correction ->> 'request_sha256';
  occurred_at := (p_correction ->> 'occurred_at')::timestamptz;

  if audience not in ('person_private', 'delivery_team_private') then raise exception 'correction_audience_invalid'; end if;
  if purpose <> 'prepared_intelligence' then raise exception 'correction_purpose_invalid'; end if;
  if correction_mode <> 'replaced' then raise exception 'correction_mode_invalid'; end if;
  if affected_authority_kind not in ('brain_item_version', 'external_source_receipt') then
    raise exception 'correction_authority_kind_unavailable';
  end if;
  if replacement_authority_version !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'
    or replacement_authority_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'replacement_authority_identity_invalid'; end if;
  if request_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'correction_request_fingerprint_invalid'; end if;
  if occurred_at > statement_timestamp() then raise exception 'correction_time_in_future'; end if;

  if not exists (
    select 1
    from public.brain_workspaces workspace_row
    join private.brain_custody_principals custody
      on custody.workspace_id = workspace_row.id
    where workspace_row.id = workspace_id
      and workspace_row.subject_id = subject_id
      and custody.id = custody_principal_id
  ) then raise exception 'correction_workspace_scope_invalid'; end if;
  if not private.brain_prepared_custody_active(workspace_id, custody_principal_id) then
    raise exception 'correction_custody_inactive';
  end if;

  replacement_authority := private.brain_current_prepared_custody_authority(
    affected_authority_kind,
    replacement_authority_record_id,
    workspace_id,
    custody_principal_id,
    subject_id,
    audience,
    purpose
  );
  if replacement_authority is null
    or replacement_authority ->> 'authority_version' <> replacement_authority_version
    or replacement_authority ->> 'authority_sha256' <> replacement_authority_sha256
    or (replacement_authority ->> 'recorded_at')::timestamptz > occurred_at
  then raise exception 'replacement_authority_not_current'; end if;

  correction_projection := jsonb_build_object(
    'schema_version', 'ctrl.prepared-intelligence-custody-correction.r29',
    'workspace_id', workspace_id,
    'custody_principal_id', custody_principal_id,
    'subject_id', subject_id,
    'audience', audience,
    'purpose', purpose,
    'correction_mode', correction_mode,
    'affected_authority_kind', affected_authority_kind,
    'affected_authority_record_id', affected_authority_record_id,
    'replacement_authority_record_id', replacement_authority_record_id,
    'replacement_authority_version', replacement_authority_version,
    'replacement_authority_sha256', replacement_authority_sha256,
    'occurred_at', to_char(occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  );
  correction_fingerprint := encode(sha256(convert_to(
    'prepared-both-generation-correction-r29' || chr(10)
      || private.brain_canonical_jsonb(correction_projection),
    'UTF8'
  )), 'hex');

  select * into existing
  from public.brain_prepared_custody_corrections correction_row
  where correction_row.id = correction_id;
  if found then
    if existing.workspace_id = workspace_id
      and existing.custody_principal_id = custody_principal_id
      and existing.correction_fingerprint = correction_fingerprint
      and existing.request_sha256 = request_sha256
    then
      return jsonb_build_object(
        'status', 'idempotent',
        'correction_id', existing.id,
        'legacy_affected_receipt_count', existing.legacy_affected_receipt_count,
        'custody_affected_receipt_count', existing.custody_affected_receipt_count,
        'affected_receipt_count', existing.legacy_affected_receipt_count
          + existing.custody_affected_receipt_count
      );
    end if;
    raise exception 'correction_identity_conflict';
  end if;

  insert into public.brain_prepared_custody_corrections (
    id, schema_version, workspace_id, custody_principal_id, subject_id,
    audience, purpose, correction_mode, affected_authority_kind,
    affected_authority_record_id, replacement_authority_record_id,
    replacement_authority_version, replacement_authority_sha256,
    correction_fingerprint, request_sha256, occurred_at
  ) values (
    correction_id, 'ctrl.prepared-intelligence-custody-correction.r29', workspace_id,
    custody_principal_id, subject_id, audience, purpose, correction_mode,
    affected_authority_kind, affected_authority_record_id,
    replacement_authority_record_id, replacement_authority_version,
    replacement_authority_sha256, correction_fingerprint, request_sha256, occurred_at
  )
  on conflict on constraint brain_custody_corrections_scope_fingerprint_key do nothing
  returning * into existing;

  if not found then
    select * into existing
    from public.brain_prepared_custody_corrections correction_row
    where correction_row.workspace_id = workspace_id
      and correction_row.custody_principal_id = custody_principal_id
      and correction_row.correction_fingerprint = correction_fingerprint;
    return jsonb_build_object(
      'status', 'converged',
      'correction_id', existing.id,
      'legacy_affected_receipt_count', existing.legacy_affected_receipt_count,
      'custody_affected_receipt_count', existing.custody_affected_receipt_count,
      'affected_receipt_count', existing.legacy_affected_receipt_count
        + existing.custody_affected_receipt_count
    );
  end if;

  with affected as (
    update public.brain_prepared_receipts receipt_row
    set invalidated_at = greatest(occurred_at, receipt_row.produced_at)
    where receipt_row.workspace_id = workspace_id
      and receipt_row.subject_id = subject_id
      and receipt_row.audience = audience
      and receipt_row.purpose = purpose
      and receipt_row.invalidated_at is null
      and receipt_row.erased_at is null
      and exists (
        select 1
        from public.brain_prepared_receipt_dependencies dependency_row
        where dependency_row.receipt_id = receipt_row.id
          and dependency_row.workspace_id = workspace_id
          and dependency_row.subject_id = subject_id
          and dependency_row.audience = audience
          and dependency_row.purpose = purpose
          and dependency_row.authority_kind = affected_authority_kind
          and dependency_row.authority_record_id = affected_authority_record_id
          and (
            dependency_row.authority_record_id <> replacement_authority_record_id
            or dependency_row.authority_version <> replacement_authority_version
            or dependency_row.authority_sha256 <> replacement_authority_sha256
          )
      )
    returning receipt_row.id, receipt_row.invalidated_at
  ), event_material as (
    select
      affected.id as receipt_id,
      affected.invalidated_at,
      encode(sha256(convert_to(
        'prepared-receipt-invalidated-r29' || chr(10) || 'legacy' || chr(10)
          || correction_id::text || chr(10) || affected.id::text || chr(10)
          || correction_fingerprint,
        'UTF8'
      )), 'hex') as event_sha256
    from affected
  ), inserted_events as (
    insert into public.brain_prepared_receipt_events (
      event_id, receipt_id, event_type, event_sha256, occurred_at
    )
    select
      (substring(event_material.event_sha256, 1, 8) || '-'
        || substring(event_material.event_sha256, 9, 4) || '-'
        || substring(event_material.event_sha256, 13, 4) || '-'
        || substring(event_material.event_sha256, 17, 4) || '-'
        || substring(event_material.event_sha256, 21, 12))::uuid,
      event_material.receipt_id,
      'invalidated',
      event_material.event_sha256,
      event_material.invalidated_at
    from event_material
    returning receipt_id
  )
  select count(*)::integer into legacy_affected_count from inserted_events;

  with affected as (
    update public.brain_prepared_custody_receipts receipt_row
    set invalidated_at = greatest(occurred_at, receipt_row.produced_at)
    where receipt_row.workspace_id = workspace_id
      and receipt_row.custody_principal_id = custody_principal_id
      and receipt_row.subject_id = subject_id
      and receipt_row.audience = audience
      and receipt_row.purpose = purpose
      and receipt_row.invalidated_at is null
      and receipt_row.erased_at is null
      and exists (
        select 1
        from public.brain_prepared_custody_receipt_dependencies dependency_row
        where dependency_row.receipt_id = receipt_row.id
          and dependency_row.workspace_id = workspace_id
          and dependency_row.custody_principal_id = custody_principal_id
          and dependency_row.subject_id = subject_id
          and dependency_row.audience = audience
          and dependency_row.purpose = purpose
          and dependency_row.authority_kind = affected_authority_kind
          and dependency_row.authority_record_id = affected_authority_record_id
          and (
            dependency_row.authority_record_id <> replacement_authority_record_id
            or dependency_row.authority_version <> replacement_authority_version
            or dependency_row.authority_sha256 <> replacement_authority_sha256
          )
      )
    returning receipt_row.id, receipt_row.invalidated_at
  ), event_material as (
    select
      affected.id as receipt_id,
      affected.invalidated_at,
      encode(sha256(convert_to(
        'prepared-receipt-invalidated-r29' || chr(10) || 'custody' || chr(10)
          || correction_id::text || chr(10) || affected.id::text || chr(10)
          || correction_fingerprint,
        'UTF8'
      )), 'hex') as event_sha256
    from affected
  ), inserted_events as (
    insert into public.brain_prepared_custody_receipt_events (
      event_id, receipt_id, event_type, event_sha256, occurred_at
    )
    select
      (substring(event_material.event_sha256, 1, 8) || '-'
        || substring(event_material.event_sha256, 9, 4) || '-'
        || substring(event_material.event_sha256, 13, 4) || '-'
        || substring(event_material.event_sha256, 17, 4) || '-'
        || substring(event_material.event_sha256, 21, 12))::uuid,
      event_material.receipt_id,
      'invalidated',
      event_material.event_sha256,
      event_material.invalidated_at
    from event_material
    returning receipt_id
  )
  select count(*)::integer into custody_affected_count from inserted_events;

  update public.brain_prepared_custody_corrections correction_row
  set
    legacy_affected_receipt_count = legacy_affected_count,
    custody_affected_receipt_count = custody_affected_count
  where correction_row.id = correction_id;

  return jsonb_build_object(
    'status', 'invalidated',
    'correction_id', correction_id,
    'legacy_affected_receipt_count', legacy_affected_count,
    'custody_affected_receipt_count', custody_affected_count,
    'affected_receipt_count', legacy_affected_count + custody_affected_count
  );
end;
$$;

revoke all on table public.brain_prepared_custody_corrections from public, anon, authenticated;
grant select, insert on table public.brain_prepared_custody_corrections to service_role;
grant update (legacy_affected_receipt_count, custody_affected_receipt_count)
  on table public.brain_prepared_custody_corrections to service_role;
grant update (invalidated_at) on table public.brain_prepared_receipts to service_role;
grant update (invalidated_at) on table public.brain_prepared_custody_receipts to service_role;
revoke all on function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_invalidate_both_prepared_generations_for_correction(jsonb)
  to service_role;
