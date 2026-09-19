import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR16, materializedR16Output } from './materialize-ctrl-g24-trusted-ingress-r16.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r16.json'
const read = p => readFileSync(join(root, p), 'utf8')
const sha = p => createHash('sha256').update(read(p)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []

function exactClosed(schema) {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
function forbiddenHits(value, forbidden, pathValue = '$', hits = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => forbiddenHits(item, forbidden, `${pathValue}[${index}]`, hits))
    return hits
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      for (const token of forbidden) {
        let cursor = value.indexOf(token)
        while (cursor >= 0) {
          const suffix = value.slice(cursor + token.length)
          const allowedPredecessorRef = token === 'predecessor_lifecycle_version' && suffix.startsWith('_ref')
          if (!allowedPredecessorRef) hits.push(`${pathValue}:${token}`)
          cursor = value.indexOf(token, cursor + token.length)
        }
      }
    }
    return hits
  }
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.includes(key)) hits.push(`${pathValue}.${key}:${key}`)
    forbiddenHits(item, forbidden, `${pathValue}.${key}`, hits)
  }
  return hits
}
function lifecycleClosureHits(c) {
  const clone = structuredClone(c)
  const forbidden = [...clone.lifecycle_vocabulary_contract.forbidden_exact_tokens]
  clone.lifecycle_vocabulary_contract.forbidden_exact_tokens = []
  return forbiddenHits(clone, forbidden)
}
function collect(c) {
  const f = []
  const ok = (name, value) => { if (!value) f.push(name) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r16.effective.v1' && c.materialization.frozen_input.sha256 === '66b5c9c8fcfe61a12ebbf07ec465990745d731e22fe8b4ea67a86453d515b0d2')
  ok('public ABI preserved', same(c.request_schema.properties.operation_class.values, c.operation_names) && c.operation_names.length === 20 && c.operation_names.every(name => c.operation_specs[name]?.result_schema === c.result_payload_schemas[name]?.schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name]?.schema_version))

  const blobStore = c.operation_result_blob_store
  const blob = blobStore.row_schema
  const blobFields = [
    'workspace_ref', 'canonical_result_payload_bytes_ref', 'result_schema_version',
    'canonical_result_payload_b64url', 'canonical_result_payload_byte_length',
    'canonical_result_payload_bytes_sha256', 'result_blob_fingerprint', 'committed_at',
  ]
  ok('canonical result blob closed', blobStore.one_row_per_reference === true && blobStore.mutation_or_rebinding === 'forbidden' && exactClosed(blob) && same(Object.keys(blob.properties), blobFields) && same(blob.unique_keys, [['workspace_ref', 'canonical_result_payload_bytes_ref']]) && blob.properties.canonical_result_payload_b64url.max_decoded_bytes === 1048576 && blob.properties.canonical_result_payload_byte_length.maximum === 1048576)
  ok('canonical result blob content verified', same(blob.conditional_rules, [
    'decoded_b64url_length_equals_canonical_result_payload_byte_length',
    'sha256_of_exact_decoded_bytes_equals_canonical_result_payload_bytes_sha256',
    'decoded_bytes_are_exact_canonical_json_for_result_schema_version',
    'result_blob_fingerprint_equals_recomputed_complete_blob_preimage',
  ]) && blob.fingerprint_ref === 'fingerprint_schemas.operation_result_blob' && same(c.fingerprint_schemas.operation_result_blob.preimage_order.slice(1), blobFields.filter(field => field !== 'result_blob_fingerprint')))

  const success = c.operation_registry.committed_success_row_schema
  ok('committed success complete fingerprint', exactClosed(success) && success.properties.canonical_result_payload_bytes_sha256 && success.properties.committed_success_fingerprint && success.fingerprint_ref === 'fingerprint_schemas.operation_registry_committed_success' && same(c.fingerprint_schemas.operation_registry_committed_success.preimage_order.slice(1), Object.keys(success.properties).filter(field => field !== 'committed_success_fingerprint')))
  ok('committed success conditional authority exact', same(success.conditional_rules, [
    'operation_class_use_release_iff_successful_result_branch_and_result_ref_are_nonnull_and_exactly_derived_by_release_terminal_consumption_branch_table',
    'non_use_release_successful_result_branch_is_null',
    'canonical_result_payload_bytes_ref_resolves_exactly_one_operation_result_blob_in_the_same_workspace',
    'result_schema_version_and_canonical_result_payload_bytes_sha256_equal_the_resolved_blob',
    'result_payload_fingerprint_is_recomputed_from_the_exact_decoded_canonical_blob_bytes_under_result_schema_version',
    'committed_success_fingerprint_equals_recomputed_complete_success_preimage',
  ]))
  ok('one canonical operation result registry', !Object.hasOwn(c, 'operation_registry_committed_success_schema') && c.operation_registry.canonical_committed_success_schema_ref === 'operation_registry.committed_success_row_schema' && same(c.operation_registry.unique_key, ['workspace_ref', 'operation_id']))
  ok('result blob derivation exact', same(c.operation_registry.committed_success_result_blob_derivation, {
    blob_schema_ref: 'operation_result_blob_store.row_schema',
    exact_equalities: [
      'success.workspace_ref_equals_blob.workspace_ref',
      'success.canonical_result_payload_bytes_ref_equals_blob.canonical_result_payload_bytes_ref',
      'success.result_schema_version_equals_blob.result_schema_version',
      'success.canonical_result_payload_bytes_sha256_equals_blob.canonical_result_payload_bytes_sha256',
      'success.result_payload_fingerprint_equals_recomputed_domain_fingerprint_of_blob.decoded_canonical_result_payload_bytes',
    ],
    commit_atomicity: 'result_blob_and_committed_success_row_commit_in_one_serializable_transaction_or_neither_exists',
    any_missing_duplicate_hash_length_schema_parse_or_fingerprint_mismatch: 'operation_commits_hold_without_success_or_protected_effect',
  }))
  const releaseRecords = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
  ok('release proof resolves exact bytes', releaseRecords.length === 2 && releaseRecords[0].schema_ref === 'operation_registry.committed_success_row_schema' && same(releaseRecords[1], {
    record_name: 'use_release_result_blob', schema_ref: 'operation_result_blob_store.row_schema',
    joins: [
      ['use_release_committed_success.workspace_ref', 'record.workspace_ref'],
      ['use_release_committed_success.canonical_result_payload_bytes_ref', 'record.canonical_result_payload_bytes_ref'],
      ['use_release_committed_success.result_schema_version', 'record.result_schema_version'],
      ['use_release_committed_success.canonical_result_payload_bytes_sha256', 'record.canonical_result_payload_bytes_sha256'],
      ['use_release_committed_success.result_payload_fingerprint', 'recomputed_branch_domain_fingerprint_of_record.decoded_canonical_result_payload_bytes'],
    ],
  }) && c.release_terminal_consumption_derivation.canonical_result_payload_bytes_rule.startsWith('resolve_exactly_one_same_workspace_operation_result_blob'))

  const binding = c.case_authority_bindings
  const caseFields = [
    'workspace_ref', 'subject_ref', 'case_ref', 'case_authority_binding_ref', 'named_leader_ref',
    'engagement_operator_ref', 'operator_grant_set_seal', 'workload_grant_set_seal', 'authority_version',
    'case_authority_binding_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint',
  ]
  ok('case authority scoped row exact', exactClosed(binding) && same(Object.keys(binding.properties), caseFields) && binding.append_only === true && same(binding.partition_key, ['workspace_ref', 'subject_ref', 'case_ref']) && same(binding.unique_keys, [
    ['workspace_ref', 'case_ref', 'case_authority_binding_ref'],
    ['workspace_ref', 'case_ref', 'authority_version'],
  ]) && binding.current_selection_unique_or_hold === true)
  ok('case authority semantic and envelope identity', binding.semantic_fingerprint_ref === 'fingerprint_schemas.case_authority_binding' && binding.fingerprint_ref === 'fingerprint_schemas.case_authority_binding_row_envelope' && same(c.fingerprint_schemas.case_authority_binding.preimage_order.slice(1), caseFields.slice(0, 9)) && same(c.fingerprint_schemas.case_authority_binding_row_envelope.preimage_order.slice(1), caseFields.filter(field => field !== 'row_envelope_fingerprint')))
  ok('case identity resolves unique current authority', c.case_identity_derivation.source_authorities[0] === 'exact_unique_current_case_authority_bindings_row_in_same_workspace_subject_case_and_snapshot' && c.case_identity_derivation.exact_byte_equalities.includes('case_identities.workspace_ref_subject_ref_equal_case_authority_bindings.workspace_ref_subject_ref') && c.case_identity_derivation.exact_byte_equalities.includes('case_authority_bindings_is_the_unique_current_row_for_workspace_ref_subject_ref_case_ref_at_the_same_snapshot') && c.case_identity_derivation.freshness.includes('unique_current_scoped_row'))

  const evaluator = c.lifecycle_evaluator_version_derivation
  ok('evaluator result version and artifact exact', same(evaluator.evidence_equalities, [
    'every_lifecycle_precondition_evidence.evaluator_version_ref_equals_its_evaluator_semantic_version_and_exact_current_registry_member.semantic_version',
    'every_lifecycle_precondition_evidence.evaluator_artifact_sha256_equals_exact_current_registry_member.artifact_sha256',
  ]) && same(evaluator.result_equalities, [
    'evaluate_lifecycle_preconditions.result.evaluator_version_ref_equals_every_written_evidence_row.evaluator_version_ref_and_exact_current_registry_member.semantic_version',
    'evaluate_lifecycle_preconditions.result.evaluator_artifact_sha256_equals_every_written_evidence_row.evaluator_artifact_sha256_and_exact_current_registry_member.artifact_sha256',
  ]) && c.operation_specs.evaluate_lifecycle_preconditions.atomic_equalities.includes('result_evaluator_version_ref_and_evaluator_artifact_sha256_equal_every_written_evidence_row_and_the_exact_current_evaluator_registry_member'))

  const vocabulary = c.lifecycle_vocabulary_contract
  ok('whole document lifecycle closure', vocabulary.closure_scope === 'entire_materialized_effective_document_after_removing_only_this_forbidden_token_literal_array' && vocabulary.no_manual_active_root_allowlist === true && vocabulary.any_forbidden_token_outside_literal_declaration === 'contract_invalid' && lifecycleClosureHits(c).length === 0)
  const twoParty = c.derived_authority_predicates.current_unconsumed_two_party_receipt_exact_case_actors_transition_and_predecessor
  ok('two-party predicate canonical', twoParty.includes('recompute_and_match_both_action_receipt_fingerprints') && twoParty.includes('recompute_and_match_authority_receipt_fingerprint') && twoParty.includes('exact_case_transition_and_predecessor_lifecycle_version_ref_match'))

  const table = c.outbox.provider_call_gate.final_recheck_outcome_table
  const expectedRows = [
    { priority: 1, guard: 'terminal_or_reaper_successor_exists', action: 'do_not_append_do_not_call_return_committed_successor', actor: 'current_worker_or_reaper' },
    { priority: 2, guard: 'invocation_tip_superseded_and_no_terminal_or_reaper_successor', action: 'do_not_append_do_not_call_reload_current_tip', actor: 'current_worker_or_reaper' },
    { priority: 3, guard: 'lease_expired_and_invocation_tip_still_current_and_no_successor', action: 'append_lease_expiry_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'workload_outbox_lease_reaper' },
    { priority: 4, guard: 'lease_live_and_claim_fence_changed_and_invocation_tip_still_current_and_no_successor', action: 'do_not_append_do_not_call_leave_resolution_to_current_owner', actor: 'superseded_worker' },
    { priority: 5, guard: 'lease_live_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor', action: 'append_worker_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'current_fenced_claim_worker' },
    { priority: 6, guard: 'current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_one_nonlease_authority_payload_registry_or_budget_recheck_failed_and_invocation_tip_still_current_and_no_successor', action: 'append_invocation_aborted_before_provider', actor: 'current_fenced_claim_worker' },
    { priority: 7, guard: 'all_rechecks_pass_and_current_fenced_worker_and_lease_live_and_invocation_tip_current_and_no_successor_and_capability_unconsumed', action: 'atomically_consume_single_use_process_capability_then_call_provider_once', actor: 'current_fenced_claim_worker' },
  ]
  ok('provider outcome table exact', same(table.rows, expectedRows) && table.evaluation.startsWith('first_matching_priority_ascending') && table.exclusivity.includes('first_match') && table.exhaustiveness.includes('every_snapshot') && table.append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot === true)
  const expectedAuthorization = {
    exact_append_rows: [
      { priority: 3, event_kind: 'lease_expiry_ambiguity', actor: 'workload_outbox_lease_reaper', transition: 'invoking_to_ambiguous' },
      { priority: 5, event_kind: 'worker_ambiguity', actor: 'current_fenced_claim_worker', transition: 'invoking_to_ambiguous' },
      { priority: 6, event_kind: 'invocation_aborted_before_provider', actor: 'current_fenced_claim_worker', transition: 'invoking_to_failed' },
    ],
    provider_call_row: { priority: 7, actor: 'current_fenced_claim_worker', capability_consumption: 'same_atomic_boundary_immediately_before_single_provider_call' },
    rule: 'no_transition_or_provider_call_is_authorized_by_a_raw_guard_alone; the_same_snapshot_must_select_the_exact_outcome_row_and_every_append_must_compare_and_swap_the_unchanged_current_tip',
  }
  ok('provider transition authorization exact', same(c.outbox.provider_call_gate.transition_authorization_derivation, expectedAuthorization))
  const invokingTransitions = c.outbox.transition_table.filter(row => row.from === 'invoking')
  const aborts = invokingTransitions.filter(row => row.event_kind === 'invocation_aborted_before_provider')
  const workerAmbiguity = invokingTransitions.find(row => row.event_kind === 'worker_ambiguity')
  const reaperAmbiguity = invokingTransitions.find(row => row.event_kind === 'lease_expiry_ambiguity')
  ok('expired invocation has one authority', aborts.length === 1 && aborts[0].condition === 'selected_final_recheck_priority_6_and_current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_one_named_nonlease_final_recheck_failed_and_invocation_tip_still_current_and_no_successor' && workerAmbiguity.condition === 'selected_final_recheck_priority_5_and_lease_live_and_current_fenced_claim_worker_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor' && reaperAmbiguity.condition === 'selected_final_recheck_priority_3_and_lease_expired_and_invocation_tip_still_current_and_no_successor')
  ok('reaper cannot claim no-call abort', same(c.outbox.actor_authority.abort_before_provider, ['current_fenced_claim_worker_for_selected_priority_6_current_tip_live_lease_unconsumed_capability_zero_provider_call_and_nonlease_recheck_failure']))

  ok('derived changes', c.schema_change_manifest.derivation.includes('frozen_R15') && c.schema_change_manifest.dependency_parity_checks.length === 5 && c.schema_change_manifest.changes.length >= 7 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r16.')))
  return f
}

if (read(path) !== materializedR16Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r15.json') !== '66b5c9c8fcfe61a12ebbf07ec465990745d731e22fe8b4ea67a86453d515b0d2') failures.push('frozen R15 changed')
for (const failure of collect(materializedR16)) failures.push(failure)

const mutations = [
  ['result blob row opened', c => { c.operation_result_blob_store.row_schema.additional_properties = true }],
  ['result blob reference not unique', c => { c.operation_result_blob_store.row_schema.unique_keys = [] }],
  ['result blob bytes absent', c => { delete c.operation_result_blob_store.row_schema.properties.canonical_result_payload_b64url }],
  ['result blob length rule erased', c => { c.operation_result_blob_store.row_schema.conditional_rules = c.operation_result_blob_store.row_schema.conditional_rules.filter(rule => !rule.includes('length_equals')) }],
  ['result blob hash rule erased', c => { c.operation_result_blob_store.row_schema.conditional_rules = c.operation_result_blob_store.row_schema.conditional_rules.filter(rule => !rule.startsWith('sha256')) }],
  ['result blob schema parse erased', c => { c.operation_result_blob_store.row_schema.conditional_rules = c.operation_result_blob_store.row_schema.conditional_rules.filter(rule => !rule.includes('canonical_json')) }],
  ['success envelope fingerprint absent', c => { delete c.operation_registry.committed_success_row_schema.properties.committed_success_fingerprint }],
  ['success conditional rules erased', c => { c.operation_registry.committed_success_row_schema.conditional_rules = [] }],
  ['success blob hash equality spliced', c => { c.operation_registry.committed_success_result_blob_derivation.exact_equalities[3] = 'success.operation_id_equals_blob.canonical_result_payload_bytes_ref' }],
  ['success and blob not atomic', c => { c.operation_registry.committed_success_result_blob_derivation.commit_atomicity = 'eventually_consistent' }],
  ['release blob join omitted', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records.pop() }],
  ['release blob content hash join spliced', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[1].joins[3][1] = 'record.result_blob_fingerprint' }],
  ['case authority workspace removed', c => { delete c.case_authority_bindings.properties.workspace_ref }],
  ['case authority current selection removed', c => { c.case_authority_bindings.current_selection_unique_or_hold = false }],
  ['case authority partition unscoped', c => { c.case_authority_bindings.partition_key = ['case_ref'] }],
  ['case identity current source arbitrary', c => { c.case_identity_derivation.source_authorities[0] = 'any_case_authority_binding' }],
  ['evaluator result artifact unbound', c => { c.lifecycle_evaluator_version_derivation.result_equalities = c.lifecycle_evaluator_version_derivation.result_equalities.filter(rule => !rule.includes('artifact')) }],
  ['evaluator operation artifact equality erased', c => { c.operation_specs.evaluate_lifecycle_preconditions.atomic_equalities.pop() }],
  ['legacy lifecycle token inserted in proof map', c => { c.proof_authority.proof_family_resolution_map.lifecycle.cross_row_equalities.push(['leader_action_ref', 'owner.leader_action_receipt_ref']) }],
  ['whole-document lifecycle scope weakened', c => { c.lifecycle_vocabulary_contract.no_manual_active_root_allowlist = false }],
  ['two-party lifecycle predicate stale', c => { c.derived_authority_predicates.current_unconsumed_two_party_receipt_exact_case_actors_transition_and_predecessor[1] = 'recompute_and_match_both_action_fingerprints' }],
  ['expired invocation routed to abort', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[2].action = 'append_invocation_aborted_before_provider' }],
  ['expired invocation actor changed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[2].actor = 'current_fenced_claim_worker' }],
  ['terminal outcome calls twice', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[0].action = 'call_provider_twice_without_capability' }],
  ['reaper ambiguity transition broadened', c => { c.outbox.transition_table.find(row => row.event_kind === 'lease_expiry_ambiguity').condition = 'always' }],
  ['worker ambiguity allowed after expiry', c => { c.outbox.transition_table.find(row => row.event_kind === 'worker_ambiguity').condition = 'selected_priority_5_any_lease' }],
  ['reaper no-call abort restored', c => { c.outbox.transition_table.push({ ...c.outbox.transition_table.find(row => row.event_kind === 'invocation_aborted_before_provider'), condition: 'lease_expired' }) }],
  ['transition authorization detached', c => { c.outbox.provider_call_gate.transition_authorization_derivation.exact_append_rows = [] }],
  ['provider outcome CAS removed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot = false }],
  ['version semantic checks erased', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR16)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R16 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R16 and ${mutations.length} mutation probes verified`)
console.log(`r16_machine_sha256=${sha(path)}`)
