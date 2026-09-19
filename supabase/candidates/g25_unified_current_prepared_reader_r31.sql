-- G25 R31 unified current prepared-intelligence reader candidate.
-- This is a non-migration overlay for R10 through R30.
-- It must not be applied to a linked database.

create index brain_prepared_receipts_current_scope_r31_idx
  on public.brain_prepared_receipts
    (workspace_id, subject_id, audience, purpose, produced_at desc, expires_at, content_fingerprint, id)
  where invalidated_at is null and erased_at is null;

create index brain_prepared_custody_receipts_current_scope_r31_idx
  on public.brain_prepared_custody_receipts
    (workspace_id, custody_principal_id, subject_id, audience, purpose,
      produced_at desc, expires_at, content_fingerprint, id)
  where invalidated_at is null and erased_at is null;

create or replace function private.brain_read_current_prepared_intelligence(
  p_scope jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  workspace_id uuid;
  custody_principal_id uuid;
  subject_id uuid;
  audience text;
  purpose text;
  read_at timestamptz := statement_timestamp();
  current_items jsonb;
begin
  if jsonb_typeof(p_scope) <> 'object' then raise exception 'reader_scope_object_required'; end if;
  if (
    select count(*) <> 6
      or count(*) filter (where key = any(array[
        'schema_version', 'workspace_id', 'custody_principal_id',
        'subject_id', 'audience', 'purpose'
      ])) <> 6
    from jsonb_object_keys(p_scope) as member(key)
  ) then raise exception 'reader_scope_shape_invalid'; end if;
  if p_scope ->> 'schema_version'
    <> 'ctrl.prepared-intelligence-current-reader.r31'
  then raise exception 'reader_scope_schema_version_invalid'; end if;

  workspace_id := (p_scope ->> 'workspace_id')::uuid;
  custody_principal_id := (p_scope ->> 'custody_principal_id')::uuid;
  subject_id := (p_scope ->> 'subject_id')::uuid;
  audience := p_scope ->> 'audience';
  purpose := p_scope ->> 'purpose';

  if audience not in ('person_private', 'delivery_team_private') then
    raise exception 'reader_scope_audience_invalid';
  end if;
  if purpose <> 'prepared_intelligence' then raise exception 'reader_scope_purpose_invalid'; end if;

  if not exists (
    select 1
    from public.brain_workspaces workspace_row
    join private.brain_custody_principals custody_row
      on custody_row.workspace_id = workspace_row.id
    where workspace_row.id = workspace_id
      and workspace_row.subject_id = subject_id
      and custody_row.id = custody_principal_id
  ) then raise exception 'reader_stable_scope_invalid'; end if;
  if not private.brain_prepared_custody_active(workspace_id, custody_principal_id) then
    raise exception 'reader_custody_inactive';
  end if;

  if private.brain_prepared_subject_erased(workspace_id, subject_id) then
    return jsonb_build_object(
      'schema_version', 'ctrl.prepared-intelligence-current-reader.r31',
      'status', 'erased',
      'workspace_id', workspace_id,
      'custody_principal_id', custody_principal_id,
      'subject_id', subject_id,
      'audience', audience,
      'purpose', purpose,
      'item_count', 0,
      'items', '[]'::jsonb
    );
  end if;

  with eligible as (
    -- R31_GENERATION_LEGACY_BEGIN
    select
      legacy.id as receipt_id,
      'legacy'::text as generation,
      legacy.ingest_key,
      legacy.content_fingerprint,
      legacy.authority_fingerprint,
      legacy.payload_ciphertext,
      legacy.encryption_version,
      legacy.produced_at,
      legacy.expires_at
    from public.brain_prepared_receipts legacy
    where legacy.workspace_id = workspace_id
      and legacy.subject_id = subject_id
      and legacy.audience = audience
      and legacy.purpose = purpose
      and legacy.produced_at <= read_at
      and legacy.expires_at > read_at
      and legacy.invalidated_at is null
      and legacy.erased_at is null
      and legacy.payload_ciphertext is not null
      and legacy.encryption_version is not null
      and exists (
        select 1
        from public.brain_prepared_receipt_dependencies dependency_row
        where dependency_row.receipt_id = legacy.id
      )
      and not exists (
        select 1
        from public.brain_prepared_receipt_dependencies dependency_row
        where dependency_row.receipt_id = legacy.id
          and not private.brain_prepared_authority_current(
            dependency_row.authority_kind,
            dependency_row.authority_record_id,
            dependency_row.authority_version,
            dependency_row.authority_sha256,
            dependency_row.observed_at,
            workspace_id,
            legacy.owner_id,
            subject_id,
            audience,
            purpose
          )
      )
    -- R31_GENERATION_LEGACY_END

    union all

    -- R31_GENERATION_CUSTODY_BEGIN
    select
      custody.id as receipt_id,
      'custody'::text as generation,
      custody.ingest_key,
      custody.content_fingerprint,
      custody.authority_fingerprint,
      custody.payload_ciphertext,
      custody.encryption_version,
      custody.produced_at,
      custody.expires_at
    from public.brain_prepared_custody_receipts custody
    where custody.workspace_id = workspace_id
      and custody.custody_principal_id = custody_principal_id
      and custody.subject_id = subject_id
      and custody.audience = audience
      and custody.purpose = purpose
      and custody.produced_at <= read_at
      and custody.expires_at > read_at
      and custody.invalidated_at is null
      and custody.erased_at is null
      and custody.payload_ciphertext is not null
      and custody.encryption_version is not null
      and exists (
        select 1
        from public.brain_prepared_custody_receipt_dependencies dependency_row
        where dependency_row.receipt_id = custody.id
      )
      and not exists (
        select 1
        from public.brain_prepared_custody_receipt_dependencies dependency_row
        left join lateral (
          select private.brain_current_prepared_custody_authority(
            dependency_row.authority_kind,
            dependency_row.authority_record_id,
            workspace_id,
            custody_principal_id,
            subject_id,
            audience,
            purpose
          ) as authority
        ) current_row on true
        where dependency_row.receipt_id = custody.id
          and (
            current_row.authority is null
            or current_row.authority ->> 'authority_version'
              <> dependency_row.authority_version
            or current_row.authority ->> 'authority_sha256'
              <> dependency_row.authority_sha256
            or (current_row.authority ->> 'recorded_at')::timestamptz
              > dependency_row.observed_at
          )
      )
    -- R31_GENERATION_CUSTODY_END
  ), projected as (
    select
      eligible.receipt_id,
      eligible.content_fingerprint,
      eligible.produced_at,
      jsonb_build_object(
        'receipt_id', eligible.receipt_id,
        'generation', eligible.generation,
        'ingest_key', eligible.ingest_key,
        'content_fingerprint', eligible.content_fingerprint,
        'authority_fingerprint', eligible.authority_fingerprint,
        'payload_ciphertext', eligible.payload_ciphertext,
        'encryption_version', eligible.encryption_version,
        'produced_at', eligible.produced_at,
        'expires_at', eligible.expires_at
      ) as item
    from eligible
  )
  select coalesce(
    jsonb_agg(
      projected.item
      order by projected.produced_at desc,
        projected.content_fingerprint,
        projected.receipt_id
    ),
    '[]'::jsonb
  ) into current_items
  from projected;

  return jsonb_build_object(
    'schema_version', 'ctrl.prepared-intelligence-current-reader.r31',
    'status', case when jsonb_array_length(current_items) = 0 then 'empty' else 'current' end,
    'workspace_id', workspace_id,
    'custody_principal_id', custody_principal_id,
    'subject_id', subject_id,
    'audience', audience,
    'purpose', purpose,
    'item_count', jsonb_array_length(current_items),
    'items', current_items
  );
end;
$$;

revoke select on table public.brain_prepared_receipts from authenticated;
revoke select on table public.brain_prepared_receipt_dependencies from authenticated;
revoke select on table public.brain_prepared_receipt_events from authenticated;
revoke select on table public.brain_prepared_custody_receipts from authenticated;
revoke select on table public.brain_prepared_custody_receipt_dependencies from authenticated;
revoke select on table public.brain_prepared_custody_receipt_events from authenticated;

revoke all on function private.brain_read_current_prepared_intelligence(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_read_current_prepared_intelligence(jsonb)
  to service_role;
