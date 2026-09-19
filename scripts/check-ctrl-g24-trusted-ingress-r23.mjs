import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR23, materializedR23Output } from './materialize-ctrl-g24-trusted-ingress-r23.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r23.json'
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []
const resolveRef = (contract, path) => path.split('.').reduce((value, key) => value?.[key], contract)
const exactClosed = schema => {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
function codepointCompare(a, b) { const aa = [...a], bb = [...b]; for (let i = 0; i < Math.min(aa.length, bb.length); i += 1) { const d = aa[i].codePointAt(0) - bb[i].codePointAt(0); if (d) return d } return aa.length - bb.length }
function canonicalJson(value) {
  if (value === null) return 'null'
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort(codepointCompare).map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  throw new Error('noncanonical')
}
const digest = value => createHash('sha256').update(Buffer.from(canonicalJson(value), 'utf8')).digest('hex')
function reverseObjectOrder(value) {
  if (Array.isArray(value)) return value.map(reverseObjectOrder)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).reverse().map(key => [key, reverseObjectOrder(value[key])]))
}

const stores = ['case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const operationsByStore = {
  case_session_issuer_registry: ['issue_case_session_issuer', 'revoke_case_session_issuer'],
  case_session_evaluator_registry: ['issue_case_session_evaluator', 'revoke_case_session_evaluator'],
  account_stable_actor_bindings: ['issue_account_actor_binding', 'rotate_account_actor_binding', 'offboard_account_actor_binding'],
  account_access_standings: ['issue_account_access_standing', 'revoke_account_access', 'offboard_account_access', 'restore_account_access'],
  case_server_session_principal_evidence: ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal'],
}
const allOperations = ['bootstrap_case_session_root_anchor', 'rotate_case_session_root_anchor', ...stores.flatMap(store => operationsByStore[store])]
const expectedStanding = {
  case_session_issuer_registry: ['active', 'revoked'], case_session_evaluator_registry: ['active', 'revoked'],
  account_stable_actor_bindings: ['active', 'offboarded'], account_access_standings: ['active', 'revoked', 'offboarded'],
  case_server_session_principal_evidence: ['active', 'revoked', 'expired'],
}
const dependencyExpected = {
  session_actor: ['server_presented_principal_projection.stable_actor_ref', 'server_presented_principal_projection_schema.properties.stable_actor_ref', 'identifier', 'canonical_field_codecs.identifier'],
  workspace: ['case_authority_control_request.workspace_ref', 'case_authority_control_plane.request_schema.properties.workspace_ref', 'identifier', 'canonical_field_codecs.identifier'],
  subject: ['case_authority_control_request.subject_ref', 'case_authority_control_plane.request_schema.properties.subject_ref', 'identifier', 'canonical_field_codecs.identifier'],
  case: ['case_authority_control_request.case_ref', 'case_authority_control_plane.request_schema.properties.case_ref', 'identifier', 'canonical_field_codecs.identifier'],
  control_operation_id: ['case_authority_control_request.control_operation_id', 'case_authority_control_plane.request_schema.properties.control_operation_id', 'identifier', 'canonical_field_codecs.identifier'],
  request_fingerprint: ['case_authority_control_request.request_fingerprint', 'case_authority_control_plane.request_schema.properties.request_fingerprint', 'sha256', 'canonical_field_codecs.sha256_raw_32_bytes'],
}

function collect(c) {
  const out = []
  const ok = (name, value) => { if (!value) out.push(name) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r23.effective.v1' && c.materialization?.frozen_input?.sha256 === 'd7a4907da81bdb1a042bbba8f480e6fc70f13b7b317ab90ed8d784912ad6f8d7')
  ok('public ABI preserved', c.operation_names.length === 20 && c.operation_names.every(name => c.operation_specs[name].result_schema === c.result_payload_schemas[name].schema_version && c.evaluator_abi.operation_result_exports[name] === c.result_payload_schemas[name].schema_version))

  const config = c.deployment_trust_configuration_schema
  const rootRow = c.authoritative_row_schemas.case_session_root_trust_anchors
  const rootAuth = c.case_session_root_trust_anchor_authority
  ok('deployment trust config closed external', exactClosed(config) && same(config.caller_controlled_fields, []) && config.source.includes('outside_the_authority_stores') && ['pinned_root_anchor_ref', 'pinned_root_anchor_version_ref', 'pinned_root_anchor_artifact_sha256', 'pinned_runtime_attestor_ref', 'pinned_runtime_attestor_version', 'pinned_runtime_attestor_artifact_sha256'].every(key => config.properties[key]))
  ok('root singleton authoritative', exactClosed(rootRow) && rootRow.properties.root_partition.const === 'case_session_root' && same(rootRow.partition_key, ['root_partition']) && same(rootRow.unique_keys, [['root_partition', 'row_version_ref']]) && rootRow.current_selection.includes('deployment_configuration_digest_equals_the_pinned_runtime_configuration') && rootRow.current_selection_unique_or_hold === true && rootRow.unique_current_constraint.includes('exactly_one_active_row_per_root_partition') && rootRow.properties.trust_anchor_artifact_sha256 && rootRow.properties.deployment_configuration_sha256 && rootRow.fingerprint_ref === 'fingerprint_schemas.case_session_root_trust_anchor')
  ok('root fingerprint externally bound and acyclic', c.fingerprint_schemas.case_session_root_trust_anchor.preimage_order.includes('trust_anchor_artifact_sha256') && c.fingerprint_schemas.case_session_root_trust_anchor.preimage_order.includes('deployment_configuration_sha256') && !c.fingerprint_schemas.case_session_root_trust_anchor.preimage_order.includes('anchor_fingerprint'))
  ok('root authority not self-authenticating', rootAuth.row_schema_ref === 'authoritative_row_schemas.case_session_root_trust_anchors' && rootAuth.externally_pinned_identity.includes('deployment_trust_configuration') && rootAuth.caller_controlled === false && rootAuth.sole_writer_role === 'ctrl_offline_root_anchor_ceremony_writer' && rootAuth.direct_dml_by_runtime_application_browser_edge_worker_service_or_caller === 'forbidden' && rootAuth.bootstrap_proof.includes('two_person_offline_ceremony_signature') && rootAuth.rotation.includes('idempotency_and_serializable_CAS') && rootAuth.rollback_safety.includes('one_transaction_or_no_change') && rootAuth.self_authentication === 'forbidden' && !c.case_session_root_trust_anchor_schema)

  const protocols = c.case_session_authority_operation_protocols
  ok('authority operation inventory exact', same(protocols.exact_operation_names, allOperations) && same(Object.keys(protocols.operations), allOperations) && protocols.concurrent_first_use.includes('replay_or_collision'))
  const requestBytes = [], receiptBytes = [], versionTokens = new Set(), fingerprintDomains = new Set()
  let protocolsValid = true
  for (const name of allOperations) {
    const p = protocols.operations[name]
    const slug = name.replaceAll('_', '-')
    if (!p || !exactClosed(p.request_schema) || !exactClosed(p.receipt_schema) || p.result_schema?.discriminator !== 'branch' || !same(Object.keys(p.result_schema?.variants ?? {}), ['committed', 'replayed', 'collision_hold', 'authority_hold', 'cas_hold']) || !Object.values(p.result_schema.variants).every(exactClosed)) { protocolsValid = false; continue }
    if (p.request_schema.properties.operation_name.const !== name || p.receipt_schema.properties.operation_name.const !== name || !Object.values(p.result_schema.variants).every(schema => schema.properties.operation_name.const === name) || !p.request_schema.schema_version.includes(slug) || !p.receipt_schema.schema_version.includes(slug) || !p.result_schema.schema_version.includes(slug)) protocolsValid = false
    if (!p.request_schema.properties.operation_id || !p.request_schema.properties.idempotency_key || !p.request_schema.properties.authenticated_capability_or_root_proof || !p.request_schema.properties.target_row_canonical_b64url || !p.request_schema.properties.target_row_fingerprint || !p.request_schema.properties.expected_prior_row_version_ref || !p.request_schema.properties.expected_prior_row_fingerprint) protocolsValid = false
    if (!p.receipt_schema.properties.server_committed_at || !p.receipt_schema.properties.receipt_fingerprint || !p.replay.includes('same_operation_id_and_request_fingerprint') || !p.collision.includes('different_request_fingerprint') || !p.atomic_postcondition.includes('together_or_neither')) protocolsValid = false
    requestBytes.push(canonicalJson(p.request_schema)); receiptBytes.push(canonicalJson(p.receipt_schema)); versionTokens.add(p.request_schema.schema_version); fingerprintDomains.add(p.request_fingerprint.domain_ascii); fingerprintDomains.add(p.receipt_fingerprint.domain_ascii)
  }
  ok('authority operation schemas closed distinct', protocolsValid && new Set(requestBytes).size === allOperations.length && new Set(receiptBytes).size === allOperations.length && versionTokens.size === allOperations.length && fingerprintDomains.size === allOperations.length * 2 && protocols.distinctness.includes('no_two_request_or_receipt_schemas_are_byte_identical'))
  ok('root bootstrap and rotation are executable', protocols.operations.bootstrap_case_session_root_anchor?.capability_source === 'offline_root_ceremony_proof' && protocols.operations.rotate_case_session_root_anchor?.capability_source === 'offline_root_ceremony_proof' && protocols.operations.rotate_case_session_root_anchor?.request_schema?.properties?.expected_prior_row_fingerprint && c.case_session_authority_transition_tables.case_session_root_trust_anchors.rows[0].from === 'absent' && c.case_session_authority_transition_tables.case_session_root_trust_anchors.rows[1].to === 'active_and_prior_revoked_atomically')

  ok('all authority rows have explicit standing', stores.every(store => {
    const row = c.authoritative_row_schemas[store]
    const field = store === 'case_server_session_principal_evidence' ? 'session_standing' : 'standing'
    return same(row.properties[field]?.values, expectedStanding[store]) && row.standing_field === field && row.current_row_requires_standing === 'active' && row.current_selection.includes('standing_active') && row.transition_table_ref === `case_session_authority_transition_tables.${store}`
  }))
  ok('transition tables exact and make prior noncurrent', stores.every(store => {
    const table = c.case_session_authority_transition_tables[store]
    const field = store === 'case_server_session_principal_evidence' ? 'session_standing' : 'standing'
    return table.standing_field === field && same(table.standing_values, expectedStanding[store]) && same(table.rows.map(row => row.operation_name), operationsByStore[store]) && table.first_matching_operation_only === true && table.prior_active_row_is_noncurrent_immediately_after_successful_transition === true && table.rows.every(row => row.append_only === true && row.prior_active_row_becomes_current === false) && new Set(table.rows.map(row => canonicalJson(row))).size === table.rows.length
  }))
  ok('revoke restore are not identical', canonicalJson(protocols.operations.revoke_account_access) !== canonicalJson(protocols.operations.restore_account_access) && c.case_session_authority_transition_tables.account_access_standings.rows.find(row => row.operation_name === 'revoke_account_access').to === 'revoked' && c.case_session_authority_transition_tables.account_access_standings.rows.find(row => row.operation_name === 'restore_account_access').to === 'active')
  ok('true trust joins retained', c.case_session_authority_store_controls.trusted_joins.length === 5 && c.case_session_authority_store_controls.trusted_joins.some(rule => rule.includes('account_binding.issuer_ref_version_and_artifact_sha256')) && c.case_session_authority_store_controls.trusted_joins.some(rule => rule.includes('account_standing.issuer_ref_version_and_artifact_sha256')) && c.case_session_authority_store_controls.trusted_joins.some(rule => rule.includes('session_evidence.issuer_and_evaluator')))

  const live = c.live_principal_assertion_schema
  const liveVerify = c.live_principal_assertion_verification
  ok('live assertion closed independent', exactClosed(live) && same(live.caller_controlled_fields, []) && live.source === 'independently_authenticated_server_auth_boundary' && live.fingerprint_field === 'canonical_assertion_bytes_sha256' && live.fingerprint_field_must_equal_referenced_preimage_digest === true && !c.fingerprint_schemas.live_principal_assertion.preimage_order.includes('canonical_assertion_bytes_sha256') && !c.fingerprint_schemas.live_principal_assertion.preimage_order.includes('trusted_runtime_attestation_b64url'))
  ok('live assertion complete', ['server_auth_boundary_ref', 'runtime_attestor_version', 'runtime_attestor_artifact_sha256', 'session_ref', 'session_instance_hash', 'workspace_ref', 'account_ref', 'stable_actor_ref', 'principal_kind', 'actor_class', 'authority_version', 'issued_at', 'expires_at', 'trusted_runtime_attestation_b64url'].every(key => live.properties[key]))
  ok('live assertion externally verified not circular', liveVerify.trusted_attestor_source.includes('deployment_trust_configuration.pinned_runtime_attestor') && liveVerify.derivation_from_durable_session_evidence === 'forbidden' && liveVerify.signature_verification.includes('before_any_durable_evidence_lookup') && liveVerify.exact_joins.length === 3 && liveVerify.exact_joins[0].includes('session_evidence') && liveVerify.exact_joins[1].includes('presented_projection') && liveVerify.exact_joins[2].includes('request.workspace_ref_equals_current_case.workspace_ref') && liveVerify.failure.startsWith('hold_without'))
  ok('projection requires live assertion', c.server_presented_principal_projection_derivation.independent_live_assertion_schema_ref === 'live_principal_assertion_schema' && c.server_presented_principal_projection_derivation.independent_live_assertion_verification_ref === 'live_principal_assertion_verification')

  const readSet = c.case_session_authority_read_set_schema
  const receipt = c.case_authority_control_operation_registry.row_schema
  const audit = c.case_authority_control_receipt_authority_audit
  const scopeFields = ['root_partition', 'workspace_ref', 'account_ref', 'session_ref', 'session_instance_hash', 'case_ref']
  const artifacts = ['live_principal_assertion_bytes_ref', 'live_principal_assertion_bytes_sha256', 'presented_principal_projection_bytes_ref', 'presented_principal_projection_bytes_sha256']
  ok('restart read set complete and fingerprinted', exactClosed(readSet) && [...scopeFields, ...artifacts].every(key => readSet.properties[key] && c.fingerprint_schemas.case_session_authority_read_set.preimage_order.includes(key)) && readSet.properties.root_partition.const === 'case_session_root')
  ok('receipt persists complete read set', receipt.properties.authority_read_set?.schema_ref === 'case_session_authority_read_set_schema' && c.fingerprint_schemas.case_authority_control_receipt.preimage_order.includes('authority_read_set') && c.fingerprint_schemas.case_authority_control_receipt.preimage_order.includes('authority_snapshot_fingerprint'))
  ok('restart rehydration exact', same(audit.content_addressed_artifacts, ['live_principal_assertion_bytes_ref_and_sha256', 'presented_principal_projection_bytes_ref_and_sha256']) && same(audit.composite_lookup_keys, [['root_partition'], ['workspace_ref', 'account_ref'], ['workspace_ref', 'session_ref'], ['workspace_ref', 'session_instance_hash'], ['workspace_ref', 'case_ref']]) && audit.restart_rule.includes('resolve_exact_composite_keys_and_content_addressed_bytes') && audit.restart_rule.includes('hold_without_response_or_write'))

  const codecSchema = c.canonical_field_codec_definition_schema
  const codecs = c.canonical_field_codecs
  ok('codec registry closed resolvable', exactClosed(codecSchema) && codecs.definition_schema_ref === 'canonical_field_codec_definition_schema' && ['identifier', 'sha256_raw_32_bytes'].every(name => {
    const codec = codecs[name]
    return same(Object.keys(codec), codecSchema.exact_keys) && codec.schema_version.includes('.r23.') && codec.output_type === 'base64url_without_padding' && codec.rejection_rule === 'reject'
  }))
  ok('hold dependency refs recursively resolve', c.case_authority_control_hold_dependency_projection_map.every_codec_ref_must_resolve_to_closed_versioned_definition === true && Object.entries(dependencyExpected).every(([name, expected]) => {
    const item = c.case_authority_control_hold_dependency_projection_map.dependencies[name]
    return same([item.source_path, item.source_schema_ref, item.scalar_type, item.canonical_encoding], expected) && resolveRef(c, item.source_schema_ref) && resolveRef(c, item.canonical_encoding)
  }))
  const sampleHex = '00'.repeat(32)
  const identifierEncoding = Buffer.from(sampleHex, 'utf8').toString('base64url')
  const rawDigestEncoding = Buffer.from(sampleHex, 'hex').toString('base64url')
  ok('identifier and raw sha codecs diverge', identifierEncoding !== rawDigestEncoding && codecs.identifier.encoder.includes('UTF8_bytes') && codecs.sha256_raw_32_bytes.encoder.includes('32_raw_bytes') && codecs.sha256_raw_32_bytes.encoder.includes('64_lowercase_hex'))

  const serialization = c.canonical_schema_serialization
  ok('canonical schema grammar exact', serialization.encoding === 'UTF-8' && serialization.object_keys === 'ascending_Unicode_code_point_sequence' && serialization.array_rule.includes('preserve_declared_order') && serialization.string_rule.includes('RFC8259') && serialization.number_rule.includes('finite_JSON_number_only') && serialization.whitespace === 'none' && serialization.duplicate_keys_nonfinite_undefined_or_surrogate_error === 'reject')
  const release = c.result_payload_schemas.use_release
  const inventory = c.operation_result_schema_derivation.discriminated_results.use_release
  ok('schema digest insertion order independent', digest(release) === digest(reverseObjectOrder(release)) && inventory.exported_union.canonical_schema_sha256 === digest(release))
  ok('schema union and variants exact', inventory.exported_union.schema_ref === 'result_payload_schemas.use_release' && inventory.exported_union.canonical_schema_serialization_ref === 'canonical_schema_serialization' && same(Object.keys(inventory.variants), Object.keys(release.variants)) && Object.entries(inventory.variants).every(([name, identity]) => identity.schema_ref === `result_payload_schemas.use_release.variants.${name}` && identity.schema_version === release.variants[name].schema_version && identity.canonical_schema_sha256 === digest(release.variants[name])))

  ok('universal result binds selected schema digest', c.fingerprint_schemas.operation_result_payload.preimage_order.includes('selected_result_schema_sha256') && c.fingerprint_schemas.operation_result_payload.domain_ascii === 'CTRL-G24-OPERATION-RESULT-PAYLOAD-R23')
  ok('success blob response replay retain schema digest', [c.operation_registry.committed_success_row_schema, c.operation_result_blob_store.row_schema, c.response_union.schemas.committed, c.response_union.schemas.replayed_committed].every(schema => schema.properties.selected_result_schema_sha256?.type === 'sha256') && c.operation_registry.committed_success_blob_derivation.exact_result_equalities.some(rule => rule.includes('selected_result_schema_sha256')) && c.operation_registry.committed_success_blob_derivation.decoded_response_field_equalities.some(rule => rule.includes('selected_result_schema_sha256')) && c.operation_registry.replayed_committed_derivation.exact_historical_equalities.some(rule => rule.includes('selected_result_schema_sha256')))
  const pending = c.outbox.pending_origin_schema
  ok('pending outbox origin exact digest authority', exactClosed(pending) && pending.properties.selected_result_schema_sha256?.type === 'sha256' && pending.properties.universal_result_payload_fingerprint?.type === 'sha256' && c.fingerprint_schemas.outbox_pending_origin.preimage_order.includes('selected_result_schema_sha256') && c.fingerprint_schemas.outbox_pending_origin.preimage_order.includes('universal_result_payload_fingerprint') && c.outbox.genesis_protocol.pending_origin_schema_ref === 'outbox.pending_origin_schema' && c.outbox.genesis_protocol.exact_equalities.some(rule => rule.includes('immutable_schema_digest_selected_at_commit')) && c.outbox.genesis_protocol.restart_rule.includes('verify_selected_schema_digest_and_universal_result_fingerprint'))
  ok('release terminal digest remains bound', c.authoritative_row_schemas.release_authority_terminal_consumptions.properties.terminal_result_schema_sha256?.type === 'sha256' && c.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.includes('terminal_result_schema_sha256'))
  ok('held replay operation equality exact', c.operation_registry.replayed_held_derivation.exact_historical_equalities[0] === 'replay.operation_id_equals_held.operation_id_equals_hold_row.operation_id_equals_hold_blob.operation_id' && c.operation_registry.replayed_held_derivation.only_fields_permitted_to_differ.length === 4)
  ok('R22 branch release strengths survive', c.release_terminal_issuance_dependency_dag.pending_delivery_branch.outbox_rule.includes('exactly_one_outbox') && c.release_terminal_issuance_dependency_dag.invalidated_before_use_branch.outbox_rule.includes('zero_outbox') && c.case_authority_control_hold_fingerprints.dependency_projection_map_ref === 'case_authority_control_hold_dependency_projection_map')
  ok('scope closed', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, []))
  ok('manifest', c.schema_change_manifest.derivation.includes('frozen_R22') && c.schema_change_manifest.dependency_parity_checks.length === 7)
  return out
}

if (read(machinePath) !== materializedR23Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r22.json') !== 'd7a4907da81bdb1a042bbba8f480e6fc70f13b7b317ab90ed8d784912ad6f8d7') failures.push('frozen R22 changed')
for (const failure of collect(materializedR23)) failures.push(failure)

const mutations = [
  ['root partition not singleton', c => { c.authoritative_row_schemas.case_session_root_trust_anchors.partition_key = ['trust_anchor_ref'] }],
  ['root unique key removed', c => { c.authoritative_row_schemas.case_session_root_trust_anchors.unique_keys = [] }],
  ['root current uniqueness removed', c => { c.authoritative_row_schemas.case_session_root_trust_anchors.current_selection_unique_or_hold = false }],
  ['root artifact removed', c => { delete c.authoritative_row_schemas.case_session_root_trust_anchors.properties.trust_anchor_artifact_sha256 }],
  ['root deployment digest removed', c => { delete c.authoritative_row_schemas.case_session_root_trust_anchors.properties.deployment_configuration_sha256 }],
  ['root becomes caller controlled', c => { c.case_session_root_trust_anchor_authority.caller_controlled = true }],
  ['root self authenticates', c => { c.case_session_root_trust_anchor_authority.self_authentication = 'allowed' }],
  ['root direct DML allowed', c => { c.case_session_root_trust_anchor_authority.direct_dml_by_runtime_application_browser_edge_worker_service_or_caller = 'allowed' }],
  ['root bootstrap loses ceremony proof', c => { c.case_session_root_trust_anchor_authority.bootstrap_proof = 'authenticated' }],
  ['root rotation loses CAS', c => { c.case_session_root_trust_anchor_authority.rotation = 'replace' }],
  ['bootstrap operation omitted', c => { delete c.case_session_authority_operation_protocols.operations.bootstrap_case_session_root_anchor }],
  ['operation request opened', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.request_schema.additional_properties = true }],
  ['operation loses idempotency', c => { delete c.case_session_authority_operation_protocols.operations.revoke_case_session_issuer.request_schema.properties.idempotency_key }],
  ['operation loses capability', c => { delete c.case_session_authority_operation_protocols.operations.issue_server_session_principal.request_schema.properties.authenticated_capability_or_root_proof }],
  ['operation result loses branch', c => { delete c.case_session_authority_operation_protocols.operations.offboard_account_access.result_schema.variants.cas_hold }],
  ['operation receipt loses server time', c => { delete c.case_session_authority_operation_protocols.operations.rotate_account_actor_binding.receipt_schema.properties.server_committed_at }],
  ['operation replay weakened', c => { c.case_session_authority_operation_protocols.operations.expire_server_session_principal.replay = 'rerun' }],
  ['operation atomicity weakened', c => { c.case_session_authority_operation_protocols.operations.revoke_server_session_principal.atomic_postcondition = 'eventual' }],
  ['revoke and restore byte identical', c => { c.case_session_authority_operation_protocols.operations.restore_account_access = structuredClone(c.case_session_authority_operation_protocols.operations.revoke_account_access) }],
  ['issuer standing removed', c => { delete c.authoritative_row_schemas.case_session_issuer_registry.properties.standing }],
  ['evaluator standing gains pending', c => { c.authoritative_row_schemas.case_session_evaluator_registry.properties.standing.values.push('pending') }],
  ['binding current ignores standing', c => { c.authoritative_row_schemas.account_stable_actor_bindings.current_selection = 'maximum_valid_from' }],
  ['session transition remains current', c => { c.case_session_authority_transition_tables.case_server_session_principal_evidence.prior_active_row_is_noncurrent_immediately_after_successful_transition = false }],
  ['restore equals revoke transition', c => { const rows = c.case_session_authority_transition_tables.account_access_standings.rows; rows.find(r => r.operation_name === 'restore_account_access').to = 'revoked' }],
  ['true issuer join removed', c => { c.case_session_authority_store_controls.trusted_joins = c.case_session_authority_store_controls.trusted_joins.filter(rule => !rule.includes('account_binding.issuer_ref_version_and_artifact_sha256')) }],
  ['live assertion caller controlled', c => { c.live_principal_assertion_schema.caller_controlled_fields = ['workspace_ref'] }],
  ['live assertion derived from durable evidence', c => { c.live_principal_assertion_verification.derivation_from_durable_session_evidence = 'allowed' }],
  ['live assertion circular verification', c => { c.live_principal_assertion_verification.signature_verification = 'verify_after_durable_evidence_lookup' }],
  ['live assertion attestor unpinned', c => { c.live_principal_assertion_verification.trusted_attestor_source = 'request.attestor' }],
  ['live to projection join removed', c => { c.live_principal_assertion_verification.exact_joins.splice(1, 1) }],
  ['live assertion self hash cycle', c => { c.fingerprint_schemas.live_principal_assertion.preimage_order.push('canonical_assertion_bytes_sha256') }],
  ['receipt workspace scope removed', c => { delete c.case_session_authority_read_set_schema.properties.workspace_ref }],
  ['receipt session hash removed', c => { delete c.case_session_authority_read_set_schema.properties.session_instance_hash }],
  ['receipt case scope unfingerprinted', c => { c.fingerprint_schemas.case_session_authority_read_set.preimage_order = c.fingerprint_schemas.case_session_authority_read_set.preimage_order.filter(k => k !== 'case_ref') }],
  ['live principal content ref removed', c => { delete c.case_session_authority_read_set_schema.properties.live_principal_assertion_bytes_ref }],
  ['projection content hash removed', c => { delete c.case_session_authority_read_set_schema.properties.presented_principal_projection_bytes_sha256 }],
  ['restart composite key removed', c => { c.case_authority_control_receipt_authority_audit.composite_lookup_keys.pop() }],
  ['restart artifacts removed', c => { c.case_authority_control_receipt_authority_audit.content_addressed_artifacts = [] }],
  ['codec ref unresolved', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.workspace.canonical_encoding = 'canonical_field_codecs.missing' }],
  ['codec definition opened', c => { c.canonical_field_codec_definition_schema.additional_properties = true }],
  ['sha uses identifier codec', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.request_fingerprint.canonical_encoding = 'canonical_field_codecs.identifier' }],
  ['identifier uses sha codec', c => { c.case_authority_control_hold_dependency_projection_map.dependencies.workspace.canonical_encoding = 'canonical_field_codecs.sha256_raw_32_bytes' }],
  ['sha codec accepts text', c => { c.canonical_field_codecs.sha256_raw_32_bytes.rejection_rule = 'accept' }],
  ['schema serialization uses insertion order', c => { c.canonical_schema_serialization.object_keys = 'insertion_order' }],
  ['schema array sorted', c => { c.canonical_schema_serialization.array_rule = 'sort' }],
  ['union digest insertion ordered', c => { c.operation_result_schema_derivation.discriminated_results.use_release.exported_union.canonical_schema_sha256 = createHash('sha256').update(JSON.stringify(c.result_payload_schemas.use_release)).digest('hex') }],
  ['same version standing semantic mutation', c => { c.result_payload_schemas.use_release.variants.pending_delivery.properties.standing.const = 'invalidated_before_use' }],
  ['same version required field mutation', c => { c.result_payload_schemas.use_release.variants.pending_delivery.required.pop() }],
  ['universal result loses schema digest', c => { c.fingerprint_schemas.operation_result_payload.preimage_order = c.fingerprint_schemas.operation_result_payload.preimage_order.filter(k => k !== 'selected_result_schema_sha256') }],
  ['success loses schema digest', c => { delete c.operation_registry.committed_success_row_schema.properties.selected_result_schema_sha256 }],
  ['pending outbox loses schema digest', c => { delete c.outbox.pending_origin_schema.properties.selected_result_schema_sha256 }],
  ['pending outbox fingerprint loses schema digest', c => { c.fingerprint_schemas.outbox_pending_origin.preimage_order = c.fingerprint_schemas.outbox_pending_origin.preimage_order.filter(k => k !== 'selected_result_schema_sha256') }],
  ['pending outbox restart equality removed', c => { c.outbox.genesis_protocol.exact_equalities = c.outbox.genesis_protocol.exact_equalities.filter(rule => !rule.includes('immutable_schema_digest_selected_at_commit')) }],
  ['held replay operation equality removed', c => { c.operation_registry.replayed_held_derivation.exact_historical_equalities.shift() }],
  ['held replay operation substituted', c => { c.operation_registry.replayed_held_derivation.exact_historical_equalities[0] = 'replay.operation_class_equals_held.operation_class' }],
  ['visible surface opened', c => { c.visible_surface_changes.push('admin') }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR23)
  mutate(candidate)
  if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`)
}
if (failures.length) { console.error(`G24 trusted ingress R23 failed ${failures.length} check(s):`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R23 and ${mutations.length} mutation probes verified`)
console.log(`r23_machine_sha256=${sha(machinePath)}`)
