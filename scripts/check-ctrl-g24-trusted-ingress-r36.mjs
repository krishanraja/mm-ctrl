import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR35 } from './materialize-ctrl-g24-trusted-ingress-r35.mjs'
import { materializedR36, materializedR36Output } from './materialize-ctrl-g24-trusted-ingress-r36.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r36.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function ok(message, value) { if (!value) throw new Error(message) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function graphCycle(nodes, edges) { const next = new Map(nodes.map(node => [node, []])); for (const [from, to] of edges) { if (!next.has(from) || !next.has(to)) return true; next.get(from).push(to) } const visiting = new Set(), done = new Set(); function visit(node) { if (visiting.has(node)) return true; if (done.has(node)) return false; visiting.add(node); for (const target of next.get(node)) if (visit(target)) return true; visiting.delete(node); done.add(node); return false } return nodes.some(visit) }
function sameVersionDrift(before, after, path = '$', out = []) { if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return out; if (!Array.isArray(before) && !Array.isArray(after) && before.schema_version && after.schema_version && !same(before, after) && before.schema_version === after.schema_version) out.push(path); if (!Array.isArray(before) && !Array.isArray(after)) for (const key of Object.keys(before)) if (Object.hasOwn(after, key)) sameVersionDrift(before[key], after[key], `${path}.${key}`, out); return out }

const expectedParent = { commit: '73eb2e505671247d1fdfc749ef7707eba64a9401', tree: '309c2540f6eaf5409fcd9419c4e70ea81221204b', human_blob: '9ed721ed509da0b3d94a27e6a752660d5fecbc89', machine_blob: 'd5edc9fd47849b308bc18a61ca7e24abf26ac365', qa_blob: '1442ca099dab556eb054c237c6ce5ea156b25741', checker_blob: '754a57126a9dbf5e4719b9f4f429954b1332fb46', materializer_blob: '34c9f4caf8a9b81b5705e914f84d7738faabdb74', founder_checker_blob: '1bc3f2f8682d67774c9f80721dd6525536289140', adjudication: 'veto' }
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const sessionOperations = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']
const branchClasses = ['committed', 'ordinary_held', 'session_held']
const proofFamily = operation => operation.exact_authority_role === 'bootstrap' ? 'root_bootstrap_2_of_2' : operation.exact_authority_role === 'root_admin' ? 'root_admin' : operation.exact_authority_role === 'issuer' ? 'issuer' : operation.exact_authority_role === 'issuer_and_evaluator' ? 'dual_issuer_evaluator' : 'UNKNOWN'

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn() } catch (error) { out.push(`${name}: ${error.message}`) } }
  const operations = contract.case_session_authority_operation_protocols.operations
  test('identity and closed boundary', () => { ok('R36', contract.schema_version === 'ctrl.g24.trusted-ingress.r36.effective.v1'); ok('parent', same(contract.supersedes, expectedParent)); ok('parent SHA', contract.materialization.frozen_input.sha256 === '319ddcb2f180d0f1b93785df8ec2571c1a7a3bac6a8b1e9f08310049a4ea89a8'); ok('closed', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, [])) })
  test('fresh branch selector covers every operation and result branch exactly', () => {
    const table = contract.authority_operation_fresh_branch_class_selection
    ok('table R36 normative', table.schema_version.includes('.r36.') && table.normative && table.no_default_or_fallback_class)
    ok('counts', table.rows.length === 90 && table.exact_expected_rows === 90 && table.exact_committed_rows === 15 && table.exact_ordinary_held_rows === 60 && table.exact_session_held_rows === 15)
    const expected = []
    for (const [operationName, operation] of Object.entries(operations)) {
      const family = proofFamily(operation), session = sessionOperations.includes(operationName)
      expected.push([`${operationName}|${family}|committed`, operationName, family, 'committed', 'committed', `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.committed`, 'UNAVAILABLE', 'forbidden', 'authority_operation_committed_issuance_dag'])
      for (const branch of heldBranches) expected.push([`${operationName}|${family}|${branch}`, operationName, family, branch, session ? 'session_held' : 'ordinary_held', `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, session ? 'authority_operation_hold_store.row_union.variants.session_dual_proof' : 'authority_operation_hold_store.row_union.variants.ordinary_single_proof', session ? 'required' : 'forbidden', session ? 'authority_operation_session_held_issuance_dag' : 'authority_operation_ordinary_held_issuance_dag'])
    }
    const actual = table.rows.map(row => [row.selection_row_id, row.operation_name, row.proof_family, row.result_branch, row.branch_class, row.result_schema_ref, row.hold_schema_ref, row.session_evidence, row.issuance_dag_ref])
    ok('all rows exact ordered', same(actual, expected) && new Set(actual.map(row => row[0])).size === 90 && same(table.unique_keys, [['operation_name', 'proof_family', 'result_branch'], ['selection_row_id']]))
    table.rows.forEach(row => { ok(`result ref ${row.operation_name}.${row.result_branch}`, resolvePath(contract, row.result_schema_ref)); if (row.hold_schema_ref !== 'UNAVAILABLE') ok(`hold ref ${row.operation_name}.${row.result_branch}`, resolvePath(contract, row.hold_schema_ref)) })
    ok('transaction binds row', contract.authority_operation_serializable_branch_transaction.fresh_branch_selection_ref === 'authority_operation_fresh_branch_class_selection' && contract.authority_operation_serializable_branch_transaction.selected_row_required_before_branch_derivation && same(contract.authority_operation_serializable_branch_transaction.selected_branch_row_identity_fields, ['selection_row_id', 'operation_name', 'proof_family', 'result_branch', 'branch_class', 'result_schema_ref', 'hold_schema_ref', 'session_evidence', 'issuance_dag_ref']))
    ok('derivation binds row', contract.authority_operation_identity_derivation_rules.selected_branch_table_ref === 'authority_operation_fresh_branch_class_selection')
  })
  test('three exact branch source roots contain no unavailable authority', () => {
    const variants = contract.authority_operation_identity_derivation_rules.variants
    ok('cross-branch dependency forbidden', contract.authority_operation_identity_derivation_rules.unavailable_cross_branch_dependency === 'forbidden')
    const expected = {
      committed: { root: 'committed_precommit_material', sources: ['authority_operation_receipt_precommit_identity_plans', 'case_session_authority_operation_protocols', 'authority_proof_verification', 'case_session_authority_read_set_schema', 'authority_partition_head_store'], forbidden: ['authority_operation_hold_store', 'session_hold_evidence_schema', 'final_hold_fingerprint'] },
      ordinary_held: { root: 'ordinary_hold_precommit_material', sources: ['authority_operation_hold_store.row_union.variants.ordinary_single_proof', 'case_session_authority_operation_protocols', 'authority_proof_verification', 'case_session_authority_read_set_schema', 'authority_partition_head_store'], forbidden: ['authority_operation_receipt_precommit_identity_plans', 'session_hold_evidence_schema', 'final_receipt_fingerprint'] },
      session_held: { root: 'session_hold_evidence_material', sources: ['session_hold_evidence_schema', 'session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'authority_partition_head_store', 'case_session_authority_operation_protocols'], forbidden: ['authority_operation_receipt_precommit_identity_plans', 'final_receipt_fingerprint'] },
    }
    for (const branch of branchClasses) {
      const variant = variants[branch], rules = variant.rules, plan = expected[branch]
      ok(`${branch} no shared root`, !rules.validated_precommit_material)
      ok(`${branch} root name`, variant.exact_available_source_root === plan.root && rules[plan.root])
      ok(`${branch} source set`, same(rules[plan.root].source_refs, plan.sources) && rules[plan.root].depends_on.length === 0)
      ok(`${branch} forbidden set`, same(variant.forbidden_unavailable_sources, plan.forbidden))
      rules[plan.root].source_refs.forEach(ref => ok(`${branch} source ${ref}`, resolvePath(contract, ref)))
      const graph = contract.authority_operation_identity_dependency_graph.variants[branch], nodes = Object.keys(rules), edges = Object.entries(rules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target]))
      ok(`${branch} graph exact`, same(graph.nodes, nodes) && same(graph.edges, edges) && !graphCycle(nodes, edges))
      for (const rule of Object.values(rules)) rule.depends_on.forEach(dep => ok(`${branch} dependency ${dep}`, rules[dep]))
      const dag = contract[branch === 'committed' ? 'authority_operation_committed_issuance_dag' : `authority_operation_${branch}_issuance_dag`]
      ok(`${branch} DAG exact`, same(dag.nodes, nodes) && same(dag.edges, edges) && dag.selected_branch_class === branch && dag.selected_branch_table_ref === 'authority_operation_fresh_branch_class_selection')
    }
  })
  test('replay classifier is exhaustive and byte-parallel with fresh selection', () => {
    const fresh = contract.authority_operation_fresh_branch_class_selection, replay = contract.authority_operation_replay_classifier, map = contract.authority_operation_replay_branch_map
    ok('classifier normative', replay.normative && replay.schema_version.includes('.r36.') && replay.rows.length === 90 && replay.exact_expected_rows === 90)
    const projected = fresh.rows.map(row => [row.selection_row_id, row.operation_name, row.proof_family, row.result_branch, row.branch_class, row.hold_schema_ref, row.session_evidence, row.issuance_dag_ref])
    const replayed = replay.rows.map(row => [row.fresh_selection_row_id, row.operation_name, row.proof_family, row.result_branch, row.branch_class, row.held_registry_hold_schema_ref, row.session_evidence_availability, row.original_issuance_dag_ref])
    ok('fresh replay parity', same(projected, replayed))
    replay.rows.forEach(row => { ok(`${row.operation_name}.${row.result_branch} replay path`, row.replay_path_ref === `authority_operation_replay_branch_map.variants.${row.branch_class}.replay_path` && resolvePath(contract, row.replay_path_ref)); ok(`${row.operation_name}.${row.result_branch} DAG`, row.original_issuance_dag_ref === map.variants[row.branch_class].original_issuance_dag_ref); const expectedTriple = row.branch_class === 'session_held' ? ['held_registry.session_hold_evidence_ref_or_unavailable', 'held_registry.session_hold_evidence_bytes_sha256_or_unavailable', 'held_registry.session_hold_evidence_fingerprint_or_unavailable'] : ['UNAVAILABLE', 'UNAVAILABLE', 'UNAVAILABLE']; ok(`${row.operation_name}.${row.result_branch} evidence triple`, same(row.session_evidence_triple_source, expectedTriple)) })
    ok('closed classifier', map.replay_classifier_ref === 'authority_operation_replay_classifier' && map.branch_class_derivation === 'exactly_one_authority_operation_replay_classifier_row_or_hold_without_disclosure_or_write')
    ok('registry and evidence authority', replay.registry_authority.includes('hold_schema_ref') && replay.session_evidence_authority.includes('exact_triple'))
  })
  test('every replay path preserves result history payload envelope order', () => {
    const map = contract.authority_operation_replay_branch_map
    ok('result order named', map.result_resolution_order === 'after_exact_registry_and_hold_when_held_but_before_historical_response')
    for (const branch of branchClasses) {
      const variant = map.variants[branch], path = variant.replay_path
      const result = path.indexOf('resolve_exact_result_artifact'), history = path.indexOf('resolve_exact_historical_response_artifact'), payload = path.indexOf('resolve_exact_replay_payload_artifact'), envelope = path.indexOf('resolve_exact_replay_envelope_artifact')
      ok(`${branch} exact order`, result >= 0 && result < history && history < payload && payload < envelope && envelope < path.indexOf('return_exact_original_response'))
      ok(`${branch} rules`, same(variant.replay_order_rules, ['resolve_exact_result_artifact_before_historical_response', 'resolve_exact_replay_payload_artifact_before_replay_envelope_artifact', 'return_only_after_exact_envelope_resolution']))
    }
    ok('derivation order', contract.authority_operation_replay_derivation.resolve_exact_result_artifact_before_history && contract.authority_operation_replay_derivation.payload_before_envelope_required)
  })
  test('normative authority registry is exact and exhaustive', () => {
    const registry = contract.normative_authority_registry
    const active = Object.entries(contract).filter(([, value]) => value && typeof value === 'object' && value.normative === true).map(([key]) => key)
    ok('registry R36', registry.schema_version === 'ctrl.g24.normative-authority-registry.r36.v1' && registry.type === 'exhaustive_top_level_normative_authority_registry')
    ok('every active exactly once', registry.rows.length === registry.exact_expected_rows && same([...registry.rows.map(row => row.authority_key)].sort(), [...active].sort()) && new Set(active).size === active.length && new Set(registry.rows.map(row => row.authority_key)).size === registry.rows.length)
    for (const row of registry.rows) { const authority = contract[row.authority_key], local = resolvePath(contract, row.local_schema_ref); ok(`${row.authority_key} authority`, authority && authority.normative && row.authority_schema_ref === row.authority_key && row.authority_schema_version === authority.schema_version); ok(`${row.authority_key} local`, local && row.local_schema_version === local.schema_version && authority.local_schema_ref === row.local_schema_ref && authority.local_schema_version === row.local_schema_version) }
    ok('historical local exact', contract.authority_operation_historical_response_binding_authority.local_schema_ref === 'authority_operation_historical_response_schema')
  })
  test('R35 strengths and version discipline survive', () => {
    ok('legacy history binding absent', !contract.authority_operation_historical_response_field_bindings)
    ok('one history binding source includes bytes', contract.authority_operation_historical_response_binding_authority.bindings.some(row => row.local_field === 'result_bytes_sha256' && row.source_field === 'canonical_bytes_sha256'))
    ok('no singular graph', !contract.authority_operation_identity_dependency_graph.nodes && !contract.authority_operation_identity_dependency_graph.edges && contract.authority_operation_identity_dependency_graph.hidden_filtered_edges === 'forbidden')
    ok('no old hold DAG', !contract.authority_operation_hold_issuance_dag)
    const drift = sameVersionDrift(materializedR35, contract); ok(`same-version:${drift.join(',')}`, drift.length === 0)
    ok('manifest', contract.schema_change_manifest.every_changed_or_new_semantic_object_has_r36_identifier)
  })
  return out
}

if (read(machinePath) !== materializedR36Output) failures.push('machine differs from exact materializer')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r35.json') !== '319ddcb2f180d0f1b93785df8ec2571c1a7a3bac6a8b1e9f08310049a4ea89a8') failures.push('frozen R35 changed')
failures.push(...collect(materializedR36))
const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['selection row removed', c => { c.authority_operation_fresh_branch_class_selection.rows.pop() }],
  ['selection row duplicate', c => { c.authority_operation_fresh_branch_class_selection.rows[1] = structuredClone(c.authority_operation_fresh_branch_class_selection.rows[0]) }],
  ['always committed selector', c => { c.authority_operation_fresh_branch_class_selection.rows.forEach(row => { row.branch_class = 'committed' }) }],
  ['session held mapped ordinary', c => { c.authority_operation_fresh_branch_class_selection.rows.find(row => row.operation_name === 'issue_server_session_principal' && row.result_branch === 'authorization_hold').branch_class = 'ordinary_held' }],
  ['ordinary held mapped session', c => { c.authority_operation_fresh_branch_class_selection.rows.find(row => row.operation_name === 'issue_account_access_standing' && row.result_branch === 'authorization_hold').branch_class = 'session_held' }],
  ['wrong proof family', c => { c.authority_operation_fresh_branch_class_selection.rows[0].proof_family = 'issuer' }],
  ['wrong result schema ref', c => { c.authority_operation_fresh_branch_class_selection.rows[0].result_schema_ref = c.authority_operation_fresh_branch_class_selection.rows[1].result_schema_ref }],
  ['wrong hold schema ref', c => { c.authority_operation_fresh_branch_class_selection.rows[1].hold_schema_ref = 'UNAVAILABLE' }],
  ['shared root restored', c => { c.authority_operation_identity_derivation_rules.variants.committed.rules.validated_precommit_material = { source_refs: [], depends_on: [] } }],
  ['committed root includes hold', c => { c.authority_operation_identity_derivation_rules.variants.committed.rules.committed_precommit_material.source_refs.push('authority_operation_hold_store') }],
  ['ordinary root includes receipt', c => { c.authority_operation_identity_derivation_rules.variants.ordinary_held.rules.ordinary_hold_precommit_material.source_refs[0] = 'authority_operation_receipt_precommit_identity_plans' }],
  ['session root omits evidence', c => { c.authority_operation_identity_derivation_rules.variants.session_held.rules.session_hold_evidence_material.source_refs.shift() }],
  ['cross branch dependency reopened', c => { c.authority_operation_identity_derivation_rules.unavailable_cross_branch_dependency = 'ignore' }],
  ['graph hides root edge', c => { c.authority_operation_identity_dependency_graph.variants.session_held.edges.shift() }],
  ['replay classifier row swapped', c => { [c.authority_operation_replay_classifier.rows[0], c.authority_operation_replay_classifier.rows[1]] = [c.authority_operation_replay_classifier.rows[1], c.authority_operation_replay_classifier.rows[0]] }],
  ['replay classifier hold schema drift', c => { c.authority_operation_replay_classifier.rows[1].held_registry_hold_schema_ref = 'UNAVAILABLE' }],
  ['replay classifier evidence triple drift', c => { c.authority_operation_replay_classifier.rows.find(row => row.branch_class === 'session_held').session_evidence_triple_source[0] = 'UNAVAILABLE' }],
  ['replay classifier branch drift', c => { c.authority_operation_replay_classifier.rows[1].branch_class = 'committed' }],
  ['replay missing result', c => { c.authority_operation_replay_branch_map.variants.committed.replay_path = c.authority_operation_replay_branch_map.variants.committed.replay_path.filter(node => node !== 'resolve_exact_result_artifact') }],
  ['replay envelope before payload', c => { const p = c.authority_operation_replay_branch_map.variants.ordinary_held.replay_path; const a = p.indexOf('resolve_exact_replay_payload_artifact'), b = p.indexOf('resolve_exact_replay_envelope_artifact'); [p[a], p[b]] = [p[b], p[a]] }],
  ['branch derivation reopened', c => { c.authority_operation_replay_branch_map.branch_class_derivation = 'default_committed' }],
  ['evasive competing authority', c => { c.innocent_name = { schema_version: 'ctrl.g24.competing.r36.v1', normative: true, local_schema_ref: 'authority_operation_historical_response_schema', local_schema_version: c.authority_operation_historical_response_schema.schema_version } }],
  ['registry row removed', c => { c.normative_authority_registry.rows.pop() }],
  ['registry stale local version', c => { c.normative_authority_registry.rows[0].local_schema_version = 'stale' }],
  ['registry wrong local ref', c => { c.normative_authority_registry.rows[0].local_schema_ref = 'authority_operation_replay_derivation' }],
  ['same version drift', c => { c.authority_collision_response_schema.extra = 'unversioned' }],
  ['visible expansion', c => { c.visible_surface_changes.push('selector') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR36); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`R36 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R36 and ${mutations.length} mutation probes verified`)
console.log(`r36_machine_sha256=${sha(machinePath)}`)
