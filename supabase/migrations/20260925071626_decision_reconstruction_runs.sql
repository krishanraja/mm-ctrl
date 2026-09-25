-- R151 authenticated decision reconstruction and immutable model receipts.
-- Additive, isolated-pilot first. Raw tables remain closed.

create table public.brain_decision_reconstruction_runs (
  id uuid primary key,
  question_id uuid not null,
  decision_version_id uuid not null,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  state text not null default 'pending' check (state in ('pending', 'completed', 'failed')),
  outcome text check (outcome in ('candidate', 'abstain', 'invalid', 'provider_error')),
  provider text not null check (provider = 'openai'),
  model_requested text not null,
  model_returned text,
  provider_response_id text,
  prompt_version text not null,
  schema_version text not null,
  pricing_version text,
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  output_sha256 text check (output_sha256 is null or output_sha256 ~ '^[0-9a-f]{64}$'),
  output_ciphertext text,
  encryption_version smallint,
  candidate_id uuid,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_microusd bigint check (estimated_cost_microusd is null or estimated_cost_microusd >= 0),
  error_code text check (error_code is null or error_code ~ '^[a-z0-9_]{3,80}$'),
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 8 and 200),
  started_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  unique (decision_id, idempotency_key),
  unique (id, question_id, workspace_id, subject_id),
  foreign key (question_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_questions(id, decision_version_id, workspace_id, subject_id) on delete restrict,
  foreign key (candidate_id, workspace_id, subject_id)
    references public.brain_decision_answer_candidates(id, workspace_id, subject_id) on delete restrict,
  check (
    (state = 'pending' and outcome is null and completed_at is null and candidate_id is null
      and model_returned is null and provider_response_id is null and pricing_version is null
      and output_sha256 is null and output_ciphertext is null and encryption_version is null
      and input_tokens is null and output_tokens is null and estimated_cost_microusd is null and error_code is null)
    or
    (state = 'completed' and outcome in ('candidate', 'abstain') and completed_at is not null
      and model_returned is not null and provider_response_id is not null and pricing_version is not null
      and output_sha256 is not null and output_ciphertext is not null and encryption_version = 1
      and input_tokens is not null and output_tokens is not null and estimated_cost_microusd is not null
      and error_code is null
      and ((outcome = 'candidate' and candidate_id is not null) or (outcome = 'abstain' and candidate_id is null)))
    or
    (state = 'failed' and outcome in ('invalid', 'provider_error') and completed_at is not null
      and candidate_id is null and error_code is not null)
  )
);

create index brain_decision_reconstruction_question_idx
  on public.brain_decision_reconstruction_runs (
    question_id, decision_version_id, workspace_id, subject_id, started_at desc
  );
create index brain_decision_reconstruction_actor_idx
  on public.brain_decision_reconstruction_runs (actor_user_id, started_at desc);
create index brain_decision_reconstruction_candidate_idx
  on public.brain_decision_reconstruction_runs (
    candidate_id, workspace_id, subject_id
  );
create unique index brain_decision_reconstruction_one_pending
  on public.brain_decision_reconstruction_runs (question_id) where state = 'pending';

create or replace function private.brain_decision_reconstruction_run_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'brain_decision_reconstruction_run_delete_forbidden';
  end if;
  if old.state <> 'pending' or new.state not in ('completed', 'failed')
    or row(
      old.id, old.question_id, old.decision_version_id, old.decision_id,
      old.workspace_id, old.subject_id, old.actor_user_id, old.provider,
      old.model_requested, old.prompt_version, old.schema_version,
      old.input_sha256, old.idempotency_key, old.started_at
    ) is distinct from row(
      new.id, new.question_id, new.decision_version_id, new.decision_id,
      new.workspace_id, new.subject_id, new.actor_user_id, new.provider,
      new.model_requested, new.prompt_version, new.schema_version,
      new.input_sha256, new.idempotency_key, new.started_at
    )
  then
    raise exception 'brain_decision_reconstruction_run_transition_forbidden';
  end if;
  return new;
end;
$$;

create trigger brain_decision_reconstruction_run_guard
before update or delete on public.brain_decision_reconstruction_runs
for each row execute function private.brain_decision_reconstruction_run_guard();

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
    select 1 from public.brain_decision_answer_candidates
    where question_id = question_row.id and disposition = 'proposed'
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

create or replace function public.commit_brain_decision_reconstruction_candidate_v1(
  p_run_id uuid,
  p_candidate_id uuid,
  p_source_id uuid,
  p_assertion_id uuid,
  p_source_content_ciphertext text,
  p_assertion_ciphertext text,
  p_candidate_ciphertext text,
  p_evidence_refs jsonb,
  p_request_fingerprint_sha256 text,
  p_output_ciphertext text,
  p_output_sha256 text,
  p_model_returned text,
  p_provider_response_id text,
  p_pricing_version text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_microusd bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.brain_decision_reconstruction_runs%rowtype;
  actor_id uuid := (select auth.uid());
  staged jsonb;
begin
  select * into run_row
  from public.brain_decision_reconstruction_runs
  where id = p_run_id
  for update;
  if not found then raise exception 'brain_decision_reconstruction_run_not_found'; end if;
  if run_row.actor_user_id <> actor_id then
    raise exception 'brain_decision_ingress_forbidden' using errcode = '42501';
  end if;
  if run_row.state <> 'pending' then
    raise exception 'brain_decision_reconstruction_run_not_pending';
  end if;
  if p_output_sha256 !~ '^[0-9a-f]{64}$'
    or char_length(btrim(p_model_returned)) not between 3 and 120
    or char_length(btrim(p_provider_response_id)) not between 3 and 200
    or char_length(btrim(p_pricing_version)) not between 3 and 80
    or p_input_tokens < 0 or p_output_tokens < 0 or p_estimated_cost_microusd < 0
  then
    raise exception 'brain_decision_reconstruction_receipt_invalid' using errcode = '22023';
  end if;
  perform private.brain_decision_validate_ciphertext(
    p_output_ciphertext,
    private.brain_decision_cipher_aad_sha256(
      run_row.workspace_id, run_row.subject_id, run_row.id,
      'decision_reconstruction_run', 'output'
    )
  );

  staged := public.stage_grounded_brain_decision_candidate_v1(
    p_candidate_id,
    run_row.question_id,
    p_source_id,
    p_assertion_id,
    'document',
    p_source_content_ciphertext,
    p_assertion_ciphertext,
    p_candidate_ciphertext,
    run_row.started_at,
    p_evidence_refs,
    'reconstruction:' || run_row.id::text,
    p_request_fingerprint_sha256
  );

  update public.brain_decision_reconstruction_runs
  set state = 'completed', outcome = 'candidate', candidate_id = (staged->>'candidate_id')::uuid,
      model_returned = p_model_returned, provider_response_id = p_provider_response_id,
      pricing_version = p_pricing_version, output_sha256 = p_output_sha256,
      output_ciphertext = p_output_ciphertext, encryption_version = 1,
      input_tokens = p_input_tokens, output_tokens = p_output_tokens,
      estimated_cost_microusd = p_estimated_cost_microusd,
      completed_at = statement_timestamp()
  where id = run_row.id;

  return staged || jsonb_build_object('run_id', run_row.id, 'outcome', 'candidate');
end;
$$;

create or replace function public.finish_brain_decision_reconstruction_v1(
  p_run_id uuid,
  p_outcome text,
  p_output_ciphertext text,
  p_output_sha256 text,
  p_model_returned text,
  p_provider_response_id text,
  p_pricing_version text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_microusd bigint,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.brain_decision_reconstruction_runs%rowtype;
  actor_id uuid := (select auth.uid());
begin
  select * into run_row
  from public.brain_decision_reconstruction_runs
  where id = p_run_id
  for update;
  if not found then raise exception 'brain_decision_reconstruction_run_not_found'; end if;
  if run_row.actor_user_id <> actor_id then
    raise exception 'brain_decision_ingress_forbidden' using errcode = '42501';
  end if;
  if run_row.state <> 'pending' then
    raise exception 'brain_decision_reconstruction_run_not_pending';
  end if;
  if p_outcome = 'abstain' then
    if p_output_sha256 !~ '^[0-9a-f]{64}$'
      or char_length(btrim(p_model_returned)) not between 3 and 120
      or char_length(btrim(p_provider_response_id)) not between 3 and 200
      or char_length(btrim(p_pricing_version)) not between 3 and 80
      or p_input_tokens < 0 or p_output_tokens < 0 or p_estimated_cost_microusd < 0
      or p_error_code is not null
    then raise exception 'brain_decision_reconstruction_receipt_invalid' using errcode = '22023'; end if;
    perform private.brain_decision_validate_ciphertext(
      p_output_ciphertext,
      private.brain_decision_cipher_aad_sha256(
        run_row.workspace_id, run_row.subject_id, run_row.id,
        'decision_reconstruction_run', 'output'
      )
    );
    update public.brain_decision_reconstruction_runs
    set state = 'completed', outcome = 'abstain', model_returned = p_model_returned,
        provider_response_id = p_provider_response_id, pricing_version = p_pricing_version,
        output_sha256 = p_output_sha256, output_ciphertext = p_output_ciphertext,
        encryption_version = 1, input_tokens = p_input_tokens,
        output_tokens = p_output_tokens, estimated_cost_microusd = p_estimated_cost_microusd,
        completed_at = statement_timestamp()
    where id = run_row.id;
  elsif p_outcome in ('invalid', 'provider_error') then
    if p_error_code is null or p_error_code !~ '^[a-z0-9_]{3,80}$' then
      raise exception 'brain_decision_reconstruction_error_code_invalid' using errcode = '22023';
    end if;
    update public.brain_decision_reconstruction_runs
    set state = 'failed', outcome = p_outcome, error_code = p_error_code,
        model_returned = nullif(btrim(p_model_returned), ''),
        provider_response_id = nullif(btrim(p_provider_response_id), ''),
        pricing_version = nullif(btrim(p_pricing_version), ''),
        input_tokens = p_input_tokens, output_tokens = p_output_tokens,
        estimated_cost_microusd = p_estimated_cost_microusd,
        completed_at = statement_timestamp()
    where id = run_row.id;
  else
    raise exception 'brain_decision_reconstruction_outcome_invalid' using errcode = '22023';
  end if;
  return jsonb_build_object('run_id', run_row.id, 'state', case when p_outcome = 'abstain' then 'completed' else 'failed' end, 'outcome', p_outcome);
end;
$$;

alter table public.brain_decision_reconstruction_runs enable row level security;
alter table public.brain_decision_reconstruction_runs force row level security;

revoke all on table public.brain_decision_reconstruction_runs
  from public, anon, authenticated, service_role;
grant select on table public.brain_decision_reconstruction_runs to service_role;

revoke all on function public.begin_brain_decision_reconstruction_v1(uuid, uuid, text, text, text, text, text)
  from public, anon, service_role;
revoke all on function public.commit_brain_decision_reconstruction_candidate_v1(uuid, uuid, uuid, uuid, text, text, text, jsonb, text, text, text, text, text, text, integer, integer, bigint)
  from public, anon, service_role;
revoke all on function public.finish_brain_decision_reconstruction_v1(uuid, text, text, text, text, text, text, integer, integer, bigint, text)
  from public, anon, service_role;

grant execute on function public.begin_brain_decision_reconstruction_v1(uuid, uuid, text, text, text, text, text)
  to authenticated;
grant execute on function public.commit_brain_decision_reconstruction_candidate_v1(uuid, uuid, uuid, uuid, text, text, text, jsonb, text, text, text, text, text, text, integer, integer, bigint)
  to authenticated;
grant execute on function public.finish_brain_decision_reconstruction_v1(uuid, text, text, text, text, text, text, integer, integer, bigint, text)
  to authenticated;
