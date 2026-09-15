import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR62, materializedR62Output, r62SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r62.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r62.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r63.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR62Output) throw new Error('R63_frozen_R62_input_mismatch')

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
const frame = value => {
  const bytes = Buffer.from(String(value), 'utf8')
  return frameBytes(bytes)
}
const frameBytes = bytes => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(bytes.length)
  return Buffer.concat([length, bytes])
}
const u64 = value => {
  const bytes = Buffer.alloc(8)
  bytes.writeBigUInt64BE(BigInt(value))
  return bytes
}
const fingerprintPreimage = (authority, row) => Object.fromEntries(authority.preimage_order.map(field => [field, field === 'domain_ascii' ? authority.domain_ascii : Object.hasOwn(row, field) ? row[field] : null]))

function encodeMemberIdentity(contract, setKind, projectionValues) {
  const authority = contract.set_member_identity_encoding
  if (authority.domain_ascii !== 'CTRL-G24-SET-MEMBER-IDENTITY-R6') throw new Error('R63_member_identity_domain')
  if (authority.variable_field_frame !== 'uint32_big_endian_byte_length_then_utf8_bytes') throw new Error('R63_member_identity_frame')
  if (!same(authority.preimage_order, ['domain_ascii', 'set_kind_framed', 'ordered_projection_values_framed'])) throw new Error('R63_member_identity_preimage_order')
  return Buffer.concat([Buffer.from(authority.domain_ascii, 'ascii'), frame(setKind), ...projectionValues.map(frame)])
}

function buildSetEntry(contract, setKind, projectionValues, completeRecord) {
  const identityBytes = encodeMemberIdentity(contract, setKind, projectionValues)
  const rawRecordSha256 = sha(Buffer.from(canonicalR44(completeRecord), 'utf8'))
  return {
    identity_projection_values: projectionValues,
    identity_bytes_b64url: identityBytes.toString('base64url'),
    identity_bytes_sha256: sha(identityBytes),
    raw_complete_record_sha256: rawRecordSha256,
    encoded_entry: Buffer.concat([frameBytes(identityBytes), Buffer.from(rawRecordSha256, 'hex')]),
  }
}

function computeSetSeal(contract, setKind, setSchemaVersion, ownerLineageVersion, members) {
  const authority = contract.set_seal_encoding
  if (authority.domain_ascii !== 'CTRL-G24-SET-SEAL-R6') throw new Error('R63_set_seal_domain')
  if (authority.variable_field_frame !== 'uint32_big_endian_byte_length_then_field_bytes') throw new Error('R63_set_seal_frame')
  if (!same(authority.preimage_order, ['domain_ascii', 'set_kind_framed', 'set_schema_version_framed', 'owner_lineage_version_framed', 'uint64_big_endian_member_count', 'sorted_unique_member_entries'])) throw new Error('R63_set_seal_preimage_order')
  if (authority.member_entry_ref !== 'set_member_identity_encoding.member_entry_order') throw new Error('R63_set_seal_member_entry_ref')
  const entries = members.map(member => buildSetEntry(contract, setKind, [member.precondition_id], member))
  entries.sort((left, right) => Buffer.compare(Buffer.from(left.identity_bytes_b64url, 'base64url'), Buffer.from(right.identity_bytes_b64url, 'base64url')) || Buffer.compare(Buffer.from(left.raw_complete_record_sha256, 'hex'), Buffer.from(right.raw_complete_record_sha256, 'hex')))
  const identities = entries.map(entry => entry.identity_bytes_b64url)
  if (new Set(identities).size !== identities.length) throw new Error('R63_set_seal_duplicate_identity')
  const preimageBytes = Buffer.concat([
    Buffer.from(authority.domain_ascii, 'ascii'),
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
    exact_preimage_b64url: preimageBytes.toString('base64url'),
    exact_preimage_sha256: sha(preimageBytes),
    computed_set_seal: sha(preimageBytes),
  }
}

const r63 = structuredClone(materializedR62)
r63.materialization = {
  ...r63.materialization,
  generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r63.mjs',
  frozen_input: { path: inputPath, sha256: sha(inputBytes) },
  schema_version: 'ctrl.g24.trusted-ingress-materialization.r63.v1',
  output_path: outputPath,
  strict_finalization_dag: [
    'freeze_R62_input',
    'preserve_input_intent_seal_without_aliasing_output_proof_set',
    'materialize_one_actual_R13_satisfied_row_for_the_one_catalogue_precondition',
    'validate_decoded_evidence_bytes_length_schema_version_and_closed_payload',
    'materialize_lifecycle_precondition_proof_member_and_member_fingerprint',
    'prove_set_seal_codec_under_transition_stage_owner_lineage_conformance_only',
    'record_evaluate_stage_owner_lineage_unavailability_and_narrow_result_semantics',
    'materialize_singleton_full_result_and_duplicate_rejection_witnesses',
    'finalize_nonderived_authorities',
    'snapshot_final_semantic_sources',
    'derive_reference_owner_and_manifest',
    'seal_output',
  ],
}
r63.status = r63.status.filter(value => value !== 'trusted_ingress_r62_fully_materialized')
r63.status = r63.status.filter(value => value !== 'trusted_ingress_r1_through_r61_vetoed')
r63.status.push('trusted_ingress_r1_through_r62_vetoed', 'trusted_ingress_r63_fully_materialized')
r63.supersedes = {
  commit: '73ebd17abbd5abd8b1ea8ddc78487287c2a641fb',
  tree: '938cfb61c07ab0ce29d25091c651e8882f461f75',
  human_blob: 'b0d09c1f7b7e77b0670c7f3e877ea902a2857a61',
  machine_blob: 'fcab9032998d78027c7393ae2c6bae848d58da33',
  qa_blob: '830ac37878a175bb462e83fe11b2eab8c440c6cf',
  checker_blob: '48836b1fbf123bf6851065fabb0ee426190dd0f1',
  materializer_blob: 'e2f5ab4a53eae907a5eaee77e3b1ca0ea0f590ed',
  founder_checker_blob: '2546d35741440495c2ecd26dcc619e2d3b332dca',
  adjudication: 'veto',
}

const evaluateResultSchema = structuredClone(r63.result_payload_schemas.evaluate_lifecycle_preconditions)
evaluateResultSchema.schema_version = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r63.v1'
evaluateResultSchema.exact_keys = evaluateResultSchema.exact_keys.filter(field => field !== 'precondition_set_seal')
evaluateResultSchema.required = evaluateResultSchema.required.filter(field => field !== 'precondition_set_seal')
delete evaluateResultSchema.properties.precondition_set_seal
r63.result_payload_schemas.evaluate_lifecycle_preconditions = evaluateResultSchema
r63.operation_specs.evaluate_lifecycle_preconditions = {
  ...r63.operation_specs.evaluate_lifecycle_preconditions,
  schema_version: 'ctrl.g24.operation.evaluate-lifecycle-preconditions.r63.v1',
  result_schema: evaluateResultSchema.schema_version,
}
const applyTransition = structuredClone(r63.operation_specs.apply_lifecycle_transition)
applyTransition.schema_version = 'ctrl.g24.operation.apply-lifecycle-transition.r63.v1'
applyTransition.intent.schema_version = 'ctrl.g24.intent.lifecycle-transition.r63.v1'
applyTransition.intent.exact_keys = applyTransition.intent.exact_keys.filter(field => field !== 'precondition_set_seal')
applyTransition.intent.required = applyTransition.intent.required.filter(field => field !== 'precondition_set_seal')
delete applyTransition.intent.properties.precondition_set_seal
applyTransition.server_derived_precondition_set_seal_authority = {
  schema_version: 'ctrl.g24.lifecycle-transition-precondition-set-seal-issuance.r63.v1',
  proof_set_schema_ref: 'proof_set_schemas.lifecycle_preconditions',
  set_seal_encoding_ref: 'set_seal_encoding',
  owner_lineage_version_source: 'authoritative_row_schemas.lifecycle_transition_receipts.properties.row_version_ref',
  owner_lineage_issuance: 'server_reserves_unique_transition_receipt_row_version_ref_inside_the_serializable_transition_transaction_before_set_seal_computation',
  owner_lineage_is_not_content_derived: true,
  caller_may_supply_owner_lineage_or_precondition_set_seal: false,
  reservation_unique_scope: ['workspace_ref', 'operation_id', 'idempotency_key', 'authoritative_row_schemas.lifecycle_transition_receipts'],
  registry_replay_precedes_fresh_reservation: true,
  exact_committed_replay_returns_stored_row_version_ref_and_precondition_set_seal_without_new_reservation: true,
  collision_or_changed_request: 'hold_without_reservation_or_transition_write',
  reservation_is_transaction_local_until_atomic_transition_commit: true,
  failed_commit_rolls_back_reservation_seal_receipt_snapshot_and_consumptions_together: true,
  partial_reservation_or_cross_transaction_owner_seal_splice: 'forbidden',
  live_serializable_execution: 'unproved_outside_frozen_contract_fixture',
  issuance_order: [
    'resolve_exact_evaluate_result_evidence_rows_and_recompute_proof_members',
    'reserve_unique_transition_receipt_row_version_ref',
    'compute_owner_bound_precondition_set_seal',
    'assemble_transition_receipt_with_the_same_row_version_ref_and_seal',
    'commit_transition_receipt_snapshot_and_consumptions_atomically',
  ],
  missing_duplicate_or_reused_owner_lineage_or_failed_atomic_commit: 'hold_without_transition_write',
  dependency_edges: [
    ['validated_evidence_rows', 'proof_members'],
    ['operation_registry_fresh_admission', 'reserved_transition_receipt_row_version_ref'],
    ['proof_members', 'owner_bound_precondition_set_seal'],
    ['reserved_transition_receipt_row_version_ref', 'owner_bound_precondition_set_seal'],
    ['owner_bound_precondition_set_seal', 'transition_receipt'],
    ['reserved_transition_receipt_row_version_ref', 'transition_receipt'],
    ['transition_receipt', 'atomic_transition_commit'],
  ],
  dependency_cycle: 'forbidden',
}
r63.operation_specs.apply_lifecycle_transition = applyTransition

const decodedEvidenceSchema = {
  schema_version: 'ctrl.g24.lifecycle-precondition-evidence-input.r63.v1',
  type: 'object',
  exact_keys: ['evidence_ref', 'evidence_value'],
  required: ['evidence_ref', 'evidence_value'],
  additional_properties: false,
  properties: {
    evidence_ref: { type: 'identifier', min_utf8_bytes: 1, max_utf8_bytes: 256 },
    evidence_value: { type: 'human_text', min_utf8_bytes: 1, max_utf8_bytes: 4096, valid_unicode_scalar_only: true },
  },
}
r63.authority_operation_lifecycle_precondition_evidence_input_schema = decodedEvidenceSchema

const oldAuthority = materializedR62.authority_operation_ordering_rule_registry.matching_evidence_pair_authority
const oldSnapshot = oldAuthority.frozen_persistence_snapshot
const catalogue = r63.lifecycle_precondition_catalog.open_preparation
const evaluator = structuredClone(oldSnapshot.evaluator_registry_member)
evaluator.evaluator_id = 'r63_lifecycle_evaluator'
evaluator.semantic_version = 'ctrl.g24.lifecycle-evaluator.r63.fixture.v1'
evaluator.artifact_sha256 = sha('r63_lifecycle_evaluator_artifact')
evaluator.manifest_sha256 = sha('r63_lifecycle_evaluator_manifest')

const evidenceInput = {
  evidence_ref: 'r63_lifecycle_precondition_evidence_open_preparation',
  evidence_value: 'Canonical evidence for the sole open preparation precondition',
}
const evidenceBytes = Buffer.from(canonicalR44(evidenceInput), 'utf8')
const evidenceInputSetSeal = sha(Buffer.from(canonicalR44([evidenceInput]), 'utf8'))
const row = {
  workspace_ref: 'r63_workspace',
  subject_ref: 'r63_subject',
  case_ref: 'r63_case',
  snapshot_fingerprint: sha('r63_operation_snapshot'),
  evaluated_at: '2031-01-01T00:00:00.000Z',
  evidence_ref: evidenceInput.evidence_ref,
  evidence_fingerprint: '0'.repeat(64),
  row_version_ref: 'r63_lifecycle_precondition_evidence_row_1_v1',
  valid_from: '2031-01-01T00:00:00.000Z',
  row_envelope_fingerprint: '0'.repeat(64),
  transition_id: catalogue.transition_id,
  predecessor_lifecycle_version_ref: null,
  required_precondition_id: catalogue.required_precondition_id,
  precondition_canonical_text: catalogue.precondition_canonical_text,
  evidence_schema_version: decodedEvidenceSchema.schema_version,
  canonical_evidence_b64url: evidenceBytes.toString('base64url'),
  canonical_evidence_byte_length: evidenceBytes.length,
  evaluator_version_ref: evaluator.semantic_version,
  satisfied: true,
  evidence_input_set_seal: evidenceInputSetSeal,
  evaluator_id: evaluator.evaluator_id,
  evaluator_semantic_version: evaluator.semantic_version,
  evaluator_artifact_sha256: evaluator.artifact_sha256,
  evaluator_manifest_sha256: evaluator.manifest_sha256,
}
row.evidence_fingerprint = hash(fingerprintPreimage(r63.authoritative_semantic_fingerprint_schemas.lifecycle_precondition_evidence, row))
row.row_envelope_fingerprint = hash(fingerprintPreimage(r63.authoritative_row_fingerprint_schemas.lifecycle_precondition_evidence, row))
const rowBytes = Buffer.from(canonicalR44(row), 'utf8')
const wrapper = {
  target_store_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
  row_schema_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
  row_schema_version: r63.authoritative_row_schemas.lifecycle_precondition_evidence.schema_version,
  canonical_row_bytes_b64url: rowBytes.toString('base64url'),
  canonical_row_bytes_sha256: sha(rowBytes),
  row_content_ref: sha(rowBytes),
  row_value: row,
}
const snapshot = {
  schema_version: 'ctrl.g24.lifecycle-precondition-evidence-frozen-snapshot.r63.v1',
  target_store_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
  persistence_registry_row: structuredClone(oldSnapshot.persistence_registry_row),
  workspace_ref: row.workspace_ref,
  subject_ref: row.subject_ref,
  case_ref: row.case_ref,
  snapshot_fingerprint: row.snapshot_fingerprint,
  evaluated_at: row.evaluated_at,
  evidence_input_set_seal: evidenceInputSetSeal,
  evaluator_registry_member: evaluator,
  rows: [wrapper],
}

const member = {
  transition_id: catalogue.transition_id,
  precondition_id: catalogue.required_precondition_id,
  precondition_canonical_text: catalogue.precondition_canonical_text,
  evidence_ref: row.evidence_ref,
  evidence_fingerprint: row.evidence_fingerprint,
  evaluator_version_ref: row.evaluator_version_ref,
  satisfied_at: row.evaluated_at,
  member_fingerprint: '0'.repeat(64),
  from_state: catalogue.from_state,
  to_state: catalogue.to_state,
}
member.member_fingerprint = hash(fingerprintPreimage(r63.proof_member_fingerprint_schemas.lifecycle_precondition, member))
const proofSetSchema = r63.proof_set_schemas.lifecycle_preconditions
const codecFixture = computeSetSeal(r63, proofSetSchema.set_kind, proofSetSchema.schema_version, 'r63_server_reserved_transition_receipt_row_version_v1', [member])

const resultPayload = {
  transition_id: catalogue.transition_id,
  predecessor_lifecycle_version_ref: null,
  evidence_refs: [row.evidence_ref],
  evidence_fingerprints: [row.evidence_fingerprint],
  evaluator_version_ref: evaluator.semantic_version,
  evaluator_artifact_sha256: evaluator.artifact_sha256,
}
const resultBytes = Buffer.from(canonicalR44(resultPayload), 'utf8')

r63.authority_operation_lifecycle_precondition_result_proof = {
  schema_version: 'ctrl.g24.lifecycle-precondition-result-proof.r63.v1',
  input_intent_seal: {
    source_ref: 'operation_specs.evaluate_lifecycle_preconditions.intent.properties.evidence_input_set_seal',
    exact_value: evidenceInputSetSeal,
    exact_input_members: [evidenceInput],
    scope: 'input_intent_and_persisted_evidence_rows_only',
    never_output_proof_set_seal: true,
  },
  decoded_evidence_schema_ref: 'authority_operation_lifecycle_precondition_evidence_input_schema',
  evidence_row_schema_ref: 'authoritative_row_schemas.lifecycle_precondition_evidence',
  proof_member_schema_ref: 'proof_member_schemas.lifecycle_precondition',
  proof_member_fingerprint_ref: 'proof_member_fingerprint_schemas.lifecycle_precondition',
  exact_lifecycle_proof_members: [member],
  exact_catalogue_required_precondition_ids: [catalogue.required_precondition_id],
  exact_satisfied_row_count: 1,
  exact_proof_member_count: 1,
  one_current_satisfied_row_per_exact_catalogue_precondition: true,
  duplicate_omitted_extra_unsatisfied_or_wrong_catalogue_precondition: 'reject_materialization_and_hold_without_write',
  transition_stage_set_seal: {
    proof_set_schema_ref: 'proof_set_schemas.lifecycle_preconditions',
    set_seal_encoding_ref: 'set_seal_encoding',
    set_member_identity_encoding_ref: 'set_member_identity_encoding',
    owner_lineage_version_source: proofSetSchema.owner_lineage_version_source,
    owner_lineage_available_during_evaluate_lifecycle_preconditions: false,
    owner_lineage_issuance_authority_ref: 'operation_specs.apply_lifecycle_transition.server_derived_precondition_set_seal_authority',
    planned_transition_stage_fixture: codecFixture,
    planned_owner_lineage_is_server_reserved_before_seal_and_committed_on_the_same_transition_receipt: true,
    evaluate_stage_output_proof_set_sealing: 'not_applicable_field_absent_from_R63_evaluate_result_schema',
    live_transition_stage_atomicity: 'unproved_outside_frozen_snapshot',
  },
  evaluate_result_fixture: {
    schema_ref: 'result_payload_schemas.evaluate_lifecycle_preconditions',
    canonical_payload_b64url: resultBytes.toString('base64url'),
    canonical_payload_sha256: sha(resultBytes),
    semantic_scope: 'schema_evidence_resolution_catalogue_cardinality_and_evaluator_lineage_only',
    precondition_set_seal_semantics: 'field_absent_transition_stage_server_derives_owner_bound_seal',
  },
  input_seal_never_appears_in_evaluate_result: !Object.hasOwn(resultPayload, 'precondition_set_seal'),
}

const ordering = structuredClone(r63.authority_operation_ordering_rule_registry)
ordering.schema_version = 'ctrl.g24.ordering-rule-registry.r63.v1'
ordering.matching_evidence_pair_authority = {
  ...ordering.matching_evidence_pair_authority,
  schema_version: 'ctrl.g24.resolved-evidence-pair-ordering.r63.v1',
  frozen_persistence_snapshot: snapshot,
  decoded_evidence_schema_ref: 'authority_operation_lifecycle_precondition_evidence_input_schema',
  canonical_evidence_byte_length_equals_exact_decoded_byte_length: true,
  evidence_schema_version_equals_decoded_evidence_schema_version: true,
  decoded_evidence_bytes_are_canonical_and_recursively_validate_against_selected_closed_schema: true,
  lifecycle_result_proof_ref: 'authority_operation_lifecycle_precondition_result_proof',
  one_current_satisfied_row_per_catalogue_precondition: true,
  evaluate_result_precondition_set_seal_is_not_evidence_input_set_seal: true,
  evaluate_result_precondition_set_seal_field_absent: true,
}
for (const fixture of ordering.executable_full_schema_occurrence_fixtures) {
  if (!fixture.source_path.startsWith('$.result_payload_schemas.evaluate_lifecycle_preconditions.properties.evidence_')) continue
  fixture.positive.canonical_payload_b64url = resultBytes.toString('base64url')
  fixture.positive.canonical_payload_sha256 = sha(resultBytes)
  const negativePayload = structuredClone(resultPayload)
  if (fixture.ordered_field === 'evidence_refs') negativePayload.evidence_refs.push(negativePayload.evidence_refs[0])
  else negativePayload.evidence_fingerprints.push(negativePayload.evidence_fingerprints[0])
  const negativeBytes = Buffer.from(canonicalR44(negativePayload), 'utf8')
  fixture.negative = {
    canonical_payload_b64url: negativeBytes.toString('base64url'),
    canonical_payload_sha256: sha(negativeBytes),
    mutation: 'duplicate_the_single_catalogue_precondition_member_then_reseal_payload',
    expected: 'reject_duplicate_array_member_and_duplicate_catalogue_precondition',
  }
  fixture.reversible_ordering_witness_available = false
  fixture.honest_reason = 'every_frozen_lifecycle_transition_has_exactly_one_catalogue_precondition'
  fixture.singleton_positive_and_duplicate_negative_only = true
}
ordering.exact_reversible_ordering_fixture_count = 19
ordering.exact_singleton_cardinality_fixture_count = 2
ordering.matching_evidence_refs_handler_semantics_separately_bounded = true
r63.authority_operation_ordering_rule_registry = ordering

r63.schema_change_manifest = {
  schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r63.v1',
  derivation: 'bounded_exact_extension_from_frozen_R62_lifecycle_input_output_seal_byte_length_and_catalogue_cardinality_repair',
  frozen_parent_sha256: sha(inputBytes),
  changed_semantic_paths: [
    '$',
    '$.materialization',
    '$.status',
    '$.supersedes',
    '$.authority_operation_lifecycle_precondition_evidence_input_schema',
    '$.authority_operation_lifecycle_precondition_result_proof',
    '$.authority_operation_ordering_rule_registry',
    '$.result_payload_schemas',
    '$.operation_specs',
    '$.authority_runtime_semantic_manifest_hash_contract',
    '$.authority_runtime_semantic_reference_field_registry',
    '$.authority_runtime_semantic_reference_owner_map',
    '$.authority_runtime_semantic_dependency_owner_map',
    '$.authority_runtime_semantic_manifest',
    '$.schema_change_manifest',
  ],
  repair_roots: [
    'separate_evidence_input_set_seal_from_transition_owned_precondition_proof_set_seal',
    'materialize_exact_lifecycle_precondition_member_and_declared_member_fingerprint',
    'honestly_mark_transition_owner_lineage_unavailable_during_evaluate_phase',
    'remove_precondition_set_seal_from_evaluate_result_and_apply_intent',
    'server_reserve_transition_receipt_row_version_before_owner_bound_set_seal',
    'prove_set_seal_binary_codec_under_the_planned_transition_owner_lineage',
    'bind_canonical_evidence_byte_length_schema_version_and_closed_decoded_content',
    'one_current_satisfied_row_for_the_one_catalogue_precondition',
    'singleton_ordering_site_boundary_and_duplicate_rejection',
    'preserve_R62_actual_store_semantic_envelope_currentness_and_full_site_controls',
  ],
  removed_semantic_paths: [],
  frozen_parent_core_must_remain_byte_identical: true,
  runtime_database_ui_deployment_or_external_action: 'closed',
}
r63.required_negative_fixture_families = [...new Set([
  ...r63.required_negative_fixture_families,
  'lifecycle_input_output_seal_swap_or_alias',
  'lifecycle_evaluate_result_and_apply_intent_reject_caller_seal',
  'lifecycle_proof_member_fingerprint_and_set_codec',
  'lifecycle_set_wrong_member_count_order_kind_version_owner_lineage_or_entry_fingerprint',
  'lifecycle_canonical_evidence_length_schema_version_and_decoded_schema',
  'lifecycle_duplicate_omitted_extra_unsatisfied_or_wrong_catalogue_precondition',
  'lifecycle_singleton_ordering_boundary',
])]

const sourcePaths = [...new Set([
  ...r62SemanticAuthorityPaths,
  'authority_operation_lifecycle_precondition_evidence_input_schema',
  'authority_operation_lifecycle_precondition_result_proof',
])].filter(path => get(r63, path) !== undefined).sort(cp)
r63.authority_runtime_semantic_reference_field_registry = { ...r63.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r63.v1' }
r63.authority_runtime_semantic_reference_owner_map = { ...r63.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r63.v1' }
r63.authority_runtime_semantic_dependency_owner_map = { ...r63.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r63.v1' }
r63.authority_runtime_semantic_manifest = { ...r63.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r63.v1' }
r63.authority_runtime_semantic_manifest_hash_contract = {
  ...r63.authority_runtime_semantic_manifest_hash_contract,
  schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r63.v1',
  manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r63.v1',
  content_domain_ascii: 'CTRL-G24-R63-MANIFEST-CONTENT',
  dependency_domain_ascii: 'CTRL-G24-R63-MANIFEST-DEPENDENCY',
  graph_domain_ascii: 'CTRL-G24-R63-MANIFEST-GRAPH',
  envelope_domain_ascii: 'CTRL-G24-R63-MANIFEST-ENVELOPE',
}
if (!sourcePaths.includes('authority_runtime_semantic_manifest_hash_contract')) sourcePaths.push('authority_runtime_semantic_manifest_hash_contract')
sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r63, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R63-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
const declaredNames = new Set(r63.authority_operation_schema_declared_semantic_field_registry.exact_rows.map(item => item.field_name))
const refRows = []
const seenRefs = new Set()
function walkRefs(value, source, path = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`
    const inspect = Array.isArray(child) ? child : [child]
    inspect.forEach((literal, index) => {
      if (typeof literal !== 'string') return
      const target = literal !== 'UNAVAILABLE' && get(r63, literal) !== undefined ? literal : 'UNAVAILABLE'
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
        exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(r63, target)?.schema_version ?? 'NESTED_VALUE',
        reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference',
      })
    })
    walkRefs(child, source, next)
  }
}
for (const path of sourcePaths) walkRefs(get(r63, path), path)
refRows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
r63.authority_runtime_semantic_reference_field_registry = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r63.v1',
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
r63.authority_runtime_semantic_reference_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r63.v1',
  source_snapshot_sha256: snapshotSha,
  exact_row_count: refRows.length,
  reference_registry_ref: 'authority_runtime_semantic_reference_field_registry',
  schema_declared_and_exact_path_value_bijection: true,
}
r63.authority_runtime_semantic_dependency_owner_map = {
  schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r63.v1',
  source_snapshot_sha256: snapshotSha,
  exact_paths: sourcePaths,
  rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })),
  reference_registry_ref: 'authority_runtime_semantic_reference_field_registry',
}
const hashContract = r63.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hashContract.content_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r63, path)) })]))
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
    authority_schema_version: get(r63, path)?.schema_version ?? 'UNVERSIONED',
    exact_keyset: Object.keys(get(r63, path) ?? {}).sort(cp),
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
  schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r63.v1',
  source_snapshot_sha256: snapshotSha,
  exact_paths: sourcePaths,
  rows: manifestRows,
  exact_expected_count: manifestRows.length,
  manifest_graph_sha256: hash({ domain_ascii: hashContract.graph_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_rows: manifestRows }),
}
r63.authority_runtime_semantic_manifest = {
  ...withoutSeal,
  manifest_envelope_seal_sha256: hash({ domain_ascii: hashContract.envelope_domain_ascii, manifest_hash_version: hashContract.manifest_hash_version, manifest_without_envelope_seal: withoutSeal }),
}

const finalSnapshot = ownedSnapshotR44(r63)
export const materializedR63 = r63
export const materializedR63Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r63SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR63Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR63Output) {
      console.error(`${outputPath} differs from materializer`)
      process.exit(1)
    }
    console.log(`ok: ${outputPath} is the exact fully materialized R63 effective contract`)
  } else throw new Error(`unsupported mode:${mode}`)
}
