import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const r9Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r9.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r10.json'
const r9Bytes = read(r9Path)
const r10 = JSON.parse(r9Bytes)

const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const pos = { type: 'positive_integer' }
const nonneg = { type: 'safe_nonnegative_integer' }
const bool = { type: 'boolean' }
const text = { type: 'human_text' }
const nullableId = { type: 'nullable', value_schema: id }
const nullableText = { type: 'nullable', value_schema: text }
const nullableFp = { type: 'nullable', value_schema: fp }
const route = { type: 'enum', values: ['reuse', 'enrich', 'ask', 'session'] }
const selectedRoute = { type: 'enum', values: ['reuse', 'enrich', 'ask', 'session', 'abstain_hold'] }

function closed(schemaVersion, properties, extras = {}) {
  const keys = Object.keys(properties)
  const optional = extras.optional ?? []
  return {
    schema_version: schemaVersion,
    type: 'object',
    exact_keys: keys,
    required: keys.filter(key => !optional.includes(key)),
    ...(optional.length ? { optional } : {}),
    additional_properties: false,
    properties,
    ...extras,
  }
}

function array(items, extras = {}) {
  return { type: 'array', items, ...extras }
}

function fingerprint(domainAscii, orderedFields) {
  return {
    domain_ascii: domainAscii,
    field_encoding_ref: 'canonical_field_encoding',
    preimage_order: ['domain_ascii', ...orderedFields],
    fingerprint_field_excluded_from_preimage: true,
    digest: 'sha256_of_exact_preimage',
  }
}

function linkFingerprint(schema, ref, field) {
  schema.fingerprint_ref = ref
  schema.fingerprint_field = field
  schema.fingerprint_field_must_equal_referenced_preimage_digest = true
}

function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}

function replaceClosedProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}

r10.schema_version = 'ctrl.g24.trusted-ingress.r10.effective.v1'
r10.status = 'ninth_repair_candidate_under_independent_review'
r10.supersedes = {
  commit: 'c1a0fd1909598157559ab4e6e4737374216bdba2',
  tree: '3b9f15c123f24252db2c2c0ca7db1743af8fe015',
  human_blob: '08ff5907c86ed2534ce753183222625dd2559fb0',
  machine_blob: '7d736361ca92ec44e13e0e9cc7c5a0c0264b8bc3',
  qa_blob: 'c167b3f83583583773a635c30300f0023d4072af',
  checker_blob: 'ce4434f0aafb537c1781bfebe651b91d4d023c78',
  materializer_blob: 'b2bca59702123ee65e7f40e73eb122e0440935cc',
  adjudication: 'veto',
}
r10.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r10.mjs',
  frozen_input: { path: r9Path, sha256: sha256(r9Bytes) },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// One watermark authority, with exact variant fingerprints and no versionless duplicate schema.
const baseWatermark = r10.type_registry.controlling_watermark_member.variants.base
const controlWatermark = r10.type_registry.controlling_watermark_member.variants.applicable_control
baseWatermark.schema_version = 'ctrl.g24.controlling-watermark-member-base.r10.v1'
controlWatermark.schema_version = 'ctrl.g24.controlling-watermark-member-control.r10.v1'
r10.controlling_watermarks.member_schema_ref = 'type_registry.controlling_watermark_member'
delete r10.controlling_watermarks.member_schema
r10.controlling_watermarks.member_identity = {
  base: ['kind_class', 'base_kind', 'lineage_ref', 'version_ref'],
  applicable_control: ['kind_class', 'control_id', 'lineage_ref', 'version_ref'],
}
r10.controlling_watermarks.member_fingerprint_by_variant = {
  base: fingerprint('CTRL-G24-CONTROLLING-WATERMARK-BASE-R10', ['kind_class', 'base_kind', 'lineage_ref', 'version_ref']),
  applicable_control: fingerprint('CTRL-G24-CONTROLLING-WATERMARK-CONTROL-R10', ['kind_class', 'control_id', 'lineage_ref', 'version_ref']),
}
r10.controlling_watermarks.set_fingerprint.member_fingerprint_ref_by_variant = {
  base: 'controlling_watermarks.member_fingerprint_by_variant.base',
  applicable_control: 'controlling_watermarks.member_fingerprint_by_variant.applicable_control',
}
delete r10.controlling_watermarks.set_fingerprint.member_preimage_order

// Invalidation entries identify whether the recorded or current side changed or disappeared.
r10.type_registry.controlling_watermark_change = {
  json_type: 'object',
  discriminator: 'kind_class',
  common_semantics: 'identity_fields_name_one_control; bound_and_current_fields_are_the_exact_compared_values; null_means_absent',
  variants: {
    base: closed('ctrl.g24.controlling-watermark-change-base.r10.v1', {
      kind_class: { const: 'base' },
      base_kind: structuredClone(baseWatermark.properties.base_kind),
      change_kind: { type: 'enum', values: ['lineage_changed', 'version_changed', 'removed', 'newly_applicable'] },
      bound_lineage_ref: nullableId,
      bound_version_ref: nullableId,
      current_lineage_ref: nullableId,
      current_version_ref: nullableId,
    }),
    applicable_control: closed('ctrl.g24.controlling-watermark-change-control.r10.v1', {
      kind_class: { const: 'applicable_control' },
      control_id: id,
      change_kind: { type: 'enum', values: ['lineage_changed', 'version_changed', 'removed', 'newly_applicable'] },
      bound_lineage_ref: nullableId,
      bound_version_ref: nullableId,
      current_lineage_ref: nullableId,
      current_version_ref: nullableId,
    }),
  },
}
for (const schema of [
  r10.result_payload_schemas.use_release.variants.invalidated_before_use,
  r10.release_invalidation.invalidation_receipt_schema,
]) {
  schema.properties.changed_controlling_watermark_kinds.items = { type: 'controlling_watermark_change' }
  schema.properties.changed_controlling_watermark_kinds.ordered_by = 'kind_class_then_base_kind_or_control_id_unsigned_utf8'
}
r10.release_invalidation.change_comparison = {
  recorded_side_source: 'pending_release_projections.controlling_watermark_set_fingerprint_and_decoded_complete_set',
  current_side_source: 'fresh_complete_control_closure_at_use_time',
  exactly_one_change_entry_per_changed_identity: true,
  unchanged_identity_forbidden: true,
}

// Proof values reproduce the exact locked headless selector and answer semantics.
r10.type_registry.finite_nonnegative_number = {
  json_type: 'number', finite: true, minimum: 0, negative_zero_allowed: false,
}
r10.type_registry.nullable = {
  json_type: ['null', 'schema_value'], schema_field: 'value_schema', additional_properties: false,
}
r10.proof_value_schemas = {
  trusted_evaluation: closed('ctrl.g24.trusted-evaluation.r10.v1', {
    evaluation_version: id,
    decision_requirement_version: id,
    evidence_coverage_version: id,
    trusted_cutoff_version: id,
    epistemic_policy_version: id,
    independent_challenger_result_version: id,
    challenger_result: { type: 'enum', values: ['countercase_found', 'none_found_within_declared_boundary', 'indeterminate'] },
    challenger_search_boundary: nullableId,
    control_manifest_version: id,
    control_graph_fingerprint: fp,
    trusted_as_of: ts,
  }),
  answer_value_by_kind: {
    type: 'discriminated_value',
    discriminator_source_field: 'answer_kind',
    variants: {
      option: id,
      ranking: array(id, { min_items: 1, max_items: 5, unique: true, order_semantic: true }),
      write_in: text,
      voice: text,
      unknown: { const: null },
      defer: { const: null },
      refuse: { const: null },
      premise_wrong: { const: null },
    },
  },
}
r10.type_registry.discriminated_value = {
  json_type: ['null', 'string', 'array'], discriminator_source_field_required: true, variants_required: true,
}

r10.proof_member_schemas.selector_candidate = closed('ctrl.g24.selector-candidate-member.r10.v1', {
  route,
  permitted: bool,
  capable: bool,
  resolves_gap: bool,
  within_deadline: bool,
  within_budget: bool,
  fresh: bool,
  audience_compatible: bool,
  provenance_independent: bool,
  use_specific_sufficient: bool,
  counterevidence_treated: bool,
  reuse_origin: { type: 'enum', values: ['same_case', 'same_person_other_case', 'same_workspace_other_case', 'public_immutable'] },
  origin_case_ref: id,
  reuse_evidence_namespace: id,
  reuse_evidence_ref: id,
  public_source_ref: nullableId,
  immutable_content_version: nullableId,
  immutable_reference: bool,
  contains_private_reasoning: bool,
  trusted_evaluation_version: id,
  eligible: bool,
  burden: { type: 'finite_nonnegative_number' },
  rejection_reasons: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
  candidate_fingerprint: fp,
}, {
  conditional_rules: [
    'eligible_iff_rejection_reasons_empty',
    'every_false_required_capability_or_policy_boolean_contributes_its_exact_canonical_rejection_reason',
    'reuse_requires_same_case_or_public_immutable_origin_and_nonempty_reuse_evidence_ref',
    'trusted_evaluation_version_equals_selector_owner_trusted_evaluation_evaluation_version',
  ],
})
r10.proof_member_fingerprint_schemas.selector_candidate = fingerprint('CTRL-G24-SELECTOR-CANDIDATE-MEMBER-R10', Object.keys(r10.proof_member_schemas.selector_candidate.properties).filter(key => key !== 'candidate_fingerprint'))
linkFingerprint(r10.proof_member_schemas.selector_candidate, 'proof_member_fingerprint_schemas.selector_candidate', 'candidate_fingerprint')

r10.proof_member_schemas.answer_chain_member = closed('ctrl.g24.answer-chain-member.r10.v1', {
  chain_position: { type: 'enum', values: ['genesis', 'successor'] },
  append_ordinal: pos,
  answer_receipt_ref: id,
  answer_receipt_fingerprint: fp,
  predecessor_chain_tip: nullableFp,
  member_fingerprint: fp,
}, {
  conditional_rules: [
    'chain_position_genesis_iff_append_ordinal_one_and_predecessor_chain_tip_null',
    'chain_position_successor_iff_append_ordinal_gt_one_and_predecessor_chain_tip_equals_prior_complete_prefix_fingerprint',
  ],
})
r10.proof_member_fingerprint_schemas.answer_chain_member = fingerprint('CTRL-G24-ANSWER-CHAIN-MEMBER-R10', Object.keys(r10.proof_member_schemas.answer_chain_member.properties).filter(key => key !== 'member_fingerprint'))
linkFingerprint(r10.proof_member_schemas.answer_chain_member, 'proof_member_fingerprint_schemas.answer_chain_member', 'member_fingerprint')

r10.proof_member_schemas.answer_dependency_edge = closed('ctrl.g24.answer-dependency-edge.r10.v1', {
  edge_ref: id,
  source_answer_receipt_ref: id,
  source_answer_version_ref: id,
  dependent_record_kind: { type: 'enum', values: ['answer_receipt', 'correction_receipt', 'intervention_atom', 'pending_release_projection', 'enrichment_plan'] },
  dependent_record_ref: id,
  dependent_record_version_ref: id,
  dependent_record_fingerprint: fp,
  relation: { type: 'enum', values: ['supports', 'informs', 'invalidates_if_changed'] },
  edge_fingerprint: fp,
})
r10.proof_member_fingerprint_schemas.answer_dependency_edge = fingerprint('CTRL-G24-ANSWER-DEPENDENCY-EDGE-R10', Object.keys(r10.proof_member_schemas.answer_dependency_edge.properties).filter(key => key !== 'edge_fingerprint'))
linkFingerprint(r10.proof_member_schemas.answer_dependency_edge, 'proof_member_fingerprint_schemas.answer_dependency_edge', 'edge_fingerprint')

r10.proof_member_schemas.lifecycle_precondition = closed('ctrl.g24.lifecycle-precondition-member.r10.v1', {
  transition_id: structuredClone(r10.lifecycle_authority.action_schema.properties.transition_id),
  precondition_id: id,
  precondition_canonical_text: text,
  evidence_ref: id,
  evidence_fingerprint: fp,
  evaluator_version_ref: id,
  satisfied_at: ts,
  member_fingerprint: fp,
})
r10.proof_member_fingerprint_schemas.lifecycle_precondition = fingerprint('CTRL-G24-LIFECYCLE-PRECONDITION-MEMBER-R10', Object.keys(r10.proof_member_schemas.lifecycle_precondition.properties).filter(key => key !== 'member_fingerprint'))
linkFingerprint(r10.proof_member_schemas.lifecycle_precondition, 'proof_member_fingerprint_schemas.lifecycle_precondition', 'member_fingerprint')

const rowSchemas = r10.authoritative_row_schemas
replaceClosedProperties(rowSchemas.selector_candidate_sets, {
  ...Object.fromEntries(Object.entries(rowSchemas.selector_candidate_sets.properties).filter(([key]) => !['candidate_members', 'candidate_set_fingerprint', 'row_envelope_fingerprint'].includes(key))),
  candidate_members: array({ schema_ref: 'proof_member_schemas.selector_candidate' }, { min_items: 1, max_items: 4, unique_by: 'route', allowed_route_values: ['reuse', 'enrich', 'ask', 'session'], ordered_by: 'reuse_enrich_ask_session' }),
  candidate_set_fingerprint: fp,
  row_envelope_fingerprint: fp,
})

const selectorResultFields = {
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
  selector_result_ref: id,
  selector_result_version: id,
  current_case_ref: id,
  evidence_namespace: id,
  evidence_namespace_case_ref: id,
  purpose_ref: id,
  audience_ref: id,
  sensitivity_ref: id,
  accepted_decision_frame_ref: id,
  decision_requirement_ref: id,
  evidence_coverage_ref: id,
  selected_route_id: selectedRoute,
  reason_code: { type: 'enum', values: ['current_sufficient', 'source_eligible', 'one_human_fact_required', 'tacit_interdependence', 'insufficient_authority', 'source_incapable', 'unresolved_contradiction', 'unknowable', 'deadline', 'budget', 'no_material_effect', 'invalid_input'] },
  unresolved_gap: { type: 'nullable', value_schema: { type: 'enum', values: ['sufficient', 'gap', 'ambiguity', 'contradiction'] } },
  unresolved_evidence_refs: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
  expected_material_effect: text,
  candidate_set_ref: id,
  candidate_set_fingerprint: fp,
  selector_policy_version: id,
  selector_policy_fingerprint: fp,
  control_root_keys: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
  control_manifest_version: id,
  applicable_control_keys: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
  control_graph_fingerprint: fp,
  trusted_evaluation: { schema_ref: 'proof_value_schemas.trusted_evaluation' },
  challenger_result: { type: 'enum', values: ['countercase_found', 'none_found_within_declared_boundary', 'indeterminate'] },
  challenger_search_boundary: nullableId,
  controlling_watermark_set_fingerprint: fp,
  expiry: { type: 'nullable', value_schema: ts },
  replanning_trigger: { const: 'controlling_change_or_expiry' },
  actionable: bool,
  provisional_diagnostic: nullableText,
  selector_result_fingerprint: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp,
}
replaceClosedProperties(rowSchemas.selector_results, selectorResultFields)

replaceClosedProperties(rowSchemas.answer_receipts, {
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
  answer_receipt_ref: id,
  answer_version_ref: id,
  intervention_atom_ref: id,
  intervention_atom_version_ref: id,
  intervention_fingerprint: fp,
  approval_receipt_ref: id,
  approval_fingerprint: fp,
  approval_authority_version_ref: id,
  answer_kind: { schema_ref: 'shared_schemas.answer_kind' },
  answer_value: { schema_ref: 'proof_value_schemas.answer_value_by_kind' },
  immutable_case_evidence: { const: true },
  case_effect: { type: 'enum', values: ['rebuild_required', 'no_case_change'] },
  pending_human_owned_proposal: nullableId,
  retired_intervention_refs: array(id, { unique: true, ordered_by: 'unsigned_utf8' }),
  visible_consequence: text,
  automatic_reask_pressure: { const: false },
  automatic_session_escalation: { const: false },
  leader_authority_ref: id,
  leader_authority_fingerprint: fp,
  visible_effect_receipt_ref: id,
  visible_effect_receipt_fingerprint: fp,
  answer_receipt_fingerprint: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp,
})

replaceClosedProperties(rowSchemas.lifecycle_authority_receipts, {
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
  authority_receipt_ref: id,
  authority_kind: { type: 'enum', values: ['single_human', 'joint_human'] },
  transition_id: structuredClone(r10.lifecycle_authority.action_schema.properties.transition_id),
  actor_class: { type: 'enum', values: ['krish', 'named_leader_and_krish', 'krish_or_krish_recording_named_leader_decline_or_withdrawal', 'named_leader_or_krish'] },
  acting_human_ref: id,
  actor_refs: array(id, { min_items: 1, max_items: 2, unique: true, ordered_by: 'unsigned_utf8' }),
  predecessor_lifecycle_version_ref: nullableId,
  identity_control_version_ref: id,
  authority_version_ref: id,
  issued_at: ts,
  expires_at: ts,
  authority_receipt_fingerprint: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp,
})

rowSchemas.lifecycle_transition_receipts.properties.predecessor_lifecycle_version_ref = nullableId
rowSchemas.lifecycle_transition_receipts.properties.from_state = { type: 'enum', values: ['none', 'preparing', 'intensive_proof', 'continuing', 'paused', 'closing', 'closed'] }
rowSchemas.lifecycle_transition_receipts.exact_keys = Object.keys(rowSchemas.lifecycle_transition_receipts.properties)
rowSchemas.lifecycle_transition_receipts.required = [...rowSchemas.lifecycle_transition_receipts.exact_keys]
rowSchemas.lifecycle_snapshots.properties.predecessor_lifecycle_version_ref = nullableId
rowSchemas.lifecycle_snapshots.exact_keys = Object.keys(rowSchemas.lifecycle_snapshots.properties)
rowSchemas.lifecycle_snapshots.required = [...rowSchemas.lifecycle_snapshots.exact_keys]

// Exact lifecycle catalogue: the transition is the authority/precondition source, never free text.
const lifecycleRows = [
  ['open_preparation', 'none', 'preparing', 'krish', 'new_bounded_operator_private_preparation_decision', 'subject_purpose_eligible_source_classes_and_review_date_named', 'none', 'preparation_opened'],
  ['accept_intensive_proof', 'preparing', 'intensive_proof', 'named_leader_and_krish', 'accepted_engagement_purpose_and_current_permissions', 'accepted_decision_frame_active_grants_and_checkpoint_recorded', 'superseded_preparation_projections', 'intensive_proof_accepted'],
  ['close_preparation', 'preparing', 'closed', 'krish_or_krish_recording_named_leader_decline_or_withdrawal', 'current_preparation_cancellation_decline_or_withdrawal', 'current_preparation_version_and_reason', 'all_prepared_and_unsent_derivatives', 'preparation_closed'],
  ['continue_after_intensive_proof', 'intensive_proof', 'continuing', 'named_leader_and_krish', 'explicit_continuation_agreement', 'next_consequential_decision_or_evidenced_value_checkpoint_and_exit_or_revisit_condition', 'superseded_period_projections', 'continuation_accepted'],
  ['renew_continuing_period', 'continuing', 'continuing', 'named_leader_and_krish', 'fresh_checkpoint_agreement', 'next_consequential_decision_or_evidenced_value_and_exit_or_revisit_condition', 'superseded_period_projections', 'continuing_period_renewed'],
  ['pause_intensive_proof', 'intensive_proof', 'paused', 'named_leader_or_krish', 'pause_decision', 'current_period', 'all_unsent_interventions', 'engagement_paused'],
  ['pause_continuing', 'continuing', 'paused', 'named_leader_or_krish', 'pause_decision', 'current_period', 'all_unsent_interventions', 'engagement_paused'],
  ['resume_continuing', 'paused', 'continuing', 'named_leader_and_krish', 'revalidated_continuation_agreement', 'purpose_identity_grants_audience_standing_freshness_next_value_and_checkpoint_revalidated', 'all_stale_paused_projections', 'engagement_resumed'],
  ['close_intensive_proof', 'intensive_proof', 'closing', 'named_leader_or_krish', 'close_request', 'current_period', 'new_decision_shaping_work_and_unsent_interventions', 'engagement_close_requested'],
  ['close_continuing', 'continuing', 'closing', 'named_leader_or_krish', 'close_request', 'current_period', 'new_decision_shaping_work_and_unsent_interventions', 'engagement_close_requested'],
  ['close_paused', 'paused', 'closing', 'named_leader_or_krish', 'close_request', 'current_period', 'new_decision_shaping_work_and_unsent_interventions', 'engagement_close_requested'],
  ['complete_close', 'closing', 'closed', 'krish', 'record_completion_under_named_human_close_request', 'access_correction_separate_release_and_close_obligations_fulfilled_or_recorded_outstanding', 'all_prepared_and_unsent_derivatives', 'engagement_closed'],
  ['open_new_preparation_after_close', 'closed', 'preparing', 'krish', 'new_bounded_operator_private_preparation_decision', 'new_purpose_and_review_date_no_old_grant_revival', 'none', 'new_preparation_opened'],
]
r10.lifecycle_precondition_catalog = Object.fromEntries(lifecycleRows.map(([transitionId, from, to, actorClass, authority, precondition, invalidation, receiptType]) => [transitionId, {
  transition_id: transitionId,
  from_state: from,
  to_state: to,
  actor_class: actorClass,
  authority_canonical_text: authority,
  required_precondition_id: `${transitionId}:precondition`,
  precondition_canonical_text: precondition,
  invalidation_canonical_text: invalidation,
  receipt_type: receiptType,
}]))

// Cross-row equality is semantic, not limited to fields exposed in the proof extension.
const maps = r10.proof_authority.proof_family_resolution_map
maps.intervention_approval.cross_row_equalities = [
  ['owner.intervention_atom_ref', 'intervention_atoms.intervention_atom_ref', 'intervention_visibility_acknowledgements.intervention_atom_ref'],
  ['owner.intervention_atom_version_ref', 'intervention_atoms.atom_version_ref', 'intervention_visibility_acknowledgements.atom_version_ref'],
  ['owner.intervention_atom_content_fingerprint', 'intervention_atoms.atom_content_fingerprint', 'intervention_visibility_acknowledgements.atom_content_fingerprint'],
]
maps.answer.cross_row_equalities = [
  ['owner.intervention_atom_ref', 'leader_authority_receipts.intervention_atom_ref', 'answer_visibility_acknowledgements.intervention_atom_ref'],
  ['owner.intervention_atom_version_ref', 'answer_visibility_acknowledgements.intervention_atom_version_ref'],
  ['owner.intervention_fingerprint', 'answer_visibility_acknowledgements.answer_surface_fingerprint'],
]
maps.pending_release_and_authority.cross_row_equalities = [
  ['owner.pending_projection_ref', 'release_authority_receipts.pending_projection_ref'],
  ['owner.projection_version_ref', 'release_authority_receipts.projection_version_ref'],
]
maps.lifecycle.cross_row_equalities = [
  ['owner.transition_id', 'lifecycle_authority_receipts.transition_id'],
  ['owner.to_state', 'lifecycle_snapshots.state'],
  ['owner.predecessor_lifecycle_version_ref', 'lifecycle_snapshots.predecessor_lifecycle_version_ref', 'lifecycle_authority_receipts.predecessor_lifecycle_version_ref'],
]
r10.proof_authority.cross_row_equality_semantics = 'every_named_path_resolves_to_an_exact_current_row_in_the_family_scope_and_all_values_are_byte_equal'

for (const [name, set] of Object.entries(r10.proof_set_schemas)) {
  set.schema_version = `ctrl.g24.proof-set.${name.replaceAll('_', '-')}.r10.v1`
  set.owner_lineage_version_source = name === 'controlling_watermarks'
    ? 'authoritative_row_schemas.pending_release_projections.properties.projection_version_ref'
    : name === 'lifecycle_preconditions'
      ? 'authoritative_row_schemas.lifecycle_transition_receipts.properties.row_version_ref'
      : 'authoritative_row_schemas.correction_receipts.properties.row_version_ref'
}
r10.proof_set_schemas.answer_chain.genesis = 'append_ordinal_one_has_chain_position_genesis_and_null_predecessor_chain_tip'
r10.proof_set_schemas.answer_chain.owner_binding = 'every_member_answer_receipt_ref_and_fingerprint_resolves_to_the_exact_current_answer_row_in_the_same_case_and_snapshot'
r10.proof_set_schemas.answer_dependency_graph.owner_binding = 'every_typed_dependent_record_ref_version_and_fingerprint_resolves_under_its_kind_specific_authoritative_row_schema_in_the_same_case_and_snapshot'
r10.proof_set_schemas.controlling_watermarks.owner_binding = 'decoded_member_set_is_the_exact_complete_set_bound_by_the_owner_pending_projection'
r10.proof_set_schemas.selector_candidates = {
  schema_version: 'ctrl.g24.proof-set.selector-candidates.r10.v1',
  set_kind: 'selector_candidates',
  member_schema_ref: 'proof_member_schemas.selector_candidate',
  identity_projection: ['route'],
  ordering: 'reuse_enrich_ask_session',
  completeness: 'every_candidate_presented_to_the_locked_selector_exactly_once_with_no_invented_candidate_and_at_least_one_candidate',
  owner_lineage_version_source: 'authoritative_row_schemas.selector_results.properties.selector_result_version',
  owner_binding: 'candidate_set_fingerprint_is_recomputed_from_all_four_members_and_selected_route_is_abstain_hold_or_the_least_burden_eligible_route_under_canonical_route_tiebreak_order',
  fingerprint_ref: 'set_seal_encoding',
}
r10.proof_set_schemas.lifecycle_preconditions.catalog_ref = 'lifecycle_precondition_catalog'
r10.proof_set_schemas.lifecycle_preconditions.completeness = 'exact_catalog_required_precondition_id_for_transition_with_one_or_more_evidence_members_each_recomputed_and_no_other_precondition_id'

// Recompute changed row fingerprints after extending their exact semantic content.
for (const table of ['selector_results', 'selector_candidate_sets', 'answer_receipts', 'lifecycle_transition_receipts', 'lifecycle_snapshots', 'lifecycle_authority_receipts']) {
  const schema = rowSchemas[table]
  const semanticField = schema.semantic_fingerprint_field
  const metadata = new Set(['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint'])
  r10.authoritative_semantic_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R10`, Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== semanticField))
  r10.authoritative_row_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R10`, Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'))
}

// Every outbox payload belongs to one effect and is consumed by one transition only.
r10.outbox.payload_consumption_schema = closed('ctrl.g24.outbox-payload-consumption.r10.v1', {
  payload_schema_version: id,
  payload_ref: id,
  payload_fingerprint: fp,
  outbox_effect_ref: id,
  transition_event_ref: id,
  consumed_at: ts,
  consumption_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['payload_schema_version', 'payload_ref'], ['transition_event_ref']],
})
r10.fingerprint_schemas.outbox_payload_consumption = fingerprint('CTRL-G24-OUTBOX-PAYLOAD-CONSUMPTION-R10', Object.keys(r10.outbox.payload_consumption_schema.properties).filter(key => key !== 'consumption_fingerprint'))
linkFingerprint(r10.outbox.payload_consumption_schema, 'fingerprint_schemas.outbox_payload_consumption', 'consumption_fingerprint')
for (const binding of Object.values(r10.outbox.payload_binding_map)) binding.payload_effect_ref_field = 'outbox_effect_ref'

const reconciliationBase = r10.outbox.reconciliation_evidence_schema
function reconciliationSchema(outcome, version) {
  const schema = structuredClone(reconciliationBase)
  schema.schema_version = version
  schema.properties.evidence_schema_version = { const: version }
  schema.properties.observed_outcome = { const: outcome }
  schema.exact_keys = Object.keys(schema.properties)
  schema.required = [...schema.exact_keys]
  return schema
}
r10.outbox.reconciled_success_evidence_schema = reconciliationSchema('confirmed', 'ctrl.g24.provider-reconciled-success-evidence.r10.v1')
r10.outbox.reconciled_failure_evidence_schema = reconciliationSchema('failed', 'ctrl.g24.provider-reconciled-failure-evidence.r10.v1')
r10.fingerprint_schemas.provider_reconciled_success_evidence = fingerprint('CTRL-G24-PROVIDER-RECONCILED-SUCCESS-EVIDENCE-R10', Object.keys(r10.outbox.reconciled_success_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
r10.fingerprint_schemas.provider_reconciled_failure_evidence = fingerprint('CTRL-G24-PROVIDER-RECONCILED-FAILURE-EVIDENCE-R10', Object.keys(r10.outbox.reconciled_failure_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
linkFingerprint(r10.outbox.reconciled_success_evidence_schema, 'fingerprint_schemas.provider_reconciled_success_evidence', 'evidence_fingerprint')
linkFingerprint(r10.outbox.reconciled_failure_evidence_schema, 'fingerprint_schemas.provider_reconciled_failure_evidence', 'evidence_fingerprint')
r10.outbox.payload_binding_map.reconciled_success.payload_schema_ref = 'outbox.reconciled_success_evidence_schema'
r10.outbox.payload_binding_map.reconciled_failure.payload_schema_ref = 'outbox.reconciled_failure_evidence_schema'

r10.outbox.reservation_budget_exhausted_schema = closed('ctrl.g24.outbox-reservation-budget-exhausted.r10.v1', {
  exhaustion_ref: id,
  outbox_effect_ref: id,
  abandonment_ref: id,
  committed_reservation_count: { const: 3 },
  provider_invocation_count: nonneg,
  exhausted_at: ts,
  exhaustion_fingerprint: fp,
}, { append_only: true, unique_keys: [['exhaustion_ref'], ['outbox_effect_ref']] })
r10.fingerprint_schemas.outbox_reservation_budget_exhausted = fingerprint('CTRL-G24-OUTBOX-RESERVATION-BUDGET-EXHAUSTED-R10', Object.keys(r10.outbox.reservation_budget_exhausted_schema.properties).filter(key => key !== 'exhaustion_fingerprint'))
linkFingerprint(r10.outbox.reservation_budget_exhausted_schema, 'fingerprint_schemas.outbox_reservation_budget_exhausted', 'exhaustion_fingerprint')
r10.outbox.payload_binding_map.reservation_budget_exhausted_without_invocation = {
  payload_schema_ref: 'outbox.reservation_budget_exhausted_schema',
  payload_ref_field: 'exhaustion_ref',
  payload_fingerprint_field: 'exhaustion_fingerprint',
  payload_effect_ref_field: 'outbox_effect_ref',
}
r10.outbox.transition_event_schema.properties.event_kind.values.push('reservation_budget_exhausted_without_invocation')
r10.outbox.transition_table.splice(7, 0, {
  from: 'abandoned_not_invoked', to: 'failed',
  event_kind: 'reservation_budget_exhausted_without_invocation',
  event_schema_ref: 'outbox.reservation_budget_exhausted_schema',
  actor_authority_ref: 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity',
  condition: 'abandonment_proves_no_invocation_event_and_exactly_three_committed_reservations_exist',
  provider_call: false,
})

r10.outbox.append_transition_transaction.writes = ['one_exact_payload_row', 'one_outbox_transition_event', 'one_unique_payload_consumption']
r10.outbox.append_transition_transaction.admission_predicate = [
  'referenced_predecessor_exists_and_belongs_to_exact_effect',
  'predecessor_fingerprint_recomputes_and_equals_causal_predecessor_event_fingerprint',
  'predecessor_is_the_unique_current_tip_for_effect',
  'from_state_equals_predecessor_to_state_or_verified_creation_event_pending_state',
  'event_kind_maps_to_the_exact_transition_table_payload_schema',
  'payload_schema_version_equals_resolved_payload_schema_version',
  'payload_ref_and_fingerprint_equal_the_committed_payload_row',
  'payload_fingerprint_recomputes_under_the_resolved_payload_schema',
  'payload_outbox_effect_ref_equals_transition_outbox_effect_ref',
  'no_payload_consumption_exists_for_payload_schema_version_and_payload_ref',
  'from_state_to_state_event_kind_schema_actor_condition_and_provider_call_semantics_match_exact_transition_table_row',
  'transition_specific_condition_passes',
]
r10.outbox.invocation_capability_protocol.invocation_event_is_the_durable_consumption_of_call_authority = true
r10.outbox.invocation_capability_protocol.one_invocation_event_per_dispatch = true
r10.outbox.invocation_capability_protocol.capability_minted_only_to_process_that_committed_invocation_event = true
r10.outbox.invocation_capability_protocol.capability_consumption = 'provider_entrypoint_atomically_flips_the_in_process_single_use_token_before_crossing_provider_boundary'
r10.outbox.provider_call_gate.current_rechecks_immediately_before_invocation = [
  'effect_payload_fingerprint_unchanged',
  'current_fenced_claim_worker_matches_invocation_event',
  'provider_operation_capability_current_and_unambiguous',
  'all_operation_specific_authority_predicates_still_pass',
  'committed_reservation_count_lte_three',
]
r10.outbox.provider_call_gate.success_and_failure_rows_require_prior_invocation_event = true
r10.outbox.transition_table = r10.outbox.transition_table.map(row => ({
  ...row,
  provider_call: row.event_kind === 'provider_invocation_start'
    ? false
    : row.event_kind === 'provider_success' || row.event_kind === 'provider_failure' || row.event_kind === 'worker_ambiguity'
      ? 'call_may_only_have_occurred_via_the_exact_prior_invocation_event_capability'
      : false,
}))

// Refresh proof exports, exact reference graph expectations and mutation families.
for (const family of r10.proof_family_names) {
  const schema = r10.proof_bundle_schemas.extensions[family]
  schema.schema_version = `ctrl.g24.proof.${family.replaceAll('_', '-')}.r10.v1`
  r10.evaluator_abi.proof_family_exports[family] = schema.schema_version
  r10.evaluator_abi.proof_family_exports_schema.properties[family] = { const: schema.schema_version }
}
r10.required_negative_fixture_families = [...new Set([
  ...r10.required_negative_fixture_families,
  'single_watermark_authority_and_variant_preimage',
  'locked_kernel_selector_and_answer_semantic_parity',
  'lifecycle_actor_catalog_precondition_and_cross_row_parity',
  'proof_set_schema_version_owner_source_and_genesis',
  'outbox_effect_payload_consumption_and_exact_branch_binding',
  'provider_invocation_authority_recheck_and_no_invocation_budget_terminal',
])]
r10.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r10)
export const materializedR10 = r10
export const materializedR10Output = `${JSON.stringify(r10, null, 2)}\n`
export const materializedR10Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR10Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (read(outputPath) !== materializedR10Output) {
      console.error(`${outputPath} is not the exact generator output`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R10 effective contract`)
  } else process.stdout.write(materializedR10Output)
}
