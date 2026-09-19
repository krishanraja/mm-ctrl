import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { materializedR46, materializedR46Output, r46SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r46.mjs'
import { materializedR44, canonicalR44, ownedSnapshotR44, r44SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd(), machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r46.json', failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const same = (left, right) => canonicalR44(left) === canonicalR44(right)
const ok = (name, condition) => { if (!condition) throw new Error(name) }
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, path, variant = 'UNAVAILABLE') => { const schema = get(contract, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }

function fingerprint(contract, schema, row) {
  const rule = get(contract, schema.fingerprint_ref), preimage = {}
  ok(`fingerprint schema ${schema.fingerprint_ref}`, rule?.preimage_order)
  for (const field of rule.preimage_order) { ok(`fingerprint operand ${field}`, field === 'domain_ascii' || Object.hasOwn(row, field)); preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field] }
  return { schema_ref: schema.fingerprint_ref, preimage, value: hash(preimage) }
}
function findSchemaVersion(contract, version) { const found = []; const walk = value => { if (!value || typeof value !== 'object') return; if (value.schema_version === version && value.type === 'object' && value.properties) found.push(value); for (const child of Object.values(value)) walk(child) }; walk(contract); const unique = [...new Set(found)]; ok(`unique wrapper schema ${version}`, unique.length === 1); return unique[0] }
function derivedPayload(contract, role, artifact) {
  if (artifact.fixture_wrapper_variant !== 'content_addressed') return fingerprint(contract, schemaAt(contract, artifact.schema_ref, artifact.schema_variant), artifact.canonical_row_value)
  if (artifact.payload_schema_ref === 'opaque_bounded_bytes' || artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema') {
    const schema = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? contract.authority_opaque_raw_input_stores[artifact.payload_schema_variant].row_schema : contract.proof_nonce_ledger.row_schema
    return fingerprint(contract, schema, artifact.stored_row_value)
  }
  const schema = schemaAt(contract, artifact.payload_schema_ref, artifact.payload_schema_variant)
  if (schema.fingerprint_field) return fingerprint(contract, schema, artifact.payload_value)
  if (role === 'result') {
    const rule = contract.case_session_authority_operation_protocols.operations[artifact.payload_value.operation_name].result_fingerprint, body = {}
    for (const field of schema.exact_keys) if (field !== 'result_fingerprint') body[field] = artifact.payload_value[field]
    const preimage = { domain_ascii: rule.domain_ascii, operation_name: artifact.payload_value.operation_name, operation_id: artifact.payload_value.operation_id, branch: artifact.payload_value.branch, branch_specific_canonical_payload_sha256: hash(body) }
    return { schema_ref: `case_session_authority_operation_protocols.operations.${artifact.payload_value.operation_name}.result_fingerprint`, preimage, value: hash(preimage) }
  }
  if (role === 'request') {
    const rule = contract.case_session_authority_operation_protocols.operations[artifact.payload_value.operation_name].request_fingerprint, preimage = {}
    for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : artifact.payload_value[field]
    return { schema_ref: `case_session_authority_operation_protocols.operations.${artifact.payload_value.operation_name}.request_fingerprint`, preimage, value: hash(preimage) }
  }
  const bytes = canonicalR44(artifact.payload_value), preimage = { domain_ascii: 'CTRL-G24-R44-PARSED-CONTENT', schema_ref: artifact.payload_schema_ref, canonical_bytes_sha256: sha(Buffer.from(bytes, 'utf8')) }
  return { schema_ref: 'authority_operation_fixture_payload_fingerprint_authority.generic_content', preimage, value: hash(preimage) }
}
function validateArtifact(contract, role, artifact, expected) {
  ok(`artifact role ${role}`, artifact.artifact_role === role && artifact.fixture_wrapper_variant === expected.fixture_wrapper_variant)
  const identity = artifact.fixture_wrapper_variant === 'content_addressed' ? { schema_ref: artifact.payload_schema_ref, schema_variant: artifact.payload_schema_variant, schema_version: artifact.payload_schema_version } : { schema_ref: artifact.schema_ref, schema_variant: artifact.schema_variant, schema_version: artifact.schema_version }
  ok(`artifact schema ${role}`, same(identity, { schema_ref: expected.schema_ref, schema_variant: expected.schema_variant, schema_version: expected.schema_version }))
  const derived = derivedPayload(contract, role, artifact)
  ok(`derived payload ${role}`, artifact.declared_payload_fingerprint_schema_ref === derived.schema_ref && same(artifact.declared_payload_fingerprint_preimage, derived.preimage))
  if (artifact.fixture_wrapper_variant === 'content_addressed') {
    const bytes = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? artifact.payload_value : canonicalR44(artifact.payload_value), bytesHash = sha(Buffer.from(bytes, 'utf8'))
    ok(`content address ${role}`, artifact.payload_canonical_bytes_utf8 === bytes && artifact.payload_bytes_sha256 === bytesHash && artifact.ref === bytesHash && artifact.bytes_sha256 === bytesHash)
    ok(`payload fingerprint ${role}`, artifact.payload_fingerprint === derived.value && artifact.fingerprint === derived.value)
    const schema = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? null : schemaAt(contract, artifact.payload_schema_ref, artifact.payload_schema_variant)
    if (schema?.fingerprint_field) ok(`native fingerprint ${role}`, artifact.payload_value[schema.fingerprint_field] === derived.value)
    const wrapperSchema = findSchemaVersion(contract, artifact.selected_wrapper_schema_version), wrapperDerived = fingerprint(contract, wrapperSchema, artifact.stored_row_value)
    ok(`wrapper keyset ${role}`, same(Object.keys(artifact.stored_row_value).sort(cp), [...wrapperSchema.exact_keys].sort(cp)))
    ok(`wrapper fingerprint ${role}`, artifact.declared_wrapper_fingerprint_schema_ref === wrapperDerived.schema_ref && same(artifact.declared_wrapper_fingerprint_preimage, wrapperDerived.preimage) && artifact.stored_row_fingerprint === wrapperDerived.value && artifact.stored_row_value[wrapperSchema.fingerprint_field] === wrapperDerived.value)
    if (Object.hasOwn(artifact.stored_row_value, 'parsed_content_fingerprint')) ok(`parsed fingerprint ${role}`, artifact.stored_row_value.parsed_content_fingerprint === derived.value)
  } else {
    const schema = schemaAt(contract, artifact.schema_ref, artifact.schema_variant), row = artifact.canonical_row_value, bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8'))
    ok(`row keyset ${role}`, same(Object.keys(row).sort(cp), [...schema.exact_keys].sort(cp)))
    ok(`row fingerprint ${role}`, row[schema.fingerprint_field] === derived.value && artifact.recorded_fingerprint === derived.value && same(artifact.fingerprint_preimage, derived.preimage))
    ok(`row content address ${role}`, artifact.canonical_row_bytes_utf8 === bytes && artifact.canonical_row_bytes_sha256 === bytesHash && artifact.content_addressed_artifact_ref === bytesHash)
  }
}

function identities(role, artifact) {
  const rows = []
  if (artifact.fixture_wrapper_variant === 'content_addressed') rows.push({ role, identity_kind: 'content_address', ref: artifact.ref, bytes_sha256: artifact.bytes_sha256, fingerprint: artifact.fingerprint })
  else {
    rows.push({ role, identity_kind: 'row_content_address', ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'registry') rows.push({ role, identity_kind: 'registry_row_ref', ref: artifact.canonical_row_value.registry_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'hold') rows.push({ role, identity_kind: 'hold_row_ref', ref: artifact.canonical_row_value.hold_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'committed_target_row') rows.push({ role, identity_kind: 'row_version_ref', ref: artifact.canonical_row_value.row_version_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint })
    if (role === 'receipt') { rows.push({ role, identity_kind: 'receipt_precommit_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.canonical_row_value.receipt_precommit_fingerprint }); rows.push({ role, identity_kind: 'receipt_final_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }) }
  }
  return rows
}
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key)
function companions(sourceRole, key, value) {
  if (key === 'response_payload_ref') return { bytes: 'response_payload_bytes_sha256', fingerprint: 'result_fingerprint' }
  if (key === 'request_artifact_ref') return { bytes: 'request_artifact_sha256', fingerprint: 'request_fingerprint' }
  if (key === 'result_ref') return { bytes: 'result_bytes_sha256', fingerprint: 'result_fingerprint' }
  if (key === 'hold_result_ref') return { bytes: 'hold_result_bytes_sha256', fingerprint: 'hold_result_fingerprint' }
  if (key === 'hold_row_ref') return { bytes: null, fingerprint: sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint' }
  if (key === 'receipt_ref') return { bytes: null, fingerprint: sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint' }
  if (key === 'committed_target_row_ref') return { bytes: 'committed_target_row_bytes_sha256', fingerprint: 'committed_target_row_fingerprint' }
  if (key === 'target_row_version_ref') return { bytes: null, fingerprint: 'target_row_fingerprint' }
  if (key === 'held_registry_row_ref') return { bytes: null, fingerprint: 'held_registry_row_fingerprint' }
  if (key === 'committed_registry_row_ref') return { bytes: null, fingerprint: 'committed_registry_row_fingerprint' }
  const suffix = key.endsWith('_or_unavailable') ? '_or_unavailable' : '', base = key.replace(/_ref(_or_unavailable)?$/, '')
  return { bytes: [`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(candidate => Object.hasOwn(value, candidate)) ?? null, fingerprint: `${base}_fingerprint${suffix}` }
}
function expectedTarget(fixture, sourceRole, field) {
  const session = fixture.fixture_id.includes('session'), verified = fixture.fixture_id.includes('verified'), committed = fixture.fixture_id === 'restart_committed'
  const fixed = {
    'committed_target_row.row_version_ref': 'committed_target_row', 'request.target_intent_bytes_ref': committed ? 'target_intent' : 'target', 'request.authority_proof_bytes_ref': 'proof', 'request.dual_proof_bundle_bytes_ref': verified ? 'bundle' : 'raw_bundle',
    'result.target_row_version_ref': 'committed_target_row', 'result.receipt_ref': 'receipt', 'result.hold_row_ref': 'hold', 'result.session_hold_evidence_ref': 'session_evidence',
    'receipt.receipt_ref': 'receipt', 'receipt.request_bytes_ref': 'request', 'receipt.target_row_bytes_ref': 'committed_target_row', 'receipt.authority_proof_bytes_ref': 'proof', 'receipt.nonce_receipt_ref': 'proof_nonce_receipt', 'receipt.result_bytes_ref': 'result',
    'history.response_payload_ref': 'result', 'history.result_ref': 'result',
    'registry.request_bytes_ref': 'request', 'registry.target_intent_bytes_ref': committed ? 'target_intent' : 'target', 'registry.committed_target_row_ref': 'committed_target_row', 'registry.result_ref': 'result', 'registry.hold_result_ref': 'result', 'registry.receipt_ref': 'receipt', 'registry.registry_row_ref': 'registry', 'registry.historical_response_ref': 'history', 'registry.hold_row_ref': 'hold', 'registry.session_hold_evidence_ref_or_unavailable': 'session_evidence',
    'replay_payload.historical_result_ref': 'result', 'replay_payload.stored_historical_response_ref': 'history', 'replay_payload.committed_registry_row_ref': 'registry', 'replay_payload.held_registry_row_ref': 'registry', 'replay_payload.hold_row_ref': 'hold', 'replay_payload.session_hold_evidence_ref_or_unavailable': 'session_evidence',
    'replay_envelope.payload_ref': 'replay_payload', 'replay_envelope.replay_response_ref': 'history',
    'bundle_truth_projection.target_intent_bytes_ref': 'target', 'bundle_truth_projection.issuer_proof_ref': 'issuer_proof', 'bundle_truth_projection.evaluator_proof_ref': 'evaluator_proof',
    'bundle.issuer_proof_ref': 'issuer_proof', 'bundle.evaluator_proof_ref': 'evaluator_proof',
    'authority_read_set.dual_proof_bundle_ref': 'bundle', 'authority_read_set.issuer_proof_ref': 'issuer_proof', 'authority_read_set.issuer_nonce_receipt_ref': 'issuer_nonce_receipt', 'authority_read_set.evaluator_proof_ref': 'evaluator_proof', 'authority_read_set.evaluator_nonce_receipt_ref': 'evaluator_nonce_receipt', 'authority_read_set.bundle_truth_projection_ref': 'bundle_truth_projection',
    'session_evidence.bundle_ref': 'bundle', 'session_evidence.bundle_truth_projection_ref': 'bundle_truth_projection', 'session_evidence.issuer_proof_ref': 'issuer_proof', 'session_evidence.evaluator_proof_ref': 'evaluator_proof', 'session_evidence.issuer_nonce_receipt_ref': 'issuer_nonce_receipt', 'session_evidence.evaluator_nonce_receipt_ref': 'evaluator_nonce_receipt', 'session_evidence.authority_read_set_ref': 'authority_read_set', 'session_evidence.target_evidence_ref': 'target', 'session_evidence.raw_bundle_ref_or_unavailable': 'raw_bundle', 'session_evidence.raw_evaluator_proof_ref_or_unavailable': 'raw_evaluator_proof',
    'hold.request_artifact_ref': 'request', 'hold.result_ref': 'result', 'hold.hold_row_ref': 'hold', 'hold.session_hold_evidence_ref': 'session_evidence', 'hold.raw_bundle_ref_or_unavailable': 'raw_bundle', 'hold.raw_evaluator_proof_ref_or_unavailable': 'raw_evaluator_proof',
  }
  return fixed[`${sourceRole}.${field}`] ?? (session ? null : null)
}
function discoverSelected(contract) {
  const resolved = [], self = [], nonArtifact = []
  for (const fixture of contract.authority_operation_replay_restart_fixtures.fixtures) {
    const store = fixture.artifact_store_by_role, all = Object.entries(store).flatMap(([role, artifact]) => identities(role, artifact))
    for (const [sourceRole, artifact] of Object.entries(store)) {
      const schema = artifact.fixture_wrapper_variant === 'content_addressed' ? schemaAt(contract, artifact.payload_schema_ref, artifact.payload_schema_variant) : schemaAt(contract, artifact.schema_ref, artifact.schema_variant), value = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_value : artifact.canonical_row_value
      if (!schema?.exact_keys || !value || typeof value !== 'object') continue
      ok(`selected schema keyset ${fixture.fixture_id}:${sourceRole}`, same(Object.keys(value).sort(cp), [...schema.exact_keys].sort(cp)))
      for (const field of schema.exact_keys.filter(refToken)) {
        const reference = value[field]
        if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonArtifact.push(`${fixture.fixture_id}|${sourceRole}|${field}|${reference ?? null}`); continue }
        let matches = all.filter(candidate => candidate.ref === reference), nonSelf = matches.filter(candidate => candidate.role !== sourceRole)
        if (nonSelf.length) matches = nonSelf
        if (!nonSelf.length && matches.length) { self.push(`${fixture.fixture_id}|${sourceRole}|${field}|${reference}`); continue }
        const expected = expectedTarget(fixture, sourceRole, field)
        if (!matches.length) { ok(`non-artifact field classified ${fixture.fixture_id}:${sourceRole}:${field}`, expected === null); nonArtifact.push(`${fixture.fixture_id}|${sourceRole}|${field}|${reference}`); continue }
        if (matches.length > 1 && matches.every(candidate => candidate.role === 'receipt')) matches = matches.filter(candidate => candidate.identity_kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
        ok(`exact target ${fixture.fixture_id}:${sourceRole}:${field}`, matches.length === 1 && expected === matches[0].role)
        const target = matches[0], companion = companions(sourceRole, field, value), bytes = companion.bytes && Object.hasOwn(value, companion.bytes) ? value[companion.bytes] : 'UNAVAILABLE', fingerprintValue = companion.fingerprint && Object.hasOwn(value, companion.fingerprint) ? value[companion.fingerprint] : 'UNAVAILABLE'
        ok(`companion bytes ${fixture.fixture_id}:${sourceRole}:${field}`, bytes === 'UNAVAILABLE' || bytes === target.bytes_sha256)
        ok(`companion fingerprint ${fixture.fixture_id}:${sourceRole}:${field}`, fingerprintValue === 'UNAVAILABLE' || fingerprintValue === target.fingerprint)
        resolved.push({ fixture_id: fixture.fixture_id, source_role: sourceRole, source_schema_ref: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, source_schema_variant: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant, source_field: field, target_role: target.role, target_identity_kind: target.identity_kind, reference, companion_bytes_field_or_UNAVAILABLE: bytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : companion.bytes, companion_bytes_sha256_or_UNAVAILABLE: bytes, companion_fingerprint_field_or_UNAVAILABLE: fingerprintValue === 'UNAVAILABLE' ? 'UNAVAILABLE' : companion.fingerprint, companion_fingerprint_or_UNAVAILABLE: fingerprintValue, exact_match_count: 1 })
      }
    }
  }
  resolved.sort((left, right) => cp(`${left.fixture_id}|${left.source_role}|${left.source_field}`, `${right.fixture_id}|${right.source_role}|${right.source_field}`))
  self.sort(cp); nonArtifact.sort(cp)
  return { resolved, self, nonArtifact }
}

function verifyTargetAndNonce(contract) {
  const fixture = contract.authority_operation_replay_restart_fixtures.fixtures[0], store = fixture.artifact_store_by_role, intent = store.target_intent.payload_value, target = store.committed_target_row.canonical_row_value, result = store.result.payload_value
  const intentSchema = schemaAt(contract, store.target_intent.payload_schema_ref, store.target_intent.payload_schema_variant)
  for (const field of intentSchema.exact_keys) ok(`target copied ${field}`, same(target[field], intent[field]))
  ok('valid until strict', Date.parse(target.valid_until) > Date.parse(target.valid_from) && Date.parse(target.valid_until) > Date.parse(result.committed_at))
  const mutable = Object.fromEntries(Object.entries(target).filter(([field]) => !['row_version_ref', 'anchor_fingerprint'].includes(field))), ordered = Object.keys(mutable).sort(cp).map(field => ({ field, value: mutable[field] })), preimage = { domain_ascii: 'CTRL-G24-R46-COMMITTED-TARGET-ROW-VERSION', schema_version: 'ctrl.g24.committed-target-row-version.r46.v1', ordered_complete_mutable_authority_fields: ordered }
  ok('complete row version', target.row_version_ref === hash(preimage) && same(store.committed_target_row.normative_row_ref_preimage, preimage) && result.target_row_version_ref === target.row_version_ref && store.registry.canonical_row_value.committed_target_row_ref === target.row_version_ref)
  const proof = store.proof.payload_value, tuples = [{ signer_ref: proof.signer_1_ref, key_artifact_sha256: proof.signer_1_artifact_sha256 }, { signer_ref: proof.signer_2_ref, key_artifact_sha256: proof.signer_2_artifact_sha256 }].sort((left, right) => cp(canonicalR44(left), canonicalR44(right))), rule = contract.bootstrap_verifier_set_fingerprint, verifierPreimage = { domain_ascii: rule.domain_ascii, canonical_sorted_signer_1_ref_key_artifact_tuple: tuples[0], canonical_sorted_signer_2_ref_key_artifact_tuple: tuples[1] }, subject = hash(verifierPreimage)
  ok('normative bootstrap nonce', rule.domain_ascii === 'CTRL-G24-BOOTSTRAP-VERIFIER-SET-R26' && contract.authority_operation_bootstrap_nonce_subject_authority.normative_contract_ref === 'bootstrap_verifier_set_fingerprint' && same(contract.authority_operation_bootstrap_nonce_subject_authority.exact_preimage, verifierPreimage) && contract.authority_operation_bootstrap_nonce_subject_authority.nonce_subject_fingerprint === subject && store.proof_nonce_receipt.stored_row_value.nonce_subject_fingerprint === subject)
}

function verifyManifest(contract) {
  const expectedPaths = [...new Set([...r44SemanticAuthorityPaths, 'authority_operation_committed_target_identity_authority', 'authority_operation_receipt_materialization_authority', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_committed_target_projection_authority', 'authority_operation_bootstrap_nonce_subject_authority', 'authority_operation_selected_reference_traversal_authority'])].sort(cp)
  ok('manifest path non-regression', same(r46SemanticAuthorityPaths, expectedPaths) && same(contract.authority_runtime_semantic_manifest.exact_paths, expectedPaths) && contract.authority_runtime_semantic_manifest.exact_expected_count === 220)
  const manifest = contract.authority_runtime_semantic_manifest, requiredKeys = ['schema_version', 'type', 'snapshot_pipeline_ref', 'resource_limits_ref', 'hash_contract_ref', 'dependency_owner_map_ref', 'reference_field_specification_ref', 'reference_field_registry_ref', 'exact_paths', 'rows', 'exact_expected_count', 'manifest_graph_sha256', 'manifest_envelope_seal_sha256']
  ok('full manifest envelope', same(Object.keys(manifest), requiredKeys) && manifest.rows.length === expectedPaths.length)
  const ownerRows = contract.authority_runtime_semantic_dependency_owner_map.rows, graph = Object.fromEntries(ownerRows.map(row => [row.authority_path, row.typed_owner_paths])), hashContract = contract.authority_runtime_semantic_manifest_hash_contract, hashVersion = hashContract.schema_version
  const contentHash = (path, value) => hash({ domain_ascii: hashContract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(value) })
  const dependencyHash = (path, scope, rows) => hash({ domain_ascii: hashContract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows })
  const transitive = path => { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
  const contentHashes = Object.fromEntries(expectedPaths.map(path => [path, contentHash(path, path === 'authority_runtime_semantic_manifest' ? undefined : get(contract, path))]))
  for (const row of manifest.rows) {
    const direct = graph[row.authority_path], directRows = direct.map(path => ({ authority_path: path, authority_content_sha256: contentHashes[path] })), transitiveRows = transitive(row.authority_path).map(path => ({ authority_path: path, authority_content_sha256: contentHashes[path] }))
    ok(`manifest row ${row.authority_path}`, same(Object.keys(row), ['authority_path', 'semantic_kind', 'exact_keyset', 'authority_schema_ref', 'authority_schema_version', 'direct_dependency_paths', 'direct_dependency_content_hashes', 'direct_dependency_set_sha256', 'transitive_dependency_paths', 'transitive_dependency_content_hashes', 'transitive_dependency_set_sha256', 'authority_content_sha256']) && row.authority_content_sha256 === contentHashes[row.authority_path] && same(row.direct_dependency_paths, direct) && same(row.direct_dependency_content_hashes, directRows) && row.direct_dependency_set_sha256 === dependencyHash(row.authority_path, 'direct', directRows) && same(row.transitive_dependency_paths, transitiveRows.map(item => item.authority_path)) && same(row.transitive_dependency_content_hashes, transitiveRows) && row.transitive_dependency_set_sha256 === dependencyHash(row.authority_path, 'transitive', transitiveRows))
  }
  ok('manifest graph', manifest.manifest_graph_sha256 === hash({ domain_ascii: hashContract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: manifest.rows }))
  const withoutSeal = { ...manifest }; delete withoutSeal.manifest_envelope_seal_sha256
  ok('manifest envelope seal', manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hashContract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: withoutSeal }))
  ok('reference registry non-regression', contract.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count === 6407 && contract.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count >= materializedR44.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count)
  for (const source of ['authority_operation_committed_target_projection_authority', 'authority_operation_bootstrap_nonce_subject_authority', 'authority_operation_selected_reference_traversal_authority']) ok(`new reference source ${source}`, contract.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.some(row => row.source_authority_path === source))
}

function verify(contract) {
  ok('identity', contract.schema_version === 'ctrl.g24.trusted-ingress.r46.effective.v1' && contract.supersedes.commit === 'd69d06fb3baa9a75bf4f5fc7bc21cf5d1fbacb15' && contract.materialization.frozen_input.sha256 === '9f682c11241242e6ab0de565f956d0d5fa57c218145317c512974d04c8771998')
  ok('closed', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, []))
  const fixtures = contract.authority_operation_replay_restart_fixtures.fixtures, rules = contract.authority_operation_fixture_role_store_authority.exact_branch_rows
  ok('fixtures', fixtures.length === 4 && contract.authority_operation_replay_restart_fixtures.total_role_keyed_artifact_count === 47)
  for (const fixture of fixtures) { const rule = rules.find(row => row.fixture_id === fixture.fixture_id && row.result_branch === fixture.result_branch); ok(`role rule ${fixture.fixture_id}`, rule && same(fixture.exact_required_roles, rule.exact_required_roles) && same(Object.keys(fixture.artifact_store_by_role), rule.exact_required_roles)); for (const roleRule of rule.role_schema_variants) validateArtifact(contract, roleRule.role, fixture.artifact_store_by_role[roleRule.role], roleRule) }
  const discovered = discoverSelected(contract), authority = contract.authority_operation_selected_reference_traversal_authority, resolution = contract.authority_operation_artifact_resolution_authority, correlations = contract.authority_operation_restart_correlation_authority
  ok('exhaustive selected counts', discovered.resolved.length === 104 && discovered.self.length === 9 && discovered.nonArtifact.length === 122 && authority.exact_selected_artifact_reference_count === 104 && authority.exact_self_reference_count === 9 && authority.exact_non_artifact_reference_count === 122)
  ok('independent selected rows', same(discovered.resolved, resolution.rows) && resolution.exact_resolution_count === 104 && resolution.zero_matches === 'hold_without_disclosure_or_write' && resolution.multiple_matches === 'hold_without_disclosure_or_write')
  const projected = discovered.resolved.flatMap((row, index) => [{ correlation_id: `r46:${String(index + 1).padStart(3, '0')}:reference`, ...row, correlation_kind: 'reference' }, { correlation_id: `r46:${String(index + 1).padStart(3, '0')}:bytes`, ...row, correlation_kind: 'companion_bytes_or_explicit_unavailable' }, { correlation_id: `r46:${String(index + 1).padStart(3, '0')}:fingerprint`, ...row, correlation_kind: 'companion_fingerprint_or_explicit_unavailable' }])
  ok('correlations', correlations.sole_verifier === true && correlations.exact_row_count === 312 && same(correlations.rows, projected))
  for (const required of ['history.response_payload_ref', 'result.hold_row_ref', 'result.session_hold_evidence_ref', 'hold.request_artifact_ref', 'hold.result_ref', 'bundle_truth_projection.target_intent_bytes_ref', 'authority_read_set.dual_proof_bundle_ref', 'session_evidence.target_evidence_ref']) ok(`known omission ${required}`, resolution.rows.some(row => `${row.source_role}.${row.source_field}` === required))
  verifyTargetAndNonce(contract)
  verifyManifest(contract)
}

if (read(machinePath) !== materializedR46Output) failures.push('machine differs from materializer')
const frozen = {
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r45.json': '9f682c11241242e6ab0de565f956d0d5fa57c218145317c512974d04c8771998',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r45.md': '9fe005ad1a5bc733dfed079f3afca32858f50ad638d45acb376debf08b57a4e1',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r45-qa-record.md': 'b6e3eb84559a4fdb99f0907db64d98bd5de6fb4b409d6643b97ef351ff6a09a3',
  'scripts/check-ctrl-g24-trusted-ingress-r45.mjs': '367b280395311c9a8ec4d95c99d2dea545b07bd9d1ee0abadb8c64bde7fe2559',
  'scripts/materialize-ctrl-g24-trusted-ingress-r45.mjs': 'ee8bed514cce6f46848dc435a23653bec4218936dfec97b320b4bf8f21cedd93',
}
for (const [path, expected] of Object.entries(frozen)) if (sha(read(path)) !== expected) failures.push(`frozen R45 changed:${path}`)
try { verify(materializedR46) } catch (error) { failures.push(`base:${error.stack}`) }
function reject(name, mutation) { const candidate = structuredClone(materializedR46); mutation(candidate); try { verify(candidate); failures.push(`mutation accepted:${name}`) } catch {} }
const attacks = [
  ['parent', c => { c.supersedes.commit = '0'.repeat(40) }], ['visible', c => { c.visible_surface_changes.push('ui') }], ['external', c => { c.external_actions_authorized.push('deploy') }],
  ['delete discovered row', c => { c.authority_operation_artifact_resolution_authority.rows = c.authority_operation_artifact_resolution_authority.rows.filter(row => !(row.source_role === 'history' && row.source_field === 'response_payload_ref')) }],
  ['history response splice', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[1], history = f.artifact_store_by_role.history, request = f.artifact_store_by_role.request; history.payload_value.response_payload_ref = request.ref; history.payload_value.response_payload_bytes_sha256 = request.bytes_sha256 }],
  ['result hold omission', c => { c.authority_operation_artifact_resolution_authority.rows = c.authority_operation_artifact_resolution_authority.rows.filter(row => !(row.source_role === 'result' && row.source_field === 'hold_row_ref')) }],
  ['projection proof splice', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[2], projection = f.artifact_store_by_role.bundle_truth_projection.payload_value; projection.issuer_proof_ref = f.artifact_store_by_role.evaluator_proof.ref; projection.issuer_proof_bytes_sha256 = f.artifact_store_by_role.evaluator_proof.bytes_sha256; projection.issuer_proof_fingerprint = f.artifact_store_by_role.evaluator_proof.fingerprint }],
  ['valid until alias', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.committed_target_row.canonical_row_value.valid_until = '2028-09-14T00:00:00.000Z' }],
  ['valid until not future', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.committed_target_row.canonical_row_value.valid_until = '2026-09-14T00:00:00.000Z' }],
  ['intent projection splice', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.committed_target_row.canonical_row_value.standing = 'revoked' }],
  ['signer ref nonce alias', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[0], p = f.artifact_store_by_role.proof.payload_value; p.signer_2_ref = p.signer_1_ref }],
  ['signer artifact nonce alias', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures[0], p = f.artifact_store_by_role.proof.payload_value; p.signer_2_artifact_sha256 = p.signer_1_artifact_sha256 }],
  ['private nonce domain', c => { c.authority_operation_bootstrap_nonce_subject_authority.domain_ascii = 'CTRL-G24-R45-ROOT-BOOTSTRAP-NONCE-SUBJECT' }],
  ['minimal manifest', c => { delete c.authority_runtime_semantic_manifest.snapshot_pipeline_ref }],
  ['manifest direct dependency', c => { const row = c.authority_runtime_semantic_manifest.rows.find(item => item.direct_dependency_paths.length); row.direct_dependency_paths = [] }],
  ['manifest transitive hash', c => { c.authority_runtime_semantic_manifest.rows[0].transitive_dependency_set_sha256 = '0'.repeat(64) }],
  ['manifest envelope', c => { c.authority_runtime_semantic_manifest.manifest_envelope_seal_sha256 = '0'.repeat(64) }],
  ['reference count regression', c => { c.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count = 1 }],
  ['missing new authority', c => { c.authority_runtime_semantic_manifest.exact_paths = c.authority_runtime_semantic_manifest.exact_paths.filter(path => path !== 'authority_operation_selected_reference_traversal_authority') }],
]
for (const [name, mutation] of attacks) reject(name, mutation)
function rejectTargetOrNonce(name, mutation) { const candidate = structuredClone(materializedR46); mutation(candidate); try { verifyTargetAndNonce(candidate); failures.push(`target-or-nonce mutation accepted:${name}`) } catch {} }
const targetedAttacks = [
  ['coherently resealed row retains old version', c => { const artifact = c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.committed_target_row, row = artifact.canonical_row_value; row.valid_until = '2028-09-14T00:00:00.000Z'; const derived = fingerprint(c, schemaAt(c, artifact.schema_ref, artifact.schema_variant), row); row.anchor_fingerprint = derived.value; artifact.recorded_fingerprint = derived.value; artifact.fingerprint_preimage = derived.preimage; artifact.declared_payload_fingerprint_preimage = derived.preimage; const bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8')); artifact.canonical_row_bytes_utf8 = bytes; artifact.canonical_row_bytes_sha256 = bytesHash; artifact.content_addressed_artifact_ref = bytesHash }],
  ['signer reference substitution reaches nonce check', c => { const proof = c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.proof.payload_value; proof.signer_2_ref = `${proof.signer_2_ref}_substituted` }],
  ['signer key artifact substitution reaches nonce check', c => { const proof = c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.proof.payload_value; proof.signer_2_artifact_sha256 = 'f'.repeat(64) }],
]
for (const [name, mutation] of targetedAttacks) rejectTargetOrNonce(name, mutation)
const parent = spawnSync(process.execPath, ['scripts/check-ctrl-g24-trusted-ingress-r45.mjs'], { cwd: root, encoding: 'utf8' })
if (parent.status !== 0) failures.push(`frozen R45 checker failed:${parent.stderr || parent.stdout}`)
if (failures.length) { console.error(`R46 failed ${failures.length}`); for (const failure of failures) console.error(`- ${failure}`); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R46 and ${attacks.length + targetedAttacks.length} mutation probes verified`)
console.log('r46_selected_reference_resolutions=104/104')
console.log('r46_selected_reference_correlations=312/312')
console.log('r46_restart_fixtures=4/4')
console.log('r46_manifest_rows=220')
console.log('r46_semantic_reference_rows=6407')
console.log(`r46_machine_sha256=${sha(read(machinePath))}`)
