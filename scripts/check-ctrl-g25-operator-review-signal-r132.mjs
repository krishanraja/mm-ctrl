import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const expected = new Map([
  ['src/features/operator-brain/OperatorReviewSignal.tsx', 'c8261def114c1014b2edc1bfdc9ea0e365a950ccb4061365ec6b1161864260b8'],
  ['src/features/operator-brain/operatorReviewFixture.ts', 'aa2d1eeeeaac5f51cce7cc1cf5538e5904e2f77ad199f1fa004cf59cfbf2ac03'],
  ['src/features/operator-brain/DecisionBenchPage.tsx', '56d4f61fbcb0efb67ea15486909d550af2c1e374d8bc7b8c9fefb5ebac53ff22'],
  ['src/features/operator-brain/DecisionBenchPage.css', '5d14a8463688d7720e8ca3dd8acf707823973adcd177d349155d10b43bef16c4'],
  ['project-documentation/ctrl-evolution/g25-operator-review-signal-r132-final-pack.md', '80c15f16b2e09c1c8de92f059e5d6553e731a2cea3fd783420c7ff9e7c6e207d'],
])

const failures = []
for (const [path, expectedHash] of expected) {
  const hash = createHash('sha256').update(readFileSync(path)).digest('hex')
  if (hash !== expectedHash) failures.push(`${path}: expected ${expectedHash}, found ${hash}`)
}

const signal = readFileSync('src/features/operator-brain/OperatorReviewSignal.tsx', 'utf8')
for (const required of [
  'if (!queue.available) return null',
  'await navigator.clipboard.writeText(item.question)',
  "notify('Copy was blocked. The question is selected.')",
  'Maya decides.',
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

console.log(`[g25-operator-review-signal-r132] PASS: ${expected.size} frozen files; truthful copy, centred action and closed customer authority`)

