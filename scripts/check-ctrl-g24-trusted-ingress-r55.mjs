import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR54, materializedR54Output, r54SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r54.mjs'
import { materializedR55, materializedR55Output } from './materialize-ctrl-g24-trusted-ingress-r55.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r55.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, ref, variant = 'UNAVAILABLE') => { const schema = get(contract, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }

function valuesOf(spec) {
  if (!spec || typeof spec !== 'object') return []
  if (Object.hasOwn(spec, 'const')) return [spec.const]
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal') return [spec.literal]
  return spec.values ?? spec.enum ?? []
}
function resolveSpec(contract, spec) {
  const ref = spec?.schema_ref ?? spec?.value_schema?.schema_ref
  if (!ref) return null
  const resolved = get(contract, ref)
  assert(resolved, `schema_ref_missing:${ref}`)
  return resolved
}
function chooseVariant(schema, value = {}) {
  if (!schema?.variants) return { schema, variant: 'UNAVAILABLE' }
  const matches = Object.entries(schema.variants).filter(([, candidate]) => Object.entries(candidate.properties ?? {}).every(([field, spec]) => {
    const allowed = valuesOf(spec)
    return !Object.hasOwn(value ?? {}, field) || !allowed.length || allowed.includes(value[field])
  }))
  assert(matches.length >= 1, `union_variant_match:${matches.length}`)
  return matches.sort((a, b) => cp(a[0], b[0])).map(([variant, selected]) => ({ variant, schema: selected }))[0]
}
function validateSpec(contract, spec, value, label) {
  const resolved = resolveSpec(contract, spec)
  if (resolved) {
    const selected = chooseVariant(resolved, value && typeof value === 'object' ? value : {})
    return selected.schema?.properties ? validateSchema(contract, selected.schema, value, `${label}<${selected.variant}>`) : validateSpec(contract, selected.schema, value, `${label}<${selected.variant}>`)
  }
  if (Object.hasOwn(spec, 'const')) assert(value === spec.const, `${label}:const`)
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal') assert(value === spec.literal, `${label}:literal`)
  const allowed = spec.values ?? spec.enum
  if (Array.isArray(allowed)) assert(allowed.includes(value), `${label}:enum`)
  if (spec.type === 'sha256') assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), `${label}:sha256`)
  if (spec.type === 'sha256_or_exact_literal') assert(typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || [spec.literal, spec.const, ...(spec.exact_literals ?? [])].filter(item => item !== undefined).includes(value)), `${label}:sha_or_literal`)
  if (['identifier', 'human_text', 'literal'].includes(spec.type)) assert(typeof value === 'string', `${label}:string`)
  if (spec.type === 'canonical_timestamp') assert(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)), `${label}:time`)
  if (spec.type === 'base64url_without_padding') assert(typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && !value.includes('='), `${label}:base64url`)
  if (spec.type === 'boolean') assert(typeof value === 'boolean', `${label}:boolean`)
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec.type)) assert(Number.isSafeInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0), `${label}:integer`)
  if (spec.type === 'finite_nonnegative_number') assert(Number.isFinite(value) && value >= 0 && !Object.is(value, -0), `${label}:number`)
  if (spec.minimum !== undefined) assert(value >= spec.minimum, `${label}:minimum`)
  if (spec.maximum !== undefined) assert(value <= spec.maximum, `${label}:maximum`)
  if (spec.type === 'nullable') assert(value === null, `${label}:nullable`)
  if (spec.type === 'array') {
    assert(Array.isArray(value), `${label}:array`)
    if (spec.min_items !== undefined) assert(value.length >= spec.min_items, `${label}:min_items`)
    if (spec.max_items !== undefined) assert(value.length <= spec.max_items, `${label}:max_items`)
    for (let index = 0; index < value.length; index += 1) validateSpec(contract, spec.items ?? { type: 'identifier' }, value[index], `${label}.${index}`)
    if (spec.unique) assert(new Set(value.map(item => canonicalR44(item))).size === value.length, `${label}:unique`)
    if (spec.unique_by) assert(new Set(value.map(item => item?.[spec.unique_by])).size === value.length, `${label}:unique_by`)
    if (spec.allowed_route_values) assert(value.every(item => spec.allowed_route_values.includes(item?.route)), `${label}:allowed_route`)
  }
  if (spec.type === 'object' || spec.properties) validateSchema(contract, spec, value, label)
  if (typeof value === 'string') {
    if (spec.max_bytes !== undefined) assert(Buffer.byteLength(value, 'utf8') <= spec.max_bytes, `${label}:max_bytes`)
    if (spec.max_decoded_bytes !== undefined) assert(Buffer.from(value, 'base64url').length <= spec.max_decoded_bytes, `${label}:max_decoded_bytes`)
  }
  assert(value !== undefined, `${label}:defined`)
}
function validateSchema(contract, schema, payload, label) {
  assert(schema?.properties && payload && typeof payload === 'object' && !Array.isArray(payload), `${label}:schema_object`)
  const actual = Object.keys(payload).sort(cp), allowed = [...(schema.exact_keys ?? Object.keys(schema.properties))].sort(cp)
  if (schema.additional_properties === false) assert(same(actual, allowed), `${label}:exact_keys`)
  for (const field of schema.required ?? []) assert(Object.hasOwn(payload, field), `${label}:required:${field}`)
  for (const [field, spec] of Object.entries(schema.properties)) if (Object.hasOwn(payload, field)) validateSpec(contract, spec, payload[field], `${label}:${field}`)
  const encoded = Buffer.byteLength(canonicalR44(payload), 'utf8')
  if (schema.max_canonical_bytes !== undefined) assert(encoded <= schema.max_canonical_bytes, `${label}:max_canonical_bytes`)
  if (schema.max_bytes !== undefined) assert(encoded <= schema.max_bytes, `${label}:row_max_bytes`)
  for (const [field, value] of Object.entries(payload)) if (field.endsWith('_length')) {
    const bytesField = field.replace(/_length$/, '_b64url')
    if (Object.hasOwn(payload, bytesField)) assert(value === Buffer.from(payload[bytesField], 'base64url').length, `${label}:length_equality:${field}`)
  }
}
function decodeFixture(contract, fixture, label) {
  const schema = schemaAt(contract, fixture.schema_ref, fixture.schema_variant)
  assert(schema?.properties && fixture.schema_version === schema.schema_version, `${label}:schema`)
  const bytes = Buffer.from(fixture.canonical_row_bytes_b64url, 'base64url')
  assert(sha(bytes) === fixture.canonical_row_bytes_sha256, `${label}:bytes_sha`)
  const text = bytes.toString('utf8'), payload = JSON.parse(text)
  assert(canonicalR44(payload) === text, `${label}:canonical_round_trip`)
  validateSchema(contract, schema, payload, label)
  return { schema, payload, bytes }
}
function recomputeFingerprint(contract, schema, payload, evidence, label) {
  const authority = get(contract, schema.fingerprint_ref)
  assert(authority && (!evidence || (evidence.authority_ref === schema.fingerprint_ref && same(evidence.exact_preimage_order, authority.preimage_order))), `${label}:fingerprint_authority`)
  const preimage = {}
  for (const field of authority.preimage_order) preimage[field] = field === 'domain_ascii' ? authority.domain_ascii : payload[field]
  const expected = hash(preimage)
  assert((!evidence || (same(preimage, evidence.exact_preimage) && expected === evidence.expected_fingerprint)) && payload[schema.fingerprint_field] === expected, `${label}:fingerprint_execution`)
  return expected
}
function recomputeRowVersion(contract, authority, decoded, label) {
  const derivation = authority.executable_native_derivation_evidence.selected_native_derivation
  const native = get(contract, derivation.authority_ref)
  assert(native && same(derivation.exact_preimage_order, native.row_version_preimage_exact_keys), `${label}:row_version_authority`)
  assert(!derivation.exact_preimage.ordered_complete_mutable_authority_fields.some(row => row.field === authority.identity_field || row.field === decoded.schema.fingerprint_field), `${label}:row_version_self_reference`)
  const expectedFields = Object.keys(decoded.schema.properties).filter(field => field !== authority.identity_field && field !== decoded.schema.fingerprint_field).map(field => ({ field, value: decoded.payload[field] }))
  const expectedPreimage = { domain_ascii: native.row_version_domain_ascii, schema_version: native.row_version_schema_version, ordered_complete_mutable_authority_fields: expectedFields }
  const expected = hash(expectedPreimage)
  assert(same(expectedPreimage, derivation.exact_preimage) && decoded.payload[authority.identity_field] === expected && authority.executable_native_derivation_evidence.expected_identity === expected, `${label}:row_version_execution`)
  return expected
}
function targetSemantics(contract, fixture, decoded, link, label) {
  const identity = link.target_identity_field === '$canonical_row_bytes' ? sha(decoded.bytes) : decoded.payload[link.target_identity_field]
  assert(identity !== undefined && identity !== null, `${label}:target_identity_field_missing`)
  let bytesSha = sha(decoded.bytes), fingerprint = decoded.schema.fingerprint_field ? recomputeFingerprint(contract, decoded.schema, decoded.payload, fixture.fingerprint, label) : null
  if (fixture.declared_content_address?.selected_payload_schema_ref) {
    const raw = Buffer.from(decoded.payload.canonical_bytes_b64url, 'base64url')
    assert(sha(raw) === decoded.payload.canonical_bytes_sha256 && decoded.payload.artifact_ref === decoded.payload.canonical_bytes_sha256, `${label}:wrapper_content_address`)
    const payload = JSON.parse(raw.toString('utf8')), payloadSchema = schemaAt(contract, fixture.declared_content_address.selected_payload_schema_ref, fixture.declared_content_address.selected_payload_schema_variant)
    validateSchema(contract, payloadSchema, payload, `${label}:wrapped_payload`)
    bytesSha = sha(raw)
    fingerprint = payloadSchema.fingerprint_field ? payload[payloadSchema.fingerprint_field] : fingerprint
    if (payloadSchema.fingerprint_field) recomputeFingerprint(contract, payloadSchema, payload, null, `${label}:wrapped_payload`)
  }
  if (!fingerprint) fingerprint = decoded.payload[decoded.schema.fingerprint_field] ?? identity
  return { identity, bytesSha, fingerprint }
}
function recomputeLinkedTarget(contract, authority, decoded, label) {
  const link = authority.executable_native_derivation_evidence.joint_source_target_fixture
  assert(link && link.deterministic_context_selection === 'unicode_canonical_lowest_source_context_and_target_pair_after_exact_schema_intersection', `${label}:joint_fixture`)
  const target = decodeFixture(contract, link.target_fixture, `${label}:target`)
  const semantic = targetSemantics(contract, link.target_fixture, target, link, `${label}:target`)
  if (authority.native_identity_role === 'companion_bytes_hash' && target.payload[authority.identity_field] !== undefined) semantic.bytesSha = target.payload[authority.identity_field]
  if (authority.native_identity_role === 'companion_fingerprint' && target.payload[authority.identity_field] !== undefined) semantic.fingerprint = target.payload[authority.identity_field]
  assert(semantic.identity === link.target_native_identity && semantic.bytesSha === link.target_native_bytes_sha256 && semantic.fingerprint === link.target_native_fingerprint, `${label}:target_native_values`)
  const selector = get(contract, link.selector_ref)
  assert(selector && selector.exact_case_count >= 1, `${label}:selector`)
  const caseRows = selector.exact_source_schema_valid_context ? [{ context: selector.exact_source_schema_valid_context, target: selector.exact_target_case }] : selector.exact_source_schema_valid_cases.map((context, index) => ({ context, target: selector.exact_concrete_cases[index] }))
  const chosen = [...caseRows].sort((a, b) => cp(canonicalR44({ context: a.context, target: a.target }), canonicalR44({ context: b.context, target: b.target })))[0]
  assert(same(chosen.context, link.selector_context), `${label}:selector_context`)
  for (const [field, value] of Object.entries(link.projected_source_discriminators)) assert(decoded.payload[field] === value, `${label}:projected_source:${field}`)
  assert(decoded.payload[link.source_reference_field] === semantic.identity, `${label}:source_ref_target_identity`)
  for (const field of link.companion_bytes_fields) assert(decoded.payload[field.field] === semantic.bytesSha, `${label}:companion_bytes:${field.field}`)
  for (const field of link.companion_fingerprint_fields) assert(decoded.payload[field.field] === semantic.fingerprint, `${label}:companion_fp:${field.field}`)
  assert(link.exact_joint_equalities.source_reference_equals_target_identity && link.exact_joint_equalities.source_companion_bytes_equal_target_bytes && link.exact_joint_equalities.source_companion_fingerprints_equal_target_fingerprint, `${label}:joint_equalities`)
  const expected = authority.native_identity_role === 'resolved_reference_identity' ? semantic.identity : authority.native_identity_role === 'companion_bytes_hash' ? semantic.bytesSha : semantic.fingerprint
  assert(decoded.payload[authority.identity_field] === expected && authority.executable_native_derivation_evidence.expected_identity === expected, `${label}:linked_source_equality`)
  assert(authority.executable_native_derivation_evidence.duplicated_scalar_assertion_only === false && authority.executable_native_derivation_evidence.missing_target_identity_fallback === 'forbidden', `${label}:no_laundering_or_fallback`)
  return expected
}
function validateIdentity(contract, row, suppliedAuthority = null) {
  const authority = suppliedAuthority ?? get(contract, row.exact_authority_ref), label = row.identity_kind
  assert(authority && authority.identity_kind === row.identity_kind && authority.native_identity_role === row.native_identity_role && authority.schema_valid_linked_row_fixture && !authority.executable_formula_fixture, `${label}:native_authority`)
  assert(authority.selected_formula_authority_ref === `authority_operation_persisted_identity_formula_library.${row.native_identity_role}`, `${label}:formula_ref`)
  const decoded = decodeFixture(contract, authority.schema_valid_linked_row_fixture, label), evidence = authority.executable_native_derivation_evidence
  if (decoded.schema.fingerprint_field) recomputeFingerprint(contract, decoded.schema, decoded.payload, authority.schema_valid_linked_row_fixture.fingerprint, label)
  if (row.native_identity_role === 'canonical_row_bytes_content_address') assert(evidence.execution === 'raw_sha256_final_canonical_row_bytes' && sha(Buffer.from(evidence.exact_operand_b64url, 'base64url')) === evidence.expected_identity && evidence.expected_identity === sha(decoded.bytes), `${label}:row_content_address`)
  else if (row.native_identity_role === 'declared_content_address') {
    const derivation = evidence.selected_native_derivation
    assert(evidence.execution === 'selected_schema_native_content_address' && derivation, `${label}:content_derivation`)
    let expected
    if (derivation.exact_operand_b64url) expected = sha(Buffer.from(derivation.exact_operand_b64url, 'base64url'))
    else expected = hash(derivation.exact_preimage)
    assert(expected === derivation.expected_identity && expected === evidence.expected_identity, `${label}:content_hash`)
    if (derivation.equal_fields) for (const field of derivation.equal_fields) assert(decoded.payload[field] === expected, `${label}:content_equality:${field}`)
    else if (derivation.identity_field) assert(decoded.payload[derivation.identity_field] === expected, `${label}:row_ref_equality`)
    else assert(decoded.payload[row.identity_field] === expected, `${label}:nonce_ref_equality`)
  } else if (row.native_identity_role === 'declared_row_version') recomputeRowVersion(contract, authority, decoded, label)
  else if (row.native_identity_role === 'schema_declared_fingerprint') assert(evidence.execution === 'selected_schema_native_fingerprint' && evidence.expected_identity === decoded.payload[row.identity_field] && evidence.expected_identity === authority.schema_valid_linked_row_fixture.fingerprint.expected_fingerprint, `${label}:native_fingerprint`)
  else if (row.native_identity_role === 'unique_key_component') assert(evidence.execution === 'selected_schema_or_store_native_unique_key' && evidence.expected_identity === decoded.payload[row.identity_field] && evidence.exact_unique_key_memberships.some(fields => fields.includes(row.identity_field)), `${label}:unique_key`)
  else recomputeLinkedTarget(contract, authority, decoded, label)
}
function validateIdentities(contract) {
  const report = contract.authority_operation_native_identity_applicability_report, index = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
  assert(report.exact_R53_candidate_count === 1229 && report.exact_native_identity_total === 1228 && report.exact_not_applicable_total === 0 && report.exact_duplicate_alias_total === 1, 'identity_applicability_totals')
  assert(report.exact_duplicate_aliases.length === 1 && report.exact_duplicate_aliases[0].disposition === 'duplicate_nonce_alias_collapsed_after_native_role_derivation', 'identity_nonce_alias')
  assert(index.length === report.exact_native_identity_total && new Set(index.map(row => row.identity_kind)).size === index.length, 'identity_index')
  const categories = index.reduce((counts, row) => { counts[row.native_identity_role] = (counts[row.native_identity_role] ?? 0) + 1; return counts }, {})
  assert(same(Object.fromEntries(Object.entries(categories).sort((a, b) => cp(a[0], b[0]))), report.exact_category_counts), 'identity_category_counts')
  assert(report.six_hold_result_fields_reclassified === 6 && report.proof_nonce_is_one_unique_key_identity === 1 && report.missing_role_is_not_defaulted, 'identity_required_repairs')
  const hold = index.filter(row => row.row_schema_ref === 'authority_operation_hold_store.row_union' && ['result_ref', 'result_bytes_sha256', 'result_fingerprint'].includes(row.identity_field))
  assert(hold.length === 6 && hold.every(row => row.native_identity_role === (row.identity_field === 'result_ref' ? 'resolved_reference_identity' : row.identity_field === 'result_bytes_sha256' ? 'companion_bytes_hash' : 'companion_fingerprint')), 'hold_result_role_union')
  for (const row of index) validateIdentity(contract, row)
  return { total: index.length, categories }
}

const DIMENSION_FIELDS = { source_operation: ['operation_name'], source_result_branch: ['result_branch', 'hold_branch', 'branch'], proof_family: ['proof_family'], branch_class: ['branch_class'], evidence_kind: ['evidence_kind'], target_store: ['target_store'], fresh_selection_row_id: ['fresh_selection_row_id'] }
function specValues(spec) { if (!spec) return []; if (Object.hasOwn(spec, 'const')) return [spec.const]; return spec.values ?? spec.enum ?? [] }
function specAccepts(spec, value) { const allowed = specValues(spec); return !allowed.length || allowed.includes(value) }
function independentlyNormalize(old, contract) {
  const schema = schemaAt(contract, old.source_schema_ref, old.source_schema_variant), rows = []
  const sourceCases = old.exact_source_schema_valid_cases ?? old.exact_source_constant_cases
  for (let index = 0; index < sourceCases.length; index += 1) {
    const prior = sourceCases[index], target = old.exact_concrete_cases[index], base = { ...prior }
    let candidates = [base]
    for (const [dimension, fields] of Object.entries(DIMENSION_FIELDS)) {
      const field = fields.find(name => schema.properties?.[name]); if (!field) continue
      const allowed = specValues(schema.properties[field]); if (!allowed.length || allowed.includes(base[dimension])) continue
      if (dimension === 'evidence_kind' && allowed.length === 1) candidates = candidates.map(item => ({ ...item, evidence_kind: allowed[0] }))
      else if (dimension === 'proof_family' && base.source_operation === 'UNAVAILABLE') candidates = allowed.map(value => ({ ...base, proof_family: value }))
      else candidates = []
    }
    for (const context of candidates) {
      const projection = {}
      for (const [dimension, fields] of Object.entries(DIMENSION_FIELDS)) for (const field of fields) if (schema.properties?.[field]) projection[field] = context[dimension]
      if (Object.entries(projection).every(([field, value]) => specAccepts(schema.properties[field], value))) rows.push({ context, target: { ...target, ...context, target_identity_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${target.target_native_identity_role}` }, projection })
    }
  }
  return uniq(rows).sort((a, b) => cp(canonicalR44(a.context), canonicalR44(b.context)))
}
function validateSelector(contract, selector) {
  const prior = materializedR54.authority_operation_internal_reference_target_selectors.rows[selector.selector_id], expected = independentlyNormalize(prior, contract), schema = schemaAt(contract, selector.source_schema_ref, selector.source_schema_variant)
  assert(selector.schema_version === 'ctrl.g24.native-source-schema-intersection-selector.r55.v1' && selector.exact_case_count === expected.length, `selector_count:${selector.selector_id}`)
  assert(same(selector.exact_source_schema_valid_cases, expected.map(row => row.context)) && same(selector.exact_source_schema_constant_projections, expected.map(row => row.projection)) && same(selector.exact_concrete_cases, expected.map(row => row.target)), `selector_derivation:${selector.selector_id}`)
  const keys = new Set()
  for (let index = 0; index < selector.exact_case_count; index += 1) {
    const context = selector.exact_source_schema_valid_cases[index], projection = selector.exact_source_schema_constant_projections[index], target = selector.exact_concrete_cases[index], key = canonicalR44(context)
    assert(!keys.has(key), `selector_multiple:${selector.selector_id}`); keys.add(key)
    for (const [field, value] of Object.entries(projection)) assert(schema.properties[field] && specAccepts(schema.properties[field], value), `selector_source_invalid:${selector.selector_id}:${field}`)
    assert(schemaAt(contract, target.target_schema_ref, target.target_schema_variant)?.schema_version === target.target_schema_version && get(contract, target.target_identity_formula_authority_ref), `selector_target:${selector.selector_id}`)
  }
}
function validateSelectors(contract) {
  const authority = contract.authority_operation_internal_reference_target_selectors, selectors = Object.values(authority.rows), validation = contract.authority_operation_selector_source_schema_validation_authority
  assert(selectors.length === 374 && authority.exact_source_context_count === 2516, 'selector_totals')
  assert(validation.exact_invalid_R54_count === validation.exact_invalid_R54_context_occurrences.length && validation.source_schema_valid_context_count === 2516 && validation.complete_recursive_schema_validation_required, 'selector_invalid_reproduction')
  for (const selector of selectors) validateSelector(contract, selector)
  const nonce = selectors.find(row => row.source_schema_ref === 'proof_nonce_ledger.row_schema' && row.source_field === 'nonce_receipt_ref')
  assert(same(nonce.exact_source_schema_valid_cases.map(row => row.proof_family).sort(cp), ['evaluator', 'issuer', 'root_admin', 'root_bootstrap']), 'selector_nonce_families')
  const verified = selectors.filter(row => row.source_schema_ref === 'session_hold_evidence_schema' && row.source_schema_variant === 'verified_consuming')
  assert(verified.every(row => row.exact_source_schema_valid_cases.every(context => context.evidence_kind === 'verified_consuming' && context.selected_evidence_kind === 'verified_session_hold_evidence')), 'selector_verified_evidence')
  return { selectors: selectors.length, contexts: authority.exact_source_context_count }
}

function expectedSourcePaths(contract) {
  const replaced = new Set(['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
  const added = ['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_native_identity_applicability_report', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_selector_source_schema_validation_authority', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest', 'authority_runtime_semantic_manifest_hash_contract']
  return [...new Set([...r54SemanticAuthorityPaths.filter(path => !replaced.has(path)), ...added])].filter(path => get(contract, path) !== undefined).sort(cp)
}
function scanRefs(contract, paths) {
  const declared = new Set(contract.authority_operation_schema_declared_semantic_field_registry.exact_rows.map(row => row.field_name)), rows = [], seen = new Set()
  function walk(value, source, path = source) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const next = `${path}.${key}`, inspect = Array.isArray(child) ? child : [child]
      inspect.forEach((literal, index) => {
        if (typeof literal !== 'string') return
        const target = literal !== 'UNAVAILABLE' && get(contract, literal) !== undefined ? literal : 'UNAVAILABLE'
        if (target === 'UNAVAILABLE' && !declared.has(key)) return
        const fieldPath = Array.isArray(child) ? `${next}.${index}` : next, id = `${source}|${fieldPath}|${literal}`
        if (seen.has(id)) return
        seen.add(id); rows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: target !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: target, exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(contract, target)?.schema_version ?? 'NESTED_VALUE', reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference' })
      })
      walk(child, source, next)
    }
  }
  for (const path of paths) walk(get(contract, path), path)
  return rows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
}
function validateManifest(contract) {
  const paths = expectedSourcePaths(contract), registry = contract.authority_runtime_semantic_reference_field_registry, hc = contract.authority_runtime_semantic_manifest_hash_contract, manifest = contract.authority_runtime_semantic_manifest
  assert(same(paths, registry.exact_source_paths) && same(paths, manifest.exact_paths), 'manifest_paths')
  const snapshot = Object.fromEntries(paths.map(path => [path, ownedSnapshotR44(get(contract, path))])), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R55-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: paths, values: snapshot })
  if (snapshotSha !== registry.source_snapshot_sha256 || snapshotSha !== manifest.source_snapshot_sha256) {
    const mismatch = manifest.rows.find(row => row.authority_content_sha256 !== hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }))
    throw new Error(`manifest_snapshot:${snapshotSha}:${registry.source_snapshot_sha256}:${mismatch?.authority_path ?? 'content_rows_match'}`)
  }
  const refs = scanRefs(contract, paths)
  assert(refs.length === 56496 && same(refs, registry.exact_occurrence_rows) && refs.length === registry.exact_expected_occurrence_count, `semantic_refs:${refs.length}`)
  assert(manifest.rows.length === 237 && manifest.exact_expected_count === 237, 'manifest_count')
  for (const row of manifest.rows) assert(row.authority_content_sha256 === hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }), `manifest_content:${row.authority_path}`)
  const without = { ...manifest }; delete without.manifest_envelope_seal_sha256
  assert(manifest.manifest_graph_sha256 === hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifest.rows }) && manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: without }), 'manifest_seals')
  return { refs: refs.length, manifest: manifest.rows.length }
}
function validate(contract) {
  assert(contract.schema_version === 'ctrl.g24.trusted-ingress.r55.effective.v1' && contract.schema_change_manifest.runtime_database_ui_deployment_or_external_action === 'closed', 'r55_boundary')
  assert(same(contract.authority_operation_normative_persistence_registry, materializedR54.authority_operation_normative_persistence_registry), 'R54_persistence_preserved')
  assert(same(contract.authority_operation_committed_receipt_identity_fixtures, materializedR54.authority_operation_committed_receipt_identity_fixtures), 'R54_signed_restart_fixtures_preserved')
  const historyBefore = hash(ownedSnapshotR44(contract.authority_operation_historical_response_schema))
  const identities = validateIdentities(contract)
  assert(historyBefore === hash(ownedSnapshotR44(contract.authority_operation_historical_response_schema)), 'identity_validation_mutated_history_schema')
  const selectors = validateSelectors(contract)
  assert(historyBefore === hash(ownedSnapshotR44(contract.authority_operation_historical_response_schema)), 'selector_validation_mutated_history_schema')
  const manifest = validateManifest(contract)
  return { identities, ...selectors, ...manifest }
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r54.json'), 'utf8') === materializedR54Output, 'frozen_R54_exact')
assert(readFileSync(join(root, outputPath), 'utf8') === materializedR55Output, 'exact_R55_materialization')
const baseline = validate(materializedR55)
let attacks = 0
function reject(name, fn) { let rejected = false; try { fn() } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
function resealFixture(fixture, payload) { const copy = structuredClone(fixture), bytes = Buffer.from(canonicalR44(payload), 'utf8'); copy.canonical_row_bytes_b64url = bytes.toString('base64url'); copy.canonical_row_bytes_sha256 = sha(bytes); return copy }
const index = materializedR55.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
const identityOf = role => index.find(row => row.native_identity_role === role)
function authorityAttack(name, row, mutate) { reject(name, () => { const authority = structuredClone(get(materializedR55, row.exact_authority_ref)); mutate(authority); validateIdentity(materializedR55, row, authority) }) }
authorityAttack('generic_identity_fixture_restored', identityOf('unique_key_component'), authority => { authority.executable_formula_fixture = { expected_identity: 'laundered' } })
authorityAttack('opaque_proof_bundle_ref_mismatch', index.find(item => item.identity_kind.includes('authority_opaque_raw_input_stores.proof_bundle') && item.identity_field === 'artifact_ref'), authority => { authority.executable_native_derivation_evidence.selected_native_derivation.expected_identity = sha('wrong') })
authorityAttack('opaque_target_sha_mismatch', index.find(item => item.identity_kind.includes('authority_opaque_raw_input_stores.target') && item.identity_field === 'opaque_bytes_sha256'), authority => { authority.executable_native_derivation_evidence.expected_identity = sha('wrong') })
for (const row of index.filter(item => item.native_identity_role === 'declared_row_version')) reject(`row_version_self_reference:${row.identity_kind}`, () => { const authority = structuredClone(get(materializedR55, row.exact_authority_ref)); authority.executable_native_derivation_evidence.selected_native_derivation.exact_preimage.ordered_complete_mutable_authority_fields.push({ field: row.identity_field, value: authority.executable_native_derivation_evidence.expected_identity }); validateIdentity(materializedR55, row, authority) })
const sessionHold = index.find(item => item.identity_field === 'session_hold_evidence_fingerprint_or_unavailable')
reject('session_hold_companion_splice', () => { const authority = structuredClone(get(materializedR55, sessionHold.exact_authority_ref)); authority.executable_native_derivation_evidence.joint_source_target_fixture.target_native_fingerprint = sha('splice'); validateIdentity(materializedR55, sessionHold, authority) })
reject('fixture_malformed_length', () => { const row = identityOf('canonical_row_bytes_content_address'), authority = structuredClone(get(materializedR55, row.exact_authority_ref)); authority.schema_valid_linked_row_fixture.canonical_row_bytes_b64url = authority.schema_valid_linked_row_fixture.canonical_row_bytes_b64url.slice(2); validateIdentity(materializedR55, row, authority) })
reject('fixture_sha_mismatch', () => { const row = identityOf('schema_declared_fingerprint'), authority = structuredClone(get(materializedR55, row.exact_authority_ref)); authority.schema_valid_linked_row_fixture.canonical_row_bytes_sha256 = sha('wrong'); validateIdentity(materializedR55, row, authority) })
reject('fixture_ref_mismatch', () => { const row = index.find(item => item.native_identity_role === 'declared_content_address' && item.identity_field === 'artifact_ref'), authority = structuredClone(get(materializedR55, row.exact_authority_ref)); authority.executable_native_derivation_evidence.expected_identity = sha('wrong'); validateIdentity(materializedR55, row, authority) })

const fixtureRecords = []
for (const row of index) {
  const authority = get(materializedR55, row.exact_authority_ref), joint = authority.executable_native_derivation_evidence.joint_source_target_fixture
  fixtureRecords.push({ row, kind: 'source', fixture: authority.schema_valid_linked_row_fixture })
  if (joint) fixtureRecords.push({ row, kind: 'target', fixture: joint.target_fixture })
}
const literalOccurrences = []
const minItemOccurrences = []
for (const record of fixtureRecords) {
  const decoded = decodeFixture(materializedR55, record.fixture, `attack_inventory:${record.row.identity_kind}:${record.kind}`)
  for (const [field, spec] of Object.entries(decoded.schema.properties)) {
    if (Object.hasOwn(spec, 'const') || Object.hasOwn(spec, 'literal')) literalOccurrences.push({ record, decoded, field, spec })
    if (spec.type === 'array' && (spec.min_items ?? 0) > 0) minItemOccurrences.push({ record, decoded, field, spec })
  }
}
assert(literalOccurrences.length >= 148, `literal_probe_inventory:${literalOccurrences.length}`)
function wrongLiteral(spec, current) {
  if (spec.type === 'sha256_or_exact_literal') return 'INVALID_LITERAL_OR_SHA'
  if (typeof current === 'string') return `${current}_FORGED`
  if (typeof current === 'boolean') return !current
  if (typeof current === 'number') return current + 1
  return 'FORGED'
}
for (const [probeIndex, probe] of literalOccurrences.slice(0, 148).entries()) reject(`literal_or_const_${probeIndex + 1}`, () => {
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = wrongLiteral(probe.spec, payload[probe.field]); decodeFixture(materializedR55, resealFixture(probe.record.fixture, payload), `literal_attack:${probeIndex}`)
})
assert(minItemOccurrences.length === 12, `min_items_probe_inventory:${minItemOccurrences.length}`)
for (const [probeIndex, probe] of minItemOccurrences.entries()) reject(`min_items_${probeIndex + 1}`, () => {
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = []; decodeFixture(materializedR55, resealFixture(probe.record.fixture, payload), `min_items_attack:${probeIndex}`)
})

const enrichmentProbe = minItemOccurrences.find(probe => probe.record.fixture.schema_ref === 'authoritative_row_schemas.enrichment_plans' && probe.field === 'source_kind_ids')
const ordinaryFixture = fixtureRecords.find(record => record.fixture.schema_ref === 'authority_operation_hold_store.row_union' && record.fixture.schema_variant === 'ordinary_single_proof')
assert(enrichmentProbe && ordinaryFixture, 'required_target_probe_inventory')
const ordinaryDecoded = decodeFixture(materializedR55, ordinaryFixture.fixture, 'ordinary_target_probe')
const targetProbes = [
  { record: enrichmentProbe.record, decoded: enrichmentProbe.decoded, field: 'source_kind_ids', value: [] },
  { record: ordinaryFixture, decoded: ordinaryDecoded, field: 'raw_target_ref_or_unavailable', value: 'INVALID_LITERAL_OR_SHA' },
  { record: ordinaryFixture, decoded: ordinaryDecoded, field: 'raw_proof_ref_or_unavailable', value: 'INVALID_LITERAL_OR_SHA' },
]
for (const probe of fixtureRecords.filter(record => record.kind === 'target')) {
  const decoded = decodeFixture(materializedR55, probe.fixture, `target_literal_inventory:${probe.row.identity_kind}`)
  const entry = Object.entries(decoded.schema.properties).find(([, spec]) => Object.hasOwn(spec, 'const') || Object.hasOwn(spec, 'literal'))
  if (entry && targetProbes.length < 8) targetProbes.push({ record: probe, decoded, field: entry[0], value: wrongLiteral(entry[1], decoded.payload[entry[0]]) })
}
assert(targetProbes.length === 8, `target_literal_probe_inventory:${targetProbes.length}`)
for (const [probeIndex, probe] of targetProbes.entries()) reject(`target_literal_${probeIndex + 1}`, () => {
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = probe.value; decodeFixture(materializedR55, resealFixture(probe.record.fixture, payload), `target_literal_attack:${probeIndex}`)
})

const jointRows = index.filter(row => get(materializedR55, row.exact_authority_ref).executable_native_derivation_evidence.joint_source_target_fixture)
assert(jointRows.length === 70, `joint_fixture_count:${jointRows.length}`)
for (const [probeIndex, row] of jointRows.slice(0, 13).entries()) authorityAttack(`missing_target_identity_${probeIndex + 1}`, row, authority => { authority.executable_native_derivation_evidence.joint_source_target_fixture.target_identity_field = 'missing_native_identity_field' })
for (const [probeIndex, row] of jointRows.slice(13, 18).entries()) authorityAttack(`joint_source_target_splice_${probeIndex + 1}`, row, authority => { authority.executable_native_derivation_evidence.joint_source_target_fixture.target_native_identity = sha(`splice:${probeIndex}`) })
for (const row of index.filter(item => item.row_schema_ref === 'authority_operation_hold_store.row_union' && ['result_ref', 'result_bytes_sha256', 'result_fingerprint'].includes(item.identity_field))) authorityAttack(`hold_role_regression:${row.identity_kind}`, row, authority => { authority.native_identity_role = 'declared_content_address' })

const selectorIds = Object.keys(materializedR55.authority_operation_internal_reference_target_selectors.rows)
function selectorAttack(name, selectorId, mutate) { reject(name, () => { const selector = structuredClone(materializedR55.authority_operation_internal_reference_target_selectors.rows[selectorId]); mutate(selector); validateSelector(materializedR55, selector) }) }
selectorAttack('selector_wrong_operation', selectorIds[0], selector => { selector.exact_source_schema_valid_cases[0].source_operation = 'forged_operation' })
selectorAttack('selector_wrong_branch', selectorIds[1], selector => { selector.exact_source_schema_valid_cases[0].source_result_branch = 'forged_branch' })
selectorAttack('selector_wrong_proof_family', selectorIds[2], selector => { selector.exact_source_schema_valid_cases[0].proof_family = 'forged_proof' })
selectorAttack('selector_wrong_branch_class', selectorIds[3], selector => { selector.exact_source_schema_valid_cases[0].branch_class = 'forged_class' })
selectorAttack('selector_wrong_evidence', selectorIds[4], selector => { selector.exact_source_schema_valid_cases[0].selected_evidence_kind = 'forged_evidence' })
selectorAttack('selector_wrong_store', selectorIds[5], selector => { selector.exact_source_schema_valid_cases[0].target_store = 'forged_store' })
selectorAttack('selector_wrong_selection_row', selectorIds[6], selector => { selector.exact_source_schema_valid_cases[0].fresh_selection_row_id = 'forged_row' })
selectorAttack('selector_zero_target', selectorIds[7], selector => { selector.exact_concrete_cases.pop() })
selectorAttack('selector_multiple_target', selectorIds[8], selector => { selector.exact_concrete_cases.push(structuredClone(selector.exact_concrete_cases[0])) })
reject('manifest_identity_mutation', () => { const contract = structuredClone(materializedR55); contract.authority_operation_native_identity_applicability_report.exact_native_identity_total += 1; validateManifest(contract) })

console.log(`ok: R55 exact; ${attacks} attacks including 148 literal/const, 12 min_items, 8 target literal and 13 missing-target-identity probes; ${baseline.identities.total}/1229 R53 candidates have native identities with one duplicate nonce alias collapsed; ${jointRows.length}/${jointRows.length} joint source-target fixtures; 6/6 hold result identities reclassified; 6/6 non-self-referential row versions; ${baseline.selectors} selectors over ${baseline.contexts} source-schema-valid contexts; ${baseline.refs} semantic refs; ${baseline.manifest} manifest rows; frozen R54 persistence/signature/restart evidence preserved`)
