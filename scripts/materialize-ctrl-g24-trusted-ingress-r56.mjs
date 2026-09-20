import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR53 } from './materialize-ctrl-g24-trusted-ingress-r53.mjs'
import { materializedR55 as materializedR54, materializedR55Output as materializedR54Output, r55SemanticAuthorityPaths as r54SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r55.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r55.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r56.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR54Output) throw new Error('R56_frozen_R55_input_mismatch')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }
const r54 = structuredClone(materializedR54)
const schemaAt = (ref, variant = 'UNAVAILABLE') => { const schema = get(r54, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }

r54.schema_version = 'ctrl.g24.trusted-ingress.r56.effective.v1'
r54.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r55_vetoed', 'trusted_ingress_r56_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r54.supersedes = { commit: 'aeddd13d8dc64f90f8aa97dd878ae5d562596a47', tree: '1fc179fd5c81e99a441dbda91261035c78c5d680', human_blob: 'd8aa9580194348181f9121e1548927b07ba9e9f2', machine_blob: 'f26d62d636298c317581535775cb1589e2524b8d', qa_blob: 'e64d20651024cb3e87b2a3d6543f7e5389a80018', checker_blob: 'c8e5ef71796ae188d413c4aab58a0ae87477af02', materializer_blob: 'a0cd3f0388b4f5c60f904a9f00abc27001d5ac48', founder_checker_blob: 'a5aa2beb016cd3618d80be35522da671ac129fee', adjudication: 'veto' }
r54.materialization = { ...r54.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r56.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['freeze_R55_input', 'complete_recursive_schema_interpreter', 'derive_authoritative_enum_values', 'build_complete_joint_equality_fixtures', 'bind_all_declared_companions_to_one_target', 'derive_exact_source_selector_dimensions', 'resolve_native_identity_without_fallback', 'finalize_nonderived_authorities', 'snapshot_final_semantic_sources', 'derive_reference_owner_and_manifest', 'seal_output'], no_post_snapshot_source_write: true }

function values(spec) {
  if (!spec) return []
  if (Object.hasOwn(spec, 'const')) return [spec.const]
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal') return [spec.literal]
  if (spec.enum_ref) {
    const resolved = get(r54, spec.enum_ref)
    if (!Array.isArray(resolved) || !resolved.length) throw new Error(`R56_enum_ref_missing_or_empty:${spec.enum_ref}`)
    return resolved
  }
  return spec.values ?? spec.enum ?? []
}
function effectiveSpec(spec) { const base = spec?.type && r54.base_types?.[spec.type]; return base && typeof base === 'object' ? { ...base, ...spec } : spec }
function referencedSpec(spec) {
  if (spec?.type === 'nullable') return null
  const ref = spec?.schema_ref
  if (!ref) return null
  const resolved = get(r54, ref)
  if (!resolved) throw new Error(`R56_schema_ref_missing:${ref}`)
  return resolved
}
function chooseVariant(schema, context = {}) {
  if (!schema?.variants) return { schema, variant: 'UNAVAILABLE' }
  const matches = Object.entries(schema.variants).filter(([, candidate]) => Object.entries(candidate.properties ?? {}).every(([field, spec]) => {
    const allowed = values(spec)
    return !Object.hasOwn(context, field) || !allowed.length || allowed.includes(context[field])
  }))
  const [variant, selected] = (matches.length ? matches : Object.entries(schema.variants)).sort((a, b) => cp(a[0], b[0]))[0]
  return { schema: selected, variant }
}
function valueForSpec(spec, seed, context = {}) {
  if (!spec || typeof spec !== 'object') return `r56_${seed}`
  spec = effectiveSpec(spec)
  if (spec.type === 'nullable') return null
  const resolved = referencedSpec(spec)
  if (resolved) { const selected = chooseVariant(resolved, context); return selected.schema?.properties ? schemaPayload(selected.schema, `${seed}_${selected.variant}`, context) : valueForSpec(selected.schema, `${seed}_${selected.variant}`, context) }
  if (Object.hasOwn(spec, 'const')) return spec.const
  if (Object.hasOwn(spec, 'literal')) return spec.literal
  const literals = values(spec)
  if (literals.length) return literals[0]
  const pattern = spec.pattern ?? spec.regex
  if (pattern === '^[0-9a-f]{64}$') return sha(`R56:${seed}`)
  if (pattern === '^[0-9a-f]{32}$') return sha(`R56:${seed}`).slice(0, 32)
  if (spec.type === 'sha256') return sha(`R56:${seed}`)
  if (spec.type === 'sha256_or_exact_literal') return (spec.exact_literals ?? [])[0] ?? sha(`R56:${seed}`)
  if (spec.type === 'canonical_timestamp') return '2031-01-01T00:00:00.000Z'
  if (spec.type === 'base64url_without_padding') return Buffer.from(`R56:${seed}`, 'utf8').toString('base64url')
  if (spec.type === 'boolean') return false
  if (['integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return Math.max(0, spec.minimum ?? 0)
  if (spec.type === 'positive_integer') return Math.max(1, spec.minimum ?? 1)
  if (spec.type === 'array') {
    const count = Math.max(0, spec.min_items ?? 0), result = []
    for (let index = 0; index < count; index += 1) result.push(valueForSpec(spec.items ?? { type: 'identifier' }, `${seed}_${index}`, context))
    if (spec.allowed_route_values && result.length) for (let index = 0; index < result.length; index += 1) if (result[index] && typeof result[index] === 'object' && Object.hasOwn(result[index], 'route')) result[index].route = spec.allowed_route_values[index % spec.allowed_route_values.length]
    return result
  }
  if (spec.type === 'object' || spec.properties) return schemaPayload(spec, seed, context)
  const minimum = Math.max(1, spec.min_utf8_bytes ?? 1), maximum = spec.max_utf8_bytes ?? spec.max_bytes ?? 256
  return `r56_${String(seed).replace(/[^a-z0-9_]/gi, '_').slice(-96)}`.padEnd(minimum, 'x').slice(0, maximum)
}
function schemaPayload(schema, seed, context = {}) {
  const payload = {}
  for (const [field, spec] of Object.entries(schema.properties ?? {})) payload[field] = Object.hasOwn(context, field) && (!values(spec).length || values(spec).includes(context[field])) ? context[field] : valueForSpec(spec, `${seed}_${field}`, context)
  return payload
}
function validateSpec(spec, value, path, context = {}) {
  spec = effectiveSpec(spec)
  if (spec.type === 'nullable') {
    if (value === null) return
    if (!spec.value_schema) throw new Error(`R56_nullable_schema_missing:${path}`)
    validateSpec(spec.value_schema, value, `${path}<nonnull>`, context)
    return
  }
  const resolved = referencedSpec(spec)
  if (resolved) { const selected = chooseVariant(resolved, value && typeof value === 'object' ? value : context); if (selected.schema?.properties) validateSchema(selected.schema, value, `${path}<${selected.variant}>`, context); else validateSpec(selected.schema, value, `${path}<${selected.variant}>`, context); return }
  if (Object.hasOwn(spec, 'const') && value !== spec.const) throw new Error(`R56_const:${path}`)
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal' && value !== spec.literal) throw new Error(`R56_literal:${path}`)
  const allowed = values(spec)
  if (allowed.length && !allowed.includes(value)) throw new Error(`R56_enum:${path}`)
  if (spec.type === 'sha256' && !(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value))) throw new Error(`R56_sha256:${path}`)
  if (spec.type === 'sha256_or_exact_literal' && !(typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || [spec.literal, spec.const, ...(spec.exact_literals ?? [])].filter(item => item !== undefined).includes(value)))) throw new Error(`R56_sha256_or_literal:${path}`)
  if (['identifier', 'human_text', 'literal'].includes(spec.type) && typeof value !== 'string') throw new Error(`R56_string:${path}`)
  if (spec.type === 'identifier' && (value !== value.trim() || value.normalize('NFC') !== value || /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(value))) throw new Error(`R56_identifier_normalization:${path}`)
  if (spec.type === 'canonical_timestamp' && !(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)))) throw new Error(`R56_time:${path}`)
  if (spec.type === 'base64url_without_padding' && !(typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && !value.includes('=') && value.length % 4 !== 1 && Buffer.from(value, 'base64url').toString('base64url') === value)) throw new Error(`R56_base64url:${path}`)
  if (spec.type === 'boolean' && typeof value !== 'boolean') throw new Error(`R56_boolean:${path}`)
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec.type) && !(Number.isSafeInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0))) throw new Error(`R56_integer:${path}`)
  if (spec.type === 'finite_nonnegative_number' && !(Number.isFinite(value) && value >= 0 && !Object.is(value, -0))) throw new Error(`R56_number:${path}`)
  if (spec.minimum !== undefined && value < spec.minimum) throw new Error(`R56_minimum:${path}`)
  if (spec.maximum !== undefined && value > spec.maximum) throw new Error(`R56_maximum:${path}`)
  if (spec.type === 'array') {
    if (!Array.isArray(value)) throw new Error(`R56_array:${path}`)
    if (spec.min_items !== undefined && value.length < spec.min_items) throw new Error(`R56_min_items:${path}`)
    if (spec.max_items !== undefined && value.length > spec.max_items) throw new Error(`R56_max_items:${path}`)
    value.forEach((item, index) => validateSpec(spec.items ?? { type: 'identifier' }, item, `${path}.${index}`, context))
    if (spec.unique && new Set(value.map(item => canonicalR44(item))).size !== value.length) throw new Error(`R56_unique:${path}`)
    if (spec.unique_by && new Set(value.map(item => item?.[spec.unique_by])).size !== value.length) throw new Error(`R56_unique_by:${path}`)
    if (spec.allowed_route_values && value.some(item => !spec.allowed_route_values.includes(item?.route))) throw new Error(`R56_route:${path}`)
  }
  if ((spec.type === 'object' || spec.properties) && (value === null || typeof value !== 'object' || Array.isArray(value))) throw new Error(`R56_object:${path}`)
  if (spec.type === 'object' || spec.properties) validateSchema(spec, value, path, context)
  if (typeof value === 'string') {
    const bytes = Buffer.byteLength(value, 'utf8')
    if (spec.min_utf8_bytes !== undefined && bytes < spec.min_utf8_bytes) throw new Error(`R56_min_utf8_bytes:${path}`)
    if ((spec.max_utf8_bytes ?? spec.max_bytes) !== undefined && bytes > (spec.max_utf8_bytes ?? spec.max_bytes)) throw new Error(`R56_max_utf8_bytes:${path}`)
    const pattern = spec.pattern ?? spec.regex
    if (pattern && !new RegExp(pattern, 'u').test(value)) throw new Error(`R56_pattern:${path}`)
    if (spec.max_decoded_bytes !== undefined && (!(typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && value.length % 4 !== 1 && Buffer.from(value, 'base64url').toString('base64url') === value) || Buffer.from(value, 'base64url').length > spec.max_decoded_bytes)) throw new Error(`R56_max_decoded_bytes:${path}`)
  }
}
function validateSchema(schema, payload, path, context = {}) {
  if (!schema?.properties || payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw new Error(`R56_schema_object:${path}`)
  const actual = Object.keys(payload).sort(cp), allowed = (schema.exact_keys ?? Object.keys(schema.properties)).sort(cp)
  if (schema.additional_properties === false && canonicalR44(actual) !== canonicalR44(allowed)) throw new Error(`R56_exact_keys:${path}`)
  for (const field of schema.required ?? []) if (!Object.hasOwn(payload, field)) throw new Error(`R56_required:${path}.${field}`)
  for (const [field, spec] of Object.entries(schema.properties)) if (Object.hasOwn(payload, field)) validateSpec(spec, payload[field], `${path}.${field}`, context)
  if (schema.max_canonical_bytes !== undefined && Buffer.byteLength(canonicalR44(payload), 'utf8') > schema.max_canonical_bytes) throw new Error(`R56_max_canonical_bytes:${path}`)
  if (schema.max_bytes !== undefined && Buffer.byteLength(canonicalR44(payload), 'utf8') > schema.max_bytes) throw new Error(`R56_row_max_bytes:${path}`)
  for (const [field, value] of Object.entries(payload)) {
    if (field.endsWith('_length') && Object.hasOwn(payload, field.replace(/_length$/, '_b64url'))) {
      const raw = Buffer.from(payload[field.replace(/_length$/, '_b64url')], 'base64url'); if (value !== raw.length) throw new Error(`R56_length_equality:${path}.${field}`)
    }
  }
  for (const rule of schema.conditional_rules ?? []) {
    if (typeof rule !== 'string' || !rule.length) throw new Error(`R56_conditional_rule_not_closed:${path}`)
    if (rule.startsWith('result_ref_is_nonnull_iff_operation_class_is_use_release') && Object.hasOwn(payload, 'result_ref') && Object.hasOwn(payload, 'operation_class') && ((payload.result_ref !== null) !== (payload.operation_class === 'use_release'))) throw new Error(`R56_conditional_iff:${path}`)
  }
}
function fingerprint(schema, payload) {
  if (!schema.fingerprint_field || !schema.fingerprint_ref) return null
  const authority = get(r54, schema.fingerprint_ref)
  if (!authority?.domain_ascii || !Array.isArray(authority.preimage_order)) throw new Error(`R54_fingerprint_authority_missing:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of authority.preimage_order) {
    if (field === 'domain_ascii') preimage[field] = authority.domain_ascii
    else if (Object.hasOwn(payload, field)) preimage[field] = payload[field]
    else throw new Error(`R56_fingerprint_operand_missing:${schema.fingerprint_ref}:${field}`)
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
function nativeContentRule(schema) {
  if (schema.content_address_rule) return schema.content_address_rule
  if (schema.properties?.artifact_ref && schema.properties?.canonical_bytes_b64url && schema.properties?.canonical_bytes_sha256) return 'artifact_ref_equals_canonical_bytes_sha256'
  if (schema.properties?.artifact_ref && schema.properties?.opaque_bytes_b64url && schema.properties?.opaque_bytes_sha256) return 'artifact_ref_equals_opaque_bytes_sha256'
  return null
}
function finalizeRow(schemaRef, variant, seed, context = {}) {
  const schema = schemaAt(schemaRef, variant)
  if (!schema?.properties) throw new Error(`R56_fixture_schema_missing:${schemaRef}:${variant}`)
  const payload = schemaPayload(schema, seed, context)
  let selectedPayload = null
  let selectedPayloadSchemaRef = null
  let selectedPayloadSchemaVariant = 'UNAVAILABLE'
  let declaredContentAddress = null
  const rule = nativeContentRule(schema)
  if (rule === 'artifact_ref_equals_opaque_bytes_sha256') {
    const bytes = Buffer.from(`R56-OPAQUE:${seed}`, 'utf8'), digest = sha(bytes)
    payload.opaque_bytes_b64url = bytes.toString('base64url'); payload.opaque_bytes_length = bytes.length; payload.opaque_bytes_sha256 = digest; payload.artifact_ref = digest
    declaredContentAddress = { authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', rule, exact_operand_name: 'opaque_bytes', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest, equal_fields: ['artifact_ref', 'opaque_bytes_sha256'] }
  } else if (rule === 'artifact_ref_equals_canonical_bytes_sha256') {
    selectedPayloadSchemaRef = schema.properties.canonical_schema_ref?.const
    let selectedSchema = get(r54, selectedPayloadSchemaRef)
    if (!selectedSchema?.properties && selectedSchema?.variants) { selectedPayloadSchemaVariant = context.__payload_variant && selectedSchema.variants[context.__payload_variant] ? context.__payload_variant : chooseVariant(selectedSchema, context).variant; selectedSchema = selectedSchema.variants[selectedPayloadSchemaVariant] }
    if (!selectedSchema?.properties) throw new Error(`R56_canonical_payload_schema_missing:${selectedPayloadSchemaRef}`)
    selectedPayload = schemaPayload(selectedSchema, `${seed}_selected_payload`, context)
    const selectedFingerprint = fingerprint(selectedSchema, selectedPayload)
    const bytes = Buffer.from(canonicalR44(selectedPayload), 'utf8'), digest = sha(bytes)
    payload.canonical_bytes_b64url = bytes.toString('base64url'); payload.canonical_bytes_length = bytes.length; payload.canonical_bytes_sha256 = digest; payload.artifact_ref = digest
    payload.parsed_content_fingerprint = selectedFingerprint?.expected_fingerprint ?? hash({ domain_ascii: 'CTRL-G24-R56-PARSED-CONTENT', canonical_bytes_sha256: digest })
    declaredContentAddress = { authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', rule, selected_payload_schema_ref: selectedPayloadSchemaRef, selected_payload_schema_variant: selectedPayloadSchemaVariant, selected_payload: selectedPayload, exact_operand_name: 'canonical_payload_bytes_utf8', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest, equal_fields: ['artifact_ref', 'canonical_bytes_sha256'] }
  }
  const rowVersion = Object.hasOwn(payload, 'row_version_ref') ? committedVersion(schemaRef, schema, payload) : null
  let rowRef = null
  if (schema.row_ref_derivation && Array.isArray(schema.row_ref_preimage_included_fields)) {
    const preimage = { domain_ascii: schema.row_ref_domain_ascii }
    for (const field of schema.row_ref_preimage_included_fields) preimage[field] = payload[field]
    const expected = hash(preimage), preferredField = schema.row_ref_derivation.startsWith('hold_row_ref_') ? 'hold_row_ref' : schema.row_ref_derivation.startsWith('registry_row_ref_') ? 'registry_row_ref' : null
    const field = preferredField ?? Object.keys(schema.properties).find(name => schema.row_ref_preimage_excluded_fields?.includes(name) && name.endsWith('_ref'))
    if (!field) throw new Error(`R56_row_ref_field_missing:${schemaRef}:${variant}`)
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
  validateSchema(schema, payload, `${schemaRef}:${variant}`, context)
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
  validateSchema(schema, fixture.payload, `${fixture.schema_ref}:${fixture.schema_variant}`, fixture.context ?? {})
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
  return { schema_ref: fixture.schema_ref, schema_variant: fixture.schema_variant, schema_version: fixture.schema_version, context: fixture.context ?? {}, canonical_row_bytes_b64url: fixture.canonical_row_bytes_b64url, canonical_row_bytes_sha256: fixture.canonical_row_bytes_sha256, declared_content_address: compactDerivation(fixture.declared_content_address), row_version: fixture.row_version, row_ref: fixture.row_ref, nonce_receipt: compactDerivation(fixture.nonce_receipt), fingerprint: fixture.fingerprint }
}

const persistence = r54.authority_operation_normative_persistence_registry.exact_rows
const priorIndex = materializedR53.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
const priorEqualities = r54.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows
const uniqueMemberships = (schema, field) => (schema.unique_keys ?? []).filter(key => (Array.isArray(key) ? key : [key]).includes(field))
const nativeUniqueMemberships = (prior, schema) => uniq([...uniqueMemberships(schema, prior.identity_field), ...uniqueMemberships(get(r54, prior.store_path) ?? {}, prior.identity_field)])
const syntheticSelectorRows = {}
function equalityFor(row, role) {
  return priorEqualities.find(item => item.source_schema_ref === row.row_schema_ref && item.source_schema_variant === row.row_schema_variant && (
    role === 'resolved_reference_identity' ? item.source_field === row.identity_field :
    role === 'companion_bytes_hash' ? item.companion_bytes_fields?.some(field => field.field === row.identity_field) :
    item.companion_fingerprint_fields?.some(field => field.field === row.identity_field)
  ))
}
const ROLE_PRECEDENCE = ['schema_declared_fingerprint', 'declared_row_version', 'declared_content_address', 'unique_key_component', 'resolved_reference_identity', 'companion_bytes_hash', 'companion_fingerprint', 'canonical_row_bytes_content_address']
function nativeRoleSources(prior) {
  const schema = schemaAt(prior.row_schema_ref, prior.row_schema_variant), sources = []
  if (prior.identity_field === '$canonical_row_bytes') sources.push({ role: 'canonical_row_bytes_content_address', source: 'closed_schema_final_canonical_row_bytes' })
  if (schema.fingerprint_field === prior.identity_field) sources.push({ role: 'schema_declared_fingerprint', source: `fingerprint_field:${schema.fingerprint_ref}` })
  if (prior.identity_field === 'row_version_ref' && committedVersionAuthority(prior.row_schema_ref)) sources.push({ role: 'declared_row_version', source: committedVersionAuthority(prior.row_schema_ref).authority_ref })
  if (nativeContentRule(schema) && ['artifact_ref', 'canonical_bytes_sha256', 'opaque_bytes_sha256'].includes(prior.identity_field)) sources.push({ role: 'declared_content_address', source: nativeContentRule(schema) })
  const declaredRowRefField = schema.row_ref_derivation?.startsWith('hold_row_ref_') ? 'hold_row_ref' : schema.row_ref_derivation?.startsWith('registry_row_ref_') ? 'registry_row_ref' : null
  if (declaredRowRefField === prior.identity_field) sources.push({ role: 'declared_content_address', source: schema.row_ref_derivation })
  if (prior.identity_field === 'nonce_receipt_ref' && schema.nonce_receipt_ref_content_address_rule) sources.push({ role: 'declared_content_address', source: schema.nonce_receipt_ref_content_address_rule })
  if (equalityFor(prior, 'resolved_reference_identity')) sources.push({ role: 'resolved_reference_identity', source: 'typed_exact_one_source_reference' })
  if (equalityFor(prior, 'companion_bytes_hash')) sources.push({ role: 'companion_bytes_hash', source: 'typed_exact_one_companion_bytes' })
  if (equalityFor(prior, 'companion_fingerprint')) sources.push({ role: 'companion_fingerprint', source: 'typed_exact_one_companion_fingerprint' })
  if (nativeUniqueMemberships(prior, schema).length) sources.push({ role: 'unique_key_component', source: 'closed_schema_or_store_unique_keys' })
  return sources.sort((a, b) => ROLE_PRECEDENCE.indexOf(a.role) - ROLE_PRECEDENCE.indexOf(b.role))
}
function committedVersionAuthority(schemaRef) {
  const store = schemaRef.split('.').at(-1), value = r54.authority_operation_committed_target_identity_authority.variants?.[store]
  return value?.row_schema_ref === schemaRef ? { authority_ref: `authority_operation_committed_target_identity_authority.variants.${store}`, value } : null
}
function projectedContext(schema, context, strict = true) {
  const out = {}
  const mappings = { operation_name: 'source_operation', result_branch: 'source_result_branch', hold_branch: 'source_result_branch', branch: 'source_result_branch', proof_family: 'proof_family', branch_class: 'branch_class', evidence_kind: 'evidence_kind', target_store: 'target_store', fresh_selection_row_id: 'fresh_selection_row_id' }
  for (const [field, dimension] of Object.entries(mappings)) if (schema.properties?.[field] && Object.hasOwn(context, dimension)) {
    const allowed = values(schema.properties[field])
    if (allowed.length && !allowed.includes(context[dimension])) { if (strict) throw new Error(`R56_selector_dimension_not_accepted:${field}:${context[dimension]}`); continue }
    out[field] = context[dimension]
  }
  return out
}
function syntheticSelector(row, role) {
  const sourceSchema = schemaAt(row.row_schema_ref, row.row_schema_variant), probe = schemaPayload(sourceSchema, `synthetic_${row.identity_field}`), context = { source_operation: probe.operation_name ?? 'UNAVAILABLE', source_result_branch: probe.result_branch ?? probe.hold_branch ?? probe.branch ?? 'UNAVAILABLE', proof_family: probe.proof_family ?? 'UNAVAILABLE', branch_class: probe.branch_class ?? 'UNAVAILABLE', evidence_kind: probe.evidence_kind ?? 'UNAVAILABLE', target_store: probe.target_store ?? 'UNAVAILABLE', source_store_variant: row.row_schema_variant, fresh_selection_row_id: probe.fresh_selection_row_id ?? 'UNAVAILABLE' }
  let target
  if (row.identity_field.includes('account_binding')) target = { target_schema_ref: 'authoritative_row_schemas.account_stable_actor_bindings', target_schema_variant: 'UNAVAILABLE', target_native_identity_field: 'binding_ref', target_native_identity_role: 'resolved_reference_identity' }
  else if (row.identity_field.includes('account_standing')) target = { target_schema_ref: 'authoritative_row_schemas.account_access_standings', target_schema_variant: 'UNAVAILABLE', target_native_identity_field: 'standing_ref', target_native_identity_role: 'resolved_reference_identity' }
  else target = { target_schema_ref: 'session_hold_evidence_schema', target_schema_variant: 'verified_consuming', target_native_identity_field: 'payload_content_address', target_native_identity_role: 'resolved_reference_identity' }
  const selectorId = `selector_r56_${row.identity_field}`, selectorRef = `authority_operation_joint_identity_selector_contexts.rows.${selectorId}`
  syntheticSelectorRows[selectorId] = { schema_version: 'ctrl.g24.joint-identity-selector-context.r56.v1', selector_id: selectorId, source_schema_ref: row.row_schema_ref, source_schema_variant: row.row_schema_variant, source_schema_version: sourceSchema.schema_version, source_field: row.identity_field, native_identity_role: role, exact_source_schema_valid_context: context, exact_target_case: target, exact_case_count: 1, every_applicable_dimension_equals_generated_source_fixture: true, reduced_projection_or_UNAVAILABLE_for_present_source_field: 'forbidden', caller_override_or_fallback: 'forbidden' }
  return { selector_ref: selectorRef, context, target }
}
function selectorChoice(row, role) {
  const equality = equalityFor(row, role)
  if (!equality) throw new Error(`R56_equality_missing:${row.identity_kind}:${role}`)
  if (!equality.selector_ref || equality.selector_ref === 'UNAVAILABLE') return syntheticSelector(row, role)
  const selector = get(r54, equality.selector_ref)
  if (!selector) throw new Error(`R56_selector_missing:${equality.selector_ref}`)
  const pairs = selector.exact_source_schema_valid_cases.map((context, index) => ({ context, target: selector.exact_concrete_cases[index] })).filter(pair => pair.target && pair.context).sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
  if (!pairs.length) throw new Error(`R56_selector_context_missing:${row.identity_kind}`)
  const selected = pairs[0], sourceSchema = schemaAt(row.row_schema_ref, row.row_schema_variant), context = { ...selected.context }
  const mappings = { source_operation: ['operation_name'], source_result_branch: ['result_branch', 'hold_branch', 'branch'], proof_family: ['proof_family'], branch_class: ['branch_class'], evidence_kind: ['evidence_kind'], target_store: ['target_store'], fresh_selection_row_id: ['fresh_selection_row_id'] }
  for (const [dimension, fields] of Object.entries(mappings)) {
    const field = fields.find(name => sourceSchema.properties?.[name]); if (!field) continue
    const allowed = values(sourceSchema.properties[field]); if (allowed.length && !allowed.includes(context[dimension])) context[dimension] = allowed[0]
  }
  return { selector_ref: equality.selector_ref, context, target: { ...selected.target, ...context } }
}
function persistedWrapperFor(targetRef) {
  const baseRef = targetRef.includes('.variants.') ? targetRef.split('.variants.')[0] : targetRef
  const rows = persistence.filter(item => [targetRef, baseRef].includes(schemaAt(item.row_schema_ref, item.row_schema_variant)?.properties?.canonical_schema_ref?.const)), canonical = rows.filter(item => item.persistence_group === 'canonical_artifact_family_store')
  const selected = canonical.length === 1 ? canonical : rows
  if (selected.length !== 1) throw new Error(`R56_wrapper_resolution_not_exact_one:${targetRef}:${selected.length}`)
  return selected[0]
}
function concreteTarget(selected) {
  const target = { ...selected }, exactRef = target.target_schema_variant && target.target_schema_variant !== 'UNAVAILABLE' && get(r54, `${target.target_schema_ref}.variants.${target.target_schema_variant}`) ? `${target.target_schema_ref}.variants.${target.target_schema_variant}` : target.target_schema_ref
  if (['payload_content_address', 'payload_or_authority_row_content_address'].includes(target.target_native_identity_field)) {
    const store = persistedWrapperFor(exactRef)
    target.payload_schema_ref = exactRef; target.payload_schema_variant = target.target_schema_variant; target.target_schema_ref = store.row_schema_ref; target.target_schema_variant = store.row_schema_variant; target.target_native_identity_field = 'artifact_ref'; target.target_native_identity_role = 'declared_content_address'
  } else if (target.target_native_identity_field === 'authority_row_content_address') {
    target.target_native_identity_field = '$canonical_row_bytes'; target.target_native_identity_role = 'canonical_row_bytes_content_address'
  }
  if ((target.target_schema_variant ?? 'UNAVAILABLE') === 'UNAVAILABLE' && !get(r54, target.target_schema_ref)?.properties && get(r54, target.target_schema_ref)?.variants) target.target_schema_variant = Object.keys(get(r54, target.target_schema_ref).variants).sort(cp)[0]
  const schema = schemaAt(target.target_schema_ref, target.target_schema_variant ?? 'UNAVAILABLE')
  if (!schema?.properties) throw new Error(`R56_target_schema_missing:${target.target_schema_ref}:${target.target_schema_variant}`)
  if (target.target_native_identity_field !== '$canonical_row_bytes' && !schema.properties[target.target_native_identity_field]) throw new Error(`R56_target_identity_field_missing:${target.target_schema_ref}:${target.target_native_identity_field}`)
  return target
}
function targetIdentity(fixture, target) {
  if (target.target_native_identity_field === '$canonical_row_bytes') return fixture.canonical_row_bytes_sha256
  const value = fixture.payload[target.target_native_identity_field]
  if (value === undefined) throw new Error(`R56_target_native_identity_missing:${target.target_schema_ref}:${target.target_native_identity_field}`)
  return value
}
const completeJointCache = new Map(), completeJointRows = {}
function jointLinkedFixture(row, role, seed) {
  const choice = selectorChoice(row, role), target = concreteTarget(choice.target), targetSchema = schemaAt(target.target_schema_ref, target.target_schema_variant ?? 'UNAVAILABLE')
  const equality = equalityFor(row, role), cacheKey = canonicalR44({ source_schema_ref: row.row_schema_ref, source_schema_variant: row.row_schema_variant, source_field: equality.source_field, selector_ref: choice.selector_ref, selector_context: choice.context, target })
  const specialize = value => { const copy = structuredClone(value), targetPayload = JSON.parse(Buffer.from(copy.target_fixture.canonical_row_bytes_b64url, 'base64url').toString('utf8')); if (role === 'companion_bytes_hash' && targetPayload[row.identity_field] !== undefined) copy.target_native_bytes_sha256 = targetPayload[row.identity_field]; if (role === 'companion_fingerprint' && targetPayload[row.identity_field] !== undefined) copy.target_native_fingerprint = targetPayload[row.identity_field]; return copy }
  if (completeJointCache.has(cacheKey)) return specialize(completeJointCache.get(cacheKey))
  const targetFixture = finalizeRow(target.target_schema_ref, target.target_schema_variant ?? 'UNAVAILABLE', `${seed}_target`, { ...projectedContext(targetSchema, choice.context, false), __payload_variant: target.payload_schema_variant })
  const identity = targetIdentity(targetFixture, target)
  const selectedPayload = targetFixture.selected_payload, selectedPayloadSchema = targetFixture.selected_payload_schema_ref ? (targetFixture.selected_payload_schema_variant === 'UNAVAILABLE' ? get(r54, targetFixture.selected_payload_schema_ref) : get(r54, targetFixture.selected_payload_schema_ref)?.variants?.[targetFixture.selected_payload_schema_variant]) : null
  const defaultBytesSha = selectedPayload ? sha(Buffer.from(canonicalR44(selectedPayload), 'utf8')) : targetFixture.canonical_row_bytes_sha256
  const defaultFingerprint = selectedPayloadSchema?.fingerprint_field ? selectedPayload[selectedPayloadSchema.fingerprint_field] : targetFixture.fingerprint?.expected_fingerprint ?? identity
  if (identity === undefined || defaultFingerprint === undefined) throw new Error(`R56_missing_target_identity_or_fingerprint:${row.identity_kind}`)
  const sourceSchema = schemaAt(row.row_schema_ref, row.row_schema_variant), sameNativeRow = row.row_schema_ref === target.target_schema_ref && (row.row_schema_variant ?? 'UNAVAILABLE') === (target.target_schema_variant ?? 'UNAVAILABLE')
  const source = sameNativeRow ? structuredClone(targetFixture) : finalizeRow(row.row_schema_ref, row.row_schema_variant, `${seed}_source`, projectedContext(sourceSchema, choice.context))
  source.context = choice.context
  const companionBytesFields = [...(equality.companion_bytes_fields ?? [])]
  const companionFingerprintFields = [...(equality.companion_fingerprint_fields ?? [])]
  source.payload[equality.source_field] = identity
  for (const field of companionBytesFields) source.payload[field.field] = targetFixture.payload[field.field] ?? defaultBytesSha
  for (const field of companionFingerprintFields) source.payload[field.field] = targetFixture.payload[field.field] ?? defaultFingerprint
  refreshFixture(source)
  validateSchema(sourceSchema, source.payload, `${row.row_schema_ref}:${row.row_schema_variant}`, projectedContext(sourceSchema, choice.context))
  const completeId = `complete_joint_${String(Object.keys(completeJointRows).length + 1).padStart(4, '0')}`
  const result = { complete_joint_fixture_ref: `authority_operation_complete_joint_equality_fixtures.rows.${completeId}`, selector_ref: choice.selector_ref, deterministic_context_selection: 'unicode_canonical_lowest_source_context_and_target_pair_after_exact_schema_intersection', selector_context: choice.context, projected_source_discriminators: projectedContext(sourceSchema, choice.context), target_schema_ref: target.target_schema_ref, target_schema_variant: target.target_schema_variant ?? 'UNAVAILABLE', target_schema_version: targetSchema.schema_version, target_identity_field: target.target_native_identity_field, target_identity_role: target.target_native_identity_role, target_fixture: compactFixture(targetFixture), target_native_identity: identity, target_native_bytes_sha256: defaultBytesSha, target_native_fingerprint: defaultFingerprint, source_reference_field: equality.source_field, companion_bytes_fields: companionBytesFields, companion_fingerprint_fields: companionFingerprintFields, source_fixture: compactFixture(source), exact_joint_equalities: { source_reference_equals_target_identity: source.payload[equality.source_field] === identity, source_companion_bytes_equal_target_bytes: companionBytesFields.length === 0 || companionBytesFields.every(field => source.payload[field.field] === (targetFixture.payload[field.field] ?? defaultBytesSha)), source_companion_fingerprints_equal_target_fingerprint: companionFingerprintFields.length === 0 || companionFingerprintFields.every(field => source.payload[field.field] === (targetFixture.payload[field.field] ?? defaultFingerprint)), empty_companion_arrays_allowed_only_when_declaration_empty: true } }
  const exactSourceDimensions = { source_operation: source.payload.operation_name ?? 'UNAVAILABLE', source_result_branch: source.payload.result_branch ?? source.payload.hold_branch ?? source.payload.branch ?? 'UNAVAILABLE', proof_family: source.payload.proof_family ?? 'UNAVAILABLE', branch_class: source.payload.branch_class ?? 'UNAVAILABLE', evidence_kind: source.payload.evidence_kind ?? 'UNAVAILABLE', target_store: source.payload.target_store ?? 'UNAVAILABLE', source_store_variant: row.row_schema_variant, fresh_selection_row_id: source.payload.fresh_selection_row_id ?? 'UNAVAILABLE' }
  completeJointRows[completeId] = { schema_version: 'ctrl.g24.complete-joint-equality-fixture.r56.v1', equality_source_schema_ref: equality.source_schema_ref, equality_source_schema_variant: equality.source_schema_variant, equality_source_field: equality.source_field, equality_selector_ref: equality.selector_ref, exact_selector_context: exactSourceDimensions, selected_selector_context: choice.context, target_schema_ref: result.target_schema_ref, target_schema_variant: result.target_schema_variant, target_identity_field: result.target_identity_field, target_fixture: result.target_fixture, source_fixture: result.source_fixture, target_native_identity: identity, target_native_bytes_sha256: defaultBytesSha, target_native_fingerprint: defaultFingerprint, declared_companion_bytes_fields: companionBytesFields, declared_companion_fingerprint_fields: companionFingerprintFields, declared_companion_bytes_count: companionBytesFields.length, declared_companion_fingerprint_count: companionFingerprintFields.length, exact_joint_equalities: result.exact_joint_equalities, every_applicable_selector_dimension_must_equal_source_fixture: true }
  completeJointCache.set(cacheKey, result)
  return specialize(result)
}

r54.authority_operation_persisted_identity_formula_library = {
  schema_version: 'ctrl.g24.persisted-identity-formula-library.r56.v1',
  role_precedence: ROLE_PRECEDENCE,
  canonical_row_bytes_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.canonical-row-bytes.r56.v1', formula_class: 'native_final_row_content_address', exact_formula: 'lowercase_hex_SHA256_of_exact_final_closed_schema_canonical_row_bytes' },
  declared_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-content-address.r56.v1', formula_class: 'selected_schema_native_content_address', exact_formula: 'opaque_ref_equals_opaque_bytes_sha256_or_artifact_ref_equals_canonical_payload_bytes_sha256_or_exact_declared_row_ref_preimage_or_nonce_receipt_payload_sha256' },
  declared_row_version: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-row-version.r56.v1', formula_class: 'selected_committed_target_native_row_version', exact_formula: 'selected_store_R49_domain_and_version_plus_ordered_complete_mutable_fields_excluding_row_version_and_native_fingerprint' },
  schema_declared_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.schema-fingerprint.r56.v1', formula_class: 'selected_schema_native_fingerprint', exact_formula: 'selected_fingerprint_authority_domain_order_types_and_declared_codec_over_actual_linked_row' },
  unique_key_component: { schema_version: 'ctrl.g24.persisted-identity-formula.unique-key-component.r56.v1', formula_class: 'native_schema_unique_key_component', exact_formula: 'exact_value_from_final_schema_valid_linked_row' },
  resolved_reference_identity: { schema_version: 'ctrl.g24.persisted-identity-formula.resolved-reference.r56.v1', formula_class: 'joint_source_target_native_identity', exact_formula: 'schema_valid_source_reference_equals_recomputed_identity_from_one_exact_selector_context_and_schema_valid_target_fixture' },
  companion_bytes_hash: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-bytes.r56.v1', formula_class: 'joint_source_target_native_bytes', exact_formula: 'schema_valid_source_companion_bytes_equals_selected_target_native_bytes_sha256' },
  companion_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-fingerprint.r56.v1', formula_class: 'joint_source_target_native_fingerprint', exact_formula: 'schema_valid_source_companion_equals_recomputed_selected_target_schema_native_fingerprint' },
}
const identityAuthorities = {}, identityRows = [], applicability = {}, inapplicableCandidates = [], duplicateAliases = [], seenIdentity = new Set()
for (const prior of priorIndex) {
  const sources = nativeRoleSources(prior), role = sources[0]?.role
  if (!role) { inapplicableCandidates.push({ identity_kind: prior.identity_kind, row_schema_ref: prior.row_schema_ref, row_schema_variant: prior.row_schema_variant, identity_field: prior.identity_field, disposition: 'not_applicable_because_no_native_source_proves_any_identity_role', derived_from_complete_native_source_union: true }); continue }
  const dedupe = `${prior.row_schema_ref}|${prior.row_schema_variant}|${prior.identity_field}|${role}`
  if (prior.identity_field === 'nonce' && seenIdentity.has(dedupe)) { duplicateAliases.push({ identity_kind: prior.identity_kind, canonical_identity_tuple: dedupe, disposition: 'duplicate_nonce_alias_collapsed_after_native_role_derivation' }); continue }
  seenIdentity.add(dedupe)
  const identityKind = `${prior.store_path}|${prior.row_schema_variant}|${prior.identity_field}|${role}`, key = `identity_${String(identityRows.length + 1).padStart(4, '0')}`, schema = schemaAt(prior.row_schema_ref, prior.row_schema_variant)
  let source = finalizeRow(prior.row_schema_ref, prior.row_schema_variant, key), joint = null
  let evidence, expected
  if (role === 'canonical_row_bytes_content_address') { expected = source.canonical_row_bytes_sha256; evidence = { execution: 'raw_sha256_final_canonical_row_bytes', exact_operand_b64url: source.canonical_row_bytes_b64url, expected_identity: expected } }
  else if (role === 'declared_content_address') {
    const native = source.declared_content_address ?? source.row_ref ?? source.nonce_receipt
    if (!native) throw new Error(`R56_native_content_address_missing:${identityKind}`)
    expected = source.payload[prior.identity_field] ?? native.expected_identity
    evidence = { execution: 'selected_schema_native_content_address', selected_native_derivation: native, expected_identity: expected }
  } else if (role === 'declared_row_version') {
    if (!source.row_version) throw new Error(`R56_native_row_version_missing:${identityKind}`)
    expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_row_version', selected_native_derivation: source.row_version, expected_identity: expected, row_version_self_inclusion: false }
  } else if (role === 'schema_declared_fingerprint') {
    expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_fingerprint', selected_native_derivation: source.fingerprint, expected_identity: expected }
  } else if (role === 'unique_key_component') { expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_or_store_native_unique_key', exact_unique_key_memberships: nativeUniqueMemberships(prior, schema), expected_identity: expected } }
  else {
    joint = jointLinkedFixture(prior, role, key)
    source = { ...source, ...joint.source_fixture }
    expected = role === 'resolved_reference_identity' ? joint.target_native_identity : role === 'companion_bytes_hash' ? joint.target_native_bytes_sha256 : joint.target_native_fingerprint
    evidence = { execution: `joint_${role}`, joint_source_target_fixture: joint, expected_identity: expected, duplicated_scalar_assertion_only: false, missing_target_identity_fallback: 'forbidden' }
  }
  if (evidence.selected_native_derivation) evidence.selected_native_derivation = compactDerivation(evidence.selected_native_derivation)
  const authority = { schema_version: 'ctrl.g24.persisted-native-identity-authority.r56.v1', identity_kind: identityKind, store_path: prior.store_path, row_schema_ref: prior.row_schema_ref, row_schema_variant: prior.row_schema_variant, row_schema_version: schema.schema_version, identity_field: prior.identity_field, native_identity_role: role, native_role_sources: sources, precedence_selected_role: role, selected_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${role}`, schema_valid_linked_row_fixture: joint?.source_fixture ?? compactFixture(source), executable_native_derivation_evidence: evidence, independent_round_trip_required: true }
  identityAuthorities[key] = authority
  identityRows.push({ ...prior, identity_kind: identityKind, native_identity_role: role, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: authority.schema_version })
  applicability[role] = (applicability[role] ?? 0) + 1
}
r54.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r54.authority_operation_complete_joint_equality_fixtures = { schema_version: 'ctrl.g24.complete-joint-equality-fixtures.r56.v1', exact_row_count: Object.keys(completeJointRows).length, exact_linked_identity_count: Object.keys(identityAuthorities).filter(key => identityAuthorities[key].executable_native_derivation_evidence.joint_source_target_fixture).length, rows: completeJointRows, one_shared_fixture_per_equality_selector_target_context: true, every_declared_companion_is_bound_to_the_same_target_before_per_field_evidence: true, empty_or_vacuous_companion_proof_when_declaration_is_nonempty: 'forbidden' }
const committedUseReleaseFixture = finalizeRow('operation_registry.committed_success_row_schema', 'UNAVAILABLE', 'committed_use_release', { operation_class: 'use_release', result_ref: sha('R56:committed_use_release:terminal_consumption_ref') })
r54.authority_operation_committed_use_release_schema_fixture = { schema_version: 'ctrl.g24.committed-use-release-schema-fixture.r56.v1', selected_schema_ref: 'operation_registry.committed_success_row_schema', operation_class: 'use_release', schema_valid_fixture: compactFixture(committedUseReleaseFixture), result_ref_nonnull: true, result_reference_bytes_fingerprint_lineage_remains_governed_by_complete_cross_artifact_equality_registry: true }
r54.authority_operation_joint_identity_selector_contexts = { schema_version: 'ctrl.g24.joint-identity-selector-contexts.r56.v1', exact_count: Object.keys(syntheticSelectorRows).length, rows: syntheticSelectorRows, each_linked_identity_uses_exactly_one_executable_source_schema_valid_context: true }
r54.authority_operation_native_identity_applicability_report = { schema_version: 'ctrl.g24.native-identity-applicability-report.r56.v1', exact_R53_candidate_count: priorIndex.length, exact_native_identity_total: identityRows.length, exact_not_applicable_total: inapplicableCandidates.length, exact_not_applicable_candidates: inapplicableCandidates, exact_duplicate_alias_total: duplicateAliases.length, exact_duplicate_aliases: duplicateAliases, exact_category_counts: Object.fromEntries(Object.entries(applicability).sort((a, b) => cp(a[0], b[0]))), role_derivation: 'complete_union_of_native_schema_keys_content_addresses_row_refs_versions_fingerprints_and_typed_equalities_with_explicit_precedence', six_hold_result_fields_reclassified: identityRows.filter(row => row.row_schema_ref === 'authority_operation_hold_store.row_union' && ['result_ref', 'result_bytes_sha256', 'result_fingerprint'].includes(row.identity_field)).length, proof_nonce_is_one_unique_key_identity: identityRows.filter(row => row.row_schema_ref === 'proof_nonce_ledger.row_schema' && row.identity_field === 'nonce').length, missing_role_is_not_defaulted: true }
r54.authority_operation_artifact_fingerprint_derivation_authority = { schema_version: 'ctrl.g24.authority-operation-native-identity-derivation-authority.r56.v1', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', persisted_identity_formula_library_ref: 'authority_operation_persisted_identity_formula_library', native_identity_applicability_report_ref: 'authority_operation_native_identity_applicability_report', sole_active_identity_index: identityRows, exact_identity_kind_count: identityRows.length, exact_store_shape_count: persistence.length, generic_identity_fixture_machinery: 'forbidden', complete_native_source_union_and_precedence_required: true, schema_valid_joint_source_target_formula_execution_required: true, companion_requires_concrete_target_recomputation: true, derived_identity_self_inclusion_unless_normative: 'forbidden', missing_target_native_identity_or_formula: 'reject_materialization_and_hold_without_write', scalar_fingerprint_laundering: 'forbidden' }

const DIMENSION_FIELDS = { source_operation: ['operation_name'], source_result_branch: ['result_branch', 'hold_branch', 'branch'], proof_family: ['proof_family'], branch_class: ['branch_class'], evidence_kind: ['evidence_kind'], target_store: ['target_store'], fresh_selection_row_id: ['fresh_selection_row_id'] }
function specAccepts(spec, value) { const allowed = values(spec); return !allowed.length || allowed.includes(value) }
function normalizedContexts(selector) {
  const schema = schemaAt(selector.source_schema_ref, selector.source_schema_variant), rows = []
  for (let index = 0; index < selector.exact_source_schema_valid_cases.length; index += 1) {
    const old = selector.exact_source_schema_valid_cases[index], oldTarget = selector.exact_concrete_cases[index], base = { ...old }
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
  for (const context of old.exact_source_schema_valid_cases) for (const [dimension, fields] of Object.entries(DIMENSION_FIELDS)) for (const field of fields) if (schema.properties?.[field] && !specAccepts(schema.properties[field], context[dimension])) invalidR53.push({ selector_id: old.selector_id, source_schema_ref: old.source_schema_ref, source_schema_variant: old.source_schema_variant, source_field: old.source_field, invalid_dimension: dimension, invalid_value: context[dimension], allowed_values: values(schema.properties[field]) })
  const normalized = normalizedContexts(old), cases = normalized.map(row => ({ ...row.target, target_identity_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${row.target.target_native_identity_role}` }))
  selectors[old.selector_id] = { ...old, schema_version: 'ctrl.g24.native-source-schema-intersection-selector.r56.v1', exact_source_schema_valid_cases: normalized.map(row => row.context), exact_source_schema_constant_projections: normalized.map(row => row.projection), exact_concrete_cases: cases, exact_case_count: cases.length, source_schema_validation: 'every_projected_literal_satisfies_complete_selected_closed_source_schema', each_valid_source_constant_intersection_matches_exactly_one_target: true, caller_override_or_fallback: 'forbidden' }
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
r54.authority_operation_internal_reference_target_selectors = { schema_version: 'ctrl.g24.internal-reference-target-selectors.r56.v1', row_schema_version: 'ctrl.g24.native-source-schema-intersection-selector.r56.v1', derivation: 'complete_source_schema_validation_of_R54_intersection_contexts', exact_count: Object.keys(selectors).length, exact_source_context_count: Object.values(selectors).reduce((sum, row) => sum + row.exact_case_count, 0), rows: selectors, selector_totality_and_uniqueness_for_every_source_schema_valid_context: true, current_invalid_source_context_count: invalidR53.length, invalid_contexts_are_never_emitted: true, caller_override_meta_target_or_fallback: 'forbidden' }
r54.authority_operation_selector_source_schema_validation_authority = { schema_version: 'ctrl.g24.selector-source-schema-validation-authority.r56.v1', exact_invalid_R55_context_occurrences: invalidR53, exact_invalid_R55_count: invalidR53.length, inherited_rejected_context_count: materializedR54.authority_operation_selector_source_schema_validation_authority.exact_invalid_R54_count ?? materializedR54.authority_operation_selector_source_schema_validation_authority.exact_invalid_R53_count ?? 0, source_schema_valid_context_count: r54.authority_operation_internal_reference_target_selectors.exact_source_context_count, exact_intersection_required: true, complete_recursive_schema_validation_required: true, zero_multiple_or_invalid_context: 'reject_materialization_and_hold_without_write' }
r54.authority_operation_complete_schema_cross_artifact_equality_registry = { ...r54.authority_operation_complete_schema_cross_artifact_equality_registry, schema_version: 'ctrl.g24.complete-schema-cross-artifact-equality-registry.r56.v1', exact_rows: equalityRows, exact_row_count: equalityRows.length, internal_exact_one_count: equalityRows.filter(row => row.exact_one_resolution_required).length, native_source_context_selector_ref: 'authority_operation_internal_reference_target_selectors', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', complete_joint_fixture_registry_ref: 'authority_operation_complete_joint_equality_fixtures', every_linked_identity_joint_source_target_fixture: true, nonvacuous_declared_companion_coverage: true }
r54.authority_operation_artifact_resolution_authority = { ...r54.authority_operation_artifact_resolution_authority, schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r56.v1', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', source_constant_selector_ref: 'authority_operation_internal_reference_target_selectors', complete_joint_fixture_registry_ref: 'authority_operation_complete_joint_equality_fixtures', every_internal_selected_reference_uses_complete_source_schema_validation: true, every_declared_companion_resolves_the_same_target: true, missing_target_identity_fallback: 'forbidden' }
r54.authority_operation_restart_correlation_authority = { ...r54.authority_operation_restart_correlation_authority, schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r56.v1', equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', complete_joint_fixture_registry_ref: 'authority_operation_complete_joint_equality_fixtures', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', all_declared_equality_companions_verified_together: true }
const conditionalRuleSet = new Set()
function collectConditionalRules(value) { if (!value || typeof value !== 'object') return; for (const rule of value.conditional_rules ?? []) conditionalRuleSet.add(rule); for (const child of Object.values(value)) collectConditionalRules(child) }
collectConditionalRules(r54)
r54.fixture_schema_validator = { schema_version: 'ctrl.g24.fixture-schema-validator.r56.v1', supported_recursive_schema_forms: ['const', 'literal', 'enum', 'enum_ref', 'type', 'exact_keys', 'required', 'additional_properties_false', 'object_properties', 'schema_ref', 'nullable_null_or_recursive_value_schema', 'union_variant_discriminator', 'array_items', 'min_items', 'max_items', 'unique', 'unique_by', 'identifier_normalization_and_control_exclusions', 'min_utf8_bytes', 'max_utf8_bytes', 'max_bytes', 'pattern_or_regex', 'canonical_base64url_round_trip', 'base64url_max_decoded_bytes', 'sha256', 'sha256_or_exact_literal', 'canonical_timestamp', 'numeric_minimum_maximum', 'conditional_rules_closed_registry', 'declared_cross_field_length_content_address_fingerprint_version_and_joint_target_equalities'], enum_ref_resolution: 'exact_top_level_nonempty_array_named_by_enum_ref', exact_enum_refs: Object.fromEntries(['rejection_codes', 'hold_codes', 'operation_names', 'set_seals'].map(ref => [ref, [...get(r54, ref)]])), conditional_rule_registry_sha256: hash([...conditionalRuleSet].sort(cp)), conditional_rule_exact_count: conditionalRuleSet.size, validation_scope: 'every_persisted_identity_source_fixture_every_linked_target_fixture_and_complete_joint_equality_fixture_before_native_identity_use', deterministic_generated_values_come_from_authoritative_domains: true, unsupported_or_unresolved_schema_form: 'reject_materialization_and_hold_without_write', producer_and_checker_independent_implementations_required: true }
r54.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r56.v1', derivation: 'bounded_exact_extension_from_frozen_R55_recursive_validator_and_nonvacuous_joint_equality_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.status', '$.supersedes', '$.authority_operation_persisted_identity_formula_library', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_complete_joint_equality_fixtures', '$.authority_operation_committed_use_release_schema_fixture', '$.authority_operation_joint_identity_selector_contexts', '$.authority_operation_native_identity_applicability_report', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_internal_reference_target_selectors', '$.authority_operation_selector_source_schema_validation_authority', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], repair_roots: ['enum_ref_exact_values', 'identifier_and_human_text_byte_and_pattern_constraints', 'canonical_base64url_round_trip', 'nullable_recursive_nonnull_value', 'conditional_rules_closed_registry', 'one_complete_joint_fixture_per_declared_equality_context', 'all_declared_companions_same_target', 'all_applicable_selector_dimensions_equal_source_fixture', 'committed_use_release_schema_fixture'], removed_semantic_paths: [], frozen_parent_core_must_remain_byte_identical: true, runtime_database_ui_deployment_or_external_action: 'closed' }
r54.required_negative_fixture_families = [...new Set([...r54.required_negative_fixture_families, 'complete_recursive_schema_validation', 'enum_ref_mutation', 'canonical_base64url_round_trip', 'nullable_nonnull_recursive_validation', 'conditional_rule_mutation', 'nonvacuous_complete_joint_equality', 'selector_dimension_projection_omission', 'committed_use_release_complete_joint_equality'])]

const replaced = new Set(['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_complete_joint_equality_fixtures', 'authority_operation_committed_use_release_schema_fixture', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
const added = ['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_complete_joint_equality_fixtures', 'authority_operation_committed_use_release_schema_fixture', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_native_identity_applicability_report', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_selector_source_schema_validation_authority', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest']
r54.authority_runtime_semantic_reference_field_registry = { ...r54.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r56.v1' }
r54.authority_runtime_semantic_reference_owner_map = { ...r54.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r56.v1' }
r54.authority_runtime_semantic_dependency_owner_map = { ...r54.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r56.v1' }
r54.authority_runtime_semantic_manifest = { ...r54.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r56.v1' }
const sourcePaths = [...new Set([...r54SemanticAuthorityPaths.filter(path => !replaced.has(path)), ...added])].filter(path => get(r54, path) !== undefined).sort(cp)
r54.authority_runtime_semantic_manifest_hash_contract = { ...r54.authority_runtime_semantic_manifest_hash_contract, schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r56.v1', manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r56.v1', content_domain_ascii: 'CTRL-G24-R56-MANIFEST-CONTENT', dependency_domain_ascii: 'CTRL-G24-R56-MANIFEST-DEPENDENCY', graph_domain_ascii: 'CTRL-G24-R56-MANIFEST-GRAPH', envelope_domain_ascii: 'CTRL-G24-R56-MANIFEST-ENVELOPE' }
sourcePaths.push('authority_runtime_semantic_manifest_hash_contract'); sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r54, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R56-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
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
r54.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r56.v1', source_snapshot_sha256: snapshotSha, exact_source_paths: sourcePaths, schema_declared_field_registry_ref: 'authority_operation_schema_declared_semantic_field_registry', exact_occurrence_rows: refRows, exact_expected_occurrence_count: refRows.length, exact_path_value_resolution_count: refRows.filter(row => row.match_kind === 'exhaustive_exact_path_value_resolution').length, schema_or_pinned_field_occurrence_count: refRows.filter(row => row.match_kind === 'schema_declared_or_independently_pinned_semantic_field').length, required_named_field_occurrence_counts: Object.fromEntries(['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'].map(field => [field, refRows.filter(row => row.field_name === field).length])), suffix_name_only_inference: 'forbidden', unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write' }
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(row => row.source_authority_path === path && sourcePaths.includes(row.exact_target_path_or_UNAVAILABLE) && row.exact_target_path_or_UNAVAILABLE !== path).map(row => row.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r54.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r56.v1', source_snapshot_sha256: snapshotSha, exact_row_count: refRows.length, reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', schema_declared_and_exact_path_value_bijection: true }
r54.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r56.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })), reference_registry_ref: 'authority_runtime_semantic_reference_field_registry' }
const hc = r54.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r54, path)) })]))
function transitive(path) { const seen = new Set(), visit = item => { for (const dep of dependencies[item] ?? []) if (!seen.has(dep)) { seen.add(dep); visit(dep) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = sourcePaths.map(path => { const direct = dependencies[path].map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })), all = transitive(path).map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })); return { authority_path: path, authority_schema_version: get(r54, path)?.schema_version ?? 'UNVERSIONED', exact_keyset: Object.keys(get(r54, path) ?? {}).sort(cp), authority_content_sha256: contentHashes[path], direct_dependency_paths: dependencies[path], direct_dependency_content_hashes: direct, direct_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }) } })
const withoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r56.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: manifestRows, exact_expected_count: manifestRows.length, manifest_graph_sha256: hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifestRows }) }
r54.authority_runtime_semantic_manifest = { ...withoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r54)
export const materializedR56 = r54
export const materializedR56Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r56SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR56Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR56Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R56 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
