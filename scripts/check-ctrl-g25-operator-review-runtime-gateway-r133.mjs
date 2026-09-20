import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-runtime-gateway-r133.json'))
const renderedSuccessor = JSON.parse(read('project-documentation/ctrl-evolution/g25-rendered-operator-review-r138.json'))
const receipt = JSON.parse(read('project-documentation/ctrl-evolution/runs/g24-experience-r133-operator-runtime/receipt.json'))
const gateway = read(contract.artifacts.gateway)
const hook = read(contract.artifacts.hook)
const tests = read(contract.artifacts.gateway_tests)
const signal = read(contract.artifacts.signal)

check(['preflight', 'runtime_gateway_passed'].includes(contract.status), 'R133 status is invalid')
check(contract.runtime_boundary.client_injected === true, 'R133 does not require an injected client')
check(contract.runtime_boundary.global_supabase_client_imported === false, 'R133 imports the global Supabase client')
check(contract.runtime_boundary.only_adapter === 'getOperatorPendingQueue', 'R133 adapter boundary widened')
check(contract.runtime_boundary.identity_fields.join('|') === 'client_reference|workspace_id|leader_label', 'R133 identity binding drifted')
for (const boundary of ['polling', 'retry', 'persistence', 'leader_notification', 'standard_mutation', 'decision_authority', 'route_wired', 'live_database_connected']) {
  check(contract.runtime_boundary[boundary] === false, `R133 widened boundary: ${boundary}`)
}
check(contract.verification.customer_surface_changed === false, 'R133 changed the customer surface')
check(contract.verification.production_writes === 0, 'R133 wrote to production')
check(contract.verification.isolated_database_writes === 0, 'R133 wrote to the isolated database')
check(contract.r132_history.rewritten === false, 'R133 rewrote R132 history')
check(contract.r132_history.operator_signal_sha256 === 'c8261def114c1014b2edc1bfdc9ea0e365a950ccb4061365ec6b1161864260b8', 'R132 signal history drifted')
check(contract.r132_history.decision_bench_sha256 === '56d4f61fbcb0efb67ea15486909d550af2c1e374d8bc7b8c9fefb5ebac53ff22', 'R132 Decision Table history drifted')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  if (sourceKey === 'synthetic_caller') continue
  check(Boolean(contract.artifacts[sourceKey]), `R133 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) check(hash(contract.artifacts[sourceKey]) === value, `R133 artifact hash drift: ${sourceKey}`)
}

check(
  hash(renderedSuccessor.artifacts.decision_bench) === renderedSuccessor.artifacts.decision_bench_sha256,
  'R138 current Decision Bench successor hash drifted',
)

check(hook.includes("from '@/features/standard-review/operatorPendingQueue'"), 'R133 bypasses the strict R131 adapter')
check(hook.includes('getOperatorPendingQueue(client, workspaceId)'), 'R133 does not make the exact queue request')
check(!/supabase/i.test(hook + gateway), 'R133 imports or names a Supabase client')
check(hook.includes('settled.client === client') && hook.includes('settled.workspaceId === workspaceId') && hook.includes('settled.leaderLabel === leaderLabel'), 'R133 does not bind the complete visible identity')
check(hook.includes('enabled && validLeaderLabel(leaderLabel)'), 'R133 does not fail closed on enabled and leader identity')
check(hook.includes('requestToken.current !== token'), 'R133 does not suppress stale responses')
check(hook.includes('WeakMap<StandardReviewRpcClient'), 'R133 does not deduplicate client-scoped requests')
check(gateway.includes("if (state.status !== 'available' || !state.queue) return null"), 'R133 does not render literal null outside available')
check(gateway.includes('key={state.queue.next.review_packet_id}'), 'R133 does not reset interaction state by packet')
check(gateway.includes('role="status"') && gateway.includes('className="sr-only"'), 'R133 omits the ready-only assistive announcement')
check(signal.includes('<span>{leaderLabel} decides.</span>'), 'R133 signal does not use the validated dynamic leader label')

for (const attack of [
  'clears an available customer synchronously',
  'ignores a late response',
  'stays empty when the new workspace is unavailable',
  'leader identity changes',
  'new client or disabled seam',
  'resets copied state',
  'unrelated rerender',
  'React StrictMode',
]) check(tests.includes(attack), `R133 test attack missing: ${attack}`)

check(receipt.protocol_id === 'G24-EXPERIENCE-PROOF-COUNCIL-R1', 'R133 experience receipt protocol drifted')
check(['preflight', 'passed_for_founder_review'].includes(receipt.status), 'R133 experience receipt status is invalid')
check(receipt.customer_surface_changed === false && receipt.production_writes === 0 && receipt.isolated_database_writes === 0, 'R133 receipt widens a closed boundary')

for (const source of [gateway, hook, signal]) {
  check(!source.includes('\u2014'), 'R133 source contains an em dash')
}

if (failures.length) {
  console.error(`[g25-operator-review-runtime-gateway-r133] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-review-runtime-gateway-r133] PASS: exact upstream question, complete customer identity, stale-response suppression and closed authority')
