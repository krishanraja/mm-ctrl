import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR15 } from './materialize-ctrl-g24-trusted-ingress-r15.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r15.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r16.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR15 = JSON.parse(inputBytes)
const r16 = structuredClone(materializedR15)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }

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
const withoutVersion = value => JSON.stringify({ ...value, schema_version: null })
const r16Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r16.') : `${version}.r16`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR15)
    for (const [path, after] of schemaNodes(r16)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r16.')) {
        after.schema_version = r16Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR15)
  for (const [path, after] of schemaNodes(r16)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      if (!field.endsWith('schema_version') || !property || typeof property !== 'object') continue
      const priorConst = prior.properties?.[field]?.const
      if (typeof priorConst === 'string' && property.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r16.schema_version = 'ctrl.g24.trusted-ingress.r16.effective.v1'
r16.status = 'fifteenth_repair_candidate_under_independent_review'
r16.supersedes = {
  commit: '0977caef12a0ef525702e23e0b248170b22c417d', tree: 'bc2f388b0931d6db6f35e7dcd7e881fbcce13f9e',
  human_blob: 'dc6ac63dc1c51482d9f3fe4ee3440c72e2a9d8be', machine_blob: 'c75c81c48d65b5c9f9dfc495ecdc44e3d90ed690',
  qa_blob: '151c693981d4e10b7a779d313ca93c765b674885', checker_blob: '9d30e424ceb82a144b75fd6bc1d2d5971cb28665',
  materializer_blob: '7dfacc58ec2151249cd5aac9286213da0776a184', founder_checker_blob: '799448145a9749e142e8b6bcc4777b6908ea6289',
  adjudication: 'veto',
}
r16.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r16.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// Canonical result bytes are a closed append-only record, not an unresolved identifier.
r16.operation_result_blob_store = {
  schema_version: 'ctrl.g24.operation-result-blob-store.r16.v1',
  row_schema: closed('ctrl.g24.operation-result-blob.r16.v1', {
    workspace_ref: id,
    canonical_result_payload_bytes_ref: id,
    result_schema_version: id,
    canonical_result_payload_b64url: { type: 'base64url_without_padding', max_decoded_bytes: 1048576 },
    canonical_result_payload_byte_length: { type: 'safe_nonnegative_integer', maximum: 1048576 },
    canonical_result_payload_bytes_sha256: fp,
    result_blob_fingerprint: fp,
    committed_at: ts,
  }, {
    append_only: true,
    unique_keys: [['workspace_ref', 'canonical_result_payload_bytes_ref']],
    conditional_rules: [
      'decoded_b64url_length_equals_canonical_result_payload_byte_length',
      'sha256_of_exact_decoded_bytes_equals_canonical_result_payload_bytes_sha256',
      'decoded_bytes_are_exact_canonical_json_for_result_schema_version',
      'result_blob_fingerprint_equals_recomputed_complete_blob_preimage',
    ],
  }),
  canonicalization_ref: 'canonical_field_encoding',
  row_fingerprint_ref: 'fingerprint_schemas.operation_result_blob',
  one_row_per_reference: true,
  mutation_or_rebinding: 'forbidden',
}
r16.fingerprint_schemas.operation_result_blob = fingerprint('CTRL-G24-OPERATION-RESULT-BLOB-R16', [
  'workspace_ref', 'canonical_result_payload_bytes_ref', 'result_schema_version',
  'canonical_result_payload_b64url', 'canonical_result_payload_byte_length',
  'canonical_result_payload_bytes_sha256', 'committed_at',
])
r16.operation_result_blob_store.row_schema.fingerprint_ref = 'fingerprint_schemas.operation_result_blob'
r16.operation_result_blob_store.row_schema.fingerprint_field = 'result_blob_fingerprint'
r16.operation_result_blob_store.row_schema.fingerprint_field_must_equal_referenced_preimage_digest = true

const committedSuccess = r16.operation_registry.committed_success_row_schema
const successProps = { ...committedSuccess.properties }
const priorCommittedAt = successProps.committed_at
delete successProps.committed_at
successProps.canonical_result_payload_bytes_sha256 = fp
successProps.committed_at = priorCommittedAt
successProps.committed_success_fingerprint = fp
replaceProperties(committedSuccess, successProps)
committedSuccess.conditional_rules = [
  ...committedSuccess.conditional_rules,
  'canonical_result_payload_bytes_ref_resolves_exactly_one_operation_result_blob_in_the_same_workspace',
  'result_schema_version_and_canonical_result_payload_bytes_sha256_equal_the_resolved_blob',
  'result_payload_fingerprint_is_recomputed_from_the_exact_decoded_canonical_blob_bytes_under_result_schema_version',
  'committed_success_fingerprint_equals_recomputed_complete_success_preimage',
]
committedSuccess.fingerprint_ref = 'fingerprint_schemas.operation_registry_committed_success'
committedSuccess.fingerprint_field = 'committed_success_fingerprint'
committedSuccess.fingerprint_field_must_equal_referenced_preimage_digest = true
r16.fingerprint_schemas.operation_registry_committed_success = fingerprint('CTRL-G24-OPERATION-REGISTRY-COMMITTED-SUCCESS-R16', Object.keys(committedSuccess.properties).filter(field => field !== 'committed_success_fingerprint'))
r16.operation_registry.stored_success = Object.keys(committedSuccess.properties).filter(field => !['workspace_ref', 'operation_id', 'state'].includes(field))
r16.operation_registry.committed_success_result_blob_derivation = {
  blob_schema_ref: 'operation_result_blob_store.row_schema',
  exact_equalities: [
    'success.workspace_ref_equals_blob.workspace_ref',
    'success.canonical_result_payload_bytes_ref_equals_blob.canonical_result_payload_bytes_ref',
    'success.result_schema_version_equals_blob.result_schema_version',
    'success.canonical_result_payload_bytes_sha256_equals_blob.canonical_result_payload_bytes_sha256',
    'success.result_payload_fingerprint_equals_recomputed_domain_fingerprint_of_blob.decoded_canonical_result_payload_bytes',
  ],
  commit_atomicity: 'result_blob_and_committed_success_row_commit_in_one_serializable_transaction_or_neither_exists',
  any_missing_duplicate_hash_length_schema_parse_or_fingerprint_mismatch: 'operation_commits_hold_without_success_or_protected_effect',
}
r16.release_terminal_consumption_derivation.operation_result_blob_schema_ref = 'operation_result_blob_store.row_schema'
r16.release_terminal_consumption_derivation.canonical_result_payload_bytes_rule = 'resolve_exactly_one_same_workspace_operation_result_blob_by_committed_success.canonical_result_payload_bytes_ref; verify_schema_length_content_sha256_and_blob_fingerprint; parse_exact_decoded_canonical_bytes_under_branch_result_schema; recompute_result_payload_fingerprint; extract_result_ref_and_terminal_receipt_from_declared_fields'
const releaseRecords = r16.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
releaseRecords.push({
  record_name: 'use_release_result_blob', schema_ref: 'operation_result_blob_store.row_schema',
  joins: [
    ['use_release_committed_success.workspace_ref', 'record.workspace_ref'],
    ['use_release_committed_success.canonical_result_payload_bytes_ref', 'record.canonical_result_payload_bytes_ref'],
    ['use_release_committed_success.result_schema_version', 'record.result_schema_version'],
    ['use_release_committed_success.canonical_result_payload_bytes_sha256', 'record.canonical_result_payload_bytes_sha256'],
    ['use_release_committed_success.result_payload_fingerprint', 'recomputed_branch_domain_fingerprint_of_record.decoded_canonical_result_payload_bytes'],
  ],
})

// Case authority is a scoped append-only row with one deterministic current selection.
const caseBinding = r16.case_authority_bindings
const semanticCaseFields = {
  workspace_ref: id,
  subject_ref: id,
  case_ref: caseBinding.properties.case_ref,
  case_authority_binding_ref: id,
  named_leader_ref: caseBinding.properties.named_leader_ref,
  engagement_operator_ref: caseBinding.properties.engagement_operator_ref,
  operator_grant_set_seal: caseBinding.properties.operator_grant_set_seal,
  workload_grant_set_seal: caseBinding.properties.workload_grant_set_seal,
  authority_version: caseBinding.properties.authority_version,
  case_authority_binding_fingerprint: fp,
}
const caseProps = {
  ...semanticCaseFields,
  row_version_ref: id,
  valid_from: ts,
  valid_until: ts,
  row_envelope_fingerprint: fp,
}
caseBinding.optional = ['valid_until']
replaceProperties(caseBinding, caseProps)
caseBinding.append_only = true
caseBinding.partition_key = ['workspace_ref', 'subject_ref', 'case_ref']
caseBinding.current_selection = 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_evaluated_at_and_valid_until_absent_or_gt_evaluated_at'
caseBinding.current_selection_unique_or_hold = true
caseBinding.unique_keys = [
  ['workspace_ref', 'case_ref', 'case_authority_binding_ref'],
  ['workspace_ref', 'case_ref', 'authority_version'],
]
caseBinding.semantic_fingerprint_ref = 'fingerprint_schemas.case_authority_binding'
caseBinding.semantic_fingerprint_field = 'case_authority_binding_fingerprint'
caseBinding.semantic_fingerprint_must_equal_referenced_preimage_digest = true
caseBinding.fingerprint_ref = 'fingerprint_schemas.case_authority_binding_row_envelope'
caseBinding.fingerprint_field = 'row_envelope_fingerprint'
caseBinding.fingerprint_field_must_equal_referenced_preimage_digest = true
r16.fingerprint_schemas.case_authority_binding = fingerprint('CTRL-G24-CASE-AUTHORITY-BINDING-R16', Object.keys(semanticCaseFields).filter(field => field !== 'case_authority_binding_fingerprint'))
r16.fingerprint_schemas.case_authority_binding_row_envelope = fingerprint('CTRL-G24-CASE-AUTHORITY-BINDING-ROW-ENVELOPE-R16', Object.keys(caseProps).filter(field => field !== 'row_envelope_fingerprint'))
r16.case_identity_derivation.source_authorities = [
  'exact_unique_current_case_authority_bindings_row_in_same_workspace_subject_case_and_snapshot',
  'complete_current_identity_controlling_watermark_member',
]
r16.case_identity_derivation.exact_byte_equalities.unshift(
  'case_identities.workspace_ref_subject_ref_equal_case_authority_bindings.workspace_ref_subject_ref',
  'case_authority_bindings_is_the_unique_current_row_for_workspace_ref_subject_ref_case_ref_at_the_same_snapshot',
)
r16.case_identity_derivation.source_schema_ref = 'case_authority_bindings'
r16.case_identity_derivation.freshness = 'row_current_iff_the_case_authority_binding_is_the_unique_current_scoped_row_and_identity_controlling_watermark_member_is_current_at_the_same_snapshot; otherwise_proof_schema_hold'

// Evaluator version and artifact are identical in the result, every evidence row and the selected member.
r16.lifecycle_evaluator_version_derivation = {
  evidence_equalities: [
    'every_lifecycle_precondition_evidence.evaluator_version_ref_equals_its_evaluator_semantic_version_and_exact_current_registry_member.semantic_version',
    'every_lifecycle_precondition_evidence.evaluator_artifact_sha256_equals_exact_current_registry_member.artifact_sha256',
  ],
  result_equalities: [
    'evaluate_lifecycle_preconditions.result.evaluator_version_ref_equals_every_written_evidence_row.evaluator_version_ref_and_exact_current_registry_member.semantic_version',
    'evaluate_lifecycle_preconditions.result.evaluator_artifact_sha256_equals_every_written_evidence_row.evaluator_artifact_sha256_and_exact_current_registry_member.artifact_sha256',
  ],
  disagreement: 'evaluator_identity_hold_with_no_evidence_rows',
}
r16.operation_specs.evaluate_lifecycle_preconditions.atomic_equalities.push(
  'result_evaluator_version_ref_and_evaluator_artifact_sha256_equal_every_written_evidence_row_and_the_exact_current_evaluator_registry_member',
)

// Repair the referenced predicate, then reject legacy lifecycle vocabulary across the whole effective graph.
const twoParty = r16.derived_authority_predicates.current_unconsumed_two_party_receipt_exact_case_actors_transition_and_predecessor
r16.derived_authority_predicates.current_unconsumed_two_party_receipt_exact_case_actors_transition_and_predecessor = twoParty.map(rule => rule
  .replaceAll('both_action_fingerprints', 'both_action_receipt_fingerprints')
  .replaceAll('joint_receipt_fingerprint', 'authority_receipt_fingerprint')
  .replaceAll('predecessor_lifecycle_version_match', 'predecessor_lifecycle_version_ref_match'))
r16.lifecycle_vocabulary_contract = {
  closure_scope: 'entire_materialized_effective_document_after_removing_only_this_forbidden_token_literal_array',
  forbidden_exact_tokens: [
    'predecessor_lifecycle_version', 'action_ref', 'action_fingerprint',
    'leader_action_ref', 'leader_action_fingerprint', 'operator_action_ref', 'operator_action_fingerprint',
    'joint_receipt_ref', 'joint_receipt_fingerprint',
  ],
  predecessor_ref_exception: 'the_nullable_predecessor_ref_form_is_the_only_allowed_predecessor_identity',
  no_manual_active_root_allowlist: true,
  any_forbidden_token_outside_literal_declaration: 'contract_invalid',
}

// A dead process cannot prove its volatile capability state: every expired current invoking tip is ambiguous.
const gate = r16.outbox.provider_call_gate
gate.final_recheck_outcome_table = {
  evaluation: 'first_matching_priority_ascending_over_one_serializable_current_tip_claim_fence_lease_capability_authority_payload_registry_and_terminal_snapshot',
  rows: [
    { priority: 1, guard: 'terminal_or_reaper_successor_exists', action: 'do_not_append_do_not_call_return_committed_successor', actor: 'current_worker_or_reaper' },
    { priority: 2, guard: 'invocation_tip_superseded_and_no_terminal_or_reaper_successor', action: 'do_not_append_do_not_call_reload_current_tip', actor: 'current_worker_or_reaper' },
    { priority: 3, guard: 'lease_expired_and_invocation_tip_still_current_and_no_successor', action: 'append_lease_expiry_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'workload_outbox_lease_reaper' },
    { priority: 4, guard: 'lease_live_and_claim_fence_changed_and_invocation_tip_still_current_and_no_successor', action: 'do_not_append_do_not_call_leave_resolution_to_current_owner', actor: 'superseded_worker' },
    { priority: 5, guard: 'lease_live_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor', action: 'append_worker_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'current_fenced_claim_worker' },
    { priority: 6, guard: 'current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_one_nonlease_authority_payload_registry_or_budget_recheck_failed_and_invocation_tip_still_current_and_no_successor', action: 'append_invocation_aborted_before_provider', actor: 'current_fenced_claim_worker' },
    { priority: 7, guard: 'all_rechecks_pass_and_current_fenced_worker_and_lease_live_and_invocation_tip_current_and_no_successor_and_capability_unconsumed', action: 'atomically_consume_single_use_process_capability_then_call_provider_once', actor: 'current_fenced_claim_worker' },
  ],
  exclusivity: 'first_match_precedence_makes_exactly_one_row_authoritative_even_when_raw_predicates_overlap',
  exhaustiveness: 'every_snapshot_matches_one_row; otherwise_pre_provider_hold_and_no_call',
  append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot: true,
}
gate.totality = 'ordered_first_match_is_exhaustive_and_transition_authority_is_derived_from_the_exact_selected_row; no_fallthrough_or_actor_choice'
gate.transition_authorization_derivation = {
  exact_append_rows: [
    { priority: 3, event_kind: 'lease_expiry_ambiguity', actor: 'workload_outbox_lease_reaper', transition: 'invoking_to_ambiguous' },
    { priority: 5, event_kind: 'worker_ambiguity', actor: 'current_fenced_claim_worker', transition: 'invoking_to_ambiguous' },
    { priority: 6, event_kind: 'invocation_aborted_before_provider', actor: 'current_fenced_claim_worker', transition: 'invoking_to_failed' },
  ],
  provider_call_row: { priority: 7, actor: 'current_fenced_claim_worker', capability_consumption: 'same_atomic_boundary_immediately_before_single_provider_call' },
  rule: 'no_transition_or_provider_call_is_authorized_by_a_raw_guard_alone; the_same_snapshot_must_select_the_exact_outcome_row_and_every_append_must_compare_and_swap_the_unchanged_current_tip',
}
const transitions = r16.outbox.transition_table
const workerAbortIndex = transitions.findIndex(row => row.event_kind === 'invocation_aborted_before_provider' && row.condition.startsWith('current_fenced_worker'))
transitions[workerAbortIndex].condition = 'selected_final_recheck_priority_6_and_current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_one_named_nonlease_final_recheck_failed_and_invocation_tip_still_current_and_no_successor'
for (let index = transitions.length - 1; index >= 0; index -= 1) {
  if (index !== workerAbortIndex && transitions[index].event_kind === 'invocation_aborted_before_provider') transitions.splice(index, 1)
}
const workerAmbiguity = transitions.find(row => row.event_kind === 'worker_ambiguity')
workerAmbiguity.condition = 'selected_final_recheck_priority_5_and_lease_live_and_current_fenced_claim_worker_and_(capability_consumed_or_provider_call_may_have_started)_and_invocation_tip_still_current_and_no_successor'
const reaperAmbiguity = transitions.find(row => row.event_kind === 'lease_expiry_ambiguity')
reaperAmbiguity.condition = 'selected_final_recheck_priority_3_and_lease_expired_and_invocation_tip_still_current_and_no_successor'
r16.outbox.actor_authority.abort_before_provider = [
  'current_fenced_claim_worker_for_selected_priority_6_current_tip_live_lease_unconsumed_capability_zero_provider_call_and_nonlease_recheck_failure',
]

bumpChangedSchemas()
for (const name of r16.operation_names) {
  r16.operation_specs[name].result_schema = r16.result_payload_schemas[name].schema_version
  r16.evaluator_abi.operation_result_exports[name] = r16.result_payload_schemas[name].schema_version
}
replaceProperties(r16.evaluator_abi.operation_result_exports_schema, Object.fromEntries(
  r16.operation_names.map(name => [name, { const: r16.result_payload_schemas[name].schema_version }]),
))
bumpChangedSchemas()
repairEmbeddedSelfVersions()
bumpChangedSchemas()

const beforeNodes = schemaNodes(frozenR15)
const afterNodes = schemaNodes(r16)
const changes = []
for (const [path, after] of afterNodes) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r16.')) throw new Error(`changed_schema_without_r16_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r16.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R15_and_materialized_R16_plus_result_blob_case_authority_global_lifecycle_evaluator_and_transition_equivalence_checks',
  changes, every_changed_or_new_schema_must_have_r16_version: true,
  dependency_parity_checks: [
    'canonical_result_payload_bytes_resolve_one_closed_append_only_content_hashed_blob_and_the_complete_success_envelope_is_fingerprinted',
    'case_authority_is_scoped_append_only_and_uniquely_current_at_the_case_identity_snapshot',
    'evaluator_version_and_artifact_are_equal_across_result_evidence_and_selected_registry_member',
    'legacy_lifecycle_vocabulary_is_rejected_across_the_whole_effective_document_without_a_manual_root_allowlist',
    'every_expired_current_invoking_tip_routes_to_reaper_ambiguity_and_transition_authority_equals_the_selected_outcome_row',
  ],
}
r16.required_negative_fixture_families = [...new Set([...r16.required_negative_fixture_families.filter(name => name !== 'lifecycle_action_reference_and_fingerprint_pairing'),
  'canonical_operation_result_blob_resolution', 'committed_success_envelope_fingerprint',
  'scoped_unique_current_case_authority', 'evaluator_result_artifact_identity',
  'whole_document_lifecycle_vocabulary_closure', 'expired_invocation_single_authority',
  'provider_outcome_transition_equivalence',
])]
r16.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r16)
export const materializedR16 = r16
export const materializedR16Output = `${JSON.stringify(r16, null, 2)}\n`
export const materializedR16Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR16Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR16Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R16 effective contract`)
  } else process.stdout.write(materializedR16Output)
}
