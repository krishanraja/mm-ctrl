begin;

-- A target may have only one live worker for a stage, regardless of the
-- caller's idempotency key. Failed runs remain durable and can be retried.
create unique index if not exists standard_change_stage_runs_one_running_per_target_stage
  on public.standard_change_stage_runs(user_id, change_request_id, stage)
  where status = 'running';

create or replace function public.reject_parallel_standard_change_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'running' and exists (
    select 1
    from public.standard_change_stage_runs existing
    where existing.user_id = new.user_id
      and existing.change_request_id = new.change_request_id
      and existing.stage = new.stage
      and existing.status = 'running'
      and existing.id <> new.id
  ) then
    raise exception 'standard_change_stage_busy' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists standard_change_stage_runs_reject_parallel on public.standard_change_stage_runs;
create trigger standard_change_stage_runs_reject_parallel
before insert or update of status on public.standard_change_stage_runs
for each row execute function public.reject_parallel_standard_change_stage();

revoke all on function public.reject_parallel_standard_change_stage() from public, anon, authenticated;

-- Failure may restore a request only while this exact stage is still the
-- active transition and no durable output for the stage exists. This avoids
-- regressing a request if a stale worker reports failure after progress.
create or replace function public.fail_standard_change_stage(
  p_run_id uuid,
  p_error text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.standard_change_stage_runs%rowtype;
  v_restore text;
  v_in_progress text;
  v_output_exists boolean;
  v_restored_rows integer := 0;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if p_error is null or length(p_error) not between 1 and 1000 then raise exception 'standard_change_invalid_failure' using errcode = '22023'; end if;
  select * into v_run from public.standard_change_stage_runs where id = p_run_id and user_id = v_user_id for update;
  if not found then raise exception 'standard_change_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then return jsonb_build_object('run_id', v_run.id, 'status', v_run.status, 'already_finished', true); end if;

  v_restore := case v_run.stage when 'compile' then 'accepted' when 'build' then 'compiled' else 'built' end;
  v_in_progress := case v_run.stage when 'compile' then 'compiling' when 'build' then 'building' else 'checking' end;
  v_output_exists := case v_run.stage
    when 'compile' then exists (
      select 1 from public.standard_change_compilations where change_request_id = v_run.change_request_id
    )
    when 'build' then exists (
      select 1 from public.standard_change_builds where change_request_id = v_run.change_request_id
    )
    else exists (
      select 1 from public.standard_change_checks where change_request_id = v_run.change_request_id
    )
  end;

  update public.standard_change_stage_runs
  set status = 'failed', error = p_error, updated_at = now()
  where id = v_run.id;

  if not v_output_exists then
    update public.standard_change_requests
    set state = v_restore, updated_at = now()
    where id = v_run.change_request_id and state = v_in_progress;
    get diagnostics v_restored_rows = row_count;
  end if;

  return jsonb_build_object(
    'run_id', v_run.id,
    'status', 'failed',
    'already_finished', false,
    'state_restored', v_restored_rows = 1
  );
end;
$$;

revoke all on function public.fail_standard_change_stage(uuid, text, text) from public, anon;
grant execute on function public.fail_standard_change_stage(uuid, text, text) to authenticated, service_role;

commit;
