begin;

create table if not exists public.portable_brain_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version text not null,
  package_fingerprint text not null,
  database_fingerprint text not null,
  imported_counts jsonb not null,
  created_at timestamptz not null default now(),
  constraint portable_brain_imports_package_fingerprint_check
    check (package_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint portable_brain_imports_database_fingerprint_check
    check (database_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint portable_brain_imports_user_database_fingerprint_key
    unique (user_id, database_fingerprint)
);

alter table public.portable_brain_imports enable row level security;

revoke all on table public.portable_brain_imports from public, anon, authenticated;
grant select on table public.portable_brain_imports to authenticated;
grant all on table public.portable_brain_imports to service_role;

drop policy if exists "Users can view own portable Brain imports" on public.portable_brain_imports;
create policy "Users can view own portable Brain imports"
  on public.portable_brain_imports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Service role manages portable Brain imports" on public.portable_brain_imports;
create policy "Service role manages portable Brain imports"
  on public.portable_brain_imports
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.import_portable_brain_package(p_package jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_records jsonb;
  v_package_fingerprint text;
  v_database_fingerprint text;
  v_receipt_id uuid;
  v_fact_count integer;
  v_pattern_count integer;
  v_decision_count integer;
  v_counts jsonb;
begin
  if v_user_id is null then
    raise exception 'portable_brain_auth_required' using errcode = '42501';
  end if;
  if p_package is null or jsonb_typeof(p_package) <> 'object' or pg_catalog.octet_length(p_package::text) > 1048576 then
    raise exception 'portable_brain_invalid' using errcode = '22023';
  end if;
  if p_package->>'schema_version' <> 'ctrl.portable-brain.v1' or p_package->>'scope' <> 'current_brain' then
    raise exception 'portable_brain_version_unsupported' using errcode = '22023';
  end if;

  v_records := p_package->'records';
  if jsonb_typeof(v_records) <> 'object'
     or jsonb_typeof(v_records->'facts') <> 'array'
     or jsonb_typeof(v_records->'patterns') <> 'array'
     or jsonb_typeof(v_records->'decisions') <> 'array' then
    raise exception 'portable_brain_records_invalid' using errcode = '22023';
  end if;

  v_fact_count := jsonb_array_length(v_records->'facts');
  v_pattern_count := jsonb_array_length(v_records->'patterns');
  v_decision_count := jsonb_array_length(v_records->'decisions');
  if v_fact_count > 500 or v_pattern_count > 250 or v_decision_count > 250 then
    raise exception 'portable_brain_record_limit' using errcode = '22023';
  end if;

  v_package_fingerprint := p_package->'manifest'->>'content_sha256';
  if v_package_fingerprint is null or v_package_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'portable_brain_fingerprint_invalid' using errcode = '22023';
  end if;
  if (p_package->'manifest'->'counts'->>'facts')::integer <> v_fact_count
     or (p_package->'manifest'->'counts'->>'patterns')::integer <> v_pattern_count
     or (p_package->'manifest'->'counts'->>'decisions')::integer <> v_decision_count
     or (p_package->'manifest'->'counts'->>'total')::integer <> v_fact_count + v_pattern_count + v_decision_count then
    raise exception 'portable_brain_counts_invalid' using errcode = '22023';
  end if;

  v_database_fingerprint := encode(
    extensions.digest(convert_to(v_records::text, 'UTF8'), 'sha256'),
    'hex'
  );
  v_counts := jsonb_build_object(
    'facts', v_fact_count,
    'patterns', v_pattern_count,
    'decisions', v_decision_count,
    'total', v_fact_count + v_pattern_count + v_decision_count
  );

  insert into public.portable_brain_imports (
    user_id, schema_version, package_fingerprint, database_fingerprint, imported_counts
  ) values (
    v_user_id, p_package->>'schema_version', v_package_fingerprint, v_database_fingerprint, v_counts
  )
  on conflict (user_id, database_fingerprint) do nothing
  returning id into v_receipt_id;

  if v_receipt_id is null then
    select id into v_receipt_id
      from public.portable_brain_imports
      where user_id = v_user_id and database_fingerprint = v_database_fingerprint;
    return jsonb_build_object(
      'receipt_id', v_receipt_id,
      'already_imported', true,
      'imported_counts', jsonb_build_object('facts', 0, 'patterns', 0, 'decisions', 0, 'total', 0),
      'source_counts', v_counts,
      'database_fingerprint', v_database_fingerprint
    );
  end if;

  insert into public.user_memory (
    user_id, fact_key, fact_category, fact_label, fact_value, fact_context,
    confidence_score, is_high_stakes, verification_status, source_type,
    is_current, temperature, tags, fact_subtype, importance, created_at
  )
  select
    v_user_id,
    item->'data'->>'fact_key',
    (item->'data'->>'fact_category')::public.fact_category,
    item->'data'->>'fact_label',
    item->'data'->>'fact_value',
    nullif(item->'data'->>'fact_context', ''),
    (item->'data'->>'confidence_score')::numeric,
    (item->'data'->>'is_high_stakes')::boolean,
    'inferred'::public.verification_status,
    'manual'::public.memory_source_type,
    true,
    item->'data'->>'temperature',
    array(
      select distinct tag
      from unnest(
        array(select jsonb_array_elements_text(coalesce(item->'data'->'tags', '[]'::jsonb)))
        || array[
          'portable-import',
          'portable-record:' || (item->>'record_key'),
          'portable-source:' || (item->'data'->>'source_type'),
          'portable-standing:' || (item->'data'->>'verification_status')
        ]
      ) as tag
      order by tag
    ),
    nullif(item->'data'->>'fact_subtype', ''),
    case when item->'data'->>'importance' is null then null else (item->'data'->>'importance')::smallint end,
    (item->'data'->>'created_at')::timestamptz
  from jsonb_array_elements(v_records->'facts') as item;

  insert into public.user_patterns (
    user_id, pattern_type, pattern_text, evidence_count, confidence, status,
    explanation, created_at
  )
  select
    v_user_id,
    item->'data'->>'pattern_type',
    item->'data'->>'pattern_text',
    1,
    least(0.50::numeric, (item->'data'->>'confidence')::numeric),
    'emerging',
    concat_ws(
      E'\n\n',
      nullif(item->'data'->>'explanation', ''),
      'Imported as an unconfirmed hypothesis from portable record ' || (item->>'record_key') || '.'
    ),
    (item->'data'->>'created_at')::timestamptz
  from jsonb_array_elements(v_records->'patterns') as item;

  insert into public.user_decisions (
    user_id, decision_text, rationale, context_snapshot, status, source, created_at
  )
  select
    v_user_id,
    item->'data'->>'decision_text',
    nullif(item->'data'->>'rationale', ''),
    jsonb_build_object(
      'portable_import', jsonb_build_object(
        'package_fingerprint', v_package_fingerprint,
        'record_key', item->>'record_key',
        'original_source', item->'data'->>'source'
      ),
      'source_context', coalesce(item->'data'->'context_snapshot', '{}'::jsonb)
    ),
    'active',
    'manual',
    (item->'data'->>'created_at')::timestamptz
  from jsonb_array_elements(v_records->'decisions') as item;

  return jsonb_build_object(
    'receipt_id', v_receipt_id,
    'already_imported', false,
    'imported_counts', v_counts,
    'source_counts', v_counts,
    'database_fingerprint', v_database_fingerprint
  );
end;
$$;

revoke all on function public.import_portable_brain_package(jsonb) from public, anon;
grant execute on function public.import_portable_brain_package(jsonb) to authenticated, service_role;

comment on table public.portable_brain_imports is
  'Owner-scoped idempotency receipts for portable current-Brain imports. Package content is not stored.';
comment on function public.import_portable_brain_package(jsonb) is
  'Atomically imports a validated current-Brain package into auth.uid(), degrading portable standing where evidence is not transferred.';

commit;
