import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR30 } from './materialize-ctrl-g24-trusted-ingress-r30.mjs'

const root = process.cwd(), inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r30.json', outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r31.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8'), r31 = structuredClone(materializedR30)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function bump(value) { return value?.replace(/\.r\d+\./, '.r31.') }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r31.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function canonicalStore(family, schemaRef, maxBytes) { return { schema_version: `ctrl.g24.${family.replaceAll('_', '-')}-artifact-store.r31.v1`, canonical_schema_ref: schemaRef, row_schema: closed(`ctrl.g24.${family.replaceAll('_', '-')}-artifact-row.r31.v1`, { artifact_ref: fp, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64, canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact_r31', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes, canonical_validation: 'decode_base64url_verify_limit_exact_length_and_sha256_parse_exact_resolved_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', content_address_rule: 'artifact_ref_equals_canonical_bytes_sha256' }), sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_replay_or_audit_reference_exists', restart_failure: 'hold_without_response_or_write' } }

r31.schema_version = 'ctrl.g24.trusted-ingress.r31.effective.v1'
r31.status = 'thirtieth_repair_candidate_under_independent_review'
r31.supersedes = { commit: '044f8bfe3983f955b549df698c3389a4e10ab3db', tree: '2fa3936c754f0be5fec6b504cd97505a6f4529c9', human_blob: '318c30a30ea1fc710571362634b06c1dbb5554fd', machine_blob: '3c3f60bc05dca78f99b6559fa3b7462126594308', qa_blob: 'c6677de81360abf40c9631323911458d86ee8139', checker_blob: 'cfdc108a14fd28519b666fa1d679d0a2fc3f5cca', materializer_blob: 'fba0d48fa2dd31f4732cd94541ce8b3683bbcb3d', founder_checker_blob: '0b3d691e4baa9ac02dc11cf50949dccbf8727255', adjudication: 'veto' }
r31.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r31.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }
r31.fingerprint_schemas.authority_artifact_r31 = fingerprint('CTRL-G24-AUTHORITY-ARTIFACT-R31', ['artifact_ref', 'artifact_family', 'canonical_schema_ref', 'canonical_bytes_b64url', 'canonical_bytes_length', 'canonical_bytes_sha256', 'parsed_content_fingerprint', 'stored_at', 'writer_role'])

const operations = r31.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const sessionNames = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']

// Evidence is issued before result identity. No evidence schema or fingerprint contains a result edge.
const evidenceUnion = r31.session_hold_evidence_schema
for (const schema of Object.values(evidenceUnion.variants)) for (const key of ['result_ref', 'result_bytes_sha256', 'result_fingerprint']) remove(schema, key)
const consuming = evidenceUnion.variants.verified_consuming, rawEvidence = evidenceUnion.variants.raw_non_consuming
consuming.schema_version = 'ctrl.g24.session-hold-evidence-consuming.r31.v1'
rawEvidence.schema_version = 'ctrl.g24.session-hold-evidence-non-consuming.r31.v1'
consuming.exact_equalities = consuming.exact_equalities.filter(rule => !rule.includes('result'))
rawEvidence.exact_equalities = rawEvidence.exact_equalities.filter(rule => !rule.includes('result'))
r31.fingerprint_schemas.session_hold_evidence_consuming_r31 = fingerprint('CTRL-G24-SESSION-HOLD-EVIDENCE-CONSUMING-R31', consuming.exact_keys.filter(key => key !== 'evidence_fingerprint'))
r31.fingerprint_schemas.session_hold_evidence_non_consuming_r31 = fingerprint('CTRL-G24-SESSION-HOLD-EVIDENCE-NON-CONSUMING-R31', rawEvidence.exact_keys.filter(key => key !== 'evidence_fingerprint'))
consuming.fingerprint_ref = 'fingerprint_schemas.session_hold_evidence_consuming_r31'; rawEvidence.fingerprint_ref = 'fingerprint_schemas.session_hold_evidence_non_consuming_r31'
delete r31.fingerprint_schemas.session_hold_evidence_consuming_r30; delete r31.fingerprint_schemas.session_hold_evidence_non_consuming_r30
evidenceUnion.schema_version = 'ctrl.g24.session-hold-evidence-discriminated-union.r31.v1'
r31.session_hold_evidence_artifact_store = canonicalStore('session_hold_evidence', 'session_hold_evidence_schema', 262144)

// Every held result now uses one exact content-addressed hold row identity.
const heldResultInventory = []
for (const [operationName, operation] of Object.entries(operations)) {
  let changed = false
  for (const branch of heldBranches) {
    const result = operation.result_schema.variants[branch]
    if (!result) continue
    remove(result, 'hold_ref'); add(result, 'hold_row_ref', fp)
    result.schema_version = bump(result.schema_version)
    result.exact_equalities = [...(result.exact_equalities ?? []).filter(rule => !rule.includes('hold_ref')), 'hold_row_ref_equals_exact_precommitted_hold_row_content_address_and_resolves_final_hold_row', 'result_branch_operation_id_and_result_fingerprint_equal_final_hold_row']
    heldResultInventory.push({ operation_name: operationName, branch, result_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, result_schema_version: result.schema_version, hold_identity_field: 'hold_row_ref', hold_identity_type: 'sha256' })
    changed = true
  }
  if (changed) {
    operation.result_schema.schema_version = bump(operation.result_schema.schema_version)
    operation.result_fingerprint = fingerprint(`CTRL-G24-${operationName.replaceAll('_', '-').toUpperCase()}-RESULT-R31`, ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256'])
    operation.result_fingerprint.branch_payload_rule = 'branch_specific_canonical_payload_sha256_hashes_exact_selected_R31_variant_keys_in_schema_order_including_hold_row_ref_for_every_hold'
    operation.schema_version = bump(operation.schema_version)
  }
}
r31.held_result_identity_migration = { schema_version: 'ctrl.g24.held-result-identity-migration.r31.v1', exact_expected_count: 75, inventory: heldResultInventory, forbidden_legacy_field: 'hold_ref', required_field: 'hold_row_ref', required_type: 'sha256', result_to_hold_join: 'every_held_result_hold_row_ref_resolves_exact_hold_row_whose_operation_branch_result_fingerprint_and_final_registry_join_match' }

// Hold row refs are precommit identities that exclude result-derived fields, breaking the result and hold cycle.
for (const hold of Object.values(r31.authority_operation_hold_store.row_union.variants)) {
  remove(hold, 'hold_ref')
  hold.schema_version = bump(hold.schema_version)
  hold.row_ref_preimage_excluded_fields = ['hold_row_ref', 'hold_fingerprint', 'result_ref', 'result_bytes_sha256', 'result_fingerprint']
  hold.row_ref_preimage = 'exact_canonical_precommit_hold_identity_payload_in_schema_order_excluding_row_ref_fingerprint_and_all_result_derived_fields'
  hold.row_ref_derivation = 'hold_row_ref_equals_sha256_of_exact_precommit_hold_identity_payload_before_result_issuance'
  hold.finalization_rule = 'after_result_references_hold_row_ref_final_hold_row_adds_exact_result_triple_and_hold_fingerprint_without_changing_hold_row_ref'
}
const ordinaryHold = r31.authority_operation_hold_store.row_union.variants.ordinary_single_proof, sessionHold = r31.authority_operation_hold_store.row_union.variants.session_dual_proof
r31.fingerprint_schemas.authority_operation_hold_ordinary_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-ORDINARY-R31', ordinaryHold.exact_keys.filter(key => key !== 'hold_fingerprint'))
r31.fingerprint_schemas.authority_operation_hold_session_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-SESSION-DUAL-R31', sessionHold.exact_keys.filter(key => key !== 'hold_fingerprint'))
ordinaryHold.fingerprint_ref = 'fingerprint_schemas.authority_operation_hold_ordinary_r31'; sessionHold.fingerprint_ref = 'fingerprint_schemas.authority_operation_hold_session_r31'
delete r31.fingerprint_schemas.authority_operation_hold_ordinary_r30; delete r31.fingerprint_schemas.authority_operation_hold_session_r30
r31.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r31.v1'; r31.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r31.v1'

// Opaque evidence uses SHA-256 content addresses consistently across every store and consumer.
const rawStores = r31.authority_opaque_raw_input_stores
rawStores.schema_version = 'ctrl.g24.authority-opaque-raw-input-stores.r31.v1'
for (const [slot, store] of Object.entries(rawStores).filter(([, value]) => value?.row_schema)) {
  store.schema_version = `ctrl.g24.opaque-${slot.replaceAll('_', '-')}-store.r31.v1`
  store.row_schema.schema_version = `ctrl.g24.opaque-${slot.replaceAll('_', '-')}-row.r31.v1`
  store.row_schema.properties.artifact_ref = fp
  store.row_schema.content_address_rule = 'artifact_ref_equals_raw_bytes_sha256'
  store.row_schema.unique_keys = [['artifact_ref'], ['artifact_family', 'raw_bytes_sha256']]
  store.row_schema.exact_role = store.row_schema.properties.artifact_family.const
}
for (const schema of [ordinaryHold, sessionHold]) for (const [key, value] of Object.entries(schema.properties)) if (key.includes('raw_') && key.endsWith('_ref_or_unavailable')) value.type = 'sha256_or_exact_literal'
for (const [key, value] of Object.entries(rawEvidence.properties)) if (key.startsWith('raw_') && key.endsWith('_ref_or_unavailable')) value.type = 'sha256_or_exact_literal'

// Exact formulas bind projection subjects to the named R25 proof and R26 authority fingerprint authorities.
r31.session_dual_proof_projection_formula_table = {
  schema_version: 'ctrl.g24.session-dual-proof-projection-formulas.r31.v1',
  formulas: [
    { projection_field: 'issuer_nonce_subject_fingerprint', domain_ascii: 'CTRL-G24-ISSUER-NONCE-SUBJECT-R31', ordered_preimage: ['domain_ascii', 'selected_issuer_ref', 'selected_issuer_row_version_ref', 'selected_issuer_registry_fingerprint'], selected_row_fingerprint_ref: 'fingerprint_schemas.case_session_issuer_registry', selected_row_domain_ascii: 'CTRL-G24-CASE-SESSION-ISSUER-REGISTRY-R26', selected_row_preimage_ref: 'fingerprint_schemas.case_session_issuer_registry.preimage_order', proof_fingerprint_ref: 'fingerprint_schemas.issuer_capability_proof', proof_domain_ascii: 'CTRL-G24-ISSUER-CAPABILITY-PROOF-FINGERPRINT-R25', equality: 'proof_issuer_ref_row_version_and_registry_fingerprint_equal_selected_current_issuer_row_before_formula' },
    { projection_field: 'evaluator_nonce_subject_fingerprint', domain_ascii: 'CTRL-G24-EVALUATOR-NONCE-SUBJECT-R31', ordered_preimage: ['domain_ascii', 'selected_evaluator_ref', 'selected_evaluator_row_version_ref', 'selected_evaluator_registry_fingerprint'], selected_row_fingerprint_ref: 'fingerprint_schemas.case_session_evaluator_registry', selected_row_domain_ascii: 'CTRL-G24-CASE-SESSION-EVALUATOR-REGISTRY-R26', selected_row_preimage_ref: 'fingerprint_schemas.case_session_evaluator_registry.preimage_order', proof_fingerprint_ref: 'fingerprint_schemas.evaluator_capability_proof', proof_domain_ascii: 'CTRL-G24-EVALUATOR-CAPABILITY-PROOF-FINGERPRINT-R25', equality: 'proof_evaluator_ref_row_version_and_registry_fingerprint_equal_selected_current_evaluator_row_before_formula' },
    { projection_field: 'issuer_verifier_identity_fingerprint', domain_ascii: 'CTRL-G24-ISSUER-VERIFIER-IDENTITY-R31', ordered_preimage: ['domain_ascii', 'proof_verifier_ref', 'proof_verifier_version_ref', 'proof_verifier_artifact_sha256', 'selected_issuer_registry_fingerprint'], proof_fingerprint_ref: 'fingerprint_schemas.issuer_capability_proof', proof_domain_ascii: 'CTRL-G24-ISSUER-CAPABILITY-PROOF-FINGERPRINT-R25', selected_row_fingerprint_ref: 'fingerprint_schemas.case_session_issuer_registry', equality: 'proof_verifier_triple_resolves_pinned_key_artifact_and_selected_issuer_authority_row' },
    { projection_field: 'evaluator_verifier_identity_fingerprint', domain_ascii: 'CTRL-G24-EVALUATOR-VERIFIER-IDENTITY-R31', ordered_preimage: ['domain_ascii', 'proof_verifier_ref', 'proof_verifier_version_ref', 'proof_verifier_artifact_sha256', 'selected_evaluator_registry_fingerprint'], proof_fingerprint_ref: 'fingerprint_schemas.evaluator_capability_proof', proof_domain_ascii: 'CTRL-G24-EVALUATOR-CAPABILITY-PROOF-FINGERPRINT-R25', selected_row_fingerprint_ref: 'fingerprint_schemas.case_session_evaluator_registry', equality: 'proof_verifier_triple_resolves_pinned_key_artifact_and_selected_evaluator_authority_row' },
  ],
  canonical_encoding_ref: 'canonical_field_encoding', digest: 'sha256_of_exact_ordered_preimage', mismatch_action: 'hold_before_nonce_consumption',
}
r31.session_dual_proof_bundle_truth_projection_schema.schema_version = 'ctrl.g24.session-dual-proof-bundle-truth-projection.r31.v1'
r31.session_dual_proof_bundle_truth_projection_schema.formula_table_ref = 'session_dual_proof_projection_formula_table'
r31.session_dual_proof_bundle_truth_projection_derivation.schema_version = 'ctrl.g24.session-dual-proof-bundle-truth-projection-derivation.r31.v1'
r31.session_dual_proof_bundle_truth_projection_derivation.subject_formula_table_ref = 'session_dual_proof_projection_formula_table'
r31.fingerprint_schemas.session_dual_proof_bundle_truth_projection_r31 = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-BUNDLE-TRUTH-PROJECTION-R31', r31.session_dual_proof_bundle_truth_projection_schema.exact_keys.filter(key => key !== 'projection_fingerprint'))
r31.session_dual_proof_bundle_truth_projection_schema.fingerprint_ref = 'fingerprint_schemas.session_dual_proof_bundle_truth_projection_r31'
delete r31.fingerprint_schemas.session_dual_proof_bundle_truth_projection_r30
r31.session_dual_proof_bundle_truth_projection_artifact_store = canonicalStore('session_dual_proof_bundle_truth_projections', 'session_dual_proof_bundle_truth_projection_schema', 131072)

// Evidence equality tables make every duplicate a byte equality to one canonical source.
const verifiedSources = {
  evidence_kind: 'selected_evidence_variant', operation_name: 'selected_request.operation_name', operation_id: 'selected_request.operation_id', hold_branch: 'selected_pre_result_branch',
  bundle_ref: 'resolved_bundle_artifact.artifact_ref', bundle_bytes_sha256: 'resolved_bundle_artifact.canonical_bytes_sha256', bundle_fingerprint: 'resolved_bundle.bundle_fingerprint',
  bundle_truth_projection_ref: 'resolved_projection_artifact.artifact_ref', bundle_truth_projection_bytes_sha256: 'resolved_projection_artifact.canonical_bytes_sha256', bundle_truth_projection_fingerprint: 'resolved_projection.projection_fingerprint',
  issuer_proof_ref: 'resolved_issuer_proof.proof_ref', issuer_proof_bytes_sha256: 'resolved_issuer_proof_artifact.canonical_bytes_sha256', issuer_proof_fingerprint: 'resolved_issuer_proof.proof_fingerprint',
  evaluator_proof_ref: 'resolved_evaluator_proof.proof_ref', evaluator_proof_bytes_sha256: 'resolved_evaluator_proof_artifact.canonical_bytes_sha256', evaluator_proof_fingerprint: 'resolved_evaluator_proof.proof_fingerprint',
  issuer_nonce_receipt_ref: 'resolved_issuer_nonce_receipt.nonce_receipt_ref', issuer_nonce_receipt_fingerprint: 'resolved_issuer_nonce_receipt.nonce_receipt_fingerprint', evaluator_nonce_receipt_ref: 'resolved_evaluator_nonce_receipt.nonce_receipt_ref', evaluator_nonce_receipt_fingerprint: 'resolved_evaluator_nonce_receipt.nonce_receipt_fingerprint',
  authority_read_set_ref: 'resolved_session_read_set_artifact.artifact_ref', authority_read_set_bytes_sha256: 'resolved_session_read_set_artifact.canonical_bytes_sha256', authority_read_set_fingerprint: 'resolved_session_read_set.snapshot_fingerprint',
  partition_head_fingerprint: 'selected_partition_head.head_fingerprint', target_evidence_ref: 'selected_target_or_raw_target_artifact.artifact_ref', target_evidence_bytes_sha256: 'selected_target_or_raw_target_artifact.canonical_or_raw_bytes_sha256', target_evidence_fingerprint: 'selected_target_or_raw_target_content_fingerprint',
}
const rawSources = { evidence_kind: 'selected_evidence_variant', operation_name: 'selected_request.operation_name', operation_id: 'selected_request.operation_id', hold_branch: 'selected_pre_result_branch' }
for (const key of rawEvidence.exact_keys.filter(key => key.startsWith('raw_'))) rawSources[key] = `exact_${key}_from_selected_role_raw_store_or_UNAVAILABLE`
r31.session_hold_evidence_equality_tables = {
  schema_version: 'ctrl.g24.session-hold-evidence-equality-tables.r31.v1',
  verified_consuming: consuming.exact_keys.filter(key => key !== 'evidence_fingerprint').map(key => ({ evidence_field: key, source: verifiedSources[key], receipt_evidence_equality: ['bundle_ref', 'bundle_bytes_sha256', 'bundle_fingerprint', 'bundle_truth_projection_ref', 'bundle_truth_projection_bytes_sha256', 'bundle_truth_projection_fingerprint', 'issuer_proof_ref', 'issuer_proof_bytes_sha256', 'issuer_proof_fingerprint', 'evaluator_proof_ref', 'evaluator_proof_bytes_sha256', 'evaluator_proof_fingerprint', 'issuer_nonce_receipt_ref', 'issuer_nonce_receipt_fingerprint', 'evaluator_nonce_receipt_ref', 'evaluator_nonce_receipt_fingerprint', 'authority_read_set_ref', 'authority_read_set_bytes_sha256', 'authority_read_set_fingerprint'].includes(key) ? 'must_equal_exact_session_receipt_evidence_field' : 'not_applicable' })),
  raw_non_consuming: rawEvidence.exact_keys.filter(key => key !== 'evidence_fingerprint').map(key => ({ evidence_field: key, source: rawSources[key], hold_row_duplication: key.startsWith('raw_') ? 'hold_row_field_must_equal_byte_for_byte' : 'not_applicable' })),
  raw_authority_rule: 'opaque_raw_store_is_authority_and_any_hold_or_evidence_duplicate_must_equal_availability_ref_and_hash_byte_for_byte',
}

// Hold issuance is explicitly acyclic: precommit hold ref and evidence precede result; final hold follows result.
r31.authority_operation_hold_issuance_dag = {
  schema_version: 'ctrl.g24.authority-operation-hold-issuance-dag.r31.v1',
  nodes: ['select_branch_and_evidence_inputs', 'compute_hold_precommit_identity', 'derive_hold_row_ref', 'build_session_evidence', 'store_session_evidence', 'compute_result_referencing_hold_and_evidence', 'store_result', 'finalize_hold_row_with_result', 'store_hold_row', 'store_held_registry_row', 'store_historical_response', 'store_replay_payload', 'store_replay_envelope', 'atomic_commit'],
  edges: [['select_branch_and_evidence_inputs', 'compute_hold_precommit_identity'], ['compute_hold_precommit_identity', 'derive_hold_row_ref'], ['select_branch_and_evidence_inputs', 'build_session_evidence'], ['build_session_evidence', 'store_session_evidence'], ['derive_hold_row_ref', 'compute_result_referencing_hold_and_evidence'], ['store_session_evidence', 'compute_result_referencing_hold_and_evidence'], ['compute_result_referencing_hold_and_evidence', 'store_result'], ['store_result', 'finalize_hold_row_with_result'], ['derive_hold_row_ref', 'finalize_hold_row_with_result'], ['finalize_hold_row_with_result', 'store_hold_row'], ['store_hold_row', 'store_held_registry_row'], ['store_result', 'store_historical_response'], ['store_held_registry_row', 'store_replay_payload'], ['store_historical_response', 'store_replay_payload'], ['store_replay_payload', 'store_replay_envelope'], ['store_replay_envelope', 'atomic_commit']],
  forbidden_edges: [['compute_result_referencing_hold_and_evidence', 'build_session_evidence'], ['finalize_hold_row_with_result', 'derive_hold_row_ref']],
  evidence_result_fields_forbidden: ['result_ref', 'result_bytes_sha256', 'result_fingerprint'], acyclic_required: true,
}

// Historical response schema is selected by a closed operation and branch matrix, never by the caller.
const resultBranches = ['committed', ...heldBranches]
const responseMatrix = []
for (const [operationName, operation] of Object.entries(operations)) for (const branch of resultBranches) { const schema = operation.result_schema.variants[branch]; responseMatrix.push({ operation_name: operationName, result_branch: branch, response_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, response_schema_version: schema.schema_version }) }
r31.authority_operation_historical_response_schema = closed('ctrl.g24.authority-operation-historical-response.r31.v1', { operation_name: { type: 'enum', values: operationNames }, operation_id: id, result_branch: { type: 'enum', values: resultBranches }, response_schema_ref: id, response_schema_version: id, response_payload_ref: fp, response_payload_bytes_sha256: fp, result_ref: fp, result_fingerprint: fp, response_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_historical_response_r31', fingerprint_field: 'response_fingerprint', exact_equalities: ['operation_name_and_result_branch_select_exactly_one_matrix_row', 'response_schema_ref_and_version_equal_selected_matrix_row_and_are_not_caller_controlled', 'response_payload_ref_equals_response_payload_bytes_sha256_and_resolves_exact_original_canonical_result_response_artifact', 'response_payload_result_ref_and_result_fingerprint_equal_original_result'] })
r31.fingerprint_schemas.authority_operation_historical_response_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HISTORICAL-RESPONSE-R31', ['operation_name', 'operation_id', 'result_branch', 'response_schema_ref', 'response_schema_version', 'response_payload_ref', 'response_payload_bytes_sha256', 'result_ref', 'result_fingerprint'])
delete r31.fingerprint_schemas.authority_operation_historical_response_r30
r31.authority_operation_historical_response_schema_matrix = { schema_version: 'ctrl.g24.authority-operation-historical-response-schema-matrix.r31.v1', exact_expected_rows: operationNames.length * resultBranches.length, discriminator_order: ['operation_name', 'result_branch'], rows: responseMatrix, selection: 'exactly_one_row_or_hold_before_response_materialization', caller_schema_authority: 'none' }
r31.authority_operation_historical_response_artifact_store = canonicalStore('authority_operation_historical_responses', 'authority_operation_historical_response_schema', 131072)

// Replay variants keep committed registry identity separate from held registry plus hold identity.
const commonReplay = { operation_name: { type: 'enum', values: operationNames }, operation_id: id, historical_result_ref: fp, historical_result_bytes_sha256: fp, historical_result_fingerprint: fp, stored_historical_response_ref: fp, stored_historical_response_bytes_sha256: fp, stored_historical_response_fingerprint: fp }
const committedReplay = closed('ctrl.g24.authority-operation-replay-payload-committed.r31.v1', { replay_kind: { const: 'replayed' }, ...commonReplay, committed_registry_row_ref: fp, committed_registry_row_fingerprint: fp, payload_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_payload_committed_r31', fingerprint_field: 'payload_fingerprint', exact_equalities: ['committed_registry_row_ref_and_fingerprint_resolve_exact_original_committed_registry_row', 'historical_result_and_response_triples_equal_exact_committed_registry_row'], forbidden_fields: ['held_registry_row_ref', 'hold_row_ref', 'session_hold_evidence_ref'] })
const heldReplay = closed('ctrl.g24.authority-operation-replay-payload-held.r31.v1', { replay_kind: { const: 'replayed_held' }, ...commonReplay, held_registry_row_ref: fp, held_registry_row_fingerprint: fp, hold_row_ref: fp, hold_row_fingerprint: fp, session_hold_evidence_ref_or_unavailable: { type: 'sha256_or_exact_literal', literal: 'UNAVAILABLE' }, session_hold_evidence_bytes_sha256_or_unavailable: { type: 'sha256_or_exact_literal', literal: 'UNAVAILABLE' }, session_hold_evidence_fingerprint_or_unavailable: { type: 'sha256_or_exact_literal', literal: 'UNAVAILABLE' }, payload_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_payload_held_r31', fingerprint_field: 'payload_fingerprint', exact_equalities: ['held_registry_row_ref_and_fingerprint_resolve_exact_original_held_registry_row', 'hold_row_ref_and_fingerprint_equal_held_registry_join_and_resolve_exact_hold_row', 'historical_result_and_response_triples_equal_exact_held_registry_and_hold_row', 'session_hold_requires_exact_evidence_triple_and_ordinary_hold_requires_UNAVAILABLE'], forbidden_fields: ['committed_registry_row_ref'] })
r31.fingerprint_schemas.authority_operation_replay_payload_committed_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-COMMITTED-R31', committedReplay.exact_keys.filter(key => key !== 'payload_fingerprint'))
r31.fingerprint_schemas.authority_operation_replay_payload_held_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-HELD-R31', heldReplay.exact_keys.filter(key => key !== 'payload_fingerprint'))
delete r31.fingerprint_schemas.authority_operation_replay_payload_r30
r31.authority_operation_replay_payload_schema = { schema_version: 'ctrl.g24.authority-operation-replay-payload-union.r31.v1', type: 'discriminated_union', discriminator: 'replay_kind', variants: { replayed: committedReplay, replayed_held: heldReplay }, exact_variant_selection: true }
r31.authority_operation_replay_payload_artifact_store = canonicalStore('authority_operation_replay_payloads', 'authority_operation_replay_payload_schema', 131072)
r31.authority_operation_replay_envelope_schema.schema_version = 'ctrl.g24.authority-operation-replay-envelope.r31.v1'
r31.authority_operation_replay_envelope_schema.exact_equalities = ['payload_ref_equals_payload_bytes_sha256_and_resolves_exact_selected_replay_payload_variant', 'envelope_operation_replay_kind_and_operation_id_equal_payload', 'response_triple_equals_payload_stored_historical_response_triple', 'payload_fingerprint_is_computed_before_envelope_fingerprint']
r31.fingerprint_schemas.authority_operation_replay_envelope_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-ENVELOPE-R31', r31.authority_operation_replay_envelope_schema.exact_keys.filter(key => key !== 'envelope_fingerprint'))
r31.authority_operation_replay_envelope_schema.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_envelope_r31'; delete r31.fingerprint_schemas.authority_operation_replay_envelope_r30
r31.authority_operation_replay_envelope_artifact_store = canonicalStore('authority_operation_replay_envelopes', 'authority_operation_replay_envelope_schema', 131072)

const committedLookup = closed('ctrl.g24.authority-operation-replay-lookup-committed.r31.v1', { source_kind: { const: 'committed' }, committed_registry_row_ref: fp, committed_registry_row_fingerprint: fp, payload_ref: fp, payload_bytes_sha256: fp, payload_fingerprint: fp, envelope_ref: fp, envelope_bytes_sha256: fp, envelope_fingerprint: fp, lookup_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_lookup_committed_r31', fingerprint_field: 'lookup_fingerprint', unique_keys: [['committed_registry_row_ref']], exact_equalities: ['committed_registry_identity_equals_committed_payload_source'] })
const heldLookup = closed('ctrl.g24.authority-operation-replay-lookup-held.r31.v1', { source_kind: { const: 'held' }, held_registry_row_ref: fp, held_registry_row_fingerprint: fp, hold_row_ref: fp, hold_row_fingerprint: fp, payload_ref: fp, payload_bytes_sha256: fp, payload_fingerprint: fp, envelope_ref: fp, envelope_bytes_sha256: fp, envelope_fingerprint: fp, lookup_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_lookup_held_r31', fingerprint_field: 'lookup_fingerprint', unique_keys: [['held_registry_row_ref', 'hold_row_ref']], exact_equalities: ['held_registry_and_hold_identities_equal_held_payload_sources'] })
r31.fingerprint_schemas.authority_operation_replay_lookup_committed_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-LOOKUP-COMMITTED-R31', committedLookup.exact_keys.filter(key => key !== 'lookup_fingerprint'))
r31.fingerprint_schemas.authority_operation_replay_lookup_held_r31 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-LOOKUP-HELD-R31', heldLookup.exact_keys.filter(key => key !== 'lookup_fingerprint'))
r31.authority_operation_pre_materialized_replay_lookup_store = { schema_version: 'ctrl.g24.authority-operation-pre-materialized-replay-lookup-store.r31.v1', sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', row_union: { schema_version: 'ctrl.g24.authority-operation-replay-lookup-union.r31.v1', type: 'discriminated_union', discriminator: 'source_kind', variants: { committed: committedLookup, held: heldLookup }, exact_variant_selection: true }, first_replay: 'resolve_exact_committed_registry_identity_or_exact_held_registry_plus_hold_identity_then_return_existing_envelope_without_write', concurrent_replay: 'all_callers_resolve_byte_identical_envelope', restart_failure: 'hold_without_write_or_disclosure' }
r31.authority_operation_replay_derivation = { schema_version: 'ctrl.g24.authority-operation-replay-derivation.r31.v1', original_transaction_issuance_dag_ref: 'authority_operation_hold_issuance_dag', committed_path: ['resolve_committed_registry_row_ref_and_fingerprint', 'resolve_exact_historical_response', 'resolve_committed_lookup_payload_and_envelope', 'return_exact_original_response'], held_path: ['resolve_held_registry_row_ref_and_fingerprint', 'resolve_hold_row_ref_and_fingerprint', 'resolve_exact_historical_response', 'resolve_held_lookup_payload_and_envelope', 'return_exact_original_response'], replay_write_set: [], acyclic: true, dynamic_time: 'forbidden', first_replay_requires_write: false, cross_row_splicing: 'forbidden_by_separate_committed_or_held_registry_hold_result_response_and_lookup_equalities', sole_consumer_schema_ref: 'authority_operation_replay_envelope_schema' }
r31.authority_operation_replay_store_authority.schema_version = 'ctrl.g24.authority-operation-replay-store-authority.r31.v1'

// Regenerate the result artifact manifest only from the active R31 result schemas.
const resultRefs = responseMatrix.map(row => row.response_schema_ref)
const resultStores = {}
resultRefs.forEach((schemaRef, index) => { const store = canonicalStore('results', schemaRef, 131072); store.schema_version = `ctrl.g24.authority-result-artifact-${index + 1}-store.r31.v1`; store.row_schema.schema_version = `ctrl.g24.authority-result-artifact-${index + 1}-row.r31.v1`; resultStores[`schema_${index + 1}`] = store })
r31.authority_operation_artifact_stores.families.results = { schema_version: 'ctrl.g24.authority-artifact-family-results.r31.v1', expected_schema_refs: resultRefs, stores_by_schema_ref: resultStores }
r31.authority_operation_artifact_stores.schema_version = 'ctrl.g24.authority-operation-artifact-stores.r31.v1'

const heldRegistry = r31.authority_operation_registry.row_union.variants.original_persisted_hold
heldRegistry.schema_version = 'ctrl.g24.authority-operation-registry-held-row.r31.v1'
heldRegistry.exact_equalities = [...heldRegistry.exact_equalities.filter(rule => !rule.includes('hold_ref')), 'hold_row_ref_and_hold_fingerprint_equal_exact_final_hold_row', 'result_triple_equals_exact_held_result_that_references_hold_row_ref', 'historical_response_triple_equals_closed_matrix_artifact_for_same_operation_and_branch']
r31.fingerprint_schemas.authority_operation_registry_held = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R31', heldRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
r31.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r31.v1'; r31.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r31.v1'

const tx = r31.authority_operation_serializable_branch_transaction
tx.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r31.v1'
tx.hold_issuance_dag_ref = 'authority_operation_hold_issuance_dag'
tx.atomicity = 'evidence_and_precommit_hold_ref_precede_result_then_final_hold_registry_historical_response_replay_and_all_other_branch_writes_commit_or_none'
tx.crash_rule = 'rollback_includes_precommit_identity_evidence_result_final_hold_registry_historical_response_replay_and_all_nonce_target_head_receipt_artifacts'
tx.restart_postcondition = 'every_held_result_resolves_exact_hold_row_ref_every_held_registry_resolves_result_hold_and_historical_response_and_every_replay_resolves_separate_source_identities'

r31.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r31.v1'
r31.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r31.v1', derivation: 'bounded_exact_extension_from_frozen_R30_to_R31_acyclic_hold_evidence_universal_hold_row_identity_dual_held_replay_closed_response_matrix_exact_projection_formulas_and_sha256_raw_evidence', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.session_hold_evidence_schema', '$.held_result_identity_migration', '$.authority_operation_hold_store', '$.authority_opaque_raw_input_stores', '$.session_dual_proof_projection_formula_table', '$.session_hold_evidence_equality_tables', '$.authority_operation_hold_issuance_dag', '$.authority_operation_historical_response_schema', '$.authority_operation_historical_response_schema_matrix', '$.authority_operation_replay_payload_schema', '$.authority_operation_pre_materialized_replay_lookup_store', '$.authority_operation_replay_derivation', '$.authority_operation_artifact_stores.families.results', '$.authority_operation_registry', '$.authority_operation_serializable_branch_transaction'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r31_identifier: true, all_held_result_schema_refs: resultRefs.filter(ref => !ref.endsWith('.committed')) }
r31.required_negative_fixture_families = [...new Set([...r31.required_negative_fixture_families, 'session_hold_evidence_result_cycle_or_reverse_edge', 'legacy_hold_ref_in_any_held_result', 'held_replay_missing_registry_or_hold_identity', 'historical_response_schema_selection_or_fingerprint_splice', 'projection_nonce_subject_or_verifier_formula_drift', 'session_hold_evidence_field_equality_or_raw_role_drift', 'opaque_raw_identifier_instead_of_sha256_content_address'])]
r31.visible_surface_changes = []; r31.external_actions_authorized = []
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r31)
export const materializedR31 = r31; export const materializedR31Output = `${JSON.stringify(r31, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR31Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR31Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R31 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
