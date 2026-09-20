import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR63, materializedR63Output } from './materialize-ctrl-g24-trusted-ingress-r63.mjs'
import { materializedR64, materializedR64Output, r64SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r64.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r64.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const same = (left, right) => canonicalR44(left) === canonicalR44(right)
const cp = (a, b) => {
  const left = [...String(a)].map(char => char.codePointAt(0))
  const right = [...String(b)].map(char => char.codePointAt(0))
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]
  return left.length - right.length
}
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const assert = (condition, label) => { if (!condition) throw new Error(label) }
const frameBytes = bytes => { const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length); return Buffer.concat([length, bytes]) }
const frame = value => frameBytes(Buffer.from(String(value), 'utf8'))
const u64 = value => { const bytes = Buffer.alloc(8); bytes.writeBigUInt64BE(BigInt(value)); return bytes }
const fingerprintPreimage = (authority, row) => Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : Object.hasOwn(row, field) ? row[field] : null]))

function assertExactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}:object`)
  assert(same(Object.keys(value).sort(cp), [...keys].sort(cp)), `${label}:keyset`)
}

function assertClosedSchemaObject(value, schema, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}:object`)
  const allowed = new Set(schema.exact_keys ?? Object.keys(schema.properties ?? {}))
  for (const field of schema.required ?? []) assert(Object.hasOwn(value, field), `${label}:required:${field}`)
  for (const field of Object.keys(value)) assert(allowed.has(field), `${label}:extra:${field}`)
}

function decodeCanonical(b64url, expectedSha, label) {
  const bytes = Buffer.from(b64url, 'base64url')
  assert(bytes.toString('base64url') === b64url, `${label}:canonical_base64url`)
  assert(sha(bytes) === expectedSha, `${label}:bytes_sha256`)
  let value
  try { value = JSON.parse(bytes.toString('utf8')) } catch { throw new Error(`${label}:json`) }
  assert(bytes.toString('utf8') === canonicalR44(value), `${label}:canonical_json`)
  return { bytes, value }
}

function validateEvidenceInput(contract, value, label) {
  const schema = contract.authority_operation_lifecycle_precondition_evidence_input_schema
  assert(schema.schema_version === 'ctrl.g24.lifecycle-precondition-evidence-input.r63.v1', `${label}:schema_version`)
  assertExactKeys(schema, ['schema_version', 'type', 'exact_keys', 'required', 'additional_properties', 'properties'], `${label}:schema`)
  assert(schema.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, ['evidence_ref', 'evidence_value']) && same(schema.required, ['evidence_ref', 'evidence_value']), `${label}:schema_shape`)
  assertExactKeys(value, schema.exact_keys, `${label}:value`)
  assert(typeof value.evidence_ref === 'string' && Buffer.byteLength(value.evidence_ref, 'utf8') >= 1 && Buffer.byteLength(value.evidence_ref, 'utf8') <= 256, `${label}:evidence_ref`)
  assert(typeof value.evidence_value === 'string' && value.evidence_value.trim().length > 0 && Buffer.byteLength(value.evidence_value, 'utf8') <= 4096, `${label}:evidence_value`)
  for (let index = 0; index < value.evidence_value.length; index += 1) {
    const code = value.evidence_value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) { const next = value.evidence_value.charCodeAt(index + 1); assert(next >= 0xdc00 && next <= 0xdfff, `${label}:unicode`); index += 1 }
    else assert(!(code >= 0xdc00 && code <= 0xdfff), `${label}:unicode`)
  }
}

function validateR13RowSchema(contract, row, label) {
  const schema = contract.authoritative_row_schemas.lifecycle_precondition_evidence
  const allowed = new Set(schema.exact_keys)
  assertExactKeys(row, Object.keys(row), `${label}:object`)
  for (const field of schema.required) assert(Object.hasOwn(row, field), `${label}:required:${field}`)
  for (const field of Object.keys(row)) assert(allowed.has(field), `${label}:extra:${field}`)
  assert(!Object.hasOwn(row, 'valid_until') || typeof row.valid_until === 'string', `${label}:valid_until`)
  for (const field of ['workspace_ref', 'subject_ref', 'case_ref', 'evidence_ref', 'row_version_ref', 'transition_id', 'required_precondition_id', 'precondition_canonical_text', 'evidence_schema_version', 'evaluator_version_ref', 'evaluator_id', 'evaluator_semantic_version']) assert(typeof row[field] === 'string' && row[field].length > 0, `${label}:string:${field}`)
  for (const field of ['snapshot_fingerprint', 'evidence_fingerprint', 'row_envelope_fingerprint', 'evidence_input_set_seal', 'evaluator_artifact_sha256', 'evaluator_manifest_sha256']) assert(typeof row[field] === 'string' && /^[0-9a-f]{64}$/.test(row[field]), `${label}:sha256:${field}`)
  assert(typeof row.canonical_evidence_b64url === 'string' && typeof row.canonical_evidence_byte_length === 'number' && Number.isSafeInteger(row.canonical_evidence_byte_length) && row.canonical_evidence_byte_length >= 0, `${label}:evidence_bytes_shape`)
  assert(typeof row.satisfied === 'boolean', `${label}:satisfied_type`)
  assert(typeof row.evaluated_at === 'string' && typeof row.valid_from === 'string', `${label}:timestamps`)
  assert(row.predecessor_lifecycle_version_ref === null || typeof row.predecessor_lifecycle_version_ref === 'string', `${label}:predecessor`)
}

function encodeMemberIdentity(contract, setKind, projectionValues) {
  const authority = contract.set_member_identity_encoding
  assert(authority.domain_ascii === 'CTRL-G24-SET-MEMBER-IDENTITY-R6', 'member_identity:domain')
  assert(authority.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes', 'member_identity:frame')
  assert(same(authority.preimage_order, ['domain_ascii', 'set_kind_framed', 'ordered_projection_values_framed']), 'member_identity:preimage_order')
  return Buffer.concat([Buffer.from(authority.domain_ascii, 'ascii'), frame(setKind), ...projectionValues.map(frame)])
}

function recomputeSetSeal(contract, fixture, members) {
  const authority = contract.set_seal_encoding
  assert(authority.domain_ascii === 'CTRL-G24-SET-SEAL-R6', 'set_seal:domain')
  assert(authority.variable_field_frame === 'uint32_big_endian_byte_length_then_field_bytes', 'set_seal:frame')
  assert(same(authority.preimage_order, ['domain_ascii', 'set_kind_framed', 'set_schema_version_framed', 'owner_lineage_version_framed', 'uint64_big_endian_member_count', 'sorted_unique_member_entries']), 'set_seal:preimage_order')
  assert(authority.member_entry_ref === 'set_member_identity_encoding.member_entry_order', 'set_seal:entry_ref')
  const entries = members.map(member => {
    const identityBytes = encodeMemberIdentity(contract, fixture.set_kind, [member.precondition_id])
    const rawCompleteRecordSha256 = sha(Buffer.from(canonicalR44(member), 'utf8'))
    return {
      identity_projection_values: [member.precondition_id],
      identity_bytes_b64url: identityBytes.toString('base64url'),
      identity_bytes_sha256: sha(identityBytes),
      raw_complete_record_sha256: rawCompleteRecordSha256,
      encoded_entry: Buffer.concat([frameBytes(identityBytes), Buffer.from(rawCompleteRecordSha256, 'hex')]),
    }
  })
  entries.sort((left, right) => Buffer.compare(Buffer.from(left.identity_bytes_b64url, 'base64url'), Buffer.from(right.identity_bytes_b64url, 'base64url')) || Buffer.compare(Buffer.from(left.raw_complete_record_sha256, 'hex'), Buffer.from(right.raw_complete_record_sha256, 'hex')))
  assert(new Set(entries.map(entry => entry.identity_bytes_b64url)).size === entries.length, 'set_seal:duplicate_identity')
  const bytes = Buffer.concat([Buffer.from(authority.domain_ascii, 'ascii'), frame(fixture.set_kind), frame(fixture.set_schema_version), frame(fixture.owner_lineage_version), u64(entries.length), ...entries.map(entry => entry.encoded_entry)])
  return {
    entries: entries.map(({ encoded_entry, ...entry }) => ({ ...entry, encoded_entry_b64url: encoded_entry.toString('base64url') })),
    bytes,
    digest: sha(bytes),
  }
}

function validateManifest(contract) {
  const registry = contract.authority_runtime_semantic_reference_field_registry
  const sourcePaths = r64SemanticAuthorityPaths
  assert(same(registry.exact_source_paths, sourcePaths), 'manifest:source_paths')
  const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(contract, path))]))
  const expectedSnapshotSha = hash({ domain_ascii: 'CTRL-G24-R64-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
  assert(registry.source_snapshot_sha256 === expectedSnapshotSha, 'manifest:source_snapshot')
  const declaredNames = new Set(contract.authority_operation_schema_declared_semantic_field_registry.exact_rows.map(row => row.field_name))
  const rows = []
  const seen = new Set()
  function walk(value, source, path = source) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const next = `${path}.${key}`
      const inspect = Array.isArray(child) ? child : [child]
      inspect.forEach((literal, index) => {
        if (typeof literal !== 'string') return
        const target = literal !== 'UNAVAILABLE' && get(contract, literal) !== undefined ? literal : 'UNAVAILABLE'
        if (target === 'UNAVAILABLE' && !declaredNames.has(key)) return
        const fieldPath = Array.isArray(child) ? `${next}.${index}` : next
        const id = `${source}|${fieldPath}|${literal}`
        if (seen.has(id)) return
        seen.add(id)
        rows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: target !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: target, exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(contract, target)?.schema_version ?? 'NESTED_VALUE', reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference' })
      })
      walk(child, source, next)
    }
  }
  for (const path of sourcePaths) walk(get(contract, path), path)
  rows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
  if (!(registry.exact_expected_occurrence_count === rows.length && same(registry.exact_occurrence_rows, rows))) {
    const limit = Math.max(registry.exact_occurrence_rows.length, rows.length)
    let mismatch = -1
    for (let index = 0; index < limit; index += 1) if (!same(registry.exact_occurrence_rows[index], rows[index])) { mismatch = index; break }
    throw new Error(`manifest:reference_registry:${registry.exact_expected_occurrence_count}:${rows.length}:${mismatch}:${canonicalR44(registry.exact_occurrence_rows[mismatch])}:${canonicalR44(rows[mismatch])}`)
  }
  const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(rows.filter(row => row.source_authority_path === path && sourcePaths.includes(row.exact_target_path_or_UNAVAILABLE) && row.exact_target_path_or_UNAVAILABLE !== path).map(row => row.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
  assert(contract.authority_runtime_semantic_reference_owner_map.source_snapshot_sha256 === expectedSnapshotSha && contract.authority_runtime_semantic_reference_owner_map.exact_row_count === rows.length, 'manifest:reference_owner')
  assert(same(contract.authority_runtime_semantic_dependency_owner_map.rows, sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] }))), 'manifest:dependency_owner')
  const hc = contract.authority_runtime_semantic_manifest_hash_contract
  assert(hc.manifest_hash_version === 'ctrl.g24.runtime-semantic-manifest-hash.r64.v1', 'manifest:hash_version')
  const content = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, path)) })]))
  function transitive(path) { const found = new Set(); const visit = item => { for (const dependency of dependencies[item] ?? []) if (!found.has(dependency)) { found.add(dependency); visit(dependency) } }; visit(path); found.delete(path); return [...found].sort(cp) }
  const manifestRows = sourcePaths.map(path => {
    const direct = dependencies[path].map(dependency => ({ authority_path: dependency, authority_content_sha256: content[dependency] }))
    const all = transitive(path).map(dependency => ({ authority_path: dependency, authority_content_sha256: content[dependency] }))
    return { authority_path: path, authority_schema_version: get(contract, path)?.schema_version ?? 'UNVERSIONED', exact_keyset: Object.keys(get(contract, path) ?? {}).sort(cp), authority_content_sha256: content[path], direct_dependency_paths: dependencies[path], direct_dependency_content_hashes: direct, direct_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }) }
  })
  const withoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r64.v1', source_snapshot_sha256: expectedSnapshotSha, exact_paths: sourcePaths, rows: manifestRows, exact_expected_count: manifestRows.length, manifest_graph_sha256: hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifestRows }) }
  assert(same(contract.authority_runtime_semantic_manifest, { ...withoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }) }), 'manifest:exact')
}

function validate(contract) {
  assert(contract.supersedes.commit === '19a10a49188a98e4db99df76548725ccf003320b' && contract.supersedes.tree === '343c5190f29f849d7033007a533dbd736d107da0', 'parent:git')
  assert(contract.supersedes.human_blob === 'ccfa2c417f60a25063f24a84adb83d2d5c7e6104' && contract.supersedes.machine_blob === '2e206c1bf77976b8f3923e9844870950064ff402' && contract.supersedes.qa_blob === '513798779c28da3d1add00c163f48eb989f8c77f', 'parent:core_blobs')
  assert(contract.supersedes.checker_blob === 'd0a19d83adb023e4b8ec3d4f087db2b2c0b4724a' && contract.supersedes.materializer_blob === '3986ae190097348c4ff5137b3c42b98eda9f613a' && contract.supersedes.founder_checker_blob === '3c8e74840140940fd76eabcfae1585900fa71591', 'parent:tool_blobs')
  assert(sha(materializedR63Output) === '88f537740c86d8db0ad369fe46484ffb50c3f3dfb1703d380dd8ca3456f06a0a', 'parent:machine_sha256')
  assert(contract.materialization.generator === 'scripts/materialize-ctrl-g24-trusted-ingress-r64.mjs' && contract.materialization.frozen_input.sha256 === sha(materializedR63Output), 'materialization:identity')
  assert(!Object.hasOwn(contract, 'authority_operation_ordering_evidence_store'), 'synthetic_store:absent')
  const evaluateSchema = contract.result_payload_schemas.evaluate_lifecycle_preconditions
  assert(evaluateSchema.schema_version === 'ctrl.g24.result.evaluate-lifecycle-preconditions.r63.v1' && !evaluateSchema.exact_keys.includes('precondition_set_seal') && !evaluateSchema.required.includes('precondition_set_seal') && !Object.hasOwn(evaluateSchema.properties, 'precondition_set_seal'), 'result_schema:seal_absent')
  assert(contract.operation_specs.evaluate_lifecycle_preconditions.result_schema === evaluateSchema.schema_version, 'result_schema:operation_binding')
  const applyOperation = contract.operation_specs.apply_lifecycle_transition
  assert(applyOperation.schema_version === 'ctrl.g24.operation.apply-lifecycle-transition.r63.v1' && applyOperation.intent.schema_version === 'ctrl.g24.intent.lifecycle-transition.r63.v1', 'apply:versions')
  assert(!applyOperation.intent.exact_keys.includes('precondition_set_seal') && !applyOperation.intent.required.includes('precondition_set_seal') && !Object.hasOwn(applyOperation.intent.properties, 'precondition_set_seal'), 'apply:caller_seal_absent')
  const issuance = applyOperation.server_derived_precondition_set_seal_authority
  assert(issuance.proof_set_schema_ref === 'proof_set_schemas.lifecycle_preconditions' && issuance.set_seal_encoding_ref === 'set_seal_encoding' && issuance.owner_lineage_version_source === 'authoritative_row_schemas.lifecycle_transition_receipts.properties.row_version_ref', 'apply:seal_authorities')
  assert(issuance.owner_lineage_is_not_content_derived === true && issuance.caller_may_supply_owner_lineage_or_precondition_set_seal === false, 'apply:server_owned_lineage')
  assert(!applyOperation.intent.exact_keys.includes('row_version_ref') && !applyOperation.intent.required.includes('row_version_ref') && !Object.hasOwn(applyOperation.intent.properties, 'row_version_ref'), 'apply:caller_row_version_absent')
  assert(same(issuance.reservation_unique_scope, ['workspace_ref', 'operation_id', 'idempotency_key', 'authoritative_row_schemas.lifecycle_transition_receipts']), 'apply:reservation_scope')
  assert(issuance.registry_replay_precedes_fresh_reservation === true && issuance.exact_committed_replay_returns_stored_row_version_ref_and_precondition_set_seal_without_new_reservation === true, 'apply:replay')
  assert(issuance.reservation_is_transaction_local_until_atomic_transition_commit === true && issuance.failed_commit_rolls_back_reservation_seal_receipt_snapshot_and_consumptions_together === true && issuance.partial_reservation_or_cross_transaction_owner_seal_splice === 'forbidden', 'apply:rollback')
  assert(issuance.live_serializable_execution === 'unproved_outside_frozen_contract_fixture', 'apply:live_boundary')
  assert(same(issuance.issuance_order, ['resolve_exact_evaluate_result_evidence_rows_and_recompute_proof_members', 'reserve_unique_transition_receipt_row_version_ref', 'compute_owner_bound_precondition_set_seal', 'assemble_transition_receipt_with_the_same_row_version_ref_and_seal', 'commit_transition_receipt_snapshot_and_consumptions_atomically']), 'apply:issuance_order')
  const adjacency = new Map()
  for (const edge of issuance.dependency_edges) { assert(Array.isArray(edge) && edge.length === 2 && edge.every(item => typeof item === 'string' && item.length > 0), 'apply:dependency_edge'); const rows = adjacency.get(edge[0]) ?? []; rows.push(edge[1]); adjacency.set(edge[0], rows) }
  const visiting = new Set(), visited = new Set()
  function visit(node) { assert(!visiting.has(node), 'apply:dependency_cycle'); if (visited.has(node)) return; visiting.add(node); for (const next of adjacency.get(node) ?? []) visit(next); visiting.delete(node); visited.add(node) }
  for (const node of adjacency.keys()) visit(node)
  assert(issuance.dependency_cycle === 'forbidden', 'apply:cycle_rule')

  const authority = contract.authority_operation_ordering_rule_registry.matching_evidence_pair_authority
  const proof = contract.authority_operation_lifecycle_precondition_result_proof
  const snapshot = authority.frozen_persistence_snapshot
  const exportProof = contract.authority_operation_evaluator_export_parity_proof
  assert(proof.schema_version === 'ctrl.g24.lifecycle-precondition-result-proof.r64.v1' && contract.authority_operation_ordering_rule_registry.schema_version === 'ctrl.g24.ordering-rule-registry.r64.v1' && authority.schema_version === 'ctrl.g24.resolved-evidence-pair-ordering.r64.v1', 'r64:versioned_authorities')
  assert(exportProof.schema_version === 'ctrl.g24.evaluator-export-parity-proof.r64.v1', 'exports:proof_version')
  const operationNames = Object.keys(contract.operation_specs).sort(cp)
  assert(operationNames.length === 20 && same(exportProof.operation_names, operationNames), 'exports:operation_inventory')
  assert(exportProof.selected_operation === 'evaluate_lifecycle_preconditions' && exportProof.selected_result_schema_version === evaluateSchema.schema_version, 'exports:selected_schema')
  assert(contract.evaluator_abi.operation_result_exports_schema.schema_version === 'ctrl.g24.evaluator-operation-result-exports.r64.v1', 'exports:closed_schema_version')
  assert(same([...contract.evaluator_abi.operation_result_exports_schema.exact_keys].sort(cp), operationNames) && same([...contract.evaluator_abi.operation_result_exports_schema.required].sort(cp), operationNames), 'exports:closed_schema_keys')
  assert(exportProof.selected_current_evaluator_registry_members.length === 1 && exportProof.required_match_count_at_evaluated_at === 1 && exportProof.second_current_evaluator_bypass === 'forbidden', 'exports:one_current_evaluator')
  const selectedEvaluator = exportProof.selected_current_evaluator_registry_members[0]
  assert(same(selectedEvaluator, snapshot.evaluator_registry_member), 'exports:selected_registry_member')
  assert(selectedEvaluator.active_from <= snapshot.evaluated_at && snapshot.evaluated_at < selectedEvaluator.active_until, 'exports:selected_evaluator_current')
  const manifestArtifact = exportProof.evaluator_manifest_artifact
  const decodedManifest = decodeCanonical(manifestArtifact.canonical_manifest_bytes_b64url, manifestArtifact.canonical_manifest_bytes_sha256, 'exports:manifest')
  assert(same(decodedManifest.value, manifestArtifact.manifest_value), 'exports:manifest_value')
  assert(same(Object.keys(manifestArtifact.manifest_value), contract.evaluator_abi.manifest_canonical_bytes_cover), 'exports:manifest_cover')
  assert(selectedEvaluator.manifest_sha256 === manifestArtifact.canonical_manifest_bytes_sha256, 'exports:manifest_identity')
  const loadedArtifact = exportProof.loaded_evaluator_artifact
  const decodedArtifact = decodeCanonical(loadedArtifact.canonical_evaluator_bytes_b64url, loadedArtifact.canonical_evaluator_bytes_sha256, 'exports:loaded_artifact')
  assert(same(decodedArtifact.value, loadedArtifact.artifact_value), 'exports:loaded_artifact_value')
  assert(selectedEvaluator.artifact_sha256 === loadedArtifact.canonical_evaluator_bytes_sha256, 'exports:loaded_artifact_identity')
  assert(loadedArtifact.artifact_value.manifest_sha256 === manifestArtifact.canonical_manifest_bytes_sha256, 'exports:artifact_manifest_join')
  for (const operation of operationNames) {
    const schema = contract.result_payload_schemas[operation]
    assert(schema && typeof schema.schema_version === 'string', `exports:result_schema:${operation}`)
    const expected = schema.schema_version
    assert(contract.operation_specs[operation].result_schema === expected, `exports:operation:${operation}`)
    assert(contract.evaluator_abi.operation_result_exports[operation] === expected, `exports:abi_map:${operation}`)
    assert(contract.evaluator_abi.operation_result_exports_schema.properties[operation]?.const === expected, `exports:abi_const:${operation}`)
    assert(selectedEvaluator.operation_result_exports[operation] === expected, `exports:selected_evaluator:${operation}`)
    assert(manifestArtifact.manifest_value.operation_result_exports[operation] === expected, `exports:manifest_export:${operation}`)
    assert(loadedArtifact.artifact_value.operation_result_exports[operation] === expected, `exports:artifact_export:${operation}`)
    const schemaArtifact = manifestArtifact.manifest_value.all_exported_result_and_proof_schema_canonical_bytes.operation_results[operation]
    const decodedSchema = decodeCanonical(schemaArtifact.canonical_schema_bytes_b64url, schemaArtifact.canonical_schema_bytes_sha256, `exports:result_schema_bytes:${operation}`)
    assert(schemaArtifact.schema_version === expected && same(decodedSchema.value, schema), `exports:result_schema_artifact:${operation}`)
  }
  for (const family of Object.keys(contract.evaluator_abi.proof_family_exports).sort(cp)) {
    const schema = contract.proof_bundle_schemas.extensions[family]
    const expected = schema.schema_version
    assert(selectedEvaluator.proof_family_exports[family] === expected && manifestArtifact.manifest_value.proof_family_exports[family] === expected && loadedArtifact.artifact_value.proof_family_exports[family] === expected, `exports:proof_version:${family}`)
    const schemaArtifact = manifestArtifact.manifest_value.all_exported_result_and_proof_schema_canonical_bytes.proof_families[family]
    const decodedSchema = decodeCanonical(schemaArtifact.canonical_schema_bytes_b64url, schemaArtifact.canonical_schema_bytes_sha256, `exports:proof_schema_bytes:${family}`)
    assert(schemaArtifact.schema_version === expected && same(decodedSchema.value, schema), `exports:proof_schema_artifact:${family}`)
  }
  assert(authority.target_store_ref === 'authoritative_row_schemas.lifecycle_precondition_evidence' && authority.persistence_registry_ref === 'authority_operation_normative_persistence_registry', 'evidence:existing_store')
  assert(authority.decoded_evidence_schema_ref === 'authority_operation_lifecycle_precondition_evidence_input_schema', 'evidence:decoded_schema_ref')
  assert(authority.canonical_evidence_byte_length_equals_exact_decoded_byte_length === true && authority.evidence_schema_version_equals_decoded_evidence_schema_version === true && authority.decoded_evidence_bytes_are_canonical_and_recursively_validate_against_selected_closed_schema === true, 'evidence:closed_decode_claim')
  assert(snapshot.rows.length === 1, 'evidence:exact_one_row')
  const registryRows = contract.authority_operation_normative_persistence_registry.exact_rows.filter(row => row.store_path === snapshot.target_store_ref && row.row_schema_ref === snapshot.target_store_ref)
  assert(registryRows.length === 1 && same(registryRows[0], snapshot.persistence_registry_row), 'evidence:persistence_registry')
  const wrapper = snapshot.rows[0]
  assertExactKeys(wrapper, ['target_store_ref', 'row_schema_ref', 'row_schema_version', 'canonical_row_bytes_b64url', 'canonical_row_bytes_sha256', 'row_content_ref', 'row_value'], 'evidence:wrapper')
  assert(wrapper.target_store_ref === snapshot.target_store_ref && wrapper.row_schema_ref === registryRows[0].row_schema_ref && wrapper.row_schema_version === registryRows[0].row_schema_version, 'evidence:wrapper_authority')
  const decodedWrapper = decodeCanonical(wrapper.canonical_row_bytes_b64url, wrapper.canonical_row_bytes_sha256, 'evidence:wrapper_bytes')
  assert(wrapper.row_content_ref === wrapper.canonical_row_bytes_sha256 && same(decodedWrapper.value, wrapper.row_value), 'evidence:content_address')
  const row = wrapper.row_value
  validateR13RowSchema(contract, row, 'evidence:row')
  assert(row.evidence_schema_version === contract.authority_operation_lifecycle_precondition_evidence_input_schema.schema_version, 'evidence:schema_version')
  const evidenceBytes = Buffer.from(row.canonical_evidence_b64url, 'base64url')
  assert(evidenceBytes.toString('base64url') === row.canonical_evidence_b64url, 'evidence:canonical_base64url')
  assert(evidenceBytes.length === row.canonical_evidence_byte_length, 'evidence:byte_length')
  let evidenceInput
  try { evidenceInput = JSON.parse(evidenceBytes.toString('utf8')) } catch { throw new Error('evidence:decoded_json') }
  assert(evidenceBytes.toString('utf8') === canonicalR44(evidenceInput), 'evidence:decoded_canonical')
  validateEvidenceInput(contract, evidenceInput, 'evidence:decoded_schema')
  assert(evidenceInput.evidence_ref === row.evidence_ref, 'evidence:decoded_ref')
  assert(row.evidence_fingerprint === hash(fingerprintPreimage(contract.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, row)), 'evidence:semantic_fingerprint')
  assert(row.row_envelope_fingerprint === hash(fingerprintPreimage(contract.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, row)), 'evidence:envelope_fingerprint')
  const expectedInputSeal = sha(Buffer.from(canonicalR44([evidenceInput]), 'utf8'))
  assert(snapshot.evidence_input_set_seal === expectedInputSeal && row.evidence_input_set_seal === expectedInputSeal && proof.input_intent_seal.exact_value === expectedInputSeal, 'evidence:input_set_seal')
  assert(proof.input_intent_seal.scope === 'input_intent_and_persisted_evidence_rows_only' && proof.input_intent_seal.never_output_proof_set_seal === true, 'evidence:input_scope')
  assert(row.workspace_ref === snapshot.workspace_ref && row.subject_ref === snapshot.subject_ref && row.case_ref === snapshot.case_ref && row.snapshot_fingerprint === snapshot.snapshot_fingerprint && row.evaluated_at === snapshot.evaluated_at, 'evidence:snapshot_scope')
  assert(row.valid_from <= snapshot.evaluated_at && (!Object.hasOwn(row, 'valid_until') || row.valid_until > snapshot.evaluated_at), 'evidence:current')
  const evaluator = snapshot.evaluator_registry_member
  assert(evaluator.active_from <= snapshot.evaluated_at && snapshot.evaluated_at < evaluator.active_until, 'evidence:evaluator_current')
  assert(row.evaluator_id === evaluator.evaluator_id && row.evaluator_version_ref === evaluator.semantic_version && row.evaluator_semantic_version === evaluator.semantic_version && row.evaluator_artifact_sha256 === evaluator.artifact_sha256 && row.evaluator_manifest_sha256 === evaluator.manifest_sha256, 'evidence:evaluator')
  const catalogue = contract.lifecycle_precondition_catalog[row.transition_id]
  assert(catalogue && row.required_precondition_id === catalogue.required_precondition_id && row.precondition_canonical_text === catalogue.precondition_canonical_text && row.satisfied === true, 'evidence:catalogue')
  assert(Object.values(contract.lifecycle_precondition_catalog).every(item => typeof item.required_precondition_id === 'string') && new Set(Object.values(contract.lifecycle_precondition_catalog).map(item => item.required_precondition_id)).size === Object.keys(contract.lifecycle_precondition_catalog).length, 'catalogue:one_exact_precondition_per_transition')

  assert(proof.exact_satisfied_row_count === 1 && proof.exact_proof_member_count === 1 && proof.exact_lifecycle_proof_members.length === 1 && proof.exact_catalogue_required_precondition_ids.length === 1, 'proof:cardinality')
  const member = proof.exact_lifecycle_proof_members[0]
  const memberSchema = contract.proof_member_schemas.lifecycle_precondition
  assertExactKeys(member, memberSchema.exact_keys, 'proof:member')
  assert(member.transition_id === row.transition_id && member.precondition_id === row.required_precondition_id && member.precondition_canonical_text === row.precondition_canonical_text && member.evidence_ref === row.evidence_ref && member.evidence_fingerprint === row.evidence_fingerprint && member.evaluator_version_ref === row.evaluator_version_ref && member.satisfied_at === row.evaluated_at && member.from_state === catalogue.from_state && member.to_state === catalogue.to_state, 'proof:member_lineage')
  assert(member.member_fingerprint === hash(fingerprintPreimage(contract.proof_member_fingerprint_schemas.lifecycle_precondition, member)), 'proof:member_fingerprint')
  assert(proof.exact_catalogue_required_precondition_ids[0] === catalogue.required_precondition_id && proof.one_current_satisfied_row_per_exact_catalogue_precondition === true, 'proof:catalogue_cardinality')

  const stage = proof.transition_stage_set_seal
  assert(stage.proof_set_schema_ref === 'proof_set_schemas.lifecycle_preconditions' && stage.set_seal_encoding_ref === 'set_seal_encoding' && stage.set_member_identity_encoding_ref === 'set_member_identity_encoding', 'proof:set_authorities')
  assert(stage.owner_lineage_version_source === contract.proof_set_schemas.lifecycle_preconditions.owner_lineage_version_source && stage.owner_lineage_version_source === 'authoritative_row_schemas.lifecycle_transition_receipts.properties.row_version_ref', 'proof:owner_lineage_source')
  assert(stage.owner_lineage_available_during_evaluate_lifecycle_preconditions === false && stage.owner_lineage_issuance_authority_ref === 'operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority' && stage.planned_owner_lineage_is_server_reserved_before_seal_and_committed_on_the_same_transition_receipt === true && stage.evaluate_stage_output_proof_set_sealing === 'not_applicable_field_absent_from_R63_evaluate_result_schema', 'proof:honest_boundary')
  const codecFixture = stage.planned_transition_stage_fixture
  assert(codecFixture.set_kind === contract.proof_set_schemas.lifecycle_preconditions.set_kind && codecFixture.set_schema_version === contract.proof_set_schemas.lifecycle_preconditions.schema_version && codecFixture.canonical_member_count === 1, 'proof:codec_header')
  const recomputed = recomputeSetSeal(contract, codecFixture, [member])
  assert(same(codecFixture.sorted_member_entries, recomputed.entries) && codecFixture.exact_preimage_b64url === recomputed.bytes.toString('base64url') && codecFixture.exact_preimage_sha256 === recomputed.digest && codecFixture.computed_set_seal === recomputed.digest, 'proof:codec_digest')

  const resultFixture = proof.evaluate_result_fixture
  const resultDecoded = decodeCanonical(resultFixture.canonical_payload_b64url, resultFixture.canonical_payload_sha256, 'result:fixture')
  const result = resultDecoded.value
  assertExactKeys(result, contract.result_payload_schemas.evaluate_lifecycle_preconditions.exact_keys, 'result:payload')
  assert(result.transition_id === row.transition_id && result.predecessor_lifecycle_version_ref === row.predecessor_lifecycle_version_ref && result.evaluator_version_ref === row.evaluator_version_ref && result.evaluator_artifact_sha256 === row.evaluator_artifact_sha256, 'result:operation_lineage')
  assert(same(result.evidence_refs, [row.evidence_ref]) && same(result.evidence_fingerprints, [row.evidence_fingerprint]), 'result:evidence_exact')
  assert(!Object.hasOwn(result, 'precondition_set_seal'), 'result:seal_absent')
  assert(resultFixture.precondition_set_seal_semantics === 'field_absent_transition_stage_server_derives_owner_bound_seal' && resultFixture.semantic_scope === 'schema_evidence_resolution_catalogue_cardinality_and_evaluator_lineage_only', 'result:narrow_scope')
  assert(proof.input_seal_never_appears_in_evaluate_result === true, 'result:distinct_claim')

  const resultIds = result.evidence_refs.map(ref => {
    const matches = snapshot.rows.filter(item => item.row_value.evidence_ref === ref && item.row_value.required_precondition_id === catalogue.required_precondition_id && item.row_value.satisfied === true)
    assert(matches.length === 1, `result:exact_one:${ref}`)
    return matches[0].row_value.required_precondition_id
  })
  assert(resultIds.length === 1 && new Set(resultIds).size === 1 && resultIds[0] === catalogue.required_precondition_id, 'result:one_per_catalogue_precondition')

  const ordering = contract.authority_operation_ordering_rule_registry
  assert(ordering.exact_occurrence_count === 21 && ordering.exact_full_schema_positive_fixture_count === 21 && ordering.exact_full_schema_negative_fixture_count === 21 && ordering.exact_reversible_ordering_fixture_count === 19 && ordering.exact_singleton_cardinality_fixture_count === 2, 'ordering:counts')
  assert(ordering.occurrences.length === 21 && ordering.executable_full_schema_occurrence_fixtures.length === 21, 'ordering:row_counts')
  for (let index = 0; index < 21; index += 1) {
    const occurrence = ordering.occurrences[index]
    const fixture = ordering.executable_full_schema_occurrence_fixtures[index]
    assert(fixture.fixture_id === `ordering_${String(index + 1).padStart(2, '0')}`, `ordering:fixture_id:${index}`)
    assert(fixture.source_path === occurrence.source_path && fixture.exact_ordering_authority === occurrence.exact_ordering_authority, `ordering:occurrence:${index}`)
    const marker = '.properties.'
    const split = occurrence.source_path.lastIndexOf(marker)
    assert(split >= 2, `ordering:source_path:${index}`)
    const schemaPath = occurrence.source_path.slice(2, split)
    const field = occurrence.source_path.slice(split + marker.length)
    const schema = get(contract, schemaPath)
    const spec = get(contract, occurrence.source_path.slice(2))
    assert(schema?.properties?.[field] === spec, `ordering:source_resolution:${index}`)
    assert(fixture.containing_schema_ref === schemaPath && fixture.containing_schema_version === schema.schema_version && fixture.ordered_field === field && fixture.selected_spec_sha256 === hash(spec), `ordering:metadata:${index}`)
    const positive = decodeCanonical(fixture.positive.canonical_payload_b64url, fixture.positive.canonical_payload_sha256, `ordering:${fixture.fixture_id}:positive_full`).value
    const negative = decodeCanonical(fixture.negative.canonical_payload_b64url, fixture.negative.canonical_payload_sha256, `ordering:${fixture.fixture_id}:negative_full`).value
    if (schema.exact_keys) { assertClosedSchemaObject(positive, schema, `ordering:${fixture.fixture_id}:positive_schema`); assertClosedSchemaObject(negative, schema, `ordering:${fixture.fixture_id}:negative_schema`) }
    assert(Array.isArray(positive[field]) && Array.isArray(negative[field]), `ordering:${fixture.fixture_id}:ordered_arrays`)
    if (index !== 1 && index !== 2) {
      const inherited = materializedR63.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[index]
      assert(fixture.positive.canonical_payload_b64url === inherited.positive.canonical_payload_b64url && fixture.positive.canonical_payload_sha256 === inherited.positive.canonical_payload_sha256 && fixture.negative.canonical_payload_b64url === inherited.negative.canonical_payload_b64url && fixture.negative.canonical_payload_sha256 === inherited.negative.canonical_payload_sha256, `ordering:inherited_full_payload:${index}`)
    }
  }
  const singleton = ordering.executable_full_schema_occurrence_fixtures.filter(fixture => fixture.source_path.startsWith('$.result_payload_schemas.evaluate_lifecycle_preconditions.properties.evidence_'))
  assert(singleton.length === 2, 'ordering:singleton_sites')
  for (const fixture of singleton) {
    const positive = decodeCanonical(fixture.positive.canonical_payload_b64url, fixture.positive.canonical_payload_sha256, `ordering:${fixture.fixture_id}:positive`).value
    const negative = decodeCanonical(fixture.negative.canonical_payload_b64url, fixture.negative.canonical_payload_sha256, `ordering:${fixture.fixture_id}:negative`).value
    assert(same(positive, result) && fixture.reversible_ordering_witness_available === false && fixture.singleton_positive_and_duplicate_negative_only === true, `ordering:${fixture.fixture_id}:honest_boundary`)
    const field = fixture.ordered_field
    assert(negative[field].length === 2 && negative[field][0] === negative[field][1], `ordering:${fixture.fixture_id}:duplicate_negative`)
  }
  validateManifest(contract)
}

const actualBytes = readFileSync(join(root, machinePath), 'utf8')
assert(actualBytes === materializedR64Output, 'machine:exact_materialization')
validate(materializedR64)

let attacks = 0
function reject(name, mutate) {
  attacks += 1
  const candidate = structuredClone(materializedR64)
  mutate(candidate)
  let rejected = false
  try { validate(candidate) } catch { rejected = true }
  assert(rejected, `attack_accepted:${name}`)
}
const authorityOf = candidate => candidate.authority_operation_ordering_rule_registry.matching_evidence_pair_authority
const proofOf = candidate => candidate.authority_operation_lifecycle_precondition_result_proof
const snapshotOf = candidate => authorityOf(candidate).frozen_persistence_snapshot
function resealRow(candidate, options = {}) {
  const wrapper = snapshotOf(candidate).rows[0]
  const row = wrapper.row_value
  if (options.semantic !== false) row.evidence_fingerprint = hash(fingerprintPreimage(candidate.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, row))
  if (options.envelope !== false) row.row_envelope_fingerprint = hash(fingerprintPreimage(candidate.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, row))
  const bytes = Buffer.from(canonicalR44(row), 'utf8')
  wrapper.canonical_row_bytes_b64url = bytes.toString('base64url')
  wrapper.canonical_row_bytes_sha256 = sha(bytes)
  wrapper.row_content_ref = sha(bytes)
}
function resealResult(candidate, mutate) {
  const fixture = proofOf(candidate).evaluate_result_fixture
  const value = JSON.parse(Buffer.from(fixture.canonical_payload_b64url, 'base64url').toString('utf8'))
  mutate(value)
  const bytes = Buffer.from(canonicalR44(value), 'utf8')
  fixture.canonical_payload_b64url = bytes.toString('base64url')
  fixture.canonical_payload_sha256 = sha(bytes)
  return value
}

reject('input_output_seal_alias', candidate => { const input = snapshotOf(candidate).evidence_input_set_seal; resealResult(candidate, result => { result.precondition_set_seal = input }) })
reject('input_output_seal_claim_false', candidate => { proofOf(candidate).input_seal_never_appears_in_evaluate_result = false })
reject('input_scope_alias', candidate => { proofOf(candidate).input_intent_seal.never_output_proof_set_seal = false })
reject('output_semantics_overclaimed', candidate => { proofOf(candidate).evaluate_result_fixture.precondition_set_seal_semantics = 'fully_proved' })
reject('owner_lineage_available_early', candidate => { proofOf(candidate).transition_stage_set_seal.owner_lineage_available_during_evaluate_lifecycle_preconditions = true })
reject('owner_lineage_source_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.owner_lineage_version_source = 'evaluator.semantic_version' })
reject('codec_kind_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.set_kind = 'answer_chain' })
reject('codec_schema_version_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.set_schema_version = 'invented.v1' })
reject('codec_owner_lineage_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.owner_lineage_version = 'forged_owner' })
reject('codec_member_count_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.canonical_member_count = 2 })
reject('codec_entry_fingerprint_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.sorted_member_entries[0].raw_complete_record_sha256 = sha('wrong_record') })
reject('codec_entry_identity_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.sorted_member_entries[0].identity_bytes_sha256 = sha('wrong_identity') })
reject('codec_preimage_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.exact_preimage_b64url = Buffer.from('wrong').toString('base64url') })
reject('codec_digest_wrong', candidate => { proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture.computed_set_seal = sha('wrong_seal') })
reject('codec_member_order_wrong', candidate => { const fixture = proofOf(candidate).transition_stage_set_seal.planned_transition_stage_fixture; fixture.sorted_member_entries = [structuredClone(fixture.sorted_member_entries[0]), { ...structuredClone(fixture.sorted_member_entries[0]), identity_bytes_b64url: Buffer.from('z').toString('base64url') }].reverse() })
reject('evaluate_schema_restores_seal', candidate => { candidate.result_payload_schemas.evaluate_lifecycle_preconditions.exact_keys.push('precondition_set_seal'); candidate.result_payload_schemas.evaluate_lifecycle_preconditions.required.push('precondition_set_seal'); candidate.result_payload_schemas.evaluate_lifecycle_preconditions.properties.precondition_set_seal = { type: 'sha256' } })
reject('apply_intent_accepts_caller_seal', candidate => { candidate.operation_specs.apply_lifecycle_transition.intent.exact_keys.push('precondition_set_seal'); candidate.operation_specs.apply_lifecycle_transition.intent.required.push('precondition_set_seal'); candidate.operation_specs.apply_lifecycle_transition.intent.properties.precondition_set_seal = { type: 'sha256' } })
reject('apply_owner_lineage_content_derived', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.owner_lineage_is_not_content_derived = false })
reject('apply_issuance_order_cycle', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.issuance_order.reverse() })
reject('apply_accepts_caller_row_version', candidate => { const intent = candidate.operation_specs.apply_lifecycle_transition.intent; intent.exact_keys.push('row_version_ref'); intent.required.push('row_version_ref'); intent.properties.row_version_ref = { type: 'identifier' } })
reject('apply_replay_after_reservation', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.registry_replay_precedes_fresh_reservation = false })
reject('apply_replay_new_reservation', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.exact_committed_replay_returns_stored_row_version_ref_and_precondition_set_seal_without_new_reservation = false })
reject('apply_reservation_scope_missing_idempotency', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.reservation_unique_scope = ['workspace_ref', 'operation_id'] })
reject('apply_partial_reservation', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.reservation_is_transaction_local_until_atomic_transition_commit = false })
reject('apply_failed_commit_leaks_reservation', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.failed_commit_rolls_back_reservation_seal_receipt_snapshot_and_consumptions_together = false })
reject('apply_cross_transaction_splice', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.partial_reservation_or_cross_transaction_owner_seal_splice = 'allowed' })
reject('apply_dependency_cycle', candidate => { candidate.operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority.dependency_edges.push(['atomic_transition_commit', 'proof_members']) })
for (const [name, field, value] of [
  ['member_transition', 'transition_id', 'close_preparation'],
  ['member_precondition', 'precondition_id', 'wrong_precondition'],
  ['member_text', 'precondition_canonical_text', 'wrong_text'],
  ['member_evidence_ref', 'evidence_ref', 'wrong_evidence'],
  ['member_evidence_fingerprint', 'evidence_fingerprint', sha('wrong_evidence')],
  ['member_evaluator', 'evaluator_version_ref', 'wrong_evaluator'],
  ['member_satisfied_at', 'satisfied_at', '2031-01-02T00:00:00.000Z'],
  ['member_from_state', 'from_state', 'closed'],
  ['member_to_state', 'to_state', 'closed'],
]) reject(name, candidate => { const member = proofOf(candidate).exact_lifecycle_proof_members[0]; member[field] = value; member.member_fingerprint = hash(fingerprintPreimage(candidate.proof_member_fingerprint_schemas.lifecycle_precondition, member)) })
reject('member_fingerprint_wrong', candidate => { proofOf(candidate).exact_lifecycle_proof_members[0].member_fingerprint = sha('wrong_member') })
reject('member_omitted', candidate => { proofOf(candidate).exact_lifecycle_proof_members = [] })
reject('member_duplicate', candidate => { proofOf(candidate).exact_lifecycle_proof_members.push(structuredClone(proofOf(candidate).exact_lifecycle_proof_members[0])) })

reject('canonical_evidence_byte_length_wrong_coherent_row', candidate => { snapshotOf(candidate).rows[0].row_value.canonical_evidence_byte_length += 1; resealRow(candidate) })
reject('canonical_evidence_schema_version_wrong', candidate => { snapshotOf(candidate).rows[0].row_value.evidence_schema_version = 'invented.evidence.v1'; resealRow(candidate) })
reject('canonical_evidence_extra_key', candidate => { const row = snapshotOf(candidate).rows[0].row_value; const input = JSON.parse(Buffer.from(row.canonical_evidence_b64url, 'base64url').toString('utf8')); input.extra = true; const bytes = Buffer.from(canonicalR44(input), 'utf8'); row.canonical_evidence_b64url = bytes.toString('base64url'); row.canonical_evidence_byte_length = bytes.length; resealRow(candidate) })
reject('canonical_evidence_wrong_ref', candidate => { const row = snapshotOf(candidate).rows[0].row_value; const input = JSON.parse(Buffer.from(row.canonical_evidence_b64url, 'base64url').toString('utf8')); input.evidence_ref = 'wrong_inner_ref'; const bytes = Buffer.from(canonicalR44(input), 'utf8'); row.canonical_evidence_b64url = bytes.toString('base64url'); row.canonical_evidence_byte_length = bytes.length; resealRow(candidate) })
reject('canonical_evidence_value_nonstring', candidate => { const row = snapshotOf(candidate).rows[0].row_value; const input = JSON.parse(Buffer.from(row.canonical_evidence_b64url, 'base64url').toString('utf8')); input.evidence_value = 42; const bytes = Buffer.from(canonicalR44(input), 'utf8'); row.canonical_evidence_b64url = bytes.toString('base64url'); row.canonical_evidence_byte_length = bytes.length; resealRow(candidate) })
reject('canonical_evidence_noncanonical_json', candidate => { const row = snapshotOf(candidate).rows[0].row_value; const input = JSON.parse(Buffer.from(row.canonical_evidence_b64url, 'base64url').toString('utf8')); const bytes = Buffer.from(JSON.stringify(input, null, 2), 'utf8'); row.canonical_evidence_b64url = bytes.toString('base64url'); row.canonical_evidence_byte_length = bytes.length; resealRow(candidate) })

reject('duplicate_catalogue_evidence_row', candidate => { snapshotOf(candidate).rows.push(structuredClone(snapshotOf(candidate).rows[0])) })
reject('omitted_catalogue_evidence_row', candidate => { snapshotOf(candidate).rows = [] })
reject('extra_catalogue_precondition_row', candidate => { const extra = structuredClone(snapshotOf(candidate).rows[0]); extra.row_value.required_precondition_id = 'extra_precondition'; snapshotOf(candidate).rows.push(extra) })
reject('unsatisfied_catalogue_row', candidate => { snapshotOf(candidate).rows[0].row_value.satisfied = false; resealRow(candidate) })
reject('wrong_catalogue_precondition', candidate => { snapshotOf(candidate).rows[0].row_value.required_precondition_id = 'wrong_precondition'; resealRow(candidate) })
reject('wrong_catalogue_text', candidate => { snapshotOf(candidate).rows[0].row_value.precondition_canonical_text = 'wrong_text'; resealRow(candidate) })
reject('result_duplicate_evidence_ref', candidate => { resealResult(candidate, result => result.evidence_refs.push(result.evidence_refs[0])) })
reject('result_duplicate_evidence_fingerprint', candidate => { resealResult(candidate, result => result.evidence_fingerprints.push(result.evidence_fingerprints[0])) })
reject('result_omitted_evidence', candidate => { resealResult(candidate, result => { result.evidence_refs = []; result.evidence_fingerprints = [] }) })
reject('result_extra_evidence', candidate => { resealResult(candidate, result => { result.evidence_refs.push('extra'); result.evidence_fingerprints.push(sha('extra')) }) })
reject('result_wrong_status_row', candidate => { snapshotOf(candidate).rows[0].row_value.satisfied = false; resealRow(candidate); resealResult(candidate, result => { result.evidence_fingerprints[0] = snapshotOf(candidate).rows[0].row_value.evidence_fingerprint }) })
reject('result_ref_fingerprint_misalignment', candidate => { resealResult(candidate, result => { result.evidence_fingerprints[0] = sha('other') }) })
reject('result_wrong_evaluator', candidate => { resealResult(candidate, result => { result.evaluator_version_ref = 'wrong_evaluator' }) })
reject('snapshot_evaluator_expired', candidate => { snapshotOf(candidate).evaluator_registry_member.active_until = snapshotOf(candidate).evaluated_at })
reject('snapshot_evaluator_substituted', candidate => { snapshotOf(candidate).evaluator_registry_member.artifact_sha256 = sha('wrong_evaluator') })
reject('abi_map_stale_r13', candidate => { candidate.evaluator_abi.operation_result_exports.evaluate_lifecycle_preconditions = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('abi_const_stale_r13', candidate => { candidate.evaluator_abi.operation_result_exports_schema.properties.evaluate_lifecycle_preconditions.const = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('abi_const_missing', candidate => { delete candidate.evaluator_abi.operation_result_exports_schema.properties.evaluate_lifecycle_preconditions })
reject('operation_export_cross_operation', candidate => { candidate.evaluator_abi.operation_result_exports.evaluate_lifecycle_preconditions = candidate.evaluator_abi.operation_result_exports.record_answer })
reject('selected_evaluator_export_stale_r13', candidate => { candidate.authority_operation_evaluator_export_parity_proof.selected_current_evaluator_registry_members[0].operation_result_exports.evaluate_lifecycle_preconditions = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('manifest_export_stale_r13', candidate => { candidate.authority_operation_evaluator_export_parity_proof.evaluator_manifest_artifact.manifest_value.operation_result_exports.evaluate_lifecycle_preconditions = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('artifact_export_stale_r13', candidate => { candidate.authority_operation_evaluator_export_parity_proof.loaded_evaluator_artifact.artifact_value.operation_result_exports.evaluate_lifecycle_preconditions = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('second_current_evaluator_bypass', candidate => { candidate.authority_operation_evaluator_export_parity_proof.selected_current_evaluator_registry_members.push(structuredClone(candidate.authority_operation_evaluator_export_parity_proof.selected_current_evaluator_registry_members[0])) })
reject('evaluator_manifest_hash_substituted', candidate => { snapshotOf(candidate).evaluator_registry_member.manifest_sha256 = sha('other_manifest') })
reject('evaluator_artifact_hash_substituted', candidate => { snapshotOf(candidate).evaluator_registry_member.artifact_sha256 = sha('other_artifact') })
reject('row_not_current', candidate => { snapshotOf(candidate).rows[0].row_value.valid_from = '2032-01-01T00:00:00.000Z'; resealRow(candidate) })
reject('row_expired', candidate => { snapshotOf(candidate).rows[0].row_value.valid_until = snapshotOf(candidate).evaluated_at; resealRow(candidate) })
reject('input_set_seal_wrong', candidate => { snapshotOf(candidate).evidence_input_set_seal = sha('wrong_input') })
reject('input_row_set_seal_wrong', candidate => { snapshotOf(candidate).rows[0].row_value.evidence_input_set_seal = sha('wrong_input'); resealRow(candidate) })
reject('semantic_fingerprint_wrong', candidate => { snapshotOf(candidate).rows[0].row_value.evidence_fingerprint = sha('wrong_semantic'); resealRow(candidate, { semantic: false }) })
reject('envelope_fingerprint_wrong', candidate => { snapshotOf(candidate).rows[0].row_value.row_envelope_fingerprint = sha('wrong_envelope'); resealRow(candidate, { envelope: false }) })
reject('semantic_envelope_alias', candidate => { snapshotOf(candidate).rows[0].row_value.evidence_fingerprint = snapshotOf(candidate).rows[0].row_value.row_envelope_fingerprint; resealRow(candidate, { semantic: false }) })
reject('row_content_hash_wrong', candidate => { snapshotOf(candidate).rows[0].canonical_row_bytes_sha256 = sha('wrong_bytes') })
reject('row_content_ref_wrong', candidate => { snapshotOf(candidate).rows[0].row_content_ref = sha('wrong_ref') })
reject('row_schema_wrong', candidate => { snapshotOf(candidate).rows[0].row_schema_ref = 'invented.schema' })
reject('row_store_wrong', candidate => { snapshotOf(candidate).rows[0].target_store_ref = 'invented.store' })
reject('singleton_site_claim_wrong', candidate => { candidate.authority_operation_ordering_rule_registry.exact_singleton_cardinality_fixture_count = 1 })
reject('singleton_positive_changed', candidate => { const fixture = candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures.find(row => row.fixture_id === 'ordering_02'); fixture.positive.canonical_payload_sha256 = sha('wrong') })
reject('singleton_negative_not_duplicate', candidate => { const fixture = candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures.find(row => row.fixture_id === 'ordering_03'); fixture.negative.mutation = 'reverse' })
reject('ordering_02_stale_schema_version', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[1].containing_schema_version = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('ordering_03_stale_schema_version', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[2].containing_schema_version = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('ordering_source_path_splice', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[1].source_path = '$.result_payload_schemas.evaluate_lifecycle_preconditions.properties.evidence_fingerprints' })
reject('ordering_selected_spec_hash_stale', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[2].selected_spec_sha256 = sha('stale_spec') })
reject('ordering_field_path_splice', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[1].ordered_field = 'evidence_fingerprints' })
reject('manifest_source_mutation', candidate => { candidate.authority_operation_lifecycle_precondition_evidence_input_schema.properties.evidence_value.max_utf8_bytes = 4095 })

console.log(`ok: R64 exact; ${attacks} attacks; 20/20 operation export surfaces agree across result schema, operation, ABI map, ABI const, current evaluator, manifest and loaded artifact; one current evaluator; 21/21 ordering sites bind exact path/schema/spec/field metadata; R63 lifecycle seal, evidence and singleton controls preserved; ${materializedR64.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count} semantic refs; ${materializedR64.authority_runtime_semantic_manifest.exact_expected_count} manifest rows; frozen R63 preserved`)
