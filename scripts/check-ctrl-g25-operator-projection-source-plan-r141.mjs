import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = process.cwd()
const contractPath = 'project-documentation/ctrl-evolution/g25-operator-projection-source-plan-r141.json'
const contract = JSON.parse(readFileSync(`${root}/${contractPath}`, 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const digest = (relative) => createHash('sha256').update(readFileSync(`${root}/${relative}`)).digest('hex')

check(contract.schema_version === 'ctrl.g25.operator-projection-source-plan.r141.v1', 'unexpected schema version')
check(contract.status === 'live_catalogue_read_projection_not_ready', 'status must preserve the closed projection')
check(contract.isolated_project_ref === 'cgkcplcamsijghalintq', 'wrong isolated project')
check(contract.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'wrong production project')
check(contract.required_blockers === 8, 'exact blocker count changed')
check(contract.legacy_decision_authority === false, 'legacy decision authority must stay closed')
check(contract.route_connection_allowed === false, 'route connection must stay closed')
check(contract.database_writes === 0 && contract.production_writes === 0, 'unexpected database write')
check(contract.live_catalogue_evidence?.legacy_decision_workspace_binding_present === false, 'workspace gap must remain explicit')
check(contract.live_catalogue_evidence?.complete_operator_projection_possible === false, 'projection cannot be claimed ready')

for (const [name, relative] of [
  ['source_plan', contract.artifacts.source_plan],
  ['tests', contract.artifacts.tests],
  ['strategy', contract.artifacts.strategy],
  ['finding', contract.artifacts.finding],
  ['qa', contract.artifacts.qa],
]) {
  check(digest(relative) === contract.artifacts[`${name}_sha256`], `${name} hash mismatch`)
}

const plan = readFileSync(`${root}/${contract.artifacts.source_plan}`, 'utf8')
for (const token of [
  'public.decision_cases inferred into a workspace from user_id',
  'workspace-bound decision case',
  'purpose-bound decrypted atomic projection',
  'semantic similarity alone',
  'thin prompt',
  "state: 'optional_absent'",
]) check(plan.includes(token), `source plan missing ${token}`)

if (failures.length) {
  console.error(`[g25-operator-projection-source-plan-r141] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-projection-source-plan-r141] PASS: live Brain authority is mapped, eight source gaps stay closed and legacy user identity cannot masquerade as workspace-bound decision authority')
