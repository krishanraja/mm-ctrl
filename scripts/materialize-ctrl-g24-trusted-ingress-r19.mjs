import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR18 } from './materialize-ctrl-g24-trusted-ingress-r18.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r18.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r19.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR18 = JSON.parse(inputBytes)
const r19 = structuredClone(materializedR18)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return { schema_version, type: 'object', exact_keys: Object.keys(properties), required: Object.keys(properties).filter(key => !optional.includes(key)), ...(optional.length ? { optional } : {}), additional_properties: false, properties, ...extras }
}
function replaceProperties(schema, properties) { schema.properties = properties; schema.exact_keys = Object.keys(properties); schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key)) }
function fingerprint(domain_ascii, fields) { return { domain_ascii, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
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
const r19Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r19.') : `${version}.r19`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 10; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR18)
    for (const [path, after] of schemaNodes(r19)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r19.')) { after.schema_version = r19Version(after.schema_version); changed = true }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR18)
  for (const [path, after] of schemaNodes(r19)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      const priorConst = prior.properties?.[field]?.const
      if (field.endsWith('schema_version') && typeof priorConst === 'string' && property?.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r19.schema_version = 'ctrl.g24.trusted-ingress.r19.effective.v1'
r19.status = 'eighteenth_repair_candidate_under_independent_review'
r19.supersedes = {
  commit: '7163c4fde940aa20602862574a69bd0737853279', tree: '577e3bd5fbbae68fb0dfe871a74027ec2f8ff744',
  human_blob: 'e1ea7f93ed0270e7c0f8a293b7d16718f5572379', machine_blob: 'e50ff594859f1bcb990dfac3f06a97f37de68608',
  qa_blob: '1dc02d31ebb1ba0f3f8eb952e781b6b5d30feca5', checker_blob: '7ae75557164342eabdbcfe5959f5997ec125630f',
  materializer_blob: '31334c1b25d191d3bb4dc9a1a0e1babcd5d92f3f', founder_checker_blob: '07fff83e1289859f6b37c713b771ab1a051c031f', adjudication: 'veto',
}
r19.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r19.mjs', frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

// The existing terminal-consumption row is the sole Release receipt.
const useRelease = r19.result_payload_schemas.use_release
for (const variant of Object.values(useRelease.variants)) {
  const properties = { ...variant.properties }
  const last = Object.keys(properties).at(-1)
  const reordered = {}
  for (const [key, value] of Object.entries(properties)) {
    if (key === last) reordered.terminal_consumption_fingerprint = fp
    reordered[key] = value
  }
  replaceProperties(variant, reordered)
}
r19.release_terminal_receipt_authority = {
  schema_version: 'ctrl.g24.release-terminal-receipt-authority.r19.v1',
  sole_receipt_schema_ref: 'authoritative_row_schemas.release_authority_terminal_consumptions',
  receipt_ref_field: 'release_authority_consumption_ref', receipt_fingerprint_field: 'release_authority_consumption_fingerprint',
  issuer: 'use_release_operation_by_exact_named_leader_after_current_unconsumed_release_authority',
  atomicity: 'terminal_consumption_result_blob_response_blob_committed_success_authority_consumption_and_any_pending_delivery_outbox_effect_commit_in_one_serializable_transaction_or_none_exists',
  branch_equalities: {
    pending_delivery: [
      'result.release_use_receipt_ref_equals_terminal_consumption.release_authority_consumption_ref',
      'result.terminal_consumption_fingerprint_equals_terminal_consumption.release_authority_consumption_fingerprint',
    ],
    invalidated_before_use: [
      'result.invalidation_receipt_ref_equals_terminal_consumption.release_authority_consumption_ref',
      'result.terminal_consumption_fingerprint_equals_terminal_consumption.release_authority_consumption_fingerprint',
    ],
  },
  uniqueness: 'authoritative_terminal_consumption_unique_keys_make_one_receipt_per_authority_request_and_projection',
}
for (const row of r19.release_terminal_consumption_derivation.branch_table) {
  row.terminal_receipt_schema_ref = 'authoritative_row_schemas.release_authority_terminal_consumptions'
  row.terminal_receipt_row_ref_field = 'release_authority_consumption_ref'
  row.terminal_receipt_row_fingerprint_field = 'release_authority_consumption_fingerprint'
  row.result_terminal_receipt_fingerprint_field = 'terminal_consumption_fingerprint'
}
r19.release_terminal_consumption_derivation.exact_equalities.push(
  'consumption.release_authority_consumption_ref_equals_branch_extracted_terminal_receipt_ref_equals_committed_success.result_ref',
  'consumption.release_authority_consumption_fingerprint_equals_branch_extracted_terminal_consumption_fingerprint',
)
r19.release_terminal_consumption_derivation.terminal_receipt_authority_ref = 'release_terminal_receipt_authority'

// Replay is an exact historical projection, not another evaluator output.
r19.operation_registry.replayed_committed_derivation = {
  source_success_schema_ref: 'operation_registry.committed_success_row_schema',
  source_result_blob_schema_ref: 'operation_result_blob_store.row_schema',
  lookup: 'resolve_exactly_one_committed_success_by_workspace_ref_and_operation_id_then_its_exact_result_blob',
  exact_historical_equalities: [
    'replay.operation_id_equals_success.operation_id', 'replay.operation_class_equals_success.operation_class',
    'replay.exported_result_schema_version_equals_success.exported_result_schema_version',
    'replay.selected_result_schema_version_equals_success.selected_result_schema_version',
    'replay.successful_result_branch_equals_success.successful_result_branch',
    'replay.result_payload_b64url_equals_result_blob.canonical_result_payload_b64url',
    'replay.result_payload_fingerprint_equals_success.result_payload_fingerprint_equals_result_blob.result_payload_fingerprint',
    'replay.result_payload_byte_length_equals_result_blob.canonical_result_payload_byte_length',
    'replay.snapshot_fingerprint_equals_success.snapshot_fingerprint', 'replay.committed_at_equals_success.committed_at',
  ],
  replay_only_derivations: [
    'status_is_replayed_committed', 'replayed_at_is_current_database_transaction_timestamp',
    'historical_replay_is_true', 'current_standing_is_false',
  ],
  evaluator_execution: 'forbidden', protected_effect: 'forbidden', any_mismatch: 'replay_hold_without_response',
}
r19.response_union.replayed_success_payload_bytes_equal_original = true
r19.response_union.replayed_committed_derivation_ref = 'operation_registry.replayed_committed_derivation'

// Actor role is part of both lifecycle consumption fingerprints and equals the consumed receipt role.
const life = r19.authoritative_row_schemas.lifecycle_single_action_transition_consumptions
const semantic = r19.authoritative_semantic_fingerprint_schemas.lifecycle_single_action_transition_consumptions
const envelope = r19.authoritative_row_fingerprint_schemas.lifecycle_single_action_transition_consumptions
semantic.domain_ascii = 'CTRL-G24-AUTHORITATIVE-SEMANTIC-LIFECYCLE-SINGLE-ACTION-TRANSITION-CONSUMPTIONS-R19'
semantic.preimage_order = [...semantic.preimage_order.filter(field => field !== 'actor_role'), 'actor_role']
envelope.domain_ascii = 'CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-LIFECYCLE-SINGLE-ACTION-TRANSITION-CONSUMPTIONS-R19'
envelope.preimage_order = [...envelope.preimage_order.filter(field => field !== 'actor_role'), 'actor_role']
life.conditional_rules = [...(life.conditional_rules ?? []), 'actor_role_equals_the_uniquely_resolved_consumed_lifecycle_action_receipt.actor_role_byte_for_byte']
r19.lifecycle_single_action_role_derivation = {
  consumption_schema_ref: 'authoritative_row_schemas.lifecycle_single_action_transition_consumptions',
  action_schema_ref: 'authoritative_row_schemas.lifecycle_action_receipts',
  exact_equalities: [
    'consumption.workspace_subject_case_snapshot_equal_action_receipt',
    'consumption.action_receipt_ref_and_fingerprint_equal_action_receipt',
    'consumption.actor_role_equals_action_receipt.actor_role',
  ],
  named_leader_branch: 'actor_role_named_leader_and_action_receipt.actor_ref_equals_current_case_named_leader_ref',
  krish_branch: 'actor_role_krish_and_action_receipt.actor_ref_equals_current_case_engagement_operator_ref',
  any_mismatch: 'proof_schema_hold_without_transition_consumption',
}
const lifeProof = r19.proof_authority.proof_family_resolution_map.lifecycle
for (const conditional of lifeProof.conditional_cross_row_equalities.slice(0, 2)) conditional.equalities.push(['lifecycle_single_action_transition_consumptions.actor_role', `${conditional.when.includes('named_leader') ? 'leader_action' : 'operator_action'}.actor_role`])

// Case control has one key, one original actor and one ordered admission protocol.
const control = r19.case_authority_control_plane
control.idempotency_key = ['workspace_ref', 'subject_ref', 'case_ref', 'control_operation_id']
const req = control.request_schema
const reqProps = { ...req.properties }
delete reqProps.request_fingerprint
replaceProperties(req, { ...reqProps, authenticated_actor_ref: id, request_fingerprint: fp })
r19.fingerprint_schemas.case_authority_control_request = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-REQUEST-R19', Object.keys(req.properties).filter(field => field !== 'request_fingerprint'))
const receipt = r19.case_authority_control_operation_registry.row_schema
const receiptProps = { ...receipt.properties }
delete receiptProps.request_fingerprint
delete receiptProps.state
replaceProperties(receipt, {
  workspace_ref: receiptProps.workspace_ref, subject_ref: receiptProps.subject_ref, case_ref: receiptProps.case_ref,
  control_operation_id: receiptProps.control_operation_id, authenticated_actor_ref: id, request_fingerprint: fp,
  state: { const: 'committed' }, prior_row_version_ref: receiptProps.prior_row_version_ref,
  prior_row_envelope_fingerprint: receiptProps.prior_row_envelope_fingerprint, new_row_version_ref: receiptProps.new_row_version_ref,
  new_row_envelope_fingerprint: receiptProps.new_row_envelope_fingerprint, effective_at: receiptProps.effective_at, receipt_fingerprint: fp,
})
receipt.conditional_rules = [
  'receipt.workspace_subject_case_control_operation_id_authenticated_actor_ref_and_request_fingerprint_equal_the_canonical_request_byte_for_byte',
  'prior_fields_are_both_null_for_bootstrap_or_both_equal_the_selected_prior_row_for_rotation',
  'new_row_fields_equal_the_atomically_appended_case_authority_binding_row',
  'effective_at_equals_the_new_row.valid_from_and_the_database_transaction_timestamp',
  'receipt_fingerprint_equals_recomputed_complete_receipt_preimage',
]
r19.fingerprint_schemas.case_authority_control_receipt = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R19', Object.keys(receipt.properties).filter(field => field !== 'receipt_fingerprint'))
r19.case_authority_control_operation_registry.replay = 'selected_admission_priority_1_returns_exact_receipt_only_to_receipt.authenticated_actor_ref_without_any_write'
r19.case_authority_control_operation_registry.collision = 'selected_admission_priority_3_returns_closed_collision_hold_without_any_write'
r19.case_authority_control_operation_registry.admission_outcome_table = {
  evaluation: 'first_matching_priority_ascending_in_one_serializable_lookup_snapshot_before_any_current_case_or_compare_and_swap_evaluation',
  rows: [
    { priority: 1, guard: 'registry_row_exists_and_request_fingerprint_matches_and_authenticated_actor_ref_equals_receipt.authenticated_actor_ref', result: 'replayed_committed', write: false },
    { priority: 2, guard: 'registry_row_exists_and_request_fingerprint_matches_and_authenticated_actor_ref_differs_from_receipt.authenticated_actor_ref', result: 'unauthorized_hold', write: false },
    { priority: 3, guard: 'registry_row_exists_and_request_fingerprint_differs', result: 'collision_hold', write: false },
    { priority: 4, guard: 'no_registry_row_and_fresh_caller_authority_fails', result: 'unauthorized_hold', write: false },
    { priority: 5, guard: 'no_registry_row_and_expected_current_identity_or_compare_and_swap_fails', result: 'stale_authority_hold', write: false },
    { priority: 6, guard: 'no_registry_row_and_all_fresh_authority_grant_time_and_compare_and_swap_checks_pass', result: 'committed', write: 'one_new_binding_and_one_registry_receipt_atomically' },
  ],
  exact_key_ref: 'case_authority_control_plane.idempotency_key', exhaustive: true, first_match_exclusive: true,
}
r19.case_authority_control_result_union = {
  schema_version: 'ctrl.g24.case-authority-control-result-union.r19.v1', discriminator: 'status',
  variants: {
    committed: closed('ctrl.g24.case-authority-control-result-committed.r19.v1', { status: { const: 'committed' }, receipt_ref: id, receipt_fingerprint: fp, effective_at: ts }),
    replayed_committed: closed('ctrl.g24.case-authority-control-result-replayed.r19.v1', { status: { const: 'replayed_committed' }, receipt_ref: id, receipt_fingerprint: fp, effective_at: ts }),
    collision_hold: closed('ctrl.g24.case-authority-control-result-collision.r19.v1', { status: { const: 'collision_hold' }, evaluation_fingerprint: fp }),
    unauthorized_hold: closed('ctrl.g24.case-authority-control-result-unauthorized.r19.v1', { status: { const: 'unauthorized_hold' }, evaluation_fingerprint: fp }),
    stale_authority_hold: closed('ctrl.g24.case-authority-control-result-stale.r19.v1', { status: { const: 'stale_authority_hold' }, evaluation_fingerprint: fp }),
  },
  committed_and_replayed_equalities: 'receipt_ref_receipt_fingerprint_and_effective_at_equal_the_exact_registry_row',
  hold_rule: 'holds_disclose_no_receipt_or_binding_identity',
}
control.admission_outcome_table_ref = 'case_authority_control_operation_registry.admission_outcome_table'
control.result_union_ref = 'case_authority_control_result_union'

// Every declared path is exactly alias.field, and duplicate paths are invalid.
r19.declared_reference_resolution_contract.alias_schemas = {
  release_authority_terminal_consumptions: 'authoritative_row_schemas.release_authority_terminal_consumptions',
  use_release_committed_success: 'operation_registry.committed_success_row_schema',
  record_use_release_committed_success: 'operation_registry.committed_success_row_schema',
  record_use_release_result_blob: 'operation_result_blob_store.row_schema',
}
r19.declared_reference_resolution_contract.path_grammar = 'exactly_two_identifier_segments_alias_dot_field'
r19.declared_reference_resolution_contract.duplicate_identical_join_pairs = 'contract_invalid; repeated_left_or_right_fields_remain_legal_when_they_express_distinct_equalities'
r19.lifecycle_vocabulary_contract.predecessor_ref_exception = 'only_the_exact_canonical_predecessor_reference_field_followed_by_end_whitespace_dot_comma_semicolon_colon_or_closing_bracket_is_legal; hyphenated_or_identifier_extensions_and_similar_spellings_are_invalid'

bumpChangedSchemas()
for (const name of r19.operation_names) { r19.operation_specs[name].result_schema = r19.result_payload_schemas[name].schema_version; r19.evaluator_abi.operation_result_exports[name] = r19.result_payload_schemas[name].schema_version }
replaceProperties(r19.evaluator_abi.operation_result_exports_schema, Object.fromEntries(r19.operation_names.map(name => [name, { const: r19.result_payload_schemas[name].schema_version }])))
bumpChangedSchemas(); repairEmbeddedSelfVersions(); bumpChangedSchemas()
const beforeNodes = schemaNodes(frozenR18)
const changes = []
for (const [path, after] of schemaNodes(r19)) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r19.')) throw new Error(`changed_schema_without_r19_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r19.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R18_and_materialized_R19_plus_release_receipt_replay_role_case_admission_and_strict_graph_checks', changes, every_changed_or_new_schema_must_have_r19_version: true,
  dependency_parity_checks: [
    'release_terminal_consumption_is_the_single_fingerprinted_receipt_bound_into_each_result_branch_and_the_atomic_use_release_transaction',
    'replayed_committed_is_an_exhaustive_projection_of_one_success_and_result_blob_with_only_replay_metadata_newly_derived',
    'lifecycle_single_action_actor_role_is_in_both_fingerprints_and_equals_the_consumed_action_receipt_role',
    'case_control_uses_one_subject_scoped_key_and_original_authenticated_actor_across_request_receipt_replay_and_result',
    'case_control_admission_is_ordered_replay_collision_fresh_authority_stale_then_commit_with_a_closed_result_union',
    'declared_paths_have_exactly_two_segments_no_duplicates_and_lifecycle_keys_and_values_require_exact_reference_termination',
  ],
}
r19.required_negative_fixture_families = [...new Set([...r19.required_negative_fixture_families, 'release_terminal_consumption_as_sole_receipt', 'replay_exhaustive_historical_projection', 'lifecycle_consumption_actor_role_identity', 'case_control_original_actor_replay', 'case_control_ordered_closed_results', 'strict_two_segment_unique_declared_paths', 'strict_lifecycle_key_and_value_scan'])]
r19.claim_limit = 'unimplemented_local_effective_contract_only'
assertSerializable(r19)
export const materializedR19 = r19
export const materializedR19Output = `${JSON.stringify(r19, null, 2)}\n`
export const materializedR19Path = outputPath
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR19Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR19Output) process.exitCode = 1; else console.log(`ok: ${outputPath} is the exact fully materialized R19 effective contract`) }
  else process.stdout.write(materializedR19Output)
}
