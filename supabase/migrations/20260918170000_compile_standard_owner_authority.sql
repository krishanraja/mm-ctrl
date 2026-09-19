begin;

revoke insert, update, delete, truncate on public.sort_grades from anon, authenticated;
revoke insert, update, delete, truncate on public.criteria from anon, authenticated;

drop function if exists public.reserve_compile_standard_run(text, text, uuid, jsonb);
drop function if exists public.advance_compile_standard_run(uuid, text, jsonb);
drop function if exists public.record_compile_standard_usage(uuid, text, text, integer, integer, integer, integer, numeric);
drop function if exists public.finish_compile_standard_run(uuid, text, text, jsonb, text);
drop function if exists public.finalize_compile_standard_run(uuid, uuid, jsonb, jsonb, jsonb, jsonb);

create or replace function public.assert_compile_standard_capability(p_capability text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
begin
  if p_capability is null or length(p_capability) < 32 or not exists (
    select 1 from vault.decrypted_secrets
    where name = 'compile_standard_rpc_secret' and decrypted_secret = p_capability
  ) then
    raise exception 'compile_standard_capability_required' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.assert_compile_standard_capability(text) from public, anon, authenticated;

create or replace function public.reserve_compile_standard_run(
  p_request_id text,
  p_request_fingerprint text,
  p_sort_run_id uuid,
  p_thresholds jsonb,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sort public.harness_runs%rowtype;
  v_existing public.harness_runs%rowtype;
  v_item_count integer;
  v_grade_count integer;
  v_receipted_count integer;
  v_daily_runs integer;
  v_spent numeric;
  v_snapshot jsonb;
  v_snapshot_sha text;
  v_version integer;
  v_run_id uuid;
begin
  perform public.assert_compile_standard_capability(p_capability);
  if v_user_id is null then
    raise exception 'compile_standard_auth_required' using errcode = '42501';
  end if;
  if p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or p_request_fingerprint is null or p_request_fingerprint !~ '^[a-f0-9]{64}$'
     or p_sort_run_id is null
     or p_thresholds is null or jsonb_typeof(p_thresholds) <> 'object'
     or octet_length(p_thresholds::text) > 4096 then
    raise exception 'compile_standard_invalid_reservation' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('compile-standard:' || v_user_id::text, 0));
  select * into v_existing
  from public.harness_runs
  where user_id = v_user_id and kind = 'compile' and request_id = p_request_id
  limit 1;
  if found then
    if v_existing.stage_detail->>'request_fingerprint' is distinct from p_request_fingerprint then
      raise exception 'compile_standard_request_conflict' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'run_id', v_existing.id,
      'surface', v_existing.surface,
      'criteria_version', (v_existing.stage_detail->>'criteria_version')::integer,
      'stage', v_existing.stage,
      'status', v_existing.status,
      'idempotent', true
    );
  end if;

  select * into v_sort
  from public.harness_runs
  where id = p_sort_run_id and user_id = v_user_id and kind = 'sort'
  for share;
  if not found then
    raise exception 'compile_standard_sort_not_owned' using errcode = '42501';
  end if;
  if v_sort.status <> 'done' or v_sort.stage <> 'ready' then
    raise exception 'compile_standard_sort_not_ready' using errcode = 'P0001';
  end if;

  select
    count(*)::integer,
    count(g.id)::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'item_id', i.id,
      'position', i.position,
      'verdict', g.verdict,
      'why', g.why,
      'ms_to_grade', g.ms_to_grade
    ) order by i.position) filter (where i.id is not null), '[]'::jsonb)
  into v_item_count, v_grade_count, v_snapshot
  from public.sort_items i
  left join public.sort_grades g on g.item_id = i.id and g.user_id = v_user_id
  where i.session_id = p_sort_run_id and i.user_id = v_user_id;
  if v_item_count < 1 or v_grade_count <> v_item_count then
    raise exception 'compile_standard_incomplete_grades' using errcode = 'P0001';
  end if;
  select count(distinct r.item_id)::integer into v_receipted_count
  from public.sort_grade_submission_receipts r
  where r.user_id = v_user_id and r.run_id = p_sort_run_id;
  if v_receipted_count <> v_item_count then
    raise exception 'compile_standard_unreceipted_grades' using errcode = 'P0001';
  end if;
  v_snapshot_sha := encode(
    extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'),
    'hex'
  );

  select * into v_existing
  from public.harness_runs
  where user_id = v_user_id
    and kind = 'compile'
    and status <> 'failed'
    and stage_detail->>'sort_run_id' = p_sort_run_id::text
    and stage_detail->>'grade_snapshot_sha256' = v_snapshot_sha
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'run_id', v_existing.id,
      'surface', v_existing.surface,
      'criteria_version', (v_existing.stage_detail->>'criteria_version')::integer,
      'stage', v_existing.stage,
      'status', v_existing.status,
      'idempotent', true
    );
  end if;
  if exists (
    select 1 from public.harness_runs
    where user_id = v_user_id and kind = 'compile' and status = 'running' and surface = v_sort.surface
  ) then
    raise exception 'compile_standard_surface_busy' using errcode = 'P0001';
  end if;

  select count(*)::integer into v_daily_runs
  from public.harness_runs
  where user_id = v_user_id and kind = 'compile' and created_at >= date_trunc('day', now());
  select coalesce(sum(est_cost_usd), 0) into v_spent
  from public.ai_usage_audit
  where user_id = v_user_id and created_at >= date_trunc('day', now());
  if v_daily_runs >= 5 then
    raise exception 'compile_standard_daily_run_limit' using errcode = 'P0001';
  end if;
  if v_spent >= 2.00 then
    raise exception 'compile_standard_daily_spend_limit' using errcode = 'P0001';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.criteria
  where user_id = v_user_id and surface = v_sort.surface;
  insert into public.harness_runs(
    user_id, kind, surface, status, stage, request_id, stage_detail
  ) values (
    v_user_id,
    'compile',
    v_sort.surface,
    'running',
    'loading',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_fingerprint', p_request_fingerprint,
      'sort_run_id', p_sort_run_id,
      'grade_snapshot_sha256', v_snapshot_sha,
      'grade_count', v_grade_count,
      'criteria_version', v_version,
      'thresholds', p_thresholds
    )
  ) returning id into v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'surface', v_sort.surface,
    'criteria_version', v_version,
    'stage', 'loading',
    'status', 'running',
    'idempotent', false
  );
end;
$$;

create or replace function public.advance_compile_standard_run(
  p_run_id uuid,
  p_stage text,
  p_stage_detail jsonb,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.harness_runs%rowtype;
begin
  perform public.assert_compile_standard_capability(p_capability);
  if v_user_id is null then raise exception 'compile_standard_auth_required' using errcode = '42501'; end if;
  if p_stage not in ('probing', 'clustering', 'writing')
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 524288 then
    raise exception 'compile_standard_invalid_stage' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'compile'
  for update;
  if not found then raise exception 'compile_standard_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then raise exception 'compile_standard_run_not_running' using errcode = 'P0001'; end if;
  if not (
    (v_run.stage = 'loading' and p_stage = 'probing')
    or (v_run.stage = 'probing' and p_stage in ('probing', 'clustering'))
    or (v_run.stage = 'clustering' and p_stage in ('clustering', 'writing'))
    or (v_run.stage = 'writing' and p_stage = 'writing')
  ) then
    raise exception 'compile_standard_invalid_transition' using errcode = 'P0001';
  end if;
  update public.harness_runs
  set stage = p_stage, stage_detail = p_stage_detail, updated_at = now()
  where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'stage', p_stage);
end;
$$;

create or replace function public.record_compile_standard_usage(
  p_run_id uuid,
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
  v_existing_id uuid;
  v_usage_id uuid;
begin
  perform public.assert_compile_standard_capability(p_capability);
  if v_user_id is null then raise exception 'compile_standard_auth_required' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.harness_runs
    where id = p_run_id and user_id = v_user_id and kind = 'compile' and status = 'running'
  ) then
    raise exception 'compile_standard_run_not_owned' using errcode = '42501';
  end if;
  if p_provider not in ('openai', 'gemini', 'unknown')
     or p_model is null or length(p_model) < 1 or length(p_model) > 160
     or coalesce(p_prompt_tokens, 0) < 0 or coalesce(p_prompt_tokens, 0) > 10000000
     or coalesce(p_completion_tokens, 0) < 0 or coalesce(p_completion_tokens, 0) > 10000000
     or coalesce(p_total_tokens, 0) < 0 or coalesce(p_total_tokens, 0) > 10000000
     or coalesce(p_latency_ms, 0) < 0 or coalesce(p_latency_ms, 0) > 600000
     or p_est_cost_usd is null or p_est_cost_usd < 0 or p_est_cost_usd > 5 then
    raise exception 'compile_standard_invalid_usage' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('compile-standard-usage:' || p_run_id::text, 0));
  select id into v_existing_id from public.ai_usage_audit
  where user_id = v_user_id and function_name = 'compile-standard'
    and metadata->>'run_id' = p_run_id::text
  limit 1;
  if found then return jsonb_build_object('usage_id', v_existing_id, 'already_recorded', true); end if;
  insert into public.ai_usage_audit(
    user_id, function_name, provider, model, purpose, prompt_tokens,
    completion_tokens, total_tokens, latency_ms, status, est_cost_usd, metadata
  ) values (
    v_user_id, 'compile-standard', p_provider, p_model, 'compile-standard-criteria',
    nullif(p_prompt_tokens, 0), nullif(p_completion_tokens, 0),
    nullif(p_total_tokens, 0), nullif(p_latency_ms, 0), 'ok',
    p_est_cost_usd, jsonb_build_object('run_id', p_run_id)
  ) returning id into v_usage_id;
  return jsonb_build_object('usage_id', v_usage_id, 'already_recorded', false);
end;
$$;

create or replace function public.finish_compile_standard_run(
  p_run_id uuid,
  p_stage text,
  p_status text,
  p_stage_detail jsonb,
  p_error text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.harness_runs%rowtype;
  v_sort_run_id uuid;
  v_snapshot jsonb;
  v_snapshot_sha text;
begin
  perform public.assert_compile_standard_capability(p_capability);
  if v_user_id is null then raise exception 'compile_standard_auth_required' using errcode = '42501'; end if;
  if p_stage not in ('halted', 'template_and_voice', 'failed')
     or p_status not in ('done', 'failed')
     or (p_stage = 'failed') <> (p_status = 'failed')
     or (p_stage <> 'failed' and p_error is not null)
     or (p_error is not null and length(p_error) > 1000)
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 524288 then
    raise exception 'compile_standard_invalid_finish' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'compile'
  for update;
  if not found then raise exception 'compile_standard_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then
    return jsonb_build_object('run_id', v_run.id, 'stage', v_run.stage, 'status', v_run.status, 'already_finished', true);
  end if;
  if p_status = 'done' then
    begin v_sort_run_id := (v_run.stage_detail->>'sort_run_id')::uuid;
    exception when others then raise exception 'compile_standard_invalid_source' using errcode = 'P0001'; end;
    select coalesce(jsonb_agg(jsonb_build_object(
      'item_id', i.id,
      'position', i.position,
      'verdict', g.verdict,
      'why', g.why,
      'ms_to_grade', g.ms_to_grade
    ) order by i.position) filter (where i.id is not null), '[]'::jsonb)
    into v_snapshot
    from public.sort_items i
    join public.sort_grades g on g.item_id = i.id and g.user_id = v_user_id
    where i.session_id = v_sort_run_id and i.user_id = v_user_id;
    v_snapshot_sha := encode(extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'), 'hex');
    if v_run.stage_detail->>'grade_snapshot_sha256' is distinct from v_snapshot_sha then
      raise exception 'compile_standard_stale_grades' using errcode = 'P0001';
    end if;
  end if;
  update public.harness_runs
  set stage = p_stage, status = p_status, stage_detail = p_stage_detail,
      error = case when p_stage = 'failed' then coalesce(p_error, 'compile failed') else null end,
      updated_at = now()
  where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'stage', p_stage, 'status', p_status, 'already_finished', false);
end;
$$;

create or replace function public.finalize_compile_standard_run(
  p_run_id uuid,
  p_sort_run_id uuid,
  p_criteria jsonb,
  p_construct_updates jsonb,
  p_artifact jsonb,
  p_stage_detail jsonb,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.harness_runs%rowtype;
  v_criterion jsonb;
  v_update jsonb;
  v_snapshot jsonb;
  v_snapshot_sha text;
  v_version integer;
  v_construct_id uuid;
  v_artifact_id uuid;
  v_names text[] := '{}';
begin
  perform public.assert_compile_standard_capability(p_capability);
  if v_user_id is null then raise exception 'compile_standard_auth_required' using errcode = '42501'; end if;
  if p_sort_run_id is null
     or p_criteria is null or jsonb_typeof(p_criteria) <> 'array' or jsonb_array_length(p_criteria) > 7
     or p_construct_updates is null or jsonb_typeof(p_construct_updates) <> 'array' or jsonb_array_length(p_construct_updates) > 7
     or p_artifact is null or jsonb_typeof(p_artifact) <> 'object'
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 524288 then
    raise exception 'compile_standard_invalid_finalization' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'compile'
  for update;
  if not found then raise exception 'compile_standard_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' and v_run.stage = 'ready' then
    return jsonb_build_object(
      'run_id', v_run.id,
      'artifact_id', v_run.stage_detail->>'artifact_id',
      'criteria_version', (v_run.stage_detail->>'criteria_version')::integer,
      'already_finalized', true
    );
  end if;
  if v_run.status <> 'running' or v_run.stage <> 'writing'
     or v_run.stage_detail->>'sort_run_id' is distinct from p_sort_run_id::text then
    raise exception 'compile_standard_run_not_writable' using errcode = 'P0001';
  end if;
  v_version := (v_run.stage_detail->>'criteria_version')::integer;
  if v_version is null or v_version < 1 then
    raise exception 'compile_standard_invalid_version' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', i.id,
    'position', i.position,
    'verdict', g.verdict,
    'why', g.why,
    'ms_to_grade', g.ms_to_grade
  ) order by i.position) filter (where i.id is not null), '[]'::jsonb)
  into v_snapshot
  from public.sort_items i
  join public.sort_grades g on g.item_id = i.id and g.user_id = v_user_id
  where i.session_id = p_sort_run_id and i.user_id = v_user_id;
  v_snapshot_sha := encode(extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  if v_run.stage_detail->>'grade_snapshot_sha256' is distinct from v_snapshot_sha then
    raise exception 'compile_standard_stale_grades' using errcode = 'P0001';
  end if;

  if jsonb_array_length(p_construct_updates) <> jsonb_array_length(p_criteria) then
    raise exception 'compile_standard_construct_set_mismatch' using errcode = '22023';
  end if;
  for v_criterion in select value from jsonb_array_elements(p_criteria)
  loop
    if jsonb_typeof(v_criterion) <> 'object'
       or (select count(*) from jsonb_object_keys(v_criterion)) <> 14
       or not (v_criterion ?& array[
         'construct_id','name','check_text','observable','weight','holds_example','breaks_example',
         'n_rejected','n_rejected_failing','n_accepted','n_accepted_failing',
         'disc_verdict','provenance','disposition'
       ]) then
      raise exception 'compile_standard_invalid_criterion_shape' using errcode = '22023';
    end if;
    begin v_construct_id := (v_criterion->>'construct_id')::uuid;
    exception when others then raise exception 'compile_standard_invalid_construct' using errcode = '22023'; end;
    if jsonb_typeof(v_criterion->'name') <> 'string' or length(btrim(v_criterion->>'name')) not between 1 and 80
       or jsonb_typeof(v_criterion->'check_text') <> 'string' or length(btrim(v_criterion->>'check_text')) not between 1 and 240
       or jsonb_typeof(v_criterion->'observable') not in ('string','null')
       or v_criterion->>'weight' not in ('essential','important','optional','pitfall')
       or jsonb_typeof(v_criterion->'holds_example') not in ('string','null')
       or jsonb_typeof(v_criterion->'breaks_example') not in ('string','null')
       or jsonb_typeof(v_criterion->'n_rejected') <> 'number'
       or jsonb_typeof(v_criterion->'n_rejected_failing') <> 'number'
       or jsonb_typeof(v_criterion->'n_accepted') <> 'number'
       or jsonb_typeof(v_criterion->'n_accepted_failing') <> 'number'
       or v_criterion->>'disc_verdict' not in ('keep','delete','untested')
       or jsonb_typeof(v_criterion->'provenance') <> 'object'
       or v_criterion->>'disposition' <> 'advisory'
       or lower(btrim(v_criterion->>'name')) = any(v_names)
       or not exists (
         select 1 from public.constructs c
         where c.id = v_construct_id and c.user_id = v_user_id
           and exists (
             select 1 from public.sort_items i
             where i.session_id = p_sort_run_id and i.user_id = v_user_id
               and i.targets @> array[v_construct_id]
           )
       ) then
      raise exception 'compile_standard_invalid_criterion' using errcode = '22023';
    end if;
    v_names := array_append(v_names, lower(btrim(v_criterion->>'name')));
  end loop;

  for v_update in select value from jsonb_array_elements(p_construct_updates)
  loop
    if jsonb_typeof(v_update) <> 'object'
       or (select count(*) from jsonb_object_keys(v_update)) <> 2
       or not (v_update ?& array['construct_id','contrast_pole'])
       or jsonb_typeof(v_update->'contrast_pole') not in ('string','null') then
      raise exception 'compile_standard_invalid_construct_update' using errcode = '22023';
    end if;
    begin v_construct_id := (v_update->>'construct_id')::uuid;
    exception when others then raise exception 'compile_standard_invalid_construct_update' using errcode = '22023'; end;
    if not exists (
      select 1 from jsonb_array_elements(p_criteria) c
      where c->>'construct_id' = v_construct_id::text
    ) or (v_update->>'contrast_pole' is not null and length(v_update->>'contrast_pole') > 600) then
      raise exception 'compile_standard_construct_set_mismatch' using errcode = '22023';
    end if;
  end loop;

  if (select count(*) from jsonb_object_keys(p_artifact)) <> 3
     or not (p_artifact ?& array['name','body','metadata'])
     or jsonb_typeof(p_artifact->'name') <> 'string'
     or length(btrim(p_artifact->>'name')) not between 1 and 160
     or jsonb_typeof(p_artifact->'body') <> 'string'
     or length(p_artifact->>'body') < 1 or octet_length(p_artifact->>'body') > 524288
     or jsonb_typeof(p_artifact->'metadata') <> 'object'
     or octet_length((p_artifact->'metadata')::text) > 131072 then
    raise exception 'compile_standard_invalid_artifact' using errcode = '22023';
  end if;

  update public.criteria set is_current = false
  where user_id = v_user_id and surface = v_run.surface and is_current = true;
  for v_criterion in select value from jsonb_array_elements(p_criteria)
  loop
    insert into public.criteria(
      user_id, scope, construct_id, surface, name, check_text, observable, weight,
      holds_example, breaks_example, n_rejected, n_rejected_failing,
      n_accepted, n_accepted_failing, disc_verdict, provenance, version,
      is_current, disposition
    ) values (
      v_user_id, 'person', (v_criterion->>'construct_id')::uuid, v_run.surface,
      btrim(v_criterion->>'name'), btrim(v_criterion->>'check_text'), v_criterion->>'observable',
      v_criterion->>'weight', v_criterion->>'holds_example', v_criterion->>'breaks_example',
      (v_criterion->>'n_rejected')::integer, (v_criterion->>'n_rejected_failing')::integer,
      (v_criterion->>'n_accepted')::integer, (v_criterion->>'n_accepted_failing')::integer,
      v_criterion->>'disc_verdict',
      (v_criterion->'provenance') || jsonb_build_object(
        'sort_run_id', p_sort_run_id,
        'compile_run_id', p_run_id,
        'compiled_at', now()
      ),
      v_version, true, 'advisory'
    );
  end loop;

  for v_update in select value from jsonb_array_elements(p_construct_updates)
  loop
    v_construct_id := (v_update->>'construct_id')::uuid;
    update public.constructs
    set contrast_pole = coalesce(v_update->>'contrast_pole', contrast_pole),
        status = case
          when coalesce(v_update->>'contrast_pole', contrast_pole) is not null
            and coalesce(array_length(evidence_ids, 1), 0) >= 2 then 'compiled'
          else status
        end,
        updated_at = now()
    where id = v_construct_id and user_id = v_user_id;
  end loop;

  insert into public.generated_artifacts(user_id, kind, name, body, metadata)
  values (
    v_user_id,
    'standard',
    btrim(p_artifact->>'name'),
    p_artifact->>'body',
    (p_artifact->'metadata') || jsonb_build_object(
      'criteria_version', v_version,
      'surface', v_run.surface,
      'sort_run_id', p_sort_run_id,
      'compile_run_id', p_run_id
    )
  ) returning id into v_artifact_id;

  update public.harness_runs
  set stage = 'ready', status = 'done', error = null,
      stage_detail = p_stage_detail || jsonb_build_object(
        'sort_run_id', p_sort_run_id,
        'criteria_version', v_version,
        'artifact_id', v_artifact_id
      ),
      updated_at = now()
  where id = p_run_id;
  return jsonb_build_object(
    'run_id', p_run_id,
    'artifact_id', v_artifact_id,
    'criteria_version', v_version,
    'criteria', jsonb_array_length(p_criteria),
    'already_finalized', false
  );
end;
$$;

revoke all on function public.reserve_compile_standard_run(text, text, uuid, jsonb, text) from public, anon;
revoke all on function public.advance_compile_standard_run(uuid, text, jsonb, text) from public, anon;
revoke all on function public.record_compile_standard_usage(uuid, text, text, integer, integer, integer, integer, numeric, text) from public, anon;
revoke all on function public.finish_compile_standard_run(uuid, text, text, jsonb, text, text) from public, anon;
revoke all on function public.finalize_compile_standard_run(uuid, uuid, jsonb, jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.reserve_compile_standard_run(text, text, uuid, jsonb, text) to authenticated, service_role;
grant execute on function public.advance_compile_standard_run(uuid, text, jsonb, text) to authenticated, service_role;
grant execute on function public.record_compile_standard_usage(uuid, text, text, integer, integer, integer, integer, numeric, text) to authenticated, service_role;
grant execute on function public.finish_compile_standard_run(uuid, text, text, jsonb, text, text) to authenticated, service_role;
grant execute on function public.finalize_compile_standard_run(uuid, uuid, jsonb, jsonb, jsonb, jsonb, text) to authenticated, service_role;

comment on function public.reserve_compile_standard_run(text, text, uuid, jsonb, text) is
  'Owner-bound complete-grade reservation with a pinned grade snapshot and hard daily admission.';
comment on function public.finalize_compile_standard_run(uuid, uuid, jsonb, jsonb, jsonb, jsonb, text) is
  'Atomically supersedes an owned standard, writes criteria and artifact, updates constructs and closes the compile run.';

commit;
