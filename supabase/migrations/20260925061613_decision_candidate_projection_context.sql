-- R147 candidate projection context.
-- Returns encrypted display material only through the existing exact-authority RPC.

create or replace function public.read_brain_decision_candidate_v1(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  candidate_row public.brain_decision_answer_candidates%rowtype;
  review_row public.brain_decision_candidate_reviews%rowtype;
  question_row public.brain_decision_questions%rowtype;
  assertion_row public.brain_assertions%rowtype;
  source_row public.brain_sources%rowtype;
begin
  select * into candidate_row
  from public.brain_decision_answer_candidates
  where id = p_candidate_id;
  if not found then raise exception 'brain_decision_candidate_not_found'; end if;
  perform private.brain_decision_ingress_actor(
    candidate_row.workspace_id, candidate_row.subject_id, true
  );

  select * into strict question_row
  from public.brain_decision_questions
  where id = candidate_row.question_id
    and workspace_id = candidate_row.workspace_id
    and subject_id = candidate_row.subject_id;
  select * into strict assertion_row
  from public.brain_assertions
  where id = candidate_row.source_assertion_id
    and workspace_id = candidate_row.workspace_id
    and subject_id = candidate_row.subject_id;
  select * into strict source_row
  from public.brain_sources
  where id = assertion_row.source_id
    and workspace_id = candidate_row.workspace_id
    and subject_id = candidate_row.subject_id;

  select * into review_row
  from public.brain_decision_candidate_reviews
  where candidate_id = p_candidate_id;

  return jsonb_build_object(
    'candidate_id', candidate_row.id,
    'question_id', candidate_row.question_id,
    'decision_id', candidate_row.decision_id,
    'decision_version_id', candidate_row.decision_version_id,
    'workspace_id', candidate_row.workspace_id,
    'subject_id', candidate_row.subject_id,
    'claim_ciphertext', candidate_row.claim_ciphertext,
    'proposed_at', candidate_row.proposed_at,
    'disposition', case when found then review_row.disposition else 'proposed' end,
    'question_prompt_ciphertext', question_row.prompt_ciphertext,
    'question_guidance_ciphertext', question_row.guidance_ciphertext,
    'source_id', source_row.id,
    'source_type', source_row.source_type,
    'source_captured_at', source_row.captured_at,
    'source_content_ciphertext', source_row.content_ciphertext,
    'epistemic_basis', assertion_row.epistemic_basis
  );
end;
$$;

revoke all on function public.read_brain_decision_candidate_v1(uuid)
  from public, anon, service_role;
grant execute on function public.read_brain_decision_candidate_v1(uuid)
  to authenticated;
