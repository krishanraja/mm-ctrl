import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildManifest,
  canonicalStringify,
  contractDirectory,
  lineage,
  manifestPath,
  sourceModulePaths
} from './materialize-ctrl-g24-predicate-authority-r78.mjs'

const root = process.cwd()
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const sortedUnique = values => [...new Set(values)].sort()

const expectedTransitions = [
  'open_preparation',
  'accept_intensive_proof',
  'close_preparation',
  'continue_after_intensive_proof',
  'renew_continuing_period',
  'pause_intensive_proof',
  'pause_continuing',
  'resume_continuing',
  'close_intensive_proof',
  'close_continuing',
  'close_paused',
  'complete_close',
  'open_new_preparation_after_close'
]

const expectedStates = [
  'reserved',
  'external_confirmed',
  'local_committed_pending_ack',
  'finalized',
  'aborted',
  'quarantined'
]

const expectedEdges = [
  'reserved->external_confirmed',
  'reserved->aborted',
  'reserved->quarantined',
  'external_confirmed->local_committed_pending_ack',
  'external_confirmed->aborted',
  'external_confirmed->quarantined',
  'local_committed_pending_ack->finalized',
  'local_committed_pending_ack->quarantined'
]

const expectedRepairStatuses = [
  'rebuilt',
  'quarantined',
  'review_required',
  'unaffected_with_reason',
  'erased'
]

const requiredFixtureIds = [
  'SET-UNSEEN-LIFECYCLE-HEAD',
  'SET-OMITTED-GRANT',
  'SET-DUPLICATED-GRANT',
  'SET-INSERTED-GRANT',
  'SET-STALE-GRANT-HEAD',
  'SET-MISSING-NEGATIVE-PROOF',
  'VAR-MISSING-CONTINUATION-CHECKPOINT',
  'BIND-SWAPPED-SUBJECT',
  'BIND-SWAPPED-AUDIENCE',
  'BIND-SWAPPED-CASE',
  'BIND-SWAPPED-PURPOSE',
  'BIND-SWAPPED-PREDECESSOR',
  'EXT-BOUNDARY-EQUALITY',
  'EXT-CONSENT-WITHDRAWN',
  'EXT-CONCURRENT-CONSUME',
  'EXT-SUCCESS-LOCAL-ROLLBACK',
  'EXT-LOCAL-COMMIT-ACK-LOST',
  'REG-MISSING-OWNER',
  'REG-DUPLICATE-OWNER',
  'EXT-NO-PROTOCOL',
  'EXT-TWO-PROTOCOLS',
  'EXT-VAGUE-TTL',
  'EXT-TOKEN-WRONG-RESERVATION',
  'EXT-TOKEN-WRONG-TRANSITION',
  'EXT-TOKEN-WRONG-RECEIPT',
  'EXT-TOKEN-WRONG-CONSEQUENCE',
  'COORD-IDEMPOTENCY-COLLISION',
  'COORD-MISSING-TERMINAL-RECEIPT',
  'TX-SPECIALIST-WRITE',
  'TX-PARTIAL-WRITE',
  'TX-STALE-COMPARE-AND-SET',
  'HA-LLM-ATTESTATION',
  'HA-WORKLOAD-SUBSTITUTION',
  'HA-PROOF-WITHOUT-AUTHORITY',
  'HA-EARLIER-BUNDLE-AUTHORITY',
  'HA-HIDDEN-CONSEQUENCE',
  'HA-UNKNOWN-AS-YES',
  'HA-FREE-TEXT-UNCONFIRMED',
  'HA-RECEIPT-TYPE-CONFLATION',
  'HC-ADMIN-GAP',
  'HC-SINGLE-GAP',
  'HC-MULTI-GAP',
  'HC-PRIORITY-TIE',
  'HC-COMPOUND-ASK',
  'HC-HOROSCOPE-VALID-REFS',
  'HC-VERBAL-DIARRHOEA',
  'CU-LIFECYCLE-ONLY',
  'CU-NOOP-REFLECTION',
  'CU-DECORATIVE-BINDING',
  'CU-REAL-DELTA',
  'DERIVED-AUTHORITY-WIDENING',
  'DERIVED-AUDIENCE-WIDENING',
  'DERIVED-VALIDITY-WIDENING',
  'DERIVED-INCOMPATIBLE-SCOPE',
  'REPAIR-INCOMPLETE-TRAVERSAL',
  'REPAIR-MISSING-PERMISSION-EDGE',
  'REPAIR-WRONG-TERMINAL-STATUS',
  'CLOSE-OUTSTANDING-OBLIGATION-ERASED'
]

const modulePaths = sourceModulePaths()
const modules = Object.fromEntries(modulePaths.map(path => {
  const module = readJson(path)
  return [module.module_id, module]
}))

function validateContract(candidate) {
  const errors = []
  const fail = (name, condition) => { if (!condition) errors.push(name) }
  const ids = Object.keys(candidate)
  const closure = candidate.contract_closure
  fail('module ids unique and closed', closure && same(sortedUnique(ids), sortedUnique(closure.closed_module_ids ?? [])))

  if (closure) {
    for (const [id, module] of Object.entries(candidate)) {
      const expectedKeys = closure.top_level_key_sets?.[id]
      fail(`closed top-level schema ${id}`, Array.isArray(expectedKeys) && same(Object.keys(module).sort(), [...expectedKeys].sort()))
    }
  }

  const common = candidate.common_envelope
  fail('authority species exact', same(common?.authority_species, ['mechanical_fact', 'normative_human_attestation', 'derived_fact']))
  fail('R75 exact in common envelope', common?.governing_decision?.r75_commit === lineage.r75.commit)
  fail('R77 exact in common envelope', common?.governing_decision?.r77_lock_commit === lineage.r77.commit)
  fail('private preparation audience explicit', common?.private_preparation_audience_rule?.includes('named subject and Krish only'))
  fail('no opaque prose authority', common?.canonicalization?.opaque_prose_satisfies_rule === false)
  fail('global no runtime effects', ['runtime_connection', 'database_write', 'evidence_row_write', 'ui_render', 'deployment', 'external_mutation'].every(value => common?.global_forbidden_effects?.includes(value)))

  const assembler = candidate.transition_assemblers
  const variants = assembler?.variants ?? []
  const transitionIds = variants.map(value => value.transition_id)
  fail('exactly thirteen transition variants', assembler?.variant_count === 13 && variants.length === 13)
  fail('transition ids exact and unique', same(sortedUnique(transitionIds), [...expectedTransitions].sort()) && transitionIds.length === new Set(transitionIds).size)
  fail('server-derived variant selection', assembler?.variant_selection === 'server_derived_from_exact_requested_transition_id')
  fail('open preparation exact absence', variants.find(value => value.transition_id === 'open_preparation')?.predecessor_rule === 'explicit_null_with_complete_active_lifecycle_absence_proof')
  fail('continue requires checkpoint', variants.find(value => value.transition_id === 'continue_after_intensive_proof')?.human_requirements?.includes('continuation_checkpoint'))
  fail('resume prevents old grant revival', variants.find(value => value.transition_id === 'resume_continuing')?.server_dependencies?.includes('old_expired_or_revoked_grants_unusable'))
  fail('close obligations exact', variants.find(value => value.transition_id === 'complete_close')?.server_dependencies?.includes('close_obligation_set_exactly_access_correction_separate_release_close'))
  fail('post-close obligations survive', variants.find(value => value.transition_id === 'complete_close')?.post_close_rule?.includes('never_extinguishes'))

  const registry = candidate.fact_kind_registry
  const serverDependencies = variants.flatMap(value => value.server_dependencies)
  const humanRequirements = variants.flatMap(value => value.human_requirements)
  const registeredServer = registry?.server_dependencies?.map(value => value.dependency_id) ?? []
  const registeredHuman = registry?.human_requirements?.map(value => value.dependency_id) ?? []
  fail('every server dependency registered once', same(sortedUnique(serverDependencies), sortedUnique(registeredServer)) && registeredServer.length === new Set(registeredServer).size)
  fail('every human requirement registered once', same(sortedUnique(humanRequirements), sortedUnique(registeredHuman)) && registeredHuman.length === new Set(registeredHuman).size)
  fail('server resolution owner exact', registry?.server_dependencies?.every(value => value.resolution_owner === 'server_verify_only'))
  fail('human resolution owner exact', registry?.human_requirements?.every(value => value.resolution_owner === 'human_answerable'))
  fail('one canonical owner per dependency', registry?.server_dependencies?.every(value => typeof value.canonical_owner === 'string' && value.canonical_owner.length > 0))
  fail('no runtime owner selection', registry?.registry_rules?.runtime_owner_selection === false)
  const externalKinds = registry?.external_fact_kinds ?? []
  fail('external fact kinds unique', externalKinds.length === new Set(externalKinds.map(value => value.fact_kind)).size)
  fail('external protocol exact and numeric boundaries', externalKinds.every(value => ['immutable_authority_lease', 'online_conditional_verify_and_consume'].includes(value.protocol_id) && Number.isInteger(value.ttl_seconds) && value.ttl_seconds > 0 && Number.isInteger(value.maximum_clock_skew_seconds) && value.maximum_clock_skew_seconds >= 0))
  fail('withdrawable fact never leased', externalKinds.every(value => !value.withdrawal_possible_during_lease || value.protocol_id === 'online_conditional_verify_and_consume'))

  const predicates = candidate.deterministic_predicates
  fail('dependency dispositions exact', same(predicates?.dependency_dispositions, ['present', 'contradicted', 'missing', 'stale', 'unreadable', 'ambiguous', 'revoked']))
  fail('resolution owners exact', same(predicates?.resolution_owner_values, ['server_verify_only', 'human_answerable']))
  fail('overall results exact', same(predicates?.overall_results, ['satisfied', 'unsatisfied', 'indeterminate']))
  fail('predicate cannot apply transition', predicates?.may_apply_transition === false)

  const human = candidate.human_authority_verifier
  fail('receipt types have distinct domain separators', human?.normative_attestation_domain_separator && human?.final_transition_authority_domain_separator && human.normative_attestation_domain_separator !== human.final_transition_authority_domain_separator)
  fail('unknown cannot satisfy', human?.unknown_rule?.includes('never_satisfied'))
  fail('free expression needs human confirmation', human?.free_expression_rule?.includes('explicitly_confirms'))
  fail('model and workload cannot instantiate human receipt', human?.model_and_workload_rule?.includes('cannot_instantiate'))
  fail('normative judgement remains human-owned', human?.normative_judgement_resolution_owner === 'human_answerable')
  fail('accepted decision delta fields present', ['consequential_target', 'route', 'bounds', 'stop_condition', 'evidence_requirement', 'checkpoint', 'revisit_condition'].every(value => human?.accepted_decision_fields?.includes(value)))

  const gap = candidate.gap_prioritizer
  fail('one-question maximum', gap?.interaction_limits?.maximum_direct_human_questions_per_interaction === 1)
  fail('no queued questions', gap?.interaction_limits?.queued_customer_questions === 0 && gap?.interaction_limits?.automatic_follow_up_question_after_answer === false)
  fail('multiple gaps route away from direct question', gap?.cardinality_routing?.more_than_one_unresolved_human_answerable_gap === 'safe_hold_or_krish_led_session_with_one_decision_specific_agenda')
  fail('closed deterministic priority', gap?.closed_priority_policy?.length === 4 && gap?.closed_priority_policy?.every((value, index) => value.rank === index + 1) && gap?.model_generated_priority_score_allowed === false)
  const explainer = candidate.gap_explainer
  fail('question atom complete', ['plain_language_question', 'requested_value_kind', 'unknown_option', 'free_expression_option', 'answer_effect_map', 'visible_consequence'].every(value => explainer?.question_atom_required_fields?.includes(value)))
  fail('one visible question', explainer?.customer_surface?.primary_question_count === 1)
  fail('no compound asks', explainer?.language_constraints?.compound_asks === false)
  fail('technical vocabulary hidden', explainer?.language_constraints?.forbidden_default_vocabulary?.includes('predicate'))

  const external = candidate.external_authority_coordinator
  const stateNames = external?.coordination_states?.map(value => value.state) ?? []
  fail('external states exact and exhaustive', external?.coordination_state_set_is_exhaustive === true && same(stateNames, expectedStates))
  fail('only finalized steers', external?.coordination_states?.filter(value => value.steering_eligible).map(value => value.state).join(',') === 'finalized')
  fail('edge table exact', same(external?.allowed_edges, expectedEdges))
  fail('every state has entry exit and receipt', expectedStates.every(state => {
    const value = external?.state_contracts?.[state]
    return value && typeof value.entry === 'string' && typeof value.exit === 'string' && typeof value.required_receipt === 'string'
  }))
  fail('external protocols exact', same(external?.protocols?.map(value => value.protocol_id), ['immutable_authority_lease', 'online_conditional_verify_and_consume']))
  fail('lease forbids consent and permission', ['current_human_consent', 'current_human_permission'].every(value => external?.protocols?.[0]?.forbidden_fact_kinds?.includes(value)))
  fail('strict time boundary', external?.validity_rule?.expression === 'transaction_time + maximum_clock_skew < valid_until' && external?.validity_rule?.equality_is_valid === false && external?.validity_rule?.server_transaction_time_required === true)
  fail('retry collision rejected', external?.retry_rules?.same_key_or_nonce_different_canonical_bytes === 'reject_collision')
  fail('proof replay bound exactly', external?.proof_replay_rule?.includes('same_visible_consequence'))

  const transaction = candidate.transaction_coordinator
  fail('only satisfied can enter coordinator', same(transaction?.eligible_predicate_overall_results, ['satisfied']))
  fail('specialists cannot write', transaction?.specialist_modules_may_write === false)
  fail('only finalized steering', transaction?.steering_rule === 'only_finalized_coordination_state_may_steer')
  fail('pending cannot project current lifecycle', transaction?.projection_rule?.includes('must_not_project_as_current_lifecycle_state'))
  fail('named human not workload authority', transaction?.local_serializable_transaction_steps?.includes('verify_exact_named_human_authority_for_transition') && !transaction?.local_serializable_transaction_steps?.some(value => value.includes('workload_authority')))

  const correction = candidate.correction_invalidator
  fail('G13 terminal repair statuses exact', same(correction?.terminal_status_values, expectedRepairStatuses))
  fail('repair graph edge kinds exact', same(correction?.dependency_edge_kinds, ['content_dependency', 'permission_dependency', 'scope_dependency']) && correction?.dependency_graph_seal_covers_all_edge_kinds === true)
  fail('repair completion proves no superseded steering', correction?.completion_proof?.superseded_authority_eligible_path_count === 0)

  const fixtures = candidate.adversarial_fixtures
  const positiveIds = fixtures?.positive_fixtures?.map(value => value.transition_id) ?? []
  const adversarialIds = fixtures?.adversarial_fixtures?.map(value => value.fixture_id) ?? []
  fail('positive fixture for every transition', same(sortedUnique(positiveIds), [...expectedTransitions].sort()) && positiveIds.length === 13)
  fail('fixture ids unique', adversarialIds.length === new Set(adversarialIds).size)
  fail('mandatory adversarial fixtures present', requiredFixtureIds.every(value => adversarialIds.includes(value)))
  fail('horoscope negative rule structural', fixtures?.semantic_negative_rule?.includes('must_fail_even_when_their_envelope_references_are_valid'))

  return errors
}

check('R75 tree exact', git(['rev-parse', `${lineage.r75.commit}^{tree}`]) === lineage.r75.tree)
check('R77 tree exact', git(['rev-parse', `${lineage.r77.commit}^{tree}`]) === lineage.r77.tree)
check('R77 is ancestor of current HEAD', (() => {
  try { execFileSync('git', ['merge-base', '--is-ancestor', lineage.r77.commit, 'HEAD'], { cwd: root }); return true } catch { return false }
})())

const manifest = readJson(manifestPath)
const expectedManifest = buildManifest()
check('manifest exact current bytes', canonicalStringify(manifest) === canonicalStringify(expectedManifest))
check('manifest stable under reversed source order', canonicalStringify(buildManifest([...modulePaths].reverse())) === canonicalStringify(expectedManifest))
check('manifest module ids unique', manifest.modules?.length === new Set(manifest.modules?.map(value => value.module_id)).size)
check('manifest closes all source modules', same(manifest.modules?.map(value => value.path), modulePaths))
check('manifest keeps all external authority closed', manifest.authority_still_closed?.length === 9 && manifest.authority_still_closed?.includes('cross-venture Supabase decision-ledger write'))

for (const error of validateContract(modules)) failures.push(error)

const mutationAttacks = [
  ['unknown top-level key', value => { value.common_envelope.unearned = true }],
  ['drop transition', value => { value.transition_assemblers.variants.pop() }],
  ['duplicate transition', value => { value.transition_assemblers.variants.push(structuredClone(value.transition_assemblers.variants[0])) }],
  ['caller selects variant', value => { value.transition_assemblers.variant_selection = 'caller_selected' }],
  ['drop dependency owner', value => { value.fact_kind_registry.server_dependencies.pop() }],
  ['duplicate dependency owner', value => { value.fact_kind_registry.server_dependencies.push(structuredClone(value.fact_kind_registry.server_dependencies[0])) }],
  ['server asks human judgement', value => { value.fact_kind_registry.human_requirements[0].resolution_owner = 'server_verify_only' }],
  ['withdrawable consent leased', value => { value.fact_kind_registry.external_fact_kinds.find(item => item.fact_kind === 'current_human_consent').protocol_id = 'immutable_authority_lease' }],
  ['unknown becomes satisfied', value => { value.human_authority_verifier.unknown_rule = 'unknown_is_satisfied' }],
  ['receipt types conflated', value => { value.human_authority_verifier.final_transition_authority_domain_separator = value.human_authority_verifier.normative_attestation_domain_separator }],
  ['queue questions', value => { value.gap_prioritizer.interaction_limits.queued_customer_questions = 3 }],
  ['ask multiple direct gaps', value => { value.gap_prioritizer.cardinality_routing.more_than_one_unresolved_human_answerable_gap = 'one_question_candidate' }],
  ['model priority score', value => { value.gap_prioritizer.model_generated_priority_score_allowed = true }],
  ['compound ask', value => { value.gap_explainer.language_constraints.compound_asks = true }],
  ['boundary equality accepted', value => { value.external_authority_coordinator.validity_rule.equality_is_valid = true }],
  ['pending state steers', value => { value.external_authority_coordinator.coordination_states[2].steering_eligible = true }],
  ['illegal external edge', value => { value.external_authority_coordinator.allowed_edges.push('reserved->finalized') }],
  ['unsatisfied enters writer', value => { value.transaction_coordinator.eligible_predicate_overall_results.push('unsatisfied') }],
  ['specialist writes', value => { value.transaction_coordinator.specialist_modules_may_write = true }],
  ['wrong repair statuses', value => { value.correction_invalidator.terminal_status_values = ['rebuilt', 'blocked'] }],
  ['omit permission repair edges', value => { value.correction_invalidator.dependency_edge_kinds = ['content_dependency', 'scope_dependency'] }],
  ['remove mandatory fixture', value => { value.adversarial_fixtures.adversarial_fixtures = value.adversarial_fixtures.adversarial_fixtures.filter(item => item.fixture_id !== 'HA-LLM-ATTESTATION') }]
]

for (const [name, mutate] of mutationAttacks) {
  const candidate = structuredClone(modules)
  mutate(candidate)
  check(`mutation rejected: ${name}`, validateContract(candidate).length > 0)
}

if (failures.length) {
  console.error(`G24 R78 machine contract failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: R78 modular machine contract; ${expectedTransitions.length} transitions; ${requiredFixtureIds.length} required fixtures; ${mutationAttacks.length} semantic mutations rejected; ${manifest.bundle_fingerprint}`)
