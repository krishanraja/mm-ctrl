import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR53, materializedR53Output, r53SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r53.mjs'
import { materializedR54, materializedR54Output } from './materialize-ctrl-g24-trusted-ingress-r54.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r54.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, ref, variant = 'UNAVAILABLE') => { const schema = get(contract, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }

function validateSpec(spec, value, label) {
  if (Object.hasOwn(spec, 'const')) return assert(value === spec.const, `${label}:const`)
  const values = spec.values ?? spec.enum
  if (Array.isArray(values)) return assert(values.includes(value), `${label}:enum`)
  if (spec.type === 'sha256') return assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), `${label}:sha256`)
  if (spec.type === 'sha256_or_exact_literal') return assert(typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || (spec.exact_literals ?? []).includes(value)), `${label}:sha_or_literal`)
  if (['identifier', 'canonical_timestamp', 'base64url_without_padding', 'literal'].includes(spec.type)) return assert(typeof value === 'string', `${label}:string`)
  if (spec.type === 'boolean') return assert(typeof value === 'boolean', `${label}:boolean`)
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return assert(Number.isFinite(value) && Number.isInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0), `${label}:number`)
  if (spec.type === 'nullable') return assert(value === null || value !== undefined, `${label}:nullable`)
  if (spec.type === 'array') return assert(Array.isArray(value), `${label}:array`)
  if (spec.type === 'object') return assert(value && typeof value === 'object' && !Array.isArray(value), `${label}:object`)
  assert(value !== undefined, `${label}:defined`)
}
function decodeFixture(contract, fixture, label) {
  const schema = schemaAt(contract, fixture.schema_ref, fixture.schema_variant)
  assert(schema?.properties && fixture.schema_version === schema.schema_version, `${label}:schema`)
  const bytes = Buffer.from(fixture.canonical_row_bytes_b64url, 'base64url')
  assert(sha(bytes) === fixture.canonical_row_bytes_sha256, `${label}:bytes_sha`)
  const text = bytes.toString('utf8'), payload = JSON.parse(text)
  assert(canonicalR44(payload) === text, `${label}:canonical_round_trip`)
  assert(same(Object.keys(payload).sort(cp), Object.keys(schema.properties).sort(cp)), `${label}:keyset`)
  for (const [field, spec] of Object.entries(schema.properties)) validateSpec(spec, payload[field], `${label}:${field}`)
  return { schema, payload, bytes }
}
function recomputeFingerprint(contract, schema, payload, evidence, label) {
  const authority = get(contract, schema.fingerprint_ref)
  assert(authority && evidence && evidence.authority_ref === schema.fingerprint_ref && same(evidence.exact_preimage_order, authority.preimage_order), `${label}:fingerprint_authority`)
  const preimage = {}
  for (const field of authority.preimage_order) preimage[field] = field === 'domain_ascii' ? authority.domain_ascii : payload[field]
  const expected = hash(preimage)
  assert(same(preimage, evidence.exact_preimage) && expected === evidence.expected_fingerprint && payload[schema.fingerprint_field] === expected, `${label}:fingerprint_execution`)
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
function recomputeLinkedTarget(contract, authority, decoded, label) {
  const link = authority.executable_native_derivation_evidence.linked_target, target = decodeFixture(contract, link.target_fixture, `${label}:target`)
  let targetFingerprint = null
  if (target.schema.fingerprint_field) targetFingerprint = recomputeFingerprint(contract, target.schema, target.payload, link.target_fixture.fingerprint, `${label}:target`)
  let targetIdentity = link.target_identity_field === '$canonical_row_bytes' ? sha(target.bytes) : target.payload[link.target_identity_field]
  if (!targetIdentity && link.target_identity_role === 'declared_content_address') targetIdentity = link.target_fixture.declared_content_address?.expected_identity ?? link.target_fixture.row_ref?.expected_identity ?? link.target_fixture.nonce_receipt?.expected_identity
  targetIdentity ??= targetFingerprint
  assert(targetIdentity === link.target_native_identity && (targetFingerprint ?? targetIdentity) === link.target_native_fingerprint, `${label}:target_native_identity`)
  const expected = authority.native_identity_role === 'companion_fingerprint' ? targetFingerprint ?? targetIdentity : targetIdentity
  assert(decoded.payload[authority.identity_field] === expected && authority.executable_native_derivation_evidence.expected_identity === expected, `${label}:linked_source_equality`)
  assert(authority.executable_native_derivation_evidence.duplicated_scalar_assertion_only === false, `${label}:not_scalar_laundering`)
  return expected
}
function validateIdentity(contract, row) {
  const authority = get(contract, row.exact_authority_ref), label = row.identity_kind
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
  else if (row.native_identity_role === 'unique_key_component') assert(evidence.execution === 'selected_schema_native_unique_key' && evidence.expected_identity === decoded.payload[row.identity_field] && evidence.exact_unique_key_memberships.some(fields => fields.includes(row.identity_field)), `${label}:unique_key`)
  else recomputeLinkedTarget(contract, authority, decoded, label)
}
function validateIdentities(contract) {
  const report = contract.authority_operation_native_identity_applicability_report, index = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
  assert(report.exact_R53_candidate_count === 1229 && report.exact_applicable_total === 1222 && report.exact_not_applicable_total === 7 && report.exact_applicable_total + report.exact_not_applicable_total === report.exact_R53_candidate_count, 'identity_applicability_totals')
  assert(report.declared_wrapper_content_address_field_equalities === 276 && report.declared_row_or_nonce_content_addresses === 5, 'identity_content_categories')
  const expectedExcluded = new Set(['result_ref', 'result_bytes_sha256', 'result_fingerprint', 'nonce'])
  assert(report.exact_not_applicable_candidates.every(row => expectedExcluded.has(row.identity_field) && row.disposition === 'not_applicable_no_native_identity_formula_for_this_field'), 'identity_honest_exclusions')
  assert(index.length === report.exact_applicable_total && new Set(index.map(row => row.identity_kind)).size === index.length, 'identity_index')
  const categories = index.reduce((counts, row) => { counts[row.native_identity_role] = (counts[row.native_identity_role] ?? 0) + 1; return counts }, {})
  assert(same(Object.fromEntries(Object.entries(categories).sort((a, b) => cp(a[0], b[0]))), report.exact_category_counts), 'identity_category_counts')
  for (const row of index) validateIdentity(contract, row)
  return { total: index.length, categories }
}

const DIMENSION_FIELDS = { source_operation: ['operation_name'], source_result_branch: ['result_branch', 'hold_branch', 'branch'], proof_family: ['proof_family'], branch_class: ['branch_class'], evidence_kind: ['evidence_kind'], target_store: ['target_store'], fresh_selection_row_id: ['fresh_selection_row_id'] }
function specValues(spec) { if (!spec) return []; if (Object.hasOwn(spec, 'const')) return [spec.const]; return spec.values ?? spec.enum ?? [] }
function specAccepts(spec, value) { const allowed = specValues(spec); return !allowed.length || allowed.includes(value) }
function independentlyNormalize(old, contract) {
  const schema = schemaAt(contract, old.source_schema_ref, old.source_schema_variant), rows = []
  for (let index = 0; index < old.exact_source_constant_cases.length; index += 1) {
    const prior = old.exact_source_constant_cases[index], target = old.exact_concrete_cases[index], base = { ...prior, selected_evidence_kind: prior.evidence_kind }
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
  const prior = materializedR53.authority_operation_internal_reference_target_selectors.rows[selector.selector_id], expected = independentlyNormalize(prior, contract), schema = schemaAt(contract, selector.source_schema_ref, selector.source_schema_variant)
  assert(selector.schema_version === 'ctrl.g24.native-source-schema-intersection-selector.r54.v1' && selector.exact_case_count === expected.length, `selector_count:${selector.selector_id}`)
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
  assert(validation.exact_invalid_R53_count === 49 && validation.known_repair_classes.verified_consuming_evidence_kind === 48 && validation.known_repair_classes.proof_nonce_proof_family_enum === 1, 'selector_invalid_reproduction')
  for (const selector of selectors) validateSelector(contract, selector)
  const nonce = selectors.find(row => row.source_schema_ref === 'proof_nonce_ledger.row_schema' && row.source_field === 'nonce_receipt_ref')
  assert(same(nonce.exact_source_schema_valid_cases.map(row => row.proof_family).sort(cp), ['evaluator', 'issuer', 'root_admin', 'root_bootstrap']), 'selector_nonce_families')
  const verified = selectors.filter(row => row.source_schema_ref === 'session_hold_evidence_schema' && row.source_schema_variant === 'verified_consuming')
  assert(verified.every(row => row.exact_source_schema_valid_cases.every(context => context.evidence_kind === 'verified_consuming' && context.selected_evidence_kind === 'verified_session_hold_evidence')), 'selector_verified_evidence')
  return { selectors: selectors.length, contexts: authority.exact_source_context_count }
}

function expectedSourcePaths(contract) {
  const replaced = new Set(['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
  const added = ['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_native_identity_applicability_report', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_selector_source_schema_validation_authority', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest', 'authority_runtime_semantic_manifest_hash_contract']
  return [...new Set([...r53SemanticAuthorityPaths.filter(path => !replaced.has(path)), ...added])].filter(path => get(contract, path) !== undefined).sort(cp)
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
  const snapshot = Object.fromEntries(paths.map(path => [path, ownedSnapshotR44(get(contract, path))])), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R54-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: paths, values: snapshot })
  assert(snapshotSha === registry.source_snapshot_sha256 && snapshotSha === manifest.source_snapshot_sha256, 'manifest_snapshot')
  const refs = scanRefs(contract, paths)
  assert(refs.length === 53039 && same(refs, registry.exact_occurrence_rows) && refs.length === registry.exact_expected_occurrence_count, `semantic_refs:${refs.length}`)
  assert(manifest.rows.length === 236 && manifest.exact_expected_count === 236, 'manifest_count')
  for (const row of manifest.rows) assert(row.authority_content_sha256 === hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }), `manifest_content:${row.authority_path}`)
  const without = { ...manifest }; delete without.manifest_envelope_seal_sha256
  assert(manifest.manifest_graph_sha256 === hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifest.rows }) && manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: without }), 'manifest_seals')
  return { refs: refs.length, manifest: manifest.rows.length }
}
function validate(contract) {
  assert(contract.schema_version === 'ctrl.g24.trusted-ingress.r54.effective.v1' && contract.schema_change_manifest.runtime_database_ui_deployment_or_external_action === 'closed', 'r54_boundary')
  assert(same(contract.authority_operation_normative_persistence_registry, materializedR53.authority_operation_normative_persistence_registry), 'R53_persistence_preserved')
  assert(same(contract.authority_operation_committed_receipt_identity_fixtures, materializedR53.authority_operation_committed_receipt_identity_fixtures), 'R53_signed_restart_fixtures_preserved')
  const identities = validateIdentities(contract), selectors = validateSelectors(contract), manifest = validateManifest(contract)
  return { identities, ...selectors, ...manifest }
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r53.json'), 'utf8') === materializedR53Output, 'frozen_R53_exact')
assert(readFileSync(join(root, outputPath), 'utf8') === materializedR54Output, 'exact_R54_materialization')
const baseline = validate(materializedR54)
let attacks = 0
function attack(name, validator, mutate) { const contract = structuredClone(materializedR54); mutate(contract); let rejected = false; try { validator(contract) } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
const index = materializedR54.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
const identityOf = role => index.find(row => row.native_identity_role === role)
attack('generic_identity_fixture_restored', validateIdentities, contract => { const row = identityOf('unique_key_component'); get(contract, row.exact_authority_ref).executable_formula_fixture = { expected_identity: 'laundered' } })
attack('opaque_proof_bundle_ref_mismatch', validateIdentities, contract => { const row = index.find(item => item.identity_kind.includes('authority_opaque_raw_input_stores.proof_bundle') && item.identity_field === 'artifact_ref'); get(contract, row.exact_authority_ref).executable_native_derivation_evidence.selected_native_derivation.expected_identity = sha('wrong') })
attack('opaque_target_sha_mismatch', validateIdentities, contract => { const row = index.find(item => item.identity_kind.includes('authority_opaque_raw_input_stores.target') && item.identity_field === 'opaque_bytes_sha256'); get(contract, row.exact_authority_ref).executable_native_derivation_evidence.expected_identity = sha('wrong') })
for (const row of index.filter(item => item.native_identity_role === 'declared_row_version')) attack(`row_version_self_reference:${row.identity_kind}`, contract => validateIdentity(contract, contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.find(item => item.identity_kind === row.identity_kind)), contract => { const authority = get(contract, row.exact_authority_ref); authority.executable_native_derivation_evidence.selected_native_derivation.exact_preimage.ordered_complete_mutable_authority_fields.push({ field: row.identity_field, value: authority.executable_native_derivation_evidence.expected_identity }) })
attack('session_hold_companion_splice', validateIdentities, contract => { const row = index.find(item => item.identity_field === 'session_hold_evidence_fingerprint_or_unavailable'); get(contract, row.exact_authority_ref).executable_native_derivation_evidence.linked_target.target_native_fingerprint = sha('splice') })
attack('fixture_malformed_length', validateIdentities, contract => { const row = identityOf('canonical_row_bytes_content_address'); const authority = get(contract, row.exact_authority_ref); authority.schema_valid_linked_row_fixture.canonical_row_bytes_b64url = authority.schema_valid_linked_row_fixture.canonical_row_bytes_b64url.slice(2) })
attack('fixture_sha_mismatch', validateIdentities, contract => { const row = identityOf('schema_declared_fingerprint'); get(contract, row.exact_authority_ref).schema_valid_linked_row_fixture.canonical_row_bytes_sha256 = sha('wrong') })
attack('fixture_ref_mismatch', validateIdentities, contract => { const row = index.find(item => item.native_identity_role === 'declared_content_address' && item.identity_field === 'artifact_ref'); const authority = get(contract, row.exact_authority_ref); authority.executable_native_derivation_evidence.expected_identity = sha('wrong') })

const invalidRows = materializedR54.authority_operation_selector_source_schema_validation_authority.exact_invalid_R53_context_occurrences
for (const [index, invalid] of invalidRows.entries()) attack(`invalid_source_context_${index + 1}`, contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[invalid.selector_id]), contract => { const selector = contract.authority_operation_internal_reference_target_selectors.rows[invalid.selector_id]; selector.exact_source_schema_valid_cases[0][invalid.invalid_dimension] = invalid.invalid_value })
const selectorIds = Object.keys(materializedR54.authority_operation_internal_reference_target_selectors.rows)
attack('selector_wrong_operation', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[0]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[0]].exact_source_schema_valid_cases[0].source_operation = 'forged_operation' })
attack('selector_wrong_branch', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[1]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[1]].exact_source_schema_valid_cases[0].source_result_branch = 'forged_branch' })
attack('selector_wrong_proof_family', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[2]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[2]].exact_source_schema_valid_cases[0].proof_family = 'forged_proof' })
attack('selector_wrong_branch_class', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[3]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[3]].exact_source_schema_valid_cases[0].branch_class = 'forged_class' })
attack('selector_wrong_evidence', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[4]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[4]].exact_source_schema_valid_cases[0].selected_evidence_kind = 'forged_evidence' })
attack('selector_wrong_store', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[5]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[5]].exact_source_schema_valid_cases[0].target_store = 'forged_store' })
attack('selector_wrong_selection_row', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[6]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[6]].exact_source_schema_valid_cases[0].fresh_selection_row_id = 'forged_row' })
attack('selector_zero_target', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[7]]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[7]].exact_concrete_cases.pop() })
attack('selector_multiple_target', contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[8]]), contract => { const selector = contract.authority_operation_internal_reference_target_selectors.rows[selectorIds[8]]; selector.exact_concrete_cases.push(structuredClone(selector.exact_concrete_cases[0])) })
attack('manifest_identity_mutation', validateManifest, contract => { contract.authority_operation_native_identity_applicability_report.exact_applicable_total += 1 })

console.log(`ok: R54 exact; ${attacks} attacks; ${baseline.identities.total}/1229 R53 candidates have native identities and 7 are honestly not applicable; 276/276 wrapper content-address equalities plus 5 row-or-nonce content addresses; 6/6 non-self-referential row versions; 33/33 linked companion fingerprints; ${baseline.selectors} selectors over ${baseline.contexts} source-schema-valid contexts; 49/49 invalid R53 contexts rejected; 9/9 selector class attacks; ${baseline.refs} semantic refs; ${baseline.manifest} manifest rows; frozen R53 persistence/signature/restart evidence preserved`)
