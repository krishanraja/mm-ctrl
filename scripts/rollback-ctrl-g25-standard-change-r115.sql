begin;

drop trigger if exists proposal_decisions_queue_standard_change on public.proposal_decisions;
drop trigger if exists proposals_validate_capture_manifest on public.proposals;
drop trigger if exists capture_runs_set_source_manifest on public.capture_runs;
drop trigger if exists standard_change_checks_validate_holdout_receipt on public.standard_change_checks;
drop trigger if exists standard_change_builds_seal_holdout_exclusion on public.standard_change_builds;
drop trigger if exists standard_change_stage_runs_reject_parallel on public.standard_change_stage_runs;

drop function if exists public.reserve_standard_change_compile(text, text, uuid, text, text);
drop function if exists public.finalize_standard_change_compile(uuid, jsonb, text, text);
drop function if exists public.reserve_standard_change_build(text, text, uuid, text, text);
drop function if exists public.finalize_standard_change_build(uuid, uuid, jsonb, text);
drop function if exists public.reserve_standard_change_check(text, text, uuid, text, text);
drop function if exists public.finalize_standard_change_check(uuid, uuid, jsonb, text, text);
drop function if exists public.fail_standard_change_stage(uuid, text, text);
drop function if exists public.validate_standard_change_check_holdout_receipt();
drop function if exists public.seal_standard_change_holdout_exclusion();
drop function if exists public.reject_parallel_standard_change_stage();
drop function if exists public.current_standard_change_packet(public.standard_change_requests);
drop function if exists public.assert_standard_change_source_current(public.standard_change_requests);
drop function if exists public.assert_standard_change_pipeline_capability(text);
drop function if exists public.queue_standard_change_request_from_decision();
drop function if exists public.validate_capture_proposal_manifest();
drop function if exists public.set_capture_source_manifest();
drop function if exists public.build_capture_source_manifest(uuid, text, integer);

drop table if exists public.standard_change_checks;
drop table if exists public.standard_change_builds;
drop table if exists public.standard_change_compilations;
drop table if exists public.standard_change_stage_runs;
drop table if exists public.standard_change_requests;

alter table public.proposal_decisions drop constraint if exists proposal_decisions_id_user_unique;
alter table public.proposals drop constraint if exists proposals_id_user_unique;
alter table public.capture_runs drop constraint if exists capture_runs_source_manifest_sha_check;
alter table public.capture_runs drop column if exists source_manifest_sha256;
alter table public.capture_runs drop column if exists source_manifest;

create or replace function public.decide_capture_proposal(
  p_proposal_id uuid,
  p_expected_hash text,
  p_decision text,
  p_scope jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals%rowtype;
  v_decision_hash text;
begin
  if v_user_id is null then raise exception 'capture_decision_auth_required' using errcode = '42501'; end if;
  if p_decision not in ('accepted', 'rejected', 'needs_evidence', 'superseded')
     or jsonb_typeof(p_scope) <> 'object' then
    raise exception 'capture_decision_invalid' using errcode = '22023';
  end if;
  select * into v_proposal from public.proposals
  where id = p_proposal_id and user_id = v_user_id for update;
  if not found then raise exception 'capture_proposal_not_owned' using errcode = '42501'; end if;
  if v_proposal.proposal_hash <> p_expected_hash then raise exception 'capture_proposal_changed' using errcode = '40001'; end if;
  if v_proposal.status <> 'awaiting' then raise exception 'capture_proposal_already_decided' using errcode = '23505'; end if;
  if p_decision = 'accepted' and p_scope = '{}'::jsonb then raise exception 'capture_acceptance_scope_required' using errcode = '22023'; end if;
  if v_proposal.type = 'drift' and not (p_scope->>'freshness_decision' in ('retain', 'revise', 'gather_evidence', 'retire')) then
    raise exception 'capture_freshness_decision_required' using errcode = '22023';
  end if;
  v_decision_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'proposal_id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
    'decision', p_decision, 'scope', p_scope, 'owner', v_user_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into public.proposal_decisions(proposal_id, user_id, proposal_hash, decision, scope, decision_hash)
  values (v_proposal.id, v_user_id, v_proposal.proposal_hash, p_decision, p_scope, v_decision_hash);
  update public.proposals
  set status = p_decision, decided_at = now(), decided_by = v_user_id, decision_scope = p_scope
  where id = v_proposal.id;
  return jsonb_build_object(
    'proposal_id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
    'decision', p_decision, 'decision_hash', v_decision_hash,
    'change_applied', false,
    'next', case when p_decision = 'accepted' then 'versioned_change_request' else null end
  );
end;
$$;

revoke all on function public.decide_capture_proposal(uuid, text, text, jsonb) from public, anon;
grant execute on function public.decide_capture_proposal(uuid, text, text, jsonb) to authenticated;

delete from vault.secrets where name = 'standard_change_pipeline_rpc_secret';

commit;
