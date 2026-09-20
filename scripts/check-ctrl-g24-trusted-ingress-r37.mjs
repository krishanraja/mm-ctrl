import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR36 } from './materialize-ctrl-g24-trusted-ingress-r36.mjs'
import { materializedR37, materializedR37Output } from './materialize-ctrl-g24-trusted-ingress-r37.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r37.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const shaFile = path => createHash('sha256').update(read(path)).digest('hex')
const shaValue = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function ok(message, value) { if (!value) throw new Error(message) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function closed(schema) { return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, Object.keys(schema.properties)) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))) }
function graphCycle(nodes, edges) { const next = new Map(nodes.map(node => [node, []])); for (const [from, to] of edges) { if (!next.has(from) || !next.has(to)) return true; next.get(from).push(to) } const visiting = new Set(), done = new Set(); function visit(node) { if (visiting.has(node)) return true; if (done.has(node)) return false; visiting.add(node); for (const target of next.get(node)) if (visit(target)) return true; visiting.delete(node); done.add(node); return false } return nodes.some(visit) }
function sameVersionDrift(before, after, path = '$', out = []) { if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return out; if (!Array.isArray(before) && !Array.isArray(after) && before.schema_version && after.schema_version && !same(before, after) && before.schema_version === after.schema_version) out.push(path); if (!Array.isArray(before) && !Array.isArray(after)) for (const key of Object.keys(before)) if (Object.hasOwn(after, key)) sameVersionDrift(before[key], after[key], `${path}.${key}`, out); return out }
function authorityPaths(value, path = '$', out = []) { if (!value || typeof value !== 'object') return out; if (!Array.isArray(value) && (value.normative === true || value.authority_marker !== undefined || value.sole_active_authority === true)) out.push(path); for (const [key, item] of Object.entries(value)) authorityPaths(item, `${path}.${key}`, out); return out }

const expectedParent = { commit: 'd7a1790536756e2c12b4841b1edebf19d8b3b7bc', tree: 'b5ca1bcc6238d809cf0b01c17a7b032a9f42c70b', human_blob: '82d725fb2804d77e9566f92e822d4d3b121599a2', machine_blob: 'f6331799468babc833ca6bfdb5f21e656826a3d1', qa_blob: 'b437d96aa7fd3bff0246ec1315b5adad80bbc2a0', checker_blob: '0c27d2f9da67b773c2afe3161bb53560117fce01', materializer_blob: '66783bbf155199e1294a540992df1d61915aa2fe', founder_checker_blob: 'cb29630aab8de27768467a93c3e8a5685d1ed66f', adjudication: 'veto' }
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const verifiedBranches = ['stale_head_hold', 'invalid_target_hold']
const rawBranches = ['authorization_hold', 'invalid_proof_hold', 'internal_failure_hold']
const sessionOperations = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']
const branchClasses = ['committed', 'ordinary_held', 'session_verified_consuming', 'session_raw_nonconsuming']
const persistedFields = ['fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']
const expectedAuthorityRows = [
  ['authority_operation_historical_response_binding_authority', 'ctrl.g24.authority-operation-historical-response-binding-authority.r37.v1', 'authority_operation_historical_response_schema', 'ctrl.g24.authority-operation-historical-response.r35.v1', '594952e87e81e0455b2869d6df01ab1400fda4eded31fa2e3847cfcaf8d52a4b'],
  ['authority_operation_fresh_branch_class_selection', 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1', 'case_session_authority_operation_protocols', 'ctrl.g24.case-session-authority-operation-protocols.r34.v1', '61155cc58d785a3687cb376fb601b2ba06a7fb003d82a6edef2037aca121522d'],
  ['authority_operation_identity_derivation_rules', 'ctrl.g24.authority-operation-identity-derivation-rules.r37.v1', 'authority_operation_identity_dependency_graph', 'ctrl.g24.authority-operation-identity-dependency-graph.r37.v1', 'b7793e73774a742464c784d87b459f9196019817680350fe4fe04a7f801bfc76'],
  ['authority_operation_replay_classifier', 'ctrl.g24.authority-operation-replay-classifier.r37.v1', 'authority_operation_replay_branch_map', 'ctrl.g24.authority-operation-replay-branch-map.r37.v1', '5348926c16f7187c29f0bdcda5b547a8bb83bfcf762a64d4e84b714636bf7dd3'],
  ['authority_operation_replay_branch_map', 'ctrl.g24.authority-operation-replay-branch-map.r37.v1', 'authority_operation_replay_derivation', 'ctrl.g24.authority-operation-replay-derivation.r37.v1', '589e2567dfa9a2963391773159e0bdc2e7c5be6ae0a0896d8f1cefca6fb0b465'],
]

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn() } catch (error) { out.push(`${name}: ${error.message}`) } }
  const operations = contract.case_session_authority_operation_protocols.operations
  test('identity and closed boundary', () => { ok('R37', contract.schema_version === 'ctrl.g24.trusted-ingress.r37.effective.v1'); ok('parent', same(contract.supersedes, expectedParent)); ok('parent SHA', contract.materialization.frozen_input.sha256 === 'dda6415555de50b7cb960f2cc2b809f50e9a55b91eb0e14c62d3920e4a6c2c4f'); ok('closed', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, [])) })
  test('fresh selector is closed exhaustive and splits session evidence', () => {
    const selector = contract.authority_operation_fresh_branch_class_selection
    ok('closed selector row', closed(selector.row_schema) && same(selector.row_schema.exact_keys, ['selection_row_id', 'operation_name', 'proof_family', 'result_branch', 'branch_class', 'evidence_kind', 'result_schema_ref', 'hold_schema_ref', 'session_evidence_schema_ref', 'issuance_dag_ref', 'selector_schema_version']))
    ok('no caller or fallback', same(selector.row_schema.caller_writable_fields, []) && selector.row_schema.fallback_or_default === 'forbidden' && selector.selection_semantics.caller_override === 'forbidden')
    ok('selector source semantics exact', same(selector.row_schema.source_semantics, { operation_name: 'closed_operation_registry_key', proof_family: 'closed_operation_proof_authority', result_branch: 'selected_result_union_branch', branch_class: 'exact_branch_plan', evidence_kind: 'exact_branch_evidence_plan', result_schema_ref: 'exact_operation_result_variant', hold_schema_ref: 'exact_hold_variant_or_UNAVAILABLE', session_evidence_schema_ref: 'exact_evidence_variant_or_UNAVAILABLE', issuance_dag_ref: 'exact_branch_DAG' }))
    ok('counts', selector.rows.length === 90 && selector.exact_committed_rows === 15 && selector.exact_ordinary_held_rows === 60 && selector.exact_session_verified_consuming_rows === 6 && selector.exact_session_raw_nonconsuming_rows === 9)
    const seen = new Set()
    for (const row of selector.rows) {
      ok('row exact keys', same(Object.keys(row), selector.row_schema.exact_keys)); ok('unique row', !seen.has(row.selection_row_id)); seen.add(row.selection_row_id)
      const session = sessionOperations.includes(row.operation_name)
      ok('result schema', row.result_schema_ref === `case_session_authority_operation_protocols.operations.${row.operation_name}.result_schema.variants.${row.result_branch}` && resolvePath(contract, row.result_schema_ref))
      if (row.result_branch === 'committed') ok('committed row', row.branch_class === 'committed' && row.evidence_kind === 'committed_precommit' && row.hold_schema_ref === 'UNAVAILABLE' && row.session_evidence_schema_ref === 'UNAVAILABLE' && row.issuance_dag_ref === 'authority_operation_committed_issuance_dag')
      else if (!session) ok('ordinary row', row.branch_class === 'ordinary_held' && row.evidence_kind === 'ordinary_hold_precommit' && row.session_evidence_schema_ref === 'UNAVAILABLE' && row.issuance_dag_ref === 'authority_operation_ordinary_held_issuance_dag')
      else if (verifiedBranches.includes(row.result_branch)) ok('verified session row', row.branch_class === 'session_verified_consuming' && row.evidence_kind === 'verified_session_hold_evidence' && row.session_evidence_schema_ref === 'session_hold_evidence_schema.variants.verified_consuming' && row.issuance_dag_ref === 'authority_operation_session_verified_consuming_issuance_dag')
      else ok('raw session row', rawBranches.includes(row.result_branch) && row.branch_class === 'session_raw_nonconsuming' && row.evidence_kind === 'raw_session_hold_evidence' && row.session_evidence_schema_ref === 'session_hold_evidence_schema.variants.raw_non_consuming' && row.issuance_dag_ref === 'authority_operation_session_raw_nonconsuming_issuance_dag')
      ok('row identity exact', row.selection_row_id === `${row.operation_name}|${row.proof_family}|${row.result_branch}|r37` && row.selector_schema_version === selector.schema_version)
    }
  })
  test('verified and raw session roots and effects are disjoint', () => {
    const variants = contract.authority_operation_identity_derivation_rules.variants
    ok('four variants', same(contract.authority_operation_identity_derivation_rules.exact_variants, branchClasses) && same(Object.keys(variants), branchClasses))
    const verified = variants.session_verified_consuming, raw = variants.session_raw_nonconsuming
    ok('verified required', same(verified.required_sources, ['session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'proof_nonce_ledger', 'proof_nonce_receipt_store']) && verified.rules.session_verified_material.source_refs.includes('proof_nonce_ledger') && verified.rules.session_hold_evidence_fingerprint.source_refs[0].endsWith('verified_consuming'))
    ok('verified raw forbidden', verified.forbidden_unavailable_sources.includes('authority_opaque_raw_input_stores'))
    ok('raw required', same(raw.required_sources, ['authority_opaque_raw_input_stores', 'session_hold_evidence_schema.variants.raw_non_consuming']) && raw.rules.session_raw_material.source_refs.includes('authority_opaque_raw_input_stores') && raw.rules.session_hold_evidence_fingerprint.source_refs[0].endsWith('raw_non_consuming'))
    ok('verified source semantics exact', same(verified.rules.session_verified_material.source_semantics, ['verified_dual_proofs', 'bundle_truth_projection', 'exact_authority_read_set', 'exact_two_nonce_rows_and_receipts', 'selected_partition_head', 'validated_or_bounded_raw_target']))
    ok('raw source semantics exact', same(raw.rules.session_raw_material.source_semantics, ['bounded_raw_target', 'bounded_raw_issuer_and_evaluator_proof_slots_or_bundle', 'raw_non_consuming_evidence']))
    for (const forbidden of ['session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'proof_nonce_ledger', 'proof_nonce_receipt_store']) ok(`raw forbids ${forbidden}`, raw.forbidden_unavailable_sources.includes(forbidden) && !raw.rules.session_raw_material.source_refs.includes(forbidden))
    const effects = contract.authority_operation_serializable_branch_transaction.session_branch_effects
    ok('verified effects', same(effects.session_verified_consuming.result_branches, verifiedBranches) && effects.session_verified_consuming.nonce_rows === 2 && effects.session_verified_consuming.authority_read_set === 'required' && effects.session_verified_consuming.truth_projection === 'required')
    ok('raw effects', same(effects.session_raw_nonconsuming.result_branches, rawBranches) && effects.session_raw_nonconsuming.nonce_rows === 0 && effects.session_raw_nonconsuming.authority_read_set === 'forbidden' && effects.session_raw_nonconsuming.truth_projection === 'forbidden')
    ok('transaction binding exact', same(contract.authority_operation_serializable_branch_transaction.selected_branch_row_identity_fields, contract.authority_operation_fresh_branch_class_selection.row_schema.exact_keys) && contract.authority_operation_serializable_branch_transaction.atomicity === 'select_exact_closed_R37_row_persist_selection_identity_execute_only_exact_branch_sources_and_DAG_then_commit_all_or_none')
    for (const branch of branchClasses) { const rules = variants[branch].rules, graph = contract.authority_operation_identity_dependency_graph.variants[branch], edges = Object.entries(rules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target])); ok(`${branch} graph`, same(graph.nodes, Object.keys(rules)) && same(graph.edges, edges) && !graphCycle(graph.nodes, graph.edges)); for (const rule of Object.values(rules)) { rule.source_refs.forEach(ref => ok(`${branch} source ${ref}`, resolvePath(contract, ref))); rule.depends_on.forEach(dep => ok(`${branch} dep ${dep}`, rules[dep])) } const dag = contract[branch === 'committed' ? 'authority_operation_committed_issuance_dag' : `authority_operation_${branch}_issuance_dag`]; ok(`${branch} DAG`, dag?.branch_class === branch && same(dag.nodes, graph.nodes) && same(dag.edges, graph.edges)) }
    ok('old session DAG gone', !contract.authority_operation_session_held_issuance_dag)
  })
  test('selection identity is persisted and fingerprinted', () => {
    const committed = contract.authority_operation_registry.row_union.variants.original_committed, held = contract.authority_operation_registry.row_union.variants.original_persisted_hold
    for (const [name, schema] of [['committed registry', committed], ['held registry', held], ...Object.entries(contract.authority_operation_hold_store.row_union.variants)]) {
      ok(`${name} closed`, closed(schema) && schema.schema_version.includes('.r37.'))
      persistedFields.forEach(field => ok(`${name} ${field}`, schema.properties[field] && schema.exact_keys.includes(field) && schema.required.includes(field)))
      ok(`${name} selector version`, schema.properties.fresh_selection_schema_version.const === 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1')
      const fpSchema = resolvePath(contract, schema.fingerprint_ref), fingerprintField = name.includes('registry') ? 'registry_fingerprint' : 'hold_fingerprint'
      ok(`${name} fingerprint`, fpSchema?.schema_version.includes('.r37.') && same(fpSchema.preimage_order.slice(1), schema.exact_keys.filter(key => key !== fingerprintField)) && persistedFields.every(field => fpSchema.preimage_order.includes(field)))
    }
    ok('registry selector exact', committed.exact_equalities.includes('persisted_selection_fields_equal_exact_selected_R37_row_and_are_never_reinterpreted') && held.exact_equalities.includes('persisted_selection_fields_equal_exact_selected_R37_row_and_exact_hold_row'))
  })
  test('control records are closed and exact', () => {
    const selector = contract.authority_operation_fresh_branch_class_selection, replay = contract.authority_operation_replay_classifier, manifest = contract.normative_authority_frozen_manifest
    ok('closed rows', closed(selector.row_schema) && closed(replay.row_schema) && closed(manifest.row_schema))
    selector.rows.forEach(row => ok('selector exact row', same(Object.keys(row), selector.row_schema.exact_keys)))
    replay.rows.forEach(row => ok('replay exact row', same(Object.keys(row), replay.row_schema.exact_keys)))
    manifest.rows.forEach(row => ok('manifest exact row', same(Object.keys(row), manifest.row_schema.exact_keys)))
    ok('no caller fields', same(selector.row_schema.caller_writable_fields, []) && same(replay.row_schema.caller_writable_fields, []) && same(manifest.row_schema.caller_writable_fields, []))
    ok('exact source semantics', typeof selector.row_schema.source_semantics === 'object' && replay.row_schema.source_semantics === 'all_branch_identity_fields_come_from_exact_original_registry_R37_fields_never_current_selector_reinterpretation' && manifest.row_schema.source_semantics === 'checker_pinned_exact_path_schema_local_schema_version_and_object_hash')
  })
  test('replay reads durable classification and exact registry-first paths', () => {
    const replay = contract.authority_operation_replay_classifier, map = contract.authority_operation_replay_branch_map, derivation = contract.authority_operation_replay_derivation, selector = contract.authority_operation_fresh_branch_class_selection
    ok('90 replay rows', replay.rows.length === 90 && replay.exact_expected_rows === 90 && replay.registry_first && replay.current_selector_lookup === 'forbidden')
    for (let index = 0; index < replay.rows.length; index += 1) {
      const row = replay.rows[index], fresh = selector.rows[index]
      ok('classifier exact sources', row.persisted_selection_row_id_source === 'selected_original_registry.fresh_selection_row_id' && row.persisted_proof_family_source === 'selected_original_registry.proof_family' && row.persisted_branch_class_source === 'selected_original_registry.branch_class' && row.persisted_evidence_kind_source === 'selected_original_registry.evidence_kind' && row.persisted_selector_version_source === 'selected_original_registry.fresh_selection_schema_version')
      ok('classifier parity', row.operation_name === fresh.operation_name && row.result_branch === fresh.result_branch && row.expected_proof_family === fresh.proof_family && row.expected_branch_class === fresh.branch_class && row.expected_evidence_kind === fresh.evidence_kind && row.expected_selector_version === fresh.selector_schema_version && row.held_registry_hold_schema_ref === fresh.hold_schema_ref && row.session_evidence_schema_ref === fresh.session_evidence_schema_ref && row.original_issuance_dag_ref === fresh.issuance_dag_ref)
      ok('path ref', row.replay_path_ref === `authority_operation_replay_branch_map.variants.${row.expected_branch_class}.replay_path` && resolvePath(contract, row.replay_path_ref))
    }
    ok('four exact paths', same(map.exact_variants, branchClasses) && same(Object.keys(map.variants), branchClasses) && map.current_selector_table_reinterpretation === 'forbidden')
    for (const [branch, variant] of Object.entries(map.variants)) { const path = variant.replay_path; ok(`${branch} first`, path[0] === variant.exact_first_authority && path[0] === (branch === 'committed' ? 'resolve_exact_committed_registry_row' : 'resolve_exact_held_registry_row')); ok(`${branch} unique`, new Set(path).size === path.length); const result = path.indexOf('resolve_exact_result_artifact'), history = path.indexOf('resolve_exact_historical_response_artifact'), payload = path.indexOf('resolve_exact_replay_payload_artifact'), envelope = path.indexOf('resolve_exact_replay_envelope_artifact'); ok(`${branch} order`, result > 0 && result < history && history < payload && payload < envelope && envelope < path.indexOf('return_exact_original_response')); ok(`${branch} vocabulary`, path.every(token => derivation.exact_path_vocabulary.includes(token))) }
    ok('source precedence', same(map.source_precedence, ['exact_original_registry', 'exact_hold_row_when_held', 'exact_session_evidence_when_session_held', 'selected_result_artifact', 'historical_response_artifact', 'replay_payload_artifact', 'replay_envelope_artifact']))
    ok('anti splice', map.anti_splice === 'all_operation_branch_selection_hold_evidence_result_history_payload_and_envelope_fields_must_share_one_original_registry_lineage')
    ok('derivation refs', derivation.replay_classifier_ref === 'authority_operation_replay_classifier' && derivation.replay_branch_map_ref === 'authority_operation_replay_branch_map' && derivation.source_precedence_ref === 'authority_operation_replay_branch_map.source_precedence' && derivation.anti_splice_ref === 'authority_operation_replay_branch_map.anti_splice' && derivation.registry_authority_first && derivation.current_selector_reinterpretation === 'forbidden')
  })
  test('independent authority manifest is exact and recursively complete', () => {
    const manifest = contract.normative_authority_frozen_manifest
    ok('old registry removed', !contract.normative_authority_registry)
    ok('manifest root', manifest.type === 'independently_declared_frozen_authority_manifest' && manifest.expected_count_source === 'length_of_checker_pinned_exact_paths_not_candidate_flags_or_candidate_count')
    const actualRows = manifest.rows.map(row => [row.authority_path, row.authority_schema_version, row.local_schema_ref, row.local_schema_version, row.authority_object_sha256])
    ok('hardcoded exact manifest', same(actualRows, expectedAuthorityRows) && same(manifest.exact_paths, expectedAuthorityRows.map(row => row[0])))
    for (const row of manifest.rows) { const authority = resolvePath(contract, row.authority_path), local = resolvePath(contract, row.local_schema_ref); ok(`${row.authority_path} marker`, authority?.normative === true && authority.authority_marker === 'normative_control'); ok(`${row.authority_path} versions`, authority.schema_version === row.authority_schema_version && local?.schema_version === row.local_schema_version); ok(`${row.authority_path} hash`, shaValue(authority) === row.authority_object_sha256) }
    const scanned = authorityPaths(contract).filter(path => path !== '$.normative_authority_frozen_manifest').map(path => path.slice(2))
    ok(`recursive authority paths:${scanned.join(',')}`, same(scanned.sort(), [...manifest.exact_paths].sort()))
  })
  test('R36 strengths and version discipline survive', () => { ok('legacy history binding absent', !contract.authority_operation_historical_response_field_bindings); ok('result byte binding', contract.authority_operation_historical_response_binding_authority.bindings.some(row => row.local_field === 'result_bytes_sha256' && row.source_field === 'canonical_bytes_sha256')); ok('no singular graph', !contract.authority_operation_identity_dependency_graph.nodes && contract.authority_operation_identity_dependency_graph.hidden_filtered_edges === 'forbidden'); const drift = sameVersionDrift(materializedR36, contract); ok(`same-version:${drift.join(',')}`, drift.length === 0); ok('manifest', contract.schema_change_manifest.every_changed_or_new_semantic_object_has_r37_identifier) })
  return out
}

if (read(machinePath) !== materializedR37Output) failures.push('machine differs from exact materializer')
if (shaFile('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r36.json') !== 'dda6415555de50b7cb960f2cc2b809f50e9a55b91eb0e14c62d3920e4a6c2c4f') failures.push('frozen R36 changed')
failures.push(...collect(materializedR37))
const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['selector extra row field', c => { c.authority_operation_fresh_branch_class_selection.rows[0].extra = true }],
  ['selector caller override', c => { c.authority_operation_fresh_branch_class_selection.row_schema.caller_writable_fields = ['branch_class'] }],
  ['selector fallback', c => { c.authority_operation_fresh_branch_class_selection.selection_semantics.missing_duplicate_or_unknown = 'committed' }],
  ['selector source semantics drift', c => { c.authority_operation_fresh_branch_class_selection.row_schema.source_semantics.proof_family = 'caller' }],
  ['selector verified mapped raw', c => { c.authority_operation_fresh_branch_class_selection.rows.find(row => row.operation_name === 'issue_server_session_principal' && row.result_branch === 'stale_head_hold').branch_class = 'session_raw_nonconsuming' }],
  ['selector raw mapped verified', c => { c.authority_operation_fresh_branch_class_selection.rows.find(row => row.operation_name === 'issue_server_session_principal' && row.result_branch === 'invalid_proof_hold').branch_class = 'session_verified_consuming' }],
  ['verified root omits nonce', c => { c.authority_operation_identity_derivation_rules.variants.session_verified_consuming.rules.session_verified_material.source_refs = c.authority_operation_identity_derivation_rules.variants.session_verified_consuming.rules.session_verified_material.source_refs.filter(ref => ref !== 'proof_nonce_ledger') }],
  ['verified root accepts raw', c => { c.authority_operation_identity_derivation_rules.variants.session_verified_consuming.rules.session_verified_material.source_refs.push('authority_opaque_raw_input_stores') }],
  ['verified source semantics drift', c => { c.authority_operation_identity_derivation_rules.variants.session_verified_consuming.rules.session_verified_material.source_semantics[0] = 'raw' }],
  ['raw root accepts truth', c => { c.authority_operation_identity_derivation_rules.variants.session_raw_nonconsuming.rules.session_raw_material.source_refs.push('session_dual_proof_bundle_truth_projection_schema') }],
  ['raw source semantics drift', c => { c.authority_operation_identity_derivation_rules.variants.session_raw_nonconsuming.rules.session_raw_material.source_semantics[0] = 'verified' }],
  ['raw consumes nonce', c => { c.authority_operation_serializable_branch_transaction.session_branch_effects.session_raw_nonconsuming.nonce_rows = 2 }],
  ['transaction binding drift', c => { c.authority_operation_serializable_branch_transaction.selected_branch_row_identity_fields.pop() }],
  ['verified no read set', c => { c.authority_operation_serializable_branch_transaction.session_branch_effects.session_verified_consuming.authority_read_set = 'forbidden' }],
  ['graph edge hidden', c => { c.authority_operation_identity_dependency_graph.variants.session_verified_consuming.edges.pop() }],
  ['persisted registry field removed', c => { const s = c.authority_operation_registry.row_union.variants.original_persisted_hold; delete s.properties.branch_class; s.exact_keys = s.exact_keys.filter(k => k !== 'branch_class'); s.required = s.required.filter(k => k !== 'branch_class') }],
  ['persisted field absent from fingerprint', c => { c.fingerprint_schemas.authority_operation_registry_held_r37.preimage_order = c.fingerprint_schemas.authority_operation_registry_held_r37.preimage_order.filter(k => k !== 'evidence_kind') }],
  ['hold selection splice', c => { c.authority_operation_hold_store.row_union.variants.session_dual_proof.properties.fresh_selection_schema_version.const = 'r36' }],
  ['replay extra row field', c => { c.authority_operation_replay_classifier.rows[0].extra = true }],
  ['replay uses current selector', c => { c.authority_operation_replay_classifier.current_selector_lookup = 'allowed' }],
  ['replay source current selector', c => { c.authority_operation_replay_classifier.rows[0].persisted_branch_class_source = 'authority_operation_fresh_branch_class_selection.rows.branch_class' }],
  ['replay class splice', c => { c.authority_operation_replay_classifier.rows[1].expected_branch_class = 'committed' }],
  ['replay wrong first authority', c => { c.authority_operation_replay_branch_map.variants.ordinary_held.replay_path[0] = 'resolve_exact_hold_row' }],
  ['replay duplicate vocabulary', c => { c.authority_operation_replay_branch_map.variants.committed.replay_path.splice(2, 0, 'resolve_exact_result_artifact') }],
  ['replay envelope before payload', c => { const p = c.authority_operation_replay_branch_map.variants.session_raw_nonconsuming.replay_path, a = p.indexOf('resolve_exact_replay_payload_artifact'), b = p.indexOf('resolve_exact_replay_envelope_artifact'); [p[a], p[b]] = [p[b], p[a]] }],
  ['replay source precedence removed', c => { c.authority_operation_replay_branch_map.source_precedence = [] }],
  ['replay anti splice removed', c => { c.authority_operation_replay_branch_map.anti_splice = '' }],
  ['manifest row removed', c => { c.normative_authority_frozen_manifest.rows.pop() }],
  ['manifest candidate count', c => { c.normative_authority_frozen_manifest.expected_count_source = 'rows.length' }],
  ['manifest hash forged', c => { c.normative_authority_frozen_manifest.rows[0].authority_object_sha256 = '0'.repeat(64) }],
  ['manifest and authority co-mutated', c => { c.authority_operation_replay_branch_map.anti_splice = 'weak'; c.normative_authority_frozen_manifest.rows.find(row => row.authority_path === 'authority_operation_replay_branch_map').authority_object_sha256 = shaValue(c.authority_operation_replay_branch_map) }],
  ['nested unmanifested authority', c => { c.authority_operation_replay_derivation.hidden = { schema_version: 'ctrl.g24.hidden.r37.v1', normative: true } }],
  ['unmarked authority', c => { delete c.authority_operation_replay_classifier.authority_marker }],
  ['stale authority version', c => { c.normative_authority_frozen_manifest.rows[0].authority_schema_version = 'stale' }],
  ['same version drift', c => { c.authority_collision_response_schema.extra = 'unversioned' }],
  ['visible expansion', c => { c.visible_surface_changes.push('control') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR37); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`R37 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R37 and ${mutations.length} mutation probes verified`)
console.log(`r37_machine_sha256=${shaFile(machinePath)}`)
