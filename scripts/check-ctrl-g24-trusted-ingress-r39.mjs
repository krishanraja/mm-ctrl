import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR38 } from './materialize-ctrl-g24-trusted-ingress-r38.mjs'
import { materializedR39, materializedR39Output } from './materialize-ctrl-g24-trusted-ingress-r39.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r39.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const shaBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const shaFile = path => shaBytes(read(path))
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)); const right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function canonical(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
const canonicalSha = value => shaBytes(Buffer.from(canonical(value), 'utf8'))
const same = (a, b) => canonical(a) === canonical(b)
function ok(message, value) { if (!value) throw new Error(message) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function closed(schema) { return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, Object.keys(schema.properties)) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))) }
function schemaProperty(contract, schemaRef, variant, field) { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema?.properties?.[field] }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function sameVersionDrift(before, after, path = '$', out = []) { if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return out; if (!Array.isArray(before) && !Array.isArray(after) && before.schema_version && after.schema_version && !same(before, after) && before.schema_version === after.schema_version) out.push(path); if (!Array.isArray(before) && !Array.isArray(after)) for (const key of Object.keys(before)) if (Object.hasOwn(after, key)) sameVersionDrift(before[key], after[key], `${path}.${key}`, out); return out }

const expectedParent = { commit: 'a09740b6fb0e65740aae413281f372dc975a9bde', tree: 'bcd807e58788845e0e67ee32dfa4a9966b6c4f4d', human_blob: '49e083cf88d6217d20761c937681c52861992afe', machine_blob: '333afb740bb7273318be25b7fdd0117f255e40f7', qa_blob: '71a068a7fa34c0623ad8b440d392ac52b9b690c9', checker_blob: 'dddf206852f01dce8a5eecbeca621f3a7d2165db', materializer_blob: 'eb4b4f3ab3042b63cad637f09f69814224d1cef2', founder_checker_blob: 'd58cd2072b15bb4357c6569ac0dd1ef0fd898a04', adjudication: 'veto' }
const frozenR38 = { machine: '442ff0188b00110bee9e79feb889f5c728b18d31815e7bb8bb0d6b46e0cffb01', materializer: '845a9e7781b2c61585f891aea5341c5a216a75933967c993591202ebf6476bff', checker: '651bc0743fc1b34421ced48ce2e262cc11f98ee4cb08265eea7840390d8e466e', human: 'a5422a64f284cd2245956c2281b16722f3563a59daf7282d085c0e27b8ad1ba2', qa: '74527d8c89241e1f2c3b6ad00947679bea6d1ef57affbe74529ae6e72ae83593' }
const expected = {
  paths: '428d57e8c88a66667ae41fd48044b4b6978cfdc4ce51ce3e1892918f21723a32',
  rows: 'ff85fb61e34b04a6944a9c183f19590d7744a139be47424b88351ba530be70c5',
  graph: '17275d02a0b1cc82c841fd0d6ced3b5c8585ad45159344ccb1b118c7c4483f7d',
  envelope: '58a403b0bdd729a7897ec86f48d9e9ea31d10af39a04038f5accd505ce4faa6c',
  ownerMap: 'def3a5a5c880a2e73dc1f6f0b2ceb5a77a2ab58ac1e330cd8e1954ea846a826b',
  rowSchema: '814bc73e92ce698d749624888df218df137880fbf64bf4abf9061bcbc0d81cb0',
  envelopeSchema: 'd147da57b5f0ebd17ed0092f1033959f97d0adc7249d35cad212220eb8e82970',
  topLevel: '8f4a63a44cfe10c2612500cabbb4967856584e9babd6bc8e7f9e8632ed468c49',
}
const durableFields = ['fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']
const destinationFields = { fresh_selection_row_id: 'expected_selection_row_id', proof_family: 'expected_proof_family', branch_class: 'expected_branch_class', evidence_kind: 'expected_evidence_kind', fresh_selection_schema_version: 'expected_selector_version' }
const changedTopLevel = new Set(['schema_version', 'status', 'supersedes', 'materialization', 'fingerprint_schemas', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings', 'authority_operation_replay_classifier', 'authority_operation_replay_derivation', 'authority_operation_replay_branch_map', 'authority_operation_durable_selection_typed_binding_schema', 'authority_operation_replay_restart_fixtures', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest_envelope_schema', 'authority_runtime_semantic_manifest', 'schema_change_manifest', 'required_negative_fixture_families'])

function contentHash(path, value) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R39', manifest_hash_version: 'ctrl.g24.runtime-semantic-authority-manifest-hash.r39.v1', authority_path: path, canonical_authority_object: value }) }
function dependencyHash(path, scope, rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R39', manifest_hash_version: 'ctrl.g24.runtime-semantic-authority-manifest-hash.r39.v1', authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R39', manifest_hash_version: 'ctrl.g24.runtime-semantic-authority-manifest-hash.r39.v1', manifest_rows: rows }) }
function envelopeHash(manifest) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R39', manifest_hash_version: 'ctrl.g24.runtime-semantic-authority-manifest-hash.r39.v1', manifest_without_envelope_seal: manifest }) }
function transitive(graph, path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
function walkRefFields(value, sourcePath, fieldPath = sourcePath, out = []) { if (!value || typeof value !== 'object') return out; for (const [key, item] of Object.entries(value)) { const next = `${fieldPath}.${key}`; if ((key.endsWith('_ref') || key.endsWith('_refs')) && (typeof item === 'string' || Array.isArray(item))) for (const ref of Array.isArray(item) ? item : [item]) if (typeof ref === 'string') out.push({ sourcePath, fieldPath: next, ref }); walkRefFields(item, sourcePath, next, out) } return out }
function selectionFromClassifier(row) { return { fresh_selection_row_id: row.expected_selection_row_id, proof_family: row.expected_proof_family, branch_class: row.expected_branch_class, evidence_kind: row.expected_evidence_kind, fresh_selection_schema_version: row.expected_selector_version } }
function executeRestartFixture(contract, fixture) {
  const classifierRows = contract.authority_operation_replay_classifier.rows
  const source = fixture.registry_selection_fields
  if (fixture.hold_selection_fields !== 'UNAVAILABLE' && !same(source, fixture.hold_selection_fields)) throw new Error('registry hold splice')
  const matches = classifierRows.filter(row => same(selectionFromClassifier(row), source) && row.operation_name === fixture.operation_name && row.result_branch === fixture.result_branch)
  if (matches.length !== 1) throw new Error(`classifier cardinality:${matches.length}`)
  if (!same(selectionFromClassifier(matches[0]), selectionFromClassifier(fixture.classifier_selection_fields))) throw new Error('classifier projection mismatch')
  const map = contract.authority_operation_replay_branch_map.variants[source.branch_class]
  if (!map) throw new Error('missing branch map')
  return matches[0]
}

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn() } catch (error) { out.push(`${name}: ${error.message}`) } }
  test('identity and immutable boundary', () => { ok('R39', contract.schema_version === 'ctrl.g24.trusted-ingress.r39.effective.v1'); ok('parent', same(contract.supersedes, expectedParent)); ok('parent SHA', contract.materialization.frozen_input.sha256 === frozenR38.machine); ok('closed phase', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, [])) })
  test('frozen R38 core survives outside bounded repair', () => { for (const key of Object.keys(materializedR38)) if (!changedTopLevel.has(key)) ok(`unchanged ${key}`, same(contract[key], materializedR38[key])); const drift = sameVersionDrift(materializedR38, contract); ok(`same version drift:${drift.join(',')}`, drift.length === 0) })
  test('durable selection uses typed registry hold classifier bindings and no payload fiction', () => {
    const authority = contract.authority_operation_replay_registry_authority, resolution = contract.authority_operation_replay_resolution_bindings, control = contract.authority_operation_durable_selection_typed_binding_schema
    ok('R39 authorities', authority.schema_version.endsWith('.r39.v1') && resolution.schema_version.endsWith('.r39.v1'))
    ok('no payload fields', authority.committed.every(row => !durableFields.includes(row.payload_field)) && authority.held.every(row => !durableFields.includes(row.payload_field)) && control.no_replay_payload_destination === true && resolution.no_replay_payload_destination === true)
    ok('closed typed row', closed(control.row_schema) && same(control.row_schema.caller_writable_fields, []) && control.selected_variant_alias === 'forbidden')
    ok('20 bindings', control.exact_rows.length === 20 && control.exact_expected_rows === 20)
    const expectedVariants = ['original_committed', 'original_persisted_hold', 'ordinary_single_proof', 'session_dual_proof']
    for (const field of durableFields) for (const variant of expectedVariants) {
      const rows = control.exact_rows.filter(row => row.source_variant === variant && row.source_field === field)
      ok(`${variant}:${field} unique`, rows.length === 1)
      const row = rows[0]
      ok(`${variant}:${field} exact row`, same(Object.keys(row), control.row_schema.exact_keys) && row.destination_schema_ref === 'authority_operation_replay_classifier.row_schema' && row.destination_variant === 'UNAVAILABLE' && row.destination_field === destinationFields[field])
      ok(`${variant}:${field} no fiction`, !row.source_schema_ref.includes('selected_variant') && !row.destination_schema_ref.includes('selected_variant'))
      const source = schemaProperty(contract, row.source_schema_ref, row.source_variant, row.source_field), destination = schemaProperty(contract, row.destination_schema_ref, row.destination_variant, row.destination_field)
      ok(`${variant}:${field} resolves`, source && destination && same(source, destination))
    }
    ok('exact refs', authority.durable_selection_typed_binding_ref === 'authority_operation_durable_selection_typed_binding_schema' && resolution.durable_selection_typed_binding_ref === authority.durable_selection_typed_binding_ref && contract.authority_operation_replay_derivation.durable_selection_binding_ref === authority.durable_selection_typed_binding_ref)
  })
  test('registry hold and classifier fingerprints bind all five fields before restart selection', () => {
    for (const schema of [contract.authority_operation_registry.row_union.variants.original_committed, contract.authority_operation_registry.row_union.variants.original_persisted_hold, ...Object.values(contract.authority_operation_hold_store.row_union.variants)]) {
      const fingerprint = resolvePath(contract, schema.fingerprint_ref)
      durableFields.forEach(field => ok(`schema ${field}`, schema.properties[field] && fingerprint.preimage_order.includes(field)))
    }
    const classifier = contract.authority_operation_replay_classifier, schema = classifier.row_schema
    ok('classifier closed and fingerprinted', closed(schema) && schema.schema_version.endsWith('.r39.v1') && schema.fingerprint_ref === 'fingerprint_schemas.authority_operation_replay_classifier_row_r39')
    for (const row of classifier.rows) {
      ok('classifier exact keys', same(Object.keys(row), schema.exact_keys))
      const copy = structuredClone(row), actual = copy.classifier_row_fingerprint; delete copy.classifier_row_fingerprint
      ok('classifier fingerprint', actual === canonicalSha({ domain_ascii: 'CTRL-G24-AUTHORITY-OPERATION-REPLAY-CLASSIFIER-ROW-R39', schema_version: schema.schema_version, row: copy }))
    }
  })
  test('four executable restart fixtures recover exact historical class', () => {
    const fixtures = contract.authority_operation_replay_restart_fixtures
    ok('closed fixtures', closed(fixtures.selection_projection_schema) && closed(fixtures.classifier_projection_schema) && closed(fixtures.fixture_row_schema) && fixtures.fixtures.length === 4)
    ok('exact IDs', same(fixtures.exact_fixture_ids, ['restart_committed', 'restart_ordinary_held', 'restart_verified_session_held', 'restart_raw_session_held']))
    for (const fixture of fixtures.fixtures) {
      ok('fixture exact row', same(Object.keys(fixture), fixtures.fixture_row_schema.exact_keys))
      const classifier = executeRestartFixture(contract, fixture)
      ok('branch recovered', classifier.expected_branch_class === fixture.registry_selection_fields.branch_class)
      const sourceSchema = resolvePath(contract, fixture.registry_schema_ref).variants[fixture.registry_variant]
      durableFields.forEach(field => ok(`registry fingerprint ${field}`, resolvePath(contract, sourceSchema.fingerprint_ref).preimage_order.includes(field)))
      if (fixture.hold_variant !== 'UNAVAILABLE') { const hold = resolvePath(contract, fixture.hold_schema_ref).variants[fixture.hold_variant]; durableFields.forEach(field => ok(`hold fingerprint ${field}`, resolvePath(contract, hold.fingerprint_ref).preimage_order.includes(field))) }
    }
  })
  test('manifest hash preimages are literal and independently recomputed', () => {
    const hash = contract.authority_runtime_semantic_manifest_hash_contract
    ok('hash version', hash.schema_version === 'ctrl.g24.runtime-semantic-authority-manifest-hash.r39.v1' && hash.hashing_rule === 'sha256_of_exact_canonical_preimage_schema_bytes')
    ok('closed preimages', closed(hash.content_preimage_schema) && closed(hash.dependency_preimage_schema) && closed(hash.graph_preimage_schema) && closed(hash.envelope_preimage_schema))
    ok('content path declared', hash.content_preimage_schema.exact_keys.includes('authority_path'))
    ok('dependency path and scope declared', hash.dependency_preimage_schema.exact_keys.includes('authority_path') && hash.dependency_preimage_schema.exact_keys.includes('dependency_scope'))
    ok('graph has no undeclared path', !hash.graph_preimage_schema.exact_keys.includes('authority_path'))
    ok('canonical codec', hash.canonical_codec_ref === 'canonical_json_utf8_encoding' && hash.canonical_object_key_order === 'unicode_code_point_ascending' && hash.concatenated_or_insertion_order_JSON_stringify === 'forbidden')
  })
  test('self sealed manifest envelope and metadata closure are pinned', () => {
    const manifest = contract.authority_runtime_semantic_manifest, seal = manifest.manifest_envelope_seal_sha256, without = structuredClone(manifest); delete without.manifest_envelope_seal_sha256
    ok('pinned path/rows', manifest.exact_expected_count === 200 && canonicalSha(manifest.exact_paths) === expected.paths && canonicalSha(manifest.rows) === expected.rows)
    ok('pinned schemas', canonicalSha(manifest.row_schema) === expected.rowSchema && canonicalSha(contract.authority_runtime_semantic_manifest_envelope_schema) === expected.envelopeSchema)
    ok('pinned owner map', canonicalSha(contract.authority_runtime_semantic_dependency_owner_map) === expected.ownerMap && manifest.dependency_owner_map_sha256 === contentHash('authority_runtime_semantic_dependency_owner_map', contract.authority_runtime_semantic_dependency_owner_map))
    ok('self seal', seal === expected.envelope && seal === envelopeHash(without))
    ok('graph seal', manifest.manifest_graph_sha256 === expected.graph && manifest.manifest_graph_sha256 === graphHash(manifest.rows))
    ok('top level pinned', canonicalSha(Object.keys(contract).sort(codePointCompare)) === expected.topLevel)
    ok('constants', manifest.hash_contract_ref === 'authority_runtime_semantic_manifest_hash_contract' && manifest.unmanifested_or_multiply_covered_semantics === 'reject_materialization_and_hold_without_disclosure_or_write' && manifest.nested_coverage_rule === 'every_nested_runtime_semantic_object_including_manifest_materialization_and_schema_change_metadata_is_covered_by_an_exact_manifested_top_level_content_hash_or_the_self_sealed_manifest_envelope')
    ok('negative families', same(manifest.negative_fixture_families, ['typed_durable_selection_bindings', 'executable_replay_restart_fixtures', 'self_sealed_manifest_envelope', 'literal_hash_preimage_conformance', 'explicit_dependency_owner_resolution']) && manifest.negative_fixture_families.every(item => contract.required_negative_fixture_families.includes(item)))
    ok('metadata exact', contract.materialization.caller_writer_or_precedence_extensions === 'forbidden' && contract.schema_change_manifest.caller_writer_or_precedence_extensions === 'forbidden')
  })
  test('explicit dependency owners close every manifested path and semantic reference', () => {
    const manifest = contract.authority_runtime_semantic_manifest, paths = manifest.exact_paths, pathSet = new Set(paths), ownerMap = contract.authority_runtime_semantic_dependency_owner_map
    ok('owner rows', ownerMap.rows.length === paths.length && same(ownerMap.exact_paths, paths) && closed(ownerMap.row_schema) && ownerMap.dependency_membership_is_explicit_not_lexically_inferred === true)
    const graph = {}
    for (let index = 0; index < paths.length; index += 1) {
      const path = paths[index], row = manifest.rows[index], owner = ownerMap.rows[index], value = resolvePath(contract, path)
      ok(`${path} aligned`, row.authority_path === path && owner.authority_path === path && value !== undefined)
      ok(`${path} keyset`, row.semantic_kind === kindOf(value) && same(row.exact_keyset, keysetOf(value)))
      ok(`${path} content`, row.authority_content_sha256 === contentHash(path, value))
      ok(`${path} dependency owners`, owner.typed_owner_paths.every(item => pathSet.has(item) && item !== path) && same(row.direct_dependency_paths, owner.typed_owner_paths))
      graph[path] = owner.typed_owner_paths
    }
    for (const path of paths) {
      const row = manifest.rows[paths.indexOf(path)], directRows = graph[path].map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })), transitivePaths = transitive(graph, path), transitiveRows = transitivePaths.map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 }))
      ok(`${path} direct`, same(row.direct_dependency_content_hashes, directRows) && row.direct_dependency_set_sha256 === dependencyHash(path, 'direct', directRows))
      ok(`${path} transitive`, same(row.transitive_dependency_paths, transitivePaths) && same(row.transitive_dependency_content_hashes, transitiveRows) && row.transitive_dependency_set_sha256 === dependencyHash(path, 'transitive', transitiveRows))
    }
    const aliasRows = ownerMap.operation_authority_alias_rows, aliases = [...new Set(Object.values(contract.operation_authority).filter(Array.isArray).flat())].sort(codePointCompare)
    ok('operation aliases exact', same(aliasRows.map(row => row.alias), aliases) && aliasRows.every(row => pathSet.has(row.owner_path) && row.owner_path !== 'operation_authority'))
    for (const { sourcePath, ref } of paths.flatMap(path => walkRefFields(resolvePath(contract, path), path))) {
      ok(`caller ref:${sourcePath}:${ref}`, !/^caller([.\/:]|$)/i.test(ref))
      const first = ref.replace(/^\$\./, '').split('.')[0]
      if (pathSet.has(first) && first !== sourcePath) ok(`typed owner:${sourcePath}:${first}`, graph[sourcePath].includes(first))
    }
    ok('operation named/workload owners', aliasRows.some(row => row.alias === 'named_leader_predicate' && row.owner_path === 'case_authority_bindings') && aliasRows.filter(row => row.alias.startsWith('workload_')).every(row => row.owner_path === 'workload_authority_predicates'))
  })
  return out
}

if (read(machinePath) !== materializedR39Output) failures.push('machine differs from exact materializer')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r38.json') !== frozenR38.machine) failures.push('frozen R38 machine changed')
if (shaFile('scripts/materialize-ctrl-g24-trusted-ingress-r38.mjs') !== frozenR38.materializer) failures.push('frozen R38 materializer changed')
if (shaFile('scripts/check-ctrl-g24-trusted-ingress-r38.mjs') !== frozenR38.checker) failures.push('frozen R38 checker changed')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r38.md') !== frozenR38.human) failures.push('frozen R38 human changed')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-r38-qa-record.md') !== frozenR38.qa) failures.push('frozen R38 QA changed')
failures.push(...collect(materializedR39))

const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ...durableFields.map(field => [`undeclared committed payload ${field}`, c => { c.authority_operation_replay_registry_authority.committed.push({ payload_field: field, registry_field: field }) }]),
  ...durableFields.map(field => [`undeclared held payload ${field}`, c => { c.authority_operation_replay_registry_authority.held.push({ payload_field: field, registry_field: field }) }]),
  ...['original_committed', 'original_persisted_hold', 'ordinary_single_proof', 'session_dual_proof'].flatMap(variant => durableFields.map(field => [`unresolved typed source ${variant} ${field}`, c => { const row = c.authority_operation_durable_selection_typed_binding_schema.exact_rows.find(item => item.source_variant === variant && item.source_field === field); row.source_field = `missing_${field}` }])),
  ['typed destination missing', c => { c.authority_operation_durable_selection_typed_binding_schema.exact_rows[0].destination_field = 'missing' }],
  ['typed destination extra', c => { c.authority_operation_durable_selection_typed_binding_schema.exact_rows[0].extra = true }],
  ['selected variant fiction', c => { c.authority_operation_durable_selection_typed_binding_schema.exact_rows[0].source_variant = 'selected_variant' }],
  ['typed mismatch', c => { c.authority_operation_replay_classifier.row_schema.properties.expected_proof_family = { type: 'string' } }],
  ...durableFields.map(field => [`restart splice ${field}`, c => { const fixture = c.authority_operation_replay_restart_fixtures.fixtures[1]; fixture.registry_selection_fields[field] = field.includes('version') ? 'wrong.v1' : 'wrong' }]),
  ['restart hold splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].hold_selection_fields.evidence_kind = 'raw_session_hold_evidence' }],
  ['restart wrong classifier field', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].classifier_selection_fields.expected_proof_family = 'issuer' }],
  ['classifier fingerprint omits field', c => { c.fingerprint_schemas.authority_operation_replay_classifier_row_r39.excluded_fields.push('expected_branch_class') }],
  ['manifest enforcement weakened', c => { c.authority_runtime_semantic_manifest.unmanifested_or_multiply_covered_semantics = 'warn' }],
  ['manifest nested coverage weakened', c => { c.authority_runtime_semantic_manifest.nested_coverage_rule = 'top_level_only' }],
  ['manifest hash contract caller', c => { c.authority_runtime_semantic_manifest.hash_contract_ref = 'caller.hash_contract' }],
  ['manifest row schema weakened', c => { c.authority_runtime_semantic_manifest.row_schema.additional_properties = true }],
  ['manifest envelope schema weakened', c => { c.authority_runtime_semantic_manifest_envelope_schema.properties.unmanifested_or_multiply_covered_semantics.const = 'warn' }],
  ['hidden manifest metadata semantics', c => { c.authority_runtime_semantic_manifest.hidden = { caller_precedence: 'first' } }],
  ['hidden materialization semantics', c => { c.materialization.hidden = { writer: 'caller' } }],
  ['hidden schema change semantics', c => { c.schema_change_manifest.hidden = { authority: 'caller' } }],
  ['negative fixture removed manifest', c => { c.authority_runtime_semantic_manifest.negative_fixture_families.pop() }],
  ['negative fixture removed contract', c => { c.required_negative_fixture_families = c.required_negative_fixture_families.filter(item => item !== 'executable_replay_restart_fixtures') }],
  ['content path undeclared', c => { delete c.authority_runtime_semantic_manifest_hash_contract.content_preimage_schema.properties.authority_path }],
  ['graph undeclared path use', c => { c.authority_runtime_semantic_manifest_hash_contract.graph_preimage_schema.properties.authority_path = { type: 'identifier' } }],
  ['transitive scope undeclared', c => { delete c.authority_runtime_semantic_manifest_hash_contract.dependency_preimage_schema.properties.dependency_scope }],
  ['stored graph mismatch', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '0'.repeat(64) }],
  ['stored transitive mismatch', c => { c.authority_runtime_semantic_manifest.rows.find(row => row.transitive_dependency_paths.length).transitive_dependency_set_sha256 = '0'.repeat(64) }],
  ['owner row removed', c => { c.authority_runtime_semantic_dependency_owner_map.rows.pop() }],
  ['multiply owned ref', c => { c.authority_runtime_semantic_dependency_owner_map.rows.find(row => row.authority_path === 'operation_authority').typed_owner_paths.push('proof_authority') }],
  ['caller ref', c => { c.authority_operation_replay_derivation.binding_authority_ref = 'caller.bindings' }],
  ['operation named owner removed', c => { c.authority_runtime_semantic_dependency_owner_map.operation_authority_alias_rows = c.authority_runtime_semantic_dependency_owner_map.operation_authority_alias_rows.filter(row => row.alias !== 'named_leader_predicate') }],
  ['semantic refs empty dependencies', c => { c.authority_runtime_semantic_dependency_owner_map.rows.find(row => row.authority_path === 'authority_operation_replay_derivation').typed_owner_paths = [] }],
  ['manifest and content co-mutated', c => { c.operation_authority.caller_precedence = 'allowed'; const row = c.authority_runtime_semantic_manifest.rows.find(item => item.authority_path === 'operation_authority'); row.authority_content_sha256 = contentHash('operation_authority', c.operation_authority) }],
  ['visible expansion', c => { c.visible_surface_changes.push('control') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR39); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`R39 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R39 and ${mutations.length} mutation probes verified`)
console.log('r39_restart_fixtures=4')
console.log(`r39_manifest_rows=${materializedR39.authority_runtime_semantic_manifest.rows.length}`)
console.log(`r39_machine_sha256=${shaFile(machinePath)}`)
