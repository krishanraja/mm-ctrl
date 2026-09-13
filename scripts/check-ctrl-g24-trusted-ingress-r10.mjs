import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR10, materializedR10Output } from './materialize-ctrl-g24-trusted-ingress-r10.mjs'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r10.json'
const failures = []
const check = (label, pass) => { if (!pass) failures.push(label) }

function ownRef(rootObject, ref) {
  if (typeof ref !== 'string' || !ref || ref.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) return undefined
  let current = rootObject
  for (const part of ref.split('.')) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, part)) return undefined
    current = current[part]
  }
  return current
}

function walk(value, visit, path = '$') {
  visit(value, path)
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) walk(item, visit, `${path}.${key}`)
}

function exactClosed(schema) {
  if (!schema || schema.type !== 'object' || schema.additional_properties !== false) return false
  const keys = Object.keys(schema.properties ?? {})
  const optional = schema.optional ?? []
  return same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}

const operations = ['select_intervention', 'create_intervention', 'stage_intervention_edit', 'issue_intervention_presentation_challenge', 'record_intervention_visibility', 'approve_intervention', 'record_answer', 'correct_answer', 'record_answer_transcription_repair', 'record_leader_lifecycle_action', 'record_operator_lifecycle_action', 'combine_lifecycle_authority', 'apply_lifecycle_transition', 'compile_release', 'use_release', 'create_enrichment_plan', 'record_enrichment_attempt']
const proofFamilies = ['selector_result', 'intervention_approval', 'answer', 'correction', 'lifecycle', 'pending_release_and_authority', 'enrichment_plan', 'execution_receipt']
const candidateFields = ['route', 'permitted', 'capable', 'resolves_gap', 'within_deadline', 'within_budget', 'fresh', 'audience_compatible', 'provenance_independent', 'use_specific_sufficient', 'counterevidence_treated', 'reuse_origin', 'origin_case_ref', 'reuse_evidence_namespace', 'reuse_evidence_ref', 'public_source_ref', 'immutable_content_version', 'immutable_reference', 'contains_private_reasoning', 'trusted_evaluation_version', 'eligible', 'burden', 'rejection_reasons', 'candidate_fingerprint']
const answerFields = ['answer_receipt_ref', 'answer_version_ref', 'intervention_atom_ref', 'intervention_atom_version_ref', 'intervention_fingerprint', 'approval_receipt_ref', 'approval_fingerprint', 'approval_authority_version_ref', 'answer_kind', 'answer_value', 'immutable_case_evidence', 'case_effect', 'pending_human_owned_proposal', 'retired_intervention_refs', 'visible_consequence', 'automatic_reask_pressure', 'automatic_session_escalation']
const lifecycleIds = ['open_preparation', 'accept_intensive_proof', 'close_preparation', 'continue_after_intensive_proof', 'renew_continuing_period', 'pause_intensive_proof', 'pause_continuing', 'resume_continuing', 'close_intensive_proof', 'close_continuing', 'close_paused', 'complete_close', 'open_new_preparation_after_close']
const lifecycleSignatures = [
  'open_preparation|none|preparing|krish|new_bounded_operator_private_preparation_decision|subject_purpose_eligible_source_classes_and_review_date_named|none|preparation_opened',
  'accept_intensive_proof|preparing|intensive_proof|named_leader_and_krish|accepted_engagement_purpose_and_current_permissions|accepted_decision_frame_active_grants_and_checkpoint_recorded|superseded_preparation_projections|intensive_proof_accepted',
  'close_preparation|preparing|closed|krish_or_krish_recording_named_leader_decline_or_withdrawal|current_preparation_cancellation_decline_or_withdrawal|current_preparation_version_and_reason|all_prepared_and_unsent_derivatives|preparation_closed',
  'continue_after_intensive_proof|intensive_proof|continuing|named_leader_and_krish|explicit_continuation_agreement|next_consequential_decision_or_evidenced_value_checkpoint_and_exit_or_revisit_condition|superseded_period_projections|continuation_accepted',
  'renew_continuing_period|continuing|continuing|named_leader_and_krish|fresh_checkpoint_agreement|next_consequential_decision_or_evidenced_value_and_exit_or_revisit_condition|superseded_period_projections|continuing_period_renewed',
  'pause_intensive_proof|intensive_proof|paused|named_leader_or_krish|pause_decision|current_period|all_unsent_interventions|engagement_paused',
  'pause_continuing|continuing|paused|named_leader_or_krish|pause_decision|current_period|all_unsent_interventions|engagement_paused',
  'resume_continuing|paused|continuing|named_leader_and_krish|revalidated_continuation_agreement|purpose_identity_grants_audience_standing_freshness_next_value_and_checkpoint_revalidated|all_stale_paused_projections|engagement_resumed',
  'close_intensive_proof|intensive_proof|closing|named_leader_or_krish|close_request|current_period|new_decision_shaping_work_and_unsent_interventions|engagement_close_requested',
  'close_continuing|continuing|closing|named_leader_or_krish|close_request|current_period|new_decision_shaping_work_and_unsent_interventions|engagement_close_requested',
  'close_paused|paused|closing|named_leader_or_krish|close_request|current_period|new_decision_shaping_work_and_unsent_interventions|engagement_close_requested',
  'complete_close|closing|closed|krish|record_completion_under_named_human_close_request|access_correction_separate_release_and_close_obligations_fulfilled_or_recorded_outstanding|all_prepared_and_unsent_derivatives|engagement_closed',
  'open_new_preparation_after_close|closed|preparing|krish|new_bounded_operator_private_preparation_decision|new_purpose_and_review_date_no_old_grant_revival|none|new_preparation_opened',
]
const transitions = [
  'pending->claimed:claim', 'claimed->failed:pre_provider_failure', 'claimed->reserved:attempt_reservation', 'reserved->dispatched:attempt_dispatch',
  'dispatched->invoking:provider_invocation_start', 'dispatched->abandoned_not_invoked:abandon_without_invocation',
  'abandoned_not_invoked->claimed:retry_after_no_invocation', 'abandoned_not_invoked->failed:reservation_budget_exhausted_without_invocation',
  'invoking->confirmed:provider_success', 'invoking->failed:provider_failure', 'invoking->ambiguous:worker_ambiguity', 'invoking->ambiguous:lease_expiry_ambiguity',
  'ambiguous->claimed:retry_claim', 'ambiguous->unknown:unknown_terminal', 'unknown->confirmed:reconciled_success', 'unknown->failed:reconciled_failure',
]

function collect(candidate) {
  const found = []
  const assert = (label, pass) => { if (!pass) found.push(label) }
  assert('identity and frozen input', candidate.schema_version === 'ctrl.g24.trusted-ingress.r10.effective.v1' && candidate.status === 'ninth_repair_candidate_under_independent_review' && candidate.materialization?.frozen_input?.sha256 === '4d7d56b1a1e0eb0be1e6fad43deea361ec8bfc3d7f8b7d1be25e1e8d384e40b8')

  const usedTypes = new Set()
  const badRefs = []
  const refKeys = new Set(['schema_ref', 'fingerprint_ref', 'enum_ref', 'member_schema_ref', 'member_schema_ref', 'actor_authority_ref', 'event_schema_ref', 'set_schema_ref', 'payload_schema_ref', 'semantic_fingerprint_ref', 'member_schema_ref', 'catalog_ref', 'owner_lineage_version_source'])
  walk(candidate, (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    if (typeof value.type === 'string') usedTypes.add(value.type)
    for (const [key, ref] of Object.entries(value)) if (refKeys.has(key) && typeof ref === 'string' && ownRef(candidate, ref) === undefined) badRefs.push(`${path}.${key}:${ref}`)
  })
  assert('closed type graph', [...usedTypes].every(type => Object.hasOwn(candidate.type_registry ?? {}, type)))
  assert('closed own-property reference graph', badRefs.length === 0)
  assert('operation and evaluator parity retained', same(candidate.operation_names, operations) && operations.every(name => candidate.evaluator_abi.operation_result_exports[name] === candidate.result_payload_schemas[name].schema_version && candidate.operation_specs[name].result_schema === candidate.result_payload_schemas[name].schema_version) && proofFamilies.every(name => candidate.evaluator_abi.proof_family_exports[name] === candidate.proof_bundle_schemas.extensions[name].schema_version && candidate.evaluator_abi.proof_family_exports_schema.properties[name].const === candidate.evaluator_abi.proof_family_exports[name]))

  const watermarks = candidate.controlling_watermarks
  const watermarkType = candidate.type_registry.controlling_watermark_member
  assert('one watermark schema authority', watermarks?.member_schema_ref === 'type_registry.controlling_watermark_member' && !Object.hasOwn(watermarks, 'member_schema') && ownRef(candidate, watermarks.member_schema_ref) === watermarkType)
  assert('watermark variants exact and R10', watermarkType?.variants?.base?.schema_version === 'ctrl.g24.controlling-watermark-member-base.r10.v1' && watermarkType?.variants?.applicable_control?.schema_version === 'ctrl.g24.controlling-watermark-member-control.r10.v1' && ['base', 'applicable_control'].every(kind => exactClosed(watermarkType.variants[kind]) && ['lineage_ref', 'version_ref'].every(field => watermarkType.variants[kind].required.includes(field))))
  assert('watermark fingerprint variant exact', same(watermarks.member_fingerprint_by_variant.base.preimage_order.slice(1), ['kind_class', 'base_kind', 'lineage_ref', 'version_ref']) && same(watermarks.member_fingerprint_by_variant.applicable_control.preimage_order.slice(1), ['kind_class', 'control_id', 'lineage_ref', 'version_ref']) && !watermarks.set_fingerprint.member_preimage_order)
  assert('release changes distinguish bound and current', ['result_payload_schemas.use_release.variants.invalidated_before_use', 'release_invalidation.invalidation_receipt_schema'].every(ref => ownRef(candidate, ref).properties.changed_controlling_watermark_kinds.items.type === 'controlling_watermark_change') && candidate.release_invalidation.change_comparison?.exactly_one_change_entry_per_changed_identity === true && candidate.type_registry.controlling_watermark_change.variants.base.properties.bound_version_ref.type === 'nullable')

  const selectorMember = candidate.proof_member_schemas?.selector_candidate
  assert('selector candidate reproduces locked kernel', exactClosed(selectorMember) && same(Object.keys(selectorMember.properties), candidateFields) && same(selectorMember.properties.route.values, ['reuse', 'enrich', 'ask', 'session']) && selectorMember.properties.burden.type === 'finite_nonnegative_number' && selectorMember.properties.rejection_reasons.unique === true && selectorMember.conditional_rules.includes('eligible_iff_rejection_reasons_empty'))
  const selectorSet = candidate.authoritative_row_schemas?.selector_candidate_sets?.properties?.candidate_members
  assert('selector set complete and least-burden bound', selectorSet?.min_items === 1 && selectorSet?.max_items === 4 && same(selectorSet.allowed_route_values, ['reuse', 'enrich', 'ask', 'session']) && candidate.proof_set_schemas.selector_candidates?.completeness?.includes('no_invented_candidate') && candidate.proof_set_schemas.selector_candidates?.owner_binding?.includes('least_burden_eligible_route'))
  const selectorRow = candidate.authoritative_row_schemas?.selector_results
  assert('selector owner carries decision semantics', exactClosed(selectorRow) && ['selector_result_version', 'evidence_namespace', 'purpose_ref', 'decision_requirement_ref', 'reason_code', 'unresolved_gap', 'expected_material_effect', 'control_root_keys', 'trusted_evaluation', 'controlling_watermark_set_fingerprint', 'actionable'].every(field => selectorRow.properties[field]))

  const answerRow = candidate.authoritative_row_schemas?.answer_receipts
  assert('answer row reproduces locked receipt', exactClosed(answerRow) && answerFields.every(field => answerRow.properties[field]) && answerRow.properties.answer_value.schema_ref === 'proof_value_schemas.answer_value_by_kind' && candidate.proof_value_schemas.answer_value_by_kind.discriminator_source_field === 'answer_kind' && answerRow.properties.immutable_case_evidence.const === true && answerRow.properties.automatic_reask_pressure.const === false && answerRow.properties.automatic_session_escalation.const === false)

  const lifecycleAuthority = candidate.authoritative_row_schemas?.lifecycle_authority_receipts
  const lifecycleOwner = candidate.authoritative_row_schemas?.lifecycle_transition_receipts
  const catalog = candidate.lifecycle_precondition_catalog
  assert('lifecycle acting human explicit', exactClosed(lifecycleAuthority) && lifecycleAuthority.properties.acting_human_ref?.type === 'identifier' && lifecycleAuthority.properties.actor_refs?.min_items === 1 && lifecycleOwner.properties.from_state.values.includes('none'))
  assert('lifecycle catalogue exact and complete', same(Object.keys(catalog ?? {}), lifecycleIds) && lifecycleIds.every(id => catalog[id]?.transition_id === id && catalog[id].required_precondition_id === `${id}:precondition`) && same(Object.values(catalog ?? {}).map(row => [row.transition_id, row.from_state, row.to_state, row.actor_class, row.authority_canonical_text, row.precondition_canonical_text, row.invalidation_canonical_text, row.receipt_type].join('|')), lifecycleSignatures))

  const mappings = candidate.proof_authority?.proof_family_resolution_map
  assert('critical anti-splicing equalities exact', same(mappings?.intervention_approval?.cross_row_equalities, [
    ['owner.intervention_atom_ref', 'intervention_atoms.intervention_atom_ref', 'intervention_visibility_acknowledgements.intervention_atom_ref'],
    ['owner.intervention_atom_version_ref', 'intervention_atoms.atom_version_ref', 'intervention_visibility_acknowledgements.atom_version_ref'],
    ['owner.intervention_atom_content_fingerprint', 'intervention_atoms.atom_content_fingerprint', 'intervention_visibility_acknowledgements.atom_content_fingerprint'],
  ]) && mappings.answer.cross_row_equalities.length === 3 && mappings.pending_release_and_authority.cross_row_equalities.length === 2 && mappings.lifecycle.cross_row_equalities.length === 3 && candidate.proof_authority.cross_row_equality_semantics.includes('byte_equal'))
  assert('proof sets have version and owner source', ['answer_chain', 'answer_dependency_graph', 'lifecycle_preconditions', 'controlling_watermarks', 'selector_candidates'].every(name => candidate.proof_set_schemas[name]?.schema_version?.includes('.r10.') && ownRef(candidate, candidate.proof_set_schemas[name].owner_lineage_version_source)))
  assert('answer chain genesis and typed dependencies exact', candidate.proof_set_schemas.answer_chain.genesis.includes('null_predecessor') && candidate.proof_member_schemas.answer_chain_member.properties.predecessor_chain_tip.type === 'nullable' && candidate.proof_member_schemas.answer_dependency_edge.properties.dependent_record_kind.values?.length === 5 && candidate.proof_member_schemas.answer_dependency_edge.properties.dependent_record_fingerprint.type === 'sha256')
  assert('lifecycle preconditions resolve catalogue', candidate.proof_set_schemas.lifecycle_preconditions.catalog_ref === 'lifecycle_precondition_catalog' && candidate.proof_set_schemas.lifecycle_preconditions.completeness.includes('exact_catalog_required_precondition_id') && candidate.proof_member_schemas.lifecycle_precondition.properties.precondition_canonical_text.type === 'human_text')

  const outbox = candidate.outbox
  assert('every payload binding includes effect identity', same(Object.keys(outbox.payload_binding_map), outbox.transition_event_schema.properties.event_kind.values) && Object.values(outbox.payload_binding_map).every(binding => binding.payload_effect_ref_field === 'outbox_effect_ref' && ownRef(candidate, binding.payload_schema_ref)?.properties?.outbox_effect_ref))
  assert('payload consumption is unique and atomic', exactClosed(outbox.payload_consumption_schema) && same(outbox.payload_consumption_schema.unique_keys, [['payload_schema_version', 'payload_ref'], ['transition_event_ref']]) && same(outbox.append_transition_transaction.writes, ['one_exact_payload_row', 'one_outbox_transition_event', 'one_unique_payload_consumption']) && outbox.append_transition_transaction.admission_predicate.includes('payload_outbox_effect_ref_equals_transition_outbox_effect_ref') && outbox.append_transition_transaction.admission_predicate.includes('no_payload_consumption_exists_for_payload_schema_version_and_payload_ref'))
  assert('reconciliation branches exact', outbox.reconciled_success_evidence_schema.properties.observed_outcome.const === 'confirmed' && outbox.reconciled_failure_evidence_schema.properties.observed_outcome.const === 'failed' && outbox.payload_binding_map.reconciled_success.payload_schema_ref === 'outbox.reconciled_success_evidence_schema' && outbox.payload_binding_map.reconciled_failure.payload_schema_ref === 'outbox.reconciled_failure_evidence_schema')
  assert('outbox transition table exact', same(outbox.transition_table.map(row => `${row.from}->${row.to}:${row.event_kind}`), transitions) && outbox.transition_table.every(row => ownRef(candidate, row.event_schema_ref) && ownRef(candidate, row.actor_authority_ref) && row.condition && row.provider_call !== undefined))
  assert('no-invocation budget has terminal state', exactClosed(outbox.reservation_budget_exhausted_schema) && outbox.transition_table[7].condition === 'abandonment_proves_no_invocation_event_and_exactly_three_committed_reservations_exist' && outbox.transition_table[7].provider_call === false)
  assert('reconciliation conditions are exact', outbox.transition_table.find(row => row.event_kind === 'reconciled_success')?.condition === 'exact_unknown_causal_chain_invocation_dispatch_identity_and_provider_evidence' && outbox.transition_table.find(row => row.event_kind === 'reconciled_failure')?.condition === 'exact_unknown_causal_chain_invocation_dispatch_identity_and_provider_evidence')
  assert('provider outcomes cannot deny prior call authority', ['provider_success', 'provider_failure', 'worker_ambiguity'].every(kind => outbox.transition_table.find(row => row.event_kind === kind)?.provider_call === 'call_may_only_have_occurred_via_the_exact_prior_invocation_event_capability'))
  assert('invocation authority and capability exact', outbox.invocation_capability_protocol?.invocation_event_is_the_durable_consumption_of_call_authority === true && outbox.invocation_capability_protocol.one_invocation_event_per_dispatch === true && outbox.invocation_capability_protocol.capability_minted_only_to_process_that_committed_invocation_event === true && outbox.invocation_capability_protocol.may_be_reconstructed_from_database_or_queue === false && outbox.invocation_capability_protocol.capability_consumption.includes('atomically_flips') && outbox.provider_call_gate.current_rechecks_immediately_before_invocation.length === 5)

  return found
}

check('machine equals generator', read(machinePath) === materializedR10Output)
check('exact R10 human bytes', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r10.md') === 'a476f10848ac2c08701e77a0a88b8939e413cdb3744a778a8b2cd5bcc4dc473c')
check('exact R10 machine bytes', sha(machinePath) === 'b2cb1ab347138ad9cb47db742f3b445ada080281eadeb18f02b0bbad17ab8f5b')
check('exact R10 QA bytes', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-r10-qa-record.md') === '807a4bcb46da0fc7951e067a6065a42f143ed8fdf8e940f4119f28fecc0637d0')
check('exact R10 materializer bytes', sha('scripts/materialize-ctrl-g24-trusted-ingress-r10.mjs') === '6ce23b76860e31acf979f478d23c6136165306a60c104449a50eaded26fc5831')
check('rejected R9 bytes preserved', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r9.json') === '4d7d56b1a1e0eb0be1e6fad43deea361ec8bfc3d7f8b7d1be25e1e8d384e40b8')
for (const failure of collect(materializedR10)) failures.push(`R10 ${failure}`)

const mutations = [
  ['inherited ref', c => { c.operation_specs.record_answer.intent.properties.answer_kind = { schema_ref: '__proto__' } }],
  ['operation omitted', c => c.operation_names.pop()],
  ['proof export omitted', c => { delete c.evaluator_abi.proof_family_exports.answer }],
  ['duplicate watermark schema restored', c => { c.controlling_watermarks.member_schema = structuredClone(c.type_registry.controlling_watermark_member) }],
  ['watermark version removed', c => { delete c.type_registry.controlling_watermark_member.variants.base.properties.version_ref }],
  ['watermark stale version', c => { c.type_registry.controlling_watermark_member.variants.base.schema_version = 'r8' }],
  ['watermark generic preimage restored', c => { c.controlling_watermarks.set_fingerprint.member_preimage_order = ['kind'] }],
  ['release comparison role erased', c => { c.result_payload_schemas.use_release.variants.invalidated_before_use.properties.changed_controlling_watermark_kinds.items = { type: 'controlling_watermark_member' } }],
  ['selector routes invented', c => { c.proof_member_schemas.selector_candidate.properties.route.values = ['route_1', 'route_2', 'route_3', 'route_4'] }],
  ['selector burden weakened', c => { c.proof_member_schemas.selector_candidate.properties.burden = { type: 'human_text' } }],
  ['selector eligibility omitted', c => { delete c.proof_member_schemas.selector_candidate.properties.eligible }],
  ['selector candidate set may be empty', c => { c.authoritative_row_schemas.selector_candidate_sets.properties.candidate_members.min_items = 0 }],
  ['least burden rule omitted', c => { c.proof_set_schemas.selector_candidates.owner_binding = 'any' }],
  ['selector trusted evaluation omitted', c => { delete c.authoritative_row_schemas.selector_results.properties.trusted_evaluation }],
  ['answer value not discriminated', c => { c.authoritative_row_schemas.answer_receipts.properties.answer_value = { type: 'human_text' } }],
  ['answer approval omitted', c => { delete c.authoritative_row_schemas.answer_receipts.properties.approval_fingerprint }],
  ['answer automatic action enabled', c => { c.authoritative_row_schemas.answer_receipts.properties.automatic_reask_pressure = { type: 'boolean' } }],
  ['lifecycle acting human omitted', c => { delete c.authoritative_row_schemas.lifecycle_authority_receipts.properties.acting_human_ref }],
  ['lifecycle transition catalog omitted', c => { delete c.lifecycle_precondition_catalog.pause_continuing }],
  ['lifecycle precondition arbitrary', c => { c.lifecycle_precondition_catalog.complete_close.precondition_canonical_text = 'anything' }],
  ['approval cross-row atom binding omitted', c => c.proof_authority.proof_family_resolution_map.intervention_approval.cross_row_equalities.shift()],
  ['release cross-row projection binding omitted', c => c.proof_authority.proof_family_resolution_map.pending_release_and_authority.cross_row_equalities.pop()],
  ['proof set version omitted', c => { delete c.proof_set_schemas.answer_chain.schema_version }],
  ['answer genesis vague', c => { c.proof_set_schemas.answer_chain.genesis = 'first' }],
  ['dependency kind untyped', c => { c.proof_member_schemas.answer_dependency_edge.properties.dependent_record_kind = { type: 'identifier' } }],
  ['lifecycle catalog detached', c => { c.proof_set_schemas.lifecycle_preconditions.catalog_ref = 'proof_member_schemas.lifecycle_precondition' }],
  ['payload effect binding omitted', c => { delete c.outbox.payload_binding_map.provider_success.payload_effect_ref_field }],
  ['payload cross-wired', c => { c.outbox.payload_binding_map.reconciled_failure.payload_schema_ref = 'outbox.reconciled_success_evidence_schema' }],
  ['payload reusable', c => { c.outbox.payload_consumption_schema.unique_keys = [] }],
  ['payload effect admission omitted', c => { c.outbox.append_transition_transaction.admission_predicate = c.outbox.append_transition_transaction.admission_predicate.filter(x => !x.startsWith('payload_outbox_effect')) }],
  ['reconciliation outcome weakened', c => { c.outbox.reconciled_failure_evidence_schema.properties.observed_outcome = { type: 'identifier' } }],
  ['arbitrary reconciliation condition', c => { c.outbox.transition_table.find(row => row.event_kind === 'reconciled_failure').condition = 'always' }],
  ['provider success denies call', c => { c.outbox.transition_table.find(row => row.event_kind === 'provider_success').provider_call = false }],
  ['no-invocation budget terminal removed', c => { c.outbox.transition_table = c.outbox.transition_table.filter(row => row.event_kind !== 'reservation_budget_exhausted_without_invocation') }],
  ['capability reconstructible', c => { c.outbox.invocation_capability_protocol.may_be_reconstructed_from_database_or_queue = true }],
  ['invocation rechecks removed', c => c.outbox.provider_call_gate.current_rechecks_immediately_before_invocation.pop()],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR10)
  mutate(candidate)
  check(`mutation rejected: ${name}`, collect(candidate).length > 0)
}

if (failures.length) {
  console.error(`G24 trusted ingress R10 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R10 and ${mutations.length} mutation probes verified`)
console.log(`r10_machine_sha256=${sha(machinePath)}`)
