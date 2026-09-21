-- G25 R142 canonical consequential-work spine candidate.
-- Non-migration. Prove in a disposable database before any hosted application.

create schema if not exists private;

create unique index if not exists brain_workspaces_scope_unique
  on public.brain_workspaces (id, subject_id, owner_id);
create unique index if not exists brain_assertions_scope_unique
  on public.brain_assertions (id, workspace_id, subject_id);

create table public.brain_subject_profiles (
  workspace_id uuid primary key,
  subject_id uuid not null,
  owner_id uuid not null,
  display_name_ciphertext text not null,
  role_ciphertext text not null,
  organisation_ciphertext text not null,
  brain_name_ciphertext text not null,
  primary_aim_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  relationship_started_on date,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) on delete restrict,
  foreign key (workspace_id, subject_id, owner_id)
    references public.brain_workspaces(id, subject_id, owner_id) on delete cascade
);

create table public.brain_decision_cases (
  id uuid primary key,
  workspace_id uuid not null,
  subject_id uuid not null,
  owner_id uuid not null,
  status text not null check (status in ('framing', 'active', 'testing', 'decided', 'paused', 'archived')),
  decision_by timestamptz,
  opened_at timestamptz not null,
  closed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id, subject_id),
  foreign key (workspace_id, subject_id, owner_id)
    references public.brain_workspaces(id, subject_id, owner_id) on delete cascade,
  check (closed_at is null or closed_at >= opened_at)
);

create table public.brain_decision_versions (
  id uuid primary key,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  version integer not null check (version > 0),
  standing text not null default 'draft' check (standing in ('draft', 'sealed', 'superseded', 'challenged')),
  title_ciphertext text not null,
  stakes_ciphertext text not null,
  provisional_view_ciphertext text not null,
  analysis_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  source_watermark_sha256 text not null check (source_watermark_sha256 ~ '^[0-9a-f]{64}$'),
  snapshot_sha256 text check (snapshot_sha256 is null or snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  generated_at timestamptz not null,
  fresh_until timestamptz not null,
  sealed_at timestamptz,
  sealed_by_authority_event_id uuid,
  predecessor_version_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (decision_id, version),
  unique (id, decision_id, workspace_id, subject_id),
  foreign key (decision_id, workspace_id, subject_id)
    references public.brain_decision_cases(id, workspace_id, subject_id) on delete cascade,
  foreign key (predecessor_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete restrict,
  check (fresh_until > generated_at),
  check ((standing = 'draft' and sealed_at is null and snapshot_sha256 is null and sealed_by_authority_event_id is null)
    or (standing <> 'draft' and sealed_at is not null and snapshot_sha256 is not null and sealed_by_authority_event_id is not null)),
  check ((version = 1 and predecessor_version_id is null)
    or (version > 1 and predecessor_version_id is not null))
);

create unique index brain_decision_versions_one_sealed
  on public.brain_decision_versions (decision_id)
  where standing = 'sealed';

create table public.brain_decision_routes (
  id uuid primary key,
  decision_version_id uuid not null,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  route_order smallint not null check (route_order between 1 and 3),
  tab_label_ciphertext text not null,
  content_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  is_default boolean not null default false,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (decision_version_id, route_order),
  unique (id, decision_version_id, workspace_id, subject_id),
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete cascade
);

create unique index brain_decision_routes_one_default
  on public.brain_decision_routes (decision_version_id) where is_default;
create unique index brain_decision_routes_one_recommended
  on public.brain_decision_routes (decision_version_id) where is_recommended;

create table public.brain_decision_evidence_atoms (
  id uuid primary key default gen_random_uuid(),
  assertion_id uuid not null,
  source_id uuid not null references public.brain_sources(id) on delete restrict,
  workspace_id uuid not null,
  subject_id uuid not null,
  assertion_snapshot jsonb not null,
  source_snapshot jsonb not null,
  assertion_snapshot_sha256 text not null check (assertion_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  source_snapshot_sha256 text not null check (source_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  atom_sha256 text not null check (atom_sha256 ~ '^[0-9a-f]{64}$'),
  materialized_at timestamptz not null default statement_timestamp(),
  causal_watermark_at timestamptz not null,
  constraint brain_decision_evidence_atoms_content_identity_unique unique (
    assertion_id, source_id, workspace_id, subject_id,
    assertion_snapshot_sha256, source_snapshot_sha256
  ),
  unique (id, assertion_id, workspace_id, subject_id),
  foreign key (assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict
);

create table public.brain_decision_human_priors (
  id uuid primary key,
  decision_version_id uuid not null,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  position_ciphertext text not null,
  rationale_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_assertion_id uuid not null,
  source_evidence_atom_id uuid not null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null,
  superseded_at timestamptz,
  unique (id, decision_version_id, workspace_id, subject_id),
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete cascade,
  foreign key (source_assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict,
  foreign key (source_evidence_atom_id, source_assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict,
  check (recorded_by = subject_id),
  check (superseded_at is null or superseded_at >= recorded_at)
);

create unique index brain_decision_human_priors_one_current
  on public.brain_decision_human_priors (decision_version_id) where superseded_at is null;

create table public.brain_decision_questions (
  id uuid primary key,
  decision_version_id uuid not null,
  decision_id uuid not null,
  route_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  question_order smallint not null check (question_order between 1 and 18),
  kind text not null check (kind in ('leader_can_answer', 'brain_can_find', 'prior_decision_match')),
  answer_mode text not null check (answer_mode in ('single_choice', 'multi_choice', 'free_text', 'voice_or_text', 'operator_research')),
  prompt_ciphertext text not null,
  guidance_ciphertext text not null,
  choices_ciphertext text,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  prior_decision_id uuid,
  prior_decision_version_id uuid,
  operator_state text not null default 'proposed' check (operator_state in ('proposed', 'approved', 'asked', 'suppressed')),
  created_at timestamptz not null default now(),
  unique (decision_version_id, question_order),
  unique (id, decision_version_id, workspace_id, subject_id),
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete cascade,
  foreign key (route_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_routes(id, decision_version_id, workspace_id, subject_id) on delete cascade,
  foreign key (prior_decision_id, workspace_id, subject_id)
    references public.brain_decision_cases(id, workspace_id, subject_id) on delete restrict,
  foreign key (prior_decision_version_id, prior_decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete restrict,
  check ((answer_mode in ('single_choice', 'multi_choice') and choices_ciphertext is not null)
    or (answer_mode not in ('single_choice', 'multi_choice') and choices_ciphertext is null)),
  check ((kind = 'prior_decision_match' and prior_decision_id is not null and prior_decision_version_id is not null)
    or (kind <> 'prior_decision_match' and prior_decision_id is null and prior_decision_version_id is null))
);

create table public.brain_decision_answers (
  id uuid primary key,
  question_id uuid not null,
  decision_version_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  answer_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_assertion_id uuid not null,
  source_evidence_atom_id uuid not null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null,
  foreign key (question_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_questions(id, decision_version_id, workspace_id, subject_id) on delete restrict,
  foreign key (source_assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict,
  foreign key (source_evidence_atom_id, source_assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict,
  check (recorded_by = subject_id)
);

create table public.brain_decision_calls (
  id uuid primary key,
  decision_id uuid not null,
  decision_version_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  call_ciphertext text not null,
  conditions_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_assertion_id uuid not null,
  source_evidence_atom_id uuid not null,
  authority_event_id uuid not null,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 1 and 200),
  standing text not null default 'current' check (standing in ('current', 'challenged', 'superseded')),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null,
  unique (id, decision_id, workspace_id, subject_id),
  unique (decision_id, idempotency_key),
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete restrict,
  foreign key (source_assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict,
  foreign key (source_evidence_atom_id, source_assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict,
  check (recorded_by = subject_id)
);

create unique index brain_decision_calls_one_current
  on public.brain_decision_calls (decision_id) where standing = 'current';

create table public.brain_decision_outcomes (
  id uuid primary key,
  decision_call_id uuid not null,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  result_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  source_assertion_id uuid not null,
  source_evidence_atom_id uuid not null,
  observed_at timestamptz not null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  foreign key (decision_call_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_calls(id, decision_id, workspace_id, subject_id) on delete restrict,
  foreign key (source_assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict,
  foreign key (source_evidence_atom_id, source_assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict,
  check (recorded_by = subject_id)
);

create table public.brain_decision_evidence_links (
  id bigint generated always as identity primary key,
  decision_version_id uuid not null,
  decision_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  artifact_kind text not null check (artifact_kind in ('current_read', 'recommended_move', 'route', 'question')),
  artifact_id uuid not null,
  assertion_id uuid not null,
  evidence_atom_id uuid not null,
  stance text not null check (stance in ('supports', 'refutes', 'context')),
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  unique (artifact_kind, artifact_id, assertion_id, stance),
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete cascade,
  foreign key (assertion_id, workspace_id, subject_id)
    references public.brain_assertions(id, workspace_id, subject_id) on delete restrict,
  foreign key (evidence_atom_id, assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict
);

create table public.brain_decision_authority_events (
  id uuid primary key,
  decision_id uuid not null,
  decision_version_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  owner_id uuid not null,
  event_kind text not null check (event_kind in ('seal_analysis', 'approve_operator_projection', 'record_owned_call')),
  audience text not null check (audience = 'delivery_team_private'),
  purpose text not null check (purpose = 'operator_decision_preparation'),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  valid_until timestamptz not null,
  unique (id, decision_version_id, workspace_id, subject_id),
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete cascade,
  foreign key (workspace_id, subject_id, owner_id)
    references public.brain_workspaces(id, subject_id, owner_id) on delete cascade,
  check (valid_until > occurred_at),
  check (
    (event_kind in ('seal_analysis', 'approve_operator_projection') and actor_user_id = owner_id)
    or (event_kind = 'record_owned_call' and actor_user_id = subject_id)
  )
);

create table public.brain_decision_authority_revocations (
  authority_event_id uuid primary key,
  decision_version_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  revoked_by uuid not null references auth.users(id) on delete restrict,
  revoked_at timestamptz not null,
  reason_ciphertext text not null,
  encryption_version smallint not null check (encryption_version > 0),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  foreign key (authority_event_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_authority_events(id, decision_version_id, workspace_id, subject_id) on delete restrict
);

alter table public.brain_decision_versions
  add constraint brain_decision_versions_sealed_authority_fkey
  foreign key (sealed_by_authority_event_id, id, workspace_id, subject_id)
  references public.brain_decision_authority_events(id, decision_version_id, workspace_id, subject_id)
  on delete restrict;

alter table public.brain_decision_calls
  add constraint brain_decision_calls_authority_fkey
  foreign key (authority_event_id, decision_version_id, workspace_id, subject_id)
  references public.brain_decision_authority_events(id, decision_version_id, workspace_id, subject_id)
  on delete restrict;

create table public.brain_decision_events (
  id bigint generated always as identity primary key,
  decision_id uuid not null,
  decision_version_id uuid,
  workspace_id uuid not null,
  subject_id uuid not null,
  event_type text not null check (event_type in ('case_opened', 'analysis_sealed', 'analysis_superseded', 'question_answered', 'call_recorded', 'outcome_recorded')),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  authority_event_id uuid,
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 1 and 200),
  before_ref uuid,
  after_ref uuid,
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null default now(),
  unique (decision_id, event_type, idempotency_key),
  foreign key (decision_id, workspace_id, subject_id)
    references public.brain_decision_cases(id, workspace_id, subject_id) on delete cascade,
  foreign key (decision_version_id, decision_id, workspace_id, subject_id)
    references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete restrict,
  foreign key (authority_event_id, decision_version_id, workspace_id, subject_id)
    references public.brain_decision_authority_events(id, decision_version_id, workspace_id, subject_id) on delete restrict
);

create index brain_decision_cases_scope_status_idx on public.brain_decision_cases (workspace_id, subject_id, status, updated_at desc);
create index brain_decision_cases_created_by_idx on public.brain_decision_cases (created_by);
create index brain_subject_profiles_updated_by_idx on public.brain_subject_profiles (updated_by);
create index brain_decision_versions_scope_idx on public.brain_decision_versions (workspace_id, subject_id, decision_id, version desc);
create index brain_decision_versions_predecessor_idx on public.brain_decision_versions (predecessor_version_id) where predecessor_version_id is not null;
create index brain_decision_versions_created_by_idx on public.brain_decision_versions (created_by);
create index brain_decision_versions_sealed_authority_idx on public.brain_decision_versions (sealed_by_authority_event_id) where sealed_by_authority_event_id is not null;
create index brain_decision_routes_version_idx on public.brain_decision_routes (decision_version_id, route_order);
create index brain_decision_human_priors_assertion_idx on public.brain_decision_human_priors (source_assertion_id);
create index brain_decision_human_priors_atom_idx on public.brain_decision_human_priors (source_evidence_atom_id);
create index brain_decision_human_priors_version_idx on public.brain_decision_human_priors (decision_version_id);
create index brain_decision_human_priors_recorded_by_idx on public.brain_decision_human_priors (recorded_by);
create index brain_decision_questions_version_idx on public.brain_decision_questions (decision_version_id, question_order);
create index brain_decision_questions_route_idx on public.brain_decision_questions (route_id);
create index brain_decision_questions_prior_idx on public.brain_decision_questions (prior_decision_id) where prior_decision_id is not null;
create index brain_decision_questions_prior_version_idx on public.brain_decision_questions (prior_decision_version_id) where prior_decision_version_id is not null;
create index brain_decision_answers_question_idx on public.brain_decision_answers (question_id, recorded_at desc);
create index brain_decision_answers_assertion_idx on public.brain_decision_answers (source_assertion_id);
create index brain_decision_answers_atom_idx on public.brain_decision_answers (source_evidence_atom_id);
create index brain_decision_answers_recorded_by_idx on public.brain_decision_answers (recorded_by);
create index brain_decision_calls_version_idx on public.brain_decision_calls (decision_version_id, recorded_at desc);
create index brain_decision_calls_assertion_idx on public.brain_decision_calls (source_assertion_id);
create index brain_decision_calls_atom_idx on public.brain_decision_calls (source_evidence_atom_id);
create index brain_decision_calls_recorded_by_idx on public.brain_decision_calls (recorded_by);
create index brain_decision_calls_authority_idx on public.brain_decision_calls (authority_event_id);
create index brain_decision_outcomes_call_idx on public.brain_decision_outcomes (decision_call_id, observed_at desc);
create index brain_decision_outcomes_assertion_idx on public.brain_decision_outcomes (source_assertion_id);
create index brain_decision_outcomes_atom_idx on public.brain_decision_outcomes (source_evidence_atom_id);
create index brain_decision_outcomes_recorded_by_idx on public.brain_decision_outcomes (recorded_by);
create index brain_decision_evidence_atoms_assertion_idx on public.brain_decision_evidence_atoms (assertion_id);
create index brain_decision_evidence_atoms_source_idx on public.brain_decision_evidence_atoms (source_id);
create index brain_decision_evidence_atoms_scope_idx on public.brain_decision_evidence_atoms (workspace_id, subject_id, materialized_at desc);
create index brain_decision_evidence_scope_idx on public.brain_decision_evidence_links (decision_version_id, artifact_kind, artifact_id);
create index brain_decision_evidence_assertion_idx on public.brain_decision_evidence_links (assertion_id);
create index brain_decision_evidence_atom_idx on public.brain_decision_evidence_links (evidence_atom_id);
create index brain_decision_evidence_linked_by_idx on public.brain_decision_evidence_links (linked_by);
create index brain_decision_authority_current_idx on public.brain_decision_authority_events (decision_version_id, valid_until);
create index brain_decision_authority_actor_idx on public.brain_decision_authority_events (actor_user_id);
create index brain_decision_authority_workspace_idx on public.brain_decision_authority_events (workspace_id, subject_id, owner_id);
create index brain_decision_authority_revoked_by_idx on public.brain_decision_authority_revocations (revoked_by);
create index brain_decision_events_scope_idx on public.brain_decision_events (workspace_id, decision_id, occurred_at desc);
create index brain_decision_events_version_idx on public.brain_decision_events (decision_version_id) where decision_version_id is not null;
create index brain_decision_events_authority_idx on public.brain_decision_events (authority_event_id) where authority_event_id is not null;
create index brain_decision_events_actor_idx on public.brain_decision_events (actor_user_id);

create or replace function private.brain_decision_cipher_aad_sha256(
  p_workspace_id uuid,
  p_subject_id uuid,
  p_record_id uuid,
  p_record_kind text,
  p_field text
)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select encode(sha256(convert_to(
    '{"v":1'
      || ',"schema_version":"ctrl.brain-decision-cipher-context.r142"'
      || ',"workspace_id":' || to_jsonb(lower(p_workspace_id::text))::text
      || ',"subject_id":' || to_jsonb(lower(p_subject_id::text))::text
      || ',"record_kind":' || to_jsonb(p_record_kind)::text
      || ',"record_id":' || to_jsonb(lower(p_record_id::text))::text
      || ',"field":' || to_jsonb(p_field)::text
      || '}',
    'UTF8'
  )), 'hex')
$$;

create or replace function private.brain_decision_validate_ciphertext(
  p_ciphertext text,
  p_expected_aad_sha256 text
)
returns void
language plpgsql
immutable
strict
set search_path = ''
as $$
declare envelope jsonb;
begin
  begin
    envelope := p_ciphertext::jsonb;
  exception when others then
    raise exception 'brain_decision_cipher_envelope_invalid';
  end;
  if jsonb_typeof(envelope) <> 'object' or (
    select count(*) <> 6
      or count(*) filter (where key = any(array['v', 'alg', 'kid', 'iv', 'ciphertext', 'aad_sha256'])) <> 6
    from jsonb_object_keys(envelope) as member(key)
  ) then raise exception 'brain_decision_cipher_envelope_invalid'; end if;
  if envelope ->> 'v' <> '1'
    or envelope ->> 'alg' <> 'A256GCM'
    or envelope ->> 'kid' !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
    or envelope ->> 'iv' !~ '^[A-Za-z0-9+/_-]{16}$'
    or envelope ->> 'ciphertext' !~ '^[A-Za-z0-9+/_-]{22,}={0,2}$'
    or envelope ->> 'aad_sha256' !~ '^[0-9a-f]{64}$'
  then raise exception 'brain_decision_cipher_envelope_invalid'; end if;
  if envelope ->> 'aad_sha256' <> p_expected_aad_sha256 then
    raise exception 'brain_decision_cipher_context_mismatch';
  end if;
end;
$$;

create or replace function private.brain_decision_cipher_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encryption_version <> 1 then raise exception 'brain_decision_cipher_version_invalid'; end if;
  if tg_table_name = 'brain_subject_profiles' then
    perform private.brain_decision_validate_ciphertext(new.display_name_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.workspace_id, 'subject_profile', 'display_name'));
    perform private.brain_decision_validate_ciphertext(new.role_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.workspace_id, 'subject_profile', 'role'));
    perform private.brain_decision_validate_ciphertext(new.organisation_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.workspace_id, 'subject_profile', 'organisation'));
    perform private.brain_decision_validate_ciphertext(new.brain_name_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.workspace_id, 'subject_profile', 'brain_name'));
    perform private.brain_decision_validate_ciphertext(new.primary_aim_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.workspace_id, 'subject_profile', 'primary_aim'));
  elsif tg_table_name = 'brain_decision_versions' then
    perform private.brain_decision_validate_ciphertext(new.title_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_version', 'title'));
    perform private.brain_decision_validate_ciphertext(new.stakes_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_version', 'stakes'));
    perform private.brain_decision_validate_ciphertext(new.provisional_view_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_version', 'provisional_view'));
    perform private.brain_decision_validate_ciphertext(new.analysis_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_version', 'analysis'));
  elsif tg_table_name = 'brain_decision_routes' then
    perform private.brain_decision_validate_ciphertext(new.tab_label_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_route', 'tab_label'));
    perform private.brain_decision_validate_ciphertext(new.content_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_route', 'content'));
  elsif tg_table_name = 'brain_decision_human_priors' then
    perform private.brain_decision_validate_ciphertext(new.position_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_human_prior', 'position'));
    perform private.brain_decision_validate_ciphertext(new.rationale_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_human_prior', 'rationale'));
  elsif tg_table_name = 'brain_decision_questions' then
    perform private.brain_decision_validate_ciphertext(new.prompt_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_question', 'prompt'));
    perform private.brain_decision_validate_ciphertext(new.guidance_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_question', 'guidance'));
    if new.choices_ciphertext is not null then perform private.brain_decision_validate_ciphertext(new.choices_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_question', 'choices')); end if;
  elsif tg_table_name = 'brain_decision_answers' then
    perform private.brain_decision_validate_ciphertext(new.answer_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_answer', 'answer'));
  elsif tg_table_name = 'brain_decision_calls' then
    perform private.brain_decision_validate_ciphertext(new.call_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_call', 'call'));
    perform private.brain_decision_validate_ciphertext(new.conditions_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_call', 'conditions'));
  elsif tg_table_name = 'brain_decision_outcomes' then
    perform private.brain_decision_validate_ciphertext(new.result_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.id, 'decision_outcome', 'result'));
  elsif tg_table_name = 'brain_decision_authority_revocations' then
    perform private.brain_decision_validate_ciphertext(new.reason_ciphertext, private.brain_decision_cipher_aad_sha256(new.workspace_id, new.subject_id, new.authority_event_id, 'decision_authority_revocation', 'reason'));
  else
    raise exception 'brain_decision_cipher_target_invalid';
  end if;
  return new;
end;
$$;

create trigger brain_subject_profiles_cipher before insert or update on public.brain_subject_profiles for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_versions_cipher before insert or update on public.brain_decision_versions for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_routes_cipher before insert or update on public.brain_decision_routes for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_human_priors_cipher before insert or update on public.brain_decision_human_priors for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_questions_cipher before insert or update on public.brain_decision_questions for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_answers_cipher before insert or update on public.brain_decision_answers for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_calls_cipher before insert or update on public.brain_decision_calls for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_outcomes_cipher before insert or update on public.brain_decision_outcomes for each row execute function private.brain_decision_cipher_guard();
create trigger brain_decision_authority_revocations_cipher before insert or update on public.brain_decision_authority_revocations for each row execute function private.brain_decision_cipher_guard();

create or replace function private.brain_decision_content_hash_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  material text;
begin
  if tg_table_name = 'brain_subject_profiles' then
    material := concat_ws('|', new.display_name_ciphertext, new.role_ciphertext,
      new.organisation_ciphertext, new.brain_name_ciphertext, new.primary_aim_ciphertext,
      new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_routes' then
    material := concat_ws('|', new.tab_label_ciphertext, new.content_ciphertext, new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_human_priors' then
    material := concat_ws('|', new.position_ciphertext, new.rationale_ciphertext, new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_questions' then
    material := concat_ws('|', new.prompt_ciphertext, new.guidance_ciphertext,
      coalesce(new.choices_ciphertext, ''), new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_answers' then
    material := concat_ws('|', new.answer_ciphertext, new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_calls' then
    material := concat_ws('|', new.call_ciphertext, new.conditions_ciphertext, new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_outcomes' then
    material := concat_ws('|', new.result_ciphertext, new.encryption_version::text);
  elsif tg_table_name = 'brain_decision_authority_revocations' then
    material := concat_ws('|', new.reason_ciphertext, new.encryption_version::text);
  else
    raise exception 'brain_decision_hash_target_invalid';
  end if;
  new.content_sha256 := encode(sha256(convert_to(material, 'UTF8')), 'hex');
  return new;
end;
$$;

create trigger brain_subject_profiles_hash before insert or update on public.brain_subject_profiles
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_routes_hash before insert or update on public.brain_decision_routes
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_human_priors_hash before insert or update on public.brain_decision_human_priors
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_questions_hash before insert or update on public.brain_decision_questions
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_answers_hash before insert or update on public.brain_decision_answers
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_calls_hash before insert or update on public.brain_decision_calls
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_outcomes_hash before insert or update on public.brain_decision_outcomes
for each row execute function private.brain_decision_content_hash_guard();
create trigger brain_decision_authority_revocations_hash before insert or update on public.brain_decision_authority_revocations
for each row execute function private.brain_decision_content_hash_guard();

create or replace function private.brain_decision_authority_revocation_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare authority_row public.brain_decision_authority_events%rowtype;
begin
  select * into authority_row
  from public.brain_decision_authority_events
  where id = new.authority_event_id
  for no key update nowait;
  if not found
    or authority_row.decision_version_id <> new.decision_version_id
    or authority_row.workspace_id <> new.workspace_id
    or authority_row.subject_id <> new.subject_id
  then raise exception 'brain_decision_authority_revocation_invalid'; end if;
  if new.revoked_by not in (authority_row.actor_user_id, authority_row.owner_id, authority_row.subject_id)
    then raise exception 'brain_decision_authority_revocation_invalid'; end if;
  if new.revoked_at < authority_row.occurred_at
    then raise exception 'brain_decision_authority_revocation_invalid'; end if;
  if new.revoked_at > statement_timestamp()
    then raise exception 'brain_decision_authority_revocation_invalid'; end if;
  if exists (
    select 1
    from public.brain_decision_versions version_row
    where version_row.sealed_by_authority_event_id = authority_row.id
      and new.revoked_at <= version_row.sealed_at
  ) then raise exception 'brain_decision_authority_revocation_conflicts_with_use'; end if;
  if exists (
    select 1
    from public.brain_decision_calls call_row
    where call_row.authority_event_id = authority_row.id
      and new.revoked_at <= call_row.recorded_at
  ) then raise exception 'brain_decision_authority_revocation_conflicts_with_use'; end if;
  return new;
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create trigger brain_decision_authority_revocations_10_authority_guard
before insert on public.brain_decision_authority_revocations
for each row execute function private.brain_decision_authority_revocation_guard();

create or replace function private.brain_decision_artifact_scope_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  artifact_ok boolean;
begin
  if new.artifact_kind in ('current_read', 'recommended_move') then
    artifact_ok := new.artifact_id = new.decision_version_id;
  elsif new.artifact_kind = 'route' then
    select exists (
      select 1 from public.brain_decision_routes route_row
      where route_row.id = new.artifact_id
        and route_row.decision_version_id = new.decision_version_id
        and route_row.workspace_id = new.workspace_id
        and route_row.subject_id = new.subject_id
    ) into artifact_ok;
  elsif new.artifact_kind = 'question' then
    select exists (
      select 1 from public.brain_decision_questions question_row
      where question_row.id = new.artifact_id
        and question_row.decision_version_id = new.decision_version_id
        and question_row.workspace_id = new.workspace_id
        and question_row.subject_id = new.subject_id
    ) into artifact_ok;
  end if;
  if not coalesce(artifact_ok, false) then raise exception 'brain_decision_artifact_scope_invalid'; end if;
  return new;
end;
$$;

create trigger brain_decision_evidence_artifact_scope_guard
before insert or update on public.brain_decision_evidence_links
for each row execute function private.brain_decision_artifact_scope_guard();

create or replace function private.brain_decision_draft_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_id uuid;
  version_standing text;
begin
  version_id := coalesce(new.decision_version_id, old.decision_version_id);
  select standing into version_standing
  from public.brain_decision_versions
  where id = version_id
  for update nowait;
  if version_standing is distinct from 'draft' then raise exception 'brain_decision_version_not_draft'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create trigger brain_decision_routes_draft_guard before insert or update or delete on public.brain_decision_routes
for each row execute function private.brain_decision_draft_guard();
create trigger brain_decision_questions_draft_guard before insert or update or delete on public.brain_decision_questions
for each row execute function private.brain_decision_draft_guard();
create trigger brain_decision_evidence_draft_guard before insert or update or delete on public.brain_decision_evidence_links
for each row execute function private.brain_decision_draft_guard();

create or replace function private.brain_decision_version_immutable_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.standing <> 'draft'
      or new.sealed_at is not null
      or new.snapshot_sha256 is not null
      or new.sealed_by_authority_event_id is not null
    then raise exception 'brain_decision_version_insert_must_be_draft'; end if;
    return new;
  end if;
  if old.standing = 'sealed' and new.standing = 'superseded' then
    if current_setting('ctrl.brain_decision_supersede', true) is distinct from old.id::text
      or (to_jsonb(new) - 'standing') is distinct from (to_jsonb(old) - 'standing')
    then raise exception 'brain_decision_supersede_function_required'; end if;
    return new;
  end if;
  if old.standing <> 'draft' then raise exception 'brain_decision_sealed_version_immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.standing <> 'draft' then
    if new.standing <> 'sealed'
      or current_setting('ctrl.brain_decision_seal', true) is distinct from new.id::text || ':' || new.snapshot_sha256
      or (to_jsonb(new) - array['standing', 'sealed_at', 'sealed_by_authority_event_id', 'snapshot_sha256'])
        is distinct from (to_jsonb(old) - array['standing', 'sealed_at', 'sealed_by_authority_event_id', 'snapshot_sha256'])
    then raise exception 'brain_decision_seal_function_required'; end if;
  end if;
  return new;
end;
$$;

create trigger brain_decision_version_immutable_guard
before insert or update or delete on public.brain_decision_versions
for each row execute function private.brain_decision_version_immutable_guard();

create or replace function private.brain_decision_append_only_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin raise exception 'brain_decision_record_append_only'; end;
$$;

create trigger brain_decision_evidence_atoms_append_only before update or delete on public.brain_decision_evidence_atoms
for each row execute function private.brain_decision_append_only_guard();
create trigger brain_decision_answers_append_only before update or delete on public.brain_decision_answers
for each row execute function private.brain_decision_append_only_guard();
create trigger brain_decision_outcomes_append_only before update or delete on public.brain_decision_outcomes
for each row execute function private.brain_decision_append_only_guard();
create trigger brain_decision_authority_append_only before update or delete on public.brain_decision_authority_events
for each row execute function private.brain_decision_append_only_guard();
create trigger brain_decision_authority_revocations_append_only before update or delete on public.brain_decision_authority_revocations
for each row execute function private.brain_decision_append_only_guard();
create trigger brain_decision_events_append_only before update or delete on public.brain_decision_events
for each row execute function private.brain_decision_append_only_guard();

create or replace function private.brain_decision_case_identity_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then raise exception 'brain_decision_case_delete_forbidden'; end if;
  if (to_jsonb(new) - array['status', 'decision_by', 'closed_at', 'updated_at'])
    is distinct from (to_jsonb(old) - array['status', 'decision_by', 'closed_at', 'updated_at'])
  then raise exception 'brain_decision_case_identity_immutable'; end if;
  return new;
end;
$$;

create trigger brain_decision_case_identity_guard
before update or delete on public.brain_decision_cases
for each row execute function private.brain_decision_case_identity_guard();

create or replace function private.brain_decision_owned_record_transition_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if tg_table_name = 'brain_decision_human_priors' then
      if new.superseded_at is not null then raise exception 'brain_decision_human_prior_initial_state_invalid'; end if;
    elsif tg_table_name = 'brain_decision_calls' then
      if new.standing <> 'current' then raise exception 'brain_decision_call_initial_state_invalid'; end if;
    else
      raise exception 'brain_decision_owned_record_target_invalid';
    end if;
    return new;
  end if;
  if tg_op = 'DELETE' then raise exception 'brain_decision_owned_record_delete_forbidden'; end if;
  if tg_table_name = 'brain_decision_human_priors' then
    if old.superseded_at is not null
      or new.superseded_at is null
      or new.superseded_at < old.recorded_at
      or (to_jsonb(new) - 'superseded_at') is distinct from (to_jsonb(old) - 'superseded_at')
    then raise exception 'brain_decision_human_prior_immutable'; end if;
  elsif tg_table_name = 'brain_decision_calls' then
    if old.standing <> 'current'
      or new.standing not in ('challenged', 'superseded')
      or (to_jsonb(new) - 'standing') is distinct from (to_jsonb(old) - 'standing')
    then raise exception 'brain_decision_call_immutable'; end if;
  else
    raise exception 'brain_decision_owned_record_target_invalid';
  end if;
  return new;
end;
$$;

create trigger brain_decision_human_prior_transition_guard
before insert or update or delete on public.brain_decision_human_priors
for each row execute function private.brain_decision_owned_record_transition_guard();
create trigger brain_decision_call_transition_guard
before insert or update or delete on public.brain_decision_calls
for each row execute function private.brain_decision_owned_record_transition_guard();

create or replace function private.brain_decision_timestamp_token(p_timestamp timestamptz)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select ((extract(epoch from p_timestamp) * 1000000)::numeric(20, 0))::text
$$;

create or replace function private.brain_decision_evidence_atom_sha256(
  p_assertion_snapshot jsonb,
  p_source_snapshot jsonb,
  p_materialized_at timestamptz,
  p_causal_watermark_at timestamptz
)
returns text
language sql
immutable
strict
security definer
set search_path = ''
as $$
  select encode(sha256(convert_to(jsonb_build_object(
    'assertion', p_assertion_snapshot,
    'source', p_source_snapshot,
    'materialized_at_us', private.brain_decision_timestamp_token(p_materialized_at),
    'causal_watermark_at_us', private.brain_decision_timestamp_token(p_causal_watermark_at)
  )::text, 'UTF8')), 'hex')
$$;

create or replace function private.brain_decision_materialize_evidence_atom(
  p_assertion_id uuid,
  p_workspace_id uuid,
  p_subject_id uuid,
  p_expected_assertion_xmin xid,
  p_expected_source_xmin xid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_source_id uuid;
  assertion_row public.brain_assertions%rowtype;
  source_row public.brain_sources%rowtype;
  assertion_snapshot_value jsonb;
  source_snapshot_value jsonb;
  assertion_digest text;
  source_digest text;
  atom_materialized_at timestamptz := statement_timestamp();
  causal_watermark_at timestamptz;
  atom_id uuid;
  winner_row public.brain_decision_evidence_atoms%rowtype;
  observed_source_xmin xid;
  observed_assertion_xmin xid;
  locked_source_xmin xid;
  locked_assertion_xmin xid;
  atom_identity_lock bigint;
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'brain_decision_materializer_requires_read_committed';
  end if;

  select assertion_row_unlocked.source_id, assertion_row_unlocked.xmin, source_row_unlocked.xmin
  into candidate_source_id, observed_assertion_xmin, observed_source_xmin
  from public.brain_assertions assertion_row_unlocked
  left join public.brain_sources source_row_unlocked
    on source_row_unlocked.id = assertion_row_unlocked.source_id
    and source_row_unlocked.workspace_id = p_workspace_id
    and source_row_unlocked.subject_id = p_subject_id
  where assertion_row_unlocked.id = p_assertion_id;
  if not found then raise exception 'brain_decision_evidence_assertion_not_found'; end if;
  if observed_source_xmin is null then raise exception 'brain_decision_evidence_source_scope_invalid'; end if;
  if (p_expected_assertion_xmin is null) <> (p_expected_source_xmin is null) then
    raise exception 'brain_decision_evidence_provenance_expectation_invalid';
  end if;
  if p_expected_assertion_xmin is not null
    and (observed_assertion_xmin is distinct from p_expected_assertion_xmin
      or observed_source_xmin is distinct from p_expected_source_xmin)
  then
    raise exception 'brain_decision_evidence_provenance_changed_during_materialization';
  end if;

  begin
    select * into source_row
    from public.brain_sources source_row_locked
    where source_row_locked.id = candidate_source_id
      and source_row_locked.workspace_id = p_workspace_id
      and source_row_locked.subject_id = p_subject_id
    for share nowait;
    if not found then raise exception 'brain_decision_evidence_source_scope_invalid'; end if;
  exception when lock_not_available then
    raise exception 'brain_decision_evidence_provenance_busy_retry';
  end;
  select source_row_locked.xmin into strict locked_source_xmin
  from public.brain_sources source_row_locked
  where source_row_locked.id = candidate_source_id;

  begin
    select * into assertion_row
    from public.brain_assertions assertion_row_locked
    where assertion_row_locked.id = p_assertion_id
      and assertion_row_locked.source_id = candidate_source_id
      and assertion_row_locked.workspace_id = p_workspace_id
      and assertion_row_locked.subject_id = p_subject_id
    for share nowait;
    if not found then raise exception 'brain_decision_evidence_assertion_scope_invalid'; end if;
  exception when lock_not_available then
    raise exception 'brain_decision_evidence_provenance_busy_retry';
  end;
  select assertion_row_locked.xmin into strict locked_assertion_xmin
  from public.brain_assertions assertion_row_locked
  where assertion_row_locked.id = p_assertion_id;
  if locked_source_xmin is distinct from observed_source_xmin
    or locked_assertion_xmin is distinct from observed_assertion_xmin
  then
    raise exception 'brain_decision_evidence_provenance_changed_during_materialization';
  end if;

  if source_row.captured_at > atom_materialized_at then
    raise exception 'brain_decision_evidence_source_captured_in_future';
  end if;
  if source_row.recorded_at > atom_materialized_at then
    raise exception 'brain_decision_evidence_source_recorded_in_future';
  end if;
  if assertion_row.recorded_at > atom_materialized_at then
    raise exception 'brain_decision_evidence_assertion_recorded_in_future';
  end if;
  causal_watermark_at := greatest(
    source_row.captured_at,
    source_row.recorded_at,
    assertion_row.recorded_at,
    atom_materialized_at
  );

  assertion_snapshot_value := jsonb_build_object(
    'id', assertion_row.id::text,
    'source_id', assertion_row.source_id::text,
    'speaker_user_id', assertion_row.speaker_user_id::text,
    'epistemic_basis', assertion_row.epistemic_basis,
    'audience', assertion_row.audience,
    'statement_ciphertext', assertion_row.statement_ciphertext,
    'encryption_version', assertion_row.encryption_version,
    'source_span_start', assertion_row.source_span_start,
    'source_span_end', assertion_row.source_span_end,
    'source_span_sha256', assertion_row.source_span_sha256,
    'valid_at_us', case when assertion_row.valid_at is null then null else private.brain_decision_timestamp_token(assertion_row.valid_at) end,
    'recorded_at_us', private.brain_decision_timestamp_token(assertion_row.recorded_at),
    'created_by', assertion_row.created_by::text
  );
  source_snapshot_value := jsonb_build_object(
    'id', source_row.id::text,
    'source_type', source_row.source_type,
    'actor_user_id', source_row.actor_user_id::text,
    'speaker_label', source_row.speaker_label,
    'captured_at_us', private.brain_decision_timestamp_token(source_row.captured_at),
    'purpose', source_row.purpose,
    'audience', source_row.audience,
    'retention_expires_at_us', case when source_row.retention_expires_at is null then null else private.brain_decision_timestamp_token(source_row.retention_expires_at) end,
    'integrity_sha256', source_row.integrity_sha256,
    'external_locator', source_row.external_locator,
    'content_ciphertext', source_row.content_ciphertext,
    'encryption_version', source_row.encryption_version,
    'recorded_at_us', private.brain_decision_timestamp_token(source_row.recorded_at),
    'created_by', source_row.created_by::text
  );
  assertion_digest := encode(sha256(convert_to(assertion_snapshot_value::text, 'UTF8')), 'hex');
  source_digest := encode(sha256(convert_to(source_snapshot_value::text, 'UTF8')), 'hex');
  atom_identity_lock := hashtextextended(concat_ws('|',
    'ctrl.brain_decision_evidence_atom.v1',
    assertion_row.id::text,
    source_row.id::text,
    p_workspace_id::text,
    p_subject_id::text,
    assertion_digest,
    source_digest
  ), 0);
  if not pg_try_advisory_xact_lock(atom_identity_lock) then
    raise exception 'brain_decision_evidence_provenance_busy_retry';
  end if;
  select atom.id into atom_id
  from public.brain_decision_evidence_atoms atom
  where atom.assertion_id = p_assertion_id
    and atom.source_id = candidate_source_id
    and atom.workspace_id = p_workspace_id
    and atom.subject_id = p_subject_id
    and atom.assertion_snapshot = assertion_snapshot_value
    and atom.source_snapshot = source_snapshot_value
    and atom.assertion_snapshot_sha256 = assertion_digest
    and atom.source_snapshot_sha256 = source_digest
    and atom.causal_watermark_at = greatest(
      source_row.captured_at,
      source_row.recorded_at,
      assertion_row.recorded_at,
      atom.materialized_at
    )
    and atom.atom_sha256 = private.brain_decision_evidence_atom_sha256(
      assertion_snapshot_value, source_snapshot_value,
      atom.materialized_at, atom.causal_watermark_at
    )
  order by atom.materialized_at, atom.id
  limit 1;
  if found then return atom_id; end if;
  atom_id := gen_random_uuid();
  insert into public.brain_decision_evidence_atoms (
    id, assertion_id, source_id, workspace_id, subject_id,
    assertion_snapshot, source_snapshot,
    assertion_snapshot_sha256, source_snapshot_sha256, atom_sha256,
    materialized_at, causal_watermark_at
  ) values (
    atom_id, assertion_row.id, source_row.id, p_workspace_id, p_subject_id,
    assertion_snapshot_value, source_snapshot_value,
    assertion_digest, source_digest,
    private.brain_decision_evidence_atom_sha256(
      assertion_snapshot_value, source_snapshot_value,
      atom_materialized_at, causal_watermark_at
    ),
    atom_materialized_at, causal_watermark_at
  )
  on conflict on constraint brain_decision_evidence_atoms_content_identity_unique do nothing
  returning id into atom_id;
  if found then return atom_id; end if;

  select * into winner_row
  from public.brain_decision_evidence_atoms atom
  where atom.assertion_id = p_assertion_id
    and atom.source_id = candidate_source_id
    and atom.workspace_id = p_workspace_id
    and atom.subject_id = p_subject_id
    and atom.assertion_snapshot_sha256 = assertion_digest
    and atom.source_snapshot_sha256 = source_digest;
  if not found then
    raise exception 'brain_decision_evidence_atom_winner_not_visible';
  end if;
  if winner_row.assertion_snapshot is distinct from assertion_snapshot_value
    or winner_row.source_snapshot is distinct from source_snapshot_value
    or winner_row.assertion_snapshot_sha256 <> assertion_digest
    or winner_row.source_snapshot_sha256 <> source_digest
  then
    raise exception 'brain_decision_evidence_atom_digest_collision';
  end if;
  if winner_row.causal_watermark_at <> greatest(
      source_row.captured_at,
      source_row.recorded_at,
      assertion_row.recorded_at,
      winner_row.materialized_at
    )
    or winner_row.atom_sha256 <> private.brain_decision_evidence_atom_sha256(
      assertion_snapshot_value, source_snapshot_value,
      winner_row.materialized_at, winner_row.causal_watermark_at
    )
  then
    raise exception 'brain_decision_evidence_atom_winner_invalid';
  end if;
  return winner_row.id;
end;
$$;

create or replace function private.brain_decision_materialize_evidence_atom(
  p_assertion_id uuid,
  p_workspace_id uuid,
  p_subject_id uuid
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.brain_decision_materialize_evidence_atom(
    p_assertion_id, p_workspace_id, p_subject_id, null::xid, null::xid
  )
$$;

create or replace function private.brain_decision_validate_evidence_atom(
  p_atom_id uuid,
  p_assertion_id uuid,
  p_workspace_id uuid,
  p_subject_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  atom_row public.brain_decision_evidence_atoms%rowtype;
  assertion_row public.brain_assertions%rowtype;
  source_row public.brain_sources%rowtype;
  assertion_snapshot_value jsonb;
  source_snapshot_value jsonb;
  current_atom_sha256 text;
  expected_causal_watermark_at timestamptz;
begin
  select * into atom_row
  from public.brain_decision_evidence_atoms
  where id = p_atom_id
    and assertion_id = p_assertion_id
    and workspace_id = p_workspace_id
    and subject_id = p_subject_id;
  if not found then raise exception 'brain_decision_evidence_atom_scope_invalid'; end if;

  select * into source_row
  from public.brain_sources
  where id = atom_row.source_id
    and workspace_id = p_workspace_id
    and subject_id = p_subject_id
  for share;
  if not found then raise exception 'brain_decision_evidence_source_scope_invalid'; end if;

  select * into assertion_row
  from public.brain_assertions
  where id = p_assertion_id
    and source_id = atom_row.source_id
    and workspace_id = p_workspace_id
    and subject_id = p_subject_id
  for share;
  if not found then raise exception 'brain_decision_evidence_assertion_scope_invalid'; end if;

  if source_row.captured_at > statement_timestamp() then
    raise exception 'brain_decision_evidence_source_captured_in_future';
  end if;
  if source_row.recorded_at > statement_timestamp() then
    raise exception 'brain_decision_evidence_source_recorded_in_future';
  end if;
  if assertion_row.recorded_at > statement_timestamp() then
    raise exception 'brain_decision_evidence_assertion_recorded_in_future';
  end if;
  if atom_row.materialized_at > statement_timestamp() then
    raise exception 'brain_decision_evidence_atom_materialized_in_future';
  end if;
  expected_causal_watermark_at := greatest(
    source_row.captured_at,
    source_row.recorded_at,
    assertion_row.recorded_at,
    atom_row.materialized_at
  );

  assertion_snapshot_value := jsonb_build_object(
    'id', assertion_row.id::text,
    'source_id', assertion_row.source_id::text,
    'speaker_user_id', assertion_row.speaker_user_id::text,
    'epistemic_basis', assertion_row.epistemic_basis,
    'audience', assertion_row.audience,
    'statement_ciphertext', assertion_row.statement_ciphertext,
    'encryption_version', assertion_row.encryption_version,
    'source_span_start', assertion_row.source_span_start,
    'source_span_end', assertion_row.source_span_end,
    'source_span_sha256', assertion_row.source_span_sha256,
    'valid_at_us', case when assertion_row.valid_at is null then null else private.brain_decision_timestamp_token(assertion_row.valid_at) end,
    'recorded_at_us', private.brain_decision_timestamp_token(assertion_row.recorded_at),
    'created_by', assertion_row.created_by::text
  );
  source_snapshot_value := jsonb_build_object(
    'id', source_row.id::text,
    'source_type', source_row.source_type,
    'actor_user_id', source_row.actor_user_id::text,
    'speaker_label', source_row.speaker_label,
    'captured_at_us', private.brain_decision_timestamp_token(source_row.captured_at),
    'purpose', source_row.purpose,
    'audience', source_row.audience,
    'retention_expires_at_us', case when source_row.retention_expires_at is null then null else private.brain_decision_timestamp_token(source_row.retention_expires_at) end,
    'integrity_sha256', source_row.integrity_sha256,
    'external_locator', source_row.external_locator,
    'content_ciphertext', source_row.content_ciphertext,
    'encryption_version', source_row.encryption_version,
    'recorded_at_us', private.brain_decision_timestamp_token(source_row.recorded_at),
    'created_by', source_row.created_by::text
  );
  current_atom_sha256 := private.brain_decision_evidence_atom_sha256(
    assertion_snapshot_value, source_snapshot_value,
    atom_row.materialized_at, expected_causal_watermark_at
  );
  if atom_row.assertion_snapshot is distinct from assertion_snapshot_value
    or atom_row.source_snapshot is distinct from source_snapshot_value
    or atom_row.causal_watermark_at is distinct from expected_causal_watermark_at
    or atom_row.atom_sha256 <> current_atom_sha256
  then raise exception 'brain_decision_evidence_atom_stale'; end if;
  return atom_row.atom_sha256;
end;
$$;

create or replace function private.brain_decision_human_prior_admission_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_id uuid;
  version_standing text;
  expected_source_xmin xid;
  expected_assertion_xmin xid;
  expected_atom_id uuid;
begin
  if tg_op = 'INSERT' then
    select assertion_row.xmin, source_row.xmin
    into expected_assertion_xmin, expected_source_xmin
    from public.brain_assertions assertion_row
    left join public.brain_sources source_row
      on source_row.id = assertion_row.source_id
      and source_row.workspace_id = new.workspace_id
      and source_row.subject_id = new.subject_id
    where assertion_row.id = new.source_assertion_id
      and assertion_row.workspace_id = new.workspace_id
      and assertion_row.subject_id = new.subject_id;
    if not found then raise exception 'brain_decision_evidence_assertion_not_found'; end if;
    if expected_source_xmin is null then raise exception 'brain_decision_evidence_source_scope_invalid'; end if;
  end if;

  version_id := coalesce(new.decision_version_id, old.decision_version_id);
  select standing into version_standing
  from public.brain_decision_versions
  where id = version_id
  for update nowait;
  if version_standing is distinct from 'draft' then raise exception 'brain_decision_version_not_draft'; end if;
  if tg_op = 'DELETE' then return old; end if;

  if tg_op = 'INSERT' then
    expected_atom_id := private.brain_decision_materialize_evidence_atom(
      new.source_assertion_id, new.workspace_id, new.subject_id,
      expected_assertion_xmin, expected_source_xmin
    );
    if new.source_evidence_atom_id is null then
      new.source_evidence_atom_id := expected_atom_id;
    elsif new.source_evidence_atom_id <> expected_atom_id then
      raise exception 'brain_decision_human_prior_source_atom_mismatch';
    end if;
  end if;
  return new;
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create trigger brain_decision_human_prior_00_admission_guard
before insert or update or delete on public.brain_decision_human_priors
for each row execute function private.brain_decision_human_prior_admission_guard();

create or replace function private.brain_decision_source_atom_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare atom_causal_watermark_at timestamptz;
begin
  if tg_op = 'UPDATE' and new.source_evidence_atom_id is distinct from old.source_evidence_atom_id then
    raise exception 'brain_decision_source_atom_identity_immutable';
  end if;
  if new.source_evidence_atom_id is null then
    new.source_evidence_atom_id := private.brain_decision_materialize_evidence_atom(
      new.source_assertion_id, new.workspace_id, new.subject_id
    );
  else
    perform private.brain_decision_validate_evidence_atom(
      new.source_evidence_atom_id, new.source_assertion_id, new.workspace_id, new.subject_id
    );
  end if;
  select atom.causal_watermark_at into strict atom_causal_watermark_at
  from public.brain_decision_evidence_atoms atom
  where atom.id = new.source_evidence_atom_id;
  if new.recorded_at < atom_causal_watermark_at then
    if tg_table_name = 'brain_decision_human_priors' then
      raise exception 'brain_decision_human_prior_source_chronology_invalid';
    elsif tg_table_name = 'brain_decision_answers' then
      raise exception 'brain_decision_answer_source_chronology_invalid';
    elsif tg_table_name = 'brain_decision_calls' then
      raise exception 'brain_decision_call_source_chronology_invalid';
    elsif tg_table_name = 'brain_decision_outcomes' then
      raise exception 'brain_decision_outcome_source_chronology_invalid';
    else
      raise exception 'brain_decision_source_atom_target_invalid';
    end if;
  end if;
  return new;
end;
$$;

create trigger brain_decision_human_priors_00_source_atom_guard
before insert or update on public.brain_decision_human_priors
for each row execute function private.brain_decision_source_atom_guard();
create trigger brain_decision_answers_z_source_atom_guard
before insert or update on public.brain_decision_answers
for each row execute function private.brain_decision_source_atom_guard();
create trigger brain_decision_calls_00_source_atom_guard
before insert or update on public.brain_decision_calls
for each row execute function private.brain_decision_source_atom_guard();
create trigger brain_decision_outcomes_z_source_atom_guard
before insert or update on public.brain_decision_outcomes
for each row execute function private.brain_decision_source_atom_guard();

create or replace function private.brain_decision_evidence_link_atom_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare atom_causal_watermark_at timestamptz;
begin
  if tg_op = 'INSERT' then
    if new.evidence_atom_id is not null then
      raise exception 'brain_decision_evidence_atom_caller_supplied';
    end if;
    new.evidence_atom_id := private.brain_decision_materialize_evidence_atom(
      new.assertion_id, new.workspace_id, new.subject_id
    );
  elsif new.evidence_atom_id is distinct from old.evidence_atom_id then
    raise exception 'brain_decision_evidence_atom_identity_immutable';
  elsif new.assertion_id is distinct from old.assertion_id
    or new.workspace_id is distinct from old.workspace_id
    or new.subject_id is distinct from old.subject_id then
    new.evidence_atom_id := private.brain_decision_materialize_evidence_atom(
      new.assertion_id, new.workspace_id, new.subject_id
    );
  else
    perform private.brain_decision_validate_evidence_atom(
      new.evidence_atom_id, new.assertion_id, new.workspace_id, new.subject_id
    );
  end if;
  select atom.causal_watermark_at into strict atom_causal_watermark_at
  from public.brain_decision_evidence_atoms atom
  where atom.id = new.evidence_atom_id;
  if new.linked_at < atom_causal_watermark_at then
    raise exception 'brain_decision_evidence_link_source_chronology_invalid';
  end if;
  return new;
end;
$$;

create trigger brain_decision_evidence_10_atom_guard
before insert or update on public.brain_decision_evidence_links
for each row execute function private.brain_decision_evidence_link_atom_guard();

create or replace function private.brain_decision_referenced_assertion_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.brain_decision_evidence_links link
    where link.assertion_id = old.id
    union all
    select 1 from public.brain_decision_human_priors prior
    where prior.source_assertion_id = old.id
    union all
    select 1 from public.brain_decision_answers answer_row
    where answer_row.source_assertion_id = old.id
    union all
    select 1 from public.brain_decision_calls call_row
    where call_row.source_assertion_id = old.id
    union all
    select 1 from public.brain_decision_outcomes outcome_row
    where outcome_row.source_assertion_id = old.id
  ) then raise exception 'brain_decision_referenced_assertion_immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger brain_decision_referenced_assertion_guard
before update or delete on public.brain_assertions
for each row execute function private.brain_decision_referenced_assertion_guard();

create or replace function private.brain_decision_referenced_source_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.brain_decision_evidence_atoms atom
    where atom.source_id = old.id
      and (
        exists (select 1 from public.brain_decision_evidence_links link where link.evidence_atom_id = atom.id)
        or exists (select 1 from public.brain_decision_human_priors prior where prior.source_evidence_atom_id = atom.id)
        or exists (select 1 from public.brain_decision_answers answer_row where answer_row.source_evidence_atom_id = atom.id)
        or exists (select 1 from public.brain_decision_calls call_row where call_row.source_evidence_atom_id = atom.id)
        or exists (select 1 from public.brain_decision_outcomes outcome_row where outcome_row.source_evidence_atom_id = atom.id)
      )
  ) then raise exception 'brain_decision_referenced_source_immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger brain_decision_referenced_source_guard
before update or delete on public.brain_sources
for each row execute function private.brain_decision_referenced_source_guard();

create or replace function private.brain_decision_snapshot_sha256(p_decision_version_id uuid)
returns text
language sql
stable
strict
security definer
set search_path = ''
as $$
  select encode(sha256(convert_to(concat_ws('|',
    version_row.id::text, version_row.decision_id::text, version_row.workspace_id::text,
    version_row.subject_id::text, version_row.version::text,
    version_row.title_ciphertext, version_row.stakes_ciphertext,
    version_row.provisional_view_ciphertext, version_row.analysis_ciphertext,
    version_row.encryption_version::text, version_row.source_watermark_sha256,
    coalesce(version_row.predecessor_version_id::text, ''),
    coalesce((select predecessor.snapshot_sha256
      from public.brain_decision_versions predecessor
      where predecessor.id = version_row.predecessor_version_id), ''),
    private.brain_decision_timestamp_token(version_row.generated_at), private.brain_decision_timestamp_token(version_row.fresh_until),
    coalesce((select string_agg(concat_ws(':', prior.id::text, prior.content_sha256,
      prior.source_assertion_id::text, prior.source_evidence_atom_id::text, atom.atom_sha256,
      prior.recorded_by::text, private.brain_decision_timestamp_token(prior.recorded_at)), ',' order by prior.recorded_at, prior.id)
      from public.brain_decision_human_priors prior
      join public.brain_decision_evidence_atoms atom on atom.id = prior.source_evidence_atom_id
      where prior.decision_version_id = version_row.id and prior.superseded_at is null), ''),
    coalesce((select string_agg(concat_ws(':', route_order::text, content_sha256, is_default::text, is_recommended::text, private.brain_decision_timestamp_token(created_at)), ',' order by route_order)
      from public.brain_decision_routes where decision_version_id = version_row.id), ''),
    coalesce((select string_agg(concat_ws(':', question_row.question_order::text, question_row.content_sha256, question_row.route_id::text,
      question_row.kind, question_row.answer_mode, question_row.operator_state,
      coalesce(question_row.prior_decision_id::text, ''), coalesce(question_row.prior_decision_version_id::text, ''),
      coalesce((select prior_version.snapshot_sha256 from public.brain_decision_versions prior_version
        where prior_version.id = question_row.prior_decision_version_id), ''),
      private.brain_decision_timestamp_token(question_row.created_at)), ',' order by question_row.question_order)
      from public.brain_decision_questions question_row where question_row.decision_version_id = version_row.id), ''),
    coalesce((select string_agg(concat_ws(':', link.artifact_kind, link.artifact_id::text,
      link.assertion_id::text, link.evidence_atom_id::text, atom.atom_sha256,
      link.stance, private.brain_decision_timestamp_token(link.linked_at)), ','
      order by link.artifact_kind, link.artifact_id, link.assertion_id, link.stance)
      from public.brain_decision_evidence_links link
      join public.brain_decision_evidence_atoms atom on atom.id = link.evidence_atom_id
      where link.decision_version_id = version_row.id), '')
  ), 'UTF8')), 'hex')
  from public.brain_decision_versions version_row
  where version_row.id = p_decision_version_id
$$;

create or replace function private.brain_decision_call_input_sha256(
  p_call_id uuid,
  p_decision_version_id uuid,
  p_workspace_id uuid,
  p_subject_id uuid,
  p_call_ciphertext text,
  p_conditions_ciphertext text,
  p_encryption_version smallint,
  p_source_assertion_id uuid,
  p_recorded_by uuid,
  p_recorded_at timestamptz
)
returns text
language plpgsql
volatile
strict
security definer
set search_path = ''
as $$
declare
  source_evidence_atom_id uuid;
  source_evidence_atom_sha256 text;
begin
  source_evidence_atom_id := private.brain_decision_materialize_evidence_atom(
    p_source_assertion_id, p_workspace_id, p_subject_id
  );
  select atom.atom_sha256 into strict source_evidence_atom_sha256
  from public.brain_decision_evidence_atoms atom
  where atom.id = source_evidence_atom_id;
  return encode(sha256(convert_to(concat_ws('|',
    p_call_id::text, p_decision_version_id::text, p_workspace_id::text, p_subject_id::text,
    p_call_ciphertext, p_conditions_ciphertext, p_encryption_version::text,
    p_source_assertion_id::text, source_evidence_atom_id::text, source_evidence_atom_sha256,
    p_recorded_by::text, private.brain_decision_timestamp_token(p_recorded_at)
  ), 'UTF8')), 'hex');
end;
$$;

create or replace function private.brain_decision_call_version_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_standing text;
  version_sealed_at timestamptz;
begin
  select standing, sealed_at
  into version_standing, version_sealed_at
  from public.brain_decision_versions
  where id = new.decision_version_id
  for share nowait;
  if version_standing <> 'sealed' or version_sealed_at is null then
    raise exception 'brain_decision_call_authority_invalid';
  end if;
  return new;
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create or replace function private.brain_decision_call_authority_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare authority_row public.brain_decision_authority_events%rowtype;
declare expected_input text;
declare version_standing text;
declare version_sealed_at timestamptz;
declare authority_found boolean;
begin
  select * into authority_row
  from public.brain_decision_authority_events
  where id = new.authority_event_id
  for no key update nowait;
  authority_found := found;
  select standing, sealed_at into version_standing, version_sealed_at
  from public.brain_decision_versions
  where id = new.decision_version_id;
  expected_input := private.brain_decision_call_input_sha256(
    new.id, new.decision_version_id, new.workspace_id, new.subject_id,
    new.call_ciphertext, new.conditions_ciphertext, new.encryption_version,
    new.source_assertion_id, new.recorded_by, new.recorded_at
  );
  if not authority_found
    or version_standing <> 'sealed'
    or version_sealed_at is null
    or authority_row.event_kind <> 'record_owned_call'
    or authority_row.decision_id <> new.decision_id
    or authority_row.decision_version_id <> new.decision_version_id
    or authority_row.workspace_id <> new.workspace_id
    or authority_row.subject_id <> new.subject_id
    or authority_row.actor_user_id <> new.subject_id
    or authority_row.input_sha256 <> expected_input
    or authority_row.occurred_at < (
      select atom.causal_watermark_at
      from public.brain_decision_evidence_atoms atom
      where atom.id = new.source_evidence_atom_id
    )
    or authority_row.occurred_at < version_sealed_at
    or new.recorded_at < version_sealed_at
    or new.recorded_at < authority_row.occurred_at
    or new.recorded_at >= authority_row.valid_until
    or new.recorded_at > statement_timestamp()
    or authority_row.occurred_at > statement_timestamp()
    or authority_row.valid_until <= statement_timestamp()
    or exists (select 1 from public.brain_decision_authority_revocations revocation where revocation.authority_event_id = authority_row.id and revocation.revoked_at <= statement_timestamp())
  then raise exception 'brain_decision_call_authority_invalid'; end if;
  return new;
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create or replace function private.brain_decision_call_event_append()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type,
    actor_user_id, authority_event_id, idempotency_key, after_ref, input_sha256, occurred_at
  ) values (
    new.decision_id, new.decision_version_id, new.workspace_id, new.subject_id, 'call_recorded',
    new.recorded_by, new.authority_event_id, new.idempotency_key, new.id,
    private.brain_decision_call_input_sha256(
      new.id, new.decision_version_id, new.workspace_id, new.subject_id,
      new.call_ciphertext, new.conditions_ciphertext, new.encryption_version,
      new.source_assertion_id, new.recorded_by, new.recorded_at
    ), new.recorded_at
  );
  return new;
end;
$$;

create trigger brain_decision_calls_05_version_guard
before insert on public.brain_decision_calls
for each row execute function private.brain_decision_call_version_guard();
create trigger brain_decision_calls_10_authority_guard
after insert on public.brain_decision_calls
for each row execute function private.brain_decision_call_authority_guard();
create trigger brain_decision_calls_20_event_append
after insert on public.brain_decision_calls
for each row execute function private.brain_decision_call_event_append();

create or replace function private.brain_decision_case_chronology_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.opened_at > statement_timestamp() then raise exception 'brain_decision_case_chronology_invalid'; end if;
  return new;
end;
$$;

create or replace function private.brain_decision_answer_chronology_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare question_created_at timestamptz;
declare question_kind text;
declare question_answer_mode text;
declare question_operator_state text;
declare version_standing text;
declare version_sealed_at timestamptz;
declare expected_source_xmin xid;
declare expected_assertion_xmin xid;
declare expected_atom_id uuid;
begin
  select assertion_row.xmin, source_row.xmin
  into expected_assertion_xmin, expected_source_xmin
  from public.brain_assertions assertion_row
  left join public.brain_sources source_row
    on source_row.id = assertion_row.source_id
    and source_row.workspace_id = new.workspace_id
    and source_row.subject_id = new.subject_id
  where assertion_row.id = new.source_assertion_id
    and assertion_row.workspace_id = new.workspace_id
    and assertion_row.subject_id = new.subject_id;
  if not found then raise exception 'brain_decision_evidence_assertion_not_found'; end if;
  if expected_source_xmin is null then raise exception 'brain_decision_evidence_source_scope_invalid'; end if;

  select question_row.created_at, question_row.kind, question_row.answer_mode, question_row.operator_state,
    version_row.standing, version_row.sealed_at
  into question_created_at, question_kind, question_answer_mode, question_operator_state,
    version_standing, version_sealed_at
  from public.brain_decision_questions question_row
  join public.brain_decision_versions version_row on version_row.id = question_row.decision_version_id
  where question_row.id = new.question_id
    and question_row.decision_version_id = new.decision_version_id
    and question_row.workspace_id = new.workspace_id
    and question_row.subject_id = new.subject_id
  for update of version_row nowait;
  if not found then raise exception 'brain_decision_answer_chronology_invalid'; end if;
  if question_kind <> 'leader_can_answer' then raise exception 'brain_decision_answer_question_kind_invalid'; end if;
  if question_answer_mode = 'operator_research' then raise exception 'brain_decision_answer_mode_invalid'; end if;
  if question_operator_state <> 'asked' then raise exception 'brain_decision_answer_question_state_invalid'; end if;
  if version_standing <> 'sealed' then raise exception 'brain_decision_answer_chronology_invalid'; end if;
  if version_sealed_at is null or new.recorded_at < version_sealed_at then raise exception 'brain_decision_answer_chronology_invalid'; end if;
  if new.recorded_at < question_created_at then raise exception 'brain_decision_answer_chronology_invalid'; end if;
  if new.recorded_at > statement_timestamp() then raise exception 'brain_decision_answer_chronology_invalid'; end if;
  expected_atom_id := private.brain_decision_materialize_evidence_atom(
    new.source_assertion_id, new.workspace_id, new.subject_id,
    expected_assertion_xmin, expected_source_xmin
  );
  if new.source_evidence_atom_id is null then
    new.source_evidence_atom_id := expected_atom_id;
  elsif new.source_evidence_atom_id <> expected_atom_id then
    raise exception 'brain_decision_answer_source_atom_mismatch';
  end if;
  return new;
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

create or replace function private.brain_decision_outcome_chronology_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare call_recorded_at timestamptz;
begin
  select call_row.recorded_at into call_recorded_at
  from public.brain_decision_calls call_row
  where call_row.id = new.decision_call_id
    and call_row.decision_id = new.decision_id
    and call_row.workspace_id = new.workspace_id
    and call_row.subject_id = new.subject_id;
  if not found then raise exception 'brain_decision_outcome_chronology_invalid'; end if;
  if new.observed_at < call_recorded_at then raise exception 'brain_decision_outcome_chronology_invalid'; end if;
  if new.recorded_at < new.observed_at then raise exception 'brain_decision_outcome_chronology_invalid'; end if;
  if new.recorded_at > statement_timestamp() then raise exception 'brain_decision_outcome_chronology_invalid'; end if;
  return new;
end;
$$;

create trigger brain_decision_cases_chronology_guard
before insert on public.brain_decision_cases
for each row execute function private.brain_decision_case_chronology_guard();
create trigger brain_decision_answers_chronology_guard
before insert on public.brain_decision_answers
for each row execute function private.brain_decision_answer_chronology_guard();
create trigger brain_decision_outcomes_chronology_guard
before insert on public.brain_decision_outcomes
for each row execute function private.brain_decision_outcome_chronology_guard();

create or replace function private.brain_decision_case_event_append()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type,
    actor_user_id, idempotency_key, after_ref, input_sha256, occurred_at
  ) values (
    new.id, null, new.workspace_id, new.subject_id, 'case_opened',
    new.created_by, 'case-opened:' || new.id::text, new.id,
    encode(sha256(convert_to(concat_ws('|',
      new.id::text, new.workspace_id::text, new.subject_id::text, new.owner_id::text,
      new.status, coalesce(private.brain_decision_timestamp_token(new.decision_by), ''),
      private.brain_decision_timestamp_token(new.opened_at), new.created_by::text,
      private.brain_decision_timestamp_token(new.created_at)
    ), 'UTF8')), 'hex'), new.opened_at
  );
  return new;
end;
$$;

create or replace function private.brain_decision_answer_event_append()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare answer_decision_id uuid;
begin
  select question_row.decision_id into strict answer_decision_id
  from public.brain_decision_questions question_row
  where question_row.id = new.question_id
    and question_row.decision_version_id = new.decision_version_id
    and question_row.workspace_id = new.workspace_id
    and question_row.subject_id = new.subject_id;
  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type,
    actor_user_id, idempotency_key, after_ref, input_sha256, occurred_at
  ) values (
    answer_decision_id, new.decision_version_id, new.workspace_id, new.subject_id, 'question_answered',
    new.recorded_by, 'question-answered:' || new.id::text, new.id,
    encode(sha256(convert_to(concat_ws('|',
      new.id::text, new.question_id::text, new.decision_version_id::text,
      new.workspace_id::text, new.subject_id::text, new.content_sha256,
      new.encryption_version::text, new.source_assertion_id::text,
      new.source_evidence_atom_id::text,
      (select atom.atom_sha256 from public.brain_decision_evidence_atoms atom where atom.id = new.source_evidence_atom_id),
      new.recorded_by::text,
      private.brain_decision_timestamp_token(new.recorded_at)
    ), 'UTF8')), 'hex'), new.recorded_at
  );
  return new;
end;
$$;

create or replace function private.brain_decision_outcome_event_append()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare outcome_version_id uuid;
begin
  select call_row.decision_version_id into strict outcome_version_id
  from public.brain_decision_calls call_row
  where call_row.id = new.decision_call_id
    and call_row.decision_id = new.decision_id
    and call_row.workspace_id = new.workspace_id
    and call_row.subject_id = new.subject_id;
  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type,
    actor_user_id, idempotency_key, after_ref, input_sha256, occurred_at
  ) values (
    new.decision_id, outcome_version_id, new.workspace_id, new.subject_id, 'outcome_recorded',
    new.recorded_by, 'outcome-recorded:' || new.id::text, new.id,
    encode(sha256(convert_to(concat_ws('|',
      new.id::text, new.decision_call_id::text, new.decision_id::text,
      new.workspace_id::text, new.subject_id::text, new.content_sha256,
      new.encryption_version::text, new.source_assertion_id::text,
      new.source_evidence_atom_id::text,
      (select atom.atom_sha256 from public.brain_decision_evidence_atoms atom where atom.id = new.source_evidence_atom_id),
      private.brain_decision_timestamp_token(new.observed_at), new.recorded_by::text,
      private.brain_decision_timestamp_token(new.recorded_at)
    ), 'UTF8')), 'hex'), new.recorded_at
  );
  return new;
end;
$$;

create trigger brain_decision_cases_event_append
after insert on public.brain_decision_cases
for each row execute function private.brain_decision_case_event_append();
create trigger brain_decision_answers_event_append
after insert on public.brain_decision_answers
for each row execute function private.brain_decision_answer_event_append();
create trigger brain_decision_outcomes_event_append
after insert on public.brain_decision_outcomes
for each row execute function private.brain_decision_outcome_event_append();

create or replace function public.seal_brain_decision_version_v1(
  p_decision_version_id uuid,
  p_authority_event_id uuid,
  p_expected_source_watermark_sha256 text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_row public.brain_decision_versions%rowtype;
  predecessor_row public.brain_decision_versions%rowtype;
  authority_row public.brain_decision_authority_events%rowtype;
  route_count integer;
  missing_question_count integer;
  unbalanced_route_count integer;
  computed_snapshot text;
begin
  if current_setting('role', true) <> 'service_role' and (select session_user) <> 'service_role' then raise exception 'brain_decision_service_role_required' using errcode = '42501'; end if;
  if p_expected_source_watermark_sha256 !~ '^[0-9a-f]{64}$' or char_length(btrim(p_idempotency_key)) = 0 then
    raise exception 'brain_decision_seal_input_invalid' using errcode = '22023';
  end if;

  select * into version_row from public.brain_decision_versions where id = p_decision_version_id for update nowait;
  if not found then raise exception 'brain_decision_version_not_found'; end if;
  if version_row.standing in ('sealed', 'superseded') then
    if version_row.sealed_by_authority_event_id = p_authority_event_id
      and version_row.source_watermark_sha256 = p_expected_source_watermark_sha256
      and exists (
        select 1 from public.brain_decision_events event_row
        where event_row.decision_id = version_row.decision_id
          and event_row.decision_version_id = version_row.id
          and event_row.authority_event_id = p_authority_event_id
          and event_row.idempotency_key = p_idempotency_key
          and event_row.event_type = 'analysis_sealed'
          and event_row.input_sha256 = version_row.snapshot_sha256
      )
    then return jsonb_build_object('status', 'replayed', 'decision_version_id', version_row.id, 'snapshot_sha256', version_row.snapshot_sha256); end if;
    raise exception 'brain_decision_seal_replay_conflict';
  end if;
  if version_row.standing <> 'draft' then raise exception 'brain_decision_version_not_draft'; end if;
  if version_row.source_watermark_sha256 <> p_expected_source_watermark_sha256 then raise exception 'brain_decision_source_watermark_changed'; end if;
  if version_row.fresh_until <= statement_timestamp() then raise exception 'brain_decision_analysis_stale'; end if;

  if version_row.version = 1 then
    if version_row.predecessor_version_id is not null then raise exception 'brain_decision_predecessor_invalid'; end if;
  else
    select * into predecessor_row
    from public.brain_decision_versions
    where id = version_row.predecessor_version_id
    for update nowait;
    if not found
      or predecessor_row.decision_id <> version_row.decision_id
      or predecessor_row.workspace_id <> version_row.workspace_id
      or predecessor_row.subject_id <> version_row.subject_id
      or predecessor_row.version <> version_row.version - 1
      or predecessor_row.standing <> 'sealed'
    then raise exception 'brain_decision_predecessor_invalid'; end if;
  end if;

  select * into authority_row
  from public.brain_decision_authority_events
  where id = p_authority_event_id
  for no key update nowait;
  if not found
    or authority_row.decision_version_id <> version_row.id
    or authority_row.decision_id <> version_row.decision_id
    or authority_row.workspace_id <> version_row.workspace_id
    or authority_row.subject_id <> version_row.subject_id
    or authority_row.event_kind <> 'seal_analysis'
    or authority_row.audience <> 'delivery_team_private'
    or authority_row.purpose <> 'operator_decision_preparation'
    or exists (select 1 from public.brain_decision_authority_revocations revocation where revocation.authority_event_id = authority_row.id and revocation.revoked_at <= statement_timestamp())
    or authority_row.occurred_at > statement_timestamp()
    or authority_row.valid_until <= statement_timestamp()
  then raise exception 'brain_decision_authority_invalid'; end if;
  if predecessor_row.id is not null and authority_row.occurred_at < predecessor_row.sealed_at
    then raise exception 'brain_decision_authority_predates_predecessor'; end if;
  if authority_row.occurred_at < version_row.generated_at then raise exception 'brain_decision_authority_predates_snapshot'; end if;
  if authority_row.occurred_at < coalesce((select max(route_row.created_at) from public.brain_decision_routes route_row where route_row.decision_version_id = version_row.id), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_snapshot'; end if;
  if authority_row.occurred_at < coalesce((select max(question_row.created_at) from public.brain_decision_questions question_row where question_row.decision_version_id = version_row.id), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_snapshot'; end if;
  if authority_row.occurred_at < coalesce((select max(link.linked_at) from public.brain_decision_evidence_links link where link.decision_version_id = version_row.id), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_snapshot'; end if;
  if authority_row.occurred_at < coalesce((
    select max(atom.causal_watermark_at)
    from public.brain_decision_evidence_links link
    join public.brain_decision_evidence_atoms atom on atom.id = link.evidence_atom_id
    where link.decision_version_id = version_row.id
  ), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_evidence_provenance'; end if;
  if authority_row.occurred_at < coalesce((
    select max(atom.causal_watermark_at)
    from public.brain_decision_human_priors prior
    join public.brain_decision_evidence_atoms atom on atom.id = prior.source_evidence_atom_id
    where prior.decision_version_id = version_row.id and prior.superseded_at is null
  ), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_prior_provenance'; end if;

  select count(*) into route_count from public.brain_decision_routes where decision_version_id = version_row.id;
  if route_count <> 3 then raise exception 'brain_decision_exactly_three_routes_required'; end if;
  if (select count(*) from public.brain_decision_routes where decision_version_id = version_row.id and is_default) <> 1 then
    raise exception 'brain_decision_one_default_route_required';
  end if;
  if (select count(*) from public.brain_decision_routes where decision_version_id = version_row.id and is_recommended) <> 1 then
    raise exception 'brain_decision_one_recommended_route_required';
  end if;
  if not exists (select 1 from public.brain_decision_human_priors where decision_version_id = version_row.id and superseded_at is null) then
    raise exception 'brain_decision_human_prior_required';
  end if;
  if exists (
    select 1
    from public.brain_decision_human_priors prior
    where prior.decision_version_id = version_row.id
      and prior.superseded_at is null
      and prior.recorded_at > version_row.generated_at
  ) then raise exception 'brain_decision_human_prior_after_analysis_generation'; end if;

  select count(*) into missing_question_count
  from public.brain_decision_routes route_row
  where route_row.decision_version_id = version_row.id
    and not exists (select 1 from public.brain_decision_questions question_row where question_row.route_id = route_row.id);
  if missing_question_count <> 0 then raise exception 'brain_decision_every_route_needs_question'; end if;
  if exists (
    select 1 from public.brain_decision_questions question_row
    where question_row.decision_version_id = version_row.id
      and not exists (
        select 1 from public.brain_decision_evidence_links link
        where link.artifact_kind = 'question' and link.artifact_id = question_row.id
      )
  ) then raise exception 'brain_decision_every_question_needs_evidence'; end if;
  if exists (
    select 1 from public.brain_decision_questions question_row
    where question_row.decision_version_id = version_row.id
      and question_row.kind = 'prior_decision_match'
      and question_row.prior_decision_id = version_row.decision_id
  ) then raise exception 'brain_decision_prior_match_self_reference'; end if;
  if exists (
    select 1
    from public.brain_decision_questions question_row
    left join public.brain_decision_versions prior_version
      on prior_version.id = question_row.prior_decision_version_id
      and prior_version.decision_id = question_row.prior_decision_id
      and prior_version.workspace_id = question_row.workspace_id
      and prior_version.subject_id = question_row.subject_id
    where question_row.decision_version_id = version_row.id
      and question_row.kind = 'prior_decision_match'
      and question_row.prior_decision_id <> version_row.decision_id
      and (
        prior_version.id is null
        or prior_version.standing not in ('sealed', 'superseded')
        or prior_version.snapshot_sha256 is null
        or prior_version.sealed_at is null
        or prior_version.sealed_at > version_row.generated_at
      )
  ) then raise exception 'brain_decision_prior_match_unaccepted'; end if;

  select count(*) into unbalanced_route_count
  from public.brain_decision_routes route_row
  where route_row.decision_version_id = version_row.id
    and (
      not exists (select 1 from public.brain_decision_evidence_links link where link.artifact_kind = 'route' and link.artifact_id = route_row.id and link.stance = 'supports')
      or not exists (select 1 from public.brain_decision_evidence_links link where link.artifact_kind = 'route' and link.artifact_id = route_row.id and link.stance = 'refutes')
    );
  if unbalanced_route_count <> 0 then raise exception 'brain_decision_each_route_needs_support_and_refutation'; end if;
  if not exists (select 1 from public.brain_decision_evidence_links where decision_version_id = version_row.id and artifact_kind = 'current_read')
    or not exists (select 1 from public.brain_decision_evidence_links where decision_version_id = version_row.id and artifact_kind = 'recommended_move')
  then raise exception 'brain_decision_analysis_evidence_required'; end if;

  computed_snapshot := private.brain_decision_snapshot_sha256(version_row.id);
  if computed_snapshot is null then raise exception 'brain_decision_snapshot_unavailable'; end if;
  if authority_row.input_sha256 <> computed_snapshot then raise exception 'brain_decision_authority_input_changed'; end if;

  if predecessor_row.id is not null then
    perform set_config('ctrl.brain_decision_supersede', predecessor_row.id::text, true);
    update public.brain_decision_versions set standing = 'superseded' where id = predecessor_row.id;
    if not found then raise exception 'brain_decision_predecessor_transition_failed'; end if;
    perform set_config('ctrl.brain_decision_supersede', '', true);
  end if;
  perform set_config('ctrl.brain_decision_seal', version_row.id::text || ':' || computed_snapshot, true);
  update public.brain_decision_versions
  set standing = 'sealed', sealed_at = statement_timestamp(), sealed_by_authority_event_id = authority_row.id, snapshot_sha256 = computed_snapshot
  where id = version_row.id;
  perform set_config('ctrl.brain_decision_seal', '', true);
  if predecessor_row.id is not null then
    insert into public.brain_decision_events (
      decision_id, decision_version_id, workspace_id, subject_id, event_type, actor_user_id,
      authority_event_id, idempotency_key, before_ref, after_ref, input_sha256, occurred_at
    ) values (
      version_row.decision_id, version_row.id, version_row.workspace_id, version_row.subject_id,
      'analysis_superseded', authority_row.actor_user_id, authority_row.id,
      'supersede-version:' || predecessor_row.id::text, predecessor_row.id, version_row.id,
      computed_snapshot, statement_timestamp()
    );
  end if;
  insert into public.brain_decision_events (
    decision_id, decision_version_id, workspace_id, subject_id, event_type, actor_user_id,
    authority_event_id, idempotency_key, before_ref, after_ref, input_sha256, occurred_at
  ) values (
    version_row.decision_id, version_row.id, version_row.workspace_id, version_row.subject_id, 'analysis_sealed', authority_row.actor_user_id,
    authority_row.id, p_idempotency_key, version_row.predecessor_version_id, version_row.id, computed_snapshot, statement_timestamp()
  );
  return jsonb_build_object('status', 'sealed', 'decision_version_id', version_row.id, 'snapshot_sha256', computed_snapshot);
exception
  when lock_not_available then
    raise exception 'brain_decision_governing_lock_busy_retry' using errcode = '55P03';
end;
$$;

revoke all on function public.seal_brain_decision_version_v1(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.seal_brain_decision_version_v1(uuid, uuid, text, text) to service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'brain_subject_profiles', 'brain_decision_cases', 'brain_decision_versions',
    'brain_decision_routes', 'brain_decision_human_priors', 'brain_decision_questions',
    'brain_decision_answers', 'brain_decision_calls', 'brain_decision_outcomes',
    'brain_decision_evidence_atoms', 'brain_decision_evidence_links', 'brain_decision_authority_events',
    'brain_decision_authority_revocations', 'brain_decision_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('revoke all on table public.%I from service_role', table_name);
    if table_name in ('brain_decision_evidence_atoms', 'brain_decision_events') then
      execute format('grant select on table public.%I to service_role', table_name);
    else
      execute format('grant select, insert on table public.%I to service_role', table_name);
    end if;
  end loop;
end;
$$;

grant usage, select on all sequences in schema public to service_role;
revoke all on function private.brain_decision_artifact_scope_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_draft_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_version_immutable_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_append_only_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_content_hash_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_case_identity_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_owned_record_transition_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_timestamp_token(timestamptz) from public, anon, authenticated;
revoke all on function private.brain_decision_evidence_atom_sha256(jsonb, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.brain_decision_materialize_evidence_atom(uuid, uuid, uuid, xid, xid) from public, anon, authenticated;
revoke all on function private.brain_decision_materialize_evidence_atom(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.brain_decision_validate_evidence_atom(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.brain_decision_human_prior_admission_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_source_atom_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_evidence_link_atom_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_referenced_assertion_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_referenced_source_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_cipher_aad_sha256(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function private.brain_decision_validate_ciphertext(text, text) from public, anon, authenticated;
revoke all on function private.brain_decision_cipher_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_snapshot_sha256(uuid) from public, anon, authenticated;
revoke all on function private.brain_decision_call_input_sha256(uuid, uuid, uuid, uuid, text, text, smallint, uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function private.brain_decision_call_version_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_call_authority_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_call_event_append() from public, anon, authenticated;
revoke all on function private.brain_decision_case_chronology_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_answer_chronology_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_outcome_chronology_guard() from public, anon, authenticated;
revoke all on function private.brain_decision_case_event_append() from public, anon, authenticated;
revoke all on function private.brain_decision_answer_event_append() from public, anon, authenticated;
revoke all on function private.brain_decision_outcome_event_append() from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.brain_decision_cipher_aad_sha256(uuid, uuid, uuid, text, text) to service_role;
grant execute on function private.brain_decision_evidence_atom_sha256(jsonb, jsonb, timestamptz, timestamptz) to service_role;
grant execute on function private.brain_decision_materialize_evidence_atom(uuid, uuid, uuid) to service_role;
grant execute on function private.brain_decision_snapshot_sha256(uuid) to service_role;
grant execute on function private.brain_decision_call_input_sha256(uuid, uuid, uuid, uuid, text, text, smallint, uuid, uuid, timestamptz) to service_role;
