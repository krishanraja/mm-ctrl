import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR25 } from './materialize-ctrl-g24-trusted-ingress-r25.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r25.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r26.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r26 = structuredClone(materializedR25)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '').replaceAll('_', '-')}.r26.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }

r26.schema_version = 'ctrl.g24.trusted-ingress.r26.effective.v1'
r26.status = 'twenty_fifth_repair_candidate_under_independent_review'
r26.supersedes = { commit: 'd1033ec3feba099a50defa2c4f9b2db53e7f32bc', tree: '5bbc9bda2da993b1f65b58cb51f2df1be4025122', human_blob: 'a451b9c7606c426fff9dddfc31cfe8645e799f7a', machine_blob: 'c3c3fb3ba4047471b253e17ef803a47f39372e7c', qa_blob: '3f5b6355d2706c2446e4acb2e727892caeca9339', checker_blob: '942a0685e66b58aa971f48e4a4b9235e7a2c5a47', materializer_blob: 'f7d17d34eee2b2752e4585b2ba9e33ba95b5744b', founder_checker_blob: '1676fc6252fbd98c9de93c77129eed7f556b767e', adjudication: 'veto' }
r26.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r26.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const stores = ['case_session_root_trust_anchors', 'case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const partitionSchemaRefs = {}
for (const store of stores) {
  const row = r26.authoritative_row_schemas[store]
  row.schema_version = row.schema_version.replace('.r25.', '.r26.')
  const props = Object.fromEntries(row.partition_key.map(key => [key, row.properties[key]]))
  r26[`${store}_partition_schema`] = closed(`ctrl.g24.authority-partition.${store.replaceAll('_', '-')}.r26.v1`, props)
  partitionSchemaRefs[store] = `${store}_partition_schema`
  row.partition_schema_ref = partitionSchemaRefs[store]
  row.unique_keys = [...row.unique_keys.filter(key => !key.includes('authority_order')), [...row.partition_key, 'authority_order']]
  row.current_selection = 'unique_maximum_authority_order_across_every_row_and_standing_in_the_exact_partition'
  row.authorize_selected_tip_only_if = 'selected_tip_standing_active_and_time_valid_at_the_same_serializable_snapshot'
  row.legacy_valid_from_or_row_version_selector = 'forbidden'
  const fpName = row.fingerprint_ref.split('.').at(-1)
  r26.fingerprint_schemas[fpName] = fingerprint(`CTRL-G24-${fpName.replaceAll('_', '-').toUpperCase()}-R26`, Object.keys(row.properties).filter(key => key !== row.fingerprint_field))
}
delete r26.append_only_current_selection_protocol
r26.authority_order_protocol = {
  schema_version: 'ctrl.g24.authority-order-protocol.r26.v1',
  stores: Object.fromEntries(stores.map(store => [store, { partition_schema_ref: partitionSchemaRefs[store], row_schema_ref: `authoritative_row_schemas.${store}`, database_unique_constraint: [...r26.authoritative_row_schemas[store].partition_key, 'authority_order'], selector: 'unique_maximum_authority_order_across_all_standings', authorization: 'only_selected_tip_active_and_time_valid', head_key: ['target_store', 'partition_fingerprint'] }])),
  head_absence_equivalence: 'head_absent_if_and_only_if_zero_rows_exist_in_exact_partition',
  head_presence_equivalence: 'otherwise_head_order_ref_and_row_fingerprint_equal_the_unique_maximum_authority_order_row',
  transaction: 'lock_exact_head_and_partition_range; compare_expected_head_ref_order_row_fingerprint_and_head_fingerprint; server_assign_next_order_and_committed_at_equals_valid_from; append_row_advance_head_and_commit_registry_result_receipt_atomically',
  postcondition: 'new_row_equals_head_equals_unique_selected_tip_and_no_other_row_has_same_partition_and_authority_order',
  failure: 'duplicate_missing_rewound_or_mismatched_head_or_nonunique_maximum_holds_without_target_write_or_authoritative_response',
}
const head = r26.authority_partition_head_store
head.schema_version = 'ctrl.g24.authority-partition-head-store.r26.v1'
head.row_schema.schema_version = 'ctrl.g24.authority-partition-head-row.r26.v1'
head.partition_schema_refs = partitionSchemaRefs
head.head_absence_equivalence = r26.authority_order_protocol.head_absence_equivalence
head.head_presence_equivalence = r26.authority_order_protocol.head_presence_equivalence
head.postcondition = r26.authority_order_protocol.postcondition
head.missing_rewound_duplicate_or_nonmax_head = r26.authority_order_protocol.failure
r26.fingerprint_schemas.authority_partition_head = fingerprint('CTRL-G24-AUTHORITY-PARTITION-HEAD-R26', Object.keys(head.row_schema.properties).filter(key => key !== 'head_fingerprint'))

// Closed durable original outcomes. Replay is a deterministic projection, never a registry state.
const originalHoldBranches = ['collision_hold', 'authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const committedRegistryRow = closed('ctrl.g24.authority-operation-registry-committed-row.r26.v1', {
  durable_state: { const: 'original_committed' }, target_store: { type: 'enum', values: stores }, operation_id: id, idempotency_key: fp,
  request_fingerprint: fp, request_bytes_ref: id, request_bytes_sha256: fp, target_intent_bytes_ref: id, target_intent_bytes_sha256: fp,
  committed_target_row_ref: id, committed_target_row_bytes_sha256: fp, committed_target_row_fingerprint: fp,
  result_branch: { const: 'committed' }, result_ref: id, result_bytes_sha256: fp, result_fingerprint: fp,
  receipt_ref: id, receipt_fingerprint: fp, server_committed_at: ts, registry_fingerprint: fp,
}, { append_only: true, fingerprint_ref: 'fingerprint_schemas.authority_operation_registry_committed', fingerprint_field: 'registry_fingerprint' })
const heldRegistryRow = closed('ctrl.g24.authority-operation-registry-held-row.r26.v1', {
  durable_state: { const: 'original_persisted_hold' }, target_store: { type: 'enum', values: stores }, operation_id: id, idempotency_key: fp,
  request_fingerprint: fp, request_bytes_ref: id, request_bytes_sha256: fp, hold_branch: { type: 'enum', values: originalHoldBranches },
  raw_input_artifact_refs_fingerprint: fp, hold_ref: id, hold_result_ref: id, hold_result_bytes_sha256: fp,
  hold_result_fingerprint: fp, held_at: ts, hold_fingerprint: fp, registry_fingerprint: fp,
}, { append_only: true, fingerprint_ref: 'fingerprint_schemas.authority_operation_registry_held', fingerprint_field: 'registry_fingerprint', forbidden_fields: ['committed_target_row_ref', 'committed_target_row_bytes_sha256', 'committed_target_row_fingerprint', 'receipt_ref', 'receipt_fingerprint'] })
r26.authority_operation_registry = {
  schema_version: 'ctrl.g24.authority-operation-registry.r26.v1',
  row_union: { schema_version: 'ctrl.g24.authority-operation-registry-row-union.r26.v1', discriminator: 'durable_state', exact_variants: ['original_committed', 'original_persisted_hold'], variants: { original_committed: committedRegistryRow, original_persisted_hold: heldRegistryRow } },
  unique_keys_across_union: [['target_store', 'operation_id'], ['target_store', 'idempotency_key']],
  durable_states: ['original_committed', 'original_persisted_hold'], replay_is_durable_state: false,
  sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden',
  lookup_order: ['operation_identity', 'idempotency_identity', 'request_fingerprint'], lookup_before_proof_or_nonce: true,
  exact_committed_replay: 'deterministically_project_replayed_from_original_committed_row_and_immutable_artifacts_without_proof_nonce_effect_or_write',
  exact_held_replay: 'deterministically_project_replayed_held_from_original_persisted_hold_row_and_immutable_artifacts_without_proof_nonce_effect_or_write',
  changed_request_or_identity: 'persist_collision_hold_as_original_persisted_hold_without_target_write',
}
r26.fingerprint_schemas.authority_operation_registry_committed = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R26', Object.keys(committedRegistryRow.properties).filter(key => key !== 'registry_fingerprint'))
r26.fingerprint_schemas.authority_operation_registry_held = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R26', Object.keys(heldRegistryRow.properties).filter(key => key !== 'registry_fingerprint'))
delete r26.fingerprint_schemas.authority_operation_registry

const receiptCommitted = r26.authority_operation_receipt_store.row_schema
receiptCommitted.schema_version = 'ctrl.g24.authority-operation-receipt-committed-row.r26.v1'
receiptCommitted.properties.result_branch = { const: 'committed' }
receiptCommitted.forbidden_hold_fields = ['hold_ref', 'hold_fingerprint', 'raw_input_artifact_refs_fingerprint']
r26.authority_operation_receipt_store.schema_version = 'ctrl.g24.authority-operation-receipt-store.r26.v1'
r26.authority_operation_receipt_store.row_union = { schema_version: 'ctrl.g24.authority-operation-receipt-row-union.r26.v1', discriminator: 'result_branch', exact_variants: ['committed'], variants: { committed: receiptCommitted } }
delete r26.authority_operation_receipt_store.row_schema
r26.authority_operation_receipt_store.sole_writer = 'ctrl_authority_operation_executor'
r26.fingerprint_schemas.authority_operation_receipt = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-R26', Object.keys(receiptCommitted.properties).filter(key => key !== 'receipt_fingerprint'))

r26.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r26.v1'
r26.authority_operation_hold_store.row_schema = closed('ctrl.g24.authority-operation-persisted-hold-row.r26.v1', {
  hold_ref: id, target_store: { type: 'enum', values: stores }, operation_id: id, idempotency_key: fp, request_fingerprint: fp,
  hold_branch: { type: 'enum', values: originalHoldBranches }, request_artifact_ref: id, request_artifact_sha256: fp,
  raw_target_or_input_artifact_ref: { type: 'nullable', value_schema: id }, raw_target_or_input_artifact_sha256: { type: 'nullable', value_schema: fp },
  raw_proof_artifact_ref: { type: 'nullable', value_schema: id }, raw_proof_artifact_sha256: { type: 'nullable', value_schema: fp },
  result_ref: id, result_bytes_sha256: fp, result_fingerprint: fp, held_at: ts, hold_fingerprint: fp,
}, { append_only: true, unique_keys: [['target_store', 'operation_id', 'request_fingerprint'], ['target_store', 'idempotency_key', 'request_fingerprint']], fingerprint_ref: 'fingerprint_schemas.authority_operation_hold', fingerprint_field: 'hold_fingerprint', branch_artifact_rules: ['invalid_target_hold_requires_raw_target_or_input_artifact_ref_and_sha256_but_no_committed_target_authority', 'invalid_proof_hold_or_authorization_hold_requires_raw_proof_artifact_ref_and_sha256_but_no_committed_target_authority', 'preverification_or_internal_failure_may_have_null_raw_target_and_proof_artifacts', 'stale_head_hold_may_reference_validated_target_intent_but_never_a_committed_target_row', 'every_hold_forbids_receipt_ref_receipt_fingerprint_and_committed_target_row_fields'] })
r26.authority_operation_hold_store.replay_projection_ref = 'authority_operation_replay_projections.replayed_held'
r26.fingerprint_schemas.authority_operation_hold = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-R26', Object.keys(r26.authority_operation_hold_store.row_schema.properties).filter(key => key !== 'hold_fingerprint'))
r26.authority_operation_replay_projections = {
  schema_version: 'ctrl.g24.authority-operation-replay-projections.r26.v1',
  replayed: closed('ctrl.g24.authority-operation-result-replayed.r26.v1', { branch: { const: 'replayed' }, operation_id: id, original_result_ref: id, original_result_fingerprint: fp, receipt_ref: id, receipt_fingerprint: fp, replay_response_fingerprint: fp }),
  replayed_held: closed('ctrl.g24.authority-operation-result-replayed-held.r26.v1', { branch: { const: 'replayed_held' }, operation_id: id, original_hold_ref: id, original_hold_fingerprint: fp, original_result_ref: id, original_result_fingerprint: fp, replay_response_fingerprint: fp }),
  dynamic_replayed_at: 'forbidden',
  derivation: 'canonical_bytes_are_a_pure_function_of_the_original_durable_row_and_immutable_artifacts_so_concurrent_exact_retries_are_byte_identical',
  write_or_effect: 'none',
}

// Family-specific nonce subjects prevent signer aliasing and invalid-proof poisoning.
r26.bootstrap_verifier_set_fingerprint = fingerprint('CTRL-G24-BOOTSTRAP-VERIFIER-SET-R26', ['canonical_sorted_signer_1_ref_key_artifact_tuple', 'canonical_sorted_signer_2_ref_key_artifact_tuple'])
r26.bootstrap_verifier_set_fingerprint.distinct_signer_refs = true
r26.bootstrap_verifier_set_fingerprint.distinct_key_or_artifact_fingerprints = true
r26.bootstrap_verifier_set_fingerprint.canonical_sort = 'ascending_unsigned_UTF8_over_complete_signer_tuple_before_encoding'
const nonce = r26.proof_nonce_ledger
nonce.schema_version = 'ctrl.g24.proof-nonce-ledger.r26.v1'
nonce.row_schema = closed('ctrl.g24.proof-nonce-ledger-row.r26.v1', {
  proof_family: { type: 'enum', values: ['root_bootstrap', 'root_admin', 'issuer', 'evaluator', 'issuer_and_evaluator'] },
  nonce_subject_fingerprint: fp, nonce: fp, proof_fingerprint: fp, target_store: id, operation_id: id,
  consumed_on_branch: { type: 'enum', values: ['committed', 'stale_head_hold', 'invalid_target_hold'] }, consumed_at: ts, nonce_receipt_fingerprint: fp,
}, { append_only: true, unique_keys: [['proof_family', 'nonce_subject_fingerprint', 'nonce']], fingerprint_ref: 'fingerprint_schemas.proof_nonce_receipt', fingerprint_field: 'nonce_receipt_fingerprint' })
nonce.nonce_subject_derivation = { root_bootstrap: 'bootstrap_verifier_set_fingerprint', root_admin: 'exact_root_admin_verifier_ref_version_and_artifact_fingerprint', issuer: 'exact_issuer_ref_row_version_and_artifact_fingerprint', evaluator: 'exact_evaluator_ref_row_version_and_artifact_fingerprint', issuer_and_evaluator: 'domain_separated_fingerprint_of_exact_issuer_and_evaluator_nonce_subjects_in_fixed_order' }
nonce.consumption_branch_table = [
  { branch: 'committed', proof_structural_signature_scope_time_verified: true, consume_nonce: true },
  { branch: 'stale_head_hold', proof_structural_signature_scope_time_verified: true, consume_nonce: true },
  { branch: 'invalid_target_hold', proof_structural_signature_scope_time_verified: true, consume_nonce: true },
  { branch: 'authorization_hold', proof_structural_signature_scope_time_verified: false, consume_nonce: false },
  { branch: 'invalid_proof_hold', proof_structural_signature_scope_time_verified: false, consume_nonce: false },
  { branch: 'internal_failure_hold', proof_structural_signature_scope_time_verified: false, consume_nonce: false },
  { branch: 'collision_hold', registry_resolution_precedes_proof: true, consume_nonce: false },
  { branch: 'replayed', registry_resolution_precedes_proof: true, consume_nonce: false },
  { branch: 'replayed_held', registry_resolution_precedes_proof: true, consume_nonce: false },
]
nonce.consume_order = 'only_after_complete_structural_signature_scope_and_time_verification_then_atomically_with_original_committed_or_selected_verified_proof_hold'
nonce.invalid_malformed_unverified_or_internal_preverification = 'never_consume_nonce'
nonce.exact_replay = 'registry_exact_replay_precedes_nonce_lookup_and_never_consumes_nonce'
r26.fingerprint_schemas.proof_nonce_receipt = fingerprint('CTRL-G24-PROOF-NONCE-RECEIPT-R26', Object.keys(nonce.row_schema.properties).filter(key => key !== 'nonce_receipt_fingerprint'))

// Principal artifacts are exact discriminated schema variants with parsed content identity.
const principalStores = r26.principal_authority_artifact_stores
principalStores.schema_version = 'ctrl.g24.principal-authority-artifact-stores.r26.v1'
const principalExpected = { live_principal_assertions: 'live_principal_assertion_schema', presented_principal_projections: 'server_presented_principal_projection_schema' }
for (const [name, expectedSchemaRef] of Object.entries(principalExpected)) {
  const store = principalStores[name]
  const old = store.row_schema
  store.schema_version = `ctrl.g24.principal-authority-artifact-store.${name.replaceAll('_', '-')}.r26.v1`
  store.row_schema = closed(`ctrl.g24.principal-authority-artifact-row.${name.replaceAll('_', '-')}.r26.v1`, {
    artifact_ref: id, artifact_kind: old.properties.artifact_kind, canonical_schema_ref: { const: expectedSchemaRef }, canonical_bytes_b64url: b64,
    canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts,
    writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp,
  }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_kind', 'canonical_schema_ref', 'canonical_bytes_sha256']], max_canonical_bytes: 65536, canonical_validation: 'decode_base64url_verify_max_and_exact_length_and_SHA256_parse_the_const_bound_expected_closed_schema_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', fingerprint_ref: 'fingerprint_schemas.principal_authority_artifact', fingerprint_field: 'artifact_fingerprint' })
  store.sole_writer = 'ctrl_authority_operation_executor'; store.direct_dml = 'forbidden'; store.exact_resolution = 'artifact_ref_schema_ref_and_sha256_resolve_one_immutable_validated_blob'; store.restart_failure = 'hold_without_response_or_write'
}
r26.fingerprint_schemas.principal_authority_artifact = fingerprint('CTRL-G24-PRINCIPAL-AUTHORITY-ARTIFACT-R26', Object.keys(principalStores.live_principal_assertions.row_schema.properties).filter(key => key !== 'artifact_fingerprint'))

// One writer and coherent issuer-plus-evaluator session authority.
r26.case_session_authority_store_controls.schema_version = 'ctrl.g24.case-session-authority-store-controls.r26.v1'
for (const control of Object.values(r26.case_session_authority_store_controls.stores)) control.sole_writer_role = 'ctrl_authority_operation_executor'
r26.case_session_authority_store_controls.single_writer_rule = 'all_authority_rows_heads_registries_receipts_holds_nonces_and_artifacts_are_written_only_by_ctrl_authority_operation_executor_through_closed_operations'
r26.case_session_authority_store_controls.direct_dml = 'forbidden_for_every_other_role'
r26.case_session_root_trust_anchor_authority.schema_version = 'ctrl.g24.case-session-root-trust-anchor-authority.r26.v1'
r26.case_session_root_trust_anchor_authority.sole_writer_role = 'ctrl_authority_operation_executor'
r26.authority_partition_head_store.sole_writer = 'ctrl_authority_operation_executor'
r26.authority_operation_receipt_store.sole_writer = 'ctrl_authority_operation_executor'
r26.authority_operation_hold_store.sole_writer = 'ctrl_authority_operation_executor'
r26.proof_nonce_ledger.sole_writer = 'ctrl_authority_operation_executor'
for (const family of Object.values(r26.authority_operation_artifact_stores.families)) for (const store of Object.values(family.stores_by_schema_ref)) { store.sole_writer = 'ctrl_authority_operation_executor'; store.row_schema.properties.writer_role = { const: 'ctrl_authority_operation_executor' } }
for (const name of ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']) {
  const protocol = r26.case_session_authority_operation_protocols.operations[name]
  protocol.schema_version = protocol.schema_version.replace('.r25.', '.r26.')
  protocol.exact_authority_role = 'issuer_and_evaluator'
  protocol.authority_proof_schema_refs = ['case_session_issuer_capability_proof_schema', 'case_session_evaluator_capability_proof_schema']
  delete protocol.authority_proof_schema_ref
  remove(protocol.request_schema, 'authority_proof_schema_ref'); remove(protocol.request_schema, 'authority_proof_bytes_ref'); remove(protocol.request_schema, 'authority_proof_bytes_sha256')
  add(protocol.request_schema, 'issuer_proof_schema_ref', { const: 'case_session_issuer_capability_proof_schema' }); add(protocol.request_schema, 'issuer_proof_bytes_ref', id); add(protocol.request_schema, 'issuer_proof_bytes_sha256', fp)
  add(protocol.request_schema, 'evaluator_proof_schema_ref', { const: 'case_session_evaluator_capability_proof_schema' }); add(protocol.request_schema, 'evaluator_proof_bytes_ref', id); add(protocol.request_schema, 'evaluator_proof_bytes_sha256', fp)
  protocol.dual_authority_join = 'both_proofs_verify_and_join_the_exact_unique_current_active_time_valid_issuer_and_evaluator_rows_referenced_by_session_evidence_in_the_same_snapshot'
  protocol.request_fingerprint = fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-REQUEST-R26`, Object.keys(protocol.request_schema.properties))
}
for (const [name, protocol] of Object.entries(r26.case_session_authority_operation_protocols.operations)) {
  const slug = name.replaceAll('_', '-')
  protocol.schema_version = `ctrl.g24.authority-operation-${slug}-protocol.r26.v1`
  protocol.request_schema.schema_version = `ctrl.g24.authority-operation-${slug}-request.r26.v1`
  protocol.target_intent_schema.schema_version = `ctrl.g24.authority-operation-${slug}-target-intent.r26.v1`
  protocol.result_schema.schema_version = `ctrl.g24.authority-operation-${slug}-result-union.r26.v1`
  for (const [branch, schema] of Object.entries(protocol.result_schema.variants)) {
    schema.schema_version = `ctrl.g24.authority-operation-${slug}-result-${branch.replaceAll('_', '-')}.r26.v1`
    if (branch === 'replayed' || branch === 'replayed_held') remove(schema, 'replayed_at')
  }
  protocol.result_fingerprint = fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-RESULT-R26`, ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256'])
}
r26.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r26.v1'
r26.case_session_authority_operation_protocols.exact_authority_role_by_operation = { ...r26.case_session_authority_operation_protocols.exact_authority_role_by_operation, issue_server_session_principal: 'issuer_and_evaluator', revoke_server_session_principal: 'issuer_and_evaluator', expire_server_session_principal: 'issuer_and_evaluator' }
r26.case_session_authority_operation_protocols.registry_durable_states = ['original_committed', 'original_persisted_hold']
r26.case_session_authority_operation_protocols.replay_projection_ref = 'authority_operation_replay_projections'
r26.case_session_authority_operation_protocols.dynamic_replay_timestamp = 'forbidden'
r26.authority_operation_artifact_stores.schema_version = 'ctrl.g24.authority-operation-artifact-stores.r26.v1'
for (const [familyName, family] of Object.entries(r26.authority_operation_artifact_stores.families)) {
  family.schema_version = `ctrl.g24.authority-artifact-family-${familyName.replaceAll('_', '-')}.r26.v1`
  for (const store of Object.values(family.stores_by_schema_ref)) store.row_schema.schema_version = store.row_schema.schema_version.replace('.r25.', '.r26.')
}
r26.fingerprint_schemas.authority_artifact = fingerprint('CTRL-G24-AUTHORITY-ARTIFACT-R26', ['artifact_ref', 'artifact_family', 'canonical_schema_ref', 'canonical_bytes_b64url', 'canonical_bytes_length', 'canonical_bytes_sha256', 'parsed_content_fingerprint', 'stored_at', 'writer_role'])

// Recursively version all changed dependants and fingerprint domains.
r26.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.case-session-authority-read-set.r26.v1'
add(r26.case_session_authority_read_set_schema, 'authority_partition_head_order', uint)
r26.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R26', Object.keys(r26.case_session_authority_read_set_schema.properties).filter(key => key !== 'snapshot_fingerprint'))
r26.case_authority_control_operation_registry.schema_version = 'ctrl.g24.case-authority-control-operation-registry.r26.v1'
r26.case_authority_control_operation_registry.row_schema.schema_version = 'ctrl.g24.case-authority-control-operation-receipt.r26.v1'
r26.fingerprint_schemas.case_authority_control_receipt = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R26', Object.keys(r26.case_authority_control_operation_registry.row_schema.properties).filter(key => key !== 'receipt_fingerprint'))
r26.case_authority_control_receipt_authority_audit.schema_version = 'ctrl.g24.case-authority-control-receipt-authority-audit.r26.v1'
r26.server_presented_principal_projection_derivation.schema_version = 'ctrl.g24.server-presented-principal-projection-derivation.r26.v1'
r26.server_presented_principal_projection_derivation.current_selection_protocol_ref = 'authority_order_protocol.stores.case_server_session_principal_evidence'
r26.case_authority_control_hold_dependency_projection_map.schema_version = 'ctrl.g24.case-authority-control-hold-dependency-projection-map.r26.v1'
r26.authority_proof_verification.schema_version = 'ctrl.g24.authority-proof-verification.r26.v1'
r26.authority_proof_verification.verify_after_registry_freshness_only = true

r26.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r26.v1', derivation: 'bounded_exact_extension_from_frozen_R25_to_R26_unified_authority_order_branch_discriminated_original_outcomes_deterministic_replay_family_nonce_subjects_const_bound_principal_artifacts_single_writer_and_dual_session_authority', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authoritative_row_schemas', '$.authority_order_protocol', '$.authority_partition_head_store', '$.authority_operation_registry', '$.authority_operation_receipt_store', '$.authority_operation_hold_store', '$.authority_operation_replay_projections', '$.bootstrap_verifier_set_fingerprint', '$.proof_nonce_ledger', '$.principal_authority_artifact_stores', '$.case_session_authority_store_controls', '$.case_session_authority_operation_protocols', '$.case_session_authority_read_set_schema', '$.case_authority_control_operation_registry', '$.server_presented_principal_projection_derivation'], every_changed_or_new_semantic_object_has_r26_identifier: true, same_version_semantic_change: 'forbidden' }
r26.required_negative_fixture_families = [...new Set([...r26.required_negative_fixture_families, 'stale_selector_or_missing_partition_head_equality', 'invalid_target_with_nonnull_committed_authority', 'replay_as_durable_state_or_dynamic_timestamp', 'bootstrap_signer_or_key_alias', 'nonce_poisoned_by_invalid_proof', 'authority_writer_name_split', 'session_missing_issuer_or_evaluator_proof', 'unrestricted_principal_artifact_schema_ref'])]
r26.visible_surface_changes = []; r26.external_actions_authorized = []
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r26)
export const materializedR26 = r26
export const materializedR26Output = `${JSON.stringify(r26, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR26Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR26Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R26 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
