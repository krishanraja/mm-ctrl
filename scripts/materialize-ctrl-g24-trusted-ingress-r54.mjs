import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR53, materializedR53Output, r53SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r53.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r53.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r54.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR53Output) throw new Error('R54_frozen_R53_input_mismatch')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }
const r54 = structuredClone(materializedR53)
const schemaAt = (ref, variant = 'UNAVAILABLE') => { const schema = get(r54, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }

r54.schema_version = 'ctrl.g24.trusted-ingress.r54.effective.v1'
r54.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r53_vetoed', 'trusted_ingress_r54_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r54.supersedes = { commit: '2d9d17ee8a7097f52bcaedfe90fa54b0a1ef5c6b', tree: 'f46a35c108769641ac3537937c0051d85f604308', human_blob: 'b88932232f93b70d808316a489af024eb9a57936', machine_blob: '36c7956fad52ca6944a89f414edd1383c3fe181b', qa_blob: '4c5fe69cf197905cfbfce0ec0a5c9e174fe7c4c3', checker_blob: 'e6b5cc8ad0f96a29d4ecd1706878c86a5b5485f3', materializer_blob: 'd055fb2eb9e790578c19eb6aa7ed420d1f016818', founder_checker_blob: '8aac8727068c0118faefb02cb89536ed41fa3a73', adjudication: 'veto' }
r54.materialization = { ...r54.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r54.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['freeze_R53_input', 'select_exact_native_formula_per_persisted_identity', 'build_schema_valid_row_fixture', 'resolve_content_address_and_row_version_dependencies', 'resolve_companion_target_fixture', 'compute_declared_fingerprint', 'compute_final_canonical_row_bytes', 'derive_source_schema_valid_selector_intersection', 'prove_selector_totality_and_uniqueness', 'finalize_nonderived_authorities', 'snapshot_final_semantic_sources', 'derive_reference_owner_and_manifest', 'seal_output'], no_post_snapshot_source_write: true }

function values(spec) { if (!spec) return []; if (Object.hasOwn(spec, 'const')) return [spec.const]; return spec.values ?? spec.enum ?? [] }
function valueForSpec(spec, seed) {
  if (!spec || typeof spec !== 'object') return `fixture_${seed}`
  if (Object.hasOwn(spec, 'const')) return spec.const
  const literals = spec.values ?? spec.enum
  if (Array.isArray(literals) && literals.length) return literals[0]
  if (spec.type === 'sha256') return sha(`R54:${seed}`)
  if (spec.type === 'sha256_or_exact_literal') return (spec.exact_literals ?? [])[0] ?? sha(`R54:${seed}`)
  if (spec.type === 'canonical_timestamp') return '2031-01-01T00:00:00.000Z'
  if (spec.type === 'base64url_without_padding') return Buffer.from(`R54:${seed}`, 'utf8').toString('base64url')
  if (spec.type === 'boolean') return false
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return spec.type === 'positive_integer' ? 1 : 0
  if (spec.type === 'nullable') return null
  if (spec.type === 'array') return []
  if (spec.type === 'object' && spec.properties) return Object.fromEntries(Object.entries(spec.properties).map(([field, child]) => [field, valueForSpec(child, `${seed}_${field}`)]))
  return `fixture_${seed}`
}
function schemaPayload(schema, seed) { return Object.fromEntries(Object.entries(schema.properties).map(([field, spec]) => [field, valueForSpec(spec, `${seed}_${field}`)])) }
function validateSpec(spec, value) {
  if (Object.hasOwn(spec, 'const')) return value === spec.const
  const literals = spec.values ?? spec.enum
  if (Array.isArray(literals)) return literals.includes(value)
  if (spec.type === 'sha256') return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
  if (spec.type === 'sha256_or_exact_literal') return typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || (spec.exact_literals ?? []).includes(value))
  if (['identifier', 'canonical_timestamp', 'base64url_without_padding', 'literal'].includes(spec.type)) return typeof value === 'string'
  if (spec.type === 'boolean') return typeof value === 'boolean'
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return Number.isFinite(value) && Number.isInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0)
  if (spec.type === 'nullable') return value === null || value !== undefined
  if (spec.type === 'array') return Array.isArray(value)
  if (spec.type === 'object') return value && typeof value === 'object' && !Array.isArray(value)
  return value !== undefined
}
function fingerprint(schema, payload) {
  if (!schema.fingerprint_field || !schema.fingerprint_ref) return null
  const authority = get(r54, schema.fingerprint_ref)
  if (!authority?.domain_ascii || !Array.isArray(authority.preimage_order)) throw new Error(`R54_fingerprint_authority_missing:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of authority.preimage_order) {
    if (field === 'domain_ascii') preimage[field] = authority.domain_ascii
    else if (Object.hasOwn(payload, field)) preimage[field] = payload[field]
    else throw new Error(`R54_fingerprint_operand_missing:${schema.fingerprint_ref}:${field}`)
  }
  const expected = hash(preimage)
  payload[schema.fingerprint_field] = expected
  return { authority_ref: schema.fingerprint_ref, codec_ref: authority.field_encoding_ref ?? authority.codec_ref ?? 'canonical_json_utf8_encoding', exact_preimage_order: [...authority.preimage_order], exact_preimage: preimage, expected_fingerprint: expected }
}
function committedVersion(schemaRef, schema, payload) {
  const store = schemaRef.split('.').at(-1), selected = r54.authority_operation_committed_target_identity_authority.variants?.[store]
  if (!selected || selected.row_schema_ref !== schemaRef) return null
  const excluded = new Set(['row_version_ref', schema.fingerprint_field])
  const ordered = Object.keys(schema.properties).filter(field => !excluded.has(field)).map(field => ({ field, value: payload[field] }))
  const preimage = { domain_ascii: selected.row_version_domain_ascii, schema_version: selected.row_version_schema_version, ordered_complete_mutable_authority_fields: ordered }
  const expected = hash(preimage)
  payload.row_version_ref = expected
  return { authority_ref: `authority_operation_committed_target_identity_authority.variants.${store}`, exact_preimage_order: [...selected.row_version_preimage_exact_keys], exact_preimage: preimage, excluded_derived_fields: [...excluded], expected_row_version_ref: expected, mutation_sensitive_fields: ordered.map(row => row.field) }
}
function finalizeRow(schemaRef, variant, seed) {
  const schema = schemaAt(schemaRef, variant)
  if (!schema?.properties) throw new Error(`R54_fixture_schema_missing:${schemaRef}:${variant}`)
  const payload = schemaPayload(schema, seed)
  let selectedPayload = null
  let selectedPayloadSchemaRef = null
  let selectedPayloadSchemaVariant = 'UNAVAILABLE'
  let declaredContentAddress = null
  const rule = schema.content_address_rule
  if (rule === 'artifact_ref_equals_opaque_bytes_sha256') {
    const bytes = Buffer.from(`R54-OPAQUE:${seed}`, 'utf8'), digest = sha(bytes)
    payload.opaque_bytes_b64url = bytes.toString('base64url'); payload.opaque_bytes_length = bytes.length; payload.opaque_bytes_sha256 = digest; payload.artifact_ref = digest
    declaredContentAddress = { authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', rule, exact_operand_name: 'opaque_bytes', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest, equal_fields: ['artifact_ref', 'opaque_bytes_sha256'] }
  } else if (rule === 'artifact_ref_equals_canonical_bytes_sha256') {
    selectedPayloadSchemaRef = schema.properties.canonical_schema_ref?.const
    let selectedSchema = get(r54, selectedPayloadSchemaRef)
    if (!selectedSchema?.properties && selectedSchema?.variants) { selectedPayloadSchemaVariant = Object.keys(selectedSchema.variants).sort(cp)[0]; selectedSchema = selectedSchema.variants[selectedPayloadSchemaVariant] }
    if (!selectedSchema?.properties) throw new Error(`R54_canonical_payload_schema_missing:${selectedPayloadSchemaRef}`)
    selectedPayload = schemaPayload(selectedSchema, `${seed}_selected_payload`)
    const selectedFingerprint = fingerprint(selectedSchema, selectedPayload)
    const bytes = Buffer.from(canonicalR44(selectedPayload), 'utf8'), digest = sha(bytes)
    payload.canonical_bytes_b64url = bytes.toString('base64url'); payload.canonical_bytes_length = bytes.length; payload.canonical_bytes_sha256 = digest; payload.artifact_ref = digest
    payload.parsed_content_fingerprint = selectedFingerprint?.expected_fingerprint ?? hash({ domain_ascii: 'CTRL-G24-R54-PARSED-CONTENT', canonical_bytes_sha256: digest })
    declaredContentAddress = { authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', rule, selected_payload_schema_ref: selectedPayloadSchemaRef, selected_payload_schema_variant: selectedPayloadSchemaVariant, selected_payload: selectedPayload, exact_operand_name: 'canonical_payload_bytes_utf8', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest, equal_fields: ['artifact_ref', 'canonical_bytes_sha256'] }
  }
  const rowVersion = Object.hasOwn(payload, 'row_version_ref') ? committedVersion(schemaRef, schema, payload) : null
  let rowRef = null
  if (schema.row_ref_derivation && Array.isArray(schema.row_ref_preimage_included_fields)) {
    const preimage = { domain_ascii: schema.row_ref_domain_ascii }
    for (const field of schema.row_ref_preimage_included_fields) preimage[field] = payload[field]
    const expected = hash(preimage), preferredField = schema.row_ref_derivation.startsWith('hold_row_ref_') ? 'hold_row_ref' : schema.row_ref_derivation.startsWith('registry_row_ref_') ? 'registry_row_ref' : null
    const field = preferredField ?? Object.keys(schema.properties).find(name => schema.row_ref_preimage_excluded_fields?.includes(name) && name.endsWith('_ref'))
    if (!field) throw new Error(`R54_row_ref_field_missing:${schemaRef}:${variant}`)
    payload[field] = expected
    rowRef = { authority_ref: `${schemaRef}${variant === 'UNAVAILABLE' ? '' : `.variants.${variant}`}.row_ref_derivation`, rule: schema.row_ref_derivation, exact_preimage_order: ['domain_ascii', ...schema.row_ref_preimage_included_fields], exact_preimage: preimage, excluded_derived_fields: [...schema.row_ref_preimage_excluded_fields], identity_field: field, expected_identity: expected }
  }
  let nonceReceipt = null
  if (schemaRef === 'proof_nonce_ledger.row_schema') {
    const receiptPayloadSchema = r54.proof_nonce_receipt_payload_schema, receiptPayload = schemaPayload(receiptPayloadSchema, `${seed}_nonce_receipt`)
    const bytes = Buffer.from(canonicalR44(receiptPayload), 'utf8'), digest = sha(bytes)
    payload.nonce_receipt_ref = digest
    nonceReceipt = { authority_ref: 'authority_operation_persisted_identity_primitives.nonce_receipt_content_address', payload_schema_ref: 'proof_nonce_receipt_payload_schema', payload: receiptPayload, exact_operand_name: 'proof_nonce_receipt_payload_bytes_utf8', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest }
  }
  const fp = fingerprint(schema, payload)
  for (const [field, spec] of Object.entries(schema.properties)) if (!validateSpec(spec, payload[field])) throw new Error(`R54_fixture_schema_invalid:${schemaRef}:${variant}:${field}`)
  const canonicalBytes = Buffer.from(canonicalR44(payload), 'utf8')
  return { schema_ref: schemaRef, schema_variant: variant, schema_version: schema.schema_version, payload, selected_payload_schema_ref: selectedPayloadSchemaRef, selected_payload_schema_variant: selectedPayloadSchemaVariant, selected_payload: selectedPayload, declared_content_address: declaredContentAddress, row_version: rowVersion, row_ref: rowRef, nonce_receipt: nonceReceipt, fingerprint: fp, canonical_row_bytes_b64url: canonicalBytes.toString('base64url'), canonical_row_bytes_sha256: sha(canonicalBytes) }
}
function refreshFixture(fixture) {
  const schema = schemaAt(fixture.schema_ref, fixture.schema_variant)
  if (fixture.row_version) fixture.row_version = committedVersion(fixture.schema_ref, schema, fixture.payload)
  if (fixture.row_ref) {
    const preimage = { domain_ascii: schema.row_ref_domain_ascii }
    for (const field of schema.row_ref_preimage_included_fields) preimage[field] = fixture.payload[field]
    const expected = hash(preimage)
    fixture.payload[fixture.row_ref.identity_field] = expected
    fixture.row_ref = { ...fixture.row_ref, exact_preimage: preimage, expected_identity: expected }
  }
  fixture.fingerprint = fingerprint(schema, fixture.payload)
  for (const [field, spec] of Object.entries(schema.properties)) if (!validateSpec(spec, fixture.payload[field])) throw new Error(`R54_refreshed_fixture_schema_invalid:${fixture.schema_ref}:${fixture.schema_variant}:${field}`)
  const bytes = Buffer.from(canonicalR44(fixture.payload), 'utf8')
  fixture.canonical_row_bytes_b64url = bytes.toString('base64url'); fixture.canonical_row_bytes_sha256 = sha(bytes)
  return fixture
}
function compactDerivation(value) {
  if (!value) return null
  const copy = { ...value }
  if (copy.selected_payload) { const bytes = Buffer.from(canonicalR44(copy.selected_payload), 'utf8'); copy.selected_payload_bytes_b64url = bytes.toString('base64url'); copy.selected_payload_bytes_sha256 = sha(bytes); delete copy.selected_payload }
  return copy
}
function compactFixture(fixture) {
  return { schema_ref: fixture.schema_ref, schema_variant: fixture.schema_variant, schema_version: fixture.schema_version, canonical_row_bytes_b64url: fixture.canonical_row_bytes_b64url, canonical_row_bytes_sha256: fixture.canonical_row_bytes_sha256, declared_content_address: compactDerivation(fixture.declared_content_address), row_version: fixture.row_version, row_ref: fixture.row_ref, nonce_receipt: compactDerivation(fixture.nonce_receipt), fingerprint: fixture.fingerprint }
}

const persistence = r54.authority_operation_normative_persistence_registry.exact_rows
const priorIndex = r54.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
const priorEqualities = r54.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows
function selectorFor(row, companion = false) {
  const candidates = priorEqualities.filter(item => item.source_schema_ref === row.row_schema_ref && item.source_schema_variant === row.row_schema_variant && (companion ? item.companion_fingerprint_fields?.some(field => field.field === row.identity_field) : item.source_field === row.identity_field))
  return candidates.find(item => item.selector_ref && item.selector_ref !== 'UNAVAILABLE') ?? candidates[0]
}
function specialTarget(row) {
  if (row.identity_field === 'account_binding_fingerprint') return { target_schema_ref: 'authoritative_row_schemas.account_stable_actor_bindings', target_schema_variant: 'UNAVAILABLE', target_native_identity_field: 'binding_ref', target_native_identity_role: 'resolved_reference_identity' }
  if (row.identity_field === 'account_standing_fingerprint') return { target_schema_ref: 'authoritative_row_schemas.account_access_standings', target_schema_variant: 'UNAVAILABLE', target_native_identity_field: 'standing_ref', target_native_identity_role: 'resolved_reference_identity' }
  if (row.identity_field === 'session_hold_evidence_fingerprint_or_unavailable') return { target_schema_ref: 'session_hold_evidence_schema', target_schema_variant: 'verified_consuming', target_native_identity_field: 'session_hold_evidence_ref', target_native_identity_role: 'declared_content_address' }
  return null
}
function linkedTarget(row, companion) {
  const equality = selectorFor(row, companion), selector = equality?.selector_ref && equality.selector_ref !== 'UNAVAILABLE' ? get(r54, equality.selector_ref) : null
  const selectedSource = selector?.exact_concrete_cases?.[0] ?? specialTarget(row)
  if (!selectedSource) throw new Error(`R54_linked_target_missing:${row.identity_kind}`)
  const selected = { ...selectedSource }
  if (selected.target_native_identity_field === 'payload_content_address') {
    const desiredRef = selected.source_result_branch && get(r54, `${selected.target_schema_ref}.variants.${selected.source_result_branch}`) ? `${selected.target_schema_ref}.variants.${selected.source_result_branch}` : selected.target_schema_ref
    const storeRow = persistence.find(item => schemaAt(item.row_schema_ref, item.row_schema_variant)?.properties?.canonical_schema_ref?.const === desiredRef)
    if (!storeRow) throw new Error(`R54_payload_artifact_store_missing:${selected.target_schema_ref}`)
    selected.target_schema_ref = storeRow.row_schema_ref; selected.target_schema_variant = storeRow.row_schema_variant; selected.target_native_identity_field = 'artifact_ref'; selected.target_native_identity_role = 'declared_content_address'
  }
  if (selected.target_native_identity_field === 'authority_row_content_address') { selected.target_native_identity_field = '$canonical_row_bytes'; selected.target_native_identity_role = 'canonical_row_bytes_content_address' }
  if ((selected.target_schema_variant ?? 'UNAVAILABLE') === 'UNAVAILABLE' && !get(r54, selected.target_schema_ref)?.properties && get(r54, selected.target_schema_ref)?.variants) selected.target_schema_variant = Object.keys(get(r54, selected.target_schema_ref).variants).sort(cp)[0]
  const fixture = finalizeRow(selected.target_schema_ref, selected.target_schema_variant ?? 'UNAVAILABLE', `target_${row.identity_kind}`)
  const targetSchema = schemaAt(selected.target_schema_ref, selected.target_schema_variant ?? 'UNAVAILABLE')
  let nativeIdentity = selected.target_native_identity_field === '$canonical_row_bytes' ? fixture.canonical_row_bytes_sha256 : fixture.payload[selected.target_native_identity_field]
  if (!nativeIdentity && selected.target_native_identity_role === 'declared_content_address') nativeIdentity = fixture.declared_content_address?.expected_identity ?? fixture.row_ref?.expected_identity ?? fixture.nonce_receipt?.expected_identity
  const nativeFingerprint = fixture.fingerprint?.expected_fingerprint ?? nativeIdentity
  nativeIdentity ??= nativeFingerprint
  return { selector_ref: equality?.selector_ref ?? 'R54_SPECIAL_EXACT_TARGET', selector_context: selector?.exact_source_constant_cases?.[0] ?? 'SPECIAL_EXACT_TARGET', target_schema_ref: selected.target_schema_ref, target_schema_variant: selected.target_schema_variant ?? 'UNAVAILABLE', target_schema_version: targetSchema.schema_version, target_identity_field: selected.target_native_identity_field, target_identity_role: selected.target_native_identity_role, target_fixture: compactFixture(fixture), target_native_identity: nativeIdentity, target_native_fingerprint: nativeFingerprint, target_fingerprint_field: targetSchema.fingerprint_field ?? selected.target_native_identity_field, target_fingerprint_authority_ref: targetSchema.fingerprint_ref ?? 'NATIVE_SELECTED_IDENTITY' }
}

r54.authority_operation_persisted_identity_formula_library = {
  schema_version: 'ctrl.g24.persisted-identity-formula-library.r54.v1',
  canonical_row_bytes_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.canonical-row-bytes.r54.v1', formula_class: 'native_final_row_content_address', exact_formula: 'lowercase_hex_SHA256_of_exact_final_closed_schema_canonical_row_bytes' },
  declared_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-content-address.r54.v1', formula_class: 'selected_schema_native_content_address', exact_formula: 'opaque_ref_equals_opaque_bytes_sha256_or_artifact_ref_equals_canonical_payload_bytes_sha256_or_exact_declared_row_ref_preimage_or_nonce_receipt_payload_sha256' },
  declared_row_version: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-row-version.r54.v1', formula_class: 'selected_committed_target_native_row_version', exact_formula: 'selected_store_R49_domain_and_version_plus_ordered_complete_mutable_fields_excluding_row_version_and_native_fingerprint' },
  schema_declared_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.schema-fingerprint.r54.v1', formula_class: 'selected_schema_native_fingerprint', exact_formula: 'selected_fingerprint_authority_domain_order_types_and_declared_codec_over_actual_linked_row' },
  unique_key_component: { schema_version: 'ctrl.g24.persisted-identity-formula.unique-key-component.r54.v1', formula_class: 'native_schema_unique_key_component', exact_formula: 'exact_value_from_final_schema_valid_linked_row' },
  resolved_reference_identity: { schema_version: 'ctrl.g24.persisted-identity-formula.resolved-reference.r54.v1', formula_class: 'resolved_concrete_target_native_identity', exact_formula: 'source_reference_equals_recomputed_identity_from_selected_concrete_target_fixture' },
  companion_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-fingerprint.r54.v1', formula_class: 'resolved_concrete_target_native_fingerprint', exact_formula: 'source_companion_equals_recomputed_selected_target_schema_native_fingerprint' },
}
const identityAuthorities = {}, identityRows = [], applicability = {}, inapplicableCandidates = []
for (const prior of priorIndex) {
  const key = `identity_${String(identityRows.length + 1).padStart(4, '0')}`, schema = schemaAt(prior.row_schema_ref, prior.row_schema_variant), source = finalizeRow(prior.row_schema_ref, prior.row_schema_variant, key)
  if (prior.native_identity_role === 'declared_content_address') {
    const native = source.declared_content_address ?? source.row_ref ?? source.nonce_receipt
    const applicable = native && (native.equal_fields?.includes(prior.identity_field) || native.identity_field === prior.identity_field || (source.nonce_receipt && prior.identity_field === 'nonce_receipt_ref'))
    if (!applicable) { inapplicableCandidates.push({ identity_kind: prior.identity_kind, row_schema_ref: prior.row_schema_ref, row_schema_variant: prior.row_schema_variant, identity_field: prior.identity_field, previous_candidate_role: prior.native_identity_role, disposition: 'not_applicable_no_native_identity_formula_for_this_field', reason: 'field_is_post_identity_data_or_a_nonidentity_substring_match_and_is_not_an_operand_equal_to_the_selected_schema_native_content_address' }); continue }
  }
  let evidence, expected
  if (prior.native_identity_role === 'canonical_row_bytes_content_address') { expected = source.canonical_row_bytes_sha256; evidence = { execution: 'raw_sha256_final_canonical_row_bytes', exact_operand_b64url: source.canonical_row_bytes_b64url, expected_identity: expected } }
  else if (prior.native_identity_role === 'declared_content_address') {
    const native = source.declared_content_address ?? source.row_ref ?? source.nonce_receipt
    if (!native) throw new Error(`R54_native_content_address_missing:${prior.identity_kind}`)
    expected = source.payload[prior.identity_field] ?? native.expected_identity
    evidence = { execution: 'selected_schema_native_content_address', selected_native_derivation: native, expected_identity: expected }
  } else if (prior.native_identity_role === 'declared_row_version') {
    if (!source.row_version) throw new Error(`R54_native_row_version_missing:${prior.identity_kind}`)
    expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_row_version', selected_native_derivation: source.row_version, expected_identity: expected, row_version_self_inclusion: false }
  } else if (prior.native_identity_role === 'schema_declared_fingerprint') {
    expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_fingerprint', selected_native_derivation: source.fingerprint, expected_identity: expected }
  } else if (prior.native_identity_role === 'unique_key_component') { expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_unique_key', exact_unique_key_memberships: get(r54, prior.exact_authority_ref).native_unique_key_memberships, expected_identity: expected } }
  else {
    const target = linkedTarget(prior, prior.native_identity_role === 'companion_fingerprint')
    expected = prior.native_identity_role === 'companion_fingerprint' ? target.target_native_fingerprint : target.target_native_identity
    source.payload[prior.identity_field] = expected
    refreshFixture(source)
    evidence = { execution: prior.native_identity_role === 'companion_fingerprint' ? 'linked_target_native_fingerprint' : 'linked_target_native_identity', linked_target: target, expected_identity: expected, duplicated_scalar_assertion_only: false }
  }
  if (evidence.selected_native_derivation) evidence.selected_native_derivation = compactDerivation(evidence.selected_native_derivation)
  const authority = { schema_version: 'ctrl.g24.persisted-native-identity-authority.r54.v1', identity_kind: prior.identity_kind, store_path: prior.store_path, row_schema_ref: prior.row_schema_ref, row_schema_variant: prior.row_schema_variant, row_schema_version: prior.row_schema_version, identity_field: prior.identity_field, native_identity_role: prior.native_identity_role, selected_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${prior.native_identity_role}`, schema_valid_linked_row_fixture: compactFixture(source), executable_native_derivation_evidence: evidence, independent_round_trip_required: true }
  identityAuthorities[key] = authority
  identityRows.push({ ...prior, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: authority.schema_version })
  applicability[prior.native_identity_role] = (applicability[prior.native_identity_role] ?? 0) + 1
}
r54.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r54.authority_operation_native_identity_applicability_report = { schema_version: 'ctrl.g24.native-identity-applicability-report.r54.v1', exact_R53_candidate_count: priorIndex.length, exact_applicable_total: identityRows.length, exact_not_applicable_total: inapplicableCandidates.length, exact_not_applicable_candidates: inapplicableCandidates, exact_category_counts: Object.fromEntries(Object.entries(applicability).sort((a, b) => cp(a[0], b[0]))), declared_wrapper_content_address_field_equalities: identityRows.filter(row => row.native_identity_role === 'declared_content_address' && ['artifact_ref', 'canonical_bytes_sha256', 'opaque_bytes_sha256'].includes(row.identity_field)).length, declared_row_or_nonce_content_addresses: identityRows.filter(row => row.native_identity_role === 'declared_content_address' && ['hold_row_ref', 'registry_row_ref', 'nonce_receipt_ref'].includes(row.identity_field)).length, row_version_applicable: applicability.declared_row_version, row_version_not_invented_for_other_shapes: persistence.length - applicability.declared_row_version, companion_target_resolutions: applicability.companion_fingerprint, every_R53_candidate_adjudicated_as_native_or_not_applicable: true }
r54.authority_operation_artifact_fingerprint_derivation_authority = { schema_version: 'ctrl.g24.authority-operation-native-identity-derivation-authority.r54.v1', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', persisted_identity_formula_library_ref: 'authority_operation_persisted_identity_formula_library', native_identity_applicability_report_ref: 'authority_operation_native_identity_applicability_report', sole_active_identity_index: identityRows, exact_identity_kind_count: identityRows.length, exact_store_shape_count: persistence.length, generic_identity_fixture_machinery: 'forbidden', schema_valid_linked_native_formula_execution_required: true, companion_requires_concrete_target_recomputation: true, derived_identity_self_inclusion_unless_normative: 'forbidden', missing_extra_duplicate_unresolved_or_type_mismatched_identity: 'reject_materialization_and_hold_without_write' }

const DIMENSION_FIELDS = { source_operation: ['operation_name'], source_result_branch: ['result_branch', 'hold_branch', 'branch'], proof_family: ['proof_family'], branch_class: ['branch_class'], evidence_kind: ['evidence_kind'], target_store: ['target_store'], fresh_selection_row_id: ['fresh_selection_row_id'] }
function specAccepts(spec, value) { const allowed = values(spec); return !allowed.length || allowed.includes(value) }
function normalizedContexts(selector) {
  const schema = schemaAt(selector.source_schema_ref, selector.source_schema_variant), rows = []
  for (let index = 0; index < selector.exact_source_constant_cases.length; index += 1) {
    const old = selector.exact_source_constant_cases[index], oldTarget = selector.exact_concrete_cases[index], base = { ...old, selected_evidence_kind: old.evidence_kind }
    let candidates = [base]
    for (const [dimension, fields] of Object.entries(DIMENSION_FIELDS)) {
      const field = fields.find(name => schema.properties?.[name])
      if (!field) continue
      const allowed = values(schema.properties[field])
      if (!allowed.length || allowed.includes(base[dimension])) continue
      if (dimension === 'evidence_kind' && allowed.length === 1) candidates = candidates.map(item => ({ ...item, evidence_kind: allowed[0] }))
      else if (dimension === 'proof_family' && base.source_operation === 'UNAVAILABLE') candidates = allowed.map(value => ({ ...base, proof_family: value }))
      else candidates = []
    }
    for (const context of candidates) {
      const projection = {}
      for (const [dimension, fields] of Object.entries(DIMENSION_FIELDS)) for (const field of fields) if (schema.properties?.[field]) projection[field] = context[dimension]
      if (Object.entries(projection).every(([field, value]) => specAccepts(schema.properties[field], value))) rows.push({ context, target: { ...oldTarget, ...context }, projection })
    }
  }
  return uniq(rows).sort((a, b) => cp(canonicalR44(a.context), canonicalR44(b.context)))
}
const selectors = {}, equalityRows = [], invalidR53 = []
for (const old of Object.values(r54.authority_operation_internal_reference_target_selectors.rows)) {
  const schema = schemaAt(old.source_schema_ref, old.source_schema_variant)
  for (const context of old.exact_source_constant_cases) for (const [dimension, fields] of Object.entries(DIMENSION_FIELDS)) for (const field of fields) if (schema.properties?.[field] && !specAccepts(schema.properties[field], context[dimension])) invalidR53.push({ selector_id: old.selector_id, source_schema_ref: old.source_schema_ref, source_schema_variant: old.source_schema_variant, source_field: old.source_field, invalid_dimension: dimension, invalid_value: context[dimension], allowed_values: values(schema.properties[field]), repair: dimension === 'evidence_kind' ? 'use_exact_source_schema_evidence_kind_and_retain_selected_evidence_kind_separately' : 'derive_contexts_from_source_schema_literal_intersection' })
  const normalized = normalizedContexts(old), cases = normalized.map(row => ({ ...row.target, target_identity_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${row.target.target_native_identity_role}` }))
  selectors[old.selector_id] = { schema_version: 'ctrl.g24.native-source-schema-intersection-selector.r54.v1', selector_id: old.selector_id, source_schema_ref: old.source_schema_ref, source_schema_variant: old.source_schema_variant, source_schema_version: old.source_schema_version, source_field: old.source_field, selection_dimensions: [...old.selection_dimensions, 'selected_evidence_kind'], exact_source_schema_valid_cases: normalized.map(row => row.context), exact_source_schema_constant_projections: normalized.map(row => row.projection), exact_concrete_cases: cases, exact_case_count: cases.length, source_schema_validation: 'every_projected_literal_satisfies_exact_selected_closed_source_schema_const_enum_or_values', each_valid_source_constant_intersection_matches_exactly_one_target: true, caller_override_or_fallback: 'forbidden' }
}
for (const old of r54.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows) {
  const row = { ...old }
  if (old.exact_one_resolution_required) {
    const selector = selectors[old.selector_ref.split('.').at(-1)]
    row.classification = 'internal_exact_one_native_source_schema_intersection_selector'
    row.selector_ref = `authority_operation_internal_reference_target_selectors.rows.${selector.selector_id}`
    row.exact_source_constant_cases = selector.exact_source_schema_valid_cases
    row.exact_target_cases = selector.exact_concrete_cases
  }
  equalityRows.push(row)
}
r54.authority_operation_internal_reference_target_selectors = { schema_version: 'ctrl.g24.internal-reference-target-selectors.r54.v1', row_schema_version: 'ctrl.g24.native-source-schema-intersection-selector.r54.v1', derivation: 'intersection_of_exact_closed_source_schema_literals_with_operation_result_proof_family_branch_evidence_store_and_selection_tables', exact_count: Object.keys(selectors).length, exact_source_context_count: Object.values(selectors).reduce((sum, row) => sum + row.exact_case_count, 0), rows: selectors, selector_totality_and_uniqueness_for_every_source_schema_valid_context: true, invalid_source_context_count_in_R53: invalidR53.length, invalid_contexts_are_never_emitted: true, caller_override_meta_target_or_fallback: 'forbidden' }
r54.authority_operation_selector_source_schema_validation_authority = { schema_version: 'ctrl.g24.selector-source-schema-validation-authority.r54.v1', exact_invalid_R53_context_occurrences: invalidR53, exact_invalid_R53_count: invalidR53.length, known_repair_classes: { verified_consuming_evidence_kind: invalidR53.filter(row => row.invalid_dimension === 'evidence_kind').length, proof_nonce_proof_family_enum: invalidR53.filter(row => row.invalid_dimension === 'proof_family').length }, source_schema_valid_context_count: r54.authority_operation_internal_reference_target_selectors.exact_source_context_count, exact_intersection_required: true, zero_multiple_or_invalid_context: 'reject_materialization_and_hold_without_write' }
r54.authority_operation_complete_schema_cross_artifact_equality_registry = { ...r54.authority_operation_complete_schema_cross_artifact_equality_registry, schema_version: 'ctrl.g24.complete-schema-cross-artifact-equality-registry.r54.v1', exact_rows: equalityRows, exact_row_count: equalityRows.length, internal_exact_one_count: equalityRows.filter(row => row.exact_one_resolution_required).length, native_source_context_selector_ref: 'authority_operation_internal_reference_target_selectors', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority' }
r54.authority_operation_artifact_resolution_authority = { ...r54.authority_operation_artifact_resolution_authority, schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r54.v1', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', source_constant_selector_ref: 'authority_operation_internal_reference_target_selectors', every_internal_selected_reference_uses_source_schema_valid_intersection: true }
r54.authority_operation_restart_correlation_authority = { ...r54.authority_operation_restart_correlation_authority, schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r54.v1', equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority' }
r54.fixture_schema_validator = { ...r54.fixture_schema_validator, schema_version: 'ctrl.g24.fixture-schema-validator.r54.v1', validation_scope: 'R53_fixture_lineage_plus_every_persisted_identity_native_linked_formula_round_trip_and_source_schema_valid_selector_intersection' }
r54.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r54.v1', derivation: 'bounded_exact_extension_from_frozen_R53_native_identity_and_source_schema_selector_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.status', '$.supersedes', '$.authority_operation_persisted_identity_formula_library', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_native_identity_applicability_report', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_internal_reference_target_selectors', '$.authority_operation_selector_source_schema_validation_authority', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: [], frozen_parent_core_must_remain_byte_identical: true, runtime_database_ui_deployment_or_external_action: 'closed' }
r54.required_negative_fixture_families = [...new Set([...r54.required_negative_fixture_families, 'native_identity_exact_derivation_and_round_trip', 'row_version_self_reference', 'companion_target_splice', 'source_schema_invalid_selector_context'])]

const replaced = new Set(['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
const added = ['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_native_identity_applicability_report', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_selector_source_schema_validation_authority', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest']
r54.authority_runtime_semantic_reference_field_registry = { ...r54.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r54.v1' }
r54.authority_runtime_semantic_reference_owner_map = { ...r54.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r54.v1' }
r54.authority_runtime_semantic_dependency_owner_map = { ...r54.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r54.v1' }
r54.authority_runtime_semantic_manifest = { ...r54.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r54.v1' }
const sourcePaths = [...new Set([...r53SemanticAuthorityPaths.filter(path => !replaced.has(path)), ...added])].filter(path => get(r54, path) !== undefined).sort(cp)
r54.authority_runtime_semantic_manifest_hash_contract = { ...r54.authority_runtime_semantic_manifest_hash_contract, schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r54.v1', manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r54.v1', content_domain_ascii: 'CTRL-G24-R54-MANIFEST-CONTENT', dependency_domain_ascii: 'CTRL-G24-R54-MANIFEST-DEPENDENCY', graph_domain_ascii: 'CTRL-G24-R54-MANIFEST-GRAPH', envelope_domain_ascii: 'CTRL-G24-R54-MANIFEST-ENVELOPE' }
sourcePaths.push('authority_runtime_semantic_manifest_hash_contract'); sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r54, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R54-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
const declaredNames = new Set(r54.authority_operation_schema_declared_semantic_field_registry.exact_rows.map(row => row.field_name)), refRows = [], seenRefs = new Set()
function walkRefs(value, source, path = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`, inspect = Array.isArray(child) ? child : [child]
    inspect.forEach((literal, index) => {
      if (typeof literal !== 'string') return
      const target = literal !== 'UNAVAILABLE' && get(r54, literal) !== undefined ? literal : 'UNAVAILABLE'
      if (target === 'UNAVAILABLE' && !declaredNames.has(key)) return
      const fieldPath = Array.isArray(child) ? `${next}.${index}` : next, id = `${source}|${fieldPath}|${literal}`
      if (seenRefs.has(id)) return
      seenRefs.add(id); refRows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: target !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: target, exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(r54, target)?.schema_version ?? 'NESTED_VALUE', reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference' })
    })
    walkRefs(child, source, next)
  }
}
for (const path of sourcePaths) walkRefs(get(r54, path), path)
refRows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
r54.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r54.v1', source_snapshot_sha256: snapshotSha, exact_source_paths: sourcePaths, schema_declared_field_registry_ref: 'authority_operation_schema_declared_semantic_field_registry', exact_occurrence_rows: refRows, exact_expected_occurrence_count: refRows.length, exact_path_value_resolution_count: refRows.filter(row => row.match_kind === 'exhaustive_exact_path_value_resolution').length, schema_or_pinned_field_occurrence_count: refRows.filter(row => row.match_kind === 'schema_declared_or_independently_pinned_semantic_field').length, required_named_field_occurrence_counts: Object.fromEntries(['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'].map(field => [field, refRows.filter(row => row.field_name === field).length])), suffix_name_only_inference: 'forbidden', unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write' }
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(row => row.source_authority_path === path && sourcePaths.includes(row.exact_target_path_or_UNAVAILABLE) && row.exact_target_path_or_UNAVAILABLE !== path).map(row => row.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r54.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r54.v1', source_snapshot_sha256: snapshotSha, exact_row_count: refRows.length, reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', schema_declared_and_exact_path_value_bijection: true }
r54.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r54.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })), reference_registry_ref: 'authority_runtime_semantic_reference_field_registry' }
const hc = r54.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r54, path)) })]))
function transitive(path) { const seen = new Set(), visit = item => { for (const dep of dependencies[item] ?? []) if (!seen.has(dep)) { seen.add(dep); visit(dep) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = sourcePaths.map(path => { const direct = dependencies[path].map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })), all = transitive(path).map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })); return { authority_path: path, authority_schema_version: get(r54, path)?.schema_version ?? 'UNVERSIONED', exact_keyset: Object.keys(get(r54, path) ?? {}).sort(cp), authority_content_sha256: contentHashes[path], direct_dependency_paths: dependencies[path], direct_dependency_content_hashes: direct, direct_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }) } })
const withoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r54.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: manifestRows, exact_expected_count: manifestRows.length, manifest_graph_sha256: hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifestRows }) }
r54.authority_runtime_semantic_manifest = { ...withoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r54)
export const materializedR54 = r54
export const materializedR54Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r54SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR54Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR54Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R54 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
