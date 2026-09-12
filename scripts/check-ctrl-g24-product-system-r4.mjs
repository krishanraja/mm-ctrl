import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = relative => createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}
const unique = values => new Set(values).size === values.length

const frozen = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint.md': '2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a',
  'project-documentation/ctrl-evolution/g24-product-system-contract.json': '16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba',
  'project-documentation/ctrl-evolution/g24-product-system-qa-record.md': 'e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md': '52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r2.json': '1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2',
  'project-documentation/ctrl-evolution/g24-product-system-r2-delta.json': 'd67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2',
  'project-documentation/ctrl-evolution/research/question-and-enrichment-evidence-2026-09-12.md': 'c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md': '446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r3.json': '5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09',
  'project-documentation/ctrl-evolution/g24-product-system-r3-delta.json': 'c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb',
  'project-documentation/ctrl-evolution/runs/g24-r3-architecture-council-002/adjudication.md': 'abe26c55559950c749d1f203444fe0cac452812182646478e546b82ed841829a',
}
for (const [path, hash] of Object.entries(frozen)) check(`frozen hash: ${path}`, sha256(path) === hash)

const blueprintPath = 'project-documentation/ctrl-evolution/g24-product-system-blueprint-r4.md'
const contractPath = 'project-documentation/ctrl-evolution/g24-product-system-contract-r4.json'
const deltaPath = 'project-documentation/ctrl-evolution/g24-product-system-r4-delta.json'
const qaPath = 'project-documentation/ctrl-evolution/g24-product-system-r4-qa-record.md'
const blueprint = read(blueprintPath)
const contractText = read(contractPath)
const deltaText = read(deltaPath)
const qa = read(qaPath)
const contract = JSON.parse(contractText)
const delta = JSON.parse(deltaText)
const state = read('project-documentation/ctrl-evolution/README.md')
const designState = read('docs/current/design-state.md')

check('R4 schema', contract.schema_version === 'ctrl.product-system.g24.r4-terminal-repair.v1')
check('R4 remains proposed', contract.status === 'proposed_fresh_council_and_founder_lock')
check('R3 adjudication bound', contract.amends_frozen_r3?.adjudication_status === 'BLOCKED_PENDING_REPAIR')
check('R4 delta preserves R3', delta.revision === 'G24-R4' && delta.preserves_r3_as_history === true)
check('three exact repair areas', delta.allowed_repairs?.length === 3 && unique(delta.allowed_repairs.map(item => item.id)))
check('R4 creates no root', contract.normative_precedence?.new_canonical_root === false && contract.epistemic_eligibility_binding?.creates_new_evidence_policy_or_challenger_root === false && contract.release_non_inference?.creates_new_release_root === false)

const epistemic = contract.epistemic_eligibility_binding || {}
for (const ref of ['epistemic_policy_version_ref', 'independent_challenger_result_version_ref']) {
  check(`epistemic current ref ${ref}`, epistemic.required_current_references?.includes(ref))
  check(`selector consumes ${ref}`, epistemic.selector_input_refs?.includes(ref))
}
for (const outcome of ['source_capability', 'provenance_independence_requirement_and_result', 'use_specific_sufficiency', 'applicability', 'causal_standing', 'contradiction_treatment', 'countercase_status']) {
  check(`policy owns ${outcome}`, epistemic.policy_owned_outcomes?.includes(outcome))
}
check('epistemic owner is existing R1 authority', epistemic.owner === 'existing_r1_governance_and_independent_challenger_authority')
check('challenger has bounded-none and indeterminate', ['countercase_found', 'none_found_within_declared_boundary', 'indeterminate'].every(value => epistemic.challenger_results?.includes(value)) && epistemic.declared_search_boundary_required_for_none_found === true)
check('model cannot confer eligibility', epistemic.model_may_propose_but_not_make_outcome_eligible === true)
check('invalid epistemic authority holds', epistemic.missing_unknown_stale_invalid_inapplicable_or_indeterminate_result === 'abstain_hold')
check('epistemic versions watermark and invalidate', ['epistemic_policy_version', 'independent_challenger_result_version'].every(value => epistemic.selector_output_watermarks?.includes(value)) && ['epistemic_policy_version_change', 'independent_challenger_result_version_change'].every(value => epistemic.invalidation_triggers?.includes(value)))

const lifecycle = contract.lifecycle_policy_replacement || {}
const expectedStates = ['preparing', 'intensive_proof', 'continuing', 'paused', 'closing', 'closed']
check('six exact lifecycle states', lifecycle.states?.length === expectedStates.length && expectedStates.every(stateName => lifecycle.states.includes(stateName)) && unique(lifecycle.states))
check('released is not engagement state', !lifecycle.states?.includes('released'))
const transitions = lifecycle.transitions || []
check('transition ids unique', transitions.length === 13 && unique(transitions.map(edge => edge.id)))
check('all endpoints exact', transitions.every(edge => (edge.from === 'none' || lifecycle.states.includes(edge.from)) && lifecycle.states.includes(edge.to)))
check('no grouped transition source', transitions.every(edge => !edge.from.includes('_or_')) && lifecycle.grouped_or_implicit_edges_allowed === false)
for (const field of ['id', 'from', 'to', 'actor', 'authority', 'precondition', 'from_version_match', 'invalidation', 'receipt']) check(`every transition has ${field}`, transitions.every(edge => typeof edge[field] === 'string' && edge[field].length > 0))
for (const field of ['actor', 'authority', 'precondition', 'from_version_match', 'idempotency_key', 'before_ref', 'after_ref', 'invalidation', 'receipt']) check(`transition envelope contains ${field}`, lifecycle.transition_envelope?.includes(field))
const edge = (from, to) => transitions.some(item => item.from === from && item.to === to)
for (const [from, to] of [
  ['none', 'preparing'],
  ['preparing', 'intensive_proof'],
  ['preparing', 'closed'],
  ['intensive_proof', 'continuing'],
  ['continuing', 'continuing'],
  ['intensive_proof', 'paused'],
  ['continuing', 'paused'],
  ['paused', 'continuing'],
  ['intensive_proof', 'closing'],
  ['continuing', 'closing'],
  ['paused', 'closing'],
  ['closing', 'closed'],
  ['closed', 'preparing'],
]) check(`lifecycle edge ${from} to ${to}`, edge(from, to))
const preparationClose = transitions.find(item => item.id === 'close_preparation')
check('preparation close invalidates work', preparationClose?.from === 'preparing' && preparationClose?.to === 'closed' && preparationClose?.invalidation === 'all_prepared_and_unsent_derivatives')
check('closed has no operational use', lifecycle.capability_policy?.closed?.includes('no_operational_or_decision_shaping_use'))
check('commercial state still grants no permission', lifecycle.commercial_state_grants_permission === false && lifecycle.reopen_revives_expired_authority === false)

const release = contract.release_non_inference || {}
check('R1 Release remains owner', release.owner === 'existing_r1_canonical_release_object')
check('lifecycle and close cannot grant Release', release.engagement_state_grants_proves_or_completes_release === false && release.close_receipt_grants_proves_or_completes_release === false && release.commercial_or_elapsed_state_grants_release === false)
check('release is exact-scope bound', ['release_projection_version', 'purpose', 'audience', 'included_canonical_source_versions', 'included_canonical_brain_versions'].every(value => release.required_binding_before_use?.includes(value)))
check('close and Release are independent', release.close_without_release_allowed === true && release.release_closes_engagement === false)
check('pending Release invalidates', ['identity_change', 'permission_change', 'audience_change', 'validity_change', 'included_source_or_brain_version_change'].every(value => release.pending_projection_invalidation_triggers?.includes(value)) && release.invalidation_receipt_required === true)

const selector = contract.selector_policy_replacement || {}
const expectedRoutes = ['reuse', 'enrich', 'ask', 'session', 'abstain_hold']
check('five exact selector outputs', selector.outputs?.length === expectedRoutes.length && expectedRoutes.every(route => selector.outputs.includes(route)) && unique(selector.outputs) && selector.exactly_one_output === true)
check('selector adds epistemic refs and watermarks', ['epistemic_policy_version_ref', 'independent_challenger_result_version_ref'].every(value => selector.required_inputs_added?.includes(value)) && ['epistemic_policy_version', 'independent_challenger_result_version'].every(value => selector.required_output_watermarks_added?.includes(value)))
check('invalid controlling state holds', selector.invalid_controlling_output === 'abstain_hold' && selector.invalid_controlling_creates_actionable_intervention_or_derivative === false && selector.invalid_controlling_enters_approval_or_delivery === false)
for (const condition of ['unknown', 'missing', 'mismatched', 'future_dated', 'expired', 'invalid', 'indeterminate']) check(`invalid condition ${condition}`, selector.invalid_controlling_conditions?.includes(condition))
for (const dimension of ['identity', 'subject', 'workspace', 'authority', 'audience', 'purpose', 'lifecycle', 'accepted_frame', 'epistemic_policy', 'independent_challenger_result', 'controlling_version']) check(`invalid dimension ${dimension}`, selector.invalid_controlling_dimensions?.includes(dimension))
check('valid conflict routes are bounded', ['enrich', 'ask', 'session'].every(route => selector.valid_unresolved_evidence?.eligible_resolving_routes?.includes(route)) && selector.valid_unresolved_evidence?.all_prior_guards_required === true && selector.valid_unresolved_evidence?.must_preserve_unresolved_evidence_refs_in_output === true && selector.valid_unresolved_evidence?.no_eligible_resolving_route_output === 'abstain_hold')
check('provisional is hold metadata only', selector.provisional?.is_route_standing_or_authority === false && selector.provisional?.allowed_location === 'non_authoritative_diagnostic_metadata_on_abstain_hold_receipt_only' && selector.provisional?.can_create_intervention_enter_approval_change_brain_or_bypass_invalidation === false)
check('confidence and source count cannot resolve conflict', selector.first_arrival_model_confidence_or_same_root_count_resolves_conflict === false)

for (const action of ['production_write', 'customer_data', 'account_creation', 'external_research_run', 'model_spend', 'email_send', 'customer_contact', 'session_scheduling', 'session_capture', 'connector_creation', 'database_branch_creation', 'deployment', 'merge', 'feature_enablement', 'release', 'legacy_backend_deletion']) check(`closed action ${action}`, contract.authority?.closed?.includes(action))
check('four preserved test families', contract.preserved_test_families?.length === 4)
check('customer does not administer machinery', contract.protected_strengths?.includes('customer_never_administers_internal_policy_or_lifecycle'))

for (const phrase of ['Normative precedence', 'Repair 1: bind epistemic eligibility to existing R1 authority', 'Repair 2: one exact engagement graph, separate from Release', 'Repair 3: partition selector invalidity from resolvable evidence conflict', 'Protected strengths', 'Exact next action']) check(`blueprint phrase ${phrase}`, blueprint.includes(phrase))
check('QA records prior block', qa.includes('BLOCKED_PENDING_REPAIR'))
check('canonical state links R4 blueprint', state.includes('[G24 R4 terminal trust-seam candidate](g24-product-system-blueprint-r4.md)'))
check('canonical state links R4 contract', state.includes('[R4 machine contract](g24-product-system-contract-r4.json)'))
check(
  'design state routes to G24 R4 or its later immutable repair',
  designState.includes('G24 R4 terminal trust-seam candidate')
    || designState.includes('G24 R5 dependent Release watermark repair'),
)

for (const [name, content] of [['blueprint', blueprint], ['contract', contractText], ['delta', deltaText], ['QA', qa]]) check(`${name} has no em dash`, !content.includes('—'))

if (failures.length) {
  console.error(`G24 R4 repair failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: G24 R4 binds epistemic eligibility, closes the exact lifecycle and partitions selector failure without opening external action')
