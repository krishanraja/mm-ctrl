import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR64, materializedR64Output } from './materialize-ctrl-g24-trusted-ingress-r64.mjs'
import { materializedR65, materializedR65Output, r65SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r65.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r65.json'
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

function decodeCanonical(b64url, expectedSha, label) {
  const bytes = Buffer.from(b64url, 'base64url')
  assert(bytes.toString('base64url') === b64url, `${label}:base64url`)
  assert(sha(bytes) === expectedSha, `${label}:sha256`)
  let value
  try { value = JSON.parse(bytes.toString('utf8')) } catch { throw new Error(`${label}:json`) }
  assert(bytes.toString('utf8') === canonicalR44(value), `${label}:canonical`)
  return { bytes, value }
}

function computeSetSeal(contract, fixture, members, projectionFields) {
  const identityAuthority = contract.set_member_identity_encoding
  const sealAuthority = contract.set_seal_encoding
  assert(identityAuthority.domain_ascii === 'CTRL-G24-SET-MEMBER-IDENTITY-R6', 'set:member_domain')
  assert(sealAuthority.domain_ascii === 'CTRL-G24-SET-SEAL-R6', 'set:seal_domain')
  const declared = contract.set_member_identity_projections[fixture.set_kind]
  if (declared !== undefined) assert(same(declared, projectionFields), 'set:projection')
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

function deriveMatches(contract) {
  const parity = contract.authority_operation_evaluator_export_parity_proof
  const snapshot = parity.complete_evaluator_registry_snapshot.snapshot_value
  return snapshot.members.filter(wrapper => {
    const member = wrapper.member_value
    return member.policy_lineage_ref === snapshot.policy_lineage_ref &&
      member.active_from <= snapshot.evaluated_at && snapshot.evaluated_at < member.active_until &&
      same(member.operation_result_exports, contract.evaluator_abi.operation_result_exports) &&
      same(member.proof_family_exports, contract.evaluator_abi.proof_family_exports)
  })
}

function verifyMember(contract, wrapper, label) {
  const schema = contract.evaluator_abi.registry_member_schema
  const identity = contract.authority_operation_evaluator_registry_member_identity
  const member = wrapper.member_value
  assert(schema.schema_version === 'ctrl.g24.evaluator-registry-member.r65.v1', `${label}:schema_version`)
  assert(schema.additional_properties === false, `${label}:closed`)
  assert(same(Object.keys(member).sort(cp), schema.exact_keys.slice().sort(cp)), `${label}:keys`)
  for (const field of schema.required) assert(Object.hasOwn(member, field), `${label}:required:${field}`)
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

function verifyManifest(contract) {
  const registry = contract.authority_runtime_semantic_reference_field_registry
  const sourcePaths = r65SemanticAuthorityPaths
  assert(same(registry.exact_source_paths, sourcePaths), 'manifest:source_paths')
  const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(contract, path))]))
  const expectedSnapshotSha = hash({ domain_ascii: 'CTRL-G24-R65-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
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
  assert(contract.supersedes.commit === '62386efe1d0e74e33a94fe46ec865b6da4921cc9', 'parent:commit')
  assert(contract.supersedes.tree === '01dfe04b56255ea84016fa197c81a43a3e26c946', 'parent:tree')
  assert(contract.supersedes.machine_blob === 'ac82a1a6314e2c55103a8269069f5bf9367a6c60', 'parent:machine')
  assert(contract.materialization.frozen_input.sha256 === sha(materializedR64Output), 'parent:sha')

  const abi = contract.evaluator_abi
  const boundary = contract.authority_operation_evaluator_executable_boundary
  const parity = contract.authority_operation_evaluator_export_parity_proof
  assert(!Object.hasOwn(abi, 'artifact_sha256_must_be_computed_from_loaded_immutable_evaluator_bytes'), 'boundary:legacy_abi_claim')
  assert(!Object.hasOwn(parity, 'loaded_evaluator_artifact'), 'boundary:legacy_loaded_artifact')
  assert(!Object.hasOwn(parity, 'selected_current_evaluator_registry_members'), 'registry:legacy_selected_array')
  assert(abi.artifact_sha256_field_semantics === 'canonical_compatibility_metadata_descriptor_sha256_only', 'boundary:descriptor_semantics')
  assert(abi.executable_behavior_binding === 'unproved_no_frozen_source_module_or_binary', 'boundary:unproved')
  assert(boundary.discovered_runtime_implementation_paths.length === 0, 'boundary:no_implementation')
  assert(boundary.unrelated_fixture_adapter_must_not_be_selected_as_evaluator === true, 'boundary:unrelated_adapter')
  assert(boundary.compatibility_metadata_descriptor_is_not_executable_code === true, 'boundary:metadata_not_code')
  assert(boundary.required_kernel_dispatch_preconditions.length === 8, 'boundary:precondition_count')
  assert(boundary.currently_satisfied_kernel_dispatch_preconditions.length === 0, 'boundary:satisfied_none')
  assert(boundary.absent_missing_mismatched_truncated_alternate_or_unreviewed_executable_authority === 'deterministic_evaluator_artifact_hold_without_kernel_execution_or_result_generation', 'boundary:fail_closed')
  assert(boundary.metadata_descriptor_fallback_to_code === 'forbidden', 'boundary:no_fallback')
  assert(boundary.result_generation_without_verified_executable_authority === 'forbidden', 'boundary:no_result_without_code')
  assert(parity.kernel_execution_result_generation_or_evidence_write === 'forbidden_until_executable_boundary_all_preconditions_are_satisfied', 'boundary:parity_gate')

  const descriptor = parity.evaluator_metadata_descriptor_artifact
  assert(descriptor.semantic_scope === 'compatibility_metadata_only_not_executable_behavior', 'descriptor:scope')
  assert(descriptor.executable_content_ref === 'UNAVAILABLE' && descriptor.executable_entrypoint === 'UNAVAILABLE' && descriptor.executable_module_format === 'UNAVAILABLE', 'descriptor:no_executable')
  const decodedDescriptor = decodeCanonical(descriptor.canonical_descriptor_bytes_b64url, descriptor.canonical_descriptor_bytes_sha256, 'descriptor')
  assert(descriptor.descriptor_content_ref === descriptor.canonical_descriptor_bytes_sha256, 'descriptor:content_ref')
  assert(same(decodedDescriptor.value, descriptor.descriptor_value), 'descriptor:value')

  const registry = parity.complete_evaluator_registry_snapshot
  const snapshotDecoded = decodeCanonical(registry.canonical_snapshot_bytes_b64url, registry.canonical_snapshot_bytes_sha256, 'registry_snapshot')
  assert(registry.snapshot_content_ref === registry.canonical_snapshot_bytes_sha256, 'registry_snapshot:content_ref')
  assert(same(snapshotDecoded.value, registry.snapshot_value), 'registry_snapshot:value')
  assert(registry.frozen_snapshot_completeness === 'proved_for_the_exact_materialized_archive_scope', 'registry_snapshot:frozen_scope')
  assert(registry.live_registry_completeness_and_serializable_selection === 'unproved_without_runtime_store_readback', 'registry_snapshot:live_scope')
  const members = registry.snapshot_value.members
  assert(members.length === 1, 'registry_snapshot:frozen_source_count')
  for (let index = 0; index < members.length; index += 1) verifyMember(contract, members[index], `registry_member:${index}`)
  const seal = registry.snapshot_value.evaluator_registry_set_seal
  assert(same(seal, computeSetSeal(contract, seal, members.map(wrapper => wrapper.member_value), ['evaluator_id', 'policy_lineage_ref', 'active_from'])), 'registry_snapshot:set_seal')
  const matches = deriveMatches(contract)
  assert(matches.length === 1, 'registry_selection:exact_one')
  const selected = matches[0]
  const selection = parity.current_evaluator_selection_derivation
  assert(selection.selected_match_count === 1, 'registry_selection:recorded_count')
  assert(selection.source_snapshot_ref === registry.snapshot_content_ref && selection.source_snapshot_sha256 === registry.canonical_snapshot_bytes_sha256, 'registry_selection:snapshot')
  assert(selection.selected_member_content_ref === selected.member_content_ref, 'registry_selection:content')
  assert(selection.selected_member_row_version_ref === selected.member_row_version_ref, 'registry_selection:version')
  assert(selection.selected_member_fingerprint === selected.member_fingerprint, 'registry_selection:fingerprint')
  assert(selection.compatible_metadata_selection_is_not_execution_authority === true, 'registry_selection:not_execution')
  const member = selected.member_value
  assert(member.artifact_sha256 === descriptor.canonical_descriptor_bytes_sha256, 'registry_member:descriptor_hash')
  assert(member.manifest_sha256 === parity.evaluator_manifest_artifact.canonical_manifest_bytes_sha256, 'registry_member:manifest_hash')

  const operations = Object.keys(contract.operation_specs).sort(cp)
  assert(operations.length === 20 && same(parity.operation_names, operations), 'exports:operations')
  for (const operation of operations) {
    const expected = contract.result_payload_schemas[operation].schema_version
    assert(contract.operation_specs[operation].result_schema === expected, `exports:operation:${operation}`)
    assert(abi.operation_result_exports[operation] === expected, `exports:abi:${operation}`)
    assert(abi.operation_result_exports_schema.properties[operation].const === expected, `exports:const:${operation}`)
    assert(member.operation_result_exports[operation] === expected, `exports:member:${operation}`)
    assert(parity.evaluator_manifest_artifact.manifest_value.operation_result_exports[operation] === expected, `exports:manifest:${operation}`)
    assert(descriptor.descriptor_value.operation_result_exports[operation] === expected, `exports:descriptor:${operation}`)
  }

  const evidenceAuthority = contract.authority_operation_ordering_rule_registry.matching_evidence_pair_authority
  const evidenceSnapshot = evidenceAuthority.frozen_persistence_snapshot
  assert(same(evidenceSnapshot.evaluator_registry_member, member), 'lineage:snapshot_member')
  assert(evidenceAuthority.evaluator_registry_snapshot_ref === registry.snapshot_content_ref, 'lineage:snapshot_ref')
  const evidenceWrapper = evidenceSnapshot.rows[0]
  const evidenceRow = evidenceWrapper.row_value
  assert(evidenceRow.evaluator_artifact_sha256 === descriptor.canonical_descriptor_bytes_sha256, 'lineage:evidence_descriptor')
  assert(evidenceRow.evaluator_manifest_sha256 === member.manifest_sha256 && evidenceRow.evaluator_semantic_version === member.semantic_version, 'lineage:evidence_member')
  assert(evidenceRow.evidence_fingerprint === hash(fingerprintPreimage(contract.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, evidenceRow)), 'lineage:evidence_fingerprint')
  assert(evidenceRow.row_envelope_fingerprint === hash(fingerprintPreimage(contract.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, evidenceRow)), 'lineage:evidence_envelope')
  const decodedEvidence = decodeCanonical(evidenceWrapper.canonical_row_bytes_b64url, evidenceWrapper.canonical_row_bytes_sha256, 'lineage:evidence_bytes')
  assert(same(decodedEvidence.value, evidenceRow) && evidenceWrapper.row_content_ref === evidenceWrapper.canonical_row_bytes_sha256, 'lineage:evidence_wrapper')

  const lifecycle = contract.authority_operation_lifecycle_precondition_result_proof
  const proofMember = lifecycle.exact_lifecycle_proof_members[0]
  assert(lifecycle.evaluator_registry_snapshot_ref === registry.snapshot_content_ref, 'lineage:proof_snapshot')
  assert(lifecycle.evaluator_registry_member_row_version_ref === member.row_version_ref && lifecycle.evaluator_registry_member_fingerprint === member.registry_member_fingerprint, 'lineage:proof_member_identity')
  assert(lifecycle.executable_boundary_ref === 'authority_operation_evaluator_executable_boundary', 'lineage:proof_boundary')
  assert(lifecycle.frozen_result_fixture_is_schema_and_lineage_evidence_not_claimed_runtime_output === true, 'lineage:fixture_scope')
  assert(proofMember.evidence_fingerprint === evidenceRow.evidence_fingerprint && proofMember.evaluator_version_ref === member.semantic_version, 'lineage:proof_member')
  assert(proofMember.member_fingerprint === hash(fingerprintPreimage(contract.proof_member_fingerprint_schemas.lifecycle_precondition, proofMember)), 'lineage:proof_member_fingerprint')
  const resultDecoded = decodeCanonical(lifecycle.evaluate_result_fixture.canonical_payload_b64url, lifecycle.evaluate_result_fixture.canonical_payload_sha256, 'lineage:result')
  assert(resultDecoded.value.evaluator_artifact_sha256 === descriptor.canonical_descriptor_bytes_sha256, 'lineage:result_descriptor')
  assert(resultDecoded.value.evidence_fingerprints[0] === evidenceRow.evidence_fingerprint, 'lineage:result_evidence')
  const transitionSeal = lifecycle.transition_stage_set_seal.planned_transition_stage_fixture
  assert(same(transitionSeal, computeSetSeal(contract, transitionSeal, [proofMember], ['precondition_id'])), 'lineage:transition_seal')

  const ordering = contract.authority_operation_ordering_rule_registry
  assert(ordering.occurrences.length === 21 && ordering.executable_full_schema_occurrence_fixtures.length === 21, 'ordering:count')
  for (let index = 0; index < 21; index += 1) {
    const occurrence = ordering.occurrences[index]
    const fixture = ordering.executable_full_schema_occurrence_fixtures[index]
    assert(fixture.source_path === occurrence.source_path && fixture.exact_ordering_authority === occurrence.exact_ordering_authority, `ordering:${index}:occurrence`)
    const split = occurrence.source_path.lastIndexOf('.properties.')
    assert(split > 1, `ordering:${index}:path`)
    const schemaPath = occurrence.source_path.slice(2, split)
    const field = occurrence.source_path.slice(split + '.properties.'.length)
    const schema = get(contract, schemaPath)
    const spec = get(contract, occurrence.source_path.slice(2))
    assert(fixture.containing_schema_ref === schemaPath && fixture.containing_schema_version === schema.schema_version, `ordering:${index}:schema`)
    assert(fixture.ordered_field === field && fixture.selected_spec_sha256 === hash(spec), `ordering:${index}:spec`)
  }
  for (let index = 0; index < 21; index += 1) if (![1, 2].includes(index)) {
    const before = materializedR64.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[index]
    const after = ordering.executable_full_schema_occurrence_fixtures[index]
    assert(same(before, after), `ordering:${index}:inherited_bytes`)
  }

  verifyManifest(contract)
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r64.json'), 'utf8') === materializedR64Output, 'frozen_R64_machine')
const actualBytes = readFileSync(join(root, machinePath), 'utf8')
assert(actualBytes === materializedR65Output, 'materialized_R65_exact')
verify(materializedR65)

let attacks = 0
function reject(name, mutate) {
  attacks += 1
  const candidate = structuredClone(materializedR65)
  let failed = false
  try { mutate(candidate); verify(candidate) } catch { failed = true }
  assert(failed, `attack_accepted:${name}`)
}

const parityOf = candidate => candidate.authority_operation_evaluator_export_parity_proof
const boundaryOf = candidate => candidate.authority_operation_evaluator_executable_boundary
const snapshotOf = candidate => parityOf(candidate).complete_evaluator_registry_snapshot
const memberOf = candidate => snapshotOf(candidate).snapshot_value.members[0]
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
  const registry = snapshotOf(candidate)
  for (const wrapper of registry.snapshot_value.members) resealMember(candidate, wrapper)
  const oldSeal = registry.snapshot_value.evaluator_registry_set_seal
  registry.snapshot_value.evaluator_registry_set_seal = computeSetSeal(candidate, oldSeal, registry.snapshot_value.members.map(wrapper => wrapper.member_value), ['evaluator_id', 'policy_lineage_ref', 'active_from'])
  const bytes = Buffer.from(canonicalR44(registry.snapshot_value), 'utf8')
  registry.canonical_snapshot_bytes_b64url = bytes.toString('base64url')
  registry.canonical_snapshot_bytes_sha256 = sha(bytes)
  registry.snapshot_content_ref = sha(bytes)
  parityOf(candidate).current_evaluator_selection_derivation.source_snapshot_ref = sha(bytes)
  parityOf(candidate).current_evaluator_selection_derivation.source_snapshot_sha256 = sha(bytes)
}

reject('descriptor_as_executable', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.semantic_scope = 'executable_behavior' })
reject('legacy_loaded_artifact_restored', candidate => { parityOf(candidate).loaded_evaluator_artifact = structuredClone(parityOf(candidate).evaluator_metadata_descriptor_artifact) })
reject('legacy_abi_behavior_claim_restored', candidate => { candidate.evaluator_abi.artifact_sha256_must_be_computed_from_loaded_immutable_evaluator_bytes = true })
reject('missing_executable_allowed', candidate => { boundaryOf(candidate).absent_missing_mismatched_truncated_alternate_or_unreviewed_executable_authority = 'continue' })
reject('metadata_fallback_allowed', candidate => { boundaryOf(candidate).metadata_descriptor_fallback_to_code = 'allowed' })
reject('fake_entrypoint_satisfies_dispatch', candidate => { boundaryOf(candidate).currently_satisfied_kernel_dispatch_preconditions = ['entrypoint'] })
reject('wrong_module_format_bypass', candidate => { boundaryOf(candidate).fake_or_caller_asserted_entrypoint_module_format_export_or_executable_bytes = 'execute' })
reject('result_without_executable', candidate => { boundaryOf(candidate).result_generation_without_verified_executable_authority = 'allowed' })
reject('parity_dispatch_without_executable', candidate => { parityOf(candidate).kernel_execution_result_generation_or_evidence_write = 'allowed_from_metadata_compatibility' })
reject('invented_executable_blob', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.executable_bytes_b64url = Buffer.from('fake').toString('base64url') })
reject('descriptor_bytes_truncated', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.canonical_descriptor_bytes_b64url = parityOf(candidate).evaluator_metadata_descriptor_artifact.canonical_descriptor_bytes_b64url.slice(0, -2) })
reject('descriptor_hash_alternate', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.canonical_descriptor_bytes_sha256 = sha('alternate') })
reject('descriptor_content_ref_splice', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.descriptor_content_ref = sha('other') })
reject('descriptor_export_wrong', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.descriptor_value.operation_result_exports.evaluate_lifecycle_preconditions = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('descriptor_executable_ref_claimed', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.executable_content_ref = sha('fake') })
reject('descriptor_fake_entrypoint', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.executable_entrypoint = 'evaluate' })
reject('descriptor_fake_module', candidate => { parityOf(candidate).evaluator_metadata_descriptor_artifact.executable_module_format = 'esm' })
reject('selected_array_reintroduced', candidate => { parityOf(candidate).selected_current_evaluator_registry_members = [memberOf(candidate).member_value] })
reject('snapshot_member_omitted', candidate => { snapshotOf(candidate).snapshot_value.members = []; resealRegistry(candidate) })
reject('snapshot_member_duplicate', candidate => { snapshotOf(candidate).snapshot_value.members.push(structuredClone(memberOf(candidate))); resealRegistry(candidate) })
reject('snapshot_overlap_second_current', candidate => { const second = structuredClone(memberOf(candidate)); second.member_value.evaluator_id = 'overlap_evaluator'; snapshotOf(candidate).snapshot_value.members.push(second); resealRegistry(candidate) })
reject('snapshot_member_stale', candidate => { memberOf(candidate).member_value.active_until = snapshotOf(candidate).snapshot_value.evaluated_at; resealRegistry(candidate) })
reject('snapshot_member_future', candidate => { memberOf(candidate).member_value.active_from = '2032-01-01T00:00:00.000Z'; resealRegistry(candidate) })
reject('snapshot_wrong_abi', candidate => { memberOf(candidate).member_value.operation_result_exports.evaluate_lifecycle_preconditions = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1'; resealRegistry(candidate) })
reject('snapshot_wrong_proof_exports', candidate => { memberOf(candidate).member_value.proof_family_exports.lifecycle = 'wrong'; resealRegistry(candidate) })
reject('snapshot_row_version_splice', candidate => { memberOf(candidate).member_value.row_version_ref = sha('wrong'); const bytes = Buffer.from(canonicalR44(memberOf(candidate).member_value), 'utf8'); memberOf(candidate).canonical_member_bytes_b64url = bytes.toString('base64url'); memberOf(candidate).canonical_member_bytes_sha256 = sha(bytes); memberOf(candidate).member_content_ref = sha(bytes) })
reject('snapshot_member_fingerprint_splice', candidate => { memberOf(candidate).member_value.registry_member_fingerprint = sha('wrong') })
reject('snapshot_member_bytes_splice', candidate => { memberOf(candidate).canonical_member_bytes_b64url = Buffer.from('{}').toString('base64url'); memberOf(candidate).canonical_member_bytes_sha256 = sha('{}'); memberOf(candidate).member_content_ref = sha('{}') })
reject('snapshot_member_content_ref_splice', candidate => { memberOf(candidate).member_content_ref = sha('wrong') })
reject('snapshot_set_seal_splice', candidate => { snapshotOf(candidate).snapshot_value.evaluator_registry_set_seal.computed_set_seal = sha('wrong') })
reject('snapshot_set_count_splice', candidate => { snapshotOf(candidate).snapshot_value.evaluator_registry_set_seal.canonical_member_count = 2 })
reject('snapshot_content_ref_splice', candidate => { snapshotOf(candidate).snapshot_content_ref = sha('wrong') })
reject('snapshot_live_completeness_overclaim', candidate => { snapshotOf(candidate).live_registry_completeness_and_serializable_selection = 'proved' })
reject('selection_count_lie', candidate => { parityOf(candidate).current_evaluator_selection_derivation.selected_match_count = 2 })
reject('selection_member_splice', candidate => { parityOf(candidate).current_evaluator_selection_derivation.selected_member_fingerprint = sha('wrong') })
reject('selection_execution_authority', candidate => { parityOf(candidate).current_evaluator_selection_derivation.compatible_metadata_selection_is_not_execution_authority = false })
reject('evidence_descriptor_splice', candidate => { candidate.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.frozen_persistence_snapshot.rows[0].row_value.evaluator_artifact_sha256 = sha('wrong') })
reject('evidence_snapshot_member_splice', candidate => { candidate.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.frozen_persistence_snapshot.evaluator_registry_member.registry_member_fingerprint = sha('wrong') })
reject('proof_snapshot_splice', candidate => { candidate.authority_operation_lifecycle_precondition_result_proof.evaluator_registry_snapshot_ref = sha('wrong') })
reject('proof_member_identity_splice', candidate => { candidate.authority_operation_lifecycle_precondition_result_proof.evaluator_registry_member_row_version_ref = sha('wrong') })
reject('result_claims_runtime_output', candidate => { candidate.authority_operation_lifecycle_precondition_result_proof.frozen_result_fixture_is_schema_and_lineage_evidence_not_claimed_runtime_output = false })
reject('ordering_schema_splice', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[1].containing_schema_version = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' })
reject('ordering_spec_splice', candidate => { candidate.authority_operation_ordering_rule_registry.executable_full_schema_occurrence_fixtures[2].selected_spec_sha256 = sha('wrong') })
reject('manifest_source_mutation', candidate => { candidate.authority_operation_evaluator_executable_boundary.metadata_descriptor_fallback_to_code = 'maybe' })

console.log(`ok: R65 exact; ${attacks} attacks; no frozen executable implementation found or claimed; descriptor-only metadata cannot authorize dispatch; complete frozen evaluator registry snapshot has ${materializedR65.authority_operation_evaluator_export_parity_proof.complete_evaluator_registry_snapshot.snapshot_value.members.length}/1 content-addressed versioned fingerprinted member and exact R6 set seal; current compatibility selection derives 1/1 from the entire snapshot; live registry and executable behavior remain explicitly unproved; 20/20 seven-surface metadata exports agree; 21/21 ordering bindings preserved; ${materializedR65.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count} semantic refs; ${materializedR65.authority_runtime_semantic_manifest.exact_expected_count} manifest rows; frozen R64 preserved`)
