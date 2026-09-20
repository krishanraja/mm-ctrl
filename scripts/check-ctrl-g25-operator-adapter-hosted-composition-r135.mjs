import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const record = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-adapter-hosted-composition-r135.json'))
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

check(record.status === 'strict_hosted_adapter_passed', 'R135 status drifted')
check(record.isolated_project_ref === 'cgkcplcamsijghalintq' && record.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'R135 project identity drifted')
check(record.production_writes === 0, 'R135 wrote to production')
check(record.strict_adapter_calls === 1, 'R135 did not use exactly one strict adapter call')
check(record.actual_rpc === 'get_operator_pending_standard_change_review_v1', 'R135 RPC widened')
check(record.returned_fields.join('|') === 'consequence|headline|question|ready_since|review_packet_id', 'R135 response widened')
check(record.raw_packet_returned === false && record.direct_raw_packet_hidden === true, 'R135 exposes raw packet material')
check(record.operator_decision_status === 404 && record.owner_standard_unchanged === true, 'R135 expands operator authority')
check(record.active_standard_mutated === false && record.decision_authority_granted === false && record.notification_sent === false, 'R135 crosses a closed authority boundary')
check(record.cleanup_counts_all_zero === true, 'R135 cleanup is incomplete')
check(record.browser_rendered_from_live_data === false && record.route_connected === false && record.customer_surface_changed === false, 'R135 claims an unproved browser or route')

for (const [name, value] of Object.entries(record.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(Boolean(record.artifacts[sourceKey]), `R135 artifact path missing: ${sourceKey}`)
  if (record.artifacts[sourceKey]) check(hash(record.artifacts[sourceKey]) === value, `R135 artifact hash drift: ${sourceKey}`)
}

const composition = read(record.artifacts.composition_probe)
check(composition.includes("import { getOperatorPendingQueue }"), 'R135 does not use the exact application adapter')
check(composition.includes('await getOperatorPendingQueue(client, String(workspaceId'), 'R135 bypasses strict parsing')
check(composition.includes('strictAdapterCalls !== 1'), 'R135 does not enforce one live adapter call')
check(composition.includes("await import('./probe-ctrl-g25-owner-operator-hosted-lifecycle-r130.mjs')"), 'R135 does not run the hosted authority lifecycle')
check(!composition.includes('service_role') && !composition.includes('SUPABASE_SERVICE_ROLE_KEY'), 'R135 embeds elevated credentials')

if (failures.length) {
  console.error(`[g25-operator-adapter-hosted-composition-r135] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-adapter-hosted-composition-r135] PASS: one live isolated RPC crossed the exact strict application adapter; authority, production and routes remain closed')
