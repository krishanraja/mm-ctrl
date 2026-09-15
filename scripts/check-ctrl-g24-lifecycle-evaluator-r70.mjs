import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  inspectExecutableSource,
  runIsolatedModule,
  runR70StructuralGate,
  verifyR66LifecycleSelection,
} from './run-ctrl-g24-lifecycle-evaluator-r70-harness.mjs'
import { materializedR70, materializedR70Output } from './materialize-ctrl-g24-lifecycle-evaluator-r70.mjs'

const root = process.cwd()
const readBytes = path => readFileSync(join(root, path))
const read = path => readFileSync(join(root, path), 'utf8')
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const compareCodePoints = (left, right) => {
  const a = [...String(left)].map(value => value.codePointAt(0))
  const b = [...String(right)].map(value => value.codePointAt(0))
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) if (a[index] !== b[index]) return a[index] - b[index]
  return a.length - b.length
}
const canonical = value => {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error('noncanonical_number')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) throw new Error('noncanonical_value')
  return `{${Object.keys(value).sort(compareCodePoints).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
}
const same = (left, right) => canonical(left) === canonical(right)
const EM_DASH = String.fromCodePoint(0x2014)
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const expectThrow = (name, action) => {
  try { action(); failures.push(name) } catch { /* expected */ }
}

const BASE_COMMIT = 'bbe6569749726892060a09338af25cbec9c34830'
const BASE_TREE = '9285795d5cb6a670346fa25b8b4a944e033a30f3'
const R67_COMMIT = 'fe4a4ee5780bc3ecf919766e89931987f97f4e30'
const R67_TREE = '94c6bf07a89196deab2bf3913e17dbaad9535968'
const R68_COMMIT = '06b96688bdfc9399bff3852884e5a3e934e37f95'
const R68_TREE = '4580008f3fabadf1cf3e039d02291dfb2b02e799'
const R69_COMMIT = '70055728953f8eec4c30a2876b6169378d883682'
const R69_TREE = 'a5456866f8c4a83ca7bdd1764739182cbb6a0f67'
const R66_MACHINE_SHA256 = 'b930cff4b346aad614cc0a576ab7160a7846a5f1e9f5cb27f864d286fd32a920'
const R70_MACHINE_SHA256 = 'bc83f908bc9b4a2fee46917ab9501b6ae730c5fe419b7f3c1e2a55c59314cb80'
const SOURCE_SHA256 = 'e7b70f3816b38fa3744c1a86e627e835b770765745e370e569a350ddb1df05c9'
const SOURCE_GIT_BLOB = '27a9d8767d6e666bcdd184f7b511951f6bb4026e'
const SOURCE_BYTES = 7451
const SOURCE_LOCK = '8ee0ef4dd286e7f13f54f2d80d26ea341783d2dc89bb858e91b865fa2ce77fbf'
const R66_PATH = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'
const MACHINE_PATH = 'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.json'
const SOURCE_PATH = 'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.mjs'
const HOLD = {
  schema_version: 'ctrl.g24.executable-output.evaluate-lifecycle-preconditions.r70.v1',
  status: 'hold',
  hold_code: 'evaluator_artifact_hold',
  writes: [],
  result: null,
  evidence_rows: [],
}

check('implementation base exact', git(['rev-parse', BASE_COMMIT]) === BASE_COMMIT && git(['rev-parse', `${BASE_COMMIT}^{tree}`]) === BASE_TREE)
check('frozen R67 exact', git(['rev-parse', `${R67_COMMIT}^{tree}`]) === R67_TREE)
check('rejected R68 exact', git(['rev-parse', `${R68_COMMIT}^{tree}`]) === R68_TREE)
check('rejected R69 exact', git(['rev-parse', `${R69_COMMIT}^{tree}`]) === R69_TREE)

const machineText = read(MACHINE_PATH)
const machineBytes = readBytes(MACHINE_PATH)
const machine = JSON.parse(machineText)
const r66Bytes = readBytes(R66_PATH)
const r66 = JSON.parse(r66Bytes)
const source = readBytes(SOURCE_PATH)
const artifact = machine.executable_artifact

check('materialized machine exact', machineText === materializedR70Output && same(machine, materializedR70))
check('R66 raw bytes hard pin exact', sha256(r66Bytes) === R66_MACHINE_SHA256)
check('R70 raw bytes hard pin exact', sha256(machineBytes) === R70_MACHINE_SHA256)
check('R70 lineage exact', machine.immutable_parent.commit === R67_COMMIT && machine.rejected_predecessor.commit === R69_COMMIT && machine.rejected_predecessor.tree === R69_TREE && machine.implementation_base.commit === BASE_COMMIT)
check('source identity exact', source.length === SOURCE_BYTES && sha256(source) === SOURCE_SHA256 && git(['hash-object', SOURCE_PATH]) === SOURCE_GIT_BLOB)
check('source lock exact', artifact.founder_lock.founder_lock_identity === SOURCE_LOCK)
check('source descriptor exact', artifact.source_path === SOURCE_PATH && artifact.canonical_executable_bytes_sha256 === SOURCE_SHA256 && artifact.canonical_executable_bytes_length === SOURCE_BYTES)
check('one import-free source export', same(inspectExecutableSource(source.toString('utf8'), artifact.entrypoint), { import_count: 0, exact_exports: [artifact.entrypoint] }))
check('closed production boundary declared', machine.isolated_harness.production_gate_api === 'one_optional_primitive_string_argument_only' && machine.isolated_harness.caller_owned_authority_objects === 'absent_and_unread' && machine.isolated_harness.rejection_envelope === 'hard_coded_trusted_constants_only')
check('no semantic success ABI', artifact.export_abi.semantic_success_branch === 'absent_and_forbidden' && same(artifact.export_abi.allowed_statuses, ['hold', 'verified_not_runnable']))
check('no runtime action', machine.migration_dependency_and_rollback.runtime_route_ui_deploy_or_external_action === 'none')

try { verifyR66LifecycleSelection(r66, machine); check('R66 selection exact', true) } catch { check('R66 selection exact', false) }

const baseline = runR70StructuralGate()
check('baseline loaded', baseline.loaded === true)
check('baseline closed output exact', same(baseline.dispatch, machine.expected_verified_dispatch_output))
const restarts = Array.from({ length: 4 }, () => runR70StructuralGate())
check('restart determinism', restarts.every(value => value.loaded === true && same(value.dispatch, machine.expected_verified_dispatch_output)))

let attackCount = 0
const expectGateHold = (name, input) => {
  attackCount += 1
  const result = runR70StructuralGate(input)
  check(`attack rejected: ${name}`, result.loaded === false && same(result.dispatch, HOLD))
}

let callerTrapCalls = 0
const authorityProxy = new Proxy({}, {
  get() { callerTrapCalls += 1; throw new Error('trap') },
  getPrototypeOf() { callerTrapCalls += 1; throw new Error('trap') },
  ownKeys() { callerTrapCalls += 1; throw new Error('trap') },
  getOwnPropertyDescriptor() { callerTrapCalls += 1; throw new Error('trap') },
})
expectGateHold('caller object at only production argument', authorityProxy)
runR70StructuralGate(undefined, authorityProxy)
check('caller R66 or R70 proxy cannot be supplied or touched', callerTrapCalls === 0)
check('caller cannot mutate rejection schema', same(runR70StructuralGate({ output_schema: 'caller' }).dispatch, HOLD))

const literalLoneHighSurrogate = `"${String.fromCharCode(0xd800)}"`
const literalLoneLowSurrogate = `"${String.fromCharCode(0xdc00)}"`
expectGateHold('literal lone high surrogate UTF8 loss', literalLoneHighSurrogate)
expectGateHold('literal lone low surrogate UTF8 loss', literalLoneLowSurrogate)

const invalidInputs = [
  ['unknown field', { ...machine.sample_dispatch_input, caller_authority: true }],
  ['invented semantic authority', { ...machine.sample_dispatch_input, semantic_predicate_authority: 'caller_asserted' }],
  ['wrong result schema', { ...machine.sample_dispatch_input, selected_result_schema_version: 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' }],
]
for (const [name, value] of invalidInputs) {
  attackCount += 1
  const result = runR70StructuralGate(canonical(value))
  check(`structural input held: ${name}`, result.loaded === true && same(result.dispatch, HOLD))
}

const tempRoot = mkdtempSync(join(tmpdir(), 'ctrl-r70-boundary-'))
const writeFixture = (path, bytes) => {
  const target = join(tempRoot, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, bytes)
}
const harnessUrl = pathToFileURL(join(root, 'scripts/run-ctrl-g24-lifecycle-evaluator-r70-harness.mjs')).href
const runGateIn = cwd => {
  const code = `import { runR70StructuralGate } from ${JSON.stringify(harnessUrl)}; process.stdout.write(JSON.stringify(runR70StructuralGate()))`
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', code], { cwd, encoding: 'utf8', windowsHide: true })
  if (child.status !== 0) return null
  try { return JSON.parse(child.stdout) } catch { return null }
}

attackCount += 1
check('missing hard-coded artifact path becomes trusted hold', same(runGateIn(tempRoot), { loaded: false, dispatch: HOLD }))
writeFixture(R66_PATH, r66Bytes)
const changedMachine = Buffer.from(machineBytes)
changedMachine[0] ^= 1
writeFixture(MACHINE_PATH, changedMachine)
writeFixture(SOURCE_PATH, source)
attackCount += 1
check('mutated machine rejected before parse', same(runGateIn(tempRoot), { loaded: false, dispatch: HOLD }))
writeFixture(MACHINE_PATH, machineBytes)
const changedSource = Buffer.from(source)
changedSource[changedSource.length - 2] ^= 1
writeFixture(SOURCE_PATH, changedSource)
attackCount += 1
check('mutated source rejected by raw hash', same(runGateIn(tempRoot), { loaded: false, dispatch: HOLD }))
writeFixture(SOURCE_PATH, source)
check('exact copied artifacts load from fixed paths', same(runGateIn(tempRoot), { loaded: true, dispatch: machine.expected_verified_dispatch_output }))

const probeSource = Buffer.from("export function probe(input){return {length:input.length}}\n", 'utf8')
check('exact 65536-byte serialized input accepted', runIsolatedModule(probeSource, 'probe', JSON.stringify('x'.repeat(65534))).length === 65534)
attackCount += 1
expectThrow('serialized input over 65536 bytes rejected', () => runIsolatedModule(probeSource, 'probe', JSON.stringify('x'.repeat(65535))))
attackCount += 1
expectThrow('noncanonical serialized input rejected', () => runIsolatedModule(probeSource, 'probe', '{ "a": 1 }'))
attackCount += 1
expectThrow('literal surrogate rejected before parse', () => runIsolatedModule(probeSource, 'probe', literalLoneHighSurrogate))

for (const [name, sourceText] of [
  ['static import', "import fs from 'node:fs'; export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){}"],
  ['dynamic import', "export async function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return import('node:fs')}"],
  ['process access', "export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return process.env}"],
  ['network fetch', "export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return fetch('https://example.com')}"],
  ['clock access', "export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return Date.now()}"],
  ['random access', "export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return Math.random()}"],
  ['global escape', "export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return globalThis}"],
]) {
  attackCount += 1
  expectThrow(`alternate source rejected: ${name}`, () => inspectExecutableSource(sourceText, artifact.entrypoint))
}

const constructorEscape = Buffer.from("export function dispatchEvaluateLifecyclePreconditionsStructuralR70(){return ({}).constructor.constructor('return process')()}\n")
attackCount += 1
check('alternate constructor source has no caller authority slot', runR70StructuralGate(undefined, constructorEscape).loaded === true)

for (const [name, sourceText, options] of [
  ['wrong export surface', "export function probe(){}; export function extra(){}", {}],
  ['module throw', "export function probe(){throw new Error('boom')}", {}],
  ['module timeout', "export function probe(){for(;;){}}", { timeoutMs: 100 }],
  ['oversized output', "export function probe(){return {value:'x'.repeat(70000)}}", { maxOutputBytes: 1024 }],
]) {
  attackCount += 1
  expectThrow(`isolated module rejected: ${name}`, () => runIsolatedModule(Buffer.from(sourceText), 'probe', '{}', options))
}

const tracked = git(['ls-files', '--cached', '--others', '--exclude-standard']).split(/\r?\n/).filter(path => /\.(?:[cm]?[jt]sx?)$/u.test(path))
const importers = []
for (const path of tracked) {
  if (path === SOURCE_PATH) continue
  const text = read(path)
  if (/from\s+['"][^'"]*g24-lifecycle-precondition-evaluator\.r70\.mjs['"]|import\s*\(\s*['"][^'"]*g24-lifecycle-precondition-evaluator\.r70\.mjs['"]\s*\)/u.test(text)) importers.push(path)
}
check('static import graph exact', same(importers.sort(compareCodePoints), ['supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.test.ts']))
check('no live product import', importers.every(path => path.endsWith('.r70.test.ts')))

for (const path of [
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.md',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-qa-record.md',
]) {
  const text = read(path)
  const lower = text.toLowerCase()
  check(`${path}: mechanics only`, text.includes('executable loading mechanics only'))
  check(`${path}: closed caller authority`, lower.includes('caller-owned authority object') && lower.includes('raw bytes before parsing'))
  check(`${path}: no semantic success`, text.includes('No semantic success branch'))
  check(`${path}: no external action`, text.includes('No runtime, database, UI, deployment or external action'))
  check(`${path}: no em dash`, !text.includes(EM_DASH))
}
const ledger = read('project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md')
const readme = read('project-documentation/ctrl-evolution/README.md')
const design = read('docs/current/design-state.md')
check('ledger records R70 candidate', ledger.includes('## R70 closed caller-authority structural gate'))
check('README routes R70 review', readme.includes('[R70 closed caller-authority structural gate](g24-lifecycle-precondition-evaluator-r70.md)') && readme.toLowerCase().includes('freeze r70'))
check('design state routes R70 review', design.includes('R70 closed caller-authority structural gate') && design.includes('no runtime integration is authorized'))

const allowedPaths = new Set([
  'docs/current/design-state.md',
  'package.json',
  'project-documentation/ctrl-evolution/README.md',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.json',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.md',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70-qa-record.md',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md',
  'scripts/check-ctrl-g24-founder-lock.mjs',
  'scripts/check-ctrl-g24-lifecycle-evaluator-r70.mjs',
  'scripts/materialize-ctrl-g24-lifecycle-evaluator-r70.mjs',
  'scripts/run-ctrl-g24-lifecycle-evaluator-r70-harness.mjs',
  'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.mjs',
  'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70.test.ts',
])
const head = git(['rev-parse', 'HEAD'])
const statusPaths = execFileSync('git', ['status', '--porcelain=v1', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).map(entry => entry.slice(3).replaceAll('\\', '/'))
let candidatePaths = statusPaths
if (head !== BASE_COMMIT) {
  let parent = ''
  try { parent = git(['rev-parse', 'HEAD^']) } catch { /* handled below */ }
  check('frozen candidate has exact base parent', parent === BASE_COMMIT)
  check('post-freeze worktree clean', statusPaths.length === 0)
  candidatePaths = git(['diff', '--name-only', `${BASE_COMMIT}..${head}`]).split(/\r?\n/).filter(Boolean)
}
check('candidate paths exact', candidatePaths.length === allowedPaths.size && candidatePaths.every(path => allowedPaths.has(path)) && [...allowedPaths].every(path => candidatePaths.includes(path)))
check('package lock unchanged', Buffer.compare(execFileSync('git', ['show', `${BASE_COMMIT}:package-lock.json`], { cwd: root }), readBytes('package-lock.json')) === 0)
check('no migration UI or live Edge change', candidatePaths.every(path => !path.startsWith('supabase/migrations/') && !path.startsWith('src/') && !path.startsWith('supabase/functions/decision-engine/') && !(path.startsWith('supabase/functions/') && !path.startsWith('supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r70'))))

if (failures.length) {
  console.error(`G24 lifecycle evaluator R70 failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`ok: R70 closed caller-authority structural gate; source ${SOURCE_SHA256}; ${SOURCE_BYTES} bytes; lock ${SOURCE_LOCK}; R66 and R70 raw bytes pinned before parse; 5 restarts; ${attackCount} attacks; one primitive production input; trusted hold constants; no semantic success/runtime/DB/UI/deploy/external action`)
