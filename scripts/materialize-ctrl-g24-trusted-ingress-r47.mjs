import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR46, materializedR46Output, r46SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r46.mjs'
import { canonicalR44, ownedSnapshotR44, materializedR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r46.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r47.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const r47 = structuredClone(materializedR46)
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (path, variant = 'UNAVAILABLE') => { const schema = get(r47, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const closed = (schemaVersion, properties, extra = {}) => ({ schema_version: schemaVersion, type: 'object', exact_keys: Object.keys(properties), required: Object.keys(properties), additional_properties: false, properties, ...extra })
const id = { type: 'identifier' }, fp = { type: 'sha256' }

function fingerprint(schema, row) {
  const rule = get(r47, schema.fingerprint_ref)
  if (!rule?.preimage_order) throw new Error(`fingerprint_schema:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]
  return { schema_ref: schema.fingerprint_ref, preimage, value: hash(preimage) }
}

function payloadFingerprint(role, artifact, payload) {
  if (artifact.fixture_wrapper_variant !== 'content_addressed') return fingerprint(schemaAt(artifact.schema_ref, artifact.schema_variant), payload)
  if (artifact.payload_schema_ref === 'opaque_bounded_bytes' || artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema') {
    const schema = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? r47.authority_opaque_raw_input_stores[artifact.payload_schema_variant].row_schema : r47.proof_nonce_ledger.row_schema
    return fingerprint(schema, artifact.stored_row_value)
  }
  const schema = schemaAt(artifact.payload_schema_ref, artifact.payload_schema_variant)
  if (schema.fingerprint_field) return fingerprint(schema, payload)
  if (role === 'result') {
    const rule = r47.case_session_authority_operation_protocols.operations[payload.operation_name].result_fingerprint
    const body = {}
    for (const field of schema.exact_keys) if (field !== 'result_fingerprint') body[field] = payload[field]
    const preimage = { domain_ascii: rule.domain_ascii, operation_name: payload.operation_name, operation_id: payload.operation_id, branch: payload.branch, branch_specific_canonical_payload_sha256: hash(body) }
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.result_fingerprint`, preimage, value: hash(preimage) }
  }
  if (role === 'request') {
    const rule = r47.case_session_authority_operation_protocols.operations[payload.operation_name].request_fingerprint
    const preimage = {}
    for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : payload[field]
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.request_fingerprint`, preimage, value: hash(preimage) }
  }
  const bytes = canonicalR44(payload)
  const preimage = { domain_ascii: 'CTRL-G24-R44-PARSED-CONTENT', schema_ref: artifact.payload_schema_ref, canonical_bytes_sha256: sha(Buffer.from(bytes, 'utf8')) }
  return { schema_ref: 'authority_operation_fixture_payload_fingerprint_authority.generic_content', preimage, value: hash(preimage) }
}

function findSchemaVersion(version) {
  const found = []
  const walk = value => { if (!value || typeof value !== 'object') return; if (value.schema_version === version && value.type === 'object' && value.properties) found.push(value); for (const child of Object.values(value)) walk(child) }
  walk(r47)
  const unique = [...new Set(found)]
  if (unique.length !== 1) throw new Error(`wrapper_schema_version:${version}:${unique.length}`)
  return unique[0]
}

function resealContent(role, artifact, payload) {
  const next = structuredClone(artifact)
  const schema = schemaAt(next.payload_schema_ref, next.payload_schema_variant)
  const derived = payloadFingerprint(role, next, payload)
  if (schema?.fingerprint_field) payload[schema.fingerprint_field] = derived.value
  if (role === 'result') payload.result_fingerprint = derived.value
  const bytes = canonicalR44(payload), bytesHash = sha(Buffer.from(bytes, 'utf8'))
  Object.assign(next, { artifact_role: role, payload_value: payload, payload_canonical_bytes_utf8: bytes, payload_bytes_sha256: bytesHash, payload_fingerprint: derived.value, ref: bytesHash, bytes_sha256: bytesHash, fingerprint: derived.value, declared_payload_fingerprint_schema_ref: derived.schema_ref, declared_payload_fingerprint_preimage: derived.preimage })
  const rowSchema = findSchemaVersion(next.selected_wrapper_schema_version), row = structuredClone(next.stored_row_value)
  if (next.payload_schema_ref === 'proof_nonce_receipt_payload_schema') row.nonce_receipt_ref = bytesHash
  else {
    row.artifact_ref = bytesHash
    if (Object.hasOwn(row, 'canonical_bytes_b64url')) row.canonical_bytes_b64url = Buffer.from(bytes, 'utf8').toString('base64url')
    if (Object.hasOwn(row, 'canonical_bytes_length')) row.canonical_bytes_length = Buffer.byteLength(bytes)
    if (Object.hasOwn(row, 'canonical_bytes_sha256')) row.canonical_bytes_sha256 = bytesHash
    if (Object.hasOwn(row, 'opaque_bytes_sha256')) row.opaque_bytes_sha256 = bytesHash
    if (Object.hasOwn(row, 'parsed_content_fingerprint')) row.parsed_content_fingerprint = derived.value
  }
  const wrapperFingerprint = fingerprint(rowSchema, row)
  row[rowSchema.fingerprint_field] = wrapperFingerprint.value
  Object.assign(next, { stored_row_value: row, stored_row_canonical_bytes_sha256: hash(row), stored_row_fingerprint: wrapperFingerprint.value, declared_wrapper_fingerprint_schema_ref: wrapperFingerprint.schema_ref, declared_wrapper_fingerprint_preimage: wrapperFingerprint.preimage, content_address_rule_verified: true })
  return next
}

function authorityArtifact(fixtureId, role, schemaRef, variant, row, normativePreimage, wrapperVariant = role === 'receipt' ? 'receipt_row' : 'authoritative_row') {
  const schema = schemaAt(schemaRef, variant), derived = fingerprint(schema, row)
  row[schema.fingerprint_field] = derived.value
  const bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8'))
  return { fixture_artifact_id: `${fixtureId}:${role}`, schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, normative_row_ref_preimage: normativePreimage, canonical_row_value: row, canonical_row_bytes_utf8: bytes, canonical_row_bytes_sha256: bytesHash, content_addressed_artifact_ref: bytesHash, fingerprint_schema_ref: derived.schema_ref, fingerprint_preimage: derived.preimage, recorded_fingerprint: derived.value, artifact_role: role, fixture_wrapper_variant: wrapperVariant, declared_payload_fingerprint_schema_ref: derived.schema_ref, declared_payload_fingerprint_preimage: derived.preimage }
}

r47.schema_version = 'ctrl.g24.trusted-ingress.r47.effective.v1'
r47.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r46_vetoed', 'trusted_ingress_r47_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r47.supersedes = { commit: '91053dd1997095e8eb6c92d2031dc03ec7c6684d', tree: '485ddeb67b294e067e6e7dcf777a2902ec4902e9', human_blob: '478207b9c0ace7ea8ed2d8ed5e17b4587b5baf8e', machine_blob: '2197201345d2c15f6f4e656e08e813f25e8d9066', qa_blob: 'a2442abb0afac03fe9af503123e6a1baf19e7365', checker_blob: 'ccba23667acdeed492d7ff4315cdbd6a0f5370c2', materializer_blob: 'e011a65b1ad088b5049133c9c437c43c7c16cb83', founder_checker_blob: '708c76223eb31e7f55aecfa2ed5f930934a1a272', adjudication: 'veto' }
r47.materialization = { ...r47.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r47.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, final_semantic_snapshot_before_registry: 'required', post_snapshot_source_mutation: 'forbidden' }

// Reissue the committed fixture under the sole R47 target and receipt identity formulas.
const fixture = r47.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed')
const old = fixture.artifact_store_by_role, at = old.result.payload_value.committed_at, validUntil = old.target_intent.payload_value.valid_until
const targetIntent = structuredClone(old.target_intent)
const proof = structuredClone(old.proof)
const request = structuredClone(old.request)
const targetProjectionFields = [...schemaAt(targetIntent.payload_schema_ref, targetIntent.payload_schema_variant).exact_keys]
const targetRowWithoutIdentity = { ...targetIntent.payload_value, valid_from: at, authority_order: 1 }
const rowVersionPreimage = { domain_ascii: 'CTRL-G24-R47-COMMITTED-TARGET-ROW-VERSION', schema_version: 'ctrl.g24.committed-target-row-version.r47.v1', ordered_complete_mutable_authority_fields: [...Object.keys(targetRowWithoutIdentity)].sort(cp).map(field => ({ field, value: targetRowWithoutIdentity[field] })) }
const rowVersionRef = hash(rowVersionPreimage)
const targetRowValue = { ...targetRowWithoutIdentity, row_version_ref: rowVersionRef, anchor_fingerprint: '0'.repeat(64) }
const committedTarget = authorityArtifact(fixture.fixture_id, 'committed_target_row', 'authoritative_row_schemas.case_session_root_trust_anchors', 'UNAVAILABLE', targetRowValue, rowVersionPreimage)

const receiptSchema = schemaAt('authority_operation_receipt_store.row_union', 'ordinary_single_proof_committed')
const receiptBase = { ...old.receipt.canonical_row_value, target_row_bytes_ref: committedTarget.content_addressed_artifact_ref, target_row_bytes_sha256: committedTarget.canonical_row_bytes_sha256, target_row_fingerprint: committedTarget.recorded_fingerprint, result_bytes_ref: '0'.repeat(64), result_bytes_sha256: '0'.repeat(64), result_fingerprint: '0'.repeat(64), receipt_fingerprint: '0'.repeat(64) }
const receiptRefPreimage = { domain_ascii: 'CTRL-G24-R47-AUTHORITY-OPERATION-RECEIPT-REF', schema_version: receiptSchema.schema_version, ordered_fields: receiptSchema.receipt_ref_preimage_fields.map(field => ({ field, value: receiptBase[field] })) }
const receiptRef = hash(receiptRefPreimage)
const receiptPrecommitRule = get(r47, receiptSchema.receipt_precommit_fingerprint_ref), receiptPrecommitPreimage = {}
for (const field of receiptPrecommitRule.preimage_order) receiptPrecommitPreimage[field] = field === 'domain_ascii' ? receiptPrecommitRule.domain_ascii : field === 'receipt_ref' ? receiptRef : receiptBase[field]
const receiptPrecommitFingerprint = hash(receiptPrecommitPreimage)
const result = resealContent('result', old.result, { ...old.result.payload_value, target_row_version_ref: rowVersionRef, target_row_fingerprint: committedTarget.recorded_fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: receiptPrecommitFingerprint })
const receipt = authorityArtifact(fixture.fixture_id, 'receipt', 'authority_operation_receipt_store.row_union', 'ordinary_single_proof_committed', { ...receiptBase, receipt_ref: receiptRef, receipt_precommit_fingerprint: receiptPrecommitFingerprint, result_bytes_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_fingerprint: '0'.repeat(64) }, receiptRefPreimage)
const history = resealContent('history', old.history, { ...old.history.payload_value, response_payload_ref: result.ref, response_payload_bytes_sha256: result.bytes_sha256, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint })
const registrySchema = schemaAt(old.registry.schema_ref, old.registry.schema_variant)
let registryRow = { ...old.registry.canonical_row_value, committed_target_row_ref: rowVersionRef, committed_target_row_bytes_sha256: committedTarget.canonical_row_bytes_sha256, committed_target_row_fingerprint: committedTarget.recorded_fingerprint, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: receiptPrecommitFingerprint, receipt_fingerprint: receipt.recorded_fingerprint, historical_response_ref: history.ref, historical_response_bytes_sha256: history.bytes_sha256, historical_response_fingerprint: history.fingerprint }
const registryPreimage = { domain_ascii: registrySchema.row_ref_domain_ascii, schema_version: registrySchema.row_ref_schema_version, ordered_fields: registrySchema.row_ref_preimage_included_fields.map(field => ({ field, value: registryRow[field] })) }
registryRow.registry_row_ref = hash(registryPreimage)
const registry = authorityArtifact(fixture.fixture_id, 'registry', old.registry.schema_ref, old.registry.schema_variant, registryRow, registryPreimage, 'registry_row')
const replayPayload = resealContent('replay_payload', old.replay_payload, { ...old.replay_payload.payload_value, historical_result_ref: result.ref, historical_result_bytes_sha256: result.bytes_sha256, historical_result_fingerprint: result.fingerprint, stored_historical_response_ref: history.ref, stored_historical_response_bytes_sha256: history.bytes_sha256, stored_historical_response_fingerprint: history.fingerprint, committed_registry_row_ref: registryRow.registry_row_ref, committed_registry_row_fingerprint: registry.recorded_fingerprint })
const replayEnvelope = resealContent('replay_envelope', old.replay_envelope, { ...old.replay_envelope.payload_value, payload_ref: replayPayload.ref, payload_bytes_sha256: replayPayload.bytes_sha256, payload_fingerprint: replayPayload.fingerprint, replay_response_ref: history.ref, replay_response_bytes_sha256: history.bytes_sha256, replay_response_fingerprint: history.fingerprint })
fixture.artifact_store_by_role = { target_intent: targetIntent, committed_target_row: committedTarget, proof, proof_nonce_receipt: old.proof_nonce_receipt, request, result, receipt, history, registry, replay_payload: replayPayload, replay_envelope: replayEnvelope }
fixture.exact_required_roles = Object.keys(fixture.artifact_store_by_role)
fixture.artifact_view_role_refs = Object.fromEntries(fixture.exact_required_roles.map(role => [role, role]))
fixture.request_fingerprint = request.fingerprint

r47.authority_operation_committed_target_identity_authority = {
  schema_version: 'ctrl.g24.authority-operation-committed-target-identity-authority.r47.v1',
  active_normative_authority: true,
  sole_active_identity_kinds: ['committed_target_row_version_ref', 'committed_target_row_content_address', 'committed_target_anchor_fingerprint'],
  target_intent_role: 'target_intent',
  committed_target_row_role: 'committed_target_row',
  row_version_identity_kind: 'row_version_ref',
  row_version_ref_preimage_schema: { domain_ascii: rowVersionPreimage.domain_ascii, schema_version: rowVersionPreimage.schema_version, exact_keys: ['domain_ascii', 'schema_version', 'ordered_complete_mutable_authority_fields'], complete_mutable_fields: Object.keys(targetRowWithoutIdentity).sort(cp), excluded_cycle_fields: ['row_version_ref', 'anchor_fingerprint'] },
  content_address_identity_kind: 'canonical_row_bytes_sha256',
  content_address_codec: 'sha256_of_canonical_committed_row_bytes_utf8_after_row_version_and_fingerprint',
  fingerprint_identity_kind: 'anchor_fingerprint',
  fingerprint_schema_ref: schemaAt('authoritative_row_schemas.case_session_root_trust_anchors').fingerprint_ref,
  fixture_parity_row_version_ref: rowVersionRef,
  fixture_parity_content_address: committedTarget.content_addressed_artifact_ref,
  fixture_parity_fingerprint: committedTarget.recorded_fingerprint,
  same_hash_for_intent_row_and_row_version: 'forbidden',
}
r47.authority_operation_receipt_materialization_authority = {
  schema_version: 'ctrl.g24.authority-operation-receipt-materialization-authority.r47.v1',
  active_normative_authority: true,
  sole_active_identity_kinds: ['receipt_ref', 'receipt_precommit_fingerprint', 'receipt_final_fingerprint'],
  receipt_variant: 'ordinary_single_proof_committed',
  receipt_ref_preimage_schema: { domain_ascii: receiptRefPreimage.domain_ascii, schema_version: receiptSchema.schema_version, exact_keys: ['domain_ascii', 'schema_version', 'ordered_fields'], ordered_fields: receiptSchema.receipt_ref_preimage_fields },
  receipt_precommit_fingerprint_schema_ref: receiptSchema.receipt_precommit_fingerprint_ref,
  receipt_final_fingerprint_schema_ref: receiptSchema.fingerprint_ref,
  fixture_parity_receipt_ref: receiptRef,
  fixture_parity_precommit_fingerprint: receiptPrecommitFingerprint,
  fixture_parity_final_fingerprint: receipt.recorded_fingerprint,
  issuance_order: ['target_intent', 'committed_target_row', 'proof', 'proof_nonce_receipt', 'receipt_ref_preimage', 'receipt_precommit_fingerprint', 'result', 'history', 'final_receipt_fingerprint', 'registry', 'replay_payload', 'replay_envelope'],
  seeded_identity: 'forbidden',
}
r47.authority_operation_artifact_fingerprint_derivation_authority = {
  ...r47.authority_operation_artifact_fingerprint_derivation_authority,
  schema_version: 'ctrl.g24.authority-operation-artifact-fingerprint-derivation-authority.r47.v1',
  active_normative_authority: true,
  sole_active_identity_index: [
    { identity_kind: 'canonical_payload_content_address', authority_path: 'authority_operation_artifact_fingerprint_derivation_authority', exact_codec_or_schema_ref: 'canonical_json_utf8_encoding', exact_domain_or_literal: 'sha256_canonical_payload_bytes_utf8' },
    { identity_kind: 'payload_fingerprint', authority_path: 'authority_operation_artifact_fingerprint_derivation_authority', exact_codec_or_schema_ref: 'selected_payload_schema_fingerprint_ref_or_operation_result_rule', exact_domain_or_literal: 'selected_schema_domain' },
    { identity_kind: 'persisted_wrapper_fingerprint', authority_path: 'authority_operation_artifact_fingerprint_derivation_authority', exact_codec_or_schema_ref: 'selected_wrapper_schema_fingerprint_ref', exact_domain_or_literal: 'selected_schema_domain' },
    { identity_kind: 'registry_row_ref', authority_path: 'authority_operation_registry.row_union', exact_codec_or_schema_ref: 'selected_registry_variant_row_ref_preimage', exact_domain_or_literal: 'selected_registry_variant_row_ref_domain_ascii' },
    { identity_kind: 'hold_row_ref', authority_path: 'authority_operation_hold_store.row_union', exact_codec_or_schema_ref: 'selected_hold_variant_row_ref_preimage', exact_domain_or_literal: 'selected_hold_variant_row_ref_domain_ascii' },
    { identity_kind: 'nonce_receipt_ref', authority_path: 'proof_nonce_ledger.row_schema', exact_codec_or_schema_ref: 'canonical_json_utf8_encoding', exact_domain_or_literal: 'sha256_canonical_nonce_payload_bytes_utf8' },
    { identity_kind: 'nonce_receipt_fingerprint', authority_path: 'proof_nonce_ledger.row_schema', exact_codec_or_schema_ref: 'proof_nonce_ledger.row_schema.fingerprint_ref', exact_domain_or_literal: 'selected_schema_domain' },
    { identity_kind: 'committed_target_row_version_ref', authority_path: 'authority_operation_committed_target_identity_authority', exact_codec_or_schema_ref: 'authority_operation_committed_target_identity_authority.row_version_ref_preimage_schema', exact_domain_or_literal: rowVersionPreimage.domain_ascii },
    { identity_kind: 'committed_target_row_content_address', authority_path: 'authority_operation_committed_target_identity_authority', exact_codec_or_schema_ref: 'canonical_json_utf8_encoding', exact_domain_or_literal: 'sha256_canonical_committed_row_bytes_utf8' },
    { identity_kind: 'committed_target_anchor_fingerprint', authority_path: 'authority_operation_committed_target_identity_authority', exact_codec_or_schema_ref: schemaAt('authoritative_row_schemas.case_session_root_trust_anchors').fingerprint_ref, exact_domain_or_literal: 'selected_schema_domain' },
    { identity_kind: 'receipt_ref', authority_path: 'authority_operation_receipt_materialization_authority', exact_codec_or_schema_ref: 'authority_operation_receipt_materialization_authority.receipt_ref_preimage_schema', exact_domain_or_literal: receiptRefPreimage.domain_ascii },
    { identity_kind: 'receipt_precommit_fingerprint', authority_path: 'authority_operation_receipt_materialization_authority', exact_codec_or_schema_ref: receiptSchema.receipt_precommit_fingerprint_ref, exact_domain_or_literal: 'selected_schema_domain' },
    { identity_kind: 'receipt_final_fingerprint', authority_path: 'authority_operation_receipt_materialization_authority', exact_codec_or_schema_ref: receiptSchema.fingerprint_ref, exact_domain_or_literal: 'selected_schema_domain' },
  ],
  duplicate_or_stale_active_identity_authority: 'reject_materialization_and_hold_without_disclosure_or_write',
}
r47.authority_operation_committed_target_projection_authority = { ...r47.authority_operation_committed_target_projection_authority, schema_version: 'ctrl.g24.authority-operation-committed-target-projection-authority.r47.v1', row_version_preimage_schema: r47.authority_operation_committed_target_identity_authority.row_version_ref_preimage_schema }

// Finalize every non-derived semantic authority before registry capture.
r47.semantic_reference_field_specification = { ...materializedR44.semantic_reference_field_specification, schema_version: 'ctrl.g24.semantic-reference-field-specification.r47.v1', source: 'independently_pinned_R44_reference_vocabulary_extended_over_the_final_immutable_R47_semantic_source_snapshot' }
const semanticAuthorityPaths = [...r46SemanticAuthorityPaths]
const excludedDerivedPaths = new Set(['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry'])
const independentlyDeclaredSourcePaths = semanticAuthorityPaths.filter(path => !excludedDerivedPaths.has(path))
const independentlyDeclaredDerivedTargetPaths = ['authority_runtime_semantic_manifest']
const independentlyDeclaredFrozenTargetPaths = [...new Set(materializedR46.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.map(row => row.exact_target_path_or_UNAVAILABLE).filter(path => path !== 'UNAVAILABLE'))].sort(cp)
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r47.v1'
r47.authority_runtime_semantic_manifest_hash_contract = { ...materializedR44.authority_runtime_semantic_manifest_hash_contract, schema_version: hashVersion, content_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R47', dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R47', graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R47', envelope_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R47' }
r47.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r47.v1', { schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r47.v1' }, type: { const: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest' }, snapshot_pipeline_ref: { const: 'owned_immutable_canonical_snapshot_pipeline' }, resource_limits_ref: { const: 'canonical_snapshot_resource_limits' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, reference_field_specification_ref: { const: 'semantic_reference_field_specification' }, reference_field_registry_ref: { const: 'authority_runtime_semantic_reference_field_registry' }, source_snapshot_sha256: fp, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, manifest_graph_sha256: fp, manifest_envelope_seal_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
r47.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r47.v1', derivation: 'bounded_exact_extension_from_frozen_R46_sole_active_persisted_identity_authorities_and_final_snapshot_semantic_registry', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.authority_operation_replay_restart_fixtures', '$.authority_operation_committed_target_identity_authority', '$.authority_operation_receipt_materialization_authority', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_committed_target_projection_authority', '$.semantic_reference_field_specification', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: [], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r47_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r47.required_negative_fixture_families = [...new Set([...r47.required_negative_fixture_families, 'sole_active_persisted_identity_authority', 'final_semantic_snapshot_registry_and_owner_graph'])]
r47.visible_surface_changes = []
r47.external_actions_authorized = []

delete r47.authority_runtime_semantic_manifest
delete r47.authority_runtime_semantic_dependency_owner_map
delete r47.authority_runtime_semantic_reference_owner_map
delete r47.authority_runtime_semantic_reference_field_registry
const semanticSourceSnapshot = ownedSnapshotR44(r47)
const semanticSourceSnapshotSha256 = hash({ domain_ascii: 'CTRL-G24-R47-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_source_paths: independentlyDeclaredSourcePaths, source_objects: Object.fromEntries(independentlyDeclaredSourcePaths.map(path => [path, get(semanticSourceSnapshot, path)])) })

const kindOf = value => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
const keysetOf = value => value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort(cp) : []
function semanticVersion(path, value) { if (value?.schema_version) return value.schema_version; const prior = materializedR46.authority_runtime_semantic_manifest.rows.find(row => row.authority_path === path); return prior?.authority_schema_version ?? 'ctrl.g24.semantic-authority.unversioned-frozen.v1' }
function manifestedOwner(path) { let selected = ''; for (const authorityPath of semanticAuthorityPaths) if ((path === authorityPath || path.startsWith(`${authorityPath}.`)) && authorityPath.length > selected.length) selected = authorityPath; return selected }
const aliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
const derivedVersions = { authority_runtime_semantic_manifest: 'ctrl.g24.runtime-semantic-authority-manifest.r47.v1', authority_runtime_semantic_reference_field_registry: 'ctrl.g24.runtime-semantic-reference-field-registry.r47.v1', authority_runtime_semantic_reference_owner_map: 'ctrl.g24.runtime-semantic-reference-owner-map.r47.v1', authority_runtime_semantic_dependency_owner_map: 'ctrl.g24.runtime-semantic-dependency-owner-map.r47.v1' }
function semanticTarget(reference) {
  if (aliases[reference]) return { target: aliases[reference], runtime: 'pinned_semantic_alias' }
  const normalized = reference.replace(/^\$\./, '')
  if (normalized.includes('*')) return { target: 'UNAVAILABLE', runtime: 'discriminated_wildcard_reference' }
  if (semanticAuthorityPaths.some(path => normalized === path || normalized.startsWith(`${path}.`)) || independentlyDeclaredDerivedTargetPaths.includes(normalized) || independentlyDeclaredFrozenTargetPaths.includes(normalized)) return { target: normalized, runtime: 'UNAVAILABLE' }
  if (reference.includes('_or_') || reference.includes('|')) return { target: 'UNAVAILABLE', runtime: 'closed_discriminated_compound_reference' }
  return { target: 'UNAVAILABLE', runtime: 'runtime_identity_or_field_reference' }
}
function targetVersion(target) {
  if (target === 'UNAVAILABLE') return 'UNAVAILABLE'
  let cursor = target
  while (cursor) {
    if (derivedVersions[cursor]) return derivedVersions[cursor]
    const value = get(semanticSourceSnapshot, cursor)
    if (value?.schema_version) return value.schema_version
    const cut = cursor.lastIndexOf('.')
    if (cut < 0) break
    cursor = cursor.slice(0, cut)
  }
  return semanticVersion(target, get(semanticSourceSnapshot, target))
}
const referenceRows = [], occurrenceKeys = new Set(), nonSuffixFields = new Set(r47.semantic_reference_field_specification.exact_non_suffix_semantic_fields)
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key)
function addSemanticReference(source, fieldPath, fieldName, literal, reason) {
  const resolution = semanticTarget(literal), owner = resolution.target === 'UNAVAILABLE' ? source : manifestedOwner(resolution.target) || source
  const key = `${source}|${fieldPath}|${literal}`
  if (occurrenceKeys.has(key)) return
  occurrenceKeys.add(key)
  referenceRows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : resolution.target !== 'UNAVAILABLE' ? (fieldName.includes('schema') ? 'exact_nested_schema_reference' : 'exact_nested_semantic_reference') : resolution.runtime, reference_literal: literal, owner_authority_path: owner, expected_owner_schema_version: targetVersion(owner), exact_target_path_or_UNAVAILABLE: resolution.target, exact_target_schema_version_or_UNAVAILABLE: targetVersion(resolution.target), runtime_identity_kind_or_UNAVAILABLE: resolution.target === 'UNAVAILABLE' ? resolution.runtime : 'UNAVAILABLE', specification_pattern_id: reason })
}
function walkSemanticReferences(value, source, fieldPath = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, item] of Object.entries(value)) {
    const next = `${fieldPath}.${key}`, selected = refToken(key) || nonSuffixFields.has(key)
    if (selected) {
      if (Array.isArray(item)) {
        for (let index = 0; index < item.length; index += 1) if (typeof item[index] === 'string') addSemanticReference(source, `${next}.${index}`, key, item[index], refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix')
      } else if (typeof item === 'string') addSemanticReference(source, next, key, item, refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix')
    }
    if (typeof item === 'string') { const resolution = semanticTarget(item); if (resolution.target !== 'UNAVAILABLE' && manifestedOwner(resolution.target) !== source) addSemanticReference(source, next, key, item, 'semantic_value') }
    walkSemanticReferences(item, source, next)
  }
}
for (const path of independentlyDeclaredSourcePaths) if (!['semantic_reference_field_specification'].includes(path)) walkSemanticReferences(get(semanticSourceSnapshot, path), path)
referenceRows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
r47.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r47.v1', specification_ref: 'semantic_reference_field_specification', source_snapshot_domain_ascii: 'CTRL-G24-R47-FINAL-SEMANTIC-SOURCE-SNAPSHOT', source_snapshot_sha256: semanticSourceSnapshotSha256, independently_declared_source_paths: independentlyDeclaredSourcePaths, independently_declared_derived_target_paths: independentlyDeclaredDerivedTargetPaths, independently_declared_frozen_target_paths: independentlyDeclaredFrozenTargetPaths, excluded_self_derived_paths: [...excludedDerivedPaths].sort(cp), derivation_order: ['finalize_non_derived_semantic_authorities', 'capture_owned_immutable_source_snapshot', 'scan_exact_source_snapshot', 'derive_owner_graph', 'derive_content_dependency_and_transitive_hashes', 'derive_graph_hash', 'seal_manifest_envelope'], post_snapshot_source_mutation: 'forbidden', row_schema: closed('ctrl.g24.runtime-semantic-reference-field-registry-row.r47.v1', { source_authority_path: id, field_path: id, field_name: id, reference_kind: id, reference_literal: id, owner_authority_path: id, expected_owner_schema_version: id, exact_target_path_or_UNAVAILABLE: id, exact_target_schema_version_or_UNAVAILABLE: id, runtime_identity_kind_or_UNAVAILABLE: id, specification_pattern_id: id }), exact_occurrence_rows: referenceRows, exact_expected_occurrence_count: referenceRows.length, occurrence_bijection: 'independent_rescan_of_the_final_emitted_non_derived_source_objects_equals_these_rows_byte_for_byte_in_canonical_order', precise_target_rule: 'manifest_target_special_cases_and_frozen_parent_targets_resolve_from_independently_declared_sets_not_current_object_existence_timing', unknown_reference_semantics: 'reject_materialization_and_hold_without_disclosure_or_write', inference_from_suffix_only: 'forbidden' }
r47.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r47.v1', specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', source_snapshot_sha256: semanticSourceSnapshotSha256, row_count: referenceRows.length, ownership_rule: 'owner_map_is_recomputed_only_from_the_final_snapshot_registry_rows_and_must_match_exactly' }

const priorOwners = Object.fromEntries(materializedR46.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const occurrenceDependencies = {}
for (const row of referenceRows) if (row.owner_authority_path !== row.source_authority_path) (occurrenceDependencies[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const dependencyOverrides = { ...Object.fromEntries(materializedR46.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths])), materialization: [], schema_change_manifest: [], fixture_schema_validator: [], semantic_reference_field_specification: [] }
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(dependencyOverrides[path] ?? priorOwners[path] ?? []), ...[...(occurrenceDependencies[path] ?? [])]])].filter(owner => semanticAuthorityPaths.includes(owner) && owner !== path).sort(cp), unqualified_legacy_alias_owner_path: path }))
r47.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r47.v1', source_snapshot_sha256: semanticSourceSnapshotSha256, exact_paths: semanticAuthorityPaths, rows: ownerRows, reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', owner_map_derivation: 'exactly_from_final_registry_rows_plus_frozen_explicit_non_reference_dependencies', explicit_reference_edges_required: true, unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write' }

const contentHash = (path, value) => hash({ domain_ascii: r47.authority_runtime_semantic_manifest_hash_contract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(value) })
const dependencyHash = (path, scope, rows) => hash({ domain_ascii: r47.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows })
const graphHash = rows => hash({ domain_ascii: r47.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: rows })
const envelopeHash = manifest => hash({ domain_ascii: r47.authority_runtime_semantic_manifest_hash_contract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest })
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, get(r47, path))]))
const graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = get(r47, path), directPaths = graph[path], directRows = directPaths.map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })), transitiveRows = transitive(path).map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })); return { authority_path: path, semantic_kind: kindOf(value), exact_keyset: keysetOf(value), authority_schema_ref: path, authority_schema_version: semanticVersion(path, value), direct_dependency_paths: directPaths, direct_dependency_content_hashes: directRows, direct_dependency_set_sha256: dependencyHash(path, 'direct', directRows), transitive_dependency_paths: transitiveRows.map(row => row.authority_path), transitive_dependency_content_hashes: transitiveRows, transitive_dependency_set_sha256: dependencyHash(path, 'transitive', transitiveRows), authority_content_sha256: contentHashes[path] } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r47.v1', type: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest', snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', resource_limits_ref: 'canonical_snapshot_resource_limits', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', source_snapshot_sha256: semanticSourceSnapshotSha256, exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, manifest_graph_sha256: graphHash(manifestRows) }
r47.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: envelopeHash(manifestWithoutSeal) }

const finalSnapshot = ownedSnapshotR44(r47)
export const materializedR47 = r47
export const materializedR47Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r47SemanticAuthorityPaths = semanticAuthorityPaths
export const r47SemanticSourcePaths = independentlyDeclaredSourcePaths
export const r47SemanticSourceSnapshotSha256 = semanticSourceSnapshotSha256
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR47Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR47Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R47 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
