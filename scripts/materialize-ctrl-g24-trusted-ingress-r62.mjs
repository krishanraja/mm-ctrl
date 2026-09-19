import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR53 } from './materialize-ctrl-g24-trusted-ingress-r53.mjs'
import { materializedR61 as materializedR54, materializedR61Output as materializedR54Output, r61SemanticAuthorityPaths as r54SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r61.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r61.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r62.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR54Output) throw new Error('R62_frozen_R61_input_mismatch')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }
const r54 = structuredClone(materializedR54)
const schemaAt = (ref, variant = 'UNAVAILABLE') => { const schema = get(r54, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const TRUSTED_EVIDENCE_RESOLUTION = Symbol('R62_TRUSTED_EVIDENCE_RESOLUTION')
function validationContext(payload, trustedStore = null) {
  const context = { ...payload }
  if (trustedStore) Object.defineProperty(context, TRUSTED_EVIDENCE_RESOLUTION, { value: trustedStore, enumerable: false, writable: false, configurable: false })
  return context
}
function extendValidationContext(context, payload) {
  return validationContext({ ...context, ...payload }, context?.[TRUSTED_EVIDENCE_RESOLUTION] ?? null)
}
function fingerprintPreimage(authority, row) {
  return Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : Object.hasOwn(row, field) ? row[field] : null]))
}
function resolveAuthoritativeEvidenceRow(context, evidenceRef, path) {
  const snapshot = context?.[TRUSTED_EVIDENCE_RESOLUTION]
  if (!snapshot || snapshot !== lifecycleEvidenceSnapshot) throw new Error(`R62_trusted_evidence_context_missing:${path}`)
  const expectedSnapshotKeys = ['evaluated_at', 'evaluator_registry_member', 'evidence_input_set_seal', 'persistence_registry_row', 'rows', 'schema_version', 'snapshot_fingerprint', 'target_store_ref', 'workspace_ref', 'subject_ref', 'case_ref']
  if (canonicalR44(Object.keys(snapshot).sort(cp)) !== canonicalR44(expectedSnapshotKeys.sort(cp))) throw new Error(`R62_evidence_snapshot_keyset:${path}`)
  const registryMatches = r54.authority_operation_normative_persistence_registry.exact_rows.filter(row => row.store_path === snapshot.target_store_ref && row.row_schema_ref === snapshot.target_store_ref)
  if (registryMatches.length !== 1 || canonicalR44(registryMatches[0]) !== canonicalR44(snapshot.persistence_registry_row)) throw new Error(`R62_evidence_persistence_registry_authority:${path}`)
  const decoded = snapshot.rows.map(wrapper => {
    const wrapperKeys = ['canonical_row_bytes_b64url', 'canonical_row_bytes_sha256', 'row_content_ref', 'row_schema_ref', 'row_schema_version', 'row_value', 'target_store_ref']
    if (canonicalR44(Object.keys(wrapper).sort(cp)) !== canonicalR44(wrapperKeys.sort(cp))) throw new Error(`R62_evidence_wrapper_keyset:${path}`)
    if (wrapper.target_store_ref !== snapshot.target_store_ref || wrapper.row_schema_ref !== registryMatches[0].row_schema_ref || wrapper.row_schema_version !== registryMatches[0].row_schema_version) throw new Error(`R62_evidence_row_authority:${path}`)
    const bytes = Buffer.from(wrapper.canonical_row_bytes_b64url, 'base64url')
    if (bytes.toString('base64url') !== wrapper.canonical_row_bytes_b64url || sha(bytes) !== wrapper.canonical_row_bytes_sha256 || wrapper.row_content_ref !== wrapper.canonical_row_bytes_sha256) throw new Error(`R62_evidence_row_content_address:${path}`)
    let row
    try { row = JSON.parse(bytes.toString('utf8')) } catch { throw new Error(`R62_evidence_row_json:${path}`) }
    if (bytes.toString('utf8') !== canonicalR44(row) || canonicalR44(row) !== canonicalR44(wrapper.row_value)) throw new Error(`R62_evidence_row_canonical:${path}`)
    validateSchema(r54.authoritative_row_schemas.lifecycle_precondition_evidence, row, `${path}<resolved:${evidenceRef}>`)
    const semantic = hash(fingerprintPreimage(r54.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, row))
    const envelope = hash(fingerprintPreimage(r54.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, row))
    if (row.evidence_fingerprint !== semantic) throw new Error(`R62_evidence_semantic_fingerprint:${path}`)
    if (row.row_envelope_fingerprint !== envelope) throw new Error(`R62_evidence_envelope_fingerprint:${path}`)
    const evidenceBytes = Buffer.from(row.canonical_evidence_b64url, 'base64url')
    let evidenceInput
    try { evidenceInput = JSON.parse(evidenceBytes.toString('utf8')) } catch { throw new Error(`R62_evidence_input_json:${path}`) }
    if (evidenceBytes.toString('utf8') !== canonicalR44(evidenceInput) || canonicalR44(Object.keys(evidenceInput).sort(cp)) !== canonicalR44(['evidence_ref', 'evidence_value']) || evidenceInput.evidence_ref !== row.evidence_ref || typeof evidenceInput.evidence_value !== 'string' || !evidenceInput.evidence_value.trim()) throw new Error(`R62_evidence_input_lineage:${path}`)
    return { wrapper, row, semantic, envelope, evidenceInput }
  })
  if (sha(Buffer.from(canonicalR44(decoded.map(item => item.evidenceInput).sort((left, right) => cp(left.evidence_ref, right.evidence_ref))), 'utf8')) !== snapshot.evidence_input_set_seal) throw new Error(`R62_evidence_input_set_seal:${path}`)
  const candidates = decoded.filter(item => item.row.evidence_ref === evidenceRef && item.row.workspace_ref === snapshot.workspace_ref && item.row.subject_ref === snapshot.subject_ref && item.row.case_ref === snapshot.case_ref)
  const active = candidates.filter(item => item.row.valid_from <= snapshot.evaluated_at && (!Object.hasOwn(item.row, 'valid_until') || item.row.valid_until > snapshot.evaluated_at))
  active.sort((left, right) => cp(right.row.valid_from, left.row.valid_from) || cp(right.row.row_version_ref, left.row.row_version_ref))
  if (active.length < 1) throw new Error(`R62_evidence_resolution_missing:${path}:${evidenceRef}`)
  if (active.length > 1 && active[0].row.valid_from === active[1].row.valid_from && active[0].row.row_version_ref === active[1].row.row_version_ref) throw new Error(`R62_evidence_resolution_ambiguous:${path}:${evidenceRef}`)
  const selected = active[0], row = selected.row, evaluator = snapshot.evaluator_registry_member
  if (row.snapshot_fingerprint !== snapshot.snapshot_fingerprint || row.transition_id !== context.transition_id || row.predecessor_lifecycle_version_ref !== context.predecessor_lifecycle_version_ref || row.evidence_input_set_seal !== snapshot.evidence_input_set_seal || row.evidence_input_set_seal !== context.precondition_set_seal || row.evaluated_at !== snapshot.evaluated_at) throw new Error(`R62_evidence_operation_lineage:${path}:${evidenceRef}`)
  if (row.evaluator_version_ref !== evaluator.semantic_version || row.evaluator_version_ref !== row.evaluator_semantic_version || row.evaluator_id !== evaluator.evaluator_id || row.evaluator_artifact_sha256 !== evaluator.artifact_sha256 || row.evaluator_manifest_sha256 !== evaluator.manifest_sha256 || context.evaluator_version_ref !== evaluator.semantic_version || context.evaluator_artifact_sha256 !== evaluator.artifact_sha256) throw new Error(`R62_evidence_evaluator_lineage:${path}:${evidenceRef}`)
  if (!(evaluator.active_from <= snapshot.evaluated_at && snapshot.evaluated_at < evaluator.active_until)) throw new Error(`R62_evidence_evaluator_not_current:${path}:${evidenceRef}`)
  const catalogue = r54.lifecycle_precondition_catalog[row.transition_id]
  if (!catalogue || row.required_precondition_id !== catalogue.required_precondition_id || row.precondition_canonical_text !== catalogue.precondition_canonical_text) throw new Error(`R62_evidence_catalogue_lineage:${path}:${evidenceRef}`)
  return { row, wrapper: selected.wrapper, semantic_fingerprint: selected.semantic, envelope_fingerprint: selected.envelope }
}

const SUPPORTED_TYPES = new Set(['array', 'base64url_without_padding', 'boolean', 'canonical_timestamp', 'controlling_watermark_change', 'discriminated_union', 'discriminated_value', 'enum', 'finite_nonnegative_number', 'human_text', 'identifier', 'identifier_or_UNAVAILABLE_literal', 'integer', 'nonnegative_integer', 'nullable', 'object', 'operation_discriminated_object', 'ordered_identifier_array', 'positive_integer', 'safe_nonnegative_integer', 'sha256', 'sha256_or_exact_literal', 'string', 'unicode_sorted_unique_identifier_array'])
function validUnicodeScalars(value) { if (typeof value !== 'string') return false; for (let index = 0; index < value.length; index += 1) { const code = value.charCodeAt(index); if (code >= 0xd800 && code <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) return false; index += 1 } else if (code >= 0xdc00 && code <= 0xdfff) return false } return true }
const LEAF_SPEC_KEYS = new Set(['additional_properties', 'allowed_route_values', 'conditional_max_items', 'const', 'decoded_byte_length', 'description', 'discriminated_by', 'enum', 'enum_ref', 'exact_literals', 'exact_members', 'excluded_fields', 'finite', 'forbidden', 'item_constraints', 'items', 'json_type', 'kind', 'literal', 'max_bytes', 'max_decoded_bytes', 'max_items', 'max_utf8_bytes', 'maximum', 'min_items', 'min_utf8_bytes', 'minimum', 'must_equal_trimmed_value', 'negative_zero_allowed', 'normalization', 'null', 'optional', 'order_semantic', 'ordered_by', 'padding_allowed', 'pattern', 'preserve_exact_value', 'regex', 'requires', 'safe_range_only', 'schema_field', 'schema_ref', 'semantic_validation', 'source', 'trim', 'type', 'unique', 'unique_by', 'uppercase_allowed', 'valid_unicode_scalar_only', 'validation', 'value_schema', 'values', '__registry_json_type'])
for (const definition of Object.values(materializedR54.type_registry ?? {})) if (definition && typeof definition === 'object') for (const key of Object.keys(definition)) LEAF_SPEC_KEYS.add(key)
const LOCAL_RULE_DEFINITIONS = new Map([
  ['atom_kind_question_iff_question_contract_and_question_contract_fingerprint_are_nonnull_and_equal_the_decoded_payload_question_contract', { predicate_kind: 'intervention_question_payload', family: 'intervention_atom' }],
  ['atom_kind_session_iff_question_contract_and_question_contract_fingerprint_are_null', { predicate_kind: 'intervention_session_nulls', family: 'intervention_atom' }],
  ['payload_b64url_decodes_to_exact_canonical_atom_payload_bytes_and_byte_length_and_atom_content_fingerprint_recomputes_over_schema_version_and_bytes', { predicate_kind: 'intervention_payload_bytes', family: 'content_bytes' }],
  ['signer_1_ref_must_not_equal_signer_2_ref', { predicate_kind: 'distinct_signers', family: 'proof_threshold' }],
  ['threshold_is_exactly_2_of_2', { predicate_kind: 'two_signer_shape', family: 'proof_threshold' }],
  ['available_requires_ref_and_sha256_resolving_exact_bounded_opaque_store_row', { predicate_kind: 'availability_pairs', family: 'availability' }],
  ['unavailable_requires_both_exact_UNAVAILABLE_literals', { predicate_kind: 'availability_pairs', family: 'availability' }],
  ['eligible_iff_rejection_reasons_is_empty', { predicate_kind: 'eligible_iff_empty', family: 'selector' }],
  ['chain_position_genesis_iff_append_ordinal_one_and_predecessor_chain_tip_null', { predicate_kind: 'answer_chain', family: 'answer_chain' }],
  ['chain_position_successor_iff_append_ordinal_gt_one_and_predecessor_chain_tip_equals_prior_complete_prefix_fingerprint', { predicate_kind: 'answer_chain', family: 'answer_chain' }],
  ['visible_consequence_and_every_nonnull_pending_human_owned_proposal_are_exact_trimmed_nonempty', { predicate_kind: 'effect_text', family: 'question_effect' }],
  ['case_effect_no_case_change_requires_null_proposal_and_empty_retire_intervention_refs', { predicate_kind: 'no_case_change', family: 'question_effect' }],
  ['visible_wording_rendered_control_payload_material_effect_disclosure_visible_changed_consequence_and_visible_unknown_consequence_are_strings_nonblank_after_trim_but_exact_original_bytes_are_preserved', { predicate_kind: 'question_text', family: 'question_contract' }],
  ['options_or_comparator_contains_unique_exact_trimmed_nonempty_values_and_no_exact_reserved_default_or_offered_honest_exit_key', { predicate_kind: 'question_options', family: 'question_contract' }],
  ['ranked_choice_only_has_maximum_five_options; every_other_grammar_uses_the_operation_intent_byte_limit_only', { predicate_kind: 'ranked_limit', family: 'question_contract' }],
  ['effect_keys_equal_all_honest_exits_plus_every_single_choice_option_or_default_for_other_grammars_plus_default_when_scoped_write_in_true', { predicate_kind: 'question_effect_keys', family: 'question_contract' }],
  ['every_nonnull_pending_human_owned_proposal_and_every_visible_consequence_is_exact_trimmed_nonempty', { predicate_kind: 'question_effect_texts', family: 'question_contract' }],
  ['honest_exit_effects_all_have_no_case_change_null_proposal_and_empty_retirement_refs', { predicate_kind: 'honest_exit_effects', family: 'question_contract' }],
  ['result_ref_is_nonnull_iff_operation_class_is_use_release_and_equals_the_branch_terminal_consumption_ref', { predicate_kind: 'release_result_presence', family: 'result_branch' }],
  ['successful_result_branch_is_nonnull_iff_operation_result_schema_derivation_classifies_the_operation_as_discriminated', { predicate_kind: 'discriminated_result_presence', family: 'result_branch' }],
  ['abort_reason_equals_the_first_member_of_failed_nonlease_final_recheck_codes_in_closed_declared_order', { predicate_kind: 'abort_first_reason', family: 'outbox_abort' }],
  ['response_schema_version_equals_response_union.schemas.held.schema_version_byte_for_byte', { predicate_kind: 'held_response_version', family: 'blob_schema' }],
  ['decoded_b64url_length_and_sha256_equal_the_exact_stored_bytes', { predicate_kind: 'hold_blob_bytes', family: 'content_bytes' }],
  ['decoded_b64url_length_equals_canonical_response_byte_length', { predicate_kind: 'response_blob_length', family: 'content_bytes' }],
  ['sha256_of_exact_decoded_bytes_equals_canonical_response_bytes_sha256', { predicate_kind: 'response_blob_sha', family: 'content_bytes' }],
  ['decoded_b64url_length_equals_canonical_result_payload_byte_length', { predicate_kind: 'result_blob_length', family: 'content_bytes' }],
  ['sha256_of_exact_decoded_bytes_equals_canonical_result_payload_bytes_sha256', { predicate_kind: 'result_blob_sha', family: 'content_bytes' }],
  ['valid_from_equals_consumed_at_and_valid_until_is_absent_at_creation', { predicate_kind: 'terminal_creation_shape', family: 'terminal_consumption' }],
])
const conditionalSites = new Map()
function collectConditionalSites(value, path = '$') {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) { value.forEach((child, index) => collectConditionalSites(child, `${path}[${index}]`)); return }
  for (const rule of value.conditional_rules ?? []) {
    if (typeof rule !== 'string' || !rule) throw new Error(`R62_conditional_rule_not_string:${path}`)
    const sites = conditionalSites.get(rule) ?? []
    sites.push(path)
    conditionalSites.set(rule, sites)
  }
  for (const [key, child] of Object.entries(value)) collectConditionalSites(child, `${path}.${key}`)
}
collectConditionalSites(materializedR54)
const ruleRegistryRows = Object.fromEntries([...conditionalSites].sort((a, b) => cp(a[0], b[0])).map(([rule, sites], index) => {
  const local = LOCAL_RULE_DEFINITIONS.get(rule)
  return [`rule_${String(index + 1).padStart(4, '0')}`, { schema_version: 'ctrl.g24.conditional-rule-predicate.r62.v1', rule_id: `rule_${String(index + 1).padStart(4, '0')}`, exact_rule: rule, predicate_kind: local?.predicate_kind ?? 'resolved_context_required', predicate_family: local?.family ?? 'cross_artifact_or_transaction', evaluation_scope: local ? 'closed_local_payload_and_contract' : 'requires_resolved_external_artifact_or_transaction_context', exact_schema_sites: [...sites].sort(cp), fixture_scope_disposition: local ? 'must_execute_for_every_selected_fixture' : 'typed_exclusion_only_when_selected_fixture_has_no_resolved_external_context', unknown_or_unimplemented: 'reject' }]
}))
const materializedContextRows = {}
for (const ruleId of ['rule_0006', 'rule_0015', 'rule_0077']) { const row = ruleRegistryRows[ruleId]; row.predicate_kind = 'unproved_missing_required_dereferenced_target'; row.predicate_family = 'local_shape_is_insufficient_for_semantic_relation'; row.evaluation_scope = 'requires_resolved_external_artifact_or_transaction_context'; row.fixture_scope_disposition = 'excluded_until_bounded_row_prior_prefix_or_terminal_consumption_is_dereferenced' }
const ruleByText = new Map(Object.values(ruleRegistryRows).map(row => [row.exact_rule, row]))

function strictTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/.test(value)) return false
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value
}

const unsignedUtf8Compare = (left, right) => Buffer.compare(Buffer.from(String(left), 'utf8'), Buffer.from(String(right), 'utf8'))
function orderingKey(rule, item) {
  if (rule === 'unsigned_utf8') return item
  if (rule === 'unsigned_utf8_effect_key') return item?.effect_key
  if (rule === 'kind_class_then_base_kind_or_control_id_unsigned_utf8') return `${item?.kind_class}\u0000${item?.base_kind ?? item?.control_id}`
  if (rule === 'reuse_enrich_ask_session') return ['reuse', 'enrich', 'ask', 'session'].indexOf(item?.route)
  if (rule === 'nonlease_final_recheck_failure_set.values') return r54.outbox.provider_call_gate.nonlease_final_recheck_failure_set.values.indexOf(item)
  return undefined
}
function validateOrdering(spec, value, context, path) {
  if (!spec.ordered_by) return
  const rule = spec.ordered_by
  if (rule === 'matching_evidence_refs') {
    const refs = context.evidence_refs
    if (!Array.isArray(refs) || refs.length !== value.length) throw new Error(`R62_ordering_companion_alignment:${path}`)
    if (new Set(refs).size !== refs.length) throw new Error(`R62_ordering_duplicate_resolved_ref:${path}`)
    for (let index = 0; index < refs.length; index += 1) {
      const resolved = resolveAuthoritativeEvidenceRow(context, refs[index], path)
      if (resolved.semantic_fingerprint !== value[index] || !/^[0-9a-f]{64}$/.test(value[index])) throw new Error(`R62_ordering_evidence_pair_mismatch:${path}:${index}`)
    }
    for (let index = 1; index < refs.length; index += 1) if (unsignedUtf8Compare(refs[index - 1], refs[index]) > 0) throw new Error(`R62_ordering_matching_refs:${path}`)
    return
  }
  const supported = new Set(['unsigned_utf8', 'unsigned_utf8_effect_key', 'kind_class_then_base_kind_or_control_id_unsigned_utf8', 'reuse_enrich_ask_session', 'nonlease_final_recheck_failure_set.values'])
  if (!supported.has(rule)) throw new Error(`R62_unknown_ordering_authority:${path}:${rule}`)
  const keys = value.map(item => orderingKey(rule, item))
  if (keys.some(key => key === undefined || key === -1)) throw new Error(`R62_ordering_key_unresolved:${path}:${rule}`)
  for (let index = 1; index < keys.length; index += 1) {
    const comparison = typeof keys[index] === 'number' ? keys[index - 1] - keys[index] : unsignedUtf8Compare(keys[index - 1], keys[index])
    if (comparison > 0) throw new Error(`R62_ordering_violation:${path}:${rule}`)
  }
}

r54.schema_version = 'ctrl.g24.trusted-ingress.r62.effective.v1'
r54.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r61_vetoed', 'trusted_ingress_r62_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r54.supersedes = { commit: '8c8142ed238fbf285ffc61ee879fb44371e8cc84', tree: '5bb343956c802dd9f186554b83d8f08bda6d7cae', human_blob: '8b014c6a702b5018d48614cada46552a32aa85e3', machine_blob: '63e0fb54624eda1d96fc7511829f1cf9609a7409', qa_blob: 'c6967d5c43c14b6b4ddfea5f243a0893e62cc7eb', checker_blob: '4869bb13bfb08639d2b976133252a6b06b64bc53', materializer_blob: 'd940b9ce3c74246df3f9065df000be7d16d99d87', founder_checker_blob: 'df5d6aacb58c76b7b4d1fa0d512fc6114fe07b2a', adjudication: 'veto' }
r54.materialization = { ...r54.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r62.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['freeze_R61_input', 'remove_synthetic_ordering_evidence_store', 'materialize_actual_R13_lifecycle_precondition_rows_in_existing_normative_store_snapshot', 'create_nonserializable_trusted_resolution_context', 'dereference_current_rows_and_recompute_semantic_and_envelope_fingerprints', 'materialize_full_schema_fixture_for_every_ordering_site', 'mutate_only_ordered_field_and_reseal_dependents', 'finalize_nonderived_authorities', 'snapshot_final_semantic_sources', 'derive_reference_owner_and_manifest', 'seal_output'], no_post_snapshot_source_write: true }
r54.authority_operation_intervention_inner_payload_schemas = {
  schema_version: 'ctrl.g24.intervention-inner-payload-schemas.r62.v1',
  question_schema_ref: 'proof_value_schemas.question_contract',
  session: {
    schema_version: 'ctrl.g24.intervention-session-inner-payload.r62.v1',
    type: 'object',
    exact_keys: ['atom_kind', 'content'],
    required: ['atom_kind', 'content'],
    additional_properties: false,
    properties: { atom_kind: { const: 'session' }, content: { type: 'human_text' } },
  },
  canonical_inner_bytes: 'exact_UTF8_bytes_of_Unicode_codepoint_sorted_canonical_JSON_for_the_selected_closed_inner_schema',
  unknown_kind_schema_or_extra_key: 'reject_materialization_and_hold_without_write',
}

function values(spec) {
  if (!spec) return []
  if (Object.hasOwn(spec, 'const')) return [spec.const]
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal') return [spec.literal]
  if (spec.enum_ref) {
    const resolved = get(r54, spec.enum_ref)
    if (!Array.isArray(resolved) || !resolved.length) throw new Error(`R62_enum_ref_missing_or_empty:${spec.enum_ref}`)
    return resolved
  }
  return spec.values ?? spec.enum ?? []
}
function effectiveSpec(spec) { const base = spec?.type && (r54.type_registry?.[spec.type] ?? r54.base_types?.[spec.type]); return base && typeof base === 'object' ? { ...base, ...spec, type: spec.type, __registry_json_type: base.json_type } : spec }
function referencedSpec(spec) {
  if (spec?.type === 'nullable') return null
  const ref = spec?.schema_ref
  if (!ref) return null
  const resolved = get(r54, ref)
  if (!resolved) throw new Error(`R62_schema_ref_missing:${ref}`)
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
  if (!spec || typeof spec !== 'object') return `r62_${seed}`
  spec = effectiveSpec(spec)
  if (spec.type === 'nullable') return null
  const resolved = referencedSpec(spec)
  if (resolved) { const selected = chooseVariant(resolved, context); return selected.schema?.properties ? schemaPayload(selected.schema, `${seed}_${selected.variant}`, context) : valueForSpec(selected.schema, `${seed}_${selected.variant}`, context) }
  if (Object.hasOwn(spec, 'const')) return spec.const
  if (Object.hasOwn(spec, 'literal')) return spec.literal
  const literals = values(spec)
  if (literals.length) return literals[0]
  const pattern = spec.pattern ?? spec.regex
  if (pattern === '^[0-9a-f]{64}$') return sha(`R62:${seed}`)
  if (pattern === '^[0-9a-f]{32}$') return sha(`R62:${seed}`).slice(0, 32)
  if (spec.type === 'sha256') return sha(`R62:${seed}`)
  if (spec.type === 'sha256_or_exact_literal') return (spec.exact_literals ?? [])[0] ?? sha(`R62:${seed}`)
  if (spec.type === 'canonical_timestamp') return '2031-01-01T00:00:00.000Z'
  if (spec.type === 'base64url_without_padding') return Buffer.from(`R62:${seed}`, 'utf8').toString('base64url')
  if (spec.type === 'boolean') return false
  if (['integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return Math.max(0, spec.minimum ?? 0)
  if (spec.type === 'positive_integer') return Math.max(1, spec.minimum ?? 1)
  if (spec.type === 'array') {
    if (Array.isArray(spec.exact_members)) return structuredClone(spec.exact_members)
    const count = Math.max(0, spec.min_items ?? 0), result = []
    for (let index = 0; index < count; index += 1) result.push(valueForSpec(spec.items ?? { type: 'identifier' }, `${seed}_${index}`, context))
    if (spec.allowed_route_values && result.length) for (let index = 0; index < result.length; index += 1) if (result[index] && typeof result[index] === 'object' && Object.hasOwn(result[index], 'route')) result[index].route = spec.allowed_route_values[index % spec.allowed_route_values.length]
    return result
  }
  if (['ordered_identifier_array', 'ordered_manifest_row_array', 'unicode_sorted_unique_identifier_array'].includes(spec.type)) return []
  const registered = r54.type_registry?.[spec.type]
  if (registered?.variants) { const selected = chooseVariant(registered, context); return schemaPayload(selected.schema, `${seed}_${selected.variant}`, context) }
  if (registered?.json_type === 'object') return schemaPayload(spec, seed, context)
  if (spec.type === 'identifier_or_UNAVAILABLE_literal') return 'UNAVAILABLE'
  if (spec.type === 'object' || spec.properties) return schemaPayload(spec, seed, context)
  const minimum = Math.max(1, spec.min_utf8_bytes ?? 1), maximum = spec.max_utf8_bytes ?? spec.max_bytes ?? 256
  return `r62_${String(seed).replace(/[^a-z0-9_]/gi, '_').slice(-96)}`.padEnd(minimum, 'x').slice(0, maximum)
}
function questionEffect(effectKey, visibleConsequence) {
  return { effect_key: effectKey, case_effect: 'no_case_change', visible_consequence: visibleConsequence, retire_intervention_refs: [], pending_human_owned_proposal: null }
}
function questionContract(seed) {
  const honestExits = ['defer', 'premise_wrong', 'refuse', 'unknown'].sort(cp)
  const option = `Option ${String(seed).replace(/[^a-z0-9]/gi, '').slice(-12) || 'one'}`
  const effects = [...honestExits, option].sort(cp).map(key => questionEffect(key, `Consequence for ${key}`))
  const payload = { visible_wording: 'What should change?', rendered_control_payload: 'Choose one answer.', answer_grammar: 'single_choice', options_or_comparator: [option], scoped_write_in: false, honest_exits: honestExits, material_effect_disclosure: 'This changes the staged answer only.', visible_changed_consequence: 'The staged answer changes.', visible_unknown_consequence: 'The question remains open.', answer_effects: effects, question_contract_fingerprint: sha('temporary') }
  const authority = r54.fingerprint_schemas.question_contract
  const preimage = Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : payload[field]]))
  payload.question_contract_fingerprint = hash(preimage)
  return payload
}
function declaredHash(authority, payload) { const preimage = Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : payload[field]])); return hash(preimage) }
function normalizePayloadForLocalRules(schema, payload, seed) {
  const rules = new Set(schema.conditional_rules ?? [])
  for (const [field, availability] of Object.entries(payload)) {
    if (!field.endsWith('_availability') || !['available', 'unavailable'].includes(availability)) continue
    const stem = field.slice(0, -'_availability'.length)
    const refField = `${stem}_ref_or_unavailable`
    const shaField = `${stem}_sha256_or_unavailable`
    if (!Object.hasOwn(payload, refField) || !Object.hasOwn(payload, shaField)) continue
    if (availability === 'available') {
      payload[refField] = sha(`R62:${seed}:${refField}`)
      payload[shaField] = sha(`R62:${seed}:${shaField}`)
    } else {
      payload[refField] = 'UNAVAILABLE'
      payload[shaField] = 'UNAVAILABLE'
    }
  }
  if (rules.has('signer_1_ref_must_not_equal_signer_2_ref') && payload.signer_1_ref === payload.signer_2_ref) payload.signer_2_ref = `${payload.signer_1_ref}_two`
  if (rules.has('atom_kind_question_iff_question_contract_and_question_contract_fingerprint_are_nonnull_and_equal_the_decoded_payload_question_contract')) {
    if (payload.atom_kind === 'question') {
      payload.question_contract = questionContract(seed)
      payload.question_contract_fingerprint = payload.question_contract.question_contract_fingerprint
      payload.payload_schema_version = r54.proof_value_schemas.question_contract.schema_version
      const bytes = Buffer.from(canonicalR44(payload.question_contract), 'utf8')
      payload.payload_b64url = bytes.toString('base64url')
      payload.payload_byte_length = bytes.length
      payload.atom_content_fingerprint = declaredHash(r54.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload)
    } else {
      payload.question_contract = null
      payload.question_contract_fingerprint = null
      payload.payload_schema_version = r54.authority_operation_intervention_inner_payload_schemas.session.schema_version
      const bytes = Buffer.from(canonicalR44({ atom_kind: 'session', content: payload.content }), 'utf8')
      payload.payload_b64url = bytes.toString('base64url')
      payload.payload_byte_length = bytes.length
      payload.atom_content_fingerprint = declaredHash(r54.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload)
    }
  }
  if (rules.has('eligible_iff_rejection_reasons_is_empty')) payload.eligible = Array.isArray(payload.rejection_reasons) && payload.rejection_reasons.length === 0
  if (rules.has('successful_result_branch_is_nonnull_iff_operation_result_schema_derivation_classifies_the_operation_as_discriminated')) {
    if (payload.operation_class === 'use_release') payload.successful_result_branch = 'pending_delivery'
    else if (payload.operation_class === 'approve_intervention') payload.successful_result_branch = 'approved'
    else payload.successful_result_branch = null
  }
  if (rules.has('result_ref_is_nonnull_iff_operation_class_is_use_release_and_equals_the_branch_terminal_consumption_ref')) payload.result_ref = payload.operation_class === 'use_release' ? (payload.result_ref ?? sha(`R62:${seed}:terminal_consumption_ref`)) : null
  if (rules.has('chain_position_genesis_iff_append_ordinal_one_and_predecessor_chain_tip_null')) {
    if (payload.append_ordinal === 1) { payload.chain_position = 'genesis'; payload.predecessor_chain_tip = null }
    else if (payload.append_ordinal > 1) payload.chain_position = 'successor'
  }
  if (rules.has('case_effect_no_case_change_requires_null_proposal_and_empty_retire_intervention_refs') && payload.case_effect === 'no_case_change') { payload.pending_human_owned_proposal = null; payload.retire_intervention_refs = [] }
  if (rules.has('abort_reason_equals_the_first_member_of_failed_nonlease_final_recheck_codes_in_closed_declared_order') && payload.failed_nonlease_final_recheck_codes?.length) payload.abort_reason = payload.failed_nonlease_final_recheck_codes[0]
  if (rules.has('response_schema_version_equals_response_union.schemas.held.schema_version_byte_for_byte')) payload.response_schema_version = r54.response_union.schemas.held.schema_version
  if (rules.has('decoded_b64url_length_and_sha256_equal_the_exact_stored_bytes')) {
    const bytes = Buffer.from(payload.canonical_hold_response_b64url, 'base64url'); payload.canonical_hold_response_byte_length = bytes.length; payload.canonical_hold_response_bytes_sha256 = sha(bytes)
  }
  if (rules.has('decoded_b64url_length_equals_canonical_response_byte_length')) {
    const bytes = Buffer.from(payload.canonical_response_b64url, 'base64url'); payload.canonical_response_byte_length = bytes.length; payload.canonical_response_bytes_sha256 = sha(bytes)
  }
  if (rules.has('decoded_b64url_length_equals_canonical_result_payload_byte_length')) {
    const bytes = Buffer.from(payload.canonical_result_payload_b64url, 'base64url'); payload.canonical_result_payload_byte_length = bytes.length; payload.canonical_result_payload_bytes_sha256 = sha(bytes)
  }
}
function schemaPayload(schema, seed, context = {}) {
  const payload = {}
  for (const [field, spec] of Object.entries(schema.properties ?? {})) { if ((schema.optional ?? []).includes(field) && !(schema.required ?? []).includes(field)) continue; payload[field] = Object.hasOwn(context, field) && (!values(spec).length || values(spec).includes(context[field])) ? context[field] : valueForSpec(spec, `${seed}_${field}`, context) }
  normalizePayloadForLocalRules(schema, payload, seed)
  return payload
}
function validateSpec(spec, value, path, context = {}) {
  spec = effectiveSpec(spec)
  if (!spec || typeof spec !== 'object') throw new Error(`R62_invalid_schema_spec:${path}`)
  if (spec.type && !SUPPORTED_TYPES.has(spec.type)) throw new Error(`R62_unknown_type:${path}:${spec.type}`)
  if (!spec.properties && !spec.variants) for (const key of Object.keys(spec)) if (!LEAF_SPEC_KEYS.has(key)) throw new Error(`R62_unknown_schema_spec_key:${path}:${key}`)
  if (spec.type === 'nullable') {
    if (value === null) return
    if (!spec.value_schema) throw new Error(`R62_nullable_schema_missing:${path}`)
    validateSpec(spec.value_schema, value, `${path}<nonnull>`, context)
    return
  }
  if (spec.type === 'identifier_or_UNAVAILABLE_literal') { if (value !== 'UNAVAILABLE') validateSpec({ type: 'identifier' }, value, `${path}<identifier>`, context); return }
  if (spec.type === 'controlling_watermark_change') { const registry = r54.type_registry.controlling_watermark_change, variant = registry.variants?.[value?.kind_class]; if (!variant) throw new Error(`R62_watermark_variant:${path}`); validateSchema(variant, value, `${path}<${value.kind_class}>`, context); return }
  if (spec.type === 'discriminated_value') { const selected = spec.variants?.[context[spec.discriminator_source_field]]; if (!selected) throw new Error(`R62_discriminated_value:${path}`); validateSpec(selected, value, `${path}<${context[spec.discriminator_source_field]}>`, context); return }
  if (spec.type === 'discriminated_union') { const variant = spec.variants?.[value?.[spec.discriminator]]; if (!variant) throw new Error(`R62_union_variant:${path}`); validateSchema(variant, value, `${path}<${value[spec.discriminator]}>`, context); return }
  if (spec.type === 'operation_discriminated_object') { const operation = context.operation_class; const intent = r54.operation_specs?.[operation]?.intent; if (!intent) throw new Error(`R62_operation_intent:${path}:${operation}`); validateSpec(intent, value, `${path}<${operation}>`, context); return }
  const resolved = referencedSpec(spec)
  if (resolved) { const selected = chooseVariant(resolved, value && typeof value === 'object' ? value : context); if (selected.schema?.properties) validateSchema(selected.schema, value, `${path}<${selected.variant}>`, context); else validateSpec(selected.schema, value, `${path}<${selected.variant}>`, context); return }
  if (Object.hasOwn(spec, 'const') && value !== spec.const) throw new Error(`R62_const:${path}`)
  if (Object.hasOwn(spec, 'literal') && spec.type !== 'sha256_or_exact_literal' && value !== spec.literal) throw new Error(`R62_literal:${path}`)
  const allowed = values(spec)
  if (allowed.length && !allowed.includes(value)) throw new Error(`R62_enum:${path}`)
  const registeredJsonType = spec.__registry_json_type ?? r54.type_registry?.[spec.type]?.json_type
  const acceptedJsonTypes = Array.isArray(registeredJsonType) ? registeredJsonType : registeredJsonType ? [registeredJsonType] : []
  if (acceptedJsonTypes.length && !acceptedJsonTypes.includes('schema_value')) {
    const actualJsonType = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isSafeInteger(value) ? 'integer' : typeof value === 'number' ? 'number' : typeof value
    if (!acceptedJsonTypes.includes(actualJsonType) && !(actualJsonType === 'integer' && acceptedJsonTypes.includes('number'))) throw new Error(`R62_json_type:${path}:${actualJsonType}`)
  }
  if (spec.type === 'sha256' && !(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value))) throw new Error(`R62_sha256:${path}`)
  if (spec.type === 'sha256_or_exact_literal' && !(typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || [spec.literal, spec.const, ...(spec.exact_literals ?? [])].filter(item => item !== undefined).includes(value)))) throw new Error(`R62_sha256_or_literal:${path}`)
  if (['identifier', 'human_text', 'literal'].includes(spec.type) && typeof value !== 'string') throw new Error(`R62_string:${path}`)
  if (spec.type === 'identifier' && (value !== value.trim() || value.normalize('NFC') !== value || /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(value))) throw new Error(`R62_identifier_normalization:${path}`)
  if (spec.type === 'canonical_timestamp' && !strictTimestamp(value)) throw new Error(`R62_time:${path}`)
  if (spec.type === 'base64url_without_padding' && !(typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && !value.includes('=') && value.length % 4 !== 1 && Buffer.from(value, 'base64url').toString('base64url') === value)) throw new Error(`R62_base64url:${path}`)
  if (spec.type === 'boolean' && typeof value !== 'boolean') throw new Error(`R62_boolean:${path}`)
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec.type) && !(Number.isSafeInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0))) throw new Error(`R62_integer:${path}`)
  if (spec.type === 'finite_nonnegative_number' && !(Number.isFinite(value) && value >= 0 && !Object.is(value, -0))) throw new Error(`R62_number:${path}`)
  if (spec.minimum !== undefined && value < spec.minimum) throw new Error(`R62_minimum:${path}`)
  if (spec.maximum !== undefined && value > spec.maximum) throw new Error(`R62_maximum:${path}`)
  if (spec.type === 'array') {
    if (!Array.isArray(value)) throw new Error(`R62_array:${path}`)
    if (spec.min_items !== undefined && value.length < spec.min_items) throw new Error(`R62_min_items:${path}`)
    if (spec.max_items !== undefined && value.length > spec.max_items) throw new Error(`R62_max_items:${path}`)
    value.forEach((item, index) => validateSpec(spec.items ?? { type: 'identifier' }, item, `${path}.${index}`, context))
    if (spec.unique && new Set(value.map(item => canonicalR44(item))).size !== value.length) throw new Error(`R62_unique:${path}`)
    if (spec.unique_by && new Set(value.map(item => item?.[spec.unique_by])).size !== value.length) throw new Error(`R62_unique_by:${path}`)
    if (spec.allowed_route_values && value.some(item => !spec.allowed_route_values.includes(item?.route))) throw new Error(`R62_route:${path}`)
    if (Array.isArray(spec.exact_members) && canonicalR44([...value].sort(cp)) !== canonicalR44([...spec.exact_members].sort(cp))) throw new Error(`R62_exact_members:${path}`)
    for (const constraint of spec.item_constraints ?? []) {
      if (constraint === 'string' && value.some(item => typeof item !== 'string')) throw new Error(`R62_item_string:${path}`)
      else if (constraint === 'exact_trimmed_nonempty' && value.some(item => typeof item !== 'string' || !item.trim() || item !== item.trim())) throw new Error(`R62_item_trimmed_nonempty:${path}`)
      else if (constraint === 'not_exact_reserved_default_or_offered_honest_exit') {
        const reserved = new Set(['default', 'unknown', 'defer', 'refuse', 'premise_wrong'])
        if (value.some(item => reserved.has(item))) throw new Error(`R62_item_reserved:${path}`)
      } else if (!['string', 'exact_trimmed_nonempty', 'not_exact_reserved_default_or_offered_honest_exit'].includes(constraint)) throw new Error(`R62_unknown_item_constraint:${path}:${constraint}`)
    }
    validateOrdering(spec, value, context, path)
  }
  if (['ordered_identifier_array', 'unicode_sorted_unique_identifier_array'].includes(spec.type)) {
    if (!Array.isArray(value)) throw new Error(`R62_ordered_identifier_array:${path}`)
    for (const [index, item] of value.entries()) validateSpec({ type: 'identifier' }, item, `${path}.${index}`, context)
    if (new Set(value).size !== value.length || canonicalR44([...value].sort(cp)) !== canonicalR44(value)) throw new Error(`R62_ordered_identifier_array_order:${path}`)
  }
  if ((spec.type === 'object' || spec.properties) && (value === null || typeof value !== 'object' || Array.isArray(value))) throw new Error(`R62_object:${path}`)
  if (spec.type === 'object' || spec.properties) validateSchema(spec, value, path, context)
  if (typeof value === 'string') {
    if (spec.valid_unicode_scalar_only && !validUnicodeScalars(value)) throw new Error(`R62_unicode_scalar:${path}`)
    const bytes = Buffer.byteLength(value, 'utf8')
    if (spec.min_utf8_bytes !== undefined && bytes < spec.min_utf8_bytes) throw new Error(`R62_min_utf8_bytes:${path}`)
    if ((spec.max_utf8_bytes ?? spec.max_bytes) !== undefined && bytes > (spec.max_utf8_bytes ?? spec.max_bytes)) throw new Error(`R62_max_utf8_bytes:${path}`)
    const pattern = spec.pattern ?? spec.regex
    if (pattern && !new RegExp(pattern, 'u').test(value)) throw new Error(`R62_pattern:${path}`)
    if (spec.max_decoded_bytes !== undefined && (!(typeof value === 'string' && /^[A-Za-z0-9_-]*$/.test(value) && value.length % 4 !== 1 && Buffer.from(value, 'base64url').toString('base64url') === value) || Buffer.from(value, 'base64url').length > spec.max_decoded_bytes)) throw new Error(`R62_max_decoded_bytes:${path}`)
  }
}
function requireRule(condition, path, kind) { if (!condition) throw new Error(`R62_conditional_${kind}:${path}`) }
function evaluateLocalRule(ruleRow, schema, payload, path) {
  const kind = ruleRow.predicate_kind
  if (kind === 'intervention_payload_bytes') {
    const bytes = Buffer.from(payload.payload_b64url, 'base64url')
    requireRule(bytes.toString('base64url') === payload.payload_b64url && payload.payload_byte_length === bytes.length, path, kind)
    let decoded = null
    try { decoded = JSON.parse(bytes.toString('utf8')) } catch {}
    requireRule(decoded !== null && bytes.toString('utf8') === canonicalR44(decoded), path, `${kind}_canonical_inner`)
    if (payload.atom_kind === 'question') { requireRule(payload.payload_schema_version === r54.proof_value_schemas.question_contract.schema_version, path, `${kind}_question_schema_version`); validateSchema(r54.proof_value_schemas.question_contract, decoded, `${path}.decoded_question`) }
    else if (payload.atom_kind === 'session') { requireRule(payload.payload_schema_version === r54.authority_operation_intervention_inner_payload_schemas.session.schema_version, path, `${kind}_session_schema_version`); validateSchema(r54.authority_operation_intervention_inner_payload_schemas.session, decoded, `${path}.decoded_session`) }
    else requireRule(false, path, `${kind}_unknown_atom_kind`)
    requireRule(payload.atom_content_fingerprint === declaredHash(r54.authoritative_semantic_fingerprint_schemas.intervention_atoms, payload), path, `${kind}_fingerprint`)
  } else if (kind === 'intervention_question_payload') {
    let decoded = null
    try { decoded = JSON.parse(Buffer.from(payload.payload_b64url, 'base64url').toString('utf8')) } catch {}
    const question = payload.atom_kind === 'question'
    requireRule(question === (payload.question_contract !== null && payload.question_contract_fingerprint !== null), path, kind)
    if (question) { const bytes = Buffer.from(payload.payload_b64url, 'base64url'); requireRule(bytes.toString('utf8') === canonicalR44(decoded), path, `${kind}_canonical`); validateSchema(r54.proof_value_schemas.question_contract, decoded, `${path}.decoded_question`); requireRule(canonicalR44(decoded) === canonicalR44(payload.question_contract) && payload.question_contract_fingerprint === payload.question_contract.question_contract_fingerprint && payload.question_contract_fingerprint === declaredHash(r54.fingerprint_schemas.question_contract, payload.question_contract), path, `${kind}_decoded`) }
  } else if (kind === 'intervention_session_nulls') { requireRule((payload.atom_kind === 'session') === (payload.question_contract === null && payload.question_contract_fingerprint === null), path, kind); if (payload.atom_kind === 'session') { const bytes = Buffer.from(payload.payload_b64url, 'base64url'); let decoded; try { decoded = JSON.parse(bytes.toString('utf8')) } catch {}; requireRule(bytes.toString('utf8') === canonicalR44(decoded), path, `${kind}_canonical`); validateSchema(r54.authority_operation_intervention_inner_payload_schemas.session, decoded, `${path}.decoded_session`); requireRule(decoded?.atom_kind === 'session' && decoded?.content === payload.content, path, `${kind}_decoded_content`) } }
  else if (kind === 'distinct_signers') requireRule(payload.signer_1_ref !== payload.signer_2_ref, path, kind)
  else if (kind === 'two_signer_shape') requireRule(['signer_1_ref', 'signer_1_signature_b64url', 'signer_2_ref', 'signer_2_signature_b64url'].every(field => typeof payload[field] === 'string' && payload[field].length > 0), path, kind)
  else if (kind === 'availability_pairs') {
    for (const [field, availability] of Object.entries(payload).filter(([field]) => field.endsWith('_availability'))) {
      const stem = field.slice(0, -'_availability'.length), ref = payload[`${stem}_ref_or_unavailable`], digest = payload[`${stem}_sha256_or_unavailable`]
      if (availability === 'available') requireRule(ref !== 'UNAVAILABLE' && digest !== 'UNAVAILABLE' && /^[0-9a-f]{64}$/.test(digest), path, `${kind}_${stem}_available`)
      if (availability === 'unavailable') requireRule(ref === 'UNAVAILABLE' && digest === 'UNAVAILABLE', path, `${kind}_${stem}_unavailable`)
    }
  } else if (kind === 'eligible_iff_empty') requireRule(payload.eligible === (payload.rejection_reasons.length === 0), path, kind)
  else if (kind === 'answer_chain') requireRule(payload.append_ordinal === 1 ? payload.chain_position === 'genesis' && payload.predecessor_chain_tip === null : payload.append_ordinal > 1 && payload.chain_position === 'successor' && payload.predecessor_chain_tip !== null, path, kind)
  else if (kind === 'effect_text') requireRule(typeof payload.visible_consequence === 'string' && payload.visible_consequence.length > 0 && payload.visible_consequence === payload.visible_consequence.trim() && (payload.pending_human_owned_proposal === null || (typeof payload.pending_human_owned_proposal === 'string' && payload.pending_human_owned_proposal.length > 0 && payload.pending_human_owned_proposal === payload.pending_human_owned_proposal.trim())), path, kind)
  else if (kind === 'no_case_change') { if (payload.case_effect === 'no_case_change') requireRule(payload.pending_human_owned_proposal === null && payload.retire_intervention_refs.length === 0, path, kind) }
  else if (kind === 'question_text') requireRule(['visible_wording', 'rendered_control_payload', 'material_effect_disclosure', 'visible_changed_consequence', 'visible_unknown_consequence'].every(field => typeof payload[field] === 'string' && payload[field].trim().length > 0), path, kind)
  else if (kind === 'question_options') { const reserved = new Set(['default', ...(payload.honest_exits ?? [])]); requireRule(payload.options_or_comparator.every(value => typeof value === 'string' && value === value.trim() && value.length > 0 && !reserved.has(value)) && new Set(payload.options_or_comparator).size === payload.options_or_comparator.length, path, kind) }
  else if (kind === 'ranked_limit') requireRule(payload.answer_grammar !== 'ranked_choice' || payload.options_or_comparator.length <= 5, path, kind)
  else if (kind === 'question_effect_keys') { const expected = new Set(payload.honest_exits); if (payload.answer_grammar === 'single_choice') payload.options_or_comparator.forEach(value => expected.add(value)); else expected.add('default'); if (payload.scoped_write_in) expected.add('default'); requireRule(canonicalR44([...expected].sort(cp)) === canonicalR44(payload.answer_effects.map(effect => effect.effect_key).sort(cp)), path, kind) }
  else if (kind === 'question_effect_texts') requireRule(payload.answer_effects.every(effect => typeof effect.visible_consequence === 'string' && effect.visible_consequence.length > 0 && effect.visible_consequence === effect.visible_consequence.trim() && (effect.pending_human_owned_proposal === null || (typeof effect.pending_human_owned_proposal === 'string' && effect.pending_human_owned_proposal.length > 0 && effect.pending_human_owned_proposal === effect.pending_human_owned_proposal.trim()))), path, kind)
  else if (kind === 'honest_exit_effects') requireRule(payload.answer_effects.filter(effect => payload.honest_exits.includes(effect.effect_key)).every(effect => effect.case_effect === 'no_case_change' && effect.pending_human_owned_proposal === null && effect.retire_intervention_refs.length === 0), path, kind)
  else if (kind === 'release_result_presence') requireRule((payload.result_ref !== null) === (payload.operation_class === 'use_release'), path, kind)
  else if (kind === 'discriminated_result_presence') { const discriminated = Object.hasOwn(r54.operation_result_schema_derivation.discriminated_results, payload.operation_class); requireRule((payload.successful_result_branch !== null) === discriminated, path, kind) }
  else if (kind === 'abort_first_reason') requireRule(Array.isArray(payload.failed_nonlease_final_recheck_codes) && payload.failed_nonlease_final_recheck_codes.length > 0 && payload.abort_reason === payload.failed_nonlease_final_recheck_codes[0], path, kind)
  else if (kind === 'held_response_version') requireRule(payload.response_schema_version === r54.response_union.schemas.held.schema_version, path, kind)
  else if (kind === 'hold_blob_bytes') { const bytes = Buffer.from(payload.canonical_hold_response_b64url, 'base64url'); requireRule(payload.canonical_hold_response_byte_length === bytes.length && payload.canonical_hold_response_bytes_sha256 === sha(bytes), path, kind) }
  else if (kind === 'response_blob_length') requireRule(payload.canonical_response_byte_length === Buffer.from(payload.canonical_response_b64url, 'base64url').length, path, kind)
  else if (kind === 'response_blob_sha') { const bytes = Buffer.from(payload.canonical_response_b64url, 'base64url'); requireRule(payload.canonical_response_bytes_sha256 === sha(bytes), path, kind) }
  else if (kind === 'result_blob_length') requireRule(payload.canonical_result_payload_byte_length === Buffer.from(payload.canonical_result_payload_b64url, 'base64url').length, path, kind)
  else if (kind === 'result_blob_sha') { const bytes = Buffer.from(payload.canonical_result_payload_b64url, 'base64url'); requireRule(payload.canonical_result_payload_bytes_sha256 === sha(bytes), path, kind) }
  else if (kind === 'terminal_creation_shape') requireRule(payload.valid_from === payload.consumed_at && !Object.hasOwn(payload, 'valid_until'), path, kind)
  else throw new Error(`R62_unknown_local_predicate:${kind}`)
}
function validateSchema(schema, payload, path, context = {}) {
  if (!schema?.properties || payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw new Error(`R62_schema_object:${path}`)
  const actual = Object.keys(payload).sort(cp), allowed = (schema.exact_keys ?? Object.keys(schema.properties)).sort(cp)
  if (schema.additional_properties === false && actual.some(field => !allowed.includes(field))) throw new Error(`R62_exact_keys:${path}`)
  for (const field of schema.required ?? []) if (!Object.hasOwn(payload, field)) throw new Error(`R62_required:${path}.${field}`)
  for (const [field, spec] of Object.entries(schema.properties)) if (Object.hasOwn(payload, field)) validateSpec(spec, payload[field], `${path}.${field}`, extendValidationContext(context, payload))
  if (schema.max_canonical_bytes !== undefined && Buffer.byteLength(canonicalR44(payload), 'utf8') > schema.max_canonical_bytes) throw new Error(`R62_max_canonical_bytes:${path}`)
  if (schema.max_bytes !== undefined && Buffer.byteLength(canonicalR44(payload), 'utf8') > schema.max_bytes) throw new Error(`R62_row_max_bytes:${path}`)
  for (const [field, value] of Object.entries(payload)) {
    if (field.endsWith('_length') && Object.hasOwn(payload, field.replace(/_length$/, '_b64url'))) {
      const raw = Buffer.from(payload[field.replace(/_length$/, '_b64url')], 'base64url'); if (value !== raw.length) throw new Error(`R62_length_equality:${path}.${field}`)
    }
  }
  for (const rule of schema.conditional_rules ?? []) {
    const row = ruleByText.get(rule)
    if (!row || row.unknown_or_unimplemented !== 'reject') throw new Error(`R62_conditional_rule_not_closed:${path}:${rule}`)
    if (row.evaluation_scope === 'closed_local_payload_and_contract') evaluateLocalRule(row, schema, payload, path)
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
    else if ((schema.optional ?? []).includes(field)) preimage[field] = null
    else throw new Error(`R62_fingerprint_operand_missing:${schema.fingerprint_ref}:${field}`)
  }
  const expected = hash(preimage)
  payload[schema.fingerprint_field] = expected
  return { authority_ref: schema.fingerprint_ref, codec_ref: authority.field_encoding_ref ?? authority.codec_ref ?? 'canonical_json_utf8_encoding', exact_preimage_order: [...authority.preimage_order], exact_preimage: preimage, expected_fingerprint: expected }
}
function committedVersion(schemaRef, schema, payload) {
  const store = schemaRef.split('.').at(-1), selected = r54.authority_operation_committed_target_identity_authority.variants?.[store]
  if (!selected || selected.row_schema_ref !== schemaRef) return null
  const excluded = new Set(['row_version_ref', schema.fingerprint_field])
  const ordered = Object.keys(schema.properties).filter(field => !excluded.has(field)).map(field => ({ field, value: Object.hasOwn(payload, field) ? payload[field] : null }))
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
  if (!schema?.properties) throw new Error(`R62_fixture_schema_missing:${schemaRef}:${variant}`)
  const payload = schemaPayload(schema, seed, context)
  let selectedPayload = null
  let selectedPayloadSchemaRef = null
  let selectedPayloadSchemaVariant = 'UNAVAILABLE'
  let declaredContentAddress = null
  const rule = nativeContentRule(schema)
  if (rule === 'artifact_ref_equals_opaque_bytes_sha256') {
    const bytes = Buffer.from(`R62-OPAQUE:${seed}`, 'utf8'), digest = sha(bytes)
    payload.opaque_bytes_b64url = bytes.toString('base64url'); payload.opaque_bytes_length = bytes.length; payload.opaque_bytes_sha256 = digest; payload.artifact_ref = digest
    declaredContentAddress = { authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', rule, exact_operand_name: 'opaque_bytes', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest, equal_fields: ['artifact_ref', 'opaque_bytes_sha256'] }
  } else if (rule === 'artifact_ref_equals_canonical_bytes_sha256') {
    selectedPayloadSchemaRef = schema.properties.canonical_schema_ref?.const
    let selectedSchema = get(r54, selectedPayloadSchemaRef)
    if (!selectedSchema?.properties && selectedSchema?.variants) { selectedPayloadSchemaVariant = context.__payload_variant && selectedSchema.variants[context.__payload_variant] ? context.__payload_variant : chooseVariant(selectedSchema, context).variant; selectedSchema = selectedSchema.variants[selectedPayloadSchemaVariant] }
    if (!selectedSchema?.properties) throw new Error(`R62_canonical_payload_schema_missing:${selectedPayloadSchemaRef}`)
    selectedPayload = schemaPayload(selectedSchema, `${seed}_selected_payload`, context)
    const selectedFingerprint = fingerprint(selectedSchema, selectedPayload)
    const bytes = Buffer.from(canonicalR44(selectedPayload), 'utf8'), digest = sha(bytes)
    payload.canonical_bytes_b64url = bytes.toString('base64url'); payload.canonical_bytes_length = bytes.length; payload.canonical_bytes_sha256 = digest; payload.artifact_ref = digest
    payload.parsed_content_fingerprint = selectedFingerprint?.expected_fingerprint ?? hash({ domain_ascii: 'CTRL-G24-R62-PARSED-CONTENT', canonical_bytes_sha256: digest })
    declaredContentAddress = { authority_ref: 'authority_operation_persisted_identity_primitives.canonical_payload_content_address', rule, selected_payload_schema_ref: selectedPayloadSchemaRef, selected_payload_schema_variant: selectedPayloadSchemaVariant, selected_payload: selectedPayload, exact_operand_name: 'canonical_payload_bytes_utf8', exact_operand_b64url: bytes.toString('base64url'), expected_identity: digest, equal_fields: ['artifact_ref', 'canonical_bytes_sha256'] }
  }
  const rowVersion = Object.hasOwn(payload, 'row_version_ref') ? committedVersion(schemaRef, schema, payload) : null
  let rowRef = null
  if (schema.row_ref_derivation && Array.isArray(schema.row_ref_preimage_included_fields)) {
    const preimage = { domain_ascii: schema.row_ref_domain_ascii }
    for (const field of schema.row_ref_preimage_included_fields) preimage[field] = payload[field]
    const expected = hash(preimage), preferredField = schema.row_ref_derivation.startsWith('hold_row_ref_') ? 'hold_row_ref' : schema.row_ref_derivation.startsWith('registry_row_ref_') ? 'registry_row_ref' : null
    const field = preferredField ?? Object.keys(schema.properties).find(name => schema.row_ref_preimage_excluded_fields?.includes(name) && name.endsWith('_ref'))
    if (!field) throw new Error(`R62_row_ref_field_missing:${schemaRef}:${variant}`)
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
    if (allowed.length && !allowed.includes(context[dimension])) { if (strict) throw new Error(`R62_selector_dimension_not_accepted:${field}:${context[dimension]}`); continue }
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
  const selectorId = `selector_r62_${row.identity_field}`, selectorRef = `authority_operation_joint_identity_selector_contexts.rows.${selectorId}`
  syntheticSelectorRows[selectorId] = { schema_version: 'ctrl.g24.joint-identity-selector-context.r62.v1', selector_id: selectorId, source_schema_ref: row.row_schema_ref, source_schema_variant: row.row_schema_variant, source_schema_version: sourceSchema.schema_version, source_field: row.identity_field, native_identity_role: role, exact_source_schema_valid_context: context, exact_target_case: target, exact_case_count: 1, every_applicable_dimension_equals_generated_source_fixture: true, reduced_projection_or_UNAVAILABLE_for_present_source_field: 'forbidden', caller_override_or_fallback: 'forbidden' }
  return { selector_ref: selectorRef, context, target }
}
function selectorChoice(row, role) {
  const equality = equalityFor(row, role)
  if (!equality) throw new Error(`R62_equality_missing:${row.identity_kind}:${role}`)
  if (!equality.selector_ref || equality.selector_ref === 'UNAVAILABLE') return syntheticSelector(row, role)
  const selector = get(r54, equality.selector_ref)
  if (!selector) throw new Error(`R62_selector_missing:${equality.selector_ref}`)
  const pairs = selector.exact_source_schema_valid_cases.map((context, index) => ({ context, target: selector.exact_concrete_cases[index] })).filter(pair => pair.target && pair.context).sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
  if (!pairs.length) throw new Error(`R62_selector_context_missing:${row.identity_kind}`)
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
  if (selected.length !== 1) throw new Error(`R62_wrapper_resolution_not_exact_one:${targetRef}:${selected.length}`)
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
  if (!schema?.properties) throw new Error(`R62_target_schema_missing:${target.target_schema_ref}:${target.target_schema_variant}`)
  if (target.target_native_identity_field !== '$canonical_row_bytes' && !schema.properties[target.target_native_identity_field]) throw new Error(`R62_target_identity_field_missing:${target.target_schema_ref}:${target.target_native_identity_field}`)
  return target
}
function targetIdentity(fixture, target) {
  if (target.target_native_identity_field === '$canonical_row_bytes') return fixture.canonical_row_bytes_sha256
  const value = fixture.payload[target.target_native_identity_field]
  if (value === undefined) throw new Error(`R62_target_native_identity_missing:${target.target_schema_ref}:${target.target_native_identity_field}`)
  return value
}
const completeJointCache = new Map(), completeJointRows = {}
function jointLinkedFixture(row, role, seed) {
  const choice = selectorChoice(row, role), target = concreteTarget(choice.target), targetSchema = schemaAt(target.target_schema_ref, target.target_schema_variant ?? 'UNAVAILABLE')
  const equality = equalityFor(row, role), cacheKey = canonicalR44({ source_schema_ref: row.row_schema_ref, source_schema_variant: row.row_schema_variant, source_field: equality.source_field, selector_ref: choice.selector_ref, selector_context: choice.context, target })
  const specialize = value => {
    const copy = structuredClone(value)
    const targetPayload = JSON.parse(Buffer.from(copy.target_fixture.canonical_row_bytes_b64url, 'base64url').toString('utf8'))
    const canonicalField = role === 'companion_bytes_hash' ? 'target_native_bytes_sha256' : role === 'companion_fingerprint' ? 'target_native_fingerprint' : 'target_native_identity'
    const targetValue = targetPayload[row.identity_field] ?? copy[canonicalField]
    copy.authority_companion_target_mapping = {
      schema_version: 'ctrl.g24.authority-companion-target-mapping.r62.v1',
      native_identity_role: role,
      source_identity_field: row.identity_field,
      target_payload_field_or_canonical_semantic: targetPayload[row.identity_field] !== undefined ? row.identity_field : canonicalField,
      target_value: targetValue,
      canonical_shared_fixture_field: canonicalField,
      canonical_shared_fixture_value: copy[canonicalField],
      canonical_shared_fixture_must_not_be_overwritten: true,
    }
    return copy
  }
  if (completeJointCache.has(cacheKey)) return specialize(completeJointCache.get(cacheKey))
  const targetFixture = finalizeRow(target.target_schema_ref, target.target_schema_variant ?? 'UNAVAILABLE', `${seed}_target`, { ...projectedContext(targetSchema, choice.context, false), __payload_variant: target.payload_schema_variant })
  const identity = targetIdentity(targetFixture, target)
  const selectedPayload = targetFixture.selected_payload, selectedPayloadSchema = targetFixture.selected_payload_schema_ref ? (targetFixture.selected_payload_schema_variant === 'UNAVAILABLE' ? get(r54, targetFixture.selected_payload_schema_ref) : get(r54, targetFixture.selected_payload_schema_ref)?.variants?.[targetFixture.selected_payload_schema_variant]) : null
  const defaultBytesSha = selectedPayload ? sha(Buffer.from(canonicalR44(selectedPayload), 'utf8')) : targetFixture.canonical_row_bytes_sha256
  const defaultFingerprint = selectedPayloadSchema?.fingerprint_field ? selectedPayload[selectedPayloadSchema.fingerprint_field] : targetFixture.fingerprint?.expected_fingerprint ?? identity
  if (identity === undefined || defaultFingerprint === undefined) throw new Error(`R62_missing_target_identity_or_fingerprint:${row.identity_kind}`)
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
  completeJointRows[completeId] = { schema_version: 'ctrl.g24.complete-joint-equality-fixture.r62.v1', equality_source_schema_ref: equality.source_schema_ref, equality_source_schema_variant: equality.source_schema_variant, equality_source_field: equality.source_field, equality_selector_ref: equality.selector_ref, exact_selector_context: exactSourceDimensions, selected_selector_context: choice.context, target_schema_ref: result.target_schema_ref, target_schema_variant: result.target_schema_variant, target_identity_field: result.target_identity_field, target_fixture: result.target_fixture, source_fixture: result.source_fixture, target_native_identity: identity, target_native_bytes_sha256: defaultBytesSha, target_native_fingerprint: defaultFingerprint, declared_companion_bytes_fields: companionBytesFields, declared_companion_fingerprint_fields: companionFingerprintFields, declared_companion_bytes_count: companionBytesFields.length, declared_companion_fingerprint_count: companionFingerprintFields.length, exact_joint_equalities: result.exact_joint_equalities, every_applicable_selector_dimension_must_equal_source_fixture: true }
  completeJointCache.set(cacheKey, result)
  return specialize(result)
}

r54.authority_operation_persisted_identity_formula_library = {
  schema_version: 'ctrl.g24.persisted-identity-formula-library.r62.v1',
  role_precedence: ROLE_PRECEDENCE,
  canonical_row_bytes_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.canonical-row-bytes.r62.v1', formula_class: 'native_final_row_content_address', exact_formula: 'lowercase_hex_SHA256_of_exact_final_closed_schema_canonical_row_bytes' },
  declared_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-content-address.r62.v1', formula_class: 'selected_schema_native_content_address', exact_formula: 'opaque_ref_equals_opaque_bytes_sha256_or_artifact_ref_equals_canonical_payload_bytes_sha256_or_exact_declared_row_ref_preimage_or_nonce_receipt_payload_sha256' },
  declared_row_version: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-row-version.r62.v1', formula_class: 'selected_committed_target_native_row_version', exact_formula: 'selected_store_R49_domain_and_version_plus_ordered_complete_mutable_fields_excluding_row_version_and_native_fingerprint' },
  schema_declared_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.schema-fingerprint.r62.v1', formula_class: 'selected_schema_native_fingerprint', exact_formula: 'selected_fingerprint_authority_domain_order_types_and_declared_codec_over_actual_linked_row' },
  unique_key_component: { schema_version: 'ctrl.g24.persisted-identity-formula.unique-key-component.r62.v1', formula_class: 'native_schema_unique_key_component', exact_formula: 'exact_value_from_final_schema_valid_linked_row' },
  resolved_reference_identity: { schema_version: 'ctrl.g24.persisted-identity-formula.resolved-reference.r62.v1', formula_class: 'joint_source_target_native_identity', exact_formula: 'schema_valid_source_reference_equals_recomputed_identity_from_one_exact_selector_context_and_schema_valid_target_fixture' },
  companion_bytes_hash: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-bytes.r62.v1', formula_class: 'joint_source_target_native_bytes', exact_formula: 'schema_valid_source_companion_bytes_equals_selected_target_native_bytes_sha256' },
  companion_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-fingerprint.r62.v1', formula_class: 'joint_source_target_native_fingerprint', exact_formula: 'schema_valid_source_companion_equals_recomputed_selected_target_schema_native_fingerprint' },
}
const identityAuthorities = {}, identityRows = [], applicability = {}, inapplicableCandidates = [], duplicateAliases = [], seenIdentity = new Set()
for (const prior of priorIndex) {
  const sources = nativeRoleSources(prior), role = sources[0]?.role
  if (!role) { inapplicableCandidates.push({ identity_kind: prior.identity_kind, row_schema_ref: prior.row_schema_ref, row_schema_variant: prior.row_schema_variant, identity_field: prior.identity_field, disposition: 'not_applicable_because_no_native_source_proves_any_identity_role', derived_from_complete_native_source_union: true }); continue }
  const dedupe = `${prior.row_schema_ref}|${prior.row_schema_variant}|${prior.identity_field}|${role}`
  if (prior.identity_field === 'nonce' && seenIdentity.has(dedupe)) { duplicateAliases.push({ identity_kind: prior.identity_kind, canonical_identity_tuple: dedupe, disposition: 'duplicate_nonce_alias_collapsed_after_native_role_derivation' }); continue }
  seenIdentity.add(dedupe)
  const identityKind = `${prior.store_path}|${prior.row_schema_variant}|${prior.identity_field}|${role}`, key = `identity_${String(identityRows.length + 1).padStart(4, '0')}`, schema = schemaAt(prior.row_schema_ref, prior.row_schema_variant)
  const sourceContext = key === 'identity_0043' && prior.row_schema_ref === 'authoritative_row_schemas.intervention_atoms' ? { atom_kind: 'session' } : {}
  let source = finalizeRow(prior.row_schema_ref, prior.row_schema_variant, key, sourceContext), joint = null
  let evidence, expected
  if (role === 'canonical_row_bytes_content_address') { expected = source.canonical_row_bytes_sha256; evidence = { execution: 'raw_sha256_final_canonical_row_bytes', exact_operand_b64url: source.canonical_row_bytes_b64url, expected_identity: expected } }
  else if (role === 'declared_content_address') {
    const native = source.declared_content_address ?? source.row_ref ?? source.nonce_receipt
    if (!native) throw new Error(`R62_native_content_address_missing:${identityKind}`)
    expected = source.payload[prior.identity_field] ?? native.expected_identity
    evidence = { execution: 'selected_schema_native_content_address', selected_native_derivation: native, expected_identity: expected }
  } else if (role === 'declared_row_version') {
    if (!source.row_version) throw new Error(`R62_native_row_version_missing:${identityKind}`)
    expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_row_version', selected_native_derivation: source.row_version, expected_identity: expected, row_version_self_inclusion: false }
  } else if (role === 'schema_declared_fingerprint') {
    expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_native_fingerprint', selected_native_derivation: source.fingerprint, expected_identity: expected }
  } else if (role === 'unique_key_component') { expected = source.payload[prior.identity_field]; evidence = { execution: 'selected_schema_or_store_native_unique_key', exact_unique_key_memberships: nativeUniqueMemberships(prior, schema), expected_identity: expected } }
  else {
    joint = jointLinkedFixture(prior, role, key)
    source = { ...source, ...joint.source_fixture }
    expected = joint.authority_companion_target_mapping.target_value
    evidence = { execution: `joint_${role}`, complete_joint_fixture_ref: joint.complete_joint_fixture_ref, joint_source_target_fixture: joint, authority_companion_target_mapping: joint.authority_companion_target_mapping, expected_identity: expected, duplicated_scalar_assertion_only: false, missing_target_identity_fallback: 'forbidden', shared_complete_joint_fixture_must_be_dereferenced: true }
  }
  if (evidence.selected_native_derivation) evidence.selected_native_derivation = compactDerivation(evidence.selected_native_derivation)
  const authority = { schema_version: 'ctrl.g24.persisted-native-identity-authority.r62.v1', identity_kind: identityKind, store_path: prior.store_path, row_schema_ref: prior.row_schema_ref, row_schema_variant: prior.row_schema_variant, row_schema_version: schema.schema_version, identity_field: prior.identity_field, native_identity_role: role, native_role_sources: sources, precedence_selected_role: role, selected_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${role}`, schema_valid_linked_row_fixture: joint?.source_fixture ?? compactFixture(source), executable_native_derivation_evidence: evidence, independent_round_trip_required: true }
  identityAuthorities[key] = authority
  identityRows.push({ ...prior, identity_kind: identityKind, native_identity_role: role, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: authority.schema_version })
  applicability[role] = (applicability[role] ?? 0) + 1
}
r54.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r54.authority_operation_complete_joint_equality_fixtures = { schema_version: 'ctrl.g24.complete-joint-equality-fixtures.r62.v1', exact_row_count: Object.keys(completeJointRows).length, exact_linked_identity_count: Object.keys(identityAuthorities).filter(key => identityAuthorities[key].executable_native_derivation_evidence.joint_source_target_fixture).length, rows: completeJointRows, one_shared_fixture_per_equality_selector_target_context: true, every_declared_companion_is_bound_to_the_same_target_before_per_field_evidence: true, empty_or_vacuous_companion_proof_when_declaration_is_nonempty: 'forbidden' }
const committedUseReleaseFixture = finalizeRow('operation_registry.committed_success_row_schema', 'UNAVAILABLE', 'committed_use_release', { operation_class: 'use_release', result_ref: sha('R62:committed_use_release:terminal_consumption_ref') })
r54.authority_operation_committed_use_release_schema_fixture = { schema_version: 'ctrl.g24.committed-use-release-schema-fixture.r62.v1', selected_schema_ref: 'operation_registry.committed_success_row_schema', operation_class: 'use_release', schema_valid_fixture: compactFixture(committedUseReleaseFixture), result_ref_nonnull: true, result_reference_bytes_fingerprint_lineage_remains_governed_by_complete_cross_artifact_equality_registry: true }
r54.authority_operation_joint_identity_selector_contexts = { schema_version: 'ctrl.g24.joint-identity-selector-contexts.r62.v1', exact_count: Object.keys(syntheticSelectorRows).length, rows: syntheticSelectorRows, each_linked_identity_uses_exactly_one_executable_source_schema_valid_context: true }
r54.authority_operation_native_identity_applicability_report = { schema_version: 'ctrl.g24.native-identity-applicability-report.r62.v1', exact_R53_candidate_count: priorIndex.length, exact_native_identity_total: identityRows.length, exact_not_applicable_total: inapplicableCandidates.length, exact_not_applicable_candidates: inapplicableCandidates, exact_duplicate_alias_total: duplicateAliases.length, exact_duplicate_aliases: duplicateAliases, exact_category_counts: Object.fromEntries(Object.entries(applicability).sort((a, b) => cp(a[0], b[0]))), role_derivation: 'complete_union_of_native_schema_keys_content_addresses_row_refs_versions_fingerprints_and_typed_equalities_with_explicit_precedence', six_hold_result_fields_reclassified: identityRows.filter(row => row.row_schema_ref === 'authority_operation_hold_store.row_union' && ['result_ref', 'result_bytes_sha256', 'result_fingerprint'].includes(row.identity_field)).length, proof_nonce_is_one_unique_key_identity: identityRows.filter(row => row.row_schema_ref === 'proof_nonce_ledger.row_schema' && row.identity_field === 'nonce').length, missing_role_is_not_defaulted: true }
r54.authority_operation_artifact_fingerprint_derivation_authority = { schema_version: 'ctrl.g24.authority-operation-native-identity-derivation-authority.r62.v1', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', persisted_identity_formula_library_ref: 'authority_operation_persisted_identity_formula_library', native_identity_applicability_report_ref: 'authority_operation_native_identity_applicability_report', sole_active_identity_index: identityRows, exact_identity_kind_count: identityRows.length, exact_store_shape_count: persistence.length, generic_identity_fixture_machinery: 'forbidden', complete_native_source_union_and_precedence_required: true, schema_valid_joint_source_target_formula_execution_required: true, companion_requires_concrete_target_recomputation: true, derived_identity_self_inclusion_unless_normative: 'forbidden', missing_target_native_identity_or_formula: 'reject_materialization_and_hold_without_write', scalar_fingerprint_laundering: 'forbidden' }

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
  selectors[old.selector_id] = { ...old, schema_version: 'ctrl.g24.native-source-schema-intersection-selector.r62.v1', exact_source_schema_valid_cases: normalized.map(row => row.context), exact_source_schema_constant_projections: normalized.map(row => row.projection), exact_concrete_cases: cases, exact_case_count: cases.length, source_schema_validation: 'every_projected_literal_satisfies_complete_selected_closed_source_schema', each_valid_source_constant_intersection_matches_exactly_one_target: true, caller_override_or_fallback: 'forbidden' }
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
r54.authority_operation_internal_reference_target_selectors = { schema_version: 'ctrl.g24.internal-reference-target-selectors.r62.v1', row_schema_version: 'ctrl.g24.native-source-schema-intersection-selector.r62.v1', derivation: 'complete_source_schema_validation_of_R54_intersection_contexts', exact_count: Object.keys(selectors).length, exact_source_context_count: Object.values(selectors).reduce((sum, row) => sum + row.exact_case_count, 0), rows: selectors, selector_totality_and_uniqueness_for_every_source_schema_valid_context: true, current_invalid_source_context_count: invalidR53.length, invalid_contexts_are_never_emitted: true, caller_override_meta_target_or_fallback: 'forbidden' }
r54.authority_operation_selector_source_schema_validation_authority = { schema_version: 'ctrl.g24.selector-source-schema-validation-authority.r62.v1', exact_invalid_R55_context_occurrences: invalidR53, exact_invalid_R55_count: invalidR53.length, inherited_rejected_context_count: materializedR54.authority_operation_selector_source_schema_validation_authority.exact_invalid_R54_count ?? materializedR54.authority_operation_selector_source_schema_validation_authority.exact_invalid_R53_count ?? 0, source_schema_valid_context_count: r54.authority_operation_internal_reference_target_selectors.exact_source_context_count, exact_intersection_required: true, complete_recursive_schema_validation_required: true, zero_multiple_or_invalid_context: 'reject_materialization_and_hold_without_write' }
r54.authority_operation_complete_schema_cross_artifact_equality_registry = { ...r54.authority_operation_complete_schema_cross_artifact_equality_registry, schema_version: 'ctrl.g24.complete-schema-cross-artifact-equality-registry.r62.v1', exact_rows: equalityRows, exact_row_count: equalityRows.length, internal_exact_one_count: equalityRows.filter(row => row.exact_one_resolution_required).length, native_source_context_selector_ref: 'authority_operation_internal_reference_target_selectors', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', complete_joint_fixture_registry_ref: 'authority_operation_complete_joint_equality_fixtures', every_linked_identity_joint_source_target_fixture: true, nonvacuous_declared_companion_coverage: true }
r54.authority_operation_artifact_resolution_authority = { ...r54.authority_operation_artifact_resolution_authority, schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r62.v1', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', source_constant_selector_ref: 'authority_operation_internal_reference_target_selectors', complete_joint_fixture_registry_ref: 'authority_operation_complete_joint_equality_fixtures', every_internal_selected_reference_uses_complete_source_schema_validation: true, every_declared_companion_resolves_the_same_target: true, missing_target_identity_fallback: 'forbidden' }
r54.authority_operation_restart_correlation_authority = { ...r54.authority_operation_restart_correlation_authority, schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r62.v1', equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', complete_joint_fixture_registry_ref: 'authority_operation_complete_joint_equality_fixtures', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', all_declared_equality_companions_verified_together: true }
const conditionalRuleSet = new Set(conditionalSites.keys())
const localRuleRows = Object.values(ruleRegistryRows).filter(row => row.evaluation_scope === 'closed_local_payload_and_contract')
const materializedContextRuleRows = Object.values(ruleRegistryRows).filter(row => row.evaluation_scope === 'materialized_deterministic_contract_context')
const externalRuleRows = Object.values(ruleRegistryRows).filter(row => row.evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context')
function selectedConditionalRulePathsForFixture(fixture) {
  const payload = JSON.parse(Buffer.from(fixture.canonical_row_bytes_b64url, 'base64url').toString('utf8'))
  const rootSchema = schemaAt(fixture.schema_ref, fixture.schema_variant)
  const rows = []
  function visitSchema(schema, value, schemaPath, valuePath, context) {
    for (const rule of schema?.conditional_rules ?? []) rows.push({ exact_rule: rule, selected_schema_path: schemaPath, fixture_value_path: valuePath })
    if (!schema?.properties || !value || typeof value !== 'object' || Array.isArray(value)) return
    const sibling = { ...context, ...value }
    for (const [field, spec] of Object.entries(schema.properties)) if (Object.hasOwn(value, field)) visitSpec(spec, value[field], `${schemaPath}.properties.${field}`, `${valuePath}.${field}`, sibling)
  }
  function visitSpec(originalSpec, value, schemaPath, valuePath, context) {
    const spec = effectiveSpec(originalSpec)
    if (spec.type === 'nullable') { if (value !== null && spec.value_schema) visitSpec(spec.value_schema, value, `${schemaPath}.value_schema`, valuePath, context); return }
    if (spec.type === 'controlling_watermark_change') { const variant = r54.type_registry.controlling_watermark_change.variants?.[value?.kind_class]; if (variant) visitSchema(variant, value, `type_registry.controlling_watermark_change.variants.${value.kind_class}`, valuePath, context); return }
    if (spec.type === 'discriminated_union') { const name = value?.[spec.discriminator], variant = spec.variants?.[name]; if (variant) visitSchema(variant, value, `${schemaPath}.variants.${name}`, valuePath, context); return }
    if (spec.type === 'discriminated_value') { const name = context[spec.discriminator_source_field], selected = spec.variants?.[name]; if (selected) visitSpec(selected, value, `${schemaPath}.variants.${name}`, valuePath, context); return }
    if (spec.type === 'operation_discriminated_object') { const name = context.operation_class, intent = r54.operation_specs?.[name]?.intent; if (intent) visitSpec(intent, value, `operation_specs.${name}.intent`, valuePath, context); return }
    if (spec.schema_ref) { const resolved = get(r54, spec.schema_ref); if (!resolved) return; const selected = chooseVariant(resolved, value && typeof value === 'object' ? value : context); const selectedPath = selected.variant === 'UNAVAILABLE' ? spec.schema_ref : `${spec.schema_ref}.variants.${selected.variant}`; if (selected.schema?.properties) visitSchema(selected.schema, value, selectedPath, valuePath, context); else visitSpec(selected.schema, value, selectedPath, valuePath, context); return }
    if ((spec.type === 'array' || ['ordered_identifier_array', 'unicode_sorted_unique_identifier_array'].includes(spec.type)) && Array.isArray(value) && spec.items) { value.forEach((item, index) => visitSpec(spec.items, item, `${schemaPath}.items`, `${valuePath}[${index}]`, context)); return }
    if (spec.properties) visitSchema(spec, value, schemaPath, valuePath, context)
  }
  visitSchema(rootSchema, payload, fixture.schema_variant === 'UNAVAILABLE' ? fixture.schema_ref : `${fixture.schema_ref}.variants.${fixture.schema_variant}`, '$', payload)
  return uniq(rows).sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
}
function fixtureConditionalRules(fixture) { return [...new Set(selectedConditionalRulePathsForFixture(fixture).map(row => row.exact_rule))] }
const conditionallyTouchedIdentities = Object.entries(identityAuthorities).filter(([, authority]) => fixtureConditionalRules(authority.schema_valid_linked_row_fixture).length)
const fullyLocallyValidatedIdentities = conditionallyTouchedIdentities.filter(([, authority]) => fixtureConditionalRules(authority.schema_valid_linked_row_fixture).every(rule => ['closed_local_payload_and_contract', 'materialized_deterministic_contract_context'].includes(ruleByText.get(rule)?.evaluation_scope)))
const externalContextIdentityExclusions = conditionallyTouchedIdentities.filter(([, authority]) => fixtureConditionalRules(authority.schema_valid_linked_row_fixture).some(rule => ruleByText.get(rule)?.evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context')).map(([identity_id, authority]) => {
  const paths = selectedConditionalRulePathsForFixture(authority.schema_valid_linked_row_fixture).filter(row => ruleByText.get(row.exact_rule)?.evaluation_scope === 'requires_resolved_external_artifact_or_transaction_context')
  return { identity_id, schema_ref: authority.row_schema_ref, schema_variant: authority.row_schema_variant, exact_unproved_rules: [...new Set(paths.map(row => row.exact_rule))], exact_unproved_rule_paths: paths, disposition: 'excluded_from_full_conditional_semantics_claim_until_exact_resolved_external_context_is_materialized' }
})
const conditionallyTouchedJointRows = Object.entries(completeJointRows).filter(([, row]) => fixtureConditionalRules(row.source_fixture).length || fixtureConditionalRules(row.target_fixture).length)
const orderingOccurrences = []
function collectOrderingOccurrences(value, path = '$') {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) { value.forEach((child, index) => collectOrderingOccurrences(child, `${path}[${index}]`)); return }
  if (Object.hasOwn(value, 'ordered_by')) orderingOccurrences.push({ source_path: path, exact_ordering_authority: value.ordered_by })
  for (const [key, child] of Object.entries(value)) collectOrderingOccurrences(child, `${path}.${key}`)
}
collectOrderingOccurrences(materializedR54)
const lifecycleEvidenceRowSchema = r54.authoritative_row_schemas.lifecycle_precondition_evidence
const lifecycleEvidenceSemanticFingerprint = r54.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence
const lifecycleEvidenceEnvelopeFingerprint = r54.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence
const lifecycleEvidencePersistenceRows = r54.authority_operation_normative_persistence_registry.exact_rows.filter(row => row.store_path === 'authoritative_row_schemas.lifecycle_precondition_evidence' && row.row_schema_ref === 'authoritative_row_schemas.lifecycle_precondition_evidence')
if (lifecycleEvidencePersistenceRows.length !== 1) throw new Error('R62_lifecycle_evidence_persistence_registry_cardinality')
const lifecycleEvidenceOperationContext = {
  workspace_ref: 'r62_workspace',
  subject_ref: 'r62_subject',
  case_ref: 'r62_case',
  snapshot_fingerprint: hash({ snapshot: 'r62_evaluate_lifecycle_preconditions' }),
  evaluated_at: '2031-01-01T00:00:00.000Z',
}
const lifecycleEvaluatorMember = {
  evaluator_id: 'r62_lifecycle_evaluator',
  semantic_version: 'ctrl.g24.lifecycle-evaluator.r62.fixture.v1',
  artifact_sha256: hash({ artifact: 'r62_lifecycle_evaluator' }),
  abi_version: 'ctrl.g24.evaluator-abi.r62.fixture.v1',
  policy_lineage_ref: 'r62_policy_lineage',
  manifest_sha256: hash({ manifest: 'r62_lifecycle_evaluator' }),
  operation_result_exports: structuredClone(r54.evaluator_abi.operation_result_exports),
  proof_family_exports: structuredClone(r54.evaluator_abi.proof_family_exports),
  active_from: '2030-01-01T00:00:00.000Z',
  active_until: '2032-01-01T00:00:00.000Z',
}
validateSchema(r54.evaluator_abi.registry_member_schema, lifecycleEvaluatorMember, 'R62_lifecycle_evaluator_registry_member')
const lifecycleEvidenceInputs = ['a', 'b'].map(suffix => ({
  evidence_ref: `r62_lifecycle_precondition_evidence_${suffix}`,
  evidence_value: `Canonical lifecycle evidence ${suffix}`,
}))
const lifecycleEvidenceInputSetSeal = sha(Buffer.from(canonicalR44(lifecycleEvidenceInputs), 'utf8'))
function makeLifecycleEvidenceWrapper(input, index) {
  const evidenceBytes = Buffer.from(canonicalR44(input), 'utf8')
  const catalogue = r54.lifecycle_precondition_catalog.open_preparation
  const row = {
    ...lifecycleEvidenceOperationContext,
    evidence_ref: input.evidence_ref,
    evidence_fingerprint: '',
    row_version_ref: `r62_lifecycle_precondition_evidence_row_${index + 1}_v1`,
    valid_from: lifecycleEvidenceOperationContext.evaluated_at,
    row_envelope_fingerprint: '',
    transition_id: catalogue.transition_id,
    predecessor_lifecycle_version_ref: null,
    required_precondition_id: catalogue.required_precondition_id,
    precondition_canonical_text: catalogue.precondition_canonical_text,
    evidence_schema_version: 'ctrl.g24.lifecycle-precondition-evidence.fixture.r62.v1',
    canonical_evidence_b64url: evidenceBytes.toString('base64url'),
    canonical_evidence_byte_length: evidenceBytes.length,
    evaluator_version_ref: lifecycleEvaluatorMember.semantic_version,
    satisfied: true,
    evidence_input_set_seal: lifecycleEvidenceInputSetSeal,
    evaluator_id: lifecycleEvaluatorMember.evaluator_id,
    evaluator_semantic_version: lifecycleEvaluatorMember.semantic_version,
    evaluator_artifact_sha256: lifecycleEvaluatorMember.artifact_sha256,
    evaluator_manifest_sha256: lifecycleEvaluatorMember.manifest_sha256,
  }
  row.evidence_fingerprint = hash(fingerprintPreimage(lifecycleEvidenceSemanticFingerprint, row))
  row.row_envelope_fingerprint = hash(fingerprintPreimage(lifecycleEvidenceEnvelopeFingerprint, row))
  validateSchema(lifecycleEvidenceRowSchema, row, `R62_lifecycle_evidence_row_${index + 1}`)
  const rowBytes = Buffer.from(canonicalR44(row), 'utf8')
  const rowBytesSha = sha(rowBytes)
  return {
    target_store_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
    row_schema_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
    row_schema_version: lifecycleEvidenceRowSchema.schema_version,
    canonical_row_bytes_b64url: rowBytes.toString('base64url'),
    canonical_row_bytes_sha256: rowBytesSha,
    row_content_ref: rowBytesSha,
    row_value: row,
  }
}
const lifecycleEvidenceWrappers = lifecycleEvidenceInputs.map(makeLifecycleEvidenceWrapper).sort((left, right) => cp(left.row_value.evidence_ref, right.row_value.evidence_ref))
const lifecycleEvidenceSnapshot = {
  schema_version: 'ctrl.g24.lifecycle-precondition-evidence-frozen-snapshot.r62.v1',
  target_store_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
  persistence_registry_row: structuredClone(lifecycleEvidencePersistenceRows[0]),
  ...lifecycleEvidenceOperationContext,
  evidence_input_set_seal: lifecycleEvidenceInputSetSeal,
  evaluator_registry_member: lifecycleEvaluatorMember,
  rows: lifecycleEvidenceWrappers,
}
delete r54.authority_operation_ordering_evidence_store
const orderingEvidenceRows = lifecycleEvidenceWrappers.map(wrapper => wrapper.row_value)
const orderingHandlers = {
  unsigned_utf8: { operand: 'scalar_string', comparator: 'unsigned_UTF8_byte_lexicographic_nondecreasing' },
  unsigned_utf8_effect_key: { operand: 'object.effect_key', comparator: 'unsigned_UTF8_byte_lexicographic_nondecreasing' },
  kind_class_then_base_kind_or_control_id_unsigned_utf8: { operand: 'object.kind_class_then_base_kind_or_control_id', comparator: 'tuple_components_unsigned_UTF8_byte_lexicographic_nondecreasing' },
  reuse_enrich_ask_session: { operand: 'object.route', comparator: 'closed_enum_order_reuse_enrich_ask_session' },
  'nonlease_final_recheck_failure_set.values': { operand: 'scalar_enum_member', comparator: 'outbox.provider_call_gate.nonlease_final_recheck_failure_set.values_order' },
  matching_evidence_refs: { operand: 'trusted_nonpayload_resolution_context', comparator: 'same_length_index_and_exact_ref_fingerprint_equality_to_each_uniquely_resolved_authoritative_evidence_row' },
}
if (orderingOccurrences.length !== 21 || orderingOccurrences.some(row => !orderingHandlers[row.exact_ordering_authority])) throw new Error('R62_ordering_inventory_not_closed')
function orderedFieldValue(spec, rule, index) {
  const seed = `ordering_${String(index + 1).padStart(2, '0')}`
  if (rule === 'matching_evidence_refs') return orderingEvidenceRows.map(row => row.evidence_fingerprint)
  if (rule === 'nonlease_final_recheck_failure_set.values') return r54.outbox.provider_call_gate.nonlease_final_recheck_failure_set.values.slice(0, 2)
  if (rule === 'kind_class_then_base_kind_or_control_id_unsigned_utf8') return ['a', 'b'].map(control_id => schemaPayload(r54.type_registry.controlling_watermark_change.variants.applicable_control, `${seed}_${control_id}`, { kind_class: 'applicable_control', control_id }))
  if (rule === 'unsigned_utf8_effect_key') return [questionEffect('a', 'Consequence for a'), questionEffect('b', 'Consequence for b')]
  if (rule === 'reuse_enrich_ask_session') return ['reuse', 'enrich'].map((route, itemIndex) => {
    const itemSpec = spec.items ?? { type: 'object' }
    const item = valueForSpec(itemSpec, `${seed}_route_${itemIndex}`, { route })
    item.route = route
    const selectedSchema = referencedSpec(itemSpec)
    if (selectedSchema?.properties) { normalizePayloadForLocalRules(selectedSchema, item, `${seed}_route_${itemIndex}`); fingerprint(selectedSchema, item) }
    return item
  })
  if (rule === 'unsigned_utf8') {
    if (Array.isArray(spec.exact_members)) return [...spec.exact_members].sort(cp)
    const allowed = values(spec.items ?? {})
    if (allowed.length >= 2) return [...allowed].sort(cp).slice(0, 2)
    return [`${seed}_a`, `${seed}_b`]
  }
  throw new Error(`R62_unknown_ordering_fixture_rule:${rule}`)
}
function containingSchema(occurrence) {
  const marker = '.properties.'
  const split = occurrence.source_path.lastIndexOf(marker)
  if (split < 2) throw new Error(`R62_ordering_occurrence_not_schema_property:${occurrence.source_path}`)
  const schemaPath = occurrence.source_path.slice(2, split)
  const field = occurrence.source_path.slice(split + marker.length)
  const schema = get(r54, schemaPath)
  if (!schema?.properties?.[field]) throw new Error(`R62_ordering_occurrence_schema_missing:${occurrence.source_path}`)
  return { schemaPath, field, schema, spec: schema.properties[field] }
}
function resealOrderingPayload(schema, payload) {
  normalizePayloadForLocalRules(schema, payload, 'ordering_site')
  if (schema.fingerprint_ref && schema.fingerprint_field) fingerprint(schema, payload)
  return payload
}
function baseOrderingPayload(schemaPath, schema, field, spec, rule, index) {
  let payload
  if (schemaPath === 'proof_value_schemas.question_contract') payload = questionContract(`ordering_${index}`)
  else if (schemaPath === 'proof_value_schemas.question_answer_effect') payload = { ...questionEffect('ordering_effect', 'Ordering consequence'), case_effect: 'rebuild_required', retire_intervention_refs: ['ordering_ref_a', 'ordering_ref_b'] }
  else payload = schemaPayload(schema, `ordering_${index}`)
  if (!(schemaPath === 'proof_value_schemas.question_contract' && field === 'answer_effects')) payload[field] = orderedFieldValue(spec, rule, index)
  if (schemaPath === 'result_payload_schemas.evaluate_lifecycle_preconditions') {
    payload.evidence_refs = orderingEvidenceRows.map(row => row.evidence_ref)
    payload.evidence_fingerprints = orderingEvidenceRows.map(row => row.evidence_fingerprint)
    payload.transition_id = 'open_preparation'
    payload.predecessor_lifecycle_version_ref = null
    payload.precondition_set_seal = lifecycleEvidenceSnapshot.evidence_input_set_seal
    payload.evaluator_version_ref = lifecycleEvaluatorMember.semantic_version
    payload.evaluator_artifact_sha256 = lifecycleEvaluatorMember.artifact_sha256
  }
  return resealOrderingPayload(schema, payload)
}
function orderingFixture(occurrence, index) {
  const rule = occurrence.exact_ordering_authority
  const { schemaPath, field, schema, spec } = containingSchema(occurrence)
  const trustedContext = validationContext({}, lifecycleEvidenceSnapshot)
  const positivePayload = baseOrderingPayload(schemaPath, schema, field, spec, rule, index)
  validateSchema(schema, positivePayload, `${occurrence.source_path}:positive_full_schema`, trustedContext)
  const negativePayload = structuredClone(positivePayload)
  negativePayload[field] = [...negativePayload[field]].reverse()
  resealOrderingPayload(schema, negativePayload)
  let rejection = null
  try { validateSchema(schema, negativePayload, `${occurrence.source_path}:negative_full_schema`, trustedContext) } catch (error) { rejection = String(error?.message ?? error) }
  if (!rejection?.includes('ordering')) throw new Error(`R62_ordering_negative_not_specific:${occurrence.source_path}:${rejection}`)
  const positiveBytes = Buffer.from(canonicalR44(positivePayload), 'utf8')
  const negativeBytes = Buffer.from(canonicalR44(negativePayload), 'utf8')
  return { fixture_id: `ordering_${String(index + 1).padStart(2, '0')}`, source_path: occurrence.source_path, containing_schema_ref: schemaPath, containing_schema_version: schema.schema_version, ordered_field: field, exact_ordering_authority: rule, selected_spec_sha256: hash(get(materializedR54, occurrence.source_path.slice(2))), positive: { canonical_payload_b64url: positiveBytes.toString('base64url'), canonical_payload_sha256: sha(positiveBytes), trusted_resolution_store_ref: rule === 'matching_evidence_refs' || schemaPath === 'result_payload_schemas.evaluate_lifecycle_preconditions' ? 'authoritative_row_schemas.lifecycle_precondition_evidence' : 'UNAVAILABLE' }, negative: { canonical_payload_b64url: negativeBytes.toString('base64url'), canonical_payload_sha256: sha(negativeBytes), mutation: 'reverse_only_the_selected_ordered_field_then_reseal_declared_dependents', expected: 'reject_specifically_ordering' } }
}
const orderingFixtureRows = orderingOccurrences.map(orderingFixture)
r54.authority_operation_ordering_rule_registry = { schema_version: 'ctrl.g24.ordering-rule-registry.r62.v1', exact_occurrence_count: orderingOccurrences.length, exact_handler_count: Object.keys(orderingHandlers).length, exact_full_schema_positive_fixture_count: orderingFixtureRows.length, exact_full_schema_negative_fixture_count: orderingFixtureRows.length, handlers: orderingHandlers, occurrences: orderingOccurrences, executable_full_schema_occurrence_fixtures: orderingFixtureRows, matching_evidence_pair_authority: { schema_version: 'ctrl.g24.resolved-evidence-pair-ordering.r62.v1', resolution_context_source: 'internally_created_nonserializable_context_from_same_frozen_operation_snapshot', caller_payload_may_supply_resolution_context: false, target_store_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence', persistence_registry_ref: 'authority_operation_normative_persistence_registry', row_schema_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence', semantic_fingerprint_ref: 'authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence', envelope_fingerprint_ref: 'authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence', evidence_ref_semantics: 'stable_semantic_evidence_identifier_not_content_address', row_content_ref_semantics: 'SHA256_of_exact_canonical_persisted_row_bytes', frozen_persistence_snapshot: lifecycleEvidenceSnapshot, evidence_ref_resolves_exactly_one_current_authoritative_row: true, current_selection_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence.current_selection', canonical_bytes_content_ref_schema_version_target_store_semantic_fingerprint_and_envelope_fingerprint_recomputed: true, result_evidence_fingerprint_must_equal_recomputed_semantic_fingerprint_not_envelope_fingerprint: true, live_atomic_current_row_enforcement: 'unproved_outside_frozen_snapshot', missing_duplicate_ambiguous_substituted_wrong_store_wrong_schema_wrong_version_wrong_bytes_wrong_hash_wrong_ref_wrong_semantic_fingerprint_wrong_envelope_fingerprint_or_wrong_lineage: 'reject_materialization_and_hold_without_write' }, unknown_ordering_authority: 'reject_materialization_and_hold_without_write', every_occurrence_executes_selected_handler_through_full_containing_schema: true, handler_only_fragments_count_as_site_coverage: false }
const schemaTypeOccurrences = new Map()
function collectSchemaTypes(value) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) { for (const child of value) collectSchemaTypes(child); return }
  if (typeof value.type === 'string') schemaTypeOccurrences.set(value.type, (schemaTypeOccurrences.get(value.type) ?? 0) + 1)
  for (const child of Object.values(value)) collectSchemaTypes(child)
}
collectSchemaTypes(materializedR54)
const exactTypeInventory = Object.fromEntries([...schemaTypeOccurrences].sort((a, b) => cp(a[0], b[0])).map(([type, occurrence_count]) => [type, { occurrence_count, disposition: SUPPORTED_TYPES.has(type) ? 'recursively_implemented_schema_type' : 'nonschema_control_or_container_label_not_claimed_as_fixture_schema_type' }]))
r54.authority_operation_conditional_rule_predicate_registry = { schema_version: 'ctrl.g24.conditional-rule-predicate-registry.r62.v1', exact_rule_count: Object.keys(ruleRegistryRows).length, exact_local_executable_rule_count: localRuleRows.length, exact_materialized_deterministic_context_rule_count: materializedContextRuleRows.length, exact_unproved_semantic_or_live_rule_count: externalRuleRows.length, rows: ruleRegistryRows, rule_text_to_one_exact_predicate_or_explicit_unproved_external_context: 'required', natural_language_parsing_or_prefix_dispatch: 'forbidden', unknown_rule_or_predicate: 'reject_materialization_and_hold_without_write' }
r54.authority_operation_conditional_context_fixtures = { schema_version: 'ctrl.g24.conditional-context-fixtures.r62.v1', exact_row_count: 0, rows: materializedContextRows, context_family_count: 0, detached_or_self_asserted_contexts: 'forbidden', proved_context_requires_dereference_from_canonical_fixture_and_supporting_rows: true }
r54.authority_operation_conditional_fixture_coverage = { schema_version: 'ctrl.g24.conditional-fixture-coverage.r62.v1', exact_conditionally_touched_identity_count: conditionallyTouchedIdentities.length, exact_fully_closed_local_semantics_validated_identity_count: fullyLocallyValidatedIdentities.length, exact_semantic_or_live_unproved_identity_count: externalContextIdentityExclusions.length, semantic_or_live_unproved_identity_exclusions: externalContextIdentityExclusions, exact_conditionally_touched_complete_joint_count: conditionallyTouchedJointRows.length, exact_rule_partition: { closed_local_payload_and_contract: localRuleRows.length, bound_canonical_artifact_context: materializedContextRuleRows.length, unproved_semantic_or_live_enforcement_context: externalRuleRows.length }, every_local_predicate_executed_for_every_selected_fixture: true, detached_context_predicate_counted_as_executed: false, unproved_rule_is_never_counted_as_executed_or_passed: true, completeness_claim: 'closed_local_predicates_only', cross_artifact_prior_transaction_database_session_worker_provider_or_cryptographic_conditional_semantics: 'unproved_and_excluded_from_normative_fixture_completeness' }
r54.fixture_schema_validator = { schema_version: 'ctrl.g24.fixture-schema-validator.r62.v1', supported_recursive_schema_forms: ['closed_json_type_dispatch', 'const', 'literal', 'enum', 'enum_ref', 'type', 'exact_keys', 'required', 'optional_subset_of_exact_keys', 'additional_properties_false', 'object_properties', 'schema_ref', 'nullable_null_or_recursive_value_schema', 'union_variant_discriminator', 'array_items', 'min_items', 'max_items', 'exact_members', 'unique', 'unique_by', 'ordered_by_closed_resolver_with_internal_trusted_context', 'identifier_normalization_and_control_exclusions', 'valid_unicode_scalar_only', 'min_utf8_bytes', 'max_utf8_bytes', 'max_bytes', 'pattern_or_regex', 'canonical_base64url_round_trip', 'base64url_max_decoded_bytes', 'sha256', 'sha256_or_exact_literal', 'strict_gregorian_canonical_timestamp_round_trip', 'numeric_minimum_maximum', 'conditional_rules_closed_exact_registry', 'recursive_selected_schema_conditional_rule_paths', 'declared_cross_field_length_content_address_fingerprint_version_and_joint_target_equalities'], exact_supported_types: [...SUPPORTED_TYPES].sort(cp), exact_frozen_parent_type_inventory: exactTypeInventory, type_inventory_source: 'recursive_walk_of_exact_frozen_R61_machine_bytes', enum_ref_resolution: 'exact_top_level_nonempty_array_named_by_enum_ref', exact_enum_refs: Object.fromEntries(['rejection_codes', 'hold_codes', 'operation_names', 'set_seals'].map(ref => [ref, [...get(r54, ref)]])), conditional_rule_registry_ref: 'authority_operation_conditional_rule_predicate_registry', conditional_fixture_coverage_ref: 'authority_operation_conditional_fixture_coverage', conditional_rule_registry_sha256: hash(Object.values(ruleRegistryRows)), conditional_rule_exact_count: conditionalRuleSet.size, validation_scope: 'every_persisted_identity_source_fixture_every_linked_target_fixture_complete_joint_equality_fixture_and_all_21_full_ordering_site_payloads_before_native_identity_use_with_recursive_selected_schema_semantic_or_live_context_exclusions_never_counted_as_passes', deterministic_generated_values_come_from_authoritative_domains: true, unsupported_type_spec_rule_or_unresolved_schema_form: 'reject_materialization_and_hold_without_write', producer_and_checker_independent_implementations_required: true }
r54.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r62.v1', derivation: 'bounded_exact_extension_from_frozen_R57_total_type_timestamp_conditional_and_canonical_joint_evidence_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.status', '$.supersedes', '$.authority_operation_persisted_identity_formula_library', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_complete_joint_equality_fixtures', '$.authority_operation_committed_use_release_schema_fixture', '$.authority_operation_joint_identity_selector_contexts', '$.authority_operation_native_identity_applicability_report', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_internal_reference_target_selectors', '$.authority_operation_selector_source_schema_validation_authority', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.authority_operation_conditional_rule_predicate_registry', '$.authority_operation_conditional_context_fixtures', '$.authority_operation_conditional_fixture_coverage', '$.fixture_schema_validator', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], repair_roots: ['closed_json_type_dispatch', 'optional_fields_are_true_optional_subset', 'valid_unicode_scalar_enforcement', 'strict_gregorian_timestamp_round_trip', 'exact_conditional_rule_registry', 'closed_local_conditional_fixture_execution', 'detached_contexts_removed_and_unproved_semantics_excluded', 'intervention_inner_outer_payload_and_declared_fingerprints', 'root_bootstrap_signer_distinctness', 'canonical_shared_joint_target_semantics', 'per_authority_companion_target_field_mapping', 'complete_joint_fixture_dereference'], removed_semantic_paths: [], frozen_parent_core_must_remain_byte_identical: true, runtime_database_ui_deployment_or_external_action: 'closed' }
r54.schema_change_manifest.derivation = 'bounded_exact_extension_from_frozen_R61_actual_lifecycle_precondition_evidence_authority_repair'
r54.schema_change_manifest.changed_semantic_paths.push('$.authority_operation_ordering_rule_registry', '$.authority_operation_intervention_inner_payload_schemas')
r54.schema_change_manifest.changed_semantic_paths = [...new Set(r54.schema_change_manifest.changed_semantic_paths)].sort(cp)
r54.schema_change_manifest.removed_semantic_paths = [...new Set([...(r54.schema_change_manifest.removed_semantic_paths ?? []), '$.authority_operation_ordering_evidence_store'])].sort(cp)
r54.schema_change_manifest.repair_roots = ['remove_synthetic_ordering_evidence_store', 'actual_R13_lifecycle_precondition_evidence_rows_in_existing_normative_persistence_store', 'trusted_nonpayload_evidence_resolution_context', 'separate_semantic_and_envelope_fingerprint_recomputation', 'exact_current_row_operation_evaluator_catalogue_and_input_set_lineage', 'all_21_ordering_occurrences_exercised_through_full_containing_schema', 'preserve_R61_intervention_display_recursive_exclusions_and_inherited_controls']
r54.required_negative_fixture_families = [...new Set([...r54.required_negative_fixture_families, 'ordering_all_21_full_schema_positive_and_negative', 'matching_evidence_actual_R13_row_authority', 'matching_evidence_full_schema_coherent_ref_fingerprint_store_swap', 'matching_evidence_missing_duplicate_ambiguous_wrong_store_schema_version_bytes_hash_ref_semantic_envelope_lineage_currentness', 'caller_payload_resolution_context_rejected'])]

const replaced = new Set(['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_complete_joint_equality_fixtures', 'authority_operation_committed_use_release_schema_fixture', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'authority_operation_conditional_rule_predicate_registry', 'authority_operation_conditional_fixture_coverage', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest', 'authority_operation_ordering_evidence_store'])
const added = ['authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_complete_joint_equality_fixtures', 'authority_operation_committed_use_release_schema_fixture', 'authority_operation_joint_identity_selector_contexts', 'authority_operation_native_identity_applicability_report', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_selector_source_schema_validation_authority', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'authority_operation_conditional_rule_predicate_registry', 'authority_operation_conditional_fixture_coverage', 'fixture_schema_validator', 'schema_change_manifest']
replaced.add('authority_operation_conditional_context_fixtures')
added.push('authority_operation_conditional_context_fixtures')
added.push('authority_operation_ordering_rule_registry', 'authority_operation_intervention_inner_payload_schemas')
r54.authority_runtime_semantic_reference_field_registry = { ...r54.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r62.v1' }
r54.authority_runtime_semantic_reference_owner_map = { ...r54.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r62.v1' }
r54.authority_runtime_semantic_dependency_owner_map = { ...r54.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r62.v1' }
r54.authority_runtime_semantic_manifest = { ...r54.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r62.v1' }
const sourcePaths = [...new Set([...r54SemanticAuthorityPaths.filter(path => !replaced.has(path)), ...added])].filter(path => get(r54, path) !== undefined).sort(cp)
r54.authority_runtime_semantic_manifest_hash_contract = { ...r54.authority_runtime_semantic_manifest_hash_contract, schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r62.v1', manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r62.v1', content_domain_ascii: 'CTRL-G24-R62-MANIFEST-CONTENT', dependency_domain_ascii: 'CTRL-G24-R62-MANIFEST-DEPENDENCY', graph_domain_ascii: 'CTRL-G24-R62-MANIFEST-GRAPH', envelope_domain_ascii: 'CTRL-G24-R62-MANIFEST-ENVELOPE' }
sourcePaths.push('authority_runtime_semantic_manifest_hash_contract'); sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r54, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R62-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
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
r54.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r62.v1', source_snapshot_sha256: snapshotSha, exact_source_paths: sourcePaths, schema_declared_field_registry_ref: 'authority_operation_schema_declared_semantic_field_registry', exact_occurrence_rows: refRows, exact_expected_occurrence_count: refRows.length, exact_path_value_resolution_count: refRows.filter(row => row.match_kind === 'exhaustive_exact_path_value_resolution').length, schema_or_pinned_field_occurrence_count: refRows.filter(row => row.match_kind === 'schema_declared_or_independently_pinned_semantic_field').length, required_named_field_occurrence_counts: Object.fromEntries(['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'].map(field => [field, refRows.filter(row => row.field_name === field).length])), suffix_name_only_inference: 'forbidden', unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write' }
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(row => row.source_authority_path === path && sourcePaths.includes(row.exact_target_path_or_UNAVAILABLE) && row.exact_target_path_or_UNAVAILABLE !== path).map(row => row.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r54.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r62.v1', source_snapshot_sha256: snapshotSha, exact_row_count: refRows.length, reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', schema_declared_and_exact_path_value_bijection: true }
r54.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r62.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })), reference_registry_ref: 'authority_runtime_semantic_reference_field_registry' }
const hc = r54.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r54, path)) })]))
function transitive(path) { const seen = new Set(), visit = item => { for (const dep of dependencies[item] ?? []) if (!seen.has(dep)) { seen.add(dep); visit(dep) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = sourcePaths.map(path => { const direct = dependencies[path].map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })), all = transitive(path).map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })); return { authority_path: path, authority_schema_version: get(r54, path)?.schema_version ?? 'UNVERSIONED', exact_keyset: Object.keys(get(r54, path) ?? {}).sort(cp), authority_content_sha256: contentHashes[path], direct_dependency_paths: dependencies[path], direct_dependency_content_hashes: direct, direct_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }) } })
const withoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r62.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: manifestRows, exact_expected_count: manifestRows.length, manifest_graph_sha256: hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifestRows }) }
r54.authority_runtime_semantic_manifest = { ...withoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r54)
export const materializedR62 = r54
export const materializedR62Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r62SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR62Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR62Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R62 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
