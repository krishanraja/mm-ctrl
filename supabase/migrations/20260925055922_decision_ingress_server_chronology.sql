-- R146 decision ingress chronology repair.
-- The client timestamp records when the user acted. The server receipt timestamp
-- records when CTRL created and bound the answer to its immutable provenance atom.

create or replace function public.record_brain_decision_answer_v1(
  p_answer_id uuid,
  p_question_id uuid,
  p_source_id uuid,
  p_assertion_id uuid,
  p_source_content_ciphertext text,
  p_assertion_ciphertext text,
  p_answer_ciphertext text,
  p_recorded_at timestamptz,
  p_idempotency_key text,
  p_request_fingerprint_sha256 text,
  p_candidate_id uuid default null,
  p_candidate_disposition text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  question_row public.brain_decision_questions%rowtype;
  candidate_row public.brain_decision_answer_candidates%rowtype;
  existing_answer public.brain_decision_answers%rowtype;
  answer_atom_id uuid;
  source_digest text;
  review_digest text;
  server_recorded_at timestamptz;
begin
  if p_recorded_at > statement_timestamp()
    or char_length(btrim(p_idempotency_key)) not between 1 and 200
    or p_request_fingerprint_sha256 !~ '^[0-9a-f]{64}$'
    or ((p_candidate_id is null) <> (p_candidate_disposition is null))
    or (p_candidate_disposition is not null and p_candidate_disposition not in ('confirmed', 'corrected'))
  then raise exception 'brain_decision_answer_input_invalid' using errcode = '22023'; end if;
  server_recorded_at := statement_timestamp();

  perform pg_advisory_xact_lock(hashtextextended(
    'answer|' || p_question_id::text || '|' || p_idempotency_key, 0
  ));

  select * into question_row
  from public.brain_decision_questions
  where id = p_question_id;
  if not found then raise exception 'brain_decision_question_not_found'; end if;
  actor_id := private.brain_decision_ingress_actor(
    question_row.workspace_id, question_row.subject_id, false
  );

  select * into existing_answer
  from public.brain_decision_answers
  where question_id = p_question_id
    and idempotency_key = p_idempotency_key;
  if found then
    if existing_answer.request_fingerprint_sha256 = p_request_fingerprint_sha256
    then return jsonb_build_object('status', 'replayed', 'answer_id', existing_answer.id); end if;
    raise exception 'brain_decision_answer_replay_conflict' using errcode = '23505';
  end if;

  if p_candidate_id is not null then
    select * into candidate_row
    from public.brain_decision_answer_candidates
    where id = p_candidate_id
      and question_id = p_question_id
    for key share nowait;
    if not found then raise exception 'brain_decision_candidate_not_found'; end if;
    if exists (
      select 1 from public.brain_decision_candidate_reviews review_row
      where review_row.candidate_id = p_candidate_id
    ) then raise exception 'brain_decision_candidate_already_reviewed'; end if;
  end if;

  perform private.brain_decision_validate_ciphertext(
    p_source_content_ciphertext,
    private.brain_decision_cipher_aad_sha256(
      question_row.workspace_id, question_row.subject_id, p_source_id,
      'decision_source', 'content'
    )
  );
  perform private.brain_decision_validate_ciphertext(
    p_assertion_ciphertext,
    private.brain_decision_cipher_aad_sha256(
      question_row.workspace_id, question_row.subject_id, p_assertion_id,
      'decision_assertion', 'statement'
    )
  );
  perform private.brain_decision_validate_ciphertext(
    p_answer_ciphertext,
    private.brain_decision_cipher_aad_sha256(
      question_row.workspace_id, question_row.subject_id, p_answer_id,
      'decision_answer', 'answer'
    )
  );

  source_digest := encode(sha256(convert_to(p_source_content_ciphertext, 'UTF8')), 'hex');
  insert into public.brain_sources (
    id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
    purpose, audience, integrity_sha256, external_locator,
    content_ciphertext, encryption_version, created_by
  ) values (
    p_source_id, question_row.workspace_id, question_row.subject_id, 'text', actor_id,
    p_recorded_at, 'operator_decision_preparation', 'delivery_team_private',
    source_digest, 'ctrl-decision-source:' || p_answer_id::text,
    p_source_content_ciphertext, 1, actor_id
  );

  insert into public.brain_assertions (
    id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
    audience, statement_ciphertext, encryption_version, source_span_sha256,
    valid_at, created_by
  ) values (
    p_assertion_id, question_row.workspace_id, question_row.subject_id, p_source_id,
    actor_id, 'user_stated', 'delivery_team_private', p_assertion_ciphertext, 1,
    encode(sha256(convert_to(p_assertion_ciphertext, 'UTF8')), 'hex'),
    p_recorded_at, actor_id
  );

  insert into public.brain_decision_answers (
    id, question_id, decision_version_id, workspace_id, subject_id,
    answer_ciphertext, encryption_version, content_sha256,
    source_assertion_id, source_evidence_atom_id, recorded_by, recorded_at,
    idempotency_key, request_fingerprint_sha256
  ) values (
    p_answer_id, question_row.id, question_row.decision_version_id,
    question_row.workspace_id, question_row.subject_id,
    p_answer_ciphertext, 1, repeat('0', 64),
    p_assertion_id, null, actor_id, server_recorded_at,
    p_idempotency_key, p_request_fingerprint_sha256
  ) returning source_evidence_atom_id into answer_atom_id;

  if p_candidate_id is not null then
    review_digest := encode(sha256(convert_to(concat_ws('|',
      p_candidate_id::text, p_candidate_disposition, p_answer_id::text,
      actor_id::text, private.brain_decision_timestamp_token(server_recorded_at),
      p_request_fingerprint_sha256
    ), 'UTF8')), 'hex');
    insert into public.brain_decision_candidate_reviews (
      candidate_id, question_id, decision_version_id, workspace_id, subject_id,
      disposition, answer_id, reviewed_by, reviewed_at,
      idempotency_key, request_fingerprint_sha256, input_sha256
    ) values (
      p_candidate_id, question_row.id, question_row.decision_version_id,
      question_row.workspace_id, question_row.subject_id,
      p_candidate_disposition, p_answer_id, actor_id, server_recorded_at,
      p_idempotency_key, p_request_fingerprint_sha256, review_digest
    );
    insert into public.brain_decision_events (
      decision_id, decision_version_id, workspace_id, subject_id, event_type,
      actor_user_id, idempotency_key, before_ref, after_ref, input_sha256, occurred_at
    ) values (
      question_row.decision_id, question_row.decision_version_id,
      question_row.workspace_id, question_row.subject_id,
      case p_candidate_disposition when 'confirmed' then 'candidate_confirmed' else 'candidate_corrected' end,
      actor_id, p_idempotency_key, p_candidate_id, p_answer_id,
      review_digest, server_recorded_at
    );
  end if;

  return jsonb_build_object(
    'status', 'created', 'answer_id', p_answer_id,
    'evidence_atom_id', answer_atom_id,
    'candidate_id', p_candidate_id,
    'candidate_disposition', p_candidate_disposition,
    'recorded_at', server_recorded_at,
    'source_captured_at', p_recorded_at
  );
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

revoke all on function public.record_brain_decision_answer_v1(uuid, uuid, uuid, uuid, text, text, text, timestamptz, text, text, uuid, text)
  from public, anon, service_role;
grant execute on function public.record_brain_decision_answer_v1(uuid, uuid, uuid, uuid, text, text, text, timestamptz, text, text, uuid, text)
  to authenticated;
