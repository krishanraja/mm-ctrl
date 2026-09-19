import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR28 } from './materialize-ctrl-g24-trusted-ingress-r28.mjs'

const root = process.cwd(), inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r28.json', outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r29.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8'), r29 = structuredClone(materializedR28)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r29.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function canonicalStore(family, schemaRef, maxBytes) { return { schema_version: `ctrl.g24.${family.replaceAll('_', '-')}-artifact-store.r29.v1`, canonical_schema_ref: schemaRef, row_schema: closed(`ctrl.g24.${family.replaceAll('_', '-')}-artifact-row.r29.v1`, { artifact_ref: fp, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64, canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact_r29', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes, canonical_validation: 'decode_base64url_verify_limit_exact_length_and_sha256_parse_exact_resolved_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', content_address_rule: 'artifact_ref_equals_canonical_bytes_sha256' }), sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_replay_or_audit_reference_exists', restart_failure: 'hold_without_response_or_write' } }

r29.schema_version = 'ctrl.g24.trusted-ingress.r29.effective.v1'
r29.status = 'twenty_eighth_repair_candidate_under_independent_review'
r29.supersedes = { commit: 'e3fcddbd7f4bc61c91122211831c0daf7d5ebc92', tree: 'cdbccc1b8f6e50258177b9ad1a13789cd950ac7b', human_blob: 'feda2c1d9243f3399bf3ded495dfd6a7faacdde3', machine_blob: '057d0ab12da16fdd02ce170561ded0c00a5267a1', qa_blob: 'b8191a7284b389cd4ca1a9782ab488a0793849f3', checker_blob: '35244b2b2e7439a011ca9a6aacd426ad76fae558', materializer_blob: '2268c6fc1ecc8bab15dc1f990d44e8d206c38896', founder_checker_blob: 'd3a1a2eab6a1cef15b98242079c52a7d7a41ceb3', adjudication: 'veto' }
r29.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r29.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r29.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const sessionNames = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']

// Bundle values are server-derived projections of resolved proof artifacts and selected authority subjects.
r29.session_dual_proof_bundle_schema.schema_version = 'ctrl.g24.session-dual-proof-bundle.r29.v1'
r29.session_dual_proof_bundle_schema.exact_equalities = [
  'bundle_operation_workspace_partition_and_audience_equal_request_and_both_resolved_subproof_scopes',
  'issuer_and_evaluator_roles_are_distinct_and_resolve_unique_current_authority_rows_in_one_snapshot',
  'both_subproof_signatures_and_times_validate_before_bundle_projection',
  'bundle_fields_are_server_projected_and_any_caller_duplicate_must_equal_projected_value_byte_for_byte',
]
r29.session_dual_proof_bundle_truth_projection = {
  schema_version: 'ctrl.g24.session-dual-proof-bundle-truth-projection.r29.v1', caller_asserted_duplicate_authority: 'none',
  resolved_field_equalities: [
    { bundle_field: 'operation_name', resolved_source: 'request.operation_name=issuer_proof.scope_operation_name=evaluator_proof.scope_operation_name' },
    { bundle_field: 'workspace_ref', resolved_source: 'selected_issuer.workspace_ref=selected_evaluator.workspace_ref=request.workspace_ref' },
    { bundle_field: 'target_partition_fingerprint', resolved_source: 'request.target_partition_fingerprint=issuer_proof.scope_partition_fingerprint=evaluator_proof.scope_partition_fingerprint' },
    { bundle_field: 'audience', resolved_source: 'issuer_proof.audience=evaluator_proof.audience=ctrl_case_session_authority_operation' },
    { bundle_field: 'issuer_proof_ref', resolved_source: 'resolved_issuer_proof_artifact.decoded.proof_ref' },
    { bundle_field: 'issuer_proof_bytes_sha256', resolved_source: 'resolved_issuer_proof_artifact.canonical_bytes_sha256' },
    { bundle_field: 'issuer_proof_fingerprint', resolved_source: 'resolved_issuer_proof_artifact.decoded.proof_fingerprint' },
    { bundle_field: 'issuer_nonce', resolved_source: 'resolved_issuer_proof_artifact.decoded.nonce' },
    { bundle_field: 'issuer_nonce_subject_fingerprint', resolved_source: 'proof_nonce_ledger.nonce_subject_derivation.issuer(selected_issuer_ref_row_version_and_artifact_fingerprint)' },
    { bundle_field: 'issuer_verifier_identity_fingerprint', resolved_source: 'domain_separated_fingerprint_of_resolved_issuer_proof_verifier_ref_version_and_artifact_sha256_joined_to_selected_issuer_verifier' },
    { bundle_field: 'evaluator_proof_ref', resolved_source: 'resolved_evaluator_proof_artifact.decoded.proof_ref' },
    { bundle_field: 'evaluator_proof_bytes_sha256', resolved_source: 'resolved_evaluator_proof_artifact.canonical_bytes_sha256' },
    { bundle_field: 'evaluator_proof_fingerprint', resolved_source: 'resolved_evaluator_proof_artifact.decoded.proof_fingerprint' },
    { bundle_field: 'evaluator_nonce', resolved_source: 'resolved_evaluator_proof_artifact.decoded.nonce' },
    { bundle_field: 'evaluator_nonce_subject_fingerprint', resolved_source: 'proof_nonce_ledger.nonce_subject_derivation.evaluator(selected_evaluator_ref_row_version_and_artifact_fingerprint)' },
    { bundle_field: 'evaluator_verifier_identity_fingerprint', resolved_source: 'domain_separated_fingerprint_of_resolved_evaluator_proof_verifier_ref_version_and_artifact_sha256_joined_to_selected_evaluator_verifier' },
  ],
  projection_order: ['resolve_and_verify_issuer_proof_artifact', 'resolve_and_verify_evaluator_proof_artifact', 'select_authority_and_verifier_subjects_in_same_snapshot', 'project_every_bundle_field', 'encode_canonical_bundle_without_bundle_fingerprint', 'compute_bundle_fingerprint'],
  bundle_fingerprint_preimage: 'exact_canonical_server_projected_bundle_fields_in_schema_order_excluding_bundle_fingerprint', substitution_or_mismatch_action: 'hold_before_nonce_or_target_write',
}
r29.fingerprint_schemas.session_dual_proof_bundle = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-BUNDLE-R29', r29.session_dual_proof_bundle_schema.exact_keys.filter(key => key !== 'bundle_fingerprint'))
r29.fingerprint_schemas.authority_artifact_r29 = fingerprint('CTRL-G24-AUTHORITY-ARTIFACT-R29', ['artifact_ref', 'artifact_family', 'canonical_schema_ref', 'canonical_bytes_b64url', 'canonical_bytes_length', 'canonical_bytes_sha256', 'parsed_content_fingerprint', 'stored_at', 'writer_role'])
r29.session_dual_proof_bundle_artifact_store = canonicalStore('session_dual_proof_bundles', 'session_dual_proof_bundle_schema', 65536)
r29.session_dual_proof_bundle_artifact_store.exact_resolution = 'decoded_fields_must_equal_every_session_dual_proof_bundle_truth_projection_resolved_field_equality_before_bundle_fingerprint_acceptance'

// Every nonce row has one canonical receipt ref and exact restart lookup.
const nonce = r29.proof_nonce_ledger
add(nonce.row_schema, 'nonce_receipt_ref', fp)
nonce.schema_version = 'ctrl.g24.proof-nonce-ledger.r29.v1'
nonce.row_schema.schema_version = 'ctrl.g24.proof-nonce-ledger-row.r29.v1'
nonce.row_schema.nonce_receipt_ref_derivation = 'sha256_of_exact_canonical_nonce_receipt_payload_bytes_before_nonce_receipt_ref_and_nonce_receipt_fingerprint'
nonce.row_schema.unique_keys = [['nonce_receipt_ref'], ['proof_family', 'nonce_subject_fingerprint', 'nonce']]
nonce.row_schema.restart_lookup = 'unique_nonce_receipt_ref_then_verify_payload_bytes_hash_all_fields_and_nonce_receipt_fingerprint_or_hold'
r29.proof_nonce_receipt_payload_schema = closed('ctrl.g24.proof-nonce-receipt-payload.r29.v1', Object.fromEntries(nonce.row_schema.exact_keys.filter(key => !['nonce_receipt_ref', 'nonce_receipt_fingerprint'].includes(key)).map(key => [key, nonce.row_schema.properties[key]])))
r29.fingerprint_schemas.proof_nonce_receipt = fingerprint('CTRL-G24-PROOF-NONCE-RECEIPT-R29', nonce.row_schema.exact_keys.filter(key => key !== 'nonce_receipt_fingerprint'))
r29.proof_nonce_receipt_store = { schema_version: 'ctrl.g24.proof-nonce-receipt-store.r29.v1', row_schema_ref: 'proof_nonce_ledger.row_schema', payload_schema_ref: 'proof_nonce_receipt_payload_schema', unique_lookup: ['nonce_receipt_ref'], content_address_rule: 'nonce_receipt_ref_equals_sha256_exact_canonical_payload_bytes', fingerprint_rule: 'nonce_receipt_fingerprint_binds_nonce_receipt_ref_and_every_payload_field', sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_receipt_read_set_registry_or_audit_reference_exists' }

for (const key of ['issuer_nonce_receipt_ref', 'evaluator_nonce_receipt_ref']) add(r29.case_session_authority_read_set_schema, key, id)
r29.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.case-session-authority-read-set.r29.v1'
r29.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R29', r29.case_session_authority_read_set_schema.exact_keys.filter(key => key !== 'snapshot_fingerprint'))
r29.case_session_authority_read_set_artifact_store = canonicalStore('case_session_authority_read_sets', 'case_session_authority_read_set_schema', 262144)
r29.case_session_authority_read_set_artifact_store.exact_receipt_resolution = 'receipt_authority_read_set_ref_equals_artifact_ref_bytes_sha256_and_decoded_snapshot_fingerprint'

// Receipt evidence and session receipts bind the bundle truth projection and both nonce receipt refs.
add(r29.session_dual_proof_receipt_evidence_schema, 'bundle_truth_projection_fingerprint', fp)
r29.session_dual_proof_receipt_evidence_schema.schema_version = 'ctrl.g24.session-dual-proof-receipt-evidence.r29.v1'
r29.session_dual_proof_receipt_evidence_schema.exact_equalities = [...r29.session_dual_proof_receipt_evidence_schema.exact_equalities, 'bundle_truth_projection_fingerprint_equals_exact_server_projection_used_to_build_bundle', 'issuer_and_evaluator_nonce_receipt_refs_resolve_distinct_role_specific_rows', 'authority_read_set_ref_resolves_const_bound_content_addressed_artifact']
r29.fingerprint_schemas.session_dual_proof_receipt_evidence_r29 = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-RECEIPT-EVIDENCE-R29', r29.session_dual_proof_receipt_evidence_schema.exact_keys.filter(key => key !== 'evidence_fingerprint'))
r29.session_dual_proof_receipt_evidence_schema.fingerprint_ref = 'fingerprint_schemas.session_dual_proof_receipt_evidence_r29'
delete r29.fingerprint_schemas.session_dual_proof_receipt_evidence_r28
r29.session_dual_proof_receipt_evidence_store = canonicalStore('session_dual_proof_receipt_evidence', 'session_dual_proof_receipt_evidence_schema', 131072)
const sessionReceipt = r29.authority_operation_receipt_store.row_union.variants.session_dual_proof_committed
add(sessionReceipt, 'bundle_truth_projection_fingerprint', fp)
sessionReceipt.schema_version = 'ctrl.g24.authority-operation-receipt-session-dual-proof-committed.r29.v1'
r29.fingerprint_schemas.authority_operation_receipt_session_r29 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-SESSION-DUAL-R29', sessionReceipt.exact_keys.filter(key => key !== 'receipt_fingerprint'))
sessionReceipt.fingerprint_ref = 'fingerprint_schemas.authority_operation_receipt_session_r29'
delete r29.fingerprint_schemas.authority_operation_receipt_session_r28
r29.authority_operation_receipt_store.schema_version = 'ctrl.g24.authority-operation-receipt-store.r29.v1'
r29.authority_operation_receipt_store.row_union.schema_version = 'ctrl.g24.authority-operation-receipt-row-union.r29.v1'
r29.authority_operation_receipt_store.exact_equalities.push('session_nonce_receipt_refs_and_authority_read_set_ref_resolve_exact_content_addressed_rows_in_same_transaction')

// Malformed bundle evidence has its own bounded opaque family and every hold slot has one exact family.
const raw = r29.authority_opaque_raw_input_stores
raw.schema_version = 'ctrl.g24.authority-opaque-raw-input-stores.r29.v1'
const bundleRaw = structuredClone(raw.proof_issuer)
bundleRaw.row_schema.schema_version = 'ctrl.g24.opaque-raw-malformed-proof-bundle-row.r29.v1'
bundleRaw.row_schema.properties.artifact_family.const = 'malformed_proof_bundle'
bundleRaw.row_schema.max_bytes = 65536
raw.proof_bundle = bundleRaw
r29.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r29.v1'
r29.authority_operation_hold_store.raw_slot_family_map = {
  raw_target: 'authority_opaque_raw_input_stores.target:malformed_target',
  raw_ordinary_proof: 'authority_opaque_raw_input_stores.proof_primary:malformed_proof_primary',
  raw_bundle: 'authority_opaque_raw_input_stores.proof_bundle:malformed_proof_bundle',
  raw_issuer_proof: 'authority_opaque_raw_input_stores.proof_issuer:malformed_proof_issuer',
  raw_evaluator_proof: 'authority_opaque_raw_input_stores.proof_evaluator:malformed_proof_evaluator',
}
r29.authority_operation_hold_store.role_splice_rule = 'every_available_ref_and_sha256_must_resolve_its_exact_mapped_family_and_cannot_satisfy_any_other_slot'
r29.authority_operation_hold_store.session_raw_availability_truth_table = r29.authority_operation_hold_store.session_raw_availability_truth_table.map(row => ({ ...row, bundle_family: 'malformed_proof_bundle', issuer_family: 'malformed_proof_issuer', evaluator_family: 'malformed_proof_evaluator' }))

// Original registry and hold rows receive acyclic content-addressed source identities.
const registry = r29.authority_operation_registry
const committedRegistry = registry.row_union.variants.original_committed, heldRegistry = registry.row_union.variants.original_persisted_hold
add(committedRegistry, 'registry_row_ref', fp); add(heldRegistry, 'registry_row_ref', fp)
committedRegistry.schema_version = 'ctrl.g24.authority-operation-registry-committed-row.r29.v1'
heldRegistry.schema_version = 'ctrl.g24.authority-operation-registry-held-row.r29.v1'
for (const schema of [committedRegistry, heldRegistry]) { schema.row_ref_preimage = 'exact_canonical_row_identity_payload_excluding_registry_row_ref_and_registry_fingerprint'; schema.row_ref_derivation = 'registry_row_ref_equals_sha256_of_row_ref_preimage'; schema.fingerprint_must_bind_row_ref = true }
r29.fingerprint_schemas.authority_operation_registry_committed = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R29', committedRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
r29.fingerprint_schemas.authority_operation_registry_held = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R29', heldRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
registry.schema_version = 'ctrl.g24.authority-operation-registry.r29.v1'; registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r29.v1'
for (const hold of Object.values(r29.authority_operation_hold_store.row_union.variants)) { add(hold, 'hold_row_ref', fp); hold.schema_version = hold.schema_version.replace('.r28.', '.r29.'); hold.row_ref_preimage = 'exact_canonical_hold_identity_payload_excluding_hold_row_ref_and_hold_fingerprint'; hold.row_ref_derivation = 'hold_row_ref_equals_sha256_of_row_ref_preimage'; hold.fingerprint_must_bind_row_ref = true }
r29.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r29.v1'
r29.fingerprint_schemas.authority_operation_hold_ordinary_r29 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-ORDINARY-R29', r29.authority_operation_hold_store.row_union.variants.ordinary_single_proof.exact_keys.filter(key => key !== 'hold_fingerprint'))
r29.fingerprint_schemas.authority_operation_hold_session_r29 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-SESSION-DUAL-R29', r29.authority_operation_hold_store.row_union.variants.session_dual_proof.exact_keys.filter(key => key !== 'hold_fingerprint'))
r29.authority_operation_hold_store.row_union.variants.ordinary_single_proof.fingerprint_ref = 'fingerprint_schemas.authority_operation_hold_ordinary_r29'
r29.authority_operation_hold_store.row_union.variants.session_dual_proof.fingerprint_ref = 'fingerprint_schemas.authority_operation_hold_session_r29'
delete r29.fingerprint_schemas.authority_operation_hold_ordinary_r28; delete r29.fingerprint_schemas.authority_operation_hold_session_r28

// Replay artifacts are pre-materialized atomically with the original result, so every replay is read only.
r29.authority_operation_replay_payload_schema = closed('ctrl.g24.authority-operation-replay-payload.r29.v1', {
  replay_kind: { type: 'enum', values: ['replayed', 'replayed_held'] }, operation_name: { type: 'enum', values: operationNames }, operation_id: id,
  source_row_kind: { type: 'enum', values: ['original_committed_registry', 'original_persisted_hold'] }, registry_row_ref_or_unavailable: { type: 'sha256_or_exact_literal', literal: 'UNAVAILABLE' }, hold_row_ref_or_unavailable: { type: 'sha256_or_exact_literal', literal: 'UNAVAILABLE' }, source_row_fingerprint: fp,
  historical_result_ref: fp, historical_result_bytes_sha256: fp, historical_result_fingerprint: fp, stored_historical_response_ref: fp, stored_historical_response_bytes_sha256: fp, stored_historical_response_fingerprint: fp, payload_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_payload_r29', fingerprint_field: 'payload_fingerprint', exact_equalities: ['committed_source_requires_registry_row_ref_and_UNAVAILABLE_hold_row_ref', 'held_source_requires_hold_row_ref_and_UNAVAILABLE_registry_row_ref', 'operation_name_and_operation_id_equal_exact_source_row', 'source_row_fingerprint_equals_resolved_registry_or_hold_row_fingerprint', 'historical_result_triple_equals_exact_source_row_result_triple', 'stored_historical_response_triple_resolves_exact_original_response_for_historical_result'], forbidden_fields: ['replayed_at', 'server_time', 'envelope_fingerprint'] })
r29.fingerprint_schemas.authority_operation_replay_payload_r29 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-R29', r29.authority_operation_replay_payload_schema.exact_keys.filter(key => key !== 'payload_fingerprint'))
delete r29.fingerprint_schemas.authority_operation_replay_payload_r28
r29.authority_operation_replay_envelope_schema.schema_version = 'ctrl.g24.authority-operation-replay-envelope.r29.v1'
r29.authority_operation_replay_envelope_schema.exact_equalities.push('payload_source_row_ref_and_fingerprint_resolve_exact_original_row_before_response_projection')
r29.fingerprint_schemas.authority_operation_replay_envelope_r29 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-ENVELOPE-R29', r29.authority_operation_replay_envelope_schema.exact_keys.filter(key => key !== 'envelope_fingerprint'))
r29.authority_operation_replay_envelope_schema.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_envelope_r29'
delete r29.fingerprint_schemas.authority_operation_replay_envelope_r28
r29.authority_operation_replay_payload_artifact_store = canonicalStore('authority_operation_replay_payloads', 'authority_operation_replay_payload_schema', 131072)
r29.authority_operation_replay_envelope_artifact_store = canonicalStore('authority_operation_replay_envelopes', 'authority_operation_replay_envelope_schema', 131072)
r29.authority_operation_pre_materialized_replay_lookup_store = {
  schema_version: 'ctrl.g24.authority-operation-pre-materialized-replay-lookup-store.r29.v1', sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden',
  row_schema: closed('ctrl.g24.authority-operation-pre-materialized-replay-lookup-row.r29.v1', { source_row_kind: { type: 'enum', values: ['original_committed_registry', 'original_persisted_hold'] }, source_row_ref: fp, source_row_fingerprint: fp, payload_ref: fp, payload_bytes_sha256: fp, payload_fingerprint: fp, envelope_ref: fp, envelope_bytes_sha256: fp, envelope_fingerprint: fp, lookup_fingerprint: fp }, { append_only: true, unique_keys: [['source_row_kind', 'source_row_ref'], ['envelope_ref']], fingerprint_ref: 'fingerprint_schemas.authority_operation_pre_materialized_replay_lookup_r29', fingerprint_field: 'lookup_fingerprint', exact_equalities: ['source_row_ref_and_fingerprint_resolve_exact_original_row', 'payload_and_envelope_triples_resolve_exact_pre_materialized_artifacts', 'envelope_payload_triple_equals_lookup_payload_triple'] }),
  first_replay: 'resolve_unique_source_row_lookup_then_payload_and_envelope_without_any_write', concurrent_replay: 'all_callers_resolve_byte_identical_envelope', restart_failure: 'hold_without_write_or_disclosure',
}
r29.fingerprint_schemas.authority_operation_pre_materialized_replay_lookup_r29 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-PRE-MATERIALIZED-REPLAY-LOOKUP-R29', r29.authority_operation_pre_materialized_replay_lookup_store.row_schema.exact_keys.filter(key => key !== 'lookup_fingerprint'))
r29.authority_operation_replay_derivation = { schema_version: 'ctrl.g24.authority-operation-replay-derivation.r29.v1', original_transaction_issuance_dag: ['validate_original_branch_and_compute_result', 'assemble_source_row_identity_payload', 'compute_registry_row_ref_or_hold_row_ref', 'assemble_replay_payload_from_source_result_and_stored_response', 'compute_and_store_payload_artifact', 'assemble_and_store_envelope_artifact', 'insert_unique_pre_materialized_replay_lookup', 'atomically_commit_original_outcome_and_all_replay_artifacts'], replay_path: ['resolve_original_source_row', 'resolve_unique_pre_materialized_replay_lookup', 'resolve_and_verify_payload_and_envelope_artifacts', 'return_stored_envelope_bytes'], replay_write_set: [], acyclic: true, dynamic_time: 'forbidden', first_replay_requires_write: false, cross_row_splicing: 'forbidden_by_source_result_response_and_lookup_equalities', sole_consumer_schema_ref: 'authority_operation_replay_envelope_schema' }

// One serializable transaction owns every effect of each original branch.
r29.authority_operation_serializable_branch_transaction = {
  schema_version: 'ctrl.g24.authority-operation-serializable-branch-transaction.r29.v1', isolation: 'serializable', sole_executor: 'ctrl_authority_operation_executor', atomicity: 'all_listed_reads_validations_and_writes_commit_or_none', crash_rule: 'rollback_includes_nonce_rows_and_every_artifact_registry_target_head_receipt_hold_result_and_replay_write',
  common_boundary: ['registry_replay_or_collision_resolution', 'session_and_authority_snapshot_CAS', 'proof_structure_signature_scope_time_and_subject_validation', 'branch_selection', 'branch_exact_write_set', 'postcondition_and_atomic_commit'],
  branch_write_sets: [
    { branch: 'committed', ordinary_nonce_rows: 1, session_nonce_rows: 2, required: ['request_and_proof_artifacts', 'session_bundle_and_authority_read_set_artifacts_when_session', 'target_append', 'partition_head_advance', 'original_committed_registry_row', 'result_blob', 'ordinary_or_session_committed_receipt', 'session_receipt_evidence_artifact_when_session', 'pre_materialized_replay_payload_envelope_and_lookup'] },
    { branch: 'authorization_hold', ordinary_nonce_rows: 0, session_nonce_rows: 0, required: ['request_and_available_raw_artifacts', 'hold_row', 'original_held_registry_row', 'result_blob', 'pre_materialized_replay_payload_envelope_and_lookup'], forbidden: ['target_append', 'partition_head_advance', 'committed_receipt'] },
    { branch: 'stale_head_hold', ordinary_nonce_rows: 1, session_nonce_rows: 2, required: ['verified_proof_and_nonce_rows', 'session_bundle_and_authority_read_set_artifacts_when_session', 'hold_row', 'original_held_registry_row', 'result_blob', 'pre_materialized_replay_payload_envelope_and_lookup'], forbidden: ['target_append', 'partition_head_advance', 'committed_receipt'] },
    { branch: 'invalid_target_hold', ordinary_nonce_rows: 1, session_nonce_rows: 2, required: ['verified_proof_and_nonce_rows', 'session_bundle_and_authority_read_set_artifacts_when_session', 'raw_target_artifact', 'hold_row', 'original_held_registry_row', 'result_blob', 'pre_materialized_replay_payload_envelope_and_lookup'], forbidden: ['target_append', 'partition_head_advance', 'committed_receipt'] },
    { branch: 'invalid_proof_hold', ordinary_nonce_rows: 0, session_nonce_rows: 0, required: ['request_and_exact_role_raw_proof_or_bundle_artifacts', 'hold_row', 'original_held_registry_row', 'result_blob', 'pre_materialized_replay_payload_envelope_and_lookup'], forbidden: ['nonce_rows', 'target_append', 'partition_head_advance', 'committed_receipt'] },
    { branch: 'internal_failure_hold', ordinary_nonce_rows: 0, session_nonce_rows: 0, required: ['request_and_any_available_bounded_raw_artifacts', 'hold_row', 'original_held_registry_row', 'result_blob', 'pre_materialized_replay_payload_envelope_and_lookup'], forbidden: ['nonce_rows', 'target_append', 'partition_head_advance', 'committed_receipt'] },
  ],
  session_two_nonce_rule: 'issuer_and_evaluator_nonce_rows_insert_in_same_transaction_or_neither_exists', hold_vs_receipt: 'exactly_one_hold_row_or_committed_receipt_never_both', restart_postcondition: 'every_original_registry_row_resolves_result_and_pre_materialized_replay_lookup_and_every_committed_row_resolves_receipt',
}

// Propagate R29 evidence authority through active consumers and manifests.
for (const name of sessionNames) { operations[name].schema_version = operations[name].schema_version.replace('.r28.', '.r29.'); operations[name].bundle_truth_projection_ref = 'session_dual_proof_bundle_truth_projection'; operations[name].branch_transaction_ref = 'authority_operation_serializable_branch_transaction' }
r29.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r29.v1'
r29.authority_operation_artifact_stores.schema_version = 'ctrl.g24.authority-operation-artifact-stores.r29.v1'
const replayFamily = r29.authority_operation_artifact_stores.families.replay_responses
replayFamily.schema_version = 'ctrl.g24.authority-artifact-family-replay-responses.r29.v1'
for (const store of Object.values(replayFamily.stores_by_schema_ref)) { store.row_schema.schema_version = store.row_schema.schema_version.replace('.r28.', '.r29.'); store.row_schema.fingerprint_ref = 'fingerprint_schemas.authority_artifact_r29' }
r29.authority_operation_artifact_stores.transaction_boundary_ref = 'authority_operation_serializable_branch_transaction'

r29.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r29.v1', derivation: 'bounded_exact_extension_from_frozen_R28_to_R29_bundle_truth_nonce_and_read_set_receipts_atomic_branch_boundary_role_exact_raw_evidence_and_pre_materialized_replay', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.session_dual_proof_bundle_schema', '$.session_dual_proof_bundle_truth_projection', '$.session_dual_proof_bundle_artifact_store', '$.proof_nonce_ledger', '$.proof_nonce_receipt_store', '$.case_session_authority_read_set_schema', '$.case_session_authority_read_set_artifact_store', '$.session_dual_proof_receipt_evidence_schema', '$.session_dual_proof_receipt_evidence_store', '$.authority_operation_receipt_store', '$.authority_opaque_raw_input_stores', '$.authority_operation_hold_store', '$.authority_operation_registry', '$.authority_operation_replay_payload_schema', '$.authority_operation_replay_envelope_schema', '$.authority_operation_pre_materialized_replay_lookup_store', '$.authority_operation_replay_derivation', '$.authority_operation_serializable_branch_transaction'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r29_identifier: true }
r29.required_negative_fixture_families = [...new Set([...r29.required_negative_fixture_families, 'dual_bundle_resolved_field_join_or_subject_substitution', 'nonce_receipt_ref_or_authority_read_set_artifact_resolution', 'partial_branch_transaction_or_nonce_poison_after_crash', 'malformed_bundle_store_or_raw_role_splice', 'registry_and_hold_source_row_ref_derivation', 'first_replay_write_or_missing_pre_materialized_lookup'])]
r29.visible_surface_changes = []; r29.external_actions_authorized = []
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r29)
export const materializedR29 = r29; export const materializedR29Output = `${JSON.stringify(r29, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR29Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR29Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R29 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
