import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR22 } from './materialize-ctrl-g24-trusted-ingress-r22.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r22.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r23.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r23 = structuredClone(materializedR22)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }, fp = { type: 'sha256' }, ts = { type: 'canonical_timestamp' }, b64 = { type: 'base64url_without_padding' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(k => !optional.includes(k)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value) { schema.properties[key] = value; if (!schema.exact_keys.includes(key)) schema.exact_keys.push(key); if (!(schema.optional ?? []).includes(key) && !schema.required.includes(key)) schema.required.push(key) }
function fingerprint(domain, fields) { return { domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function codepointCompare(a, b) { const aa = [...a], bb = [...b]; for (let i = 0; i < Math.min(aa.length, bb.length); i += 1) { const d = aa[i].codePointAt(0) - bb[i].codePointAt(0); if (d) return d } return aa.length - bb.length }
function canonicalJson(value) { if (value === null) return 'null'; if (value === true) return 'true'; if (value === false) return 'false'; if (typeof value === 'string') return JSON.stringify(value); if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`; if (value && typeof value === 'object') return `{${Object.keys(value).sort(codepointCompare).map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`; throw new Error('noncanonical_json_value') }
const schemaDigest = schema => sha(Buffer.from(canonicalJson(schema), 'utf8'))

r23.schema_version = 'ctrl.g24.trusted-ingress.r23.effective.v1'
r23.status = 'twenty_second_repair_candidate_under_independent_review'
r23.supersedes = { commit: '68f4795c587554560d82ada219f3f50a8fedcc6c', tree: '96d562563a44715049f9b982501ed450db29ecfc', human_blob: '4a15b50c36e01fea1269bd534642c49200378072', machine_blob: '0a15525c30fafbb835fa9fb6c5097895edcfecb4', qa_blob: 'c7fce751c05ed6ea8e6ba5d4eb87f31efb2452f5', checker_blob: '5c9561c64df2fcd2372db2656152e442d0680b57', materializer_blob: '19609212270125e830d605cb2530a32bbc48cfd7', founder_checker_blob: 'ce1d8d63a62af21c4e311b7a068a14fa4284a2aa', adjudication: 'veto' }
r23.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r23.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

r23.canonical_schema_serialization = { schema_version: 'ctrl.g24.canonical-schema-serialization.r23.v1', encoding: 'UTF-8', object_keys: 'ascending_Unicode_code_point_sequence', object_rule: 'left_brace_then_sorted_JSON_string_key_colon_canonical_value_comma_join_then_right_brace', array_rule: 'preserve_declared_order_and_comma_join_canonical_values_inside_brackets', string_rule: 'RFC8259_JSON_string_with_shortest_required_escapes_and_no_normalization', number_rule: 'finite_JSON_number_only_negative_zero_serializes_as_zero', literals: { null: 'null', true: 'true', false: 'false' }, whitespace: 'none', duplicate_keys_nonfinite_undefined_or_surrogate_error: 'reject', digest: 'sha256_of_exact_canonical_UTF8_bytes' }

// Externally pinned singleton root authority and complete bootstrap/rotation grammar.
r23.authoritative_row_schemas.case_session_root_trust_anchors = closed('ctrl.g24.authoritative-row.case-session-root-trust-anchors.r23.v1', {
  root_partition: { const: 'case_session_root' }, trust_anchor_ref: id, trust_anchor_version_ref: id, trust_anchor_artifact_sha256: fp,
  deployment_configuration_ref: id, deployment_configuration_sha256: fp, standing: { type: 'enum', values: ['active', 'revoked'] },
  prior_anchor_version_ref: { type: 'nullable', value_schema: id }, prior_anchor_fingerprint: { type: 'nullable', value_schema: fp },
  valid_from: ts, valid_until: ts, row_version_ref: id, anchor_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['root_partition', 'row_version_ref']], partition_key: ['root_partition'], current_selection: 'maximum_valid_from_then_unsigned_utf8_row_version_ref_where_standing_active_and_deployment_configuration_digest_equals_the_pinned_runtime_configuration', current_selection_unique_or_hold: true, unique_current_constraint: 'exactly_one_active_row_per_root_partition_and_pinned_deployment_configuration_or_hold', fingerprint_ref: 'fingerprint_schemas.case_session_root_trust_anchor', fingerprint_field: 'anchor_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r23.fingerprint_schemas.case_session_root_trust_anchor = fingerprint('CTRL-G24-CASE-SESSION-ROOT-TRUST-ANCHOR-R23', Object.keys(r23.authoritative_row_schemas.case_session_root_trust_anchors.properties).filter(k => k !== 'anchor_fingerprint'))
r23.deployment_trust_configuration_schema = closed('ctrl.g24.deployment-trust-configuration.r23.v1', {
  configuration_ref: id, configuration_sha256: fp, root_partition: { const: 'case_session_root' }, pinned_root_anchor_ref: id,
  pinned_root_anchor_version_ref: id, pinned_root_anchor_artifact_sha256: fp, pinned_runtime_attestor_ref: id,
  pinned_runtime_attestor_version: id, pinned_runtime_attestor_artifact_sha256: fp,
}, { caller_controlled_fields: [], source: 'immutable_deployment_trust_configuration_outside_the_authority_stores' })
r23.case_session_root_trust_anchor_authority = {
  schema_version: 'ctrl.g24.case-session-root-trust-anchor-authority.r23.v1', row_schema_ref: 'authoritative_row_schemas.case_session_root_trust_anchors',
  externally_pinned_identity: 'deployment_trust_configuration.root_partition_trust_anchor_ref_version_and_artifact_sha256', caller_controlled: false,
  sole_writer_role: 'ctrl_offline_root_anchor_ceremony_writer', direct_dml_by_runtime_application_browser_edge_worker_service_or_caller: 'forbidden',
  bootstrap_proof: 'two_person_offline_ceremony_signature_over_exact_request_and_target_row_canonical_bytes',
  rotation: 'closed_rotate_root_anchor_operation_with_expected_current_ref_version_fingerprint_idempotency_and_serializable_CAS',
  rollback_safety: 'append_new_active_and_append_prior_revoked_transition_in_one_transaction_or_no_change', self_authentication: 'forbidden',
}
delete r23.case_session_root_trust_anchor_schema
delete r23.case_session_authority_operations
delete r23.case_session_authority_operation_schema

const stores = ['case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const transitions = {
  case_session_issuer_registry: ['issue_case_session_issuer', 'revoke_case_session_issuer'],
  case_session_evaluator_registry: ['issue_case_session_evaluator', 'revoke_case_session_evaluator'],
  account_stable_actor_bindings: ['issue_account_actor_binding', 'rotate_account_actor_binding', 'offboard_account_actor_binding'],
  account_access_standings: ['issue_account_access_standing', 'revoke_account_access', 'offboard_account_access', 'restore_account_access'],
  case_server_session_principal_evidence: ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal'],
}
const standingValues = { case_session_issuer_registry: ['active', 'revoked'], case_session_evaluator_registry: ['active', 'revoked'], account_stable_actor_bindings: ['active', 'offboarded'], account_access_standings: ['active', 'revoked', 'offboarded'], case_server_session_principal_evidence: ['active', 'revoked', 'expired'] }
for (const store of stores) {
  const row = r23.authoritative_row_schemas[store]
  row.schema_version = row.schema_version.replace(/\.r\d+\./, '.r23.')
  if (store !== 'account_access_standings' && store !== 'case_server_session_principal_evidence') add(row, 'standing', { type: 'enum', values: standingValues[store] })
  if (store === 'case_server_session_principal_evidence') row.properties.session_standing.values = standingValues[store]
  row.current_row_requires_standing = 'active'
  row.standing_field = store === 'case_server_session_principal_evidence' ? 'session_standing' : 'standing'
  row.current_selection = `${row.current_selection}_and_standing_active`
  row.transition_table_ref = `case_session_authority_transition_tables.${store}`
  const fname = row.fingerprint_ref.split('.').at(-1)
  r23.fingerprint_schemas[fname] = fingerprint(`CTRL-G24-${fname.replaceAll('_', '-').toUpperCase()}-R23`, Object.keys(row.properties).filter(k => k !== row.fingerprint_field))
}
r23.case_session_authority_transition_tables = { schema_version: 'ctrl.g24.case-session-authority-transition-tables.r23.v1' }
r23.case_session_authority_transition_tables.case_session_root_trust_anchors = {
  standing_field: 'standing', standing_values: ['active', 'revoked'], first_matching_operation_only: true,
  prior_active_row_is_noncurrent_immediately_after_successful_transition: true,
  rows: [
    { operation_name: 'bootstrap_case_session_root_anchor', from: 'absent', to: 'active', prior_active_row_becomes_current: false, append_only: true },
    { operation_name: 'rotate_case_session_root_anchor', from: 'active', to: 'active_and_prior_revoked_atomically', prior_active_row_becomes_current: false, append_only: true },
  ],
}
for (const store of stores) {
  const values = standingValues[store]
  const rows = transitions[store].map(name => ({ operation_name: name, from: name.startsWith('issue_') ? 'absent' : name.startsWith('restore_') ? values.filter(v => v !== 'active') : 'active', to: name.startsWith('issue_') || name.startsWith('restore_') || name.startsWith('rotate_') ? 'active' : name.includes('offboard') ? 'offboarded' : name.includes('expire') ? 'expired' : 'revoked', prior_active_row_becomes_current: false, append_only: true }))
  r23.case_session_authority_transition_tables[store] = { standing_field: store === 'case_server_session_principal_evidence' ? 'session_standing' : 'standing', standing_values: values, first_matching_operation_only: true, prior_active_row_is_noncurrent_immediately_after_successful_transition: true, rows }
}

const opNames = ['bootstrap_case_session_root_anchor', 'rotate_case_session_root_anchor', ...stores.flatMap(s => transitions[s])]
const opSchemas = {}
for (const name of opNames) {
  const slug = name.replaceAll('_', '-')
  const targetStore = name.includes('root_anchor') ? 'case_session_root_trust_anchors' : stores.find(s => transitions[s].includes(name))
  const capability = name.includes('root_anchor') ? 'offline_root_ceremony_proof' : ['case_session_issuer_registry', 'case_session_evaluator_registry'].includes(targetStore) ? 'current_root_anchor_proof' : 'current_trusted_issuer_or_evaluator_capability'
  const request = closed(`ctrl.g24.authority-operation-${slug}-request.r23.v1`, { operation_name: { const: name }, operation_id: id, idempotency_key: fp, authenticated_capability_or_root_proof: b64, target_store: { const: targetStore }, target_row_canonical_b64url: b64, target_row_fingerprint: fp, expected_prior_row_version_ref: { type: 'nullable', value_schema: id }, expected_prior_row_fingerprint: { type: 'nullable', value_schema: fp } })
  const resultVariants = {}
  for (const branch of ['committed', 'replayed', 'collision_hold', 'authority_hold', 'cas_hold']) resultVariants[branch] = closed(`ctrl.g24.authority-operation-${slug}-result-${branch.replaceAll('_', '-')}.r23.v1`, { operation_name: { const: name }, operation_id: id, branch: { const: branch }, target_row_version_ref: { type: 'nullable', value_schema: id }, target_row_fingerprint: { type: 'nullable', value_schema: fp }, committed_at: { type: 'nullable', value_schema: ts } })
  const result = { schema_version: `ctrl.g24.authority-operation-${slug}-result-union.r23.v1`, discriminator: 'branch', variants: resultVariants }
  const receipt = closed(`ctrl.g24.authority-operation-${slug}-receipt.r23.v1`, { operation_name: { const: name }, operation_id: id, idempotency_key: fp, request_fingerprint: fp, target_store: { const: targetStore }, target_row_version_ref: id, target_row_fingerprint: fp, prior_row_version_ref: { type: 'nullable', value_schema: id }, prior_row_fingerprint: { type: 'nullable', value_schema: fp }, server_committed_at: ts, receipt_fingerprint: fp })
  opSchemas[name] = { request_schema: request, result_schema: result, receipt_schema: receipt, request_fingerprint: fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-REQUEST-R23`, Object.keys(request.properties)), receipt_fingerprint: fingerprint(`CTRL-G24-${name.toUpperCase().replaceAll('_', '-')}-RECEIPT-R23`, Object.keys(receipt.properties).filter(k => k !== 'receipt_fingerprint')), replay: 'same_operation_id_and_request_fingerprint_returns_exact_committed_result_without_write', collision: 'same_operation_id_and_different_request_fingerprint_returns_collision_hold_without_disclosure_or_write', atomic_postcondition: 'target_transition_and_receipt_commit_together_or_neither_exists', capability_source: capability }
}
r23.case_session_authority_operation_protocols = { schema_version: 'ctrl.g24.case-session-authority-operation-protocols.r23.v1', exact_operation_names: opNames, operations: opSchemas, distinctness: 'every_operation_has_distinct_name_constants_schema_versions_and_fingerprint_domains_and_no_two_request_or_receipt_schemas_are_byte_identical', server_time: 'server_database_transaction_timestamp_only', idempotency_scope: ['target_store', 'operation_id'], concurrent_first_use: 'one_serializable_winner_then_exact_replay_or_collision' }

// Independent live auth assertion joins durable evidence and the presented projection.
r23.live_principal_assertion_schema = closed('ctrl.g24.live-principal-assertion.r23.v1', {
  attestation_ref: id, server_auth_boundary_ref: id, runtime_attestor_version: id, runtime_attestor_artifact_sha256: fp,
  session_ref: id, session_instance_hash: fp, workspace_ref: id, account_ref: id, stable_actor_ref: id,
  principal_kind: { const: 'human_session' }, actor_class: { type: 'enum', values: ['krish_operator', 'authorized_operator', 'named_leader'] }, authority_version: id,
  issued_at: ts, expires_at: ts, attestation_nonce: fp, canonical_assertion_bytes_sha256: fp, trusted_runtime_attestation_b64url: b64,
}, { caller_controlled_fields: [], source: 'independently_authenticated_server_auth_boundary', fingerprint_ref: 'fingerprint_schemas.live_principal_assertion' })
r23.live_principal_assertion_schema.fingerprint_field = 'canonical_assertion_bytes_sha256'
r23.live_principal_assertion_schema.fingerprint_field_must_equal_referenced_preimage_digest = true
r23.fingerprint_schemas.live_principal_assertion = fingerprint('CTRL-G24-LIVE-PRINCIPAL-ASSERTION-R23', Object.keys(r23.live_principal_assertion_schema.properties).filter(k => !['trusted_runtime_attestation_b64url', 'canonical_assertion_bytes_sha256'].includes(k)))
r23.live_principal_assertion_verification = { schema_version: 'ctrl.g24.live-principal-assertion-verification.r23.v1', trusted_attestor_source: 'deployment_trust_configuration.pinned_runtime_attestor_ref_version_and_artifact_sha256', derivation_from_durable_session_evidence: 'forbidden', exact_joins: ['live_and_session_evidence_session_ref_hash_workspace_account_actor_class_stable_actor_authority_version_issued_at_and_expires_at_equal_byte_for_byte', 'live_and_presented_projection_session_ref_hash_workspace_account_actor_class_stable_actor_authority_version_issued_at_and_expires_at_equal_byte_for_byte', 'live.workspace_ref_equals_request.workspace_ref_equals_current_case.workspace_ref'], signature_verification: 'verify_trusted_runtime_attestation_over_exact_canonical_assertion_bytes_before_any_durable_evidence_lookup', failure: 'hold_without_registry_disclosure_or_write' }
r23.server_presented_principal_projection_derivation.independent_live_assertion_schema_ref = 'live_principal_assertion_schema'
r23.server_presented_principal_projection_derivation.independent_live_assertion_verification_ref = 'live_principal_assertion_verification'

// Restart-complete receipt evidence includes composite scopes and immutable artifacts.
const readSet = r23.case_session_authority_read_set_schema
readSet.schema_version = 'ctrl.g24.case-session-authority-read-set.r23.v1'
for (const [key, value] of Object.entries({ root_partition: { const: 'case_session_root' }, workspace_ref: id, account_ref: id, session_ref: id, session_instance_hash: fp, case_ref: id, live_principal_assertion_bytes_ref: id, live_principal_assertion_bytes_sha256: fp, presented_principal_projection_bytes_ref: id, presented_principal_projection_bytes_sha256: fp })) add(readSet, key, value)
r23.fingerprint_schemas.case_session_authority_read_set = fingerprint('CTRL-G24-CASE-SESSION-AUTHORITY-READ-SET-R23', Object.keys(readSet.properties).filter(k => k !== 'snapshot_fingerprint'))
r23.case_authority_control_operation_registry.row_schema.schema_version = 'ctrl.g24.case-authority-control-operation-receipt.r23.v1'
r23.case_authority_control_receipt_authority_audit.schema_version = 'ctrl.g24.case-authority-control-receipt-authority-audit.r23.v1'
r23.case_authority_control_receipt_authority_audit.content_addressed_artifacts = ['live_principal_assertion_bytes_ref_and_sha256', 'presented_principal_projection_bytes_ref_and_sha256']
r23.case_authority_control_receipt_authority_audit.restart_rule = 'resolve_exact_composite_keys_and_content_addressed_bytes_then_verify_hashes_attestation_projection_joins_current_standing_and_snapshot_CAS_or_hold_without_response_or_write'
r23.case_authority_control_receipt_authority_audit.composite_lookup_keys = [['root_partition'], ['workspace_ref', 'account_ref'], ['workspace_ref', 'session_ref'], ['workspace_ref', 'session_instance_hash'], ['workspace_ref', 'case_ref']]

// Resolvable codecs map each hold slot to a closed primitive encoder.
r23.canonical_field_codecs = {
  schema_version: 'ctrl.g24.canonical-field-codecs.r23.v1',
  identifier: { schema_version: 'ctrl.g24.codec.identifier.r23.v1', input_type: 'identifier', output_type: 'base64url_without_padding', encoder: 'UTF8_bytes_of_validated_identifier_then_base64url_without_padding', empty_or_noncanonical: 'reject' },
  sha256_raw_32_bytes: { schema_version: 'ctrl.g24.codec.sha256-raw-32-bytes.r23.v1', input_type: 'sha256_lowercase_hex', output_type: 'base64url_without_padding', encoder: 'decode_exact_64_lowercase_hex_to_32_raw_bytes_then_base64url_without_padding', identifier_or_text_bytes: 'reject' },
}
r23.canonical_field_codec_definition_schema = closed('ctrl.g24.canonical-field-codec-definition.r23.v1', {
  schema_version: id, input_type: id, output_type: { const: 'base64url_without_padding' }, encoder: id, rejection_rule: id,
})
r23.canonical_field_codecs.definition_schema_ref = 'canonical_field_codec_definition_schema'
r23.canonical_field_codecs.identifier.rejection_rule = r23.canonical_field_codecs.identifier.empty_or_noncanonical
delete r23.canonical_field_codecs.identifier.empty_or_noncanonical
r23.canonical_field_codecs.sha256_raw_32_bytes.rejection_rule = r23.canonical_field_codecs.sha256_raw_32_bytes.identifier_or_text_bytes
delete r23.canonical_field_codecs.sha256_raw_32_bytes.identifier_or_text_bytes
for (const value of Object.values(r23.case_authority_control_hold_dependency_projection_map.dependencies)) value.canonical_encoding = value.scalar_type === 'sha256' ? 'canonical_field_codecs.sha256_raw_32_bytes' : 'canonical_field_codecs.identifier'
r23.case_authority_control_hold_dependency_projection_map.codec_registry_ref = 'canonical_field_codecs'
r23.case_authority_control_hold_dependency_projection_map.every_codec_ref_must_resolve_to_closed_versioned_definition = true

// Recompute schema identities using insertion-order-independent canonical bytes.
const useRelease = r23.result_payload_schemas.use_release
const identity = (schema, ref) => ({ schema_version: schema.schema_version, schema_ref: ref, canonical_schema_serialization_ref: 'canonical_schema_serialization', canonical_schema_sha256: schemaDigest(schema) })
r23.operation_result_schema_derivation.schema_version = 'ctrl.g24.operation-result-schema-derivation.r23.v1'
r23.operation_result_schema_derivation.discriminated_results.use_release = { exported_union: identity(useRelease, 'result_payload_schemas.use_release'), discriminator: useRelease.discriminator, variants: Object.fromEntries(Object.entries(useRelease.variants).map(([n, s]) => [n, identity(s, `result_payload_schemas.use_release.variants.${n}`)])) }
r23.operation_result_schema_derivation.inventory_exact_schema_equality = 'resolve_each_schema_ref_and_hash_its_canonical_schema_serialization_independent_of_insertion_order'

for (const schema of [r23.operation_registry.committed_success_row_schema, r23.operation_result_blob_store.row_schema, r23.response_union.schemas.committed, r23.response_union.schemas.replayed_committed]) {
  schema.schema_version = schema.schema_version.replace(/\.r\d+\./, '.r23.')
}
if (!r23.fingerprint_schemas.operation_result_payload.preimage_order.includes('selected_result_schema_sha256')) r23.fingerprint_schemas.operation_result_payload.preimage_order.splice(-1, 0, 'selected_result_schema_sha256')
r23.fingerprint_schemas.operation_result_payload.domain_ascii = 'CTRL-G24-OPERATION-RESULT-PAYLOAD-R23'
r23.outbox.pending_origin_schema = closed('ctrl.g24.outbox-pending-origin.r23.v1', { workspace_ref: id, operation_id: id, operation_class: { const: 'use_release' }, successful_result_branch: { const: 'pending_delivery' }, terminal_consumption_ref: id, selected_result_schema_version: id, selected_result_schema_sha256: fp, universal_result_payload_fingerprint: fp, outbox_effect_ref: id, origin_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.outbox_pending_origin', fingerprint_field: 'origin_fingerprint' })
r23.fingerprint_schemas.outbox_pending_origin = fingerprint('CTRL-G24-OUTBOX-PENDING-ORIGIN-R23', Object.keys(r23.outbox.pending_origin_schema.properties).filter(k => k !== 'origin_fingerprint'))
r23.outbox.genesis_protocol.pending_origin_schema_ref = 'outbox.pending_origin_schema'
r23.outbox.genesis_protocol.exact_equalities.push('pending_origin.selected_result_schema_sha256_equals_committed_success.selected_result_schema_sha256_equals_result_blob.selected_result_schema_sha256_equals_the_immutable_schema_digest_selected_at_commit')
r23.outbox.genesis_protocol.exact_equalities.push('pending_origin.universal_result_payload_fingerprint_equals_committed_success.result_payload_fingerprint_equals_recomputed_operation_result_payload_fingerprint_including_selected_result_schema_sha256')
r23.outbox.genesis_protocol.restart_rule = 'rehydrate_pending_origin_and_committed_success_by_exact_refs_then_verify_selected_schema_digest_and_universal_result_fingerprint_before_dispatch'
r23.operation_registry.replayed_held_derivation.exact_historical_equalities[0] = 'replay.operation_id_equals_held.operation_id_equals_hold_row.operation_id_equals_hold_blob.operation_id'

r23.schema_change_manifest = { derivation: 'bounded_exact_extension_from_frozen_R22_to_R23_externally_anchored_root_distinct_authority_protocols_independent_live_attestation_restart_complete_receipts_resolvable_codecs_canonical_schema_serialization_and_complete_result_digest_lineage', changes: ['$', '$.authoritative_row_schemas.case_session_root_trust_anchors', '$.case_session_authority_operation_protocols', '$.live_principal_assertion_schema', '$.case_session_authority_read_set_schema', '$.canonical_field_codecs', '$.canonical_schema_serialization', '$.operation_result_schema_derivation', '$.outbox.pending_origin_schema'], every_changed_or_new_schema_must_have_r23_version: true, dependency_parity_checks: ['root_anchor_is_external_singleton_with_bootstrap_and_rotation_proof', 'every_authority_operation_has_distinct_closed_request_result_receipt_and_transition_standing', 'live_principal_is_independently_attested_then_byte_joined_to_durable_evidence_and_projection', 'receipt_read_set_is_restart_complete_for_all_composite_keys_and_content_artifacts', 'all_hold_codecs_resolve_and_sha256_raw_bytes_diverge_from_identifier_encoding', 'schema_digests_use_Unicode_codepoint_sorted_canonical_JSON', 'selected_result_schema_digest_is_in_universal_result_success_release_and_outbox_authority'] }
r23.required_negative_fixture_families = [...new Set([...r23.required_negative_fixture_families, 'root_anchor_self_authentication_or_ambiguous_current', 'authority_operation_schema_alias_or_missing_standing', 'circular_live_principal_derivation', 'receipt_scope_or_content_artifact_omission', 'unresolved_or_substituted_hold_codec', 'insertion_order_schema_digest_drift', 'same_version_schema_semantic_change', 'held_replay_operation_substitution', 'pending_outbox_schema_digest_omission'])]
r23.visible_surface_changes = []; r23.external_actions_authorized = []
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((v, i) => rejectUndefined(v, `${path}[${i}]`)); else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) rejectUndefined(v, `${path}.${k}`) }
rejectUndefined(r23)
export const materializedR23 = r23
export const materializedR23Output = `${JSON.stringify(r23, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR23Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR23Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R23 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
