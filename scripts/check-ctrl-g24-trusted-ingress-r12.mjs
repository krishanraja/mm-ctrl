import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR12, materializedR12Output } from './materialize-ctrl-g24-trusted-ingress-r12.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r12.json'
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
function collect(c) {
  const f = []
  const ok = (name, value) => { if (!value) f.push(name) }
  const operations = ['select_intervention', 'create_intervention', 'stage_intervention_edit', 'issue_intervention_presentation_challenge', 'record_intervention_visibility', 'approve_intervention', 'issue_leader_answer_authority', 'record_answer', 'correct_answer', 'record_answer_transcription_repair', 'record_leader_lifecycle_action', 'record_operator_lifecycle_action', 'combine_lifecycle_authority', 'apply_lifecycle_transition', 'compile_release', 'issue_release_authority', 'use_release', 'create_enrichment_plan', 'record_enrichment_attempt']
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r12.effective.v1' && c.materialization.frozen_input.sha256 === '63ea38d874712d1b364138015f8eab95530cf639f18bf844d48ba3f9099e632e')
  ok('operation parity', same(c.operation_names, operations) && operations.every(name => c.operation_specs[name] && c.result_payload_schemas[name] && c.operation_specs[name].result_schema === c.result_payload_schemas[name].schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name].schema_version))
  ok('closed operation export schema', exactClosed(c.evaluator_abi.operation_result_exports_schema) && c.evaluator_abi.operation_result_exports_schema.schema_version.includes('.r12.'))
  ok('proof export version repaired', exactClosed(c.evaluator_abi.proof_family_exports_schema) && c.evaluator_abi.proof_family_exports_schema.schema_version.includes('.r12.'))

  const projection = c.authoritative_row_schemas.pending_release_projections
  const release = c.authoritative_row_schemas.release_authority_receipts
  ok('projection independent of authority', exactClosed(projection) && !projection.properties.release_authority_receipt_ref && !projection.properties.release_authority_receipt_fingerprint && !c.authoritative_semantic_fingerprint_schemas.pending_release_projections.preimage_order.some(field => field.includes('authority')))
  ok('release authority one way', ['pending_projection_ref', 'projection_version_ref', 'pending_projection_fingerprint', 'projection_payload_fingerprint', 'accepted_release_request_ref', 'accepted_release_request_fingerprint'].every(field => release.properties[field]))
  ok('release issuance operation', c.operation_specs.issue_release_authority?.write_set?.includes('accepted_release_request') && c.operation_specs.issue_release_authority?.write_set?.includes('release_authority_receipt') && c.operation_specs.issue_release_authority?.read_set?.includes('exact_current_pending_projection'))
  ok('release request closed and resolved', exactClosed(c.authoritative_row_schemas.accepted_release_requests) && c.proof_authority.proof_family_resolution_map.pending_release_and_authority.extension_rows.some(row => row.table === 'accepted_release_requests') && c.proof_authority.proof_family_resolution_map.pending_release_and_authority.cross_row_equalities.length === 9)
  ok('leader issuance operation', c.operation_specs.issue_leader_answer_authority?.write_set?.includes('leader_authority_receipt') && c.operation_specs.issue_leader_answer_authority?.read_set?.includes('exact_named_leader_visibility_acknowledgement'))
  ok('answer principal exact', c.authoritative_row_schemas.answer_receipts.properties.named_leader_ref && c.authoritative_row_schemas.answer_receipts.properties.authenticated_principal_ref && c.answer_principal_derivation.authenticated_principal.includes('case_identity_named_leader_actor_ref') && c.proof_authority.proof_family_resolution_map.answer.extension_rows.some(row => row.table === 'case_identities'))
  ok('route atom exact', c.approval_authority_derivation.route_atom_kind === 'selector_selected_route_ask_iff_atom_kind_question; selector_selected_route_session_iff_atom_kind_session; every_other_selected_route_is_not_approvable')

  const q = c.proof_value_schemas.question_contract
  ok('question grammar bound exact', !Object.hasOwn(q.properties.options_or_comparator, 'max_items') && same(q.properties.options_or_comparator.conditional_max_items, { when_answer_grammar: 'ranked_choice', maximum: 5, other_grammars: 'no_contract_maximum_subject_to_intent_byte_limit' }))
  ok('question normalization exact', q.conditional_rules.some(rule => rule.includes('trimmed_nonempty_values')) && q.conditional_rules.some(rule => rule.startsWith('visible_wording_')) && c.proof_value_schemas.question_answer_effect.conditional_rules.some(rule => rule.includes('pending_human_owned_proposal')))
  ok('proposal type parity', c.proof_value_schemas.question_answer_effect.properties.pending_human_owned_proposal.value_schema.type === 'human_text' && c.authoritative_row_schemas.answer_receipts.properties.pending_human_owned_proposal.value_schema.type === 'human_text')

  const life = c.proof_authority.proof_family_resolution_map.lifecycle
  const lifeTables = life.extension_rows.map(row => row.table_alias ?? row.table)
  ok('lifecycle closed identities', lifeTables.includes('case_identities') && c.authoritative_row_schemas.lifecycle_transition_receipts.properties.identity_control_version_ref && c.authoritative_row_schemas.lifecycle_transition_receipts.properties.authority_version_ref)
  ok('lifecycle predecessor resolved', lifeTables.includes('predecessor_snapshot') && c.lifecycle_exact_derivation.predecessor_snapshot.includes('state_byte_equal_catalogue_from_state'))
  ok('lifecycle evidence resolved', lifeTables.includes('lifecycle_precondition_evidence') && exactClosed(c.authoritative_row_schemas.lifecycle_precondition_evidence) && c.lifecycle_exact_derivation.precondition_evidence_resolution.includes('authoritative_lifecycle_precondition_evidence_row'))
  ok('joint actions and consumptions resolved', lifeTables.includes('leader_action') && lifeTables.includes('operator_action') && lifeTables.includes('lifecycle_action_combination_consumptions') && lifeTables.includes('lifecycle_joint_transition_consumptions') && lifeTables.includes('lifecycle_single_action_transition_consumptions') && c.authoritative_row_schemas.lifecycle_action_combination_consumptions.unique_keys.some(key => same(key, ['action_receipt_ref'])) && c.operation_specs.apply_lifecycle_transition.branch_effects.single_human_authority.write_set.includes('single_action_transition_consumption'))

  const origin = c.outbox.effect_origin_schema
  ok('origin identifies committed operation', ['workspace_ref', 'subject_ref', 'source_operation_ref', 'source_operation_class', 'source_operation_result_fingerprint', 'successful_result_branch'].every(field => origin.properties[field]) && !origin.properties.source_operation_id)
  ok('origin uniquely consumes result branch', origin.unique_keys.some(key => same(key, ['workspace_ref', 'subject_ref', 'source_operation_class', 'source_operation_result_schema_version', 'source_operation_result_ref', 'source_operation_result_fingerprint', 'successful_result_branch'])) && c.outbox.genesis_protocol.unique_consumption.includes('at_most_one_origin_and_one_effect'))
  ok('provider target origin bound', origin.properties.provider_operation_ref && origin.properties.provider_target_fingerprint && c.outbox.effect_schema.properties.provider_target_fingerprint)
  const abort = c.outbox.transition_table.find(row => row.event_kind === 'invocation_aborted_before_provider')
  ok('aborted invocation executable', exactClosed(c.outbox.invocation_aborted_before_provider_schema) && abort?.from === 'invoking' && abort?.to === 'failed' && abort?.provider_call === false && c.outbox.invocation_aborted_before_provider_schema.properties.provider_call_count.const === 0 && c.outbox.invocation_aborted_before_provider_schema.properties.provider_called.const === false)
  ok('failed recheck maps to abort', c.outbox.provider_call_gate.any_failed_recheck === 'atomically_append_invocation_aborted_before_provider_from_the_current_invocation_tip_and_do_not_call_provider')

  ok('invalidation self version exact', c.release_invalidation.invalidation_receipt_schema.schema_version === 'ctrl.g24.release-invalidation-receipt.r12.v1' && c.release_invalidation.invalidation_receipt_schema.properties.receipt_schema_version.const === c.release_invalidation.invalidation_receipt_schema.schema_version)
  ok('derived version manifest', c.schema_change_manifest.derivation.startsWith('recursive_exact_object_comparison') && c.schema_change_manifest.changes.length >= 20 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r12.')))

  const refs = []
  const refKeys = new Set(['schema_ref', 'fingerprint_ref', 'member_schema_ref', 'actor_authority_ref', 'event_schema_ref', 'set_schema_ref', 'payload_schema_ref', 'semantic_fingerprint_ref', 'catalog_ref', 'source_operation_result_schema_ref', 'result_fingerprint_ref'])
  const walk = (value, path = '$') => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${path}[${index}]`))
    for (const [key, child] of Object.entries(value)) {
      if (refKeys.has(key) && typeof child === 'string' && ownRef(c, child) === undefined) refs.push(`${path}.${key}:${child}`)
      walk(child, `${path}.${key}`)
    }
  }
  walk(c)
  ok('closed reference graph', refs.length === 0)
  return f
}

if (read(path) !== materializedR12Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r11.json') !== '63ea38d874712d1b364138015f8eab95530cf639f18bf844d48ba3f9099e632e') failures.push('frozen R11 changed')
for (const failure of collect(materializedR12)) failures.push(failure)

const mutations = [
  ['restore release cycle', c => { c.authoritative_row_schemas.pending_release_projections.properties.release_authority_receipt_fingerprint = { type: 'sha256' } }],
  ['delete release issuer', c => { delete c.operation_specs.issue_release_authority }],
  ['unresolve release request', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.extension_rows = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.extension_rows.filter(row => row.table !== 'accepted_release_requests') }],
  ['delete leader issuer', c => { delete c.operation_specs.issue_leader_answer_authority }],
  ['splice answer principal', c => { delete c.authoritative_row_schemas.answer_receipts.properties.authenticated_principal_ref }],
  ['route atom vague', c => { c.approval_authority_derivation.route_atom_kind = 'compatible' }],
  ['cap all questions', c => { c.proof_value_schemas.question_contract.properties.options_or_comparator.max_items = 5 }],
  ['allow blank option', c => { c.proof_value_schemas.question_contract.conditional_rules = [] }],
  ['proposal type mismatch', c => { c.authoritative_row_schemas.answer_receipts.properties.pending_human_owned_proposal.value_schema = { type: 'identifier' } }],
  ['lifecycle identity prose only', c => { c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows = c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows.filter(row => row.table !== 'case_identities') }],
  ['lifecycle predecessor omitted', c => { c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows = c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows.filter(row => row.table_alias !== 'predecessor_snapshot') }],
  ['lifecycle evidence invented', c => { c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows = c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows.filter(row => row.table !== 'lifecycle_precondition_evidence') }],
  ['joint consumption omitted', c => { c.authoritative_row_schemas.lifecycle_action_combination_consumptions.unique_keys = [] }],
  ['origin confuses class and id', c => { c.outbox.effect_origin_schema.properties.source_operation_id = c.outbox.effect_origin_schema.properties.source_operation_ref }],
  ['origin reusable', c => { c.outbox.effect_origin_schema.unique_keys = [['origin_ref'], ['outbox_effect_ref']] }],
  ['origin target omitted', c => { delete c.outbox.effect_origin_schema.properties.provider_target_fingerprint }],
  ['abort transition omitted', c => { c.outbox.transition_table = c.outbox.transition_table.filter(row => row.event_kind !== 'invocation_aborted_before_provider') }],
  ['abort lies about call', c => { c.outbox.invocation_aborted_before_provider_schema.properties.provider_called = { type: 'boolean' } }],
  ['failed recheck strands tip', c => { c.outbox.provider_call_gate.any_failed_recheck = 'hold' }],
  ['invalidation self version stale', c => { c.release_invalidation.invalidation_receipt_schema.properties.receipt_schema_version.const = 'ctrl.g24.release-invalidation-receipt.r8.v1' }],
  ['operation export version stale', c => { c.evaluator_abi.operation_result_exports_schema.schema_version = 'ctrl.g24.evaluator-operation-result-exports.r9.v1' }],
  ['version manifest handwave', c => { c.schema_change_manifest.derivation = 'manual' }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR12)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R12 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R12 and ${mutations.length} mutation probes verified`)
console.log(`r12_machine_sha256=${sha(path)}`)
