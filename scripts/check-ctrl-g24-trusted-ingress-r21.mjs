import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR21, materializedR21Output } from './materialize-ctrl-g24-trusted-ingress-r21.mjs'

const root = process.cwd()
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r21.json'
const read = path => readFileSync(join(root, path), 'utf8')
const sha256 = path => createHash('sha256').update(read(path)).digest('hex')
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const failures = []

function exactClosed(schema) {
  const keys = Object.keys(schema?.properties ?? {})
  const optional = schema?.optional ?? []
  return schema?.type === 'object' && schema.additional_properties === false &&
    same(schema.exact_keys, keys) && same(schema.required, keys.filter(key => !optional.includes(key)))
}

function hits(value, needles, path = '$', found = []) {
  if (Array.isArray(value)) value.forEach((item, index) => hits(item, needles, `${path}[${index}]`, found))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      for (const needle of needles) if (key.includes(needle)) found.push(`${path}.<key>:${needle}`)
      hits(item, needles, `${path}.${key}`, found)
    }
  } else if (typeof value === 'string') {
    for (const needle of needles) if (value.includes(needle)) found.push(`${path}:${needle}`)
  }
  return found
}

function lifecycleHits(value, forbidden, path = '$', found = [], propertyKey = false) {
  const canonical = 'predecessor_lifecycle_version_ref'
  const scan = (text, location, isKey) => {
    for (const token of forbidden) {
      let cursor = text.indexOf(token)
      while (cursor >= 0) {
        const tail = text.slice(cursor + token.length)
        const next = tail.slice(4, 5)
        const exactKey = isKey && token === 'predecessor_lifecycle_version' && text === canonical
        const exactValue = !isKey && token === 'predecessor_lifecycle_version' && tail.startsWith('_ref') && (next === '' || /[\s.,;:)\]]/.test(next))
        if (!exactKey && !exactValue) found.push(`${location}:${token}`)
        cursor = text.indexOf(token, cursor + token.length)
      }
    }
  }
  if (Array.isArray(value)) value.forEach((item, index) => lifecycleHits(item, forbidden, `${path}[${index}]`, found, false))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
    scan(key, `${path}.<key>`, true)
    lifecycleHits(item, forbidden, `${path}.${key}`, found, false)
  }
  else if (typeof value === 'string') scan(value, path, propertyKey)
  return found
}

function lifecycleClosureHits(contract) {
  const clone = structuredClone(contract)
  const forbidden = [...clone.lifecycle_vocabulary_contract.forbidden_exact_tokens]
  clone.lifecycle_vocabulary_contract.forbidden_exact_tokens = []
  return lifecycleHits(clone, forbidden)
}

function graph(contract) {
  const dag = contract.release_terminal_issuance_dependency_dag
  const nodes = dag?.nodes ?? []
  const edges = dag?.edges ?? []
  const outgoing = new Map(nodes.map(node => [node, []]))
  const incoming = new Map(nodes.map(node => [node, []]))
  const errors = []
  if (new Set(nodes).size !== nodes.length) errors.push('duplicate node')
  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2 || !outgoing.has(edge[0]) || !incoming.has(edge[1])) { errors.push('invalid edge'); continue }
    outgoing.get(edge[0]).push(edge[1])
    incoming.get(edge[1]).push(edge[0])
  }
  const indegree = new Map(nodes.map(node => [node, incoming.get(node).length]))
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
  if (visited !== nodes.length) errors.push('cycle')
  return { dag, nodes, edges, outgoing, incoming, errors }
}

const expectedCurrentSelection = 'maximum_valid_from_then_unsigned_utf8_row_version_ref_among_rows_where_valid_from_lte_snapshot_time_and_valid_until_absent_or_gt_snapshot_time'
const evidenceRows = [
  ['case_session_issuer_registry', 'issuer_registry_fingerprint', 'case_session_issuer_registry'],
  ['case_session_evaluator_registry', 'evaluator_registry_fingerprint', 'case_session_evaluator_registry'],
  ['account_stable_actor_bindings', 'binding_fingerprint', 'account_stable_actor_binding'],
  ['account_access_standings', 'standing_fingerprint', 'account_access_standing'],
  ['case_server_session_principal_evidence', 'session_principal_fingerprint', 'case_server_session_principal_evidence'],
]
const expectedReasonRows = [
  ['pre_admission.5', 'session_identity_unavailable', 'unauthorized_hold'],
  ['pre_admission.6', 'revoked_or_offboarded', 'revoked_actor_hold'],
  ['registry.8', 'original_actor_mismatch', 'unauthorized_hold'],
  ['registry.9', 'operation_identity_collision', 'collision_hold'],
  ['registry.10', 'current_operator_authority_failed', 'unauthorized_hold'],
  ['registry.11', 'stale_authority', 'stale_authority_hold'],
  ['registry.13', 'serialization_exhausted', 'serialization_hold'],
  ['registry.14', 'internal_failure', 'internal_failure_hold'],
]
const dependencies = ['session_actor', 'workspace', 'subject', 'case', 'control_operation_id', 'request_fingerprint']

function collect(contract) {
  const found = []
  const ok = (name, value) => { if (!value) found.push(name) }
  ok('identity', contract.schema_version === 'ctrl.g24.trusted-ingress.r21.effective.v1' && contract.materialization?.frozen_input?.sha256 === '1d8f062eee31f7b29ac9383ac7f06525f7b4e256091103ef7093ce29c1434a5c')
  ok('public ABI', contract.operation_names.length === 20 && contract.operation_names.every(name => contract.operation_specs[name].result_schema === contract.result_payload_schemas[name].schema_version && contract.evaluator_abi.operation_result_exports[name] === contract.result_payload_schemas[name].schema_version))

  const currentRelease = contract.result_payload_schemas.use_release
  const expectedInventory = {
    exported_union_schema_version: currentRelease.schema_version,
    discriminator: currentRelease.discriminator,
    variants: Object.fromEntries(Object.entries(currentRelease.variants).map(([name, schema]) => [name, schema.schema_version])),
  }
  ok('use release inventory exact', same(contract.operation_result_schema_derivation.discriminated_results.use_release, expectedInventory) && Object.keys(expectedInventory.variants).length === 2 && expectedInventory.variants.pending_delivery === currentRelease.variants.pending_delivery.schema_version && expectedInventory.variants.invalidated_before_use === currentRelease.variants.invalidated_before_use.schema_version)
  ok('inventory binding rule', contract.operation_result_schema_derivation.inventory_exact_schema_equality === 'every_discriminated_exported_union_and_variant_version_equals_the_current_result_payload_schema_object_byte_for_byte')

  const held = contract.response_union.schemas.held
  const replayed = contract.response_union.schemas.replayed_held
  const holdRow = contract.operation_registry.committed_hold_row_schema
  const holdBlob = contract.operation_hold_blob_store.row_schema
  const replay = contract.operation_registry.replayed_held_derivation
  ok('held exact version and type', exactClosed(held) && held.schema_version === 'ctrl.g24.response.held.r21.v1' && held.type === 'object')
  ok('replayed held exact version and type', exactClosed(replayed) && replayed.schema_version === 'ctrl.g24.response.replayed-held.r21.v1' && replayed.type === 'object')
  ok('hold durable schema binding', holdRow.properties.response_schema_version?.const === held.schema_version && holdBlob.properties.response_schema_version?.const === held.schema_version && holdRow.conditional_rules.includes('response_schema_version_equals_response_union.schemas.held.schema_version_byte_for_byte') && holdBlob.conditional_rules.includes('response_schema_version_equals_response_union.schemas.held.schema_version_byte_for_byte'))
  ok('held replay schema binding', replay.held_response_schema_ref === 'response_union.schemas.held' && replay.replayed_response_schema_ref === 'response_union.schemas.replayed_held' && same(replay.response_schema_equalities, ['hold_row.response_schema_version_equals_hold_blob.response_schema_version_equals_response_union.schemas.held.schema_version', 'replayed_response_validates_response_union.schemas.replayed_held']))

  ok('closed authority evidence rows', evidenceRows.every(([rowName, fingerprintField, fingerprintName]) => {
    const row = contract.authoritative_row_schemas[rowName]
    const fingerprint = contract.fingerprint_schemas[fingerprintName]
    return exactClosed(row) && row.append_only === true && row.current_selection === expectedCurrentSelection && row.current_selection_unique_or_hold === true && row.fingerprint_field === fingerprintField && row.fingerprint_ref === `fingerprint_schemas.${fingerprintName}` && row.fingerprint_field_must_equal_referenced_preimage_digest === true && fingerprint?.preimage_order?.includes('row_version_ref')
  }))
  const standing = contract.authoritative_row_schemas.account_access_standings
  const sessionEvidence = contract.authoritative_row_schemas.case_server_session_principal_evidence
  ok('access standing closed values', same(standing.properties.standing.values, ['active', 'revoked', 'offboarded']))
  ok('session evidence closed identity', same(sessionEvidence.properties.session_standing.values, ['active', 'revoked']) && sessionEvidence.properties.stable_actor_ref && sessionEvidence.properties.account_binding_fingerprint && sessionEvidence.properties.account_standing_fingerprint && sessionEvidence.properties.issuer_artifact_sha256 && sessionEvidence.properties.evaluator_artifact_sha256 && sessionEvidence.properties.expires_at)
  const actor = contract.case_authority_control_session_actor_derivation
  ok('caller cannot assert actor', !contract.case_authority_control_plane.request_schema.properties.authenticated_actor_ref && !contract.case_authority_control_plane.request_schema.properties.session_actor_ref)
  ok('session derivation exact sources', actor.source === 'authoritative_row_schemas.case_server_session_principal_evidence' && actor.caller_supplied_actor_field === 'forbidden' && actor.trusted_issuer_schema_ref === 'authoritative_row_schemas.case_session_issuer_registry' && actor.trusted_evaluator_schema_ref === 'authoritative_row_schemas.case_session_evaluator_registry' && actor.account_actor_schema_ref === 'authoritative_row_schemas.account_stable_actor_bindings' && actor.account_standing_schema_ref === 'authoritative_row_schemas.account_access_standings' && actor.timing === 'resolve_and_validate_in_the_same_serializable_snapshot_before_registry_lookup' && actor.exact_source_equalities.length === 6 && actor.fail_closed.includes('without_registry_disclosure_or_write'))
  const snapshot = contract.case_authority_control_session_snapshot
  const branches = contract.case_authority_control_session_branch_equalities
  ok('session same snapshot and CAS', snapshot.transaction.includes('one_serializable_transaction_snapshot') && snapshot.controlling_rows.length === 8 && snapshot.snapshot_fingerprint.includes('exact_controlling_row_refs_versions_and_fingerprints') && snapshot.compare_and_swap_before_commit.includes('every_controlling_row_ref_version_fingerprint_and_standing') && snapshot.replay_obligation.includes('original_actor') && snapshot.fresh_obligation.includes('current_operator'))
  ok('exact actor branches fail closed', branches.original_actor_replay.includes('session.stable_actor_ref_equals_original_receipt.session_actor_ref') && branches.current_operator_fresh_mutation.includes('session.stable_actor_ref_equals_current_case_authority_binding.engagement_operator_ref') && branches.current_operator_fresh_mutation.some(value => value.includes('compare_and_swap')) && branches.any_mismatch === 'fail_closed_without_registry_disclosure_binding_or_write')
  ok('session refs bound into admission', contract.case_authority_control_plane.session_actor_derivation_ref === 'case_authority_control_session_actor_derivation' && contract.case_authority_control_plane.session_snapshot_ref === 'case_authority_control_session_snapshot' && contract.case_authority_control_plane.session_branch_equalities_ref === 'case_authority_control_session_branch_equalities' && contract.case_authority_control_operation_registry.admission_outcome_table.same_snapshot_ref === 'case_authority_control_session_snapshot' && contract.case_authority_control_operation_registry.admission_outcome_table.branch_equalities_ref === 'case_authority_control_session_branch_equalities')

  const literal = 'CTRL-G24-CASE-CONTROL-UNAVAILABLE-R21'
  const bytes = Buffer.from(literal, 'utf8')
  const sentinel = contract.case_authority_control_unavailable_sentinel
  ok('exact unavailable sentinel', sentinel.literal_utf8 === literal && sentinel.literal_utf8_b64url === bytes.toString('base64url') && sentinel.byte_length === bytes.length && sentinel.sha256 === createHash('sha256').update(bytes).digest('hex') && sentinel.byte_rule === 'exact_UTF-8_bytes_only_without_terminator_or_implementation_substitution')
  const correlation = contract.case_authority_control_correlation_id_schema
  ok('server correlation id closed', correlation.type === 'string' && correlation.encoding === '32_lowercase_hex_characters' && correlation.pattern === '^[0-9a-f]{32}$' && correlation.source_bytes === '16_cryptographically_secure_server_random_bytes' && correlation.caller_supplied === false && correlation.generated_before_any_hold_fingerprint_or_rejection_result === true)
  const hold = contract.case_authority_control_hold_fingerprints
  const preAdmissionRows = contract.case_authority_control_pre_admission.rows
  const registryRows = contract.case_authority_control_operation_registry.admission_outcome_table.rows
  ok('case outcomes remain total ordered', same(preAdmissionRows.map(row => [row.priority, row.result]), [[1, 'request_too_large_rejected'], [2, 'parse_rejected'], [3, 'malformed_request_rejected'], [4, 'request_fingerprint_rejected'], [5, 'unauthorized_hold'], [6, 'revoked_actor_hold']]) && same(registryRows.map(row => [row.priority, row.result]), [[7, 'replayed_committed'], [8, 'unauthorized_hold'], [9, 'collision_hold'], [10, 'unauthorized_hold'], [11, 'stale_authority_hold'], [12, 'committed'], [13, 'serialization_hold'], [14, 'internal_failure_hold']]) && contract.case_authority_control_pre_admission.exhaustive === true && contract.case_authority_control_operation_registry.admission_outcome_table.exhaustive === true && contract.case_authority_control_operation_registry.admission_outcome_table.first_match_exclusive === true && contract.case_authority_control_operation_registry.admission_outcome_table.no_result_falls_through === true)
  ok('selected row reason map total', same(hold.selected_admission_reason_map.map(item => [item.selected_row, item.reason_code, item.result_status]), expectedReasonRows) && hold.selected_admission_reason_map.every(item => item.fingerprint_variant === item.reason_code))
  ok('selected row reason map binds actual rows', hold.selected_admission_reason_map.every(item => {
    const [table, priorityText] = item.selected_row.split('.')
    const rows = table === 'pre_admission' ? preAdmissionRows : table === 'registry' ? registryRows : []
    return rows.find(row => row.priority === Number(priorityText))?.result === item.result_status
  }))
  const reasons = expectedReasonRows.map(item => item[1])
  ok('typed hold variants exact', same(Object.keys(hold.variants), reasons) && same(Object.keys(contract.case_authority_control_hold_input_schemas), reasons.map(reason => `${reason}_input`)) && new Set(Object.values(hold.variants).map(item => item.domain_ascii)).size === reasons.length && hold.exact_selection.includes('exactly_one'))
  ok('typed hold inputs closed', reasons.every(reason => {
    const schema = contract.case_authority_control_hold_input_schemas[`${reason}_input`]
    const variant = hold.variants[reason]
    const expectedKeys = ['correlation_id', 'reason_code', ...dependencies.flatMap(name => [`${name}_available`, `${name}_value_or_sentinel_b64url`])]
    return exactClosed(schema) && schema.properties.reason_code.const === reason && schema.properties.correlation_id.schema_ref === 'case_authority_control_correlation_id_schema' && same(Object.keys(schema.properties), expectedKeys) && schema.canonical_encoding_ref === 'canonical_field_encoding' && schema.unavailable_sentinel_ref === 'case_authority_control_unavailable_sentinel' && schema.conditional_rules.length === dependencies.length * 2 && dependencies.every(name => schema.conditional_rules.includes(`${name}_available_true_iff_value_bytes_equal_canonical_field_encoding_of_the_typed_dependency`) && schema.conditional_rules.includes(`${name}_available_false_iff_value_bytes_equal_case_authority_control_unavailable_sentinel.literal_utf8_b64url_byte_for_byte`)) && variant.input_schema_ref === `case_authority_control_hold_input_schemas.${reason}_input` && same(variant.preimage_order, ['domain_ascii', ...expectedKeys])
  }))

  const { dag, outgoing, incoming, errors } = graph(contract)
  const pending = [
    'pending_assemble_terminal_precommit_identity', 'pending_compute_terminal_precommit_fingerprint',
    'pending_encode_selected_result_payload', 'pending_compute_universal_result_payload_fingerprint',
    'pending_assemble_terminal_consumption', 'pending_compute_terminal_consumption_fingerprint',
    'pending_compute_terminal_row_envelope_fingerprint', 'pending_assemble_response_and_success',
    'pending_assemble_exactly_one_outbox_genesis',
  ]
  const invalidated = [
    'invalidated_assemble_terminal_precommit_identity', 'invalidated_compute_terminal_precommit_fingerprint',
    'invalidated_encode_selected_result_payload', 'invalidated_compute_universal_result_payload_fingerprint',
    'invalidated_assemble_terminal_consumption', 'invalidated_compute_terminal_consumption_fingerprint',
    'invalidated_compute_terminal_row_envelope_fingerprint', 'invalidated_assemble_response_and_success',
    'invalidated_assert_no_outbox',
  ]
  const expectedNodes = ['resolve_current_release_inputs', 'select_terminal_outcome', ...pending, ...invalidated, 'commit_atomic_release_transaction']
  const expectedEdges = [
    ['resolve_current_release_inputs', 'select_terminal_outcome'],
    ['select_terminal_outcome', pending[0]], ['select_terminal_outcome', invalidated[0]],
    ...pending.slice(0, -1).map((node, index) => [node, pending[index + 1]]),
    ...invalidated.slice(0, -1).map((node, index) => [node, invalidated[index + 1]]),
    [pending.at(-1), 'commit_atomic_release_transaction'], [invalidated.at(-1), 'commit_atomic_release_transaction'],
  ]
  ok('release branch DAG exact acyclic', errors.length === 0 && same(dag.nodes, expectedNodes) && same(dag.edges, expectedEdges) && dag.acyclic_and_complete === true)
  ok('release branch topology exact', same(outgoing.get('select_terminal_outcome'), [pending[0], invalidated[0]]) && same(incoming.get('commit_atomic_release_transaction'), [pending.at(-1), invalidated.at(-1)]) && dag.only_rejoin_node === 'commit_atomic_release_transaction' && dag.branch_selector.includes('exactly_one'))
  ok('pending exactly one outbox', dag.pending_delivery_branch.entry_node === pending[0] && dag.pending_delivery_branch.exit_node === pending.at(-1) && dag.pending_delivery_branch.outbox_rule.includes('exactly_one_outbox') && pending.filter(node => node.includes('outbox')).length === 1)
  ok('invalidated explicit no outbox', dag.invalidated_before_use_branch.entry_node === invalidated[0] && dag.invalidated_before_use_branch.exit_node === invalidated.at(-1) && dag.invalidated_before_use_branch.outbox_rule.includes('zero_outbox') && invalidated.filter(node => node.includes('outbox')).length === 1 && invalidated.at(-1) === 'invalidated_assert_no_outbox')
  ok('release write sets preserve branch effect', same(contract.operation_specs.use_release.branch_effects.pending_delivery.write_set, ['pending_outbox_effect', 'release_authority_terminal_consumption']) && same(contract.operation_specs.use_release.branch_effects.invalidated_before_use.write_set, ['release_authority_terminal_consumption']))

  const legacy = ['release_use_receipt', 'release_projection_invalidation_receipt', 'release_invalidation_receipt', 'invalidation_receipt_ref']
  ok('no active legacy release receipt', hits(contract, legacy).length === 0)
  ok('lifecycle keys byte exact', lifecycleClosureHits(contract).length === 0 && contract.lifecycle_vocabulary_contract.predecessor_ref_exception.includes('property_key_is_legal_only_when_byte_equal'))
  ok('manifest exact scope', contract.schema_change_manifest.derivation.includes('frozen_R20') && contract.schema_change_manifest.dependency_parity_checks.length === 6 && contract.schema_change_manifest.changes.every(change => change.current_version.includes('.r21.')))
  return found
}

if (read(machinePath) !== materializedR21Output) failures.push('machine differs from generator')
if (sha256('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r20.json') !== '1d8f062eee31f7b29ac9383ac7f06525f7b4e256091103ef7093ce29c1434a5c') failures.push('frozen R20 changed')
for (const failure of collect(materializedR21)) failures.push(failure)

const mutations = [
  ['stale release union inventory', c => { c.operation_result_schema_derivation.discriminated_results.use_release.exported_union_schema_version = 'ctrl.g24.result.use-release.r12.v1' }],
  ['stale release branch inventory', c => { c.operation_result_schema_derivation.discriminated_results.use_release.variants.pending_delivery = 'ctrl.g24.result.use-release-pending-delivery.r6.v1' }],
  ['forged release branch inventory', c => { c.operation_result_schema_derivation.discriminated_results.use_release.variants.extra = 'ctrl.g24.forged.v1' }],
  ['held arbitrary version', c => { c.response_union.schemas.held.schema_version = 'anything' }],
  ['held arbitrary type', c => { c.response_union.schemas.held.type = 'string' }],
  ['replayed held arbitrary version', c => { c.response_union.schemas.replayed_held.schema_version = 'anything' }],
  ['hold row schema detached', c => { c.operation_registry.committed_hold_row_schema.properties.response_schema_version.const = 'old' }],
  ['hold blob schema detached', c => { c.operation_hold_blob_store.row_schema.properties.response_schema_version.const = 'old' }],
  ['held replay schema detached', c => { c.operation_registry.replayed_held_derivation.replayed_response_schema_ref = 'response_union.schemas.held' }],
  ['invented session authority', c => { c.case_authority_control_session_actor_derivation.source = 'authenticated_claims' }],
  ['caller supplies actor', c => { c.case_authority_control_plane.request_schema.properties.authenticated_actor_ref = { type: 'identifier' } }],
  ['untrusted session issuer ref', c => { c.case_authority_control_session_actor_derivation.trusted_issuer_schema_ref = 'request.issuer' }],
  ['session actor equality weakened', c => { c.case_authority_control_session_branch_equalities.original_actor_replay[0] = 'actor_is_authenticated' }],
  ['current operator equality weakened', c => { c.case_authority_control_session_branch_equalities.current_operator_fresh_mutation[0] = 'actor_is_authenticated' }],
  ['fail closed action changed', c => { c.case_authority_control_session_branch_equalities.any_mismatch = 'continue' }],
  ['revocation standing gains unknown', c => { c.authoritative_row_schemas.account_access_standings.properties.standing.values.push('unknown') }],
  ['revocation source row open', c => { c.authoritative_row_schemas.account_access_standings.additional_properties = true }],
  ['revocation CAS unbound', c => { c.case_authority_control_session_snapshot.controlling_rows = c.case_authority_control_session_snapshot.controlling_rows.filter(name => name !== 'current_account_access_standing') }],
  ['revocation snapshot weakened', c => { c.case_authority_control_session_snapshot.compare_and_swap_before_commit = 'best_effort' }],
  ['session lookup after registry', c => { c.case_authority_control_session_actor_derivation.timing = 'after_registry_lookup' }],
  ['sentinel implementation defined', c => { c.case_authority_control_unavailable_sentinel.byte_rule = 'implementation_defined' }],
  ['sentinel byte changed', c => { c.case_authority_control_unavailable_sentinel.literal_utf8 += 'X' }],
  ['correlation caller supplied', c => { c.case_authority_control_correlation_id_schema.caller_supplied = true }],
  ['correlation weak random source', c => { c.case_authority_control_correlation_id_schema.source_bytes = 'timestamp' }],
  ['reason map missing row', c => { c.case_authority_control_hold_fingerprints.selected_admission_reason_map.pop() }],
  ['reason map wrong result', c => { c.case_authority_control_hold_fingerprints.selected_admission_reason_map[0].result_status = 'collision_hold' }],
  ['mapped admission row result changed', c => { c.case_authority_control_pre_admission.rows[4].result = 'collision_hold' }],
  ['internal outcome removed', c => { c.case_authority_control_operation_registry.admission_outcome_table.rows.pop() }],
  ['hold input open', c => { c.case_authority_control_hold_input_schemas.internal_failure_input.additional_properties = true }],
  ['hold availability bit removed', c => { delete c.case_authority_control_hold_input_schemas.stale_authority_input.properties.session_actor_available }],
  ['hold sentinel rule removed', c => { c.case_authority_control_hold_input_schemas.serialization_exhausted_input.conditional_rules.pop() }],
  ['hold canonical rule detached', c => { c.case_authority_control_hold_input_schemas.operation_identity_collision_input.canonical_encoding_ref = 'implementation_defined' }],
  ['hold domain collision', c => { c.case_authority_control_hold_fingerprints.variants.internal_failure.domain_ascii = c.case_authority_control_hold_fingerprints.variants.stale_authority.domain_ascii }],
  ['hold fingerprint input order changed', c => { c.case_authority_control_hold_fingerprints.variants.original_actor_mismatch.preimage_order.reverse() }],
  ['release DAG cycle', c => { c.release_terminal_issuance_dependency_dag.edges.push(['commit_atomic_release_transaction', 'resolve_current_release_inputs']) }],
  ['release DAG unconditional outbox', c => { c.release_terminal_issuance_dependency_dag.edges.push(['select_terminal_outcome', 'pending_assemble_exactly_one_outbox_genesis']) }],
  ['release DAG cross branch', c => { c.release_terminal_issuance_dependency_dag.edges.push(['pending_encode_selected_result_payload', 'invalidated_compute_universal_result_payload_fingerprint']) }],
  ['release DAG no explicit invalidated assertion', c => { c.release_terminal_issuance_dependency_dag.nodes = c.release_terminal_issuance_dependency_dag.nodes.filter(name => name !== 'invalidated_assert_no_outbox'); c.release_terminal_issuance_dependency_dag.edges = c.release_terminal_issuance_dependency_dag.edges.filter(edge => !edge.includes('invalidated_assert_no_outbox')) }],
  ['release branches rejoin before commit', c => { c.release_terminal_issuance_dependency_dag.edges.push(['invalidated_assemble_response_and_success', 'pending_assemble_response_and_success']) }],
  ['pending branch loses outbox', c => { c.release_terminal_issuance_dependency_dag.pending_delivery_branch.outbox_rule = 'none' }],
  ['invalidated branch creates outbox', c => { c.release_terminal_issuance_dependency_dag.invalidated_before_use_branch.outbox_rule = 'assemble_one_outbox' }],
  ['legacy receipt restored', c => { c.operation_specs.use_release.branch_effects.pending_delivery.write_set.push('release_use_receipt') }],
  ['lifecycle punctuation suffix', c => { c.bad = { 'predecessor_lifecycle_version_ref.': 'x' } }],
  ['lifecycle identifier suffix', c => { c.bad = { predecessor_lifecycle_version_ref_extra: 'x' } }],
  ['manifest erased', c => { c.schema_change_manifest.dependency_parity_checks = [] }],
]

for (const [name, mutate] of mutations) {
  const candidate = structuredClone(materializedR21)
  mutate(candidate)
  if (collect(candidate).length === 0) failures.push(`mutation accepted: ${name}`)
}

if (failures.length) {
  console.error(`G24 trusted ingress R21 failed ${failures.length} check(s):`)
  failures.forEach(failure => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`ok: fully materialized G24 trusted ingress R21 and ${mutations.length} mutation probes verified`)
console.log(`r21_machine_sha256=${sha256(machinePath)}`)
