import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex')
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const r116 = JSON.parse(read('project-documentation/ctrl-evolution/g25-standard-change-owner-gate-r116.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-standard-review-product-gateway-r120.json'))
const adapter = read('src/features/standard-review/supabaseInvoker.ts')
const adapterTest = read('src/features/standard-review/supabaseInvoker.test.ts')
const probe = read('scripts/probe-ctrl-g25-standard-review-gateway-r120.mjs')
const finding = read('project-documentation/ctrl-evolution/g25-standard-review-product-gateway-r120.md')

check(hash(r116.artifacts.probe) === r116.artifacts.probe_sha256, 'R116 probe changed instead of being reused read-only')
check(probe.includes('routeCallCount !== 17'), 'R120 does not fail closed on R116 route-call drift')
check(probe.includes('StandardReviewGateway') && probe.includes('createSupabaseStandardReviewInvoker'), 'R120 does not execute the real product gateway and adapter')
check(probe.includes('productClient.auth.refreshSession()'), 'R120 does not exercise authenticated session refresh')
check(probe.includes('productRefreshPreserved'), 'R120 does not prove stable packet identity after refresh')
check(probe.includes('productStaleCode === "state_conflict"'), 'R120 does not prove stale-state mapping')
check(probe.includes('productBlockedReversalCode === "state_conflict"'), 'R120 does not prove non-head reversal mapping')
check(probe.includes('Object.values(result.cleanup)'), 'R120 does not verify complete fixture cleanup')
check(probe.includes('rmSync(temporaryDirectory'), 'R120 does not remove its generated executable')
check(adapter.includes("context.status === 409") && adapter.includes("context.code === 'state_conflict'"), 'product adapter does not preserve a hosted state conflict')
check(adapterTest.includes("status: 409") && adapterTest.includes("message: 'state_conflict'"), 'adapter regression test does not cover the hosted error shape')
check(!adapter.includes('cgkcplcamsijghalintq') && !adapter.includes('bkyuxvschuwngtcdhsyg'), 'product adapter is coupled to a project')
check(!probe.includes('sb_publishable_') && !probe.includes('sb_secret_'), 'R120 probe contains a credential-shaped literal')
check(finding.includes('No credential was written'), 'R120 finding omits credential containment')
check(!adapter.includes('\u2014') && !adapterTest.includes('\u2014') && !probe.includes('\u2014') && !finding.includes('\u2014'), 'R120 artifacts contain an em dash')

for (const [name, path] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R120 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === path, `R120 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-standard-review-gateway-r120] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-standard-review-gateway-r120] PASS: the actual product gateway preserves authenticated refresh, immutable receipts, explicit conflicts and complete cleanup')
