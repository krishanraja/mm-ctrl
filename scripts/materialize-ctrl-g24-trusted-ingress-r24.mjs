import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR23 } from './materialize-ctrl-g24-trusted-ingress-r23.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r23.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r24.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r24 = structuredClone(materializedR23)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const b64 = { type: 'base64url_without_padding' }
function closed(version, properties, extras = {}) {
  const optional = extras.optional ?? []
  const keys = Object.keys(properties)
  const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }
  if (!optional.length) delete value.optional
  return value
}
function add(schema, key, value) {
  schema.properties[key] = value
  if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key)
  if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key)
}
function fingerprint(domain, fields) {
  return { domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
}
function bump(value) {
  return typeof value === 'string' ? value.replace(/\.r23\./g, '.r24.').replace(/-R23/g, '-R24') : value
}

r24.schema_version = 'ctrl.g24.trusted-ingress.r24.effective.v1'
r24.status = 'twenty_third_repair_candidate_under_independent_review'
r24.supersedes = {
  commit: '6b490c0860edfa83142e28d1a8336abea07b3d2f',
  tree: '35b4189c6126897e8ba0fae0eba59dc135811868',
  human_blob: '53b3f55d9401a0821a9cbd0cc2e10d5b85d990aa',
  machine_blob: '5615db579bbb371e35689b0bc2f0bd3dd1a593f4',
  qa_blob: '521b6c533a847b9b791ccf43f855487ea7912338',
  checker_blob: '0ef6e41dece5b7b7c5c5d3d973a5df9b3d37edb8',
  materializer_blob: '0598e3d23811636ae2a115b591a056a6507cab63',
  founder_checker_blob: 'e76287f451f82e7ae90524d70ee93e274ad0879d',
  adjudication: 'veto',
}
r24.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r24.mjs',
  frozen_input: { path: inputPath, sha256: sha(inputBytes) },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// Select history before standing. No nonactive successor can resurrect an earlier active row.
const authorityStores = [
  'case_session_root_trust_anchors',
  'case_session_issuer_registry',
  'case_session_evaluator_registry',
  'account_stable_actor_bindings',
  'account_access_standings',
  'case_server_session_principal_evidence',
]
const standingFields = {
  case_session_root_trust_anchors: 'standing',
  case_session_issuer_registry: 'standing',
  case_session_evaluator_registry: 'standing',
  account_stable_actor_bindings: 'standing',
  account_access_standings: 'standing',
  case_server_session_principal_evidence: 'session_standing',
}
for (const store of authorityStores) {
  const row = r24.authoritative_row_schemas[store]
  row.schema_version = bump(row.schema_version)
  row.current_selection = 'partition_all_rows_regardless_of_standing_or_time_then_select_unique_maximum_valid_from_then_unsigned_utf8_row_version_ref_then_authorize_only_if_selected_latest_standing_active_and_valid_from_lte_snapshot_time_and_valid_until_absent_or_gt_snapshot_time_else_hold'
  row.current_selection_order = ['valid_from_ASC', 'row_version_ref_unsigned_UTF8_ASC']
  row.selection_partition_exact_fields = [...row.partition_key]
  row.select_before_authorize = true
  row.selected_latest_required_standing = 'active'
  row.selected_latest_time_validity = 'valid_from_lte_snapshot_time_and_valid_until_absent_or_gt_snapshot_time'
  row.tie_duplicate_or_unavailable = 'hold_without_authoritative_response_or_write'
  row.same_transaction_snapshot_and_cas = 'selection_authorization_registry_lookup_and_mutation_use_one_serializable_snapshot; any_changed_selected_row_or_partition_tip_retries_then_holds'
  const fingerprintName = row.fingerprint_ref.split('.').at(-1)
  r24.fingerprint_schemas[fingerprintName].domain_ascii = bump(r24.fingerprint_schemas[fingerprintName].domain_ascii)
}
r24.append_only_current_selection_protocol = {
  schema_version: 'ctrl.g24.append-only-current-selection-protocol.r24.v1',
  stores: Object.fromEntries(authorityStores.map(store => [store, {
    partition_fields: [...r24.authoritative_row_schemas[store].partition_key],
    standing_field: standingFields[store],
    phase_1: 'select_unique_latest_row_across_all_standings_and_all_effective_times_by_valid_from_then_unsigned_utf8_row_version_ref',
    phase_2: 'authorize_only_if_selected_latest_standing_equals_active_and_selected_latest_is_time_valid_at_same_transaction_snapshot',
    tie_duplicate_or_changed_tip: 'hold_without_authoritative_response_or_write',
  }])),
  concrete_transition_tests: [
    'active_then_later_revoked_selects_revoked_and_holds_never_older_active',
    'active_then_later_offboarded_selects_offboarded_and_holds_never_older_active',
    'active_then_later_expired_selects_expired_and_holds_never_older_active',
    'active_then_later_future_active_selects_future_active_and_holds_until_time_valid_never_older_active',
  ],
  same_transaction_cas: 'the_selected_latest_row_fingerprint_and_partition_tip_fingerprint_are_compare_and_swap_inputs_to_every_authority_operation_commit',
}
r24.server_presented_principal_projection_derivation.schema_version = 'ctrl.g24.server-presented-principal-projection-derivation.r24.v1'
r24.server_presented_principal_projection_derivation.current_selection_protocol_ref = 'append_only_current_selection_protocol.stores.case_server_session_principal_evidence'
r24.server_presented_principal_projection_derivation.nonresurrection_rule = 'projection_is_forbidden_when_the_selected_latest_session_or_account_row_is_not_active_or_time_valid'
r24.case_authority_control_hold_dependency_projection_map.schema_version = 'ctrl.g24.case-authority-control-hold-dependency-projection-map.r24.v1'

// Root scope is immutable in R24. Rotation is deliberately closed.
const rootRow = r24.authoritative_row_schemas.case_session_root_trust_anchors
rootRow.schema_version = 'ctrl.g24.authoritative-row.case-session-root-trust-anchors.r24.v1'
rootRow.properties.standing = { const: 'active' }
rootRow.exact_pinned_equalities = [
  'row.root_partition_equals_deployment_config.root_partition_equals_case_session_root',
  'row.trust_anchor_ref_equals_deployment_config.pinned_root_anchor_ref',
  'row.trust_anchor_version_ref_equals_deployment_config.pinned_root_anchor_version_ref',
  'row.trust_anchor_artifact_sha256_equals_deployment_config.pinned_root_anchor_artifact_sha256',
  'row.deployment_configuration_ref_equals_deployment_config.configuration_ref',
  'row.deployment_configuration_sha256_equals_deployment_config.configuration_sha256',
]
rootRow.unique_current_constraint = 'exactly_one_row_for_root_partition_matching_all_pinned_equalities_or_hold'
r24.deployment_trust_configuration_schema.schema_version = 'ctrl.g24.deployment-trust-configuration.r24.v1'
r24.case_session_root_trust_anchor_authority = {
  schema_version: 'ctrl.g24.case-session-root-trust-anchor-authority.r24.v1',
  row_schema_ref: 'authoritative_row_schemas.case_session_root_trust_anchors',
  deployment_configuration_schema_ref: 'deployment_trust_configuration_schema',
  externally_pinned_identity: 'deployment_trust_configuration_exact_root_ref_version_artifact_and_configuration_digest',
  deterministic_selection: 'one_exact_root_partition_row_matching_all_pinned_equalities_or_hold',
  caller_controlled: false,
  sole_writer_role: 'ctrl_offline_root_anchor_ceremony_writer',
  direct_dml_by_runtime_application_browser_edge_worker_service_or_caller: 'forbidden',
  bootstrap_verification_ref: 'case_session_root_bootstrap_proof_schema',
  rotation_in_r24_or_active_adapter_scope: 'forbidden',
  rotation_request_result_or_transition: 'hold_without_change_and_require_future_separately_reviewed_staged_protocol',
  self_authentication: 'forbidden',
}
r24.case_session_authority_transition_tables.schema_version = 'ctrl.g24.case-session-authority-transition-tables.r24.v1'
r24.case_session_authority_transition_tables.case_session_root_trust_anchors = {
  standing_field: 'standing',
  standing_values: ['active'],
  rows: [{ operation_name: 'bootstrap_case_session_root_anchor', from: 'absent', to: 'active', prior_active_row_becomes_current: false, append_only: true }],
  rotation_transition_present: false,
}
for (const store of authorityStores.slice(1)) r24.case_session_authority_transition_tables[store].schema_version = `ctrl.g24.authority-transition-table.${store.replaceAll('_', '-')}.r24.v1`

// Closed, role-specific proof authority. No proof is an opaque caller assertion.
r24.case_session_root_bootstrap_proof_schema = closed('ctrl.g24.proof.root-bootstrap.r24.v1', {
  proof_ref: id, proof_kind: { const: 'root_bootstrap' }, ceremony_role: { const: 'two_person_offline_root_ceremony' },
  root_partition: { const: 'case_session_root' }, target_row_sha256: fp, deployment_configuration_ref: id,
  deployment_configuration_sha256: fp, audience: { const: 'ctrl_case_session_root_bootstrap' }, scope: { const: 'bootstrap_one_pinned_root_singleton' },
  nonce: fp, issued_at: ts, expires_at: ts, signature_algorithm: { const: 'ed25519' }, verifier_ref: id,
  verifier_version_ref: id, verifier_artifact_sha256: fp, signature_b64url: b64,
}, { caller_controlled_fields: [] })
r24.case_session_issuer_capability_proof_schema = closed('ctrl.g24.proof.current-issuer-capability.r24.v1', {
  proof_ref: id, proof_kind: { const: 'current_issuer_capability' }, authority_role: { const: 'issuer' }, issuer_ref: id,
  issuer_row_version_ref: id, issuer_registry_fingerprint: fp, root_anchor_row_version_ref: id, root_anchor_fingerprint: fp,
  audience: { const: 'ctrl_case_session_authority_operation' }, scope_operation_name: id, scope_target_store: id,
  scope_partition_fingerprint: fp, nonce: fp, issued_at: ts, expires_at: ts, signature_algorithm: { const: 'ed25519' },
  verifier_ref: id, verifier_version_ref: id, verifier_artifact_sha256: fp, signature_b64url: b64,
}, { caller_controlled_fields: [] })
r24.case_session_evaluator_capability_proof_schema = closed('ctrl.g24.proof.current-evaluator-capability.r24.v1', {
  proof_ref: id, proof_kind: { const: 'current_evaluator_capability' }, authority_role: { const: 'evaluator' }, evaluator_ref: id,
  evaluator_row_version_ref: id, evaluator_registry_fingerprint: fp, root_anchor_row_version_ref: id, root_anchor_fingerprint: fp,
  audience: { const: 'ctrl_case_session_authority_operation' }, scope_operation_name: id, scope_target_store: id,
  scope_partition_fingerprint: fp, nonce: fp, issued_at: ts, expires_at: ts, signature_algorithm: { const: 'ed25519' },
  verifier_ref: id, verifier_version_ref: id, verifier_artifact_sha256: fp, signature_b64url: b64,
}, { caller_controlled_fields: [] })
r24.authority_proof_verification = {
  schema_version: 'ctrl.g24.authority-proof-verification.r24.v1',
  exact_schema_by_role: {
    root: 'case_session_root_bootstrap_proof_schema',
    issuer: 'case_session_issuer_capability_proof_schema',
    evaluator: 'case_session_evaluator_capability_proof_schema',
  },
  verify_before_registry_lookup: true,
  exact_checks: ['schema_and_role', 'trusted_verifier_ref_version_and_artifact', 'signature_over_canonical_proof_bytes', 'audience', 'operation_and_target_scope', 'partition_scope', 'nonce_not_replayed', 'issued_at_and_expires_at', 'current_authority_row_and_root_join'],
  ambiguous_issuer_or_evaluator: 'forbidden',
  failure: 'hold_without_authority_disclosure_or_write',
}

// Durable operation identity and receipt authority.
const operationDefinitions = {
  bootstrap_case_session_root_anchor: ['case_session_root_trust_anchors', 'root', 'absent', 'active'],
  issue_case_session_issuer: ['case_session_issuer_registry', 'root', 'absent', 'active'],
  revoke_case_session_issuer: ['case_session_issuer_registry', 'root', 'active', 'revoked'],
  issue_case_session_evaluator: ['case_session_evaluator_registry', 'root', 'absent', 'active'],
  revoke_case_session_evaluator: ['case_session_evaluator_registry', 'root', 'active', 'revoked'],
  issue_account_actor_binding: ['account_stable_actor_bindings', 'issuer', 'absent', 'active'],
  rotate_account_actor_binding: ['account_stable_actor_bindings', 'issuer', 'active', 'active'],
  offboard_account_actor_binding: ['account_stable_actor_bindings', 'issuer', 'active', 'offboarded'],
  issue_account_access_standing: ['account_access_standings', 'issuer', 'absent', 'active'],
  revoke_account_access: ['account_access_standings', 'issuer', 'active', 'revoked'],
  offboard_account_access: ['account_access_standings', 'issuer', 'active', 'offboarded'],
  restore_account_access: ['account_access_standings', 'issuer', 'revoked_or_offboarded', 'active'],
  issue_server_session_principal: ['case_server_session_principal_evidence', 'evaluator', 'absent', 'active'],
  revoke_server_session_principal: ['case_server_session_principal_evidence', 'evaluator', 'active', 'revoked'],
  expire_server_session_principal: ['case_server_session_principal_evidence', 'evaluator', 'active', 'expired'],
}
const proofRefs = {
  root: 'case_session_root_bootstrap_proof_schema',
  issuer: 'case_session_issuer_capability_proof_schema',
  evaluator: 'case_session_evaluator_capability_proof_schema',
}
const operationResultBranches = ['committed', 'replayed', 'collision_hold', 'authority_hold', 'cas_hold', 'target_hold']
const operationProtocols = {}
for (const [name, [targetStore, role, fromStanding, toStanding]] of Object.entries(operationDefinitions)) {
  const slug = name.replaceAll('_', '-')
  const request = closed(`ctrl.g24.authority-operation-${slug}-request.r24.v1`, {
    operation_name: { const: name }, operation_id: id, idempotency_key: fp, target_store: { const: targetStore },
    target_partition_fingerprint: fp, target_row_schema_ref: { const: `authoritative_row_schemas.${targetStore}` },
    target_row_canonical_bytes_ref: id, target_row_canonical_bytes_sha256: fp, target_row_fingerprint: fp,
    expected_prior_row_version_ref: { type: 'nullable', value_schema: id }, expected_prior_row_fingerprint: { type: 'nullable', value_schema: fp },
    authority_proof_schema_ref: { const: proofRefs[role] }, authority_proof_bytes_ref: id, authority_proof_bytes_sha256: fp,
  })
  const committed = closed(`ctrl.g24.authority-operation-${slug}-result-committed.r24.v1`, {
    operation_name: { const: name }, operation_id: id, branch: { const: 'committed' }, target_store: { const: targetStore },
    target_row_version_ref: id, target_row_fingerprint: fp, receipt_ref: id, receipt_fingerprint: fp, committed_at: ts,
  })
  const replayed = closed(`ctrl.g24.authority-operation-${slug}-result-replayed.r24.v1`, {
    operation_name: { const: name }, operation_id: id, branch: { const: 'replayed' }, original_result_bytes_ref: id,
    original_result_bytes_sha256: fp, receipt_ref: id, receipt_fingerprint: fp, replayed_at: ts,
  })
  const holdVariant = branch => closed(`ctrl.g24.authority-operation-${slug}-result-${branch.replaceAll('_', '-')}.r24.v1`, {
    operation_name: { const: name }, operation_id: id, branch: { const: branch }, hold_reason_code: id, hold_fingerprint: fp, held_at: ts,
  })
  const variants = { committed, replayed }
  for (const branch of operationResultBranches.slice(2)) variants[branch] = holdVariant(branch)
  operationProtocols[name] = {
    schema_version: `ctrl.g24.authority-operation-${slug}-protocol.r24.v1`,
    target_store: targetStore,
    exact_authority_role: role,
    authority_proof_schema_ref: proofRefs[role],
    request_schema: request,
    result_schema: { schema_version: `ctrl.g24.authority-operation-${slug}-result-union.r24.v1`, discriminator: 'branch', exact_variants: operationResultBranches, variants },
    request_fingerprint: fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-REQUEST-R24`, Object.keys(request.properties)),
    transition: { from_standing: fromStanding, to_standing: toStanding, immutable_partition_fields: [...r24.authoritative_row_schemas[targetStore].partition_key], selected_latest_row_must_match_expected_prior: true },
    target_decoder: { schema_ref: `authoritative_row_schemas.${targetStore}`, decode_exact_canonical_bytes: true, recompute_bytes_sha256: true, recompute_row_fingerprint: true, reject_schema_partition_from_to_or_postcondition_mismatch: true },
    branch_non_nullability: 'each_variant_has_only_its_exact_required_keys; committed_and_replayed_refs_are_never_nullable; hold_variants_have_no committed target or receipt fields',
  }
}
r24.case_session_authority_operation_protocols = {
  schema_version: 'ctrl.g24.case-session-authority-operation-protocols.r24.v1',
  exact_operation_names: Object.keys(operationDefinitions),
  forbidden_operation_names: ['rotate_case_session_root_anchor'],
  operations: operationProtocols,
  exact_authority_role_by_operation: Object.fromEntries(Object.entries(operationDefinitions).map(([name, value]) => [name, value[1]])),
  ambiguous_issuer_or_evaluator_authority: 'forbidden',
  server_time: 'server_database_transaction_timestamp_only',
  concurrent_first_use: 'one_serializable_winner_then_exact_replay_collision_or_hold',
}
r24.authority_operation_registry = {
  schema_version: 'ctrl.g24.authority-operation-registry.r24.v1',
  row_schema: closed('ctrl.g24.authority-operation-registry-row.r24.v1', {
    target_store: { type: 'enum', values: [...new Set(Object.values(operationDefinitions).map(value => value[0]))] }, operation_id: id,
    idempotency_key: fp, operation_name: { type: 'enum', values: Object.keys(operationDefinitions) }, request_fingerprint: fp,
    request_bytes_ref: id, request_bytes_sha256: fp, target_row_bytes_ref: id, target_row_bytes_sha256: fp,
    target_row_fingerprint: fp, result_branch: { type: 'enum', values: operationResultBranches }, result_bytes_ref: id,
    result_bytes_sha256: fp, result_fingerprint: fp, receipt_ref: { type: 'nullable', value_schema: id },
    receipt_fingerprint: { type: 'nullable', value_schema: fp }, server_recorded_at: ts, registry_fingerprint: fp,
  }, {
    append_only: true,
    unique_keys: [['target_store', 'operation_id', 'idempotency_key'], ['target_store', 'operation_id']],
    fingerprint_ref: 'fingerprint_schemas.authority_operation_registry',
    fingerprint_field: 'registry_fingerprint',
    conditional_rules: [
      'committed_or_replayed_requires_nonnull_receipt_ref_and_fingerprint',
      'collision_or_authority_or_cas_or_target_hold_requires_null_receipt_ref_and_fingerprint',
      'same_target_store_operation_id_and_idempotency_key_with_exact_request_fingerprint_returns_exact_replay',
      'same_target_store_and_operation_id_with_changed_idempotency_key_or_request_fingerprint_returns_collision_hold',
    ],
  }),
  sole_writer: 'ctrl_case_session_authority_operation_executor',
  direct_dml: 'forbidden',
  restart_lookup: ['target_store', 'operation_id', 'idempotency_key'],
  collision_lookup: ['target_store', 'operation_id'],
  transaction: 'registry_target_transition_receipt_and_result_artifacts_commit_atomically_or_none',
}
r24.fingerprint_schemas.authority_operation_registry = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-R24', Object.keys(r24.authority_operation_registry.row_schema.properties).filter(key => key !== 'registry_fingerprint'))
r24.authority_operation_receipt_store = {
  schema_version: 'ctrl.g24.authority-operation-receipt-store.r24.v1',
  row_schema: closed('ctrl.g24.authority-operation-receipt-row.r24.v1', {
    receipt_ref: id, target_store: { type: 'enum', values: [...new Set(Object.values(operationDefinitions).map(value => value[0]))] }, operation_name: { type: 'enum', values: Object.keys(operationDefinitions) },
    operation_id: id, idempotency_key: fp, request_fingerprint: fp, request_bytes_ref: id, request_bytes_sha256: fp,
    target_row_schema_ref: id, target_row_bytes_ref: id, target_row_bytes_sha256: fp, target_row_fingerprint: fp,
    prior_row_version_ref: { type: 'nullable', value_schema: id }, prior_row_fingerprint: { type: 'nullable', value_schema: fp },
    result_branch: { const: 'committed' }, result_bytes_ref: id, result_bytes_sha256: fp, result_fingerprint: fp,
    authority_proof_schema_ref: id, authority_proof_bytes_ref: id, authority_proof_bytes_sha256: fp,
    server_committed_at: ts, receipt_fingerprint: fp,
  }, {
    append_only: true,
    unique_keys: [['receipt_ref'], ['target_store', 'operation_id', 'idempotency_key']],
    fingerprint_ref: 'fingerprint_schemas.authority_operation_receipt',
    fingerprint_field: 'receipt_fingerprint',
  }),
  sole_writer: 'ctrl_case_session_authority_operation_executor',
  direct_dml: 'forbidden',
  exact_equalities: [
    'receipt_request_identity_equals_registry_request_identity_and_resolved_request_blob',
    'receipt_target_identity_equals_registry_target_identity_and_exact_decoded_target_blob',
    'receipt_result_identity_equals_registry_result_identity_and_exact_committed_result_blob',
    'receipt_ref_and_fingerprint_equal_committed_result_receipt_ref_and_fingerprint',
    'receipt_authority_proof_identity_equals_verified_exact_role_specific_proof_blob',
  ],
  restart_rule: 'resolve_registry_request_target_result_receipt_and_proof_blobs_by_exact_refs_verify_every_hash_fingerprint_schema_partition_transition_and_equality_or_hold',
}
r24.fingerprint_schemas.authority_operation_receipt = fingerprint('CTRL-G24-AUTHORITY-OPERATION-RECEIPT-R24', Object.keys(r24.authority_operation_receipt_store.row_schema.properties).filter(key => key !== 'receipt_fingerprint'))

// Content-addressed human-principal evidence is resolvable after restart.
const artifactRow = (version, kind) => closed(version, {
  artifact_ref: id, artifact_kind: { const: kind }, canonical_schema_ref: id, canonical_bytes_b64url: b64,
  canonical_bytes_length: { type: 'safe_nonnegative_integer' }, canonical_bytes_sha256: fp, stored_at: ts, writer_role: { const: 'ctrl_server_auth_artifact_writer' }, artifact_fingerprint: fp,
}, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_kind', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.principal_authority_artifact', fingerprint_field: 'artifact_fingerprint' })
r24.principal_authority_artifact_stores = {
  schema_version: 'ctrl.g24.principal-authority-artifact-stores.r24.v1',
  live_principal_assertions: { row_schema: artifactRow('ctrl.g24.live-principal-assertion-artifact-row.r24.v1', 'live_principal_assertion'), sole_writer: 'ctrl_server_auth_artifact_writer', direct_dml: 'forbidden', retention: 'retain_at_least_as_long_as_any_receipt_registry_result_or_audit_reference', exact_resolution: 'artifact_ref_and_sha256_resolve_one_immutable_exact_canonical_blob' },
  presented_principal_projections: { row_schema: artifactRow('ctrl.g24.presented-principal-projection-artifact-row.r24.v1', 'presented_principal_projection'), sole_writer: 'ctrl_server_auth_artifact_writer', direct_dml: 'forbidden', retention: 'retain_at_least_as_long_as_any_receipt_registry_result_or_audit_reference', exact_resolution: 'artifact_ref_and_sha256_resolve_one_immutable_exact_canonical_blob' },
}
r24.fingerprint_schemas.principal_authority_artifact = fingerprint('CTRL-G24-PRINCIPAL-AUTHORITY-ARTIFACT-R24', ['artifact_ref', 'artifact_kind', 'canonical_schema_ref', 'canonical_bytes_b64url', 'canonical_bytes_length', 'canonical_bytes_sha256', 'stored_at', 'writer_role'])
const readSet = r24.case_session_authority_read_set_schema
readSet.schema_version = 'ctrl.g24.case-session-authority-read-set.r24.v1'
for (const [key, value] of Object.entries({
  root_anchor_row_version_ref: id,
  deployment_configuration_ref: id,
  deployment_configuration_sha256: fp,
  pinned_runtime_attestor_ref: id,
  pinned_runtime_attestor_version: id,
  pinned_runtime_attestor_artifact_sha256: fp,
})) add(readSet, key, value)
r24.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R24', Object.keys(readSet.properties).filter(key => key !== 'snapshot_fingerprint'))
r24.case_authority_control_receipt_authority_audit.schema_version = 'ctrl.g24.case-authority-control-receipt-authority-audit.r24.v1'
r24.case_authority_control_receipt_authority_audit.content_addressed_artifact_store_refs = ['principal_authority_artifact_stores.live_principal_assertions', 'principal_authority_artifact_stores.presented_principal_projections']
r24.case_authority_control_receipt_authority_audit.root_and_attestor_snapshot = ['root_partition', 'root_anchor_row_version_ref', 'trust_anchor_ref', 'trust_anchor_version_ref', 'trust_anchor_fingerprint', 'deployment_configuration_ref', 'deployment_configuration_sha256', 'pinned_runtime_attestor_ref', 'pinned_runtime_attestor_version', 'pinned_runtime_attestor_artifact_sha256']
r24.case_authority_control_receipt_authority_audit.restart_rule = 'resolve_exact_authority_rows_deployment_configuration_and_content_addressed_principal_artifacts_then_verify_pinned_root_attestor_hashes_latest_row_standing_time_validity_and_snapshot_CAS_or_hold_without_response_or_write'

// One outbox origin authority. The R23 sidecar is removed and unwired.
delete r24.outbox.pending_origin_schema
delete r24.fingerprint_schemas.outbox_pending_origin
delete r24.outbox.genesis_protocol.pending_origin_schema_ref
const origin = r24.outbox.effect_origin_schema
origin.schema_version = 'ctrl.g24.outbox-effect-origin.r24.v1'
add(origin, 'selected_result_schema_sha256', fp)
origin.conditional_rules = origin.conditional_rules.map(rule => rule.replace('operation_class_selected_result_schema_result_ref', 'operation_class_selected_result_schema_version_and_sha256_result_ref'))
r24.fingerprint_schemas.outbox_effect_origin = fingerprint('CTRL-G24-OUTBOX-EFFECT-ORIGIN-R24', Object.keys(origin.properties).filter(key => key !== 'origin_fingerprint'))
r24.outbox.genesis_protocol.schema_version = 'ctrl.g24.outbox-genesis-protocol.r24.v1'
r24.outbox.genesis_protocol.exact_equalities = r24.outbox.genesis_protocol.exact_equalities.filter(rule => !rule.startsWith('pending_origin.'))
r24.outbox.genesis_protocol.exact_equalities.push('effect_origin.selected_result_schema_sha256_equals_committed_success.selected_result_schema_sha256_equals_result_blob.selected_result_schema_sha256_equals_the_immutable_selected_result_schema_digest')
r24.outbox.genesis_protocol.exact_equalities.push('effect_origin.source_operation_result_fingerprint_equals_committed_success.result_payload_fingerprint_equals_recomputed_universal_operation_result_payload_fingerprint_including_selected_result_schema_sha256')
r24.outbox.genesis_protocol.restart_rule = 'rehydrate_the_single_effect_origin_and_committed_success_by_exact_refs_then_verify_selected_result_schema_sha256_and_universal_result_fingerprint_before_dispatch'
r24.outbox.genesis_protocol.sidecar_origin_authority = 'forbidden'

r24.schema_change_manifest = {
  schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r24.v1',
  derivation: 'bounded_exact_extension_from_frozen_R23_to_R24_nonresurrecting_latest_row_selection_durable_authority_operation_receipts_typed_role_proofs_immutable_root_restart_artifacts_and_single_outbox_origin',
  frozen_parent_sha256: sha(inputBytes),
  changed_semantic_paths: [
    '$', '$.authoritative_row_schemas.case_session_root_trust_anchors', '$.authoritative_row_schemas.case_session_issuer_registry',
    '$.authoritative_row_schemas.case_session_evaluator_registry', '$.authoritative_row_schemas.account_stable_actor_bindings',
    '$.authoritative_row_schemas.account_access_standings', '$.authoritative_row_schemas.case_server_session_principal_evidence',
    '$.append_only_current_selection_protocol', '$.server_presented_principal_projection_derivation',
    '$.case_authority_control_hold_dependency_projection_map', '$.case_session_root_trust_anchor_authority',
    '$.case_session_authority_operation_protocols', '$.authority_operation_registry', '$.authority_operation_receipt_store',
    '$.authority_proof_verification', '$.principal_authority_artifact_stores', '$.case_session_authority_read_set_schema',
    '$.case_authority_control_receipt_authority_audit', '$.outbox.effect_origin_schema', '$.outbox.genesis_protocol',
  ],
  every_changed_or_new_semantic_object_has_r24_identifier: true,
  same_version_semantic_change: 'forbidden',
  sidecar_outbox_origin_removed: true,
}
r24.required_negative_fixture_families = [...new Set([...r24.required_negative_fixture_families,
  'revoked_offboarded_or_expired_latest_row_resurrects_older_active', 'authority_operation_registry_replay_collision_or_nullable_commit',
  'wrong_authority_role_or_opaque_proof', 'root_rotation_attempt', 'principal_artifact_store_or_restart_lookup_omission',
  'outbox_origin_digest_sidecar_or_old_fingerprint', 'r24_semantic_object_retains_r23_version',
])]
r24.visible_surface_changes = []
r24.external_actions_authorized = []
function rejectUndefined(value, path = '$') {
  if (value === undefined) throw new Error(`undefined:${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`)
}
rejectUndefined(r24)
export const materializedR24 = r24
export const materializedR24Output = `${JSON.stringify(r24, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR24Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR24Output) {
      console.error(`${outputPath} differs from materializer`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R24 effective contract`)
  } else throw new Error(`unsupported mode:${mode}`)
}
