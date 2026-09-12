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
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r4.md': 'd4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r4.json': '58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c',
  'project-documentation/ctrl-evolution/g24-product-system-r4-delta.json': '4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85',
  'project-documentation/ctrl-evolution/runs/g24-r4-architecture-council-003/adjudication.md': 'c0e37605b5257beb08775c0c088cd13e1cc3cc9282ae47bcba281f0f8524630b',
}

for (const [path, hash] of Object.entries(frozen)) check(`frozen hash: ${path}`, sha256(path) === hash)

const blueprintPath = 'project-documentation/ctrl-evolution/g24-product-system-blueprint-r5.md'
const contractPath = 'project-documentation/ctrl-evolution/g24-product-system-contract-r5.json'
const deltaPath = 'project-documentation/ctrl-evolution/g24-product-system-r5-delta.json'
const qaPath = 'project-documentation/ctrl-evolution/g24-product-system-r5-qa-record.md'
const statePath = 'project-documentation/ctrl-evolution/README.md'
const designStatePath = 'docs/current/design-state.md'
const blueprint = read(blueprintPath)
const contractText = read(contractPath)
const contract = JSON.parse(contractText)
const deltaText = read(deltaPath)
const delta = JSON.parse(deltaText)
const qa = read(qaPath)
const state = read(statePath)
const designState = read(designStatePath)

check('R5 schema', contract.schema_version === 'ctrl.product-system.g24.r5-dependent-release-watermark-repair.v1')
check('R5 remains proposed', contract.status === 'proposed_fresh_council_and_founder_lock')
check('R5 amends exact R4 adjudication', contract.amends_frozen_r4?.adjudication_sha256 === frozen['project-documentation/ctrl-evolution/runs/g24-r4-architecture-council-003/adjudication.md'])
check('R5 changes one area', contract.normative_precedence?.r5_replaces_only?.length === 1 && contract.normative_precedence.r5_replaces_only[0] === 'dependent_pending_release_projection_watermark_binding_and_invalidation')
check('R5 creates no root', contract.normative_precedence?.new_canonical_root === false)
check('R4 and R3 remain inherited', contract.normative_precedence?.all_other_r4_rules_inherited === true && contract.normative_precedence?.all_unaffected_r3_rules_inherited === true)

const closure = contract.dependent_release_watermark_closure || {}
check('existing Release owns closure', closure.owner === 'existing_r1_canonical_release_object_and_dependency_graph' && closure.creates_new_release_or_dependency_root === false)
check('dependent selector result is bound', closure.required_binding_before_use_added?.includes('included_selector_result_version_refs_when_applicable'))
check('complete dependent watermarks are bound', closure.required_binding_before_use_added?.includes('included_selector_complete_controlling_watermark_sets_when_applicable'))
check('policy and challenger watermarks are mandatory', closure.complete_controlling_watermark_minimum?.includes('epistemic_policy_version') && closure.complete_controlling_watermark_minimum?.includes('independent_challenger_result_version'))
check('included watermark change invalidates pending Release', closure.invalidation_trigger_added === 'included_selector_controlling_watermark_change' && closure.dependent_watermark_change_result === 'pending_release_projection_invalid_before_use')
check('invalidation is receipted and non-actionable', closure.dependent_watermark_change_receipt === 'append_only_release_projection_invalidation_receipt' && closure.dependent_watermark_change_creates_approval_delivery_or_external_side_effect === false)
check('source and Brain stability cannot hide challenger change', closure.applies_when_sources_and_brain_versions_are_unchanged === true)
check('unrelated lineage is not globally invalidated', closure.unrelated_watermark_change_outside_recorded_lineage_invalidates_projection === false)
check('rebuild alone does not restore eligibility', closure.rebuild_alone_restores_eligibility === false)
check('renewed eligibility requires trusted result and separate human Release authority', closure.eligibility_after_rebuild_requires?.includes('trusted_current_evaluation_under_new_complete_watermark_set') && closure.eligibility_after_rebuild_requires?.includes('current_named_leader_release_authority_for_new_exact_projection_purpose_audience_and_canonical_versions'))
check('Release authority owner does not change', closure.changes_release_authority_owner === false)

const test = contract.identical_resolving_test || {}
check('identical test mutates only dependent challenger result', test.only_mutation === 'dependent_independent_challenger_result_version_to_countercase_found')
check('mutated test invalidates before use', test.required_mutated_case_result?.includes('unchanged_pending_projection_ineligible_before_use'))
check('mutated test has receipt and no side effect', test.required_mutated_case_result?.includes('append_only_invalidation_receipt') && test.required_mutated_case_result?.includes('zero_approval_delivery_or_external_side_effect'))
check('control projection survives unrelated change', test.unrelated_lineage_control_projection_remains_eligible_if_otherwise_current === true)

const r4Contract = JSON.parse(read('project-documentation/ctrl-evolution/g24-product-system-contract-r4.json'))
check('closed action set is identical to R4', JSON.stringify(contract.authority?.closed) === JSON.stringify(r4Contract.authority?.closed))
check('no external action opens in delta', Array.isArray(delta.external_actions_opened) && delta.external_actions_opened.length === 0)
check('delta changes one area', delta.allowed_repair_areas?.length === 1 && delta.allowed_repair_areas[0] === contract.normative_precedence.r5_replaces_only[0])
check('delta binds exact R4 adjudication', delta.baseline?.adjudication_sha256 === contract.amends_frozen_r4.adjudication_sha256)
check('delta forbids global invalidation', delta.forbidden_interpretations?.includes('invalidate_unrelated_challenger_changes_globally'))
check('delta forbids rebuild self-clearance', delta.forbidden_interpretations?.includes('rebuild_alone_restores_release_eligibility'))

for (const phrase of ['The one repair', 'complete controlling watermark set', 'lineage-scoped', 'Identical resolving test', 'Protected strengths', 'Exact next action']) {
  check(`blueprint includes ${phrase}`, blueprint.includes(phrase))
}
check('QA keeps runtime claims unproven', qa.includes('does not prove a physical dependency graph') && qa.includes('atomic invalidation'))
check('canonical state links R5 blueprint', state.includes('[G24 R5 dependent Release watermark repair](g24-product-system-blueprint-r5.md)'))
check('canonical state links R5 contract', state.includes('[R5 machine contract](g24-product-system-contract-r5.json)'))
check(
  'design state routes to G24 R5 or its founder-locked implementation state',
  designState.includes('G24 R5 dependent Release watermark repair')
    || designState.includes('founder-locked G24 R1 through R5 architecture'),
)

for (const [name, content] of [['blueprint', blueprint], ['contract', contractText], ['delta', deltaText], ['QA', qa]]) {
  check(`${name} has no em dash`, !content.includes('—'))
}

if (failures.length) {
  console.error(`G24 R5 repair failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: G24 R5 closes dependent Release watermarks without reopening product direction or external action')
