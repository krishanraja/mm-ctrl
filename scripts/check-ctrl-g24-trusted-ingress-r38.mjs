import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR37 } from './materialize-ctrl-g24-trusted-ingress-r37.mjs'
import { materializedR38, materializedR38Output, canonicalR38 } from './materialize-ctrl-g24-trusted-ingress-r38.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r38.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const shaBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const shaFile = path => shaBytes(read(path))
const canonicalSha = value => shaBytes(Buffer.from(canonicalR38(value), 'utf8'))
const same = (a, b) => canonicalR38(a) === canonicalR38(b)
function ok(message, value) { if (!value) throw new Error(message) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function closed(schema) { return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, Object.keys(schema.properties)) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))) }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)); const right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function domainHash(domain, version, path, payload) { return shaBytes(Buffer.from(`${domain}\u001f${version}\u001f${path}\u001f${canonicalR38(payload)}`, 'utf8')) }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function stringsIn(value, out = []) { if (typeof value === 'string') out.push(value); else if (Array.isArray(value)) value.forEach(item => stringsIn(item, out)); else if (value && typeof value === 'object') Object.values(value).forEach(item => stringsIn(item, out)); return out }
function sameVersionDrift(before, after, path = '$', out = []) { if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return out; if (!Array.isArray(before) && !Array.isArray(after) && before.schema_version && after.schema_version && !same(before, after) && before.schema_version === after.schema_version) out.push(path); if (!Array.isArray(before) && !Array.isArray(after)) for (const key of Object.keys(before)) if (Object.hasOwn(after, key)) sameVersionDrift(before[key], after[key], `${path}.${key}`, out); return out }
function graphCycle(graph) { const visiting = new Set(), done = new Set(); function visit(node) { if (visiting.has(node)) return true; if (done.has(node)) return false; visiting.add(node); for (const next of graph[node] ?? []) if (visit(next)) return true; visiting.delete(node); done.add(node); return false } return Object.keys(graph).some(visit) }

const expectedParent = { commit: '2e9feb68809ff9238490b3a4283ff64ddfc59768', tree: 'f16fa5e8d9ef8cae053989cb853c53fa2c4b68de', human_blob: '0e58e93def26767078beb293b59d539f77ba8485', machine_blob: '50a1e34efa3bf87fc352202fd88f83a331766c37', qa_blob: 'f497961b647ab45fda96ce6933ce8fa0a247fed8', checker_blob: 'b9b41fd90300c11c476aa26e4c9e140abc9bb78e', materializer_blob: 'cbf55da5c40667a3deed91ee3d9dce5b9db586b5', founder_checker_blob: 'f0be47a00af5afc71887d924ce39710821806e67', adjudication: 'veto' }
const frozenR37 = {
  machine: '94c3a1838a7331e7687b2f374fb64b7a03cf551ee597b93342e8f9882133eb92',
  materializer: '1730545e959d57f609680fe3d2ee8d50a45c7d2fba9e0ff78bdaad05621409fe',
  checker: '0cbce0809162d3f5741dce55ef19dd27b380335c3c86c6d3ef097a8abce43b5f',
  human: '9db4eb4a8d8635b91a09cfa688c9f783c17d7d8de31e3f8081379ce4fccb5f3b',
  qa: 'dec82b7fb7938dc7540ed8db552f21395b8ae143b84c0c810ae0488ec22b9204',
}
const expectedPathsSha256 = 'c26ca63b76ac44a95da12d2ad7200bf3989d33d7d5f1e187777db364bc267c98'
const expectedRowsSha256 = '3cdc3294580ec3c563eaf206edf91f25ba0dee80acd6453e1fd0bf377f58b637'
const expectedGraphSha256 = 'c921e5d36ea00d2a6f8b8c562dd4bca4b0aa2698e64fb32863013f0b67f05619'
const expectedTopLevelSha256 = '288964aa56392a8f316970fbb7ec9dd1d8380062351e03ac6782069f62c28a04'
const durableFields = ['fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']
const branchClasses = ['committed', 'ordinary_held', 'session_verified_consuming', 'session_raw_nonconsuming']
const changedTopLevel = new Set(['schema_version', 'status', 'supersedes', 'materialization', 'operation_authority', 'outbox', 'proof_authority', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings', 'authority_operation_replay_derivation', 'authority_operation_replay_branch_map', 'authority_operation_replay_classifier', 'authority_operation_serializable_branch_transaction', 'authority_operation_committed_issuance_dag', 'authority_operation_ordinary_held_issuance_dag', 'authority_operation_session_verified_consuming_issuance_dag', 'authority_operation_session_raw_nonconsuming_issuance_dag', 'normative_authority_frozen_manifest', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_manifest', 'schema_change_manifest', 'required_negative_fixture_families'])

function directDependencies(contract, path, pathSet) { const dependencies = new Set(); for (const text of stringsIn(resolvePath(contract, path))) { const first = text.replace(/^\$\./, '').split('.')[0]; if (pathSet.has(first) && first !== path) dependencies.add(first) } return [...dependencies].sort(codePointCompare) }
function transitiveDependencies(graph, path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
function manifestAncestor(path, paths) { const first = path.replace(/^\$\./, '').split('.')[0]; return paths.includes(first) ? first : undefined }
function semanticVocabularyPaths(value, path = '$', out = []) { if (!value || typeof value !== 'object') return out; if (!Array.isArray(value)) { const text = `${Object.keys(value).join(' ')} ${Object.values(value).filter(item => typeof item === 'string').join(' ')}`; if (/(authority|caller|precedence|writer|transaction|derivation|evidence|write[_ -]?set|issuance[_ -]?dag|replay|registry|binding|runtime[_ -]?semantic)/i.test(text)) out.push(path) } for (const [key, item] of Object.entries(value)) semanticVocabularyPaths(item, `${path}.${key}`, out); return out }

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn() } catch (error) { out.push(`${name}: ${error.message}`) } }
  test('R38 identity and closed phase boundary', () => {
    ok('schema', contract.schema_version === 'ctrl.g24.trusted-ingress.r38.effective.v1')
    ok('parent', same(contract.supersedes, expectedParent))
    ok('parent machine SHA', contract.materialization.frozen_input.sha256 === frozenR37.machine)
    ok('no visible or external action', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, []))
  })
  test('frozen R37 core survives exactly outside bounded R38 paths', () => {
    for (const key of Object.keys(materializedR37)) if (!changedTopLevel.has(key)) ok(`unchanged ${key}`, same(contract[key], materializedR37[key]))
    const drift = sameVersionDrift(materializedR37, contract)
    ok(`same-version drift:${drift.join(',')}`, drift.length === 0)
  })
  test('canonical manifest hash contract is exact and insertion-order independent', () => {
    const rule = contract.authority_runtime_semantic_manifest_hash_contract
    ok('version/domain', rule.schema_version === 'ctrl.g24.runtime-semantic-authority-manifest-hash.r38.v1' && rule.domain_ascii === 'CTRL-G24-RUNTIME-SEMANTIC-AUTHORITY-MANIFEST-R38')
    ok('codec', rule.canonical_codec_ref === 'canonical_json_utf8_encoding' && rule.canonical_object_key_order === 'unicode_code_point_ascending' && rule.canonical_array_order === 'preserved' && rule.insertion_order_JSON_stringify === 'forbidden')
    ok('preimages', same(rule.content_preimage_order, ['domain_ascii', 'manifest_hash_version', 'authority_path', 'canonical_authority_object']) && same(rule.dependency_preimage_order, ['dependency_domain_ascii', 'manifest_hash_version', 'authority_path', 'canonical_sorted_dependency_path_and_content_hash_rows']))
    ok('canonical order independent', canonicalR38({ z: 1, a: { y: 2, b: 3 } }) === canonicalR38({ a: { b: 3, y: 2 }, z: 1 }))
    ok('semantic mutation differs', canonicalSha({ a: 1 }) !== canonicalSha({ a: 2 }))
  })
  test('independently pinned exhaustive transitive authority manifest', () => {
    const manifest = contract.authority_runtime_semantic_manifest, paths = manifest.exact_paths, pathSet = new Set(paths)
    ok('closed row', closed(manifest.row_schema) && same(Object.keys(manifest.rows[0]), manifest.row_schema.exact_keys))
    ok('independent membership', manifest.type === 'independently_pinned_exhaustive_runtime_semantic_authority_manifest' && manifest.membership_source === 'checker_and_materializer_independent_literal_paths_not_candidate_markers_names_or_counts')
    ok('pinned paths', paths.length === 194 && manifest.rows.length === 194 && manifest.exact_expected_count === 194 && canonicalSha(paths) === expectedPathsSha256)
    ok('pinned rows', canonicalSha(manifest.rows) === expectedRowsSha256)
    ok('pinned top level', canonicalSha(Object.keys(contract).sort(codePointCompare)) === expectedTopLevelSha256)
    const graph = Object.fromEntries(paths.map(path => [path, directDependencies(contract, path, pathSet)]))
    const rule = contract.authority_runtime_semantic_manifest_hash_contract
    for (let index = 0; index < paths.length; index += 1) {
      const path = paths[index], row = manifest.rows[index], value = resolvePath(contract, path)
      ok(`${path} exists`, value !== undefined)
      ok(`${path} row path`, row.authority_path === path && row.authority_schema_ref === path)
      ok(`${path} kind`, row.semantic_kind === kindOf(value))
      ok(`${path} keyset`, same(row.exact_keyset, keysetOf(value)))
      const version = value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r38.v1`
      ok(`${path} version`, row.authority_schema_version === version)
      const contentHash = domainHash(rule.domain_ascii, rule.schema_version, path, value)
      ok(`${path} content hash`, row.authority_content_sha256 === contentHash)
      const directRows = graph[path].map(dependencyPath => ({ authority_path: dependencyPath, authority_content_sha256: manifest.rows[paths.indexOf(dependencyPath)].authority_content_sha256 }))
      ok(`${path} direct paths`, same(row.direct_dependency_paths, graph[path]))
      ok(`${path} direct hashes`, same(row.direct_dependency_content_hashes, directRows))
      ok(`${path} direct set hash`, row.direct_dependency_set_sha256 === domainHash(rule.dependency_domain_ascii, rule.schema_version, path, directRows))
      const transitivePaths = transitiveDependencies(graph, path)
      const transitiveRows = transitivePaths.map(dependencyPath => ({ authority_path: dependencyPath, authority_content_sha256: manifest.rows[paths.indexOf(dependencyPath)].authority_content_sha256 }))
      ok(`${path} transitive paths`, same(row.transitive_dependency_paths, transitivePaths))
      ok(`${path} transitive hashes`, same(row.transitive_dependency_content_hashes, transitiveRows))
      ok(`${path} transitive set hash`, row.transitive_dependency_set_sha256 === domainHash(rule.dependency_domain_ascii, rule.schema_version, `${path}:transitive`, transitiveRows))
    }
    ok('manifest graph', manifest.manifest_graph_sha256 === expectedGraphSha256 && manifest.manifest_graph_sha256 === domainHash(rule.graph_domain_ascii, rule.schema_version, 'authority_runtime_semantic_manifest.rows', manifest.rows))
    const metadata = new Set(['$', '$.supersedes', '$.materialization', '$.schema_change_manifest', '$.authority_runtime_semantic_manifest'])
    for (const found of semanticVocabularyPaths(contract)) if (![...metadata].some(prefix => found === prefix || found.startsWith(`${prefix}.`))) ok(`unmanifested semantic:${found}`, manifestAncestor(found, paths))
    ok('recursive scan rule exact', manifest.recursive_authority_vocabulary_scan_rule === 'any_authority_control_precedence_caller_writer_transaction_derivation_evidence_write_set_replay_registry_binding_DAG_or_runtime_semantic_object_must_have_exactly_one_manifested_top_level_ancestor; metadata_roots_must_contain_none')
  })
  test('replay registry hold classifier closure binds all durable selection fields', () => {
    const registry = contract.authority_operation_replay_registry_authority, bindings = contract.authority_operation_replay_resolution_bindings, map = contract.authority_operation_replay_branch_map, classifier = contract.authority_operation_replay_classifier, derivation = contract.authority_operation_replay_derivation
    ok('versions', registry.schema_version === 'ctrl.g24.authority-operation-replay-registry-authority.r38.v1' && bindings.schema_version === 'ctrl.g24.authority-operation-replay-resolution-bindings.r38.v1' && derivation.schema_version === 'ctrl.g24.authority-operation-replay-derivation.r38.v1')
    ok('five fields', same(bindings.exact_binding_fields, durableFields) && same(map.durable_selection_fields, durableFields) && same(classifier.durable_selection_fields, durableFields) && same(derivation.durable_selection_fields, durableFields))
    ok('binding rows identical', same(registry.durable_selection_bindings, bindings.durable_selection_bindings) && registry.durable_selection_bindings.length === 5)
    for (const field of durableFields) {
      ok(`committed ${field}`, registry.committed.some(row => row.payload_field === field && row.registry_field === field))
      ok(`held ${field}`, registry.held.some(row => row.payload_field === field && row.registry_field === field))
      ok(`hold ${field}`, registry.held_hold_row_equalities.some(row => row.registry_field === field && row.hold_field === field))
    }
    ok('refs exact', derivation.binding_authority_ref === 'authority_operation_replay_resolution_bindings' && derivation.registry_authority_ref === 'authority_operation_replay_registry_authority' && bindings.registry_authority_ref === derivation.registry_authority_ref && registry.binding_authority_ref === derivation.binding_authority_ref)
    ok('no caller refs', bindings.caller_supplied_registry_authority_ref === 'forbidden' && bindings.caller_supplied_binding_authority_ref === 'forbidden' && derivation.caller_precedence === 'forbidden')
    ok('source semantics identical', same(map.source_precedence, registry.source_precedence) && map.anti_splice === registry.abc_splice_rule && bindings.source_precedence_ref === 'authority_operation_replay_registry_authority.source_precedence' && bindings.anti_splice_ref === 'authority_operation_replay_registry_authority.abc_splice_rule')
    ok('registry first and order', classifier.registry_first && derivation.registry_authority_first && Object.values(map.variants).every(variant => variant.replay_path[0].includes('registry_row') && variant.replay_path.indexOf('resolve_exact_result_artifact') < variant.replay_path.indexOf('resolve_exact_historical_response_artifact') && variant.replay_path.indexOf('resolve_exact_replay_payload_artifact') < variant.replay_path.indexOf('resolve_exact_replay_envelope_artifact')))
  })
  test('execution authority is exact manifested and non-caller controlled', () => {
    ok('proof', contract.proof_authority.schema_version.endsWith('.r38.v1') && contract.proof_authority.caller_supplied_proof_bundle_allowed === false && contract.proof_authority.browser_serializable_proof_bundle_allowed === false && contract.proof_authority.caller_precedence === 'forbidden')
    ok('operation', contract.operation_authority.schema_version.endsWith('.r38.v1') && same(contract.operation_authority.use_release, ['named_leader_predicate']) && contract.operation_authority.use_release_authority === 'named_leader_predicate_only' && contract.operation_authority.caller_selectable_operation === false && contract.operation_authority.caller_precedence === 'forbidden')
    ok('outbox', contract.outbox.schema_version.endsWith('.r38.v1') && contract.outbox.authoritative_state === 'derived_from_append_only_claim_reservation_dispatch_terminal_and_reconciliation_events' && contract.outbox.provider_callback_authoritative_state === false && contract.outbox.caller_precedence === 'forbidden')
    const transaction = contract.authority_operation_serializable_branch_transaction
    ok('transaction', transaction.schema_version.endsWith('.r38.v1') && transaction.branch_write_set_authority === 'exact_selected_R38_branch_class_and_result_branch_only' && transaction.caller_precedence === 'forbidden')
    ok('write set schema closed', closed(transaction.branch_write_set_row_schema) && same(transaction.branch_write_set_row_schema.caller_writable_fields, []))
    ok('write sets exact', transaction.branch_write_sets.length === 6 && transaction.branch_write_sets.every(row => same(Object.keys(row), transaction.branch_write_set_row_schema.exact_keys.filter(key => key !== 'forbidden' || Object.hasOwn(row, 'forbidden')))))
    ok('session effects', transaction.session_branch_effects.session_verified_consuming.nonce_rows === 2 && transaction.session_branch_effects.session_verified_consuming.evidence_schema_ref.endsWith('verified_consuming') && transaction.session_branch_effects.session_raw_nonconsuming.nonce_rows === 0 && transaction.session_branch_effects.session_raw_nonconsuming.evidence_schema_ref.endsWith('raw_non_consuming') && transaction.session_branch_effects.session_raw_nonconsuming.authority_read_set === 'forbidden')
    const verified = contract.authority_operation_session_verified_consuming_issuance_dag, raw = contract.authority_operation_session_raw_nonconsuming_issuance_dag
    ok('DAG versions', [contract.authority_operation_committed_issuance_dag, contract.authority_operation_ordinary_held_issuance_dag, verified, raw].every(dag => dag.schema_version.endsWith('.r38.v1') && dag.runtime_authority === 'exact_selected_branch_DAG_only' && dag.caller_precedence === 'forbidden'))
    ok('DAG split', verified.exact_nonce_rows === 2 && verified.evidence_variant_ref === 'session_hold_evidence_schema.variants.verified_consuming' && raw.exact_nonce_rows === 0 && raw.evidence_variant_ref === 'session_hold_evidence_schema.variants.raw_non_consuming' && raw.truth_projection_read_set_and_nonce === 'forbidden')
    const manifestPaths = contract.authority_runtime_semantic_manifest.exact_paths
    for (const path of ['proof_authority', 'operation_authority', 'outbox', 'authority_operation_serializable_branch_transaction', 'authority_operation_committed_issuance_dag', 'authority_operation_ordinary_held_issuance_dag', 'authority_operation_session_verified_consuming_issuance_dag', 'authority_operation_session_raw_nonconsuming_issuance_dag', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings']) ok(`manifested ${path}`, manifestPaths.includes(path))
  })
  test('R37 row split and durable lineage remain exact', () => {
    const selector = contract.authority_operation_fresh_branch_class_selection
    ok('90 rows', selector.rows.length === 90 && selector.exact_committed_rows === 15 && selector.exact_ordinary_held_rows === 60 && selector.exact_session_verified_consuming_rows === 6 && selector.exact_session_raw_nonconsuming_rows === 9)
    ok('four classes', same(contract.authority_operation_identity_derivation_rules.exact_variants, branchClasses))
    for (const schema of [contract.authority_operation_registry.row_union.variants.original_committed, contract.authority_operation_registry.row_union.variants.original_persisted_hold, ...Object.values(contract.authority_operation_hold_store.row_union.variants)]) for (const field of durableFields) ok(`durable ${field}`, schema.properties[field] && schema.exact_keys.includes(field))
    for (const variant of Object.values(contract.authority_operation_replay_branch_map.variants)) { const path = variant.replay_path; ok('unique path', new Set(path).size === path.length); ok('ordered', path.indexOf('resolve_exact_result_artifact') < path.indexOf('resolve_exact_historical_response_artifact') && path.indexOf('resolve_exact_replay_payload_artifact') < path.indexOf('resolve_exact_replay_envelope_artifact')) }
  })
  return out
}

if (read(machinePath) !== materializedR38Output) failures.push('machine differs from exact materializer')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r37.json') !== frozenR37.machine) failures.push('frozen R37 machine changed')
if (shaFile('scripts/materialize-ctrl-g24-trusted-ingress-r37.mjs') !== frozenR37.materializer) failures.push('frozen R37 materializer changed')
if (shaFile('scripts/check-ctrl-g24-trusted-ingress-r37.mjs') !== frozenR37.checker) failures.push('frozen R37 checker changed')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r37.md') !== frozenR37.human) failures.push('frozen R37 human contract changed')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-r37-qa-record.md') !== frozenR37.qa) failures.push('frozen R37 QA changed')
failures.push(...collect(materializedR38))

const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['proof caller supplied allowed', c => { c.proof_authority.caller_supplied_proof_bundle_allowed = true }],
  ['operation use release caller', c => { c.operation_authority.use_release = ['caller'] }],
  ['outbox provider callback authority', c => { c.outbox.authoritative_state = 'provider_callback' }],
  ['raw session nonce rows two', c => { c.authority_operation_session_raw_nonconsuming_issuance_dag.exact_nonce_rows = 2 }],
  ['raw DAG evidence ref deleted', c => { delete c.authority_operation_session_raw_nonconsuming_issuance_dag.evidence_variant_ref }],
  ['raw and verified evidence swapped', c => { const raw = c.authority_operation_session_raw_nonconsuming_issuance_dag, verified = c.authority_operation_session_verified_consuming_issuance_dag; [raw.evidence_variant_ref, verified.evidence_variant_ref] = [verified.evidence_variant_ref, raw.evidence_variant_ref] }],
  ['nested unmarked caller precedence', c => { c.request_admission.hidden_runtime = { caller_precedence: 'first' } }],
  ['caller registry ref', c => { c.authority_operation_replay_derivation.registry_authority_ref = 'caller.registry' }],
  ['caller binding ref', c => { c.authority_operation_replay_derivation.binding_authority_ref = 'caller.bindings' }],
  ['weaken recursive scan rule', c => { c.authority_runtime_semantic_manifest.recursive_authority_vocabulary_scan_rule = 'best_effort' }],
  ['manifest path removed', c => { c.authority_runtime_semantic_manifest.exact_paths.pop() }],
  ['manifest row removed', c => { c.authority_runtime_semantic_manifest.rows.pop() }],
  ['manifest row content hash forged', c => { c.authority_runtime_semantic_manifest.rows[0].authority_content_sha256 = '0'.repeat(64) }],
  ['manifest and object co-mutated', c => { c.operation_authority.caller_precedence = 'allowed'; const row = c.authority_runtime_semantic_manifest.rows.find(item => item.authority_path === 'operation_authority'); row.authority_content_sha256 = domainHash(c.authority_runtime_semantic_manifest_hash_contract.domain_ascii, c.authority_runtime_semantic_manifest_hash_contract.schema_version, 'operation_authority', c.operation_authority) }],
  ['manifest candidate count', c => { c.authority_runtime_semantic_manifest.exact_expected_count = c.authority_runtime_semantic_manifest.rows.length - 1 }],
  ['new top level semantic object', c => { c.hidden_control = { runtime_semantic_authority: true } }],
  ['canonical codec insertion order', c => { c.authority_runtime_semantic_manifest_hash_contract.canonical_object_key_order = 'insertion_order' }],
  ['canonical domain changed', c => { c.authority_runtime_semantic_manifest_hash_contract.domain_ascii = 'OTHER' }],
  ['dependency path removed', c => { c.authority_runtime_semantic_manifest.rows.find(row => row.direct_dependency_paths.length).direct_dependency_paths.pop() }],
  ['transitive hash forged', c => { c.authority_runtime_semantic_manifest.rows.find(row => row.transitive_dependency_paths.length).transitive_dependency_set_sha256 = '0'.repeat(64) }],
  ['registry selection field absent committed', c => { c.authority_operation_replay_registry_authority.committed = c.authority_operation_replay_registry_authority.committed.filter(row => row.payload_field !== 'branch_class') }],
  ['registry selection field absent held', c => { c.authority_operation_replay_registry_authority.held = c.authority_operation_replay_registry_authority.held.filter(row => row.payload_field !== 'proof_family') }],
  ['registry hold classifier binding absent', c => { c.authority_operation_replay_registry_authority.durable_selection_bindings.pop() }],
  ['hold equality absent', c => { c.authority_operation_replay_registry_authority.held_hold_row_equalities = c.authority_operation_replay_registry_authority.held_hold_row_equalities.filter(row => row.registry_field !== 'evidence_kind') }],
  ['branch map precedence drift', c => { c.authority_operation_replay_branch_map.source_precedence = ['caller'] }],
  ['branch map anti splice drift', c => { c.authority_operation_replay_branch_map.anti_splice = 'weak' }],
  ['resolution caller registry', c => { c.authority_operation_replay_resolution_bindings.caller_supplied_registry_authority_ref = 'allowed' }],
  ['resolution caller bindings', c => { c.authority_operation_replay_resolution_bindings.caller_supplied_binding_authority_ref = 'allowed' }],
  ['transaction raw nonce two', c => { c.authority_operation_serializable_branch_transaction.session_branch_effects.session_raw_nonconsuming.nonce_rows = 2 }],
  ['transaction write set open', c => { c.authority_operation_serializable_branch_transaction.branch_write_set_row_schema.additional_properties = true }],
  ['transaction caller precedence', c => { c.authority_operation_serializable_branch_transaction.caller_precedence = 'allowed' }],
  ['verified nonce zero', c => { c.authority_operation_session_verified_consuming_issuance_dag.exact_nonce_rows = 0 }],
  ['replay no registry first', c => { c.authority_operation_replay_classifier.registry_first = false }],
  ['replay wrong result history order', c => { const p = c.authority_operation_replay_branch_map.variants.committed.replay_path; [p[1], p[2]] = [p[2], p[1]] }],
  ['durable selection field removed from registry', c => { const schema = c.authority_operation_registry.row_union.variants.original_committed; delete schema.properties.evidence_kind; schema.exact_keys = schema.exact_keys.filter(key => key !== 'evidence_kind'); schema.required = schema.required.filter(key => key !== 'evidence_kind') }],
  ['selector count drift', c => { c.authority_operation_fresh_branch_class_selection.exact_session_raw_nonconsuming_rows = 10 }],
  ['same version nested drift', c => { c.presentation_protocol.extra = 'unversioned' }],
  ['visible expansion', c => { c.visible_surface_changes.push('control') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR38); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`R38 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R38 and ${mutations.length} mutation probes verified`)
console.log(`r38_manifest_rows=${materializedR38.authority_runtime_semantic_manifest.rows.length}`)
console.log(`r38_machine_sha256=${shaFile(machinePath)}`)
