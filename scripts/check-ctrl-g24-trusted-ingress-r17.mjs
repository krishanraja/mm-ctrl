import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR17, materializedR17Output } from './materialize-ctrl-g24-trusted-ingress-r17.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r17.json'
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
    if (typeof value === 'string') for (const token of forbidden) {
      let cursor = value.indexOf(token)
      while (cursor >= 0) {
        const suffix = value.slice(cursor + token.length)
        const allowedPredecessorRef = token === 'predecessor_lifecycle_version' && suffix.startsWith('_ref') && !/^[A-Za-z0-9]/.test(suffix.slice(4, 5))
        if (!allowedPredecessorRef) hits.push(`${pathValue}:${token}`)
        cursor = value.indexOf(token, cursor + token.length)
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
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r17.effective.v1' && c.materialization.frozen_input.sha256 === '479f3011d7250861fb8ec6472e43dafffa210be9c6a419e72767246e26ae516f')
  ok('public ABI preserved', c.operation_names.length === 20 && same(c.request_schema.properties.operation_class.values, c.operation_names) && c.operation_names.every(name => c.operation_specs[name].result_schema === c.result_payload_schemas[name].schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name].schema_version))

  const canonical = c.canonical_json_utf8_encoding
  ok('one exact JSON byte authority', canonical.authority_ref === 'canonical_grammar' && canonical.object_key_order === c.canonical_grammar.object_keys && canonical.arrays === c.canonical_grammar.arrays && canonical.escaping === c.canonical_grammar.escaping && canonical.insignificant_whitespace === false && canonical.utf8 === 'valid_unicode_scalar_utf8_without_bom' && canonical.byte_equality.includes('byte_for_byte') && canonical.fingerprint_framing_included === false)
  ok('both blob stores use JSON byte authority', c.operation_result_blob_store.canonicalization_ref === 'canonical_json_utf8_encoding' && c.operation_response_blob_store.canonicalization_ref === 'canonical_json_utf8_encoding')

  const result = c.operation_result_blob_store.row_schema
  const resultFields = ['workspace_ref', 'canonical_result_payload_bytes_ref', 'operation_class', 'exported_result_schema_version', 'selected_result_schema_version', 'successful_result_branch', 'canonical_result_payload_b64url', 'canonical_result_payload_byte_length', 'canonical_result_payload_bytes_sha256', 'result_payload_fingerprint', 'result_blob_fingerprint', 'committed_at']
  ok('result blob exact', exactClosed(result) && same(Object.keys(result.properties), resultFields) && same(result.unique_keys, [['workspace_ref', 'canonical_result_payload_bytes_ref']]) && result.conditional_rules.length === 6 && result.conditional_rules.some(rule => rule.includes('operation_result_schema_derivation')))
  ok('universal result fingerprint exact', same(c.fingerprint_schemas.operation_result_payload.preimage_order.slice(1), ['workspace_ref', 'operation_class', 'exported_result_schema_version', 'selected_result_schema_version', 'successful_result_branch', 'canonical_result_payload_bytes_sha256']))
  ok('export and selected schema derivation exact', c.operation_result_schema_derivation.exported_schema_source === 'evaluator_abi.operation_result_exports[operation_class]' && same(c.operation_result_schema_derivation.selected_schema_rules.use_release, Object.fromEntries(Object.entries(c.result_payload_schemas.use_release.variants).map(([branch, schema]) => [branch, schema.schema_version]))) && c.operation_result_schema_derivation.selected_schema_rules.every_other_operation.includes('selected_result_schema_version_equals_exported_result_schema_version'))

  const response = c.operation_response_blob_store.row_schema
  const responseFields = ['workspace_ref', 'canonical_response_bytes_ref', 'response_schema_version', 'canonical_response_b64url', 'canonical_response_byte_length', 'canonical_response_bytes_sha256', 'response_fingerprint', 'response_blob_fingerprint', 'committed_at']
  ok('response blob exact', exactClosed(response) && same(Object.keys(response.properties), responseFields) && same(response.unique_keys, [['workspace_ref', 'canonical_response_bytes_ref']]) && response.conditional_rules.length === 6 && response.conditional_rules[0] === 'response_schema_version_equals_response_union_schemas_committed_schema_version')
  const responseSchema = c.response_union.schemas.committed
  ok('committed response versioned and typed', responseSchema.schema_version === 'ctrl.g24.response.committed.r17.v1' && exactClosed(responseSchema) && responseSchema.properties.exported_result_schema_version && responseSchema.properties.selected_result_schema_version && !responseSchema.properties.result_schema_version)

  const success = c.operation_registry.committed_success_row_schema
  ok('success binds both blobs and schemas', exactClosed(success) && success.properties.exported_result_schema_version && success.properties.selected_result_schema_version && success.properties.canonical_result_payload_bytes_sha256 && success.properties.canonical_response_bytes_sha256 && !success.properties.result_schema_version && success.conditional_rules.includes('result_blob_and_response_blob_fields_equal_the_committed_success_derivations'))
  const derivation = c.operation_registry.committed_success_blob_derivation
  ok('atomic three-record derivation', derivation.result_blob_schema_ref === 'operation_result_blob_store.row_schema' && derivation.response_blob_schema_ref === 'operation_response_blob_store.row_schema' && derivation.exact_result_equalities.length === 8 && derivation.exact_response_equalities.length === 5 && derivation.decoded_response_field_equalities.length === 10 && derivation.commit_atomicity === 'result_blob_response_blob_and_committed_success_row_commit_in_one_serializable_transaction_or_none_exists' && !c.operation_registry.committed_success_result_blob_derivation)
  ok('response content equals result and success', derivation.decoded_response_field_equalities.includes('response.result_payload_b64url_equals_result_blob.canonical_result_payload_b64url') && derivation.decoded_response_field_equalities.includes('response.committed_at_equals_success.committed_at_and_both_blobs.committed_at'))

  const control = c.case_authority_control_plane
  ok('sole case authority writer', control.producer === 'database_procedure.rotate_case_authority_binding_r17' && control.sole_runtime_writer_role === 'ctrl_case_authority_control_plane' && control.execution_mode === 'security_definer_with_fixed_search_path' && exactClosed(control.request_schema) && same(control.idempotency_key, ['workspace_ref', 'case_ref', 'control_operation_id']))
  ok('case rotation atomic CAS', control.transaction.includes('serializable_transaction_and_advisory_lock_on_workspace_subject_case') && control.transaction.includes('compare_and_swap_current_row_version_and_envelope_fingerprint_unchanged_before_commit') && control.transaction.includes('write_one_idempotent_control_receipt_or_rollback_every_write'))
  ok('case direct DML denied', control.privilege_contract.case_authority_table_insert_update === 'only_ctrl_case_authority_control_plane_role' && control.privilege_contract.application_edge_worker_browser_and_generic_service_roles === 'no_insert_update_delete_or_truncate' && control.privilege_contract.direct_dml === 'forbidden_even_to_the_procedure_caller' && c.case_authority_bindings.writer_authority_ref === 'case_authority_control_plane' && c.case_authority_bindings.direct_dml === 'forbidden')

  const worker = c.outbox.worker_ambiguity_evidence_schema
  const lease = c.outbox.lease_expiry_ambiguity_evidence_schema
  ok('ambiguity schemas split', !c.outbox.ambiguity_evidence_schema && exactClosed(worker) && exactClosed(lease) && worker.properties.ambiguity_reason.const === 'worker_reported_unknown_outcome' && lease.properties.ambiguity_reason.const === 'dispatch_lease_expired_without_terminal_evidence')
  ok('ambiguity recorders exact', worker.conditional_rules[0] === 'recorder_ref_equals_worker_ref_and_the_current_fenced_claim_worker_stable_workload_ref' && lease.conditional_rules[0] === 'recorder_ref_equals_the_authenticated_current_workload_outbox_lease_reaper_stable_workload_ref')
  const wt = c.outbox.transition_table.find(row => row.event_kind === 'worker_ambiguity')
  const lt = c.outbox.transition_table.find(row => row.event_kind === 'lease_expiry_ambiguity')
  ok('ambiguity transitions use distinct evidence', wt.event_schema_ref === 'outbox.worker_ambiguity_evidence_schema' && lt.event_schema_ref === 'outbox.lease_expiry_ambiguity_evidence_schema' && wt.actor_authority_ref !== lt.actor_authority_ref)
  const te = c.outbox.transition_event_schema
  ok('transition persists actor authority', exactClosed(te) && te.properties.actor_class && te.properties.actor_ref && te.conditional_rules.length === 3 && te.conditional_rules[2].includes('selected_transition_actor_authority_ref') && same(c.fingerprint_schemas.outbox_transition_event.preimage_order.slice(1), Object.keys(te.properties).filter(field => field !== 'event_fingerprint')))

  const failureSet = c.outbox.provider_call_gate.nonlease_final_recheck_failure_set
  const expectedFailures = ['operation_authority_changed', 'payload_changed', 'provider_registry_changed', 'capability_invalid_but_unconsumed', 'reservation_budget_invalid']
  ok('closed nonlease failure set', failureSet.closed === true && same(failureSet.values, expectedFailures) && same(Object.keys(failureSet.derivation), expectedFailures) && failureSet.empty_set === 'priority_6_does_not_match' && failureSet.unknown_member === 'contract_invalid')
  const abort = c.outbox.invocation_aborted_before_provider_schema
  ok('abort carries exact failure set', same(abort.properties.abort_reason.values, expectedFailures) && same(abort.properties.failed_nonlease_final_recheck_codes.items.values, expectedFailures) && abort.properties.failed_nonlease_final_recheck_codes.min_items === 1 && abort.properties.abort_actor_class.const === 'current_fenced_claim_worker' && abort.conditional_rules[1].includes('exact_nonempty_set'))
  const table = c.outbox.provider_call_gate.final_recheck_outcome_table
  ok('provider priority six exact', table.rows[5].guard.includes('at_least_one_closed_nonlease_final_recheck_failure_set_member_failed') && table.rows[5].action.includes('exact_nonempty_failed_nonlease_final_recheck_code_set') && table.rows[6].guard.startsWith('closed_complement_of_priorities_1_through_6') && table.exhaustiveness.includes('exactly_one_first_row'))
  ok('provider transition selected actor exact', same(c.outbox.provider_call_gate.transition_authorization_derivation.exact_append_rows.map(row => [row.priority, row.event_kind, row.actor]), [[3, 'lease_expiry_ambiguity', 'workload_outbox_lease_reaper'], [5, 'worker_ambiguity', 'current_fenced_claim_worker'], [6, 'invocation_aborted_before_provider', 'current_fenced_claim_worker']]) && c.outbox.provider_call_gate.transition_authorization_derivation.exact_append_rows[2].required_payload === 'exact_nonempty_failed_nonlease_final_recheck_code_set')

  ok('release proof joins schema identity and content', c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[1].joins.length === 8 && c.release_terminal_consumption_derivation.operation_result_schema_derivation_ref === 'operation_result_schema_derivation' && c.release_terminal_consumption_derivation.canonical_result_payload_bytes_rule.includes('selected_branch_schema'))
  ok('whole document lifecycle closure with strict ref boundary', lifecycleClosureHits(c).length === 0)
  ok('derived changes exact', c.schema_change_manifest.derivation.includes('frozen_R16') && c.schema_change_manifest.dependency_parity_checks.length === 6 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r17.')))
  return f
}

if (read(path) !== materializedR17Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r16.json') !== '479f3011d7250861fb8ec6472e43dafffa210be9c6a419e72767246e26ae516f') failures.push('frozen R16 changed')
for (const failure of collect(materializedR17)) failures.push(failure)

const mutations = [
  ['JSON byte authority reframed', c => { c.canonical_json_utf8_encoding.fingerprint_framing_included = true }],
  ['result blob wrong canonicalizer', c => { c.operation_result_blob_store.canonicalization_ref = 'canonical_field_encoding' }],
  ['result operation class removed', c => { delete c.operation_result_blob_store.row_schema.properties.operation_class }],
  ['exported schema removed', c => { delete c.operation_result_blob_store.row_schema.properties.exported_result_schema_version }],
  ['selected schema removed', c => { delete c.operation_result_blob_store.row_schema.properties.selected_result_schema_version }],
  ['use release mapping changed', c => { c.operation_result_schema_derivation.selected_schema_rules.use_release.pending_delivery = 'wrong' }],
  ['universal result fingerprint weakened', c => { c.fingerprint_schemas.operation_result_payload.preimage_order.pop() }],
  ['response blob opened', c => { c.operation_response_blob_store.row_schema.additional_properties = true }],
  ['response blob nonunique', c => { c.operation_response_blob_store.row_schema.unique_keys = [] }],
  ['response schema unversioned', c => { delete c.response_union.schemas.committed.schema_version }],
  ['response selected schema removed', c => { delete c.response_union.schemas.committed.properties.selected_result_schema_version }],
  ['success response hash removed', c => { delete c.operation_registry.committed_success_row_schema.properties.canonical_response_bytes_sha256 }],
  ['success result hash removed', c => { delete c.operation_registry.committed_success_row_schema.properties.canonical_result_payload_bytes_sha256 }],
  ['three record atomicity weakened', c => { c.operation_registry.committed_success_blob_derivation.commit_atomicity = 'eventually_consistent' }],
  ['response bytes detached', c => { c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.splice(5, 1) }],
  ['case writer made generic', c => { c.case_authority_control_plane.sole_runtime_writer_role = 'service_role' }],
  ['case writer direct DML allowed', c => { c.case_authority_control_plane.privilege_contract.direct_dml = 'allowed' }],
  ['case CAS removed', c => { c.case_authority_control_plane.transaction = c.case_authority_control_plane.transaction.filter(rule => !rule.startsWith('compare_and_swap')) }],
  ['case idempotency unscoped', c => { c.case_authority_control_plane.idempotency_key = ['control_operation_id'] }],
  ['worker ambiguity reason broadened', c => { c.outbox.worker_ambiguity_evidence_schema.properties.ambiguity_reason = { type: 'identifier' } }],
  ['lease recorder made arbitrary', c => { c.outbox.lease_expiry_ambiguity_evidence_schema.conditional_rules[0] = 'any_recorder' }],
  ['ambiguity schemas recombined', c => { c.outbox.ambiguity_evidence_schema = c.outbox.worker_ambiguity_evidence_schema }],
  ['worker transition uses lease schema', c => { c.outbox.transition_table.find(row => row.event_kind === 'worker_ambiguity').event_schema_ref = 'outbox.lease_expiry_ambiguity_evidence_schema' }],
  ['transition actor omitted', c => { delete c.outbox.transition_event_schema.properties.actor_ref }],
  ['transition actor rule removed', c => { c.outbox.transition_event_schema.conditional_rules.pop() }],
  ['failure set opened', c => { c.outbox.provider_call_gate.nonlease_final_recheck_failure_set.closed = false }],
  ['failure set unknown added', c => { c.outbox.provider_call_gate.nonlease_final_recheck_failure_set.values.push('anything_failed') }],
  ['abort empty failures allowed', c => { c.outbox.invocation_aborted_before_provider_schema.properties.failed_nonlease_final_recheck_codes.min_items = 0 }],
  ['priority six ambiguous one failure wording restored', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[5].guard = 'one_nonlease_failure' }],
  ['priority seven not complement', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[6].guard = 'all_rechecks_pass' }],
  ['release selected schema join removed', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[1].joins.splice(4, 1) }],
  ['predecessor reference spoofed', c => { c.case_identity_derivation.freshness += '_predecessor_lifecycle_version_reference' }],
  ['schema manifest erased', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR17)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R17 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R17 and ${mutations.length} mutation probes verified`)
console.log(`r17_machine_sha256=${sha(path)}`)
