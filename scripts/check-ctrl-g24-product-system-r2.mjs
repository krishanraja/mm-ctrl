import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const r1BlueprintPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-blueprint.md')
const r1ContractPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-contract.json')
const r1QaPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-qa-record.md')
const blueprintPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md')
const contractPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-contract-r2.json')
const deltaPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-r2-delta.json')
const evidencePath = join(root, 'project-documentation/ctrl-evolution/research/question-and-enrichment-evidence-2026-09-12.md')
const statePath = join(root, 'project-documentation/ctrl-evolution/README.md')
const designStatePath = join(root, 'docs/current/design-state.md')

const blueprint = readFileSync(blueprintPath, 'utf8')
const contractText = readFileSync(contractPath, 'utf8')
const contract = JSON.parse(contractText)
const deltaText = readFileSync(deltaPath, 'utf8')
const delta = JSON.parse(deltaText)
const evidence = readFileSync(evidencePath, 'utf8')
const state = readFileSync(statePath, 'utf8')
const designState = readFileSync(designStatePath, 'utf8')

const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}
const unique = values => new Set(values).size === values.length
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex')

const r1Hashes = {
  blueprint: '2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a',
  contract: '16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba',
  qa: 'e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731',
}

check('R1 blueprint remains byte exact', sha256(r1BlueprintPath) === r1Hashes.blueprint)
check('R1 contract remains byte exact', sha256(r1ContractPath) === r1Hashes.contract)
check('R1 QA remains byte exact', sha256(r1QaPath) === r1Hashes.qa)
check('R2 schema version', contract.schema_version === 'ctrl.product-system.g24.r2-extension.v1')
check('R2 remains proposed', contract.status === 'proposed_founder_lock')
check('R2 baseline commit is exact', contract.extends?.commit === '5e485aa458675df10cdb12d063404f1ebeb34e53')
check('R2 evidence standing is honest', contract.supporting_evidence?.standing === 'supporting_synthesis_not_normative_authority')
check('R2 evidence hash is exact', contract.supporting_evidence?.sha256 === '26011bd2a93ee09de1c3b080f1f8062a9ed30436ada73a1bdee250437861c17a')

const lifecycle = contract.engagement_lifecycle || {}
check('thirty days is not a hard product limit', lifecycle.current_commercial_intensive_window_days === 30 && lifecycle.hard_product_limit === false)
check('engagement end is optional', lifecycle.ends_at_optional === true && lifecycle.continuing_has_assumed_end === false)
check('engagement lifecycle states are unique', lifecycle.states?.length === 6 && unique(lifecycle.states))
check('continuation does not renew permission', lifecycle.permissions_expire_independently === true)

const experience = contract.experience_intelligence || {}
check('magic has seven distinct components', experience.magic_components?.length === 7 && unique(experience.magic_components))
check('leader first frame is singular', experience.leader_first_frame?.focal_objects === 1 && experience.leader_first_frame?.primary_actions === 1 && experience.leader_first_frame?.visible_questions_maximum === 1)
check('quiet state remains valid', experience.leader_first_frame?.quiet_state_valid === true)
check('failed save preserves input', experience.failure_contract?.input_survives_failed_save === true)
check('double loading is forbidden', experience.failure_contract?.back_to_back_loading_ceremonies_forbidden === true)

const evidenceMap = contract.decision_evidence_map || {}
for (const field of ['decision_id', 'variable', 'possible_change', 'best_source_class', 'capable_knower', 'acquisition_path', 'stop_rule']) {
  check(`evidence requirement includes ${field}`, evidenceMap.requirement_fields?.includes(field))
}
check('public and private personhood are separated', evidenceMap.separations?.includes('public_statement_vs_private_judgement'))
check('importance and tradeoff are separated', evidenceMap.separations?.includes('importance_vs_tradeoff'))

const enrichment = contract.enrichment_planner || {}
check('enrichment ladder begins with accepted Brain state', enrichment.acquisition_order?.[0] === 'current_accepted_compatible_brain_item')
check('enrichment ladder ends with prepared live session', enrichment.acquisition_order?.at(-1) === 'prepared_live_session')
check('enrichment does not ask obtainable public facts', enrichment.efficiency_rules?.includes('do_not_ask_for_externally_obtainable_fact'))
check('public specificity does not become private personhood', enrichment.public_specificity_never_authorises_private_personhood === true)

const questions = contract.question_intelligence || {}
for (const field of ['question_id', 'decision_id', 'missing_variable', 'answer_grammar', 'complete_options_or_unit', 'per_answer_effect', 'stop_rule']) {
  check(`question contract includes ${field}`, questions.contract_fields?.includes(field))
}
for (const grammar of ['confirm_or_correct', 'numeric_with_unit', 'bounded_recent_recall', 'five_or_seven_fully_labelled_scale', 'forced_tradeoff', 'repeated_best_and_worst', 'short_ranking_maximum_five', 'recent_critical_incident_voice_first']) {
  check(`answer grammar includes ${grammar}`, questions.answer_grammars?.includes(grammar))
}
check('only one question is visible', questions.visible_questions_maximum === 1)
check('questions recompute after every answer', questions.prepared_questions_recomputed_after_each_answer === true)
check('leader prior remains first', questions.leader_prior_before_system_preference === true)
check('optional depth never carries required answer', questions.optional_depth_never_required === true && questions.forbidden?.includes('required_value_in_optional_note'))
check('questionnaire anti-patterns remain forbidden', questions.forbidden?.includes('profile_completion_only_question') && questions.forbidden?.includes('mobile_grid'))

const session = contract.session_opportunity || {}
check('session opportunity has material triggers', session.triggers?.length >= 7)
for (const field of ['decision', 'why_session_now', 'two_or_three_material_gaps', 'concrete_then_tradeoff_then_pressure_question_ladder', 'desired_end_state', 'capture_and_privacy_plan']) {
  check(`session brief includes ${field}`, session.brief_fields?.includes(field))
}
check('Krish session route is pull only', session.initial_os_route === 'pull_only_ranked_operator_portfolio' && session.unsolicited_push_authorised === false)
check('Krish controls the session opportunity', ['schedule', 'edit', 'snooze', 'dismiss', 'mark_unnecessary'].every(action => session.krish_controls?.includes(action)))

const slice = contract.first_crossing_extension || {}
check('R2 remains headless first', slice.headless_first === true)
check('R2 covers four external/internal ranges', slice.cases?.length === 4 && unique(slice.cases))
for (const choice of ['research_instead_of_question', 'correctly_typed_async_question_changes_route', 'prepared_live_session_instead_of_thin_async_question', 'abstention_when_no_route_is_earned']) {
  check(`headless slice includes ${choice}`, slice.required_choices?.includes(choice))
}
check('real people are public-only in research fixture', slice.real_public_identity_rule === 'public_claims_only_no_fabricated_private_material_or_consent')

check('Question Yield is internal and unproven', contract.evaluation?.question_yield?.standing === 'internal_unproven_diagnostic' && contract.evaluation?.question_yield?.customer_scoreboard === false)

for (const closedAction of ['production_write', 'customer_data', 'external_research_run', 'model_spend', 'email_send', 'database_branch_creation', 'deployment', 'merge', 'release', 'legacy_backend_deletion']) {
  check(`external action remains closed: ${closedAction}`, contract.authority?.closed?.includes(closedAction))
}

check('delta binds the same baseline', delta.baseline?.commit === contract.extends?.commit)
check('delta preserves R1 bytes', delta.preserved?.includes('r1_files_byte_for_byte'))
check('delta forbids UI proof overclaim', delta.forbidden_interpretations?.includes('ui_intuitiveness_is_proven_by_documentation'))

const requiredBlueprintPhrases = [
  'The relationship is longer than a timer',
  'The intuitiveness contract',
  'The decision evidence map',
  'The enrichment planner',
  'Question Intelligence',
  'When Krish should run a live session',
  'Extension to the first Crossing',
  'Question Yield',
  'Exact next action if approved',
]
for (const phrase of requiredBlueprintPhrases) check(`R2 blueprint includes ${phrase}`, blueprint.includes(phrase))
check('evidence note keeps source non-normative', evidence.includes('supporting evidence, not an instruction set'))
check('canonical state links R2 blueprint', state.includes('[G24 R2 adaptive intelligence and experience extension](g24-product-system-blueprint-r2.md)'))
check('canonical state links R2 contract', state.includes('[R2 machine overlay](g24-product-system-contract-r2.json)'))
check(
  'design state preserves the R2 lineage or routes to a later immutable repair',
  designState.includes('G24 R2 adaptive intelligence and experience extension')
    || designState.includes('G24 R3 executable trust-seam repair')
    || designState.includes('G24 R4 terminal trust-seam candidate')
    || designState.includes('G24 R5 dependent Release watermark repair')
    || designState.includes('founder-locked G24 R1 through R5 architecture'),
)

for (const [name, content] of [
  ['R2 blueprint', blueprint],
  ['R2 contract', contractText],
  ['R2 delta', deltaText],
  ['R2 evidence note', evidence],
]) {
  check(`${name} has no em dash`, !content.includes('—'))
}

if (failures.length) {
  console.error(`G24 R2 product-system extension failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: G24 R1 bytes, duration, intuitive experience, enrichment, question intelligence, session routing and closed-action contracts passed')
