-- G25 R10 prepared-receipt atomic store candidate.
-- This is a non-migration candidate. It must not be applied to a linked database.

create schema if not exists private;

create table public.brain_prepared_receipts (
  id uuid primary key,
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  ingest_key text not null check (char_length(btrim(ingest_key)) between 1 and 200),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind = 'prepared_intelligence'),
  audience text not null check (audience in ('person_private', 'delivery_team_private')),
  purpose text not null check (purpose = 'prepared_intelligence'),
  authority_fingerprint text not null check (authority_fingerprint ~ '^[0-9a-f]{64}$'),
  content_fingerprint text not null check (content_fingerprint ~ '^[0-9a-f]{64}$'),
  payload_ciphertext text not null check (char_length(payload_ciphertext) > 0),
  encryption_version smallint not null check (encryption_version > 0),
  produced_at timestamptz not null,
  expires_at timestamptz not null,
  invalidated_at timestamptz,
  erased_at timestamptz,
  recorded_at timestamptz not null default now(),
  unique (workspace_id, ingest_key),
  unique (id, workspace_id, owner_id, subject_id, audience, purpose),
  check (expires_at > produced_at),
  check (invalidated_at is null or invalidated_at >= produced_at),
  check (erased_at is null or erased_at >= produced_at)
);

create table public.brain_prepared_receipt_dependencies (
  receipt_id uuid not null,
  workspace_id uuid not null,
  owner_id uuid not null,
  subject_id uuid not null,
  audience text not null,
  purpose text not null,
  authority_kind text not null check (authority_kind in (
    'brain_item_version',
    'decision_case_snapshot',
    'decision_claim_snapshot',
    'external_source_receipt'
  )),
  authority_record_id uuid not null,
  authority_version text not null check (authority_version ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'),
  authority_sha256 text not null check (authority_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  primary key (receipt_id, authority_kind, authority_record_id),
  foreign key (receipt_id, workspace_id, owner_id, subject_id, audience, purpose)
    references public.brain_prepared_receipts(id, workspace_id, owner_id, subject_id, audience, purpose)
    on delete cascade
);

create table public.brain_prepared_receipt_events (
  event_id uuid primary key,
  receipt_id uuid not null references public.brain_prepared_receipts(id) on delete cascade,
  event_type text not null check (event_type in ('accepted', 'invalidated', 'erased', 'delivery_referenced')),
  event_sha256 text not null check (event_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  unique (receipt_id, event_type, event_sha256)
);

create index brain_prepared_receipts_scope_idx
  on public.brain_prepared_receipts (workspace_id, subject_id, audience, purpose);
create index brain_prepared_receipts_owner_idx
  on public.brain_prepared_receipts (owner_id);
create index brain_prepared_receipts_subject_idx
  on public.brain_prepared_receipts (subject_id);
create index brain_prepared_receipts_current_idx
  on public.brain_prepared_receipts (workspace_id, expires_at)
  where invalidated_at is null and erased_at is null;
create index brain_prepared_receipt_dependencies_authority_idx
  on public.brain_prepared_receipt_dependencies (authority_kind, authority_record_id, authority_version);
create index brain_prepared_receipt_dependencies_scope_idx
  on public.brain_prepared_receipt_dependencies (workspace_id, subject_id, audience, purpose);
create index brain_prepared_receipt_events_receipt_idx
  on public.brain_prepared_receipt_events (receipt_id, occurred_at);
create index brain_workspace_roles_prepared_read_idx
  on public.brain_workspace_roles (user_id, workspace_id)
  where revoked_at is null;
create index brain_audience_grants_prepared_read_idx
  on public.brain_audience_grants (grantee_user_id, workspace_id, audience, purpose)
  where revoked_at is null;

alter table public.brain_prepared_receipts enable row level security;
alter table public.brain_prepared_receipt_dependencies enable row level security;
alter table public.brain_prepared_receipt_events enable row level security;
alter table public.brain_prepared_receipts force row level security;
alter table public.brain_prepared_receipt_dependencies force row level security;
alter table public.brain_prepared_receipt_events force row level security;

create policy brain_prepared_receipts_exact_scope_select
on public.brain_prepared_receipts for select to authenticated
using (
  ((select auth.jwt()) ->> 'is_anonymous')::boolean is not true
  and erased_at is null
  and invalidated_at is null
  and expires_at > now()
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_prepared_receipts.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_prepared_receipts.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_prepared_receipts.audience
      and grant_row.purpose = brain_prepared_receipts.purpose
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_prepared_receipt_dependencies_exact_scope_select
on public.brain_prepared_receipt_dependencies for select to authenticated
using (
  exists (
    select 1 from public.brain_prepared_receipts receipt_row
    where receipt_row.id = brain_prepared_receipt_dependencies.receipt_id
  )
);

create policy brain_prepared_receipt_events_exact_scope_select
on public.brain_prepared_receipt_events for select to authenticated
using (
  exists (
    select 1 from public.brain_prepared_receipts receipt_row
    where receipt_row.id = brain_prepared_receipt_events.receipt_id
  )
);

create or replace function private.brain_canonical_jsonb(p_value jsonb)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  canonical text;
begin
  case jsonb_typeof(p_value)
    when 'null' then return 'null';
    when 'boolean' then return p_value::text;
    when 'number' then return p_value::text;
    when 'string' then return p_value::text;
    when 'array' then
      select '[' || coalesce(string_agg(private.brain_canonical_jsonb(member.value), ',' order by member.ordinality), '') || ']'
      into canonical
      from jsonb_array_elements(p_value) with ordinality as member(value, ordinality);
      return canonical;
    when 'object' then
      select '{' || coalesce(string_agg(to_jsonb(member.key)::text || ':' || private.brain_canonical_jsonb(member.value), ',' order by member.key), '') || '}'
      into canonical
      from jsonb_each(p_value) as member(key, value);
      return canonical;
    else
      raise exception 'canonical_json_type_invalid';
  end case;
end;
$$;

create or replace function private.brain_prepared_authority_fingerprint(
  p_receipt_id uuid,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_subject_id uuid,
  p_audience text,
  p_purpose text,
  p_dependencies jsonb
)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  normalized_dependencies jsonb;
  unsigned_envelope jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'authority_kind', dependency.value ->> 'authority_kind',
        'authority_record_id', dependency.value ->> 'authority_record_id',
        'authority_version', dependency.value ->> 'authority_version',
        'authority_sha256', dependency.value ->> 'authority_sha256',
        'observed_at', dependency.value ->> 'observed_at',
        'workspace_id', dependency.value ->> 'workspace_id',
        'owner_id', dependency.value ->> 'owner_id',
        'subject_id', dependency.value ->> 'subject_id',
        'audience', dependency.value ->> 'audience',
        'purpose', dependency.value ->> 'purpose'
      ) order by
        dependency.value ->> 'authority_kind',
        dependency.value ->> 'authority_record_id',
        dependency.value ->> 'authority_version'
    ),
    '[]'::jsonb
  ) into normalized_dependencies
  from jsonb_array_elements(p_dependencies) as dependency(value);

  unsigned_envelope := jsonb_build_object(
    'schema_version', 'ctrl.prepared-intelligence-authority-envelope.r7',
    'receipt_id', p_receipt_id::text,
    'workspace_id', p_workspace_id::text,
    'owner_id', p_owner_id::text,
    'subject_id', p_subject_id::text,
    'audience', p_audience,
    'purpose', p_purpose,
    'dependencies', normalized_dependencies
  );

  return encode(
    sha256(convert_to('prepared-authority-envelope-r7' || chr(10) || private.brain_canonical_jsonb(unsigned_envelope), 'UTF8')),
    'hex'
  );
end;
$$;

-- Closed adapter seam. R11 must replace this with real, reviewed authority mappings.
create or replace function private.brain_prepared_authority_current(
  p_authority_kind text,
  p_authority_record_id uuid,
  p_authority_version text,
  p_authority_sha256 text,
  p_observed_at timestamptz,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_subject_id uuid,
  p_audience text,
  p_purpose text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select false $$;

-- Closed lifecycle seam. R13 may replace this with a durable erasure tombstone check.
create or replace function private.brain_prepared_subject_erased(
  p_workspace_id uuid,
  p_subject_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select false $$;

create or replace function private.brain_store_prepared_receipt(
  p_receipt jsonb,
  p_dependencies jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  receipt_id uuid;
  workspace_id uuid;
  owner_id uuid;
  subject_id uuid;
  ingest_key text;
  request_sha256 text;
  receipt_kind text;
  audience text;
  purpose text;
  authority_fingerprint text;
  expected_authority_fingerprint text;
  content_fingerprint text;
  payload_ciphertext text;
  encryption_version smallint;
  produced_at timestamptz;
  expires_at timestamptz;
  dependency jsonb;
  existing public.brain_prepared_receipts%rowtype;
  accepted_event_sha256 text;
begin
  if jsonb_typeof(p_receipt) <> 'object' then raise exception 'receipt_object_required'; end if;
  if jsonb_typeof(p_dependencies) <> 'array' or jsonb_array_length(p_dependencies) = 0 then
    raise exception 'authority_dependencies_required';
  end if;

  receipt_id := (p_receipt ->> 'receipt_id')::uuid;
  workspace_id := (p_receipt ->> 'workspace_id')::uuid;
  owner_id := (p_receipt ->> 'owner_id')::uuid;
  subject_id := (p_receipt ->> 'subject_id')::uuid;
  ingest_key := p_receipt ->> 'ingest_key';
  request_sha256 := p_receipt ->> 'request_sha256';
  receipt_kind := p_receipt ->> 'kind';
  audience := p_receipt ->> 'audience';
  purpose := p_receipt ->> 'purpose';
  authority_fingerprint := p_receipt ->> 'authority_fingerprint';
  content_fingerprint := p_receipt ->> 'content_fingerprint';
  payload_ciphertext := p_receipt ->> 'payload_ciphertext';
  encryption_version := (p_receipt ->> 'encryption_version')::smallint;
  produced_at := (p_receipt ->> 'produced_at')::timestamptz;
  expires_at := (p_receipt ->> 'expires_at')::timestamptz;

  if ingest_key is null or char_length(btrim(ingest_key)) not between 1 and 200 then raise exception 'ingest_key_invalid'; end if;
  if request_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'request_fingerprint_invalid'; end if;
  if receipt_kind <> 'prepared_intelligence' then raise exception 'receipt_kind_invalid'; end if;
  if audience not in ('person_private', 'delivery_team_private') then raise exception 'receipt_audience_invalid'; end if;
  if purpose <> 'prepared_intelligence' then raise exception 'receipt_purpose_invalid'; end if;
  if authority_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'authority_fingerprint_invalid'; end if;
  if content_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'content_fingerprint_invalid'; end if;
  if payload_ciphertext is null or char_length(payload_ciphertext) = 0 then raise exception 'receipt_ciphertext_invalid'; end if;
  if encryption_version is null or encryption_version <= 0 then raise exception 'encryption_version_invalid'; end if;
  if expires_at <= produced_at then raise exception 'receipt_time_window_invalid'; end if;

  if not exists (
    select 1 from public.brain_workspaces workspace_row
    where workspace_row.id = workspace_id
      and workspace_row.owner_id = owner_id
      and workspace_row.subject_id = subject_id
  ) then raise exception 'receipt_workspace_scope_invalid'; end if;

  if private.brain_prepared_subject_erased(workspace_id, subject_id) then
    raise exception 'prepared_subject_erased';
  end if;

  if (
    select count(*) <> count(distinct ((member.value ->> 'authority_kind') || ':' || (member.value ->> 'authority_record_id')))
    from jsonb_array_elements(p_dependencies) as member(value)
  ) then raise exception 'authority_dependency_duplicate'; end if;

  for dependency in select member.value from jsonb_array_elements(p_dependencies) as member(value)
  loop
    if not dependency ?& array[
      'authority_kind', 'authority_record_id', 'authority_version', 'authority_sha256', 'observed_at',
      'workspace_id', 'owner_id', 'subject_id', 'audience', 'purpose'
    ] then raise exception 'authority_dependency_shape_invalid'; end if;
    if dependency ->> 'workspace_id' <> workspace_id::text
      or dependency ->> 'owner_id' <> owner_id::text
      or dependency ->> 'subject_id' <> subject_id::text
      or dependency ->> 'audience' <> audience
      or dependency ->> 'purpose' <> purpose
    then raise exception 'authority_dependency_scope_mismatch'; end if;
    if dependency ->> 'authority_kind' not in ('brain_item_version', 'external_source_receipt') then
      raise exception 'authority_kind_adapter_unavailable';
    end if;
    perform (dependency ->> 'authority_record_id')::uuid;
    perform (dependency ->> 'observed_at')::timestamptz;
    if (dependency ->> 'observed_at')::timestamptz > produced_at then
      raise exception 'authority_dependency_observed_after_receipt';
    end if;
    if dependency ->> 'authority_version' !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'
      or dependency ->> 'authority_sha256' !~ '^[0-9a-f]{64}$'
    then raise exception 'authority_dependency_identity_invalid'; end if;
  end loop;

  expected_authority_fingerprint := private.brain_prepared_authority_fingerprint(
    receipt_id, workspace_id, owner_id, subject_id, audience, purpose, p_dependencies
  );
  if authority_fingerprint <> expected_authority_fingerprint then
    raise exception 'authority_fingerprint_mismatch';
  end if;

  select * into existing
  from public.brain_prepared_receipts receipt_row
  where receipt_row.workspace_id = workspace_id and receipt_row.ingest_key = ingest_key;
  if found then
    if existing.request_sha256 = request_sha256
      and existing.kind = receipt_kind
      and existing.owner_id = owner_id
      and existing.subject_id = subject_id
      and existing.audience = audience
      and existing.purpose = purpose
      and existing.authority_fingerprint = authority_fingerprint
      and existing.content_fingerprint = content_fingerprint
      and existing.produced_at = produced_at
      and existing.expires_at = expires_at
    then
      return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id);
    end if;
    raise exception 'receipt_identity_conflict';
  end if;

  if exists (select 1 from public.brain_prepared_receipts receipt_row where receipt_row.id = receipt_id) then
    raise exception 'receipt_identity_conflict';
  end if;

  for dependency in select member.value from jsonb_array_elements(p_dependencies) as member(value)
  loop
    if not private.brain_prepared_authority_current(
      dependency ->> 'authority_kind',
      (dependency ->> 'authority_record_id')::uuid,
      dependency ->> 'authority_version',
      dependency ->> 'authority_sha256',
      (dependency ->> 'observed_at')::timestamptz,
      workspace_id,
      owner_id,
      subject_id,
      audience,
      purpose
    ) then raise exception 'authority_dependency_not_current'; end if;
  end loop;

  insert into public.brain_prepared_receipts (
    id, workspace_id, owner_id, subject_id, ingest_key, request_sha256, kind, audience, purpose,
    authority_fingerprint, content_fingerprint, payload_ciphertext, encryption_version, produced_at, expires_at
  ) values (
    receipt_id, workspace_id, owner_id, subject_id, ingest_key, request_sha256, receipt_kind, audience, purpose,
    authority_fingerprint, content_fingerprint, payload_ciphertext, encryption_version, produced_at, expires_at
  )
  on conflict on constraint brain_prepared_receipts_workspace_id_ingest_key_key do nothing
  returning * into existing;

  if not found then
    select * into existing
    from public.brain_prepared_receipts receipt_row
    where receipt_row.workspace_id = workspace_id and receipt_row.ingest_key = ingest_key;
    if existing.request_sha256 = request_sha256
      and existing.kind = receipt_kind
      and existing.owner_id = owner_id
      and existing.subject_id = subject_id
      and existing.audience = audience
      and existing.purpose = purpose
      and existing.authority_fingerprint = authority_fingerprint
      and existing.content_fingerprint = content_fingerprint
      and existing.produced_at = produced_at
      and existing.expires_at = expires_at
    then
      return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id);
    end if;
    raise exception 'receipt_identity_conflict';
  end if;

  insert into public.brain_prepared_receipt_dependencies (
    receipt_id, workspace_id, owner_id, subject_id, audience, purpose,
    authority_kind, authority_record_id, authority_version, authority_sha256, observed_at
  )
  select
    receipt_id, workspace_id, owner_id, subject_id, audience, purpose,
    member.value ->> 'authority_kind',
    (member.value ->> 'authority_record_id')::uuid,
    member.value ->> 'authority_version',
    member.value ->> 'authority_sha256',
    (member.value ->> 'observed_at')::timestamptz
  from jsonb_array_elements(p_dependencies) as member(value);

  accepted_event_sha256 := encode(sha256(convert_to(
    'prepared-receipt-accepted-v1' || chr(10) || receipt_id::text || chr(10) || request_sha256 || chr(10) || authority_fingerprint || chr(10) || content_fingerprint,
    'UTF8'
  )), 'hex');

  insert into public.brain_prepared_receipt_events (
    event_id, receipt_id, event_type, event_sha256, occurred_at
  ) values (
    receipt_id, receipt_id, 'accepted', accepted_event_sha256, produced_at
  );

  return jsonb_build_object('status', 'created', 'receipt_id', receipt_id);
end;
$$;

revoke all on table public.brain_prepared_receipts from anon, authenticated;
revoke all on table public.brain_prepared_receipt_dependencies from anon, authenticated;
revoke all on table public.brain_prepared_receipt_events from anon, authenticated;
grant select on table public.brain_prepared_receipts to authenticated;
grant select on table public.brain_prepared_receipt_dependencies to authenticated;
grant select on table public.brain_prepared_receipt_events to authenticated;
grant select, insert on table public.brain_prepared_receipts to service_role;
grant select, insert on table public.brain_prepared_receipt_dependencies to service_role;
grant select, insert on table public.brain_prepared_receipt_events to service_role;

revoke all on function private.brain_canonical_jsonb(jsonb) from public, anon, authenticated;
revoke all on function private.brain_prepared_authority_fingerprint(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function private.brain_prepared_authority_current(text, uuid, text, text, timestamptz, uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function private.brain_prepared_subject_erased(uuid, uuid) from public, anon, authenticated;
revoke all on function private.brain_store_prepared_receipt(jsonb, jsonb) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.brain_canonical_jsonb(jsonb) to service_role;
grant execute on function private.brain_prepared_authority_fingerprint(uuid, uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function private.brain_prepared_authority_current(text, uuid, text, text, timestamptz, uuid, uuid, uuid, text, text) to service_role;
grant execute on function private.brain_prepared_subject_erased(uuid, uuid) to service_role;
grant execute on function private.brain_store_prepared_receipt(jsonb, jsonb) to service_role;
