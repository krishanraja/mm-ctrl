import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const parse = relative => JSON.parse(read(relative))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

const r3Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r3.json'
const r4Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r4.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r6.json'
const r3Bytes = read(r3Path)
const r4Bytes = read(r4Path)
const r3 = JSON.parse(r3Bytes)
const r4 = JSON.parse(r4Bytes)

const identifier = { type: 'identifier' }
const fingerprint = { type: 'sha256' }
const timestamp = { type: 'canonical_timestamp' }
const positiveInteger = { type: 'positive_integer' }
const booleanFalse = { const: false }

function closedSchema(schemaVersion, properties, extras = {}) {
  const keys = Object.keys(properties)
  return {
    schema_version: schemaVersion,
    type: 'object',
    exact_keys: keys,
    required: keys,
    additional_properties: false,
    properties,
    ...extras,
  }
}

function intentSchema(schemaVersion, properties, extras = {}) {
  return closedSchema(schemaVersion, properties, extras)
}

function resultSchema(schemaVersion, properties, extras = {}) {
  return closedSchema(schemaVersion, properties, extras)
}

function fingerprintRule(domainAscii, orderedFields) {
  return {
    domain_ascii: domainAscii,
    variable_field_frame: 'uint32_big_endian_byte_length_then_field_bytes',
    field_encoding: 'schema_type_canonical_bytes',
    hash_field_encoding: '32_raw_bytes_from_lowercase_hex_sha256',
    integer_encoding: 'uint64_big_endian',
    optional_absent_encoding: 'uint32_big_endian_length_zero_with_no_value_bytes',
    preimage_order: ['domain_ascii', ...orderedFields],
    fingerprint_field_excluded_from_preimage: true,
    digest: 'sha256_of_exact_preimage',
  }
}

function allSetSealsSchema(setSeals) {
  return {
    type: 'object',
    exact_keys: setSeals,
    required: setSeals,
    additional_properties: false,
    property_schema: 'set_seal_object_schema',
    property_key_must_equal_nested_set_kind: true,
  }
}

const setSeals = [
  'control_universe',
  'applicable_controls',
  'control_closure_edges',
  'visible_sources',
  'visible_assertions',
  'accepted_brain_items',
  'accepted_brain_relationships',
  'route_capability_registry',
  'receipt_chain_tips',
  'evaluator_registry',
  'provider_capability_registry',
  'operator_grants',
  'workload_grants',
]

const operationNames = [
  'select_intervention',
  'create_intervention',
  'stage_intervention_edit',
  'record_intervention_visibility',
  'approve_intervention',
  'record_answer',
  'correct_answer',
  'record_answer_transcription_repair',
  'record_leader_lifecycle_action',
  'record_operator_lifecycle_action',
  'combine_lifecycle_authority',
  'apply_lifecycle_transition',
  'compile_release',
  'use_release',
  'create_enrichment_plan',
  'record_enrichment_attempt',
]

const watermarkKinds = [
  'identity_version',
  'subject_version',
  'workspace_version',
  'authority_version',
  'permission_version',
  'audience_version',
  'purpose_version',
  'sensitivity_version',
  'validity_version',
  'retention_state_version',
  'lifecycle_version',
  'accepted_decision_frame_version',
  'decision_requirement_version',
  'evidence_coverage_version',
  'trusted_cutoff',
  'epistemic_policy_version',
  'independent_challenger_result_version',
  'canonical_source_versions',
  'canonical_assertion_versions',
  'canonical_brain_versions',
]

const r6 = structuredClone(r4)
r6.schema_version = 'ctrl.g24.trusted-ingress.r6.effective.v1'
r6.status = 'fifth_repair_candidate_under_independent_review'
r6.date = '2026-09-13'
r6.supersedes = {
  commit: '32b378582c18316ac3fb156ae82df60b3f29bb9b',
  tree: '05a29d2d038700d9e8b5c2b6509ad68bb797369b',
  human_blob: '80a6ca30e17fcf98cb137f272aeeda83b046dcb3',
  machine_blob: 'b20653edc02055b7253cc86261a849f9ec416b5e',
  qa_blob: '821e0e3e069e90f6d2bfcd1905eae79cc18980b5',
  checker_blob: 'c60650832d5b693ad44446fb5f2ee3ba8acdc3f1',
  adjudication: 'veto',
}
r6.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r6.mjs',
  historical_inputs: {
    r3_path: r3Path,
    r3_sha256: sha256(r3Bytes),
    r4_path: r4Path,
    r4_sha256: sha256(r4Bytes),
  },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
}
r6.resolution = {
  r1_through_r5_are_rejected_evidence: true,
  effective_contract_is_fully_materialized: true,
  no_runtime_merge_or_inheritance: true,
  every_effective_schema_and_rule_is_in_this_document: true,
}
r6.authority.closed = [...r4.authority.closed]
r6.scope = {
  ...r4.scope,
  intelligence: false,
  comprehension: false,
  delight: false,
  value: false,
}
r6.canonical_grammar = structuredClone(r3.canonical_grammar)
r6.shared_schemas = structuredClone(r3.shared_schemas)
r6.request_schema = structuredClone(r3.request)
r6.base_types = {
  source: 'materialized_from_exact_r3_canonical_grammar',
  identifier: structuredClone(r3.canonical_grammar.identifier),
  human_text: structuredClone(r3.canonical_grammar.human_text),
  canonical_timestamp: structuredClone(r3.canonical_grammar.canonical_timestamp),
  sha256: structuredClone(r3.canonical_grammar.sha256),
  base64url_without_padding: structuredClone(r3.canonical_grammar.base64url_without_padding),
  safe_integer: structuredClone(r3.canonical_grammar.safe_integer),
  optional: r3.canonical_grammar.optional,
  null: r3.canonical_grammar.null,
}

r6.principal_schemas.workload_identity.properties.capability_class.values = [
  ...r4.principal_schemas.workload_identity.properties.capability_class.values,
  'lifecycle_authority_recorder',
]
r6.workload_authority_predicates.workload_lifecycle_authority_recorder_predicate = {
  capability_class: 'lifecycle_authority_recorder',
  stable_workload_must_match_current_case_grant: true,
  permitted_operation: 'combine_lifecycle_authority',
  can_invent_human_authority: false,
  can_execute_transition: false,
}
r6.derived_authority_predicates.current_disclosure_predicate = [
  'current_authentication',
  'stable_principal_current_case_eligibility',
  'stable_principal_current_audience_eligibility',
  'retention_eligibility',
]

const transitionValues = r3.operations.apply_lifecycle_transition.intent.properties.transition_id.values
const lifecycleActionIntent = intentSchema('ctrl.g24.intent.lifecycle-authority-action.r6.v1', {
  transition_id: { type: 'enum', values: transitionValues },
  predecessor_lifecycle_version: identifier,
  nonce: identifier,
})

const operationSpecs = {}
for (const name of r4.operation_names) operationSpecs[name] = structuredClone(r3.operations[name])
operationSpecs.stage_intervention_edit = {
  schema_version: 'ctrl.g24.operation.stage-intervention-edit.r6.v1',
  actor_classes: ['krish_operator'],
  intent: intentSchema('ctrl.g24.intent.stage-intervention-edit.r6.v1', {
    intervention_atom_ref: identifier,
    base_atom_version_ref: identifier,
    edited_content: { type: 'human_text', max_utf8_bytes: 16384 },
  }),
  read_set: ['current_intervention_atom', 'current_case_authority', 'current_visibility_state'],
  write_set: ['new_immutable_staged_intervention_atom_version'],
  forbidden_write_set: ['visible_effect_receipt', 'approval_receipt', 'delivery_effect'],
}
operationSpecs.record_intervention_visibility = {
  schema_version: 'ctrl.g24.operation.record-intervention-visibility.r6.v1',
  actor_classes: ['krish_operator'],
  intent: intentSchema('ctrl.g24.intent.record-intervention-visibility.r6.v1', {
    intervention_atom_ref: identifier,
    atom_version_ref: identifier,
    atom_content_fingerprint: fingerprint,
    presentation_nonce: identifier,
  }),
  read_set: ['exact_staged_or_current_intervention_atom', 'current_case_authority'],
  write_set: ['intervention_visible_effect_receipt'],
  forbidden_write_set: ['intervention_atom', 'approval_receipt', 'delivery_effect'],
}
operationSpecs.record_leader_lifecycle_action = {
  schema_version: 'ctrl.g24.operation.record-leader-lifecycle-action.r6.v1',
  actor_classes: ['named_leader'],
  intent: structuredClone(lifecycleActionIntent),
  read_set: ['current_case_authority', 'current_lifecycle_version'],
  write_set: ['leader_lifecycle_authority_action'],
}
operationSpecs.record_operator_lifecycle_action = {
  schema_version: 'ctrl.g24.operation.record-operator-lifecycle-action.r6.v1',
  actor_classes: ['krish_operator'],
  intent: structuredClone(lifecycleActionIntent),
  read_set: ['current_case_authority', 'current_lifecycle_version'],
  write_set: ['operator_lifecycle_authority_action'],
}
operationSpecs.combine_lifecycle_authority = {
  schema_version: 'ctrl.g24.operation.combine-lifecycle-authority.r6.v1',
  actor_classes: ['lifecycle_authority_recorder'],
  intent: intentSchema('ctrl.g24.intent.combine-lifecycle-authority.r6.v1', {
    leader_action_ref: identifier,
    operator_action_ref: identifier,
  }),
  read_set: ['leader_lifecycle_authority_action', 'operator_lifecycle_authority_action', 'current_case_authority', 'current_lifecycle_version'],
  write_set: ['joint_lifecycle_authority_receipt', 'leader_action_combination_consumption', 'operator_action_combination_consumption'],
  forbidden_write_set: ['lifecycle_transition', 'human_authority_action'],
}

operationSpecs.approve_intervention.intent = intentSchema('ctrl.g24.intent.approve-intervention.r6.v1', {
  intervention_atom_ref: identifier,
  atom_version_ref: identifier,
  atom_content_fingerprint: fingerprint,
  decision: { type: 'enum', values: ['approve', 'hold', 'suppress'] },
  visible_effect_receipt_ref: identifier,
})
operationSpecs.approve_intervention.write_set = ['branch_exact_approval_hold_or_suppression_receipt']
operationSpecs.approve_intervention.forbidden_write_set = ['new_intervention_atom_version']

for (const [name, spec] of Object.entries(operationSpecs)) {
  spec.intent.exact_keys ??= Object.keys(spec.intent.properties ?? {})
  spec.max_intent_bytes ??= 32768
  spec.result_schema = `ctrl.g24.result.${name.replaceAll('_', '-')}.r6.v1_or_hold`
  spec.idempotency_scope = 'workspace_ref_and_operation_id'
}
r6.operation_specs = Object.fromEntries(operationNames.map(name => [name, operationSpecs[name]]))
r6.operation_names = operationNames
r6.request_schema.properties.operation_class.values = operationNames

r6.operation_authority = {
  select_intervention: ['krish_operator_predicate', 'authorized_operator_predicate', 'workload_selector_executor_predicate'],
  create_intervention: ['krish_operator_predicate', 'authorized_operator_predicate', 'workload_intervention_compiler_predicate'],
  stage_intervention_edit: ['krish_operator_predicate'],
  record_intervention_visibility: ['krish_operator_predicate'],
  approve_intervention: ['krish_operator_predicate'],
  record_answer: ['named_leader_predicate'],
  correct_answer: ['named_leader_predicate'],
  record_answer_transcription_repair: ['krish_operator_predicate'],
  record_leader_lifecycle_action: ['named_leader_predicate'],
  record_operator_lifecycle_action: ['krish_operator_predicate'],
  combine_lifecycle_authority: ['workload_lifecycle_authority_recorder_predicate'],
  apply_lifecycle_transition: ['transition_specific_human_predicate'],
  compile_release: ['krish_operator_predicate', 'authorized_operator_predicate', 'workload_release_compiler_predicate'],
  use_release: ['named_leader_predicate'],
  create_enrichment_plan: ['krish_operator_predicate', 'authorized_operator_predicate', 'workload_enrichment_planner_predicate'],
  record_enrichment_attempt: ['workload_enrichment_worker_predicate_and_matches_plan_assignment'],
}

r6.approval_effects = {
  discriminator: 'decision',
  invariant: 'approval_requires_a_preexisting_unconsumed_visibility_receipt_bound_to_exact_atom_ref_version_and_content_fingerprint',
  approve: {
    write_set: ['intervention_approval_receipt'],
    standing: 'approved_exact_visible_atom',
    delivery_eligible: true,
    result_variant: 'approved',
  },
  hold: {
    write_set: ['intervention_held_receipt'],
    standing: 'not_approved',
    delivery_eligible: false,
    result_variant: 'held_without_approval',
  },
  suppress: {
    write_set: ['intervention_suppressed_receipt', 'atom_version_selection_suppression'],
    standing: 'not_approved',
    delivery_eligible: false,
    reselection_eligible: false,
    result_variant: 'suppressed_without_approval',
  },
  staged_edit_flow: [
    'stage_intervention_edit_commits_new_nonapproved_atom',
    'record_intervention_visibility_commits_receipt_after_same_operator_is_presented_exact_atom',
    'later_approve_intervention_consumes_exact_unconsumed_visibility_receipt',
  ],
  edit_and_approve_in_one_operation_allowed: false,
}

const lifecycleActionProperties = {
  action_schema_version: { const: 'ctrl.g24.lifecycle-authority-action.r6.v1' },
  action_ref: identifier,
  case_ref: identifier,
  transition_id: { type: 'enum', values: transitionValues },
  predecessor_lifecycle_version: identifier,
  stable_actor_ref: identifier,
  actor_class: { type: 'enum', values: ['named_leader', 'krish_operator'] },
  authority_version: identifier,
  nonce: identifier,
  issued_at: timestamp,
  expires_at: timestamp,
  action_fingerprint: fingerprint,
}
const jointReceiptProperties = {
  receipt_schema_version: { const: 'ctrl.g24.lifecycle-joint-authority.r6.v1' },
  receipt_ref: identifier,
  case_ref: identifier,
  transition_id: { type: 'enum', values: transitionValues },
  predecessor_lifecycle_version: identifier,
  named_leader_ref: identifier,
  engagement_operator_ref: identifier,
  leader_authority_version: identifier,
  operator_authority_version: identifier,
  leader_action_ref: identifier,
  leader_action_fingerprint: fingerprint,
  operator_action_ref: identifier,
  operator_action_fingerprint: fingerprint,
  recorder_workload_ref: identifier,
  issued_at: timestamp,
  expires_at: timestamp,
  consumed_at: timestamp,
  receipt_fingerprint: fingerprint,
}
const jointReceiptKeys = Object.keys(jointReceiptProperties)
r6.lifecycle_authority = {
  transition_graph: structuredClone(r4.lifecycle_authority.transition_graph),
  authority_by_transition: Object.fromEntries(
    Object.entries(r4.lifecycle_authority)
      .filter(([key]) => key !== 'two_party_receipt_schema' && key !== 'transition_graph')
      .map(([key, value]) => [key, structuredClone(value)]),
  ),
  action_schema: closedSchema('ctrl.g24.lifecycle-authority-action.r6.v1', lifecycleActionProperties, {
    unique_keys: [['case_ref', 'stable_actor_ref', 'nonce']],
    ttl_seconds: 900,
    expires_at_derivation: 'server_issued_at_plus_exact_900_seconds',
    append_only: true,
  }),
  joint_receipt_schema: {
    schema_version: 'ctrl.g24.lifecycle-joint-authority.r6.v1',
    type: 'object',
    exact_keys: jointReceiptKeys,
    required: jointReceiptKeys.filter(key => key !== 'consumed_at'),
    optional: ['consumed_at'],
    additional_properties: false,
    properties: jointReceiptProperties,
    unique_keys: [['leader_action_ref', 'operator_action_ref']],
    ttl_seconds: 900,
    expires_at_derivation: 'server_max_action_issued_at_plus_exact_900_seconds_capped_by_earlier_action_expiry',
  },
  combine_transaction: {
    isolation: 'serializable',
    exact_match_fields: ['case_ref', 'transition_id', 'predecessor_lifecycle_version'],
    actors_equal_current_case_bindings: true,
    authority_versions_equal_current_case_bindings: true,
    both_actions_unexpired: true,
    both_actions_not_previously_combined: true,
    action_pair_unique: true,
    marks_both_actions_combined_atomically: true,
    failed_combine_writes: false,
  },
  fresh_transition_requires_unconsumed_joint_receipt: true,
  joint_receipt_consumed_atomically_with_transition: true,
  replay_uses_disclosure_authority_not_joint_receipt: true,
}

r6.operation_registry = {
  unique_key: ['workspace_ref', 'operation_id'],
  durable_states: ['committed_success', 'committed_hold'],
  transaction_local_states: ['admitted_pending'],
  first_admission_bindings: ['stable_principal_ref', 'case_derived_subject', 'requested_case_ref', 'operation_class', 'request_fingerprint', 'intent_fingerprint'],
  transitions: ['no_row_to_admitted_pending', 'admitted_pending_to_committed_success', 'admitted_pending_to_committed_hold', 'admitted_pending_to_no_row_on_transaction_abort', 'committed_success_to_replay_envelope', 'committed_hold_to_replay_envelope'],
  same_key_same_binding: 'reauthorize_disclosure_then_return_replay_envelope_without_reevaluation_or_mutation',
  same_key_different_binding: 'request_rejected_operation_identity_conflict_without_registry_mutation_or_protected_bytes',
  credential_instance_part_of_identity: false,
  stored_success: [...r4.operation_registry.stored_success],
  stored_hold: [...r4.operation_registry.stored_hold],
  replay_disclosure_checks: ['current_authentication', 'stable_principal_current_case_eligibility', 'stable_principal_current_audience_eligibility', 'retention_eligibility'],
  replay_payload_bytes_equal_original_commit: true,
  replay_whole_response_bytes_equal_original_commit: false,
  replay_envelope_adds: ['replayed_at', 'historical_replay', 'current_standing'],
  replay_current_standing: false,
  replay_mutates: false,
  fresh_execution_checks: ['current_authentication', 'current_exact_operation_authority', 'current_case_equality', 'current_operator_and_workload_grants', 'current_unconsumed_joint_lifecycle_receipt_when_required'],
  serialization_exhaustion: {
    result: 'request_rejected',
    code: 'service_temporarily_unavailable',
    operation_registry_row: false,
    committed_hold: false,
    same_operation_id_may_retry: true,
  },
}

const removedHoldCodes = ['operation_identity_conflict_hold', 'request_bytes_hold', 'intent_bytes_hold', 'answer_text_bytes_hold', 'note_bytes_hold', 'serialization_retry_hold']
r6.rejection_codes = [...new Set([...r4.rejection_codes, 'operation_identity_conflict', 'request_bytes_exceeded', 'intent_bytes_exceeded', 'answer_text_bytes_exceeded', 'note_bytes_exceeded'])]
r6.hold_codes = r4.hold_codes.filter(code => !removedHoldCodes.includes(code))

r6.held_evaluation_fingerprint = {
  domain_ascii: 'CTRL-G24-HELD-EVALUATION-R6',
  variable_field_frame: 'uint32_big_endian_byte_length_then_field_bytes',
  preimage_order: ['domain_ascii', 'workspace_ref_framed', 'operation_id_framed', 'operation_class_framed', 'request_fingerprint_raw', 'intent_fingerprint_raw', 'hold_code_framed', 'thirteen_dependency_slots_in_set_order', 'case_scope_version_framed', 'engagement_version_framed', 'plan_version_framed'],
  dependency_slots: setSeals,
  valid_slot: 'raw_32_byte_digest',
  invalid_or_unavailable_slot: fingerprintRule('CTRL-G24-HELD-DEPENDENCY-SENTINEL-R6', ['set_kind_framed', 'literal_invalid_or_unavailable_framed']),
  slot_omission_allowed: false,
  digest: 'sha256_of_exact_preimage',
}

r6.response_union.replayed_success_payload_bytes_equal_original = true
r6.response_union.replayed_whole_response_bytes_equal_original = false
r6.response_union.replayed_hold_code_and_committed_time_equal_original = true
r6.response_union.replay_envelope_is_distinct_and_non_authoritative = true

const approveResult = {
  schema_version: 'ctrl.g24.result.approve-intervention.r6.v1',
  discriminator: 'decision',
  variants: {
    approved: resultSchema('ctrl.g24.result.approve-intervention-approved.r6.v1', {
      decision: { const: 'approve' },
      intervention_atom_ref: identifier,
      atom_version_ref: identifier,
      atom_content_fingerprint: fingerprint,
      consumed_visible_effect_receipt_ref: identifier,
      approval_receipt_ref: identifier,
      delivery_eligible: { const: true },
    }),
    held_without_approval: resultSchema('ctrl.g24.result.approve-intervention-held.r6.v1', {
      decision: { const: 'hold' },
      intervention_atom_ref: identifier,
      atom_version_ref: identifier,
      transition_receipt_ref: identifier,
      delivery_eligible: booleanFalse,
    }),
    suppressed_without_approval: resultSchema('ctrl.g24.result.approve-intervention-suppressed.r6.v1', {
      decision: { const: 'suppress' },
      intervention_atom_ref: identifier,
      atom_version_ref: identifier,
      transition_receipt_ref: identifier,
      delivery_eligible: booleanFalse,
      reselection_eligible: booleanFalse,
    }),
  },
}

const releaseInvalidationProperties = {
  receipt_schema_version: { const: 'ctrl.g24.release-invalidation.r6.v1' },
  receipt_ref: identifier,
  case_ref: identifier,
  pending_projection_ref: identifier,
  projection_version_ref: identifier,
  bound_watermark_set_fingerprint: fingerprint,
  current_watermark_set_fingerprint: fingerprint,
  changed_controlling_watermark_kinds: { type: 'array', min_items: 1, unique: true, ordered_by: 'controlling_watermark_canonical_order', items: { type: 'controlling_watermark_kind' } },
  invalidated_at: timestamp,
  receipt_fingerprint: fingerprint,
}

const resultPayloadSchemas = structuredClone(r4.result_payload_schemas)
resultPayloadSchemas.stage_intervention_edit = resultSchema('ctrl.g24.result.stage-intervention-edit.r6.v1', {
  intervention_atom_ref: identifier,
  staged_atom_version_ref: identifier,
  staged_atom_content_fingerprint: fingerprint,
  standing: { const: 'staged_not_visible_not_approved' },
})
resultPayloadSchemas.record_intervention_visibility = resultSchema('ctrl.g24.result.record-intervention-visibility.r6.v1', {
  intervention_atom_ref: identifier,
  atom_version_ref: identifier,
  atom_content_fingerprint: fingerprint,
  visible_effect_receipt_ref: identifier,
  standing: { const: 'visible_not_approved' },
})
resultPayloadSchemas.approve_intervention = approveResult
resultPayloadSchemas.record_leader_lifecycle_action = resultSchema('ctrl.g24.result.record-leader-lifecycle-action.r6.v1', {
  action_ref: identifier,
  action_fingerprint: fingerprint,
  expires_at: timestamp,
})
resultPayloadSchemas.record_operator_lifecycle_action = resultSchema('ctrl.g24.result.record-operator-lifecycle-action.r6.v1', {
  action_ref: identifier,
  action_fingerprint: fingerprint,
  expires_at: timestamp,
})
resultPayloadSchemas.combine_lifecycle_authority = resultSchema('ctrl.g24.result.combine-lifecycle-authority.r6.v1', {
  joint_receipt_ref: identifier,
  receipt_fingerprint: fingerprint,
  expires_at: timestamp,
})
resultPayloadSchemas.use_release = {
  schema_version: 'ctrl.g24.result.use-release.r6.v1',
  discriminator: 'standing',
  variants: {
    pending_delivery: resultSchema('ctrl.g24.result.use-release-pending-delivery.r6.v1', {
      standing: { const: 'pending_delivery' },
      release_use_receipt_ref: identifier,
      outbox_effect_ref: identifier,
    }),
    invalidated_before_use: resultSchema('ctrl.g24.result.use-release-invalidated.r6.v1', {
      standing: { const: 'invalidated_before_use' },
      pending_projection_ref: identifier,
      projection_version_ref: identifier,
      invalidation_receipt_ref: identifier,
      changed_controlling_watermark_kinds: releaseInvalidationProperties.changed_controlling_watermark_kinds,
      delivery_eligible: booleanFalse,
      outbox_created: booleanFalse,
    }),
  },
}
r6.result_payload_schemas = Object.fromEntries(operationNames.map(name => [name, resultPayloadSchemas[name]]))
for (const name of operationNames) r6.operation_specs[name].result_schema = r6.result_payload_schemas[name].schema_version

r6.controlling_watermarks = {
  base_kinds_in_canonical_order: watermarkKinds,
  additional_kind_grammar: {
    prefix: 'applicable_control/',
    suffix: 'canonical_control_id_from_current_applicable_control_closure',
    unknown_or_nonapplicable_control_id: 'control_completeness_hold',
  },
  canonical_order: 'all_base_kinds_in_declared_order_then_additional_kinds_by_ascending_unsigned_utf8_bytes',
  completeness: 'every_base_kind_exactly_once_and_every_current_applicable_control_id_exactly_once',
  unknown_or_duplicate_kind: 'control_completeness_hold',
  member_schema: {
    schema_version: 'ctrl.g24.controlling-watermark.r6.v1',
    discriminator: 'kind_class',
    variants: {
      base: closedSchema('ctrl.g24.controlling-watermark-base.r6.v1', {
        kind_class: { const: 'base' },
        kind: { type: 'enum', values: watermarkKinds },
        lineage_ref: identifier,
        version_ref: identifier,
      }),
      applicable_control: closedSchema('ctrl.g24.controlling-watermark-control.r6.v1', {
        kind_class: { const: 'applicable_control' },
        kind: { type: 'string', grammar: 'literal_applicable_control_slash_plus_canonical_control_id' },
        control_id: identifier,
        lineage_ref: identifier,
        version_ref: identifier,
      }, { cross_field_rules: ['kind_equals_literal_applicable_control_slash_plus_control_id', 'control_id_exists_in_current_applicable_control_closure'] }),
    },
  },
  set_fingerprint: {
    domain_ascii: 'CTRL-G24-CONTROLLING-WATERMARK-SET-R6',
    variable_field_frame: 'uint32_big_endian_byte_length_then_utf8_bytes',
    preimage_order: ['domain_ascii', 'uint64_big_endian_member_count', 'members_in_canonical_order_each_as_kind_class_kind_control_id_or_absent_lineage_ref_version_ref_framed'],
    complete_base_and_applicable_control_kinds_required_exactly_once: true,
    digest: 'sha256_of_exact_preimage',
  },
}
r6.release_invalidation = {
  selection_precedence: 'before_generic_snapshot_changed_hold_for_use_release',
  concurrent_controlling_change: 'serializable_retry_then_reselect_against_current_state',
  comparison: 'bound_and_current_complete_watermark_sets_by_kind_lineage_ref_and_version_ref',
  invalidation_receipt_schema: closedSchema('ctrl.g24.release-invalidation.r6.v1', releaseInvalidationProperties, {
    unique_keys: [['pending_projection_ref', 'projection_version_ref']],
    append_only: true,
  }),
  same_projection_version_after_invalidation: 'return_existing_invalidation_result_without_new_receipt_or_outbox',
  invalidated_write_set: ['release_projection_invalidation_receipt'],
  invalidated_forbidden_write_set: ['release_use_receipt', 'outbox_effect', 'approval_receipt', 'delivery_receipt'],
  unrelated_lineage_change_invalidates: false,
  rebuild_confers_use_or_delivery_authority: false,
}

r6.set_seals = setSeals
delete r6.all_eleven_set_seals
r6.all_thirteen_set_seals = allSetSealsSchema(setSeals)
r6.proof_bundle_schemas.common.properties.current_set_seals.schema_ref = 'all_thirteen_set_seals'
r6.set_member_identity_projections = {
  control_universe: ['control_id'],
  applicable_controls: ['control_id'],
  control_closure_edges: ['source_control_id', 'target_control_id', 'edge_kind'],
  visible_sources: ['source_ref'],
  visible_assertions: ['assertion_ref'],
  accepted_brain_items: ['item_ref'],
  accepted_brain_relationships: ['relationship_ref'],
  route_capability_registry: ['route_id', 'capability_ref'],
  receipt_chain_tips: ['chain_kind', 'scope_ref'],
  evaluator_registry: ['evaluator_id', 'policy_lineage_ref', 'active_from'],
  provider_capability_registry: ['provider_ref', 'operation_class', 'active_from'],
  operator_grants: ['grant_ref'],
  workload_grants: ['grant_ref'],
}
r6.set_member_identity_encoding = {
  domain_ascii: 'CTRL-G24-SET-MEMBER-IDENTITY-R6',
  variable_field_frame: 'uint32_big_endian_byte_length_then_utf8_bytes',
  preimage_order: ['domain_ascii', 'set_kind_framed', 'ordered_projection_values_framed'],
  member_entry_order: ['identity_bytes_framed', 'raw_complete_record_sha256'],
  sort: 'ascending_unsigned_identity_bytes_then_raw_record_sha256',
  duplicate_identity_same_bytes: 'invalid_no_seal',
  duplicate_identity_different_bytes: 'invalid_no_seal',
  missing_extra_null_noncanonical_or_unsupported_projection_field: 'invalid_no_seal',
}
r6.set_seal_encoding = {
  domain_ascii: 'CTRL-G24-SET-SEAL-R6',
  variable_field_frame: 'uint32_big_endian_byte_length_then_field_bytes',
  preimage_order: ['domain_ascii', 'set_kind_framed', 'set_schema_version_framed', 'owner_lineage_version_framed', 'uint64_big_endian_member_count', 'sorted_unique_member_entries'],
  member_entry_ref: 'set_member_identity_encoding.member_entry_order',
  digest: 'sha256_of_exact_preimage',
}
r6.snapshot_encoding = {
  domain_ascii: 'CTRL-G24-TRUSTED-SNAPSHOT-R6',
  variable_field_frame: 'uint32_big_endian_byte_length_then_field_bytes',
  hash_encoding: '32_raw_bytes_from_lowercase_hex_sha256',
  integer_encoding: 'uint64_big_endian',
  set_seal_object_order: ['set_kind_framed', 'set_schema_version_framed', 'owner_lineage_version_framed', 'uint64_big_endian_member_count', 'raw_sha256_digest'],
  preimage_order: ['domain_ascii', 'operation_id_framed', 'operation_class_framed', 'request_fingerprint_raw', 'intent_fingerprint_raw', 'stable_principal_ref_framed', 'principal_authority_version_framed', 'thirteen_set_seal_objects_in_set_order', 'case_scope_version_framed', 'engagement_version_framed', 'plan_version_framed'],
  set_order: setSeals,
  digest: 'sha256_of_exact_preimage',
}
r6.scalar_version_rule = {
  scalar_order: ['case_scope_version', 'engagement_version', 'plan_version'],
  case_scope_version: 'current_canonical_case_scope_version',
  engagement_version: 'current_canonical_engagement_version',
  plan_version: 'current_only_for_record_enrichment_attempt_else_literal_not_applicable',
  grant_mutation_advances_case_scope_version_atomically: true,
}
r6.snapshot_and_cas_by_operation = Object.fromEntries(operationNames.map(name => [name, {
  set_seals: setSeals,
  scalar_versions: {
    case_scope_version: 'current',
    engagement_version: 'current',
    plan_version: name === 'record_enrichment_attempt' ? 'current' : 'not_applicable',
  },
}]))
r6.snapshot_cas_rule = {
  snapshot_and_final_compare_and_swap_use_exact_encoding: 'snapshot_encoding',
  same_serializable_transaction: true,
  set_or_scalar_omission: 'invalid_command_hold',
  any_change: 'snapshot_changed_hold',
  aggregate_aliases_allowed: false,
  use_release_controlling_watermark_change_precedence: 'release_invalidation_before_generic_hold',
}

const proofCommon = closedSchema('ctrl.g24.proof-bundle-common.r6.v1', {
  bundle_schema_version: { const: 'ctrl.g24.proof-bundle.r6.v1' },
  owner_family: { type: 'enum', values: r4.proof_family_names },
  workspace_ref: identifier,
  subject_ref: identifier,
  case_ref: identifier,
  snapshot_fingerprint: fingerprint,
  canonical_record_ref: identifier,
  canonical_record_fingerprint: fingerprint,
  predecessor_chain_tip: fingerprint,
  append_ordinal: positiveInteger,
  current_set_seals: { schema_ref: 'all_thirteen_set_seals' },
  append_provenance_ref: identifier,
  evaluated_at: timestamp,
})
const refPair = prefix => ({ [`${prefix}_ref`]: identifier, [`${prefix}_fingerprint`]: fingerprint })
const proofExtensions = {
  selector_result: closedSchema('ctrl.g24.proof.selector-result.r6.v1', {
    ...refPair('candidate_set'),
    selector_policy_version: identifier,
  }),
  intervention_approval: closedSchema('ctrl.g24.proof.intervention-approval.r6.v1', {
    intervention_atom_ref: identifier,
    intervention_atom_version_ref: identifier,
    intervention_atom_content_fingerprint: fingerprint,
    ...refPair('approval_receipt'),
    ...refPair('visible_effect_receipt'),
  }),
  answer: closedSchema('ctrl.g24.proof.answer.r6.v1', {
    ...refPair('answer_receipt'),
    ...refPair('leader_authority'),
    ...refPair('visible_effect_receipt'),
  }),
  correction: closedSchema('ctrl.g24.proof.correction.r6.v1', {
    answer_chain_tip: fingerprint,
    ...refPair('correction_receipt'),
    dependency_graph_seal: fingerprint,
  }),
  lifecycle: closedSchema('ctrl.g24.proof.lifecycle.r6.v1', {
    ...refPair('lifecycle_snapshot'),
    ...refPair('authority_receipt'),
    precondition_set_seal: fingerprint,
  }),
  pending_release_and_authority: closedSchema('ctrl.g24.proof.pending-release-authority.r6.v1', {
    pending_projection_ref: identifier,
    projection_version_ref: identifier,
    pending_projection_fingerprint: fingerprint,
    ...refPair('release_authority_receipt'),
    controlling_watermark_set_fingerprint: fingerprint,
  }),
  enrichment_plan: closedSchema('ctrl.g24.proof.enrichment-plan.r6.v1', {
    plan_ref: identifier,
    plan_version_ref: identifier,
    plan_fingerprint: fingerprint,
    ...refPair('budget_policy'),
    ...refPair('terminal_state'),
  }),
  execution_receipt: closedSchema('ctrl.g24.proof.execution-receipt.r6.v1', {
    ...refPair('execution_receipt'),
    attempt_ordinal: positiveInteger,
    ...refPair('terminal_state'),
  }),
}
r6.proof_bundle_schemas = {
  envelope: {
    type: 'object',
    exact_keys: ['common', 'extension'],
    required: ['common', 'extension'],
    additional_properties: false,
    properties: {
      common: { schema_ref: 'proof_bundle_schemas.common' },
      extension: { discriminated_by: 'common.owner_family', schema_ref: 'proof_bundle_schemas.extensions' },
    },
  },
  common: proofCommon,
  extensions: proofExtensions,
}
r6.proof_lineage = {
  genesis: fingerprintRule('CTRL-G24-PROOF-GENESIS-R6', ['owner_family_framed']),
  append: {
    ...fingerprintRule('CTRL-G24-PROOF-CHAIN-R6', ['owner_family_framed', 'predecessor_chain_tip_raw', 'canonical_record_fingerprint_raw', 'uint64_big_endian_append_ordinal']),
    first_predecessor: 'family_genesis',
    ordinal_starts_at: 1,
    ordinal_must_equal_exact_next: true,
  },
}
r6.proof_bundle_digest = fingerprintRule('CTRL-G24-PROOF-BUNDLE-R6', ['owner_family_framed', 'common_canonical_bytes_sha256_raw', 'extension_canonical_bytes_sha256_raw'])
r6.proof_authority = {
  caller_supplied_proof_bundle_allowed: false,
  browser_serializable_proof_bundle_allowed: false,
  bundle_built_server_side_from_authoritative_rows: true,
  canonical_common_and_extension_use_r3_canonical_json: true,
  every_ref_and_fingerprint_resolved_in_same_transaction: true,
  every_resolved_row_fingerprint_recomputed_and_equal: true,
  workspace_subject_case_snapshot_and_chain_equal_across_all_rows: true,
  extension_constraints: {
    selector_result: ['candidate_set_complete_four_routes', 'selector_policy_current'],
    intervention_approval: ['approval_and_visibility_bind_same_exact_atom_ref_version_and_content_fingerprint'],
    answer: ['answer_subject_is_named_leader', 'visibility_binds_exact_answer'],
    correction: ['complete_answer_chain', 'append_only_replacement'],
    lifecycle: ['transition_in_exact_graph', 'authority_receipt_matches_exact_transition_and_predecessor'],
    pending_release_and_authority: ['projection_not_invalidated', 'watermark_fingerprint_matches_projection'],
    enrichment_plan: ['plan_budget_and_terminal_state_versions_match'],
    execution_receipt: ['attempt_is_exact_next', 'terminal_state_is_final'],
  },
}
r6.resolver_capability.canonical_bundle_digest.source = 'proof_bundle_digest_over_exact_materialized_r6_bundle'

r6.evaluator_abi.operation_result_exports = Object.fromEntries(operationNames.map(name => [name, r6.result_payload_schemas[name].schema_version]))
r6.evaluator_abi.proof_family_exports = Object.fromEntries(r4.proof_family_names.map(name => [name, proofExtensions[name].schema_version]))
r6.evaluator_abi.manifest_canonical_bytes_cover = ['abi_version', 'operation_result_exports', 'proof_family_exports', 'all_exported_result_and_proof_schema_canonical_bytes']
r6.evaluator_abi.manifest_sha256_must_match_loaded_immutable_manifest_bytes = true

const visibilityReceiptProperties = {
  receipt_schema_version: { const: 'ctrl.g24.intervention-visibility.r6.v1' },
  receipt_ref: identifier,
  case_ref: identifier,
  intervention_atom_ref: identifier,
  atom_version_ref: identifier,
  atom_content_fingerprint: fingerprint,
  viewer_actor_ref: identifier,
  viewer_authority_version: identifier,
  presentation_nonce: identifier,
  presented_at: timestamp,
  consumed_at: timestamp,
  receipt_fingerprint: fingerprint,
}
const providerSuccessProperties = {
  evidence_schema_version: { const: 'ctrl.g24.provider-success-evidence.r6.v1' },
  evidence_ref: identifier,
  outbox_effect_ref: identifier,
  attempt_ordinal: { type: 'positive_integer', minimum: 1, maximum: 3 },
  attempt_fingerprint: fingerprint,
  fencing_token: positiveInteger,
  worker_ref: identifier,
  provider_ref: identifier,
  provider_operation_ref: identifier,
  provider_key: identifier,
  payload_fingerprint: fingerprint,
  provider_response_ref: identifier,
  observed_success_at: timestamp,
  provider_receipt_bytes_fingerprint: fingerprint,
  evidence_fingerprint: fingerprint,
}
const attemptProperties = {
  attempt_schema_version: { const: 'ctrl.g24.outbox-attempt.r6.v1' },
  outbox_effect_ref: identifier,
  attempt_ordinal: { type: 'positive_integer', minimum: 1, maximum: 3 },
  fencing_token: positiveInteger,
  worker_ref: identifier,
  provider_ref: identifier,
  provider_operation_ref: identifier,
  provider_key: identifier,
  payload_fingerprint: fingerprint,
  reserved_at: timestamp,
  dispatched_at: timestamp,
  state: { type: 'enum', values: ['reserved', 'dispatched', 'confirmed', 'definitively_failed', 'ambiguous'] },
  outcome_ref: identifier,
  attempt_fingerprint: fingerprint,
}
r6.fingerprint_schemas = {
  release_invalidation_receipt: fingerprintRule('CTRL-G24-RELEASE-INVALIDATION-R6', Object.keys(releaseInvalidationProperties).filter(key => key !== 'receipt_fingerprint').map(key => `${key}_canonical`)),
  lifecycle_authority_action: fingerprintRule('CTRL-G24-LIFECYCLE-ACTION-R6', Object.keys(lifecycleActionProperties).filter(key => key !== 'action_fingerprint').map(key => `${key}_canonical`)),
  lifecycle_joint_authority_receipt: fingerprintRule('CTRL-G24-LIFECYCLE-JOINT-R6', jointReceiptKeys.filter(key => key !== 'receipt_fingerprint').map(key => `${key}_canonical`)),
  intervention_visibility_receipt: fingerprintRule('CTRL-G24-INTERVENTION-VISIBILITY-R6', Object.keys(visibilityReceiptProperties).filter(key => key !== 'receipt_fingerprint').map(key => `${key}_canonical`)),
  outbox_attempt: fingerprintRule('CTRL-G24-OUTBOX-ATTEMPT-R6', Object.keys(attemptProperties).filter(key => key !== 'attempt_fingerprint').map(key => `${key}_canonical`)),
  provider_success_evidence: fingerprintRule('CTRL-G24-PROVIDER-SUCCESS-R6', Object.keys(providerSuccessProperties).filter(key => key !== 'evidence_fingerprint').map(key => `${key}_canonical`)),
  provider_reconciliation_evidence: fingerprintRule('CTRL-G24-PROVIDER-RECONCILIATION-R6', Object.keys(r4.outbox.reconciliation_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint').map(key => `${key}_canonical`)),
}
r6.intervention_visibility_receipt_schema = {
  schema_version: 'ctrl.g24.intervention-visibility.r6.v1',
  type: 'object',
  exact_keys: Object.keys(visibilityReceiptProperties),
  required: Object.keys(visibilityReceiptProperties).filter(key => key !== 'consumed_at'),
  optional: ['consumed_at'],
  additional_properties: false,
  properties: visibilityReceiptProperties,
  unique_keys: [['case_ref', 'viewer_actor_ref', 'presentation_nonce']],
  consumed_once_by_exact_approval: true,
}
r6.release_invalidation.invalidation_receipt_fingerprint_ref = 'fingerprint_schemas.release_invalidation_receipt'
r6.lifecycle_authority.action_fingerprint_ref = 'fingerprint_schemas.lifecycle_authority_action'
r6.lifecycle_authority.joint_receipt_fingerprint_ref = 'fingerprint_schemas.lifecycle_joint_authority_receipt'
r6.intervention_visibility_receipt_schema.fingerprint_ref = 'fingerprint_schemas.intervention_visibility_receipt'

r6.outbox = {
  states: ['pending', 'claimed', 'confirmed', 'failed', 'unknown'],
  attempt_states: ['reserved', 'dispatched', 'confirmed', 'definitively_failed', 'ambiguous'],
  actor_authority: structuredClone(r4.outbox.actor_authority),
  claim: structuredClone(r4.outbox.claim),
  pre_provider_checks: [...r4.outbox.pre_provider_checks],
  pre_provider_failure: structuredClone(r4.outbox.pre_provider_failure),
  attempt_schema: {
    schema_version: 'ctrl.g24.outbox-attempt.r6.v1',
    type: 'object',
    exact_keys: Object.keys(attemptProperties),
    required: Object.keys(attemptProperties).filter(key => !['dispatched_at', 'outcome_ref'].includes(key)),
    optional: ['dispatched_at', 'outcome_ref'],
    additional_properties: false,
    properties: attemptProperties,
    cross_field_rules: ['dispatched_at_required_iff_state_is_not_reserved', 'outcome_ref_required_iff_state_is_confirmed_definitively_failed_or_ambiguous'],
  },
  attempt_unique_key: ['outbox_effect_ref', 'attempt_ordinal'],
  attempt_fingerprint_ref: 'fingerprint_schemas.outbox_attempt',
  reservation: {
    atomic_compare_and_swap: true,
    reads: ['current_outbox_state', 'current_fencing_token', 'current_lease_owner', 'current_lease_expiry', 'committed_attempt_count'],
    writes: ['attempt_reservation', 'committed_attempt_count_increment'],
    commits_before_dispatch: true,
    next_ordinal: 'committed_attempt_count_plus_one',
    allowed_ordinals: [1, 2, 3],
    fourth_reservation_allowed: false,
  },
  dispatch: {
    transition: 'reserved_to_dispatched',
    atomic_compare_and_swap: true,
    exact_once_per_reservation: true,
    commits_before_provider_call: true,
    reuse_dispatched_reservation_for_provider_call: false,
    provider_call_allowed_ordinals: [1, 2, 3],
    fourth_provider_call_allowed: false,
    rechecks: ['current_fencing_token', 'current_lease_owner', 'unexpired_lease', 'current_effect_authority', 'exact_payload_fingerprint', 'exact_payload_bytes', 'exactly_one_current_provider_capability'],
    crash_after_dispatch_before_or_during_call: 'attempt_becomes_ambiguous_and_is_never_reused',
  },
  retry: {
    requires_new_reservation: true,
    all_attempts_same_provider_operation_key_and_payload: true,
    ambiguous_without_current_idempotency_guarantee: 'outbox_unknown_no_automatic_resend',
    ambiguous_with_current_idempotency_guarantee_and_attempts_below_three: 'reserve_exact_next_attempt',
    ambiguous_at_three_attempts: 'outbox_unknown_no_automatic_resend',
    lease_or_worker_change_resets_attempt_count: false,
  },
  provider_success_evidence_schema: closedSchema('ctrl.g24.provider-success-evidence.r6.v1', providerSuccessProperties, {
    fingerprint_ref: 'fingerprint_schemas.provider_success_evidence',
    must_match_exact_dispatched_attempt: true,
    only_evidence_allowing_confirmed: true,
  }),
  reconciliation_evidence_schema: {
    ...structuredClone(r4.outbox.reconciliation_evidence_schema),
    fingerprint_ref: 'fingerprint_schemas.provider_reconciliation_evidence',
    must_match_exact_outbox_effect_and_latest_dispatched_attempt: true,
  },
  unknown_auto_resend: false,
  reconciliation_can_send: false,
  external_call_authorized_in_phase: false,
}

r6.limit_order = [...r4.limit_order]
r6.limits = structuredClone(r4.limits)
for (const [name, failure] of Object.entries({
  request_bytes: 'request_bytes_exceeded',
  intent_bytes: 'intent_bytes_exceeded',
  answer_text_bytes: 'answer_text_bytes_exceeded',
  note_bytes: 'note_bytes_exceeded',
})) {
  r6.limits[name].phase = 'pre_admission_canonical'
  r6.limits[name].failure = failure
}
r6.limits.serialization_retries.phase = 'pre_commit_transaction'
r6.limits.serialization_retries.failure = 'service_temporarily_unavailable'
r6.limit_semantics = {
  ...r4.limit_semantics,
  r3_max_annotations_consumed_only_by_r6_admission_engine: true,
  independent_schema_failure_from_r3_max_annotations: false,
  request_owned_content_limits_complete_before_admission: true,
  state_and_execution_limits_commit_hold_after_admission: true,
  serialization_exhaustion_commits_hold: false,
  one_input_one_limit_outcome: true,
}

r6.required_negative_fixture_families = [
  'complete_effective_materialization',
  'staged_edit_visibility_and_later_approval',
  'registered_lifecycle_authority_issuance',
  'release_watermark_invalidation_identity_and_finality',
  'registry_replay_conflict_and_serialization_exhaustion',
  'thirteen_set_snapshot_and_cas',
  'set_member_identity_projection',
  'complete_hold_fingerprint',
  'proof_reference_and_authoritative_row_binding',
  'fresh_execution_vs_replay_disclosure',
  'authority_record_fingerprint_preimages',
  'single_limit_outcome',
  'outbox_reserved_dispatched_single_call',
  'provider_success_evidence',
]
r6.claim_limit = 'unimplemented_local_effective_contract_only'

export const materializedR6 = r6
export const materializedR6Output = `${JSON.stringify(r6, null, 2)}\n`
export const materializedR6Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR6Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    const existing = read(outputPath)
    if (existing !== materializedR6Output) {
      console.error(`${outputPath} is not the exact generator output`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R6 effective contract`)
  } else {
    process.stdout.write(materializedR6Output)
  }
}
