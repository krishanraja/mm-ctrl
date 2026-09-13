import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR7, materializedR7Output } from './materialize-ctrl-g24-trusted-ingress-r7.mjs'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r7.json'
const humanPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r7.md'
const qaPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-r7-qa-record.md'
const materializerPath = 'scripts/materialize-ctrl-g24-trusted-ingress-r7.mjs'
const failures = []
const check = (label, pass) => { if (!pass) failures.push(label) }

function resolveRef(rootObject, ref) {
  let current = rootObject
  for (const part of ref.split('.')) {
    if (current === null || typeof current !== 'object' || !(part in current)) return undefined
    current = current[part]
  }
  return current
}

function walk(value, visit, path = '$') {
  visit(value, path)
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${path}[${index}]`))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) walk(item, visit, `${path}.${key}`)
  }
}

function exactClosed(schema) {
  if (!schema || schema.type !== 'object' || schema.additional_properties !== false) return false
  const keys = Object.keys(schema.properties ?? {})
  const optional = schema.optional ?? []
  return same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}

const operations = [
  'select_intervention', 'create_intervention', 'stage_intervention_edit', 'issue_intervention_presentation_challenge',
  'record_intervention_visibility', 'approve_intervention', 'record_answer', 'correct_answer',
  'record_answer_transcription_repair', 'record_leader_lifecycle_action', 'record_operator_lifecycle_action',
  'combine_lifecycle_authority', 'apply_lifecycle_transition', 'compile_release', 'use_release',
  'create_enrichment_plan', 'record_enrichment_attempt',
]
const proofFamilies = ['selector_result', 'intervention_approval', 'answer', 'correction', 'lifecycle', 'pending_release_and_authority', 'enrichment_plan', 'execution_receipt']
const fingerprintNames = [
  'release_invalidation_receipt', 'lifecycle_authority_action', 'lifecycle_joint_authority_receipt',
  'lifecycle_action_combination_consumption', 'lifecycle_joint_transition_consumption', 'presentation_challenge',
  'intervention_visibility_receipt', 'outbox_attempt_reservation', 'outbox_attempt_dispatch',
  'provider_success_evidence', 'provider_failure_evidence', 'provider_ambiguity_evidence', 'provider_reconciliation_evidence',
]

function collect(candidate) {
  const found = []
  const assert = (label, pass) => { if (!pass) found.push(label) }

  assert('identity', candidate.schema_version === 'ctrl.g24.trusted-ingress.r7.effective.v1' && candidate.status === 'sixth_repair_candidate_under_independent_review')
  assert('materialization', candidate.materialization?.conceptual_overlay_allowed === false && candidate.materialization?.runtime_inheritance_allowed === false && candidate.materialization?.generator_must_reject_undefined_values_before_serialization === true)
  assert('operation universe', same(candidate.operation_names, operations) && same(candidate.request_schema?.properties?.operation_class?.values, operations) && operations.every(name => candidate.operation_specs?.[name] && candidate.operation_authority?.[name] && candidate.result_payload_schemas?.[name] && candidate.snapshot_and_cas_by_operation?.[name]))

  const usedTypes = new Set()
  const badRefs = []
  walk(candidate, (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    if (typeof value.type === 'string') usedTypes.add(value.type)
    for (const key of ['schema_ref', 'fingerprint_ref', 'enum_ref', 'member_ref']) {
      if (typeof value[key] === 'string' && resolveRef(candidate, value[key]) === undefined) badRefs.push(`${path}.${key}:${value[key]}`)
    }
  })
  assert('closed type graph', [...usedTypes].every(type => candidate.type_registry?.[type] !== undefined))
  assert('closed reference graph', badRefs.length === 0)
  assert('sha256 exact', candidate.type_registry?.sha256?.regex === '^[0-9a-f]{64}$' && candidate.type_registry.sha256.decoded_byte_length === 32 && candidate.type_registry.sha256.uppercase_allowed === false)
  assert('timestamp exact', candidate.type_registry?.canonical_timestamp?.regex?.endsWith('Z$') && candidate.type_registry.canonical_timestamp.semantic_validation === 'valid_gregorian_utc_instant_exactly_three_fractional_digits')
  assert('base64 exact', candidate.type_registry?.base64url_without_padding?.padding_allowed === false && candidate.type_registry.base64url_without_padding.validation === 'decode_then_reencode_must_equal_input_byte_for_byte')
  assert('integers exact', candidate.type_registry?.positive_integer?.minimum === 1 && candidate.type_registry.positive_integer.maximum === 9007199254740991 && candidate.type_registry?.safe_nonnegative_integer?.minimum === 0)
  assert('operation discriminator exact', candidate.type_registry?.operation_discriminated_object?.variant_map_path === 'operation_specs' && candidate.type_registry.operation_discriminated_object.selected_schema_member === 'intent')
  assert('watermark union exact', candidate.type_registry?.controlling_watermark_kind?.union?.length === 2 && resolveRef(candidate, candidate.type_registry.controlling_watermark_kind.union[0].enum_ref) !== undefined && resolveRef(candidate, candidate.type_registry.controlling_watermark_kind.union[1].member_ref) !== undefined)
  assert('watermark result uses closed union', candidate.result_payload_schemas?.use_release?.variants?.invalidated_before_use?.properties?.changed_controlling_watermark_kinds?.items?.type === 'controlling_watermark_kind')

  const encoding = candidate.canonical_field_encoding
  assert('canonical object and absence bytes', encoding?.object?.includes('schema_declared_field_order') && encoding.optional_absent === 'single_byte_0x00' && encoding.optional_present === 'single_byte_0x01_then_encoded_value')
  assert('canonical scalar bytes', encoding?.sha256 === '32_raw_bytes_decoded_from_lowercase_hex' && encoding?.integer_positive_integer_safe_nonnegative_integer === 'uint64_big_endian_unsigned' && encoding?.boolean_true === 'single_byte_0x01')
  assert('canonical arrays closed', encoding?.array?.startsWith('uint64_big_endian_item_count') && encoding.map_or_unspecified_json_value_allowed === false)

  assert('request invalidity is rejection', candidate.request_schema?.invalid_result === 'request_rejected' && candidate.request_schema?.invalid_side_effect === false)
  assert('CAS failure is defined hold', candidate.snapshot_cas_rule?.set_or_scalar_omission === 'snapshot_changed_hold' && candidate.hold_codes?.includes('snapshot_changed_hold'))
  const phases = candidate.request_admission?.phase_order ?? []
  assert('registry precedes fresh authority', phases.indexOf('lookup_registry_by_workspace_ref_and_operation_id') < phases.indexOf('if_absent_run_fresh_current_authority_admission_evaluation_and_snapshot_cas'))
  assert('replay disclosure only', same(candidate.request_admission?.replay_must_not_run, ['current_operation_authority', 'fresh_evaluator', 'snapshot_cas', 'protected_mutation']) && !candidate.request_admission?.replay_only_after_same_binding?.includes('current_operation_authority'))

  const challenge = candidate.presentation_challenge_schema
  const visibility = candidate.intervention_visibility_receipt_schema
  assert('challenge closed immutable TTL', exactClosed(challenge) && challenge.append_only === true && challenge.ttl_seconds === 300 && challenge.issuance_does_not_prove_presentation === true)
  assert('visibility intent is acknowledgement only', same(candidate.operation_specs?.record_intervention_visibility?.intent?.exact_keys, ['presentation_challenge_ref', 'acknowledged', 'acknowledgement_nonce']) && candidate.operation_specs.record_intervention_visibility.intent.properties.acknowledged.const === true)
  assert('visibility server resolved', exactClosed(visibility) && visibility.challenge_values_are_server_resolved_not_caller_asserted === true && visibility.hidden_render_prefetch_generation_or_optimistic_ui_is_not_presentation === true)
  assert('presentation cannot be automated', candidate.workload_authority_predicates?.workload_presentation_challenge_issuer_predicate?.can_acknowledge_for_human === false && candidate.presentation_protocol?.acknowledge?.includes('explicitly_acts_after_foregrounding'))
  assert('edit semantics preserved', candidate.operation_specs?.stage_intervention_edit?.product_semantic_action === 'edit' && candidate.approval_effects?.edit?.standing_after_operation === 'staged_not_approved')

  const approveBranches = candidate.operation_specs?.approve_intervention?.branch_effects
  assert('approval is branch exact', same(Object.keys(approveBranches ?? {}), ['approve', 'hold', 'suppress']) && !('write_set' in candidate.operation_specs.approve_intervention) && Object.values(approveBranches ?? {}).every(branch => branch.read_set?.length && branch.write_set?.includes('visibility_acknowledgement_consumption') && Array.isArray(branch.forbidden_write_set)))
  const releaseBranches = candidate.operation_specs?.use_release?.branch_effects
  assert('release is branch exact', same(releaseBranches?.pending_delivery?.write_set, ['release_use_receipt', 'pending_outbox_effect']) && same(releaseBranches?.invalidated_before_use?.write_set, ['release_invalidation_receipt']) && releaseBranches?.invalidated_before_use?.forbidden_write_set?.includes('outbox_effect') && !('write_set' in candidate.operation_specs.use_release))
  const transitionBranches = candidate.operation_specs?.apply_lifecycle_transition?.branch_effects
  assert('lifecycle transition is branch exact', transitionBranches?.two_party_authority?.write_set?.includes('joint_transition_consumption') && transitionBranches?.single_human_authority?.forbidden_write_set?.includes('joint_transition_consumption') && !('write_set' in candidate.operation_specs.apply_lifecycle_transition))

  const lifecycle = candidate.lifecycle_authority
  assert('lifecycle issue records immutable', exactClosed(lifecycle?.action_schema) && lifecycle.action_schema.append_only === true && exactClosed(lifecycle?.joint_receipt_schema) && lifecycle.joint_receipt_schema.append_only === true && !('consumed_at' in lifecycle.joint_receipt_schema.properties))
  assert('lifecycle consumption append-only', exactClosed(lifecycle?.action_combination_consumption_schema) && lifecycle.action_combination_consumption_schema.append_only === true && same(lifecycle.action_combination_consumption_schema.unique_keys, [['action_ref']]) && exactClosed(lifecycle?.joint_transition_consumption_schema) && same(lifecycle.joint_transition_consumption_schema.unique_keys, [['joint_receipt_ref']]))
  assert('lifecycle nonce collision exact', lifecycle?.action_nonce_collision?.same_case_actor_nonce_and_same_canonical_action_bytes?.startsWith('return_existing') && lifecycle?.action_nonce_collision?.same_case_actor_nonce_and_different_canonical_action_bytes === 'request_rejected_authority_nonce_conflict_without_mutation')
  assert('lifecycle pair collision exact', lifecycle?.action_pair_collision?.same_exact_leader_and_operator_action_refs?.startsWith('return_existing') && lifecycle?.action_pair_collision?.either_action_already_combined_with_another_action === 'authority_pair_conflict_hold_without_mutation')
  assert('lifecycle freshness complete', same(lifecycle?.fresh_joint_transition_predicate, ['server_now_strictly_before_joint_receipt_expires_at', 'recompute_and_match_both_action_fingerprints', 'recompute_and_match_joint_receipt_fingerprint', 'both_action_authority_versions_equal_current_case_bindings', 'action_consumption_rows_bind_both_actions_to_this_joint_receipt', 'no_joint_transition_consumption_row_exists', 'exact_case_transition_and_predecessor_lifecycle_version_match']))

  const proof = candidate.proof_authority
  assert('proof family map exact', same(candidate.proof_family_names, proofFamilies) && same(Object.keys(proof?.proof_family_resolution_map ?? {}), proofFamilies))
  assert('proof server only', proof?.caller_supplied_proof_bundle_allowed === false && proof?.browser_serializable_proof_bundle_allowed === false && proof?.resolution_transaction === 'same_serializable_transaction_as_evaluator_and_snapshot_cas')
  assert('proof rows exact', proofFamilies.every(family => {
    const map = proof.proof_family_resolution_map[family]
    const extension = candidate.proof_bundle_schemas.extensions[family]
    const owner = map?.canonical_owner
    return owner?.table && resolveRef(candidate, owner.schema_ref) && extension?.properties?.[owner.common_ref_equals_extension_field] && extension?.properties?.[owner.common_fingerprint_equals_extension_field]?.type === 'sha256' && owner.failure === 'proof_schema_hold' && map.extension_rows.every(row => resolveRef(candidate, row.schema_ref) && extension.properties[row.extension_ref_field] && extension.properties[row.extension_fingerprint_field]?.type === 'sha256' && same(row.equality, ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint']))
  }))
  assert('authoritative row schemas closed', Object.values(candidate.authoritative_row_schemas ?? {}).every(schema => exactClosed(schema) && schema.append_only === true && schema.current_rule === 'latest_valid_row_at_exact_snapshot'))

  assert('fingerprint universe exact', same(Object.keys(candidate.fingerprint_schemas ?? {}), fingerprintNames) && fingerprintNames.every(name => candidate.fingerprint_schemas[name]?.field_encoding_ref === 'canonical_field_encoding' && candidate.fingerprint_schemas[name]?.digest === 'sha256_of_exact_preimage' && candidate.fingerprint_schemas[name]?.fingerprint_field_excluded_from_preimage === true))
  assert('fingerprints use actual ordered fields', fingerprintNames.every(name => candidate.fingerprint_schemas[name].preimage_order.length > 2 && candidate.fingerprint_schemas[name].preimage_order[0] === 'domain_ascii'))

  const outbox = candidate.outbox
  assert('outbox event state derived', outbox?.authoritative_state === 'derived_from_append_only_claim_reservation_dispatch_terminal_and_reconciliation_events')
  assert('outbox reservation exact', exactClosed(outbox?.reservation_schema) && outbox.reservation_schema.append_only === true && outbox.reservation_schema.properties.attempt_ordinal.maximum === 3 && same(outbox.reservation.allowed_ordinals, [1, 2, 3]) && outbox.reservation.fourth_reservation_allowed === false)
  assert('outbox dispatch exact', exactClosed(outbox?.dispatch_schema) && outbox.dispatch_schema.append_only === true && same(outbox.dispatch_schema.unique_keys, [['reservation_ref'], ['dispatch_ref']]) && outbox.dispatch.exact_once_per_reservation === true && outbox.dispatch.commits_before_provider_call === true && outbox.dispatch.provider_call_uses_exact_dispatch_identity === true)
  assert('outbox terminal evidence exact', ['provider_success_evidence_schema', 'provider_failure_evidence_schema', 'ambiguity_evidence_schema', 'reconciliation_evidence_schema'].every(name => exactClosed(outbox?.[name]) && outbox[name].append_only === true && outbox[name].properties.dispatch_ref?.type === 'identifier' && outbox[name].properties.dispatch_fingerprint?.type === 'sha256' && outbox[name].properties.attempt_ordinal?.maximum === 3 && outbox[name].properties.fencing_token?.type === 'positive_integer' && outbox[name].properties.worker_ref?.type === 'identifier'))
  assert('outbox transition table exact', same(outbox?.transition_table?.map(row => `${row.from}->${row.to}:${row.event}`), ['pending->claimed:claim_event', 'claimed->failed:pre_provider_failure_event', 'claimed->reserved:attempt_reservation', 'reserved->dispatched:attempt_dispatch', 'dispatched->confirmed:provider_success_evidence', 'dispatched->failed:provider_failure_evidence', 'dispatched->ambiguous:worker_ambiguity_evidence', 'dispatched->ambiguous:lease_expiry_ambiguity_evidence', 'ambiguous->reserved:next_attempt_reservation', 'ambiguous->unknown:unknown_terminal_event', 'unknown->confirmed:reconciliation_evidence_confirmed', 'unknown->failed:reconciliation_evidence_failed']))
  assert('outbox reaper and reconciliation cannot send', outbox.transition_table[7]?.condition?.includes('no_terminal_evidence') && outbox.transition_table[7]?.provider_call === false && outbox.unknown_auto_resend === false && outbox.reconciliation_can_send === false && outbox.external_call_authorized_in_phase === false)
  assert('outbox retry identity stable', same(outbox.retry_identity, ['provider_ref', 'provider_operation_ref', 'provider_key', 'payload_fingerprint']) && outbox.retry_requires_exact_identity_match === true && outbox.lease_or_worker_change_resets_attempt_count === false)

  return found
}

check('machine equals generator', read(machinePath) === materializedR7Output)
check('exact R7 human bytes', sha(humanPath) === 'da14cbd9c07ea1ae0f74d12666127210a7830a0fc56d25b798e961c1b8bd8f06')
check('exact R7 machine bytes', sha(machinePath) === 'ad7aed7d9eb25d550816b498655c01ea91517dce0c2496342ea19f2cf431d8b1')
check('exact R7 QA bytes', sha(qaPath) === '7380c19113b556a3041d42fd2fd8c0a9b228e3be87a2d5a223add2ed9f5f41ad')
check('exact R7 materializer bytes', sha(materializerPath) === '03061346bf33a7a51bda70c20233b4bdc16b712c55738f4c520279fe6bee8a07')
check('exact rejected R6 effective bytes remain preserved', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r6.json') === '4f636f58fa721c665bbca96e11702451b8454081ed72068d14169cb364eb36a6')
for (const failure of collect(materializedR7)) failures.push(`R7 ${failure}`)

const mutations = [
  ['undefined conceptual materialization', c => { c.materialization.conceptual_overlay_allowed = true }],
  ['operation omitted', c => c.operation_names.pop()],
  ['operation request drift', c => c.request_schema.properties.operation_class.values.pop()],
  ['unknown type', c => { c.operation_specs.record_answer.intent.properties.answer_kind = { type: 'mystery' } }],
  ['dangling schema ref', c => { c.operation_specs.record_answer.intent.properties.answer_kind = { schema_ref: 'missing.answer' } }],
  ['dangling fingerprint ref', c => { c.outbox.provider_success_evidence_schema.fingerprint_ref = 'fingerprint_schemas.missing' }],
  ['sha uppercase', c => { c.type_registry.sha256.uppercase_allowed = true }],
  ['timestamp weakened', c => { c.type_registry.canonical_timestamp.semantic_validation = 'parseable' }],
  ['base64 padding', c => { c.type_registry.base64url_without_padding.padding_allowed = true }],
  ['positive zero', c => { c.type_registry.positive_integer.minimum = 0 }],
  ['watermark boolean', c => { c.result_payload_schemas.use_release.variants.invalidated_before_use.properties.changed_controlling_watermark_kinds.items = { type: 'boolean' } }],
  ['optional ambiguity', c => { c.canonical_field_encoding.optional_absent = 'zero_length' }],
  ['map encoding allowed', c => { c.canonical_field_encoding.map_or_unspecified_json_value_allowed = true }],
  ['invalid request commits hold', c => { c.request_schema.invalid_result = 'invalid_command_hold' }],
  ['CAS undefined outcome', c => { c.snapshot_cas_rule.set_or_scalar_omission = 'invalid_command_hold' }],
  ['fresh authority before registry', c => c.request_admission.phase_order.reverse()],
  ['replay reruns authority', c => c.request_admission.replay_only_after_same_binding.push('current_operation_authority')],
  ['challenge issuance proves display', c => { c.presentation_challenge_schema.issuance_does_not_prove_presentation = false }],
  ['challenge no TTL', c => { c.presentation_challenge_schema.ttl_seconds = 0 }],
  ['visibility caller asserts atom', c => c.operation_specs.record_intervention_visibility.intent.exact_keys.push('atom_version_ref')],
  ['hidden render accepted', c => { c.intervention_visibility_receipt_schema.hidden_render_prefetch_generation_or_optimistic_ui_is_not_presentation = false }],
  ['workload acknowledges', c => { c.workload_authority_predicates.workload_presentation_challenge_issuer_predicate.can_acknowledge_for_human = true }],
  ['edit semantic removed', c => { delete c.operation_specs.stage_intervention_edit.product_semantic_action }],
  ['approval unconditional write', c => { c.operation_specs.approve_intervention.write_set = ['approval'] }],
  ['approval omits visibility consumption', c => c.operation_specs.approve_intervention.branch_effects.approve.write_set.pop()],
  ['release invalid branch creates outbox', c => c.operation_specs.use_release.branch_effects.invalidated_before_use.write_set.push('outbox_effect')],
  ['release unconditional write', c => { c.operation_specs.use_release.write_set = [] }],
  ['lifecycle receipt mutable', c => { c.lifecycle_authority.joint_receipt_schema.properties.consumed_at = { type: 'canonical_timestamp' } }],
  ['action consumption reusable', c => { c.lifecycle_authority.action_combination_consumption_schema.unique_keys = [] }],
  ['joint consumption omitted', c => c.operation_specs.apply_lifecycle_transition.branch_effects.two_party_authority.write_set.pop()],
  ['nonce collision vague', c => { c.lifecycle_authority.action_nonce_collision.same_case_actor_nonce_and_different_canonical_action_bytes = 'hold' }],
  ['pair reuse allowed', c => { c.lifecycle_authority.action_pair_collision.either_action_already_combined_with_another_action = 'combine' }],
  ['lifecycle expiry omitted', c => c.lifecycle_authority.fresh_joint_transition_predicate.shift()],
  ['lifecycle fingerprints omitted', c => c.lifecycle_authority.fresh_joint_transition_predicate.splice(1, 2)],
  ['proof family omitted', c => { delete c.proof_authority.proof_family_resolution_map.answer }],
  ['proof caller supplied', c => { c.proof_authority.caller_supplied_proof_bundle_allowed = true }],
  ['proof mapping garbage', c => { c.proof_authority.proof_family_resolution_map.selector_result.canonical_owner.common_ref_equals_extension_field = 'garbage' }],
  ['proof fingerprint boolean', c => { c.proof_bundle_schemas.extensions.answer.properties.answer_receipt_fingerprint.type = 'boolean' }],
  ['proof equality omitted', c => c.proof_authority.proof_family_resolution_map.selector_result.extension_rows[0].equality.pop()],
  ['row schema open', c => { c.authoritative_row_schemas.selector_results.additional_properties = true }],
  ['fingerprint ref garbage', c => { c.fingerprint_schemas.provider_success_evidence.field_encoding_ref = 'garbage' }],
  ['fingerprint self included', c => { c.fingerprint_schemas.lifecycle_authority_action.fingerprint_field_excluded_from_preimage = false }],
  ['reservation mutable', c => { c.outbox.reservation_schema.append_only = false }],
  ['fourth attempt', c => c.outbox.reservation.allowed_ordinals.push(4)],
  ['dispatch reusable', c => { c.outbox.dispatch.exact_once_per_reservation = false }],
  ['provider called before dispatch commit', c => { c.outbox.dispatch.commits_before_provider_call = false }],
  ['success evidence loses dispatch', c => { c.outbox.provider_success_evidence_schema.properties.dispatch_ref = { type: 'boolean' } }],
  ['reaper transition omitted', c => c.outbox.transition_table.splice(7, 1)],
  ['reaper calls provider', c => { c.outbox.transition_table[7].provider_call = true }],
  ['reconciler sends', c => { c.outbox.reconciliation_can_send = true }],
  ['retry identity weakened', c => c.outbox.retry_identity.pop()],
  ['lease resets count', c => { c.outbox.lease_or_worker_change_resets_attempt_count = true }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR7)
  mutate(candidate)
  check(`mutation rejected: ${name}`, collect(candidate).length > 0)
}

if (failures.length) {
  console.error(`G24 trusted ingress R7 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`ok: fully materialized G24 trusted ingress R7 and ${mutations.length} mutation probes verified`)
console.log(`r7_machine_sha256=${sha(machinePath)}`)
