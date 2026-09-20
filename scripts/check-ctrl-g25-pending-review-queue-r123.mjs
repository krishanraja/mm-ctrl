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

const r122 = JSON.parse(read('project-documentation/ctrl-evolution/g25-stable-review-address-r122.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-pending-review-queue-r123.json'))
const migration = read('supabase/migrations/20260920150000_standard_change_pending_review_queue.sql')
const core = read('supabase/functions/_shared/standard-change-owner-queue-core.ts')
const edge = read('supabase/functions/review-standard-change-v4/index.ts')
const queue = read('src/features/standard-review/pendingQueue.ts')
const probe = read('scripts/probe-ctrl-g25-pending-review-queue-r123.mjs')
const config = read('supabase/config.toml')
const experienceReceipt = JSON.parse(read('project-documentation/ctrl-evolution/runs/g24-experience-g25-stable-review-address-r122/receipt.json'))

for (const [name, value] of Object.entries(r122.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(r122.artifacts[sourceKey] && hash(r122.artifacts[sourceKey]) === value, `R122 artifact drift: ${sourceKey}`)
}

check(migration.includes("v_user_id uuid := auth.uid()"), 'pending queue does not derive its owner from the authenticated identity')
check(migration.includes("state = 'ready'") && migration.includes('order by created_at asc, id asc'), 'pending queue does not select one deterministic ready packet')
check(migration.includes("'materiality_inferred', false"), 'pending queue claims an unearned materiality ranking')
check(migration.includes('standard_change_json_sha256(v_review.packet)') && migration.includes("'consequence'"), 'pending queue does not bind the visible consequence to a verified frozen packet')
check(!migration.includes('insert into') && !migration.includes('update public') && !migration.includes('delete from'), 'pending queue can mutate durable state')
check(core.includes("action: 'pending'") && core.includes('Object.keys(body).length !== 1'), 'V4 parser accepts caller-steered queue selection')
check(core.includes("name: 'get_pending_standard_change_review_v4'"), 'V4 pending action does not map to the queue RPC')
check(edge.includes("withSupabase({ auth: 'user' }") && edge.includes('Cache-Control'), 'V4 route is not authenticated and non-cacheable')
check(config.includes('[functions.review-standard-change-v4]') && config.includes('verify_jwt = true'), 'V4 route is not explicitly JWT protected')
check(queue.includes("invoke('review-standard-change-v4'") && queue.includes("body: { action: 'pending' }"), 'product projection does not call the exact V4 pending action')
check(queue.includes("z.literal('oldest_ready_first')") && queue.includes('z.literal(false)'), 'product projection does not preserve ranking restraint')
check(probe.includes('ready_count_transitions: [3, 2, 1]') && probe.includes('notification_sent: false'), 'hosted proof does not cover queue transitions and notification restraint')
check(experienceReceipt.status === 'preflight' && experienceReceipt.approval_claims.length === 0, 'R122 corrective experience receipt overclaims approval')
check(experienceReceipt.changed_surface_files.includes('src/features/standard-review/StandardReviewAddressPage.tsx'), 'R122 corrective experience receipt does not cover the stable address surface')
check(!probe.includes('sb_publishable_') && !probe.includes('sb_secret_'), 'R123 probe contains a credential-shaped literal')
check(!`${migration}\n${core}\n${edge}\n${queue}\n${probe}`.includes('\u2014'), 'R123 artifacts contain an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R123 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R123 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-pending-review-queue-r123] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-pending-review-queue-r123] PASS: one authenticated owner receives one verified ready review, exact consequence and safe path without mutation, notification or invented priority')
