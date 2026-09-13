import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR16 } from './materialize-ctrl-g24-trusted-ingress-r16.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r16.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r17.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR16 = JSON.parse(inputBytes)
const r17 = structuredClone(materializedR16)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }

function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return {
    schema_version, type: 'object', exact_keys: Object.keys(properties),
    required: Object.keys(properties).filter(key => !optional.includes(key)),
    ...(optional.length ? { optional } : {}), additional_properties: false, properties, ...extras,
  }
}
function replaceProperties(schema, properties) {
  schema.properties = properties
  schema.exact_keys = Object.keys(properties)
  schema.required = schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key))
}
function fingerprint(domain_ascii, fields) {
  return { domain_ascii, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' }
}
function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}
function schemaNodes(value, path = '$', found = new Map()) {
  if (!value || typeof value !== 'object') return found
  if (!Array.isArray(value) && typeof value.schema_version === 'string') found.set(path, value)
  if (Array.isArray(value)) value.forEach((item, index) => schemaNodes(item, `${path}[${index}]`, found))
  else for (const [key, item] of Object.entries(value)) schemaNodes(item, `${path}.${key}`, found)
  return found
}
const withoutVersion = value => JSON.stringify({ ...value, schema_version: null })
const r17Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r17.') : `${version}.r17`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 10; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR16)
    for (const [path, after] of schemaNodes(r17)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r17.')) {
        after.schema_version = r17Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR16)
  for (const [path, after] of schemaNodes(r17)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      const priorConst = prior.properties?.[field]?.const
      if (field.endsWith('schema_version') && typeof priorConst === 'string' && property?.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r17.schema_version = 'ctrl.g24.trusted-ingress.r17.effective.v1'
r17.status = 'sixteenth_repair_candidate_under_independent_review'
r17.supersedes = {
  commit: '040438d234cd136e91525adced80894ff0b6eaba', tree: '0eb278cfe2b5da1827de54a676ea0a308eb78bb4',
  human_blob: 'a254b7e91a2bc548b576cf996ba91a898aa2c530', machine_blob: '92cededb5ea803291e2350b96e0c49c635665a9a',
  qa_blob: '08f9bfcf8b2f86c2c7d3d2d43b3dbd9d49bd3f91', checker_blob: '3a1df844ecaac513da692aeceb9caf865cc467a2',
  materializer_blob: '9166d9dd81e921bf806c03511db8bb3fd392948c', founder_checker_blob: 'ec07584960c22867cbb0e971871d00aff955c079',
  adjudication: 'veto',
}
r17.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r17.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false,
  runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true,
  generator_must_reject_undefined_values_before_serialization: true,
}

// One byte grammar governs every persisted JSON blob. Fingerprint framing remains a separate concern.
r17.canonical_json_utf8_encoding = {
  schema_version: 'ctrl.g24.canonical-json-utf8.r17.v1',
  authority_ref: 'canonical_grammar',
  schema_resolution: 'resolve_one_exact_versioned_closed_schema_before_serialization',
  object_key_order: 'unicode_scalar_sort', arrays: 'preserve_order', escaping: 'minimal_json',
  insignificant_whitespace: false, utf8: 'valid_unicode_scalar_utf8_without_bom',
  duplicate_keys: 'reject_before_materialization', optional_fields: 'omit_when_absent',
  nulls: 'only_where_the_resolved_field_schema_explicitly_allows_null',
  byte_equality: 'the_decoded_bytes_must_equal_reserialization_byte_for_byte',
  fingerprint_framing_included: false,
}

const useRelease = r17.result_payload_schemas.use_release
r17.operation_result_schema_derivation = {
  exported_schema_source: 'evaluator_abi.operation_result_exports[operation_class]',
  operation_spec_equality: 'operation_specs[operation_class].result_schema_equals_exported_result_schema_version',
  selected_schema_rules: {
    use_release: Object.fromEntries(Object.entries(useRelease.variants).map(([branch, schema]) => [branch, schema.schema_version])),
    every_other_operation: 'selected_result_schema_version_equals_exported_result_schema_version_and_successful_result_branch_is_null',
  },
  union_membership: 'for_discriminated_results_the_selected_schema_is_exactly_the_schema_of_the_discriminator_selected_variant_in_the_exported_union',
  disagreement: 'proof_schema_hold_without_result_blob_success_row_or_protected_effect',
}

const resultBlob = r17.operation_result_blob_store.row_schema
replaceProperties(resultBlob, {
  workspace_ref: id, canonical_result_payload_bytes_ref: id, operation_class: { type: 'enum', values: [...r17.operation_names] },
  exported_result_schema_version: id, selected_result_schema_version: id,
  successful_result_branch: r17.operation_registry.committed_success_row_schema.properties.successful_result_branch,
  canonical_result_payload_b64url: { type: 'base64url_without_padding', max_decoded_bytes: 1048576 },
  canonical_result_payload_byte_length: { type: 'safe_nonnegative_integer', maximum: 1048576 },
  canonical_result_payload_bytes_sha256: fp, result_payload_fingerprint: fp, result_blob_fingerprint: fp, committed_at: ts,
})
resultBlob.conditional_rules = [
  'decoded_b64url_length_equals_canonical_result_payload_byte_length',
  'sha256_of_exact_decoded_bytes_equals_canonical_result_payload_bytes_sha256',
  'decoded_bytes_equal_exact_canonical_json_utf8_encoding_for_selected_result_schema_version',
  'operation_class_exported_schema_selected_schema_and_branch_satisfy_operation_result_schema_derivation',
  'result_payload_fingerprint_equals_recomputed_universal_operation_result_payload_fingerprint',
  'result_blob_fingerprint_equals_recomputed_complete_blob_preimage',
]
r17.operation_result_blob_store.canonicalization_ref = 'canonical_json_utf8_encoding'
r17.fingerprint_schemas.operation_result_payload = fingerprint('CTRL-G24-OPERATION-RESULT-PAYLOAD-R17', [
  'workspace_ref', 'operation_class', 'exported_result_schema_version', 'selected_result_schema_version',
  'successful_result_branch', 'canonical_result_payload_bytes_sha256',
])
r17.fingerprint_schemas.operation_result_blob = fingerprint('CTRL-G24-OPERATION-RESULT-BLOB-R17', Object.keys(resultBlob.properties).filter(field => field !== 'result_blob_fingerprint'))

const committed = r17.operation_registry.committed_success_row_schema
const committedProps = { ...committed.properties }
delete committedProps.result_schema_version
delete committedProps.canonical_result_payload_bytes_sha256
delete committedProps.committed_at
delete committedProps.committed_success_fingerprint
replaceProperties(committed, {
  ...committedProps,
  exported_result_schema_version: id, selected_result_schema_version: id,
  canonical_result_payload_bytes_sha256: fp, canonical_response_bytes_sha256: fp,
  committed_at: ts, committed_success_fingerprint: fp,
})
committed.conditional_rules = [
  'operation_class_use_release_iff_successful_result_branch_and_result_ref_are_nonnull_and_exactly_derived_by_release_terminal_consumption_branch_table',
  'operation_class_exported_schema_selected_schema_and_branch_satisfy_operation_result_schema_derivation',
  'canonical_result_payload_bytes_ref_resolves_exactly_one_operation_result_blob_in_the_same_workspace',
  'canonical_response_bytes_ref_resolves_exactly_one_operation_response_blob_in_the_same_workspace',
  'result_blob_and_response_blob_fields_equal_the_committed_success_derivations',
  'committed_success_fingerprint_equals_recomputed_complete_success_preimage',
]
r17.fingerprint_schemas.operation_registry_committed_success = fingerprint('CTRL-G24-OPERATION-REGISTRY-COMMITTED-SUCCESS-R17', Object.keys(committed.properties).filter(field => field !== 'committed_success_fingerprint'))
r17.operation_registry.stored_success = Object.keys(committed.properties).filter(field => !['workspace_ref', 'operation_id', 'state'].includes(field))

const committedResponse = r17.response_union.schemas.committed
committedResponse.schema_version = 'ctrl.g24.response.committed.r17.v1'
committedResponse.type = 'object'
replaceProperties(committedResponse, {
  status: { const: 'committed' }, operation_id: id, operation_class: { enum_ref: 'operation_names' },
  exported_result_schema_version: id, selected_result_schema_version: id,
  result_payload_b64url: { type: 'base64url_without_padding' }, result_payload_fingerprint: fp,
  result_payload_byte_length: { type: 'safe_nonnegative_integer' }, snapshot_fingerprint: fp, committed_at: ts,
})
r17.response_union.schema_version = 'ctrl.g24.response-union.r17.v1'
r17.response_union.payload_encoding = 'base64url_without_padding_of_exact_canonical_json_utf8_encoding'
r17.operation_response_blob_store = {
  schema_version: 'ctrl.g24.operation-response-blob-store.r17.v1',
  row_schema: closed('ctrl.g24.operation-response-blob.r17.v1', {
    workspace_ref: id, canonical_response_bytes_ref: id, response_schema_version: id,
    canonical_response_b64url: { type: 'base64url_without_padding', max_decoded_bytes: 1048576 },
    canonical_response_byte_length: { type: 'safe_nonnegative_integer', maximum: 1048576 },
    canonical_response_bytes_sha256: fp, response_fingerprint: fp, response_blob_fingerprint: fp, committed_at: ts,
  }, {
    append_only: true, unique_keys: [['workspace_ref', 'canonical_response_bytes_ref']],
    conditional_rules: [
      'response_schema_version_equals_response_union_schemas_committed_schema_version',
      'decoded_b64url_length_equals_canonical_response_byte_length',
      'sha256_of_exact_decoded_bytes_equals_canonical_response_bytes_sha256',
      'decoded_bytes_equal_exact_canonical_json_utf8_encoding_for_response_schema_version',
      'response_fingerprint_equals_recomputed_operation_response_payload_fingerprint',
      'response_blob_fingerprint_equals_recomputed_complete_blob_preimage',
    ],
  }),
  canonicalization_ref: 'canonical_json_utf8_encoding', one_row_per_reference: true, mutation_or_rebinding: 'forbidden',
  row_fingerprint_ref: 'fingerprint_schemas.operation_response_blob',
}
r17.fingerprint_schemas.operation_response_payload = fingerprint('CTRL-G24-OPERATION-RESPONSE-PAYLOAD-R17', ['workspace_ref', 'response_schema_version', 'canonical_response_bytes_sha256'])
r17.fingerprint_schemas.operation_response_blob = fingerprint('CTRL-G24-OPERATION-RESPONSE-BLOB-R17', Object.keys(r17.operation_response_blob_store.row_schema.properties).filter(field => field !== 'response_blob_fingerprint'))
r17.operation_response_blob_store.row_schema.fingerprint_ref = 'fingerprint_schemas.operation_response_blob'
r17.operation_response_blob_store.row_schema.fingerprint_field = 'response_blob_fingerprint'
r17.operation_response_blob_store.row_schema.fingerprint_field_must_equal_referenced_preimage_digest = true

r17.operation_registry.committed_success_blob_derivation = {
  result_blob_schema_ref: 'operation_result_blob_store.row_schema', response_blob_schema_ref: 'operation_response_blob_store.row_schema',
  exact_result_equalities: [
    'success.workspace_ref_equals_result_blob.workspace_ref', 'success.operation_class_equals_result_blob.operation_class',
    'success.canonical_result_payload_bytes_ref_equals_result_blob.canonical_result_payload_bytes_ref',
    'success.exported_result_schema_version_equals_result_blob.exported_result_schema_version',
    'success.selected_result_schema_version_equals_result_blob.selected_result_schema_version',
    'success.successful_result_branch_equals_result_blob.successful_result_branch',
    'success.canonical_result_payload_bytes_sha256_equals_result_blob.canonical_result_payload_bytes_sha256',
    'success.result_payload_fingerprint_equals_result_blob.result_payload_fingerprint',
  ],
  exact_response_equalities: [
    'success.workspace_ref_equals_response_blob.workspace_ref', 'success.canonical_response_bytes_ref_equals_response_blob.canonical_response_bytes_ref',
    'success.response_schema_version_equals_response_blob.response_schema_version_and_response_union.schemas.committed.schema_version',
    'success.canonical_response_bytes_sha256_equals_response_blob.canonical_response_bytes_sha256',
    'success.response_fingerprint_equals_response_blob.response_fingerprint',
  ],
  decoded_response_field_equalities: [
    'response.status_equals_committed', 'response.operation_id_equals_success.operation_id', 'response.operation_class_equals_success.operation_class',
    'response.exported_result_schema_version_equals_success.exported_result_schema_version',
    'response.selected_result_schema_version_equals_success.selected_result_schema_version',
    'response.result_payload_b64url_equals_result_blob.canonical_result_payload_b64url',
    'response.result_payload_fingerprint_equals_success.result_payload_fingerprint',
    'response.result_payload_byte_length_equals_result_blob.canonical_result_payload_byte_length',
    'response.snapshot_fingerprint_equals_success.snapshot_fingerprint', 'response.committed_at_equals_success.committed_at_and_both_blobs.committed_at',
  ],
  commit_atomicity: 'result_blob_response_blob_and_committed_success_row_commit_in_one_serializable_transaction_or_none_exists',
  any_missing_duplicate_hash_length_schema_parse_mapping_or_fingerprint_mismatch: 'operation_commits_hold_without_success_response_or_protected_effect',
}
delete r17.operation_registry.committed_success_result_blob_derivation

// One internal database control plane is the sole writer for case authority.
r17.case_authority_control_plane = {
  schema_version: 'ctrl.g24.case-authority-control-plane.r17.v1',
  producer: 'database_procedure.rotate_case_authority_binding_r17', execution_mode: 'security_definer_with_fixed_search_path',
  sole_runtime_writer_role: 'ctrl_case_authority_control_plane',
  caller_authority: 'authenticated_human_session_stable_actor_ref_must_equal_current_binding_engagement_operator_ref_for_rotation; bootstrap_is_migration_only',
  request_schema: closed('ctrl.g24.case-authority-control-request.r17.v1', {
    control_operation_id: id, workspace_ref: id, subject_ref: id, case_ref: id,
    expected_current_row_version_ref: { type: 'nullable', value_schema: id },
    expected_current_row_envelope_fingerprint: { type: 'nullable', value_schema: fp },
    new_case_authority_binding_ref: id, named_leader_ref: id, engagement_operator_ref: id,
    operator_grant_set_seal: fp, workload_grant_set_seal: fp, new_authority_version: id,
    new_row_version_ref: id, requested_valid_from: ts,
  }),
  idempotency_key: ['workspace_ref', 'case_ref', 'control_operation_id'],
  transaction: [
    'serializable_transaction_and_advisory_lock_on_workspace_subject_case',
    'resolve_exactly_zero_or_one_current_row_under_case_authority_bindings_current_selection',
    'bootstrap_requires_both_expected_current_fields_null_and_migration_execution_identity',
    'rotation_requires_both_expected_current_fields_equal_the_resolved_current_row_byte_for_byte',
    'verify_engagement_operator_ref_is_the_authenticated_current_engagement_operator',
    'verify_both_grant_set_seals_are_exact_current_set_seals_in_the_same_snapshot',
    'close_prior_row_valid_until_at_requested_valid_from_and_append_one_new_fingerprinted_row_atomically',
    'compare_and_swap_current_row_version_and_envelope_fingerprint_unchanged_before_commit',
    'write_one_idempotent_control_receipt_or_rollback_every_write',
  ],
  privilege_contract: {
    case_authority_table_insert_update: 'only_ctrl_case_authority_control_plane_role',
    application_edge_worker_browser_and_generic_service_roles: 'no_insert_update_delete_or_truncate',
    direct_dml: 'forbidden_even_to_the_procedure_caller', delete_or_truncate: 'forbidden_to_every_runtime_role',
    grants_verified_by: 'migration_assertion_and_catalog_regression_check',
  },
  rotation_conflict_or_ambiguous_current: 'case_authority_control_hold_without_write',
}
r17.case_authority_bindings.writer_authority_ref = 'case_authority_control_plane'
r17.case_authority_bindings.direct_dml = 'forbidden'

// Ambiguity provenance is event-specific: the reason and recorder cannot be mixed.
const commonAmbiguity = r17.outbox.ambiguity_evidence_schema
const ambiguityProps = { ...commonAmbiguity.properties }
const makeAmbiguity = (version, reason, recorderRule, fpRef) => {
  const properties = { ...ambiguityProps, evidence_schema_version: { const: version }, ambiguity_reason: { const: reason } }
  return closed(version, properties, {
    append_only: true, unique_keys: [['dispatch_ref']], fingerprint_ref: fpRef, fingerprint_field: 'evidence_fingerprint',
    fingerprint_field_must_equal_referenced_preimage_digest: true,
    conditional_rules: [recorderRule, 'invocation_event_dispatch_worker_provider_payload_and_fence_equal_the_exact_current_invoking_tip_and_predecessor_chain'],
  })
}
r17.outbox.worker_ambiguity_evidence_schema = makeAmbiguity(
  'ctrl.g24.worker-ambiguity-evidence.r17.v1', 'worker_reported_unknown_outcome',
  'recorder_ref_equals_worker_ref_and_the_current_fenced_claim_worker_stable_workload_ref', 'fingerprint_schemas.worker_ambiguity_evidence',
)
r17.outbox.lease_expiry_ambiguity_evidence_schema = makeAmbiguity(
  'ctrl.g24.lease-expiry-ambiguity-evidence.r17.v1', 'dispatch_lease_expired_without_terminal_evidence',
  'recorder_ref_equals_the_authenticated_current_workload_outbox_lease_reaper_stable_workload_ref', 'fingerprint_schemas.lease_expiry_ambiguity_evidence',
)
delete r17.outbox.ambiguity_evidence_schema
r17.fingerprint_schemas.worker_ambiguity_evidence = fingerprint('CTRL-G24-WORKER-AMBIGUITY-EVIDENCE-R17', Object.keys(r17.outbox.worker_ambiguity_evidence_schema.properties).filter(field => field !== 'evidence_fingerprint'))
r17.fingerprint_schemas.lease_expiry_ambiguity_evidence = fingerprint('CTRL-G24-LEASE-EXPIRY-AMBIGUITY-EVIDENCE-R17', Object.keys(r17.outbox.lease_expiry_ambiguity_evidence_schema.properties).filter(field => field !== 'evidence_fingerprint'))
delete r17.fingerprint_schemas.provider_ambiguity_evidence
const workerTransition = r17.outbox.transition_table.find(row => row.event_kind === 'worker_ambiguity')
const leaseTransition = r17.outbox.transition_table.find(row => row.event_kind === 'lease_expiry_ambiguity')
workerTransition.event_schema_ref = 'outbox.worker_ambiguity_evidence_schema'
leaseTransition.event_schema_ref = 'outbox.lease_expiry_ambiguity_evidence_schema'

const transitionEvent = r17.outbox.transition_event_schema
const transitionProps = { ...transitionEvent.properties }
delete transitionProps.recorded_at
delete transitionProps.event_fingerprint
replaceProperties(transitionEvent, {
  ...transitionProps, actor_class: { type: 'identifier' }, actor_ref: id, recorded_at: ts, event_fingerprint: fp,
})
transitionEvent.conditional_rules = [
  'event_kind_selects_exactly_one_transition_table_row_for_from_state_to_state',
  'payload_schema_version_and_payload_ref_and_payload_fingerprint_resolve_the_selected_event_schema',
  'actor_class_and_actor_ref_satisfy_the_selected_transition_actor_authority_ref_at_the_same_snapshot',
]
r17.fingerprint_schemas.outbox_transition_event = fingerprint('CTRL-G24-OUTBOX-TRANSITION-EVENT-R17', Object.keys(transitionEvent.properties).filter(field => field !== 'event_fingerprint'))

const nonleaseFailures = ['operation_authority_changed', 'payload_changed', 'provider_registry_changed', 'capability_invalid_but_unconsumed', 'reservation_budget_invalid']
r17.outbox.provider_call_gate.nonlease_final_recheck_failure_set = {
  schema_version: 'ctrl.g24.nonlease-final-recheck-failure-set.r17.v1',
  values: nonleaseFailures, closed: true,
  derivation: {
    operation_authority_changed: 'all_operation_specific_authority_predicates_still_pass_is_false',
    payload_changed: 'effect_payload_fingerprint_unchanged_is_false',
    provider_registry_changed: 'provider_operation_capability_current_unambiguous_unexpired_and_exactly_bound_is_false_while_the_presented_capability_is_proven_unconsumed',
    capability_invalid_but_unconsumed: 'presented_single_use_capability_is_proven_unconsumed_but_any_nonlease_binding_or_expiry_predicate_is_false',
    reservation_budget_invalid: 'committed_reservation_count_lte_three_is_false',
  },
  empty_set: 'priority_6_does_not_match', one_or_more_members: 'priority_6_matches_if_all_other_priority_6_predicates_pass', unknown_member: 'contract_invalid',
}
const abort = r17.outbox.invocation_aborted_before_provider_schema
replaceProperties(abort, {
  ...abort.properties,
  abort_reason: { type: 'enum', values: nonleaseFailures },
  failed_nonlease_final_recheck_codes: { type: 'array', min_items: 1, unique: true, ordered_by: 'nonlease_final_recheck_failure_set.values', items: { type: 'enum', values: nonleaseFailures } },
  abort_actor_class: { const: 'current_fenced_claim_worker' },
})
abort.conditional_rules = [
  'abort_reason_equals_the_first_member_of_failed_nonlease_final_recheck_codes_in_closed_declared_order',
  'failed_nonlease_final_recheck_codes_equals_the_exact_nonempty_set_of_failed_named_rechecks_from_the_selected_priority_6_snapshot',
  'current_fenced_claim_worker_live_lease_current_tip_unconsumed_capability_and_zero_provider_calls_are_all_proven',
]
r17.fingerprint_schemas.invocation_aborted_before_provider = fingerprint('CTRL-G24-INVOCATION-ABORTED-BEFORE-PROVIDER-R17', Object.keys(abort.properties).filter(field => field !== 'abort_fingerprint'))
const gate = r17.outbox.provider_call_gate
gate.final_recheck_outcome_table.rows[5].guard = 'current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_at_least_one_closed_nonlease_final_recheck_failure_set_member_failed_and_invocation_tip_still_current_and_no_successor'
gate.final_recheck_outcome_table.rows[5].action = 'append_invocation_aborted_before_provider_with_exact_nonempty_failed_nonlease_final_recheck_code_set'
gate.final_recheck_outcome_table.exhaustiveness = 'priorities_1_through_6_are_exactly_defined; priority_7_is_the_closed_complement_where_all_rechecks_pass; every_snapshot_matches_exactly_one_first_row'
gate.final_recheck_outcome_table.rows[6].guard = 'closed_complement_of_priorities_1_through_6_and_all_rechecks_pass_and_current_fenced_worker_and_lease_live_and_invocation_tip_current_and_no_successor_and_capability_unconsumed'
gate.transition_authorization_derivation.exact_append_rows[2].required_payload = 'exact_nonempty_failed_nonlease_final_recheck_code_set'
const abortTransition = r17.outbox.transition_table.find(row => row.event_kind === 'invocation_aborted_before_provider')
abortTransition.condition = 'selected_final_recheck_priority_6_and_exact_nonempty_failed_nonlease_final_recheck_code_set_and_current_fenced_worker_and_lease_live_and_capability_proven_unconsumed_and_zero_call_evidence_and_invocation_tip_still_current_and_no_successor'

// Release proof follows the new exported/selected schema identity and universal content fingerprint.
r17.release_terminal_consumption_derivation.operation_result_schema_derivation_ref = 'operation_result_schema_derivation'
r17.release_terminal_consumption_derivation.canonical_result_payload_bytes_rule = 'resolve_one_same_workspace_result_blob; verify_operation_exported_selected_branch_schema_membership_length_content_hash_universal_result_fingerprint_and_blob_fingerprint; parse_exact_canonical_json_bytes_under_selected_branch_schema; extract_declared_result_ref_and_terminal_receipt'
const releaseRecords = r17.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
releaseRecords.splice(1, 1, {
  record_name: 'use_release_result_blob', schema_ref: 'operation_result_blob_store.row_schema',
  joins: [
    ['use_release_committed_success.workspace_ref', 'record.workspace_ref'], ['use_release_committed_success.operation_class', 'record.operation_class'],
    ['use_release_committed_success.canonical_result_payload_bytes_ref', 'record.canonical_result_payload_bytes_ref'],
    ['use_release_committed_success.exported_result_schema_version', 'record.exported_result_schema_version'],
    ['use_release_committed_success.selected_result_schema_version', 'record.selected_result_schema_version'],
    ['use_release_committed_success.successful_result_branch', 'record.successful_result_branch'],
    ['use_release_committed_success.canonical_result_payload_bytes_sha256', 'record.canonical_result_payload_bytes_sha256'],
    ['use_release_committed_success.result_payload_fingerprint', 'record.result_payload_fingerprint'],
  ],
})

bumpChangedSchemas()
for (const name of r17.operation_names) {
  r17.operation_specs[name].result_schema = r17.result_payload_schemas[name].schema_version
  r17.evaluator_abi.operation_result_exports[name] = r17.result_payload_schemas[name].schema_version
}
replaceProperties(r17.evaluator_abi.operation_result_exports_schema, Object.fromEntries(r17.operation_names.map(name => [name, { const: r17.result_payload_schemas[name].schema_version }])))
bumpChangedSchemas()
repairEmbeddedSelfVersions()
bumpChangedSchemas()

const beforeNodes = schemaNodes(frozenR16)
const changes = []
for (const [path, after] of schemaNodes(r17)) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r17.')) throw new Error(`changed_schema_without_r17_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r17.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R16_and_materialized_R17_plus_exact_byte_schema_response_case_writer_ambiguity_actor_and_closed_failure_checks',
  changes, every_changed_or_new_schema_must_have_r17_version: true,
  dependency_parity_checks: [
    'one_canonical_json_utf8_authority_governs_result_and_response_blobs_without_fingerprint_framing',
    'every_success_binds_operation_class_exported_result_schema_selected_result_schema_and_discriminator_branch',
    'result_blob_response_blob_and_success_row_are_atomically_resolvable_and_byte_equal',
    'case_authority_has_one_internal_database_writer_with_cas_rotation_and_direct_dml_denial',
    'worker_and_lease_ambiguity_have_inseparable_reason_recorder_and_transition_actor_authority',
    'provider_priority_6_uses_an_exact_nonempty_subset_of_a_closed_named_nonlease_failure_set_and_priority_7_is_its_closed_complement',
  ],
}
r17.required_negative_fixture_families = [...new Set([...r17.required_negative_fixture_families,
  'canonical_json_utf8_authority', 'operation_result_export_and_selected_schema_binding', 'canonical_response_blob_resolution',
  'atomic_result_response_success_commit', 'sole_case_authority_writer', 'case_authority_rotation_cas',
  'ambiguity_reason_recorder_actor_inseparability', 'closed_nonlease_failure_set', 'outbox_transition_actor_binding',
])]
r17.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r17)
export const materializedR17 = r17
export const materializedR17Output = `${JSON.stringify(r17, null, 2)}\n`
export const materializedR17Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR17Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR17Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R17 effective contract`)
  } else process.stdout.write(materializedR17Output)
}
