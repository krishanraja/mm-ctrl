import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR64, materializedR64Output, r64SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r64.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r64.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r65.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR64Output) throw new Error('R65_frozen_R64_input_mismatch')

const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => {
  const left = [...String(a)].map(char => char.codePointAt(0))
  const right = [...String(b)].map(char => char.codePointAt(0))
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) if (left[index] !== right[index]) return left[index] - right[index]
  return left.length - right.length
}
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const same = (left, right) => canonicalR44(left) === canonicalR44(right)
const frameBytes = bytes => { const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length); return Buffer.concat([length, bytes]) }
const frame = value => frameBytes(Buffer.from(String(value), 'utf8'))
const u64 = value => { const bytes = Buffer.alloc(8); bytes.writeBigUInt64BE(BigInt(value)); return bytes }
const fingerprintPreimage = (authority, row) => Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : Object.hasOwn(row, field) ? row[field] : null]))

function computeSetSeal(contract, setKind, setSchemaVersion, ownerLineageVersion, members, projectionFields) {
  const identityAuthority = contract.set_member_identity_encoding
  const sealAuthority = contract.set_seal_encoding
  if (identityAuthority.domain_ascii !== 'CTRL-G24-SET-MEMBER-IDENTITY-R6') throw new Error('R65_member_identity_domain')
  if (sealAuthority.domain_ascii !== 'CTRL-G24-SET-SEAL-R6') throw new Error('R65_set_seal_domain')
  const declaredProjection = contract.set_member_identity_projections[setKind]
  if (declaredProjection !== undefined && !same(projectionFields, declaredProjection)) throw new Error('R65_set_projection')
  const entries = members.map(member => {
    const projectionValues = projectionFields.map(field => member[field])
    const identityBytes = Buffer.concat([Buffer.from(identityAuthority.domain_ascii, 'ascii'), frame(setKind), ...projectionValues.map(frame)])
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
  if (new Set(entries.map(entry => entry.identity_bytes_b64url)).size !== entries.length) throw new Error('R65_duplicate_evaluator_registry_identity')
  const preimage = Buffer.concat([
    Buffer.from(sealAuthority.domain_ascii, 'ascii'),
    frame(setKind),
    frame(setSchemaVersion),
    frame(ownerLineageVersion),
    u64(entries.length),
    ...entries.map(entry => entry.encoded_entry),
  ])
  return {
    set_kind: setKind,
    set_schema_version: setSchemaVersion,
    owner_lineage_version: ownerLineageVersion,
    canonical_member_count: entries.length,
    sorted_member_entries: entries.map(({ encoded_entry, ...entry }) => ({ ...entry, encoded_entry_b64url: encoded_entry.toString('base64url') })),
    exact_preimage_b64url: preimage.toString('base64url'),
    exact_preimage_sha256: sha(preimage),
    computed_set_seal: sha(preimage),
  }
}

const r65 = structuredClone(materializedR64)
r65.materialization = {
  ...r65.materialization,
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r65.mjs',
  frozen_input: { path: inputPath, sha256: sha(inputBytes) },
  schema_version: 'ctrl.g24.trusted-ingress-materialization.r65.v1',
  output_path: outputPath,
  strict_finalization_dag: [
    'freeze_R64_input',
    'prove_no_frozen_executable_evaluator_authority_exists',
    'separate_compatibility_metadata_descriptor_from_executable_behavior',
    'materialize_complete_frozen_evaluator_registry_snapshot',
    'seal_snapshot_with_existing_R6_evaluator_registry_set_authority',
    'derive_unique_current_compatible_member_from_the_entire_snapshot',
    'fail_closed_before_kernel_dispatch_because_executable_authority_is_absent',
    'recompute_evidence_member_result_and_transition_seal_lineage',
    'finalize_nonderived_authorities',
    'snapshot_final_semantic_sources',
    'derive_reference_owner_and_manifest',
    'seal_output',
  ],
}
r65.status = r65.status.filter(value => value !== 'trusted_ingress_r64_fully_materialized')
r65.status = r65.status.filter(value => value !== 'trusted_ingress_r1_through_r63_vetoed')
r65.status.push('trusted_ingress_r1_through_r64_vetoed', 'trusted_ingress_r65_fully_materialized')
r65.supersedes = {
  commit: '62386efe1d0e74e33a94fe46ec865b6da4921cc9',
  tree: '01dfe04b56255ea84016fa197c81a43a3e26c946',
  human_blob: 'a1bce1c94c05559ba549bf5d3f0d8bb25987b037',
  machine_blob: 'ac82a1a6314e2c55103a8269069f5bf9367a6c60',
  qa_blob: 'feacf73409b0d5546ebe45b6ec533cd212c26aae',
  checker_blob: '5298ddd01e3efaa1f3f6780e5a52bd7620fa031d',
  materializer_blob: '167d0388068a3ceb9c30bfbda7675515e0491ded',
  founder_checker_blob: '1a61f9201656fc3fc26db7e4bd2c6d00cb23b19a',
  adjudication: 'veto',
}

// No evaluator implementation exists in the frozen repository. Keep compatibility
// metadata useful, but make executable dispatch impossible until separately bound.
delete r65.evaluator_abi.artifact_sha256_must_be_computed_from_loaded_immutable_evaluator_bytes
r65.evaluator_abi.artifact_sha256_field_semantics = 'canonical_compatibility_metadata_descriptor_sha256_only'
r65.evaluator_abi.executable_behavior_binding = 'unproved_no_frozen_source_module_or_binary'
r65.evaluator_abi.metadata_compatibility_selection_never_confers_kernel_execution_authority = true
r65.evaluator_abi.checked_before_kernel_execution = true
r65.evaluator_abi.zero_or_multiple_or_mismatch_result = 'evaluator_artifact_hold'
r65.authority_operation_evaluator_executable_boundary = {
  schema_version: 'ctrl.g24.evaluator-executable-boundary.r65.v1',
  discovery_scope: ['src', 'supabase', 'scripts', 'project-documentation/ctrl-evolution'],
  discovered_runtime_implementation_paths: [],
  unrelated_fixture_adapter_path: 'src/features/operator-brain/fixtureDecisionBenchAdapter.ts',
  unrelated_fixture_adapter_must_not_be_selected_as_evaluator: true,
  executable_behavior_status: 'unproved_no_frozen_runtime_implementation',
  compatibility_metadata_descriptor_is_not_executable_code: true,
  required_kernel_dispatch_preconditions: [
    'executable_content_ref',
    'canonical_executable_bytes',
    'canonical_executable_bytes_length',
    'canonical_executable_bytes_sha256',
    'module_format',
    'entrypoint',
    'export_abi',
    'founder_locked_or_separately_reviewed_executable_authority',
  ],
  currently_satisfied_kernel_dispatch_preconditions: [],
  absent_missing_mismatched_truncated_alternate_or_unreviewed_executable_authority: 'deterministic_evaluator_artifact_hold_without_kernel_execution_or_result_generation',
  metadata_descriptor_fallback_to_code: 'forbidden',
  fake_or_caller_asserted_entrypoint_module_format_export_or_executable_bytes: 'deterministic_hold_without_kernel_execution',
  result_generation_without_verified_executable_authority: 'forbidden',
  live_execution_claim: 'unproved_and_closed',
}

const oldParity = materializedR64.authority_operation_evaluator_export_parity_proof
const oldSelected = structuredClone(oldParity.selected_current_evaluator_registry_members[0])
const descriptorValue = {
  schema_version: 'ctrl.g24.lifecycle-evaluator-metadata-descriptor.r65.v1',
  evaluator_id: oldSelected.evaluator_id,
  semantic_version: oldSelected.semantic_version,
  abi_version: oldSelected.abi_version,
  policy_lineage_ref: oldSelected.policy_lineage_ref,
  manifest_sha256: oldSelected.manifest_sha256,
  operation_result_exports: structuredClone(oldSelected.operation_result_exports),
  proof_family_exports: structuredClone(oldSelected.proof_family_exports),
}
const descriptorBytes = Buffer.from(canonicalR44(descriptorValue), 'utf8')
const descriptorSha = sha(descriptorBytes)

const oldMemberSchema = structuredClone(r65.evaluator_abi.registry_member_schema)
const memberSchema = {
  ...oldMemberSchema,
  schema_version: 'ctrl.g24.evaluator-registry-member.r65.v1',
  exact_keys: [...oldMemberSchema.exact_keys, 'row_version_ref', 'registry_member_fingerprint'].sort(cp),
  required: [...oldMemberSchema.required, 'row_version_ref', 'registry_member_fingerprint'],
  properties: {
    ...oldMemberSchema.properties,
    row_version_ref: { type: 'sha256' },
    registry_member_fingerprint: { type: 'sha256' },
  },
  row_version_authority_ref: 'authority_operation_evaluator_registry_member_identity.row_version',
  fingerprint_ref: 'authority_operation_evaluator_registry_member_identity.fingerprint',
}
r65.evaluator_abi.registry_member_schema = memberSchema
r65.authority_operation_evaluator_registry_member_identity = {
  schema_version: 'ctrl.g24.evaluator-registry-member-identity.r65.v1',
  row_version: {
    schema_version: 'ctrl.g24.evaluator-registry-member-row-version.r65.v1',
    domain_ascii: 'CTRL-G24-EVALUATOR-REGISTRY-MEMBER-ROW-VERSION-R65',
    canonical_encoding: 'canonical_json_utf8_encoding',
    preimage_order: ['domain_ascii', 'member_without_row_version_ref_or_registry_member_fingerprint'],
    digest: 'sha256_of_exact_preimage',
  },
  fingerprint: {
    schema_version: 'ctrl.g24.evaluator-registry-member-fingerprint.r65.v1',
    domain_ascii: 'CTRL-G24-EVALUATOR-REGISTRY-MEMBER-FINGERPRINT-R65',
    canonical_encoding: 'canonical_json_utf8_encoding',
    preimage_order: ['domain_ascii', 'member_without_registry_member_fingerprint'],
    digest: 'sha256_of_exact_preimage',
  },
  content_address: 'sha256_of_canonical_complete_member_bytes',
  derived_fields_are_excluded_from_their_own_preimages: true,
}
const memberCore = { ...oldSelected, artifact_sha256: descriptorSha }
const memberRowVersionRef = hash({
  domain_ascii: r65.authority_operation_evaluator_registry_member_identity.row_version.domain_ascii,
  member_without_row_version_ref_or_registry_member_fingerprint: memberCore,
})
const memberWithoutFingerprint = { ...memberCore, row_version_ref: memberRowVersionRef }
const memberFingerprint = hash({
  domain_ascii: r65.authority_operation_evaluator_registry_member_identity.fingerprint.domain_ascii,
  member_without_registry_member_fingerprint: memberWithoutFingerprint,
})
const member = { ...memberWithoutFingerprint, registry_member_fingerprint: memberFingerprint }
const memberBytes = Buffer.from(canonicalR44(member), 'utf8')
const memberWrapper = {
  schema_version: 'ctrl.g24.evaluator-registry-member-wrapper.r65.v1',
  registry_member_schema_ref: 'evaluator_abi.registry_member_schema',
  registry_member_schema_version: memberSchema.schema_version,
  canonical_member_bytes_b64url: memberBytes.toString('base64url'),
  canonical_member_bytes_sha256: sha(memberBytes),
  member_content_ref: sha(memberBytes),
  member_row_version_ref: memberRowVersionRef,
  member_fingerprint: memberFingerprint,
  member_value: member,
}
const evaluatedAt = materializedR64.authority_operation_ordering_rule_registry.matching_evidence_pair_authority.frozen_persistence_snapshot.evaluated_at
const snapshotOwnerLineage = 'ctrl.g24.evaluator-registry-snapshot-owner.r65.v1'
const registrySetSeal = computeSetSeal(r65, 'evaluator_registry', memberSchema.schema_version, snapshotOwnerLineage, [member], ['evaluator_id', 'policy_lineage_ref', 'active_from'])
const snapshotValue = {
  schema_version: 'ctrl.g24.evaluator-registry-frozen-snapshot.r65.v1',
  evaluated_at: evaluatedAt,
  operation_class: 'trusted_ingress',
  policy_lineage_ref: member.policy_lineage_ref,
  member_schema_ref: 'evaluator_abi.registry_member_schema',
  member_schema_version: memberSchema.schema_version,
  snapshot_owner_lineage_version: snapshotOwnerLineage,
  members: [memberWrapper],
  evaluator_registry_set_seal: registrySetSeal,
}
const snapshotBytes = Buffer.from(canonicalR44(snapshotValue), 'utf8')
const registrySnapshot = {
  schema_version: 'ctrl.g24.evaluator-registry-snapshot-artifact.r65.v1',
  canonical_snapshot_bytes_b64url: snapshotBytes.toString('base64url'),
  canonical_snapshot_bytes_sha256: sha(snapshotBytes),
  snapshot_content_ref: sha(snapshotBytes),
  snapshot_value: snapshotValue,
  frozen_snapshot_completeness: 'proved_for_the_exact_materialized_archive_scope',
  live_registry_completeness_and_serializable_selection: 'unproved_without_runtime_store_readback',
}
const matches = snapshotValue.members.filter(wrapper => {
  const value = wrapper.member_value
  return value.policy_lineage_ref === snapshotValue.policy_lineage_ref &&
    value.active_from <= evaluatedAt && evaluatedAt < value.active_until &&
    same(value.operation_result_exports, r65.evaluator_abi.operation_result_exports) &&
    same(value.proof_family_exports, r65.evaluator_abi.proof_family_exports)
})
if (matches.length !== 1) throw new Error('R65_current_evaluator_selection_not_unique')
const selected = matches[0]
const selection = {
  schema_version: 'ctrl.g24.evaluator-registry-current-selection.r65.v1',
  source_snapshot_ref: registrySnapshot.snapshot_content_ref,
  source_snapshot_sha256: registrySnapshot.canonical_snapshot_bytes_sha256,
  evaluated_at: evaluatedAt,
  operation_class: snapshotValue.operation_class,
  policy_lineage_ref: snapshotValue.policy_lineage_ref,
  selection_predicate: 'policy_lineage_equal_and_half_open_active_interval_and_exact_result_and_proof_export_maps',
  selected_match_count: matches.length,
  selected_member_content_ref: selected.member_content_ref,
  selected_member_row_version_ref: selected.member_row_version_ref,
  selected_member_fingerprint: selected.member_fingerprint,
  zero_or_multiple_match: 'deterministic_evaluator_artifact_hold_without_kernel_execution',
  compatible_metadata_selection_is_not_execution_authority: true,
}

const manifestArtifact = structuredClone(oldParity.evaluator_manifest_artifact)
const metadataDescriptor = {
  schema_version: 'ctrl.g24.evaluator-metadata-descriptor-artifact.r65.v1',
  canonical_descriptor_bytes_b64url: descriptorBytes.toString('base64url'),
  canonical_descriptor_bytes_sha256: descriptorSha,
  descriptor_content_ref: descriptorSha,
  descriptor_value: descriptorValue,
  semantic_scope: 'compatibility_metadata_only_not_executable_behavior',
  executable_content_ref: 'UNAVAILABLE',
  executable_entrypoint: 'UNAVAILABLE',
  executable_module_format: 'UNAVAILABLE',
}
r65.authority_operation_evaluator_export_parity_proof = {
  schema_version: 'ctrl.g24.evaluator-export-parity-proof.r65.v1',
  operation_names: Object.keys(r65.operation_specs).sort(cp),
  selected_operation: 'evaluate_lifecycle_preconditions',
  selected_result_schema_version: r65.result_payload_schemas.evaluate_lifecycle_preconditions.schema_version,
  complete_evaluator_registry_snapshot: registrySnapshot,
  current_evaluator_selection_derivation: selection,
  evaluator_manifest_artifact: manifestArtifact,
  evaluator_metadata_descriptor_artifact: metadataDescriptor,
  executable_boundary_ref: 'authority_operation_evaluator_executable_boundary',
  exact_compatibility_export_surfaces: [
    'result_payload_schemas[operation].schema_version',
    'operation_specs[operation].result_schema',
    'evaluator_abi.operation_result_exports[operation]',
    'evaluator_abi.operation_result_exports_schema.properties[operation].const',
    'resolved_selected_registry_member.operation_result_exports[operation]',
    'evaluator_manifest_artifact.manifest_value.operation_result_exports[operation]',
    'evaluator_metadata_descriptor_artifact.descriptor_value.operation_result_exports[operation]',
  ],
  required_compatible_metadata_match_count_at_evaluated_at: 1,
  frozen_snapshot_omission_duplicate_overlap_stale_future_or_export_mismatch: 'deterministic_evaluator_artifact_hold_without_kernel_execution',
  live_registry_completeness: 'unproved_no_runtime_store_readback',
  kernel_execution_result_generation_or_evidence_write: 'forbidden_until_executable_boundary_all_preconditions_are_satisfied',
}

// Recompute all frozen lineage that names the descriptor artifact SHA.
const ordering = structuredClone(r65.authority_operation_ordering_rule_registry)
ordering.schema_version = 'ctrl.g24.ordering-rule-registry.r65.v1'
const frozenEvidence = ordering.matching_evidence_pair_authority.frozen_persistence_snapshot
frozenEvidence.schema_version = 'ctrl.g24.lifecycle-precondition-evidence-frozen-snapshot.r65.v1'
frozenEvidence.evaluator_registry_member = member
const evidenceWrapper = frozenEvidence.rows[0]
const evidenceRow = evidenceWrapper.row_value
evidenceRow.evaluator_artifact_sha256 = descriptorSha
evidenceRow.evaluator_version_ref = member.semantic_version
evidenceRow.evaluator_id = member.evaluator_id
evidenceRow.evaluator_semantic_version = member.semantic_version
evidenceRow.evaluator_manifest_sha256 = member.manifest_sha256
evidenceRow.evidence_fingerprint = hash(fingerprintPreimage(r65.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, evidenceRow))
evidenceRow.row_envelope_fingerprint = hash(fingerprintPreimage(r65.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, evidenceRow))
const evidenceBytes = Buffer.from(canonicalR44(evidenceRow), 'utf8')
evidenceWrapper.canonical_row_bytes_b64url = evidenceBytes.toString('base64url')
evidenceWrapper.canonical_row_bytes_sha256 = sha(evidenceBytes)
evidenceWrapper.row_content_ref = sha(evidenceBytes)
ordering.matching_evidence_pair_authority = {
  ...ordering.matching_evidence_pair_authority,
  schema_version: 'ctrl.g24.resolved-evidence-pair-ordering.r65.v1',
  evaluator_registry_snapshot_ref: registrySnapshot.snapshot_content_ref,
  evaluator_registry_selection_ref: 'authority_operation_evaluator_export_parity_proof.current_evaluator_selection_derivation',
  executable_boundary_ref: 'authority_operation_evaluator_executable_boundary',
  frozen_snapshot_relation_proved_but_live_execution_forbidden: true,
}

const lifecycleProof = structuredClone(r65.authority_operation_lifecycle_precondition_result_proof)
lifecycleProof.schema_version = 'ctrl.g24.lifecycle-precondition-result-proof.r65.v1'
const proofMember = lifecycleProof.exact_lifecycle_proof_members[0]
proofMember.evidence_fingerprint = evidenceRow.evidence_fingerprint
proofMember.evaluator_version_ref = member.semantic_version
proofMember.member_fingerprint = hash(fingerprintPreimage(r65.proof_member_fingerprint_schemas.lifecycle_precondition, proofMember))
const proofSetSchema = r65.proof_set_schemas.lifecycle_preconditions
const transitionSeal = computeSetSeal(r65, proofSetSchema.set_kind, proofSetSchema.schema_version, 'r65_server_reserved_transition_receipt_row_version_v1', [proofMember], ['precondition_id'])
lifecycleProof.transition_stage_set_seal.planned_transition_stage_fixture = transitionSeal
lifecycleProof.transition_stage_set_seal.live_transition_stage_atomicity = 'unproved_outside_frozen_snapshot'
lifecycleProof.evaluator_registry_snapshot_ref = registrySnapshot.snapshot_content_ref
lifecycleProof.evaluator_registry_member_row_version_ref = member.row_version_ref
lifecycleProof.evaluator_registry_member_fingerprint = member.registry_member_fingerprint
lifecycleProof.executable_boundary_ref = 'authority_operation_evaluator_executable_boundary'
lifecycleProof.frozen_result_fixture_is_schema_and_lineage_evidence_not_claimed_runtime_output = true
const resultPayload = {
  transition_id: evidenceRow.transition_id,
  predecessor_lifecycle_version_ref: evidenceRow.predecessor_lifecycle_version_ref,
  evidence_refs: [evidenceRow.evidence_ref],
  evidence_fingerprints: [evidenceRow.evidence_fingerprint],
  evaluator_version_ref: member.semantic_version,
  evaluator_artifact_sha256: descriptorSha,
}
const resultBytes = Buffer.from(canonicalR44(resultPayload), 'utf8')
lifecycleProof.evaluate_result_fixture.canonical_payload_b64url = resultBytes.toString('base64url')
lifecycleProof.evaluate_result_fixture.canonical_payload_sha256 = sha(resultBytes)
lifecycleProof.evaluate_result_fixture.semantic_scope = 'schema_evidence_catalogue_and_compatibility_metadata_lineage_only_not_executable_behavior'
r65.authority_operation_lifecycle_precondition_result_proof = lifecycleProof
for (const fixture of ordering.executable_full_schema_occurrence_fixtures) {
  if (!fixture.source_path.startsWith('$.result_payload_schemas.evaluate_lifecycle_preconditions.properties.evidence_')) continue
  fixture.positive.canonical_payload_b64url = resultBytes.toString('base64url')
  fixture.positive.canonical_payload_sha256 = sha(resultBytes)
  const negative = structuredClone(resultPayload)
  if (fixture.ordered_field === 'evidence_refs') negative.evidence_refs.push(negative.evidence_refs[0])
  else negative.evidence_fingerprints.push(negative.evidence_fingerprints[0])
  const bytes = Buffer.from(canonicalR44(negative), 'utf8')
  fixture.negative.canonical_payload_b64url = bytes.toString('base64url')
  fixture.negative.canonical_payload_sha256 = sha(bytes)
}
r65.authority_operation_ordering_rule_registry = ordering

r65.schema_change_manifest = {
  schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r65.v1',
  derivation: 'bounded_exact_extension_from_frozen_R64_executable_boundary_and_complete_registry_snapshot_repair',
  frozen_parent_sha256: sha(inputBytes),
  changed_semantic_paths: [
    '$',
    '$.materialization',
    '$.status',
    '$.supersedes',
    '$.evaluator_abi',
    '$.authority_operation_evaluator_executable_boundary',
    '$.authority_operation_evaluator_registry_member_identity',
    '$.authority_operation_evaluator_export_parity_proof',
    '$.authority_operation_lifecycle_precondition_result_proof',
    '$.authority_operation_ordering_rule_registry',
    '$.required_negative_fixture_families',
    '$.authority_runtime_semantic_manifest_hash_contract',
    '$.authority_runtime_semantic_reference_field_registry',
    '$.authority_runtime_semantic_reference_owner_map',
    '$.authority_runtime_semantic_dependency_owner_map',
    '$.authority_runtime_semantic_manifest',
    '$.schema_change_manifest',
  ],
  repair_roots: [
    'remove_false_claim_that_metadata_descriptor_sha_binds_executable_behavior',
    'kernel_dispatch_holds_until_real_content_addressed_reviewed_executable_authority_exists',
    'derive_compatible_current_evaluator_from_complete_content_addressed_set_sealed_frozen_registry_snapshot',
    'separate_proved_frozen_snapshot_completeness_from_unproved_live_registry_completeness',
    'recompute_all_evidence_result_member_and_transition_seal_lineage_that_binds_descriptor_sha',
  ],
  removed_semantic_paths: [
    '$.evaluator_abi.artifact_sha256_must_be_computed_from_loaded_immutable_evaluator_bytes',
    '$.authority_operation_evaluator_export_parity_proof.loaded_evaluator_artifact',
    '$.authority_operation_evaluator_export_parity_proof.selected_current_evaluator_registry_members',
  ],
  frozen_parent_core_must_remain_byte_identical: true,
  runtime_database_ui_deployment_or_external_action: 'closed',
}
r65.required_negative_fixture_families = [...new Set([
  ...r65.required_negative_fixture_families,
  'descriptor_metadata_must_never_be_treated_as_executable_code',
  'missing_fake_wrong_truncated_alternate_or_unreviewed_executable_authority_holds_before_kernel_dispatch',
  'complete_evaluator_registry_snapshot_omission_duplicate_overlap_stale_future_wrong_export_row_version_content_or_set_seal',
])]

const sourcePaths = [...new Set([
  ...r64SemanticAuthorityPaths,
  'authority_operation_evaluator_executable_boundary',
  'authority_operation_evaluator_registry_member_identity',
])].filter(path => get(r65, path) !== undefined).sort(cp)
r65.authority_runtime_semantic_reference_field_registry = { ...r65.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r65.v1' }
r65.authority_runtime_semantic_reference_owner_map = { ...r65.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r65.v1' }
r65.authority_runtime_semantic_dependency_owner_map = { ...r65.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r65.v1' }
r65.authority_runtime_semantic_manifest = { ...r65.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r65.v1' }
r65.authority_runtime_semantic_manifest_hash_contract = {
  ...r65.authority_runtime_semantic_manifest_hash_contract,
  schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r65.v1',
  manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r65.v1',
  content_domain_ascii: 'CTRL-G24-R65-MANIFEST-CONTENT',
  dependency_domain_ascii: 'CTRL-G24-R65-MANIFEST-DEPENDENCY',
  graph_domain_ascii: 'CTRL-G24-R65-MANIFEST-GRAPH',
  envelope_domain_ascii: 'CTRL-G24-R65-MANIFEST-ENVELOPE',
}
if (!sourcePaths.includes('authority_runtime_semantic_manifest_hash_contract')) sourcePaths.push('authority_runtime_semantic_manifest_hash_contract')
sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r65, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R65-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
const declaredNames = new Set(r65.authority_operation_schema_declared_semantic_field_registry.exact_rows.map(item => item.field_name))
const refRows = []
const seenRefs = new Set()
function walkRefs(value, source, path = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`
    const inspect = Array.isArray(child) ? child : [child]
    inspect.forEach((literal, index) => {
      if (typeof literal !== 'string') return
      const target = literal !== 'UNAVAILABLE' && get(r65, literal) !== undefined ? literal : 'UNAVAILABLE'
      if (target === 'UNAVAILABLE' && !declaredNames.has(key)) return
      const fieldPath = Array.isArray(child) ? `${next}.${index}` : next
      const id = `${source}|${fieldPath}|${literal}`
      if (seenRefs.has(id)) return
      seenRefs.add(id)
      refRows.push({
        source_authority_path: source,
        field_path: fieldPath,
        field_name: key,
        match_kind: target !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field',
        reference_literal: literal,
        exact_target_path_or_UNAVAILABLE: target,
        exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(r65, target)?.schema_version ?? 'NESTED_VALUE',
        reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference',
      })
    })
    walkRefs(child, source, next)
  }
}
for (const path of sourcePaths) walkRefs(get(r65, path), path)
refRows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
r65.authority_runtime_semantic_reference_field_registry = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r65.v1',
  source_snapshot_sha256: snapshotSha,
  exact_source_paths: sourcePaths,
  schema_declared_field_registry_ref: 'authority_operation_schema_declared_semantic_field_registry',
  exact_occurrence_rows: refRows,
  exact_expected_occurrence_count: refRows.length,
  exact_path_value_resolution_count: refRows.filter(item => item.match_kind === 'exhaustive_exact_path_value_resolution').length,
  schema_or_pinned_field_occurrence_count: refRows.filter(item => item.match_kind === 'schema_declared_or_independently_pinned_semantic_field').length,
  required_named_field_occurrence_counts: Object.fromEntries(['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'].map(field => [field, refRows.filter(item => item.field_name === field).length])),
  suffix_name_only_inference: 'forbidden',
  unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write',
}
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(item => item.source_authority_path === path && sourcePaths.includes(item.exact_target_path_or_UNAVAILABLE) && item.exact_target_path_or_UNAVAILABLE !== path).map(item => item.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r65.authority_runtime_semantic_reference_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r65.v1',
  source_snapshot_sha256: snapshotSha,
  exact_row_count: refRows.length,
  reference_registry_ref: 'authority_runtime_semantic_reference_field_registry',
  schema_declared_and_exact_path_value_bijection: true,
}
r65.authority_runtime_semantic_dependency_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r65.v1',
  source_snapshot_sha256: snapshotSha,
  exact_paths: sourcePaths,
  rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })),
  reference_registry_ref: 'authority_runtime_semantic_reference_field_registry',
}
const hashContract = r65.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hashContract.content_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r65, path)) })]))
function transitive(path) {
  const seen = new Set()
  const visit = current => { for (const dependency of dependencies[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }
  visit(path)
  seen.delete(path)
  return [...seen].sort(cp)
}
const manifestRows = sourcePaths.map(path => {
  const direct = dependencies[path].map(dependency => ({ authority_path: dependency, authority_content_sha256: contentHashes[dependency] }))
  const all = transitive(path).map(dependency => ({ authority_path: dependency, authority_content_sha256: contentHashes[dependency] }))
  return {
    authority_path: path,
    authority_schema_version: get(r65, path)?.schema_version ?? 'UNVERSIONED',
    exact_keyset: Object.keys(get(r65, path) ?? {}).sort(cp),
    authority_content_sha256: contentHashes[path],
    direct_dependency_paths: dependencies[path],
    direct_dependency_content_hashes: direct,
    direct_dependency_set_sha256: hash({ domain_ascii: hashContract.dependency_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }),
    transitive_dependency_paths: all.map(item => item.authority_path),
    transitive_dependency_content_hashes: all,
    transitive_dependency_set_sha256: hash({ domain_ascii: hashContract.dependency_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }),
  }
})
const withoutSeal = {
  schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r65.v1',
  source_snapshot_sha256: snapshotSha,
  exact_paths: sourcePaths,
  rows: manifestRows,
  exact_expected_count: manifestRows.length,
  manifest_graph_sha256: hash({ domain_ascii: hashContract.graph_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_rows: manifestRows }),
}
r65.authority_runtime_semantic_manifest = {
  ...withoutSeal,
  manifest_envelope_seal_sha256: hash({ domain_ascii: hashContract.envelope_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }),
}

const finalSnapshot = ownedSnapshotR44(r65)
export const materializedR65 = r65
export const materializedR65Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r65SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR65Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR65Output) {
      console.error(`${outputPath} differs from materializer`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R65 effective contract`)
  } else throw new Error(`unsupported mode:${mode}`)
}
