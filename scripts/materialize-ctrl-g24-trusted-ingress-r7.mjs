import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r7.json'
const r6Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r6.json'
const r6Bytes = read(r6Path)
// Start from R6's exact frozen effective bytes, not its generator's in-memory object.
const r7 = JSON.parse(r6Bytes)

const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const pos = { type: 'positive_integer' }
const nonneg = { type: 'safe_nonnegative_integer' }

function closed(schemaVersion, properties, extras = {}) {
  const exactKeys = Object.keys(properties)
  const optional = extras.optional ?? []
  return {
    schema_version: schemaVersion,
    type: 'object',
    exact_keys: exactKeys,
    required: exactKeys.filter(key => !optional.includes(key)),
    ...(optional.length ? { optional } : {}),
    additional_properties: false,
    properties,
    ...extras,
  }
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

function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
  }
}

r7.schema_version = 'ctrl.g24.trusted-ingress.r7.effective.v1'
r7.status = 'sixth_repair_candidate_under_independent_review'
r7.date = '2026-09-13'
r7.supersedes = {
  commit: '1354994738571e9c7bb0ec42969d654887e7bc3b',
  tree: '2c7bfcb57d340e18cccfffa8451ea422e422b6cf',
  human_blob: 'db714610dd2ecddd8f7b282c4e8ded7ff9c457d4',
  machine_blob: '76a5bf1f5d14a904dc660f0632caf54eff16e32e',
  qa_blob: 'a817257f924405896f1fad71b24a4be7c150eaa0',
  checker_blob: 'ad67d6f3c673f9b25ff032627325cfbdbe2f3772',
  materializer_blob: 'bae058a50c5f34a08dc8a35641c3ded930554470',
  adjudication: 'veto',
}
r7.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r7.mjs',
  frozen_input: { path: r6Path, sha256: sha256(r6Bytes) },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// One closed type language. No schema may rely on an unmaterialized inherited primitive.
r7.type_registry = {
  string: { kind: 'builtin', json_type: 'string' },
  integer: { kind: 'builtin', json_type: 'integer', safe_range_only: true },
  boolean: { kind: 'builtin', json_type: 'boolean' },
  object: { kind: 'builtin', json_type: 'object' },
  array: { kind: 'builtin', json_type: 'array' },
  enum: { kind: 'schema_operator', requires: ['values'] },
  identifier: structuredClone(r7.base_types.identifier),
  human_text: structuredClone(r7.base_types.human_text),
  sha256: {
    json_type: 'string',
    regex: '^[0-9a-f]{64}$',
    decoded_byte_length: 32,
    uppercase_allowed: false,
  },
  canonical_timestamp: {
    json_type: 'string',
    regex: '^\\d{4}-(0[1-9]|1[0-2])-([0-2]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\.\\d{3}Z$',
    semantic_validation: 'valid_gregorian_utc_instant_exactly_three_fractional_digits',
  },
  base64url_without_padding: {
    json_type: 'string',
    regex: '^[A-Za-z0-9_-]*$',
    padding_allowed: false,
    validation: 'decode_then_reencode_must_equal_input_byte_for_byte',
  },
  positive_integer: { json_type: 'integer', minimum: 1, maximum: 9007199254740991 },
  safe_nonnegative_integer: { json_type: 'integer', minimum: 0, maximum: 9007199254740991 },
  operation_discriminated_object: {
    json_type: 'object',
    discriminator_path: 'request_schema.properties.operation_class',
    variant_map_path: 'operation_specs',
    selected_schema_member: 'intent',
    unknown_discriminator_result: 'request_rejected',
  },
  controlling_watermark_kind: {
    json_type: 'string',
    union: [
      { enum_ref: 'controlling_watermarks.base_kinds_in_canonical_order' },
      { pattern: '^applicable_control/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$', member_ref: 'controlling_watermarks.applicable_control_member_rule' },
    ],
  },
}
r7.base_types = Object.fromEntries(Object.entries(r7.type_registry).filter(([name]) => !['operation_discriminated_object', 'controlling_watermark_kind'].includes(name)))

r7.canonical_field_encoding = {
  object: 'schema_declared_field_order; each optional field uses presence encoding; field names are omitted because the schema and order are fixed',
  optional_absent: 'single_byte_0x00',
  optional_present: 'single_byte_0x01_then_encoded_value',
  string_identifier_human_text_timestamp_enum_const: 'uint32_big_endian_utf8_byte_length_then_exact_utf8_bytes',
  sha256: '32_raw_bytes_decoded_from_lowercase_hex',
  integer_positive_integer_safe_nonnegative_integer: 'uint64_big_endian_unsigned',
  boolean_false: 'single_byte_0x00',
  boolean_true: 'single_byte_0x01',
  array: 'uint64_big_endian_item_count_then_each_item_encoded_in_declared_array_order',
  map_or_unspecified_json_value_allowed: false,
}
r7.controlling_watermarks.applicable_control_member_rule = 'suffix_must_equal_a_canonical_control_id_in_the_current_applicable_controls_seal_closure'

r7.request_schema.invalid_result = 'request_rejected'
r7.snapshot_cas_rule.set_or_scalar_omission = 'snapshot_changed_hold'
r7.request_admission = {
  content_encoding: r7.request_admission.content_encoding,
  phase_order: [
    'stream_parse_and_enforce_request_owned_limits',
    'authenticate_enough_to_resolve_stable_principal_and_workspace',
    'validate_operation_id_requested_case_ref_operation_class_and_intent_shape',
    'lookup_registry_by_workspace_ref_and_operation_id',
    'if_absent_run_fresh_current_authority_admission_evaluation_and_snapshot_cas',
    'if_same_binding_committed_run_disclosure_checks_only_and_return_historical_replay_envelope',
    'if_different_binding_reject_operation_identity_conflict_without_protected_bytes_or_mutation',
  ],
  before_registry_lookup: ['request_owned_limits', 'authentication', 'stable_principal_resolution', 'workspace_resolution', 'request_shape_and_canonical_fingerprint'],
  fresh_only_after_no_registry_row: ['current_operation_authority', 'current_case_equality', 'current_grants', 'operation_evaluation', 'snapshot_cas'],
  replay_only_after_same_binding: ['current_authentication', 'current_case_eligibility', 'current_audience_eligibility', 'retention_eligibility'],
  replay_must_not_run: ['current_operation_authority', 'fresh_evaluator', 'snapshot_cas', 'protected_mutation'],
  pre_admission_failure: r7.request_admission.pre_admission_failure,
  post_fresh_admission_state: 'transaction_local_admitted_pending',
}

// Product language keeps “edit”; the trusted operation decomposes it into stage, present, acknowledge, approve.
r7.operation_names.splice(r7.operation_names.indexOf('record_intervention_visibility'), 0, 'issue_intervention_presentation_challenge')
r7.request_schema.properties.operation_class.values = [...r7.operation_names]
r7.principal_schemas.workload_identity.properties.capability_class.values.push('presentation_challenge_issuer')
r7.workload_authority_predicates.workload_presentation_challenge_issuer_predicate = {
  capability_class: 'presentation_challenge_issuer',
  stable_workload_must_match_current_case_grant: true,
  can_mark_content_presented: false,
  can_acknowledge_for_human: false,
}
r7.operation_authority.issue_intervention_presentation_challenge = ['workload_presentation_challenge_issuer_predicate']

r7.operation_specs.issue_intervention_presentation_challenge = {
  schema_version: 'ctrl.g24.operation.issue-intervention-presentation-challenge.r7.v1',
  actor_classes: ['presentation_challenge_issuer'],
  intent: closed('ctrl.g24.intent.issue-intervention-presentation-challenge.r7.v1', {
    intervention_atom_ref: id,
    atom_version_ref: id,
    intended_viewer_ref: id,
  }),
  max_intent_bytes: 4096,
  read_set: ['exact_staged_or_current_intervention_atom', 'current_case_authority', 'current_viewer_binding'],
  write_set: ['immutable_intervention_presentation_challenge'],
  forbidden_write_set: ['intervention_visibility_receipt', 'approval_receipt', 'delivery_effect'],
  result_schema: 'ctrl.g24.result.issue-intervention-presentation-challenge.r7.v1',
  idempotency_scope: 'workspace_ref_and_operation_id',
}
r7.operation_specs.record_intervention_visibility = {
  schema_version: 'ctrl.g24.operation.record-intervention-visibility.r7.v1',
  actor_classes: ['krish_operator'],
  intent: closed('ctrl.g24.intent.record-intervention-visibility.r7.v1', {
    presentation_challenge_ref: id,
    acknowledged: { const: true },
    acknowledgement_nonce: id,
  }),
  max_intent_bytes: 4096,
  read_set: ['exact_unexpired_presentation_challenge', 'current_case_authority', 'current_operator_binding'],
  write_set: ['immutable_intervention_visibility_acknowledgement'],
  forbidden_write_set: ['intervention_atom', 'approval_receipt', 'delivery_effect'],
  result_schema: 'ctrl.g24.result.record-intervention-visibility.r7.v1',
  idempotency_scope: 'workspace_ref_and_operation_id',
}
r7.operation_specs.stage_intervention_edit.product_semantic_action = 'edit'
r7.operation_specs.stage_intervention_edit.execution_sequence = ['stage', 'actual_foreground_presentation', 'explicit_human_acknowledgement', 'later_approval']

r7.presentation_challenge_schema = closed('ctrl.g24.intervention-presentation-challenge.r7.v1', {
  challenge_schema_version: { const: 'ctrl.g24.intervention-presentation-challenge.r7.v1' },
  challenge_ref: id,
  case_ref: id,
  viewer_actor_ref: id,
  intervention_atom_ref: id,
  atom_version_ref: id,
  atom_content_fingerprint: fp,
  server_nonce: id,
  issued_at: ts,
  expires_at: ts,
  challenge_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['challenge_ref'], ['case_ref', 'viewer_actor_ref', 'server_nonce']],
  ttl_seconds: 300,
  issuance_does_not_prove_presentation: true,
})
r7.intervention_visibility_receipt_schema = closed('ctrl.g24.intervention-visibility-acknowledgement.r7.v1', {
  receipt_schema_version: { const: 'ctrl.g24.intervention-visibility-acknowledgement.r7.v1' },
  receipt_ref: id,
  presentation_challenge_ref: id,
  presentation_challenge_fingerprint: fp,
  case_ref: id,
  operator_ref: id,
  intervention_atom_ref: id,
  atom_version_ref: id,
  atom_content_fingerprint: fp,
  acknowledgement_nonce: id,
  acknowledged_at: ts,
  receipt_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['presentation_challenge_ref'], ['case_ref', 'operator_ref', 'acknowledgement_nonce']],
  challenge_values_are_server_resolved_not_caller_asserted: true,
  acknowledged_only_after_exact_content_is_foregrounded: true,
  hidden_render_prefetch_generation_or_optimistic_ui_is_not_presentation: true,
  consumed_once_by_exact_approval: true,
})
r7.presentation_protocol = {
  issue_challenge: 'server_resolves_and_binds_exact_case_viewer_atom_version_and_fingerprint_for_300_seconds',
  foreground: 'client_places_exact_challenge_bound_content_in_the_active_view; generation_prefetch_hidden_render_and_background_fetch_do_not_count',
  acknowledge: 'the_bound_human_explicitly_acts_after_foregrounding; no workload_or_client_telemetry_may_acknowledge_for_them',
  approve: 'a_later_operation_consumes_the_exact_visibility_acknowledgement_atomically_with_its_branch_receipt',
}

r7.operation_specs.approve_intervention.branch_effects = {
  approve: {
    read_set: ['exact_unconsumed_visibility_acknowledgement', 'exact_atom_version', 'current_intervention_authority'],
    write_set: ['intervention_approval_receipt', 'visibility_acknowledgement_consumption'],
    forbidden_write_set: ['new_intervention_atom_version', 'intervention_held_receipt', 'intervention_suppressed_receipt'],
  },
  hold: {
    read_set: ['exact_unconsumed_visibility_acknowledgement', 'exact_atom_version', 'current_intervention_authority'],
    write_set: ['intervention_held_receipt', 'visibility_acknowledgement_consumption'],
    forbidden_write_set: ['new_intervention_atom_version', 'intervention_approval_receipt', 'delivery_effect'],
  },
  suppress: {
    read_set: ['exact_unconsumed_visibility_acknowledgement', 'exact_atom_version', 'current_intervention_authority'],
    write_set: ['intervention_suppressed_receipt', 'atom_version_selection_suppression', 'visibility_acknowledgement_consumption'],
    forbidden_write_set: ['new_intervention_atom_version', 'intervention_approval_receipt', 'delivery_effect'],
  },
}
delete r7.operation_specs.approve_intervention.write_set
r7.approval_effects.edit = {
  product_semantic_action: 'edit',
  trusted_operation: 'stage_intervention_edit',
  standing_after_operation: 'staged_not_approved',
  later_sequence: ['issue_intervention_presentation_challenge', 'record_intervention_visibility', 'approve_intervention'],
}

r7.operation_specs.use_release.branch_effects = {
  pending_delivery: {
    read_set: ['exact_current_pending_projection', 'complete_current_controlling_watermarks', 'current_delivery_authority'],
    write_set: ['release_use_receipt', 'pending_outbox_effect'],
    forbidden_write_set: ['release_invalidation_receipt'],
  },
  invalidated_before_use: {
    read_set: ['exact_current_pending_projection', 'complete_current_controlling_watermarks'],
    write_set: ['release_invalidation_receipt'],
    forbidden_write_set: ['release_use_receipt', 'outbox_effect', 'provider_call'],
  },
}
delete r7.operation_specs.use_release.write_set

const action = r7.lifecycle_authority.action_schema
const joint = r7.lifecycle_authority.joint_receipt_schema
delete joint.properties.consumed_at
joint.exact_keys = Object.keys(joint.properties)
joint.required = [...joint.exact_keys]
delete joint.optional
joint.append_only = true

r7.lifecycle_authority.action_combination_consumption_schema = closed('ctrl.g24.lifecycle-action-combination-consumption.r7.v1', {
  consumption_schema_version: { const: 'ctrl.g24.lifecycle-action-combination-consumption.r7.v1' },
  consumption_ref: id,
  action_ref: id,
  action_fingerprint: fp,
  joint_receipt_ref: id,
  consumed_at: ts,
  consumption_fingerprint: fp,
}, { append_only: true, unique_keys: [['action_ref']] })
r7.lifecycle_authority.joint_transition_consumption_schema = closed('ctrl.g24.lifecycle-joint-transition-consumption.r7.v1', {
  consumption_schema_version: { const: 'ctrl.g24.lifecycle-joint-transition-consumption.r7.v1' },
  consumption_ref: id,
  joint_receipt_ref: id,
  joint_receipt_fingerprint: fp,
  transition_operation_id: id,
  lifecycle_transition_receipt_ref: id,
  consumed_at: ts,
  consumption_fingerprint: fp,
}, { append_only: true, unique_keys: [['joint_receipt_ref']] })
r7.lifecycle_authority.action_nonce_collision = {
  same_case_actor_nonce_and_same_canonical_action_bytes: 'return_existing_action_result_via_secondary_idempotency_without_new_row',
  same_case_actor_nonce_and_different_canonical_action_bytes: 'request_rejected_authority_nonce_conflict_without_mutation',
}
r7.lifecycle_authority.action_pair_collision = {
  same_exact_leader_and_operator_action_refs: 'return_existing_joint_receipt_via_unique_pair_without_new_row',
  either_action_already_combined_with_another_action: 'authority_pair_conflict_hold_without_mutation',
}
r7.lifecycle_authority.fresh_joint_transition_predicate = [
  'server_now_strictly_before_joint_receipt_expires_at',
  'recompute_and_match_both_action_fingerprints',
  'recompute_and_match_joint_receipt_fingerprint',
  'both_action_authority_versions_equal_current_case_bindings',
  'action_consumption_rows_bind_both_actions_to_this_joint_receipt',
  'no_joint_transition_consumption_row_exists',
  'exact_case_transition_and_predecessor_lifecycle_version_match',
]
r7.operation_specs.apply_lifecycle_transition.branch_effects = {
  single_human_authority: {
    read_set: ['current_lifecycle_chain', 'exact_current_human_authority', 'transition_preconditions'],
    write_set: ['lifecycle_transition_receipt', 'lifecycle_snapshot'],
    forbidden_write_set: ['joint_transition_consumption'],
  },
  two_party_authority: {
    read_set: ['current_lifecycle_chain', 'exact_fresh_joint_authority_receipt', 'transition_preconditions'],
    write_set: ['lifecycle_transition_receipt', 'lifecycle_snapshot', 'joint_transition_consumption'],
    forbidden_write_set: [],
  },
}
delete r7.operation_specs.apply_lifecycle_transition.write_set
r7.derived_authority_predicates.current_unconsumed_two_party_receipt_exact_case_actors_transition_and_predecessor = r7.lifecycle_authority.fresh_joint_transition_predicate

// Proof bundles contain exact server-resolved row identities, not free-form constraint prose.
function addRequiredProperty(schema, key, value) {
  if (!schema.properties[key]) schema.properties[key] = value
  schema.exact_keys = Object.keys(schema.properties)
  schema.required = [...schema.exact_keys]
}
addRequiredProperty(r7.proof_bundle_schemas.extensions.selector_result, 'selector_result_ref', id)
addRequiredProperty(r7.proof_bundle_schemas.extensions.selector_result, 'selector_result_fingerprint', fp)
addRequiredProperty(r7.proof_bundle_schemas.extensions.lifecycle, 'transition_receipt_ref', id)
addRequiredProperty(r7.proof_bundle_schemas.extensions.lifecycle, 'transition_receipt_fingerprint', fp)

const proofRows = {
  selector_result: {
    table: 'selector_results', primary_ref: 'selector_result_ref', primary_fingerprint: 'selector_result_fingerprint',
    extras: [{ table: 'selector_candidate_sets', row_ref: 'candidate_set_ref', row_fingerprint: 'candidate_set_fingerprint', extension_ref: 'candidate_set_ref', extension_fingerprint: 'candidate_set_fingerprint' }],
  },
  intervention_approval: {
    table: 'intervention_approval_receipts', primary_ref: 'approval_receipt_ref', primary_fingerprint: 'approval_receipt_fingerprint',
    extras: [{ table: 'intervention_visibility_acknowledgements', row_ref: 'receipt_ref', row_fingerprint: 'receipt_fingerprint', extension_ref: 'visible_effect_receipt_ref', extension_fingerprint: 'visible_effect_receipt_fingerprint' }],
  },
  answer: {
    table: 'answer_receipts', primary_ref: 'answer_receipt_ref', primary_fingerprint: 'answer_receipt_fingerprint', extras: [],
  },
  correction: {
    table: 'correction_receipts', primary_ref: 'correction_receipt_ref', primary_fingerprint: 'correction_receipt_fingerprint', extras: [],
  },
  lifecycle: {
    table: 'lifecycle_transition_receipts', primary_ref: 'transition_receipt_ref', primary_fingerprint: 'transition_receipt_fingerprint', extras: [],
  },
  pending_release_and_authority: {
    table: 'pending_release_projections', primary_ref: 'pending_projection_ref', primary_fingerprint: 'pending_projection_fingerprint',
    extras: [{ table: 'release_authority_receipts', row_ref: 'release_authority_receipt_ref', row_fingerprint: 'release_authority_receipt_fingerprint', extension_ref: 'release_authority_receipt_ref', extension_fingerprint: 'release_authority_receipt_fingerprint' }],
  },
  enrichment_plan: {
    table: 'enrichment_plans', primary_ref: 'plan_ref', primary_fingerprint: 'plan_fingerprint', extras: [],
  },
  execution_receipt: {
    table: 'enrichment_execution_receipts', primary_ref: 'execution_receipt_ref', primary_fingerprint: 'execution_receipt_fingerprint', extras: [],
  },
}
r7.authoritative_row_schemas = {}
for (const row of Object.values(proofRows)) {
  const register = (table, refField, fingerprintField) => {
    r7.authoritative_row_schemas[table] ??= closed(`ctrl.g24.authoritative-row.${table.replaceAll('_', '-')}.r7.v1`, {
      [refField]: id,
      [fingerprintField]: fp,
      workspace_ref: id,
      subject_ref: id,
      case_ref: id,
      snapshot_fingerprint: fp,
      row_version_ref: id,
      valid_from: ts,
    }, { append_only: true, current_rule: 'latest_valid_row_at_exact_snapshot' })
  }
  register(row.table, row.primary_ref, row.primary_fingerprint)
  for (const extra of row.extras) register(extra.table, extra.row_ref, extra.row_fingerprint)
}
r7.proof_authority = {
  caller_supplied_proof_bundle_allowed: false,
  browser_serializable_proof_bundle_allowed: false,
  bundle_built_server_side_from_authoritative_rows: true,
  resolution_transaction: 'same_serializable_transaction_as_evaluator_and_snapshot_cas',
  canonical_common_record_rule: 'canonical_record_ref_and_fingerprint_equal_the_family_primary_row_ref_and_recomputed_fingerprint',
  row_current_rule: 'every_row_is_current_at_the_evaluated_snapshot_and_matches_workspace_subject_case_snapshot_and_chain',
  fingerprint_rule: 'every_authoritative_row_fingerprint_is_recomputed_from_its_schema_before_use',
  failure: 'proof_schema_hold_without_evaluator_output_or_effect',
  proof_family_resolution_map: Object.fromEntries(Object.entries(proofRows).map(([family, row]) => [family, {
    canonical_owner: {
      table: row.table,
      schema_ref: `authoritative_row_schemas.${row.table}`,
      row_ref_field: row.primary_ref,
      row_fingerprint_field: row.primary_fingerprint,
      common_ref_equals_extension_field: row.primary_ref,
      common_fingerprint_equals_extension_field: row.primary_fingerprint,
      current_rule: 'row_current_at_exact_snapshot_fingerprint',
      failure: 'proof_schema_hold',
    },
    extension_rows: row.extras.map(extra => ({
      table: extra.table,
      schema_ref: `authoritative_row_schemas.${extra.table}`,
      row_ref_field: extra.row_ref,
      row_fingerprint_field: extra.row_fingerprint,
      extension_ref_field: extra.extension_ref,
      extension_fingerprint_field: extra.extension_fingerprint,
      current_rule: 'row_current_at_exact_snapshot_fingerprint',
      equality: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
      failure: 'proof_schema_hold',
    })),
  }])),
}

// Immutable outbox events make a crash after dispatch observable and recoverable without guessing.
const reservationProperties = {
  reservation_schema_version: { const: 'ctrl.g24.outbox-attempt-reservation.r7.v1' }, reservation_ref: id, outbox_effect_ref: id,
  attempt_ordinal: { ...pos, maximum: 3 }, fencing_token: pos, worker_ref: id, provider_ref: id,
  provider_operation_ref: id, provider_key: id, payload_fingerprint: fp, reserved_at: ts, lease_expires_at: ts, reservation_fingerprint: fp,
}
const dispatchProperties = {
  dispatch_schema_version: { const: 'ctrl.g24.outbox-attempt-dispatch.r7.v1' }, dispatch_ref: id, reservation_ref: id,
  reservation_fingerprint: fp, outbox_effect_ref: id, attempt_ordinal: { ...pos, maximum: 3 }, fencing_token: pos,
  worker_ref: id, provider_ref: id, provider_operation_ref: id, provider_key: id, payload_fingerprint: fp,
  dispatched_at: ts, lease_expires_at_at_dispatch: ts, dispatch_fingerprint: fp,
}
const terminalBase = {
  outbox_effect_ref: id, attempt_ordinal: { ...pos, maximum: 3 }, dispatch_ref: id, dispatch_fingerprint: fp,
  fencing_token: pos, worker_ref: id, provider_ref: id, provider_operation_ref: id, provider_key: id, payload_fingerprint: fp,
}
r7.outbox = {
  item_states: ['pending', 'claimed', 'confirmed', 'failed', 'unknown'],
  attempt_states: ['reserved', 'dispatched', 'confirmed', 'definitively_failed', 'ambiguous'],
  authoritative_state: 'derived_from_append_only_claim_reservation_dispatch_terminal_and_reconciliation_events',
  actor_authority: r7.outbox.actor_authority,
  claim: {
    atomic_compare_and_swap: true,
    eligible_from: ['pending', 'ambiguous_with_current_provider_idempotency_guarantee_and_attempts_below_three'],
    reads: ['derived_outbox_state', 'current_fencing_token', 'current_lease', 'committed_reservation_count'],
    writes: ['claim_event_with_new_fencing_token_and_lease'],
    attempt_ordinal_assigned_here: false,
    second_live_claim: false,
  },
  pre_provider_checks: ['current_effect_authority', 'exact_payload_fingerprint', 'exact_payload_bytes', 'exactly_one_current_provider_capability'],
  pre_provider_failure: { transition: 'claimed_to_failed', provider_called: false, evidence: 'pre_provider_failure_event' },
  reservation_schema: closed('ctrl.g24.outbox-attempt-reservation.r7.v1', reservationProperties, { append_only: true, unique_keys: [['outbox_effect_ref', 'attempt_ordinal'], ['reservation_ref']] }),
  dispatch_schema: closed('ctrl.g24.outbox-attempt-dispatch.r7.v1', dispatchProperties, { append_only: true, unique_keys: [['reservation_ref'], ['dispatch_ref']] }),
  reservation: {
    transition: 'claimed_to_reserved', atomic_compare_and_swap: true,
    reads: ['current_claim_fence_and_worker', 'unexpired_lease', 'committed_reservation_count', 'provider_call_identity'],
    writes: ['immutable_attempt_reservation'], next_ordinal: 'committed_reservation_count_plus_one', allowed_ordinals: [1, 2, 3], fourth_reservation_allowed: false,
  },
  dispatch: {
    transition: 'reserved_to_dispatched', atomic_compare_and_swap: true, exact_once_per_reservation: true,
    writes: ['immutable_attempt_dispatch'], commits_before_provider_call: true, provider_call_uses_exact_dispatch_identity: true,
    provider_call_allowed_ordinals: [1, 2, 3], fourth_provider_call_allowed: false,
    rechecks: ['current_fencing_token', 'current_lease_owner', 'unexpired_lease', 'current_effect_authority', 'exact_payload_fingerprint', 'exact_payload_bytes', 'exactly_one_current_provider_capability'],
  },
  provider_success_evidence_schema: closed('ctrl.g24.provider-success-evidence.r7.v1', {
    evidence_schema_version: { const: 'ctrl.g24.provider-success-evidence.r7.v1' }, evidence_ref: id, ...terminalBase,
    provider_response_ref: id, provider_receipt_bytes_fingerprint: fp, observed_success_at: ts, evidence_fingerprint: fp,
  }, { append_only: true, unique_keys: [['dispatch_ref']], fingerprint_ref: 'fingerprint_schemas.provider_success_evidence' }),
  provider_failure_evidence_schema: closed('ctrl.g24.provider-failure-evidence.r7.v1', {
    evidence_schema_version: { const: 'ctrl.g24.provider-failure-evidence.r7.v1' }, evidence_ref: id, ...terminalBase,
    provider_failure_code: id, observed_failure_at: ts, evidence_fingerprint: fp,
  }, { append_only: true, unique_keys: [['dispatch_ref']], fingerprint_ref: 'fingerprint_schemas.provider_failure_evidence' }),
  ambiguity_evidence_schema: closed('ctrl.g24.provider-ambiguity-evidence.r7.v1', {
    evidence_schema_version: { const: 'ctrl.g24.provider-ambiguity-evidence.r7.v1' }, evidence_ref: id, ...terminalBase,
    ambiguity_reason: { type: 'enum', values: ['worker_reported_unknown_outcome', 'dispatch_lease_expired_without_terminal_evidence'] },
    observed_ambiguous_at: ts, recorder_ref: id, evidence_fingerprint: fp,
  }, { append_only: true, unique_keys: [['dispatch_ref']], fingerprint_ref: 'fingerprint_schemas.provider_ambiguity_evidence' }),
  reconciliation_evidence_schema: closed('ctrl.g24.provider-reconciliation-evidence.r7.v1', {
    evidence_schema_version: { const: 'ctrl.g24.provider-reconciliation-evidence.r7.v1' }, evidence_ref: id, ...terminalBase,
    reconciler_workload_ref: id, observed_outcome: { type: 'enum', values: ['confirmed', 'definitively_failed'] }, observed_at: ts,
    provider_evidence_ref: id, evidence_fingerprint: fp,
  }, { append_only: true, unique_keys: [['dispatch_ref']], fingerprint_ref: 'fingerprint_schemas.provider_reconciliation_evidence' }),
  transition_table: [
    { from: 'pending', to: 'claimed', actor: 'authorized_worker', event: 'claim_event', provider_call: false },
    { from: 'claimed', to: 'failed', actor: 'current_fenced_worker', event: 'pre_provider_failure_event', provider_call: false },
    { from: 'claimed', to: 'reserved', actor: 'current_fenced_worker', event: 'attempt_reservation', provider_call: false },
    { from: 'reserved', to: 'dispatched', actor: 'current_fenced_worker', event: 'attempt_dispatch', provider_call: false },
    { from: 'dispatched', to: 'confirmed', actor: 'current_fenced_worker', event: 'provider_success_evidence', provider_call: 'exactly_one_call_bound_to_dispatch' },
    { from: 'dispatched', to: 'failed', actor: 'current_fenced_worker', event: 'provider_failure_evidence', provider_call: 'exactly_one_call_bound_to_dispatch' },
    { from: 'dispatched', to: 'ambiguous', actor: 'current_fenced_worker', event: 'worker_ambiguity_evidence', provider_call: 'call_may_have_occurred' },
    { from: 'dispatched', to: 'ambiguous', actor: 'outbox_lease_reaper', event: 'lease_expiry_ambiguity_evidence', condition: 'server_now_after_dispatch_bound_lease_expiry_and_no_terminal_evidence', provider_call: false },
    { from: 'ambiguous', to: 'reserved', actor: 'authorized_worker', event: 'next_attempt_reservation', condition: 'current_provider_idempotency_guarantee_and_committed_reservation_count_below_three', provider_call: false },
    { from: 'ambiguous', to: 'unknown', actor: 'outbox_lease_reaper', event: 'unknown_terminal_event', condition: 'no_current_idempotency_guarantee_or_three_reservations_used', provider_call: false },
    { from: 'unknown', to: 'confirmed', actor: 'provider_reconciler', event: 'reconciliation_evidence_confirmed', provider_call: false },
    { from: 'unknown', to: 'failed', actor: 'provider_reconciler', event: 'reconciliation_evidence_failed', provider_call: false },
  ],
  retry_identity: ['provider_ref', 'provider_operation_ref', 'provider_key', 'payload_fingerprint'],
  retry_requires_exact_identity_match: true,
  lease_or_worker_change_resets_attempt_count: false,
  unknown_auto_resend: false,
  reconciliation_can_send: false,
  external_call_authorized_in_phase: false,
}

r7.fingerprint_schemas = {
  release_invalidation_receipt: fingerprint('CTRL-G24-RELEASE-INVALIDATION-R7', Object.keys(r7.release_invalidation.invalidation_receipt_schema.properties).filter(k => k !== 'receipt_fingerprint')),
  lifecycle_authority_action: fingerprint('CTRL-G24-LIFECYCLE-ACTION-R7', Object.keys(action.properties).filter(k => k !== 'action_fingerprint')),
  lifecycle_joint_authority_receipt: fingerprint('CTRL-G24-LIFECYCLE-JOINT-R7', Object.keys(joint.properties).filter(k => k !== 'receipt_fingerprint')),
  lifecycle_action_combination_consumption: fingerprint('CTRL-G24-LIFECYCLE-ACTION-CONSUMPTION-R7', Object.keys(r7.lifecycle_authority.action_combination_consumption_schema.properties).filter(k => k !== 'consumption_fingerprint')),
  lifecycle_joint_transition_consumption: fingerprint('CTRL-G24-LIFECYCLE-JOINT-CONSUMPTION-R7', Object.keys(r7.lifecycle_authority.joint_transition_consumption_schema.properties).filter(k => k !== 'consumption_fingerprint')),
  presentation_challenge: fingerprint('CTRL-G24-PRESENTATION-CHALLENGE-R7', Object.keys(r7.presentation_challenge_schema.properties).filter(k => k !== 'challenge_fingerprint')),
  intervention_visibility_receipt: fingerprint('CTRL-G24-INTERVENTION-VISIBILITY-R7', Object.keys(r7.intervention_visibility_receipt_schema.properties).filter(k => k !== 'receipt_fingerprint')),
  outbox_attempt_reservation: fingerprint('CTRL-G24-OUTBOX-RESERVATION-R7', Object.keys(r7.outbox.reservation_schema.properties).filter(k => k !== 'reservation_fingerprint')),
  outbox_attempt_dispatch: fingerprint('CTRL-G24-OUTBOX-DISPATCH-R7', Object.keys(r7.outbox.dispatch_schema.properties).filter(k => k !== 'dispatch_fingerprint')),
  provider_success_evidence: fingerprint('CTRL-G24-PROVIDER-SUCCESS-R7', Object.keys(r7.outbox.provider_success_evidence_schema.properties).filter(k => k !== 'evidence_fingerprint')),
  provider_failure_evidence: fingerprint('CTRL-G24-PROVIDER-FAILURE-R7', Object.keys(r7.outbox.provider_failure_evidence_schema.properties).filter(k => k !== 'evidence_fingerprint')),
  provider_ambiguity_evidence: fingerprint('CTRL-G24-PROVIDER-AMBIGUITY-R7', Object.keys(r7.outbox.ambiguity_evidence_schema.properties).filter(k => k !== 'evidence_fingerprint')),
  provider_reconciliation_evidence: fingerprint('CTRL-G24-PROVIDER-RECONCILIATION-R7', Object.keys(r7.outbox.reconciliation_evidence_schema.properties).filter(k => k !== 'evidence_fingerprint')),
}

r7.result_payload_schemas.issue_intervention_presentation_challenge = closed('ctrl.g24.result.issue-intervention-presentation-challenge.r7.v1', {
  challenge_ref: id, challenge_fingerprint: fp, expires_at: ts,
})
r7.result_payload_schemas.record_intervention_visibility = closed('ctrl.g24.result.record-intervention-visibility.r7.v1', {
  visibility_acknowledgement_ref: id, receipt_fingerprint: fp, atom_version_ref: id,
})
for (const name of r7.operation_names) {
  r7.snapshot_and_cas_by_operation[name] ??= structuredClone(r7.snapshot_and_cas_by_operation.record_intervention_visibility)
}

r7.required_negative_fixture_families = [
  ...r7.required_negative_fixture_families,
  'closed_type_and_reference_graph',
  'registry_before_fresh_authority_replay_order',
  'presentation_challenge_and_explicit_acknowledgement',
  'branch_exact_effect_sets',
  'immutable_lifecycle_consumption_and_collision',
  'proof_family_exact_row_resolution',
  'canonical_field_encoding',
  'append_only_outbox_dispatch_reaper_and_reconciliation',
]
r7.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r7)
export const materializedR7 = r7
export const materializedR7Output = `${JSON.stringify(r7, null, 2)}\n`
export const materializedR7Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR7Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (read(outputPath) !== materializedR7Output) {
      console.error(`${outputPath} is not the exact generator output`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R7 effective contract`)
  } else process.stdout.write(materializedR7Output)
}
