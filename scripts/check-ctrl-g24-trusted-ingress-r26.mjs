import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR26, materializedR26Output } from './materialize-ctrl-g24-trusted-ingress-r26.mjs'

const root = process.cwd(), machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r26.json'
const read = path => readFileSync(join(root, path), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const closed = schema => schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, Object.keys(schema.properties)) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key)))
const stores = ['case_session_root_trust_anchors', 'case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const holds = ['collision_hold', 'authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const failures = []
function ok(label, condition) { if (!condition) throw new Error(label) }
function collect(c) {
  const out = [], test = (label, fn) => { try { fn() } catch (error) { out.push(`${label}: ${error.message}`) } }
  test('identity scope', () => { ok('R26', c.schema_version === 'ctrl.g24.trusted-ingress.r26.effective.v1'); ok('parent', c.supersedes.commit === 'd1033ec3feba099a50defa2c4f9b2db53e7f32bc' && c.materialization.frozen_input.sha256 === '8def0d4f99db236425f0b69a98f2987176d3dc5e6fad46594103b87579d716f5'); ok('closed', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, [])) })
  test('one exact authority order protocol', () => {
    ok('stale selector deleted', !c.append_only_current_selection_protocol)
    const p = c.authority_order_protocol, head = c.authority_partition_head_store
    ok('R26 protocols', p.schema_version.includes('.r26.') && head.schema_version.includes('.r26.') && head.row_schema.schema_version.includes('.r26.'))
    ok('head equivalence', p.head_absence_equivalence.includes('if_and_only_if_zero_rows') && p.head_presence_equivalence.includes('unique_maximum_authority_order_row') && head.head_absence_equivalence === p.head_absence_equivalence && head.head_presence_equivalence === p.head_presence_equivalence)
    ok('transaction and postcondition', p.transaction.includes('lock_exact_head_and_partition_range') && p.transaction.includes('server_assign_next_order') && p.transaction.includes('append_row_advance_head_and_commit_registry_result_receipt_atomically') && p.postcondition.includes('new_row_equals_head_equals_unique_selected_tip'))
    ok('failure total', p.failure.includes('duplicate_missing_rewound_or_mismatched_head_or_nonunique_maximum_holds'))
    for (const store of stores) {
      const row = c.authoritative_row_schemas[store], spec = p.stores[store]
      ok(`${store} partition schema`, c[spec.partition_schema_ref]?.schema_version.includes('.r26.') && row.partition_schema_ref === spec.partition_schema_ref)
      ok(`${store} DB unique order`, row.unique_keys.some(key => same(key, [...row.partition_key, 'authority_order'])) && same(spec.database_unique_constraint, [...row.partition_key, 'authority_order']))
      ok(`${store} select all`, row.current_selection === 'unique_maximum_authority_order_across_every_row_and_standing_in_the_exact_partition' && row.legacy_valid_from_or_row_version_selector === 'forbidden')
      ok(`${store} authorize tip`, row.authorize_selected_tip_only_if.includes('selected_tip_standing_active_and_time_valid'))
    }
    ok('head partition refs exact', same(head.partition_schema_refs, Object.fromEntries(stores.map(store => [store, c.authority_order_protocol.stores[store].partition_schema_ref]))) && head.postcondition === p.postcondition)
  })
  test('branch discriminated originals and pure replay', () => {
    const reg = c.authority_operation_registry, union = reg.row_union
    ok('registry union', reg.schema_version.includes('.r26.') && union.schema_version.includes('.r26.') && union.discriminator === 'durable_state' && same(union.exact_variants, ['original_committed', 'original_persisted_hold']))
    const committed = union.variants.original_committed, held = union.variants.original_persisted_hold
    ok('variants closed', closed(committed) && closed(held))
    ok('committed exact authority', ['committed_target_row_ref', 'committed_target_row_bytes_sha256', 'committed_target_row_fingerprint', 'receipt_ref', 'receipt_fingerprint'].every(key => committed.properties[key]?.type === (key.endsWith('sha256') || key.endsWith('fingerprint') ? 'sha256' : 'identifier')))
    ok('held no authority', ['committed_target_row_ref', 'committed_target_row_bytes_sha256', 'committed_target_row_fingerprint', 'receipt_ref', 'receipt_fingerprint'].every(key => !held.properties[key]) && held.forbidden_fields.includes('receipt_ref'))
    ok('only original states', same(reg.durable_states, ['original_committed', 'original_persisted_hold']) && reg.replay_is_durable_state === false)
    ok('lookup before proof', reg.lookup_before_proof_or_nonce === true && reg.lookup_order[0] === 'operation_identity')
    const replay = c.authority_operation_replay_projections
    ok('replay deterministic', replay.schema_version.includes('.r26.') && replay.dynamic_replayed_at === 'forbidden' && !replay.replayed.properties.replayed_at && !replay.replayed_held.properties.replayed_at && replay.derivation.includes('byte_identical') && replay.write_or_effect === 'none')
    for (const protocol of Object.values(c.case_session_authority_operation_protocols.operations)) ok('operation replay schemas deterministic', protocol.schema_version.includes('.r26.') && protocol.result_schema.schema_version.includes('.r26.') && !protocol.result_schema.variants.replayed.properties.replayed_at && !protocol.result_schema.variants.replayed_held.properties.replayed_at && protocol.result_fingerprint.domain_ascii.endsWith('-RESULT-R26'))
    ok('receipt only committed', c.authority_operation_receipt_store.row_union.exact_variants.length === 1 && c.authority_operation_receipt_store.row_union.variants.committed.properties.result_branch.const === 'committed')
    const hold = c.authority_operation_hold_store.row_schema
    ok('hold closed and exact', closed(hold) && same(hold.properties.hold_branch.values, holds) && hold.branch_artifact_rules.length === 5 && hold.branch_artifact_rules.some(rule => rule.startsWith('invalid_target_hold_requires')) && hold.branch_artifact_rules.some(rule => rule.includes('every_hold_forbids_receipt')))
    ok('held replay', c.authority_operation_hold_store.replay_projection_ref === 'authority_operation_replay_projections.replayed_held')
  })
  test('nonce subject and branch consumption', () => {
    const verifier = c.bootstrap_verifier_set_fingerprint, nonce = c.proof_nonce_ledger
    ok('bootstrap set identity', verifier.domain_ascii === 'CTRL-G24-BOOTSTRAP-VERIFIER-SET-R26' && verifier.distinct_signer_refs === true && verifier.distinct_key_or_artifact_fingerprints === true && verifier.canonical_sort.includes('complete_signer_tuple'))
    ok('nonce exact key', nonce.schema_version.includes('.r26.') && closed(nonce.row_schema) && nonce.row_schema.properties.nonce_subject_fingerprint.type === 'sha256' && same(nonce.row_schema.unique_keys, [['proof_family', 'nonce_subject_fingerprint', 'nonce']]))
    ok('family subjects', nonce.nonce_subject_derivation.root_bootstrap === 'bootstrap_verifier_set_fingerprint' && nonce.nonce_subject_derivation.root_admin.includes('exact_root_admin_verifier') && nonce.nonce_subject_derivation.issuer_and_evaluator.includes('fixed_order'))
    ok('branch table complete', same(nonce.consumption_branch_table.map(row => row.branch), ['committed', 'stale_head_hold', 'invalid_target_hold', 'authorization_hold', 'invalid_proof_hold', 'internal_failure_hold', 'collision_hold', 'replayed', 'replayed_held']))
    ok('verified only consumes', nonce.consumption_branch_table.filter(row => row.consume_nonce).every(row => row.proof_structural_signature_scope_time_verified === true) && nonce.consumption_branch_table.filter(row => row.proof_structural_signature_scope_time_verified === false).every(row => row.consume_nonce === false))
    ok('invalid cannot poison', nonce.invalid_malformed_unverified_or_internal_preverification === 'never_consume_nonce' && nonce.consume_order.startsWith('only_after_complete_structural_signature_scope_and_time_verification'))
    ok('replay first', nonce.exact_replay.includes('precedes_nonce_lookup') && nonce.consumption_branch_table.filter(row => ['replayed', 'replayed_held', 'collision_hold'].includes(row.branch)).every(row => row.consume_nonce === false))
  })
  test('principal artifacts const bound', () => {
    ok('operation artifacts recursively R26', c.authority_operation_artifact_stores.schema_version.includes('.r26.') && c.fingerprint_schemas.authority_artifact.domain_ascii.endsWith('-R26') && Object.values(c.authority_operation_artifact_stores.families).every(family => family.schema_version.includes('.r26.') && Object.values(family.stores_by_schema_ref).every(store => store.row_schema.schema_version.includes('.r26.'))))
    const expected = { live_principal_assertions: 'live_principal_assertion_schema', presented_principal_projections: 'server_presented_principal_projection_schema' }
    for (const [name, schemaRef] of Object.entries(expected)) {
      const store = c.principal_authority_artifact_stores[name], row = store.row_schema
      ok(`${name} versions`, store.schema_version.includes('.r26.') && row.schema_version.includes('.r26.'))
      ok(`${name} const schema`, row.properties.canonical_schema_ref.const === schemaRef && row.properties.parsed_content_fingerprint.type === 'sha256')
      ok(`${name} canonical`, row.max_canonical_bytes === 65536 && row.canonical_validation.includes('exact_length_and_SHA256') && row.canonical_validation.includes('const_bound_expected_closed_schema') && row.canonical_validation.includes('reencode_to_identical_canonical_bytes'))
      ok(`${name} writer`, store.sole_writer === 'ctrl_authority_operation_executor' && row.properties.writer_role.const === 'ctrl_authority_operation_executor' && store.direct_dml === 'forbidden')
    }
  })
  test('one writer and dual session authority', () => {
    const controls = c.case_session_authority_store_controls, writer = 'ctrl_authority_operation_executor'
    ok('controls R26', controls.schema_version.includes('.r26.') && Object.values(controls.stores).every(control => control.sole_writer_role === writer) && controls.single_writer_rule.includes(writer) && controls.direct_dml.includes('forbidden'))
    ok('writer stores', c.case_session_root_trust_anchor_authority.sole_writer_role === writer && c.authority_partition_head_store.sole_writer === writer && c.authority_operation_registry.sole_writer === writer && c.authority_operation_receipt_store.sole_writer === writer && c.authority_operation_hold_store.sole_writer === writer && c.proof_nonce_ledger.sole_writer === writer)
    for (const name of ['issue_server_session_principal', 'revoke_server_session_principal', 'expire_server_session_principal']) {
      const p = c.case_session_authority_operation_protocols.operations[name]
      ok(`${name} dual`, p.exact_authority_role === 'issuer_and_evaluator' && same(p.authority_proof_schema_refs, ['case_session_issuer_capability_proof_schema', 'case_session_evaluator_capability_proof_schema']) && p.dual_authority_join.includes('both_proofs_verify'))
      ok(`${name} request both`, p.request_schema.properties.issuer_proof_schema_ref.const === 'case_session_issuer_capability_proof_schema' && p.request_schema.properties.evaluator_proof_schema_ref.const === 'case_session_evaluator_capability_proof_schema')
      ok(`${name} old single absent`, !p.request_schema.properties.authority_proof_schema_ref && !p.authority_proof_schema_ref)
    }
  })
  test('recursive versions', () => {
    ok('readset', c.case_session_authority_read_set_schema.schema_version.includes('.r26.') && c.case_session_authority_read_set_schema.properties.authority_partition_head_order && c.fingerprint_schemas.case_session_authority_read_set.domain_ascii.endsWith('-R26'))
    ok('case receipt', c.case_authority_control_operation_registry.schema_version.includes('.r26.') && c.case_authority_control_operation_registry.row_schema.schema_version.includes('.r26.') && c.fingerprint_schemas.case_authority_control_receipt.domain_ascii.endsWith('-R26'))
    ok('dependent', [c.case_authority_control_receipt_authority_audit, c.server_presented_principal_projection_derivation, c.case_authority_control_hold_dependency_projection_map, c.authority_proof_verification].every(value => value.schema_version.includes('.r26.')))
    ok('manifest', c.schema_change_manifest.schema_version.includes('.r26.') && c.schema_change_manifest.frozen_parent_sha256 === '8def0d4f99db236425f0b69a98f2987176d3dc5e6fad46594103b87579d716f5')
  })
  return out
}
if (read(machinePath) !== materializedR26Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r25.json') !== '8def0d4f99db236425f0b69a98f2987176d3dc5e6fad46594103b87579d716f5') failures.push('frozen R25 changed')
for (const failure of collect(materializedR26)) failures.push(failure)
const mutations = [
  ['stale selector restored', c => { c.append_only_current_selection_protocol = { schema_version: 'stale' } }],
  ['partition schema ref missing', c => { delete c.authority_order_protocol.stores.account_access_standings.partition_schema_ref }],
  ['DB unique order missing', c => { c.authoritative_row_schemas.account_access_standings.unique_keys = c.authoritative_row_schemas.account_access_standings.unique_keys.filter(key => !key.includes('authority_order')) }],
  ['head absence one way', c => { c.authority_order_protocol.head_absence_equivalence = 'head absent when zero' }],
  ['head max equality missing', c => { c.authority_partition_head_store.head_presence_equivalence = 'head exists' }],
  ['head postcondition missing', c => { c.authority_order_protocol.postcondition = 'commit' }],
  ['rewound head accepted', c => { c.authority_order_protocol.failure = 'retry' }],
  ['selector filters active first', c => { c.authoritative_row_schemas.case_session_issuer_registry.current_selection = 'latest_active' }],
  ['registry union flattened', c => { delete c.authority_operation_registry.row_union }],
  ['committed target nullable', c => { c.authority_operation_registry.row_union.variants.original_committed.properties.committed_target_row_ref = { type: 'nullable', value_schema: { type: 'identifier' } } }],
  ['invalid target gains committed target', c => { c.authority_operation_registry.row_union.variants.original_persisted_hold.properties.committed_target_row_ref = { type: 'identifier' }; c.authority_operation_registry.row_union.variants.original_persisted_hold.exact_keys.push('committed_target_row_ref'); c.authority_operation_registry.row_union.variants.original_persisted_hold.required.push('committed_target_row_ref') }],
  ['held receipt allowed', c => { c.authority_operation_registry.row_union.variants.original_persisted_hold.forbidden_fields = [] }],
  ['replay durable state', c => { c.authority_operation_registry.durable_states.push('replayed') }],
  ['replay flag true', c => { c.authority_operation_registry.replay_is_durable_state = true }],
  ['replay dynamic timestamp', c => { c.authority_operation_replay_projections.replayed.properties.replayed_at = { type: 'canonical_timestamp' }; c.authority_operation_replay_projections.replayed.exact_keys.push('replayed_at'); c.authority_operation_replay_projections.replayed.required.push('replayed_at') }],
  ['operation replay dynamic timestamp', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.replayed.properties.replayed_at = { type: 'canonical_timestamp' } }],
  ['replay writes event', c => { c.authority_operation_replay_projections.write_or_effect = 'event' }],
  ['receipt accepts hold', c => { c.authority_operation_receipt_store.row_union.exact_variants.push('hold') }],
  ['hold raw target rule missing', c => { c.authority_operation_hold_store.row_schema.branch_artifact_rules = c.authority_operation_hold_store.row_schema.branch_artifact_rules.filter(rule => !rule.startsWith('invalid_target_hold')) }],
  ['hold replay ref missing', c => { delete c.authority_operation_hold_store.replay_projection_ref }],
  ['bootstrap verifier set alias allowed', c => { c.bootstrap_verifier_set_fingerprint.distinct_signer_refs = false }],
  ['bootstrap key alias allowed', c => { c.bootstrap_verifier_set_fingerprint.distinct_key_or_artifact_fingerprints = false }],
  ['bootstrap signer order unspecified', c => { c.bootstrap_verifier_set_fingerprint.canonical_sort = 'any' }],
  ['nonce subject generic verifier', c => { c.proof_nonce_ledger.row_schema.properties.nonce_subject_fingerprint = { type: 'identifier' } }],
  ['nonce key omits family', c => { c.proof_nonce_ledger.row_schema.unique_keys = [['nonce_subject_fingerprint', 'nonce']] }],
  ['invalid proof poisons nonce', c => { c.proof_nonce_ledger.consumption_branch_table.find(row => row.branch === 'invalid_proof_hold').consume_nonce = true }],
  ['internal preverification poisons nonce', c => { c.proof_nonce_ledger.invalid_malformed_unverified_or_internal_preverification = 'consume' }],
  ['exact replay checks nonce first', c => { c.proof_nonce_ledger.exact_replay = 'check nonce then replay' }],
  ['live artifact schema unrestricted', c => { c.principal_authority_artifact_stores.live_principal_assertions.row_schema.properties.canonical_schema_ref = { type: 'identifier' } }],
  ['projection parsed fp missing', c => { delete c.principal_authority_artifact_stores.presented_principal_projections.row_schema.properties.parsed_content_fingerprint }],
  ['principal canonical reencode missing', c => { c.principal_authority_artifact_stores.live_principal_assertions.row_schema.canonical_validation = 'hash' }],
  ['writer name split head', c => { c.authority_partition_head_store.sole_writer = 'head_writer' }],
  ['writer name split artifact', c => { c.principal_authority_artifact_stores.live_principal_assertions.sole_writer = 'artifact_writer' }],
  ['direct DML opened', c => { c.case_session_authority_store_controls.direct_dml = 'allowed' }],
  ['session issuer proof missing', c => { delete c.case_session_authority_operation_protocols.operations.issue_server_session_principal.request_schema.properties.issuer_proof_schema_ref }],
  ['session evaluator proof missing', c => { c.case_session_authority_operation_protocols.operations.issue_server_session_principal.authority_proof_schema_refs = ['case_session_issuer_capability_proof_schema'] }],
  ['session returns evaluator only', c => { c.case_session_authority_operation_protocols.operations.issue_server_session_principal.exact_authority_role = 'evaluator' }],
  ['readset stale R25', c => { c.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.case-session-authority-read-set.r25.v1' }],
  ['projection stale R25', c => { c.server_presented_principal_projection_derivation.schema_version = 'ctrl.g24.server-presented-principal-projection-derivation.r25.v1' }],
  ['operation artifact family stale R25', c => { c.authority_operation_artifact_stores.families.requests.schema_version = 'ctrl.g24.authority-artifact-family-requests.r25.v1' }],
  ['visible opened', c => { c.visible_surface_changes.push('admin') }],
  ['external opened', c => { c.external_actions_authorized.push('db') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR26); mutate(candidate); if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`G24 trusted ingress R26 failed ${failures.length} check(s):`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R26 and ${mutations.length} mutation probes verified`)
console.log(`r26_machine_sha256=${sha(machinePath)}`)
