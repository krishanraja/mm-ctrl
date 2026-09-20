import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR8, materializedR8Output } from './materialize-ctrl-g24-trusted-ingress-r8.mjs'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r8.json'
const humanPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r8.md'
const qaPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-r8-qa-record.md'
const materializerPath = 'scripts/materialize-ctrl-g24-trusted-ingress-r8.mjs'
const failures = []
const check = (label, pass) => { if (!pass) failures.push(label) }

function ownRef(rootObject, ref) {
  if (typeof ref !== 'string' || !ref || ref.split('.').some(part => part === '__proto__' || part === 'prototype' || part === 'constructor')) return undefined
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
const presentationPredicate = ['authenticated_stable_actor_ref_equals_challenge_viewer_actor_ref', 'authenticated_stable_actor_ref_equals_current_case_engagement_operator_ref', 'challenge_case_ref_equals_requested_case_ref', 'challenge_atom_ref_version_and_content_fingerprint_equal_the_foregrounded_atom', 'challenge_fingerprint_recomputed_and_equal', 'server_now_strictly_before_challenge_expires_at', 'no_prior_visibility_acknowledgement_exists_for_challenge_ref', 'foreground_attestation_equals_the_exact_constant']
const lifecycleFreshness = ['server_now_strictly_before_joint_receipt_expires_at', 'recompute_and_match_both_action_fingerprints', 'recompute_and_match_joint_receipt_fingerprint', 'both_action_authority_versions_equal_current_case_bindings', 'action_consumption_rows_bind_both_actions_to_this_joint_receipt', 'no_joint_transition_consumption_row_exists', 'exact_case_transition_and_predecessor_lifecycle_version_match']
const transitionSignatures = ['pending->claimed:claim', 'claimed->failed:pre_provider_failure', 'claimed->reserved:attempt_reservation', 'reserved->dispatched:attempt_dispatch', 'dispatched->confirmed:provider_success', 'dispatched->failed:provider_failure', 'dispatched->ambiguous:worker_ambiguity', 'dispatched->ambiguous:lease_expiry_ambiguity', 'ambiguous->claimed:retry_claim', 'ambiguous->unknown:unknown_terminal', 'unknown->confirmed:reconciled_success', 'unknown->failed:reconciled_failure']
const transitionConditions = ['no_live_successor_of_pending_creation_event', 'current_claim_fence_worker_and_one_named_pre_provider_failure', 'current_claim_fence_worker_unexpired_lease_and_next_ordinal_lte_three', 'reservation_unconsumed_current_claim_fence_worker_and_all_provider_prechecks_pass', 'exact_dispatch_identity_and_provider_success_evidence', 'exact_dispatch_identity_and_definitive_provider_failure_evidence', 'exact_dispatch_identity_and_worker_reports_unknown_outcome', 'server_now_after_dispatch_bound_lease_expiry_and_no_successor_transition_exists', 'current_provider_idempotency_guarantee_exact_retry_identity_and_committed_reservation_count_below_three', 'no_current_idempotency_guarantee_or_three_reservations_used', 'exact_unknown_causal_chain_dispatch_identity_and_provider_evidence', 'exact_unknown_causal_chain_dispatch_identity_and_provider_evidence']

function collect(candidate) {
  const found = []
  const assert = (label, pass) => { if (!pass) found.push(label) }
  assert('identity', candidate.schema_version === 'ctrl.g24.trusted-ingress.r8.effective.v1' && candidate.status === 'seventh_repair_candidate_under_independent_review')
  assert('materialization', candidate.materialization?.conceptual_overlay_allowed === false && candidate.materialization?.runtime_inheritance_allowed === false && candidate.materialization?.generator_must_reject_undefined_values_before_serialization === true)

  const usedTypes = new Set()
  const refKeys = new Set(['schema_ref', 'fingerprint_ref', 'enum_ref', 'member_schema_ref', 'actor_authority_ref', 'branch_effects_ref', 'event_schema_ref', 'set_schema_ref'])
  const badRefs = []
  walk(candidate, (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    if (typeof value.type === 'string') usedTypes.add(value.type)
    for (const [key, ref] of Object.entries(value)) if (refKeys.has(key) && typeof ref === 'string' && ownRef(candidate, ref) === undefined) badRefs.push(`${path}.${key}:${ref}`)
  })
  assert('type graph closed', [...usedTypes].every(type => Object.hasOwn(candidate.type_registry ?? {}, type)))
  assert('reference graph own-property closed', badRefs.length === 0)
  assert('operation graph exact', same(candidate.operation_names, operations) && same(candidate.request_schema?.properties?.operation_class?.values, operations) && operations.every(name => candidate.operation_specs?.[name] && candidate.operation_authority?.[name] && candidate.result_payload_schemas?.[name] && candidate.snapshot_and_cas_by_operation?.[name]))
  assert('evaluator operation parity exact', same(Object.keys(candidate.evaluator_abi?.operation_result_exports ?? {}), operations) && operations.every(name => candidate.evaluator_abi.operation_result_exports[name] === candidate.result_payload_schemas[name].schema_version) && candidate.evaluator_abi.operation_export_parity?.startsWith('keys_equal_operation_names'))

  const watermark = candidate.type_registry?.controlling_watermark_member
  assert('watermark structural union exact', watermark?.discriminator === 'kind_class' && exactClosed(watermark?.variants?.base) && exactClosed(watermark?.variants?.applicable_control) && watermark.variants.applicable_control.properties.control_id.type === 'identifier' && !candidate.type_registry.controlling_watermark_kind)
  assert('watermark result and receipt parity', candidate.result_payload_schemas?.use_release?.variants?.invalidated_before_use?.properties?.changed_controlling_watermark_kinds?.items?.type === 'controlling_watermark_member' && candidate.release_invalidation?.invalidation_receipt_schema?.properties?.changed_controlling_watermark_kinds?.items?.type === 'controlling_watermark_member')
  assert('watermark no narrower grammar', candidate.controlling_watermarks?.additional_kind_grammar?.control_id_type === 'identifier' && candidate.controlling_watermarks.additional_kind_grammar.narrower_duplicate_control_id_grammar_allowed === false)

  assert('challenge viewer is server resolved', same(candidate.operation_specs?.issue_intervention_presentation_challenge?.intent?.exact_keys, ['intervention_atom_ref', 'atom_version_ref']) && candidate.presentation_challenge_schema?.viewer_actor_ref_source === 'current_case_engagement_operator_ref_server_resolved' && candidate.presentation_challenge_schema?.expires_at_derivation === 'exact_server_issued_at_plus_300_seconds')
  assert('challenge issuance predicate complete', same(candidate.presentation_challenge_issuance_predicate, ['issuer_is_current_granted_presentation_challenge_workload', 'requested_case_ref_equals_atom_case_ref', 'atom_ref_and_version_are_current_or_staged_and_content_fingerprint_is_recomputed', 'viewer_actor_ref_equals_current_case_engagement_operator_ref', 'server_nonce_is_fresh_for_case_and_viewer', 'expires_at_equals_issued_at_plus_exact_300_seconds']))
  assert('presentation is exact human attestation', same(candidate.presentation_acknowledgement_predicate, presentationPredicate) && candidate.operation_specs?.record_intervention_visibility?.intent?.properties?.foreground_attestation?.const === 'I_acknowledge_that_the_exact_challenge_bound_content_was_foregrounded_to_me' && !candidate.operation_specs.record_intervention_visibility.intent.properties.acknowledged)
  assert('presentation collision registry complete', candidate.presentation_acknowledgement_collision?.same_challenge_and_same_stable_attestation_projection?.startsWith('commit_new_operation_registry_success') && candidate.presentation_acknowledgement_collision?.same_challenge_and_different_stable_attestation_projection === 'presentation_acknowledgement_conflict_hold_with_committed_operation_registry_hold' && candidate.hold_codes?.includes('presentation_acknowledgement_conflict_hold'))
  assert('visibility consumption defined unique', exactClosed(candidate.intervention_visibility_consumption_schema) && candidate.intervention_visibility_consumption_schema.append_only === true && same(candidate.intervention_visibility_consumption_schema.unique_keys, [['visibility_acknowledgement_ref']]))

  assert('one approval effect authority', candidate.approval_effects?.branch_effects_ref === 'operation_specs.approve_intervention.branch_effects' && !Object.values(candidate.approval_effects?.semantics ?? {}).some(value => value.write_set) && candidate.approval_effects?.edit_and_approve_in_one_operation_allowed === false)
  assert('approval branches consume visibility', ['approve', 'hold', 'suppress'].every(branch => candidate.operation_specs?.approve_intervention?.branch_effects?.[branch]?.write_set?.includes('intervention_visibility_consumption')))
  assert('release effect vocabulary exact', same(candidate.operation_specs?.use_release?.branch_effects?.invalidated_before_use?.write_set, candidate.release_invalidation?.invalidated_write_set) && same(candidate.operation_specs?.use_release?.branch_effects?.invalidated_before_use?.forbidden_write_set, candidate.release_invalidation?.invalidated_forbidden_write_set) && candidate.release_invalidation?.branch_effects_ref === 'operation_specs.use_release.branch_effects.invalidated_before_use')

  const lifecycle = candidate.lifecycle_authority
  assert('lifecycle stable projection exact', exactClosed(lifecycle?.stable_action_projection_schema) && lifecycle.stable_action_projection_schema.properties.projection_fingerprint?.type === 'sha256' && lifecycle.action_schema.properties.secondary_idempotency_fingerprint?.type === 'sha256')
  assert('lifecycle same projection excludes server fields', same(lifecycle?.action_nonce_collision?.excluded_server_fields, ['action_ref', 'issued_at', 'expires_at', 'action_fingerprint']) && lifecycle.action_nonce_collision.comparison === 'recomputed_stable_action_projection_fingerprint')
  assert('lifecycle collisions phase valid', lifecycle?.action_nonce_collision?.same_case_actor_nonce_and_same_projection?.startsWith('commit_new_operation_registry_success') && lifecycle?.action_nonce_collision?.same_case_actor_nonce_and_different_projection === 'authority_nonce_conflict_hold_with_committed_operation_registry_hold' && lifecycle?.action_pair_collision?.same_exact_leader_and_operator_action_refs?.startsWith('commit_new_operation_registry_success') && lifecycle?.action_pair_collision?.either_action_already_combined_with_another_action === 'authority_pair_conflict_hold_with_committed_operation_registry_hold' && ['authority_nonce_conflict_hold', 'authority_pair_conflict_hold'].every(code => candidate.hold_codes.includes(code)))
  assert('secondary idempotency commits new operation', same(candidate.operation_registry?.secondary_idempotency?.applies_to, ['record_leader_lifecycle_action', 'record_operator_lifecycle_action', 'combine_lifecycle_authority', 'record_intervention_visibility']) && candidate.operation_registry.secondary_idempotency.new_operation_id_always_commits === 'committed_success_or_committed_hold_under_normal_registry_rules')
  assert('lifecycle freshness retained', same(lifecycle?.fresh_joint_transition_predicate, lifecycleFreshness))

  const rowSchemas = candidate.authoritative_row_schemas ?? {}
  const rowFingerprints = candidate.authoritative_row_fingerprint_schemas ?? {}
  assert('proof families exact', same(Object.keys(candidate.proof_authority?.proof_family_resolution_map ?? {}), proofFamilies))
  assert('authoritative rows family specific', Object.keys(rowSchemas).length >= 18 && Object.values(rowSchemas).every(schema => exactClosed(schema) && schema.append_only === true && schema.partition_key?.length === 4 && schema.current_selection?.includes('maximum_valid_from') && schema.current_selection_unique_or_hold === true))
  assert('authoritative row fingerprints closed', Object.entries(rowSchemas).every(([, schema]) => {
    const rule = ownRef(candidate, schema.fingerprint_ref)
    return rule && schema.fingerprint_field_must_equal_referenced_preimage_digest === true && schema.properties[schema.fingerprint_field]?.type === 'sha256' && same(rule.preimage_order.slice(1), Object.keys(schema.properties).filter(key => key !== schema.fingerprint_field))
  }) && Object.keys(rowFingerprints).length === Object.keys(rowSchemas).length)
  assert('proof mapping complete', proofFamilies.every(family => {
    const extension = candidate.proof_bundle_schemas.extensions[family]
    const map = candidate.proof_authority.proof_family_resolution_map[family]
    if (!extension || !map?.canonical_owner || !Array.isArray(map.extension_rows) || !Array.isArray(map.extension_seals)) return false
    const covered = new Set([map.canonical_owner.common_ref_equals_extension_field, map.canonical_owner.common_fingerprint_equals_extension_field])
    map.canonical_owner.embedded_extension_equalities.forEach(pair => covered.add(pair.extension_field))
    map.extension_rows.forEach(row => row.field_equalities.forEach(pair => covered.add(pair.extension_field)))
    map.extension_seals.forEach(seal => covered.add(seal.extension_field))
    const authorityFields = Object.keys(extension.properties).filter(field => field.endsWith('_ref') || field.endsWith('_fingerprint') || field.endsWith('_seal') || field.endsWith('_tip') || field.endsWith('_version') || field === 'attempt_ordinal')
    return authorityFields.every(field => covered.has(field)) && ownRef(candidate, map.canonical_owner.schema_ref) && map.extension_rows.every(row => ownRef(candidate, row.schema_ref) && same(row.scope_equalities, ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint']) && row.failure === 'proof_schema_hold') && map.extension_seals.every(seal => ownRef(candidate, seal.set_schema_ref) && seal.equality === 'extension_field_equals_recomputed_complete_set_fingerprint')
  }))
  assert('proof sets exact', same(Object.keys(candidate.proof_set_schemas ?? {}), ['answer_chain', 'answer_dependency_graph', 'lifecycle_preconditions', 'controlling_watermarks']) && Object.values(candidate.proof_set_schemas).every(set => ownRef(candidate, set.member_schema_ref) && ownRef(candidate, set.fingerprint_ref) && set.completeness))

  const linkedSchemas = [
    candidate.presentation_challenge_schema, candidate.intervention_visibility_receipt_schema, candidate.intervention_visibility_consumption_schema, candidate.release_invalidation.invalidation_receipt_schema,
    lifecycle.action_schema, lifecycle.joint_receipt_schema, lifecycle.action_combination_consumption_schema, lifecycle.joint_transition_consumption_schema, lifecycle.stable_action_projection_schema,
    candidate.outbox.reservation_schema, candidate.outbox.dispatch_schema, candidate.outbox.provider_success_evidence_schema,
    candidate.outbox.provider_failure_evidence_schema, candidate.outbox.ambiguity_evidence_schema, candidate.outbox.reconciliation_evidence_schema,
    candidate.outbox.transition_event_schema, candidate.outbox.claim_event_schema, candidate.outbox.pre_provider_failure_event_schema, candidate.outbox.unknown_event_schema,
  ]
  assert('all authority fingerprints linked', linkedSchemas.every(schema => schema && ownRef(candidate, schema.fingerprint_ref) && schema.fingerprint_field_must_equal_referenced_preimage_digest === true && schema.properties[schema.fingerprint_field]?.type === 'sha256'))
  const allFingerprintRules = [...Object.values(candidate.fingerprint_schemas ?? {}), ...Object.values(rowFingerprints)]
  assert('fingerprint domains unique', new Set(allFingerprintRules.map(rule => rule.domain_ascii)).size === allFingerprintRules.length)
  assert('linked fingerprint preimages complete', linkedSchemas.every(schema => {
    const rule = schema && ownRef(candidate, schema.fingerprint_ref)
    return rule?.preimage_order && same(rule.preimage_order.slice(1), Object.keys(schema.properties).filter(key => key !== schema.fingerprint_field))
  }))

  const outbox = candidate.outbox
  assert('outbox actor authority exact', same(Object.keys(outbox?.actor_authority ?? {}), ['claim', 'reserve_dispatch_and_record_provider_outcome', 'expire_dispatch_or_ambiguity', 'reconcile_unknown']) && outbox.actor_authority.claim.length === 2 && outbox.actor_authority.expire_dispatch_or_ambiguity[0] === 'workload_outbox_lease_reaper_predicate')
  assert('outbox causal transition unique', exactClosed(outbox?.transition_event_schema) && outbox.transition_event_schema.append_only === true && same(outbox.transition_event_schema.unique_keys, [['outbox_effect_ref', 'causal_predecessor_event_ref'], ['transition_event_ref']]) && outbox.append_transition_transaction?.atomic === true && outbox.append_transition_transaction?.compare_and_swap === 'unique_outbox_effect_and_causal_predecessor_event_ref')
  assert('outbox symbolic events materialized', exactClosed(outbox?.claim_event_schema) && exactClosed(outbox?.pre_provider_failure_event_schema) && exactClosed(outbox?.unknown_event_schema))
  assert('outbox transition table exact', same(outbox?.transition_table?.map(row => `${row.from}->${row.to}:${row.event_kind}`), transitionSignatures) && same(outbox?.transition_table?.map(row => row.condition), transitionConditions) && outbox.transition_table.every(row => ownRef(candidate, row.event_schema_ref) && ownRef(candidate, row.actor_authority_ref) && row.provider_call !== undefined))
  assert('outbox ambiguity retries through claim', same(outbox?.claim?.eligible_from, ['pending', 'ambiguous']) && outbox.transition_table[8].from === 'ambiguous' && outbox.transition_table[8].to === 'claimed' && outbox.transition_table[8].condition.includes('idempotency_guarantee'))
  assert('outbox terminal identity exact', same(outbox?.dispatch_identity_fields, ['outbox_effect_ref', 'attempt_ordinal', 'dispatch_ref', 'dispatch_fingerprint', 'fencing_token', 'worker_ref', 'provider_ref', 'provider_operation_ref', 'provider_key', 'payload_fingerprint']) && same(outbox?.terminal_evidence_binding_predicate?.all_dispatch_identity_fields_equal_referenced_dispatch, outbox.dispatch_identity_fields) && outbox.terminal_evidence_binding_predicate.exactly_one_successor_enforced_by_transition_event_unique_key?.length === 2)
  assert('outbox no reaper or reconciler send', outbox.transition_table[7].provider_call === false && outbox.transition_table[9].provider_call === false && outbox.transition_table[10].provider_call === false && outbox.transition_table[11].provider_call === false && outbox.unknown_auto_resend === false && outbox.reconciliation_can_send === false && outbox.external_call_authorized_in_phase === false)
  assert('outbox count cannot reset', same(outbox.retry_identity, ['provider_ref', 'provider_operation_ref', 'provider_key', 'payload_fingerprint']) && outbox.retry_requires_exact_identity_match === true && outbox.lease_or_worker_change_resets_attempt_count === false && same(outbox.reservation.allowed_ordinals, [1, 2, 3]) && outbox.reservation.fourth_reservation_allowed === false)

  return found
}

check('machine equals generator', read(machinePath) === materializedR8Output)
check('exact R8 human bytes', sha(humanPath) === '523bb4f6db4cf906d3f4c89aa8aec33bf6c073d61ba80dbd5f5b2df2e8fc2c1a')
check('exact R8 machine bytes', sha(machinePath) === '9c2e47956904daf7fb35aa43c30f124a0659995535d2dc30e38f6bcb5bf8a7bb')
check('exact R8 QA bytes', sha(qaPath) === '623ef8fcb42977cef4fa1c8dbf89b26de343664d875d97271dfe9f1ec8d58113')
check('exact R8 materializer bytes', sha(materializerPath) === '8961aabf54a10425483025c6448ef24426fe32b6647ca876ffa3aede7b493a93')
check('rejected R7 machine preserved', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r7.json') === 'ad7aed7d9eb25d550816b498655c01ea91517dce0c2496342ea19f2cf431d8b1')
for (const failure of collect(materializedR8)) failures.push(`R8 ${failure}`)

const mutations = [
  ['inherited schema ref', c => { c.operation_specs.record_answer.intent.properties.answer_kind = { schema_ref: '__proto__' } }],
  ['operation omitted', c => c.operation_names.pop()],
  ['evaluator export omitted', c => { delete c.evaluator_abi.operation_result_exports.issue_intervention_presentation_challenge }],
  ['evaluator export stale', c => { c.evaluator_abi.operation_result_exports.record_intervention_visibility = 'ctrl.g24.result.record-intervention-visibility.r6.v1' }],
  ['watermark string restored', c => { c.result_payload_schemas.use_release.variants.invalidated_before_use.properties.changed_controlling_watermark_kinds.items = { type: 'identifier' } }],
  ['watermark narrower grammar', c => { c.type_registry.controlling_watermark_member.variants.applicable_control.properties.control_id = { type: 'string', max_utf8_bytes: 128 } }],
  ['challenge caller chooses viewer', c => c.operation_specs.issue_intervention_presentation_challenge.intent.exact_keys.push('intended_viewer_ref')],
  ['challenge expiry vague', c => { c.presentation_challenge_schema.expires_at_derivation = 'soon' }],
  ['presentation actor equality omitted', c => c.presentation_acknowledgement_predicate.shift()],
  ['presentation challenge fingerprint omitted', c => c.presentation_acknowledgement_predicate.splice(4, 1)],
  ['presentation no explicit attestation', c => { delete c.operation_specs.record_intervention_visibility.intent.properties.foreground_attestation }],
  ['presentation conflict unregistered', c => { c.hold_codes = c.hold_codes.filter(code => code !== 'presentation_acknowledgement_conflict_hold') }],
  ['visibility consumption reusable', c => { c.intervention_visibility_consumption_schema.unique_keys = [] }],
  ['duplicate approval writes', c => { c.approval_effects.semantics.approve.write_set = ['other'] }],
  ['approval consumption omitted', c => c.operation_specs.approve_intervention.branch_effects.approve.write_set.pop()],
  ['release effect names drift', c => { c.operation_specs.use_release.branch_effects.invalidated_before_use.write_set = ['release_invalidation_receipt'] }],
  ['lifecycle stable projection loses nonce', c => { delete c.lifecycle_authority.stable_action_projection_schema.properties.nonce }],
  ['lifecycle compares issue bytes', c => { c.lifecycle_authority.action_nonce_collision.comparison = 'action_fingerprint' }],
  ['lifecycle server fields included', c => c.lifecycle_authority.action_nonce_collision.excluded_server_fields.pop()],
  ['lifecycle nonce code absent', c => { c.hold_codes = c.hold_codes.filter(code => code !== 'authority_nonce_conflict_hold') }],
  ['lifecycle pair conflict mutates', c => { c.lifecycle_authority.action_pair_collision.either_action_already_combined_with_another_action = 'combine' }],
  ['new operation not committed', c => { c.operation_registry.secondary_idempotency.new_operation_id_always_commits = false }],
  ['lifecycle expiry omitted', c => c.lifecycle_authority.fresh_joint_transition_predicate.shift()],
  ['proof family omitted', c => { delete c.proof_authority.proof_family_resolution_map.answer }],
  ['proof owner generic schema', c => { c.authoritative_row_schemas.answer_receipts.properties = { answer_receipt_ref: { type: 'identifier' }, answer_receipt_fingerprint: { type: 'sha256' } } }],
  ['proof owner current selection vague', c => { c.authoritative_row_schemas.selector_results.current_selection = 'latest' }],
  ['proof owner fingerprint circular', c => { c.authoritative_row_fingerprint_schemas.authoritative_row_selector_results.preimage_order.push('selector_result_fingerprint') }],
  ['proof answer authority row omitted', c => c.proof_authority.proof_family_resolution_map.answer.extension_rows.shift()],
  ['proof lifecycle seal omitted', c => c.proof_authority.proof_family_resolution_map.lifecycle.extension_seals.pop()],
  ['proof field equality corrupted', c => { c.proof_authority.proof_family_resolution_map.enrichment_plan.extension_rows[0].field_equalities[0].extension_field = 'garbage' }],
  ['proof row scope weakened', c => c.proof_authority.proof_family_resolution_map.intervention_approval.extension_rows[0].scope_equalities.pop()],
  ['proof set unresolved', c => { c.proof_set_schemas.answer_chain.member_schema_ref = '__proto__' }],
  ['fingerprint link omitted', c => { delete c.presentation_challenge_schema.fingerprint_ref }],
  ['reservation fingerprint link omitted', c => { delete c.outbox.reservation_schema.fingerprint_ref }],
  ['fingerprint domains collapsed', c => { c.fingerprint_schemas.presentation_challenge.domain_ascii = c.fingerprint_schemas.intervention_visibility_receipt.domain_ascii }],
  ['fingerprint preimage field omitted', c => c.fingerprint_schemas.provider_success_evidence.preimage_order.pop()],
  ['transition uniqueness removed', c => { c.outbox.transition_event_schema.unique_keys = [['transition_event_ref']] }],
  ['claim schema removed', c => { delete c.outbox.claim_event_schema }],
  ['claim authority removed', c => { c.outbox.actor_authority.claim = [] }],
  ['transition actor ref inherited', c => { c.outbox.transition_table[0].actor_authority_ref = '__proto__' }],
  ['transition condition weakened', c => { c.outbox.transition_table[7].condition = 'lease_expired' }],
  ['ambiguous skips claim', c => { c.outbox.transition_table[8].to = 'reserved' }],
  ['terminal identity field omitted', c => c.outbox.dispatch_identity_fields.pop()],
  ['terminal binding drift', c => c.outbox.terminal_evidence_binding_predicate.all_dispatch_identity_fields_equal_referenced_dispatch.pop()],
  ['payload transition non-atomic', c => { c.outbox.append_transition_transaction.atomic = false }],
  ['reaper sends', c => { c.outbox.transition_table[7].provider_call = true }],
  ['reconciler sends', c => { c.outbox.reconciliation_can_send = true }],
  ['fourth reservation', c => c.outbox.reservation.allowed_ordinals.push(4)],
  ['lease resets count', c => { c.outbox.lease_or_worker_change_resets_attempt_count = true }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR8)
  mutate(candidate)
  check(`mutation rejected: ${name}`, collect(candidate).length > 0)
}

if (failures.length) {
  console.error(`G24 trusted ingress R8 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R8 and ${mutations.length} mutation probes verified`)
console.log(`r8_machine_sha256=${sha(machinePath)}`)
