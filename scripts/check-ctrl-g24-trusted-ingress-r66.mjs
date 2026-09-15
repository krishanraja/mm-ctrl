import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR65, materializedR65Output } from './materialize-ctrl-g24-trusted-ingress-r65.mjs'
import { materializedR66, materializedR66Output, r66SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r66.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'
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

function decodeCanonical(b64url, expectedSha, label) {
  const bytes = Buffer.from(b64url, 'base64url')
  assert(bytes.toString('base64url') === b64url, `${label}:base64url`)
  assert(sha(bytes) === expectedSha, `${label}:sha256`)
  let value
  try { value = JSON.parse(bytes.toString('utf8')) } catch { throw new Error(`${label}:json`) }
  assert(bytes.toString('utf8') === canonicalR44(value), `${label}:canonical`)
  return { bytes, value }
}

function computeSetSeal(contract, fixture, members) {
  const identityAuthority = contract.set_member_identity_encoding
  const sealAuthority = contract.set_seal_encoding
  const projectionFields = ['evaluator_id', 'policy_lineage_ref', 'active_from']
  assert(identityAuthority.domain_ascii === 'CTRL-G24-SET-MEMBER-IDENTITY-R6', 'set:member_domain')
  assert(sealAuthority.domain_ascii === 'CTRL-G24-SET-SEAL-R6', 'set:seal_domain')
  assert(same(contract.set_member_identity_projections.evaluator_registry, projectionFields), 'set:projection')
  const entries = members.map(member => {
    const projectionValues = projectionFields.map(field => member[field])
    const identityBytes = Buffer.concat([Buffer.from(identityAuthority.domain_ascii, 'ascii'), frame(fixture.set_kind), ...projectionValues.map(frame)])
    const rawCompleteRecordSha256 = sha(Buffer.from(canonicalR44(member), 'utf8'))
    return {
      identity_projection_values: projectionValues,
      identity_bytes_b64url: identityBytes.toString('base64url'),
      identity_bytes_sha256: sha(identityBytes),
      raw_complete_record_sha256: rawCompleteRecordSha256,
      encoded_entry: Buffer.concat([frameBytes(identityBytes), Buffer.from(rawCompleteRecordSha256, 'hex')]),
    }
  })
  entries.sort((left, right) => Buffer.compare(Buffer.from(left.identity_bytes_b64url, 'base64url'), Buffer.from(right.identity_bytes_b64url, 'base64url')) || Buffer.compare(Buffer.from(left.raw_complete_record_sha256, 'hex'), Buffer.from(right.raw_complete_record_sha256, 'hex')))
  assert(new Set(entries.map(entry => entry.identity_bytes_b64url)).size === entries.length, 'set:duplicate_identity')
  const preimage = Buffer.concat([Buffer.from(sealAuthority.domain_ascii, 'ascii'), frame(fixture.set_kind), frame(fixture.set_schema_version), frame(fixture.owner_lineage_version), u64(entries.length), ...entries.map(entry => entry.encoded_entry)])
  return {
    set_kind: fixture.set_kind,
    set_schema_version: fixture.set_schema_version,
    owner_lineage_version: fixture.owner_lineage_version,
    canonical_member_count: entries.length,
    sorted_member_entries: entries.map(({ encoded_entry, ...entry }) => ({ ...entry, encoded_entry_b64url: encoded_entry.toString('base64url') })),
    exact_preimage_b64url: preimage.toString('base64url'),
    exact_preimage_sha256: sha(preimage),
    computed_set_seal: sha(preimage),
  }
}

function verifyMember(contract, wrapper, label) {
  const schema = contract.evaluator_abi.registry_member_schema
  const identity = contract.authority_operation_evaluator_registry_member_identity
  const member = wrapper.member_value
  assert(schema.schema_version === 'ctrl.g24.evaluator-registry-member.r65.v1', `${label}:schema_version`)
  assert(schema.additional_properties === false, `${label}:closed`)
  assert(same(Object.keys(member).sort(cp), schema.exact_keys.slice().sort(cp)), `${label}:keys`)
  for (const field of schema.required) assert(Object.hasOwn(member, field), `${label}:required:${field}`)
  const operations = Object.keys(contract.operation_specs).sort(cp)
  assert(same(Object.keys(member.operation_result_exports).sort(cp), operations), `${label}:operation_exports_keyset`)
  const { row_version_ref, registry_member_fingerprint, ...core } = member
  const expectedVersion = hash({ domain_ascii: identity.row_version.domain_ascii, member_without_row_version_ref_or_registry_member_fingerprint: core })
  assert(row_version_ref === expectedVersion, `${label}:row_version`)
  const expectedFingerprint = hash({ domain_ascii: identity.fingerprint.domain_ascii, member_without_registry_member_fingerprint: { ...core, row_version_ref } })
  assert(registry_member_fingerprint === expectedFingerprint, `${label}:fingerprint`)
  const decoded = decodeCanonical(wrapper.canonical_member_bytes_b64url, wrapper.canonical_member_bytes_sha256, `${label}:bytes`)
  assert(same(decoded.value, member), `${label}:decoded_value`)
  assert(wrapper.member_content_ref === wrapper.canonical_member_bytes_sha256, `${label}:content_ref`)
  assert(wrapper.member_row_version_ref === member.row_version_ref, `${label}:wrapper_version`)
  assert(wrapper.member_fingerprint === member.registry_member_fingerprint, `${label}:wrapper_fingerprint`)
  assert(wrapper.registry_member_schema_ref === 'evaluator_abi.registry_member_schema' && wrapper.registry_member_schema_version === schema.schema_version, `${label}:schema_binding`)
}

function matchesFor(contract, query) {
  const parity = contract.authority_operation_evaluator_export_parity_proof
  const snapshot = parity.complete_evaluator_registry_snapshot.snapshot_value
  const operations = Object.keys(contract.operation_specs).sort(cp)
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

function verifyManifest(contract) {
  const registry = contract.authority_runtime_semantic_reference_field_registry
  const sourcePaths = r66SemanticAuthorityPaths
  assert(same(registry.exact_source_paths, sourcePaths), 'manifest:source_paths')
  const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(contract, path))]))
  const expectedSnapshotSha = hash({ domain_ascii: 'CTRL-G24-R66-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
  assert(registry.source_snapshot_sha256 === expectedSnapshotSha, 'manifest:source_snapshot')
  const manifest = contract.authority_runtime_semantic_manifest
  const hashContract = contract.authority_runtime_semantic_manifest_hash_contract
  assert(manifest.exact_expected_count === sourcePaths.length && manifest.rows.length === sourcePaths.length, 'manifest:count')
  const byPath = new Map(manifest.rows.map(row => [row.authority_path, row]))
  assert(byPath.size === sourcePaths.length, 'manifest:unique')
  for (const path of sourcePaths) {
    const row = byPath.get(path)
    assert(row, `manifest:missing:${path}`)
    const expectedContent = hash({ domain_ascii: hashContract.content_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, path)) })
    assert(row.authority_content_sha256 === expectedContent, `manifest:content:${path}`)
  }
  const withoutSeal = { ...manifest }
  delete withoutSeal.manifest_envelope_seal_sha256
  assert(manifest.manifest_graph_sha256 === hash({ domain_ascii: hashContract.graph_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_rows: manifest.rows }), 'manifest:graph')
  assert(manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hashContract.envelope_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }), 'manifest:envelope')
}

function verify(contract) {
  assert(contract.supersedes.commit === '4880287a22a7fc101240a22a27a84b6731912aa4', 'parent:commit')
  assert(contract.supersedes.tree === '0b6d16183cbf0ffe423c726db18ed6dc8b845a56', 'parent:tree')
  assert(contract.supersedes.machine_blob === '8704aa493d7dbb372954cd31261d6628a1b2309f', 'parent:machine')
  assert(contract.materialization.frozen_input.sha256 === sha(materializedR65Output), 'parent:sha')
  assert(same(contract.authority_operation_evaluator_executable_boundary, materializedR65.authority_operation_evaluator_executable_boundary), 'boundary:R65_exact')

  const operations = Object.keys(contract.operation_specs).sort(cp)
  assert(operations.length === 20, 'operations:count')
  const abi = contract.evaluator_abi
  assert(same(abi.selection_key, ['operation_class', 'policy_lineage_ref', 'evaluated_at']), 'selection:key')
  assert(abi.operation_class_schema.schema_version === 'ctrl.g24.evaluator-operation-class.r66.v1', 'selection:operation_class_schema_version')
  assert(abi.operation_class_schema.type === 'enum' && same(abi.operation_class_schema.values, operations), 'selection:operation_class_vocabulary')
  assert(abi.operation_class_schema.family_aliases === 'forbidden', 'selection:family_aliases')
  assert(abi.registry_member_operation_class_applicability.operation_class_schema_ref === 'evaluator_abi.operation_class_schema', 'selection:member_applicability_schema')
  assert(abi.registry_member_operation_class_applicability.source === 'exact_codepoint_sorted_keys_of_member_operation_result_exports', 'selection:member_applicability_source')

  const parity = contract.authority_operation_evaluator_export_parity_proof
  const registry = parity.complete_evaluator_registry_snapshot
  const decodedSnapshot = decodeCanonical(registry.canonical_snapshot_bytes_b64url, registry.canonical_snapshot_bytes_sha256, 'snapshot')
  assert(registry.snapshot_content_ref === registry.canonical_snapshot_bytes_sha256, 'snapshot:content_ref')
  assert(same(decodedSnapshot.value, registry.snapshot_value), 'snapshot:value')
  assert(!Object.hasOwn(registry.snapshot_value, 'operation_class'), 'snapshot:no_family_alias')
  assert(registry.snapshot_value.operation_class_schema_ref === 'evaluator_abi.operation_class_schema', 'snapshot:operation_class_schema')
  assert(same(registry.snapshot_value.selection_key, abi.selection_key), 'snapshot:selection_key')
  assert(registry.frozen_snapshot_completeness === 'proved_for_the_exact_materialized_archive_scope', 'snapshot:frozen_scope')
  assert(registry.live_registry_completeness_and_serializable_selection === 'unproved_without_runtime_store_readback', 'snapshot:live_scope')
  assert(registry.snapshot_value.members.length === 1, 'snapshot:member_count')
  for (let index = 0; index < registry.snapshot_value.members.length; index += 1) verifyMember(contract, registry.snapshot_value.members[index], `member:${index}`)
  assert(same(registry.snapshot_value.evaluator_registry_set_seal, computeSetSeal(contract, registry.snapshot_value.evaluator_registry_set_seal, registry.snapshot_value.members.map(wrapper => wrapper.member_value))), 'snapshot:set_seal')

  const authority = contract.authority_operation_evaluator_registry_selection
  assert(authority.schema_version === 'ctrl.g24.evaluator-registry-selection-authority.r66.v1', 'selection:authority_version')
  assert(same(authority.locked_selection_key, abi.selection_key), 'selection:authority_key')
  assert(authority.operation_class_vocabulary_schema_ref === 'evaluator_abi.operation_class_schema', 'selection:vocabulary_ref')
  assert(authority.member_applicability_ref === 'evaluator_abi.registry_member_operation_class_applicability', 'selection:applicability_ref')
  assert(authority.selection_query_schema.additional_properties === false && authority.selection_proof_schema.additional_properties === false, 'selection:closed_schemas')
  assert(same(authority.selection_query_schema.exact_keys, Object.keys(authority.selection_query_schema.properties).sort(cp)), 'selection:query_schema_keys')
  assert(same(authority.selection_proof_schema.exact_keys, Object.keys(authority.selection_proof_schema.properties).sort(cp)), 'selection:proof_schema_keys')
  assert(authority.complete_snapshot_ref === registry.snapshot_content_ref, 'selection:snapshot_ref')
  assert(authority.exact_operation_class_count === 20 && authority.exact_selection_record_count === 20 && authority.selection_records.length === 20, 'selection:record_count')
  assert(authority.each_record_filters_the_entire_same_snapshot === true && authority.every_locked_selection_key_component_is_authoritative === true, 'selection:full_key_contract')
  const recordOperations = authority.selection_records.map(record => record.operation_class)
  assert(same(recordOperations, operations), 'selection:record_order_and_coverage')
  assert(new Set(recordOperations).size === 20, 'selection:record_unique')
  const selectedMember = registry.snapshot_value.members[0]
  for (let index = 0; index < authority.selection_records.length; index += 1) {
    const record = authority.selection_records[index]
    const operation = operations[index]
    const query = record.query
    const proof = record.proof
    assert(record.operation_class === operation, `selection:${operation}:record_operation`)
    assert(same(Object.keys(query).sort(cp), authority.selection_query_schema.exact_keys), `selection:${operation}:query_keys`)
    assert(query.schema_version === authority.selection_query_schema.schema_version, `selection:${operation}:query_schema`)
    assert(query.operation_class === operation, `selection:${operation}:query_operation`)
    assert(query.policy_lineage_ref === registry.snapshot_value.policy_lineage_ref, `selection:${operation}:query_policy`)
    assert(query.evaluated_at === registry.snapshot_value.evaluated_at, `selection:${operation}:query_time`)
    const { selection_query_fingerprint, ...queryCore } = query
    assert(selection_query_fingerprint === hash({ domain_ascii: authority.selection_query_fingerprint_authority.domain_ascii, selection_query_without_fingerprint: queryCore }), `selection:${operation}:query_fingerprint`)
    const matches = matchesFor(contract, query)
    assert(matches.length === 1, `selection:${operation}:exact_one`)
    assert(matches[0].member_content_ref === selectedMember.member_content_ref, `selection:${operation}:resolved_member`)
    assert(same(Object.keys(proof).sort(cp), authority.selection_proof_schema.exact_keys), `selection:${operation}:proof_keys`)
    assert(proof.schema_version === authority.selection_proof_schema.schema_version, `selection:${operation}:proof_schema`)
    assert(proof.selection_query_fingerprint === query.selection_query_fingerprint, `selection:${operation}:proof_query`)
    assert(proof.operation_class === query.operation_class && proof.policy_lineage_ref === query.policy_lineage_ref && proof.evaluated_at === query.evaluated_at, `selection:${operation}:proof_key_components`)
    assert(proof.source_snapshot_ref === registry.snapshot_content_ref && proof.source_snapshot_sha256 === registry.canonical_snapshot_bytes_sha256, `selection:${operation}:proof_snapshot`)
    assert(proof.source_registry_set_seal === registry.snapshot_value.evaluator_registry_set_seal.computed_set_seal, `selection:${operation}:proof_set_seal`)
    assert(proof.selected_match_count === matches.length, `selection:${operation}:proof_count`)
    assert(proof.selected_member_content_ref === matches[0].member_content_ref && proof.selected_member_row_version_ref === matches[0].member_row_version_ref && proof.selected_member_fingerprint === matches[0].member_fingerprint, `selection:${operation}:proof_member`)
    assert(proof.selected_result_schema_version === contract.result_payload_schemas[operation].schema_version, `selection:${operation}:proof_export`)
    assert(proof.selection_predicate === 'all_three_locked_selection_key_components_and_exact_per_operation_abi_export_compatibility', `selection:${operation}:predicate`)
    assert(proof.compatible_metadata_selection_is_not_execution_authority === true, `selection:${operation}:not_execution`)
    const { selection_proof_fingerprint, ...proofCore } = proof
    assert(selection_proof_fingerprint === hash({ domain_ascii: authority.selection_proof_fingerprint_authority.domain_ascii, selection_proof_without_fingerprint: proofCore }), `selection:${operation}:proof_fingerprint`)
  }

  assert(parity.current_evaluator_selection_derivation_ref === 'authority_operation_evaluator_registry_selection', 'parity:selection_ref')
  assert(!Object.hasOwn(parity, 'current_evaluator_selection_derivation'), 'parity:no_R65_singular_selection')
  assert(parity.required_compatible_metadata_match_count_per_operation === 1, 'parity:per_operation_count')
  assert(!Object.hasOwn(parity, 'required_compatible_metadata_match_count_at_evaluated_at'), 'parity:no_ambiguous_count')
  assert(same(parity.operation_names, operations), 'parity:operations')
  const member = selectedMember.member_value
  const descriptor = parity.evaluator_metadata_descriptor_artifact.descriptor_value
  for (const operation of operations) {
    const expected = contract.result_payload_schemas[operation].schema_version
    assert(contract.operation_specs[operation].result_schema === expected, `exports:${operation}:operation`)
    assert(abi.operation_result_exports[operation] === expected, `exports:${operation}:abi`)
    assert(abi.operation_result_exports_schema.properties[operation].const === expected, `exports:${operation}:const`)
    assert(member.operation_result_exports[operation] === expected, `exports:${operation}:member`)
    assert(parity.evaluator_manifest_artifact.manifest_value.operation_result_exports[operation] === expected, `exports:${operation}:manifest`)
    assert(descriptor.operation_result_exports[operation] === expected, `exports:${operation}:descriptor`)
  }

  const evaluateIndex = operations.indexOf('evaluate_lifecycle_preconditions')
  const expectedEvaluateRef = `authority_operation_evaluator_registry_selection.selection_records.${evaluateIndex}.proof`
  const evaluateProof = authority.selection_records[evaluateIndex].proof
  const ordering = contract.authority_operation_ordering_rule_registry
  const evidenceAuthority = ordering.matching_evidence_pair_authority
  assert(evidenceAuthority.evaluator_registry_snapshot_ref === registry.snapshot_content_ref, 'lineage:ordering_snapshot')
  assert(evidenceAuthority.evaluator_registry_selection_ref === expectedEvaluateRef, 'lineage:ordering_selection_ref')
  assert(evidenceAuthority.evaluator_registry_selection_proof_fingerprint === evaluateProof.selection_proof_fingerprint, 'lineage:ordering_selection_fp')
  const lifecycle = contract.authority_operation_lifecycle_precondition_result_proof
  assert(lifecycle.evaluator_registry_snapshot_ref === registry.snapshot_content_ref, 'lineage:lifecycle_snapshot')
  assert(lifecycle.evaluator_registry_selection_ref === expectedEvaluateRef, 'lineage:lifecycle_selection_ref')
  assert(lifecycle.evaluator_registry_selection_proof_fingerprint === evaluateProof.selection_proof_fingerprint, 'lineage:lifecycle_selection_fp')
  assert(same(ordering.executable_full_schema_occurrence_fixtures, materializedR65.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures), 'ordering:fixtures_preserved')
  assert(same(contract.authority_operation_evaluator_executable_boundary, materializedR65.authority_operation_evaluator_executable_boundary), 'execution:no_claim_change')

  const changed = [...new Set([...Object.keys(materializedR65), ...Object.keys(contract)].filter(key => {
    if (!Object.hasOwn(materializedR65, key) || !Object.hasOwn(contract, key)) return true
    return !same(materializedR65[key], contract[key])
  }))].sort(cp)
  const expectedChanged = [
    'authority_operation_evaluator_export_parity_proof',
    'authority_operation_evaluator_registry_selection',
    'authority_operation_lifecycle_precondition_result_proof',
    'authority_operation_ordering_rule_registry',
    'authority_runtime_semantic_dependency_owner_map',
    'authority_runtime_semantic_manifest',
    'authority_runtime_semantic_manifest_hash_contract',
    'authority_runtime_semantic_reference_field_registry',
    'authority_runtime_semantic_reference_owner_map',
    'evaluator_abi',
    'materialization',
    'required_negative_fixture_families',
    'schema_change_manifest',
    'status',
    'supersedes',
  ].sort(cp)
  assert(same(changed, expectedChanged), 'delta:exact_top_level')
  verifyManifest(contract)
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r65.json'), 'utf8') === materializedR65Output, 'frozen_R65_machine')
const actualBytes = readFileSync(join(root, machinePath), 'utf8')
assert(actualBytes === materializedR66Output, 'materialized_R66_exact')
verify(materializedR66)

let attacks = 0
function reject(name, mutate) {
  attacks += 1
  const candidate = structuredClone(materializedR66)
  let failed = false
  try { mutate(candidate); verify(candidate) } catch { failed = true }
  assert(failed, `attack_accepted:${name}`)
}
const parityOf = candidate => candidate.authority_operation_evaluator_export_parity_proof
const registryOf = candidate => parityOf(candidate).complete_evaluator_registry_snapshot
const authorityOf = candidate => candidate.authority_operation_evaluator_registry_selection
const memberOf = candidate => registryOf(candidate).snapshot_value.members[0]
function resealRecord(candidate, record) {
  const authority = authorityOf(candidate)
  const { selection_query_fingerprint, ...queryCore } = record.query
  record.query.selection_query_fingerprint = hash({ domain_ascii: authority.selection_query_fingerprint_authority.domain_ascii, selection_query_without_fingerprint: queryCore })
  record.proof.selection_query_fingerprint = record.query.selection_query_fingerprint
  record.proof.operation_class = record.query.operation_class
  record.proof.policy_lineage_ref = record.query.policy_lineage_ref
  record.proof.evaluated_at = record.query.evaluated_at
  const { selection_proof_fingerprint, ...proofCore } = record.proof
  record.proof.selection_proof_fingerprint = hash({ domain_ascii: authority.selection_proof_fingerprint_authority.domain_ascii, selection_proof_without_fingerprint: proofCore })
}
function resealMember(candidate, wrapper) {
  const member = wrapper.member_value
  const identity = candidate.authority_operation_evaluator_registry_member_identity
  const { row_version_ref, registry_member_fingerprint, ...core } = member
  member.row_version_ref = hash({ domain_ascii: identity.row_version.domain_ascii, member_without_row_version_ref_or_registry_member_fingerprint: core })
  member.registry_member_fingerprint = hash({ domain_ascii: identity.fingerprint.domain_ascii, member_without_registry_member_fingerprint: { ...core, row_version_ref: member.row_version_ref } })
  const bytes = Buffer.from(canonicalR44(member), 'utf8')
  wrapper.canonical_member_bytes_b64url = bytes.toString('base64url')
  wrapper.canonical_member_bytes_sha256 = sha(bytes)
  wrapper.member_content_ref = sha(bytes)
  wrapper.member_row_version_ref = member.row_version_ref
  wrapper.member_fingerprint = member.registry_member_fingerprint
}
function resealRegistry(candidate) {
  const registry = registryOf(candidate)
  for (const wrapper of registry.snapshot_value.members) resealMember(candidate, wrapper)
  const oldSeal = registry.snapshot_value.evaluator_registry_set_seal
  registry.snapshot_value.evaluator_registry_set_seal = computeSetSeal(candidate, oldSeal, registry.snapshot_value.members.map(wrapper => wrapper.member_value))
  const bytes = Buffer.from(canonicalR44(registry.snapshot_value), 'utf8')
  registry.canonical_snapshot_bytes_b64url = bytes.toString('base64url')
  registry.canonical_snapshot_bytes_sha256 = sha(bytes)
  registry.snapshot_content_ref = sha(bytes)
  authorityOf(candidate).complete_snapshot_ref = sha(bytes)
  for (const record of authorityOf(candidate).selection_records) {
    record.proof.source_snapshot_ref = sha(bytes)
    record.proof.source_snapshot_sha256 = sha(bytes)
    record.proof.source_registry_set_seal = registry.snapshot_value.evaluator_registry_set_seal.computed_set_seal
    resealRecord(candidate, record)
  }
}

reject('locked_selection_key_operation_removed', candidate => { candidate.evaluator_abi.selection_key = ['policy_lineage_ref', 'evaluated_at'] })
reject('locked_selection_key_policy_removed', candidate => { candidate.evaluator_abi.selection_key = ['operation_class', 'evaluated_at'] })
reject('locked_selection_key_time_removed', candidate => { candidate.evaluator_abi.selection_key = ['operation_class', 'policy_lineage_ref'] })
reject('locked_selection_key_reordered', candidate => { candidate.evaluator_abi.selection_key.reverse() })
reject('operation_class_vocabulary_alias', candidate => { candidate.evaluator_abi.operation_class_schema.values[0] = 'trusted_ingress' })
reject('operation_class_vocabulary_missing', candidate => { candidate.evaluator_abi.operation_class_schema.values.pop() })
reject('operation_class_vocabulary_duplicate', candidate => { candidate.evaluator_abi.operation_class_schema.values[1] = candidate.evaluator_abi.operation_class_schema.values[0] })
reject('operation_class_family_alias_allowed', candidate => { candidate.evaluator_abi.operation_class_schema.family_aliases = 'allowed' })
reject('snapshot_alias_reintroduced', candidate => { registryOf(candidate).snapshot_value.operation_class = 'trusted_ingress'; resealRegistry(candidate) })
reject('unknown_trusted_ingress_query', candidate => { const record = authorityOf(candidate).selection_records[0]; record.operation_class = 'trusted_ingress'; record.query.operation_class = 'trusted_ingress'; resealRecord(candidate, record) })
reject('selection_record_missing_operation', candidate => { authorityOf(candidate).selection_records.pop(); authorityOf(candidate).exact_selection_record_count -= 1 })
reject('selection_record_duplicate_operation', candidate => { const records = authorityOf(candidate).selection_records; records[1].operation_class = records[0].operation_class; records[1].query.operation_class = records[0].query.operation_class; resealRecord(candidate, records[1]) })
reject('selection_record_order_changed', candidate => { authorityOf(candidate).selection_records.reverse() })
reject('query_operation_missing', candidate => { delete authorityOf(candidate).selection_records[0].query.operation_class })
reject('query_policy_missing', candidate => { delete authorityOf(candidate).selection_records[0].query.policy_lineage_ref })
reject('query_time_missing', candidate => { delete authorityOf(candidate).selection_records[0].query.evaluated_at })
reject('query_extra_field', candidate => { authorityOf(candidate).selection_records[0].query.caller_override = true })
reject('query_fingerprint_splice', candidate => { authorityOf(candidate).selection_records[0].query.selection_query_fingerprint = sha('wrong') })
reject('query_wrong_policy_coherent', candidate => { const record = authorityOf(candidate).selection_records[0]; record.query.policy_lineage_ref = 'other_policy'; resealRecord(candidate, record) })
reject('query_wrong_time_coherent', candidate => { const record = authorityOf(candidate).selection_records[0]; record.query.evaluated_at = '2040-01-01T00:00:00.000Z'; resealRecord(candidate, record) })
reject('proof_cross_operation_result_export', candidate => { const record = authorityOf(candidate).selection_records[0]; record.proof.selected_result_schema_version = authorityOf(candidate).selection_records[1].proof.selected_result_schema_version; resealRecord(candidate, record) })
reject('proof_operation_splice', candidate => { authorityOf(candidate).selection_records[0].proof.operation_class = 'use_release' })
reject('proof_policy_splice', candidate => { authorityOf(candidate).selection_records[0].proof.policy_lineage_ref = 'other_policy' })
reject('proof_time_splice', candidate => { authorityOf(candidate).selection_records[0].proof.evaluated_at = '2040-01-01T00:00:00.000Z' })
reject('proof_snapshot_ref_splice', candidate => { authorityOf(candidate).selection_records[0].proof.source_snapshot_ref = sha('wrong') })
reject('proof_snapshot_sha_splice', candidate => { authorityOf(candidate).selection_records[0].proof.source_snapshot_sha256 = sha('wrong') })
reject('proof_set_seal_splice', candidate => { authorityOf(candidate).selection_records[0].proof.source_registry_set_seal = sha('wrong') })
reject('proof_member_ref_splice', candidate => { authorityOf(candidate).selection_records[0].proof.selected_member_content_ref = sha('wrong') })
reject('proof_member_version_splice', candidate => { authorityOf(candidate).selection_records[0].proof.selected_member_row_version_ref = sha('wrong') })
reject('proof_member_fingerprint_splice', candidate => { authorityOf(candidate).selection_records[0].proof.selected_member_fingerprint = sha('wrong') })
reject('proof_count_lie', candidate => { authorityOf(candidate).selection_records[0].proof.selected_match_count = 2 })
reject('proof_predicate_weakened', candidate => { authorityOf(candidate).selection_records[0].proof.selection_predicate = 'policy_and_time_only' })
reject('proof_execution_authority', candidate => { authorityOf(candidate).selection_records[0].proof.compatible_metadata_selection_is_not_execution_authority = false })
reject('proof_fingerprint_splice', candidate => { authorityOf(candidate).selection_records[0].proof.selection_proof_fingerprint = sha('wrong') })
reject('snapshot_member_omitted', candidate => { registryOf(candidate).snapshot_value.members = []; resealRegistry(candidate) })
reject('snapshot_member_stale', candidate => { memberOf(candidate).member_value.active_until = registryOf(candidate).snapshot_value.evaluated_at; resealRegistry(candidate) })
reject('snapshot_member_future', candidate => { memberOf(candidate).member_value.active_from = '2040-01-01T00:00:00.000Z'; resealRegistry(candidate) })
reject('member_operation_export_missing', candidate => { delete memberOf(candidate).member_value.operation_result_exports.use_release; resealRegistry(candidate) })
reject('member_operation_export_wrong', candidate => { memberOf(candidate).member_value.operation_result_exports.use_release = 'ctrl.g24.result.use-release.wrong.v1'; resealRegistry(candidate) })
reject('member_claims_operation_without_export', candidate => { memberOf(candidate).member_value.supported_operation_classes = Object.keys(memberOf(candidate).member_value.operation_result_exports); resealRegistry(candidate) })
reject('second_current_for_one_operation', candidate => {
  const registry = registryOf(candidate)
  const second = structuredClone(memberOf(candidate))
  second.member_value.evaluator_id = 'overlap_use_release_only'
  for (const operation of Object.keys(second.member_value.operation_result_exports)) if (operation !== 'use_release') second.member_value.operation_result_exports[operation] = `incompatible.${operation}`
  registry.snapshot_value.members.push(second)
  resealRegistry(candidate)
})
reject('parity_old_singular_selection_reintroduced', candidate => { parityOf(candidate).current_evaluator_selection_derivation = {} })
reject('parity_per_operation_count_weakened', candidate => { parityOf(candidate).required_compatible_metadata_match_count_per_operation = 0 })
reject('ordering_selection_ref_splice', candidate => { candidate.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.evaluator_registry_selection_ref = 'authority_operation_evaluator_registry_selection.selection_records.0.proof' })
reject('ordering_selection_fp_splice', candidate => { candidate.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.evaluator_registry_selection_proof_fingerprint = sha('wrong') })
reject('lifecycle_selection_ref_splice', candidate => { candidate.authority_operation_lifecycle_precondition_result_proof.evaluator_registry_selection_ref = 'authority_operation_evaluator_registry_selection.selection_records.0.proof' })
reject('lifecycle_selection_fp_splice', candidate => { candidate.authority_operation_lifecycle_precondition_result_proof.evaluator_registry_selection_proof_fingerprint = sha('wrong') })
reject('R65_executable_boundary_changed', candidate => { candidate.authority_operation_evaluator_executable_boundary.metadata_descriptor_fallback_to_code = 'allowed' })
reject('manifest_source_mutation', candidate => { candidate.authority_operation_evaluator_registry_selection.every_locked_selection_key_component_is_authoritative = false })

console.log(`ok: R66 exact; ${attacks} attacks; locked selection key preserved; ${materializedR66.authority_operation_evaluator_registry_selection.selection_records.length}/20 exact operation-class queries independently filter the same complete sealed snapshot by operation, policy and time; 20/20 unique current compatibility proofs bind snapshot, set seal and member identities; executable behavior remains closed and unproved; 20/20 seven-surface metadata exports and 21/21 ordering bindings preserved; ${materializedR66.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count} semantic refs; ${materializedR66.authority_runtime_semantic_manifest.exact_expected_count} manifest rows; frozen R65 preserved`)
