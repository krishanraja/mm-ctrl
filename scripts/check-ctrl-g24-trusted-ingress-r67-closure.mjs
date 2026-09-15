import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex')
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }

const R66_COMMIT = '224f66520b93f0bce4a5ef61ddad22a12fd4c462'
const R66_TREE = 'a5517b29e7d33f3b6d38be2d6c02cd96c1fb585a'
const R66_MACHINE_SHA256 = 'b930cff4b346aad614cc0a576ab7160a7846a5f1e9f5cb27f864d286fd32a920'
const R66_BLOBS = {
  'docs/current/design-state.md': '3372b4bebbd060b9317b340073fe25b06e7fdd49',
  'package.json': '081e8aebe22d08f0867caedc2d6ea52c6960297b',
  'project-documentation/ctrl-evolution/README.md': 'a13c256dc2791bb4fe3ca32abe5405a5cc6ac27f',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json': '3cfdf96182f794b5221663170413315b7630219f',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.md': 'eb5b875222710260ef886ca669c626bb2857bb70',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-qa-record.md': 'da4f476f1e6c7de410a91bff0a032b5d38a3eda3',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md': '5e4a0647a1909de09826d6b24ce76d32ee447311',
  'scripts/check-ctrl-g24-founder-lock.mjs': '73de8dedf78b3c0a4bef2240ae86c1924db630cd',
  'scripts/check-ctrl-g24-trusted-ingress-r66.mjs': '6bc7f0bbc16d00676b9e8c97900397567127e034',
  'scripts/materialize-ctrl-g24-trusted-ingress-r66.mjs': 'be4fdc2ea288747f242749ee2e0b0b678b0bfec5',
}
const ALLOWED_R67_PATHS = new Set([
  'docs/current/design-state.md',
  'package.json',
  'project-documentation/ctrl-evolution/README.md',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.json',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.md',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md',
  'scripts/check-ctrl-g24-founder-lock.mjs',
  'scripts/check-ctrl-g24-trusted-ingress-r67-closure.mjs',
])

check('frozen R66 commit exists', git(['cat-file', '-t', R66_COMMIT]) === 'commit')
check('frozen R66 tree exact', git(['rev-parse', `${R66_COMMIT}^{tree}`]) === R66_TREE)
for (const [path, blob] of Object.entries(R66_BLOBS)) {
  check(`frozen R66 blob exact: ${path}`, git(['rev-parse', `${R66_COMMIT}:${path}`]) === blob)
}
const frozenMachine = execFileSync('git', ['show', `${R66_COMMIT}:project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json`], { cwd: root, maxBuffer: 256 * 1024 * 1024 })
check('frozen R66 machine SHA-256 exact', sha256Bytes(frozenMachine) === R66_MACHINE_SHA256)
for (const path of [
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.md',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-qa-record.md',
  'scripts/check-ctrl-g24-trusted-ingress-r66.mjs',
  'scripts/materialize-ctrl-g24-trusted-ingress-r66.mjs',
]) {
  const frozen = execFileSync('git', ['show', `${R66_COMMIT}:${path}`], { cwd: root, maxBuffer: 256 * 1024 * 1024 })
  const current = readFileSync(join(root, path))
  check(`R66 artifact remains byte-identical: ${path}`, Buffer.compare(frozen, current) === 0)
}

const receiptPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.json'
const receipt = JSON.parse(read(receiptPath))
check('closed receipt schema', receipt.schema_version === 'ctrl.g24.trusted-ingress-r66-acceptance-receipt.r67.v1')
check('closure-only kind', receipt.receipt_kind === 'adjudication_closure_only')
check('exact round and date', receipt.round === 'R67' && receipt.recorded_on === '2026-09-15')
check('accepted status exact', receipt.accepted_contract?.status === 'accepted_for_metadata-only architecture scope')
check('accepted commit exact', receipt.accepted_contract?.commit === R66_COMMIT)
check('accepted tree exact', receipt.accepted_contract?.tree === R66_TREE)
check('accepted machine SHA exact', receipt.accepted_contract?.machine_sha256 === R66_MACHINE_SHA256)
check('accepted blobs exact', JSON.stringify(receipt.accepted_contract?.blobs) === JSON.stringify(R66_BLOBS))

const EXPECTED_VERDICTS = [
  {
    reviewer: 'g24r5_adjudicator', verdict: 'PASS', delivery: 'conversation-delivered independent verdict',
    cryptographic_signature: 'not claimed', separate_verdict_artifact: 'not created',
    basis: ['verified 20 exact operation queries and proofs', 'verified the full three-key binding', "verified each operation's own export and proof compatibility", 'verified snapshot, member and set-seal lineage', 'verified lifecycle proof binding', 'verified the fail-closed executable boundary', 'verified the stated outside scope'],
  },
  {
    reviewer: 'g24r5_defense', verdict: 'PASS', delivery: 'conversation-delivered independent verdict',
    cryptographic_signature: 'not claimed', separate_verdict_artifact: 'not created',
    basis: ['verified the exact frozen archive', 'verified the same 20 of 20 derivation', 'verified query and proof fingerprints', 'verified coherent lineage', 'verified focused checks, founder lock, kernel and clean status'],
  },
]
check('two exact independent PASS verdicts', JSON.stringify(receipt.independent_verdicts) === JSON.stringify(EXPECTED_VERDICTS))

const EXPECTED_OUTSIDE = ['live registry completeness', 'serializable runtime selection', 'executable adapter/module authority and behavior', 'restart/runtime/DB integration', 'UI/product behavior', 'deployment/external action']
const EXPECTED_NOT_AUTHORIZED = ['runtime changes', 'deployment changes', 'database changes', 'UI changes', 'external actions']
const EXPECTED_FRONTIER = ['locate or define the actual evaluator module contract and founder-locked source or bundle', 'build an isolated deterministic harness', 'define and verify the registry/live adapter', 'stage integration behind separate authorization and verification']
check('outside scope exact', JSON.stringify(receipt.unproved_outside_scope) === JSON.stringify(EXPECTED_OUTSIDE))
check('acceptance authority exact', receipt.acceptance_authority === 'authorizes only moving to a separate executable-adapter implementation gate')
check('not-authorized boundary exact', JSON.stringify(receipt.not_authorized) === JSON.stringify(EXPECTED_NOT_AUTHORIZED))
check('next frontier is brief only', receipt.next_frontier?.status === 'brief only; no implementation in R67')
check('next frontier exact', JSON.stringify(receipt.next_frontier?.ordered_gates) === JSON.stringify(EXPECTED_FRONTIER))
check('no contract semantics change', receipt.contract_semantics_change === 'none')
check('no runtime or external action', receipt.runtime_database_ui_deployment_or_external_action === 'none')

const human = read('project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.md')
const ledger = read('project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md')
const state = read('project-documentation/ctrl-evolution/README.md')
const design = read('docs/current/design-state.md')
for (const text of [human, ledger]) {
  check('human record states conversation delivery', text.includes('conversation-delivered verdicts') || text.includes('delivered through independent reviewer messages'))
  check('human record rejects signature claim', text.includes('not cryptographic signatures'))
  check('human record rejects verdict artifact claim', text.includes('No separate frozen verdict artifact'))
  check('human record carries exact accepted status', text.includes('accepted_for_metadata-only architecture scope'))
  check('human record carries every outside-scope item', EXPECTED_OUTSIDE.every(item => text.toLowerCase().includes(item.toLowerCase())))
}
check('canonical state routes to R67 receipt', state.includes('[R67 acceptance receipt](g24-trusted-ingress-r66-acceptance-receipt-r67.md)'))
check('canonical next action is separate adapter gate', state.includes('**CURRENT_NEXT_ACTION:** Define and independently attack a separate executable-adapter implementation gate'))
check('design state routes accepted R66 boundary', design.includes('accepted R66 metadata-only architecture'))

const statusEntries = execFileSync('git', ['status', '--porcelain=v1', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
const statusPaths = statusEntries.map(entry => entry.slice(3).replaceAll('\\', '/'))
const head = git(['rev-parse', 'HEAD'])
let changedPaths
if (head === R66_COMMIT) {
  changedPaths = statusPaths
} else {
  check('R67 closure commit directly descends from R66', git(['rev-parse', 'HEAD^']) === R66_COMMIT)
  changedPaths = git(['diff', '--name-only', `${R66_COMMIT}..HEAD`]).split(/\r?\n/).filter(Boolean)
  check('post-commit worktree clean', statusPaths.length === 0)
}
const changedSet = new Set(changedPaths)
check('R67 changed-path set exact', changedSet.size === ALLOWED_R67_PATHS.size && [...ALLOWED_R67_PATHS].every(path => changedSet.has(path)))
check('no contract or runtime file changed', changedPaths.every(path => ALLOWED_R67_PATHS.has(path)))

const attacks = [
  ['missing adjudicator verdict', r => { r.independent_verdicts.shift() }],
  ['wrong verdict', r => { r.independent_verdicts[0].verdict = 'VETO' }],
  ['invented signature', r => { r.independent_verdicts[0].cryptographic_signature = 'signed' }],
  ['invented verdict artifact', r => { r.independent_verdicts[1].separate_verdict_artifact = 'artifact.json' }],
  ['dropped outside-scope item', r => { r.unproved_outside_scope.pop() }],
  ['widened acceptance', r => { r.acceptance_authority = 'authorizes runtime integration' }],
  ['implemented frontier', r => { r.next_frontier.status = 'implemented in R67' }],
]
const validatesReceiptBoundary = value =>
  JSON.stringify(value.independent_verdicts) === JSON.stringify(EXPECTED_VERDICTS) &&
  JSON.stringify(value.unproved_outside_scope) === JSON.stringify(EXPECTED_OUTSIDE) &&
  value.acceptance_authority === 'authorizes only moving to a separate executable-adapter implementation gate' &&
  value.next_frontier?.status === 'brief only; no implementation in R67'
for (const [name, mutate] of attacks) {
  const candidate = structuredClone(receipt)
  mutate(candidate)
  check(`attack rejected: ${name}`, !validatesReceiptBoundary(candidate))
}

if (failures.length) {
  console.error(`G24 trusted ingress R67 closure failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: R67 closure receipt; frozen R66 ${R66_COMMIT} / ${R66_TREE}; 10/10 blobs and machine SHA exact; 2/2 independent PASS entries; 6 outside-scope clauses; ${attacks.length} closure attacks; no contract/runtime change`)
