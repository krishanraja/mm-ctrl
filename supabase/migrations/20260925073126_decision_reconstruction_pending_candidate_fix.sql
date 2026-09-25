-- R151.1: an answer candidate's disposition lives in its append-only review row.
-- The reconstruction gate therefore blocks only candidates with no review yet.

create or replace function public.begin_brain_decision_reconstruction_v1(
  p_run_id uuid,
  p_question_id uuid,
  p_idempotency_key text,
  p_provider text,
  p_model_requested text,
  p_prompt_version text,
  p_schema_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  question_row public.brain_decision_questions%rowtype;
  version_row public.brain_decision_versions%rowtype;
  existing_run public.brain_decision_reconstruction_runs%rowtype;
  prior_row public.brain_decision_human_priors%rowtype;
  packet_value jsonb;
  input_digest text;
begin
  if p_provider <> 'openai'
    or char_length(btrim(p_model_requested)) not between 3 and 120
    or char_length(btrim(p_prompt_version)) not between 3 and 80
    or char_length(btrim(p_schema_version)) not between 3 and 80
    or char_length(btrim(p_idempotency_key)) not between 8 and 200
  then
    raise exception 'brain_decision_reconstruction_input_invalid' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('reconstruction|' || p_question_id::text, 0));

  select * into question_row
  from public.brain_decision_questions
  where id = p_question_id;
  if not found then raise exception 'brain_decision_question_not_found'; end if;

  select * into version_row
  from public.brain_decision_versions
  where id = question_row.decision_version_id
  for key share;
  if not found
    or version_row.standing <> 'sealed'
    or version_row.fresh_until <= statement_timestamp()
    or question_row.kind <> 'leader_can_answer'
    or question_row.answer_mode = 'operator_research'
    or question_row.operator_state <> 'asked'
    or exists (
      select 1 from public.brain_decision_answers answer_row
      where answer_row.question_id = question_row.id
    )
  then
    raise exception 'brain_decision_reconstruction_question_ineligible';
  end if;

  actor_id := private.brain_decision_ingress_actor(
    question_row.workspace_id, question_row.subject_id, true
  );

  select * into prior_row
  from public.brain_decision_human_priors
  where decision_version_id = question_row.decision_version_id
    and superseded_at is null;

  with eligible as (
    select
      link.evidence_atom_id,
      link.assertion_id,
      link.stance,
      link.artifact_kind,
      atom.assertion_snapshot,
      atom.source_snapshot,
      atom.atom_sha256,
      row_number() over (
        partition by link.evidence_atom_id
        order by
          case link.artifact_kind when 'question' then 1 when 'current_read' then 2 when 'route' then 3 else 4 end,
          case link.stance when 'refutes' then 1 when 'supports' then 2 else 3 end,
          link.id
      ) as preference
    from public.brain_decision_evidence_links link
    join public.brain_decision_evidence_atoms atom
      on atom.id = link.evidence_atom_id
      and atom.assertion_id = link.assertion_id
      and atom.workspace_id = link.workspace_id
      and atom.subject_id = link.subject_id
    where link.decision_version_id = question_row.decision_version_id
      and link.workspace_id = question_row.workspace_id
      and link.subject_id = question_row.subject_id
      and (
        (link.artifact_kind = 'question' and link.artifact_id = question_row.id)
        or (link.artifact_kind = 'route' and link.artifact_id = question_row.route_id)
        or (link.artifact_kind in ('current_read', 'recommended_move') and link.artifact_id = question_row.decision_version_id)
      )
  ), chosen as (
    select * from eligible where preference = 1
  )
  select jsonb_build_object(
    'decision_id', question_row.decision_id,
    'decision_version_id', question_row.decision_version_id,
    'question_id', question_row.id,
    'workspace_id', question_row.workspace_id,
    'subject_id', question_row.subject_id,
    'title_ciphertext', version_row.title_ciphertext,
    'stakes_ciphertext', version_row.stakes_ciphertext,
    'human_prior_id', prior_row.id,
    'human_prior_ciphertext', prior_row.position_ciphertext,
    'question_ciphertext', question_row.prompt_ciphertext,
    'evidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'evidence_atom_id', evidence_atom_id,
        'assertion_id', assertion_id,
        'stance', stance,
        'source_type', source_snapshot->>'source_type',
        'epistemic_basis', assertion_snapshot->>'epistemic_basis',
        'captured_at_us', source_snapshot->>'captured_at_us',
        'statement_ciphertext', assertion_snapshot->>'statement_ciphertext',
        'atom_sha256', atom_sha256
      ) order by evidence_atom_id)
      from chosen
    ), '[]'::jsonb)
  ) into packet_value;

  if jsonb_array_length(packet_value->'evidence') > 24 then
    raise exception 'brain_decision_reconstruction_packet_too_large';
  end if;

  input_digest := encode(sha256(convert_to(
    jsonb_build_object(
      'packet', packet_value,
      'provider', p_provider,
      'model_requested', p_model_requested,
      'prompt_version', p_prompt_version,
      'schema_version', p_schema_version
    )::text,
    'UTF8'
  )), 'hex');

  select * into existing_run
  from public.brain_decision_reconstruction_runs
  where decision_id = question_row.decision_id
    and idempotency_key = p_idempotency_key;
  if found then
    if existing_run.question_id <> question_row.id
      or existing_run.actor_user_id <> actor_id
      or existing_run.provider <> p_provider
      or existing_run.model_requested <> p_model_requested
      or existing_run.prompt_version <> p_prompt_version
      or existing_run.schema_version <> p_schema_version
      or existing_run.input_sha256 <> input_digest
    then
      raise exception 'brain_decision_reconstruction_replay_conflict' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'status', 'replayed',
      'run_id', existing_run.id,
      'state', existing_run.state,
      'workspace_id', existing_run.workspace_id,
      'subject_id', existing_run.subject_id,
      'outcome', existing_run.outcome,
      'candidate_id', existing_run.candidate_id,
      'output_ciphertext', existing_run.output_ciphertext,
      'model_returned', existing_run.model_returned,
      'provider_response_id', existing_run.provider_response_id,
      'pricing_version', existing_run.pricing_version,
      'input_tokens', existing_run.input_tokens,
      'output_tokens', existing_run.output_tokens,
      'estimated_cost_microusd', existing_run.estimated_cost_microusd,
      'error_code', existing_run.error_code
    );
  end if;

  if exists (
    select 1 from public.brain_decision_reconstruction_runs
    where question_id = question_row.id and state = 'pending'
  ) then
    raise exception 'brain_decision_reconstruction_busy_retry' using errcode = '55P03';
  end if;
  if exists (
    select 1
    from public.brain_decision_answer_candidates candidate
    where candidate.question_id = question_row.id
      and not exists (
        select 1
        from public.brain_decision_candidate_reviews review
        where review.candidate_id = candidate.id
      )
  ) then
    raise exception 'brain_decision_reconstruction_candidate_pending';
  end if;

  insert into public.brain_decision_reconstruction_runs (
    id, question_id, decision_version_id, decision_id, workspace_id, subject_id,
    actor_user_id, provider, model_requested, prompt_version, schema_version,
    input_sha256, idempotency_key
  ) values (
    p_run_id, question_row.id, question_row.decision_version_id, question_row.decision_id,
    question_row.workspace_id, question_row.subject_id, actor_id, p_provider,
    p_model_requested, p_prompt_version, p_schema_version, input_digest, p_idempotency_key
  );

  return jsonb_build_object(
    'status', 'created',
    'run_id', p_run_id,
    'state', 'pending',
    'packet', packet_value,
    'input_sha256', input_digest
  );
end;
$$;
