import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR34 } from './materialize-ctrl-g24-trusted-ingress-r34.mjs'
import { materializedR35, materializedR35Output } from './materialize-ctrl-g24-trusted-ingress-r35.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r35.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const edge = (edges, from, to) => edges.some(item => same(item, [from, to]))
function ok(message, value) { if (!value) throw new Error(message) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function graphCycle(nodes, edges) { const next = new Map(nodes.map(node => [node, []])); for (const [from, to] of edges) { if (!next.has(from) || !next.has(to)) return true; next.get(from).push(to) } const visiting = new Set(), done = new Set(); function visit(node) { if (visiting.has(node)) return true; if (done.has(node)) return false; visiting.add(node); for (const target of next.get(node)) if (visit(target)) return true; visiting.delete(node); done.add(node); return false } return nodes.some(visit) }
function ancestors(node, rules, seen = new Set()) { for (const dep of rules[node].depends_on) if (!seen.has(dep)) { seen.add(dep); ancestors(dep, rules, seen) } return seen }
function sameVersionDrift(before, after, path = '$', out = []) { if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return out; if (!Array.isArray(before) && !Array.isArray(after) && before.schema_version && after.schema_version && !same(before, after) && before.schema_version === after.schema_version) out.push(path); if (!Array.isArray(before) && !Array.isArray(after)) for (const key of Object.keys(before)) if (Object.hasOwn(after, key)) sameVersionDrift(before[key], after[key], `${path}.${key}`, out); return out }

const expectedParent = { commit: '45ba363f08324240f311bba2610e9ad93c640624', tree: '595874408a4a143bc5e09743652470d0f10d4211', human_blob: 'b22f1a67b26887c24d949b68f5f2de352752ca4a', machine_blob: 'd5ac663afdaad34064855423ea674aff6e40976a', qa_blob: '4ac59a24d6ad6f9594660c4e97eb7e147e79af26', checker_blob: '2facfea73d44d4edb27d0866336d5846c0639eba', materializer_blob: '8f82687e9ab571c1125556b00be76930ae08fa62', founder_checker_blob: 'c7de3e0cb6f6334a6e31378c28999e87542c12a0', adjudication: 'veto' }
const expectedBranches = ['committed', 'ordinary_held', 'session_held']

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn() } catch (error) { out.push(`${name}: ${error.message}`) } }
  test('identity and closed boundary', () => { ok('R35', contract.schema_version === 'ctrl.g24.trusted-ingress.r35.effective.v1'); ok('parent', same(contract.supersedes, expectedParent)); ok('parent SHA', contract.materialization.frozen_input.sha256 === 'd69744b686f24877debaa4988102039010a092fa6a1ac9bfdc43d005d410bdcc'); ok('closed', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, [])) })
  test('one normative historical response binding authority', () => {
    ok('legacy removed', !Object.hasOwn(contract, 'authority_operation_historical_response_field_bindings'))
    const authority = contract.authority_operation_historical_response_binding_authority
    ok('R35 authority', authority?.schema_version === 'ctrl.g24.authority-operation-historical-response-binding-authority.r35.v1' && authority.normative && authority.sole_active_authority)
    const active = Object.entries(contract).filter(([key, value]) => key.includes('historical_response') && key.includes('binding') && value?.normative !== false)
    ok(`single active authority:${active.map(([key]) => key).join(',')}`, active.length === 1 && active[0][0] === 'authority_operation_historical_response_binding_authority')
    const expected = [
      ['operation_name', 'selected_result', 'operation_name'], ['operation_id', 'selected_result', 'operation_id'], ['result_branch', 'selected_result', 'branch'],
      ['response_schema_ref', 'selected_matrix_row', 'response_schema_ref'], ['response_schema_version', 'selected_matrix_row', 'response_schema_version'],
      ['response_payload_ref', 'selected_result_artifact', 'artifact_ref'], ['response_payload_bytes_sha256', 'selected_result_artifact', 'canonical_bytes_sha256'],
      ['result_ref', 'selected_result_artifact', 'artifact_ref'], ['result_bytes_sha256', 'selected_result_artifact', 'canonical_bytes_sha256'], ['result_fingerprint', 'selected_result', 'result_fingerprint'],
    ]
    ok('complete exact bindings', same(authority.bindings.map(row => [row.local_field, row.source_kind, row.source_field]), expected) && authority.bindings.every(row => row.equality === 'exact'))
    ok('all 90 result schemas', authority.selected_result_schema_refs.length === 90 && new Set(authority.selected_result_schema_refs).size === 90 && authority.selected_result_schema_refs.every(ref => resolvePath(contract, ref)))
    const history = contract.authority_operation_historical_response_schema
    ok('history R35', history.schema_version.includes('.r35.') && history.fingerprint_ref.endsWith('r35'))
    ok('history result bytes exact', history.properties.result_bytes_sha256?.type === 'sha256' && authority.bindings.some(row => row.local_field === 'result_bytes_sha256' && row.source_field === 'canonical_bytes_sha256'))
    ok('registry refers sole authority', contract.authority_operation_replay_registry_authority.historical_response_binding_authority_ref === 'authority_operation_historical_response_binding_authority' && !contract.authority_operation_replay_registry_authority.historical_response_equalities)
  })
  test('three branch rule sets and graphs are exact and closed', () => {
    const derivation = contract.authority_operation_identity_derivation_rules, graph = contract.authority_operation_identity_dependency_graph
    ok('discriminators', derivation.type === 'discriminated_branch_dependency_rules' && graph.type === 'discriminated_branch_dependency_graph' && same(derivation.exact_variants, expectedBranches) && same(graph.exact_variants, expectedBranches))
    ok('singular rules absent', !derivation.rules && !graph.nodes && !graph.edges && graph.hidden_filtered_edges === 'forbidden')
    for (const branch of expectedBranches) {
      const rules = derivation.variants[branch].rules, selected = graph.variants[branch]
      const nodes = Object.keys(rules), edges = Object.entries(rules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target]))
      ok(`${branch} exact nodes`, same(selected.nodes, nodes)); ok(`${branch} exact edges`, same(selected.edges, edges)); ok(`${branch} acyclic`, !graphCycle(nodes, edges)); ok(`${branch} direct generation`, selected.generated_only_from.endsWith(`${branch}.rules.*.depends_on`) && selected.filtered_edge_construction === 'forbidden')
      for (const [name, rule] of Object.entries(rules)) { rule.depends_on.forEach(dep => ok(`${branch}.${name} dependency ${dep}`, rules[dep])); rule.source_refs.forEach(ref => ok(`${branch}.${name} source ${ref}`, resolvePath(contract, ref) !== undefined)); const transitive = ancestors(name, rules); transitive.forEach(dep => ok(`${branch}.${name} transitive ${dep}`, nodes.includes(dep))) }
      const dagName = branch === 'committed' ? 'authority_operation_committed_issuance_dag' : `authority_operation_${branch}_issuance_dag`
      const dag = contract[dagName]
      ok(`${branch} DAG exact`, same(dag.nodes, nodes) && same(dag.edges, edges) && dag.generated_directly_from_selected_branch_rules && dag.unavailable_nodes_or_filtered_edges === 'forbidden' && !graphCycle(dag.nodes, dag.edges))
    }
  })
  test('branch-specific dependencies exclude unavailable identities', () => {
    const variants = contract.authority_operation_identity_derivation_rules.variants
    const committed = variants.committed.rules, ordinary = variants.ordinary_held.rules, session = variants.session_held.rules
    ok('committed excludes holds', !committed.hold_row_ref && !committed.final_hold_fingerprint && !committed.session_hold_evidence_fingerprint && same(committed.result_fingerprint.depends_on, ['receipt_precommit_fingerprint']))
    ok('committed registry only receipt and history', same(committed.registry_row_ref.depends_on, ['historical_response_artifact_ref', 'final_receipt_fingerprint']) && same(committed.registry_fingerprint.depends_on, ['registry_row_ref', 'historical_response_artifact_ref', 'final_receipt_fingerprint']))
    ok('ordinary excludes receipts and session evidence', !ordinary.receipt_precommit_fingerprint && !ordinary.final_receipt_fingerprint && !ordinary.session_hold_evidence_fingerprint && same(ordinary.hold_row_ref.depends_on, ['validated_precommit_material']) && same(ordinary.result_fingerprint.depends_on, ['hold_row_ref']))
    ok('ordinary registry only hold and history', same(ordinary.registry_row_ref.depends_on, ['historical_response_artifact_ref', 'final_hold_fingerprint']) && same(ordinary.registry_fingerprint.depends_on, ['registry_row_ref', 'historical_response_artifact_ref', 'final_hold_fingerprint']))
    ok('session evidence before hold', edge(contract.authority_operation_identity_dependency_graph.variants.session_held.edges, 'session_hold_evidence_fingerprint', 'hold_row_ref') && same(session.result_fingerprint.depends_on, ['hold_row_ref']))
    ok('session excludes receipt', !session.receipt_precommit_fingerprint && !session.final_receipt_fingerprint)
    ok('old hold DAG removed', !Object.hasOwn(contract, 'authority_operation_hold_issuance_dag'))
  })
  test('replay branch map follows exact original branch DAG and source order', () => {
    const map = contract.authority_operation_replay_branch_map, derivation = contract.authority_operation_replay_derivation
    ok('three replay variants', same(map.exact_variants, expectedBranches) && same(Object.keys(map.variants), expectedBranches))
    const expectations = { committed: ['authority_operation_committed_issuance_dag', 'resolve_exact_committed_registry_row'], ordinary_held: ['authority_operation_ordinary_held_issuance_dag', 'resolve_exact_held_registry_row'], session_held: ['authority_operation_session_held_issuance_dag', 'resolve_exact_held_registry_row'] }
    for (const branch of expectedBranches) {
      const variant = map.variants[branch], [dag, first] = expectations[branch], path = variant.replay_path
      ok(`${branch} DAG`, variant.original_issuance_dag_ref === dag); ok(`${branch} first`, path[0] === first)
      const registryAt = 0, resultAt = path.indexOf('resolve_exact_result_artifact'), historyAt = path.indexOf('resolve_exact_historical_response_artifact')
      ok(`${branch} result between authority and history`, resultAt > registryAt && historyAt > resultAt)
      if (branch !== 'committed') ok(`${branch} hold before result`, path.indexOf('resolve_exact_hold_row') >= 0 && path.indexOf('resolve_exact_hold_row') < resultAt)
      if (branch === 'ordinary_held') ok('ordinary has no session evidence', !path.includes('resolve_exact_session_hold_evidence'))
      if (branch === 'session_held') ok('session evidence resolved from hold lineage', path.indexOf('resolve_exact_session_hold_evidence') > path.indexOf('resolve_exact_hold_row') && path.indexOf('resolve_exact_session_hold_evidence') < resultAt)
      ok(`${branch} return last`, path.at(-1) === 'return_exact_original_response')
    }
    ok('source precedence exact', same(map.source_precedence, ['authoritative_registry', 'authoritative_hold_when_held', 'session_evidence_when_session_held', 'selected_result_artifact', 'historical_response_artifact', 'replay_payload_artifact', 'replay_envelope_artifact']))
    ok('anti splice exact', map.anti_splice.includes('same_original_registry_lineage') && contract.authority_operation_replay_registry_authority.abc_splice_rule === map.anti_splice)
    ok('derivation exact', derivation.replay_branch_map_ref === 'authority_operation_replay_branch_map' && derivation.resolve_exact_result_artifact_before_history && derivation.exact_original_branch_dag_required && same(derivation.replay_write_set, []))
  })
  test('R34 strengths and version discipline survive', () => {
    let total = 0
    for (const operation of Object.values(contract.case_session_authority_operation_protocols.operations)) for (const schema of Object.values(operation.result_schema.variants)) { total += 1; ok('result_ref absent', !schema.properties.result_ref && !schema.exact_keys.includes('result_ref')) }
    ok('90 results', total === 90)
    ok('binding coverage', contract.authority_operation_result_artifact_binding_coverage.rows.length === 90 && contract.authority_operation_result_artifact_binding_coverage.rows.every(row => row.historical_response_fields.result_bytes_sha256 === 'canonical_bytes_sha256'))
    ok('transaction refs', contract.authority_operation_serializable_branch_transaction.committed_issuance_dag_ref === 'authority_operation_committed_issuance_dag' && contract.authority_operation_serializable_branch_transaction.ordinary_held_issuance_dag_ref === 'authority_operation_ordinary_held_issuance_dag' && contract.authority_operation_serializable_branch_transaction.session_held_issuance_dag_ref === 'authority_operation_session_held_issuance_dag' && !contract.authority_operation_serializable_branch_transaction.hold_issuance_dag_ref)
    const drift = sameVersionDrift(materializedR34, contract); ok(`same-version:${drift.join(',')}`, drift.length === 0)
    ok('manifest', contract.schema_change_manifest.every_changed_or_new_semantic_object_has_r35_identifier && same(contract.schema_change_manifest.exact_branch_classes, expectedBranches))
  })
  return out
}

if (read(machinePath) !== materializedR35Output) failures.push('machine differs from exact materializer')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r34.json') !== 'd69744b686f24877debaa4988102039010a092fa6a1ac9bfdc43d005d410bdcc') failures.push('frozen R34 changed')
failures.push(...collect(materializedR35))
const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['legacy binding restored', c => { c.authority_operation_historical_response_field_bindings = { schema_version: 'ctrl.g24.legacy.r32.v1', normative: true } }],
  ['duplicate binding authority', c => { c.another_historical_response_binding = { schema_version: 'ctrl.g24.duplicate.r35.v1', normative: true } }],
  ['missing result bytes binding', c => { c.authority_operation_historical_response_binding_authority.bindings = c.authority_operation_historical_response_binding_authority.bindings.filter(row => row.local_field !== 'result_bytes_sha256') }],
  ['result bytes wrong source', c => { c.authority_operation_historical_response_binding_authority.bindings.find(row => row.local_field === 'result_bytes_sha256').source_field = 'artifact_ref' }],
  ['singular wrong graph', c => { c.authority_operation_identity_dependency_graph.nodes = [] }],
  ['missing graph variant', c => { delete c.authority_operation_identity_dependency_graph.variants.ordinary_held }],
  ['filtered edge hidden', c => { c.authority_operation_identity_dependency_graph.variants.committed.edges.pop() }],
  ['reverse graph edge', c => { c.authority_operation_identity_derivation_rules.variants.committed.rules.result_fingerprint.depends_on.push('result_artifact_ref') }],
  ['committed depends hold', c => { c.authority_operation_identity_derivation_rules.variants.committed.rules.result_fingerprint.depends_on = ['hold_row_ref'] }],
  ['held depends receipt', c => { c.authority_operation_identity_derivation_rules.variants.ordinary_held.rules.result_fingerprint.depends_on = ['receipt_precommit_fingerprint'] }],
  ['ordinary requires session evidence', c => { c.authority_operation_identity_derivation_rules.variants.ordinary_held.rules.hold_row_ref.depends_on.push('session_hold_evidence_fingerprint') }],
  ['committed registry requires final hold', c => { c.authority_operation_identity_derivation_rules.variants.committed.rules.registry_fingerprint.depends_on.push('final_hold_fingerprint') }],
  ['held registry requires final receipt', c => { c.authority_operation_identity_derivation_rules.variants.session_held.rules.registry_fingerprint.depends_on.push('final_receipt_fingerprint') }],
  ['committed DAG missing edge', c => { c.authority_operation_committed_issuance_dag.edges.pop() }],
  ['ordinary DAG adds session node', c => { c.authority_operation_ordinary_held_issuance_dag.nodes.push('session_hold_evidence_fingerprint') }],
  ['replay missing result resolution', c => { c.authority_operation_replay_branch_map.variants.committed.replay_path = c.authority_operation_replay_branch_map.variants.committed.replay_path.filter(node => node !== 'resolve_exact_result_artifact') }],
  ['replay result after history', c => { const p = c.authority_operation_replay_branch_map.variants.ordinary_held.replay_path; const a = p.indexOf('resolve_exact_result_artifact'), b = p.indexOf('resolve_exact_historical_response_artifact'); [p[a], p[b]] = [p[b], p[a]] }],
  ['ordinary replay session evidence', c => { c.authority_operation_replay_branch_map.variants.ordinary_held.replay_path.splice(1, 0, 'resolve_exact_session_hold_evidence') }],
  ['source precedence deleted', c => { c.authority_operation_replay_branch_map.source_precedence = [] }],
  ['anti splice deleted', c => { c.authority_operation_replay_branch_map.anti_splice = '' }],
  ['same version drift', c => { c.authority_collision_response_schema.extra = 'unversioned' }],
  ['visible expansion', c => { c.visible_surface_changes.push('receipt') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR35); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`R35 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R35 and ${mutations.length} mutation probes verified`)
console.log(`r35_machine_sha256=${sha(machinePath)}`)
