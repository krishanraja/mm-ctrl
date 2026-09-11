import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const blueprintPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-blueprint.md')
const contractPath = join(root, 'project-documentation/ctrl-evolution/g24-product-system-contract.json')
const statePath = join(root, 'project-documentation/ctrl-evolution/README.md')
const designStatePath = join(root, 'docs/current/design-state.md')

const blueprint = readFileSync(blueprintPath, 'utf8')
const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const state = readFileSync(statePath, 'utf8')
const designState = readFileSync(designStatePath, 'utf8')

const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}
const unique = values => new Set(values).size === values.length
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex')

check('contract schema version', contract.schema_version === 'ctrl.product-system.g24.v1')
check('contract remains founder-review proposal', contract.status === 'proposed_founder_review')
check('canonical state route', contract.state_route === 'project-documentation/ctrl-evolution/README.md')
check('G23 lock tag retained', contract.product_lock?.tag === 'ctrl-product-spine-g23-approved-r2')
check(
  'G23 approved artifact hash retained',
  sha256(join(root, 'public/g23-product-spine-r2.html')) === '6494ec7251b0b36fd32448a8ed9e304011fd92f42dff26c66aaa61e75aba9c55',
)

const roles = contract.product?.roles || {}
check('Brain authority is explicit', roles.brain?.right === 'prepare_and_propose' && roles.brain?.forbidden === 'promote_own_inference_or_make_call')
check('Krish authority is explicit', roles.krish?.right === 'challenge_and_control_interruption')
check('leader authority is explicit', roles.leader?.right === 'set_purpose_judge_decide_polish_and_own')

const runtimeRoles = new Set((contract.runtime_layers || []).map(layer => layer.role))
check('runtime has canonical live store', runtimeRoles.has('canonical_live_state'))
check('runtime has canonical raw-source store', runtimeRoles.has('canonical_raw_source_bytes'))
check('retrieval is rebuildable', runtimeRoles.has('disposable_rebuildable_indexes_and_cache'))
check('portable release is separate', runtimeRoles.has('portable_customer_owned_projection'))

const expectedTables = [
  'brain_workspaces',
  'brain_workspace_roles',
  'brain_audience_grants',
  'brain_sources',
  'brain_assertions',
  'brain_items',
  'brain_item_versions',
  'brain_item_version_assertions',
  'brain_relationships',
  'brain_relationship_versions',
  'brain_relationship_version_assertions',
]
const actualTables = contract.current_brain_substrate?.tables || []
check('G16 table count is exact', contract.current_brain_substrate?.table_count === expectedTables.length)
check('G16 table list is exact', expectedTables.every(name => actualTables.includes(name)) && actualTables.length === expectedTables.length)
check('G16 runtime separation is honest', contract.current_brain_substrate?.runtime_reader_or_writer_present === false)

const surfaces = contract.surfaces || []
check('surface ids are unique', unique(surfaces.map(surface => surface.id)))
check('surface map is dependency complete', surfaces.length >= 7 && surfaces.every(surface => surface.purpose && surface.entry && surface.exit && surface.data_dependency && surface.verification_signal))
check('customer and operator remain distinct', surfaces.some(surface => surface.id === 'leader_companion') && surfaces.some(surface => surface.id === 'operator_customer_room'))

const slice = contract.first_vertical_slice || {}
check('first slice is the Crossing', slice.id === 'the_crossing')
check('first slice crosses two decisions', slice.decisions_required === 2 && slice.decisions_materially_different === true)
check('one learning proposal maximum', slice.learning_proposal_maximum === 1)
check('one customer question visible', slice.customer_questions_visible_at_once === 1)
for (const requirement of ['human_prior', 'owned_call', 'cross_decision_reuse', 'correction_and_repair', 'readable_claude_package_and_return', 'deterministic_release_and_reimport']) {
  check(`first slice includes ${requirement}`, slice.includes?.includes(requirement))
}

const namespaces = new Map((contract.evidence_namespaces || []).map(namespace => [namespace.id, namespace]))
check('real-public namespace exists', namespaces.has('real_public'))
check('real-public cannot receive synthetic private material', namespaces.get('real_public')?.synthetic_private_material_allowed === false)
check('consented-real cannot receive synthetic private material', namespaces.get('consented_real')?.synthetic_private_material_allowed === false)
check('synthetic fixtures cannot impersonate real people', namespaces.get('synthetic_fixture')?.real_named_identity === false)

check('permanent council has seven unique judges', contract.permanent_council?.length === 7 && unique(contract.permanent_council))
check('north star is explicitly unproven', contract.north_star_hypothesis?.standing === 'proposed_unproven')
check('north star is not a customer scoreboard', contract.north_star_hypothesis?.customer_scoreboard === false)

for (const closedAction of ['production_write', 'customer_data', 'email_send', 'database_branch_creation', 'deployment', 'merge', 'release', 'legacy_backend_deletion']) {
  check(`external action remains closed: ${closedAction}`, contract.authority?.closed?.includes(closedAction))
}

const requiredBlueprintPhrases = [
  'The whole product in one minute',
  'One product, three authorities',
  'The thirty-day operating model',
  'Context circulation',
  'The Brain model',
  'Runtime and storage',
  'AI harness',
  'Human agency and the consequential-work loop',
  'Preserving taste without producing more sameness',
  'Learning, correction and self-healing',
  'Claude, email and work-tool membranes',
  'Qualified Judgement Transfer',
  'First complete vertical slice',
  'Build gates',
]
for (const phrase of requiredBlueprintPhrases) check(`blueprint includes ${phrase}`, blueprint.includes(phrase))
check('blueprint has no em dash', !blueprint.includes('—'))
check('contract has no em dash', !readFileSync(contractPath, 'utf8').includes('—'))
check('canonical state links G24 blueprint', state.includes('[G24 product-system blueprint](g24-product-system-blueprint.md)'))
check('canonical state links G24 contract', state.includes('[machine contract](g24-product-system-contract.json)'))
check('design state routes evolution work to canonical ledger', designState.includes('project-documentation/ctrl-evolution/README.md'))

if (failures.length) {
  console.error(`G24 product-system contract failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: G24 product spine, authority, Brain, harness, surfaces, Crossing and closed-action contracts passed')
