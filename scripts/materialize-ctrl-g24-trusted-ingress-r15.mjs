import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR14 } from './materialize-ctrl-g24-trusted-ingress-r14.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r14.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r15.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR14 = JSON.parse(inputBytes)
const r15 = structuredClone(materializedR14)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const nullable = value_schema => ({ type: 'nullable', value_schema })

function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return {
    schema_version, type: 'object', exact_keys: Object.keys(properties),
    required: Object.keys(properties).filter(key => !optional.includes(key)),
    ...(optional.length ? { optional } : {}), additional_properties: false, properties, ...extras,
  }
}
function replaceProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}
function fingerprint(domain_ascii, fields) {
  return { domain_ascii, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
}
function refreshRow(table) {
  const schema = r15.authoritative_row_schemas[table]
  const semantic = schema.semantic_fingerprint_field
  const metadata = new Set(['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint'])
  r15.authoritative_semantic_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R15`, Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== semantic))
  r15.authoritative_row_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R15`, Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'))
}
function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}
function schemaNodes(value, path = '$', found = new Map()) {
  if (!value || typeof value !== 'object') return found
  if (!Array.isArray(value) && typeof value.schema_version === 'string') found.set(path, value)
  if (Array.isArray(value)) value.forEach((item, index) => schemaNodes(item, `${path}[${index}]`, found))
  else for (const [key, item] of Object.entries(value)) schemaNodes(item, `${path}.${key}`, found)
  return found
}
const withoutVersion = value => JSON.stringify({ ...value, schema_version: null })
const r15Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r15.') : `${version}.r15`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR14)
    for (const [path, after] of schemaNodes(r15)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r15.')) {
        after.schema_version = r15Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR14)
  for (const [path, after] of schemaNodes(r15)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      if (!field.endsWith('schema_version') || !property || typeof property !== 'object') continue
      const priorConst = prior.properties?.[field]?.const
      if (typeof priorConst === 'string' && property.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r15.schema_version = 'ctrl.g24.trusted-ingress.r15.effective.v1'
r15.status = 'fourteenth_repair_candidate_under_independent_review'
r15.supersedes = {
  commit: '7fa5d5b23f7bcd20d4460993fdae4cbfc5df52dc', tree: 'b9a79885003bf8dedb6f8ccd96cdb84689d58f56',
  human_blob: '027257a3b9d92a018a211a39eaf5f6c38eb5e953', machine_blob: 'fbc53e06e1b78e192676b274120aac521a474488',
  qa_blob: '5292f265ff14bfc572f897d367f66f56ca400ee2', checker_blob: '3a0c9f5c3504c47c340e3ed0c1ad10f0b7427a3e',
  materializer_blob: 'b29f7d48ad457fbd9be54f9193e3e208d851cd6f', founder_checker_blob: '21d82cc1829be41a1f6c4e64c0e71326c2fb064f',
  adjudication: 'veto',
}
r15.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r15.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// There is one operation registry. Its committed-success row is the canonical result authority.
delete r15.operation_registry_committed_success_schema
r15.operation_registry.schema_version = 'ctrl.g24.operation-registry.r15.v1'
r15.operation_registry.committed_success_row_schema = closed('ctrl.g24.operation-registry-committed-success.r15.v1', {
  workspace_ref: id,
  operation_id: id,
  state: { const: 'committed_success' },
  stable_principal_ref: id,
  case_derived_subject: id,
  requested_case_ref: id,
  operation_class: { type: 'enum', values: [...r15.operation_names] },
  request_fingerprint: fp,
  intent_fingerprint: fp,
  response_schema_version: id,
  canonical_response_bytes_ref: id,
  canonical_result_payload_bytes_ref: id,
  response_fingerprint: fp,
  result_payload_fingerprint: fp,
  result_schema_version: id,
  result_ref: nullable(id),
  successful_result_branch: nullable({ type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] }),
  snapshot_fingerprint: fp,
  audience: id,
  retention_class: id,
  committed_at: ts,
}, {
  append_only: true,
  unique_keys: [['workspace_ref', 'operation_id']],
  conditional_rules: [
    'operation_class_use_release_iff_successful_result_branch_and_result_ref_are_nonnull_and_exactly_derived_by_release_terminal_consumption_branch_table',
    'non_use_release_successful_result_branch_is_null',
  ],
})
r15.operation_registry.stored_success = Object.keys(r15.operation_registry.committed_success_row_schema.properties).filter(field => !['workspace_ref', 'operation_id', 'state'].includes(field))
r15.operation_registry.canonical_committed_success_schema_ref = 'operation_registry.committed_success_row_schema'

const releaseConsumption = r15.authoritative_row_schemas.release_authority_terminal_consumptions
const releaseProps = { ...releaseConsumption.properties }
releaseProps.use_release_operation_id = releaseProps.use_release_operation_ref
delete releaseProps.use_release_operation_ref
replaceProperties(releaseConsumption, releaseProps)
r15.fingerprint_schemas.use_release_invalidated_result = fingerprint('CTRL-G24-USE-RELEASE-INVALIDATED-RESULT-R15', [
  'standing', 'pending_projection_ref', 'projection_version_ref', 'invalidation_receipt_ref',
  'changed_controlling_watermark_kinds', 'delivery_eligible', 'outbox_created',
])
r15.release_terminal_consumption_derivation = {
  operation_registry_schema_ref: 'operation_registry.committed_success_row_schema',
  exact_equalities: [
    'consumption.workspace_ref_equals_committed_success.workspace_ref',
    'consumption.case_ref_equals_committed_success.requested_case_ref',
    'consumption.subject_ref_equals_committed_success.case_derived_subject',
    'consumption.use_release_operation_id_equals_committed_success.operation_id',
    'committed_success.operation_class_equals_use_release',
    'committed_success.stable_principal_ref_equals_exact_named_leader',
    'consumption.terminal_result_schema_version_equals_committed_success.result_schema_version',
    'consumption.terminal_result_ref_equals_committed_success.result_ref',
    'consumption.terminal_result_fingerprint_equals_committed_success.result_payload_fingerprint_recomputed_from_exact_canonical_result_payload_bytes',
    'consumption.terminal_result_branch_equals_committed_success.successful_result_branch',
    'consumption.outcome_equals_consumption.terminal_result_branch',
    'consumption.terminal_receipt_ref_equals_branch_extracted_terminal_receipt_ref_and_committed_success.result_ref',
  ],
  branch_table: [
    {
      branch: 'pending_delivery',
      result_schema_ref: 'result_payload_schemas.use_release.variants.pending_delivery',
      result_schema_version_field: 'schema_version',
      result_ref_field: 'release_use_receipt_ref',
      result_fingerprint_schema_ref: 'fingerprint_schemas.use_release_pending_delivery_result',
      terminal_receipt_field: 'release_use_receipt_ref',
      authority_consumption_and_result_commit: 'same_serializable_transaction',
    },
    {
      branch: 'invalidated_before_use',
      result_schema_ref: 'result_payload_schemas.use_release.variants.invalidated_before_use',
      result_schema_version_field: 'schema_version',
      result_ref_field: 'invalidation_receipt_ref',
      result_fingerprint_schema_ref: 'fingerprint_schemas.use_release_invalidated_result',
      terminal_receipt_field: 'invalidation_receipt_ref',
      authority_consumption_and_result_commit: 'same_serializable_transaction',
    },
  ],
  canonical_result_payload_bytes_rule: 'parse_exact_canonical_result_payload_bytes_ref_under_branch_result_schema_then_recompute_result_payload_fingerprint_and_extract_result_ref_and_terminal_receipt_from_declared_fields',
  any_mismatch: 'request_rejected_without_consumption_result_or_outbox_write',
}
const releaseMap = r15.proof_authority.proof_family_resolution_map.pending_release_and_authority
releaseMap.external_authoritative_records = [{
  record_name: 'use_release_committed_success', schema_ref: 'operation_registry.committed_success_row_schema',
  joins: [
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
  ],
}]

// Active lifecycle semantics use only the authoritative receipt vocabulary.
r15.lifecycle_authority.combine_transaction.exact_match_fields = ['case_ref', 'transition_id', 'predecessor_lifecycle_version_ref']
r15.lifecycle_authority.action_receipt_fingerprint_ref = r15.lifecycle_authority.action_fingerprint_ref
delete r15.lifecycle_authority.action_fingerprint_ref
r15.lifecycle_authority.authority_receipt_fingerprint_ref = r15.lifecycle_authority.joint_receipt_fingerprint_ref
delete r15.lifecycle_authority.joint_receipt_fingerprint_ref
r15.lifecycle_authority.action_nonce_collision.excluded_server_fields = [
  'action_receipt_ref', 'issued_at', 'expires_at', 'action_receipt_fingerprint',
]
r15.lifecycle_authority.action_pair_collision = {
  same_exact_leader_and_operator_action_receipt_refs: 'commit_new_operation_registry_success_with_exact_existing_authority_result_bytes_and_no_new_authority_row',
  either_action_receipt_already_combined_with_another_action_receipt: 'authority_pair_conflict_hold_with_committed_operation_registry_hold',
}
r15.lifecycle_authority.fresh_joint_transition_predicate = r15.lifecycle_authority.fresh_joint_transition_predicate.map(rule => rule
  .replaceAll('predecessor_lifecycle_version_match', 'predecessor_lifecycle_version_ref_match')
  .replaceAll('both_action_fingerprints', 'both_action_receipt_fingerprints')
  .replaceAll('joint_receipt_fingerprint', 'authority_receipt_fingerprint'))
const combineIntent = r15.operation_specs.combine_lifecycle_authority.intent
replaceProperties(combineIntent, {
  leader_action_receipt_ref: combineIntent.properties.leader_action_ref,
  operator_action_receipt_ref: combineIntent.properties.operator_action_ref,
})
r15.operation_specs.combine_lifecycle_authority.read_set = [
  'leader_lifecycle_action_receipt', 'operator_lifecycle_action_receipt', 'current_case_authority', 'current_lifecycle_version',
]
for (const legacy of [
  'lifecycle_authority_action', 'lifecycle_joint_authority_receipt',
  'lifecycle_action_combination_consumption', 'lifecycle_joint_transition_consumption',
]) delete r15.fingerprint_schemas[legacy]
r15.lifecycle_vocabulary_contract = {
  active_roots: [
    'lifecycle_authority',
    'operation_specs.record_leader_lifecycle_action',
    'operation_specs.record_operator_lifecycle_action',
    'operation_specs.combine_lifecycle_authority',
    'operation_specs.apply_lifecycle_transition',
    'authoritative_row_schemas.lifecycle_action_receipts',
    'authoritative_row_schemas.lifecycle_authority_receipts',
    'authoritative_row_schemas.lifecycle_action_combination_consumptions',
    'authoritative_row_schemas.lifecycle_joint_transition_consumptions',
    'authoritative_semantic_fingerprint_schemas.lifecycle_action_receipts',
    'authoritative_semantic_fingerprint_schemas.lifecycle_authority_receipts',
    'authoritative_semantic_fingerprint_schemas.lifecycle_action_combination_consumptions',
    'authoritative_semantic_fingerprint_schemas.lifecycle_joint_transition_consumptions',
  ],
  forbidden_exact_tokens: [
    'predecessor_lifecycle_version', 'action_ref', 'action_fingerprint',
    'leader_action_ref', 'leader_action_fingerprint', 'operator_action_ref', 'operator_action_fingerprint',
    'joint_receipt_ref', 'joint_receipt_fingerprint',
  ],
  required_vocabulary: [
    'predecessor_lifecycle_version_ref', 'action_receipt_ref', 'action_receipt_fingerprint',
    'authority_receipt_ref', 'authority_receipt_fingerprint',
  ],
  any_forbidden_token_in_active_root: 'contract_invalid',
}

// An expired ambiguous invocation belongs to the lease reaper before any live-worker branch.
r15.outbox.provider_call_gate.final_recheck_outcome_table = {
  evaluation: 'first_matching_priority_ascending_over_one_serializable_current_tip_claim_fence_lease_capability_authority_payload_registry_and_terminal_snapshot',
  rows: [
    { priority: 1, guard: 'terminal_or_reaper_successor_exists', action: 'do_not_append_do_not_call_return_committed_successor', actor: 'current_worker_or_reaper' },
    { priority: 2, guard: 'invocation_tip_superseded_and_no_terminal_or_reaper_successor', action: 'do_not_append_do_not_call_reload_current_tip', actor: 'current_worker_or_reaper' },
    { priority: 3, guard: 'lease_expired_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor', action: 'append_lease_expiry_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'workload_outbox_lease_reaper' },
    { priority: 4, guard: 'claim_fence_changed_and_invocation_tip_still_current_and_no_successor_and_priority_3_did_not_match', action: 'do_not_append_do_not_call_leave_resolution_to_current_owner_or_reaper', actor: 'superseded_worker' },
    { priority: 5, guard: 'lease_live_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor', action: 'append_worker_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'current_fenced_claim_worker' },
    { priority: 6, guard: 'lease_expired_and_capability_proven_unconsumed_and_zero_call_evidence_and_invocation_tip_still_current_and_no_successor', action: 'append_invocation_aborted_before_provider', actor: 'workload_outbox_lease_reaper' },
    { priority: 7, guard: 'current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_one_nonlease_authority_payload_registry_or_budget_recheck_failed_and_invocation_tip_still_current_and_no_successor', action: 'append_invocation_aborted_before_provider', actor: 'current_fenced_claim_worker' },
    { priority: 8, guard: 'all_rechecks_pass_and_lease_live_and_invocation_tip_current_and_no_successor_and_capability_unconsumed', action: 'atomically_consume_single_use_process_capability_then_call_provider_once', actor: 'current_fenced_claim_worker' },
  ],
  exclusivity: 'first_match_precedence_makes_exactly_one_row_authoritative_even_when_raw_predicates_overlap',
  exhaustiveness: 'every_snapshot_matches_one_row; otherwise_pre_provider_hold_and_no_call',
  append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot: true,
}
r15.outbox.provider_call_gate.totality = 'ordered_first_match_is_exhaustive_and_append_actions_require_compare_and_swap_against_the_same_snapshot; no_fallthrough_or_actor_choice'

refreshRow('release_authority_terminal_consumptions')
bumpChangedSchemas()
for (const name of r15.operation_names) {
  r15.operation_specs[name].result_schema = r15.result_payload_schemas[name].schema_version
  r15.evaluator_abi.operation_result_exports[name] = r15.result_payload_schemas[name].schema_version
}
replaceProperties(r15.evaluator_abi.operation_result_exports_schema, Object.fromEntries(
  r15.operation_names.map(name => [name, { const: r15.result_payload_schemas[name].schema_version }]),
))
bumpChangedSchemas()
repairEmbeddedSelfVersions()
bumpChangedSchemas()

const beforeNodes = schemaNodes(frozenR14)
const afterNodes = schemaNodes(r15)
const changes = []
for (const [path, after] of afterNodes) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r15.')) throw new Error(`changed_schema_without_r15_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r15.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R14_and_materialized_R15_plus_canonical_registry_lifecycle_vocabulary_and_provider_recovery_checks',
  changes, every_changed_or_new_schema_must_have_r15_version: true,
  dependency_parity_checks: [
    'one_canonical_operation_registry_owns_every_committed_success_row',
    'both_use_release_branches_define_exact_schema_result_ref_result_fingerprint_and_terminal_receipt_extraction',
    'no_forbidden_legacy_lifecycle_token_exists_in_any_declared_active_root',
    'expired_consumed_or_maybe_called_current_invocation_tip_routes_to_reaper_ambiguity_before_worker_or_abort_paths',
  ],
}
r15.required_negative_fixture_families = [...new Set([...r15.required_negative_fixture_families,
  'single_canonical_operation_registry', 'release_branch_result_extraction',
  'active_lifecycle_vocabulary_closure', 'expired_provider_invocation_reaper_ambiguity',
])]
r15.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r15)
export const materializedR15 = r15
export const materializedR15Output = `${JSON.stringify(r15, null, 2)}\n`
export const materializedR15Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR15Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR15Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R15 effective contract`)
  } else process.stdout.write(materializedR15Output)
}
