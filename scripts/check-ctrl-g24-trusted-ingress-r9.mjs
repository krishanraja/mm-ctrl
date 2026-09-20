import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR9, materializedR9Output } from './materialize-ctrl-g24-trusted-ingress-r9.mjs'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r9.json'
const humanPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r9.md'
const qaPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-r9-qa-record.md'
const materializerPath = 'scripts/materialize-ctrl-g24-trusted-ingress-r9.mjs'
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
const transitionSignatures = [
  'pending->claimed:claim', 'claimed->failed:pre_provider_failure', 'claimed->reserved:attempt_reservation',
  'reserved->dispatched:attempt_dispatch', 'dispatched->invoking:provider_invocation_start',
  'dispatched->abandoned_not_invoked:abandon_without_invocation',
  'abandoned_not_invoked->claimed:retry_after_no_invocation',
  'invoking->confirmed:provider_success', 'invoking->failed:provider_failure',
  'invoking->ambiguous:worker_ambiguity', 'invoking->ambiguous:lease_expiry_ambiguity',
  'ambiguous->claimed:retry_claim', 'ambiguous->unknown:unknown_terminal',
  'unknown->confirmed:reconciled_success', 'unknown->failed:reconciled_failure',
]

function collect(candidate) {
  const found = []
  const assert = (label, pass) => { if (!pass) found.push(label) }
  assert('identity', candidate.schema_version === 'ctrl.g24.trusted-ingress.r9.effective.v1' && candidate.status === 'eighth_repair_candidate_under_independent_review')
  assert('frozen R8 input', candidate.materialization?.frozen_input?.sha256 === '9c2e47956904daf7fb35aa43c30f124a0659995535d2dc30e38f6bcb5bf8a7bb' && candidate.materialization?.conceptual_overlay_allowed === false && candidate.materialization?.runtime_inheritance_allowed === false)

  const usedTypes = new Set()
  const badRefs = []
  const refKeys = new Set(['schema_ref', 'fingerprint_ref', 'enum_ref', 'member_schema_ref', 'actor_authority_ref', 'branch_effects_ref', 'event_schema_ref', 'set_schema_ref', 'payload_schema_ref', 'semantic_fingerprint_ref'])
  walk(candidate, (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    if (typeof value.type === 'string') usedTypes.add(value.type)
    for (const [key, ref] of Object.entries(value)) if (refKeys.has(key) && typeof ref === 'string' && ownRef(candidate, ref) === undefined) badRefs.push(`${path}.${key}:${ref}`)
  })
  assert('type graph closed', [...usedTypes].every(type => Object.hasOwn(candidate.type_registry ?? {}, type)))
  assert('reference graph own-property closed', badRefs.length === 0)
  assert('operation graph exact', same(candidate.operation_names, operations) && operations.every(name => candidate.operation_specs?.[name] && candidate.result_payload_schemas?.[name]))

  const opData = candidate.evaluator_abi?.operation_result_exports
  const opSchema = candidate.evaluator_abi?.operation_result_exports_schema
  assert('closed operation export schema', exactClosed(opSchema) && same(Object.keys(opData ?? {}), operations) && operations.every(name => opSchema.properties[name]?.const === opData[name] && opData[name] === candidate.result_payload_schemas[name].schema_version && candidate.operation_specs[name].result_schema === opData[name]))
  const proofData = candidate.evaluator_abi?.proof_family_exports
  const proofSchema = candidate.evaluator_abi?.proof_family_exports_schema
  assert('closed proof export schema', exactClosed(proofSchema) && same(Object.keys(proofData ?? {}), proofFamilies) && proofFamilies.every(name => proofSchema.properties[name]?.const === proofData[name] && proofData[name] === candidate.proof_bundle_schemas.extensions[name].schema_version))

  const watermark = candidate.type_registry?.controlling_watermark_member
  const watermarkIdentity = candidate.controlling_watermarks?.member_identity
  assert('watermark structural variants carry lineage and version', ['base', 'applicable_control'].every(kind => exactClosed(watermark?.variants?.[kind]) && ['lineage_ref', 'version_ref'].every(field => watermark.variants[kind].required.includes(field))))
  assert('watermark identity projection exact', same(watermarkIdentity?.base, ['kind_class', 'base_kind', 'lineage_ref', 'version_ref']) && same(watermarkIdentity?.applicable_control, ['kind_class', 'control_id', 'lineage_ref', 'version_ref']) && same(candidate.proof_set_schemas?.controlling_watermarks?.identity_projection_by_variant, watermarkIdentity) && !candidate.proof_set_schemas.controlling_watermarks.identity_projection)

  const visibility = candidate.visibility_secondary_idempotency
  const visibilityProjection = candidate.visibility_stable_attestation_projection_schema
  assert('visibility stable projection closed and linked', exactClosed(visibilityProjection) && visibilityProjection.properties.foreground_attestation?.const === 'I_acknowledge_that_the_exact_challenge_bound_content_was_foregrounded_to_me' && visibilityProjection.properties.acknowledgement_nonce?.type === 'identifier' && ownRef(candidate, visibilityProjection.fingerprint_ref))
  assert('visibility receipt binds secondary identity', candidate.intervention_visibility_receipt_schema?.schema_version === 'ctrl.g24.intervention-visibility-acknowledgement.r9.v1' && candidate.intervention_visibility_receipt_schema?.properties?.secondary_idempotency_fingerprint?.type === 'sha256' && candidate.intervention_visibility_receipt_schema.required.includes('secondary_idempotency_fingerprint'))
  assert('visibility existing lookup precedes fresh predicate', same(visibility?.unique_lookup_key, ['case_ref', 'presentation_challenge_ref']) && visibility.phase_order.indexOf('lookup_existing_visibility_acknowledgement_by_unique_case_and_challenge') < visibility.phase_order.indexOf('if_absent_run_fresh_presentation_acknowledgement_predicate') && visibility.same_projection_creates_new_receipt === false)

  const rowSchemas = candidate.authoritative_row_schemas ?? {}
  const semanticRules = candidate.authoritative_semantic_fingerprint_schemas ?? {}
  const envelopeRules = candidate.authoritative_row_fingerprint_schemas ?? {}
  assert('all authoritative rows are closed content envelopes', Object.keys(rowSchemas).length === 19 && Object.entries(rowSchemas).every(([table, schema]) => exactClosed(schema) && schema.append_only === true && schema.properties.row_envelope_fingerprint?.type === 'sha256' && schema.semantic_fingerprint_field && schema.semantic_fingerprint_field !== 'row_envelope_fingerprint' && ownRef(candidate, schema.semantic_fingerprint_ref) && ownRef(candidate, schema.fingerprint_ref) && semanticRules[table] && envelopeRules[table]))
  assert('semantic fingerprints cover content fields', Object.entries(rowSchemas).every(([table, schema]) => {
    const rule = semanticRules[table]
    const metadata = new Set(['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'row_version_ref', 'valid_from', 'valid_until', 'row_envelope_fingerprint'])
    return same(rule.preimage_order.slice(1), Object.keys(schema.properties).filter(key => !metadata.has(key) && key !== schema.semantic_fingerprint_field))
  }))
  assert('row envelope fingerprints cover full envelope', Object.entries(rowSchemas).every(([table, schema]) => same(envelopeRules[table].preimage_order.slice(1), Object.keys(schema.properties).filter(key => key !== 'row_envelope_fingerprint'))))
  assert('critical proof rows carry meaning', rowSchemas.intervention_atoms.properties.content?.type === 'human_text' && rowSchemas.answer_receipts.properties.answer_value?.schema_ref === 'shared_schemas.answer_value_rules' && rowSchemas.selector_candidate_sets.properties.candidate_members?.min_items === 4 && rowSchemas.selector_candidate_sets.properties.candidate_members?.max_items === 4 && rowSchemas.selector_candidate_sets.properties.candidate_members?.required_route_values?.length === 4 && rowSchemas.selector_policies.properties.policy_canonical_text?.type === 'human_text' && rowSchemas.pending_release_projections.properties.projection_payload_b64url?.type === 'base64url_without_padding')

  const memberSchemas = candidate.proof_member_schemas ?? {}
  assert('typed proof member schemas closed and linked', same(Object.keys(memberSchemas), ['selector_candidate', 'answer_chain_member', 'answer_dependency_edge', 'lifecycle_precondition']) && Object.values(memberSchemas).every(schema => exactClosed(schema) && ownRef(candidate, schema.fingerprint_ref)))
  assert('typed set ordering fields exist', candidate.proof_set_schemas.answer_chain.identity_projection.includes('append_ordinal') && memberSchemas.answer_chain_member.properties.append_ordinal?.type === 'positive_integer' && candidate.proof_set_schemas.answer_dependency_graph.identity_projection.includes('edge_ref') && memberSchemas.answer_dependency_edge.properties.edge_ref?.type === 'identifier' && candidate.proof_set_schemas.lifecycle_preconditions.identity_projection.includes('precondition_id'))

  const mapping = candidate.proof_authority?.proof_family_resolution_map ?? {}
  assert('proof mappings cover all families', same(Object.keys(mapping), proofFamilies) && proofFamilies.every(family => {
    const extension = candidate.proof_bundle_schemas.extensions[family]
    const map = mapping[family]
    if (!extension || !map?.canonical_owner || !Array.isArray(map.extension_rows) || !Array.isArray(map.extension_seals)) return false
    const covered = new Set([map.canonical_owner.common_ref_equals_extension_field, map.canonical_owner.common_fingerprint_equals_extension_field])
    for (const pair of map.canonical_owner.embedded_extension_equalities) covered.add(pair.extension_field)
    for (const row of map.extension_rows) {
      for (const pair of row.field_equalities) covered.add(pair.extension_field)
      if (!same(row.scope_equalities, ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint'])) return false
      if (!same(row.owner_join_equalities.map(x => x.owner_row_field), row.field_equalities.map(x => x.extension_field))) return false
      const ownerSchema = ownRef(candidate, map.canonical_owner.schema_ref)
      const dependencySchema = ownRef(candidate, row.schema_ref)
      if (!row.owner_join_equalities.every(join => ownerSchema?.properties?.[join.owner_row_field] && dependencySchema?.properties?.[join.dependency_row_field])) return false
    }
    for (const seal of map.extension_seals) {
      covered.add(seal.extension_field)
      if (seal.owner_row_field !== seal.extension_field || seal.equality !== 'extension_and_owner_field_equal_recomputed_complete_set_fingerprint') return false
    }
    const authorityFields = Object.keys(extension.properties).filter(field => field.endsWith('_ref') || field.endsWith('_fingerprint') || field.endsWith('_seal') || field.endsWith('_tip') || field.endsWith('_version') || field === 'attempt_ordinal')
    return authorityFields.every(field => covered.has(field))
  }))

  const outbox = candidate.outbox
  assert('outbox genesis effect and creation are closed', exactClosed(outbox?.effect_schema) && exactClosed(outbox?.creation_event_schema) && outbox.effect_schema.unique_keys.length === 2 && outbox.creation_event_schema.unique_keys.length === 2 && outbox.genesis_protocol?.atomic_writes?.length === 2 && outbox.genesis_protocol.creation_event_is_unique_initial_tip_for_effect === true)
  assert('outbox invocation and no-invocation evidence are closed', exactClosed(outbox?.invocation_event_schema) && exactClosed(outbox?.abandon_without_invocation_schema) && same(outbox.invocation_event_schema.unique_keys, [['invocation_event_ref'], ['dispatch_ref']]) && same(outbox.abandon_without_invocation_schema.unique_keys, [['abandonment_ref'], ['dispatch_ref']]))
  assert('provider outcome evidence binds exact invocation', ['provider_success_evidence_schema', 'provider_failure_evidence_schema', 'ambiguity_evidence_schema', 'reconciliation_evidence_schema'].every(name => outbox?.[name]?.properties?.invocation_event_ref?.type === 'identifier' && outbox[name].properties.invocation_event_fingerprint?.type === 'sha256' && outbox[name].schema_version.includes('.r9.')))
  assert('outbox event vocabulary exact', exactClosed(outbox?.transition_event_schema) && same(outbox.transition_event_schema.properties.event_kind.values, Object.keys(outbox.payload_binding_map)) && same(outbox.transition_table.map(row => `${row.from}->${row.to}:${row.event_kind}`), transitionSignatures))
  assert('outbox payload binding complete', Object.entries(outbox.payload_binding_map ?? {}).length === transitionSignatures.length && Object.entries(outbox.payload_binding_map ?? {}).every(([, binding]) => {
    const schema = ownRef(candidate, binding.payload_schema_ref)
    return exactClosed(schema) && schema.properties[binding.payload_ref_field] && schema.properties[binding.payload_fingerprint_field]?.type === 'sha256'
  }))
  assert('outbox predecessor and payload admission exact', same(outbox.append_transition_transaction?.admission_predicate, [
    'referenced_predecessor_exists_and_belongs_to_exact_effect',
    'predecessor_fingerprint_recomputes_and_equals_causal_predecessor_event_fingerprint',
    'predecessor_is_the_unique_current_tip_for_effect',
    'from_state_equals_predecessor_to_state_or_verified_creation_event_pending_state',
    'event_kind_maps_to_exact_payload_schema_ref',
    'payload_schema_version_equals_resolved_payload_schema_version',
    'payload_ref_and_fingerprint_equal_the_committed_payload_row',
    'payload_fingerprint_recomputes_under_the_resolved_payload_schema',
    'from_state_to_state_event_kind_schema_and_actor_match_exact_transition_table_row',
    'transition_specific_condition_passes',
  ]) && same(outbox.transition_event_schema.unique_keys, [['outbox_effect_ref', 'causal_predecessor_event_ref'], ['transition_event_ref']]))
  assert('provider call requires committed single-use capability', outbox.invocation_capability_protocol?.mint_after_committed_transition === 'dispatched_to_invoking' && same(outbox.invocation_capability_protocol.capability_properties, ['non_serializable', 'in_process_only', 'single_use', 'bound_to_exact_invocation_event_fingerprint']) && outbox.invocation_capability_protocol.may_be_reconstructed_from_database_or_queue === false && outbox.provider_call_gate?.only_state === 'invoking' && outbox.provider_call_gate.provider_call_count_per_invocation_event === undefined && outbox.invocation_capability_protocol.provider_call_count_per_invocation_event.maximum === 1)
  assert('crash semantics distinguish never from maybe invoked', outbox.invocation_capability_protocol?.crash_before_invocation_event_commit === 'provider_definitely_not_called' && outbox.invocation_capability_protocol?.crash_after_invocation_event_commit_before_outcome === 'provider_may_have_been_called_and_no_automatic_call_is_permitted' && outbox.transition_table.find(row => row.event_kind === 'abandon_without_invocation')?.provider_call === false && outbox.transition_table.find(row => row.event_kind === 'lease_expiry_ambiguity')?.from === 'invoking')
  assert('retry budget and no-send authorities exact', outbox.provider_call_gate?.automatic_fourth_attempt_forbidden === true && outbox.provider_call_gate?.total_committed_reservations_per_effect?.maximum === 3 && outbox.provider_call_gate?.reaper_and_reconciler_may_call_provider === false && same(outbox.claim.eligible_from, ['pending', 'abandoned_not_invoked', 'ambiguous']))
  assert('outbox event identities unique', same(outbox.claim_event_schema.unique_keys, [['claim_ref'], ['outbox_effect_ref', 'fencing_token']]) && same(outbox.pre_provider_failure_event_schema.unique_keys, [['failure_ref']]) && same(outbox.unknown_event_schema.unique_keys, [['unknown_ref']]))

  return found
}

check('machine equals generator', read(machinePath) === materializedR9Output)
check('exact R9 human bytes', sha(humanPath) === 'dc4c16682623177f72af0c2207bac7de7e22c98ebf2c8d42e3ec2dd816828e1f')
check('exact R9 machine bytes', sha(machinePath) === '4d7d56b1a1e0eb0be1e6fad43deea361ec8bfc3d7f8b7d1be25e1e8d384e40b8')
check('exact R9 QA bytes', sha(qaPath) === 'ade19b5eeb76ca8892f543f13d6889c9a54c157769806be2a6584669716f3f0e')
check('exact R9 materializer bytes', sha(materializerPath) === 'bb86034c579512073d32aaaf4604d87ff85d521b19f55039594f1b3a0db03e08')
check('rejected R8 machine preserved', sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r8.json') === '9c2e47956904daf7fb35aa43c30f124a0659995535d2dc30e38f6bcb5bf8a7bb')
for (const failure of collect(materializedR9)) failures.push(`R9 ${failure}`)

const mutations = [
  ['inherited reference', c => { c.operation_specs.record_answer.intent.properties.answer_kind = { schema_ref: '__proto__' } }],
  ['operation omitted', c => c.operation_names.pop()],
  ['operation export omitted', c => { delete c.evaluator_abi.operation_result_exports.record_answer }],
  ['operation export schema drift', c => { c.evaluator_abi.operation_result_exports_schema.properties.record_answer.const = 'stale' }],
  ['operation spec result drift', c => { c.operation_specs.record_answer.result_schema = 'stale' }],
  ['proof export omitted', c => { delete c.evaluator_abi.proof_family_exports.answer }],
  ['proof export schema drift', c => { c.evaluator_abi.proof_family_exports_schema.properties.answer.const = 'stale' }],
  ['watermark lineage removed', c => { delete c.type_registry.controlling_watermark_member.variants.base.properties.lineage_ref }],
  ['watermark version identity removed', c => c.controlling_watermarks.member_identity.applicable_control.pop()],
  ['visibility projection nonce removed', c => { delete c.visibility_stable_attestation_projection_schema.properties.acknowledgement_nonce }],
  ['visibility fresh check precedes collision', c => c.visibility_secondary_idempotency.phase_order.reverse()],
  ['proof atom content removed', c => { delete c.authoritative_row_schemas.intervention_atoms.properties.content }],
  ['answer content weakened', c => { c.authoritative_row_schemas.answer_receipts.properties.answer_value = { type: 'identifier' } }],
  ['selector candidates not complete', c => { c.authoritative_row_schemas.selector_candidate_sets.properties.candidate_members.min_items = 1 }],
  ['semantic fingerprint aliases envelope', c => { c.authoritative_row_schemas.answer_receipts.semantic_fingerprint_field = 'row_envelope_fingerprint' }],
  ['semantic preimage omits content', c => c.authoritative_semantic_fingerprint_schemas.intervention_atoms.preimage_order.splice(2, 1)],
  ['row envelope preimage incomplete', c => c.authoritative_row_fingerprint_schemas.answer_receipts.preimage_order.pop()],
  ['proof member loses ordering field', c => { delete c.proof_member_schemas.answer_chain_member.properties.append_ordinal }],
  ['proof dependency join removed', c => c.proof_authority.proof_family_resolution_map.answer.extension_rows[0].owner_join_equalities.pop()],
  ['proof seal owner link removed', c => { delete c.proof_authority.proof_family_resolution_map.lifecycle.extension_seals[0].owner_row_field }],
  ['outbox creation event removed', c => { delete c.outbox.creation_event_schema }],
  ['outbox invocation event removed', c => { delete c.outbox.invocation_event_schema }],
  ['provider outcome loses invocation binding', c => { delete c.outbox.provider_success_evidence_schema.properties.invocation_event_ref }],
  ['outbox event kind widened', c => { c.outbox.transition_event_schema.properties.event_kind = { type: 'identifier' } }],
  ['outbox payload binding removed', c => { delete c.outbox.payload_binding_map.provider_invocation_start }],
  ['outbox payload fingerprint admission removed', c => c.outbox.append_transition_transaction.admission_predicate.splice(7, 1)],
  ['outbox predecessor fingerprint admission removed', c => c.outbox.append_transition_transaction.admission_predicate.splice(1, 1)],
  ['outbox arbitrary transition', c => c.outbox.transition_table.push({ from: 'pending', to: 'confirmed', event_kind: 'provider_success' })],
  ['outbox invocation capability serializable', c => { c.outbox.invocation_capability_protocol.may_be_reconstructed_from_database_or_queue = true }],
  ['outbox capability reusable', c => c.outbox.invocation_capability_protocol.capability_properties.splice(2, 1)],
  ['outbox reaper sends', c => { c.outbox.provider_call_gate.reaper_and_reconciler_may_call_provider = true }],
  ['outbox fourth attempt', c => { c.outbox.provider_call_gate.total_committed_reservations_per_effect.maximum = 4 }],
  ['outbox duplicate claim allowed', c => { c.outbox.claim_event_schema.unique_keys = [] }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR9)
  mutate(candidate)
  check(`mutation rejected: ${name}`, collect(candidate).length > 0)
}

if (failures.length) {
  console.error(`G24 trusted ingress R9 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R9 and ${mutations.length} mutation probes verified`)
console.log(`r9_machine_sha256=${sha(machinePath)}`)
