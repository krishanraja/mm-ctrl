import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const failures = []
const requireText = (body, needle, label) => {
  if (!body.includes(needle)) failures.push(`${label}: missing ${needle}`)
}

const contract = JSON.parse(read('project-documentation/ctrl-evolution/g20-mobile-decision-r136-implementation-contract.json'))
const approvedArtifact = read(contract.approved_artifact.path)
const approvedHash = createHash('sha256').update(approvedArtifact).digest('hex')

if (contract.status !== 'founder_locked_contract') failures.push('contract: founder lock is missing')
if (contract.scope.maximum_width_px !== 620) failures.push('contract: phone boundary is not 620px')
if (contract.scope.write_policy !== 'session_only_no_database_write') failures.push('contract: write boundary changed')
if (approvedHash !== contract.approved_artifact.sha256) failures.push('artifact: approved mock hash changed')

const expectedInvariants = [
  'DESKTOP_DECISION_TABLE_UNCHANGED',
  'ONE_ACTIVE_TURN_ON_PHONE',
  'ANSWER_DOES_NOT_RECORD_HUMAN_CALL',
  'PREVIOUS_VIEW_REMAINS_DURING_RECALCULATION',
  'BASIS_IS_SEPARATE_FULL_SCREEN_LAYER',
  'NO_DATABASE_WRITE',
]
for (const invariant of expectedInvariants) {
  if (!contract.invariants.includes(invariant)) failures.push(`contract: missing invariant ${invariant}`)
}

const component = read('src/features/operator-brain/MobileDecisionSession.tsx')
const model = read('src/features/operator-brain/mobileDecisionSessionModel.ts')
const css = read('src/features/operator-brain/MobileDecisionSession.css')
const page = read('src/features/operator-brain/DecisionBenchPage.tsx')
const e2e = read('src/__tests__/e2e/g20-decision-table-react-r4.spec.ts')

for (const [needle, label] of [
  ['data-testid="mobile-decision-session"', 'component'],
  ['Inspect basis', 'component'],
  ['Record my call', 'component'],
  ['Saved in this session', 'component'],
  ['has not written to a customer Brain or database', 'component'],
  ['onAnswer(mobileAnswerInput', 'component'],
  ['onRouteChange(routeId)', 'component'],
  ['speechRecognitionConstructor()', 'component'],
  ['mobileOutcomeCopy(projection.dataState, answer.outcome)', 'component'],
  ['projection.basisTitle', 'component'],
  ['{projection.sourceCount} linked sources', 'component'],
]) requireText(component, needle, label)

for (const [needle, label] of [
  ['fixture.current_read.source_refs', 'model'],
  ['fixture.current_read.counter_source_refs', 'model'],
  ["'sparse'", 'model'],
  ["'stale'", 'model'],
  ["'conflicted'", 'model'],
  ["'loading'", 'model'],
  ["'error'", 'model'],
  ["title: 'Evidence target set'", 'model'],
  ["title: 'Refresh target set'", 'model'],
  ["title: 'Conflict to resolve'", 'model'],
]) requireText(model, needle, label)

for (const [needle, label] of [
  ['@media (max-width: 620px)', 'styles'],
  ['.dt-shell.dt-is-decision > .dt-desktop-surface', 'styles'],
  ['min-height: 44px', 'styles'],
  ['inset: 0 !important', 'styles'],
  ['overflow-y: auto !important', 'styles'],
  ['prefers-reduced-motion', 'styles'],
]) requireText(css, needle, label)

for (const [needle, label] of [
  ['<MobileDecisionSession', 'page'],
  ['<DecisionViewPanel', 'page'],
  ['buildClaudeBrief(fixture, briefInputs, killCondition)', 'page'],
]) requireText(page, needle, label)

for (const [needle, label] of [
  ['{ width: 320, height: 568 }', 'e2e'],
  ['mobile-decision-basis', 'e2e'],
  ['answers, recalculates and keeps the human call separate', 'e2e'],
  ['uses honest mobile projections', 'e2e'],
  ['uses captured browser speech as an answer', 'e2e'],
]) requireText(e2e, needle, label)

const baselineDesktopCss = execFileSync('git', ['show', `${contract.approved_artifact.commit}:src/features/operator-brain/DecisionBenchPage.css`], { cwd: root, encoding: 'utf8' })
if (baselineDesktopCss !== read('src/features/operator-brain/DecisionBenchPage.css')) failures.push('desktop: DecisionBenchPage.css changed from the locked baseline')

for (const [path, body] of [
  ['MobileDecisionSession.tsx', component],
  ['mobileDecisionSessionModel.ts', model],
  ['MobileDecisionSession.css', css],
]) {
  if (body.includes('—')) failures.push(`${path}: contains a prohibited em dash`)
}

if (failures.length) {
  console.error(`[g20-mobile-decision-r136] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g20-mobile-decision-r136] PASS: founder lock, phone sequence, honest states, basis layer and desktop preservation contract hold')
