begin;

-- R116 rollback is intentionally history-preserving. It restores the exact
-- pre-R116 active state, records a new rollback head when required, and then
-- removes only the R116 control-plane schema. Unknown later heads make the
-- operation fail closed rather than guessing.

-- Freeze every R116 authority surface plus the two active-head stores before
-- deriving any snapshot. This closes the preflight-to-mutation race against
-- owner RPCs and administrative criteria or artifact writers.
lock table
  public.standard_change_owner_decisions,
  public.standard_change_review_packets,
  public.standard_change_reversals,
  public.standard_change_applications,
  public.standard_versions,
  public.standard_change_requests,
  public.generated_artifacts,
  public.criteria
in access exclusive mode nowait;

create temp table r116_affected_requests on commit drop as
select distinct change_request_id
from public.standard_change_review_packets;

create temp table r116_owned_standard_heads on commit drop as
select
  artifact_id,
  user_id,
  criteria_snapshot,
  criteria_sha256
from public.standard_versions;

create temp table r116_restore_plan on commit drop as
select distinct on (a.user_id)
  a.user_id,
  a.source_standard_artifact_id,
  a.source_standard_sha256,
  a.criteria_before,
  a.criteria_before_sha256
from public.standard_change_applications a
order by a.user_id, a.created_at, a.id;

do $$
declare
  plan r116_restore_plan%rowtype;
  current_head public.generated_artifacts%rowtype;
  expected_head r116_owned_standard_heads%rowtype;
  current_criteria jsonb;
begin
  for plan in select * from r116_restore_plan
  loop
    select * into current_head
    from public.generated_artifacts ga
    where ga.user_id = plan.user_id and ga.kind = 'standard'
    order by ga.created_at desc, ga.id desc
    limit 1;

    select * into expected_head
    from r116_owned_standard_heads owned
    where owned.user_id = plan.user_id
      and owned.artifact_id = current_head.id;
    if not found then
      raise exception 'r116_rollback_unknown_later_standard_head' using errcode = 'P0001';
    end if;

    current_criteria := public.current_standard_criteria_snapshot(plan.user_id);
    if current_criteria <> expected_head.criteria_snapshot
       or public.standard_change_json_sha256(current_criteria) <> expected_head.criteria_sha256 then
      raise exception 'r116_rollback_unknown_later_criteria_head' using errcode = 'P0001';
    end if;
  end loop;
end $$;

do $$
declare
  plan r116_restore_plan%rowtype;
  restored_count integer;
  expected_count integer;
  restored_snapshot jsonb;
  current_head public.generated_artifacts%rowtype;
  source_artifact public.generated_artifacts%rowtype;
begin
  for plan in select * from r116_restore_plan
  loop
    update public.criteria
    set is_current = false
    where user_id = plan.user_id and is_current = true;

    select jsonb_array_length(plan.criteria_before) into expected_count;
    update public.criteria c
    set is_current = true
    where c.user_id = plan.user_id
      and c.id in (
        select (value->>'id')::uuid
        from jsonb_array_elements(plan.criteria_before)
      );
    get diagnostics restored_count = row_count;
    if restored_count <> expected_count then
      raise exception 'r116_rollback_prior_criteria_missing' using errcode = 'P0001';
    end if;

    restored_snapshot := public.current_standard_criteria_snapshot(plan.user_id);
    if restored_snapshot <> plan.criteria_before
       or public.standard_change_json_sha256(restored_snapshot) <> plan.criteria_before_sha256 then
      raise exception 'r116_rollback_criteria_mismatch' using errcode = 'P0001';
    end if;

    select * into source_artifact
    from public.generated_artifacts
    where id = plan.source_standard_artifact_id
      and user_id = plan.user_id
      and kind = 'standard';
    if not found
       or public.standard_change_text_sha256(source_artifact.body) <> plan.source_standard_sha256 then
      raise exception 'r116_rollback_source_standard_missing_or_changed' using errcode = 'P0001';
    end if;

    select * into current_head
    from public.generated_artifacts
    where user_id = plan.user_id and kind = 'standard'
    order by created_at desc, id desc
    limit 1;

    if public.standard_change_text_sha256(current_head.body) <> plan.source_standard_sha256 then
      insert into public.generated_artifacts(user_id, kind, name, body, metadata, created_at)
      values (
        plan.user_id,
        'standard',
        source_artifact.name,
        source_artifact.body,
        source_artifact.metadata || jsonb_build_object(
          'status', 'active',
          'r116_rollback', true,
          'restored_from_artifact_id', source_artifact.id,
          'criteria_snapshot_sha256', plan.criteria_before_sha256,
          'deploy_authorized', false,
          'release_authorized', false
        ),
        clock_timestamp()
      );
    end if;
  end loop;
end $$;

update public.standard_change_requests request
set state = 'checked', updated_at = now()
where request.id in (select change_request_id from r116_affected_requests);

drop function if exists public.reverse_standard_change_application(uuid, text, text, text, text);
drop function if exists public.decide_standard_change_review(uuid, text, text, text, text, text);
drop function if exists public.prepare_standard_change_review(uuid, text);
drop function if exists public.render_governed_standard_body(text, uuid, text, text, text, text, jsonb);
drop function if exists public.current_standard_criteria_snapshot(uuid);
drop function if exists public.standard_change_text_sha256(text);
drop function if exists public.standard_change_json_sha256(jsonb);

drop table if exists public.standard_versions;
drop table if exists public.standard_change_reversals;
drop table if exists public.standard_change_applications;
drop table if exists public.standard_change_owner_decisions;
drop table if exists public.standard_change_review_packets;

alter table public.standard_change_checks
  drop constraint if exists standard_change_checks_id_user_unique;

alter table public.standard_change_requests
  drop constraint if exists standard_change_requests_state_check;
alter table public.standard_change_requests
  add constraint standard_change_requests_state_check check (state in (
    'accepted', 'compiling', 'compiled', 'building', 'built', 'checking',
    'checked', 'needs_evidence', 'blocked'
  ));

commit;
