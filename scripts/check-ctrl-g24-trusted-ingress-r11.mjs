import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR11, materializedR11Output } from './materialize-ctrl-g24-trusted-ingress-r11.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r11.json'
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
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
const lifecycleIds = ['open_preparation', 'accept_intensive_proof', 'close_preparation', 'continue_after_intensive_proof', 'renew_continuing_period', 'pause_intensive_proof', 'pause_continuing', 'resume_continuing', 'close_intensive_proof', 'close_continuing', 'close_paused', 'complete_close', 'open_new_preparation_after_close']
const expectedTransitions = [
  'pending->claimed:claim', 'claimed->failed:pre_provider_failure', 'claimed->reserved:attempt_reservation', 'reserved->dispatched:attempt_dispatch',
  'dispatched->invoking:provider_invocation_start', 'dispatched->abandoned_not_invoked:abandon_without_invocation',
  'abandoned_not_invoked->claimed:retry_after_no_invocation', 'abandoned_not_invoked->failed:reservation_budget_exhausted_without_invocation',
  'invoking->confirmed:provider_success', 'invoking->failed:provider_failure', 'invoking->ambiguous:worker_ambiguity', 'invoking->ambiguous:lease_expiry_ambiguity',
  'ambiguous->claimed:retry_claim', 'ambiguous->unknown:unknown_terminal', 'unknown->confirmed:reconciled_success', 'unknown->failed:reconciled_failure',
]

function collect(candidate) {
  const found = []
  const assert = (label, pass) => { if (!pass) found.push(label) }
  assert('identity', candidate.schema_version === 'ctrl.g24.trusted-ingress.r11.effective.v1' && candidate.status === 'tenth_repair_candidate_under_independent_review')
  assert('frozen R10 input', candidate.materialization?.frozen_input?.sha256 === 'b2cb1ab347138ad9cb47db742f3b445ada080281eadeb18f02b0bbad17ab8f5b')

  const usedTypes = new Set()
  const badRefs = []
  const refKeys = new Set(['schema_ref', 'fingerprint_ref', 'enum_ref', 'member_schema_ref', 'actor_authority_ref', 'event_schema_ref', 'set_schema_ref', 'payload_schema_ref', 'semantic_fingerprint_ref', 'catalog_ref'])
  walk(candidate, (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    if (typeof value.type === 'string') usedTypes.add(value.type)
    for (const [key, ref] of Object.entries(value)) {
      if (refKeys.has(key) && typeof ref === 'string' && ownRef(candidate, ref) === undefined) badRefs.push(`${path}.${key}:${ref}`)
    }
  })
  assert('closed type graph', [...usedTypes].every(type => Object.hasOwn(candidate.type_registry ?? {}, type)))
  assert('closed reference graph', badRefs.length === 0)
  assert('operation ABI parity', same(candidate.operation_names, operations) && operations.every(name => candidate.evaluator_abi.operation_result_exports[name] === candidate.result_payload_schemas[name].schema_version && candidate.operation_specs[name].result_schema === candidate.result_payload_schemas[name].schema_version))
  assert('proof ABI parity', proofFamilies.every(name => candidate.evaluator_abi.proof_family_exports[name] === candidate.proof_bundle_schemas.extensions[name].schema_version && candidate.evaluator_abi.proof_family_exports_schema.properties[name].const === candidate.evaluator_abi.proof_family_exports[name]))

  const encoding = candidate.canonical_field_encoding
  assert('injective primitives', encoding?.nullable_null === 'single_byte_0x00' && encoding?.nullable_value?.includes('0x01') && encoding?.finite_nonnegative_number?.startsWith('RFC_8785') && encoding?.finite_nonnegative_number?.includes('negative_zero') && encoding?.const_null && encoding?.base64url_without_padding)
  assert('discriminated encoding binds selector', encoding?.discriminated_value?.includes('discriminator_source_field_name') && encoding?.discriminated_value?.includes('selected_variant') && candidate.canonical_encoding_conformance?.every_discriminated_value_binds_the_discriminator_and_selected_variant_before_value_bytes === true)
  assert('no generic JSON encoding', encoding?.map_or_unspecified_json_value_allowed === false)

  const selectorMember = candidate.proof_member_schemas.selector_candidate
  const selectorSet = candidate.authoritative_row_schemas.selector_candidate_sets
  const selectorOwner = candidate.authoritative_row_schemas.selector_results
  const selectorDerivation = candidate.selector_derivation
  assert('selector candidate exact', exactClosed(selectorMember) && selectorMember.schema_version.includes('.r11.') && selectorMember.properties.input_rejection_reasons?.unique === true && selectorMember.properties.rejection_reasons?.unique === true)
  assert('selector zero-to-four actual set', exactClosed(selectorSet) && selectorSet.properties.candidate_members.min_items === 0 && selectorSet.properties.candidate_members.max_items === 4 && selectorSet.properties.selector_result_version?.type === 'identifier' && selectorDerivation.presented_candidate_set.no_candidate_is_valid === true)
  assert('selector exact reason table', same(selectorDerivation.rejection_reason_table.map(row => row[2]), ['route_not_permitted', 'source_or_respondent_incapable', 'does_not_resolve_named_gap', 'outside_deadline', 'outside_budget', 'route_evidence_stale', 'audience_incompatible', 'provenance_independence_unsatisfied', 'use_specific_sufficiency_unsatisfied', 'counterevidence_untreated', 'private_cross_case_reuse_forbidden', 'reuse_evidence_reference_missing', 'invalid_burden']))
  assert('selector exact precedence', same(selectorDerivation.envelope_precedence, [
    'any_schema_control_manifest_trusted_evaluation_candidate_or_challenger_error=>abstain_hold,invalid_input,actionable_false',
    'expected_material_effect_empty=>abstain_hold,no_material_effect,actionable_false',
    'decision_consequence_low_value=>abstain_hold,no_material_effect,actionable_false',
    'evidence_state_sufficient_and_eligible_reuse_present=>reuse,current_sufficient,actionable_true,unresolved_gap_null,unresolved_evidence_refs_empty',
    'evidence_state_sufficient_and_no_eligible_reuse=>abstain_hold,source_incapable,actionable_false',
    'evidence_state_not_sufficient_and_unresolved_evidence_refs_empty=>abstain_hold,invalid_input,actionable_false',
    'evidence_state_not_sufficient_and_eligible_resolving_candidate_exists=>least_burden_then_enrich_ask_session_order',
    'evidence_state_contradiction_and_no_eligible_resolving_candidate=>abstain_hold,unresolved_contradiction,actionable_false',
    'evidence_state_gap_or_ambiguity_and_no_eligible_resolving_candidate=>abstain_hold,unknowable,actionable_false',
  ]))
  assert('selector result owns derivation inputs', exactClosed(selectorOwner) && ['decision_consequence', 'evidence_state', 'alternatives', 'candidate_set_fingerprint', 'controlling_watermark_set_fingerprint'].every(key => selectorOwner.properties[key]))
  const selectorSeals = candidate.proof_authority.proof_family_resolution_map.selector_result.extension_seals
  assert('selector set seals exact', selectorSeals.length === 2 && selectorSeals[0].set_schema_ref === 'proof_set_schemas.selector_candidates' && selectorSeals[0].set_owner_row === 'selector_candidate_sets' && selectorSeals[1].set_schema_ref === 'proof_set_schemas.controlling_watermarks')
  assert('watermark family owner exact', same(candidate.proof_set_schemas.controlling_watermarks.owner_lineage_version_source_by_family, {
    selector_result: 'authoritative_row_schemas.selector_results.properties.selector_result_version',
    pending_release_and_authority: 'authoritative_row_schemas.pending_release_projections.properties.projection_version_ref',
  }) && !candidate.proof_set_schemas.controlling_watermarks.owner_lineage_version_source)

  const questionContract = candidate.proof_value_schemas.question_contract
  const answerOwner = candidate.authoritative_row_schemas.answer_receipts
  const answerMap = candidate.proof_authority.proof_family_resolution_map.answer
  assert('question contract closed', exactClosed(questionContract) && questionContract.schema_version.includes('.r11.') && questionContract.properties.answer_effects.unique_by === 'effect_key' && questionContract.properties.question_contract_fingerprint?.type === 'sha256')
  assert('atom stores exact question bytes', exactClosed(candidate.authoritative_row_schemas.intervention_atoms) && ['payload_schema_version', 'payload_b64url', 'payload_byte_length', 'atom_content_fingerprint', 'question_contract', 'question_contract_fingerprint'].every(key => candidate.authoritative_row_schemas.intervention_atoms.properties[key]))
  assert('approval stores exact atom binding', ['approval_authority_version_ref', 'atom_payload_schema_version', 'question_contract_fingerprint'].every(key => candidate.authoritative_row_schemas.intervention_approval_receipts.properties[key]))
  assert('approval resolves selector authority watermark', ['selector_result_ref', 'selector_result_version', 'selector_result_fingerprint', 'controlling_watermark_set_fingerprint'].every(key => candidate.authoritative_row_schemas.intervention_approval_receipts.properties[key]) && candidate.approval_authority_derivation.authority_watermark.includes('unique_base_authority_version_member') && candidate.proof_authority.proof_family_resolution_map.intervention_approval.extension_rows.some(row => row.table === 'selector_results') && candidate.proof_authority.proof_family_resolution_map.intervention_approval.cross_row_equalities.length === 9)
  assert('answer stores derived effect key', exactClosed(answerOwner) && answerOwner.properties.selected_effect_key?.type === 'human_text' && answerOwner.properties.question_contract_fingerprint?.type === 'sha256')
  assert('answer dependencies resolved', ['intervention_approval_receipts', 'intervention_atoms'].every(table => answerMap.extension_rows.some(row => row.table === table)) && same(answerMap.cross_row_equalities, [
    ['owner.intervention_atom_ref', 'intervention_approval_receipts.intervention_atom_ref', 'intervention_atoms.intervention_atom_ref', 'leader_authority_receipts.intervention_atom_ref', 'answer_visibility_acknowledgements.intervention_atom_ref'],
    ['owner.intervention_atom_version_ref', 'intervention_approval_receipts.intervention_atom_version_ref', 'intervention_atoms.atom_version_ref', 'leader_authority_receipts.intervention_atom_version_ref', 'answer_visibility_acknowledgements.intervention_atom_version_ref'],
    ['owner.intervention_fingerprint', 'intervention_approval_receipts.intervention_atom_content_fingerprint', 'intervention_atoms.atom_content_fingerprint', 'leader_authority_receipts.intervention_atom_content_fingerprint', 'answer_visibility_acknowledgements.answer_surface_fingerprint'],
    ['owner.approval_receipt_ref', 'intervention_approval_receipts.approval_receipt_ref'],
    ['owner.approval_fingerprint', 'intervention_approval_receipts.approval_receipt_fingerprint'],
    ['owner.approval_authority_version_ref', 'intervention_approval_receipts.approval_authority_version_ref'],
    ['owner.question_contract_fingerprint', 'intervention_approval_receipts.question_contract_fingerprint', 'intervention_atoms.question_contract_fingerprint', 'leader_authority_receipts.question_contract_fingerprint'],
  ]))
  assert('answer exact effect derivation', candidate.answer_derivation.grammar_and_effect_key.single_choice_option.includes('value_is_the_effect_key') && candidate.answer_derivation.grammar_and_effect_key.ranked_choice.includes('complete_unique_permutation') && candidate.answer_derivation.receipt_effect_equalities.some(rule => rule.startsWith('case_effect_visible_consequence')))

  const releaseMap = candidate.proof_authority.proof_family_resolution_map.pending_release_and_authority
  assert('release binds projection fingerprint', candidate.authoritative_row_schemas.release_authority_receipts.properties.pending_projection_fingerprint?.type === 'sha256' && releaseMap.cross_row_equalities.some(row => same(row, ['owner.pending_projection_fingerprint', 'release_authority_receipts.pending_projection_fingerprint'])))

  const lifeOwner = candidate.authoritative_row_schemas.lifecycle_transition_receipts
  const lifeAuthority = candidate.authoritative_row_schemas.lifecycle_authority_receipts
  const lifeMember = candidate.proof_member_schemas.lifecycle_precondition
  assert('lifecycle catalogue complete', same(Object.keys(candidate.lifecycle_precondition_catalog), lifecycleIds))
  assert('lifecycle owner copies catalogue', exactClosed(lifeOwner) && candidate.lifecycle_exact_derivation.transition_owner_fields_byte_equal_catalogue.every(key => lifeOwner.properties[key]))
  assert('lifecycle authority exact actors', exactClosed(lifeAuthority) && lifeAuthority.properties.authority_canonical_text && Object.keys(candidate.lifecycle_exact_derivation.actor_rules).length === 4 && candidate.lifecycle_exact_derivation.identity_resolution.includes('exact_current_identity_rows'))
  assert('lifecycle member catalog-bound', exactClosed(lifeMember) && ['transition_id', 'from_state', 'to_state', 'precondition_id', 'precondition_canonical_text'].every(key => lifeMember.properties[key]) && same(candidate.lifecycle_exact_derivation.precondition_member_field_equalities, [
    ['member.transition_id', 'catalogue.transition_id'],
    ['member.from_state', 'catalogue.from_state'],
    ['member.to_state', 'catalogue.to_state'],
    ['member.precondition_id', 'catalogue.required_precondition_id'],
    ['member.precondition_canonical_text', 'catalogue.precondition_canonical_text'],
  ]) && candidate.proof_set_schemas.lifecycle_preconditions.owner_binding.includes('byte_equal'))

  const watermark = candidate.watermark_change_derivation
  assert('watermark classification total', same(watermark.precedence, [
    'bound_present_and_current_absent=>removed',
    'bound_absent_and_current_present=>newly_applicable',
    'both_present_and_lineage_different=>lineage_changed_even_if_version_also_differs',
    'both_present_and_lineage_equal_and_version_different=>version_changed',
  ]) && watermark.invalid_patterns.includes('partial_null_bound_side') && watermark.invalid_patterns.includes('both_sides_byte_equal'))
  assert('watermark variant member bytes', candidate.controlling_watermarks.set_fingerprint.member_entry_encoding?.includes('variant_name_framed') && candidate.controlling_watermarks.set_fingerprint.member_entry_encoding?.includes('variant_member_fingerprint'))

  const outbox = candidate.outbox
  assert('outbox transition table exact', same(outbox.transition_table.map(row => `${row.from}->${row.to}:${row.event_kind}`), expectedTransitions))
  assert('reconciliation rows point to split schemas', outbox.transition_table.find(row => row.event_kind === 'reconciled_success').event_schema_ref === 'outbox.reconciled_success_evidence_schema' && outbox.transition_table.find(row => row.event_kind === 'reconciled_failure').event_schema_ref === 'outbox.reconciled_failure_evidence_schema')
  assert('payload consumption five exact equalities', exactClosed(outbox.payload_consumption_schema) && outbox.payload_consumption_schema.properties.consumption_fingerprint?.type === 'sha256' && outbox.payload_consumption_schema.exact_equalities.length === 5 && outbox.payload_consumption_schema.exact_equalities.every(rule => rule.includes('byte_equals') || rule.includes('transition_event_ref')))
  assert('safe exhausted terminal', outbox.reservation_budget_exhausted_schema.properties.provider_invocation_count.const === 0 && outbox.transition_table.find(row => row.event_kind === 'reservation_budget_exhausted_without_invocation').condition.includes('total_provider_invocation_event_count_for_effect_equals_zero'))
  assert('invocation current authority', same(outbox.provider_call_gate.current_rechecks_immediately_before_invocation, [
    'effect_payload_fingerprint_unchanged',
    'current_fenced_claim_worker_matches_invocation_event',
    'server_now_strictly_before_dispatch_lease_expiry',
    'invocation_event_is_the_unique_current_tip_and_has_no_successor',
    'provider_operation_capability_is_current_unambiguous_unexpired_unconsumed_and_bound_to_exact_invocation_event_dispatch_effect_worker_and_fence',
    'no_reaper_abandonment_ambiguity_or_terminal_event_exists_for_dispatch_or_effect',
    'all_operation_specific_authority_predicates_still_pass',
    'committed_reservation_count_lte_three',
  ]))
  assert('effect origin exact', exactClosed(outbox.effect_origin_schema) && outbox.effect_origin_schema.unique_keys.some(key => same(key, ['outbox_effect_ref'])) && ['origin_ref', 'origin_fingerprint'].every(key => outbox.effect_schema.properties[key]) && outbox.genesis_protocol.writes.includes('one_outbox_effect_origin') && outbox.genesis_protocol.exact_equalities.length === 5 && outbox.genesis_protocol.no_effect_from_hold_ineligible_invalidated_noop_or_failed_branch === true)
  assert('effect origin branches resolve exactly', outbox.genesis_protocol.allowed_origin_by_effect_kind.enrichment_query.source_operation_result_schema_ref === 'result_payload_schemas.create_enrichment_plan' && outbox.genesis_protocol.allowed_origin_by_effect_kind.enrichment_query.result_ref_field === 'plan_ref' && outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.source_operation_result_schema_ref === 'result_payload_schemas.use_release.variants.pending_delivery' && outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.result_fingerprint_ref === 'fingerprint_schemas.use_release_pending_delivery_result' && ownRef(candidate, outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.result_fingerprint_ref))
  assert('changed use release schema exported', candidate.result_payload_schemas.use_release.schema_version === 'ctrl.g24.result.use-release.r11.v1' && candidate.operation_specs.use_release.schema_version === 'ctrl.g24.intent.use-release.r11.v1' && candidate.operation_specs.use_release.result_schema === candidate.result_payload_schemas.use_release.schema_version && candidate.evaluator_abi.operation_result_exports.use_release === candidate.result_payload_schemas.use_release.schema_version)

  assert('changed schema manifest exact', Object.entries(candidate.schema_change_manifest).every(([path, version]) => ownRef(candidate, path)?.schema_version === version && version.includes('.r11.')))
  assert('changed rows all R11', ['selector_results', 'selector_candidate_sets', 'answer_receipts', 'intervention_atoms', 'intervention_approval_receipts', 'leader_authority_receipts', 'release_authority_receipts', 'lifecycle_transition_receipts', 'lifecycle_snapshots', 'lifecycle_authority_receipts'].every(table => candidate.authoritative_row_schemas[table].schema_version.includes('.r11.')))
  return found
}

check('machine equals generator', read(machinePath) === materializedR11Output)
check('R10 frozen input preserved', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r10.json') === 'b2cb1ab347138ad9cb47db742f3b445ada080281eadeb18f02b0bbad17ab8f5b')
for (const failure of collect(materializedR11)) failures.push(`R11 ${failure}`)

const mutations = [
  ['nullable encoding removed', c => { delete c.canonical_field_encoding.nullable_null }],
  ['number encoding made vague', c => { c.canonical_field_encoding.finite_nonnegative_number = 'number' }],
  ['discriminator not bound', c => { c.canonical_field_encoding.discriminated_value = 'value only' }],
  ['selector empty forbidden', c => { c.authoritative_row_schemas.selector_candidate_sets.properties.candidate_members.min_items = 1 }],
  ['selector candidate omitted', c => { c.authoritative_row_schemas.selector_candidate_sets.properties.candidate_members.max_items = 3 }],
  ['selector invented rejection reason', c => { c.selector_derivation.rejection_reason_table[0][2] = 'nope' }],
  ['selector precedence reordered', c => { c.selector_derivation.envelope_precedence.reverse() }],
  ['selector evidence state removed', c => { delete c.authoritative_row_schemas.selector_results.properties.evidence_state }],
  ['selector candidate seal removed', c => { c.proof_authority.proof_family_resolution_map.selector_result.extension_seals.shift() }],
  ['selector watermark owner wrong', c => { c.proof_set_schemas.controlling_watermarks.owner_lineage_version_source_by_family.selector_result = 'authoritative_row_schemas.pending_release_projections.properties.projection_version_ref' }],
  ['question effects open', c => { c.proof_value_schemas.question_contract.properties.answer_effects.unique_by = null }],
  ['atom exact payload removed', c => { delete c.authoritative_row_schemas.intervention_atoms.properties.payload_b64url }],
  ['approval authority omitted', c => { delete c.authoritative_row_schemas.intervention_approval_receipts.properties.approval_authority_version_ref }],
  ['approval selector authority unresolved', c => { c.proof_authority.proof_family_resolution_map.intervention_approval.extension_rows = c.proof_authority.proof_family_resolution_map.intervention_approval.extension_rows.filter(row => row.table !== 'selector_results') }],
  ['answer effect key omitted', c => { delete c.authoritative_row_schemas.answer_receipts.properties.selected_effect_key }],
  ['answer approval row unresolved', c => { c.proof_authority.proof_family_resolution_map.answer.extension_rows = c.proof_authority.proof_family_resolution_map.answer.extension_rows.filter(row => row.table !== 'intervention_approval_receipts') }],
  ['answer atom equality forged', c => { c.proof_authority.proof_family_resolution_map.answer.cross_row_equalities[1] = ['owner.intervention_atom_version_ref'] }],
  ['release projection fingerprint unbound', c => { c.proof_authority.proof_family_resolution_map.pending_release_and_authority.cross_row_equalities.pop() }],
  ['lifecycle catalogue row removed', c => { delete c.lifecycle_precondition_catalog.pause_continuing }],
  ['lifecycle transition actor missing', c => { delete c.authoritative_row_schemas.lifecycle_transition_receipts.properties.actor_class }],
  ['lifecycle actor rule removed', c => { delete c.lifecycle_exact_derivation.actor_rules.named_leader_and_krish }],
  ['lifecycle precondition unbound', c => { c.proof_set_schemas.lifecycle_preconditions.owner_binding = 'any' }],
  ['watermark partial null accepted', c => { c.watermark_change_derivation.invalid_patterns = [] }],
  ['watermark precedence changed', c => { c.watermark_change_derivation.precedence.reverse() }],
  ['watermark variant removed from bytes', c => { c.controlling_watermarks.set_fingerprint.member_entry_encoding = 'member fingerprint' }],
  ['reconciled success generic schema', c => { c.outbox.transition_table.find(row => row.event_kind === 'reconciled_success').event_schema_ref = 'outbox.reconciliation_evidence_schema' }],
  ['payload exact equality removed', c => { c.outbox.payload_consumption_schema.exact_equalities.pop() }],
  ['payload consumption fingerprint weakened', c => { c.outbox.payload_consumption_schema.properties.consumption_fingerprint = { type: 'identifier' } }],
  ['terminal hides prior invocation', c => { c.outbox.reservation_budget_exhausted_schema.properties.provider_invocation_count = { type: 'safe_nonnegative_integer' } }],
  ['terminal condition vague', c => { c.outbox.transition_table.find(row => row.event_kind === 'reservation_budget_exhausted_without_invocation').condition = 'three reservations' }],
  ['invocation lease recheck removed', c => { c.outbox.provider_call_gate.current_rechecks_immediately_before_invocation.splice(2, 1) }],
  ['invocation accepts stale tip', c => { c.outbox.provider_call_gate.current_rechecks_immediately_before_invocation[3] = 'always' }],
  ['effect origin removed', c => { delete c.outbox.effect_origin_schema }],
  ['effect origin not unique', c => { c.outbox.effect_origin_schema.unique_keys = [] }],
  ['effect origin branch crosswired', c => { c.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.source_operation_result_schema_ref = 'result_payload_schemas.create_enrichment_plan' }],
  ['genesis accepts failed operation', c => { c.outbox.genesis_protocol.no_effect_from_hold_ineligible_invalidated_noop_or_failed_branch = false }],
  ['use release parent version stale', c => { c.result_payload_schemas.use_release.schema_version = 'ctrl.g24.result.use-release.r8.v1' }],
  ['changed row keeps R9 version', c => { c.authoritative_row_schemas.answer_receipts.schema_version = 'ctrl.g24.authoritative-row.answer-receipts.r9.v1' }],
  ['manifest path lies', c => { c.schema_change_manifest['authoritative_row_schemas.answer_receipts'] = 'ctrl.g24.authoritative-row.answer-receipts.r11.v2' }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR11)
  mutate(candidate)
  check(`mutation rejected: ${name}`, collect(candidate).length > 0)
}

if (failures.length) {
  console.error(`G24 trusted ingress R11 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R11 and ${mutations.length} mutation probes verified`)
console.log(`r11_machine_sha256=${sha(machinePath)}`)
