import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR31 } from './materialize-ctrl-g24-trusted-ingress-r31.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r31.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r32.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r32 = structuredClone(materializedR31)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }, ts = { type: 'canonical_timestamp' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value, before) { const entries = Object.entries(schema.properties); const out = {}; for (const [name, spec] of entries) { if (name === before) out[key] = value; out[name] = spec } if (!Object.hasOwn(out, key)) out[key] = value; schema.properties = out; schema.exact_keys = Object.keys(out); schema.required = schema.exact_keys.filter(name => !(schema.optional ?? []).includes(name)) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function bump(value) { return value?.replace(/\.r\d+\./, '.r32.') }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r32.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function canonicalStore(family, schemaRef, maxBytes) { return { schema_version: `ctrl.g24.${family.replaceAll('_', '-')}-artifact-store.r32.v1`, canonical_schema_ref: schemaRef, row_schema: closed(`ctrl.g24.${family.replaceAll('_', '-')}-artifact-row.r32.v1`, { artifact_ref: fp, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64, canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact_r31', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes, canonical_validation: 'decode_base64url_verify_limit_exact_length_and_sha256_parse_exact_resolved_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', content_address_rule: 'artifact_ref_equals_canonical_bytes_sha256', named_derivation_operands: [{ derivation: 'content_address_rule', operands: ['artifact_ref', 'canonical_bytes_sha256'] }] }), sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_replay_or_audit_reference_exists', restart_failure: 'hold_without_response_or_write' } }

r32.schema_version = 'ctrl.g24.trusted-ingress.r32.effective.v1'
r32.status = 'thirty_first_repair_candidate_under_independent_review'
r32.supersedes = { commit: '07d817469775ada105d0c5b16e0e8afd9c7dee27', tree: 'df7013cc04e9363e113a502bf6856a446ec73895', human_blob: 'eb22381a8525d12bb932bc65ce6e874d9879a4ef', machine_blob: '34e7c64b8442f0e3cd470e512819708f4d28838a', qa_blob: 'b6973ec196b8c86a4787fbdbd33cac25bb8e332b', checker_blob: '60a8284ea9b36e01b9623c41211e9a604e5030c6', materializer_blob: '4a385c4878b5a9335ff2f17f79aa21cfd18b1944', founder_checker_blob: '9835190a02059749bb36aa32aecd393290e1331c', adjudication: 'veto' }
r32.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r32.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r32.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const resultBranches = ['committed', ...heldBranches]

// A held result knows only the pre-result hold-row content address. Final hold fingerprint follows result identity.
const heldInventory = []
for (const [operationName, operation] of Object.entries(operations)) {
  for (const branch of heldBranches) {
    const result = operation.result_schema.variants[branch]
    remove(result, 'hold_fingerprint')
    result.schema_version = bump(result.schema_version)
    result.exact_equalities = [...new Set((result.exact_equalities ?? []).filter(rule => !rule.includes('hold_fingerprint') && !rule.includes('evidence_triple_resolves_exact_branch_variant_and_result_fingerprint')).concat(['hold_row_ref_resolves_exact_result_independent_precommit_hold_identity', 'session_hold_evidence_triple_when_present_resolves_exact_pre_result_evidence_and_contains_no_result_or_final_hold_fingerprint', 'result_operation_branch_and_operation_id_equal_precommit_hold_identity']))]
    heldInventory.push({ operation_name: operationName, branch, result_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, result_schema_version: result.schema_version, sole_hold_identity_field: 'hold_row_ref', forbidden_final_hold_field: 'hold_fingerprint' })
  }
  operation.result_schema.schema_version = bump(operation.result_schema.schema_version)
  operation.result_fingerprint = fingerprint(`CTRL-G24-${operationName.replaceAll('_', '-').toUpperCase()}-RESULT-R32`, ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256'])
  operation.result_fingerprint.branch_payload_rule = 'hash_exact_selected_R32_variant_keys_in_schema_order_excluding_result_fingerprint_and_with_hold_row_ref_as_the_only_hold_identity_on_held_branches'
  operation.schema_version = bump(operation.schema_version)
}
r32.held_result_identity_migration = { schema_version: 'ctrl.g24.held-result-identity-migration.r32.v1', exact_expected_count: 75, inventory: heldInventory, required_pre_result_field: 'hold_row_ref', forbidden_result_fields: ['hold_ref', 'hold_fingerprint'], final_hold_fingerprint_stage: 'after_result_ref_result_bytes_sha256_and_result_fingerprint_exist' }

for (const [kind, hold] of Object.entries(r32.authority_operation_hold_store.row_union.variants)) {
  hold.schema_version = bump(hold.schema_version)
  hold.row_ref_preimage_excluded_fields = ['hold_row_ref', 'hold_fingerprint', 'result_ref', 'result_bytes_sha256', 'result_fingerprint']
  hold.row_ref_derivation = 'hold_row_ref_equals_sha256_of_exact_result_independent_precommit_payload'
  hold.finalization_rule = 'compute_result_from_hold_row_ref_then_add_exact_result_triple_then_compute_final_hold_fingerprint_over_final_row_without_changing_hold_row_ref'
  hold.field_dependency_edges = [['request_fingerprint', 'hold_row_ref'], ['operation_id', 'hold_row_ref'], ['hold_row_ref', 'result_ref'], ['hold_row_ref', 'result_fingerprint'], ['result_ref', 'hold_fingerprint'], ['result_bytes_sha256', 'hold_fingerprint'], ['result_fingerprint', 'hold_fingerprint']]
  const name = kind === 'ordinary_single_proof' ? 'ordinary' : 'session'
  r32.fingerprint_schemas[`authority_operation_hold_${name}_r32`] = fingerprint(`CTRL-G24-AUTHORITY-OPERATION-HOLD-${name.toUpperCase()}-R32`, hold.exact_keys.filter(key => key !== 'hold_fingerprint'))
  hold.fingerprint_ref = `fingerprint_schemas.authority_operation_hold_${name}_r32`
}
delete r32.fingerprint_schemas.authority_operation_hold_ordinary_r31
delete r32.fingerprint_schemas.authority_operation_hold_session_r31
r32.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r32.v1'
r32.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r32.v1'

r32.authority_operation_hold_issuance_dag = {
  schema_version: 'ctrl.g24.authority-operation-hold-issuance-dag.r32.v1',
  nodes: ['select_branch_and_evidence_inputs', 'compute_result_independent_hold_row_ref', 'build_and_store_result_independent_evidence', 'compute_and_store_result', 'compute_final_hold_fingerprint', 'store_final_hold_and_registry', 'store_historical_response', 'store_replay_payload_and_envelope', 'atomic_commit'],
  edges: [['select_branch_and_evidence_inputs', 'compute_result_independent_hold_row_ref'], ['select_branch_and_evidence_inputs', 'build_and_store_result_independent_evidence'], ['compute_result_independent_hold_row_ref', 'compute_and_store_result'], ['build_and_store_result_independent_evidence', 'compute_and_store_result'], ['compute_and_store_result', 'compute_final_hold_fingerprint'], ['compute_final_hold_fingerprint', 'store_final_hold_and_registry'], ['compute_and_store_result', 'store_historical_response'], ['store_final_hold_and_registry', 'store_replay_payload_and_envelope'], ['store_historical_response', 'store_replay_payload_and_envelope'], ['store_replay_payload_and_envelope', 'atomic_commit']],
  field_dependency_nodes: ['evidence_fingerprint', 'hold_row_ref', 'result_ref', 'result_fingerprint', 'hold_fingerprint', 'registry_fingerprint', 'historical_response_fingerprint', 'replay_payload_fingerprint', 'replay_envelope_fingerprint'],
  field_dependency_edges: [['evidence_fingerprint', 'result_fingerprint'], ['hold_row_ref', 'result_fingerprint'], ['result_ref', 'hold_fingerprint'], ['result_fingerprint', 'hold_fingerprint'], ['hold_fingerprint', 'registry_fingerprint'], ['result_fingerprint', 'historical_response_fingerprint'], ['registry_fingerprint', 'replay_payload_fingerprint'], ['historical_response_fingerprint', 'replay_payload_fingerprint'], ['replay_payload_fingerprint', 'replay_envelope_fingerprint']],
  evidence_forbidden_dependencies: ['result_ref', 'result_bytes_sha256', 'result_fingerprint', 'hold_fingerprint'], final_hold_fingerprint_forbidden_in_result: true, generic_cycle_detection_required: true, acyclic_required: true,
}

// Every raw store derives its content address from the declared opaque byte hash.
const rawStores = r32.authority_opaque_raw_input_stores
rawStores.schema_version = 'ctrl.g24.authority-opaque-raw-input-stores.r32.v1'
for (const [slot, store] of Object.entries(rawStores).filter(([, value]) => value?.row_schema)) {
  store.schema_version = `ctrl.g24.opaque-${slot.replaceAll('_', '-')}-store.r32.v1`
  store.row_schema.schema_version = `ctrl.g24.opaque-${slot.replaceAll('_', '-')}-row.r32.v1`
  store.row_schema.unique_keys = [['artifact_ref'], ['artifact_family', 'opaque_bytes_sha256']]
  store.row_schema.content_address_rule = 'artifact_ref_equals_opaque_bytes_sha256'
  store.row_schema.named_derivation_operands = [{ derivation: 'content_address_rule', operands: ['artifact_ref', 'opaque_bytes_sha256'] }]
}
r32.schema_operand_resolution_contract = { schema_version: 'ctrl.g24.schema-operand-resolution.r32.v1', recursive_scope: 'every_object_with_properties_and_unique_keys_or_named_derivation_operands', unique_key_rule: 'every_unique_key_operand_must_be_an_exact_declared_property', named_derivation_rule: 'every_named_derivation_operand_must_be_an_exact_declared_property', unresolved_operand_action: 'reject_materialization_and_hold_runtime' }

// The selected issuer and evaluator nonce rows are exact projections of one resolved bundle and request.
const nonceRow = r32.proof_nonce_ledger.row_schema
add(nonceRow, 'verifier_identity_fingerprint', fp, 'target_store')
nonceRow.schema_version = 'ctrl.g24.proof-nonce-ledger-row.r32.v1'
nonceRow.exact_equalities = ['nonce_row_fields_equal_exact_selected_role_projection_proof_request_and_branch', 'nonce_receipt_ref_and_fingerprint_resolve_same_exact_row_in_receipt_read_set_and_consuming_hold_evidence']
r32.proof_nonce_ledger.schema_version = 'ctrl.g24.proof-nonce-ledger.r32.v1'
r32.fingerprint_schemas.proof_nonce_receipt_r32 = fingerprint('CTRL-G24-PROOF-NONCE-RECEIPT-R32', nonceRow.exact_keys.filter(key => !['nonce_receipt_fingerprint', 'nonce_receipt_ref'].includes(key)).concat(['nonce_receipt_ref']))
nonceRow.fingerprint_ref = 'fingerprint_schemas.proof_nonce_receipt_r32'
const noncePayload = r32.proof_nonce_receipt_payload_schema
add(noncePayload, 'verifier_identity_fingerprint', fp, 'target_store')
noncePayload.schema_version = 'ctrl.g24.proof-nonce-receipt-payload.r32.v1'
r32.proof_nonce_receipt_store.schema_version = 'ctrl.g24.proof-nonce-receipt-store.r32.v1'
r32.proof_nonce_receipt_store.exact_row_equality = 'decoded_payload_fields_equal_nonce_ledger_row_fields_and_nonce_receipt_ref_equals_payload_sha256'

const roleMap = role => ({ proof_family: { source_kind: 'exact_role_literal', expected_literal: role }, nonce_subject_fingerprint: { source_schema_ref: 'session_dual_proof_bundle_truth_projection_schema', source_field: `${role}_nonce_subject_fingerprint` }, nonce: { source_schema_ref: 'session_dual_proof_bundle_truth_projection_schema', source_field: `${role}_nonce` }, proof_fingerprint: { source_schema_ref: 'session_dual_proof_bundle_truth_projection_schema', source_field: `${role}_proof_fingerprint` }, verifier_identity_fingerprint: { source_schema_ref: 'session_dual_proof_bundle_truth_projection_schema', source_field: `${role}_verifier_identity_fingerprint` }, target_store: { source_schema_ref: 'selected_session_operation_request_schema', source_field: 'target_store' }, operation_id: { source_schema_ref: 'selected_session_operation_request_schema', source_field: 'operation_id' }, consumed_on_branch: { source_schema_ref: 'selected_session_operation_result_schema', source_field: 'branch' } })
r32.session_dual_nonce_row_equality_tables = { schema_version: 'ctrl.g24.session-dual-nonce-row-equalities.r32.v1', issuer: roleMap('issuer'), evaluator: roleMap('evaluator'), selected_session_operation_request_schema_refs: ['case_session_authority_operation_protocols.operations.issue_server_session_principal.request_schema', 'case_session_authority_operation_protocols.operations.revoke_server_session_principal.request_schema', 'case_session_authority_operation_protocols.operations.expire_server_session_principal.request_schema'], selected_session_operation_result_schema_rule: 'exact_selected_committed_stale_head_hold_or_invalid_target_hold_variant', exact_two_rows: true, cross_bundle_splice: 'forbidden_by_exact_projection_proof_nonce_subject_verifier_operation_and_branch_equalities' }

const receiptEvidence = r32.session_dual_proof_receipt_evidence_schema
receiptEvidence.schema_version = 'ctrl.g24.session-dual-proof-receipt-evidence.r32.v1'
receiptEvidence.properties.issuer_nonce_receipt_ref = fp
receiptEvidence.properties.evaluator_nonce_receipt_ref = fp
receiptEvidence.exact_equalities = [...new Set(receiptEvidence.exact_equalities.concat(['issuer_and_evaluator_nonce_receipt_refs_resolve_exact_rows_defined_by_session_dual_nonce_row_equality_tables', 'receipt_read_set_and_consuming_hold_evidence_nonce_refs_and_fingerprints_equal_the_same_two_rows']))]
r32.fingerprint_schemas.session_dual_proof_receipt_evidence_r32 = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-RECEIPT-EVIDENCE-R32', receiptEvidence.exact_keys.filter(key => key !== 'evidence_fingerprint'))
receiptEvidence.fingerprint_ref = 'fingerprint_schemas.session_dual_proof_receipt_evidence_r32'
r32.session_dual_proof_receipt_evidence_store = canonicalStore('session_dual_proof_receipt_evidence', 'session_dual_proof_receipt_evidence_schema', 262144)

const sessionReadSet = r32.case_session_authority_read_set_schema.variants.session_dual_proof
sessionReadSet.schema_version = 'ctrl.g24.authority-read-set-session-dual-proof.r32.v1'
sessionReadSet.properties.issuer_nonce_receipt_ref = fp
sessionReadSet.properties.evaluator_nonce_receipt_ref = fp
sessionReadSet.exact_equalities = [...new Set((sessionReadSet.exact_equalities ?? []).concat(['both_nonce_receipt_refs_and_fingerprints_resolve_exact_rows_defined_by_session_dual_nonce_row_equality_tables', 'nonce_rows_equal_receipt_evidence_and_consuming_hold_evidence_byte_for_byte']))]
r32.fingerprint_schemas.authority_read_set_session_r32 = fingerprint('CTRL-G24-AUTHORITY-READ-SET-SESSION-DUAL-R32', sessionReadSet.exact_keys.filter(key => key !== 'snapshot_fingerprint'))
sessionReadSet.fingerprint_ref = 'fingerprint_schemas.authority_read_set_session_r32'
r32.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.authority-read-set-discriminated-union.r32.v1'
r32.case_session_authority_read_set_artifact_store = canonicalStore('case_session_authority_read_sets', 'case_session_authority_read_set_schema', 262144)

const sessionReceipt = r32.authority_operation_receipt_store.row_union.variants.session_dual_proof_committed
sessionReceipt.schema_version = 'ctrl.g24.authority-operation-receipt-session-dual-proof-committed.r32.v1'
sessionReceipt.properties.issuer_nonce_receipt_ref = fp
sessionReceipt.properties.evaluator_nonce_receipt_ref = fp
sessionReceipt.exact_equalities = [...new Set(sessionReceipt.exact_equalities.concat(['both_nonce_receipt_refs_and_fingerprints_equal_receipt_evidence_and_session_read_set_and_resolve_exact_nonce_rows']))]
r32.fingerprint_schemas.authority_operation_receipt_session_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-SESSION-R32', sessionReceipt.exact_keys.filter(key => key !== 'receipt_fingerprint'))
sessionReceipt.fingerprint_ref = 'fingerprint_schemas.authority_operation_receipt_session_r32'
r32.authority_operation_receipt_store.schema_version = 'ctrl.g24.authority-operation-receipt-store.r32.v1'
r32.authority_operation_receipt_store.row_union.schema_version = 'ctrl.g24.authority-operation-receipt-row-union.r32.v1'

// Projection schema, derivation and fingerprint use one exact R32 authority.
const projection = r32.session_dual_proof_bundle_truth_projection_schema
projection.schema_version = 'ctrl.g24.session-dual-proof-bundle-truth-projection.r32.v1'
r32.fingerprint_schemas.session_dual_proof_bundle_truth_projection_r32 = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-BUNDLE-TRUTH-PROJECTION-R32', projection.exact_keys.filter(key => key !== 'projection_fingerprint'))
projection.fingerprint_ref = 'fingerprint_schemas.session_dual_proof_bundle_truth_projection_r32'
delete r32.fingerprint_schemas.session_dual_proof_bundle_truth_projection_r31
const projectionDerivation = r32.session_dual_proof_bundle_truth_projection_derivation
projectionDerivation.schema_version = 'ctrl.g24.session-dual-proof-bundle-truth-projection-derivation.r32.v1'
projectionDerivation.projection_fingerprint_ref = 'fingerprint_schemas.session_dual_proof_bundle_truth_projection_r32'
projectionDerivation.projection_fingerprint_domain = 'CTRL-G24-SESSION-DUAL-PROOF-BUNDLE-TRUTH-PROJECTION-R32'
projectionDerivation.projection_fingerprint_preimage_order = [...r32.fingerprint_schemas.session_dual_proof_bundle_truth_projection_r32.preimage_order]
r32.session_dual_proof_bundle_truth_projection_artifact_store = canonicalStore('session_dual_proof_bundle_truth_projections', 'session_dual_proof_bundle_truth_projection_schema', 131072)

// Historical response is a closed projection of the selected result and its canonical artifact.
const responseMatrix = []
for (const [operationName, operation] of Object.entries(operations)) for (const branch of resultBranches) { const schema = operation.result_schema.variants[branch]; responseMatrix.push({ operation_name: operationName, result_branch: branch, response_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, response_schema_version: schema.schema_version }) }
const historical = r32.authority_operation_historical_response_schema
historical.schema_version = 'ctrl.g24.authority-operation-historical-response.r32.v1'
historical.exact_equalities = ['operation_and_branch_select_exactly_one_matrix_row', 'all_fields_follow_authority_operation_historical_response_field_bindings']
r32.fingerprint_schemas.authority_operation_historical_response_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HISTORICAL-RESPONSE-R32', historical.exact_keys.filter(key => key !== 'response_fingerprint'))
historical.fingerprint_ref = 'fingerprint_schemas.authority_operation_historical_response_r32'
delete r32.fingerprint_schemas.authority_operation_historical_response_r31
r32.authority_operation_historical_response_schema_matrix = { schema_version: 'ctrl.g24.authority-operation-historical-response-schema-matrix.r32.v1', exact_expected_rows: 90, discriminator_order: ['operation_name', 'result_branch'], rows: responseMatrix, selection: 'exactly_one_row_or_hold_before_response_materialization', caller_schema_authority: 'none' }
r32.authority_operation_historical_response_field_bindings = { schema_version: 'ctrl.g24.authority-operation-historical-response-field-bindings.r32.v1', bindings: [
  { local_field: 'operation_name', source_kind: 'selected_result', source_field: 'operation_name' }, { local_field: 'operation_id', source_kind: 'selected_result', source_field: 'operation_id' }, { local_field: 'result_branch', source_kind: 'selected_result', source_field: 'branch' },
  { local_field: 'response_schema_ref', source_kind: 'selected_matrix_row', source_field: 'response_schema_ref' }, { local_field: 'response_schema_version', source_kind: 'selected_matrix_row', source_field: 'response_schema_version' },
  { local_field: 'response_payload_ref', source_kind: 'selected_result_artifact', source_field: 'artifact_ref' }, { local_field: 'response_payload_bytes_sha256', source_kind: 'selected_result_artifact', source_field: 'canonical_bytes_sha256' }, { local_field: 'result_ref', source_kind: 'selected_result_artifact', source_field: 'artifact_ref' }, { local_field: 'result_fingerprint', source_kind: 'selected_result', source_field: 'result_fingerprint' },
], local_schema_ref: 'authority_operation_historical_response_schema', selected_result_schema_refs: responseMatrix.map(row => row.response_schema_ref), selected_result_artifact_row_schema_ref: 'authority_operation_artifact_stores.families.results.stores_by_schema_ref.*.row_schema', selected_matrix_schema_fields: ['operation_name', 'result_branch', 'response_schema_ref', 'response_schema_version'] }
r32.authority_operation_historical_response_artifact_store = canonicalStore('authority_operation_historical_responses', 'authority_operation_historical_response_schema', 131072)

for (const variant of Object.values(r32.authority_operation_replay_payload_schema.variants)) variant.schema_version = bump(variant.schema_version)
r32.authority_operation_replay_payload_schema.schema_version = 'ctrl.g24.authority-operation-replay-payload-union.r32.v1'
const committedReplay = r32.authority_operation_replay_payload_schema.variants.replayed
const heldReplay = r32.authority_operation_replay_payload_schema.variants.replayed_held
committedReplay.exact_equalities = ['all_source_and_response_fields_follow_authority_operation_replay_resolution_bindings_committed']
heldReplay.exact_equalities = ['all_source_and_response_fields_follow_authority_operation_replay_resolution_bindings_held']
r32.fingerprint_schemas.authority_operation_replay_payload_committed_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-COMMITTED-R32', committedReplay.exact_keys.filter(key => key !== 'payload_fingerprint'))
r32.fingerprint_schemas.authority_operation_replay_payload_held_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-HELD-R32', heldReplay.exact_keys.filter(key => key !== 'payload_fingerprint'))
committedReplay.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_payload_committed_r32'
heldReplay.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_payload_held_r32'
delete r32.fingerprint_schemas.authority_operation_replay_payload_committed_r31
delete r32.fingerprint_schemas.authority_operation_replay_payload_held_r31
r32.authority_operation_replay_payload_artifact_store = canonicalStore('authority_operation_replay_payloads', 'authority_operation_replay_payload_schema', 131072)

const envelope = r32.authority_operation_replay_envelope_schema
envelope.schema_version = 'ctrl.g24.authority-operation-replay-envelope.r32.v1'
envelope.exact_equalities = ['all_payload_and_response_fields_follow_authority_operation_replay_resolution_bindings_envelope']
r32.fingerprint_schemas.authority_operation_replay_envelope_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-ENVELOPE-R32', envelope.exact_keys.filter(key => key !== 'envelope_fingerprint'))
envelope.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_envelope_r32'
delete r32.fingerprint_schemas.authority_operation_replay_envelope_r31
r32.authority_operation_replay_envelope_artifact_store = canonicalStore('authority_operation_replay_envelopes', 'authority_operation_replay_envelope_schema', 131072)

for (const variant of Object.values(r32.authority_operation_pre_materialized_replay_lookup_store.row_union.variants)) variant.schema_version = bump(variant.schema_version)
r32.authority_operation_pre_materialized_replay_lookup_store.schema_version = 'ctrl.g24.authority-operation-pre-materialized-replay-lookup-store.r32.v1'
r32.authority_operation_pre_materialized_replay_lookup_store.row_union.schema_version = 'ctrl.g24.authority-operation-replay-lookup-union.r32.v1'
const committedLookup = r32.authority_operation_pre_materialized_replay_lookup_store.row_union.variants.committed
const heldLookup = r32.authority_operation_pre_materialized_replay_lookup_store.row_union.variants.held
committedLookup.exact_equalities = ['all_source_payload_and_envelope_fields_follow_authority_operation_replay_resolution_bindings_committed_lookup']
heldLookup.exact_equalities = ['all_source_payload_and_envelope_fields_follow_authority_operation_replay_resolution_bindings_held_lookup']
r32.fingerprint_schemas.authority_operation_replay_lookup_committed_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-LOOKUP-COMMITTED-R32', committedLookup.exact_keys.filter(key => key !== 'lookup_fingerprint'))
r32.fingerprint_schemas.authority_operation_replay_lookup_held_r32 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-LOOKUP-HELD-R32', heldLookup.exact_keys.filter(key => key !== 'lookup_fingerprint'))
committedLookup.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_lookup_committed_r32'
heldLookup.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_lookup_held_r32'

r32.authority_operation_replay_resolution_bindings = { schema_version: 'ctrl.g24.authority-operation-replay-resolution-bindings.r32.v1', content_address_rule: 'every_artifact_ref_equals_its_bytes_sha256', committed_source: [{ local_field: 'committed_registry_row_ref', source_schema_ref: 'authority_operation_registry.row_union.variants.original_committed', source_field: 'registry_row_ref' }, { local_field: 'committed_registry_row_fingerprint', source_schema_ref: 'authority_operation_registry.row_union.variants.original_committed', source_field: 'registry_fingerprint' }], held_source: [{ local_field: 'held_registry_row_ref', source_schema_ref: 'authority_operation_registry.row_union.variants.original_persisted_hold', source_field: 'registry_row_ref' }, { local_field: 'held_registry_row_fingerprint', source_schema_ref: 'authority_operation_registry.row_union.variants.original_persisted_hold', source_field: 'registry_fingerprint' }, { local_field: 'hold_row_ref', source_schema_ref: 'authority_operation_hold_store.row_union.selected_variant', source_field: 'hold_row_ref' }, { local_field: 'hold_row_fingerprint', source_schema_ref: 'authority_operation_hold_store.row_union.selected_variant', source_field: 'hold_fingerprint' }], payload_artifact_triple: [{ local_field: 'payload_ref', source_schema_ref: 'authority_operation_replay_payload_artifact_store.row_schema', source_field: 'artifact_ref' }, { local_field: 'payload_bytes_sha256', source_schema_ref: 'authority_operation_replay_payload_artifact_store.row_schema', source_field: 'canonical_bytes_sha256' }, { local_field: 'payload_fingerprint', source_schema_ref: 'authority_operation_replay_payload_schema.selected_variant', source_field: 'payload_fingerprint' }], envelope_artifact_triple: [{ local_field: 'envelope_ref', source_schema_ref: 'authority_operation_replay_envelope_artifact_store.row_schema', source_field: 'artifact_ref' }, { local_field: 'envelope_bytes_sha256', source_schema_ref: 'authority_operation_replay_envelope_artifact_store.row_schema', source_field: 'canonical_bytes_sha256' }, { local_field: 'envelope_fingerprint', source_schema_ref: 'authority_operation_replay_envelope_schema', source_field: 'envelope_fingerprint' }], historical_response_triple: [{ payload_field: 'stored_historical_response_ref', envelope_field: 'replay_response_ref', source_schema_ref: 'authority_operation_historical_response_artifact_store.row_schema', source_field: 'artifact_ref' }, { payload_field: 'stored_historical_response_bytes_sha256', envelope_field: 'replay_response_bytes_sha256', source_schema_ref: 'authority_operation_historical_response_artifact_store.row_schema', source_field: 'canonical_bytes_sha256' }, { payload_field: 'stored_historical_response_fingerprint', envelope_field: 'replay_response_fingerprint', source_schema_ref: 'authority_operation_historical_response_schema', source_field: 'response_fingerprint' }], historical_result_triple: [{ payload_field: 'historical_result_ref', source_kind: 'selected_result_artifact', source_field: 'artifact_ref' }, { payload_field: 'historical_result_bytes_sha256', source_kind: 'selected_result_artifact', source_field: 'canonical_bytes_sha256' }, { payload_field: 'historical_result_fingerprint', source_kind: 'selected_result', source_field: 'result_fingerprint' }], operation_equalities: ['payload_operation_name_and_operation_id_equal_decoded_historical_result', 'historical_response_operation_name_operation_id_result_branch_result_ref_and_result_fingerprint_equal_decoded_historical_result', 'envelope_operation_name_operation_id_and_replay_kind_equal_selected_payload', 'returned_response_bytes_equal_exact_resolved_historical_response_artifact_bytes'], cross_artifact_splicing: 'forbidden' }
r32.authority_operation_replay_derivation.schema_version = 'ctrl.g24.authority-operation-replay-derivation.r32.v1'
r32.authority_operation_replay_derivation.binding_authority_ref = 'authority_operation_replay_resolution_bindings'
r32.authority_operation_replay_derivation.return_rule = 'resolve_lookup_then_exact_payload_envelope_historical_response_and_result_artifacts_and_return_historical_response_bytes'

// Rebuild result stores from the exact active R32 matrix.
const resultRefs = responseMatrix.map(row => row.response_schema_ref)
const resultStores = {}
resultRefs.forEach((schemaRef, index) => { const store = canonicalStore('results', schemaRef, 131072); store.schema_version = `ctrl.g24.authority-result-artifact-${index + 1}-store.r32.v1`; store.row_schema.schema_version = `ctrl.g24.authority-result-artifact-${index + 1}-row.r32.v1`; resultStores[`schema_${index + 1}`] = store })
r32.authority_operation_artifact_stores.families.results = { schema_version: 'ctrl.g24.authority-artifact-family-results.r32.v1', expected_schema_refs: resultRefs, stores_by_schema_ref: resultStores }
r32.authority_operation_artifact_stores.schema_version = 'ctrl.g24.authority-operation-artifact-stores.r32.v1'

const tx = r32.authority_operation_serializable_branch_transaction
tx.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r32.v1'
tx.hold_issuance_dag_ref = 'authority_operation_hold_issuance_dag'
tx.atomicity = 'result_independent_evidence_and_hold_row_ref_then_result_then_final_hold_fingerprint_registry_historical_response_and_replay_all_commit_or_none'
tx.crash_rule = 'rollback_every_nonce_evidence_result_final_hold_registry_response_replay_target_head_and_receipt_write'
tx.restart_postcondition = 'resolve_exact_declared_ref_hash_fingerprint_triples_only_or_hold_without_write_or_disclosure'
r32.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r32.v1'
r32.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r32.v1', derivation: 'bounded_exact_extension_from_frozen_R31_to_R32_one_way_hold_identity_declared_operands_exact_dual_nonce_rows_one_projection_domain_and_closed_replay_resolution', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.held_result_identity_migration', '$.authority_operation_hold_store', '$.authority_operation_hold_issuance_dag', '$.authority_opaque_raw_input_stores', '$.schema_operand_resolution_contract', '$.proof_nonce_ledger', '$.proof_nonce_receipt_payload_schema', '$.session_dual_nonce_row_equality_tables', '$.session_dual_proof_receipt_evidence_schema', '$.case_session_authority_read_set_schema', '$.authority_operation_receipt_store', '$.session_dual_proof_bundle_truth_projection_schema', '$.session_dual_proof_bundle_truth_projection_derivation', '$.authority_operation_historical_response_schema', '$.authority_operation_historical_response_field_bindings', '$.authority_operation_replay_payload_schema', '$.authority_operation_replay_envelope_schema', '$.authority_operation_pre_materialized_replay_lookup_store', '$.authority_operation_replay_resolution_bindings', '$.authority_operation_artifact_stores.families.results', '$.authority_operation_serializable_branch_transaction'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r32_identifier: true, all_held_result_schema_refs: resultRefs.filter(ref => !ref.endsWith('.committed')) }
r32.required_negative_fixture_families = [...new Set([...r32.required_negative_fixture_families, 'held_result_final_hold_fingerprint_cycle', 'undeclared_unique_key_or_derivation_operand', 'session_dual_nonce_row_cross_bundle_splice', 'projection_domain_or_fingerprint_authority_drift', 'replay_unrelated_artifact_or_operation_splice', 'nonexistent_equality_operand'])]
r32.visible_surface_changes = []
r32.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r32)
export const materializedR32 = r32
export const materializedR32Output = `${JSON.stringify(r32, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR32Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR32Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R32 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
