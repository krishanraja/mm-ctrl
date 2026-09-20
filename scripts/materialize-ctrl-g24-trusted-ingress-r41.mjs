import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { types as utilTypes } from 'node:util'
import { materializedR40, r40SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r40.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r40.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r41.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r41 = structuredClone(materializedR40)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const id = { type: 'identifier' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)); const right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function validUnicode(value) { for (let index = 0; index < value.length; index += 1) { const unit = value.charCodeAt(index); if (unit >= 0xd800 && unit <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) return false; index += 1 } else if (unit >= 0xdc00 && unit <= 0xdfff) return false } return true }
function ownedSnapshot(value, path = '$', ancestors = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') { if (!validUnicode(value)) throw new Error(`invalid_unicode:${path}`); return value }
  if (typeof value === 'number') { if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error(`invalid_number:${path}`); return value }
  if (typeof value !== 'object') throw new Error(`unsupported_value:${path}:${typeof value}`)
  if (utilTypes.isProxy(value)) throw new Error(`proxy:${path}`)
  if (ancestors.has(value)) throw new Error(`cycle:${path}`)
  const prototype = Object.getPrototypeOf(value)
  const array = Array.isArray(value)
  if ((!array && prototype !== Object.prototype && prototype !== null) || (array && prototype !== Array.prototype)) throw new Error(`unsupported_prototype:${path}`)
  let keys
  try { keys = Reflect.ownKeys(value) } catch { throw new Error(`throwing_reflection:${path}`) }
  if (keys.some(key => typeof key === 'symbol')) throw new Error(`symbol_key:${path}`)
  ancestors.add(value)
  if (array) {
    const allowed = new Set(['length', ...Array.from({ length: value.length }, (_, index) => String(index))])
    if (keys.length !== allowed.size || keys.some(key => !allowed.has(key))) throw new Error(`sparse_or_extra_array_key:${path}`)
    const output = []
    for (let index = 0; index < value.length; index += 1) { let descriptor; try { descriptor = Reflect.getOwnPropertyDescriptor(value, String(index)) } catch { throw new Error(`throwing_descriptor:${path}[${index}]`) } if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.get || descriptor.set) throw new Error(`invalid_array_descriptor:${path}[${index}]`); output.push(ownedSnapshot(descriptor.value, `${path}[${index}]`, ancestors)) }
    ancestors.delete(value)
    return Object.freeze(output)
  }
  const output = Object.create(null)
  for (const key of keys) { if (!validUnicode(key)) throw new Error(`invalid_unicode_key:${path}`); let descriptor; try { descriptor = Reflect.getOwnPropertyDescriptor(value, key) } catch { throw new Error(`throwing_descriptor:${path}.${key}`) } if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.get || descriptor.set) throw new Error(`invalid_object_descriptor:${path}.${key}`); output[key] = ownedSnapshot(descriptor.value, `${path}.${key}`, ancestors) }
  ancestors.delete(value)
  return Object.freeze(output)
}
function canonicalOwned(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonicalOwned).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonicalOwned(value[key])}`).join(',')}}` }
function canonical(value) { return canonicalOwned(ownedSnapshot(value)) }
const hashCanonical = value => sha(Buffer.from(canonical(value), 'utf8'))
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function schemaAt(contract, schemaRef, variant = 'UNAVAILABLE') { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema }
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r41.v1` }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }

r41.schema_version = 'ctrl.g24.trusted-ingress.r41.effective.v1'
r41.status = 'forty_first_repair_candidate_under_independent_review'
r41.supersedes = { commit: '92badf816ce36605aa83f8849d37cdeb4a029af3', tree: '843a3977ccc65e796ab515cb6821dfbdfe8343b1', human_blob: '7a3120203e76065b6d426d53dba6aa64945025f7', machine_blob: '63f6b5222dc7350c2685c6a8ae2fc0d3e97fcd81', qa_blob: '505d073fdfc1aa405fe880022921c92c97e94db3', checker_blob: 'cb1277704693feeb265809c00ef5eee09f428619', materializer_blob: '76ca5e83b276ed5b189a8385d78d5d58601a4742', founder_checker_blob: '29e1b10946ee8f85c68f315baf7ee519e49a7234', adjudication: 'veto' }
r41.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r41.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, snapshot_before_validation_hash_or_use: true, caller_writer_or_precedence_extensions: 'forbidden' }
r41.owned_immutable_canonical_snapshot_pipeline = {
  schema_version: 'ctrl.g24.owned-immutable-canonical-snapshot-pipeline.r41.v1',
  traversal: 'Reflect.ownKeys_exactly_once_per_object_then_own_data_descriptors_read_once',
  accepted_prototypes: ['null', 'Object.prototype', 'Array.prototype_for_arrays_only'],
  rejected: ['proxy', 'throwing_reflection', 'symbol_key', 'non_enumerable_property', 'accessor', 'getter', 'setter', 'array_named_or_extra_key', 'sparse_array', 'cycle', 'nonfinite_number', 'negative_zero', 'unsupported_type', 'invalid_unicode_scalar_or_lone_surrogate_in_key_or_value'],
  output: 'null_prototype_owned_recursively_frozen_snapshot_or_frozen_dense_array',
  validation_hash_and_use_input: 'owned_snapshot_only',
  check_use_stability: 'later_source_mutation_or_getter_state_cannot_change_owned_snapshot_bytes',
  failure: 'abort_before_validation_hash_use_write_or_disclosure',
}

r41.case_authority_control_result_union.schema_version = 'ctrl.g24.case-authority-control-result-union.r41.v1'
r41.case_authority_control_result_union.total_result_binding = {
  schema_version: 'ctrl.g24.case-authority-control-total-result-binding.r41.v1',
  discriminator_field: 'admission_kind',
  variants: [
    { discriminator: 'pre_admission', authority_ref: 'case_authority_control_pre_admission', result_path: ['rows'] },
    { discriminator: 'operation_registry', authority_ref: 'case_authority_control_operation_registry', result_path: ['admission_outcome_table', 'rows'] },
  ],
  exactly_one_variant: true,
  caller_selectable_variant: false,
}
delete r41.case_authority_control_result_union.total_result_ref
r41.authority_operation_replay_derivation.schema_version = 'ctrl.g24.authority-operation-replay-derivation.r41.v1'
r41.authority_operation_replay_derivation.exact_path_order_by_branch_bindings = Object.keys(r41.authority_operation_replay_branch_map.variants).map(variant => ({ branch_class: variant, source_authority_ref: 'authority_operation_replay_branch_map', source_variant: variant, source_field: 'replay_path' }))
delete r41.authority_operation_replay_derivation.exact_path_order_by_branch_ref
r41.authority_operation_replay_branch_map.local_schema_version = r41.authority_operation_replay_derivation.schema_version

function valueForSpec(spec, seed) {
  if (Object.hasOwn(spec ?? {}, 'const')) return spec.const
  if (Array.isArray(spec?.enum)) return spec.enum[0]
  if (spec?.type === 'enum' && Array.isArray(spec.values)) return spec.values[0]
  if (spec?.type === 'sha256') return sha(seed)
  if (spec?.type === 'sha256_or_exact_literal') return spec.literal
  if (spec?.type === 'canonical_timestamp') return '2026-09-14T00:00:00.000Z'
  if (spec?.type === 'nonnegative_integer' || spec?.type === 'positive_integer' || spec?.type === 'integer') return spec.type === 'positive_integer' ? 1 : 0
  if (spec?.type === 'boolean') return false
  if (String(spec?.type).includes('array')) return []
  if (spec?.schema_ref) return `r41_schema_value_${sha(seed).slice(0, 16)}`
  return `r41_${seed.replace(/[^a-z0-9]/gi, '_').slice(-54)}`
}
function validateSpec(value, spec, path) {
  if (Object.hasOwn(spec ?? {}, 'const')) { if (value !== spec.const) throw new Error(`const:${path}`); return }
  if (Array.isArray(spec?.enum)) { if (!spec.enum.includes(value)) throw new Error(`enum:${path}`); return }
  if (spec?.type === 'enum') { if (!spec.values.includes(value)) throw new Error(`typed_enum:${path}`); return }
  if (spec?.type === 'sha256') { if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) throw new Error(`sha256:${path}`); return }
  if (spec?.type === 'sha256_or_exact_literal') { if (value !== spec.literal && (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value))) throw new Error(`sha_or_literal:${path}`); return }
  if (spec?.type === 'identifier') { if (typeof value !== 'string' || value.length === 0) throw new Error(`identifier:${path}`); return }
  if (spec?.type === 'canonical_timestamp') { if (typeof value !== 'string' || new Date(value).toISOString() !== value) throw new Error(`timestamp:${path}`); return }
  if (spec?.type === 'nonnegative_integer' && (!Number.isInteger(value) || value < 0 || Object.is(value, -0))) throw new Error(`nonnegative:${path}`)
  if (spec?.type === 'positive_integer' && (!Number.isInteger(value) || value <= 0)) throw new Error(`positive:${path}`)
  if (spec?.type === 'integer' && (!Number.isInteger(value) || Object.is(value, -0))) throw new Error(`integer:${path}`)
  if (String(spec?.type).includes('array') && !Array.isArray(value)) throw new Error(`array:${path}`)
  if (spec?.type === 'boolean' && typeof value !== 'boolean') throw new Error(`boolean:${path}`)
  if (spec?.schema_ref) { if (typeof value !== 'string' || value.length === 0) throw new Error(`schema_ref:${path}`); return }
  if (!spec?.type && !spec?.schema_ref) throw new Error(`unsupported_spec:${path}`)
}
function validateRow(contract, artifact) {
  const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value
  if (!schema || schema.additional_properties !== false || canonical(Object.keys(row)) !== canonical(schema.exact_keys) || schema.required.some(key => !Object.hasOwn(row, key))) throw new Error(`row_shape:${artifact.fixture_artifact_id}`)
  for (const [field, spec] of Object.entries(schema.properties)) validateSpec(row[field], spec, `${artifact.fixture_artifact_id}.${field}`)
  for (const prefix of ['raw_target', 'raw_proof', 'raw_bundle', 'raw_issuer_proof', 'raw_evaluator_proof']) if (Object.hasOwn(row, `${prefix}_availability`)) { const unavailable = row[`${prefix}_availability`] === 'unavailable'; if (unavailable !== (row[`${prefix}_ref_or_unavailable`] === 'UNAVAILABLE' && row[`${prefix}_sha256_or_unavailable`] === 'UNAVAILABLE')) throw new Error(`availability:${artifact.fixture_artifact_id}:${prefix}`) }
  return true
}
function makeArtifact(contract, fixtureId, schemaRef, variant, selected, correlations) {
  const schema = schemaAt(contract, schemaRef, variant), row = {}
  for (const [field, spec] of Object.entries(schema.properties)) row[field] = valueForSpec(spec, `${fixtureId}:${variant}:${field}`)
  Object.assign(row, selected, correlations)
  for (const prefix of ['raw_target', 'raw_proof', 'raw_bundle', 'raw_issuer_proof', 'raw_evaluator_proof']) if (Object.hasOwn(row, `${prefix}_availability`)) { row[`${prefix}_availability`] = 'unavailable'; row[`${prefix}_ref_or_unavailable`] = 'UNAVAILABLE'; row[`${prefix}_sha256_or_unavailable`] = 'UNAVAILABLE' }
  const rowRefField = variant.startsWith('original_') ? 'registry_row_ref' : 'hold_row_ref'
  const rowIdentityPreimage = { domain_ascii: 'CTRL-G24-RESTART-FIXTURE-ROW-IDENTITY-R41', fixture_id: fixtureId, schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, operation_id: row.operation_id, idempotency_key: row.idempotency_key }
  row[rowRefField] = hashCanonical(rowIdentityPreimage)
  const fingerprintField = variant.startsWith('original_') ? 'registry_fingerprint' : 'hold_fingerprint'
  const fingerprintSchema = resolvePath(contract, schema.fingerprint_ref), fingerprintPreimage = {}
  for (const field of fingerprintSchema.preimage_order) fingerprintPreimage[field] = field === 'domain_ascii' ? fingerprintSchema.domain_ascii : row[field]
  row[fingerprintField] = hashCanonical(fingerprintPreimage)
  const bytes = canonical(row)
  const artifact = { fixture_artifact_id: `${fixtureId}:${variant}`, schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, row_identity_preimage: rowIdentityPreimage, canonical_row_value: row, canonical_row_bytes_utf8: bytes, canonical_row_bytes_sha256: sha(Buffer.from(bytes, 'utf8')), fingerprint_schema_ref: schema.fingerprint_ref, fingerprint_preimage: fingerprintPreimage, recorded_fingerprint: row[fingerprintField] }
  validateRow(contract, artifact)
  return artifact
}
function selectionFor(operationName, resultBranch) { const row = r41.authority_operation_fresh_branch_class_selection.rows.find(item => item.operation_name === operationName && item.result_branch === resultBranch); if (!row) throw new Error(`missing_selection:${operationName}:${resultBranch}`); return { fresh_selection_row_id: row.selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.selector_schema_version } }
const plans = [
  ['restart_committed', 'bootstrap_case_session_root_anchor', 'committed', 'original_committed', 'UNAVAILABLE'],
  ['restart_ordinary_held', 'bootstrap_case_session_root_anchor', 'authorization_hold', 'original_persisted_hold', 'ordinary_single_proof'],
  ['restart_verified_session_held', 'issue_server_session_principal', 'stale_head_hold', 'original_persisted_hold', 'session_dual_proof'],
  ['restart_raw_session_held', 'issue_server_session_principal', 'invalid_proof_hold', 'original_persisted_hold', 'session_dual_proof'],
]
const targetStore = operation => operation === 'bootstrap_case_session_root_anchor' ? 'case_session_root_trust_anchors' : 'case_server_session_principal_evidence'
const fixtures = plans.map(([fixtureId, operationName, resultBranch, registryVariant, holdVariant]) => {
  const selected = selectionFor(operationName, resultBranch), operationId = `op_${fixtureId}`, idempotencyKey = sha(`${fixtureId}:idempotency`), requestFingerprint = sha(`${fixtureId}:request`), store = targetStore(operationName), heldAt = '2026-09-14T00:00:00.000Z', resultRef = sha(`${fixtureId}:result-ref`), resultBytes = sha(`${fixtureId}:result-bytes`), resultFp = sha(`${fixtureId}:result-fp`)
  const common = { target_store: store, operation_name: operationName, operation_id: operationId, idempotency_key: idempotencyKey, request_fingerprint: requestFingerprint }
  const hold = holdVariant === 'UNAVAILABLE' ? 'UNAVAILABLE' : makeArtifact(r41, fixtureId, 'authority_operation_hold_store.row_union', holdVariant, selected, { ...common, hold_branch: resultBranch, request_artifact_ref: sha(`${fixtureId}:request-artifact`), request_artifact_sha256: sha(`${fixtureId}:request-bytes`), result_ref: resultRef, result_bytes_sha256: resultBytes, result_fingerprint: resultFp, held_at: heldAt, ...(holdVariant === 'session_dual_proof' ? { session_hold_evidence_ref: sha(`${fixtureId}:session-evidence-ref`), session_hold_evidence_bytes_sha256: sha(`${fixtureId}:session-evidence-bytes`), session_hold_evidence_fingerprint: sha(`${fixtureId}:session-evidence-fp`) } : {}) })
  const registryCorrelations = registryVariant === 'original_committed' ? { ...common, result_branch: resultBranch } : { ...common, hold_branch: resultBranch, hold_result_ref: resultRef, hold_result_bytes_sha256: resultBytes, hold_result_fingerprint: resultFp, held_at: heldAt, hold_fingerprint: hold.recorded_fingerprint, hold_schema_ref: `authority_operation_hold_store.row_union.variants.${holdVariant}`, hold_row_ref: hold.canonical_row_value.hold_row_ref, session_hold_evidence_ref_or_unavailable: holdVariant === 'session_dual_proof' ? hold.canonical_row_value.session_hold_evidence_ref : 'UNAVAILABLE', session_hold_evidence_bytes_sha256_or_unavailable: holdVariant === 'session_dual_proof' ? hold.canonical_row_value.session_hold_evidence_bytes_sha256 : 'UNAVAILABLE', session_hold_evidence_fingerprint_or_unavailable: holdVariant === 'session_dual_proof' ? hold.canonical_row_value.session_hold_evidence_fingerprint : 'UNAVAILABLE' }
  const registry = makeArtifact(r41, fixtureId, 'authority_operation_registry.row_union', registryVariant, selected, registryCorrelations)
  const classifierRow = r41.authority_operation_replay_classifier.rows.find(row => row.expected_selection_row_id === selected.fresh_selection_row_id && row.operation_name === operationName && row.result_branch === resultBranch)
  return { fixture_id: fixtureId, operation_name: operationName, result_branch: resultBranch, registry_artifact: registry, hold_artifact_or_UNAVAILABLE: hold, classifier_row: classifierRow, expected_reconstructed_selection: selected }
})
const fixtureArtifacts = fixtures.flatMap(fixture => [fixture.registry_artifact, ...(fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE' ? [] : [fixture.hold_artifact_or_UNAVAILABLE])])
if (fixtureArtifacts.length !== 7) throw new Error('fixture_artifact_count')
for (const artifact of fixtureArtifacts) validateRow(r41, artifact)
for (const field of ['operation_id', 'idempotency_key', 'registry_row_ref']) { const values = fixtures.map(fixture => fixture.registry_artifact.canonical_row_value[field]); if (new Set(values).size !== fixtures.length) throw new Error(`fixture_unique:${field}`) }
for (const fixture of fixtures) if (fixture.hold_artifact_or_UNAVAILABLE !== 'UNAVAILABLE') { const registry = fixture.registry_artifact.canonical_row_value, hold = fixture.hold_artifact_or_UNAVAILABLE.canonical_row_value; for (const field of ['operation_id', 'idempotency_key', 'operation_name', 'target_store', 'fresh_selection_row_id', 'proof_family', 'branch_class', 'evidence_kind', 'fresh_selection_schema_version']) if (registry[field] !== hold[field]) throw new Error(`fixture_registry_hold_splice:${fixture.fixture_id}:${field}`); if (registry.hold_row_ref !== hold.hold_row_ref || registry.hold_fingerprint !== hold.hold_fingerprint) throw new Error(`fixture_registry_hold_identity:${fixture.fixture_id}`) }
for (const fixture of fixtures) { const registry = fixture.registry_artifact.canonical_row_value, selected = selectionFor(fixture.operation_name, fixture.result_branch); for (const [field, value] of Object.entries(selected)) if (registry[field] !== value) throw new Error(`fixture_selection:${fixture.fixture_id}:${field}`); if (registry.target_store !== targetStore(fixture.operation_name)) throw new Error(`fixture_target_store:${fixture.fixture_id}`); if (!fixture.classifier_row || fixture.classifier_row.expected_selection_row_id !== selected.fresh_selection_row_id || fixture.classifier_row.expected_proof_family !== selected.proof_family || fixture.classifier_row.expected_branch_class !== selected.branch_class || fixture.classifier_row.expected_evidence_kind !== selected.evidence_kind || fixture.classifier_row.expected_selector_version !== selected.fresh_selection_schema_version) throw new Error(`fixture_classifier:${fixture.fixture_id}`) }
r41.authority_operation_replay_restart_fixtures = { schema_version: 'ctrl.g24.authority-operation-replay-restart-fixtures.r41.v1', artifact_count: 7, exact_fixture_ids: plans.map(row => row[0]), fixtures, exact_schema_validation: 'every_exact_key_required_additional_properties_const_enum_typed_enum_sha_literal_union_availability_and_branch_correlation', row_identity_rule: 'row_ref_is_sha256_of_declared_domain_separated_row_identity_preimage_before_bytes_and_fingerprint', reconstruction_algorithm: ['owned_snapshot', 'validate_exact_selected_schema_variant', 'recompute_row_identity_ref', 'recompute_canonical_bytes_and_sha256', 'recompute_fingerprint_preimage_and_fingerprint', 'resolve_typed_selection_bindings', 'require_registry_hold_correlations', 'resolve_classifier_and_branch'], any_collision_splice_or_instability: 'hold_without_disclosure_or_write' }
r41.fixture_schema_validator = { schema_version: 'ctrl.g24.fixture-schema-validator.r41.v1', supported_schema_forms: ['const', 'enum_array', 'typed_enum_values', 'sha256', 'sha256_or_exact_literal', 'identifier_and_string_types', 'integer_types', 'boolean', 'arrays', 'schema_ref', 'discriminated_variant'], validation_scope: 'all_7_stored_registry_and_hold_artifacts_plus_cross_field_branch_and_availability_rules', unsupported_schema_form: 'reject_fixture_materialization' }

const totalBinding = r41.case_authority_control_result_union.total_result_binding
const wildcardBindings = r41.authority_operation_replay_derivation.exact_path_order_by_branch_bindings
if (totalBinding.variants.length !== 2 || wildcardBindings.length !== 4) throw new Error('discriminated_reference_binding_count')

r41.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r41.v1', derivation: 'bounded_exact_extension_from_frozen_R40_to_R41_owned_immutable_snapshots_exact_fixture_schema_validation_coherent_identity_derivation_and_complete_explicit_reference_registry', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.owned_immutable_canonical_snapshot_pipeline', '$.case_authority_control_result_union', '$.authority_operation_replay_derivation', '$.authority_operation_replay_branch_map', '$.authority_operation_replay_restart_fixtures', '$.fixture_schema_validator', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: ['$.case_authority_control_result_union.total_result_ref', '$.authority_operation_replay_derivation.exact_path_order_by_branch_ref'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r41_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r41.required_negative_fixture_families = [...new Set([...r41.required_negative_fixture_families, 'owned_snapshot_check_use_stability', 'exact_fixture_schema_validation', 'coherent_fixture_identity_derivation', 'semantic_reference_field_bijection', 'discriminated_compound_and_wildcard_resolution'])]

const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r41.v1'
r41.authority_runtime_semantic_manifest_hash_contract = { schema_version: hashVersion, snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', canonical_codec_ref: 'canonical_json_utf8_encoding', hash_input: 'owned_immutable_snapshot_only', content_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R41', dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R41', graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R41', envelope_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R41', hashing_rule: 'snapshot_then_sha256_exact_unicode_sorted_canonical_JSON_UTF8' }
function contentHash(path, value) { return hashCanonical({ domain_ascii: r41.authority_runtime_semantic_manifest_hash_contract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshot(value) }) }
function dependencyHash(path, scope, rows) { return hashCanonical({ domain_ascii: r41.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return hashCanonical({ domain_ascii: r41.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return hashCanonical({ domain_ascii: r41.authority_runtime_semantic_manifest_hash_contract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

const semanticAuthorityPaths = [...new Set([...r40SemanticAuthorityPaths, 'owned_immutable_canonical_snapshot_pipeline', 'fixture_schema_validator', 'authority_runtime_semantic_reference_field_registry'])].sort(codePointCompare)
r41.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r41.v1', { schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r41.v1' }, type: { const: 'owned_snapshot_self_sealed_runtime_semantic_manifest' }, snapshot_pipeline_ref: { const: 'owned_immutable_canonical_snapshot_pipeline' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, reference_field_registry_ref: { const: 'authority_runtime_semantic_reference_field_registry' }, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, manifest_graph_sha256: fp, manifest_envelope_seal_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })
const priorReferencePaths = materializedR40.authority_runtime_semantic_reference_owner_map.rows.map(row => row.source_field_path)
const explicitFieldNames = [...new Set([...priorReferencePaths.map(path => path.split('.').at(-1)), 'authority_ref', 'source_authority_ref', 'snapshot_pipeline_ref', 'branch_effects_ref', 'field_encoding_ref', 'transition_table_ref'])].sort(codePointCompare)
const literalSkips = new Set(['UNAVAILABLE', 'forbidden', 'reject_and_hold', 'exact_operation_result_variant', 'exact_hold_variant_or_UNAVAILABLE', 'exact_evidence_variant_or_UNAVAILABLE', 'exact_branch_DAG'])
const aliasOwners = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
function ownerFor(ref) { if (aliasOwners[ref]) return [aliasOwners[ref]]; const normalized = ref.replace(/^\$\./, '').replace('.variants.*.', '.variants.'); const matches = semanticAuthorityPaths.filter(path => normalized === path || normalized.startsWith(`${path}.`)).sort((a, b) => b.length - a.length); return matches.length ? [matches[0]] : [] }
function walkRegistered(value, sourceAuthorityPath, fieldPath = sourceAuthorityPath, out = []) { if (!value || typeof value !== 'object') return out; for (const [key, item] of Object.entries(value)) { const next = `${fieldPath}.${key}`; if (explicitFieldNames.includes(key)) { for (const literal of Array.isArray(item) ? item : [item]) if (typeof literal === 'string' && !literalSkips.has(literal)) out.push({ source_authority_path: sourceAuthorityPath, field_path: next, field_name: key, reference_kind: literal.includes('*') ? 'wildcard' : 'literal_or_typed', reference_literal: literal }) } walkRegistered(item, sourceAuthorityPath, next, out) } return out }
const referenceRows = []
for (const path of semanticAuthorityPaths) {
  if (['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry'].includes(path)) continue
  for (const row of walkRegistered(resolvePath(r41, path), path)) { const owners = ownerFor(row.reference_literal); if (owners.length !== 1) throw new Error(`unresolved_registered_reference:${canonical(row)}`); referenceRows.push({ ...row, owner_authority_path: owners[0], expected_owner_schema_version: semanticVersion(owners[0], resolvePath(r41, owners[0])) }) }
}
r41.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r41.v1', row_schema: closed('ctrl.g24.runtime-semantic-reference-field-registry-row.r41.v1', { source_authority_path: id, field_path: id, field_name: id, reference_kind: { type: 'enum', values: ['literal_or_typed', 'wildcard', 'compound'] }, reference_literal: id, owner_authority_path: id, expected_owner_schema_version: id }), exact_field_names: explicitFieldNames, resolution_grammar: { literal_or_typed: 'longest_exact_manifested_top_level_prefix_or_pinned_alias', wildcard: 'pinned_discriminator_expansion_to_exact_variant_properties', compound: 'closed_discriminated_variant_rows_each_with_one_exact_owner' }, exact_occurrence_rows: referenceRows.sort((a, b) => codePointCompare(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`)), exact_expected_occurrence_count: referenceRows.length, occurrence_bijection: 'every_actual_registered_field_occurrence_exactly_once_and_every_row_resolves_back_to_the_exact_owned_snapshot_occurrence', unknown_ref_like_authority_semantics: 'reject_materialization_and_hold_without_disclosure_or_write', inference_from_suffix_or_regex_only: 'forbidden', total_result_compound_binding_ref: 'case_authority_control_result_union.total_result_binding', replay_wildcard_eliminated_by_ref: 'authority_operation_replay_derivation.exact_path_order_by_branch_bindings' }
r41.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r41.v1', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', row_count: referenceRows.length, ownership_rule: 'each_explicit_occurrence_has_exactly_one_manifested_owner_and_owner_schema_version' }

const priorOwners = Object.fromEntries(materializedR40.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const occurrenceDeps = {}; for (const row of referenceRows) (occurrenceDeps[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const dependencyOverrides = { operation_authority: ['case_authority_bindings', 'derived_authority_predicates', 'workload_authority_predicates'], case_authority_control_result_union: ['case_authority_control_pre_admission', 'case_authority_control_operation_registry'], authority_operation_replay_derivation: ['authority_operation_replay_branch_map', 'authority_operation_replay_resolution_bindings', 'authority_operation_replay_registry_authority', 'authority_operation_replay_classifier'], authority_operation_replay_restart_fixtures: ['authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_classifier', 'fingerprint_schemas', 'fixture_schema_validator', 'owned_immutable_canonical_snapshot_pipeline'], authority_runtime_semantic_manifest_hash_contract: ['owned_immutable_canonical_snapshot_pipeline', 'canonical_json_utf8_encoding'], authority_runtime_semantic_reference_field_registry: [], fixture_schema_validator: [], owned_immutable_canonical_snapshot_pipeline: [], materialization: [], schema_change_manifest: [] }
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(dependencyOverrides[path] ?? priorOwners[path] ?? []), ...[...(occurrenceDeps[path] ?? [])]])].filter(owner => semanticAuthorityPaths.includes(owner) && owner !== path).sort(codePointCompare), unqualified_legacy_alias_owner_path: path }))
r41.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r41.v1', exact_paths: semanticAuthorityPaths, rows: ownerRows, reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', explicit_reference_edges_required: true, unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write' }

delete r41.authority_runtime_semantic_manifest
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, resolvePath(r41, path))]))
const graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = resolvePath(r41, path), directPaths = graph[path], directRows = directPaths.map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })), transitiveRows = transitive(path).map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })); return { authority_path: path, semantic_kind: kindOf(value), exact_keyset: keysetOf(value), authority_schema_ref: path, authority_schema_version: semanticVersion(path, value), direct_dependency_paths: directPaths, direct_dependency_content_hashes: directRows, direct_dependency_set_sha256: dependencyHash(path, 'direct', directRows), transitive_dependency_paths: transitiveRows.map(row => row.authority_path), transitive_dependency_content_hashes: transitiveRows, transitive_dependency_set_sha256: dependencyHash(path, 'transitive', transitiveRows), authority_content_sha256: contentHashes[path] } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r41.v1', type: 'owned_snapshot_self_sealed_runtime_semantic_manifest', snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, manifest_graph_sha256: graphHash(manifestRows) }
r41.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: envelopeHash(manifestWithoutSeal) }
r41.visible_surface_changes = []
r41.external_actions_authorized = []

const finalSnapshot = ownedSnapshot(r41)
export const materializedR41 = r41
export const materializedR41Snapshot = finalSnapshot
export const materializedR41Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const ownedSnapshotR41 = ownedSnapshot
export const canonicalR41 = canonical
export const r41SemanticAuthorityPaths = semanticAuthorityPaths
export const validateR41FixtureRow = validateRow
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR41Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR41Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R41 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
