import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR36 } from './materialize-ctrl-g24-trusted-ingress-r36.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r36.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r37.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r37 = structuredClone(materializedR36)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const id = { type: 'identifier' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, spec, before) { const properties = {}; for (const [name, value] of Object.entries(schema.properties)) { if (name === before) properties[key] = spec; properties[name] = value } if (!Object.hasOwn(properties, key)) properties[key] = spec; schema.properties = properties; schema.exact_keys = Object.keys(properties); schema.required = schema.exact_keys.filter(name => !(schema.optional ?? []).includes(name)) }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r37.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }

r37.schema_version = 'ctrl.g24.trusted-ingress.r37.effective.v1'
r37.status = 'thirty_seventh_repair_candidate_under_independent_review'
r37.supersedes = { commit: 'd7a1790536756e2c12b4841b1edebf19d8b3b7bc', tree: 'b5ca1bcc6238d809cf0b01c17a7b032a9f42c70b', human_blob: '82d725fb2804d77e9566f92e822d4d3b121599a2', machine_blob: 'f6331799468babc833ca6bfdb5f21e656826a3d1', qa_blob: 'b437d96aa7fd3bff0246ec1315b5adad80bbc2a0', checker_blob: '0c27d2f9da67b773c2afe3161bb53560117fce01', materializer_blob: '66783bbf155199e1294a540992df1d61915aa2fe', founder_checker_blob: 'cb29630aab8de27768467a93c3e8a5685d1ed66f', adjudication: 'veto' }
r37.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r37.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r37.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const sessionOperations = ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const verifiedBranches = ['stale_head_hold', 'invalid_target_hold']
const rawBranches = ['authorization_hold', 'invalid_proof_hold', 'internal_failure_hold']
const proofFamilies = ['root_bootstrap_2_of_2', 'root_admin', 'issuer', 'dual_issuer_evaluator']
const branchClasses = ['committed', 'ordinary_held', 'session_verified_consuming', 'session_raw_nonconsuming']
const evidenceKinds = ['committed_precommit', 'ordinary_hold_precommit', 'verified_session_hold_evidence', 'raw_session_hold_evidence']
function proofFamily(operationName, operation) { if (sessionOperations.includes(operationName)) return 'dual_issuer_evaluator'; if (operation.exact_authority_role === 'bootstrap') return 'root_bootstrap_2_of_2'; if (operation.exact_authority_role === 'root_admin') return 'root_admin'; if (operation.exact_authority_role === 'issuer') return 'issuer'; throw new Error(`unknown proof family:${operationName}`) }
function branchPlan(operationName, branch) {
  if (branch === 'committed') return { branch_class: 'committed', evidence_kind: 'committed_precommit', hold_schema_ref: 'UNAVAILABLE', evidence_schema_ref: 'UNAVAILABLE', issuance_dag_ref: 'authority_operation_committed_issuance_dag' }
  if (!sessionOperations.includes(operationName)) return { branch_class: 'ordinary_held', evidence_kind: 'ordinary_hold_precommit', hold_schema_ref: 'authority_operation_hold_store.row_union.variants.ordinary_single_proof', evidence_schema_ref: 'UNAVAILABLE', issuance_dag_ref: 'authority_operation_ordinary_held_issuance_dag' }
  if (verifiedBranches.includes(branch)) return { branch_class: 'session_verified_consuming', evidence_kind: 'verified_session_hold_evidence', hold_schema_ref: 'authority_operation_hold_store.row_union.variants.session_dual_proof', evidence_schema_ref: 'session_hold_evidence_schema.variants.verified_consuming', issuance_dag_ref: 'authority_operation_session_verified_consuming_issuance_dag' }
  return { branch_class: 'session_raw_nonconsuming', evidence_kind: 'raw_session_hold_evidence', hold_schema_ref: 'authority_operation_hold_store.row_union.variants.session_dual_proof', evidence_schema_ref: 'session_hold_evidence_schema.variants.raw_non_consuming', issuance_dag_ref: 'authority_operation_session_raw_nonconsuming_issuance_dag' }
}
const selectionRows = []
for (const [operationName, operation] of Object.entries(operations)) for (const branch of ['committed', ...heldBranches]) {
  const family = proofFamily(operationName, operation), plan = branchPlan(operationName, branch)
  selectionRows.push({ selection_row_id: `${operationName}|${family}|${branch}|r37`, operation_name: operationName, proof_family: family, result_branch: branch, branch_class: plan.branch_class, evidence_kind: plan.evidence_kind, result_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, hold_schema_ref: plan.hold_schema_ref, session_evidence_schema_ref: plan.evidence_schema_ref, issuance_dag_ref: plan.issuance_dag_ref, selector_schema_version: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1' })
}
const selectorRowProperties = { selection_row_id: id, operation_name: { enum: operationNames }, proof_family: { enum: proofFamilies }, result_branch: { enum: ['committed', ...heldBranches] }, branch_class: { enum: branchClasses }, evidence_kind: { enum: evidenceKinds }, result_schema_ref: id, hold_schema_ref: { type: 'identifier_or_UNAVAILABLE_literal' }, session_evidence_schema_ref: { type: 'identifier_or_UNAVAILABLE_literal' }, issuance_dag_ref: id, selector_schema_version: { const: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1' } }
r37.authority_operation_fresh_branch_class_selection = { schema_version: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1', authority_marker: 'normative_control', normative: true, local_schema_ref: 'case_session_authority_operation_protocols', local_schema_version: r37.case_session_authority_operation_protocols.schema_version, row_schema: closed('ctrl.g24.authority-operation-fresh-branch-class-selection-row.r37.v1', selectorRowProperties, { caller_writable_fields: [], fallback_or_default: 'forbidden', source_semantics: { operation_name: 'closed_operation_registry_key', proof_family: 'closed_operation_proof_authority', result_branch: 'selected_result_union_branch', branch_class: 'exact_branch_plan', evidence_kind: 'exact_branch_evidence_plan', result_schema_ref: 'exact_operation_result_variant', hold_schema_ref: 'exact_hold_variant_or_UNAVAILABLE', session_evidence_schema_ref: 'exact_evidence_variant_or_UNAVAILABLE', issuance_dag_ref: 'exact_branch_DAG' } }), discriminator_order: ['operation_name', 'proof_family', 'result_branch'], unique_keys: [['operation_name', 'proof_family', 'result_branch'], ['selection_row_id']], exact_expected_rows: 90, exact_committed_rows: 15, exact_ordinary_held_rows: 60, exact_session_verified_consuming_rows: 6, exact_session_raw_nonconsuming_rows: 9, rows: selectionRows, selection_semantics: { selection: 'exactly_one_closed_row_after_result_branch_selection_before_any_branch_identity_or_write', caller_override: 'forbidden', missing_duplicate_or_unknown: 'hold_without_write_or_disclosure', persistence: 'all_selector_identity_fields_persist_in_original_registry_and_hold_lineage' } }

// Persist the selected branch decision in every original registry and hold identity.
const persisted = {
  fresh_selection_row_id: id,
  proof_family: { enum: proofFamilies },
  branch_class: { enum: branchClasses },
  evidence_kind: { enum: evidenceKinds },
  fresh_selection_schema_version: { const: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1' },
}
const committedRegistry = r37.authority_operation_registry.row_union.variants.original_committed
const heldRegistry = r37.authority_operation_registry.row_union.variants.original_persisted_hold
for (const [key, spec] of Object.entries(persisted)) { add(committedRegistry, key, spec, 'registry_fingerprint'); add(heldRegistry, key, spec, 'registry_fingerprint') }
committedRegistry.schema_version = 'ctrl.g24.authority-operation-registry-original-committed.r37.v1'
heldRegistry.schema_version = 'ctrl.g24.authority-operation-registry-original-persisted-hold.r37.v1'
committedRegistry.exact_equalities = [...new Set([...(committedRegistry.exact_equalities ?? []), 'persisted_selection_fields_equal_exact_selected_R37_row_and_are_never_reinterpreted'])]
heldRegistry.exact_equalities = [...new Set([...(heldRegistry.exact_equalities ?? []), 'persisted_selection_fields_equal_exact_selected_R37_row_and_exact_hold_row'])]
r37.fingerprint_schemas.authority_operation_registry_committed_r37 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R37', committedRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
r37.fingerprint_schemas.authority_operation_registry_held_r37 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R37', heldRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
committedRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_committed_r37'
heldRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_held_r37'
r37.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r37.v1'
r37.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r37.v1'
for (const [variantName, hold] of Object.entries(r37.authority_operation_hold_store.row_union.variants)) {
  for (const [key, spec] of Object.entries(persisted)) add(hold, key, spec, 'hold_fingerprint')
  hold.schema_version = `ctrl.g24.authority-operation-hold-${variantName.replaceAll('_', '-')}.r37.v1`
  hold.exact_equalities = [...new Set([...(hold.exact_equalities ?? []), 'persisted_selection_fields_equal_exact_selected_R37_row_and_original_held_registry'])]
  const short = variantName === 'ordinary_single_proof' ? 'ordinary' : 'session'
  r37.fingerprint_schemas[`authority_operation_hold_${short}_r37`] = fingerprint(`CTRL-G24-AUTHORITY-OPERATION-HOLD-${short.toUpperCase()}-R37`, hold.exact_keys.filter(key => key !== 'hold_fingerprint'))
  hold.fingerprint_ref = `fingerprint_schemas.authority_operation_hold_${short}_r37`
}
r37.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r37.v1'
r37.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r37.v1'

// Four exact roots replace the conflated session-held branch.
const priorRules = r37.authority_operation_identity_derivation_rules.variants
const tail = source => {
  const copy = structuredClone(source)
  delete copy.committed_precommit_material
  delete copy.ordinary_hold_precommit_material
  delete copy.session_hold_evidence_material
  delete copy.receipt_precommit_fingerprint
  delete copy.session_hold_evidence_fingerprint
  delete copy.hold_row_ref
  return copy
}
const committedRules = structuredClone(priorRules.committed.rules)
const ordinaryRules = structuredClone(priorRules.ordinary_held.rules)
const sessionTail = tail(priorRules.session_held.rules)
committedRules.registry_fingerprint.source_refs = ['fingerprint_schemas.authority_operation_registry_committed_r37']
ordinaryRules.final_hold_fingerprint.source_refs = ['fingerprint_schemas.authority_operation_hold_ordinary_r37']
ordinaryRules.registry_fingerprint.source_refs = ['fingerprint_schemas.authority_operation_registry_held_r37']
sessionTail.final_hold_fingerprint.source_refs = ['fingerprint_schemas.authority_operation_hold_session_r37']
sessionTail.registry_fingerprint.source_refs = ['fingerprint_schemas.authority_operation_registry_held_r37']
const verifiedRules = {
  session_verified_material: { kind: 'validated_branch_input_set', source_refs: ['session_hold_evidence_schema.variants.verified_consuming', 'session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'proof_nonce_ledger', 'proof_nonce_receipt_store', 'authority_partition_head_store', 'case_session_authority_operation_protocols'], source_semantics: ['verified_dual_proofs', 'bundle_truth_projection', 'exact_authority_read_set', 'exact_two_nonce_rows_and_receipts', 'selected_partition_head', 'validated_or_bounded_raw_target'], depends_on: [] },
  session_hold_evidence_fingerprint: { kind: 'fingerprint', source_refs: ['session_hold_evidence_schema.variants.verified_consuming'], depends_on: ['session_verified_material'] },
  hold_row_ref: { kind: 'content_address_over_precommit_hold_fields', source_refs: ['authority_operation_hold_store.row_union.variants.session_dual_proof'], depends_on: ['session_hold_evidence_fingerprint'] },
  ...sessionTail,
}
const rawRules = {
  session_raw_material: { kind: 'validated_branch_input_set', source_refs: ['session_hold_evidence_schema.variants.raw_non_consuming', 'authority_opaque_raw_input_stores', 'case_session_authority_operation_protocols'], source_semantics: ['bounded_raw_target', 'bounded_raw_issuer_and_evaluator_proof_slots_or_bundle', 'raw_non_consuming_evidence'], depends_on: [] },
  session_hold_evidence_fingerprint: { kind: 'fingerprint', source_refs: ['session_hold_evidence_schema.variants.raw_non_consuming'], depends_on: ['session_raw_material'] },
  hold_row_ref: { kind: 'content_address_over_precommit_hold_fields', source_refs: ['authority_operation_hold_store.row_union.variants.session_dual_proof'], depends_on: ['session_hold_evidence_fingerprint'] },
  ...sessionTail,
}
const variants = {
  committed: { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules-committed.r37.v1', branch_class: 'committed', exact_available_source_root: 'committed_precommit_material', forbidden_unavailable_sources: ['authority_operation_hold_store', 'session_hold_evidence_schema', 'final_hold_fingerprint'], rules: committedRules },
  ordinary_held: { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules-ordinary-held.r37.v1', branch_class: 'ordinary_held', exact_available_source_root: 'ordinary_hold_precommit_material', forbidden_unavailable_sources: ['authority_operation_receipt_precommit_identity_plans', 'session_hold_evidence_schema', 'final_receipt_fingerprint'], rules: ordinaryRules },
  session_verified_consuming: { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules-session-verified-consuming.r37.v1', branch_class: 'session_verified_consuming', exact_available_source_root: 'session_verified_material', required_sources: ['session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'proof_nonce_ledger', 'proof_nonce_receipt_store'], forbidden_unavailable_sources: ['authority_operation_receipt_precommit_identity_plans', 'authority_opaque_raw_input_stores', 'final_receipt_fingerprint'], rules: verifiedRules },
  session_raw_nonconsuming: { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules-session-raw-nonconsuming.r37.v1', branch_class: 'session_raw_nonconsuming', exact_available_source_root: 'session_raw_material', required_sources: ['authority_opaque_raw_input_stores', 'session_hold_evidence_schema.variants.raw_non_consuming'], forbidden_unavailable_sources: ['authority_operation_receipt_precommit_identity_plans', 'session_dual_proof_bundle_truth_projection_schema', 'case_session_authority_read_set_schema', 'proof_nonce_ledger', 'proof_nonce_receipt_store', 'final_receipt_fingerprint'], rules: rawRules },
}
r37.authority_operation_identity_derivation_rules = { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules.r37.v1', authority_marker: 'normative_control', normative: true, local_schema_ref: 'authority_operation_identity_dependency_graph', local_schema_version: 'ctrl.g24.authority-operation-identity-dependency-graph.r37.v1', type: 'discriminated_branch_dependency_rules', discriminator: 'branch_class', exact_variants: branchClasses, variants, every_source_ref_must_resolve: true, unavailable_cross_branch_dependency: 'forbidden', selected_branch_table_ref: 'authority_operation_fresh_branch_class_selection' }
const buildGraph = rules => ({ nodes: Object.keys(rules), edges: Object.entries(rules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target])) })
const graphs = Object.fromEntries(Object.entries(variants).map(([branchClass, variant]) => [branchClass, { schema_version: `ctrl.g24.authority-operation-identity-dependency-graph-${branchClass.replaceAll('_', '-')}.r37.v1`, branch_class: branchClass, ...buildGraph(variant.rules), generated_only_from: `authority_operation_identity_derivation_rules.variants.${branchClass}.rules.*.depends_on`, all_rule_dependencies_available_in_this_branch: true, filtered_edge_construction: 'forbidden', generic_cycle_detection_required: true, exact_transitive_dependency_closure_required: true }]))
r37.authority_operation_identity_dependency_graph = { schema_version: 'ctrl.g24.authority-operation-identity-dependency-graph.r37.v1', type: 'discriminated_branch_dependency_graph', discriminator: 'branch_class', exact_variants: branchClasses, variants: graphs, no_singular_conjunctive_graph: true, hidden_filtered_edges: 'forbidden', selected_graph_must_equal_selected_rules_exactly: true, every_selected_node_must_include_all_direct_and_transitive_dependencies: true }
const issuance = (branchClass, extras = {}) => ({ ...graphs[branchClass], schema_version: `ctrl.g24.authority-operation-${branchClass.replaceAll('_', '-')}-issuance-dag.r37.v1`, branch_class: branchClass, selected_branch_table_ref: 'authority_operation_fresh_branch_class_selection', generated_directly_from_selected_branch_rules: true, unavailable_nodes_or_filtered_edges: 'forbidden', ...extras, acyclic_required: true })
r37.authority_operation_committed_issuance_dag = issuance('committed')
r37.authority_operation_ordinary_held_issuance_dag = issuance('ordinary_held', { session_evidence: 'forbidden' })
r37.authority_operation_session_verified_consuming_issuance_dag = issuance('session_verified_consuming', { exact_nonce_rows: 2, evidence_variant_ref: 'session_hold_evidence_schema.variants.verified_consuming' })
r37.authority_operation_session_raw_nonconsuming_issuance_dag = issuance('session_raw_nonconsuming', { exact_nonce_rows: 0, evidence_variant_ref: 'session_hold_evidence_schema.variants.raw_non_consuming', truth_projection_read_set_and_nonce: 'forbidden' })
delete r37.authority_operation_session_held_issuance_dag

const paths = {
  committed: ['resolve_exact_committed_registry_row', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response'],
  ordinary_held: ['resolve_exact_held_registry_row', 'resolve_exact_hold_row', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response'],
  session_verified_consuming: ['resolve_exact_held_registry_row', 'resolve_exact_hold_row', 'resolve_exact_verified_session_hold_evidence', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response'],
  session_raw_nonconsuming: ['resolve_exact_held_registry_row', 'resolve_exact_hold_row', 'resolve_exact_raw_session_hold_evidence', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'resolve_exact_replay_payload_artifact', 'resolve_exact_replay_envelope_artifact', 'return_exact_original_response'],
}
const dagRefs = { committed: 'authority_operation_committed_issuance_dag', ordinary_held: 'authority_operation_ordinary_held_issuance_dag', session_verified_consuming: 'authority_operation_session_verified_consuming_issuance_dag', session_raw_nonconsuming: 'authority_operation_session_raw_nonconsuming_issuance_dag' }
r37.authority_operation_replay_branch_map = { schema_version: 'ctrl.g24.authority-operation-replay-branch-map.r37.v1', authority_marker: 'normative_control', normative: true, local_schema_ref: 'authority_operation_replay_derivation', local_schema_version: 'ctrl.g24.authority-operation-replay-derivation.r37.v1', discriminator: 'persisted_registry_branch_class', exact_variants: branchClasses, variants: Object.fromEntries(branchClasses.map(branchClass => [branchClass, { original_issuance_dag_ref: dagRefs[branchClass], replay_path: paths[branchClass], exact_first_authority: branchClass === 'committed' ? 'resolve_exact_committed_registry_row' : 'resolve_exact_held_registry_row', replay_order_rules: ['registry_authority_first', 'resolve_exact_result_artifact_before_historical_response', 'resolve_exact_replay_payload_artifact_before_replay_envelope_artifact', 'return_only_after_exact_envelope_resolution'] }])), replay_classifier_ref: 'authority_operation_replay_classifier', branch_class_derivation: 'read_persisted_R37_selection_fields_from_exact_original_registry_then_select_exactly_one_classifier_row_or_hold', current_selector_table_reinterpretation: 'forbidden', source_precedence: ['exact_original_registry', 'exact_hold_row_when_held', 'exact_session_evidence_when_session_held', 'selected_result_artifact', 'historical_response_artifact', 'replay_payload_artifact', 'replay_envelope_artifact'], anti_splice: 'all_operation_branch_selection_hold_evidence_result_history_payload_and_envelope_fields_must_share_one_original_registry_lineage', result_resolution_order: 'registry_and_hold_first_then_result_then_history_then_payload_then_envelope' }

const replayRows = selectionRows.map(row => ({ classifier_row_id: `${row.selection_row_id}|replay`, operation_name: row.operation_name, result_branch: row.result_branch, persisted_selection_row_id_source: 'selected_original_registry.fresh_selection_row_id', persisted_proof_family_source: 'selected_original_registry.proof_family', persisted_branch_class_source: 'selected_original_registry.branch_class', persisted_evidence_kind_source: 'selected_original_registry.evidence_kind', persisted_selector_version_source: 'selected_original_registry.fresh_selection_schema_version', expected_proof_family: row.proof_family, expected_branch_class: row.branch_class, expected_evidence_kind: row.evidence_kind, expected_selector_version: row.selector_schema_version, held_registry_hold_schema_ref: row.hold_schema_ref, session_evidence_schema_ref: row.session_evidence_schema_ref, original_issuance_dag_ref: row.issuance_dag_ref, replay_path_ref: `authority_operation_replay_branch_map.variants.${row.branch_class}.replay_path` }))
const replayRowProperties = { classifier_row_id: id, operation_name: { enum: operationNames }, result_branch: { enum: ['committed', ...heldBranches] }, persisted_selection_row_id_source: { const: 'selected_original_registry.fresh_selection_row_id' }, persisted_proof_family_source: { const: 'selected_original_registry.proof_family' }, persisted_branch_class_source: { const: 'selected_original_registry.branch_class' }, persisted_evidence_kind_source: { const: 'selected_original_registry.evidence_kind' }, persisted_selector_version_source: { const: 'selected_original_registry.fresh_selection_schema_version' }, expected_proof_family: { enum: proofFamilies }, expected_branch_class: { enum: branchClasses }, expected_evidence_kind: { enum: evidenceKinds }, expected_selector_version: { const: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1' }, held_registry_hold_schema_ref: { type: 'identifier_or_UNAVAILABLE_literal' }, session_evidence_schema_ref: { type: 'identifier_or_UNAVAILABLE_literal' }, original_issuance_dag_ref: id, replay_path_ref: id }
r37.authority_operation_replay_classifier = { schema_version: 'ctrl.g24.authority-operation-replay-classifier.r37.v1', authority_marker: 'normative_control', normative: true, local_schema_ref: 'authority_operation_replay_branch_map', local_schema_version: r37.authority_operation_replay_branch_map.schema_version, row_schema: closed('ctrl.g24.authority-operation-replay-classifier-row.r37.v1', replayRowProperties, { caller_writable_fields: [], fallback_or_default: 'forbidden', source_semantics: 'all_branch_identity_fields_come_from_exact_original_registry_R37_fields_never_current_selector_reinterpretation' }), unique_keys: [['classifier_row_id'], ['operation_name', 'result_branch', 'expected_selector_version']], rows: replayRows, exact_expected_rows: 90, registry_first: true, current_selector_lookup: 'forbidden', classification_failure: 'hold_without_disclosure_or_write' }
r37.authority_operation_replay_derivation = { ...r37.authority_operation_replay_derivation, schema_version: 'ctrl.g24.authority-operation-replay-derivation.r37.v1', replay_classifier_ref: 'authority_operation_replay_classifier', replay_branch_map_ref: 'authority_operation_replay_branch_map', registry_authority_first: true, exact_path_vocabulary: [...new Set(Object.values(paths).flat())], exact_path_order_by_branch_ref: 'authority_operation_replay_branch_map.variants.*.replay_path', source_precedence_ref: 'authority_operation_replay_branch_map.source_precedence', anti_splice_ref: 'authority_operation_replay_branch_map.anti_splice', current_selector_reinterpretation: 'forbidden' }

r37.authority_operation_serializable_branch_transaction.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r37.v1'
r37.authority_operation_serializable_branch_transaction.fresh_branch_selection_ref = 'authority_operation_fresh_branch_class_selection'
r37.authority_operation_serializable_branch_transaction.selected_branch_row_identity_fields = Object.keys(selectorRowProperties)
r37.authority_operation_serializable_branch_transaction.session_verified_consuming_issuance_dag_ref = 'authority_operation_session_verified_consuming_issuance_dag'
r37.authority_operation_serializable_branch_transaction.session_raw_nonconsuming_issuance_dag_ref = 'authority_operation_session_raw_nonconsuming_issuance_dag'
delete r37.authority_operation_serializable_branch_transaction.session_held_issuance_dag_ref
r37.authority_operation_serializable_branch_transaction.session_branch_effects = { session_verified_consuming: { result_branches: verifiedBranches, nonce_rows: 2, authority_read_set: 'required', truth_projection: 'required', evidence_schema_ref: 'session_hold_evidence_schema.variants.verified_consuming' }, session_raw_nonconsuming: { result_branches: rawBranches, nonce_rows: 0, authority_read_set: 'forbidden', truth_projection: 'forbidden', evidence_schema_ref: 'session_hold_evidence_schema.variants.raw_non_consuming' } }
r37.authority_operation_serializable_branch_transaction.atomicity = 'select_exact_closed_R37_row_persist_selection_identity_execute_only_exact_branch_sources_and_DAG_then_commit_all_or_none'

// Replace mutable flag enumeration with one independent frozen authority manifest.
delete r37.normative_authority_registry
const authorityPaths = ['authority_operation_historical_response_binding_authority', 'authority_operation_fresh_branch_class_selection', 'authority_operation_identity_derivation_rules', 'authority_operation_replay_classifier', 'authority_operation_replay_branch_map']
r37.authority_operation_historical_response_binding_authority.schema_version = 'ctrl.g24.authority-operation-historical-response-binding-authority.r37.v1'
r37.authority_operation_historical_response_binding_authority.authority_marker = 'normative_control'
for (const path of authorityPaths) { r37[path].normative = true; r37[path].authority_marker = 'normative_control' }
const manifestRows = authorityPaths.map(path => ({ authority_path: path, authority_schema_ref: path, authority_schema_version: r37[path].schema_version, local_schema_ref: r37[path].local_schema_ref, local_schema_version: r37[path].local_schema_version, authority_object_sha256: sha(JSON.stringify(r37[path])) }))
const manifestRowProperties = { authority_path: id, authority_schema_ref: id, authority_schema_version: id, local_schema_ref: id, local_schema_version: id, authority_object_sha256: fp }
r37.normative_authority_frozen_manifest = { schema_version: 'ctrl.g24.normative-authority-frozen-manifest.r37.v1', type: 'independently_declared_frozen_authority_manifest', row_schema: closed('ctrl.g24.normative-authority-frozen-manifest-row.r37.v1', manifestRowProperties, { caller_writable_fields: [], source_semantics: 'checker_pinned_exact_path_schema_local_schema_version_and_object_hash' }), exact_paths: authorityPaths, rows: manifestRows, expected_count_source: 'length_of_checker_pinned_exact_paths_not_candidate_flags_or_candidate_count', recursive_scan_predicate: 'every_object_with_normative_true_or_authority_marker_or_sole_active_authority_must_be_exactly_manifested; this_manifest_is_the_only_exact_scanner_root_exception', unmanifested_nested_or_unmarked_authority: 'reject_materialization_and_hold_runtime', missing_stale_duplicate_or_hash_mismatch: 'reject_materialization_and_hold_runtime' }

r37.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r37.v1', derivation: 'bounded_exact_extension_from_frozen_R36_to_R37_split_session_hold_classes_persisted_selection_closed_controls_independent_authority_manifest_and_registry_first_replay', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.authority_operation_fresh_branch_class_selection', '$.authority_operation_registry', '$.authority_operation_hold_store', '$.authority_operation_identity_derivation_rules', '$.authority_operation_identity_dependency_graph', '$.authority_operation_committed_issuance_dag', '$.authority_operation_ordinary_held_issuance_dag', '$.authority_operation_session_verified_consuming_issuance_dag', '$.authority_operation_session_raw_nonconsuming_issuance_dag', '$.authority_operation_replay_branch_map', '$.authority_operation_replay_classifier', '$.authority_operation_replay_derivation', '$.authority_operation_serializable_branch_transaction', '$.authority_operation_historical_response_binding_authority', '$.normative_authority_frozen_manifest'], removed_semantic_paths: ['$.authority_operation_session_held_issuance_dag', '$.normative_authority_registry'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r37_identifier: true, frozen_parent_core_must_remain_byte_identical: true }
r37.required_negative_fixture_families = [...new Set([...r37.required_negative_fixture_families, 'session_verified_raw_split', 'persisted_branch_classification', 'closed_control_rows', 'independent_authority_manifest', 'registry_first_replay_vocabulary'])]
r37.visible_surface_changes = []
r37.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r37)
export const materializedR37 = r37
export const materializedR37Output = `${JSON.stringify(r37, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR37Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR37Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R37 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
