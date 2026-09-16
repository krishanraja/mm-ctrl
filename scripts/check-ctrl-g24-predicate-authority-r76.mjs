import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }

const R75_COMMIT = 'e6494cda6fba4ce8209f99f1611ba3803de34370'
const R75_TREE = '3e53f7ca69a0f01192f3e255471a17b81f05f313'
const R75_PARENT = '37d0b7602265d52306b352cdab2a44d5642c0518'
const R76_COMMIT = 'e79e076c7bdd86b95748672fde6f9b0636e69618'
const R76_TREE = 'd78ace9b145731d8cf7a0e59dd2d1234604d0b08'
const R76_JSON = 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-ready-receipt-r76.json'
const R76_MD = 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-ready-receipt-r76.md'
const R76_BLOBS = {
  'docs/current/design-state.md': '358ba3910184cfd5e36572be97dc459724004bda',
  'package.json': '930de1e56991d43dc9a994482174fabb30d06401',
  'project-documentation/ctrl-evolution/README.md': '10c0ec5b1a206c16c16fb751b844ece4a1bb08a9',
  [R76_JSON]: '00a485fe6de9cb70e05ddf6a08096726bbd30b82',
  [R76_MD]: '102c6f9496e87c9559a259773b00505f8f6dc492',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md': '47848a0d2f5db3bb5c95913dbb910265ed47a3ca',
  'scripts/check-ctrl-g24-founder-lock.mjs': '597e5e34c60e4bc48c53e8dc52278a8ac590d131',
  'scripts/check-ctrl-g24-predicate-authority-r76.mjs': 'd7d5d0a50146e78af3a6c7543b3a16a998d8c71b',
}

check('frozen R75 exists', git(['cat-file', '-t', R75_COMMIT]) === 'commit')
check('frozen R75 tree exact', git(['rev-parse', `${R75_COMMIT}^{tree}`]) === R75_TREE)
check('frozen R75 parent exact', git(['rev-parse', `${R75_COMMIT}^`]) === R75_PARENT)
check('frozen R76 exists', git(['cat-file', '-t', R76_COMMIT]) === 'commit')
check('frozen R76 tree exact', git(['rev-parse', `${R76_COMMIT}^{tree}`]) === R76_TREE)
check('frozen R76 directly descends from R75', git(['rev-parse', `${R76_COMMIT}^`]) === R75_COMMIT)
for (const [path, blob] of Object.entries(R76_BLOBS)) {
  check(`frozen R76 blob exact: ${path}`, git(['rev-parse', `${R76_COMMIT}:${path}`]) === blob)
}

const frozenJsonBytes = execFileSync('git', ['show', `${R76_COMMIT}:${R76_JSON}`], { cwd: root })
const frozenMdBytes = execFileSync('git', ['show', `${R76_COMMIT}:${R76_MD}`], { cwd: root })
check('frozen R76 JSON SHA exact', sha256(frozenJsonBytes) === '3a1de17485bde8d28aaef717191c143e852ed4427c05372c569f7b8fdffe644e')
check('frozen R76 Markdown SHA exact', sha256(frozenMdBytes) === 'cd7d4a603cc453babf2a08828a63c23d77bc0fe1b066742c807fd099aa09722b')
check('current R76 JSON remains byte exact', Buffer.compare(frozenJsonBytes, readFileSync(join(root, R76_JSON))) === 0)
check('current R76 Markdown remains byte exact', Buffer.compare(frozenMdBytes, readFileSync(join(root, R76_MD))) === 0)

let r76IsAncestor = true
try {
  execFileSync('git', ['merge-base', '--is-ancestor', R76_COMMIT, 'HEAD'], { cwd: root })
} catch {
  r76IsAncestor = false
}
check('current branch descends from frozen R76', r76IsAncestor)

const receipt = JSON.parse(frozenJsonBytes.toString('utf8'))
const roles = ['Human Agency', 'Human Comprehension and Access', 'Consequential Usefulness', 'Epistemic Integrity', 'Living Brain Integrity', 'Subject, Audience and Lifecycle Safety', 'Implementation Reality']
check('receipt schema exact', receipt.schema_version === 'ctrl.g24.predicate-authority-r75-founder-ready-receipt.r76.v1')
check('receipt remains historical pending state', receipt.status === 'founder_ready_pending_explicit_founder_choice')
check('candidate exact', receipt.candidate?.commit === R75_COMMIT && receipt.candidate?.tree === R75_TREE && receipt.candidate?.parent === R75_PARENT)
check('seven exact PASS verdicts', receipt.role_verdicts?.length === roles.length && roles.every((role, index) => receipt.role_verdicts[index]?.role === role && receipt.role_verdicts[index]?.verdict === 'PASS'))
check('no signature overclaim', receipt.cryptographic_signatures === 'not claimed' && receipt.separate_signed_verdict_artifact === 'not claimed')
check('decision semantics unchanged', receipt.decision_semantics_source === 'R74' && receipt.decision_semantics_change_in_r75 === 'none')
check('R76 grants no implementation', receipt.not_authorized?.includes('machine-contract implementation') && receipt.not_authorized?.includes('external action'))

if (failures.length) {
  console.error(`G24 R76 frozen closure failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: frozen R76 ${R76_COMMIT} / ${R76_TREE}; frozen R75 ${R75_COMMIT} / ${R75_TREE}; 8/8 R76 blobs exact; 7/7 role verdicts PASS; historical pending state preserved`)
