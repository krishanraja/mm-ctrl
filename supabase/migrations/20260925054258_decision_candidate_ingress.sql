-- G25 R146 decision archaeology and human-confirmation ingress.
-- Additive, isolated-pilot first. Raw tables remain closed.

alter table public.brain_decision_answers
  add column idempotency_key text,
  add column request_fingerprint_sha256 text;

alter table public.brain_decision_answers
  add constraint brain_decision_answers_idempotency_key_check
    check (idempotency_key is null or char_length(btrim(idempotency_key)) between 1 and 200),
  add constraint brain_decision_answers_request_fingerprint_check
    check (request_fingerprint_sha256 is null or request_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
  add constraint brain_decision_answers_request_pair_check
    check ((idempotency_key is null) = (request_fingerprint_sha256 is null));

create unique index brain_decision_answers_request_unique
  on public.brain_decision_answers (question_id, idempotency_key)
  where idempotency_key is not null;

create table public.brain_decision_answer_candidates (
  id uuid primary key,
  question_id uuid not null,
  decision_version_id uuid not null,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  claim_ciphertext text not null,
  encryption_version smallint not null check (encryption_version = 1),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_assertion_id uuid not null,
  source_evidence_atom_id uuid not null,
  proposed_by uuid not null references auth.users(id) on delete restrict,
  proposed_at timestamptz not null,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 1 and 200),
  request_fingerprint_sha256 text not null check (request_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
  unique (decision_id, idempotency_key),
  unique (id, question_id, decision_version_id, workspace_id, subject_id),
  foreign key (question_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_questions(id, decision_version_id, workspace_id, subject_id) on delete restrict,
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete restrict,
  foreign key (source_assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict,
  foreign key (source_evidence_atom_id, source_assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict
);

create table public.brain_decision_candidate_reviews (
  candidate_id uuid primary key,
  question_id uuid not null,
  decision_version_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  disposition text not null check (disposition in ('confirmed', 'corrected', 'rejected')),
  answer_id uuid,
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 1 and 200),
  request_fingerprint_sha256 text not null check (request_fingerprint_sha256 ~ '^[0-9a-f]{64}$'),
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  unique (question_id, idempotency_key),
  foreign key (candidate_id, question_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_answer_candidates(id, question_id, decision_version_id, workspace_id, subject_id) on delete restrict,
  foreign key (answer_id)
    references public.brain_decision_answers(id) on delete restrict,
  check ((disposition = 'rejected' and answer_id is null)
    or (disposition in ('confirmed', 'corrected') and answer_id is not null)),
  check (reviewed_by = subject_id)
);

create index brain_decision_answer_candidates_question_idx
  on public.brain_decision_answer_candidates (question_id, proposed_at desc);
create index brain_decision_answer_candidates_assertion_idx
  on public.brain_decision_answer_candidates (source_assertion_id);
create index brain_decision_answer_candidates_atom_idx
  on public.brain_decision_answer_candidates (source_evidence_atom_id);
create index brain_decision_answer_candidates_proposed_by_idx
  on public.brain_decision_answer_candidates (proposed_by);
create index brain_decision_candidate_reviews_answer_idx
  on public.brain_decision_candidate_reviews (answer_id) where answer_id is not null;
create index brain_decision_candidate_reviews_reviewed_by_idx
  on public.brain_decision_candidate_reviews (reviewed_by);

create or replace function private.brain_decision_ingress_cipher_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'brain_sources' then
    if new.purpose = 'operator_decision_preparation'
      and new.external_locator like 'ctrl-decision-source:%'
    then
      if new.encryption_version <> 1 then raise exception 'brain_decision_cipher_version_invalid'; end if;
      perform private.brain_decision_validate_ciphertext(
        new.content_ciphertext,
        private.brain_decision_cipher_aad_sha256(
          new.workspace_id, new.subject_id, new.id, 'decision_source', 'content'
        )
      );
    end if;
  elsif tg_table_name = 'brain_assertions' then
    if exists (
      select 1
      from public.brain_sources source_row
      where source_row.id = new.source_id
        and source_row.workspace_id = new.workspace_id
        and source_row.subject_id = new.subject_id
        and source_row.purpose = 'operator_decision_preparation'
        and source_row.external_locator like 'ctrl-decision-source:%'
    ) then
      if new.encryption_version <> 1 then raise exception 'brain_decision_cipher_version_invalid'; end if;
      perform private.brain_decision_validate_ciphertext(
        new.statement_ciphertext,
        private.brain_decision_cipher_aad_sha256(
          new.workspace_id, new.subject_id, new.id, 'decision_assertion', 'statement'
        )
      );
    end if;
  elsif tg_table_name = 'brain_decision_answer_candidates' then
    if new.encryption_version <> 1 then raise exception 'brain_decision_cipher_version_invalid'; end if;
    perform private.brain_decision_validate_ciphertext(
      new.claim_ciphertext,
      private.brain_decision_cipher_aad_sha256(
        new.workspace_id, new.subject_id, new.id, 'decision_candidate', 'claim'
      )
    );
  else
    raise exception 'brain_decision_ingress_cipher_target_invalid';
  end if;
  return new;
end;
$$;

create or replace function private.brain_decision_candidate_hash_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.content_sha256 := encode(
    sha256(convert_to(concat_ws('|', new.claim_ciphertext, new.encryption_version::text), 'UTF8')),
    'hex'
  );
  return new;
end;
$$;

create trigger brain_sources_decision_ingress_cipher
before insert or update on public.brain_sources
for each row execute function private.brain_decision_ingress_cipher_guard();
create trigger brain_assertions_decision_ingress_cipher
before insert or update on public.brain_assertions
for each row execute function private.brain_decision_ingress_cipher_guard();
create trigger brain_decision_answer_candidates_05_cipher
before insert on public.brain_decision_answer_candidates
for each row execute function private.brain_decision_ingress_cipher_guard();
create trigger brain_decision_answer_candidates_10_hash
before insert on public.brain_decision_answer_candidates
for each row execute function private.brain_decision_candidate_hash_guard();
create trigger brain_decision_answer_candidates_append_only
before update or delete on public.brain_decision_answer_candidates
for each row execute function private.brain_decision_append_only_guard();
create trigger brain_decision_candidate_reviews_append_only
before update or delete on public.brain_decision_candidate_reviews
for each row execute function private.brain_decision_append_only_guard();

alter table public.brain_decision_events
  drop constraint brain_decision_events_event_type_check;
alter table public.brain_decision_events
  add constraint brain_decision_events_event_type_check
  check (event_type in (
    'case_opened', 'analysis_sealed', 'analysis_superseded', 'question_answered',
    'candidate_staged', 'candidate_confirmed', 'candidate_corrected', 'candidate_rejected',
    'call_recorded', 'outcome_recorded'
  ));

create or replace function private.brain_decision_ingress_actor(
  p_workspace_id uuid,
  p_subject_id uuid,
  p_allow_operator boolean
)
returns uuid
language plpgsql
security definer
stable
set search_path = ''
as $$
declare actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'brain_decision_auth_required' using errcode = '42501';
  end if;
  if actor_id = p_subject_id then return actor_id; end if;
  if not p_allow_operator or not exists (
    select 1
    from public.brain_workspace_roles role_row
    where role_row.workspace_id = p_workspace_id
      and role_row.user_id = actor_id
      and role_row.role in ('owner', 'operator')
      and role_row.revoked_at is null
  ) then
    raise exception 'brain_decision_ingress_forbidden' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.brain_audience_grants grant_row
    where grant_row.workspace_id = p_workspace_id
      and grant_row.grantee_user_id = actor_id
      and grant_row.audience = 'delivery_team_private'
      and grant_row.purpose = 'operator_decision_preparation'
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > statement_timestamp())
  ) then
    raise exception 'brain_decision_ingress_audience_forbidden' using errcode = '42501';
  end if;
  return actor_id;
end;
$$;

create or replace function public.stage_brain_decision_candidate_v1(
  p_candidate_id uuid,
  p_question_id uuid,
  p_source_id uuid,
  p_assertion_id uuid,
  p_source_type text,
  p_source_content_ciphertext text,
  p_assertion_ciphertext text,
  p_candidate_ciphertext text,
  p_captured_at timestamptz,
  p_idempotency_key text,
  p_request_fingerprint_sha256 text
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
  existing_row public.brain_decision_answer_candidates%rowtype;
  evidence_atom_id uuid;
  source_digest text;
begin
  if p_source_type not in ('meeting', 'document', 'observed_action', 'external')
    or p_captured_at > statement_timestamp()
    or char_length(btrim(p_idempotency_key)) not between 1 and 200
    or p_request_fingerprint_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'brain_decision_candidate_input_invalid' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'candidate|' || p_question_id::text || '|' || p_idempotency_key, 0
  ));

  select * into question_row
  from public.brain_decision_questions
  where id = p_question_id;
  if not found then raise exception 'brain_decision_question_not_found'; end if;

  select * into version_row
  from public.brain_decision_versions
  where id = question_row.decision_version_id
  for key share nowait;
  if not found
    or version_row.standing <> 'sealed'
    or version_row.fresh_until <= statement_timestamp()
    or question_row.kind <> 'leader_can_answer'
    or question_row.answer_mode = 'operator_research'
    or question_row.operator_state <> 'asked'
  then raise exception 'brain_decision_candidate_question_ineligible'; end if;

  actor_id := private.brain_decision_ingress_actor(
    question_row.workspace_id, question_row.subject_id, true
  );

  select * into existing_row
  from public.brain_decision_answer_candidates
  where decision_id = question_row.decision_id
    and idempotency_key = p_idempotency_key;
  if found then
    if existing_row.question_id = p_question_id
      and existing_row.request_fingerprint_sha256 = p_request_fingerprint_sha256
    then
      return jsonb_build_object(
        'status', 'replayed', 'candidate_id', existing_row.id,
        'evidence_atom_id', existing_row.source_evidence_atom_id
      );
    end if;
    raise exception 'brain_decision_candidate_replay_conflict' using errcode = '23505';
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
    p_candidate_ciphertext,
    private.brain_decision_cipher_aad_sha256(
      question_row.workspace_id, question_row.subject_id, p_candidate_id,
      'decision_candidate', 'claim'
    )
  );

  source_digest := encode(sha256(convert_to(p_source_content_ciphertext, 'UTF8')), 'hex');
  insert into public.brain_sources (
    id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
    purpose, audience, integrity_sha256, external_locator,
    content_ciphertext, encryption_version, created_by
  ) values (
    p_source_id, question_row.workspace_id, question_row.subject_id, p_source_type,
    actor_id, p_captured_at, 'operator_decision_preparation', 'delivery_team_private',
    source_digest, 'ctrl-decision-source:' || p_candidate_id::text,
    p_source_content_ciphertext, 1, actor_id
  );

  insert into public.brain_assertions (
    id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
    audience, statement_ciphertext, encryption_version, source_span_sha256,
    valid_at, created_by
  ) values (
    p_assertion_id, question_row.workspace_id, question_row.subject_id, p_source_id,
    null, case when p_source_type = 'external' then 'external_claim' else 'inferred' end,
    'delivery_team_private', p_assertion_ciphertext, 1,
    encode(sha256(convert_to(p_assertion_ciphertext, 'UTF8')), 'hex'),
    p_captured_at, actor_id
  );

  evidence_atom_id := private.brain_decision_materialize_evidence_atom(
    p_assertion_id, question_row.workspace_id, question_row.subject_id
  );

  insert into public.brain_decision_answer_candidates (
    id, question_id, decision_version_id, decision_id, workspace_id, subject_id,
    claim_ciphertext, encryption_version, content_sha256,
    source_assertion_id, source_evidence_atom_id, proposed_by, proposed_at,
    idempotency_key, request_fingerprint_sha256
  ) values (
    p_candidate_id, question_row.id, question_row.decision_version_id,
    question_row.decision_id, question_row.workspace_id, question_row.subject_id,
    p_candidate_ciphertext, 1, repeat('0', 64),
    p_assertion_id, evidence_atom_id, actor_id, statement_timestamp(),
    p_idempotency_key, p_request_fingerprint_sha256
  );

  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type,
    actor_user_id, idempotency_key, after_ref, input_sha256, occurred_at
  ) values (
    question_row.decision_id, question_row.decision_version_id,
    question_row.workspace_id, question_row.subject_id, 'candidate_staged',
    actor_id, p_idempotency_key, p_candidate_id, p_request_fingerprint_sha256,
    statement_timestamp()
  );

  return jsonb_build_object(
    'status', 'created', 'candidate_id', p_candidate_id,
    'evidence_atom_id', evidence_atom_id
  );
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create or replace function public.read_brain_decision_question_context_v1(p_question_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare question_row public.brain_decision_questions%rowtype;
begin
  select * into question_row
  from public.brain_decision_questions
  where id = p_question_id;
  if not found then raise exception 'brain_decision_question_not_found'; end if;
  perform private.brain_decision_ingress_actor(
    question_row.workspace_id, question_row.subject_id, true
  );
  return jsonb_build_object(
    'question_id', question_row.id,
    'decision_id', question_row.decision_id,
    'decision_version_id', question_row.decision_version_id,
    'workspace_id', question_row.workspace_id,
    'subject_id', question_row.subject_id
  );
end;
$$;

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
begin
  select * into candidate_row
  from public.brain_decision_answer_candidates
  where id = p_candidate_id;
  if not found then raise exception 'brain_decision_candidate_not_found'; end if;
  perform private.brain_decision_ingress_actor(
    candidate_row.workspace_id, candidate_row.subject_id, true
  );
  select * into review_row
  from public.brain_decision_candidate_reviews
  where candidate_id = p_candidate_id;
  return jsonb_build_object(
    'candidate_id', candidate_row.id,
    'question_id', candidate_row.question_id,
    'workspace_id', candidate_row.workspace_id,
    'subject_id', candidate_row.subject_id,
    'claim_ciphertext', candidate_row.claim_ciphertext,
    'proposed_at', candidate_row.proposed_at,
    'disposition', case when found then review_row.disposition else 'proposed' end
  );
end;
$$;

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
begin
  if p_recorded_at > statement_timestamp()
    or char_length(btrim(p_idempotency_key)) not between 1 and 200
    or p_request_fingerprint_sha256 !~ '^[0-9a-f]{64}$'
    or ((p_candidate_id is null) <> (p_candidate_disposition is null))
    or (p_candidate_disposition is not null and p_candidate_disposition not in ('confirmed', 'corrected'))
  then raise exception 'brain_decision_answer_input_invalid' using errcode = '22023'; end if;

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
    p_assertion_id, null, actor_id, p_recorded_at,
    p_idempotency_key, p_request_fingerprint_sha256
  ) returning source_evidence_atom_id into answer_atom_id;

  if p_candidate_id is not null then
    review_digest := encode(sha256(convert_to(concat_ws('|',
      p_candidate_id::text, p_candidate_disposition, p_answer_id::text,
      actor_id::text, private.brain_decision_timestamp_token(p_recorded_at),
      p_request_fingerprint_sha256
    ), 'UTF8')), 'hex');
    insert into public.brain_decision_candidate_reviews (
      candidate_id, question_id, decision_version_id, workspace_id, subject_id,
      disposition, answer_id, reviewed_by, reviewed_at,
      idempotency_key, request_fingerprint_sha256, input_sha256
    ) values (
      p_candidate_id, question_row.id, question_row.decision_version_id,
      question_row.workspace_id, question_row.subject_id,
      p_candidate_disposition, p_answer_id, actor_id, p_recorded_at,
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
      review_digest, p_recorded_at
    );
  end if;

  return jsonb_build_object(
    'status', 'created', 'answer_id', p_answer_id,
    'evidence_atom_id', answer_atom_id,
    'candidate_id', p_candidate_id,
    'candidate_disposition', p_candidate_disposition
  );
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create or replace function public.reject_brain_decision_candidate_v1(
  p_candidate_id uuid,
  p_reviewed_at timestamptz,
  p_idempotency_key text,
  p_request_fingerprint_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  candidate_row public.brain_decision_answer_candidates%rowtype;
  existing_review public.brain_decision_candidate_reviews%rowtype;
  review_digest text;
begin
  if p_reviewed_at > statement_timestamp()
    or char_length(btrim(p_idempotency_key)) not between 1 and 200
    or p_request_fingerprint_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'brain_decision_candidate_review_input_invalid' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended('candidate-review|' || p_candidate_id::text, 0));
  select * into candidate_row
  from public.brain_decision_answer_candidates
  where id = p_candidate_id
  for key share nowait;
  if not found then raise exception 'brain_decision_candidate_not_found'; end if;
  actor_id := private.brain_decision_ingress_actor(
    candidate_row.workspace_id, candidate_row.subject_id, false
  );

  select * into existing_review
  from public.brain_decision_candidate_reviews
  where candidate_id = p_candidate_id;
  if found then
    if existing_review.disposition = 'rejected'
      and existing_review.idempotency_key = p_idempotency_key
      and existing_review.request_fingerprint_sha256 = p_request_fingerprint_sha256
    then return jsonb_build_object('status', 'replayed', 'candidate_id', p_candidate_id); end if;
    raise exception 'brain_decision_candidate_already_reviewed' using errcode = '23505';
  end if;

  review_digest := encode(sha256(convert_to(concat_ws('|',
    p_candidate_id::text, 'rejected', actor_id::text,
    private.brain_decision_timestamp_token(p_reviewed_at),
    p_request_fingerprint_sha256
  ), 'UTF8')), 'hex');
  insert into public.brain_decision_candidate_reviews (
    candidate_id, question_id, decision_version_id, workspace_id, subject_id,
    disposition, answer_id, reviewed_by, reviewed_at,
    idempotency_key, request_fingerprint_sha256, input_sha256
  ) values (
    p_candidate_id, candidate_row.question_id, candidate_row.decision_version_id,
    candidate_row.workspace_id, candidate_row.subject_id,
    'rejected', null, actor_id, p_reviewed_at,
    p_idempotency_key, p_request_fingerprint_sha256, review_digest
  );
  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type,
    actor_user_id, idempotency_key, before_ref, input_sha256, occurred_at
  ) values (
    candidate_row.decision_id, candidate_row.decision_version_id,
    candidate_row.workspace_id, candidate_row.subject_id, 'candidate_rejected',
    actor_id, p_idempotency_key, p_candidate_id, review_digest, p_reviewed_at
  );
  return jsonb_build_object('status', 'created', 'candidate_id', p_candidate_id, 'disposition', 'rejected');
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

alter table public.brain_decision_answer_candidates enable row level security;
alter table public.brain_decision_answer_candidates force row level security;
alter table public.brain_decision_candidate_reviews enable row level security;
alter table public.brain_decision_candidate_reviews force row level security;

revoke all on table public.brain_decision_answer_candidates from public, anon, authenticated, service_role;
revoke all on table public.brain_decision_candidate_reviews from public, anon, authenticated, service_role;
grant select on table public.brain_decision_answer_candidates to service_role;
grant select on table public.brain_decision_candidate_reviews to service_role;

revoke all on function private.brain_decision_ingress_cipher_guard() from public, anon, authenticated, service_role;
revoke all on function private.brain_decision_candidate_hash_guard() from public, anon, authenticated, service_role;
revoke all on function private.brain_decision_ingress_actor(uuid, uuid, boolean) from public, anon, authenticated, service_role;

revoke all on function public.stage_brain_decision_candidate_v1(uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, text, text)
  from public, anon, service_role;
revoke all on function public.read_brain_decision_question_context_v1(uuid)
  from public, anon, service_role;
revoke all on function public.read_brain_decision_candidate_v1(uuid)
  from public, anon, service_role;
revoke all on function public.record_brain_decision_answer_v1(uuid, uuid, uuid, uuid, text, text, text, timestamptz, text, text, uuid, text)
  from public, anon, service_role;
revoke all on function public.reject_brain_decision_candidate_v1(uuid, timestamptz, text, text)
  from public, anon, service_role;

grant execute on function public.stage_brain_decision_candidate_v1(uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, text, text)
  to authenticated;
grant execute on function public.read_brain_decision_question_context_v1(uuid)
  to authenticated;
grant execute on function public.read_brain_decision_candidate_v1(uuid)
  to authenticated;
grant execute on function public.record_brain_decision_answer_v1(uuid, uuid, uuid, uuid, text, text, text, timestamptz, text, text, uuid, text)
  to authenticated;
grant execute on function public.reject_brain_decision_candidate_v1(uuid, timestamptz, text, text)
  to authenticated;
