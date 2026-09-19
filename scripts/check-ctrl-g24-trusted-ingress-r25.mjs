import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR25, materializedR25Output } from './materialize-ctrl-g24-trusted-ingress-r25.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r25.json'
const read = file => readFileSync(join(root, file), 'utf8')
const sha = file => createHash('sha256').update(read(file)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const exactClosed = schema => schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, Object.keys(schema.properties)) && same(schema.required, schema.exact_keys.filter(key => !(schema.optional ?? []).includes(key)))
const failures = []
const stores = ['case_session_root_trust_anchors', 'case_session_issuer_registry', 'case_session_evaluator_registry', 'account_stable_actor_bindings', 'account_access_standings', 'case_server_session_principal_evidence']
const roles = { bootstrap_case_session_root_anchor: 'bootstrap', issue_case_session_issuer: 'root_admin', revoke_case_session_issuer: 'root_admin', issue_case_session_evaluator: 'root_admin', revoke_case_session_evaluator: 'root_admin', issue_account_actor_binding: 'issuer', rotate_account_actor_binding: 'issuer', offboard_account_actor_binding: 'issuer', issue_account_access_standing: 'issuer', revoke_account_access: 'issuer', offboard_account_access: 'issuer', restore_account_access: 'issuer', issue_server_session_principal: 'evaluator', revoke_server_session_principal: 'evaluator', expire_server_session_principal: 'evaluator' }
const branches = ['committed', 'replayed', 'replayed_held', 'collision_hold', 'authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
function ok(label, condition) { if (!condition) throw new Error(label) }
function collect(c) {
  const out = []
  const test = (label, fn) => { try { fn() } catch (error) { out.push(`${label}: ${error.message}`) } }

  test('identity and closed scope', () => {
    ok('R25 version', c.schema_version === 'ctrl.g24.trusted-ingress.r25.effective.v1')
    ok('R24 parent', c.supersedes.commit === 'bcb77069cf1506ba0ad1d3a34de58567e219d5c8' && c.materialization.frozen_input.sha256 === '559a62f56feb915f8f8d9b70acb540c4700e2e30d8dea2773a55205f4e6d7721')
    ok('scope closed', same(c.visible_surface_changes, []) && same(c.external_actions_authorized, []))
  })

  test('server owned order and partition head', () => {
    const heads = c.authority_partition_head_store
    ok('head schemas', heads.schema_version.includes('.r25.') && exactClosed(heads.row_schema) && heads.row_schema.schema_version.includes('.r25.'))
    ok('head unique', heads.row_schema.unique_keys.some(key => same(key, ['target_store', 'partition_fingerprint'])))
    ok('head fingerprint', heads.row_schema.fingerprint_ref === 'fingerprint_schemas.authority_partition_head' && c.fingerprint_schemas.authority_partition_head.preimage_order.includes('head_order'))
    ok('head server transaction', heads.precommit.includes('expected_head_ref_order_and_fingerprint') && heads.atomic_commit.includes('database_transaction_timestamp') && heads.atomic_commit.includes('append_unique_tip') && heads.atomic_commit.includes('persist_registry_result_and_receipt_atomically'))
    ok('head monotonic', heads.next_order.includes('increment') && heads.row_version_derivation.includes('next_order') && heads.backdated_non_tip_tie_or_collision.includes('impossible_to_commit'))
    for (const store of stores) {
      const row = c.authoritative_row_schemas[store]
      ok(`${store} R25`, row.schema_version.includes('.r25.'))
      ok(`${store} server owned`, same(row.server_owned_fields, ['valid_from', 'row_version_ref', 'authority_order']) && row.caller_or_target_intent_may_supply_server_owned_fields === false)
      ok(`${store} order`, same(row.current_selection_order, ['authority_order_ASC']) && row.current_selection.startsWith('select_unique_maximum_authority_order'))
      ok(`${store} CAS`, row.same_transaction_snapshot_and_cas.includes('lock_exact_partition_head') && row.same_transaction_snapshot_and_cas.includes('append_target_advance_head_and_commit_result_receipt_atomically'))
      ok(`${store} field`, row.properties.authority_order.type === 'safe_nonnegative_integer')
    }
    for (const [name, protocol] of Object.entries(c.case_session_authority_operation_protocols.operations)) {
      ok(`${name} target intent closed`, exactClosed(protocol.target_intent_schema) && protocol.target_intent_schema.schema_version.includes('.r25.'))
      ok(`${name} no order in intent`, ['valid_from', 'row_version_ref', 'authority_order'].every(key => !protocol.target_intent_schema.properties[key]))
      ok(`${name} expected head`, ['expected_head_row_version_ref', 'expected_head_order', 'expected_head_row_fingerprint', 'expected_head_fingerprint'].every(key => protocol.request_schema.properties[key]))
      ok(`${name} decoder server fields`, protocol.target_decoder.caller_order_fields_forbidden.includes('valid_from') && protocol.target_decoder.derive_committed_target_ref === 'authority_partition_head_store.atomic_commit')
    }
  })

  test('registry before proof and exact idempotency', () => {
    const registry = c.authority_operation_registry
    const protocol = c.case_session_authority_operation_protocols
    ok('lookup first', registry.lookup_before_proof_or_nonce === true && protocol.registry_before_proof === true && protocol.admission_order[0].includes('without_proof_or_nonce_revalidation') && protocol.admission_order[1].includes('replayed_held'))
    ok('exact committed replay', registry.exact_committed_replay.includes('without_proof_currentness_nonce_or_effect_evaluation'))
    ok('two exact nonredundant scopes', same(registry.row_schema.unique_keys, [['target_store', 'operation_id'], ['target_store', 'idempotency_key']]) && same(registry.operation_identity_scope, ['target_store', 'operation_id']) && same(registry.idempotency_unique_scope, ['target_store', 'idempotency_key']) && same(registry.idempotency_collision_lookup, ['target_store', 'idempotency_key']))
    ok('new op same idempotency collides', registry.changed_request_or_reused_idempotency.includes('collision_hold'))
    ok('fresh consumes nonce', protocol.admission_order[6].includes('atomically_consumes_nonce'))
    ok('total first match', protocol.total_first_match_exclusive === true && protocol.no_result_falls_through === true && same(protocol.result_branches, branches))
  })

  test('proof families and nonce authority', () => {
    const proofs = [c.case_session_root_bootstrap_proof_schema, c.case_session_root_admin_capability_proof_schema, c.case_session_issuer_capability_proof_schema, c.case_session_evaluator_capability_proof_schema]
    ok('proofs closed and versioned', proofs.every(schema => exactClosed(schema) && schema.schema_version.includes('.r25.') && schema.properties.proof_fingerprint))
    ok('bootstrap separate admin', c.case_session_root_bootstrap_proof_schema.properties.proof_kind.const === 'root_bootstrap' && c.case_session_root_admin_capability_proof_schema.properties.proof_kind.const === 'root_admin_capability')
    ok('bootstrap 2 of 2', c.case_session_root_bootstrap_proof_schema.conditional_rules.includes('signer_1_ref_must_not_equal_signer_2_ref') && c.case_session_root_bootstrap_proof_schema.conditional_rules.includes('threshold_is_exactly_2_of_2') && c.case_session_root_bootstrap_proof_schema.properties.signer_1_signature_b64url && c.case_session_root_bootstrap_proof_schema.properties.signer_2_signature_b64url)
    ok('pinned bootstrap signers and admin verifier', ['pinned_root_admin_verifier_ref', 'pinned_root_admin_verifier_version_ref', 'pinned_root_admin_verifier_artifact_sha256', 'pinned_root_bootstrap_signer_1_ref', 'pinned_root_bootstrap_signer_1_artifact_sha256', 'pinned_root_bootstrap_signer_2_ref', 'pinned_root_bootstrap_signer_2_artifact_sha256'].every(key => c.deployment_trust_configuration_schema.properties[key]))
    for (const [key, preimage] of Object.entries(c.proof_signed_preimages).filter(([key]) => key !== 'schema_version')) {
      ok(`${key} preimage R25`, preimage.schema_version.includes('.r25.') && preimage.domain_ascii.endsWith('-R25') && preimage.field_order[0] === 'domain_ascii' && preimage.signature_fields_excluded === true)
      ok(`${key} no signature`, !preimage.field_order.some(field => field.includes('signature_b64url')))
    }
    ok('target partition fingerprint exact', c.target_partition_fingerprint_schema.domain_ascii === 'CTRL-G24-AUTHORITY-TARGET-PARTITION-R25' && same(c.target_partition_fingerprint_schema.preimage_order.slice(1), ['target_store', 'ordered_partition_field_names', 'ordered_partition_field_values']))
    ok('roles exact', same(c.case_session_authority_operation_protocols.exact_authority_role_by_operation, roles))
    ok('root admin used for admin', ['issue_case_session_issuer', 'revoke_case_session_issuer', 'issue_case_session_evaluator', 'revoke_case_session_evaluator'].every(name => c.case_session_authority_operation_protocols.operations[name].authority_proof_schema_ref === 'case_session_root_admin_capability_proof_schema'))
    ok('verification pinned', c.authority_proof_verification.verify_after_registry_freshness_only === true && c.authority_proof_verification.signature_self_inclusion === 'forbidden' && c.authority_proof_verification.exact_checks.includes('pinned_verifier_or_signers'))
    const nonce = c.proof_nonce_ledger
    ok('nonce closed', nonce.schema_version.includes('.r25.') && exactClosed(nonce.row_schema) && same(nonce.row_schema.unique_keys, [['proof_kind', 'verifier_ref', 'nonce']]))
    ok('nonce atomic and replay exception', nonce.fresh_operation_rule.includes('consumed_atomically') && nonce.committed_replay_exception.includes('before_proof_validation_or_nonce_lookup') && nonce.reused_nonce_on_new_operation.includes('authorization_hold'))
  })

  test('total results and persisted hold replay', () => {
    for (const [name, protocol] of Object.entries(c.case_session_authority_operation_protocols.operations)) {
      ok(`${name} result exact`, same(protocol.result_schema.exact_variants, branches) && same(Object.keys(protocol.result_schema.variants), branches))
      ok(`${name} result fp`, protocol.result_fingerprint.domain_ascii.endsWith('-RESULT-R25') && same(protocol.result_fingerprint.preimage_order.slice(1), ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256']))
      ok(`${name} all fp`, Object.values(protocol.result_schema.variants).every(schema => exactClosed(schema) && schema.schema_version.includes('.r25.') && schema.properties.result_fingerprint.type === 'sha256'))
      ok(`${name} committed receipt`, protocol.result_schema.variants.committed.properties.receipt_ref.type === 'identifier' && protocol.result_schema.variants.replayed.properties.receipt_ref.type === 'identifier')
      ok(`${name} holds no receipt`, ['replayed_held', ...branches.slice(3)].every(branch => !protocol.result_schema.variants[branch].properties.receipt_ref))
    }
    const holds = c.authority_operation_hold_store
    ok('hold store closed', holds.schema_version.includes('.r25.') && exactClosed(holds.row_schema) && holds.all_hold_branches_persist === true)
    ok('hold replay exact', holds.retry.includes('replayed_held') && holds.receipt_fields === 'forbidden' && holds.target_write === 'forbidden' && holds.restart.includes('recompute_result_and_hold_fingerprints'))
    ok('registry total branches', same(c.authority_operation_registry.row_schema.properties.result_branch.values, branches))
  })

  test('const bound content addressed artifact families', () => {
    const artifacts = c.authority_operation_artifact_stores
    ok('artifact root R25', artifacts.schema_version.includes('.r25.') && same(Object.keys(artifacts.families), ['requests', 'targets', 'proofs', 'results', 'replay_responses']))
    for (const [familyName, family] of Object.entries(artifacts.families)) {
      ok(`${familyName} version`, family.schema_version.includes('.r25.') && family.expected_schema_refs.length > 0)
      ok(`${familyName} complete stores`, Object.keys(family.stores_by_schema_ref).length === family.expected_schema_refs.length)
      const versions = new Set()
      for (const store of Object.values(family.stores_by_schema_ref)) {
        const row = store.row_schema
        ok(`${familyName} exact const`, exactClosed(row) && row.properties.canonical_schema_ref.const === store.canonical_schema_ref)
        ok(`${familyName} canonical checks`, row.max_canonical_bytes > 0 && row.canonical_validation.includes('decode_base64url_verify_length_and_sha256') && row.canonical_validation.includes('reencode_to_identical_canonical_bytes') && row.canonical_validation.includes('parsed_content_fingerprint'))
        ok(`${familyName} writer retention restart`, store.sole_writer === 'ctrl_case_session_authority_operation_executor' && store.direct_dml === 'forbidden' && store.retention.includes('reference_exists') && store.restart_failure.includes('hold_without_response'))
        ok(`${familyName} unique`, row.unique_keys.some(key => same(key, ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256'])))
        versions.add(row.schema_version)
      }
      ok(`${familyName} versions distinct`, versions.size === family.expected_schema_refs.length)
    }
    for (const store of [c.principal_authority_artifact_stores.live_principal_assertions, c.principal_authority_artifact_stores.presented_principal_projections]) ok('principal artifacts hardened', store.row_schema.schema_version.includes('.r25.') && store.row_schema.max_canonical_bytes === 65536 && store.row_schema.canonical_validation.includes('const_bound_schema') && store.restart_failure.includes('hold_without_response'))
  })

  test('recursive version closure', () => {
    ok('read set R25', c.case_session_authority_read_set_schema.schema_version.includes('.r25.') && c.case_session_authority_read_set_schema.properties.partition_head_fingerprint && c.case_session_authority_read_set_schema.properties.proof_nonce_receipt_fingerprint && c.fingerprint_schemas.case_session_authority_read_set.domain_ascii.endsWith('-R25'))
    ok('case receipt R25', c.case_authority_control_operation_registry.schema_version.includes('.r25.') && c.case_authority_control_operation_registry.row_schema.schema_version.includes('.r25.') && c.fingerprint_schemas.case_authority_control_receipt.domain_ascii.endsWith('-R25'))
    ok('dependent projections R25', [c.case_authority_control_receipt_authority_audit, c.server_presented_principal_projection_derivation, c.case_authority_control_hold_dependency_projection_map, c.append_only_current_selection_protocol].every(value => value.schema_version.includes('.r25.')))
    ok('manifest', c.schema_change_manifest.schema_version.includes('.r25.') && c.schema_change_manifest.frozen_parent_sha256 === '559a62f56feb915f8f8d9b70acb540c4700e2e30d8dea2773a55205f4e6d7721' && c.schema_change_manifest.same_version_semantic_change === 'forbidden')
  })
  return out
}

if (read(path) !== materializedR25Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r24.json') !== '559a62f56feb915f8f8d9b70acb540c4700e2e30d8dea2773a55205f4e6d7721') failures.push('frozen R24 changed')
for (const failure of collect(materializedR25)) failures.push(failure)

const mutations = [
  ['caller backdates row', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.target_intent_schema.properties.valid_from = { type: 'canonical_timestamp' }; c.case_session_authority_operation_protocols.operations.revoke_account_access.target_intent_schema.exact_keys.push('valid_from'); c.case_session_authority_operation_protocols.operations.revoke_account_access.target_intent_schema.required.push('valid_from') }],
  ['caller supplies row version', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.target_intent_schema.properties.row_version_ref = { type: 'identifier' }; c.case_session_authority_operation_protocols.operations.revoke_account_access.target_intent_schema.exact_keys.push('row_version_ref'); c.case_session_authority_operation_protocols.operations.revoke_account_access.target_intent_schema.required.push('row_version_ref') }],
  ['missing head schema', c => { delete c.authority_partition_head_store }],
  ['head loses unique partition', c => { c.authority_partition_head_store.row_schema.unique_keys = [] }],
  ['head loses CAS', c => { c.authority_partition_head_store.precommit = 'accept' }],
  ['head nonmonotonic', c => { c.authority_partition_head_store.next_order = 'caller value' }],
  ['target commit can backdate', c => { c.authority_partition_head_store.atomic_commit = 'append request row' }],
  ['proof checked before replay', c => { c.case_session_authority_operation_protocols.registry_before_proof = false }],
  ['replay revalidates proof', c => { c.authority_operation_registry.exact_committed_replay = 'revalidate proof' }],
  ['reused nonce exact replay consumes again', c => { c.proof_nonce_ledger.committed_replay_exception = 'consume nonce again' }],
  ['duplicate idempotency new op allowed', c => { c.authority_operation_registry.row_schema.unique_keys = [['target_store', 'operation_id']] }],
  ['idempotency lookup omitted', c => { delete c.authority_operation_registry.idempotency_collision_lookup }],
  ['fresh op skips nonce', c => { c.case_session_authority_operation_protocols.admission_order[6] = 'commit' }],
  ['bootstrap proof used for admin', c => { c.case_session_authority_operation_protocols.operations.issue_case_session_issuer.authority_proof_schema_ref = 'case_session_root_bootstrap_proof_schema' }],
  ['root admin proof absent', c => { delete c.case_session_root_admin_capability_proof_schema }],
  ['bootstrap one signer', c => { delete c.case_session_root_bootstrap_proof_schema.properties.signer_2_signature_b64url; c.case_session_root_bootstrap_proof_schema.exact_keys = c.case_session_root_bootstrap_proof_schema.exact_keys.filter(key => key !== 'signer_2_signature_b64url'); c.case_session_root_bootstrap_proof_schema.required = c.case_session_root_bootstrap_proof_schema.required.filter(key => key !== 'signer_2_signature_b64url') }],
  ['bootstrap duplicate signer allowed', c => { c.case_session_root_bootstrap_proof_schema.conditional_rules = c.case_session_root_bootstrap_proof_schema.conditional_rules.filter(rule => !rule.includes('must_not_equal')) }],
  ['bootstrap threshold one', c => { c.case_session_root_bootstrap_proof_schema.conditional_rules[2] = 'threshold_is_1_of_2' }],
  ['signature self included', c => { c.proof_signed_preimages.root_admin.field_order.push('signature_b64url') }],
  ['unpinned verifier', c => { c.authority_proof_verification.exact_checks = c.authority_proof_verification.exact_checks.filter(value => value !== 'pinned_verifier_or_signers') }],
  ['proof preimage loses domain', c => { c.proof_signed_preimages.issuer.domain_ascii = 'ISSUER' }],
  ['partition fingerprint loses fields', c => { c.target_partition_fingerprint_schema.preimage_order.pop() }],
  ['missing nonce ledger', c => { delete c.proof_nonce_ledger }],
  ['nonce unique weak', c => { c.proof_nonce_ledger.row_schema.unique_keys = [['nonce']] }],
  ['nonce new operation accepted', c => { c.proof_nonce_ledger.reused_nonce_on_new_operation = 'commit' }],
  ['result fingerprint missing', c => { delete c.case_session_authority_operation_protocols.operations.revoke_account_access.result_fingerprint }],
  ['result fingerprint omits branch', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.result_fingerprint.preimage_order = c.case_session_authority_operation_protocols.operations.revoke_account_access.result_fingerprint.preimage_order.filter(key => key !== 'branch') }],
  ['result union non total', c => { delete c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.internal_failure_hold }],
  ['result falls through', c => { c.case_session_authority_operation_protocols.no_result_falls_through = false }],
  ['persisted hold store absent', c => { delete c.authority_operation_hold_store }],
  ['holds not all persisted', c => { c.authority_operation_hold_store.all_hold_branches_persist = false }],
  ['held replay missing', c => { c.authority_operation_hold_store.retry = 'retry fresh' }],
  ['hold gains receipt', c => { c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.authorization_hold.properties.receipt_ref = { type: 'identifier' }; c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.authorization_hold.exact_keys.push('receipt_ref'); c.case_session_authority_operation_protocols.operations.revoke_account_access.result_schema.variants.authorization_hold.required.push('receipt_ref') }],
  ['artifact request family missing', c => { delete c.authority_operation_artifact_stores.families.requests }],
  ['artifact result family missing', c => { delete c.authority_operation_artifact_stores.families.results }],
  ['artifact schema not const', c => { c.authority_operation_artifact_stores.families.requests.stores_by_schema_ref.schema_1.row_schema.properties.canonical_schema_ref = { type: 'identifier' } }],
  ['artifact canonical check weak', c => { c.authority_operation_artifact_stores.families.targets.stores_by_schema_ref.schema_1.row_schema.canonical_validation = 'sha only' }],
  ['artifact max removed', c => { delete c.authority_operation_artifact_stores.families.proofs.stores_by_schema_ref.schema_1.row_schema.max_canonical_bytes }],
  ['artifact retention weak', c => { c.authority_operation_artifact_stores.families.results.stores_by_schema_ref.schema_1.retention = 'temporary' }],
  ['artifact restart opens', c => { c.authority_operation_artifact_stores.families.replay_responses.stores_by_schema_ref.schema_1.restart_failure = 'continue' }],
  ['principal artifact canonical check weak', c => { c.principal_authority_artifact_stores.live_principal_assertions.row_schema.canonical_validation = 'parse' }],
  ['read set stale R24', c => { c.case_session_authority_read_set_schema.schema_version = 'ctrl.g24.case-session-authority-read-set.r24.v1' }],
  ['case control receipt stale R24', c => { c.case_authority_control_operation_registry.schema_version = 'ctrl.g24.case-authority-control-operation-registry.r24.v1' }],
  ['case receipt fingerprint stale R24', c => { c.fingerprint_schemas.case_authority_control_receipt.domain_ascii = 'CTRL-G24-CASE-AUTHORITY-CONTROL-RECEIPT-R24' }],
  ['projection stale R24', c => { c.server_presented_principal_projection_derivation.schema_version = 'ctrl.g24.server-presented-principal-projection-derivation.r24.v1' }],
  ['hold map stale R24', c => { c.case_authority_control_hold_dependency_projection_map.schema_version = 'ctrl.g24.case-authority-control-hold-dependency-projection-map.r24.v1' }],
  ['visible surface opened', c => { c.visible_surface_changes.push('proof ceremony') }],
  ['external action opened', c => { c.external_actions_authorized.push('database') }],
]
for (const [name, mutate] of mutations) { const candidate = structuredClone(materializedR25); mutate(candidate); if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`G24 trusted ingress R25 failed ${failures.length} check(s):`); failures.forEach(failure => console.error(`- ${failure}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R25 and ${mutations.length} mutation probes verified`)
console.log(`r25_machine_sha256=${sha(path)}`)
