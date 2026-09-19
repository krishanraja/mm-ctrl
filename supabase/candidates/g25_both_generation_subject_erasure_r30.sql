-- G25 R30 stable-custody subject-erasure candidate.
-- This is a non-migration overlay for R10 through R13 and R22 through R25.
-- It must not be applied to a linked database.

alter table public.brain_prepared_custody_receipts
  alter column payload_ciphertext drop not null,
  alter column encryption_version drop not null,
  drop constraint brain_prepared_custody_receipts_payload_ciphertext_check,
  drop constraint brain_prepared_custody_receipts_encryption_version_check,
  add constraint brain_prepared_custody_receipts_payload_erasure_state_check check (
    (
      erased_at is null
      and payload_ciphertext is not null
      and char_length(payload_ciphertext) > 0
      and encryption_version is not null
      and encryption_version > 0
    )
    or
    (
      erased_at is not null
      and payload_ciphertext is null
      and encryption_version is null
    )
  );

create table public.brain_prepared_custody_subject_erasure_tombstones (
  erasure_id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.prepared-intelligence-custody-subject-erasure.r30'),
  workspace_id uuid not null
    references public.brain_workspaces(id) on delete cascade,
  custody_principal_id uuid not null
    references private.brain_custody_principals(id) on delete cascade,
  subject_id uuid not null
    references private.brain_subject_principals(id) on delete restrict,
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  erasure_fingerprint text not null check (erasure_fingerprint ~ '^[0-9a-f]{64}$'),
  legacy_erased_receipt_count integer not null default 0
    check (legacy_erased_receipt_count >= 0),
  custody_erased_receipt_count integer not null default 0
    check (custody_erased_receipt_count >= 0),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (workspace_id, subject_id),
  unique (workspace_id, erasure_fingerprint),
  unique (workspace_id, custody_principal_id, subject_id)
);

create index brain_prepared_custody_subject_erasure_subject_idx
  on public.brain_prepared_custody_subject_erasure_tombstones (subject_id, workspace_id);

alter table public.brain_prepared_custody_subject_erasure_tombstones enable row level security;
alter table public.brain_prepared_custody_subject_erasure_tombstones force row level security;

create or replace function private.brain_prepared_subject_erased(
  p_workspace_id uuid,
  p_subject_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.brain_prepared_subject_erasure_tombstones legacy_tombstone
    where legacy_tombstone.workspace_id = p_workspace_id
      and legacy_tombstone.subject_id = p_subject_id
  ) or exists (
    select 1
    from public.brain_prepared_custody_subject_erasure_tombstones custody_tombstone
    where custody_tombstone.workspace_id = p_workspace_id
      and custody_tombstone.subject_id = p_subject_id
  )
$$;

create or replace function private.brain_erase_both_prepared_generations(
  p_erasure jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  erasure_id uuid;
  workspace_id uuid;
  custody_principal_id uuid;
  subject_id uuid;
  request_sha256 text;
  occurred_at timestamptz;
  erasure_projection jsonb;
  erasure_fingerprint text;
  existing public.brain_prepared_custody_subject_erasure_tombstones%rowtype;
  legacy_erased_count integer;
  custody_erased_count integer;
begin
  if jsonb_typeof(p_erasure) <> 'object' then raise exception 'erasure_object_required'; end if;
  if (
    select count(*) <> 7
      or count(*) filter (where key = any(array[
        'schema_version', 'erasure_id', 'workspace_id', 'custody_principal_id',
        'subject_id', 'request_sha256', 'occurred_at'
      ])) <> 7
    from jsonb_object_keys(p_erasure) as member(key)
  ) then raise exception 'erasure_shape_invalid'; end if;
  if p_erasure ->> 'schema_version'
    <> 'ctrl.prepared-intelligence-custody-subject-erasure.r30'
  then raise exception 'erasure_schema_version_invalid'; end if;

  erasure_id := (p_erasure ->> 'erasure_id')::uuid;
  workspace_id := (p_erasure ->> 'workspace_id')::uuid;
  custody_principal_id := (p_erasure ->> 'custody_principal_id')::uuid;
  subject_id := (p_erasure ->> 'subject_id')::uuid;
  request_sha256 := p_erasure ->> 'request_sha256';
  occurred_at := (p_erasure ->> 'occurred_at')::timestamptz;

  if request_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'erasure_request_fingerprint_invalid';
  end if;
  if occurred_at > statement_timestamp() then raise exception 'erasure_occurred_in_future'; end if;

  perform 1
  from public.brain_workspaces workspace_row
  join private.brain_custody_principals custody_row
    on custody_row.workspace_id = workspace_row.id
  where workspace_row.id = workspace_id
    and workspace_row.subject_id = subject_id
    and custody_row.id = custody_principal_id
  for update of workspace_row, custody_row;
  if not found then raise exception 'erasure_stable_scope_invalid'; end if;

  erasure_projection := jsonb_build_object(
    'schema_version', 'ctrl.prepared-intelligence-custody-subject-erasure.r30',
    'workspace_id', workspace_id,
    'custody_principal_id', custody_principal_id,
    'subject_id', subject_id,
    'occurred_at', to_char(occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  );
  erasure_fingerprint := encode(sha256(convert_to(
    'prepared-custody-subject-erasure-r30' || chr(10)
      || private.brain_canonical_jsonb(erasure_projection),
    'UTF8'
  )), 'hex');

  select * into existing
  from public.brain_prepared_custody_subject_erasure_tombstones tombstone_row
  where tombstone_row.workspace_id = workspace_id
    and tombstone_row.subject_id = subject_id
  for update;
  if found then
    if existing.erasure_id = erasure_id
      and existing.request_sha256 = request_sha256
      and existing.erasure_fingerprint = erasure_fingerprint
    then
      return jsonb_build_object(
        'status', 'idempotent',
        'erasure_id', existing.erasure_id,
        'legacy_erased_receipt_count', existing.legacy_erased_receipt_count,
        'custody_erased_receipt_count', existing.custody_erased_receipt_count,
        'erased_receipt_count',
          existing.legacy_erased_receipt_count + existing.custody_erased_receipt_count
      );
    end if;
    if existing.erasure_id = erasure_id then raise exception 'erasure_identity_conflict'; end if;
    return jsonb_build_object(
      'status', 'already_erased',
      'erasure_id', existing.erasure_id,
      'legacy_erased_receipt_count', existing.legacy_erased_receipt_count,
      'custody_erased_receipt_count', existing.custody_erased_receipt_count,
      'erased_receipt_count',
        existing.legacy_erased_receipt_count + existing.custody_erased_receipt_count
    );
  end if;

  insert into public.brain_prepared_custody_subject_erasure_tombstones (
    erasure_id,
    schema_version,
    workspace_id,
    custody_principal_id,
    subject_id,
    request_sha256,
    erasure_fingerprint,
    occurred_at
  ) values (
    erasure_id,
    'ctrl.prepared-intelligence-custody-subject-erasure.r30',
    workspace_id,
    custody_principal_id,
    subject_id,
    request_sha256,
    erasure_fingerprint,
    occurred_at
  );

  with target as (
    select
      receipt_row.id,
      encode(sha256(convert_to(
        'prepared-legacy-receipt-erasure-tombstone-r30' || chr(10)
          || erasure_fingerprint || chr(10)
          || receipt_row.id::text,
        'UTF8'
      )), 'hex') as tombstone_sha256
    from public.brain_prepared_receipts receipt_row
    where receipt_row.workspace_id = workspace_id
      and receipt_row.subject_id = subject_id
      and receipt_row.erased_at is null
  )
  update public.brain_prepared_receipts receipt_row
  set
    ingest_key = 'erased:' || receipt_row.id::text,
    request_sha256 = target.tombstone_sha256,
    authority_fingerprint = target.tombstone_sha256,
    content_fingerprint = target.tombstone_sha256,
    payload_ciphertext = null,
    encryption_version = null,
    erased_at = greatest(occurred_at, receipt_row.produced_at)
  from target
  where receipt_row.id = target.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.subject_id = subject_id;

  with target as (
    select
      receipt_row.id,
      encode(sha256(convert_to(
        'prepared-custody-receipt-erasure-tombstone-r30' || chr(10)
          || erasure_fingerprint || chr(10)
          || receipt_row.id::text,
        'UTF8'
      )), 'hex') as tombstone_sha256
    from public.brain_prepared_custody_receipts receipt_row
    where receipt_row.workspace_id = workspace_id
      and receipt_row.custody_principal_id = custody_principal_id
      and receipt_row.subject_id = subject_id
      and receipt_row.erased_at is null
  )
  update public.brain_prepared_custody_receipts receipt_row
  set
    ingest_key = 'erased:' || receipt_row.id::text,
    request_sha256 = target.tombstone_sha256,
    authority_fingerprint = target.tombstone_sha256,
    content_fingerprint = target.tombstone_sha256,
    payload_ciphertext = null,
    encryption_version = null,
    erased_at = greatest(occurred_at, receipt_row.produced_at)
  from target
  where receipt_row.id = target.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.custody_principal_id = custody_principal_id
    and receipt_row.subject_id = subject_id;

  delete from public.brain_prepared_receipt_dependencies dependency_row
  using public.brain_prepared_receipts receipt_row
  where dependency_row.receipt_id = receipt_row.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.subject_id = subject_id
    and receipt_row.erased_at is not null;

  delete from public.brain_prepared_receipt_events event_row
  using public.brain_prepared_receipts receipt_row
  where event_row.receipt_id = receipt_row.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.subject_id = subject_id
    and receipt_row.erased_at is not null;

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
    'erased',
    event_material.event_sha256,
    event_material.erased_at
  from (
    select
      receipt_row.id as receipt_id,
      receipt_row.erased_at,
      encode(sha256(convert_to(
        'prepared-legacy-receipt-erased-event-r30' || chr(10)
          || erasure_id::text || chr(10)
          || receipt_row.id::text || chr(10)
          || erasure_fingerprint,
        'UTF8'
      )), 'hex') as event_sha256
    from public.brain_prepared_receipts receipt_row
    where receipt_row.workspace_id = workspace_id
      and receipt_row.subject_id = subject_id
      and receipt_row.erased_at is not null
  ) as event_material;

  delete from public.brain_prepared_custody_receipt_dependencies dependency_row
  using public.brain_prepared_custody_receipts receipt_row
  where dependency_row.receipt_id = receipt_row.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.custody_principal_id = custody_principal_id
    and receipt_row.subject_id = subject_id
    and receipt_row.erased_at is not null;

  delete from public.brain_prepared_custody_receipt_events event_row
  using public.brain_prepared_custody_receipts receipt_row
  where event_row.receipt_id = receipt_row.id
    and receipt_row.workspace_id = workspace_id
    and receipt_row.custody_principal_id = custody_principal_id
    and receipt_row.subject_id = subject_id
    and receipt_row.erased_at is not null;

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
    'erased',
    event_material.event_sha256,
    event_material.erased_at
  from (
    select
      receipt_row.id as receipt_id,
      receipt_row.erased_at,
      encode(sha256(convert_to(
        'prepared-custody-receipt-erased-event-r30' || chr(10)
          || erasure_id::text || chr(10)
          || receipt_row.id::text || chr(10)
          || erasure_fingerprint,
        'UTF8'
      )), 'hex') as event_sha256
    from public.brain_prepared_custody_receipts receipt_row
    where receipt_row.workspace_id = workspace_id
      and receipt_row.custody_principal_id = custody_principal_id
      and receipt_row.subject_id = subject_id
      and receipt_row.erased_at is not null
  ) as event_material;

  select count(*)::integer into legacy_erased_count
  from public.brain_prepared_receipts receipt_row
  where receipt_row.workspace_id = workspace_id
    and receipt_row.subject_id = subject_id
    and receipt_row.erased_at is not null;

  select count(*)::integer into custody_erased_count
  from public.brain_prepared_custody_receipts receipt_row
  where receipt_row.workspace_id = workspace_id
    and receipt_row.custody_principal_id = custody_principal_id
    and receipt_row.subject_id = subject_id
    and receipt_row.erased_at is not null;

  update public.brain_prepared_custody_subject_erasure_tombstones tombstone_row
  set
    legacy_erased_receipt_count = legacy_erased_count,
    custody_erased_receipt_count = custody_erased_count
  where tombstone_row.erasure_id = erasure_id;

  return jsonb_build_object(
    'status', 'erased',
    'erasure_id', erasure_id,
    'legacy_erased_receipt_count', legacy_erased_count,
    'custody_erased_receipt_count', custody_erased_count,
    'erased_receipt_count', legacy_erased_count + custody_erased_count
  );
end;
$$;

revoke all on table public.brain_prepared_custody_subject_erasure_tombstones
  from public, anon, authenticated, service_role;
grant select on table public.brain_prepared_custody_subject_erasure_tombstones to service_role;

revoke all on function private.brain_prepared_subject_erased(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.brain_prepared_subject_erased(uuid, uuid) to service_role;
revoke all on function private.brain_erase_both_prepared_generations(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_erase_both_prepared_generations(jsonb) to service_role;
