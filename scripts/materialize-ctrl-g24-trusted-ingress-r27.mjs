import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR26 } from './materialize-ctrl-g24-trusted-ingress-r26.mjs'

const root = process.cwd(), inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r26.json', outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r27.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8'), r27 = structuredClone(materializedR26)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r27.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }

r27.schema_version = 'ctrl.g24.trusted-ingress.r27.effective.v1'; r27.status = 'twenty_sixth_repair_candidate_under_independent_review'
r27.supersedes = { commit: '4f63710f16ea75b2b9240a1ae523f381e1c138ed', tree: 'd8f35462560107b829a5a4f6d718387577a0eb3b', human_blob: 'f3b4770a8e833d4cb4a9466c841aadcd95e00cdc', machine_blob: '28fdbb8082829f922679ac7ade9d5f196277e563', qa_blob: 'c11dc9c6a5aa46b3d81bd8be2b8af0faf4dd5e89', checker_blob: 'c16da74d2769b3580b04f1de97d4bbd5bc93c261', materializer_blob: '2981b59e857df9ace7c615d2997e190148eb0bbc', founder_checker_blob: 'de76e17631717394a2c9298eaea0dac9472392ea', adjudication: 'veto' }
r27.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r27.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

// Collision is a pure no-write response derived from a pre-existing registry row and incoming request identity.
const operationNames = Object.keys(r27.case_session_authority_operation_protocols.operations)
r27.authority_collision_response_schema = closed('ctrl.g24.authority-collision-response.r27.v1', {
  response_kind: { const: 'collision' }, operation_name: { type: 'enum', values: operationNames }, target_store: id,
  existing_registry_identity_fingerprint: fp, existing_request_fingerprint: fp, incoming_request_fingerprint: fp,
  incoming_request_bytes_ref: id, incoming_request_bytes_sha256: fp, disclosure_code: { const: 'operation_identity_already_used' }, collision_response_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.authority_collision_response', fingerprint_field: 'collision_response_fingerprint' })
r27.fingerprint_schemas.authority_collision_response = fingerprint('CTRL-G24-AUTHORITY-COLLISION-RESPONSE-R27', Object.keys(r27.authority_collision_response_schema.properties).filter(key => key !== 'collision_response_fingerprint'))
r27.authority_collision_projection = { schema_version: 'ctrl.g24.authority-collision-projection.r27.v1', response_schema_ref: 'authority_collision_response_schema', derivation: 'pure_function_of_existing_immutable_registry_row_identity_and_incoming_canonical_request_identity', repeat_determinism: 'same_existing_row_and_incoming_request_bytes_produce_identical_response_bytes_and_fingerprint', registry_insert_update_or_overwrite: 'forbidden', hold_or_receipt_write: 'none', effect: 'none', disclosure: 'only_disclosure_code_and_nonsecret_identity_fingerprints', registry_key_satisfiability: 'existing_row_is_found_by_unique_target_store_operation_id_or_unique_target_store_idempotency_key_before_any_insert; conflicting_incoming_identity_cannot_satisfy_a_fresh_insert' }
const held = r27.authority_operation_registry.row_union.variants.original_persisted_hold
held.properties.hold_branch.values = held.properties.hold_branch.values.filter(value => value !== 'collision_hold')
r27.authority_operation_registry.changed_request_or_identity = 'return_authority_collision_projection_without_registry_hold_receipt_nonce_target_or_effect_write'
r27.authority_operation_registry.collision_is_durable_original_or_replay_source = false
r27.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r27.v1'
r27.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r27.v1'
r27.authority_operation_registry.row_union.variants.original_committed.schema_version = 'ctrl.g24.authority-operation-registry-committed-row.r27.v1'
held.schema_version = 'ctrl.g24.authority-operation-registry-held-row.r27.v1'
r27.fingerprint_schemas.authority_operation_registry_committed = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R27', Object.keys(r27.authority_operation_registry.row_union.variants.original_committed.properties).filter(key => key !== 'registry_fingerprint'))
r27.fingerprint_schemas.authority_operation_registry_held = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R27', Object.keys(held.properties).filter(key => key !== 'registry_fingerprint'))
r27.authority_operation_hold_store.row_schema.properties.hold_branch.values = r27.authority_operation_hold_store.row_schema.properties.hold_branch.values.filter(value => value !== 'collision_hold')
r27.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r27.v1'; r27.authority_operation_hold_store.row_schema.schema_version = 'ctrl.g24.authority-operation-persisted-hold-row.r27.v1'
r27.fingerprint_schemas.authority_operation_hold = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-R27', Object.keys(r27.authority_operation_hold_store.row_schema.properties).filter(key => key !== 'hold_fingerprint'))

// One closed dual-proof bundle for every session authority operation.
r27.session_dual_proof_bundle_schema = closed('ctrl.g24.session-dual-proof-bundle.r27.v1', {
  bundle_ref: id, operation_name: { type: 'enum', values: ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal'] },
  workspace_ref: id, target_partition_fingerprint: fp, audience: { const: 'ctrl_case_session_authority_operation' },
  issuer_proof_ref: id, issuer_proof_bytes_sha256: fp, issuer_proof_fingerprint: fp, issuer_nonce: fp, issuer_nonce_subject_fingerprint: fp, issuer_verifier_identity_fingerprint: fp,
  evaluator_proof_ref: id, evaluator_proof_bytes_sha256: fp, evaluator_proof_fingerprint: fp, evaluator_nonce: fp, evaluator_nonce_subject_fingerprint: fp, evaluator_verifier_identity_fingerprint: fp,
  bundle_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.session_dual_proof_bundle', fingerprint_field: 'bundle_fingerprint', exact_equalities: ['issuer_subproof_parses_exact_case_session_issuer_capability_proof_schema', 'evaluator_subproof_parses_exact_case_session_evaluator_capability_proof_schema', 'issuer_and_evaluator_roles_are_distinct', 'both_subproofs_equal_bundle_workspace_partition_operation_and_audience', 'both_subproofs_are_time_valid_at_same_snapshot', 'issuer_and_evaluator_nonces_are_independent_and_may_differ'] })
r27.fingerprint_schemas.session_dual_proof_bundle = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-BUNDLE-R27', Object.keys(r27.session_dual_proof_bundle_schema.properties).filter(key => key !== 'bundle_fingerprint'))
r27.session_dual_proof_receipt_evidence_schema = closed('ctrl.g24.session-dual-proof-receipt-evidence.r27.v1', {
  operation_id: id, bundle_ref: id, bundle_bytes_sha256: fp, bundle_fingerprint: fp,
  issuer_proof_ref: id, issuer_proof_bytes_sha256: fp, issuer_proof_fingerprint: fp, issuer_nonce_receipt_fingerprint: fp,
  evaluator_proof_ref: id, evaluator_proof_bytes_sha256: fp, evaluator_proof_fingerprint: fp, evaluator_nonce_receipt_fingerprint: fp,
  evidence_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.session_dual_proof_receipt_evidence', fingerprint_field: 'evidence_fingerprint' })
r27.fingerprint_schemas.session_dual_proof_receipt_evidence = fingerprint('CTRL-G24-SESSION-DUAL-PROOF-RECEIPT-EVIDENCE-R27', Object.keys(r27.session_dual_proof_receipt_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
for (const name of ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']) {
  const protocol = r27.case_session_authority_operation_protocols.operations[name]
  protocol.schema_version = protocol.schema_version.replace('.r26.', '.r27.')
  for (const key of ['issuer_proof_schema_ref', 'issuer_proof_bytes_ref', 'issuer_proof_bytes_sha256', 'evaluator_proof_schema_ref', 'evaluator_proof_bytes_ref', 'evaluator_proof_bytes_sha256']) remove(protocol.request_schema, key)
  add(protocol.request_schema, 'dual_proof_bundle_schema_ref', { const: 'session_dual_proof_bundle_schema' }); add(protocol.request_schema, 'dual_proof_bundle_bytes_ref', id); add(protocol.request_schema, 'dual_proof_bundle_bytes_sha256', fp); add(protocol.request_schema, 'dual_proof_bundle_fingerprint', fp)
  protocol.dual_authority_bundle_schema_ref = 'session_dual_proof_bundle_schema'
  protocol.nonce_consumption = 'exactly_two_rows_atomically_one_issuer_family_subject_and_one_evaluator_family_subject_after_both_proofs_verify'
  protocol.receipt_evidence_schema_ref = 'session_dual_proof_receipt_evidence_schema'
}
for (const [key, value] of Object.entries({ dual_proof_bundle_ref: id, dual_proof_bundle_bytes_sha256: fp, dual_proof_bundle_fingerprint: fp, issuer_proof_ref: id, issuer_proof_bytes_sha256: fp, issuer_proof_fingerprint: fp, issuer_nonce_receipt_fingerprint: fp, evaluator_proof_ref: id, evaluator_proof_bytes_sha256: fp, evaluator_proof_fingerprint: fp, evaluator_nonce_receipt_fingerprint: fp })) add(r27.case_session_authority_read_set_schema, key, value)
r27.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.case-session-authority-read-set.r27.v1'
r27.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R27', Object.keys(r27.case_session_authority_read_set_schema.properties).filter(key => key !== 'snapshot_fingerprint'))
r27.authority_operation_receipt_store.session_operation_extension_schema_ref = 'session_dual_proof_receipt_evidence_schema'
r27.authority_operation_receipt_store.session_operation_exact_equalities = ['receipt_evidence_bundle_and_subproof_triples_equal_request_bundle_and_authority_read_set', 'issuer_and_evaluator_nonce_receipt_fingerprints_resolve_exactly_two_nonce_rows_consumed_in_same_transaction']
r27.authority_operation_receipt_store.schema_version = 'ctrl.g24.authority-operation-receipt-store.r27.v1'

// One branch-effect table is the sole nonce authority.
const nonce = r27.proof_nonce_ledger
for (const key of ['fresh_operation_rule', 'committed_replay_exception', 'reused_nonce_on_new_operation', 'consume_order', 'invalid_malformed_unverified_or_internal_preverification', 'exact_replay', 'consumption_branch_table']) delete nonce[key]
nonce.schema_version = 'ctrl.g24.proof-nonce-ledger.r27.v1'; nonce.row_schema.schema_version = 'ctrl.g24.proof-nonce-ledger-row.r27.v1'
nonce.branch_effect_table = [
  { branch: 'committed', cryptographic_validation: 'complete', nonce_rows: 'one_per_verified_proof_or_exactly_two_for_session_dual_bundle', consume: true },
  { branch: 'stale_head_hold', cryptographic_validation: 'complete', target_validation: 'not_required', nonce_rows: 'one_per_verified_proof_or_exactly_two_for_session_dual_bundle', consume: true },
  { branch: 'invalid_target_hold', cryptographic_validation: 'complete', target_validation: 'failed', nonce_rows: 'one_per_verified_proof_or_exactly_two_for_session_dual_bundle', consume: true },
  { branch: 'authorization_hold', cryptographic_validation: 'not_complete', nonce_rows: 0, consume: false },
  { branch: 'invalid_proof_hold', cryptographic_validation: 'failed', nonce_rows: 0, consume: false },
  { branch: 'internal_failure_hold', cryptographic_validation: 'preverification_or_unknown', nonce_rows: 0, consume: false },
  { branch: 'collision', registry_resolution: 'before_proof', nonce_rows: 0, consume: false },
  { branch: 'replayed', registry_resolution: 'before_proof', nonce_rows: 0, consume: false },
  { branch: 'replayed_held', registry_resolution: 'before_proof', nonce_rows: 0, consume: false },
]
nonce.branch_effect_table_is_sole_authority = true
nonce.dual_bundle_atomicity = 'session_verified_consuming_branch_inserts_exactly_two_distinct_nonce_rows_or_neither'
r27.fingerprint_schemas.proof_nonce_receipt = fingerprint('CTRL-G24-PROOF-NONCE-RECEIPT-R27', Object.keys(nonce.row_schema.properties).filter(key => key !== 'nonce_receipt_fingerprint'))

// Malformed bytes are bounded opaque evidence, not falsely parsed artifacts.
const rawRow = (family, max) => closed(`ctrl.g24.opaque-raw-${family.replaceAll('_', '-')}-row.r27.v1`, { artifact_ref: id, artifact_family: { const: family }, opaque_bytes_b64url: b64, opaque_bytes_length: uint, opaque_bytes_sha256: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'opaque_bytes_sha256']], max_bytes: max, parse_or_canonical_reencode_required: false, validation: 'strict_base64url_decode_then_verify_max_exact_length_and_sha256_only', fingerprint_ref: 'fingerprint_schemas.opaque_raw_authority_input', fingerprint_field: 'artifact_fingerprint' })
r27.authority_opaque_raw_input_stores = { schema_version: 'ctrl.g24.authority-opaque-raw-input-stores.r27.v1', target: { row_schema: rawRow('malformed_target', 131072) }, proof_primary: { row_schema: rawRow('malformed_proof_primary', 32768) }, proof_issuer: { row_schema: rawRow('malformed_proof_issuer', 32768) }, proof_evaluator: { row_schema: rawRow('malformed_proof_evaluator', 32768) }, sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_persisted_hold_or_audit_reference_exists', restart_failure: 'hold_without_disclosure_or_write' }
r27.fingerprint_schemas.opaque_raw_authority_input = fingerprint('CTRL-G24-OPAQUE-RAW-AUTHORITY-INPUT-R27', ['artifact_ref', 'artifact_family', 'opaque_bytes_b64url', 'opaque_bytes_length', 'opaque_bytes_sha256', 'stored_at', 'writer_role'])
r27.authority_operation_hold_store.row_schema.branch_artifact_rules = ['invalid_target_hold_requires_authority_opaque_raw_input_stores.target_ref_and_sha256_when_target_cannot_parse', 'invalid_proof_hold_or_authorization_hold_requires_primary_raw_proof_or_for_session_both_proof_issuer_and_proof_evaluator_raw_refs_and_sha256_when_bundle_or_subproofs_cannot_parse', 'raw_opaque_artifacts_are_bounded_content_addressed_bytes_and_make_no_parse_or_semantic_claim', 'every_hold_forbids_receipt_and_committed_target_authority']

// One operation-discriminated replay schema replaces every competing replay variant.
delete r27.authority_operation_replay_projections
r27.authority_operation_replay_schema = closed('ctrl.g24.authority-operation-replay.r27.v1', {
  replay_kind: { type: 'enum', values: ['replayed', 'replayed_held'] }, operation_name: { type: 'enum', values: operationNames }, operation_id: id,
  original_durable_state: { type: 'enum', values: ['original_committed', 'original_persisted_hold'] }, original_registry_or_hold_ref: id,
  original_registry_or_hold_fingerprint: fp, historical_result_ref: id, historical_result_fingerprint: fp,
  replay_response_ref: id, replay_response_bytes_sha256: fp, replay_response_fingerprint: fp, replay_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.authority_operation_replay', fingerprint_field: 'replay_fingerprint', conditional_rules: ['replayed_requires_original_committed_and_receipt_is_resolved_from_historical_result_not_added_to_this_schema', 'replayed_held_requires_original_persisted_hold', 'canonical_response_is_deterministic_and_contains_no_timestamp'] })
r27.fingerprint_schemas.authority_operation_replay = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-R27', Object.keys(r27.authority_operation_replay_schema.properties).filter(key => key !== 'replay_fingerprint'))
r27.authority_operation_registry.exact_committed_replay = 'project_authority_operation_replay_schema_replayed_without_write'
r27.authority_operation_registry.exact_held_replay = 'project_authority_operation_replay_schema_replayed_held_without_write'
for (const [name, protocol] of Object.entries(r27.case_session_authority_operation_protocols.operations)) {
  protocol.schema_version = protocol.schema_version.replace('.r26.', '.r27.')
  delete protocol.result_schema.variants.replayed; delete protocol.result_schema.variants.replayed_held
  protocol.result_schema.exact_variants = protocol.result_schema.exact_variants.filter(value => !['replayed', 'replayed_held', 'collision_hold'].includes(value))
  delete protocol.result_schema.variants.collision_hold
  protocol.result_schema.schema_version = protocol.result_schema.schema_version.replace('.r26.', '.r27.')
  protocol.replay_schema_ref = 'authority_operation_replay_schema'
  protocol.collision_response_schema_ref = 'authority_collision_response_schema'
}
r27.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r27.v1'
r27.case_session_authority_operation_protocols.result_branches = ['committed', 'authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
r27.case_session_authority_operation_protocols.replay_schema_ref = 'authority_operation_replay_schema'
r27.case_session_authority_operation_protocols.collision_schema_ref = 'authority_collision_response_schema'
delete r27.case_session_authority_operation_protocols.replay_projection_ref

r27.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r27.v1', derivation: 'bounded_exact_extension_from_frozen_R26_to_R27_no_write_collision_dual_proof_bundle_single_nonce_branch_table_opaque_raw_inputs_and_one_replay_schema', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authority_collision_response_schema', '$.authority_collision_projection', '$.authority_operation_registry', '$.session_dual_proof_bundle_schema', '$.session_dual_proof_receipt_evidence_schema', '$.proof_nonce_ledger', '$.authority_opaque_raw_input_stores', '$.authority_operation_replay_schema', '$.case_session_authority_operation_protocols', '$.case_session_authority_read_set_schema'], every_changed_or_new_semantic_object_has_r27_identifier: true, same_version_semantic_change: 'forbidden' }
r27.required_negative_fixture_families = [...new Set([...r27.required_negative_fixture_families, 'collision_registry_insert_overwrite_or_nondeterminism', 'dual_proof_missing_role_or_invented_aggregate', 'dual_bundle_one_nonce_or_nonce_equality_assumption', 'nonce_clause_mismatch_or_invalid_proof_consumption', 'malformed_raw_target_or_dual_proof_storage_missing', 'competing_or_underbound_replay_schema'])]
r27.visible_surface_changes = []; r27.external_actions_authorized = []
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r27)
export const materializedR27 = r27; export const materializedR27Output = `${JSON.stringify(r27, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR27Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR27Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R27 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
