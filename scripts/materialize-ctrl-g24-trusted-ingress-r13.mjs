import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR12 } from './materialize-ctrl-g24-trusted-ingress-r12.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r12.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r13.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR12 = JSON.parse(inputBytes)
const r13 = structuredClone(materializedR12)
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
function replaceProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}
function fingerprint(domain_ascii, fields) {
  return { domain_ascii, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
}
function refreshRow(table) {
  const schema = r13.authoritative_row_schemas[table]
  const semantic = schema.semantic_fingerprint_field
  const metadata = new Set(['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint'])
  r13.authoritative_semantic_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R13`, Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== semantic))
  r13.authoritative_row_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R13`, Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'))
}
function authoritative(schemaVersion, table, identityField, semanticField, extraProps, extras = {}) {
  const properties = {
    workspace_ref: id, subject_ref: id, case_ref: id, snapshot_fingerprint: fp,
    [identityField]: id, [semanticField]: fp, row_version_ref: id,
    valid_from: ts, valid_until: ts, row_envelope_fingerprint: fp, ...extraProps,
  }
  const schema = closed(schemaVersion, properties, {
    optional: ['valid_until'], append_only: true,
    partition_key: ['workspace_ref', 'subject_ref', 'case_ref', identityField],
    current_selection: 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_evaluated_at_and_valid_until_absent_or_gt_evaluated_at',
    current_selection_unique_or_hold: true,
    semantic_fingerprint_field: semanticField,
    semantic_fingerprint_ref: `authoritative_semantic_fingerprint_schemas.${table}`,
    semantic_fingerprint_must_equal_referenced_preimage_digest: true,
    fingerprint_ref: `authoritative_row_fingerprint_schemas.${table}`,
    fingerprint_field: 'row_envelope_fingerprint',
    fingerprint_field_must_equal_referenced_preimage_digest: true,
    ...extras,
  })
  r13.authoritative_row_schemas[table] = schema
  refreshRow(table)
}
function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}
function schemaNodes(value, path = '$', found = new Map()) {
  if (!value || typeof value !== 'object') return found
  if (!Array.isArray(value) && typeof value.schema_version === 'string') found.set(path, value)
  if (Array.isArray(value)) value.forEach((item, index) => schemaNodes(item, `${path}[${index}]`, found))
  else for (const [key, item] of Object.entries(value)) schemaNodes(item, `${path}.${key}`, found)
  return found
}
function withoutVersion(value) {
  return JSON.stringify({ ...value, schema_version: null })
}
function r13Version(version) {
  return version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r13.') : `${version}.r13`
}
function bumpChangedSchemas() {
  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR12)
    for (const [path, after] of schemaNodes(r13)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r13.')) {
        after.schema_version = r13Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR12)
  for (const [path, after] of schemaNodes(r13)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      if (!field.endsWith('schema_version') || !property || typeof property !== 'object') continue
      const priorConst = prior.properties?.[field]?.const
      if (typeof priorConst === 'string' && property.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r13.schema_version = 'ctrl.g24.trusted-ingress.r13.effective.v1'
r13.status = 'twelfth_repair_candidate_under_independent_review'
r13.supersedes = {
  commit: '7749ce273239cb1c162310b597c899c56d0016f0', tree: 'a845038133ff172ccae66c5d71524e5457404767',
  human_blob: 'e89aa7dd41b2ba61f4574f633df0ccb8a3e36da7', machine_blob: '286eedd1710bbe44296b2d5de8d191a84479930e',
  qa_blob: '2ea101a91e482d41f656a36a2f20f40ae803cd4a', checker_blob: '01938981b637d8d767253dad5da53fe73d75f8cf',
  materializer_blob: '58ded8df313ee002771286563496b58aade1fc3c', founder_checker_blob: '0cbe41a0dffe3eb836207a91d0a7a06b222bec5e',
  adjudication: 'veto',
}
r13.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r13.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// The public request boundary, registry and evaluator expose one exact operation set.
const evaluateLifecycle = 'evaluate_lifecycle_preconditions'
r13.operation_names.splice(r13.operation_names.indexOf('apply_lifecycle_transition'), 0, evaluateLifecycle)
r13.request_schema.schema_version = 'ctrl.g24.trusted-request.r13.v1'
r13.request_schema.properties.operation_class.values = [...r13.operation_names]

// Compilation creates a pre-authority request and projection. Human acceptance follows it.
authoritative('ctrl.g24.authoritative-row.release-projection-requests.r13.v1', 'release_projection_requests', 'release_projection_request_ref', 'release_projection_request_fingerprint', {
  requested_by_actor_ref: id, selector_result_ref: id, selector_result_fingerprint: fp,
  source_snapshot_fingerprint: fp, requested_at: ts,
}, { unique_keys: [['workspace_ref', 'subject_ref', 'case_ref', 'selector_result_ref', 'selector_result_fingerprint', 'source_snapshot_fingerprint']] })

const projection = r13.authoritative_row_schemas.pending_release_projections
projection.properties.release_projection_request_ref = id
projection.properties.release_projection_request_fingerprint = fp
projection.properties.projection_payload_fingerprint = fp
replaceProperties(projection, projection.properties)

r13.operation_specs.compile_release = {
  schema_version: 'ctrl.g24.operation.compile-release.r13.v1', actor_classes: ['authorized_operator', 'authorized_system'],
  intent: closed('ctrl.g24.intent.compile-release.r13.v1', {
    release_projection_request_ref: id, selector_result_ref: id, selector_result_fingerprint: fp,
  }), max_intent_bytes: 4096,
  read_set: ['exact_current_case_identity', 'exact_current_selector_result', 'complete_selector_lineage', 'complete_current_controlling_watermarks'],
  write_set: ['release_projection_request', 'pending_release_projection'],
  result_schema: 'ctrl.g24.result.compile-release.r13.v1', idempotency_scope: 'workspace_ref_and_operation_id',
  atomic_equalities: ['projection_request_and_pending_projection_share_exact_scope_selector_source_snapshot_request_ref_and_request_fingerprint'],
}
r13.result_payload_schemas.compile_release = closed('ctrl.g24.result.compile-release.r13.v1', {
  release_projection_request_ref: id, release_projection_request_fingerprint: fp,
  pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  projection_payload_fingerprint: fp, standing: { const: 'pending_authority' },
})

const issueRelease = r13.operation_specs.issue_release_authority
issueRelease.intent = closed('ctrl.g24.intent.issue-release-authority.r13.v1', {
  release_projection_request_ref: id, release_projection_request_fingerprint: fp,
  pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  projection_payload_fingerprint: fp,
})
issueRelease.read_set = ['exact_current_case_identity', 'exact_release_projection_request', 'exact_current_pending_projection', 'complete_current_controlling_watermarks']
issueRelease.atomic_equalities = ['accepted_request_and_authority_bind_exact_projection_request_projection_payload_named_leader_identity_and_current_watermarks']

const accepted = r13.authoritative_row_schemas.accepted_release_requests
accepted.properties.release_projection_request_ref = id
accepted.properties.release_projection_request_fingerprint = fp
accepted.unique_keys = [
  ['accepted_release_request_ref'],
  ['workspace_ref', 'subject_ref', 'case_ref', 'pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint'],
]
replaceProperties(accepted, accepted.properties)

const releaseAuthority = r13.authoritative_row_schemas.release_authority_receipts
delete releaseAuthority.properties.approval_receipt_ref
releaseAuthority.properties.release_projection_request_ref = id
releaseAuthority.properties.release_projection_request_fingerprint = fp
releaseAuthority.unique_keys = [
  ['release_authority_receipt_ref'], ['accepted_release_request_ref'],
  ['workspace_ref', 'subject_ref', 'case_ref', 'pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint'],
]
replaceProperties(releaseAuthority, releaseAuthority.properties)

authoritative('ctrl.g24.authoritative-row.release-authority-terminal-consumptions.r13.v1', 'release_authority_terminal_consumptions', 'release_authority_consumption_ref', 'release_authority_consumption_fingerprint', {
  release_authority_receipt_ref: id, release_authority_receipt_fingerprint: fp,
  accepted_release_request_ref: id, accepted_release_request_fingerprint: fp,
  pending_projection_ref: id, projection_version_ref: id, pending_projection_fingerprint: fp,
  use_release_operation_ref: id, terminal_result_ref: id,
  outcome: { type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] }, consumed_at: ts,
}, { unique_keys: [['release_authority_receipt_ref'], ['accepted_release_request_ref'], ['pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint']] })

const useRelease = r13.operation_specs.use_release
useRelease.read_set = ['exact_current_pending_projection', 'exact_current_release_authority', 'complete_current_controlling_watermarks']
for (const branch of Object.values(useRelease.branch_effects)) branch.write_set.push('release_authority_terminal_consumption')
useRelease.atomic_equalities = ['both_terminal_branches_consume_exact_authority_accepted_request_and_projection_once_in_the_same_serializable_transaction']
r13.release_authority_issuance_order = [
  'compile_release_atomically_commits_pre_authority_projection_request_and_authority_independent_projection',
  'named_leader_issue_release_authority_atomically_commits_unique_accepted_request_and_unique_authority_bound_to_exact_request_projection_payload_identity_and_watermarks',
  'use_release_atomically_commits_exactly_one_terminal_authority_consumption_before_pending_delivery_or_invalidation_result',
]
const releaseMap = r13.proof_authority.proof_family_resolution_map.pending_release_and_authority
releaseMap.extension_rows.push(
  {
    table: 'release_projection_requests', schema_ref: 'authoritative_row_schemas.release_projection_requests', field_equalities: [],
    owner_join_equalities: [
      { owner_row_field: 'release_projection_request_ref', dependency_row_field: 'release_projection_request_ref' },
      { owner_row_field: 'release_projection_request_fingerprint', dependency_row_field: 'release_projection_request_fingerprint' },
    ], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
    current_rule: 'exact_unique_pre_authority_request_for_owner_projection', failure: 'proof_schema_hold',
  },
  {
    table: 'release_authority_terminal_consumptions', schema_ref: 'authoritative_row_schemas.release_authority_terminal_consumptions', field_equalities: [],
    owner_join_equalities: [
      { owner_row_field: 'pending_projection_ref', dependency_row_field: 'pending_projection_ref' },
      { owner_row_field: 'projection_version_ref', dependency_row_field: 'projection_version_ref' },
      { owner_row_field: 'pending_projection_fingerprint', dependency_row_field: 'pending_projection_fingerprint' },
    ], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
    current_rule: 'required_exactly_for_terminal_use_release_result_and_unique_by_authority_accepted_request_and_projection', failure: 'proof_schema_hold',
  },
)
releaseMap.cross_row_equalities.push(
  ['owner.release_projection_request_ref', 'release_projection_requests.release_projection_request_ref', 'accepted_release_requests.release_projection_request_ref', 'release_authority_receipts.release_projection_request_ref'],
  ['owner.release_projection_request_fingerprint', 'release_projection_requests.release_projection_request_fingerprint', 'accepted_release_requests.release_projection_request_fingerprint', 'release_authority_receipts.release_projection_request_fingerprint'],
  ['release_authority_receipts.release_authority_receipt_ref', 'release_authority_terminal_consumptions.release_authority_receipt_ref'],
  ['release_authority_receipts.release_authority_receipt_fingerprint', 'release_authority_terminal_consumptions.release_authority_receipt_fingerprint'],
  ['accepted_release_requests.accepted_release_request_ref', 'release_authority_terminal_consumptions.accepted_release_request_ref'],
  ['accepted_release_requests.accepted_release_request_fingerprint', 'release_authority_terminal_consumptions.accepted_release_request_fingerprint'],
  ['owner.pending_projection_ref', 'release_authority_terminal_consumptions.pending_projection_ref'],
  ['owner.projection_version_ref', 'release_authority_terminal_consumptions.projection_version_ref'],
  ['owner.pending_projection_fingerprint', 'release_authority_terminal_consumptions.pending_projection_fingerprint'],
)

// Case identity is a deterministic projection of canonical case authority and identity watermark state.
const caseIdentity = r13.authoritative_row_schemas.case_identities
caseIdentity.properties.case_authority_version_ref = id
caseIdentity.properties.case_authority_binding_fingerprint = fp
caseIdentity.properties.operator_grant_set_seal = fp
caseIdentity.properties.workload_grant_set_seal = fp
caseIdentity.properties.identity_watermark_member_fingerprint = fp
replaceProperties(caseIdentity, caseIdentity.properties)
r13.case_identity_derivation = {
  source_authorities: ['case_authority_bindings', 'complete_current_identity_controlling_watermark_member'],
  exact_byte_equalities: [
    'case_identities.case_ref_equals_case_authority_bindings.case_ref',
    'case_identities.named_leader_actor_ref_equals_case_authority_bindings.named_leader_ref',
    'case_identities.krish_actor_ref_equals_case_authority_bindings.engagement_operator_ref',
    'case_identities.case_authority_version_ref_and_authority_version_ref_equal_case_authority_bindings.authority_version',
    'operator_and_workload_grant_set_seals_equal_case_authority_bindings',
    'identity_control_version_ref_and_identity_watermark_member_fingerprint_equal_the_exact_current_identity_controlling_watermark_member',
  ],
  production: 'server_computed_projection_only; no_caller_supplied_identity_field',
  freshness: 'row_current_iff_both_source_authorities_are_current_at_the_same_snapshot; otherwise_proof_schema_hold',
  fingerprint: 'case_identity_semantic_and_envelope_fingerprints_are_recomputed_after_all_source_equalities',
}

// Answer authority binds one visible approved question and is consumed once by one answer.
const leaderAuthority = r13.authoritative_row_schemas.leader_authority_receipts
leaderAuthority.properties.approval_receipt_ref = id
leaderAuthority.properties.approval_receipt_fingerprint = fp
leaderAuthority.properties.approval_authority_version_ref = id
leaderAuthority.properties.answer_surface_fingerprint = fp
leaderAuthority.unique_keys = [['leader_authority_ref'], ['visibility_receipt_ref'], ['workspace_ref', 'subject_ref', 'case_ref', 'intervention_atom_ref', 'intervention_atom_version_ref', 'question_contract_fingerprint']]
replaceProperties(leaderAuthority, leaderAuthority.properties)

const issueLeader = r13.operation_specs.issue_leader_answer_authority
issueLeader.intent = closed('ctrl.g24.intent.issue-leader-answer-authority.r13.v1', {
  intervention_atom_ref: id, intervention_atom_version_ref: id, intervention_atom_content_fingerprint: fp,
  approval_receipt_ref: id, approval_receipt_fingerprint: fp, approval_authority_version_ref: id,
  question_contract_fingerprint: fp, visibility_receipt_ref: id, visibility_receipt_fingerprint: fp,
  answer_surface_fingerprint: fp,
})
issueLeader.atomic_equalities = [
  'authority_atom_question_and_approval_fields_equal_exact_current_approved_question_atom',
  'authority_visibility_fields_equal_exact_named_leader_visibility_acknowledgement',
  'authority_named_leader_identity_control_and_authority_versions_equal_exact_current_case_identity_and_authenticated_principal',
]

authoritative('ctrl.g24.authoritative-row.leader-answer-authority-consumptions.r13.v1', 'leader_answer_authority_consumptions', 'leader_authority_consumption_ref', 'leader_authority_consumption_fingerprint', {
  leader_authority_ref: id, leader_authority_fingerprint: fp,
  answer_receipt_ref: id, answer_receipt_fingerprint: fp, consumed_at: ts,
}, { unique_keys: [['leader_authority_ref'], ['answer_receipt_ref']] })
r13.operation_specs.record_answer.read_set = ['exact_current_approved_question', 'exact_visibility_acknowledgement', 'exact_current_leader_answer_authority', 'exact_current_case_identity']
r13.operation_specs.record_answer.write_set = ['answer_receipt', 'leader_answer_authority_consumption']
r13.operation_specs.record_answer.atomic_equalities = ['answer_and_consumption_bind_the_same_exact_authority_visibility_question_approval_identity_principal_and_effect']

const answerMap = r13.proof_authority.proof_family_resolution_map.answer
answerMap.extension_rows.push({
  table: 'leader_answer_authority_consumptions', schema_ref: 'authoritative_row_schemas.leader_answer_authority_consumptions',
  field_equalities: [], owner_join_equalities: [
    { owner_row_field: 'leader_authority_ref', dependency_row_field: 'leader_authority_ref' },
    { owner_row_field: 'answer_receipt_ref', dependency_row_field: 'answer_receipt_ref' },
    { owner_row_field: 'answer_receipt_fingerprint', dependency_row_field: 'answer_receipt_fingerprint' },
  ], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'],
  current_rule: 'exactly_one_consumption_for_exact_authority_and_owner_answer', failure: 'proof_schema_hold',
})
answerMap.cross_row_equalities.push(
  ['owner.visible_effect_receipt_ref', 'leader_authority_receipts.visibility_receipt_ref', 'answer_visibility_acknowledgements.receipt_ref'],
  ['owner.visible_effect_receipt_fingerprint', 'leader_authority_receipts.visibility_receipt_fingerprint', 'answer_visibility_acknowledgements.receipt_fingerprint'],
  ['leader_authority_receipts.answer_surface_fingerprint', 'answer_visibility_acknowledgements.answer_surface_fingerprint'],
  ['owner.approval_receipt_ref', 'leader_authority_receipts.approval_receipt_ref', 'intervention_approval_receipts.approval_receipt_ref'],
  ['owner.approval_fingerprint', 'leader_authority_receipts.approval_receipt_fingerprint', 'intervention_approval_receipts.approval_receipt_fingerprint'],
  ['owner.approval_authority_version_ref', 'leader_authority_receipts.approval_authority_version_ref', 'leader_authority_receipts.authority_version', 'leader_authority_receipts.authority_version_ref', 'case_identities.authority_version_ref'],
  ['leader_authority_receipts.identity_control_version_ref', 'case_identities.identity_control_version_ref'],
  ['owner.leader_authority_ref', 'leader_answer_authority_consumptions.leader_authority_ref'],
  ['owner.answer_receipt_ref', 'leader_answer_authority_consumptions.answer_receipt_ref'],
  ['owner.answer_receipt_fingerprint', 'leader_answer_authority_consumptions.answer_receipt_fingerprint'],
)

// One lifecycle representation, nullable genesis predecessor and executable evidence evaluation.
for (const name of ['record_leader_lifecycle_action', 'record_operator_lifecycle_action']) {
  const spec = r13.operation_specs[name]
  spec.intent = closed('ctrl.g24.intent.lifecycle-authority-action.r13.v1', {
    transition_id: structuredClone(r13.authoritative_row_schemas.lifecycle_action_receipts.properties.transition_id),
    predecessor_lifecycle_version_ref: nullable(id), nonce: id,
  })
  spec.read_set = ['exact_current_case_identity', 'exact_transition_catalogue_row', 'current_lifecycle_or_proven_absence']
  spec.atomic_equalities = ['open_preparation_iff_predecessor_null_and_no_current_lifecycle_row; every_other_transition_requires_nonnull_exact_current_predecessor_matching_catalogue_from_state']
  r13.result_payload_schemas[name] = closed(`ctrl.g24.result.${name.replaceAll('_', '-')}.r13.v1`, {
    action_receipt_ref: id, action_receipt_fingerprint: fp, expires_at: ts,
  })
}
const actionRow = r13.authoritative_row_schemas.lifecycle_action_receipts
actionRow.properties.predecessor_lifecycle_version_ref = nullable(id)
actionRow.conditional_rules = ['open_preparation_iff_predecessor_null_and_no_current_lifecycle_row; every_other_transition_requires_nonnull_exact_current_predecessor_matching_catalogue_from_state']
replaceProperties(actionRow, actionRow.properties)

r13.lifecycle_authority.action_schema_ref = 'authoritative_row_schemas.lifecycle_action_receipts'
r13.lifecycle_authority.joint_receipt_schema_ref = 'authoritative_row_schemas.lifecycle_authority_receipts'
r13.lifecycle_authority.action_combination_consumption_schema_ref = 'authoritative_row_schemas.lifecycle_action_combination_consumptions'
r13.lifecycle_authority.joint_transition_consumption_schema_ref = 'authoritative_row_schemas.lifecycle_joint_transition_consumptions'
delete r13.lifecycle_authority.action_schema
delete r13.lifecycle_authority.joint_receipt_schema
delete r13.lifecycle_authority.action_combination_consumption_schema
delete r13.lifecycle_authority.joint_transition_consumption_schema
r13.result_payload_schemas.combine_lifecycle_authority = closed('ctrl.g24.result.combine-lifecycle-authority.r13.v1', {
  authority_receipt_ref: id, authority_receipt_fingerprint: fp, expires_at: ts,
})

r13.operation_authority[evaluateLifecycle] = ['workload_lifecycle_precondition_evaluator_predicate_and_exact_current_registry_member']
r13.operation_specs[evaluateLifecycle] = {
  schema_version: 'ctrl.g24.operation.evaluate-lifecycle-preconditions.r13.v1', actor_classes: ['authorized_system'],
  intent: closed('ctrl.g24.intent.evaluate-lifecycle-preconditions.r13.v1', {
    transition_id: structuredClone(actionRow.properties.transition_id),
    predecessor_lifecycle_version_ref: nullable(id), evidence_input_set_seal: fp,
  }), max_intent_bytes: 16384,
  read_set: ['exact_current_case_identity', 'exact_transition_catalogue_row', 'current_lifecycle_or_proven_absence', 'complete_authoritative_evidence_input_set', 'exact_current_evaluator_registry_member'],
  write_set: ['lifecycle_precondition_evidence'], result_schema: 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1',
  idempotency_scope: 'workspace_ref_and_operation_id',
  atomic_equalities: [
    'open_preparation_iff_predecessor_null_and_no_current_lifecycle_row; every_other_transition_requires_nonnull_exact_current_predecessor_matching_catalogue_from_state',
    'one_satisfied_evidence_row_per_exact_catalogue_precondition_with_canonical_input_bytes_current_evaluator_artifact_and_recomputed_fingerprints',
    'any_unsatisfied_missing_ambiguous_or_unresolved_input_commits_hold_and_no_evidence_row',
  ],
}
r13.result_payload_schemas[evaluateLifecycle] = closed('ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1', {
  transition_id: structuredClone(actionRow.properties.transition_id), predecessor_lifecycle_version_ref: nullable(id),
  evidence_refs: array(id, { min_items: 1, unique: true, ordered_by: 'unsigned_utf8' }),
  evidence_fingerprints: array(fp, { min_items: 1, unique: true, ordered_by: 'matching_evidence_refs' }),
  precondition_set_seal: fp, evaluator_version_ref: id, evaluator_artifact_sha256: fp,
})

const evidenceRow = r13.authoritative_row_schemas.lifecycle_precondition_evidence
evidenceRow.properties.evidence_input_set_seal = fp
evidenceRow.properties.evaluator_id = id
evidenceRow.properties.evaluator_semantic_version = id
evidenceRow.properties.evaluator_artifact_sha256 = fp
evidenceRow.properties.evaluator_manifest_sha256 = fp
evidenceRow.production_operation = evaluateLifecycle
evidenceRow.conditional_rules = [
  'row_exists_only_on_the_closed_success_branch_of_evaluate_lifecycle_preconditions',
  'transition_predecessor_precondition_text_and_evaluator_fields_equal_exact_catalogue_case_identity_input_set_and_current_registry_member',
]
replaceProperties(evidenceRow, evidenceRow.properties)

const applyLifecycle = r13.operation_specs.apply_lifecycle_transition
applyLifecycle.intent = closed('ctrl.g24.intent.lifecycle-transition.r13.v1', {
  predecessor_lifecycle_snapshot_ref: nullable(id), transition_id: structuredClone(actionRow.properties.transition_id),
  authority_receipt_ref: id, precondition_evidence_refs: { schema_ref: 'shared_schemas.ref_array' },
  precondition_set_seal: fp,
})
applyLifecycle.read_set = ['current_lifecycle_or_proven_absence', 'exact_current_lifecycle_authority', 'exact_evaluated_precondition_evidence_set', 'exact_transition_catalogue_row']
applyLifecycle.atomic_equalities = ['transition_authority_evidence_consumptions_and_new_snapshot_commit_in_one_serializable_compare_and_swap']

const lifeMap = r13.proof_authority.proof_family_resolution_map.lifecycle
const evidenceExtension = lifeMap.extension_rows.find(row => row.table === 'lifecycle_precondition_evidence')
evidenceExtension.owner_join_equalities = [
  { owner_row_field: 'transition_id', dependency_row_field: 'transition_id' },
  { owner_row_field: 'predecessor_lifecycle_version_ref', dependency_row_field: 'predecessor_lifecycle_version_ref' },
]
evidenceExtension.current_rule = 'every_owner_precondition_set_member_resolves_to_one_row_produced_by_evaluate_lifecycle_preconditions_and_one_exact_current_evaluator_registry_member'
lifeMap.external_sealed_members = [{
  set_name: 'evaluator_registry', set_seal_source: 'snapshot.evaluator_registry_set_seal',
  member_schema_ref: 'evaluator_abi.registry_member_schema',
  row_equalities: [
    ['lifecycle_precondition_evidence.evaluator_id', 'member.evaluator_id'],
    ['lifecycle_precondition_evidence.evaluator_semantic_version', 'member.semantic_version'],
    ['lifecycle_precondition_evidence.evaluator_artifact_sha256', 'member.artifact_sha256'],
    ['lifecycle_precondition_evidence.evaluator_manifest_sha256', 'member.manifest_sha256'],
  ],
}]
const combinationExtensionIndex = lifeMap.extension_rows.findIndex(row => row.table === 'lifecycle_action_combination_consumptions')
lifeMap.extension_rows.splice(combinationExtensionIndex, 1,
  {
    table: 'lifecycle_action_combination_consumptions', table_alias: 'leader_action_consumption',
    schema_ref: 'authoritative_row_schemas.lifecycle_action_combination_consumptions', field_equalities: [],
    owner_join_equalities: [
      { owner_row_field: 'leader_action_receipt_ref', dependency_row_field: 'action_receipt_ref' },
      { owner_row_field: 'authority_receipt_ref', dependency_row_field: 'joint_authority_receipt_ref' },
      { owner_row_field: 'authority_receipt_fingerprint', dependency_row_field: 'joint_authority_receipt_fingerprint' },
    ], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'required_exactly_for_joint_human_authority', failure: 'proof_schema_hold',
  },
  {
    table: 'lifecycle_action_combination_consumptions', table_alias: 'operator_action_consumption',
    schema_ref: 'authoritative_row_schemas.lifecycle_action_combination_consumptions', field_equalities: [],
    owner_join_equalities: [
      { owner_row_field: 'operator_action_receipt_ref', dependency_row_field: 'action_receipt_ref' },
      { owner_row_field: 'authority_receipt_ref', dependency_row_field: 'joint_authority_receipt_ref' },
      { owner_row_field: 'authority_receipt_fingerprint', dependency_row_field: 'joint_authority_receipt_fingerprint' },
    ], scope_equalities: ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'], current_rule: 'required_exactly_for_joint_human_authority', failure: 'proof_schema_hold',
  },
)
for (const [table, joins] of Object.entries({
  lifecycle_joint_transition_consumptions: [
    { owner_row_field: 'transition_receipt_ref', dependency_row_field: 'transition_receipt_ref' },
    { owner_row_field: 'transition_receipt_fingerprint', dependency_row_field: 'transition_receipt_fingerprint' },
    { owner_row_field: 'authority_receipt_ref', dependency_row_field: 'joint_authority_receipt_ref' },
    { owner_row_field: 'authority_receipt_fingerprint', dependency_row_field: 'joint_authority_receipt_fingerprint' },
  ],
  lifecycle_single_action_transition_consumptions: [
    { owner_row_field: 'transition_receipt_ref', dependency_row_field: 'transition_receipt_ref' },
    { owner_row_field: 'transition_receipt_fingerprint', dependency_row_field: 'transition_receipt_fingerprint' },
  ],
})) lifeMap.extension_rows.find(row => row.table === table).owner_join_equalities = joins
const singleConsumption = r13.authoritative_row_schemas.lifecycle_single_action_transition_consumptions
singleConsumption.properties.actor_role = { type: 'enum', values: ['named_leader', 'krish'] }
replaceProperties(singleConsumption, singleConsumption.properties)
lifeMap.cross_row_equalities.push(
  ['owner.authority_receipt_ref', 'leader_action_consumption.joint_authority_receipt_ref', 'operator_action_consumption.joint_authority_receipt_ref', 'lifecycle_joint_transition_consumptions.joint_authority_receipt_ref'],
  ['owner.authority_receipt_fingerprint', 'leader_action_consumption.joint_authority_receipt_fingerprint', 'operator_action_consumption.joint_authority_receipt_fingerprint', 'lifecycle_joint_transition_consumptions.joint_authority_receipt_fingerprint'],
  ['owner.transition_receipt_ref', 'lifecycle_joint_transition_consumptions.transition_receipt_ref', 'lifecycle_single_action_transition_consumptions.transition_receipt_ref'],
  ['owner.transition_receipt_fingerprint', 'lifecycle_joint_transition_consumptions.transition_receipt_fingerprint', 'lifecycle_single_action_transition_consumptions.transition_receipt_fingerprint'],
  ['owner.leader_action_receipt_ref', 'leader_action_consumption.action_receipt_ref'],
  ['owner.operator_action_receipt_ref', 'operator_action_consumption.action_receipt_ref'],
)
lifeMap.conditional_cross_row_equalities = [
  { when: 'authority_kind_single_human_and_actor_class_resolves_named_leader', equals: ['owner.leader_action_receipt_ref', 'lifecycle_single_action_transition_consumptions.action_receipt_ref'], requires: ['lifecycle_single_action_transition_consumptions.actor_role_named_leader', 'owner.operator_action_receipt_ref_null'] },
  { when: 'authority_kind_single_human_and_actor_class_resolves_krish', equals: ['owner.operator_action_receipt_ref', 'lifecycle_single_action_transition_consumptions.action_receipt_ref'], requires: ['lifecycle_single_action_transition_consumptions.actor_role_krish', 'owner.leader_action_receipt_ref_null'] },
  { when: 'authority_kind_joint_human', equals: ['owner.leader_action_receipt_ref', 'leader_action_consumption.action_receipt_ref', 'owner.operator_action_receipt_ref', 'operator_action_consumption.action_receipt_ref'], requires: ['two_distinct_action_consumption_rows', 'no_single_action_transition_consumption'] },
]
r13.lifecycle_exact_derivation.precondition_evidence_resolution = 'every_set_member_resolves_to_one_authoritative_evidence_row_written_only_by_evaluate_lifecycle_preconditions_and_byte_equals_the_catalogue_predecessor_input_set_and_exact_current_evaluator_registry_member'

// The question contract claims exactly what the locked TypeScript kernel validates.
const question = r13.proof_value_schemas.question_contract
question.properties.options_or_comparator.item_constraints = ['exact_trimmed_nonempty', 'not_exact_reserved_default_or_offered_honest_exit']
question.conditional_rules = [
  'visible_wording_rendered_control_payload_material_effect_disclosure_visible_changed_consequence_and_visible_unknown_consequence_are_strings_nonblank_after_trim_but_exact_original_bytes_are_preserved',
  'options_or_comparator_contains_unique_exact_trimmed_nonempty_values_and_no_exact_reserved_default_or_offered_honest_exit_key',
  'ranked_choice_only_has_maximum_five_options; every_other_grammar_uses_the_operation_intent_byte_limit_only',
  'effect_keys_equal_all_honest_exits_plus_every_single_choice_option_or_default_for_other_grammars_plus_default_when_scoped_write_in_true',
  'every_nonnull_pending_human_owned_proposal_and_every_visible_consequence_is_exact_trimmed_nonempty',
  'honest_exit_effects_all_have_no_case_change_null_proposal_and_empty_retirement_refs',
  'no_additional_control_character_restriction_exists_beyond_the_locked_kernel_string_and_trim_checks',
]
r13.proof_value_schemas.question_answer_effect.conditional_rules = [
  'visible_consequence_and_every_nonnull_pending_human_owned_proposal_are_exact_trimmed_nonempty',
  'case_effect_no_case_change_requires_null_proposal_and_empty_retire_intervention_refs',
  'no_additional_control_character_restriction_exists_beyond_the_locked_kernel_string_and_trim_checks',
]

// Provider target identity is reconstructible from one exact registry member.
function renameProviderOperation(value) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) return value.forEach(renameProviderOperation)
  if (value.properties?.provider_operation_ref) {
    value.properties.provider_operation_class = value.properties.provider_operation_ref
    delete value.properties.provider_operation_ref
    if (value.exact_keys) value.exact_keys = value.exact_keys.map(key => key === 'provider_operation_ref' ? 'provider_operation_class' : key)
    if (value.required) value.required = value.required.map(key => key === 'provider_operation_ref' ? 'provider_operation_class' : key)
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && child.includes('provider_operation_ref')) value[key] = child.replaceAll('provider_operation_ref', 'provider_operation_class')
    else renameProviderOperation(child)
  }
}
renameProviderOperation(r13.outbox)
const origin = r13.outbox.effect_origin_schema
origin.properties.provider_ref = id
origin.properties.provider_key = id
origin.properties.provider_capability_member_fingerprint = fp
replaceProperties(origin, origin.properties)
const effect = r13.outbox.effect_schema
effect.properties.provider_capability_member_fingerprint = fp
replaceProperties(effect, effect.properties)
r13.provider_target_schema = closed('ctrl.g24.provider-target.r13.v1', {
  provider_ref: id, provider_operation_class: id, provider_key_grammar_version: id,
  verification_source_ref: id, active_from: ts, active_until: ts,
  provider_capability_member_fingerprint: fp, provider_target_fingerprint: fp,
})
r13.fingerprint_schemas.provider_target = fingerprint('CTRL-G24-PROVIDER-TARGET-R13', [
  'provider_ref', 'provider_operation_class', 'provider_key_grammar_version', 'verification_source_ref',
  'active_from', 'active_until', 'provider_capability_member_fingerprint',
])
r13.provider_target_derivation = {
  registry_schema_ref: 'provider_capability_schema', target_schema_ref: 'provider_target_schema',
  selection: 'exactly_one_half_open_current_provider_capability_member_for_effect_provider_ref_and_provider_operation_class',
  equalities: [
    'target_provider_ref_operation_class_active_times_and_capability_member_fingerprint_byte_equal_the_selected_registry_member',
    'origin_and_effect_provider_ref_operation_class_capability_member_fingerprint_and_target_fingerprint_byte_equal_the_recomputed_target',
    'provider_key_is_canonical_under_the_selected_member_provider_key_grammar_version',
  ],
  mismatch: 'pre_provider_failure_without_call',
}
r13.outbox.genesis_protocol.exact_equalities = r13.outbox.genesis_protocol.exact_equalities.map(rule =>
  rule.includes('origin_source_operation_id_')
    ? 'origin_source_operation_ref_class_result_schema_version_result_ref_result_fingerprint_and_successful_branch_equal_the_exact_committed_successful_operation_result'
    : rule.replaceAll('provider_operation', 'provider_operation_class')
)

// Final recheck outcomes are total, reason-scoped and never claim no-call after capability consumption.
r13.outbox.actor_authority.abort_before_provider = [
  'current_fenced_claim_worker_for_current_tip_unconsumed_capability_nonlease_recheck_failure',
  'workload_outbox_lease_reaper_for_current_tip_expired_lease_unconsumed_capability_and_zero_provider_call_evidence',
]
const abortSchema = r13.outbox.invocation_aborted_before_provider_schema
abortSchema.properties.abort_actor_class = { type: 'enum', values: ['current_fenced_claim_worker', 'workload_outbox_lease_reaper'] }
abortSchema.properties.abort_reason = { type: 'enum', values: ['operation_authority_changed', 'payload_changed', 'provider_registry_changed', 'capability_invalid_but_unconsumed', 'reservation_budget_invalid', 'lease_expired_before_capability_consumption'] }
abortSchema.conditional_rules = [
  'current_fenced_claim_worker_requires_a_nonlease_abort_reason_current_tip_current_fence_unconsumed_capability_and_zero_provider_calls',
  'workload_outbox_lease_reaper_requires_lease_expired_before_capability_consumption_current_tip_unconsumed_capability_and_zero_provider_call_evidence',
]
replaceProperties(abortSchema, abortSchema.properties)
const abortRows = r13.outbox.transition_table.filter(row => row.event_kind === 'invocation_aborted_before_provider')
const abortIndex = r13.outbox.transition_table.indexOf(abortRows[0])
r13.outbox.transition_table.splice(abortIndex, 1,
  {
    from: 'invoking', to: 'failed', event_kind: 'invocation_aborted_before_provider',
    event_schema_ref: 'outbox.invocation_aborted_before_provider_schema', actor_authority_ref: 'outbox.actor_authority.abort_before_provider',
    condition: 'current_fenced_worker_and_exact_invocation_event_is_current_tip_and_capability_unconsumed_and_provider_call_count_zero_and_one_named_nonlease_final_recheck_failed', provider_call: false,
  },
  {
    from: 'invoking', to: 'failed', event_kind: 'invocation_aborted_before_provider',
    event_schema_ref: 'outbox.invocation_aborted_before_provider_schema', actor_authority_ref: 'outbox.actor_authority.abort_before_provider',
    condition: 'lease_reaper_and_exact_invocation_event_is_current_tip_and_lease_expired_and_capability_unconsumed_and_provider_call_count_zero_and_no_provider_call_evidence', provider_call: false,
  },
)
r13.outbox.provider_call_gate.final_recheck_outcome_table = [
  { condition: 'all_rechecks_pass_and_capability_is_atomically_consumed_now', action: 'call_provider_once', event: 'provider_outcome_follows', actor: 'current_fenced_claim_worker' },
  { condition: 'current_tip_and_unconsumed_capability_and_nonlease_authority_payload_or_registry_recheck_fails', action: 'append_invocation_aborted_before_provider_then_stop', actor: 'current_fenced_claim_worker' },
  { condition: 'current_tip_and_lease_expired_and_unconsumed_capability_and_zero_call_evidence', action: 'append_invocation_aborted_before_provider_then_stop', actor: 'workload_outbox_lease_reaper' },
  { condition: 'claim_fence_changed_or_current_worker_no_longer_owns_the_claim', action: 'do_not_append_do_not_call_and_leave_recovery_to_current_owner_or_reaper', actor: 'superseded_worker' },
  { condition: 'invocation_tip_was_superseded', action: 'do_not_append_do_not_call_and_reload_committed_successor', actor: 'current_fenced_claim_worker' },
  { condition: 'capability_already_consumed_or_call_may_have_started_and_invocation_tip_is_current', action: 'append_worker_ambiguity_and_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'current_fenced_claim_worker' },
  { condition: 'terminal_or_reaper_successor_already_exists', action: 'do_not_append_do_not_call_and_return_committed_terminal_or_ambiguity', actor: 'current_fenced_claim_worker' },
]
delete r13.outbox.provider_call_gate.any_failed_recheck
r13.outbox.provider_call_gate.totality = 'exactly_one_outcome_applies_after_a_serializable_current_tip_capability_lease_and_authority_recheck; no_fallthrough'
r13.outbox.transition_event_schema.properties.event_schema_version.const = 'ctrl.g24.outbox-transition-event.r13.v1'

// Refresh altered authoritative fingerprints before deriving schema changes.
for (const table of [
  'pending_release_projections', 'accepted_release_requests', 'release_authority_receipts', 'case_identities',
  'leader_authority_receipts', 'answer_receipts', 'lifecycle_action_receipts', 'lifecycle_precondition_evidence',
]) refreshRow(table)
r13.fingerprint_schemas.question_contract = fingerprint('CTRL-G24-QUESTION-CONTRACT-R13', Object.keys(question.properties).filter(key => key !== 'question_contract_fingerprint'))
r13.fingerprint_schemas.outbox_effect_origin = fingerprint('CTRL-G24-OUTBOX-EFFECT-ORIGIN-R13', Object.keys(origin.properties).filter(key => key !== 'origin_fingerprint'))
r13.fingerprint_schemas.outbox_effect = fingerprint('CTRL-G24-OUTBOX-EFFECT-R13', Object.keys(effect.properties).filter(key => key !== 'effect_fingerprint'))

// Bump every changed schema and synchronize all ABI pointers after the final operation set is known.
bumpChangedSchemas()
for (const name of r13.operation_names) {
  r13.operation_specs[name].result_schema = r13.result_payload_schemas[name].schema_version
  r13.evaluator_abi.operation_result_exports[name] = r13.result_payload_schemas[name].schema_version
}
replaceProperties(r13.evaluator_abi.operation_result_exports_schema, Object.fromEntries(
  r13.operation_names.map(name => [name, { const: r13.result_payload_schemas[name].schema_version }]),
))
bumpChangedSchemas()
repairEmbeddedSelfVersions()
bumpChangedSchemas()

const beforeNodes = schemaNodes(frozenR12)
const afterNodes = schemaNodes(r13)
const changes = []
for (const [path, after] of afterNodes) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r13.')) throw new Error(`changed_schema_without_r13_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r13.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R12_and_materialized_R13_plus_dependency_parity_checks',
  changes, every_changed_or_new_schema_must_have_r13_version: true,
  dependency_parity_checks: ['public_request_enum_equals_operation_names', 'operation_result_export_schema_equals_operation_names_and_result_versions', 'every_embedded_self_version_equals_containing_schema_version'],
}
r13.required_negative_fixture_families = [...new Set([...r13.required_negative_fixture_families,
  'public_operation_parity_and_pre_authority_release_compilation',
  'single_use_release_and_answer_authority',
  'canonical_case_identity_and_exact_visibility_joins',
  'nullable_lifecycle_genesis_and_authorized_precondition_evaluation',
  'single_lifecycle_receipt_family_and_exact_consumption_joins',
  'kernel_exact_question_acceptance_without_invented_restrictions',
  'provider_target_preimage_and_total_no_call_outcome_table',
  'transition_event_embedded_self_version',
])]
r13.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r13)
export const materializedR13 = r13
export const materializedR13Output = `${JSON.stringify(r13, null, 2)}\n`
export const materializedR13Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR13Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR13Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R13 effective contract`)
  } else process.stdout.write(materializedR13Output)
}
