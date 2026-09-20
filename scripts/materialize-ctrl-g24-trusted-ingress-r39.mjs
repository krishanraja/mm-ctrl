import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR38, r38SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r38.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r38.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r39.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r39 = structuredClone(materializedR38)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const id = { type: 'identifier' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, spec, before) { const properties = {}; for (const [name, value] of Object.entries(schema.properties)) { if (name === before) properties[key] = spec; properties[name] = value } if (!Object.hasOwn(properties, key)) properties[key] = spec; schema.properties = properties; schema.exact_keys = Object.keys(properties); schema.required = schema.exact_keys.filter(name => !(schema.optional ?? []).includes(name)) }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)); const right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function canonical(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
function hashCanonical(value) { return sha(Buffer.from(canonical(value), 'utf8')) }
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function schemaProperty(contract, schemaRef, variant, field) { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema?.properties?.[field] }

r39.schema_version = 'ctrl.g24.trusted-ingress.r39.effective.v1'
r39.status = 'thirty_ninth_repair_candidate_under_independent_review'
r39.supersedes = { commit: 'a09740b6fb0e65740aae413281f372dc975a9bde', tree: 'bcd807e58788845e0e67ee32dfa4a9966b6c4f4d', human_blob: '49e083cf88d6217d20761c937681c52861992afe', machine_blob: '333afb740bb7273318be25b7fdd0117f255e40f7', qa_blob: '71a068a7fa34c0623ad8b440d392ac52b9b690c9', checker_blob: 'dddf206852f01dce8a5eecbeca621f3a7d2165db', materializer_blob: 'eb4b4f3ab3042b63cad637f09f69814224d1cef2', founder_checker_blob: 'd58cd2072b15bb4357c6569ac0dd1ef0fd898a04', adjudication: 'veto' }
r39.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r39.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true, caller_writer_or_precedence_extensions: 'forbidden' }

const durableFields = ['fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']
const destinationFields = { fresh_selection_row_id: 'expected_selection_row_id', proof_family: 'expected_proof_family', branch_class: 'expected_branch_class', evidence_kind: 'expected_evidence_kind', fresh_selection_schema_version: 'expected_selector_version' }
const registryAuthority = r39.authority_operation_replay_registry_authority
const resolutionBindings = r39.authority_operation_replay_resolution_bindings
registryAuthority.schema_version = 'ctrl.g24.authority-operation-replay-registry-authority.r39.v1'
resolutionBindings.schema_version = 'ctrl.g24.authority-operation-replay-resolution-bindings.r39.v1'

// R38 incorrectly represented durable selection facts as replay-payload fields. The
// original registry and hold rows remain authoritative; the classifier compares them.
registryAuthority.committed = registryAuthority.committed.filter(row => !durableFields.includes(row.payload_field))
registryAuthority.held = registryAuthority.held.filter(row => !durableFields.includes(row.payload_field))
delete registryAuthority.durable_selection_bindings
delete resolutionBindings.durable_selection_bindings

const classifier = r39.authority_operation_replay_classifier
const classifierSchema = classifier.row_schema
add(classifierSchema, 'expected_selection_row_id', id, 'expected_proof_family')
add(classifierSchema, 'classifier_row_fingerprint', fp)
classifierSchema.schema_version = 'ctrl.g24.authority-operation-replay-classifier-row.r39.v1'
classifierSchema.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_classifier_row_r39'
classifier.schema_version = 'ctrl.g24.authority-operation-replay-classifier.r39.v1'
classifier.local_schema_version = 'ctrl.g24.authority-operation-replay-branch-map.r39.v1'
classifier.durable_selection_fields = durableFields
classifier.rows = classifier.rows.map(row => {
  const values = { ...row, expected_selection_row_id: row.classifier_row_id.slice(0, -'|replay'.length) }
  const next = {}
  for (const key of classifierSchema.exact_keys.filter(name => name !== 'classifier_row_fingerprint')) next[key] = values[key]
  next.classifier_row_fingerprint = hashCanonical({ domain_ascii: 'CTRL-G24-AUTHORITY-OPERATION-REPLAY-CLASSIFIER-ROW-R39', schema_version: classifierSchema.schema_version, row: next })
  return next
})
r39.fingerprint_schemas.authority_operation_replay_classifier_row_r39 = {
  schema_version: 'ctrl.g24.fingerprint.authority-operation-replay-classifier-row.r39.v1',
  domain_ascii: 'CTRL-G24-AUTHORITY-OPERATION-REPLAY-CLASSIFIER-ROW-R39',
  canonical_codec_ref: 'canonical_json_utf8_encoding',
  preimage_schema_ref: 'authority_operation_replay_classifier.row_schema',
  excluded_fields: ['classifier_row_fingerprint'],
  preimage_order: ['domain_ascii', 'schema_version', 'canonical_classifier_row_without_fingerprint'],
  digest: 'sha256',
}

const bindingVariants = [
  ['authority_operation_registry.row_union', 'original_committed'],
  ['authority_operation_registry.row_union', 'original_persisted_hold'],
  ['authority_operation_hold_store.row_union', 'ordinary_single_proof'],
  ['authority_operation_hold_store.row_union', 'session_dual_proof'],
]
const typedBindings = bindingVariants.flatMap(([sourceSchemaRef, sourceVariant]) => durableFields.map(field => ({
  source_schema_ref: sourceSchemaRef,
  source_variant: sourceVariant,
  source_field: field,
  destination_schema_ref: 'authority_operation_replay_classifier.row_schema',
  destination_variant: 'UNAVAILABLE',
  destination_field: destinationFields[field],
  equality: 'exact_typed_byte_equality_before_classifier_selection',
})))
const typedBindingRowSchema = closed('ctrl.g24.authority-operation-durable-selection-typed-binding-row.r39.v1', {
  source_schema_ref: id,
  source_variant: id,
  source_field: id,
  destination_schema_ref: id,
  destination_variant: { type: 'identifier_or_UNAVAILABLE_literal' },
  destination_field: id,
  equality: { const: 'exact_typed_byte_equality_before_classifier_selection' },
}, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
r39.authority_operation_durable_selection_typed_binding_schema = {
  schema_version: 'ctrl.g24.authority-operation-durable-selection-typed-binding-control.r39.v1',
  row_schema: typedBindingRowSchema,
  exact_rows: typedBindings,
  exact_expected_rows: 20,
  exact_source_variants: bindingVariants.map(([schema_ref, variant]) => ({ schema_ref, variant })),
  exact_fields: durableFields,
  no_replay_payload_destination: true,
  selected_variant_alias: 'forbidden',
  caller_supplied_schema_variant_or_field: 'forbidden',
}
registryAuthority.durable_selection_typed_binding_ref = 'authority_operation_durable_selection_typed_binding_schema'
resolutionBindings.durable_selection_typed_binding_ref = 'authority_operation_durable_selection_typed_binding_schema'
resolutionBindings.exact_binding_fields = durableFields
resolutionBindings.no_replay_payload_destination = true
resolutionBindings.selected_variant_alias = 'forbidden'
r39.authority_operation_replay_derivation = { ...r39.authority_operation_replay_derivation, schema_version: 'ctrl.g24.authority-operation-replay-derivation.r39.v1', durable_selection_binding_ref: 'authority_operation_durable_selection_typed_binding_schema', classifier_row_schema_version: classifierSchema.schema_version }
r39.authority_operation_replay_branch_map = { ...r39.authority_operation_replay_branch_map, schema_version: 'ctrl.g24.authority-operation-replay-branch-map.r39.v1', local_schema_version: 'ctrl.g24.authority-operation-replay-derivation.r39.v1', durable_selection_binding_ref: 'authority_operation_durable_selection_typed_binding_schema' }

const selectorRows = r39.authority_operation_fresh_branch_class_selection.rows
function selectorRow(operationName, resultBranch) { const row = selectorRows.find(item => item.operation_name === operationName && item.result_branch === resultBranch); if (!row) throw new Error(`missing selector fixture:${operationName}:${resultBranch}`); return row }
function selectionProjection(row) { return { fresh_selection_row_id: row.selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.selector_schema_version } }
function classifierProjection(row) { return { expected_selection_row_id: row.selection_row_id, expected_proof_family: row.proof_family, expected_branch_class: row.branch_class, expected_evidence_kind: row.evidence_kind, expected_selector_version: row.selector_schema_version } }
const fixturePlans = [
  ['restart_committed', 'bootstrap_case_session_root_anchor', 'committed', 'authority_operation_registry.row_union', 'original_committed', 'UNAVAILABLE', 'UNAVAILABLE'],
  ['restart_ordinary_held', 'bootstrap_case_session_root_anchor', 'authorization_hold', 'authority_operation_registry.row_union', 'original_persisted_hold', 'authority_operation_hold_store.row_union', 'ordinary_single_proof'],
  ['restart_verified_session_held', 'issue_server_session_principal', 'stale_head_hold', 'authority_operation_registry.row_union', 'original_persisted_hold', 'authority_operation_hold_store.row_union', 'session_dual_proof'],
  ['restart_raw_session_held', 'issue_server_session_principal', 'invalid_proof_hold', 'authority_operation_registry.row_union', 'original_persisted_hold', 'authority_operation_hold_store.row_union', 'session_dual_proof'],
]
const restartFixtures = fixturePlans.map(([fixtureId, operationName, resultBranch, registrySchemaRef, registryVariant, holdSchemaRef, holdVariant]) => { const selected = selectorRow(operationName, resultBranch), source = selectionProjection(selected); return { fixture_id: fixtureId, operation_name: operationName, result_branch: resultBranch, registry_schema_ref: registrySchemaRef, registry_variant: registryVariant, registry_selection_fields: source, hold_schema_ref: holdSchemaRef, hold_variant: holdVariant, hold_selection_fields: holdVariant === 'UNAVAILABLE' ? 'UNAVAILABLE' : source, classifier_selection_fields: classifierProjection(selected), expected_recovery: 'exactly_one_classifier_row_then_exact_R39_branch_map_or_hold_without_disclosure_or_write' } })
const selectionProjectionSchema = closed('ctrl.g24.authority-operation-durable-selection-projection.r39.v1', {
  fresh_selection_row_id: id,
  proof_family: { enum: ['root_bootstrap_2_of_2', 'root_admin', 'issuer', 'dual_issuer_evaluator'] },
  branch_class: { enum: ['committed', 'ordinary_held', 'session_verified_consuming', 'session_raw_nonconsuming'] },
  evidence_kind: { enum: ['committed_precommit', 'ordinary_hold_precommit', 'verified_session_hold_evidence', 'raw_session_hold_evidence'] },
  fresh_selection_schema_version: { const: 'ctrl.g24.authority-operation-fresh-branch-class-selection.r37.v1' },
})
const classifierProjectionSchema = closed('ctrl.g24.authority-operation-classifier-selection-projection.r39.v1', {
  expected_selection_row_id: id,
  expected_proof_family: selectionProjectionSchema.properties.proof_family,
  expected_branch_class: selectionProjectionSchema.properties.branch_class,
  expected_evidence_kind: selectionProjectionSchema.properties.evidence_kind,
  expected_selector_version: selectionProjectionSchema.properties.fresh_selection_schema_version,
})
r39.authority_operation_replay_restart_fixtures = {
  schema_version: 'ctrl.g24.authority-operation-replay-restart-fixtures.r39.v1',
  selection_projection_schema: selectionProjectionSchema,
  classifier_projection_schema: classifierProjectionSchema,
  fixture_row_schema: closed('ctrl.g24.authority-operation-replay-restart-fixture-row.r39.v1', {
    fixture_id: id,
    operation_name: id,
    result_branch: id,
    registry_schema_ref: id,
    registry_variant: id,
    registry_selection_fields: { schema_ref: 'authority_operation_replay_restart_fixtures.selection_projection_schema' },
    hold_schema_ref: { type: 'identifier_or_UNAVAILABLE_literal' },
    hold_variant: { type: 'identifier_or_UNAVAILABLE_literal' },
    hold_selection_fields: { type: 'selection_projection_or_UNAVAILABLE_literal' },
    classifier_selection_fields: { schema_ref: 'authority_operation_replay_restart_fixtures.classifier_projection_schema' },
    expected_recovery: { const: 'exactly_one_classifier_row_then_exact_R39_branch_map_or_hold_without_disclosure_or_write' },
  }, { caller_writable_fields: [], fallback_or_default: 'forbidden' }),
  exact_fixture_ids: fixturePlans.map(row => row[0]),
  fixtures: restartFixtures,
  execution: 'resolve_registry_then_hold_when_required_verify_all_five_fingerprint_bound_fields_resolve_exact_classifier_row_then_branch_map',
  any_field_splice_or_type_mismatch: 'hold_without_disclosure_or_write',
}

const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r39.v1'
r39.authority_runtime_semantic_manifest_hash_contract = {
  schema_version: hashVersion,
  canonical_codec_ref: 'canonical_json_utf8_encoding',
  canonical_object_key_order: 'unicode_code_point_ascending',
  canonical_array_order: 'preserved',
  canonical_scalar_encoding: 'JSON_scalar_no_whitespace_UTF8',
  content_preimage_schema: closed('ctrl.g24.runtime-semantic-content-hash-preimage.r39.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R39' }, manifest_hash_version: { const: hashVersion }, authority_path: id, canonical_authority_object: { type: 'canonical_JSON_value' } }),
  dependency_preimage_schema: closed('ctrl.g24.runtime-semantic-dependency-hash-preimage.r39.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R39' }, manifest_hash_version: { const: hashVersion }, authority_path: id, dependency_scope: { enum: ['direct', 'transitive'] }, canonical_sorted_dependency_rows: { type: 'canonical_dependency_row_array' } }),
  graph_preimage_schema: closed('ctrl.g24.runtime-semantic-graph-hash-preimage.r39.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R39' }, manifest_hash_version: { const: hashVersion }, manifest_rows: { type: 'canonical_manifest_row_array' } }),
  envelope_preimage_schema: closed('ctrl.g24.runtime-semantic-manifest-envelope-hash-preimage.r39.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R39' }, manifest_hash_version: { const: hashVersion }, manifest_without_envelope_seal: { type: 'canonical_manifest_envelope' } }),
  hashing_rule: 'sha256_of_exact_canonical_preimage_schema_bytes',
  concatenated_or_insertion_order_JSON_stringify: 'forbidden',
}
function contentHash(path, value) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R39', manifest_hash_version: hashVersion, authority_path: path, canonical_authority_object: value }) }
function dependencyHash(path, scope, rows) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R39', manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R39', manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R39', manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

r39.schema_change_manifest = {
  schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r39.v1',
  derivation: 'bounded_exact_extension_from_frozen_R38_to_R39_executable_typed_durable_selection_replay_restart_fixtures_self_sealed_manifest_literal_hash_preimages_and_explicit_dependency_owners',
  frozen_parent_sha256: sha(inputBytes),
  changed_semantic_paths: ['$', '$.materialization', '$.authority_operation_replay_registry_authority', '$.authority_operation_replay_resolution_bindings', '$.authority_operation_replay_classifier', '$.authority_operation_replay_derivation', '$.authority_operation_replay_branch_map', '$.fingerprint_schemas', '$.authority_operation_durable_selection_typed_binding_schema', '$.authority_operation_replay_restart_fixtures', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'],
  removed_semantic_paths: [],
  recursive_same_version_semantic_change: 'forbidden',
  every_changed_or_new_semantic_object_has_r39_identifier: true,
  frozen_parent_core_must_remain_byte_identical: true,
  caller_writer_or_precedence_extensions: 'forbidden',
}
r39.required_negative_fixture_families = [...new Set([...r39.required_negative_fixture_families, 'typed_durable_selection_bindings', 'executable_replay_restart_fixtures', 'self_sealed_manifest_envelope', 'literal_hash_preimage_conformance', 'explicit_dependency_owner_resolution'])]

const semanticAuthorityPaths = [...r38SemanticAuthorityPaths, 'materialization', 'schema_change_manifest', 'authority_operation_durable_selection_typed_binding_schema', 'authority_operation_replay_restart_fixtures', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest_envelope_schema'].sort(codePointCompare)
const oldDependencyRows = Object.fromEntries(materializedR38.authority_runtime_semantic_manifest.rows.map(row => [row.authority_path, row.direct_dependency_paths]))
const dependencyOverrides = {
  authority_operation_replay_registry_authority: ['authority_operation_durable_selection_typed_binding_schema', 'authority_operation_historical_response_binding_authority', 'authority_operation_replay_resolution_bindings'],
  authority_operation_replay_resolution_bindings: ['authority_operation_durable_selection_typed_binding_schema', 'authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_classifier', 'authority_operation_replay_registry_authority', 'authority_operation_replay_payload_schema', 'authority_operation_replay_payload_artifact_store', 'authority_operation_replay_envelope_schema', 'authority_operation_replay_envelope_artifact_store', 'authority_operation_historical_response_schema', 'authority_operation_historical_response_artifact_store'],
  authority_operation_replay_classifier: ['authority_operation_replay_branch_map', 'authority_operation_durable_selection_typed_binding_schema', 'authority_operation_fresh_branch_class_selection', 'authority_operation_registry', 'authority_operation_hold_store', 'session_hold_evidence_schema', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings', 'authority_operation_committed_issuance_dag', 'authority_operation_ordinary_held_issuance_dag', 'authority_operation_session_verified_consuming_issuance_dag', 'authority_operation_session_raw_nonconsuming_issuance_dag', 'fingerprint_schemas'],
  authority_operation_replay_derivation: ['authority_operation_replay_branch_map', 'authority_operation_replay_classifier', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings', 'authority_operation_replay_envelope_schema', 'authority_operation_durable_selection_typed_binding_schema'],
  authority_operation_replay_branch_map: ['authority_operation_replay_derivation', 'authority_operation_replay_classifier', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings', 'authority_operation_durable_selection_typed_binding_schema', 'authority_operation_fresh_branch_class_selection', 'authority_operation_committed_issuance_dag', 'authority_operation_ordinary_held_issuance_dag', 'authority_operation_session_verified_consuming_issuance_dag', 'authority_operation_session_raw_nonconsuming_issuance_dag'],
  authority_operation_durable_selection_typed_binding_schema: ['authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_classifier'],
  authority_operation_replay_restart_fixtures: ['authority_operation_fresh_branch_class_selection', 'authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_classifier', 'authority_operation_replay_branch_map', 'fingerprint_schemas'],
  fingerprint_schemas: [...new Set([...(oldDependencyRows.fingerprint_schemas ?? []), 'canonical_json_utf8_encoding', 'authority_operation_replay_classifier'])],
  authority_runtime_semantic_manifest_hash_contract: ['canonical_json_utf8_encoding'],
  authority_runtime_semantic_manifest_envelope_schema: ['authority_runtime_semantic_manifest_hash_contract'],
  materialization: [],
  schema_change_manifest: [],
  authority_runtime_semantic_dependency_owner_map: [],
}
const operationAliases = [...new Set(Object.values(r39.operation_authority).filter(Array.isArray).flat())].sort(codePointCompare).map(alias => ({ alias, owner_path: alias.startsWith('workload_') ? 'workload_authority_predicates' : alias === 'transition_specific_human_predicate' ? 'derived_authority_predicates' : 'case_authority_bindings' }))
const ownerRows = semanticAuthorityPaths.map(authorityPath => ({
  authority_path: authorityPath,
  typed_owner_paths: [...new Set(dependencyOverrides[authorityPath] ?? oldDependencyRows[authorityPath] ?? [])].filter(path => semanticAuthorityPaths.includes(path) && path !== authorityPath).sort(codePointCompare),
  unqualified_legacy_alias_owner_path: authorityPath,
}))
r39.authority_runtime_semantic_dependency_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r39.v1',
  row_schema: closed('ctrl.g24.runtime-semantic-dependency-owner-map-row.r39.v1', { authority_path: id, typed_owner_paths: { type: 'unicode_sorted_unique_manifested_path_array' }, unqualified_legacy_alias_owner_path: id }, { caller_writable_fields: [], fallback_or_default: 'forbidden' }),
  exact_paths: semanticAuthorityPaths,
  rows: ownerRows,
  operation_authority_alias_rows: operationAliases,
  operation_authority_alias_rule: 'every_named_or_workload_predicate_resolves_to_exactly_one_manifested_owner',
  typed_reference_rule: 'every_schema_derivation_transaction_evidence_write_set_replay_registry_binding_DAG_and_authority_ref_resolves_to_exactly_one_owner_row',
  unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write',
  dependency_membership_is_explicit_not_lexically_inferred: true,
}

r39.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r39.v1', {
  schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r39.v1' },
  type: { const: 'independently_pinned_self_sealed_exhaustive_runtime_semantic_authority_manifest' },
  hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' },
  dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' },
  row_schema: { schema_ref: 'authority_runtime_semantic_manifest.row_schema' },
  exact_paths: { type: 'unicode_sorted_unique_identifier_array' },
  rows: { type: 'ordered_manifest_row_array' },
  exact_expected_count: { const: semanticAuthorityPaths.length },
  membership_source: { const: 'checker_and_materializer_independent_literal_digest_not_candidate_markers_names_or_counts' },
  nested_coverage_rule: { const: 'every_nested_runtime_semantic_object_including_manifest_materialization_and_schema_change_metadata_is_covered_by_an_exact_manifested_top_level_content_hash_or_the_self_sealed_manifest_envelope' },
  recursive_authority_vocabulary_scan_rule: { const: 'scan_every_manifest_envelope_row_schema_materialization_and_schema_change_object_plus_all_manifested_objects_for_authority_caller_writer_precedence_transaction_derivation_evidence_write_set_replay_registry_binding_DAG_and_runtime_semantic_vocabulary' },
  unmanifested_or_multiply_covered_semantics: { const: 'reject_materialization_and_hold_without_disclosure_or_write' },
  negative_fixture_families: { type: 'exact_required_negative_fixture_family_array' },
  manifest_graph_sha256: fp,
  dependency_owner_map_sha256: fp,
  manifest_envelope_seal_sha256: fp,
}, { caller_writable_fields: [], fallback_or_default: 'forbidden' })

delete r39.authority_runtime_semantic_manifest
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r39.v1` }
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => { const value = resolvePath(r39, path); if (value === undefined) throw new Error(`missing semantic authority path:${path}`); return [path, contentHash(path, value)] }))
const dependencyGraph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of dependencyGraph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
const manifestRows = semanticAuthorityPaths.map(path => {
  const value = resolvePath(r39, path), dependencies = dependencyGraph[path]
  const directRows = dependencies.map(dependencyPath => ({ authority_path: dependencyPath, authority_content_sha256: contentHashes[dependencyPath] }))
  const transitiveRows = transitive(path).map(dependencyPath => ({ authority_path: dependencyPath, authority_content_sha256: contentHashes[dependencyPath] }))
  return { authority_path: path, semantic_kind: kindOf(value), exact_keyset: keysetOf(value), authority_schema_ref: path, authority_schema_version: semanticVersion(path, value), direct_dependency_paths: dependencies, direct_dependency_content_hashes: directRows, direct_dependency_set_sha256: dependencyHash(path, 'direct', directRows), transitive_dependency_paths: transitiveRows.map(row => row.authority_path), transitive_dependency_content_hashes: transitiveRows, transitive_dependency_set_sha256: dependencyHash(path, 'transitive', transitiveRows), authority_content_sha256: contentHashes[path] }
})
const manifestRowSchema = closed('ctrl.g24.runtime-semantic-authority-manifest-row.r39.v1', {
  authority_path: id, semantic_kind: { enum: ['object', 'array', 'string', 'number', 'boolean', 'null'] }, exact_keyset: { type: 'ordered_string_array' }, authority_schema_ref: id, authority_schema_version: id, direct_dependency_paths: { type: 'unicode_sorted_identifier_array' }, direct_dependency_content_hashes: { type: 'ordered_dependency_hash_row_array' }, direct_dependency_set_sha256: fp, transitive_dependency_paths: { type: 'unicode_sorted_identifier_array' }, transitive_dependency_content_hashes: { type: 'ordered_dependency_hash_row_array' }, transitive_dependency_set_sha256: fp, authority_content_sha256: fp,
}, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
const manifestWithoutSeal = {
  schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r39.v1',
  type: 'independently_pinned_self_sealed_exhaustive_runtime_semantic_authority_manifest',
  hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract',
  dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map',
  row_schema: manifestRowSchema,
  exact_paths: semanticAuthorityPaths,
  rows: manifestRows,
  exact_expected_count: semanticAuthorityPaths.length,
  membership_source: 'checker_and_materializer_independent_literal_digest_not_candidate_markers_names_or_counts',
  nested_coverage_rule: 'every_nested_runtime_semantic_object_including_manifest_materialization_and_schema_change_metadata_is_covered_by_an_exact_manifested_top_level_content_hash_or_the_self_sealed_manifest_envelope',
  recursive_authority_vocabulary_scan_rule: 'scan_every_manifest_envelope_row_schema_materialization_and_schema_change_object_plus_all_manifested_objects_for_authority_caller_writer_precedence_transaction_derivation_evidence_write_set_replay_registry_binding_DAG_and_runtime_semantic_vocabulary',
  unmanifested_or_multiply_covered_semantics: 'reject_materialization_and_hold_without_disclosure_or_write',
  negative_fixture_families: ['typed_durable_selection_bindings', 'executable_replay_restart_fixtures', 'self_sealed_manifest_envelope', 'literal_hash_preimage_conformance', 'explicit_dependency_owner_resolution'],
  manifest_graph_sha256: graphHash(manifestRows),
  dependency_owner_map_sha256: contentHashes.authority_runtime_semantic_dependency_owner_map,
}
r39.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: envelopeHash(manifestWithoutSeal) }
r39.visible_surface_changes = []
r39.external_actions_authorized = []

for (const binding of typedBindings) {
  const source = schemaProperty(r39, binding.source_schema_ref, binding.source_variant, binding.source_field)
  const destination = schemaProperty(r39, binding.destination_schema_ref, binding.destination_variant, binding.destination_field)
  if (!source || !destination || canonical(source) !== canonical(destination)) throw new Error(`invalid typed binding:${canonical(binding)}`)
}
function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r39)
export const materializedR39 = r39
export const materializedR39Output = `${JSON.stringify(r39, null, 2)}\n`
export const canonicalR39 = canonical
export const r39SemanticAuthorityPaths = semanticAuthorityPaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR39Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR39Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R39 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
