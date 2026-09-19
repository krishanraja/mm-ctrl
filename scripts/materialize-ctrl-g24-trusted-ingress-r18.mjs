import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR17 } from './materialize-ctrl-g24-trusted-ingress-r17.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r17.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r18.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR17 = JSON.parse(inputBytes)
const r18 = structuredClone(materializedR17)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }

function closed(schema_version, properties, extras = {}) {
  const optional = extras.optional ?? []
  return { schema_version, type: 'object', exact_keys: Object.keys(properties), required: Object.keys(properties).filter(key => !optional.includes(key)), ...(optional.length ? { optional } : {}), additional_properties: false, properties, ...extras }
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
const r18Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r18.') : `${version}.r18`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 10; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR17)
    for (const [path, after] of schemaNodes(r18)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r18.')) {
        after.schema_version = r18Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR17)
  for (const [path, after] of schemaNodes(r18)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      const priorConst = prior.properties?.[field]?.const
      if (field.endsWith('schema_version') && typeof priorConst === 'string' && property?.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r18.schema_version = 'ctrl.g24.trusted-ingress.r18.effective.v1'
r18.status = 'seventeenth_repair_candidate_under_independent_review'
r18.supersedes = {
  commit: '0c7db13d1a70d1f9758c73d719b97165c4199be0', tree: 'ac90df421c9c06d97a7d6eefa6df2d5ee1a9cc40',
  human_blob: 'c2d0e61da0a6d792fe1fa5277f76831b6006f55c', machine_blob: 'ca38baf41a45acdfefd93f15147b052f199bdfaf',
  qa_blob: '680d3d882c76619a4d023d8724a69719d2696937', checker_blob: '48757a1166aae47ea44f2616440b961b7b543d66',
  materializer_blob: '2eb550c7dba223895509ac7b4f4935d3a61b17fd', founder_checker_blob: '0ff1ab0618ce4b76e00e1d505ca2281239f68b8d',
  adjudication: 'veto',
}
r18.materialization = {
  authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r18.mjs',
  frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false,
  generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true,
}

// Derive the selected schema for every discriminated export, not one hand-picked operation.
const discriminated = Object.fromEntries(Object.entries(r18.result_payload_schemas)
  .filter(([, schema]) => schema.discriminator)
  .map(([operation, schema]) => [operation, {
    exported_union_schema_version: schema.schema_version,
    discriminator: schema.discriminator,
    variants: Object.fromEntries(Object.entries(schema.variants).map(([branch, variant]) => [branch, variant.schema_version])),
  }]))
const nonDiscriminated = r18.operation_names.filter(name => !r18.result_payload_schemas[name].discriminator)
r18.operation_result_schema_derivation = {
  inventory_source: 'all_operation_names_joined_to_result_payload_schemas_and_evaluator_abi.operation_result_exports',
  exported_schema_rule: 'exported_result_schema_version_equals_operation_specs[operation_class].result_schema_and_evaluator_abi.operation_result_exports[operation_class]',
  discriminated_results: discriminated,
  non_discriminated_operations: nonDiscriminated,
  selected_schema_rule: 'for_discriminated_result_selected_schema_equals_exact_variant_schema_selected_by_canonical_payload_discriminator_and_successful_result_branch_equals_variant_name; otherwise_selected_schema_equals_exported_schema_and_branch_is_null',
  completeness: 'the_discriminated_and_non_discriminated_operation_sets_are_disjoint_and_their_union_equals_operation_names_exactly',
  disagreement: 'proof_schema_hold_without_result_blob_success_row_response_or_protected_effect',
}
const allBranches = [...new Set(Object.values(discriminated).flatMap(result => Object.keys(result.variants)))]
const nullableBranch = { type: 'nullable', value_schema: { type: 'enum', values: allBranches } }
r18.operation_result_blob_store.row_schema.properties.successful_result_branch = nullableBranch
r18.operation_registry.committed_success_row_schema.properties.successful_result_branch = nullableBranch
r18.operation_result_blob_store.row_schema.conditional_rules[3] = 'operation_class_exported_schema_selected_schema_and_branch_satisfy_complete_operation_result_schema_derivation_inventory'
const success = r18.operation_registry.committed_success_row_schema
success.conditional_rules = [
  'result_ref_is_nonnull_iff_operation_class_is_use_release_and_equals_the_branch_declared_terminal_receipt',
  'successful_result_branch_is_nonnull_iff_operation_result_schema_derivation_classifies_the_operation_as_discriminated',
  'operation_class_exported_schema_selected_schema_and_branch_satisfy_complete_operation_result_schema_derivation_inventory',
  'canonical_result_payload_bytes_ref_resolves_exactly_one_operation_result_blob_in_the_same_workspace',
  'canonical_response_bytes_ref_resolves_exactly_one_operation_response_blob_in_the_same_workspace',
  'result_blob_and_response_blob_fields_equal_the_committed_success_derivations',
  'committed_success_fingerprint_equals_recomputed_complete_success_preimage',
]

// Response and replay envelopes carry the same exact schema/branch identity as the committed result.
const committedResponse = r18.response_union.schemas.committed
const responseProps = { ...committedResponse.properties }
delete responseProps.result_payload_b64url
delete responseProps.result_payload_fingerprint
delete responseProps.result_payload_byte_length
delete responseProps.snapshot_fingerprint
delete responseProps.committed_at
replaceProperties(committedResponse, {
  ...responseProps, successful_result_branch: nullableBranch,
  result_payload_b64url: { type: 'base64url_without_padding' }, result_payload_fingerprint: fp,
  result_payload_byte_length: { type: 'safe_nonnegative_integer' }, snapshot_fingerprint: fp, committed_at: ts,
})
const replay = r18.response_union.schemas.replayed_committed
replay.type = 'object'
replaceProperties(replay, {
  status: { const: 'replayed_committed' }, operation_id: id, operation_class: { enum_ref: 'operation_names' },
  exported_result_schema_version: id, selected_result_schema_version: id, successful_result_branch: nullableBranch,
  result_payload_b64url: { type: 'base64url_without_padding' }, result_payload_fingerprint: fp,
  result_payload_byte_length: { type: 'safe_nonnegative_integer' }, snapshot_fingerprint: fp,
  committed_at: ts, replayed_at: ts, historical_replay: { const: true }, current_standing: { const: false },
})
r18.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities = [
  'response.status_equals_committed', 'response.operation_id_equals_success.operation_id', 'response.operation_class_equals_success.operation_class',
  'response.exported_result_schema_version_equals_success.exported_result_schema_version',
  'response.selected_result_schema_version_equals_success.selected_result_schema_version',
  'response.successful_result_branch_equals_success.successful_result_branch',
  'response.result_payload_b64url_equals_result_blob.canonical_result_payload_b64url',
  'response.result_payload_fingerprint_equals_success.result_payload_fingerprint',
  'response.result_payload_byte_length_equals_result_blob.canonical_result_payload_byte_length',
  'response.snapshot_fingerprint_equals_success.snapshot_fingerprint',
  'response.committed_at_equals_success.committed_at_and_both_blobs.committed_at',
]

// Release terminal proof uses the selected schema and the universal payload fingerprint as its sole identity.
r18.release_terminal_consumption_derivation.exact_equalities = [
  'consumption.workspace_ref_equals_committed_success.workspace_ref',
  'consumption.case_ref_equals_committed_success.requested_case_ref',
  'consumption.subject_ref_equals_committed_success.case_derived_subject',
  'consumption.use_release_operation_id_equals_committed_success.operation_id',
  'committed_success.operation_class_equals_use_release',
  'committed_success.stable_principal_ref_equals_exact_named_leader',
  'consumption.terminal_result_schema_version_equals_committed_success.selected_result_schema_version',
  'consumption.terminal_result_ref_equals_committed_success.result_ref',
  'consumption.terminal_result_fingerprint_equals_committed_success.result_payload_fingerprint_equals_resolved_result_blob.result_payload_fingerprint',
  'consumption.terminal_result_branch_equals_committed_success.successful_result_branch_equals_resolved_result_blob.successful_result_branch',
  'consumption.outcome_equals_consumption.terminal_result_branch',
  'consumption.terminal_receipt_ref_equals_branch_extracted_terminal_receipt_ref_and_committed_success.result_ref',
]
for (const row of r18.release_terminal_consumption_derivation.branch_table) {
  delete row.result_fingerprint_schema_ref
  row.terminal_fingerprint_authority_ref = 'fingerprint_schemas.operation_result_payload'
  row.terminal_fingerprint_rule = 'terminal_result_fingerprint_equals_the_universal_result_payload_fingerprint_of_the_exact_resolved_result_blob'
}
const releaseRecords = r18.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
releaseRecords[0].joins = [
  ['release_authority_terminal_consumptions.workspace_ref', 'record.workspace_ref'],
  ['release_authority_terminal_consumptions.case_ref', 'record.requested_case_ref'],
  ['release_authority_terminal_consumptions.subject_ref', 'record.case_derived_subject'],
  ['release_authority_terminal_consumptions.use_release_operation_id', 'record.operation_id'],
  ['release_authority_terminal_consumptions.terminal_result_schema_version', 'record.selected_result_schema_version'],
  ['release_authority_terminal_consumptions.terminal_result_ref', 'record.result_ref'],
  ['release_authority_terminal_consumptions.terminal_result_fingerprint', 'record.result_payload_fingerprint'],
  ['release_authority_terminal_consumptions.terminal_result_branch', 'record.successful_result_branch'],
  ['release_authority_terminal_consumptions.outcome', 'record.successful_result_branch'],
  ['release_authority_terminal_consumptions.terminal_receipt_ref', 'record.result_ref'],
]

// Rotation appends a later server-timed row; history is never closed or rewritten.
const control = r18.case_authority_control_plane
control.caller_authority = 'human_session_actor_class_krish_operator_and_stable_actor_ref_equals_the_exact_current_case_binding_engagement_operator_ref; no_model_workload_browser_edge_or_generic_service_principal_may_call; bootstrap_is_migration_identity_only'
const request = control.request_schema
const reqProps = { ...request.properties }
delete reqProps.requested_valid_from
replaceProperties(request, { ...reqProps, request_fingerprint: fp })
r18.fingerprint_schemas.case_authority_control_request = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-REQUEST-R18', Object.keys(request.properties).filter(field => field !== 'request_fingerprint'))
request.fingerprint_ref = 'fingerprint_schemas.case_authority_control_request'
request.fingerprint_field = 'request_fingerprint'
request.fingerprint_field_must_equal_referenced_preimage_digest = true
control.transaction = [
  'serializable_transaction_and_advisory_lock_on_workspace_subject_case',
  'resolve_exactly_zero_or_one_selected_current_row_under_case_authority_bindings.current_selection',
  'bootstrap_requires_both_expected_current_fields_null_and_migration_execution_identity',
  'rotation_requires_both_expected_current_fields_equal_the_resolved_current_row_byte_for_byte',
  'verify_authenticated_krish_operator_equals_current_engagement_operator_for_rotation',
  'verify_both_grant_set_seals_are_exact_current_set_seals_in_the_same_snapshot',
  'assign_effective_at_from_the_database_transaction_timestamp_strictly_after_current.valid_from_or_hold',
  'append_one_new_fingerprinted_case_authority_row_with_valid_from_equal_effective_at_and_valid_until_absent_without_updating_any_prior_row',
  'compare_and_swap_selected_current_row_version_and_envelope_fingerprint_unchanged_before_commit',
  'append_the_new_binding_and_one_control_registry_receipt_in_the_same_transaction_or_rollback_every_write',
]
control.validity_policy = 'effective_at_is_server_generated_at_commit; future_scheduling_backdating_and_caller_supplied_validity_are_forbidden'
control.history_policy = 'prior_case_authority_rows_are_never_updated_closed_deleted_or_rewritten; snapshot_selection_uses_only_rows_with_valid_from_lte_evaluated_at_then_the_existing_deterministic_maximum_rule'
control.replay_protocol_ref = 'case_authority_control_operation_registry'
r18.case_authority_control_operation_registry = {
  schema_version: 'ctrl.g24.case-authority-control-operation-registry.r18.v1',
  row_schema: closed('ctrl.g24.case-authority-control-operation-receipt.r18.v1', {
    workspace_ref: id, subject_ref: id, case_ref: id, control_operation_id: id, request_fingerprint: fp,
    state: { const: 'committed' }, prior_row_version_ref: { type: 'nullable', value_schema: id },
    prior_row_envelope_fingerprint: { type: 'nullable', value_schema: fp }, new_row_version_ref: id,
    new_row_envelope_fingerprint: fp, effective_at: ts, receipt_fingerprint: fp,
  }, {
    append_only: true, unique_keys: [['workspace_ref', 'subject_ref', 'case_ref', 'control_operation_id']],
    conditional_rules: [
      'request_fingerprint_equals_the_exact_canonical_control_request_fingerprint',
      'prior_fields_are_both_null_for_bootstrap_or_both_equal_the_selected_prior_row_for_rotation',
      'new_row_fields_equal_the_atomically_appended_case_authority_binding_row',
      'effective_at_equals_the_new_row.valid_from_and_the_database_transaction_timestamp',
      'receipt_fingerprint_equals_recomputed_complete_receipt_preimage',
    ],
  }),
  replay: 'same_unique_key_and_same_request_fingerprint_returns_the_exact_existing_receipt_without_any_write',
  collision: 'same_unique_key_and_different_request_fingerprint_returns_case_authority_control_collision_hold_without_any_write',
  concurrent_first_use: 'one_serializable_winner; every_loser_reloads_then_applies_exact_replay_or_collision_rule',
  no_receipt_without_binding: true, no_binding_without_receipt: true,
}
r18.fingerprint_schemas.case_authority_control_receipt = fingerprint('CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R18', Object.keys(r18.case_authority_control_operation_registry.row_schema.properties).filter(field => field !== 'receipt_fingerprint'))
r18.case_authority_control_operation_registry.row_schema.fingerprint_ref = 'fingerprint_schemas.case_authority_control_receipt'
r18.case_authority_control_operation_registry.row_schema.fingerprint_field = 'receipt_fingerprint'
r18.case_authority_control_operation_registry.row_schema.fingerprint_field_must_equal_referenced_preimage_digest = true

// The transition signer and the observation recorder are one exact principal.
r18.outbox.payload_binding_map.worker_ambiguity.payload_schema_ref = 'outbox.worker_ambiguity_evidence_schema'
r18.outbox.payload_binding_map.lease_expiry_ambiguity.payload_schema_ref = 'outbox.lease_expiry_ambiguity_evidence_schema'
r18.outbox.payload_binding_map.worker_ambiguity.actor_payload_equality = 'transition_event.actor_ref_equals_payload.recorder_ref_equals_payload.worker_ref'
r18.outbox.payload_binding_map.lease_expiry_ambiguity.actor_payload_equality = 'transition_event.actor_ref_equals_payload.recorder_ref'
r18.outbox.transition_event_schema.conditional_rules.push('for_worker_or_lease_expiry_ambiguity_actor_ref_equals_the_resolved_payload.recorder_ref_byte_for_byte')

// Rewrite the only compound predecessor phrases so the legacy scanner can require the exact _ref field suffix.
const rewritePredecessor = value => {
  if (Array.isArray(value)) return value.map(rewritePredecessor)
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    return value
      .replaceAll('exact_case_transition_and_predecessor_lifecycle_version_ref_match', 'exact_case_transition_and_match_field_predecessor_lifecycle_version_ref')
      .replaceAll('from_state_none_iff_predecessor_lifecycle_version_ref_null', 'from_state_none_iff_field_predecessor_lifecycle_version_ref is null')
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewritePredecessor(item)]))
}
const rewritten = rewritePredecessor(r18)
for (const key of Object.keys(r18)) delete r18[key]
Object.assign(r18, rewritten)
r18.lifecycle_vocabulary_contract.predecessor_ref_exception = 'only_the_exact_canonical_predecessor_reference_field_is_legal; longer_identifier_extensions_and_similar_spellings_are_invalid'

r18.declared_reference_resolution_contract = {
  schema_version: 'ctrl.g24.declared-reference-resolution.r18.v1',
  scopes: [
    'proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records',
    'outbox.payload_binding_map', 'outbox.transition_table',
  ],
  rule: 'every_schema_ref_resolves_exactly_one_object; every_declared_join_or_payload_field_resolves_to_an_exact_property_of_that_closed_schema; aliases_resolve_through_the_declared_record_name_or_event_kind',
  unresolved_schema_field_alias_or_duplicate_target: 'contract_invalid',
}

bumpChangedSchemas()
for (const name of r18.operation_names) {
  r18.operation_specs[name].result_schema = r18.result_payload_schemas[name].schema_version
  r18.evaluator_abi.operation_result_exports[name] = r18.result_payload_schemas[name].schema_version
}
replaceProperties(r18.evaluator_abi.operation_result_exports_schema, Object.fromEntries(r18.operation_names.map(name => [name, { const: r18.result_payload_schemas[name].schema_version }])))
bumpChangedSchemas()
repairEmbeddedSelfVersions()
bumpChangedSchemas()

const beforeNodes = schemaNodes(frozenR17)
const changes = []
for (const [path, after] of schemaNodes(r18)) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r18.')) throw new Error(`changed_schema_without_r18_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r18.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R17_and_materialized_R18_plus_complete_discriminator_release_case_replay_actor_and_reference_graph_checks',
  changes, every_changed_or_new_schema_must_have_r18_version: true,
  dependency_parity_checks: [
    'all_discriminated_result_unions_are_mechanically_inventoried_and_selected_variant_identity_reaches_result_response_and_success',
    'release_terminal_schema_uses_selected_result_schema_and_universal_payload_fingerprint_is_the_only_terminal_fingerprint_authority',
    'case_rotation_appends_only_one_server_timed_row_and_never_mutates_prior_history',
    'case_control_replay_and_collision_are_decided_by_a_closed_request_fingerprint_and_atomic_receipt',
    'ambiguity_transition_actor_ref_equals_payload_recorder_ref_byte_for_byte',
    'declared_proof_payload_and_transition_schema_fields_resolve_mechanically_and_predecessor_ref_requires_an_exact_field_suffix',
  ],
}
r18.required_negative_fixture_families = [...new Set([...r18.required_negative_fixture_families,
  'complete_discriminated_result_inventory', 'approve_intervention_selected_variant', 'release_selected_schema_join',
  'release_single_fingerprint_authority', 'append_only_server_timed_case_rotation', 'case_control_exact_replay_and_collision',
  'ambiguity_transition_actor_equals_recorder', 'declared_schema_field_path_resolution', 'strict_predecessor_ref_suffix',
])]
r18.claim_limit = 'unimplemented_local_effective_contract_only'

assertSerializable(r18)
export const materializedR18 = r18
export const materializedR18Output = `${JSON.stringify(r18, null, 2)}\n`
export const materializedR18Path = outputPath

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') {
    writeFileSync(join(root, outputPath), materializedR18Output)
    console.log(`wrote ${outputPath}`)
  } else if (mode === '--check') {
    if (readFileSync(join(root, outputPath), 'utf8') !== materializedR18Output) process.exitCode = 1
    else console.log(`ok: ${outputPath} is the exact fully materialized R18 effective contract`)
  } else process.stdout.write(materializedR18Output)
}
