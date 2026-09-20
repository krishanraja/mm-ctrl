import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR45, materializedR45Output } from './materialize-ctrl-g24-trusted-ingress-r45.mjs'
import { materializedR44, canonicalR44, ownedSnapshotR44, r44SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r45.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r46.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const r46 = structuredClone(materializedR45)
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (path, variant = 'UNAVAILABLE') => { const schema = get(r46, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const closed = (schemaVersion, properties, extra = {}) => ({ schema_version: schemaVersion, type: 'object', exact_keys: Object.keys(properties), required: Object.keys(properties), additional_properties: false, properties, ...extra })
const id = { type: 'identifier' }, fp = { type: 'sha256' }

function fingerprint(schema, row) {
  const rule = get(r46, schema.fingerprint_ref)
  if (!rule?.preimage_order) throw new Error(`fingerprint_schema:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]
  return { schema_ref: schema.fingerprint_ref, preimage, value: hash(preimage) }
}

function payloadFingerprint(role, artifact, payload) {
  if (artifact.fixture_wrapper_variant !== 'content_addressed') return fingerprint(schemaAt(artifact.schema_ref, artifact.schema_variant), payload)
  if (artifact.payload_schema_ref === 'opaque_bounded_bytes' || artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema') {
    const schema = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? r46.authority_opaque_raw_input_stores[artifact.payload_schema_variant].row_schema : r46.proof_nonce_ledger.row_schema
    return fingerprint(schema, artifact.stored_row_value)
  }
  const schema = schemaAt(artifact.payload_schema_ref, artifact.payload_schema_variant)
  if (schema.fingerprint_field) return fingerprint(schema, payload)
  if (role === 'result') {
    const rule = r46.case_session_authority_operation_protocols.operations[payload.operation_name].result_fingerprint
    const body = {}
    for (const field of schema.exact_keys) if (field !== 'result_fingerprint') body[field] = payload[field]
    const preimage = { domain_ascii: rule.domain_ascii, operation_name: payload.operation_name, operation_id: payload.operation_id, branch: payload.branch, branch_specific_canonical_payload_sha256: hash(body) }
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.result_fingerprint`, preimage, value: hash(preimage) }
  }
  if (role === 'request') {
    const rule = r46.case_session_authority_operation_protocols.operations[payload.operation_name].request_fingerprint
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
  walk(r46)
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

r46.schema_version = 'ctrl.g24.trusted-ingress.r46.effective.v1'
r46.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r45_vetoed', 'trusted_ingress_r46_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r46.supersedes = { commit: 'd69d06fb3baa9a75bf4f5fc7bc21cf5d1fbacb15', tree: 'c1ad7edf22f0f44b5a55dff3299469e6d3a9572f', human_blob: 'e236e9316cdf6227d65ad3c60cc3e450c5a6015c', machine_blob: '8ae6ad9888d6053201deb829b3804d3be5c8bccc', qa_blob: 'ad11eacac621b930d2cabc44b518eaa63f457346', checker_blob: '0bd2492d70827a97fa1d3bd41aeb66deb030d835', materializer_blob: '8b503171c52392f4126b7cb15c1da06c385ceeff', founder_checker_blob: '304aaa359ca5c037ea73c44557c8dc252bd5f6ab', adjudication: 'veto' }
r46.materialization = { ...r46.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r46.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath }

// Rebuild the committed fixture in dependency order from the leader-submitted intent.
const fixture = r46.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed')
const old = fixture.artifact_store_by_role, at = old.result.payload_value.committed_at, validUntil = '2027-09-14T00:00:00.000Z'
const targetIntent = resealContent('target_intent', old.target_intent, { ...old.target_intent.payload_value, valid_until: validUntil })
const proof = resealContent('proof', old.proof, { ...old.proof.payload_value, target_intent_sha256: targetIntent.bytes_sha256 })
const request = resealContent('request', old.request, { ...old.request.payload_value, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, authority_proof_bytes_ref: proof.ref, authority_proof_bytes_sha256: proof.bytes_sha256 })
const targetProjectionFields = [...schemaAt(targetIntent.payload_schema_ref, targetIntent.payload_schema_variant).exact_keys]
const targetRowWithoutIdentity = { ...targetIntent.payload_value, valid_from: at, authority_order: 1 }
const rowVersionPreimage = { domain_ascii: 'CTRL-G24-R46-COMMITTED-TARGET-ROW-VERSION', schema_version: 'ctrl.g24.committed-target-row-version.r46.v1', ordered_complete_mutable_authority_fields: [...Object.keys(targetRowWithoutIdentity)].sort(cp).map(field => ({ field, value: targetRowWithoutIdentity[field] })) }
const rowVersionRef = hash(rowVersionPreimage)
const targetRowValue = { ...targetRowWithoutIdentity, row_version_ref: rowVersionRef, anchor_fingerprint: '0'.repeat(64) }
const committedTarget = authorityArtifact(fixture.fixture_id, 'committed_target_row', 'authoritative_row_schemas.case_session_root_trust_anchors', 'UNAVAILABLE', targetRowValue, rowVersionPreimage)

const verifierTuples = [
  { signer_ref: proof.payload_value.signer_1_ref, key_artifact_sha256: proof.payload_value.signer_1_artifact_sha256 },
  { signer_ref: proof.payload_value.signer_2_ref, key_artifact_sha256: proof.payload_value.signer_2_artifact_sha256 },
].sort((left, right) => cp(canonicalR44(left), canonicalR44(right)))
const verifierRule = r46.bootstrap_verifier_set_fingerprint
const verifierPreimage = { domain_ascii: verifierRule.domain_ascii, canonical_sorted_signer_1_ref_key_artifact_tuple: verifierTuples[0], canonical_sorted_signer_2_ref_key_artifact_tuple: verifierTuples[1] }
const nonceSubjectFingerprint = hash(verifierPreimage)
const noncePayload = { ...old.proof_nonce_receipt.payload_value, nonce_subject_fingerprint: nonceSubjectFingerprint, proof_fingerprint: proof.fingerprint }
let proofNonce = structuredClone(old.proof_nonce_receipt)
const nonceBytes = canonicalR44(noncePayload), nonceRef = sha(Buffer.from(nonceBytes, 'utf8'))
const nonceRow = { ...old.proof_nonce_receipt.stored_row_value, ...noncePayload, nonce_receipt_ref: nonceRef, nonce_receipt_fingerprint: '0'.repeat(64) }
const nonceDerived = fingerprint(r46.proof_nonce_ledger.row_schema, nonceRow)
nonceRow.nonce_receipt_fingerprint = nonceDerived.value
Object.assign(proofNonce, { artifact_role: 'proof_nonce_receipt', payload_value: noncePayload, payload_canonical_bytes_utf8: nonceBytes, payload_bytes_sha256: nonceRef, payload_fingerprint: nonceDerived.value, ref: nonceRef, bytes_sha256: nonceRef, fingerprint: nonceDerived.value, stored_row_value: nonceRow, stored_row_canonical_bytes_sha256: hash(nonceRow), stored_row_fingerprint: nonceDerived.value, declared_payload_fingerprint_schema_ref: nonceDerived.schema_ref, declared_payload_fingerprint_preimage: nonceDerived.preimage, declared_wrapper_fingerprint_schema_ref: nonceDerived.schema_ref, declared_wrapper_fingerprint_preimage: nonceDerived.preimage, content_address_rule_verified: true })

const receiptSchema = schemaAt('authority_operation_receipt_store.row_union', 'ordinary_single_proof_committed')
const receiptBase = { ...old.receipt.canonical_row_value, request_fingerprint: request.fingerprint, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, target_row_bytes_ref: committedTarget.content_addressed_artifact_ref, target_row_bytes_sha256: committedTarget.canonical_row_bytes_sha256, target_row_fingerprint: committedTarget.recorded_fingerprint, authority_proof_bytes_ref: proof.ref, authority_proof_bytes_sha256: proof.bytes_sha256, authority_proof_fingerprint: proof.fingerprint, nonce_receipt_ref: proofNonce.ref, nonce_receipt_fingerprint: proofNonce.fingerprint, result_bytes_ref: '0'.repeat(64), result_bytes_sha256: '0'.repeat(64), result_fingerprint: '0'.repeat(64), receipt_fingerprint: '0'.repeat(64) }
const receiptRefPreimage = { domain_ascii: 'CTRL-G24-R46-AUTHORITY-OPERATION-RECEIPT-REF', schema_version: receiptSchema.schema_version, ordered_fields: receiptSchema.receipt_ref_preimage_fields.map(field => ({ field, value: receiptBase[field] })) }
const receiptRef = hash(receiptRefPreimage)
const receiptPrecommitRule = get(r46, receiptSchema.receipt_precommit_fingerprint_ref), receiptPrecommitPreimage = {}
for (const field of receiptPrecommitRule.preimage_order) receiptPrecommitPreimage[field] = field === 'domain_ascii' ? receiptPrecommitRule.domain_ascii : field === 'receipt_ref' ? receiptRef : receiptBase[field]
const receiptPrecommitFingerprint = hash(receiptPrecommitPreimage)
const result = resealContent('result', old.result, { ...old.result.payload_value, target_row_version_ref: rowVersionRef, target_row_fingerprint: committedTarget.recorded_fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: receiptPrecommitFingerprint })
const receipt = authorityArtifact(fixture.fixture_id, 'receipt', 'authority_operation_receipt_store.row_union', 'ordinary_single_proof_committed', { ...receiptBase, receipt_ref: receiptRef, receipt_precommit_fingerprint: receiptPrecommitFingerprint, result_bytes_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_fingerprint: '0'.repeat(64) }, receiptRefPreimage)
const history = resealContent('history', old.history, { ...old.history.payload_value, response_payload_ref: result.ref, response_payload_bytes_sha256: result.bytes_sha256, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint })
const registrySchema = schemaAt(old.registry.schema_ref, old.registry.schema_variant)
let registryRow = { ...old.registry.canonical_row_value, request_fingerprint: request.fingerprint, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, committed_target_row_ref: rowVersionRef, committed_target_row_bytes_sha256: committedTarget.canonical_row_bytes_sha256, committed_target_row_fingerprint: committedTarget.recorded_fingerprint, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: receiptPrecommitFingerprint, receipt_fingerprint: receipt.recorded_fingerprint, historical_response_ref: history.ref, historical_response_bytes_sha256: history.bytes_sha256, historical_response_fingerprint: history.fingerprint }
const registryPreimage = { domain_ascii: registrySchema.row_ref_domain_ascii, schema_version: registrySchema.row_ref_schema_version, ordered_fields: registrySchema.row_ref_preimage_included_fields.map(field => ({ field, value: registryRow[field] })) }
registryRow.registry_row_ref = hash(registryPreimage)
const registry = authorityArtifact(fixture.fixture_id, 'registry', old.registry.schema_ref, old.registry.schema_variant, registryRow, registryPreimage, 'registry_row')
const replayPayload = resealContent('replay_payload', old.replay_payload, { ...old.replay_payload.payload_value, historical_result_ref: result.ref, historical_result_bytes_sha256: result.bytes_sha256, historical_result_fingerprint: result.fingerprint, stored_historical_response_ref: history.ref, stored_historical_response_bytes_sha256: history.bytes_sha256, stored_historical_response_fingerprint: history.fingerprint, committed_registry_row_ref: registryRow.registry_row_ref, committed_registry_row_fingerprint: registry.recorded_fingerprint })
const replayEnvelope = resealContent('replay_envelope', old.replay_envelope, { ...old.replay_envelope.payload_value, payload_ref: replayPayload.ref, payload_bytes_sha256: replayPayload.bytes_sha256, payload_fingerprint: replayPayload.fingerprint, replay_response_ref: history.ref, replay_response_bytes_sha256: history.bytes_sha256, replay_response_fingerprint: history.fingerprint })
fixture.artifact_store_by_role = { target_intent: targetIntent, committed_target_row: committedTarget, proof, proof_nonce_receipt: proofNonce, request, result, receipt, history, registry, replay_payload: replayPayload, replay_envelope: replayEnvelope }
fixture.exact_required_roles = Object.keys(fixture.artifact_store_by_role)
fixture.artifact_view_role_refs = Object.fromEntries(fixture.exact_required_roles.map(role => [role, role]))
fixture.request_fingerprint = request.fingerprint

r46.authority_operation_committed_target_projection_authority = {
  schema_version: 'ctrl.g24.authority-operation-committed-target-projection-authority.r46.v1',
  intent_schema_ref: targetIntent.payload_schema_ref,
  committed_row_schema_ref: 'authoritative_row_schemas.case_session_root_trust_anchors',
  exact_copied_intent_fields: targetProjectionFields,
  exact_server_derived_fields: ['valid_from', 'authority_order', 'row_version_ref', 'anchor_fingerprint'],
  valid_until_rule: 'canonical_timestamp_strictly_greater_than_server_committed_at_and_snapshot_time',
  row_version_preimage_schema: { domain_ascii: rowVersionPreimage.domain_ascii, schema_version: rowVersionPreimage.schema_version, complete_mutable_fields: Object.keys(targetRowWithoutIdentity).sort(cp), excluded_cycle_fields: ['row_version_ref', 'anchor_fingerprint'] },
  any_mutable_authority_field_change_requires_new_row_version_ref: true,
}
r46.authority_operation_bootstrap_nonce_subject_authority = {
  schema_version: 'ctrl.g24.authority-operation-bootstrap-nonce-subject-authority.r46.v1',
  normative_contract_ref: 'bootstrap_verifier_set_fingerprint',
  normative_contract_schema_version: verifierRule.schema_version,
  domain_ascii: verifierRule.domain_ascii,
  exact_preimage: verifierPreimage,
  nonce_subject_fingerprint: nonceSubjectFingerprint,
  signer_ref_only_private_domain: 'forbidden',
  proof_nonce_receipt_exact_equality: true,
}

// Discover every artifact or authority-row reference from the exact selected closed schemas.
function artifactSchema(artifact) {
  if (artifact.fixture_wrapper_variant === 'content_addressed') return schemaAt(artifact.payload_schema_ref, artifact.payload_schema_variant)
  return schemaAt(artifact.schema_ref, artifact.schema_variant)
}
function artifactValue(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_value : artifact.canonical_row_value }
function identities(role, artifact) {
  const rows = []
  if (artifact.fixture_wrapper_variant === 'content_addressed') rows.push({ role, identity_kind: 'content_address', ref: artifact.ref, bytes_sha256: artifact.bytes_sha256, fingerprint: artifact.fingerprint })
  else {
    rows.push({ role, identity_kind: 'row_content_address', ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'registry') rows.push({ role, identity_kind: 'registry_row_ref', ref: artifact.canonical_row_value.registry_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'hold') rows.push({ role, identity_kind: 'hold_row_ref', ref: artifact.canonical_row_value.hold_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'committed_target_row') rows.push({ role, identity_kind: 'row_version_ref', ref: artifact.canonical_row_value.row_version_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'receipt') {
      rows.push({ role, identity_kind: 'receipt_precommit_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.canonical_row_value.receipt_precommit_fingerprint })
      rows.push({ role, identity_kind: 'receipt_final_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    }
  }
  return rows
}
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key)
function companionPaths(sourceRole, key, value) {
  if (key === 'response_payload_ref') return { bytes: 'response_payload_bytes_sha256', fingerprint: 'result_fingerprint' }
  if (key === 'request_artifact_ref') return { bytes: 'request_artifact_sha256', fingerprint: 'request_fingerprint' }
  if (key === 'result_ref') return { bytes: 'result_bytes_sha256', fingerprint: 'result_fingerprint' }
  if (key === 'hold_result_ref') return { bytes: 'hold_result_bytes_sha256', fingerprint: 'hold_result_fingerprint' }
  if (key === 'hold_row_ref') return { bytes: null, fingerprint: sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint' }
  if (key === 'receipt_ref') return { bytes: null, fingerprint: sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint' }
  if (key === 'committed_target_row_ref') return { bytes: 'committed_target_row_bytes_sha256', fingerprint: 'committed_target_row_fingerprint' }
  if (key === 'target_row_version_ref') return { bytes: null, fingerprint: 'target_row_fingerprint' }
  if (key === 'held_registry_row_ref') return { bytes: null, fingerprint: 'held_registry_row_fingerprint' }
  if (key === 'committed_registry_row_ref') return { bytes: null, fingerprint: 'committed_registry_row_fingerprint' }
  const suffix = key.endsWith('_or_unavailable') ? '_or_unavailable' : ''
  const base = key.replace(/_ref(_or_unavailable)?$/, '')
  return { bytes: [`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(candidate => Object.hasOwn(value, candidate)) ?? null, fingerprint: `${base}_fingerprint${suffix}` }
}
const selectedReferenceRows = [], selfReferenceRows = [], nonArtifactRows = []
for (const branchFixture of r46.authority_operation_replay_restart_fixtures.fixtures) {
  const store = branchFixture.artifact_store_by_role
  const allIdentities = Object.entries(store).flatMap(([role, artifact]) => identities(role, artifact))
  for (const [sourceRole, artifact] of Object.entries(store)) {
    const schema = artifactSchema(artifact), value = artifactValue(artifact)
    if (!schema?.exact_keys || !value || typeof value !== 'object') continue
    const valueKeys = Object.keys(value).sort(cp), schemaKeys = [...schema.exact_keys].sort(cp)
    if (canonicalR44(valueKeys) !== canonicalR44(schemaKeys)) throw new Error(`R46_selected_schema_keys:${branchFixture.fixture_id}:${sourceRole}`)
    for (const field of schema.exact_keys.filter(refToken)) {
      const reference = value[field]
      if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonArtifactRows.push({ fixture_id: branchFixture.fixture_id, source_role: sourceRole, source_schema_ref: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, source_schema_variant: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant, source_field: field, reference_literal: reference ?? null, classification: 'closed_null_or_unavailable_sentinel' }); continue }
      let matches = allIdentities.filter(candidate => candidate.ref === reference)
      const nonSelf = matches.filter(candidate => candidate.role !== sourceRole)
      if (nonSelf.length) matches = nonSelf
      if (!nonSelf.length && matches.length) { selfReferenceRows.push({ fixture_id: branchFixture.fixture_id, source_role: sourceRole, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
      if (!matches.length) { nonArtifactRows.push({ fixture_id: branchFixture.fixture_id, source_role: sourceRole, source_schema_ref: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, source_schema_variant: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant, source_field: field, reference_literal: reference, classification: field.includes('schema_ref') ? 'closed_semantic_schema_reference' : 'closed_runtime_or_external_authority_identity' }); continue }
      if (matches.length > 1 && matches.every(candidate => candidate.role === 'receipt')) matches = matches.filter(candidate => candidate.identity_kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
      if (matches.length !== 1) throw new Error(`R46_selected_reference_match:${branchFixture.fixture_id}:${sourceRole}:${field}:${matches.length}`)
      const target = matches[0], companions = companionPaths(sourceRole, field, value)
      const actualBytes = companions.bytes && Object.hasOwn(value, companions.bytes) ? value[companions.bytes] : 'UNAVAILABLE'
      const actualFingerprint = companions.fingerprint && Object.hasOwn(value, companions.fingerprint) ? value[companions.fingerprint] : 'UNAVAILABLE'
      if (actualBytes !== 'UNAVAILABLE' && actualBytes !== target.bytes_sha256) throw new Error(`R46_selected_reference_bytes:${branchFixture.fixture_id}:${sourceRole}:${field}`)
      if (actualFingerprint !== 'UNAVAILABLE' && actualFingerprint !== target.fingerprint) throw new Error(`R46_selected_reference_fingerprint:${branchFixture.fixture_id}:${sourceRole}:${field}`)
      selectedReferenceRows.push({ fixture_id: branchFixture.fixture_id, source_role: sourceRole, source_schema_ref: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, source_schema_variant: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant, source_field: field, target_role: target.role, target_identity_kind: target.identity_kind, reference: reference, companion_bytes_field_or_UNAVAILABLE: actualBytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : companions.bytes, companion_bytes_sha256_or_UNAVAILABLE: actualBytes, companion_fingerprint_field_or_UNAVAILABLE: actualFingerprint === 'UNAVAILABLE' ? 'UNAVAILABLE' : companions.fingerprint, companion_fingerprint_or_UNAVAILABLE: actualFingerprint, exact_match_count: 1 })
    }
  }
}
selectedReferenceRows.sort((left, right) => cp(`${left.fixture_id}|${left.source_role}|${left.source_field}`, `${right.fixture_id}|${right.source_role}|${right.source_field}`))
selfReferenceRows.sort((left, right) => cp(`${left.fixture_id}|${left.source_role}|${left.source_field}`, `${right.fixture_id}|${right.source_role}|${right.source_field}`))
nonArtifactRows.sort((left, right) => cp(`${left.fixture_id}|${left.source_role}|${left.source_field}`, `${right.fixture_id}|${right.source_role}|${right.source_field}`))
r46.authority_operation_selected_reference_traversal_authority = {
  schema_version: 'ctrl.g24.authority-operation-selected-reference-traversal-authority.r46.v1',
  source: 'every_reference_bearing_field_in_each_exact_selected_closed_fixture_schema',
  selection: 'schema_exact_keys_with_tokenized_ref_or_refs',
  artifact_or_authority_row_reference_result: 'exactly_one_target_role_and_identity_kind',
  silent_absent_path_return: 'forbidden',
  self_identity_allowlist: selfReferenceRows,
  non_artifact_reference_allowlist: nonArtifactRows,
  exact_selected_artifact_reference_count: selectedReferenceRows.length,
  exact_self_reference_count: selfReferenceRows.length,
  exact_non_artifact_reference_count: nonArtifactRows.length,
}
r46.authority_operation_artifact_resolution_authority = { schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r46.v1', traversal_authority_ref: 'authority_operation_selected_reference_traversal_authority', zero_matches: 'hold_without_disclosure_or_write', multiple_matches: 'hold_without_disclosure_or_write', comparison: 'reference_plus_every_present_schema_declared_companion_bytes_hash_and_fingerprint', exact_resolution_count: selectedReferenceRows.length, rows: selectedReferenceRows }
const correlationRows = selectedReferenceRows.flatMap((row, index) => [
  { correlation_id: `r46:${String(index + 1).padStart(3, '0')}:reference`, ...row, correlation_kind: 'reference' },
  { correlation_id: `r46:${String(index + 1).padStart(3, '0')}:bytes`, ...row, correlation_kind: 'companion_bytes_or_explicit_unavailable' },
  { correlation_id: `r46:${String(index + 1).padStart(3, '0')}:fingerprint`, ...row, correlation_kind: 'companion_fingerprint_or_explicit_unavailable' },
])
r46.authority_operation_restart_correlation_authority = { schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r46.v1', traversal_authority_ref: 'authority_operation_selected_reference_traversal_authority', derivation: 'mechanical_three_way_projection_of_every_exhaustively_discovered_selected_artifact_reference', exact_row_count: correlationRows.length, rows: correlationRows, sole_verifier: true }
r46.fixture_schema_validator = { ...r46.fixture_schema_validator, schema_version: 'ctrl.g24.fixture-schema-validator.r46.v1', validation_scope: 'one_role_keyed_store_exact_selected_schema_traversal_zero_omissions_exact_one_resolution_complete_companion_correlation_target_projection_bootstrap_nonce_and_four_restarts' }

// Restore the full inherited runtime-semantic manifest and extend it without narrowing.
r46.semantic_reference_field_specification = { ...materializedR44.semantic_reference_field_specification, schema_version: 'ctrl.g24.semantic-reference-field-specification.r46.v1', source: 'independently_pinned_R44_reference_vocabulary_extended_over_every_R46_manifested_authority' }
const semanticAuthorityPaths = [...new Set([...r44SemanticAuthorityPaths,
  'authority_operation_committed_target_identity_authority',
  'authority_operation_receipt_materialization_authority',
  'authority_operation_artifact_fingerprint_derivation_authority',
  'authority_operation_committed_target_projection_authority',
  'authority_operation_bootstrap_nonce_subject_authority',
  'authority_operation_selected_reference_traversal_authority',
])].sort(cp)
const kindOf = value => Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
const keysetOf = value => value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort(cp) : []
function semanticVersion(path, value) { if (value?.schema_version) return value.schema_version; const prior = materializedR44.authority_runtime_semantic_manifest.rows.find(row => row.authority_path === path); return prior?.authority_schema_version ?? 'ctrl.g24.semantic-authority.unversioned-frozen.v1' }
function manifestedOwner(path) { let selected = ''; for (const authorityPath of semanticAuthorityPaths) if ((path === authorityPath || path.startsWith(`${authorityPath}.`)) && authorityPath.length > selected.length) selected = authorityPath; return selected }
const aliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
function semanticTarget(reference) { if (aliases[reference]) return { target: aliases[reference], runtime: 'pinned_semantic_alias' }; const normalized = reference.replace(/^\$\./, ''); if (normalized.includes('*')) return { target: 'UNAVAILABLE', runtime: 'discriminated_wildcard_reference' }; if (get(r46, normalized) !== undefined) return { target: normalized, runtime: 'UNAVAILABLE' }; if (reference.includes('_or_') || reference.includes('|')) return { target: 'UNAVAILABLE', runtime: 'closed_discriminated_compound_reference' }; return { target: 'UNAVAILABLE', runtime: 'runtime_identity_or_field_reference' } }
function targetVersion(target) { if (target === 'UNAVAILABLE') return 'UNAVAILABLE'; let cursor = target; while (cursor) { const value = get(r46, cursor); if (value?.schema_version) return value.schema_version; const cut = cursor.lastIndexOf('.'); if (cut < 0) break; cursor = cursor.slice(0, cut) } return semanticVersion(target, get(r46, target)) }
const referenceRows = [], occurrenceKeys = new Set(), nonSuffixFields = new Set(r46.semantic_reference_field_specification.exact_non_suffix_semantic_fields)
function addSemanticReference(source, fieldPath, fieldName, literal, reason) {
  const resolution = semanticTarget(literal), owner = resolution.target === 'UNAVAILABLE' ? source : manifestedOwner(resolution.target) || source
  const key = `${source}|${fieldPath}|${literal}`
  if (occurrenceKeys.has(key)) return
  occurrenceKeys.add(key)
  referenceRows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : resolution.target !== 'UNAVAILABLE' ? (fieldName.includes('schema') ? 'exact_nested_schema_reference' : 'exact_nested_semantic_reference') : resolution.runtime, reference_literal: literal, owner_authority_path: owner, expected_owner_schema_version: semanticVersion(owner, get(r46, owner)), exact_target_path_or_UNAVAILABLE: resolution.target, exact_target_schema_version_or_UNAVAILABLE: targetVersion(resolution.target), runtime_identity_kind_or_UNAVAILABLE: resolution.target === 'UNAVAILABLE' ? resolution.runtime : 'UNAVAILABLE', specification_pattern_id: reason })
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
for (const path of semanticAuthorityPaths) if (!['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry', 'semantic_reference_field_specification'].includes(path)) walkSemanticReferences(get(r46, path), path)
referenceRows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
r46.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r46.v1', specification_ref: 'semantic_reference_field_specification', row_schema: closed('ctrl.g24.runtime-semantic-reference-field-registry-row.r46.v1', { source_authority_path: id, field_path: id, field_name: id, reference_kind: id, reference_literal: id, owner_authority_path: id, expected_owner_schema_version: id, exact_target_path_or_UNAVAILABLE: id, exact_target_schema_version_or_UNAVAILABLE: id, runtime_identity_kind_or_UNAVAILABLE: id, specification_pattern_id: id }), exact_occurrence_rows: referenceRows, exact_expected_occurrence_count: referenceRows.length, occurrence_bijection: 'every_actual_reference_occurrence_selected_by_the_independent_R46_specification_exactly_once', precise_target_rule: 'each_semantic_reference_resolves_the_exact_nested_object_and_its_own_nearest_schema_version_never_a_top_level_fallback', runtime_discriminator_rule: 'runtime_identifiers_sentinels_wildcards_and_closed_compounds_are_explicitly_discriminated', unknown_reference_semantics: 'reject_materialization_and_hold_without_disclosure_or_write', inference_from_suffix_only: 'forbidden' }
r46.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r46.v1', specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', row_count: referenceRows.length, ownership_rule: 'semantic_authority_refs_resolve_one_manifested_owner_and_runtime_identity_or_field_refs_remain_owned_by_their_closed_source' }
const priorOwners = Object.fromEntries(materializedR44.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const occurrenceDependencies = {}
for (const row of referenceRows) if (row.owner_authority_path !== row.source_authority_path) (occurrenceDependencies[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const dependencyOverrides = {
  authority_operation_replay_restart_fixtures: ['authority_operation_fixture_role_store_authority', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'authority_operation_committed_target_projection_authority', 'authority_operation_bootstrap_nonce_subject_authority', 'fixture_schema_validator'],
  authority_operation_artifact_resolution_authority: ['authority_operation_selected_reference_traversal_authority', 'authority_operation_fixture_role_store_authority'],
  authority_operation_restart_correlation_authority: ['authority_operation_selected_reference_traversal_authority', 'authority_operation_artifact_resolution_authority'],
  authority_operation_selected_reference_traversal_authority: ['authority_operation_fixture_role_store_authority', 'authority_operation_fixture_persisted_artifact_wrapper_schema'],
  authority_operation_committed_target_projection_authority: ['authoritative_row_schemas', 'canonical_json_utf8_encoding'],
  authority_operation_bootstrap_nonce_subject_authority: ['bootstrap_verifier_set_fingerprint', 'proof_nonce_ledger'],
  materialization: [], schema_change_manifest: [], fixture_schema_validator: [], semantic_reference_field_specification: [],
}
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(dependencyOverrides[path] ?? priorOwners[path] ?? []), ...[...(occurrenceDependencies[path] ?? [])]])].filter(owner => semanticAuthorityPaths.includes(owner) && owner !== path).sort(cp), unqualified_legacy_alias_owner_path: path }))
r46.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r46.v1', exact_paths: semanticAuthorityPaths, rows: ownerRows, reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', explicit_reference_edges_required: true, unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write' }
r46.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r46.v1', { schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r46.v1' }, type: { const: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest' }, snapshot_pipeline_ref: { const: 'owned_immutable_canonical_snapshot_pipeline' }, resource_limits_ref: { const: 'canonical_snapshot_resource_limits' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, reference_field_specification_ref: { const: 'semantic_reference_field_specification' }, reference_field_registry_ref: { const: 'authority_runtime_semantic_reference_field_registry' }, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, manifest_graph_sha256: fp, manifest_envelope_seal_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r46.v1'
r46.authority_runtime_semantic_manifest_hash_contract = { ...materializedR44.authority_runtime_semantic_manifest_hash_contract, schema_version: hashVersion, content_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R46', dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R46', graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R46', envelope_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R46' }
const contentHash = (path, value) => hash({ domain_ascii: r46.authority_runtime_semantic_manifest_hash_contract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(value) })
const dependencyHash = (path, scope, rows) => hash({ domain_ascii: r46.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows })
const graphHash = rows => hash({ domain_ascii: r46.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: rows })
const envelopeHash = manifest => hash({ domain_ascii: r46.authority_runtime_semantic_manifest_hash_contract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest })
r46.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r46.v1', derivation: 'bounded_exact_extension_from_frozen_R45_exhaustive_selected_reference_traversal_full_manifest_restoration_complete_target_projection_and_normative_bootstrap_nonce_subject', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.authority_operation_replay_restart_fixtures', '$.authority_operation_committed_target_projection_authority', '$.authority_operation_bootstrap_nonce_subject_authority', '$.authority_operation_selected_reference_traversal_authority', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.semantic_reference_field_specification', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: [], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r46_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r46.required_negative_fixture_families = [...new Set([...r46.required_negative_fixture_families, 'exhaustive_selected_schema_reference_traversal', 'target_projection_and_row_version_alias', 'normative_bootstrap_verifier_set_nonce_subject', 'full_inherited_manifest_non_regression'])]
delete r46.authority_runtime_semantic_manifest
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, get(r46, path))]))
const graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = get(r46, path), directPaths = graph[path], directRows = directPaths.map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })), transitiveRows = transitive(path).map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })); return { authority_path: path, semantic_kind: kindOf(value), exact_keyset: keysetOf(value), authority_schema_ref: path, authority_schema_version: semanticVersion(path, value), direct_dependency_paths: directPaths, direct_dependency_content_hashes: directRows, direct_dependency_set_sha256: dependencyHash(path, 'direct', directRows), transitive_dependency_paths: transitiveRows.map(row => row.authority_path), transitive_dependency_content_hashes: transitiveRows, transitive_dependency_set_sha256: dependencyHash(path, 'transitive', transitiveRows), authority_content_sha256: contentHashes[path] } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r46.v1', type: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest', snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', resource_limits_ref: 'canonical_snapshot_resource_limits', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, manifest_graph_sha256: graphHash(manifestRows) }
r46.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: envelopeHash(manifestWithoutSeal) }
r46.visible_surface_changes = []
r46.external_actions_authorized = []

const finalSnapshot = ownedSnapshotR44(r46)
export const materializedR46 = r46
export const materializedR46Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r46SemanticAuthorityPaths = semanticAuthorityPaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR46Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR46Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R46 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
