import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR35 } from './materialize-ctrl-g24-trusted-ingress-r35.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r35.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r36.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r36 = structuredClone(materializedR35)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

r36.schema_version = 'ctrl.g24.trusted-ingress.r36.effective.v1'
r36.status = 'thirty_sixth_repair_candidate_under_independent_review'
r36.supersedes = { commit: '73eb2e505671247d1fdfc749ef7707eba64a9401', tree: '309c2540f6eaf5409fcd9419c4e70ea81221204b', human_blob: '9ed721ed509da0b3d94a27e6a752660d5fecbc89', machine_blob: 'd5edc9fd47849b308bc18a61ca7e24abf26ac365', qa_blob: '1442ca099dab556eb054c237c6ce5ea156b25741', checker_blob: '754a57126a9dbf5e4719b9f4f429954b1332fb46', materializer_blob: '34c9f4caf8a9b81b5705e914f84d7738faabdb74', founder_checker_blob: '1bc3f2f8682d67774c9f80721dd6525536289140', adjudication: 'veto' }
r36.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r36.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r36.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const sessionOperations = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
function proofFamily(operationName, operation) {
  if (sessionOperations.includes(operationName)) return 'dual_issuer_evaluator'
  if (operation.exact_authority_role === 'bootstrap') return 'root_bootstrap_2_of_2'
  if (operation.exact_authority_role === 'root_admin') return 'root_admin'
  if (operation.exact_authority_role === 'issuer') return 'issuer'
  throw new Error(`unknown proof family:${operationName}`)
}
const selectionRows = []
for (const [operationName, operation] of Object.entries(operations)) {
  const family = proofFamily(operationName, operation)
  selectionRows.push({ selection_row_id: `${operationName}|${family}|committed`, operation_name: operationName, proof_family: family, result_branch: 'committed', branch_class: 'committed', result_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.committed`, hold_schema_ref: 'UNAVAILABLE', session_evidence: 'forbidden', issuance_dag_ref: 'authority_operation_committed_issuance_dag' })
  for (const branch of heldBranches) {
    const session = sessionOperations.includes(operationName)
    selectionRows.push({ selection_row_id: `${operationName}|${family}|${branch}`, operation_name: operationName, proof_family: family, result_branch: branch, branch_class: session ? 'session_held' : 'ordinary_held', result_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, hold_schema_ref: session ? 'authority_operation_hold_store.row_union.variants.session_dual_proof' : 'authority_operation_hold_store.row_union.variants.ordinary_single_proof', session_evidence: session ? 'required' : 'forbidden', issuance_dag_ref: session ? 'authority_operation_session_held_issuance_dag' : 'authority_operation_ordinary_held_issuance_dag' })
  }
}
r36.authority_operation_fresh_branch_class_selection = { schema_version: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r36.v1', normative: true, local_schema_ref: 'case_session_authority_operation_protocols', local_schema_version: r36.case_session_authority_operation_protocols.schema_version, discriminator_order: ['operation_name', 'proof_family', 'result_branch'], unique_keys: [['operation_name', 'proof_family', 'result_branch'], ['selection_row_id']], selection_row_id_derivation: 'operation_name_pipe_proof_family_pipe_result_branch_exact_UTF8', exact_expected_rows: 90, exact_committed_rows: 15, exact_ordinary_held_rows: 60, exact_session_held_rows: 15, rows: selectionRows, selection: 'exactly_one_row_after_result_branch_selection_before_any_branch_identity_or_write', transaction_row_binding: 'selected_selection_row_id_and_all_row_fields_are_bound_in_the_serializable_transaction_and_every_branch_derivation', no_default_or_fallback_class: true }

const rules = r36.authority_operation_identity_derivation_rules.variants
const committedRoot = {
  kind: 'validated_branch_input_set',
  source_refs: ['authority_operation_receipt_precommit_identity_plans', 'case_session_authority_operation_protocols', 'authority_proof_verification', 'case_session_authority_read_set_schema', 'authority_partition_head_store'],
  source_semantics: ['server_issued_receipt_precommit_identity', 'validated_target_intent', 'validated_exact_proof_or_dual_bundle', 'selected_authority_read_set', 'selected_partition_head'],
  depends_on: [],
}
const ordinaryRoot = {
  kind: 'validated_branch_input_set',
  source_refs: ['authority_operation_hold_store.row_union.variants.ordinary_single_proof', 'case_session_authority_operation_protocols', 'authority_proof_verification', 'case_session_authority_read_set_schema', 'authority_partition_head_store'],
  source_semantics: ['ordinary_hold_precommit_identity', 'validated_or_bounded_raw_target', 'validated_or_bounded_raw_single_proof', 'selected_authority_read_set_when_available', 'selected_partition_head_when_available'],
  depends_on: [],
}
const sessionRoot = {
  kind: 'validated_branch_input_set',
  source_refs: ['session_hold_evidence_schema', 'session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'authority_partition_head_store', 'case_session_authority_operation_protocols'],
  source_semantics: ['session_preoutcome_evidence_inputs', 'resolved_dual_proof_truth', 'selected_authority_read_set_or_bounded_raw_evidence', 'selected_partition_head_when_available', 'validated_or_bounded_raw_target'],
  depends_on: [],
}
delete rules.committed.rules.validated_precommit_material
delete rules.ordinary_held.rules.validated_precommit_material
delete rules.session_held.rules.validated_precommit_material
rules.committed.rules = { committed_precommit_material: committedRoot, ...rules.committed.rules }
rules.ordinary_held.rules = { ordinary_hold_precommit_material: ordinaryRoot, ...rules.ordinary_held.rules }
rules.session_held.rules = { session_hold_evidence_material: sessionRoot, ...rules.session_held.rules }
rules.committed.rules.receipt_precommit_fingerprint.depends_on = ['committed_precommit_material']
rules.ordinary_held.rules.hold_row_ref.depends_on = ['ordinary_hold_precommit_material']
rules.session_held.rules.session_hold_evidence_fingerprint.depends_on = ['session_hold_evidence_material']
rules.session_held.rules.hold_row_ref.depends_on = ['session_hold_evidence_fingerprint']
rules.committed.schema_version = 'ctrl.g24.authority-operation-identity-derivation-rules-committed.r36.v1'
rules.ordinary_held.schema_version = 'ctrl.g24.authority-operation-identity-derivation-rules-ordinary-held.r36.v1'
rules.session_held.schema_version = 'ctrl.g24.authority-operation-identity-derivation-rules-session-held.r36.v1'
rules.committed.exact_available_source_root = 'committed_precommit_material'
rules.committed.forbidden_unavailable_sources = ['authority_operation_hold_store', 'session_hold_evidence_schema', 'final_hold_fingerprint']
rules.ordinary_held.exact_available_source_root = 'ordinary_hold_precommit_material'
rules.ordinary_held.forbidden_unavailable_sources = ['authority_operation_receipt_precommit_identity_plans', 'session_hold_evidence_schema', 'final_receipt_fingerprint']
rules.session_held.exact_available_source_root = 'session_hold_evidence_material'
rules.session_held.forbidden_unavailable_sources = ['authority_operation_receipt_precommit_identity_plans', 'final_receipt_fingerprint']
r36.authority_operation_identity_derivation_rules.schema_version = 'ctrl.g24.authority-operation-identity-derivation-rules.r36.v1'
r36.authority_operation_identity_derivation_rules.normative = true
r36.authority_operation_identity_derivation_rules.local_schema_ref = 'authority_operation_identity_dependency_graph'
r36.authority_operation_identity_derivation_rules.local_schema_version = 'ctrl.g24.authority-operation-identity-dependency-graph.r36.v1'
r36.authority_operation_identity_derivation_rules.selected_branch_table_ref = 'authority_operation_fresh_branch_class_selection'

const buildGraph = branchRules => ({ nodes: Object.keys(branchRules), edges: Object.entries(branchRules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target])) })
for (const branchClass of ['committed', 'ordinary_held', 'session_held']) {
  const graph = r36.authority_operation_identity_dependency_graph.variants[branchClass]
  Object.assign(graph, buildGraph(rules[branchClass].rules))
  graph.schema_version = `ctrl.g24.authority-operation-identity-dependency-graph-${branchClass.replaceAll('_', '-')}.r36.v1`
  graph.generated_only_from = `authority_operation_identity_derivation_rules.variants.${branchClass}.rules.*.depends_on`
  graph.selected_branch_table_ref = 'authority_operation_fresh_branch_class_selection'
}
r36.authority_operation_identity_dependency_graph.schema_version = 'ctrl.g24.authority-operation-identity-dependency-graph.r36.v1'
function refreshDag(key, branchClass) {
  const graph = r36.authority_operation_identity_dependency_graph.variants[branchClass]
  const dag = r36[key]
  dag.schema_version = `ctrl.g24.authority-operation-${branchClass.replaceAll('_', '-')}-issuance-dag.r36.v1`
  dag.nodes = graph.nodes
  dag.edges = graph.edges
  dag.selected_branch_table_ref = 'authority_operation_fresh_branch_class_selection'
  dag.selected_branch_class = branchClass
}
refreshDag('authority_operation_committed_issuance_dag', 'committed')
refreshDag('authority_operation_ordinary_held_issuance_dag', 'ordinary_held')
refreshDag('authority_operation_session_held_issuance_dag', 'session_held')

r36.authority_operation_replay_classifier = { schema_version: 'ctrl.g24.authority-operation-replay-classifier.r36.v1', normative: true, local_schema_ref: 'authority_operation_replay_branch_map', local_schema_version: 'ctrl.g24.authority-operation-replay-branch-map.r36.v1', discriminator_order: ['operation_name', 'proof_family', 'result_branch', 'held_registry_hold_schema_ref', 'session_evidence_availability'], rows: selectionRows.map(row => ({ fresh_selection_row_id: row.selection_row_id, operation_name: row.operation_name, proof_family: row.proof_family, result_branch: row.result_branch, branch_class: row.branch_class, held_registry_hold_schema_ref: row.hold_schema_ref, session_evidence_availability: row.session_evidence, session_evidence_triple_source: row.branch_class === 'session_held' ? ['held_registry.session_hold_evidence_ref_or_unavailable', 'held_registry.session_hold_evidence_bytes_sha256_or_unavailable', 'held_registry.session_hold_evidence_fingerprint_or_unavailable'] : ['UNAVAILABLE', 'UNAVAILABLE', 'UNAVAILABLE'], original_issuance_dag_ref: row.issuance_dag_ref, replay_path_ref: `authority_operation_replay_branch_map.variants.${row.branch_class}.replay_path` })), exact_expected_rows: 90, parity_with_fresh_selection: 'byte_for_byte_on_selection_row_operation_proof_family_result_branch_branch_class_hold_schema_session_evidence_and_issuance_DAG', registry_authority: 'operation_name_result_branch_hold_schema_ref_and_session_evidence_triple_from_exact_original_registry_and_hold_row', session_evidence_authority: 'required_rows_resolve_exact_triple_of_non_UNAVAILABLE_ref_bytes_sha256_and_fingerprint; forbidden_rows_have_three_exact_UNAVAILABLE_literals', classification_failure: 'hold_without_disclosure_or_write' }
r36.authority_operation_replay_branch_map.schema_version = 'ctrl.g24.authority-operation-replay-branch-map.r36.v1'
r36.authority_operation_replay_branch_map.normative = true
r36.authority_operation_replay_branch_map.local_schema_ref = 'authority_operation_replay_derivation'
r36.authority_operation_replay_branch_map.local_schema_version = 'ctrl.g24.authority-operation-replay-derivation.r36.v1'
r36.authority_operation_replay_branch_map.replay_classifier_ref = 'authority_operation_replay_classifier'
r36.authority_operation_replay_branch_map.branch_class_derivation = 'exactly_one_authority_operation_replay_classifier_row_or_hold_without_disclosure_or_write'
r36.authority_operation_replay_branch_map.result_resolution_order = 'after_exact_registry_and_hold_when_held_but_before_historical_response'
for (const variant of Object.values(r36.authority_operation_replay_branch_map.variants)) variant.replay_order_rules = ['resolve_exact_result_artifact_before_historical_response', 'resolve_exact_replay_payload_artifact_before_replay_envelope_artifact', 'return_only_after_exact_envelope_resolution']
r36.authority_operation_replay_derivation.schema_version = 'ctrl.g24.authority-operation-replay-derivation.r36.v1'
r36.authority_operation_replay_derivation.replay_classifier_ref = 'authority_operation_replay_classifier'
r36.authority_operation_replay_derivation.payload_before_envelope_required = true

r36.authority_operation_historical_response_binding_authority.schema_version = 'ctrl.g24.authority-operation-historical-response-binding-authority.r36.v1'
r36.authority_operation_historical_response_binding_authority.local_schema_version = r36.authority_operation_historical_response_schema.schema_version
const normativeRows = [
  ['authority_operation_historical_response_binding_authority', 'authority_operation_historical_response_schema', r36.authority_operation_historical_response_schema.schema_version],
  ['authority_operation_fresh_branch_class_selection', 'case_session_authority_operation_protocols', r36.case_session_authority_operation_protocols.schema_version],
  ['authority_operation_identity_derivation_rules', 'authority_operation_identity_dependency_graph', r36.authority_operation_identity_dependency_graph.schema_version],
  ['authority_operation_replay_classifier', 'authority_operation_replay_branch_map', r36.authority_operation_replay_branch_map.schema_version],
  ['authority_operation_replay_branch_map', 'authority_operation_replay_derivation', r36.authority_operation_replay_derivation.schema_version],
].map(([authority_key, local_schema_ref, local_schema_version]) => ({ authority_key, authority_schema_ref: authority_key, authority_schema_version: r36[authority_key].schema_version, local_schema_ref, local_schema_version }))
r36.normative_authority_registry = { schema_version: 'ctrl.g24.normative-authority-registry.r36.v1', type: 'exhaustive_top_level_normative_authority_registry', exact_expected_rows: normativeRows.length, rows: normativeRows, selection: 'every_top_level_object_with_normative_true_must_appear_exactly_once_and_every_row_must_resolve_exact_key_schema_version_local_schema_ref_and_local_schema_version', unregistered_normative_authority: 'reject_materialization_and_hold_runtime', duplicate_or_stale_authority: 'reject_materialization_and_hold_runtime' }

r36.authority_operation_serializable_branch_transaction.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r36.v1'
r36.authority_operation_serializable_branch_transaction.fresh_branch_selection_ref = 'authority_operation_fresh_branch_class_selection'
r36.authority_operation_serializable_branch_transaction.selected_branch_row_identity_fields = ['selection_row_id', 'operation_name', 'proof_family', 'result_branch', 'branch_class', 'result_schema_ref', 'hold_schema_ref', 'session_evidence', 'issuance_dag_ref']
r36.authority_operation_serializable_branch_transaction.selected_row_required_before_branch_derivation = true
r36.authority_operation_serializable_branch_transaction.atomicity = 'select_exact_branch_table_row_then_execute_only_its_exact_available_source_root_complete_dependency_graph_and_write_set_or_commit_none'

r36.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r36.v1', derivation: 'bounded_exact_extension_from_frozen_R35_to_R36_exhaustive_branch_selection_exact_source_roots_replay_classifier_and_normative_authority_registry', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authority_operation_fresh_branch_class_selection', '$.authority_operation_identity_derivation_rules', '$.authority_operation_identity_dependency_graph', '$.authority_operation_committed_issuance_dag', '$.authority_operation_ordinary_held_issuance_dag', '$.authority_operation_session_held_issuance_dag', '$.authority_operation_replay_classifier', '$.authority_operation_replay_branch_map', '$.authority_operation_replay_derivation', '$.authority_operation_historical_response_binding_authority', '$.normative_authority_registry', '$.authority_operation_serializable_branch_transaction'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r36_identifier: true, frozen_parent_core_must_remain_byte_identical: true }
r36.required_negative_fixture_families = [...new Set([...r36.required_negative_fixture_families, 'fresh_branch_selector_swap_or_default', 'branch_exact_source_root', 'replay_classifier_parity', 'payload_before_envelope', 'evasive_competing_normative_authority'])]
r36.visible_surface_changes = []
r36.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r36)
export const materializedR36 = r36
export const materializedR36Output = `${JSON.stringify(r36, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR36Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR36Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R36 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
