import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR61 as materializedR54, materializedR61Output as materializedR54Output, r61SemanticAuthorityPaths as r54SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r61.mjs'
import { materializedR62, materializedR62Output } from './materialize-ctrl-g24-trusted-ingress-r62.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r62.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, ref, variant = 'UNAVAILABLE') => { const schema = get(contract, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }
const SUPPORTED_TYPES = new Set(['array', 'base64url_without_padding', 'boolean', 'canonical_timestamp', 'controlling_watermark_change', 'discriminated_union', 'discriminated_value', 'enum', 'finite_nonnegative_number', 'human_text', 'identifier', 'identifier_or_UNAVAILABLE_literal', 'integer', 'nonnegative_integer', 'nullable', 'object', 'operation_discriminated_object', 'ordered_identifier_array', 'positive_integer', 'safe_nonnegative_integer', 'sha256', 'sha256_or_exact_literal', 'string', 'unicode_sorted_unique_identifier_array'])
const TRUSTED_EVIDENCE_RESOLUTION = Symbol('R62_CHECKER_TRUSTED_EVIDENCE_RESOLUTION')
function validationContext(payload, trustedStore = null) {
  const context = { ...payload }
  if (trustedStore) Object.defineProperty(context, TRUSTED_EVIDENCE_RESOLUTION, { value: trustedStore, enumerable: false, writable: false, configurable: false })
  return context
}
function extendValidationContext(context, payload) { return validationContext({ ...context, ...payload }, context?.[TRUSTED_EVIDENCE_RESOLUTION] ?? null) }
function fingerprintPreimage(authority, row) { return Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : Object.hasOwn(row, field) ? row[field] : null])) }
function resolveAuthoritativeEvidenceRow(contract, context, evidenceRef, label) {
  const snapshot = context?.[TRUSTED_EVIDENCE_RESOLUTION]
  const declaredSnapshot = contract.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.frozen_persistence_snapshot
  assert(snapshot && snapshot === declaredSnapshot, `${label}:trusted_evidence_context_missing`)
  assert(same(Object.keys(snapshot).sort(cp), ['case_ref', 'evaluated_at', 'evaluator_registry_member', 'evidence_input_set_seal', 'persistence_registry_row', 'rows', 'schema_version', 'snapshot_fingerprint', 'subject_ref', 'target_store_ref', 'workspace_ref']), `${label}:evidence_snapshot_keyset`)
  const registryMatches = contract.authority_operation_normative_persistence_registry.exact_rows.filter(row => row.store_path === snapshot.target_store_ref && row.row_schema_ref === snapshot.target_store_ref)
  assert(registryMatches.length === 1 && same(registryMatches[0], snapshot.persistence_registry_row), `${label}:evidence_persistence_registry_authority`)
  const decoded = snapshot.rows.map(wrapper => {
    assert(same(Object.keys(wrapper).sort(cp), ['canonical_row_bytes_b64url', 'canonical_row_bytes_sha256', 'row_content_ref', 'row_schema_ref', 'row_schema_version', 'row_value', 'target_store_ref']), `${label}:evidence_wrapper_keyset`)
    assert(wrapper.target_store_ref === snapshot.target_store_ref && wrapper.row_schema_ref === registryMatches[0].row_schema_ref && wrapper.row_schema_version === registryMatches[0].row_schema_version, `${label}:evidence_row_authority`)
    const bytes = Buffer.from(wrapper.canonical_row_bytes_b64url, 'base64url')
    assert(bytes.toString('base64url') === wrapper.canonical_row_bytes_b64url && sha(bytes) === wrapper.canonical_row_bytes_sha256 && wrapper.row_content_ref === wrapper.canonical_row_bytes_sha256, `${label}:evidence_row_content_address`)
    let row
    try { row = JSON.parse(bytes.toString('utf8')) } catch { assert(false, `${label}:evidence_row_json`) }
    assert(bytes.toString('utf8') === canonicalR44(row) && same(row, wrapper.row_value), `${label}:evidence_row_canonical`)
    validateSchema(contract, contract.authoritative_row_schemas.lifecycle_precondition_evidence, row, `${label}:resolved_evidence`)
    const semantic = hash(fingerprintPreimage(contract.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, row))
    const envelope = hash(fingerprintPreimage(contract.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, row))
    assert(row.evidence_fingerprint === semantic, `${label}:evidence_semantic_fingerprint`)
    assert(row.row_envelope_fingerprint === envelope, `${label}:evidence_envelope_fingerprint`)
    const evidenceBytes = Buffer.from(row.canonical_evidence_b64url, 'base64url')
    let evidenceInput
    try { evidenceInput = JSON.parse(evidenceBytes.toString('utf8')) } catch { assert(false, `${label}:evidence_input_json`) }
    assert(evidenceBytes.toString('utf8') === canonicalR44(evidenceInput) && same(Object.keys(evidenceInput).sort(cp), ['evidence_ref', 'evidence_value']) && evidenceInput.evidence_ref === row.evidence_ref && typeof evidenceInput.evidence_value === 'string' && evidenceInput.evidence_value.trim(), `${label}:evidence_input_lineage`)
    return { wrapper, row, semantic, envelope, evidenceInput }
  })
  assert(sha(Buffer.from(canonicalR44(decoded.map(item => item.evidenceInput).sort((left, right) => cp(left.evidence_ref, right.evidence_ref))), 'utf8')) === snapshot.evidence_input_set_seal, `${label}:evidence_input_set_seal`)
  const candidates = decoded.filter(item => item.row.evidence_ref === evidenceRef && item.row.workspace_ref === snapshot.workspace_ref && item.row.subject_ref === snapshot.subject_ref && item.row.case_ref === snapshot.case_ref)
  const active = candidates.filter(item => item.row.valid_from <= snapshot.evaluated_at && (!Object.hasOwn(item.row, 'valid_until') || item.row.valid_until > snapshot.evaluated_at)).sort((left, right) => cp(right.row.valid_from, left.row.valid_from) || cp(right.row.row_version_ref, left.row.row_version_ref))
  assert(active.length >= 1, `${label}:evidence_resolution_missing`)
  assert(!(active.length > 1 && active[0].row.valid_from === active[1].row.valid_from && active[0].row.row_version_ref === active[1].row.row_version_ref), `${label}:evidence_resolution_ambiguous`)
  const selected = active[0], row = selected.row, evaluator = snapshot.evaluator_registry_member
  assert(row.snapshot_fingerprint === snapshot.snapshot_fingerprint && row.transition_id === context.transition_id && row.predecessor_lifecycle_version_ref === context.predecessor_lifecycle_version_ref && row.evidence_input_set_seal === snapshot.evidence_input_set_seal && row.evidence_input_set_seal === context.precondition_set_seal && row.evaluated_at === snapshot.evaluated_at, `${label}:evidence_operation_lineage`)
  assert(row.evaluator_version_ref === evaluator.semantic_version && row.evaluator_version_ref === row.evaluator_semantic_version && row.evaluator_id === evaluator.evaluator_id && row.evaluator_artifact_sha256 === evaluator.artifact_sha256 && row.evaluator_manifest_sha256 === evaluator.manifest_sha256 && context.evaluator_version_ref === evaluator.semantic_version && context.evaluator_artifact_sha256 === evaluator.artifact_sha256, `${label}:evidence_evaluator_lineage`)
  assert(evaluator.active_from <= snapshot.evaluated_at && snapshot.evaluated_at < evaluator.active_until, `${label}:evidence_evaluator_not_current`)
  const catalogue = contract.lifecycle_precondition_catalog[row.transition_id]
  assert(catalogue && row.required_precondition_id === catalogue.required_precondition_id && row.precondition_canonical_text === catalogue.precondition_canonical_text, `${label}:evidence_catalogue_lineage`)
  return { row, wrapper: selected.wrapper, semantic_fingerprint: selected.semantic, envelope_fingerprint: selected.envelope }
}
function validUnicodeScalars(value) { if (typeof value !== 'string') return false; for (let index = 0; index < value.length; index += 1) { const code = value.charCodeAt(index); if (code >= 0xd800 && code <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) return false; index += 1 } else if (code >= 0xdc00 && code <= 0xdfff) return false } return true }
function strictTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/.test(value)) return false
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}
const unsignedUtf8Compare = (left, right) => Buffer.compare(Buffer.from(String(left), 'utf8'), Buffer.from(String(right), 'utf8'))
function orderingKey(contract, rule, item) {
  if (rule === 'unsigned_utf8') return item
  if (rule === 'unsigned_utf8_effect_key') return item?.effect_key
  if (rule === 'kind_class_then_base_kind_or_control_id_unsigned_utf8') return `${item?.kind_class}\u0000${item?.base_kind ?? item?.control_id}`
  if (rule === 'reuse_enrich_ask_session') return ['reuse', 'enrich', 'ask', 'session'].indexOf(item?.route)
  if (rule === 'nonlease_final_recheck_failure_set.values') return contract.outbox.provider_call_gate.nonlease_final_recheck_failure_set.values.indexOf(item)
  return undefined
}
function validateOrdering(contract, spec, value, context, label) {
  if (!spec.ordered_by) return
  const rule = spec.ordered_by
  if (rule === 'matching_evidence_refs') {
    const refs = context.evidence_refs
    assert(Array.isArray(refs) && refs.length === value.length, `${label}:ordering_companion_alignment`)
    assert(new Set(refs).size === refs.length, `${label}:ordering_duplicate_resolved_ref`)
    for (let index = 0; index < refs.length; index += 1) { const resolved = resolveAuthoritativeEvidenceRow(contract, context, refs[index], `${label}:${index}`); assert(resolved.semantic_fingerprint === value[index] && /^[0-9a-f]{64}$/.test(value[index]), `${label}:ordering_evidence_pair_mismatch:${index}`) }
    for (let index = 1; index < refs.length; index += 1) assert(unsignedUtf8Compare(refs[index - 1], refs[index]) <= 0, `${label}:ordering_matching_refs`)
    return
  }
  assert(['unsigned_utf8', 'unsigned_utf8_effect_key', 'kind_class_then_base_kind_or_control_id_unsigned_utf8', 'reuse_enrich_ask_session', 'nonlease_final_recheck_failure_set.values'].includes(rule), `${label}:unknown_ordering_authority:${rule}`)
  const keys = value.map(item => orderingKey(contract, rule, item))
  assert(keys.every(key => key !== undefined && key !== -1), `${label}:ordering_key_unresolved`)
  for (let index = 1; index < keys.length; index += 1) assert(typeof keys[index] === 'number' ? keys[index - 1] <= keys[index] : unsignedUtf8Compare(keys[index - 1], keys[index]) <= 0, `${label}:ordering_violation`)
}

function valuesOf(spec) {
  if (!spec || typeof spec !== 'object') return []
  if (Object.hasOwn(spec, 'const')) return [spec.const]
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal') return [spec.literal]
  if (spec.enum_ref) return null
  return spec.values ?? spec.enum ?? []
}
function effectiveSpec(contract, spec) { const base = spec?.type && (contract.type_registry?.[spec.type] ?? contract.base_types?.[spec.type]); return base && typeof base === 'object' ? { ...base, ...spec, type: spec.type, __registry_json_type: base.json_type } : spec }
function allowedValues(contract, spec) { const direct = valuesOf(spec); if (direct) return direct; const resolved = get(contract, spec.enum_ref); assert(Array.isArray(resolved) && resolved.length, `enum_ref:${spec.enum_ref}`); return resolved }
function resolveSpec(contract, spec) {
  if (spec?.type === 'nullable') return null
  const ref = spec?.schema_ref
  if (!ref) return null
  const resolved = get(contract, ref)
  assert(resolved, `schema_ref_missing:${ref}`)
  return resolved
}
function chooseVariant(schema, value = {}) {
  if (!schema?.variants) return { schema, variant: 'UNAVAILABLE' }
  const matches = Object.entries(schema.variants).filter(([, candidate]) => Object.entries(candidate.properties ?? {}).every(([field, spec]) => {
    const allowed = allowedValues(materializedR62, spec)
    return !Object.hasOwn(value ?? {}, field) || !allowed.length || allowed.includes(value[field])
  }))
  assert(matches.length >= 1, `union_variant_match:${matches.length}`)
  return matches.sort((a, b) => cp(a[0], b[0])).map(([variant, selected]) => ({ variant, schema: selected }))[0]
}
function validateSpec(contract, spec, value, label, context = {}) {
  spec = effectiveSpec(contract, spec)
  assert(spec && typeof spec === 'object', `${label}:schema_spec`)
  if (spec.type) assert(SUPPORTED_TYPES.has(spec.type), `${label}:unknown_type:${spec.type}`)
  if (spec.type === 'nullable') {
    if (value === null) return
    assert(spec.value_schema, `${label}:nullable_schema`)
    validateSpec(contract, spec.value_schema, value, `${label}:nullable_nonnull`, context)
    return
  }
  if (spec.type === 'identifier_or_UNAVAILABLE_literal') { if (value !== 'UNAVAILABLE') validateSpec(contract, { type: 'identifier' }, value, `${label}<identifier>`); return }
  if (spec.type === 'controlling_watermark_change') { const variant = contract.type_registry.controlling_watermark_change.variants?.[value?.kind_class]; assert(variant, `${label}:watermark_variant`); validateSchema(contract, variant, value, `${label}<${value.kind_class}>`, context); return }
  if (spec.type === 'discriminated_value') { const selected = spec.variants?.[context[spec.discriminator_source_field]]; assert(selected, `${label}:discriminated_value`); validateSpec(contract, selected, value, `${label}<value>`, context); return }
  if (spec.type === 'discriminated_union') { const variant = spec.variants?.[value?.[spec.discriminator]]; assert(variant, `${label}:union_variant`); validateSchema(contract, variant, value, `${label}<${value[spec.discriminator]}>`, context); return }
  if (spec.type === 'operation_discriminated_object') { const intent = contract.operation_specs?.[context.operation_class]?.intent; assert(intent, `${label}:operation_intent`); validateSpec(contract, intent, value, `${label}<${context.operation_class}>`, context); return }
  const resolved = resolveSpec(contract, spec)
  if (resolved) {
    const selected = chooseVariant(resolved, value && typeof value === 'object' ? value : {})
    return selected.schema?.properties ? validateSchema(contract, selected.schema, value, `${label}<${selected.variant}>`, context) : validateSpec(contract, selected.schema, value, `${label}<${selected.variant}>`, context)
  }
  if (Object.hasOwn(spec, 'const')) assert(value === spec.const, `${label}:const`)
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal') assert(value === spec.literal, `${label}:literal`)
  const allowed = allowedValues(contract, spec)
  if (allowed.length) assert(allowed.includes(value), `${label}:enum`)
  const registeredJsonType = spec.__registry_json_type ?? contract.type_registry?.[spec.type]?.json_type
  const acceptedJsonTypes = Array.isArray(registeredJsonType) ? registeredJsonType : registeredJsonType ? [registeredJsonType] : []
  if (acceptedJsonTypes.length && !acceptedJsonTypes.includes('schema_value')) {
    const actualJsonType = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isSafeInteger(value) ? 'integer' : typeof value === 'number' ? 'number' : typeof value
    assert(acceptedJsonTypes.includes(actualJsonType) || (actualJsonType === 'integer' && acceptedJsonTypes.includes('number')), `${label}:json_type:${actualJsonType}`)
  }
  if (spec.type === 'sha256') assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), `${label}:sha256`)
  if (spec.type === 'sha256_or_exact_literal') assert(typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || [spec.literal, spec.const, ...(spec.exact_literals ?? [])].filter(item => item !== undefined).includes(value)), `${label}:sha_or_literal`)
  if (['identifier', 'human_text', 'literal', 'string'].includes(spec.type) || acceptedJsonTypes.includes('string')) assert(typeof value === 'string', `${label}:string`)
  if (spec.type === 'identifier') assert(value === value.trim() && value.normalize('NFC') === value && !/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(value), `${label}:identifier_normalization`)
  if (spec.type === 'canonical_timestamp') assert(strictTimestamp(value), `${label}:time`)
  if (spec.type === 'base64url_without_padding') assert(typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && !value.includes('=') && value.length % 4 !== 1 && Buffer.from(value, 'base64url').toString('base64url') === value, `${label}:base64url`)
  if (spec.type === 'boolean') assert(typeof value === 'boolean', `${label}:boolean`)
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec.type)) assert(Number.isSafeInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0), `${label}:integer`)
  if (spec.type === 'finite_nonnegative_number') assert(Number.isFinite(value) && value >= 0 && !Object.is(value, -0), `${label}:number`)
  if (spec.minimum !== undefined) assert(value >= spec.minimum, `${label}:minimum`)
  if (spec.maximum !== undefined) assert(value <= spec.maximum, `${label}:maximum`)
  if (spec.type === 'array') {
    assert(Array.isArray(value), `${label}:array`)
    if (spec.min_items !== undefined) assert(value.length >= spec.min_items, `${label}:min_items`)
    if (spec.max_items !== undefined) assert(value.length <= spec.max_items, `${label}:max_items`)
    for (let index = 0; index < value.length; index += 1) validateSpec(contract, spec.items ?? { type: 'identifier' }, value[index], `${label}.${index}`)
    if (spec.unique) assert(new Set(value.map(item => canonicalR44(item))).size === value.length, `${label}:unique`)
    if (spec.unique_by) assert(new Set(value.map(item => item?.[spec.unique_by])).size === value.length, `${label}:unique_by`)
    if (spec.allowed_route_values) assert(value.every(item => spec.allowed_route_values.includes(item?.route)), `${label}:allowed_route`)
    if (Array.isArray(spec.exact_members)) assert(same([...value].sort(cp), [...spec.exact_members].sort(cp)), `${label}:exact_members`)
    for (const constraint of spec.item_constraints ?? []) {
      if (constraint === 'string') assert(value.every(item => typeof item === 'string'), `${label}:item_string`)
      else if (constraint === 'exact_trimmed_nonempty') assert(value.every(item => typeof item === 'string' && item.length > 0 && item === item.trim()), `${label}:item_trimmed_nonempty`)
      else if (constraint === 'not_exact_reserved_default_or_offered_honest_exit') assert(value.every(item => !['default', 'unknown', 'defer', 'refuse', 'premise_wrong'].includes(item)), `${label}:item_reserved`)
      else assert(false, `${label}:unknown_item_constraint:${constraint}`)
    }
    validateOrdering(contract, spec, value, context, label)
  }
  if (['ordered_identifier_array', 'unicode_sorted_unique_identifier_array'].includes(spec.type)) {
    assert(Array.isArray(value), `${label}:ordered_identifier_array`)
    value.forEach((item, index) => validateSpec(contract, { type: 'identifier' }, item, `${label}.${index}`, context))
    assert(new Set(value).size === value.length && same([...value].sort(cp), value), `${label}:ordered_identifier_array_order`)
  }
  if (spec.type === 'object' || spec.properties) validateSchema(contract, spec, value, label, context)
  if (typeof value === 'string') {
    if (spec.valid_unicode_scalar_only) assert(validUnicodeScalars(value), `${label}:unicode_scalar`)
    const bytes = Buffer.byteLength(value, 'utf8')
    if (spec.min_utf8_bytes !== undefined) assert(bytes >= spec.min_utf8_bytes, `${label}:min_utf8_bytes`)
    if ((spec.max_utf8_bytes ?? spec.max_bytes) !== undefined) assert(bytes <= (spec.max_utf8_bytes ?? spec.max_bytes), `${label}:max_utf8_bytes`)
    const pattern = spec.pattern ?? spec.regex
    if (pattern) assert(new RegExp(pattern, 'u').test(value), `${label}:pattern`)
    if (spec.max_decoded_bytes !== undefined) assert(Buffer.from(value, 'base64url').toString('base64url') === value && Buffer.from(value, 'base64url').length <= spec.max_decoded_bytes, `${label}:max_decoded_bytes`)
  }
  assert(value !== undefined, `${label}:defined`)
}
function evaluateLocalPredicate(contract, row, payload, label) {
  const kind = row.predicate_kind
  const ok = condition => assert(condition, `${label}:conditional:${kind}`)
  const declared = (authority, value) => hash(Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : value[field]])))
  if (kind === 'intervention_payload_bytes') { const bytes = Buffer.from(payload.payload_b64url, 'base64url'); let decoded; try { decoded = JSON.parse(bytes.toString('utf8')) } catch {}; ok(bytes.toString('base64url') === payload.payload_b64url && payload.payload_byte_length === bytes.length && decoded && bytes.toString('utf8') === canonicalR44(decoded)); if (payload.atom_kind === 'question') { ok(payload.payload_schema_version === contract.proof_value_schemas.question_contract.schema_version); validateSchema(contract, contract.proof_value_schemas.question_contract, decoded, `${label}:decoded_question`) } else if (payload.atom_kind === 'session') { ok(payload.payload_schema_version === contract.authority_operation_intervention_inner_payload_schemas.session.schema_version); validateSchema(contract, contract.authority_operation_intervention_inner_payload_schemas.session, decoded, `${label}:decoded_session`) } else ok(false); ok(payload.atom_content_fingerprint === declared(contract.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload)) }
  else if (kind === 'intervention_question_payload') { const bytes = Buffer.from(payload.payload_b64url, 'base64url'); let decoded; try { decoded = JSON.parse(bytes.toString('utf8')) } catch {} const question = payload.atom_kind === 'question'; ok(question === (payload.question_contract !== null && payload.question_contract_fingerprint !== null)); if (question) { ok(bytes.toString('utf8') === canonicalR44(decoded)); validateSchema(contract, contract.proof_value_schemas.question_contract, decoded, `${label}:decoded_question`); ok(same(decoded, payload.question_contract) && payload.question_contract_fingerprint === payload.question_contract.question_contract_fingerprint && payload.question_contract_fingerprint === declared(contract.fingerprint_schemas.question_contract, payload.question_contract)) } }
  else if (kind === 'intervention_session_nulls') { ok((payload.atom_kind === 'session') === (payload.question_contract === null && payload.question_contract_fingerprint === null)); if (payload.atom_kind === 'session') { const bytes = Buffer.from(payload.payload_b64url, 'base64url'); let decoded; try { decoded = JSON.parse(bytes.toString('utf8')) } catch {}; ok(bytes.toString('utf8') === canonicalR44(decoded)); validateSchema(contract, contract.authority_operation_intervention_inner_payload_schemas.session, decoded, `${label}:decoded_session`); ok(decoded?.atom_kind === 'session' && decoded?.content === payload.content) } }
  else if (kind === 'distinct_signers') ok(payload.signer_1_ref !== payload.signer_2_ref)
  else if (kind === 'two_signer_shape') ok(['signer_1_ref', 'signer_1_signature_b64url', 'signer_2_ref', 'signer_2_signature_b64url'].every(field => typeof payload[field] === 'string' && payload[field].length > 0))
  else if (kind === 'availability_pairs') { for (const [field, availability] of Object.entries(payload).filter(([field]) => field.endsWith('_availability'))) { const stem = field.slice(0, -13), ref = payload[`${stem}_ref_or_unavailable`], digest = payload[`${stem}_sha256_or_unavailable`]; ok(availability === 'available' ? ref !== 'UNAVAILABLE' && /^[0-9a-f]{64}$/.test(digest) : ref === 'UNAVAILABLE' && digest === 'UNAVAILABLE') } }
  else if (kind === 'eligible_iff_empty') ok(payload.eligible === (payload.rejection_reasons.length === 0))
  else if (kind === 'answer_chain') ok(payload.append_ordinal === 1 ? payload.chain_position === 'genesis' && payload.predecessor_chain_tip === null : payload.append_ordinal > 1 && payload.chain_position === 'successor' && payload.predecessor_chain_tip !== null)
  else if (kind === 'effect_text') ok(typeof payload.visible_consequence === 'string' && payload.visible_consequence.length > 0 && payload.visible_consequence === payload.visible_consequence.trim() && (payload.pending_human_owned_proposal === null || (typeof payload.pending_human_owned_proposal === 'string' && payload.pending_human_owned_proposal.length > 0 && payload.pending_human_owned_proposal === payload.pending_human_owned_proposal.trim())))
  else if (kind === 'no_case_change') { if (payload.case_effect === 'no_case_change') ok(payload.pending_human_owned_proposal === null && payload.retire_intervention_refs.length === 0) }
  else if (kind === 'question_text') ok(['visible_wording', 'rendered_control_payload', 'material_effect_disclosure', 'visible_changed_consequence', 'visible_unknown_consequence'].every(field => typeof payload[field] === 'string' && payload[field].trim().length > 0))
  else if (kind === 'question_options') { const reserved = new Set(['default', ...(payload.honest_exits ?? [])]); ok(payload.options_or_comparator.every(value => typeof value === 'string' && value === value.trim() && value.length > 0 && !reserved.has(value)) && new Set(payload.options_or_comparator).size === payload.options_or_comparator.length) }
  else if (kind === 'ranked_limit') ok(payload.answer_grammar !== 'ranked_choice' || payload.options_or_comparator.length <= 5)
  else if (kind === 'question_effect_keys') { const expected = new Set(payload.honest_exits); if (payload.answer_grammar === 'single_choice') payload.options_or_comparator.forEach(value => expected.add(value)); else expected.add('default'); if (payload.scoped_write_in) expected.add('default'); ok(same([...expected].sort(cp), payload.answer_effects.map(effect => effect.effect_key).sort(cp))) }
  else if (kind === 'question_effect_texts') ok(payload.answer_effects.every(effect => typeof effect.visible_consequence === 'string' && effect.visible_consequence.length > 0 && effect.visible_consequence === effect.visible_consequence.trim() && (effect.pending_human_owned_proposal === null || (typeof effect.pending_human_owned_proposal === 'string' && effect.pending_human_owned_proposal.length > 0 && effect.pending_human_owned_proposal === effect.pending_human_owned_proposal.trim()))))
  else if (kind === 'honest_exit_effects') ok(payload.answer_effects.filter(effect => payload.honest_exits.includes(effect.effect_key)).every(effect => effect.case_effect === 'no_case_change' && effect.pending_human_owned_proposal === null && effect.retire_intervention_refs.length === 0))
  else if (kind === 'release_result_presence') ok((payload.result_ref !== null) === (payload.operation_class === 'use_release'))
  else if (kind === 'discriminated_result_presence') ok((payload.successful_result_branch !== null) === Object.hasOwn(contract.operation_result_schema_derivation.discriminated_results, payload.operation_class))
  else if (kind === 'abort_first_reason') ok(Array.isArray(payload.failed_nonlease_final_recheck_codes) && payload.failed_nonlease_final_recheck_codes.length > 0 && payload.abort_reason === payload.failed_nonlease_final_recheck_codes[0])
  else if (kind === 'held_response_version') ok(payload.response_schema_version === contract.response_union.schemas.held.schema_version)
  else if (kind === 'hold_blob_bytes') { const bytes = Buffer.from(payload.canonical_hold_response_b64url, 'base64url'); ok(payload.canonical_hold_response_byte_length === bytes.length && payload.canonical_hold_response_bytes_sha256 === sha(bytes)) }
  else if (kind === 'response_blob_length') ok(payload.canonical_response_byte_length === Buffer.from(payload.canonical_response_b64url, 'base64url').length)
  else if (kind === 'response_blob_sha') ok(payload.canonical_response_bytes_sha256 === sha(Buffer.from(payload.canonical_response_b64url, 'base64url')))
  else if (kind === 'result_blob_length') ok(payload.canonical_result_payload_byte_length === Buffer.from(payload.canonical_result_payload_b64url, 'base64url').length)
  else if (kind === 'result_blob_sha') ok(payload.canonical_result_payload_bytes_sha256 === sha(Buffer.from(payload.canonical_result_payload_b64url, 'base64url')))
  else if (kind === 'terminal_creation_shape') ok(payload.valid_from === payload.consumed_at && !Object.hasOwn(payload, 'valid_until'))
  else throw new Error(`${label}:unknown_local_predicate:${kind}`)
}
function validateSchema(contract, schema, payload, label, context = {}) {
  assert(schema?.properties && payload && typeof payload === 'object' && !Array.isArray(payload), `${label}:schema_object`)
  const actual = Object.keys(payload).sort(cp), allowed = [...(schema.exact_keys ?? Object.keys(schema.properties))].sort(cp)
  if (schema.additional_properties === false) assert(actual.every(field => allowed.includes(field)), `${label}:exact_keys`)
  for (const field of schema.required ?? []) assert(Object.hasOwn(payload, field), `${label}:required:${field}`)
  for (const [field, spec] of Object.entries(schema.properties)) if (Object.hasOwn(payload, field)) validateSpec(contract, spec, payload[field], `${label}:${field}`, extendValidationContext(context, payload))
  const encoded = Buffer.byteLength(canonicalR44(payload), 'utf8')
  if (schema.max_canonical_bytes !== undefined) assert(encoded <= schema.max_canonical_bytes, `${label}:max_canonical_bytes`)
  if (schema.max_bytes !== undefined) assert(encoded <= schema.max_bytes, `${label}:row_max_bytes`)
  for (const [field, value] of Object.entries(payload)) if (field.endsWith('_length')) {
    const bytesField = field.replace(/_length$/, '_b64url')
    if (Object.hasOwn(payload, bytesField)) assert(value === Buffer.from(payload[bytesField], 'base64url').length, `${label}:length_equality:${field}`)
  }
  for (const rule of schema.conditional_rules ?? []) {
    const row = Object.values(contract.authority_operation_conditional_rule_predicate_registry?.rows ?? {}).find(item => item.exact_rule === rule)
    assert(row && row.unknown_or_unimplemented === 'reject', `${label}:conditional_rule_closed`)
    if (row.evaluation_scope === 'closed_local_payload_and_contract') evaluateLocalPredicate(contract, row, payload, label)
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
  for (const field of authority.preimage_order) preimage[field] = field === 'domain_ascii' ? authority.domain_ascii : Object.hasOwn(payload, field) ? payload[field] : (schema.optional ?? []).includes(field) ? null : undefined
  assert(Object.values(preimage).every(value => value !== undefined), `${label}:fingerprint_operand_missing`)
  const expected = hash(preimage)
  assert((!evidence || (same(preimage, evidence.exact_preimage) && expected === evidence.expected_fingerprint)) && payload[schema.fingerprint_field] === expected, `${label}:fingerprint_execution`)
  return expected
}
function recomputeRowVersion(contract, authority, decoded, label) {
  const derivation = authority.executable_native_derivation_evidence.selected_native_derivation
  const native = get(contract, derivation.authority_ref)
  assert(native && same(derivation.exact_preimage_order, native.row_version_preimage_exact_keys), `${label}:row_version_authority`)
  assert(!derivation.exact_preimage.ordered_complete_mutable_authority_fields.some(row => row.field === authority.identity_field || row.field === decoded.schema.fingerprint_field), `${label}:row_version_self_reference`)
  const expectedFields = Object.keys(decoded.schema.properties).filter(field => field !== authority.identity_field && field !== decoded.schema.fingerprint_field).map(field => ({ field, value: Object.hasOwn(decoded.payload, field) ? decoded.payload[field] : null }))
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
  const evidence = authority.executable_native_derivation_evidence
  const link = evidence.joint_source_target_fixture
  assert(link && link.deterministic_context_selection === 'unicode_canonical_lowest_source_context_and_target_pair_after_exact_schema_intersection', `${label}:joint_fixture`)
  assert(evidence.complete_joint_fixture_ref === link.complete_joint_fixture_ref, `${label}:complete_joint_ref_parity`)
  const shared = get(contract, evidence.complete_joint_fixture_ref)
  assert(shared && shared.schema_version === 'ctrl.g24.complete-joint-equality-fixture.r62.v1', `${label}:complete_joint_dereference`)
  assert(same(link.source_fixture, shared.source_fixture) && same(link.target_fixture, shared.target_fixture) && link.source_reference_field === shared.equality_source_field, `${label}:complete_joint_bytes`)
  assert(link.target_native_identity === shared.target_native_identity && link.target_native_bytes_sha256 === shared.target_native_bytes_sha256 && link.target_native_fingerprint === shared.target_native_fingerprint, `${label}:canonical_shared_target_values`)
  const mapping = evidence.authority_companion_target_mapping
  assert(mapping?.canonical_shared_fixture_must_not_be_overwritten === true && mapping.canonical_shared_fixture_value === shared[mapping.canonical_shared_fixture_field], `${label}:companion_mapping_shared_value`)
  const target = decodeFixture(contract, link.target_fixture, `${label}:target`)
  const semantic = targetSemantics(contract, link.target_fixture, target, link, `${label}:target`)
  assert(semantic.identity === link.target_native_identity && semantic.bytesSha === link.target_native_bytes_sha256 && semantic.fingerprint === link.target_native_fingerprint, `${label}:target_native_values`)
  const selector = get(contract, link.selector_ref)
  assert(selector && selector.exact_case_count >= 1, `${label}:selector`)
  const caseRows = selector.exact_source_schema_valid_context ? [{ context: selector.exact_source_schema_valid_context, target: selector.exact_target_case }] : selector.exact_source_schema_valid_cases.map((context, index) => ({ context, target: selector.exact_concrete_cases[index] }))
  const chosen = [...caseRows].sort((a, b) => cp(canonicalR44({ context: a.context, target: a.target }), canonicalR44({ context: b.context, target: b.target })))[0]
  assert(same(chosen.context, link.selector_context), `${label}:selector_context`)
  for (const [field, value] of Object.entries(link.projected_source_discriminators)) assert(decoded.payload[field] === value, `${label}:projected_source:${field}`)
  assert(decoded.payload[link.source_reference_field] === semantic.identity, `${label}:source_ref_target_identity`)
  for (const field of link.companion_bytes_fields) assert(decoded.payload[field.field] === (target.payload[field.field] ?? semantic.bytesSha), `${label}:companion_bytes:${field.field}`)
  for (const field of link.companion_fingerprint_fields) assert(decoded.payload[field.field] === (target.payload[field.field] ?? semantic.fingerprint), `${label}:companion_fp:${field.field}`)
  assert(link.exact_joint_equalities.source_reference_equals_target_identity && link.exact_joint_equalities.source_companion_bytes_equal_target_bytes && link.exact_joint_equalities.source_companion_fingerprints_equal_target_fingerprint, `${label}:joint_equalities`)
  let expected = authority.native_identity_role === 'resolved_reference_identity' ? semantic.identity : authority.native_identity_role === 'companion_bytes_hash' ? semantic.bytesSha : semantic.fingerprint
  if (['companion_bytes_hash', 'companion_fingerprint'].includes(authority.native_identity_role)) {
    const field = mapping.target_payload_field_or_canonical_semantic
    const mapped = Object.hasOwn(target.payload, field) ? target.payload[field] : field === '$canonical_row_bytes_sha256' ? sha(target.bytes) : field === 'target_native_bytes_sha256' ? semantic.bytesSha : ['$native_fingerprint', 'target_native_fingerprint'].includes(field) ? semantic.fingerprint : field === 'target_native_identity' ? semantic.identity : undefined
    assert(mapped !== undefined && mapping.target_value === mapped && mapping.source_identity_field === authority.identity_field, `${label}:companion_mapping_target`)
    expected = mapped
  }
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
function specValues(spec) { return allowedValues(materializedR62, spec) }
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
  assert(selector.schema_version === 'ctrl.g24.native-source-schema-intersection-selector.r62.v1' && selector.exact_case_count === expected.length, `selector_count:${selector.selector_id}`)
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
  assert(selectors.length === 374 && authority.exact_source_context_count === validation.source_schema_valid_context_count, 'selector_totals')
  assert(validation.exact_invalid_R55_count === validation.exact_invalid_R55_context_occurrences.length && validation.complete_recursive_schema_validation_required, 'selector_invalid_reproduction')
  for (const selector of selectors) validateSelector(contract, selector)
  const nonce = selectors.find(row => row.source_schema_ref === 'proof_nonce_ledger.row_schema' && row.source_field === 'nonce_receipt_ref')
  assert(same(nonce.exact_source_schema_valid_cases.map(row => row.proof_family).sort(cp), ['evaluator', 'issuer', 'root_admin', 'root_bootstrap']), 'selector_nonce_families')
  const verified = selectors.filter(row => row.source_schema_ref === 'session_hold_evidence_schema' && row.source_schema_variant === 'verified_consuming')
  assert(verified.every(row => row.exact_source_schema_valid_cases.every(context => context.evidence_kind === 'verified_consuming' && context.selected_evidence_kind === 'verified_session_hold_evidence')), 'selector_verified_evidence')
  return { selectors: selectors.length, contexts: authority.exact_source_context_count }
}

function expectedSourcePaths(contract) {
  const replaced = new Set(['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_complete_joint_equality_fixtures', 'authority_operation_committed_use_release_schema_fixture', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest', 'authority_operation_ordering_evidence_store'])
  const added = ['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_complete_joint_equality_fixtures', 'authority_operation_committed_use_release_schema_fixture', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_native_identity_applicability_report', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_selector_source_schema_validation_authority', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest', 'authority_runtime_semantic_manifest_hash_contract']
  for (const path of ['authority_operation_conditional_rule_predicate_registry', 'authority_operation_conditional_context_fixtures', 'authority_operation_conditional_fixture_coverage']) { replaced.add(path); added.push(path) }
  added.push('authority_operation_ordering_rule_registry', 'authority_operation_intervention_inner_payload_schemas')
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
  const snapshot = Object.fromEntries(paths.map(path => [path, ownedSnapshotR44(get(contract, path))])), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R62-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: paths, values: snapshot })
  if (snapshotSha !== registry.source_snapshot_sha256 || snapshotSha !== manifest.source_snapshot_sha256) {
    const mismatch = manifest.rows.find(row => row.authority_content_sha256 !== hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }))
    throw new Error(`manifest_snapshot:${snapshotSha}:${registry.source_snapshot_sha256}:${mismatch?.authority_path ?? 'content_rows_match'}`)
  }
  const refs = scanRefs(contract, paths)
  assert(same(refs, registry.exact_occurrence_rows) && refs.length === registry.exact_expected_occurrence_count, `semantic_refs:${refs.length}`)
  assert(manifest.rows.length === manifest.exact_expected_count, 'manifest_count')
  for (const row of manifest.rows) assert(row.authority_content_sha256 === hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }), `manifest_content:${row.authority_path}`)
  const without = { ...manifest }; delete without.manifest_envelope_seal_sha256
  assert(manifest.manifest_graph_sha256 === hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifest.rows }) && manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: without }), 'manifest_seals')
  return { refs: refs.length, manifest: manifest.rows.length }
}
function validateCompleteJointFixtures(contract) {
  const authority = contract.authority_operation_complete_joint_equality_fixtures, rows = Object.values(authority.rows)
  assert(authority.exact_row_count === rows.length && authority.exact_linked_identity_count === 70 && authority.empty_or_vacuous_companion_proof_when_declaration_is_nonempty === 'forbidden', 'complete_joint_authority')
  let declaredCompanions = 0
  for (const [index, row] of rows.entries()) {
    const source = decodeFixture(contract, row.source_fixture, `complete_joint_${index}:source`), target = decodeFixture(contract, row.target_fixture, `complete_joint_${index}:target`)
    const identity = row.target_identity_field === '$canonical_row_bytes' ? row.target_fixture.canonical_row_bytes_sha256 : target.payload[row.target_identity_field]
    const bytesSha = target.payload.canonical_bytes_sha256 ?? row.target_fixture.canonical_row_bytes_sha256
    let fingerprint = target.schema.fingerprint_field ? target.payload[target.schema.fingerprint_field] : identity
    if (row.target_fixture.declared_content_address?.selected_payload_schema_ref) {
      const wrappedSchema = schemaAt(contract, row.target_fixture.declared_content_address.selected_payload_schema_ref, row.target_fixture.declared_content_address.selected_payload_schema_variant)
      const wrappedPayload = JSON.parse(Buffer.from(target.payload.canonical_bytes_b64url, 'base64url').toString('utf8'))
      if (wrappedSchema?.fingerprint_field) fingerprint = wrappedPayload[wrappedSchema.fingerprint_field]
    }
    assert(identity === row.target_native_identity && bytesSha === row.target_native_bytes_sha256 && fingerprint === row.target_native_fingerprint, `complete_joint_${index}:target_semantics`)
    assert(source.payload[row.equality_source_field] === identity, `complete_joint_${index}:reference`)
    assert(row.declared_companion_bytes_count === row.declared_companion_bytes_fields.length && row.declared_companion_fingerprint_count === row.declared_companion_fingerprint_fields.length, `complete_joint_${index}:declared_counts`)
    const declarations = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.filter(item => item.source_schema_ref === row.equality_source_schema_ref && item.source_schema_variant === row.equality_source_schema_variant && item.source_field === row.equality_source_field && item.selector_ref === row.equality_selector_ref)
    assert(declarations.length === 1 && same(declarations[0].companion_bytes_fields ?? [], row.declared_companion_bytes_fields) && same(declarations[0].companion_fingerprint_fields ?? [], row.declared_companion_fingerprint_fields), `complete_joint_${index}:declaration_exact`)
    for (const companion of row.declared_companion_bytes_fields) assert(source.payload[companion.field] === (target.payload[companion.field] ?? bytesSha), `complete_joint_${index}:bytes:${companion.field}`)
    for (const companion of row.declared_companion_fingerprint_fields) assert(source.payload[companion.field] === (target.payload[companion.field] ?? fingerprint), `complete_joint_${index}:fingerprint:${companion.field}`)
    declaredCompanions += row.declared_companion_bytes_count + row.declared_companion_fingerprint_count
    const dimensions = { source_operation: source.payload.operation_name ?? 'UNAVAILABLE', source_result_branch: source.payload.result_branch ?? source.payload.hold_branch ?? source.payload.branch ?? 'UNAVAILABLE', proof_family: source.payload.proof_family ?? 'UNAVAILABLE', branch_class: source.payload.branch_class ?? 'UNAVAILABLE', evidence_kind: source.payload.evidence_kind ?? 'UNAVAILABLE', target_store: source.payload.target_store ?? 'UNAVAILABLE', source_store_variant: row.source_fixture.schema_variant, fresh_selection_row_id: source.payload.fresh_selection_row_id ?? 'UNAVAILABLE' }
    assert(same(dimensions, row.exact_selector_context), `complete_joint_${index}:selector_dimensions`)
    const applicability = { source_operation: ['operation_name'], source_result_branch: ['result_branch', 'hold_branch', 'branch'], proof_family: ['proof_family'], branch_class: ['branch_class'], evidence_kind: ['evidence_kind'], target_store: ['target_store'], fresh_selection_row_id: ['fresh_selection_row_id'] }
    for (const [dimension, fields] of Object.entries(applicability)) if (fields.some(field => source.schema.properties?.[field])) assert(row.selected_selector_context[dimension] === dimensions[dimension], `complete_joint_${index}:selected_selector_dimension:${dimension}`)
    assert(row.exact_joint_equalities.source_reference_equals_target_identity && row.exact_joint_equalities.source_companion_bytes_equal_target_bytes && row.exact_joint_equalities.source_companion_fingerprints_equal_target_fingerprint, `complete_joint_${index}:claims`)
  }
  assert(declaredCompanions > 0, 'complete_joint_companions_nonvacuous_global')
  const useFixture = contract.authority_operation_committed_use_release_schema_fixture, useDecoded = decodeFixture(contract, useFixture.schema_valid_fixture, 'committed_use_release')
  assert(useDecoded.payload.operation_class === 'use_release' && typeof useDecoded.payload.result_ref === 'string' && /^[0-9a-f]{64}$/.test(useDecoded.payload.result_ref), 'committed_use_release_fixture')
  return { rows: rows.length, companions: declaredCompanions, useRelease: 1 }
}
function contextPredicate(kind, context) {
  if (kind === 'availability_false') return context.availability === false && context.value_bytes_b64url === context.unavailable_sentinel_utf8_b64url
  if (kind === 'availability_true') return context.availability === true && context.value_bytes_b64url === context.canonical_typed_dependency_bytes_b64url
  if (kind === 'exact_resolution') return context.exact_match_count === 1 && context.source_workspace_ref === context.resolved_workspace_ref
  if (kind === 'canonical_bytes') return context.decoded_bytes_b64url === context.expected_canonical_bytes_b64url
  if (kind === 'fingerprint_recomputation') return context.declared_fingerprint === hash(context.declared_preimage)
  if (kind === 'exact_field_equality') return context.authoritative_value === context.observed_value
  if (kind === 'verified_consuming_shape') return context.evidence_kind === 'verified_consuming' && context.nonce_receipt_count === 2
  if (kind === 'exact_change_set') return same(context.expected_members, context.observed_members)
  if (kind === 'first_match_total') return context.branch_matches.filter(Boolean).length >= 1 && context.selected_index === context.branch_matches.findIndex(Boolean)
  if (kind === 'locked_string_scope') return context.locked_kernel_string_checks_only === true && context.extra_control_character_restriction_count === 0
  if (kind === 'zero_protected_effects') return context.result_blob_count === 0 && context.protected_effect_count === 0 && context.outbox_count === 0
  if (kind === 'raw_non_consuming_shape') return context.evidence_kind === 'raw_non_consuming' && context.nonce_receipt_count === 0
  if (kind === 'lifecycle_receipt_shape') return context.authority_mode === 'single_human' && Number(context.leader_receipt_present) + Number(context.operator_receipt_present) === 1
  if (kind === 'issuance_order') return context.universal_result_ordinal < context.terminal_consumption_ordinal && context.terminal_consumption_ordinal < context.row_envelope_ordinal
  if (kind === 'terminal_creation_shape') return context.valid_from === context.consumed_at && context.valid_until === null
  return false
}
function negativeContext(kind, context) {
  const copy = structuredClone(context)
  if (kind === 'availability_false') copy.value_bytes_b64url = Buffer.from('not-unavailable').toString('base64url')
  else if (kind === 'availability_true') copy.value_bytes_b64url = Buffer.from('splice').toString('base64url')
  else if (kind === 'exact_resolution') copy.exact_match_count = 2
  else if (kind === 'canonical_bytes') copy.decoded_bytes_b64url = Buffer.from('splice').toString('base64url')
  else if (kind === 'fingerprint_recomputation') copy.declared_fingerprint = sha('splice')
  else if (kind === 'exact_field_equality') copy.observed_value = `${copy.observed_value}_splice`
  else if (kind === 'verified_consuming_shape') copy.nonce_receipt_count = 1
  else if (kind === 'exact_change_set') copy.observed_members = ['a']
  else if (kind === 'first_match_total') copy.selected_index = 1
  else if (kind === 'locked_string_scope') copy.extra_control_character_restriction_count = 1
  else if (kind === 'zero_protected_effects') copy.outbox_count = 1
  else if (kind === 'raw_non_consuming_shape') copy.nonce_receipt_count = 1
  else if (kind === 'lifecycle_receipt_shape') copy.operator_receipt_present = true
  else if (kind === 'issuance_order') copy.row_envelope_ordinal = 1
  else if (kind === 'terminal_creation_shape') copy.valid_until = '2031-01-02T00:00:00.000Z'
  return copy
}
function collectRules(value, found = new Map(), path = '$') {
  if (!value || typeof value !== 'object') return found
  if (Array.isArray(value)) { value.forEach((child, index) => collectRules(child, found, `${path}[${index}]`)); return found }
  for (const rule of value.conditional_rules ?? []) { const sites = found.get(rule) ?? []; sites.push(path); found.set(rule, sites) }
  for (const [key, child] of Object.entries(value)) collectRules(child, found, `${path}.${key}`)
  return found
}
function validateConditionalAuthority(contract) {
  const found = collectRules(materializedR54), registry = contract.authority_operation_conditional_rule_predicate_registry, rows = Object.values(registry.rows)
  assert(found.size === 103 && rows.length === found.size, 'conditional_rule_inventory')
  for (const row of rows) assert(same(row.exact_schema_sites, [...found.get(row.exact_rule)].sort(cp)), `conditional_sites:${row.rule_id}`)
  const counts = Object.fromEntries(['closed_local_payload_and_contract', 'materialized_deterministic_contract_context', 'requires_resolved_external_artifact_or_transaction_context'].map(scope => [scope, rows.filter(row => row.evaluation_scope === scope).length]))
  assert(counts.closed_local_payload_and_contract === 25 && counts.materialized_deterministic_contract_context === 0 && counts.requires_resolved_external_artifact_or_transaction_context === 78, `conditional_partition:${JSON.stringify(counts)}`)
  const contexts = contract.authority_operation_conditional_context_fixtures
  assert(contexts.exact_row_count === 0 && Object.keys(contexts.rows).length === 0, 'conditional_context_count')
  for (const [ruleId, fixture] of Object.entries(contexts.rows)) {
    const rule = registry.rows[ruleId]
    assert(rule && rule.evaluation_scope === 'materialized_deterministic_contract_context' && fixture.exact_rule === rule.exact_rule && fixture.predicate_kind === rule.predicate_kind, `conditional_context_binding:${ruleId}`)
    const sitesHash = hash(rule.exact_schema_sites.map(path => ({ path, schema: get(materializedR54, path.slice(2)) })))
    assert(fixture.source_schema_site_sha256 === sitesHash && fixture.context_sha256 === hash(fixture.context), `conditional_context_site_or_hash:${ruleId}`)
    assert(contextPredicate(fixture.predicate_kind, fixture.context) && !contextPredicate(fixture.predicate_kind, negativeContext(fixture.predicate_kind, fixture.context)), `conditional_context_execution:${ruleId}`)
  }
  const coverage = contract.authority_operation_conditional_fixture_coverage
  assert(coverage.exact_rule_partition.closed_local_payload_and_contract === 25 && coverage.exact_rule_partition.bound_canonical_artifact_context === 0 && coverage.exact_rule_partition.unproved_semantic_or_live_enforcement_context === 78, 'conditional_coverage_partition')
  assert(coverage.detached_context_predicate_counted_as_executed === false && coverage.unproved_rule_is_never_counted_as_executed_or_passed === true && coverage.completeness_claim === 'closed_local_predicates_only', 'conditional_coverage_honesty')
  const exclusions = coverage.semantic_or_live_unproved_identity_exclusions
  const expectedExclusions = []
  let conditionallyTouched = 0
  let fullyClosedLocal = 0
  function selectedRulePaths(fixture) {
    const payload = JSON.parse(Buffer.from(fixture.canonical_row_bytes_b64url, 'base64url').toString('utf8')), result = []
    const rootSchema = schemaAt(contract, fixture.schema_ref, fixture.schema_variant)
    function selectVariant(schema, value) {
      if (!schema?.variants) return { variant: 'UNAVAILABLE', schema }
      const matches = Object.entries(schema.variants).filter(([, candidate]) => Object.entries(candidate.properties ?? {}).every(([field, spec]) => {
        const allowed = allowedValues(contract, spec)
        return !Object.hasOwn(value ?? {}, field) || !allowed.length || allowed.includes(value[field])
      }))
      assert(matches.length >= 1, 'conditional_selected_variant_missing')
      const [variant, selected] = matches.sort((a, b) => cp(a[0], b[0]))[0]
      return { variant, schema: selected }
    }
    function visitSchema(schema, value, schemaPath, valuePath, context) {
      for (const rule of schema?.conditional_rules ?? []) result.push({ exact_rule: rule, selected_schema_path: schemaPath, fixture_value_path: valuePath })
      if (!schema?.properties || !value || typeof value !== 'object' || Array.isArray(value)) return
      const sibling = { ...context, ...value }
      for (const [field, spec] of Object.entries(schema.properties)) if (Object.hasOwn(value, field)) visitSpec(spec, value[field], `${schemaPath}.properties.${field}`, `${valuePath}.${field}`, sibling)
    }
    function visitSpec(original, value, schemaPath, valuePath, context) {
      const spec = effectiveSpec(contract, original)
      if (spec.type === 'nullable') { if (value !== null && spec.value_schema) visitSpec(spec.value_schema, value, `${schemaPath}.value_schema`, valuePath, context); return }
      if (spec.type === 'controlling_watermark_change') { const variant = contract.type_registry.controlling_watermark_change.variants?.[value?.kind_class]; if (variant) visitSchema(variant, value, `type_registry.controlling_watermark_change.variants.${value.kind_class}`, valuePath, context); return }
      if (spec.type === 'discriminated_union') { const name = value?.[spec.discriminator], variant = spec.variants?.[name]; if (variant) visitSchema(variant, value, `${schemaPath}.variants.${name}`, valuePath, context); return }
      if (spec.type === 'discriminated_value') { const name = context[spec.discriminator_source_field], selected = spec.variants?.[name]; if (selected) visitSpec(selected, value, `${schemaPath}.variants.${name}`, valuePath, context); return }
      if (spec.type === 'operation_discriminated_object') { const name = context.operation_class, intent = contract.operation_specs?.[name]?.intent; if (intent) visitSpec(intent, value, `operation_specs.${name}.intent`, valuePath, context); return }
      if (spec.schema_ref) { const resolved = get(contract, spec.schema_ref); assert(resolved, `conditional_schema_ref:${spec.schema_ref}`); const selected = selectVariant(resolved, value && typeof value === 'object' ? value : context), selectedPath = selected.variant === 'UNAVAILABLE' ? spec.schema_ref : `${spec.schema_ref}.variants.${selected.variant}`; if (selected.schema?.properties) visitSchema(selected.schema, value, selectedPath, valuePath, context); else visitSpec(selected.schema, value, selectedPath, valuePath, context); return }
      if ((spec.type === 'array' || ['ordered_identifier_array', 'unicode_sorted_unique_identifier_array'].includes(spec.type)) && Array.isArray(value) && spec.items) { value.forEach((item, index) => visitSpec(spec.items, item, `${schemaPath}.items`, `${valuePath}[${index}]`, context)); return }
      if (spec.properties) visitSchema(spec, value, schemaPath, valuePath, context)
    }
    visitSchema(rootSchema, payload, fixture.schema_variant === 'UNAVAILABLE' ? fixture.schema_ref : `${fixture.schema_ref}.variants.${fixture.schema_variant}`, '$', payload)
    return uniq(result).sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
  }
  for (const [identityId, authority] of Object.entries(contract.authority_operation_complete_persisted_identity_authorities)) {
    const pathsForFixture = selectedRulePaths(authority.schema_valid_linked_row_fixture)
    const rulesForFixture = [...new Set(pathsForFixture.map(row => row.exact_rule))]
    if (!rulesForFixture.length) continue
    conditionallyTouched += 1
    const unproved = rulesForFixture.filter(rule => rows.some(row => row.exact_rule === rule && row.evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context'))
    if (!unproved.length) fullyClosedLocal += 1
    else expectedExclusions.push({ identity_id: identityId, schema_ref: authority.row_schema_ref, schema_variant: authority.row_schema_variant, exact_unproved_rules: unproved, exact_unproved_rule_paths: pathsForFixture.filter(path => unproved.includes(path.exact_rule)), disposition: 'excluded_from_full_conditional_semantics_claim_until_exact_resolved_external_context_is_materialized' })
  }
  assert(new Set(exclusions.map(row => row.identity_id)).size === exclusions.length, 'conditional_exclusion_unique_identity_ids')
  assert(conditionallyTouched === coverage.exact_conditionally_touched_identity_count && fullyClosedLocal === coverage.exact_fully_closed_local_semantics_validated_identity_count && expectedExclusions.length === coverage.exact_semantic_or_live_unproved_identity_count, 'conditional_exclusion_counts')
  assert(same(exclusions, expectedExclusions), 'conditional_exclusion_exact_derivation')
  for (const exclusion of exclusions) for (const rule of exclusion.exact_unproved_rules) assert(rows.some(row => row.exact_rule === rule && row.evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context'), `conditional_exclusion_honesty:${exclusion.identity_id}`)
  return { rules: rows.length, local: counts.closed_local_payload_and_contract, contexts: counts.materialized_deterministic_contract_context, unproved: counts.requires_resolved_external_artifact_or_transaction_context }
}
function validateTypeInventory(contract) {
  const counts = new Map()
  function walk(value) {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { for (const child of value) walk(child); return }
    if (typeof value.type === 'string') counts.set(value.type, (counts.get(value.type) ?? 0) + 1)
    for (const child of Object.values(value)) walk(child)
  }
  walk(materializedR54)
  const expected = Object.fromEntries([...counts].sort((a, b) => cp(a[0], b[0])).map(([type, occurrence_count]) => [type, { occurrence_count, disposition: SUPPORTED_TYPES.has(type) ? 'recursively_implemented_schema_type' : 'nonschema_control_or_container_label_not_claimed_as_fixture_schema_type' }]))
  assert(same(contract.fixture_schema_validator.exact_frozen_parent_type_inventory, expected), 'schema_type_inventory')
  assert(same(contract.fixture_schema_validator.exact_supported_types, [...SUPPORTED_TYPES].sort(cp)), 'supported_type_inventory')
}
function validateOrderingAuthority(contract) {
  const occurrences = []
  function walk(value, path = '$') {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach((child, index) => walk(child, `${path}[${index}]`)); return }
    if (Object.hasOwn(value, 'ordered_by')) occurrences.push({ source_path: path, exact_ordering_authority: value.ordered_by })
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
  }
  walk(materializedR54)
  const registry = contract.authority_operation_ordering_rule_registry
  assert(occurrences.length === 21 && registry.exact_occurrence_count === 21 && registry.exact_handler_count === 6 && registry.exact_full_schema_positive_fixture_count === 21 && registry.exact_full_schema_negative_fixture_count === 21, 'ordering_inventory_counts')
  assert(same(registry.occurrences, occurrences), 'ordering_occurrence_inventory')
  assert(occurrences.every(row => Object.hasOwn(registry.handlers, row.exact_ordering_authority)), 'ordering_handler_totality')
  assert(registry.every_occurrence_executes_selected_handler_through_full_containing_schema === true && registry.handler_only_fragments_count_as_site_coverage === false, 'ordering_full_schema_authority')
  const { frozen_persistence_snapshot: snapshot, ...pairAuthority } = registry.matching_evidence_pair_authority
  assert(same(pairAuthority, { schema_version: 'ctrl.g24.resolved-evidence-pair-ordering.r62.v1', resolution_context_source: 'internally_created_nonserializable_context_from_same_frozen_operation_snapshot', caller_payload_may_supply_resolution_context: false, target_store_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence', persistence_registry_ref: 'authority_operation_normative_persistence_registry', row_schema_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence', semantic_fingerprint_ref: 'authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence', envelope_fingerprint_ref: 'authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence', evidence_ref_semantics: 'stable_semantic_evidence_identifier_not_content_address', row_content_ref_semantics: 'SHA256_of_exact_canonical_persisted_row_bytes', evidence_ref_resolves_exactly_one_current_authoritative_row: true, current_selection_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence.current_selection', canonical_bytes_content_ref_schema_version_target_store_semantic_fingerprint_and_envelope_fingerprint_recomputed: true, result_evidence_fingerprint_must_equal_recomputed_semantic_fingerprint_not_envelope_fingerprint: true, live_atomic_current_row_enforcement: 'unproved_outside_frozen_snapshot', missing_duplicate_ambiguous_substituted_wrong_store_wrong_schema_wrong_version_wrong_bytes_wrong_hash_wrong_ref_wrong_semantic_fingerprint_wrong_envelope_fingerprint_or_wrong_lineage: 'reject_materialization_and_hold_without_write' }), 'ordering_pair_authority')
  assert(!Object.hasOwn(contract, 'authority_operation_ordering_evidence_store'), 'synthetic_ordering_evidence_store_removed')
  assert(snapshot?.target_store_ref === 'authoritative_row_schemas.lifecycle_precondition_evidence' && snapshot.rows.length === 2, 'actual_lifecycle_evidence_snapshot')
  validateSchema(contract, contract.evaluator_abi.registry_member_schema, snapshot.evaluator_registry_member, 'ordering_evaluator_registry_member')
  const baseContextPayload = { transition_id: 'open_preparation', predecessor_lifecycle_version_ref: null, precondition_set_seal: snapshot.evidence_input_set_seal, evaluator_version_ref: snapshot.evaluator_registry_member.semantic_version, evaluator_artifact_sha256: snapshot.evaluator_registry_member.artifact_sha256 }
  const trustedContext = validationContext(baseContextPayload, snapshot)
  for (const wrapper of snapshot.rows) resolveAuthoritativeEvidenceRow(contract, trustedContext, wrapper.row_value.evidence_ref, 'ordering_actual_lifecycle_evidence_row')
  assert(new Set(snapshot.rows.map(wrapper => wrapper.row_value.evidence_ref)).size === snapshot.rows.length, 'ordering_evidence_unique_refs')
  const fixtures = registry.executable_full_schema_occurrence_fixtures
  assert(Array.isArray(fixtures) && fixtures.length === occurrences.length, 'ordering_full_fixture_count')
  for (const [index, occurrence] of occurrences.entries()) {
    const fixture = fixtures[index]
    const marker = '.properties.', split = occurrence.source_path.lastIndexOf(marker)
    assert(split >= 2, `ordering_schema_path:${index}`)
    const schemaPath = occurrence.source_path.slice(2, split), field = occurrence.source_path.slice(split + marker.length)
    const schema = get(contract, schemaPath), parentSpec = get(materializedR54, occurrence.source_path.slice(2))
    assert(schema?.properties?.[field] && same(fixture, { ...fixture, fixture_id: `ordering_${String(index + 1).padStart(2, '0')}`, source_path: occurrence.source_path, containing_schema_ref: schemaPath, containing_schema_version: schema.schema_version, ordered_field: field, exact_ordering_authority: occurrence.exact_ordering_authority, selected_spec_sha256: hash(parentSpec) }), `ordering_fixture_identity:${index}`)
    assert(fixture.fixture_id === `ordering_${String(index + 1).padStart(2, '0')}` && fixture.source_path === occurrence.source_path && fixture.containing_schema_ref === schemaPath && fixture.containing_schema_version === schema.schema_version && fixture.ordered_field === field && fixture.exact_ordering_authority === occurrence.exact_ordering_authority && fixture.selected_spec_sha256 === hash(parentSpec), `ordering_fixture_binding:${index}`)
    const positiveBytes = Buffer.from(fixture.positive.canonical_payload_b64url, 'base64url'), negativeBytes = Buffer.from(fixture.negative.canonical_payload_b64url, 'base64url')
    assert(positiveBytes.toString('base64url') === fixture.positive.canonical_payload_b64url && sha(positiveBytes) === fixture.positive.canonical_payload_sha256, `ordering_positive_bytes:${index}`)
    assert(negativeBytes.toString('base64url') === fixture.negative.canonical_payload_b64url && sha(negativeBytes) === fixture.negative.canonical_payload_sha256, `ordering_negative_bytes:${index}`)
    const positive = JSON.parse(positiveBytes.toString('utf8')), negative = JSON.parse(negativeBytes.toString('utf8'))
    assert(positiveBytes.toString('utf8') === canonicalR44(positive) && negativeBytes.toString('utf8') === canonicalR44(negative), `ordering_canonical_payload:${index}`)
    const needsEvidence = schemaPath === 'result_payload_schemas.evaluate_lifecycle_preconditions'
    assert(fixture.positive.trusted_resolution_store_ref === (needsEvidence ? 'authoritative_row_schemas.lifecycle_precondition_evidence' : 'UNAVAILABLE'), `ordering_context_ref:${index}`)
    validateSchema(contract, schema, positive, `ordering_positive_full:${index}`, needsEvidence ? trustedContext : {})
    assert(same(negative[field], [...positive[field]].reverse()), `ordering_negative_exact_reverse:${index}`)
    const differing = Object.keys({ ...positive, ...negative }).filter(key => !same(positive[key], negative[key]))
    const allowedDifferences = new Set([field, schema.fingerprint_field, ...(schemaPath === 'outbox.invocation_aborted_before_provider_schema' ? ['abort_reason'] : [])].filter(Boolean))
    assert(differing.every(key => allowedDifferences.has(key)) && differing.includes(field), `ordering_negative_only_selected_and_dependents:${index}:${differing}`)
    let rejection = null
    try { validateSchema(contract, schema, negative, `ordering_negative_full:${index}`, needsEvidence ? trustedContext : {}) } catch (error) { rejection = String(error?.message ?? error) }
    assert(rejection?.includes('ordering'), `ordering_negative_specific_rejection:${index}:${rejection}`)
  }
  return occurrences.length
}
function validate(contract) {
  assert(contract.schema_version === 'ctrl.g24.trusted-ingress.r62.effective.v1' && contract.schema_change_manifest.runtime_database_ui_deployment_or_external_action === 'closed', 'r62_boundary')
  assert(same(contract.authority_operation_normative_persistence_registry, materializedR54.authority_operation_normative_persistence_registry), 'R56_persistence_preserved')
  assert(same(contract.authority_operation_committed_receipt_identity_fixtures, materializedR54.authority_operation_committed_receipt_identity_fixtures), 'R56_signed_restart_fixtures_preserved')
  const historyBefore = hash(ownedSnapshotR44(contract.authority_operation_historical_response_schema))
  const identities = validateIdentities(contract)
  assert(historyBefore === hash(ownedSnapshotR44(contract.authority_operation_historical_response_schema)), 'identity_validation_mutated_history_schema')
  const selectors = validateSelectors(contract)
  assert(historyBefore === hash(ownedSnapshotR44(contract.authority_operation_historical_response_schema)), 'selector_validation_mutated_history_schema')
  const complete = validateCompleteJointFixtures(contract)
  const conditional = validateConditionalAuthority(contract)
  validateTypeInventory(contract)
  const ordering = validateOrderingAuthority(contract)
  const manifest = validateManifest(contract)
  return { identities, ...selectors, complete, conditional, ordering, ...manifest }
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r61.json'), 'utf8') === materializedR54Output, 'frozen_R61_exact')
assert(readFileSync(join(root, outputPath), 'utf8') === materializedR62Output, 'exact_R62_materialization')
const baseline = validate(materializedR62)
let attacks = 0
function reject(name, fn) { let rejected = false; try { fn() } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
reject('identifier_empty', () => validateSpec(materializedR62, { type: 'identifier' }, '', 'identifier_empty'))
reject('identifier_257_utf8_bytes', () => validateSpec(materializedR62, { type: 'identifier' }, 'x'.repeat(257), 'identifier_257'))
reject('pattern_32_hex', () => validateSpec(materializedR62, { type: 'identifier', pattern: '^[0-9a-f]{32}$' }, 'not-32-hex', 'pattern_32_hex'))
reject('base64url_noncanonical_A', () => validateSpec(materializedR62, { type: 'base64url_without_padding' }, 'A', 'base64url_A'))
validateSpec(materializedR62, { type: 'nullable', value_schema: { type: 'identifier', min_utf8_bytes: 1, max_utf8_bytes: 8 } }, 'valid', 'nullable_positive')
reject('nullable_nonnull_recursive_invalid', () => validateSpec(materializedR62, { type: 'nullable', value_schema: { type: 'identifier', pattern: '^[0-9a-f]{32}$' } }, 'valid', 'nullable_recursive'))
reject('generic_string_rejects_number', () => validateSpec(materializedR62, { type: 'string' }, 42, 'generic_string_number'))
reject('identifier_or_unavailable_rejects_number', () => validateSpec(materializedR62, { type: 'identifier_or_UNAVAILABLE_literal' }, 42, 'identifier_or_unavailable_number'))
reject('unicode_scalar_rejects_lone_surrogate', () => validateSpec(materializedR62, { type: 'string', valid_unicode_scalar_only: true }, '\ud800', 'lone_surrogate'))
validateSchema(materializedR62, { properties: { required_value: { type: 'identifier' }, optional_value: { type: 'identifier' } }, required: ['required_value'], optional: ['optional_value'], exact_keys: ['required_value', 'optional_value'], additional_properties: false }, { required_value: 'present' }, 'optional_absent_positive')
reject('optional_schema_extra_key', () => validateSchema(materializedR62, { properties: { required_value: { type: 'identifier' }, optional_value: { type: 'identifier' } }, required: ['required_value'], optional: ['optional_value'], exact_keys: ['required_value', 'optional_value'], additional_properties: false }, { required_value: 'present', extra: 'forged' }, 'optional_extra'))
reject('operation_discriminated_empty_intent', () => validateSpec(materializedR62, { type: 'operation_discriminated_object' }, {}, 'operation_intent_empty', { operation_class: 'use_release' }))
reject('watermark_change_empty_object', () => validateSpec(materializedR62, { type: 'controlling_watermark_change' }, {}, 'watermark_empty'))
reject('discriminated_value_wrong_shape', () => validateSpec(materializedR62, materializedR62.proof_value_schemas.answer_value_by_kind, 'not-an-array', 'discriminated_ranking', { answer_kind: 'ranking' }))
for (const timestamp of ['2023-02-29T00:00:00.000Z', '2031-02-29T00:00:00.000Z', '2031-04-31T00:00:00.000Z']) reject(`impossible_timestamp:${timestamp}`, () => validateSpec(materializedR62, { type: 'canonical_timestamp' }, timestamp, 'impossible_timestamp'))
const conditionalProbe = { properties: { operation_class: { values: ['use_release', 'other'] }, result_ref: { type: 'nullable', value_schema: { type: 'sha256' } } }, required: ['operation_class', 'result_ref'], exact_keys: ['operation_class', 'result_ref'], additional_properties: false, conditional_rules: ['result_ref_is_nonnull_iff_operation_class_is_use_release_and_equals_the_branch_terminal_consumption_ref'] }
validateSchema(materializedR62, conditionalProbe, { operation_class: 'use_release', result_ref: sha('valid') }, 'conditional_shape_only')
assert(Object.values(materializedR62.authority_operation_conditional_rule_predicate_registry.rows).find(row => row.exact_rule === conditionalProbe.conditional_rules[0]).evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context', 'terminal_consumption_relation_honestly_unproved')
const terminalIdentityFixtures = Object.values(materializedR62.authority_operation_complete_persisted_identity_authorities).filter(row => row.row_schema_ref === 'authoritative_row_schemas.release_authority_terminal_consumptions').map(row => row.schema_valid_linked_row_fixture)
assert(terminalIdentityFixtures.length === 8, `terminal_identity_fixture_count:${terminalIdentityFixtures.length}`)
for (const fixture of terminalIdentityFixtures) {
  const decoded = decodeFixture(materializedR62, fixture, 'terminal_valid_until_absent')
  assert(!Object.hasOwn(decoded.payload, 'valid_until'), 'terminal_valid_until_must_be_absent')
}
reject('terminal_valid_until_present', () => { const payload = decodeFixture(materializedR62, terminalIdentityFixtures[0], 'terminal_valid_until_attack_source').payload; payload.valid_until = payload.consumed_at; decodeFixture(materializedR62, resealFixture(terminalIdentityFixtures[0], payload), 'terminal_valid_until_attack') })
function resealFixture(fixture, payload) { const copy = structuredClone(fixture), bytes = Buffer.from(canonicalR44(payload), 'utf8'); copy.canonical_row_bytes_b64url = bytes.toString('base64url'); copy.canonical_row_bytes_sha256 = sha(bytes); return copy }
const index = materializedR62.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
const identityOf = role => index.find(row => row.native_identity_role === role)
function authorityAttack(name, row, mutate) { reject(name, () => { const authority = structuredClone(get(materializedR62, row.exact_authority_ref)); mutate(authority); validateIdentity(materializedR62, row, authority) }) }
authorityAttack('generic_identity_fixture_restored', identityOf('unique_key_component'), authority => { authority.executable_formula_fixture = { expected_identity: 'laundered' } })
authorityAttack('opaque_proof_bundle_ref_mismatch', index.find(item => item.identity_kind.includes('authority_opaque_raw_input_stores.proof_bundle') && item.identity_field === 'artifact_ref'), authority => { authority.executable_native_derivation_evidence.selected_native_derivation.expected_identity = sha('wrong') })
authorityAttack('opaque_target_sha_mismatch', index.find(item => item.identity_kind.includes('authority_opaque_raw_input_stores.target') && item.identity_field === 'opaque_bytes_sha256'), authority => { authority.executable_native_derivation_evidence.expected_identity = sha('wrong') })
for (const row of index.filter(item => item.native_identity_role === 'declared_row_version')) reject(`row_version_self_reference:${row.identity_kind}`, () => { const authority = structuredClone(get(materializedR62, row.exact_authority_ref)); authority.executable_native_derivation_evidence.selected_native_derivation.exact_preimage.ordered_complete_mutable_authority_fields.push({ field: row.identity_field, value: authority.executable_native_derivation_evidence.expected_identity }); validateIdentity(materializedR62, row, authority) })
const sessionHold = index.find(item => item.identity_field === 'session_hold_evidence_fingerprint_or_unavailable')
reject('session_hold_companion_splice', () => { const authority = structuredClone(get(materializedR62, sessionHold.exact_authority_ref)); authority.executable_native_derivation_evidence.joint_source_target_fixture.target_native_fingerprint = sha('splice'); validateIdentity(materializedR62, sessionHold, authority) })
reject('fixture_malformed_length', () => { const row = identityOf('canonical_row_bytes_content_address'), authority = structuredClone(get(materializedR62, row.exact_authority_ref)); authority.schema_valid_linked_row_fixture.canonical_row_bytes_b64url = authority.schema_valid_linked_row_fixture.canonical_row_bytes_b64url.slice(2); validateIdentity(materializedR62, row, authority) })
reject('fixture_sha_mismatch', () => { const row = identityOf('schema_declared_fingerprint'), authority = structuredClone(get(materializedR62, row.exact_authority_ref)); authority.schema_valid_linked_row_fixture.canonical_row_bytes_sha256 = sha('wrong'); validateIdentity(materializedR62, row, authority) })
reject('fixture_ref_mismatch', () => { const row = index.find(item => item.native_identity_role === 'declared_content_address' && item.identity_field === 'artifact_ref'), authority = structuredClone(get(materializedR62, row.exact_authority_ref)); authority.executable_native_derivation_evidence.expected_identity = sha('wrong'); validateIdentity(materializedR62, row, authority) })

const fixtureRecords = []
for (const row of index) {
  const authority = get(materializedR62, row.exact_authority_ref), joint = authority.executable_native_derivation_evidence.joint_source_target_fixture
  fixtureRecords.push({ row, kind: 'source', fixture: authority.schema_valid_linked_row_fixture })
  if (joint) fixtureRecords.push({ row, kind: 'target', fixture: joint.target_fixture })
}
const interventionRecord = fixtureRecords.find(record => record.fixture.schema_ref === 'authoritative_row_schemas.intervention_atoms')
assert(interventionRecord, 'intervention_fixture_inventory')
const interventionDecoded = decodeFixture(materializedR62, interventionRecord.fixture, 'intervention_positive')
reject('intervention_question_null_contract', () => { const payload = structuredClone(interventionDecoded.payload); payload.question_contract = null; payload.question_contract_fingerprint = null; decodeFixture(materializedR62, resealFixture(interventionRecord.fixture, payload), 'intervention_question_null') })
reject('intervention_payload_length_zero', () => { const payload = structuredClone(interventionDecoded.payload); payload.payload_byte_length = 0; decodeFixture(materializedR62, resealFixture(interventionRecord.fixture, payload), 'intervention_length_zero') })
const declaredTestHash = (authority, payload) => hash(Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : payload[field]])))
function resealInterventionQuestion(payload, encodedQuestion = null) {
  payload.question_contract.question_contract_fingerprint = declaredTestHash(materializedR62.fingerprint_schemas.question_contract, payload.question_contract)
  payload.question_contract_fingerprint = payload.question_contract.question_contract_fingerprint
  const bytes = Buffer.from(encodedQuestion ?? canonicalR44(payload.question_contract), 'utf8')
  payload.payload_b64url = bytes.toString('base64url')
  payload.payload_byte_length = bytes.length
  payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload)
  return resealFixture(interventionRecord.fixture, payload)
}
reject('intervention_question_forged_shared_fingerprint', () => { const payload = structuredClone(interventionDecoded.payload), forged = sha('forged_question'); payload.question_contract.question_contract_fingerprint = forged; payload.question_contract_fingerprint = forged; const bytes = Buffer.from(canonicalR44(payload.question_contract), 'utf8'); payload.payload_b64url = bytes.toString('base64url'); payload.payload_byte_length = bytes.length; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); validateSchema(materializedR62, materializedR62.authoritative_row_schemas.intervention_atoms, payload, 'intervention_forged_question') })
reject('intervention_session_inner_outer_content_mismatch', () => { const payload = structuredClone(interventionDecoded.payload); payload.atom_kind = 'session'; payload.question_contract = null; payload.question_contract_fingerprint = null; const bytes = Buffer.from(canonicalR44({ atom_kind: 'session', content: 'different inner content' }), 'utf8'); payload.payload_b64url = bytes.toString('base64url'); payload.payload_byte_length = bytes.length; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); validateSchema(materializedR62, materializedR62.authoritative_row_schemas.intervention_atoms, payload, 'intervention_session_mismatch') })
reject('intervention_question_pretty_printed_inner_bytes', () => { const payload = structuredClone(interventionDecoded.payload); decodeFixture(materializedR62, resealInterventionQuestion(payload, JSON.stringify(payload.question_contract, null, 2)), 'intervention_pretty_inner') })
reject('intervention_question_inner_key_injection', () => { const payload = structuredClone(interventionDecoded.payload), inner = { ...payload.question_contract, injected: true }; const bytes = Buffer.from(canonicalR44(inner), 'utf8'); payload.payload_b64url = bytes.toString('base64url'); payload.payload_byte_length = bytes.length; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); decodeFixture(materializedR62, resealFixture(interventionRecord.fixture, payload), 'intervention_inner_key_injection') })
reject('intervention_session_inner_key_injection', () => { const payload = structuredClone(interventionDecoded.payload), inner = { atom_kind: 'session', content: payload.content, injected: true }; payload.atom_kind = 'session'; payload.question_contract = null; payload.question_contract_fingerprint = null; const bytes = Buffer.from(canonicalR44(inner), 'utf8'); payload.payload_b64url = bytes.toString('base64url'); payload.payload_byte_length = bytes.length; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); decodeFixture(materializedR62, resealFixture(interventionRecord.fixture, payload), 'intervention_session_key_injection') })
reject('question_answer_effects_reverse_resealed', () => { const payload = structuredClone(interventionDecoded.payload); payload.question_contract.answer_effects.reverse(); decodeFixture(materializedR62, resealInterventionQuestion(payload), 'question_answer_effects_reverse') })
reject('question_visible_consequence_padded', () => { const payload = structuredClone(interventionDecoded.payload); payload.question_contract.answer_effects[0].visible_consequence = ` ${payload.question_contract.answer_effects[0].visible_consequence}`; decodeFixture(materializedR62, resealInterventionQuestion(payload), 'question_visible_consequence_padded') })
reject('question_pending_proposal_padded', () => { const payload = structuredClone(interventionDecoded.payload); payload.question_contract.answer_effects[0].pending_human_owned_proposal = ' padded proposal '; payload.question_contract.answer_effects[0].case_effect = 'stage_pending_proposal'; decodeFixture(materializedR62, resealInterventionQuestion(payload), 'question_pending_proposal_padded') })
const paddedDisplayPayload = structuredClone(interventionDecoded.payload)
paddedDisplayPayload.question_contract.visible_wording = `  ${paddedDisplayPayload.question_contract.visible_wording}  `
decodeFixture(materializedR62, resealInterventionQuestion(paddedDisplayPayload), 'question_padded_display_preserves_exact_bytes')
reject('question_blank_display', () => { const payload = structuredClone(interventionDecoded.payload); payload.question_contract.visible_wording = '   '; decodeFixture(materializedR62, resealInterventionQuestion(payload), 'question_blank_display') })
reject('intervention_question_arbitrary_schema_version', () => { const payload = structuredClone(interventionDecoded.payload); payload.payload_schema_version = 'invented.schema.v99'; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); decodeFixture(materializedR62, resealFixture(interventionRecord.fixture, payload), 'intervention_question_arbitrary_schema_version') })
reject('intervention_question_cross_kind_schema_version', () => { const payload = structuredClone(interventionDecoded.payload); payload.payload_schema_version = materializedR62.authority_operation_intervention_inner_payload_schemas.session.schema_version; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); decodeFixture(materializedR62, resealFixture(interventionRecord.fixture, payload), 'intervention_question_cross_kind_schema_version') })
const sessionInterventionAuthority = materializedR62.authority_operation_complete_persisted_identity_authorities.identity_0043
assert(sessionInterventionAuthority, 'session_intervention_identity_inventory')
const sessionInterventionRecord = { fixture: sessionInterventionAuthority.schema_valid_linked_row_fixture }
const sessionInterventionDecoded = decodeFixture(materializedR62, sessionInterventionRecord.fixture, 'intervention_session_positive')
assert(sessionInterventionDecoded.payload.atom_kind === 'session' && sessionInterventionDecoded.payload.payload_schema_version === materializedR62.authority_operation_intervention_inner_payload_schemas.session.schema_version, 'intervention_session_selected_version')
reject('intervention_session_arbitrary_schema_version', () => { const payload = structuredClone(sessionInterventionDecoded.payload); payload.payload_schema_version = 'invented.session.schema.v99'; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); decodeFixture(materializedR62, resealFixture(sessionInterventionRecord.fixture, payload), 'intervention_session_arbitrary_schema_version') })
reject('intervention_session_cross_kind_schema_version', () => { const payload = structuredClone(sessionInterventionDecoded.payload); payload.payload_schema_version = materializedR62.proof_value_schemas.question_contract.schema_version; payload.atom_content_fingerprint = declaredTestHash(materializedR62.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload); decodeFixture(materializedR62, resealFixture(sessionInterventionRecord.fixture, payload), 'intervention_session_cross_kind_schema_version') })

const questionHonestExitSpec = materializedR62.proof_value_schemas.question_contract.properties.honest_exits
validateSpec(materializedR62, questionHonestExitSpec, ['defer', 'premise_wrong', 'refuse', 'unknown'], 'question_honest_exits_positive')
reject('question_honest_exits_exact_member_removed', () => validateSpec(materializedR62, questionHonestExitSpec, ['defer', 'premise_wrong', 'refuse'], 'question_honest_exits_member_removed'))
reject('question_honest_exits_duplicate', () => validateSpec(materializedR62, questionHonestExitSpec, ['defer', 'premise_wrong', 'refuse', 'unknown', 'unknown'], 'question_honest_exits_duplicate'))
reject('ordered_identifier_array_scalar', () => validateSpec(materializedR62, { type: 'ordered_identifier_array' }, 42, 'ordered_identifier_array_scalar'))
reject('ordered_identifier_array_reverse', () => validateSpec(materializedR62, { type: 'ordered_identifier_array' }, ['b', 'a'], 'ordered_identifier_array_reverse'))
reject('unicode_sorted_unique_identifier_array_scalar', () => validateSpec(materializedR62, { type: 'unicode_sorted_unique_identifier_array' }, 42, 'unicode_sorted_identifier_array_scalar'))
reject('unicode_sorted_unique_identifier_array_duplicate', () => validateSpec(materializedR62, { type: 'unicode_sorted_unique_identifier_array' }, ['a', 'a'], 'unicode_sorted_identifier_array_duplicate'))
reject('ordering_unsigned_utf8', () => validateOrdering(materializedR62, { ordered_by: 'unsigned_utf8' }, ['b', 'a'], {}, 'ordering_unsigned_utf8'))
reject('ordering_effect_key', () => validateOrdering(materializedR62, { ordered_by: 'unsigned_utf8_effect_key' }, [{ effect_key: 'b' }, { effect_key: 'a' }], {}, 'ordering_effect_key'))
reject('ordering_structured_watermark', () => validateOrdering(materializedR62, { ordered_by: 'kind_class_then_base_kind_or_control_id_unsigned_utf8' }, [{ kind_class: 'applicable_control', control_id: 'b' }, { kind_class: 'applicable_control', control_id: 'a' }], {}, 'ordering_structured_watermark'))
reject('ordering_route_enum', () => validateOrdering(materializedR62, { ordered_by: 'reuse_enrich_ask_session' }, [{ route: 'enrich' }, { route: 'reuse' }], {}, 'ordering_route_enum'))
reject('ordering_outbox_failure_enum', () => validateSpec(materializedR62, materializedR62.outbox.invocation_aborted_before_provider_schema.properties.failed_nonlease_final_recheck_codes, ['payload_changed', 'operation_authority_changed'], 'ordering_outbox_failure_enum'))
reject('ordering_unknown_authority', () => validateOrdering(materializedR62, { ordered_by: 'invented_order' }, ['a'], {}, 'ordering_unknown_authority'))
const orderingRegistry = materializedR62.authority_operation_ordering_rule_registry
const evidenceFixtureIndex = orderingRegistry.executable_full_schema_occurrence_fixtures.findIndex(row => row.source_path.endsWith('.evidence_fingerprints'))
assert(evidenceFixtureIndex >= 0, 'ordering_evidence_full_fixture_inventory')
function mutateOrderingPositive(candidate, index, mutate) {
  const fixture = candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[index]
  const payload = JSON.parse(Buffer.from(fixture.positive.canonical_payload_b64url, 'base64url').toString('utf8'))
  mutate(payload)
  const bytes = Buffer.from(canonicalR44(payload), 'utf8')
  fixture.positive.canonical_payload_b64url = bytes.toString('base64url')
  fixture.positive.canonical_payload_sha256 = sha(bytes)
}
reject('ordering_full_schema_fingerprint_swap', () => { const candidate = structuredClone(materializedR62); mutateOrderingPositive(candidate, evidenceFixtureIndex, payload => { payload.evidence_fingerprints.reverse() }); validateOrderingAuthority(candidate) })
reject('ordering_full_schema_coherent_caller_pair_swap', () => { const candidate = structuredClone(materializedR62); mutateOrderingPositive(candidate, evidenceFixtureIndex, payload => { payload.evidence_fingerprints.reverse(); payload.resolved_evidence_pairs = payload.evidence_refs.map((evidence_ref, index) => ({ evidence_ref, evidence_fingerprint: payload.evidence_fingerprints[index] })) }); validateOrderingAuthority(candidate) })
reject('ordering_full_schema_without_internal_resolution_context', () => { const fixture = materializedR62.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[evidenceFixtureIndex], payload = JSON.parse(Buffer.from(fixture.positive.canonical_payload_b64url, 'base64url').toString('utf8')); validateSchema(materializedR62, materializedR62.result_payload_schemas.evaluate_lifecycle_preconditions, payload, 'ordering_without_trusted_context') })
const evidenceSnapshotOf = candidate => candidate.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.frozen_persistence_snapshot
function resealActualEvidenceWrapper(candidate, index, options = {}) {
  const wrapper = evidenceSnapshotOf(candidate).rows[index], row = wrapper.row_value
  if (options.semantic !== false) row.evidence_fingerprint = hash(fingerprintPreimage(candidate.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, row))
  if (options.envelope !== false) row.row_envelope_fingerprint = hash(fingerprintPreimage(candidate.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, row))
  const bytes = Buffer.from(canonicalR44(row), 'utf8'), digest = sha(bytes)
  wrapper.canonical_row_bytes_b64url = bytes.toString('base64url'); wrapper.canonical_row_bytes_sha256 = digest; wrapper.row_content_ref = digest
}
function mutateActualEvidence(candidate, index, mutate, options = {}) { mutate(evidenceSnapshotOf(candidate).rows[index].row_value); resealActualEvidenceWrapper(candidate, index, options) }
reject('ordering_synthetic_toy_store_substitution', () => { const candidate = structuredClone(materializedR62); candidate.authority_operation_ordering_evidence_store = { rows: [{ evidence_id: 'toy', evidence_value: 'toy' }] }; validateOrderingAuthority(candidate) })
reject('ordering_full_schema_coherent_output_and_store_fingerprint_swap', () => { const candidate = structuredClone(materializedR62), snapshot = evidenceSnapshotOf(candidate), fingerprints = snapshot.rows.map(wrapper => wrapper.row_value.evidence_fingerprint).reverse(); snapshot.rows.forEach((wrapper, index) => { wrapper.row_value.evidence_fingerprint = fingerprints[index]; resealActualEvidenceWrapper(candidate, index, { semantic: false }) }); mutateOrderingPositive(candidate, evidenceFixtureIndex, payload => { payload.evidence_fingerprints.reverse() }); validateOrderingAuthority(candidate) })
reject('ordering_full_schema_missing_evidence_row', () => { const candidate = structuredClone(materializedR62); evidenceSnapshotOf(candidate).rows.pop(); validateOrderingAuthority(candidate) })
reject('ordering_full_schema_duplicate_evidence_row', () => { const candidate = structuredClone(materializedR62), snapshot = evidenceSnapshotOf(candidate); snapshot.rows.push(structuredClone(snapshot.rows[0])); validateOrderingAuthority(candidate) })
reject('ordering_full_schema_substituted_evidence_ref', () => { const candidate = structuredClone(materializedR62); mutateOrderingPositive(candidate, evidenceFixtureIndex, payload => { payload.evidence_refs[0] = sha('substituted_ref') }); validateOrderingAuthority(candidate) })
for (const field of materializedR62.authoritative_row_schemas.lifecycle_precondition_evidence.required) reject(`ordering_actual_row_missing_required_${field}`, () => { const candidate = structuredClone(materializedR62); mutateActualEvidence(candidate, 0, row => { delete row[field] }, { semantic: false, envelope: false }); validateOrderingAuthority(candidate) })
for (const [name, mutate] of [
  ['wrong_store', (candidate, wrapper) => { wrapper.target_store_ref = 'forged_store' }],
  ['wrong_schema', (candidate, wrapper) => { wrapper.row_schema_ref = 'forged.schema' }],
  ['wrong_version', (candidate, wrapper) => { wrapper.row_schema_version = 'forged.version' }],
  ['wrong_bytes', (candidate, wrapper) => { wrapper.canonical_row_bytes_b64url = Buffer.from('{}', 'utf8').toString('base64url') }],
  ['wrong_hash', (candidate, wrapper) => { wrapper.canonical_row_bytes_sha256 = sha('wrong_hash') }],
  ['nonexistent_content_digest', (candidate, wrapper) => { wrapper.row_content_ref = sha('nonexistent') }],
  ['wrong_semantic_fingerprint', (candidate, wrapper) => { wrapper.row_value.evidence_fingerprint = sha('wrong_semantic'); resealActualEvidenceWrapper(candidate, 0, { semantic: false }) }],
  ['wrong_envelope_fingerprint', (candidate, wrapper) => { wrapper.row_value.row_envelope_fingerprint = sha('wrong_envelope'); resealActualEvidenceWrapper(candidate, 0, { envelope: false }) }],
  ['semantic_vs_envelope_fingerprint', (candidate, wrapper) => { wrapper.row_value.evidence_fingerprint = wrapper.row_value.row_envelope_fingerprint; resealActualEvidenceWrapper(candidate, 0, { semantic: false }) }],
]) reject(`ordering_full_schema_${name}`, () => { const candidate = structuredClone(materializedR62), wrapper = evidenceSnapshotOf(candidate).rows[0]; mutate(candidate, wrapper); validateOrderingAuthority(candidate) })
for (const [name, mutate] of [
  ['wrong_workspace', row => { row.workspace_ref = 'wrong_workspace' }],
  ['wrong_subject', row => { row.subject_ref = 'wrong_subject' }],
  ['wrong_case', row => { row.case_ref = 'wrong_case' }],
  ['wrong_snapshot', row => { row.snapshot_fingerprint = sha('wrong_snapshot') }],
  ['wrong_transition', row => { row.transition_id = 'close_preparation' }],
  ['wrong_predecessor', row => { row.predecessor_lifecycle_version_ref = 'wrong_predecessor' }],
  ['wrong_input_set', row => { row.evidence_input_set_seal = sha('wrong_input_set') }],
  ['wrong_evaluator', row => { row.evaluator_id = 'wrong_evaluator' }],
  ['wrong_evaluated_at', row => { row.evaluated_at = '2031-01-02T00:00:00.000Z' }],
  ['expired_currentness', row => { row.valid_until = row.evaluated_at }],
]) reject(`ordering_actual_row_${name}`, () => { const candidate = structuredClone(materializedR62); mutateActualEvidence(candidate, 0, mutate); validateOrderingAuthority(candidate) })
reject('ordering_actual_evaluator_registry_substitution', () => { const candidate = structuredClone(materializedR62); evidenceSnapshotOf(candidate).evaluator_registry_member.artifact_sha256 = sha('substituted_evaluator'); validateOrderingAuthority(candidate) })
reject('ordering_actual_evaluator_registry_expired', () => { const candidate = structuredClone(materializedR62); evidenceSnapshotOf(candidate).evaluator_registry_member.active_until = evidenceSnapshotOf(candidate).evaluated_at; validateOrderingAuthority(candidate) })
reject('ordering_actual_registry_row_substitution', () => { const candidate = structuredClone(materializedR62); evidenceSnapshotOf(candidate).persistence_registry_row.store_path = 'forged_store'; validateOrderingAuthority(candidate) })
reject('ordering_actual_inner_evidence_ref_splice', () => { const candidate = structuredClone(materializedR62); mutateActualEvidence(candidate, 0, row => { const inner = JSON.parse(Buffer.from(row.canonical_evidence_b64url, 'base64url').toString('utf8')); inner.evidence_ref = 'forged_inner_ref'; const bytes = Buffer.from(canonicalR44(inner), 'utf8'); row.canonical_evidence_b64url = bytes.toString('base64url'); row.canonical_evidence_byte_length = bytes.length }); validateOrderingAuthority(candidate) })
reject('ordering_coherent_ref_fingerprint_store_swap', () => {
  const candidate = structuredClone(materializedR62)
  mutateActualEvidence(candidate, 0, row => { row.evidence_ref = 'r62_lifecycle_precondition_evidence_z'; const inner = JSON.parse(Buffer.from(row.canonical_evidence_b64url, 'base64url').toString('utf8')); inner.evidence_ref = row.evidence_ref; const bytes = Buffer.from(canonicalR44(inner), 'utf8'); row.canonical_evidence_b64url = bytes.toString('base64url'); row.canonical_evidence_byte_length = bytes.length })
  const snapshot = evidenceSnapshotOf(candidate), inputs = snapshot.rows.map(wrapper => JSON.parse(Buffer.from(wrapper.row_value.canonical_evidence_b64url, 'base64url').toString('utf8'))).sort((left, right) => cp(left.evidence_ref, right.evidence_ref))
  snapshot.evidence_input_set_seal = sha(Buffer.from(canonicalR44(inputs), 'utf8'))
  snapshot.rows.forEach((wrapper, index) => { wrapper.row_value.evidence_input_set_seal = snapshot.evidence_input_set_seal; resealActualEvidenceWrapper(candidate, index) })
  mutateOrderingPositive(candidate, evidenceFixtureIndex, payload => { payload.precondition_set_seal = snapshot.evidence_input_set_seal; payload.evidence_refs = snapshot.rows.map(wrapper => wrapper.row_value.evidence_ref).sort(cp); payload.evidence_fingerprints = payload.evidence_refs.map(ref => snapshot.rows.find(wrapper => wrapper.row_value.evidence_ref === ref).row_value.evidence_fingerprint) })
  validate(candidate)
})
const outboxAbortRecord = fixtureRecords.find(record => record.fixture.schema_ref === 'outbox.invocation_aborted_before_provider_schema')
assert(outboxAbortRecord, 'outbox_abort_fixture_inventory')
reject('outbox_failed_code_reverse_resealed', () => { const decoded = decodeFixture(materializedR62, outboxAbortRecord.fixture, 'outbox_abort_attack_source'), payload = structuredClone(decoded.payload), schema = materializedR62.outbox.invocation_aborted_before_provider_schema; payload.failed_nonlease_final_recheck_codes = ['payload_changed', 'operation_authority_changed']; payload.abort_reason = 'payload_changed'; payload.abort_fingerprint = declaredTestHash(get(materializedR62, schema.fingerprint_ref), payload); decodeFixture(materializedR62, resealFixture(outboxAbortRecord.fixture, payload), 'outbox_failed_code_reverse') })
const bootstrapWrapper = materializedR62.authority_operation_replay_restart_fixtures.fixtures.map(fixture => fixture.artifact_store_by_role?.proof?.stored_row_value).find(row => row?.canonical_schema_ref === 'case_session_root_bootstrap_proof_schema')
assert(bootstrapWrapper, 'bootstrap_proof_fixture_inventory')
const bootstrapPayload = JSON.parse(Buffer.from(bootstrapWrapper.canonical_bytes_b64url, 'base64url').toString('utf8'))
validateSchema(materializedR62, materializedR62.case_session_root_bootstrap_proof_schema, bootstrapPayload, 'bootstrap_positive')
reject('bootstrap_signer_alias', () => { const payload = structuredClone(bootstrapPayload); payload.signer_2_ref = payload.signer_1_ref; validateSchema(materializedR62, materializedR62.case_session_root_bootstrap_proof_schema, payload, 'bootstrap_alias') })
const enumRefOccurrences = []
for (const record of fixtureRecords) {
  const decoded = decodeFixture(materializedR62, record.fixture, `enum_ref_inventory:${record.row.identity_kind}:${record.kind}`)
  for (const [field, spec] of Object.entries(decoded.schema.properties)) if (spec.enum_ref) enumRefOccurrences.push({ record, decoded, field, spec })
}
assert(enumRefOccurrences.length >= 8, `enum_ref_fixture_inventory:${enumRefOccurrences.length}`)
for (const [probeIndex, probe] of enumRefOccurrences.slice(0, 8).entries()) reject(`enum_ref_${probeIndex + 1}`, () => {
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = `invented_${probe.spec.enum_ref}`; decodeFixture(materializedR62, resealFixture(probe.record.fixture, payload), `enum_ref_attack:${probeIndex}`)
})
const literalOccurrences = []
const minItemOccurrences = []
for (const record of fixtureRecords) {
  const decoded = decodeFixture(materializedR62, record.fixture, `attack_inventory:${record.row.identity_kind}:${record.kind}`)
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
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = wrongLiteral(probe.spec, payload[probe.field]); decodeFixture(materializedR62, resealFixture(probe.record.fixture, payload), `literal_attack:${probeIndex}`)
})
assert(minItemOccurrences.length === 12, `min_items_probe_inventory:${minItemOccurrences.length}`)
for (const [probeIndex, probe] of minItemOccurrences.entries()) reject(`min_items_${probeIndex + 1}`, () => {
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = []; decodeFixture(materializedR62, resealFixture(probe.record.fixture, payload), `min_items_attack:${probeIndex}`)
})

const enrichmentProbe = minItemOccurrences.find(probe => probe.record.fixture.schema_ref === 'authoritative_row_schemas.enrichment_plans' && probe.field === 'source_kind_ids')
const ordinaryFixture = fixtureRecords.find(record => record.fixture.schema_ref === 'authority_operation_hold_store.row_union' && record.fixture.schema_variant === 'ordinary_single_proof')
assert(enrichmentProbe && ordinaryFixture, 'required_target_probe_inventory')
const ordinaryDecoded = decodeFixture(materializedR62, ordinaryFixture.fixture, 'ordinary_target_probe')
const targetProbes = [
  { record: enrichmentProbe.record, decoded: enrichmentProbe.decoded, field: 'source_kind_ids', value: [] },
  { record: ordinaryFixture, decoded: ordinaryDecoded, field: 'raw_target_ref_or_unavailable', value: 'INVALID_LITERAL_OR_SHA' },
  { record: ordinaryFixture, decoded: ordinaryDecoded, field: 'raw_proof_ref_or_unavailable', value: 'INVALID_LITERAL_OR_SHA' },
]
for (const probe of fixtureRecords.filter(record => record.kind === 'target')) {
  const decoded = decodeFixture(materializedR62, probe.fixture, `target_literal_inventory:${probe.row.identity_kind}`)
  const entry = Object.entries(decoded.schema.properties).find(([, spec]) => Object.hasOwn(spec, 'const') || Object.hasOwn(spec, 'literal'))
  if (entry && targetProbes.length < 8) targetProbes.push({ record: probe, decoded, field: entry[0], value: wrongLiteral(entry[1], decoded.payload[entry[0]]) })
}
assert(targetProbes.length === 8, `target_literal_probe_inventory:${targetProbes.length}`)
for (const [probeIndex, probe] of targetProbes.entries()) reject(`target_literal_${probeIndex + 1}`, () => {
  const payload = structuredClone(probe.decoded.payload); payload[probe.field] = probe.value; decodeFixture(materializedR62, resealFixture(probe.record.fixture, payload), `target_literal_attack:${probeIndex}`)
})

const jointRows = index.filter(row => get(materializedR62, row.exact_authority_ref).executable_native_derivation_evidence.joint_source_target_fixture)
assert(jointRows.length === 70, `joint_fixture_count:${jointRows.length}`)
for (const identityId of ['identity_0929', 'identity_0958', 'identity_0973']) {
  const row = index.find(item => item.exact_authority_ref.endsWith(`.${identityId}`))
  assert(row, `exact_joint_identity_inventory:${identityId}`)
  reject(`${identityId}_shared_fixture_dereference`, () => { const candidate = structuredClone(materializedR62), authority = get(candidate, row.exact_authority_ref), shared = get(candidate, authority.executable_native_derivation_evidence.complete_joint_fixture_ref); shared.target_native_fingerprint = sha(`splice:${identityId}`); validateIdentity(candidate, row) })
  reject(`${identityId}_specialized_mapping_splice`, () => { const authority = structuredClone(get(materializedR62, row.exact_authority_ref)); authority.executable_native_derivation_evidence.authority_companion_target_mapping.target_value = sha(`splice:${identityId}:mapping`); validateIdentity(materializedR62, row, authority) })
}
reject('cross_authority_complete_joint_splice', () => { const candidate = structuredClone(materializedR62), first = index.find(item => item.exact_authority_ref.endsWith('.identity_0929')), second = index.find(item => item.exact_authority_ref.endsWith('.identity_0958')), authority = get(candidate, first.exact_authority_ref), foreign = get(candidate, second.exact_authority_ref).executable_native_derivation_evidence.complete_joint_fixture_ref; authority.executable_native_derivation_evidence.complete_joint_fixture_ref = foreign; authority.executable_native_derivation_evidence.joint_source_target_fixture.complete_joint_fixture_ref = foreign; validateIdentity(candidate, first) })
assert(Object.values(materializedR62.authority_operation_conditional_rule_predicate_registry.rows).some(row => row.rule_id === 'rule_0077' && row.evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context'), 'committed_use_release_terminal_ref_not_counted_as_proved')
const ordinaryComplete = Object.entries(materializedR62.authority_operation_complete_joint_equality_fixtures.rows).find(([, row]) => row.equality_source_schema_ref === 'authority_operation_hold_store.row_union' && row.equality_source_schema_variant === 'ordinary_single_proof' && row.equality_source_field === 'result_ref' && row.declared_companion_bytes_fields.some(item => item.field === 'result_bytes_sha256') && row.declared_companion_fingerprint_fields.some(item => item.field === 'result_fingerprint'))
assert(ordinaryComplete, 'ordinary_complete_result_fixture')
reject('ordinary_result_companions_cannot_be_vacuous', () => { const candidate = structuredClone(materializedR62); const row = candidate.authority_operation_complete_joint_equality_fixtures.rows[ordinaryComplete[0]]; row.declared_companion_bytes_fields = []; row.declared_companion_fingerprint_fields = []; row.declared_companion_bytes_count = 0; row.declared_companion_fingerprint_count = 0; validateCompleteJointFixtures(candidate) })
reject('ordinary_result_same_target_bytes_splice', () => { const candidate = structuredClone(materializedR62), row = candidate.authority_operation_complete_joint_equality_fixtures.rows[ordinaryComplete[0]], decoded = decodeFixture(candidate, row.source_fixture, 'ordinary_splice_source'), payload = structuredClone(decoded.payload); payload.result_bytes_sha256 = sha('different_target'); row.source_fixture = resealFixture(row.source_fixture, payload); validateCompleteJointFixtures(candidate) })
reject('ordinary_result_same_target_fingerprint_splice', () => { const candidate = structuredClone(materializedR62), row = candidate.authority_operation_complete_joint_equality_fixtures.rows[ordinaryComplete[0]], decoded = decodeFixture(candidate, row.source_fixture, 'ordinary_splice_fp'), payload = structuredClone(decoded.payload); payload.result_fingerprint = sha('different_target'); row.source_fixture = resealFixture(row.source_fixture, payload); validateCompleteJointFixtures(candidate) })
for (const [probeIndex, row] of jointRows.slice(0, 13).entries()) authorityAttack(`missing_target_identity_${probeIndex + 1}`, row, authority => { authority.executable_native_derivation_evidence.joint_source_target_fixture.target_identity_field = 'missing_native_identity_field' })
for (const [probeIndex, row] of jointRows.slice(13, 18).entries()) authorityAttack(`joint_source_target_splice_${probeIndex + 1}`, row, authority => { authority.executable_native_derivation_evidence.joint_source_target_fixture.target_native_identity = sha(`splice:${probeIndex}`) })
for (const row of index.filter(item => item.row_schema_ref === 'authority_operation_hold_store.row_union' && ['result_ref', 'result_bytes_sha256', 'result_fingerprint'].includes(item.identity_field))) authorityAttack(`hold_role_regression:${row.identity_kind}`, row, authority => { authority.native_identity_role = 'declared_content_address' })

const selectorIds = Object.keys(materializedR62.authority_operation_internal_reference_target_selectors.rows)
function selectorAttack(name, selectorId, mutate) { reject(name, () => { const selector = structuredClone(materializedR62.authority_operation_internal_reference_target_selectors.rows[selectorId]); mutate(selector); validateSelector(materializedR62, selector) }) }
selectorAttack('selector_wrong_operation', selectorIds[0], selector => { selector.exact_source_schema_valid_cases[0].source_operation = 'forged_operation' })
selectorAttack('selector_wrong_branch', selectorIds[1], selector => { selector.exact_source_schema_valid_cases[0].source_result_branch = 'forged_branch' })
selectorAttack('selector_wrong_proof_family', selectorIds[2], selector => { selector.exact_source_schema_valid_cases[0].proof_family = 'forged_proof' })
selectorAttack('selector_wrong_branch_class', selectorIds[3], selector => { selector.exact_source_schema_valid_cases[0].branch_class = 'forged_class' })
selectorAttack('selector_wrong_evidence', selectorIds[4], selector => { selector.exact_source_schema_valid_cases[0].selected_evidence_kind = 'forged_evidence' })
selectorAttack('selector_wrong_store', selectorIds[5], selector => { selector.exact_source_schema_valid_cases[0].target_store = 'forged_store' })
selectorAttack('selector_wrong_selection_row', selectorIds[6], selector => { selector.exact_source_schema_valid_cases[0].fresh_selection_row_id = 'forged_row' })
selectorAttack('selector_zero_target', selectorIds[7], selector => { selector.exact_concrete_cases.pop() })
selectorAttack('selector_multiple_target', selectorIds[8], selector => { selector.exact_concrete_cases.push(structuredClone(selector.exact_concrete_cases[0])) })
reject('conditional_exclusions_empty', () => { const candidate = structuredClone(materializedR62), coverage = candidate.authority_operation_conditional_fixture_coverage; coverage.semantic_or_live_unproved_identity_exclusions = []; coverage.exact_semantic_or_live_unproved_identity_count = 0; validateConditionalAuthority(candidate) })
reject('conditional_exclusion_dropped', () => { const candidate = structuredClone(materializedR62), coverage = candidate.authority_operation_conditional_fixture_coverage; coverage.semantic_or_live_unproved_identity_exclusions.pop(); coverage.exact_semantic_or_live_unproved_identity_count -= 1; validateConditionalAuthority(candidate) })
reject('conditional_exclusion_duplicate', () => { const candidate = structuredClone(materializedR62), coverage = candidate.authority_operation_conditional_fixture_coverage; coverage.semantic_or_live_unproved_identity_exclusions.push(structuredClone(coverage.semantic_or_live_unproved_identity_exclusions[0])); coverage.exact_semantic_or_live_unproved_identity_count += 1; validateConditionalAuthority(candidate) })
reject('conditional_exclusion_substituted_identity', () => { const candidate = structuredClone(materializedR62), coverage = candidate.authority_operation_conditional_fixture_coverage; coverage.semantic_or_live_unproved_identity_exclusions[0].identity_id = 'identity_invented'; validateConditionalAuthority(candidate) })
const nestedQuestionExclusion = materializedR62.authority_operation_conditional_fixture_coverage.semantic_or_live_unproved_identity_exclusions.find(row => row.identity_id === 'identity_0042')
assert(nestedQuestionExclusion?.exact_unproved_rule_paths.some(row => row.selected_schema_path === 'proof_value_schemas.question_contract') && nestedQuestionExclusion.exact_unproved_rule_paths.some(row => row.selected_schema_path === 'proof_value_schemas.question_answer_effect'), 'conditional_nested_question_exclusion_inventory')
reject('conditional_nested_rule_path_dropped', () => { const candidate = structuredClone(materializedR62), row = candidate.authority_operation_conditional_fixture_coverage.semantic_or_live_unproved_identity_exclusions.find(item => item.identity_id === 'identity_0042'); row.exact_unproved_rule_paths.pop(); validateConditionalAuthority(candidate) })
reject('conditional_nested_variant_path_substituted', () => { const candidate = structuredClone(materializedR62), row = candidate.authority_operation_conditional_fixture_coverage.semantic_or_live_unproved_identity_exclusions.find(item => item.identity_id === 'identity_0042'); row.exact_unproved_rule_paths[0].selected_schema_path = 'authority_operation_intervention_inner_payload_schemas.session'; validateConditionalAuthority(candidate) })
reject('conditional_unreachable_question_variant_added_to_session', () => { const candidate = structuredClone(materializedR62), coverage = candidate.authority_operation_conditional_fixture_coverage, question = coverage.semantic_or_live_unproved_identity_exclusions.find(item => item.identity_id === 'identity_0042'); coverage.semantic_or_live_unproved_identity_exclusions.push({ ...structuredClone(question), identity_id: 'identity_0043' }); coverage.exact_semantic_or_live_unproved_identity_count += 1; validateConditionalAuthority(candidate) })
reject('manifest_identity_mutation', () => { const contract = structuredClone(materializedR62); contract.authority_operation_native_identity_applicability_report.exact_native_identity_total += 1; validateManifest(contract) })

console.log(`ok: R62 exact; ${attacks} attacks; 21/21 ordering sites exercise full containing schemas; 2/2 actual R13 lifecycle evidence rows dereference and recompute semantic plus envelope identity; ${baseline.identities.total}/1229 native identities; ${jointRows.length} linked identities share ${materializedR62.authority_operation_complete_joint_equality_fixtures.exact_row_count} complete equality fixtures; ${baseline.conditional.local}+${baseline.conditional.contexts} executed conditional rules and ${baseline.conditional.unproved} honest semantic/live exclusions; ${baseline.selectors} selectors over ${baseline.contexts} source-schema-valid contexts; ${baseline.refs} semantic refs; ${baseline.manifest} manifest rows; frozen R61 preserved`)
