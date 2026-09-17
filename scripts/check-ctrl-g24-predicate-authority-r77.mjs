import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }

const R75_COMMIT = 'e6494cda6fba4ce8209f99f1611ba3803de34370'
const R75_TREE = '3e53f7ca69a0f01192f3e255471a17b81f05f313'
const R75_DOC = 'project-documentation/ctrl-evolution/g24-predicate-authority-founder-decision-r75.md'
const R75_SHA = '83d2bc6fd6c1042e1fff83f29904abcc7d74bc130f388aa36933e19e40293410'
const R76_COMMIT = 'e79e076c7bdd86b95748672fde6f9b0636e69618'
const LOCK_JSON = 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-lock-r77.json'
const LOCK_MD = 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-lock-r77.md'

check('R75 commit and tree exact', git(['rev-parse', `${R75_COMMIT}^{tree}`]) === R75_TREE)
check('R75 document SHA exact', sha256(execFileSync('git', ['show', `${R75_COMMIT}:${R75_DOC}`], { cwd: root })) === R75_SHA)
check('R76 is ancestor of current HEAD', (() => {
  try { execFileSync('git', ['merge-base', '--is-ancestor', R76_COMMIT, 'HEAD'], { cwd: root }); return true } catch { return false }
})())

const record = JSON.parse(read(LOCK_JSON))
const decision = record.decision_record
check('R77 schema exact', record.schema_version === 'ctrl.g24.predicate-authority-r75-founder-lock.r77.v1' && record.record_kind === 'founder_lock_and_project_decision_record')
check('decision identity exact', decision?.decision_id === 'DEC-20260916-g24-predicate-authority-r75' && decision?.status === 'active' && decision?.decider === 'Krish Raja')
check('decision time exact', decision?.decided_at === '2026-09-16T08:40:50+01:00' && decision?.recorded_at === decision?.decided_at)
check('exact founder call recorded', record.exact_final_call === 'approve r75' && decision?.source_ref?.includes('exact user final call: approve r75'))
check('candidate exact', record.locked_candidate?.commit === R75_COMMIT && record.locked_candidate?.tree === R75_TREE && record.locked_candidate?.document_sha256 === R75_SHA && record.locked_candidate?.clearance_receipt_commit === R76_COMMIT)
check('required schema fields present', ['title', 'decision', 'accountable_owner', 'scope', 'affected_entities', 'rationale', 'alternatives', 'dissent', 'tradeoffs', 'evidence_refs', 'assumptions', 'revisit', 'authority_granted', 'source_ref', 'supersedes', 'superseded_by', 'outcome', 'events', 'last_verified_at'].every(key => Object.hasOwn(decision, key)))
check('observable revisit trigger', decision?.revisit?.trigger?.includes('reproducible machine-contract counterexample') && decision?.revisit?.signal_source && decision?.revisit?.action_when_fired)
check('local authority exact', record.authority_granted?.includes('local modular machine-contract design') && record.authority_granted?.includes('independent seven-role review'))
for (const closed of ['semantic evaluator implementation', 'result-producing success branch', 'runtime integration', 'database or schema change', 'customer UI', 'merge', 'deployment', 'release', 'cross-venture Supabase decision-ledger write']) {
  check(`closed authority preserved: ${closed}`, record.not_authorized?.includes(closed))
}
check('external ledger honestly unwritten', record.cross_venture_decision_ledger?.status === 'STORE_UNAVAILABLE_EXTERNAL_WRITE_NOT_AUTHORIZED')

const human = read(LOCK_MD)
const state = read('project-documentation/ctrl-evolution/README.md')
const design = read('docs/current/design-state.md')
const ledger = read('project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md')
check('human record exact call and boundary', human.includes('Exact final call: `approve r75`') && human.includes('semantic evaluator implementation') && human.includes('cross-venture Supabase decision ledger'))
check('canonical state routes R77', state.includes('[R77 founder lock](g24-predicate-authority-r75-founder-lock-r77.md)'))
const currentNextAction = state.match(/^\*\*CURRENT_NEXT_ACTION:\*\* (.+)$/m)?.[1] ?? ''
const closedNextActionBoundaries = [
  'No linked or production database',
  'migration creation or execution',
  'result-producing runtime',
  'customer-facing UI',
  'deployment',
  'merge',
  'release',
  'external action',
  'legacy retirement is authorized.',
]
check('canonical next action remains inside approved local contract gate',
  currentNextAction.length > 0
    && closedNextActionBoundaries.every(boundary => currentNextAction.includes(boundary)))
check('design route agrees', design.includes('complete and verify the G25 legacy capability preservation register') && design.includes('No result-producing runtime integration, registry wiring, database, customer-facing UI, deployment, merge, release, external action or legacy retirement is authorized.'))
check('ledger preserves exact approval', ledger.includes('**Exact founder call:** `approve r75`') && ledger.includes('**Decision ID:** `DEC-20260916-g24-predicate-authority-r75`'))

const attacks = [
  ['changed call', value => { value.exact_final_call = 'approve' }],
  ['widened authority', value => value.authority_granted.push('runtime integration')],
  ['dropped closed action', value => value.not_authorized.pop()],
  ['invented external write', value => { value.cross_venture_decision_ledger.status = 'written' }],
  ['changed decider', value => { value.decision_record.decider = 'model' }],
]
const validatesBoundary = value => value.exact_final_call === 'approve r75' && value.authority_granted.length === 5 && !value.authority_granted.includes('runtime integration') && value.not_authorized.length === 14 && value.cross_venture_decision_ledger.status === 'STORE_UNAVAILABLE_EXTERNAL_WRITE_NOT_AUTHORIZED' && value.decision_record.decider === 'Krish Raja'
for (const [name, mutate] of attacks) {
  const candidate = structuredClone(record)
  mutate(candidate)
  check(`attack rejected: ${name}`, !validatesBoundary(candidate))
}

if (failures.length) {
  console.error(`G24 R77 founder lock failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: R75 founder-approved by exact call; R77 decision ${decision.decision_id}; local machine-contract gate only; ${attacks.length} authority attacks`)
