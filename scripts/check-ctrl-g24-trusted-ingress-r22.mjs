import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR22, materializedR22Output } from './materialize-ctrl-g24-trusted-ingress-r22.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r22.json'
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const digest = value => createHash('sha256').update(Buffer.from(JSON.stringify(value), 'utf8')).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []
const exactClosed = schema => {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
const resolve = (contract, path) => path.split('.').reduce((value, key) => value?.[key], contract)

const storeNames = ['case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const expectedTransitions = {
  case_session_issuer_registry: ['revoke_case_session_issuer'],
  case_session_evaluator_registry: ['revoke_case_session_evaluator'],
  account_stable_actor_bindings: ['rotate_account_actor_binding', 'offboard_account_actor_binding'],
  account_access_standings: ['revoke_account_access', 'offboard_account_access', 'restore_account_access'],
  case_server_session_principal_evidence: ['revoke_server_session_principal', 'expire_server_session_principal'],
}
const dependencySpecs = {
  session_actor: ['server_presented_principal_projection.stable_actor_ref', 'server_presented_principal_projection_schema.properties.stable_actor_ref', 'identifier', 'canonical_field_encoding.identifier'],
  workspace: ['case_authority_control_request.workspace_ref', 'case_authority_control_plane.request_schema.properties.workspace_ref', 'identifier', 'canonical_field_encoding.identifier'],
  subject: ['case_authority_control_request.subject_ref', 'case_authority_control_plane.request_schema.properties.subject_ref', 'identifier', 'canonical_field_encoding.identifier'],
  case: ['case_authority_control_request.case_ref', 'case_authority_control_plane.request_schema.properties.case_ref', 'identifier', 'canonical_field_encoding.identifier'],
  control_operation_id: ['case_authority_control_request.control_operation_id', 'case_authority_control_plane.request_schema.properties.control_operation_id', 'identifier', 'canonical_field_encoding.identifier'],
  request_fingerprint: ['case_authority_control_request.request_fingerprint', 'case_authority_control_plane.request_schema.properties.request_fingerprint', 'sha256', 'canonical_field_encoding.sha256_raw_32_bytes'],
}

function collect(c) {
  const out = []
  const ok = (name, value) => { if (!value) out.push(name) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r22.effective.v1' && c.materialization.frozen_input.sha256 === '25f783047ba0272cca05ca742aa856df5d485e7392bcc2ce66da351378ebdb9f')
  ok('public ABI preserved', c.operation_names.length === 20 && c.operation_names.every(name => c.operation_specs[name].result_schema === c.result_payload_schemas[name].schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name].schema_version))

  const principal = c.server_presented_principal_projection_schema
  const derivation = c.server_presented_principal_projection_derivation
  const human = c.principal_schemas.human_session
  ok('server principal closed noncaller', exactClosed(principal) && principal.schema_version === 'ctrl.g24.server-presented-principal-projection.r22.v1' && same(principal.caller_controlled_fields, []) && principal.fingerprint_ref === 'fingerprint_schemas.server_presented_principal_projection')
  ok('server principal complete', ['session_ref', 'session_instance_hash', 'workspace_ref', 'account_ref', 'stable_actor_ref', 'principal_kind', 'actor_class', 'authority_version', 'issued_at', 'expires_at', 'current_standing'].every(key => principal.properties[key]) && principal.properties.principal_kind.const === 'human_session' && principal.properties.current_standing.const === 'active')
  const requiredJoins = ['session_ref', 'session_instance_hash', 'workspace_ref', 'account_ref', 'stable_actor_ref', 'principal_kind', 'actor_class', 'authority_version', 'issued_at', 'current_standing']
  ok('server principal exact joins', derivation.source_schema_ref === 'authoritative_row_schemas.case_server_session_principal_evidence' && derivation.target_schema_ref === 'server_presented_principal_projection_schema' && derivation.principal_schema_ref === 'principal_schemas.human_session' && requiredJoins.every(token => derivation.exact_joins.some(rule => rule.includes(token))) && derivation.exact_joins.some(rule => rule.includes('request.workspace_ref_equals_current_case.workspace_ref')) && derivation.caller_supplied_projection_or_field === 'forbidden' && derivation.any_missing_duplicate_mismatch_or_cross_workspace_join.startsWith('fail_closed'))
  ok('human principal byte joins possible', human.properties.principal_kind.const === principal.properties.principal_kind.const && same(human.properties.actor_class.values, principal.properties.actor_class.values) && human.properties.stable_actor_ref.type === principal.properties.stable_actor_ref.type && human.properties.session_instance_hash.type === principal.properties.session_instance_hash.type && human.properties.authority_version.type === principal.properties.authority_version.type)
  const sessionRow = c.authoritative_row_schemas.case_server_session_principal_evidence
  ok('session hash scoped unique', sessionRow.unique_keys.some(key => same(key, ['workspace_ref', 'session_instance_hash', 'row_version_ref'])) && same(sessionRow.session_instance_current_partition, ['workspace_ref', 'session_instance_hash']))
  ok('actor derivation uses server projection', c.case_authority_control_session_actor_derivation.source === 'server_presented_principal_projection_schema' && c.case_authority_control_session_actor_derivation.caller_supplied_actor_field === 'forbidden' && c.case_authority_control_plane.server_presented_principal_projection_ref === 'server_presented_principal_projection_derivation')

  const controls = c.case_session_authority_store_controls
  ok('authority stores exact inventory', same(controls.store_keys, storeNames) && same(Object.keys(controls.stores), storeNames) && controls.store_control_schema_ref === 'case_session_authority_store_control_schema')
  ok('authority stores sole writer', storeNames.every(name => {
    const control = controls.stores[name]
    const row = c.authoritative_row_schemas[name]
    return same(Object.keys(control), controls.store_control_exact_keys) && control.sole_writer_role === 'ctrl_case_session_authority_writer' && control.direct_dml_by_application_browser_edge_worker_generic_service_or_caller === 'forbidden' && control.issuer_and_evaluator_self_appointment === 'forbidden' && control.append_only_transition_rows_only === true && control.issuance_operation && same(control.transition_operations, expectedTransitions[name]) && row.sole_writer_control_ref === `case_session_authority_store_controls.stores.${name}`
  }))
  ok('root trust anchor closed', exactClosed(c.case_session_root_trust_anchor_schema) && c.case_session_root_trust_anchor_schema.properties.root_authority_class.const === 'offline_case_session_root' && controls.bootstrap.includes('offline_root_trust_anchor') && controls.bootstrap.includes('cannot_be_created_by_any_runtime_issuer_or_evaluator'))
  ok('trusted joins complete', controls.trusted_joins.length === 5 && controls.trusted_joins.some(rule => rule.includes('account_binding.issuer_ref_version_and_artifact_sha256')) && controls.trusted_joins.some(rule => rule.includes('account_standing.issuer_ref_version_and_artifact_sha256')) && controls.trusted_joins.some(rule => rule.includes('session_evidence.issuer_and_evaluator')) && controls.revocation_and_offboarding_authority.includes('root_anchored_current_issuer'))
  ok('issuer evaluator cannot self appoint', c.authoritative_row_schemas.case_session_issuer_registry.properties.trust_anchor_ref && c.authoritative_row_schemas.case_session_evaluator_registry.properties.trust_anchor_ref && controls.stores.case_session_issuer_registry.issuance_authority === 'root_trust_anchor' && controls.stores.case_session_evaluator_registry.issuance_authority === 'root_trust_anchor')
  const operations = c.case_session_authority_operations
  const expectedOperationNames = storeNames.flatMap(name => [controls.stores[name].issuance_operation, ...controls.stores[name].transition_operations])
  ok('authority operations closed exhaustive', exactClosed(c.case_session_authority_operation_schema) && same(operations.exact_operation_names, expectedOperationNames) && same(Object.keys(operations.operations), expectedOperationNames) && operations.operation_schema_ref === 'case_session_authority_operation_schema' && storeNames.every(store => {
    const control = controls.stores[store]
    const issue = operations.operations[control.issuance_operation]
    const transitions = control.transition_operations.map(name => operations.operations[name])
    return issue?.target_store === store && issue.operation_kind === 'issue' && issue.authority_source === control.issuance_authority && issue.prior_current_row === 'absent_or_exact_compare_and_swap' && issue.effect === 'append_one_new_versioned_row_or_none' && transitions.every(operation => operation?.target_store === store && operation.operation_kind === 'transition' && operation.authority_source === control.issuance_authority && operation.prior_current_row === 'required_exact_ref_version_and_fingerprint_compare_and_swap' && operation.effect === 'append_one_new_versioned_standing_or_binding_row_or_none')
  }) && Object.values(operations.operations).every(operation => same(Object.keys(operation), c.case_session_authority_operation_schema.exact_keys)) && operations.transaction.includes('one_serializable_transaction') && operations.transaction.includes('compare_and_swap_or_no_row') && operations.direct_dml === 'forbidden')
  const snapshot = c.case_authority_control_session_snapshot
  ok('authority snapshot CAS complete', controls.same_transaction_snapshot_and_cas_ref === 'case_authority_control_session_snapshot' && controls.concurrent_revocation.includes('serializable_retry_then_hold_without_write') && ['current_root_trust_anchor', 'current_session_principal_evidence', 'current_session_issuer', 'current_session_evaluator', 'current_account_actor_binding', 'current_account_access_standing', 'current_case_authority_binding', 'current_operator_grants', 'current_workload_grants', 'server_presented_principal_projection', 'receipt_authority_read_set'].every(name => snapshot.controlling_rows.includes(name)) && snapshot.compare_and_swap_before_commit.includes('every_controlling_row_ref_version_fingerprint_and_standing'))

  const readSet = c.case_session_authority_read_set_schema
  const receipt = c.case_authority_control_operation_registry.row_schema
  ok('authority read set closed complete', exactClosed(readSet) && ['trust_anchor_ref', 'trust_anchor_version_ref', 'trust_anchor_fingerprint', 'server_presented_principal_fingerprint', 'session_evidence_ref', 'session_evidence_row_version_ref', 'session_evidence_fingerprint', 'issuer_ref', 'issuer_row_version_ref', 'issuer_registry_fingerprint', 'evaluator_ref', 'evaluator_row_version_ref', 'evaluator_registry_fingerprint', 'account_binding_ref', 'account_binding_row_version_ref', 'account_binding_fingerprint', 'account_standing_ref', 'account_standing_row_version_ref', 'account_standing_fingerprint', 'case_binding_ref', 'case_binding_row_version_ref', 'case_binding_fingerprint', 'operator_grant_set_seal', 'workload_grant_set_seal', 'snapshot_fingerprint'].every(key => readSet.properties[key]))
  ok('receipt persists and fingerprints read set', receipt.properties.authority_read_set?.schema_ref === 'case_session_authority_read_set_schema' && receipt.properties.server_presented_principal_fingerprint?.type === 'sha256' && receipt.properties.authority_snapshot_fingerprint?.type === 'sha256' && ['server_presented_principal_fingerprint', 'authority_read_set', 'authority_snapshot_fingerprint'].every(field => c.fingerprint_schemas.case_authority_control_receipt.preimage_order.includes(field)))
  const audit = c.case_authority_control_receipt_authority_audit
  ok('receipt rehydrate audit exact', audit.receipt_schema_ref === 'case_authority_control_operation_registry.row_schema' && audit.read_set_schema_ref === 'case_session_authority_read_set_schema' && audit.exact_rehydration.includes('recomputed_fingerprint') && audit.commit_rule.includes('same_serializable_transaction') && audit.commit_rule.includes('compare_and_swap_every_read_set_member') && audit.any_missing_duplicate_changed_revoked_offboarded_expired_or_mismatched_member.startsWith('hold_without'))

  const map = c.case_authority_control_hold_dependency_projection_map
  ok('hold dependency inventory exact', same(Object.keys(map.dependencies), Object.keys(dependencySpecs)) && Object.entries(dependencySpecs).every(([name, expected]) => {
    const value = map.dependencies[name]
    return same([value.source_path, value.source_schema_ref, value.scalar_type, value.canonical_encoding], expected) && value.availability_field === `${name}_available` && value.value_field === `${name}_value_or_sentinel_b64url`
  }))
  ok('hold alternate encoding forbidden', map.exact_projection_rule.includes('exact_source_path') && map.alternate_text_hex_identifier_raw_or_implementation_encoding === 'forbidden' && c.case_authority_control_hold_fingerprints.dependency_projection_map_ref === 'case_authority_control_hold_dependency_projection_map' && Object.values(c.case_authority_control_hold_input_schemas).every(schema => schema.dependency_projection_map_ref === 'case_authority_control_hold_dependency_projection_map'))

  const replayed = c.response_union.schemas.replayed_committed
  const committedReplay = c.operation_registry.replayed_committed_derivation
  const heldReplay = c.operation_registry.replayed_held_derivation
  ok('replayed committed exact schema', exactClosed(replayed) && replayed.schema_version === 'ctrl.g24.response.replayed-committed.r22.v1' && replayed.type === 'object' && committedReplay.replayed_response_schema_ref === 'response_union.schemas.replayed_committed' && committedReplay.schema_equality === 'replayed_response_validates_response_union.schemas.replayed_committed')
  ok('held replay historical fields exact', !('replayed_held_payload_bytes_equal_original' in c.response_union) && c.response_union.replayed_held_historical_field_equalities_ref === 'operation_registry.replayed_held_derivation.exact_historical_equalities' && heldReplay.exact_historical_equalities.length === 5 && same(heldReplay.only_fields_permitted_to_differ, ['status', 'replayed_at', 'historical_replay', 'current_standing']) && heldReplay.all_other_fields_must_equal_original_held_response === true)

  const inventory = c.operation_result_schema_derivation
  const release = inventory.discriminated_results.use_release
  const union = c.result_payload_schemas.use_release
  ok('result derivation versioned', inventory.schema_version === 'ctrl.g24.operation-result-schema-derivation.r22.v1' && inventory.inventory_exact_schema_equality.includes('exact_current_schema_object') && inventory.selected_schema_digest_rule.includes('selected_result_schema_sha256'))
  ok('release union digest exact', release.exported_union.schema_ref === 'result_payload_schemas.use_release' && release.exported_union.schema_version === union.schema_version && release.exported_union.canonical_schema_sha256 === digest(union) && release.exported_union.canonical_schema_encoding === 'canonical_json_utf8_with_declared_member_order')
  ok('release branch digests exact', same(Object.keys(release.variants), Object.keys(union.variants)) && Object.entries(release.variants).every(([name, identity]) => identity.schema_ref === `result_payload_schemas.use_release.variants.${name}` && identity.schema_version === union.variants[name].schema_version && identity.canonical_schema_sha256 === digest(union.variants[name])))
  ok('selected schema digest propagated', [c.operation_registry.committed_success_row_schema, c.operation_result_blob_store.row_schema, c.response_union.schemas.committed, c.response_union.schemas.replayed_committed].every(schema => schema.properties.selected_result_schema_sha256?.type === 'sha256') && c.operation_registry.committed_success_blob_derivation.exact_result_equalities.some(rule => rule.includes('selected_result_schema_sha256')) && c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.some(rule => rule.includes('selected_result_schema_sha256')) && c.operation_registry.replayed_committed_derivation.exact_historical_equalities.some(rule => rule.includes('selected_result_schema_sha256')))
  ok('release terminal and outbox digest propagated', c.authoritative_row_schemas.release_authority_terminal_consumptions.properties.terminal_result_schema_sha256?.type === 'sha256' && c.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.includes('terminal_result_schema_sha256') && c.authoritative_row_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.includes('terminal_result_schema_sha256') && c.release_terminal_consumption_derivation.exact_equalities.some(rule => rule.includes('terminal_result_schema_sha256')) && c.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.selected_result_schema_sha256_ref?.includes('canonical_schema_sha256'))

  ok('R21 release DAG preserved', c.release_terminal_issuance_dependency_dag.schema_version === 'ctrl.g24.release-terminal-issuance-dag.r21.v1' && c.release_terminal_issuance_dependency_dag.invalidated_before_use_branch.outbox_rule.includes('zero_outbox') && c.release_terminal_issuance_dependency_dag.pending_delivery_branch.outbox_rule.includes('exactly_one_outbox'))
  ok('scope remains closed', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, []) && ['adapter_implementation', 'database_change', 'runtime_connection', 'UI_change', 'deployment', 'merge', 'release', 'external_action'].every(action => c.closed_actions.includes(action)))
  ok('manifest', c.schema_change_manifest.derivation.includes('frozen_R21') && c.schema_change_manifest.dependency_parity_checks.length === 6)
  return out
}

if (read(machinePath) !== materializedR22Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r21.json') !== '25f783047ba0272cca05ca742aa856df5d485e7392bcc2ce66da351378ebdb9f') failures.push('frozen R21 changed')
for (const failure of collect(materializedR22)) failures.push(failure)

const mutations = [
  ['caller controls principal', c => { c.server_presented_principal_projection_schema.caller_controlled_fields = ['workspace_ref'] }],
  ['principal session hash detached', c => { c.server_presented_principal_projection_derivation.exact_joins = c.server_presented_principal_projection_derivation.exact_joins.filter(rule => !rule.includes('session_instance_hash')) }],
  ['principal actor class detached', c => { c.server_presented_principal_projection_derivation.exact_joins = c.server_presented_principal_projection_derivation.exact_joins.filter(rule => !rule.includes('actor_class')) }],
  ['principal authority version detached', c => { c.server_presented_principal_projection_derivation.exact_joins = c.server_presented_principal_projection_derivation.exact_joins.filter(rule => !rule.includes('authority_version')) }],
  ['workspace confused deputy', c => { c.server_presented_principal_projection_derivation.exact_joins = c.server_presented_principal_projection_derivation.exact_joins.filter(rule => !rule.includes('request.workspace_ref_equals_current_case.workspace_ref')) }],
  ['session hash lookup unscoped', c => { c.authoritative_row_schemas.case_server_session_principal_evidence.session_instance_current_partition = ['session_instance_hash'] }],
  ['actor source caller', c => { c.case_authority_control_session_actor_derivation.source = 'request' }],
  ['store writer broadened', c => { c.case_session_authority_store_controls.stores.account_access_standings.sole_writer_role = 'generic_service' }],
  ['direct DML allowed', c => { c.case_session_authority_store_controls.stores.case_server_session_principal_evidence.direct_dml_by_application_browser_edge_worker_generic_service_or_caller = 'allowed' }],
  ['issuer self appoints', c => { c.case_session_authority_store_controls.stores.case_session_issuer_registry.issuer_and_evaluator_self_appointment = 'allowed' }],
  ['issuer loses root anchor', c => { delete c.authoritative_row_schemas.case_session_issuer_registry.properties.trust_anchor_ref }],
  ['account binding trust join removed', c => { c.case_session_authority_store_controls.trusted_joins = c.case_session_authority_store_controls.trusted_joins.filter(rule => !rule.includes('account_binding.issuer_ref_version_and_artifact_sha256')) }],
  ['account standing transition invented', c => { c.case_session_authority_store_controls.stores.account_access_standings.transition_operations.push('self_activate') }],
  ['authority operation omitted', c => { delete c.case_session_authority_operations.operations.revoke_account_access }],
  ['authority operation bypasses CAS', c => { c.case_session_authority_operations.operations.offboard_account_access.prior_current_row = 'none' }],
  ['revocation CAS weakened', c => { c.case_session_authority_store_controls.concurrent_revocation = 'continue' }],
  ['revocation read set omitted', c => { c.case_authority_control_session_snapshot.controlling_rows = c.case_authority_control_session_snapshot.controlling_rows.filter(name => name !== 'current_account_access_standing') }],
  ['receipt read set omitted', c => { delete c.case_authority_control_operation_registry.row_schema.properties.authority_read_set }],
  ['receipt read set unfingerprinted', c => { c.fingerprint_schemas.case_authority_control_receipt.preimage_order = c.fingerprint_schemas.case_authority_control_receipt.preimage_order.filter(field => field !== 'authority_read_set') }],
  ['read set account standing omitted', c => { delete c.case_session_authority_read_set_schema.properties.account_standing_fingerprint }],
  ['receipt rehydrate best effort', c => { c.case_authority_control_receipt_authority_audit.commit_rule = 'best_effort' }],
  ['hold dependency source changed', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.session_actor.source_path = 'request.actor' }],
  ['hold identifier encoded as raw hash', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.workspace.canonical_encoding = 'canonical_field_encoding.sha256_raw_32_bytes' }],
  ['hold sha encoded as identifier', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.request_fingerprint.canonical_encoding = 'canonical_field_encoding.identifier' }],
  ['hold scalar type changed', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.request_fingerprint.scalar_type = 'identifier' }],
  ['hold input map detached', c => { c.case_authority_control_hold_input_schemas.internal_failure_input.dependency_projection_map_ref = 'other' }],
  ['replayed committed unversioned', c => { delete c.response_union.schemas.replayed_committed.schema_version }],
  ['replayed committed wrong type', c => { c.response_union.schemas.replayed_committed.type = 'string' }],
  ['replayed committed schema ref detached', c => { c.operation_registry.replayed_committed_derivation.replayed_response_schema_ref = 'response_union.schemas.committed' }],
  ['held replay whole bytes restored', c => { c.response_union.replayed_held_payload_bytes_equal_original = true }],
  ['held replay historical field omitted', c => { c.operation_registry.replayed_held_derivation.exact_historical_equalities.pop() }],
  ['held replay extra mutable field', c => { c.operation_registry.replayed_held_derivation.only_fields_permitted_to_differ.push('hold_code') }],
  ['result derivation unversioned', c => { delete c.operation_result_schema_derivation.schema_version }],
  ['release union digest forged', c => { c.operation_result_schema_derivation.discriminated_results.use_release.exported_union.canonical_schema_sha256 = '0'.repeat(64) }],
  ['release branch schema ref forged', c => { c.operation_result_schema_derivation.discriminated_results.use_release.variants.pending_delivery.schema_ref = 'result_payload_schemas.use_release.variants.invalidated_before_use' }],
  ['same-version branch standing mutation', c => { c.result_payload_schemas.use_release.variants.pending_delivery.properties.standing.const = 'invalidated_before_use' }],
  ['same-version branch property mutation', c => { c.result_payload_schemas.use_release.variants.invalidated_before_use.properties.outbox_created.const = true }],
  ['selected digest absent from success', c => { delete c.operation_registry.committed_success_row_schema.properties.selected_result_schema_sha256 }],
  ['selected digest absent from response derivation', c => { c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities = c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.filter(rule => !rule.includes('selected_result_schema_sha256')) }],
  ['terminal digest unfingerprinted', c => { c.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order = c.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.filter(field => field !== 'terminal_result_schema_sha256') }],
  ['outbox digest lineage omitted', c => { delete c.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.selected_result_schema_sha256_ref }],
  ['visible surface opened', c => { c.visible_surface_changes.push('approval') }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR22)
  mutate(candidate)
  if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`)
}
if (failures.length) {
  console.error(`G24 trusted ingress R22 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R22 and ${mutations.length} mutation probes verified`)
console.log(`r22_machine_sha256=${sha(machinePath)}`)
