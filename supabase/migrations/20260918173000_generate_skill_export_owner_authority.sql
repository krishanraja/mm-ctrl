begin;

revoke insert, update, truncate on public.skill_exports from anon, authenticated;
revoke insert, update, truncate on public.generated_artifacts from anon, authenticated;
revoke insert, update, delete, truncate on public.skill_provenance from anon, authenticated;

drop policy if exists "Users can upload their own skill packages" on storage.objects;
create policy "Users can upload their own skill packages"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'skill-packages'
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(coalesce(metadata->>'mimetype', '')) = 'application/zip'
  );

drop function if exists public.reserve_generate_skill_export_run(text, text, text, text);
drop function if exists public.advance_generate_skill_export_run(uuid, text, jsonb, text);
drop function if exists public.record_generate_skill_export_usage(uuid, integer, text, text, integer, integer, integer, integer, numeric, text);
drop function if exists public.finish_generate_skill_export_run(uuid, text, text, jsonb, text, text);
drop function if exists public.finalize_generate_skill_export_triage(uuid, uuid, jsonb, jsonb, text);
drop function if exists public.finalize_generate_skill_export_run(uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text);

create or replace function public.assert_generate_skill_export_capability(p_capability text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
begin
  if p_capability is null or length(p_capability) < 32 or not exists (
    select 1 from vault.decrypted_secrets
    where name = 'generate_skill_export_rpc_secret' and decrypted_secret = p_capability
  ) then
    raise exception 'generate_skill_export_capability_required' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.assert_generate_skill_export_capability(text) from public, anon, authenticated;

create or replace function public.current_generate_skill_source_snapshot(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select encode(extensions.digest(convert_to(jsonb_build_object(
    'criteria', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'surface', c.surface, 'name', c.name, 'check', c.check_text,
      'observable', c.observable, 'weight', c.weight, 'holds', c.holds_example,
      'breaks', c.breaks_example, 'version', c.version, 'disposition', c.disposition,
      'provenance', c.provenance
    ) order by c.id) from public.criteria c where c.user_id = p_user_id and c.is_current), '[]'::jsonb),
    'evidence', coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'kind', e.kind, 'body', e.body, 'quote', e.quote,
      'source_id', e.source_id, 'situated', e.situated, 'situation', e.situation,
      'memory_fact_id', e.memory_fact_id
    ) order by e.id) from public.evidence e
      where e.user_id = p_user_id and e.redacted_at is null
        and (e.retention_expires_at is null or e.retention_expires_at > now())), '[]'::jsonb),
    'grades', coalesce((select jsonb_agg(jsonb_build_object(
      'id', g.id, 'item_id', g.item_id, 'verdict', g.verdict, 'why', g.why,
      'body', i.body, 'position', i.position, 'held_out', i.held_out, 'repeat_of', i.repeat_of
    ) order by g.id) from public.sort_grades g join public.sort_items i on i.id = g.item_id
      where g.user_id = p_user_id and i.user_id = p_user_id), '[]'::jsonb),
    'memory', coalesce((select jsonb_agg(jsonb_build_object(
      'id', m.id, 'key', m.fact_key, 'label', m.fact_label, 'value', m.fact_value,
      'context', m.fact_context, 'confidence', m.confidence_score,
      'verification', m.verification_status, 'temperature', m.temperature,
      'content_changed_at', m.content_changed_at
    ) order by m.id) from public.user_memory m
      where m.user_id = p_user_id and m.is_current and m.archived_at is null
        and (m.retention_expires_at is null or m.retention_expires_at > now())), '[]'::jsonb),
    'patterns', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'type', p.pattern_type, 'text', p.pattern_text,
      'confidence', p.confidence, 'status', p.status, 'evidence_count', p.evidence_count
    ) order by p.id) from public.user_patterns p where p.user_id = p_user_id), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', d.id, 'decision', d.decision_text, 'rationale', d.rationale,
      'status', d.status, 'updated_at', d.updated_at
    ) order by d.id) from public.user_decisions d where d.user_id = p_user_id), '[]'::jsonb),
    'latest_standard', coalesce((select jsonb_build_object(
      'id', a.id, 'body_sha256', encode(extensions.digest(convert_to(a.body, 'UTF8'), 'sha256'), 'hex'),
      'metadata', a.metadata, 'created_at', a.created_at
    ) from public.generated_artifacts a
      where a.user_id = p_user_id and a.kind = 'standard'
      order by a.created_at desc, a.id desc limit 1), '{}'::jsonb),
    'profile', coalesce((select to_jsonb(ep) - 'user_id' from public.edge_profiles ep
      where ep.user_id = p_user_id order by ep.updated_at desc limit 1), '{}'::jsonb)
  )::text, 'UTF8'), 'sha256'), 'hex');
$$;
revoke all on function public.current_generate_skill_source_snapshot(uuid) from public, anon, authenticated;

create or replace function public.reserve_generate_skill_export_run(
  p_request_id text,
  p_request_fingerprint text,
  p_transcript_sha text,
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
  v_snapshot_sha text;
  v_run_id uuid;
begin
  perform public.assert_generate_skill_export_capability(p_capability);
  if v_user_id is null then raise exception 'generate_skill_export_auth_required' using errcode = '42501'; end if;
  if p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or p_request_fingerprint is null or p_request_fingerprint !~ '^[a-f0-9]{64}$'
     or p_transcript_sha is null or p_transcript_sha !~ '^[a-f0-9]{64}$' then
    raise exception 'generate_skill_export_invalid_reservation' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('generate-skill-export:' || v_user_id::text, 0));
  select * into v_existing from public.harness_runs
  where user_id = v_user_id and kind = 'generate' and request_id = p_request_id limit 1;
  if found then
    if v_existing.stage_detail->>'request_fingerprint' is distinct from p_request_fingerprint then
      raise exception 'generate_skill_export_request_conflict' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'run_id', v_existing.id, 'stage', v_existing.stage, 'status', v_existing.status,
      'result', coalesce(v_existing.stage_detail->'result', '{}'::jsonb), 'idempotent', true
    );
  end if;

  select count(*)::integer into v_daily_runs from public.harness_runs
  where user_id = v_user_id and kind = 'generate' and created_at >= date_trunc('day', now());
  select coalesce(sum(est_cost_usd), 0) into v_spent from public.ai_usage_audit
  where user_id = v_user_id and created_at >= date_trunc('day', now());
  if v_daily_runs >= 5 then raise exception 'generate_skill_export_daily_run_limit' using errcode = 'P0001'; end if;
  if v_spent >= 3.00 then raise exception 'generate_skill_export_daily_spend_limit' using errcode = 'P0001'; end if;

  v_snapshot_sha := public.current_generate_skill_source_snapshot(v_user_id);
  insert into public.harness_runs(user_id, kind, status, stage, request_id, stage_detail)
  values (
    v_user_id, 'generate', 'running', 'loading', p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_fingerprint', p_request_fingerprint,
      'transcript_sha256', p_transcript_sha,
      'source_snapshot_sha256', v_snapshot_sha
    )
  ) returning id into v_run_id;
  return jsonb_build_object('run_id', v_run_id, 'stage', 'loading', 'status', 'running', 'idempotent', false);
end;
$$;

create or replace function public.advance_generate_skill_export_run(
  p_run_id uuid, p_stage text, p_stage_detail jsonb, p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid := auth.uid(); v_run public.harness_runs%rowtype;
begin
  perform public.assert_generate_skill_export_capability(p_capability);
  if v_user_id is null then raise exception 'generate_skill_export_auth_required' using errcode = '42501'; end if;
  if p_stage not in ('generating','checking','packaging') or p_stage_detail is null
     or jsonb_typeof(p_stage_detail) <> 'object' or octet_length(p_stage_detail::text) > 262144 then
    raise exception 'generate_skill_export_invalid_stage' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs where id = p_run_id and user_id = v_user_id and kind = 'generate' for update;
  if not found then raise exception 'generate_skill_export_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then raise exception 'generate_skill_export_run_not_running' using errcode = 'P0001'; end if;
  if not ((v_run.stage = 'loading' and p_stage = 'generating')
    or (v_run.stage = 'generating' and p_stage in ('generating','checking'))
    or (v_run.stage = 'checking' and p_stage in ('checking','packaging'))
    or (v_run.stage = 'packaging' and p_stage = 'packaging')) then
    raise exception 'generate_skill_export_invalid_transition' using errcode = 'P0001';
  end if;
  update public.harness_runs set stage = p_stage,
    stage_detail = v_run.stage_detail || p_stage_detail, updated_at = now() where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'stage', p_stage);
end;
$$;

create or replace function public.record_generate_skill_export_usage(
  p_run_id uuid, p_pass integer, p_provider text, p_model text,
  p_prompt_tokens integer, p_completion_tokens integer, p_total_tokens integer,
  p_latency_ms integer, p_est_cost_usd numeric, p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid := auth.uid(); v_existing_id uuid; v_usage_id uuid;
begin
  perform public.assert_generate_skill_export_capability(p_capability);
  if v_user_id is null then raise exception 'generate_skill_export_auth_required' using errcode = '42501'; end if;
  if not exists (select 1 from public.harness_runs where id = p_run_id and user_id = v_user_id and kind = 'generate' and status = 'running') then
    raise exception 'generate_skill_export_run_not_owned' using errcode = '42501';
  end if;
  if p_pass not between 1 and 2 or p_provider not in ('openai','gemini','unknown')
     or p_model is null or length(p_model) not between 1 and 160
     or coalesce(p_prompt_tokens, 0) not between 0 and 10000000
     or coalesce(p_completion_tokens, 0) not between 0 and 10000000
     or coalesce(p_total_tokens, 0) not between 0 and 10000000
     or coalesce(p_latency_ms, 0) not between 0 and 600000
     or p_est_cost_usd is null or p_est_cost_usd < 0 or p_est_cost_usd > 5 then
    raise exception 'generate_skill_export_invalid_usage' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('generate-skill-export-usage:' || p_run_id::text || ':' || p_pass::text, 0));
  select id into v_existing_id from public.ai_usage_audit
  where user_id = v_user_id and function_name = 'generate-skill-export'
    and metadata->>'run_id' = p_run_id::text and (metadata->>'pass')::integer = p_pass limit 1;
  if found then return jsonb_build_object('usage_id', v_existing_id, 'already_recorded', true); end if;
  insert into public.ai_usage_audit(
    user_id, function_name, provider, model, purpose, prompt_tokens, completion_tokens,
    total_tokens, latency_ms, status, est_cost_usd, metadata
  ) values (
    v_user_id, 'generate-skill-export', p_provider, p_model,
    case when p_pass = 1 then 'skill-export' else 'skill-export-regen' end,
    nullif(p_prompt_tokens, 0), nullif(p_completion_tokens, 0), nullif(p_total_tokens, 0),
    nullif(p_latency_ms, 0), 'ok', p_est_cost_usd,
    jsonb_build_object('run_id', p_run_id, 'pass', p_pass)
  ) returning id into v_usage_id;
  return jsonb_build_object('usage_id', v_usage_id, 'already_recorded', false);
end;
$$;

create or replace function public.finish_generate_skill_export_run(
  p_run_id uuid, p_stage text, p_status text, p_stage_detail jsonb, p_error text, p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid := auth.uid(); v_run public.harness_runs%rowtype;
begin
  perform public.assert_generate_skill_export_capability(p_capability);
  if v_user_id is null then raise exception 'generate_skill_export_auth_required' using errcode = '42501'; end if;
  if p_stage <> 'failed' or p_status <> 'failed' or p_error is null or length(p_error) > 1000
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 262144 then
    raise exception 'generate_skill_export_invalid_finish' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs where id = p_run_id and user_id = v_user_id and kind = 'generate' for update;
  if not found then raise exception 'generate_skill_export_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then return jsonb_build_object('run_id', v_run.id, 'already_finished', true); end if;
  update public.harness_runs set stage = 'failed', status = 'failed', error = p_error,
    stage_detail = v_run.stage_detail || p_stage_detail, updated_at = now() where id = p_run_id;
  return jsonb_build_object('run_id', p_run_id, 'already_finished', false);
end;
$$;

create or replace function public.finalize_generate_skill_export_triage(
  p_run_id uuid, p_skill_export_id uuid, p_export jsonb, p_stage_detail jsonb, p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid := auth.uid(); v_run public.harness_runs%rowtype; v_result jsonb;
begin
  perform public.assert_generate_skill_export_capability(p_capability);
  if v_user_id is null then raise exception 'generate_skill_export_auth_required' using errcode = '42501'; end if;
  if p_skill_export_id is null or p_export is null or jsonb_typeof(p_export) <> 'object'
     or (select count(*) from jsonb_object_keys(p_export)) <> 4
     or not (p_export ?& array['skill_name','description','transcript','triage_result'])
     or p_export->>'triage_result' not in ('custom_instruction','memory_fact','saved_style')
     or length(p_export->>'skill_name') not between 1 and 120
     or length(p_export->>'description') > 2000
     or length(p_export->>'transcript') not between 20 and 50000
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object' then
    raise exception 'generate_skill_export_invalid_triage' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs where id = p_run_id and user_id = v_user_id and kind = 'generate' for update;
  if not found then raise exception 'generate_skill_export_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' and v_run.stage = 'routed' then return v_run.stage_detail->'result' || jsonb_build_object('already_finalized', true); end if;
  if v_run.status <> 'running' or v_run.stage <> 'generating' then raise exception 'generate_skill_export_run_not_writable' using errcode = 'P0001'; end if;
  if v_run.stage_detail->>'source_snapshot_sha256' is distinct from public.current_generate_skill_source_snapshot(v_user_id) then
    raise exception 'generate_skill_export_stale_source' using errcode = 'P0001';
  end if;
  insert into public.skill_exports(id, user_id, skill_name, description, transcript, triage_result)
  values (p_skill_export_id, v_user_id, p_export->>'skill_name', p_export->>'description', p_export->>'transcript', p_export->>'triage_result');
  v_result := jsonb_build_object('skill_export_id', p_skill_export_id, 'triage', jsonb_build_object(
    'passed', false, 'result', p_export->>'triage_result', 'reasoning', p_export->>'description'));
  update public.harness_runs set stage = 'routed', status = 'done', error = null,
    stage_detail = v_run.stage_detail || p_stage_detail || jsonb_build_object('result', v_result), updated_at = now()
  where id = p_run_id;
  return v_result || jsonb_build_object('already_finalized', false);
end;
$$;

create or replace function public.finalize_generate_skill_export_run(
  p_run_id uuid,
  p_skill_export_id uuid,
  p_artifact_id uuid,
  p_export jsonb,
  p_artifact jsonb,
  p_cited_source jsonb,
  p_cited_evidence jsonb,
  p_provenance jsonb,
  p_memory_links jsonb,
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
  v_row jsonb;
  v_source_id uuid;
  v_evidence_id uuid;
  v_criterion_id uuid;
  v_to_id uuid;
  v_result jsonb;
begin
  perform public.assert_generate_skill_export_capability(p_capability);
  if v_user_id is null then raise exception 'generate_skill_export_auth_required' using errcode = '42501'; end if;
  if p_skill_export_id is null or p_artifact_id is null
     or p_export is null or jsonb_typeof(p_export) <> 'object'
     or p_artifact is null or jsonb_typeof(p_artifact) <> 'object'
     or p_cited_evidence is null or jsonb_typeof(p_cited_evidence) <> 'array' or jsonb_array_length(p_cited_evidence) > 100
     or p_provenance is null or jsonb_typeof(p_provenance) <> 'array' or jsonb_array_length(p_provenance) > 1000
     or p_memory_links is null or jsonb_typeof(p_memory_links) <> 'array' or jsonb_array_length(p_memory_links) > 200
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 262144 then
    raise exception 'generate_skill_export_invalid_finalization' using errcode = '22023';
  end if;
  select * into v_run from public.harness_runs where id = p_run_id and user_id = v_user_id and kind = 'generate' for update;
  if not found then raise exception 'generate_skill_export_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' and v_run.stage = 'ready' then return v_run.stage_detail->'result' || jsonb_build_object('already_finalized', true); end if;
  if v_run.status <> 'running' or v_run.stage <> 'packaging' then raise exception 'generate_skill_export_run_not_writable' using errcode = 'P0001'; end if;
  if v_run.stage_detail->>'source_snapshot_sha256' is distinct from public.current_generate_skill_source_snapshot(v_user_id) then
    raise exception 'generate_skill_export_stale_source' using errcode = 'P0001';
  end if;

  if (select count(*) from jsonb_object_keys(p_export)) <> 12
     or not (p_export ?& array['skill_name','description','transcript','triage_result','body_content','references_json','test_prompts','quality_gate','archetype','version','zip_path','package_sha256'])
     or p_export->>'triage_result' <> 'skill'
     or length(p_export->>'skill_name') not between 1 and 64
     or length(p_export->>'description') not between 1 and 1024
     or length(p_export->>'transcript') not between 20 and 50000
     or length(p_export->>'body_content') not between 1 and 300000
     or jsonb_typeof(p_export->'references_json') <> 'array'
     or jsonb_array_length(p_export->'references_json') > 50
     or jsonb_typeof(p_export->'test_prompts') <> 'array'
     or jsonb_array_length(p_export->'test_prompts') > 10
     or jsonb_typeof(p_export->'quality_gate') <> 'object'
     or (p_export->>'version')::integer <> 1
     or p_export->>'zip_path' not like v_user_id::text || '/' || p_run_id::text || '-%.zip'
     or p_export->>'zip_path' like '%..%'
     or p_export->>'package_sha256' !~ '^[a-f0-9]{64}$' then
    raise exception 'generate_skill_export_invalid_export' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_object_keys(p_artifact)) <> 3
     or not (p_artifact ?& array['name','body','metadata'])
     or length(p_artifact->>'name') not between 1 and 160
     or length(p_artifact->>'body') not between 1 and 1000000
     or jsonb_typeof(p_artifact->'metadata') <> 'object'
     or octet_length((p_artifact->'metadata')::text) > 262144 then
    raise exception 'generate_skill_export_invalid_artifact' using errcode = '22023';
  end if;

  if p_cited_source is not null and jsonb_typeof(p_cited_source) <> 'null' then
    if jsonb_typeof(p_cited_source) <> 'object' or (select count(*) from jsonb_object_keys(p_cited_source)) <> 4
       or not (p_cited_source ?& array['id','kind','label','body'])
       or p_cited_source->>'kind' <> 'transcript'
       or length(p_cited_source->>'label') not between 1 and 200
       or length(p_cited_source->>'body') not between 20 and 50000 then
      raise exception 'generate_skill_export_invalid_cited_source' using errcode = '22023';
    end if;
    begin v_source_id := (p_cited_source->>'id')::uuid;
    exception when others then raise exception 'generate_skill_export_invalid_cited_source' using errcode = '22023'; end;
    insert into public.evidence_sources(id, user_id, kind, label, body)
    values (v_source_id, v_user_id, 'transcript', p_cited_source->>'label', p_cited_source->>'body');
  elsif jsonb_array_length(p_cited_evidence) > 0 then
    raise exception 'generate_skill_export_missing_cited_source' using errcode = '22023';
  end if;

  for v_row in select value from jsonb_array_elements(p_cited_evidence)
  loop
    if jsonb_typeof(v_row) <> 'object' or (select count(*) from jsonb_object_keys(v_row)) <> 8
       or not (v_row ?& array['id','body','quote','quote_start','quote_end','source_label','situated','situation'])
       or length(v_row->>'body') not between 1 and 5000 or v_row->>'body' is distinct from v_row->>'quote'
       or (v_row->>'quote_start')::integer < 0 or (v_row->>'quote_end')::integer <= (v_row->>'quote_start')::integer
       or (v_row->>'quote_end')::integer > length(p_cited_source->>'body')
       or (v_row->>'situated')::boolean is not true then
      raise exception 'generate_skill_export_invalid_cited_evidence' using errcode = '22023';
    end if;
    begin v_evidence_id := (v_row->>'id')::uuid;
    exception when others then raise exception 'generate_skill_export_invalid_cited_evidence' using errcode = '22023'; end;
    insert into public.evidence(
      id, user_id, kind, body, quote, source_id, quote_start, quote_end,
      source_label, situated, situation, speaker_is_owner
    ) values (
      v_evidence_id, v_user_id, 'utterance', v_row->>'body', v_row->>'quote', v_source_id,
      (v_row->>'quote_start')::integer, (v_row->>'quote_end')::integer,
      v_row->>'source_label', true, v_row->>'situation', true
    );
  end loop;

  insert into public.skill_exports(
    id, user_id, skill_name, description, transcript, triage_result, body_content,
    references_json, test_prompts, quality_gate, archetype, version, zip_path
  ) values (
    p_skill_export_id, v_user_id, p_export->>'skill_name', p_export->>'description', p_export->>'transcript',
    'skill', p_export->>'body_content', p_export->'references_json',
    array(select jsonb_array_elements_text(p_export->'test_prompts')), p_export->'quality_gate',
    nullif(p_export->>'archetype',''), 1, p_export->>'zip_path'
  );
  insert into public.generated_artifacts(id, user_id, kind, name, body, metadata)
  values (
    p_artifact_id, v_user_id, 'skill', p_artifact->>'name', p_artifact->>'body',
    p_artifact->'metadata' || jsonb_build_object(
      'skill_export_id', p_skill_export_id,
      'generate_run_id', p_run_id,
      'package_sha256', p_export->>'package_sha256'
    )
  );

  for v_row in select value from jsonb_array_elements(p_provenance)
  loop
    if jsonb_typeof(v_row) <> 'object' or (select count(*) from jsonb_object_keys(v_row)) <> 8
       or not (v_row ?& array['pass','claim_hash','claim_text','section','evidence_id','criterion_id','resolution','artifact_id'])
       or v_row->>'artifact_id' is distinct from p_artifact_id::text
       or (v_row->>'pass')::integer not between 1 and 2
       or length(v_row->>'claim_hash') not between 16 and 128
       or length(v_row->>'claim_text') not between 1 and 2000
       or length(v_row->>'section') not between 1 and 500
       or v_row->>'resolution' not in ('cited','unresolved','marked_awaiting','deleted') then
      raise exception 'generate_skill_export_invalid_provenance' using errcode = '22023';
    end if;
    begin v_evidence_id := nullif(v_row->>'evidence_id','')::uuid;
    exception when others then raise exception 'generate_skill_export_invalid_provenance' using errcode = '22023'; end;
    begin v_criterion_id := nullif(v_row->>'criterion_id','')::uuid;
    exception when others then raise exception 'generate_skill_export_invalid_provenance' using errcode = '22023'; end;
    if v_evidence_id is not null and not exists (select 1 from public.evidence where id = v_evidence_id and user_id = v_user_id) then
      raise exception 'generate_skill_export_foreign_evidence' using errcode = '42501';
    end if;
    if v_criterion_id is not null and not exists (select 1 from public.criteria where id = v_criterion_id and user_id = v_user_id) then
      raise exception 'generate_skill_export_foreign_criterion' using errcode = '42501';
    end if;
    insert into public.skill_provenance(user_id, artifact_id, pass, claim_hash, claim_text, section, evidence_id, criterion_id, resolution)
    values (v_user_id, p_artifact_id, (v_row->>'pass')::integer, v_row->>'claim_hash', v_row->>'claim_text', v_row->>'section', v_evidence_id, v_criterion_id, v_row->>'resolution');
  end loop;

  for v_row in select value from jsonb_array_elements(p_memory_links)
  loop
    if jsonb_typeof(v_row) <> 'object' or (select count(*) from jsonb_object_keys(v_row)) <> 6
       or not (v_row ?& array['from_type','from_id','to_type','to_id','edge_type','weight'])
       or v_row->>'from_type' <> 'artifact' or v_row->>'from_id' is distinct from p_artifact_id::text
       or v_row->>'to_type' <> 'memory' or v_row->>'edge_type' <> 'derived_from'
       or (v_row->>'weight')::numeric <> 1 then
      raise exception 'generate_skill_export_invalid_memory_link' using errcode = '22023';
    end if;
    begin v_to_id := (v_row->>'to_id')::uuid;
    exception when others then raise exception 'generate_skill_export_invalid_memory_link' using errcode = '22023'; end;
    if not exists (select 1 from public.user_memory where id = v_to_id and user_id = v_user_id) then
      raise exception 'generate_skill_export_foreign_memory' using errcode = '42501';
    end if;
    insert into public.memory_links(user_id, from_type, from_id, to_type, to_id, edge_type, weight)
    values (v_user_id, 'artifact', p_artifact_id, 'memory', v_to_id, 'derived_from', 1)
    on conflict do nothing;
  end loop;

  v_result := jsonb_build_object(
    'skill_export_id', p_skill_export_id,
    'artifact_id', p_artifact_id,
    'zip_path', p_export->>'zip_path',
    'package_sha256', p_export->>'package_sha256'
  );
  update public.harness_runs set stage = 'ready', status = 'done', error = null,
    stage_detail = v_run.stage_detail || p_stage_detail || jsonb_build_object('result', v_result),
    updated_at = now() where id = p_run_id;
  return v_result || jsonb_build_object('already_finalized', false);
end;
$$;

revoke all on function public.reserve_generate_skill_export_run(text, text, text, text) from public, anon;
revoke all on function public.advance_generate_skill_export_run(uuid, text, jsonb, text) from public, anon;
revoke all on function public.record_generate_skill_export_usage(uuid, integer, text, text, integer, integer, integer, integer, numeric, text) from public, anon;
revoke all on function public.finish_generate_skill_export_run(uuid, text, text, jsonb, text, text) from public, anon;
revoke all on function public.finalize_generate_skill_export_triage(uuid, uuid, jsonb, jsonb, text) from public, anon;
revoke all on function public.finalize_generate_skill_export_run(uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.reserve_generate_skill_export_run(text, text, text, text) to authenticated, service_role;
grant execute on function public.advance_generate_skill_export_run(uuid, text, jsonb, text) to authenticated, service_role;
grant execute on function public.record_generate_skill_export_usage(uuid, integer, text, text, integer, integer, integer, integer, numeric, text) to authenticated, service_role;
grant execute on function public.finish_generate_skill_export_run(uuid, text, text, jsonb, text, text) to authenticated, service_role;
grant execute on function public.finalize_generate_skill_export_triage(uuid, uuid, jsonb, jsonb, text) to authenticated, service_role;
grant execute on function public.finalize_generate_skill_export_run(uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text) to authenticated, service_role;

comment on function public.reserve_generate_skill_export_run(text, text, text, text) is
  'Owner-bound, snapshot-pinned and hard-metered reservation for one portable skill build.';
comment on function public.finalize_generate_skill_export_run(uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text) is
  'Atomically records a generated skill, artifact, cited spans, provenance, lineage and terminal run state.';

commit;
