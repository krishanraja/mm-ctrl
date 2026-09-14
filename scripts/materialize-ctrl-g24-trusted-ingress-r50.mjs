import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR49, r49SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r49.mjs'
import { canonicalR44, ownedSnapshotR44, materializedR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r49.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r50.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const r50 = structuredClone(materializedR49)
const schemaAt = (path, variant = 'UNAVAILABLE') => { const schema = get(r50, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const closed = (schemaVersion, properties, extra = {}) => ({ schema_version: schemaVersion, type: 'object', exact_keys: Object.keys(properties), required: Object.keys(properties), additional_properties: false, properties, ...extra })
const id = { type: 'identifier' }, fp = { type: 'sha256' }

function valueForSpec(spec, seed) {
  if (Object.hasOwn(spec ?? {}, 'const')) return spec.const
  if (Array.isArray(spec?.enum)) return spec.enum[0]
  if (spec?.type === 'enum' && Array.isArray(spec.values)) return spec.values[0]
  if (spec?.type === 'sha256') return sha(seed)
  if (spec?.type === 'sha256_or_exact_literal') return spec.literal
  if (spec?.type === 'canonical_timestamp') return '2026-09-14T12:00:00.000Z'
  if (spec?.type === 'nullable') return null
  if (spec?.type === 'boolean') return false
  if (['integer', 'nonnegative_integer', 'safe_nonnegative_integer'].includes(spec?.type)) return 0
  if (spec?.type === 'positive_integer') return 1
  if (String(spec?.type).includes('array')) return []
  return `r50_${sha(seed).slice(0, 24)}`
}
function fill(schema, seed, overrides = {}) { const row = {}; for (const [field, spec] of Object.entries(schema.properties)) row[field] = valueForSpec(spec, `${seed}:${field}`); return Object.assign(row, overrides) }
function fingerprint(schema, row) {
  const rule = get(r50, schema.fingerprint_ref)
  if (!rule?.preimage_order) throw new Error(`R50_fingerprint_schema:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]
  return { schema_ref: schema.fingerprint_ref, preimage, value: hash(preimage) }
}
const selectedStoreCache = new Map()
function selectedStore(schemaRef) {
  if (selectedStoreCache.has(schemaRef)) return selectedStoreCache.get(schemaRef)
  const found = []
  const walk = value => { if (!value || typeof value !== 'object') return; if (value.canonical_schema_ref === schemaRef && value.row_schema?.properties) found.push(value); for (const child of Object.values(value)) walk(child) }
  walk(r50)
  const unique = [...new Set(found)]
  if (unique.length !== 1) throw new Error(`R50_selected_store:${schemaRef}:${unique.length}`)
  selectedStoreCache.set(schemaRef, unique[0])
  return unique[0]
}
function payloadFingerprint(role, schemaRef, variant, payload) {
  const schema = schemaAt(schemaRef, variant)
  if (schema.fingerprint_field) return fingerprint(schema, payload)
  if (role === 'result') {
    const rule = r50.case_session_authority_operation_protocols.operations[payload.operation_name].result_fingerprint, body = {}
    for (const field of schema.exact_keys) if (field !== 'result_fingerprint') body[field] = payload[field]
    const preimage = { domain_ascii: rule.domain_ascii, operation_name: payload.operation_name, operation_id: payload.operation_id, branch: payload.branch, branch_specific_canonical_payload_sha256: hash(body) }
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.result_fingerprint`, preimage, value: hash(preimage) }
  }
  if (role === 'request') {
    const rule = r50.case_session_authority_operation_protocols.operations[payload.operation_name].request_fingerprint, preimage = {}
    for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : payload[field]
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.request_fingerprint`, preimage, value: hash(preimage) }
  }
  const bytesHash = sha(Buffer.from(canonicalR44(payload), 'utf8'))
  const preimage = { domain_ascii: r50.authority_operation_persisted_identity_primitives.generic_payload_fingerprint.domain_ascii, schema_ref: schemaRef, canonical_bytes_sha256: bytesHash }
  return { schema_ref: 'authority_operation_persisted_identity_primitives.generic_payload_fingerprint', preimage, value: hash(preimage) }
}
function makeContent(fixtureId, role, schemaRef, variant, overrides = {}) {
  const schema = schemaAt(schemaRef, variant), payload = fill(schema, `${fixtureId}:${role}`, overrides)
  const derived = payloadFingerprint(role, schemaRef, variant, payload)
  if (schema.fingerprint_field) payload[schema.fingerprint_field] = derived.value
  if (role === 'result') payload.result_fingerprint = derived.value
  const bytes = canonicalR44(payload), bytesHash = sha(Buffer.from(bytes, 'utf8')), store = selectedStore(schemaRef), rowSchema = store.row_schema
  const row = fill(rowSchema, `${fixtureId}:${role}:wrapper`, { artifact_ref: bytesHash, canonical_schema_ref: schemaRef, canonical_bytes_b64url: Buffer.from(bytes, 'utf8').toString('base64url'), canonical_bytes_length: Buffer.byteLength(bytes), canonical_bytes_sha256: bytesHash, parsed_content_fingerprint: derived.value, stored_at: '2026-09-14T12:00:00.000Z' })
  const wrapperFingerprint = fingerprint(rowSchema, row); row[rowSchema.fingerprint_field] = wrapperFingerprint.value
  return { artifact_role: role, fixture_wrapper_variant: 'content_addressed', selected_store_authority_schema_version: store.schema_version ?? rowSchema.schema_version, selected_wrapper_schema_version: rowSchema.schema_version, payload_schema_ref: schemaRef, payload_schema_variant: variant, payload_schema_version: schema.schema_version, payload_value: payload, payload_canonical_bytes_utf8: bytes, payload_bytes_sha256: bytesHash, payload_fingerprint: derived.value, ref: bytesHash, bytes_sha256: bytesHash, fingerprint: derived.value, stored_row_value: row, stored_row_canonical_bytes_sha256: hash(row), stored_row_fingerprint: wrapperFingerprint.value, declared_payload_fingerprint_schema_ref: derived.schema_ref, declared_payload_fingerprint_preimage: derived.preimage, declared_wrapper_fingerprint_schema_ref: wrapperFingerprint.schema_ref, declared_wrapper_fingerprint_preimage: wrapperFingerprint.preimage, content_address_rule_verified: true }
}
function makeNonce(fixtureId, role, proofFamily, proof, operationId, branch, nonce, subject, verifier) {
  const payloadSchema = r50.proof_nonce_receipt_payload_schema
  const payload = fill(payloadSchema, `${fixtureId}:${role}`, { proof_family: proofFamily, nonce_subject_fingerprint: subject, nonce, proof_fingerprint: proof.fingerprint, verifier_identity_fingerprint: verifier, target_store: 'case_server_session_principal_evidence', operation_id: operationId, consumed_on_branch: branch, consumed_at: '2026-09-14T12:00:00.000Z' })
  const bytes = canonicalR44(payload), bytesHash = sha(Buffer.from(bytes, 'utf8')), rowSchema = r50.proof_nonce_ledger.row_schema, row = { ...payload, nonce_receipt_ref: bytesHash, nonce_receipt_fingerprint: '0'.repeat(64) }
  const derived = fingerprint(rowSchema, row); row.nonce_receipt_fingerprint = derived.value
  return { artifact_role: role, fixture_wrapper_variant: 'content_addressed', selected_store_authority_schema_version: r50.proof_nonce_receipt_store.schema_version, selected_wrapper_schema_version: rowSchema.schema_version, payload_schema_ref: 'proof_nonce_receipt_payload_schema', payload_schema_variant: 'UNAVAILABLE', payload_schema_version: payloadSchema.schema_version, payload_value: payload, payload_canonical_bytes_utf8: bytes, payload_bytes_sha256: bytesHash, payload_fingerprint: derived.value, ref: bytesHash, bytes_sha256: bytesHash, fingerprint: derived.value, stored_row_value: row, stored_row_canonical_bytes_sha256: hash(row), stored_row_fingerprint: derived.value, declared_payload_fingerprint_schema_ref: rowSchema.fingerprint_ref, declared_payload_fingerprint_preimage: derived.preimage, declared_wrapper_fingerprint_schema_ref: rowSchema.fingerprint_ref, declared_wrapper_fingerprint_preimage: derived.preimage, content_address_rule_verified: true }
}
function makeRow(fixtureId, role, schemaRef, variant, row, preimage, wrapperVariant = 'authoritative_row') {
  const schema = schemaAt(schemaRef, variant), derived = fingerprint(schema, row); row[schema.fingerprint_field] = derived.value
  const bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8'))
  return { fixture_artifact_id: `${fixtureId}:${role}`, artifact_role: role, fixture_wrapper_variant: wrapperVariant, schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, normative_row_ref_preimage: preimage, canonical_row_value: row, canonical_row_bytes_utf8: bytes, canonical_row_bytes_sha256: bytesHash, content_addressed_artifact_ref: bytesHash, fingerprint_schema_ref: derived.schema_ref, fingerprint_preimage: derived.preimage, recorded_fingerprint: derived.value, declared_payload_fingerprint_schema_ref: derived.schema_ref, declared_payload_fingerprint_preimage: derived.preimage }
}
function rowVersion(store, rowWithoutIdentity) {
  const authority = r50.authority_operation_committed_target_identity_authority.variants[store]
  const fields = Object.keys(rowWithoutIdentity).sort(cp).map(field => ({ field, value: rowWithoutIdentity[field] }))
  const preimage = { domain_ascii: authority.row_version_domain_ascii, schema_version: authority.row_version_schema_version, ordered_complete_mutable_authority_fields: fields }
  return { preimage, ref: hash(preimage) }
}

r50.schema_version = 'ctrl.g24.trusted-ingress.r50.effective.v1'
r50.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r49_vetoed', 'trusted_ingress_r50_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r50.supersedes = { commit: '1443d76220ecfede1c11a0c3e327b1b66624538e', tree: '20878619501306f16c7c00011a11ad14337f3f74', human_blob: 'fb975a475080a2aa3831470be181c49eb4e15502', machine_blob: '26ab69d8243d2985ff8f1bd25017fdcc089809eb', qa_blob: '6608dca94b4dcac193bb1316bc685995e0ab7314', checker_blob: 'cc26b1a996d78566d771fbedf3b83f20fd533cef', materializer_blob: '22b28ed5c594fb0a8fedc0b124e1eaa15fc0f40f', founder_checker_blob: 'ff33a41a38fbd9302084b9cd61909aca7e8c0c47', adjudication: 'veto' }
r50.materialization = { ...r50.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r50.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['finalize_all_nonderived_schema_identity_signature_and_fixture_authorities', 'capture_final_role_stores', 'enumerate_complete_active_persisted_schema_and_wrapper_universe', 'derive_and_execute_complete_identity_index', 'derive_full_schema_reference_classification_and_typed_equalities', 'regenerate_selected_traversal_resolution_and_correlations', 'finalize_manifest_envelope_hash_resource_spec_and_schema_change', 'capture_immutable_final_semantic_source_snapshot', 'regenerate_reference_registry_owner_graph_and_manifest', 'seal_final_output'], post_fixture_or_semantic_authority_mutation: 'forbidden_after_corresponding_snapshot' }

// Content addresses are raw SHA-256 over the exact canonical bytes. Fingerprints remain separately domain-separated.
r50.authority_operation_persisted_identity_primitives = {
  schema_version: 'ctrl.g24.authority-operation-persisted-identity-primitives.r50.v1',
  canonical_payload_content_address: { schema_version: 'ctrl.g24.canonical-payload-content-address.r50.v1', identity_kind: 'payload_content_address', exact_formula: 'sha256_raw_canonical_payload_bytes_utf8', preimage_exact_keys: ['canonical_payload_bytes_utf8'], domain_prefix: 'NONE', digest: 'sha256', codec_ref: 'canonical_json_utf8_encoding' },
  canonical_authority_row_content_address: { schema_version: 'ctrl.g24.canonical-authority-row-content-address.r50.v1', identity_kind: 'authority_row_content_address', exact_formula: 'sha256_raw_canonical_authority_row_bytes_utf8', preimage_exact_keys: ['canonical_authority_row_bytes_utf8'], domain_prefix: 'NONE', digest: 'sha256', codec_ref: 'canonical_json_utf8_encoding' },
  nonce_receipt_content_address: { schema_version: 'ctrl.g24.nonce-receipt-content-address.r50.v1', identity_kind: 'nonce_receipt_ref', exact_formula: 'sha256_raw_proof_nonce_receipt_payload_bytes_utf8', preimage_exact_keys: ['proof_nonce_receipt_payload_bytes_utf8'], domain_prefix: 'NONE', digest: 'sha256', codec_ref: 'canonical_json_utf8_encoding' },
  generic_payload_fingerprint: { ...structuredClone(materializedR49.authority_operation_persisted_identity_primitives.generic_payload_fingerprint), identity_kind: 'payload_fingerprint', exact_formula: 'sha256_of_existing_domain_separated_canonical_preimage' },
  identity_type_separation: { payload_content_address: 'raw_sha256_only', authority_row_content_address: 'raw_sha256_only', nonce_receipt_ref: 'raw_sha256_only', payload_fingerprint: 'declared_domain_preimage', wrapper_fingerprint: 'selected_wrapper_schema_fingerprint', row_fingerprint: 'selected_row_schema_fingerprint', row_version_ref: 'selected_committed_target_identity_authority' },
  raw_sha256_must_not_equal_domain_separated_hash_by_substitution: true
}
r50.canonical_json_utf8_encoding = { ...r50.canonical_json_utf8_encoding, schema_version: 'ctrl.g24.canonical-json-utf8-encoding.r50.v1', sha256_canonical_payload_bytes_utf8: r50.authority_operation_persisted_identity_primitives.canonical_payload_content_address, sha256_canonical_authority_row_bytes_utf8: r50.authority_operation_persisted_identity_primitives.canonical_authority_row_content_address }
r50.proof_nonce_ledger.row_schema.nonce_receipt_ref_content_address_rule = r50.authority_operation_persisted_identity_primitives.nonce_receipt_content_address

// Deterministic fixture-only verifier keys are real Ed25519 keys and signatures, never runtime trust roots.
r50.fingerprint_schemas.authority_verifier_public_key_r50 = { schema_version: 'ctrl.g24.fingerprint.authority-verifier-public-key.r50.v1', domain_ascii: 'CTRL-G24-R50-AUTHORITY-VERIFIER-PUBLIC-KEY', preimage_order: ['domain_ascii', 'verifier_ref', 'verifier_version_ref', 'public_key_algorithm', 'public_key_spki_der_sha256'], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
r50.authority_verifier_public_key_artifact_schema = closed('ctrl.g24.authority-verifier-public-key-artifact.r50.v1', { verifier_ref: id, verifier_version_ref: id, public_key_algorithm: { const: 'ed25519' }, public_key_spki_der_b64url: { type: 'base64url_without_padding' }, public_key_spki_der_sha256: fp, key_fingerprint: fp }, { fingerprint_ref: 'fingerprint_schemas.authority_verifier_public_key_r50', fingerprint_field: 'key_fingerprint', fixture_only: true, runtime_trust_authority: false })
const proofStoreTemplate = r50.authority_operation_artifact_stores.families.proofs.stores_by_schema_ref.schema_3
r50.authority_verifier_public_key_artifact_store = { ...structuredClone(proofStoreTemplate), schema_version: 'ctrl.g24.authority-verifier-public-key-artifact-store.r50.v1', canonical_schema_ref: 'authority_verifier_public_key_artifact_schema', row_schema: { ...structuredClone(proofStoreTemplate.row_schema), schema_version: 'ctrl.g24.authority-verifier-public-key-artifact-row.r50.v1' }, fixture_only: true, runtime_trust_authority: false }

function keyPair(label) {
  const prefix = Buffer.from('302e020100300506032b657004220420', 'hex'), seed = createHash('sha256').update(`CTRL-G24-R50:${label}`).digest()
  const privateKey = createPrivateKey({ key: Buffer.concat([prefix, seed]), format: 'der', type: 'pkcs8' })
  const publicKey = createPublicKey(privateKey), spki = publicKey.export({ format: 'der', type: 'spki' })
  return { privateKey, publicKey, spki }
}
function signedProof(fixtureId, role, family, keyArtifact, authorityRow, rootRow, targetPartitionFingerprint, operationName, nonce, times) {
  const schemaRef = family === 'issuer' ? 'case_session_issuer_capability_proof_schema' : 'case_session_evaluator_capability_proof_schema', schema = schemaAt(schemaRef)
  const rolePrefix = family, proofRef = sha(`${fixtureId}:${role}:proof-ref`)
  const base = fill(schema, `${fixtureId}:${role}`, { proof_ref: proofRef, [`${rolePrefix}_ref`]: authorityRow.canonical_row_value[`${rolePrefix}_ref`], [`${rolePrefix}_row_version_ref`]: authorityRow.canonical_row_value.row_version_ref, [`${rolePrefix}_registry_fingerprint`]: authorityRow.recorded_fingerprint, root_anchor_row_version_ref: rootRow.canonical_row_value.row_version_ref, root_anchor_fingerprint: rootRow.recorded_fingerprint, scope_operation_name: operationName, scope_target_store: 'case_server_session_principal_evidence', scope_partition_fingerprint: targetPartitionFingerprint, nonce, issued_at: times.issued, expires_at: times.expires, verifier_ref: keyArtifact.payload_value.verifier_ref, verifier_version_ref: keyArtifact.payload_value.verifier_version_ref, verifier_artifact_sha256: keyArtifact.ref, signature_b64url: '', proof_fingerprint: '0'.repeat(64) })
  const signedRule = r50.proof_signed_preimages[family], signedPreimage = {}
  for (const field of signedRule.field_order) signedPreimage[field] = field === 'domain_ascii' ? signedRule.domain_ascii : base[field]
  const pair = keyPair(family), signature = sign(null, Buffer.from(canonicalR44(signedPreimage), 'utf8'), pair.privateKey)
  if (signature.length !== 64 || !verify(null, Buffer.from(canonicalR44(signedPreimage), 'utf8'), pair.publicKey, signature)) throw new Error(`R50_signature:${family}`)
  return makeContent(fixtureId, role, schemaRef, 'UNAVAILABLE', { ...base, signature_b64url: signature.toString('base64url') })
}
function projectionFormula(field, values) {
  const rule = r50.session_dual_proof_projection_formula_table.formulas.find(item => item.projection_field === field)
  if (!rule) throw new Error(`R50_projection_formula:${field}`)
  const preimage = {}
  for (const key of rule.ordered_preimage) preimage[key] = key === 'domain_ascii' ? rule.domain_ascii : values[key]
  return hash(preimage)
}

const sessionFixtureId = 'identity_session_committed', sessionOp = 'issue_server_session_principal', operationId = 'op_identity_session_committed_r50'
const priorSession = r50.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role
const rootFixture = r50.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed').artifact_store_by_role
const rootRow = rootFixture.committed_target_row
const at = '2026-09-14T12:00:00.000Z', proofIssued = '2026-09-14T11:00:00.000Z', proofExpires = '2026-09-14T13:00:00.000Z', authorityValidFrom = '2026-09-14T10:00:00.000Z', authorityValidUntil = '2026-09-14T14:00:00.000Z'
const workspace = priorSession.target_intent.payload_value.workspace_ref
const targetIntent = makeContent(sessionFixtureId, 'target_intent', priorSession.target_intent.payload_schema_ref, priorSession.target_intent.payload_schema_variant, { ...priorSession.target_intent.payload_value, workspace_ref: workspace, issued_at: proofIssued, expires_at: '2027-09-14T00:00:00.000Z', valid_until: '2027-09-14T00:00:00.000Z' })
const partitionFields = r50.case_server_session_principal_evidence_partition_schema.exact_keys
const targetPartitionFingerprint = hash({ domain_ascii: r50.target_partition_fingerprint_schema.domain_ascii, target_store: 'case_server_session_principal_evidence', ordered_partition_field_names: partitionFields, ordered_partition_field_values: partitionFields.map(field => targetIntent.payload_value[field]) })
const issuerPair = keyPair('issuer'), evaluatorPair = keyPair('evaluator')
const issuerKey = makeContent(sessionFixtureId, 'issuer_verifier_key', 'authority_verifier_public_key_artifact_schema', 'UNAVAILABLE', { verifier_ref: sha('r50:issuer:verifier-ref'), verifier_version_ref: sha('r50:issuer:verifier-version'), public_key_spki_der_b64url: issuerPair.spki.toString('base64url'), public_key_spki_der_sha256: sha(issuerPair.spki) })
const evaluatorKey = makeContent(sessionFixtureId, 'evaluator_verifier_key', 'authority_verifier_public_key_artifact_schema', 'UNAVAILABLE', { verifier_ref: sha('r50:evaluator:verifier-ref'), verifier_version_ref: sha('r50:evaluator:verifier-version'), public_key_spki_der_b64url: evaluatorPair.spki.toString('base64url'), public_key_spki_der_sha256: sha(evaluatorPair.spki) })

function authorityRegistryRow(role, keyArtifact) {
  const schemaRef = `authoritative_row_schemas.case_session_${role}_registry`, schema = schemaAt(schemaRef), refField = `${role}_ref`, versionField = `${role}_version_ref`, artifactField = `${role}_artifact_sha256`, classField = role === 'issuer' ? 'authority_class' : 'capability_class'
  const withoutIdentity = fill(schema, `${sessionFixtureId}:${role}:registry`, { [refField]: keyArtifact.payload_value.verifier_ref, [versionField]: keyArtifact.payload_value.verifier_version_ref, [artifactField]: keyArtifact.ref, [classField]: role === 'issuer' ? 'case_session_principal_issuer' : 'case_session_authority_evaluator', valid_from: authorityValidFrom, valid_until: authorityValidUntil, trust_anchor_ref: rootRow.canonical_row_value.trust_anchor_ref, trust_anchor_version_ref: rootRow.canonical_row_value.trust_anchor_version_ref, trust_anchor_artifact_sha256: rootRow.canonical_row_value.trust_anchor_artifact_sha256, standing: 'active', authority_order: 1 })
  delete withoutIdentity.row_version_ref; delete withoutIdentity[`${role}_registry_fingerprint`]
  const version = rowVersion(`case_session_${role}_registry`, withoutIdentity)
  return makeRow(sessionFixtureId, `${role}_registry_row`, schemaRef, 'UNAVAILABLE', { ...withoutIdentity, row_version_ref: version.ref, [`${role}_registry_fingerprint`]: '0'.repeat(64) }, version.preimage)
}
const issuerRegistryRow = authorityRegistryRow('issuer', issuerKey), evaluatorRegistryRow = authorityRegistryRow('evaluator', evaluatorKey)
const issuerProof = signedProof(sessionFixtureId, 'issuer_proof', 'issuer', issuerKey, issuerRegistryRow, rootRow, targetPartitionFingerprint, sessionOp, sha('r50:issuer:nonce'), { issued: proofIssued, expires: proofExpires })
const evaluatorProof = signedProof(sessionFixtureId, 'evaluator_proof', 'evaluator', evaluatorKey, evaluatorRegistryRow, rootRow, targetPartitionFingerprint, sessionOp, sha('r50:evaluator:nonce'), { issued: proofIssued, expires: proofExpires })
const issuerNonceSubject = projectionFormula('issuer_nonce_subject_fingerprint', { selected_issuer_ref: issuerRegistryRow.canonical_row_value.issuer_ref, selected_issuer_row_version_ref: issuerRegistryRow.canonical_row_value.row_version_ref, selected_issuer_registry_fingerprint: issuerRegistryRow.recorded_fingerprint })
const evaluatorNonceSubject = projectionFormula('evaluator_nonce_subject_fingerprint', { selected_evaluator_ref: evaluatorRegistryRow.canonical_row_value.evaluator_ref, selected_evaluator_row_version_ref: evaluatorRegistryRow.canonical_row_value.row_version_ref, selected_evaluator_registry_fingerprint: evaluatorRegistryRow.recorded_fingerprint })
const issuerVerifierIdentity = projectionFormula('issuer_verifier_identity_fingerprint', { proof_verifier_ref: issuerProof.payload_value.verifier_ref, proof_verifier_version_ref: issuerProof.payload_value.verifier_version_ref, proof_verifier_artifact_sha256: issuerProof.payload_value.verifier_artifact_sha256, selected_issuer_registry_fingerprint: issuerRegistryRow.recorded_fingerprint })
const evaluatorVerifierIdentity = projectionFormula('evaluator_verifier_identity_fingerprint', { proof_verifier_ref: evaluatorProof.payload_value.verifier_ref, proof_verifier_version_ref: evaluatorProof.payload_value.verifier_version_ref, proof_verifier_artifact_sha256: evaluatorProof.payload_value.verifier_artifact_sha256, selected_evaluator_registry_fingerprint: evaluatorRegistryRow.recorded_fingerprint })
const bundle = makeContent(sessionFixtureId, 'bundle', priorSession.bundle.payload_schema_ref, priorSession.bundle.payload_schema_variant, { ...priorSession.bundle.payload_value, operation_name: sessionOp, workspace_ref: workspace, target_partition_fingerprint: targetPartitionFingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce: issuerProof.payload_value.nonce, issuer_nonce_subject_fingerprint: issuerNonceSubject, issuer_verifier_identity_fingerprint: issuerVerifierIdentity, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce: evaluatorProof.payload_value.nonce, evaluator_nonce_subject_fingerprint: evaluatorNonceSubject, evaluator_verifier_identity_fingerprint: evaluatorVerifierIdentity })
const projection = makeContent(sessionFixtureId, 'bundle_truth_projection', priorSession.bundle_truth_projection.payload_schema_ref, priorSession.bundle_truth_projection.payload_schema_variant, { ...priorSession.bundle_truth_projection.payload_value, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, decoded_target_workspace_ref: workspace, selected_current_partition_workspace_ref: workspace, selected_issuer_authority_fingerprint: issuerRegistryRow.recorded_fingerprint, selected_evaluator_authority_fingerprint: evaluatorRegistryRow.recorded_fingerprint, selected_issuer_verifier_fingerprint: issuerVerifierIdentity, selected_evaluator_verifier_fingerprint: evaluatorVerifierIdentity, operation_name: sessionOp, workspace_ref: workspace, target_partition_fingerprint: targetPartitionFingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce: issuerProof.payload_value.nonce, issuer_nonce_subject_fingerprint: issuerNonceSubject, issuer_verifier_identity_fingerprint: issuerVerifierIdentity, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce: evaluatorProof.payload_value.nonce, evaluator_nonce_subject_fingerprint: evaluatorNonceSubject, evaluator_verifier_identity_fingerprint: evaluatorVerifierIdentity })
const issuerNonce = makeNonce(sessionFixtureId, 'issuer_nonce_receipt', 'issuer', issuerProof, operationId, 'committed', issuerProof.payload_value.nonce, issuerNonceSubject, issuerVerifierIdentity)
const evaluatorNonce = makeNonce(sessionFixtureId, 'evaluator_nonce_receipt', 'evaluator', evaluatorProof, operationId, 'committed', evaluatorProof.payload_value.nonce, evaluatorNonceSubject, evaluatorVerifierIdentity)
const readSet = makeContent(sessionFixtureId, 'authority_read_set', priorSession.authority_read_set.payload_schema_ref, priorSession.authority_read_set.payload_schema_variant, { ...priorSession.authority_read_set.payload_value, trust_anchor_ref: rootRow.canonical_row_value.trust_anchor_ref, trust_anchor_version_ref: rootRow.canonical_row_value.trust_anchor_version_ref, trust_anchor_fingerprint: rootRow.recorded_fingerprint, root_anchor_row_version_ref: rootRow.canonical_row_value.row_version_ref, workspace_ref: workspace, issuer_ref: issuerRegistryRow.canonical_row_value.issuer_ref, issuer_row_version_ref: issuerRegistryRow.canonical_row_value.row_version_ref, issuer_registry_fingerprint: issuerRegistryRow.recorded_fingerprint, evaluator_ref: evaluatorRegistryRow.canonical_row_value.evaluator_ref, evaluator_row_version_ref: evaluatorRegistryRow.canonical_row_value.row_version_ref, evaluator_registry_fingerprint: evaluatorRegistryRow.recorded_fingerprint, dual_proof_bundle_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint })
const request = makeContent(sessionFixtureId, 'request', priorSession.request.payload_schema_ref, priorSession.request.payload_schema_variant, { ...priorSession.request.payload_value, operation_name: sessionOp, operation_id: operationId, target_partition_fingerprint: targetPartitionFingerprint, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, dual_proof_bundle_bytes_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint })
const sessionTargetSchema = schemaAt('authoritative_row_schemas.case_server_session_principal_evidence'), sessionWithoutIdentity = { ...targetIntent.payload_value, valid_from: at, authority_order: 1 }
delete sessionWithoutIdentity.row_version_ref; delete sessionWithoutIdentity.session_principal_fingerprint
const sessionVersion = rowVersion('case_server_session_principal_evidence', sessionWithoutIdentity)
const sessionTarget = makeRow(sessionFixtureId, 'committed_target_row', 'authoritative_row_schemas.case_server_session_principal_evidence', 'UNAVAILABLE', { ...sessionWithoutIdentity, row_version_ref: sessionVersion.ref, session_principal_fingerprint: '0'.repeat(64) }, sessionVersion.preimage)
const receiptEvidence = makeContent(sessionFixtureId, 'receipt_evidence', priorSession.receipt_evidence.payload_schema_ref, priorSession.receipt_evidence.payload_schema_variant, { ...priorSession.receipt_evidence.payload_value, operation_name: sessionOp, operation_id: operationId, dual_proof_bundle_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, authority_read_set_ref: readSet.ref, authority_read_set_bytes_sha256: readSet.bytes_sha256, authority_read_set_fingerprint: readSet.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint })

function makeReceipt(base, resultFactory) {
  const variant = 'session_dual_proof_committed', schema = schemaAt('authority_operation_receipt_store.row_union', variant), authority = r50.authority_operation_receipt_materialization_authority.variants[variant]
  const refPreimage = { domain_ascii: authority.receipt_ref_preimage_schema.domain_ascii, schema_version: schema.schema_version, variant, ordered_fields: schema.receipt_ref_preimage_fields.map(field => ({ field, value: base[field] })) }
  const receiptRef = hash(refPreimage), rule = get(r50, schema.receipt_precommit_fingerprint_ref), preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : field === 'receipt_ref' ? receiptRef : base[field]
  const preFp = hash(preimage), result = resultFactory(receiptRef, preFp)
  const receipt = makeRow(sessionFixtureId, 'receipt', 'authority_operation_receipt_store.row_union', variant, { ...base, receipt_ref: receiptRef, receipt_precommit_fingerprint: preFp, result_bytes_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_fingerprint: '0'.repeat(64) }, refPreimage, 'receipt_row')
  return { result, receipt }
}
const receiptSchema = schemaAt('authority_operation_receipt_store.row_union', 'session_dual_proof_committed')
const receiptBase = fill(receiptSchema, `${sessionFixtureId}:receipt`, { ...priorSession.receipt.canonical_row_value, receipt_ref: '0'.repeat(64), receipt_precommit_fingerprint: '0'.repeat(64), request_fingerprint: request.fingerprint, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, target_row_bytes_ref: sessionTarget.content_addressed_artifact_ref, target_row_bytes_sha256: sessionTarget.canonical_row_bytes_sha256, target_row_fingerprint: sessionTarget.recorded_fingerprint, result_bytes_ref: '0'.repeat(64), result_bytes_sha256: '0'.repeat(64), result_fingerprint: '0'.repeat(64), server_committed_at: at, dual_proof_bundle_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, authority_read_set_ref: readSet.ref, authority_read_set_bytes_sha256: readSet.bytes_sha256, authority_read_set_fingerprint: readSet.fingerprint, receipt_evidence_ref: receiptEvidence.ref, receipt_evidence_bytes_sha256: receiptEvidence.bytes_sha256, receipt_evidence_fingerprint: receiptEvidence.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint, receipt_fingerprint: '0'.repeat(64) })
const made = makeReceipt(receiptBase, (receiptRef, preFp) => makeContent(sessionFixtureId, 'result', priorSession.result.payload_schema_ref, priorSession.result.payload_schema_variant, { ...priorSession.result.payload_value, operation_name: sessionOp, operation_id: operationId, target_row_version_ref: sessionVersion.ref, target_row_fingerprint: sessionTarget.recorded_fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: preFp, committed_at: at }))
const historyMatrix = r50.authority_operation_historical_response_schema_matrix.rows.find(row => row.operation_name === sessionOp && row.result_branch === 'committed')
const history = makeContent(sessionFixtureId, 'history', 'authority_operation_historical_response_schema', 'UNAVAILABLE', { operation_name: sessionOp, operation_id: operationId, result_branch: 'committed', response_schema_ref: historyMatrix.response_schema_ref, response_schema_version: historyMatrix.response_schema_version, response_payload_ref: made.result.ref, response_payload_bytes_sha256: made.result.bytes_sha256, result_ref: made.result.ref, result_bytes_sha256: made.result.bytes_sha256, result_fingerprint: made.result.fingerprint })
const selection = r50.authority_operation_fresh_branch_class_selection.rows.find(row => row.operation_name === sessionOp && row.result_branch === 'committed')
const registrySchema = schemaAt('authority_operation_registry.row_union', 'original_committed')
const registryRow = fill(registrySchema, `${sessionFixtureId}:registry`, { durable_state: 'original_committed', target_store: 'case_server_session_principal_evidence', operation_name: sessionOp, operation_id: operationId, idempotency_key: request.payload_value.idempotency_key, request_fingerprint: request.fingerprint, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, target_intent_fingerprint: targetIntent.fingerprint, committed_target_row_ref: sessionTarget.canonical_row_value.row_version_ref, committed_target_row_bytes_sha256: sessionTarget.canonical_row_bytes_sha256, committed_target_row_fingerprint: sessionTarget.recorded_fingerprint, result_branch: 'committed', result_ref: made.result.ref, result_bytes_sha256: made.result.bytes_sha256, result_fingerprint: made.result.fingerprint, receipt_ref: made.receipt.canonical_row_value.receipt_ref, receipt_precommit_fingerprint: made.receipt.canonical_row_value.receipt_precommit_fingerprint, receipt_fingerprint: made.receipt.recorded_fingerprint, server_committed_at: at, fresh_selection_row_id: selection.selection_row_id, proof_family: selection.proof_family, branch_class: selection.branch_class, evidence_kind: selection.evidence_kind, fresh_selection_schema_version: selection.selector_schema_version, historical_response_ref: history.ref, historical_response_bytes_sha256: history.bytes_sha256, historical_response_fingerprint: history.fingerprint, registry_row_ref: '0'.repeat(64), registry_fingerprint: '0'.repeat(64) })
registryRow.registry_row_ref = hash({ domain_ascii: registrySchema.row_ref_domain_ascii, schema_version: registrySchema.row_ref_schema_version, ordered_fields: registrySchema.row_ref_preimage_included_fields.map(field => ({ field, value: registryRow[field] })) })
const registry = makeRow(sessionFixtureId, 'registry', 'authority_operation_registry.row_union', 'original_committed', registryRow, { domain_ascii: registrySchema.row_ref_domain_ascii, schema_version: registrySchema.row_ref_schema_version, ordered_fields: registrySchema.row_ref_preimage_included_fields.map(field => ({ field, value: registryRow[field] })) }, 'registry_row')
const replayPayload = makeContent(sessionFixtureId, 'replay_payload', priorSession.replay_payload.payload_schema_ref, priorSession.replay_payload.payload_schema_variant, { ...priorSession.replay_payload.payload_value, operation_name: sessionOp, operation_id: operationId, historical_result_branch: 'committed', historical_result_ref: made.result.ref, historical_result_bytes_sha256: made.result.bytes_sha256, historical_result_fingerprint: made.result.fingerprint, stored_historical_response_ref: history.ref, stored_historical_response_bytes_sha256: history.bytes_sha256, stored_historical_response_fingerprint: history.fingerprint, committed_registry_row_ref: registryRow.registry_row_ref, committed_registry_row_fingerprint: registry.recorded_fingerprint })
const replayEnvelope = makeContent(sessionFixtureId, 'replay_envelope', priorSession.replay_envelope.payload_schema_ref, priorSession.replay_envelope.payload_schema_variant, { ...priorSession.replay_envelope.payload_value, operation_name: sessionOp, operation_id: operationId, historical_result_branch: 'committed', payload_ref: replayPayload.ref, payload_bytes_sha256: replayPayload.bytes_sha256, payload_fingerprint: replayPayload.fingerprint, replay_response_ref: history.ref, replay_response_bytes_sha256: history.bytes_sha256, replay_response_fingerprint: history.fingerprint })
const sessionStore = { target_intent: targetIntent, issuer_verifier_key: issuerKey, evaluator_verifier_key: evaluatorKey, issuer_registry_row: issuerRegistryRow, evaluator_registry_row: evaluatorRegistryRow, committed_target_row: sessionTarget, issuer_proof: issuerProof, evaluator_proof: evaluatorProof, bundle_truth_projection: projection, bundle, issuer_nonce_receipt: issuerNonce, evaluator_nonce_receipt: evaluatorNonce, authority_read_set: readSet, request, receipt_evidence: receiptEvidence, result: made.result, receipt: made.receipt, history, registry, replay_payload: replayPayload, replay_envelope: replayEnvelope }
r50.authority_operation_committed_receipt_identity_fixtures = { ...r50.authority_operation_committed_receipt_identity_fixtures, schema_version: 'ctrl.g24.authority-operation-committed-receipt-identity-fixtures.r50.v1', fixture_id: sessionFixtureId, exact_required_roles: Object.keys(sessionStore), artifact_store_by_role: sessionStore, artifact_view_role_refs: Object.fromEntries(Object.keys(sessionStore).map(role => [role, role])), consistency_contract: { exact_selected_issuer_and_evaluator_registry_rows_materialized: true, selected_row_proof_readset_and_projection_fingerprints_identical: true, deterministic_ed25519_signatures_valid: true, proof_window_strictly_contains_commit: true, projection_formulas_recomputed_from_selected_rows_and_key_artifacts: true, downstream_regenerated_in_dependency_order: true } }
r50.authority_operation_signature_fixture_authority = { schema_version: 'ctrl.g24.authority-operation-signature-fixture-authority.r50.v1', fixture_only: true, runtime_trust_authority: false, algorithm: 'ed25519', deterministic_seed_derivation: 'sha256_of_exact_CTRL_G24_R50_role_label_then_pkcs8_ed25519_seed_encoding', signed_preimage_authority_ref: 'proof_signed_preimages', public_key_artifact_schema_ref: 'authority_verifier_public_key_artifact_schema', exact_signature_bytes: 64, checker_must_verify_both_signatures_cryptographically: true }

// Enumerate the complete persisted payload, wrapper and durable-row universe after every store is final.
function collectStores() {
  const rows = [], seen = new Set()
  const walk = (value, path = '$') => {
    if (!value || typeof value !== 'object') return
    if (typeof value.canonical_schema_ref === 'string' && value.row_schema?.properties) {
      const key = `${value.canonical_schema_ref}|${value.row_schema.schema_version}|${path}`
      if (!seen.has(key)) { seen.add(key); rows.push({ store_path: path.replace(/^\$\.?/, ''), payload_schema_ref: value.canonical_schema_ref, wrapper_schema_ref: `${path.replace(/^\$\.?/, '')}.row_schema`, wrapper_schema_version: value.row_schema.schema_version, wrapper_fingerprint_ref: value.row_schema.fingerprint_ref }) }
    }
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
  }
  walk(r50)
  return rows.sort((a, b) => cp(`${a.payload_schema_ref}|${a.store_path}`, `${b.payload_schema_ref}|${b.store_path}`))
}
const stores = collectStores(), operations = Object.entries(r50.case_session_authority_operation_protocols.operations)
const requestSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.request_schema`).sort(cp)
const targetSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.target_intent_schema`).sort(cp)
const proofSchemas = ['case_session_root_bootstrap_proof_schema', 'case_session_root_admin_capability_proof_schema', 'case_session_issuer_capability_proof_schema', 'case_session_evaluator_capability_proof_schema'].sort(cp)
const resultSchemas = operations.flatMap(([name, operation]) => Object.keys(operation.result_schema.variants).map(variant => `case_session_authority_operation_protocols.operations.${name}.result_schema.variants.${variant}`)).sort(cp)
const targetStores = [...new Set(operations.map(([, operation]) => operation.target_store ?? operation.request_schema.properties.target_store.const))].sort(cp)
const committedTargetSchemas = targetStores.map(store => `authoritative_row_schemas.${store}`).sort(cp)
const persistedPayloadSchemas = [...new Set(stores.map(row => row.payload_schema_ref))].sort(cp)
const persistedPayloadVariants = persistedPayloadSchemas.flatMap(schema_ref => { const schema = get(r50, schema_ref); return schema?.variants ? Object.keys(schema.variants).map(variant => ({ schema_ref, variant })) : [{ schema_ref, variant: 'UNAVAILABLE' }] }).sort((a, b) => cp(`${a.schema_ref}|${a.variant}`, `${b.schema_ref}|${b.variant}`))
const persistedWrapperSchemas = stores.map(row => ({ store_path: row.store_path, schema_ref: row.wrapper_schema_ref, variant: 'UNAVAILABLE', schema_version: row.wrapper_schema_version, fingerprint_ref: row.wrapper_fingerprint_ref }))
const persistedRowVariants = [...Object.keys(r50.authority_operation_registry.row_union.variants).map(variant => ({ schema_ref: 'authority_operation_registry.row_union', variant })), ...Object.keys(r50.authority_operation_hold_store.row_union.variants).map(variant => ({ schema_ref: 'authority_operation_hold_store.row_union', variant })), ...Object.keys(r50.authority_operation_receipt_store.row_union.variants).map(variant => ({ schema_ref: 'authority_operation_receipt_store.row_union', variant })), ...committedTargetSchemas.map(schema_ref => ({ schema_ref, variant: 'UNAVAILABLE' })), { schema_ref: 'proof_nonce_ledger.row_schema', variant: 'UNAVAILABLE' }]
r50.authority_operation_complete_active_persisted_schema_universe = { schema_version: 'ctrl.g24.authority-operation-complete-active-persisted-schema-universe.r50.v1', derivation: 'independent_enumeration_from_all_operation_protocols_all_content_addressed_stores_all_wrapper_schemas_and_all_durable_row_unions', operation_count: operations.length, request_schema_count: requestSchemas.length, request_schema_refs: requestSchemas, target_schema_count: targetSchemas.length, target_schema_refs: targetSchemas, proof_schema_count: proofSchemas.length, proof_schema_refs: proofSchemas, result_schema_count: resultSchemas.length, result_schema_refs: resultSchemas, committed_target_store_count: targetStores.length, committed_target_schema_refs: committedTargetSchemas, persisted_payload_schema_count: persistedPayloadSchemas.length, persisted_payload_schema_refs: persistedPayloadSchemas, persisted_payload_variant_count: persistedPayloadVariants.length, persisted_payload_variants: persistedPayloadVariants, persisted_wrapper_schema_count: persistedWrapperSchemas.length, persisted_wrapper_schemas: persistedWrapperSchemas, persisted_row_variant_count: persistedRowVariants.length, persisted_row_variants: persistedRowVariants, content_addressed_store_count: stores.length, content_addressed_stores: stores, fixtures_are_exemplars_not_inventory_authority: true }

function payloadRule(schemaRef) {
  const requestMatch = schemaRef.match(/^case_session_authority_operation_protocols\.operations\.([^.]+)\.request_schema$/)
  if (requestMatch) return `case_session_authority_operation_protocols.operations.${requestMatch[1]}.request_fingerprint`
  const resultMatch = schemaRef.match(/^case_session_authority_operation_protocols\.operations\.([^.]+)\.result_schema\.variants\./)
  if (resultMatch) return `case_session_authority_operation_protocols.operations.${resultMatch[1]}.result_fingerprint`
  return get(r50, schemaRef)?.fingerprint_ref ?? 'authority_operation_persisted_identity_primitives.generic_payload_fingerprint'
}
const identityAuthorities = {}, identityIndex = [], identitySeen = new Set()
function executionFixture(kind, formula, persistedSchemaRef, variant) {
  const bytes = Buffer.from(`CTRL-G24-R50-IDENTITY-FORMULA:${kind}`, 'utf8')
  if (formula.formula_class === 'raw_sha256_bytes') return { input_kind: 'raw_bytes', input_b64url: bytes.toString('base64url'), expected_identity: sha(bytes) }
  const authority = get(r50, formula.authority_ref)
  if (!authority) throw new Error(`R50_identity_formula_authority:${kind}:${formula.authority_ref}`)
  let ruleKind, preimage
  if (Array.isArray(authority.preimage_order)) {
    ruleKind = 'ordered_fingerprint_preimage'
    preimage = {}
    for (const field of authority.preimage_order) preimage[field] = field === 'domain_ascii' ? authority.domain_ascii : `r50_formula_${sha(`${kind}:${field}`).slice(0, 24)}`
  } else if (authority.receipt_ref_preimage_schema) {
    ruleKind = 'receipt_ref_preimage'
    const schema = schemaAt(persistedSchemaRef, variant)
    preimage = { domain_ascii: authority.receipt_ref_preimage_schema.domain_ascii, schema_version: schema.schema_version, variant, ordered_fields: authority.receipt_ref_preimage_schema.ordered_fields.map(field => ({ field, value: valueForSpec(schema.properties[field], `${kind}:${field}`) })) }
  } else if (Array.isArray(authority.row_ref_preimage_included_fields)) {
    ruleKind = 'durable_row_ref_preimage'
    const schema = schemaAt(persistedSchemaRef, variant)
    preimage = { domain_ascii: authority.row_ref_domain_ascii, schema_version: authority.row_ref_schema_version, ordered_fields: authority.row_ref_preimage_included_fields.map(field => ({ field, value: valueForSpec(schema.properties[field], `${kind}:${field}`) })) }
  } else if (Array.isArray(authority.row_version_preimage_exact_keys)) {
    ruleKind = 'committed_row_version_preimage'
    const schema = schemaAt(persistedSchemaRef, variant)
    const excluded = new Set(['row_version_ref', schema.fingerprint_field])
    const fields = schema.exact_keys.filter(field => !excluded.has(field)).sort(cp)
    preimage = { domain_ascii: authority.row_version_domain_ascii, schema_version: authority.row_version_schema_version, ordered_complete_mutable_authority_fields: fields.map(field => ({ field, value: valueForSpec(schema.properties[field], `${kind}:${field}`) })) }
  } else throw new Error(`R50_unexecutable_identity_formula:${kind}:${formula.authority_ref}`)
  return { input_kind: 'declared_canonical_preimage', declared_rule_kind: ruleKind, exact_authority_ref: formula.authority_ref, exact_preimage: preimage, expected_identity: hash(preimage) }
}
function addIdentity(kind, persistedSchemaRef, variant, formula, sourceFamily) {
  if (identitySeen.has(kind)) throw new Error(`R50_duplicate_identity_kind:${kind}`)
  identitySeen.add(kind); const key = `identity_${String(identityIndex.length + 1).padStart(4, '0')}`
  identityAuthorities[key] = { schema_version: 'ctrl.g24.persisted-identity-authority.r50.v1', identity_kind: kind, persisted_schema_ref: persistedSchemaRef, persisted_schema_variant: variant, source_universe_family: sourceFamily, formula, executable_formula_fixture: executionFixture(kind, formula, persistedSchemaRef, variant) }
  identityIndex.push({ identity_kind: kind, persisted_schema_ref: persistedSchemaRef, persisted_schema_variant: variant, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: 'ctrl.g24.persisted-identity-authority.r50.v1', source_universe_family: sourceFamily })
}
for (const entry of persistedPayloadVariants) {
  const schemaRef = entry.schema_ref, variant = entry.variant, family = requestSchemas.includes(schemaRef) ? 'request' : targetSchemas.includes(schemaRef) ? 'target' : proofSchemas.includes(schemaRef) ? 'proof' : resultSchemas.includes(schemaRef) ? 'result' : 'supporting_payload'
  addIdentity(`payload_content_address:${schemaRef}:${variant}`, schemaRef, variant, { identity_kind: 'payload_content_address', formula_class: 'raw_sha256_bytes', authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', exact_input: 'canonical_payload_bytes_utf8' }, family)
  addIdentity(`payload_fingerprint:${schemaRef}:${variant}`, schemaRef, variant, { identity_kind: 'payload_fingerprint', formula_class: 'declared_domain_preimage', authority_ref: payloadRule(variant === 'UNAVAILABLE' ? schemaRef : `${schemaRef}.variants.${variant}`) }, family)
}
for (const wrapper of persistedWrapperSchemas) addIdentity(`wrapper_fingerprint:${wrapper.store_path}:${wrapper.schema_version}`, wrapper.schema_ref, 'UNAVAILABLE', { identity_kind: 'wrapper_fingerprint', formula_class: 'declared_domain_preimage', authority_ref: wrapper.fingerprint_ref, store_path: wrapper.store_path }, 'content_addressed_wrapper')
for (const row of persistedRowVariants) {
  const schema = schemaAt(row.schema_ref, row.variant), key = `${row.schema_ref}:${row.variant}`
  addIdentity(`authority_row_content_address:${key}`, row.schema_ref, row.variant, { identity_kind: 'authority_row_content_address', formula_class: 'raw_sha256_bytes', authority_ref: 'authority_operation_persisted_identity_primitives.canonical_authority_row_content_address', exact_input: 'canonical_authority_row_bytes_utf8' }, 'durable_row')
  if (schema.fingerprint_ref) addIdentity(`row_fingerprint:${key}`, row.schema_ref, row.variant, { identity_kind: 'row_fingerprint', formula_class: 'declared_domain_preimage', authority_ref: schema.fingerprint_ref }, 'durable_row')
  if (schema.properties.registry_row_ref) addIdentity(`registry_row_ref:${row.variant}`, row.schema_ref, row.variant, { identity_kind: 'registry_row_ref', formula_class: 'declared_domain_preimage', authority_ref: `${row.schema_ref}.variants.${row.variant}` }, 'registry')
  if (schema.properties.hold_row_ref) addIdentity(`hold_row_ref:${row.variant}`, row.schema_ref, row.variant, { identity_kind: 'hold_row_ref', formula_class: 'declared_domain_preimage', authority_ref: `${row.schema_ref}.variants.${row.variant}` }, 'hold')
  if (row.schema_ref === 'authority_operation_receipt_store.row_union' && schema.properties.receipt_ref) {
    addIdentity(`receipt_ref:${row.variant}`, row.schema_ref, row.variant, { identity_kind: 'receipt_ref', formula_class: 'declared_domain_preimage', authority_ref: `authority_operation_receipt_materialization_authority.variants.${row.variant}` }, 'receipt')
    addIdentity(`receipt_precommit_fingerprint:${row.variant}`, row.schema_ref, row.variant, { identity_kind: 'receipt_precommit_fingerprint', formula_class: 'declared_domain_preimage', authority_ref: schema.receipt_precommit_fingerprint_ref }, 'receipt')
    addIdentity(`receipt_final_fingerprint:${row.variant}`, row.schema_ref, row.variant, { identity_kind: 'receipt_final_fingerprint', formula_class: 'declared_domain_preimage', authority_ref: schema.fingerprint_ref }, 'receipt')
  }
  if (schema.properties.row_version_ref) { const store = row.schema_ref.split('.').at(-1); addIdentity(`row_version_ref:${row.schema_ref}`, row.schema_ref, row.variant, { identity_kind: 'row_version_ref', formula_class: 'declared_domain_preimage', authority_ref: `authority_operation_committed_target_identity_authority.variants.${store}` }, 'committed_target') }
  if (schema.properties.nonce_receipt_ref) addIdentity(`nonce_receipt_ref:${key}`, row.schema_ref, row.variant, { identity_kind: 'nonce_receipt_ref', formula_class: 'raw_sha256_bytes', authority_ref: 'authority_operation_persisted_identity_primitives.nonce_receipt_content_address', exact_input: 'proof_nonce_receipt_payload_bytes_utf8' }, 'nonce_receipt')
}
r50.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r50.authority_operation_artifact_fingerprint_derivation_authority = { ...r50.authority_operation_artifact_fingerprint_derivation_authority, schema_version: 'ctrl.g24.authority-operation-artifact-fingerprint-derivation-authority.r50.v1', active_normative_authority: true, complete_active_schema_universe_ref: 'authority_operation_complete_active_persisted_schema_universe', sole_active_identity_index_derivation: 'mechanically_from_complete_active_persisted_payload_wrapper_and_row_universe_not_fixtures', sole_active_identity_index: identityIndex.sort((a, b) => cp(a.identity_kind, b.identity_kind)), exact_identity_kind_count: identityIndex.length, every_indexed_formula_has_executable_fixture: true, checker_executes_every_formula_and_every_materialized_artifact: true, fixtures_are_exemplars_only: true, missing_extra_duplicate_unresolved_or_unexecutable_identity_authority: 'reject_materialization_and_hold_without_disclosure_or_write' }

// Complete schema-field classification and typed companion equalities are derived from the full universe.
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key) && !/(fingerprint|sha256)$/.test(key)
const schemaReferenceFields = new Set(['authority_proof_schema_ref','dual_proof_bundle_schema_ref','evaluator_proof_schema_ref','hold_schema_ref','issuer_proof_schema_ref','response_schema_ref','target_intent_schema_ref','target_row_schema_ref'])
const optionalRawFields = new Set(['raw_bundle_ref_or_unavailable','raw_evaluator_proof_ref_or_unavailable','raw_issuer_proof_ref_or_unavailable','raw_proof_ref_or_unavailable','raw_target_ref_or_unavailable','session_hold_evidence_ref_or_unavailable'])
const externalFields = new Set(['account_binding_ref','account_binding_row_version_ref','account_ref','account_standing_ref','account_standing_row_version_ref','case_binding_ref','case_binding_row_version_ref','case_ref','decoded_target_workspace_ref','deployment_configuration_ref','evaluator_ref','evaluator_row_version_ref','evaluator_version_ref','evidence_ref','expected_head_row_version_ref','issuer_ref','issuer_row_version_ref','issuer_version_ref','live_principal_assertion_bytes_ref','pinned_runtime_attestor_ref','presented_principal_projection_bytes_ref','prior_anchor_version_ref','prior_row_version_ref','proof_ref','root_anchor_row_version_ref','selected_current_partition_workspace_ref','server_session_ref','session_evidence_ref','session_evidence_row_version_ref','session_ref','signer_1_ref','signer_2_ref','stable_actor_ref','trust_anchor_ref','trust_anchor_version_ref','verifier_ref','verifier_version_ref','workspace_ref'])
const allSchemaEntries = [...persistedPayloadVariants, ...persistedWrapperSchemas.map(row => ({ schema_ref: row.schema_ref, variant: 'UNAVAILABLE' })), ...persistedRowVariants]
function schemaCompanions(schema, field) {
  const exact = {
    target_intent_bytes_ref: [['target_intent_bytes_sha256'], Object.hasOwn(schema.properties, 'target_intent_fingerprint') ? ['target_intent_fingerprint'] : []],
    authority_proof_bytes_ref: [['authority_proof_bytes_sha256'], Object.hasOwn(schema.properties, 'authority_proof_fingerprint') ? ['authority_proof_fingerprint'] : []],
    dual_proof_bundle_bytes_ref: [['dual_proof_bundle_bytes_sha256'], ['dual_proof_bundle_fingerprint']],
    target_row_bytes_ref: [['target_row_bytes_sha256'], ['target_row_fingerprint']],
    request_bytes_ref: [['request_bytes_sha256'], ['request_fingerprint']],
    result_bytes_ref: [['result_bytes_sha256'], ['result_fingerprint']],
    historical_response_ref: [['historical_response_bytes_sha256'], ['historical_response_fingerprint']],
    stored_historical_response_ref: [['stored_historical_response_bytes_sha256'], ['stored_historical_response_fingerprint']],
    replay_response_ref: [['replay_response_bytes_sha256'], ['replay_response_fingerprint']]
  }
  if (exact[field]) return { bytes: exact[field][0].filter(name => Object.hasOwn(schema.properties, name)), fingerprints: exact[field][1].filter(name => Object.hasOwn(schema.properties, name)) }
  const base = field.replace(/_ref(_or_unavailable)?$/, ''), suffix = field.endsWith('_or_unavailable') ? '_or_unavailable' : ''
  const bytes = [`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`, field === 'request_artifact_ref' ? 'request_artifact_sha256' : '', field === 'response_payload_ref' ? 'response_payload_bytes_sha256' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  const fingerprints = [`${base}_fingerprint${suffix}`, field === 'hold_row_ref' ? 'hold_fingerprint' : '', field === 'receipt_ref' ? 'receipt_precommit_fingerprint' : '', field === 'response_payload_ref' ? 'result_fingerprint' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  return { bytes: [...new Set(bytes)].sort(cp), fingerprints: [...new Set(fingerprints)].sort(cp) }
}
function targetSchema(schema, field) {
  const constField = field === 'target_intent_bytes_ref' ? 'target_intent_schema_ref' : field === 'authority_proof_bytes_ref' ? 'authority_proof_schema_ref' : field === 'dual_proof_bundle_bytes_ref' ? 'dual_proof_bundle_schema_ref' : null
  if (constField && schema.properties[constField]?.const) return { ref: schema.properties[constField].const, variant: 'UNAVAILABLE' }
  const fixed = { issuer_proof_ref: 'case_session_issuer_capability_proof_schema', evaluator_proof_ref: 'case_session_evaluator_capability_proof_schema', dual_proof_bundle_ref: 'session_dual_proof_bundle_schema', bundle_truth_projection_ref: 'session_dual_proof_bundle_truth_projection_schema', authority_read_set_ref: 'case_session_authority_read_set_schema', receipt_evidence_ref: 'session_dual_proof_receipt_evidence_schema', historical_response_ref: 'authority_operation_historical_response_schema', stored_historical_response_ref: 'authority_operation_historical_response_schema', replay_response_ref: 'authority_operation_historical_response_schema' }
  if (fixed[field]) return { ref: fixed[field], variant: 'UNAVAILABLE' }
  if (field.includes('registry_row_ref')) return { ref: 'authority_operation_registry.row_union', variant: 'DISCRIMINATED_BY_DURABLE_STATE' }
  if (field.includes('hold_row_ref')) return { ref: 'authority_operation_hold_store.row_union', variant: 'DISCRIMINATED_BY_PROOF_FAMILY_AND_EVIDENCE_KIND' }
  if (field === 'receipt_ref') return { ref: 'authority_operation_receipt_store.row_union', variant: 'DISCRIMINATED_BY_PROOF_FAMILY' }
  if (field.includes('result_ref') || field === 'response_payload_ref') return { ref: 'case_session_authority_operation_protocols.operations', variant: 'DISCRIMINATED_BY_OPERATION_AND_RESULT_BRANCH' }
  if (field.includes('row_version_ref')) return { ref: 'authoritative_row_schemas', variant: 'DISCRIMINATED_BY_TARGET_STORE' }
  return { ref: 'UNAVAILABLE', variant: 'UNAVAILABLE' }
}
function classifyField(schema, field) {
  if (schemaReferenceFields.has(field)) return 'closed_semantic_schema_reference'
  if (optionalRawFields.has(field)) return 'closed_optional_raw_or_unavailable_identity'
  if (externalFields.has(field)) return 'closed_runtime_or_external_authority_identity'
  return 'internal_content_artifact_or_authority_row_reference'
}
function targetKind(field, classification) {
  if (classification !== 'internal_content_artifact_or_authority_row_reference') return classification
  if (field.includes('registry_row_ref')) return 'registry_row_ref'
  if (field.includes('hold_row_ref')) return 'hold_row_ref'
  if (field.includes('row_version_ref')) return 'row_version_ref'
  if (field === 'receipt_ref') return 'receipt_ref'
  return 'payload_or_authority_row_content_address'
}
const classificationMap = new Map(), equalityMap = new Map()
for (const item of allSchemaEntries) {
  const schema = schemaAt(item.schema_ref, item.variant)
  if (!schema?.exact_keys) continue
  for (const field of schema.exact_keys.filter(refToken)) {
    const classification = classifyField(schema, field), companions = schemaCompanions(schema, field), key = `${item.schema_ref}|${item.variant}|${field}`
    classificationMap.set(key, { source_schema_ref: item.schema_ref, source_schema_variant: item.variant, source_field: field, source_field_type: schema.properties[field]?.type ?? 'const', classification, internal_exact_one_required: classification === 'internal_content_artifact_or_authority_row_reference' })
    const target = targetSchema(schema, field)
    equalityMap.set(key, { source_schema_ref: item.schema_ref, source_schema_variant: item.variant, source_field: field, source_field_type: schema.properties[field]?.type ?? 'const', target_schema_ref_or_UNAVAILABLE: target.ref, target_schema_variant_or_UNAVAILABLE: target.variant, target_identity_kind_or_classification: targetKind(field, classification), exact_one_resolution_required: classification === 'internal_content_artifact_or_authority_row_reference', companion_bytes_fields: companions.bytes.map(name => ({ field: name, type: schema.properties[name]?.type ?? 'const' })), companion_fingerprint_fields: companions.fingerprints.map(name => ({ field: name, type: schema.properties[name]?.type ?? 'const' })), target_intent_fingerprint_required_when_present: field === 'target_intent_bytes_ref' && Object.hasOwn(schema.properties, 'target_intent_fingerprint') })
  }
}
const sortRows = rows => rows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
r50.authority_operation_explicit_nonartifact_reference_field_allowlist = { schema_version: 'ctrl.g24.authority-operation-complete-schema-reference-classification.r50.v1', derivation: 'independently_pinned_field_vocabulary_applied_to_complete_active_persisted_payload_wrapper_and_row_schema_universe', exact_rows: sortRows([...classificationMap.values()]), exact_schema_reference_field_count: classificationMap.size, generic_unmatched_runtime_or_external_fallback: 'forbidden', internal_artifact_or_authority_row_reference_may_use_allowlist: false, issue_case_session_issuer_five_reference_fields_must_classify_exactly: true }
r50.authority_operation_complete_schema_cross_artifact_equality_registry = { schema_version: 'ctrl.g24.authority-operation-complete-schema-cross-artifact-equality-registry.r50.v1', derivation: 'mechanically_from_every_reference_field_in_complete_active_persisted_payload_wrapper_and_row_schema_universe', exact_rows: sortRows([...equalityMap.values()]), exact_typed_equality_count: equalityMap.size, selected_fixture_subset_is_authority: false, checker_executes_schema_field_type_companion_and_selected_artifact_value_equalities: true }

function artifactSchema(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? schemaAt(artifact.payload_schema_ref, artifact.payload_schema_variant) : schemaAt(artifact.schema_ref, artifact.schema_variant) }
function artifactValue(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_value : artifact.canonical_row_value }
function identities(role, artifact) {
  if (artifact.fixture_wrapper_variant === 'content_addressed') return [{ role, identity_kind: 'payload_content_address', ref: artifact.ref, bytes_sha256: artifact.bytes_sha256, fingerprint: artifact.fingerprint }]
  const rows = [{ role, identity_kind: 'authority_row_content_address', ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }], value = artifact.canonical_row_value
  if (value.registry_row_ref) rows.push({ role, identity_kind: 'registry_row_ref', ref: value.registry_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
  if (value.hold_row_ref) rows.push({ role, identity_kind: 'hold_row_ref', ref: value.hold_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
  if (value.row_version_ref) rows.push({ role, identity_kind: 'row_version_ref', ref: value.row_version_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
  if (role === 'receipt') { rows.push({ role, identity_kind: 'receipt_precommit_ref', ref: value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: value.receipt_precommit_fingerprint }); rows.push({ role, identity_kind: 'receipt_final_ref', ref: value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }) }
  return rows
}
function companionNames(sourceRole, field, value) {
  if (field === 'target_intent_bytes_ref') return ['target_intent_bytes_sha256', Object.hasOwn(value, 'target_intent_fingerprint') ? 'target_intent_fingerprint' : null]
  if (field === 'authority_proof_bytes_ref') return ['authority_proof_bytes_sha256', Object.hasOwn(value, 'authority_proof_fingerprint') ? 'authority_proof_fingerprint' : null]
  if (field === 'dual_proof_bundle_bytes_ref') return ['dual_proof_bundle_bytes_sha256', 'dual_proof_bundle_fingerprint']
  if (field === 'target_row_bytes_ref') return ['target_row_bytes_sha256', 'target_row_fingerprint']
  if (field === 'request_bytes_ref') return ['request_bytes_sha256', 'request_fingerprint']
  if (field === 'result_bytes_ref') return ['result_bytes_sha256', 'result_fingerprint']
  if (field === 'historical_response_ref') return ['historical_response_bytes_sha256', 'historical_response_fingerprint']
  if (field === 'stored_historical_response_ref') return ['stored_historical_response_bytes_sha256', 'stored_historical_response_fingerprint']
  if (field === 'replay_response_ref') return ['replay_response_bytes_sha256', 'replay_response_fingerprint']
  if (field === 'response_payload_ref') return ['response_payload_bytes_sha256', 'result_fingerprint']
  if (field === 'request_artifact_ref') return ['request_artifact_sha256', 'request_fingerprint']
  if (field === 'result_ref') return ['result_bytes_sha256', 'result_fingerprint']
  if (field === 'hold_result_ref') return ['hold_result_bytes_sha256', 'hold_result_fingerprint']
  if (field === 'hold_row_ref') return [null, sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint']
  if (field === 'receipt_ref') return [null, sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint']
  if (field === 'committed_target_row_ref') return ['committed_target_row_bytes_sha256', 'committed_target_row_fingerprint']
  if (field === 'target_row_version_ref') return [null, 'target_row_fingerprint']
  if (field === 'held_registry_row_ref') return [null, 'held_registry_row_fingerprint']
  if (field === 'committed_registry_row_ref') return [null, 'committed_registry_row_fingerprint']
  const suffix = field.endsWith('_or_unavailable') ? '_or_unavailable' : '', base = field.replace(/_ref(_or_unavailable)?$/, '')
  return [[`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(candidate => Object.hasOwn(value, candidate)) ?? null, `${base}_fingerprint${suffix}`]
}
const roleStores = [...r50.authority_operation_replay_restart_fixtures.fixtures.map(f => ({ fixture_id: f.fixture_id, store: f.artifact_store_by_role })), { fixture_id: sessionFixtureId, store: sessionStore }]
const resolutionRows = [], selfRows = [], nonArtifactRows = []
for (const branch of roleStores) {
  const all = Object.entries(branch.store).flatMap(([role, artifact]) => identities(role, artifact))
  for (const [sourceRole, artifact] of Object.entries(branch.store)) {
    const schema = artifactSchema(artifact), value = artifactValue(artifact), schemaRef = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, variant = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant
    if (!schema?.exact_keys) continue
    for (const field of schema.exact_keys.filter(refToken)) {
      const reference = value[field], classification = classificationMap.get(`${schemaRef}|${variant}|${field}`)
      if (!classification) throw new Error(`R50_missing_full_schema_classification:${schemaRef}:${variant}:${field}`)
      if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonArtifactRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference ?? null, classification: 'closed_null_or_unavailable_sentinel' }); continue }
      if ((field === 'hold_row_ref' && sourceRole === 'hold') || (field === 'registry_row_ref' && sourceRole === 'registry') || (field === 'row_version_ref' && ['committed_target_row', 'issuer_registry_row', 'evaluator_registry_row'].includes(sourceRole))) { selfRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
      let matches = all.filter(candidate => candidate.ref === reference), nonSelf = matches.filter(candidate => candidate.role !== sourceRole); if (nonSelf.length) matches = nonSelf
      if (!nonSelf.length && matches.length) { selfRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
      if (matches.length > 1 && matches.every(candidate => candidate.role === 'receipt')) matches = matches.filter(candidate => candidate.identity_kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
      if (field === 'hold_row_ref') matches = matches.filter(candidate => candidate.identity_kind === 'hold_row_ref' && candidate.role === 'hold')
      if (field === 'held_registry_row_ref' || field === 'committed_registry_row_ref') matches = matches.filter(candidate => candidate.identity_kind === 'registry_row_ref')
      if (field === 'target_row_version_ref') matches = matches.filter(candidate => candidate.identity_kind === 'row_version_ref')
      if (!matches.length) {
        if (classification.internal_exact_one_required) throw new Error(`R50_unresolved_internal_reference:${branch.fixture_id}:${sourceRole}:${field}`)
        nonArtifactRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: classification.classification }); continue
      }
      if (matches.length !== 1) throw new Error(`R50_selected_reference_match:${branch.fixture_id}:${sourceRole}:${field}:${matches.length}`)
      const target = matches[0], [bytesField, fingerprintField] = companionNames(sourceRole, field, value), actualBytes = bytesField && Object.hasOwn(value, bytesField) ? value[bytesField] : 'UNAVAILABLE', actualFingerprint = fingerprintField && Object.hasOwn(value, fingerprintField) ? value[fingerprintField] : 'UNAVAILABLE'
      if (actualBytes !== 'UNAVAILABLE' && actualBytes !== target.bytes_sha256) throw new Error(`R50_reference_bytes:${branch.fixture_id}:${sourceRole}:${field}`)
      if (actualFingerprint !== 'UNAVAILABLE' && actualFingerprint !== target.fingerprint) throw new Error(`R50_reference_fingerprint:${branch.fixture_id}:${sourceRole}:${field}`)
      resolutionRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, target_role: target.role, target_identity_kind: target.identity_kind, reference, companion_bytes_field_or_UNAVAILABLE: actualBytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : bytesField, companion_bytes_sha256_or_UNAVAILABLE: actualBytes, companion_fingerprint_field_or_UNAVAILABLE: actualFingerprint === 'UNAVAILABLE' ? 'UNAVAILABLE' : fingerprintField, companion_fingerprint_or_UNAVAILABLE: actualFingerprint, exact_match_count: 1 })
    }
  }
}
sortRows(resolutionRows); sortRows(selfRows); sortRows(nonArtifactRows)
const correlations = resolutionRows.flatMap((row, index) => ['reference', 'companion_bytes_or_explicit_unavailable', 'companion_fingerprint_or_explicit_unavailable'].map(kind => ({ correlation_id: `r50:${String(index + 1).padStart(4, '0')}:${kind}`, ...row, correlation_kind: kind })))
r50.authority_operation_selected_reference_traversal_authority = { schema_version: 'ctrl.g24.authority-operation-selected-reference-traversal-authority.r50.v1', final_role_store_snapshot_sha256: hash(roleStores), source: 'independent_traversal_of_every_reference_field_in_every_final_selected_closed_role_store_using_complete_schema_classification', explicit_nonartifact_allowlist_ref: 'authority_operation_explicit_nonartifact_reference_field_allowlist', exact_selected_artifact_reference_count: resolutionRows.length, exact_self_reference_count: selfRows.length, exact_non_artifact_reference_count: nonArtifactRows.length, self_identity_allowlist: selfRows, non_artifact_reference_allowlist: nonArtifactRows, post_generation_artifact_mutation: 'forbidden' }
r50.authority_operation_artifact_resolution_authority = { schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r50.v1', traversal_authority_ref: 'authority_operation_selected_reference_traversal_authority', final_role_store_snapshot_sha256: hash(roleStores), zero_matches_for_internal_reference: 'hold_without_disclosure_or_write', multiple_matches: 'hold_without_disclosure_or_write', exact_resolution_count: resolutionRows.length, rows: resolutionRows }
r50.authority_operation_restart_correlation_authority = { schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r50.v1', traversal_authority_ref: 'authority_operation_selected_reference_traversal_authority', complete_schema_equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', final_role_store_snapshot_sha256: hash(roleStores), derivation: 'mechanical_three_way_projection_of_every_final_selected_exact_one_artifact_reference', exact_row_count: correlations.length, rows: correlations, sole_verifier: true }
r50.fixture_schema_validator = { ...r50.fixture_schema_validator, schema_version: 'ctrl.g24.fixture-schema-validator.r50.v1', validation_scope: 'complete_payload_wrapper_row_schema_universe_identity_formula_execution_valid_ed25519_authority_lineage_full_schema_classification_typed_equalities_and_selected_restart_resolution' }

// Every nonderived semantic source is final before this snapshot and seal stage begins.
r50.semantic_reference_field_specification = { ...materializedR44.semantic_reference_field_specification, schema_version: 'ctrl.g24.semantic-reference-field-specification.r50.v1', source: 'independently_pinned_R44_reference_vocabulary_extended_over_final_immutable_R50_semantic_source_snapshot' }
const semanticAuthorityPaths = [...new Set([...r49SemanticAuthorityPaths, 'authority_verifier_public_key_artifact_schema', 'authority_verifier_public_key_artifact_store', 'authority_operation_signature_fixture_authority'])].sort(cp)
const excludedDerived = new Set(['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry'])
const sourcePaths = semanticAuthorityPaths.filter(path => !excludedDerived.has(path)), derivedTargets = ['authority_runtime_semantic_manifest']
const frozenTargets = [...new Set(materializedR49.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.map(row => row.exact_target_path_or_UNAVAILABLE).filter(path => path !== 'UNAVAILABLE'))].sort(cp)
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r50.v1'
r50.authority_runtime_semantic_manifest_hash_contract = { ...r50.authority_runtime_semantic_manifest_hash_contract, schema_version: hashVersion, content_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R50', dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R50', graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R50', envelope_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R50', source_snapshot_must_be_recomputed_from_final_emitted_nonderived_bytes: true }
r50.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r50.v1', derivation: 'bounded_exact_extension_from_frozen_R49_executable_identity_valid_signed_authority_lineage_and_full_schema_equalities', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.status', '$.supersedes', '$.authority_operation_persisted_identity_primitives', '$.canonical_json_utf8_encoding', '$.proof_nonce_ledger', '$.fingerprint_schemas.authority_verifier_public_key_r50', '$.authority_verifier_public_key_artifact_schema', '$.authority_verifier_public_key_artifact_store', '$.authority_operation_signature_fixture_authority', '$.authority_operation_committed_receipt_identity_fixtures', '$.authority_operation_complete_active_persisted_schema_universe', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_explicit_nonartifact_reference_field_allowlist', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_selected_reference_traversal_authority', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.semantic_reference_field_specification', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: [], every_changed_or_new_semantic_object_has_r50_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r50.required_negative_fixture_families = [...new Set([...r50.required_negative_fixture_families, 'raw_vs_domain_identity_formula_mismatch', 'complete_wrapper_fingerprint_identity_universe', 'valid_ed25519_dual_authority_lineage', 'complete_schema_reference_classification', 'executable_typed_schema_equalities', 'final_byte_semantic_snapshot'])]
r50.visible_surface_changes = []; r50.external_actions_authorized = []
r50.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r50.v1', { schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r50.v1' }, type: { const: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest' }, snapshot_pipeline_ref: { const: 'owned_immutable_canonical_snapshot_pipeline' }, resource_limits_ref: { const: 'canonical_snapshot_resource_limits' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, reference_field_specification_ref: { const: 'semantic_reference_field_specification' }, reference_field_registry_ref: { const: 'authority_runtime_semantic_reference_field_registry' }, source_snapshot_sha256: fp, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, manifest_graph_sha256: fp, manifest_envelope_seal_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
delete r50.authority_runtime_semantic_manifest; delete r50.authority_runtime_semantic_dependency_owner_map; delete r50.authority_runtime_semantic_reference_owner_map; delete r50.authority_runtime_semantic_reference_field_registry

const snapshot = ownedSnapshotR44(r50), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R50-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_source_paths: sourcePaths, source_objects: Object.fromEntries(sourcePaths.map(path => [path, get(snapshot, path)])) })
const aliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
const derivedVersions = { authority_runtime_semantic_manifest: 'ctrl.g24.runtime-semantic-authority-manifest.r50.v1', authority_runtime_semantic_reference_field_registry: 'ctrl.g24.runtime-semantic-reference-field-registry.r50.v1', authority_runtime_semantic_reference_owner_map: 'ctrl.g24.runtime-semantic-reference-owner-map.r50.v1', authority_runtime_semantic_dependency_owner_map: 'ctrl.g24.runtime-semantic-dependency-owner-map.r50.v1' }
function version(path, value) { if (value?.schema_version) return value.schema_version; return materializedR49.authority_runtime_semantic_manifest.rows.find(row => row.authority_path === path)?.authority_schema_version ?? 'ctrl.g24.semantic-authority.unversioned-frozen.v1' }
function owner(path) { let selected = ''; for (const p of semanticAuthorityPaths) if ((path === p || path.startsWith(`${p}.`)) && p.length > selected.length) selected = p; return selected }
function target(reference) { if (aliases[reference]) return aliases[reference]; const normalized = reference.replace(/^\$\./, ''); if (normalized.includes('*') || reference.includes('_or_') || reference.includes('|') || reference.includes(':')) return 'UNAVAILABLE'; if (semanticAuthorityPaths.some(path => normalized === path || normalized.startsWith(`${path}.`)) || derivedTargets.includes(normalized) || frozenTargets.includes(normalized)) return normalized; return 'UNAVAILABLE' }
function targetVersion(path) { if (path === 'UNAVAILABLE') return 'UNAVAILABLE'; let cursor = path; while (cursor) { if (derivedVersions[cursor]) return derivedVersions[cursor]; const value = get(snapshot, cursor); if (value?.schema_version) return value.schema_version; const cut = cursor.lastIndexOf('.'); if (cut < 0) break; cursor = cursor.slice(0, cut) } return version(path, get(snapshot, path)) }
const semanticRows = [], semanticSeen = new Set(), nonSuffix = new Set(r50.semantic_reference_field_specification.exact_non_suffix_semantic_fields)
function addSemantic(source, fieldPath, fieldName, literal, pattern) { const t = target(literal), key = `${source}|${fieldPath}|${literal}`; if (semanticSeen.has(key)) return; semanticSeen.add(key); const o = t === 'UNAVAILABLE' ? source : owner(t) || source; semanticRows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : t !== 'UNAVAILABLE' ? (fieldName.includes('schema') ? 'exact_nested_schema_reference' : 'exact_nested_semantic_reference') : literal.includes('*') ? 'discriminated_wildcard_reference' : literal.includes('_or_') || literal.includes('|') ? 'closed_discriminated_compound_reference' : 'runtime_identity_or_field_reference', reference_literal: literal, owner_authority_path: o, expected_owner_schema_version: targetVersion(o), exact_target_path_or_UNAVAILABLE: t, exact_target_schema_version_or_UNAVAILABLE: targetVersion(t), runtime_identity_kind_or_UNAVAILABLE: t === 'UNAVAILABLE' ? 'runtime_identity_or_field_reference' : 'UNAVAILABLE', specification_pattern_id: pattern }) }
function walkSemantic(value, source, path = source) { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { const next = `${path}.${key}`, selected = refToken(key) || nonSuffix.has(key); if (selected) { if (Array.isArray(item)) item.forEach((entry, index) => { if (typeof entry === 'string') addSemantic(source, `${next}.${index}`, key, entry, refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') }); else if (typeof item === 'string') addSemantic(source, next, key, item, refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } if (typeof item === 'string') { const t = target(item); if (t !== 'UNAVAILABLE' && owner(t) !== source) addSemantic(source, next, key, item, 'semantic_value') } walkSemantic(item, source, next) } }
for (const path of sourcePaths) if (path !== 'semantic_reference_field_specification') walkSemantic(get(snapshot, path), path)
semanticRows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
r50.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r50.v1', specification_ref: 'semantic_reference_field_specification', source_snapshot_domain_ascii: 'CTRL-G24-R50-FINAL-SEMANTIC-SOURCE-SNAPSHOT', source_snapshot_sha256: snapshotSha, independently_declared_source_paths: sourcePaths, independently_declared_derived_target_paths: derivedTargets, independently_declared_frozen_target_paths: frozenTargets, excluded_self_derived_paths: [...excludedDerived].sort(cp), derivation_order: r50.materialization.strict_finalization_dag, post_snapshot_source_mutation: 'forbidden', row_schema: closed('ctrl.g24.runtime-semantic-reference-field-registry-row.r50.v1', { source_authority_path: id, field_path: id, field_name: id, reference_kind: id, reference_literal: id, owner_authority_path: id, expected_owner_schema_version: id, exact_target_path_or_UNAVAILABLE: id, exact_target_schema_version_or_UNAVAILABLE: id, runtime_identity_kind_or_UNAVAILABLE: id, specification_pattern_id: id }), exact_occurrence_rows: semanticRows, exact_expected_occurrence_count: semanticRows.length, occurrence_bijection: 'independent_rescan_of_final_emitted_nonderived_source_objects_equals_rows_byte_for_byte', unknown_reference_semantics: 'reject_materialization_and_hold_without_disclosure_or_write' }
r50.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r50.v1', specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', source_snapshot_sha256: snapshotSha, row_count: semanticRows.length, ownership_rule: 'recomputed_only_from_final_snapshot_registry_rows' }
const occurrences = {}; for (const row of semanticRows) if (row.owner_authority_path !== row.source_authority_path) (occurrences[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const priorOwners = Object.fromEntries(materializedR49.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(priorOwners[path] ?? []), ...[...(occurrences[path] ?? [])]])].filter(p => semanticAuthorityPaths.includes(p) && p !== path).sort(cp), unqualified_legacy_alias_owner_path: path }))
r50.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r50.v1', source_snapshot_sha256: snapshotSha, exact_paths: semanticAuthorityPaths, rows: ownerRows, reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', owner_map_derivation: 'exactly_from_final_registry_rows_plus_frozen_explicit_non_reference_dependencies', unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write' }
const contentHash = (path, value) => hash({ domain_ascii: r50.authority_runtime_semantic_manifest_hash_contract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(value) }), depHash = (path, scope, rows) => hash({ domain_ascii: r50.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows })
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, get(r50, path))])), graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = get(r50, path), direct = graph[path].map(p => ({ authority_path: p, authority_content_sha256: contentHashes[p] })), all = transitive(path).map(p => ({ authority_path: p, authority_content_sha256: contentHashes[p] })); return { authority_path: path, semantic_kind: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value, exact_keyset: value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort(cp) : [], authority_schema_ref: path, authority_schema_version: version(path, value), direct_dependency_paths: direct.map(row => row.authority_path), direct_dependency_content_hashes: direct, direct_dependency_set_sha256: depHash(path, 'direct', direct), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: depHash(path, 'transitive', all), authority_content_sha256: contentHashes[path] } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r50.v1', type: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest', snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', resource_limits_ref: 'canonical_snapshot_resource_limits', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', source_snapshot_sha256: snapshotSha, exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, manifest_graph_sha256: hash({ domain_ascii: r50.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: manifestRows }) }
r50.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: r50.authority_runtime_semantic_manifest_hash_contract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifestWithoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r50)
export const materializedR50 = r50
export const materializedR50Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r50SemanticAuthorityPaths = semanticAuthorityPaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR50Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR50Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R50 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
