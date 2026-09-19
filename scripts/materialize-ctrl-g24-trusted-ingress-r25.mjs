import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR24 } from './materialize-ctrl-g24-trusted-ingress-r24.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r24.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r25.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r25 = structuredClone(materializedR24)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }, uint = { type: 'safe_nonnegative_integer' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('_', '-').replaceAll('ctrl-g24-', '')}.r25.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function signedPreimage(version, domain, fields) { return { schema_version: version, domain_ascii: domain, canonical_encoding_ref: 'canonical_field_encoding', field_order: ['domain_ascii', ...fields], signature_fields_excluded: true, digest: 'sha256_of_exact_preimage' } }

r25.schema_version = 'ctrl.g24.trusted-ingress.r25.effective.v1'
r25.status = 'twenty_fourth_repair_candidate_under_independent_review'
r25.supersedes = { commit: 'bcb77069cf1506ba0ad1d3a34de58567e219d5c8', tree: '0f90a1d2fb970081707b55210dff3292cfb79aff', human_blob: '5630f6316f9700b42e1104c57c0bdf4ce9b272c6', machine_blob: 'b6354df68f14a8b8b3fa050eb9f033b07089a8b7', qa_blob: '2ca9dd5cef16dabd82aae7eb11abddfd7640f02b', checker_blob: '74f2a1d28418e31488b8c65e7e75312d7521120a', materializer_blob: '130c937638f19e43a43ec2dd3b52b0a487d73f22', founder_checker_blob: '912d0447c41f1e975799f0dec686ceb6f2a6eb49', adjudication: 'veto' }
r25.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r25.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const stores = ['case_session_root_trust_anchors', 'case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const standingField = store => store === 'case_server_session_principal_evidence' ? 'session_standing' : 'standing'

// Server-owned partition order makes backdated and non-tip rows unrepresentable.
for (const store of stores) {
  const row = r25.authoritative_row_schemas[store]
  row.schema_version = row.schema_version.replace('.r24.', '.r25.')
  add(row, 'authority_order', uint)
  row.server_owned_fields = ['valid_from', 'row_version_ref', 'authority_order']
  row.caller_or_target_intent_may_supply_server_owned_fields = false
  row.current_selection_order = ['authority_order_ASC']
  row.current_selection = 'select_unique_maximum_authority_order_across_all_rows_in_exact_partition_then_authorize_only_if_selected_tip_standing_active_and_time_valid'
  row.same_transaction_snapshot_and_cas = 'lock_exact_partition_head_then_compare_expected_head_ref_order_and_fingerprint_in_one_serializable_transaction; derive_committed_at_valid_from_next_order_and_row_version; append_target_advance_head_and_commit_result_receipt_atomically'
  const fingerprintName = row.fingerprint_ref.split('.').at(-1)
  r25.fingerprint_schemas[fingerprintName] = fingerprint(`CTRL-G24-${fingerprintName.replaceAll('_', '-').toUpperCase()}-R25`, Object.keys(row.properties).filter(key => key !== row.fingerprint_field))
}
r25.authority_partition_head_store = {
  schema_version: 'ctrl.g24.authority-partition-head-store.r25.v1',
  row_schema: closed('ctrl.g24.authority-partition-head-row.r25.v1', {
    target_store: { type: 'enum', values: stores }, partition_fingerprint: fp, head_order: uint,
    head_row_version_ref: id, head_row_fingerprint: fp, advanced_at: ts, head_fingerprint: fp,
  }, { append_only: false, unique_keys: [['target_store', 'partition_fingerprint']], fingerprint_ref: 'fingerprint_schemas.authority_partition_head', fingerprint_field: 'head_fingerprint' }),
  sole_writer: 'ctrl_case_session_authority_operation_executor', direct_dml: 'forbidden',
  first_head: 'absent_partition_has_expected_head_order_0_and_null_prior_identity',
  next_order: 'checked_safe_integer_increment_of_selected_head_order_exactly_once',
  row_version_derivation: 'domain_CTRL_G24_AUTHORITY_ROW_VERSION_R25_sha256_of_target_store_partition_fingerprint_next_order_and_committed_at_encoded_as_identifier',
  precommit: 'request_expected_head_ref_order_and_fingerprint_must_equal_locked_head_or_stale_head_hold',
  atomic_commit: 'derive_committed_at_as_database_transaction_timestamp; inject_valid_from_equals_committed_at_row_version_ref_and_authority_order; append_unique_tip; advance_head; persist_registry_result_and_receipt_atomically_or_nothing',
  backdated_non_tip_tie_or_collision: 'impossible_to_commit_and_returns_persisted_hold',
}
r25.fingerprint_schemas.authority_partition_head = fingerprint('CTRL-G24-AUTHORITY-PARTITION-HEAD-R25', ['target_store', 'partition_fingerprint', 'head_order', 'head_row_version_ref', 'head_row_fingerprint', 'advanced_at'])

// Exact proof families, signatures and nonce consumption.
add(r25.deployment_trust_configuration_schema, 'pinned_root_admin_verifier_ref', id)
add(r25.deployment_trust_configuration_schema, 'pinned_root_admin_verifier_version_ref', id)
add(r25.deployment_trust_configuration_schema, 'pinned_root_admin_verifier_artifact_sha256', fp)
add(r25.deployment_trust_configuration_schema, 'pinned_root_bootstrap_signer_1_ref', id)
add(r25.deployment_trust_configuration_schema, 'pinned_root_bootstrap_signer_1_artifact_sha256', fp)
add(r25.deployment_trust_configuration_schema, 'pinned_root_bootstrap_signer_2_ref', id)
add(r25.deployment_trust_configuration_schema, 'pinned_root_bootstrap_signer_2_artifact_sha256', fp)
r25.deployment_trust_configuration_schema.schema_version = 'ctrl.g24.deployment-trust-configuration.r25.v1'

r25.case_session_root_bootstrap_proof_schema = closed('ctrl.g24.proof.root-bootstrap.r25.v1', {
  proof_ref: id, proof_kind: { const: 'root_bootstrap' }, root_partition: { const: 'case_session_root' }, target_partition_fingerprint: fp,
  target_intent_sha256: fp, deployment_configuration_ref: id, deployment_configuration_sha256: fp,
  audience: { const: 'ctrl_case_session_root_bootstrap' }, scope: { const: 'bootstrap_one_pinned_root_singleton' }, nonce: fp,
  issued_at: ts, expires_at: ts, signature_algorithm: { const: 'ed25519' }, signer_1_ref: id, signer_1_artifact_sha256: fp,
  signer_1_signature_b64url: b64, signer_2_ref: id, signer_2_artifact_sha256: fp, signer_2_signature_b64url: b64, proof_fingerprint: fp,
}, { caller_controlled_fields: [], fingerprint_ref: 'fingerprint_schemas.root_bootstrap_proof', fingerprint_field: 'proof_fingerprint', conditional_rules: ['signer_1_ref_must_not_equal_signer_2_ref', 'both_signatures_verify_over_the_same_exact_signed_preimage', 'threshold_is_exactly_2_of_2'] })
r25.case_session_root_admin_capability_proof_schema = closed('ctrl.g24.proof.root-admin-capability.r25.v1', {
  proof_ref: id, proof_kind: { const: 'root_admin_capability' }, root_anchor_row_version_ref: id, root_anchor_fingerprint: fp,
  target_partition_fingerprint: fp, audience: { const: 'ctrl_case_session_authority_admin' }, scope_operation_name: id,
  scope_target_store: { type: 'enum', values: ['case_session_issuer_registry', 'case_session_evaluator_registry'] }, nonce: fp,
  issued_at: ts, expires_at: ts, signature_algorithm: { const: 'ed25519' }, verifier_ref: id, verifier_version_ref: id,
  verifier_artifact_sha256: fp, signature_b64url: b64, proof_fingerprint: fp,
}, { caller_controlled_fields: [], fingerprint_ref: 'fingerprint_schemas.root_admin_capability_proof', fingerprint_field: 'proof_fingerprint' })
for (const [key, role] of [['case_session_issuer_capability_proof_schema', 'issuer'], ['case_session_evaluator_capability_proof_schema', 'evaluator']]) {
  const proof = r25[key]
  proof.schema_version = `ctrl.g24.proof.current-${role}-capability.r25.v1`
  add(proof, 'proof_fingerprint', fp)
  proof.fingerprint_ref = `fingerprint_schemas.${role}_capability_proof`
  proof.fingerprint_field = 'proof_fingerprint'
}
const proofFields = schema => Object.keys(schema.properties).filter(key => !key.includes('signature_b64url') && key !== 'proof_fingerprint')
r25.proof_signed_preimages = {
  schema_version: 'ctrl.g24.proof-signed-preimages.r25.v1',
  root_bootstrap: signedPreimage('ctrl.g24.signed-preimage.root-bootstrap.r25.v1', 'CTRL-G24-ROOT-BOOTSTRAP-PROOF-R25', proofFields(r25.case_session_root_bootstrap_proof_schema)),
  root_admin: signedPreimage('ctrl.g24.signed-preimage.root-admin.r25.v1', 'CTRL-G24-ROOT-ADMIN-CAPABILITY-PROOF-R25', proofFields(r25.case_session_root_admin_capability_proof_schema)),
  issuer: signedPreimage('ctrl.g24.signed-preimage.issuer.r25.v1', 'CTRL-G24-ISSUER-CAPABILITY-PROOF-R25', proofFields(r25.case_session_issuer_capability_proof_schema)),
  evaluator: signedPreimage('ctrl.g24.signed-preimage.evaluator.r25.v1', 'CTRL-G24-EVALUATOR-CAPABILITY-PROOF-R25', proofFields(r25.case_session_evaluator_capability_proof_schema)),
}
r25.fingerprint_schemas.root_bootstrap_proof = fingerprint('CTRL-G24-ROOT-BOOTSTRAP-PROOF-FINGERPRINT-R25', proofFields(r25.case_session_root_bootstrap_proof_schema))
r25.fingerprint_schemas.root_admin_capability_proof = fingerprint('CTRL-G24-ROOT-ADMIN-CAPABILITY-PROOF-FINGERPRINT-R25', proofFields(r25.case_session_root_admin_capability_proof_schema))
r25.fingerprint_schemas.issuer_capability_proof = fingerprint('CTRL-G24-ISSUER-CAPABILITY-PROOF-FINGERPRINT-R25', proofFields(r25.case_session_issuer_capability_proof_schema))
r25.fingerprint_schemas.evaluator_capability_proof = fingerprint('CTRL-G24-EVALUATOR-CAPABILITY-PROOF-FINGERPRINT-R25', proofFields(r25.case_session_evaluator_capability_proof_schema))
r25.target_partition_fingerprint_schema = fingerprint('CTRL-G24-AUTHORITY-TARGET-PARTITION-R25', ['target_store', 'ordered_partition_field_names', 'ordered_partition_field_values'])
r25.proof_nonce_ledger = {
  schema_version: 'ctrl.g24.proof-nonce-ledger.r25.v1',
  row_schema: closed('ctrl.g24.proof-nonce-ledger-row.r25.v1', {
    proof_kind: { type: 'enum', values: ['root_bootstrap', 'root_admin_capability', 'current_issuer_capability', 'current_evaluator_capability'] },
    verifier_ref: id, nonce: fp, proof_fingerprint: fp, target_store: id, operation_id: id, consumed_at: ts, nonce_receipt_fingerprint: fp,
  }, { append_only: true, unique_keys: [['proof_kind', 'verifier_ref', 'nonce']], fingerprint_ref: 'fingerprint_schemas.proof_nonce_receipt', fingerprint_field: 'nonce_receipt_fingerprint' }),
  sole_writer: 'ctrl_case_session_authority_operation_executor', direct_dml: 'forbidden',
  fresh_operation_rule: 'nonce_absence_is_checked_after_registry_freshness_and_consumed_atomically_with_committed_or_persisted_hold_result',
  committed_replay_exception: 'exact_committed_registry_retry_returns_stored_response_and_receipt_before_proof_validation_or_nonce_lookup_and_does_not_consume_again',
  reused_nonce_on_new_operation: 'authorization_hold_without_target_write',
}
r25.fingerprint_schemas.proof_nonce_receipt = fingerprint('CTRL-G24-PROOF-NONCE-RECEIPT-R25', ['proof_kind', 'verifier_ref', 'nonce', 'proof_fingerprint', 'target_store', 'operation_id', 'consumed_at'])
r25.authority_proof_verification = { schema_version: 'ctrl.g24.authority-proof-verification.r25.v1', exact_schema_by_role: { bootstrap: 'case_session_root_bootstrap_proof_schema', root_admin: 'case_session_root_admin_capability_proof_schema', issuer: 'case_session_issuer_capability_proof_schema', evaluator: 'case_session_evaluator_capability_proof_schema' }, signed_preimage_ref_by_role: { bootstrap: 'proof_signed_preimages.root_bootstrap', root_admin: 'proof_signed_preimages.root_admin', issuer: 'proof_signed_preimages.issuer', evaluator: 'proof_signed_preimages.evaluator' }, verifier_source_by_role: { bootstrap: 'deployment_trust_configuration.two_distinct_pinned_root_bootstrap_signers', root_admin: 'deployment_trust_configuration.pinned_root_admin_verifier_ref_version_and_artifact_sha256', issuer: 'selected_current_issuer_row_and_its_pinned_root_join', evaluator: 'selected_current_evaluator_row_and_its_pinned_root_join' }, verify_after_registry_freshness_only: true, exact_checks: ['closed_schema', 'domain_and_field_order', 'canonical_bytes', 'fingerprint', 'pinned_verifier_or_signers', 'algorithm', 'audience', 'operation_and_target_scope', 'canonical_target_partition_fingerprint', 'issued_at_and_expires_at', 'signature_or_two_distinct_2_of_2_signatures', 'nonce_absent_for_fresh_operation'], signature_self_inclusion: 'forbidden', ambiguous_issuer_or_evaluator: 'forbidden', failure: 'persisted_hold_without_authority_disclosure_or_target_write' }

// Rebuild operations around target intent, partition head and total result lifecycle.
const oldProtocols = r25.case_session_authority_operation_protocols.operations
const roles = { bootstrap_case_session_root_anchor: 'bootstrap', issue_case_session_issuer: 'root_admin', revoke_case_session_issuer: 'root_admin', issue_case_session_evaluator: 'root_admin', revoke_case_session_evaluator: 'root_admin', issue_account_actor_binding: 'issuer', rotate_account_actor_binding: 'issuer', offboard_account_actor_binding: 'issuer', issue_account_access_standing: 'issuer', revoke_account_access: 'issuer', offboard_account_access: 'issuer', restore_account_access: 'issuer', issue_server_session_principal: 'evaluator', revoke_server_session_principal: 'evaluator', expire_server_session_principal: 'evaluator' }
const resultBranches = ['committed', 'replayed', 'replayed_held', 'collision_hold', 'authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const proofRef = role => r25.authority_proof_verification.exact_schema_by_role[role]
const artifactSchemaRefs = { requests: [], targets: [], proofs: [], results: [], replay_responses: [] }
for (const [name, protocol] of Object.entries(oldProtocols)) {
  const slug = name.replaceAll('_', '-')
  const targetRow = r25.authoritative_row_schemas[protocol.target_store]
  const excluded = new Set(['valid_from', 'row_version_ref', 'authority_order', targetRow.fingerprint_field])
  const intentProps = Object.fromEntries(Object.entries(targetRow.properties).filter(([key]) => !excluded.has(key)))
  protocol.schema_version = `ctrl.g24.authority-operation-${slug}-protocol.r25.v1`
  protocol.exact_authority_role = roles[name]
  protocol.authority_proof_schema_ref = proofRef(roles[name])
  protocol.target_intent_schema = closed(`ctrl.g24.authority-operation-${slug}-target-intent.r25.v1`, intentProps, { server_owned_fields_forbidden: ['valid_from', 'row_version_ref', 'authority_order', targetRow.fingerprint_field] })
  protocol.request_schema = closed(`ctrl.g24.authority-operation-${slug}-request.r25.v1`, {
    operation_name: { const: name }, operation_id: id, idempotency_key: fp, target_store: { const: protocol.target_store }, target_partition_fingerprint: fp,
    target_intent_schema_ref: { const: `case_session_authority_operation_protocols.operations.${name}.target_intent_schema` }, target_intent_bytes_ref: id, target_intent_bytes_sha256: fp,
    expected_head_row_version_ref: { type: 'nullable', value_schema: id }, expected_head_order: uint, expected_head_row_fingerprint: { type: 'nullable', value_schema: fp }, expected_head_fingerprint: { type: 'nullable', value_schema: fp },
    authority_proof_schema_ref: { const: proofRef(roles[name]) }, authority_proof_bytes_ref: id, authority_proof_bytes_sha256: fp,
  })
  protocol.request_fingerprint = fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-REQUEST-R25`, Object.keys(protocol.request_schema.properties))
  protocol.target_decoder = { schema_ref: `case_session_authority_operation_protocols.operations.${name}.target_intent_schema`, decode_and_reencode_canonical_equality: true, caller_order_fields_forbidden: ['valid_from', 'row_version_ref', 'authority_order', targetRow.fingerprint_field], derive_committed_target_ref: 'authority_partition_head_store.atomic_commit', exact_partition_fields: [...targetRow.partition_key], exact_from_to_standing: protocol.transition, recompute_intent_bytes_sha256: true, recompute_committed_row_fingerprint_after_server_field_injection: true }
  const variants = {}
  variants.committed = closed(`ctrl.g24.authority-operation-${slug}-result-committed.r25.v1`, { operation_name: { const: name }, operation_id: id, branch: { const: 'committed' }, target_store: { const: protocol.target_store }, target_row_version_ref: id, target_row_fingerprint: fp, result_ref: id, receipt_ref: id, receipt_fingerprint: fp, committed_at: ts, result_fingerprint: fp })
  variants.replayed = closed(`ctrl.g24.authority-operation-${slug}-result-replayed.r25.v1`, { operation_name: { const: name }, operation_id: id, branch: { const: 'replayed' }, original_result_ref: id, original_result_fingerprint: fp, replay_response_ref: id, replay_response_fingerprint: fp, receipt_ref: id, receipt_fingerprint: fp, replayed_at: ts, result_fingerprint: fp })
  variants.replayed_held = closed(`ctrl.g24.authority-operation-${slug}-result-replayed-held.r25.v1`, { operation_name: { const: name }, operation_id: id, branch: { const: 'replayed_held' }, original_hold_ref: id, original_hold_fingerprint: fp, replay_response_ref: id, replay_response_fingerprint: fp, replayed_at: ts, result_fingerprint: fp })
  for (const branch of resultBranches.slice(3)) variants[branch] = closed(`ctrl.g24.authority-operation-${slug}-result-${branch.replaceAll('_', '-')}.r25.v1`, { operation_name: { const: name }, operation_id: id, branch: { const: branch }, hold_ref: id, hold_reason_code: { const: branch }, held_at: ts, hold_fingerprint: fp, result_fingerprint: fp })
  protocol.result_schema = { schema_version: `ctrl.g24.authority-operation-${slug}-result-union.r25.v1`, discriminator: 'branch', exact_variants: resultBranches, variants }
  protocol.result_fingerprint = fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-RESULT-R25`, ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256'])
  protocol.result_branch_non_nullability = 'committed_and_replayed_have_exact_nonnull_receipt_fields; replayed_held_and_hold_branches_have_no_receipt_fields; every_variant_is_closed'
  artifactSchemaRefs.requests.push(`case_session_authority_operation_protocols.operations.${name}.request_schema`)
  artifactSchemaRefs.targets.push(`case_session_authority_operation_protocols.operations.${name}.target_intent_schema`)
  artifactSchemaRefs.proofs.push(proofRef(roles[name]))
  for (const branch of resultBranches) artifactSchemaRefs.results.push(`case_session_authority_operation_protocols.operations.${name}.result_schema.variants.${branch}`)
  artifactSchemaRefs.replay_responses.push(`case_session_authority_operation_protocols.operations.${name}.result_schema.variants.replayed`, `case_session_authority_operation_protocols.operations.${name}.result_schema.variants.replayed_held`)
}
r25.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r25.v1'
r25.case_session_authority_operation_protocols.exact_authority_role_by_operation = roles
r25.case_session_authority_operation_protocols.result_branches = resultBranches
r25.case_session_authority_operation_protocols.registry_before_proof = true
r25.case_session_authority_operation_protocols.admission_order = [
  '1_exact_committed_registry_match_returns_stored_replayed_response_and_receipt_without_proof_or_nonce_revalidation_and_without_effect',
  '2_exact_persisted_hold_match_returns_stored_replayed_held_without_proof_or_nonce_revalidation_and_without_effect',
  '3_existing_operation_or_idempotency_identity_with_different_request_returns_persisted_collision_hold',
  '4_fresh_request_validates_exact_proof_schema_signature_scope_currentness_expiry_and_nonce',
  '5_fresh_request_locks_and_compares_partition_head',
  '6_fresh_request_decodes_target_intent_and_validates_partition_and_transition',
  '7_fresh_valid_request_atomically_consumes_nonce_derives_server_order_appends_tip_advances_head_and_commits_registry_result_receipt',
  '8_any_malformed_authorization_stale_head_invalid_target_invalid_proof_or_internal_failure_selects_first_matching_persisted_hold',
]
r25.case_session_authority_operation_protocols.total_first_match_exclusive = true
r25.case_session_authority_operation_protocols.no_result_falls_through = true

// Registry and held authority use two nonredundant unique identities.
const registry = r25.authority_operation_registry
registry.schema_version = 'ctrl.g24.authority-operation-registry.r25.v1'
registry.row_schema.schema_version = 'ctrl.g24.authority-operation-registry-row.r25.v1'
registry.row_schema.properties.result_branch = { type: 'enum', values: resultBranches }
registry.row_schema.unique_keys = [['target_store', 'operation_id'], ['target_store', 'idempotency_key']]
registry.operation_identity_scope = ['target_store', 'operation_id']
registry.idempotency_unique_scope = ['target_store', 'idempotency_key']
registry.restart_lookup = ['target_store', 'operation_id']
registry.idempotency_collision_lookup = ['target_store', 'idempotency_key']
registry.lookup_before_proof_or_nonce = true
registry.exact_committed_replay = 'return_stored_replayed_response_and_receipt_without_proof_currentness_nonce_or_effect_evaluation'
registry.exact_held_replay = 'return_stored_replayed_held_response_without_proof_currentness_nonce_or_effect_evaluation'
registry.changed_request_or_reused_idempotency = 'persist_collision_hold_without_target_write'
registry.row_schema.conditional_rules = ['committed_requires_nonnull_receipt_ref_and_receipt_fingerprint', 'every_hold_branch_requires_null_receipt_ref_and_receipt_fingerprint', 'same_operation_identity_and_exact_request_fingerprint_replays_committed_or_held_authority', 'same_operation_identity_with_changed_request_or_same_idempotency_under_new_operation_id_collides']
r25.fingerprint_schemas.authority_operation_registry = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-R25', Object.keys(registry.row_schema.properties).filter(key => key !== 'registry_fingerprint'))
r25.authority_operation_hold_store = { schema_version: 'ctrl.g24.authority-operation-hold-store.r25.v1', row_schema: closed('ctrl.g24.authority-operation-hold-row.r25.v1', { hold_ref: id, target_store: id, operation_id: id, idempotency_key: fp, request_fingerprint: fp, hold_branch: { type: 'enum', values: resultBranches.slice(3) }, hold_reason_code: id, result_ref: id, result_fingerprint: fp, held_at: ts, hold_fingerprint: fp }, { append_only: true, unique_keys: [['target_store', 'operation_id', 'request_fingerprint'], ['target_store', 'idempotency_key', 'request_fingerprint']], fingerprint_ref: 'fingerprint_schemas.authority_operation_hold', fingerprint_field: 'hold_fingerprint' }), all_hold_branches_persist: true, retry: 'exact_request_returns_replayed_held; changed_request_returns_collision_hold', receipt_fields: 'forbidden', target_write: 'forbidden', restart: 'resolve_exact_hold_result_blob_and_recompute_result_and_hold_fingerprints_or_hold_without_disclosure' }
r25.fingerprint_schemas.authority_operation_hold = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HOLD-R25', Object.keys(r25.authority_operation_hold_store.row_schema.properties).filter(key => key !== 'hold_fingerprint'))
const receipt = r25.authority_operation_receipt_store
receipt.schema_version = 'ctrl.g24.authority-operation-receipt-store.r25.v1'
receipt.row_schema.schema_version = 'ctrl.g24.authority-operation-receipt-row.r25.v1'
add(receipt.row_schema, 'partition_head_prior_fingerprint', { type: 'nullable', value_schema: fp })
add(receipt.row_schema, 'partition_head_new_fingerprint', fp)
add(receipt.row_schema, 'authority_order', uint)
receipt.exact_equalities.push('receipt.server_committed_at_equals_target.valid_from_and_partition_head.advanced_at')
receipt.exact_equalities.push('receipt.authority_order_equals_target.authority_order_equals_new_partition_head.head_order_equals_prior_head_order_plus_one')
receipt.exact_equalities.push('registry_lookup_and_exact_replay_or_collision_resolution_precedes_any_proof_or_nonce_check')
r25.fingerprint_schemas.authority_operation_receipt = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-R25', Object.keys(receipt.row_schema.properties).filter(key => key !== 'receipt_fingerprint'))

// Immutable content-addressed stores bind every authority artifact to its exact schema.
const maxBytes = { requests: 65536, targets: 131072, proofs: 32768, results: 65536, replay_responses: 65536 }
function artifactRow(family, schemaRef) {
  const schemaIdentity = createHash('sha256').update(schemaRef).digest('hex').slice(0, 12)
  return closed(`ctrl.g24.authority-artifact-${family.replaceAll('_', '-')}-${schemaIdentity}-row.r25.v1`, {
    artifact_ref: id, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64,
    canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts,
    writer_role: { const: 'ctrl_case_session_authority_operation_executor' }, artifact_fingerprint: fp,
  }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes[family], canonical_validation: 'decode_base64url_verify_length_and_sha256_parse_exact_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint' })
}
r25.authority_operation_artifact_stores = { schema_version: 'ctrl.g24.authority-operation-artifact-stores.r25.v1', families: {} }
for (const family of Object.keys(artifactSchemaRefs)) {
  const refs = [...new Set(artifactSchemaRefs[family])]
  r25.authority_operation_artifact_stores.families[family] = { schema_version: `ctrl.g24.authority-artifact-family-${family.replaceAll('_', '-')}.r25.v1`, expected_schema_refs: refs, stores_by_schema_ref: Object.fromEntries(refs.map((schemaRef, index) => [`schema_${index + 1}`, { canonical_schema_ref: schemaRef, row_schema: artifactRow(family, schemaRef), sole_writer: 'ctrl_case_session_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_result_or_audit_reference_exists', restart_failure: 'hold_without_response_target_write_or_disclosure' }])) }
}
r25.fingerprint_schemas.authority_artifact = fingerprint('CTRL-G24-AUTHORITY-ARTIFACT-R25', ['artifact_ref', 'artifact_family', 'canonical_schema_ref', 'canonical_bytes_b64url', 'canonical_bytes_length', 'canonical_bytes_sha256', 'parsed_content_fingerprint', 'stored_at', 'writer_role'])
r25.principal_authority_artifact_stores.schema_version = 'ctrl.g24.principal-authority-artifact-stores.r25.v1'
for (const store of Object.values(r25.principal_authority_artifact_stores).filter(value => value?.row_schema)) {
  store.row_schema.schema_version = store.row_schema.schema_version.replace('.r24.', '.r25.')
  store.row_schema.max_canonical_bytes = 65536
  store.row_schema.canonical_validation = 'decode_base64url_verify_length_and_sha256_parse_exact_const_bound_schema_then_reencode_to_identical_canonical_bytes_and_recompute_content_fingerprint'
  store.restart_failure = 'hold_without_response_or_write'
}

// Recursive R25 version closure for dependent case-control receipts and read sets.
r25.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.case-session-authority-read-set.r25.v1'
add(r25.case_session_authority_read_set_schema, 'partition_head_fingerprint', fp)
add(r25.case_session_authority_read_set_schema, 'proof_nonce_receipt_fingerprint', fp)
r25.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R25', Object.keys(r25.case_session_authority_read_set_schema.properties).filter(key => key !== 'snapshot_fingerprint'))
r25.case_authority_control_operation_registry.schema_version = 'ctrl.g24.case-authority-control-operation-registry.r25.v1'
r25.case_authority_control_operation_registry.row_schema.schema_version = 'ctrl.g24.case-authority-control-operation-receipt.r25.v1'
r25.fingerprint_schemas.case_authority_control_receipt = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R25', Object.keys(r25.case_authority_control_operation_registry.row_schema.properties).filter(key => key !== 'receipt_fingerprint'))
r25.case_authority_control_receipt_authority_audit.schema_version = 'ctrl.g24.case-authority-control-receipt-authority-audit.r25.v1'
r25.server_presented_principal_projection_derivation.schema_version = 'ctrl.g24.server-presented-principal-projection-derivation.r25.v1'
r25.case_authority_control_hold_dependency_projection_map.schema_version = 'ctrl.g24.case-authority-control-hold-dependency-projection-map.r25.v1'
r25.append_only_current_selection_protocol.schema_version = 'ctrl.g24.append-only-current-selection-protocol.r25.v1'

r25.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r25.v1', derivation: 'bounded_exact_extension_from_frozen_R24_to_R25_server_owned_partition_order_registry_before_proof_typed_signed_proofs_nonce_consumption_const_bound_artifacts_total_result_lifecycle_and_recursive_version_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authoritative_row_schemas', '$.authority_partition_head_store', '$.deployment_trust_configuration_schema', '$.case_session_root_bootstrap_proof_schema', '$.case_session_root_admin_capability_proof_schema', '$.proof_signed_preimages', '$.proof_nonce_ledger', '$.authority_proof_verification', '$.case_session_authority_operation_protocols', '$.authority_operation_registry', '$.authority_operation_hold_store', '$.authority_operation_receipt_store', '$.authority_operation_artifact_stores', '$.principal_authority_artifact_stores', '$.case_session_authority_read_set_schema', '$.case_authority_control_operation_registry', '$.case_authority_control_receipt_authority_audit', '$.server_presented_principal_projection_derivation', '$.case_authority_control_hold_dependency_projection_map'], every_changed_or_new_semantic_object_has_r25_identifier: true, same_version_semantic_change: 'forbidden' }
r25.required_negative_fixture_families = [...new Set([...r25.required_negative_fixture_families, 'caller_backdated_or_non_tip_authority_row', 'missing_partition_head_or_CAS', 'proof_checked_before_registry_replay', 'reused_nonce_exact_replay_or_new_operation', 'duplicate_idempotency_under_new_operation', 'bootstrap_proof_used_for_root_admin', 'one_or_duplicate_bootstrap_signer', 'signature_self_inclusion_or_unpinned_verifier', 'missing_nonce_ledger', 'authority_artifact_schema_limit_or_canonicality_omission', 'authority_result_fingerprint_or_total_hold_replay_omission', 'stale_recursive_r25_version'])]
r25.visible_surface_changes = []; r25.external_actions_authorized = []
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r25)
export const materializedR25 = r25
export const materializedR25Output = `${JSON.stringify(r25, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR25Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR25Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R25 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
