import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR19 } from './materialize-ctrl-g24-trusted-ingress-r19.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r19.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r20.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR19 = JSON.parse(inputBytes)
const r20 = structuredClone(materializedR19)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const b64 = { type: 'base64url_without_padding' }
const uint = { type: 'safe_nonnegative_integer' }
function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return { schema_version, type: 'object', exact_keys: Object.keys(properties), required: Object.keys(properties).filter(key => !optional.includes(key)), ...(optional.length ? { optional } : {}), additional_properties: false, properties, ...extras }
}
function replaceProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}
function fingerprint(domain_ascii, fields) {
  return { domain_ascii, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
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
const r20Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r20.') : `${version}.r20`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 12; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR19)
    for (const [path, after] of schemaNodes(r20)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r20.')) {
        after.schema_version = r20Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR19)
  for (const [path, after] of schemaNodes(r20)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      const priorConst = prior.properties?.[field]?.const
      if (field.endsWith('schema_version') && typeof priorConst === 'string' && property?.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}
function stringHits(value, needles, path = '$', out = []) {
  if (Array.isArray(value)) value.forEach((item, index) => stringHits(item, needles, `${path}[${index}]`, out))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      for (const needle of needles) if (key.includes(needle)) out.push(`${path}.<key>:${needle}`)
      stringHits(item, needles, `${path}.${key}`, out)
    }
  } else if (typeof value === 'string') for (const needle of needles) if (value.includes(needle)) out.push(`${path}:${needle}`)
  return out
}

r20.schema_version = 'ctrl.g24.trusted-ingress.r20.effective.v1'
r20.status = 'nineteenth_repair_candidate_under_independent_review'
r20.supersedes = {
  commit: '0851d07d99d4f25ce315c7d7b2e60f75f97bb46d', tree: '6c69a32065f164c920330380578928a9a87b9084',
  human_blob: '8c98c7b7fc244418a2d488edbdd1f1f3d065081d', machine_blob: 'e25c5b4a3e073e827a348355ce0ca7024aab3d5a',
  qa_blob: '7c20d371b58878f4b2fd6017d8546b54e6dfe22a', checker_blob: '3161cea5b3f3b1b730249203f29010dd81df695f',
  materializer_blob: '0746d04e8b6a2d9afd1113f79d597eab0067bcf6', founder_checker_blob: '338eebaa993ed95a5d56084c48c75cef2fb3af33', adjudication: 'veto',
}
r20.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r20.mjs', frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

// Release identity is issued in one acyclic order. Result bytes bind only the precommit identity.
const useRelease = r20.result_payload_schemas.use_release
replaceProperties(useRelease.variants.pending_delivery, {
  standing: { const: 'pending_delivery' }, terminal_consumption_ref: id, terminal_precommit_fingerprint: fp, outbox_effect_ref: id,
})
replaceProperties(useRelease.variants.invalidated_before_use, {
  standing: { const: 'invalidated_before_use' }, pending_projection_ref: id, projection_version_ref: id,
  terminal_consumption_ref: id, changed_controlling_watermark_kinds: useRelease.variants.invalidated_before_use.properties.changed_controlling_watermark_kinds,
  delivery_eligible: { const: false }, terminal_precommit_fingerprint: fp, outbox_created: { const: false },
})
const terminal = r20.authoritative_row_schemas.release_authority_terminal_consumptions
replaceProperties(terminal, {
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
  terminal_consumption_ref: id, terminal_precommit_fingerprint: fp, terminal_consumption_fingerprint: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp,
  release_authority_receipt_ref: id, release_authority_receipt_fingerprint: fp,
  accepted_release_request_ref: id, accepted_release_request_fingerprint: fp,
  pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  outcome: { type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] }, consumed_at: ts,
  terminal_result_schema_version: id, terminal_result_fingerprint: fp,
  terminal_result_branch: { type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] }, use_release_operation_id: id,
})
terminal.optional = ['valid_until']
terminal.required = terminal.exact_keys.filter(key => !terminal.optional.includes(key))
terminal.partition_key = ['workspace_ref', 'subject_ref', 'case_ref', 'terminal_consumption_ref']
terminal.semantic_fingerprint_field = 'terminal_consumption_fingerprint'
terminal.semantic_fingerprint_ref = 'authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions'
terminal.fingerprint_field = 'row_envelope_fingerprint'
terminal.unique_keys = [
  ['terminal_consumption_ref'], ['release_authority_receipt_ref'], ['accepted_release_request_ref'],
  ['pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint'],
]
terminal.conditional_rules = [
  'terminal_precommit_fingerprint_equals_the_exact_precommit_identity_computed_before_result_bytes',
  'terminal_result_schema_version_fingerprint_and_branch_equal_the_exact_committed_success_and_result_blob',
  'terminal_consumption_fingerprint_is_computed_only_after_the_universal_result_fingerprint',
  'row_envelope_fingerprint_is_computed_only_after_terminal_consumption_fingerprint',
  'valid_from_equals_consumed_at_and_valid_until_is_absent_at_creation',
]
r20.release_terminal_precommit_identity_schema = closed('ctrl.g24.release-terminal-precommit-identity.r20.v1', {
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp, terminal_consumption_ref: id,
  row_version_ref: id, valid_from: ts, release_authority_receipt_ref: id, release_authority_receipt_fingerprint: fp,
  accepted_release_request_ref: id, accepted_release_request_fingerprint: fp,
  pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  outcome: { type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] }, consumed_at: ts, use_release_operation_id: id,
}, {
  forbidden_fields: ['terminal_result_schema_version', 'terminal_result_fingerprint', 'terminal_result_branch', 'terminal_consumption_fingerprint', 'row_envelope_fingerprint'],
})
r20.fingerprint_schemas.release_terminal_precommit = fingerprint('CTRL-G24-RELEASE-TERMINAL-PRECOMMIT-R20', Object.keys(r20.release_terminal_precommit_identity_schema.properties))
r20.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions = fingerprint('CTRL-G24-AUTHORITATIVE-SEMANTIC-RELEASE-TERMINAL-CONSUMPTIONS-R20', [
  'terminal_consumption_ref', 'terminal_precommit_fingerprint', 'terminal_result_schema_version', 'terminal_result_fingerprint', 'terminal_result_branch',
])
r20.authoritative_row_fingerprint_schemas.release_authority_terminal_consumptions = fingerprint('CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-RELEASE-TERMINAL-CONSUMPTIONS-R20', [
  'workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'terminal_consumption_ref', 'terminal_precommit_fingerprint',
  'terminal_consumption_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'release_authority_receipt_ref',
  'release_authority_receipt_fingerprint', 'accepted_release_request_ref', 'accepted_release_request_fingerprint',
  'pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint', 'outcome', 'consumed_at',
  'terminal_result_schema_version', 'terminal_result_fingerprint', 'terminal_result_branch', 'use_release_operation_id',
])
r20.release_terminal_issuance_dependency_dag = {
  schema_version: 'ctrl.g24.release-terminal-issuance-dag.r20.v1',
  nodes: [
    'resolve_current_release_inputs', 'assemble_terminal_precommit_identity', 'compute_terminal_precommit_fingerprint',
    'encode_selected_result_payload', 'compute_universal_result_payload_fingerprint', 'assemble_terminal_consumption',
    'compute_terminal_consumption_fingerprint', 'compute_terminal_row_envelope_fingerprint', 'assemble_response_and_success',
    'assemble_pending_outbox_genesis', 'commit_atomic_release_transaction',
  ],
  edges: [
    ['resolve_current_release_inputs', 'assemble_terminal_precommit_identity'],
    ['assemble_terminal_precommit_identity', 'compute_terminal_precommit_fingerprint'],
    ['compute_terminal_precommit_fingerprint', 'encode_selected_result_payload'],
    ['encode_selected_result_payload', 'compute_universal_result_payload_fingerprint'],
    ['compute_universal_result_payload_fingerprint', 'assemble_terminal_consumption'],
    ['assemble_terminal_consumption', 'compute_terminal_consumption_fingerprint'],
    ['compute_terminal_consumption_fingerprint', 'compute_terminal_row_envelope_fingerprint'],
    ['compute_terminal_row_envelope_fingerprint', 'assemble_response_and_success'],
    ['assemble_response_and_success', 'assemble_pending_outbox_genesis'],
    ['assemble_pending_outbox_genesis', 'commit_atomic_release_transaction'],
  ],
  result_payload_may_depend_on: ['terminal_consumption_ref', 'terminal_precommit_fingerprint'],
  result_payload_must_not_depend_on: ['terminal_consumption_fingerprint', 'row_envelope_fingerprint'],
  terminal_semantic_fingerprint_depends_on: ['terminal_precommit_fingerprint', 'terminal_result_schema_version', 'terminal_result_fingerprint', 'terminal_result_branch'],
  acyclic_and_complete: true,
}
r20.release_terminal_receipt_authority = {
  schema_version: 'ctrl.g24.release-terminal-receipt-authority.r20.v1',
  sole_receipt_schema_ref: 'authoritative_row_schemas.release_authority_terminal_consumptions',
  receipt_ref_field: 'terminal_consumption_ref', receipt_fingerprint_field: 'terminal_consumption_fingerprint',
  precommit_fingerprint_field: 'terminal_precommit_fingerprint',
  issuer: 'use_release_operation_by_exact_named_leader_after_current_unconsumed_release_authority',
  issuance_dependency_dag_ref: 'release_terminal_issuance_dependency_dag',
  atomicity: 'terminal_consumption_result_blob_response_blob_committed_success_authority_consumption_and_any_pending_delivery_outbox_effect_commit_in_one_serializable_transaction_or_none_exists',
  branch_equalities: {
    pending_delivery: ['result.terminal_consumption_ref_equals_precommit.terminal_consumption_ref', 'result.terminal_precommit_fingerprint_equals_precommit.terminal_precommit_fingerprint'],
    invalidated_before_use: ['result.terminal_consumption_ref_equals_precommit.terminal_consumption_ref', 'result.terminal_precommit_fingerprint_equals_precommit.terminal_precommit_fingerprint'],
  },
  final_receipt_resolution: 'resolve_the_terminal_consumption_row_by_result.terminal_consumption_ref_then_verify_precommit_universal_result_semantic_and_envelope_fingerprints',
  uniqueness: 'authoritative_terminal_consumption_unique_keys_make_one_receipt_per_authority_request_and_projection',
}
r20.release_terminal_consumption_derivation.exact_equalities = [
  'consumption.workspace_ref_equals_committed_success.workspace_ref',
  'consumption.case_ref_equals_committed_success.requested_case_ref',
  'consumption.subject_ref_equals_committed_success.case_derived_subject',
  'consumption.use_release_operation_id_equals_committed_success.operation_id',
  'committed_success.operation_class_equals_use_release',
  'committed_success.stable_principal_ref_equals_exact_named_leader',
  'consumption.terminal_consumption_ref_equals_branch_extracted_terminal_consumption_ref_equals_committed_success.result_ref',
  'consumption.terminal_precommit_fingerprint_equals_branch_extracted_terminal_precommit_fingerprint',
  'consumption.terminal_result_schema_version_equals_committed_success.selected_result_schema_version',
  'consumption.terminal_result_fingerprint_equals_committed_success.result_payload_fingerprint_equals_resolved_result_blob.result_payload_fingerprint',
  'consumption.terminal_result_branch_equals_committed_success.successful_result_branch_equals_resolved_result_blob.successful_result_branch',
  'consumption.outcome_equals_consumption.terminal_result_branch',
  'consumption.terminal_consumption_fingerprint_equals_recomputed_post_result_semantic_preimage',
]
for (const row of r20.release_terminal_consumption_derivation.branch_table) {
  row.result_ref_field = 'terminal_consumption_ref'
  row.terminal_receipt_field = 'terminal_consumption_ref'
  row.terminal_receipt_schema_ref = 'authoritative_row_schemas.release_authority_terminal_consumptions'
  row.terminal_receipt_row_ref_field = 'terminal_consumption_ref'
  row.terminal_receipt_row_fingerprint_field = 'terminal_consumption_fingerprint'
  row.result_terminal_precommit_fingerprint_field = 'terminal_precommit_fingerprint'
  delete row.result_terminal_receipt_fingerprint_field
}
r20.release_terminal_consumption_derivation.precommit_schema_ref = 'release_terminal_precommit_identity_schema'
r20.release_terminal_consumption_derivation.precommit_fingerprint_ref = 'fingerprint_schemas.release_terminal_precommit'
r20.release_terminal_consumption_derivation.issuance_dependency_dag_ref = 'release_terminal_issuance_dependency_dag'
const successRules = r20.operation_registry.committed_success_row_schema.conditional_rules
r20.operation_registry.committed_success_row_schema.conditional_rules = successRules.map(rule => rule.startsWith('result_ref_is_nonnull_iff_operation_class_is_use_release') ? 'result_ref_is_nonnull_iff_operation_class_is_use_release_and_equals_the_branch_terminal_consumption_ref' : rule)

// Legacy branch receipts are not active identities. One terminal outcome replaces the old invalidation receipt graph.
const branchEffects = r20.operation_specs.use_release.branch_effects
branchEffects.pending_delivery.write_set = ['pending_outbox_effect', 'release_authority_terminal_consumption']
branchEffects.pending_delivery.forbidden_write_set = ['separate_branch_receipt']
branchEffects.invalidated_before_use.write_set = ['release_authority_terminal_consumption']
branchEffects.invalidated_before_use.forbidden_write_set = ['outbox_effect', 'approval_receipt', 'delivery_receipt', 'separate_branch_receipt']
r20.release_terminal_outcome_derivation = {
  schema_version: 'ctrl.g24.release-terminal-outcome-derivation.r20.v1',
  selection_precedence: 'terminal_invalidated_before_use_outcome_before_generic_snapshot_changed_hold',
  concurrent_controlling_change: 'serializable_retry_then_reselect_against_current_state',
  comparison: 'bound_and_current_complete_watermark_sets_by_kind_lineage_ref_and_version_ref',
  invalidated_result: 'one_terminal_consumption_row_with_outcome_invalidated_before_use_and_no_outbox',
  pending_delivery_result: 'one_terminal_consumption_row_with_outcome_pending_delivery_and_one_exact_outbox_genesis',
  same_projection_version_after_terminal_consumption: 'return_historical_operation_replay_without_new_terminal_row_or_outbox',
  unrelated_lineage_change_invalidates: false,
  rebuild_confers_use_or_delivery_authority: false,
  branch_effects_ref: 'operation_specs.use_release.branch_effects',
}
delete r20.release_invalidation
delete r20.fingerprint_schemas.release_invalidation_receipt
delete r20.fingerprint_schemas.use_release_pending_delivery_result
delete r20.fingerprint_schemas.use_release_invalidated_result
r20.snapshot_cas_rule.use_release_controlling_watermark_change_precedence = 'terminal_invalidated_before_use_outcome_before_generic_hold'
const customerOrigin = r20.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery
customerOrigin.result_ref_field = 'terminal_consumption_ref'
customerOrigin.result_fingerprint_ref = 'fingerprint_schemas.operation_result_payload'
customerOrigin.result_fingerprint_field = 'result_payload_fingerprint'
customerOrigin.selected_result_schema_version = 'result_payload_schemas.use_release.variants.pending_delivery.schema_version'
customerOrigin.lineage_rule = 'source_operation_result_fingerprint_equals_the_universal_operation_result_payload_fingerprint_under_the_selected_result_schema_version'
r20.outbox.genesis_protocol.exact_equalities = [
  'origin_source_operation_ref_class_selected_result_schema_version_result_ref_universal_result_fingerprint_and_successful_branch_equal_the_exact_committed_successful_operation_result',
  ...r20.outbox.genesis_protocol.exact_equalities.slice(1),
]
r20.outbox.effect_origin_schema.properties.source_operation_result_fingerprint.description = 'universal_operation_result_payload_fingerprint'
r20.outbox.effect_origin_schema.conditional_rules = [
  'source_operation_ref_resolves_to_one_exact_committed_success_registry_row_whose_operation_class_selected_result_schema_result_ref_universal_result_fingerprint_and_branch_equal_this_origin',
  'provider_operation_class_and_provider_target_fingerprint_equal_the_effect_provider_identity_and_current_capability_registry_target',
]

// Committed holds have one authoritative row and content-bearing blob. Replay is exhaustive and historical.
r20.operation_registry.committed_hold_row_schema = closed('ctrl.g24.operation-registry-committed-hold.r20.v1', {
  workspace_ref: id, operation_id: id, state: { const: 'committed_hold' }, stable_principal_ref: id,
  case_derived_subject: id, requested_case_ref: id, operation_class: { type: 'enum', values: [...r20.operation_names] },
  request_fingerprint: fp, intent_fingerprint: fp, response_schema_version: id, canonical_hold_response_bytes_ref: id,
  response_fingerprint: fp, hold_code: { enum_ref: 'hold_codes' }, evaluation_fingerprint: fp,
  audience: id, retention_class: id, committed_at: ts, committed_hold_fingerprint: fp,
}, {
  append_only: true, unique_keys: [['workspace_ref', 'operation_id']],
  conditional_rules: [
    'canonical_hold_response_bytes_ref_resolves_exactly_one_operation_hold_blob_in_the_same_workspace',
    'hold_blob_fields_equal_the_committed_hold_row_byte_for_byte',
    'committed_hold_fingerprint_equals_recomputed_complete_hold_row_preimage',
    'no_result_blob_protected_effect_or_outbox_exists_for_committed_hold',
  ],
  fingerprint_ref: 'fingerprint_schemas.operation_registry_committed_hold', fingerprint_field: 'committed_hold_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true,
})
r20.fingerprint_schemas.operation_registry_committed_hold = fingerprint('CTRL-G24-OPERATION-REGISTRY-COMMITTED-HOLD-R20', Object.keys(r20.operation_registry.committed_hold_row_schema.properties).filter(field => field !== 'committed_hold_fingerprint'))
r20.operation_hold_blob_store = {
  schema_version: 'ctrl.g24.operation-hold-blob-store.r20.v1',
  row_schema: closed('ctrl.g24.operation-hold-blob.r20.v1', {
    workspace_ref: id, canonical_hold_response_bytes_ref: id, operation_id: id,
    operation_class: { type: 'enum', values: [...r20.operation_names] }, response_schema_version: id,
    canonical_hold_response_b64url: b64, canonical_hold_response_byte_length: uint,
    canonical_hold_response_bytes_sha256: fp, hold_code: { enum_ref: 'hold_codes' }, evaluation_fingerprint: fp,
    response_fingerprint: fp, committed_at: ts, hold_blob_fingerprint: fp,
  }, {
    append_only: true, unique_keys: [['workspace_ref', 'canonical_hold_response_bytes_ref']],
    conditional_rules: [
      'decoded_b64url_length_and_sha256_equal_the_exact_stored_bytes',
      'decoded_bytes_equal_exact_canonical_json_utf8_encoding_for_response_union.schemas.held',
      'parsed_operation_id_operation_class_hold_code_evaluation_fingerprint_and_committed_at_equal_the_row_fields',
      'response_fingerprint_equals_recomputed_canonical_operation_response_payload_fingerprint',
      'hold_blob_fingerprint_equals_recomputed_complete_blob_preimage',
    ],
    fingerprint_ref: 'fingerprint_schemas.operation_hold_blob', fingerprint_field: 'hold_blob_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true,
  }),
  canonicalization_ref: 'canonical_json_utf8_encoding', one_row_per_reference: true, mutation_or_rebinding: 'forbidden',
}
r20.fingerprint_schemas.operation_hold_blob = fingerprint('CTRL-G24-OPERATION-HOLD-BLOB-R20', Object.keys(r20.operation_hold_blob_store.row_schema.properties).filter(field => field !== 'hold_blob_fingerprint'))
r20.operation_registry.committed_hold_blob_derivation = {
  row_schema_ref: 'operation_registry.committed_hold_row_schema', blob_schema_ref: 'operation_hold_blob_store.row_schema',
  unique_lookup: 'workspace_ref_and_operation_id_resolve_exactly_one_committed_hold_row_then_canonical_hold_response_bytes_ref_resolves_exactly_one_hold_blob',
  exact_equalities: [
    'hold_row.workspace_ref_equals_hold_blob.workspace_ref', 'hold_row.operation_id_equals_hold_blob.operation_id',
    'hold_row.operation_class_equals_hold_blob.operation_class', 'hold_row.response_schema_version_equals_hold_blob.response_schema_version',
    'hold_row.hold_code_equals_hold_blob.hold_code', 'hold_row.evaluation_fingerprint_equals_hold_blob.evaluation_fingerprint',
    'hold_row.response_fingerprint_equals_hold_blob.response_fingerprint', 'hold_row.committed_at_equals_hold_blob.committed_at',
  ],
  commit_atomicity: 'hold_blob_and_committed_hold_row_commit_in_one_serializable_transaction_or_none_exists',
  any_missing_duplicate_corrupt_schema_parse_hash_or_fingerprint_mismatch: 'hold_without_response_and_without_protected_effect',
}
r20.operation_registry.stored_hold = Object.keys(r20.operation_registry.committed_hold_row_schema.properties)
r20.operation_registry.replayed_held_derivation = {
  source_hold_schema_ref: 'operation_registry.committed_hold_row_schema', source_hold_blob_schema_ref: 'operation_hold_blob_store.row_schema',
  lookup: 'resolve_exactly_one_committed_hold_by_workspace_ref_and_operation_id_then_its_exact_hold_blob',
  exact_historical_equalities: [
    'replay.operation_id_equals_hold_row.operation_id_equals_hold_blob.operation_id',
    'replay.operation_class_equals_hold_row.operation_class_equals_hold_blob.operation_class',
    'replay.hold_code_equals_hold_row.hold_code_equals_hold_blob.hold_code',
    'replay.evaluation_fingerprint_equals_hold_row.evaluation_fingerprint_equals_hold_blob.evaluation_fingerprint',
    'replay.committed_at_equals_hold_row.committed_at_equals_hold_blob.committed_at',
  ],
  replay_only_derivations: ['status_is_replayed_held', 'replayed_at_is_current_database_transaction_timestamp', 'historical_replay_is_true', 'current_standing_is_false'],
  evaluator_execution: 'forbidden', protected_effect: 'forbidden', mutation: 'forbidden',
  unavailable_duplicate_or_corrupt_row_or_blob: 'replay_hold_without_response',
}
r20.response_union.replayed_held_derivation_ref = 'operation_registry.replayed_held_derivation'
r20.response_union.replayed_held_payload_bytes_equal_original = true

// Case actor identity comes only from the authenticated live server session before registry lookup.
const control = r20.case_authority_control_plane
const req = control.request_schema
const reqProps = { ...req.properties }
delete reqProps.authenticated_actor_ref
replaceProperties(req, reqProps)
r20.fingerprint_schemas.case_authority_control_request = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-REQUEST-R20', Object.keys(req.properties).filter(field => field !== 'request_fingerprint'))
const controlReceipt = r20.case_authority_control_operation_registry.row_schema
const receiptProps = { ...controlReceipt.properties }
delete receiptProps.authenticated_actor_ref
replaceProperties(controlReceipt, {
  workspace_ref: receiptProps.workspace_ref, subject_ref: receiptProps.subject_ref, case_ref: receiptProps.case_ref,
  control_operation_id: receiptProps.control_operation_id, session_actor_ref: id, request_fingerprint: receiptProps.request_fingerprint,
  state: receiptProps.state, prior_row_version_ref: receiptProps.prior_row_version_ref,
  prior_row_envelope_fingerprint: receiptProps.prior_row_envelope_fingerprint,
  new_row_version_ref: receiptProps.new_row_version_ref, new_row_envelope_fingerprint: receiptProps.new_row_envelope_fingerprint,
  effective_at: receiptProps.effective_at, receipt_fingerprint: receiptProps.receipt_fingerprint,
})
controlReceipt.conditional_rules = [
  'receipt.workspace_subject_case_control_operation_id_and_request_fingerprint_equal_the_canonical_request_byte_for_byte',
  'receipt.session_actor_ref_equals_the_server_derived_authenticated_live_session_principal_used_for_admission',
  'prior_fields_are_both_null_for_bootstrap_or_both_equal_the_selected_prior_row_for_rotation',
  'new_row_fields_equal_the_atomically_appended_case_authority_binding_row',
  'effective_at_equals_the_new_row.valid_from_and_the_database_transaction_timestamp',
  'receipt_fingerprint_equals_recomputed_complete_receipt_preimage',
]
r20.fingerprint_schemas.case_authority_control_receipt = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R20', Object.keys(controlReceipt.properties).filter(field => field !== 'receipt_fingerprint'))
r20.case_authority_control_session_actor_derivation = {
  schema_version: 'ctrl.g24.case-authority-control-session-actor-derivation.r20.v1',
  source: 'authenticated_live_server_session_principal',
  timing: 'after_bounded_parse_and_request_fingerprint_validation_but_before_registry_lookup',
  caller_supplied_actor_field: 'forbidden',
  exact_actor: 'stable_actor_ref_from_the_verified_server_session_only',
  replay_rule: 'live_session_actor_ref_equals_original_receipt.session_actor_ref_and_account_is_active_and_not_offboarded_or_revoked',
  fresh_rule: 'live_session_actor_ref_equals_exact_current_case_engagement_operator_ref_and_account_is_active_and_not_offboarded_or_revoked',
  revocation_sources: ['account_revocation_registry', 'operator_offboarding_registry', 'session_revocation_registry'],
  missing_ambiguous_stale_or_revoked_identity: 'fail_closed_without_registry_disclosure_or_write',
}
control.caller_authority = 'server_derived_live_human_session_actor_class_krish_operator_and_stable_actor_ref_equals_the_exact_current_case_binding_engagement_operator_ref_for_fresh_mutation; caller_cannot_assert_actor; no_model_workload_browser_edge_or_generic_service_principal_may_call; bootstrap_is_migration_identity_only'
control.session_actor_derivation_ref = 'case_authority_control_session_actor_derivation'
controlReceipt.unique_keys = [control.idempotency_key]
r20.case_authority_control_operation_registry.replay = 'selected_admission_priority_7_returns_exact_receipt_only_when_live_session_actor_equals_receipt.session_actor_ref_and_revocation_checks_pass_without_any_write'
r20.case_authority_control_operation_registry.collision = 'selected_admission_priority_9_returns_closed_collision_hold_without_any_write'
r20.case_authority_control_pre_admission = {
  schema_version: 'ctrl.g24.case-authority-control-pre-admission.r20.v1',
  raw_request_byte_limit: 65536,
  evaluation: 'first_matching_priority_ascending; terminal_exception_rows_apply_only_if_the_named_failure_occurs_before_a_prior_result_commits',
  rows: [
    { priority: 1, guard: 'raw_request_bytes_exceed_limit', result: 'request_too_large_rejected', registry_lookup: false, write: false },
    { priority: 2, guard: 'bounded_json_parse_fails', result: 'parse_rejected', registry_lookup: false, write: false },
    { priority: 3, guard: 'parsed_request_is_malformed_or_closed_request_schema_validation_fails', result: 'malformed_request_rejected', registry_lookup: false, write: false },
    { priority: 4, guard: 'request_fingerprint_missing_or_mismatch', result: 'request_fingerprint_rejected', registry_lookup: false, write: false },
    { priority: 5, guard: 'live_server_session_principal_missing_invalid_or_ambiguous', result: 'unauthorized_hold', registry_lookup: false, write: false },
    { priority: 6, guard: 'live_session_account_operator_or_session_is_offboarded_or_revoked', result: 'revoked_actor_hold', registry_lookup: false, write: false },
  ],
  then: 'case_authority_control_operation_registry.admission_outcome_table', exhaustive: true,
}
r20.case_authority_control_operation_registry.admission_outcome_table = {
  evaluation: 'after_pre_admission_first_matching_priority_ascending_in_one_serializable_lookup_snapshot_before_any_current_case_or_compare_and_swap_evaluation',
  rows: [
    { priority: 7, guard: 'registry_row_exists_and_request_fingerprint_matches_and_live_session_actor_ref_equals_receipt.session_actor_ref_and_revocation_checks_pass', result: 'replayed_committed', write: false },
    { priority: 8, guard: 'registry_row_exists_and_request_fingerprint_matches_and_live_session_actor_ref_differs_from_receipt.session_actor_ref', result: 'unauthorized_hold', write: false },
    { priority: 9, guard: 'registry_row_exists_and_request_fingerprint_differs', result: 'collision_hold', write: false },
    { priority: 10, guard: 'no_registry_row_and_fresh_current_operator_authority_fails', result: 'unauthorized_hold', write: false },
    { priority: 11, guard: 'no_registry_row_and_expected_current_identity_or_compare_and_swap_fails', result: 'stale_authority_hold', write: false },
    { priority: 12, guard: 'no_registry_row_and_all_fresh_authority_grant_time_revocation_and_compare_and_swap_checks_pass', result: 'committed', write: 'one_new_binding_and_one_registry_receipt_atomically' },
    { priority: 13, guard: 'serializable_retry_budget_exhausted_before_commit', result: 'serialization_hold', write: false },
    { priority: 14, guard: 'unexpected_internal_failure_before_commit', result: 'internal_failure_hold', write: false },
  ],
  exact_key_ref: 'case_authority_control_plane.idempotency_key', exhaustive: true, first_match_exclusive: true,
  pre_admission_ref: 'case_authority_control_pre_admission', no_result_falls_through: true,
}
const rejected = status => closed(`ctrl.g24.case-authority-control-result-${status.replaceAll('_', '-')}.r20.v1`, { status: { const: status }, correlation_id: id })
const held = status => closed(`ctrl.g24.case-authority-control-result-${status.replaceAll('_', '-')}.r20.v1`, { status: { const: status }, evaluation_fingerprint: fp })
r20.case_authority_control_result_union = {
  schema_version: 'ctrl.g24.case-authority-control-result-union.r20.v1', discriminator: 'status',
  variants: {
    request_too_large_rejected: rejected('request_too_large_rejected'),
    parse_rejected: rejected('parse_rejected'),
    malformed_request_rejected: rejected('malformed_request_rejected'),
    request_fingerprint_rejected: rejected('request_fingerprint_rejected'),
    committed: closed('ctrl.g24.case-authority-control-result-committed.r20.v1', { status: { const: 'committed' }, receipt_ref: id, receipt_fingerprint: fp, effective_at: ts }),
    replayed_committed: closed('ctrl.g24.case-authority-control-result-replayed.r20.v1', { status: { const: 'replayed_committed' }, receipt_ref: id, receipt_fingerprint: fp, effective_at: ts }),
    collision_hold: held('collision_hold'), unauthorized_hold: held('unauthorized_hold'), revoked_actor_hold: held('revoked_actor_hold'),
    stale_authority_hold: held('stale_authority_hold'), serialization_hold: held('serialization_hold'), internal_failure_hold: held('internal_failure_hold'),
  },
  committed_and_replayed_equalities: 'receipt_ref_receipt_fingerprint_and_effective_at_equal_the_exact_registry_row',
  rejected_rule: 'pre_admission_rejections_disclose_only_a_server_generated_correlation_id',
  hold_rule: 'holds_disclose_only_one_domain_separated_evaluation_fingerprint_and_no_receipt_binding_or_registry_identity',
  total_result_ref: 'case_authority_control_pre_admission_and_case_authority_control_operation_registry.admission_outcome_table',
}
r20.case_authority_control_hold_fingerprints = {
  schema_version: 'ctrl.g24.case-authority-control-hold-fingerprints.r20.v1',
  variants: Object.fromEntries(['collision_hold', 'unauthorized_hold', 'revoked_actor_hold', 'stale_authority_hold', 'serialization_hold', 'internal_failure_hold'].map(status => [status, fingerprint(`CTRL-G24-CASE-AUTHORITY-CONTROL-${status.replaceAll('_', '-').toUpperCase()}-R20`, [
    'server_correlation_id', 'session_actor_or_unavailable_sentinel', 'workspace_or_unavailable_sentinel', 'subject_or_unavailable_sentinel',
    'case_or_unavailable_sentinel', 'control_operation_id_or_unavailable_sentinel', 'request_fingerprint_or_unavailable_sentinel', 'reason_code',
  ])])),
  exact_selection: 'result_status_selects_exactly_one_matching_domain_and_preimage',
  unavailable_fields: 'domain_separated_literal_unavailable_sentinel',
  disclosure: 'evaluation_fingerprint_only',
}
control.pre_admission_ref = 'case_authority_control_pre_admission'
control.result_union_ref = 'case_authority_control_result_union'
control.hold_fingerprint_ref = 'case_authority_control_hold_fingerprints'

// Lifecycle property keys require byte-exact equality to the one canonical reference key.
r20.lifecycle_vocabulary_contract.predecessor_ref_exception = 'property_key_is_legal_only_when_byte_equal_to_predecessor_lifecycle_version_ref; string_values_may_use_the_exact_reference_followed_only_by_end_whitespace_dot_comma_semicolon_colon_or_closing_bracket; identifier_hyphen_and_property_key_punctuation_extensions_are_invalid'

bumpChangedSchemas()
for (const name of r20.operation_names) {
  r20.operation_specs[name].result_schema = r20.result_payload_schemas[name].schema_version
  r20.evaluator_abi.operation_result_exports[name] = r20.result_payload_schemas[name].schema_version
}
replaceProperties(r20.evaluator_abi.operation_result_exports_schema, Object.fromEntries(r20.operation_names.map(name => [name, { const: r20.result_payload_schemas[name].schema_version }])))
bumpChangedSchemas(); repairEmbeddedSelfVersions(); bumpChangedSchemas()
const beforeNodes = schemaNodes(frozenR19)
const changes = []
for (const [path, after] of schemaNodes(r20)) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r20.')) throw new Error(`changed_schema_without_r20_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r20.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R19_and_materialized_R20_plus_release_dag_legacy_removal_hold_replay_session_actor_total_case_results_and_exact_lifecycle_key_checks',
  changes, every_changed_or_new_schema_must_have_r20_version: true,
  dependency_parity_checks: [
    'release_terminal_identity_is_acyclic_precommit_then_universal_result_then_terminal_semantic_then_envelope',
    'sole_terminal_consumption_replaces_every_active_legacy_branch_receipt_and_outbox_uses_selected_schema_plus_universal_result_fingerprint',
    'committed_hold_row_and_blob_are_closed_unique_fingerprinted_atomic_and_replayed_exhaustively_or_fail_closed',
    'case_actor_is_server_session_derived_before_lookup_and_replay_or_fresh_mutation_fail_closed_on_revocation',
    'case_control_pre_admission_and_registry_outcomes_are_total_ordered_closed_and_every_hold_has_one_domain_separated_fingerprint',
    'lifecycle_reference_property_keys_require_exact_byte_equality_without_punctuation_or_identifier_suffixes',
  ],
}
r20.required_negative_fixture_families = [...new Set([...r20.required_negative_fixture_families,
  'acyclic_release_terminal_precommit_identity', 'no_active_legacy_release_branch_receipts', 'universal_outbox_result_lineage',
  'authoritative_committed_hold_and_exhaustive_replay', 'server_session_case_actor_and_revocation',
  'total_case_control_pre_admission_and_domain_separated_holds', 'exact_lifecycle_reference_property_key',
])]
r20.claim_limit = 'unimplemented_local_effective_contract_only'
const legacyHits = stringHits(r20, ['release_use_receipt', 'release_projection_invalidation_receipt', 'release_invalidation_receipt', 'invalidation_receipt_ref'])
if (legacyHits.length) throw new Error(`active_legacy_release_receipt_vocabulary:${legacyHits.join('|')}`)
assertSerializable(r20)
export const materializedR20 = r20
export const materializedR20Output = `${JSON.stringify(r20, null, 2)}\n`
export const materializedR20Path = outputPath
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR20Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR20Output) process.exitCode = 1; else console.log(`ok: ${outputPath} is the exact fully materialized R20 effective contract`) }
  else process.stdout.write(materializedR20Output)
}
