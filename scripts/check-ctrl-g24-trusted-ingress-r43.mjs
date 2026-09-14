import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { types as utilTypes } from 'node:util'
import { materializedR43, materializedR43Output, ownedSnapshotR43, canonicalR43, r43SemanticAuthorityPaths, r43ResourceLimits } from './materialize-ctrl-g24-trusted-ingress-r43.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r43.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const shaBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const shaFile = path => shaBytes(read(path))
function ok(message, value) { if (!value) throw new Error(message) }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)), right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function validUnicode(value) { for (let index = 0; index < value.length; index += 1) { const unit = value.charCodeAt(index); if (unit >= 0xd800 && unit <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) return false; index += 1 } else if (unit >= 0xdc00 && unit <= 0xdfff) return false } return true }

// This is intentionally independent of the materializer implementation.
function takeSnapshot(value, path = '$', ancestors = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') { if (!validUnicode(value)) throw new Error(`unicode:${path}`); return value }
  if (typeof value === 'number') { if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error(`number:${path}`); return value }
  if (typeof value !== 'object') throw new Error(`unsupported:${path}`)
  if (utilTypes.isProxy(value)) throw new Error(`proxy:${path}`)
  if (ancestors.has(value)) throw new Error(`cycle:${path}`)
  const array = Array.isArray(value), prototype = Object.getPrototypeOf(value)
  if ((array && prototype !== Array.prototype) || (!array && prototype !== Object.prototype && prototype !== null)) throw new Error(`prototype:${path}`)
  let keys
  try { keys = Reflect.ownKeys(value) } catch { throw new Error(`reflect:${path}`) }
  if (keys.some(key => typeof key === 'symbol')) throw new Error(`symbol:${path}`)
  ancestors.add(value)
  if (array) {
    const expected = new Set(['length', ...Array.from({ length: value.length }, (_, index) => String(index))])
    if (keys.length !== expected.size || keys.some(key => !expected.has(key))) throw new Error(`array_keys:${path}`)
    const output = []
    for (let index = 0; index < value.length; index += 1) {
      let descriptor
      try { descriptor = Reflect.getOwnPropertyDescriptor(value, String(index)) } catch { throw new Error(`descriptor:${path}[${index}]`) }
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.get || descriptor.set) throw new Error(`array_descriptor:${path}[${index}]`)
      output.push(takeSnapshot(descriptor.value, `${path}[${index}]`, ancestors))
    }
    ancestors.delete(value)
    return Object.freeze(output)
  }
  const output = Object.create(null)
  for (const key of keys) {
    if (!validUnicode(key)) throw new Error(`unicode_key:${path}`)
    let descriptor
    try { descriptor = Reflect.getOwnPropertyDescriptor(value, key) } catch { throw new Error(`descriptor:${path}.${key}`) }
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.get || descriptor.set) throw new Error(`object_descriptor:${path}.${key}`)
    output[key] = takeSnapshot(descriptor.value, `${path}.${key}`, ancestors)
  }
  ancestors.delete(value)
  return Object.freeze(output)
}
function canonicalSnapshot(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonicalSnapshot).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonicalSnapshot(value[key])}`).join(',')}}` }
function canonical(value) { return canonicalSnapshot(takeSnapshot(value)) }
const canonicalSha = value => shaBytes(Buffer.from(canonical(value), 'utf8'))
const same = (a, b) => canonical(a) === canonical(b)
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function schemaAt(contract, schemaRef, variant = 'UNAVAILABLE') { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema }
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r43.v1` }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function transitive(graph, path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }

const expectedParent = { commit: 'f02ea3776721f9348a35474ec8c5b3a1c0538816', tree: '3c99090b5bddcd69917464d63a3d3e1d59114d78', human_blob: '5502e078a368665c664d62c87b7d85c8f06787b1', machine_blob: '44844b758675fa6a2b73ee05cd066f18353735a0', qa_blob: 'a7401e6e9d134aedb27f79cab3158b8c5ae33184', checker_blob: '3b73c6c559e42f407a36a9d40fca13cd3722de7d', materializer_blob: '72eff7a0b24770f19118fcc804b4c0a9660810a9', founder_checker_blob: '7c581a32bd14b2fb91176cf254ddfc41e756a47e', adjudication: 'veto' }
const frozenR42 = { machine: '6cbbb9a31e23e9b04ab527079b0ee1df2eb8f6c284d58c76f136acc9f0f190fe', materializer: '30c45242bb460a0c2b5efd735d264dc72a522020107dde3cbf7b10c4a3027733', checker: '20a760610fd448b6e4ad95a3e243da73c6d7867664d3000976c755717874c262', human: '1c1a0a8bf18abd6929fa06ed7c1d8bfe39d2141eb0234180f830328b9afabbf4', qa: 'ff12d66cce34c38a624975403095eec2fef55f128aee8d272e7f2aec6fdac954' }
const expected = { paths: '3a35335e74bde4e5f50caa5b1d8465111f2daf114f42583feecbd82c0da284d3', rows: '356ae0d52b7a31f58b4e5e0e16f6af9482e0dafbff5e3d15d0d602034b987f94', graph: '79cce4ecef9b80c8bc7f2e012593a0d1d8406c89a250862ac25560c74e727afe', envelope: '18536a43ccde658cae06eb930739e449e962a69a7a22e6d6228e4c4441d99436', depmap: '646f8b22982b2056fabb36fa528abdbbb0754dc0476f760c32ddd4339d47ac8c', refrows: '07e87e062e32d5d4e8e9baed73239fa0b98876bffc0dc58fb5e0ee2136d49666', refspec: '25b0f7e9a8260dd40e9b0e3d9e6a992ebd099a6990f2b1e2ebd6dd3963dc7876', topLevel: '63c1068551959ff35189f7d2fa76369bedfdc649dad2905483c1662c65f9231e', fixtures: '226f9cd938499182c7548a1f34c7e6a94ea349a06f681f8d42ba1d4fc41a982e', correlations: 'fc4d79e1c88b246dffd39ae5a5a5e222725f39c29ad1fc642e0808d5b4c7cffe' }
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r43.v1'
function contentHash(path, value) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R43', manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: takeSnapshot(value) }) }
function dependencyHash(path, scope, rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R43', manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R43', manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R43', manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

function validateSpec(value, spec, path) {
  if (Object.hasOwn(spec ?? {}, 'const')) { ok(`const ${path}`, value === spec.const); return }
  if (Array.isArray(spec?.enum)) { ok(`enum ${path}`, spec.enum.includes(value)); return }
  if (spec?.type === 'enum') { ok(`typed enum ${path}`, Array.isArray(spec.values) && spec.values.includes(value)); return }
  if (spec?.type === 'sha256') { ok(`sha ${path}`, typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)); return }
  if (spec?.type === 'sha256_or_exact_literal') { ok(`sha/literal ${path}`, value === spec.literal || (typeof value === 'string' && /^[0-9a-f]{64}$/.test(value))); return }
  if (spec?.type === 'identifier') { ok(`identifier ${path}`, typeof value === 'string' && value.length > 0); return }
  if (spec?.type === 'canonical_timestamp') { ok(`timestamp ${path}`, typeof value === 'string' && new Date(value).toISOString() === value); return }
  if (spec?.type === 'base64url_without_padding') { ok(`base64url ${path}`, typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && !value.includes('=')); return }
  if (spec?.type === 'nullable') { if (value !== null) validateSpec(value, spec.value_schema, path); return }
  if (spec?.type === 'nonnegative_integer' || spec?.type === 'safe_nonnegative_integer') { ok(`nonnegative ${path}`, Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0)); return }
  if (spec?.type === 'positive_integer') { ok(`positive ${path}`, Number.isInteger(value) && value > 0); return }
  if (spec?.type === 'integer') { ok(`integer ${path}`, Number.isInteger(value) && !Object.is(value, -0)); return }
  if (spec?.type === 'boolean') { ok(`boolean ${path}`, typeof value === 'boolean'); return }
  if (String(spec?.type).includes('array')) { ok(`array ${path}`, Array.isArray(value)); return }
  if (spec?.schema_ref) { ok(`schema ref ${path}`, typeof value === 'string' && value.length > 0); return }
  throw new Error(`unsupported schema form:${path}:${canonical(spec)}`)
}
function validateArtifact(contract, artifact) {
  const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value
  ok('schema exists', schema && schema.type === 'object' && schema.additional_properties === false)
  ok('exact keys', same(Object.keys(row), schema.exact_keys) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))))
  for (const [field, spec] of Object.entries(schema.properties)) validateSpec(row[field], spec, `${artifact.fixture_artifact_id}.${field}`)
  const normative = artifact.normative_row_ref_preimage !== 'UNAVAILABLE'
  const rowRefField = artifact.schema_variant.startsWith('original_') ? 'registry_row_ref' : 'hold_row_ref'
  const fingerprintField = schema.fingerprint_field
  if (normative) {
    const included = schema.row_ref_preimage_included_fields
    ok('normative included fields', Array.isArray(included) && included.length > 0)
    if (rowRefField === 'registry_row_ref') ok('registry exclusions exact', same(schema.row_ref_preimage_excluded_fields, ['registry_row_ref', 'registry_fingerprint']) && same(included, schema.exact_keys.filter(field => !['registry_row_ref', 'registry_fingerprint'].includes(field))))
    const expectedIdentity = { domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: included.map(field => ({ field, value: row[field] })) }
    ok('identity preimage', same(expectedIdentity, artifact.normative_row_ref_preimage))
    ok('row ref', row[rowRefField] === canonicalSha(expectedIdentity))
  }
  ok('canonical bytes', artifact.canonical_row_bytes_utf8 === canonical(row))
  ok('bytes sha', artifact.canonical_row_bytes_sha256 === shaBytes(Buffer.from(artifact.canonical_row_bytes_utf8, 'utf8')))
  const fingerprintSchema = resolvePath(contract, artifact.fingerprint_schema_ref), expectedPreimage = {}
  ok('fingerprint schema ref', fingerprintSchema && schema.fingerprint_ref === artifact.fingerprint_schema_ref)
  for (const field of fingerprintSchema.preimage_order) { ok(`fingerprint operand ${field}`, field === 'domain_ascii' || Object.hasOwn(row, field)); expectedPreimage[field] = field === 'domain_ascii' ? fingerprintSchema.domain_ascii : row[field] }
  ok('fingerprint preimage', same(expectedPreimage, artifact.fingerprint_preimage))
  ok('fingerprint', artifact.recorded_fingerprint === canonicalSha(expectedPreimage) && row[fingerprintField] === artifact.recorded_fingerprint)
  for (const prefix of ['raw_target', 'raw_proof', 'raw_bundle', 'raw_issuer_proof', 'raw_evaluator_proof']) if (Object.hasOwn(row, `${prefix}_availability`)) { const unavailable = row[`${prefix}_availability`] === 'unavailable'; ok(`availability ${prefix}`, unavailable === (row[`${prefix}_ref_or_unavailable`] === 'UNAVAILABLE' && row[`${prefix}_sha256_or_unavailable`] === 'UNAVAILABLE')) }
  return row
}
function selection(row) { return { fresh_selection_row_id: row.fresh_selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.fresh_selection_schema_version } }
function runRestart(contract, fixture) {
  const registry = validateArtifact(contract, fixture.registry_artifact), recovered = selection(registry)
  const expectedTarget = fixture.operation_name === 'bootstrap_case_session_root_anchor' ? 'case_session_root_trust_anchors' : 'case_server_session_principal_evidence'
  ok('operation target store', registry.target_store === expectedTarget)
  if (fixture.hold_artifact_or_UNAVAILABLE !== 'UNAVAILABLE') {
    const hold = validateArtifact(contract, fixture.hold_artifact_or_UNAVAILABLE)
    ok('registry/hold operation', registry.operation_id === hold.operation_id && registry.idempotency_key === hold.idempotency_key && registry.operation_name === hold.operation_name && registry.target_store === hold.target_store)
    ok('registry/hold selection', same(recovered, selection(hold)))
    ok('registry/hold identity', registry.hold_row_ref === hold.hold_row_ref && registry.hold_fingerprint === hold.hold_fingerprint)
  }
  ok('expected selection', same(recovered, fixture.expected_reconstructed_selection))
  const classifier = fixture.classifier_row
  ok('classifier exact', classifier.operation_name === fixture.operation_name && classifier.result_branch === fixture.result_branch && classifier.expected_selection_row_id === recovered.fresh_selection_row_id && classifier.expected_proof_family === recovered.proof_family && classifier.expected_branch_class === recovered.branch_class && classifier.expected_evidence_kind === recovered.evidence_kind && classifier.expected_selector_version === recovered.fresh_selection_schema_version)
  return recovered
}

function getDot(value, path) { let current = value; for (const part of path.split('.')) { if (current === undefined || current === null || current === 'UNAVAILABLE') return undefined; current = current[part] } return current }
function validatePersistedArtifact(contract, artifact) {
  ok('persisted artifact metadata', typeof artifact.payload_schema_ref === 'string' && typeof artifact.stored_row_schema_version === 'string')
  const payloadBytes = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? artifact.payload_canonical_bytes_utf8 : canonical(artifact.payload_value)
  ok('persisted payload bytes', payloadBytes === artifact.payload_canonical_bytes_utf8)
  const payloadHash = shaBytes(Buffer.from(payloadBytes, 'utf8'))
  ok('persisted payload hash/ref', payloadHash === artifact.payload_bytes_sha256 && payloadHash === artifact.bytes_sha256 && payloadHash === artifact.ref)
  if (artifact.payload_schema_ref !== 'opaque_bounded_bytes') {
    const schema = schemaAt(contract, artifact.payload_schema_ref, artifact.payload_schema_variant)
    ok('persisted payload schema', schema && schema.schema_version === artifact.payload_schema_version && schema.additional_properties === false && same(Object.keys(artifact.payload_value), schema.exact_keys))
    for (const [field, spec] of Object.entries(schema.properties)) validateSpec(artifact.payload_value[field], spec, `${artifact.artifact_role}.${field}`)
  }
  const row = artifact.stored_row_value
  ok('persisted row fingerprint', artifact.stored_row_fingerprint === row.artifact_fingerprint || artifact.stored_row_fingerprint === row.nonce_receipt_fingerprint)
  if (Object.hasOwn(row, 'artifact_ref')) {
    ok('content address row', row.artifact_ref === artifact.ref)
    const hashField = Object.hasOwn(row, 'canonical_bytes_sha256') ? 'canonical_bytes_sha256' : 'opaque_bytes_sha256'
    ok('content address hash field', row[hashField] === artifact.bytes_sha256)
  } else ok('nonce content address row', row.nonce_receipt_ref === artifact.ref)
  ok('stored row bytes fingerprint', artifact.stored_row_canonical_bytes_sha256 === canonicalSha(row))
  ok('content address verified marker', artifact.content_address_rule_verified === true)
}

function artifactTriple(artifact) { return { ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint } }
function rowTriple(prefix, row) { return { ref: row[`${prefix}_ref`], bytes_sha256: row[`${prefix}_bytes_sha256`], fingerprint: row[`${prefix}_fingerprint`] } }
function verifyLineage(contract, fixture) {
  const registry = validateArtifact(contract, fixture.registry_artifact)
  const history = validateArtifact(contract, fixture.historical_response_artifact)
  const payload = validateArtifact(contract, fixture.replay_payload_artifact)
  const envelope = validateArtifact(contract, fixture.replay_envelope_artifact)
  const result = fixture.result_artifact
  ok('request fingerprint join', fixture.request_fingerprint === registry.request_fingerprint)
  ok('request artifact join', registry.request_bytes_ref === fixture.request_artifact.ref && registry.request_bytes_sha256 === fixture.request_artifact.bytes_sha256)
  ok('operation join', [history.operation_name, payload.operation_name, envelope.operation_name].every(value => value === registry.operation_name))
  ok('operation id join', [history.operation_id, payload.operation_id, envelope.operation_id].every(value => value === registry.operation_id))
  ok('branch join', [history.result_branch, payload.historical_result_branch, envelope.historical_result_branch].every(value => value === fixture.result_branch))
  ok('result join', same({ ref: history.result_ref, bytes_sha256: history.result_bytes_sha256, fingerprint: history.result_fingerprint }, result) && same({ ref: payload.historical_result_ref, bytes_sha256: payload.historical_result_bytes_sha256, fingerprint: payload.historical_result_fingerprint }, result))
  ok('history join', same(rowTriple('historical_response', registry), artifactTriple(fixture.historical_response_artifact)) && same({ ref: payload.stored_historical_response_ref, bytes_sha256: payload.stored_historical_response_bytes_sha256, fingerprint: payload.stored_historical_response_fingerprint }, artifactTriple(fixture.historical_response_artifact)))
  ok('payload join', same({ ref: envelope.payload_ref, bytes_sha256: envelope.payload_bytes_sha256, fingerprint: envelope.payload_fingerprint }, artifactTriple(fixture.replay_payload_artifact)))
  ok('envelope response join', same({ ref: envelope.replay_response_ref, bytes_sha256: envelope.replay_response_bytes_sha256, fingerprint: envelope.replay_response_fingerprint }, artifactTriple(fixture.historical_response_artifact)))
  if (fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE') {
    ok('committed result join', same({ ref: registry.result_ref, bytes_sha256: registry.result_bytes_sha256, fingerprint: registry.result_fingerprint }, result))
    ok('committed registry join', payload.committed_registry_row_ref === registry.registry_row_ref && payload.committed_registry_row_fingerprint === registry.registry_fingerprint)
  } else {
    const hold = validateArtifact(contract, fixture.hold_artifact_or_UNAVAILABLE)
    ok('held request join', hold.request_artifact_ref === fixture.request_artifact.ref && hold.request_artifact_sha256 === fixture.request_artifact.bytes_sha256 && hold.request_fingerprint === fixture.request_fingerprint)
    ok('held identity join', registry.operation_id === hold.operation_id && registry.idempotency_key === hold.idempotency_key)
    ok('held result join', same({ ref: hold.result_ref, bytes_sha256: hold.result_bytes_sha256, fingerprint: hold.result_fingerprint }, result) && same({ ref: registry.hold_result_ref, bytes_sha256: registry.hold_result_bytes_sha256, fingerprint: registry.hold_result_fingerprint }, result))
    ok('hold authority join', registry.hold_row_ref === hold.hold_row_ref && registry.hold_fingerprint === hold.hold_fingerprint && payload.hold_row_ref === hold.hold_row_ref && payload.hold_row_fingerprint === hold.hold_fingerprint)
    ok('held registry join', payload.held_registry_row_ref === registry.registry_row_ref && payload.held_registry_row_fingerprint === registry.registry_fingerprint)
    ok('held time join', registry.held_at === hold.held_at && payload.held_at === hold.held_at)
    if (hold.hold_kind === 'session_dual_proof') {
      const evidenceArtifact = fixture.session_evidence_or_UNAVAILABLE.artifact
      const evidence = validateArtifact(contract, evidenceArtifact)
      const evidenceTriple = artifactTriple(evidenceArtifact)
      ok('session evidence join', same({ ref: registry.session_hold_evidence_ref_or_unavailable, bytes_sha256: registry.session_hold_evidence_bytes_sha256_or_unavailable, fingerprint: registry.session_hold_evidence_fingerprint_or_unavailable }, evidenceTriple) && same({ ref: hold.session_hold_evidence_ref, bytes_sha256: hold.session_hold_evidence_bytes_sha256, fingerprint: hold.session_hold_evidence_fingerprint }, evidenceTriple))
      if (registry.evidence_kind === 'verified_session_hold_evidence') {
        ok('verified two nonces', fixture.proof_and_nonce_evidence.exact_nonce_count === 2)
        ok('issuer proof join', evidence.issuer_proof_ref === fixture.proof_and_nonce_evidence.issuer_proof.ref && evidence.issuer_proof_fingerprint === fixture.proof_and_nonce_evidence.issuer_proof.fingerprint)
        ok('evaluator proof join', evidence.evaluator_proof_ref === fixture.proof_and_nonce_evidence.evaluator_proof.ref && evidence.evaluator_proof_fingerprint === fixture.proof_and_nonce_evidence.evaluator_proof.fingerprint)
        ok('nonce joins', evidence.issuer_nonce_receipt_ref === fixture.proof_and_nonce_evidence.issuer_nonce_receipt.ref && evidence.evaluator_nonce_receipt_ref === fixture.proof_and_nonce_evidence.evaluator_nonce_receipt.ref)
      } else {
        ok('raw zero nonces', fixture.proof_and_nonce_evidence.exact_nonce_count === 0)
        ok('raw role joins', evidence.raw_bundle_ref_or_unavailable === hold.raw_bundle_ref_or_unavailable && evidence.raw_evaluator_proof_ref_or_unavailable === hold.raw_evaluator_proof_ref_or_unavailable)
      }
    }
  }
  return runRestart(contract, fixture)
}

const pinnedNonSuffixReferenceFields = new Set(['authority', 'then', 'sole_writer', 'writer', 'source', 'target', 'derivation', 'binding', 'transaction_boundary', 'selected_branch_table', 'selected_matrix', 'selected_result_artifact_store_family'])
const pinnedAliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
function independentlyEnumerateReferences(contract) {
  const paths = contract.authority_runtime_semantic_manifest.exact_paths, pathSet = new Set(paths), excluded = new Set(['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry', 'semantic_reference_field_specification']), rows = [], seen = new Set()
  const tokenized = key => /(^|_)(ref|refs)($|_)/.test(key)
  const ownerFor = (literal, source) => { if (pinnedAliases[literal]) return pinnedAliases[literal]; const normalized = literal.replace(/^\$\./, '').replace('.variants.*.', '.variants.'); let owner = ''; for (const path of paths) if ((normalized === path || normalized.startsWith(`${path}.`)) && path.length > owner.length) owner = path; return owner || source }
  const add = (source, fieldPath, fieldName, literal, pattern) => { const owner = ownerFor(literal, source), key = `${source}|${fieldPath}|${literal}`; if (seen.has(key)) return; seen.add(key); rows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : owner === source ? 'runtime_identity_field_or_field_name_reference' : pattern === 'semantic_value' ? 'semantic_authority_reference' : fieldName.includes('schema') ? 'schema_reference' : literal.includes('*') ? 'discriminated_pattern_reference' : 'typed_reference', reference_literal: literal, owner_authority_path: owner, expected_owner_schema_version: semanticVersion(owner, resolvePath(contract, owner)), specification_pattern_id: pattern }) }
  const walk = (value, source, fieldPath = source) => { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { const next = `${fieldPath}.${key}`; if (tokenized(key) || pinnedNonSuffixReferenceFields.has(key)) { if (Array.isArray(item)) { for (let index = 0; index < item.length; index += 1) if (typeof item[index] === 'string') add(source, `${next}.${index}`, key, item[index], tokenized(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } else if (typeof item === 'string') add(source, next, key, item, tokenized(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } if (typeof item === 'string' && ownerFor(item, source) !== source) add(source, next, key, item, 'semantic_value'); walk(item, source, next) } }
  for (const path of paths) { ok(`manifest path ${path}`, pathSet.has(path)); if (!excluded.has(path)) walk(resolvePath(contract, path), path) }
  rows.sort((left, right) => codePointCompare(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
  return rows
}

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn(contract) } catch (error) { out.push(`${name}: ${error.stack}`) } }
  test('identity and closed scope', c => { ok('version', c.schema_version === 'ctrl.g24.trusted-ingress.r43.effective.v1'); ok('parent', same(c.supersedes, expectedParent)); ok('parent sha', c.materialization.frozen_input.sha256 === frozenR42.machine); ok('snapshot authority', c.materialization.snapshot_before_validation_hash_or_use === true && c.authority_runtime_semantic_manifest_hash_contract.hash_input === 'bounded_owned_immutable_snapshot_only'); ok('limits exact', c.canonical_snapshot_resource_limits.max_string_utf8_bytes === 8388608 && c.canonical_snapshot_resource_limits.max_total_string_utf8_bytes === 67108864 && c.canonical_snapshot_resource_limits.cumulative_limits_apply_before_next_value_copy === true); ok('no external change', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, [])) })
  if (out.length) return out
  test('compound and wildcard bindings are exact', c => { ok('old compound removed', !Object.hasOwn(c.case_authority_control_result_union, 'total_result_ref')); const total = c.case_authority_control_result_union.total_result_binding; ok('two variants', total.variants.length === 2 && total.exactly_one_variant === true && total.caller_selectable_variant === false); for (const row of total.variants) { let value = resolvePath(c, row.authority_ref); for (const part of row.result_path) value = value?.[part]; ok('total owner path', Array.isArray(value)) } ok('old wildcard removed', !Object.hasOwn(c.authority_operation_replay_derivation, 'exact_path_order_by_branch_ref')); const bindings = c.authority_operation_replay_derivation.exact_path_order_by_branch_bindings; ok('all replay variants', bindings.length === Object.keys(c.authority_operation_replay_branch_map.variants).length); for (const row of bindings) ok('replay path exists', Array.isArray(resolvePath(c, row.source_authority_ref).variants[row.source_variant][row.source_field])); const text = JSON.stringify(c); ok('no selected variant pseudo ref', !text.includes('.selected_variant') && !text.match(/"(?:source|destination)_schema_ref":"[^"]*selected_variant/)) })
  if (out.length) return out
  test('persisted content addressed lineage and four durable restarts', c => { const fixtureSet = c.authority_operation_replay_restart_fixtures; ok('counts', fixtureSet.fixtures.length === 4 && fixtureSet.registry_and_hold_artifact_count === 7 && fixtureSet.content_addressed_lineage_artifact_count === 37 && fixtureSet.complete_lineage_artifact_count === 44); const authorityRows = fixtureSet.fixtures.flatMap(fixture => [fixture.registry_artifact, ...(fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE' ? [] : [fixture.hold_artifact_or_UNAVAILABLE])]); ok('seven authority rows', authorityRows.length === 7); authorityRows.forEach(artifact => validateArtifact(c, artifact)); const operationIds = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.operation_id), idempotency = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.idempotency_key), registryRefs = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.registry_row_ref); ok('unique ids', new Set(operationIds).size === 4 && new Set(idempotency).size === 4 && new Set(registryRefs).size === 4); for (const fixture of fixtureSet.fixtures) { runRestart(c, fixture); for (const artifact of fixture.persisted_lineage_artifacts) validatePersistedArtifact(c, artifact) } const graph = c.authority_operation_restart_correlation_authority; ok('mechanical correlation coverage', graph.derivation.includes('mechanically_generated') && graph.exact_row_count === 201 && graph.rows.length === 201 && graph.exact_categories.includes('issuer_proof_bytes') && graph.exact_categories.includes('issuer_nonce_fingerprint') && graph.exact_categories.includes('raw_evaluator_bytes') && graph.exact_categories.includes('hold_branch')); for (const row of graph.rows) { const fixture = fixtureSet.fixtures.find(item => item.fixture_id === row.fixture_id), left = getDot(fixture, row.left_path), right = getDot(fixture, row.right_path); ok(`correlation ${row.correlation_id}`, left !== undefined && right !== undefined && same(left, right)) } })
  if (out.length) return out
  test('semantic reference universe has exact nested targets', c => { const registry = c.authority_runtime_semantic_reference_field_registry; ok('source independent', c.semantic_reference_field_specification.source.includes('not_any_R40_R41_or_R42_reference_map')); ok('not suffix only', registry.inference_from_suffix_only === 'forbidden'); ok('closed row schema', registry.row_schema.type === 'object' && registry.row_schema.additional_properties === false && same(registry.row_schema.exact_keys, Object.keys(registry.row_schema.properties))); ok('exact 5620 reference occurrences', registry.exact_expected_occurrence_count === 5620 && registry.exact_occurrence_rows.length === 5620 && c.authority_runtime_semantic_reference_owner_map.row_count === 5620); for (const row of registry.exact_occurrence_rows) { if (row.exact_target_path_or_UNAVAILABLE !== 'UNAVAILABLE') { const target = resolvePath(c, row.exact_target_path_or_UNAVAILABLE); ok(`exact target ${row.field_path}`, target !== undefined && row.exact_target_schema_version_or_UNAVAILABLE !== 'UNAVAILABLE' && row.runtime_identity_kind_or_UNAVAILABLE === 'UNAVAILABLE'); ok(`no top level fallback ${row.field_path}`, row.exact_target_path_or_UNAVAILABLE === row.reference_literal.replace(/^\$\./, '') || ['request_schema','operation_result_schema_derivation','authority_runtime_semantic_manifest_envelope_schema'].includes(row.exact_target_path_or_UNAVAILABLE)) } else ok(`runtime discriminator ${row.field_path}`, row.runtime_identity_kind_or_UNAVAILABLE !== 'UNAVAILABLE') } ok('r26 exact nested target intent', registry.exact_occurrence_rows.some(row => row.reference_literal.includes('issue_server_session_principal.target_intent_schema') && row.exact_target_path_or_UNAVAILABLE.includes('issue_server_session_principal.target_intent_schema'))); ok('r9 exact nested outbox claim', registry.exact_occurrence_rows.some(row => row.reference_literal.includes('outbox.claim_event_schema') && row.exact_target_path_or_UNAVAILABLE.includes('outbox.claim_event_schema'))); ok('substantially closes prior absent scan', registry.exact_occurrence_rows.length > 5236) })
  if (out.length) return out
  test('manifest exact closure', c => { const manifest = c.authority_runtime_semantic_manifest, paths = manifest.exact_paths, depmap = c.authority_runtime_semantic_dependency_owner_map; ok('path parity', same(paths, r43SemanticAuthorityPaths) && manifest.rows.length === paths.length && depmap.rows.length === paths.length); const graph = {}; for (let index = 0; index < paths.length; index += 1) { const path = paths[index], row = manifest.rows[index], owner = depmap.rows[index], value = resolvePath(c, path); ok(`${path} exists`, value !== undefined && row.authority_path === path && owner.authority_path === path); ok(`${path} shape`, row.semantic_kind === kindOf(value) && same(row.exact_keyset, keysetOf(value))); ok(`${path} content`, row.authority_content_sha256 === contentHash(path, value)); ok(`${path} deps`, same(row.direct_dependency_paths, owner.typed_owner_paths)); graph[path] = owner.typed_owner_paths } for (const path of paths) { const row = manifest.rows[paths.indexOf(path)], direct = graph[path].map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })), all = transitive(graph, path).map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })); ok(`${path} direct hash`, same(row.direct_dependency_content_hashes, direct) && row.direct_dependency_set_sha256 === dependencyHash(path, 'direct', direct)); ok(`${path} transitive hash`, same(row.transitive_dependency_content_hashes, all) && row.transitive_dependency_set_sha256 === dependencyHash(path, 'transitive', all)) } ok('graph hash', manifest.manifest_graph_sha256 === graphHash(manifest.rows)); const without = { ...manifest }; delete without.manifest_envelope_seal_sha256; ok('envelope hash', manifest.manifest_envelope_seal_sha256 === envelopeHash(without)); ok('literal pins', canonicalSha(paths) === expected.paths && canonicalSha(manifest.rows) === expected.rows && manifest.manifest_graph_sha256 === expected.graph && manifest.manifest_envelope_seal_sha256 === expected.envelope && canonicalSha(depmap) === expected.depmap && canonicalSha(c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows) === expected.refrows && canonicalSha(c.semantic_reference_field_specification) === expected.refspec && canonicalSha(Object.keys(c).sort(codePointCompare)) === expected.topLevel && canonicalSha(c.authority_operation_replay_restart_fixtures) === expected.fixtures && canonicalSha(c.authority_operation_restart_correlation_authority) === expected.correlations) })
  return out
}

function expectSnapshotReject(name, factory) { try { ownedSnapshotR43(factory()); failures.push(`snapshot accepted:${name}`) } catch {} try { takeSnapshot(factory()); failures.push(`independent snapshot accepted:${name}`) } catch {} }
if (read(machinePath) !== materializedR43Output) failures.push('machine differs from exact materializer')
for (const [path, hash] of Object.entries({ 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r42.json': frozenR42.machine, 'scripts/materialize-ctrl-g24-trusted-ingress-r42.mjs': frozenR42.materializer, 'scripts/check-ctrl-g24-trusted-ingress-r42.mjs': frozenR42.checker, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r42.md': frozenR42.human, 'project-documentation/ctrl-evolution/g24-trusted-ingress-r42-qa-record.md': frozenR42.qa })) if (shaFile(path) !== hash) failures.push(`frozen R42 changed:${path}`)
failures.push(...collect(materializedR43))

const cycle = {}; cycle.self = cycle
const nonEnumerable = {}; Object.defineProperty(nonEnumerable, 'hidden', { value: 1, enumerable: false })
const getter = {}; Object.defineProperty(getter, 'value', { enumerable: true, get() { return 1 } })
const extraArray = [1]; extraArray.named = 2
const sparse = new Array(1)
const symbolKey = { [Symbol('x')]: 1 }
const throwing = new Proxy({}, { ownKeys() { throw new Error('trap') } })
for (const [name, factory] of [['nan', () => ({ x: Number.NaN })], ['positive infinity', () => ({ x: Number.POSITIVE_INFINITY })], ['negative infinity', () => ({ x: Number.NEGATIVE_INFINITY })], ['negative zero', () => ({ x: -0 })], ['undefined', () => ({ x: undefined })], ['bigint', () => ({ x: 1n })], ['function', () => ({ x() {} })], ['symbol value', () => ({ x: Symbol('x') })], ['nonplain', () => new Date()], ['cycle', () => cycle], ['non-enumerable', () => nonEnumerable], ['getter', () => getter], ['extra array key', () => extraArray], ['sparse array', () => sparse], ['symbol key', () => symbolKey], ['proxy', () => new Proxy({}, {})], ['throwing reflection', () => throwing], ['lone surrogate value', () => ({ x: '\ud800' })], ['lone surrogate key', () => ({ ['\udc00']: 1 })]]) expectSnapshotReject(name, factory)
const mutable = { nested: { value: 1 } }, stable = ownedSnapshotR43(mutable), before = canonicalSnapshot(stable); mutable.nested.value = 2; if (canonicalSnapshot(stable) !== before || stable.nested.value !== 1 || !Object.isFrozen(stable) || !Object.isFrozen(stable.nested) || Object.getPrototypeOf(stable) !== null || Object.getPrototypeOf(stable.nested) !== null) failures.push('owned snapshot check/use stability failed')

function expectMaterializerReject(name, factory) { try { ownedSnapshotR43(factory()); failures.push(`bounded snapshot accepted:${name}`) } catch {} }
expectMaterializerReject('million length sparse before allocation', () => new Array(1000000))
expectMaterializerReject('maximum length sparse before allocation', () => new Array(r43ResourceLimits.max_array_length))
expectMaterializerReject('depth above maximum', () => { let value = null; for (let index = 0; index < r43ResourceLimits.max_depth + 2; index += 1) value = { child: value }; return value })
expectMaterializerReject('descriptor trap proxy', () => new Proxy([], { getOwnPropertyDescriptor() { throw new Error('trap') } }))
expectMaterializerReject('8388609 byte property key', () => ({ ['k'.repeat(r43ResourceLimits.max_string_utf8_bytes + 1)]: true }))
expectMaterializerReject('aggregate property key bytes', () => { const value = {}; for (let index = 0; index < 9; index += 1) Object.defineProperty(value, `${index}${'k'.repeat(8000000)}`, { value: true, enumerable: true }); return value })

const pollutionBaseline = canonicalR43({ z: [2, 1], a: 'stable' })
const originalMap = Array.prototype.map
const originalIterator = Array.prototype[Symbol.iterator]
const originalObjectKeys = Object.keys
const originalReflectOwnKeys = Reflect.ownKeys
const originalJSONStringify = JSON.stringify
const originalZeroDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, '0')
try {
  Object.defineProperty(Array.prototype, '0', { configurable: true, set() { throw new Error('polluted numeric setter') }, get() { throw new Error('polluted numeric getter') } })
  Array.prototype.map = function () { throw new Error('polluted map') }
  Array.prototype[Symbol.iterator] = function () { throw new Error('polluted iterator') }
  Object.keys = function () { throw new Error('polluted Object.keys') }
  Reflect.ownKeys = function () { throw new Error('polluted Reflect.ownKeys') }
  JSON.stringify = function () { throw new Error('polluted JSON.stringify') }
  if (canonicalR43({ z: [2, 1], a: 'stable' }) !== pollutionBaseline) failures.push('captured primordial canonical bytes changed after pollution')
  const pollutedStable = ownedSnapshotR43({ a: { b: 1 } })
  if (pollutedStable.a.b !== 1) failures.push('captured primordial snapshot use changed after pollution')
} catch (error) { failures.push(`captured primordial pollution failed:${error.message}`) }
finally {
  Array.prototype.map = originalMap
  Array.prototype[Symbol.iterator] = originalIterator
  Object.keys = originalObjectKeys
  Reflect.ownKeys = originalReflectOwnKeys
  JSON.stringify = originalJSONStringify
  if (originalZeroDescriptor) Object.defineProperty(Array.prototype, '0', originalZeroDescriptor); else delete Array.prototype[0]
}

function resealArtifactPreservingRowRef(contract, artifact) {
  const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value, fpSchema = resolvePath(contract, schema.fingerprint_ref), preimage = {}
  for (const field of fpSchema.preimage_order) preimage[field] = field === 'domain_ascii' ? fpSchema.domain_ascii : row[field]
  row[schema.fingerprint_field] = canonicalSha(preimage)
  artifact.fingerprint_preimage = preimage
  artifact.recorded_fingerprint = row[schema.fingerprint_field]
  artifact.canonical_row_bytes_utf8 = canonical(row)
  artifact.canonical_row_bytes_sha256 = shaBytes(Buffer.from(artifact.canonical_row_bytes_utf8, 'utf8'))
  artifact.content_addressed_artifact_ref = artifact.canonical_row_bytes_sha256
}

const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['visible expansion', c => { c.visible_surface_changes.push('admin') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
  ['restore compound pseudo ref', c => { c.case_authority_control_result_union.total_result_ref = 'case_authority_control_pre_admission_and_case_authority_control_operation_registry.admission_outcome_table' }],
  ['caller selects compound', c => { c.case_authority_control_result_union.total_result_binding.caller_selectable_variant = true }],
  ['restore wildcard pseudo ref', c => { c.authority_operation_replay_derivation.exact_path_order_by_branch_ref = 'authority_operation_replay_branch_map.variants.*.replay_path' }],
  ['schema invalid enum', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact.canonical_row_value.target_store = 'invented' }],
  ['schema invalid sha', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].registry_artifact.canonical_row_value.idempotency_key = 'bad' }],
  ['operation target mismatch', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].registry_artifact.canonical_row_value.target_store = 'case_session_root_trust_anchors' }],
  ['extra artifact field', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].registry_artifact.canonical_row_value.extra = true }],
  ['shared operation id', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].registry_artifact.canonical_row_value.operation_id = c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact.canonical_row_value.operation_id }],
  ['fabricated row ref', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact.canonical_row_value.registry_row_ref = '0'.repeat(64) }],
  ['request fingerprint changed while retaining normative row ref', c => { const artifact = c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact; artifact.canonical_row_value.request_fingerprint = 'a'.repeat(64); resealArtifactPreservingRowRef(c, artifact) }],
  ['bytes splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].registry_artifact.canonical_row_bytes_utf8 += ' ' }],
  ['fingerprint splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].hold_artifact_or_UNAVAILABLE.recorded_fingerprint = '0'.repeat(64) }],
  ['selection splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].hold_artifact_or_UNAVAILABLE.canonical_row_value.evidence_kind = 'raw_session_hold_evidence' }],
  ['proof family splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].classifier_row.expected_proof_family = 'issuer' }],
  ['ordinary request splice resealed', c => { const fixture = c.authority_operation_replay_restart_fixtures.fixtures[1]; fixture.request_artifact = c.authority_operation_replay_restart_fixtures.fixtures[0].request_artifact }],
  ['verified request splice resealed', c => { const fixture = c.authority_operation_replay_restart_fixtures.fixtures[2]; fixture.registry_artifact.canonical_row_value.request_bytes_ref = c.authority_operation_replay_restart_fixtures.fixtures[3].request_artifact.ref; fixture.registry_artifact.canonical_row_value.request_bytes_sha256 = c.authority_operation_replay_restart_fixtures.fixtures[3].request_artifact.bytes_sha256; resealArtifactPreservingRowRef(c, fixture.registry_artifact) }],
  ['verified proof bytes splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].dual_proof_bundle_artifact_or_UNAVAILABLE.payload_value.issuer_proof_bytes_sha256 = '0'.repeat(64) }],
  ['issuer nonce fingerprint splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].issuer_nonce_artifact_or_UNAVAILABLE.stored_row_value.proof_fingerprint = '0'.repeat(64) }],
  ['raw evaluator bytes splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].session_evidence_or_UNAVAILABLE.payload_value.raw_evaluator_proof_sha256_or_unavailable = '0'.repeat(64) }],
  ['ordinary hold branch coherent partial reseal', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[1]; f.result_branch = 'stale_head_hold'; f.registry_artifact.canonical_row_value.hold_branch = 'stale_head_hold'; f.hold_artifact_or_UNAVAILABLE.canonical_row_value.hold_branch = 'stale_head_hold' }],
  ['verified session operation splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].result_artifact.payload_value.operation_name = 'revoke_server_session_principal' }],
  ['raw session operation id splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].session_evidence_or_UNAVAILABLE.payload_value.operation_id = 'spliced_operation' }],
  ['raw session hold branch splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].session_evidence_or_UNAVAILABLE.payload_value.hold_branch = 'authorization_hold' }],
  ['committed history splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].historical_response_artifact = c.authority_operation_replay_restart_fixtures.fixtures[1].historical_response_artifact }],
  ['reference row deleted', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.pop() }],
  ['reference owner changed', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows[0].owner_authority_path = 'operation_authority' }],
  ['reference vocabulary weakened', c => { c.semantic_reference_field_specification.exact_non_suffix_semantic_fields.pop() }],
  ['unindexed nested semantic reference', c => { c.operation_authority.hidden = { caller_precedence_ref: 'request_schema' } }],
  ['manifest content drift', c => { c.operation_authority.caller_precedence = 'allowed' }],
  ['manifest graph drift', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '0'.repeat(64) }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR43); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted:${name}`) }
if (failures.length) { console.error(`R43 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R43 and ${mutations.length} contract mutation probes verified`)
console.log('r43_owned_snapshot_rejection_probes=19')
console.log('r43_resource_bound_probes=6')
console.log('r43_primordial_pollution_probes=6')
console.log('r43_schema_valid_artifacts=7/7')
console.log('r43_complete_lineage_artifacts=44/44')
console.log('r43_content_addressed_lineage_artifacts=37/37')
console.log('r43_correlation_rows=201/201')
console.log('r43_restart_fixtures=4/4')
console.log(`r43_manifest_rows=${materializedR43.authority_runtime_semantic_manifest.rows.length}`)
console.log(`r43_semantic_reference_rows=${materializedR43.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.length}`)
console.log(`r43_machine_sha256=${shaFile(machinePath)}`)
