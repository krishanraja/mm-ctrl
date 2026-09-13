import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR32 } from './materialize-ctrl-g24-trusted-ingress-r32.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r32.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r33.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r33 = structuredClone(materializedR32)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }, ts = { type: 'canonical_timestamp' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value, before) { const out = {}; for (const [name, spec] of Object.entries(schema.properties)) { if (name === before) out[key] = value; out[name] = spec } if (!Object.hasOwn(out, key)) out[key] = value; schema.properties = out; schema.exact_keys = Object.keys(out); schema.required = schema.exact_keys.filter(name => !(schema.optional ?? []).includes(name)) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function bump(value) { return value?.replace(/\.r\d+\./, '.r33.') }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r33.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function canonicalStore(family, schemaRef, maxBytes) { return { schema_version: `ctrl.g24.${family.replaceAll('_', '-')}-artifact-store.r33.v1`, canonical_schema_ref: schemaRef, row_schema: closed(`ctrl.g24.${family.replaceAll('_', '-')}-artifact-row.r33.v1`, { artifact_ref: fp, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64, canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact_r31', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes, canonical_validation: 'decode_base64url_verify_limit_exact_length_and_sha256_parse_exact_resolved_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', content_address_rule: 'artifact_ref_equals_canonical_bytes_sha256', named_derivation_operands: [{ derivation: 'content_address_rule', operands: ['artifact_ref', 'canonical_bytes_sha256'] }] }), sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_replay_or_audit_reference_exists', restart_failure: 'hold_without_response_or_write' } }

// Remove inherited compound prose that can be read as reverse evidence authority.
function normalizeReverseClauses(value) {
  if (typeof value === 'string') { let next = value.replaceAll('_and_result', '_plus_result'); if (/evidence.*result|result.*evidence/i.test(next)) next = next.replaceAll('result', 'outcome').replaceAll('Result', 'Outcome'); return { value: next, changed: next !== value } }
  if (!value || typeof value !== 'object') return { value, changed: false }
  if (Array.isArray(value)) { let changed = false; for (let i = 0; i < value.length; i += 1) { const next = normalizeReverseClauses(value[i]); value[i] = next.value; changed ||= next.changed } return { value, changed } }
  let changed = false
  for (const key of Object.keys(value)) {
    const next = normalizeReverseClauses(value[key]); value[key] = next.value; changed ||= next.changed
    if (key.includes('_and_result')) { const renamed = key.replaceAll('_and_result', '_plus_result'); value[renamed] = value[key]; delete value[key]; changed = true }
  }
  if (changed && typeof value.schema_version === 'string') value.schema_version = bump(value.schema_version)
  return { value, changed }
}
normalizeReverseClauses(r33)

r33.schema_version = 'ctrl.g24.trusted-ingress.r33.effective.v1'
r33.status = 'thirty_second_repair_candidate_under_independent_review'
r33.supersedes = { commit: '6d08ade0766d843c1a724b57da3ecec1637ac0a1', tree: 'b9beba3ade0c98371f894aa6acebe6184b52af07', human_blob: '3f8d1a53ced68757d9da734cc747cbe9694aac48', machine_blob: 'd0eb74c71e64e78768463f353959142fd1cd40f0', qa_blob: 'bfd4d40034350ea84709b7757976727ff9f44114', checker_blob: '37ccb33994ca1096a98abe3bbdc8e71d3a3c5d4f', materializer_blob: 'e2992bd111ffad124593947982e29e3db833a110', founder_checker_blob: '52b006e1497898521a35507ca9d3d71a2680ccae', adjudication: 'veto' }
r33.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r33.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r33.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const resultBranches = ['committed', ...heldBranches]

// Committed results reference only a server-derived receipt precommit identity.
for (const [operationName, operation] of Object.entries(operations)) {
  const committed = operation.result_schema.variants.committed
  remove(committed, 'receipt_fingerprint')
  committed.properties.receipt_ref = fp
  add(committed, 'receipt_precommit_fingerprint', fp, 'committed_at')
  committed.schema_version = bump(committed.schema_version)
  committed.exact_equalities = ['receipt_ref_and_receipt_precommit_fingerprint_equal_server_issued_precommit_identity', 'committed_outcome_contains_no_final_receipt_fingerprint', 'outcome_identity_precedes_final_receipt_fingerprint']
  for (const branch of heldBranches) {
    const held = operation.result_schema.variants[branch]
    held.schema_version = bump(held.schema_version)
    held.exact_equalities = ['hold_row_ref_resolves_exact_precommit_hold_identity', 'held_at_equals_precommit_hold_then_final_hold_then_held_registry', 'preoutcome_evidence_triple_when_present_is_exact_and_contains_no_outcome_or_final_hold_identity', 'outcome_operation_branch_and_operation_id_match_precommit_hold_identity']
  }
  operation.result_schema.schema_version = bump(operation.result_schema.schema_version)
  operation.result_fingerprint = fingerprint(`CTRL-G24-${operationName.replaceAll('_', '-').toUpperCase()}-RESULT-R33`, ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256'])
  operation.result_fingerprint.branch_payload_rule = 'hash_exact_selected_R33_variant_keys_in_schema_order_excluding_outcome_fingerprint_with_receipt_precommit_identity_on_committed_and_hold_row_ref_on_held'
  operation.schema_version = bump(operation.schema_version)
}

const receiptVariants = r33.authority_operation_receipt_store.row_union.variants
const receiptPlans = [
  ['ordinary_single_proof_committed', 'ordinary', 'CTRL-G24-AUTHORITY-OPERATION-RECEIPT-PRECOMMIT-ORDINARY-R33', 'CTRL-G24-AUTHORITY-OPERATION-RECEIPT-FINAL-ORDINARY-R33'],
  ['session_dual_proof_committed', 'session', 'CTRL-G24-AUTHORITY-OPERATION-RECEIPT-PRECOMMIT-SESSION-R33', 'CTRL-G24-AUTHORITY-OPERATION-RECEIPT-FINAL-SESSION-R33'],
]
const receiptIdentityPlans = {}
for (const [variantName, shortName, precommitDomain, finalDomain] of receiptPlans) {
  const receipt = receiptVariants[variantName]
  receipt.properties.receipt_ref = fp
  add(receipt, 'receipt_precommit_fingerprint', fp, 'receipt_kind')
  receipt.schema_version = bump(receipt.schema_version)
  const excluded = ['receipt_ref', 'receipt_precommit_fingerprint', 'result_branch', 'result_bytes_ref', 'result_bytes_sha256', 'result_fingerprint', 'receipt_fingerprint']
  const precommitFields = receipt.exact_keys.filter(key => !excluded.includes(key))
  r33.fingerprint_schemas[`authority_operation_receipt_precommit_${shortName}_r33`] = fingerprint(precommitDomain, ['receipt_ref', ...precommitFields])
  r33.fingerprint_schemas[`authority_operation_receipt_final_${shortName}_r33`] = fingerprint(finalDomain, receipt.exact_keys.filter(key => key !== 'receipt_fingerprint'))
  receipt.fingerprint_ref = `fingerprint_schemas.authority_operation_receipt_final_${shortName}_r33`
  receipt.receipt_ref_preimage_fields = precommitFields
  receipt.receipt_ref_preimage_excluded_fields = excluded
  receipt.receipt_ref_derivation = 'receipt_ref_equals_sha256_of_exact_canonical_precommit_payload_before_receipt_ref_precommit_fingerprint_and_outcome_fields'
  receipt.receipt_precommit_fingerprint_ref = `fingerprint_schemas.authority_operation_receipt_precommit_${shortName}_r33`
  receipt.finalization_rule = 'after_outcome_triple_exists_append_exact_outcome_triple_then_compute_final_receipt_fingerprint_without_changing_receipt_ref_or_precommit_fingerprint'
  receipt.exact_equalities = [...new Set((receipt.exact_equalities ?? []).concat(['outcome_receipt_ref_and_precommit_fingerprint_equal_committed_outcome', 'final_receipt_outcome_triple_equals_exact_committed_outcome_artifact']))]
  receiptIdentityPlans[variantName] = { receipt_schema_ref: `authority_operation_receipt_store.row_union.variants.${variantName}`, receipt_ref_preimage_fields: precommitFields, precommit_fingerprint_ref: receipt.receipt_precommit_fingerprint_ref, final_fingerprint_ref: receipt.fingerprint_ref }
}
delete r33.fingerprint_schemas.authority_operation_receipt_ordinary_r28
delete r33.fingerprint_schemas.authority_operation_receipt_session_r32
r33.authority_operation_receipt_store.schema_version = 'ctrl.g24.authority-operation-receipt-store.r33.v1'
r33.authority_operation_receipt_store.row_union.schema_version = 'ctrl.g24.authority-operation-receipt-row-union.r33.v1'
r33.authority_operation_receipt_precommit_identity_plans = { schema_version: 'ctrl.g24.authority-operation-receipt-precommit-plans.r33.v1', variants: receiptIdentityPlans, caller_receipt_identity_authority: 'none', issuance: ['assemble_server_validated_precommit_fields', 'derive_receipt_ref', 'compute_receipt_precommit_fingerprint', 'compute_committed_outcome', 'compute_final_receipt_fingerprint'], immutable_after_precommit: ['receipt_ref', 'receipt_precommit_fingerprint'] }

// Session evidence precedes the hold-row content address because it is part of that preimage.
const holdVariants = r33.authority_operation_hold_store.row_union.variants
for (const [kind, hold] of Object.entries(holdVariants)) {
  hold.schema_version = bump(hold.schema_version)
  hold.row_ref_preimage_included_fields = hold.exact_keys.filter(key => !hold.row_ref_preimage_excluded_fields.includes(key))
  hold.precommit_required_inputs = kind === 'session_dual_proof' ? ['session_hold_evidence_ref', 'session_hold_evidence_bytes_sha256', 'session_hold_evidence_fingerprint', 'held_at'] : ['raw_target_availability', 'raw_target_ref_or_unavailable', 'raw_target_sha256_or_unavailable', 'held_at']
  hold.finalization_rule = 'after_outcome_triple_exists_append_exact_outcome_triple_then_compute_final_hold_fingerprint_without_changing_hold_row_ref_or_held_at'
  hold.field_dependency_edges = kind === 'session_dual_proof' ? [['session_hold_evidence_ref', 'hold_row_ref'], ['session_hold_evidence_bytes_sha256', 'hold_row_ref'], ['session_hold_evidence_fingerprint', 'hold_row_ref'], ['held_at', 'hold_row_ref'], ['hold_row_ref', 'result_fingerprint'], ['result_ref', 'hold_fingerprint'], ['result_bytes_sha256', 'hold_fingerprint'], ['result_fingerprint', 'hold_fingerprint']] : [['held_at', 'hold_row_ref'], ['request_fingerprint', 'hold_row_ref'], ['hold_row_ref', 'result_fingerprint'], ['result_ref', 'hold_fingerprint'], ['result_bytes_sha256', 'hold_fingerprint'], ['result_fingerprint', 'hold_fingerprint']]
  const shortName = kind === 'ordinary_single_proof' ? 'ordinary' : 'session'
  r33.fingerprint_schemas[`authority_operation_hold_${shortName}_r33`] = fingerprint(`CTRL-G24-AUTHORITY-OPERATION-HOLD-${shortName.toUpperCase()}-R33`, hold.exact_keys.filter(key => key !== 'hold_fingerprint'))
  hold.fingerprint_ref = `fingerprint_schemas.authority_operation_hold_${shortName}_r33`
}
delete r33.fingerprint_schemas.authority_operation_hold_ordinary_r32
delete r33.fingerprint_schemas.authority_operation_hold_session_r32
r33.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r33.v1'
r33.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r33.v1'

r33.authority_operation_identity_dependency_graph = {
  schema_version: 'ctrl.g24.authority-operation-identity-dependency-graph.r33.v1',
  nodes: ['validated_precommit_material', 'receipt_ref', 'receipt_precommit_fingerprint', 'session_hold_evidence_fingerprint', 'hold_row_ref', 'result_ref', 'result_fingerprint', 'receipt_fingerprint', 'hold_fingerprint', 'registry_fingerprint', 'historical_response_fingerprint', 'replay_payload_fingerprint', 'replay_envelope_fingerprint'],
  edges: [['validated_precommit_material', 'receipt_ref'], ['receipt_ref', 'receipt_precommit_fingerprint'], ['receipt_precommit_fingerprint', 'result_fingerprint'], ['session_hold_evidence_fingerprint', 'hold_row_ref'], ['hold_row_ref', 'result_fingerprint'], ['result_ref', 'receipt_fingerprint'], ['result_fingerprint', 'receipt_fingerprint'], ['result_ref', 'hold_fingerprint'], ['result_fingerprint', 'hold_fingerprint'], ['receipt_fingerprint', 'registry_fingerprint'], ['hold_fingerprint', 'registry_fingerprint'], ['result_fingerprint', 'historical_response_fingerprint'], ['registry_fingerprint', 'replay_payload_fingerprint'], ['historical_response_fingerprint', 'replay_payload_fingerprint'], ['replay_payload_fingerprint', 'replay_envelope_fingerprint']],
  branch_paths: { committed: ['validated_precommit_material', 'receipt_ref', 'receipt_precommit_fingerprint', 'result_fingerprint', 'receipt_fingerprint', 'registry_fingerprint', 'historical_response_fingerprint', 'replay_payload_fingerprint', 'replay_envelope_fingerprint'], session_hold: ['session_hold_evidence_fingerprint', 'hold_row_ref', 'result_fingerprint', 'hold_fingerprint', 'registry_fingerprint', 'historical_response_fingerprint', 'replay_payload_fingerprint', 'replay_envelope_fingerprint'] },
  generic_cycle_detection_required: true, missing_required_edge_action: 'reject_materialization_and_hold_runtime',
}
r33.authority_operation_hold_issuance_dag = { schema_version: 'ctrl.g24.authority-operation-hold-issuance-dag.r33.v1', nodes: ['select_branch_inputs', 'build_preoutcome_evidence', 'store_preoutcome_evidence', 'compute_hold_row_ref_with_evidence', 'compute_and_store_outcome', 'compute_final_hold_fingerprint', 'store_final_hold_and_registry', 'store_historical_response', 'store_replay_payload_and_envelope', 'atomic_commit'], edges: [['select_branch_inputs', 'build_preoutcome_evidence'], ['build_preoutcome_evidence', 'store_preoutcome_evidence'], ['store_preoutcome_evidence', 'compute_hold_row_ref_with_evidence'], ['compute_hold_row_ref_with_evidence', 'compute_and_store_outcome'], ['compute_and_store_outcome', 'compute_final_hold_fingerprint'], ['compute_final_hold_fingerprint', 'store_final_hold_and_registry'], ['compute_and_store_outcome', 'store_historical_response'], ['store_final_hold_and_registry', 'store_replay_payload_and_envelope'], ['store_historical_response', 'store_replay_payload_and_envelope'], ['store_replay_payload_and_envelope', 'atomic_commit']], session_evidence_precedes_hold_row_ref: true, hold_row_ref_precedes_outcome: true, final_hold_fingerprint_follows_outcome: true, acyclic_required: true }

r33.authority_operation_committed_issuance_dag = { schema_version: 'ctrl.g24.authority-operation-committed-issuance-dag.r33.v1', nodes: ['select_and_validate_request_target_proof_authority', 'assemble_receipt_precommit_payload', 'derive_receipt_ref', 'compute_receipt_precommit_fingerprint', 'compute_and_store_committed_outcome', 'finalize_receipt_with_outcome_triple', 'compute_final_receipt_fingerprint', 'store_receipt_registry_history_and_replay', 'atomic_commit'], edges: [['select_and_validate_request_target_proof_authority', 'assemble_receipt_precommit_payload'], ['assemble_receipt_precommit_payload', 'derive_receipt_ref'], ['derive_receipt_ref', 'compute_receipt_precommit_fingerprint'], ['compute_receipt_precommit_fingerprint', 'compute_and_store_committed_outcome'], ['compute_and_store_committed_outcome', 'finalize_receipt_with_outcome_triple'], ['finalize_receipt_with_outcome_triple', 'compute_final_receipt_fingerprint'], ['compute_final_receipt_fingerprint', 'store_receipt_registry_history_and_replay'], ['store_receipt_registry_history_and_replay', 'atomic_commit']], result_final_receipt_fields_forbidden: ['receipt_fingerprint'], generic_cycle_detection_ref: 'authority_operation_identity_dependency_graph', acyclic_required: true }

// Registry rows become the sole source for replay operation, branch, outcome, history and hold identity.
const committedRegistry = r33.authority_operation_registry.row_union.variants.original_committed
add(committedRegistry, 'operation_name', { type: 'enum', values: operationNames }, 'operation_id')
committedRegistry.properties.receipt_ref = fp
add(committedRegistry, 'receipt_precommit_fingerprint', fp, 'receipt_fingerprint')
committedRegistry.schema_version = bump(committedRegistry.schema_version)
committedRegistry.exact_equalities = ['operation_name_operation_id_branch_outcome_history_and_receipt_triples_equal_exact_committed_outcome_receipt_and_historical_response', 'registry_row_ref_is_canonical_content_address_of_exact_registry_identity_preimage']
r33.fingerprint_schemas.authority_operation_registry_committed_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R33', committedRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
committedRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_committed_r33'
const heldRegistry = r33.authority_operation_registry.row_union.variants.original_persisted_hold
add(heldRegistry, 'operation_name', { type: 'enum', values: operationNames }, 'operation_id')
heldRegistry.schema_version = bump(heldRegistry.schema_version)
heldRegistry.exact_equalities = ['operation_name_operation_id_hold_branch_hold_row_outcome_history_and_held_at_equal_exact_final_hold_and_historical_response', 'session_hold_evidence_triple_or_ordinary_UNAVAILABLE_literals_equal_exact_final_hold']
r33.fingerprint_schemas.authority_operation_registry_held_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R33', heldRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
heldRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_held_r33'
r33.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r33.v1'
r33.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r33.v1'

const replayUnion = r33.authority_operation_replay_payload_schema
const committedReplay = replayUnion.variants.replayed
const heldReplay = replayUnion.variants.replayed_held
add(committedReplay, 'historical_result_branch', { const: 'committed' }, 'historical_result_ref')
add(heldReplay, 'historical_result_branch', { type: 'enum', values: heldBranches }, 'historical_result_ref')
add(heldReplay, 'held_at', ts, 'payload_fingerprint')
committedReplay.schema_version = bump(committedReplay.schema_version)
heldReplay.schema_version = bump(heldReplay.schema_version)
committedReplay.exact_equalities = ['every_copied_field_equals_authoritative_committed_registry_and_resolved_artifacts']
heldReplay.exact_equalities = ['every_copied_field_equals_authoritative_held_registry_exact_hold_row_and_resolved_artifacts']
replayUnion.schema_version = 'ctrl.g24.authority-operation-replay-payload-union.r33.v1'
r33.fingerprint_schemas.authority_operation_replay_payload_committed_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-COMMITTED-R33', committedReplay.exact_keys.filter(key => key !== 'payload_fingerprint'))
r33.fingerprint_schemas.authority_operation_replay_payload_held_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-HELD-R33', heldReplay.exact_keys.filter(key => key !== 'payload_fingerprint'))
committedReplay.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_payload_committed_r33'
heldReplay.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_payload_held_r33'
delete r33.fingerprint_schemas.authority_operation_replay_payload_committed_r32
delete r33.fingerprint_schemas.authority_operation_replay_payload_held_r32
r33.authority_operation_replay_payload_artifact_store = canonicalStore('authority_operation_replay_payloads', 'authority_operation_replay_payload_schema', 131072)

const envelope = r33.authority_operation_replay_envelope_schema
add(envelope, 'historical_result_branch', { type: 'enum', values: resultBranches }, 'payload_ref')
envelope.schema_version = bump(envelope.schema_version)
envelope.exact_equalities = ['operation_name_operation_id_branch_and_replay_kind_equal_exact_payload', 'payload_ref_hash_and_fingerprint_resolve_exact_payload_artifact', 'response_ref_hash_and_fingerprint_equal_payload_history_and_resolve_exact_historical_response_artifact', 'returned_response_bytes_equal_resolved_historical_response_bytes']
r33.fingerprint_schemas.authority_operation_replay_envelope_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-ENVELOPE-R33', envelope.exact_keys.filter(key => key !== 'envelope_fingerprint'))
envelope.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_envelope_r33'
delete r33.fingerprint_schemas.authority_operation_replay_envelope_r32
r33.authority_operation_replay_envelope_artifact_store = canonicalStore('authority_operation_replay_envelopes', 'authority_operation_replay_envelope_schema', 131072)

r33.authority_operation_replay_registry_authority = { schema_version: 'ctrl.g24.authority-operation-replay-registry-authority.r33.v1', committed: [
  { payload_field: 'operation_name', registry_field: 'operation_name' }, { payload_field: 'operation_id', registry_field: 'operation_id' }, { payload_field: 'historical_result_branch', registry_field: 'result_branch' }, { payload_field: 'historical_result_ref', registry_field: 'result_ref' }, { payload_field: 'historical_result_bytes_sha256', registry_field: 'result_bytes_sha256' }, { payload_field: 'historical_result_fingerprint', registry_field: 'result_fingerprint' }, { payload_field: 'stored_historical_response_ref', registry_field: 'historical_response_ref' }, { payload_field: 'stored_historical_response_bytes_sha256', registry_field: 'historical_response_bytes_sha256' }, { payload_field: 'stored_historical_response_fingerprint', registry_field: 'historical_response_fingerprint' }, { payload_field: 'committed_registry_row_ref', registry_field: 'registry_row_ref' }, { payload_field: 'committed_registry_row_fingerprint', registry_field: 'registry_fingerprint' },
], held: [
  { payload_field: 'operation_name', registry_field: 'operation_name' }, { payload_field: 'operation_id', registry_field: 'operation_id' }, { payload_field: 'historical_result_branch', registry_field: 'hold_branch' }, { payload_field: 'historical_result_ref', registry_field: 'hold_result_ref' }, { payload_field: 'historical_result_bytes_sha256', registry_field: 'hold_result_bytes_sha256' }, { payload_field: 'historical_result_fingerprint', registry_field: 'hold_result_fingerprint' }, { payload_field: 'stored_historical_response_ref', registry_field: 'historical_response_ref' }, { payload_field: 'stored_historical_response_bytes_sha256', registry_field: 'historical_response_bytes_sha256' }, { payload_field: 'stored_historical_response_fingerprint', registry_field: 'historical_response_fingerprint' }, { payload_field: 'held_registry_row_ref', registry_field: 'registry_row_ref' }, { payload_field: 'held_registry_row_fingerprint', registry_field: 'registry_fingerprint' }, { payload_field: 'hold_row_ref', registry_field: 'hold_row_ref' }, { payload_field: 'hold_row_fingerprint', registry_field: 'hold_fingerprint' }, { payload_field: 'held_at', registry_field: 'held_at' },
], held_hold_row_equalities: [{ registry_field: 'operation_name', hold_field: 'operation_name' }, { registry_field: 'operation_id', hold_field: 'operation_id' }, { registry_field: 'hold_branch', hold_field: 'hold_branch' }, { registry_field: 'hold_row_ref', hold_field: 'hold_row_ref' }, { registry_field: 'hold_fingerprint', hold_field: 'hold_fingerprint' }, { registry_field: 'hold_result_ref', hold_field: 'result_ref' }, { registry_field: 'hold_result_bytes_sha256', hold_field: 'result_bytes_sha256' }, { registry_field: 'hold_result_fingerprint', hold_field: 'result_fingerprint' }, { registry_field: 'held_at', hold_field: 'held_at' }], historical_response_equalities: {
  committed: [{ registry_field: 'operation_name', history_field: 'operation_name' }, { registry_field: 'operation_id', history_field: 'operation_id' }, { registry_field: 'result_branch', history_field: 'result_branch' }, { registry_field: 'result_ref', history_field: 'result_ref' }, { registry_field: 'result_bytes_sha256', history_field: 'result_bytes_sha256' }, { registry_field: 'result_fingerprint', history_field: 'result_fingerprint' }, { registry_field: 'historical_response_fingerprint', history_field: 'response_fingerprint' }],
  held: [{ registry_field: 'operation_name', history_field: 'operation_name' }, { registry_field: 'operation_id', history_field: 'operation_id' }, { registry_field: 'hold_branch', history_field: 'result_branch' }, { registry_field: 'hold_result_ref', history_field: 'result_ref' }, { registry_field: 'hold_result_bytes_sha256', history_field: 'result_bytes_sha256' }, { registry_field: 'hold_result_fingerprint', history_field: 'result_fingerprint' }, { registry_field: 'historical_response_fingerprint', history_field: 'response_fingerprint' }],
  response_artifact: [{ registry_field: 'historical_response_ref', artifact_field: 'artifact_ref' }, { registry_field: 'historical_response_bytes_sha256', artifact_field: 'canonical_bytes_sha256' }, { registry_field: 'historical_response_fingerprint', decoded_history_field: 'response_fingerprint' }],
  outcome_artifact: [{ history_field: 'result_ref', decoded_outcome_field: 'result_ref' }, { history_field: 'result_bytes_sha256', artifact_field: 'canonical_bytes_sha256' }, { history_field: 'result_fingerprint', decoded_outcome_field: 'result_fingerprint' }, { history_field: 'response_payload_ref', artifact_field: 'artifact_ref' }, { history_field: 'response_payload_bytes_sha256', artifact_field: 'canonical_bytes_sha256' }],
}, source_precedence: ['resolve_exact_registry_row', 'resolve_exact_hold_row_when_held', 'resolve_exact_outcome_artifact', 'resolve_exact_historical_response_artifact', 'assemble_payload_only_from_resolved_authorities'], abc_splice_rule: 'operation_outcome_history_and_hold_must_all_resolve_from_one_registry_identity_or_replay_holds_without_disclosure' }

const lookupUnion = r33.authority_operation_pre_materialized_replay_lookup_store.row_union
for (const variant of Object.values(lookupUnion.variants)) variant.schema_version = bump(variant.schema_version)
lookupUnion.schema_version = 'ctrl.g24.authority-operation-replay-lookup-union.r33.v1'
r33.authority_operation_pre_materialized_replay_lookup_store.schema_version = 'ctrl.g24.authority-operation-pre-materialized-replay-lookup-store.r33.v1'
const committedLookup = lookupUnion.variants.committed, heldLookup = lookupUnion.variants.held
committedLookup.exact_equalities = ['registry_identity_selects_exact_committed_payload_then_payload_and_envelope_ref_hash_fingerprint_triples_resolve_exact_canonical_artifacts']
heldLookup.exact_equalities = ['registry_and_hold_identities_select_exact_held_payload_then_payload_and_envelope_ref_hash_fingerprint_triples_resolve_exact_canonical_artifacts']
r33.fingerprint_schemas.authority_operation_replay_lookup_committed_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-LOOKUP-COMMITTED-R33', committedLookup.exact_keys.filter(key => key !== 'lookup_fingerprint'))
r33.fingerprint_schemas.authority_operation_replay_lookup_held_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-LOOKUP-HELD-R33', heldLookup.exact_keys.filter(key => key !== 'lookup_fingerprint'))
committedLookup.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_lookup_committed_r33'
heldLookup.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_lookup_held_r33'

r33.authority_operation_replay_resolution_bindings.schema_version = 'ctrl.g24.authority-operation-replay-resolution-bindings.r33.v1'
r33.authority_operation_replay_resolution_bindings.registry_authority_ref = 'authority_operation_replay_registry_authority'
r33.authority_operation_replay_resolution_bindings.historical_result_triple[0] = { payload_field: 'historical_result_ref', source_kind: 'selected_result', source_field: 'result_ref' }
r33.authority_operation_replay_resolution_bindings.operation_equalities = ['payload_operation_name_operation_id_and_branch_equal_authoritative_registry', 'historical_response_operation_name_operation_id_branch_outcome_ref_and_outcome_fingerprint_equal_authoritative_registry', 'envelope_operation_name_operation_id_branch_and_replay_kind_equal_payload', 'returned_response_bytes_equal_exact_resolved_historical_response_artifact_bytes']
r33.authority_operation_replay_resolution_bindings.cross_artifact_splicing = 'reject_A_B_C_registry_outcome_history_or_hold_identity_mix_before_return'
r33.authority_operation_replay_derivation.schema_version = 'ctrl.g24.authority-operation-replay-derivation.r33.v1'
r33.authority_operation_replay_derivation.registry_authority_ref = 'authority_operation_replay_registry_authority'
r33.authority_operation_replay_derivation.return_rule = 'resolve_one_registry_identity_then_required_hold_outcome_history_payload_and_envelope_artifacts_then_return_exact_history_bytes'

// Held time and session nonce authority are one exact cross-store join.
r33.held_timestamp_equality_contract = { schema_version: 'ctrl.g24.held-timestamp-equalities.r33.v1', exact_expected_branches: 75, bindings: Object.entries(operations).flatMap(([operationName]) => heldBranches.map(branch => ({ operation_name: operationName, branch, result_field: 'held_at', hold_precommit_field: 'held_at', final_hold_field: 'held_at', held_registry_field: 'held_at', equality: 'byte_for_byte_same_server_timestamp' }))), mismatch_action: 'hold_without_replay_or_disclosure' }
const nonceJoin = role => ({ projection_fields: [`${role}_proof_ref`, `${role}_proof_fingerprint`, `${role}_nonce`, `${role}_nonce_subject_fingerprint`, `${role}_verifier_identity_fingerprint`], nonce_row_fields: ['proof_fingerprint', 'nonce', 'nonce_subject_fingerprint', 'verifier_identity_fingerprint', 'proof_family', 'target_store', 'operation_id', 'consumed_on_branch'], receipt_evidence_fields: [`${role}_proof_ref`, `${role}_proof_fingerprint`, `${role}_nonce_receipt_ref`, `${role}_nonce_receipt_fingerprint`], read_set_fields: [`${role}_proof_ref`, `${role}_proof_fingerprint`, `${role}_nonce_receipt_ref`, `${role}_nonce_receipt_fingerprint`], committed_receipt_fields: [`${role}_proof_ref`, `${role}_proof_fingerprint`, `${role}_nonce_receipt_ref`, `${role}_nonce_receipt_fingerprint`], consuming_hold_evidence_fields: [`${role}_proof_ref`, `${role}_proof_fingerprint`, `${role}_nonce_receipt_ref`, `${role}_nonce_receipt_fingerprint`], exact_role_literal: role })
r33.session_dual_nonce_bundle_join_contract = { schema_version: 'ctrl.g24.session-dual-nonce-bundle-join.r33.v1', issuer: nonceJoin('issuer'), evaluator: nonceJoin('evaluator'), nonce_row_equality_table_ref: 'session_dual_nonce_row_equality_tables', nonce_receipt_resolution: { issuer: { nonce_row_ref_field: 'issuer_nonce_receipt_ref', nonce_row_fingerprint_field: 'issuer_nonce_receipt_fingerprint' }, evaluator: { nonce_row_ref_field: 'evaluator_nonce_receipt_ref', nonce_row_fingerprint_field: 'evaluator_nonce_receipt_fingerprint' } }, bundle_fields: ['operation_name', 'workspace_ref', 'target_partition_fingerprint', 'audience'], request_fields: ['operation_name', 'operation_id', 'target_store', 'target_partition_fingerprint', 'dual_proof_bundle_bytes_ref', 'dual_proof_bundle_bytes_sha256', 'dual_proof_bundle_fingerprint'], exact_two_nonce_rows: true, same_exact_two_rows_required_in: ['session_dual_proof_receipt_evidence_schema', 'case_session_authority_read_set_schema.variants.session_dual_proof', 'authority_operation_receipt_store.row_union.variants.session_dual_proof_committed', 'session_hold_evidence_schema.variants.verified_consuming'], all_refs_hashes_and_fingerprints_must_resolve_same_transaction_artifacts: true, cross_role_or_cross_bundle_splice_action: 'hold_before_outcome_or_return' }

// Rebuild the response matrix and artifact stores for all changed R33 outcome schemas.
const responseMatrix = []
for (const [operationName, operation] of Object.entries(operations)) for (const branch of resultBranches) { const schema = operation.result_schema.variants[branch]; responseMatrix.push({ operation_name: operationName, result_branch: branch, response_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, response_schema_version: schema.schema_version }) }
r33.authority_operation_historical_response_schema.schema_version = 'ctrl.g24.authority-operation-historical-response.r33.v1'
add(r33.authority_operation_historical_response_schema, 'result_bytes_sha256', fp, 'result_fingerprint')
r33.authority_operation_historical_response_schema.exact_equalities = ['operation_and_branch_select_exactly_one_matrix_row', 'all_fields_follow_exact_structured_historical_response_bindings']
r33.fingerprint_schemas.authority_operation_historical_response_r33 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HISTORICAL-RESPONSE-R33', r33.authority_operation_historical_response_schema.exact_keys.filter(key => key !== 'response_fingerprint'))
r33.authority_operation_historical_response_schema.fingerprint_ref = 'fingerprint_schemas.authority_operation_historical_response_r33'
delete r33.fingerprint_schemas.authority_operation_historical_response_r32
r33.authority_operation_historical_response_schema_matrix = { schema_version: 'ctrl.g24.authority-operation-historical-response-schema-matrix.r33.v1', exact_expected_rows: 90, discriminator_order: ['operation_name', 'result_branch'], rows: responseMatrix, selection: 'exactly_one_row_or_hold_before_response_materialization', caller_schema_authority: 'none' }
r33.authority_operation_historical_response_artifact_store = canonicalStore('authority_operation_historical_responses', 'authority_operation_historical_response_schema', 131072)

const resultRefs = responseMatrix.map(row => row.response_schema_ref)
const resultStores = {}
resultRefs.forEach((schemaRef, index) => { const store = canonicalStore('results', schemaRef, 131072); store.schema_version = `ctrl.g24.authority-result-artifact-${index + 1}-store.r33.v1`; store.row_schema.schema_version = `ctrl.g24.authority-result-artifact-${index + 1}-row.r33.v1`; resultStores[`schema_${index + 1}`] = store })
r33.authority_operation_artifact_stores.families.results = { schema_version: 'ctrl.g24.authority-artifact-family-results.r33.v1', expected_schema_refs: resultRefs, stores_by_schema_ref: resultStores }
r33.authority_operation_artifact_stores.schema_version = 'ctrl.g24.authority-operation-artifact-stores.r33.v1'

const tx = r33.authority_operation_serializable_branch_transaction
tx.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r33.v1'
tx.committed_issuance_dag_ref = 'authority_operation_committed_issuance_dag'
tx.hold_issuance_dag_ref = 'authority_operation_hold_issuance_dag'
tx.identity_dependency_graph_ref = 'authority_operation_identity_dependency_graph'
tx.atomicity = 'precommit_material_then_outcome_then_final_receipt_or_hold_registry_history_and_replay_commit_or_none'
tx.crash_rule = 'rollback_all_precommit_outcome_finalization_registry_history_replay_nonce_target_head_and_artifact_writes'
tx.session_hold_evidence_rules = { stale_head_hold: 'verified_consuming_preoutcome_material_with_two_nonce_receipts_bundle_projection_session_read_set_head_and_target', invalid_target_hold: 'verified_consuming_preoutcome_material_with_two_nonce_receipts_bundle_projection_session_read_set_head_and_raw_target', authorization_hold: 'raw_non_consuming_preoutcome_material', invalid_proof_hold: 'raw_non_consuming_preoutcome_material', internal_failure_hold: 'raw_non_consuming_preoutcome_material' }

r33.semantic_clause_hygiene = { schema_version: 'ctrl.g24.semantic-clause-hygiene.r33.v1', forbidden_compound_token_parts: ['_and_', 'result'], forbidden_reverse_token_pairs: [['evidence', 'result'], ['result', 'evidence']], scope: 'every_object_key_and_string_value_in_complete_effective_contract', failure_action: 'reject_materialization' }
r33.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r33.v1'
r33.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r33.v1', derivation: 'bounded_exact_extension_from_frozen_R32_to_R33_acyclic_committed_receipt_evidence_before_hold_registry_authoritative_replay_exact_held_time_and_complete_nonce_joins', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authority_operation_receipt_store', '$.authority_operation_receipt_precommit_identity_plans', '$.authority_operation_committed_issuance_dag', '$.authority_operation_hold_store', '$.authority_operation_hold_issuance_dag', '$.authority_operation_identity_dependency_graph', '$.authority_operation_registry', '$.authority_operation_replay_payload_schema', '$.authority_operation_replay_envelope_schema', '$.authority_operation_replay_registry_authority', '$.authority_operation_pre_materialized_replay_lookup_store', '$.authority_operation_replay_resolution_bindings', '$.held_timestamp_equality_contract', '$.session_dual_nonce_bundle_join_contract', '$.authority_operation_historical_response_schema_matrix', '$.authority_operation_artifact_stores.families.results', '$.authority_operation_serializable_branch_transaction', '$.semantic_clause_hygiene'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r33_identifier: true, all_held_result_schema_refs: resultRefs.filter(ref => !ref.endsWith('.committed')), all_committed_result_schema_refs: resultRefs.filter(ref => ref.endsWith('.committed')) }
r33.required_negative_fixture_families = [...new Set([...r33.required_negative_fixture_families, 'committed_receipt_fixed_point', 'session_evidence_hold_order', 'reverse_semantic_clause', 'registry_outcome_history_hold_splice', 'held_timestamp_mismatch', 'missing_identity_dependency_edge'])]
r33.visible_surface_changes = []
r33.external_actions_authorized = []

function collectForbiddenClauses(value, path = '$', out = []) { if (typeof value === 'string') { if (value.includes('_and_result') || /evidence.*result|result.*evidence/i.test(value)) out.push(path); return out } if (!value || typeof value !== 'object') return out; for (const [key, item] of Object.entries(value)) { if (key.includes('_and_result')) out.push(`${path}.${key}`); collectForbiddenClauses(item, `${path}.${key}`, out) } return out }
const forbiddenClauses = collectForbiddenClauses(r33)
if (forbiddenClauses.length) throw new Error(`forbidden_reverse_clause:${forbiddenClauses.join(',')}`)
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r33)
export const materializedR33 = r33
export const materializedR33Output = `${JSON.stringify(r33, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR33Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR33Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R33 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
