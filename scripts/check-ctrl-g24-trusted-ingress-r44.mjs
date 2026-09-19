import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { types as utilTypes } from 'node:util'
import { materializedR44, materializedR44Output, ownedSnapshotR44, canonicalR44, r44SemanticAuthorityPaths, r44ResourceLimits } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r44.json'
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
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r44.v1` }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function transitive(graph, path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }

const expectedParent = { commit: '2c7df0c4214750bce6bae73ffb740268abc14e94', tree: '85dfd2a433eac82cd4bfae13d111d45ab1144bc5', human_blob: 'e71cd4471c37f404bf02ca9496c723bffcae5b65', machine_blob: '33ebc0ed50396296422241b01d1f5a78cc252705', qa_blob: 'ef358bcc9e6703d4fa37fae60d5a27120967db7d', checker_blob: 'cd6664a5099b036cfe8f6863260ba3a5e143d41c', materializer_blob: 'aced119abd94df5eb7625b27e7d72e19dc6213f7', founder_checker_blob: 'c674f2dbaff0b23636b287d04a5b0b795ff1f2df', adjudication: 'veto' }
const frozenR43 = { machine: '6f0143c6ea8d0c13f795073d2c02c1328b1deb093ae3fbecce2c33d3af7627ae', materializer: '13a6b8a44a51eef12125f5a560dc85feb3797fd72aeb915e32e7e546d98523af', checker: '1729ef80cc5c2d0cd98a2f137b646b9a1af6fa5b31d4fe9224aadeb52951307a', human: '4a98400f1911430ecf808c9ec5eabf0ca5f87e8aaca643fee250e9a0bfced279', qa: '8302375aa6fc5b29f477390b2721e90de9a4510fd2d83480f319310ae529cf34' }
const expected = { paths: '1f62b343ac45ae898229bafbd92f14b3a649f1568dd5391bbdb111ceaa46519e', rows: 'c0f71b6ea830778c1d28e4838ff52e0860dd2d2b0a8c383ced599d8db03a521e', graph: '9638a38423d4574c2ccd64231e95bd84938c61a53520258b5d936a309c0308b6', envelope: '3a453245b2f3373dee5a228895764f2e07035a66f57a762b059ad0a7ae706d3b', depmap: '032884ef2eff00a0a34a137a7dd10de81978409361ef1f6e6eac842546d05d58', refrows: 'a32ff4af5a7e75681dc2bae3dde40d092a35dcf17147bb16e20653b694f6bdfd', refspec: 'c76ed3930b491fd4d2c924301cb8f6e7c1f21363f3cd13b070c761a91243fd13', topLevel: 'e9bbdb3629dfe558f063878db2c0e61227c8667dbe8caace7217d2b34ec7d73f', fixtures: 'c7e62ca3ba9e58e1829b20cc8a6d0920b4cf3ec96e45edc9d9624d4e38cc6c45', correlations: 'eedbfd0e7e4fc14d7217fb9c6a2b55275abbf055b8effeacebda3184a7b4e1d2' }
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r44.v1'
function contentHash(path, value) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R44', manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: takeSnapshot(value) }) }
function dependencyHash(path, scope, rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R44', manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R44', manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R44', manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

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
function fingerprintFrom(contract, schema, row) { const fpSchema = resolvePath(contract, schema.fingerprint_ref), preimage = {}; ok('fingerprint schema', fpSchema && Array.isArray(fpSchema.preimage_order)); for (const field of fpSchema.preimage_order) { ok(`fingerprint operand ${field}`, field === 'domain_ascii' || Object.hasOwn(row, field)); preimage[field] = field === 'domain_ascii' ? fpSchema.domain_ascii : row[field] } return { preimage, fingerprint: canonicalSha(preimage) } }
function artifactSchemaIdentity(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? { schema_ref: artifact.payload_schema_ref, schema_variant: artifact.payload_schema_variant, schema_version: artifact.payload_schema_version } : { schema_ref: artifact.schema_ref, schema_variant: artifact.schema_variant, schema_version: artifact.schema_version } }
function validatePersistedArtifact(contract, role, artifact, roleRule) {
  ok(`role ${role}`, artifact.artifact_role === role)
  const wrapperAuthority = contract.authority_operation_fixture_persisted_artifact_wrapper_schema, wrapper = wrapperAuthority.variants[artifact.fixture_wrapper_variant]
  ok(`wrapper variant ${role}`, wrapper && same(Object.keys(artifact).sort(codePointCompare), wrapper.exact_keys))
  ok(`role schema ${role}`, same(artifactSchemaIdentity(artifact), { schema_ref: roleRule.schema_ref, schema_variant: roleRule.schema_variant, schema_version: roleRule.schema_version }) && artifact.fixture_wrapper_variant === roleRule.fixture_wrapper_variant)
  if (artifact.fixture_wrapper_variant !== 'content_addressed') return validateArtifact(contract, artifact)
  const payloadBytes = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? artifact.payload_value : canonical(artifact.payload_value), payloadHash = shaBytes(Buffer.from(payloadBytes, 'utf8'))
  ok(`payload bytes ${role}`, payloadBytes === artifact.payload_canonical_bytes_utf8)
  ok(`payload identity ${role}`, payloadHash === artifact.payload_bytes_sha256 && payloadHash === artifact.bytes_sha256 && payloadHash === artifact.ref)
  if (artifact.payload_schema_ref !== 'opaque_bounded_bytes') { const schema = schemaAt(contract, artifact.payload_schema_ref, artifact.payload_schema_variant); ok(`payload schema ${role}`, schema && schema.schema_version === artifact.payload_schema_version && schema.additional_properties === false && same(Object.keys(artifact.payload_value), schema.exact_keys)); for (const [field, spec] of Object.entries(schema.properties)) validateSpec(artifact.payload_value[field], spec, `${role}.${field}`) }
  ok(`declared payload preimage ${role}`, artifact.payload_fingerprint === canonicalSha(artifact.declared_payload_fingerprint_preimage) && artifact.fingerprint === artifact.payload_fingerprint)
  const row = artifact.stored_row_value, nonce = artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema', store = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? contract.authority_opaque_raw_input_stores[artifact.payload_schema_variant] : nonce ? contract.proof_nonce_receipt_store : null, rowSchema = nonce ? contract.proof_nonce_ledger.row_schema : store?.row_schema ?? findStoreSchema(contract, artifact.payload_schema_ref)
  ok(`wrapper selected schema ${role}`, rowSchema && rowSchema.schema_version === artifact.selected_wrapper_schema_version)
  ok(`stored row keys ${role}`, same(Object.keys(row), rowSchema.exact_keys)); for (const [field, spec] of Object.entries(rowSchema.properties)) validateSpec(row[field], spec, `${role}.stored.${field}`)
  const wrapperDerived = fingerprintFrom(contract, rowSchema, row), storedField = rowSchema.fingerprint_field
  ok(`wrapper preimage ${role}`, same(wrapperDerived.preimage, artifact.declared_wrapper_fingerprint_preimage))
  ok(`wrapper fingerprint ${role}`, wrapperDerived.fingerprint === artifact.stored_row_fingerprint && row[storedField] === wrapperDerived.fingerprint)
  const refField = nonce ? 'nonce_receipt_ref' : 'artifact_ref', hashField = nonce ? 'nonce_receipt_ref' : Object.hasOwn(row, 'canonical_bytes_sha256') ? 'canonical_bytes_sha256' : 'opaque_bytes_sha256'
  ok(`content address ${role}`, row[refField] === artifact.ref && row[hashField] === artifact.bytes_sha256 && artifact.stored_row_canonical_bytes_sha256 === canonicalSha(row) && artifact.content_address_rule_verified === true)
  return artifact
}
function findStoreSchema(contract, schemaRef) { for (const family of Object.values(contract.authority_operation_artifact_stores.families)) for (const store of Object.values(family.stores_by_schema_ref)) if (store.canonical_schema_ref === schemaRef) return store.row_schema; for (const name of ['session_dual_proof_bundle_artifact_store','session_dual_proof_bundle_truth_projection_artifact_store','case_session_authority_read_set_artifact_store','session_hold_evidence_artifact_store','authority_operation_historical_response_artifact_store','authority_operation_replay_payload_artifact_store','authority_operation_replay_envelope_artifact_store']) if (contract[name]?.canonical_schema_ref === schemaRef) return contract[name].row_schema; return undefined }
function correlationValue(fixture, role, path) { if (role === 'fixture_metadata') return getDot(fixture, path); if (role === 'classifier') return getDot(fixture.classifier_row, path); return getDot(fixture.artifact_store_by_role[role], path) }
function verifyRuntime(contract) {
  const fixtures = contract.authority_operation_replay_restart_fixtures.fixtures, rules = contract.authority_operation_fixture_role_store_authority.exact_branch_rows
  ok('four fixtures', fixtures.length === 4 && contract.authority_operation_replay_restart_fixtures.total_role_keyed_artifact_count === 44)
  const fixtureKeys = ['fixture_id','operation_name','result_branch','request_fingerprint','exact_required_roles','artifact_store_by_role','artifact_view_role_refs','classifier_row','expected_reconstructed_selection'].sort(codePointCompare)
  for (const fixture of fixtures) {
    ok(`fixture keyset ${fixture.fixture_id}`, same(Object.keys(fixture).sort(codePointCompare), fixtureKeys) && !Object.hasOwn(fixture, 'persisted_lineage_artifacts') && !Object.hasOwn(fixture, 'registry_artifact'))
    const rule = rules.find(row => row.fixture_id === fixture.fixture_id && row.result_branch === fixture.result_branch); ok(`role rule ${fixture.fixture_id}`, rule)
    ok(`role set ${fixture.fixture_id}`, same(fixture.exact_required_roles, rule.exact_required_roles) && same(Object.keys(fixture.artifact_store_by_role), rule.exact_required_roles) && same(fixture.artifact_view_role_refs, Object.fromEntries(rule.exact_required_roles.map(role => [role, role]))))
    for (const roleRule of rule.role_schema_variants) validatePersistedArtifact(contract, roleRule.role, fixture.artifact_store_by_role[roleRule.role], roleRule)
    runRestartR44(contract, fixture)
  }
  const graph = contract.authority_operation_restart_correlation_authority; ok('correlation count', graph.exact_row_count === 418 && graph.rows.length === 418)
  const required = ['hold_branch','hold_row_ref','hold_fingerprint','payload_held_registry_ref','payload_held_registry_fingerprint','fixture_result_branch','classifier_result_branch','request_fingerprint','registry_result_fingerprint','registry_history_fingerprint','envelope_payload_fingerprint','session_evidence_branch']
  for (const category of required) ok(`correlation category ${category}`, graph.rows.some(row => row.category === category))
  for (const row of graph.rows) { const fixture = fixtures.find(item => item.fixture_id === row.fixture_id); ok(`correlation fixture ${row.correlation_id}`, fixture); const left = correlationValue(fixture, row.left_role, row.left_path), right = correlationValue(fixture, row.right_role, row.right_path); ok(`correlation ${row.correlation_id}`, left !== undefined && right !== undefined && same(left, right)) }
  const resolution = contract.authority_operation_artifact_resolution_authority; ok('resolution count', resolution.exact_resolution_count === 104 && resolution.rows.length === 104 && resolution.rows.every(row => row.exact_match_count === 1))
  for (const row of resolution.rows) { const fixture = fixtures.find(item => item.fixture_id === row.fixture_id), source = correlationValue(fixture, row.source_role, row.source_path.replace(`${row.source_role}.`, '')), target = fixture.artifact_store_by_role[row.target_role]; ok(`resolution source ${row.resolution_id}`, source === row.ref_value); const targetRef = row.target_identity_kind === 'content_address' ? target.ref : row.target_identity_kind === 'registry_row' ? target.canonical_row_value.registry_row_ref : target.canonical_row_value.hold_row_ref; ok(`resolution target ${row.resolution_id}`, targetRef === row.ref_value) }
}
function runRestartR44(contract, fixture) { const registryArtifact = fixture.artifact_store_by_role.registry, registry = registryArtifact.canonical_row_value, recovered = selection(registry), expectedTarget = fixture.operation_name === 'bootstrap_case_session_root_anchor' ? 'case_session_root_trust_anchors' : 'case_server_session_principal_evidence'; ok('operation target', registry.target_store === expectedTarget); ok('fixture request fingerprint', fixture.request_fingerprint === fixture.artifact_store_by_role.request.fingerprint && registry.request_fingerprint === fixture.request_fingerprint); ok('selection', same(recovered, fixture.expected_reconstructed_selection)); const classifier = fixture.classifier_row; ok('classifier', classifier.operation_name === fixture.operation_name && classifier.result_branch === fixture.result_branch && classifier.expected_selection_row_id === recovered.fresh_selection_row_id && classifier.expected_proof_family === recovered.proof_family && classifier.expected_branch_class === recovered.branch_class && classifier.expected_evidence_kind === recovered.evidence_kind && classifier.expected_selector_version === recovered.fresh_selection_schema_version); if (fixture.artifact_store_by_role.hold) { const hold = fixture.artifact_store_by_role.hold.canonical_row_value; ok('hold selection', same(selection(hold), recovered)); ok('hold identity', hold.hold_row_ref === registry.hold_row_ref && hold.hold_fingerprint === registry.hold_fingerprint) } return recovered }

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
  test('identity and closed scope', c => { ok('version', c.schema_version === 'ctrl.g24.trusted-ingress.r44.effective.v1'); ok('parent', same(c.supersedes, expectedParent)); ok('parent sha', c.materialization.frozen_input.sha256 === frozenR43.machine); ok('snapshot authority', c.materialization.snapshot_before_validation_hash_or_use === true && c.authority_runtime_semantic_manifest_hash_contract.hash_input === 'bounded_owned_immutable_snapshot_only'); ok('limits exact', c.canonical_snapshot_resource_limits.max_string_utf8_bytes === 8388608 && c.canonical_snapshot_resource_limits.max_total_string_utf8_bytes === 67108864 && c.canonical_snapshot_resource_limits.cumulative_limits_apply_before_next_value_copy === true); ok('no external change', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, [])) })
  if (out.length) return out
  test('compound and wildcard bindings are exact', c => { ok('old compound removed', !Object.hasOwn(c.case_authority_control_result_union, 'total_result_ref')); const total = c.case_authority_control_result_union.total_result_binding; ok('two variants', total.variants.length === 2 && total.exactly_one_variant === true && total.caller_selectable_variant === false); for (const row of total.variants) { let value = resolvePath(c, row.authority_ref); for (const part of row.result_path) value = value?.[part]; ok('total owner path', Array.isArray(value)) } ok('old wildcard removed', !Object.hasOwn(c.authority_operation_replay_derivation, 'exact_path_order_by_branch_ref')); const bindings = c.authority_operation_replay_derivation.exact_path_order_by_branch_bindings; ok('all replay variants', bindings.length === Object.keys(c.authority_operation_replay_branch_map.variants).length); for (const row of bindings) ok('replay path exists', Array.isArray(resolvePath(c, row.source_authority_ref).variants[row.source_variant][row.source_field])); const text = JSON.stringify(c); ok('no selected variant pseudo ref', !text.includes('.selected_variant') && !text.match(/"(?:source|destination)_schema_ref":"[^"]*selected_variant/)) })
  if (out.length) return out
  test('one role keyed artifact truth and complete lineage', verifyRuntime)
  if (out.length) return out
  test('semantic reference universe has exact nested targets', c => { const registry = c.authority_runtime_semantic_reference_field_registry; ok('source independent', c.semantic_reference_field_specification.source.includes('not_any_R40_R41_R42_or_R43_reference_map')); ok('not suffix only', registry.inference_from_suffix_only === 'forbidden'); ok('closed row schema', registry.row_schema.type === 'object' && registry.row_schema.additional_properties === false && same(registry.row_schema.exact_keys, Object.keys(registry.row_schema.properties))); ok('exact reference occurrences', registry.exact_expected_occurrence_count === 5843 && registry.exact_occurrence_rows.length === 5843 && c.authority_runtime_semantic_reference_owner_map.row_count === 5843); for (const row of registry.exact_occurrence_rows) { if (row.exact_target_path_or_UNAVAILABLE !== 'UNAVAILABLE') ok(`exact target ${row.field_path}`, resolvePath(c, row.exact_target_path_or_UNAVAILABLE) !== undefined); else ok(`runtime discriminator ${row.field_path}`, row.runtime_identity_kind_or_UNAVAILABLE !== 'UNAVAILABLE') } ok('all manifested reference rows unique', new Set(registry.exact_occurrence_rows.map(row => `${row.source_authority_path}|${row.field_path}|${row.reference_literal}`)).size === 5843) })
  if (out.length) return out
  test('manifest exact closure', c => { const manifest = c.authority_runtime_semantic_manifest, paths = manifest.exact_paths, depmap = c.authority_runtime_semantic_dependency_owner_map; ok('path parity', same(paths, r44SemanticAuthorityPaths) && manifest.rows.length === paths.length && depmap.rows.length === paths.length); const graph = {}; for (let index = 0; index < paths.length; index += 1) { const path = paths[index], row = manifest.rows[index], owner = depmap.rows[index], value = resolvePath(c, path); ok(`${path} exists`, value !== undefined && row.authority_path === path && owner.authority_path === path); ok(`${path} shape`, row.semantic_kind === kindOf(value) && same(row.exact_keyset, keysetOf(value))); ok(`${path} content`, row.authority_content_sha256 === contentHash(path, value)); ok(`${path} deps`, same(row.direct_dependency_paths, owner.typed_owner_paths)); graph[path] = owner.typed_owner_paths } for (const path of paths) { const row = manifest.rows[paths.indexOf(path)], direct = graph[path].map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })), all = transitive(graph, path).map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })); ok(`${path} direct hash`, same(row.direct_dependency_content_hashes, direct) && row.direct_dependency_set_sha256 === dependencyHash(path, 'direct', direct)); ok(`${path} transitive hash`, same(row.transitive_dependency_content_hashes, all) && row.transitive_dependency_set_sha256 === dependencyHash(path, 'transitive', all)) } ok('graph hash', manifest.manifest_graph_sha256 === graphHash(manifest.rows)); const without = { ...manifest }; delete without.manifest_envelope_seal_sha256; ok('envelope hash', manifest.manifest_envelope_seal_sha256 === envelopeHash(without)); ok('literal pins', canonicalSha(paths) === expected.paths && canonicalSha(manifest.rows) === expected.rows && manifest.manifest_graph_sha256 === expected.graph && manifest.manifest_envelope_seal_sha256 === expected.envelope && canonicalSha(depmap) === expected.depmap && canonicalSha(c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows) === expected.refrows && canonicalSha(c.semantic_reference_field_specification) === expected.refspec && canonicalSha(Object.keys(c).sort(codePointCompare)) === expected.topLevel && canonicalSha(c.authority_operation_replay_restart_fixtures) === expected.fixtures && canonicalSha(c.authority_operation_restart_correlation_authority) === expected.correlations) })
  return out
}

function expectSnapshotReject(name, factory) { try { ownedSnapshotR44(factory()); failures.push(`snapshot accepted:${name}`) } catch {} try { takeSnapshot(factory()); failures.push(`independent snapshot accepted:${name}`) } catch {} }
if (read(machinePath) !== materializedR44Output) failures.push('machine differs from exact materializer')
for (const [path, hash] of Object.entries({ 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r43.json': frozenR43.machine, 'scripts/materialize-ctrl-g24-trusted-ingress-r43.mjs': frozenR43.materializer, 'scripts/check-ctrl-g24-trusted-ingress-r43.mjs': frozenR43.checker, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r43.md': frozenR43.human, 'project-documentation/ctrl-evolution/g24-trusted-ingress-r43-qa-record.md': frozenR43.qa })) if (shaFile(path) !== hash) failures.push(`frozen R43 changed:${path}`)
failures.push(...collect(materializedR44))

const cycle = {}; cycle.self = cycle
const nonEnumerable = {}; Object.defineProperty(nonEnumerable, 'hidden', { value: 1, enumerable: false })
const getter = {}; Object.defineProperty(getter, 'value', { enumerable: true, get() { return 1 } })
const extraArray = [1]; extraArray.named = 2
const sparse = new Array(1)
const symbolKey = { [Symbol('x')]: 1 }
const throwing = new Proxy({}, { ownKeys() { throw new Error('trap') } })
for (const [name, factory] of [['nan', () => ({ x: Number.NaN })], ['positive infinity', () => ({ x: Number.POSITIVE_INFINITY })], ['negative infinity', () => ({ x: Number.NEGATIVE_INFINITY })], ['negative zero', () => ({ x: -0 })], ['undefined', () => ({ x: undefined })], ['bigint', () => ({ x: 1n })], ['function', () => ({ x() {} })], ['symbol value', () => ({ x: Symbol('x') })], ['nonplain', () => new Date()], ['cycle', () => cycle], ['non-enumerable', () => nonEnumerable], ['getter', () => getter], ['extra array key', () => extraArray], ['sparse array', () => sparse], ['symbol key', () => symbolKey], ['proxy', () => new Proxy({}, {})], ['throwing reflection', () => throwing], ['lone surrogate value', () => ({ x: '\ud800' })], ['lone surrogate key', () => ({ ['\udc00']: 1 })]]) expectSnapshotReject(name, factory)
const mutable = { nested: { value: 1 } }, stable = ownedSnapshotR44(mutable), before = canonicalSnapshot(stable); mutable.nested.value = 2; if (canonicalSnapshot(stable) !== before || stable.nested.value !== 1 || !Object.isFrozen(stable) || !Object.isFrozen(stable.nested) || Object.getPrototypeOf(stable) !== null || Object.getPrototypeOf(stable.nested) !== null) failures.push('owned snapshot check/use stability failed')

function expectMaterializerReject(name, factory) { try { ownedSnapshotR44(factory()); failures.push(`bounded snapshot accepted:${name}`) } catch {} }
expectMaterializerReject('million length sparse before allocation', () => new Array(1000000))
expectMaterializerReject('maximum length sparse before allocation', () => new Array(r44ResourceLimits.max_array_length))
expectMaterializerReject('depth above maximum', () => { let value = null; for (let index = 0; index < r44ResourceLimits.max_depth + 2; index += 1) value = { child: value }; return value })
expectMaterializerReject('descriptor trap proxy', () => new Proxy([], { getOwnPropertyDescriptor() { throw new Error('trap') } }))
expectMaterializerReject('8388609 byte property key', () => ({ ['k'.repeat(r44ResourceLimits.max_string_utf8_bytes + 1)]: true }))
expectMaterializerReject('aggregate property key bytes', () => { const value = {}; for (let index = 0; index < 9; index += 1) Object.defineProperty(value, `${index}${'k'.repeat(8000000)}`, { value: true, enumerable: true }); return value })

const pollutionBaseline = canonicalR44({ z: [2, 1], a: 'stable' })
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
  if (canonicalR44({ z: [2, 1], a: 'stable' }) !== pollutionBaseline) failures.push('captured primordial canonical bytes changed after pollution')
  const pollutedStable = ownedSnapshotR44({ a: { b: 1 } })
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

function resealAuthorityArtifact(contract, artifact) {
  const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value, refField = artifact.schema_variant.startsWith('original_') ? 'registry_row_ref' : 'hold_row_ref'
  if (artifact.normative_row_ref_preimage !== 'UNAVAILABLE') { const included = schema.row_ref_preimage_included_fields, preimage = { domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: included.map(field => ({ field, value: row[field] })) }; row[refField] = canonicalSha(preimage); artifact.normative_row_ref_preimage = preimage }
  resealArtifactPreservingRowRef(contract, artifact)
}
function runtimeRejects(candidate) { try { verifyRuntime(candidate); return false } catch { return true } }

const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['visible expansion', c => { c.visible_surface_changes.push('admin') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
  ['restore compound pseudo ref', c => { c.case_authority_control_result_union.total_result_ref = 'case_authority_control_pre_admission_and_case_authority_control_operation_registry.admission_outcome_table' }],
  ['caller selects compound', c => { c.case_authority_control_result_union.total_result_binding.caller_selectable_variant = true }],
  ['restore wildcard pseudo ref', c => { c.authority_operation_replay_derivation.exact_path_order_by_branch_ref = 'authority_operation_replay_branch_map.variants.*.replay_path' }],
  ['schema invalid enum', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.registry.canonical_row_value.target_store = 'invented' }],
  ['schema invalid sha', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].artifact_store_by_role.registry.canonical_row_value.idempotency_key = 'bad' }],
  ['operation target mismatch', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.registry.canonical_row_value.target_store = 'case_session_root_trust_anchors' }],
  ['extra artifact field', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].artifact_store_by_role.registry.canonical_row_value.extra = true }],
  ['fabricated row ref', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.registry.canonical_row_value.registry_row_ref = '0'.repeat(64) }],
  ['request fingerprint changed while retaining normative row ref', c => { const artifact = c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.registry; artifact.canonical_row_value.request_fingerprint = 'a'.repeat(64); resealArtifactPreservingRowRef(c, artifact) }],
  ['bytes splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.registry.canonical_row_bytes_utf8 += ' ' }],
  ['fingerprint splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].artifact_store_by_role.hold.recorded_fingerprint = '0'.repeat(64) }],
  ['selection splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.hold.canonical_row_value.evidence_kind = 'raw_session_hold_evidence' }],
  ['proof family splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].classifier_row.expected_proof_family = 'issuer' }],
  ['correlation row deleted', c => { c.authority_operation_restart_correlation_authority.rows.pop() }],
  ['resolution row deleted', c => { c.authority_operation_artifact_resolution_authority.rows.pop() }],
  ['reference row deleted', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.pop() }],
  ['reference owner changed', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows[0].owner_authority_path = 'operation_authority' }],
  ['reference vocabulary weakened', c => { c.semantic_reference_field_specification.exact_non_suffix_semantic_fields.pop() }],
  ['unindexed nested semantic reference', c => { c.operation_authority.hidden = { caller_precedence_ref: 'request_schema' } }],
  ['manifest content drift', c => { c.operation_authority.caller_precedence = 'allowed' }],
  ['manifest graph drift', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '0'.repeat(64) }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR44); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted:${name}`) }

const runtimeAttacks = [
  ['projection role replaced by valid target clone', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.bundle_truth_projection = structuredClone(c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.target) }],
  ['wrong role valid row', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[0]; f.artifact_store_by_role.proof = structuredClone(f.artifact_store_by_role.target) }],
  ['missing role', c => { delete c.authority_operation_replay_restart_fixtures.fixtures[1].artifact_store_by_role.proof }],
  ['extra role', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[1]; f.artifact_store_by_role.extra = structuredClone(f.artifact_store_by_role.target) }],
  ['duplicate role declaration', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].exact_required_roles[1] = c.authority_operation_replay_restart_fixtures.fixtures[1].exact_required_roles[0] }],
  ['malformed wrapper', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.request.stored_row_value.canonical_bytes_b64url = 'bad' }],
  ['resealed wrapper payload mismatch', c => { const a = c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.request; a.payload_value.operation_id = 'op_splice' }],
  ['verified proof splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.bundle.payload_value.issuer_proof_bytes_sha256 = '0'.repeat(64) }],
  ['issuer nonce splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.session_evidence.payload_value.issuer_nonce_receipt_ref = c.authority_operation_replay_restart_fixtures.fixtures[2].artifact_store_by_role.evaluator_nonce_receipt.ref }],
  ['raw evaluator splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].artifact_store_by_role.session_evidence.payload_value.raw_evaluator_proof_sha256_or_unavailable = '0'.repeat(64) }],
  ['registry only hold branch reseal', c => { const a = c.authority_operation_replay_restart_fixtures.fixtures[1].artifact_store_by_role.registry; a.canonical_row_value.hold_branch = 'stale_head_hold'; resealAuthorityArtifact(c, a) }],
]
for (const [name, mutate] of runtimeAttacks) { const candidate = structuredClone(materializedR44); mutate(candidate); if (!runtimeRejects(candidate)) failures.push(`runtime attack accepted:${name}`) }
if (failures.length) { console.error(`R44 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R44 and ${mutations.length + runtimeAttacks.length} contract mutation probes verified`)
console.log('r44_owned_snapshot_rejection_probes=19')
console.log('r44_resource_bound_probes=6')
console.log('r44_primordial_pollution_probes=6')
console.log('r44_role_keyed_artifacts=44/44')
console.log('r44_exact_one_resolutions=104/104')
console.log('r44_correlation_rows=418/418')
console.log('r44_restart_fixtures=4/4')
console.log(`r44_manifest_rows=${materializedR44.authority_runtime_semantic_manifest.rows.length}`)
console.log(`r44_semantic_reference_rows=${materializedR44.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.length}`)
console.log(`r44_machine_sha256=${shaFile(machinePath)}`)
