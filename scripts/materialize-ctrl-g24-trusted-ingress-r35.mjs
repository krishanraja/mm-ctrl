import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR34 } from './materialize-ctrl-g24-trusted-ingress-r34.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r34.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r35.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r35 = structuredClone(materializedR34)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprint = (domain, fields) => ({ schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r35.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' })

r35.schema_version = 'ctrl.g24.trusted-ingress.r35.effective.v1'
r35.status = 'thirty_fifth_repair_candidate_under_independent_review'
r35.supersedes = {
  commit: '45ba363f08324240f311bba2610e9ad93c640624',
  tree: '595874408a4a143bc5e09743652470d0f10d4211',
  human_blob: 'b22f1a67b26887c24d949b68f5f2de352752ca4a',
  machine_blob: 'd5ac663afdaad34064855423ea674aff6e40976a',
  qa_blob: '4ac59a24d6ad6f9594660c4e97eb7e147e79af26',
  checker_blob: '2facfea73d44d4edb27d0866336d5846c0639eba',
  materializer_blob: '8f82687e9ab571c1125556b00be76930ae08fa62',
  founder_checker_blob: 'c7de3e0cb6f6334a6e31378c28999e87542c12a0',
  adjudication: 'veto',
}
r35.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r35.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r35.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const resultSchemaRefs = []
for (const [operationName, operation] of Object.entries(operations)) {
  resultSchemaRefs.push(`case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.committed`)
  for (const branch of heldBranches) resultSchemaRefs.push(`case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`)
}

// One R35 object is the sole active authority for historical response construction.
delete r35.authority_operation_historical_response_field_bindings
const historicalBindings = [
  { local_field: 'operation_name', source_kind: 'selected_result', source_field: 'operation_name', equality: 'exact' },
  { local_field: 'operation_id', source_kind: 'selected_result', source_field: 'operation_id', equality: 'exact' },
  { local_field: 'result_branch', source_kind: 'selected_result', source_field: 'branch', equality: 'exact' },
  { local_field: 'response_schema_ref', source_kind: 'selected_matrix_row', source_field: 'response_schema_ref', equality: 'exact' },
  { local_field: 'response_schema_version', source_kind: 'selected_matrix_row', source_field: 'response_schema_version', equality: 'exact' },
  { local_field: 'response_payload_ref', source_kind: 'selected_result_artifact', source_field: 'artifact_ref', equality: 'exact' },
  { local_field: 'response_payload_bytes_sha256', source_kind: 'selected_result_artifact', source_field: 'canonical_bytes_sha256', equality: 'exact' },
  { local_field: 'result_ref', source_kind: 'selected_result_artifact', source_field: 'artifact_ref', equality: 'exact' },
  { local_field: 'result_bytes_sha256', source_kind: 'selected_result_artifact', source_field: 'canonical_bytes_sha256', equality: 'exact' },
  { local_field: 'result_fingerprint', source_kind: 'selected_result', source_field: 'result_fingerprint', equality: 'exact' },
]
r35.authority_operation_historical_response_binding_authority = {
  schema_version: 'ctrl.g24.authority-operation-historical-response-binding-authority.r35.v1',
  type: 'sole_normative_binding_authority',
  normative: true,
  sole_active_authority: true,
  local_schema_ref: 'authority_operation_historical_response_schema',
  selected_matrix_ref: 'authority_operation_historical_response_schema_matrix',
  selected_result_schema_refs: resultSchemaRefs,
  selected_result_artifact_store_family_ref: 'authority_operation_artifact_stores.families.results',
  bindings: historicalBindings,
  response_payload_rule: 'the_exact_selected_result_artifact_bytes_are_the_historical_response_payload',
  operation_branch_schema_selection: 'exactly_one_matrix_row_selected_by_result_operation_name_and_branch',
  no_competing_binding_authority: true,
}
const history = r35.authority_operation_historical_response_schema
history.schema_version = 'ctrl.g24.authority-operation-historical-response.r35.v1'
history.exact_equalities = ['all_fields_equal_the_sole_R35_historical_response_binding_authority', 'operation_and_branch_select_exactly_one_R35_matrix_row', 'result_ref_and_response_payload_ref_equal_selected_result_artifact_ref', 'result_bytes_sha256_and_response_payload_bytes_sha256_equal_selected_result_artifact_canonical_bytes_sha256', 'result_fingerprint_equals_selected_result_decoded_fingerprint']
r35.fingerprint_schemas.authority_operation_historical_response_r35 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HISTORICAL-RESPONSE-R35', history.exact_keys.filter(key => key !== 'response_fingerprint'))
history.fingerprint_ref = 'fingerprint_schemas.authority_operation_historical_response_r35'
r35.authority_operation_historical_response_artifact_store.schema_version = 'ctrl.g24.authority-operation-historical-responses-artifact-store.r35.v1'
r35.authority_operation_historical_response_artifact_store.row_schema.schema_version = 'ctrl.g24.authority-operation-historical-responses-artifact-row.r35.v1'
r35.authority_operation_historical_response_schema_matrix.schema_version = 'ctrl.g24.authority-operation-historical-response-schema-matrix.r35.v1'

const commonTail = {
  result_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: resultSchemaRefs, depends_on: ['result_fingerprint'] },
  result_artifact_ref: { kind: 'content_address', source_refs: Object.keys(r35.authority_operation_artifact_stores.families.results.stores_by_schema_ref).map(key => `authority_operation_artifact_stores.families.results.stores_by_schema_ref.${key}.row_schema.content_address_rule`), depends_on: ['result_canonical_bytes_sha256'] },
  historical_response_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_historical_response_r35', 'authority_operation_historical_response_binding_authority'], depends_on: ['result_artifact_ref', 'result_canonical_bytes_sha256', 'result_fingerprint'] },
  historical_response_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: ['authority_operation_historical_response_schema'], depends_on: ['historical_response_fingerprint'] },
  historical_response_artifact_ref: { kind: 'content_address', source_refs: ['authority_operation_historical_response_artifact_store.row_schema.content_address_rule'], depends_on: ['historical_response_canonical_bytes_sha256'] },
}
const replayTail = {
  replay_payload_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_replay_payload_committed_r34', 'fingerprint_schemas.authority_operation_replay_payload_held_r34'], depends_on: ['registry_row_ref', 'registry_fingerprint', 'result_artifact_ref', 'historical_response_artifact_ref'] },
  replay_payload_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: ['authority_operation_replay_payload_schema'], depends_on: ['replay_payload_fingerprint'] },
  replay_payload_artifact_ref: { kind: 'content_address', source_refs: ['authority_operation_replay_payload_artifact_store.row_schema.content_address_rule'], depends_on: ['replay_payload_canonical_bytes_sha256'] },
  replay_envelope_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_replay_envelope_r34'], depends_on: ['replay_payload_artifact_ref', 'replay_payload_fingerprint', 'historical_response_artifact_ref'] },
  replay_envelope_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: ['authority_operation_replay_envelope_schema'], depends_on: ['replay_envelope_fingerprint'] },
  replay_envelope_artifact_ref: { kind: 'content_address', source_refs: ['authority_operation_replay_envelope_artifact_store.row_schema.content_address_rule'], depends_on: ['replay_envelope_canonical_bytes_sha256'] },
}
const resultFingerprintRule = dependsOn => ({ kind: 'fingerprint', source_refs: operationNames.map(name => `case_session_authority_operation_protocols.operations.${name}.result_fingerprint`), depends_on: dependsOn })
const base = { validated_precommit_material: { kind: 'validated_input', source_refs: ['authority_operation_receipt_precommit_identity_plans', 'authority_operation_hold_store.row_union'], depends_on: [] } }
const committedRules = {
  ...base,
  receipt_precommit_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_receipt_precommit_ordinary_r33', 'fingerprint_schemas.authority_operation_receipt_precommit_session_r33'], depends_on: ['validated_precommit_material'] },
  result_fingerprint: resultFingerprintRule(['receipt_precommit_fingerprint']),
  ...commonTail,
  final_receipt_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_receipt_final_ordinary_r34', 'fingerprint_schemas.authority_operation_receipt_final_session_r34'], depends_on: ['result_artifact_ref', 'result_fingerprint', 'historical_response_artifact_ref'] },
  registry_row_ref: { kind: 'content_address_over_registry_identity_fields', source_refs: ['authority_operation_registry.row_union.variants.original_committed'], depends_on: ['historical_response_artifact_ref', 'final_receipt_fingerprint'] },
  registry_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_registry_committed_r34'], depends_on: ['registry_row_ref', 'historical_response_artifact_ref', 'final_receipt_fingerprint'] },
  ...replayTail,
}
const ordinaryHeldRules = {
  ...base,
  hold_row_ref: { kind: 'content_address_over_precommit_hold_fields', source_refs: ['authority_operation_hold_store.row_union.variants.ordinary_single_proof'], depends_on: ['validated_precommit_material'] },
  result_fingerprint: resultFingerprintRule(['hold_row_ref']),
  ...commonTail,
  final_hold_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_hold_ordinary_r34'], depends_on: ['hold_row_ref', 'result_artifact_ref', 'result_fingerprint', 'historical_response_artifact_ref'] },
  registry_row_ref: { kind: 'content_address_over_registry_identity_fields', source_refs: ['authority_operation_registry.row_union.variants.original_persisted_hold'], depends_on: ['historical_response_artifact_ref', 'final_hold_fingerprint'] },
  registry_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_registry_held_r34'], depends_on: ['registry_row_ref', 'historical_response_artifact_ref', 'final_hold_fingerprint'] },
  ...replayTail,
}
const sessionHeldRules = {
  ...base,
  session_hold_evidence_fingerprint: { kind: 'fingerprint', source_refs: ['session_hold_evidence_schema'], depends_on: ['validated_precommit_material'] },
  hold_row_ref: { kind: 'content_address_over_precommit_hold_fields', source_refs: ['authority_operation_hold_store.row_union.variants.session_dual_proof'], depends_on: ['validated_precommit_material', 'session_hold_evidence_fingerprint'] },
  result_fingerprint: resultFingerprintRule(['hold_row_ref']),
  ...commonTail,
  final_hold_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_hold_session_r34'], depends_on: ['hold_row_ref', 'session_hold_evidence_fingerprint', 'result_artifact_ref', 'result_fingerprint', 'historical_response_artifact_ref'] },
  registry_row_ref: { kind: 'content_address_over_registry_identity_fields', source_refs: ['authority_operation_registry.row_union.variants.original_persisted_hold'], depends_on: ['historical_response_artifact_ref', 'final_hold_fingerprint'] },
  registry_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_registry_held_r34'], depends_on: ['registry_row_ref', 'historical_response_artifact_ref', 'final_hold_fingerprint'] },
  ...replayTail,
}
const branchRules = { committed: committedRules, ordinary_held: ordinaryHeldRules, session_held: sessionHeldRules }
const buildGraph = rules => ({ nodes: Object.keys(rules), edges: Object.entries(rules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target])) })
const branchGraphs = Object.fromEntries(Object.entries(branchRules).map(([branchClass, rules]) => [branchClass, { schema_version: `ctrl.g24.authority-operation-identity-dependency-graph-${branchClass.replaceAll('_', '-')}.r35.v1`, branch_class: branchClass, ...buildGraph(rules), generated_only_from: `authority_operation_identity_derivation_rules.variants.${branchClass}.rules.*.depends_on`, all_rule_dependencies_available_in_this_branch: true, filtered_edge_construction: 'forbidden', generic_cycle_detection_required: true, exact_transitive_dependency_closure_required: true }]))
r35.authority_operation_identity_derivation_rules = { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules.r35.v1', type: 'discriminated_branch_dependency_rules', discriminator: 'branch_class', exact_variants: ['committed', 'ordinary_held', 'session_held'], variants: Object.fromEntries(Object.entries(branchRules).map(([branchClass, rules]) => [branchClass, { schema_version: `ctrl.g24.authority-operation-identity-derivation-rules-${branchClass.replaceAll('_', '-')}.r35.v1`, branch_class: branchClass, rules }])), every_source_ref_must_resolve: true, unavailable_cross_branch_dependency: 'forbidden', exact_local_binding_coverage_ref: 'authority_operation_result_artifact_binding_coverage' }
r35.authority_operation_identity_dependency_graph = { schema_version: 'ctrl.g24.authority-operation-identity-dependency-graph.r35.v1', type: 'discriminated_branch_dependency_graph', discriminator: 'branch_class', exact_variants: ['committed', 'ordinary_held', 'session_held'], variants: branchGraphs, no_singular_conjunctive_graph: true, hidden_filtered_edges: 'forbidden', selected_graph_must_equal_selected_rules_exactly: true, every_selected_node_must_include_all_direct_and_transitive_dependencies: true }

const issuance = (branchClass, graph, extras) => ({ schema_version: `ctrl.g24.authority-operation-${branchClass.replaceAll('_', '-')}-issuance-dag.r35.v1`, branch_class: branchClass, nodes: graph.nodes, edges: graph.edges, generated_directly_from_selected_branch_rules: true, unavailable_nodes_or_filtered_edges: 'forbidden', ...extras, acyclic_required: true })
r35.authority_operation_committed_issuance_dag = issuance('committed', branchGraphs.committed, { result_depends_only_on_precommit_identity: true, history_precedes_final_receipt: true, final_receipt_and_history_precede_registry: true })
r35.authority_operation_ordinary_held_issuance_dag = issuance('ordinary_held', branchGraphs.ordinary_held, { session_evidence: 'forbidden', result_depends_only_on_hold_row_ref: true, final_hold_and_history_precede_registry: true })
r35.authority_operation_session_held_issuance_dag = issuance('session_held', branchGraphs.session_held, { evidence_precedes_hold_row_ref: true, result_depends_only_on_hold_row_ref: true, final_hold_and_history_precede_registry: true })
delete r35.authority_operation_hold_issuance_dag

const committedReplayPath = ['resolve_exact_committed_registry_row', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response']
const ordinaryHeldReplayPath = ['resolve_exact_held_registry_row', 'resolve_exact_hold_row', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response']
const sessionHeldReplayPath = ['resolve_exact_held_registry_row', 'resolve_exact_hold_row', 'resolve_exact_session_hold_evidence', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response']
r35.authority_operation_replay_branch_map = {
  schema_version: 'ctrl.g24.authority-operation-replay-branch-map.r35.v1',
  discriminator: 'original_branch_class',
  exact_variants: ['committed', 'ordinary_held', 'session_held'],
  variants: {
    committed: { original_issuance_dag_ref: 'authority_operation_committed_issuance_dag', replay_path: committedReplayPath },
    ordinary_held: { original_issuance_dag_ref: 'authority_operation_ordinary_held_issuance_dag', replay_path: ordinaryHeldReplayPath },
    session_held: { original_issuance_dag_ref: 'authority_operation_session_held_issuance_dag', replay_path: sessionHeldReplayPath },
  },
  branch_class_derivation: 'committed_registry_means_committed; held_registry_plus_session_evidence_unavailable_means_ordinary_held; held_registry_plus_exact_session_evidence_means_session_held',
  result_resolution_order: 'after_exact_registry_and_hold_when_held_but_before_historical_response',
  source_precedence: ['authoritative_registry', 'authoritative_hold_when_held', 'session_evidence_when_session_held', 'selected_result_artifact', 'historical_response_artifact', 'replay_payload_artifact', 'replay_envelope_artifact'],
  anti_splice: 'every_resolved_operation_id_operation_name_branch_result_hold_history_payload_and_envelope_identity_must_equal_the_same_original_registry_lineage_or_hold_without_disclosure',
}
r35.authority_operation_replay_derivation = { schema_version: 'ctrl.g24.authority-operation-replay-derivation.r35.v1', replay_branch_map_ref: 'authority_operation_replay_branch_map', replay_write_set: [], dynamic_time: 'forbidden', first_replay_requires_write: false, exact_original_branch_dag_required: true, resolve_exact_result_artifact_before_history: true, source_precedence_ref: 'authority_operation_replay_branch_map.source_precedence', anti_splice_ref: 'authority_operation_replay_branch_map.anti_splice', sole_consumer_schema_ref: 'authority_operation_replay_envelope_schema', binding_authority_ref: 'authority_operation_replay_resolution_bindings', registry_authority_ref: 'authority_operation_replay_registry_authority' }
r35.authority_operation_replay_registry_authority.schema_version = 'ctrl.g24.authority-operation-replay-registry-authority.r35.v1'
r35.authority_operation_replay_registry_authority.historical_response_binding_authority_ref = 'authority_operation_historical_response_binding_authority'
delete r35.authority_operation_replay_registry_authority.historical_response_equalities
r35.authority_operation_replay_registry_authority.source_precedence = r35.authority_operation_replay_branch_map.source_precedence
r35.authority_operation_replay_registry_authority.abc_splice_rule = r35.authority_operation_replay_branch_map.anti_splice

r35.authority_operation_serializable_branch_transaction.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r35.v1'
r35.authority_operation_serializable_branch_transaction.committed_issuance_dag_ref = 'authority_operation_committed_issuance_dag'
delete r35.authority_operation_serializable_branch_transaction.hold_issuance_dag_ref
r35.authority_operation_serializable_branch_transaction.ordinary_held_issuance_dag_ref = 'authority_operation_ordinary_held_issuance_dag'
r35.authority_operation_serializable_branch_transaction.session_held_issuance_dag_ref = 'authority_operation_session_held_issuance_dag'
r35.authority_operation_serializable_branch_transaction.identity_dependency_graph_ref = 'authority_operation_identity_dependency_graph'
r35.authority_operation_serializable_branch_transaction.atomicity = 'select_exact_branch_class_then_execute_only_its_complete_dependency_graph_and_write_set_or_commit_none'
r35.authority_operation_serializable_branch_transaction.crash_rule = 'rollback_all_selected_branch_precommit_evidence_result_history_finalization_registry_replay_nonce_target_head_and_artifact_writes'

r35.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r35.v1', derivation: 'bounded_exact_extension_from_frozen_R34_to_R35_single_history_binding_authority_discriminated_branch_graphs_and_exact_replay_paths', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authority_operation_historical_response_schema', '$.authority_operation_historical_response_schema_matrix', '$.authority_operation_historical_response_artifact_store', '$.authority_operation_historical_response_binding_authority', '$.authority_operation_identity_derivation_rules', '$.authority_operation_identity_dependency_graph', '$.authority_operation_committed_issuance_dag', '$.authority_operation_ordinary_held_issuance_dag', '$.authority_operation_session_held_issuance_dag', '$.authority_operation_replay_branch_map', '$.authority_operation_replay_derivation', '$.authority_operation_replay_registry_authority', '$.authority_operation_serializable_branch_transaction'], removed_semantic_paths: ['$.authority_operation_historical_response_field_bindings', '$.authority_operation_hold_issuance_dag', '$.authority_operation_replay_registry_authority.historical_response_equalities'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r35_identifier: true, exact_branch_classes: ['committed', 'ordinary_held', 'session_held'], frozen_parent_core_must_remain_byte_identical: true }
r35.required_negative_fixture_families = [...new Set([...r35.required_negative_fixture_families, 'competing_history_binding_authority', 'missing_history_result_bytes_binding', 'singular_conjunctive_identity_graph', 'cross_branch_unavailable_dependency', 'filtered_dependency_edge', 'replay_missing_result_artifact_resolution', 'replay_source_precedence_or_splice_drift'])]
r35.visible_surface_changes = []
r35.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r35)
export const materializedR35 = r35
export const materializedR35Output = `${JSON.stringify(r35, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR35Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR35Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R35 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
