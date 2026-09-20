import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import {
  inspectExecutableSource,
  runIsolatedModule,
  runR68StructuralGate,
  verifyR66LifecycleSelection,
} from './run-ctrl-g24-lifecycle-evaluator-r68-harness.mjs'
import { materializedR68, materializedR68Output } from './materialize-ctrl-g24-lifecycle-evaluator-r68.mjs'

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
const hash = value => sha256(Buffer.from(canonical(value), 'utf8'))
const same = (left, right) => canonical(left) === canonical(right)
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const expectThrow = (name, action) => {
  try { action(); failures.push(name) } catch { /* expected */ }
}

const R67_COMMIT = 'fe4a4ee5780bc3ecf919766e89931987f97f4e30'
const R67_TREE = '94c6bf07a89196deab2bf3913e17dbaad9535968'
const R66_MACHINE_SHA256 = 'b930cff4b346aad614cc0a576ab7160a7846a5f1e9f5cb27f864d286fd32a920'
const SOURCE_SHA256 = 'fc2a93586fdbe42aa9f15e3a1990142403edb0a7df512881ffd9d5e18fad9104'
const SOURCE_GIT_BLOB = '7985b73dd5c41ff7f51d03cc84ffe43083878c7e'
const SOURCE_BYTES = 6765
const SOURCE_LOCK = '4ccc949ac84ab2ab7ce357088230170a7be8348d8162e4d69ab5738c73d03b06'
const SOURCE_PATH = 'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.mjs'
const MACHINE_PATH = 'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68.json'
const R67_FROZEN_BLOBS = {
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json': '3cfdf96182f794b5221663170413315b7630219f',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.md': 'eb5b875222710260ef886ca669c626bb2857bb70',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.json': '9da9ddf58886096bdb32789d57877b4818b3ed20',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.md': 'b271369ff25b8ce69b8a4b7b27502ccea224daa7',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-qa-record.md': 'da4f476f1e6c7de410a91bff0a032b5d38a3eda3',
  'scripts/check-ctrl-g24-trusted-ingress-r66.mjs': '6bc7f0bbc16d00676b9e8c97900397567127e034',
  'scripts/materialize-ctrl-g24-trusted-ingress-r66.mjs': 'be4fdc2ea288747f242749ee2e0b0b678b0bfec5',
  'scripts/check-ctrl-g24-trusted-ingress-r67-closure.mjs': '22b0a5fc2ac602bd34c5ced9def6b6266a49bcc9',
  'package-lock.json': 'cc4bbb4405e5a6e0ba897286a619c1f9ae435a77',
}

check('frozen R67 commit exists', git(['cat-file', '-t', R67_COMMIT]) === 'commit')
check('frozen R67 tree exact', git(['rev-parse', `${R67_COMMIT}^{tree}`]) === R67_TREE)
for (const [path, blob] of Object.entries(R67_FROZEN_BLOBS)) {
  check(`frozen R67 blob exact: ${path}`, git(['rev-parse', `${R67_COMMIT}:${path}`]) === blob)
  if (!['package-lock.json'].includes(path)) check(`frozen predecessor file byte-identical: ${path}`, Buffer.compare(execFileSync('git', ['show', `${R67_COMMIT}:${path}`], { cwd: root, maxBuffer: 256 * 1024 * 1024 }), readBytes(path)) === 0)
}
check('package-lock byte-identical to R67', Buffer.compare(execFileSync('git', ['show', `${R67_COMMIT}:package-lock.json`], { cwd: root }), readBytes('package-lock.json')) === 0)

const machineBytes = read(MACHINE_PATH)
const machine = JSON.parse(machineBytes)
const r66 = JSON.parse(read('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'))
check('materialized machine exact', machineBytes === materializedR68Output && same(machine, materializedR68))
check('R66 machine SHA exact', sha256(readBytes('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json')) === R66_MACHINE_SHA256)
check('R68 schema and status exact', machine.schema_version === 'ctrl.g24.lifecycle-precondition-evaluator-structural-gate.r68.v1' && machine.status === 'structural_executable_loading_mechanics_only')
check('R67 parent exact', machine.immutable_parent.commit === R67_COMMIT && machine.immutable_parent.tree === R67_TREE)

const source = readBytes(SOURCE_PATH)
const artifact = machine.executable_artifact
check('source byte identity pinned', source.length === SOURCE_BYTES && sha256(source) === SOURCE_SHA256)
check('source Git blob pinned', git(['hash-object', SOURCE_PATH]) === SOURCE_GIT_BLOB && artifact.source_git_blob_oid === SOURCE_GIT_BLOB)
check('source artifact content address exact', artifact.canonical_executable_bytes_sha256 === SOURCE_SHA256 && artifact.executable_content_ref === SOURCE_SHA256 && artifact.canonical_executable_bytes_length === SOURCE_BYTES)
check('source module and entrypoint exact', artifact.module_format === 'ecmascript_module_utf8_import_free' && artifact.entrypoint === 'dispatchEvaluateLifecyclePreconditionsStructuralR68')
check('source founder lock exact', artifact.founder_lock.founder_lock_identity === SOURCE_LOCK)
check('descriptor separate from source', artifact.descriptor_content_ref === r66.authority_operation_evaluator_export_parity_proof.evaluator_metadata_descriptor_artifact.descriptor_content_ref && artifact.descriptor_bytes_sha256 !== SOURCE_SHA256)
check('one exact source export', same(inspectExecutableSource(source.toString('utf8'), artifact.entrypoint), { import_count: 0, exact_exports: [artifact.entrypoint] }))

check('closed input schema', machine.dispatch_input_schema.additional_properties === false && same(machine.dispatch_input_schema.exact_keys, machine.dispatch_input_schema.required))
check('closed output schema', machine.dispatch_output_schema.additional_properties === false && same(machine.dispatch_output_schema.exact_keys, machine.dispatch_output_schema.required))
check('no semantic success ABI', artifact.export_abi.semantic_success_branch === 'absent_and_forbidden' && same(artifact.export_abi.allowed_statuses, ['hold', 'verified_not_runnable']))
check('semantic boundary exact', same(machine.semantic_boundary, {
  executable_loading_mechanics: 'implemented_and_testable_in_R68',
  semantic_predicate_authority: 'UNAVAILABLE',
  typed_fact_bundle: 'not_defined_or_implemented',
  satisfied_or_success_branch: 'forbidden',
  r63_result_generation: 'forbidden',
  r13_evidence_row_generation: 'forbidden',
  live_registry_completeness: 'unproved',
  serializable_runtime_selection: 'unproved',
  database_write_and_restart_integration: 'unproved',
  runtime_edge_ui_deployment_or_external_action: 'none',
}))
check('open founder decision stays open', machine.open_founder_decision.status === 'open_not_decided_or_implemented' && machine.open_founder_decision.recommended_option === 'server_derived_closed_structured_trusted_read_set_with_13_discriminated_precondition_fact_variants' && machine.open_founder_decision.result_or_evidence_success_branch_requires_separate_founder_choice_and_gate === true)
check('no dependency migration or runtime action', machine.migration_dependency_and_rollback.package_dependency_change === 'none' && machine.migration_dependency_and_rollback.package_lock_change === 'forbidden' && machine.migration_dependency_and_rollback.database_migration_or_backfill === 'none' && machine.migration_dependency_and_rollback.runtime_route_ui_deploy_or_external_action === 'none')

try { verifyR66LifecycleSelection(r66, machine); check('R66 selection exact', true) } catch { check('R66 selection exact', false) }
const baseline = runR68StructuralGate({ r66, r68: machine, executableBytes: source })
check('isolated baseline loaded', baseline.loaded === true)
check('isolated baseline exact no-write output', same(baseline.dispatch, machine.expected_verified_dispatch_output))
const restartOutputs = Array.from({ length: 3 }, () => runR68StructuralGate({ r66, r68: machine, executableBytes: source }).dispatch)
check('isolated restart determinism', restartOutputs.every(output => same(output, machine.expected_verified_dispatch_output)))

let attackCount = 0
const expectGateHold = (name, options) => {
  attackCount += 1
  const result = runR68StructuralGate({ r66, r68: machine, executableBytes: source, ...options })
  check(`attack rejected: ${name}`, result.loaded === false && same(result.dispatch, machine.expected_hold_dispatch_output))
}

const changed = Buffer.from(source)
changed[changed.length - 2] ^= 1
expectGateHold('one byte source mutation', { executableBytes: changed })
expectGateHold('same metadata different executable', { executableBytes: Buffer.from("export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return {}}\n") })
expectGateHold('descriptor as executable', { executableBytes: Buffer.from(r66.authority_operation_evaluator_export_parity_proof.evaluator_metadata_descriptor_artifact.canonical_descriptor_bytes_b64url, 'base64url') })
expectGateHold('truncated executable', { executableBytes: source.subarray(0, source.length - 1) })

const coherentArtifact = structuredClone(artifact)
const alternate = Buffer.from(source.toString('utf8').replace("const UNAVAILABLE = 'UNAVAILABLE'", "const UNAVAILABLE = 'OTHER_VALUE'"), 'utf8')
coherentArtifact.canonical_executable_bytes_sha256 = sha256(alternate)
coherentArtifact.executable_content_ref = sha256(alternate)
coherentArtifact.canonical_executable_bytes_length = alternate.length
coherentArtifact.founder_lock.preimage.canonical_executable_bytes_sha256 = sha256(alternate)
coherentArtifact.founder_lock.preimage.executable_content_ref = sha256(alternate)
coherentArtifact.founder_lock.preimage.canonical_executable_bytes_length = alternate.length
coherentArtifact.founder_lock.founder_lock_identity = hash({ schema_version: coherentArtifact.founder_lock.schema_version, domain_ascii: coherentArtifact.founder_lock.domain_ascii, canonical_encoding: coherentArtifact.founder_lock.canonical_encoding, preimage: coherentArtifact.founder_lock.preimage })
expectGateHold('coherent alternate bytes cannot self-approve founder lock', { executableBytes: alternate, artifact: coherentArtifact })

for (const [name, mutate] of [
  ['wrong source hash', value => { value.canonical_executable_bytes_sha256 = '0'.repeat(64) }],
  ['wrong content ref', value => { value.executable_content_ref = '0'.repeat(64) }],
  ['wrong source length', value => { value.canonical_executable_bytes_length += 1 }],
  ['wrong module format', value => { value.module_format = 'commonjs' }],
  ['wrong entrypoint', value => { value.entrypoint = 'evaluate' }],
  ['extra ABI export', value => { value.export_abi.exact_export_names.push('extra') }],
]) {
  const candidate = structuredClone(artifact)
  mutate(candidate)
  expectGateHold(name, { artifact: candidate })
}

const authority = r66.authority_operation_evaluator_registry_selection
const selected = authority.selection_records.find(record => record.operation_class === 'evaluate_lifecycle_preconditions')
const resealRecord = record => {
  const queryCore = { ...record.query }
  delete queryCore.selection_query_fingerprint
  record.query.selection_query_fingerprint = hash({ domain_ascii: authority.selection_query_fingerprint_authority.domain_ascii, selection_query_without_fingerprint: queryCore })
  record.proof.selection_query_fingerprint = record.query.selection_query_fingerprint
  const proofCore = { ...record.proof }
  delete proofCore.selection_proof_fingerprint
  record.proof.selection_proof_fingerprint = hash({ domain_ascii: authority.selection_proof_fingerprint_authority.domain_ascii, selection_proof_without_fingerprint: proofCore })
}
for (const [name, mutate] of [
  ['cross operation selection', record => { record.query.operation_class = 'use_release'; record.proof.operation_class = 'use_release' }],
  ['stale selection time', record => { record.query.evaluated_at = '2029-01-01T00:00:00.000Z'; record.proof.evaluated_at = record.query.evaluated_at }],
  ['wrong policy lineage', record => { record.query.policy_lineage_ref = 'other_policy'; record.proof.policy_lineage_ref = record.query.policy_lineage_ref }],
  ['cross operation result export', record => { record.proof.selected_result_schema_version = r66.result_payload_schemas.use_release.schema_version }],
  ['selected member fingerprint splice', record => { record.proof.selected_member_fingerprint = '0'.repeat(64) }],
  ['snapshot ref splice', record => { record.proof.source_snapshot_ref = '0'.repeat(64) }],
  ['set seal splice', record => { record.proof.source_registry_set_seal = '0'.repeat(64) }],
]) {
  const record = structuredClone(selected)
  mutate(record)
  resealRecord(record)
  expectGateHold(name, { selectionRecord: record })
}

const invalidInputs = [
  ['unknown field input', { ...machine.sample_dispatch_input, caller_authority: true }],
  ['invented semantic authority', { ...machine.sample_dispatch_input, semantic_predicate_authority: 'caller_asserted' }],
  ['wrong R63 result schema', { ...machine.sample_dispatch_input, selected_result_schema_version: 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' }],
]
for (const [name, dispatchInput] of invalidInputs) {
  attackCount += 1
  const result = runR68StructuralGate({ r66, r68: machine, executableBytes: source, dispatchInput })
  check(`attack rejected: ${name}`, result.loaded === true && same(result.dispatch, machine.expected_hold_dispatch_output))
}

const accessorInput = structuredClone(machine.sample_dispatch_input)
let getterCalls = 0
Object.defineProperty(accessorInput, 'operation_id', { enumerable: true, get() { getterCalls += 1; return 'forged' } })
expectGateHold('accessor input before serialization', { dispatchInput: accessorInput })
check('accessor was not invoked', getterCalls === 0)
const cyclicInput = structuredClone(machine.sample_dispatch_input)
cyclicInput.intent.predecessor_lifecycle_version_ref = cyclicInput
expectGateHold('cyclic input before serialization', { dispatchInput: cyclicInput })
const inheritedInput = Object.assign(Object.create({ caller_authority: true }), machine.sample_dispatch_input)
expectGateHold('prototype input before serialization', { dispatchInput: inheritedInput })

for (const [name, sourceText] of [
  ['static import', "import fs from 'node:fs'; export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){}"],
  ['dynamic import', "export async function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return import('node:fs')}"],
  ['process access', "export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return process.env}"],
  ['network fetch', "export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return fetch('https://example.com')}"],
  ['clock access', "export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return Date.now()}"],
  ['random access', "export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return Math.random()}"],
  ['global escape', "export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return globalThis}"],
  ['top level effect', "throw new Error('effect'); export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){}"],
]) {
  attackCount += 1
  expectThrow(`attack rejected: ${name}`, () => inspectExecutableSource(sourceText, artifact.entrypoint))
}

for (const [name, sourceText, options] of [
  ['wrong exact export surface', "export function probe(){}; export function extra(){}", {}],
  ['module throw', "export function probe(){throw new Error('boom')}", {}],
  ['module timeout', "export function probe(){for(;;){}}", { timeoutMs: 100 }],
  ['module oversized output', "export function probe(){return {value:'x'.repeat(70000)}}", { maxOutputBytes: 1024 }],
]) {
  attackCount += 1
  expectThrow(`attack rejected: ${name}`, () => runIsolatedModule(Buffer.from(sourceText), 'probe', {}, options))
}

const nondeterministic = "export function dispatchEvaluateLifecyclePreconditionsStructuralR68(){return {value:Math.random()}}"
attackCount += 1
expectThrow('attack rejected: nondeterministic source', () => inspectExecutableSource(nondeterministic, artifact.entrypoint))

const tracked = git(['ls-files', '--cached', '--others', '--exclude-standard']).split(/\r?\n/).filter(path => /\.(?:[cm]?[jt]sx?)$/u.test(path))
const importers = []
for (const path of tracked) {
  if (path === SOURCE_PATH) continue
  const text = read(path)
  if (/from\s+['"][^'"]*g24-lifecycle-precondition-evaluator\.r68\.mjs['"]|import\s*\(\s*['"][^'"]*g24-lifecycle-precondition-evaluator\.r68\.mjs['"]\s*\)/u.test(text)) importers.push(path)
}
const expectedImporters = ['supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.test.ts']
check('static import graph exact', same(importers.sort(compareCodePoints), expectedImporters))
check('no live UI Edge headless or decision-engine import', importers.every(path => expectedImporters.includes(path)))

const requiredHuman = [
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68.md',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68-qa-record.md',
]
for (const path of requiredHuman) {
  const text = read(path)
  check(`${path}: mechanics only`, text.includes('executable loading mechanics only'))
  check(`${path}: no semantic success`, text.includes('No semantic success branch'))
  check(`${path}: open choice`, text.includes('structured trusted read-set') && text.includes('signed satisfaction assertions'))
  check(`${path}: no external action`, text.includes('No runtime, database, UI, deployment or external action'))
  check(`${path}: no em dash`, !text.includes('—'))
}
const ledger = read('project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md')
check('ledger records R68 and open decision', ledger.includes('## R68 structural executable-adapter gate') && ledger.includes('structured trusted read-set variants') && ledger.includes('signed satisfaction assertions'))
const readme = read('project-documentation/ctrl-evolution/README.md')
const design = read('docs/current/design-state.md')
check('README routes R68', readme.includes('[R68 structural executable-adapter gate](g24-lifecycle-precondition-evaluator-r68.md)'))
check('README keeps predicate decision open', readme.includes('**CURRENT_NEXT_ACTION:** Resolve the R68 open founder decision'))
check('design state keeps runtime closed', design.includes('R68 structural executable loading mechanics') && design.includes('no runtime integration is authorized'))

const allowedPaths = new Set([
  'docs/current/design-state.md',
  'package.json',
  'project-documentation/ctrl-evolution/README.md',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68.json',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68.md',
  'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68-qa-record.md',
  'project-documentation/ctrl-evolution/runs/g24-trusted-ingress-architecture-001/review-ledger.md',
  'scripts/check-ctrl-g24-founder-lock.mjs',
  'scripts/check-ctrl-g24-lifecycle-evaluator-r68.mjs',
  'scripts/materialize-ctrl-g24-lifecycle-evaluator-r68.mjs',
  'scripts/run-ctrl-g24-lifecycle-evaluator-r68-harness.mjs',
  'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.mjs',
  'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.test.ts',
])
const statusEntries = execFileSync('git', ['status', '--porcelain=v1', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
const statusPaths = statusEntries.map(entry => entry.slice(3).replaceAll('\\', '/'))
const head = git(['rev-parse', 'HEAD'])
let changedPaths
if (head === R67_COMMIT) changedPaths = statusPaths
else {
  check('R68 commit directly descends from R67', git(['rev-parse', 'HEAD^']) === R67_COMMIT)
  changedPaths = git(['diff', '--name-only', `${R67_COMMIT}..HEAD`]).split(/\r?\n/).filter(Boolean)
  check('post-freeze worktree clean', statusPaths.length === 0)
}
check('R68 changed paths exact', changedPaths.length === allowedPaths.size && changedPaths.every(path => allowedPaths.has(path)) && [...allowedPaths].every(path => changedPaths.includes(path)))
check('no migration dependency lock UI or live Edge entrypoint changed', changedPaths.every(path => !path.startsWith('supabase/migrations/') && path !== 'package-lock.json' && !path.startsWith('src/') && !path.startsWith('supabase/functions/decision-engine/') && !(path.startsWith('supabase/functions/') && !path.startsWith('supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68'))))

if (failures.length) {
  console.error(`G24 lifecycle evaluator R68 failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: R68 structural evaluator gate; source ${SOURCE_SHA256}; ${SOURCE_BYTES} bytes; lock ${SOURCE_LOCK}; R66 three-key selection exact; 4 isolated restarts; ${attackCount} attacks; 1 test-only importer; no semantic success/runtime/DB/UI/deploy/external action`)
