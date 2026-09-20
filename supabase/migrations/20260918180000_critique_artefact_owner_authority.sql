begin;

drop function if exists public.reserve_critique_artefact_run(text, text, text, uuid, text, text, jsonb, text);
drop function if exists public.advance_critique_artefact_run(uuid, text, jsonb, text);
drop function if exists public.record_critique_artefact_usage(uuid, text, text, text, integer, integer, integer, integer, numeric, text);
drop function if exists public.finish_critique_artefact_run(uuid, jsonb, text, text);
drop function if exists public.finalize_critique_artefact_run(uuid, text, jsonb, text);

create or replace function public.assert_critique_artefact_capability(p_capability text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
begin
  if p_capability is null or length(p_capability) < 32 or not exists (
    select 1 from vault.decrypted_secrets
    where name = 'critique_artefact_rpc_secret' and decrypted_secret = p_capability
  ) then
    raise exception 'critique_artefact_capability_required' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.assert_critique_artefact_capability(text) from public, anon, authenticated;

create or replace function public.current_critique_artefact_source_snapshot(
  p_user_id uuid,
  p_surface text,
  p_artifact_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'surface', coalesce(p_surface, ''),
    'artifact', case when p_artifact_id is null then null else (
      select jsonb_build_object(
        'id', a.id,
        'kind', a.kind,
        'name', a.name,
        'body', a.body,
        'metadata', coalesce(a.metadata, '{}'::jsonb)
      )
      from public.generated_artifacts a
      where a.id = p_artifact_id and a.user_id = p_user_id
    ) end,
    'criteria', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.surface, c.name, c.id)
      from (
        select id, surface, name, check_text, weight, holds_example, breaks_example, version
        from public.criteria
        where user_id = p_user_id and is_current = true and disc_verdict = 'keep'
      ) c
    ), '[]'::jsonb),
    'evidence', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.created_at desc, e.id)
      from (
        select id, quote, situated, created_at
        from public.evidence
        where user_id = p_user_id and redacted_at is null
        order by created_at desc, id
        limit 60
      ) e
    ), '[]'::jsonb),
    'graded_work', coalesce((
      select jsonb_agg(to_jsonb(g) order by g.created_at desc, g.item_id)
      from (
        select sg.item_id, sg.verdict, sg.why, sg.created_at, si.body
        from public.sort_grades sg
        join public.sort_items si on si.id = sg.item_id and si.user_id = p_user_id
        where sg.user_id = p_user_id
          and sg.verdict <> 'skip'
          and si.held_out = false
          and si.repeat_of is null
        order by sg.created_at desc, sg.item_id
        limit 80
      ) g
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.current_critique_artefact_source_snapshot(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.reserve_critique_artefact_run(
  p_request_id text,
  p_request_fingerprint text,
  p_source_type text,
  p_artifact_id uuid,
  p_body_sha256 text,
  p_surface text,
  p_lenses jsonb,
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
  v_daily_runs integer;
  v_spent numeric;
  v_snapshot jsonb;
  v_snapshot_sha text;
  v_run_id uuid;
begin
  perform public.assert_critique_artefact_capability(p_capability);
  if v_user_id is null then
    raise exception 'critique_artefact_auth_required' using errcode = '42501';
  end if;
  if p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or p_request_fingerprint is null or p_request_fingerprint !~ '^[a-f0-9]{64}$'
     or p_source_type not in ('paste', 'artifact')
     or (p_source_type = 'paste' and p_artifact_id is not null)
     or (p_source_type = 'artifact' and p_artifact_id is null)
     or p_body_sha256 is null or p_body_sha256 !~ '^[a-f0-9]{64}$'
     or p_surface is null or length(p_surface) > 120
     or p_lenses is null or jsonb_typeof(p_lenses) <> 'array'
     or jsonb_array_length(p_lenses) not between 1 and 3
     or exists (
       select 1 from jsonb_array_elements_text(p_lenses) lens
       where lens not in ('standard', 'evidence', 'signature')
     )
     or (select count(distinct lens) from jsonb_array_elements_text(p_lenses) lens)
        <> jsonb_array_length(p_lenses) then
    raise exception 'critique_artefact_invalid_reservation' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('critique-artefact:' || v_user_id::text, 0));
  select * into v_existing
  from public.harness_runs
  where user_id = v_user_id and kind = 'critique' and request_id = p_request_id
  limit 1;
  if found then
    if v_existing.stage_detail->>'request_fingerprint' is distinct from p_request_fingerprint then
      raise exception 'critique_artefact_request_conflict' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'run_id', v_existing.id,
      'stage', v_existing.stage,
      'status', v_existing.status,
      'result', coalesce(v_existing.stage_detail->'result', '{}'::jsonb),
      'idempotent', true
    );
  end if;

  v_snapshot := public.current_critique_artefact_source_snapshot(v_user_id, p_surface, p_artifact_id);
  if p_source_type = 'artifact' and v_snapshot->'artifact' = 'null'::jsonb then
    raise exception 'critique_artefact_artifact_not_owned' using errcode = '42501';
  end if;
  if p_source_type = 'artifact' and encode(
    extensions.digest(convert_to(v_snapshot->'artifact'->>'body', 'UTF8'), 'sha256'), 'hex'
  ) is distinct from p_body_sha256 then
    raise exception 'critique_artefact_artifact_changed' using errcode = 'P0001';
  end if;
  v_snapshot_sha := encode(
    extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'),
    'hex'
  );

  select count(*)::integer into v_daily_runs
  from public.harness_runs
  where user_id = v_user_id and kind = 'critique' and created_at >= date_trunc('day', now());
  select coalesce(sum(est_cost_usd), 0) into v_spent
  from public.ai_usage_audit
  where user_id = v_user_id and created_at >= date_trunc('day', now());
  if v_daily_runs >= 8 then
    raise exception 'critique_artefact_daily_run_limit' using errcode = 'P0001';
  end if;
  if v_spent >= 5.00 then
    raise exception 'critique_artefact_daily_spend_limit' using errcode = 'P0001';
  end if;

  insert into public.harness_runs(
    user_id, kind, surface, status, stage, request_id, stage_detail
  ) values (
    v_user_id,
    'critique',
    nullif(btrim(p_surface), ''),
    'running',
    'loading',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_fingerprint', p_request_fingerprint,
      'source_type', p_source_type,
      'artifact_id', p_artifact_id,
      'body_sha256', p_body_sha256,
      'source_snapshot_sha256', v_snapshot_sha,
      'lenses_asked', p_lenses
    )
  ) returning id into v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'stage', 'loading',
    'status', 'running',
    'idempotent', false
  );
end;
$$;

create or replace function public.advance_critique_artefact_run(
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
  perform public.assert_critique_artefact_capability(p_capability);
  if v_user_id is null then raise exception 'critique_artefact_auth_required' using errcode = '42501'; end if;
  if p_stage not in ('loading', '7a', 'lenses', 'meta')
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 524288 then
    raise exception 'critique_artefact_invalid_stage' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'critique'
  for update;
  if not found then raise exception 'critique_artefact_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then raise exception 'critique_artefact_run_not_running' using errcode = 'P0001'; end if;
  if not (
    (v_run.stage = 'loading' and p_stage in ('loading', '7a'))
    or (v_run.stage = '7a' and p_stage in ('7a', 'lenses'))
    or (v_run.stage = 'lenses' and p_stage in ('lenses', 'meta'))
    or (v_run.stage = 'meta' and p_stage = 'meta')
  ) then
    raise exception 'critique_artefact_invalid_transition' using errcode = 'P0001';
  end if;
  update public.harness_runs
  set stage = p_stage,
      stage_detail = v_run.stage_detail || p_stage_detail,
      updated_at = now()
  where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'stage', p_stage);
end;
$$;

create or replace function public.record_critique_artefact_usage(
  p_run_id uuid,
  p_purpose text,
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
  v_receipts integer;
begin
  perform public.assert_critique_artefact_capability(p_capability);
  if v_user_id is null then raise exception 'critique_artefact_auth_required' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.harness_runs
    where id = p_run_id and user_id = v_user_id and kind = 'critique' and status = 'running'
  ) then
    raise exception 'critique_artefact_run_not_owned' using errcode = '42501';
  end if;
  if p_purpose not in ('standard', 'evidence', 'signature', 'meta', 'revision')
     or p_provider not in ('openai', 'gemini', 'unknown')
     or p_model is null or length(p_model) not between 1 and 160
     or coalesce(p_prompt_tokens, 0) < 0 or coalesce(p_prompt_tokens, 0) > 10000000
     or coalesce(p_completion_tokens, 0) < 0 or coalesce(p_completion_tokens, 0) > 10000000
     or coalesce(p_total_tokens, 0) < 0 or coalesce(p_total_tokens, 0) > 10000000
     or coalesce(p_latency_ms, 0) < 0 or coalesce(p_latency_ms, 0) > 600000
     or p_est_cost_usd is null or p_est_cost_usd < 0 or p_est_cost_usd > 5 then
    raise exception 'critique_artefact_invalid_usage' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('critique-artefact-usage:' || p_run_id::text, 0));
  select id into v_existing_id from public.ai_usage_audit
  where user_id = v_user_id and function_name = 'critique-artefact'
    and metadata->>'run_id' = p_run_id::text
    and metadata->>'purpose' = p_purpose
  limit 1;
  if found then return jsonb_build_object('usage_id', v_existing_id, 'already_recorded', true); end if;
  select count(*)::integer into v_receipts from public.ai_usage_audit
  where user_id = v_user_id and function_name = 'critique-artefact'
    and metadata->>'run_id' = p_run_id::text;
  if v_receipts >= 5 then
    raise exception 'critique_artefact_usage_limit' using errcode = 'P0001';
  end if;
  insert into public.ai_usage_audit(
    user_id, function_name, provider, model, purpose, prompt_tokens,
    completion_tokens, total_tokens, latency_ms, status, est_cost_usd, metadata
  ) values (
    v_user_id, 'critique-artefact', p_provider, p_model, 'critique-' || p_purpose,
    nullif(p_prompt_tokens, 0), nullif(p_completion_tokens, 0),
    nullif(p_total_tokens, 0), nullif(p_latency_ms, 0), 'ok', p_est_cost_usd,
    jsonb_build_object('run_id', p_run_id, 'purpose', p_purpose)
  ) returning id into v_usage_id;
  return jsonb_build_object('usage_id', v_usage_id, 'already_recorded', false);
end;
$$;

create or replace function public.finish_critique_artefact_run(
  p_run_id uuid,
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
begin
  perform public.assert_critique_artefact_capability(p_capability);
  if v_user_id is null then raise exception 'critique_artefact_auth_required' using errcode = '42501'; end if;
  if p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 524288
     or p_error is null or length(p_error) not between 1 and 1000 then
    raise exception 'critique_artefact_invalid_finish' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'critique'
  for update;
  if not found then raise exception 'critique_artefact_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then
    return jsonb_build_object('run_id', v_run.id, 'stage', v_run.stage, 'status', v_run.status, 'already_finished', true);
  end if;
  update public.harness_runs
  set stage = 'failed', status = 'failed', error = p_error,
      stage_detail = v_run.stage_detail || p_stage_detail,
      updated_at = now()
  where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'stage', 'failed', 'status', 'failed', 'already_finished', false);
end;
$$;

create or replace function public.finalize_critique_artefact_run(
  p_run_id uuid,
  p_body_sha256 text,
  p_result jsonb,
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
  v_artifact_id uuid;
  v_snapshot jsonb;
  v_snapshot_sha text;
begin
  perform public.assert_critique_artefact_capability(p_capability);
  if v_user_id is null then raise exception 'critique_artefact_auth_required' using errcode = '42501'; end if;
  if p_body_sha256 is null or p_body_sha256 !~ '^[a-f0-9]{64}$'
     or p_result is null or jsonb_typeof(p_result) <> 'object'
     or octet_length(p_result::text) > 524288
     or not (p_result ?& array[
       'checked','against','mechanical','judgement','uncovered','escalations','oneThing',
       'revised','notes','passes','signature','exemplars','enforcement','lenses','surface'
     ])
     or jsonb_typeof(p_result->'mechanical') <> 'array'
     or jsonb_typeof(p_result->'judgement') <> 'array'
     or jsonb_typeof(p_result->'notes') <> 'array'
     or jsonb_typeof(p_result->'lenses') <> 'object' then
    raise exception 'critique_artefact_invalid_finalization' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'critique'
  for update;
  if not found then raise exception 'critique_artefact_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' and v_run.stage = 'ready' then
    return jsonb_build_object('run_id', v_run.id, 'result', v_run.stage_detail->'result', 'already_finalized', true);
  end if;
  if v_run.status <> 'running' or v_run.stage <> 'meta'
     or v_run.stage_detail->>'body_sha256' is distinct from p_body_sha256 then
    raise exception 'critique_artefact_run_not_writable' using errcode = 'P0001';
  end if;
  begin
    v_artifact_id := nullif(v_run.stage_detail->>'artifact_id', '')::uuid;
  exception when others then
    raise exception 'critique_artefact_invalid_source' using errcode = 'P0001';
  end;
  v_snapshot := public.current_critique_artefact_source_snapshot(
    v_user_id,
    coalesce(v_run.surface, ''),
    v_artifact_id
  );
  v_snapshot_sha := encode(
    extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'),
    'hex'
  );
  if v_run.stage_detail->>'source_snapshot_sha256' is distinct from v_snapshot_sha then
    raise exception 'critique_artefact_stale_source' using errcode = 'P0001';
  end if;
  update public.harness_runs
  set stage = 'ready', status = 'done', error = null,
      stage_detail = v_run.stage_detail || jsonb_build_object('result', p_result),
      updated_at = now()
  where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'result', p_result, 'already_finalized', false);
end;
$$;

revoke all on function public.reserve_critique_artefact_run(text, text, text, uuid, text, text, jsonb, text) from public, anon;
revoke all on function public.advance_critique_artefact_run(uuid, text, jsonb, text) from public, anon;
revoke all on function public.record_critique_artefact_usage(uuid, text, text, text, integer, integer, integer, integer, numeric, text) from public, anon;
revoke all on function public.finish_critique_artefact_run(uuid, jsonb, text, text) from public, anon;
revoke all on function public.finalize_critique_artefact_run(uuid, text, jsonb, text) from public, anon;
grant execute on function public.reserve_critique_artefact_run(text, text, text, uuid, text, text, jsonb, text) to authenticated, service_role;
grant execute on function public.advance_critique_artefact_run(uuid, text, jsonb, text) to authenticated, service_role;
grant execute on function public.record_critique_artefact_usage(uuid, text, text, text, integer, integer, integer, integer, numeric, text) to authenticated, service_role;
grant execute on function public.finish_critique_artefact_run(uuid, jsonb, text, text) to authenticated, service_role;
grant execute on function public.finalize_critique_artefact_run(uuid, text, jsonb, text) to authenticated, service_role;

comment on function public.reserve_critique_artefact_run(text, text, text, uuid, text, text, jsonb, text) is
  'Owner-bound critique reservation with exact retry identity, a pinned source snapshot and hard daily admission.';
comment on function public.finalize_critique_artefact_run(uuid, text, jsonb, text) is
  'Atomically closes an owned critique only while its exact source snapshot remains current.';

commit;
