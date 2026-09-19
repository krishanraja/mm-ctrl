import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { types as utilTypes } from 'node:util'
import { materializedR42, materializedR42Output, ownedSnapshotR42, canonicalR42, r42SemanticAuthorityPaths, r42ResourceLimits } from './materialize-ctrl-g24-trusted-ingress-r42.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r42.json'
const failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const shaBytes = bytes => createHash('sha256').update(bytes).digest('hex')
const shaFile = path => shaBytes(read(path))
function ok(message, value) { if (!value) throw new Error(message) }
function codePointCompare(a, b) { const left = [...a].map(char => char.codePointAt(0)), right = [...b].map(char => char.codePointAt(0)); for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]; return left.length - right.length }
function validUnicode(value) { for (let index = 0; index < value.length; index += 1) { const unit = value.charCodeAt(index); if (unit >= 0xd800 && unit <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) return false; index += 1 } else if (unit >= 0xdc00 && unit <= 0xdfff) return false } return true }

// This is intentionally independent of the materializer implementation.
function takeSnapshot(value, path = '$', ancestors = new WeakSet()) {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') { if (!validUnicode(value)) throw new Error(`unicode:${path}`); return value }
  if (typeof value === 'number') { if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error(`number:${path}`); return value }
  if (typeof value !== 'object') throw new Error(`unsupported:${path}`)
  if (utilTypes.isProxy(value)) throw new Error(`proxy:${path}`)
  if (ancestors.has(value)) throw new Error(`cycle:${path}`)
  const array = Array.isArray(value), prototype = Object.getPrototypeOf(value)
  if ((array && prototype !== Array.prototype) || (!array && prototype !== Object.prototype && prototype !== null)) throw new Error(`prototype:${path}`)
  let keys
  try { keys = Reflect.ownKeys(value) } catch { throw new Error(`reflect:${path}`) }
  if (keys.some(key => typeof key === 'symbol')) throw new Error(`symbol:${path}`)
  ancestors.add(value)
  if (array) {
    const expected = new Set(['length', ...Array.from({ length: value.length }, (_, index) => String(index))])
    if (keys.length !== expected.size || keys.some(key => !expected.has(key))) throw new Error(`array_keys:${path}`)
    const output = []
    for (let index = 0; index < value.length; index += 1) {
      let descriptor
      try { descriptor = Reflect.getOwnPropertyDescriptor(value, String(index)) } catch { throw new Error(`descriptor:${path}[${index}]`) }
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.get || descriptor.set) throw new Error(`array_descriptor:${path}[${index}]`)
      output.push(takeSnapshot(descriptor.value, `${path}[${index}]`, ancestors))
    }
    ancestors.delete(value)
    return Object.freeze(output)
  }
  const output = Object.create(null)
  for (const key of keys) {
    if (!validUnicode(key)) throw new Error(`unicode_key:${path}`)
    let descriptor
    try { descriptor = Reflect.getOwnPropertyDescriptor(value, key) } catch { throw new Error(`descriptor:${path}.${key}`) }
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.get || descriptor.set) throw new Error(`object_descriptor:${path}.${key}`)
    output[key] = takeSnapshot(descriptor.value, `${path}.${key}`, ancestors)
  }
  ancestors.delete(value)
  return Object.freeze(output)
}
function canonicalSnapshot(value) { if (value === null || typeof value !== 'object') return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonicalSnapshot).join(',')}]`; return `{${Object.keys(value).sort(codePointCompare).map(key => `${JSON.stringify(key)}:${canonicalSnapshot(value[key])}`).join(',')}}` }
function canonical(value) { return canonicalSnapshot(takeSnapshot(value)) }
const canonicalSha = value => shaBytes(Buffer.from(canonical(value), 'utf8'))
const same = (a, b) => canonical(a) === canonical(b)
function resolvePath(object, path) { let value = object; for (const part of path.split('.')) { if (!value || !Object.hasOwn(value, part)) return undefined; value = value[part] } return value }
function schemaAt(contract, schemaRef, variant = 'UNAVAILABLE') { let schema = resolvePath(contract, schemaRef); if (variant !== 'UNAVAILABLE') schema = schema?.variants?.[variant]; return schema }
function semanticVersion(path, value) { return value?.schema_version ?? `ctrl.g24.runtime-semantic.${path.replaceAll('_', '-')}.r42.v1` }
function kindOf(value) { return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value === 'object' ? 'object' : typeof value }
function keysetOf(value) { if (Array.isArray(value)) return [`$array_length:${value.length}`]; if (value && typeof value === 'object') return Object.keys(value).sort(codePointCompare); return ['$scalar'] }
function transitive(graph, path) { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(codePointCompare) }

const expectedParent = { commit: 'a52ca705f1e0ff4dc2b6354a1b0d4fea64b9c8f9', tree: '3c4ac97b483e6a1b11670531a04384655944154b', human_blob: '46edaf251c4afecb088568f6962f3b5ef082cf70', machine_blob: 'e0efc391d87e9b851fc8e96cc8101f9725e45f45', qa_blob: '906324acc1368e3aa8e6a3571b18589aeb7c43ed', checker_blob: 'f2ff6749f6e7a324148076d294b15ef9a8f63efa', materializer_blob: '95d813d5f19ddb7d449bb4e084bd848d485633f2', founder_checker_blob: '9ed048bb245ba27a8eb0c1730e91faf4a691e924', adjudication: 'veto' }
const frozenR41 = { machine: 'd9631f1a458ec635a594a90066f6efb7a6449bd3840490b54c80b51398e865f2', materializer: '94cb07209100d3585b9add9a47338e707e938787ee297c6d8ad924e78a6b4cf3', checker: 'b55bc9502166dfa1286e56ec6be57b6fa75976270441fffd8f2240c0ce16c03c', human: 'ed0e8280ab076bdf839d18eadafcb29d0873164ec2637795e3f07a2107f4d17d', qa: 'a1c0b6ea4fad02019bf210144f135885c8c5a9da6445efb32335458bc3586171' }
const expected = { paths: '3a35335e74bde4e5f50caa5b1d8465111f2daf114f42583feecbd82c0da284d3', rows: '501244c0e55cefd64fe99c797904a8dd9a89cedf127cb63babec83a7356e7453', graph: 'aa2fc43ab0c8430e1216a06cc9c611be7fa6fbfb86b045c19454c2ed0b7df521', envelope: '05997037a24b0a46c968090644c9ebe6fa865c38deb3e5d6cc59fc55f3a1c41a', depmap: '79da15151a8dc7831ef3d94ead60ed628a5fae4dcda6db3dd87247b2c5f19869', refrows: '51b66c03d2d456fec5f3a35ecd95d6a63c1f3b99454cfc85722f310bc41bc0e7', refspec: '2e30037180407084b0a827c7edbed8a4d879161354e7f3ab03f9ad916157f64b', topLevel: '63c1068551959ff35189f7d2fa76369bedfdc649dad2905483c1662c65f9231e', fixtures: '6b7314d7343c93b585def662a04d7d9e5f6d5e6cbd12c5bc4391dad92ff993d6', correlations: '03295d163aff8645116a20745c2fa237a54f5e37d60ca671d7752d163fb89565' }
const hashVersion = 'ctrl.g24.runtime-semantic-authority-manifest-hash.r42.v1'
function contentHash(path, value) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-CONTENT-R42', manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: takeSnapshot(value) }) }
function dependencyHash(path, scope, rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-DEPENDENCIES-R42', manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows }) }
function graphHash(rows) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-GRAPH-R42', manifest_hash_version: hashVersion, manifest_rows: rows }) }
function envelopeHash(manifest) { return canonicalSha({ domain_ascii: 'CTRL-G24-RUNTIME-SEMANTIC-MANIFEST-ENVELOPE-R42', manifest_hash_version: hashVersion, manifest_without_envelope_seal: manifest }) }

function validateSpec(value, spec, path) {
  if (Object.hasOwn(spec ?? {}, 'const')) { ok(`const ${path}`, value === spec.const); return }
  if (Array.isArray(spec?.enum)) { ok(`enum ${path}`, spec.enum.includes(value)); return }
  if (spec?.type === 'enum') { ok(`typed enum ${path}`, Array.isArray(spec.values) && spec.values.includes(value)); return }
  if (spec?.type === 'sha256') { ok(`sha ${path}`, typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)); return }
  if (spec?.type === 'sha256_or_exact_literal') { ok(`sha/literal ${path}`, value === spec.literal || (typeof value === 'string' && /^[0-9a-f]{64}$/.test(value))); return }
  if (spec?.type === 'identifier') { ok(`identifier ${path}`, typeof value === 'string' && value.length > 0); return }
  if (spec?.type === 'canonical_timestamp') { ok(`timestamp ${path}`, typeof value === 'string' && new Date(value).toISOString() === value); return }
  if (spec?.type === 'nonnegative_integer') { ok(`nonnegative ${path}`, Number.isInteger(value) && value >= 0 && !Object.is(value, -0)); return }
  if (spec?.type === 'positive_integer') { ok(`positive ${path}`, Number.isInteger(value) && value > 0); return }
  if (spec?.type === 'integer') { ok(`integer ${path}`, Number.isInteger(value) && !Object.is(value, -0)); return }
  if (spec?.type === 'boolean') { ok(`boolean ${path}`, typeof value === 'boolean'); return }
  if (String(spec?.type).includes('array')) { ok(`array ${path}`, Array.isArray(value)); return }
  if (spec?.schema_ref) { ok(`schema ref ${path}`, typeof value === 'string' && value.length > 0); return }
  throw new Error(`unsupported schema form:${path}:${canonical(spec)}`)
}
function validateArtifact(contract, artifact) {
  const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value
  ok('schema exists', schema && schema.type === 'object' && schema.additional_properties === false)
  ok('exact keys', same(Object.keys(row), schema.exact_keys) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))))
  for (const [field, spec] of Object.entries(schema.properties)) validateSpec(row[field], spec, `${artifact.fixture_artifact_id}.${field}`)
  const normative = artifact.normative_row_ref_preimage !== 'UNAVAILABLE'
  const rowRefField = artifact.schema_variant.startsWith('original_') ? 'registry_row_ref' : 'hold_row_ref'
  const fingerprintField = schema.fingerprint_field
  if (normative) {
    const included = schema.row_ref_preimage_included_fields
    ok('normative included fields', Array.isArray(included) && included.length > 0)
    if (rowRefField === 'registry_row_ref') ok('registry exclusions exact', same(schema.row_ref_preimage_excluded_fields, ['registry_row_ref', 'registry_fingerprint']) && same(included, schema.exact_keys.filter(field => !['registry_row_ref', 'registry_fingerprint'].includes(field))))
    const expectedIdentity = { domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: included.map(field => ({ field, value: row[field] })) }
    ok('identity preimage', same(expectedIdentity, artifact.normative_row_ref_preimage))
    ok('row ref', row[rowRefField] === canonicalSha(expectedIdentity))
  }
  ok('canonical bytes', artifact.canonical_row_bytes_utf8 === canonical(row))
  ok('bytes sha', artifact.canonical_row_bytes_sha256 === shaBytes(Buffer.from(artifact.canonical_row_bytes_utf8, 'utf8')))
  const fingerprintSchema = resolvePath(contract, artifact.fingerprint_schema_ref), expectedPreimage = {}
  ok('fingerprint schema ref', fingerprintSchema && schema.fingerprint_ref === artifact.fingerprint_schema_ref)
  for (const field of fingerprintSchema.preimage_order) { ok(`fingerprint operand ${field}`, field === 'domain_ascii' || Object.hasOwn(row, field)); expectedPreimage[field] = field === 'domain_ascii' ? fingerprintSchema.domain_ascii : row[field] }
  ok('fingerprint preimage', same(expectedPreimage, artifact.fingerprint_preimage))
  ok('fingerprint', artifact.recorded_fingerprint === canonicalSha(expectedPreimage) && row[fingerprintField] === artifact.recorded_fingerprint)
  for (const prefix of ['raw_target', 'raw_proof', 'raw_bundle', 'raw_issuer_proof', 'raw_evaluator_proof']) if (Object.hasOwn(row, `${prefix}_availability`)) { const unavailable = row[`${prefix}_availability`] === 'unavailable'; ok(`availability ${prefix}`, unavailable === (row[`${prefix}_ref_or_unavailable`] === 'UNAVAILABLE' && row[`${prefix}_sha256_or_unavailable`] === 'UNAVAILABLE')) }
  return row
}
function selection(row) { return { fresh_selection_row_id: row.fresh_selection_row_id, proof_family: row.proof_family, branch_class: row.branch_class, evidence_kind: row.evidence_kind, fresh_selection_schema_version: row.fresh_selection_schema_version } }
function runRestart(contract, fixture) {
  const registry = validateArtifact(contract, fixture.registry_artifact), recovered = selection(registry)
  const expectedTarget = fixture.operation_name === 'bootstrap_case_session_root_anchor' ? 'case_session_root_trust_anchors' : 'case_server_session_principal_evidence'
  ok('operation target store', registry.target_store === expectedTarget)
  if (fixture.hold_artifact_or_UNAVAILABLE !== 'UNAVAILABLE') {
    const hold = validateArtifact(contract, fixture.hold_artifact_or_UNAVAILABLE)
    ok('registry/hold operation', registry.operation_id === hold.operation_id && registry.idempotency_key === hold.idempotency_key && registry.operation_name === hold.operation_name && registry.target_store === hold.target_store)
    ok('registry/hold selection', same(recovered, selection(hold)))
    ok('registry/hold identity', registry.hold_row_ref === hold.hold_row_ref && registry.hold_fingerprint === hold.hold_fingerprint)
  }
  ok('expected selection', same(recovered, fixture.expected_reconstructed_selection))
  const classifier = fixture.classifier_row
  ok('classifier exact', classifier.operation_name === fixture.operation_name && classifier.result_branch === fixture.result_branch && classifier.expected_selection_row_id === recovered.fresh_selection_row_id && classifier.expected_proof_family === recovered.proof_family && classifier.expected_branch_class === recovered.branch_class && classifier.expected_evidence_kind === recovered.evidence_kind && classifier.expected_selector_version === recovered.fresh_selection_schema_version)
  return recovered
}

function artifactTriple(artifact) { return { ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint } }
function rowTriple(prefix, row) { return { ref: row[`${prefix}_ref`], bytes_sha256: row[`${prefix}_bytes_sha256`], fingerprint: row[`${prefix}_fingerprint`] } }
function verifyLineage(contract, fixture) {
  const registry = validateArtifact(contract, fixture.registry_artifact)
  const history = validateArtifact(contract, fixture.historical_response_artifact)
  const payload = validateArtifact(contract, fixture.replay_payload_artifact)
  const envelope = validateArtifact(contract, fixture.replay_envelope_artifact)
  const result = fixture.result_artifact
  ok('request fingerprint join', fixture.request_fingerprint === registry.request_fingerprint)
  ok('request artifact join', registry.request_bytes_ref === fixture.request_artifact.ref && registry.request_bytes_sha256 === fixture.request_artifact.bytes_sha256)
  ok('operation join', [history.operation_name, payload.operation_name, envelope.operation_name].every(value => value === registry.operation_name))
  ok('operation id join', [history.operation_id, payload.operation_id, envelope.operation_id].every(value => value === registry.operation_id))
  ok('branch join', [history.result_branch, payload.historical_result_branch, envelope.historical_result_branch].every(value => value === fixture.result_branch))
  ok('result join', same({ ref: history.result_ref, bytes_sha256: history.result_bytes_sha256, fingerprint: history.result_fingerprint }, result) && same({ ref: payload.historical_result_ref, bytes_sha256: payload.historical_result_bytes_sha256, fingerprint: payload.historical_result_fingerprint }, result))
  ok('history join', same(rowTriple('historical_response', registry), artifactTriple(fixture.historical_response_artifact)) && same({ ref: payload.stored_historical_response_ref, bytes_sha256: payload.stored_historical_response_bytes_sha256, fingerprint: payload.stored_historical_response_fingerprint }, artifactTriple(fixture.historical_response_artifact)))
  ok('payload join', same({ ref: envelope.payload_ref, bytes_sha256: envelope.payload_bytes_sha256, fingerprint: envelope.payload_fingerprint }, artifactTriple(fixture.replay_payload_artifact)))
  ok('envelope response join', same({ ref: envelope.replay_response_ref, bytes_sha256: envelope.replay_response_bytes_sha256, fingerprint: envelope.replay_response_fingerprint }, artifactTriple(fixture.historical_response_artifact)))
  if (fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE') {
    ok('committed result join', same({ ref: registry.result_ref, bytes_sha256: registry.result_bytes_sha256, fingerprint: registry.result_fingerprint }, result))
    ok('committed registry join', payload.committed_registry_row_ref === registry.registry_row_ref && payload.committed_registry_row_fingerprint === registry.registry_fingerprint)
  } else {
    const hold = validateArtifact(contract, fixture.hold_artifact_or_UNAVAILABLE)
    ok('held request join', hold.request_artifact_ref === fixture.request_artifact.ref && hold.request_artifact_sha256 === fixture.request_artifact.bytes_sha256 && hold.request_fingerprint === fixture.request_fingerprint)
    ok('held identity join', registry.operation_id === hold.operation_id && registry.idempotency_key === hold.idempotency_key)
    ok('held result join', same({ ref: hold.result_ref, bytes_sha256: hold.result_bytes_sha256, fingerprint: hold.result_fingerprint }, result) && same({ ref: registry.hold_result_ref, bytes_sha256: registry.hold_result_bytes_sha256, fingerprint: registry.hold_result_fingerprint }, result))
    ok('hold authority join', registry.hold_row_ref === hold.hold_row_ref && registry.hold_fingerprint === hold.hold_fingerprint && payload.hold_row_ref === hold.hold_row_ref && payload.hold_row_fingerprint === hold.hold_fingerprint)
    ok('held registry join', payload.held_registry_row_ref === registry.registry_row_ref && payload.held_registry_row_fingerprint === registry.registry_fingerprint)
    ok('held time join', registry.held_at === hold.held_at && payload.held_at === hold.held_at)
    if (hold.hold_kind === 'session_dual_proof') {
      const evidenceArtifact = fixture.session_evidence_or_UNAVAILABLE.artifact
      const evidence = validateArtifact(contract, evidenceArtifact)
      const evidenceTriple = artifactTriple(evidenceArtifact)
      ok('session evidence join', same({ ref: registry.session_hold_evidence_ref_or_unavailable, bytes_sha256: registry.session_hold_evidence_bytes_sha256_or_unavailable, fingerprint: registry.session_hold_evidence_fingerprint_or_unavailable }, evidenceTriple) && same({ ref: hold.session_hold_evidence_ref, bytes_sha256: hold.session_hold_evidence_bytes_sha256, fingerprint: hold.session_hold_evidence_fingerprint }, evidenceTriple))
      if (registry.evidence_kind === 'verified_session_hold_evidence') {
        ok('verified two nonces', fixture.proof_and_nonce_evidence.exact_nonce_count === 2)
        ok('issuer proof join', evidence.issuer_proof_ref === fixture.proof_and_nonce_evidence.issuer_proof.ref && evidence.issuer_proof_fingerprint === fixture.proof_and_nonce_evidence.issuer_proof.fingerprint)
        ok('evaluator proof join', evidence.evaluator_proof_ref === fixture.proof_and_nonce_evidence.evaluator_proof.ref && evidence.evaluator_proof_fingerprint === fixture.proof_and_nonce_evidence.evaluator_proof.fingerprint)
        ok('nonce joins', evidence.issuer_nonce_receipt_ref === fixture.proof_and_nonce_evidence.issuer_nonce_receipt.ref && evidence.evaluator_nonce_receipt_ref === fixture.proof_and_nonce_evidence.evaluator_nonce_receipt.ref)
      } else {
        ok('raw zero nonces', fixture.proof_and_nonce_evidence.exact_nonce_count === 0)
        ok('raw role joins', evidence.raw_bundle_ref_or_unavailable === hold.raw_bundle_ref_or_unavailable && evidence.raw_evaluator_proof_ref_or_unavailable === hold.raw_evaluator_proof_ref_or_unavailable)
      }
    }
  }
  return runRestart(contract, fixture)
}

const pinnedNonSuffixReferenceFields = new Set(['authority', 'then', 'sole_writer', 'writer', 'source', 'target', 'derivation', 'binding', 'transaction_boundary', 'selected_branch_table', 'selected_matrix', 'selected_result_artifact_store_family'])
const pinnedAliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
function independentlyEnumerateReferences(contract) {
  const paths = contract.authority_runtime_semantic_manifest.exact_paths, pathSet = new Set(paths), excluded = new Set(['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry', 'semantic_reference_field_specification']), rows = [], seen = new Set()
  const tokenized = key => /(^|_)(ref|refs)($|_)/.test(key)
  const ownerFor = (literal, source) => { if (pinnedAliases[literal]) return pinnedAliases[literal]; const normalized = literal.replace(/^\$\./, '').replace('.variants.*.', '.variants.'); let owner = ''; for (const path of paths) if ((normalized === path || normalized.startsWith(`${path}.`)) && path.length > owner.length) owner = path; return owner || source }
  const add = (source, fieldPath, fieldName, literal, pattern) => { const owner = ownerFor(literal, source), key = `${source}|${fieldPath}|${literal}`; if (seen.has(key)) return; seen.add(key); rows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : owner === source ? 'runtime_identity_field_or_field_name_reference' : pattern === 'semantic_value' ? 'semantic_authority_reference' : fieldName.includes('schema') ? 'schema_reference' : literal.includes('*') ? 'discriminated_pattern_reference' : 'typed_reference', reference_literal: literal, owner_authority_path: owner, expected_owner_schema_version: semanticVersion(owner, resolvePath(contract, owner)), specification_pattern_id: pattern }) }
  const walk = (value, source, fieldPath = source) => { if (!value || typeof value !== 'object') return; for (const [key, item] of Object.entries(value)) { const next = `${fieldPath}.${key}`; if (tokenized(key) || pinnedNonSuffixReferenceFields.has(key)) { if (Array.isArray(item)) { for (let index = 0; index < item.length; index += 1) if (typeof item[index] === 'string') add(source, `${next}.${index}`, key, item[index], tokenized(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } else if (typeof item === 'string') add(source, next, key, item, tokenized(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') } if (typeof item === 'string' && ownerFor(item, source) !== source) add(source, next, key, item, 'semantic_value'); walk(item, source, next) } }
  for (const path of paths) { ok(`manifest path ${path}`, pathSet.has(path)); if (!excluded.has(path)) walk(resolvePath(contract, path), path) }
  rows.sort((left, right) => codePointCompare(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
  return rows
}

function collect(contract) {
  const out = [], test = (name, fn) => { try { fn(contract) } catch (error) { out.push(`${name}: ${error.stack}`) } }
  test('identity and closed scope', c => { ok('version', c.schema_version === 'ctrl.g24.trusted-ingress.r42.effective.v1'); ok('parent', same(c.supersedes, expectedParent)); ok('parent sha', c.materialization.frozen_input.sha256 === frozenR41.machine); ok('snapshot authority', c.materialization.snapshot_before_validation_hash_or_use === true && c.authority_runtime_semantic_manifest_hash_contract.hash_input === 'bounded_owned_immutable_snapshot_only'); ok('limits exact', same(c.canonical_snapshot_resource_limits, { schema_version: 'ctrl.g24.canonical-snapshot-resource-limits.r42.v1', ...r42ResourceLimits, array_preflight_order: ['read_own_length_data_descriptor', 'reject_length_above_max_before_ownKeys_or_output_allocation', 'Reflect.ownKeys_once', 'reject_key_count_mismatch_before_output_allocation', 'validate_dense_exact_indices', 'allocate_and_copy'], object_preflight_order: ['Reflect.ownKeys_once', 'reject_key_count_above_max_before_output_allocation', 'validate_own_enumerable_data_descriptors', 'allocate_and_copy'], cumulative_limits_apply_before_next_value_copy: true })); ok('no external change', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, [])) })
  if (out.length) return out
  test('compound and wildcard bindings are exact', c => { ok('old compound removed', !Object.hasOwn(c.case_authority_control_result_union, 'total_result_ref')); const total = c.case_authority_control_result_union.total_result_binding; ok('two variants', total.variants.length === 2 && total.exactly_one_variant === true && total.caller_selectable_variant === false); for (const row of total.variants) { let value = resolvePath(c, row.authority_ref); for (const part of row.result_path) value = value?.[part]; ok('total owner path', Array.isArray(value)) } ok('old wildcard removed', !Object.hasOwn(c.authority_operation_replay_derivation, 'exact_path_order_by_branch_ref')); const bindings = c.authority_operation_replay_derivation.exact_path_order_by_branch_bindings; ok('all replay variants', bindings.length === Object.keys(c.authority_operation_replay_branch_map.variants).length); for (const row of bindings) ok('replay path exists', Array.isArray(resolvePath(c, row.source_authority_ref).variants[row.source_variant][row.source_field])); const text = JSON.stringify(c); ok('no selected variant pseudo ref', !text.includes('.selected_variant') && !text.match(/"(?:source|destination)_schema_ref":"[^"]*selected_variant/)) })
  if (out.length) return out
  test('seven normative artifacts and four complete durable restarts', c => { const fixtureSet = c.authority_operation_replay_restart_fixtures; ok('counts', fixtureSet.fixtures.length === 4 && fixtureSet.registry_and_hold_artifact_count === 7 && fixtureSet.complete_lineage_artifact_count === 21); const artifacts = fixtureSet.fixtures.flatMap(fixture => [fixture.registry_artifact, ...(fixture.hold_artifact_or_UNAVAILABLE === 'UNAVAILABLE' ? [] : [fixture.hold_artifact_or_UNAVAILABLE])]); ok('seven', artifacts.length === 7); artifacts.forEach(artifact => validateArtifact(c, artifact)); const operationIds = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.operation_id), idempotency = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.idempotency_key), registryRefs = fixtureSet.fixtures.map(fixture => fixture.registry_artifact.canonical_row_value.registry_row_ref); ok('unique ids', new Set(operationIds).size === 4 && new Set(idempotency).size === 4 && new Set(registryRefs).size === 4); fixtureSet.fixtures.forEach(fixture => verifyLineage(c, fixture)); ok('correlation coverage', c.authority_operation_restart_correlation_authority.rows.length === 8 && c.authority_operation_restart_correlation_authority.forbidden.includes('resealed_artifact_splice')) })
  if (out.length) return out
  test('independent semantic reference universe is bijective', c => { const registry = c.authority_runtime_semantic_reference_field_registry, independent = independentlyEnumerateReferences(c); ok('source independent', c.semantic_reference_field_specification.source.includes('not_any_R40_or_R41_reference_map')); ok('not suffix only', registry.inference_from_suffix_only === 'forbidden'); ok('closed row schema', registry.row_schema.type === 'object' && registry.row_schema.additional_properties === false && same(registry.row_schema.exact_keys, Object.keys(registry.row_schema.properties))); ok('exact 5236 reference occurrences', registry.exact_expected_occurrence_count === 5236 && registry.exact_occurrence_rows.length === 5236 && c.authority_runtime_semantic_reference_owner_map.row_count === 5236); if (!same(independent, registry.exact_occurrence_rows)) { let index = 0; while (index < Math.min(independent.length, registry.exact_occurrence_rows.length) && same(independent[index], registry.exact_occurrence_rows[index])) index += 1; throw new Error(`independent bijection:${independent.length}:${registry.exact_occurrence_rows.length}:${index}:${canonical(independent[index])}:${canonical(registry.exact_occurrence_rows[index])}`) } const categories = c.semantic_reference_field_specification.required_named_categories; for (const category of ['_ref', '_refs', 'source_refs', 'transaction_boundary_ref', 'selected_branch_table_ref', 'selected_matrix_ref', 'selected_result_artifact_store_family_ref', 'branch_effects_ref', 'field_encoding_ref', 'transition_table_ref', 'total_result_discriminated_compound', 'replay_path_discriminated_pattern', 'semantic_string_without_suffix']) ok(`category ${category}`, categories.includes(category)); ok('substantially closes prior absent scan', registry.exact_occurrence_rows.length > 1295) })
  if (out.length) return out
  test('manifest exact closure', c => { const manifest = c.authority_runtime_semantic_manifest, paths = manifest.exact_paths, depmap = c.authority_runtime_semantic_dependency_owner_map; ok('path parity', same(paths, r42SemanticAuthorityPaths) && manifest.rows.length === paths.length && depmap.rows.length === paths.length); const graph = {}; for (let index = 0; index < paths.length; index += 1) { const path = paths[index], row = manifest.rows[index], owner = depmap.rows[index], value = resolvePath(c, path); ok(`${path} exists`, value !== undefined && row.authority_path === path && owner.authority_path === path); ok(`${path} shape`, row.semantic_kind === kindOf(value) && same(row.exact_keyset, keysetOf(value))); ok(`${path} content`, row.authority_content_sha256 === contentHash(path, value)); ok(`${path} deps`, same(row.direct_dependency_paths, owner.typed_owner_paths)); graph[path] = owner.typed_owner_paths } for (const path of paths) { const row = manifest.rows[paths.indexOf(path)], direct = graph[path].map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })), all = transitive(graph, path).map(owner => ({ authority_path: owner, authority_content_sha256: manifest.rows[paths.indexOf(owner)].authority_content_sha256 })); ok(`${path} direct hash`, same(row.direct_dependency_content_hashes, direct) && row.direct_dependency_set_sha256 === dependencyHash(path, 'direct', direct)); ok(`${path} transitive hash`, same(row.transitive_dependency_content_hashes, all) && row.transitive_dependency_set_sha256 === dependencyHash(path, 'transitive', all)) } ok('graph hash', manifest.manifest_graph_sha256 === graphHash(manifest.rows)); const without = { ...manifest }; delete without.manifest_envelope_seal_sha256; ok('envelope hash', manifest.manifest_envelope_seal_sha256 === envelopeHash(without)); ok('literal pins', canonicalSha(paths) === expected.paths && canonicalSha(manifest.rows) === expected.rows && manifest.manifest_graph_sha256 === expected.graph && manifest.manifest_envelope_seal_sha256 === expected.envelope && canonicalSha(depmap) === expected.depmap && canonicalSha(c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows) === expected.refrows && canonicalSha(c.semantic_reference_field_specification) === expected.refspec && canonicalSha(Object.keys(c).sort(codePointCompare)) === expected.topLevel && canonicalSha(c.authority_operation_replay_restart_fixtures) === expected.fixtures && canonicalSha(c.authority_operation_restart_correlation_authority) === expected.correlations) })
  return out
}

function expectSnapshotReject(name, factory) { try { ownedSnapshotR42(factory()); failures.push(`snapshot accepted:${name}`) } catch {} try { takeSnapshot(factory()); failures.push(`independent snapshot accepted:${name}`) } catch {} }
if (read(machinePath) !== materializedR42Output) failures.push('machine differs from exact materializer')
for (const [path, hash] of Object.entries({ 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r41.json': frozenR41.machine, 'scripts/materialize-ctrl-g24-trusted-ingress-r41.mjs': frozenR41.materializer, 'scripts/check-ctrl-g24-trusted-ingress-r41.mjs': frozenR41.checker, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r41.md': frozenR41.human, 'project-documentation/ctrl-evolution/g24-trusted-ingress-r41-qa-record.md': frozenR41.qa })) if (shaFile(path) !== hash) failures.push(`frozen R41 changed:${path}`)
failures.push(...collect(materializedR42))

const cycle = {}; cycle.self = cycle
const nonEnumerable = {}; Object.defineProperty(nonEnumerable, 'hidden', { value: 1, enumerable: false })
const getter = {}; Object.defineProperty(getter, 'value', { enumerable: true, get() { return 1 } })
const extraArray = [1]; extraArray.named = 2
const sparse = new Array(1)
const symbolKey = { [Symbol('x')]: 1 }
const throwing = new Proxy({}, { ownKeys() { throw new Error('trap') } })
for (const [name, factory] of [['nan', () => ({ x: Number.NaN })], ['positive infinity', () => ({ x: Number.POSITIVE_INFINITY })], ['negative infinity', () => ({ x: Number.NEGATIVE_INFINITY })], ['negative zero', () => ({ x: -0 })], ['undefined', () => ({ x: undefined })], ['bigint', () => ({ x: 1n })], ['function', () => ({ x() {} })], ['symbol value', () => ({ x: Symbol('x') })], ['nonplain', () => new Date()], ['cycle', () => cycle], ['non-enumerable', () => nonEnumerable], ['getter', () => getter], ['extra array key', () => extraArray], ['sparse array', () => sparse], ['symbol key', () => symbolKey], ['proxy', () => new Proxy({}, {})], ['throwing reflection', () => throwing], ['lone surrogate value', () => ({ x: '\ud800' })], ['lone surrogate key', () => ({ ['\udc00']: 1 })]]) expectSnapshotReject(name, factory)
const mutable = { nested: { value: 1 } }, stable = ownedSnapshotR42(mutable), before = canonicalSnapshot(stable); mutable.nested.value = 2; if (canonicalSnapshot(stable) !== before || stable.nested.value !== 1 || !Object.isFrozen(stable) || !Object.isFrozen(stable.nested) || Object.getPrototypeOf(stable) !== null || Object.getPrototypeOf(stable.nested) !== null) failures.push('owned snapshot check/use stability failed')

function expectMaterializerReject(name, factory) { try { ownedSnapshotR42(factory()); failures.push(`bounded snapshot accepted:${name}`) } catch {} }
expectMaterializerReject('million length sparse before allocation', () => new Array(1000000))
expectMaterializerReject('maximum length sparse before allocation', () => new Array(r42ResourceLimits.max_array_length))
expectMaterializerReject('depth above maximum', () => { let value = null; for (let index = 0; index < r42ResourceLimits.max_depth + 2; index += 1) value = { child: value }; return value })
expectMaterializerReject('descriptor trap proxy', () => new Proxy([], { getOwnPropertyDescriptor() { throw new Error('trap') } }))

const pollutionBaseline = canonicalR42({ z: [2, 1], a: 'stable' })
const originalMap = Array.prototype.map
const originalIterator = Array.prototype[Symbol.iterator]
const originalObjectKeys = Object.keys
const originalReflectOwnKeys = Reflect.ownKeys
const originalJSONStringify = JSON.stringify
try {
  Array.prototype.map = function () { throw new Error('polluted map') }
  Array.prototype[Symbol.iterator] = function () { throw new Error('polluted iterator') }
  Object.keys = function () { throw new Error('polluted Object.keys') }
  Reflect.ownKeys = function () { throw new Error('polluted Reflect.ownKeys') }
  JSON.stringify = function () { throw new Error('polluted JSON.stringify') }
  if (canonicalR42({ z: [2, 1], a: 'stable' }) !== pollutionBaseline) failures.push('captured primordial canonical bytes changed after pollution')
  const pollutedStable = ownedSnapshotR42({ a: { b: 1 } })
  if (pollutedStable.a.b !== 1) failures.push('captured primordial snapshot use changed after pollution')
} catch (error) { failures.push(`captured primordial pollution failed:${error.message}`) }
finally {
  Array.prototype.map = originalMap
  Array.prototype[Symbol.iterator] = originalIterator
  Object.keys = originalObjectKeys
  Reflect.ownKeys = originalReflectOwnKeys
  JSON.stringify = originalJSONStringify
}

function resealArtifactPreservingRowRef(contract, artifact) {
  const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value, fpSchema = resolvePath(contract, schema.fingerprint_ref), preimage = {}
  for (const field of fpSchema.preimage_order) preimage[field] = field === 'domain_ascii' ? fpSchema.domain_ascii : row[field]
  row[schema.fingerprint_field] = canonicalSha(preimage)
  artifact.fingerprint_preimage = preimage
  artifact.recorded_fingerprint = row[schema.fingerprint_field]
  artifact.canonical_row_bytes_utf8 = canonical(row)
  artifact.canonical_row_bytes_sha256 = shaBytes(Buffer.from(artifact.canonical_row_bytes_utf8, 'utf8'))
  artifact.content_addressed_artifact_ref = artifact.canonical_row_bytes_sha256
}

const mutations = [
  ['parent forged', c => { c.supersedes.machine_blob = '0'.repeat(40) }],
  ['visible expansion', c => { c.visible_surface_changes.push('admin') }],
  ['external action', c => { c.external_actions_authorized.push('deploy') }],
  ['restore compound pseudo ref', c => { c.case_authority_control_result_union.total_result_ref = 'case_authority_control_pre_admission_and_case_authority_control_operation_registry.admission_outcome_table' }],
  ['caller selects compound', c => { c.case_authority_control_result_union.total_result_binding.caller_selectable_variant = true }],
  ['restore wildcard pseudo ref', c => { c.authority_operation_replay_derivation.exact_path_order_by_branch_ref = 'authority_operation_replay_branch_map.variants.*.replay_path' }],
  ['schema invalid enum', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact.canonical_row_value.target_store = 'invented' }],
  ['schema invalid sha', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].registry_artifact.canonical_row_value.idempotency_key = 'bad' }],
  ['operation target mismatch', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].registry_artifact.canonical_row_value.target_store = 'case_session_root_trust_anchors' }],
  ['extra artifact field', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].registry_artifact.canonical_row_value.extra = true }],
  ['shared operation id', c => { c.authority_operation_replay_restart_fixtures.fixtures[1].registry_artifact.canonical_row_value.operation_id = c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact.canonical_row_value.operation_id }],
  ['fabricated row ref', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact.canonical_row_value.registry_row_ref = '0'.repeat(64) }],
  ['request fingerprint changed while retaining normative row ref', c => { const artifact = c.authority_operation_replay_restart_fixtures.fixtures[0].registry_artifact; artifact.canonical_row_value.request_fingerprint = 'a'.repeat(64); resealArtifactPreservingRowRef(c, artifact) }],
  ['bytes splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].registry_artifact.canonical_row_bytes_utf8 += ' ' }],
  ['fingerprint splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].hold_artifact_or_UNAVAILABLE.recorded_fingerprint = '0'.repeat(64) }],
  ['selection splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[2].hold_artifact_or_UNAVAILABLE.canonical_row_value.evidence_kind = 'raw_session_hold_evidence' }],
  ['proof family splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].classifier_row.expected_proof_family = 'issuer' }],
  ['ordinary request splice resealed', c => { const fixture = c.authority_operation_replay_restart_fixtures.fixtures[1]; fixture.request_artifact = c.authority_operation_replay_restart_fixtures.fixtures[0].request_artifact }],
  ['verified request splice resealed', c => { const fixture = c.authority_operation_replay_restart_fixtures.fixtures[2]; fixture.registry_artifact.canonical_row_value.request_bytes_ref = c.authority_operation_replay_restart_fixtures.fixtures[3].request_artifact.ref; fixture.registry_artifact.canonical_row_value.request_bytes_sha256 = c.authority_operation_replay_restart_fixtures.fixtures[3].request_artifact.bytes_sha256; resealArtifactPreservingRowRef(c, fixture.registry_artifact) }],
  ['raw evidence splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[3].proof_and_nonce_evidence.evaluator_proof = c.authority_operation_replay_restart_fixtures.fixtures[2].proof_and_nonce_evidence.evaluator_proof }],
  ['committed history splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].historical_response_artifact = c.authority_operation_replay_restart_fixtures.fixtures[1].historical_response_artifact }],
  ['reference row deleted', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.pop() }],
  ['reference owner changed', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows[0].owner_authority_path = 'operation_authority' }],
  ['reference vocabulary weakened', c => { c.semantic_reference_field_specification.exact_non_suffix_semantic_fields.pop() }],
  ['unindexed nested semantic reference', c => { c.operation_authority.hidden = { caller_precedence_ref: 'request_schema' } }],
  ['manifest content drift', c => { c.operation_authority.caller_precedence = 'allowed' }],
  ['manifest graph drift', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '0'.repeat(64) }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR42); mutate(candidate); if (!collect(candidate).length) failures.push(`mutation accepted:${name}`) }
if (failures.length) { console.error(`R42 failed ${failures.length}`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R42 and ${mutations.length} contract mutation probes verified`)
console.log('r42_owned_snapshot_rejection_probes=19')
console.log('r42_resource_bound_probes=4')
console.log('r42_primordial_pollution_probes=5')
console.log('r42_schema_valid_artifacts=7/7')
console.log('r42_complete_lineage_artifacts=21/21')
console.log('r42_restart_fixtures=4/4')
console.log(`r42_manifest_rows=${materializedR42.authority_runtime_semantic_manifest.rows.length}`)
console.log(`r42_semantic_reference_rows=${materializedR42.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.length}`)
console.log(`r42_machine_sha256=${shaFile(machinePath)}`)
