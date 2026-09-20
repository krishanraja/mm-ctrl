import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const unchanged = new Map([
  ['src/features/operator-brain/operatorReviewFixture.ts', 'aa2d1eeeeaac5f51cce7cc1cf5538e5904e2f77ad199f1fa004cf59cfbf2ac03'],
  ['src/features/operator-brain/DecisionBenchPage.css', '5d14a8463688d7720e8ca3dd8acf707823973adcd177d349155d10b43bef16c4'],
  ['project-documentation/ctrl-evolution/g25-operator-review-signal-r132-final-pack.md', '80c15f16b2e09c1c8de92f059e5d6553e731a2cea3fd783420c7ff9e7c6e207d'],
])

const failures = []
for (const [path, expectedHash] of unchanged) {
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex')
  if (hash !== expectedHash) failures.push(`${path}: expected ${expectedHash}, found ${hash}`)
}

const successor = JSON.parse(readFileSync('project-documentation/ctrl-evolution/g25-operator-review-runtime-gateway-r133.json', 'utf8'))
const renderedSuccessor = JSON.parse(readFileSync('project-documentation/ctrl-evolution/g25-rendered-operator-review-r138.json', 'utf8'))
const historical = new Map([
  ['operator_signal_sha256', 'c8261def114c1014b2edc1bfdc9ea0e365a950ccb4061365ec6b1161864260b8'],
  ['decision_bench_sha256', '56d4f61fbcb0efb67ea15486909d550af2c1e374d8bc7b8c9fefb5ebac53ff22'],
])
for (const [field, expectedHash] of historical) {
  if (successor.r132_history?.[field] !== expectedHash) failures.push(`R132 historical hash drift: ${field}`)
}
if (successor.r132_history?.rewritten !== false) failures.push('R132 history was rewritten')

for (const [pathField, hashField] of [['signal', 'signal_sha256']]) {
  const path = successor.artifacts?.[pathField]
  const expectedHash = successor.artifacts?.[hashField]
  if (!path || !expectedHash) {
    failures.push(`R133 successor is missing ${pathField}`)
    continue
  }
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex')
  if (hash !== expectedHash) failures.push(`R133 successor hash drift: ${pathField}`)
}

const currentCaller = renderedSuccessor.artifacts?.decision_bench
const currentCallerHash = renderedSuccessor.artifacts?.decision_bench_sha256
if (!currentCaller || !currentCallerHash) failures.push('R138 successor is missing the current Decision Bench')
else if (createHash('sha256').update(readFileSync(currentCaller)).digest('hex') !== currentCallerHash) {
  failures.push('R138 successor hash drift: decision_bench')
}

const signal = readFileSync('src/features/operator-brain/OperatorReviewSignal.tsx', 'utf8')
for (const required of [
  'if (!queue.available) return null',
  'await navigator.clipboard.writeText(item.question)',
  "notify('Copy was blocked. The question is selected.')",
  '<span>{leaderLabel} decides.</span>',
  '`1 question for ${leaderLabel}`',
  'justify-content: center',
]) {
  const source = required === 'justify-content: center'
    ? readFileSync('src/features/operator-brain/DecisionBenchPage.css', 'utf8')
    : signal
  if (!source.includes(required)) failures.push(`missing required boundary: ${required}`)
}

const receipt = JSON.parse(readFileSync('project-documentation/ctrl-evolution/runs/g24-experience-r132-operator-queue/receipt.json', 'utf8'))
if (receipt.status !== 'passed_for_founder_review') failures.push('experience receipt is not passed_for_founder_review')
if (receipt.customer_surface_changed !== false) failures.push('customer surface boundary widened')
if (receipt.production_writes !== 0) failures.push('production write boundary widened')

if (failures.length) {
  console.error(`[g25-operator-review-signal-r132] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[g25-operator-review-signal-r132] PASS: ${unchanged.size} unchanged files, the history-preserving R133 signal and current R138 caller; truthful copy, centred action and closed customer authority`)
