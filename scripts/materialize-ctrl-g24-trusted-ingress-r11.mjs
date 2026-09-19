import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r10.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r11.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r11 = JSON.parse(inputBytes)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const text = { type: 'human_text' }
const bool = { type: 'boolean' }
const nonneg = { type: 'safe_nonnegative_integer' }
const nullable = value_schema => ({ type: 'nullable', value_schema })
const array = (items, extras = {}) => ({ type: 'array', items, ...extras })

function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return {
    schema_version,
    type: 'object',
    exact_keys: Object.keys(properties),
    required: Object.keys(properties).filter(key => !optional.includes(key)),
    ...(optional.length ? { optional } : {}),
    additional_properties: false,
    properties,
    ...extras,
  }
}

function fingerprint(domain_ascii, preimageFields) {
  return {
    domain_ascii,
    field_encoding_ref: 'canonical_field_encoding',
    preimage_order: ['domain_ascii', ...preimageFields],
    fingerprint_field_excluded_from_preimage: true,
    digest: 'sha256_of_exact_preimage',
  }
}

function replaceProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}

function refreshRow(table) {
  const schema = r11.authoritative_row_schemas[table]
  const semanticField = schema.semantic_fingerprint_field
  const metadata = new Set([
    'workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref',
    'valid_from', 'valid_until', 'row_envelope_fingerprint',
  ])
  r11.authoritative_semantic_fingerprint_schemas[table] = fingerprint(
    `CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R11`,
    Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== semanticField),
  )
  r11.authoritative_row_fingerprint_schemas[table] = fingerprint(
    `CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R11`,
    Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'),
  )
}

function linkFingerprint(schema, ref, field) {
  schema.fingerprint_ref = ref
  schema.fingerprint_field = field
  schema.fingerprint_field_must_equal_referenced_preimage_digest = true
}

function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
  }
}

r11.schema_version = 'ctrl.g24.trusted-ingress.r11.effective.v1'
r11.status = 'tenth_repair_candidate_under_independent_review'
r11.supersedes = {
  commit: '2785675b75c808e01eef9ab2d950510f355ca9b8',
  tree: 'b76346f5dc404672e74d9be454bdaa6bb137477e',
  human_blob: '189d7e8a74069457ef877016e230677b154b821e',
  machine_blob: '7369577c25079d71afe44d4c0dc6883f53016557',
  qa_blob: 'e85b2171d80e3721b624daa7c46eecb3d822b67a',
  checker_blob: 'fb11b948120aaf5eb5caed989153612055d226e1',
  materializer_blob: 'd1d4e2fbcdb1ce0e78f4c0542982e336387648bd',
  materialized_sha256: 'b2cb1ab347138ad9cb47db742f3b445ada080281eadeb18f02b0bbad17ab8f5b',
  adjudication: 'veto',
}
r11.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r11.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// Every value admitted to a fingerprint has one injective byte representation.
r11.canonical_field_encoding = {
  object: 'schema_declared_field_order; field names are omitted only because the exact closed schema and order are fingerprint inputs',
  resolved_schema_reference: 'resolve_to_the_exact_versioned_closed_schema_before_encoding; unresolved_or_recursive_ambiguous_reference_is_invalid',
  optional_absent: 'single_byte_0x00',
  optional_present: 'single_byte_0x01_then_encoded_value',
  nullable_null: 'single_byte_0x00',
  nullable_value: 'single_byte_0x01_then_value_encoded_under_value_schema',
  string_identifier_human_text_timestamp_enum_const: 'uint32_big_endian_utf8_byte_length_then_exact_utf8_bytes',
  base64url_without_padding: 'decode_canonical_base64url_without_padding_then_uint64_big_endian_byte_length_then_exact_bytes; reject_noncanonical_spellings',
  sha256: '32_raw_bytes_decoded_from_lowercase_hex',
  integer_positive_integer_safe_nonnegative_integer: 'uint64_big_endian_unsigned',
  finite_nonnegative_number: 'RFC_8785_JSON_number_serialization_exact_UTF8_prefixed_by_uint32_big_endian_byte_length; reject_NaN_positive_or_negative_Infinity_negative_values_and_negative_zero',
  boolean_false: 'single_byte_0x00',
  boolean_true: 'single_byte_0x01',
  array: 'uint64_big_endian_item_count_then_each_item_encoded_in_declared_array_order_under_the_item_schema',
  discriminated_value: 'encode_discriminator_source_field_name_as_string_then_resolved_discriminator_value_as_string_then_the_selected_variant_value_under_that_variant_schema; reject_missing_unknown_or_mismatched_variant',
  const_null: 'single_byte_0x00_under_the_resolved_const_null_schema',
  map_or_unspecified_json_value_allowed: false,
}
r11.canonical_encoding_conformance = {
  reference_standard_for_finite_number: 'RFC_8785_section_3_2_2_3',
  null_and_false_are_distinct_because_the_resolved_schema_is_part_of_the_fingerprint_definition: true,
  optional_absent_nullable_null_and_nullable_present_value_are_pairwise_distinct: true,
  every_discriminated_value_binds_the_discriminator_and_selected_variant_before_value_bytes: true,
  unknown_type_or_unresolved_schema_ref: 'reject_and_hold',
}

// Selector proof: exact presented set, exact reasons, exact precedence and exact result shape.
r11.proof_member_schemas.selector_candidate.schema_version = 'ctrl.g24.selector-candidate-member.r11.v1'
const candidateProps = r11.proof_member_schemas.selector_candidate.properties
const withInputReasons = {}
for (const [key, value] of Object.entries(candidateProps)) {
  if (key === 'eligible') withInputReasons.input_rejection_reasons = array(id, { unique: true, ordered_by: 'unsigned_utf8' })
  withInputReasons[key] = value
}
replaceProperties(r11.proof_member_schemas.selector_candidate, withInputReasons)
r11.proof_member_schemas.selector_candidate.conditional_rules = [
  'generated_rejection_reasons_equal_the_exact_selector_derivation_rejection_reason_table_applied_to_this_member',
  'rejection_reasons_equal_sorted_unsigned_utf8_unique_union_of_input_rejection_reasons_and_generated_rejection_reasons',
  'eligible_iff_rejection_reasons_is_empty',
  'trusted_evaluation_version_byte_equals_selector_owner_trusted_evaluation_evaluation_version',
]
r11.proof_member_fingerprint_schemas.selector_candidate = fingerprint(
  'CTRL-G24-SELECTOR-CANDIDATE-MEMBER-R11',
  Object.keys(withInputReasons).filter(key => key !== 'candidate_fingerprint'),
)

r11.proof_value_schemas.selector_alternative = closed('ctrl.g24.selector-alternative.r11.v1', {
  route: { type: 'enum', values: ['reuse', 'enrich', 'ask', 'session'] },
  eligible: bool,
  burden: { type: 'finite_nonnegative_number' },
  rejection_reasons: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
})
r11.selector_derivation = {
  kernel_source: 'src/features/operator-brain/g24HeadlessCrossing.ts:RESOLVING_ROUTE_ORDER,candidateEligibility,heldSelectorResult,selectG24Intervention',
  presented_candidate_set: {
    allowed_routes: ['reuse', 'enrich', 'ask', 'session'],
    cardinality: { minimum: 0, maximum: 4 },
    uniqueness: 'route',
    no_candidate_is_valid: true,
    no_invented_or_omitted_member: true,
    alternatives_order: ['reuse', 'enrich', 'ask', 'session'],
  },
  rejection_reason_table: [
    ['permitted', false, 'route_not_permitted'],
    ['capable', false, 'source_or_respondent_incapable'],
    ['resolves_gap', false, 'does_not_resolve_named_gap'],
    ['within_deadline', false, 'outside_deadline'],
    ['within_budget', false, 'outside_budget'],
    ['fresh', false, 'route_evidence_stale'],
    ['audience_compatible', false, 'audience_incompatible'],
    ['provenance_independent', false, 'provenance_independence_unsatisfied'],
    ['use_specific_sufficient', false, 'use_specific_sufficiency_unsatisfied'],
    ['counterevidence_treated', false, 'counterevidence_untreated'],
    ['reuse_origin_binding', false, 'private_cross_case_reuse_forbidden'],
    ['reuse_evidence_ref_nonempty', false, 'reuse_evidence_reference_missing'],
    ['burden_finite_nonnegative_non_negative_zero', false, 'invalid_burden'],
  ],
  reuse_origin_binding: {
    same_case: 'reuse_origin_same_case_and_origin_case_ref_equals_current_case_ref_and_reuse_evidence_namespace_equals_current_evidence_namespace',
    public_immutable: 'reuse_origin_public_immutable_and_origin_case_ref_not_equal_current_case_ref_and_namespace_public_and_nonempty_reuse_evidence_ref_public_source_ref_immutable_content_version_and_immutable_reference_true_and_contains_private_reasoning_false',
    all_other_cases: 'ineligible',
  },
  envelope_precedence: [
    'any_schema_control_manifest_trusted_evaluation_candidate_or_challenger_error=>abstain_hold,invalid_input,actionable_false',
    'expected_material_effect_empty=>abstain_hold,no_material_effect,actionable_false',
    'decision_consequence_low_value=>abstain_hold,no_material_effect,actionable_false',
    'evidence_state_sufficient_and_eligible_reuse_present=>reuse,current_sufficient,actionable_true,unresolved_gap_null,unresolved_evidence_refs_empty',
    'evidence_state_sufficient_and_no_eligible_reuse=>abstain_hold,source_incapable,actionable_false',
    'evidence_state_not_sufficient_and_unresolved_evidence_refs_empty=>abstain_hold,invalid_input,actionable_false',
    'evidence_state_not_sufficient_and_eligible_resolving_candidate_exists=>least_burden_then_enrich_ask_session_order',
    'evidence_state_contradiction_and_no_eligible_resolving_candidate=>abstain_hold,unresolved_contradiction,actionable_false',
    'evidence_state_gap_or_ambiguity_and_no_eligible_resolving_candidate=>abstain_hold,unknowable,actionable_false',
  ],
  selected_reason_by_route: { enrich: 'source_eligible', ask: 'one_human_fact_required', session: 'tacit_interdependence' },
  result_equalities: [
    'alternatives_equal_candidate_members_projected_to_route_eligible_burden_rejection_reasons_and_sorted_by_route_order',
    'unresolved_gap_equals_null_only_for_sufficient_evidence_otherwise_evidence_state',
    'challenger_result_and_boundary_equal_normalized_trusted_evaluation_values',
    'controlling_watermark_set_fingerprint_equals_recomputed_complete_selector_control_closure_set',
    'expiry_equals_earliest_nonnull_valid_until_in_complete_control_closure',
    'replanning_trigger_equals_controlling_change_or_expiry',
    'provisional_diagnostic_equals_the_exact_kernel_diagnostic_or_null_when_empty',
  ],
}

const candidateSet = r11.authoritative_row_schemas.selector_candidate_sets
candidateSet.schema_version = 'ctrl.g24.authoritative-row.selector-candidate-sets.r11.v1'
candidateSet.properties.selector_result_version = id
candidateSet.properties.candidate_members.min_items = 0
replaceProperties(candidateSet, candidateSet.properties)
r11.proof_set_schemas.selector_candidates = {
  schema_version: 'ctrl.g24.proof-set.selector-candidates.r11.v1',
  set_kind: 'selector_candidates',
  member_schema_ref: 'proof_member_schemas.selector_candidate',
  identity_projection: ['route'],
  ordering: 'reuse_enrich_ask_session',
  completeness: 'all_and_only_candidates_presented_to_the_locked_selector_exactly_once; zero_members_is_valid',
  owner_lineage_version_source: 'authoritative_row_schemas.selector_candidate_sets.properties.selector_result_version',
  owner_binding: 'candidate_set_fingerprint_equals_the_recomputed_set_seal_for_the_actual_zero_to_four_members_and_selector_result_owner_references_this_exact_row_and_seal',
  fingerprint_ref: 'set_seal_encoding',
}

const selectorRow = r11.authoritative_row_schemas.selector_results
selectorRow.schema_version = 'ctrl.g24.authoritative-row.selector-results.r11.v1'
const selectorProps = selectorRow.properties
selectorProps.decision_consequence = { type: 'enum', values: ['consequential', 'low_value'] }
selectorProps.evidence_state = { type: 'enum', values: ['sufficient', 'gap', 'ambiguity', 'contradiction'] }
selectorProps.alternatives = array({ schema_ref: 'proof_value_schemas.selector_alternative' }, { min_items: 0, max_items: 4, unique_by: 'route', ordered_by: 'reuse_enrich_ask_session' })
replaceProperties(selectorRow, selectorProps)
const selectorExt = r11.proof_bundle_schemas.extensions.selector_result
selectorExt.schema_version = 'ctrl.g24.proof.selector-result.r11.v1'
selectorExt.properties.controlling_watermark_set_fingerprint = fp
replaceProperties(selectorExt, selectorExt.properties)
const selectorMap = r11.proof_authority.proof_family_resolution_map.selector_result
selectorMap.extension_seals = [
  {
    extension_field: 'candidate_set_fingerprint',
    owner_row_field: 'candidate_set_fingerprint',
    set_schema_ref: 'proof_set_schemas.selector_candidates',
    set_owner_row: 'selector_candidate_sets',
    set_owner_join: [['owner.candidate_set_ref', 'selector_candidate_sets.candidate_set_ref'], ['owner.selector_result_version', 'selector_candidate_sets.selector_result_version']],
    equality: 'extension_owner_and_set_owner_field_equal_recomputed_complete_set_fingerprint',
    failure: 'proof_schema_hold',
  },
  {
    extension_field: 'controlling_watermark_set_fingerprint',
    owner_row_field: 'controlling_watermark_set_fingerprint',
    set_schema_ref: 'proof_set_schemas.controlling_watermarks',
    owner_lineage_version_source: 'authoritative_row_schemas.selector_results.properties.selector_result_version',
    equality: 'extension_and_owner_field_equal_recomputed_complete_set_fingerprint',
    failure: 'proof_schema_hold',
  },
]
r11.proof_set_schemas.controlling_watermarks.schema_version = 'ctrl.g24.proof-set.controlling-watermarks.r11.v1'
delete r11.proof_set_schemas.controlling_watermarks.owner_lineage_version_source
r11.proof_set_schemas.controlling_watermarks.owner_lineage_version_source_by_family = {
  selector_result: 'authoritative_row_schemas.selector_results.properties.selector_result_version',
  pending_release_and_authority: 'authoritative_row_schemas.pending_release_projections.properties.projection_version_ref',
}
r11.proof_set_schemas.controlling_watermarks.owner_binding = 'decoded_members_are_the_exact_complete_control_closure_bound_by_the_family_owner_and_owner_lineage_version_source_by_family'

// Answers resolve the approved question bytes and select one declared effect mechanically.
const answerEffect = closed('ctrl.g24.question-answer-effect.r11.v1', {
  effect_key: text,
  case_effect: { type: 'enum', values: ['rebuild_required', 'no_case_change'] },
  visible_consequence: text,
  retire_intervention_refs: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
  pending_human_owned_proposal: nullable(text),
}, {
  conditional_rules: ['case_effect_no_case_change_requires_null_proposal_and_empty_retire_intervention_refs'],
})
r11.proof_value_schemas.question_answer_effect = answerEffect
r11.proof_value_schemas.question_contract = closed('ctrl.g24.question-contract.r11.v1', {
  visible_wording: text,
  rendered_control_payload: text,
  answer_grammar: { type: 'enum', values: ['single_choice', 'ranked_choice', 'bounded_text', 'voice_critical_incident'] },
  options_or_comparator: array(text, { min_items: 1, max_items: 5, unique: true, order_semantic: true }),
  scoped_write_in: bool,
  honest_exits: array({ type: 'enum', values: ['unknown', 'defer', 'refuse', 'premise_wrong'] }, { exact_members: ['unknown', 'defer', 'refuse', 'premise_wrong'], ordered_by: 'unsigned_utf8' }),
  material_effect_disclosure: text,
  visible_changed_consequence: text,
  visible_unknown_consequence: text,
  answer_effects: array({ schema_ref: 'proof_value_schemas.question_answer_effect' }, { unique_by: 'effect_key', ordered_by: 'unsigned_utf8_effect_key' }),
  question_contract_fingerprint: fp,
}, {
  conditional_rules: [
    'effect_keys_equal_all_honest_exits_plus_every_single_choice_option_or_default_for_other_grammars_plus_default_when_scoped_write_in_true',
    'honest_exit_effects_all_have_no_case_change_null_proposal_and_empty_retirement_refs',
  ],
})
r11.fingerprint_schemas.question_contract = fingerprint('CTRL-G24-QUESTION-CONTRACT-R11', Object.keys(r11.proof_value_schemas.question_contract.properties).filter(key => key !== 'question_contract_fingerprint'))
linkFingerprint(r11.proof_value_schemas.question_contract, 'fingerprint_schemas.question_contract', 'question_contract_fingerprint')

const atomRow = r11.authoritative_row_schemas.intervention_atoms
atomRow.schema_version = 'ctrl.g24.authoritative-row.intervention-atoms.r11.v1'
replaceProperties(atomRow, {
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
  intervention_atom_ref: id, atom_version_ref: id,
  selector_result_ref: id, selector_result_version: id, selector_result_fingerprint: fp,
  atom_kind: { type: 'enum', values: ['question', 'session'] },
  content: text,
  payload_schema_version: id,
  payload_b64url: { type: 'base64url_without_padding' },
  payload_byte_length: nonneg,
  atom_content_fingerprint: fp,
  question_contract: nullable({ schema_ref: 'proof_value_schemas.question_contract' }),
  question_contract_fingerprint: nullable(fp),
  row_version_ref: id, valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp,
})
atomRow.conditional_rules = [
  'payload_b64url_decodes_to_exact_canonical_atom_payload_bytes_and_byte_length_and_atom_content_fingerprint_recomputes_over_schema_version_and_bytes',
  'atom_kind_question_iff_question_contract_and_question_contract_fingerprint_are_nonnull_and_equal_the_decoded_payload_question_contract',
  'atom_kind_session_iff_question_contract_and_question_contract_fingerprint_are_null',
]

const approvalRow = r11.authoritative_row_schemas.intervention_approval_receipts
approvalRow.schema_version = 'ctrl.g24.authoritative-row.intervention-approval-receipts.r11.v1'
approvalRow.properties.approval_authority_version_ref = id
approvalRow.properties.atom_payload_schema_version = id
approvalRow.properties.question_contract_fingerprint = nullable(fp)
approvalRow.properties.selector_result_ref = id
approvalRow.properties.selector_result_version = id
approvalRow.properties.selector_result_fingerprint = fp
approvalRow.properties.controlling_watermark_set_fingerprint = fp
replaceProperties(approvalRow, approvalRow.properties)
r11.approval_authority_derivation = {
  selector_resolution: 'approval_selector_result_ref_version_and_fingerprint_resolve_to_the_exact_current_selector_result_in_same_workspace_subject_case_snapshot',
  atom_equalities: [
    'approval.intervention_atom_ref_equals_atom.intervention_atom_ref',
    'approval.intervention_atom_version_ref_equals_atom.atom_version_ref',
    'approval.intervention_atom_content_fingerprint_equals_atom.atom_content_fingerprint',
    'approval.atom_payload_schema_version_equals_atom.payload_schema_version',
    'approval.question_contract_fingerprint_equals_atom.question_contract_fingerprint',
    'approval.selector_result_ref_version_and_fingerprint_equal_atom.selector_result_ref_version_and_fingerprint',
  ],
  authority_watermark: 'approval_authority_version_ref_byte_equals_the_version_ref_of_the_unique_base_authority_version_member_in_the_exact_selector_controlling_watermark_set',
  approver: 'approver_actor_ref_resolves_to_current_krish_identity_under_the_same_identity_control_and_snapshot',
  any_missing_duplicate_stale_or_mismatch: 'proof_schema_hold',
}

const leaderRow = r11.authoritative_row_schemas.leader_authority_receipts
leaderRow.schema_version = 'ctrl.g24.authoritative-row.leader-authority-receipts.r11.v1'
leaderRow.properties.intervention_atom_version_ref = id
leaderRow.properties.intervention_atom_content_fingerprint = fp
leaderRow.properties.question_contract_fingerprint = fp
replaceProperties(leaderRow, leaderRow.properties)

const answerRow = r11.authoritative_row_schemas.answer_receipts
answerRow.schema_version = 'ctrl.g24.authoritative-row.answer-receipts.r11.v1'
answerRow.properties.selected_effect_key = text
answerRow.properties.question_contract_fingerprint = fp
replaceProperties(answerRow, answerRow.properties)
r11.answer_derivation = {
  authority_chain: [
    'answer_owner_approval_receipt_ref_fingerprint_and_authority_version_resolve_to_exact_current_approved_intervention_receipt',
    'approval_atom_ref_version_payload_schema_content_fingerprint_and_question_contract_fingerprint_equal_exact_current_intervention_atom',
    'leader_authority_atom_ref_version_content_fingerprint_and_question_contract_fingerprint_equal_the_same_exact_atom',
    'answer_intervention_fingerprint_equals_atom_content_fingerprint',
  ],
  grammar_and_effect_key: {
    honest_exit: 'answer_kind_is_the_effect_key_and_value_is_null',
    single_choice_option: 'value_is_one_exact_offered_option_and_value_is_the_effect_key',
    ranked_choice: 'value_is_a_complete_unique_permutation_of_all_offered_options_and_effect_key_is_default',
    bounded_text_or_scoped_write_in: 'trimmed_nonempty_string_and_effect_key_is_default',
    voice_critical_incident: 'trimmed_nonempty_string_and_effect_key_is_default',
  },
  receipt_effect_equalities: [
    'selected_effect_key_equals_the_derived_effect_key',
    'case_effect_visible_consequence_pending_human_owned_proposal_and_retired_intervention_refs_equal_the_exact_question_contract_answer_effect_entry_for_selected_effect_key',
    'immutable_case_evidence_true',
    'automatic_reask_pressure_false',
    'automatic_session_escalation_false',
  ],
  any_missing_ambiguous_stale_or_mismatched_dependency: 'proof_schema_hold',
}
const answerMap = r11.proof_authority.proof_family_resolution_map.answer
answerMap.extension_rows.push(
  {
    table: 'intervention_approval_receipts',
    schema_ref: 'authoritative_row_schemas.intervention_approval_receipts',
    field_equalities: [],
    owner_join_equalities: [
      { owner_row_field: 'approval_receipt_ref', dependency_row_field: 'approval_receipt_ref' },
      { owner_row_field: 'approval_fingerprint', dependency_row_field: 'approval_receipt_fingerprint' },
      { owner_row_field: 'approval_authority_version_ref', dependency_row_field: 'approval_authority_version_ref' },
    ],
    scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
    current_rule: 'family_schema_current_selection', failure: 'proof_schema_hold',
  },
  {
    table: 'intervention_atoms',
    schema_ref: 'authoritative_row_schemas.intervention_atoms',
    field_equalities: [],
    owner_join_equalities: [
      { owner_row_field: 'intervention_atom_ref', dependency_row_field: 'intervention_atom_ref' },
      { owner_row_field: 'intervention_atom_version_ref', dependency_row_field: 'atom_version_ref' },
      { owner_row_field: 'intervention_fingerprint', dependency_row_field: 'atom_content_fingerprint' },
      { owner_row_field: 'question_contract_fingerprint', dependency_row_field: 'question_contract_fingerprint' },
    ],
    scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
    current_rule: 'family_schema_current_selection', failure: 'proof_schema_hold',
  },
)
answerMap.cross_row_equalities = [
  ['owner.intervention_atom_ref', 'intervention_approval_receipts.intervention_atom_ref', 'intervention_atoms.intervention_atom_ref', 'leader_authority_receipts.intervention_atom_ref', 'answer_visibility_acknowledgements.intervention_atom_ref'],
  ['owner.intervention_atom_version_ref', 'intervention_approval_receipts.intervention_atom_version_ref', 'intervention_atoms.atom_version_ref', 'leader_authority_receipts.intervention_atom_version_ref', 'answer_visibility_acknowledgements.intervention_atom_version_ref'],
  ['owner.intervention_fingerprint', 'intervention_approval_receipts.intervention_atom_content_fingerprint', 'intervention_atoms.atom_content_fingerprint', 'leader_authority_receipts.intervention_atom_content_fingerprint', 'answer_visibility_acknowledgements.answer_surface_fingerprint'],
  ['owner.approval_receipt_ref', 'intervention_approval_receipts.approval_receipt_ref'],
  ['owner.approval_fingerprint', 'intervention_approval_receipts.approval_receipt_fingerprint'],
  ['owner.approval_authority_version_ref', 'intervention_approval_receipts.approval_authority_version_ref'],
  ['owner.question_contract_fingerprint', 'intervention_approval_receipts.question_contract_fingerprint', 'intervention_atoms.question_contract_fingerprint', 'leader_authority_receipts.question_contract_fingerprint'],
]
const approvalMap = r11.proof_authority.proof_family_resolution_map.intervention_approval
approvalMap.extension_rows.push({
  table: 'selector_results',
  schema_ref: 'authoritative_row_schemas.selector_results',
  field_equalities: [],
  owner_join_equalities: [
    { owner_row_field: 'selector_result_ref', dependency_row_field: 'selector_result_ref' },
    { owner_row_field: 'selector_result_version', dependency_row_field: 'selector_result_version' },
    { owner_row_field: 'selector_result_fingerprint', dependency_row_field: 'selector_result_fingerprint' },
    { owner_row_field: 'controlling_watermark_set_fingerprint', dependency_row_field: 'controlling_watermark_set_fingerprint' },
  ],
  scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
  current_rule: 'family_schema_current_selection', failure: 'proof_schema_hold',
})
approvalMap.cross_row_equalities = [
  ['owner.intervention_atom_ref', 'intervention_atoms.intervention_atom_ref', 'intervention_visibility_acknowledgements.intervention_atom_ref'],
  ['owner.intervention_atom_version_ref', 'intervention_atoms.atom_version_ref', 'intervention_visibility_acknowledgements.atom_version_ref'],
  ['owner.intervention_atom_content_fingerprint', 'intervention_atoms.atom_content_fingerprint', 'intervention_visibility_acknowledgements.atom_content_fingerprint'],
  ['owner.atom_payload_schema_version', 'intervention_atoms.payload_schema_version'],
  ['owner.question_contract_fingerprint', 'intervention_atoms.question_contract_fingerprint'],
  ['owner.selector_result_ref', 'intervention_atoms.selector_result_ref', 'selector_results.selector_result_ref'],
  ['owner.selector_result_version', 'intervention_atoms.selector_result_version', 'selector_results.selector_result_version'],
  ['owner.selector_result_fingerprint', 'intervention_atoms.selector_result_fingerprint', 'selector_results.selector_result_fingerprint'],
  ['owner.controlling_watermark_set_fingerprint', 'selector_results.controlling_watermark_set_fingerprint'],
]

// Release authority binds the exact pending projection bytes, not only its identifier.
const releaseAuthorityRow = r11.authoritative_row_schemas.release_authority_receipts
releaseAuthorityRow.schema_version = 'ctrl.g24.authoritative-row.release-authority-receipts.r11.v1'
releaseAuthorityRow.properties.pending_projection_fingerprint = fp
replaceProperties(releaseAuthorityRow, releaseAuthorityRow.properties)
r11.proof_authority.proof_family_resolution_map.pending_release_and_authority.cross_row_equalities.push(
  ['owner.pending_projection_fingerprint', 'release_authority_receipts.pending_projection_fingerprint'],
)

// Lifecycle authority and preconditions are byte-equal projections of one 13-row catalogue.
const lifeTransition = r11.authoritative_row_schemas.lifecycle_transition_receipts
lifeTransition.schema_version = 'ctrl.g24.authoritative-row.lifecycle-transition-receipts.r11.v1'
Object.assign(lifeTransition.properties, {
  authority_canonical_text: id,
  actor_class: r11.authoritative_row_schemas.lifecycle_authority_receipts.properties.actor_class,
  acting_human_ref: id,
  actor_refs: array(id, { min_items: 1, max_items: 2, unique: true, ordered_by: 'unsigned_utf8' }),
  required_precondition_id: id,
  precondition_canonical_text: id,
  invalidation_canonical_text: id,
  receipt_type: id,
})
replaceProperties(lifeTransition, lifeTransition.properties)
r11.authoritative_row_schemas.lifecycle_snapshots.schema_version = 'ctrl.g24.authoritative-row.lifecycle-snapshots.r11.v1'
const lifeAuthority = r11.authoritative_row_schemas.lifecycle_authority_receipts
lifeAuthority.schema_version = 'ctrl.g24.authoritative-row.lifecycle-authority-receipts.r11.v1'
lifeAuthority.properties.authority_canonical_text = id
replaceProperties(lifeAuthority, lifeAuthority.properties)
const preconditionMember = r11.proof_member_schemas.lifecycle_precondition
preconditionMember.schema_version = 'ctrl.g24.lifecycle-precondition-member.r11.v1'
preconditionMember.properties.transition_id = lifeTransition.properties.transition_id
preconditionMember.properties.from_state = lifeTransition.properties.from_state
preconditionMember.properties.to_state = lifeTransition.properties.to_state
preconditionMember.properties.precondition_canonical_text = text
replaceProperties(preconditionMember, preconditionMember.properties)
r11.proof_member_fingerprint_schemas.lifecycle_precondition = fingerprint(
  'CTRL-G24-LIFECYCLE-PRECONDITION-MEMBER-R11',
  Object.keys(preconditionMember.properties).filter(key => key !== 'member_fingerprint'),
)
r11.lifecycle_exact_derivation = {
  catalogue_ref: 'lifecycle_precondition_catalog',
  transition_owner_fields_byte_equal_catalogue: ['transition_id', 'from_state', 'to_state', 'actor_class', 'authority_canonical_text', 'required_precondition_id', 'precondition_canonical_text', 'invalidation_canonical_text', 'receipt_type'],
  authority_row_fields_byte_equal_catalogue: ['transition_id', 'actor_class', 'authority_canonical_text'],
  precondition_member_field_equalities: [
    ['member.transition_id', 'catalogue.transition_id'],
    ['member.from_state', 'catalogue.from_state'],
    ['member.to_state', 'catalogue.to_state'],
    ['member.precondition_id', 'catalogue.required_precondition_id'],
    ['member.precondition_canonical_text', 'catalogue.precondition_canonical_text'],
  ],
  actor_rules: {
    krish: 'authority_kind_single_human_and_actor_refs_exactly_current_krish_identity_ref_and_acting_human_ref_equals_that_ref',
    named_leader_and_krish: 'authority_kind_joint_human_and_actor_refs_exactly_current_named_leader_ref_plus_current_krish_ref_and_acting_human_ref_is_one_of_those_refs',
    krish_or_krish_recording_named_leader_decline_or_withdrawal: 'authority_kind_single_human_and_actor_refs_exactly_current_krish_ref_and_acting_human_ref_equals_current_krish_ref_and_receipt_records_named_leader_decline_or_withdrawal_when_applicable',
    named_leader_or_krish: 'authority_kind_single_human_and_actor_refs_exactly_one_current_named_leader_or_current_krish_ref_and_acting_human_ref_equals_that_ref',
  },
  identity_resolution: 'actor_refs_and_acting_human_ref_resolve_through_identity_control_version_ref_to_exact_current_identity_rows_in_same_workspace_subject_case_snapshot',
  any_mismatch: 'proof_schema_hold',
}
const lifeMap = r11.proof_authority.proof_family_resolution_map.lifecycle
lifeMap.cross_row_equalities = [
  ['owner.transition_id', 'lifecycle_authority_receipts.transition_id'],
  ['owner.actor_class', 'lifecycle_authority_receipts.actor_class'],
  ['owner.authority_canonical_text', 'lifecycle_authority_receipts.authority_canonical_text'],
  ['owner.acting_human_ref', 'lifecycle_authority_receipts.acting_human_ref'],
  ['owner.actor_refs', 'lifecycle_authority_receipts.actor_refs'],
  ['owner.to_state', 'lifecycle_snapshots.state'],
  ['owner.predecessor_lifecycle_version_ref', 'lifecycle_snapshots.predecessor_lifecycle_version_ref', 'lifecycle_authority_receipts.predecessor_lifecycle_version_ref'],
]
r11.proof_set_schemas.lifecycle_preconditions.schema_version = 'ctrl.g24.proof-set.lifecycle-preconditions.r11.v1'
r11.proof_set_schemas.lifecycle_preconditions.owner_binding = 'every_member_transition_from_to_precondition_id_and_precondition_text_are_byte_equal_to_the_exact_catalogue_row_for_owner_transition_id_and_the_set_seal_recomputes_under_owner_row_version_ref'

// Watermark changes are a closed total classification, with invalid null patterns rejected.
r11.watermark_change_derivation = {
  valid_side: 'lineage_ref_and_version_ref_are_both_null_or_both_nonnull',
  invalid_patterns: ['partial_null_bound_side', 'partial_null_current_side', 'both_sides_absent', 'both_sides_byte_equal'],
  precedence: [
    'bound_present_and_current_absent=>removed',
    'bound_absent_and_current_present=>newly_applicable',
    'both_present_and_lineage_different=>lineage_changed_even_if_version_also_differs',
    'both_present_and_lineage_equal_and_version_different=>version_changed',
  ],
  base_member_constraints: 'base_identity_must_exist_on_both_sides_so_removed_and_newly_applicable_are_invalid_for_kind_class_base',
  complete_change_set: 'all_and_only_changed_identities_once; unchanged_and_invalid_entries_forbidden; each member_uses_variant_fingerprint_then_exact_set_member_entry_encoding',
}
r11.type_registry.controlling_watermark_change.variants.base.schema_version = 'ctrl.g24.controlling-watermark-change-base.r11.v1'
r11.type_registry.controlling_watermark_change.variants.applicable_control.schema_version = 'ctrl.g24.controlling-watermark-change-control.r11.v1'
r11.controlling_watermarks.set_fingerprint.member_entry_encoding = 'variant_name_framed_then_variant_member_fingerprint_32_raw_bytes; sort_unique_by_kind_class_then_base_kind_or_control_id_unsigned_utf8'

for (const schema of [
  r11.result_payload_schemas.use_release.variants.invalidated_before_use,
  r11.release_invalidation.invalidation_receipt_schema,
]) {
  schema.schema_version = schema.schema_version.replace(/r\d+/, 'r11')
  schema.conditional_rules = [
    ...(schema.conditional_rules ?? []),
    'every_change_member_satisfies_watermark_change_derivation_and_changed_controlling_watermark_kinds_is_the_exact_complete_change_set',
]
}
r11.result_payload_schemas.use_release.schema_version = 'ctrl.g24.result.use-release.r11.v1'
r11.operation_specs.use_release.schema_version = 'ctrl.g24.intent.use-release.r11.v1'
r11.operation_specs.use_release.result_schema = r11.result_payload_schemas.use_release.schema_version
r11.evaluator_abi.operation_result_exports.use_release = r11.result_payload_schemas.use_release.schema_version
r11.evaluator_abi.operation_result_exports_schema.properties.use_release = { const: r11.result_payload_schemas.use_release.schema_version }

// Outbox: exact payload consumption, current invocation authority and safe exhausted terminal.
r11.outbox.payload_consumption_schema.schema_version = 'ctrl.g24.outbox-payload-consumption.r11.v1'
r11.outbox.payload_consumption_schema.exact_equalities = [
  'payload_schema_version_byte_equals_transition_resolved_payload_schema_version_and_payload_row_schema_version',
  'payload_ref_byte_equals_transition_payload_ref_and_payload_row_identity_field_named_by_payload_binding_map',
  'payload_fingerprint_byte_equals_transition_payload_fingerprint_and_recomputed_payload_row_fingerprint_named_by_payload_binding_map',
  'outbox_effect_ref_byte_equals_transition_outbox_effect_ref_and_payload_row_effect_field_named_by_payload_binding_map',
  'transition_event_ref_byte_equals_the_single_consuming_transition_event_ref',
]
r11.fingerprint_schemas.outbox_payload_consumption = fingerprint('CTRL-G24-OUTBOX-PAYLOAD-CONSUMPTION-R11', Object.keys(r11.outbox.payload_consumption_schema.properties).filter(key => key !== 'consumption_fingerprint'))
r11.outbox.append_transition_transaction.admission_predicate = [
  ...r11.outbox.append_transition_transaction.admission_predicate.filter(rule => !rule.startsWith('payload_') && !rule.startsWith('no_payload_consumption')),
  ...r11.outbox.payload_consumption_schema.exact_equalities,
  'no_payload_consumption_exists_for_exact_payload_schema_version_and_payload_ref_and_no_other_consumption_names_this_transition_event_ref',
]
r11.outbox.transition_table = r11.outbox.transition_table.map(row => {
  if (row.event_kind === 'reconciled_success') return { ...row, event_schema_ref: 'outbox.reconciled_success_evidence_schema' }
  if (row.event_kind === 'reconciled_failure') return { ...row, event_schema_ref: 'outbox.reconciled_failure_evidence_schema' }
  if (row.event_kind === 'reservation_budget_exhausted_without_invocation') {
    return { ...row, condition: 'exactly_three_committed_reservations_and_total_provider_invocation_event_count_for_effect_equals_zero_and_every_dispatch_has_proven_no_invocation_successor' }
  }
  return row
})
r11.outbox.reservation_budget_exhausted_schema.schema_version = 'ctrl.g24.outbox-reservation-budget-exhausted.r11.v1'
r11.outbox.reservation_budget_exhausted_schema.properties.provider_invocation_count = { const: 0 }
r11.fingerprint_schemas.outbox_reservation_budget_exhausted = fingerprint('CTRL-G24-OUTBOX-RESERVATION-BUDGET-EXHAUSTED-R11', Object.keys(r11.outbox.reservation_budget_exhausted_schema.properties).filter(key => key !== 'exhaustion_fingerprint'))
r11.outbox.invocation_capability_protocol.schema_version = 'ctrl.g24.invocation-capability-protocol.r11.v1'
r11.outbox.provider_call_gate.current_rechecks_immediately_before_invocation = [
  'effect_payload_fingerprint_unchanged',
  'current_fenced_claim_worker_matches_invocation_event',
  'server_now_strictly_before_dispatch_lease_expiry',
  'invocation_event_is_the_unique_current_tip_and_has_no_successor',
  'provider_operation_capability_is_current_unambiguous_unexpired_unconsumed_and_bound_to_exact_invocation_event_dispatch_effect_worker_and_fence',
  'no_reaper_abandonment_ambiguity_or_terminal_event_exists_for_dispatch_or_effect',
  'all_operation_specific_authority_predicates_still_pass',
  'committed_reservation_count_lte_three',
]
r11.outbox.provider_call_gate.any_failed_recheck = 'do_not_call_provider; append_exact_noncalling_terminal_or_ambiguity_transition_when_authorized'

const originSchema = closed('ctrl.g24.outbox-effect-origin.r11.v1', {
  origin_ref: id,
  outbox_effect_ref: id,
  source_operation_id: id,
  source_operation_result_schema_version: id,
  source_operation_result_ref: id,
  source_operation_result_fingerprint: fp,
  successful_result_branch: id,
  canonical_effect_payload_schema_version: id,
  canonical_effect_payload_b64url: { type: 'base64url_without_padding' },
  canonical_effect_payload_byte_length: nonneg,
  canonical_effect_payload_fingerprint: fp,
  case_ref: id,
  effect_kind: { type: 'enum', values: ['enrichment_query', 'customer_delivery'] },
  origin_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['origin_ref'], ['outbox_effect_ref']],
})
r11.outbox.effect_origin_schema = originSchema
r11.fingerprint_schemas.outbox_effect_origin = fingerprint('CTRL-G24-OUTBOX-EFFECT-ORIGIN-R11', Object.keys(originSchema.properties).filter(key => key !== 'origin_fingerprint'))
linkFingerprint(originSchema, 'fingerprint_schemas.outbox_effect_origin', 'origin_fingerprint')

const effectSchema = r11.outbox.effect_schema
effectSchema.schema_version = 'ctrl.g24.outbox-effect.r11.v1'
effectSchema.properties.effect_schema_version = { const: 'ctrl.g24.outbox-effect.r11.v1' }
effectSchema.properties.origin_ref = id
effectSchema.properties.origin_fingerprint = fp
replaceProperties(effectSchema, effectSchema.properties)
r11.fingerprint_schemas.outbox_effect = fingerprint('CTRL-G24-OUTBOX-EFFECT-R11', Object.keys(effectSchema.properties).filter(key => key !== 'effect_fingerprint'))
r11.outbox.genesis_protocol = {
  transaction: 'one_serializable_compare_and_swap_transaction',
  writes: ['one_exact_successful_operation_result', 'one_outbox_effect_origin', 'one_outbox_effect', 'one_creation_event'],
  exact_equalities: [
    'origin_source_operation_id_result_schema_version_result_ref_result_fingerprint_and_successful_branch_equal_the_exact_committed_successful_operation_result',
    'origin_canonical_effect_payload_schema_version_bytes_byte_length_and_fingerprint_equal_the_effect_payload_fields',
    'origin_case_ref_and_effect_kind_equal_effect_case_ref_and_effect_kind',
    'effect_origin_ref_and_fingerprint_equal_the_exact_origin_row',
    'creation_event_effect_ref_and_fingerprint_equal_the_exact_effect_row',
  ],
  allowed_origin_by_effect_kind: {
    enrichment_query: {
      source_operation_id: 'create_enrichment_plan',
      source_operation_result_schema_ref: 'result_payload_schemas.create_enrichment_plan',
      successful_result_branch: 'single_closed_success_result',
      result_ref_field: 'plan_ref',
      result_fingerprint_field: 'plan_fingerprint',
      required_result_constants: { standing: 'open' },
      canonical_payload_source: 'the_exact_canonical_enrichment_plan_written_by_the_same_operation_transaction',
    },
    customer_delivery: {
      source_operation_id: 'use_release',
      source_operation_result_schema_ref: 'result_payload_schemas.use_release.variants.pending_delivery',
      successful_result_branch: 'pending_delivery',
      result_ref_field: 'release_use_receipt_ref',
      result_fingerprint_ref: 'fingerprint_schemas.use_release_pending_delivery_result',
      required_result_constants: { standing: 'pending_delivery' },
      outbox_effect_ref_field: 'outbox_effect_ref',
      canonical_payload_source: 'the_exact_current_pending_projection_bytes_consumed_by_the_same_use_release_transaction',
    },
  },
  no_effect_from_hold_ineligible_invalidated_noop_or_failed_branch: true,
  creation_event_is_unique_initial_tip_for_effect: true,
  no_transition_may_reference_pending_without_verified_origin_effect_and_creation_rows: true,
}
r11.fingerprint_schemas.use_release_pending_delivery_result = fingerprint(
  'CTRL-G24-USE-RELEASE-PENDING-DELIVERY-RESULT-R11',
  Object.keys(r11.result_payload_schemas.use_release.variants.pending_delivery.properties),
)

// Every schema whose accepted bytes changed carries a new version.
const changedRows = [
  'selector_results', 'selector_candidate_sets', 'answer_receipts', 'intervention_atoms',
  'intervention_approval_receipts', 'leader_authority_receipts', 'release_authority_receipts',
  'lifecycle_transition_receipts', 'lifecycle_snapshots', 'lifecycle_authority_receipts',
]
for (const table of changedRows) refreshRow(table)
r11.schema_change_manifest = Object.fromEntries(changedRows.map(table => [
  `authoritative_row_schemas.${table}`,
  r11.authoritative_row_schemas[table].schema_version,
]))
Object.assign(r11.schema_change_manifest, {
  'proof_member_schemas.selector_candidate': r11.proof_member_schemas.selector_candidate.schema_version,
  'proof_member_schemas.lifecycle_precondition': r11.proof_member_schemas.lifecycle_precondition.schema_version,
  'proof_set_schemas.selector_candidates': r11.proof_set_schemas.selector_candidates.schema_version,
  'proof_set_schemas.controlling_watermarks': r11.proof_set_schemas.controlling_watermarks.schema_version,
  'proof_set_schemas.lifecycle_preconditions': r11.proof_set_schemas.lifecycle_preconditions.schema_version,
  'proof_value_schemas.selector_alternative': r11.proof_value_schemas.selector_alternative.schema_version,
  'proof_value_schemas.question_contract': r11.proof_value_schemas.question_contract.schema_version,
  'proof_value_schemas.question_answer_effect': r11.proof_value_schemas.question_answer_effect.schema_version,
  'outbox.payload_consumption_schema': r11.outbox.payload_consumption_schema.schema_version,
  'outbox.reservation_budget_exhausted_schema': r11.outbox.reservation_budget_exhausted_schema.schema_version,
  'outbox.effect_origin_schema': r11.outbox.effect_origin_schema.schema_version,
  'outbox.effect_schema': r11.outbox.effect_schema.schema_version,
  'result_payload_schemas.use_release': r11.result_payload_schemas.use_release.schema_version,
  'operation_specs.use_release': r11.operation_specs.use_release.schema_version,
})

for (const family of r11.proof_family_names) {
  const schema = r11.proof_bundle_schemas.extensions[family]
  schema.schema_version = `ctrl.g24.proof.${family.replaceAll('_', '-')}.r11.v1`
  r11.evaluator_abi.proof_family_exports[family] = schema.schema_version
  r11.evaluator_abi.proof_family_exports_schema.properties[family] = { const: schema.schema_version }
}
r11.required_negative_fixture_families = [...new Set([
  ...r11.required_negative_fixture_families,
  'injective_nullable_number_and_discriminated_canonical_encoding',
  'selector_zero_to_four_set_exact_rejection_derivation_and_result_precedence',
  'answer_approval_atom_authority_question_contract_and_effect_derivation',
  'lifecycle_catalog_identity_actor_and_precondition_byte_equality',
  'watermark_change_total_classification_and_variant_set_encoding',
  'outbox_exact_payload_consumption_current_invocation_and_effect_origin',
  'no_unversioned_changed_schema',
])]
r11.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r11)
export const materializedR11 = r11
export const materializedR11Output = `${JSON.stringify(r11, null, 2)}\n`
export const materializedR11Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR11Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR11Output) {
      console.error(`${outputPath} is not the exact generator output`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R11 effective contract`)
  } else process.stdout.write(materializedR11Output)
}
