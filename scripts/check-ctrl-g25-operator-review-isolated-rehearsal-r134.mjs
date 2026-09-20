import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const record = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-isolated-rehearsal-r134.json'))
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

check(record.status === 'two_sided_rehearsal_passed', 'R134 status drifted')
check(record.isolated_project_ref === 'cgkcplcamsijghalintq', 'R134 isolated target drifted')
check(record.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'R134 production identity drifted')
check(record.production_project_excluded === true && record.production_writes === 0, 'R134 does not exclude production')
check(record.hosted_rehearsal.status === 'passed', 'R134 hosted rehearsal did not pass')
check(record.hosted_rehearsal.returned_fields.join('|') === 'consequence|headline|question|ready_since|review_packet_id', 'R134 operator projection widened')
check(record.hosted_rehearsal.raw_packet_returned === false && record.hosted_rehearsal.direct_raw_packet_hidden === true, 'R134 exposes raw owner material')
check(record.hosted_rehearsal.operator_decision_status === 404 && record.hosted_rehearsal.owner_standard_unchanged === true, 'R134 expands operator authority')
check(record.application_rehearsal.r133_status === 'runtime_gateway_passed', 'R134 application gateway is not accepted')
check(record.application_rehearsal.strict_adapter_only === true && record.application_rehearsal.global_supabase_client_imported === false, 'R134 bypasses the injected strict adapter')
check(record.route_connected === false && record.customer_surface_changed === false, 'R134 claims an unproved route or customer surface')
check(record.cleanup_complete === true && Object.values(record.cleanup).every((count) => count === 0), 'R134 cleanup is incomplete')

for (const [name, value] of Object.entries(record.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(Boolean(record.artifacts[sourceKey]), `R134 artifact path missing: ${sourceKey}`)
  if (record.artifacts[sourceKey]) check(hash(record.artifacts[sourceKey]) === value, `R134 artifact hash drift: ${sourceKey}`)
}

const probe = read(record.artifacts.hosted_probe)
check(probe.includes("const projectRef = 'cgkcplcamsijghalintq'"), 'R134 probe does not pin the isolated project')
check(probe.includes("if (projectRef === productionProjectRef) throw new Error('R130 cannot target production')"), 'R134 probe lacks the production guard')
check(probe.includes('delete from public.brain_access_receipts'), 'R134 probe lacks receipt cleanup')
check(probe.includes("decisionAttempt.status !== 404"), 'R134 probe does not reject operator decisions')

if (failures.length) {
  console.error(`[g25-operator-review-isolated-rehearsal-r134] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-review-isolated-rehearsal-r134] PASS: isolated hosted projection and fail-closed application seam both hold; cleanup is zero and the route remains closed')
