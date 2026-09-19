import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const DEFAULT_R66_PATH = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'
const DEFAULT_R69_PATH = 'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r69.json'
const PINNED_SOURCE_SHA256 = '6d47389ea5cadcfc8e1c3da9dd8d594ed72323ad994e353b5d94e5886316bdb9'
const PINNED_SOURCE_BYTES = 7452

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const compareCodePoints = (left, right) => {
  const a = [...String(left)].map(value => value.codePointAt(0))
  const b = [...String(right)].map(value => value.codePointAt(0))
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
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
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && same(Object.keys(value).sort(compareCodePoints), keys.slice().sort(compareCodePoints))
const assert = (condition, label) => { if (!condition) throw new Error(label) }
const frameBytes = bytes => { const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length); return Buffer.concat([length, bytes]) }
const frame = value => frameBytes(Buffer.from(String(value), 'utf8'))
const u64 = value => { const bytes = Buffer.alloc(8); bytes.writeBigUInt64BE(BigInt(value)); return bytes }

const holdOutput = r69 => ({
  schema_version: r69.dispatch_output_schema.schema_version,
  status: 'hold',
  hold_code: 'evaluator_artifact_hold',
  writes: [],
  result: null,
  evidence_rows: [],
})

function decodeCanonical(b64url, expectedSha, label) {
  const bytes = Buffer.from(b64url, 'base64url')
  assert(bytes.toString('base64url') === b64url, `${label}:base64url`)
  assert(sha256(bytes) === expectedSha, `${label}:sha256`)
  const text = bytes.toString('utf8')
  let value
  try { value = JSON.parse(text) } catch { throw new Error(`${label}:json`) }
  assert(text === canonical(value), `${label}:canonical`)
  return { bytes, value }
}

function computeSetSeal(contract, fixture, members) {
  const identityAuthority = contract.set_member_identity_encoding
  const sealAuthority = contract.set_seal_encoding
  const projectionFields = ['evaluator_id', 'policy_lineage_ref', 'active_from']
  assert(identityAuthority.domain_ascii === 'CTRL-G24-SET-MEMBER-IDENTITY-R6', 'selection:set_member_domain')
  assert(sealAuthority.domain_ascii === 'CTRL-G24-SET-SEAL-R6', 'selection:set_seal_domain')
  assert(same(contract.set_member_identity_projections.evaluator_registry, projectionFields), 'selection:set_projection')
  const entries = members.map(member => {
    const projectionValues = projectionFields.map(field => member[field])
    const identityBytes = Buffer.concat([Buffer.from(identityAuthority.domain_ascii, 'ascii'), frame(fixture.set_kind), ...projectionValues.map(frame)])
    const rawCompleteRecordSha256 = sha256(Buffer.from(canonical(member), 'utf8'))
    return {
      identity_projection_values: projectionValues,
      identity_bytes_b64url: identityBytes.toString('base64url'),
      identity_bytes_sha256: sha256(identityBytes),
      raw_complete_record_sha256: rawCompleteRecordSha256,
      encoded_entry: Buffer.concat([frameBytes(identityBytes), Buffer.from(rawCompleteRecordSha256, 'hex')]),
    }
  })
  entries.sort((left, right) => Buffer.compare(Buffer.from(left.identity_bytes_b64url, 'base64url'), Buffer.from(right.identity_bytes_b64url, 'base64url')) || Buffer.compare(Buffer.from(left.raw_complete_record_sha256, 'hex'), Buffer.from(right.raw_complete_record_sha256, 'hex')))
  assert(new Set(entries.map(entry => entry.identity_bytes_b64url)).size === entries.length, 'selection:set_duplicate_identity')
  const preimage = Buffer.concat([Buffer.from(sealAuthority.domain_ascii, 'ascii'), frame(fixture.set_kind), frame(fixture.set_schema_version), frame(fixture.owner_lineage_version), u64(entries.length), ...entries.map(entry => entry.encoded_entry)])
  return {
    set_kind: fixture.set_kind,
    set_schema_version: fixture.set_schema_version,
    owner_lineage_version: fixture.owner_lineage_version,
    canonical_member_count: entries.length,
    sorted_member_entries: entries.map(({ encoded_entry, ...entry }) => ({ ...entry, encoded_entry_b64url: encoded_entry.toString('base64url') })),
    exact_preimage_b64url: preimage.toString('base64url'),
    exact_preimage_sha256: sha256(preimage),
    computed_set_seal: sha256(preimage),
  }
}

function verifyMember(contract, wrapper) {
  const schema = contract.evaluator_abi.registry_member_schema
  const identity = contract.authority_operation_evaluator_registry_member_identity
  const member = wrapper.member_value
  assert(schema.schema_version === 'ctrl.g24.evaluator-registry-member.r65.v1', 'selection:member_schema')
  assert(schema.additional_properties === false && exactKeys(member, schema.exact_keys), 'selection:member_keys')
  for (const field of schema.required) assert(Object.hasOwn(member, field), `selection:member_required:${field}`)
  const { row_version_ref, registry_member_fingerprint, ...core } = member
  assert(row_version_ref === hash({ domain_ascii: identity.row_version.domain_ascii, member_without_row_version_ref_or_registry_member_fingerprint: core }), 'selection:member_row_version')
  assert(registry_member_fingerprint === hash({ domain_ascii: identity.fingerprint.domain_ascii, member_without_registry_member_fingerprint: { ...core, row_version_ref } }), 'selection:member_fingerprint')
  const decoded = decodeCanonical(wrapper.canonical_member_bytes_b64url, wrapper.canonical_member_bytes_sha256, 'selection:member_bytes')
  assert(same(decoded.value, member), 'selection:member_value')
  assert(wrapper.member_content_ref === wrapper.canonical_member_bytes_sha256, 'selection:member_content_ref')
  assert(wrapper.member_row_version_ref === row_version_ref && wrapper.member_fingerprint === registry_member_fingerprint, 'selection:member_wrapper_identity')
  assert(wrapper.registry_member_schema_ref === 'evaluator_abi.registry_member_schema' && wrapper.registry_member_schema_version === schema.schema_version, 'selection:member_schema_binding')
}

function selectionMatches(contract, snapshot, query) {
  const operations = Object.keys(contract.operation_specs).sort(compareCodePoints)
  if (!operations.includes(query.operation_class)) return []
  return snapshot.members.filter(wrapper => {
    const member = wrapper.member_value
    return member.policy_lineage_ref === query.policy_lineage_ref &&
      member.active_from <= query.evaluated_at && query.evaluated_at < member.active_until &&
      Object.hasOwn(member.operation_result_exports, query.operation_class) &&
      member.operation_result_exports[query.operation_class] === contract.result_payload_schemas[query.operation_class].schema_version &&
      member.operation_result_exports[query.operation_class] === contract.evaluator_abi.operation_result_exports[query.operation_class] &&
      same(member.proof_family_exports, contract.evaluator_abi.proof_family_exports)
  })
}

export function verifyR66LifecycleSelection(contract, r69, recordOverride) {
  const operation = 'evaluate_lifecycle_preconditions'
  const parity = contract.authority_operation_evaluator_export_parity_proof
  const registry = parity.complete_evaluator_registry_snapshot
  const decodedSnapshot = decodeCanonical(registry.canonical_snapshot_bytes_b64url, registry.canonical_snapshot_bytes_sha256, 'selection:snapshot')
  assert(registry.snapshot_content_ref === registry.canonical_snapshot_bytes_sha256, 'selection:snapshot_ref')
  assert(same(decodedSnapshot.value, registry.snapshot_value), 'selection:snapshot_value')
  assert(registry.snapshot_value.members.length === 1, 'selection:member_count')
  for (const wrapper of registry.snapshot_value.members) verifyMember(contract, wrapper)
  assert(same(registry.snapshot_value.evaluator_registry_set_seal, computeSetSeal(contract, registry.snapshot_value.evaluator_registry_set_seal, registry.snapshot_value.members.map(wrapper => wrapper.member_value))), 'selection:set_seal')

  const authority = contract.authority_operation_evaluator_registry_selection
  assert(same(authority.locked_selection_key, ['operation_class', 'policy_lineage_ref', 'evaluated_at']), 'selection:three_key')
  const frozenRecord = authority.selection_records.find(record => record.operation_class === operation)
  const record = recordOverride ?? frozenRecord
  assert(record && record.operation_class === operation, 'selection:operation_record')
  const query = record.query
  const proof = record.proof
  assert(exactKeys(query, authority.selection_query_schema.exact_keys), 'selection:query_keys')
  assert(query.schema_version === authority.selection_query_schema.schema_version && query.operation_class === operation, 'selection:query_schema_operation')
  assert(query.policy_lineage_ref === registry.snapshot_value.policy_lineage_ref && query.evaluated_at === registry.snapshot_value.evaluated_at, 'selection:query_policy_time')
  const { selection_query_fingerprint, ...queryCore } = query
  assert(selection_query_fingerprint === hash({ domain_ascii: authority.selection_query_fingerprint_authority.domain_ascii, selection_query_without_fingerprint: queryCore }), 'selection:query_fingerprint')
  const matches = selectionMatches(contract, registry.snapshot_value, query)
  assert(matches.length === 1, 'selection:exact_one_match')
  assert(exactKeys(proof, authority.selection_proof_schema.exact_keys), 'selection:proof_keys')
  assert(proof.schema_version === authority.selection_proof_schema.schema_version, 'selection:proof_schema')
  assert(proof.selection_query_fingerprint === query.selection_query_fingerprint, 'selection:proof_query')
  assert(proof.operation_class === query.operation_class && proof.policy_lineage_ref === query.policy_lineage_ref && proof.evaluated_at === query.evaluated_at, 'selection:proof_three_key')
  assert(proof.source_snapshot_ref === registry.snapshot_content_ref && proof.source_snapshot_sha256 === registry.canonical_snapshot_bytes_sha256, 'selection:proof_snapshot')
  assert(proof.source_registry_set_seal === registry.snapshot_value.evaluator_registry_set_seal.computed_set_seal, 'selection:proof_set_seal')
  assert(proof.selected_match_count === 1, 'selection:proof_count')
  assert(proof.selected_member_content_ref === matches[0].member_content_ref && proof.selected_member_row_version_ref === matches[0].member_row_version_ref && proof.selected_member_fingerprint === matches[0].member_fingerprint, 'selection:proof_member')
  const resultVersion = contract.result_payload_schemas[operation].schema_version
  assert(resultVersion === 'ctrl.g24.result.evaluate-lifecycle-preconditions.r63.v1', 'selection:R63_result')
  assert(contract.operation_specs[operation].result_schema === resultVersion && contract.evaluator_abi.operation_result_exports[operation] === resultVersion, 'selection:operation_export')
  assert(matches[0].member_value.operation_result_exports[operation] === resultVersion, 'selection:member_export')
  assert(parity.evaluator_manifest_artifact.manifest_value.operation_result_exports[operation] === resultVersion, 'selection:manifest_export')
  assert(parity.evaluator_metadata_descriptor_artifact.descriptor_value.operation_result_exports[operation] === resultVersion, 'selection:descriptor_export')
  assert(proof.selected_result_schema_version === resultVersion, 'selection:proof_export')
  assert(proof.selection_predicate === 'all_three_locked_selection_key_components_and_exact_per_operation_abi_export_compatibility' && proof.compatible_metadata_selection_is_not_execution_authority === true, 'selection:predicate_boundary')
  const { selection_proof_fingerprint, ...proofCore } = proof
  assert(selection_proof_fingerprint === hash({ domain_ascii: authority.selection_proof_fingerprint_authority.domain_ascii, selection_proof_without_fingerprint: proofCore }), 'selection:proof_fingerprint')

  const descriptor = parity.evaluator_metadata_descriptor_artifact
  const decodedDescriptor = decodeCanonical(descriptor.canonical_descriptor_bytes_b64url, descriptor.canonical_descriptor_bytes_sha256, 'selection:descriptor')
  assert(same(decodedDescriptor.value, descriptor.descriptor_value), 'selection:descriptor_value')
  assert(descriptor.descriptor_content_ref === descriptor.canonical_descriptor_bytes_sha256, 'selection:descriptor_ref')
  assert(descriptor.semantic_scope === 'compatibility_metadata_only_not_executable_behavior', 'selection:descriptor_scope')
  assert(descriptor.executable_content_ref === 'UNAVAILABLE' && descriptor.executable_entrypoint === 'UNAVAILABLE' && descriptor.executable_module_format === 'UNAVAILABLE', 'selection:descriptor_not_code')
  assert(r69.executable_artifact.descriptor_content_ref === descriptor.descriptor_content_ref && r69.executable_artifact.descriptor_bytes_sha256 === descriptor.canonical_descriptor_bytes_sha256, 'selection:R69_descriptor_binding')

  const binding = r69.r66_selection_binding
  assert(same(binding, {
    schema_version: 'ctrl.g24.evaluator-selection-binding.r69.v1',
    operation_class: operation,
    query_schema_version: authority.selection_query_schema.schema_version,
    query_fingerprint: query.selection_query_fingerprint,
    proof_schema_version: authority.selection_proof_schema.schema_version,
    proof_fingerprint: proof.selection_proof_fingerprint,
    policy_lineage_ref: query.policy_lineage_ref,
    evaluated_at: query.evaluated_at,
    snapshot_ref: registry.snapshot_content_ref,
    snapshot_sha256: registry.canonical_snapshot_bytes_sha256,
    registry_set_seal: registry.snapshot_value.evaluator_registry_set_seal.computed_set_seal,
    member_content_ref: matches[0].member_content_ref,
    member_row_version_ref: matches[0].member_row_version_ref,
    member_fingerprint: matches[0].member_fingerprint,
    selected_result_schema_version: resultVersion,
    proof_declares_metadata_selection_is_not_execution_authority: true,
    verified_before_executable_bytes_are_loaded: true,
  }), 'selection:R69_binding')
  return true
}

const BANNED_IDENTIFIERS = new Set([
  'Bun', 'BroadcastChannel', 'Date', 'Deno', 'EventSource', 'Function', 'SharedWorker',
  'WebSocket', 'Worker', 'XMLHttpRequest', 'clearImmediate', 'clearInterval', 'clearTimeout',
  'console', 'document', 'eval', 'fetch', 'globalThis', 'location', 'navigator', 'performance',
  'process', 'queueMicrotask', 'require', 'setImmediate', 'setInterval', 'setTimeout', 'window',
])

export function inspectExecutableSource(sourceText, entrypoint) {
  const file = ts.createSourceFile('g24-lifecycle-precondition-evaluator.r69.mjs', sourceText, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS)
  assert(file.parseDiagnostics.length === 0, 'source:parse')
  let importCount = 0
  let exportedEntrypoints = []
  const visit = node => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) importCount += 1
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) importCount += 1
    if (ts.isIdentifier(node) && BANNED_IDENTIFIERS.has(node.text)) throw new Error(`source:banned_identifier:${node.text}`)
    if (ts.isPropertyAccessExpression(node) && ((node.expression.getText(file) === 'Math' && node.name.text === 'random') || node.expression.getText(file) === 'crypto')) throw new Error('source:ambient_random_or_crypto')
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) && node.name) exportedEntrypoints.push(node.name.text)
    if (ts.isExportAssignment(node) || ts.isExportDeclaration(node)) throw new Error('source:unsupported_export')
    ts.forEachChild(node, visit)
  }
  visit(file)
  assert(importCount === 0, 'source:imports_forbidden')
  assert(same(exportedEntrypoints.sort(compareCodePoints), [entrypoint]), 'source:exact_export')
  const initializerHasImmediateEffect = node => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return false
    if (ts.isCallExpression(node) || ts.isNewExpression(node) || ts.isTaggedTemplateExpression(node) || ts.isAwaitExpression(node) || ts.isYieldExpression(node) || ts.isDeleteExpression(node) || ts.isPostfixUnaryExpression(node)) return true
    if (ts.isPrefixUnaryExpression(node) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)) return true
    if (ts.isBinaryExpression(node) && ts.isAssignmentOperator(node.operatorToken.kind)) return true
    let effect = false
    ts.forEachChild(node, child => { if (!effect && initializerHasImmediateEffect(child)) effect = true })
    return effect
  }
  for (const statement of file.statements) {
    const allowed = ts.isVariableStatement(statement) || ts.isFunctionDeclaration(statement)
    assert(allowed, 'source:top_level_effect')
    if (ts.isVariableStatement(statement)) {
      assert((statement.declarationList.flags & ts.NodeFlags.Const) !== 0, 'source:top_level_mutable_binding')
      assert(!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword), 'source:extra_export')
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.initializer && initializerHasImmediateEffect(declaration.initializer)) throw new Error('source:top_level_effectful_initializer')
      }
    }
  }
  return { import_count: importCount, exact_exports: exportedEntrypoints }
}

function verifyArtifact(r69, executableBytes) {
  const expected = r69.executable_artifact
  const artifact = expected
  const bytesSha = sha256(executableBytes)
  assert(bytesSha === PINNED_SOURCE_SHA256 && executableBytes.length === PINNED_SOURCE_BYTES, 'artifact:hard_pinned_source_identity')
  assert(artifact.schema_version === 'ctrl.g24.evaluator-executable-artifact.r69.v1', 'artifact:schema')
  assert(artifact.source_path === expected.source_path, 'artifact:path')
  assert(artifact.canonical_executable_bytes_sha256 === bytesSha, 'artifact:sha')
  assert(artifact.canonical_executable_bytes_length === executableBytes.length, 'artifact:length')
  assert(artifact.executable_content_ref === bytesSha, 'artifact:content_ref')
  assert(artifact.module_format === 'ecmascript_module_utf8_import_free', 'artifact:module_format')
  assert(artifact.entrypoint === 'dispatchEvaluateLifecyclePreconditionsStructuralR69', 'artifact:entrypoint')
  assert(same(artifact.export_abi, expected.export_abi), 'artifact:export_abi')
  assert(artifact.descriptor_content_ref === expected.descriptor_content_ref && artifact.descriptor_bytes_sha256 === expected.descriptor_bytes_sha256, 'artifact:descriptor_binding')
  assert(artifact.descriptor_is_separate_compatibility_metadata_not_executable_code === true, 'artifact:descriptor_separate')
  assert(artifact.descriptor_bytes_sha256 !== bytesSha && artifact.descriptor_content_ref !== bytesSha, 'artifact:descriptor_not_code')
  const lock = artifact.founder_lock
  assert(lock.schema_version === 'ctrl.g24.evaluator-source-lock.r69.v1' && lock.domain_ascii === 'CTRL-G24-EVALUATOR-SOURCE-LOCK-R69', 'artifact:lock_schema_domain')
  assert(lock.canonical_encoding === 'unicode_codepoint_sorted_canonical_json_utf8', 'artifact:lock_codec')
  const artifactCore = {
    source_path: artifact.source_path,
    source_git_blob_oid: artifact.source_git_blob_oid,
    canonical_executable_bytes_sha256: artifact.canonical_executable_bytes_sha256,
    canonical_executable_bytes_length: artifact.canonical_executable_bytes_length,
    executable_content_ref: artifact.executable_content_ref,
    module_format: artifact.module_format,
    entrypoint: artifact.entrypoint,
    export_abi: artifact.export_abi,
  }
  assert(same(lock.preimage, artifactCore), 'artifact:lock_preimage')
  assert(lock.founder_lock_identity === hash({ schema_version: lock.schema_version, domain_ascii: lock.domain_ascii, canonical_encoding: lock.canonical_encoding, preimage: lock.preimage }), 'artifact:lock_fingerprint')
  assert(lock.founder_lock_identity === expected.founder_lock.founder_lock_identity, 'artifact:pinned_founder_lock')
  inspectExecutableSource(executableBytes.toString('utf8'), artifact.entrypoint)
  return artifact
}

const CHILD_RUNNER = `
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const request = JSON.parse(Buffer.concat(chunks).toString('utf8'))
const moduleValue = await import('data:text/javascript;base64,' + request.source_b64)
const exports = Reflect.ownKeys(moduleValue).filter(key => typeof key === 'string').sort()
if (JSON.stringify(exports) !== JSON.stringify([request.entrypoint])) throw new Error('child_exact_export')
const input = JSON.parse(Buffer.from(request.input_b64, 'base64').toString('utf8'))
const result = await moduleValue[request.entrypoint](input)
process.stdout.write(JSON.stringify(result))
`

export function runIsolatedModule(executableBytes, entrypoint, serializedInput, options = {}) {
  const maxInputBytes = options.maxInputBytes ?? 65536
  const maxRequestBytes = options.maxRequestBytes ?? 131072
  const maxOutputBytes = options.maxOutputBytes ?? 65536
  const timeoutMs = options.timeoutMs ?? 1500
  assert(typeof serializedInput === 'string', 'isolate:serialized_input_required')
  const inputBytes = Buffer.from(serializedInput, 'utf8')
  assert(inputBytes.length <= maxInputBytes, 'isolate:input_bound')
  const inputText = inputBytes.toString('utf8')
  assert(Buffer.from(inputText, 'utf8').equals(inputBytes), 'isolate:input_utf8')
  let parsedInput
  try { parsedInput = JSON.parse(inputText) } catch { throw new Error('isolate:input_json') }
  assert(inputText === canonical(parsedInput), 'isolate:input_canonical')
  const request = Buffer.from(JSON.stringify({ source_b64: executableBytes.toString('base64'), entrypoint, input_b64: inputBytes.toString('base64') }), 'utf8')
  assert(request.length <= maxRequestBytes, 'isolate:request_bound')
  const child = spawnSync(process.execPath, ['--input-type=module', '--eval', CHILD_RUNNER], {
    input: request,
    encoding: 'utf8',
    env: { NODE_NO_WARNINGS: '1' },
    cwd: root,
    timeout: timeoutMs,
    maxBuffer: maxOutputBytes,
    windowsHide: true,
  })
  assert(!child.error, child.error?.code === 'ETIMEDOUT' ? 'isolate:timeout' : 'isolate:error')
  assert(child.status === 0, 'isolate:throw_or_exit')
  assert(Buffer.byteLength(child.stdout, 'utf8') <= maxOutputBytes, 'isolate:output_bound')
  let output
  try { output = JSON.parse(child.stdout) } catch { throw new Error('isolate:output_json') }
  return output
}

function validateClosedDispatch(r69, output) {
  const schema = r69.dispatch_output_schema
  assert(exactKeys(output, schema.exact_keys), 'dispatch:keys')
  assert(output.schema_version === schema.schema_version, 'dispatch:schema')
  assert(['hold', 'verified_not_runnable'].includes(output.status), 'dispatch:status')
  assert(output.hold_code === 'evaluator_artifact_hold', 'dispatch:hold_code')
  assert(Array.isArray(output.writes) && output.writes.length === 0, 'dispatch:no_writes')
  assert(output.result === null, 'dispatch:no_result')
  assert(Array.isArray(output.evidence_rows) && output.evidence_rows.length === 0, 'dispatch:no_evidence_rows')
  return output
}

export function runR69StructuralGate({ r66, r69, executableBytes, dispatchInputText, selectionRecord, isolateOptions } = {}) {
  const pinnedContract = JSON.parse(readFileSync(join(root, DEFAULT_R66_PATH), 'utf8'))
  const pinnedGate = JSON.parse(readFileSync(join(root, DEFAULT_R69_PATH), 'utf8'))
  const contract = r66 ?? pinnedContract
  const gate = r69 ?? pinnedGate
  const bytes = executableBytes ?? readFileSync(join(root, gate.executable_artifact.source_path))
  const inputText = dispatchInputText ?? canonical(gate.sample_dispatch_input)
  try {
    assert(same(contract, pinnedContract), 'contract:not_pinned_R66')
    assert(same(gate, pinnedGate), 'gate:not_pinned_R69')
    verifyR66LifecycleSelection(contract, gate, selectionRecord)
    const verifiedArtifact = verifyArtifact(gate, bytes)
    const options = {
      maxInputBytes: gate.isolated_harness.max_input_bytes,
      maxRequestBytes: gate.isolated_harness.max_request_bytes,
      maxOutputBytes: gate.isolated_harness.max_output_bytes,
      timeoutMs: gate.isolated_harness.timeout_ms,
      ...isolateOptions,
    }
    const first = validateClosedDispatch(gate, runIsolatedModule(bytes, verifiedArtifact.entrypoint, inputText, options))
    const second = validateClosedDispatch(gate, runIsolatedModule(bytes, verifiedArtifact.entrypoint, inputText, options))
    assert(canonical(first) === canonical(second), 'dispatch:nondeterministic_restart')
    return { loaded: true, dispatch: first }
  } catch {
    return { loaded: false, dispatch: holdOutput(gate) }
  }
}

if (process.argv[1] && process.argv[1].endsWith('run-ctrl-g24-lifecycle-evaluator-r69-harness.mjs')) {
  const result = runR69StructuralGate()
  process.stdout.write(`${JSON.stringify(result.dispatch)}\n`)
  if (!result.loaded || result.dispatch.status !== 'verified_not_runnable') process.exitCode = 1
}
