-- G25 R142 consequential-work spine canary. Disposable database only.

begin;

insert into auth.users (id, email) values
  ('14200000-0000-4000-8000-000000000001', 'leader-r142@example.test'),
  ('14200000-0000-4000-8000-000000000002', 'operator-r142@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values (
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  'g25-r142-crossing'
);

insert into public.brain_workspace_roles (workspace_id, user_id, role, granted_by)
values (
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000002',
  'operator',
  '14200000-0000-4000-8000-000000000001'
);

insert into public.brain_audience_grants (
  id, workspace_id, grantee_user_id, audience, purpose, granted_by, granted_at, expires_at
) values (
  '14220000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000002',
  'delivery_team_private',
  'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  statement_timestamp() - interval '1 hour',
  statement_timestamp() + interval '7 days'
);

create or replace function private.r142_cipher(
  p_record_id uuid,
  p_record_kind text,
  p_field text,
  p_payload text
)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select jsonb_build_object(
    'v', 1,
    'alg', 'A256GCM',
    'kid', 'r142.test-key',
    'iv', 'AAAAAAAAAAAAAAAA',
    'ciphertext', replace(encode(convert_to(p_payload || repeat('x', 16), 'UTF8'), 'base64'), E'\n', ''),
    'aad_sha256', private.brain_decision_cipher_aad_sha256(
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      p_record_id, p_record_kind, p_field
    )
  )::text
$$;
grant execute on function private.r142_cipher(uuid, text, text, text) to service_role;

create or replace function private.r142_main_seal_authority(p_id uuid, p_occurred_at timestamptz)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    p_id, '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'seal_analysis', 'delivery_team_private',
    'operator_decision_preparation', '14200000-0000-4000-8000-000000000001',
    private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
    p_occurred_at, statement_timestamp() + interval '1 day'
  )
$$;
grant execute on function private.r142_main_seal_authority(uuid, timestamptz) to service_role;

do $$
declare
  materializer_definition text;
  answer_chronology_definition text;
  human_prior_admission_definition text;
  governing_lock_definitions text;
  shared_lock_count integer;
  fail_fast_shared_lock_count integer;
  fail_fast_governing_lock_count integer;
  compatible_authority_lock_count integer;
  call_version_shared_lock_count integer;
  governing_busy_signal_count integer;
  identity_constraint_definition text;
  answer_preflight_position integer;
  answer_version_lock_position integer;
  answer_materialization_position integer;
  prior_preflight_position integer;
  prior_version_lock_position integer;
  prior_materialization_position integer;
  human_prior_trigger_order text[];
begin
  select lower(pg_get_functiondef(
    'private.brain_decision_materialize_evidence_atom(uuid,uuid,uuid,xid,xid)'::regprocedure
  )) into materializer_definition;
  shared_lock_count := (
    length(materializer_definition) - length(replace(materializer_definition, 'for share;', ''))
  ) / length('for share;');
  fail_fast_shared_lock_count := (
    length(materializer_definition) - length(replace(materializer_definition, 'for share nowait;', ''))
  ) / length('for share nowait;');
  if materializer_definition like '%for update%' then
    raise exception 'evidence atom materializer lost nonexclusive provenance locks';
  end if;
  if fail_fast_shared_lock_count <> 2
    or materializer_definition not like '%brain_decision_evidence_provenance_busy_retry%'
  then
    raise exception 'materializer lost universal fail-fast provenance locks';
  end if;
  if materializer_definition not like '%pg_try_advisory_xact_lock(atom_identity_lock)%'
    or materializer_definition like '%perform pg_advisory_xact_lock(atom_identity_lock)%'
    or materializer_definition not like '%ctrl.brain_decision_evidence_atom.v1%'
    or materializer_definition not like '%assertion_digest%'
    or materializer_definition not like '%source_digest%'
  then
    raise exception 'materializer lost universal fail-fast atom identity lock';
  end if;
  if shared_lock_count <> 0 then
    raise exception 'evidence atom materializer lost nonexclusive provenance locks';
  end if;
  if materializer_definition not like '%brain_decision_materializer_requires_read_committed%'
    or materializer_definition not like '%on conflict on constraint brain_decision_evidence_atoms_content_identity_unique do nothing%'
    or materializer_definition not like '%brain_decision_evidence_atom_winner_not_visible%'
  then
    raise exception 'evidence atom materializer lost stable identity reuse';
  end if;
  if materializer_definition not like '%winner_row.assertion_snapshot is distinct from assertion_snapshot_value%'
    or materializer_definition not like '%winner_row.source_snapshot is distinct from source_snapshot_value%'
    or materializer_definition not like '%brain_decision_evidence_atom_digest_collision%'
  then
    raise exception 'evidence atom materializer lost exact collision validation';
  end if;
  if materializer_definition not like '%observed_source_xmin%'
    or materializer_definition not like '%observed_assertion_xmin%'
    or materializer_definition not like '%locked_source_xmin is distinct from observed_source_xmin%'
    or materializer_definition not like '%locked_assertion_xmin is distinct from observed_assertion_xmin%'
    or materializer_definition not like '%observed_assertion_xmin is distinct from p_expected_assertion_xmin%'
    or materializer_definition not like '%observed_source_xmin is distinct from p_expected_source_xmin%'
    or materializer_definition not like '%brain_decision_evidence_provenance_changed_during_materialization%'
  then
    raise exception 'evidence atom materializer lost row-version stability';
  end if;

  select lower(pg_get_functiondef(
    'private.brain_decision_answer_chronology_guard()'::regprocedure
  )) into answer_chronology_definition;
  answer_preflight_position := strpos(answer_chronology_definition, 'select assertion_row.xmin, source_row.xmin');
  answer_version_lock_position := strpos(answer_chronology_definition, 'for update of version_row');
  answer_materialization_position := strpos(answer_chronology_definition,
    'expected_atom_id := private.brain_decision_materialize_evidence_atom');
  if answer_preflight_position = 0
    or answer_version_lock_position = 0
    or answer_materialization_position = 0
    or answer_preflight_position >= answer_version_lock_position
    or answer_materialization_position <= answer_version_lock_position
    or answer_chronology_definition not like '%expected_assertion_xmin, expected_source_xmin%'
    or answer_chronology_definition not like '%new.source_evidence_atom_id := expected_atom_id%'
  then
    raise exception 'answer admission lost pre-wait provenance binding';
  end if;

  select lower(pg_get_functiondef(
    'private.brain_decision_human_prior_admission_guard()'::regprocedure
  )) into human_prior_admission_definition;
  prior_preflight_position := strpos(human_prior_admission_definition, 'select assertion_row.xmin, source_row.xmin');
  prior_version_lock_position := strpos(human_prior_admission_definition, 'for update');
  prior_materialization_position := strpos(human_prior_admission_definition,
    'expected_atom_id := private.brain_decision_materialize_evidence_atom');
  if prior_preflight_position = 0
    or prior_version_lock_position = 0
    or prior_materialization_position = 0
    or prior_preflight_position >= prior_version_lock_position
    or prior_materialization_position <= prior_version_lock_position
    or human_prior_admission_definition not like '%expected_assertion_xmin, expected_source_xmin%'
    or human_prior_admission_definition not like '%new.source_evidence_atom_id := expected_atom_id%'
    or human_prior_admission_definition not like '%brain_decision_human_prior_source_atom_mismatch%'
  then
    raise exception 'human prior admission lost pre-wait provenance binding';
  end if;

  select array_agg(trigger_row.tgname order by trigger_row.tgname)
  into human_prior_trigger_order
  from pg_trigger trigger_row
  where trigger_row.tgrelid = 'public.brain_decision_human_priors'::regclass
    and not trigger_row.tgisinternal;
  if human_prior_trigger_order is distinct from array[
    'brain_decision_human_prior_00_admission_guard',
    'brain_decision_human_prior_transition_guard',
    'brain_decision_human_priors_00_source_atom_guard',
    'brain_decision_human_priors_cipher',
    'brain_decision_human_priors_hash'
  ]::text[] then
    raise exception 'human prior trigger order is not causally bound:%', human_prior_trigger_order;
  end if;

  select string_agg(lower(pg_get_functiondef(routine.oid)), E'\n')
  into governing_lock_definitions
  from pg_catalog.pg_proc routine
  join pg_catalog.pg_namespace namespace on namespace.oid = routine.pronamespace
  where namespace.nspname in ('private', 'public')
    and routine.proname in (
      'brain_decision_authority_revocation_guard',
      'brain_decision_draft_guard',
      'brain_decision_human_prior_admission_guard',
      'brain_decision_call_version_guard',
      'brain_decision_call_authority_guard',
      'brain_decision_answer_chronology_guard',
      'seal_brain_decision_version_v1'
    );
  fail_fast_governing_lock_count := (
    length(governing_lock_definitions) - length(replace(governing_lock_definitions, 'for update nowait', ''))
  ) / length('for update nowait');
  compatible_authority_lock_count := (
    length(governing_lock_definitions) - length(replace(governing_lock_definitions, 'for no key update nowait', ''))
  ) / length('for no key update nowait');
  call_version_shared_lock_count := (
    length(governing_lock_definitions) - length(replace(governing_lock_definitions, 'for share nowait', ''))
  ) / length('for share nowait');
  governing_busy_signal_count := (
    length(governing_lock_definitions) - length(replace(governing_lock_definitions, 'brain_decision_governing_lock_busy_retry', ''))
  ) / length('brain_decision_governing_lock_busy_retry');
  if governing_lock_definitions like '%for update;%'
    or fail_fast_governing_lock_count + compatible_authority_lock_count <> 7
    or governing_lock_definitions not like '%for update of version_row nowait%'
    or governing_busy_signal_count <> 7
  then
    raise exception 'governing locks lost universal fail-fast admission';
  end if;
  if compatible_authority_lock_count <> 3 then
    raise exception 'authority locks lost foreign-key compatibility';
  end if;
  if governing_lock_definitions like '%for share;%'
    or call_version_shared_lock_count <> 1
  then
    raise exception 'owned-call governing-version lock lost pre-FK admission';
  end if;

  select lower(pg_get_constraintdef(constraint_row.oid)) into identity_constraint_definition
  from pg_catalog.pg_constraint constraint_row
  where constraint_row.conrelid = 'public.brain_decision_evidence_atoms'::regclass
    and constraint_row.conname = 'brain_decision_evidence_atoms_content_identity_unique';
  if identity_constraint_definition is distinct from
      'unique (assertion_id, source_id, workspace_id, subject_id, assertion_snapshot_sha256, source_snapshot_sha256)'
  then
    raise exception 'evidence atom stable identity constraint missing';
  end if;
end;
$$;

set local role service_role;

insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
)
select
  ('142d' || lpad(n::text, 4, '0') || '-0000-4000-8000-000000000001')::uuid,
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r142 consequential-work proof', 'delivery_team_private',
  encode(sha256(convert_to('r142-source-' || n::text, 'UTF8')), 'hex'),
  statement_timestamp() - interval '30 minutes',
  '14200000-0000-4000-8000-000000000001'
from generate_series(1, 20) n;

insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values
  (
    '142d9001-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'text',
    '14200000-0000-4000-8000-000000000001', statement_timestamp() + interval '1 hour',
    'r142 future captured source control', 'delivery_team_private', repeat('1', 64),
    statement_timestamp(), '14200000-0000-4000-8000-000000000001'
  ),
  (
    '142d9002-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'text',
    '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
    'r142 future recorded source control', 'delivery_team_private', repeat('2', 64),
    statement_timestamp() + interval '1 hour', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '142d9003-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'text',
    '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
    'r142 future assertion control', 'delivery_team_private', repeat('3', 64),
    statement_timestamp(), '14200000-0000-4000-8000-000000000001'
  );

insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values
  (
    '14239001-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001',
    '142d9001-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'user_stated', 'delivery_team_private',
    'ciphertext:future-captured', 1, repeat('1', 64), statement_timestamp(),
    '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14239002-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001',
    '142d9002-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'user_stated', 'delivery_team_private',
    'ciphertext:future-source-recorded', 1, repeat('2', 64), statement_timestamp(),
    '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14239003-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001',
    '142d9003-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'user_stated', 'delivery_team_private',
    'ciphertext:future-assertion-recorded', 1, repeat('3', 64),
    statement_timestamp() + interval '1 hour',
    '14200000-0000-4000-8000-000000000001'
  );

do $$
begin
  begin
    perform private.brain_decision_materialize_evidence_atom(
      '14239001-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'future-captured source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_evidence_source_captured_in_future' then raise; end if;
  end;
  begin
    perform private.brain_decision_materialize_evidence_atom(
      '14239002-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'future-recorded source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_evidence_source_recorded_in_future' then raise; end if;
  end;
  begin
    perform private.brain_decision_materialize_evidence_atom(
      '14239003-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'future-recorded assertion provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_evidence_assertion_recorded_in_future' then raise; end if;
  end;
end;
$$;

do $$
declare
  assertion_snapshot jsonb := jsonb_build_object('id', 'causal-hash-control');
  source_snapshot jsonb := jsonb_build_object('id', 'causal-hash-source-control');
begin
  if private.brain_decision_evidence_atom_sha256(
      assertion_snapshot, source_snapshot,
      '2026-09-21 10:00:00+00'::timestamptz,
      '2026-09-21 10:00:00+00'::timestamptz
    ) = private.brain_decision_evidence_atom_sha256(
      assertion_snapshot, source_snapshot,
      '2026-09-21 10:00:00.000001+00'::timestamptz,
      '2026-09-21 10:00:00.000001+00'::timestamptz
    )
  then raise exception 'evidence atom hash omitted causal timestamps'; end if;
end;
$$;

insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
)
select
  ('1423' || lpad(n::text, 4, '0') || '-0000-4000-8000-000000000001')::uuid,
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  ('142d' || lpad(n::text, 4, '0') || '-0000-4000-8000-000000000001')::uuid,
  '14200000-0000-4000-8000-000000000001', 'user_stated', 'delivery_team_private',
  'ciphertext:assertion:' || n::text, 1,
  encode(sha256(convert_to('r142-span-' || n::text, 'UTF8')), 'hex'),
  statement_timestamp() - interval '20 minutes',
  '14200000-0000-4000-8000-000000000001'
from generate_series(1, 20) n;

insert into public.brain_subject_profiles (
  workspace_id, subject_id, owner_id, display_name_ciphertext, role_ciphertext,
  organisation_ciphertext, brain_name_ciphertext, primary_aim_ciphertext,
  encryption_version, relationship_started_on, updated_by
) values (
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14210000-0000-4000-8000-000000000001', 'subject_profile', 'display_name', 'display-name'),
  private.r142_cipher('14210000-0000-4000-8000-000000000001', 'subject_profile', 'role', 'role'),
  private.r142_cipher('14210000-0000-4000-8000-000000000001', 'subject_profile', 'organisation', 'organisation'),
  private.r142_cipher('14210000-0000-4000-8000-000000000001', 'subject_profile', 'brain_name', 'brain-name'),
  private.r142_cipher('14210000-0000-4000-8000-000000000001', 'subject_profile', 'primary_aim', 'primary-aim'),
  1, current_date - 11,
  '14200000-0000-4000-8000-000000000001'
);

insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 'active',
  statement_timestamp() + interval '14 days', statement_timestamp() - interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);

do $$
begin
  begin
    insert into public.brain_decision_cases (
      id, workspace_id, subject_id, owner_id, status, opened_at, created_by
    ) values (
      '14240000-0000-4000-8000-000000000003', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      'framing', statement_timestamp() + interval '1 hour', '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'future-opened case was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_case_chronology_invalid' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_versions (
      id, decision_id, workspace_id, subject_id, version, standing,
      title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
      encryption_version, source_watermark_sha256, snapshot_sha256,
      generated_at, fresh_until, sealed_at, created_by
    ) values (
      '14250000-0000-4000-8000-000000000009',
      '14240000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', 1, 'sealed',
      private.r142_cipher('14250000-0000-4000-8000-000000000009', 'decision_version', 'title', 'forged-title'),
      private.r142_cipher('14250000-0000-4000-8000-000000000009', 'decision_version', 'stakes', 'forged-stakes'),
      private.r142_cipher('14250000-0000-4000-8000-000000000009', 'decision_version', 'provisional_view', 'forged-view'),
      private.r142_cipher('14250000-0000-4000-8000-000000000009', 'decision_version', 'analysis', 'forged-analysis'),
      1, repeat('9', 64), repeat('8', 64), statement_timestamp() - interval '30 days',
      statement_timestamp() - interval '29 days', statement_timestamp() - interval '29 days',
      '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'pre-sealed version insert was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_version_insert_must_be_draft' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version, title_ciphertext, stakes_ciphertext, provisional_view_ciphertext,
  analysis_ciphertext, encryption_version, source_watermark_sha256,
  generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  1,
  private.r142_cipher('14250000-0000-4000-8000-000000000001', 'decision_version', 'title', 'decision-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000001', 'decision_version', 'stakes', 'decision-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000001', 'decision_version', 'provisional_view', 'provisional-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000001', 'decision_version', 'analysis', 'analysis'),
  1, repeat('2', 64),
  transaction_timestamp(), '2099-01-01 00:00:00+00'::timestamptz,
  '14200000-0000-4000-8000-000000000001'
);

do $$
begin
  begin
    insert into public.brain_decision_events (
      decision_id, decision_version_id, workspace_id, subject_id, event_type,
      actor_user_id, idempotency_key, after_ref, input_sha256
    ) values (
      '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      'analysis_sealed', '14200000-0000-4000-8000-000000000001', 'fabricated-seal-r142',
      '14250000-0000-4000-8000-000000000001', repeat('f', 64)
    );
    raise exception 'raw audit event insert was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'framing', statement_timestamp(), '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version, title_ciphertext, stakes_ciphertext,
  provisional_view_ciphertext, analysis_ciphertext, encryption_version,
  source_watermark_sha256, generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000002', '14240000-0000-4000-8000-000000000002',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14250000-0000-4000-8000-000000000002', 'decision_version', 'title', 'other-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000002', 'decision_version', 'stakes', 'other-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000002', 'decision_version', 'provisional_view', 'other-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000002', 'decision_version', 'analysis', 'other-analysis'),
  1, repeat('3', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000010', '14240000-0000-4000-8000-000000000002',
  '14250000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_call_input_sha256(
    '142a0000-0000-4000-8000-000000000010', '14250000-0000-4000-8000-000000000002',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    private.r142_cipher('142a0000-0000-4000-8000-000000000010', 'decision_call', 'call', 'draft-call'),
    private.r142_cipher('142a0000-0000-4000-8000-000000000010', 'decision_call', 'conditions', 'draft-conditions'),
    1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    transaction_timestamp()
  ), transaction_timestamp(), statement_timestamp() + interval '1 day'
);

do $$
begin
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000010', '14240000-0000-4000-8000-000000000002',
      '14250000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000010', 'decision_call', 'call', 'draft-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000010', 'decision_call', 'conditions', 'draft-conditions'),
      1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000010',
      'draft-call-r142', 'current', '14200000-0000-4000-8000-000000000001', transaction_timestamp()
    );
    raise exception 'owned call against draft version was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_call_authority_invalid' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_human_priors (
      id, decision_version_id, decision_id, workspace_id, subject_id,
      position_ciphertext, rationale_ciphertext, encryption_version,
      source_assertion_id, recorded_by, recorded_at, superseded_at
    ) values (
      '14260000-0000-4000-8000-000000000004', '14250000-0000-4000-8000-000000000002',
      '14240000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('14260000-0000-4000-8000-000000000004', 'decision_human_prior', 'position', 'born-superseded'),
      private.r142_cipher('14260000-0000-4000-8000-000000000004', 'decision_human_prior', 'rationale', 'born-superseded-rationale'),
      1, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      transaction_timestamp(), transaction_timestamp()
    );
    raise exception 'prior born superseded was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_human_prior_initial_state_invalid' then raise; end if;
  end;
end;
$$;
do $$
begin
  begin
    insert into public.brain_decision_versions (
      id, decision_id, workspace_id, subject_id, version, title_ciphertext, stakes_ciphertext,
      provisional_view_ciphertext, analysis_ciphertext, encryption_version,
      source_watermark_sha256, generated_at, fresh_until, predecessor_version_id, created_by
    ) values (
      '14250000-0000-4000-8000-000000000003', '14240000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,
      private.r142_cipher('14250000-0000-4000-8000-000000000003', 'decision_version', 'title', 'invalid-title'),
      private.r142_cipher('14250000-0000-4000-8000-000000000003', 'decision_version', 'stakes', 'invalid-stakes'),
      private.r142_cipher('14250000-0000-4000-8000-000000000003', 'decision_version', 'provisional_view', 'invalid-view'),
      private.r142_cipher('14250000-0000-4000-8000-000000000003', 'decision_version', 'analysis', 'invalid-analysis'),
      1, repeat('4', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
      '14250000-0000-4000-8000-000000000002', '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'cross-decision predecessor was accepted';
  exception when foreign_key_violation then null;
  end;
end;
$$;

insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id, position_ciphertext, rationale_ciphertext,
  encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000001', 'decision_human_prior', 'position', 'human-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000001', 'decision_human_prior', 'rationale', 'human-prior-rationale'), 1,
  '14230001-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', transaction_timestamp()
);

reset role;
do $$
begin
  begin
    update public.brain_decision_human_priors
    set rationale_ciphertext = private.r142_cipher('14260000-0000-4000-8000-000000000001', 'decision_human_prior', 'rationale', 'silently-rewritten-prior')
    where id = '14260000-0000-4000-8000-000000000001';
    raise exception 'leader prior content was mutable';
  exception when others then
    if sqlerrm <> 'brain_decision_human_prior_immutable' then raise; end if;
  end;
  begin
    insert into public.brain_decision_human_priors (
      id, decision_version_id, decision_id, workspace_id, subject_id, position_ciphertext, rationale_ciphertext,
      encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '14260000-0000-4000-8000-000000000002',
      '14250000-0000-4000-8000-000000000001',
      '14240000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('14260000-0000-4000-8000-000000000002', 'decision_human_prior', 'position', 'false-prior'),
      private.r142_cipher('14260000-0000-4000-8000-000000000002', 'decision_human_prior', 'rationale', 'false-rationale'), 1,
      '14230001-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000002', statement_timestamp()
    );
    raise exception 'operator was recorded as leader prior owner';
  exception when check_violation then null;
  end;
end;
$$;
set local role service_role;

insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version,
  is_default, is_recommended
) values
  ('14270000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14270000-0000-4000-8000-000000000001', 'decision_route', 'tab_label', 'route-one-label'),
    private.r142_cipher('14270000-0000-4000-8000-000000000001', 'decision_route', 'content', 'route-one'), 1, false, false),
  ('14270000-0000-4000-8000-000000000002', '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,
    private.r142_cipher('14270000-0000-4000-8000-000000000002', 'decision_route', 'tab_label', 'route-two-label'),
    private.r142_cipher('14270000-0000-4000-8000-000000000002', 'decision_route', 'content', 'route-two'), 1, true, true);

insert into public.brain_decision_questions (
  id, decision_version_id, decision_id, route_id, workspace_id, subject_id,
  question_order, kind, answer_mode, prompt_ciphertext, guidance_ciphertext,
  choices_ciphertext, encryption_version, operator_state
) values
  ('14280000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1, 'leader_can_answer', 'single_choice',
    private.r142_cipher('14280000-0000-4000-8000-000000000001', 'decision_question', 'prompt', 'q1'),
    private.r142_cipher('14280000-0000-4000-8000-000000000001', 'decision_question', 'guidance', 'q1-guidance'),
    private.r142_cipher('14280000-0000-4000-8000-000000000001', 'decision_question', 'choices', 'q1-choices'), 1, 'asked'),
  ('14280000-0000-4000-8000-000000000002', '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2, 'brain_can_find', 'voice_or_text',
    private.r142_cipher('14280000-0000-4000-8000-000000000002', 'decision_question', 'prompt', 'q2'),
    private.r142_cipher('14280000-0000-4000-8000-000000000002', 'decision_question', 'guidance', 'q2-guidance'), null, 1, 'asked');

insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by
) values
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000001', '14230002-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000001', '14230003-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000002', '14230004-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000002', '14230005-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000001', '14230006-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000002', '14230007-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'current_read', '14250000-0000-4000-8000-000000000001', '14230008-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'recommended_move', '14250000-0000-4000-8000-000000000001', '14230009-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001');

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values
  ('14290000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'seal_analysis', 'delivery_team_private', 'operator_decision_preparation', '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'), statement_timestamp(), statement_timestamp() + interval '1 day'),
  ('14290000-0000-4000-8000-000000000002', '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'seal_analysis', 'delivery_team_private', 'operator_decision_preparation', '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'), statement_timestamp() - interval '2 days', statement_timestamp() - interval '1 day');

do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000001', repeat('2', 64), 'seal-r142');
    raise exception 'two-route decision was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_exactly_three_routes_required' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version
) values (
  '14270000-0000-4000-8000-000000000003', '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 3,
  private.r142_cipher('14270000-0000-4000-8000-000000000003', 'decision_route', 'tab_label', 'route-three-label'),
  private.r142_cipher('14270000-0000-4000-8000-000000000003', 'decision_route', 'content', 'route-three'), 1
);

insert into public.brain_decision_questions (
  id, decision_version_id, decision_id, route_id, workspace_id, subject_id,
  question_order, kind, answer_mode, prompt_ciphertext, guidance_ciphertext,
  encryption_version, operator_state
) values
(
  '14280000-0000-4000-8000-000000000003', '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000003',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  3, 'leader_can_answer', 'operator_research',
  private.r142_cipher('14280000-0000-4000-8000-000000000003', 'decision_question', 'prompt', 'q3'),
  private.r142_cipher('14280000-0000-4000-8000-000000000003', 'decision_question', 'guidance', 'q3-guidance'),
  1, 'asked'
),
(
  '14280000-0000-4000-8000-000000000004', '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000003',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  4, 'leader_can_answer', 'voice_or_text',
  private.r142_cipher('14280000-0000-4000-8000-000000000004', 'decision_question', 'prompt', 'q4'),
  private.r142_cipher('14280000-0000-4000-8000-000000000004', 'decision_question', 'guidance', 'q4-guidance'),
  1, 'proposed'
),
(
  '14280000-0000-4000-8000-000000000005', '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000003',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  5, 'leader_can_answer', 'voice_or_text',
  private.r142_cipher('14280000-0000-4000-8000-000000000005', 'decision_question', 'prompt', 'q5'),
  private.r142_cipher('14280000-0000-4000-8000-000000000005', 'decision_question', 'guidance', 'q5-guidance'),
  1, 'suppressed'
);

insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by
) values
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000003', '14230010-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000003', '14230011-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001');

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000007', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
);

do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000007', repeat('2', 64), 'missing-question-evidence-r142');
    raise exception 'question without evidence was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_every_question_needs_evidence' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by
) values
(
  '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'question', '14280000-0000-4000-8000-000000000003',
  '14230012-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'
),
(
  '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'question', '14280000-0000-4000-8000-000000000004',
  '14230012-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'
),
(
  '14250000-0000-4000-8000-000000000001', '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'question', '14280000-0000-4000-8000-000000000005',
  '14230012-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'
);

reset role;
savepoint r142_self_prior_match_control;
update public.brain_decision_questions
set kind = 'prior_decision_match',
    prior_decision_id = '14240000-0000-4000-8000-000000000001',
    prior_decision_version_id = '14250000-0000-4000-8000-000000000001'
where id = '14280000-0000-4000-8000-000000000002';
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000053', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
);
do $self_prior_match$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000053',
      repeat('2', 64), 'self-prior-match-r142'
    );
    raise exception 'self prior-decision match was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_prior_match_self_reference' then raise; end if;
  end;
end;
$self_prior_match$;
rollback to savepoint r142_self_prior_match_control;
release savepoint r142_self_prior_match_control;

savepoint r142_unaccepted_prior_match_control;
reset role;
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000054', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'active', statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000054', '14240000-0000-4000-8000-000000000054',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14250000-0000-4000-8000-000000000054', 'decision_version', 'title', 'draft-prior-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000054', 'decision_version', 'stakes', 'draft-prior-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000054', 'decision_version', 'provisional_view', 'draft-prior-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000054', 'decision_version', 'analysis', 'draft-prior-analysis'),
  1, repeat('d', 64), statement_timestamp() - interval '20 minutes', statement_timestamp() + interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);
update public.brain_decision_questions
set kind = 'prior_decision_match',
    prior_decision_id = '14240000-0000-4000-8000-000000000054',
    prior_decision_version_id = '14250000-0000-4000-8000-000000000054'
where id = '14280000-0000-4000-8000-000000000002';
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000054', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
);
do $unaccepted_prior_match$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000054',
      repeat('2', 64), 'unaccepted-prior-match-r142'
    );
    raise exception 'unaccepted prior-decision version was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_prior_match_unaccepted' then raise; end if;
  end;
end;
$unaccepted_prior_match$;
rollback to savepoint r142_unaccepted_prior_match_control;
release savepoint r142_unaccepted_prior_match_control;

reset role;
savepoint r142_zero_recommendation_control;
update public.brain_decision_routes
set is_recommended = false
where id = '14270000-0000-4000-8000-000000000002';
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000049', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
);
do $zero_recommendation$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000049',
      repeat('2', 64), 'zero-recommendation-r142'
    );
    raise exception 'zero-recommendation decision was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_one_recommended_route_required' then raise; end if;
  end;
end;
$zero_recommendation$;
rollback to savepoint r142_zero_recommendation_control;
release savepoint r142_zero_recommendation_control;
set local role service_role;

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values
  ('14290000-0000-4000-8000-000000000003', '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'seal_analysis', 'delivery_team_private', 'operator_decision_preparation', '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'), statement_timestamp(), statement_timestamp() + interval '1 day'),
  ('14290000-0000-4000-8000-000000000004', '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'seal_analysis', 'delivery_team_private', 'operator_decision_preparation', '14200000-0000-4000-8000-000000000001', repeat('f', 64), statement_timestamp(), statement_timestamp() + interval '1 day');

do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000004', repeat('2', 64), 'wrong-authority-input-r142');
    raise exception 'authority detached from snapshot was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_input_changed' then raise; end if;
  end;
end;
$$;

reset role;
update public.brain_decision_versions
set generated_at = statement_timestamp() - interval '10 minutes',
    fresh_until = statement_timestamp() - interval '1 minute'
where id = '14250000-0000-4000-8000-000000000002';
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000008', '14240000-0000-4000-8000-000000000002',
  '14250000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000002'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
);
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000002', '14290000-0000-4000-8000-000000000008', repeat('3', 64), 'stale-r142');
    raise exception 'stale analysis was accepted';
  exception when others then
    if sqlerrm = 'brain_decision_exactly_three_routes_required' then
      raise exception 'stale analysis was accepted';
    elsif sqlerrm <> 'brain_decision_analysis_stale' then
      raise;
    end if;
  end;
end;
$$;
reset role;
update public.brain_decision_versions
set fresh_until = '2099-01-01 00:00:00+00'::timestamptz
where id = '14250000-0000-4000-8000-000000000002';
set local role service_role;

reset role;
update public.brain_decision_versions set generated_at = statement_timestamp() + interval '1 microsecond'
where id = '14250000-0000-4000-8000-000000000001';
update public.brain_decision_routes set created_at = statement_timestamp() - interval '10 minutes'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
  update public.brain_decision_questions set created_at = statement_timestamp() - interval '10 minutes'
  where decision_version_id = '14250000-0000-4000-8000-000000000001';
set local role service_role;
select private.r142_main_seal_authority('14290000-0000-4000-8000-000000000014', statement_timestamp());
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000014', repeat('2', 64), 'pre-analysis-r142');
    raise exception 'authority before analysis was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_predates_snapshot' then raise; end if;
  end;
end;
$$;

reset role;
update public.brain_decision_versions set generated_at = statement_timestamp() - interval '10 minutes'
where id = '14250000-0000-4000-8000-000000000001';
update public.brain_decision_human_priors set superseded_at = statement_timestamp()
where id = '14260000-0000-4000-8000-000000000001';
set local role service_role;
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000019', '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000019', 'decision_human_prior', 'position', 'chronology-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000019', 'decision_human_prior', 'rationale', 'chronology-rationale'),
  1, '14230001-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  statement_timestamp()
);
select private.r142_main_seal_authority('14290000-0000-4000-8000-000000000015', statement_timestamp());
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000015', repeat('2', 64), 'post-generation-prior-r142');
    raise exception 'post-generation human prior was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_human_prior_after_analysis_generation' then raise; end if;
  end;
end;
$$;
reset role;
update public.brain_decision_human_priors set superseded_at = statement_timestamp()
where id = '14260000-0000-4000-8000-000000000019';
set local role service_role;
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000020', '14250000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000020', 'decision_human_prior', 'position', 'current-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000020', 'decision_human_prior', 'rationale', 'current-rationale'),
  1, '14230001-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  statement_timestamp()
);

reset role;
update public.brain_decision_versions set generated_at = statement_timestamp()
where id = '14250000-0000-4000-8000-000000000001';
update public.brain_decision_routes set created_at = statement_timestamp() + interval '1 microsecond'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
set local role service_role;
select private.r142_main_seal_authority('14290000-0000-4000-8000-000000000016', statement_timestamp());
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000016', repeat('2', 64), 'pre-route-r142');
    raise exception 'authority before route was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_predates_snapshot' then raise; end if;
  end;
end;
$$;
reset role;
update public.brain_decision_routes set created_at = statement_timestamp() - interval '10 minutes'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
update public.brain_decision_questions set created_at = statement_timestamp() + interval '1 microsecond'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
set local role service_role;
select private.r142_main_seal_authority('14290000-0000-4000-8000-000000000017', statement_timestamp());
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000017', repeat('2', 64), 'pre-question-r142');
    raise exception 'authority before question was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_predates_snapshot' then raise; end if;
  end;
end;
$$;
reset role;
update public.brain_decision_questions set created_at = statement_timestamp() - interval '10 minutes'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
update public.brain_decision_evidence_links set linked_at = statement_timestamp() + interval '1 microsecond'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
set local role service_role;
select private.r142_main_seal_authority('14290000-0000-4000-8000-000000000018', statement_timestamp());
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000018', repeat('2', 64), 'pre-evidence-r142');
    raise exception 'authority before evidence link was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_predates_snapshot' then raise; end if;
  end;
end;
$$;

reset role;
update public.brain_decision_evidence_links set linked_at = statement_timestamp()
where decision_version_id = '14250000-0000-4000-8000-000000000001';
set local role service_role;

do $$
declare
  utc_snapshot text;
  remote_snapshot text;
  utc_call_input text;
  remote_call_input text;
  fixed_recorded_at timestamptz := '2026-09-20 12:34:56.123456+00'::timestamptz;
begin
  perform set_config('TimeZone', 'UTC', true);
  utc_snapshot := private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001');
  utc_call_input := private.brain_decision_call_input_sha256(
    '142a0000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'call', 'owned-call'),
    private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'conditions', 'conditions'),
    1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    fixed_recorded_at
  );
  perform set_config('TimeZone', 'Pacific/Auckland', true);
  remote_snapshot := private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001');
  remote_call_input := private.brain_decision_call_input_sha256(
    '142a0000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'call', 'owned-call'),
    private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'conditions', 'conditions'),
    1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    fixed_recorded_at
  );
  if remote_snapshot <> utc_snapshot then raise exception 'snapshot digest changed across timezones'; end if;
  if remote_call_input <> utc_call_input then raise exception 'call input digest changed across timezones'; end if;
end;
$$;

set local time zone 'UTC';

reset role;
update public.brain_decision_versions
set generated_at = statement_timestamp(),
    fresh_until = '2099-01-01 00:00:00+00'::timestamptz
where id = '14250000-0000-4000-8000-000000000001';
update public.brain_decision_versions
set generated_at = statement_timestamp() - interval '10 minutes',
    fresh_until = '2099-01-01 00:00:00+00'::timestamptz
where id = '14250000-0000-4000-8000-000000000002';
set local role service_role;

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values
(
  '14290000-0000-4000-8000-000000000005', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
),
(
  '14290000-0000-4000-8000-000000000009', '14240000-0000-4000-8000-000000000002',
  '14250000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000002'),
  statement_timestamp() - interval '4 minutes', statement_timestamp() - interval '3 minutes'
);

set local time zone 'America/New_York';

do $$
begin
  begin
    insert into public.brain_decision_authority_revocations (
      authority_event_id, decision_version_id, workspace_id, subject_id,
      revoked_by, revoked_at, reason_ciphertext, encryption_version
    ) values (
      '14290000-0000-4000-8000-000000000005', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000002', statement_timestamp(),
      private.r142_cipher('14290000-0000-4000-8000-000000000005', 'decision_authority_revocation', 'reason', 'operator-revocation'), 1
    );
    raise exception 'non-owner revocation was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_revocation_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_authority_revocations (
      authority_event_id, decision_version_id, workspace_id, subject_id,
      revoked_by, revoked_at, reason_ciphertext, encryption_version
    ) values (
      '14290000-0000-4000-8000-000000000005', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      (select occurred_at - interval '1 minute' from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000005'),
      private.r142_cipher('14290000-0000-4000-8000-000000000005', 'decision_authority_revocation', 'reason', 'pre-authority-revocation'), 1
    );
    raise exception 'pre-authority revocation was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_revocation_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_authority_revocations (
      authority_event_id, decision_version_id, workspace_id, subject_id,
      revoked_by, revoked_at, reason_ciphertext, encryption_version
    ) values (
      '14290000-0000-4000-8000-000000000005', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp() + interval '1 day',
      private.r142_cipher('14290000-0000-4000-8000-000000000005', 'decision_authority_revocation', 'reason', 'future-revocation'), 1
    );
    raise exception 'future revocation was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_revocation_invalid' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform public.seal_brain_decision_version_v1('14250000-0000-4000-8000-000000000002', '14290000-0000-4000-8000-000000000009', repeat('3', 64), 'expired-r142');
    raise exception 'expired owner authority was accepted';
  exception when others then
    if sqlerrm = 'brain_decision_exactly_three_routes_required' then
      raise exception 'expired owner authority was accepted';
    elsif sqlerrm <> 'brain_decision_authority_invalid' then
      raise;
    end if;
  end;
end;
$$;

do $$
declare
  first_result jsonb;
  replay_result jsonb;
begin
  first_result := public.seal_brain_decision_version_v1(
    '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
    repeat('2', 64), 'supersede-version:14250000-0000-4000-8000-000000000001'
  );
  if first_result ->> 'status' <> 'sealed' then raise exception 'complete decision did not seal'; end if;
  perform set_config('TimeZone', 'UTC', true);
  replay_result := public.seal_brain_decision_version_v1(
    '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
    repeat('2', 64), 'supersede-version:14250000-0000-4000-8000-000000000001'
  );
  if replay_result ->> 'status' <> 'replayed' then raise exception 'exact seal retry was not idempotent'; end if;
  if first_result ->> 'snapshot_sha256' <> replay_result ->> 'snapshot_sha256' then raise exception 'replay changed snapshot'; end if;

  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
      repeat('9', 64), 'supersede-version:14250000-0000-4000-8000-000000000001'
    );
    raise exception 'changed watermark replay was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_seal_replay_conflict' then raise; end if;
  end;
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
      repeat('2', 64), 'different-seal-key-r142'
    );
    raise exception 'changed idempotency replay was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_seal_replay_conflict' then raise; end if;
  end;

  begin
    update public.brain_decision_versions set standing = 'sealed', snapshot_sha256 = repeat('e', 64),
      sealed_at = statement_timestamp(), sealed_by_authority_event_id = '14290000-0000-4000-8000-000000000005'
    where id = '14250000-0000-4000-8000-000000000001';
    raise exception 'direct seal update was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

do $$
declare replay_result jsonb;
begin
  if exists (
    select 1 from public.brain_decision_evidence_atoms atom
    where atom.atom_sha256 <> private.brain_decision_evidence_atom_sha256(
      atom.assertion_snapshot, atom.source_snapshot,
      atom.materialized_at, atom.causal_watermark_at
    )
  ) then raise exception 'frozen evidence atom digest mismatch'; end if;
  if not exists (
    select 1
    from public.brain_decision_evidence_links link
    join public.brain_decision_evidence_atoms atom on atom.id = link.evidence_atom_id
    where link.assertion_id = '14230002-0000-4000-8000-000000000001'
      and atom.assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:assertion:2'
      and atom.source_snapshot ->> 'integrity_sha256' = encode(sha256(convert_to('r142-source-2', 'UTF8')), 'hex')
  ) then raise exception 'sealed decision lost exact evidence content or provenance'; end if;

  begin
    update public.brain_assertions
    set statement_ciphertext = 'ciphertext:rewritten-after-seal'
    where id = '14230002-0000-4000-8000-000000000001';
    raise exception 'referenced assertion rewrite was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_referenced_assertion_immutable' then raise; end if;
  end;
  begin
    delete from public.brain_assertions
    where id = '14230002-0000-4000-8000-000000000001';
    raise exception 'referenced assertion delete was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_referenced_assertion_immutable' then raise; end if;
  end;
  begin
    update public.brain_sources
    set integrity_sha256 = repeat('f', 64)
    where id = '142d0002-0000-4000-8000-000000000001';
    raise exception 'referenced source rewrite was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_referenced_source_immutable' then raise; end if;
  end;
  begin
    delete from public.brain_sources
    where id = '142d0002-0000-4000-8000-000000000001';
    raise exception 'referenced source delete was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_referenced_source_immutable' then raise; end if;
  end;

  update public.brain_assertions
  set statement_ciphertext = 'ciphertext:unreferenced-update'
  where id = '14230013-0000-4000-8000-000000000001';
  if (select statement_ciphertext from public.brain_assertions where id = '14230013-0000-4000-8000-000000000001')
    <> 'ciphertext:unreferenced-update' then
    raise exception 'unreferenced assertion update was silently discarded';
  end if;
  update public.brain_sources
  set purpose = 'r142 unreferenced update proof'
  where id = '142d0013-0000-4000-8000-000000000001';
  if (select purpose from public.brain_sources where id = '142d0013-0000-4000-8000-000000000001')
    <> 'r142 unreferenced update proof' then
    raise exception 'unreferenced source update was silently discarded';
  end if;

  replay_result := public.seal_brain_decision_version_v1(
    '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
    repeat('2', 64), 'supersede-version:14250000-0000-4000-8000-000000000001'
  );
  if replay_result ->> 'status' <> 'replayed' then
    raise exception 'exact replay failed after blocked evidence rewrites';
  end if;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_authority_revocations (
      authority_event_id, decision_version_id, workspace_id, subject_id,
      revoked_by, revoked_at, reason_ciphertext, encryption_version
    ) values (
      '14290000-0000-4000-8000-000000000005', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000005'),
      private.r142_cipher('14290000-0000-4000-8000-000000000005', 'decision_authority_revocation', 'reason', 'late-backdated-seal-revocation'), 1
    );
    raise exception 'late backdated seal revocation was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_revocation_conflicts_with_use' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000010', '14280000-0000-4000-8000-000000000002',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000010', 'decision_answer', 'answer', 'false-leader-answer-to-brain-question'),
      1, '14230012-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp()
    );
    raise exception 'brain-research question accepted a subject answer';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_question_kind_invalid' then raise; end if;
  end;

  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000011', '14280000-0000-4000-8000-000000000003',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000011', 'decision_answer', 'answer', 'false-leader-answer-to-operator-research'),
      1, '14230012-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp()
    );
    raise exception 'operator-research question accepted a subject answer';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_mode_invalid' then raise; end if;
  end;

  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000012', '14280000-0000-4000-8000-000000000004',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000012', 'decision_answer', 'answer', 'false-answer-to-unasked-question'),
      1, '14230012-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp()
    );
    raise exception 'unasked question accepted a subject answer';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_question_state_invalid' then raise; end if;
  end;

  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000013', '14280000-0000-4000-8000-000000000005',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000013', 'decision_answer', 'answer', 'false-answer-to-suppressed-question'),
      1, '14230012-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp()
    );
    raise exception 'suppressed question accepted a subject answer';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_question_state_invalid' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_answers (
  id, question_id, decision_version_id, workspace_id, subject_id,
  answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '142c0000-0000-4000-8000-000000000001', '14280000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142c0000-0000-4000-8000-000000000001', 'decision_answer', 'answer', 'leader-answer'),
  1, '14230014-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);

do $$
begin
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000002', '14280000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000002', 'decision_answer', 'answer', 'pre-question-answer'),
      1, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      (select created_at - interval '1 minute' from public.brain_decision_questions where id = '14280000-0000-4000-8000-000000000001')
    );
    raise exception 'answer before question was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_chronology_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000003', '14280000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000003', 'decision_answer', 'answer', 'future-answer'),
      1, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      statement_timestamp() + interval '1 hour'
    );
    raise exception 'future answer was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_chronology_invalid' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000005', '14280000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000005', 'decision_answer', 'answer', 'pre-seal-answer'),
      1, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      (
        select question_row.created_at + ((version_row.sealed_at - question_row.created_at) / 2)
        from public.brain_decision_questions question_row
        join public.brain_decision_versions version_row on version_row.id = question_row.decision_version_id
        where question_row.id = '14280000-0000-4000-8000-000000000001'
      )
    );
    raise exception 'answer before analysis seal was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_chronology_invalid' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000009',
      '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000009', 'decision_call', 'call', 'unauthorised-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000009', 'decision_call', 'conditions', 'unauthorised-conditions'),
      1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
      'call-without-authority-r142', 'current', '14200000-0000-4000-8000-000000000001', transaction_timestamp()
    );
    raise exception 'owned call without authority was accepted';
  exception
    when foreign_key_violation then null;
    when others then
      if sqlerrm <> 'brain_decision_call_authority_invalid' then raise; end if;
  end;
end;
$$;

do $$
declare
  sealed_time timestamptz;
  post_seal_call_time timestamptz;
begin
  select sealed_at into sealed_time
  from public.brain_decision_versions
  where id = '14250000-0000-4000-8000-000000000001';
  post_seal_call_time := sealed_time;

  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    '14290000-0000-4000-8000-000000000031', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000031', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000031', 'decision_call', 'call', 'pre-seal-authority-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000031', 'decision_call', 'conditions', 'pre-seal-authority-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', post_seal_call_time
    ), sealed_time - interval '2 minutes', statement_timestamp() + interval '1 day'
  );
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000031', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000031', 'decision_call', 'call', 'pre-seal-authority-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000031', 'decision_call', 'conditions', 'pre-seal-authority-conditions'),
      1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000031',
      'pre-seal-authority-call-r142', 'current', '14200000-0000-4000-8000-000000000001', post_seal_call_time
    );
    raise exception 'call authority before analysis seal was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_call_authority_invalid' then raise; end if;
  end;

  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    '14290000-0000-4000-8000-000000000032', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000032', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000032', 'decision_call', 'call', 'pre-seal-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000032', 'decision_call', 'conditions', 'pre-seal-conditions'),
      1::smallint, '14230002-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', sealed_time - interval '1 microsecond'
    ), sealed_time - interval '2 microseconds', statement_timestamp() + interval '1 day'
  );
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000032', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000032', 'decision_call', 'call', 'pre-seal-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000032', 'decision_call', 'conditions', 'pre-seal-conditions'),
      1, '14230002-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000032',
      'pre-seal-call-r142', 'current', '14200000-0000-4000-8000-000000000001', sealed_time - interval '1 microsecond'
    );
    raise exception 'call before analysis seal was accepted';
  exception when others then
    if sqlerrm not in (
      'brain_decision_call_source_chronology_invalid',
      'brain_decision_call_authority_invalid'
    ) then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values
  (
    '14290000-0000-4000-8000-000000000012', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000012', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000012', 'decision_call', 'call', 'backdated-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000012', 'decision_call', 'conditions', 'backdated-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
    ), (select sealed_at + interval '1 microsecond' from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001'), statement_timestamp() + interval '1 day'
  ),
  (
    '14290000-0000-4000-8000-000000000013', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000013', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000013', 'decision_call', 'call', 'future-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000013', 'decision_call', 'conditions', 'future-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      transaction_timestamp() + interval '1 hour'
    ), (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001'), statement_timestamp() + interval '1 day'
  );

do $$
begin
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000012', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000012', 'decision_call', 'call', 'backdated-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000012', 'decision_call', 'conditions', 'backdated-conditions'),
      1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000012',
      'backdated-call-r142', 'current', '14200000-0000-4000-8000-000000000001',
      (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
    );
    raise exception 'call before authority was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_call_authority_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000013', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000013', 'decision_call', 'call', 'future-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000013', 'decision_call', 'conditions', 'future-conditions'),
      1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000013',
      'future-call-r142', 'current', '14200000-0000-4000-8000-000000000001',
      transaction_timestamp() + interval '1 hour'
    );
    raise exception 'future-dated call was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_call_authority_invalid' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000006', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_call_input_sha256(
    '142a0000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'call', 'owned-call'),
    private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'conditions', 'conditions'),
    1::smallint, '14230015-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
  ), (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001'), statement_timestamp() + interval '1 day'
);

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000011', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_call_input_sha256(
    '142a0000-0000-4000-8000-000000000011', '14250000-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    private.r142_cipher('142a0000-0000-4000-8000-000000000011', 'decision_call', 'call', 'born-challenged'),
    private.r142_cipher('142a0000-0000-4000-8000-000000000011', 'decision_call', 'conditions', 'born-challenged-conditions'),
    1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
  ), (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001'), statement_timestamp() + interval '1 day'
);

do $$
begin
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000011', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000011', 'decision_call', 'call', 'born-challenged'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000011', 'decision_call', 'conditions', 'born-challenged-conditions'),
      1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000011',
      'born-challenged-r142', 'challenged', '14200000-0000-4000-8000-000000000001',
      (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
    );
    raise exception 'call born challenged was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_call_initial_state_invalid' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'call', 'owned-call'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'conditions', 'conditions'),
  1, '14230015-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000006',
  'record-owned-call-r142', 'current', '14200000-0000-4000-8000-000000000001',
  (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
);

do $$
begin
  begin
    insert into public.brain_decision_authority_revocations (
      authority_event_id, decision_version_id, workspace_id, subject_id,
      revoked_by, revoked_at, reason_ciphertext, encryption_version
    ) values (
      '14290000-0000-4000-8000-000000000006', '14250000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000006'),
      private.r142_cipher('14290000-0000-4000-8000-000000000006', 'decision_authority_revocation', 'reason', 'late-backdated-call-revocation'), 1
    );
    raise exception 'late backdated call revocation was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_revocation_conflicts_with_use' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_outcomes (
  id, decision_call_id, decision_id, workspace_id, subject_id,
  result_ciphertext, encryption_version, source_assertion_id,
  observed_at, recorded_by, recorded_at
) values (
  '142b0000-0000-4000-8000-000000000001', '142a0000-0000-4000-8000-000000000001',
  '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142b0000-0000-4000-8000-000000000001', 'decision_outcome', 'result', 'observed-result'),
  1, '14230016-0000-4000-8000-000000000001', statement_timestamp(),
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);

do $$
declare family_suffix text;
begin
  foreach family_suffix in array array['0001', '0014', '0015', '0016'] loop
    begin
      update public.brain_assertions
      set statement_ciphertext = 'ciphertext:family-provenance-rewrite:' || family_suffix
      where id = ('1423' || family_suffix || '-0000-4000-8000-000000000001')::uuid;
      raise exception 'family-specific referenced assertion rewrite was accepted';
    exception when others then
      if sqlerrm <> 'brain_decision_referenced_assertion_immutable' then raise; end if;
    end;
    begin
      delete from public.brain_assertions
      where id = ('1423' || family_suffix || '-0000-4000-8000-000000000001')::uuid;
      raise exception 'family-specific referenced assertion delete was accepted';
    exception when others then
      if sqlerrm <> 'brain_decision_referenced_assertion_immutable' then raise; end if;
    end;
    begin
      update public.brain_sources
      set purpose = 'family provenance rewrite ' || family_suffix
      where id = ('142d' || family_suffix || '-0000-4000-8000-000000000001')::uuid;
      raise exception 'family-specific referenced source rewrite was accepted';
    exception when others then
      if sqlerrm <> 'brain_decision_referenced_source_immutable' then raise; end if;
    end;
    begin
      delete from public.brain_sources
      where id = ('142d' || family_suffix || '-0000-4000-8000-000000000001')::uuid;
      raise exception 'family-specific referenced source delete was accepted';
    exception when others then
      if sqlerrm <> 'brain_decision_referenced_source_immutable' then raise; end if;
    end;
  end loop;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_outcomes (
      id, decision_call_id, decision_id, workspace_id, subject_id,
      result_ciphertext, encryption_version, source_assertion_id, observed_at, recorded_by, recorded_at
    ) values (
      '142b0000-0000-4000-8000-000000000002', '142a0000-0000-4000-8000-000000000001',
      '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142b0000-0000-4000-8000-000000000002', 'decision_outcome', 'result', 'pre-call-result'),
      1, '14230012-0000-4000-8000-000000000001',
      (select recorded_at - interval '1 minute' from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000001'),
      '14200000-0000-4000-8000-000000000001', statement_timestamp()
    );
    raise exception 'outcome observed before call was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_outcome_chronology_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_outcomes (
      id, decision_call_id, decision_id, workspace_id, subject_id,
      result_ciphertext, encryption_version, source_assertion_id, observed_at, recorded_by, recorded_at
    ) values (
      '142b0000-0000-4000-8000-000000000003', '142a0000-0000-4000-8000-000000000001',
      '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142b0000-0000-4000-8000-000000000003', 'decision_outcome', 'result', 'pre-observation-record'),
      1, '14230012-0000-4000-8000-000000000001', statement_timestamp(),
      '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 minute'
    );
    raise exception 'outcome recorded before observation was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_outcome_chronology_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_outcomes (
      id, decision_call_id, decision_id, workspace_id, subject_id,
      result_ciphertext, encryption_version, source_assertion_id, observed_at, recorded_by, recorded_at
    ) values (
      '142b0000-0000-4000-8000-000000000004', '142a0000-0000-4000-8000-000000000001',
      '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142b0000-0000-4000-8000-000000000004', 'decision_outcome', 'result', 'future-record'),
      1, '14230012-0000-4000-8000-000000000001', statement_timestamp(),
      '14200000-0000-4000-8000-000000000001', statement_timestamp() + interval '1 hour'
    );
    raise exception 'future outcome record was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_outcome_chronology_invalid' then raise; end if;
  end;
  begin
    insert into public.brain_decision_outcomes (
      id, decision_call_id, decision_id, workspace_id, subject_id,
      result_ciphertext, encryption_version, source_assertion_id, observed_at, recorded_by, recorded_at
    ) values (
      '142b0000-0000-4000-8000-000000000005', '142a0000-0000-4000-8000-000000000001',
      '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142b0000-0000-4000-8000-000000000005', 'decision_outcome', 'result', 'operator-claimed-result'),
      1, '14230012-0000-4000-8000-000000000001', statement_timestamp(),
      '14200000-0000-4000-8000-000000000002', statement_timestamp()
    );
    raise exception 'operator was recorded as outcome owner';
  exception when check_violation then null;
  end;
end;
$$;

insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until,
  predecessor_version_id, created_by
) values (
  '14250000-0000-4000-8000-000000000030', '14240000-0000-4000-8000-000000000002',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,
  private.r142_cipher('14250000-0000-4000-8000-000000000030', 'decision_version', 'title', 'draft-predecessor-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000030', 'decision_version', 'stakes', 'draft-predecessor-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000030', 'decision_version', 'provisional_view', 'draft-predecessor-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000030', 'decision_version', 'analysis', 'draft-predecessor-analysis'),
  1, repeat('3', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14250000-0000-4000-8000-000000000002', '14200000-0000-4000-8000-000000000001'
);
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000030', '14290000-0000-4000-8000-000000000030',
      repeat('3', 64), 'draft-predecessor-r142'
    );
    raise exception 'successor of draft predecessor was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_predecessor_invalid' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until,
  predecessor_version_id, created_by
) values (
  '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,
  private.r142_cipher('14250000-0000-4000-8000-000000000021', 'decision_version', 'title', 'successor-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000021', 'decision_version', 'stakes', 'successor-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000021', 'decision_version', 'provisional_view', 'successor-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000021', 'decision_version', 'analysis', 'successor-analysis'),
  1, repeat('a', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14250000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001'
);

insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000021', '14250000-0000-4000-8000-000000000021',
  '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000021', 'decision_human_prior', 'position', 'successor-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000021', 'decision_human_prior', 'rationale', 'successor-rationale'),
  1, '14230001-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', transaction_timestamp()
);

insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended
) values
  ('14270000-0000-4000-8000-000000000021', '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14270000-0000-4000-8000-000000000021', 'decision_route', 'tab_label', 'successor-route-one-label'),
    private.r142_cipher('14270000-0000-4000-8000-000000000021', 'decision_route', 'content', 'successor-route-one'), 1, false, false),
  ('14270000-0000-4000-8000-000000000022', '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,
    private.r142_cipher('14270000-0000-4000-8000-000000000022', 'decision_route', 'tab_label', 'successor-route-two-label'),
    private.r142_cipher('14270000-0000-4000-8000-000000000022', 'decision_route', 'content', 'successor-route-two'), 1, true, true),
  ('14270000-0000-4000-8000-000000000023', '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 3,
    private.r142_cipher('14270000-0000-4000-8000-000000000023', 'decision_route', 'tab_label', 'successor-route-three-label'),
    private.r142_cipher('14270000-0000-4000-8000-000000000023', 'decision_route', 'content', 'successor-route-three'), 1, false, false);

insert into public.brain_decision_questions (
  id, decision_version_id, decision_id, route_id, workspace_id, subject_id,
  question_order, kind, answer_mode, prompt_ciphertext, guidance_ciphertext, encryption_version, operator_state
) values
  ('14280000-0000-4000-8000-000000000021', '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1, 'leader_can_answer', 'voice_or_text',
    private.r142_cipher('14280000-0000-4000-8000-000000000021', 'decision_question', 'prompt', 'successor-q1'),
    private.r142_cipher('14280000-0000-4000-8000-000000000021', 'decision_question', 'guidance', 'successor-q1-guidance'), 1, 'asked'),
  ('14280000-0000-4000-8000-000000000022', '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000022', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2, 'brain_can_find', 'operator_research',
    private.r142_cipher('14280000-0000-4000-8000-000000000022', 'decision_question', 'prompt', 'successor-q2'),
    private.r142_cipher('14280000-0000-4000-8000-000000000022', 'decision_question', 'guidance', 'successor-q2-guidance'), 1, 'proposed'),
  ('14280000-0000-4000-8000-000000000023', '14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000023', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 3, 'leader_can_answer', 'voice_or_text',
    private.r142_cipher('14280000-0000-4000-8000-000000000023', 'decision_question', 'prompt', 'successor-q3'),
    private.r142_cipher('14280000-0000-4000-8000-000000000023', 'decision_question', 'guidance', 'successor-q3-guidance'), 1, 'proposed');

insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by
) values
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000021', '14230002-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000021', '14230003-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000022', '14230004-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000022', '14230005-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000023', '14230006-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000023', '14230007-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000021', '14230008-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000022', '14230009-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000023', '14230010-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'current_read', '14250000-0000-4000-8000-000000000021', '14230011-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001'),
  ('14250000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'recommended_move', '14250000-0000-4000-8000-000000000021', '14230012-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001');

savepoint r142_predecessor_authority_control;
    reset role;
    alter table public.brain_decision_evidence_atoms disable trigger brain_decision_evidence_atoms_append_only;
    update public.brain_decision_evidence_atoms
    set materialized_at = statement_timestamp() - interval '3 microseconds',
        causal_watermark_at = statement_timestamp() - interval '3 microseconds',
        atom_sha256 = private.brain_decision_evidence_atom_sha256(
          assertion_snapshot, source_snapshot,
          statement_timestamp() - interval '3 microseconds',
          statement_timestamp() - interval '3 microseconds'
        )
    where assertion_id in (
      select ('1423' || lpad(n::text, 4, '0') || '-0000-4000-8000-000000000001')::uuid
      from generate_series(1, 12) n
    );
    alter table public.brain_decision_evidence_atoms enable trigger brain_decision_evidence_atoms_append_only;
    set local role service_role;
    insert into public.brain_decision_versions (
      id, decision_id, workspace_id, subject_id, version,
      title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
      encryption_version, source_watermark_sha256, generated_at, fresh_until,
      predecessor_version_id, created_by
    ) values (
      '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 3,
      private.r142_cipher('14250000-0000-4000-8000-000000000041', 'decision_version', 'title', 'premature-successor-title'),
      private.r142_cipher('14250000-0000-4000-8000-000000000041', 'decision_version', 'stakes', 'premature-successor-stakes'),
      private.r142_cipher('14250000-0000-4000-8000-000000000041', 'decision_version', 'provisional_view', 'premature-successor-view'),
      private.r142_cipher('14250000-0000-4000-8000-000000000041', 'decision_version', 'analysis', 'premature-successor-analysis'),
      1, repeat('c', 64), statement_timestamp() - interval '2 microseconds', '2099-01-01 00:00:00+00'::timestamptz,
      '14250000-0000-4000-8000-000000000021', '14200000-0000-4000-8000-000000000001'
    );

    insert into public.brain_decision_human_priors (
      id, decision_version_id, decision_id, workspace_id, subject_id,
      position_ciphertext, rationale_ciphertext, encryption_version,
      source_assertion_id, recorded_by, recorded_at
    ) values (
      '14260000-0000-4000-8000-000000000041', '14250000-0000-4000-8000-000000000041',
      '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('14260000-0000-4000-8000-000000000041', 'decision_human_prior', 'position', 'premature-successor-prior'),
      private.r142_cipher('14260000-0000-4000-8000-000000000041', 'decision_human_prior', 'rationale', 'premature-successor-rationale'),
      1, '14230001-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '2 microseconds'
    );

    insert into public.brain_decision_routes (
      id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
      tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended, created_at
    ) values
      ('14270000-0000-4000-8000-000000000041', '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
        private.r142_cipher('14270000-0000-4000-8000-000000000041', 'decision_route', 'tab_label', 'premature-route-one-label'),
        private.r142_cipher('14270000-0000-4000-8000-000000000041', 'decision_route', 'content', 'premature-route-one'), 1, false, false, statement_timestamp() - interval '2 microseconds'),
      ('14270000-0000-4000-8000-000000000042', '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,
        private.r142_cipher('14270000-0000-4000-8000-000000000042', 'decision_route', 'tab_label', 'premature-route-two-label'),
        private.r142_cipher('14270000-0000-4000-8000-000000000042', 'decision_route', 'content', 'premature-route-two'), 1, true, true, statement_timestamp() - interval '2 microseconds'),
      ('14270000-0000-4000-8000-000000000043', '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 3,
        private.r142_cipher('14270000-0000-4000-8000-000000000043', 'decision_route', 'tab_label', 'premature-route-three-label'),
        private.r142_cipher('14270000-0000-4000-8000-000000000043', 'decision_route', 'content', 'premature-route-three'), 1, false, false, statement_timestamp() - interval '2 microseconds');

    insert into public.brain_decision_questions (
      id, decision_version_id, decision_id, route_id, workspace_id, subject_id,
      question_order, kind, answer_mode, prompt_ciphertext, guidance_ciphertext, encryption_version, created_at
    ) values
      ('14280000-0000-4000-8000-000000000041', '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000041', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1, 'leader_can_answer', 'voice_or_text',
        private.r142_cipher('14280000-0000-4000-8000-000000000041', 'decision_question', 'prompt', 'premature-q1'),
        private.r142_cipher('14280000-0000-4000-8000-000000000041', 'decision_question', 'guidance', 'premature-q1-guidance'), 1, statement_timestamp() - interval '2 microseconds'),
      ('14280000-0000-4000-8000-000000000042', '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000042', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2, 'brain_can_find', 'operator_research',
        private.r142_cipher('14280000-0000-4000-8000-000000000042', 'decision_question', 'prompt', 'premature-q2'),
        private.r142_cipher('14280000-0000-4000-8000-000000000042', 'decision_question', 'guidance', 'premature-q2-guidance'), 1, statement_timestamp() - interval '2 microseconds'),
      ('14280000-0000-4000-8000-000000000043', '14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14270000-0000-4000-8000-000000000043', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 3, 'leader_can_answer', 'voice_or_text',
        private.r142_cipher('14280000-0000-4000-8000-000000000043', 'decision_question', 'prompt', 'premature-q3'),
        private.r142_cipher('14280000-0000-4000-8000-000000000043', 'decision_question', 'guidance', 'premature-q3-guidance'), 1, statement_timestamp() - interval '2 microseconds');

    insert into public.brain_decision_evidence_links (
      decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
      artifact_id, assertion_id, stance, linked_by, linked_at
    ) values
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000041', '14230002-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000041', '14230003-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000042', '14230004-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000042', '14230005-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000043', '14230006-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'route', '14270000-0000-4000-8000-000000000043', '14230007-0000-4000-8000-000000000001', 'refutes', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000041', '14230008-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000042', '14230009-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'question', '14280000-0000-4000-8000-000000000043', '14230010-0000-4000-8000-000000000001', 'context', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'current_read', '14250000-0000-4000-8000-000000000041', '14230011-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001', transaction_timestamp()),
      ('14250000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 'recommended_move', '14250000-0000-4000-8000-000000000041', '14230012-0000-4000-8000-000000000001', 'supports', '14200000-0000-4000-8000-000000000001', transaction_timestamp());

    reset role;
    update public.brain_decision_evidence_links
    set linked_at = statement_timestamp() - interval '2 microseconds'
    where decision_version_id = '14250000-0000-4000-8000-000000000041';
    set local role service_role;

    insert into public.brain_decision_authority_events (
      id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
      event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
    ) values (
      '14290000-0000-4000-8000-000000000041', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000041', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
      '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000041'),
      statement_timestamp() - interval '1 microsecond', statement_timestamp() + interval '1 day'
    );

    insert into public.brain_decision_authority_events (
      id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
      event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
    ) values (
      '14290000-0000-4000-8000-000000000040', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
      '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000021'),
      statement_timestamp(), statement_timestamp() + interval '1 day'
    );
    select public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000021', '14290000-0000-4000-8000-000000000040',
      repeat('a', 64), 'seal-predecessor-inside-causal-control-r142'
    );

    do $snapshot_binding$
    begin
      if private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000041') =
          (select input_sha256 from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000041')
        then raise exception 'successor snapshot did not bind predecessor seal'; end if;
    end;
    $snapshot_binding$;

    insert into public.brain_decision_authority_events (
      id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
      event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
    ) values (
      '14290000-0000-4000-8000-000000000042', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000041', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
      '14200000-0000-4000-8000-000000000001', private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000041'),
      (select sealed_at - interval '1 microsecond' from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000021'),
      statement_timestamp() + interval '1 day'
    );

    do $backdated_authority$
    begin
      begin
      perform public.seal_brain_decision_version_v1(
        '14250000-0000-4000-8000-000000000041', '14290000-0000-4000-8000-000000000042',
        repeat('c', 64), 'backdated-after-predecessor-seal-r142'
      );
      raise exception 'backdated successor authority was accepted';
    exception when others then
      if sqlerrm <> 'brain_decision_authority_predates_predecessor' then raise; end if;
      end;
    end;
    $backdated_authority$;

    do $premature_authority$
    begin
      begin
      perform public.seal_brain_decision_version_v1(
        '14250000-0000-4000-8000-000000000041', '14290000-0000-4000-8000-000000000041',
        repeat('c', 64), 'premature-successor-authority-r142'
      );
      raise exception 'successor authority created before predecessor seal was accepted';
    exception when others then
      if sqlerrm <> 'brain_decision_authority_predates_predecessor' then raise; end if;
      end;
    end;
    $premature_authority$;

rollback to savepoint r142_predecessor_authority_control;
release savepoint r142_predecessor_authority_control;

insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000021', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000021'),
  statement_timestamp(), statement_timestamp() + interval '1 day'
);

do $$
declare
  successor_result jsonb;
  predecessor_replay_result jsonb;
begin
  successor_result := public.seal_brain_decision_version_v1(
    '14250000-0000-4000-8000-000000000021', '14290000-0000-4000-8000-000000000021',
    repeat('a', 64), 'seal-successor-r142'
  );
  if successor_result ->> 'status' <> 'sealed' then raise exception 'successor version did not seal'; end if;
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001') <> 'superseded'
    then raise exception 'predecessor version was not superseded'; end if;
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000021') <> 'sealed'
    then raise exception 'successor version was not current sealed'; end if;
  if (select count(*) from public.brain_decision_events where event_type = 'analysis_superseded' and before_ref = '14250000-0000-4000-8000-000000000001' and after_ref = '14250000-0000-4000-8000-000000000021') <> 1
    then raise exception 'successor replacement event missing'; end if;
  if (select count(*) from public.brain_decision_events where idempotency_key = 'supersede-version:14250000-0000-4000-8000-000000000001' and event_type in ('analysis_sealed', 'analysis_superseded')) <> 2
    then raise exception 'cross-event idempotency namespace failed'; end if;
  predecessor_replay_result := public.seal_brain_decision_version_v1(
    '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000005',
    repeat('2', 64), 'supersede-version:14250000-0000-4000-8000-000000000001'
  );
  if predecessor_replay_result ->> 'status' <> 'replayed'
    then raise exception 'superseded predecessor exact replay was not durable'; end if;
end;
$$;

do $$
begin
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000004', '14280000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000004', 'decision_answer', 'answer', 'superseded-answer'),
      1, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      statement_timestamp()
    );
    raise exception 'answer to superseded analysis was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_chronology_invalid' then raise; end if;
  end;
end;
$$;

insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until,
  predecessor_version_id, created_by
) values (
  '14250000-0000-4000-8000-000000000024', '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 4,
  private.r142_cipher('14250000-0000-4000-8000-000000000024', 'decision_version', 'title', 'skipped-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000024', 'decision_version', 'stakes', 'skipped-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000024', 'decision_version', 'provisional_view', 'skipped-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000024', 'decision_version', 'analysis', 'skipped-analysis'),
  1, repeat('b', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14250000-0000-4000-8000-000000000021', '14200000-0000-4000-8000-000000000001'
);
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000024', '14290000-0000-4000-8000-000000000024',
      repeat('b', 64), 'skipped-version-r142'
    );
    raise exception 'nonsequential successor was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_predecessor_invalid' then raise; end if;
  end;
end;
$$;

-- Causal-provenance controls: each consumer must occur at or after its frozen atom.
do $$
begin
  begin
    insert into public.brain_decision_human_priors (
      id, decision_version_id, decision_id, workspace_id, subject_id,
      position_ciphertext, rationale_ciphertext, encryption_version,
      source_assertion_id, recorded_by, recorded_at
    ) values (
      '14260000-0000-4000-8000-000000000090', '14250000-0000-4000-8000-000000000002',
      '14240000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('14260000-0000-4000-8000-000000000090', 'decision_human_prior', 'position', 'pre-atom-prior'),
      private.r142_cipher('14260000-0000-4000-8000-000000000090', 'decision_human_prior', 'rationale', 'pre-atom-prior-rationale'),
      1, '14230018-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 microsecond'
    );
    raise exception 'human prior before source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_human_prior_source_chronology_invalid' then raise; end if;
  end;
end;
$$;

savepoint r142_evidence_link_source_chronology;
insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version
) values (
  '14270000-0000-4000-8000-000000000090', '14250000-0000-4000-8000-000000000002',
  '14240000-0000-4000-8000-000000000002', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14270000-0000-4000-8000-000000000090', 'decision_route', 'tab_label', 'pre-atom-route'),
  private.r142_cipher('14270000-0000-4000-8000-000000000090', 'decision_route', 'content', 'pre-atom-route-content'), 1
);
do $$
begin
  begin
    insert into public.brain_decision_evidence_links (
      decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
      artifact_id, assertion_id, stance, linked_by, linked_at
    ) values (
      '14250000-0000-4000-8000-000000000002', '14240000-0000-4000-8000-000000000002',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      'route', '14270000-0000-4000-8000-000000000090', '14230019-0000-4000-8000-000000000001',
      'supports', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 microsecond'
    );
    raise exception 'evidence link before source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_evidence_link_source_chronology_invalid' then raise; end if;
  end;
end;
$$;
rollback to savepoint r142_evidence_link_source_chronology;
release savepoint r142_evidence_link_source_chronology;

savepoint r142_answer_source_chronology;
reset role;
alter table public.brain_decision_versions disable trigger user;
update public.brain_decision_versions
set sealed_at = statement_timestamp() - interval '2 microseconds'
where id = '14250000-0000-4000-8000-000000000021';
alter table public.brain_decision_versions enable trigger user;
alter table public.brain_decision_questions disable trigger user;
update public.brain_decision_questions
set created_at = statement_timestamp() - interval '2 microseconds'
where id = '14280000-0000-4000-8000-000000000021';
alter table public.brain_decision_questions enable trigger user;
set local role service_role;
do $$
begin
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000090', '14280000-0000-4000-8000-000000000021',
      '14250000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142c0000-0000-4000-8000-000000000090', 'decision_answer', 'answer', 'pre-atom-answer'),
      1, '14230015-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 microsecond'
    );
    raise exception 'answer before source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_answer_source_chronology_invalid' then raise; end if;
  end;
end;
$$;
rollback to savepoint r142_answer_source_chronology;
release savepoint r142_answer_source_chronology;
set local role service_role;

savepoint r142_call_source_chronology;
reset role;
alter table public.brain_decision_versions disable trigger user;
update public.brain_decision_versions
set sealed_at = statement_timestamp() - interval '2 microseconds'
where id = '14250000-0000-4000-8000-000000000021';
alter table public.brain_decision_versions enable trigger user;
update public.brain_decision_calls
set standing = 'challenged'
where id = '142a0000-0000-4000-8000-000000000001';
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000090', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_call_input_sha256(
    '142a0000-0000-4000-8000-000000000090', '14250000-0000-4000-8000-000000000021',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    private.r142_cipher('142a0000-0000-4000-8000-000000000090', 'decision_call', 'call', 'pre-atom-call'),
    private.r142_cipher('142a0000-0000-4000-8000-000000000090', 'decision_call', 'conditions', 'pre-atom-conditions'),
    1::smallint, '14230016-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    statement_timestamp() - interval '1 microsecond'
  ), statement_timestamp() - interval '1 microsecond', statement_timestamp() + interval '1 day'
);
do $$
begin
  begin
    insert into public.brain_decision_calls (
      id, decision_id, decision_version_id, workspace_id, subject_id,
      call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
      authority_event_id, idempotency_key, standing, recorded_by, recorded_at
    ) values (
      '142a0000-0000-4000-8000-000000000090', '14240000-0000-4000-8000-000000000001',
      '14250000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000090', 'decision_call', 'call', 'pre-atom-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000090', 'decision_call', 'conditions', 'pre-atom-conditions'),
      1, '14230016-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000090',
      'pre-atom-call-r142', 'current', '14200000-0000-4000-8000-000000000001',
      statement_timestamp() - interval '1 microsecond'
    );
    raise exception 'call before source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_call_source_chronology_invalid' then raise; end if;
  end;
end;
$$;
rollback to savepoint r142_call_source_chronology;
release savepoint r142_call_source_chronology;
set local role service_role;

savepoint r142_outcome_source_chronology;
reset role;
alter table public.brain_decision_calls disable trigger user;
update public.brain_decision_calls
set recorded_at = statement_timestamp() - interval '2 microseconds'
where id = '142a0000-0000-4000-8000-000000000001';
alter table public.brain_decision_calls enable trigger user;
set local role service_role;
do $$
begin
  begin
    insert into public.brain_decision_outcomes (
      id, decision_call_id, decision_id, workspace_id, subject_id,
      result_ciphertext, encryption_version, source_assertion_id,
      observed_at, recorded_by, recorded_at
    ) values (
      '142b0000-0000-4000-8000-000000000090', '142a0000-0000-4000-8000-000000000001',
      '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142b0000-0000-4000-8000-000000000090', 'decision_outcome', 'result', 'pre-atom-outcome'),
      1, '14230017-0000-4000-8000-000000000001',
      statement_timestamp() - interval '1 microsecond', '14200000-0000-4000-8000-000000000001',
      statement_timestamp() - interval '1 microsecond'
    );
    raise exception 'outcome before source provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_outcome_source_chronology_invalid' then raise; end if;
  end;
end;
$$;
rollback to savepoint r142_outcome_source_chronology;
release savepoint r142_outcome_source_chronology;
set local role service_role;

-- Defence-in-depth controls for legacy or compromised rows that predate atom guards.
savepoint r142_seal_evidence_provenance;
reset role;
alter table public.brain_decision_versions disable trigger user;
update public.brain_decision_versions
set standing = case when id = '14250000-0000-4000-8000-000000000001' then 'draft' else 'superseded' end,
    snapshot_sha256 = case when id = '14250000-0000-4000-8000-000000000001' then null else snapshot_sha256 end,
    sealed_at = case when id = '14250000-0000-4000-8000-000000000001' then null else sealed_at end,
    sealed_by_authority_event_id = case when id = '14250000-0000-4000-8000-000000000001' then null else sealed_by_authority_event_id end,
    generated_at = case when id = '14250000-0000-4000-8000-000000000001' then statement_timestamp() - interval '3 microseconds' else generated_at end,
    fresh_until = case when id = '14250000-0000-4000-8000-000000000001' then '2099-01-01 00:00:00+00'::timestamptz else fresh_until end
where id in ('14250000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000021');
alter table public.brain_decision_versions enable trigger user;
alter table public.brain_decision_routes disable trigger user;
update public.brain_decision_routes set created_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
alter table public.brain_decision_routes enable trigger user;
alter table public.brain_decision_questions disable trigger user;
update public.brain_decision_questions set created_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
alter table public.brain_decision_questions enable trigger user;
alter table public.brain_decision_human_priors disable trigger user;
update public.brain_decision_human_priors set recorded_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001' and superseded_at is null;
alter table public.brain_decision_human_priors enable trigger user;
alter table public.brain_decision_evidence_links disable trigger user;
update public.brain_decision_evidence_links set linked_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
alter table public.brain_decision_evidence_links enable trigger user;
alter table public.brain_decision_evidence_atoms disable trigger brain_decision_evidence_atoms_append_only;
update public.brain_decision_evidence_atoms
set materialized_at = statement_timestamp() - interval '4 microseconds',
    causal_watermark_at = statement_timestamp() - interval '4 microseconds',
    atom_sha256 = private.brain_decision_evidence_atom_sha256(
      assertion_snapshot, source_snapshot,
      statement_timestamp() - interval '4 microseconds',
      statement_timestamp() - interval '4 microseconds'
    )
where assertion_id = '14230001-0000-4000-8000-000000000001';
alter table public.brain_decision_evidence_atoms enable trigger brain_decision_evidence_atoms_append_only;
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000092', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp() - interval '2 microseconds', statement_timestamp() + interval '1 day'
);
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000092',
      repeat('2', 64), 'pre-evidence-provenance-r142'
    );
    raise exception 'seal authority before evidence provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_predates_evidence_provenance' then raise; end if;
  end;
end;
$$;
rollback to savepoint r142_seal_evidence_provenance;
release savepoint r142_seal_evidence_provenance;
set local role service_role;

savepoint r142_seal_prior_provenance;
reset role;
alter table public.brain_decision_versions disable trigger user;
update public.brain_decision_versions
set standing = case when id = '14250000-0000-4000-8000-000000000001' then 'draft' else 'superseded' end,
    snapshot_sha256 = case when id = '14250000-0000-4000-8000-000000000001' then null else snapshot_sha256 end,
    sealed_at = case when id = '14250000-0000-4000-8000-000000000001' then null else sealed_at end,
    sealed_by_authority_event_id = case when id = '14250000-0000-4000-8000-000000000001' then null else sealed_by_authority_event_id end,
    generated_at = case when id = '14250000-0000-4000-8000-000000000001' then statement_timestamp() - interval '3 microseconds' else generated_at end,
    fresh_until = case when id = '14250000-0000-4000-8000-000000000001' then '2099-01-01 00:00:00+00'::timestamptz else fresh_until end
where id in ('14250000-0000-4000-8000-000000000001', '14250000-0000-4000-8000-000000000021');
alter table public.brain_decision_versions enable trigger user;
alter table public.brain_decision_routes disable trigger user;
update public.brain_decision_routes set created_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
alter table public.brain_decision_routes enable trigger user;
alter table public.brain_decision_questions disable trigger user;
update public.brain_decision_questions set created_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
alter table public.brain_decision_questions enable trigger user;
alter table public.brain_decision_human_priors disable trigger user;
update public.brain_decision_human_priors set recorded_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001' and superseded_at is null;
alter table public.brain_decision_human_priors enable trigger user;
alter table public.brain_decision_evidence_links disable trigger user;
update public.brain_decision_evidence_links set linked_at = statement_timestamp() - interval '3 microseconds'
where decision_version_id = '14250000-0000-4000-8000-000000000001';
alter table public.brain_decision_evidence_links enable trigger user;
alter table public.brain_decision_evidence_atoms disable trigger brain_decision_evidence_atoms_append_only;
update public.brain_decision_evidence_atoms
set materialized_at = statement_timestamp() - interval '4 microseconds',
    causal_watermark_at = statement_timestamp() - interval '4 microseconds',
    atom_sha256 = private.brain_decision_evidence_atom_sha256(
      assertion_snapshot, source_snapshot,
      statement_timestamp() - interval '4 microseconds',
      statement_timestamp() - interval '4 microseconds'
    )
where assertion_id in (
  select ('1423' || lpad(n::text, 4, '0') || '-0000-4000-8000-000000000001')::uuid
  from generate_series(2, 12) n
);
alter table public.brain_decision_evidence_atoms enable trigger brain_decision_evidence_atoms_append_only;
set local role service_role;
insert into public.brain_decision_authority_events (
  id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
  event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
) values (
  '14290000-0000-4000-8000-000000000093', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
  '14200000-0000-4000-8000-000000000001',
  private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000001'),
  statement_timestamp() - interval '2 microseconds', statement_timestamp() + interval '1 day'
);
do $$
begin
  begin
    perform public.seal_brain_decision_version_v1(
      '14250000-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000093',
      repeat('2', 64), 'pre-prior-provenance-r142'
    );
    raise exception 'seal authority before prior provenance was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_authority_predates_prior_provenance' then raise; end if;
  end;
end;
$$;
rollback to savepoint r142_seal_prior_provenance;
release savepoint r142_seal_prior_provenance;
set local role service_role;

reset role;
do $$
declare before_snapshot text;
begin
  select snapshot_sha256 into before_snapshot from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001';
  begin
    update public.brain_decision_human_priors set superseded_at = statement_timestamp()
    where id = '14260000-0000-4000-8000-000000000001';
    raise exception 'sealed prior was superseded';
  exception when others then
    if sqlerrm <> 'brain_decision_version_not_draft' then raise; end if;
  end;
  if (select snapshot_sha256 from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001') <> before_snapshot
  then raise exception 'sealed snapshot changed after rejected prior mutation'; end if;
  begin
    update public.brain_decision_calls
    set call_ciphertext = private.r142_cipher('142a0000-0000-4000-8000-000000000001', 'decision_call', 'call', 'silently-rewritten-call')
    where id = '142a0000-0000-4000-8000-000000000001';
    raise exception 'leader call content was mutable';
  exception when others then
    if sqlerrm <> 'brain_decision_call_immutable' then raise; end if;
  end;
  update public.brain_decision_calls set standing = 'challenged'
  where id = '142a0000-0000-4000-8000-000000000001';
  begin
    update public.brain_decision_calls set standing = 'current'
    where id = '142a0000-0000-4000-8000-000000000001';
    raise exception 'challenged call was silently restored';
  exception when others then
    if sqlerrm <> 'brain_decision_call_immutable' then raise; end if;
  end;
  begin
    update public.brain_decision_routes
    set content_ciphertext = private.r142_cipher('14270000-0000-4000-8000-000000000001', 'decision_route', 'content', 'changed-after-seal')
    where id = '14270000-0000-4000-8000-000000000001';
    raise exception 'sealed route mutated';
  exception when others then
    if sqlerrm <> 'brain_decision_version_not_draft' then raise; end if;
  end;
  begin
    update public.brain_decision_versions
    set analysis_ciphertext = private.r142_cipher('14250000-0000-4000-8000-000000000001', 'decision_version', 'analysis', 'changed-after-seal')
    where id = '14250000-0000-4000-8000-000000000001';
    raise exception 'sealed version mutated';
  exception when others then
    if sqlerrm <> 'brain_decision_sealed_version_immutable' then raise; end if;
  end;
  begin
    update public.brain_decision_authority_events set input_sha256 = repeat('e', 64)
    where id = '14290000-0000-4000-8000-000000000005';
    raise exception 'authority event mutated';
  exception when others then
    if sqlerrm <> 'brain_decision_record_append_only' then raise; end if;
  end;
  begin
    update public.brain_decision_cases set owner_id = '14200000-0000-4000-8000-000000000002'
    where id = '14240000-0000-4000-8000-000000000001';
    raise exception 'case identity mutated';
  exception when others then
    if sqlerrm <> 'brain_decision_case_identity_immutable' then raise; end if;
  end;
end;
$$;
set local role service_role;

do $$
begin
  begin
    insert into public.brain_decision_answers (
      id, question_id, decision_version_id, workspace_id, subject_id,
      answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
    ) values (
      '142c0000-0000-4000-8000-000000000009', '14280000-0000-4000-8000-000000000021',
      '14250000-0000-4000-8000-000000000021', '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', 'raw plaintext answer', 1,
      '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', statement_timestamp()
    );
    raise exception 'raw plaintext ciphertext was accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_cipher_envelope_invalid' then raise; end if;
  end;
end;
$$;

reset role;
do $$
begin
  if has_table_privilege('authenticated', 'public.brain_decision_cases', 'select') then raise exception 'authenticated raw case read granted'; end if;
  if has_table_privilege('authenticated', 'public.brain_decision_routes', 'select') then raise exception 'authenticated raw route read granted'; end if;
  if has_function_privilege('authenticated', 'public.seal_brain_decision_version_v1(uuid,uuid,text,text)', 'execute') then raise exception 'authenticated seal execution granted'; end if;
  if has_function_privilege('authenticated', 'private.brain_decision_human_prior_admission_guard()', 'execute') then raise exception 'authenticated human-prior admission execution granted'; end if;
  if has_table_privilege('service_role', 'public.brain_decision_versions', 'update') then raise exception 'service role raw version update granted'; end if;
  if has_table_privilege('service_role', 'public.brain_decision_evidence_atoms', 'insert') then raise exception 'service role can forge evidence atoms'; end if;
  if has_table_privilege('service_role', 'public.brain_decision_events', 'insert') then raise exception 'service role raw audit insert granted'; end if;
  if pg_get_functiondef('private.brain_decision_snapshot_sha256(uuid)'::regprocedure)
      not like '%link.assertion_id::text, link.evidence_atom_id::text, atom.atom_sha256%' then
    raise exception 'decision snapshot omitted frozen evidence digest';
  end if;
  if pg_get_functiondef('private.brain_decision_snapshot_sha256(uuid)'::regprocedure)
      not like '%prior.source_assertion_id::text, prior.source_evidence_atom_id::text, atom.atom_sha256%' then
    raise exception 'human prior snapshot omitted frozen source atom';
  end if;
  if pg_get_functiondef('private.brain_decision_call_input_sha256(uuid,uuid,uuid,uuid,text,text,smallint,uuid,uuid,timestamptz)'::regprocedure)
      not like '%p_source_assertion_id::text, source_evidence_atom_id::text, source_evidence_atom_sha256%' then
    raise exception 'call authority omitted frozen source atom';
  end if;
  if (select count(*) from public.brain_decision_events where event_type = 'analysis_sealed') <> 2 then raise exception 'seal event count wrong'; end if;
  if (select count(*) from public.brain_decision_events where event_type = 'analysis_superseded') <> 1 then raise exception 'supersede event count wrong'; end if;
  if (select count(*) from public.brain_decision_events where event_type = 'call_recorded') <> 1 then raise exception 'call event count wrong'; end if;
  if (select count(*) from public.brain_decision_events where event_type = 'case_opened') <> 2 then raise exception 'case event count wrong'; end if;
  if (select count(*) from public.brain_decision_events where event_type = 'question_answered') <> 1 then raise exception 'answer event count wrong'; end if;
  if (select count(*) from public.brain_decision_events where event_type = 'outcome_recorded') <> 1 then raise exception 'outcome event count wrong'; end if;
  if not exists (
    select 1 from public.brain_decision_events event_row
    join public.brain_decision_cases case_row on case_row.id = event_row.after_ref
    where event_row.event_type = 'case_opened'
      and event_row.after_ref = '14240000-0000-4000-8000-000000000001'
      and event_row.idempotency_key = 'case-opened:14240000-0000-4000-8000-000000000001'
      and event_row.input_sha256 = encode(sha256(convert_to(concat_ws('|',
        case_row.id::text, case_row.workspace_id::text, case_row.subject_id::text, case_row.owner_id::text,
        case_row.status, coalesce(private.brain_decision_timestamp_token(case_row.decision_by), ''),
        private.brain_decision_timestamp_token(case_row.opened_at), case_row.created_by::text,
        private.brain_decision_timestamp_token(case_row.created_at)
      ), 'UTF8')), 'hex')
  ) then raise exception 'case receipt hash wrong'; end if;
  if not exists (
    select 1 from public.brain_decision_events event_row
    join public.brain_decision_answers answer_row on answer_row.id = event_row.after_ref
    join public.brain_decision_evidence_atoms atom on atom.id = answer_row.source_evidence_atom_id
    where event_row.event_type = 'question_answered'
      and event_row.after_ref = '142c0000-0000-4000-8000-000000000001'
      and event_row.idempotency_key = 'question-answered:142c0000-0000-4000-8000-000000000001'
      and event_row.input_sha256 = encode(sha256(convert_to(concat_ws('|',
        answer_row.id::text, answer_row.question_id::text, answer_row.decision_version_id::text,
        answer_row.workspace_id::text, answer_row.subject_id::text, answer_row.content_sha256,
        answer_row.encryption_version::text, answer_row.source_assertion_id::text,
        answer_row.source_evidence_atom_id::text, atom.atom_sha256, answer_row.recorded_by::text,
        private.brain_decision_timestamp_token(answer_row.recorded_at)
      ), 'UTF8')), 'hex')
  ) then raise exception 'answer receipt hash wrong'; end if;
  if not exists (
    select 1 from public.brain_decision_events event_row
    join public.brain_decision_outcomes outcome_row on outcome_row.id = event_row.after_ref
    join public.brain_decision_evidence_atoms atom on atom.id = outcome_row.source_evidence_atom_id
    where event_row.event_type = 'outcome_recorded'
      and event_row.after_ref = '142b0000-0000-4000-8000-000000000001'
      and event_row.idempotency_key = 'outcome-recorded:142b0000-0000-4000-8000-000000000001'
      and event_row.input_sha256 = encode(sha256(convert_to(concat_ws('|',
        outcome_row.id::text, outcome_row.decision_call_id::text, outcome_row.decision_id::text,
        outcome_row.workspace_id::text, outcome_row.subject_id::text, outcome_row.content_sha256,
        outcome_row.encryption_version::text, outcome_row.source_assertion_id::text,
        outcome_row.source_evidence_atom_id::text, atom.atom_sha256,
        private.brain_decision_timestamp_token(outcome_row.observed_at), outcome_row.recorded_by::text,
        private.brain_decision_timestamp_token(outcome_row.recorded_at)
      ), 'UTF8')), 'hex')
  ) then raise exception 'outcome receipt hash wrong'; end if;
  if (select content_sha256 from public.brain_decision_routes where id = '14270000-0000-4000-8000-000000000001')
    <> encode(sha256(convert_to(concat_ws('|',
      private.r142_cipher('14270000-0000-4000-8000-000000000001', 'decision_route', 'tab_label', 'route-one-label'),
      private.r142_cipher('14270000-0000-4000-8000-000000000001', 'decision_route', 'content', 'route-one'), '1'), 'UTF8')), 'hex')
  then raise exception 'database route hash wrong'; end if;
end;
$$;

select jsonb_build_object(
  'status', 'passed',
  'routes', (select count(*) from public.brain_decision_routes),
  'questions', (select count(*) from public.brain_decision_questions),
  'evidence_atoms', (select count(*) from public.brain_decision_evidence_atoms),
  'evidence_links', (select count(*) from public.brain_decision_evidence_links),
  'seal_events', (select count(*) from public.brain_decision_events where event_type = 'analysis_sealed'),
  'supersede_events', (select count(*) from public.brain_decision_events where event_type = 'analysis_superseded'),
  'call_events', (select count(*) from public.brain_decision_events where event_type = 'call_recorded'),
  'case_events', (select count(*) from public.brain_decision_events where event_type = 'case_opened'),
  'answer_events', (select count(*) from public.brain_decision_events where event_type = 'question_answered'),
  'outcome_events', (select count(*) from public.brain_decision_events where event_type = 'outcome_recorded'),
  'raw_authenticated_access', false,
  'snapshot_sha256', (select snapshot_sha256 from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000001')
) as g25_consequential_work_spine_result;

rollback;
