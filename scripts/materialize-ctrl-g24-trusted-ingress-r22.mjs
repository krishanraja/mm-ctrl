import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR21 } from './materialize-ctrl-g24-trusted-ingress-r21.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r21.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r22.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r22 = structuredClone(materializedR21)
const hash = value => createHash('sha256').update(value).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const b64 = { type: 'base64url_without_padding' }

function closed(schemaVersion, properties, extras = {}) {
  const optional = extras.optional ?? []
  const keys = Object.keys(properties)
  const result = { schema_version: schemaVersion, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }
  if (!optional.length) delete result.optional
  return result
}
function fingerprint(domain, fields) {
  return { domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
}
function addProperty(schema, name, property) {
  schema.properties[name] = property
  if (!schema.exact_keys.includes(name)) schema.exact_keys.push(name)
  if (!(schema.optional ?? []).includes(name) && !schema.required.includes(name)) schema.required.push(name)
}
function schemaDigest(schema) {
  return hash(Buffer.from(JSON.stringify(schema), 'utf8'))
}

r22.schema_version = 'ctrl.g24.trusted-ingress.r22.effective.v1'
r22.status = 'twenty_first_repair_candidate_under_independent_review'
r22.supersedes = {
  commit: '754994c868c31c29ffe5ed077ac3668d7ed9b95c', tree: '47cf682d18791aae7af2262908585450454b68f1',
  human_blob: '2a5645411ced2866d56fc7eff882f65f6ea049d0', machine_blob: 'eaca9579126df4d203c22052fe94350cefa803f6',
  qa_blob: 'b0a730d9661d9d5a182831368e33947c1afbe649', checker_blob: '01acee8d9fb2e4d6b5f47efa2c6b4fcbc1c75582',
  materializer_blob: 'e46a5f69417aa58d466236fda1e1aea355e345b9', founder_checker_blob: '37f630c4ca138c061fd8ccf464bb68693e4e48af', adjudication: 'veto',
}
r22.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r22.mjs', frozen_input: { path: inputPath, sha256: hash(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

// The server presents one closed principal projection derived from durable evidence.
r22.server_presented_principal_projection_schema = closed('ctrl.g24.server-presented-principal-projection.r22.v1', {
  session_ref: id, session_instance_hash: fp, workspace_ref: id, account_ref: id, stable_actor_ref: id,
  principal_kind: { const: 'human_session' }, actor_class: { type: 'enum', values: ['krish_operator', 'authorized_operator', 'named_leader'] }, authority_version: id,
  issued_at: ts, expires_at: ts, current_standing: { const: 'active' },
  session_evidence_ref: id, session_evidence_row_version_ref: id, session_evidence_fingerprint: fp,
  projection_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.server_presented_principal_projection', fingerprint_field: 'projection_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true, caller_controlled_fields: [] })
r22.fingerprint_schemas.server_presented_principal_projection = fingerprint('CTRL-G24-SERVER-PRESENTED-PRINCIPAL-PROJECTION-R22', Object.keys(r22.server_presented_principal_projection_schema.properties).filter(key => key !== 'projection_fingerprint'))
r22.server_presented_principal_projection_derivation = {
  schema_version: 'ctrl.g24.server-presented-principal-projection-derivation.r22.v1',
  source_schema_ref: 'authoritative_row_schemas.case_server_session_principal_evidence',
  target_schema_ref: 'server_presented_principal_projection_schema',
  principal_schema_ref: 'principal_schemas.human_session',
  lookup_unique_key: ['workspace_ref', 'session_instance_hash', 'row_version_ref'],
  current_lookup_partition: ['workspace_ref', 'session_instance_hash'],
  exact_joins: [
    'projection.session_ref_equals_session_evidence.server_session_ref',
    'projection.session_instance_hash_equals_session_evidence.session_instance_hash_equals_human_session.session_instance_hash',
    'projection.workspace_ref_equals_session_evidence.workspace_ref_equals_request.workspace_ref_equals_current_case.workspace_ref',
    'projection.account_ref_equals_session_evidence.account_ref',
    'projection.stable_actor_ref_equals_session_evidence.stable_actor_ref_equals_human_session.stable_actor_ref',
    'projection.principal_kind_equals_human_session.principal_kind_equals_human_session',
    'projection.actor_class_equals_session_evidence.actor_class_equals_human_session.actor_class',
    'projection.authority_version_equals_session_evidence.authority_version_equals_human_session.authority_version',
    'projection.issued_at_equals_session_evidence.issued_at_and_projection.expires_at_equals_session_evidence.expires_at',
    'projection.current_standing_active_iff_selected_session_evidence.session_standing_active_and_selected_account_standing.active',
    'projection.session_evidence_ref_row_version_and_fingerprint_equal_the_exact_selected_evidence_row',
  ],
  caller_supplied_projection_or_field: 'forbidden',
  any_missing_duplicate_mismatch_or_cross_workspace_join: 'fail_closed_without_registry_disclosure_or_write',
}
const sessionRow = r22.authoritative_row_schemas.case_server_session_principal_evidence
sessionRow.schema_version = 'ctrl.g24.authoritative-row.case-server-session-principal-evidence.r22.v1'
addProperty(sessionRow, 'actor_class', { type: 'enum', values: ['krish_operator', 'authorized_operator', 'named_leader'] })
addProperty(sessionRow, 'authority_version', id)
sessionRow.unique_keys = [...sessionRow.unique_keys, ['workspace_ref', 'session_instance_hash', 'row_version_ref']]
sessionRow.session_instance_current_partition = ['workspace_ref', 'session_instance_hash']
r22.principal_schemas.human_session.schema_version = 'ctrl.g24.principal.human-session.r22.v1'
r22.case_authority_control_plane.schema_version = 'ctrl.g24.case-authority-control-plane.r22.v1'
r22.case_authority_control_plane.server_presented_principal_projection_ref = 'server_presented_principal_projection_derivation'
r22.case_authority_control_session_actor_derivation.schema_version = 'ctrl.g24.case-authority-control-session-actor-derivation.r22.v1'
r22.case_authority_control_session_actor_derivation.source = 'server_presented_principal_projection_schema'
r22.case_authority_control_session_actor_derivation.server_presented_projection_derivation_ref = 'server_presented_principal_projection_derivation'

// Every authority store has one writer and a root-anchored issuance and transition contract.
r22.case_session_root_trust_anchor_schema = closed('ctrl.g24.case-session-root-trust-anchor.r22.v1', {
  trust_anchor_ref: id, trust_anchor_version_ref: id, trust_anchor_artifact_sha256: fp,
  root_authority_class: { const: 'offline_case_session_root' }, valid_from: ts, valid_until: ts, anchor_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['trust_anchor_ref', 'trust_anchor_version_ref']], fingerprint_ref: 'fingerprint_schemas.case_session_root_trust_anchor', fingerprint_field: 'anchor_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r22.fingerprint_schemas.case_session_root_trust_anchor = fingerprint('CTRL-G24-CASE-SESSION-ROOT-TRUST-ANCHOR-R22', Object.keys(r22.case_session_root_trust_anchor_schema.properties).filter(key => key !== 'anchor_fingerprint'))
const storeControls = {}
const storeControlKeys = ['sole_writer_role', 'direct_dml_by_application_browser_edge_worker_generic_service_or_caller', 'issuance_operation', 'transition_operations', 'issuance_authority', 'issuer_and_evaluator_self_appointment', 'append_only_transition_rows_only']
r22.case_session_authority_store_control_schema = closed('ctrl.g24.case-session-authority-store-control.r22.v1', {
  sole_writer_role: { const: 'ctrl_case_session_authority_writer' }, direct_dml_by_application_browser_edge_worker_generic_service_or_caller: { const: 'forbidden' },
  issuance_operation: id, transition_operations: { type: 'array', min_items: 1, unique: true, items: id }, issuance_authority: { type: 'enum', values: ['root_trust_anchor', 'trusted_current_issuer', 'trusted_current_issuer_and_evaluator'] },
  issuer_and_evaluator_self_appointment: { const: 'forbidden' }, append_only_transition_rows_only: { const: true },
})
const storeDefinitions = [
  ['case_session_issuer_registry', 'issue_case_session_issuer', ['revoke_case_session_issuer'], 'root_trust_anchor'],
  ['case_session_evaluator_registry', 'issue_case_session_evaluator', ['revoke_case_session_evaluator'], 'root_trust_anchor'],
  ['account_stable_actor_bindings', 'issue_account_actor_binding', ['rotate_account_actor_binding', 'offboard_account_actor_binding'], 'trusted_current_issuer'],
  ['account_access_standings', 'issue_account_access_standing', ['revoke_account_access', 'offboard_account_access', 'restore_account_access'], 'trusted_current_issuer'],
  ['case_server_session_principal_evidence', 'issue_server_session_principal', ['revoke_server_session_principal', 'expire_server_session_principal'], 'trusted_current_issuer_and_evaluator'],
]
for (const [store, issuance, transitions, authority] of storeDefinitions) storeControls[store] = {
  sole_writer_role: 'ctrl_case_session_authority_writer', direct_dml_by_application_browser_edge_worker_generic_service_or_caller: 'forbidden',
  issuance_operation: issuance, transition_operations: transitions, issuance_authority: authority,
  issuer_and_evaluator_self_appointment: 'forbidden', append_only_transition_rows_only: true,
}
r22.case_session_authority_store_controls = {
  schema_version: 'ctrl.g24.case-session-authority-store-controls.r22.v1', stores: storeControls,
  store_keys: storeDefinitions.map(item => item[0]), store_control_schema_ref: 'case_session_authority_store_control_schema', store_control_exact_keys: storeControlKeys,
  bootstrap: 'offline_root_trust_anchor_is_installed_by_separately_audited_bootstrap_only_and_cannot_be_created_by_any_runtime_issuer_or_evaluator',
  trusted_joins: [
    'issuer_registry_rows_join_the_current_root_trust_anchor_ref_version_and_artifact_sha256',
    'evaluator_registry_rows_join_the_current_root_trust_anchor_ref_version_and_artifact_sha256',
    'account_binding.issuer_ref_version_and_artifact_sha256_equal_the_unique_current_trusted_issuer_row',
    'account_standing.issuer_ref_version_and_artifact_sha256_equal_the_unique_current_trusted_issuer_row',
    'session_evidence.issuer_and_evaluator_refs_versions_and_artifact_sha256_equal_the_unique_current_trusted_rows',
  ],
  revocation_and_offboarding_authority: 'only_root_anchored_current_issuer_transition_operations_may_append_revoked_or_offboarded_standing',
  same_transaction_snapshot_and_cas_ref: 'case_authority_control_session_snapshot',
  concurrent_revocation: 'if_any_session_issuer_evaluator_binding_or_standing_row_changes_before_commit_serializable_retry_then_hold_without_write',
}
const authorityOperations = {}
for (const [store, issuance, transitions, authority] of storeDefinitions) {
  authorityOperations[issuance] = { target_store: store, operation_kind: 'issue', authority_source: authority, prior_current_row: 'absent_or_exact_compare_and_swap', effect: 'append_one_new_versioned_row_or_none' }
  for (const transition of transitions) authorityOperations[transition] = { target_store: store, operation_kind: 'transition', authority_source: authority, prior_current_row: 'required_exact_ref_version_and_fingerprint_compare_and_swap', effect: 'append_one_new_versioned_standing_or_binding_row_or_none' }
}
r22.case_session_authority_operation_schema = closed('ctrl.g24.case-session-authority-operation.r22.v1', {
  target_store: { type: 'enum', values: storeDefinitions.map(item => item[0]) }, operation_kind: { type: 'enum', values: ['issue', 'transition'] },
  authority_source: { type: 'enum', values: ['root_trust_anchor', 'trusted_current_issuer', 'trusted_current_issuer_and_evaluator'] },
  prior_current_row: { type: 'enum', values: ['absent_or_exact_compare_and_swap', 'required_exact_ref_version_and_fingerprint_compare_and_swap'] },
  effect: { type: 'enum', values: ['append_one_new_versioned_row_or_none', 'append_one_new_versioned_standing_or_binding_row_or_none'] },
})
r22.case_session_authority_operations = {
  schema_version: 'ctrl.g24.case-session-authority-operations.r22.v1', operation_schema_ref: 'case_session_authority_operation_schema',
  operations: authorityOperations, exact_operation_names: Object.keys(authorityOperations),
  transaction: 'one_serializable_transaction_with_the_same_authority_snapshot_and_compare_and_swap_or_no_row',
  sole_writer_ref: 'case_session_authority_store_controls', direct_dml: 'forbidden',
}
for (const name of ['case_session_issuer_registry', 'case_session_evaluator_registry']) {
  const row = r22.authoritative_row_schemas[name]
  row.schema_version = row.schema_version.replace('.r21.', '.r22.')
  addProperty(row, 'trust_anchor_ref', id); addProperty(row, 'trust_anchor_version_ref', id); addProperty(row, 'trust_anchor_artifact_sha256', fp)
  row.sole_writer_control_ref = `case_session_authority_store_controls.stores.${name}`
  row.conditional_rules = [...(row.conditional_rules ?? []), 'trust_anchor_ref_version_and_artifact_sha256_equal_the_unique_current_offline_root_trust_anchor']
}
for (const name of ['account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']) {
  const row = r22.authoritative_row_schemas[name]
  row.schema_version = row.schema_version.replace('.r21.', '.r22.')
  row.sole_writer_control_ref = `case_session_authority_store_controls.stores.${name}`
  if (name === 'case_server_session_principal_evidence') row.conditional_rules = [...(row.conditional_rules ?? []), 'issuer_and_evaluator_refs_versions_and_artifact_sha256_equal_the_unique_current_trusted_rows']
  else row.conditional_rules = [...(row.conditional_rules ?? []), 'issuer_ref_version_and_artifact_sha256_equal_the_unique_current_trusted_issuer_row']
}
for (const name of ['case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']) {
  const row = r22.authoritative_row_schemas[name]
  const fingerprintName = row.fingerprint_ref.split('.').at(-1)
  r22.fingerprint_schemas[fingerprintName] = fingerprint(`CTRL-G24-${fingerprintName.replaceAll('_', '-').toUpperCase()}-R22`, Object.keys(row.properties).filter(key => key !== row.fingerprint_field))
}

// Persist the exact authority read set used by case-control admission and commit.
r22.case_session_authority_read_set_schema = closed('ctrl.g24.case-session-authority-read-set.r22.v1', {
  trust_anchor_ref: id, trust_anchor_version_ref: id, trust_anchor_fingerprint: fp,
  server_presented_principal_fingerprint: fp,
  session_evidence_ref: id, session_evidence_row_version_ref: id, session_evidence_fingerprint: fp,
  issuer_ref: id, issuer_row_version_ref: id, issuer_registry_fingerprint: fp,
  evaluator_ref: id, evaluator_row_version_ref: id, evaluator_registry_fingerprint: fp,
  account_binding_ref: id, account_binding_row_version_ref: id, account_binding_fingerprint: fp,
  account_standing_ref: id, account_standing_row_version_ref: id, account_standing_fingerprint: fp,
  case_binding_ref: id, case_binding_row_version_ref: id, case_binding_fingerprint: fp,
  operator_grant_set_seal: fp, workload_grant_set_seal: fp, snapshot_fingerprint: fp,
}, { fingerprint_ref: 'fingerprint_schemas.case_session_authority_read_set', fingerprint_field: 'snapshot_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r22.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R22', Object.keys(r22.case_session_authority_read_set_schema.properties).filter(key => key !== 'snapshot_fingerprint'))
const controlRegistry = r22.case_authority_control_operation_registry
controlRegistry.schema_version = 'ctrl.g24.case-authority-control-operation-registry.r22.v1'
const receipt = controlRegistry.row_schema
receipt.schema_version = 'ctrl.g24.case-authority-control-operation-receipt.r22.v1'
addProperty(receipt, 'server_presented_principal_fingerprint', fp)
addProperty(receipt, 'authority_read_set', { schema_ref: 'case_session_authority_read_set_schema' })
addProperty(receipt, 'authority_snapshot_fingerprint', fp)
receipt.conditional_rules.push('receipt.authority_read_set_contains_every_exact_ref_version_and_fingerprint_used_for_admission_and_commit')
receipt.conditional_rules.push('receipt.authority_snapshot_fingerprint_equals_receipt.authority_read_set.snapshot_fingerprint_equals_the_admission_snapshot_fingerprint')
receipt.conditional_rules.push('commit_rehydrates_every_authority_read_set_row_and_recomputes_every_fingerprint_in_the_same_serializable_snapshot_before_compare_and_swap')
for (const field of ['server_presented_principal_fingerprint', 'authority_read_set', 'authority_snapshot_fingerprint']) r22.fingerprint_schemas.case_authority_control_receipt.preimage_order.push(field)
r22.fingerprint_schemas.case_authority_control_receipt.domain_ascii = 'CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R22'
r22.case_authority_control_receipt_authority_audit = {
  schema_version: 'ctrl.g24.case-authority-control-receipt-authority-audit.r22.v1',
  receipt_schema_ref: 'case_authority_control_operation_registry.row_schema', read_set_schema_ref: 'case_session_authority_read_set_schema',
  exact_rehydration: 'resolve_each_ref_and_version_then_verify_its_stored_and_recomputed_fingerprint_and_current_selection_at_receipt_snapshot',
  commit_rule: 'same_serializable_transaction_and_compare_and_swap_every_read_set_member_before_binding_and_receipt_commit',
  any_missing_duplicate_changed_revoked_offboarded_expired_or_mismatched_member: 'hold_without_binding_receipt_or_registry_disclosure',
}
r22.case_authority_control_session_snapshot.schema_version = 'ctrl.g24.case-authority-control-session-snapshot.r22.v1'
r22.case_authority_control_session_snapshot.controlling_rows = [...new Set([...r22.case_authority_control_session_snapshot.controlling_rows, 'current_root_trust_anchor', 'server_presented_principal_projection', 'receipt_authority_read_set'])]

// Hold inputs have one exact typed source and encoding for every dependency.
r22.case_authority_control_hold_dependency_projection_map = {
  schema_version: 'ctrl.g24.case-authority-control-hold-dependency-projection-map.r22.v1',
  dependencies: {
    session_actor: { source_path: 'server_presented_principal_projection.stable_actor_ref', source_schema_ref: 'server_presented_principal_projection_schema.properties.stable_actor_ref', scalar_type: 'identifier', availability_field: 'session_actor_available', value_field: 'session_actor_value_or_sentinel_b64url', canonical_encoding: 'canonical_field_encoding.identifier' },
    workspace: { source_path: 'case_authority_control_request.workspace_ref', source_schema_ref: 'case_authority_control_plane.request_schema.properties.workspace_ref', scalar_type: 'identifier', availability_field: 'workspace_available', value_field: 'workspace_value_or_sentinel_b64url', canonical_encoding: 'canonical_field_encoding.identifier' },
    subject: { source_path: 'case_authority_control_request.subject_ref', source_schema_ref: 'case_authority_control_plane.request_schema.properties.subject_ref', scalar_type: 'identifier', availability_field: 'subject_available', value_field: 'subject_value_or_sentinel_b64url', canonical_encoding: 'canonical_field_encoding.identifier' },
    case: { source_path: 'case_authority_control_request.case_ref', source_schema_ref: 'case_authority_control_plane.request_schema.properties.case_ref', scalar_type: 'identifier', availability_field: 'case_available', value_field: 'case_value_or_sentinel_b64url', canonical_encoding: 'canonical_field_encoding.identifier' },
    control_operation_id: { source_path: 'case_authority_control_request.control_operation_id', source_schema_ref: 'case_authority_control_plane.request_schema.properties.control_operation_id', scalar_type: 'identifier', availability_field: 'control_operation_id_available', value_field: 'control_operation_id_value_or_sentinel_b64url', canonical_encoding: 'canonical_field_encoding.identifier' },
    request_fingerprint: { source_path: 'case_authority_control_request.request_fingerprint', source_schema_ref: 'case_authority_control_plane.request_schema.properties.request_fingerprint', scalar_type: 'sha256', availability_field: 'request_fingerprint_available', value_field: 'request_fingerprint_value_or_sentinel_b64url', canonical_encoding: 'canonical_field_encoding.sha256_raw_32_bytes' },
  },
  exact_projection_rule: 'each_available_value_is_encoded_once_from_its_exact_source_path_and_declared_scalar_type; unavailable_uses_only_the_R21_literal_sentinel',
  alternate_text_hex_identifier_raw_or_implementation_encoding: 'forbidden',
}
r22.case_authority_control_hold_fingerprints.schema_version = 'ctrl.g24.case-authority-control-hold-fingerprints.r22.v1'
r22.case_authority_control_hold_fingerprints.dependency_projection_map_ref = 'case_authority_control_hold_dependency_projection_map'
for (const schema of Object.values(r22.case_authority_control_hold_input_schemas)) {
  schema.schema_version = schema.schema_version.replace('.r21.', '.r22.')
  schema.dependency_projection_map_ref = 'case_authority_control_hold_dependency_projection_map'
}

// Replay has exact schemas and historical-field derivations.
r22.response_union.schema_version = 'ctrl.g24.response-union.r22.v1'
const replayedCommitted = r22.response_union.schemas.replayed_committed
replayedCommitted.schema_version = 'ctrl.g24.response.replayed-committed.r22.v1'
replayedCommitted.type = 'object'
r22.operation_registry.schema_version = 'ctrl.g24.operation-registry.r22.v1'
r22.operation_registry.replayed_committed_derivation.schema_version = 'ctrl.g24.replayed-committed-derivation.r22.v1'
r22.operation_registry.replayed_committed_derivation.replayed_response_schema_ref = 'response_union.schemas.replayed_committed'
r22.operation_registry.replayed_committed_derivation.schema_equality = 'replayed_response_validates_response_union.schemas.replayed_committed'
delete r22.response_union.replayed_held_payload_bytes_equal_original
r22.response_union.replayed_held_historical_field_equalities_ref = 'operation_registry.replayed_held_derivation.exact_historical_equalities'
r22.operation_registry.replayed_held_derivation.exact_historical_equalities = [
  'replay.operation_id_equals_held.operation_id_equals_hold_row.operation_id_equals_hold_blob.operation_id',
  'replay.operation_class_equals_held.operation_class_equals_hold_row.operation_class_equals_hold_blob.operation_class',
  'replay.hold_code_equals_held.hold_code_equals_hold_row.hold_code_equals_hold_blob.hold_code',
  'replay.evaluation_fingerprint_equals_held.evaluation_fingerprint_equals_hold_row.evaluation_fingerprint_equals_hold_blob.evaluation_fingerprint',
  'replay.committed_at_equals_held.committed_at_equals_hold_row.committed_at_equals_hold_blob.committed_at',
]
r22.operation_registry.replayed_held_derivation.only_fields_permitted_to_differ = ['status', 'replayed_at', 'historical_replay', 'current_standing']
r22.operation_registry.replayed_held_derivation.all_other_fields_must_equal_original_held_response = true

// Result-schema identity binds canonical schema bytes and digests, not labels alone.
const useRelease = r22.result_payload_schemas.use_release
const schemaIdentity = (schema, schemaRef) => ({ schema_version: schema.schema_version, schema_ref: schemaRef, canonical_schema_encoding: 'canonical_json_utf8_with_declared_member_order', canonical_schema_sha256: schemaDigest(schema) })
r22.operation_result_schema_derivation.schema_version = 'ctrl.g24.operation-result-schema-derivation.r22.v1'
r22.operation_result_schema_derivation.discriminated_results.use_release = {
  exported_union: schemaIdentity(useRelease, 'result_payload_schemas.use_release'), discriminator: useRelease.discriminator,
  variants: Object.fromEntries(Object.entries(useRelease.variants).map(([name, schema]) => [name, schemaIdentity(schema, `result_payload_schemas.use_release.variants.${name}`)])),
}
r22.operation_result_schema_derivation.inventory_exact_schema_equality = 'every_schema_ref_is_the_exact_current_schema_object_and_every_digest_equals_sha256_of_its_canonical_schema_bytes'
r22.operation_result_schema_derivation.selected_schema_digest_rule = 'selected_result_schema_sha256_equals_the_digest_of_the_exact_schema_selected_by_discriminator_and_branch'
for (const schema of [r22.operation_registry.committed_success_row_schema, r22.operation_result_blob_store.row_schema, r22.response_union.schemas.committed, r22.response_union.schemas.replayed_committed]) {
  schema.schema_version = schema.schema_version.replace(/\.r\d+\./, '.r22.')
  addProperty(schema, 'selected_result_schema_sha256', fp)
}
r22.operation_result_blob_store.schema_version = r22.operation_result_blob_store.schema_version.replace(/\.r\d+\./, '.r22.')
r22.operation_registry.committed_success_blob_derivation.exact_result_equalities.splice(5, 0, 'success.selected_result_schema_sha256_equals_result_blob.selected_result_schema_sha256')
r22.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.splice(5, 0, 'response.selected_result_schema_sha256_equals_success.selected_result_schema_sha256_equals_result_blob.selected_result_schema_sha256')
r22.operation_registry.replayed_committed_derivation.exact_historical_equalities.splice(5, 0, 'replay.selected_result_schema_sha256_equals_success.selected_result_schema_sha256_equals_result_blob.selected_result_schema_sha256')
for (const name of ['operation_registry_committed_success', 'operation_result_blob']) {
  if (r22.fingerprint_schemas[name] && !r22.fingerprint_schemas[name].preimage_order.includes('selected_result_schema_sha256')) r22.fingerprint_schemas[name].preimage_order.push('selected_result_schema_sha256')
}
r22.operation_registry.committed_success_row_schema.conditional_rules.push('selected_result_schema_sha256_equals_the_current_canonical_selected_schema_digest')
r22.operation_result_blob_store.row_schema.conditional_rules.push('selected_result_schema_sha256_equals_the_current_canonical_selected_schema_digest')
const terminalConsumption = r22.authoritative_row_schemas.release_authority_terminal_consumptions
terminalConsumption.schema_version = terminalConsumption.schema_version.replace(/\.r\d+\./, '.r22.')
addProperty(terminalConsumption, 'terminal_result_schema_sha256', fp)
r22.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.push('terminal_result_schema_sha256')
r22.authoritative_row_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.push('terminal_result_schema_sha256')
r22.release_terminal_consumption_derivation.exact_equalities.push('consumption.terminal_result_schema_sha256_equals_the_current_canonical_selected_result_schema_digest')
r22.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.selected_result_schema_sha256_ref = 'operation_result_schema_derivation.discriminated_results.use_release.variants.pending_delivery.canonical_schema_sha256'

r22.schema_change_manifest = {
  derivation: 'bounded_exact_extension_from_frozen_R21_to_R22_server_principal_store_authority_receipt_read_set_typed_hold_projection_exact_replay_and_digest_bound_result_schemas',
  changes: [
    '$', '$.server_presented_principal_projection_schema', '$.server_presented_principal_projection_derivation', '$.case_session_root_trust_anchor_schema', '$.case_session_authority_store_controls', '$.case_session_authority_read_set_schema', '$.case_authority_control_receipt_authority_audit', '$.case_authority_control_hold_dependency_projection_map', '$.operation_result_schema_derivation', '$.response_union.schemas.replayed_committed',
  ],
  every_changed_or_new_schema_must_have_r22_version: true,
  dependency_parity_checks: [
    'server_presented_principal_exactly_joins_human_session_selected_session_evidence_request_and_current_case_workspace',
    'all_five_authority_stores_have_one_writer_root_anchored_issuance_transitions_and_same_snapshot_revocation_CAS',
    'case_control_receipt_persists_and_fingerprints_the_complete_authority_read_set',
    'hold_dependency_projection_map_binds_source_schema_scalar_type_availability_and_exact_canonical_encoding',
    'replayed_committed_and_replayed_held_are_exact_schema_validated_historical_projections',
    'use_release_union_and_variant_identities_bind_exact_schema_refs_and_canonical_schema_digests',
  ],
}
r22.required_negative_fixture_families = [...new Set([...r22.required_negative_fixture_families,
  'server_presented_principal_cross_workspace_or_session_hash_substitution', 'authority_store_self_appointment_or_direct_DML',
  'authority_read_set_omission_or_concurrent_revocation', 'hold_dependency_raw_vs_identifier_encoding',
  'replay_field_substitution', 'same_version_result_schema_semantic_mutation',
])]
r22.visible_surface_changes = []
r22.external_actions_authorized = []
r22.closed_actions = [...new Set([...(r22.closed_actions ?? []), 'adapter_implementation', 'database_change', 'runtime_connection', 'UI_change', 'deployment', 'merge', 'release', 'external_action'])]

function rejectUndefined(value, path = '$') {
  if (value === undefined) throw new Error(`undefined_value:${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`)
}
rejectUndefined(r22)
export const materializedR22 = r22
export const materializedR22Output = `${JSON.stringify(r22, null, 2)}\n`

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR22Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    const current = readFileSync(join(root, outputPath), 'utf8')
    if (current !== materializedR22Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) }
    console.log(`ok: ${outputPath} is the exact fully materialized R22 effective contract`)
  } else throw new Error(`unsupported mode: ${mode}`)
}
