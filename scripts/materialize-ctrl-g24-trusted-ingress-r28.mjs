import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR27 } from './materialize-ctrl-g24-trusted-ingress-r27.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r27.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r28.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r28 = structuredClone(materializedR27)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }
const nullableId = { type: 'nullable', value_schema: id }, nullableFp = { type: 'nullable', value_schema: fp }
const availability = { type: 'enum', values: ['available', 'unavailable'] }
const refOrUnavailable = { type: 'identifier_or_exact_literal', literal: 'UNAVAILABLE' }
const fpOrUnavailable = { type: 'sha256_or_exact_literal', literal: 'UNAVAILABLE' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r28.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function resolveRef(rootValue, path) { let value = rootValue; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) throw new Error(`unresolved schema ref: ${path}`); value = value[part] } return value }
function canonicalStore(family, schemaRef, maxBytes, index) { resolveRef(r28, schemaRef); const row = closed(`ctrl.g24.authority-artifact-${family}-${index}-row.r28.v1`, { artifact_ref: fp, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64, canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact_r28', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes, canonical_validation: 'decode_base64url_verify_limit_exact_length_and_sha256_parse_exact_resolved_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', content_address_rule: 'artifact_ref_equals_canonical_bytes_sha256' }); return { canonical_schema_ref: schemaRef, row_schema: row, sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_result_replay_or_audit_reference_exists', restart_failure: 'hold_without_response_target_write_or_disclosure' } }
function family(name, refs, maxBytes) { const stores = {}; refs.forEach((ref, index) => { stores[`schema_${index + 1}`] = canonicalStore(name, ref, maxBytes, index + 1) }); return { schema_version: `ctrl.g24.authority-artifact-family-${name}.r28.v1`, expected_schema_refs: refs, stores_by_schema_ref: stores } }

r28.schema_version = 'ctrl.g24.trusted-ingress.r28.effective.v1'
r28.status = 'twenty_seventh_repair_candidate_under_independent_review'
r28.supersedes = { commit: '41984124b10f31aeb51a55aaee1639d2b074652c', tree: 'f12c5e7d6ba6563a670b869b0213e9dc4342a949', human_blob: '7f722c1347b13df3cb2134f4bc53041d38262c21', machine_blob: '8b75c07a474a5b36d450aeb11b89622332c70966', qa_blob: 'f8d48414b7b38f9b886c51f5b2981b339522f035', checker_blob: 'bcdcfa1e81efe49ec8023cb8f56e38d9e4573845', materializer_blob: '22676ccae71ab383add30262476ce95571fc8f91', founder_checker_blob: 'd3a1a2eab6a1cef15b98242079c52a7d7a41ceb3', adjudication: 'veto' }
r28.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r28.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operationNames = Object.keys(r28.case_session_authority_operation_protocols.operations)
const sessionNames = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']
const ordinaryNames = operationNames.filter(name => !sessionNames.includes(name))

// Rebuild the three session requests and bind their exact closed keys into R28 request fingerprints.
for (const name of sessionNames) {
  const protocol = r28.case_session_authority_operation_protocols.operations[name]
  const request = closed(`ctrl.g24.authority-operation-${name.replaceAll('_', '-')}-request.r28.v1`, {
    operation_name: { const: name }, operation_id: id, idempotency_key: fp, target_store: { const: 'case_server_session_principal_evidence' },
    target_partition_fingerprint: fp, target_intent_schema_ref: { const: `case_session_authority_operation_protocols.operations.${name}.target_intent_schema` }, target_intent_bytes_ref: id, target_intent_bytes_sha256: fp,
    expected_head_row_version_ref: nullableId, expected_head_order: uint, expected_head_row_fingerprint: nullableFp, expected_head_fingerprint: nullableFp,
    dual_proof_bundle_schema_ref: { const: 'session_dual_proof_bundle_schema' }, dual_proof_bundle_bytes_ref: fp, dual_proof_bundle_bytes_sha256: fp, dual_proof_bundle_fingerprint: fp,
  })
  protocol.schema_version = `ctrl.g24.authority-operation-${name.replaceAll('_', '-')}-protocol.r28.v1`
  protocol.request_schema = request
  protocol.request_fingerprint = fingerprint(`CTRL-G24-${name.replaceAll('_', '-').toUpperCase()}-REQUEST-R28`, request.exact_keys)
  protocol.request_fingerprint.exact_closed_schema_keys_ref = `case_session_authority_operation_protocols.operations.${name}.request_schema.exact_keys`
  protocol.request_fingerprint.preimage_keys_must_equal_exact_schema_keys_in_order = true
}
r28.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r28.v1'

// Persist canonical dual bundles and the complete evidence required to audit both proofs and both nonce rows.
r28.session_dual_proof_bundle_artifact_store = { schema_version: 'ctrl.g24.session-dual-proof-bundle-artifact-store.r28.v1', ...canonicalStore('session_dual_proof_bundles', 'session_dual_proof_bundle_schema', 65536, 1) }
r28.session_dual_proof_receipt_evidence_schema = closed('ctrl.g24.session-dual-proof-receipt-evidence.r28.v1', {
    operation_name: { type: 'enum', values: sessionNames }, operation_id: id,
    dual_proof_bundle_ref: fp, dual_proof_bundle_bytes_sha256: fp, dual_proof_bundle_fingerprint: fp,
    issuer_proof_schema_ref: { const: 'case_session_issuer_capability_proof_schema' }, issuer_proof_ref: id, issuer_proof_bytes_sha256: fp, issuer_proof_fingerprint: fp, issuer_nonce_receipt_ref: id, issuer_nonce_receipt_fingerprint: fp,
    evaluator_proof_schema_ref: { const: 'case_session_evaluator_capability_proof_schema' }, evaluator_proof_ref: id, evaluator_proof_bytes_sha256: fp, evaluator_proof_fingerprint: fp, evaluator_nonce_receipt_ref: id, evaluator_nonce_receipt_fingerprint: fp,
    authority_read_set_ref: fp, authority_read_set_bytes_sha256: fp, authority_read_set_fingerprint: fp, evidence_fingerprint: fp,
  }, { fingerprint_ref: 'fingerprint_schemas.session_dual_proof_receipt_evidence_r28', fingerprint_field: 'evidence_fingerprint', exact_equalities: ['bundle_triple_equals_request_bundle_triple_and_bundle_artifact', 'proof_triples_equal_bundle_subproofs_and_verified_proof_artifacts', 'nonce_receipt_refs_and_fingerprints_resolve_exactly_two_distinct_role_specific_nonce_rows_written_atomically', 'authority_read_set_triple_equals_exact_transaction_snapshot'] })
r28.fingerprint_schemas.session_dual_proof_receipt_evidence_r28 = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-RECEIPT-EVIDENCE-R28', r28.session_dual_proof_receipt_evidence_schema.exact_keys.filter(key => key !== 'evidence_fingerprint'))
r28.session_dual_proof_receipt_evidence_store = { schema_version: 'ctrl.g24.session-dual-proof-receipt-evidence-store.r28.v1', ...canonicalStore('session_dual_proof_receipt_evidence', 'session_dual_proof_receipt_evidence_schema', 131072, 1) }

const targetStores = r28.authority_operation_receipt_store.row_union.variants.committed?.properties?.target_store?.values ?? ['case_session_root_trust_anchors', 'case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const commonReceipt = (kind, names) => ({
  receipt_ref: fp, receipt_kind: { const: kind }, target_store: { type: 'enum', values: targetStores }, operation_name: { type: 'enum', values: names }, operation_id: id, idempotency_key: fp,
  request_fingerprint: fp, request_bytes_ref: fp, request_bytes_sha256: fp,
  target_row_schema_ref: id, target_row_bytes_ref: fp, target_row_bytes_sha256: fp, target_row_fingerprint: fp, prior_row_version_ref: nullableId, prior_row_fingerprint: nullableFp,
  result_branch: { const: 'committed' }, result_bytes_ref: fp, result_bytes_sha256: fp, result_fingerprint: fp,
  server_committed_at: ts, partition_head_prior_fingerprint: nullableFp, partition_head_new_fingerprint: fp, authority_order: uint,
})
const ordinaryReceipt = closed('ctrl.g24.authority-operation-receipt-ordinary-single-proof-committed.r28.v1', { ...commonReceipt('ordinary_single_proof_committed', ordinaryNames), authority_proof_schema_ref: id, authority_proof_bytes_ref: id, authority_proof_bytes_sha256: fp, authority_proof_fingerprint: fp, nonce_receipt_ref: id, nonce_receipt_fingerprint: fp, receipt_fingerprint: fp }, { append_only: true, unique_keys: [['receipt_ref'], ['target_store', 'operation_id', 'idempotency_key']], fingerprint_ref: 'fingerprint_schemas.authority_operation_receipt_ordinary_r28', fingerprint_field: 'receipt_fingerprint' })
const sessionReceipt = closed('ctrl.g24.authority-operation-receipt-session-dual-proof-committed.r28.v1', { ...commonReceipt('session_dual_proof_committed', sessionNames), dual_proof_bundle_schema_ref: { const: 'session_dual_proof_bundle_schema' }, dual_proof_bundle_ref: fp, dual_proof_bundle_bytes_sha256: fp, dual_proof_bundle_fingerprint: fp, issuer_proof_schema_ref: { const: 'case_session_issuer_capability_proof_schema' }, issuer_proof_ref: id, issuer_proof_bytes_sha256: fp, issuer_proof_fingerprint: fp, issuer_nonce_receipt_ref: id, issuer_nonce_receipt_fingerprint: fp, evaluator_proof_schema_ref: { const: 'case_session_evaluator_capability_proof_schema' }, evaluator_proof_ref: id, evaluator_proof_bytes_sha256: fp, evaluator_proof_fingerprint: fp, evaluator_nonce_receipt_ref: id, evaluator_nonce_receipt_fingerprint: fp, authority_read_set_ref: fp, authority_read_set_bytes_sha256: fp, authority_read_set_fingerprint: fp, receipt_evidence_ref: fp, receipt_evidence_bytes_sha256: fp, receipt_evidence_fingerprint: fp, receipt_fingerprint: fp }, { append_only: true, unique_keys: [['receipt_ref'], ['target_store', 'operation_id', 'idempotency_key']], fingerprint_ref: 'fingerprint_schemas.authority_operation_receipt_session_r28', fingerprint_field: 'receipt_fingerprint', forbidden_fields: ['authority_proof_schema_ref', 'authority_proof_bytes_ref', 'authority_proof_bytes_sha256', 'nonce_receipt_ref'] })
r28.fingerprint_schemas.authority_operation_receipt_ordinary_r28 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-ORDINARY-R28', ordinaryReceipt.exact_keys.filter(key => key !== 'receipt_fingerprint'))
r28.fingerprint_schemas.authority_operation_receipt_session_r28 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-SESSION-DUAL-R28', sessionReceipt.exact_keys.filter(key => key !== 'receipt_fingerprint'))
delete r28.fingerprint_schemas.authority_operation_receipt
r28.authority_operation_receipt_store = { schema_version: 'ctrl.g24.authority-operation-receipt-store.r28.v1', sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', row_union: { schema_version: 'ctrl.g24.authority-operation-receipt-row-union.r28.v1', discriminator: 'receipt_kind', exact_variants: ['ordinary_single_proof_committed', 'session_dual_proof_committed'], variants: { ordinary_single_proof_committed: ordinaryReceipt, session_dual_proof_committed: sessionReceipt } }, operation_to_variant: Object.fromEntries(operationNames.map(name => [name, sessionNames.includes(name) ? 'session_dual_proof_committed' : 'ordinary_single_proof_committed'])), exact_equalities: ['receipt_operation_variant_selected_by_exact_operation_name', 'receipt_request_target_result_and_partition_head_identities_equal_registry_and_content_addressed_artifacts', 'session_receipt_bundle_proof_nonce_and_read_set_fields_equal_exact_receipt_evidence_row', 'session_receipt_contains_no_singular_authority_proof_triple'], restart_rule: 'resolve_exact_discriminated_receipt_variant_and_every_content_addressed_artifact_or_hold' }
for (const name of sessionNames) {
  const protocol = r28.case_session_authority_operation_protocols.operations[name]
  protocol.receipt_schema_ref = 'authority_operation_receipt_store.row_union.variants.session_dual_proof_committed'
  protocol.receipt_evidence_schema_ref = 'session_dual_proof_receipt_evidence_schema'
}

// The dual session operation consumes two role-specific nonce rows. No composite proof family remains.
const proofFamilies = r28.proof_nonce_ledger.row_schema.properties.proof_family.values.filter(value => value !== 'issuer_and_evaluator')
r28.proof_nonce_ledger.schema_version = 'ctrl.g24.proof-nonce-ledger.r28.v1'
r28.proof_nonce_ledger.row_schema.schema_version = 'ctrl.g24.proof-nonce-ledger-row.r28.v1'
r28.proof_nonce_ledger.row_schema.properties.proof_family.values = proofFamilies
delete r28.proof_nonce_ledger.nonce_subject_derivation.issuer_and_evaluator
r28.proof_nonce_ledger.session_dual_bundle_rule = 'write_exactly_one_issuer_family_nonce_row_and_one_evaluator_family_nonce_row_atomically_with_distinct_receipt_refs_and_no_composite_family'
r28.fingerprint_schemas.proof_nonce_receipt = fingerprint('CTRL-G24-PROOF-NONCE-RECEIPT-R28', r28.proof_nonce_ledger.row_schema.exact_keys.filter(key => key !== 'nonce_receipt_fingerprint'))

// Hold evidence is discriminated between ordinary single-proof and session dual-proof operations.
const holdBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const commonHold = (kind, names) => ({ hold_ref: fp, hold_kind: { const: kind }, target_store: { type: 'enum', values: targetStores }, operation_name: { type: 'enum', values: names }, operation_id: id, idempotency_key: fp, request_fingerprint: fp, hold_branch: { type: 'enum', values: holdBranches }, request_artifact_ref: fp, request_artifact_sha256: fp, raw_target_availability: availability, raw_target_ref_or_unavailable: refOrUnavailable, raw_target_sha256_or_unavailable: fpOrUnavailable, result_ref: fp, result_bytes_sha256: fp, result_fingerprint: fp, held_at: ts })
const availabilityRules = ['available_requires_ref_and_sha256_resolving_exact_bounded_opaque_store_row', 'unavailable_requires_both_exact_UNAVAILABLE_literals', 'first_matching_branch_rule_is_total_and_no_later_rule_may_override']
const ordinaryHold = closed('ctrl.g24.authority-operation-hold-ordinary-single-proof-row.r28.v1', { ...commonHold('ordinary_single_proof', ordinaryNames), raw_proof_availability: availability, raw_proof_ref_or_unavailable: refOrUnavailable, raw_proof_sha256_or_unavailable: fpOrUnavailable, hold_fingerprint: fp }, { append_only: true, fingerprint_ref: 'fingerprint_schemas.authority_operation_hold_ordinary_r28', fingerprint_field: 'hold_fingerprint', conditional_rules: availabilityRules })
const sessionHold = closed('ctrl.g24.authority-operation-hold-session-dual-proof-row.r28.v1', { ...commonHold('session_dual_proof', sessionNames), raw_bundle_availability: availability, raw_bundle_ref_or_unavailable: refOrUnavailable, raw_bundle_sha256_or_unavailable: fpOrUnavailable, raw_issuer_proof_availability: availability, raw_issuer_proof_ref_or_unavailable: refOrUnavailable, raw_issuer_proof_sha256_or_unavailable: fpOrUnavailable, raw_evaluator_proof_availability: availability, raw_evaluator_proof_ref_or_unavailable: refOrUnavailable, raw_evaluator_proof_sha256_or_unavailable: fpOrUnavailable, hold_fingerprint: fp }, { append_only: true, fingerprint_ref: 'fingerprint_schemas.authority_operation_hold_session_r28', fingerprint_field: 'hold_fingerprint', conditional_rules: availabilityRules })
r28.fingerprint_schemas.authority_operation_hold_ordinary_r28 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-ORDINARY-R28', ordinaryHold.exact_keys.filter(key => key !== 'hold_fingerprint'))
r28.fingerprint_schemas.authority_operation_hold_session_r28 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-SESSION-DUAL-R28', sessionHold.exact_keys.filter(key => key !== 'hold_fingerprint'))
delete r28.fingerprint_schemas.authority_operation_hold
r28.authority_operation_hold_store = { schema_version: 'ctrl.g24.authority-operation-hold-store.r28.v1', sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', row_union: { schema_version: 'ctrl.g24.authority-operation-hold-row-union.r28.v1', discriminator: 'hold_kind', exact_variants: ['ordinary_single_proof', 'session_dual_proof'], variants: { ordinary_single_proof: ordinaryHold, session_dual_proof: sessionHold } }, selection_order: ['if_operation_name_is_one_of_exact_session_operations_select_session_dual_proof', 'otherwise_if_operation_name_is_in_closed_operation_enum_select_ordinary_single_proof', 'otherwise_fail_closed_before_write'], first_match_total: true, session_raw_availability_truth_table: [
  { bundle: 'unavailable', issuer: 'unavailable', evaluator: 'unavailable', required_literals: 'all_UNAVAILABLE' },
  { bundle: 'unavailable', issuer: 'unavailable', evaluator: 'available', required_literals: 'bundle_and_issuer_UNAVAILABLE' },
  { bundle: 'unavailable', issuer: 'available', evaluator: 'unavailable', required_literals: 'bundle_and_evaluator_UNAVAILABLE' },
  { bundle: 'unavailable', issuer: 'available', evaluator: 'available', required_literals: 'bundle_UNAVAILABLE' },
  { bundle: 'available', issuer: 'unavailable', evaluator: 'unavailable', required_literals: 'issuer_and_evaluator_UNAVAILABLE' },
  { bundle: 'available', issuer: 'unavailable', evaluator: 'available', required_literals: 'issuer_UNAVAILABLE' },
  { bundle: 'available', issuer: 'available', evaluator: 'unavailable', required_literals: 'evaluator_UNAVAILABLE' },
  { bundle: 'available', issuer: 'available', evaluator: 'available', required_literals: 'none' },
], replay_schema_ref: 'authority_operation_replay_envelope_schema', unique_keys: [['target_store', 'operation_id', 'request_fingerprint'], ['target_store', 'idempotency_key', 'request_fingerprint']] }
const heldRegistry = r28.authority_operation_registry.row_union.variants.original_persisted_hold
add(heldRegistry, 'hold_schema_ref', { type: 'enum', values: ['authority_operation_hold_store.row_union.variants.ordinary_single_proof', 'authority_operation_hold_store.row_union.variants.session_dual_proof'] })
heldRegistry.schema_version = 'ctrl.g24.authority-operation-registry-held-row.r28.v1'
r28.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r28.v1'
r28.fingerprint_schemas.authority_operation_registry_held = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R28', heldRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))

// Replay is one immutable payload and one acyclic envelope. Every consumer references the envelope.
r28.authority_operation_replay_payload_schema = closed('ctrl.g24.authority-operation-replay-payload.r28.v1', { replay_kind: { type: 'enum', values: ['replayed', 'replayed_held'] }, operation_name: { type: 'enum', values: operationNames }, operation_id: id, original_durable_state: { type: 'enum', values: ['original_committed', 'original_persisted_hold'] }, original_registry_or_hold_ref: fp, original_registry_or_hold_fingerprint: fp, historical_result_ref: fp, historical_result_bytes_sha256: fp, historical_result_fingerprint: fp, stored_historical_response_ref: fp, stored_historical_response_bytes_sha256: fp, stored_historical_response_fingerprint: fp, payload_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_payload_r28', fingerprint_field: 'payload_fingerprint', exact_equalities: ['operation_name_and_operation_id_equal_original_registry_or_hold_row', 'durable_state_selects_exact_original_row_variant', 'historical_result_triple_equals_original_row_result_triple', 'stored_historical_response_triple_resolves_exact_response_for_historical_result_without_recomputation', 'replayed_held_source_and_response_equal_original_persisted_hold', 'replayed_source_and_response_equal_original_committed_row'], forbidden_fields: ['replayed_at', 'server_time', 'envelope_fingerprint'] })
r28.fingerprint_schemas.authority_operation_replay_payload_r28 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-R28', r28.authority_operation_replay_payload_schema.exact_keys.filter(key => key !== 'payload_fingerprint'))
r28.authority_operation_replay_payload_artifact_store = { schema_version: 'ctrl.g24.authority-operation-replay-payload-artifact-store.r28.v1', ...canonicalStore('replay_payloads', 'authority_operation_replay_payload_schema', 131072, 1) }
r28.authority_operation_replay_envelope_schema = closed('ctrl.g24.authority-operation-replay-envelope.r28.v1', { envelope_kind: { const: 'authority_operation_replay' }, replay_kind: { type: 'enum', values: ['replayed', 'replayed_held'] }, operation_name: { type: 'enum', values: operationNames }, operation_id: id, payload_ref: fp, payload_bytes_sha256: fp, payload_fingerprint: fp, replay_response_ref: fp, replay_response_bytes_sha256: fp, replay_response_fingerprint: fp, envelope_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay_envelope_r28', fingerprint_field: 'envelope_fingerprint', exact_equalities: ['payload_ref_equals_payload_bytes_sha256_and_resolves_exact_payload_artifact', 'envelope_operation_replay_kind_and_operation_id_equal_payload', 'response_triple_equals_payload_stored_historical_response_triple', 'payload_fingerprint_is_computed_before_envelope_fingerprint'], forbidden_fields: ['replayed_at', 'server_time'] })
r28.fingerprint_schemas.authority_operation_replay_envelope_r28 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-ENVELOPE-R28', r28.authority_operation_replay_envelope_schema.exact_keys.filter(key => key !== 'envelope_fingerprint'))
r28.authority_operation_replay_derivation = { schema_version: 'ctrl.g24.authority-operation-replay-derivation.r28.v1', issuance_dependency_dag: ['resolve_original_registry_or_hold_row', 'resolve_exact_historical_result_and_stored_response', 'assemble_canonical_payload_bytes', 'compute_payload_bytes_sha256_and_payload_fingerprint', 'store_or_resolve_payload_by_content_address', 'assemble_envelope_with_payload_and_response_triples', 'compute_envelope_fingerprint'], acyclic: true, cross_row_splicing: 'forbidden_by_exact_operation_source_result_response_equalities', dynamic_time: 'forbidden', sole_consumer_schema_ref: 'authority_operation_replay_envelope_schema' }
delete r28.authority_operation_replay_schema
delete r28.fingerprint_schemas.authority_operation_replay
r28.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r28.v1'
r28.authority_operation_registry.exact_committed_replay = 'project_authority_operation_replay_envelope_schema_from_exact_committed_source_without_write'
r28.authority_operation_registry.exact_held_replay = 'project_authority_operation_replay_envelope_schema_from_exact_held_source_without_write'
r28.authority_operation_registry.replay_schema_ref = 'authority_operation_replay_envelope_schema'
for (const [name, protocol] of Object.entries(r28.case_session_authority_operation_protocols.operations)) {
  if (!sessionNames.includes(name)) protocol.schema_version = protocol.schema_version.replace('.r27.', '.r28.')
  protocol.replay_schema_ref = 'authority_operation_replay_envelope_schema'
}
r28.case_session_authority_operation_protocols.replay_schema_ref = 'authority_operation_replay_envelope_schema'

// Collision remains a pure no-write projection. Its incoming content address is the request byte hash itself.
r28.authority_collision_response_schema = closed('ctrl.g24.authority-collision-response.r28.v1', { response_kind: { const: 'collision' }, operation_name: { type: 'enum', values: operationNames }, target_store: id, existing_registry_identity_fingerprint: fp, existing_request_fingerprint: fp, incoming_request_fingerprint: fp, incoming_request_content_address_sha256: fp, disclosure_code: { const: 'operation_identity_already_used' }, collision_response_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_collision_response', fingerprint_field: 'collision_response_fingerprint' })
r28.fingerprint_schemas.authority_collision_response = fingerprint('CTRL-G24-AUTHORITY-COLLISION-RESPONSE-R28', r28.authority_collision_response_schema.exact_keys.filter(key => key !== 'collision_response_fingerprint'))
r28.authority_collision_projection = { schema_version: 'ctrl.g24.authority-collision-projection.r28.v1', response_schema_ref: 'authority_collision_response_schema', derivation: 'pure_function_of_existing_immutable_registry_row_identity_and_incoming_canonical_request_identity', incoming_content_address_derivation: 'incoming_request_content_address_sha256_equals_sha256_of_exact_canonical_incoming_request_bytes', repeat_determinism: 'same_existing_row_and_incoming_canonical_request_bytes_produce_byte_identical_response_and_fingerprint', registry_insert_update_or_overwrite: 'forbidden', artifact_store_write: 'none', hold_or_receipt_write: 'none', nonce_write: 'none', effect: 'none', disclosure: 'only_disclosure_code_and_nonsecret_identity_fingerprints', registry_key_satisfiability: 'existing_row_is_found_by_unique_target_store_operation_id_or_unique_target_store_idempotency_key_before_any_insert' }

// Regenerate manifests only from active schemas. Deleted replay and collision variants cannot remain as artifact refs.
const requestRefs = operationNames.map(name => `case_session_authority_operation_protocols.operations.${name}.request_schema`)
const targetRefs = operationNames.map(name => `case_session_authority_operation_protocols.operations.${name}.target_intent_schema`)
const resultRefs = operationNames.flatMap(name => r28.case_session_authority_operation_protocols.operations[name].result_schema.exact_variants.map(variant => `case_session_authority_operation_protocols.operations.${name}.result_schema.variants.${variant}`))
const proofRefs = ['case_session_root_bootstrap_proof_schema', 'case_session_root_admin_capability_proof_schema', 'case_session_issuer_capability_proof_schema', 'case_session_evaluator_capability_proof_schema']
const replayRefs = ['authority_operation_replay_payload_schema', 'authority_operation_replay_envelope_schema']
r28.fingerprint_schemas.authority_artifact_r28 = fingerprint('CTRL-G24-AUTHORITY-ARTIFACT-R28', ['artifact_ref', 'artifact_family', 'canonical_schema_ref', 'canonical_bytes_b64url', 'canonical_bytes_length', 'canonical_bytes_sha256', 'parsed_content_fingerprint', 'stored_at', 'writer_role'])
r28.authority_operation_artifact_stores = { schema_version: 'ctrl.g24.authority-operation-artifact-stores.r28.v1', manifest_derivation: 'generated_only_from_active_request_target_result_proof_and_unified_replay_schema_refs_then_every_ref_recursively_resolved', stale_or_unresolved_ref_action: 'materialization_failure', families: { requests: family('requests', requestRefs, 65536), targets: family('targets', targetRefs, 131072), proofs: family('proofs', proofRefs, 32768), results: family('results', resultRefs, 131072), replay_responses: family('replay_responses', replayRefs, 131072) } }

r28.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r28.v1', derivation: 'bounded_exact_extension_from_frozen_R27_to_R28_request_receipt_hold_manifest_replay_and_collision_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.case_session_authority_operation_protocols', '$.session_dual_proof_bundle_artifact_store', '$.session_dual_proof_receipt_evidence_store', '$.authority_operation_receipt_store', '$.proof_nonce_ledger', '$.authority_operation_hold_store', '$.authority_operation_registry', '$.authority_operation_replay_payload_schema', '$.authority_operation_replay_envelope_schema', '$.authority_operation_replay_derivation', '$.authority_collision_response_schema', '$.authority_collision_projection', '$.authority_operation_artifact_stores'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r28_identifier: true }
r28.required_negative_fixture_families = [...new Set([...r28.required_negative_fixture_families, 'session_request_fingerprint_stale_fields_or_key_mismatch', 'dual_bundle_artifact_substitution_or_receipt_splicing', 'session_receipt_singular_proof_or_not_two_nonce_receipts', 'composite_session_nonce_family', 'session_hold_collapsed_raw_proof_slots', 'stale_or_unresolved_result_and_replay_manifest_refs', 'replay_dependency_cycle_or_cross_row_splicing', 'collision_nondeterministic_incoming_request_ref'])]
r28.visible_surface_changes = []
r28.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r28)
export const materializedR28 = r28
export const materializedR28Output = `${JSON.stringify(r28, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR28Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR28Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R28 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
