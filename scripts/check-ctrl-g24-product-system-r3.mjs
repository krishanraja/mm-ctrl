import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = relative => createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
const unique = values => new Set(values).size === values.length
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const r1Hashes = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint.md': '2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a',
  'project-documentation/ctrl-evolution/g24-product-system-contract.json': '16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba',
  'project-documentation/ctrl-evolution/g24-product-system-qa-record.md': 'e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731',
}
const r2Hashes = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md': '52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r2.json': '1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2',
  'project-documentation/ctrl-evolution/g24-product-system-r2-delta.json': 'd67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2',
  'project-documentation/ctrl-evolution/research/question-and-enrichment-evidence-2026-09-12.md': 'c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb',
}
for (const [path, hash] of Object.entries({ ...r1Hashes, ...r2Hashes })) check(`frozen hash: ${path}`, sha256(path) === hash)

const blueprintPath = 'project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md'
const contractPath = 'project-documentation/ctrl-evolution/g24-product-system-contract-r3.json'
const deltaPath = 'project-documentation/ctrl-evolution/g24-product-system-r3-delta.json'
const qaPath = 'project-documentation/ctrl-evolution/g24-product-system-r3-qa-record.md'
const blueprint = read(blueprintPath)
const contractText = read(contractPath)
const deltaText = read(deltaPath)
const qa = read(qaPath)
const contract = JSON.parse(contractText)
const delta = JSON.parse(deltaText)
const state = read('project-documentation/ctrl-evolution/README.md')
const designState = read('docs/current/design-state.md')
const adjudication = read('project-documentation/ctrl-evolution/runs/g24-r2-architecture-council-001/adjudication.md')

check('R3 schema version', contract.schema_version === 'ctrl.product-system.g24.r3-repair.v1')
check('R3 remains proposed', contract.status === 'proposed_fresh_council_and_founder_lock')
check('R2 council is bound and blocked', contract.extends_frozen_r2?.council_status === 'BLOCKED_PENDING_REPAIR' && adjudication.includes('**Final status:** `BLOCKED_PENDING_REPAIR`'))
check('R3 delta preserves R2 history', delta.revision === 'G24-R3' && delta.preserves_r2_as_history === true)
check('four and only four repair areas', delta.allowed_repairs?.length === 4 && unique(delta.allowed_repairs.map(item => item.id)))

const expectedObjects = [
  'engagement_period',
  'decision_requirement',
  'evidence_coverage',
  'enrichment_plan',
  'enrichment_receipt',
  'question_plan',
  'answer_receipt',
  'session_opportunity',
  'intervention_delivery',
]
const objectMap = contract.object_map || []
check('nine R2 objects map exactly once', objectMap.length === expectedObjects.length && unique(objectMap.map(item => item.r2_object)) && expectedObjects.every(name => objectMap.some(item => item.r2_object === name)))
check('no R2 object creates canonical root', objectMap.every(item => item.r1_owner && item.standing && item.new_canonical_root === false))

const integrity = contract.inherited_integrity || {}
for (const ref of ['workspace_version', 'subject_version', 'accepted_decision_frame_version', 'canonical_source_versions', 'canonical_assertion_versions', 'authority_or_permission_version', 'trusted_as_of', 'input_version_watermarks']) {
  check(`integrity controls ${ref}`, integrity.controlling_references?.includes(ref))
}
for (const semantic of ['claim_kind', 'source_capability', 'contradicting_assertion_refs', 'root_provenance', 'sufficiency_rule', 'causal_standing', 'applicability_result']) {
  check(`integrity includes ${semantic}`, integrity.use_specific_semantics?.includes(semantic))
}
check('derivative cannot award standing', integrity.derivative_can_award_standing === false)
check('source roots collapse for independence', integrity.derivative_sources_collapse_to_root_when_independence_required === true)
check('observation cannot silently become causation', integrity.observational_input_can_silently_become_causal_or_transferable === false)
check('private reasoning cannot cross cases', integrity.private_reasoning_cross_case_reuse === false)

const lifecycle = contract.lifecycle_policy || {}
check('six lifecycle states remain unique', lifecycle.states?.length === 6 && unique(lifecycle.states))
check('every lifecycle transition requires receipt and authority', lifecycle.transitions?.length >= 9 && lifecycle.transitions.every(item => item.from && item.to && item.authority && item.receipt_required === true))
check('transition contract binds state change', ['actor', 'authority', 'precondition', 'version_match', 'idempotency_key', 'before_ref', 'after_ref', 'receipt'].every(field => lifecycle.transition_fields?.includes(field)))
check('continuation is explicit', lifecycle.absence_of_continuation_receipt_means_continuation === false && lifecycle.continuation_requirements?.includes('named_human_agreement'))
check('commercial state never grants permission', lifecycle.commercial_state_grants_permission === false)
check('reopen cannot revive authority', lifecycle.reopen_revives_expired_authority === false)
check('permission invalidates derivatives before use', lifecycle.permission_change_invalidates_unsent_derivatives_before_use === true)

const interventionAuthority = contract.intervention_authority || {}
check('new and recomputed intervention is proposed', interventionAuthority.new_or_recomputed_state === 'proposed')
check('Krish has four explicit transitions', ['approve', 'edit', 'hold', 'suppress'].every(action => interventionAuthority.krish_transitions_before_delivery?.includes(action)))
check('material edits invalidate approval', interventionAuthority.material_edit_invalidates_approval === true)
check('answer effect is layered', ['immutable_case_evidence', 'rebuildable_case_update', 'pending_human_owned_proposal'].every(layer => interventionAuthority.answer_effect_layers?.includes(layer)))
check('honest exits cannot create pressure', interventionAuthority.honest_exit_effect === 'no_adverse_inference_no_automatic_reask_pressure_or_session_escalation')
check('session proposal has no action authority', interventionAuthority.session_opportunity_authorises_contact_schedule_capture_or_learning === false)

const selector = contract.intervention_selector || {}
const expectedRoutes = ['reuse', 'enrich', 'ask', 'session', 'abstain_hold']
check('selector has trusted application owner', selector.owner === 'trusted_application_intervention_selector')
check('selector inputs bind canonical state', ['accepted_decision_frame_ref', 'decision_requirement_ref', 'evidence_coverage_ref', 'authority_and_audience_state_ref', 'trusted_as_of_and_freshness_state', 'lifecycle_state', 'decision_deadline', 'permitted_intervention_set', 'current_intervention_state_refs', 'budget_envelope'].every(input => selector.inputs?.includes(input)))
check('selector budget dimensions exist', ['wall_clock', 'source_requests', 'retrieval_hops', 'model_tokens_or_cost', 'leader_interruptions', 'open_operator_work'].every(dimension => selector.budget_dimensions?.includes(dimension)))
check('selector has five exact routes', selector.outputs?.length === expectedRoutes.length && expectedRoutes.every(route => selector.outputs.includes(route)) && unique(selector.outputs))
check('selector emits inspectable result', ['route', 'reason_code', 'unresolved_gap', 'expected_material_effect', 'eligible_alternatives_and_rejection_reasons', 'controlling_version_watermarks', 'expiry', 'replanning_trigger'].every(field => selector.output_fields?.includes(field)))
check('selector is total and fail closed', selector.exactly_one_output === true && selector.total_for_invalid_missing_stale_ambiguous_and_contradictory_input === true && selector.fail_closed_output === 'abstain_hold')
check('source eligibility precedes burden', selector.hard_precedence?.at(-1) === 'least_burden_cost_and_interruption_among_eligible_routes' && selector.source_eligibility_before_burden?.length >= 6)
check('selector does not create value root', selector.binds_to_r1_decision_frame_not_new_value_root === true)

const atom = contract.intervention_atom || {}
for (const field of ['question_plan_version', 'visible_question_wording', 'rendered_control_payload', 'answer_grammar', 'complete_options_unit_or_comparator', 'premise_or_options_wrong_route', 'material_effect_disclosed_before_commitment', 'per_answer_visible_consequence', 'krish_exact_version_approval_state']) {
  check(`question atom includes ${field}`, atom.question_version_fields?.includes(field))
}
check('premise challenge required for all closed forms', ['closed_format', 'ranked_format', 'forced_format'].every(format => atom.premise_or_options_wrong_required_for?.includes(format)))
check('payload changes version', atom.any_payload_change_creates_new_version === true)
check('optional note stays optional', atom.optional_note_can_carry_required_value === false)
for (const field of ['session_opportunity_version', 'exact_agenda', 'leader_visible_purpose', 'accepted_decision_frame_ref', 'leader_decline_reject_or_reframe', 'no_contact_schedule_capture_transcription_or_learning_authority']) {
  check(`session atom includes ${field}`, atom.session_version_fields?.includes(field))
}

check('Question Yield not self-fulfilling', contract.question_yield?.planner_authored_route_mutation_is_sufficient === false)
check('Question Yield honest exit neutral', contract.question_yield?.honest_exit_is_human_failure === false)
check('later G24.C gate includes semantic attacks', contract.later_gate_requirements?.g24_b_c?.includes('hidden_semantic_oracle') && contract.later_gate_requirements?.g24_b_c?.includes('competent_same_evidence_baseline'))
check('later G24.D gate preserves observed UX', contract.later_gate_requirements?.g24_d?.includes('fresh_participant_comprehension') && contract.later_gate_requirements?.g24_d?.includes('one_handed_phone_use'))

for (const action of ['production_write', 'customer_data', 'external_research_run', 'model_spend', 'email_send', 'customer_contact', 'session_scheduling', 'session_capture', 'database_branch_creation', 'deployment', 'merge', 'release', 'legacy_backend_deletion']) {
  check(`external action remains closed: ${action}`, contract.authority?.closed?.includes(action))
}

for (const phrase of ['Repair 1: close every R2 object onto R1', 'Repair 2: make authority and lifecycle executable', 'Repair 3: one total route-selection boundary', 'Repair 4: one versioned human-facing intervention atom', 'Protected strengths', 'Exact next action']) {
  check(`R3 blueprint includes ${phrase}`, blueprint.includes(phrase))
}
check('R3 QA records council block', qa.includes('BLOCKED_PENDING_REPAIR'))
check('canonical state links R3 blueprint', state.includes('[G24 R3 executable trust-seam repair](g24-product-system-blueprint-r3.md)'))
check('canonical state links R3 contract', state.includes('[R3 machine contract](g24-product-system-contract-r3.json)'))
check(
  'design state routes to G24 R3 or its later immutable repair',
  designState.includes('G24 R3 executable trust-seam repair')
    || designState.includes('G24 R4 terminal trust-seam candidate')
    || designState.includes('G24 R5 dependent Release watermark repair')
    || designState.includes('founder-locked G24 R1 through R5 architecture'),
)

for (const [name, content] of [['blueprint', blueprint], ['contract', contractText], ['delta', deltaText], ['QA', qa]]) check(`${name} has no em dash`, !content.includes('—'))

if (failures.length) {
  console.error(`G24 R3 repair failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: G24 R3 closes R2 onto R1, makes lifecycle executable, defines one total selector and preserves one versioned intervention atom')
