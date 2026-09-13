import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR14, materializedR14Output } from './materialize-ctrl-g24-trusted-ingress-r14.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r14.json'
const read = p => readFileSync(join(root, p), 'utf8')
const sha = p => createHash('sha256').update(read(p)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []

function exactClosed(schema) {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
function collect(c) {
  const f = []
  const ok = (name, value) => { if (!value) f.push(name) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r14.effective.v1' && c.materialization.frozen_input.sha256 === '4dd0f8694c68aba2a61b3e1ec0699c9844327df73ac3fa8b74691910a4b8267d')
  ok('public ABI preserved', same(c.request_schema.properties.operation_class.values, c.operation_names) && c.operation_names.length === 20 && c.operation_names.every(name => c.operation_specs[name]?.result_schema === c.result_payload_schemas[name]?.schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name]?.schema_version))

  const serialized = JSON.stringify(c)
  ok('provider vocabulary recursively complete', (serialized.match(/provider_operation_ref/g) ?? []).length === 1 && c.schema_change_manifest.dependency_parity_checks.includes('no_provider_operation_ref_token_exists_anywhere_in_effective_document'))
  ok('provider class in identities', c.outbox.effect_schema.unique_keys.flat().includes('provider_operation_class') && c.outbox.retry_identity.includes('provider_operation_class') && c.outbox.dispatch_identity_fields.includes('provider_operation_class') && c.fingerprint_schemas.outbox_effect.preimage_order.includes('provider_operation_class'))
  const targetFields = ['provider_ref', 'provider_operation_class', 'provider_key_grammar_version', 'verification_source_ref', 'active_from', 'active_until', 'provider_capability_member_fingerprint']
  ok('provider target complete equalities', targetFields.every(field => c.fingerprint_schemas.provider_target.preimage_order.includes(field)) && targetFields.every(field => c.provider_target_derivation.equalities.some(rule => rule.includes(`target.${field}`))) && c.provider_target_derivation.equalities.some(rule => rule.includes('origin_and_effect')))

  const binding = c.case_authority_bindings
  ok('case authority fingerprinted', exactClosed(binding) && binding.properties.case_authority_binding_fingerprint && binding.fingerprint_ref === 'fingerprint_schemas.case_authority_binding' && same(c.fingerprint_schemas.case_authority_binding.preimage_order.slice(1), Object.keys(binding.properties).filter(field => field !== 'case_authority_binding_fingerprint')))
  ok('case identity binds canonical fingerprint', c.case_identity_derivation.source_schema_ref === 'case_authority_bindings' && c.case_identity_derivation.exact_byte_equalities.some(rule => rule.includes('case_authority_binding_fingerprint_equals_recomputed')))

  const releaseConsumption = c.authoritative_row_schemas.release_authority_terminal_consumptions
  const releaseFields = ['use_release_operation_ref', 'terminal_result_schema_version', 'terminal_result_ref', 'terminal_result_fingerprint', 'terminal_result_branch', 'terminal_receipt_ref', 'outcome']
  ok('release terminal fields complete', releaseFields.every(field => releaseConsumption.properties[field]))
  ok('release committed result schema closed', exactClosed(c.operation_registry_committed_success_schema) && c.operation_registry_committed_success_schema.properties.operation_class.const === 'use_release')
  ok('release exact result joins', c.release_terminal_consumption_derivation.exact_equalities.length === 4 && same(c.release_terminal_consumption_derivation.branch_table.map(row => row.branch), ['pending_delivery', 'invalidated_before_use']) && c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0].joins.length === 6)

  const answerConsumption = c.proof_authority.proof_family_resolution_map.answer.extension_rows.find(row => row.table === 'leader_answer_authority_consumptions')
  ok('answer authority fingerprint consumed', answerConsumption.owner_join_equalities.some(join => join.owner_row_field === 'leader_authority_fingerprint' && join.dependency_row_field === 'leader_authority_fingerprint') && c.proof_authority.proof_family_resolution_map.answer.cross_row_equalities.some(row => row.includes('leader_answer_authority_consumptions.leader_authority_fingerprint')))

  const stableAction = c.lifecycle_authority.stable_action_projection_schema
  ok('stable lifecycle action nullable and current', exactClosed(stableAction) && stableAction.schema_version.includes('.r14.') && stableAction.properties.predecessor_lifecycle_version_ref.type === 'nullable' && !stableAction.properties.predecessor_lifecycle_version && stableAction.conditional_rules[0].startsWith('open_preparation_iff'))
  ok('lifecycle fingerprints use authoritative family', c.lifecycle_authority.action_fingerprint_ref === 'authoritative_semantic_fingerprint_schemas.lifecycle_action_receipts' && c.lifecycle_authority.joint_receipt_fingerprint_ref === 'authoritative_semantic_fingerprint_schemas.lifecycle_authority_receipts')
  const life = c.proof_authority.proof_family_resolution_map.lifecycle
  const leaderCombination = life.extension_rows.find(row => row.table_alias === 'leader_action_consumption')
  const operatorCombination = life.extension_rows.find(row => row.table_alias === 'operator_action_consumption')
  ok('joint consumption pairs refs and fingerprints', leaderCombination.owner_join_equalities.some(join => join.owner_row_field === 'leader_action_receipt_fingerprint') && operatorCombination.owner_join_equalities.some(join => join.owner_row_field === 'operator_action_receipt_fingerprint'))
  const joint = life.conditional_cross_row_equalities.find(rule => rule.when === 'authority_kind_joint_human')
  ok('joint actions separate not equated', joint.equalities.length === 4 && joint.equalities.every(pair => pair.length === 2) && joint.requires.includes('two_distinct_action_receipt_refs_and_two_distinct_action_consumption_rows'))
  ok('single consumption pairs fingerprints', life.conditional_cross_row_equalities.filter(rule => rule.when.includes('single_human')).every(rule => rule.equalities.length === 2 && rule.equalities.some(pair => pair.some(field => field.includes('fingerprint')))))

  const evaluator = life.external_sealed_members.find(member => member.set_name === 'evaluator_registry')
  ok('evaluator version exact', evaluator.row_equalities.some(pair => same(pair, ['lifecycle_precondition_evidence.evaluator_version_ref', 'member.semantic_version'])) && c.lifecycle_evaluator_version_derivation.result_equality.includes('result.evaluator_version_ref'))

  const retireReceipt = c.authoritative_row_schemas.answer_receipts.properties.retired_intervention_refs
  const retireEffect = c.proof_value_schemas.question_answer_effect.properties.retire_intervention_refs
  ok('retirement refs kernel exact', retireReceipt.items.type === 'human_text' && retireEffect.items.type === 'human_text' && same(retireReceipt.item_constraints, ['string', 'exact_trimmed_nonempty']) && c.question_kernel_exact_retirement_reference_rule.includes('no_identifier_grammar'))

  const finalGate = c.outbox.provider_call_gate.final_recheck_outcome_table
  ok('provider outcomes ordered', finalGate.evaluation.startsWith('first_matching_priority_ascending') && same(finalGate.rows.map(row => row.priority), [1, 2, 3, 4, 5, 6, 7]) && new Set(finalGate.rows.map(row => row.priority)).size === 7 && finalGate.exclusivity.includes('first_match') && finalGate.exhaustiveness.includes('every_snapshot') && finalGate.append_requires_compare_and_swap_current_tip_unchanged_since_the_same_snapshot === true)
  ok('abort actor fingerprinted', c.fingerprint_schemas.invocation_aborted_before_provider.preimage_order.includes('abort_actor_class'))

  ok('derived changes', c.schema_change_manifest.derivation.includes('frozen_R13') && c.schema_change_manifest.dependency_parity_checks.length === 5 && c.schema_change_manifest.changes.length >= 10 && c.schema_change_manifest.changes.every(change => change.current_version.includes('.r14.')))
  return f
}

if (read(path) !== materializedR14Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r13.json') !== '4dd0f8694c68aba2a61b3e1ec0699c9844327df73ac3fa8b74691910a4b8267d') failures.push('frozen R13 changed')
for (const failure of collect(materializedR14)) failures.push(failure)

const mutations = [
  ['provider token survives identity', c => { c.outbox.retry_identity[0] = 'provider_operation_ref' }],
  ['provider grammar equality erased', c => { c.provider_target_derivation.equalities = c.provider_target_derivation.equalities.filter(rule => !rule.includes('provider_key_grammar_version')) }],
  ['provider source equality erased', c => { c.provider_target_derivation.equalities = c.provider_target_derivation.equalities.filter(rule => !rule.includes('verification_source_ref')) }],
  ['case binding fingerprint removed', c => { delete c.case_authority_bindings.properties.case_authority_binding_fingerprint }],
  ['case identity fingerprint equality erased', c => { c.case_identity_derivation.exact_byte_equalities = c.case_identity_derivation.exact_byte_equalities.filter(rule => !rule.includes('case_authority_binding_fingerprint')) }],
  ['release result fingerprint removed', c => { delete c.authoritative_row_schemas.release_authority_terminal_consumptions.properties.terminal_result_fingerprint }],
  ['release branch join erased', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0].joins = [] }],
  ['release branches conflated', c => { c.release_terminal_consumption_derivation.branch_table[1].branch = 'pending_delivery' }],
  ['answer authority fingerprint unconsumed', c => { c.proof_authority.proof_family_resolution_map.answer.extension_rows.find(row => row.table === 'leader_answer_authority_consumptions').owner_join_equalities = [] }],
  ['stable action predecessor nonnullable', c => { c.lifecycle_authority.stable_action_projection_schema.properties.predecessor_lifecycle_version_ref = { type: 'identifier' } }],
  ['joint leader fingerprint omitted', c => { c.proof_authority.proof_family_resolution_map.lifecycle.extension_rows.find(row => row.table_alias === 'leader_action_consumption').owner_join_equalities = [] }],
  ['joint actions all equated', c => { c.proof_authority.proof_family_resolution_map.lifecycle.conditional_cross_row_equalities.find(rule => rule.when === 'authority_kind_joint_human').equalities = [['owner.leader_action_receipt_ref', 'owner.operator_action_receipt_ref']] }],
  ['single action fingerprint omitted', c => { c.proof_authority.proof_family_resolution_map.lifecycle.conditional_cross_row_equalities.find(rule => rule.when.includes('single_human')).equalities = [] }],
  ['evaluator version arbitrary', c => { c.proof_authority.proof_family_resolution_map.lifecycle.external_sealed_members[0].row_equalities = [] }],
  ['retirement refs invented identifier', c => { c.authoritative_row_schemas.answer_receipts.properties.retired_intervention_refs.items = { type: 'identifier' } }],
  ['provider outcome precedence removed', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.evaluation = 'any_matching_row' }],
  ['provider outcome priorities overlap', c => { c.outbox.provider_call_gate.final_recheck_outcome_table.rows[1].priority = 1 }],
  ['abort actor omitted from fingerprint', c => { c.fingerprint_schemas.invocation_aborted_before_provider.preimage_order = c.fingerprint_schemas.invocation_aborted_before_provider.preimage_order.filter(field => field !== 'abort_actor_class') }],
  ['version semantic checks erased', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const c = structuredClone(materializedR14)
  mutate(c)
  if (collect(c).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R14 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R14 and ${mutations.length} mutation probes verified`)
console.log(`r14_machine_sha256=${sha(path)}`)
