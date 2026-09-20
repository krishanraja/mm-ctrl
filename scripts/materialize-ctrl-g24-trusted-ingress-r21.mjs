import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR20 } from './materialize-ctrl-g24-trusted-ingress-r20.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r20.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r21.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const frozenR20 = JSON.parse(inputBytes)
const r21 = structuredClone(materializedR20)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const id = { type: 'identifier' }
const fp = { type: 'sha256' }
const ts = { type: 'canonical_timestamp' }
const bool = { type: 'boolean' }
const b64 = { type: 'base64url_without_padding' }
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
function schemaNodes(value, path = '$', found = new Map()) {
  if (!value || typeof value !== 'object') return found
  if (!Array.isArray(value) && typeof value.schema_version === 'string') found.set(path, value)
  if (Array.isArray(value)) value.forEach((item, index) => schemaNodes(item, `${path}[${index}]`, found))
  else for (const [key, item] of Object.entries(value)) schemaNodes(item, `${path}.${key}`, found)
  return found
}
function assertSerializable(value, path = '$') {
  if (value === undefined) throw new Error(`undefined value at ${path}`)
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertSerializable(item, `${path}.${key}`)
}
const withoutVersion = value => JSON.stringify({ ...value, schema_version: null })
const r21Version = version => version.match(/\.r\d+\./) ? version.replace(/\.r\d+\./, '.r21.') : `${version}.r21`
function bumpChangedSchemas() {
  for (let pass = 0; pass < 12; pass += 1) {
    let changed = false
    const before = schemaNodes(frozenR20)
    for (const [path, after] of schemaNodes(r21)) {
      const prior = before.get(path)
      if ((!prior || withoutVersion(prior) !== withoutVersion(after)) && !after.schema_version.includes('.r21.')) {
        after.schema_version = r21Version(after.schema_version)
        changed = true
      }
    }
    if (!changed) break
  }
}
function repairEmbeddedSelfVersions() {
  const before = schemaNodes(frozenR20)
  for (const [path, after] of schemaNodes(r21)) {
    const prior = before.get(path)
    if (!prior || !after.properties) continue
    for (const [field, property] of Object.entries(after.properties)) {
      const priorConst = prior.properties?.[field]?.const
      if (field.endsWith('schema_version') && typeof priorConst === 'string' && property?.const === priorConst && priorConst === prior.schema_version) property.const = after.schema_version
    }
  }
}

r21.schema_version = 'ctrl.g24.trusted-ingress.r21.effective.v1'
r21.status = 'twentieth_repair_candidate_under_independent_review'
r21.supersedes = {
  commit: '19443d23d92cc670a3cc1150327694ae879c2f6d', tree: '52d7cba70ced4a130dab90eb39aca1b3e51fdbb2',
  human_blob: 'b020ed658e22849747cdef6093e808820f07b8a2', machine_blob: '0b88f1c29f0234622e8c0f323e1c3930b1777e8c',
  qa_blob: '62a8f46e33c821d1e41008b47aece31d4354ec66', checker_blob: '59103a5acb8276e22e3e035e7c75276c11db6900',
  materializer_blob: '59f43bd0e51cdc50a83d5ebb1c7ca472e224e34d', founder_checker_blob: '2840343a2b254f5cfa9bb110038c6b1cab71ed0c', adjudication: 'veto',
}
r21.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r21.mjs', frozen_input: { path: inputPath, sha256: sha256(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

// Held responses have exact versions and types, and every durable hold binds the exact held response schema.
const heldSchema = r21.response_union.schemas.held
heldSchema.schema_version = 'ctrl.g24.response.held.r21.v1'
heldSchema.type = 'object'
const replayedHeldSchema = r21.response_union.schemas.replayed_held
replayedHeldSchema.schema_version = 'ctrl.g24.response.replayed-held.r21.v1'
replayedHeldSchema.type = 'object'
r21.operation_registry.committed_hold_row_schema.properties.response_schema_version = { const: heldSchema.schema_version }
r21.operation_hold_blob_store.row_schema.properties.response_schema_version = { const: heldSchema.schema_version }
r21.operation_registry.committed_hold_row_schema.conditional_rules = [
  'response_schema_version_equals_response_union.schemas.held.schema_version_byte_for_byte',
  ...r21.operation_registry.committed_hold_row_schema.conditional_rules,
]
r21.operation_hold_blob_store.row_schema.conditional_rules = [
  'response_schema_version_equals_response_union.schemas.held.schema_version_byte_for_byte',
  ...r21.operation_hold_blob_store.row_schema.conditional_rules,
]
r21.operation_registry.replayed_held_derivation.held_response_schema_ref = 'response_union.schemas.held'
r21.operation_registry.replayed_held_derivation.replayed_response_schema_ref = 'response_union.schemas.replayed_held'
r21.operation_registry.replayed_held_derivation.response_schema_equalities = [
  'hold_row.response_schema_version_equals_hold_blob.response_schema_version_equals_response_union.schemas.held.schema_version',
  'replayed_response_validates_response_union.schemas.replayed_held',
]

// Session identity and revocation are closed current evidence, not prose assertions.
const currentSelection = 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_snapshot_time_and_valid_until_absent_or_gt_snapshot_time'
r21.authoritative_row_schemas.case_session_issuer_registry = closed('ctrl.g24.authoritative-row.case-session-issuer-registry.r21.v1', {
  issuer_ref: id, issuer_version_ref: id, issuer_artifact_sha256: fp, authority_class: { const: 'case_session_principal_issuer' },
  row_version_ref: id, valid_from: ts, valid_until: ts, issuer_registry_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['issuer_ref', 'row_version_ref']], partition_key: ['issuer_ref'], current_selection: currentSelection, current_selection_unique_or_hold: true, fingerprint_ref: 'fingerprint_schemas.case_session_issuer_registry', fingerprint_field: 'issuer_registry_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r21.authoritative_row_schemas.case_session_evaluator_registry = closed('ctrl.g24.authoritative-row.case-session-evaluator-registry.r21.v1', {
  evaluator_ref: id, evaluator_version_ref: id, evaluator_artifact_sha256: fp, capability_class: { const: 'case_session_authority_evaluator' },
  row_version_ref: id, valid_from: ts, valid_until: ts, evaluator_registry_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['evaluator_ref', 'row_version_ref']], partition_key: ['evaluator_ref'], current_selection: currentSelection, current_selection_unique_or_hold: true, fingerprint_ref: 'fingerprint_schemas.case_session_evaluator_registry', fingerprint_field: 'evaluator_registry_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r21.authoritative_row_schemas.account_stable_actor_bindings = closed('ctrl.g24.authoritative-row.account-stable-actor-bindings.r21.v1', {
  workspace_ref: id, account_ref: id, stable_actor_ref: id, binding_ref: id,
  issuer_ref: id, issuer_version_ref: id, issuer_artifact_sha256: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, binding_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['workspace_ref', 'account_ref', 'row_version_ref']], partition_key: ['workspace_ref', 'account_ref'], current_selection: currentSelection, current_selection_unique_or_hold: true, fingerprint_ref: 'fingerprint_schemas.account_stable_actor_binding', fingerprint_field: 'binding_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r21.authoritative_row_schemas.account_access_standings = closed('ctrl.g24.authoritative-row.account-access-standings.r21.v1', {
  workspace_ref: id, account_ref: id, standing_ref: id, standing: { type: 'enum', values: ['active', 'revoked', 'offboarded'] },
  source_evidence_ref: id, decided_at: ts, issuer_ref: id, issuer_version_ref: id, issuer_artifact_sha256: fp,
  row_version_ref: id, valid_from: ts, valid_until: ts, standing_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['workspace_ref', 'account_ref', 'row_version_ref']], partition_key: ['workspace_ref', 'account_ref'], current_selection: currentSelection, current_selection_unique_or_hold: true, fingerprint_ref: 'fingerprint_schemas.account_access_standing', fingerprint_field: 'standing_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
r21.authoritative_row_schemas.case_server_session_principal_evidence = closed('ctrl.g24.authoritative-row.case-server-session-principal-evidence.r21.v1', {
  workspace_ref: id, server_session_ref: id, session_instance_hash: fp, account_ref: id, stable_actor_ref: id,
  session_standing: { type: 'enum', values: ['active', 'revoked'] }, issued_at: ts, expires_at: ts,
  issuer_ref: id, issuer_version_ref: id, issuer_artifact_sha256: fp,
  evaluator_ref: id, evaluator_version_ref: id, evaluator_artifact_sha256: fp,
  account_binding_ref: id, account_binding_row_version_ref: id, account_binding_fingerprint: fp,
  account_standing_ref: id, account_standing_row_version_ref: id, account_standing_fingerprint: fp,
  evidence_ref: id, row_version_ref: id, valid_from: ts, valid_until: ts, session_principal_fingerprint: fp,
}, { optional: ['valid_until'], append_only: true, unique_keys: [['workspace_ref', 'server_session_ref', 'row_version_ref']], partition_key: ['workspace_ref', 'server_session_ref'], current_selection: currentSelection, current_selection_unique_or_hold: true, fingerprint_ref: 'fingerprint_schemas.case_server_session_principal_evidence', fingerprint_field: 'session_principal_fingerprint', fingerprint_field_must_equal_referenced_preimage_digest: true })
for (const [name, schema] of Object.entries({
  case_session_issuer_registry: r21.authoritative_row_schemas.case_session_issuer_registry,
  case_session_evaluator_registry: r21.authoritative_row_schemas.case_session_evaluator_registry,
  account_stable_actor_binding: r21.authoritative_row_schemas.account_stable_actor_bindings,
  account_access_standing: r21.authoritative_row_schemas.account_access_standings,
  case_server_session_principal_evidence: r21.authoritative_row_schemas.case_server_session_principal_evidence,
})) r21.fingerprint_schemas[name] = fingerprint(`CTRL-G24-${name.replaceAll('_', '-').toUpperCase()}-R21`, Object.keys(schema.properties).filter(field => field !== schema.fingerprint_field))
r21.case_authority_control_session_actor_derivation = {
  schema_version: 'ctrl.g24.case-authority-control-session-actor-derivation.r21.v1',
  source: 'authoritative_row_schemas.case_server_session_principal_evidence', caller_supplied_actor_field: 'forbidden',
  trusted_issuer_schema_ref: 'authoritative_row_schemas.case_session_issuer_registry',
  trusted_evaluator_schema_ref: 'authoritative_row_schemas.case_session_evaluator_registry',
  account_actor_schema_ref: 'authoritative_row_schemas.account_stable_actor_bindings',
  account_standing_schema_ref: 'authoritative_row_schemas.account_access_standings',
  session_evidence_schema_ref: 'authoritative_row_schemas.case_server_session_principal_evidence',
  timing: 'resolve_and_validate_in_the_same_serializable_snapshot_before_registry_lookup',
  exact_source_equalities: [
    'session.issuer_ref_version_and_artifact_equal_the_unique_current_trusted_issuer_row',
    'session.evaluator_ref_version_and_artifact_equal_the_unique_current_trusted_evaluator_row',
    'session.account_ref_stable_actor_ref_binding_ref_row_version_and_fingerprint_equal_the_unique_current_account_binding_row',
    'session.account_ref_standing_ref_row_version_and_fingerprint_equal_the_unique_current_account_standing_row',
    'session.session_standing_equals_active_and_account_standing.standing_equals_active',
    'snapshot_time_is_gte_session.issued_at_and_strictly_lt_session.expires_at',
  ],
  current_row_selection: 'every_source_uses_its_declared_deterministic_current_selection_at_one_snapshot_time_or_holds',
  fail_closed: 'missing_duplicate_expired_stale_untrusted_revoked_offboarded_or_mismatched_source_holds_without_registry_disclosure_or_write',
}
r21.case_authority_control_session_snapshot = {
  schema_version: 'ctrl.g24.case-authority-control-session-snapshot.r21.v1',
  transaction: 'one_serializable_transaction_snapshot_for_session_authority_registry_lookup_case_binding_grants_and_any_mutation',
  controlling_rows: ['current_session_principal_evidence', 'current_session_issuer', 'current_session_evaluator', 'current_account_actor_binding', 'current_account_access_standing', 'current_case_authority_binding', 'current_operator_grants', 'current_workload_grants'],
  snapshot_fingerprint: 'canonical_set_of_exact_controlling_row_refs_versions_and_fingerprints_at_one_database_transaction_timestamp',
  compare_and_swap_before_commit: 'every_controlling_row_ref_version_fingerprint_and_standing_must_remain_unchanged_or_serializable_retry_then_hold',
  replay_obligation: 'registry_lookup_and_original_actor_replay_use_the_same_snapshot_and_recheck_active_nonexpired_nonrevoked_nonoffboarded_standing',
  fresh_obligation: 'fresh_current_operator_authority_and_binding_mutation_use_the_same_snapshot_and_compare_and_swap_all_controlling_rows',
}
r21.case_authority_control_session_branch_equalities = {
  schema_version: 'ctrl.g24.case-authority-control-session-branch-equalities.r21.v1',
  original_actor_replay: [
    'session.stable_actor_ref_equals_original_receipt.session_actor_ref',
    'session.account_ref_and_stable_actor_ref_equal_the_current_account_binding',
    'session_and_account_standings_are_active_and_session_is_unexpired',
    'issuer_evaluator_binding_standing_and_session_rows_equal_the_same_serializable_snapshot',
  ],
  current_operator_fresh_mutation: [
    'session.stable_actor_ref_equals_current_case_authority_binding.engagement_operator_ref',
    'session.account_ref_and_stable_actor_ref_equal_the_current_account_binding',
    'session_and_account_standings_are_active_and_session_is_unexpired',
    'issuer_evaluator_binding_standing_session_case_and_grant_rows_equal_the_same_serializable_snapshot_and_pass_compare_and_swap',
  ],
  any_mismatch: 'fail_closed_without_registry_disclosure_binding_or_write',
}
r21.case_authority_control_plane.session_actor_derivation_ref = 'case_authority_control_session_actor_derivation'
r21.case_authority_control_plane.session_snapshot_ref = 'case_authority_control_session_snapshot'
r21.case_authority_control_plane.session_branch_equalities_ref = 'case_authority_control_session_branch_equalities'
r21.case_authority_control_operation_registry.admission_outcome_table.same_snapshot_ref = 'case_authority_control_session_snapshot'
r21.case_authority_control_operation_registry.admission_outcome_table.branch_equalities_ref = 'case_authority_control_session_branch_equalities'

// Hold fingerprints consume closed typed inputs with exact sentinel bytes and total reason selection.
const sentinelLiteral = 'CTRL-G24-CASE-CONTROL-UNAVAILABLE-R21'
const sentinelBytes = Buffer.from(sentinelLiteral, 'utf8')
r21.case_authority_control_unavailable_sentinel = {
  schema_version: 'ctrl.g24.case-authority-control-unavailable-sentinel.r21.v1',
  literal_utf8: sentinelLiteral, literal_utf8_b64url: sentinelBytes.toString('base64url'), byte_length: sentinelBytes.length,
  sha256: sha256(sentinelBytes), byte_rule: 'exact_UTF-8_bytes_only_without_terminator_or_implementation_substitution',
}
r21.case_authority_control_correlation_id_schema = {
  schema_version: 'ctrl.g24.case-authority-control-correlation-id.r21.v1', type: 'string',
  encoding: '32_lowercase_hex_characters', pattern: '^[0-9a-f]{32}$', source_bytes: '16_cryptographically_secure_server_random_bytes',
  caller_supplied: false, generated_before_any_hold_fingerprint_or_rejection_result: true,
}
for (const name of ['request_too_large_rejected', 'parse_rejected', 'malformed_request_rejected', 'request_fingerprint_rejected']) {
  r21.case_authority_control_result_union.variants[name].properties.correlation_id = { schema_ref: 'case_authority_control_correlation_id_schema' }
}
const availabilityFields = [
  'session_actor', 'workspace', 'subject', 'case', 'control_operation_id', 'request_fingerprint',
]
const holdReasons = [
  ['pre_admission.5', 'session_identity_unavailable', 'unauthorized_hold'],
  ['pre_admission.6', 'revoked_or_offboarded', 'revoked_actor_hold'],
  ['registry.8', 'original_actor_mismatch', 'unauthorized_hold'],
  ['registry.9', 'operation_identity_collision', 'collision_hold'],
  ['registry.10', 'current_operator_authority_failed', 'unauthorized_hold'],
  ['registry.11', 'stale_authority', 'stale_authority_hold'],
  ['registry.13', 'serialization_exhausted', 'serialization_hold'],
  ['registry.14', 'internal_failure', 'internal_failure_hold'],
]
const holdInputSchemas = {}
const holdFingerprintVariants = {}
for (const [, reasonCode] of holdReasons) {
  const properties = { correlation_id: { schema_ref: 'case_authority_control_correlation_id_schema' }, reason_code: { const: reasonCode } }
  for (const name of availabilityFields) {
    properties[`${name}_available`] = bool
    properties[`${name}_value_or_sentinel_b64url`] = b64
  }
  const schemaName = `${reasonCode}_input`
  holdInputSchemas[schemaName] = closed(`ctrl.g24.case-authority-control-hold-input-${reasonCode.replaceAll('_', '-')}.r21.v1`, properties, {
    conditional_rules: availabilityFields.flatMap(name => [
      `${name}_available_true_iff_value_bytes_equal_canonical_field_encoding_of_the_typed_dependency`,
      `${name}_available_false_iff_value_bytes_equal_case_authority_control_unavailable_sentinel.literal_utf8_b64url_byte_for_byte`,
    ]),
    canonical_encoding_ref: 'canonical_field_encoding', unavailable_sentinel_ref: 'case_authority_control_unavailable_sentinel',
  })
  holdFingerprintVariants[reasonCode] = {
    input_schema_ref: `case_authority_control_hold_input_schemas.${schemaName}`,
    ...fingerprint(`CTRL-G24-CASE-AUTHORITY-CONTROL-${reasonCode.replaceAll('_', '-').toUpperCase()}-R21`, Object.keys(properties)),
  }
}
r21.case_authority_control_hold_input_schemas = holdInputSchemas
r21.case_authority_control_hold_fingerprints = {
  schema_version: 'ctrl.g24.case-authority-control-hold-fingerprints.r21.v1',
  correlation_id_schema_ref: 'case_authority_control_correlation_id_schema',
  unavailable_sentinel_ref: 'case_authority_control_unavailable_sentinel',
  selected_admission_reason_map: holdReasons.map(([selected_row, reason_code, result_status]) => ({ selected_row, reason_code, result_status, fingerprint_variant: reason_code })),
  variants: holdFingerprintVariants,
  exact_selection: 'the_one_selected_hold_admission_row_selects_exactly_one_reason_code_input_schema_and_domain',
  availability_rule: 'every_dependency_has_one_explicit_availability_bit_and_exactly_one_canonical_typed_value_or_literal_sentinel',
  canonical_encoding_ref: 'canonical_field_encoding', disclosure: 'evaluation_fingerprint_only',
}
r21.case_authority_control_result_union.hold_reason_map_ref = 'case_authority_control_hold_fingerprints.selected_admission_reason_map'
r21.case_authority_control_result_union.hold_input_schema_ref = 'case_authority_control_hold_input_schemas'

// Result schema inventory names the exact effective union and branches.
const useRelease = r21.result_payload_schemas.use_release
r21.operation_result_schema_derivation.discriminated_results.use_release = {
  exported_union_schema_version: useRelease.schema_version, discriminator: useRelease.discriminator,
  variants: Object.fromEntries(Object.entries(useRelease.variants).map(([name, schema]) => [name, schema.schema_version])),
}
r21.operation_result_schema_derivation.inventory_exact_schema_equality = 'every_discriminated_exported_union_and_variant_version_equals_the_current_result_payload_schema_object_byte_for_byte'

// Release issuance branches immediately after outcome selection and rejoins only at commit.
const commonPrefix = ['resolve_current_release_inputs', 'select_terminal_outcome']
const pendingPath = [
  'pending_assemble_terminal_precommit_identity', 'pending_compute_terminal_precommit_fingerprint',
  'pending_encode_selected_result_payload', 'pending_compute_universal_result_payload_fingerprint',
  'pending_assemble_terminal_consumption', 'pending_compute_terminal_consumption_fingerprint',
  'pending_compute_terminal_row_envelope_fingerprint', 'pending_assemble_response_and_success',
  'pending_assemble_exactly_one_outbox_genesis',
]
const invalidatedPath = [
  'invalidated_assemble_terminal_precommit_identity', 'invalidated_compute_terminal_precommit_fingerprint',
  'invalidated_encode_selected_result_payload', 'invalidated_compute_universal_result_payload_fingerprint',
  'invalidated_assemble_terminal_consumption', 'invalidated_compute_terminal_consumption_fingerprint',
  'invalidated_compute_terminal_row_envelope_fingerprint', 'invalidated_assemble_response_and_success',
  'invalidated_assert_no_outbox',
]
const commitNode = 'commit_atomic_release_transaction'
r21.release_terminal_issuance_dependency_dag = {
  schema_version: 'ctrl.g24.release-terminal-issuance-dag.r21.v1',
  nodes: [...commonPrefix, ...pendingPath, ...invalidatedPath, commitNode],
  edges: [
    [commonPrefix[0], commonPrefix[1]],
    [commonPrefix[1], pendingPath[0]], [commonPrefix[1], invalidatedPath[0]],
    ...pendingPath.slice(0, -1).map((node, index) => [node, pendingPath[index + 1]]),
    ...invalidatedPath.slice(0, -1).map((node, index) => [node, invalidatedPath[index + 1]]),
    [pendingPath.at(-1), commitNode], [invalidatedPath.at(-1), commitNode],
  ],
  branch_selector: 'selected_terminal_outcome_activates_exactly_one_of_pending_delivery_or_invalidated_before_use_and_no_node_from_the_other_branch',
  pending_delivery_branch: { entry_node: pendingPath[0], exit_node: pendingPath.at(-1), outbox_rule: 'assemble_exactly_one_outbox_genesis_bound_to_selected_schema_and_universal_result_fingerprint' },
  invalidated_before_use_branch: { entry_node: invalidatedPath[0], exit_node: invalidatedPath.at(-1), outbox_rule: 'assert_zero_outbox_origin_effect_creation_or_transition_rows' },
  only_rejoin_node: commitNode,
  result_payload_may_depend_on: ['terminal_consumption_ref', 'terminal_precommit_fingerprint'],
  result_payload_must_not_depend_on: ['terminal_consumption_fingerprint', 'row_envelope_fingerprint'],
  terminal_semantic_fingerprint_depends_on: ['terminal_precommit_fingerprint', 'terminal_result_schema_version', 'terminal_result_fingerprint', 'terminal_result_branch'],
  acyclic_and_complete: true,
}

bumpChangedSchemas()
for (const name of r21.operation_names) {
  r21.operation_specs[name].result_schema = r21.result_payload_schemas[name].schema_version
  r21.evaluator_abi.operation_result_exports[name] = r21.result_payload_schemas[name].schema_version
}
replaceProperties(r21.evaluator_abi.operation_result_exports_schema, Object.fromEntries(r21.operation_names.map(name => [name, { const: r21.result_payload_schemas[name].schema_version }])))
const finalUseRelease = r21.result_payload_schemas.use_release
r21.operation_result_schema_derivation.discriminated_results.use_release = {
  exported_union_schema_version: finalUseRelease.schema_version, discriminator: finalUseRelease.discriminator,
  variants: Object.fromEntries(Object.entries(finalUseRelease.variants).map(([name, schema]) => [name, schema.schema_version])),
}
bumpChangedSchemas(); repairEmbeddedSelfVersions(); bumpChangedSchemas()
const beforeNodes = schemaNodes(frozenR20)
const changes = []
for (const [path, after] of schemaNodes(r21)) {
  const before = beforeNodes.get(path)
  if (!before || before.schema_version !== after.schema_version || withoutVersion(before) !== withoutVersion(after)) {
    if (!after.schema_version.includes('.r21.')) throw new Error(`changed_schema_without_r21_version:${path}:${after.schema_version}`)
    if (before && before.schema_version === after.schema_version) throw new Error(`changed_schema_without_version_bump:${path}`)
    changes.push({ path, prior_version: before?.schema_version ?? null, current_version: after.schema_version })
  }
}
r21.schema_change_manifest = {
  derivation: 'recursive_exact_object_comparison_excluding_only_schema_version_between_frozen_R20_and_materialized_R21_plus_current_result_inventory_exact_held_schemas_session_authority_typed_holds_and_branch_complete_release_DAG',
  changes, every_changed_or_new_schema_must_have_r21_version: true,
  dependency_parity_checks: [
    'use_release_result_inventory_equals_the_exact_current_exported_union_and_both_branch_schema_versions',
    'held_and_replayed_held_have_exact_object_schemas_and_committed_hold_row_blob_and_replay_bind_the_held_schema',
    'server_session_issuer_evaluator_account_actor_access_standing_and_session_evidence_are_closed_current_fingerprinted_rows',
    'session_replay_and_fresh_mutation_use_exact_branch_equalities_one_serializable_snapshot_and_compare_and_swap_or_fail_closed',
    'every_case_hold_reason_selects_one_closed_typed_input_exact_sentinel_availability_encoding_and_domain_separated_fingerprint',
    'release_issuance_branches_after_outcome_selection_with_one_pending_outbox_or_explicit_invalidated_no_outbox_and_rejoins_only_at_commit',
  ],
}
r21.required_negative_fixture_families = [...new Set([...r21.required_negative_fixture_families,
  'current_use_release_result_schema_inventory', 'exact_held_and_replayed_held_response_schemas',
  'closed_server_session_and_revocation_authority', 'same_snapshot_session_and_case_control_cas',
  'typed_case_hold_inputs_and_exact_unavailable_sentinel', 'branch_complete_release_outbox_dag',
])]
r21.claim_limit = 'unimplemented_local_effective_contract_only'
assertSerializable(r21)
export const materializedR21 = r21
export const materializedR21Output = `${JSON.stringify(r21, null, 2)}\n`
export const materializedR21Path = outputPath
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2]
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR21Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR21Output) process.exitCode = 1; else console.log(`ok: ${outputPath} is the exact fully materialized R21 effective contract`) }
  else process.stdout.write(materializedR21Output)
}
