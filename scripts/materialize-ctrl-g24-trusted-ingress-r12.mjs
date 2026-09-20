import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r11.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r12.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR11 = JSON.parse(inputBytes)
const r12 = structuredClone(frozenR11)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const text = { type: 'human_text' }
const nonneg = { type: 'safe_nonnegative_integer' }
const nullable = value_schema => ({ type: 'nullable', value_schema })
const array = (items, extras = {}) => ({ type: 'array', items, ...extras })

function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return {
    schema_version, type: 'object', exact_keys: Object.keys(properties),
    required: Object.keys(properties).filter(key => !optional.includes(key)),
    ...(optional.length ? { optional } : {}), additional_properties: false, properties, ...extras,
  }
}
function fingerprint(domain_ascii, fields) {
  return { domain_ascii, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
}
function replaceProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}
function linkFingerprint(schema, ref, field) {
  schema.fingerprint_ref = ref
  schema.fingerprint_field = field
  schema.fingerprint_field_must_equal_referenced_preimage_digest = true
}
function refreshRow(table) {
  const schema = r12.authoritative_row_schemas[table]
  const semantic = schema.semantic_fingerprint_field
  const metadata = new Set(['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint'])
  r12.authoritative_semantic_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R12`, Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== semantic))
  r12.authoritative_row_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R12`, Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'))
}
function addRow(table, schema) {
  r12.authoritative_row_schemas[table] = schema
  refreshRow(table)
}
function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}

r12.schema_version = 'ctrl.g24.trusted-ingress.r12.effective.v1'
r12.status = 'eleventh_repair_candidate_under_independent_review'
r12.supersedes = {
  commit: '2ce2d7e5651c69ee1b17dd667322d7710d587b12', tree: '11ab9948dd8f3f7cbc9bf5525de2e294189b2bb4',
  human_blob: '1ab7b517cab49f362df782f21b287062436b6798', machine_blob: 'd2e515b2090ff981634a2f3af38b9c35daa5584e',
  qa_blob: 'f3531b677820be2ceba32e94f7bfb9677aee4bc7', checker_blob: '3db5420dfe250e0379588da06aa4efae7d48592b',
  materializer_blob: 'e070144500e315a2223586ef27539be70b270b7a', adjudication: 'veto',
}
r12.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r12.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// Projection is created first and is independent of later Release authority.
const projection = r12.authoritative_row_schemas.pending_release_projections
projection.schema_version = 'ctrl.g24.authoritative-row.pending-release-projections.r12.v1'
delete projection.properties.release_authority_receipt_ref
delete projection.properties.release_authority_receipt_fingerprint
replaceProperties(projection, projection.properties)
r12.release_authority_issuance_order = [
  'compile_release_commits_authority_independent_pending_projection',
  'named_leader_issue_release_authority_commits_accepted_request_and_authority_bound_one_way_to_exact_projection',
  'use_release_consumes_exact_authority_and_rechecks_projection_and_watermarks',
]

const envelope = (semanticRef, semanticFp) => ({
  workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
  [semanticRef]: id, [semanticFp]: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp,
})
function authoritative(schemaVersion, table, identityField, semanticField, extraProps, extras = {}) {
  const properties = envelope(identityField, semanticField)
  Object.assign(properties, extraProps)
  const schema = closed(schemaVersion, properties, {
    optional: ['valid_until'], append_only: true,
    partition_key: ['workspace_ref', 'subject_ref', 'case_ref', identityField],
    current_selection: 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_evaluated_at_and_valid_until_absent_or_gt_evaluated_at',
    current_selection_unique_or_hold: true,
    semantic_fingerprint_field: semanticField,
    semantic_fingerprint_ref: `authoritative_semantic_fingerprint_schemas.${table}`,
    semantic_fingerprint_must_equal_referenced_preimage_digest: true,
    fingerprint_ref: `authoritative_row_fingerprint_schemas.${table}`,
    fingerprint_field: 'row_envelope_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true,
    ...extras,
  })
  addRow(table, schema)
}

authoritative('ctrl.g24.authoritative-row.case-identities.r12.v1', 'case_identities', 'identity_control_ref', 'identity_control_fingerprint', {
  identity_control_version_ref: id, krish_actor_ref: id, named_leader_actor_ref: id,
  authority_version_ref: id, standing: { const: 'current' }, issued_at: ts,
})
authoritative('ctrl.g24.authoritative-row.accepted-release-requests.r12.v1', 'accepted_release_requests', 'accepted_release_request_ref', 'accepted_release_request_fingerprint', {
  pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  projection_payload_fingerprint: fp, named_leader_actor_ref: id, identity_control_version_ref: id,
  authority_version_ref: id, decision: { const: 'approve_release' }, accepted_at: ts,
})
authoritative('ctrl.g24.authoritative-row.lifecycle-action-receipts.r12.v1', 'lifecycle_action_receipts', 'action_receipt_ref', 'action_receipt_fingerprint', {
  actor_role: { type: 'enum', values: ['named_leader', 'krish'] }, actor_ref: id,
  transition_id: r12.authoritative_row_schemas.lifecycle_transition_receipts.properties.transition_id,
  predecessor_lifecycle_version_ref: id, nonce: id, identity_control_version_ref: id,
  authority_version_ref: id, issued_at: ts, expires_at: ts,
})
authoritative('ctrl.g24.authoritative-row.lifecycle-precondition-evidence.r12.v1', 'lifecycle_precondition_evidence', 'evidence_ref', 'evidence_fingerprint', {
  transition_id: r12.authoritative_row_schemas.lifecycle_transition_receipts.properties.transition_id,
  predecessor_lifecycle_version_ref: nullable(id), required_precondition_id: id,
  precondition_canonical_text: text, evidence_schema_version: id,
  canonical_evidence_b64url: { type: 'base64url_without_padding' }, canonical_evidence_byte_length: nonneg,
  evaluator_version_ref: id, evaluated_at: ts, satisfied: { const: true },
})
authoritative('ctrl.g24.authoritative-row.lifecycle-action-combination-consumptions.r12.v1', 'lifecycle_action_combination_consumptions', 'combination_consumption_ref', 'combination_consumption_fingerprint', {
  action_receipt_ref: id, action_receipt_fingerprint: fp, joint_authority_receipt_ref: id,
  joint_authority_receipt_fingerprint: fp, consumed_at: ts,
}, { unique_keys: [['action_receipt_ref']] })
authoritative('ctrl.g24.authoritative-row.lifecycle-joint-transition-consumptions.r12.v1', 'lifecycle_joint_transition_consumptions', 'transition_consumption_ref', 'transition_consumption_fingerprint', {
  joint_authority_receipt_ref: id, joint_authority_receipt_fingerprint: fp,
  transition_receipt_ref: id, transition_receipt_fingerprint: fp, consumed_at: ts,
}, { unique_keys: [['joint_authority_receipt_ref'], ['transition_receipt_ref']] })
authoritative('ctrl.g24.authoritative-row.lifecycle-single-action-transition-consumptions.r12.v1', 'lifecycle_single_action_transition_consumptions', 'transition_consumption_ref', 'transition_consumption_fingerprint', {
  action_receipt_ref: id, action_receipt_fingerprint: fp,
  transition_receipt_ref: id, transition_receipt_fingerprint: fp, consumed_at: ts,
}, { unique_keys: [['action_receipt_ref'], ['transition_receipt_ref']] })

// Human authority has explicit issue operations and closed owners.
const issueLeader = 'issue_leader_answer_authority'
const issueRelease = 'issue_release_authority'
r12.operation_names.splice(r12.operation_names.indexOf('record_answer'), 0, issueLeader)
r12.operation_names.splice(r12.operation_names.indexOf('use_release'), 0, issueRelease)
r12.operation_authority[issueLeader] = ['named_leader_predicate']
r12.operation_authority[issueRelease] = ['named_leader_predicate']
r12.operation_specs[issueLeader] = {
  schema_version: 'ctrl.g24.operation.issue-leader-answer-authority.r12.v1', actor_classes: ['named_leader'],
  intent: closed('ctrl.g24.intent.issue-leader-answer-authority.r12.v1', {
    intervention_atom_ref: id, intervention_atom_version_ref: id, intervention_atom_content_fingerprint: fp,
    visible_effect_receipt_ref: id,
  }),
  max_intent_bytes: 8192,
  read_set: ['exact_current_case_identity', 'exact_approved_intervention', 'exact_named_leader_visibility_acknowledgement'],
  write_set: ['leader_authority_receipt'], result_schema: 'ctrl.g24.result.issue-leader-answer-authority.r12.v1',
  idempotency_scope: 'workspace_ref_and_operation_id',
}
r12.result_payload_schemas[issueLeader] = closed('ctrl.g24.result.issue-leader-answer-authority.r12.v1', {
  leader_authority_ref: id, leader_authority_fingerprint: fp, authority_version: id,
})
r12.operation_specs[issueRelease] = {
  schema_version: 'ctrl.g24.operation.issue-release-authority.r12.v1', actor_classes: ['named_leader'],
  intent: closed('ctrl.g24.intent.issue-release-authority.r12.v1', {
    pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  }), max_intent_bytes: 8192,
  read_set: ['exact_current_case_identity', 'exact_current_pending_projection', 'complete_current_controlling_watermarks'],
  write_set: ['accepted_release_request', 'release_authority_receipt'],
  result_schema: 'ctrl.g24.result.issue-release-authority.r12.v1', idempotency_scope: 'workspace_ref_and_operation_id',
  atomic_equalities: ['accepted_request_and_authority_bind_exact_projection_ref_version_fingerprint_payload_and_named_leader_identity'],
}
r12.result_payload_schemas[issueRelease] = closed('ctrl.g24.result.issue-release-authority.r12.v1', {
  accepted_release_request_ref: id, accepted_release_request_fingerprint: fp,
  release_authority_receipt_ref: id, release_authority_receipt_fingerprint: fp,
})
for (const name of [issueLeader, issueRelease]) {
  r12.evaluator_abi.operation_result_exports[name] = r12.result_payload_schemas[name].schema_version
  r12.snapshot_and_cas_by_operation[name] = structuredClone(r12.snapshot_and_cas_by_operation.approve_intervention)
}
replaceProperties(r12.evaluator_abi.operation_result_exports_schema, Object.fromEntries(
  r12.operation_names.map(name => [name, { const: r12.result_payload_schemas[name].schema_version }]),
))
for (const name of ['record_leader_lifecycle_action', 'record_operator_lifecycle_action']) {
  r12.operation_specs[name].schema_version = `ctrl.g24.operation.${name.replaceAll('_', '-')}.r12.v1`
  r12.operation_specs[name].write_set = ['lifecycle_action_receipt']
}
r12.operation_specs.combine_lifecycle_authority.schema_version = 'ctrl.g24.operation.combine-lifecycle-authority.r12.v1'
r12.operation_specs.combine_lifecycle_authority.write_set = ['lifecycle_authority_receipt', 'leader_action_combination_consumption', 'operator_action_combination_consumption']
r12.operation_specs.apply_lifecycle_transition.schema_version = 'ctrl.g24.intent.lifecycle-transition.r12.v1'
r12.operation_specs.apply_lifecycle_transition.branch_effects.single_human_authority.write_set = ['lifecycle_authority_receipt', 'lifecycle_transition_receipt', 'lifecycle_snapshot', 'single_action_transition_consumption']
r12.operation_specs.apply_lifecycle_transition.branch_effects.two_party_authority.write_set = ['lifecycle_transition_receipt', 'lifecycle_snapshot', 'joint_transition_consumption']
replaceProperties(r12.evaluator_abi.operation_result_exports_schema, r12.evaluator_abi.operation_result_exports_schema.properties)
r12.evaluator_abi.operation_result_exports_schema.schema_version = 'ctrl.g24.evaluator-operation-result-exports.r12.v1'
r12.evaluator_abi.proof_family_exports_schema.schema_version = 'ctrl.g24.evaluator-proof-family-exports.r12.v1'

const leaderAuthority = r12.authoritative_row_schemas.leader_authority_receipts
leaderAuthority.schema_version = 'ctrl.g24.authoritative-row.leader-authority-receipts.r12.v1'
leaderAuthority.properties.identity_control_version_ref = id
leaderAuthority.properties.authority_version_ref = id
leaderAuthority.properties.visibility_receipt_ref = id
leaderAuthority.properties.visibility_receipt_fingerprint = fp
replaceProperties(leaderAuthority, leaderAuthority.properties)

const releaseAuthority = r12.authoritative_row_schemas.release_authority_receipts
releaseAuthority.schema_version = 'ctrl.g24.authoritative-row.release-authority-receipts.r12.v1'
releaseAuthority.properties.accepted_release_request_ref = id
releaseAuthority.properties.accepted_release_request_fingerprint = fp
releaseAuthority.properties.projection_payload_fingerprint = fp
releaseAuthority.properties.identity_control_version_ref = id
releaseAuthority.properties.authority_version_ref = id
replaceProperties(releaseAuthority, releaseAuthority.properties)

const releaseMap = r12.proof_authority.proof_family_resolution_map.pending_release_and_authority
releaseMap.extension_rows[0].owner_join_equalities = [
  { owner_row_field: 'pending_projection_ref', dependency_row_field: 'pending_projection_ref' },
  { owner_row_field: 'projection_version_ref', dependency_row_field: 'projection_version_ref' },
  { owner_row_field: 'pending_projection_fingerprint', dependency_row_field: 'pending_projection_fingerprint' },
]
releaseMap.extension_rows.push({
  table: 'accepted_release_requests', schema_ref: 'authoritative_row_schemas.accepted_release_requests', field_equalities: [],
  owner_join_equalities: [
    { owner_row_field: 'pending_projection_ref', dependency_row_field: 'pending_projection_ref' },
    { owner_row_field: 'projection_version_ref', dependency_row_field: 'projection_version_ref' },
    { owner_row_field: 'pending_projection_fingerprint', dependency_row_field: 'pending_projection_fingerprint' },
  ], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'family_schema_current_selection', failure: 'proof_schema_hold',
})
releaseMap.extension_rows.push({
  table: 'case_identities', schema_ref: 'authoritative_row_schemas.case_identities', field_equalities: [], owner_join_equalities: [],
  scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
  current_rule: 'accepted_release_request_identity_control_version_and_authority_version_resolve_exactly', failure: 'proof_schema_hold',
})
releaseMap.cross_row_equalities = [
  ['owner.pending_projection_ref', 'release_authority_receipts.pending_projection_ref', 'accepted_release_requests.pending_projection_ref'],
  ['owner.projection_version_ref', 'release_authority_receipts.projection_version_ref', 'accepted_release_requests.projection_version_ref'],
  ['owner.pending_projection_fingerprint', 'release_authority_receipts.pending_projection_fingerprint', 'accepted_release_requests.pending_projection_fingerprint'],
  ['owner.projection_payload_fingerprint', 'release_authority_receipts.projection_payload_fingerprint', 'accepted_release_requests.projection_payload_fingerprint'],
  ['release_authority_receipts.accepted_release_request_ref', 'accepted_release_requests.accepted_release_request_ref'],
  ['release_authority_receipts.accepted_release_request_fingerprint', 'accepted_release_requests.accepted_release_request_fingerprint'],
  ['release_authority_receipts.approver_actor_ref', 'accepted_release_requests.named_leader_actor_ref', 'case_identities.named_leader_actor_ref'],
  ['release_authority_receipts.identity_control_version_ref', 'accepted_release_requests.identity_control_version_ref', 'case_identities.identity_control_version_ref'],
  ['release_authority_receipts.authority_version_ref', 'accepted_release_requests.authority_version_ref', 'case_identities.authority_version_ref'],
]

// Question contract exactly matches kernel normalization and grammar-specific bounds.
const question = r12.proof_value_schemas.question_contract
question.schema_version = 'ctrl.g24.question-contract.r12.v1'
delete question.properties.options_or_comparator.max_items
question.properties.options_or_comparator.item_constraints = ['trimmed_nonempty', 'not_reserved_default_unknown_defer_refuse_or_premise_wrong', 'no_control_characters']
question.properties.options_or_comparator.conditional_max_items = { when_answer_grammar: 'ranked_choice', maximum: 5, other_grammars: 'no_contract_maximum_subject_to_intent_byte_limit' }
question.conditional_rules = [
  'visible_wording_rendered_control_payload_material_effect_disclosure_visible_changed_consequence_and_visible_unknown_consequence_are_trimmed_nonempty_and_contain_no_control_characters',
  'options_or_comparator_contains_unique_exact_trimmed_nonempty_values_and_no_reserved_effect_key_or_control_character',
  'ranked_choice_only_has_maximum_five_options; every_other_grammar_uses_the_operation_intent_byte_limit_only',
  'effect_keys_equal_all_honest_exits_plus_every_single_choice_option_or_default_for_other_grammars_plus_default_when_scoped_write_in_true',
  'every_nonnull_pending_human_owned_proposal_is_trimmed_nonempty_and_contains_no_control_characters',
  'honest_exit_effects_all_have_no_case_change_null_proposal_and_empty_retirement_refs',
]
r12.proof_value_schemas.question_answer_effect.schema_version = 'ctrl.g24.question-answer-effect.r12.v1'
r12.proof_value_schemas.question_answer_effect.conditional_rules = [
  'effect_key_visible_consequence_and_every_nonnull_pending_human_owned_proposal_are_trimmed_nonempty_and_contain_no_control_characters',
  'case_effect_no_case_change_requires_null_proposal_and_empty_retire_intervention_refs',
]
r12.authoritative_row_schemas.answer_receipts.schema_version = 'ctrl.g24.authoritative-row.answer-receipts.r12.v1'
r12.authoritative_row_schemas.answer_receipts.properties.pending_human_owned_proposal = nullable(text)
r12.authoritative_row_schemas.answer_receipts.properties.named_leader_ref = id
r12.authoritative_row_schemas.answer_receipts.properties.authenticated_principal_ref = id
replaceProperties(r12.authoritative_row_schemas.answer_receipts, r12.authoritative_row_schemas.answer_receipts.properties)
r12.approval_authority_derivation.route_atom_kind = 'selector_selected_route_ask_iff_atom_kind_question; selector_selected_route_session_iff_atom_kind_session; every_other_selected_route_is_not_approvable'
r12.answer_principal_derivation = {
  authenticated_principal: 'stable_authenticated_principal_ref_byte_equals_case_identity_named_leader_actor_ref',
  row_equalities: ['leader_authority_receipts.named_leader_ref_equals_answer_visibility_acknowledgements.named_leader_ref_equals_case_identities.named_leader_actor_ref'],
  authority_operation: issueLeader,
  any_mismatch: 'proof_schema_hold',
}
const answerMap = r12.proof_authority.proof_family_resolution_map.answer
answerMap.extension_rows.push({
  table: 'case_identities', schema_ref: 'authoritative_row_schemas.case_identities', field_equalities: [], owner_join_equalities: [],
  scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
  current_rule: 'owner_named_leader_and_authenticated_principal_equal_exact_current_identity', failure: 'proof_schema_hold',
})
answerMap.cross_row_equalities.push(
  ['owner.named_leader_ref', 'leader_authority_receipts.named_leader_ref', 'answer_visibility_acknowledgements.named_leader_ref', 'case_identities.named_leader_actor_ref'],
  ['owner.authenticated_principal_ref', 'case_identities.named_leader_actor_ref'],
)

// Lifecycle proof resolves predecessor, identities, action receipts and evidence rows.
const lifeAuthority = r12.authoritative_row_schemas.lifecycle_authority_receipts
lifeAuthority.schema_version = 'ctrl.g24.authoritative-row.lifecycle-authority-receipts.r12.v1'
Object.assign(lifeAuthority.properties, {
  leader_action_receipt_ref: nullable(id), leader_action_receipt_fingerprint: nullable(fp),
  operator_action_receipt_ref: nullable(id), operator_action_receipt_fingerprint: nullable(fp),
})
replaceProperties(lifeAuthority, lifeAuthority.properties)
lifeAuthority.conditional_rules = [
  'joint_human_requires_nonnull_distinct_leader_and_operator_action_receipts_bound_to_same_transition_predecessor_nonce_identity_and_authority_versions',
  'single_human_requires_exactly_one_role_appropriate_action_receipt_and_the_other_pair_null',
]
const lifeMap = r12.proof_authority.proof_family_resolution_map.lifecycle
const lifeOwner = r12.authoritative_row_schemas.lifecycle_transition_receipts
lifeOwner.schema_version = 'ctrl.g24.authoritative-row.lifecycle-transition-receipts.r12.v1'
Object.assign(lifeOwner.properties, {
  identity_control_version_ref: id, authority_version_ref: id,
  leader_action_receipt_ref: nullable(id), leader_action_receipt_fingerprint: nullable(fp),
  operator_action_receipt_ref: nullable(id), operator_action_receipt_fingerprint: nullable(fp),
})
replaceProperties(lifeOwner, lifeOwner.properties)
lifeMap.extension_rows.push(
  { table: 'case_identities', schema_ref: 'authoritative_row_schemas.case_identities', field_equalities: [], owner_join_equalities: [{ owner_row_field: 'identity_control_version_ref', dependency_row_field: 'identity_control_version_ref' }, { owner_row_field: 'authority_version_ref', dependency_row_field: 'authority_version_ref' }], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'identity_control_version_and_authority_version_exact_match', failure: 'proof_schema_hold' },
  { table: 'lifecycle_precondition_evidence', schema_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence', field_equalities: [], owner_join_equalities: [], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'every_precondition_set_member_resolves_by_evidence_ref_fingerprint_evaluator_version_transition_and_predecessor', failure: 'proof_schema_hold' },
  { table: 'lifecycle_action_receipts', table_alias: 'leader_action', schema_ref: 'authoritative_row_schemas.lifecycle_action_receipts', field_equalities: [], owner_join_equalities: [{ owner_row_field: 'leader_action_receipt_ref', dependency_row_field: 'action_receipt_ref' }, { owner_row_field: 'leader_action_receipt_fingerprint', dependency_row_field: 'action_receipt_fingerprint' }], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'nullable_role_specific_exact_ref_and_fingerprint', failure: 'proof_schema_hold' },
  { table: 'lifecycle_action_receipts', table_alias: 'operator_action', schema_ref: 'authoritative_row_schemas.lifecycle_action_receipts', field_equalities: [], owner_join_equalities: [{ owner_row_field: 'operator_action_receipt_ref', dependency_row_field: 'action_receipt_ref' }, { owner_row_field: 'operator_action_receipt_fingerprint', dependency_row_field: 'action_receipt_fingerprint' }], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'nullable_role_specific_exact_ref_and_fingerprint', failure: 'proof_schema_hold' },
  { table: 'lifecycle_snapshots', table_alias: 'predecessor_snapshot', schema_ref: 'authoritative_row_schemas.lifecycle_snapshots', field_equalities: [], owner_join_equalities: [{ owner_row_field: 'predecessor_lifecycle_version_ref', dependency_row_field: 'lifecycle_version_ref' }], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'required_exactly_when_from_state_not_none_and_state_equals_owner_from_state', failure: 'proof_schema_hold' },
  { table: 'lifecycle_action_combination_consumptions', schema_ref: 'authoritative_row_schemas.lifecycle_action_combination_consumptions', field_equalities: [], owner_join_equalities: [], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'both_joint_action_receipts_have_one_unique_consumption_to_exact_authority', failure: 'proof_schema_hold' },
  { table: 'lifecycle_joint_transition_consumptions', schema_ref: 'authoritative_row_schemas.lifecycle_joint_transition_consumptions', field_equalities: [], owner_join_equalities: [], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'joint_authority_has_one_unique_consumption_to_owner_transition', failure: 'proof_schema_hold' },
  { table: 'lifecycle_single_action_transition_consumptions', schema_ref: 'authoritative_row_schemas.lifecycle_single_action_transition_consumptions', field_equalities: [], owner_join_equalities: [], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'single_action_has_one_unique_consumption_to_owner_transition', failure: 'proof_schema_hold' },
)
r12.lifecycle_exact_derivation.predecessor_snapshot = 'from_state_none_iff_predecessor_lifecycle_version_ref_null; otherwise resolve_exact_predecessor_lifecycle_snapshot_by_version_in_same_scope_and_require_its_state_byte_equal_catalogue_from_state'
r12.lifecycle_exact_derivation.precondition_evidence_resolution = 'every_set_member_evidence_ref_fingerprint_evaluator_version_transition_id_precondition_id_text_from_state_and_to_state_byte_equals_one_authoritative_lifecycle_precondition_evidence_row_and_catalogue_row'
r12.lifecycle_exact_derivation.action_consumption = 'for_joint_authority_leader_and_operator_action_receipts_are_each_uniquely_consumed_by_one_joint_authority_receipt_and_that_receipt_is_uniquely_consumed_by_one_transition; for_single_authority_the_exact_action_receipt_is_uniquely_consumed_by_one_transition'
lifeMap.cross_row_equalities.push(
  ['owner.identity_control_version_ref', 'lifecycle_authority_receipts.identity_control_version_ref', 'case_identities.identity_control_version_ref'],
  ['owner.authority_version_ref', 'lifecycle_authority_receipts.authority_version_ref', 'case_identities.authority_version_ref'],
  ['owner.leader_action_receipt_ref', 'lifecycle_authority_receipts.leader_action_receipt_ref', 'leader_action.action_receipt_ref'],
  ['owner.leader_action_receipt_fingerprint', 'lifecycle_authority_receipts.leader_action_receipt_fingerprint', 'leader_action.action_receipt_fingerprint'],
  ['owner.operator_action_receipt_ref', 'lifecycle_authority_receipts.operator_action_receipt_ref', 'operator_action.action_receipt_ref'],
  ['owner.operator_action_receipt_fingerprint', 'lifecycle_authority_receipts.operator_action_receipt_fingerprint', 'operator_action.action_receipt_fingerprint'],
)

// Outbox origin consumes one exact operation result and failed final recheck has an executable non-call path.
const origin = r12.outbox.effect_origin_schema
origin.schema_version = 'ctrl.g24.outbox-effect-origin.r12.v1'
delete origin.properties.source_operation_id
origin.properties.workspace_ref = id
origin.properties.subject_ref = id
origin.properties.source_operation_ref = id
origin.properties.source_operation_class = { type: 'enum', values: [...r12.operation_names] }
origin.properties.provider_operation_ref = id
origin.properties.provider_target_fingerprint = fp
replaceProperties(origin, origin.properties)
origin.unique_keys = [
  ['origin_ref'], ['outbox_effect_ref'],
  ['workspace_ref', 'subject_ref', 'source_operation_class', 'source_operation_result_schema_version', 'source_operation_result_ref', 'source_operation_result_fingerprint', 'successful_result_branch'],
]
origin.conditional_rules = [
  'source_operation_ref_resolves_to_one_exact_committed_success_registry_row_whose_operation_class_result_schema_result_ref_result_fingerprint_and_branch_equal_this_origin',
  'provider_operation_ref_and_provider_target_fingerprint_equal_the_effect_provider_identity_and_current_capability_registry_target',
]
const effect = r12.outbox.effect_schema
effect.schema_version = 'ctrl.g24.outbox-effect.r12.v1'
effect.properties.effect_schema_version = { const: 'ctrl.g24.outbox-effect.r12.v1' }
effect.properties.provider_target_fingerprint = fp
replaceProperties(effect, effect.properties)
r12.outbox.genesis_protocol.unique_consumption = 'the_exact_semantic_success_result_identity_and_branch_may_create_at_most_one_origin_and_one_effect_across_all_operation_retry_identifiers_origin_identifiers_and_effect_identifiers'
r12.outbox.genesis_protocol.exact_equalities.push('origin_workspace_subject_provider_operation_and_provider_target_equal_the_operation_registry_scope_and_effect_provider_fields')
for (const config of Object.values(r12.outbox.genesis_protocol.allowed_origin_by_effect_kind)) {
  config.source_operation_class = config.source_operation_id
  delete config.source_operation_id
}

r12.outbox.invocation_aborted_before_provider_schema = closed('ctrl.g24.invocation-aborted-before-provider.r12.v1', {
  abort_ref: id, outbox_effect_ref: id, invocation_event_ref: id, dispatch_ref: id,
  abort_reason: { type: 'enum', values: ['lease_expired', 'claim_fence_changed', 'invocation_tip_superseded', 'capability_invalid_or_consumed', 'reaper_or_terminal_detected', 'operation_authority_changed', 'reservation_budget_invalid'] },
  provider_call_count: { const: 0 }, provider_called: { const: false }, aborted_at: ts, abort_fingerprint: fp,
}, { append_only: true, unique_keys: [['abort_ref'], ['invocation_event_ref']] })
r12.fingerprint_schemas.invocation_aborted_before_provider = fingerprint('CTRL-G24-INVOCATION-ABORTED-BEFORE-PROVIDER-R12', Object.keys(r12.outbox.invocation_aborted_before_provider_schema.properties).filter(key => key !== 'abort_fingerprint'))
linkFingerprint(r12.outbox.invocation_aborted_before_provider_schema, 'fingerprint_schemas.invocation_aborted_before_provider', 'abort_fingerprint')
r12.outbox.transition_event_schema.properties.event_kind.values.push('invocation_aborted_before_provider')
r12.outbox.transition_event_schema.schema_version = 'ctrl.g24.outbox-transition-event.r12.v1'
r12.outbox.payload_binding_map.invocation_aborted_before_provider = {
  payload_schema_ref: 'outbox.invocation_aborted_before_provider_schema', payload_ref_field: 'abort_ref',
  payload_fingerprint_field: 'abort_fingerprint', payload_effect_ref_field: 'outbox_effect_ref',
}
const invokingIndex = r12.outbox.transition_table.findIndex(row => row.from === 'invoking')
r12.outbox.transition_table.splice(invokingIndex, 0, {
  from: 'invoking', to: 'failed', event_kind: 'invocation_aborted_before_provider',
  event_schema_ref: 'outbox.invocation_aborted_before_provider_schema',
  actor_authority_ref: 'outbox.actor_authority.expire_without_invocation_or_mark_ambiguity',
  condition: 'exact_invocation_event_is_current_tip_and_provider_capability_was_never_consumed_and_provider_call_count_equals_zero_and_one_named_final_recheck_failed',
  provider_call: false,
})
r12.outbox.provider_call_gate.any_failed_recheck = 'atomically_append_invocation_aborted_before_provider_from_the_current_invocation_tip_and_do_not_call_provider'

// Invalidation and every changed export container carry honest versions.
const invalidation = r12.release_invalidation.invalidation_receipt_schema
invalidation.schema_version = 'ctrl.g24.release-invalidation-receipt.r12.v1'
if (invalidation.properties.receipt_schema_version) invalidation.properties.receipt_schema_version = { const: invalidation.schema_version }
r12.result_payload_schemas.use_release.schema_version = 'ctrl.g24.result.use-release.r12.v1'
r12.operation_specs.use_release.schema_version = 'ctrl.g24.intent.use-release.r12.v1'
r12.operation_specs.use_release.result_schema = r12.result_payload_schemas.use_release.schema_version
r12.evaluator_abi.operation_result_exports.use_release = r12.result_payload_schemas.use_release.schema_version
r12.evaluator_abi.operation_result_exports_schema.properties.use_release = { const: r12.result_payload_schemas.use_release.schema_version }

for (const table of ['pending_release_projections', 'leader_authority_receipts', 'release_authority_receipts', 'answer_receipts', 'lifecycle_authority_receipts', 'lifecycle_transition_receipts']) refreshRow(table)
r12.fingerprint_schemas.question_contract = fingerprint('CTRL-G24-QUESTION-CONTRACT-R12', Object.keys(question.properties).filter(key => key !== 'question_contract_fingerprint'))
r12.fingerprint_schemas.outbox_effect_origin = fingerprint('CTRL-G24-OUTBOX-EFFECT-ORIGIN-R12', Object.keys(origin.properties).filter(key => key !== 'origin_fingerprint'))
r12.fingerprint_schemas.outbox_effect = fingerprint('CTRL-G24-OUTBOX-EFFECT-R12', Object.keys(effect.properties).filter(key => key !== 'effect_fingerprint'))

// Derive schema-version obligations from the actual before/after documents.
function schemaNodes(value, path = '$', found = new Map()) {
  if (!value || typeof value !== 'object') return found
  if (!Array.isArray(value) && typeof value.schema_version === 'string') found.set(path, value)
  if (Array.isArray(value)) value.forEach((item, index) => schemaNodes(item, `${path}[${index}]`, found))
  else for (const [key, item] of Object.entries(value)) schemaNodes(item, `${path}.${key}`, found)
  return found
}
const beforeNodes = schemaNodes(frozenR11)
const afterNodes = schemaNodes(r12)
const changes = []
for (const [path, after] of afterNodes) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || JSON.stringify({ ...before, schema_version: null }) !== JSON.stringify({ ...after, schema_version: null })) {
    if (!after.schema_version.includes('.r12.')) throw new Error(`changed_schema_without_r12_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r12.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R11_and_materialized_R12',
  changes,
  every_changed_or_new_schema_must_have_r12_version: true,
}
r12.required_negative_fixture_families = [...new Set([...r12.required_negative_fixture_families,
  'one_way_release_authority_and_explicit_human_authority_issuance',
  'kernel_exact_question_normalization_and_grammar_bound',
  'lifecycle_identity_action_predecessor_and_evidence_resolution',
  'unique_operation_result_effect_origin_and_invocation_abort_without_call',
  'mechanically_derived_schema_version_change_manifest',
])]
r12.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r12)
export const materializedR12 = r12
export const materializedR12Output = `${JSON.stringify(r12, null, 2)}\n`
export const materializedR12Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR12Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR12Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R12 effective contract`)
  } else process.stdout.write(materializedR12Output)
}
