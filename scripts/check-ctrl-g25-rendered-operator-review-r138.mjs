import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const record = JSON.parse(read('project-documentation/ctrl-evolution/g25-rendered-operator-review-r138.json'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

check(record.status === 'private_rendered_composition_passed', 'R138 status drifted')
check(record.isolated_project_ref === 'cgkcplcamsijghalintq', 'R138 isolated project drifted')
check(record.production_project_ref === 'bkyuxvschuwngtcdhsyg' && record.production_writes === 0, 'R138 production boundary drifted')
check(record.browser_tests_passed === 3, 'R138 browser proof count drifted')
check(record.live_five_field_projection_rendered === true && record.strict_adapter_used === true, 'R138 live strict projection is unproved')
check(record.returned_fields.join('|') === 'consequence|headline|question|ready_since|review_packet_id', 'R138 response widened')
check(record.owner_standard_unchanged === true && record.operator_decision_authority === false, 'R138 widened decision authority')
check(record.raw_packet_hidden === true && record.unauthorised_workspace_concealed === true, 'R138 privacy boundary drifted')
check(record.mobile_hidden_operator_reads === 0, 'R138 phone path performs a hidden operator read')
check(record.customer_surface_changed === false && record.public_route_connected === false, 'R138 claims a route or customer surface')
check(record.credentials_persisted === false, 'R138 persisted credentials')
check(Object.values(record.cleanup).every((value) => value === 0), 'R138 cleanup is incomplete')
check(record.forced_failure_after_hosted_rows === true, 'R138 does not force a post-write failure')
check(
  record.forced_failure_cleanup && Object.values(record.forced_failure_cleanup).every((value) => value === 0),
  'R138 forced-failure cleanup is incomplete',
)

for (const [key, value] of Object.entries(record.artifacts)) {
  if (!key.endsWith('_sha256')) continue
  const pathKey = key.replace(/_sha256$/, '')
  const path = record.artifacts[pathKey]
  check(Boolean(path), `R138 artifact path missing: ${pathKey}`)
  if (path) check(hash(path) === value, `R138 artifact hash drift: ${pathKey}`)
}

const bench = read('src/features/operator-brain/DecisionBenchPage.tsx')
const entry = read('preview-r138/main.tsx')
const spec = read('src/__tests__/e2e/g25-operator-review-live-r138.spec.ts')
const orchestrator = read('scripts/probe-ctrl-g25-rendered-operator-review-r138.mjs')

check(bench.includes('<OperatorReviewSignalGateway') && bench.includes('enabled={runtimeReviewEnabled}'), 'R138 does not use the exact runtime gateway')
check(bench.includes("window.matchMedia('(min-width: 621px)')"), 'R138 does not suppress the hidden phone read')
check(entry.includes("const isolatedProject = 'cgkcplcamsijghalintq'"), 'R138 entry is not pinned to the isolated project')
check(!entry.includes('@/integrations/supabase/client'), 'R138 imports the global product client')
check(!entry.includes('service_role') && !entry.includes('SUPABASE_SERVICE_ROLE_KEY'), 'R138 entry embeds elevated credentials')
check(entry.includes('createEphemeralAuthStorage()') && entry.includes('window.localStorage.removeItem(key)'), 'R138 leaves the proof session in durable browser storage')
check(spec.includes("expect(rpcCalls).toBe(1)") && spec.includes("expect(rpcCalls).toBe(0)"), 'R138 does not prove exact desktop and phone call counts')
check(spec.includes('expectSessionIsEphemeral(page)'), 'R138 does not verify transient browser auth cleanup')
check(
  orchestrator.includes("CTRL_PROBE_FAULT_AFTER_HOSTED_ROWS: '1'") &&
  orchestrator.includes("process.env.CTRL_PROBE_KEEP_FIXTURE !== '1' || primaryError") &&
  orchestrator.includes("run.status !== 86") &&
  orchestrator.includes("requireZeroCleanup(parsed.cleanup, 'forced_failure')"),
  'R138 lacks executable forced-failure cleanup proof',
)
check(orchestrator.includes("'--trace=off'") && orchestrator.includes("join(temporaryDirectory, 'playwright-results')"), 'R138 may persist authenticated browser traces outside disposable scratch')
check(orchestrator.includes("CTRL_PROBE_KEEP_FIXTURE: '1'") && orchestrator.includes('cleanupFixture(fixture)'), 'R138 lacks retained-fixture success cleanup ownership')
check(hash('src/router.tsx') === record.artifacts.unchanged_router_sha256, 'R138 altered the public application router')

if (failures.length) {
  console.error(`[g25-rendered-operator-review-r138] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-rendered-operator-review-r138] PASS: live isolated bytes render privately through the exact gateway; phone, authority, production and cleanup boundaries hold')
