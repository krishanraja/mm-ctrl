import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR13 } from './materialize-ctrl-g24-trusted-ingress-r13.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r13.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r14.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR13 = JSON.parse(inputBytes)
const r14 = structuredClone(materializedR13)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const text = { type: 'human_text' }
const nullable = value_schema => ({ type: 'nullable', value_schema })

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
  const schema = r14.authoritative_row_schemas[table]
  const semantic = schema.semantic_fingerprint_field
  const metadata = new Set(['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint'])
  r14.authoritative_semantic_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-SEMANTIC-${table.toUpperCase().replaceAll('_', '-')}-R14`, Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== semantic))
  r14.authoritative_row_fingerprint_schemas[table] = fingerprint(`CTRL-G24-AUTHORITATIVE-ROW-ENVELOPE-${table.toUpperCase().replaceAll('_', '-')}-R14`, Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'))
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
const r14Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r14.') : `${version}.r14`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR13)
    for (const [path, after] of schemaNodes(r14)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r14.')) {
        after.schema_version = r14Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR13)
  for (const [path, after] of schemaNodes(r14)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      if (!field.endsWith('schema_version') || !property || typeof property !== 'object') continue
      const priorConst = prior.properties?.[field]?.const
      if (typeof priorConst === 'string' && property.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r14.schema_version = 'ctrl.g24.trusted-ingress.r14.effective.v1'
r14.status = 'thirteenth_repair_candidate_under_independent_review'
r14.supersedes = {
  commit: '6452461bd48fd451623b0fde3c9a36d0108ca47e', tree: '5dd3a287f829ce2a65263321e2343d4931bec4c5',
  human_blob: '7b875fd283f044b00ad453f33feecba193c656c1', machine_blob: 'a4e0a3c0a019bf8c3ebb496a545059df6400c97c',
  qa_blob: 'c62b84b6996aa0d8303383d8e45ecf9d0352936c', checker_blob: 'f4b8ad129d21c0975518adc82143b1d1b4b79d02',
  materializer_blob: '8f9c64274b60a6c80626913a7038d01e3351f873', founder_checker_blob: '722c2c815d268b7f9c1a0953f2d7b9039910176e',
  adjudication: 'veto',
}
r14.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r14.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// Provider operation class is one recursive vocabulary, including identities and fingerprints.
function migrateProviderOperationVocabulary(value, path = '$') {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (typeof value[index] === 'string') value[index] = value[index].replaceAll('provider_operation_ref', 'provider_operation_class')
      else migrateProviderOperationVocabulary(value[index], `${path}[${index}]`)
    }
    return
  }
  if (Object.hasOwn(value, 'provider_operation_ref')) {
    if (Object.hasOwn(value, 'provider_operation_class') && JSON.stringify(value.provider_operation_class) !== JSON.stringify(value.provider_operation_ref)) throw new Error(`provider_operation_vocabulary_collision:${path}`)
    if (!Object.hasOwn(value, 'provider_operation_class')) value.provider_operation_class = value.provider_operation_ref
    delete value.provider_operation_ref
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string') value[key] = child.replaceAll('provider_operation_ref', 'provider_operation_class')
    else migrateProviderOperationVocabulary(child, `${path}.${key}`)
  }
}
migrateProviderOperationVocabulary(r14)
r14.provider_target_derivation.equalities = [
  'target.provider_ref_byte_equals_selected_member.provider_ref',
  'target.provider_operation_class_byte_equals_selected_member.operation_class',
  'target.provider_key_grammar_version_byte_equals_selected_member.provider_key_grammar_version',
  'target.verification_source_ref_byte_equals_selected_member.verification_source_ref',
  'target.active_from_byte_equals_selected_member.active_from',
  'target.active_until_byte_equals_selected_member.active_until',
  'target.provider_capability_member_fingerprint_byte_equals_selected_member.member_fingerprint',
  'target.provider_target_fingerprint_equals_recomputed_complete_target_preimage',
  'origin_and_effect_provider_ref_operation_class_capability_member_fingerprint_and_target_fingerprint_byte_equal_the_target',
  'provider_key_is_canonical_under_the_selected_member_provider_key_grammar_version',
]

// Canonical case authority now has an exact complete fingerprint.
const caseBinding = r14.case_authority_bindings
caseBinding.schema_version = 'ctrl.g24.case-authority-binding.r14.v1'
caseBinding.type = 'object'
caseBinding.properties.case_authority_binding_fingerprint = fp
caseBinding.exact_keys = Object.keys(caseBinding.properties)
caseBinding.required = [...caseBinding.exact_keys]
caseBinding.fingerprint_ref = 'fingerprint_schemas.case_authority_binding'
caseBinding.fingerprint_field = 'case_authority_binding_fingerprint'
caseBinding.fingerprint_field_must_equal_referenced_preimage_digest = true
r14.fingerprint_schemas.case_authority_binding = fingerprint('CTRL-G24-CASE-AUTHORITY-BINDING-R14', Object.keys(caseBinding.properties).filter(field => field !== 'case_authority_binding_fingerprint'))
r14.case_identity_derivation.exact_byte_equalities.push('case_identities.case_authority_binding_fingerprint_equals_recomputed_case_authority_bindings.case_authority_binding_fingerprint')
r14.case_identity_derivation.source_schema_ref = 'case_authority_bindings'

// Release consumption resolves one committed use_release result and exact branch.
r14.operation_registry_committed_success_schema = closed('ctrl.g24.operation-registry-committed-success.r14.v1', {
  workspace_ref: id, operation_ref: id, operation_class: { const: 'use_release' }, requested_case_ref: id,
  stable_principal_ref: id, response_schema_version: id, result_schema_version: id,
  canonical_result_payload_bytes_ref: id, result_ref: id, result_payload_fingerprint: fp,
  successful_result_branch: { type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] },
  snapshot_fingerprint: fp, committed_at: ts,
}, { append_only: true, unique_keys: [['workspace_ref', 'operation_ref']] })
const releaseConsumption = r14.authoritative_row_schemas.release_authority_terminal_consumptions
releaseConsumption.properties.terminal_result_schema_version = id
releaseConsumption.properties.terminal_result_fingerprint = fp
releaseConsumption.properties.terminal_result_branch = { type: 'enum', values: ['pending_delivery', 'invalidated_before_use'] }
releaseConsumption.properties.terminal_receipt_ref = id
replaceProperties(releaseConsumption, releaseConsumption.properties)
r14.release_terminal_consumption_derivation = {
  operation_registry_schema_ref: 'operation_registry_committed_success_schema',
  exact_equalities: [
    'consumption.workspace_ref_case_ref_use_release_operation_ref_equal_committed_success.workspace_ref_requested_case_ref_operation_ref',
    'committed_success.operation_class_is_use_release_and_stable_principal_ref_equals_exact_named_leader',
    'consumption.terminal_result_schema_version_result_ref_result_fingerprint_and_branch_equal_committed_success.result_schema_version_result_ref_result_payload_fingerprint_and_successful_result_branch',
    'consumption.outcome_equals_consumption.terminal_result_branch',
  ],
  branch_table: [
    { branch: 'pending_delivery', result_schema_ref: 'result_payload_schemas.use_release.variants.pending_delivery', terminal_receipt_field: 'release_use_receipt_ref', authority_consumption_and_result_commit: 'same_serializable_transaction' },
    { branch: 'invalidated_before_use', result_schema_ref: 'result_payload_schemas.use_release.variants.invalidated_before_use', terminal_receipt_field: 'invalidation_receipt_ref', authority_consumption_and_result_commit: 'same_serializable_transaction' },
  ],
  any_mismatch: 'request_rejected_without_consumption_result_or_outbox_write',
}
const releaseMap = r14.proof_authority.proof_family_resolution_map.pending_release_and_authority
releaseMap.external_authoritative_records = [{
  record_name: 'use_release_committed_success', schema_ref: 'operation_registry_committed_success_schema',
  joins: [
    ['release_authority_terminal_consumptions.use_release_operation_ref', 'record.operation_ref'],
    ['release_authority_terminal_consumptions.terminal_result_schema_version', 'record.result_schema_version'],
    ['release_authority_terminal_consumptions.terminal_result_ref', 'record.result_ref'],
    ['release_authority_terminal_consumptions.terminal_result_fingerprint', 'record.result_payload_fingerprint'],
    ['release_authority_terminal_consumptions.terminal_result_branch', 'record.successful_result_branch'],
    ['release_authority_terminal_consumptions.outcome', 'record.successful_result_branch'],
  ],
}]

// Human and lifecycle consumption binds both references and fingerprints.
const answerMap = r14.proof_authority.proof_family_resolution_map.answer
const answerConsumptionExtension = answerMap.extension_rows.find(row => row.table === 'leader_answer_authority_consumptions')
answerConsumptionExtension.owner_join_equalities.push({ owner_row_field: 'leader_authority_fingerprint', dependency_row_field: 'leader_authority_fingerprint' })
answerMap.cross_row_equalities.push(['owner.leader_authority_fingerprint', 'leader_authority_receipts.leader_authority_fingerprint', 'leader_answer_authority_consumptions.leader_authority_fingerprint'])

const lifeMap = r14.proof_authority.proof_family_resolution_map.lifecycle
const leaderCombination = lifeMap.extension_rows.find(row => row.table_alias === 'leader_action_consumption')
const operatorCombination = lifeMap.extension_rows.find(row => row.table_alias === 'operator_action_consumption')
leaderCombination.owner_join_equalities.splice(1, 0, { owner_row_field: 'leader_action_receipt_fingerprint', dependency_row_field: 'action_receipt_fingerprint' })
operatorCombination.owner_join_equalities.splice(1, 0, { owner_row_field: 'operator_action_receipt_fingerprint', dependency_row_field: 'action_receipt_fingerprint' })
lifeMap.cross_row_equalities.push(
  ['owner.leader_action_receipt_fingerprint', 'leader_action.action_receipt_fingerprint', 'leader_action_consumption.action_receipt_fingerprint'],
  ['owner.operator_action_receipt_fingerprint', 'operator_action.action_receipt_fingerprint', 'operator_action_consumption.action_receipt_fingerprint'],
)
lifeMap.conditional_cross_row_equalities = [
  {
    when: 'authority_kind_single_human_and_actor_class_resolves_named_leader',
    equalities: [
      ['owner.leader_action_receipt_ref', 'lifecycle_single_action_transition_consumptions.action_receipt_ref'],
      ['owner.leader_action_receipt_fingerprint', 'lifecycle_single_action_transition_consumptions.action_receipt_fingerprint'],
    ], requires: ['lifecycle_single_action_transition_consumptions.actor_role_named_leader', 'owner.operator_action_receipt_ref_and_fingerprint_null'],
  },
  {
    when: 'authority_kind_single_human_and_actor_class_resolves_krish',
    equalities: [
      ['owner.operator_action_receipt_ref', 'lifecycle_single_action_transition_consumptions.action_receipt_ref'],
      ['owner.operator_action_receipt_fingerprint', 'lifecycle_single_action_transition_consumptions.action_receipt_fingerprint'],
    ], requires: ['lifecycle_single_action_transition_consumptions.actor_role_krish', 'owner.leader_action_receipt_ref_and_fingerprint_null'],
  },
  {
    when: 'authority_kind_joint_human',
    equalities: [
      ['owner.leader_action_receipt_ref', 'leader_action_consumption.action_receipt_ref'],
      ['owner.leader_action_receipt_fingerprint', 'leader_action_consumption.action_receipt_fingerprint'],
      ['owner.operator_action_receipt_ref', 'operator_action_consumption.action_receipt_ref'],
      ['owner.operator_action_receipt_fingerprint', 'operator_action_consumption.action_receipt_fingerprint'],
    ], requires: ['two_distinct_action_receipt_refs_and_two_distinct_action_consumption_rows', 'no_single_action_transition_consumption'],
  },
]

// One nullable lifecycle action identity replaces every inherited R8 projection.
const transitionId = structuredClone(r14.authoritative_row_schemas.lifecycle_action_receipts.properties.transition_id)
r14.lifecycle_authority.stable_action_projection_schema = closed('ctrl.g24.lifecycle-action-secondary-idempotency.r14.v1', {
  case_ref: id, stable_actor_ref: id, actor_class: { type: 'enum', values: ['named_leader', 'krish_operator'] },
  identity_control_version_ref: id, authority_version_ref: id, transition_id: transitionId,
  predecessor_lifecycle_version_ref: nullable(id), nonce: id, projection_fingerprint: fp,
})
r14.lifecycle_authority.stable_action_projection_schema.conditional_rules = ['open_preparation_iff_predecessor_null_and_no_current_lifecycle_row; every_other_transition_requires_nonnull_exact_current_predecessor_matching_catalogue_from_state']
r14.lifecycle_authority.stable_action_projection_schema.fingerprint_ref = 'fingerprint_schemas.lifecycle_action_secondary_idempotency'
r14.lifecycle_authority.stable_action_projection_schema.fingerprint_field = 'projection_fingerprint'
r14.lifecycle_authority.stable_action_projection_schema.fingerprint_field_must_equal_referenced_preimage_digest = true
r14.fingerprint_schemas.lifecycle_action_secondary_idempotency = fingerprint('CTRL-G24-LIFECYCLE-ACTION-SECONDARY-IDEMPOTENCY-R14', [
  'case_ref', 'stable_actor_ref', 'actor_class', 'identity_control_version_ref', 'authority_version_ref',
  'transition_id', 'predecessor_lifecycle_version_ref', 'nonce',
])
r14.lifecycle_authority.action_fingerprint_ref = 'authoritative_semantic_fingerprint_schemas.lifecycle_action_receipts'
r14.lifecycle_authority.joint_receipt_fingerprint_ref = 'authoritative_semantic_fingerprint_schemas.lifecycle_authority_receipts'
r14.lifecycle_authority.action_combination_consumption_fingerprint_ref = 'authoritative_semantic_fingerprint_schemas.lifecycle_action_combination_consumptions'
r14.lifecycle_authority.joint_transition_consumption_fingerprint_ref = 'authoritative_semantic_fingerprint_schemas.lifecycle_joint_transition_consumptions'

// Evaluator version is exactly the registry semantic version everywhere it appears.
const evaluatorMember = lifeMap.external_sealed_members.find(member => member.set_name === 'evaluator_registry')
evaluatorMember.row_equalities.push(['lifecycle_precondition_evidence.evaluator_version_ref', 'member.semantic_version'])
r14.lifecycle_evaluator_version_derivation = {
  evidence_equality: 'every_lifecycle_precondition_evidence.evaluator_version_ref_equals_its_evaluator_semantic_version_and_exact_current_registry_member.semantic_version',
  result_equality: 'evaluate_lifecycle_preconditions.result.evaluator_version_ref_equals_every_written_evidence_row.evaluator_version_ref',
  disagreement: 'evaluator_identity_hold_with_no_evidence_rows',
}

// Retirement references preserve the kernel's exact trimmed-string contract, not identifier grammar.
const retireRefs = r14.authoritative_row_schemas.answer_receipts.properties.retired_intervention_refs
retireRefs.items = text
retireRefs.item_constraints = ['string', 'exact_trimmed_nonempty']
r14.proof_value_schemas.question_answer_effect.properties.retire_intervention_refs.items = text
r14.proof_value_schemas.question_answer_effect.properties.retire_intervention_refs.item_constraints = ['string', 'exact_trimmed_nonempty']
r14.question_kernel_exact_retirement_reference_rule = 'array_unique_and_every_member_is_a_string_nonblank_after_trim_and_byte_equal_its_trimmed_value; no_identifier_grammar_is_applied'

// Final rechecks use one ordered snapshot and first-match precedence.
r14.outbox.provider_call_gate.final_recheck_outcome_table = {
  evaluation: 'first_matching_priority_ascending_over_one_serializable_current_tip_claim_fence_lease_capability_authority_payload_registry_and_terminal_snapshot',
  rows: [
    { priority: 1, guard: 'terminal_or_reaper_successor_exists', action: 'do_not_append_do_not_call_return_committed_successor', actor: 'current_worker_or_reaper' },
    { priority: 2, guard: 'invocation_tip_superseded_and_no_terminal_or_reaper_successor', action: 'do_not_append_do_not_call_reload_current_tip', actor: 'current_worker' },
    { priority: 3, guard: 'claim_fence_changed_and_invocation_tip_still_current_and_no_successor', action: 'do_not_append_do_not_call_leave_resolution_to_current_owner_or_reaper', actor: 'superseded_worker' },
    { priority: 4, guard: 'capability_consumed_or_provider_call_may_have_started_and_invocation_tip_still_current_and_no_successor', action: 'append_worker_ambiguity_never_auto_resend_without_current_exact_idempotency_guarantee', actor: 'current_fenced_claim_worker' },
    { priority: 5, guard: 'lease_expired_and_capability_proven_unconsumed_and_zero_call_evidence_and_invocation_tip_still_current_and_no_successor', action: 'append_invocation_aborted_before_provider', actor: 'workload_outbox_lease_reaper' },
    { priority: 6, guard: 'current_fenced_worker_and_capability_proven_unconsumed_and_zero_call_evidence_and_one_nonlease_authority_payload_registry_or_budget_recheck_failed_and_invocation_tip_still_current_and_no_successor', action: 'append_invocation_aborted_before_provider', actor: 'current_fenced_claim_worker' },
    { priority: 7, guard: 'all_rechecks_pass_and_invocation_tip_current_and_no_successor_and_capability_unconsumed', action: 'atomically_consume_single_use_process_capability_then_call_provider_once', actor: 'current_fenced_claim_worker' },
  ],
  exclusivity: 'first_match_precedence_makes_exactly_one_row_authoritative_even_when_raw_predicates_overlap',
  exhaustiveness: 'every_snapshot_matches_one_row; otherwise_pre_provider_hold_and_no_call',
  append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot: true,
}
r14.outbox.provider_call_gate.totality = 'ordered_first_match_is_exhaustive_and_append_actions_require_compare_and_swap_against_the_same_snapshot; no_fallthrough_or_implementation_choice'

// New abort actor identity is included in its fingerprint.
r14.fingerprint_schemas.invocation_aborted_before_provider = fingerprint('CTRL-G24-INVOCATION-ABORTED-BEFORE-PROVIDER-R14', Object.keys(r14.outbox.invocation_aborted_before_provider_schema.properties).filter(field => field !== 'abort_fingerprint'))

for (const table of ['case_identities', 'release_authority_terminal_consumptions', 'answer_receipts']) refreshRow(table)

bumpChangedSchemas()
for (const name of r14.operation_names) {
  r14.operation_specs[name].result_schema = r14.result_payload_schemas[name].schema_version
  r14.evaluator_abi.operation_result_exports[name] = r14.result_payload_schemas[name].schema_version
}
replaceProperties(r14.evaluator_abi.operation_result_exports_schema, Object.fromEntries(
  r14.operation_names.map(name => [name, { const: r14.result_payload_schemas[name].schema_version }]),
))
bumpChangedSchemas()
repairEmbeddedSelfVersions()
bumpChangedSchemas()

const beforeNodes = schemaNodes(frozenR13)
const afterNodes = schemaNodes(r14)
const changes = []
for (const [path, after] of afterNodes) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r14.')) throw new Error(`changed_schema_without_r14_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r14.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R13_and_materialized_R14_plus_recursive_vocabulary_and_semantic_equality_checks',
  changes, every_changed_or_new_schema_must_have_r14_version: true,
  dependency_parity_checks: [
    'no_provider_operation_ref_token_exists_anywhere_in_effective_document',
    'every_terminal_release_consumption_field_resolves_to_one_committed_use_release_result_and_exact_branch',
    'every_authority_and_lifecycle_consumption_joins_both_reference_and_fingerprint',
    'every_fingerprint_preimage_field_has_an_exact_source_equality',
    'ordered_provider_outcomes_have_contiguous_unique_priorities_and_first_match_semantics',
  ],
}
r14.required_negative_fixture_families = [...new Set([...r14.required_negative_fixture_families,
  'recursive_provider_operation_class_vocabulary', 'terminal_release_result_and_branch_consumption',
  'case_authority_binding_fingerprint', 'lifecycle_action_reference_and_fingerprint_pairing',
  'nullable_stable_lifecycle_action_projection', 'evaluator_version_registry_equality',
  'provider_target_complete_preimage_equality', 'kernel_exact_retirement_reference_strings',
  'ordered_exhaustive_provider_final_rechecks',
])]
r14.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r14)
export const materializedR14 = r14
export const materializedR14Output = `${JSON.stringify(r14, null, 2)}\n`
export const materializedR14Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR14Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR14Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R14 effective contract`)
  } else process.stdout.write(materializedR14Output)
}
