import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR37 } from './materialize-ctrl-g24-trusted-ingress-r37.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r37.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r38.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r38 = structuredClone(materializedR37)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const id = { type: 'identifier' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)); const right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function canonical(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
function domainHash(domain, version, path, payload) { return sha(Buffer.from(`${domain}\u001f${version}\u001f${path}\u001f${canonical(payload)}`, 'utf8')) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }

r38.schema_version = 'ctrl.g24.trusted-ingress.r38.effective.v1'
r38.status = 'thirty_eighth_repair_candidate_under_independent_review'
r38.supersedes = { commit: '2e9feb68809ff9238490b3a4283ff64ddfc59768', tree: 'f16fa5e8d9ef8cae053989cb853c53fa2c4b68de', human_blob: '0e58e93def26767078beb293b59d539f77ba8485', machine_blob: '50a1e34efa3bf87fc352202fd88f83a331766c37', qa_blob: 'f497961b647ab45fda96ce6933ce8fa0a247fed8', checker_blob: 'b9b41fd90300c11c476aa26e4c9e140abc9bb78e', materializer_blob: 'cbf55da5c40667a3deed91ee3d9dce5b9db586b5', founder_checker_blob: 'f0be47a00af5afc71887d924ce39710821806e67', adjudication: 'veto' }
r38.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r38.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const durableFields = ['fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']
const bindingRows = durableFields.map(field => ({
  durable_field: field,
  committed_registry_source: `authority_operation_registry.row_union.variants.original_committed.${field}`,
  held_registry_source: `authority_operation_registry.row_union.variants.original_persisted_hold.${field}`,
  held_hold_row_source: `authority_operation_hold_store.row_union.selected_variant.${field}`,
  replay_classifier_expected_field: field === 'fresh_selection_row_id' ? 'classifier_row_id_prefix_before_|replay' : field === 'fresh_selection_schema_version' ? 'expected_selector_version' : `expected_${field}`,
  equality: 'byte_for_byte_or_hold_without_disclosure_or_write',
}))

const registryAuthority = r38.authority_operation_replay_registry_authority
registryAuthority.schema_version = 'ctrl.g24.authority-operation-replay-registry-authority.r38.v1'
registryAuthority.type = 'closed_replay_registry_authority_control'
registryAuthority.durable_selection_bindings = bindingRows
registryAuthority.committed = [...registryAuthority.committed, ...durableFields.map(field => ({ payload_field: field, registry_field: field }))]
registryAuthority.held = [...registryAuthority.held, ...durableFields.map(field => ({ payload_field: field, registry_field: field }))]
registryAuthority.held_hold_row_equalities = [...registryAuthority.held_hold_row_equalities, ...durableFields.map(field => ({ registry_field: field, hold_field: field }))]
registryAuthority.source_precedence = ['authoritative_registry', 'authoritative_hold_when_held', 'durable_selection_fields', 'session_evidence_when_session_held', 'selected_result_artifact', 'historical_response_artifact', 'replay_payload_artifact', 'replay_envelope_artifact']
registryAuthority.abc_splice_rule = 'every_resolved_operation_id_operation_name_branch_all_five_durable_selection_fields_hold_evidence_result_history_payload_and_envelope_identity_must_equal_one_original_registry_lineage_or_hold_without_disclosure'
registryAuthority.binding_authority_ref = 'authority_operation_replay_resolution_bindings'

const resolutionBindings = r38.authority_operation_replay_resolution_bindings
resolutionBindings.schema_version = 'ctrl.g24.authority-operation-replay-resolution-bindings.r38.v1'
resolutionBindings.type = 'closed_replay_resolution_binding_control'
resolutionBindings.durable_selection_bindings = bindingRows
resolutionBindings.registry_authority_ref = 'authority_operation_replay_registry_authority'
resolutionBindings.source_precedence_ref = 'authority_operation_replay_registry_authority.source_precedence'
resolutionBindings.anti_splice_ref = 'authority_operation_replay_registry_authority.abc_splice_rule'
resolutionBindings.exact_binding_fields = durableFields
resolutionBindings.caller_supplied_registry_authority_ref = 'forbidden'
resolutionBindings.caller_supplied_binding_authority_ref = 'forbidden'

r38.authority_operation_replay_derivation = {
  ...r38.authority_operation_replay_derivation,
  schema_version: 'ctrl.g24.authority-operation-replay-derivation.r38.v1',
  binding_authority_ref: 'authority_operation_replay_resolution_bindings',
  registry_authority_ref: 'authority_operation_replay_registry_authority',
  binding_authority_version: resolutionBindings.schema_version,
  registry_authority_version: registryAuthority.schema_version,
  durable_selection_fields: durableFields,
  durable_selection_source: 'exact_original_registry_then_exact_hold_row_when_held_then_classifier_expected_fields',
  caller_precedence: 'forbidden',
}

r38.authority_operation_replay_branch_map = {
  ...r38.authority_operation_replay_branch_map,
  schema_version: 'ctrl.g24.authority-operation-replay-branch-map.r38.v1',
  local_schema_version: 'ctrl.g24.authority-operation-replay-derivation.r38.v1',
  registry_authority_ref: 'authority_operation_replay_registry_authority',
  binding_authority_ref: 'authority_operation_replay_resolution_bindings',
  durable_selection_fields: durableFields,
  source_precedence: registryAuthority.source_precedence,
  anti_splice: registryAuthority.abc_splice_rule,
}
r38.authority_operation_replay_classifier = {
  ...r38.authority_operation_replay_classifier,
  schema_version: 'ctrl.g24.authority-operation-replay-classifier.r38.v1',
  local_schema_version: 'ctrl.g24.authority-operation-replay-branch-map.r38.v1',
  registry_authority_ref: 'authority_operation_replay_registry_authority',
  binding_authority_ref: 'authority_operation_replay_resolution_bindings',
  durable_selection_fields: durableFields,
}

r38.proof_authority = { schema_version: 'ctrl.g24.proof-authority.r38.v1', ...r38.proof_authority, caller_supplied_proof_bundle_allowed: false, browser_serializable_proof_bundle_allowed: false, caller_precedence: 'forbidden' }
r38.operation_authority = { schema_version: 'ctrl.g24.operation-authority.r38.v1', ...r38.operation_authority, caller_selectable_operation: false, use_release_authority: 'named_leader_predicate_only', caller_precedence: 'forbidden' }
r38.outbox = { schema_version: 'ctrl.g24.outbox.r38.v1', ...r38.outbox, authoritative_state: 'derived_from_append_only_claim_reservation_dispatch_terminal_and_reconciliation_events', provider_callback_authoritative_state: false, caller_precedence: 'forbidden' }

for (const [branchClass, suffix] of [['committed', 'committed'], ['ordinary_held', 'ordinary-held'], ['session_verified_consuming', 'session-verified-consuming'], ['session_raw_nonconsuming', 'session-raw-nonconsuming']]) {
  const key = branchClass === 'committed' ? 'authority_operation_committed_issuance_dag' : `authority_operation_${branchClass}_issuance_dag`
  r38[key] = { ...r38[key], schema_version: `ctrl.g24.authority-operation-${suffix}-issuance-dag.r38.v1`, runtime_authority: 'exact_selected_branch_DAG_only', caller_precedence: 'forbidden' }
}
r38.authority_operation_session_verified_consuming_issuance_dag.exact_nonce_rows = 2
r38.authority_operation_session_verified_consuming_issuance_dag.evidence_variant_ref = 'session_hold_evidence_schema.variants.verified_consuming'
r38.authority_operation_session_raw_nonconsuming_issuance_dag.exact_nonce_rows = 0
r38.authority_operation_session_raw_nonconsuming_issuance_dag.evidence_variant_ref = 'session_hold_evidence_schema.variants.raw_non_consuming'
r38.authority_operation_session_raw_nonconsuming_issuance_dag.truth_projection_read_set_and_nonce = 'forbidden'

r38.authority_operation_serializable_branch_transaction = {
  ...r38.authority_operation_serializable_branch_transaction,
  schema_version: 'ctrl.g24.authority-operation-serializable-branch-transaction.r38.v1',
  branch_write_set_authority: 'exact_selected_R38_branch_class_and_result_branch_only',
  caller_precedence: 'forbidden',
  replay_registry_authority_ref: 'authority_operation_replay_registry_authority',
  replay_resolution_bindings_ref: 'authority_operation_replay_resolution_bindings',
}
r38.authority_operation_serializable_branch_transaction.branch_write_set_row_schema = closed('ctrl.g24.authority-operation-branch-write-set-row.r38.v1', {
  branch: id,
  ordinary_nonce_rows: { type: 'nonnegative_integer' },
  session_nonce_rows: { type: 'nonnegative_integer' },
  required: { type: 'ordered_identifier_array' },
  forbidden: { type: 'ordered_identifier_array' },
}, { optional: ['forbidden'], caller_writable_fields: [], fallback_or_default: 'forbidden' })
r38.authority_operation_serializable_branch_transaction.session_branch_effects.session_verified_consuming = { result_branches: ['stale_head_hold', 'invalid_target_hold'], nonce_rows: 2, authority_read_set: 'required', truth_projection: 'required', evidence_schema_ref: 'session_hold_evidence_schema.variants.verified_consuming', exact_write_set_source: 'branch_write_sets.stale_head_hold_or_invalid_target_hold' }
r38.authority_operation_serializable_branch_transaction.session_branch_effects.session_raw_nonconsuming = { result_branches: ['authorization_hold', 'invalid_proof_hold', 'internal_failure_hold'], nonce_rows: 0, authority_read_set: 'forbidden', truth_projection: 'forbidden', evidence_schema_ref: 'session_hold_evidence_schema.variants.raw_non_consuming', exact_write_set_source: 'branch_write_sets.authorization_hold_or_invalid_proof_hold_or_internal_failure_hold' }

const canonicalManifestHashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r38.v1'
r38.authority_runtime_semantic_manifest_hash_contract = {
  schema_version: canonicalManifestHashVersion,
  domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-AUTHORITY-MANIFEST-R38',
  dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-AUTHORITY-DEPENDENCIES-R38',
  graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-AUTHORITY-GRAPH-R38',
  field_separator: 'U+001F',
  canonical_codec_ref: 'canonical_json_utf8_encoding',
  canonical_object_key_order: 'unicode_code_point_ascending',
  canonical_array_order: 'preserved',
  canonical_scalar_encoding: 'JSON_scalar_no_whitespace_UTF8',
  content_preimage_order: ['domain_ascii', 'manifest_hash_version', 'authority_path', 'canonical_authority_object'],
  dependency_preimage_order: ['dependency_domain_ascii', 'manifest_hash_version', 'authority_path', 'canonical_sorted_dependency_path_and_content_hash_rows'],
  graph_preimage_order: ['graph_domain_ascii', 'manifest_hash_version', 'canonical_manifest_rows'],
  insertion_order_JSON_stringify: 'forbidden',
}

// This literal list is the independent membership authority. It is deliberately not
// discovered from candidate flags, schema names, markers or candidate row counts.
const semanticAuthorityPaths = `
authority
scope
base_types
request_admission
rejection_codes
request_rejected_schema
principal_schemas
case_authority_bindings
derived_authority_predicates
operation_authority
workload_authority_predicates
lifecycle_authority
approval_effects
operation_registry
held_evaluation_fingerprint
response_union
operation_names
hold_codes
result_payload_schemas
evaluator_abi
proof_bundle_schemas
proof_family_names
set_seals
set_seal_object_schema
set_seal_encoding
scalar_version_rule
snapshot_and_cas_by_operation
snapshot_cas_rule
resolver_capability
proof_registry
provider_capability_schema
outbox
limit_order
limits
limit_semantics
claim_limit
canonical_grammar
shared_schemas
request_schema
operation_specs
controlling_watermarks
all_thirteen_set_seals
set_member_identity_projections
set_member_identity_encoding
snapshot_encoding
proof_lineage
proof_bundle_digest
proof_authority
fingerprint_schemas
intervention_visibility_receipt_schema
type_registry
canonical_field_encoding
presentation_challenge_schema
presentation_protocol
authoritative_row_schemas
presentation_challenge_issuance_predicate
presentation_acknowledgement_predicate
presentation_acknowledgement_collision
intervention_visibility_consumption_schema
authoritative_row_fingerprint_schemas
proof_set_schemas
visibility_stable_attestation_projection_schema
visibility_secondary_idempotency
proof_member_schemas
proof_member_fingerprint_schemas
authoritative_semantic_fingerprint_schemas
proof_value_schemas
lifecycle_precondition_catalog
canonical_encoding_conformance
selector_derivation
approval_authority_derivation
answer_derivation
lifecycle_exact_derivation
watermark_change_derivation
release_authority_issuance_order
answer_principal_derivation
case_identity_derivation
provider_target_schema
provider_target_derivation
release_terminal_consumption_derivation
lifecycle_evaluator_version_derivation
question_kernel_exact_retirement_reference_rule
lifecycle_vocabulary_contract
operation_result_blob_store
canonical_json_utf8_encoding
operation_result_schema_derivation
operation_response_blob_store
case_authority_control_plane
case_authority_control_operation_registry
declared_reference_resolution_contract
release_terminal_receipt_authority
lifecycle_single_action_role_derivation
case_authority_control_result_union
release_terminal_precommit_identity_schema
release_terminal_issuance_dependency_dag
release_terminal_outcome_derivation
operation_hold_blob_store
case_authority_control_session_actor_derivation
case_authority_control_pre_admission
case_authority_control_hold_fingerprints
case_authority_control_session_snapshot
case_authority_control_session_branch_equalities
case_authority_control_unavailable_sentinel
case_authority_control_correlation_id_schema
case_authority_control_hold_input_schemas
server_presented_principal_projection_schema
server_presented_principal_projection_derivation
case_session_authority_store_control_schema
case_session_authority_store_controls
case_session_authority_read_set_schema
case_authority_control_receipt_authority_audit
case_authority_control_hold_dependency_projection_map
closed_actions
canonical_schema_serialization
deployment_trust_configuration_schema
case_session_root_trust_anchor_authority
case_session_authority_transition_tables
case_session_authority_operation_protocols
live_principal_assertion_schema
live_principal_assertion_verification
canonical_field_codecs
canonical_field_codec_definition_schema
case_session_root_bootstrap_proof_schema
case_session_issuer_capability_proof_schema
case_session_evaluator_capability_proof_schema
authority_proof_verification
authority_operation_registry
authority_operation_receipt_store
principal_authority_artifact_stores
authority_partition_head_store
case_session_root_admin_capability_proof_schema
proof_signed_preimages
target_partition_fingerprint_schema
proof_nonce_ledger
authority_operation_hold_store
authority_operation_artifact_stores
case_session_root_trust_anchors_partition_schema
case_session_issuer_registry_partition_schema
case_session_evaluator_registry_partition_schema
account_stable_actor_bindings_partition_schema
account_access_standings_partition_schema
case_server_session_principal_evidence_partition_schema
authority_order_protocol
bootstrap_verifier_set_fingerprint
authority_collision_response_schema
authority_collision_projection
session_dual_proof_bundle_schema
session_dual_proof_receipt_evidence_schema
authority_opaque_raw_input_stores
session_dual_proof_bundle_artifact_store
session_dual_proof_receipt_evidence_store
authority_operation_replay_payload_schema
authority_operation_replay_payload_artifact_store
authority_operation_replay_envelope_schema
authority_operation_replay_derivation
proof_nonce_receipt_payload_schema
proof_nonce_receipt_store
case_session_authority_read_set_artifact_store
authority_operation_replay_envelope_artifact_store
authority_operation_pre_materialized_replay_lookup_store
authority_operation_serializable_branch_transaction
frozen_parent_identity_chain
session_dual_proof_bundle_truth_projection_schema
session_dual_proof_bundle_truth_projection_artifact_store
session_dual_proof_bundle_truth_projection_derivation
session_hold_evidence_schema
session_hold_evidence_artifact_store
authority_operation_historical_response_schema
authority_operation_historical_response_artifact_store
authority_operation_replay_store_authority
held_result_identity_migration
session_dual_proof_projection_formula_table
session_hold_evidence_equality_tables
authority_operation_historical_response_schema_matrix
schema_operand_resolution_contract
session_dual_nonce_row_equality_tables
authority_operation_replay_resolution_bindings
authority_operation_receipt_precommit_identity_plans
authority_operation_identity_dependency_graph
authority_operation_committed_issuance_dag
authority_operation_replay_registry_authority
held_timestamp_equality_contract
session_dual_nonce_bundle_join_contract
semantic_clause_hygiene
authority_operation_result_artifact_binding_coverage
authority_operation_identity_derivation_rules
authority_operation_historical_response_binding_authority
authority_operation_ordinary_held_issuance_dag
authority_operation_replay_branch_map
authority_operation_fresh_branch_class_selection
authority_operation_replay_classifier
authority_operation_session_verified_consuming_issuance_dag
authority_operation_session_raw_nonconsuming_issuance_dag
authority_runtime_semantic_manifest_hash_contract`.trim().split('\n')

delete r38.normative_authority_frozen_manifest
const semanticSet = new Set(semanticAuthorityPaths)
function stringsIn(value, out = []) { if (typeof value === 'string') out.push(value); else if (Array.isArray(value)) value.forEach(item => stringsIn(item, out)); else if (value && typeof value === 'object') Object.values(value).forEach(item => stringsIn(item, out)); return out }
function directDependencies(path) { const value = resolvePath(r38, path); const dependencies = new Set(); for (const text of stringsIn(value)) { const first = text.replace(/^\$\./, '').split('.')[0]; if (semanticSet.has(first) && first !== path) dependencies.add(first) } return [...dependencies].sort(codePointCompare) }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r38.v1` }
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => { const value = resolvePath(r38, path); if (value === undefined) throw new Error(`missing semantic authority path:${path}`); return [path, domainHash(r38.authority_runtime_semantic_manifest_hash_contract.domain_ascii, canonicalManifestHashVersion, path, value)] }))
const directGraph = Object.fromEntries(semanticAuthorityPaths.map(path => [path, directDependencies(path)]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of directGraph[current]) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
const manifestRows = semanticAuthorityPaths.map(path => {
  const value = resolvePath(r38, path)
  const dependencies = directGraph[path]
  const dependencyRows = dependencies.map(dependencyPath => ({ authority_path: dependencyPath, authority_content_sha256: contentHashes[dependencyPath] }))
  const transitiveRows = transitive(path).map(dependencyPath => ({ authority_path: dependencyPath, authority_content_sha256: contentHashes[dependencyPath] }))
  return {
    authority_path: path,
    semantic_kind: kindOf(value),
    exact_keyset: keysetOf(value),
    authority_schema_ref: path,
    authority_schema_version: semanticVersion(path, value),
    direct_dependency_paths: dependencies,
    direct_dependency_content_hashes: dependencyRows,
    direct_dependency_set_sha256: domainHash(r38.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, canonicalManifestHashVersion, path, dependencyRows),
    transitive_dependency_paths: transitiveRows.map(row => row.authority_path),
    transitive_dependency_content_hashes: transitiveRows,
    transitive_dependency_set_sha256: domainHash(r38.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, canonicalManifestHashVersion, `${path}:transitive`, transitiveRows),
    authority_content_sha256: contentHashes[path],
  }
})
const manifestRowSchema = closed('ctrl.g24.runtime-semantic-authority-manifest-row.r38.v1', {
  authority_path: id,
  semantic_kind: { enum: ['object', 'array', 'string', 'number', 'boolean', 'null'] },
  exact_keyset: { type: 'ordered_string_array' },
  authority_schema_ref: id,
  authority_schema_version: id,
  direct_dependency_paths: { type: 'unicode_sorted_identifier_array' },
  direct_dependency_content_hashes: { type: 'ordered_dependency_hash_row_array' },
  direct_dependency_set_sha256: fp,
  transitive_dependency_paths: { type: 'unicode_sorted_identifier_array' },
  transitive_dependency_content_hashes: { type: 'ordered_dependency_hash_row_array' },
  transitive_dependency_set_sha256: fp,
  authority_content_sha256: fp,
}, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
r38.authority_runtime_semantic_manifest = {
  schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r38.v1',
  type: 'independently_pinned_exhaustive_runtime_semantic_authority_manifest',
  hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract',
  row_schema: manifestRowSchema,
  exact_paths: semanticAuthorityPaths,
  rows: manifestRows,
  exact_expected_count: semanticAuthorityPaths.length,
  membership_source: 'checker_and_materializer_independent_literal_paths_not_candidate_markers_names_or_counts',
  nested_coverage_rule: 'every_nested_runtime_semantic_object_is_covered_by_its_exact_manifested_top_level_ancestor_content_hash',
  recursive_authority_vocabulary_scan_rule: 'any_authority_control_precedence_caller_writer_transaction_derivation_evidence_write_set_replay_registry_binding_DAG_or_runtime_semantic_object_must_have_exactly_one_manifested_top_level_ancestor; metadata_roots_must_contain_none',
  unmanifested_or_multiply_covered_semantics: 'reject_materialization_and_hold_without_disclosure_or_write',
  manifest_graph_sha256: domainHash(r38.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, canonicalManifestHashVersion, 'authority_runtime_semantic_manifest.rows', manifestRows),
}

r38.schema_change_manifest = {
  schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r38.v1',
  derivation: 'bounded_exact_extension_from_frozen_R37_to_R38_full_transitive_runtime_authority_manifest_replay_selection_closure_and_exact_execution_controls',
  frozen_parent_sha256: sha(inputBytes),
  changed_semantic_paths: ['$', '$.operation_authority', '$.outbox', '$.proof_authority', '$.authority_operation_replay_registry_authority', '$.authority_operation_replay_resolution_bindings', '$.authority_operation_replay_derivation', '$.authority_operation_replay_branch_map', '$.authority_operation_replay_classifier', '$.authority_operation_serializable_branch_transaction', '$.authority_operation_committed_issuance_dag', '$.authority_operation_ordinary_held_issuance_dag', '$.authority_operation_session_verified_consuming_issuance_dag', '$.authority_operation_session_raw_nonconsuming_issuance_dag', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest'],
  removed_semantic_paths: ['$.normative_authority_frozen_manifest'],
  recursive_same_version_semantic_change: 'forbidden',
  every_changed_or_new_semantic_object_has_r38_identifier: true,
  frozen_parent_core_must_remain_byte_identical: true,
}
r38.required_negative_fixture_families = [...new Set([...r38.required_negative_fixture_families, 'transitive_runtime_authority_manifest', 'replay_durable_selection_closure', 'execution_authority_exactness', 'canonical_manifest_hashing', 'prior_core_immutability'])]
r38.visible_surface_changes = []
r38.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r38)
export const materializedR38 = r38
export const materializedR38Output = `${JSON.stringify(r38, null, 2)}\n`
export const canonicalR38 = canonical
export const r38SemanticAuthorityPaths = semanticAuthorityPaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR38Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR38Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R38 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
