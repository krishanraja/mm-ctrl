-- G25 R25 stable-custody prepared-receipt atomic store candidate.
-- This is a non-migration overlay for R10, R11 and R23.
-- It must not be applied to a linked database.

create table public.brain_prepared_custody_receipts (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.prepared-intelligence-custody-envelope.r24'),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  custody_principal_id uuid not null
    references private.brain_custody_principals(id) on delete cascade,
  subject_id uuid not null
    references private.brain_subject_principals(id) on delete restrict,
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
  unique (id, workspace_id, custody_principal_id, subject_id, audience, purpose),
  check (expires_at > produced_at),
  check (invalidated_at is null or invalidated_at >= produced_at),
  check (erased_at is null or erased_at >= produced_at)
);

create table public.brain_prepared_custody_receipt_dependencies (
  receipt_id uuid not null,
  workspace_id uuid not null,
  custody_principal_id uuid not null,
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
  authority_version text not null
    check (authority_version ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$'),
  authority_sha256 text not null check (authority_sha256 ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  primary key (receipt_id, authority_kind, authority_record_id),
  foreign key (
    receipt_id, workspace_id, custody_principal_id, subject_id, audience, purpose
  ) references public.brain_prepared_custody_receipts(
    id, workspace_id, custody_principal_id, subject_id, audience, purpose
  ) on delete cascade
);

create table public.brain_prepared_custody_receipt_events (
  event_id uuid primary key,
  receipt_id uuid not null
    references public.brain_prepared_custody_receipts(id) on delete cascade,
  event_type text not null
    check (event_type in ('accepted', 'invalidated', 'erased', 'delivery_referenced')),
  event_sha256 text not null check (event_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  unique (receipt_id, event_type, event_sha256)
);

create index brain_prepared_custody_receipts_scope_idx
  on public.brain_prepared_custody_receipts
    (workspace_id, custody_principal_id, subject_id, audience, purpose);
create index brain_prepared_custody_receipts_subject_idx
  on public.brain_prepared_custody_receipts (subject_id);
create index brain_prepared_custody_receipts_current_idx
  on public.brain_prepared_custody_receipts (workspace_id, expires_at)
  where invalidated_at is null and erased_at is null;
create index brain_prepared_custody_dependencies_authority_idx
  on public.brain_prepared_custody_receipt_dependencies
    (authority_kind, authority_record_id, authority_version);
create index brain_prepared_custody_events_receipt_idx
  on public.brain_prepared_custody_receipt_events (receipt_id, occurred_at);

alter table public.brain_prepared_custody_receipts enable row level security;
alter table public.brain_prepared_custody_receipt_dependencies enable row level security;
alter table public.brain_prepared_custody_receipt_events enable row level security;
alter table public.brain_prepared_custody_receipts force row level security;
alter table public.brain_prepared_custody_receipt_dependencies force row level security;
alter table public.brain_prepared_custody_receipt_events force row level security;

create policy brain_prepared_custody_receipts_exact_scope_select
on public.brain_prepared_custody_receipts for select to authenticated
using (
  ((select auth.jwt()) ->> 'is_anonymous')::boolean is not true
  and erased_at is null
  and invalidated_at is null
  and expires_at > now()
  and exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_prepared_custody_receipts.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_prepared_custody_receipts.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_prepared_custody_receipts.audience
      and grant_row.purpose = brain_prepared_custody_receipts.purpose
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_prepared_custody_dependencies_exact_scope_select
on public.brain_prepared_custody_receipt_dependencies for select to authenticated
using (
  exists (
    select 1 from public.brain_prepared_custody_receipts receipt_row
    where receipt_row.id = brain_prepared_custody_receipt_dependencies.receipt_id
  )
);

create policy brain_prepared_custody_events_exact_scope_select
on public.brain_prepared_custody_receipt_events for select to authenticated
using (
  exists (
    select 1 from public.brain_prepared_custody_receipts receipt_row
    where receipt_row.id = brain_prepared_custody_receipt_events.receipt_id
  )
);

create or replace function private.brain_prepared_custody_fingerprint(
  p_receipt_id uuid,
  p_workspace_id uuid,
  p_custody_principal_id uuid,
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
        'custody_principal_id', dependency.value ->> 'custody_principal_id',
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
    'schema_version', 'ctrl.prepared-intelligence-custody-envelope.r24',
    'receipt_id', p_receipt_id::text,
    'workspace_id', p_workspace_id::text,
    'custody_principal_id', p_custody_principal_id::text,
    'subject_id', p_subject_id::text,
    'audience', p_audience,
    'purpose', p_purpose,
    'dependencies', normalized_dependencies
  );

  return encode(
    sha256(convert_to(
      'prepared-custody-envelope-r24' || chr(10) || private.brain_canonical_jsonb(unsigned_envelope),
      'UTF8'
    )),
    'hex'
  );
end;
$$;

create or replace function private.brain_prepared_custody_active(
  p_workspace_id uuid,
  p_custody_principal_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from private.brain_custody_principals custody
    join private.brain_custody_assignments assignment
      on assignment.custody_principal_id = custody.id
      and assignment.ended_at is null
    join private.brain_operator_auth_links auth_link
      on auth_link.operator_principal_id = assignment.operator_principal_id
      and auth_link.revoked_at is null
    where custody.id = p_custody_principal_id
      and custody.workspace_id = p_workspace_id
      and custody.closed_at is null
  )
$$;

create or replace function private.brain_current_prepared_custody_authority(
  p_authority_kind text,
  p_authority_record_id uuid,
  p_workspace_id uuid,
  p_custody_principal_id uuid,
  p_subject_id uuid,
  p_audience text,
  p_purpose text
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  authority_projection jsonb;
  authority_version text;
  authority_recorded_at timestamptz;
begin
  if p_purpose <> 'prepared_intelligence'
    or p_audience not in ('person_private', 'delivery_team_private')
    or not private.brain_prepared_custody_active(p_workspace_id, p_custody_principal_id)
  then return null; end if;

  if p_authority_kind = 'brain_item_version' then
    select
      jsonb_build_object(
        'id', version_row.id,
        'brain_item_id', version_row.brain_item_id,
        'workspace_id', version_row.workspace_id,
        'subject_id', version_row.subject_id,
        'version', version_row.version,
        'title', version_row.title,
        'meaning_ciphertext', version_row.meaning_ciphertext,
        'encryption_version', version_row.encryption_version,
        'human_views', version_row.human_views,
        'epistemic_basis', version_row.epistemic_basis,
        'maturity', version_row.maturity,
        'standing', version_row.standing,
        'audience', version_row.audience,
        'consequence_permission', version_row.consequence_permission,
        'applicability', version_row.applicability,
        'exclusions', version_row.exclusions,
        'evidence_quality', version_row.evidence_quality,
        'corroboration', version_row.corroboration,
        'recency', version_row.recency,
        'transfer', version_row.transfer,
        'human_confirmation', version_row.human_confirmation,
        'valid_from', version_row.valid_from,
        'valid_until', version_row.valid_until,
        'predecessor_version_id', version_row.predecessor_version_id,
        'superseded_by_version_id', version_row.superseded_by_version_id,
        'recorded_at', version_row.recorded_at,
        'created_by', version_row.created_by
      ),
      version_row.version::text,
      version_row.recorded_at
    into authority_projection, authority_version, authority_recorded_at
    from public.brain_item_versions version_row
    where version_row.id = p_authority_record_id
      and version_row.workspace_id = p_workspace_id
      and version_row.subject_id = p_subject_id
      and version_row.audience = p_audience
      and version_row.standing in ('current', 'disputed')
      and version_row.valid_until is null
      and version_row.superseded_by_version_id is null
      and version_row.consequence_permission <> 'prohibited_in_context';
  elsif p_authority_kind = 'external_source_receipt' then
    select
      jsonb_build_object(
        'id', source_row.id,
        'workspace_id', source_row.workspace_id,
        'subject_id', source_row.subject_id,
        'source_type', source_row.source_type,
        'actor_user_id', source_row.actor_user_id,
        'speaker_label', source_row.speaker_label,
        'captured_at', source_row.captured_at,
        'purpose', source_row.purpose,
        'audience', source_row.audience,
        'retention_expires_at', source_row.retention_expires_at,
        'integrity_sha256', source_row.integrity_sha256,
        'external_locator', source_row.external_locator,
        'content_ciphertext', source_row.content_ciphertext,
        'encryption_version', source_row.encryption_version,
        'recorded_at', source_row.recorded_at,
        'created_by', source_row.created_by
      ),
      '1',
      source_row.recorded_at
    into authority_projection, authority_version, authority_recorded_at
    from public.brain_sources source_row
    where source_row.id = p_authority_record_id
      and source_row.workspace_id = p_workspace_id
      and source_row.subject_id = p_subject_id
      and source_row.audience = p_audience
      and source_row.source_type = 'external'
      and source_row.purpose = 'prepared_intelligence'
      and source_row.integrity_sha256 is not null
      and nullif(btrim(source_row.external_locator), '') is not null
      and (source_row.retention_expires_at is null or source_row.retention_expires_at > now());
  else
    return null;
  end if;

  if authority_projection is null then return null; end if;
  return jsonb_build_object(
    'authority_kind', p_authority_kind,
    'authority_record_id', p_authority_record_id,
    'authority_version', authority_version,
    'authority_sha256', private.brain_authority_row_sha256(p_authority_kind, authority_projection),
    'recorded_at', authority_recorded_at,
    'workspace_id', p_workspace_id,
    'custody_principal_id', p_custody_principal_id,
    'subject_id', p_subject_id,
    'audience', p_audience,
    'purpose', p_purpose
  );
end;
$$;

create or replace function private.brain_store_prepared_custody_receipt(
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
  custody_principal_id uuid;
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
  current_authority jsonb;
  existing public.brain_prepared_custody_receipts%rowtype;
  accepted_event_sha256 text;
begin
  if jsonb_typeof(p_receipt) <> 'object' then raise exception 'receipt_object_required'; end if;
  if (
    select count(*) <> 17
      or count(*) filter (where key = any(array[
        'schema_version', 'receipt_id', 'workspace_id', 'custody_principal_id', 'subject_id',
        'ingest_key', 'request_sha256', 'kind', 'audience', 'purpose', 'authority_fingerprint',
        'content_fingerprint', 'payload_ciphertext', 'encryption_version', 'produced_at', 'expires_at',
        'dependencies'
      ])) <> 17
    from jsonb_object_keys(p_receipt) as member(key)
  ) then raise exception 'receipt_shape_invalid'; end if;
  if p_receipt ->> 'schema_version' <> 'ctrl.prepared-intelligence-custody-envelope.r24' then
    raise exception 'receipt_schema_version_invalid';
  end if;
  if jsonb_typeof(p_dependencies) <> 'array' or jsonb_array_length(p_dependencies) = 0 then
    raise exception 'authority_dependencies_required';
  end if;
  if p_receipt -> 'dependencies' <> p_dependencies then
    raise exception 'receipt_dependencies_mismatch';
  end if;

  receipt_id := (p_receipt ->> 'receipt_id')::uuid;
  workspace_id := (p_receipt ->> 'workspace_id')::uuid;
  custody_principal_id := (p_receipt ->> 'custody_principal_id')::uuid;
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
    where workspace_row.id = workspace_id and workspace_row.subject_id = subject_id
  ) then raise exception 'receipt_workspace_scope_invalid'; end if;
  if not private.brain_prepared_custody_active(workspace_id, custody_principal_id) then
    raise exception 'receipt_custody_inactive';
  end if;
  if private.brain_prepared_subject_erased(workspace_id, subject_id) then
    raise exception 'prepared_subject_erased';
  end if;

  if exists (
    select 1 from public.brain_prepared_receipts legacy
    where legacy.id = receipt_id
      or (legacy.workspace_id = workspace_id and legacy.ingest_key = ingest_key)
  ) then raise exception 'receipt_identity_conflict'; end if;

  if (
    select count(*) <> count(distinct ((member.value ->> 'authority_kind') || ':' || (member.value ->> 'authority_record_id')))
    from jsonb_array_elements(p_dependencies) as member(value)
  ) then raise exception 'authority_dependency_duplicate'; end if;

  for dependency in select member.value from jsonb_array_elements(p_dependencies) as member(value)
  loop
    if jsonb_typeof(dependency) <> 'object' or (
      select count(*) <> 10
        or count(*) filter (where key = any(array[
          'authority_kind', 'authority_record_id', 'authority_version', 'authority_sha256',
          'observed_at', 'workspace_id', 'custody_principal_id', 'subject_id', 'audience', 'purpose'
        ])) <> 10
      from jsonb_object_keys(dependency) as member(key)
    ) then raise exception 'authority_dependency_shape_invalid'; end if;
    if dependency ->> 'workspace_id' <> workspace_id::text
      or dependency ->> 'custody_principal_id' <> custody_principal_id::text
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

  expected_authority_fingerprint := private.brain_prepared_custody_fingerprint(
    receipt_id, workspace_id, custody_principal_id, subject_id, audience, purpose, p_dependencies
  );
  if authority_fingerprint <> expected_authority_fingerprint then
    raise exception 'authority_fingerprint_mismatch';
  end if;

  select * into existing
  from public.brain_prepared_custody_receipts receipt_row
  where receipt_row.workspace_id = workspace_id and receipt_row.ingest_key = ingest_key;
  if found then
    if existing.id = receipt_id
      and existing.request_sha256 = request_sha256
      and existing.kind = receipt_kind
      and existing.custody_principal_id = custody_principal_id
      and existing.subject_id = subject_id
      and existing.audience = audience
      and existing.purpose = purpose
      and existing.authority_fingerprint = authority_fingerprint
      and existing.content_fingerprint = content_fingerprint
      and existing.payload_ciphertext = payload_ciphertext
      and existing.encryption_version = encryption_version
      and existing.produced_at = produced_at
      and existing.expires_at = expires_at
    then return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id); end if;
    raise exception 'receipt_identity_conflict';
  end if;
  if exists (select 1 from public.brain_prepared_custody_receipts row where row.id = receipt_id) then
    raise exception 'receipt_identity_conflict';
  end if;

  for dependency in select member.value from jsonb_array_elements(p_dependencies) as member(value)
  loop
    current_authority := private.brain_current_prepared_custody_authority(
      dependency ->> 'authority_kind',
      (dependency ->> 'authority_record_id')::uuid,
      workspace_id,
      custody_principal_id,
      subject_id,
      audience,
      purpose
    );
    if current_authority is null
      or current_authority ->> 'authority_version' <> dependency ->> 'authority_version'
      or current_authority ->> 'authority_sha256' <> dependency ->> 'authority_sha256'
      or (current_authority ->> 'recorded_at')::timestamptz > (dependency ->> 'observed_at')::timestamptz
    then raise exception 'authority_dependency_not_current'; end if;
  end loop;

  insert into public.brain_prepared_custody_receipts (
    id, schema_version, workspace_id, custody_principal_id, subject_id, ingest_key, request_sha256, kind,
    audience, purpose, authority_fingerprint, content_fingerprint, payload_ciphertext,
    encryption_version, produced_at, expires_at
  ) values (
    receipt_id, 'ctrl.prepared-intelligence-custody-envelope.r24', workspace_id,
    custody_principal_id, subject_id, ingest_key, request_sha256,
    receipt_kind, audience, purpose, authority_fingerprint, content_fingerprint,
    payload_ciphertext, encryption_version, produced_at, expires_at
  )
  on conflict on constraint brain_prepared_custody_receipts_workspace_id_ingest_key_key do nothing
  returning * into existing;

  if not found then
    select * into existing from public.brain_prepared_custody_receipts receipt_row
    where receipt_row.workspace_id = workspace_id and receipt_row.ingest_key = ingest_key;
    if existing.id = receipt_id
      and existing.request_sha256 = request_sha256
      and existing.kind = receipt_kind
      and existing.custody_principal_id = custody_principal_id
      and existing.subject_id = subject_id
      and existing.audience = audience
      and existing.purpose = purpose
      and existing.authority_fingerprint = authority_fingerprint
      and existing.content_fingerprint = content_fingerprint
      and existing.payload_ciphertext = payload_ciphertext
      and existing.encryption_version = encryption_version
      and existing.produced_at = produced_at
      and existing.expires_at = expires_at
    then return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id); end if;
    raise exception 'receipt_identity_conflict';
  end if;

  insert into public.brain_prepared_custody_receipt_dependencies (
    receipt_id, workspace_id, custody_principal_id, subject_id, audience, purpose,
    authority_kind, authority_record_id, authority_version, authority_sha256, observed_at
  ) select
    receipt_id, workspace_id, custody_principal_id, subject_id, audience, purpose,
    member.value ->> 'authority_kind',
    (member.value ->> 'authority_record_id')::uuid,
    member.value ->> 'authority_version',
    member.value ->> 'authority_sha256',
    (member.value ->> 'observed_at')::timestamptz
  from jsonb_array_elements(p_dependencies) as member(value);

  accepted_event_sha256 := encode(sha256(convert_to(
    'prepared-custody-receipt-accepted-r25' || chr(10) || receipt_id::text || chr(10)
      || request_sha256 || chr(10) || authority_fingerprint || chr(10) || content_fingerprint,
    'UTF8'
  )), 'hex');
  insert into public.brain_prepared_custody_receipt_events (
    event_id, receipt_id, event_type, event_sha256, occurred_at
  ) values (receipt_id, receipt_id, 'accepted', accepted_event_sha256, produced_at);

  return jsonb_build_object('status', 'created', 'receipt_id', receipt_id);
end;
$$;

create or replace function private.brain_prepared_legacy_cross_generation_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.brain_prepared_custody_receipts custody_row
    where custody_row.id = new.id
      or (custody_row.workspace_id = new.workspace_id and custody_row.ingest_key = new.ingest_key)
  ) then raise exception 'receipt_identity_conflict'; end if;
  return new;
end;
$$;

create trigger brain_prepared_legacy_cross_generation_guard
before insert on public.brain_prepared_receipts
for each row execute function private.brain_prepared_legacy_cross_generation_guard();

revoke all on table public.brain_prepared_custody_receipts from anon, authenticated;
revoke all on table public.brain_prepared_custody_receipt_dependencies from anon, authenticated;
revoke all on table public.brain_prepared_custody_receipt_events from anon, authenticated;
grant select on table public.brain_prepared_custody_receipts to authenticated;
grant select on table public.brain_prepared_custody_receipt_dependencies to authenticated;
grant select on table public.brain_prepared_custody_receipt_events to authenticated;
grant select, insert on table public.brain_prepared_custody_receipts to service_role;
grant select, insert on table public.brain_prepared_custody_receipt_dependencies to service_role;
grant select, insert on table public.brain_prepared_custody_receipt_events to service_role;

revoke all on function private.brain_prepared_custody_fingerprint(uuid, uuid, uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function private.brain_prepared_custody_active(uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.brain_current_prepared_custody_authority(text, uuid, uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function private.brain_store_prepared_custody_receipt(jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function private.brain_prepared_legacy_cross_generation_guard()
  from public, anon, authenticated;
grant execute on function private.brain_prepared_custody_fingerprint(uuid, uuid, uuid, uuid, text, text, jsonb)
  to service_role;
grant execute on function private.brain_prepared_custody_active(uuid, uuid) to service_role;
grant execute on function private.brain_current_prepared_custody_authority(text, uuid, uuid, uuid, uuid, text, text)
  to service_role;
grant execute on function private.brain_store_prepared_custody_receipt(jsonb, jsonb) to service_role;
