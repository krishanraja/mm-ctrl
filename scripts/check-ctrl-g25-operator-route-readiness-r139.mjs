import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-route-readiness-r139.json'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

check(contract.status === 'route_connection_blocked_by_design', 'R139 status drifted')
check(contract.isolated_project_ref === 'cgkcplcamsijghalintq', 'R139 isolated project drifted')
check(contract.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'R139 production identity drifted')
check(contract.route_added === false && contract.customer_surface_changed === false, 'R139 claims a route or customer change')
check(contract.database_writes === 0 && contract.production_writes === 0, 'R139 claims database writes')
check(contract.adversarial_cases_passed === 19, 'R139 adversarial case count drifted')
check(contract.current_r138_readiness?.status === 'blocked', 'R139 no longer blocks mixed R138 state')
check(
  contract.current_r138_readiness?.reasons?.join('|') === [
    'decision_id_invalid',
    'decision_projection_not_live',
    'decision_workspace_mismatch',
    'decision_environment_mismatch',
    'review_decision_unbound',
  ].join('|'),
  'R139 current-state reasons drifted',
)

for (const [key, value] of Object.entries(contract.artifacts)) {
  if (!key.endsWith('_sha256')) continue
  const pathKey = key.replace(/_sha256$/, '')
  const path = contract.artifacts[pathKey]
  check(Boolean(path), `R139 artifact path missing: ${pathKey}`)
  if (path) check(hash(path) === value, `R139 artifact hash drift: ${pathKey}`)
}

const source = read(contract.artifacts.readiness)
const tests = read(contract.artifacts.tests)
const router = read('src/router.tsx')

for (const token of [
  "OPERATOR_ROUTE_ISOLATED_PROJECT_REF = 'cgkcplcamsijghalintq'",
  "OPERATOR_ROUTE_PRODUCTION_PROJECT_REF = 'bkyuxvschuwngtcdhsyg'",
  "input.selection.authority !== 'server_verified'",
  "input.decisionProjection.mode !== 'live'",
  "input.reviewProjection.mode !== 'live'",
  "input.reviewProjection.decisionId !== decisionId",
  "usesGlobalProductClient",
]) check(source.includes(token), `R139 readiness guard missing: ${token}`)

check(!source.includes('@/integrations/supabase/client'), 'R139 imports the global product client')
check(!router.includes("path: '/operator/workspaces/:workspaceId/decisions/:decisionId'"), 'R139 connected the blocked persistent route')
check(tests.includes("blocks the current mixed synthetic/live R138 composition"), 'R139 lacks the current-state negative control')
check(tests.includes("returns every relevant reason together"), 'R139 lacks diagnostic-completeness coverage')

if (failures.length) {
  console.error(`[g25-operator-route-readiness-r139] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-route-readiness-r139] PASS: a real operator route remains closed until auth, server selection and complete decision plus review projections bind to one isolated workspace and decision')
