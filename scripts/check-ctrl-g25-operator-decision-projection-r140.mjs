import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-decision-projection-r140.json'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

check(contract.status === 'strict_projection_contract_passed', 'R140 status drifted')
check(contract.projection_schema === 'ctrl.operator-decision-projection.v1', 'R140 projection schema drifted')
check(contract.environment_ref === 'cgkcplcamsijghalintq', 'R140 environment drifted')
check(contract.audience === 'delivery_team_private' && contract.purpose === 'operator_decision_preparation', 'R140 scope drifted')
check(contract.routes_required === 3 && contract.adversarial_tests_passed === 26, 'R140 proof counts drifted')
check(contract.synthetic_fixture_rejected === true && contract.partial_projection_on_failure === false, 'R140 accepts synthetic or partial material')
check(contract.raw_source_body_allowed === false, 'R140 allows raw source bodies')
check(contract.server_producer_implemented === false && contract.react_consumer_implemented === false, 'R140 overclaims implementation')
check(contract.route_added === false && contract.database_writes === 0 && contract.production_writes === 0, 'R140 widens runtime authority')

for (const [key, value] of Object.entries(contract.artifacts)) {
  if (!key.endsWith('_sha256')) continue
  const pathKey = key.replace(/_sha256$/, '')
  const path = contract.artifacts[pathKey]
  check(Boolean(path), `R140 artifact path missing: ${pathKey}`)
  if (path) check(hash(path) === value, `R140 artifact hash drift: ${pathKey}`)
}

const source = read(contract.artifacts.projection_parser)
const tests = read(contract.artifacts.projection_tests)
const router = read('src/router.tsx')

for (const token of [
  "schema_version: z.literal('ctrl.operator-decision-projection.v1')",
  "environment_ref: z.literal('cgkcplcamsijghalintq')",
  "audience: z.literal('delivery_team_private')",
  "purpose: z.literal('operator_decision_preparation')",
  'routes: z.array(routeSchema).length(3)',
  'evidence: z.array(evidenceSchema)',
  "redaction_state: z.enum(['not_required', 'applied'])",
  "projection: null",
  "review signal decision mismatch",
  "every route needs a route-changing question",
]) check(source.includes(token), `R140 parser guard missing: ${token}`)

check(!source.includes('raw_body') && !source.includes('source_body'), 'R140 parser exposes raw source bodies')
check(tests.includes('rejects the existing synthetic Decision Bench fixture'), 'R140 lacks the synthetic negative control')
check(tests.includes('never returns a partial projection on failure'), 'R140 lacks atomic-failure coverage')
check(!router.includes("path: '/operator/workspaces/:workspaceId/decisions/:decisionId'"), 'R140 connected the blocked route')

if (failures.length) {
  console.error(`[g25-operator-decision-projection-r140] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-decision-projection-r140] PASS: the complete operator surface has one strict authority, evidence, route, question, judgement and returned-work projection; server, React and route integration remain closed')
