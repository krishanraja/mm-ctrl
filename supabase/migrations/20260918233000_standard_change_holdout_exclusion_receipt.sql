begin;

alter table public.standard_change_builds
  add column if not exists holdout_manifest_sha256 text not null default 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  add column if not exists holdout_item_count integer not null default 0 check (holdout_item_count >= 0),
  add column if not exists holdout_intersection_count integer not null default 0 check (holdout_intersection_count >= 0);

create or replace function public.seal_standard_change_holdout_exclusion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_manifest jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', item.id,
    'body_sha256', encode(extensions.digest(convert_to(item.body, 'UTF8'), 'sha256'), 'hex'),
    'answer_sha256', encode(extensions.digest(convert_to(grade.verdict || ':' || coalesce(grade.why, ''), 'UTF8'), 'sha256'), 'hex'),
    'dimension_sha256', case when item.intended_dimension is null then null else
      encode(extensions.digest(convert_to(item.intended_dimension, 'UTF8'), 'sha256'), 'hex') end
  ) order by item.id), '[]'::jsonb)
  into v_manifest
  from public.sort_items item
  join public.sort_grades grade on grade.item_id = item.id and grade.user_id = item.user_id
  where item.user_id = new.user_id
    and item.held_out = true
    and item.repeat_of is null
    and grade.verdict <> 'skip';

  new.holdout_manifest_sha256 := encode(
    extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'),
    'hex'
  );
  new.holdout_item_count := jsonb_array_length(v_manifest);
  select count(*)::integer
  into new.holdout_intersection_count
  from public.sort_items item
  join public.sort_grades grade on grade.item_id = item.id and grade.user_id = item.user_id
  where item.user_id = new.user_id
    and item.held_out = true
    and item.repeat_of is null
    and grade.verdict <> 'skip'
    and (
      (length(item.body) >= 12 and strpos(new.runtime_body, item.body) > 0)
      or (length(coalesce(grade.why, '')) >= 12 and strpos(new.runtime_body, grade.why) > 0)
      or (length(coalesce(item.intended_dimension, '')) >= 12 and strpos(new.runtime_body, item.intended_dimension) > 0)
    );

  if new.holdout_intersection_count <> 0 then
    raise exception 'standard_change_holdout_contamination' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists standard_change_builds_seal_holdout_exclusion on public.standard_change_builds;
create trigger standard_change_builds_seal_holdout_exclusion
before insert on public.standard_change_builds
for each row execute function public.seal_standard_change_holdout_exclusion();

revoke all on function public.seal_standard_change_holdout_exclusion() from public, anon, authenticated;

create or replace function public.reserve_standard_change_check(
  p_request_id text,
  p_request_fingerprint text,
  p_build_id uuid,
  p_expected_package_sha256 text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_build public.standard_change_builds%rowtype;
  v_compile public.standard_change_compilations%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_existing public.standard_change_stage_runs%rowtype;
  v_run_id uuid;
  v_source jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if p_request_id !~ '^[A-Za-z0-9_-]{16,120}$' or p_request_fingerprint !~ '^[0-9a-f]{64}$'
     or p_expected_package_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'standard_change_invalid_check_reservation' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('standard-change:check:' || v_user_id::text || ':' || p_build_id::text, 0));
  select * into v_existing from public.standard_change_stage_runs
  where user_id = v_user_id and stage = 'check' and request_id = p_request_id;
  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then raise exception 'standard_change_request_conflict' using errcode = '23505'; end if;
    return jsonb_build_object('run_id', v_existing.id, 'status', v_existing.status, 'result', v_existing.result, 'idempotent', true);
  end if;
  select * into v_build from public.standard_change_builds where id = p_build_id and user_id = v_user_id;
  if not found then raise exception 'standard_change_build_not_owned' using errcode = '42501'; end if;
  if v_build.package_sha256 <> p_expected_package_sha256 then raise exception 'standard_change_build_changed' using errcode = 'P0001'; end if;
  select * into v_compile from public.standard_change_compilations where id = v_build.compilation_id and user_id = v_user_id;
  select * into v_change from public.standard_change_requests where id = v_build.change_request_id for update;
  if v_change.state not in ('built', 'checking') then raise exception 'standard_change_not_check_ready' using errcode = 'P0001'; end if;
  if exists (select 1 from public.standard_change_checks where build_id = v_build.id) then raise exception 'standard_change_already_checked' using errcode = '23505'; end if;
  v_source := public.assert_standard_change_source_current(v_change);
  insert into public.standard_change_stage_runs(user_id, change_request_id, stage, request_id, request_fingerprint)
  values (v_user_id, v_change.id, 'check', p_request_id, p_request_fingerprint) returning id into v_run_id;
  update public.standard_change_requests set state = 'checking', updated_at = now() where id = v_change.id;
  return jsonb_build_object(
    'run_id', v_run_id, 'status', 'running', 'idempotent', false,
    'request', public.current_standard_change_packet(v_change),
    'compiled', v_compile.compiled, 'compile_sha256', v_compile.compile_sha256,
    'build', jsonb_build_object(
      'schema', 'ctrl.standard-change.build.v1',
      'runtime_body', v_build.runtime_body, 'runtime_sha256', v_build.runtime_sha256,
      'evaluation_manifest', v_build.evaluation_manifest, 'evaluation_sha256', v_build.evaluation_sha256,
      'build_manifest', v_build.build_manifest, 'build_manifest_sha256', v_build.build_manifest_sha256,
      'package_sha256', v_build.package_sha256
    ),
    'holdout_receipt', jsonb_build_object(
      'manifest_sha256', v_build.holdout_manifest_sha256,
      'item_count', v_build.holdout_item_count,
      'intersection_count', v_build.holdout_intersection_count
    ),
    'source_body', v_source->>'source_body',
    'current_standard_artifact_id', v_source->>'current_standard_artifact_id',
    'current_standard_sha256', v_source->>'current_standard_sha256'
  );
end;
$$;

revoke all on function public.reserve_standard_change_check(text, text, uuid, text, text) from public, anon;
grant execute on function public.reserve_standard_change_check(text, text, uuid, text, text) to authenticated, service_role;

create or replace function public.validate_standard_change_check_holdout_receipt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_build public.standard_change_builds%rowtype;
begin
  select * into v_build from public.standard_change_builds
  where id = new.build_id and user_id = new.user_id;
  if not found
     or v_build.holdout_intersection_count <> 0
     or new.result->'frozen'->>'holdout_manifest_sha256' <> v_build.holdout_manifest_sha256
     or not exists (
       select 1 from jsonb_array_elements(coalesce(new.findings, '[]'::jsonb)) finding
       where finding->>'criterion_id' = 'holdout.exclusion'
         and finding->>'status' = 'holds'
     ) then
    raise exception 'standard_change_holdout_receipt_invalid' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists standard_change_checks_validate_holdout_receipt on public.standard_change_checks;
create trigger standard_change_checks_validate_holdout_receipt
before insert on public.standard_change_checks
for each row execute function public.validate_standard_change_check_holdout_receipt();

revoke all on function public.validate_standard_change_check_holdout_receipt() from public, anon, authenticated;

commit;
