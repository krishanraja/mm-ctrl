import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR15, materializedR15Output } from './materialize-ctrl-g24-trusted-ingress-r15.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r15.json'
const read = p => readFileSync(join(root, p), 'utf8')
const sha = p => createHash('sha256').update(read(p)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []

function exactClosed(schema) {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
function atPath(object, pathValue) {
  return pathValue.split('.').reduce((value, key) => value?.[key], object)
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
          const allowedRefSuffix = token === 'predecessor_lifecycle_version' && suffix.startsWith('_ref')
          if (!allowedRefSuffix) hits.push(`${pathValue}:${token}`)
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
function collect(c) {
  const f = []
  const ok = (name, value) => { if (!value) f.push(name) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r15.effective.v1' && c.materialization.frozen_input.sha256 === '79d6dfa3a9f19c9258e380dd59c4b962c01eaa7ee4ddc18b94f5269df65403e2')
  ok('public ABI preserved', same(c.request_schema.properties.operation_class.values, c.operation_names) && c.operation_names.length === 20 && c.operation_names.every(name => c.operation_specs[name]?.result_schema === c.result_payload_schemas[name]?.schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name]?.schema_version))

  const registry = c.operation_registry
  const success = registry.committed_success_row_schema
  const successFields = [
    'workspace_ref', 'operation_id', 'state', 'stable_principal_ref', 'case_derived_subject', 'requested_case_ref',
    'operation_class', 'request_fingerprint', 'intent_fingerprint', 'response_schema_version',
    'canonical_response_bytes_ref', 'canonical_result_payload_bytes_ref', 'response_fingerprint',
    'result_payload_fingerprint', 'result_schema_version', 'result_ref', 'successful_result_branch',
    'snapshot_fingerprint', 'audience', 'retention_class', 'committed_at',
  ]
  ok('one canonical operation registry', !Object.hasOwn(c, 'operation_registry_committed_success_schema') && registry.schema_version.includes('.r15.') && registry.canonical_committed_success_schema_ref === 'operation_registry.committed_success_row_schema' && exactClosed(success) && same(Object.keys(success.properties), successFields) && success.properties.state.const === 'committed_success' && same(success.unique_keys, [['workspace_ref', 'operation_id']]) && same(registry.unique_key, ['workspace_ref', 'operation_id']))
  ok('canonical success owns exact result bytes', registry.stored_success.includes('canonical_result_payload_bytes_ref') && registry.stored_success.includes('result_payload_fingerprint') && registry.stored_success.includes('result_schema_version') && registry.stored_success.includes('result_ref') && registry.stored_success.includes('successful_result_branch'))

  const releaseConsumption = c.authoritative_row_schemas.release_authority_terminal_consumptions
  ok('release operation identifier canonical', releaseConsumption.properties.use_release_operation_id && !releaseConsumption.properties.use_release_operation_ref)
  const derivation = c.release_terminal_consumption_derivation
  const expectedBranches = [
    {
      branch: 'pending_delivery', result_schema_ref: 'result_payload_schemas.use_release.variants.pending_delivery',
      result_schema_version_field: 'schema_version', result_ref_field: 'release_use_receipt_ref',
      result_fingerprint_schema_ref: 'fingerprint_schemas.use_release_pending_delivery_result', terminal_receipt_field: 'release_use_receipt_ref',
      authority_consumption_and_result_commit: 'same_serializable_transaction',
    },
    {
      branch: 'invalidated_before_use', result_schema_ref: 'result_payload_schemas.use_release.variants.invalidated_before_use',
      result_schema_version_field: 'schema_version', result_ref_field: 'invalidation_receipt_ref',
      result_fingerprint_schema_ref: 'fingerprint_schemas.use_release_invalidated_result', terminal_receipt_field: 'invalidation_receipt_ref',
      authority_consumption_and_result_commit: 'same_serializable_transaction',
    },
  ]
  ok('release derivation uses canonical registry', derivation.operation_registry_schema_ref === 'operation_registry.committed_success_row_schema' && same(derivation.branch_table, expectedBranches))
  ok('release derivation exact identities', [
    'workspace_ref_equals_committed_success.workspace_ref', 'case_ref_equals_committed_success.requested_case_ref',
    'subject_ref_equals_committed_success.case_derived_subject', 'use_release_operation_id_equals_committed_success.operation_id',
    'terminal_result_schema_version_equals_committed_success.result_schema_version',
    'terminal_result_ref_equals_committed_success.result_ref', 'terminal_result_fingerprint_equals_committed_success.result_payload_fingerprint',
    'terminal_result_branch_equals_committed_success.successful_result_branch',
  ].every(fragment => derivation.exact_equalities.some(rule => rule.includes(fragment))) && derivation.canonical_result_payload_bytes_rule.includes('recompute_result_payload_fingerprint'))
  const invalidatedFp = c.fingerprint_schemas.use_release_invalidated_result
  ok('both release payload fingerprints exact', same(c.fingerprint_schemas.use_release_pending_delivery_result.preimage_order.slice(1), Object.keys(c.result_payload_schemas.use_release.variants.pending_delivery.properties)) && same(invalidatedFp.preimage_order.slice(1), Object.keys(c.result_payload_schemas.use_release.variants.invalidated_before_use.properties)))
  const external = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
  ok('proof map resolves canonical success', external.length === 1 && external[0].schema_ref === 'operation_registry.committed_success_row_schema' && same(external[0].joins, [
    ['release_authority_terminal_consumptions.workspace_ref', 'record.workspace_ref'],
    ['release_authority_terminal_consumptions.case_ref', 'record.requested_case_ref'],
    ['release_authority_terminal_consumptions.subject_ref', 'record.case_derived_subject'],
    ['release_authority_terminal_consumptions.use_release_operation_id', 'record.operation_id'],
    ['release_authority_terminal_consumptions.terminal_result_schema_version', 'record.result_schema_version'],
    ['release_authority_terminal_consumptions.terminal_result_ref', 'record.result_ref'],
    ['release_authority_terminal_consumptions.terminal_result_fingerprint', 'record.result_payload_fingerprint'],
    ['release_authority_terminal_consumptions.terminal_result_branch', 'record.successful_result_branch'],
    ['release_authority_terminal_consumptions.outcome', 'record.successful_result_branch'],
    ['release_authority_terminal_consumptions.terminal_receipt_ref', 'record.result_ref'],
  ]))

  const vocabulary = c.lifecycle_vocabulary_contract
  const activeHits = vocabulary.active_roots.flatMap(pathValue => forbiddenHits(atPath(c, pathValue), vocabulary.forbidden_exact_tokens, pathValue))
  ok('active lifecycle vocabulary closed', vocabulary.any_forbidden_token_in_active_root === 'contract_invalid' && activeHits.length === 0)
  ok('lifecycle combine matches authoritative fields', same(c.lifecycle_authority.combine_transaction.exact_match_fields, ['case_ref', 'transition_id', 'predecessor_lifecycle_version_ref']) && same(c.lifecycle_authority.action_nonce_collision.excluded_server_fields, ['action_receipt_ref', 'issued_at', 'expires_at', 'action_receipt_fingerprint']))
  ok('combine intent uses receipts', same(Object.keys(c.operation_specs.combine_lifecycle_authority.intent.properties), ['leader_action_receipt_ref', 'operator_action_receipt_ref']) && c.operation_specs.combine_lifecycle_authority.read_set.includes('leader_lifecycle_action_receipt'))
  ok('legacy lifecycle fingerprint schemas absent', ['lifecycle_authority_action', 'lifecycle_joint_authority_receipt', 'lifecycle_action_combination_consumption', 'lifecycle_joint_transition_consumption'].every(name => !Object.hasOwn(c.fingerprint_schemas, name)))

  const table = c.outbox.provider_call_gate.final_recheck_outcome_table
  const expiredAmbiguity = table.rows[2]
  ok('provider recovery ordered and exhaustive', table.evaluation.startsWith('first_matching_priority_ascending') && same(table.rows.map(row => row.priority), [1, 2, 3, 4, 5, 6, 7, 8]) && new Set(table.rows.map(row => row.priority)).size === 8 && table.exclusivity.includes('first_match') && table.exhaustiveness.includes('every_snapshot') && table.append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot === true)
  ok('expired maybe-call owned by reaper', same(expiredAmbiguity, {
    priority: 3,
    guard: 'lease_expired_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor',
    action: 'append_lease_expiry_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee',
    actor: 'workload_outbox_lease_reaper',
  }) && table.rows[4].guard.startsWith('lease_live_and_') && table.rows[4].actor === 'current_fenced_claim_worker')
  ok('reaper ambiguity transition executable', c.outbox.transition_table.some(row => row.from === 'invoking' && row.to === 'ambiguous' && row.event_kind === 'lease_expiry_ambiguity' && row.actor_authority_ref === 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity'))

  ok('derived changes', c.schema_change_manifest.derivation.includes('frozen_R14') && same(c.schema_change_manifest.dependency_parity_checks, [
    'one_canonical_operation_registry_owns_every_committed_success_row',
    'both_use_release_branches_define_exact_schema_result_ref_result_fingerprint_and_terminal_receipt_extraction',
    'no_forbidden_legacy_lifecycle_token_exists_in_any_declared_active_root',
    'expired_consumed_or_maybe_called_current_invocation_tip_routes_to_reaper_ambiguity_before_worker_or_abort_paths',
  ]) && c.schema_change_manifest.changes.length >= 6 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r15.')))
  return f
}

if (read(path) !== materializedR15Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r14.json') !== '79d6dfa3a9f19c9258e380dd59c4b962c01eaa7ee4ddc18b94f5269df65403e2') failures.push('frozen R14 changed')
for (const failure of collect(materializedR15)) failures.push(failure)

const mutations = [
  ['parallel success schema restored', c => { c.operation_registry_committed_success_schema = structuredClone(c.operation_registry.committed_success_row_schema) }],
  ['canonical registry schema pointer diverted', c => { c.operation_registry.canonical_committed_success_schema_ref = 'operation_registry_committed_success_schema' }],
  ['canonical registry operation id renamed', c => { c.operation_registry.committed_success_row_schema.properties.operation_ref = c.operation_registry.committed_success_row_schema.properties.operation_id; delete c.operation_registry.committed_success_row_schema.properties.operation_id }],
  ['canonical result bytes omitted', c => { c.operation_registry.stored_success = c.operation_registry.stored_success.filter(field => field !== 'canonical_result_payload_bytes_ref') }],
  ['release consumption id namespace spliced', c => { c.authoritative_row_schemas.release_authority_terminal_consumptions.properties.use_release_operation_ref = c.authoritative_row_schemas.release_authority_terminal_consumptions.properties.use_release_operation_id; delete c.authoritative_row_schemas.release_authority_terminal_consumptions.properties.use_release_operation_id }],
  ['release branch result ref arbitrary', c => { c.release_terminal_consumption_derivation.branch_table[0].result_ref_field = 'outbox_effect_ref' }],
  ['release invalidated fingerprint arbitrary', c => { c.release_terminal_consumption_derivation.branch_table[1].result_fingerprint_schema_ref = 'fingerprint_schemas.use_release_pending_delivery_result' }],
  ['release invalidated fingerprint preimage incomplete', c => { c.fingerprint_schemas.use_release_invalidated_result.preimage_order.pop() }],
  ['release operation equality erased', c => { c.release_terminal_consumption_derivation.exact_equalities = c.release_terminal_consumption_derivation.exact_equalities.filter(rule => !rule.includes('use_release_operation_id')) }],
  ['release result fingerprint equality erased', c => { c.release_terminal_consumption_derivation.exact_equalities = c.release_terminal_consumption_derivation.exact_equalities.filter(rule => !rule.includes('terminal_result_fingerprint')) }],
  ['release proof map result spliced', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0].joins[5][1] = 'record.operation_id' }],
  ['legacy combine predecessor restored', c => { c.lifecycle_authority.combine_transaction.exact_match_fields[2] = 'predecessor_lifecycle_version' }],
  ['legacy nonce action ref restored', c => { c.lifecycle_authority.action_nonce_collision.excluded_server_fields[0] = 'action_ref' }],
  ['legacy combine intent restored', c => { c.operation_specs.combine_lifecycle_authority.intent.properties.leader_action_ref = c.operation_specs.combine_lifecycle_authority.intent.properties.leader_action_receipt_ref; delete c.operation_specs.combine_lifecycle_authority.intent.properties.leader_action_receipt_ref }],
  ['legacy fingerprint schema restored', c => { c.fingerprint_schemas.lifecycle_authority_action = { preimage_order: ['action_ref'] } }],
  ['reaper ambiguity row removed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows.splice(2, 1); c.outbox.provider_call_gate.final_recheck_outcome_table.rows.forEach((row, index) => { row.priority = index + 1 }) }],
  ['reaper ambiguity actor changed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[2].actor = 'current_fenced_claim_worker' }],
  ['reaper ambiguity action changed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[2].action = 'append_invocation_aborted_before_provider' }],
  ['worker ambiguity allowed after expiry', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[4].guard = c.outbox.provider_call_gate.final_recheck_outcome_table.rows[4].guard.replace('lease_live', 'any_lease_state') }],
  ['provider outcome priority collision', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[3].priority = 3 }],
  ['provider outcome CAS removed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot = false }],
  ['version semantic checks erased', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR15)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R15 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R15 and ${mutations.length} mutation probes verified`)
console.log(`r15_machine_sha256=${sha(path)}`)
