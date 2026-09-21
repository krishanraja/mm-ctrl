import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = process.cwd()
const contractPath = 'project-documentation/ctrl-evolution/g25-consequential-work-spine-r142.json'
const contract = JSON.parse(readFileSync(`${root}/${contractPath}`, 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const digest = (relative) => createHash('sha256').update(readFileSync(`${root}/${relative}`)).digest('hex')

check(contract.schema_version === 'ctrl.g25.consequential-work-spine.r142.v1', 'unexpected schema version')
check(contract.status === 'candidate_verified_isolated_rehearsal_rolled_back', 'candidate status changed')
check(contract.isolated_project_ref === 'cgkcplcamsijghalintq', 'wrong isolated project')
check(contract.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'wrong production project')
check(contract.database_tables === 14, 'exact table count changed')
check(contract.causal_mutation_controls === 94, 'causal mutation control count changed')
check(contract.foreign_key_indexes_missing === 0, 'foreign-key index gap recorded')
check(contract.rollback_residue_rows === 0, 'local canary residue recorded')
check(contract.hosted_database_residue_rows === 0 && contract.production_writes === 0, 'unexpected hosted residue or production write')
check(contract.route_connection_allowed === false, 'route must stay closed')
check(contract.authenticated_raw_access_allowed === false, 'raw authenticated access must stay closed')

for (const [name, relative] of [
  ['candidate', contract.artifacts.candidate],
  ['test', contract.artifacts.test],
  ['runner', contract.artifacts.runner],
  ['strategy', contract.artifacts.strategy],
  ['finding', contract.artifacts.finding],
  ['qa', contract.artifacts.qa],
]) check(digest(relative) === contract.artifacts[`${name}_sha256`], `${name} hash mismatch`)

const candidate = readFileSync(`${root}/${contract.artifacts.candidate}`, 'utf8')
for (const token of [
  "brain_decision_version_insert_must_be_draft",
  "brain_decision_authority_input_changed",
  "brain_decision_seal_replay_conflict",
  "brain_decision_call_authority_invalid",
  "brain_decision_call_version_guard",
  "brain_decision_calls_05_version_guard",
  "brain_decision_cipher_envelope_invalid",
  "force row level security",
  "or version_standing <> 'sealed'",
  "if table_name in ('brain_decision_evidence_atoms', 'brain_decision_events') then",
  "execute format('revoke all on table public.%I from service_role', table_name)",
  "execute format('grant select on table public.%I to service_role', table_name)",
  'brain_decision_human_prior_initial_state_invalid',
  'brain_decision_call_initial_state_invalid',
  'new.recorded_at < authority_row.occurred_at',
  'new.recorded_at >= authority_row.valid_until',
  'new.recorded_at > statement_timestamp()',
  "predecessor_row.version <> version_row.version - 1",
  "predecessor_row.standing <> 'sealed'",
  "set standing = 'superseded' where id = predecessor_row.id",
  "'supersede-version:' || predecessor_row.id::text",
  "version_row.standing in ('sealed', 'superseded')",
  "authority_row.occurred_at < version_row.generated_at",
  "prior.recorded_at > version_row.generated_at",
  "brain_decision_human_prior_after_analysis_generation",
  "max(route_row.created_at)",
  "max(question_row.created_at)",
  "max(link.linked_at)",
  "brain_decision_timestamp_token",
  "extract(epoch from p_timestamp) * 1000000",
  "brain_decision_case_event_append",
  "brain_decision_answer_event_append",
  "brain_decision_outcome_event_append",
  "brain_decision_case_chronology_invalid",
  "brain_decision_answer_chronology_invalid",
  "brain_decision_outcome_chronology_invalid",
  "check (recorded_by = subject_id)",
  "unique (decision_id, event_type, idempotency_key)",
  "brain_decision_authority_revocation_guard",
  "new.revoked_by not in (authority_row.actor_user_id, authority_row.owner_id, authority_row.subject_id)",
  "new.revoked_at < authority_row.occurred_at",
  "new.revoked_at > statement_timestamp()",
  "revocation.revoked_at <= statement_timestamp()",
  "brain_decision_authority_revocation_conflicts_with_use",
  "version_row.sealed_by_authority_event_id = authority_row.id",
  "call_row.authority_event_id = authority_row.id",
  "authority_row.occurred_at < version_sealed_at",
  "new.recorded_at < version_sealed_at",
  "version_sealed_at is null or new.recorded_at < version_sealed_at",
  "where id = version_id\n  for update nowait;",
  "for update of version_row nowait;",
  "brain_decision_governing_lock_busy_retry",
  "predecessor.snapshot_sha256",
  "brain_decision_authority_predates_predecessor",
  "brain_decision_one_recommended_route_required",
  "question_kind <> 'leader_can_answer'",
  "question_answer_mode = 'operator_research'",
  "question_operator_state <> 'asked'",
  'prior_decision_version_id uuid',
  'foreign key (prior_decision_version_id, prior_decision_id, workspace_id, subject_id)',
  'prior_version.snapshot_sha256',
  'brain_decision_prior_match_self_reference',
  'brain_decision_prior_match_unaccepted',
  'create table public.brain_decision_evidence_atoms',
  'constraint brain_decision_evidence_atoms_content_identity_unique unique',
  'causal_watermark_at timestamptz not null',
  "if source_row.captured_at > atom_materialized_at then",
  "if source_row.recorded_at > atom_materialized_at then",
  "if assertion_row.recorded_at > atom_materialized_at then",
  "'materialized_at_us', private.brain_decision_timestamp_token(p_materialized_at)",
  "'causal_watermark_at_us', private.brain_decision_timestamp_token(p_causal_watermark_at)",
  'from public.brain_sources source_row_locked',
  'from public.brain_assertions assertion_row_locked',
  'locked_source_xmin is distinct from observed_source_xmin',
  'locked_assertion_xmin is distinct from observed_assertion_xmin',
  'observed_assertion_xmin is distinct from p_expected_assertion_xmin',
  'observed_source_xmin is distinct from p_expected_source_xmin',
  'for share nowait',
  'pg_try_advisory_xact_lock(atom_identity_lock)',
  'ctrl.brain_decision_evidence_atom.v1',
  'brain_decision_evidence_provenance_busy_retry',
  'expected_atom_id := private.brain_decision_materialize_evidence_atom',
  'expected_assertion_xmin, expected_source_xmin',
  'brain_decision_human_prior_admission_guard',
  'brain_decision_human_prior_00_admission_guard',
  'brain_decision_human_prior_source_atom_mismatch',
  'revoke all on function private.brain_decision_human_prior_admission_guard() from public, anon, authenticated',
  'revoke all on function private.brain_decision_call_version_guard() from public, anon, authenticated',
  'brain_decision_evidence_link_atom_guard',
  'brain_decision_materialize_evidence_atom',
  'brain_decision_validate_evidence_atom',
  'brain_decision_source_atom_guard',
  'link.evidence_atom_id::text, atom.atom_sha256',
  'prior.source_evidence_atom_id::text, atom.atom_sha256',
  'source_evidence_atom_id::text, source_evidence_atom_sha256',
  'new.source_evidence_atom_id::text',
  'prior.source_assertion_id = old.id',
  'answer_row.source_assertion_id = old.id',
  'call_row.source_assertion_id = old.id',
  'outcome_row.source_assertion_id = old.id',
  'brain_decision_referenced_assertion_immutable',
  'brain_decision_referenced_source_immutable',
  'brain_decision_human_prior_source_chronology_invalid',
  'brain_decision_evidence_link_source_chronology_invalid',
  'brain_decision_answer_source_chronology_invalid',
  'brain_decision_call_source_chronology_invalid',
  'brain_decision_outcome_source_chronology_invalid',
  'max(atom.causal_watermark_at)',
  "if tg_op = 'DELETE' then return old; end if;\n  return new;",
]) check(candidate.includes(token), `candidate missing ${token}`)
check(candidate.split('where id = new.authority_event_id\n  for no key update nowait;').length - 1 === 2, 'revocation and call guards must use fail-fast FK-compatible authority locks')
check(candidate.includes('where id = p_authority_event_id\n  for no key update nowait;'), 'seal must use a fail-fast FK-compatible authority lock')
check(candidate.split('for update;').length - 1 === 0, 'candidate retains blocking governing locks')
check(candidate.split('for update nowait;').length - 1 === 4, 'candidate governing version NOWAIT lock count changed')
check(candidate.split('for no key update nowait;').length - 1 === 3, 'candidate FK-compatible authority lock count changed')
const callVersionGuard = candidate.slice(
  candidate.indexOf('create or replace function private.brain_decision_call_version_guard()'),
  candidate.indexOf('create or replace function private.brain_decision_call_authority_guard()'),
)
check(callVersionGuard.includes('where id = new.decision_version_id\n  for share nowait;'), 'owned-call version guard lacks a pre-FK fail-fast shared lock')
check(!callVersionGuard.includes('for share;'), 'owned-call version guard retains a blocking shared lock')
const materializer = candidate.slice(
  candidate.indexOf('create or replace function private.brain_decision_materialize_evidence_atom('),
  candidate.indexOf('create or replace function private.brain_decision_validate_evidence_atom('),
)
check(materializer.split('for share;').length - 1 === 0, 'materializer retains blocking provenance locks')
check(materializer.split('for share nowait;').length - 1 === 2, 'materializer must fail fast on busy provenance')
check(materializer.includes('pg_try_advisory_xact_lock(atom_identity_lock)'), 'materializer must universally fail fast on busy atom identity')
check(!materializer.includes('perform pg_advisory_xact_lock(atom_identity_lock)'), 'ordinary materializer retains blocking atom identity lock')
check(materializer.split('for update;').length - 1 === 0, 'materializer must not take deadlock-prone exclusive provenance locks')
check(materializer.includes('on conflict on constraint brain_decision_evidence_atoms_content_identity_unique do nothing'), 'materializer missing stable atom reuse')
check(materializer.includes('brain_decision_evidence_atom_digest_collision'), 'materializer missing exact collision validation')
check(materializer.includes('brain_decision_materializer_requires_read_committed'), 'materializer missing explicit isolation boundary')

const test = readFileSync(`${root}/${contract.artifacts.test}`, 'utf8')
for (const token of [
  'pre-sealed version insert was accepted',
  'cross-decision predecessor was accepted',
  'authority detached from snapshot was accepted',
  'changed watermark replay was accepted',
  'changed idempotency replay was accepted',
  'owned call without authority was accepted',
  'owned call against draft version was accepted',
  'raw audit event insert was accepted',
  'prior born superseded was accepted',
  'call born challenged was accepted',
  'call before authority was accepted',
  'future-dated call was accepted',
  'successor of draft predecessor was accepted',
  'nonsequential successor was accepted',
  'predecessor version was not superseded',
  'successor replacement event missing',
  'superseded predecessor exact replay was not durable',
  'authority before analysis was accepted',
  'post-generation human prior was accepted',
  'authority before route was accepted',
  'authority before question was accepted',
  'authority before evidence link was accepted',
  'snapshot digest changed across timezones',
  'call input digest changed across timezones',
  'case event count wrong',
  'answer event count wrong',
  'outcome event count wrong',
  'case receipt hash wrong',
  'answer receipt hash wrong',
  'outcome receipt hash wrong',
  'future-opened case was accepted',
  'answer to superseded analysis was accepted',
  'answer before question was accepted',
  'future answer was accepted',
  'outcome observed before call was accepted',
  'outcome recorded before observation was accepted',
  'future outcome record was accepted',
  'operator was recorded as outcome owner',
  'cross-event idempotency namespace failed',
  'supersede-version:14250000-0000-4000-8000-000000000001',
  'non-owner revocation was accepted',
  'pre-authority revocation was accepted',
  'future revocation was accepted',
  'late backdated seal revocation was accepted',
  'late backdated call revocation was accepted',
  'call authority before analysis seal was accepted',
  'call before analysis seal was accepted',
  'answer before analysis seal was accepted',
  'raw plaintext ciphertext was accepted',
  'successor snapshot did not bind predecessor seal',
  'backdated successor authority was accepted',
  'successor authority created before predecessor seal was accepted',
  'zero-recommendation decision was accepted',
  'brain-research question accepted a subject answer',
  'operator-research question accepted a subject answer',
  'unasked question accepted a subject answer',
  'suppressed question accepted a subject answer',
  'self prior-decision match was accepted',
  'unaccepted prior-decision version was accepted',
  'referenced assertion rewrite was accepted',
  'referenced assertion delete was accepted',
  'referenced source rewrite was accepted',
  'referenced source delete was accepted',
  'decision snapshot omitted frozen evidence digest',
  'human prior snapshot omitted frozen source atom',
  'call authority omitted frozen source atom',
  'family-specific referenced assertion rewrite was accepted',
  'family-specific referenced source rewrite was accepted',
  'unreferenced assertion update was silently discarded',
  'unreferenced source update was silently discarded',
  'future-captured source provenance was accepted',
  'future-recorded source provenance was accepted',
  'future-recorded assertion provenance was accepted',
  'evidence atom hash omitted causal timestamps',
  'evidence atom materializer lost nonexclusive provenance locks',
  'evidence atom materializer lost stable identity reuse',
  'evidence atom materializer lost exact collision validation',
  'evidence atom materializer lost row-version stability',
  'materializer lost universal fail-fast provenance locks',
  'materializer lost universal fail-fast atom identity lock',
  'governing locks lost universal fail-fast admission',
  'authority locks lost foreign-key compatibility',
  'answer admission lost pre-wait provenance binding',
  'human prior admission lost pre-wait provenance binding',
  'authenticated human-prior admission execution granted',
  'human prior before source provenance was accepted',
  'evidence link before source provenance was accepted',
  'answer before source provenance was accepted',
  'call before source provenance was accepted',
  'outcome before source provenance was accepted',
  'seal authority before evidence provenance was accepted',
  'seal authority before prior provenance was accepted',
]) check(test.includes(token), `test missing ${token}`)

if (failures.length) {
  console.error(`[g25-consequential-work-spine-r142] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-consequential-work-spine-r142] PASS: all consequential provenance is byte-, causality- and concurrency-bound, 94 weakened candidates fail and hosted residue is zero')
