-- G25 R12 prepared-receipt correction invalidation candidate.
-- This is a non-migration overlay for the R10 and R11 candidates.

create table public.brain_prepared_authority_corrections (
  id uuid primary key,
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('person_private', 'delivery_team_private')),
  purpose text not null check (purpose = 'prepared_intelligence'),
  correction_mode text not null check (correction_mode = 'replaced'),
  affected_authority_kind text not null check (affected_authority_kind in ('brain_item_version', 'external_source_receipt')),
  affected_authority_record_id uuid not null,
  replacement_authority_record_id uuid,
  replacement_authority_version text,
  replacement_authority_sha256 text,
  correction_fingerprint text not null check (correction_fingerprint ~ '^[0-9a-f]{64}$'),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  affected_receipt_count integer not null default 0 check (affected_receipt_count >= 0),
  recorded_at timestamptz not null default now(),
  constraint brain_prepared_corrections_scope_fingerprint_key unique (workspace_id, correction_fingerprint),
  check (replacement_authority_record_id is not null),
  check (replacement_authority_version is not null),
  check (replacement_authority_version ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'),
  check (replacement_authority_sha256 ~ '^[0-9a-f]{64}$')
);

create index brain_prepared_authority_corrections_scope_idx
  on public.brain_prepared_authority_corrections (workspace_id, subject_id, occurred_at);
create index brain_prepared_authority_corrections_affected_idx
  on public.brain_prepared_authority_corrections (affected_authority_kind, affected_authority_record_id);

alter table public.brain_prepared_authority_corrections enable row level security;
alter table public.brain_prepared_authority_corrections force row level security;

create or replace function private.brain_invalidate_prepared_receipts_for_correction(
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
  owner_id uuid;
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
  correction_fingerprint text;
  correction_projection jsonb;
  existing public.brain_prepared_authority_corrections%rowtype;
  affected_count integer;
begin
  if jsonb_typeof(p_correction) <> 'object' then raise exception 'correction_object_required'; end if;

  correction_id := (p_correction ->> 'correction_id')::uuid;
  workspace_id := (p_correction ->> 'workspace_id')::uuid;
  owner_id := (p_correction ->> 'owner_id')::uuid;
  subject_id := (p_correction ->> 'subject_id')::uuid;
  audience := p_correction ->> 'audience';
  purpose := p_correction ->> 'purpose';
  correction_mode := p_correction ->> 'correction_mode';
  affected_authority_kind := p_correction ->> 'affected_authority_kind';
  affected_authority_record_id := (p_correction ->> 'affected_authority_record_id')::uuid;
  replacement_authority_record_id := nullif(p_correction ->> 'replacement_authority_record_id', '')::uuid;
  replacement_authority_version := nullif(p_correction ->> 'replacement_authority_version', '');
  replacement_authority_sha256 := nullif(p_correction ->> 'replacement_authority_sha256', '');
  request_sha256 := p_correction ->> 'request_sha256';
  occurred_at := (p_correction ->> 'occurred_at')::timestamptz;

  if audience not in ('person_private', 'delivery_team_private') then raise exception 'correction_audience_invalid'; end if;
  if purpose <> 'prepared_intelligence' then raise exception 'correction_purpose_invalid'; end if;
  if correction_mode <> 'replaced' then raise exception 'correction_mode_invalid'; end if;
  if affected_authority_kind not in ('brain_item_version', 'external_source_receipt') then
    raise exception 'correction_authority_kind_unavailable';
  end if;
  if request_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'correction_request_fingerprint_invalid'; end if;
  if replacement_authority_record_id is null
    or replacement_authority_version !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'
    or replacement_authority_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'replacement_authority_identity_invalid'; end if;
  if not private.brain_prepared_authority_current(
    affected_authority_kind,
    replacement_authority_record_id,
    replacement_authority_version,
    replacement_authority_sha256,
    occurred_at,
    workspace_id,
    owner_id,
    subject_id,
    audience,
    purpose
  ) then raise exception 'replacement_authority_not_current'; end if;

  if not exists (
    select 1 from public.brain_workspaces workspace_row
    where workspace_row.id = workspace_id
      and workspace_row.owner_id = owner_id
      and workspace_row.subject_id = subject_id
  ) then raise exception 'correction_workspace_scope_invalid'; end if;

  correction_projection := jsonb_build_object(
    'workspace_id', workspace_id,
    'owner_id', owner_id,
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
    'prepared-authority-correction-r12' || chr(10) || private.brain_canonical_jsonb(correction_projection),
    'UTF8'
  )), 'hex');

  select * into existing
  from public.brain_prepared_authority_corrections correction_row
  where correction_row.id = correction_id;
  if found then
    if existing.workspace_id = workspace_id
      and existing.correction_fingerprint = correction_fingerprint
      and existing.request_sha256 = request_sha256
    then
      return jsonb_build_object(
        'status', 'idempotent',
        'correction_id', existing.id,
        'affected_receipt_count', existing.affected_receipt_count
      );
    end if;
    raise exception 'correction_identity_conflict';
  end if;

  insert into public.brain_prepared_authority_corrections (
    id, workspace_id, owner_id, subject_id, audience, purpose, correction_mode,
    affected_authority_kind, affected_authority_record_id,
    replacement_authority_record_id, replacement_authority_version, replacement_authority_sha256,
    correction_fingerprint, request_sha256, occurred_at
  ) values (
    correction_id, workspace_id, owner_id, subject_id, audience, purpose, correction_mode,
    affected_authority_kind, affected_authority_record_id,
    replacement_authority_record_id, replacement_authority_version, replacement_authority_sha256,
    correction_fingerprint, request_sha256, occurred_at
  )
  on conflict on constraint brain_prepared_corrections_scope_fingerprint_key do nothing
  returning * into existing;

  if not found then
    select * into existing
    from public.brain_prepared_authority_corrections correction_row
    where correction_row.workspace_id = workspace_id
      and correction_row.correction_fingerprint = correction_fingerprint;
    return jsonb_build_object(
      'status', 'converged',
      'correction_id', existing.id,
      'affected_receipt_count', existing.affected_receipt_count
    );
  end if;

  with affected as (
    update public.brain_prepared_receipts receipt_row
    set invalidated_at = greatest(occurred_at, receipt_row.produced_at)
    where receipt_row.workspace_id = workspace_id
      and receipt_row.owner_id = owner_id
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
          and dependency_row.owner_id = owner_id
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
        'prepared-receipt-invalidated-r12' || chr(10)
          || correction_id::text || chr(10)
          || affected.id::text || chr(10)
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
  select count(*)::integer into affected_count from inserted_events;

  update public.brain_prepared_authority_corrections correction_row
  set affected_receipt_count = affected_count
  where correction_row.id = correction_id;

  return jsonb_build_object(
    'status', 'invalidated',
    'correction_id', correction_id,
    'affected_receipt_count', affected_count
  );
end;
$$;

revoke all on table public.brain_prepared_authority_corrections from public, anon, authenticated;
grant select, insert on table public.brain_prepared_authority_corrections to service_role;
grant update (affected_receipt_count) on table public.brain_prepared_authority_corrections to service_role;
grant update (invalidated_at) on table public.brain_prepared_receipts to service_role;
revoke all on function private.brain_invalidate_prepared_receipts_for_correction(jsonb) from public, anon, authenticated;
grant execute on function private.brain_invalidate_prepared_receipts_for_correction(jsonb) to service_role;
