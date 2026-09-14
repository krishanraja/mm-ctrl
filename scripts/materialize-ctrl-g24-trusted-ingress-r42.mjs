import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { types as nodeUtilTypes } from 'node:util'
import { materializedR41, r41SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r41.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r41.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r42.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')

// Captured during isolated module bootstrap, before any caller-controlled value is accepted.
const PrimordialReflectApply = Reflect.apply
const PrimordialReflectOwnKeys = Reflect.ownKeys
const PrimordialReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor
const PrimordialObjectGetPrototypeOf = Object.getPrototypeOf
const PrimordialObjectFreeze = Object.freeze
const PrimordialObjectCreate = Object.create
const PrimordialObjectHasOwn = Object.hasOwn
const PrimordialObjectIs = Object.is
const PrimordialArrayIsArray = Array.isArray
const PrimordialJSONstringify = JSON.stringify
const PrimordialNumberIsFinite = Number.isFinite
const PrimordialNumberIsInteger = Number.isInteger
const PrimordialStringCharCodeAt = String.prototype.charCodeAt
const PrimordialBufferByteLength = Buffer.byteLength
const PrimordialIsProxy = nodeUtilTypes.isProxy
const PrimordialStructuredClone = globalThis.structuredClone
const PrimordialWeakSetHas = WeakSet.prototype.has
const PrimordialWeakSetAdd = WeakSet.prototype.add
const PrimordialWeakSetDelete = WeakSet.prototype.delete
const PrimordialWeakSet = WeakSet
const PrimordialBufferFrom = Buffer.from
const apply = (fn, receiver, args) => PrimordialReflectApply(fn, receiver, args)
const shaBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const id = { type: 'identifier' }
const LIMITS = { max_depth: 128, max_nodes: 1000000, max_string_utf8_bytes: 8388608, max_total_string_utf8_bytes: 67108864, max_array_length: 100000, max_object_keys: 100000 }

function validUnicode(value) { for (let index = 0; index < value.length; index += 1) { const unit = apply(PrimordialStringCharCodeAt, value, [index]); if (unit >= 0xd800 && unit <= 0xdbff) { const next = apply(PrimordialStringCharCodeAt, value, [index + 1]); if (!(next >= 0xdc00 && next <= 0xdfff)) return false; index += 1 } else if (unit >= 0xdc00 && unit <= 0xdfff) return false } return true }
function snapshotOwned(value, state = { nodes: 0, stringBytes: 0, ancestors: new PrimordialWeakSet() }, depth = 0, path = '$') {
  if (depth > LIMITS.max_depth) throw new Error(`max_depth:${path}`)
  state.nodes += 1
  if (state.nodes > LIMITS.max_nodes) throw new Error(`max_nodes:${path}`)
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') { if (!validUnicode(value)) throw new Error(`invalid_unicode:${path}`); const bytes = apply(PrimordialBufferByteLength, Buffer, [value, 'utf8']); if (bytes > LIMITS.max_string_utf8_bytes) throw new Error(`max_string_bytes:${path}`); state.stringBytes += bytes; if (state.stringBytes > LIMITS.max_total_string_utf8_bytes) throw new Error(`max_total_string_bytes:${path}`); return value }
  if (typeof value === 'number') { if (!apply(PrimordialNumberIsFinite, Number, [value]) || apply(PrimordialObjectIs, Object, [value, -0])) throw new Error(`invalid_number:${path}`); return value }
  if (typeof value !== 'object') throw new Error(`unsupported_value:${path}:${typeof value}`)
  if (apply(PrimordialIsProxy, nodeUtilTypes, [value])) throw new Error(`proxy:${path}`)
  if (apply(PrimordialWeakSetHas, state.ancestors, [value])) throw new Error(`cycle:${path}`)
  const array = apply(PrimordialArrayIsArray, Array, [value])
  const prototype = apply(PrimordialObjectGetPrototypeOf, Object, [value])
  if ((array && prototype !== Array.prototype) || (!array && prototype !== Object.prototype && prototype !== null)) throw new Error(`unsupported_prototype:${path}`)
  if (array) {
    let lengthDescriptor
    try { lengthDescriptor = apply(PrimordialReflectGetOwnPropertyDescriptor, Reflect, [value, 'length']) } catch { throw new Error(`throwing_length_descriptor:${path}`) }
    if (!lengthDescriptor || !apply(PrimordialObjectHasOwn, Object, [lengthDescriptor, 'value']) || !apply(PrimordialNumberIsInteger, Number, [lengthDescriptor.value]) || lengthDescriptor.value < 0 || lengthDescriptor.value > LIMITS.max_array_length) throw new Error(`array_length_bound:${path}`)
  }
  let keys
  try { keys = apply(PrimordialReflectOwnKeys, Reflect, [value]) } catch { throw new Error(`throwing_reflection:${path}`) }
  if (keys.length > LIMITS.max_object_keys + (array ? 1 : 0)) throw new Error(`max_keys:${path}`)
  apply(PrimordialWeakSetAdd, state.ancestors, [value])
  if (array) {
    const lengthDescriptor = apply(PrimordialReflectGetOwnPropertyDescriptor, Reflect, [value, 'length'])
    const length = lengthDescriptor.value
    if (keys.length !== length + 1) throw new Error(`sparse_or_extra_array_key:${path}`)
    const seen = apply(PrimordialObjectCreate, Object, [null])
    for (let index = 0; index < keys.length; index += 1) { const key = keys[index]; if (typeof key === 'symbol') throw new Error(`symbol_key:${path}`); if (key !== 'length') { if (apply(PrimordialObjectHasOwn, Object, [seen, key])) throw new Error(`duplicate_array_key:${path}`); seen[key] = true } }
    const output = []
    for (let index = 0; index < length; index += 1) { const key = `${index}`; if (!seen[key]) throw new Error(`sparse_array:${path}[${index}]`); let descriptor; try { descriptor = apply(PrimordialReflectGetOwnPropertyDescriptor, Reflect, [value, key]) } catch { throw new Error(`throwing_descriptor:${path}[${index}]`) } if (!descriptor || !descriptor.enumerable || !apply(PrimordialObjectHasOwn, Object, [descriptor, 'value']) || descriptor.get || descriptor.set) throw new Error(`invalid_array_descriptor:${path}[${index}]`); output[index] = snapshotOwned(descriptor.value, state, depth + 1, `${path}[${index}]`) }
    apply(PrimordialWeakSetDelete, state.ancestors, [value])
    return apply(PrimordialObjectFreeze, Object, [output])
  }
  if (keys.length > LIMITS.max_object_keys) throw new Error(`max_object_keys:${path}`)
  const output = apply(PrimordialObjectCreate, Object, [null])
  for (let index = 0; index < keys.length; index += 1) { const key = keys[index]; if (typeof key === 'symbol') throw new Error(`symbol_key:${path}`); if (!validUnicode(key)) throw new Error(`invalid_unicode_key:${path}`); let descriptor; try { descriptor = apply(PrimordialReflectGetOwnPropertyDescriptor, Reflect, [value, key]) } catch { throw new Error(`throwing_descriptor:${path}.${key}`) } if (!descriptor || !descriptor.enumerable || !apply(PrimordialObjectHasOwn, Object, [descriptor, 'value']) || descriptor.get || descriptor.set) throw new Error(`invalid_object_descriptor:${path}.${key}`); output[key] = snapshotOwned(descriptor.value, state, depth + 1, `${path}.${key}`) }
  apply(PrimordialWeakSetDelete, state.ancestors, [value])
  return apply(PrimordialObjectFreeze, Object, [output])
}
function codePointAt(value, index) { const first = apply(PrimordialStringCharCodeAt, value, [index]); if (first >= 0xd800 && first <= 0xdbff && index + 1 < value.length) { const second = apply(PrimordialStringCharCodeAt, value, [index + 1]); if (second >= 0xdc00 && second <= 0xdfff) return [((first - 0xd800) * 0x400) + second - 0xdc00 + 0x10000, 2] } return [first, 1] }
function codePointCompare(left, right) { let li = 0, ri = 0; while (li < left.length && ri < right.length) { const leftPoint = codePointAt(left, li), rightPoint = codePointAt(right, ri), lc = leftPoint[0], ln = leftPoint[1], rc = rightPoint[0], rn = rightPoint[1]; if (lc !== rc) return lc - rc; li += ln; ri += rn } return left.length - right.length }
function sortedKeys(value) { const keys = apply(PrimordialReflectOwnKeys, Reflect, [value]), strings = []; for (let index = 0; index < keys.length; index += 1) { if (typeof keys[index] === 'symbol') throw new Error('snapshot_symbol'); strings[index] = keys[index] } for (let index = 1; index < strings.length; index += 1) { const current = strings[index]; let prior = index - 1; while (prior >= 0 && codePointCompare(strings[prior], current) > 0) { strings[prior + 1] = strings[prior]; prior -= 1 } strings[prior + 1] = current } return strings }
function canonicalSnapshot(value) { if (value === null || typeof value !== 'object') return apply(PrimordialJSONstringify, JSON, [value]); if (apply(PrimordialArrayIsArray, Array, [value])) { let output = '['; for (let index = 0; index < value.length; index += 1) { if (index) output += ','; output += canonicalSnapshot(value[index]) } return `${output}]` } const keys = sortedKeys(value); let output = '{'; for (let index = 0; index < keys.length; index += 1) { if (index) output += ','; output += `${apply(PrimordialJSONstringify, JSON, [keys[index]])}:${canonicalSnapshot(value[keys[index]])}` } return `${output}}` }
function canonical(value) { return canonicalSnapshot(snapshotOwned(value)) }
const hashCanonical = value => shaBytes(apply(PrimordialBufferFrom, Buffer, [canonical(value), 'utf8']))
function closed(version, properties, extras = {}) { const optional = extras.optional ?? [], keys = Object.keys(properties), value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function resolvePath(object, path) { let value = object; const parts = path.split('.'); for (let index = 0; index < parts.length; index += 1) { if (!value || !Object.hasOwn(value, parts[index])) return undefined; value = value[parts[index]] } return value }
function schemaAt(contract, schemaRef, variant = 'UNAVAILABLE') { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema }
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r42.v1` }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }

const r42 = apply(PrimordialStructuredClone, undefined, [materializedR41])
r42.schema_version = 'ctrl.g24.trusted-ingress.r42.effective.v1'
r42.status = 'forty_second_repair_candidate_under_independent_review'
r42.supersedes = { commit: 'a52ca705f1e0ff4dc2b6354a1b0d4fea64b9c8f9', tree: '3c4ac97b483e6a1b11670531a04384655944154b', human_blob: '46edaf251c4afecb088568f6962f3b5ef082cf70', machine_blob: 'e0efc391d87e9b851fc8e96cc8101f9725e45f45', qa_blob: '906324acc1368e3aa8e6a3571b18589aeb7c43ed', checker_blob: 'f2ff6749f6e7a324148076d294b15ef9a8f63efa', materializer_blob: '95d813d5f19ddb7d449bb4e084bd848d485633f2', founder_checker_blob: '9ed048bb245ba27a8eb0c1730e91faf4a691e924', adjudication: 'veto' }
r42.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r42.mjs', frozen_input: { path: inputPath, sha256: shaBytes(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, isolated_bootstrap_assumption: 'trusted_node_module_realm_captures_primordials_before_any_caller_controlled_value_or_prototype_mutation', snapshot_before_validation_hash_or_use: true, caller_writer_or_precedence_extensions: 'forbidden' }
r42.owned_immutable_canonical_snapshot_pipeline = { schema_version: 'ctrl.g24.owned-immutable-canonical-snapshot-pipeline.r42.v1', bootstrap: r42.materialization.isolated_bootstrap_assumption, captured_primordials: ['Reflect.apply', 'Reflect.ownKeys', 'Reflect.getOwnPropertyDescriptor', 'Object.getPrototypeOf', 'Object.freeze', 'Array.isArray', 'JSON.stringify', 'Number.isFinite', 'String.prototype.charCodeAt', 'Buffer.byteLength', 'util.types.isProxy', 'structuredClone'], caller_mutable_intrinsics_after_bootstrap: 'ignored', traversal: 'owned_descriptor_values_read_once_after_exact_resource_preflight', accepted_prototypes: ['null', 'Object.prototype', 'Array.prototype_for_arrays_only'], rejected: ['proxy', 'throwing_reflection', 'symbol_key', 'non_enumerable_property', 'accessor', 'getter', 'setter', 'array_named_or_extra_key', 'sparse_array', 'cycle', 'nonfinite_number', 'negative_zero', 'unsupported_type', 'invalid_unicode_scalar_or_lone_surrogate_in_key_or_value', 'resource_limit'], output: 'null_prototype_owned_recursively_frozen_snapshot_or_frozen_dense_array', validation_hash_and_use_input: 'owned_snapshot_only', failure: 'abort_before_validation_hash_use_write_or_disclosure' }
r42.canonical_snapshot_resource_limits = { schema_version: 'ctrl.g24.canonical-snapshot-resource-limits.r42.v1', ...LIMITS, array_preflight_order: ['read_own_length_data_descriptor', 'reject_length_above_max_before_ownKeys_or_output_allocation', 'Reflect.ownKeys_once', 'reject_key_count_mismatch_before_output_allocation', 'validate_dense_exact_indices', 'allocate_and_copy'], object_preflight_order: ['Reflect.ownKeys_once', 'reject_key_count_above_max_before_output_allocation', 'validate_own_enumerable_data_descriptors', 'allocate_and_copy'], cumulative_limits_apply_before_next_value_copy: true }

for (const [variantName, schema] of Object.entries(r42.authority_operation_registry.row_union.variants)) {
  schema.schema_version = `ctrl.g24.authority-operation-registry-${variantName.replaceAll('_', '-')}.r42.v1`
  schema.row_ref_schema_version = 'ctrl.g24.authority-operation-registry-row-identity-preimage.r42.v1'
  schema.row_ref_domain_ascii = `CTRL-G24-AUTHORITY-OPERATION-REGISTRY-${variantName.toUpperCase()}-ROW-REF-R42`
  schema.row_ref_preimage_included_fields = schema.exact_keys.filter(field => !['registry_row_ref', 'registry_fingerprint'].includes(field))
  schema.row_ref_preimage_excluded_fields = ['registry_row_ref', 'registry_fingerprint']
  schema.row_ref_preimage = 'domain_ascii_schema_version_and_ordered_exact_row_fields_excluding_precisely_registry_row_ref_and_registry_fingerprint'
}
r42.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r42.v1'
r42.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r42.v1'
for (const [variantName, schema] of Object.entries(r42.authority_operation_hold_store.row_union.variants)) {
  schema.schema_version = `ctrl.g24.authority-operation-hold-${variantName.replaceAll('_', '-')}.r42.v1`
  schema.row_ref_schema_version = 'ctrl.g24.authority-operation-hold-row-identity-preimage.r42.v1'
  schema.row_ref_domain_ascii = `CTRL-G24-AUTHORITY-OPERATION-HOLD-${variantName.toUpperCase()}-ROW-REF-R42`
  schema.row_ref_preimage = 'domain_ascii_schema_version_and_ordered_exact_declared_row_ref_preimage_included_fields'
}
r42.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r42.v1'
r42.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r42.v1'
r42.normative_row_ref_derivation = { schema_version: 'ctrl.g24.normative-row-ref-derivation.r42.v1', registry: 'read_selected_registry_variant.row_ref_domain_ascii_row_ref_schema_version_and_row_ref_preimage_included_fields', hold: 'read_selected_hold_variant.row_ref_domain_ascii_row_ref_schema_version_and_row_ref_preimage_included_fields', preimage_shape: ['domain_ascii', 'schema_version', 'ordered_fields'], ordered_field_shape: ['field', 'value'], fixture_specific_formula: 'forbidden', fingerprint_then_bytes_order: ['derive_row_ref', 'assemble_fingerprint_preimage', 'derive_fingerprint', 'assemble_final_row', 'canonicalize_final_row', 'derive_final_bytes_sha256'] }

function valueForSpec(spec, seed) {
  if (Object.hasOwn(spec ?? {}, 'const')) return spec.const
  if (Array.isArray(spec?.enum)) return spec.enum[0]
  if (spec?.type === 'enum' && Array.isArray(spec.values)) return spec.values[0]
  if (spec?.type === 'sha256') return shaBytes(seed)
  if (spec?.type === 'sha256_or_exact_literal') return spec.literal
  if (spec?.type === 'canonical_timestamp') return '2026-09-14T00:00:00.000Z'
  if (spec?.type === 'nullable') return null
  if (spec?.type === 'boolean') return false
  if (spec?.type === 'positive_integer') return 1
  if (spec?.type === 'integer' || spec?.type === 'nonnegative_integer') return 0
  if (String(spec?.type).includes('array')) return []
  return `r42_${shaBytes(seed).slice(0, 24)}`
}
function validateSpec(value, spec, path) {
  if (Object.hasOwn(spec ?? {}, 'const')) { if (value !== spec.const) throw new Error(`const:${path}`); return }
  if (Array.isArray(spec?.enum)) { if (!spec.enum.includes(value)) throw new Error(`enum:${path}`); return }
  if (spec?.type === 'enum') { if (!spec.values.includes(value)) throw new Error(`typed_enum:${path}`); return }
  if (spec?.type === 'sha256') { if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) throw new Error(`sha:${path}`); return }
  if (spec?.type === 'sha256_or_exact_literal') { if (value !== spec.literal && (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value))) throw new Error(`sha_literal:${path}`); return }
  if (spec?.type === 'canonical_timestamp') { if (typeof value !== 'string' || new Date(value).toISOString() !== value) throw new Error(`timestamp:${path}`); return }
  if (spec?.type === 'nullable') { if (value !== null) validateSpec(value, spec.value_schema, path); return }
  if (spec?.type === 'identifier' || spec?.schema_ref) { if (typeof value !== 'string' || !value.length) throw new Error(`identifier:${path}`); return }
  if (spec?.type === 'boolean') { if (typeof value !== 'boolean') throw new Error(`boolean:${path}`); return }
  if (spec?.type === 'positive_integer') { if (!Number.isInteger(value) || value <= 0) throw new Error(`positive:${path}`); return }
  if (spec?.type === 'integer' || spec?.type === 'nonnegative_integer') { if (!Number.isInteger(value) || Object.is(value, -0) || (spec.type === 'nonnegative_integer' && value < 0)) throw new Error(`integer:${path}`); return }
  if (String(spec?.type).includes('array')) { if (!Array.isArray(value)) throw new Error(`array:${path}`); return }
  throw new Error(`unsupported_spec:${path}`)
}
function orderedFields(row, fields) { const result = []; for (const field of fields) { if (!Object.hasOwn(row, field)) throw new Error(`missing_row_ref_operand:${field}`); result.push({ field, value: row[field] }) } return result }
function deriveNormativeRowRef(schema, row) { return hashCanonical({ domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: orderedFields(row, schema.row_ref_preimage_included_fields) }) }
function validateRow(schema, row, label) { const keys = Object.keys(row); if (schema.type !== 'object' || schema.additional_properties !== false || canonical(keys) !== canonical(schema.exact_keys)) throw new Error(`shape:${label}`); for (const field of schema.required) if (!Object.hasOwn(row, field)) throw new Error(`required:${label}:${field}`); for (const [field, spec] of Object.entries(schema.properties)) validateSpec(row[field], spec, `${label}.${field}`) }
function fingerprintFor(contract, schema, row) { const fingerprintSchema = resolvePath(contract, schema.fingerprint_ref), preimage = {}; for (const field of fingerprintSchema.preimage_order) { if (field !== 'domain_ascii' && !Object.hasOwn(row, field)) throw new Error(`fingerprint_operand:${field}`); preimage[field] = field === 'domain_ascii' ? fingerprintSchema.domain_ascii : row[field] } return { ref: schema.fingerprint_ref, preimage, fingerprint: hashCanonical(preimage) } }
function makeArtifact(contract, fixtureId, schemaRef, variant, overrides, withNormativeRowRef = false) {
  const schema = schemaAt(contract, schemaRef, variant), row = {}
  for (const [field, spec] of Object.entries(schema.properties)) row[field] = valueForSpec(spec, `${fixtureId}:${schemaRef}:${variant}:${field}`)
  Object.assign(row, overrides)
  if (withNormativeRowRef) { const rowRefField = variant.startsWith('original_') ? 'registry_row_ref' : 'hold_row_ref'; row[rowRefField] = deriveNormativeRowRef(schema, row) }
  const derived = fingerprintFor(contract, schema, row)
  row[schema.fingerprint_field] = derived.fingerprint
  validateRow(schema, row, `${fixtureId}:${variant}`)
  const bytes = canonical(row), bytesSha = shaBytes(Buffer.from(bytes, 'utf8'))
  return { fixture_artifact_id: `${fixtureId}:${variant}`, schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, normative_row_ref_preimage: withNormativeRowRef ? { domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: orderedFields(row, schema.row_ref_preimage_included_fields) } : 'UNAVAILABLE', canonical_row_value: row, canonical_row_bytes_utf8: bytes, canonical_row_bytes_sha256: bytesSha, content_addressed_artifact_ref: bytesSha, fingerprint_schema_ref: derived.ref, fingerprint_preimage: derived.preimage, recorded_fingerprint: derived.fingerprint }
}
function selectionFor(operationName, resultBranch) { const row = r42.authority_operation_fresh_branch_class_selection.rows.find(item => item.operation_name === operationName && item.result_branch === resultBranch); if (!row) throw new Error(`selection:${operationName}:${resultBranch}`); return { fresh_selection_row_id: row.selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.selector_schema_version } }
const plans = [
  ['restart_committed', 'bootstrap_case_session_root_anchor', 'committed', 'original_committed', 'UNAVAILABLE'],
  ['restart_ordinary_held', 'bootstrap_case_session_root_anchor', 'authorization_hold', 'original_persisted_hold', 'ordinary_single_proof'],
  ['restart_verified_session_held', 'issue_server_session_principal', 'stale_head_hold', 'original_persisted_hold', 'session_dual_proof'],
  ['restart_raw_session_held', 'issue_server_session_principal', 'invalid_proof_hold', 'original_persisted_hold', 'session_dual_proof'],
]
function targetStore(operationName) { return operationName === 'bootstrap_case_session_root_anchor' ? 'case_session_root_trust_anchors' : 'case_server_session_principal_evidence' }
function triple(seed) { return { ref: shaBytes(`${seed}:ref`), bytes_sha256: shaBytes(`${seed}:bytes`), fingerprint: shaBytes(`${seed}:fingerprint`) } }
function historyArtifact(fixtureId, operationName, resultBranch, operationId, result) { const matrix = r42.authority_operation_historical_response_schema_matrix.rows.find(row => row.operation_name === operationName && row.result_branch === resultBranch); return makeArtifact(r42, fixtureId, 'authority_operation_historical_response_schema', 'UNAVAILABLE', { operation_name: operationName, operation_id: operationId, result_branch: resultBranch, response_schema_ref: matrix.response_schema_ref, response_schema_version: matrix.response_schema_version, response_payload_ref: result.ref, response_payload_bytes_sha256: result.bytes_sha256, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint }) }
function payloadArtifact(fixtureId, operationName, resultBranch, operationId, result, history, registry, hold) { const held = hold !== 'UNAVAILABLE'; return makeArtifact(r42, fixtureId, 'authority_operation_replay_payload_schema', held ? 'replayed_held' : 'replayed', { replay_kind: held ? 'replayed_held' : 'replayed', operation_name: operationName, operation_id: operationId, historical_result_branch: resultBranch, historical_result_ref: result.ref, historical_result_bytes_sha256: result.bytes_sha256, historical_result_fingerprint: result.fingerprint, stored_historical_response_ref: history.content_addressed_artifact_ref, stored_historical_response_bytes_sha256: history.canonical_row_bytes_sha256, stored_historical_response_fingerprint: history.recorded_fingerprint, ...(held ? { held_registry_row_ref: registry.canonical_row_value.registry_row_ref, held_registry_row_fingerprint: registry.recorded_fingerprint, hold_row_ref: hold.canonical_row_value.hold_row_ref, hold_row_fingerprint: hold.recorded_fingerprint, session_hold_evidence_ref_or_unavailable: registry.canonical_row_value.session_hold_evidence_ref_or_unavailable, session_hold_evidence_bytes_sha256_or_unavailable: registry.canonical_row_value.session_hold_evidence_bytes_sha256_or_unavailable, session_hold_evidence_fingerprint_or_unavailable: registry.canonical_row_value.session_hold_evidence_fingerprint_or_unavailable, held_at: registry.canonical_row_value.held_at } : { committed_registry_row_ref: registry.canonical_row_value.registry_row_ref, committed_registry_row_fingerprint: registry.recorded_fingerprint }) }) }
function envelopeArtifact(fixtureId, operationName, resultBranch, operationId, history, payload, held) { return makeArtifact(r42, fixtureId, 'authority_operation_replay_envelope_schema', 'UNAVAILABLE', { envelope_kind: 'authority_operation_replay', replay_kind: held ? 'replayed_held' : 'replayed', operation_name: operationName, operation_id: operationId, historical_result_branch: resultBranch, payload_ref: payload.content_addressed_artifact_ref, payload_bytes_sha256: payload.canonical_row_bytes_sha256, payload_fingerprint: payload.recorded_fingerprint, replay_response_ref: history.content_addressed_artifact_ref, replay_response_bytes_sha256: history.canonical_row_bytes_sha256, replay_response_fingerprint: history.recorded_fingerprint }) }

function sessionEvidenceArtifact(fixtureId, operationName, resultBranch, operationId, evidenceKind, raw) {
  if (evidenceKind === 'verified_session_hold_evidence') {
    const bundle = triple(`${fixtureId}:bundle`), projection = triple(`${fixtureId}:projection`), issuerProof = triple(`${fixtureId}:issuer-proof`), evaluatorProof = triple(`${fixtureId}:evaluator-proof`), issuerNonce = triple(`${fixtureId}:issuer-nonce`), evaluatorNonce = triple(`${fixtureId}:evaluator-nonce`), readSet = triple(`${fixtureId}:read-set`), target = triple(`${fixtureId}:target-evidence`)
    const artifact = makeArtifact(r42, fixtureId, 'session_hold_evidence_schema', 'verified_consuming', { evidence_kind: 'verified_consuming', operation_name: operationName, operation_id: operationId, hold_branch: resultBranch, bundle_ref: bundle.ref, bundle_bytes_sha256: bundle.bytes_sha256, bundle_fingerprint: bundle.fingerprint, bundle_truth_projection_ref: projection.ref, bundle_truth_projection_bytes_sha256: projection.bytes_sha256, bundle_truth_projection_fingerprint: projection.fingerprint, issuer_proof_ref: issuerProof.ref, issuer_proof_bytes_sha256: issuerProof.bytes_sha256, issuer_proof_fingerprint: issuerProof.fingerprint, evaluator_proof_ref: evaluatorProof.ref, evaluator_proof_bytes_sha256: evaluatorProof.bytes_sha256, evaluator_proof_fingerprint: evaluatorProof.fingerprint, issuer_nonce_receipt_ref: issuerNonce.ref, issuer_nonce_receipt_fingerprint: issuerNonce.fingerprint, evaluator_nonce_receipt_ref: evaluatorNonce.ref, evaluator_nonce_receipt_fingerprint: evaluatorNonce.fingerprint, authority_read_set_ref: readSet.ref, authority_read_set_bytes_sha256: readSet.bytes_sha256, authority_read_set_fingerprint: readSet.fingerprint, partition_head_fingerprint: shaBytes(`${fixtureId}:head`), target_evidence_ref: target.ref, target_evidence_bytes_sha256: target.bytes_sha256, target_evidence_fingerprint: target.fingerprint })
    return { artifact, proof_evidence: { issuer_proof: issuerProof, evaluator_proof: evaluatorProof, issuer_nonce_receipt: issuerNonce, evaluator_nonce_receipt: evaluatorNonce, exact_nonce_count: 2 } }
  }
  const artifact = makeArtifact(r42, fixtureId, 'session_hold_evidence_schema', 'raw_non_consuming', { evidence_kind: 'raw_non_consuming', operation_name: operationName, operation_id: operationId, hold_branch: resultBranch, raw_target_ref_or_unavailable: raw.target.ref, raw_target_sha256_or_unavailable: raw.target.bytes_sha256, raw_bundle_ref_or_unavailable: raw.bundle.ref, raw_bundle_sha256_or_unavailable: raw.bundle.bytes_sha256, raw_issuer_proof_ref_or_unavailable: raw.issuer.ref, raw_issuer_proof_sha256_or_unavailable: raw.issuer.bytes_sha256, raw_evaluator_proof_ref_or_unavailable: raw.evaluator.ref, raw_evaluator_proof_sha256_or_unavailable: raw.evaluator.bytes_sha256 })
  return { artifact, proof_evidence: { issuer_proof: 'UNAVAILABLE', evaluator_proof: raw.evaluator, issuer_nonce_receipt: 'UNAVAILABLE', evaluator_nonce_receipt: 'UNAVAILABLE', exact_nonce_count: 0 } }
}
const unavailable = { ref: 'UNAVAILABLE', bytes_sha256: 'UNAVAILABLE', fingerprint: 'UNAVAILABLE' }
const fixtures = plans.map(([fixtureId, operationName, resultBranch, registryVariant, holdVariant]) => {
  const operationId = `op_${fixtureId}`, idempotencyKey = shaBytes(`${fixtureId}:idempotency`), requestFingerprint = shaBytes(`${fixtureId}:request-fingerprint`), request = triple(`${fixtureId}:request`), result = triple(`${fixtureId}:result`), selected = selectionFor(operationName, resultBranch), target_store = targetStore(operationName), heldAt = '2026-09-14T00:00:00.000Z'
  const history = historyArtifact(fixtureId, operationName, resultBranch, operationId, result)
  const raw = holdVariant === 'session_dual_proof' && selected.evidence_kind === 'raw_session_hold_evidence' ? { target: unavailable, bundle: triple(`${fixtureId}:raw-bundle`), issuer: unavailable, evaluator: triple(`${fixtureId}:raw-evaluator`) } : { target: unavailable, bundle: unavailable, issuer: unavailable, evaluator: unavailable }
  const sessionEvidence = holdVariant === 'session_dual_proof' ? sessionEvidenceArtifact(fixtureId, operationName, resultBranch, operationId, selected.evidence_kind, raw) : 'UNAVAILABLE'
  const sessionTriple = sessionEvidence === 'UNAVAILABLE' ? unavailable : { ref: sessionEvidence.artifact.content_addressed_artifact_ref, bytes_sha256: sessionEvidence.artifact.canonical_row_bytes_sha256, fingerprint: sessionEvidence.artifact.recorded_fingerprint }
  const common = { target_store, operation_name: operationName, operation_id: operationId, idempotency_key: idempotencyKey, request_fingerprint: requestFingerprint }
  let hold = 'UNAVAILABLE'
  if (holdVariant !== 'UNAVAILABLE') {
    const rawOverrides = holdVariant === 'ordinary_single_proof'
      ? { raw_target_availability: 'unavailable', raw_target_ref_or_unavailable: 'UNAVAILABLE', raw_target_sha256_or_unavailable: 'UNAVAILABLE', raw_proof_availability: 'unavailable', raw_proof_ref_or_unavailable: 'UNAVAILABLE', raw_proof_sha256_or_unavailable: 'UNAVAILABLE' }
      : { raw_target_availability: raw.target.ref === 'UNAVAILABLE' ? 'unavailable' : 'available', raw_target_ref_or_unavailable: raw.target.ref, raw_target_sha256_or_unavailable: raw.target.bytes_sha256, raw_bundle_availability: raw.bundle.ref === 'UNAVAILABLE' ? 'unavailable' : 'available', raw_bundle_ref_or_unavailable: raw.bundle.ref, raw_bundle_sha256_or_unavailable: raw.bundle.bytes_sha256, raw_issuer_proof_availability: raw.issuer.ref === 'UNAVAILABLE' ? 'unavailable' : 'available', raw_issuer_proof_ref_or_unavailable: raw.issuer.ref, raw_issuer_proof_sha256_or_unavailable: raw.issuer.bytes_sha256, raw_evaluator_proof_availability: raw.evaluator.ref === 'UNAVAILABLE' ? 'unavailable' : 'available', raw_evaluator_proof_ref_or_unavailable: raw.evaluator.ref, raw_evaluator_proof_sha256_or_unavailable: raw.evaluator.bytes_sha256, session_hold_evidence_ref: sessionTriple.ref, session_hold_evidence_bytes_sha256: sessionTriple.bytes_sha256, session_hold_evidence_fingerprint: sessionTriple.fingerprint }
    hold = makeArtifact(r42, fixtureId, 'authority_operation_hold_store.row_union', holdVariant, { ...common, ...selected, hold_branch: resultBranch, request_artifact_ref: request.ref, request_artifact_sha256: request.bytes_sha256, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, held_at: heldAt, ...rawOverrides }, true)
  }
  const registryOverrides = registryVariant === 'original_committed'
    ? { ...common, ...selected, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, target_intent_bytes_ref: shaBytes(`${fixtureId}:target-intent-ref`), target_intent_bytes_sha256: shaBytes(`${fixtureId}:target-intent-bytes`), committed_target_row_ref: shaBytes(`${fixtureId}:target-row-ref`), committed_target_row_bytes_sha256: shaBytes(`${fixtureId}:target-row-bytes`), committed_target_row_fingerprint: shaBytes(`${fixtureId}:target-row-fp`), result_branch: resultBranch, result_ref: result.ref, result_bytes_sha256: result.bytes_sha256, result_fingerprint: result.fingerprint, receipt_ref: shaBytes(`${fixtureId}:receipt-ref`), receipt_precommit_fingerprint: shaBytes(`${fixtureId}:receipt-precommit`), receipt_fingerprint: shaBytes(`${fixtureId}:receipt-fp`), server_committed_at: heldAt, historical_response_ref: history.content_addressed_artifact_ref, historical_response_bytes_sha256: history.canonical_row_bytes_sha256, historical_response_fingerprint: history.recorded_fingerprint }
    : { ...common, ...selected, request_bytes_ref: request.ref, request_bytes_sha256: request.bytes_sha256, hold_branch: resultBranch, raw_input_artifact_refs_fingerprint: shaBytes(`${fixtureId}:raw-input-set`), hold_result_ref: result.ref, hold_result_bytes_sha256: result.bytes_sha256, hold_result_fingerprint: result.fingerprint, held_at: heldAt, hold_fingerprint: hold.recorded_fingerprint, hold_schema_ref: `authority_operation_hold_store.row_union.variants.${holdVariant}`, historical_response_ref: history.content_addressed_artifact_ref, historical_response_bytes_sha256: history.canonical_row_bytes_sha256, historical_response_fingerprint: history.recorded_fingerprint, hold_row_ref: hold.canonical_row_value.hold_row_ref, session_hold_evidence_ref_or_unavailable: sessionTriple.ref, session_hold_evidence_bytes_sha256_or_unavailable: sessionTriple.bytes_sha256, session_hold_evidence_fingerprint_or_unavailable: sessionTriple.fingerprint }
  const registry = makeArtifact(r42, fixtureId, 'authority_operation_registry.row_union', registryVariant, registryOverrides, true)
  const payload = payloadArtifact(fixtureId, operationName, resultBranch, operationId, result, history, registry, hold)
  const envelope = envelopeArtifact(fixtureId, operationName, resultBranch, operationId, history, payload, hold !== 'UNAVAILABLE')
  const classifierRow = r42.authority_operation_replay_classifier.rows.find(row => row.expected_selection_row_id === selected.fresh_selection_row_id && row.operation_name === operationName && row.result_branch === resultBranch)
  return { fixture_id: fixtureId, operation_name: operationName, result_branch: resultBranch, request_fingerprint: requestFingerprint, request_artifact: request, result_artifact: result, historical_response_artifact: history, registry_artifact: registry, hold_artifact_or_UNAVAILABLE: hold, session_evidence_or_UNAVAILABLE: sessionEvidence, replay_payload_artifact: payload, replay_envelope_artifact: envelope, classifier_row: classifierRow, proof_and_nonce_evidence: sessionEvidence === 'UNAVAILABLE' ? { issuer_proof: 'UNAVAILABLE', evaluator_proof: 'UNAVAILABLE', issuer_nonce_receipt: 'UNAVAILABLE', evaluator_nonce_receipt: 'UNAVAILABLE', exact_nonce_count: 0 } : sessionEvidence.proof_evidence, expected_reconstructed_selection: selected }
})

r42.authority_operation_restart_correlation_authority = {
  schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r42.v1',
  evaluation: 'all_applicable_rows_before_issue_commit_or_replay_first_mismatch_holds_without_disclosure_or_write',
  rows: [
    { correlation_id: 'request', applies_to: 'all', exact_equalities: ['fixture.request_fingerprint=registry.request_fingerprint', 'fixture.request_artifact.ref=registry.request_bytes_ref', 'fixture.request_artifact.bytes_sha256=registry.request_bytes_sha256', 'held.fixture.request_artifact.ref=hold.request_artifact_ref', 'held.fixture.request_artifact.bytes_sha256=hold.request_artifact_sha256'] },
    { correlation_id: 'operation_identity', applies_to: 'all', exact_equalities: ['fixture.operation_name=registry.operation_name=history.operation_name=payload.operation_name=envelope.operation_name', 'registry.operation_id=history.operation_id=payload.operation_id=envelope.operation_id', 'held.registry.operation_id=hold.operation_id', 'held.registry.idempotency_key=hold.idempotency_key'] },
    { correlation_id: 'selection', applies_to: 'all', exact_equalities: ['registry.selection_five=selected_fresh_row.selection_five=classifier.selection_five', 'held.registry.selection_five=hold.selection_five'] },
    { correlation_id: 'result_and_history', applies_to: 'all', exact_equalities: ['registry.result_triple=fixture.result_artifact', 'history.result_triple=fixture.result_artifact', 'history.response_payload_ref_and_hash=fixture.result_ref_and_hash', 'payload.historical_result_triple=fixture.result_artifact', 'registry.history_triple=stored_history_artifact'] },
    { correlation_id: 'hold', applies_to: 'held', exact_equalities: ['registry.hold_ref_and_fingerprint=hold.hold_ref_and_fingerprint', 'registry.hold_result_triple=hold.result_triple=fixture.result_artifact', 'registry.held_at=hold.held_at=payload.held_at'] },
    { correlation_id: 'session_evidence', applies_to: 'session_held', exact_equalities: ['registry.session_evidence_triple=hold.session_evidence_triple=stored_session_evidence_artifact', 'verified_session_evidence.proof_and_two_nonce_receipts=fixture.proof_and_nonce_evidence', 'raw_session_evidence.raw_role_slots=hold.raw_role_slots', 'raw_session_evidence.exact_nonce_count=0', 'verified_session_evidence.exact_nonce_count=2'] },
    { correlation_id: 'payload', applies_to: 'all', exact_equalities: ['payload.registry_ref_and_fingerprint=registry.row_ref_and_fingerprint', 'payload.history_triple=stored_history_artifact', 'held.payload.hold_ref_and_fingerprint=hold.row_ref_and_fingerprint', 'payload.result_triple=fixture.result_artifact'] },
    { correlation_id: 'envelope', applies_to: 'all', exact_equalities: ['envelope.payload_triple=stored_payload_artifact', 'envelope.response_triple=stored_history_artifact', 'envelope.operation_branch_kind=payload.operation_branch_kind'] },
  ],
  forbidden: ['cross_row_request_splice', 'resealed_artifact_splice', 'history_splice', 'result_splice', 'evidence_splice', 'nonce_or_proof_splice', 'payload_or_envelope_splice'],
}
function assertEqual(label, ...values) { const first = canonical(values[0]); for (let index = 1; index < values.length; index += 1) if (canonical(values[index]) !== first) throw new Error(`correlation:${label}`) }
function selection(row) { return { fresh_selection_row_id: row.fresh_selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.fresh_selection_schema_version } }
function validateCorrelations(fixture) {
  const registry = fixture.registry_artifact.canonical_row_value, history = fixture.historical_response_artifact, historyRow = history.canonical_row_value, payload = fixture.replay_payload_artifact, payloadRow = payload.canonical_row_value, envelopeRow = fixture.replay_envelope_artifact.canonical_row_value, result = fixture.result_artifact
  assertEqual('request fingerprint', fixture.request_fingerprint, registry.request_fingerprint)
  assertEqual('request ref', fixture.request_artifact.ref, registry.request_bytes_ref)
  assertEqual('request hash', fixture.request_artifact.bytes_sha256, registry.request_bytes_sha256)
  assertEqual('operation', fixture.operation_name, registry.operation_name, historyRow.operation_name, payloadRow.operation_name, envelopeRow.operation_name)
  assertEqual('operation id', registry.operation_id, historyRow.operation_id, payloadRow.operation_id, envelopeRow.operation_id)
  assertEqual('branch', fixture.result_branch, historyRow.result_branch, payloadRow.historical_result_branch, envelopeRow.historical_result_branch)
  assertEqual('result ref', result.ref, historyRow.result_ref, historyRow.response_payload_ref, payloadRow.historical_result_ref, registry.result_ref ?? registry.hold_result_ref)
  assertEqual('result bytes', result.bytes_sha256, historyRow.result_bytes_sha256, historyRow.response_payload_bytes_sha256, payloadRow.historical_result_bytes_sha256, registry.result_bytes_sha256 ?? registry.hold_result_bytes_sha256)
  assertEqual('result fingerprint', result.fingerprint, historyRow.result_fingerprint, payloadRow.historical_result_fingerprint, registry.result_fingerprint ?? registry.hold_result_fingerprint)
  assertEqual('history ref', history.content_addressed_artifact_ref, registry.historical_response_ref, payloadRow.stored_historical_response_ref, envelopeRow.replay_response_ref)
  assertEqual('history bytes', history.canonical_row_bytes_sha256, registry.historical_response_bytes_sha256, payloadRow.stored_historical_response_bytes_sha256, envelopeRow.replay_response_bytes_sha256)
  assertEqual('history fingerprint', history.recorded_fingerprint, registry.historical_response_fingerprint, payloadRow.stored_historical_response_fingerprint, envelopeRow.replay_response_fingerprint)
  assertEqual('payload ref', payload.content_addressed_artifact_ref, envelopeRow.payload_ref)
  assertEqual('payload bytes', payload.canonical_row_bytes_sha256, envelopeRow.payload_bytes_sha256)
  assertEqual('payload fingerprint', payload.recorded_fingerprint, envelopeRow.payload_fingerprint)
  assertEqual('selection', selection(registry), fixture.expected_reconstructed_selection)
  const classifier = fixture.classifier_row
  if (!classifier || classifier.expected_selection_row_id !== registry.fresh_selection_row_id || classifier.expected_proof_family !== registry.proof_family || classifier.expected_branch_class !== registry.branch_class || classifier.expected_evidence_kind !== registry.evidence_kind || classifier.expected_selector_version !== registry.fresh_selection_schema_version) throw new Error(`classifier:${fixture.fixture_id}`)
  if (fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE') {
    assertEqual('committed payload registry ref', registry.registry_row_ref, payloadRow.committed_registry_row_ref)
    assertEqual('committed payload registry fingerprint', registry.registry_fingerprint, payloadRow.committed_registry_row_fingerprint)
    if (fixture.proof_and_nonce_evidence.exact_nonce_count !== 0) throw new Error(`committed_fixture_nonce:${fixture.fixture_id}`)
    return
  }
  const hold = fixture.hold_artifact_or_UNAVAILABLE.canonical_row_value
  assertEqual('held request ref', fixture.request_artifact.ref, hold.request_artifact_ref)
  assertEqual('held request hash', fixture.request_artifact.bytes_sha256, hold.request_artifact_sha256)
  assertEqual('held operation', registry.operation_id, hold.operation_id)
  assertEqual('held idempotency', registry.idempotency_key, hold.idempotency_key)
  assertEqual('held selection', selection(registry), selection(hold))
  assertEqual('held row ref', registry.hold_row_ref, hold.hold_row_ref, payloadRow.hold_row_ref)
  assertEqual('held fingerprint', registry.hold_fingerprint, hold.hold_fingerprint, payloadRow.hold_row_fingerprint)
  assertEqual('held timestamp', registry.held_at, hold.held_at, payloadRow.held_at)
  assertEqual('held registry ref', registry.registry_row_ref, payloadRow.held_registry_row_ref)
  assertEqual('held registry fingerprint', registry.registry_fingerprint, payloadRow.held_registry_row_fingerprint)
  if (hold.hold_kind === 'session_dual_proof') {
    const evidence = fixture.session_evidence_or_UNAVAILABLE.artifact, evidenceRow = evidence.canonical_row_value
    assertEqual('session evidence ref', evidence.content_addressed_artifact_ref, registry.session_hold_evidence_ref_or_unavailable, hold.session_hold_evidence_ref, payloadRow.session_hold_evidence_ref_or_unavailable)
    assertEqual('session evidence bytes', evidence.canonical_row_bytes_sha256, registry.session_hold_evidence_bytes_sha256_or_unavailable, hold.session_hold_evidence_bytes_sha256, payloadRow.session_hold_evidence_bytes_sha256_or_unavailable)
    assertEqual('session evidence fp', evidence.recorded_fingerprint, registry.session_hold_evidence_fingerprint_or_unavailable, hold.session_hold_evidence_fingerprint, payloadRow.session_hold_evidence_fingerprint_or_unavailable)
    if (registry.evidence_kind === 'verified_session_hold_evidence') { if (fixture.proof_and_nonce_evidence.exact_nonce_count !== 2 || evidenceRow.issuer_proof_ref !== fixture.proof_and_nonce_evidence.issuer_proof.ref || evidenceRow.evaluator_proof_ref !== fixture.proof_and_nonce_evidence.evaluator_proof.ref || evidenceRow.issuer_nonce_receipt_ref !== fixture.proof_and_nonce_evidence.issuer_nonce_receipt.ref || evidenceRow.evaluator_nonce_receipt_ref !== fixture.proof_and_nonce_evidence.evaluator_nonce_receipt.ref) throw new Error(`verified_session_evidence:${fixture.fixture_id}`) }
    else { if (fixture.proof_and_nonce_evidence.exact_nonce_count !== 0 || evidenceRow.raw_bundle_ref_or_unavailable !== hold.raw_bundle_ref_or_unavailable || evidenceRow.raw_evaluator_proof_ref_or_unavailable !== hold.raw_evaluator_proof_ref_or_unavailable) throw new Error(`raw_session_evidence:${fixture.fixture_id}`) }
  } else if (registry.session_hold_evidence_ref_or_unavailable !== 'UNAVAILABLE') throw new Error(`ordinary_session_evidence:${fixture.fixture_id}`)
}
for (const fixture of fixtures) validateCorrelations(fixture)
for (const field of ['operation_id', 'idempotency_key', 'registry_row_ref']) { const values = fixtures.map(fixture => fixture.registry_artifact.canonical_row_value[field]); if (new Set(values).size !== fixtures.length) throw new Error(`fixture_unique:${field}`) }
r42.authority_operation_replay_restart_fixtures = { schema_version: 'ctrl.g24.authority-operation-replay-restart-fixtures.r42.v1', registry_and_hold_artifact_count: 7, complete_lineage_artifact_count: fixtures.reduce((count, fixture) => count + 4 + (fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE' ? 0 : 1) + (fixture.session_evidence_or_UNAVAILABLE === 'UNAVAILABLE' ? 0 : 1), 0), exact_fixture_ids: plans.map(row => row[0]), fixtures, normative_row_ref_derivation_ref: 'normative_row_ref_derivation', correlation_authority_ref: 'authority_operation_restart_correlation_authority', reconstruction_algorithm: ['owned_bounded_immutable_snapshot', 'validate_exact_selected_schema', 'derive_normative_row_ref_from_selected_schema_declaration', 'derive_fingerprint_then_final_bytes_hash', 'resolve_and_validate_complete_correlation_table', 'resolve_classifier_from_durable_selection'], any_mismatch_splice_or_instability: 'hold_without_disclosure_or_write' }
r42.fixture_schema_validator = { schema_version: 'ctrl.g24.fixture-schema-validator.r42.v1', supported_schema_forms: ['const', 'enum_array', 'typed_enum_values', 'sha256', 'sha256_or_exact_literal', 'identifier', 'canonical_timestamp', 'nullable', 'integer', 'boolean', 'array', 'schema_ref', 'discriminated_variant'], validation_scope: 'all_7_registry_and_hold_rows_plus_history_payload_envelope_and_session_evidence_artifacts_and_full_cross_record_correlation_table', unsupported_schema_form: 'reject_fixture_materialization' }

r42.semantic_reference_field_specification = {
  schema_version: 'ctrl.g24.semantic-reference-field-specification.r42.v1',
  source: 'independently_pinned_authoritative_schema_and_control_vocabulary_not_any_R40_or_R41_reference_map',
  exact_patterns: [
    { pattern_id: 'tokenized_ref_or_refs', grammar: 'field_name_contains_start_or_underscore_then_ref_or_refs_then_end_or_underscore', occurrence_kind: 'reference_bearing_field' },
    { pattern_id: 'schema_property_reference', grammar: 'closed_schema_property_name_matches_tokenized_ref_or_refs', occurrence_kind: 'typed_runtime_reference_field' },
    { pattern_id: 'semantic_authority_literal', grammar: 'string_value_exactly_equals_or_is_a_declared_child_path_of_one_manifested_semantic_authority_or_pinned_alias', occurrence_kind: 'semantic_authority_reference' },
  ],
  exact_non_suffix_semantic_fields: ['authority', 'then', 'sole_writer', 'writer', 'source', 'target', 'derivation', 'binding', 'transaction_boundary', 'selected_branch_table', 'selected_matrix', 'selected_result_artifact_store_family'],
  required_named_categories: ['_ref', '_refs', 'source_refs', 'transaction_boundary_ref', 'selected_branch_table_ref', 'selected_matrix_ref', 'selected_result_artifact_store_family_ref', 'branch_effects_ref', 'field_encoding_ref', 'transition_table_ref', 'total_result_discriminated_compound', 'replay_path_discriminated_pattern', 'semantic_string_without_suffix'],
  unknown_ref_bearing_field_or_path: 'reject_materialization_and_hold_without_disclosure_or_write',
  occurrence_requirement: 'exact_bijection_between_full_machine_traversal_and_registry_rows',
}
const semanticAuthorityPaths = [...new Set([...r41SemanticAuthorityPaths, 'canonical_snapshot_resource_limits', 'normative_row_ref_derivation', 'authority_operation_restart_correlation_authority', 'semantic_reference_field_specification'])].sort(codePointCompare)
r42.authority_runtime_semantic_manifest_envelope_schema = closed('ctrl.g24.runtime-semantic-authority-manifest-envelope.r42.v1', { schema_version: { const: 'ctrl.g24.runtime-semantic-authority-manifest.r42.v1' }, type: { const: 'owned_snapshot_self_sealed_runtime_semantic_manifest' }, snapshot_pipeline_ref: { const: 'owned_immutable_canonical_snapshot_pipeline' }, hash_contract_ref: { const: 'authority_runtime_semantic_manifest_hash_contract' }, dependency_owner_map_ref: { const: 'authority_runtime_semantic_dependency_owner_map' }, reference_field_registry_ref: { const: 'authority_runtime_semantic_reference_field_registry' }, exact_paths: { type: 'unicode_sorted_unique_identifier_array' }, rows: { type: 'ordered_manifest_row_array' }, exact_expected_count: { const: semanticAuthorityPaths.length }, manifest_graph_sha256: fp, manifest_envelope_seal_sha256: fp }, { caller_writable_fields: [], fallback_or_default: 'forbidden' })

const aliasOwners = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
function ownerFor(reference, source) { if (aliasOwners[reference]) return aliasOwners[reference]; const normalized = reference.replace(/^\$\./, '').replace('.variants.*.', '.variants.'); let selected = ''; for (const path of semanticAuthorityPaths) if ((normalized === path || normalized.startsWith(`${path}.`)) && path.length > selected.length) selected = path; return selected || source }
function refTokenField(key) { return /(^|_)(ref|refs)($|_)/.test(key) }
const noSuffixFields = new Set(r42.semantic_reference_field_specification.exact_non_suffix_semantic_fields)
const referenceRows = [], occurrenceKeys = new Set()
function addReference(source, fieldPath, fieldName, literal, reason) { const owner = ownerFor(literal, source), kind = literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : owner === source ? 'runtime_identity_field_or_field_name_reference' : reason === 'semantic_value' ? 'semantic_authority_reference' : fieldName.includes('schema') ? 'schema_reference' : literal.includes('*') ? 'discriminated_pattern_reference' : 'typed_reference'; const key = `${source}|${fieldPath}|${literal}`; if (occurrenceKeys.has(key)) return; occurrenceKeys.add(key); referenceRows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: kind, reference_literal: literal, owner_authority_path: owner, expected_owner_schema_version: semanticVersion(owner, resolvePath(r42, owner)), specification_pattern_id: reason }) }
function walkReferences(value, source, fieldPath = source) { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { const next = `${fieldPath}.${key}`; if (refTokenField(key) || noSuffixFields.has(key)) { if (Array.isArray(item)) { for (let index = 0; index < item.length; index += 1) if (typeof item[index] === 'string') addReference(source, `${next}.${index}`, key, item[index], refTokenField(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } else if (typeof item === 'string') addReference(source, next, key, item, refTokenField(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } if (typeof item === 'string' && ownerFor(item, source) !== source) addReference(source, next, key, item, 'semantic_value'); walkReferences(item, source, next) } }
r42.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r42.v1', derivation: 'bounded_exact_extension_from_frozen_R41_to_R42_normative_row_identity_complete_restart_correlations_primordial_safe_bounded_snapshots_and_independent_reference_universe', frozen_parent_sha256: shaBytes(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.owned_immutable_canonical_snapshot_pipeline', '$.canonical_snapshot_resource_limits', '$.authority_operation_registry', '$.authority_operation_hold_store', '$.normative_row_ref_derivation', '$.authority_operation_replay_restart_fixtures', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.semantic_reference_field_specification', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_manifest_envelope_schema', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: ['$.authority_operation_replay_restart_fixtures.fixtures.*.row_identity_preimage'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r42_identifier: true, frozen_parent_core_must_remain_byte_identical: true, caller_writer_or_precedence_extensions: 'forbidden' }
r42.required_negative_fixture_families = [...new Set([...r42.required_negative_fixture_families, 'normative_schema_row_ref_derivation', 'full_restart_correlation_and_resealed_splice', 'captured_primordial_prototype_pollution', 'preallocation_resource_limits', 'independent_reference_universe_bijection'])]

const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r42.v1'
r42.authority_runtime_semantic_manifest_hash_contract = { schema_version: hashVersion, snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', resource_limits_ref: 'canonical_snapshot_resource_limits', canonical_codec_ref: 'canonical_json_utf8_encoding', hash_input: 'bounded_owned_immutable_snapshot_only', content_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R42', dependency_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R42', graph_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R42', envelope_domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R42', hashing_rule: 'bounded_snapshot_then_sha256_exact_unicode_sorted_canonical_JSON_UTF8_using_captured_primordials' }
function contentHash(path, value) { return hashCanonical({ domain_ascii: r42.authority_runtime_semantic_manifest_hash_contract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: snapshotOwned(value) }) }
function dependencyHash(path, scope, rows) { return hashCanonical({ domain_ascii: r42.authority_runtime_semantic_manifest_hash_contract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return hashCanonical({ domain_ascii: r42.authority_runtime_semantic_manifest_hash_contract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return hashCanonical({ domain_ascii: r42.authority_runtime_semantic_manifest_hash_contract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }
r42.authority_runtime_semantic_dependency_owner_map = { ...r42.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r42.v1' }
r42.authority_runtime_semantic_reference_field_registry = { ...r42.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r42.v1' }
r42.authority_runtime_semantic_reference_owner_map = { ...r42.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r42.v1' }
r42.authority_runtime_semantic_manifest = { ...r42.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r42.v1' }
for (const path of semanticAuthorityPaths) if (!['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry', 'semantic_reference_field_specification'].includes(path)) walkReferences(resolvePath(r42, path), path)
referenceRows.sort((left, right) => codePointCompare(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
r42.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r42.v1', specification_ref: 'semantic_reference_field_specification', row_schema: closed('ctrl.g24.runtime-semantic-reference-field-registry-row.r42.v1', { source_authority_path: id, field_path: id, field_name: id, reference_kind: id, reference_literal: id, owner_authority_path: id, expected_owner_schema_version: id, specification_pattern_id: id }), exact_occurrence_rows: referenceRows, exact_expected_occurrence_count: referenceRows.length, occurrence_bijection: 'every_actual_reference_occurrence_selected_by_the_independent_R42_specification_exactly_once', unknown_reference_semantics: 'reject_materialization_and_hold_without_disclosure_or_write', inference_from_suffix_only: 'forbidden' }
r42.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r42.v1', specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', row_count: referenceRows.length, ownership_rule: 'semantic_authority_refs_resolve_one_manifested_owner_runtime_identity_and_field_refs_are_owned_by_their_closed_source_authority' }
const priorOwners = Object.fromEntries(materializedR41.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths]))
const occurrenceDeps = {}; for (const row of referenceRows) if (row.owner_authority_path !== row.source_authority_path) (occurrenceDeps[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
const dependencyOverrides = { authority_operation_replay_restart_fixtures: ['authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_historical_response_schema', 'authority_operation_replay_payload_schema', 'authority_operation_replay_envelope_schema', 'session_hold_evidence_schema', 'authority_operation_restart_correlation_authority', 'normative_row_ref_derivation', 'fixture_schema_validator', 'owned_immutable_canonical_snapshot_pipeline', 'canonical_snapshot_resource_limits'], authority_operation_restart_correlation_authority: ['authority_operation_registry', 'authority_operation_hold_store', 'authority_operation_replay_payload_schema', 'authority_operation_replay_envelope_schema', 'session_hold_evidence_schema'], normative_row_ref_derivation: ['authority_operation_registry', 'authority_operation_hold_store', 'canonical_json_utf8_encoding'], owned_immutable_canonical_snapshot_pipeline: ['canonical_snapshot_resource_limits'], canonical_snapshot_resource_limits: [], semantic_reference_field_specification: [], fixture_schema_validator: [], materialization: [], schema_change_manifest: [] }
const ownerRows = semanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(dependencyOverrides[path] ?? priorOwners[path] ?? []), ...[...(occurrenceDeps[path] ?? [])]])].filter(owner => semanticAuthorityPaths.includes(owner) && owner !== path).sort(codePointCompare), unqualified_legacy_alias_owner_path: path }))
r42.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r42.v1', exact_paths: semanticAuthorityPaths, rows: ownerRows, reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', explicit_reference_edges_required: true, unresolved_multiply_owned_or_caller_ref: 'reject_materialization_and_hold_without_disclosure_or_write' }
delete r42.authority_runtime_semantic_manifest
const contentHashes = Object.fromEntries(semanticAuthorityPaths.map(path => [path, contentHash(path, resolvePath(r42, path))]))
const graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths]))
function transitive(path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }
const manifestRows = semanticAuthorityPaths.map(path => { const value = resolvePath(r42, path), directPaths = graph[path], directRows = directPaths.map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })), transitiveRows = transitive(path).map(owner => ({ authority_path: owner, authority_content_sha256: contentHashes[owner] })); return { authority_path: path, semantic_kind: kindOf(value), exact_keyset: keysetOf(value), authority_schema_ref: path, authority_schema_version: semanticVersion(path, value), direct_dependency_paths: directPaths, direct_dependency_content_hashes: directRows, direct_dependency_set_sha256: dependencyHash(path, 'direct', directRows), transitive_dependency_paths: transitiveRows.map(row => row.authority_path), transitive_dependency_content_hashes: transitiveRows, transitive_dependency_set_sha256: dependencyHash(path, 'transitive', transitiveRows), authority_content_sha256: contentHashes[path] } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r42.v1', type: 'owned_bounded_snapshot_self_sealed_runtime_semantic_manifest', snapshot_pipeline_ref: 'owned_immutable_canonical_snapshot_pipeline', resource_limits_ref: 'canonical_snapshot_resource_limits', hash_contract_ref: 'authority_runtime_semantic_manifest_hash_contract', dependency_owner_map_ref: 'authority_runtime_semantic_dependency_owner_map', reference_field_specification_ref: 'semantic_reference_field_specification', reference_field_registry_ref: 'authority_runtime_semantic_reference_field_registry', exact_paths: semanticAuthorityPaths, rows: manifestRows, exact_expected_count: semanticAuthorityPaths.length, manifest_graph_sha256: graphHash(manifestRows) }
r42.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: envelopeHash(manifestWithoutSeal) }
r42.visible_surface_changes = []
r42.external_actions_authorized = []

const finalSnapshot = snapshotOwned(r42)
export const materializedR42 = r42
export const materializedR42Snapshot = finalSnapshot
export const materializedR42Output = `${apply(PrimordialJSONstringify, JSON, [finalSnapshot, null, 2])}\n`
export const ownedSnapshotR42 = snapshotOwned
export const canonicalR42 = canonical
export const r42SemanticAuthorityPaths = semanticAuthorityPaths
export const r42ResourceLimits = LIMITS
export const deriveNormativeRowRefR42 = deriveNormativeRowRef
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR42Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR42Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R42 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
