import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR13, materializedR13Output } from './materialize-ctrl-g24-trusted-ingress-r13.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r13.json'
const read = p => readFileSync(join(root, p), 'utf8')
const sha = p => createHash('sha256').update(read(p)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []

function ownRef(object, ref) {
  if (typeof ref !== 'string' || ref.split('.').some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) return undefined
  let value = object
  for (const key of ref.split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined
    value = value[key]
  }
  return value
}
function exactClosed(schema) {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
function hasJoin(rows, left, right) {
  return rows.some(row => row.some(value => value === left) && row.some(value => value === right))
}
function collect(c) {
  const f = []
  const ok = (name, value) => { if (!value) f.push(name) }
  const operations = [
    'select_intervention', 'create_intervention', 'stage_intervention_edit', 'issue_intervention_presentation_challenge',
    'record_intervention_visibility', 'approve_intervention', 'issue_leader_answer_authority', 'record_answer',
    'correct_answer', 'record_answer_transcription_repair', 'record_leader_lifecycle_action',
    'record_operator_lifecycle_action', 'combine_lifecycle_authority', 'evaluate_lifecycle_preconditions',
    'apply_lifecycle_transition', 'compile_release', 'issue_release_authority', 'use_release',
    'create_enrichment_plan', 'record_enrichment_attempt',
  ]
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r13.effective.v1' && c.materialization.frozen_input.sha256 === '8e530d681073afa4a5a461353c2b5e00c33199ce055103fe1f6195c1d78e3a06')
  ok('public operation parity', same(c.operation_names, operations) && c.request_schema.schema_version.includes('.r13.') && same(c.request_schema.properties.operation_class.values, operations))
  ok('complete operation parity', operations.every(name => c.operation_authority[name] && c.operation_specs[name] && c.result_payload_schemas[name] && c.operation_specs[name].result_schema === c.result_payload_schemas[name].schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name].schema_version))
  ok('closed operation export parity', exactClosed(c.evaluator_abi.operation_result_exports_schema) && same(Object.keys(c.evaluator_abi.operation_result_exports_schema.properties), operations) && operations.every(name => c.evaluator_abi.operation_result_exports_schema.properties[name].const === c.result_payload_schemas[name].schema_version))

  const compile = c.operation_specs.compile_release
  const projection = c.authoritative_row_schemas.pending_release_projections
  const request = c.authoritative_row_schemas.release_projection_requests
  const accepted = c.authoritative_row_schemas.accepted_release_requests
  const release = c.authoritative_row_schemas.release_authority_receipts
  const releaseConsumption = c.authoritative_row_schemas.release_authority_terminal_consumptions
  ok('pre-authority compile reachable', exactClosed(compile.intent) && !compile.intent.properties.accepted_release_request_ref && compile.write_set.includes('release_projection_request') && compile.write_set.includes('pending_release_projection') && exactClosed(request))
  ok('projection request and payload bound', ['release_projection_request_ref', 'release_projection_request_fingerprint', 'projection_payload_fingerprint'].every(field => projection.properties[field]) && compile.atomic_equalities.some(rule => rule.includes('projection_request_and_pending_projection')))
  ok('accepted request unique by projection', accepted.unique_keys.some(key => same(key, ['workspace_ref', 'subject_ref', 'case_ref', 'pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint'])) && accepted.properties.release_projection_request_ref && accepted.properties.release_projection_request_fingerprint)
  ok('release authority unambiguous', !release.properties.approval_receipt_ref && release.properties.release_projection_request_ref && release.unique_keys.some(key => same(key, ['accepted_release_request_ref'])))
  ok('release authority single use', exactClosed(releaseConsumption) && releaseConsumption.unique_keys.some(key => same(key, ['release_authority_receipt_ref'])) && Object.values(c.operation_specs.use_release.branch_effects).every(branch => branch.write_set.includes('release_authority_terminal_consumption')) && c.operation_specs.use_release.atomic_equalities.some(rule => rule.includes('both_terminal_branches_consume_exact_authority')))
  const releaseMap = c.proof_authority.proof_family_resolution_map.pending_release_and_authority
  ok('release request and consumption resolved', releaseMap.extension_rows.some(row => row.table === 'release_projection_requests' && row.owner_join_equalities.length === 2) && releaseMap.extension_rows.some(row => row.table === 'release_authority_terminal_consumptions' && row.owner_join_equalities.length === 3) && hasJoin(releaseMap.cross_row_equalities, 'release_authority_receipts.release_authority_receipt_ref', 'release_authority_terminal_consumptions.release_authority_receipt_ref'))

  const identity = c.authoritative_row_schemas.case_identities
  ok('case identity canonical', ['case_authority_version_ref', 'case_authority_binding_fingerprint', 'operator_grant_set_seal', 'workload_grant_set_seal', 'identity_watermark_member_fingerprint'].every(field => identity.properties[field]) && c.case_identity_derivation.source_authorities.length === 2 && c.case_identity_derivation.exact_byte_equalities.length === 6 && c.case_identity_derivation.production.includes('no_caller_supplied'))

  const leader = c.authoritative_row_schemas.leader_authority_receipts
  const answerMap = c.proof_authority.proof_family_resolution_map.answer
  const answerJoins = answerMap.cross_row_equalities
  ok('leader issuer exact', c.operation_specs.issue_leader_answer_authority.atomic_equalities.length === 3 && ['approval_receipt_ref', 'approval_receipt_fingerprint', 'approval_authority_version_ref', 'question_contract_fingerprint', 'visibility_receipt_ref', 'visibility_receipt_fingerprint', 'answer_surface_fingerprint'].every(field => c.operation_specs.issue_leader_answer_authority.intent.properties[field]))
  ok('leader visibility joined', hasJoin(answerJoins, 'leader_authority_receipts.visibility_receipt_ref', 'answer_visibility_acknowledgements.receipt_ref') && hasJoin(answerJoins, 'leader_authority_receipts.visibility_receipt_fingerprint', 'answer_visibility_acknowledgements.receipt_fingerprint') && hasJoin(answerJoins, 'leader_authority_receipts.answer_surface_fingerprint', 'answer_visibility_acknowledgements.answer_surface_fingerprint'))
  ok('leader identity and approval versions joined', hasJoin(answerJoins, 'leader_authority_receipts.approval_authority_version_ref', 'case_identities.authority_version_ref') && hasJoin(answerJoins, 'leader_authority_receipts.identity_control_version_ref', 'case_identities.identity_control_version_ref'))
  ok('answer authority single use', leader.unique_keys.some(key => same(key, ['visibility_receipt_ref'])) && exactClosed(c.authoritative_row_schemas.leader_answer_authority_consumptions) && c.authoritative_row_schemas.leader_answer_authority_consumptions.unique_keys.some(key => same(key, ['leader_authority_ref'])) && c.operation_specs.record_answer.write_set.includes('leader_answer_authority_consumption') && answerMap.extension_rows.some(row => row.table === 'leader_answer_authority_consumptions'))

  const action = c.authoritative_row_schemas.lifecycle_action_receipts
  const evaluate = c.operation_specs.evaluate_lifecycle_preconditions
  const evidence = c.authoritative_row_schemas.lifecycle_precondition_evidence
  const life = c.proof_authority.proof_family_resolution_map.lifecycle
  ok('lifecycle genesis executable', action.properties.predecessor_lifecycle_version_ref.type === 'nullable' && c.operation_specs.record_leader_lifecycle_action.intent.properties.predecessor_lifecycle_version_ref.type === 'nullable' && c.operation_specs.record_operator_lifecycle_action.intent.properties.predecessor_lifecycle_version_ref.type === 'nullable' && c.operation_specs.apply_lifecycle_transition.intent.properties.predecessor_lifecycle_snapshot_ref.type === 'nullable' && action.conditional_rules.some(rule => rule.startsWith('open_preparation_iff')))
  ok('one lifecycle schema family', !c.lifecycle_authority.action_schema && !c.lifecycle_authority.joint_receipt_schema && c.lifecycle_authority.action_schema_ref === 'authoritative_row_schemas.lifecycle_action_receipts' && c.lifecycle_authority.joint_receipt_schema_ref === 'authoritative_row_schemas.lifecycle_authority_receipts' && c.result_payload_schemas.record_leader_lifecycle_action.properties.action_receipt_ref && c.result_payload_schemas.combine_lifecycle_authority.properties.authority_receipt_ref)
  ok('lifecycle evidence executable', evaluate.write_set.includes('lifecycle_precondition_evidence') && evaluate.atomic_equalities.length === 3 && evidence.production_operation === 'evaluate_lifecycle_preconditions' && ['evidence_input_set_seal', 'evaluator_id', 'evaluator_semantic_version', 'evaluator_artifact_sha256', 'evaluator_manifest_sha256'].every(field => evidence.properties[field]))
  ok('evaluator evidence resolved', life.external_sealed_members?.some(member => member.set_name === 'evaluator_registry' && member.row_equalities.length === 4) && c.lifecycle_exact_derivation.precondition_evidence_resolution.includes('written_only_by_evaluate_lifecycle_preconditions'))
  for (const table of ['lifecycle_action_combination_consumptions', 'lifecycle_joint_transition_consumptions', 'lifecycle_single_action_transition_consumptions']) ok(`lifecycle consumption joined: ${table}`, life.extension_rows.find(row => row.table === table)?.owner_join_equalities.length > 0)
  ok('lifecycle consumption equalities exact', hasJoin(life.cross_row_equalities, 'owner.authority_receipt_ref', 'lifecycle_joint_transition_consumptions.joint_authority_receipt_ref') && hasJoin(life.cross_row_equalities, 'owner.transition_receipt_ref', 'lifecycle_single_action_transition_consumptions.transition_receipt_ref'))

  const q = c.proof_value_schemas.question_contract
  ok('question ranked bound exact', !Object.hasOwn(q.properties.options_or_comparator, 'max_items') && q.properties.options_or_comparator.conditional_max_items.when_answer_grammar === 'ranked_choice' && q.properties.options_or_comparator.conditional_max_items.maximum === 5)
  ok('question matches kernel acceptance', same(q.properties.options_or_comparator.item_constraints, ['exact_trimmed_nonempty', 'not_exact_reserved_default_or_offered_honest_exit']) && q.conditional_rules.some(rule => rule.includes('nonblank_after_trim_but_exact_original_bytes_are_preserved')) && same(q.conditional_rules.filter(rule => rule.includes('control_character')), ['no_additional_control_character_restriction_exists_beyond_the_locked_kernel_string_and_trim_checks']))

  const origin = c.outbox.effect_origin_schema
  const effect = c.outbox.effect_schema
  ok('genesis operation equality repaired', !c.outbox.genesis_protocol.exact_equalities.some(rule => rule.includes('source_operation_id')) && c.outbox.genesis_protocol.exact_equalities.some(rule => rule.includes('source_operation_ref_class_result_schema_version')))
  ok('provider operation vocabulary exact', !origin.properties.provider_operation_ref && origin.properties.provider_operation_class && !effect.properties.provider_operation_ref && effect.properties.provider_operation_class)
  ok('provider target preimage exact', exactClosed(c.provider_target_schema) && c.fingerprint_schemas.provider_target.preimage_order.includes('provider_capability_member_fingerprint') && c.provider_target_derivation.registry_schema_ref === 'provider_capability_schema' && c.provider_target_derivation.equalities.length === 3 && origin.properties.provider_ref && origin.properties.provider_key && origin.properties.provider_capability_member_fingerprint && effect.properties.provider_capability_member_fingerprint)
  const aborts = c.outbox.transition_table.filter(row => row.event_kind === 'invocation_aborted_before_provider')
  const outcomes = c.outbox.provider_call_gate.final_recheck_outcome_table
  ok('abort actor reason scoped', same(c.outbox.actor_authority.abort_before_provider, ['current_fenced_claim_worker_for_current_tip_unconsumed_capability_nonlease_recheck_failure', 'workload_outbox_lease_reaper_for_current_tip_expired_lease_unconsumed_capability_and_zero_provider_call_evidence']) && aborts.length === 2 && aborts.every(row => row.actor_authority_ref === 'outbox.actor_authority.abort_before_provider' && row.provider_call === false))
  ok('final recheck outcomes total', outcomes.length === 7 && outcomes.some(row => row.condition === 'invocation_tip_was_superseded' && row.action.includes('do_not_append_do_not_call')) && outcomes.some(row => row.condition.includes('claim_fence_changed') && row.actor === 'superseded_worker' && row.action.includes('do_not_append_do_not_call')) && outcomes.some(row => row.condition.includes('capability_already_consumed') && row.action.includes('ambiguity')) && c.outbox.provider_call_gate.totality.includes('no_fallthrough') && !c.outbox.provider_call_gate.any_failed_recheck)
  ok('abort schema reason scoped', exactClosed(c.outbox.invocation_aborted_before_provider_schema) && same(c.outbox.invocation_aborted_before_provider_schema.properties.abort_actor_class.values, ['current_fenced_claim_worker', 'workload_outbox_lease_reaper']) && !c.outbox.invocation_aborted_before_provider_schema.properties.abort_reason.values.includes('invocation_tip_superseded') && c.outbox.invocation_aborted_before_provider_schema.conditional_rules.length === 2)
  ok('transition self version exact', c.outbox.transition_event_schema.schema_version.includes('.r13.') && c.outbox.transition_event_schema.properties.event_schema_version.const === c.outbox.transition_event_schema.schema_version)

  ok('derived version manifest', c.schema_change_manifest.derivation.includes('frozen_R12') && c.schema_change_manifest.dependency_parity_checks.length === 3 && c.schema_change_manifest.changes.length >= 25 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r13.')))

  const refs = []
  const refKeys = new Set(['schema_ref', 'fingerprint_ref', 'member_schema_ref', 'actor_authority_ref', 'event_schema_ref', 'set_schema_ref', 'payload_schema_ref', 'semantic_fingerprint_ref', 'catalog_ref', 'source_operation_result_schema_ref', 'result_fingerprint_ref', 'registry_schema_ref', 'target_schema_ref'])
  const walk = (value, pathRef = '$') => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${pathRef}[${index}]`))
    for (const [key, child] of Object.entries(value)) {
      if (refKeys.has(key) && typeof child === 'string' && ownRef(c, child) === undefined) refs.push(`${pathRef}.${key}:${child}`)
      walk(child, `${pathRef}.${key}`)
    }
  }
  walk(c)
  ok('closed reference graph', refs.length === 0)
  return f
}

if (read(path) !== materializedR13Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r12.json') !== '8e530d681073afa4a5a461353c2b5e00c33199ce055103fe1f6195c1d78e3a06') failures.push('frozen R12 changed')
for (const failure of collect(materializedR13)) failures.push(failure)

const mutations = [
  ['public ABI omits authority issuer', c => { c.request_schema.properties.operation_class.values = c.request_schema.properties.operation_class.values.filter(name => name !== 'issue_release_authority') }],
  ['compile depends on future acceptance', c => { c.operation_specs.compile_release.intent.properties.accepted_release_request_ref = { type: 'identifier' } }],
  ['projection request unbound', c => { delete c.authoritative_row_schemas.pending_release_projections.properties.release_projection_request_fingerprint }],
  ['accepted request reusable by projection', c => { c.authoritative_row_schemas.accepted_release_requests.unique_keys = [['accepted_release_request_ref']] }],
  ['orphan release approval restored', c => { c.authoritative_row_schemas.release_authority_receipts.properties.approval_receipt_ref = { type: 'identifier' } }],
  ['release authority reusable', c => { c.authoritative_row_schemas.release_authority_terminal_consumptions.unique_keys = [] }],
  ['release consumption unresolved', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.extension_rows = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.extension_rows.filter(row => row.table !== 'release_authority_terminal_consumptions') }],
  ['terminal branch skips release consumption', c => { c.operation_specs.use_release.branch_effects.pending_delivery.write_set = c.operation_specs.use_release.branch_effects.pending_delivery.write_set.filter(name => name !== 'release_authority_terminal_consumption') }],
  ['case identity self authoritative', c => { c.case_identity_derivation.source_authorities = [] }],
  ['leader visibility fingerprint splice', c => { c.proof_authority.proof_family_resolution_map.answer.cross_row_equalities = c.proof_authority.proof_family_resolution_map.answer.cross_row_equalities.filter(row => !row.includes('leader_authority_receipts.visibility_receipt_fingerprint')) }],
  ['leader authority version splice', c => { c.proof_authority.proof_family_resolution_map.answer.cross_row_equalities = c.proof_authority.proof_family_resolution_map.answer.cross_row_equalities.filter(row => !row.includes('leader_authority_receipts.approval_authority_version_ref')) }],
  ['answer authority reusable', c => { c.authoritative_row_schemas.leader_answer_authority_consumptions.unique_keys = [] }],
  ['root predecessor nonnullable', c => { c.authoritative_row_schemas.lifecycle_action_receipts.properties.predecessor_lifecycle_version_ref = { type: 'identifier' } }],
  ['old lifecycle action family restored', c => { c.lifecycle_authority.action_schema = { type: 'object' } }],
  ['lifecycle evidence issuer removed', c => { c.operation_specs.evaluate_lifecycle_preconditions.write_set = [] }],
  ['lifecycle evaluator unbound', c => { delete c.proof_authority.proof_family_resolution_map.lifecycle.external_sealed_members }],
  ['lifecycle consumption join removed', c => { c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows.find(row => row.table === 'lifecycle_joint_transition_consumptions').owner_join_equalities = [] }],
  ['invent kernel control restriction', c => { c.proof_value_schemas.question_contract.conditional_rules.push('reject_all_control_characters') }],
  ['genesis uses removed operation id', c => { c.outbox.genesis_protocol.exact_equalities[0] = 'origin_source_operation_id_equals_result' }],
  ['provider target loses capability member', c => { c.fingerprint_schemas.provider_target.preimage_order = c.fingerprint_schemas.provider_target.preimage_order.filter(field => field !== 'provider_capability_member_fingerprint') }],
  ['provider vocabulary drifts', c => { c.outbox.effect_origin_schema.properties.provider_operation_ref = { type: 'identifier' } }],
  ['abort owned only by reaper', c => { c.outbox.actor_authority.abort_before_provider = ['workload_outbox_lease_reaper_predicate'] }],
  ['abort permits superseded tip lie', c => { c.outbox.invocation_aborted_before_provider_schema.properties.abort_reason.values.push('invocation_tip_superseded') }],
  ['tip supersession has no no-call outcome', c => { c.outbox.provider_call_gate.final_recheck_outcome_table = c.outbox.provider_call_gate.final_recheck_outcome_table.filter(row => row.condition !== 'invocation_tip_was_superseded') }],
  ['consumed capability mislabeled no-call', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.find(row => row.condition.includes('capability_already_consumed')).action = 'append_invocation_aborted_before_provider' }],
  ['transition embedded version stale', c => { c.outbox.transition_event_schema.properties.event_schema_version.const = 'ctrl.g24.outbox-transition-event.r9.v1' }],
  ['version manifest loses public parity', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR13)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R13 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R13 and ${mutations.length} mutation probes verified`)
console.log(`r13_machine_sha256=${sha(path)}`)
