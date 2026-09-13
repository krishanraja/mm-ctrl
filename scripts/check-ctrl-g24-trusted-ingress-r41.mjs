import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { types as utilTypes } from 'node:util'
import { materializedR41, materializedR41Output, ownedSnapshotR41, r41SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r41.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r41.json'
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
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r41.v1` }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function transitive(graph, path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }

const expectedParent = { commit: '92badf816ce36605aa83f8849d37cdeb4a029af3', tree: '843a3977ccc65e796ab515cb6821dfbdfe8343b1', human_blob: '7a3120203e76065b6d426d53dba6aa64945025f7', machine_blob: '63f6b5222dc7350c2685c6a8ae2fc0d3e97fcd81', qa_blob: '505d073fdfc1aa405fe880022921c92c97e94db3', checker_blob: 'cb1277704693feeb265809c00ef5eee09f428619', materializer_blob: '76ca5e83b276ed5b189a8385d78d5d58601a4742', founder_checker_blob: '29e1b10946ee8f85c68f315baf7ee519e49a7234', adjudication: 'veto' }
const frozenR40 = { machine: '74434ed998ef047bc8ee855732688f20d061fd7d3ebd3981993047526cbcd535', materializer: 'a823876b0138757c87d16b22c81a90c7a879a3b3fa656b038ee907293172ec10', checker: '203a13363d88855921ad54d25f280f8f9cfa04647a3c1a9313f8a9b0a5e97cf7', human: '47176269b7b3f23fa2d67e904ba9796a71daf3827b8c9d896b1d2978e9ddcae2', qa: '7830e4a3172dc0dd5deb7f8409d31733735339bba9bc292aed79b3ba3bb3e9fa' }
const expected = { paths: 'b8a919db49305fed8e6b6a3e772f8cc70527d4af6addb50e8cbcf9dd333c1ada', rows: '48b6ec7a1118a58751a8f8a0fd3c5963a451621fba65bbefb15d8e52c207f8f7', graph: '0e7dac163dd8660ab8704d7c4f0443a4f6ee051b95bc18dcb03617c5827aa83c', envelope: 'a35b04fb0900a81838ee9fd76241b4399e4bfb6a5f72fd44240e0df28744d68e', depmap: '01015fb7103008631f3bc10bfbcd0291b4bffffb04237147d5a9ea3f455ad98a', refrows: '43781d479b45e0508c0f74eb1db85aa555d29105189a09c64c6d0fcc928499cf', reffields: '809796b02e23bb3eec6af4a3ba2eff43dfdddb03e280c7e9ee76940846df8f52', topLevel: '99c4fbd1a25021a06c8651a68deb4ac63b9b1daf4afc89223925ba822fdb20bc', fixtures: '47fa3b21f87713b5f9ba923e712696df8b16af4f2137a728a1727f13faee56af' }
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r41.v1'
function contentHash(path, value) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R41', manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: takeSnapshot(value) }) }
function dependencyHash(path, scope, rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R41', manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R41', manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R41', manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

function validateSpec(value, spec, path) {
  if (Object.hasOwn(spec ?? {}, 'const')) { ok(`const ${path}`, value === spec.const); return }
  if (Array.isArray(spec?.enum)) { ok(`enum ${path}`, spec.enum.includes(value)); return }
  if (spec?.type === 'enum') { ok(`typed enum ${path}`, Array.isArray(spec.values) && spec.values.includes(value)); return }
  if (spec?.type === 'sha256') { ok(`sha ${path}`, typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)); return }
  if (spec?.type === 'sha256_or_exact_literal') { ok(`sha/literal ${path}`, value === spec.literal || (typeof value === 'string' && /^[0-9a-f]{64}$/.test(value))); return }
  if (spec?.type === 'identifier') { ok(`identifier ${path}`, typeof value === 'string' && value.length > 0); return }
  if (spec?.type === 'canonical_timestamp') { ok(`timestamp ${path}`, typeof value === 'string' && new Date(value).toISOString() === value); return }
  if (spec?.type === 'nonnegative_integer') { ok(`nonnegative ${path}`, Number.isInteger(value) && value >= 0 && !Object.is(value, -0)); return }
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
  const rowRefField = artifact.schema_variant.startsWith('original_') ? 'registry_row_ref' : 'hold_row_ref'
  const fingerprintField = artifact.schema_variant.startsWith('original_') ? 'registry_fingerprint' : 'hold_fingerprint'
  const expectedIdentity = { domain_ascii: 'CTRL-G24-RESTART-FIXTURE-ROW-IDENTITY-R41', fixture_id: artifact.fixture_artifact_id.split(':')[0], schema_ref: artifact.schema_ref, schema_variant: artifact.schema_variant, schema_version: artifact.schema_version, operation_id: row.operation_id, idempotency_key: row.idempotency_key }
  ok('identity preimage', same(expectedIdentity, artifact.row_identity_preimage))
  ok('row ref', row[rowRefField] === canonicalSha(expectedIdentity))
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

function collect(contract) {
  const out = [], test = (name, fn) => { try { const snapshot = takeSnapshot(contract); fn(snapshot) } catch (error) { out.push(`${name}: ${error.message}`) } }
  test('identity and closed scope', c => { ok('version', c.schema_version === 'ctrl.g24.trusted-ingress.r41.effective.v1'); ok('parent', same(c.supersedes, expectedParent)); ok('parent sha', c.materialization.frozen_input.sha256 === frozenR40.machine); ok('snapshot authority', c.materialization.snapshot_before_validation_hash_or_use === true && c.authority_runtime_semantic_manifest_hash_contract.hash_input === 'owned_immutable_snapshot_only'); ok('no external change', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, [])) })
  test('compound and wildcard bindings are exact', c => { ok('old compound removed', !Object.hasOwn(c.case_authority_control_result_union, 'total_result_ref')); const total = c.case_authority_control_result_union.total_result_binding; ok('two variants', total.variants.length === 2 && total.exactly_one_variant === true && total.caller_selectable_variant === false); for (const row of total.variants) { let value = resolvePath(c, row.authority_ref); for (const part of row.result_path) value = value?.[part]; ok('total owner path', Array.isArray(value)) } ok('old wildcard removed', !Object.hasOwn(c.authority_operation_replay_derivation, 'exact_path_order_by_branch_ref')); const bindings = c.authority_operation_replay_derivation.exact_path_order_by_branch_bindings; ok('all replay variants', bindings.length === Object.keys(c.authority_operation_replay_branch_map.variants).length); for (const row of bindings) ok('replay path exists', Array.isArray(resolvePath(c, row.source_authority_ref).variants[row.source_variant][row.source_field])); const text = JSON.stringify(c); ok('no selected variant pseudo ref', !text.includes('.selected_variant') && !text.match(/"(?:source|destination)_schema_ref":"[^"]*selected_variant/)) })
  test('seven schema-valid artifacts and four durable restarts', c => { const fixtureSet = c.authority_operation_replay_restart_fixtures; ok('counts', fixtureSet.fixtures.length === 4 && fixtureSet.artifact_count === 7); const artifacts = fixtureSet.fixtures.flatMap(fixture => [fixture.registry_artifact, ...(fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE' ? [] : [fixture.hold_artifact_or_UNAVAILABLE])]); ok('seven', artifacts.length === 7); artifacts.forEach(artifact => validateArtifact(c, artifact)); const operationIds = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.operation_id), idempotency = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.idempotency_key), registryRefs = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.registry_row_ref); ok('unique ids', new Set(operationIds).size === 4 && new Set(idempotency).size === 4 && new Set(registryRefs).size === 4); fixtureSet.fixtures.forEach(fixture => runRestart(c, fixture)) })
  test('explicit semantic reference registry is bijective', c => { const registry = c.authority_runtime_semantic_reference_field_registry, paths = new Set(c.authority_runtime_semantic_manifest.exact_paths), seen = new Set(); ok('explicit not suffix', registry.inference_from_suffix_or_regex_only === 'forbidden'); ok('closed row schema', registry.row_schema.type === 'object' && registry.row_schema.additional_properties === false && same(registry.row_schema.exact_keys, Object.keys(registry.row_schema.properties))); for (const row of registry.exact_occurrence_rows) { const key = `${row.source_authority_path}|${row.field_path}|${row.reference_literal}`; ok(`unique ${key}`, !seen.has(key)); seen.add(key); ok(`source ${key}`, paths.has(row.source_authority_path)); ok(`owner ${key}`, paths.has(row.owner_authority_path)); ok(`field explicit ${key}`, registry.exact_field_names.includes(row.field_name)); const actual = resolvePath(c, row.field_path); ok(`occurrence ${key}`, actual === row.reference_literal || (Array.isArray(actual) && actual.includes(row.reference_literal))); ok(`owner version ${key}`, row.expected_owner_schema_version === semanticVersion(row.owner_authority_path, resolvePath(c, row.owner_authority_path))) } const literalSkips = new Set(['UNAVAILABLE', 'forbidden', 'reject_and_hold', 'exact_operation_result_variant', 'exact_hold_variant_or_UNAVAILABLE', 'exact_evidence_variant_or_UNAVAILABLE', 'exact_branch_DAG']), observed = new Set(); function walk(value, source, path = source) { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { const next = `${path}.${key}`; if (registry.exact_field_names.includes(key)) for (const literal of Array.isArray(item) ? item : [item]) if (typeof literal === 'string' && !literalSkips.has(literal)) observed.add(`${source}|${next}|${literal}`); walk(item, source, next) } } for (const path of c.authority_runtime_semantic_manifest.exact_paths) if (!['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry'].includes(path)) walk(resolvePath(c, path), path); ok('bijection exact', observed.size === seen.size && [...observed].every(key => seen.has(key))); ok('count', registry.exact_expected_occurrence_count === seen.size && registry.exact_occurrence_rows.length === c.authority_runtime_semantic_reference_owner_map.row_count); ok('compound covered', registry.total_result_compound_binding_ref === 'case_authority_control_result_union.total_result_binding'); ok('wildcard covered', registry.replay_wildcard_eliminated_by_ref === 'authority_operation_replay_derivation.exact_path_order_by_branch_bindings') })
  test('manifest exact closure', c => { const manifest = c.authority_runtime_semantic_manifest, paths = manifest.exact_paths, depmap = c.authority_runtime_semantic_dependency_owner_map; ok('path parity', same(paths, r41SemanticAuthorityPaths) && manifest.rows.length === paths.length && depmap.rows.length === paths.length); const graph = {}; for (let index = 0; index < paths.length; index += 1) { const path = paths[index], row = manifest.rows[index], owner = depmap.rows[index], value = resolvePath(c, path); ok(`${path} exists`, value !== undefined && row.authority_path === path && owner.authority_path === path); ok(`${path} shape`, row.semantic_kind === kindOf(value) && same(row.exact_keyset, keysetOf(value))); ok(`${path} content`, row.authority_content_sha256 === contentHash(path, value)); ok(`${path} deps`, same(row.direct_dependency_paths, owner.typed_owner_paths)); graph[path] = owner.typed_owner_paths } for (const path of paths) { const row = manifest.rows[paths.indexOf(path)], direct = graph[path].map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })), all = transitive(graph, path).map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })); ok(`${path} direct hash`, same(row.direct_dependency_content_hashes, direct) && row.direct_dependency_set_sha256 === dependencyHash(path, 'direct', direct)); ok(`${path} transitive hash`, same(row.transitive_dependency_content_hashes, all) && row.transitive_dependency_set_sha256 === dependencyHash(path, 'transitive', all)) } ok('graph hash', manifest.manifest_graph_sha256 === graphHash(manifest.rows)); const without = { ...manifest }; delete without.manifest_envelope_seal_sha256; ok('envelope hash', manifest.manifest_envelope_seal_sha256 === envelopeHash(without)); ok('literal pins', canonicalSha(paths) === expected.paths && canonicalSha(manifest.rows) === expected.rows && manifest.manifest_graph_sha256 === expected.graph && manifest.manifest_envelope_seal_sha256 === expected.envelope && canonicalSha(depmap) === expected.depmap && canonicalSha(c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows) === expected.refrows && canonicalSha(c.authority_runtime_semantic_reference_field_registry.exact_field_names) === expected.reffields && canonicalSha(Object.keys(c).sort(codePointCompare)) === expected.topLevel && canonicalSha(c.authority_operation_replay_restart_fixtures) === expected.fixtures) })
  return out
}

function expectSnapshotReject(name, factory) { try { ownedSnapshotR41(factory()); failures.push(`snapshot accepted:${name}`) } catch {} try { takeSnapshot(factory()); failures.push(`independent snapshot accepted:${name}`) } catch {} }
if (read(machinePath) !== materializedR41Output) failures.push('machine differs from exact materializer')
for (const [path, hash] of Object.entries({ 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r40.json': frozenR40.machine, 'scripts/materialize-ctrl-g24-trusted-ingress-r40.mjs': frozenR40.materializer, 'scripts/check-ctrl-g24-trusted-ingress-r40.mjs': frozenR40.checker, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r40.md': frozenR40.human, 'project-documentation/ctrl-evolution/g24-trusted-ingress-r40-qa-record.md': frozenR40.qa })) if (shaFile(path) !== hash) failures.push(`frozen R40 changed:${path}`)
failures.push(...collect(materializedR41))

const cycle = {}; cycle.self = cycle
const nonEnumerable = {}; Object.defineProperty(nonEnumerable, 'hidden', { value: 1, enumerable: false })
const getter = {}; Object.defineProperty(getter, 'value', { enumerable: true, get() { return 1 } })
const extraArray = [1]; extraArray.named = 2
const sparse = new Array(1)
const symbolKey = { [Symbol('x')]: 1 }
const throwing = new Proxy({}, { ownKeys() { throw new Error('trap') } })
for (const [name, factory] of [['nan', () => ({ x: Number.NaN })], ['positive infinity', () => ({ x: Number.POSITIVE_INFINITY })], ['negative infinity', () => ({ x: Number.NEGATIVE_INFINITY })], ['negative zero', () => ({ x: -0 })], ['undefined', () => ({ x: undefined })], ['bigint', () => ({ x: 1n })], ['function', () => ({ x() {} })], ['symbol value', () => ({ x: Symbol('x') })], ['nonplain', () => new Date()], ['cycle', () => cycle], ['non-enumerable', () => nonEnumerable], ['getter', () => getter], ['extra array key', () => extraArray], ['sparse array', () => sparse], ['symbol key', () => symbolKey], ['proxy', () => new Proxy({}, {})], ['throwing reflection', () => throwing], ['lone surrogate value', () => ({ x: '\ud800' })], ['lone surrogate key', () => ({ ['\udc00']: 1 })]]) expectSnapshotReject(name, factory)
const mutable = { nested: { value: 1 } }, stable = ownedSnapshotR41(mutable), before = canonicalSnapshot(stable); mutable.nested.value = 2; if (canonicalSnapshot(stable) !== before || stable.nested.value !== 1 || !Object.isFrozen(stable) || !Object.isFrozen(stable.nested) || Object.getPrototypeOf(stable) !== null || Object.getPrototypeOf(stable.nested) !== null) failures.push('owned snapshot check/use stability failed')

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
  ['bytes splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].registry_artifact.canonical_row_bytes_utf8 += ' ' }],
  ['fingerprint splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].hold_artifact_or_UNAVAILABLE.recorded_fingerprint = '0'.repeat(64) }],
  ['selection splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].hold_artifact_or_UNAVAILABLE.canonical_row_value.evidence_kind = 'raw_session_hold_evidence' }],
  ['proof family splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].classifier_row.expected_proof_family = 'issuer' }],
  ['reference row deleted', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.pop() }],
  ['reference owner changed', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows[0].owner_authority_path = 'operation_authority' }],
  ['reference field unregistered', c => { c.authority_runtime_semantic_reference_field_registry.exact_field_names.pop() }],
  ['manifest content drift', c => { c.operation_authority.caller_precedence = 'allowed' }],
  ['manifest graph drift', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '0'.repeat(64) }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR41); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted:${name}`) }
if (failures.length) { console.error(`R41 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R41 and ${mutations.length} contract mutation probes verified`)
console.log('r41_owned_snapshot_rejection_probes=19')
console.log('r41_schema_valid_artifacts=7/7')
console.log('r41_restart_fixtures=4/4')
console.log(`r41_manifest_rows=${materializedR41.authority_runtime_semantic_manifest.rows.length}`)
console.log(`r41_semantic_reference_rows=${materializedR41.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.length}`)
console.log(`r41_machine_sha256=${shaFile(machinePath)}`)
