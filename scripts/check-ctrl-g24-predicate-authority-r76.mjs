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
const R75_PARENT = '37d0b7602265d52306b352cdab2a44d5642c0518'
const R75_DOC = 'project-documentation/ctrl-evolution/g24-predicate-authority-founder-decision-r75.md'
const R75_DOC_BLOB = 'ee48e4b29d787ef3bbb17c9bf2e558cf7c2aebc6'
const R75_DOC_SHA256 = '83d2bc6fd6c1042e1fff83f29904abcc7d74bc130f388aa36933e19e40293410'
const RECEIPT_JSON = 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-ready-receipt-r76.json'
const RECEIPT_MD = 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-ready-receipt-r76.md'
const R75_BLOBS = {
  'docs/current/design-state.md': 'e71a247bb4f0dc6f5f0e919e1a63aa45640e6063',
  'project-documentation/ctrl-evolution/README.md': '329f4a63fd853b7e670f8c853b57d79fc1c774b0',
  [R75_DOC]: R75_DOC_BLOB,
  'project-documentation/ctrl-evolution/g24-predicate-authority-r74-panel-verdict.md': 'cac168a3021878f9027e9734d7b765c716f80243',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md': '63914b3cd0e88a1c83f9d997a8a1a9ad76db4bd9',
  'scripts/check-ctrl-g24-founder-lock.mjs': '43cbd05e04b4faecb85210ed8baa35dc3f740730',
}

check('frozen R75 exists', git(['cat-file', '-t', R75_COMMIT]) === 'commit')
check('frozen R75 tree exact', git(['rev-parse', `${R75_COMMIT}^{tree}`]) === R75_TREE)
check('frozen R75 parent exact', git(['rev-parse', `${R75_COMMIT}^`]) === R75_PARENT)
for (const [path, blob] of Object.entries(R75_BLOBS)) {
  check(`frozen R75 blob exact: ${path}`, git(['rev-parse', `${R75_COMMIT}:${path}`]) === blob)
}

const frozenDecision = execFileSync('git', ['show', `${R75_COMMIT}:${R75_DOC}`], { cwd: root })
check('frozen R75 decision SHA exact', sha256(frozenDecision) === R75_DOC_SHA256)
check('current R75 decision remains exact', Buffer.compare(frozenDecision, readFileSync(join(root, R75_DOC))) === 0)

let r75IsAncestor = true
try {
  execFileSync('git', ['merge-base', '--is-ancestor', R75_COMMIT, 'HEAD'], { cwd: root })
} catch {
  r75IsAncestor = false
}
check('current branch descends from frozen R75', r75IsAncestor)

const receipt = JSON.parse(read(RECEIPT_JSON))
check('receipt schema exact', receipt.schema_version === 'ctrl.g24.predicate-authority-r75-founder-ready-receipt.r76.v1')
check('receipt closure only', receipt.receipt_kind === 'founder_ready_review_closure_only' && receipt.round === 'R76' && receipt.recorded_on === '2026-09-15')
check('founder-ready status exact', receipt.status === 'founder_ready_pending_explicit_founder_choice')
check('candidate identity exact', receipt.candidate?.round === 'R75' && receipt.candidate?.commit === R75_COMMIT && receipt.candidate?.tree === R75_TREE && receipt.candidate?.parent === R75_PARENT)
check('candidate document exact', receipt.candidate?.decision_document === R75_DOC && receipt.candidate?.decision_document_blob === R75_DOC_BLOB && receipt.candidate?.decision_document_sha256 === R75_DOC_SHA256)
check('candidate blobs exact', JSON.stringify(receipt.candidate?.blobs) === JSON.stringify(R75_BLOBS))

const roles = [
  'Human Agency',
  'Human Comprehension and Access',
  'Consequential Usefulness',
  'Epistemic Integrity',
  'Living Brain Integrity',
  'Subject, Audience and Lifecycle Safety',
  'Implementation Reality',
]
check('seven exact PASS verdicts', receipt.role_verdicts?.length === roles.length && roles.every((role, index) => receipt.role_verdicts[index]?.role === role && receipt.role_verdicts[index]?.verdict === 'PASS'))
check('review delivery honest', receipt.review_delivery === 'conversation-delivered independent reviewer messages')
check('no signature overclaim', receipt.cryptographic_signatures === 'not claimed' && receipt.separate_signed_verdict_artifact === 'not claimed')
check('decision core unchanged', receipt.decision_semantics_source === 'R74' && receipt.decision_semantics_change_in_r75 === 'none')
check('founder choice remains pending', receipt.founder_choice?.status === 'pending_explicit_founder_choice')
check('approval scope narrow', receipt.founder_choice?.approval_authority === 'authorizes only a separate local machine-contract design and verification gate')

const notAuthorized = [
  'machine-contract implementation',
  'result-producing evaluation',
  'runtime integration',
  'registry wiring',
  'database or schema change',
  'customer UI',
  'deployment',
  'merge',
  'release',
  'external action',
]
check('closed scope exact', JSON.stringify(receipt.not_authorized) === JSON.stringify(notAuthorized))

const human = read(RECEIPT_MD)
const state = read('project-documentation/ctrl-evolution/README.md')
const design = read('docs/current/design-state.md')
const ledger = read('project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md')
for (const [name, text] of [['human receipt', human], ['canonical state', state], ['design route', design], ['review ledger', ledger]]) {
  check(`${name} shows founder-ready state`, text.includes('founder-ready') || text.includes('founder_ready'))
  check(`${name} keeps founder choice pending`, text.includes('founder') && (text.includes('approve or reject') || text.includes('pending')))
}
check('canonical next action exact', state.includes('**CURRENT_NEXT_ACTION:** Founder approve or reject the [R75 predicate-authority decision]'))
check('R76 receipt routed', state.includes('[R76 founder-ready receipt](g24-predicate-authority-r75-founder-ready-receipt-r76.md)'))
check('design keeps machine contract closed', design.includes('No machine contract') && design.includes('explicit founder approval'))

const attacks = [
  ['removed role', value => value.role_verdicts.pop()],
  ['changed verdict', value => { value.role_verdicts[0].verdict = 'VETO' }],
  ['invented signature', value => { value.cryptographic_signatures = 'signed' }],
  ['claimed decision change', value => { value.decision_semantics_change_in_r75 = 'changed' }],
  ['claimed founder approval', value => { value.founder_choice.status = 'approved' }],
  ['widened approval', value => { value.founder_choice.approval_authority = 'authorizes implementation' }],
  ['dropped closed scope', value => value.not_authorized.pop()],
]
const validatesBoundary = value => value.status === 'founder_ready_pending_explicit_founder_choice' && value.role_verdicts.length === roles.length && roles.every((role, index) => value.role_verdicts[index]?.role === role && value.role_verdicts[index]?.verdict === 'PASS') && value.cryptographic_signatures === 'not claimed' && value.decision_semantics_change_in_r75 === 'none' && value.founder_choice.status === 'pending_explicit_founder_choice' && value.founder_choice.approval_authority === 'authorizes only a separate local machine-contract design and verification gate' && JSON.stringify(value.not_authorized) === JSON.stringify(notAuthorized)
for (const [name, mutate] of attacks) {
  const candidate = structuredClone(receipt)
  mutate(candidate)
  check(`attack rejected: ${name}`, !validatesBoundary(candidate))
}

if (failures.length) {
  console.error(`G24 R76 founder-ready closure failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: frozen R75 ${R75_COMMIT} / ${R75_TREE}; 6/6 candidate blobs exact; 7/7 role verdicts PASS; founder choice pending; ${attacks.length} closure attacks`)
