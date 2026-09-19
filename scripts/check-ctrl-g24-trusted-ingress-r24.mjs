import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR24, materializedR24Output } from './materialize-ctrl-g24-trusted-ingress-r24.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r24.json'
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const exactClosed = schema => schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, Object.keys(schema.properties)) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key)))
const failures = []
const authorityStores = ['case_session_root_trust_anchors', 'case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const requiredRoles = {
  bootstrap_case_session_root_anchor: 'root', issue_case_session_issuer: 'root', revoke_case_session_issuer: 'root',
  issue_case_session_evaluator: 'root', revoke_case_session_evaluator: 'root', issue_account_actor_binding: 'issuer',
  rotate_account_actor_binding: 'issuer', offboard_account_actor_binding: 'issuer', issue_account_access_standing: 'issuer',
  revoke_account_access: 'issuer', offboard_account_access: 'issuer', restore_account_access: 'issuer',
  issue_server_session_principal: 'evaluator', revoke_server_session_principal: 'evaluator', expire_server_session_principal: 'evaluator',
}
const expectedTransitions = {
  revoke_case_session_issuer: ['active', 'revoked'], revoke_case_session_evaluator: ['active', 'revoked'],
  offboard_account_actor_binding: ['active', 'offboarded'], revoke_account_access: ['active', 'revoked'],
  offboard_account_access: ['active', 'offboarded'], expire_server_session_principal: ['active', 'expired'],
}
function ok(label, condition) { if (!condition) throw new Error(label) }
function selectedLatest(rows) {
  const sorted = structuredClone(rows).sort((a, b) => a.valid_from.localeCompare(b.valid_from) || Buffer.from(a.row_version_ref).compare(Buffer.from(b.row_version_ref)))
  return sorted.at(-1)
}
function collect(c) {
  const out = []
  const test = (label, fn) => { try { fn() } catch (error) { out.push(`${label}: ${error.message}`) } }

  test('identity and scope', () => {
    ok('R24 root version', c.schema_version === 'ctrl.g24.trusted-ingress.r24.effective.v1')
    ok('frozen R23 identity', c.supersedes.commit === '6b490c0860edfa83142e28d1a8336abea07b3d2f' && c.materialization.frozen_input.sha256 === '4b191c1215fd0d7ea8a2d15ec8a42475e50ef88f0c24dcdba51c035a1da6b584')
    ok('scope closed', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, []))
  })

  test('latest row selected before authorization', () => {
    const protocol = c.append_only_current_selection_protocol
    ok('versioned protocol', protocol.schema_version === 'ctrl.g24.append-only-current-selection-protocol.r24.v1')
    ok('all stores mapped', same(Object.keys(protocol.stores), authorityStores))
    for (const store of authorityStores) {
      const row = c.authoritative_row_schemas[store]
      const selection = protocol.stores[store]
      ok(`${store} R24 row`, row.schema_version.includes('.r24.'))
      ok(`${store} partition`, same(selection.partition_fields, row.partition_key) && same(row.selection_partition_exact_fields, row.partition_key))
      ok(`${store} phase order`, selection.phase_1.includes('across_all_standings_and_all_effective_times') && selection.phase_2.includes('selected_latest_standing_equals_active'))
      ok(`${store} not prefiltered`, row.select_before_authorize === true && row.current_selection.startsWith('partition_all_rows_regardless_of_standing_or_time_then_select_unique'))
      ok(`${store} tie hold`, row.tie_duplicate_or_unavailable.includes('hold_without_authoritative_response_or_write'))
      ok(`${store} serializable CAS`, row.same_transaction_snapshot_and_cas.includes('one_serializable_snapshot') && row.same_transaction_snapshot_and_cas.includes('partition_tip'))
    }
    const history = [{ valid_from: '2026-01-01T00:00:00Z', row_version_ref: '1', standing: 'active' }, { valid_from: '2026-02-01T00:00:00Z', row_version_ref: '2', standing: 'revoked' }]
    ok('revoked history does not resurrect', selectedLatest(history).standing === 'revoked')
    history[1].standing = 'offboarded'; ok('offboarded history does not resurrect', selectedLatest(history).standing === 'offboarded')
    history[1].standing = 'expired'; ok('expired history does not resurrect', selectedLatest(history).standing === 'expired')
    ok('concrete tests present', protocol.concrete_transition_tests.length === 4 && protocol.same_transaction_cas.includes('compare_and_swap'))
  })

  test('immutable pinned root', () => {
    const row = c.authoritative_row_schemas.case_session_root_trust_anchors
    const auth = c.case_session_root_trust_anchor_authority
    ok('root exact pin', row.properties.standing.const === 'active' && row.exact_pinned_equalities.length === 6 && row.unique_current_constraint.includes('matching_all_pinned_equalities'))
    ok('root deterministic', auth.externally_pinned_identity.includes('deployment_trust_configuration') && auth.deterministic_selection.includes('one_exact_root_partition_row'))
    ok('root no rotation', auth.rotation_in_r24_or_active_adapter_scope === 'forbidden' && auth.rotation_request_result_or_transition.includes('future_separately_reviewed_staged_protocol'))
    ok('no rotation operation', !c.case_session_authority_operation_protocols.exact_operation_names.includes('rotate_case_session_root_anchor') && c.case_session_authority_operation_protocols.forbidden_operation_names.includes('rotate_case_session_root_anchor') && !c.case_session_authority_operation_protocols.operations.rotate_case_session_root_anchor)
    ok('no rotation transition', c.case_session_authority_transition_tables.case_session_root_trust_anchors.rotation_transition_present === false && c.case_session_authority_transition_tables.case_session_root_trust_anchors.rows.length === 1)
  })

  test('typed exact role proofs', () => {
    const proofs = [c.case_session_root_bootstrap_proof_schema, c.case_session_issuer_capability_proof_schema, c.case_session_evaluator_capability_proof_schema]
    ok('proofs closed', proofs.every(exactClosed))
    ok('proof versions', proofs.every(schema => schema.schema_version.includes('.r24.')))
    ok('proof core claims', proofs.every(schema => ['audience', 'scope' in schema.properties ? 'scope' : 'scope_operation_name', 'nonce', 'issued_at', 'expires_at', 'signature_algorithm', 'verifier_ref', 'verifier_version_ref', 'verifier_artifact_sha256', 'signature_b64url'].every(key => schema.properties[key])))
    ok('issuer evaluator distinct', c.case_session_issuer_capability_proof_schema.properties.authority_role.const === 'issuer' && c.case_session_evaluator_capability_proof_schema.properties.authority_role.const === 'evaluator')
    ok('verification exact', c.authority_proof_verification.ambiguous_issuer_or_evaluator === 'forbidden' && c.authority_proof_verification.verify_before_registry_lookup === true && c.authority_proof_verification.exact_checks.includes('current_authority_row_and_root_join'))
    const protocols = c.case_session_authority_operation_protocols
    ok('role map exact', same(protocols.exact_authority_role_by_operation, requiredRoles) && protocols.ambiguous_issuer_or_evaluator_authority === 'forbidden')
    for (const [name, role] of Object.entries(requiredRoles)) {
      const protocol = protocols.operations[name]
      ok(`${name} exact role`, protocol.exact_authority_role === role && protocol.authority_proof_schema_ref === c.authority_proof_verification.exact_schema_by_role[role])
      ok(`${name} proof request`, protocol.request_schema.properties.authority_proof_schema_ref.const === protocol.authority_proof_schema_ref)
    }
  })

  test('durable operation registry receipts and target transitions', () => {
    const registry = c.authority_operation_registry
    const receipts = c.authority_operation_receipt_store
    ok('registry closed', exactClosed(registry.row_schema) && registry.row_schema.schema_version.includes('.r24.'))
    ok('registry exact unique', registry.row_schema.unique_keys.some(key => same(key, ['target_store', 'operation_id', 'idempotency_key'])) && registry.row_schema.unique_keys.some(key => same(key, ['target_store', 'operation_id'])) && same(registry.restart_lookup, ['target_store', 'operation_id', 'idempotency_key']) && same(registry.collision_lookup, ['target_store', 'operation_id']))
    ok('registry immutable', registry.sole_writer === 'ctrl_case_session_authority_operation_executor' && registry.direct_dml === 'forbidden' && registry.transaction.includes('commit_atomically_or_none'))
    ok('registry full blobs', ['request_bytes_ref', 'request_bytes_sha256', 'target_row_bytes_ref', 'target_row_bytes_sha256', 'result_bytes_ref', 'result_bytes_sha256', 'receipt_ref', 'receipt_fingerprint'].every(key => registry.row_schema.properties[key]))
    ok('registry branch nullability', registry.row_schema.conditional_rules.some(rule => rule.startsWith('committed_or_replayed_requires_nonnull')) && registry.row_schema.conditional_rules.some(rule => rule.includes('hold_requires_null_receipt')))
    ok('receipt store closed', exactClosed(receipts.row_schema) && receipts.row_schema.schema_version.includes('.r24.') && receipts.row_schema.properties.result_branch.const === 'committed')
    ok('receipt exact unique', receipts.row_schema.unique_keys.some(key => same(key, ['target_store', 'operation_id', 'idempotency_key'])) && receipts.exact_equalities.length === 5 && receipts.restart_rule.includes('verify_every_hash_fingerprint_schema_partition_transition_and_equality'))
    for (const [name, protocol] of Object.entries(c.case_session_authority_operation_protocols.operations)) {
      ok(`${name} protocol version`, protocol.schema_version.includes('.r24.'))
      ok(`${name} request closed`, exactClosed(protocol.request_schema))
      ok(`${name} result complete`, same(protocol.result_schema.exact_variants, ['committed', 'replayed', 'collision_hold', 'authority_hold', 'cas_hold', 'target_hold']))
      ok(`${name} committed nonnullable`, exactClosed(protocol.result_schema.variants.committed) && protocol.result_schema.variants.committed.properties.receipt_ref.type === 'identifier')
      ok(`${name} target decoder`, protocol.target_decoder.schema_ref === `authoritative_row_schemas.${protocol.target_store}` && protocol.target_decoder.recompute_bytes_sha256 === true && protocol.target_decoder.recompute_row_fingerprint === true && protocol.target_decoder.reject_schema_partition_from_to_or_postcondition_mismatch === true)
      ok(`${name} immutable partition`, same(protocol.transition.immutable_partition_fields, c.authoritative_row_schemas[protocol.target_store].partition_key))
    }
    for (const [name, [from, to]] of Object.entries(expectedTransitions)) {
      const transition = c.case_session_authority_operation_protocols.operations[name].transition
      ok(`${name} standing`, transition.from_standing === from && transition.to_standing === to)
    }
  })

  test('restart artifacts and complete authority read set', () => {
    const stores = c.principal_authority_artifact_stores
    ok('artifact parent version', stores.schema_version.includes('.r24.'))
    for (const store of [stores.live_principal_assertions, stores.presented_principal_projections]) {
      ok('artifact row closed', exactClosed(store.row_schema) && store.row_schema.schema_version.includes('.r24.'))
      ok('artifact content addressed', store.row_schema.unique_keys.some(key => same(key, ['artifact_kind', 'canonical_bytes_sha256'])) && store.exact_resolution.includes('one_immutable_exact_canonical_blob'))
      ok('artifact writer retention', store.sole_writer === 'ctrl_server_auth_artifact_writer' && store.direct_dml === 'forbidden' && store.retention.includes('receipt'))
    }
    const readSet = c.case_session_authority_read_set_schema
    const fields = ['root_anchor_row_version_ref', 'deployment_configuration_ref', 'deployment_configuration_sha256', 'pinned_runtime_attestor_ref', 'pinned_runtime_attestor_version', 'pinned_runtime_attestor_artifact_sha256']
    ok('read set complete', readSet.schema_version.includes('.r24.') && fields.every(key => readSet.properties[key] && c.fingerprint_schemas.case_session_authority_read_set.preimage_order.includes(key)))
    const audit = c.case_authority_control_receipt_authority_audit
    ok('audit version', audit.schema_version.includes('.r24.'))
    ok('artifact stores referenced', same(audit.content_addressed_artifact_store_refs, ['principal_authority_artifact_stores.live_principal_assertions', 'principal_authority_artifact_stores.presented_principal_projections']))
    ok('root attestor snapshot complete', fields.every(key => audit.root_and_attestor_snapshot.includes(key)) && audit.restart_rule.includes('content_addressed_principal_artifacts'))
  })

  test('single authoritative outbox origin', () => {
    const origin = c.outbox.effect_origin_schema
    const genesis = c.outbox.genesis_protocol
    ok('no sidecar schema', !c.outbox.pending_origin_schema && !c.fingerprint_schemas.outbox_pending_origin && !genesis.pending_origin_schema_ref)
    ok('origin R24 digest', origin.schema_version === 'ctrl.g24.outbox-effect-origin.r24.v1' && origin.properties.selected_result_schema_sha256?.type === 'sha256')
    ok('origin fingerprint digest', c.fingerprint_schemas.outbox_effect_origin.domain_ascii === 'CTRL-G24-OUTBOX-EFFECT-ORIGIN-R24' && c.fingerprint_schemas.outbox_effect_origin.preimage_order.includes('selected_result_schema_sha256'))
    ok('genesis R24 single authority', genesis.schema_version === 'ctrl.g24.outbox-genesis-protocol.r24.v1' && genesis.sidecar_origin_authority === 'forbidden' && genesis.exact_equalities.some(rule => rule.startsWith('effect_origin.selected_result_schema_sha256')) && genesis.restart_rule.includes('single_effect_origin'))
    ok('no stale pending equality', !genesis.exact_equalities.some(rule => rule.startsWith('pending_origin.')))
  })

  test('version manifest and preserved boundaries', () => {
    const manifest = c.schema_change_manifest
    ok('manifest R24', manifest.schema_version === 'ctrl.g24.trusted-ingress-schema-change-manifest.r24.v1' && manifest.frozen_parent_sha256 === '4b191c1215fd0d7ea8a2d15ec8a42475e50ef88f0c24dcdba51c035a1da6b584')
    ok('changed projection bumped', c.server_presented_principal_projection_derivation.schema_version.includes('.r24.'))
    ok('changed hold map bumped', c.case_authority_control_hold_dependency_projection_map.schema_version.includes('.r24.'))
    ok('same version changes forbidden', manifest.every_changed_or_new_semantic_object_has_r24_identifier === true && manifest.same_version_semantic_change === 'forbidden')
  })
  return out
}

if (read(machinePath) !== materializedR24Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r23.json') !== '4b191c1215fd0d7ea8a2d15ec8a42475e50ef88f0c24dcdba51c035a1da6b584') failures.push('frozen R23 changed')
for (const failure of collect(materializedR24)) failures.push(failure)

const mutations = [
  ['revoked history selector prefilters active', c => { c.authoritative_row_schemas.account_access_standings.current_selection = 'where_standing_active_then_select_latest' }],
  ['revoked history protocol prefilters active', c => { c.append_only_current_selection_protocol.stores.account_access_standings.phase_1 = 'select_latest_active' }],
  ['offboarded transition missing concrete test', c => { c.append_only_current_selection_protocol.concrete_transition_tests = c.append_only_current_selection_protocol.concrete_transition_tests.filter(value => !value.includes('offboarded')) }],
  ['selector loses same transaction CAS', c => { c.authoritative_row_schemas.case_session_issuer_registry.same_transaction_snapshot_and_cas = 'eventual' }],
  ['selector loses partition tip CAS', c => { c.append_only_current_selection_protocol.same_transaction_cas = 'selected row only' }],
  ['selector tie accepts winner', c => { c.authoritative_row_schemas.case_session_evaluator_registry.tie_duplicate_or_unavailable = 'choose first' }],
  ['evaluator authorizes issuer operation', c => { c.case_session_authority_operation_protocols.operations.issue_account_actor_binding.exact_authority_role = 'evaluator' }],
  ['issuer proof attached to evaluator operation', c => { c.case_session_authority_operation_protocols.operations.issue_server_session_principal.authority_proof_schema_ref = 'case_session_issuer_capability_proof_schema' }],
  ['ambiguous issuer evaluator returns', c => { c.case_session_authority_operation_protocols.ambiguous_issuer_or_evaluator_authority = 'allowed' }],
  ['opaque proof accepted', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.request_schema.properties.authority_proof_schema_ref = { type: 'identifier' } }],
  ['proof loses expiry', c => { delete c.case_session_issuer_capability_proof_schema.properties.expires_at; c.case_session_issuer_capability_proof_schema.exact_keys = c.case_session_issuer_capability_proof_schema.exact_keys.filter(key => key !== 'expires_at'); c.case_session_issuer_capability_proof_schema.required = c.case_session_issuer_capability_proof_schema.required.filter(key => key !== 'expires_at') }],
  ['proof loses trusted join', c => { c.authority_proof_verification.exact_checks = c.authority_proof_verification.exact_checks.filter(value => value !== 'current_authority_row_and_root_join') }],
  ['root rotation operation restored', c => { c.case_session_authority_operation_protocols.operations.rotate_case_session_root_anchor = structuredClone(c.case_session_authority_operation_protocols.operations.bootstrap_case_session_root_anchor); c.case_session_authority_operation_protocols.exact_operation_names.push('rotate_case_session_root_anchor') }],
  ['root rotation allowed', c => { c.case_session_root_trust_anchor_authority.rotation_in_r24_or_active_adapter_scope = 'allowed' }],
  ['root pin equality removed', c => { c.authoritative_row_schemas.case_session_root_trust_anchors.exact_pinned_equalities.pop() }],
  ['root deterministic selection weakened', c => { c.case_session_root_trust_anchor_authority.deterministic_selection = 'latest active' }],
  ['operation registry removed', c => { delete c.authority_operation_registry }],
  ['registry ignores idempotency key', c => { c.authority_operation_registry.row_schema.unique_keys = [['target_store', 'operation_id']] }],
  ['restart ignores idempotency key', c => { c.authority_operation_registry.restart_lookup = ['target_store', 'operation_id'] }],
  ['registry collision lookup removed', c => { delete c.authority_operation_registry.collision_lookup }],
  ['registry request blob removed', c => { delete c.authority_operation_registry.row_schema.properties.request_bytes_ref }],
  ['registry conditional result removed', c => { c.authority_operation_registry.row_schema.conditional_rules = [] }],
  ['committed result receipt nullable', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.committed.properties.receipt_ref = { type: 'nullable', value_schema: { type: 'identifier' } } }],
  ['committed branch omitted', c => { delete c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.committed }],
  ['revoke target remains active', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.transition.to_standing = 'active' }],
  ['expire target remains active', c => { c.case_session_authority_operation_protocols.operations.expire_server_session_principal.transition.to_standing = 'active' }],
  ['target decoder skips bytes hash', c => { c.case_session_authority_operation_protocols.operations.offboard_account_access.target_decoder.recompute_bytes_sha256 = false }],
  ['target decoder skips partition', c => { c.case_session_authority_operation_protocols.operations.offboard_account_access.target_decoder.reject_schema_partition_from_to_or_postcondition_mismatch = false }],
  ['receipt store removed', c => { delete c.authority_operation_receipt_store }],
  ['receipt result branch open', c => { c.authority_operation_receipt_store.row_schema.properties.result_branch = { type: 'identifier' } }],
  ['receipt loses result equality', c => { c.authority_operation_receipt_store.exact_equalities = c.authority_operation_receipt_store.exact_equalities.filter(rule => !rule.startsWith('receipt_result_identity')) }],
  ['receipt restart skips fingerprint', c => { c.authority_operation_receipt_store.restart_rule = 'resolve blobs' }],
  ['live assertion artifact store missing', c => { delete c.principal_authority_artifact_stores.live_principal_assertions }],
  ['projection artifact store missing', c => { delete c.principal_authority_artifact_stores.presented_principal_projections }],
  ['artifact content lookup missing', c => { c.principal_authority_artifact_stores.live_principal_assertions.row_schema.unique_keys = [['artifact_ref']] }],
  ['artifact retention weak', c => { c.principal_authority_artifact_stores.presented_principal_projections.retention = 'temporary' }],
  ['read set root version removed', c => { delete c.case_session_authority_read_set_schema.properties.root_anchor_row_version_ref }],
  ['read set deployment digest unfingerprinted', c => { c.fingerprint_schemas.case_session_authority_read_set.preimage_order = c.fingerprint_schemas.case_session_authority_read_set.preimage_order.filter(key => key !== 'deployment_configuration_sha256') }],
  ['read set attestor snapshot removed', c => { delete c.case_session_authority_read_set_schema.properties.pinned_runtime_attestor_artifact_sha256 }],
  ['audit artifact store refs removed', c => { c.case_authority_control_receipt_authority_audit.content_addressed_artifact_store_refs = [] }],
  ['audit root attestor snapshot incomplete', c => { c.case_authority_control_receipt_authority_audit.root_and_attestor_snapshot.pop() }],
  ['old outbox origin omits schema digest', c => { delete c.outbox.effect_origin_schema.properties.selected_result_schema_sha256 }],
  ['old outbox fingerprint omits schema digest', c => { c.fingerprint_schemas.outbox_effect_origin.preimage_order = c.fingerprint_schemas.outbox_effect_origin.preimage_order.filter(key => key !== 'selected_result_schema_sha256') }],
  ['unattached sidecar restored', c => { c.outbox.pending_origin_schema = { schema_version: 'sidecar' } }],
  ['sidecar fingerprint restored', c => { c.fingerprint_schemas.outbox_pending_origin = { domain_ascii: 'SIDE' } }],
  ['genesis digest equality missing', c => { c.outbox.genesis_protocol.exact_equalities = c.outbox.genesis_protocol.exact_equalities.filter(rule => !rule.startsWith('effect_origin.selected_result_schema_sha256')) }],
  ['genesis restart still uses sidecar', c => { c.outbox.genesis_protocol.restart_rule = 'rehydrate_pending_origin' }],
  ['projection changed without R24 version', c => { c.server_presented_principal_projection_derivation.schema_version = 'ctrl.g24.server-presented-principal-projection-derivation.r22.v1' }],
  ['hold map changed without R24 version', c => { c.case_authority_control_hold_dependency_projection_map.schema_version = 'ctrl.g24.case-authority-control-hold-dependency-projection-map.r22.v1' }],
  ['issuer selector changed with R23 version', c => { c.authoritative_row_schemas.case_session_issuer_registry.schema_version = 'ctrl.g24.authoritative-row.case-session-issuer-registry.r23.v1' }],
  ['outbox changed with old version', c => { c.outbox.effect_origin_schema.schema_version = 'ctrl.g24.outbox-effect-origin.r20.v1' }],
  ['visible surface opened', c => { c.visible_surface_changes.push('authority receipts') }],
  ['external action opened', c => { c.external_actions_authorized.push('database') }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR24)
  mutate(candidate)
  if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`)
}
if (failures.length) {
  console.error(`G24 trusted ingress R24 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R24 and ${mutations.length} mutation probes verified`)
console.log(`r24_machine_sha256=${sha(machinePath)}`)
