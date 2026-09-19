import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR48, r48SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r48.mjs'
import { canonicalR44, ownedSnapshotR44, materializedR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r48.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r49.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const r49 = structuredClone(materializedR48)
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (path, variant = 'UNAVAILABLE') => { const schema = get(r49, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
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
  return `r49_${sha(seed).slice(0, 24)}`
}
function fill(schema, seed, overrides = {}) { const row = {}; for (const [field, spec] of Object.entries(schema.properties)) row[field] = valueForSpec(spec, `${seed}:${field}`); return Object.assign(row, overrides) }
function fingerprint(schema, row) {
  const rule = get(r49, schema.fingerprint_ref)
  if (!rule?.preimage_order) throw new Error(`R49_fingerprint_schema:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]
  return { schema_ref: schema.fingerprint_ref, preimage, value: hash(preimage) }
}
const selectedStoreCache = new Map()
function selectedStore(schemaRef) {
  if (selectedStoreCache.has(schemaRef)) return selectedStoreCache.get(schemaRef)
  const found = []
  const walk = value => { if (!value || typeof value !== 'object') return; if (value.canonical_schema_ref === schemaRef && value.row_schema?.properties) found.push(value); for (const child of Object.values(value)) walk(child) }
  walk(r49)
  const unique = [...new Set(found)]
  if (unique.length !== 1) throw new Error(`R49_selected_store:${schemaRef}:${unique.length}`)
  selectedStoreCache.set(schemaRef, unique[0])
  return unique[0]
}
function payloadFingerprint(role, schemaRef, variant, payload) {
  const schema = schemaAt(schemaRef, variant)
  if (schema.fingerprint_field) return fingerprint(schema, payload)
  if (role === 'result') {
    const rule = r49.case_session_authority_operation_protocols.operations[payload.operation_name].result_fingerprint, body = {}
    for (const field of schema.exact_keys) if (field !== 'result_fingerprint') body[field] = payload[field]
    const preimage = { domain_ascii: rule.domain_ascii, operation_name: payload.operation_name, operation_id: payload.operation_id, branch: payload.branch, branch_specific_canonical_payload_sha256: hash(body) }
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.result_fingerprint`, preimage, value: hash(preimage) }
  }
  if (role === 'request') {
    const rule = r49.case_session_authority_operation_protocols.operations[payload.operation_name].request_fingerprint, preimage = {}
    for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : payload[field]
    return { schema_ref: `case_session_authority_operation_protocols.operations.${payload.operation_name}.request_fingerprint`, preimage, value: hash(preimage) }
  }
  const bytes = canonicalR44(payload), preimage = { domain_ascii: 'CTRL-G24-R49-PERSISTED-PAYLOAD', schema_ref: schemaRef, canonical_bytes_sha256: sha(Buffer.from(bytes, 'utf8')) }
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
  const payloadSchema = r49.proof_nonce_receipt_payload_schema
  const payload = fill(payloadSchema, `${fixtureId}:${role}`, { proof_family: proofFamily, nonce_subject_fingerprint: subject, nonce, proof_fingerprint: proof.fingerprint, verifier_identity_fingerprint: verifier, target_store: 'case_server_session_principal_evidence', operation_id: operationId, consumed_on_branch: branch, consumed_at: '2026-09-14T12:00:00.000Z' })
  const bytes = canonicalR44(payload), bytesHash = sha(Buffer.from(bytes, 'utf8')), rowSchema = r49.proof_nonce_ledger.row_schema, row = { ...payload, nonce_receipt_ref: bytesHash, nonce_receipt_fingerprint: '0'.repeat(64) }
  const derived = fingerprint(rowSchema, row); row.nonce_receipt_fingerprint = derived.value
  return { artifact_role: role, fixture_wrapper_variant: 'content_addressed', selected_store_authority_schema_version: r49.proof_nonce_receipt_store.schema_version, selected_wrapper_schema_version: rowSchema.schema_version, payload_schema_ref: 'proof_nonce_receipt_payload_schema', payload_schema_variant: 'UNAVAILABLE', payload_schema_version: payloadSchema.schema_version, payload_value: payload, payload_canonical_bytes_utf8: bytes, payload_bytes_sha256: bytesHash, payload_fingerprint: derived.value, ref: bytesHash, bytes_sha256: bytesHash, fingerprint: derived.value, stored_row_value: row, stored_row_canonical_bytes_sha256: hash(row), stored_row_fingerprint: derived.value, declared_payload_fingerprint_schema_ref: rowSchema.fingerprint_ref, declared_payload_fingerprint_preimage: derived.preimage, declared_wrapper_fingerprint_schema_ref: rowSchema.fingerprint_ref, declared_wrapper_fingerprint_preimage: derived.preimage, content_address_rule_verified: true }
}
function makeRow(fixtureId, role, schemaRef, variant, row, preimage, wrapperVariant) {
  const schema = schemaAt(schemaRef, variant), derived = fingerprint(schema, row); row[schema.fingerprint_field] = derived.value
  const bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8'))
  return { fixture_artifact_id: `${fixtureId}:${role}`, artifact_role: role, fixture_wrapper_variant: wrapperVariant, schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, normative_row_ref_preimage: preimage, canonical_row_value: row, canonical_row_bytes_utf8: bytes, canonical_row_bytes_sha256: bytesHash, content_addressed_artifact_ref: bytesHash, fingerprint_schema_ref: derived.schema_ref, fingerprint_preimage: derived.preimage, recorded_fingerprint: derived.value, declared_payload_fingerprint_schema_ref: derived.schema_ref, declared_payload_fingerprint_preimage: derived.preimage }
}
function rowRef(schema, row) { return hash({ domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: schema.row_ref_preimage_included_fields.map(field => ({ field, value: row[field] })) }) }
function selection(operationName) { const row = r49.authority_operation_fresh_branch_class_selection.rows.find(item => item.operation_name === operationName && item.result_branch === 'committed'); if (!row) throw new Error(`R49_selection:${operationName}`); return row }

r49.schema_version = 'ctrl.g24.trusted-ingress.r49.effective.v1'
r49.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r48_vetoed', 'trusted_ingress_r49_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r49.supersedes = { commit: '840400dbceb9a561d86536b6742f7ffa2628eeb4', tree: '9305badda4913afe3ff38f144b243419e78554dd', human_blob: 'f88df59c1d6eb823d5bf1303235087d284deb814', machine_blob: '65ea004500bb9b85584409b0001aa454ea8cfe7f', qa_blob: '724ab4e646e48c487a57df81408f48d5521bb3f1', checker_blob: 'f7086b76e1319ea1f27d1779b79427ac638f9b56', materializer_blob: 'd812ed0c72a56d619a99bd57f740189b285432d0', founder_checker_blob: '0b9c5159be7439c52cee1163ce97d37acdae0a42', adjudication: 'veto' }
r49.materialization = { ...r49.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r49.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['finalize_schema_and_identity_authorities', 'reissue_complete_time_valid_session_fixture', 'reissue_every_affected_committed_lineage', 'capture_immutable_final_role_stores', 'enumerate_complete_active_persisted_schema_universe', 'derive_exact_identity_authority_index', 'regenerate_selected_reference_traversal_and_correlations', 'capture_final_semantic_source_snapshot', 'regenerate_reference_registry_owner_graph_and_manifest', 'seal_final_output'], post_lineage_artifact_mutation: 'forbidden', post_semantic_snapshot_source_mutation: 'forbidden' }

// R49 gives every persisted byte and row identity a real, resolvable normative primitive.
r49.authority_operation_persisted_identity_primitives = {
  schema_version: 'ctrl.g24.authority-operation-persisted-identity-primitives.r49.v1',
  canonical_payload_content_address: { schema_version: 'ctrl.g24.canonical-payload-content-address.r49.v1', domain_ascii: 'CTRL-G24-R49-CANONICAL-PAYLOAD-CONTENT-ADDRESS', preimage_order: ['domain_ascii', 'canonical_schema_ref', 'canonical_payload_bytes_utf8'], codec_ref: 'canonical_json_utf8_encoding' },
  canonical_authority_row_content_address: { schema_version: 'ctrl.g24.canonical-authority-row-content-address.r49.v1', domain_ascii: 'CTRL-G24-R49-CANONICAL-AUTHORITY-ROW-CONTENT-ADDRESS', preimage_order: ['domain_ascii', 'canonical_schema_ref', 'canonical_authority_row_bytes_utf8'], codec_ref: 'canonical_json_utf8_encoding' },
  nonce_receipt_content_address: { schema_version: 'ctrl.g24.nonce-receipt-content-address.r49.v1', domain_ascii: 'CTRL-G24-R49-NONCE-RECEIPT-CONTENT-ADDRESS', preimage_order: ['domain_ascii', 'proof_nonce_receipt_payload_bytes_utf8'], codec_ref: 'canonical_json_utf8_encoding' },
  generic_payload_fingerprint: { schema_version: 'ctrl.g24.persisted-payload-fingerprint.r49.v1', domain_ascii: 'CTRL-G24-R49-PERSISTED-PAYLOAD', preimage_order: ['domain_ascii', 'schema_ref', 'canonical_bytes_sha256'], codec_ref: 'canonical_json_utf8_encoding' }
}
r49.canonical_json_utf8_encoding = { ...r49.canonical_json_utf8_encoding, schema_version: 'ctrl.g24.canonical-json-utf8-encoding.r49.v1', sha256_canonical_payload_bytes_utf8: r49.authority_operation_persisted_identity_primitives.canonical_payload_content_address, sha256_canonical_authority_row_bytes_utf8: r49.authority_operation_persisted_identity_primitives.canonical_authority_row_content_address }
r49.proof_nonce_ledger.row_schema.nonce_receipt_ref_content_address_rule = r49.authority_operation_persisted_identity_primitives.nonce_receipt_content_address

// The committed registry now binds the exact target intent triple, including its fingerprint.
const committedRegistry = r49.authority_operation_registry.row_union.variants.original_committed
const targetIntentIndex = committedRegistry.exact_keys.indexOf('target_intent_bytes_sha256') + 1
committedRegistry.exact_keys.splice(targetIntentIndex, 0, 'target_intent_fingerprint')
committedRegistry.required.splice(committedRegistry.required.indexOf('target_intent_bytes_sha256') + 1, 0, 'target_intent_fingerprint')
committedRegistry.properties.target_intent_fingerprint = fp
committedRegistry.schema_version = 'ctrl.g24.authority-operation-registry-original-committed.r49.v1'
committedRegistry.row_ref_domain_ascii = 'CTRL-G24-AUTHORITY-OPERATION-REGISTRY-ORIGINAL-COMMITTED-ROW-REF-R49'
committedRegistry.row_ref_schema_version = 'ctrl.g24.authority-operation-registry-row-identity-preimage.r49.v1'
committedRegistry.row_ref_preimage_included_fields.splice(committedRegistry.row_ref_preimage_included_fields.indexOf('target_intent_bytes_sha256') + 1, 0, 'target_intent_fingerprint')
r49.fingerprint_schemas.authority_operation_registry_committed_r49 = { ...r49.fingerprint_schemas.authority_operation_registry_committed_r37, schema_version: 'ctrl.g24.fingerprint.authority-operation-registry-committed-r49.r49.v1', domain_ascii: 'CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R49', preimage_order: [...r49.fingerprint_schemas.authority_operation_registry_committed_r37.preimage_order] }
r49.fingerprint_schemas.authority_operation_registry_committed_r49.preimage_order.splice(r49.fingerprint_schemas.authority_operation_registry_committed_r49.preimage_order.indexOf('target_intent_bytes_sha256') + 1, 0, 'target_intent_fingerprint')
committedRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_committed_r49'
r49.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r49.v1'
r49.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r49.v1'

const targetStores = [...new Set(Object.values(r49.case_session_authority_operation_protocols.operations).map(operation => operation.target_store ?? operation.request_schema.properties.target_store.const))].sort(cp)
r49.authority_operation_committed_target_identity_authority = {
  schema_version: 'ctrl.g24.authority-operation-committed-target-identity-authority.r49.v1', active_normative_authority: true, discriminator: 'target_store',
  variants: Object.fromEntries(targetStores.map(store => [store, { schema_version: `ctrl.g24.committed-${store.replaceAll('_', '-')}-target-identity.r49.v1`, row_schema_ref: `authoritative_row_schemas.${store}`, row_version_domain_ascii: `CTRL-G24-R49-COMMITTED-${store.toUpperCase().replaceAll('_', '-')}-ROW-VERSION`, row_version_schema_version: `ctrl.g24.committed-${store.replaceAll('_', '-')}-row-version.r49.v1`, row_version_preimage_exact_keys: ['domain_ascii', 'schema_version', 'ordered_complete_mutable_authority_fields'], complete_mutable_authority_fields: 'every_target_row_field_except_row_version_ref_and_native_fingerprint', fingerprint_authority: 'selected_authoritative_row_schema_fingerprint_ref', content_address_authority_ref: 'authority_operation_persisted_identity_primitives.canonical_authority_row_content_address' }])),
  exact_target_store_count: targetStores.length, row_version_preimage_exact_keys: ['domain_ascii', 'schema_version', 'ordered_complete_mutable_authority_fields'], duplicate_missing_or_stale_authority: 'reject_materialization_and_hold_without_disclosure_or_write'
}

function rowVersion(store, schema, rowWithoutIdentity) {
  const authority = r49.authority_operation_committed_target_identity_authority.variants[store]
  const fields = Object.keys(rowWithoutIdentity).sort(cp).map(field => ({ field, value: rowWithoutIdentity[field] }))
  const preimage = { domain_ascii: authority.row_version_domain_ascii, schema_version: authority.row_version_schema_version, ordered_complete_mutable_authority_fields: fields }
  return { preimage, ref: hash(preimage) }
}
function makeReceipt(fixtureId, variant, base, resultFactory) {
  const schema = schemaAt('authority_operation_receipt_store.row_union', variant)
  const domain = variant === 'ordinary_single_proof_committed' ? 'CTRL-G24-R49-AUTHORITY-OPERATION-RECEIPT-REF-ORDINARY' : 'CTRL-G24-R49-AUTHORITY-OPERATION-RECEIPT-REF-SESSION'
  const refPreimage = { domain_ascii: domain, schema_version: schema.schema_version, variant, ordered_fields: schema.receipt_ref_preimage_fields.map(field => ({ field, value: base[field] })) }
  const receiptRef = hash(refPreimage), rule = get(r49, schema.receipt_precommit_fingerprint_ref), preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : field === 'receipt_ref' ? receiptRef : base[field]
  const preFp = hash(preimage), result = resultFactory(receiptRef, preFp)
  const receipt = makeRow(fixtureId, 'receipt', 'authority_operation_receipt_store.row_union', variant, { ...base, receipt_ref: receiptRef, receipt_precommit_fingerprint: preFp, result_bytes_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_fingerprint: '0'.repeat(64) }, refPreimage, 'receipt_row')
  return { receiptRef, preFp, result, receipt }
}
function makeHistory(fixtureId, operationName, operationId, branch, result) {
  const matrix = r49.authority_operation_historical_response_schema_matrix.rows.find(row => row.operation_name === operationName && row.result_branch === branch)
  return makeContent(fixtureId, 'history', 'authority_operation_historical_response_schema', 'UNAVAILABLE', { operation_name: operationName, operation_id: operationId, result_branch: branch, response_schema_ref: matrix.response_schema_ref, response_schema_version: matrix.response_schema_version, response_payload_ref: result.ref, response_payload_bytes_sha256: result.bytes_sha256, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint })
}
function makeRegistryAndReplay(fixtureId, old, values) {
  const schema = schemaAt('authority_operation_registry.row_union', 'original_committed'), selected = selection(values.operationName)
  const row = fill(schema, `${fixtureId}:registry`, { durable_state: 'original_committed', target_store: values.targetStore, operation_name: values.operationName, operation_id: values.operationId, idempotency_key: values.request.payload_value.idempotency_key, request_fingerprint: values.request.fingerprint, request_bytes_ref: values.request.ref, request_bytes_sha256: values.request.bytes_sha256, target_intent_bytes_ref: values.intent.ref, target_intent_bytes_sha256: values.intent.bytes_sha256, target_intent_fingerprint: values.intent.fingerprint, committed_target_row_ref: values.target.canonical_row_value.row_version_ref, committed_target_row_bytes_sha256: values.target.canonical_row_bytes_sha256, committed_target_row_fingerprint: values.target.recorded_fingerprint, result_branch: 'committed', result_ref: values.result.ref, result_bytes_sha256: values.result.bytes_sha256, result_fingerprint: values.result.fingerprint, receipt_ref: values.receipt.canonical_row_value.receipt_ref, receipt_precommit_fingerprint: values.receipt.canonical_row_value.receipt_precommit_fingerprint, receipt_fingerprint: values.receipt.recorded_fingerprint, server_committed_at: values.at, fresh_selection_row_id: selected.selection_row_id, proof_family: selected.proof_family, branch_class: selected.branch_class, evidence_kind: selected.evidence_kind, fresh_selection_schema_version: selected.selector_schema_version, historical_response_ref: values.history.ref, historical_response_bytes_sha256: values.history.bytes_sha256, historical_response_fingerprint: values.history.fingerprint, registry_row_ref: '0'.repeat(64), registry_fingerprint: '0'.repeat(64) })
  row.registry_row_ref = rowRef(schema, row)
  const registry = makeRow(fixtureId, 'registry', 'authority_operation_registry.row_union', 'original_committed', row, { domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: schema.row_ref_preimage_included_fields.map(field => ({ field, value: row[field] })) }, 'registry_row')
  const replayPayload = makeContent(fixtureId, 'replay_payload', old.replay_payload.payload_schema_ref, old.replay_payload.payload_schema_variant, { ...old.replay_payload.payload_value, operation_name: values.operationName, operation_id: values.operationId, historical_result_branch: 'committed', historical_result_ref: values.result.ref, historical_result_bytes_sha256: values.result.bytes_sha256, historical_result_fingerprint: values.result.fingerprint, stored_historical_response_ref: values.history.ref, stored_historical_response_bytes_sha256: values.history.bytes_sha256, stored_historical_response_fingerprint: values.history.fingerprint, committed_registry_row_ref: row.registry_row_ref, committed_registry_row_fingerprint: registry.recorded_fingerprint })
  const replayEnvelope = makeContent(fixtureId, 'replay_envelope', old.replay_envelope.payload_schema_ref, old.replay_envelope.payload_schema_variant, { ...old.replay_envelope.payload_value, operation_name: values.operationName, operation_id: values.operationId, historical_result_branch: 'committed', payload_ref: replayPayload.ref, payload_bytes_sha256: replayPayload.bytes_sha256, payload_fingerprint: replayPayload.fingerprint, replay_response_ref: values.history.ref, replay_response_bytes_sha256: values.history.bytes_sha256, replay_response_fingerprint: values.history.fingerprint })
  return { registry, replayPayload, replayEnvelope }
}

// Reissue the ordinary committed fixture under the R49 registry and target identity rules.
const rootFixture = r49.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed')
{
  const old = rootFixture.artifact_store_by_role, at = old.result.payload_value.committed_at, intent = old.target_intent
  const targetSchema = schemaAt('authoritative_row_schemas.case_session_root_trust_anchors'), withoutIdentity = { ...intent.payload_value, valid_from: at, authority_order: 1 }
  delete withoutIdentity.row_version_ref; delete withoutIdentity.anchor_fingerprint
  const version = rowVersion('case_session_root_trust_anchors', targetSchema, withoutIdentity)
  const target = makeRow(rootFixture.fixture_id, 'committed_target_row', 'authoritative_row_schemas.case_session_root_trust_anchors', 'UNAVAILABLE', { ...withoutIdentity, row_version_ref: version.ref, anchor_fingerprint: '0'.repeat(64) }, version.preimage, 'authoritative_row')
  const receiptSchema = schemaAt('authority_operation_receipt_store.row_union', 'ordinary_single_proof_committed')
  const base = { ...old.receipt.canonical_row_value, target_row_bytes_ref: target.content_addressed_artifact_ref, target_row_bytes_sha256: target.canonical_row_bytes_sha256, target_row_fingerprint: target.recorded_fingerprint, result_bytes_ref: '0'.repeat(64), result_bytes_sha256: '0'.repeat(64), result_fingerprint: '0'.repeat(64), receipt_fingerprint: '0'.repeat(64) }
  const made = makeReceipt(rootFixture.fixture_id, 'ordinary_single_proof_committed', base, (receiptRef, preFp) => makeContent(rootFixture.fixture_id, 'result', old.result.payload_schema_ref, old.result.payload_schema_variant, { ...old.result.payload_value, target_row_version_ref: version.ref, target_row_fingerprint: target.recorded_fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: preFp }))
  const history = makeHistory(rootFixture.fixture_id, old.result.payload_value.operation_name, old.result.payload_value.operation_id, 'committed', made.result)
  const downstream = makeRegistryAndReplay(rootFixture.fixture_id, old, { operationName: old.result.payload_value.operation_name, operationId: old.result.payload_value.operation_id, targetStore: old.result.payload_value.target_store, request: old.request, intent, target, result: made.result, receipt: made.receipt, history, at })
  rootFixture.artifact_store_by_role = { target_intent: intent, committed_target_row: target, proof: old.proof, proof_nonce_receipt: old.proof_nonce_receipt, request: old.request, result: made.result, receipt: made.receipt, history, registry: downstream.registry, replay_payload: downstream.replayPayload, replay_envelope: downstream.replayEnvelope }
  rootFixture.exact_required_roles = Object.keys(rootFixture.artifact_store_by_role); rootFixture.artifact_view_role_refs = Object.fromEntries(rootFixture.exact_required_roles.map(role => [role, role]))
}

// Rebuild the session committed fixture from one coherent, strictly time-valid lineage.
const priorSession = r49.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role
const sessionFixtureId = 'identity_session_committed', sessionOp = 'issue_server_session_principal', operationId = 'op_identity_session_committed'
const at = '2026-09-14T12:00:00.000Z', proofIssued = '2026-09-14T11:00:00.000Z', proofExpires = '2026-09-14T13:00:00.000Z'
const workspace = priorSession.target_intent.payload_value.workspace_ref
const targetIntent = makeContent(sessionFixtureId, 'target_intent', priorSession.target_intent.payload_schema_ref, priorSession.target_intent.payload_schema_variant, { ...priorSession.target_intent.payload_value, issued_at: proofIssued, expires_at: '2027-09-14T00:00:00.000Z', valid_until: '2027-09-14T00:00:00.000Z', workspace_ref: workspace })
const partitionFields = r49.case_server_session_principal_evidence_partition_schema.exact_keys
const targetPartitionFingerprint = hash({ domain_ascii: r49.target_partition_fingerprint_schema.domain_ascii, target_store: 'case_server_session_principal_evidence', ordered_partition_field_names: partitionFields, ordered_partition_field_values: partitionFields.map(field => targetIntent.payload_value[field]) })
const issuerProof = makeContent(sessionFixtureId, 'issuer_proof', priorSession.issuer_proof.payload_schema_ref, priorSession.issuer_proof.payload_schema_variant, { ...priorSession.issuer_proof.payload_value, scope_operation_name: sessionOp, scope_partition_fingerprint: targetPartitionFingerprint, issued_at: proofIssued, expires_at: proofExpires })
const evaluatorProof = makeContent(sessionFixtureId, 'evaluator_proof', priorSession.evaluator_proof.payload_schema_ref, priorSession.evaluator_proof.payload_schema_variant, { ...priorSession.evaluator_proof.payload_value, scope_operation_name: sessionOp, scope_partition_fingerprint: targetPartitionFingerprint, issued_at: proofIssued, expires_at: proofExpires })
const bundle = makeContent(sessionFixtureId, 'bundle', priorSession.bundle.payload_schema_ref, priorSession.bundle.payload_schema_variant, { ...priorSession.bundle.payload_value, operation_name: sessionOp, workspace_ref: workspace, target_partition_fingerprint: targetPartitionFingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint })
const projection = makeContent(sessionFixtureId, 'bundle_truth_projection', priorSession.bundle_truth_projection.payload_schema_ref, priorSession.bundle_truth_projection.payload_schema_variant, { ...priorSession.bundle_truth_projection.payload_value, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, decoded_target_workspace_ref: workspace, selected_current_partition_workspace_ref: workspace, workspace_ref: workspace, target_partition_fingerprint: targetPartitionFingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint })
const issuerNonce = makeNonce(sessionFixtureId, 'issuer_nonce_receipt', 'issuer', issuerProof, operationId, 'committed', bundle.payload_value.issuer_nonce, bundle.payload_value.issuer_nonce_subject_fingerprint, bundle.payload_value.issuer_verifier_identity_fingerprint)
const evaluatorNonce = makeNonce(sessionFixtureId, 'evaluator_nonce_receipt', 'evaluator', evaluatorProof, operationId, 'committed', bundle.payload_value.evaluator_nonce, bundle.payload_value.evaluator_nonce_subject_fingerprint, bundle.payload_value.evaluator_verifier_identity_fingerprint)
const readSet = makeContent(sessionFixtureId, 'authority_read_set', priorSession.authority_read_set.payload_schema_ref, priorSession.authority_read_set.payload_schema_variant, { ...priorSession.authority_read_set.payload_value, workspace_ref: workspace, dual_proof_bundle_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint })
const request = makeContent(sessionFixtureId, 'request', priorSession.request.payload_schema_ref, priorSession.request.payload_schema_variant, { ...priorSession.request.payload_value, operation_name: sessionOp, operation_id: operationId, target_partition_fingerprint: targetPartitionFingerprint, target_intent_bytes_ref: targetIntent.ref, target_intent_bytes_sha256: targetIntent.bytes_sha256, dual_proof_bundle_bytes_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint })
const sessionTargetSchema = schemaAt('authoritative_row_schemas.case_server_session_principal_evidence'), sessionWithoutIdentity = { ...targetIntent.payload_value, valid_from: at, authority_order: 1 }
delete sessionWithoutIdentity.row_version_ref; delete sessionWithoutIdentity.session_principal_fingerprint
const sessionVersion = rowVersion('case_server_session_principal_evidence', sessionTargetSchema, sessionWithoutIdentity)
const sessionTarget = makeRow(sessionFixtureId, 'committed_target_row', 'authoritative_row_schemas.case_server_session_principal_evidence', 'UNAVAILABLE', { ...sessionWithoutIdentity, row_version_ref: sessionVersion.ref, session_principal_fingerprint: '0'.repeat(64) }, sessionVersion.preimage, 'authoritative_row')
const receiptEvidence = makeContent(sessionFixtureId, 'receipt_evidence', priorSession.receipt_evidence.payload_schema_ref, priorSession.receipt_evidence.payload_schema_variant, { ...priorSession.receipt_evidence.payload_value, operation_name: sessionOp, operation_id: operationId, dual_proof_bundle_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, authority_read_set_ref: readSet.ref, authority_read_set_bytes_sha256: readSet.bytes_sha256, authority_read_set_fingerprint: readSet.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint })
const sessionReceiptSchema = schemaAt('authority_operation_receipt_store.row_union', 'session_dual_proof_committed')
const sessionBase = fill(sessionReceiptSchema, `${sessionFixtureId}:receipt`, { ...priorSession.receipt.canonical_row_value, receipt_ref: '0'.repeat(64), receipt_precommit_fingerprint: '0'.repeat(64), request_fingerprint: request.fingerprint, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, target_row_bytes_ref: sessionTarget.content_addressed_artifact_ref, target_row_bytes_sha256: sessionTarget.canonical_row_bytes_sha256, target_row_fingerprint: sessionTarget.recorded_fingerprint, result_bytes_ref: '0'.repeat(64), result_bytes_sha256: '0'.repeat(64), result_fingerprint: '0'.repeat(64), server_committed_at: at, dual_proof_bundle_ref: bundle.ref, dual_proof_bundle_bytes_sha256: bundle.bytes_sha256, dual_proof_bundle_fingerprint: bundle.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, authority_read_set_ref: readSet.ref, authority_read_set_bytes_sha256: readSet.bytes_sha256, authority_read_set_fingerprint: readSet.fingerprint, receipt_evidence_ref: receiptEvidence.ref, receipt_evidence_bytes_sha256: receiptEvidence.bytes_sha256, receipt_evidence_fingerprint: receiptEvidence.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint, receipt_fingerprint: '0'.repeat(64) })
const sessionMade = makeReceipt(sessionFixtureId, 'session_dual_proof_committed', sessionBase, (receiptRef, preFp) => makeContent(sessionFixtureId, 'result', priorSession.result.payload_schema_ref, priorSession.result.payload_schema_variant, { ...priorSession.result.payload_value, operation_name: sessionOp, operation_id: operationId, target_row_version_ref: sessionVersion.ref, target_row_fingerprint: sessionTarget.recorded_fingerprint, receipt_ref: receiptRef, receipt_precommit_fingerprint: preFp, committed_at: at }))
const sessionHistory = makeHistory(sessionFixtureId, sessionOp, operationId, 'committed', sessionMade.result)
const sessionDownstream = makeRegistryAndReplay(sessionFixtureId, priorSession, { operationName: sessionOp, operationId, targetStore: 'case_server_session_principal_evidence', request, intent: targetIntent, target: sessionTarget, result: sessionMade.result, receipt: sessionMade.receipt, history: sessionHistory, at })
const sessionStore = { target_intent: targetIntent, committed_target_row: sessionTarget, issuer_proof: issuerProof, evaluator_proof: evaluatorProof, bundle_truth_projection: projection, bundle, issuer_nonce_receipt: issuerNonce, evaluator_nonce_receipt: evaluatorNonce, authority_read_set: readSet, request, receipt_evidence: receiptEvidence, result: sessionMade.result, receipt: sessionMade.receipt, history: sessionHistory, registry: sessionDownstream.registry, replay_payload: sessionDownstream.replayPayload, replay_envelope: sessionDownstream.replayEnvelope }
r49.authority_operation_committed_receipt_identity_fixtures = { ...r49.authority_operation_committed_receipt_identity_fixtures, schema_version: 'ctrl.g24.authority-operation-committed-receipt-identity-fixtures.r49.v1', fixture_id: sessionFixtureId, exact_required_roles: Object.keys(sessionStore), artifact_store_by_role: sessionStore, artifact_view_role_refs: Object.fromEntries(Object.keys(sessionStore).map(role => [role, role])), consistency_contract: { target_intent_triple_bound_before_registry_seal: true, projection_workspace_equals_target_intent_workspace: true, target_partition_fingerprint_derived_from_actual_target_partition_fields: true, proof_issued_before_commit_and_expires_after_commit: true, downstream_regenerated_in_dependency_order: true } }

// R49 receipt identities retain both exact committed variants with new R49 domains.
const receiptVariants = Object.entries(r49.authority_operation_receipt_store.row_union.variants).filter(([name]) => name.endsWith('_committed'))
r49.authority_operation_receipt_materialization_authority = {
  ...r49.authority_operation_receipt_materialization_authority, schema_version: 'ctrl.g24.authority-operation-receipt-materialization-authority.r49.v1', active_normative_authority: true,
  variants: Object.fromEntries(receiptVariants.map(([name, schema]) => [name, { schema_version: `ctrl.g24.authority-operation-receipt-identity-${name.replaceAll('_', '-')}.r49.v1`, receipt_schema_ref: `authority_operation_receipt_store.row_union.variants.${name}`, receipt_schema_version: schema.schema_version, receipt_ref_preimage_schema: { schema_version: `ctrl.g24.receipt-ref-preimage-${name.replaceAll('_', '-')}.r49.v1`, domain_ascii: name === 'ordinary_single_proof_committed' ? 'CTRL-G24-R49-AUTHORITY-OPERATION-RECEIPT-REF-ORDINARY' : 'CTRL-G24-R49-AUTHORITY-OPERATION-RECEIPT-REF-SESSION', exact_keys: ['domain_ascii', 'schema_version', 'variant', 'ordered_fields'], variant: name, ordered_fields: schema.receipt_ref_preimage_fields }, exact_receipt_ref_preimage_field_count: schema.receipt_ref_preimage_fields.length, receipt_precommit_fingerprint_schema_ref: schema.receipt_precommit_fingerprint_ref, receipt_final_fingerprint_schema_ref: schema.fingerprint_ref, issuance_order: ['all_non_result_evidence', 'receipt_ref_preimage', 'receipt_precommit_fingerprint', 'result_fingerprint', 'result_canonical_bytes_and_content_address', 'final_receipt_fingerprint', 'registry', 'history', 'replay_payload', 'replay_envelope'] }]))
}

// Complete active persisted schema universe. Fixtures are evidence, not the inventory source.
function collectStores() {
  const rows = [], seen = new Set()
  const walk = (value, path = '$') => {
    if (!value || typeof value !== 'object') return
    if (typeof value.canonical_schema_ref === 'string' && value.row_schema?.properties) {
      const key = `${value.canonical_schema_ref}|${value.row_schema.schema_version}|${path}`
      if (!seen.has(key)) { seen.add(key); rows.push({ store_path: path.replace(/^\$\.?/, ''), payload_schema_ref: value.canonical_schema_ref, wrapper_schema_version: value.row_schema.schema_version, wrapper_fingerprint_ref: value.row_schema.fingerprint_ref }) }
    }
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
  }
  walk(r49)
  return rows.sort((a, b) => cp(`${a.payload_schema_ref}|${a.store_path}`, `${b.payload_schema_ref}|${b.store_path}`))
}
const stores = collectStores()
const operations = Object.entries(r49.case_session_authority_operation_protocols.operations)
const requestSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.request_schema`).sort(cp)
const targetSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.target_intent_schema`).sort(cp)
const proofSchemas = ['case_session_root_bootstrap_proof_schema', 'case_session_root_admin_capability_proof_schema', 'case_session_issuer_capability_proof_schema', 'case_session_evaluator_capability_proof_schema'].sort(cp)
const resultSchemas = operations.flatMap(([name, operation]) => Object.keys(operation.result_schema.variants).map(variant => `case_session_authority_operation_protocols.operations.${name}.result_schema.variants.${variant}`)).sort(cp)
const committedTargetSchemas = targetStores.map(store => `authoritative_row_schemas.${store}`).sort(cp)
const persistedPayloadSchemas = [...new Set(stores.map(row => row.payload_schema_ref))].sort(cp)
const persistedPayloadVariants = persistedPayloadSchemas.flatMap(schema_ref => {
  const schema = get(r49, schema_ref)
  return schema?.variants ? Object.keys(schema.variants).map(variant => ({ schema_ref, variant })) : [{ schema_ref, variant: 'UNAVAILABLE' }]
}).sort((a, b) => cp(`${a.schema_ref}|${a.variant}`, `${b.schema_ref}|${b.variant}`))
const persistedRowVariants = [
  ...Object.keys(r49.authority_operation_registry.row_union.variants).map(variant => ({ schema_ref: 'authority_operation_registry.row_union', variant })),
  ...Object.keys(r49.authority_operation_hold_store.row_union.variants).map(variant => ({ schema_ref: 'authority_operation_hold_store.row_union', variant })),
  ...Object.keys(r49.authority_operation_receipt_store.row_union.variants).map(variant => ({ schema_ref: 'authority_operation_receipt_store.row_union', variant })),
  ...committedTargetSchemas.map(schema_ref => ({ schema_ref, variant: 'UNAVAILABLE' })),
  { schema_ref: 'proof_nonce_ledger.row_schema', variant: 'UNAVAILABLE' }
]
r49.authority_operation_complete_active_persisted_schema_universe = {
  schema_version: 'ctrl.g24.authority-operation-complete-active-persisted-schema-universe.r49.v1', derivation: 'independent_enumeration_from_all_operation_protocols_all_content_addressed_stores_and_all_durable_row_unions',
  operation_count: operations.length, request_schema_count: requestSchemas.length, request_schema_refs: requestSchemas, target_schema_count: targetSchemas.length, target_schema_refs: targetSchemas, proof_schema_count: proofSchemas.length, proof_schema_refs: proofSchemas, result_schema_count: resultSchemas.length, result_schema_refs: resultSchemas, committed_target_store_count: targetStores.length, committed_target_schema_refs: committedTargetSchemas, persisted_payload_schema_count: persistedPayloadSchemas.length, persisted_payload_schema_refs: persistedPayloadSchemas, persisted_payload_variant_count: persistedPayloadVariants.length, persisted_payload_variants: persistedPayloadVariants, persisted_row_variant_count: persistedRowVariants.length, persisted_row_variants: persistedRowVariants, content_addressed_store_count: stores.length, content_addressed_stores: stores, fixtures_are_exemplars_not_inventory_authority: true
}

const identityAuthorities = {}, identityIndex = [], identitySeen = new Set()
function addIdentity(kind, persistedSchemaRef, variant, formula, sourceFamily) {
  if (identitySeen.has(kind)) throw new Error(`R49_duplicate_identity_kind:${kind}`)
  identitySeen.add(kind)
  const key = `identity_${String(identityIndex.length + 1).padStart(4, '0')}`
  identityAuthorities[key] = { schema_version: 'ctrl.g24.persisted-identity-authority.r49.v1', identity_kind: kind, persisted_schema_ref: persistedSchemaRef, persisted_schema_variant: variant, source_universe_family: sourceFamily, formula }
  identityIndex.push({ identity_kind: kind, persisted_schema_ref: persistedSchemaRef, persisted_schema_variant: variant, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: 'ctrl.g24.persisted-identity-authority.r49.v1', source_universe_family: sourceFamily })
}
function payloadRule(schemaRef) {
  const requestMatch = schemaRef.match(/^case_session_authority_operation_protocols\.operations\.([^.]+)\.request_schema$/)
  if (requestMatch) return `case_session_authority_operation_protocols.operations.${requestMatch[1]}.request_fingerprint`
  const resultMatch = schemaRef.match(/^case_session_authority_operation_protocols\.operations\.([^.]+)\.result_schema\.variants\./)
  if (resultMatch) return `case_session_authority_operation_protocols.operations.${resultMatch[1]}.result_fingerprint`
  const schema = get(r49, schemaRef)
  return schema?.fingerprint_ref ?? 'authority_operation_persisted_identity_primitives.generic_payload_fingerprint'
}
for (const entry of persistedPayloadVariants) {
  const schemaRef = entry.schema_ref, variant = entry.variant
  const family = requestSchemas.includes(schemaRef) ? 'request' : targetSchemas.includes(schemaRef) ? 'target' : proofSchemas.includes(schemaRef) ? 'proof' : resultSchemas.includes(schemaRef) ? 'result' : 'supporting_payload'
  addIdentity(`content_address:${schemaRef}:${variant}`, schemaRef, variant, { kind: 'sha256_canonical_payload_bytes_utf8', authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address' }, family)
  addIdentity(`payload_fingerprint:${schemaRef}:${variant}`, schemaRef, variant, { kind: 'declared_payload_fingerprint', authority_ref: payloadRule(variant === 'UNAVAILABLE' ? schemaRef : `${schemaRef}.variants.${variant}`) }, family)
}
for (const row of persistedRowVariants) {
  const schema = schemaAt(row.schema_ref, row.variant)
  if (!schema?.properties) throw new Error(`R49_persisted_row_schema:${row.schema_ref}:${row.variant}`)
  const key = `${row.schema_ref}:${row.variant}`
  addIdentity(`row_content_address:${key}`, row.schema_ref, row.variant, { kind: 'sha256_canonical_authority_row_bytes_utf8', authority_ref: 'authority_operation_persisted_identity_primitives.canonical_authority_row_content_address' }, 'durable_row')
  if (schema.fingerprint_ref) addIdentity(`row_fingerprint:${key}`, row.schema_ref, row.variant, { kind: 'declared_row_fingerprint', authority_ref: schema.fingerprint_ref }, 'durable_row')
  if (schema.properties.registry_row_ref) addIdentity(`registry_row_ref:${row.variant}`, row.schema_ref, row.variant, { kind: 'declared_registry_row_ref', authority_ref: `${row.schema_ref}.variants.${row.variant}` }, 'registry')
  if (schema.properties.hold_row_ref) addIdentity(`hold_row_ref:${row.variant}`, row.schema_ref, row.variant, { kind: 'declared_hold_row_ref', authority_ref: `${row.schema_ref}.variants.${row.variant}` }, 'hold')
  if (row.schema_ref === 'authority_operation_receipt_store.row_union' && schema.properties.receipt_ref) {
    const ref = `authority_operation_receipt_materialization_authority.variants.${row.variant}`
    addIdentity(`receipt_ref:${row.variant}`, row.schema_ref, row.variant, { kind: 'declared_receipt_ref', authority_ref: ref }, 'receipt')
    addIdentity(`receipt_precommit_fingerprint:${row.variant}`, row.schema_ref, row.variant, { kind: 'declared_receipt_precommit_fingerprint', authority_ref: ref }, 'receipt')
    addIdentity(`receipt_final_fingerprint:${row.variant}`, row.schema_ref, row.variant, { kind: 'declared_receipt_final_fingerprint', authority_ref: ref }, 'receipt')
  }
  if (schema.properties.row_version_ref) {
    const store = row.schema_ref.split('.').at(-1)
    addIdentity(`row_version_ref:${row.schema_ref}`, row.schema_ref, row.variant, { kind: 'declared_committed_row_version_ref', authority_ref: `authority_operation_committed_target_identity_authority.variants.${store}` }, 'committed_target')
  }
  if (schema.properties.nonce_receipt_ref) addIdentity(`nonce_receipt_ref:${key}`, row.schema_ref, row.variant, { kind: 'declared_nonce_receipt_content_address', authority_ref: 'authority_operation_persisted_identity_primitives.nonce_receipt_content_address' }, 'nonce_receipt')
}
r49.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r49.authority_operation_artifact_fingerprint_derivation_authority = { ...r49.authority_operation_artifact_fingerprint_derivation_authority, schema_version: 'ctrl.g24.authority-operation-artifact-fingerprint-derivation-authority.r49.v1', active_normative_authority: true, complete_active_schema_universe_ref: 'authority_operation_complete_active_persisted_schema_universe', sole_active_identity_index_derivation: 'mechanically_from_complete_active_persisted_schema_universe_not_fixtures', sole_active_identity_index: identityIndex.sort((a, b) => cp(a.identity_kind, b.identity_kind)), exact_identity_kind_count: identityIndex.length, fixtures_are_exemplars_only: true, missing_extra_duplicate_or_unresolved_identity_authority: 'reject_materialization_and_hold_without_disclosure_or_write' }

// Complete schema-declared internal reference triples are independent of fixture values.
const explicitExternalFields = new Set(['account_binding_ref','account_binding_row_version_ref','account_ref','account_standing_ref','account_standing_row_version_ref','authority_proof_schema_ref','case_binding_ref','case_binding_row_version_ref','case_ref','decoded_target_workspace_ref','deployment_configuration_ref','dual_proof_bundle_schema_ref','evaluator_proof_schema_ref','evaluator_ref','evaluator_row_version_ref','evaluator_version_ref','evidence_ref','expected_head_row_version_ref','hold_schema_ref','issuer_proof_schema_ref','issuer_ref','issuer_row_version_ref','issuer_version_ref','live_principal_assertion_bytes_ref','pinned_runtime_attestor_ref','presented_principal_projection_bytes_ref','prior_anchor_version_ref','prior_row_version_ref','proof_ref','response_schema_ref','root_anchor_row_version_ref','selected_current_partition_workspace_ref','server_session_ref','session_evidence_ref','session_evidence_row_version_ref','session_ref','signer_1_ref','signer_2_ref','stable_actor_ref','target_intent_schema_ref','target_row_schema_ref','trust_anchor_ref','trust_anchor_version_ref','verifier_ref','verifier_version_ref','workspace_ref'])
const schemaReferenceFields = new Set(['authority_proof_schema_ref','dual_proof_bundle_schema_ref','evaluator_proof_schema_ref','hold_schema_ref','issuer_proof_schema_ref','response_schema_ref','target_intent_schema_ref','target_row_schema_ref'])
const optionalRawFields = new Set(['raw_bundle_ref_or_unavailable','raw_evaluator_proof_ref_or_unavailable','raw_issuer_proof_ref_or_unavailable','raw_proof_ref_or_unavailable','raw_target_ref_or_unavailable','session_hold_evidence_ref_or_unavailable'])
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key) && !/(fingerprint|sha256)$/.test(key)
function artifactSchema(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? schemaAt(artifact.payload_schema_ref, artifact.payload_schema_variant) : schemaAt(artifact.schema_ref, artifact.schema_variant) }
function artifactValue(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_value : artifact.canonical_row_value }
function identities(role, artifact) {
  if (artifact.fixture_wrapper_variant === 'content_addressed') return [{ role, identity_kind: 'artifact_ref', ref: artifact.ref, bytes_sha256: artifact.bytes_sha256, fingerprint: artifact.fingerprint }]
  const rows = [{ role, identity_kind: 'row_content_address', ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }]
  if (role === 'registry') rows.push({ role, identity_kind: 'registry_row_ref', ref: artifact.canonical_row_value.registry_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
  if (role === 'hold') rows.push({ role, identity_kind: 'hold_row_ref', ref: artifact.canonical_row_value.hold_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
  if (role === 'committed_target_row') rows.push({ role, identity_kind: 'row_version_ref', ref: artifact.canonical_row_value.row_version_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
  if (role === 'receipt') { rows.push({ role, identity_kind: 'receipt_precommit_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.canonical_row_value.receipt_precommit_fingerprint }); rows.push({ role, identity_kind: 'receipt_final_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }) }
  return rows
}
function companions(sourceRole, key, value) {
  if (key === 'response_payload_ref') return ['response_payload_bytes_sha256', 'result_fingerprint']
  if (key === 'request_artifact_ref') return ['request_artifact_sha256', 'request_fingerprint']
  if (key === 'result_ref') return ['result_bytes_sha256', 'result_fingerprint']
  if (key === 'hold_result_ref') return ['hold_result_bytes_sha256', 'hold_result_fingerprint']
  if (key === 'hold_row_ref') return [null, sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint']
  if (key === 'receipt_ref') return [null, sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint']
  if (key === 'committed_target_row_ref') return ['committed_target_row_bytes_sha256', 'committed_target_row_fingerprint']
  if (key === 'target_row_version_ref') return [null, 'target_row_fingerprint']
  if (key === 'held_registry_row_ref') return [null, 'held_registry_row_fingerprint']
  if (key === 'committed_registry_row_ref') return [null, 'committed_registry_row_fingerprint']
  const suffix = key.endsWith('_or_unavailable') ? '_or_unavailable' : '', base = key.replace(/_ref(_or_unavailable)?$/, '')
  return [[`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(candidate => Object.hasOwn(value, candidate)) ?? null, `${base}_fingerprint${suffix}`]
}
const roleStores = [...r49.authority_operation_replay_restart_fixtures.fixtures.map(f => ({ fixture_id: f.fixture_id, store: f.artifact_store_by_role })), { fixture_id: sessionFixtureId, store: sessionStore }]
const resolutionRows = [], selfRows = [], nonArtifactRows = [], allowlistRows = [], equalityRows = []
function schemaCompanions(schema, field) {
  const base = field.replace(/_ref(_or_unavailable)?$/, ''), suffix = field.endsWith('_or_unavailable') ? '_or_unavailable' : ''
  const bytes = [`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`, field === 'request_artifact_ref' ? 'request_artifact_sha256' : '', field === 'response_payload_ref' ? 'response_payload_bytes_sha256' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  const fingerprints = [`${base}_fingerprint${suffix}`, field === 'hold_row_ref' ? 'hold_fingerprint' : '', field === 'receipt_ref' ? 'receipt_precommit_fingerprint' : '', field === 'response_payload_ref' ? 'result_fingerprint' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  return { bytes: [...new Set(bytes)].sort(cp), fingerprints: [...new Set(fingerprints)].sort(cp) }
}
for (const item of persistedPayloadVariants) {
  const schema = schemaAt(item.schema_ref, item.variant)
  for (const field of schema.exact_keys.filter(refToken)) { const found = schemaCompanions(schema, field); equalityRows.push({ source_schema_ref: item.schema_ref, source_schema_variant: item.variant, reference_field: field, companion_bytes_fields: found.bytes, companion_fingerprint_fields: found.fingerprints }) }
}
for (const item of persistedRowVariants) {
  const schema = schemaAt(item.schema_ref, item.variant)
  for (const field of schema.exact_keys.filter(refToken)) { const found = schemaCompanions(schema, field); equalityRows.push({ source_schema_ref: item.schema_ref, source_schema_variant: item.variant, reference_field: field, companion_bytes_fields: found.bytes, companion_fingerprint_fields: found.fingerprints }) }
}
for (const branch of roleStores) {
  const all = Object.entries(branch.store).flatMap(([role, artifact]) => identities(role, artifact))
  for (const [sourceRole, artifact] of Object.entries(branch.store)) {
    const schema = artifactSchema(artifact), value = artifactValue(artifact), sourceSchemaRef = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, sourceVariant = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant
    if (!schema?.exact_keys || !value || typeof value !== 'object') continue
    if (canonicalR44(Object.keys(value).sort(cp)) !== canonicalR44([...schema.exact_keys].sort(cp))) throw new Error(`R49_selected_schema_keys:${branch.fixture_id}:${sourceRole}`)
    for (const field of schema.exact_keys.filter(refToken)) {
      const reference = value[field], [bytesField, fpField] = companions(sourceRole, field, value)
      if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonArtifactRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: sourceSchemaRef, source_schema_variant: sourceVariant, source_field: field, reference_literal: reference ?? null, classification: 'closed_null_or_unavailable_sentinel' }); continue }
      let matches = all.filter(candidate => candidate.ref === reference), nonSelf = matches.filter(candidate => candidate.role !== sourceRole); if (nonSelf.length) matches = nonSelf
      if (!nonSelf.length && matches.length) { selfRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: sourceSchemaRef, source_schema_variant: sourceVariant, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
      if (matches.length > 1 && matches.every(candidate => candidate.role === 'receipt')) matches = matches.filter(candidate => candidate.identity_kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
      if (!matches.length) {
        const optionalRaw = optionalRawFields.has(field)
        const allowed = schemaReferenceFields.has(field) ? 'closed_semantic_schema_reference' : explicitExternalFields.has(field) ? 'closed_runtime_or_external_authority_identity' : optionalRaw ? 'closed_optional_raw_or_unavailable_identity' : null
        if (!allowed) throw new Error(`R49_unresolved_internal_reference:${branch.fixture_id}:${sourceRole}:${sourceSchemaRef}:${field}`)
        const row = { source_schema_ref: sourceSchemaRef, source_schema_variant: sourceVariant, source_field: field, identity_kind: allowed }
        allowlistRows.push(row); nonArtifactRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, ...row, reference_literal: reference, classification: allowed }); continue
      }
      if (matches.length !== 1) throw new Error(`R49_selected_reference_match:${branch.fixture_id}:${sourceRole}:${field}:${matches.length}`)
      const target = matches[0], actualBytes = bytesField && Object.hasOwn(value, bytesField) ? value[bytesField] : 'UNAVAILABLE', actualFp = fpField && Object.hasOwn(value, fpField) ? value[fpField] : 'UNAVAILABLE'
      if (actualBytes !== 'UNAVAILABLE' && actualBytes !== target.bytes_sha256) throw new Error(`R49_selected_reference_bytes:${branch.fixture_id}:${sourceRole}:${field}`)
      if (actualFp !== 'UNAVAILABLE' && actualFp !== target.fingerprint) throw new Error(`R49_selected_reference_fingerprint:${branch.fixture_id}:${sourceRole}:${field}`)
      resolutionRows.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: sourceSchemaRef, source_schema_variant: sourceVariant, source_field: field, target_role: target.role, target_identity_kind: target.identity_kind, reference, companion_bytes_field_or_UNAVAILABLE: actualBytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : bytesField, companion_bytes_sha256_or_UNAVAILABLE: actualBytes, companion_fingerprint_field_or_UNAVAILABLE: actualFp === 'UNAVAILABLE' ? 'UNAVAILABLE' : fpField, companion_fingerprint_or_UNAVAILABLE: actualFp, exact_match_count: 1 })
    }
  }
}
const sortRows = rows => rows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
sortRows(resolutionRows); sortRows(selfRows); sortRows(nonArtifactRows)
const uniqueAllow = new Map(); for (const row of allowlistRows) uniqueAllow.set(`${row.source_schema_ref}|${row.source_schema_variant}|${row.source_field}`, row)
const uniqueEquality = new Map(); for (const row of equalityRows) uniqueEquality.set(`${row.source_schema_ref}|${row.source_schema_variant}|${row.reference_field}`, row)
const correlations = resolutionRows.flatMap((row, index) => ['reference', 'companion_bytes_or_explicit_unavailable', 'companion_fingerprint_or_explicit_unavailable'].map(kind => ({ correlation_id: `r49:${String(index + 1).padStart(4, '0')}:${kind}`, ...row, correlation_kind: kind })))
r49.authority_operation_explicit_nonartifact_reference_field_allowlist = { schema_version: 'ctrl.g24.authority-operation-explicit-nonartifact-reference-field-allowlist.r49.v1', derivation: 'independently_classified_by_selected_schema_ref_variant_and_field_not_reference_value_format', exact_rows: sortRows([...uniqueAllow.values()]), generic_unmatched_runtime_or_external_fallback: 'forbidden', internal_artifact_or_authority_row_reference_may_use_allowlist: false }
r49.authority_operation_complete_schema_cross_artifact_equality_registry = { schema_version: 'ctrl.g24.authority-operation-complete-schema-cross-artifact-equality-registry.r49.v1', derivation: 'mechanically_from_every_selected_closed_schema_reference_field_and_declared_companion_fields', exact_rows: sortRows([...uniqueEquality.values()]), selected_fixture_subset_is_authority: false }
r49.authority_operation_selected_reference_traversal_authority = { schema_version: 'ctrl.g24.authority-operation-selected-reference-traversal-authority.r49.v1', final_role_store_snapshot_sha256: hash(roleStores), source: 'independent_traversal_of_every_reference_bearing_field_in_every_final_selected_closed_role_store', explicit_nonartifact_allowlist_ref: 'authority_operation_explicit_nonartifact_reference_field_allowlist', exact_selected_artifact_reference_count: resolutionRows.length, exact_self_reference_count: selfRows.length, exact_non_artifact_reference_count: nonArtifactRows.length, self_identity_allowlist: selfRows, non_artifact_reference_allowlist: nonArtifactRows, post_generation_artifact_mutation: 'forbidden' }
r49.authority_operation_artifact_resolution_authority = { schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r49.v1', traversal_authority_ref: 'authority_operation_selected_reference_traversal_authority', final_role_store_snapshot_sha256: hash(roleStores), zero_matches_for_internal_reference: 'hold_without_disclosure_or_write', multiple_matches: 'hold_without_disclosure_or_write', exact_resolution_count: resolutionRows.length, rows: resolutionRows }
r49.authority_operation_restart_correlation_authority = { schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r49.v1', traversal_authority_ref: 'authority_operation_selected_reference_traversal_authority', complete_schema_equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', final_role_store_snapshot_sha256: hash(roleStores), derivation: 'mechanical_three_way_projection_of_every_final_selected_exact_one_artifact_reference', exact_row_count: correlations.length, rows: correlations, sole_verifier: true }
r49.fixture_schema_validator = { ...r49.fixture_schema_validator, schema_version: 'ctrl.g24.fixture-schema-validator.r49.v1', validation_scope: 'complete_active_persisted_schema_universe_plus_final_role_stores_exact_selected_schema_traversal_zero_omissions_exact_one_resolution_complete_companion_correlation_and_time_valid_session_issuability' }

// Final semantic registry and self-sealed manifest are regenerated only after R49 authorities are final.
r49.semantic_reference_field_specification = { ...materializedR44.semantic_reference_field_specification, schema_version: 'ctrl.g24.semantic-reference-field-specification.r49.v1', source: 'independently_pinned_R44_reference_vocabulary_extended_over_final_immutable_R49_semantic_source_snapshot' }
const semanticAuthorityPaths = [...new Set([...r48SemanticAuthorityPaths, 'authority_operation_persisted_identity_primitives', 'authority_operation_complete_active_persisted_schema_universe', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_complete_schema_cross_artifact_equality_registry'])].sort(cp)
const excludedDerived = new Set(['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry'])
const sourcePaths = semanticAuthorityPaths.filter(path => !excludedDerived.has(path)), derivedTargets = ['authority_runtime_semantic_manifest']
const frozenTargets = [...new Set(materializedR48.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.map(row => row.exact_target_path_or_UNAVAILABLE).filter(path => path !== 'UNAVAILABLE'))].sort(cp)
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r49.v1'
r49.authority_runtime_semantic_manifest_hash_contract = { ...r49.authority_runtime_semantic_manifest_hash_contract, schema_version: hashVersion, content_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R49', dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R49', graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R49', envelope_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R49' }
r49.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r49.v1', derivation: 'bounded_exact_extension_from_frozen_R48_complete_active_schema_identity_and_consistent_session_lineage', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.authority_operation_registry', '$.fingerprint_schemas.authority_operation_registry_committed_r49', '$.canonical_json_utf8_encoding', '$.proof_nonce_ledger', '$.authority_operation_persisted_identity_primitives', '$.authority_operation_replay_restart_fixtures', '$.authority_operation_committed_receipt_identity_fixtures', '$.authority_operation_receipt_materialization_authority', '$.authority_operation_committed_target_identity_authority', '$.authority_operation_complete_active_persisted_schema_universe', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_explicit_nonartifact_reference_field_allowlist', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_selected_reference_traversal_authority', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.semantic_reference_field_specification', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: [], every_changed_or_new_semantic_object_has_r49_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r49.required_negative_fixture_families = [...new Set([...r49.required_negative_fixture_families, 'consistent_time_valid_session_committed_lineage', 'explicit_schema_field_nonartifact_allowlist', 'complete_active_persisted_schema_identity_universe', 'exact_authority_ref_resolution', 'complete_schema_cross_artifact_equalities'])]
r49.visible_surface_changes = []; r49.external_actions_authorized = []
delete r49.authority_runtime_semantic_manifest; delete r49.authority_runtime_semantic_dependency_owner_map; delete r49.authority_runtime_semantic_reference_owner_map; delete r49.authority_runtime_semantic_reference_field_registry
const snapshot = ownedSnapshotR44(r49), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R49-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_source_paths: sourcePaths, source_objects: Object.fromEntries(sourcePaths.map(path => [path, get(snapshot, path)])) })
const aliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
const derivedVersions = { authority_runtime_semantic_manifest: 'ctrl.g24.runtime-semantic-authority-manifest.r49.v1', authority_runtime_semantic_reference_field_registry: 'ctrl.g24.runtime-semantic-reference-field-registry.r49.v1', authority_runtime_semantic_reference_owner_map: 'ctrl.g24.runtime-semantic-reference-owner-map.r49.v1', authority_runtime_semantic_dependency_owner_map: 'ctrl.g24.runtime-semantic-dependency-owner-map.r49.v1' }
function version(path, value) { if (value?.schema_version) return value.schema_version; return materializedR48.authority_runtime_semantic_manifest.rows.find(row => row.authority_path === path)?.authority_schema_version ?? 'ctrl.g24.semantic-authority.unversioned-frozen.v1' }
function owner(path) { let selected = ''; for (const p of semanticAuthorityPaths) if ((path === p || path.startsWith(`${p}.`)) && p.length > selected.length) selected = p; return selected }
function target(reference) { if (aliases[reference]) return aliases[reference]; const normalized = reference.replace(/^\$\./, ''); if (normalized.includes('*') || reference.includes('_or_') || reference.includes('|') || reference.includes(':')) return 'UNAVAILABLE'; if (semanticAuthorityPaths.some(path => normalized === path || normalized.startsWith(`${path}.`)) || derivedTargets.includes(normalized) || frozenTargets.includes(normalized)) return normalized; return 'UNAVAILABLE' }
function targetVersion(path) { if (path === 'UNAVAILABLE') return 'UNAVAILABLE'; let cursor = path; while (cursor) { if (derivedVersions[cursor]) return derivedVersions[cursor]; const value = get(snapshot, cursor); if (value?.schema_version) return value.schema_version; const cut = cursor.lastIndexOf('.'); if (cut < 0) break; cursor = cursor.slice(0, cut) } return version(path, get(snapshot, path)) }
const semanticRows = [], semanticSeen = new Set(), nonSuffix = new Set(r49.semantic_reference_field_specification.exact_non_suffix_semantic_fields)
function addSemantic(source, fieldPath, fieldName, literal, pattern) { const t = target(literal), key = `${source}|${fieldPath}|${literal}`; if (semanticSeen.has(key)) return; semanticSeen.add(key); const o = t === 'UNAVAILABLE' ? source : owner(t) || source; semanticRows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : t !== 'UNAVAILABLE' ? (fieldName.includes('schema') ? 'exact_nested_schema_reference' : 'exact_nested_semantic_reference') : literal.includes('*') ? 'discriminated_wildcard_reference' : literal.includes('_or_') || literal.includes('|') ? 'closed_discriminated_compound_reference' : 'runtime_identity_or_field_reference', reference_literal: literal, owner_authority_path: o, expected_owner_schema_version: targetVersion(o), exact_target_path_or_UNAVAILABLE: t, exact_target_schema_version_or_UNAVAILABLE: targetVersion(t), runtime_identity_kind_or_UNAVAILABLE: t === 'UNAVAILABLE' ? 'runtime_identity_or_field_reference' : 'UNAVAILABLE', specification_pattern_id: pattern }) }
function walkSemantic(value, source, path = source) { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { const next = `${path}.${key}`, selected = refToken(key) || nonSuffix.has(key); if (selected) { if (Array.isArray(item)) item.forEach((entry, index) => { if (typeof entry === 'string') addSemantic(source, `${next}.${index}`, key, entry, refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') }); else if (typeof item === 'string') addSemantic(source, next, key, item, refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } if (typeof item === 'string') { const t = target(item); if (t !== 'UNAVAILABLE' && owner(t) !== source) addSemantic(source, next, key, item, 'semantic_value') } walkSemantic(item, source, next) } }
for (const path of sourcePaths) if (path !== 'semantic_reference_field_specification') walkSemantic(get(snapshot, path), path)
semanticRows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
r49.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r49.v1', specification_ref: 'semantic_reference_field_specification', source_snapshot_domain_ascii: 'CTRL-G24-R49-FINAL-SEMANTIC-SOURCE-SNAPSHOT', source_snapshot_sha256: snapshotSha, independently_declared_source_paths: sourcePaths, independently_declared_derived_target_paths: derivedTargets, independently_declared_frozen_target_paths: frozenTargets, excluded_self_derived_paths: [...excludedDerived].sort(cp), derivation_order: r49.materialization.strict_finalization_dag, post_snapshot_source_mutation: 'forbidden', row_schema: closed('ctrl.g24.runtime-semantic-reference-field-registry-row.r49.v1', { source_authority_path: id, field_path: id, field_name: id, reference_kind: id, reference_literal: id, owner_authority_path: id, expected_owner_schema_version: id, exact_target_path_or_UNAVAILABLE: id, exact_target_schema_version_or_UNAVAILABLE: id, runtime_identity_kind_or_UNAVAILABLE: id, specification_pattern_id: id }), exact_occurrence_rows: semanticRows, exact_expected_occurrence_count: semanticRows.length, occurrence_bijection: 'independent_rescan_of_final_emitted_non_derived_source_objects_equals_rows_byte_for_byte', unknown_reference_semantics: 'reject_materialization_and_hold_without_disclosure_or_write' }
r49.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r49.v1', specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', source_snapshot_sha256: snapshotSha, row_count: semanticRows.length, ownership_rule: 'recomputed_only_from_final_snapshot_registry_rows' }
const occurrences = {}; for (const row of semanticRows) if (row.owner_authority_path !== row.source_authority_path) (occurrences[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const priorOwners = Object.fromEntries(materializedR48.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(priorOwners[path] ?? []), ...[...(occurrences[path] ?? [])]])].filter(p => semanticAuthorityPaths.includes(p) && p !== path).sort(cp), unqualified_legacy_alias_owner_path: path }))
r49.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r49.v1', source_snapshot_sha256: snapshotSha, exact_paths: semanticAuthorityPaths, rows: ownerRows, reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', owner_map_derivation: 'exactly_from_final_registry_rows_plus_frozen_explicit_non_reference_dependencies', unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write' }
const contentHash = (path, value) => hash({ domain_ascii: r49.authority_runtime_semantic_manifest_hash_contract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(value) }), depHash = (path, scope, rows) => hash({ domain_ascii: r49.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows })
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, get(r49, path))])), graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = get(r49, path), direct = graph[path].map(p => ({ authority_path: p, authority_content_sha256: contentHashes[p] })), all = transitive(path).map(p => ({ authority_path: p, authority_content_sha256: contentHashes[p] })); return { authority_path: path, semantic_kind: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value, exact_keyset: value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).sort(cp) : [], authority_schema_ref: path, authority_schema_version: version(path, value), direct_dependency_paths: direct.map(row => row.authority_path), direct_dependency_content_hashes: direct, direct_dependency_set_sha256: depHash(path, 'direct', direct), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: depHash(path, 'transitive', all), authority_content_sha256: contentHashes[path] } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r49.v1', type: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest', snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', resource_limits_ref: 'canonical_snapshot_resource_limits', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', source_snapshot_sha256: snapshotSha, exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, manifest_graph_sha256: hash({ domain_ascii: r49.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: manifestRows }) }
r49.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r49.v1', { schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r49.v1' }, type: { const: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest' }, snapshot_pipeline_ref: { const: 'owned_immutable_canonical_snapshot_pipeline' }, resource_limits_ref: { const: 'canonical_snapshot_resource_limits' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, reference_field_specification_ref: { const: 'semantic_reference_field_specification' }, reference_field_registry_ref: { const: 'authority_runtime_semantic_reference_field_registry' }, source_snapshot_sha256: fp, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, manifest_graph_sha256: fp, manifest_envelope_seal_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
r49.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: r49.authority_runtime_semantic_manifest_hash_contract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifestWithoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r49)
export const materializedR49 = r49
export const materializedR49Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r49SemanticAuthorityPaths = semanticAuthorityPaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR49Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR49Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R49 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
