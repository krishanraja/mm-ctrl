begin;

create table if not exists public.brain_ingestion_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_fingerprint text not null,
  source_id uuid references public.evidence_sources(id) on delete set null,
  source_counts jsonb not null,
  evidence_ids uuid[] not null default '{}',
  construct_ids uuid[] not null default '{}',
  supersedes_receipt_id uuid references public.brain_ingestion_receipts(id) on delete set null,
  superseded_at timestamptz,
  superseded_by_receipt_id uuid references public.brain_ingestion_receipts(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint brain_ingestion_receipts_fingerprint_check
    check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint brain_ingestion_receipts_counts_check
    check (jsonb_typeof(source_counts) = 'object'),
  constraint brain_ingestion_receipts_supersession_check
    check (
      (superseded_at is null and superseded_by_receipt_id is null)
      or superseded_at is not null
    )
);

create unique index if not exists brain_ingestion_receipts_one_active_per_user
  on public.brain_ingestion_receipts(user_id)
  where superseded_at is null;

create index if not exists brain_ingestion_receipts_user_history
  on public.brain_ingestion_receipts(user_id, created_at desc);

alter table public.brain_ingestion_receipts enable row level security;

revoke all on table public.brain_ingestion_receipts from public, anon, authenticated;
grant select on table public.brain_ingestion_receipts to authenticated;
grant all on table public.brain_ingestion_receipts to service_role;

drop policy if exists "Users can view own Brain ingestion receipts" on public.brain_ingestion_receipts;
create policy "Users can view own Brain ingestion receipts"
  on public.brain_ingestion_receipts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Service role manages Brain ingestion receipts" on public.brain_ingestion_receipts;
create policy "Service role manages Brain ingestion receipts"
  on public.brain_ingestion_receipts
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.ingest_brain_atomic(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_source jsonb;
  v_items jsonb;
  v_item jsonb;
  v_source_kind text;
  v_source_label text;
  v_source_body text;
  v_source_ref text;
  v_quote text;
  v_emergent_pole text;
  v_situation text;
  v_memory_fact_id uuid;
  v_decision_id uuid;
  v_current_quote text;
  v_current_pole text;
  v_quote_start integer;
  v_quote_end integer;
  v_facts_used integer;
  v_decisions_used integer;
  v_skipped integer;
  v_item_count integer;
  v_seen_fact_count integer := 0;
  v_seen_decision_count integer := 0;
  v_seen_refs text[] := '{}';
  v_input_fingerprint text;
  v_active public.brain_ingestion_receipts%rowtype;
  v_receipt_id uuid := gen_random_uuid();
  v_source_id uuid;
  v_evidence_id uuid;
  v_construct_id uuid;
  v_evidence_ids uuid[] := '{}';
  v_construct_ids uuid[] := '{}';
  v_groups jsonb := '{}'::jsonb;
  v_group record;
  v_counts jsonb;
begin
  if v_user_id is null then
    raise exception 'brain_ingest_auth_required' using errcode = '42501';
  end if;
  if p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or pg_catalog.octet_length(p_payload::text) > 262144
     or (select count(*) from jsonb_object_keys(p_payload)) <> 6
     or not (p_payload ?& array[
       'schema_version', 'source', 'items', 'facts_used', 'decisions_used', 'skipped'
     ]) then
    raise exception 'brain_ingest_invalid:payload' using errcode = '22023';
  end if;
  if p_payload->>'schema_version' <> 'ctrl.brain-ingest.v1' then
    raise exception 'brain_ingest_invalid:version' using errcode = '22023';
  end if;

  v_source := p_payload->'source';
  v_items := p_payload->'items';
  if jsonb_typeof(v_source) <> 'object'
     or (select count(*) from jsonb_object_keys(v_source)) <> 3
     or not (v_source ?& array['kind', 'label', 'body'])
     or jsonb_typeof(v_items) <> 'array' then
    raise exception 'brain_ingest_invalid:shape' using errcode = '22023';
  end if;

  begin
    v_facts_used := (p_payload->>'facts_used')::integer;
    v_decisions_used := (p_payload->>'decisions_used')::integer;
    v_skipped := (p_payload->>'skipped')::integer;
  exception when others then
    raise exception 'brain_ingest_invalid:counts' using errcode = '22023';
  end;
  v_item_count := jsonb_array_length(v_items);
  if v_item_count < 1 or v_item_count > 70
     or v_facts_used < 0 or v_decisions_used < 0 or v_skipped < 0
     or v_facts_used + v_decisions_used <> v_item_count then
    raise exception 'brain_ingest_invalid:counts' using errcode = '22023';
  end if;

  v_source_kind := v_source->>'kind';
  v_source_label := v_source->>'label';
  v_source_body := v_source->>'body';
  if v_source_kind <> 'artefact'
     or v_source_label is null or pg_catalog.length(v_source_label) < 1 or pg_catalog.length(v_source_label) > 200
     or v_source_body is null or pg_catalog.length(v_source_body) < 1 or pg_catalog.length(v_source_body) > 60000 then
    raise exception 'brain_ingest_invalid:source' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
       or (select count(*) from jsonb_object_keys(v_item)) <> 12
       or not (v_item ?& array[
         'kind', 'body', 'quote', 'quote_start', 'quote_end', 'source_label',
         'source_ref', 'situated', 'situation', 'speaker_is_owner',
         'memory_fact_id', 'emergent_pole'
       ]) then
      raise exception 'brain_ingest_invalid:item_shape' using errcode = '22023';
    end if;

    v_source_ref := v_item->>'source_ref';
    v_quote := v_item->>'quote';
    v_emergent_pole := v_item->>'emergent_pole';
    v_situation := v_item->>'situation';
    begin
      v_quote_start := (v_item->>'quote_start')::integer;
      v_quote_end := (v_item->>'quote_end')::integer;
    exception when others then
      raise exception 'brain_ingest_invalid:offsets' using errcode = '22023';
    end;

    if v_item->>'kind' <> 'declared'
       or v_item->>'body' is distinct from v_quote
       or v_item->>'source_label' is distinct from v_source_label
       or v_item->'situated' <> 'true'::jsonb
       or v_item->'speaker_is_owner' <> 'true'::jsonb
       or v_source_ref is null or pg_catalog.length(v_source_ref) > 80
       or v_quote is null or pg_catalog.length(v_quote) < 1 or pg_catalog.length(v_quote) > 10000
       or v_emergent_pole is null or pg_catalog.length(v_emergent_pole) < 1 or pg_catalog.length(v_emergent_pole) > 200
       or v_situation is null or pg_catalog.length(v_situation) < 1 or pg_catalog.length(v_situation) > 500
       or v_quote_start < 0 or v_quote_end <= v_quote_start
       or v_quote_end > pg_catalog.octet_length(v_source_body)
       or pg_catalog.strpos(v_source_body, v_quote) < 1
       or v_source_ref = any(v_seen_refs) then
      raise exception 'brain_ingest_invalid:item' using errcode = '22023';
    end if;
    v_seen_refs := array_append(v_seen_refs, v_source_ref);

    if jsonb_typeof(v_item->'memory_fact_id') <> 'null' then
      begin
        v_memory_fact_id := (v_item->>'memory_fact_id')::uuid;
      exception when others then
        raise exception 'brain_ingest_invalid:memory_reference' using errcode = '22023';
      end;
      if v_source_ref <> 'user_memory:' || v_memory_fact_id::text then
        raise exception 'brain_ingest_invalid:memory_reference' using errcode = '22023';
      end if;
      select
        pg_catalog.btrim(fact_value),
        pg_catalog.btrim(coalesce(nullif(fact_label, ''), fact_category::text, 'About them'))
      into v_current_quote, v_current_pole
      from public.user_memory
      where id = v_memory_fact_id
        and user_id = v_user_id
        and is_current = true
        and verification_status::text not in ('rejected', 'disputed')
        and (confidence_score is null or confidence_score >= 0.4);
      if not found
         or v_current_quote is distinct from v_quote
         or v_current_pole is distinct from v_emergent_pole then
        raise exception 'brain_ingest_stale_input:memory' using errcode = 'P0001';
      end if;
      v_seen_fact_count := v_seen_fact_count + 1;
    else
      v_memory_fact_id := null;
      if v_source_ref !~ '^decision_case:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        raise exception 'brain_ingest_invalid:decision_reference' using errcode = '22023';
      end if;
      begin
        v_decision_id := pg_catalog.substr(v_source_ref, 15)::uuid;
      exception when others then
        raise exception 'brain_ingest_invalid:decision_reference' using errcode = '22023';
      end;
      select pg_catalog.btrim(statement)
      into v_current_quote
      from public.decision_cases
      where id = v_decision_id and user_id = v_user_id;
      if not found
         or v_current_quote is distinct from v_quote
         or v_emergent_pole <> 'What they choose to weigh' then
        raise exception 'brain_ingest_stale_input:decision' using errcode = 'P0001';
      end if;
      v_seen_decision_count := v_seen_decision_count + 1;
    end if;
  end loop;

  if v_seen_fact_count <> v_facts_used or v_seen_decision_count <> v_decisions_used then
    raise exception 'brain_ingest_invalid:count_mismatch' using errcode = '22023';
  end if;

  v_input_fingerprint := encode(
    extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'),
    'hex'
  );
  v_counts := jsonb_build_object(
    'facts', v_facts_used,
    'decisions', v_decisions_used,
    'evidence', v_item_count,
    'skipped', v_skipped
  );

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select * into v_active
  from public.brain_ingestion_receipts
  where user_id = v_user_id and superseded_at is null
  for update;

  if found and v_active.input_fingerprint = v_input_fingerprint then
    return jsonb_build_object(
      'receipt_id', v_active.id,
      'source_id', v_active.source_id,
      'input_fingerprint', v_active.input_fingerprint,
      'already_ingested', true,
      'facts_used', (v_active.source_counts->>'facts')::integer,
      'decisions_used', (v_active.source_counts->>'decisions')::integer,
      'evidence', coalesce(array_length(v_active.evidence_ids, 1), 0),
      'constructs', coalesce(array_length(v_active.construct_ids, 1), 0),
      'skipped', (v_active.source_counts->>'skipped')::integer,
      'superseded_receipt_id', v_active.supersedes_receipt_id
    );
  end if;

  if found then
    update public.constructs
      set status = 'retired', updated_at = now()
      where user_id = v_user_id
        and id = any(v_active.construct_ids)
        and status = 'candidate';
    update public.brain_ingestion_receipts
      set superseded_at = now()
      where id = v_active.id;
  end if;

  insert into public.evidence_sources(id, user_id, kind, label, body)
  values (gen_random_uuid(), v_user_id, v_source_kind, v_source_label, v_source_body)
  returning id into v_source_id;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    v_source_ref := v_item->>'source_ref';
    v_emergent_pole := v_item->>'emergent_pole';
    v_memory_fact_id := case
      when jsonb_typeof(v_item->'memory_fact_id') = 'null' then null
      else (v_item->>'memory_fact_id')::uuid
    end;
    insert into public.evidence(
      id, user_id, kind, body, quote, source_id, quote_start, quote_end,
      source_label, source_ref, situated, situation, speaker_is_owner,
      memory_fact_id
    ) values (
      gen_random_uuid(), v_user_id, 'declared', v_item->>'body', v_item->>'quote',
      v_source_id, (v_item->>'quote_start')::integer, (v_item->>'quote_end')::integer,
      v_source_label, v_source_ref, true, v_item->>'situation', true,
      v_memory_fact_id
    ) returning id into v_evidence_id;
    v_evidence_ids := array_append(v_evidence_ids, v_evidence_id);
    v_groups := jsonb_set(
      v_groups,
      array[v_emergent_pole],
      coalesce(v_groups->v_emergent_pole, '[]'::jsonb) || jsonb_build_array(v_evidence_id::text),
      true
    );
  end loop;

  for v_group in select key, value from jsonb_each(v_groups)
  loop
    insert into public.constructs(
      id, user_id, scope, status, emergent_pole, evidence_ids
    ) values (
      gen_random_uuid(), v_user_id, 'person', 'candidate', v_group.key,
      array(select value::uuid from jsonb_array_elements_text(v_group.value))
    ) returning id into v_construct_id;
    v_construct_ids := array_append(v_construct_ids, v_construct_id);
  end loop;

  insert into public.brain_ingestion_receipts(
    id, user_id, input_fingerprint, source_id, source_counts,
    evidence_ids, construct_ids, supersedes_receipt_id
  ) values (
    v_receipt_id, v_user_id, v_input_fingerprint, v_source_id, v_counts,
    v_evidence_ids, v_construct_ids, case when v_active.id is null then null else v_active.id end
  );

  if v_active.id is not null then
    update public.brain_ingestion_receipts
      set superseded_by_receipt_id = v_receipt_id
      where id = v_active.id;
  end if;

  return jsonb_build_object(
    'receipt_id', v_receipt_id,
    'source_id', v_source_id,
    'input_fingerprint', v_input_fingerprint,
    'already_ingested', false,
    'facts_used', v_facts_used,
    'decisions_used', v_decisions_used,
    'evidence', coalesce(array_length(v_evidence_ids, 1), 0),
    'constructs', coalesce(array_length(v_construct_ids, 1), 0),
    'skipped', v_skipped,
    'superseded_receipt_id', case when v_active.id is null then null else v_active.id end
  );
end;
$$;

revoke all on function public.ingest_brain_atomic(jsonb) from public, anon;
grant execute on function public.ingest_brain_atomic(jsonb) to authenticated, service_role;

comment on table public.brain_ingestion_receipts is
  'Owner-scoped receipts for atomic, retry-safe staging of current Brain material.';
comment on function public.ingest_brain_atomic(jsonb) is
  'Revalidates current owner data, then atomically stages candidate evidence and supersedes stale candidates.';

commit;
