import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha256Bytes = bytes => createHash('sha256').update(bytes).digest('hex')
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }

const R70_COMMIT = 'f4c46b1c345ad05f5f997e905b5b0204400ae88f'
const R70_TREE = 'fb4809821a9c02955040b6876b1e6b10214c78c5'
const R70_PARENT = 'bbe6569749726892060a09338af25cbec9c34830'
const R71_COMMIT = '702bc226ab36a870a51c3bbb9ef98009b9be128e'
const R71_TREE = '69f11d66eb7334619b41eebff08a8609fe480ea3'
const SOURCE_SHA256 = 'e7b70f3816b38fa3744c1a86e627e835b770765745e370e569a350ddb1df05c9'
const MACHINE_SHA256 = 'bc83f908bc9b4a2fee46917ab9501b6ae730c5fe419b7f3c1e2a55c59314cb80'
const FOUNDER_LOCK = '8ee0ef4dd286e7f13f54f2d80d26ea341783d2dc89bb858e91b865fa2ce77fbf'
const R70_BLOBS = {
  'docs/current/design-state.md': '9d4b4e5e82bda0581788b84a7827995d80a51bf4',
  'package.json': '3e14cfcba68f950e85706f3497f78f2dec6066e1',
  'project-documentation/ctrl-evolution/README.md': 'd7a002d283f33a119985273e8ff15631493ba533',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-qa-record.md': 'dcac8a6abc6b288c6bc2cae6c0aad062f435818d',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.json': '7e68c41a9ca014f0e14d84e272b860355d6e3755',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.md': 'a68144f0aee688232a27aa0e37adad144c4f02a1',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md': '7cf8a29d43d92220fdb205c74fff87b61bf3a26a',
  'scripts/check-ctrl-g24-founder-lock.mjs': 'dec343873a922a5b8b744cd54c6114972747e3b9',
  'scripts/check-ctrl-g24-lifecycle-evaluator-r70.mjs': 'a79bd7b057f7d115001eb8494ca071e412af999f',
  'scripts/materialize-ctrl-g24-lifecycle-evaluator-r70.mjs': '8c8eebc77236a362cf61f10553e78776abe13741',
  'scripts/run-ctrl-g24-lifecycle-evaluator-r70-harness.mjs': '01bf45a848b9c418762af6d8e6684384ebe4782b',
  'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.mjs': '27a9d8767d6e666bcdd184f7b511951f6bb4026e',
  'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.test.ts': '829d2ad920cba5654f0e014ce8821118c0689bfe',
}
const R71_BLOBS = {
  'docs/current/design-state.md': '3d34c51b0f5e5a70e046baf89e95087657cf8f4f',
  'package.json': 'da386db39446bc57c3f8afe189e3346fe924cebd',
  'project-documentation/ctrl-evolution/README.md': '484e31baa75400976590e9c2d4f032d622c444d5',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.json': '71f2abeee1ee345c2f2e2cd27a7a5065cfcbe9e6',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.md': 'd0c24e6d2007f6d21387aee65d0579680ff72015',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-qa-record.md': '05c0754160158d8f36d17fdd52ceaa2a43649476',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md': '74725190c9b0725a5b57c4a4b9150a9522847d00',
  'scripts/check-ctrl-g24-founder-lock.mjs': 'ab6a656326cf716fe95fb42828b76d29ca0c3350',
  'scripts/check-ctrl-g24-lifecycle-evaluator-r70-acceptance-r71.mjs': '511a445422acc40c56c60427d6cc453ae1c673a3',
}
const frozenText = path => execFileSync('git', ['show', `${R71_COMMIT}:${path}`], { cwd: root, encoding: 'utf8' })

check('frozen R70 commit exists', git(['cat-file', '-t', R70_COMMIT]) === 'commit')
check('frozen R70 tree exact', git(['rev-parse', `${R70_COMMIT}^{tree}`]) === R70_TREE)
check('frozen R70 parent exact', git(['rev-parse', `${R70_COMMIT}^`]) === R70_PARENT)
for (const [path, blob] of Object.entries(R70_BLOBS)) {
  check(`frozen R70 blob exact: ${path}`, git(['rev-parse', `${R70_COMMIT}:${path}`]) === blob)
}
check('frozen R71 commit exists', git(['cat-file', '-t', R71_COMMIT]) === 'commit')
check('frozen R71 tree exact', git(['rev-parse', `${R71_COMMIT}^{tree}`]) === R71_TREE)
check('frozen R71 directly descends from R70', git(['rev-parse', `${R71_COMMIT}^`]) === R70_COMMIT)
for (const [path, blob] of Object.entries(R71_BLOBS)) {
  check(`frozen R71 blob exact: ${path}`, git(['rev-parse', `${R71_COMMIT}:${path}`]) === blob)
}
const frozenSource = execFileSync('git', ['show', `${R70_COMMIT}:supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.mjs`], { cwd: root })
const frozenMachine = execFileSync('git', ['show', `${R70_COMMIT}:project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.json`], { cwd: root })
check('frozen source SHA exact', sha256Bytes(frozenSource) === SOURCE_SHA256 && frozenSource.length === 7451)
check('frozen machine SHA exact', sha256Bytes(frozenMachine) === MACHINE_SHA256)
for (const path of Object.keys(R70_BLOBS).filter(path => !['docs/current/design-state.md', 'package.json', 'project-documentation/ctrl-evolution/README.md', 'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-qa-record.md', 'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md', 'scripts/check-ctrl-g24-founder-lock.mjs'].includes(path))) {
  check(`R70 executable artifact remains byte-identical: ${path}`, Buffer.compare(execFileSync('git', ['show', `${R70_COMMIT}:${path}`], { cwd: root }), readFileSync(join(root, path))) === 0)
}

const receipt = JSON.parse(frozenText('project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.json'))
check('closed receipt schema', receipt.schema_version === 'ctrl.g24.lifecycle-precondition-evaluator-r70-acceptance-receipt.r71.v1')
check('closure only', receipt.receipt_kind === 'adjudication_closure_only' && receipt.round === 'R71' && receipt.recorded_on === '2026-09-15')
check('accepted identity exact', receipt.accepted_contract?.status === 'accepted_for_structural_executable_loading_scope' && receipt.accepted_contract?.commit === R70_COMMIT && receipt.accepted_contract?.tree === R70_TREE && receipt.accepted_contract?.parent === R70_PARENT)
check('accepted hashes exact', receipt.accepted_contract?.source_sha256 === SOURCE_SHA256 && receipt.accepted_contract?.source_bytes === 7451 && receipt.accepted_contract?.machine_sha256 === MACHINE_SHA256 && receipt.accepted_contract?.founder_lock_identity === FOUNDER_LOCK)
check('accepted blobs exact', JSON.stringify(receipt.accepted_contract?.blobs) === JSON.stringify(R70_BLOBS))
check('two independent PASS verdicts', receipt.independent_verdicts?.length === 2 && receipt.independent_verdicts.every(item => item.verdict === 'PASS' && item.delivery === 'conversation-delivered independent verdict' && item.cryptographic_signature === 'not claimed' && item.separate_verdict_artifact === 'not created'))

const outside = ['semantic evaluation or satisfaction', 'predicate authority and thirteen typed fact meanings', 'live registry completeness or runtime attestation', 'transaction and database behavior', 'product and UI behavior', 'deployment, release or external action']
const notAuthorized = ['result-producing evaluator', 'runtime connection', 'database write', 'UI change', 'deployment or release', 'external action']
check('outside scope exact', JSON.stringify(receipt.unproved_outside_scope) === JSON.stringify(outside))
check('authority exact', receipt.acceptance_authority === 'authorizes only a separate predicate-authority design and founder-choice gate')
check('not authorized exact', JSON.stringify(receipt.not_authorized) === JSON.stringify(notAuthorized))
check('recommended lane exact', receipt.recommended_next_lane === 'server-derived closed structured read-set with thirteen discriminated fact variants')
check('no semantics or external action', receipt.contract_semantics_change === 'none' && receipt.runtime_registry_database_ui_deployment_or_external_action === 'none')

const human = frozenText('project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.md')
const ledger = frozenText('project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md')
const state = frozenText('project-documentation/ctrl-evolution/README.md')
const design = frozenText('docs/current/design-state.md')
const qa = frozenText('project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-qa-record.md')
for (const text of [human, ledger, qa]) {
  check('records both independent passes', text.includes('specialist architecture judge') && text.includes('correctness reviewer') && text.includes('PASS'))
  check('records conversation delivery', text.includes('independent reviewer messages'))
  check('rejects signature claim', text.includes('not cryptographic signatures'))
  check('rejects verdict artifact claim', text.includes('No separate frozen verdict artifact'))
}
check('canonical state routes to R71', state.includes('[R71 acceptance receipt](g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.md)'))
check('one next action is predicate authority', state.includes('**CURRENT_NEXT_ACTION:** Design and founder-lock the predicate-authority contract'))
check('design state agrees', design.includes('design and founder-lock the predicate-authority contract'))

let r71IsAncestor = true
try {
  execFileSync('git', ['merge-base', '--is-ancestor', R71_COMMIT, 'HEAD'], { cwd: root })
} catch {
  r71IsAncestor = false
}
check('current branch descends from accepted R71', r71IsAncestor)
for (const path of [
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.json',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.md',
]) {
  check(`current acceptance receipt remains byte-identical: ${path}`, Buffer.compare(execFileSync('git', ['show', `${R71_COMMIT}:${path}`], { cwd: root }), readFileSync(join(root, path))) === 0)
}

const attacks = [
  ['removed verdict', value => value.independent_verdicts.pop()],
  ['widened scope', value => { value.acceptance_authority = 'authorizes runtime' }],
  ['dropped outside scope', value => value.unproved_outside_scope.pop()],
  ['invented signature', value => { value.independent_verdicts[0].cryptographic_signature = 'signed' }],
  ['invented verdict artifact', value => { value.independent_verdicts[1].separate_verdict_artifact = 'verdict.json' }],
  ['semantic implementation claim', value => { value.contract_semantics_change = 'implemented' }],
]
const validatesBoundary = value => value.independent_verdicts.length === 2 && value.independent_verdicts.every(item => item.verdict === 'PASS' && item.cryptographic_signature === 'not claimed' && item.separate_verdict_artifact === 'not created') && JSON.stringify(value.unproved_outside_scope) === JSON.stringify(outside) && value.acceptance_authority === 'authorizes only a separate predicate-authority design and founder-choice gate' && value.contract_semantics_change === 'none'
for (const [name, mutate] of attacks) {
  const candidate = structuredClone(receipt)
  mutate(candidate)
  check(`attack rejected: ${name}`, !validatesBoundary(candidate))
}

if (failures.length) {
  console.error(`G24 R70 R71 closure failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: frozen R71 ${R71_COMMIT} / ${R71_TREE}; frozen R70 ${R70_COMMIT} / ${R70_TREE}; 13/13 R70 and 9/9 R71 blobs exact; 2/2 independent PASS verdicts; ${attacks.length} closure attacks`)
