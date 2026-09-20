import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR18, materializedR18Output } from './materialize-ctrl-g24-trusted-ingress-r18.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r18.json'
const read = p => readFileSync(join(root, p), 'utf8')
const sha = p => createHash('sha256').update(read(p)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []
const exactClosed = schema => {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
const closedResolvable = schema => {
  const properties = Object.keys(schema?.properties ?? {})
  return schema?.type === 'object' && schema.additional_properties === false && properties.length > 0 && same([...schema.exact_keys].sort(), [...properties].sort()) && (schema.required ?? []).every(field => properties.includes(field))
}
function resolveRef(c, ref) {
  let value = c
  for (const part of ref.split('.')) value = value?.[part]
  return value
}
function strictLifecycleHits(value, forbidden, pathValue = '$', hits = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => strictLifecycleHits(item, forbidden, `${pathValue}[${index}]`, hits))
    return hits
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') for (const token of forbidden) {
      let cursor = value.indexOf(token)
      while (cursor >= 0) {
        const tail = value.slice(cursor + token.length)
        const exactPredecessorRef = token === 'predecessor_lifecycle_version' && tail.startsWith('_ref') && !/[A-Za-z0-9_]/.test(tail.slice(4, 5))
        if (!exactPredecessorRef) hits.push(`${pathValue}:${token}`)
        cursor = value.indexOf(token, cursor + token.length)
      }
    }
    return hits
  }
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.includes(key)) hits.push(`${pathValue}.${key}:${key}`)
    strictLifecycleHits(item, forbidden, `${pathValue}.${key}`, hits)
  }
  return hits
}
function lifecycleClosureHits(c) {
  const clone = structuredClone(c)
  const forbidden = [...clone.lifecycle_vocabulary_contract.forbidden_exact_tokens]
  clone.lifecycle_vocabulary_contract.forbidden_exact_tokens = []
  return strictLifecycleHits(clone, forbidden)
}
function declaredReferenceFailures(c) {
  const found = []
  const release = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
  const aliases = {
    release_authority_terminal_consumptions: c.authoritative_row_schemas.release_authority_terminal_consumptions,
    use_release_committed_success: c.operation_registry.committed_success_row_schema,
  }
  for (const record of release) {
    const schema = resolveRef(c, record.schema_ref)
    if (!closedResolvable(schema)) { found.push(`unresolved_or_open:${record.schema_ref}`); continue }
    for (const [left, right] of record.joins) {
      const [leftAlias, leftField] = left.split('.')
      const [, rightField] = right.split('.')
      if (!aliases[leftAlias]?.properties?.[leftField]) found.push(`left:${left}`)
      if (right.split('.')[0] !== 'record' || !schema.properties[rightField]) found.push(`right:${record.schema_ref}:${right}`)
    }
  }
  for (const [kind, binding] of Object.entries(c.outbox.payload_binding_map)) {
    const schema = resolveRef(c, binding.payload_schema_ref)
    if (!closedResolvable(schema)) { found.push(`payload_schema:${kind}`); continue }
    for (const field of [binding.payload_ref_field, binding.payload_fingerprint_field, binding.payload_effect_ref_field]) if (!schema.properties[field]) found.push(`payload_field:${kind}:${field}`)
  }
  for (const transition of c.outbox.transition_table) {
    const schema = resolveRef(c, transition.event_schema_ref)
    if (!closedResolvable(schema)) found.push(`transition_schema:${transition.event_kind}`)
    if (transition.event_kind !== 'retry_after_no_invocation' && c.outbox.payload_binding_map[transition.event_kind]?.payload_schema_ref !== transition.event_schema_ref) found.push(`transition_payload_disagreement:${transition.event_kind}`)
  }
  return found
}
function collect(c) {
  const f = []
  const ok = (name, value) => { if (!value) f.push(name) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r18.effective.v1' && c.materialization.frozen_input.sha256 === '2615ccfe048cfccfcc5ae10cc206419d28382295c0c801004638abc7033dfd2e')
  ok('public ABI preserved', c.operation_names.length === 20 && same(c.request_schema.properties.operation_class.values, c.operation_names) && c.operation_names.every(name => c.operation_specs[name].result_schema === c.result_payload_schemas[name].schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name].schema_version))

  const expectedDiscriminated = Object.fromEntries(Object.entries(c.result_payload_schemas).filter(([, schema]) => schema.discriminator).map(([operation, schema]) => [operation, { exported_union_schema_version: schema.schema_version, discriminator: schema.discriminator, variants: Object.fromEntries(Object.entries(schema.variants).map(([branch, variant]) => [branch, variant.schema_version])) }]))
  const expectedPlain = c.operation_names.filter(name => !c.result_payload_schemas[name].discriminator)
  const derivation = c.operation_result_schema_derivation
  ok('complete discriminated inventory', same(derivation.discriminated_results, expectedDiscriminated) && same(Object.keys(expectedDiscriminated), ['approve_intervention', 'use_release']) && same(derivation.non_discriminated_operations, expectedPlain) && derivation.completeness.includes('union_equals_operation_names_exactly'))
  ok('approval variants exact', same(derivation.discriminated_results.approve_intervention?.variants, Object.fromEntries(Object.entries(c.result_payload_schemas.approve_intervention.variants).map(([branch, schema]) => [branch, schema.schema_version]))))
  const allBranches = [...new Set(Object.values(expectedDiscriminated).flatMap(result => Object.keys(result.variants)))]
  ok('branch identity reaches result and success', same(c.operation_result_blob_store.row_schema.properties.successful_result_branch.value_schema.values, allBranches) && same(c.operation_registry.committed_success_row_schema.properties.successful_result_branch.value_schema.values, allBranches) && c.operation_registry.committed_success_row_schema.conditional_rules[1].includes('nonnull_iff'))

  const response = c.response_union.schemas.committed
  const replay = c.response_union.schemas.replayed_committed
  ok('branch identity reaches response and replay', exactClosed(response) && exactClosed(replay) && same(response.properties.successful_result_branch.value_schema.values, allBranches) && same(replay.properties.successful_result_branch.value_schema.values, allBranches) && response.properties.operation_id && replay.properties.operation_id)
  const expectedResponseEqualities = [
    'response.status_equals_committed', 'response.operation_id_equals_success.operation_id', 'response.operation_class_equals_success.operation_class',
    'response.exported_result_schema_version_equals_success.exported_result_schema_version',
    'response.selected_result_schema_version_equals_success.selected_result_schema_version',
    'response.successful_result_branch_equals_success.successful_result_branch',
    'response.result_payload_b64url_equals_result_blob.canonical_result_payload_b64url',
    'response.result_payload_fingerprint_equals_success.result_payload_fingerprint',
    'response.result_payload_byte_length_equals_result_blob.canonical_result_payload_byte_length',
    'response.snapshot_fingerprint_equals_success.snapshot_fingerprint',
    'response.committed_at_equals_success.committed_at_and_both_blobs.committed_at',
  ]
  ok('all committed response equalities exact', same(c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities, expectedResponseEqualities))

  const release = c.release_terminal_consumption_derivation
  ok('release uses selected schema', release.exact_equalities.includes('consumption.terminal_result_schema_version_equals_committed_success.selected_result_schema_version') && !JSON.stringify(release).includes('committed_success.result_schema_version'))
  ok('release has one fingerprint authority', release.exact_equalities.includes('consumption.terminal_result_fingerprint_equals_committed_success.result_payload_fingerprint_equals_resolved_result_blob.result_payload_fingerprint') && release.branch_table.every(row => row.terminal_fingerprint_authority_ref === 'fingerprint_schemas.operation_result_payload' && row.terminal_fingerprint_rule.includes('universal_result_payload_fingerprint') && !row.result_fingerprint_schema_ref))
  const releaseRecords = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
  ok('release proof joins selected schema', same(releaseRecords[0].joins[4], ['release_authority_terminal_consumptions.terminal_result_schema_version', 'record.selected_result_schema_version']) && releaseRecords[1].joins.some(join => same(join, ['use_release_committed_success.selected_result_schema_version', 'record.selected_result_schema_version'])))

  const control = c.case_authority_control_plane
  const exactCaller = 'human_session_actor_class_krish_operator_and_stable_actor_ref_equals_the_exact_current_case_binding_engagement_operator_ref; no_model_workload_browser_edge_or_generic_service_principal_may_call; bootstrap_is_migration_identity_only'
  ok('case caller authority closed', control.caller_authority === exactCaller && control.sole_runtime_writer_role === 'ctrl_case_authority_control_plane')
  ok('case request fingerprinted and no caller time', exactClosed(control.request_schema) && control.request_schema.properties.request_fingerprint && !control.request_schema.properties.requested_valid_from && control.request_schema.fingerprint_ref === 'fingerprint_schemas.case_authority_control_request')
  ok('case rotation append only and server timed', control.transaction.includes('assign_effective_at_from_the_database_transaction_timestamp_strictly_after_current.valid_from_or_hold') && control.transaction.includes('append_one_new_fingerprinted_case_authority_row_with_valid_from_equal_effective_at_and_valid_until_absent_without_updating_any_prior_row') && control.validity_policy.includes('future_scheduling_backdating_and_caller_supplied_validity_are_forbidden') && control.history_policy.includes('never_updated_closed_deleted_or_rewritten'))
  const registry = c.case_authority_control_operation_registry
  ok('case control receipt closed', exactClosed(registry.row_schema) && same(registry.row_schema.unique_keys, [['workspace_ref', 'subject_ref', 'case_ref', 'control_operation_id']]) && registry.row_schema.properties.request_fingerprint && registry.row_schema.properties.prior_row_envelope_fingerprint && registry.row_schema.properties.new_row_envelope_fingerprint)
  ok('case replay and collision exact', registry.replay === 'same_unique_key_and_same_request_fingerprint_returns_the_exact_existing_receipt_without_any_write' && registry.collision === 'same_unique_key_and_different_request_fingerprint_returns_case_authority_control_collision_hold_without_any_write' && registry.concurrent_first_use.includes('one_serializable_winner') && registry.no_receipt_without_binding && registry.no_binding_without_receipt)

  const workerBinding = c.outbox.payload_binding_map.worker_ambiguity
  const leaseBinding = c.outbox.payload_binding_map.lease_expiry_ambiguity
  ok('ambiguity payload refs repaired', workerBinding.payload_schema_ref === 'outbox.worker_ambiguity_evidence_schema' && leaseBinding.payload_schema_ref === 'outbox.lease_expiry_ambiguity_evidence_schema')
  ok('ambiguity actor equals recorder', workerBinding.actor_payload_equality === 'transition_event.actor_ref_equals_payload.recorder_ref_equals_payload.worker_ref' && leaseBinding.actor_payload_equality === 'transition_event.actor_ref_equals_payload.recorder_ref' && c.outbox.transition_event_schema.conditional_rules.includes('for_worker_or_lease_expiry_ambiguity_actor_ref_equals_the_resolved_payload.recorder_ref_byte_for_byte'))
  const wt = c.outbox.transition_table.find(row => row.event_kind === 'worker_ambiguity')
  const lt = c.outbox.transition_table.find(row => row.event_kind === 'lease_expiry_ambiguity')
  ok('ambiguity actor authorities exact', wt.actor_authority_ref === 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome' && lt.actor_authority_ref === 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity')

  ok('declared fields mechanically resolve', declaredReferenceFailures(c).length === 0 && same(c.declared_reference_resolution_contract.scopes, ['proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records', 'outbox.payload_binding_map', 'outbox.transition_table']))
  ok('strict lifecycle exact ref suffix', lifecycleClosureHits(c).length === 0 && c.lifecycle_vocabulary_contract.predecessor_ref_exception === 'only_the_exact_canonical_predecessor_reference_field_is_legal; longer_identifier_extensions_and_similar_spellings_are_invalid')
  ok('R17 byte and provider strengths preserved', c.canonical_json_utf8_encoding.fingerprint_framing_included === false && c.operation_result_blob_store.canonicalization_ref === 'canonical_json_utf8_encoding' && c.operation_response_blob_store.canonicalization_ref === 'canonical_json_utf8_encoding' && c.operation_registry.committed_success_blob_derivation.commit_atomicity.includes('one_serializable_transaction_or_none') && c.outbox.provider_call_gate.nonlease_final_recheck_failure_set.closed === true)
  ok('derived changes exact', c.schema_change_manifest.derivation.includes('frozen_R17') && c.schema_change_manifest.dependency_parity_checks.length === 6 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r18.')))
  return f
}

if (read(path) !== materializedR18Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r17.json') !== '2615ccfe048cfccfcc5ae10cc206419d28382295c0c801004638abc7033dfd2e') failures.push('frozen R17 changed')
for (const failure of collect(materializedR18)) failures.push(failure)

const mutations = [
  ['approval omitted from discriminated inventory', c => { delete c.operation_result_schema_derivation.discriminated_results.approve_intervention }],
  ['approval selected variant spliced', c => { c.operation_result_schema_derivation.discriminated_results.approve_intervention.variants.approved = 'wrong' }],
  ['non-discriminated inventory incomplete', c => { c.operation_result_schema_derivation.non_discriminated_operations.pop() }],
  ['result branches omit approval', c => { c.operation_result_blob_store.row_schema.properties.successful_result_branch.value_schema.values = ['pending_delivery', 'invalidated_before_use'] }],
  ['success branch rule erased', c => { c.operation_registry.committed_success_row_schema.conditional_rules.splice(1, 1) }],
  ['committed response branch removed', c => { delete c.response_union.schemas.committed.properties.successful_result_branch }],
  ['replay retains stale result schema', c => { c.response_union.schemas.replayed_committed.properties.result_schema_version = { type: 'identifier' } }],
  ['response operation ID detached', c => { c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.splice(1, 1) }],
  ['response branch detached', c => { c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.splice(5, 1) }],
  ['release selected schema reverted', c => { c.release_terminal_consumption_derivation.exact_equalities[6] = 'consumption.terminal_result_schema_version_equals_committed_success.result_schema_version' }],
  ['release proof target nonexistent', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0].joins[4][1] = 'record.result_schema_version' }],
  ['release fingerprint branch authority restored', c => { c.release_terminal_consumption_derivation.branch_table[0].result_fingerprint_schema_ref = 'fingerprint_schemas.use_release_pending_delivery_result' }],
  ['release universal fingerprint equality erased', c => { c.release_terminal_consumption_derivation.exact_equalities.splice(8, 1) }],
  ['case caller opened to model', c => { c.case_authority_control_plane.caller_authority = 'any_model_or_service' }],
  ['case caller time restored', c => { c.case_authority_control_plane.request_schema.properties.requested_valid_from = { type: 'canonical_timestamp' } }],
  ['case request fingerprint removed', c => { delete c.case_authority_control_plane.request_schema.properties.request_fingerprint }],
  ['case prior row update restored', c => { c.case_authority_control_plane.transaction[7] = 'close_prior_row_valid_until' }],
  ['case server time removed', c => { c.case_authority_control_plane.transaction = c.case_authority_control_plane.transaction.filter(rule => !rule.startsWith('assign_effective_at')) }],
  ['case backdating allowed', c => { c.case_authority_control_plane.validity_policy = 'caller_supplied' }],
  ['case receipt opened', c => { c.case_authority_control_operation_registry.row_schema.additional_properties = true }],
  ['case receipt request identity removed', c => { delete c.case_authority_control_operation_registry.row_schema.properties.request_fingerprint }],
  ['case replay allows rewrite', c => { c.case_authority_control_operation_registry.replay = 'rewrite_existing' }],
  ['case collision treated as replay', c => { c.case_authority_control_operation_registry.collision = c.case_authority_control_operation_registry.replay }],
  ['case binding without receipt allowed', c => { c.case_authority_control_operation_registry.no_binding_without_receipt = false }],
  ['worker ambiguity payload ref stale', c => { c.outbox.payload_binding_map.worker_ambiguity.payload_schema_ref = 'outbox.ambiguity_evidence_schema' }],
  ['worker actor recorder detached', c => { delete c.outbox.payload_binding_map.worker_ambiguity.actor_payload_equality }],
  ['lease actor recorder detached', c => { delete c.outbox.payload_binding_map.lease_expiry_ambiguity.actor_payload_equality }],
  ['worker authority redirected', c => { c.outbox.transition_table.find(row => row.event_kind === 'worker_ambiguity').actor_authority_ref = 'outbox.actor_authority.reconcile_unknown' }],
  ['transition actor payload equality erased', c => { c.outbox.transition_event_schema.conditional_rules.pop() }],
  ['proof right target missing', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[1].joins[0][1] = 'record.no_such_field' }],
  ['proof left target missing', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[1].joins[0][0] = 'use_release_committed_success.no_such_field' }],
  ['payload fingerprint field missing', c => { c.outbox.payload_binding_map.worker_ambiguity.payload_fingerprint_field = 'no_such_field' }],
  ['transition schema disagreement', c => { c.outbox.transition_table.find(row => row.event_kind === 'lease_expiry_ambiguity').event_schema_ref = 'outbox.worker_ambiguity_evidence_schema' }],
  ['predecessor reference suffix spoofed', c => { c.case_identity_derivation.freshness += ' predecessor_lifecycle_version_ref_extra' }],
  ['predecessor reference word spoofed', c => { c.case_identity_derivation.freshness += ' predecessor_lifecycle_version_reference' }],
  ['canonical JSON authority weakened', c => { c.canonical_json_utf8_encoding.fingerprint_framing_included = true }],
  ['three record atomicity weakened', c => { c.operation_registry.committed_success_blob_derivation.commit_atomicity = 'eventually_consistent' }],
  ['provider failure set reopened', c => { c.outbox.provider_call_gate.nonlease_final_recheck_failure_set.closed = false }],
  ['schema manifest erased', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR18)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R18 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R18 and ${mutations.length} mutation probes verified`)
console.log(`r18_machine_sha256=${sha(path)}`)
