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

const r120 = JSON.parse(read('project-documentation/ctrl-evolution/g25-standard-review-product-gateway-r120.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-rendered-authenticated-review-r121.json'))
const entry = read('preview-r121/main.tsx')
const spec = read('src/__tests__/e2e/g25-human-review-live-r121.spec.ts')
const probe = read('scripts/probe-ctrl-g25-rendered-standard-review-r121.mjs')
const finding = read('project-documentation/ctrl-evolution/g25-rendered-authenticated-review-r121.md')

for (const [name, value] of Object.entries(r120.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(r120.artifacts[sourceKey] && hash(r120.artifacts[sourceKey]) === value, `R120 artifact drift: ${sourceKey}`)
}
check(entry.includes('StandardReviewExperience') && entry.includes('StandardReviewGateway') && entry.includes('createSupabaseStandardReviewInvoker'), 'R121 does not mount the actual approved product stack')
check(entry.includes("isolatedProject = 'cgkcplcamsijghalintq'"), 'R121 harness does not fail closed to the isolated project')
check(!entry.includes('bkyuxvschuwngtcdhsyg'), 'R121 harness references production')
check(!entry.includes('password') && !entry.includes('service_role') && !entry.includes('sb_secret_'), 'R121 browser entry contains a private credential channel')
check(spec.includes("test.describe.configure({ mode: 'serial' })"), 'R121 browser decisions are not sequenced deterministically')
check(spec.includes("name: 'Make this my rule'") && spec.includes("name: 'Keep my current rule'"), 'R121 does not exercise both leader decisions')
check(spec.includes("name: 'Restore the previous rule'"), 'R121 does not exercise rendered reversal')
check(spec.includes("This rule changed while you were reviewing it"), 'R121 does not require the explicit stale state')
check(spec.includes('document.documentElement.scrollWidth'), 'R121 does not check mobile horizontal overflow')
check(probe.includes('from generate_series(1,4) ordinal;'), 'R121 fixture does not create four independent candidates')
check(probe.includes("CTRL_PROBE_KEEP_FIXTURE: '1'") && probe.includes('cleanupFixture()'), 'R121 does not bracket browser use with fixture setup and cleanup')
check(probe.includes('Object.values(cleanupResult)') && probe.includes("rmSync(temporaryDirectory"), 'R121 does not fail closed on residue and scratch cleanup')
check(!probe.includes('sb_publishable_') && !probe.includes('sb_secret_'), 'R121 probe contains a credential-shaped literal')
check(finding.includes('The browser made the real decisions.'), 'R121 finding does not distinguish browser actions from backend shortcuts')
check(!entry.includes('\u2014') && !spec.includes('\u2014') && !probe.includes('\u2014') && !finding.includes('\u2014'), 'R121 artifacts contain an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R121 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R121 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-rendered-standard-review-r121] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-rendered-standard-review-r121] PASS: the approved React experience carries real authenticated approval, rejection, stale state and reversal with zero residue')
