import fs from 'node:fs'
import path from 'node:path'
import { createG25PostgresHarness } from './lib/g25-postgres-harness.mjs'

const root = process.cwd()
const candidatePath = path.join(root, 'supabase/candidates/g25_consequential_work_spine_r142.sql')
const testPath = path.join(root, 'supabase/tests/database/g25_consequential_work_spine_r142.test.sql')
const candidate = fs.readFileSync(candidatePath, 'utf8').replaceAll('\r\n', '\n')
const test = fs.readFileSync(testPath, 'utf8').replaceAll('\r\n', '\n')

const routePredicate = 'if route_count <> 3 then raise exception \'brain_decision_exactly_three_routes_required\'; end if;'
const recommendedRoutePredicate = `if (select count(*) from public.brain_decision_routes where decision_version_id = version_row.id and is_recommended) <> 1 then
    raise exception 'brain_decision_one_recommended_route_required';
  end if;`
const authorityPredicate = 'or authority_row.valid_until <= statement_timestamp()'
const questionEvidencePredicate = "then raise exception 'brain_decision_every_question_needs_evidence'; end if;"
const priorMatchSelfPredicate = `if exists (
    select 1 from public.brain_decision_questions question_row
    where question_row.decision_version_id = version_row.id
      and question_row.kind = 'prior_decision_match'
      and question_row.prior_decision_id = version_row.decision_id
  ) then raise exception 'brain_decision_prior_match_self_reference'; end if;`
const priorMatchAcceptedPredicate = `if exists (
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
  ) then raise exception 'brain_decision_prior_match_unaccepted'; end if;`
const freshnessPredicate = "if version_row.fresh_until <= statement_timestamp() then raise exception 'brain_decision_analysis_stale'; end if;"
const authoritySnapshotPredicate = "if authority_row.input_sha256 <> computed_snapshot then raise exception 'brain_decision_authority_input_changed'; end if;"
const replayWatermarkPredicate = 'and version_row.source_watermark_sha256 = p_expected_source_watermark_sha256'
const replayIdempotencyPredicate = 'and event_row.idempotency_key = p_idempotency_key'
const predecessorColumns = 'foreign key (predecessor_version_id, decision_id, workspace_id, subject_id)'
const predecessorReference = 'references public.brain_decision_versions(id, decision_id, workspace_id, subject_id) on delete restrict,'
const answerCipherTrigger = 'create trigger brain_decision_answers_cipher before insert or update on public.brain_decision_answers for each row execute function private.brain_decision_cipher_guard();'
const callAuthorityTrigger = `create trigger brain_decision_calls_10_authority_guard
after insert on public.brain_decision_calls
for each row execute function private.brain_decision_call_authority_guard();`
const callVersionTrigger = `create trigger brain_decision_calls_05_version_guard
before insert on public.brain_decision_calls
for each row execute function private.brain_decision_call_version_guard();`
const callSealedVersionPredicate = "or version_standing <> 'sealed'"
const auditEventAclPredicate = "if table_name in ('brain_decision_evidence_atoms', 'brain_decision_events') then"
const priorInitialStatePredicate = "if new.superseded_at is not null then raise exception 'brain_decision_human_prior_initial_state_invalid'; end if;"
const callInitialStatePredicate = "if new.standing <> 'current' then raise exception 'brain_decision_call_initial_state_invalid'; end if;"
const callBackdatePredicate = 'or new.recorded_at < authority_row.occurred_at'
const callFuturePredicate = 'or new.recorded_at > statement_timestamp()'
const callAuthorityFuturePredicate = 'or authority_row.occurred_at > statement_timestamp()'
const futureSourceCapturedPredicate = `if source_row.captured_at > atom_materialized_at then
    raise exception 'brain_decision_evidence_source_captured_in_future';
  end if;`
const futureSourceRecordedPredicate = `if source_row.recorded_at > atom_materialized_at then
    raise exception 'brain_decision_evidence_source_recorded_in_future';
  end if;`
const futureAssertionRecordedPredicate = `if assertion_row.recorded_at > atom_materialized_at then
    raise exception 'brain_decision_evidence_assertion_recorded_in_future';
  end if;`
const evidenceAtomCausalHashTokens = `'materialized_at_us', private.brain_decision_timestamp_token(p_materialized_at),
    'causal_watermark_at_us', private.brain_decision_timestamp_token(p_causal_watermark_at)`
const evidenceAtomSourceSharedLock = `select * into source_row
    from public.brain_sources source_row_locked
    where source_row_locked.id = candidate_source_id
      and source_row_locked.workspace_id = p_workspace_id
      and source_row_locked.subject_id = p_subject_id
    for share nowait;`
const evidenceAtomAssertionSharedLock = `select * into assertion_row
    from public.brain_assertions assertion_row_locked
    where assertion_row_locked.id = p_assertion_id
      and assertion_row_locked.source_id = candidate_source_id
      and assertion_row_locked.workspace_id = p_workspace_id
      and assertion_row_locked.subject_id = p_subject_id
    for share nowait;`
const evidenceAtomStableIdentityReuse = 'on conflict on constraint brain_decision_evidence_atoms_content_identity_unique do nothing'
const evidenceAtomExactCollisionValidation = `if winner_row.assertion_snapshot is distinct from assertion_snapshot_value
    or winner_row.source_snapshot is distinct from source_snapshot_value
    or winner_row.assertion_snapshot_sha256 <> assertion_digest
    or winner_row.source_snapshot_sha256 <> source_digest
  then
    raise exception 'brain_decision_evidence_atom_digest_collision';
  end if;`
const evidenceAtomVersionStabilityGuard = `if locked_source_xmin is distinct from observed_source_xmin
    or locked_assertion_xmin is distinct from observed_assertion_xmin
  then
    raise exception 'brain_decision_evidence_provenance_changed_during_materialization';
  end if;`
const evidenceAtomExpectedVersionGuard = `if p_expected_assertion_xmin is not null
    and (observed_assertion_xmin is distinct from p_expected_assertion_xmin
      or observed_source_xmin is distinct from p_expected_source_xmin)
  then
    raise exception 'brain_decision_evidence_provenance_changed_during_materialization';
  end if;`
const evidenceAtomFailFastLock = 'for share nowait;'
const evidenceAtomIdentityLockBoundary = `if not pg_try_advisory_xact_lock(atom_identity_lock) then
    raise exception 'brain_decision_evidence_provenance_busy_retry';
  end if;`
const governingLockFailFast = 'for update nowait;'
const authorityLockCompatibility = 'for no key update nowait;'
const callVersionSharedLock = `where id = new.decision_version_id
  for share nowait;`
const callVersionStandingPredicate = `if version_standing <> 'sealed' or version_sealed_at is null then
    raise exception 'brain_decision_call_authority_invalid';
  end if;`
const answerProvenancePreflight = `select assertion_row.xmin, source_row.xmin
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
  if expected_source_xmin is null then raise exception 'brain_decision_evidence_source_scope_invalid'; end if;`
const priorProvenancePreflight = `if tg_op = 'INSERT' then
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
  end if;`
const callSourceChronologyPredicate = `elsif tg_table_name = 'brain_decision_calls' then
      raise exception 'brain_decision_call_source_chronology_invalid';`
const answerSourceChronologyPredicate = `elsif tg_table_name = 'brain_decision_answers' then
      raise exception 'brain_decision_answer_source_chronology_invalid';`
const outcomeSourceChronologyPredicate = `elsif tg_table_name = 'brain_decision_outcomes' then
      raise exception 'brain_decision_outcome_source_chronology_invalid';`
const priorSourceChronologyPredicate = `if tg_table_name = 'brain_decision_human_priors' then
      raise exception 'brain_decision_human_prior_source_chronology_invalid';`
const evidenceLinkSourceChronologyPredicate = `if new.linked_at < atom_causal_watermark_at then
    raise exception 'brain_decision_evidence_link_source_chronology_invalid';
  end if;`
const versionInsertTrigger = 'before insert or update or delete on public.brain_decision_versions'
const sealedAuthorityConstraint = "and sealed_by_authority_event_id is not null))"
const predecessorVersionPredicate = 'or predecessor_row.version <> version_row.version - 1'
const predecessorStandingPredicate = "or predecessor_row.standing <> 'sealed'"
const predecessorSupersedeUpdate = "update public.brain_decision_versions set standing = 'superseded' where id = predecessor_row.id;"
const terminalReplayPredicate = "if version_row.standing in ('sealed', 'superseded') then"
const analysisChronologyPredicate = "if authority_row.occurred_at < version_row.generated_at then raise exception 'brain_decision_authority_predates_snapshot'; end if;"
const humanPriorFirstPredicate = `if exists (
    select 1
    from public.brain_decision_human_priors prior
    where prior.decision_version_id = version_row.id
      and prior.superseded_at is null
      and prior.recorded_at > version_row.generated_at
  ) then raise exception 'brain_decision_human_prior_after_analysis_generation'; end if;`
const routeChronologyPredicate = "if authority_row.occurred_at < coalesce((select max(route_row.created_at) from public.brain_decision_routes route_row where route_row.decision_version_id = version_row.id), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_snapshot'; end if;"
const questionChronologyPredicate = "if authority_row.occurred_at < coalesce((select max(question_row.created_at) from public.brain_decision_questions question_row where question_row.decision_version_id = version_row.id), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_snapshot'; end if;"
const evidenceChronologyPredicate = "if authority_row.occurred_at < coalesce((select max(link.linked_at) from public.brain_decision_evidence_links link where link.decision_version_id = version_row.id), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_snapshot'; end if;"
const sealEvidenceProvenancePredicate = `if authority_row.occurred_at < coalesce((
    select max(atom.causal_watermark_at)
    from public.brain_decision_evidence_links link
    join public.brain_decision_evidence_atoms atom on atom.id = link.evidence_atom_id
    where link.decision_version_id = version_row.id
  ), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_evidence_provenance'; end if;`
const sealPriorProvenancePredicate = `if authority_row.occurred_at < coalesce((
    select max(atom.causal_watermark_at)
    from public.brain_decision_human_priors prior
    join public.brain_decision_evidence_atoms atom on atom.id = prior.source_evidence_atom_id
    where prior.decision_version_id = version_row.id and prior.superseded_at is null
  ), '-infinity'::timestamptz) then raise exception 'brain_decision_authority_predates_prior_provenance'; end if;`
const snapshotTimestampTokens = 'private.brain_decision_timestamp_token(version_row.generated_at), private.brain_decision_timestamp_token(version_row.fresh_until)'
const callTimestampToken = 'private.brain_decision_timestamp_token(p_recorded_at)'
const caseReceiptTrigger = `create trigger brain_decision_cases_event_append
after insert on public.brain_decision_cases
for each row execute function private.brain_decision_case_event_append();`
const answerReceiptTrigger = `create trigger brain_decision_answers_event_append
after insert on public.brain_decision_answers
for each row execute function private.brain_decision_answer_event_append();`
const outcomeReceiptTrigger = `create trigger brain_decision_outcomes_event_append
after insert on public.brain_decision_outcomes
for each row execute function private.brain_decision_outcome_event_append();`
const caseChronologyPredicate = "if new.opened_at > statement_timestamp() then raise exception 'brain_decision_case_chronology_invalid'; end if;"
const answerQuestionKindPredicate = "if question_kind <> 'leader_can_answer' then raise exception 'brain_decision_answer_question_kind_invalid'; end if;"
const answerModePredicate = "if question_answer_mode = 'operator_research' then raise exception 'brain_decision_answer_mode_invalid'; end if;"
const answerQuestionStatePredicate = "if question_operator_state <> 'asked' then raise exception 'brain_decision_answer_question_state_invalid'; end if;"
const answerStandingPredicate = "if version_standing <> 'sealed' then raise exception 'brain_decision_answer_chronology_invalid'; end if;"
const answerBeforeQuestionPredicate = "if new.recorded_at < question_created_at then raise exception 'brain_decision_answer_chronology_invalid'; end if;"
const answerFuturePredicate = "if new.recorded_at > statement_timestamp() then raise exception 'brain_decision_answer_chronology_invalid'; end if;"
const outcomeBeforeCallPredicate = "if new.observed_at < call_recorded_at then raise exception 'brain_decision_outcome_chronology_invalid'; end if;"
const outcomeBeforeObservationPredicate = "if new.recorded_at < new.observed_at then raise exception 'brain_decision_outcome_chronology_invalid'; end if;"
const outcomeFuturePredicate = "if new.recorded_at > statement_timestamp() then raise exception 'brain_decision_outcome_chronology_invalid'; end if;"
const eventIdempotencyNamespace = 'unique (decision_id, event_type, idempotency_key),'
const revocationActorPredicate = `if new.revoked_by not in (authority_row.actor_user_id, authority_row.owner_id, authority_row.subject_id)
    then raise exception 'brain_decision_authority_revocation_invalid'; end if;`
const revocationBeforeAuthorityPredicate = `if new.revoked_at < authority_row.occurred_at
    then raise exception 'brain_decision_authority_revocation_invalid'; end if;`
const revocationFuturePredicate = `if new.revoked_at > statement_timestamp()
    then raise exception 'brain_decision_authority_revocation_invalid'; end if;`
const revocationEffectivePredicate = 'and revocation.revoked_at <= statement_timestamp()'
const revocationSealUsePredicate = `if exists (
    select 1
    from public.brain_decision_versions version_row
    where version_row.sealed_by_authority_event_id = authority_row.id
      and new.revoked_at <= version_row.sealed_at
  ) then raise exception 'brain_decision_authority_revocation_conflicts_with_use'; end if;`
const revocationCallUsePredicate = `if exists (
    select 1
    from public.brain_decision_calls call_row
    where call_row.authority_event_id = authority_row.id
      and new.revoked_at <= call_row.recorded_at
  ) then raise exception 'brain_decision_authority_revocation_conflicts_with_use'; end if;`
const callAuthoritySealChronologyPredicate = 'or authority_row.occurred_at < version_sealed_at'
const callAuthorityAtomChronologyPredicate = `or authority_row.occurred_at < (
      select atom.causal_watermark_at
      from public.brain_decision_evidence_atoms atom
      where atom.id = new.source_evidence_atom_id
    )`
const callSealChronologyPredicate = 'or new.recorded_at < version_sealed_at'
const answerSealChronologyPredicate = "if version_sealed_at is null or new.recorded_at < version_sealed_at then raise exception 'brain_decision_answer_chronology_invalid'; end if;"
const draftStandingLock = `where id = version_id
  for update nowait;`
const answerStandingLock = 'for update of version_row nowait;'
const authorityConsumerLock = `where id = new.authority_event_id
  for no key update nowait;`
const sealAuthorityLock = `where id = p_authority_event_id
  for no key update nowait;`
const predecessorSnapshotBinding = `coalesce((select predecessor.snapshot_sha256
      from public.brain_decision_versions predecessor
      where predecessor.id = version_row.predecessor_version_id), ''),`
const predecessorAuthorityChronologyPredicate = `if predecessor_row.id is not null and authority_row.occurred_at < predecessor_row.sealed_at
    then raise exception 'brain_decision_authority_predates_predecessor'; end if;`
const evidenceAtomSnapshotBinding = 'link.assertion_id::text, link.evidence_atom_id::text, atom.atom_sha256,'
const humanPriorAtomSnapshotBinding = `prior.source_assertion_id::text, prior.source_evidence_atom_id::text, atom.atom_sha256,`
const callAtomAuthorityBinding = 'p_source_assertion_id::text, source_evidence_atom_id::text, source_evidence_atom_sha256,'
const answerAtomReceiptBinding = `new.encryption_version::text, new.source_assertion_id::text,
      new.source_evidence_atom_id::text,
      (select atom.atom_sha256 from public.brain_decision_evidence_atoms atom where atom.id = new.source_evidence_atom_id),
      new.recorded_by::text,
      private.brain_decision_timestamp_token(new.recorded_at)`
const outcomeAtomReceiptBinding = `new.encryption_version::text, new.source_assertion_id::text,
      new.source_evidence_atom_id::text,
      (select atom.atom_sha256 from public.brain_decision_evidence_atoms atom where atom.id = new.source_evidence_atom_id),
      private.brain_decision_timestamp_token(new.observed_at), new.recorded_by::text,`
const familyAssertionPredicates = {
  prior: `union all
    select 1 from public.brain_decision_human_priors prior
    where prior.source_assertion_id = old.id`,
  answer: `union all
    select 1 from public.brain_decision_answers answer_row
    where answer_row.source_assertion_id = old.id`,
  call: `union all
    select 1 from public.brain_decision_calls call_row
    where call_row.source_assertion_id = old.id`,
  outcome: `union all
    select 1 from public.brain_decision_outcomes outcome_row
    where outcome_row.source_assertion_id = old.id`,
}
const familySourcePredicates = {
  prior: 'or exists (select 1 from public.brain_decision_human_priors prior where prior.source_evidence_atom_id = atom.id)',
  answer: 'or exists (select 1 from public.brain_decision_answers answer_row where answer_row.source_evidence_atom_id = atom.id)',
  call: 'or exists (select 1 from public.brain_decision_calls call_row where call_row.source_evidence_atom_id = atom.id)',
  outcome: 'or exists (select 1 from public.brain_decision_outcomes outcome_row where outcome_row.source_evidence_atom_id = atom.id)',
}
const referencedAssertionTrigger = `create trigger brain_decision_referenced_assertion_guard
before update or delete on public.brain_assertions
for each row execute function private.brain_decision_referenced_assertion_guard();`
const referencedSourceTrigger = `create trigger brain_decision_referenced_source_guard
before update or delete on public.brain_sources
for each row execute function private.brain_decision_referenced_source_guard();`
const referencedAssertionPassThrough = `then raise exception 'brain_decision_referenced_assertion_immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;`
const referencedSourcePassThrough = `then raise exception 'brain_decision_referenced_source_immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;`

for (const token of [
  routePredicate,
  recommendedRoutePredicate,
  authorityPredicate,
  questionEvidencePredicate,
  priorMatchSelfPredicate,
  priorMatchAcceptedPredicate,
  freshnessPredicate,
  authoritySnapshotPredicate,
  replayWatermarkPredicate,
  replayIdempotencyPredicate,
  predecessorColumns,
  predecessorReference,
  answerCipherTrigger,
  callVersionTrigger,
  callAuthorityTrigger,
  callVersionSharedLock,
  callVersionStandingPredicate,
  callSealedVersionPredicate,
  auditEventAclPredicate,
  priorInitialStatePredicate,
  callInitialStatePredicate,
  callBackdatePredicate,
  callFuturePredicate,
  versionInsertTrigger,
  sealedAuthorityConstraint,
  predecessorVersionPredicate,
  predecessorStandingPredicate,
  predecessorSupersedeUpdate,
  terminalReplayPredicate,
  analysisChronologyPredicate,
  humanPriorFirstPredicate,
  routeChronologyPredicate,
  questionChronologyPredicate,
  evidenceChronologyPredicate,
  snapshotTimestampTokens,
  callTimestampToken,
  caseReceiptTrigger,
  answerReceiptTrigger,
  outcomeReceiptTrigger,
  caseChronologyPredicate,
  answerQuestionKindPredicate,
  answerModePredicate,
  answerQuestionStatePredicate,
  answerStandingPredicate,
  answerBeforeQuestionPredicate,
  answerFuturePredicate,
  outcomeBeforeCallPredicate,
  outcomeBeforeObservationPredicate,
  outcomeFuturePredicate,
  eventIdempotencyNamespace,
  revocationActorPredicate,
  revocationBeforeAuthorityPredicate,
  revocationFuturePredicate,
  revocationEffectivePredicate,
  revocationSealUsePredicate,
  revocationCallUsePredicate,
  callAuthoritySealChronologyPredicate,
  callSealChronologyPredicate,
  answerSealChronologyPredicate,
  draftStandingLock,
  answerStandingLock,
  authorityConsumerLock,
  sealAuthorityLock,
  predecessorSnapshotBinding,
  predecessorAuthorityChronologyPredicate,
  evidenceAtomSnapshotBinding,
  humanPriorAtomSnapshotBinding,
  callAtomAuthorityBinding,
  answerAtomReceiptBinding,
  outcomeAtomReceiptBinding,
  ...Object.values(familyAssertionPredicates),
  ...Object.values(familySourcePredicates),
  referencedAssertionTrigger,
  referencedSourceTrigger,
  referencedAssertionPassThrough,
  referencedSourcePassThrough,
]) {
  if (!candidate.includes(token)) throw new Error(`R142 candidate missing negative-control token: ${token}`)
}
if (candidate.split(authorityConsumerLock).length - 1 !== 2) {
  throw new Error('R142 candidate must lock the authority row in both revocation and call guards')
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness()
  await db.exec(`
    create table public.brain_sources (
      id uuid primary key,
      workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
      subject_id uuid not null references auth.users(id) on delete cascade,
      source_type text not null,
      actor_user_id uuid references auth.users(id) on delete set null,
      speaker_label text,
      captured_at timestamptz not null,
      purpose text not null,
      audience text not null,
      retention_expires_at timestamptz,
      integrity_sha256 text,
      external_locator text,
      content_ciphertext text,
      encryption_version smallint,
      recorded_at timestamptz not null default now(),
      created_by uuid references auth.users(id) on delete set null
    );
    create table public.brain_assertions (
      id uuid primary key,
      workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
      subject_id uuid not null references auth.users(id) on delete cascade,
      source_id uuid not null references public.brain_sources(id) on delete cascade,
      speaker_user_id uuid references auth.users(id) on delete set null,
      epistemic_basis text not null,
      audience text not null,
      statement_ciphertext text not null,
      encryption_version smallint not null,
      source_span_start integer,
      source_span_end integer,
      source_span_sha256 text,
      valid_at timestamptz,
      recorded_at timestamptz not null default now(),
      created_by uuid references auth.users(id) on delete set null
    );
    grant all on public.brain_sources, public.brain_assertions to service_role;
  `)
  await db.exec(candidateSql)
  return db
}

async function runPositive() {
  const db = await createDatabase()
  try {
    const results = await db.exec(test)
    const result = results.flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, 'g25_consequential_work_spine_result'))
    if (result?.g25_consequential_work_spine_result?.status !== 'passed') {
      throw new Error('R142 produced no passing result')
    }
    const residue = await db.query(`
      select
        (select count(*)::int from public.brain_subject_profiles) as profiles,
        (select count(*)::int from public.brain_decision_cases) as cases,
        (select count(*)::int from public.brain_decision_versions) as versions,
        (select count(*)::int from public.brain_decision_routes) as routes,
        (select count(*)::int from public.brain_decision_human_priors) as human_priors,
        (select count(*)::int from public.brain_decision_questions) as questions,
        (select count(*)::int from public.brain_decision_answers) as answers,
        (select count(*)::int from public.brain_decision_calls) as calls,
        (select count(*)::int from public.brain_decision_outcomes) as outcomes,
        (select count(*)::int from public.brain_decision_evidence_atoms) as evidence_atoms,
        (select count(*)::int from public.brain_decision_evidence_links) as evidence_links,
        (select count(*)::int from public.brain_decision_authority_events) as authority_events,
        (select count(*)::int from public.brain_decision_authority_revocations) as authority_revocations,
        (select count(*)::int from public.brain_decision_events) as events
    `)
    if (Object.values(residue.rows[0]).some((count) => count !== 0)) {
      throw new Error(`R142 rollback left residue: ${JSON.stringify(residue.rows[0])}`)
    }
    const missingForeignKeyIndexes = await db.query(`
      select c.conrelid::regclass::text as table_name, a.attname as leading_fk_column
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f'
        and (c.conrelid::regclass::text like 'brain_decision\\_%' escape '\\'
          or c.conrelid::regclass::text = 'brain_subject_profiles')
        and not exists (
          select 1 from pg_index i
          where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1]
        )
      order by 1, 2
    `)
    if (missingForeignKeyIndexes.rows.length) {
      throw new Error(`R142 missing foreign-key indexes: ${JSON.stringify(missingForeignKeyIndexes.rows)}`)
    }
    return {
      postgres_version: (await db.query('show server_version')).rows[0].server_version,
      canary: result.g25_consequential_work_spine_result,
      rollback_residue: residue.rows[0],
      missing_foreign_key_indexes: 0,
    }
  } catch (error) {
    const diagnostic = [error?.message, error?.where, error?.detail].filter(Boolean).join(' | ')
    throw new Error(`R142 positive canary failed: ${diagnostic}`)
  } finally {
    await db.close()
  }
}

async function expectMutationFailure(candidateSql, expected, label) {
  if (process.env.R142_MUTATION_ONLY && process.env.R142_MUTATION_ONLY !== label) {
    return { [label]: 'skipped_by_filter' }
  }
  const db = await createDatabase(candidateSql)
  try {
    try {
      await db.exec(test)
    } catch (error) {
      if (String(error?.message).includes(expected)) return { [label]: 'failed_as_required' }
      throw new Error(`R142 weakened ${label} failed for an unexpected reason: ${String(error?.message)}`, { cause: error })
    }
    throw new Error(`R142 weakened ${label} unexpectedly passed`)
  } finally {
    await db.close()
  }
}

const positive = await runPositive()
if (process.env.R142_POSITIVE_ONLY === '1') {
  process.stdout.write(`${JSON.stringify({ status: 'passed', runtime: '@electric-sql/pglite@0.5.8', ...positive }, null, 2)}\n`)
  process.exit(0)
}
const futureSourceCapturedNegative = await expectMutationFailure(
  candidate.replace(futureSourceCapturedPredicate, ''),
  'future-captured source provenance was accepted',
  'future_source_captured_guard_removed',
)
const futureSourceRecordedNegative = await expectMutationFailure(
  candidate.replace(futureSourceRecordedPredicate, ''),
  'future-recorded source provenance was accepted',
  'future_source_recorded_guard_removed',
)
const futureAssertionRecordedNegative = await expectMutationFailure(
  candidate.replace(futureAssertionRecordedPredicate, ''),
  'future-recorded assertion provenance was accepted',
  'future_assertion_recorded_guard_removed',
)
const evidenceAtomCausalHashNegative = await expectMutationFailure(
  candidate.replace(
    evidenceAtomCausalHashTokens,
    `'materialized_at_us', null,\n    'causal_watermark_at_us', null`,
  ),
  'evidence atom hash omitted causal timestamps',
  'evidence_atom_causal_hash_binding_removed',
)
const evidenceAtomSharedLockNegative = await expectMutationFailure(
  candidate
    .replace(evidenceAtomSourceSharedLock, evidenceAtomSourceSharedLock.replace('for share nowait;', 'for update nowait;'))
    .replace(evidenceAtomAssertionSharedLock, evidenceAtomAssertionSharedLock.replace('for share nowait;', 'for update nowait;')),
  'evidence atom materializer lost nonexclusive provenance locks',
  'evidence_atom_nonexclusive_provenance_locks_removed',
)
const evidenceAtomStableIdentityNegative = await expectMutationFailure(
  candidate.replace(evidenceAtomStableIdentityReuse, ''),
  'evidence atom materializer lost stable identity reuse',
  'evidence_atom_stable_identity_reuse_removed',
)
const evidenceAtomCollisionValidationNegative = await expectMutationFailure(
  candidate.replace(evidenceAtomExactCollisionValidation, ''),
  'evidence atom materializer lost exact collision validation',
  'evidence_atom_exact_collision_validation_removed',
)
const evidenceAtomVersionStabilityNegative = await expectMutationFailure(
  candidate.replace(evidenceAtomVersionStabilityGuard, ''),
  'evidence atom materializer lost row-version stability',
  'evidence_atom_row_version_stability_removed',
)
const evidenceAtomExpectedVersionNegative = await expectMutationFailure(
  candidate.replace(evidenceAtomExpectedVersionGuard, ''),
  'evidence atom materializer lost row-version stability',
  'evidence_atom_expected_version_binding_removed',
)
const evidenceAtomExpectedVersionFailFastNegative = await expectMutationFailure(
  candidate.replaceAll(evidenceAtomFailFastLock, 'for share;'),
  'materializer lost universal fail-fast provenance locks',
  'evidence_atom_universal_fail_fast_locks_removed',
)
const evidenceAtomIdentityLockBoundaryNegative = await expectMutationFailure(
  candidate.replace(evidenceAtomIdentityLockBoundary, 'perform pg_advisory_xact_lock(atom_identity_lock);'),
  'materializer lost universal fail-fast atom identity lock',
  'evidence_atom_universal_fail_fast_identity_lock_removed',
)
const governingLockFailFastNegative = await expectMutationFailure(
  candidate.replaceAll(governingLockFailFast, 'for update;'),
  'governing locks lost universal fail-fast admission',
  'governing_lock_universal_fail_fast_removed',
)
const authorityLockCompatibilityNegative = await expectMutationFailure(
  candidate.replaceAll(authorityLockCompatibility, 'for update nowait;'),
  'authority locks lost foreign-key compatibility',
  'authority_lock_foreign_key_compatibility_removed',
)
const callVersionSharedLockNegative = await expectMutationFailure(
  candidate.replace(callVersionSharedLock, callVersionSharedLock.replace('for share nowait;', 'for share;')),
  'owned-call governing-version lock lost pre-FK admission',
  'call_version_pre_fk_fail_fast_lock_removed',
)
const answerProvenancePreflightNegative = await expectMutationFailure(
  candidate.replace(answerProvenancePreflight, ''),
  'answer admission lost pre-wait provenance binding',
  'answer_pre_wait_provenance_binding_removed',
)
const priorProvenancePreflightNegative = await expectMutationFailure(
  candidate.replace(priorProvenancePreflight, ''),
  'human prior admission lost pre-wait provenance binding',
  'human_prior_pre_wait_provenance_binding_removed',
)
const priorSourceChronologyNegative = await expectMutationFailure(
  candidate.replace(
    priorSourceChronologyPredicate,
    "if tg_table_name = 'brain_decision_human_priors' then null;",
  ),
  'human prior before source provenance was accepted',
  'human_prior_source_chronology_removed',
)
const evidenceLinkSourceChronologyNegative = await expectMutationFailure(
  candidate.replace(evidenceLinkSourceChronologyPredicate, ''),
  'evidence link before source provenance was accepted',
  'evidence_link_source_chronology_removed',
)
const answerSourceChronologyNegative = await expectMutationFailure(
  candidate.replace(
    answerSourceChronologyPredicate,
    "elsif tg_table_name = 'brain_decision_answers' then null;",
  ),
  'answer before source provenance was accepted',
  'answer_source_chronology_removed',
)
const callSourceChronologyNegative = await expectMutationFailure(
  candidate
    .replace(callSourceChronologyPredicate, "elsif tg_table_name = 'brain_decision_calls' then null;")
    .replace(callAuthorityAtomChronologyPredicate, ''),
  'call before source provenance was accepted',
  'call_source_chronology_removed',
)
const outcomeSourceChronologyNegative = await expectMutationFailure(
  candidate.replace(
    outcomeSourceChronologyPredicate,
    "elsif tg_table_name = 'brain_decision_outcomes' then null;",
  ),
  'outcome before source provenance was accepted',
  'outcome_source_chronology_removed',
)
const sealEvidenceProvenanceNegative = await expectMutationFailure(
  candidate.replace(sealEvidenceProvenancePredicate, ''),
  'seal authority before evidence provenance was accepted',
  'seal_evidence_provenance_guard_removed',
)
const sealPriorProvenanceNegative = await expectMutationFailure(
  candidate.replace(sealPriorProvenancePredicate, ''),
  'seal authority before prior provenance was accepted',
  'seal_prior_provenance_guard_removed',
)
const routeNegative = await expectMutationFailure(
  candidate.replace(routePredicate, ''),
  'two-route decision was accepted',
  'exact_route_count_removed',
)
const recommendedRouteNegative = await expectMutationFailure(
  candidate.replace(recommendedRoutePredicate, ''),
  'zero-recommendation decision was accepted',
  'exact_recommended_route_count_removed',
)
const questionEvidenceNegative = await expectMutationFailure(
  candidate.replace(questionEvidencePredicate, "then null; end if;"),
  'question without evidence was accepted',
  'question_evidence_guard_removed',
)
const priorMatchSelfNegative = await expectMutationFailure(
  candidate.replace(priorMatchSelfPredicate, ''),
  'self prior-decision match was accepted',
  'prior_match_self_reference_guard_removed',
)
const priorMatchAcceptedNegative = await expectMutationFailure(
  candidate.replace(priorMatchAcceptedPredicate, ''),
  'unaccepted prior-decision version was accepted',
  'prior_match_accepted_version_guard_removed',
)
const authorityNegative = await expectMutationFailure(
  candidate.replaceAll(authorityPredicate, ''),
  'expired owner authority was accepted',
  'authority_expiry_removed',
)
const freshnessNegative = await expectMutationFailure(
  candidate.replace(freshnessPredicate, ''),
  'stale analysis was accepted',
  'freshness_guard_removed',
)
const authoritySnapshotNegative = await expectMutationFailure(
  candidate.replace(authoritySnapshotPredicate, ''),
  'authority detached from snapshot was accepted',
  'authority_snapshot_binding_removed',
)
const replayWatermarkNegative = await expectMutationFailure(
  candidate.replace(replayWatermarkPredicate, ''),
  'changed watermark replay was accepted',
  'replay_watermark_binding_removed',
)
const replayIdempotencyNegative = await expectMutationFailure(
  candidate.replace(replayIdempotencyPredicate, ''),
  'changed idempotency replay was accepted',
  'replay_idempotency_binding_removed',
)
const predecessorNegative = await expectMutationFailure(
  candidate
    .replace(predecessorColumns, 'foreign key (predecessor_version_id)')
    .replace(predecessorReference, 'references public.brain_decision_versions(id) on delete restrict,'),
  'cross-decision predecessor was accepted',
  'predecessor_scope_binding_removed',
)
const answerCipherNegative = await expectMutationFailure(
  candidate.replace(answerCipherTrigger, ''),
  'raw plaintext ciphertext was accepted',
  'answer_cipher_guard_removed',
)
const callAuthorityNegative = await expectMutationFailure(
  candidate.replace(callAuthorityTrigger, ''),
  'owned call without authority was accepted',
  'call_authority_guard_removed',
)
const callSealedVersionNegative = await expectMutationFailure(
  candidate
    .replace(callVersionStandingPredicate, `if false then
    raise exception 'brain_decision_call_authority_invalid';
  end if;`)
    .replace(callSealedVersionPredicate, '')
    .replace('or version_sealed_at is null', ''),
  'owned call against draft version was accepted',
  'call_sealed_version_guard_removed',
)
const auditEventAclNegative = await expectMutationFailure(
  candidate.replace(auditEventAclPredicate, 'if false then'),
  'raw audit event insert was accepted',
  'audit_event_insert_acl_removed',
)
const priorInitialStateNegative = await expectMutationFailure(
  candidate.replace(priorInitialStatePredicate, ''),
  'prior born superseded was accepted',
  'prior_initial_state_guard_removed',
)
const callInitialStateNegative = await expectMutationFailure(
  candidate.replace(callInitialStatePredicate, ''),
  'call born challenged was accepted',
  'call_initial_state_guard_removed',
)
const callBackdateNegative = await expectMutationFailure(
  candidate
    .replace(callBackdatePredicate, '')
    .replace(callAuthorityFuturePredicate, ''),
  'call before authority was accepted',
  'call_backdate_guard_removed',
)
const callFutureNegative = await expectMutationFailure(
  candidate.replace(callFuturePredicate, ''),
  'future-dated call was accepted',
  'call_future_guard_removed',
)
const presealedInsertNegative = await expectMutationFailure(
  candidate
    .replace(versionInsertTrigger, 'before update or delete on public.brain_decision_versions')
    .replace(sealedAuthorityConstraint, 'and true))'),
  'pre-sealed version insert was accepted',
  'presealed_insert_guards_removed',
)
const predecessorCurrentNegative = await expectMutationFailure(
  candidate.replace(predecessorStandingPredicate, ''),
  'brain_decision_authority_invalid',
  'predecessor_current_guard_removed',
)
const predecessorSequenceNegative = await expectMutationFailure(
  candidate.replace(predecessorVersionPredicate, ''),
  'brain_decision_authority_invalid',
  'predecessor_sequence_guard_removed',
)
const predecessorTransitionNegative = await expectMutationFailure(
  candidate.replace(predecessorSupersedeUpdate, ''),
  'duplicate key value violates unique constraint',
  'predecessor_transition_removed',
)
const durableReplayNegative = await expectMutationFailure(
  candidate.replace(terminalReplayPredicate, "if version_row.standing = 'sealed' then"),
  'brain_decision_version_not_draft',
  'superseded_replay_guard_removed',
)
const analysisChronologyNegative = await expectMutationFailure(
  candidate.replace(analysisChronologyPredicate, ''),
  'authority before analysis was accepted',
  'analysis_authority_chronology_removed',
)
const humanPriorFirstNegative = await expectMutationFailure(
  candidate.replace(humanPriorFirstPredicate, ''),
  'post-generation human prior was accepted',
  'human_prior_first_gate_removed',
)
const routeChronologyNegative = await expectMutationFailure(
  candidate.replace(routeChronologyPredicate, ''),
  'authority before route was accepted',
  'route_authority_chronology_removed',
)
const questionChronologyNegative = await expectMutationFailure(
  candidate.replace(questionChronologyPredicate, ''),
  'authority before question was accepted',
  'question_authority_chronology_removed',
)
const evidenceChronologyNegative = await expectMutationFailure(
  candidate.replace(evidenceChronologyPredicate, ''),
  'authority before evidence link was accepted',
  'evidence_authority_chronology_removed',
)
const snapshotTimezoneNegative = await expectMutationFailure(
  candidate.replace(snapshotTimestampTokens, 'version_row.generated_at::text, version_row.fresh_until::text'),
  'snapshot digest changed across timezones',
  'snapshot_timestamp_canonicalization_removed',
)
const callTimezoneNegative = await expectMutationFailure(
  candidate.replace(callTimestampToken, 'p_recorded_at::text'),
  'call input digest changed across timezones',
  'call_timestamp_canonicalization_removed',
)
const caseReceiptNegative = await expectMutationFailure(
  candidate.replace(caseReceiptTrigger, ''),
  'case event count wrong',
  'case_receipt_trigger_removed',
)
const answerReceiptNegative = await expectMutationFailure(
  candidate.replace(answerReceiptTrigger, ''),
  'answer event count wrong',
  'answer_receipt_trigger_removed',
)
const outcomeReceiptNegative = await expectMutationFailure(
  candidate.replace(outcomeReceiptTrigger, ''),
  'outcome event count wrong',
  'outcome_receipt_trigger_removed',
)
const caseChronologyNegative = await expectMutationFailure(
  candidate.replace(caseChronologyPredicate, ''),
  'future-opened case was accepted',
  'case_chronology_guard_removed',
)
const answerStandingNegative = await expectMutationFailure(
  candidate.replace(answerStandingPredicate, ''),
  'answer to superseded analysis was accepted',
  'answer_current_version_guard_removed',
)
const answerQuestionKindNegative = await expectMutationFailure(
  candidate.replace(answerQuestionKindPredicate, ''),
  'brain-research question accepted a subject answer',
  'answer_question_kind_guard_removed',
)
const answerModeNegative = await expectMutationFailure(
  candidate.replace(answerModePredicate, ''),
  'operator-research question accepted a subject answer',
  'answer_mode_guard_removed',
)
const answerQuestionStateNegative = await expectMutationFailure(
  candidate.replace(answerQuestionStatePredicate, ''),
  'unasked question accepted a subject answer',
  'answer_question_state_guard_removed',
)
const answerBeforeQuestionNegative = await expectMutationFailure(
  candidate
    .replace(answerBeforeQuestionPredicate, '')
    .replace(answerSealChronologyPredicate, '')
    .replace(answerSourceChronologyPredicate, "elsif tg_table_name = 'brain_decision_answers' then null;"),
  'answer before question was accepted',
  'answer_question_chronology_removed',
)
const answerFutureNegative = await expectMutationFailure(
  candidate.replace(answerFuturePredicate, ''),
  'future answer was accepted',
  'answer_future_guard_removed',
)
const outcomeBeforeCallNegative = await expectMutationFailure(
  candidate.replace(outcomeBeforeCallPredicate, ''),
  'outcome observed before call was accepted',
  'outcome_call_chronology_removed',
)
const outcomeBeforeObservationNegative = await expectMutationFailure(
  candidate
    .replace(outcomeBeforeObservationPredicate, '')
    .replace(outcomeSourceChronologyPredicate, "elsif tg_table_name = 'brain_decision_outcomes' then null;"),
  'outcome recorded before observation was accepted',
  'outcome_observation_chronology_removed',
)
const outcomeFutureNegative = await expectMutationFailure(
  candidate.replace(outcomeFuturePredicate, ''),
  'future outcome record was accepted',
  'outcome_future_guard_removed',
)
const eventIdempotencyNamespaceNegative = await expectMutationFailure(
  candidate.replace(eventIdempotencyNamespace, 'unique (decision_id, idempotency_key),'),
  'duplicate key value violates unique constraint',
  'event_type_idempotency_namespace_removed',
)
const revocationActorNegative = await expectMutationFailure(
  candidate.replace(revocationActorPredicate, ''),
  'non-owner revocation was accepted',
  'revocation_actor_guard_removed',
)
const revocationBeforeAuthorityNegative = await expectMutationFailure(
  candidate.replace(revocationBeforeAuthorityPredicate, ''),
  'pre-authority revocation was accepted',
  'revocation_authority_chronology_removed',
)
const revocationFutureNegative = await expectMutationFailure(
  candidate.replace(revocationFuturePredicate, ''),
  'future revocation was accepted',
  'revocation_future_guard_removed',
)
const revocationSealUseNegative = await expectMutationFailure(
  candidate.replace(revocationSealUsePredicate, ''),
  'late backdated seal revocation was accepted',
  'revocation_seal_use_guard_removed',
)
const revocationCallUseNegative = await expectMutationFailure(
  candidate.replace(revocationCallUsePredicate, ''),
  'late backdated call revocation was accepted',
  'revocation_call_use_guard_removed',
)
const callAuthoritySealChronologyNegative = await expectMutationFailure(
  candidate
    .replace(callAuthoritySealChronologyPredicate, '')
    .replace(callAuthorityAtomChronologyPredicate, ''),
  'call authority before analysis seal was accepted',
  'call_authority_seal_chronology_removed',
)
const answerSealChronologyNegative = await expectMutationFailure(
  candidate
    .replace(answerSealChronologyPredicate, '')
    .replace(answerSourceChronologyPredicate, "elsif tg_table_name = 'brain_decision_answers' then null;"),
  'answer before analysis seal was accepted',
  'answer_seal_chronology_removed',
)
const predecessorSnapshotBindingNegative = await expectMutationFailure(
  candidate.replace(predecessorSnapshotBinding, `'' ,`),
  'successor snapshot did not bind predecessor seal',
  'predecessor_snapshot_binding_removed',
)
const predecessorAuthorityChronologyNegative = await expectMutationFailure(
  candidate.replace(predecessorAuthorityChronologyPredicate, ''),
  'backdated successor authority was accepted',
  'predecessor_authority_chronology_removed',
)
const evidenceAtomSnapshotNegative = await expectMutationFailure(
  candidate.replace(evidenceAtomSnapshotBinding, "link.assertion_id::text, link.evidence_atom_id::text, '',"),
  'decision snapshot omitted frozen evidence digest',
  'evidence_atom_snapshot_binding_removed',
)
const humanPriorAtomSnapshotNegative = await expectMutationFailure(
  candidate.replace(humanPriorAtomSnapshotBinding, "prior.source_assertion_id::text, '', '',"),
  'human prior snapshot omitted frozen source atom',
  'human_prior_atom_snapshot_binding_removed',
)
const callAtomAuthorityNegative = await expectMutationFailure(
  candidate.replace(callAtomAuthorityBinding, "p_source_assertion_id::text, '', '',"),
  'call authority omitted frozen source atom',
  'call_atom_authority_binding_removed',
)
const answerAtomReceiptNegative = await expectMutationFailure(
  candidate.replace(answerAtomReceiptBinding, `new.encryption_version::text, new.source_assertion_id::text,
      new.recorded_by::text,
      private.brain_decision_timestamp_token(new.recorded_at)`),
  'answer receipt hash wrong',
  'answer_atom_receipt_binding_removed',
)
const outcomeAtomReceiptNegative = await expectMutationFailure(
  candidate.replace(outcomeAtomReceiptBinding, `new.encryption_version::text, new.source_assertion_id::text,
      private.brain_decision_timestamp_token(new.observed_at), new.recorded_by::text,`),
  'outcome receipt hash wrong',
  'outcome_atom_receipt_binding_removed',
)
const familyAssertionNegatives = {}
for (const [family, predicate] of Object.entries(familyAssertionPredicates)) {
  Object.assign(familyAssertionNegatives, await expectMutationFailure(
    candidate.replace(predicate, ''),
    'family-specific referenced assertion rewrite was accepted',
    `${family}_assertion_reference_guard_removed`,
  ))
}
const familySourceNegatives = {}
for (const [family, predicate] of Object.entries(familySourcePredicates)) {
  Object.assign(familySourceNegatives, await expectMutationFailure(
    candidate.replace(predicate, ''),
    'family-specific referenced source rewrite was accepted',
    `${family}_source_reference_guard_removed`,
  ))
}
const referencedAssertionNegative = await expectMutationFailure(
  candidate.replace(referencedAssertionTrigger, ''),
  'referenced assertion rewrite was accepted',
  'referenced_assertion_immutability_removed',
)
const referencedSourceNegative = await expectMutationFailure(
  candidate.replace(referencedSourceTrigger, ''),
  'referenced source rewrite was accepted',
  'referenced_source_immutability_removed',
)
const referencedAssertionPassThroughNegative = await expectMutationFailure(
  candidate.replace(referencedAssertionPassThrough, referencedAssertionPassThrough.replace('return new;', 'return old;')),
  'unreferenced assertion update was silently discarded',
  'unreferenced_assertion_update_passthrough_removed',
)
const referencedSourcePassThroughNegative = await expectMutationFailure(
  candidate.replace(referencedSourcePassThrough, referencedSourcePassThrough.replace('return new;', 'return old;')),
  'unreferenced source update was silently discarded',
  'unreferenced_source_update_passthrough_removed',
)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  runtime: '@electric-sql/pglite@0.5.8',
  ...positive,
  negative_controls: {
    ...futureSourceCapturedNegative,
    ...futureSourceRecordedNegative,
    ...futureAssertionRecordedNegative,
    ...evidenceAtomCausalHashNegative,
    ...evidenceAtomSharedLockNegative,
    ...evidenceAtomStableIdentityNegative,
    ...evidenceAtomCollisionValidationNegative,
    ...evidenceAtomVersionStabilityNegative,
    ...evidenceAtomExpectedVersionNegative,
    ...evidenceAtomExpectedVersionFailFastNegative,
    ...evidenceAtomIdentityLockBoundaryNegative,
    ...governingLockFailFastNegative,
    ...authorityLockCompatibilityNegative,
    ...callVersionSharedLockNegative,
    ...answerProvenancePreflightNegative,
    ...priorProvenancePreflightNegative,
    ...priorSourceChronologyNegative,
    ...evidenceLinkSourceChronologyNegative,
    ...answerSourceChronologyNegative,
    ...callSourceChronologyNegative,
    ...outcomeSourceChronologyNegative,
    ...sealEvidenceProvenanceNegative,
    ...sealPriorProvenanceNegative,
    ...routeNegative,
    ...recommendedRouteNegative,
    ...questionEvidenceNegative,
    ...priorMatchSelfNegative,
    ...priorMatchAcceptedNegative,
    ...authorityNegative,
    ...freshnessNegative,
    ...authoritySnapshotNegative,
    ...replayWatermarkNegative,
    ...replayIdempotencyNegative,
    ...predecessorNegative,
    ...answerCipherNegative,
    ...callAuthorityNegative,
    ...callSealedVersionNegative,
    ...auditEventAclNegative,
    ...priorInitialStateNegative,
    ...callInitialStateNegative,
    ...callBackdateNegative,
    ...callFutureNegative,
    ...presealedInsertNegative,
    ...predecessorCurrentNegative,
    ...predecessorSequenceNegative,
    ...predecessorTransitionNegative,
    ...durableReplayNegative,
    ...analysisChronologyNegative,
    ...humanPriorFirstNegative,
    ...routeChronologyNegative,
    ...questionChronologyNegative,
    ...evidenceChronologyNegative,
    ...snapshotTimezoneNegative,
    ...callTimezoneNegative,
    ...caseReceiptNegative,
    ...answerReceiptNegative,
    ...outcomeReceiptNegative,
    ...caseChronologyNegative,
    ...answerStandingNegative,
    ...answerQuestionKindNegative,
    ...answerModeNegative,
    ...answerQuestionStateNegative,
    ...answerBeforeQuestionNegative,
    ...answerFutureNegative,
    ...outcomeBeforeCallNegative,
    ...outcomeBeforeObservationNegative,
    ...outcomeFutureNegative,
    ...eventIdempotencyNamespaceNegative,
    ...revocationActorNegative,
    ...revocationBeforeAuthorityNegative,
    ...revocationFutureNegative,
    ...revocationSealUseNegative,
    ...revocationCallUseNegative,
    ...callAuthoritySealChronologyNegative,
    ...answerSealChronologyNegative,
    ...predecessorSnapshotBindingNegative,
    ...predecessorAuthorityChronologyNegative,
    ...evidenceAtomSnapshotNegative,
    ...humanPriorAtomSnapshotNegative,
    ...callAtomAuthorityNegative,
    ...answerAtomReceiptNegative,
    ...outcomeAtomReceiptNegative,
    ...familyAssertionNegatives,
    ...familySourceNegatives,
    ...referencedAssertionNegative,
    ...referencedSourceNegative,
    ...referencedAssertionPassThroughNegative,
    ...referencedSourcePassThroughNegative,
  },
}, null, 2)}\n`)
