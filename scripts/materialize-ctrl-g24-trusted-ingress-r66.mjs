import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR65, materializedR65Output, r65SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r65.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r65.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR65Output) throw new Error('R66_frozen_R65_input_mismatch')

const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => {
  const left = [...String(a)].map(char => char.codePointAt(0))
  const right = [...String(b)].map(char => char.codePointAt(0))
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]
  return left.length - right.length
}
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const same = (left, right) => canonicalR44(left) === canonicalR44(right)

const r66 = structuredClone(materializedR65)
r66.materialization = {
  ...r66.materialization,
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r66.mjs',
  frozen_input: { path: inputPath, sha256: sha(inputBytes) },
  schema_version: 'ctrl.g24.trusted-ingress-materialization.r66.v1',
  output_path: outputPath,
  strict_finalization_dag: [
    'freeze_R65_input',
    'retain_descriptor_executable_boundary_and_complete_frozen_registry_snapshot',
    'derive_closed_operation_class_vocabulary_from_exact_operation_names',
    'remove_nonoperation_trusted_ingress_alias_from_selection_state',
    'materialize_twenty_selection_queries_over_the_same_complete_snapshot',
    'filter_each_query_by_all_three_locked_selection_key_components',
    'bind_each_unique_match_to_exact_per_operation_export_compatibility',
    'bind_evaluate_selection_proof_into_frozen_lifecycle_lineage',
    'finalize_nonderived_authorities',
    'snapshot_final_semantic_sources',
    'derive_reference_owner_and_manifest',
    'seal_output',
  ],
}
r66.status = r66.status.filter(value => value !== 'trusted_ingress_r65_fully_materialized')
r66.status = r66.status.filter(value => value !== 'trusted_ingress_r1_through_r64_vetoed')
r66.status.push('trusted_ingress_r1_through_r65_vetoed', 'trusted_ingress_r66_fully_materialized')
r66.supersedes = {
  commit: '4880287a22a7fc101240a22a27a84b6731912aa4',
  tree: '0b6d16183cbf0ffe423c726db18ed6dc8b845a56',
  human_blob: 'b2403886f221640306d55704a544fee137788fd5',
  machine_blob: '8704aa493d7dbb372954cd31261d6628a1b2309f',
  qa_blob: '833f1725e200231087d187f151874cafdda2cfde',
  checker_blob: '0a9bdb76833eef36ddafa75ecc1bde776d9874e8',
  materializer_blob: '48c0906ec55a289c4dba7a566da7368d13fd0296',
  founder_checker_blob: '09dceb97c31e7bba120c48c94d58034d854785be',
  defense: 'pass',
  adjudication: 'veto',
}

const operations = Object.keys(r66.operation_specs).sort(cp)
if (operations.length !== 20) throw new Error('R66_operation_class_vocabulary_count')
if (!same(r66.evaluator_abi.selection_key, ['operation_class', 'policy_lineage_ref', 'evaluated_at'])) throw new Error('R66_locked_selection_key_changed')
r66.evaluator_abi.operation_class_schema = {
  schema_version: 'ctrl.g24.evaluator-operation-class.r66.v1',
  type: 'enum',
  values: operations,
  exact_vocabulary_derivation: 'codepoint_sorted_exact_keys_of_operation_specs',
  family_aliases: 'forbidden',
}
r66.evaluator_abi.registry_member_operation_class_applicability = {
  schema_version: 'ctrl.g24.evaluator-registry-member-operation-applicability.r66.v1',
  operation_class_schema_ref: 'evaluator_abi.operation_class_schema',
  source: 'exact_codepoint_sorted_keys_of_member_operation_result_exports',
  member_supports_operation_class_only_if: [
    'operation_class_is_an_exact_operation_name',
    'member_operation_result_exports_has_own_operation_class_key',
    'member_export_equals_operation_result_schema_and_evaluator_abi_export_for_that_operation_class',
  ],
  ambiguous_family_alias_or_claim_without_export: 'forbidden',
}

const parity = r66.authority_operation_evaluator_export_parity_proof
const registry = parity.complete_evaluator_registry_snapshot
const snapshotValue = structuredClone(registry.snapshot_value)
if (snapshotValue.operation_class !== 'trusted_ingress') throw new Error('R66_expected_R65_alias')
delete snapshotValue.operation_class
snapshotValue.schema_version = 'ctrl.g24.evaluator-registry-frozen-snapshot.r66.v1'
snapshotValue.operation_class_schema_ref = 'evaluator_abi.operation_class_schema'
snapshotValue.selection_key = structuredClone(r66.evaluator_abi.selection_key)
const snapshotBytes = Buffer.from(canonicalR44(snapshotValue), 'utf8')
const registrySnapshot = {
  ...registry,
  schema_version: 'ctrl.g24.evaluator-registry-snapshot-artifact.r66.v1',
  canonical_snapshot_bytes_b64url: snapshotBytes.toString('base64url'),
  canonical_snapshot_bytes_sha256: sha(snapshotBytes),
  snapshot_content_ref: sha(snapshotBytes),
  snapshot_value: snapshotValue,
}

const querySchema = {
  schema_version: 'ctrl.g24.evaluator-registry-selection-query.r66.v1',
  exact_keys: ['evaluated_at', 'operation_class', 'policy_lineage_ref', 'schema_version', 'selection_query_fingerprint'].sort(cp),
  required: ['schema_version', 'operation_class', 'policy_lineage_ref', 'evaluated_at', 'selection_query_fingerprint'],
  additional_properties: false,
  properties: {
    schema_version: { const: 'ctrl.g24.evaluator-registry-selection-query.r66.v1' },
    operation_class: { schema_ref: 'evaluator_abi.operation_class_schema' },
    policy_lineage_ref: { type: 'identifier' },
    evaluated_at: { type: 'canonical_timestamp' },
    selection_query_fingerprint: { type: 'sha256' },
  },
}
const proofSchema = {
  schema_version: 'ctrl.g24.evaluator-registry-selection-proof.r66.v1',
  exact_keys: [
    'compatible_metadata_selection_is_not_execution_authority',
    'evaluated_at',
    'operation_class',
    'policy_lineage_ref',
    'schema_version',
    'selected_match_count',
    'selected_member_content_ref',
    'selected_member_fingerprint',
    'selected_member_row_version_ref',
    'selected_result_schema_version',
    'selection_predicate',
    'selection_proof_fingerprint',
    'selection_query_fingerprint',
    'source_registry_set_seal',
    'source_snapshot_ref',
    'source_snapshot_sha256',
    'zero_or_multiple_match',
  ].sort(cp),
  required: [
    'schema_version',
    'selection_query_fingerprint',
    'operation_class',
    'policy_lineage_ref',
    'evaluated_at',
    'source_snapshot_ref',
    'source_snapshot_sha256',
    'source_registry_set_seal',
    'selected_match_count',
    'selected_member_content_ref',
    'selected_member_row_version_ref',
    'selected_member_fingerprint',
    'selected_result_schema_version',
    'selection_predicate',
    'zero_or_multiple_match',
    'compatible_metadata_selection_is_not_execution_authority',
    'selection_proof_fingerprint',
  ],
  additional_properties: false,
  properties: {
    schema_version: { const: 'ctrl.g24.evaluator-registry-selection-proof.r66.v1' },
    selection_query_fingerprint: { type: 'sha256' },
    operation_class: { schema_ref: 'evaluator_abi.operation_class_schema' },
    policy_lineage_ref: { type: 'identifier' },
    evaluated_at: { type: 'canonical_timestamp' },
    source_snapshot_ref: { type: 'sha256' },
    source_snapshot_sha256: { type: 'sha256' },
    source_registry_set_seal: { type: 'sha256' },
    selected_match_count: { const: 1 },
    selected_member_content_ref: { type: 'sha256' },
    selected_member_row_version_ref: { type: 'sha256' },
    selected_member_fingerprint: { type: 'sha256' },
    selected_result_schema_version: { type: 'identifier' },
    selection_predicate: { const: 'all_three_locked_selection_key_components_and_exact_per_operation_abi_export_compatibility' },
    zero_or_multiple_match: { const: 'deterministic_evaluator_artifact_hold_without_kernel_execution' },
    compatible_metadata_selection_is_not_execution_authority: { const: true },
    selection_proof_fingerprint: { type: 'sha256' },
  },
}
const queryFingerprintAuthority = {
  schema_version: 'ctrl.g24.evaluator-registry-selection-query-fingerprint.r66.v1',
  domain_ascii: 'CTRL-G24-EVALUATOR-REGISTRY-SELECTION-QUERY-R66',
  canonical_encoding: 'canonical_json_utf8_encoding',
  preimage_order: ['domain_ascii', 'selection_query_without_fingerprint'],
  digest: 'sha256_of_exact_preimage',
}
const proofFingerprintAuthority = {
  schema_version: 'ctrl.g24.evaluator-registry-selection-proof-fingerprint.r66.v1',
  domain_ascii: 'CTRL-G24-EVALUATOR-REGISTRY-SELECTION-PROOF-R66',
  canonical_encoding: 'canonical_json_utf8_encoding',
  preimage_order: ['domain_ascii', 'selection_proof_without_fingerprint'],
  digest: 'sha256_of_exact_preimage',
}
function matchesFor(query) {
  if (!operations.includes(query.operation_class)) return []
  return snapshotValue.members.filter(wrapper => {
    const member = wrapper.member_value
    return member.policy_lineage_ref === query.policy_lineage_ref &&
      member.active_from <= query.evaluated_at && query.evaluated_at < member.active_until &&
      Object.hasOwn(member.operation_result_exports, query.operation_class) &&
      member.operation_result_exports[query.operation_class] === r66.result_payload_schemas[query.operation_class].schema_version &&
      member.operation_result_exports[query.operation_class] === r66.evaluator_abi.operation_result_exports[query.operation_class] &&
      same(member.proof_family_exports, r66.evaluator_abi.proof_family_exports)
  })
}
const selectionRecords = operations.map(operation => {
  const queryCore = {
    schema_version: querySchema.schema_version,
    operation_class: operation,
    policy_lineage_ref: snapshotValue.policy_lineage_ref,
    evaluated_at: snapshotValue.evaluated_at,
  }
  const query = {
    ...queryCore,
    selection_query_fingerprint: hash({ domain_ascii: queryFingerprintAuthority.domain_ascii, selection_query_without_fingerprint: queryCore }),
  }
  const matches = matchesFor(query)
  if (matches.length !== 1) throw new Error(`R66_selection_not_unique:${operation}`)
  const selected = matches[0]
  const proofCore = {
    schema_version: proofSchema.schema_version,
    selection_query_fingerprint: query.selection_query_fingerprint,
    operation_class: operation,
    policy_lineage_ref: query.policy_lineage_ref,
    evaluated_at: query.evaluated_at,
    source_snapshot_ref: registrySnapshot.snapshot_content_ref,
    source_snapshot_sha256: registrySnapshot.canonical_snapshot_bytes_sha256,
    source_registry_set_seal: snapshotValue.evaluator_registry_set_seal.computed_set_seal,
    selected_match_count: matches.length,
    selected_member_content_ref: selected.member_content_ref,
    selected_member_row_version_ref: selected.member_row_version_ref,
    selected_member_fingerprint: selected.member_fingerprint,
    selected_result_schema_version: r66.result_payload_schemas[operation].schema_version,
    selection_predicate: 'all_three_locked_selection_key_components_and_exact_per_operation_abi_export_compatibility',
    zero_or_multiple_match: 'deterministic_evaluator_artifact_hold_without_kernel_execution',
    compatible_metadata_selection_is_not_execution_authority: true,
  }
  return {
    operation_class: operation,
    query,
    proof: {
      ...proofCore,
      selection_proof_fingerprint: hash({ domain_ascii: proofFingerprintAuthority.domain_ascii, selection_proof_without_fingerprint: proofCore }),
    },
  }
})
r66.authority_operation_evaluator_registry_selection = {
  schema_version: 'ctrl.g24.evaluator-registry-selection-authority.r66.v1',
  locked_selection_key: structuredClone(r66.evaluator_abi.selection_key),
  operation_class_vocabulary_schema_ref: 'evaluator_abi.operation_class_schema',
  member_applicability_ref: 'evaluator_abi.registry_member_operation_class_applicability',
  selection_query_schema: querySchema,
  selection_query_fingerprint_authority: queryFingerprintAuthority,
  selection_proof_schema: proofSchema,
  selection_proof_fingerprint_authority: proofFingerprintAuthority,
  complete_snapshot_ref: registrySnapshot.snapshot_content_ref,
  exact_operation_class_count: operations.length,
  exact_selection_record_count: selectionRecords.length,
  selection_records: selectionRecords,
  records_are_codepoint_sorted_by_operation_class: true,
  duplicate_missing_unknown_or_family_alias_operation_class: 'deterministic_evaluator_artifact_hold_without_kernel_execution',
  each_record_filters_the_entire_same_snapshot: true,
  every_locked_selection_key_component_is_authoritative: true,
}

r66.authority_operation_evaluator_export_parity_proof = {
  ...parity,
  schema_version: 'ctrl.g24.evaluator-export-parity-proof.r66.v1',
  complete_evaluator_registry_snapshot: registrySnapshot,
  current_evaluator_selection_derivation_ref: 'authority_operation_evaluator_registry_selection',
  required_compatible_metadata_match_count_per_operation: 1,
}
delete r66.authority_operation_evaluator_export_parity_proof.current_evaluator_selection_derivation
delete r66.authority_operation_evaluator_export_parity_proof.required_compatible_metadata_match_count_at_evaluated_at

const evaluateRecordIndex = selectionRecords.findIndex(record => record.operation_class === 'evaluate_lifecycle_preconditions')
if (evaluateRecordIndex < 0) throw new Error('R66_evaluate_selection_missing')
const evaluateSelectionRef = `authority_operation_evaluator_registry_selection.selection_records.${evaluateRecordIndex}.proof`
const evaluateSelection = selectionRecords[evaluateRecordIndex].proof
const ordering = structuredClone(r66.authority_operation_ordering_rule_registry)
ordering.schema_version = 'ctrl.g24.ordering-rule-registry.r66.v1'
ordering.matching_evidence_pair_authority = {
  ...ordering.matching_evidence_pair_authority,
  schema_version: 'ctrl.g24.resolved-evidence-pair-ordering.r66.v1',
  evaluator_registry_snapshot_ref: registrySnapshot.snapshot_content_ref,
  evaluator_registry_selection_ref: evaluateSelectionRef,
  evaluator_registry_selection_proof_fingerprint: evaluateSelection.selection_proof_fingerprint,
}
r66.authority_operation_ordering_rule_registry = ordering
const lifecycle = structuredClone(r66.authority_operation_lifecycle_precondition_result_proof)
lifecycle.schema_version = 'ctrl.g24.lifecycle-precondition-result-proof.r66.v1'
lifecycle.evaluator_registry_snapshot_ref = registrySnapshot.snapshot_content_ref
lifecycle.evaluator_registry_selection_ref = evaluateSelectionRef
lifecycle.evaluator_registry_selection_proof_fingerprint = evaluateSelection.selection_proof_fingerprint
r66.authority_operation_lifecycle_precondition_result_proof = lifecycle

r66.schema_change_manifest = {
  schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r66.v1',
  derivation: 'bounded_exact_extension_from_frozen_R65_operation_class_selection_key_repair',
  frozen_parent_sha256: sha(inputBytes),
  changed_semantic_paths: [
    '$',
    '$.materialization',
    '$.status',
    '$.supersedes',
    '$.evaluator_abi',
    '$.authority_operation_evaluator_registry_selection',
    '$.authority_operation_evaluator_export_parity_proof',
    '$.authority_operation_lifecycle_precondition_result_proof',
    '$.authority_operation_ordering_rule_registry',
    '$.required_negative_fixture_families',
    '$.authority_runtime_semantic_manifest_hash_contract',
    '$.authority_runtime_semantic_reference_field_registry',
    '$.authority_runtime_semantic_reference_owner_map',
    '$.authority_runtime_semantic_dependency_owner_map',
    '$.authority_runtime_semantic_manifest',
    '$.schema_change_manifest',
  ],
  repair_roots: [
    'operation_class_vocabulary_is_exactly_the_twenty_operation_names',
    'twenty_schema_valid_selection_queries_bind_all_three_locked_key_components',
    'each_query_filters_the_entire_same_sealed_snapshot_by_operation_policy_and_time',
    'member_applicability_is_derived_from_its_exact_per_operation_export_map',
    'each_selection_proof_binds_snapshot_set_seal_member_row_version_and_fingerprint',
  ],
  removed_semantic_paths: [
    '$.authority_operation_evaluator_export_parity_proof.complete_evaluator_registry_snapshot.snapshot_value.operation_class',
    '$.authority_operation_evaluator_export_parity_proof.current_evaluator_selection_derivation',
    '$.authority_operation_evaluator_export_parity_proof.required_compatible_metadata_match_count_at_evaluated_at',
  ],
  frozen_parent_core_must_remain_byte_identical: true,
  executable_behavior_claim_change: 'none_R65_fail_closed_boundary_preserved',
  runtime_database_ui_deployment_or_external_action: 'closed',
}
r66.required_negative_fixture_families = [...new Set([
  ...r66.required_negative_fixture_families,
  'operation_class_selection_unknown_missing_duplicate_cross_operation_policy_time_interval_and_snapshot_attacks',
  'selection_key_component_omission_change_and_member_claim_without_export_attacks',
])]

const sourcePaths = [...new Set([
  ...r65SemanticAuthorityPaths,
  'authority_operation_evaluator_registry_selection',
])].filter(path => get(r66, path) !== undefined).sort(cp)
r66.authority_runtime_semantic_reference_field_registry = { ...r66.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r66.v1' }
r66.authority_runtime_semantic_reference_owner_map = { ...r66.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r66.v1' }
r66.authority_runtime_semantic_dependency_owner_map = { ...r66.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r66.v1' }
r66.authority_runtime_semantic_manifest = { ...r66.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r66.v1' }
r66.authority_runtime_semantic_manifest_hash_contract = {
  ...r66.authority_runtime_semantic_manifest_hash_contract,
  schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r66.v1',
  manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r66.v1',
  content_domain_ascii: 'CTRL-G24-R66-MANIFEST-CONTENT',
  dependency_domain_ascii: 'CTRL-G24-R66-MANIFEST-DEPENDENCY',
  graph_domain_ascii: 'CTRL-G24-R66-MANIFEST-GRAPH',
  envelope_domain_ascii: 'CTRL-G24-R66-MANIFEST-ENVELOPE',
}
if (!sourcePaths.includes('authority_runtime_semantic_manifest_hash_contract')) sourcePaths.push('authority_runtime_semantic_manifest_hash_contract')
sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r66, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R66-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
const declaredNames = new Set(r66.authority_operation_schema_declared_semantic_field_registry.exact_rows.map(item => item.field_name))
const refRows = []
const seenRefs = new Set()
function walkRefs(value, source, path = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`
    const inspect = Array.isArray(child) ? child : [child]
    inspect.forEach((literal, index) => {
      if (typeof literal !== 'string') return
      const target = literal !== 'UNAVAILABLE' && get(r66, literal) !== undefined ? literal : 'UNAVAILABLE'
      if (target === 'UNAVAILABLE' && !declaredNames.has(key)) return
      const fieldPath = Array.isArray(child) ? `${next}.${index}` : next
      const id = `${source}|${fieldPath}|${literal}`
      if (seenRefs.has(id)) return
      seenRefs.add(id)
      refRows.push({
        source_authority_path: source,
        field_path: fieldPath,
        field_name: key,
        match_kind: target !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field',
        reference_literal: literal,
        exact_target_path_or_UNAVAILABLE: target,
        exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(r66, target)?.schema_version ?? 'NESTED_VALUE',
        reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference',
      })
    })
    walkRefs(child, source, next)
  }
}
for (const path of sourcePaths) walkRefs(get(r66, path), path)
refRows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
r66.authority_runtime_semantic_reference_field_registry = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r66.v1',
  source_snapshot_sha256: snapshotSha,
  exact_source_paths: sourcePaths,
  schema_declared_field_registry_ref: 'authority_operation_schema_declared_semantic_field_registry',
  exact_occurrence_rows: refRows,
  exact_expected_occurrence_count: refRows.length,
  exact_path_value_resolution_count: refRows.filter(item => item.match_kind === 'exhaustive_exact_path_value_resolution').length,
  schema_or_pinned_field_occurrence_count: refRows.filter(item => item.match_kind === 'schema_declared_or_independently_pinned_semantic_field').length,
  required_named_field_occurrence_counts: Object.fromEntries(['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'].map(field => [field, refRows.filter(item => item.field_name === field).length])),
  suffix_name_only_inference: 'forbidden',
  unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write',
}
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(item => item.source_authority_path === path && sourcePaths.includes(item.exact_target_path_or_UNAVAILABLE) && item.exact_target_path_or_UNAVAILABLE !== path).map(item => item.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r66.authority_runtime_semantic_reference_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r66.v1',
  source_snapshot_sha256: snapshotSha,
  exact_row_count: refRows.length,
  reference_registry_ref: 'authority_runtime_semantic_reference_field_registry',
  schema_declared_and_exact_path_value_bijection: true,
}
r66.authority_runtime_semantic_dependency_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r66.v1',
  source_snapshot_sha256: snapshotSha,
  exact_paths: sourcePaths,
  rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })),
  reference_registry_ref: 'authority_runtime_semantic_reference_field_registry',
}
const hashContract = r66.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hashContract.content_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r66, path)) })]))
function transitive(path) {
  const seen = new Set()
  const visit = current => { for (const dependency of dependencies[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }
  visit(path)
  seen.delete(path)
  return [...seen].sort(cp)
}
const manifestRows = sourcePaths.map(path => {
  const direct = dependencies[path].map(dependency => ({ authority_path: dependency, authority_content_sha256: contentHashes[dependency] }))
  const all = transitive(path).map(dependency => ({ authority_path: dependency, authority_content_sha256: contentHashes[dependency] }))
  return {
    authority_path: path,
    authority_schema_version: get(r66, path)?.schema_version ?? 'UNVERSIONED',
    exact_keyset: Object.keys(get(r66, path) ?? {}).sort(cp),
    authority_content_sha256: contentHashes[path],
    direct_dependency_paths: dependencies[path],
    direct_dependency_content_hashes: direct,
    direct_dependency_set_sha256: hash({ domain_ascii: hashContract.dependency_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }),
    transitive_dependency_paths: all.map(item => item.authority_path),
    transitive_dependency_content_hashes: all,
    transitive_dependency_set_sha256: hash({ domain_ascii: hashContract.dependency_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }),
  }
})
const withoutSeal = {
  schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r66.v1',
  source_snapshot_sha256: snapshotSha,
  exact_paths: sourcePaths,
  rows: manifestRows,
  exact_expected_count: manifestRows.length,
  manifest_graph_sha256: hash({ domain_ascii: hashContract.graph_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_rows: manifestRows }),
}
r66.authority_runtime_semantic_manifest = {
  ...withoutSeal,
  manifest_envelope_seal_sha256: hash({ domain_ascii: hashContract.envelope_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }),
}

const finalSnapshot = ownedSnapshotR44(r66)
export const materializedR66 = r66
export const materializedR66Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r66SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR66Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR66Output) {
      console.error(`${outputPath} differs from materializer`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R66 effective contract`)
  } else throw new Error(`unsupported mode:${mode}`)
}
