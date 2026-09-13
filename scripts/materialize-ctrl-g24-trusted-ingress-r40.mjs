import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR39, r39SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r39.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r39.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r40.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r40 = structuredClone(materializedR39)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const id = { type: 'identifier' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)); const right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function assertCanonicalDomain(value, path = '$', seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number') { if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error(`non_canonical_number:${path}`); return }
  if (typeof value !== 'object') throw new Error(`unsupported_canonical_value:${path}:${typeof value}`)
  if (seen.has(value)) throw new Error(`cyclic_canonical_value:${path}`)
  seen.add(value)
  if (Array.isArray(value)) { for (let index = 0; index < value.length; index += 1) { if (!Object.hasOwn(value, index)) throw new Error(`sparse_array:${path}[${index}]`); assertCanonicalDomain(value[index], `${path}[${index}]`, seen) } }
  else { const prototype = Object.getPrototypeOf(value); if (prototype !== Object.prototype && prototype !== null) throw new Error(`non_plain_object:${path}`); for (const [key, item] of Object.entries(value)) assertCanonicalDomain(item, `${path}.${key}`, seen) }
  seen.delete(value)
}
function canonical(value) { assertCanonicalDomain(value); if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
const hashCanonical = value => sha(Buffer.from(canonical(value), 'utf8'))
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function schemaAt(contract, schemaRef, variant = 'UNAVAILABLE') { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema }
function schemaProperty(contract, schemaRef, variant, field) { return schemaAt(contract, schemaRef, variant)?.properties?.[field] }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }

r40.schema_version = 'ctrl.g24.trusted-ingress.r40.effective.v1'
r40.status = 'fortieth_repair_candidate_under_independent_review'
r40.supersedes = { commit: 'a1f77e801ad0e69e820c445b99b7083f153e6854', tree: '7834ee1ea160a0e5be9ba913383de1a606548af9', human_blob: 'be33c81d19225fa88e14886fe4aa285bfecc9899', machine_blob: '895a6f87a80f2c6715e24f51e9ffcf5fcd025393', qa_blob: '1757047d970338c088afd4076746d9d8eba8f7c9', checker_blob: 'c2326214d3777fc0f8ca130f4fa6b48919ebe457', materializer_blob: '7b267538e478baa422e4965082285593e7e2f57a', founder_checker_blob: '9099ab26bfd263d9c924271bf0f7aadee6b01827', adjudication: 'veto' }
r40.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r40.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, strict_canonical_domain_validation_before_every_hash: true, caller_writer_or_precedence_extensions: 'forbidden' }

r40.canonical_json_domain_validator = {
  schema_version: 'ctrl.g24.canonical-json-domain-validator.r40.v1',
  accepted: ['null', 'boolean', 'finite_number_except_negative_zero', 'string', 'dense_array_of_accepted_values', 'plain_object_with_accepted_values'],
  rejected: ['NaN', 'positive_infinity', 'negative_infinity', 'negative_zero', 'undefined', 'bigint', 'function', 'symbol', 'sparse_array', 'non_plain_object', 'cycle'],
  object_key_order: 'unicode_code_point_ascending',
  array_order: 'preserved',
  text_encoding: 'UTF8',
  validation_order: 'validate_entire_recursive_domain_before_canonicalization_or_hash',
  rejection_effect: 'abort_materialization_or_hold_without_disclosure_or_write',
}

const resolution = r40.authority_operation_replay_resolution_bindings
resolution.schema_version = 'ctrl.g24.authority-operation-replay-resolution-bindings.r40.v1'
const binding = (sourceSchemaRef, sourceVariant, sourceField, destinationSchemaRef, destinationVariant, destinationField) => ({ source_schema_ref: sourceSchemaRef, source_variant: sourceVariant, source_field: sourceField, destination_schema_ref: destinationSchemaRef, destination_variant: destinationVariant, destination_field: destinationField, equality: 'exact_typed_byte_equality' })
resolution.committed_source = [
  binding('authority_operation_registry.row_union', 'original_committed', 'registry_row_ref', 'authority_operation_replay_payload_schema', 'replayed', 'committed_registry_row_ref'),
  binding('authority_operation_registry.row_union', 'original_committed', 'registry_fingerprint', 'authority_operation_replay_payload_schema', 'replayed', 'committed_registry_row_fingerprint'),
]
resolution.held_source = [
  binding('authority_operation_registry.row_union', 'original_persisted_hold', 'registry_row_ref', 'authority_operation_replay_payload_schema', 'replayed_held', 'held_registry_row_ref'),
  binding('authority_operation_registry.row_union', 'original_persisted_hold', 'registry_fingerprint', 'authority_operation_replay_payload_schema', 'replayed_held', 'held_registry_row_fingerprint'),
  ...['ordinary_single_proof', 'session_dual_proof'].flatMap(variant => [
    binding('authority_operation_hold_store.row_union', variant, 'hold_row_ref', 'authority_operation_replay_payload_schema', 'replayed_held', 'hold_row_ref'),
    binding('authority_operation_hold_store.row_union', variant, 'hold_fingerprint', 'authority_operation_replay_payload_schema', 'replayed_held', 'hold_row_fingerprint'),
  ]),
]
resolution.payload_artifact_triple = [
  binding('authority_operation_replay_payload_artifact_store.row_schema', 'UNAVAILABLE', 'artifact_ref', 'authority_operation_replay_envelope_schema', 'UNAVAILABLE', 'payload_ref'),
  binding('authority_operation_replay_payload_artifact_store.row_schema', 'UNAVAILABLE', 'canonical_bytes_sha256', 'authority_operation_replay_envelope_schema', 'UNAVAILABLE', 'payload_bytes_sha256'),
  ...['replayed', 'replayed_held'].map(variant => binding('authority_operation_replay_payload_schema', variant, 'payload_fingerprint', 'authority_operation_replay_envelope_schema', 'UNAVAILABLE', 'payload_fingerprint')),
]
resolution.envelope_artifact_triple = [
  { source_schema_ref: 'authority_operation_replay_envelope_artifact_store.row_schema', source_variant: 'UNAVAILABLE', source_field: 'artifact_ref', resolved_field: 'envelope_ref' },
  { source_schema_ref: 'authority_operation_replay_envelope_artifact_store.row_schema', source_variant: 'UNAVAILABLE', source_field: 'canonical_bytes_sha256', resolved_field: 'envelope_bytes_sha256' },
  { source_schema_ref: 'authority_operation_replay_envelope_schema', source_variant: 'UNAVAILABLE', source_field: 'envelope_fingerprint', resolved_field: 'envelope_fingerprint' },
]
resolution.historical_response_triple = resolution.historical_response_triple.map(row => ({ ...row, source_variant: 'UNAVAILABLE' }))
resolution.no_selected_variant_pseudo_reference = true
resolution.typed_binding_rule = 'every_source_and_destination_schema_variant_and_field_resolves_to_an_exact_declared_property_with_equal_type'

r40.authority_operation_replay_registry_authority.schema_version = 'ctrl.g24.authority-operation-replay-registry-authority.r40.v1'
r40.authority_operation_replay_derivation.schema_version = 'ctrl.g24.authority-operation-replay-derivation.r40.v1'
r40.authority_operation_replay_derivation.binding_authority_version = resolution.schema_version
r40.authority_operation_replay_derivation.registry_authority_version = r40.authority_operation_replay_registry_authority.schema_version
r40.authority_operation_replay_branch_map.schema_version = 'ctrl.g24.authority-operation-replay-branch-map.r40.v1'
r40.authority_operation_replay_branch_map.local_schema_version = r40.authority_operation_replay_derivation.schema_version
r40.authority_operation_authority_reference_version_bindings = {
  schema_version: 'ctrl.g24.authority-reference-version-binding-control.r40.v1',
  row_schema: closed('ctrl.g24.authority-reference-version-binding-row.r40.v1', { source_authority_path: id, reference_field: id, version_field: id, target_authority_path: id, exact_target_schema_version: id }, { caller_writable_fields: [], fallback_or_default: 'forbidden' }),
  rows: [
    { source_authority_path: 'authority_operation_replay_derivation', reference_field: 'binding_authority_ref', version_field: 'binding_authority_version', target_authority_path: 'authority_operation_replay_resolution_bindings', exact_target_schema_version: resolution.schema_version },
    { source_authority_path: 'authority_operation_replay_derivation', reference_field: 'registry_authority_ref', version_field: 'registry_authority_version', target_authority_path: 'authority_operation_replay_registry_authority', exact_target_schema_version: r40.authority_operation_replay_registry_authority.schema_version },
  ],
  unresolved_stale_future_or_missing_pair: 'reject_materialization_and_hold_without_disclosure_or_write',
}

const classifier = r40.authority_operation_replay_classifier
const classifierSchema = classifier.row_schema
classifierSchema.schema_version = 'ctrl.g24.authority-operation-replay-classifier-row.r40.v1'
classifierSchema.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_classifier_row_r40'
classifier.schema_version = 'ctrl.g24.authority-operation-replay-classifier.r40.v1'
classifier.local_schema_version = r40.authority_operation_replay_branch_map.schema_version
const classifierPreimageSchema = closed('ctrl.g24.authority-operation-replay-classifier-fingerprint-preimage.r40.v1', {
  domain_ascii: { const: 'CTRL-G24-AUTHORITY-OPERATION-REPLAY-CLASSIFIER-ROW-R40' },
  schema_version: { const: classifierSchema.schema_version },
  classifier_row_without_fingerprint: { schema_ref: 'authority_operation_replay_classifier.row_schema', excluded_fields: ['classifier_row_fingerprint'] },
})
r40.fingerprint_schemas.authority_operation_replay_classifier_row_r40 = { schema_version: 'ctrl.g24.fingerprint.authority-operation-replay-classifier-row.r40.v1', domain_ascii: 'CTRL-G24-AUTHORITY-OPERATION-REPLAY-CLASSIFIER-ROW-R40', canonical_codec_ref: 'canonical_json_utf8_encoding', preimage_schema: classifierPreimageSchema, preimage_order: classifierPreimageSchema.exact_keys, digest: 'sha256' }
delete r40.fingerprint_schemas.authority_operation_replay_classifier_row_r39
classifier.rows = classifier.rows.map(row => { const without = { ...row }; delete without.classifier_row_fingerprint; return { ...without, classifier_row_fingerprint: hashCanonical({ domain_ascii: 'CTRL-G24-AUTHORITY-OPERATION-REPLAY-CLASSIFIER-ROW-R40', schema_version: classifierSchema.schema_version, classifier_row_without_fingerprint: without }) } })
r40.authority_operation_replay_derivation.classifier_row_schema_version = classifierSchema.schema_version

const durableFields = ['fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']
function valueForSpec(spec, seed) { if (Object.hasOwn(spec ?? {}, 'const')) return spec.const; if (spec?.enum) return spec.enum[0]; if (spec?.type === 'sha256') return sha(seed); if (spec?.type?.includes('date') || spec?.type?.includes('time')) return '2026-09-13T00:00:00.000Z'; if (spec?.type === 'boolean') return false; if (spec?.type === 'number' || spec?.type === 'integer') return 1; if (spec?.type?.includes('array')) return []; if (spec?.type === 'object') return {}; return `r40_${seed.replace(/[^a-z0-9]/gi, '_').slice(-48)}` }
function rowFixture(contract, schemaRef, variant, selected, overrides = {}) {
  const schema = schemaAt(contract, schemaRef, variant), row = {}
  for (const [field, spec] of Object.entries(schema.properties)) row[field] = valueForSpec(spec, `${variant}:${field}`)
  Object.assign(row, selected, overrides)
  const fingerprintField = Object.hasOwn(schema.properties, 'registry_fingerprint') ? 'registry_fingerprint' : 'hold_fingerprint'
  const fingerprintSchema = resolvePath(contract, schema.fingerprint_ref), preimage = {}
  for (const field of fingerprintSchema.preimage_order) preimage[field] = field === 'domain_ascii' ? fingerprintSchema.domain_ascii : row[field]
  const recorded = hashCanonical(preimage)
  row[fingerprintField] = recorded
  const bytes = canonical(row)
  return { schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, canonical_row_value: row, canonical_row_bytes_utf8: bytes, canonical_row_bytes_sha256: sha(Buffer.from(bytes, 'utf8')), fingerprint_schema_ref: schema.fingerprint_ref, fingerprint_preimage: preimage, recorded_fingerprint: recorded }
}
function selectionFor(operationName, resultBranch) { const row = r40.authority_operation_fresh_branch_class_selection.rows.find(item => item.operation_name === operationName && item.result_branch === resultBranch); if (!row) throw new Error(`missing_selection:${operationName}:${resultBranch}`); return { fresh_selection_row_id: row.selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.selector_schema_version } }
const fixturePlans = [
  ['restart_committed', 'bootstrap_case_session_root_anchor', 'committed', 'original_committed', 'UNAVAILABLE'],
  ['restart_ordinary_held', 'bootstrap_case_session_root_anchor', 'authorization_hold', 'original_persisted_hold', 'ordinary_single_proof'],
  ['restart_verified_session_held', 'issue_server_session_principal', 'stale_head_hold', 'original_persisted_hold', 'session_dual_proof'],
  ['restart_raw_session_held', 'issue_server_session_principal', 'invalid_proof_hold', 'original_persisted_hold', 'session_dual_proof'],
]
const fixtureArtifacts = fixturePlans.map(([fixtureId, operationName, resultBranch, registryVariant, holdVariant]) => {
  const selected = selectionFor(operationName, resultBranch), holdRowRef = sha(`${fixtureId}:hold-row`)
  const holdArtifact = holdVariant === 'UNAVAILABLE' ? 'UNAVAILABLE' : rowFixture(r40, 'authority_operation_hold_store.row_union', holdVariant, selected, { operation_name: operationName, hold_branch: resultBranch, hold_row_ref: holdRowRef })
  const registryOverrides = registryVariant === 'original_committed' ? { operation_name: operationName, result_branch: resultBranch } : { operation_name: operationName, hold_branch: resultBranch, hold_row_ref: holdRowRef, hold_fingerprint: holdArtifact.recorded_fingerprint, hold_schema_ref: `authority_operation_hold_store.row_union.variants.${holdVariant}` }
  const registryArtifact = rowFixture(r40, 'authority_operation_registry.row_union', registryVariant, selected, registryOverrides)
  const classifierRow = classifier.rows.find(row => row.expected_selection_row_id === selected.fresh_selection_row_id && row.operation_name === operationName && row.result_branch === resultBranch)
  if (!classifierRow) throw new Error(`missing_classifier:${fixtureId}`)
  return { fixture_id: fixtureId, operation_name: operationName, result_branch: resultBranch, registry_artifact: registryArtifact, hold_artifact_or_UNAVAILABLE: holdArtifact, classifier_row: classifierRow, expected_reconstructed_selection: selected }
})
r40.authority_operation_replay_restart_fixtures = {
  schema_version: 'ctrl.g24.authority-operation-replay-restart-fixtures.r40.v1',
  exact_fixture_ids: fixturePlans.map(row => row[0]),
  fixtures: fixtureArtifacts,
  reconstruction_algorithm: ['resolve_exact_content_addressed_registry_artifact', 'decode_and_canonical_reencode', 'recompute_declared_registry_fingerprint_preimage', 'resolve_and_recompute_hold_artifact_when_held', 'extract_five_fields_through_typed_variant_bindings', 'require_registry_hold_exact_equality', 'resolve_exact_classifier_row_and_recompute_its_fingerprint', 'select_exact_branch_map'],
  restart_uses_projection_only_data: false,
  any_bytes_fingerprint_version_field_or_cross_record_splice: 'hold_without_disclosure_or_write',
}

r40.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r40.v1', derivation: 'bounded_exact_extension_from_frozen_R39_to_R40_total_typed_replay_bindings_exact_authority_versions_closed_classifier_preimage_strict_canonical_domain_complete_reference_owners_and_artifact_restart_reconstruction', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.canonical_json_domain_validator', '$.authority_operation_replay_resolution_bindings', '$.authority_operation_replay_registry_authority', '$.authority_operation_replay_derivation', '$.authority_operation_replay_branch_map', '$.authority_operation_replay_classifier', '$.fingerprint_schemas', '$.authority_operation_authority_reference_version_bindings', '$.authority_operation_replay_restart_fixtures', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: ['$.fingerprint_schemas.authority_operation_replay_classifier_row_r39'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r40_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r40.required_negative_fixture_families = [...new Set([...r40.required_negative_fixture_families, 'total_discriminator_typed_resolution', 'authority_ref_version_exactness', 'classifier_preimage_exactness', 'strict_canonical_json_domain', 'complete_semantic_reference_owners', 'durable_artifact_restart_reconstruction'])]

const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r40.v1'
r40.authority_runtime_semantic_manifest_hash_contract = {
  schema_version: hashVersion,
  canonical_domain_validator_ref: 'canonical_json_domain_validator',
  canonical_codec_ref: 'canonical_json_utf8_encoding',
  content_preimage_schema: closed('ctrl.g24.runtime-semantic-content-hash-preimage.r40.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R40' }, manifest_hash_version: { const: hashVersion }, authority_path: id, canonical_authority_object: { type: 'canonical_JSON_domain_value' } }),
  dependency_preimage_schema: closed('ctrl.g24.runtime-semantic-dependency-hash-preimage.r40.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R40' }, manifest_hash_version: { const: hashVersion }, authority_path: id, dependency_scope: { enum: ['direct', 'transitive'] }, canonical_sorted_dependency_rows: { type: 'canonical_dependency_row_array' } }),
  graph_preimage_schema: closed('ctrl.g24.runtime-semantic-graph-hash-preimage.r40.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R40' }, manifest_hash_version: { const: hashVersion }, manifest_rows: { type: 'canonical_manifest_row_array' } }),
  envelope_preimage_schema: closed('ctrl.g24.runtime-semantic-manifest-envelope-hash-preimage.r40.v1', { domain_ascii: { const: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R40' }, manifest_hash_version: { const: hashVersion }, manifest_without_envelope_seal: { type: 'canonical_manifest_envelope' } }),
  hashing_rule: 'strict_domain_validation_then_sha256_of_exact_canonical_preimage_schema_bytes',
}
function contentHash(path, value) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R40', manifest_hash_version: hashVersion, authority_path: path, canonical_authority_object: value }) }
function dependencyHash(path, scope, rows) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R40', manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R40', manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return hashCanonical({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R40', manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

const semanticAuthorityPaths = [...new Set([...r39SemanticAuthorityPaths, 'canonical_json_domain_validator', 'authority_operation_authority_reference_version_bindings', 'authority_runtime_semantic_reference_owner_map'])].sort(codePointCompare)
const priorOwners = Object.fromEntries(materializedR39.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const dependencyOverrides = {
  operation_authority: ['case_authority_bindings', 'derived_authority_predicates', 'workload_authority_predicates'],
  authority_operation_replay_resolution_bindings: ['authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_payload_schema', 'authority_operation_replay_payload_artifact_store', 'authority_operation_replay_envelope_schema', 'authority_operation_replay_envelope_artifact_store', 'authority_operation_historical_response_schema', 'authority_operation_historical_response_artifact_store', 'authority_operation_replay_registry_authority'],
  authority_operation_replay_registry_authority: ['authority_operation_replay_resolution_bindings', 'authority_operation_registry', 'authority_operation_hold_store'],
  authority_operation_replay_derivation: ['authority_operation_replay_resolution_bindings', 'authority_operation_replay_registry_authority', 'authority_operation_replay_branch_map', 'authority_operation_replay_classifier', 'authority_operation_replay_envelope_schema'],
  authority_operation_replay_branch_map: ['authority_operation_replay_derivation', 'authority_operation_replay_classifier', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings'],
  authority_operation_replay_classifier: ['authority_operation_replay_branch_map', 'fingerprint_schemas'],
  authority_operation_replay_restart_fixtures: ['authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_classifier', 'authority_operation_replay_resolution_bindings', 'authority_operation_fresh_branch_class_selection', 'fingerprint_schemas'],
  authority_operation_authority_reference_version_bindings: ['authority_operation_replay_derivation', 'authority_operation_replay_registry_authority', 'authority_operation_replay_resolution_bindings'],
  authority_runtime_semantic_manifest_hash_contract: ['canonical_json_domain_validator', 'canonical_json_utf8_encoding'],
  canonical_json_domain_validator: [],
  authority_runtime_semantic_reference_owner_map: [],
  materialization: [],
  schema_change_manifest: [],
}

const aliasOwners = {
  selected_session_operation_request_schema: 'request_schema',
  selected_session_operation_result_schema: 'operation_result_schema_derivation',
  selected_result_schema: 'operation_result_schema_derivation',
  case_authority_control_bindings_and_server_presented_principal_projection_derivation: 'case_authority_bindings',
  'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema',
}
const nonAuthorityReferenceLiterals = new Set(['UNAVAILABLE', 'forbidden', 'reject_and_hold', 'exact_operation_result_variant', 'exact_hold_variant_or_UNAVAILABLE', 'exact_evidence_variant_or_UNAVAILABLE', 'exact_branch_DAG'])
function semanticRefKey(key) { return /(?:schema|authority|binding|registry|derivation|transaction|dag|evidence|write_set|codec|fingerprint|control|manifest|map)_refs?$/.test(key) }
function walkSemanticRefs(value, sourcePath, fieldPath = sourcePath, out = []) { if (!value || typeof value !== 'object') return out; for (const [key, item] of Object.entries(value)) { const next = `${fieldPath}.${key}`; if (semanticRefKey(key) && (typeof item === 'string' || Array.isArray(item))) for (const ref of Array.isArray(item) ? item : [item]) if (typeof ref === 'string') out.push({ source_authority_path: sourcePath, source_field_path: next, reference_value: ref }); walkSemanticRefs(item, sourcePath, next, out) } return out }
function ownerFor(ref) { if (aliasOwners[ref]) return aliasOwners[ref]; const normalized = ref.replace(/^\$\./, ''); const matches = semanticAuthorityPaths.filter(path => normalized === path || normalized.startsWith(`${path}.`)).sort((a, b) => b.length - a.length); if (matches.length) return matches[0]; return undefined }
const referenceRows = []
const unresolvedReferenceRows = []
for (const path of semanticAuthorityPaths) {
  if (['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map'].includes(path)) continue
  for (const occurrence of walkSemanticRefs(resolvePath(r40, path), path)) {
    if (occurrence.source_field_path.includes('.canonical_row_value.') || occurrence.source_field_path.includes('.fingerprint_preimage.')) continue
    const owner = ownerFor(occurrence.reference_value)
    if (!owner && nonAuthorityReferenceLiterals.has(occurrence.reference_value)) continue
    if (!owner) { unresolvedReferenceRows.push(occurrence); continue }
    if (owner === path) continue
    referenceRows.push({ ...occurrence, owner_authority_path: owner })
  }
}
if (unresolvedReferenceRows.length) throw new Error(`unresolved_semantic_refs:${canonical(unresolvedReferenceRows.slice(0, 40))}`)
r40.authority_runtime_semantic_reference_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r40.v1',
  row_schema: closed('ctrl.g24.runtime-semantic-reference-owner-row.r40.v1', { source_authority_path: id, source_field_path: id, reference_value: { type: 'literal_string' }, owner_authority_path: id }, { caller_writable_fields: [], fallback_or_default: 'forbidden' }),
  rows: referenceRows.sort((a, b) => codePointCompare(`${a.source_authority_path}|${a.source_field_path}|${a.reference_value}`, `${b.source_authority_path}|${b.source_field_path}|${b.reference_value}`)),
  compound_reference_rule: 'only_independently_pinned_aliases_may_resolve_compound_refs_and_each_has_one_owner',
  unknown_nonliteral_unresolved_or_multiply_owned_ref: 'reject_materialization_and_hold_without_disclosure_or_write',
}

const referenceDeps = {}
for (const row of referenceRows) (referenceDeps[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(dependencyOverrides[path] ?? priorOwners[path] ?? []), ...[...(referenceDeps[path] ?? [])]])].filter(owner => semanticAuthorityPaths.includes(owner) && owner !== path).sort(codePointCompare), unqualified_legacy_alias_owner_path: path }))
r40.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r40.v1', row_schema: closed('ctrl.g24.runtime-semantic-dependency-owner-map-row.r40.v1', { authority_path: id, typed_owner_paths: { type: 'unicode_sorted_unique_manifested_path_array' }, unqualified_legacy_alias_owner_path: id }, { caller_writable_fields: [], fallback_or_default: 'forbidden' }), exact_paths: semanticAuthorityPaths, rows: ownerRows, semantic_reference_owner_map_ref: 'authority_runtime_semantic_reference_owner_map', operation_authority_alias_rows: materializedR39.authority_runtime_semantic_dependency_owner_map.operation_authority_alias_rows, operation_authority_alias_rule: 'every_case_derived_workload_or_delegated_predicate_resolves_to_exactly_one_manifested_owner', typed_reference_rule: 'every_semantic_ref_occurrence_is_independently_enumerated_and_resolves_to_exactly_one_manifested_owner', unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write', dependency_membership_is_explicit_not_lexically_inferred: true }

r40.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r40.v1', {
  schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r40.v1' }, type: { const: 'independently_pinned_self_sealed_exhaustive_runtime_semantic_authority_manifest' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, semantic_reference_owner_map_ref: { const: 'authority_runtime_semantic_reference_owner_map' }, row_schema: { schema_ref: 'authority_runtime_semantic_manifest.row_schema' }, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, strict_canonical_domain_validator_ref: { const: 'canonical_json_domain_validator' }, manifest_graph_sha256: fp, dependency_owner_map_sha256: fp, semantic_reference_owner_map_sha256: fp, manifest_envelope_seal_sha256: fp,
}, { caller_writable_fields: [], fallback_or_default: 'forbidden' })

delete r40.authority_runtime_semantic_manifest
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, resolvePath(r40, path))]))
const graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = resolvePath(r40, path), directPaths = graph[path], directRows = directPaths.map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })), transitiveRows = transitive(path).map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })); return { authority_path: path, semantic_kind: kindOf(value), exact_keyset: keysetOf(value), authority_schema_ref: path, authority_schema_version: value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r40.v1`, direct_dependency_paths: directPaths, direct_dependency_content_hashes: directRows, direct_dependency_set_sha256: dependencyHash(path, 'direct', directRows), transitive_dependency_paths: transitiveRows.map(row => row.authority_path), transitive_dependency_content_hashes: transitiveRows, transitive_dependency_set_sha256: dependencyHash(path, 'transitive', transitiveRows), authority_content_sha256: contentHashes[path] } })
const manifestRowSchema = closed('ctrl.g24.runtime-semantic-authority-manifest-row.r40.v1', { authority_path: id, semantic_kind: { enum: ['object', 'array', 'string', 'number', 'boolean', 'null'] }, exact_keyset: { type: 'ordered_string_array' }, authority_schema_ref: id, authority_schema_version: id, direct_dependency_paths: { type: 'unicode_sorted_identifier_array' }, direct_dependency_content_hashes: { type: 'ordered_dependency_hash_row_array' }, direct_dependency_set_sha256: fp, transitive_dependency_paths: { type: 'unicode_sorted_identifier_array' }, transitive_dependency_content_hashes: { type: 'ordered_dependency_hash_row_array' }, transitive_dependency_set_sha256: fp, authority_content_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r40.v1', type: 'independently_pinned_self_sealed_exhaustive_runtime_semantic_authority_manifest', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', semantic_reference_owner_map_ref: 'authority_runtime_semantic_reference_owner_map', row_schema: manifestRowSchema, exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, strict_canonical_domain_validator_ref: 'canonical_json_domain_validator', manifest_graph_sha256: graphHash(manifestRows), dependency_owner_map_sha256: contentHashes.authority_runtime_semantic_dependency_owner_map, semantic_reference_owner_map_sha256: contentHashes.authority_runtime_semantic_reference_owner_map }
r40.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: envelopeHash(manifestWithoutSeal) }
r40.visible_surface_changes = []
r40.external_actions_authorized = []

for (const row of [...resolution.committed_source, ...resolution.held_source, ...resolution.payload_artifact_triple]) { const source = schemaProperty(r40, row.source_schema_ref, row.source_variant, row.source_field), destination = schemaProperty(r40, row.destination_schema_ref, row.destination_variant, row.destination_field); if (!source || !destination || canonical(source) !== canonical(destination)) throw new Error(`unresolved_typed_binding:${canonical(row)}`) }
assertCanonicalDomain(r40)
export const materializedR40 = r40
export const materializedR40Output = `${JSON.stringify(r40, null, 2)}\n`
export const canonicalR40 = canonical
export const r40SemanticAuthorityPaths = semanticAuthorityPaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR40Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR40Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R40 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
