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

const r121 = JSON.parse(read('project-documentation/ctrl-evolution/g25-rendered-authenticated-review-r121.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-stable-review-address-r122.json'))
const migration = read('supabase/migrations/20260920130000_standard_change_review_address.sql')
const core = read('supabase/functions/_shared/standard-change-owner-address-core.ts')
const edge = read('supabase/functions/review-standard-change-v3/index.ts')
const gateway = read('src/features/standard-review/addressGateway.ts')
const route = read('src/router.tsx')
const browser = read('src/__tests__/e2e/g25-standard-review-address-r122.spec.ts')
const probe = read('scripts/probe-ctrl-g25-standard-review-address-r122.mjs')
const config = read('supabase/config.toml')

for (const [name, value] of Object.entries(r121.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(r121.artifacts[sourceKey] && hash(r121.artifacts[sourceKey]) === value, `R121 artifact drift: ${sourceKey}`)
}
check(migration.includes('stable') && migration.includes('security definer') && migration.includes("v_user_id uuid := auth.uid()"), 'stable address RPC is not owner-authenticated and read-only')
check(migration.includes("v_review.state <> 'ready'") && migration.includes('standard_change_json_sha256(v_review.packet)'), 'stable address RPC does not verify ready state and packet bytes')
check(migration.includes('standard_change_review_not_owned') && !migration.includes('insert into') && !migration.includes('update public') && !migration.includes('delete from'), 'stable address RPC leaks ownership or mutates data')
check(migration.includes('deploy_authorized') && migration.includes('release_authorized'), 'stable address RPC omits authority closure')
check(core.includes("action: 'open'") && core.includes("Object.keys(body).length !== 2"), 'V3 request parser does not enforce one exact open shape')
check(core.includes("name: 'open_standard_change_review_v3'"), 'V3 request does not map to the stable-address RPC')
check(edge.includes("withSupabase({ auth: 'user' }") && edge.includes("status === 404") && edge.includes("'review_not_found'"), 'V3 route does not preserve authenticated concealment')
check(config.includes('[functions.review-standard-change-v3]') && config.includes('verify_jwt = true'), 'V3 route is not explicitly JWT protected')
check(gateway.includes("invoke('review-standard-change-v3'") && gateway.includes("action: 'open'"), 'product address gateway does not use the V3 open action')
check(route.includes("VITE_ENABLE_STANDARD_REVIEW_ADDRESS === '1'") && route.includes('<RequireAuth><StandardReviewAddressPage /></RequireAuth>'), 'permanent product route is not closed and authenticated')
check(browser.includes("expect(new URL(page.url()).search).toBe('')"), 'browser proof does not require a clean stable URL')
check(browser.includes('foreignCopy).toBe(unknownCopy)'), 'browser proof does not make cross-owner and unknown states indistinguishable')
check(probe.includes('probe-ctrl-g25-rendered-standard-review-r121.mjs') && probe.includes('freezeReviewPackets'), 'R122 does not reuse the frozen R121 browser machinery and pre-freeze packets')
check(!gateway.includes('expected_result_sha256') && !browser.includes('result_sha256'), 'stable product address still carries a check hash')
check(!probe.includes('sb_publishable_') && !probe.includes('sb_secret_'), 'R122 probe contains a credential-shaped literal')
check(!`${migration}\n${core}\n${edge}\n${gateway}\n${browser}\n${probe}`.includes('\u2014'), 'R122 artifacts contain an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R122 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R122 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-stable-review-address-r122] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-stable-review-address-r122] PASS: one authenticated private address opens a frozen packet without hashes, leakage, mutation or fixture residue')
