import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR20, materializedR20Output } from './materialize-ctrl-g24-trusted-ingress-r20.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r20.json'
const read = value => readFileSync(join(root, value), 'utf8')
const sha = value => createHash('sha256').update(read(value)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []
const exactClosed = schema => {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false && same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}
const resolveRef = (contract, ref) => ref.split('.').reduce((value, part) => value?.[part], contract)
function stringHits(value, needles, pathValue = '$', hits = []) {
  if (Array.isArray(value)) value.forEach((item, index) => stringHits(item, needles, `${pathValue}[${index}]`, hits))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      for (const needle of needles) if (key.includes(needle)) hits.push(`${pathValue}.<key>:${needle}`)
      stringHits(item, needles, `${pathValue}.${key}`, hits)
    }
  } else if (typeof value === 'string') for (const needle of needles) if (value.includes(needle)) hits.push(`${pathValue}:${needle}`)
  return hits
}
function lifecycleHits(value, forbidden, pathValue = '$', hits = [], isKey = false) {
  const canonical = 'predecessor_lifecycle_version_ref'
  const scan = (text, location, propertyKey) => {
    for (const token of forbidden) {
      let cursor = text.indexOf(token)
      while (cursor >= 0) {
        const tail = text.slice(cursor + token.length)
        const next = tail.slice(4, 5)
        const exactPropertyKey = propertyKey && token === 'predecessor_lifecycle_version' && text === canonical
        const exactValueRef = !propertyKey && token === 'predecessor_lifecycle_version' && tail.startsWith('_ref') && (next === '' || /[\s.,;:)\]]/.test(next))
        if (!exactPropertyKey && !exactValueRef) hits.push(`${location}:${token}`)
        cursor = text.indexOf(token, cursor + token.length)
      }
    }
  }
  if (Array.isArray(value)) value.forEach((item, index) => lifecycleHits(item, forbidden, `${pathValue}[${index}]`, hits, false))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
    scan(key, `${pathValue}.<key>`, true)
    lifecycleHits(item, forbidden, `${pathValue}.${key}`, hits, false)
  }
  else if (typeof value === 'string') scan(value, pathValue, isKey)
  return hits
}
function lifecycleClosureHits(contract) {
  const clone = structuredClone(contract)
  const forbidden = [...clone.lifecycle_vocabulary_contract.forbidden_exact_tokens]
  clone.lifecycle_vocabulary_contract.forbidden_exact_tokens = []
  return lifecycleHits(clone, forbidden)
}
function dagFailures(dag) {
  const out = []
  const nodes = dag?.nodes ?? []
  const edges = dag?.edges ?? []
  if (new Set(nodes).size !== nodes.length) out.push('duplicate_node')
  const indegree = new Map(nodes.map(node => [node, 0]))
  const outgoing = new Map(nodes.map(node => [node, []]))
  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2 || !indegree.has(edge[0]) || !indegree.has(edge[1])) { out.push(`invalid_edge:${JSON.stringify(edge)}`); continue }
    outgoing.get(edge[0]).push(edge[1])
    indegree.set(edge[1], indegree.get(edge[1]) + 1)
  }
  const queue = nodes.filter(node => indegree.get(node) === 0)
  let visited = 0
  while (queue.length) {
    const node = queue.shift()
    visited += 1
    for (const next of outgoing.get(node)) {
      indegree.set(next, indegree.get(next) - 1)
      if (indegree.get(next) === 0) queue.push(next)
    }
  }
  if (visited !== nodes.length) out.push('cycle')
  return out
}
function collect(contract) {
  const out = []
  const ok = (name, value) => { if (!value) out.push(name) }
  ok('identity', contract.schema_version === 'ctrl.g24.trusted-ingress.r20.effective.v1' && contract.materialization.frozen_input.sha256 === '017bab6d0e6e96341ae9ba4341e1f77c8452730e720c7e8a6c165e57b7079dd7')
  ok('public ABI', contract.operation_names.length === 20 && contract.operation_names.every(name => contract.operation_specs[name].result_schema === contract.result_payload_schemas[name].schema_version && contract.evaluator_abi.operation_result_exports[name] === contract.result_payload_schemas[name].schema_version))

  const dag = contract.release_terminal_issuance_dependency_dag
  const expectedNodes = [
    'resolve_current_release_inputs', 'assemble_terminal_precommit_identity', 'compute_terminal_precommit_fingerprint',
    'encode_selected_result_payload', 'compute_universal_result_payload_fingerprint', 'assemble_terminal_consumption',
    'compute_terminal_consumption_fingerprint', 'compute_terminal_row_envelope_fingerprint', 'assemble_response_and_success',
    'assemble_pending_outbox_genesis', 'commit_atomic_release_transaction',
  ]
  ok('release dependency DAG acyclic', same(dag.nodes, expectedNodes) && same(dag.edges, expectedNodes.slice(0, -1).map((node, index) => [node, expectedNodes[index + 1]])) && dagFailures(dag).length === 0 && dag.acyclic_and_complete)
  ok('result excludes post-result fingerprints', same(dag.result_payload_may_depend_on, ['terminal_consumption_ref', 'terminal_precommit_fingerprint']) && dag.result_payload_must_not_depend_on.includes('terminal_consumption_fingerprint') && dag.result_payload_must_not_depend_on.includes('row_envelope_fingerprint'))
  const precommit = contract.release_terminal_precommit_identity_schema
  const terminal = contract.authoritative_row_schemas.release_authority_terminal_consumptions
  const variants = Object.values(contract.result_payload_schemas.use_release.variants)
  ok('precommit identity closed and result-independent', exactClosed(precommit) && precommit.forbidden_fields.every(field => !precommit.properties[field]) && contract.fingerprint_schemas.release_terminal_precommit.preimage_order.slice(1).every(field => precommit.properties[field]))
  ok('result branches bind neutral precommit identity', variants.every(variant => variant.properties.terminal_consumption_ref && variant.properties.terminal_precommit_fingerprint && !variant.properties.terminal_consumption_fingerprint))
  ok('terminal fingerprint follows universal result', terminal.properties.terminal_precommit_fingerprint && terminal.properties.terminal_result_fingerprint && terminal.properties.terminal_consumption_fingerprint && contract.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.includes('terminal_result_fingerprint') && contract.release_terminal_consumption_derivation.exact_equalities.includes('consumption.terminal_consumption_fingerprint_equals_recomputed_post_result_semantic_preimage'))
  ok('sole terminal receipt authority', contract.release_terminal_receipt_authority.receipt_ref_field === 'terminal_consumption_ref' && contract.release_terminal_receipt_authority.receipt_fingerprint_field === 'terminal_consumption_fingerprint' && contract.release_terminal_receipt_authority.precommit_fingerprint_field === 'terminal_precommit_fingerprint' && contract.release_terminal_receipt_authority.issuance_dependency_dag_ref === 'release_terminal_issuance_dependency_dag')
  const legacy = ['release_use_receipt', 'release_projection_invalidation_receipt', 'release_invalidation_receipt', 'invalidation_receipt_ref']
  ok('no active legacy branch receipt vocabulary', stringHits(contract, legacy).length === 0 && !contract.release_invalidation && !contract.fingerprint_schemas.use_release_pending_delivery_result && !contract.fingerprint_schemas.use_release_invalidated_result)
  const pendingEffects = contract.operation_specs.use_release.branch_effects.pending_delivery
  const invalidEffects = contract.operation_specs.use_release.branch_effects.invalidated_before_use
  ok('release write sets terminal only', same(pendingEffects.write_set, ['pending_outbox_effect', 'release_authority_terminal_consumption']) && same(invalidEffects.write_set, ['release_authority_terminal_consumption']))
  const customerOrigin = contract.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery
  ok('universal outbox result lineage', customerOrigin.result_ref_field === 'terminal_consumption_ref' && customerOrigin.result_fingerprint_ref === 'fingerprint_schemas.operation_result_payload' && customerOrigin.result_fingerprint_field === 'result_payload_fingerprint' && customerOrigin.selected_result_schema_version === 'result_payload_schemas.use_release.variants.pending_delivery.schema_version' && customerOrigin.lineage_rule.includes('universal_operation_result_payload_fingerprint') && contract.outbox.genesis_protocol.exact_equalities[0].includes('selected_result_schema_version') && contract.outbox.genesis_protocol.exact_equalities[0].includes('universal_result_fingerprint'))

  const holdRow = contract.operation_registry.committed_hold_row_schema
  const holdBlob = contract.operation_hold_blob_store.row_schema
  const heldReplay = contract.operation_registry.replayed_held_derivation
  ok('committed hold row closed unique fingerprinted', exactClosed(holdRow) && same(holdRow.unique_keys, [['workspace_ref', 'operation_id']]) && holdRow.fingerprint_ref === 'fingerprint_schemas.operation_registry_committed_hold' && contract.fingerprint_schemas.operation_registry_committed_hold.preimage_order.includes('evaluation_fingerprint'))
  ok('hold blob closed unique content-bearing fingerprinted', exactClosed(holdBlob) && same(holdBlob.unique_keys, [['workspace_ref', 'canonical_hold_response_bytes_ref']]) && holdBlob.properties.canonical_hold_response_b64url && holdBlob.properties.canonical_hold_response_bytes_sha256 && holdBlob.fingerprint_ref === 'fingerprint_schemas.operation_hold_blob')
  ok('hold commit atomic', contract.operation_registry.committed_hold_blob_derivation.commit_atomicity.includes('one_serializable_transaction_or_none') && contract.operation_registry.committed_hold_blob_derivation.exact_equalities.length === 8)
  const replayEqualities = [
    'replay.operation_id_equals_hold_row.operation_id_equals_hold_blob.operation_id',
    'replay.operation_class_equals_hold_row.operation_class_equals_hold_blob.operation_class',
    'replay.hold_code_equals_hold_row.hold_code_equals_hold_blob.hold_code',
    'replay.evaluation_fingerprint_equals_hold_row.evaluation_fingerprint_equals_hold_blob.evaluation_fingerprint',
    'replay.committed_at_equals_hold_row.committed_at_equals_hold_blob.committed_at',
  ]
  ok('held replay exhaustive and fail closed', same(heldReplay.exact_historical_equalities, replayEqualities) && same(heldReplay.replay_only_derivations, ['status_is_replayed_held', 'replayed_at_is_current_database_transaction_timestamp', 'historical_replay_is_true', 'current_standing_is_false']) && heldReplay.evaluator_execution === 'forbidden' && heldReplay.protected_effect === 'forbidden' && heldReplay.mutation === 'forbidden' && heldReplay.unavailable_duplicate_or_corrupt_row_or_blob === 'replay_hold_without_response' && contract.response_union.replayed_held_derivation_ref === 'operation_registry.replayed_held_derivation')

  const control = contract.case_authority_control_plane
  const controlRegistry = contract.case_authority_control_operation_registry
  const session = contract.case_authority_control_session_actor_derivation
  ok('case actor is server-session-derived', !control.request_schema.properties.authenticated_actor_ref && !control.request_schema.properties.session_actor_ref && controlRegistry.row_schema.properties.session_actor_ref && session.source === 'authenticated_live_server_session_principal' && session.caller_supplied_actor_field === 'forbidden' && session.timing.includes('before_registry_lookup'))
  ok('case actor replay and fresh authority exact', session.replay_rule.includes('original_receipt.session_actor_ref') && session.fresh_rule.includes('exact_current_case_engagement_operator_ref') && session.revocation_sources.length === 3 && session.missing_ambiguous_stale_or_revoked_identity.startsWith('fail_closed'))
  const preRows = contract.case_authority_control_pre_admission.rows
  const admissionRows = controlRegistry.admission_outcome_table.rows
  ok('case pre-admission total ordered', same(preRows.map(row => [row.priority, row.result]), [[1, 'request_too_large_rejected'], [2, 'parse_rejected'], [3, 'malformed_request_rejected'], [4, 'request_fingerprint_rejected'], [5, 'unauthorized_hold'], [6, 'revoked_actor_hold']]) && preRows.every(row => row.registry_lookup === false && row.write === false) && contract.case_authority_control_pre_admission.exhaustive)
  ok('case registry outcomes total ordered', same(admissionRows.map(row => [row.priority, row.result]), [[7, 'replayed_committed'], [8, 'unauthorized_hold'], [9, 'collision_hold'], [10, 'unauthorized_hold'], [11, 'stale_authority_hold'], [12, 'committed'], [13, 'serialization_hold'], [14, 'internal_failure_hold']]) && controlRegistry.admission_outcome_table.exhaustive && controlRegistry.admission_outcome_table.first_match_exclusive && controlRegistry.admission_outcome_table.no_result_falls_through)
  const expectedCaseResults = ['request_too_large_rejected', 'parse_rejected', 'malformed_request_rejected', 'request_fingerprint_rejected', 'committed', 'replayed_committed', 'collision_hold', 'unauthorized_hold', 'revoked_actor_hold', 'stale_authority_hold', 'serialization_hold', 'internal_failure_hold']
  ok('case result union closed and exhaustive', same(Object.keys(contract.case_authority_control_result_union.variants), expectedCaseResults) && Object.values(contract.case_authority_control_result_union.variants).every(exactClosed))
  const holdStatuses = ['collision_hold', 'unauthorized_hold', 'revoked_actor_hold', 'stale_authority_hold', 'serialization_hold', 'internal_failure_hold']
  const holdFingerprints = contract.case_authority_control_hold_fingerprints
  ok('case hold fingerprints domain-separated', same(Object.keys(holdFingerprints.variants), holdStatuses) && new Set(Object.values(holdFingerprints.variants).map(value => value.domain_ascii)).size === holdStatuses.length && Object.values(holdFingerprints.variants).every(value => value.preimage_order.includes('session_actor_or_unavailable_sentinel')) && holdFingerprints.exact_selection.includes('exactly_one'))
  ok('original actor replay with revocation', controlRegistry.replay.includes('live_session_actor') && controlRegistry.replay.includes('revocation_checks_pass') && admissionRows[0].guard.includes('receipt.session_actor_ref') && admissionRows[0].guard.includes('revocation_checks_pass'))

  ok('lifecycle property keys exact', lifecycleClosureHits(contract).length === 0 && contract.lifecycle_vocabulary_contract.predecessor_ref_exception.includes('property_key_is_legal_only_when_byte_equal'))
  ok('R19 surviving strengths', contract.operation_registry.replayed_committed_derivation.exact_historical_equalities.length === 10 && contract.lifecycle_single_action_role_derivation.exact_equalities.includes('consumption.actor_role_equals_action_receipt.actor_role') && contract.outbox.payload_binding_map.worker_ambiguity.actor_payload_equality)
  ok('manifest', contract.schema_change_manifest.derivation.includes('frozen_R19') && contract.schema_change_manifest.dependency_parity_checks.length === 6 && contract.schema_change_manifest.changes.every(change => change.current_version.includes('.r20.')))
  return out
}

if (read(path) !== materializedR20Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r19.json') !== '017bab6d0e6e96341ae9ba4341e1f77c8452730e720c7e8a6c165e57b7079dd7') failures.push('frozen R19 changed')
for (const failure of collect(materializedR20)) failures.push(failure)

const mutations = [
  ['release DAG cycle', contract => { contract.release_terminal_issuance_dependency_dag.edges.push(['commit_atomic_release_transaction', 'resolve_current_release_inputs']) }],
  ['release DAG order swap', contract => { [contract.release_terminal_issuance_dependency_dag.nodes[2], contract.release_terminal_issuance_dependency_dag.nodes[4]] = [contract.release_terminal_issuance_dependency_dag.nodes[4], contract.release_terminal_issuance_dependency_dag.nodes[2]] }],
  ['result depends on final terminal fingerprint', contract => { contract.release_terminal_issuance_dependency_dag.result_payload_may_depend_on.push('terminal_consumption_fingerprint') }],
  ['precommit includes result fingerprint', contract => { contract.release_terminal_precommit_identity_schema.properties.terminal_result_fingerprint = { type: 'sha256' } }],
  ['result loses precommit fingerprint', contract => { delete contract.result_payload_schemas.use_release.variants.pending_delivery.properties.terminal_precommit_fingerprint }],
  ['result restores legacy receipt', contract => { contract.result_payload_schemas.use_release.variants.pending_delivery.properties.release_use_receipt_ref = { type: 'identifier' } }],
  ['invalidated write restores legacy receipt', contract => { contract.operation_specs.use_release.branch_effects.invalidated_before_use.write_set.push('release_projection_invalidation_receipt') }],
  ['legacy branch fingerprint restored', contract => { contract.fingerprint_schemas.use_release_pending_delivery_result = { domain_ascii: 'legacy' } }],
  ['outbox uses legacy fingerprint', contract => { contract.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.result_fingerprint_ref = 'fingerprint_schemas.use_release_pending_delivery_result' }],
  ['outbox selected schema removed', contract => { delete contract.outbox.genesis_protocol.allowed_origin_by_effect_kind.customer_delivery.selected_result_schema_version }],
  ['terminal semantic loses result fingerprint', contract => { contract.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order = contract.authoritative_semantic_fingerprint_schemas.release_authority_terminal_consumptions.preimage_order.filter(field => field !== 'terminal_result_fingerprint') }],
  ['hold row open', contract => { contract.operation_registry.committed_hold_row_schema.additional_properties = true }],
  ['hold row lookup loses operation', contract => { contract.operation_registry.committed_hold_row_schema.unique_keys = [['workspace_ref']] }],
  ['hold row fingerprint loses evaluation', contract => { contract.fingerprint_schemas.operation_registry_committed_hold.preimage_order = contract.fingerprint_schemas.operation_registry_committed_hold.preimage_order.filter(field => field !== 'evaluation_fingerprint') }],
  ['hold blob bytes removed', contract => { delete contract.operation_hold_blob_store.row_schema.properties.canonical_hold_response_b64url }],
  ['hold blob non-atomic', contract => { contract.operation_registry.committed_hold_blob_derivation.commit_atomicity = 'eventual' }],
  ['held replay operation class detached', contract => { contract.operation_registry.replayed_held_derivation.exact_historical_equalities.splice(1, 1) }],
  ['held replay evaluator allowed', contract => { contract.operation_registry.replayed_held_derivation.evaluator_execution = 'allowed' }],
  ['held corrupt blob returns response', contract => { contract.operation_registry.replayed_held_derivation.unavailable_duplicate_or_corrupt_row_or_blob = 'return_response' }],
  ['caller actor restored', contract => { contract.case_authority_control_plane.request_schema.properties.authenticated_actor_ref = { type: 'identifier' } }],
  ['session actor source caller', contract => { contract.case_authority_control_session_actor_derivation.source = 'request_body' }],
  ['session actor derived after lookup', contract => { contract.case_authority_control_session_actor_derivation.timing = 'after_registry_lookup' }],
  ['replay revocation omitted', contract => { contract.case_authority_control_operation_registry.admission_outcome_table.rows[0].guard = 'registry_row_exists_and_request_fingerprint_matches_and_live_session_actor_ref_equals_receipt.session_actor_ref' }],
  ['fresh current operator omitted', contract => { contract.case_authority_control_session_actor_derivation.fresh_rule = 'authenticated' }],
  ['pre-admission parse omitted', contract => { contract.case_authority_control_pre_admission.rows.splice(1, 1) }],
  ['pre-admission request fingerprint omitted', contract => { contract.case_authority_control_pre_admission.rows.splice(3, 1) }],
  ['serialization outcome omitted', contract => { contract.case_authority_control_operation_registry.admission_outcome_table.rows.splice(-2, 1) }],
  ['internal outcome omitted', contract => { contract.case_authority_control_operation_registry.admission_outcome_table.rows.pop() }],
  ['case result union omits malformed', contract => { delete contract.case_authority_control_result_union.variants.malformed_request_rejected }],
  ['hold domains collide', contract => { contract.case_authority_control_hold_fingerprints.variants.unauthorized_hold.domain_ascii = contract.case_authority_control_hold_fingerprints.variants.collision_hold.domain_ascii }],
  ['hold fingerprint loses session sentinel', contract => { contract.case_authority_control_hold_fingerprints.variants.internal_failure_hold.preimage_order = ['domain_ascii', 'reason_code'] }],
  ['lifecycle property punctuation suffix', contract => { contract.bad = { 'predecessor_lifecycle_version_ref.': 'x' } }],
  ['lifecycle property identifier suffix', contract => { contract.bad = { predecessor_lifecycle_version_ref_extra: 'x' } }],
  ['manifest erased', contract => { contract.schema_change_manifest.dependency_parity_checks = [] }],
]
for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR20)
  mutate(candidate)
  if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R20 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`ok: fully materialized G24 trusted ingress R20 and ${mutations.length} mutation probes verified`)
console.log(`r20_machine_sha256=${sha(path)}`)
