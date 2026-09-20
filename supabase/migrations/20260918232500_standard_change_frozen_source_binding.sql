begin;

-- Capture a non-secret evidence binding alongside the ID set. This lets the
-- proposal gate prove that a cited source, criterion and surface belong
-- together without placing quotes or holdout answers in the manifest.
create or replace function public.build_capture_source_manifest(
  p_user_id uuid,
  p_capture_week text,
  p_window_weeks integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_source jsonb;
  v_snapshot text;
  v_evidence_ids jsonb;
  v_evidence_bindings jsonb;
  v_criteria jsonb;
begin
  v_source := public.current_capture_source(p_user_id, p_capture_week, p_window_weeks);
  v_snapshot := encode(extensions.digest(convert_to((v_source - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');

  select
    coalesce(jsonb_agg(source_id order by source_id), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'source_id', source_id,
      'surface', surface,
      'criterion_id', criterion_id,
      'criterion_name', criterion_name,
      'verdict', verdict,
      'disposition', disposition
    ) order by source_id), '[]'::jsonb)
  into v_evidence_ids, v_evidence_bindings
  from (
    select distinct on (source_id)
      source_id,
      item->>'surface' as surface,
      item->>'criterion_id' as criterion_id,
      item->>'criterion_name' as criterion_name,
      item->>'verdict' as verdict,
      item->>'disposition' as disposition
    from (
      select item, case
        when nullif(item->>'source_run_id', '') is not null and nullif(item->>'source_event_key', '') is not null
          then item->>'source_run_id' || ':' || item->>'source_event_key'
        else item->>'id'
      end as source_id
      from jsonb_array_elements(coalesce(v_source->'ledger', '[]'::jsonb)) item
    ) ledger_rows
    where source_id is not null and length(source_id) between 1 and 240
    order by source_id
  ) bindings;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'surface', c.surface,
    'name', c.name,
    'check_text', c.check_text,
    'observable', c.observable,
    'weight', c.weight,
    'disposition', c.disposition,
    'disc_verdict', c.disc_verdict,
    'version', c.version,
    'provenance', c.provenance
  ) order by c.surface, c.name, c.id), '[]'::jsonb)
  into v_criteria
  from public.criteria c
  where c.user_id = p_user_id and c.is_current = true;

  return jsonb_build_object(
    'schema', 'ctrl.capture.source-manifest.v2',
    'owner_id', p_user_id,
    'capture_week', p_capture_week,
    'source_snapshot', v_snapshot,
    'standard', jsonb_build_object(
      'id', v_source->'standard'->>'id',
      'body_sha256', v_source->'standard'->>'body_sha256'
    ),
    'criteria', v_criteria,
    'evidence_ids', v_evidence_ids,
    'evidence_bindings', v_evidence_bindings
  );
end;
$$;

revoke all on function public.build_capture_source_manifest(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.build_capture_source_manifest(uuid, text, integer) to service_role;

-- Proposal evidence must resolve to the same surface and criterion in the
-- frozen source manifest. IDs alone are not evidence of that relationship.
create or replace function public.validate_capture_proposal_manifest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.capture_runs%rowtype;
  v_source_ids jsonb;
  v_lines jsonb;
  v_criterion_id text;
begin
  select * into v_run from public.capture_runs where id = new.capture_run_id;
  if not found or v_run.user_id <> new.user_id
     or v_run.source_manifest is null or v_run.source_manifest_sha256 is null
     or v_run.source_snapshot <> new.source_snapshot
     or v_run.standard_artifact_id <> new.source_standard_artifact_id
     or v_run.standard_sha256 <> new.source_standard_sha256 then
    raise exception 'capture_proposal_manifest_mismatch' using errcode = '22023';
  end if;

  v_source_ids := coalesce(new.evidence->'source_ids', '[]'::jsonb);
  v_lines := coalesce(new.evidence->'lines', '[]'::jsonb);
  v_criterion_id := new.evidence->>'criterion_id';
  if jsonb_typeof(v_source_ids) <> 'array' or jsonb_array_length(v_source_ids) = 0
     or jsonb_typeof(v_lines) <> 'array'
     or jsonb_array_length(v_lines) <> jsonb_array_length(v_source_ids)
     or jsonb_typeof(coalesce(new.evidence->'surfaces', 'null'::jsonb)) <> 'array'
     or jsonb_array_length(new.evidence->'surfaces') <> 1
     or new.evidence->'surfaces'->>0 <> new.surface
     or not (v_run.source_manifest->'evidence_ids' @> v_source_ids)
     or (select count(distinct value #>> '{}') from jsonb_array_elements(v_source_ids) value) <> jsonb_array_length(v_source_ids)
     or not exists (
       select 1 from jsonb_array_elements(coalesce(v_run.source_manifest->'criteria', '[]'::jsonb)) criterion
       where criterion->>'id' = v_criterion_id and criterion->>'surface' = new.surface
     )
     or exists (
       select 1 from jsonb_array_elements(v_source_ids) value
       where jsonb_typeof(value) <> 'string' or length(value #>> '{}') not between 1 and 240
     )
     or exists (
       select 1 from jsonb_array_elements(v_lines) line
       where jsonb_typeof(line) <> 'object'
          or jsonb_typeof(line->'sourceId') <> 'string'
          or not (v_source_ids @> jsonb_build_array(line->>'sourceId'))
          or (line ? 'quote' and line->'quote' <> 'null'::jsonb)
          or not exists (
            select 1
            from jsonb_array_elements(coalesce(v_run.source_manifest->'evidence_bindings', '[]'::jsonb)) binding
            where binding->>'source_id' = line->>'sourceId'
              and binding->>'surface' = new.surface
              and binding->>'criterion_id' = v_criterion_id
              and binding->>'criterion_name' = line->>'criterion'
              and binding->>'verdict' = line->>'verdict'
              and binding->>'disposition' = line->>'disposition'
          )
     ) then
    raise exception 'capture_proposal_evidence_not_exactly_bound' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_capture_proposal_manifest() from public, anon, authenticated;

-- Freeze the accepted proposal, decision and source manifest inside the
-- request. Downstream stages never reconstruct accepted meaning from mutable
-- source rows.
alter table public.standard_change_requests
  add column if not exists proposal_snapshot jsonb,
  add column if not exists decision_snapshot jsonb,
  add column if not exists source_manifest jsonb;

update public.standard_change_requests request
set proposal_snapshot = jsonb_build_object(
      'id', proposal.id,
      'proposal_hash', proposal.proposal_hash,
      'type', proposal.type,
      'surface', proposal.surface,
      'headline', proposal.headline,
      'delta_text', proposal.delta_text,
      'evidence', proposal.evidence
    ),
    decision_snapshot = jsonb_build_object(
      'id', decision.id,
      'decision_hash', decision.decision_hash
    ),
    source_manifest = capture.source_manifest
from public.proposals proposal, public.proposal_decisions decision, public.capture_runs capture
where proposal.id = request.proposal_id
  and decision.id = request.proposal_decision_id
  and capture.id = proposal.capture_run_id
  and (request.proposal_snapshot is null or request.decision_snapshot is null or request.source_manifest is null);

alter table public.standard_change_requests
  alter column proposal_snapshot set not null,
  alter column decision_snapshot set not null,
  alter column source_manifest set not null;

create or replace function public.queue_standard_change_request_from_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal public.proposals%rowtype;
  v_capture public.capture_runs%rowtype;
  v_proposal_snapshot jsonb;
  v_decision_snapshot jsonb;
  v_payload jsonb;
  v_hash text;
begin
  if new.decision <> 'accepted' then return new; end if;
  select * into v_proposal from public.proposals where id = new.proposal_id and user_id = new.user_id;
  if not found or v_proposal.proposal_hash <> new.proposal_hash
     or v_proposal.capture_run_id is null or v_proposal.source_standard_artifact_id is null then
    raise exception 'standard_change_proposal_lineage_invalid' using errcode = '22023';
  end if;
  if new.scope->>'apply_change' = 'true' then
    raise exception 'standard_change_acceptance_cannot_apply' using errcode = '22023';
  end if;
  select * into v_capture from public.capture_runs where id = v_proposal.capture_run_id;
  if not found or v_capture.user_id <> new.user_id
     or v_capture.source_manifest is null or v_capture.source_manifest_sha256 is null then
    raise exception 'standard_change_source_manifest_required' using errcode = 'P0001';
  end if;

  v_proposal_snapshot := jsonb_build_object(
    'id', v_proposal.id,
    'proposal_hash', v_proposal.proposal_hash,
    'type', v_proposal.type,
    'surface', v_proposal.surface,
    'headline', v_proposal.headline,
    'delta_text', v_proposal.delta_text,
    'evidence', v_proposal.evidence
  );
  v_decision_snapshot := jsonb_build_object('id', new.id, 'decision_hash', new.decision_hash);
  v_payload := jsonb_build_object(
    'schema', 'ctrl.standard-change.request.v2',
    'owner_id', new.user_id,
    'proposal', v_proposal_snapshot,
    'decision', v_decision_snapshot,
    'request_version', 1,
    'source_standard_artifact_id', v_proposal.source_standard_artifact_id,
    'source_standard_sha256', v_proposal.source_standard_sha256,
    'source_snapshot', v_proposal.source_snapshot,
    'source_manifest', v_capture.source_manifest,
    'source_manifest_sha256', v_capture.source_manifest_sha256,
    'surface', v_proposal.surface,
    'change_type', v_proposal.type,
    'accepted_scope', new.scope
  );
  v_hash := encode(extensions.digest(convert_to(v_payload::text, 'UTF8'), 'sha256'), 'hex');
  insert into public.standard_change_requests(
    user_id, proposal_id, proposal_decision_id, request_version, request_hash,
    proposal_hash, decision_hash, source_standard_artifact_id, source_standard_sha256,
    source_snapshot, source_manifest_sha256, surface, change_type, accepted_scope,
    proposal_snapshot, decision_snapshot, source_manifest
  ) values (
    new.user_id, v_proposal.id, new.id, 1, v_hash,
    v_proposal.proposal_hash, new.decision_hash, v_proposal.source_standard_artifact_id,
    v_proposal.source_standard_sha256, v_proposal.source_snapshot,
    v_capture.source_manifest_sha256, v_proposal.surface, v_proposal.type, new.scope,
    v_proposal_snapshot, v_decision_snapshot, v_capture.source_manifest
  ) on conflict (proposal_decision_id) do nothing;
  return new;
end;
$$;

create or replace function public.current_standard_change_packet(p_request public.standard_change_requests)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_request.id,
    'version', p_request.request_version,
    'request_hash', p_request.request_hash,
    'surface', p_request.surface,
    'accepted_scope', p_request.accepted_scope,
    'proposal', p_request.proposal_snapshot,
    'decision', p_request.decision_snapshot,
    'source', jsonb_build_object(
      'standard_artifact_id', p_request.source_standard_artifact_id,
      'standard_sha256', p_request.source_standard_sha256,
      'source_snapshot', p_request.source_snapshot,
      'source_manifest_sha256', p_request.source_manifest_sha256,
      'evidence_ids', coalesce(p_request.source_manifest->'evidence_ids', '[]'::jsonb),
      'evidence_bindings', coalesce(p_request.source_manifest->'evidence_bindings', '[]'::jsonb),
      'criteria', coalesce(p_request.source_manifest->'criteria', '[]'::jsonb)
    )
  );
$$;

revoke all on function public.current_standard_change_packet(public.standard_change_requests) from public, anon, authenticated;

create or replace function public.assert_standard_change_source_current(p_request public.standard_change_requests)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_artifact public.generated_artifacts%rowtype;
  v_latest public.generated_artifacts%rowtype;
  v_sha text;
  v_current_criteria jsonb;
begin
  if encode(extensions.digest(convert_to(p_request.source_manifest::text, 'UTF8'), 'sha256'), 'hex') <> p_request.source_manifest_sha256 then
    raise exception 'standard_change_frozen_manifest_hash_changed' using errcode = 'P0001';
  end if;
  select * into v_artifact from public.generated_artifacts
  where id = p_request.source_standard_artifact_id and user_id = p_request.user_id and kind = 'standard';
  if not found then raise exception 'standard_change_source_missing' using errcode = 'P0001'; end if;
  v_sha := encode(extensions.digest(convert_to(v_artifact.body, 'UTF8'), 'sha256'), 'hex');
  if v_sha <> p_request.source_standard_sha256 then
    raise exception 'standard_change_source_hash_changed' using errcode = 'P0001';
  end if;
  select * into v_latest from public.generated_artifacts
  where user_id = p_request.user_id and kind = 'standard'
  order by created_at desc, id desc limit 1;
  if not found or v_latest.id <> p_request.source_standard_artifact_id
     or encode(extensions.digest(convert_to(v_latest.body, 'UTF8'), 'sha256'), 'hex') <> p_request.source_standard_sha256 then
    raise exception 'standard_change_source_stale' using errcode = 'P0001';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'surface', c.surface,
    'name', c.name,
    'check_text', c.check_text,
    'observable', c.observable,
    'weight', c.weight,
    'disposition', c.disposition,
    'disc_verdict', c.disc_verdict,
    'version', c.version,
    'provenance', c.provenance
  ) order by c.surface, c.name, c.id), '[]'::jsonb)
  into v_current_criteria
  from public.criteria c
  where c.user_id = p_request.user_id and c.is_current = true;
  if v_current_criteria <> coalesce(p_request.source_manifest->'criteria', '[]'::jsonb) then
    raise exception 'standard_change_criteria_stale' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'source_body', v_artifact.body,
    'current_standard_artifact_id', v_latest.id,
    'current_standard_sha256', p_request.source_standard_sha256
  );
end;
$$;

revoke all on function public.assert_standard_change_source_current(public.standard_change_requests) from public, anon, authenticated;

revoke all on function public.queue_standard_change_request_from_decision() from public, anon, authenticated;

commit;
