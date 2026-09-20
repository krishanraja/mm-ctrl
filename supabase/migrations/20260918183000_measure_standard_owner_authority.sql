-- R113: owner-bound held-out measurement authority.
-- The Edge worker never receives the leader's hidden grade before every model
-- prediction is fixed. The database joins predictions to grades only inside
-- the atomic finalizer.

create table if not exists public.standard_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null unique references public.harness_runs(id) on delete cascade,
  standard_artifact_id uuid not null references public.generated_artifacts(id) on delete cascade,
  sort_run_id uuid not null references public.harness_runs(id) on delete cascade,
  surface text not null,
  source_snapshot text not null,
  item_results jsonb not null,
  confusion jsonb not null,
  metrics jsonb not null,
  held_out_graded integer not null,
  self_agreement jsonb not null,
  label text not null check (label in ('draft', 'provisional', 'verified')),
  created_at timestamptz not null default now()
);

create index if not exists standard_measurements_owner_artifact_created_idx
  on public.standard_measurements(user_id, standard_artifact_id, created_at desc);

alter table public.standard_measurements enable row level security;
drop policy if exists "owners read standard measurements" on public.standard_measurements;
create policy "owners read standard measurements"
  on public.standard_measurements for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete, truncate on public.standard_measurements from public, anon, authenticated;
grant select on public.standard_measurements to authenticated;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'measure_standard_rpc_secret') then
    perform vault.create_secret(encode(gen_random_bytes(48), 'hex'), 'measure_standard_rpc_secret');
  end if;
end $$;

create or replace function public.assert_measure_standard_capability(p_capability text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
declare v_expected text;
begin
  select decrypted_secret into v_expected
  from vault.decrypted_secrets
  where name = 'measure_standard_rpc_secret'
  limit 1;
  if v_expected is null or p_capability is null
     or length(p_capability) <> length(v_expected)
     or encode(extensions.digest(convert_to(p_capability, 'UTF8'), 'sha256'), 'hex') <>
        encode(extensions.digest(convert_to(v_expected, 'UTF8'), 'sha256'), 'hex') then
    raise exception 'measure_standard_capability_denied' using errcode = '42501';
  end if;
end;
$$;

-- One deterministic source document. It contains the hidden grades and is
-- hashed inside the database, but is never returned to the Edge evaluator.
create or replace function public.current_standard_measurement_source(
  p_user_id uuid,
  p_sort_run_id uuid,
  p_standard_artifact_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with target as (
    select si.id, si.position, si.surface, si.body, sg.verdict
    from public.sort_items si
    join public.sort_grades sg on sg.item_id = si.id and sg.user_id = p_user_id
    where si.user_id = p_user_id and si.session_id = p_sort_run_id
      and si.held_out = true and si.repeat_of is null
      and sg.verdict in ('send', 'would_not_send', 'skip')
    order by si.position, si.id
    limit 20
  ), training as (
    select si.id, si.position, si.surface, si.body, sg.verdict, sg.why, sg.created_at
    from public.sort_items si
    join public.sort_grades sg on sg.item_id = si.id and sg.user_id = p_user_id
    where si.user_id = p_user_id and si.held_out = false and si.repeat_of is null
      and sg.verdict in ('send', 'would_not_send')
    order by sg.created_at desc, si.id
    limit 80
  ), repeats as (
    select repeat_item.id, repeat_item.repeat_of,
           repeat_grade.verdict as repeated_verdict,
           original_grade.verdict as original_verdict
    from public.sort_items repeat_item
    join public.sort_grades repeat_grade on repeat_grade.item_id = repeat_item.id
      and repeat_grade.user_id = p_user_id
    join public.sort_grades original_grade on original_grade.item_id = repeat_item.repeat_of
      and original_grade.user_id = p_user_id
    where repeat_item.user_id = p_user_id and repeat_item.session_id = p_sort_run_id
      and repeat_item.repeat_of is not null
  )
  select jsonb_build_object(
    'sort', (select jsonb_build_object('id', r.id, 'surface', r.surface, 'status', r.status)
             from public.harness_runs r
             where r.id = p_sort_run_id and r.user_id = p_user_id and r.kind = 'sort'),
    'artifact', (select jsonb_build_object(
                    'id', a.id, 'body_sha256', encode(extensions.digest(convert_to(a.body, 'UTF8'), 'sha256'), 'hex'),
                    'sort_run_id', a.metadata->>'sort_run_id',
                    'criteria_version', a.metadata->'criteria_version',
                    'self_agreement', coalesce(a.metadata->'self_agreement', '{}'::jsonb)
                  )
                 from public.generated_artifacts a
                 where a.id = p_standard_artifact_id and a.user_id = p_user_id and a.kind = 'standard'),
    'criteria', coalesce((select jsonb_agg(jsonb_build_object(
                    'id', c.id, 'surface', c.surface, 'name', c.name, 'check_text', c.check_text,
                    'weight', c.weight, 'holds_example', c.holds_example,
                    'breaks_example', c.breaks_example, 'version', c.version
                  ) order by case c.weight when 'essential' then 1 when 'pitfall' then 2
                                           when 'important' then 3 else 4 end, c.id)
                 from public.criteria c
                 where c.user_id = p_user_id and c.is_current = true
                   and c.disposition <> 'retired' and c.disc_verdict = 'keep'
                   and c.surface = (select surface from public.harness_runs where id = p_sort_run_id)), '[]'::jsonb),
    'targets', coalesce((select jsonb_agg(to_jsonb(target) order by position, id) from target), '[]'::jsonb),
    'training', coalesce((select jsonb_agg(to_jsonb(training) order by created_at desc, id) from training), '[]'::jsonb),
    'repeats', coalesce((select jsonb_agg(to_jsonb(repeats) order by id) from repeats), '[]'::jsonb)
  );
$$;

create or replace function public.current_standard_measurement_source_snapshot(
  p_user_id uuid,
  p_sort_run_id uuid,
  p_standard_artifact_id uuid
)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select encode(extensions.digest(convert_to(public.current_standard_measurement_source(
    p_user_id, p_sort_run_id, p_standard_artifact_id
  )::text, 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function public.reserve_measure_standard_run(
  p_request_id text,
  p_request_fingerprint text,
  p_sort_run_id uuid,
  p_standard_artifact_id uuid,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.harness_runs%rowtype;
  v_sort public.harness_runs%rowtype;
  v_artifact public.generated_artifacts%rowtype;
  v_source jsonb;
  v_snapshot text;
  v_run_id uuid;
  v_daily_runs integer;
  v_daily_spend numeric;
  v_material jsonb;
begin
  perform public.assert_measure_standard_capability(p_capability);
  if v_user_id is null then raise exception 'measure_standard_auth_required' using errcode = '42501'; end if;
  if p_request_id is null or length(p_request_id) not between 16 and 120
     or p_request_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'measure_standard_invalid_request' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('measure-standard:' || v_user_id::text || ':' || p_request_id, 0));
  select * into v_existing from public.harness_runs
  where user_id = v_user_id and kind = 'measure' and request_id = p_request_id
  limit 1;
  if found then
    if v_existing.stage_detail->>'request_fingerprint' <> p_request_fingerprint then
      raise exception 'measure_standard_request_conflict' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'run_id', v_existing.id, 'stage', v_existing.stage, 'status', v_existing.status,
      'result', coalesce(v_existing.stage_detail->'result', '{}'::jsonb), 'idempotent', true
    );
  end if;

  select * into v_sort from public.harness_runs
  where id = p_sort_run_id and user_id = v_user_id and kind = 'sort' and status = 'done';
  if not found then raise exception 'measure_standard_sort_not_owned_or_ready' using errcode = '42501'; end if;
  select * into v_artifact from public.generated_artifacts
  where id = p_standard_artifact_id and user_id = v_user_id and kind = 'standard';
  if not found or v_artifact.metadata->>'sort_run_id' <> p_sort_run_id::text then
    raise exception 'measure_standard_artifact_not_owned_or_mismatched' using errcode = '42501';
  end if;

  v_source := public.current_standard_measurement_source(v_user_id, p_sort_run_id, p_standard_artifact_id);
  if jsonb_array_length(coalesce(v_source->'criteria', '[]'::jsonb)) = 0 then
    raise exception 'measure_standard_no_compiled_criteria' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(v_source->'targets', '[]'::jsonb)) = 0 then
    raise exception 'measure_standard_no_graded_holdout' using errcode = 'P0001';
  end if;
  v_snapshot := encode(extensions.digest(convert_to(v_source::text, 'UTF8'), 'sha256'), 'hex');

  select count(*)::integer into v_daily_runs from public.harness_runs
  where user_id = v_user_id and kind = 'measure' and created_at >= date_trunc('day', now());
  if v_daily_runs >= 2 then raise exception 'measure_standard_daily_run_limit' using errcode = 'P0001'; end if;
  select coalesce(sum(est_cost_usd), 0) into v_daily_spend from public.ai_usage_audit
  where user_id = v_user_id and created_at >= date_trunc('day', now());
  if v_daily_spend >= 10 then raise exception 'measure_standard_daily_spend_limit' using errcode = 'P0001'; end if;

  insert into public.harness_runs(user_id, kind, surface, status, stage, request_id, stage_detail)
  values (
    v_user_id, 'measure', v_sort.surface, 'running', 'reserved', p_request_id,
    jsonb_build_object(
      'request_fingerprint', p_request_fingerprint,
      'sort_run_id', p_sort_run_id,
      'standard_artifact_id', p_standard_artifact_id,
      'source_snapshot', v_snapshot,
      'target_count', jsonb_array_length(v_source->'targets'),
      'started_at', now()
    )
  ) returning id into v_run_id;

  -- Strip every human verdict before returning evaluation material. The hidden
  -- labels remain only in v_source inside this transaction and in canonical rows.
  v_material := jsonb_build_object(
    'surface', v_sort.surface,
    'criteria', v_source->'criteria',
    'targets', coalesce((select jsonb_agg(jsonb_build_object(
      'id', t->>'id', 'position', (t->>'position')::integer,
      'surface', t->>'surface', 'body', t->>'body'
    ) order by (t->>'position')::integer)
      from jsonb_array_elements(v_source->'targets') t
      where t->>'verdict' in ('send', 'would_not_send')), '[]'::jsonb),
    'training', v_source->'training'
  );
  return jsonb_build_object(
    'run_id', v_run_id, 'stage', 'reserved', 'status', 'running',
    'source_snapshot', v_snapshot, 'material', v_material, 'idempotent', false
  );
end;
$$;

create or replace function public.record_measure_standard_usage(
  p_run_id uuid,
  p_item_id uuid,
  p_provider text,
  p_model text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_total_tokens integer,
  p_latency_ms integer,
  p_est_cost_usd numeric,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_usage_id uuid;
  v_existing_id uuid;
  v_receipts integer;
  v_daily_spend numeric;
begin
  perform public.assert_measure_standard_capability(p_capability);
  if v_user_id is null then raise exception 'measure_standard_auth_required' using errcode = '42501'; end if;
  if not exists (select 1 from public.harness_runs where id = p_run_id and user_id = v_user_id and kind = 'measure' and status = 'running') then
    raise exception 'measure_standard_run_not_owned' using errcode = '42501';
  end if;
  if p_provider not in ('openai', 'gemini', 'unknown') or p_model is null or length(p_model) not between 1 and 160
     or coalesce(p_prompt_tokens, 0) < 0 or coalesce(p_prompt_tokens, 0) > 10000000
     or coalesce(p_completion_tokens, 0) < 0 or coalesce(p_completion_tokens, 0) > 10000000
     or coalesce(p_total_tokens, 0) < 0 or coalesce(p_total_tokens, 0) > 10000000
     or coalesce(p_latency_ms, 0) < 0 or coalesce(p_latency_ms, 0) > 600000
     or p_est_cost_usd is null or p_est_cost_usd < 0 or p_est_cost_usd > 5 then
    raise exception 'measure_standard_invalid_usage' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('measure-standard-usage:' || p_run_id::text, 0));
  select id into v_existing_id from public.ai_usage_audit
  where user_id = v_user_id and function_name = 'measure-standard'
    and metadata->>'run_id' = p_run_id::text and metadata->>'item_id' = p_item_id::text
  limit 1;
  if found then return jsonb_build_object('usage_id', v_existing_id, 'already_recorded', true); end if;
  select count(*)::integer into v_receipts from public.ai_usage_audit
  where user_id = v_user_id and function_name = 'measure-standard' and metadata->>'run_id' = p_run_id::text;
  if v_receipts >= 20 then raise exception 'measure_standard_usage_limit' using errcode = 'P0001'; end if;
  select coalesce(sum(est_cost_usd), 0) into v_daily_spend from public.ai_usage_audit
  where user_id = v_user_id and created_at >= date_trunc('day', now());
  if v_daily_spend + p_est_cost_usd > 10 then
    raise exception 'measure_standard_daily_spend_limit' using errcode = 'P0001';
  end if;
  insert into public.ai_usage_audit(
    user_id, function_name, provider, model, purpose, prompt_tokens,
    completion_tokens, total_tokens, latency_ms, status, est_cost_usd, metadata
  ) values (
    v_user_id, 'measure-standard', p_provider, p_model, 'held-out-standard',
    nullif(p_prompt_tokens, 0), nullif(p_completion_tokens, 0),
    nullif(p_total_tokens, 0), nullif(p_latency_ms, 0), 'ok', p_est_cost_usd,
    jsonb_build_object('run_id', p_run_id, 'item_id', p_item_id)
  ) returning id into v_usage_id;
  return jsonb_build_object('usage_id', v_usage_id, 'already_recorded', false);
end;
$$;

create or replace function public.advance_measure_standard_run(
  p_run_id uuid,
  p_stage text,
  p_stage_detail jsonb,
  p_capability text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid := auth.uid();
begin
  perform public.assert_measure_standard_capability(p_capability);
  if p_stage not in ('judging', 'finalizing') or jsonb_typeof(p_stage_detail) <> 'object' then
    raise exception 'measure_standard_invalid_stage' using errcode = '22023';
  end if;
  update public.harness_runs
  set stage = p_stage, stage_detail = stage_detail || p_stage_detail, updated_at = now()
  where id = p_run_id and user_id = v_user_id and kind = 'measure' and status = 'running';
  if not found then raise exception 'measure_standard_run_not_owned' using errcode = '42501'; end if;
end;
$$;

create or replace function public.finish_measure_standard_run(
  p_run_id uuid,
  p_predictions jsonb,
  p_capability text,
  p_force_failure boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.harness_runs%rowtype;
  v_source jsonb;
  v_snapshot text;
  v_prediction jsonb;
  v_target jsonb;
  v_results jsonb := '[]'::jsonb;
  v_seen uuid[] := '{}'::uuid[];
  v_item_id uuid;
  v_gate text;
  v_human text;
  v_tp integer := 0; v_fp integer := 0; v_fn integer := 0; v_tn integer := 0;
  v_skipped integer := 0; v_insufficient integer := 0; v_graded integer := 0;
  v_scored integer := 0;
  v_precision numeric; v_recall numeric; v_tnr numeric;
  v_agreement jsonb; v_matched integer := 0; v_total integer := 0;
  v_measured_label text := 'draft'; v_ceiling text := 'provisional'; v_label text := 'draft';
  v_result jsonb; v_measurement_id uuid;
  v_artifact_id uuid; v_sort_run_id uuid;
  v_exemplar text;
begin
  perform public.assert_measure_standard_capability(p_capability);
  if v_user_id is null then raise exception 'measure_standard_auth_required' using errcode = '42501'; end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'measure' for update;
  if not found then raise exception 'measure_standard_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' then return coalesce(v_run.stage_detail->'result', '{}'::jsonb) || jsonb_build_object('already_finalized', true); end if;
  if v_run.status <> 'running' then raise exception 'measure_standard_run_not_running' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_predictions) <> 'array' or jsonb_array_length(p_predictions) > 20 then
    raise exception 'measure_standard_invalid_predictions' using errcode = '22023';
  end if;

  v_artifact_id := (v_run.stage_detail->>'standard_artifact_id')::uuid;
  v_sort_run_id := (v_run.stage_detail->>'sort_run_id')::uuid;
  v_source := public.current_standard_measurement_source(v_user_id, v_sort_run_id, v_artifact_id);
  v_snapshot := encode(extensions.digest(convert_to(v_source::text, 'UTF8'), 'sha256'), 'hex');
  if v_snapshot <> v_run.stage_detail->>'source_snapshot' then
    raise exception 'measure_standard_source_changed' using errcode = '40001';
  end if;

  for v_prediction in select value from jsonb_array_elements(p_predictions)
  loop
    if jsonb_typeof(v_prediction) <> 'object'
       or (select array_agg(key order by key) from jsonb_object_keys(v_prediction) key)
          <> array['exemplar_ids','gate','item_id','scored_criteria']::text[]
       or (v_prediction->>'item_id') is null
       or (v_prediction->>'gate') not in ('holds','breaks','insufficient')
       or jsonb_typeof(v_prediction->'exemplar_ids') <> 'array'
       or jsonb_typeof(v_prediction->'scored_criteria') <> 'number'
       or (v_prediction->>'scored_criteria')::integer < 0
       or (v_prediction->>'scored_criteria')::integer > 7 then
      raise exception 'measure_standard_invalid_prediction' using errcode = '22023';
    end if;
    v_item_id := (v_prediction->>'item_id')::uuid;
    if v_item_id = any(v_seen) then raise exception 'measure_standard_duplicate_prediction' using errcode = '22023'; end if;
    v_seen := array_append(v_seen, v_item_id);
    select value into v_target from jsonb_array_elements(v_source->'targets')
      where value->>'id' = v_item_id::text and value->>'verdict' in ('send','would_not_send');
    if not found then raise exception 'measure_standard_unknown_target' using errcode = '22023'; end if;
    for v_exemplar in select jsonb_array_elements_text(v_prediction->'exemplar_ids')
    loop
      if not exists (select 1 from jsonb_array_elements(v_source->'training') t where t->>'id' = v_exemplar)
         or exists (select 1 from jsonb_array_elements(v_source->'targets') t where t->>'id' = v_exemplar) then
        raise exception 'measure_standard_exemplar_leak' using errcode = '22023';
      end if;
    end loop;
    if not exists (select 1 from public.ai_usage_audit u where u.user_id = v_user_id
       and u.function_name = 'measure-standard' and u.metadata->>'run_id' = p_run_id::text
       and u.metadata->>'item_id' = v_item_id::text)
       and v_prediction->>'gate' <> 'insufficient' then
      raise exception 'measure_standard_missing_usage_receipt' using errcode = 'P0001';
    end if;

    v_gate := v_prediction->>'gate';
    v_human := v_target->>'verdict';
    v_graded := v_graded + 1;
    if v_gate = 'insufficient' then v_insufficient := v_insufficient + 1;
    elsif v_human = 'would_not_send' and v_gate = 'breaks' then v_tp := v_tp + 1;
    elsif v_human = 'send' and v_gate = 'breaks' then v_fp := v_fp + 1;
    elsif v_human = 'would_not_send' and v_gate = 'holds' then v_fn := v_fn + 1;
    elsif v_human = 'send' and v_gate = 'holds' then v_tn := v_tn + 1;
    end if;
    v_results := v_results || jsonb_build_array(v_prediction || jsonb_build_object('human', v_human));
  end loop;

  if cardinality(v_seen) <> (select count(*) from jsonb_array_elements(v_source->'targets') t where t->>'verdict' in ('send','would_not_send')) then
    raise exception 'measure_standard_incomplete_predictions' using errcode = '22023';
  end if;
  select count(*) into v_skipped from jsonb_array_elements(v_source->'targets') t where t->>'verdict' = 'skip';
  v_scored := v_tp + v_fp + v_fn + v_tn;
  v_precision := case when v_tp + v_fp > 0 then round(v_tp::numeric / (v_tp + v_fp), 6) else null end;
  v_recall := case when v_tp + v_fn > 0 then round(v_tp::numeric / (v_tp + v_fn), 6) else null end;
  v_tnr := case when v_tn + v_fp > 0 then round(v_tn::numeric / (v_tn + v_fp), 6) else null end;

  v_agreement := coalesce(v_source->'artifact'->'self_agreement', '{}'::jsonb);
  v_matched := greatest(coalesce((v_agreement->>'matched')::integer, 0), 0);
  v_total := greatest(coalesce((v_agreement->>'total')::integer, 0), 0);
  if v_total >= 3 and v_matched = v_total then v_ceiling := 'verified';
  elsif v_total >= 3 and v_matched::numeric / nullif(v_total, 0) <= (1::numeric / 3) then v_ceiling := 'draft';
  else v_ceiling := 'provisional'; end if;

  if v_precision is null or v_scored = 0 then v_measured_label := 'draft';
  elsif v_scored >= 10 and v_precision >= 0.8 and v_recall is not null and v_recall >= 0.8 then v_measured_label := 'verified';
  elsif v_precision >= 0.6 then v_measured_label := 'provisional';
  else v_measured_label := 'draft'; end if;
  v_label := case
    when v_measured_label = 'draft' or v_ceiling = 'draft' then 'draft'
    when v_measured_label = 'provisional' or v_ceiling = 'provisional' then 'provisional'
    else 'verified' end;

  v_result := jsonb_build_object(
    'run_id', p_run_id, 'standard_artifact_id', v_artifact_id, 'sort_run_id', v_sort_run_id,
    'source_snapshot', v_snapshot, 'held_out_graded', v_graded,
    'scored_held_out', v_scored,
    'confusion', jsonb_build_object('tp', v_tp, 'fp', v_fp, 'fn', v_fn, 'tn', v_tn,
      'excluded', jsonb_build_object('skipped', v_skipped, 'insufficient', v_insufficient,
        'total', v_skipped + v_insufficient)),
    'metrics', jsonb_build_object('precision', v_precision, 'recall', v_recall, 'tnr', v_tnr, 'n', v_scored),
    'self_agreement', jsonb_build_object('matched', v_matched, 'total', v_total),
    'label', v_label, 'measured_at', now(), 'items', v_results
  );

  insert into public.standard_measurements(
    user_id, run_id, standard_artifact_id, sort_run_id, surface, source_snapshot,
    item_results, confusion, metrics, held_out_graded, self_agreement, label
  ) values (
    v_user_id, p_run_id, v_artifact_id, v_sort_run_id, v_run.surface, v_snapshot,
    v_results, v_result->'confusion', v_result->'metrics', v_graded,
    v_result->'self_agreement', v_label
  ) returning id into v_measurement_id;

  if p_force_failure then raise exception 'measure_standard_forced_failure' using errcode = 'P0001'; end if;

  update public.generated_artifacts
  set metadata = metadata || jsonb_build_object(
    'measurement_id', v_measurement_id, 'measurement_run_id', p_run_id,
    'held_out_graded', v_graded, 'scored_held_out', v_scored,
    'precision', v_precision, 'recall', v_recall, 'tnr', v_tnr,
    'confusion', v_result->'confusion', 'measurement', v_result->'metrics',
    'self_agreement', v_result->'self_agreement', 'label', v_label, 'measured_at', now(),
    'release_reason', null
  )
  where id = v_artifact_id and user_id = v_user_id;

  update public.harness_runs
  set status = 'done', stage = 'ready', error = null,
      stage_detail = stage_detail || jsonb_build_object('result', v_result, 'finished_at', now()),
      updated_at = now()
  where id = p_run_id;
  return v_result || jsonb_build_object('measurement_id', v_measurement_id, 'already_finalized', false);
end;
$$;

create or replace function public.fail_measure_standard_run(
  p_run_id uuid,
  p_error text,
  p_capability text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid := auth.uid();
begin
  perform public.assert_measure_standard_capability(p_capability);
  update public.harness_runs
  set status = 'failed', stage = 'failed', error = left(coalesce(p_error, 'measurement_failed'), 1000),
      stage_detail = stage_detail || jsonb_build_object('failed_at', now()), updated_at = now()
  where id = p_run_id and user_id = v_user_id and kind = 'measure' and status = 'running';
end;
$$;

revoke all on function public.assert_measure_standard_capability(text) from public, anon, authenticated;
revoke all on function public.current_standard_measurement_source(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.current_standard_measurement_source_snapshot(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.reserve_measure_standard_run(text, text, uuid, uuid, text) from public, anon;
revoke all on function public.record_measure_standard_usage(uuid, uuid, text, text, integer, integer, integer, integer, numeric, text) from public, anon;
revoke all on function public.advance_measure_standard_run(uuid, text, jsonb, text) from public, anon;
revoke all on function public.finish_measure_standard_run(uuid, jsonb, text, boolean) from public, anon;
revoke all on function public.fail_measure_standard_run(uuid, text, text) from public, anon;

grant execute on function public.reserve_measure_standard_run(text, text, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.record_measure_standard_usage(uuid, uuid, text, text, integer, integer, integer, integer, numeric, text) to authenticated, service_role;
grant execute on function public.advance_measure_standard_run(uuid, text, jsonb, text) to authenticated, service_role;
grant execute on function public.finish_measure_standard_run(uuid, jsonb, text, boolean) to authenticated, service_role;
grant execute on function public.fail_measure_standard_run(uuid, text, text) to authenticated, service_role;
