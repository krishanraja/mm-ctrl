import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const r7Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r7.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r8.json'
const r7Bytes = read(r7Path)
const r8 = JSON.parse(r7Bytes)

const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const pos = { type: 'positive_integer' }

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

function bumpSchema(schema, schemaVersion, versionField) {
  schema.schema_version = schemaVersion
  if (versionField && schema.properties?.[versionField]) schema.properties[versionField].const = schemaVersion
}

function addRequired(schema, properties) {
  Object.assign(schema.properties, properties)
  schema.exact_keys = Object.keys(schema.properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}

function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}

r8.schema_version = 'ctrl.g24.trusted-ingress.r8.effective.v1'
r8.status = 'seventh_repair_candidate_under_independent_review'
r8.date = '2026-09-13'
r8.supersedes = {
  commit: 'a95f210be0d4de611e8862821c050907add88d00',
  tree: '793480d472a4ff22d7a9dd4fa5a00887e314b815',
  human_blob: 'cd2cf1c2e7fd2e6776e294ba1ea28d9f991c0904',
  machine_blob: '98d5eb83e422cec8eaa056a8bf3b668763afcaa5',
  qa_blob: '4c5ee8acee7b3d9ef7a179b3590107ef543b37b0',
  checker_blob: '33922ff8bda4d2b2a89390fd1d1b035283a17db0',
  materializer_blob: '9a9324b0b32266bd735028468e48c83ffa211620',
  adjudication: 'veto',
}
r8.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r8.mjs',
  frozen_input: { path: r7Path, sha256: sha256(r7Bytes) },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// A structural member preserves the full canonical control identifier language.
r8.type_registry.controlling_watermark_member = {
  json_type: 'object',
  discriminator: 'kind_class',
  variants: {
    base: closed('ctrl.g24.controlling-watermark-member-base.r8.v1', {
      kind_class: { const: 'base' },
      base_kind: { type: 'enum', values: [...r8.controlling_watermarks.base_kinds_in_canonical_order] },
    }),
    applicable_control: closed('ctrl.g24.controlling-watermark-member-control.r8.v1', {
      kind_class: { const: 'applicable_control' },
      control_id: id,
    }),
  },
}
delete r8.type_registry.controlling_watermark_kind
r8.controlling_watermarks.member_identity = {
  base: ['kind_class', 'base_kind'],
  applicable_control: ['kind_class', 'control_id'],
}
r8.controlling_watermarks.canonical_order = 'all_base_members_in_declared_base_order_then_applicable_control_members_by_ascending_unsigned_utf8_bytes_of_the_complete_canonical_identifier'
r8.controlling_watermarks.additional_kind_grammar = {
  structural_variant: 'applicable_control',
  control_id_type: 'identifier',
  narrower_duplicate_control_id_grammar_allowed: false,
}
r8.controlling_watermarks.member_schema = r8.type_registry.controlling_watermark_member
r8.result_payload_schemas.use_release.variants.invalidated_before_use.properties.changed_controlling_watermark_kinds.items = { type: 'controlling_watermark_member' }
r8.release_invalidation.invalidation_receipt_schema.properties.changed_controlling_watermark_kinds.items = { type: 'controlling_watermark_member' }

// Evaluator ABI must have exact operation and result parity.
r8.evaluator_abi.operation_result_exports.issue_intervention_presentation_challenge = 'ctrl.g24.result.issue-intervention-presentation-challenge.r7.v1'
r8.evaluator_abi.operation_result_exports.record_intervention_visibility = 'ctrl.g24.result.record-intervention-visibility.r7.v1'
r8.evaluator_abi.operation_result_exports = Object.fromEntries(r8.operation_names.map(name => [name, r8.evaluator_abi.operation_result_exports[name]]))
r8.evaluator_abi.operation_export_parity = 'keys_equal_operation_names_and_each_value_equals_result_payload_schemas_operation_schema_version'

// Viewer identity is server resolved. The human action is an attestation, not telemetry proof of comprehension.
r8.operation_specs.issue_intervention_presentation_challenge.intent = closed('ctrl.g24.intent.issue-intervention-presentation-challenge.r8.v1', {
  intervention_atom_ref: id,
  atom_version_ref: id,
})
r8.presentation_challenge_schema.expires_at_derivation = 'exact_server_issued_at_plus_300_seconds'
r8.presentation_challenge_schema.viewer_actor_ref_source = 'current_case_engagement_operator_ref_server_resolved'
r8.presentation_challenge_issuance_predicate = [
  'issuer_is_current_granted_presentation_challenge_workload',
  'requested_case_ref_equals_atom_case_ref',
  'atom_ref_and_version_are_current_or_staged_and_content_fingerprint_is_recomputed',
  'viewer_actor_ref_equals_current_case_engagement_operator_ref',
  'server_nonce_is_fresh_for_case_and_viewer',
  'expires_at_equals_issued_at_plus_exact_300_seconds',
]
r8.operation_specs.record_intervention_visibility.intent = closed('ctrl.g24.intent.record-intervention-visibility.r8.v1', {
  presentation_challenge_ref: id,
  foreground_attestation: { const: 'I_acknowledge_that_the_exact_challenge_bound_content_was_foregrounded_to_me' },
  acknowledgement_nonce: id,
})
r8.presentation_acknowledgement_predicate = [
  'authenticated_stable_actor_ref_equals_challenge_viewer_actor_ref',
  'authenticated_stable_actor_ref_equals_current_case_engagement_operator_ref',
  'challenge_case_ref_equals_requested_case_ref',
  'challenge_atom_ref_version_and_content_fingerprint_equal_the_foregrounded_atom',
  'challenge_fingerprint_recomputed_and_equal',
  'server_now_strictly_before_challenge_expires_at',
  'no_prior_visibility_acknowledgement_exists_for_challenge_ref',
  'foreground_attestation_equals_the_exact_constant',
]
r8.presentation_acknowledgement_collision = {
  same_challenge_and_same_stable_attestation_projection: 'commit_new_operation_registry_success_with_exact_existing_receipt_result_bytes_and_no_new_receipt',
  same_challenge_and_different_stable_attestation_projection: 'presentation_acknowledgement_conflict_hold_with_committed_operation_registry_hold',
}
r8.intervention_visibility_consumption_schema = closed('ctrl.g24.intervention-visibility-consumption.r8.v1', {
  consumption_schema_version: { const: 'ctrl.g24.intervention-visibility-consumption.r8.v1' },
  consumption_ref: id,
  visibility_acknowledgement_ref: id,
  visibility_acknowledgement_fingerprint: fp,
  approval_operation_id: id,
  approval_branch: { type: 'enum', values: ['approve', 'hold', 'suppress'] },
  consumed_at: ts,
  consumption_fingerprint: fp,
}, { append_only: true, unique_keys: [['visibility_acknowledgement_ref']] })
for (const branch of Object.values(r8.operation_specs.approve_intervention.branch_effects)) {
  branch.write_set = branch.write_set.map(name => name === 'visibility_acknowledgement_consumption' ? 'intervention_visibility_consumption' : name)
}
r8.hold_codes = [...new Set([...r8.hold_codes, 'presentation_acknowledgement_conflict_hold', 'authority_nonce_conflict_hold', 'authority_pair_conflict_hold'])]

// One branch-effect vocabulary is authoritative. Human-facing semantics contain no duplicate writes.
r8.approval_effects = {
  discriminator: 'decision',
  branch_effects_ref: 'operation_specs.approve_intervention.branch_effects',
  invariant: 'every_branch_consumes_the_exact_visibility_acknowledgement_once;_only_approve_confers_approval',
  semantics: {
    approve: { standing: 'approved_exact_visible_atom', delivery_eligible: true, result_variant: 'approved' },
    hold: { standing: 'not_approved', delivery_eligible: false, result_variant: 'held_without_approval' },
    suppress: { standing: 'not_approved', delivery_eligible: false, reselection_eligible: false, result_variant: 'suppressed_without_approval' },
    edit: { product_semantic_action: 'edit', trusted_operation: 'stage_intervention_edit', standing_after_operation: 'staged_not_approved' },
  },
  edit_and_approve_in_one_operation_allowed: false,
}
r8.operation_specs.use_release.branch_effects.invalidated_before_use.write_set = [...r8.release_invalidation.invalidated_write_set]
r8.operation_specs.use_release.branch_effects.invalidated_before_use.forbidden_write_set = [...r8.release_invalidation.invalidated_forbidden_write_set]
r8.release_invalidation.branch_effects_ref = 'operation_specs.use_release.branch_effects.invalidated_before_use'

// Lifecycle secondary idempotency excludes server-generated issue fields and still commits the new operation ID.
r8.lifecycle_authority.stable_action_projection_schema = closed('ctrl.g24.lifecycle-action-secondary-idempotency.r8.v1', {
  case_ref: id,
  stable_actor_ref: id,
  actor_class: { type: 'enum', values: ['named_leader', 'krish_operator'] },
  authority_version: id,
  transition_id: structuredClone(r8.lifecycle_authority.action_schema.properties.transition_id),
  predecessor_lifecycle_version: id,
  nonce: id,
  projection_fingerprint: fp,
})
addRequired(r8.lifecycle_authority.action_schema, { secondary_idempotency_fingerprint: fp })
r8.lifecycle_authority.action_nonce_collision = {
  comparison: 'recomputed_stable_action_projection_fingerprint',
  excluded_server_fields: ['action_ref', 'issued_at', 'expires_at', 'action_fingerprint'],
  same_case_actor_nonce_and_same_projection: 'commit_new_operation_registry_success_with_exact_existing_action_result_bytes_and_no_new_action_row',
  same_case_actor_nonce_and_different_projection: 'authority_nonce_conflict_hold_with_committed_operation_registry_hold',
}
r8.lifecycle_authority.action_pair_collision = {
  same_exact_leader_and_operator_action_refs: 'commit_new_operation_registry_success_with_exact_existing_joint_result_bytes_and_no_new_joint_row',
  either_action_already_combined_with_another_action: 'authority_pair_conflict_hold_with_committed_operation_registry_hold',
}
r8.operation_registry.secondary_idempotency = {
  applies_to: ['record_leader_lifecycle_action', 'record_operator_lifecycle_action', 'combine_lifecycle_authority', 'record_intervention_visibility'],
  new_operation_id_always_commits: 'committed_success_or_committed_hold_under_normal_registry_rules',
  same_stable_projection: 'reuse_exact_existing_result_payload_bytes_without_new_authority_row',
  different_stable_projection: 'commit_named_hold_without_mutating_authority_record',
}

// Complete proof dependencies with family-specific rows, stable fingerprints and exact selection.
const proofPlans = {
  selector_result: {
    owner: ['selector_results', 'selector_result_ref', 'selector_result_fingerprint'],
    rows: [
      ['selector_candidate_sets', [['candidate_set_ref', 'candidate_set_ref', id], ['candidate_set_fingerprint', 'candidate_set_fingerprint', fp]]],
      ['selector_policies', [['selector_policy_version', 'selector_policy_version', id], ['selector_policy_fingerprint', 'selector_policy_fingerprint', fp]]],
    ], seals: [],
  },
  intervention_approval: {
    owner: ['intervention_approval_receipts', 'approval_receipt_ref', 'approval_receipt_fingerprint'],
    rows: [
      ['intervention_atoms', [['intervention_atom_ref', 'intervention_atom_ref', id], ['intervention_atom_version_ref', 'atom_version_ref', id], ['intervention_atom_content_fingerprint', 'atom_content_fingerprint', fp]]],
      ['intervention_visibility_acknowledgements', [['visible_effect_receipt_ref', 'receipt_ref', id], ['visible_effect_receipt_fingerprint', 'receipt_fingerprint', fp]]],
    ], seals: [],
  },
  answer: {
    owner: ['answer_receipts', 'answer_receipt_ref', 'answer_receipt_fingerprint'],
    rows: [
      ['leader_authority_receipts', [['leader_authority_ref', 'leader_authority_ref', id], ['leader_authority_fingerprint', 'leader_authority_fingerprint', fp]]],
      ['answer_visibility_acknowledgements', [['visible_effect_receipt_ref', 'receipt_ref', id], ['visible_effect_receipt_fingerprint', 'receipt_fingerprint', fp]]],
    ], seals: [],
  },
  correction: {
    owner: ['correction_receipts', 'correction_receipt_ref', 'correction_receipt_fingerprint'], rows: [],
    seals: [['answer_chain_tip', 'answer_chain', 'ordered_complete_answer_chain'], ['dependency_graph_seal', 'answer_dependency_graph', 'complete_current_dependency_graph']],
  },
  lifecycle: {
    owner: ['lifecycle_transition_receipts', 'transition_receipt_ref', 'transition_receipt_fingerprint'],
    rows: [
      ['lifecycle_snapshots', [['lifecycle_snapshot_ref', 'lifecycle_snapshot_ref', id], ['lifecycle_snapshot_fingerprint', 'lifecycle_snapshot_fingerprint', fp]]],
      ['lifecycle_authority_receipts', [['authority_receipt_ref', 'authority_receipt_ref', id], ['authority_receipt_fingerprint', 'authority_receipt_fingerprint', fp]]],
    ], seals: [['precondition_set_seal', 'lifecycle_preconditions', 'complete_transition_precondition_set']],
  },
  pending_release_and_authority: {
    owner: ['pending_release_projections', 'pending_projection_ref', 'pending_projection_fingerprint'],
    rows: [['release_authority_receipts', [['release_authority_receipt_ref', 'release_authority_receipt_ref', id], ['release_authority_receipt_fingerprint', 'release_authority_receipt_fingerprint', fp]]]],
    seals: [['controlling_watermark_set_fingerprint', 'controlling_watermarks', 'complete_bound_controlling_watermark_set']],
  },
  enrichment_plan: {
    owner: ['enrichment_plans', 'plan_ref', 'plan_fingerprint'],
    rows: [
      ['enrichment_budget_policies', [['budget_policy_ref', 'budget_policy_ref', id], ['budget_policy_fingerprint', 'budget_policy_fingerprint', fp]]],
      ['enrichment_terminal_states', [['terminal_state_ref', 'terminal_state_ref', id], ['terminal_state_fingerprint', 'terminal_state_fingerprint', fp]]],
    ], seals: [],
  },
  execution_receipt: {
    owner: ['enrichment_execution_receipts', 'execution_receipt_ref', 'execution_receipt_fingerprint'],
    rows: [['enrichment_terminal_states', [['terminal_state_ref', 'terminal_state_ref', id], ['terminal_state_fingerprint', 'terminal_state_fingerprint', fp]]]],
    seals: [],
  },
}

const rowFields = {}
for (const [family, plan] of Object.entries(proofPlans)) {
  const extension = r8.proof_bundle_schemas.extensions[family]
  for (const [, pairs] of plan.rows) for (const [extensionField, , type] of pairs) if (!extension.properties[extensionField]) addRequired(extension, { [extensionField]: type })
  const [ownerTable, ownerRef, ownerFp] = plan.owner
  rowFields[ownerTable] ??= { [ownerRef]: id, [ownerFp]: fp }
  for (const [table, pairs] of plan.rows) {
    rowFields[table] ??= {}
    for (const [, rowField, type] of pairs) rowFields[table][rowField] = type
  }
}
// Owner rows carry the semantic joins needed to reproduce their proof family.
Object.assign(rowFields.selector_results, { candidate_set_ref: id, candidate_set_fingerprint: fp, selector_policy_version: id, selector_policy_fingerprint: fp })
Object.assign(rowFields.intervention_approval_receipts, { intervention_atom_ref: id, atom_version_ref: id, atom_content_fingerprint: fp, visibility_acknowledgement_ref: id, visibility_acknowledgement_fingerprint: fp })
Object.assign(rowFields.answer_receipts, { answer_version_ref: id, leader_authority_ref: id, leader_authority_fingerprint: fp, visibility_acknowledgement_ref: id, visibility_acknowledgement_fingerprint: fp })
Object.assign(rowFields.correction_receipts, { answer_chain_tip: fp, dependency_graph_seal: fp })
Object.assign(rowFields.lifecycle_transition_receipts, { lifecycle_snapshot_ref: id, lifecycle_snapshot_fingerprint: fp, authority_receipt_ref: id, authority_receipt_fingerprint: fp, precondition_set_seal: fp })
Object.assign(rowFields.pending_release_projections, { projection_version_ref: id, release_authority_receipt_ref: id, release_authority_receipt_fingerprint: fp, controlling_watermark_set_fingerprint: fp })
Object.assign(rowFields.enrichment_plans, { plan_version_ref: id, budget_policy_ref: id, budget_policy_fingerprint: fp, terminal_state_ref: id, terminal_state_fingerprint: fp })
Object.assign(rowFields.enrichment_execution_receipts, { attempt_ordinal: pos, terminal_state_ref: id, terminal_state_fingerprint: fp })

r8.authoritative_row_schemas = {}
r8.authoritative_row_fingerprint_schemas = {}
for (const [table, specific] of Object.entries(rowFields)) {
  const primaryFp = Object.keys(specific).find(key => key.endsWith('_fingerprint'))
  const schema = closed(`ctrl.g24.authoritative-row.${table.replaceAll('_', '-')}.r8.v1`, {
    workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
    ...specific,
    row_version_ref: id, valid_from: ts, valid_until: ts,
  }, {
    optional: ['valid_until'], append_only: true,
    partition_key: ['workspace_ref', 'subject_ref', 'case_ref', Object.keys(specific).find(key => key.endsWith('_ref') || key.endsWith('_version'))],
    current_selection: 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_evaluated_at_and_valid_until_absent_or_gt_evaluated_at',
    current_selection_unique_or_hold: true,
  })
  const fingerprintName = `authoritative_row_${table}`
  linkFingerprint(schema, `authoritative_row_fingerprint_schemas.${fingerprintName}`, primaryFp)
  r8.authoritative_row_schemas[table] = schema
  r8.authoritative_row_fingerprint_schemas[fingerprintName] = fingerprint(`CTRL-G24-AUTHORITATIVE-ROW-${table.toUpperCase().replaceAll('_', '-')}-R8`, Object.keys(schema.properties).filter(key => key !== primaryFp))
}
r8.proof_set_schemas = {
  answer_chain: { set_kind: 'answer_chain', member_schema_ref: 'authoritative_row_schemas.answer_receipts', identity_projection: ['answer_receipt_ref'], ordering: 'append_ordinal_ascending', completeness: 'genesis_through_current_tip_without_gap', fingerprint_ref: 'set_seal_encoding' },
  answer_dependency_graph: { set_kind: 'answer_dependency_graph', member_schema_ref: 'authoritative_row_schemas.answer_receipts', identity_projection: ['answer_receipt_ref', 'row_version_ref'], ordering: 'unsigned_utf8_member_identity', completeness: 'all_current_dependencies_reachable_from_corrected_answer', fingerprint_ref: 'set_seal_encoding' },
  lifecycle_preconditions: { set_kind: 'lifecycle_preconditions', member_schema_ref: 'authoritative_row_schemas.lifecycle_snapshots', identity_projection: ['lifecycle_snapshot_ref', 'row_version_ref'], ordering: 'unsigned_utf8_member_identity', completeness: 'all_preconditions_for_exact_transition', fingerprint_ref: 'set_seal_encoding' },
  controlling_watermarks: { set_kind: 'controlling_watermarks', member_schema_ref: 'type_registry.controlling_watermark_member', identity_projection: ['kind_class', 'base_kind_or_control_id'], ordering: 'controlling_watermarks.canonical_order', completeness: 'all_base_and_current_applicable_control_members_exactly_once', fingerprint_ref: 'controlling_watermarks.set_fingerprint' },
}
r8.proof_authority.proof_family_resolution_map = Object.fromEntries(Object.entries(proofPlans).map(([family, plan]) => {
  const [ownerTable, ownerRef, ownerFp] = plan.owner
  const extension = r8.proof_bundle_schemas.extensions[family]
  const dependencyCovered = new Set([
    ...plan.rows.flatMap(([, pairs]) => pairs.map(([extensionField]) => extensionField)),
    ...plan.seals.map(([extensionField]) => extensionField),
  ])
  const embedded = Object.keys(extension.properties)
    .filter(field => field !== ownerRef && field !== ownerFp && !dependencyCovered.has(field) && Object.hasOwn(rowFields[ownerTable], field))
    .map(field => ({ extension_field: field, owner_row_field: field }))
  return [family, {
    canonical_owner: {
      table: ownerTable, schema_ref: `authoritative_row_schemas.${ownerTable}`,
      row_ref_field: ownerRef, row_fingerprint_field: ownerFp,
      common_ref_equals_extension_field: ownerRef, common_fingerprint_equals_extension_field: ownerFp,
      embedded_extension_equalities: embedded,
      current_rule: 'family_schema_current_selection', failure: 'proof_schema_hold',
    },
    extension_rows: plan.rows.map(([table, pairs]) => ({
      table, schema_ref: `authoritative_row_schemas.${table}`,
      field_equalities: pairs.map(([extensionField, rowField]) => ({ extension_field: extensionField, row_field: rowField })),
      scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
      current_rule: 'family_schema_current_selection', failure: 'proof_schema_hold',
    })),
    extension_seals: plan.seals.map(([extensionField, setName, completeness]) => ({
      extension_field: extensionField, set_schema_ref: `proof_set_schemas.${setName}`,
      equality: 'extension_field_equals_recomputed_complete_set_fingerprint', completeness, failure: 'proof_schema_hold',
    })),
  }]
}))
r8.proof_authority.every_extension_reference_fingerprint_and_seal_must_appear_in_the_owner_join_row_or_an_exact_dependency_row_or_seal = true

// Link all authority-record fingerprints, including the six links R7 orphaned.
r8.fingerprint_schemas.lifecycle_action_secondary_idempotency = fingerprint('CTRL-G24-LIFECYCLE-ACTION-SECONDARY-IDEMPOTENCY-R8', Object.keys(r8.lifecycle_authority.stable_action_projection_schema.properties).filter(key => key !== 'projection_fingerprint'))
r8.fingerprint_schemas.lifecycle_authority_action = fingerprint('CTRL-G24-LIFECYCLE-ACTION-R8', Object.keys(r8.lifecycle_authority.action_schema.properties).filter(key => key !== 'action_fingerprint'))
r8.fingerprint_schemas.intervention_visibility_consumption = fingerprint('CTRL-G24-INTERVENTION-VISIBILITY-CONSUMPTION-R8', Object.keys(r8.intervention_visibility_consumption_schema.properties).filter(key => key !== 'consumption_fingerprint'))
linkFingerprint(r8.presentation_challenge_schema, 'fingerprint_schemas.presentation_challenge', 'challenge_fingerprint')
linkFingerprint(r8.intervention_visibility_receipt_schema, 'fingerprint_schemas.intervention_visibility_receipt', 'receipt_fingerprint')
linkFingerprint(r8.intervention_visibility_consumption_schema, 'fingerprint_schemas.intervention_visibility_consumption', 'consumption_fingerprint')
linkFingerprint(r8.lifecycle_authority.action_schema, 'fingerprint_schemas.lifecycle_authority_action', 'action_fingerprint')
linkFingerprint(r8.lifecycle_authority.joint_receipt_schema, 'fingerprint_schemas.lifecycle_joint_authority_receipt', 'receipt_fingerprint')
linkFingerprint(r8.lifecycle_authority.action_combination_consumption_schema, 'fingerprint_schemas.lifecycle_action_combination_consumption', 'consumption_fingerprint')
linkFingerprint(r8.lifecycle_authority.joint_transition_consumption_schema, 'fingerprint_schemas.lifecycle_joint_transition_consumption', 'consumption_fingerprint')
linkFingerprint(r8.lifecycle_authority.stable_action_projection_schema, 'fingerprint_schemas.lifecycle_action_secondary_idempotency', 'projection_fingerprint')
linkFingerprint(r8.outbox.reservation_schema, 'fingerprint_schemas.outbox_attempt_reservation', 'reservation_fingerprint')
linkFingerprint(r8.outbox.dispatch_schema, 'fingerprint_schemas.outbox_attempt_dispatch', 'dispatch_fingerprint')
linkFingerprint(r8.outbox.provider_success_evidence_schema, 'fingerprint_schemas.provider_success_evidence', 'evidence_fingerprint')
linkFingerprint(r8.outbox.provider_failure_evidence_schema, 'fingerprint_schemas.provider_failure_evidence', 'evidence_fingerprint')
linkFingerprint(r8.outbox.ambiguity_evidence_schema, 'fingerprint_schemas.provider_ambiguity_evidence', 'evidence_fingerprint')
linkFingerprint(r8.outbox.reconciliation_evidence_schema, 'fingerprint_schemas.provider_reconciliation_evidence', 'evidence_fingerprint')

// One causal transition ledger permits exactly one successor for every committed state event.
const outboxStates = ['pending', 'claimed', 'reserved', 'dispatched', 'ambiguous', 'unknown', 'confirmed', 'failed']
r8.fingerprint_schemas.outbox_transition_event = fingerprint('CTRL-G24-OUTBOX-TRANSITION-EVENT-R8', ['event_schema_version', 'transition_event_ref', 'outbox_effect_ref', 'causal_predecessor_event_ref', 'from_state', 'to_state', 'event_kind', 'payload_ref', 'recorded_at'])
r8.outbox.transition_event_schema = closed('ctrl.g24.outbox-transition-event.r8.v1', {
  event_schema_version: { const: 'ctrl.g24.outbox-transition-event.r8.v1' }, transition_event_ref: id, outbox_effect_ref: id,
  causal_predecessor_event_ref: id, from_state: { type: 'enum', values: outboxStates }, to_state: { type: 'enum', values: outboxStates },
  event_kind: id, payload_ref: id, recorded_at: ts, event_fingerprint: fp,
}, { append_only: true, unique_keys: [['outbox_effect_ref', 'causal_predecessor_event_ref'], ['transition_event_ref']] })
linkFingerprint(r8.outbox.transition_event_schema, 'fingerprint_schemas.outbox_transition_event', 'event_fingerprint')
r8.fingerprint_schemas.outbox_claim_event = fingerprint('CTRL-G24-OUTBOX-CLAIM-EVENT-R8', ['claim_schema_version', 'claim_ref', 'outbox_effect_ref', 'worker_ref', 'fencing_token', 'lease_issued_at', 'lease_expires_at'])
r8.outbox.claim_event_schema = closed('ctrl.g24.outbox-claim-event.r8.v1', {
  claim_schema_version: { const: 'ctrl.g24.outbox-claim-event.r8.v1' }, claim_ref: id, outbox_effect_ref: id,
  worker_ref: id, fencing_token: pos, lease_issued_at: ts, lease_expires_at: ts, claim_fingerprint: fp,
}, { append_only: true })
linkFingerprint(r8.outbox.claim_event_schema, 'fingerprint_schemas.outbox_claim_event', 'claim_fingerprint')
r8.fingerprint_schemas.outbox_pre_provider_failure_event = fingerprint('CTRL-G24-OUTBOX-PRE-PROVIDER-FAILURE-R8', ['failure_schema_version', 'failure_ref', 'outbox_effect_ref', 'claim_ref', 'fencing_token', 'worker_ref', 'reason_code', 'failed_at'])
r8.outbox.pre_provider_failure_event_schema = closed('ctrl.g24.outbox-pre-provider-failure.r8.v1', {
  failure_schema_version: { const: 'ctrl.g24.outbox-pre-provider-failure.r8.v1' }, failure_ref: id, outbox_effect_ref: id,
  claim_ref: id, fencing_token: pos, worker_ref: id,
  reason_code: { type: 'enum', values: ['authority_revoked', 'payload_changed', 'provider_capability_missing', 'provider_capability_ambiguous'] },
  failed_at: ts, failure_fingerprint: fp,
}, { append_only: true })
linkFingerprint(r8.outbox.pre_provider_failure_event_schema, 'fingerprint_schemas.outbox_pre_provider_failure_event', 'failure_fingerprint')
r8.fingerprint_schemas.outbox_unknown_event = fingerprint('CTRL-G24-OUTBOX-UNKNOWN-EVENT-R8', ['unknown_schema_version', 'unknown_ref', 'outbox_effect_ref', 'ambiguity_evidence_ref', 'attempt_ordinal', 'reason', 'recorded_at'])
r8.outbox.unknown_event_schema = closed('ctrl.g24.outbox-unknown-event.r8.v1', {
  unknown_schema_version: { const: 'ctrl.g24.outbox-unknown-event.r8.v1' }, unknown_ref: id, outbox_effect_ref: id,
  ambiguity_evidence_ref: id, attempt_ordinal: { ...pos, maximum: 3 },
  reason: { type: 'enum', values: ['provider_idempotency_not_current', 'three_reservations_exhausted'] }, recorded_at: ts, unknown_fingerprint: fp,
}, { append_only: true })
linkFingerprint(r8.outbox.unknown_event_schema, 'fingerprint_schemas.outbox_unknown_event', 'unknown_fingerprint')

r8.outbox.dispatch_identity_fields = ['outbox_effect_ref', 'attempt_ordinal', 'dispatch_ref', 'dispatch_fingerprint', 'fencing_token', 'worker_ref', 'provider_ref', 'provider_operation_ref', 'provider_key', 'payload_fingerprint']
r8.outbox.terminal_evidence_binding_predicate = {
  all_dispatch_identity_fields_equal_referenced_dispatch: [...r8.outbox.dispatch_identity_fields],
  dispatch_fingerprint_recomputed_and_equal: true,
  transition_causal_predecessor_equals_dispatch_transition_event_ref: true,
  payload_and_transition_append_in_same_serializable_transaction: true,
  exactly_one_successor_enforced_by_transition_event_unique_key: ['outbox_effect_ref', 'causal_predecessor_event_ref'],
}
r8.outbox.append_transition_transaction = {
  isolation: 'serializable',
  writes: ['exact_event_payload', 'one_outbox_transition_event'],
  atomic: true,
  compare_and_swap: 'unique_outbox_effect_and_causal_predecessor_event_ref',
  conflicting_successor: 'outbox_transition_conflict_hold_without_second_payload_commit',
}
r8.hold_codes = [...new Set([...r8.hold_codes, 'outbox_transition_conflict_hold'])]
r8.outbox.actor_authority = {
  claim: ['workload_enrichment_worker_predicate_and_matches_plan_assignment', 'workload_delivery_worker_predicate'],
  reserve_dispatch_and_record_provider_outcome: ['current_fenced_claim_worker'],
  expire_dispatch_or_ambiguity: ['workload_outbox_lease_reaper_predicate'],
  reconcile_unknown: ['workload_provider_reconciler_predicate'],
}
r8.outbox.transition_table = [
  { from: 'pending', to: 'claimed', event_kind: 'claim', event_schema_ref: 'outbox.claim_event_schema', actor_authority_ref: 'outbox.actor_authority.claim', condition: 'no_live_successor_of_pending_creation_event', provider_call: false },
  { from: 'claimed', to: 'failed', event_kind: 'pre_provider_failure', event_schema_ref: 'outbox.pre_provider_failure_event_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_record_provider_outcome', condition: 'current_claim_fence_worker_and_one_named_pre_provider_failure', provider_call: false },
  { from: 'claimed', to: 'reserved', event_kind: 'attempt_reservation', event_schema_ref: 'outbox.reservation_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_record_provider_outcome', condition: 'current_claim_fence_worker_unexpired_lease_and_next_ordinal_lte_three', provider_call: false },
  { from: 'reserved', to: 'dispatched', event_kind: 'attempt_dispatch', event_schema_ref: 'outbox.dispatch_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_record_provider_outcome', condition: 'reservation_unconsumed_current_claim_fence_worker_and_all_provider_prechecks_pass', provider_call: false },
  { from: 'dispatched', to: 'confirmed', event_kind: 'provider_success', event_schema_ref: 'outbox.provider_success_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_record_provider_outcome', condition: 'exact_dispatch_identity_and_provider_success_evidence', provider_call: 'exactly_one_call_bound_to_dispatch' },
  { from: 'dispatched', to: 'failed', event_kind: 'provider_failure', event_schema_ref: 'outbox.provider_failure_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_record_provider_outcome', condition: 'exact_dispatch_identity_and_definitive_provider_failure_evidence', provider_call: 'exactly_one_call_bound_to_dispatch' },
  { from: 'dispatched', to: 'ambiguous', event_kind: 'worker_ambiguity', event_schema_ref: 'outbox.ambiguity_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_record_provider_outcome', condition: 'exact_dispatch_identity_and_worker_reports_unknown_outcome', provider_call: 'call_may_have_occurred' },
  { from: 'dispatched', to: 'ambiguous', event_kind: 'lease_expiry_ambiguity', event_schema_ref: 'outbox.ambiguity_evidence_schema', actor_authority_ref: 'outbox.actor_authority.expire_dispatch_or_ambiguity', condition: 'server_now_after_dispatch_bound_lease_expiry_and_no_successor_transition_exists', provider_call: false },
  { from: 'ambiguous', to: 'claimed', event_kind: 'retry_claim', event_schema_ref: 'outbox.claim_event_schema', actor_authority_ref: 'outbox.actor_authority.claim', condition: 'current_provider_idempotency_guarantee_exact_retry_identity_and_committed_reservation_count_below_three', provider_call: false },
  { from: 'ambiguous', to: 'unknown', event_kind: 'unknown_terminal', event_schema_ref: 'outbox.unknown_event_schema', actor_authority_ref: 'outbox.actor_authority.expire_dispatch_or_ambiguity', condition: 'no_current_idempotency_guarantee_or_three_reservations_used', provider_call: false },
  { from: 'unknown', to: 'confirmed', event_kind: 'reconciled_success', event_schema_ref: 'outbox.reconciliation_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reconcile_unknown', condition: 'exact_unknown_causal_chain_dispatch_identity_and_provider_evidence', provider_call: false },
  { from: 'unknown', to: 'failed', event_kind: 'reconciled_failure', event_schema_ref: 'outbox.reconciliation_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reconcile_unknown', condition: 'exact_unknown_causal_chain_dispatch_identity_and_provider_evidence', provider_call: false },
]
r8.outbox.claim.eligible_from = ['pending', 'ambiguous']
r8.outbox.claim.writes = ['immutable_claim_event', 'causal_transition_event']
r8.outbox.pre_provider_failure = { transition: 'claimed_to_failed', provider_called: false, event_schema_ref: 'outbox.pre_provider_failure_event_schema' }

// Every materially changed schema advertises R8 rather than a stale inherited version.
bumpSchema(r8.presentation_challenge_schema, 'ctrl.g24.intervention-presentation-challenge.r8.v1', 'challenge_schema_version')
bumpSchema(r8.intervention_visibility_receipt_schema, 'ctrl.g24.intervention-visibility-acknowledgement.r8.v1', 'receipt_schema_version')
r8.operation_specs.issue_intervention_presentation_challenge.schema_version = 'ctrl.g24.operation.issue-intervention-presentation-challenge.r8.v1'
r8.operation_specs.record_intervention_visibility.schema_version = 'ctrl.g24.operation.record-intervention-visibility.r8.v1'
bumpSchema(r8.result_payload_schemas.issue_intervention_presentation_challenge, 'ctrl.g24.result.issue-intervention-presentation-challenge.r8.v1')
bumpSchema(r8.result_payload_schemas.record_intervention_visibility, 'ctrl.g24.result.record-intervention-visibility.r8.v1')
r8.operation_specs.issue_intervention_presentation_challenge.result_schema = r8.result_payload_schemas.issue_intervention_presentation_challenge.schema_version
r8.operation_specs.record_intervention_visibility.result_schema = r8.result_payload_schemas.record_intervention_visibility.schema_version
bumpSchema(r8.result_payload_schemas.use_release, 'ctrl.g24.result.use-release.r8.v1')
bumpSchema(r8.result_payload_schemas.use_release.variants.invalidated_before_use, 'ctrl.g24.result.use-release-invalidated.r8.v1')
bumpSchema(r8.release_invalidation.invalidation_receipt_schema, 'ctrl.g24.release-invalidation.r8.v1', 'receipt_schema_version')
r8.operation_specs.use_release.result_schema = r8.result_payload_schemas.use_release.schema_version
r8.fingerprint_schemas.release_invalidation_receipt = fingerprint('CTRL-G24-RELEASE-INVALIDATION-R8', Object.keys(r8.release_invalidation.invalidation_receipt_schema.properties).filter(key => key !== 'receipt_fingerprint'))
linkFingerprint(r8.release_invalidation.invalidation_receipt_schema, 'fingerprint_schemas.release_invalidation_receipt', 'receipt_fingerprint')
bumpSchema(r8.lifecycle_authority.action_schema, 'ctrl.g24.lifecycle-authority-action.r8.v1', 'action_schema_version')
bumpSchema(r8.lifecycle_authority.joint_receipt_schema, 'ctrl.g24.lifecycle-joint-authority.r8.v1', 'receipt_schema_version')
bumpSchema(r8.lifecycle_authority.action_combination_consumption_schema, 'ctrl.g24.lifecycle-action-combination-consumption.r8.v1', 'consumption_schema_version')
bumpSchema(r8.lifecycle_authority.joint_transition_consumption_schema, 'ctrl.g24.lifecycle-joint-transition-consumption.r8.v1', 'consumption_schema_version')
const outboxSchemasToBump = [
  [r8.outbox.reservation_schema, 'ctrl.g24.outbox-attempt-reservation.r8.v1', 'reservation_schema_version'],
  [r8.outbox.dispatch_schema, 'ctrl.g24.outbox-attempt-dispatch.r8.v1', 'dispatch_schema_version'],
  [r8.outbox.provider_success_evidence_schema, 'ctrl.g24.provider-success-evidence.r8.v1', 'evidence_schema_version'],
  [r8.outbox.provider_failure_evidence_schema, 'ctrl.g24.provider-failure-evidence.r8.v1', 'evidence_schema_version'],
  [r8.outbox.ambiguity_evidence_schema, 'ctrl.g24.provider-ambiguity-evidence.r8.v1', 'evidence_schema_version'],
  [r8.outbox.reconciliation_evidence_schema, 'ctrl.g24.provider-reconciliation-evidence.r8.v1', 'evidence_schema_version'],
]
for (const [schema, version, field] of outboxSchemasToBump) bumpSchema(schema, version, field)
for (const family of Object.keys(proofPlans)) {
  const schema = r8.proof_bundle_schemas.extensions[family]
  bumpSchema(schema, `ctrl.g24.proof.${family.replaceAll('_', '-')}.r8.v1`)
  r8.evaluator_abi.proof_family_exports[family] = schema.schema_version
}
r8.evaluator_abi.operation_result_exports = Object.fromEntries(r8.operation_names.map(name => [name, r8.result_payload_schemas[name].schema_version]))

r8.required_negative_fixture_families = [
  ...r8.required_negative_fixture_families,
  'structural_watermark_identifier_parity', 'evaluator_operation_result_parity',
  'presentation_actor_case_atom_expiry_and_collision', 'single_effect_vocabulary_and_visibility_consumption',
  'lifecycle_stable_secondary_idempotency', 'complete_proof_row_and_seal_resolution',
  'linked_unique_fingerprint_domains_and_complete_preimages', 'causal_outbox_transition_uniqueness',
]
r8.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r8)
export const materializedR8 = r8
export const materializedR8Output = `${JSON.stringify(r8, null, 2)}\n`
export const materializedR8Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR8Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (read(outputPath) !== materializedR8Output) {
      console.error(`${outputPath} is not the exact generator output`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R8 effective contract`)
  } else process.stdout.write(materializedR8Output)
}
