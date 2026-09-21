import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = process.cwd()
const contractPath = 'project-documentation/ctrl-evolution/g25-consequential-concurrency-r143.json'
const contract = JSON.parse(readFileSync(`${root}/${contractPath}`, 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const digest = (relative) => createHash('sha256').update(readFileSync(`${root}/${relative}`)).digest('hex')

check(contract.schema_version === 'ctrl.g25.consequential-concurrency.r143.v1', 'unexpected schema version')
check(contract.status === 'isolated_concurrency_verified_rolled_back', 'unexpected status')
check(contract.isolated_project_ref === 'cgkcplcamsijghalintq', 'wrong isolated project')
check(contract.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'wrong production project')
check(contract.postgres_version === '17.6', 'wrong PostgreSQL version')
check(contract.concurrent_cases === 22 && contract.concurrent_cases_passed === 22, 'concurrent proof incomplete')
check(contract.snapshot_drift === false, 'snapshot drift recorded')
check(contract.forbidden_rows_committed === 0, 'forbidden concurrent row recorded')
check(contract.rollback_residue === 0, 'hosted rollback residue recorded')
check(contract.production_contacted === false, 'production contact recorded')
check(contract.persistent_migration_created === false, 'persistent migration claim changed')

for (const [name, relative] of [
  ['candidate', contract.artifacts.candidate],
  ['test', contract.artifacts.test],
  ['runner', contract.artifacts.runner],
  ['probe', contract.artifacts.probe],
  ['strategy', contract.artifacts.strategy],
  ['finding', contract.artifacts.finding],
  ['qa', contract.artifacts.qa],
]) check(digest(relative) === contract.artifacts[`${name}_sha256`], `${name} hash mismatch`)

const candidate = readFileSync(`${root}/${contract.artifacts.candidate}`, 'utf8')
for (const token of [
  'where id = version_id\n  for update nowait;',
  'for update of version_row nowait;',
  'brain_decision_governing_lock_busy_retry',
  'brain_decision_call_version_guard',
  'brain_decision_calls_05_version_guard',
  'brain_decision_authority_revocation_conflicts_with_use',
  'where id = p_authority_event_id\n  for no key update nowait;',
  'predecessor.snapshot_sha256',
  'brain_decision_authority_predates_predecessor',
  'brain_decision_one_recommended_route_required',
  'brain_decision_human_prior_after_analysis_generation',
  "question_kind <> 'leader_can_answer'",
  "question_answer_mode = 'operator_research'",
  "question_operator_state <> 'asked'",
  'prior_decision_version_id uuid',
  'prior_version.snapshot_sha256',
  'brain_decision_prior_match_self_reference',
  'brain_decision_prior_match_unaccepted',
  'create table public.brain_decision_evidence_atoms',
  'constraint brain_decision_evidence_atoms_content_identity_unique unique',
  'brain_decision_materialize_evidence_atom',
  'brain_decision_source_atom_guard',
  'causal_watermark_at timestamptz not null',
  "if source_row.captured_at > atom_materialized_at then",
  "if source_row.recorded_at > atom_materialized_at then",
  "if assertion_row.recorded_at > atom_materialized_at then",
  'brain_decision_evidence_link_source_chronology_invalid',
  'brain_decision_human_prior_source_chronology_invalid',
  'brain_decision_answer_source_chronology_invalid',
  'brain_decision_call_source_chronology_invalid',
  'brain_decision_outcome_source_chronology_invalid',
  'link.evidence_atom_id::text, atom.atom_sha256',
  'prior.source_evidence_atom_id::text, atom.atom_sha256',
  'source_evidence_atom_id::text, source_evidence_atom_sha256',
  'brain_decision_referenced_assertion_immutable',
  'brain_decision_referenced_source_immutable',
  'locked_source_xmin is distinct from observed_source_xmin',
  'locked_assertion_xmin is distinct from observed_assertion_xmin',
  'observed_assertion_xmin is distinct from p_expected_assertion_xmin',
  'expected_atom_id := private.brain_decision_materialize_evidence_atom',
  'expected_assertion_xmin, expected_source_xmin',
  'for share nowait',
  'pg_try_advisory_xact_lock(atom_identity_lock)',
  'brain_decision_evidence_provenance_busy_retry',
  'brain_decision_human_prior_admission_guard',
  'brain_decision_human_prior_00_admission_guard',
  'revoke all on function private.brain_decision_human_prior_admission_guard() from public, anon, authenticated',
  'revoke all on function private.brain_decision_call_version_guard() from public, anon, authenticated',
  "if tg_op = 'DELETE' then return old; end if;\n  return new;",
]) check(candidate.includes(token), `candidate missing ${token}`)
check(candidate.split('where id = new.authority_event_id\n  for no key update nowait;').length - 1 === 2, 'authority guards do not share fail-fast FK-compatible locking')
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
check(materializer.split('for share nowait;').length - 1 === 2, 'materializer does not fail fast on busy provenance')
check(materializer.includes('pg_try_advisory_xact_lock(atom_identity_lock)'), 'materializer can block on an uncommitted atom identity')
check(!materializer.includes('perform pg_advisory_xact_lock(atom_identity_lock)'), 'ordinary materializer retains blocking atom identity lock')
check(materializer.split('for update;').length - 1 === 0, 'materializer retains deadlock-prone exclusive provenance locks')
check(materializer.includes('on conflict on constraint brain_decision_evidence_atoms_content_identity_unique do nothing'), 'materializer lacks stable atom identity reuse')
check(materializer.includes('brain_decision_evidence_atom_digest_collision'), 'materializer lacks exact winner validation')

const probe = readFileSync(`${root}/${contract.artifacts.probe}`, 'utf8')
const candidateFunctionNames = [...candidate.matchAll(/create or replace function\s+(?:private|public)\.([a-z0-9_]+)\s*\(/gi)]
  .map((match) => match[1])
  .filter((name) => name !== 'seal_brain_decision_version_v1')
const cleanupFunctionBlock = probe.slice(
  probe.indexOf('const candidateFunctions = ['),
  probe.indexOf('\n\nfunction runCli'),
)
for (const name of candidateFunctionNames) {
  check(cleanupFunctionBlock.includes(`'${name}'`), `probe cleanup inventory missing ${name}`)
}
for (const token of [
  "linkedProjectRef !== isolatedProjectRef",
  "linkedProjectRef === productionProjectRef",
  'pg_advisory_xact_lock(1431432)',
  'pg_advisory_xact_lock(1431442)',
  'pg_advisory_xact_lock(1431451)',
  'pg_advisory_xact_lock(1431461)',
  'pg_advisory_xact_lock(1431471)',
  'pg_advisory_xact_lock(1431481)',
  'marker: 1431491',
  'marker: 1431492',
  'marker: 1431493',
  'marker: 1431494',
  'pg_advisory_xact_lock(1431490)',
  'pg_advisory_xact_lock(1431495)',
  "set local statement_timeout = '120s';\nselect private.brain_decision_materialize_evidence_atom(\n  '14230098-0000-4000-8000-000000000001'",
  'pg_advisory_xact_lock(1431496)',
  'pg_advisory_xact_lock(1431497)',
  'pg_advisory_xact_lock(1431500)',
  'pg_advisory_xact_lock(1431505)',
  'pg_advisory_xact_lock(1431506)',
  'pg_advisory_xact_lock(1431507)',
  'pg_advisory_xact_lock(1431508)',
  'pg_advisory_xact_lock(1431509)',
  'pg_advisory_xact_lock(1431501)',
  'pg_advisory_xact_lock(1431502)',
  'pg_advisory_xact_lock(1431503)',
  'pg_advisory_xact_lock(1431504)',
  'perform pg_sleep(25)',
  'select pg_sleep(20)',
  "label: 'prior'",
  "label: 'answer'",
  "label: 'call'",
  "label: 'outcome'",
  'r143_duplicate_evidence_atom_committed',
  "concurrent_same_assertion_materialization: 'busy_loser_retried_one_atom_authority_remained_valid'",
  "concurrent_distinct_assertions_same_source: 'completed_without_source_serialization'",
  "formerly_deadlocking_update_then_materialize: 'stale_partial_attempt_rolled_back_then_retry_committed'",
  "concurrent_update_then_waiting_materializer: 'stale_waiter_rejected_retry_captured_update'",
  "concurrent_post_seal_evidence: 'busy_writer_failed_fast_seal_committed'",
  "concurrent_post_supersession_answer: 'busy_answer_failed_fast_successor_committed'",
  "concurrent_seal_then_backdated_revocation: 'busy_revocation_failed_fast_seal_committed'",
  "concurrent_revocation_then_seal: 'busy_seal_failed_fast_revocation_committed'",
  "concurrent_call_then_backdated_revocation: 'busy_revocation_failed_fast_call_committed'",
  "concurrent_revocation_then_call: 'busy_call_failed_fast_revocation_committed'",
  "concurrent_answer_version_wait_then_provenance_update: 'busy_answer_rejected_without_residue_retry_captured_update'",
  "concurrent_prior_version_wait_then_provenance_update: 'busy_prior_rejected_without_residue_retry_captured_update'",
  "concurrent_provenance_update_then_prior_and_evidence_link: 'busy_prior_failed_fast_evidence_committed_retry_reused_atom'",
  "concurrent_atom_identity_then_prior_and_evidence_link: 'busy_prior_failed_fast_evidence_committed_retry_reused_atom'",
  "concurrent_reverse_atom_batches: 'busy_loser_rolled_back_winner_committed_retry_reused_two_atoms'",
  "concurrent_reverse_version_batches: 'busy_loser_rolled_back_winner_committed_retry_completed_four_distinct_links'",
  "concurrent_successor_then_owned_call: 'busy_call_failed_fast_successor_committed_no_receipt'",
  "concurrent_owned_call_then_successor: 'busy_successor_failed_fast_call_committed_retry_superseded'",
  'r143_shared_source_atom_count_wrong',
  'r143_former_deadlock_atom_count_wrong',
  'r143_former_deadlock_snapshot_wrong',
  'r143_rejected_shared_source_waiter_left_partial_atom',
  'r143_stale_waiter_left_atom',
  'r143_stale_waiting_answer_left_atom',
  'r143_stale_waiting_prior_left_atom',
  'r143_busy_waiting_prior_committed',
  'r143_inverse_prior_retry_did_not_reuse_updated_atom',
  'r143_busy_atom_identity_prior_committed',
  'r143_atom_identity_prior_retry_did_not_reuse_atom',
  'r143_reverse_batch_loser_left_links',
  'r143_reverse_batch_winner_links_wrong',
  'r143_reverse_batch_atom_count_wrong',
  'r143_reverse_batch_retry_did_not_reuse_atoms',
  'r143_reverse_version_loser_left_links',
  'r143_reverse_version_loser_left_atoms',
  'r143_reverse_version_winner_links_wrong',
  'r143_reverse_version_atom_count_wrong',
  'r143_reverse_version_retry_links_wrong',
  'r143_reverse_version_retry_atom_count_wrong',
  'r143_reverse_version_retry_identity_mismatch',
  'r143_successor_first_call_committed',
  'r143_successor_first_call_receipted',
  'r143_call_first_call_missing',
  'r143_call_first_receipt_missing',
  'r143_post_seal_snapshot_drift',
  'cleanupSql',
  'await Promise.allSettled(activeSessions)',
  'r142_predecessor_authority_control',
  "'brain_decision_evidence_atoms'",
  "'brain_decision_referenced_assertion_guard'",
  "'brain_decision_referenced_source_guard'",
  'rollback_residue: 0',
  'production_contacted: false',
]) check(probe.includes(token), `probe missing ${token}`)

if (failures.length) {
  console.error(`[g25-consequential-concurrency-r143] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-consequential-concurrency-r143] PASS: twenty-two standing, authority and provenance races are closed and isolated residue is zero')
