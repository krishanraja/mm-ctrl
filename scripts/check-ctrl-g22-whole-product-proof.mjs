import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const canonical = JSON.parse(await readFile(resolve(root, 'project-documentation/ctrl-evolution/design/g22-whole-product-golden-path-fixture.json'), 'utf8'))
const publicFixture = JSON.parse(await readFile(resolve(root, 'public/g22-whole-product-golden-path-fixture.json'), 'utf8'))
const html = await readFile(resolve(root, 'public/g22-whole-product-golden-path-r1.html'), 'utf8')
const css = await readFile(resolve(root, 'public/g22-whole-product-golden-path-r1.css'), 'utf8')
const js = await readFile(resolve(root, 'public/g22-whole-product-golden-path-r1.js'), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(canonical.synthetic === true && publicFixture.synthetic === true, 'Both fixtures must remain synthetic')
assert(publicFixture.schemaVersion === canonical.schemaVersion, 'Public and canonical schema versions must match')
assert(publicFixture.case.decision.title === canonical.case.decision.title, 'Decision title drifted from canonical fixture')
assert(publicFixture.case.decision.operatingBudgetGbp === canonical.case.decision.operatingBudgetGbp, 'Budget drifted from canonical fixture')
assert(publicFixture.case.decision.affectedRoles === canonical.case.decision.affectedRoles, 'Affected-role count drifted from canonical fixture')
assert(publicFixture.question.prompt === canonical.question.prompt, 'Route-changing question drifted from canonical fixture')
assert(JSON.stringify(publicFixture.question.options) === JSON.stringify(canonical.question.options), 'Question options drifted from canonical fixture')
assert(JSON.stringify(publicFixture.routes) === JSON.stringify(canonical.routes), 'Decision routes drifted from canonical fixture')
assert(publicFixture.learning.proposal.text === canonical.learning.proposal.text, 'Learning proposal drifted from canonical fixture')
assert(publicFixture.learning.corrected.text === canonical.learning.corrected.text, 'Corrected learning drifted from canonical fixture')
assert(publicFixture.laterPreparation.before === canonical.laterPreparation.before, 'Earlier preparation drifted from canonical fixture')
assert(publicFixture.laterPreparation.after === canonical.laterPreparation.after, 'Later preparation drifted from canonical fixture')

const sourceIds = new Set(publicFixture.sources.map(source => source.id))
for (const id of ['SRC-COMPANY-PLAN-01', 'SRC-COMPANY-SCORECARD-01', 'SRC-CUSTOMER-01', 'SRC-MAYA-STANDARD-01', 'SRC-MAYA-DELEGATION-01', 'SRC-PUBLIC-COUNTER-01', 'SRC-LATER-LAUNCH-01']) {
  assert(sourceIds.has(id), `Missing public source ${id}`)
}

for (const value of [html, css, js]) assert(!value.includes('—'), 'Proof files may not contain em dashes')
assert(!html.match(/chat|assistant portrait|notification/i), 'Static shell must not introduce chat or notification chrome')
assert(!js.match(/>\s*Next(?:\s|<)/i), 'Golden path must not expose a Next action')
assert(js.includes("scenario === 'quiet'") && js.includes("scenario === 'sparse'") && js.includes("scenario === 'stale'"), 'Quiet, sparse and stale states are required')
assert(js.includes("state.learning = 'rejected'") && js.includes("state.learning = 'corrected'"), 'Correction and rejection paths are required')
assert(js.includes("download = 'maya-chen-living-brain-v1.3.synthetic.json'"), 'Portable local Brain copy is required')
assert(css.includes('@media (max-width: 620px)') && css.includes('@media (prefers-reduced-motion: reduce)'), 'Mobile and reduced-motion contracts are required')

console.log('ok: G22 whole-product proof fixture, causal states, portability and responsive contracts passed')
