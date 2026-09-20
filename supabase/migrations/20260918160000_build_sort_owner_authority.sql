begin;

alter table public.harness_runs
  add column if not exists request_id text;

create unique index if not exists harness_runs_owner_kind_request_unique
  on public.harness_runs(user_id, kind, request_id)
  where request_id is not null;

-- Remove the pre-fingerprint draft overload if this migration is replayed on
-- an isolated project that saw the draft during verification.
drop function if exists public.reserve_build_sort_run(text, text, text, text, jsonb, boolean);

create or replace function public.reserve_build_sort_run(
  p_request_id text,
  p_request_fingerprint text,
  p_surface text,
  p_depth text,
  p_session_label text,
  p_budget jsonb,
  p_can_reach_verified boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.harness_runs%rowtype;
  v_run_id uuid;
  v_daily_runs integer;
  v_spent numeric;
begin
  if v_user_id is null then
    raise exception 'build_sort_auth_required' using errcode = '42501';
  end if;
  if p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or p_request_fingerprint is null or p_request_fingerprint !~ '^[a-f0-9]{64}$'
     or p_surface is null or length(btrim(p_surface)) < 1 or length(p_surface) > 120
     or p_depth not in ('short', 'full')
     or p_session_label is null or length(p_session_label) > 200
     or p_budget is null or jsonb_typeof(p_budget) <> 'object'
     or octet_length(p_budget::text) > 4096
     or p_can_reach_verified is null then
    raise exception 'build_sort_invalid_reservation' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('build-sort:' || v_user_id::text, 0));
  select * into v_existing
  from public.harness_runs
  where user_id = v_user_id and kind = 'sort' and request_id = p_request_id
  limit 1;
  if found then
    if v_existing.stage_detail->>'request_fingerprint' is distinct from p_request_fingerprint then
      raise exception 'build_sort_request_conflict' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'run_id', v_existing.id,
      'stage', v_existing.stage,
      'status', v_existing.status,
      'idempotent', true
    );
  end if;

  select count(*)::integer into v_daily_runs
  from public.harness_runs
  where user_id = v_user_id
    and kind = 'sort'
    and created_at >= date_trunc('day', now());
  select coalesce(sum(est_cost_usd), 0) into v_spent
  from public.ai_usage_audit
  where user_id = v_user_id
    and created_at >= date_trunc('day', now());
  if v_daily_runs >= 5 then
    raise exception 'build_sort_daily_run_limit' using errcode = 'P0001';
  end if;
  if v_spent >= 2.00 then
    raise exception 'build_sort_daily_spend_limit' using errcode = 'P0001';
  end if;

  insert into public.harness_runs(
    user_id, kind, surface, status, stage, request_id, stage_detail
  ) values (
    v_user_id,
    'sort',
    btrim(p_surface),
    'running',
    'planning',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_fingerprint', p_request_fingerprint,
      'depth', p_depth,
      'budget', p_budget,
      'can_reach_verified', p_can_reach_verified
    ) || case
      when p_session_label = '' then '{}'::jsonb
      else jsonb_build_object('session_label', p_session_label)
    end
  )
  returning id into v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'stage', 'planning',
    'status', 'running',
    'idempotent', false,
    'daily_runs_before', v_daily_runs,
    'spent_usd_before', round(v_spent, 6)
  );
end;
$$;

create or replace function public.record_build_sort_usage(
  p_run_id uuid,
  p_provider text,
  p_model text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_total_tokens integer,
  p_latency_ms integer,
  p_est_cost_usd numeric
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
  if v_user_id is null then
    raise exception 'build_sort_auth_required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.harness_runs
    where id = p_run_id and user_id = v_user_id and kind = 'sort'
  ) then
    raise exception 'build_sort_run_not_owned' using errcode = '42501';
  end if;
  if p_provider not in ('openai', 'gemini', 'unknown')
     or p_model is null or length(p_model) < 1 or length(p_model) > 160
     or coalesce(p_prompt_tokens, 0) < 0 or coalesce(p_prompt_tokens, 0) > 10000000
     or coalesce(p_completion_tokens, 0) < 0 or coalesce(p_completion_tokens, 0) > 10000000
     or coalesce(p_total_tokens, 0) < 0 or coalesce(p_total_tokens, 0) > 10000000
     or coalesce(p_latency_ms, 0) < 0 or coalesce(p_latency_ms, 0) > 600000
     or p_est_cost_usd is null or p_est_cost_usd < 0 or p_est_cost_usd > 5 then
    raise exception 'build_sort_invalid_usage' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('build-sort-usage:' || p_run_id::text, 0));
  select id into v_existing_id
  from public.ai_usage_audit
  where user_id = v_user_id
    and function_name = 'build-sort'
    and metadata->>'run_id' = p_run_id::text
  limit 1;
  if found then
    return jsonb_build_object('usage_id', v_existing_id, 'already_recorded', true);
  end if;

  insert into public.ai_usage_audit(
    user_id, function_name, provider, model, purpose, prompt_tokens,
    completion_tokens, total_tokens, latency_ms, status, est_cost_usd, metadata
  ) values (
    v_user_id, 'build-sort', p_provider, p_model, 'build-sort-pairs',
    nullif(p_prompt_tokens, 0), nullif(p_completion_tokens, 0),
    nullif(p_total_tokens, 0), nullif(p_latency_ms, 0), 'ok',
    p_est_cost_usd, jsonb_build_object('run_id', p_run_id)
  )
  returning id into v_usage_id;

  return jsonb_build_object('usage_id', v_usage_id, 'already_recorded', false);
end;
$$;

create or replace function public.finalize_build_sort_run(
  p_run_id uuid,
  p_items jsonb,
  p_stage_detail jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.harness_runs%rowtype;
  v_item jsonb;
  v_item_count integer;
  v_id uuid;
  v_pair_id uuid;
  v_repeat_of uuid;
  v_target uuid;
  v_targets uuid[];
  v_position integer;
  v_min_position integer;
  v_max_position integer;
  v_ids uuid[] := '{}';
  v_positions integer[] := '{}';
begin
  if v_user_id is null then
    raise exception 'build_sort_auth_required' using errcode = '42501';
  end if;
  select * into v_run
  from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'sort'
  for update;
  if not found then
    raise exception 'build_sort_run_not_owned' using errcode = '42501';
  end if;
  if v_run.status = 'done' then
    return jsonb_build_object(
      'run_id', v_run.id,
      'already_finalized', true,
      'items', (select count(*)::integer from public.sort_items where session_id = v_run.id)
    );
  end if;
  if v_run.status <> 'running' then
    raise exception 'build_sort_run_not_running' using errcode = 'P0001';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or p_stage_detail is null or jsonb_typeof(p_stage_detail) <> 'object'
     or octet_length(p_stage_detail::text) > 65536 then
    raise exception 'build_sort_invalid_finalization' using errcode = '22023';
  end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 40 then
    raise exception 'build_sort_invalid_item_count' using errcode = '22023';
  end if;
  if exists (select 1 from public.sort_items where session_id = v_run.id) then
    raise exception 'build_sort_partial_items_present' using errcode = 'P0001';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
       or (select count(*) from jsonb_object_keys(v_item)) <> 11
       or not (v_item ?& array[
         'id', 'surface', 'body', 'origin', 'pair_id', 'pair_role',
         'intended_dimension', 'targets', 'held_out', 'repeat_of', 'position'
       ]) then
      raise exception 'build_sort_invalid_item_shape' using errcode = '22023';
    end if;
    if jsonb_typeof(v_item->'surface') <> 'string'
       or jsonb_typeof(v_item->'body') <> 'string'
       or jsonb_typeof(v_item->'origin') <> 'string'
       or jsonb_typeof(v_item->'targets') <> 'array'
       or jsonb_typeof(v_item->'held_out') <> 'boolean'
       or jsonb_typeof(v_item->'position') <> 'number'
       or jsonb_typeof(v_item->'pair_id') not in ('string', 'null')
       or jsonb_typeof(v_item->'pair_role') not in ('string', 'null')
       or jsonb_typeof(v_item->'intended_dimension') not in ('string', 'null')
       or jsonb_typeof(v_item->'repeat_of') not in ('string', 'null') then
      raise exception 'build_sort_invalid_item_types' using errcode = '22023';
    end if;
    begin
      v_id := (v_item->>'id')::uuid;
      v_position := (v_item->>'position')::integer;
      v_pair_id := case when jsonb_typeof(v_item->'pair_id') = 'null' then null else (v_item->>'pair_id')::uuid end;
      v_repeat_of := case when jsonb_typeof(v_item->'repeat_of') = 'null' then null else (v_item->>'repeat_of')::uuid end;
      v_targets := array(select value::uuid from jsonb_array_elements_text(v_item->'targets'));
    exception when others then
      raise exception 'build_sort_invalid_item_types' using errcode = '22023';
    end;
    if v_id = any(v_ids) or v_position = any(v_positions)
       or v_position < 1
       or v_item->>'surface' is distinct from v_run.surface
       or v_item->>'origin' not in ('own', 'synthesised', 'peer', 'rewrite')
       or v_item->>'body' is null or length(v_item->>'body') < 1 or length(v_item->>'body') > 4000
       or jsonb_typeof(v_item->'held_out') <> 'boolean'
       or jsonb_typeof(v_item->'targets') <> 'array'
       or coalesce(array_length(v_targets, 1), 0) > 1
       or (v_pair_id is null) <> (jsonb_typeof(v_item->'pair_role') = 'null')
       or (v_pair_id is not null and v_item->>'pair_role' not in ('satisfies', 'violates'))
       or (v_item->>'intended_dimension' is not null and length(v_item->>'intended_dimension') > 500)
       or (v_repeat_of is not null and not (v_repeat_of = any(v_ids))) then
      raise exception 'build_sort_invalid_item' using errcode = '22023';
    end if;
    if coalesce(array_length(v_targets, 1), 0) = 1 then
      v_target := v_targets[1];
      if not exists (
        select 1 from public.constructs
        where id = v_target and user_id = v_user_id and status = 'candidate'
      ) then
        raise exception 'build_sort_stale_construct' using errcode = 'P0001';
      end if;
    end if;
    v_ids := array_append(v_ids, v_id);
    v_positions := array_append(v_positions, v_position);
  end loop;

  select min(value), max(value) into v_min_position, v_max_position
  from unnest(v_positions) as value;
  if v_min_position <> 1 or v_max_position <> v_item_count then
    raise exception 'build_sort_non_contiguous_positions' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.sort_items(
      id, user_id, session_id, surface, body, origin, pair_id, pair_role,
      intended_dimension, targets, held_out, repeat_of, position
    ) values (
      (v_item->>'id')::uuid,
      v_user_id,
      v_run.id,
      v_item->>'surface',
      v_item->>'body',
      v_item->>'origin',
      case when jsonb_typeof(v_item->'pair_id') = 'null' then null else (v_item->>'pair_id')::uuid end,
      v_item->>'pair_role',
      v_item->>'intended_dimension',
      array(select value::uuid from jsonb_array_elements_text(v_item->'targets')),
      (v_item->>'held_out')::boolean,
      case when jsonb_typeof(v_item->'repeat_of') = 'null' then null else (v_item->>'repeat_of')::uuid end,
      (v_item->>'position')::integer
    );
  end loop;

  update public.harness_runs
  set stage = 'ready', status = 'done', stage_detail = p_stage_detail, updated_at = now()
  where id = v_run.id;

  return jsonb_build_object(
    'run_id', v_run.id,
    'already_finalized', false,
    'items', v_item_count
  );
end;
$$;

revoke all on function public.reserve_build_sort_run(text, text, text, text, text, jsonb, boolean) from public, anon;
revoke all on function public.record_build_sort_usage(uuid, text, text, integer, integer, integer, integer, numeric) from public, anon;
revoke all on function public.finalize_build_sort_run(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.reserve_build_sort_run(text, text, text, text, text, jsonb, boolean) to authenticated, service_role;
grant execute on function public.record_build_sort_usage(uuid, text, text, integer, integer, integer, integer, numeric) to authenticated, service_role;
grant execute on function public.finalize_build_sort_run(uuid, jsonb, jsonb) to authenticated, service_role;

comment on function public.reserve_build_sort_run(text, text, text, text, text, jsonb, boolean) is
  'Owner-bound idempotent reservation and hard daily spend admission for build-sort.';
comment on function public.record_build_sort_usage(uuid, text, text, integer, integer, integer, integer, numeric) is
  'Owner-bound idempotent model-usage receipt for one reserved build-sort run.';
comment on function public.finalize_build_sort_run(uuid, jsonb, jsonb) is
  'Atomically inserts an owned sort deck and advances its run to ready after rechecking candidate constructs.';

commit;
