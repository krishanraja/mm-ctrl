import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const r8Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r8.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r9.json'
const r8Bytes = read(r8Path)
const r9 = JSON.parse(r8Bytes)

const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const pos = { type: 'positive_integer' }
const nonneg = { type: 'safe_nonnegative_integer' }
const text = { type: 'human_text' }
const b64 = { type: 'base64url_without_padding' }

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

r9.schema_version = 'ctrl.g24.trusted-ingress.r9.effective.v1'
r9.status = 'eighth_repair_candidate_under_independent_review'
r9.date = '2026-09-13'
r9.supersedes = {
  commit: '87447e58c956bfb0e1ca989bb2f9aa98bbf40426',
  tree: 'f47e5c73bb90983959f05b397a48a58557175418',
  human_blob: '1cba95b21248953a22d2a8e5420ddb64b7c6ca64',
  machine_blob: 'e6f3434d9ee591756be646bc726dd6ee0af56f6e',
  qa_blob: 'd04500077ed8f2337ce36021f9a4d67bdd6e1be6',
  checker_blob: 'a793c1a054d20f2838679a20f0d1d56eaa37c4f0',
  materializer_blob: '196247dd966a896c5cab5b703d82eb5f4ead6ce9',
  adjudication: 'veto',
}
r9.materialization = {
  authority: 'this_complete_generated_effective_document',
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r9.mjs',
  frozen_input: { path: r8Path, sha256: sha256(r8Bytes) },
  conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// Controlling identity includes kind, lineage and version without narrowing control IDs.
const baseWatermark = r9.type_registry.controlling_watermark_member.variants.base
const controlWatermark = r9.type_registry.controlling_watermark_member.variants.applicable_control
baseWatermark.properties.lineage_ref = id
baseWatermark.properties.version_ref = id
baseWatermark.exact_keys = Object.keys(baseWatermark.properties)
baseWatermark.required = [...baseWatermark.exact_keys]
controlWatermark.properties.lineage_ref = id
controlWatermark.properties.version_ref = id
controlWatermark.exact_keys = Object.keys(controlWatermark.properties)
controlWatermark.required = [...controlWatermark.exact_keys]
r9.controlling_watermarks.member_identity = {
  base: ['kind_class', 'base_kind', 'lineage_ref', 'version_ref'],
  applicable_control: ['kind_class', 'control_id', 'lineage_ref', 'version_ref'],
}
r9.proof_set_schemas.controlling_watermarks.identity_projection_by_variant = structuredClone(r9.controlling_watermarks.member_identity)
delete r9.proof_set_schemas.controlling_watermarks.identity_projection

// Closed schemas validate evaluator export maps; live data maps are never treated as schemas.
const operationExports = structuredClone(r9.evaluator_abi.operation_result_exports)
const proofExports = structuredClone(r9.evaluator_abi.proof_family_exports)
r9.evaluator_abi.operation_result_exports_schema = closed('ctrl.g24.evaluator-operation-result-exports.r9.v1', Object.fromEntries(r9.operation_names.map(name => [name, { const: operationExports[name] }])))
r9.evaluator_abi.proof_family_exports_schema = closed('ctrl.g24.evaluator-proof-family-exports.r9.v1', Object.fromEntries(r9.proof_family_names.map(name => [name, { const: proofExports[name] }])))
r9.evaluator_abi.registry_member_schema.properties.operation_result_exports.schema_ref = 'evaluator_abi.operation_result_exports_schema'
r9.evaluator_abi.registry_member_schema.properties.proof_family_exports.schema_ref = 'evaluator_abi.proof_family_exports_schema'
r9.evaluator_abi.operation_export_parity = 'data_map_keys_and_values_equal_closed_operation_export_schema_constants_and_operation_result_schemas'
r9.evaluator_abi.proof_export_parity = 'data_map_keys_and_values_equal_closed_proof_export_schema_constants_and_proof_extension_schemas'

// Visibility retry identity is explicit and checked before the fresh no-prior-ack predicate.
r9.visibility_stable_attestation_projection_schema = closed('ctrl.g24.visibility-stable-attestation-projection.r9.v1', {
  case_ref: id,
  stable_actor_ref: id,
  presentation_challenge_ref: id,
  presentation_challenge_fingerprint: fp,
  foreground_attestation: { const: 'I_acknowledge_that_the_exact_challenge_bound_content_was_foregrounded_to_me' },
  acknowledgement_nonce: id,
  projection_fingerprint: fp,
})
r9.fingerprint_schemas.visibility_stable_attestation_projection = fingerprint(
  'CTRL-G24-VISIBILITY-STABLE-ATTESTATION-PROJECTION-R9',
  Object.keys(r9.visibility_stable_attestation_projection_schema.properties).filter(key => key !== 'projection_fingerprint'),
)
linkFingerprint(r9.visibility_stable_attestation_projection_schema, 'fingerprint_schemas.visibility_stable_attestation_projection', 'projection_fingerprint')
r9.intervention_visibility_receipt_schema.properties.secondary_idempotency_fingerprint = fp
r9.intervention_visibility_receipt_schema.exact_keys = Object.keys(r9.intervention_visibility_receipt_schema.properties)
r9.intervention_visibility_receipt_schema.required = [...r9.intervention_visibility_receipt_schema.exact_keys]
r9.fingerprint_schemas.intervention_visibility_receipt = fingerprint(
  'CTRL-G24-INTERVENTION-VISIBILITY-R9',
  Object.keys(r9.intervention_visibility_receipt_schema.properties).filter(key => key !== 'receipt_fingerprint'),
)
linkFingerprint(r9.intervention_visibility_receipt_schema, 'fingerprint_schemas.intervention_visibility_receipt', 'receipt_fingerprint')
r9.visibility_secondary_idempotency = {
  unique_lookup_key: ['case_ref', 'presentation_challenge_ref'],
  phase_order: [
    'registry_lookup_confirms_new_operation_id',
    'current_operation_authority_passes',
    'server_recomputes_stable_attestation_projection',
    'lookup_existing_visibility_acknowledgement_by_unique_case_and_challenge',
    'if_existing_and_projection_matches_commit_new_registry_success_with_existing_result_bytes',
    'if_existing_and_projection_differs_commit_presentation_acknowledgement_conflict_hold',
    'if_absent_run_fresh_presentation_acknowledgement_predicate',
    'if_fresh_passes_append_acknowledgement_and_commit_registry_success_atomically',
  ],
  fresh_no_prior_ack_check_runs_only_after_existing_collision_branches_miss: true,
  same_projection_creates_new_receipt: false,
  nonce_is_in_stable_projection: true,
}

// Content-bearing proof member schemas.
r9.proof_member_schemas = {
  selector_candidate: closed('ctrl.g24.selector-candidate-member.r9.v1', {
    candidate_ref: id,
    route_id: { type: 'enum', values: ['route_1', 'route_2', 'route_3', 'route_4'] },
    intervention_atom_ref: id,
    burden_fingerprint: fp,
    required_capability_ref: id,
    member_fingerprint: fp,
  }),
  answer_chain_member: closed('ctrl.g24.answer-chain-member.r9.v1', {
    append_ordinal: pos,
    answer_receipt_ref: id,
    answer_receipt_fingerprint: fp,
    predecessor_chain_tip: fp,
    member_fingerprint: fp,
  }),
  answer_dependency_edge: closed('ctrl.g24.answer-dependency-edge.r9.v1', {
    edge_ref: id,
    source_answer_receipt_ref: id,
    source_answer_version_ref: id,
    dependent_record_ref: id,
    dependent_record_version_ref: id,
    relation: { type: 'enum', values: ['supports', 'informs', 'invalidates_if_changed'] },
    edge_fingerprint: fp,
  }),
  lifecycle_precondition: closed('ctrl.g24.lifecycle-precondition-member.r9.v1', {
    precondition_id: id,
    evidence_ref: id,
    evidence_fingerprint: fp,
    evaluator_version_ref: id,
    satisfied_at: ts,
    member_fingerprint: fp,
  }),
}
const memberFingerprintPlans = {
  selector_candidate: ['CTRL-G24-SELECTOR-CANDIDATE-MEMBER-R9', 'member_fingerprint'],
  answer_chain_member: ['CTRL-G24-ANSWER-CHAIN-MEMBER-R9', 'member_fingerprint'],
  answer_dependency_edge: ['CTRL-G24-ANSWER-DEPENDENCY-EDGE-R9', 'edge_fingerprint'],
  lifecycle_precondition: ['CTRL-G24-LIFECYCLE-PRECONDITION-MEMBER-R9', 'member_fingerprint'],
}
r9.proof_member_fingerprint_schemas = {}
for (const [name, [domain, field]] of Object.entries(memberFingerprintPlans)) {
  const schema = r9.proof_member_schemas[name]
  r9.proof_member_fingerprint_schemas[name] = fingerprint(domain, Object.keys(schema.properties).filter(key => key !== field))
  linkFingerprint(schema, `proof_member_fingerprint_schemas.${name}`, field)
}

// Each authoritative row carries actual semantic data, its semantic digest and a distinct row-envelope digest.
const transitionValues = r9.lifecycle_authority.action_schema.properties.transition_id
const commonRow = {
  workspace_ref: id,
  subject_ref: id,
  case_ref: id,
  snapshot_fingerprint: fp,
}
const rowDefinitions = {
  selector_results: {
    identity: 'selector_result_ref', semanticFingerprint: 'selector_result_fingerprint',
    fields: { selector_result_ref: id, selected_route_id: { type: 'enum', values: ['route_1', 'route_2', 'route_3', 'route_4'] }, candidate_set_ref: id, candidate_set_fingerprint: fp, selector_policy_version: id, selector_policy_fingerprint: fp, selector_result_fingerprint: fp },
  },
  selector_candidate_sets: {
    identity: 'candidate_set_ref', semanticFingerprint: 'candidate_set_fingerprint',
    fields: { candidate_set_ref: id, candidate_members: array({ schema_ref: 'proof_member_schemas.selector_candidate' }, { min_items: 4, max_items: 4, unique_by: 'route_id', required_route_values: ['route_1', 'route_2', 'route_3', 'route_4'], ordered_by: 'route_id_declared_order' }), candidate_set_fingerprint: fp },
  },
  selector_policies: {
    identity: 'selector_policy_version', semanticFingerprint: 'selector_policy_fingerprint',
    fields: { selector_policy_version: id, policy_rule_ids: array(id, { min_items: 1, unique: true, ordered_by: 'unsigned_utf8' }), policy_canonical_text: text, selector_policy_fingerprint: fp },
  },
  intervention_approval_receipts: {
    identity: 'approval_receipt_ref', semanticFingerprint: 'approval_receipt_fingerprint',
    fields: { approval_receipt_ref: id, decision: { const: 'approve' }, intervention_atom_ref: id, intervention_atom_version_ref: id, intervention_atom_content_fingerprint: fp, visible_effect_receipt_ref: id, visible_effect_receipt_fingerprint: fp, approver_actor_ref: id, approved_at: ts, approval_receipt_fingerprint: fp },
  },
  intervention_atoms: {
    identity: 'intervention_atom_ref', semanticFingerprint: 'atom_content_fingerprint',
    fields: { intervention_atom_ref: id, atom_version_ref: id, content: text, atom_content_fingerprint: fp },
  },
  intervention_visibility_acknowledgements: {
    identity: 'receipt_ref', semanticFingerprint: 'receipt_fingerprint',
    fields: { receipt_ref: id, presentation_challenge_ref: id, presentation_challenge_fingerprint: fp, operator_ref: id, intervention_atom_ref: id, atom_version_ref: id, atom_content_fingerprint: fp, acknowledgement_nonce: id, foreground_attestation: { const: 'I_acknowledge_that_the_exact_challenge_bound_content_was_foregrounded_to_me' }, secondary_idempotency_fingerprint: fp, acknowledged_at: ts, receipt_fingerprint: fp },
  },
  answer_receipts: {
    identity: 'answer_receipt_ref', semanticFingerprint: 'answer_receipt_fingerprint',
    fields: { answer_receipt_ref: id, answer_version_ref: id, answer_kind: { schema_ref: 'shared_schemas.answer_kind' }, answer_value: { schema_ref: 'shared_schemas.answer_value_rules' }, leader_authority_ref: id, leader_authority_fingerprint: fp, visible_effect_receipt_ref: id, visible_effect_receipt_fingerprint: fp, answer_receipt_fingerprint: fp },
  },
  leader_authority_receipts: {
    identity: 'leader_authority_ref', semanticFingerprint: 'leader_authority_fingerprint',
    fields: { leader_authority_ref: id, named_leader_ref: id, authority_version: id, authority_scope: { const: 'answer_for_exact_intervention' }, intervention_atom_ref: id, issued_at: ts, leader_authority_fingerprint: fp },
  },
  answer_visibility_acknowledgements: {
    identity: 'receipt_ref', semanticFingerprint: 'receipt_fingerprint',
    fields: { receipt_ref: id, named_leader_ref: id, intervention_atom_ref: id, intervention_atom_version_ref: id, answer_surface_fingerprint: fp, acknowledged_at: ts, receipt_fingerprint: fp },
  },
  correction_receipts: {
    identity: 'correction_receipt_ref', semanticFingerprint: 'correction_receipt_fingerprint',
    fields: { correction_receipt_ref: id, original_answer_receipt_ref: id, replacement_answer_receipt_ref: id, reason_ref: id, answer_chain_tip: fp, dependency_graph_seal: fp, corrected_at: ts, correction_receipt_fingerprint: fp },
  },
  lifecycle_transition_receipts: {
    identity: 'transition_receipt_ref', semanticFingerprint: 'transition_receipt_fingerprint',
    fields: { transition_receipt_ref: id, transition_id: structuredClone(transitionValues), from_state: { type: 'enum', values: ['preparing', 'intensive_proof', 'continuing', 'paused', 'closing', 'closed'] }, to_state: { type: 'enum', values: ['preparing', 'intensive_proof', 'continuing', 'paused', 'closing', 'closed'] }, lifecycle_snapshot_ref: id, lifecycle_snapshot_fingerprint: fp, authority_receipt_ref: id, authority_receipt_fingerprint: fp, precondition_set_seal: fp, transitioned_at: ts, transition_receipt_fingerprint: fp },
  },
  lifecycle_snapshots: {
    identity: 'lifecycle_snapshot_ref', semanticFingerprint: 'lifecycle_snapshot_fingerprint',
    fields: { lifecycle_snapshot_ref: id, lifecycle_version_ref: id, predecessor_lifecycle_version_ref: id, state: { type: 'enum', values: ['preparing', 'intensive_proof', 'continuing', 'paused', 'closing', 'closed'] }, lifecycle_snapshot_fingerprint: fp },
  },
  lifecycle_authority_receipts: {
    identity: 'authority_receipt_ref', semanticFingerprint: 'authority_receipt_fingerprint',
    fields: { authority_receipt_ref: id, authority_kind: { type: 'enum', values: ['single_human', 'joint_human'] }, transition_id: structuredClone(transitionValues), predecessor_lifecycle_version_ref: id, named_leader_ref: id, operator_ref: id, issued_at: ts, expires_at: ts, authority_receipt_fingerprint: fp },
  },
  pending_release_projections: {
    identity: 'pending_projection_ref', semanticFingerprint: 'pending_projection_fingerprint',
    fields: { pending_projection_ref: id, projection_version_ref: id, projection_schema_version: id, projection_payload_b64url: b64, projection_payload_byte_length: nonneg, release_authority_receipt_ref: id, release_authority_receipt_fingerprint: fp, controlling_watermark_set_fingerprint: fp, pending_projection_fingerprint: fp },
  },
  release_authority_receipts: {
    identity: 'release_authority_receipt_ref', semanticFingerprint: 'release_authority_receipt_fingerprint',
    fields: { release_authority_receipt_ref: id, pending_projection_ref: id, projection_version_ref: id, approver_actor_ref: id, approval_receipt_ref: id, issued_at: ts, release_authority_receipt_fingerprint: fp },
  },
  enrichment_plans: {
    identity: 'plan_ref', semanticFingerprint: 'plan_fingerprint',
    fields: { plan_ref: id, plan_version_ref: id, question_ref: id, source_kind_ids: array(id, { min_items: 1, unique: true, ordered_by: 'unsigned_utf8' }), budget_policy_ref: id, budget_policy_fingerprint: fp, terminal_state_ref: id, terminal_state_fingerprint: fp, plan_fingerprint: fp },
  },
  enrichment_budget_policies: {
    identity: 'budget_policy_ref', semanticFingerprint: 'budget_policy_fingerprint',
    fields: { budget_policy_ref: id, maximum_attempts: pos, maximum_sources: pos, deadline_at: ts, budget_policy_fingerprint: fp },
  },
  enrichment_terminal_states: {
    identity: 'terminal_state_ref', semanticFingerprint: 'terminal_state_fingerprint',
    fields: { terminal_state_ref: id, terminal_state: { type: 'enum', values: ['open', 'proposed_evidence', 'failed_held', 'slow_held', 'stale_rejected', 'attempt_budget_held'] }, reason_ref: id, recorded_at: ts, terminal_state_fingerprint: fp },
  },
  enrichment_execution_receipts: {
    identity: 'execution_receipt_ref', semanticFingerprint: 'execution_receipt_fingerprint',
    fields: { execution_receipt_ref: id, plan_ref: id, attempt_ordinal: pos, observed_source_refs: array(id, { unique: true, ordered_by: 'unsigned_utf8' }), terminal_state_ref: id, terminal_state_fingerprint: fp, executed_at: ts, execution_receipt_fingerprint: fp },
  },
}

r9.authoritative_row_schemas = {}
r9.authoritative_semantic_fingerprint_schemas = {}
r9.authoritative_row_fingerprint_schemas = {}
for (const [table, definition] of Object.entries(rowDefinitions)) {
  const schema = closed(`ctrl.g24.authoritative-row.${table.replaceAll('_', '-')}.r9.v1`, {
    ...commonRow,
    ...definition.fields,
    row_version_ref: id,
    valid_from: ts,
    valid_until: ts,
    row_envelope_fingerprint: fp,
  }, {
    optional: ['valid_until'],
    append_only: true,
    partition_key: ['workspace_ref', 'subject_ref', 'case_ref', definition.identity],
    current_selection: 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_evaluated_at_and_valid_until_absent_or_gt_evaluated_at',
    current_selection_unique_or_hold: true,
    semantic_fingerprint_field: definition.semanticFingerprint,
    semantic_fingerprint_ref: `authoritative_semantic_fingerprint_schemas.${table}`,
    semantic_fingerprint_must_equal_referenced_preimage_digest: true,
  })
  linkFingerprint(schema, `authoritative_row_fingerprint_schemas.${table}`, 'row_envelope_fingerprint')
  r9.authoritative_row_schemas[table] = schema
  r9.authoritative_semantic_fingerprint_schemas[table] = fingerprint(
    `CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R9`,
    Object.keys(definition.fields).filter(key => key !== definition.semanticFingerprint),
  )
  r9.authoritative_row_fingerprint_schemas[table] = fingerprint(
    `CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R9`,
    Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'),
  )
}

const proofPlans = {
  selector_result: {
    owner: ['selector_results', 'selector_result_ref', 'selector_result_fingerprint'],
    rows: [
      ['selector_candidate_sets', [['candidate_set_ref', 'candidate_set_ref'], ['candidate_set_fingerprint', 'candidate_set_fingerprint']]],
      ['selector_policies', [['selector_policy_version', 'selector_policy_version'], ['selector_policy_fingerprint', 'selector_policy_fingerprint']]],
    ], seals: [],
  },
  intervention_approval: {
    owner: ['intervention_approval_receipts', 'approval_receipt_ref', 'approval_receipt_fingerprint'],
    rows: [
      ['intervention_atoms', [['intervention_atom_ref', 'intervention_atom_ref'], ['intervention_atom_version_ref', 'atom_version_ref'], ['intervention_atom_content_fingerprint', 'atom_content_fingerprint']]],
      ['intervention_visibility_acknowledgements', [['visible_effect_receipt_ref', 'receipt_ref'], ['visible_effect_receipt_fingerprint', 'receipt_fingerprint']]],
    ], seals: [],
  },
  answer: {
    owner: ['answer_receipts', 'answer_receipt_ref', 'answer_receipt_fingerprint'],
    rows: [
      ['leader_authority_receipts', [['leader_authority_ref', 'leader_authority_ref'], ['leader_authority_fingerprint', 'leader_authority_fingerprint']]],
      ['answer_visibility_acknowledgements', [['visible_effect_receipt_ref', 'receipt_ref'], ['visible_effect_receipt_fingerprint', 'receipt_fingerprint']]],
    ], seals: [],
  },
  correction: {
    owner: ['correction_receipts', 'correction_receipt_ref', 'correction_receipt_fingerprint'], rows: [],
    seals: [['answer_chain_tip', 'answer_chain'], ['dependency_graph_seal', 'answer_dependency_graph']],
  },
  lifecycle: {
    owner: ['lifecycle_transition_receipts', 'transition_receipt_ref', 'transition_receipt_fingerprint'],
    rows: [
      ['lifecycle_snapshots', [['lifecycle_snapshot_ref', 'lifecycle_snapshot_ref'], ['lifecycle_snapshot_fingerprint', 'lifecycle_snapshot_fingerprint']]],
      ['lifecycle_authority_receipts', [['authority_receipt_ref', 'authority_receipt_ref'], ['authority_receipt_fingerprint', 'authority_receipt_fingerprint']]],
    ], seals: [['precondition_set_seal', 'lifecycle_preconditions']],
  },
  pending_release_and_authority: {
    owner: ['pending_release_projections', 'pending_projection_ref', 'pending_projection_fingerprint'],
    rows: [['release_authority_receipts', [['release_authority_receipt_ref', 'release_authority_receipt_ref'], ['release_authority_receipt_fingerprint', 'release_authority_receipt_fingerprint']]]],
    seals: [['controlling_watermark_set_fingerprint', 'controlling_watermarks']],
  },
  enrichment_plan: {
    owner: ['enrichment_plans', 'plan_ref', 'plan_fingerprint'],
    rows: [
      ['enrichment_budget_policies', [['budget_policy_ref', 'budget_policy_ref'], ['budget_policy_fingerprint', 'budget_policy_fingerprint']]],
      ['enrichment_terminal_states', [['terminal_state_ref', 'terminal_state_ref'], ['terminal_state_fingerprint', 'terminal_state_fingerprint']]],
    ], seals: [],
  },
  execution_receipt: {
    owner: ['enrichment_execution_receipts', 'execution_receipt_ref', 'execution_receipt_fingerprint'],
    rows: [['enrichment_terminal_states', [['terminal_state_ref', 'terminal_state_ref'], ['terminal_state_fingerprint', 'terminal_state_fingerprint']]]],
    seals: [],
  },
}

r9.proof_set_schemas = {
  answer_chain: {
    set_kind: 'answer_chain', member_schema_ref: 'proof_member_schemas.answer_chain_member',
    identity_projection: ['append_ordinal', 'answer_receipt_ref'], ordering: 'append_ordinal_ascending',
    completeness: 'ordinal_one_through_tip_without_gap_and_each_predecessor_chain_tip_equals_prior_complete_prefix_fingerprint',
    fingerprint_ref: 'set_seal_encoding',
  },
  answer_dependency_graph: {
    set_kind: 'answer_dependency_graph', member_schema_ref: 'proof_member_schemas.answer_dependency_edge',
    identity_projection: ['edge_ref'], ordering: 'unsigned_utf8_edge_ref',
    completeness: 'all_current_edges_reachable_from_the_corrected_answer_with_no_dangling_version',
    fingerprint_ref: 'set_seal_encoding',
  },
  lifecycle_preconditions: {
    set_kind: 'lifecycle_preconditions', member_schema_ref: 'proof_member_schemas.lifecycle_precondition',
    identity_projection: ['precondition_id'], ordering: 'unsigned_utf8_precondition_id',
    completeness: 'exact_required_precondition_ids_for_transition_each_once_and_all_evidence_fingerprints_recomputed',
    fingerprint_ref: 'set_seal_encoding',
  },
  controlling_watermarks: {
    set_kind: 'controlling_watermarks', member_schema_ref: 'type_registry.controlling_watermark_member',
    identity_projection_by_variant: structuredClone(r9.controlling_watermarks.member_identity),
    ordering: 'controlling_watermarks.canonical_order',
    completeness: 'all_base_and_current_applicable_control_members_exactly_once_with_current_lineage_and_version',
    fingerprint_ref: 'controlling_watermarks.set_fingerprint',
  },
}

r9.proof_authority.proof_family_resolution_map = Object.fromEntries(Object.entries(proofPlans).map(([family, plan]) => {
  const extension = r9.proof_bundle_schemas.extensions[family]
  const [ownerTable, ownerRef, ownerFingerprint] = plan.owner
  const coveredByDependencies = new Set(plan.rows.flatMap(([, pairs]) => pairs.map(([extensionField]) => extensionField)))
  const coveredBySeals = new Set(plan.seals.map(([extensionField]) => extensionField))
  const embedded = Object.keys(extension.properties)
    .filter(field => field !== ownerRef && field !== ownerFingerprint && !coveredByDependencies.has(field) && !coveredBySeals.has(field) && Object.hasOwn(rowDefinitions[ownerTable].fields, field))
    .map(field => ({ extension_field: field, owner_row_field: field }))
  return [family, {
    canonical_owner: {
      table: ownerTable,
      schema_ref: `authoritative_row_schemas.${ownerTable}`,
      row_ref_field: ownerRef,
      row_fingerprint_field: ownerFingerprint,
      common_ref_equals_extension_field: ownerRef,
      common_fingerprint_equals_extension_field: ownerFingerprint,
      embedded_extension_equalities: embedded,
      current_rule: 'family_schema_current_selection',
      failure: 'proof_schema_hold',
    },
    extension_rows: plan.rows.map(([table, pairs]) => ({
      table,
      schema_ref: `authoritative_row_schemas.${table}`,
      field_equalities: pairs.map(([extensionField, rowField]) => ({ extension_field: extensionField, row_field: rowField })),
      owner_join_equalities: pairs.map(([extensionField, rowField]) => ({ owner_row_field: extensionField, dependency_row_field: rowField })),
      scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
      current_rule: 'family_schema_current_selection',
      failure: 'proof_schema_hold',
    })),
    extension_seals: plan.seals.map(([extensionField, setName]) => ({
      extension_field: extensionField,
      owner_row_field: extensionField,
      set_schema_ref: `proof_set_schemas.${setName}`,
      equality: 'extension_and_owner_field_equal_recomputed_complete_set_fingerprint',
      failure: 'proof_schema_hold',
    })),
  }]
}))
r9.proof_authority.row_splicing_prevention = 'every_dependency_extension_value_equals_both_the_owner_join_field_and_the_dependency_row_field_in_the_same_snapshot'
r9.proof_authority.semantic_reconstruction = 'all_semantic_fingerprints_are_recomputed_from_content_bearing_fields_or_complete_typed_set_members_before_row_envelope_fingerprints_are_accepted'
r9.proof_authority.every_extension_reference_fingerprint_and_seal_must_resolve_without_row_splicing = true

// The durable outbox separates "committed intent", "safe to invoke" and "may have invoked".
// A provider call is possible only after an invocation-start event has committed, so a crash
// before that event is safely retryable and a crash after it is never silently retried.
const outboxStates = ['pending', 'claimed', 'reserved', 'dispatched', 'invoking', 'abandoned_not_invoked', 'ambiguous', 'unknown', 'confirmed', 'failed']
const eventKinds = [
  'claim', 'pre_provider_failure', 'attempt_reservation', 'attempt_dispatch',
  'provider_invocation_start', 'abandon_without_invocation', 'retry_after_no_invocation',
  'provider_success', 'provider_failure', 'worker_ambiguity', 'lease_expiry_ambiguity',
  'retry_claim', 'unknown_terminal', 'reconciled_success', 'reconciled_failure',
]

r9.outbox.effect_schema = closed('ctrl.g24.outbox-effect.r9.v1', {
  effect_schema_version: { const: 'ctrl.g24.outbox-effect.r9.v1' },
  outbox_effect_ref: id,
  case_ref: id,
  effect_kind: { type: 'enum', values: ['enrichment_query', 'customer_delivery'] },
  provider_ref: id,
  provider_operation_ref: id,
  provider_key: id,
  payload_schema_version: id,
  payload_b64url: b64,
  payload_byte_length: nonneg,
  payload_fingerprint: fp,
  created_at: ts,
  creation_event_ref: id,
  effect_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['outbox_effect_ref'], ['provider_ref', 'provider_operation_ref', 'provider_key']],
})
r9.fingerprint_schemas.outbox_effect = fingerprint('CTRL-G24-OUTBOX-EFFECT-R9', Object.keys(r9.outbox.effect_schema.properties).filter(key => key !== 'effect_fingerprint'))
linkFingerprint(r9.outbox.effect_schema, 'fingerprint_schemas.outbox_effect', 'effect_fingerprint')

r9.outbox.creation_event_schema = closed('ctrl.g24.outbox-creation-event.r9.v1', {
  creation_schema_version: { const: 'ctrl.g24.outbox-creation-event.r9.v1' },
  creation_event_ref: id,
  outbox_effect_ref: id,
  effect_fingerprint: fp,
  state: { const: 'pending' },
  created_at: ts,
  creation_event_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['creation_event_ref'], ['outbox_effect_ref']],
})
r9.fingerprint_schemas.outbox_creation_event = fingerprint('CTRL-G24-OUTBOX-CREATION-EVENT-R9', Object.keys(r9.outbox.creation_event_schema.properties).filter(key => key !== 'creation_event_fingerprint'))
linkFingerprint(r9.outbox.creation_event_schema, 'fingerprint_schemas.outbox_creation_event', 'creation_event_fingerprint')

const dispatchIdentityFields = [
  'outbox_effect_ref', 'attempt_ordinal', 'dispatch_ref', 'dispatch_fingerprint',
  'fencing_token', 'worker_ref', 'provider_ref', 'provider_operation_ref',
  'provider_key', 'payload_fingerprint',
]
r9.outbox.dispatch_identity_fields = dispatchIdentityFields
r9.outbox.invocation_event_schema = closed('ctrl.g24.provider-invocation-start.r9.v1', {
  invocation_schema_version: { const: 'ctrl.g24.provider-invocation-start.r9.v1' },
  invocation_event_ref: id,
  outbox_effect_ref: id,
  attempt_ordinal: { ...pos, maximum: 3 },
  dispatch_ref: id,
  dispatch_fingerprint: fp,
  fencing_token: pos,
  worker_ref: id,
  provider_ref: id,
  provider_operation_ref: id,
  provider_key: id,
  payload_fingerprint: fp,
  invocation_started_at: ts,
  invocation_event_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['invocation_event_ref'], ['dispatch_ref']],
})
r9.fingerprint_schemas.provider_invocation_start = fingerprint('CTRL-G24-PROVIDER-INVOCATION-START-R9', Object.keys(r9.outbox.invocation_event_schema.properties).filter(key => key !== 'invocation_event_fingerprint'))
linkFingerprint(r9.outbox.invocation_event_schema, 'fingerprint_schemas.provider_invocation_start', 'invocation_event_fingerprint')

r9.outbox.abandon_without_invocation_schema = closed('ctrl.g24.outbox-abandon-without-invocation.r9.v1', {
  abandonment_schema_version: { const: 'ctrl.g24.outbox-abandon-without-invocation.r9.v1' },
  abandonment_ref: id,
  outbox_effect_ref: id,
  dispatch_ref: id,
  dispatch_fingerprint: fp,
  reason: { type: 'enum', values: ['dispatch_lease_expired_without_invocation_event', 'worker_released_before_invocation'] },
  abandoned_at: ts,
  abandonment_fingerprint: fp,
}, { append_only: true, unique_keys: [['abandonment_ref'], ['dispatch_ref']] })
r9.fingerprint_schemas.outbox_abandon_without_invocation = fingerprint('CTRL-G24-OUTBOX-ABANDON-WITHOUT-INVOCATION-R9', Object.keys(r9.outbox.abandon_without_invocation_schema.properties).filter(key => key !== 'abandonment_fingerprint'))
linkFingerprint(r9.outbox.abandon_without_invocation_schema, 'fingerprint_schemas.outbox_abandon_without_invocation', 'abandonment_fingerprint')

// Retain the established payload schemas, but move every materially changed one to R9.
const bumpSchema = (schema, version, versionField = 'schema_version') => {
  schema.schema_version = version
  if (schema.properties?.[versionField]) schema.properties[versionField] = { const: version }
}

// Visibility receipt structure changed in R9 and must not advertise an inherited R8 version.
bumpSchema(r9.intervention_visibility_receipt_schema, 'ctrl.g24.intervention-visibility-acknowledgement.r9.v1', 'receipt_schema_version')
bumpSchema(r9.result_payload_schemas.record_intervention_visibility, 'ctrl.g24.result.record-intervention-visibility.r9.v1')
r9.operation_specs.record_intervention_visibility.schema_version = 'ctrl.g24.operation.record-intervention-visibility.r9.v1'

// Provider outcomes are evidence about the exact committed invocation, not merely its dispatch.
for (const schema of [
  r9.outbox.provider_success_evidence_schema,
  r9.outbox.provider_failure_evidence_schema,
  r9.outbox.ambiguity_evidence_schema,
  r9.outbox.reconciliation_evidence_schema,
]) {
  schema.properties.invocation_event_ref = id
  schema.properties.invocation_event_fingerprint = fp
  schema.exact_keys = Object.keys(schema.properties)
  schema.required = [...schema.exact_keys]
}
const outboxSchemasToBump = [
  [r9.outbox.reservation_schema, 'ctrl.g24.outbox-attempt-reservation.r9.v1', 'reservation_schema_version'],
  [r9.outbox.dispatch_schema, 'ctrl.g24.outbox-attempt-dispatch.r9.v1', 'dispatch_schema_version'],
  [r9.outbox.provider_success_evidence_schema, 'ctrl.g24.provider-success-evidence.r9.v1', 'evidence_schema_version'],
  [r9.outbox.provider_failure_evidence_schema, 'ctrl.g24.provider-failure-evidence.r9.v1', 'evidence_schema_version'],
  [r9.outbox.ambiguity_evidence_schema, 'ctrl.g24.provider-ambiguity-evidence.r9.v1', 'evidence_schema_version'],
  [r9.outbox.reconciliation_evidence_schema, 'ctrl.g24.provider-reconciliation-evidence.r9.v1', 'evidence_schema_version'],
]
for (const [schema, version, field] of outboxSchemasToBump) bumpSchema(schema, version, field)

bumpSchema(r9.outbox.claim_event_schema, 'ctrl.g24.outbox-claim-event.r9.v1', 'claim_schema_version')
bumpSchema(r9.outbox.pre_provider_failure_event_schema, 'ctrl.g24.outbox-pre-provider-failure.r9.v1', 'failure_schema_version')
bumpSchema(r9.outbox.unknown_event_schema, 'ctrl.g24.outbox-unknown-event.r9.v1', 'unknown_schema_version')
r9.fingerprint_schemas.outbox_claim_event = fingerprint('CTRL-G24-OUTBOX-CLAIM-EVENT-R9', Object.keys(r9.outbox.claim_event_schema.properties).filter(key => key !== 'claim_fingerprint'))
r9.fingerprint_schemas.outbox_pre_provider_failure_event = fingerprint('CTRL-G24-OUTBOX-PRE-PROVIDER-FAILURE-R9', Object.keys(r9.outbox.pre_provider_failure_event_schema.properties).filter(key => key !== 'failure_fingerprint'))
r9.fingerprint_schemas.outbox_unknown_event = fingerprint('CTRL-G24-OUTBOX-UNKNOWN-EVENT-R9', Object.keys(r9.outbox.unknown_event_schema.properties).filter(key => key !== 'unknown_fingerprint'))
r9.fingerprint_schemas.outbox_attempt_reservation = fingerprint('CTRL-G24-OUTBOX-ATTEMPT-RESERVATION-R9', Object.keys(r9.outbox.reservation_schema.properties).filter(key => key !== 'reservation_fingerprint'))
r9.fingerprint_schemas.outbox_attempt_dispatch = fingerprint('CTRL-G24-OUTBOX-ATTEMPT-DISPATCH-R9', Object.keys(r9.outbox.dispatch_schema.properties).filter(key => key !== 'dispatch_fingerprint'))
r9.fingerprint_schemas.provider_success_evidence = fingerprint('CTRL-G24-PROVIDER-SUCCESS-EVIDENCE-R9', Object.keys(r9.outbox.provider_success_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
r9.fingerprint_schemas.provider_failure_evidence = fingerprint('CTRL-G24-PROVIDER-FAILURE-EVIDENCE-R9', Object.keys(r9.outbox.provider_failure_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
r9.fingerprint_schemas.provider_ambiguity_evidence = fingerprint('CTRL-G24-PROVIDER-AMBIGUITY-EVIDENCE-R9', Object.keys(r9.outbox.ambiguity_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
r9.fingerprint_schemas.provider_reconciliation_evidence = fingerprint('CTRL-G24-PROVIDER-RECONCILIATION-EVIDENCE-R9', Object.keys(r9.outbox.reconciliation_evidence_schema.properties).filter(key => key !== 'evidence_fingerprint'))
linkFingerprint(r9.outbox.reservation_schema, 'fingerprint_schemas.outbox_attempt_reservation', 'reservation_fingerprint')
linkFingerprint(r9.outbox.dispatch_schema, 'fingerprint_schemas.outbox_attempt_dispatch', 'dispatch_fingerprint')
linkFingerprint(r9.outbox.provider_success_evidence_schema, 'fingerprint_schemas.provider_success_evidence', 'evidence_fingerprint')
linkFingerprint(r9.outbox.provider_failure_evidence_schema, 'fingerprint_schemas.provider_failure_evidence', 'evidence_fingerprint')
linkFingerprint(r9.outbox.ambiguity_evidence_schema, 'fingerprint_schemas.provider_ambiguity_evidence', 'evidence_fingerprint')
linkFingerprint(r9.outbox.reconciliation_evidence_schema, 'fingerprint_schemas.provider_reconciliation_evidence', 'evidence_fingerprint')
linkFingerprint(r9.outbox.claim_event_schema, 'fingerprint_schemas.outbox_claim_event', 'claim_fingerprint')
linkFingerprint(r9.outbox.pre_provider_failure_event_schema, 'fingerprint_schemas.outbox_pre_provider_failure_event', 'failure_fingerprint')
linkFingerprint(r9.outbox.unknown_event_schema, 'fingerprint_schemas.outbox_unknown_event', 'unknown_fingerprint')

// Every state transition names an exact payload schema and binds its payload digest.
const payloadBinding = {
  claim: ['outbox.claim_event_schema', 'claim_ref', 'claim_fingerprint'],
  pre_provider_failure: ['outbox.pre_provider_failure_event_schema', 'failure_ref', 'failure_fingerprint'],
  attempt_reservation: ['outbox.reservation_schema', 'reservation_ref', 'reservation_fingerprint'],
  attempt_dispatch: ['outbox.dispatch_schema', 'dispatch_ref', 'dispatch_fingerprint'],
  provider_invocation_start: ['outbox.invocation_event_schema', 'invocation_event_ref', 'invocation_event_fingerprint'],
  abandon_without_invocation: ['outbox.abandon_without_invocation_schema', 'abandonment_ref', 'abandonment_fingerprint'],
  retry_after_no_invocation: ['outbox.claim_event_schema', 'claim_ref', 'claim_fingerprint'],
  provider_success: ['outbox.provider_success_evidence_schema', 'evidence_ref', 'evidence_fingerprint'],
  provider_failure: ['outbox.provider_failure_evidence_schema', 'evidence_ref', 'evidence_fingerprint'],
  worker_ambiguity: ['outbox.ambiguity_evidence_schema', 'evidence_ref', 'evidence_fingerprint'],
  lease_expiry_ambiguity: ['outbox.ambiguity_evidence_schema', 'evidence_ref', 'evidence_fingerprint'],
  retry_claim: ['outbox.claim_event_schema', 'claim_ref', 'claim_fingerprint'],
  unknown_terminal: ['outbox.unknown_event_schema', 'unknown_ref', 'unknown_fingerprint'],
  reconciled_success: ['outbox.reconciliation_evidence_schema', 'evidence_ref', 'evidence_fingerprint'],
  reconciled_failure: ['outbox.reconciliation_evidence_schema', 'evidence_ref', 'evidence_fingerprint'],
}
r9.outbox.payload_binding_map = Object.fromEntries(Object.entries(payloadBinding).map(([kind, [schemaRef, refField, fingerprintField]]) => [kind, {
  payload_schema_ref: schemaRef,
  payload_ref_field: refField,
  payload_fingerprint_field: fingerprintField,
}]))

r9.fingerprint_schemas.outbox_transition_event = fingerprint('CTRL-G24-OUTBOX-TRANSITION-EVENT-R9', [
  'event_schema_version', 'transition_event_ref', 'outbox_effect_ref',
  'causal_predecessor_event_ref', 'causal_predecessor_event_fingerprint',
  'from_state', 'to_state', 'event_kind', 'payload_schema_version',
  'payload_ref', 'payload_fingerprint', 'recorded_at',
])
r9.outbox.transition_event_schema = closed('ctrl.g24.outbox-transition-event.r9.v1', {
  event_schema_version: { const: 'ctrl.g24.outbox-transition-event.r9.v1' },
  transition_event_ref: id,
  outbox_effect_ref: id,
  causal_predecessor_event_ref: id,
  causal_predecessor_event_fingerprint: fp,
  from_state: { type: 'enum', values: outboxStates },
  to_state: { type: 'enum', values: outboxStates },
  event_kind: { type: 'enum', values: eventKinds },
  payload_schema_version: id,
  payload_ref: id,
  payload_fingerprint: fp,
  recorded_at: ts,
  event_fingerprint: fp,
}, {
  append_only: true,
  unique_keys: [['outbox_effect_ref', 'causal_predecessor_event_ref'], ['transition_event_ref']],
})
linkFingerprint(r9.outbox.transition_event_schema, 'fingerprint_schemas.outbox_transition_event', 'event_fingerprint')

r9.outbox.genesis_protocol = {
  transaction_isolation: 'serializable',
  atomic_writes: ['one_outbox_effect', 'one_outbox_creation_event'],
  effect_creation_event_ref_equals_creation_event_creation_event_ref: true,
  creation_event_effect_ref_and_fingerprint_equal_recomputed_effect: true,
  creation_event_is_unique_initial_tip_for_effect: true,
  no_transition_may_reference_pending_without_verified_creation_event: true,
}
r9.outbox.append_transition_transaction = {
  isolation: 'serializable',
  writes: ['one_exact_payload_row', 'one_outbox_transition_event'],
  atomic: true,
  admission_predicate: [
    'referenced_predecessor_exists_and_belongs_to_exact_effect',
    'predecessor_fingerprint_recomputes_and_equals_causal_predecessor_event_fingerprint',
    'predecessor_is_the_unique_current_tip_for_effect',
    'from_state_equals_predecessor_to_state_or_verified_creation_event_pending_state',
    'event_kind_maps_to_exact_payload_schema_ref',
    'payload_schema_version_equals_resolved_payload_schema_version',
    'payload_ref_and_fingerprint_equal_the_committed_payload_row',
    'payload_fingerprint_recomputes_under_the_resolved_payload_schema',
    'from_state_to_state_event_kind_schema_and_actor_match_exact_transition_table_row',
    'transition_specific_condition_passes',
  ],
  compare_and_swap: 'unique_outbox_effect_and_causal_predecessor_event_ref',
  conflicting_successor: 'outbox_transition_conflict_hold_without_second_payload_commit',
}
r9.hold_codes = [...new Set([...r9.hold_codes, 'outbox_transition_conflict_hold', 'outbox_payload_binding_hold', 'outbox_invocation_ambiguity_hold'])]

r9.outbox.actor_authority = {
  claim: ['workload_enrichment_worker_predicate_and_matches_plan_assignment', 'workload_delivery_worker_predicate'],
  reserve_dispatch_and_start_invocation_and_record_provider_outcome: ['current_fenced_claim_worker'],
  expire_without_invocation_or_mark_ambiguity: ['workload_outbox_lease_reaper_predicate'],
  reconcile_unknown: ['workload_provider_reconciler_predicate'],
}
r9.outbox.transition_table = [
  { from: 'pending', to: 'claimed', event_kind: 'claim', event_schema_ref: 'outbox.claim_event_schema', actor_authority_ref: 'outbox.actor_authority.claim', condition: 'verified_creation_event_is_current_tip', provider_call: false },
  { from: 'claimed', to: 'failed', event_kind: 'pre_provider_failure', event_schema_ref: 'outbox.pre_provider_failure_event_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'current_claim_fence_worker_and_one_named_pre_provider_failure', provider_call: false },
  { from: 'claimed', to: 'reserved', event_kind: 'attempt_reservation', event_schema_ref: 'outbox.reservation_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'current_claim_fence_worker_unexpired_lease_and_next_ordinal_lte_three', provider_call: false },
  { from: 'reserved', to: 'dispatched', event_kind: 'attempt_dispatch', event_schema_ref: 'outbox.dispatch_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'reservation_unconsumed_current_claim_fence_worker_and_all_provider_prechecks_pass', provider_call: false },
  { from: 'dispatched', to: 'invoking', event_kind: 'provider_invocation_start', event_schema_ref: 'outbox.invocation_event_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'current_dispatch_identity_matches_and_single_use_invocation_capability_is_minted_only_after_commit', provider_call: false },
  { from: 'dispatched', to: 'abandoned_not_invoked', event_kind: 'abandon_without_invocation', event_schema_ref: 'outbox.abandon_without_invocation_schema', actor_authority_ref: 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity', condition: 'dispatch_lease_expired_and_no_invocation_event_or_other_successor_exists', provider_call: false },
  { from: 'abandoned_not_invoked', to: 'claimed', event_kind: 'retry_after_no_invocation', event_schema_ref: 'outbox.claim_event_schema', actor_authority_ref: 'outbox.actor_authority.claim', condition: 'abandonment_proves_no_invocation_event_and_committed_reservation_count_below_three', provider_call: false },
  { from: 'invoking', to: 'confirmed', event_kind: 'provider_success', event_schema_ref: 'outbox.provider_success_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'exact_invocation_and_dispatch_identity_and_provider_success_evidence', provider_call: 'already_authorized_by_single_use_capability' },
  { from: 'invoking', to: 'failed', event_kind: 'provider_failure', event_schema_ref: 'outbox.provider_failure_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'exact_invocation_and_dispatch_identity_and_definitive_provider_failure_evidence', provider_call: 'already_authorized_by_single_use_capability' },
  { from: 'invoking', to: 'ambiguous', event_kind: 'worker_ambiguity', event_schema_ref: 'outbox.ambiguity_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reserve_dispatch_and_start_invocation_and_record_provider_outcome', condition: 'exact_invocation_and_dispatch_identity_and_worker_reports_unknown_outcome', provider_call: 'may_already_have_occurred' },
  { from: 'invoking', to: 'ambiguous', event_kind: 'lease_expiry_ambiguity', event_schema_ref: 'outbox.ambiguity_evidence_schema', actor_authority_ref: 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity', condition: 'server_now_after_invocation_bound_lease_expiry_and_no_successor_exists', provider_call: false },
  { from: 'ambiguous', to: 'claimed', event_kind: 'retry_claim', event_schema_ref: 'outbox.claim_event_schema', actor_authority_ref: 'outbox.actor_authority.claim', condition: 'current_provider_idempotency_guarantee_exact_retry_identity_and_committed_reservation_count_below_three', provider_call: false },
  { from: 'ambiguous', to: 'unknown', event_kind: 'unknown_terminal', event_schema_ref: 'outbox.unknown_event_schema', actor_authority_ref: 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity', condition: 'no_current_idempotency_guarantee_or_three_reservations_used', provider_call: false },
  { from: 'unknown', to: 'confirmed', event_kind: 'reconciled_success', event_schema_ref: 'outbox.reconciliation_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reconcile_unknown', condition: 'exact_unknown_causal_chain_invocation_dispatch_identity_and_provider_evidence', provider_call: false },
  { from: 'unknown', to: 'failed', event_kind: 'reconciled_failure', event_schema_ref: 'outbox.reconciliation_evidence_schema', actor_authority_ref: 'outbox.actor_authority.reconcile_unknown', condition: 'exact_unknown_causal_chain_invocation_dispatch_identity_and_provider_evidence', provider_call: false },
]
r9.outbox.invocation_capability_protocol = {
  mint_after_committed_transition: 'dispatched_to_invoking',
  capability_properties: ['non_serializable', 'in_process_only', 'single_use', 'bound_to_exact_invocation_event_fingerprint'],
  may_be_reconstructed_from_database_or_queue: false,
  may_be_replayed_after_process_exit: false,
  provider_call_entrypoint_requires_unconsumed_capability: true,
  provider_call_count_per_invocation_event: { maximum: 1 },
  crash_before_invocation_event_commit: 'provider_definitely_not_called',
  crash_after_invocation_event_commit_before_outcome: 'provider_may_have_been_called_and_no_automatic_call_is_permitted',
}
r9.outbox.provider_call_gate = {
  only_state: 'invoking',
  requires: ['unconsumed_single_use_invocation_capability', 'exact_invocation_event_fingerprint', 'exact_dispatch_identity', 'current_payload_fingerprint'],
  reaper_and_reconciler_may_call_provider: false,
  automatic_fourth_attempt_forbidden: true,
  total_committed_reservations_per_effect: { maximum: 3 },
}
r9.outbox.terminal_evidence_binding_predicate = {
  all_dispatch_identity_fields_equal_referenced_dispatch_and_invocation: dispatchIdentityFields,
  dispatch_and_invocation_fingerprints_recomputed_and_equal: true,
  transition_predecessor_equals_current_invoking_or_unknown_tip: true,
  payload_and_transition_append_in_same_serializable_transaction: true,
}
r9.outbox.claim.eligible_from = ['pending', 'abandoned_not_invoked', 'ambiguous']
r9.outbox.claim.writes = ['immutable_claim_event', 'causal_transition_event']
r9.outbox.pre_provider_failure = { transition: 'claimed_to_failed', provider_called: false, event_schema_ref: 'outbox.pre_provider_failure_event_schema' }

// Repair R8's event payload schemas with unique identifiers where retries could alias.
r9.outbox.claim_event_schema.unique_keys = [['claim_ref'], ['outbox_effect_ref', 'fencing_token']]
r9.outbox.pre_provider_failure_event_schema.unique_keys = [['failure_ref']]
r9.outbox.unknown_event_schema.unique_keys = [['unknown_ref']]

// Refresh every changed proof export and operation export after schema version changes.
for (const family of Object.keys(proofPlans)) {
  const schema = r9.proof_bundle_schemas.extensions[family]
  bumpSchema(schema, `ctrl.g24.proof.${family.replaceAll('_', '-')}.r9.v1`)
  r9.evaluator_abi.proof_family_exports[family] = schema.schema_version
  r9.evaluator_abi.proof_family_exports_schema.properties[family] = { const: schema.schema_version }
}
r9.evaluator_abi.operation_result_exports = Object.fromEntries(r9.operation_names.map(name => [name, r9.result_payload_schemas[name].schema_version]))
for (const name of r9.operation_names) {
  r9.operation_specs[name].result_schema = r9.result_payload_schemas[name].schema_version
  r9.evaluator_abi.operation_result_exports_schema.properties[name] = { const: r9.result_payload_schemas[name].schema_version }
}

r9.required_negative_fixture_families = [...new Set([
  ...r9.required_negative_fixture_families,
  'watermark_lineage_and_version_invalidation',
  'closed_evaluator_operation_and_proof_export_parity',
  'visibility_secondary_idempotency_projection_and_phase_order',
  'content_bearing_authoritative_rows_and_typed_complete_proof_sets',
  'semantic_and_row_envelope_fingerprint_separation',
  'owner_dependency_join_and_set_seal_splicing_prevention',
  'outbox_genesis_payload_binding_and_unique_successor',
  'provider_invocation_start_and_single_use_nonserializable_capability',
  'safe_abandonment_before_invocation_and_ambiguity_after_invocation',
])]
r9.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r9)
export const materializedR9 = r9
export const materializedR9Output = `${JSON.stringify(r9, null, 2)}\n`
export const materializedR9Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR9Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (read(outputPath) !== materializedR9Output) {
      console.error(`${outputPath} is not the exact generator output`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R9 effective contract`)
  } else process.stdout.write(materializedR9Output)
}
