import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const readBytes = relative => readFileSync(join(root, relative))
const read = relative => readBytes(relative).toString('utf8')
const sha256 = relative => createHash('sha256').update(readBytes(relative)).digest('hex')
const contractPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r2.md'
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r2.json'
const qaPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-r2-qa-record.md'
const contract = read(contractPath)
const machine = JSON.parse(read(machinePath))
const qa = read(qaPath)
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

check('exact human contract bytes', sha256(contractPath) === '63ebf3a652a3a3a49febd493df0141942d9a51bc40fe893ecbcb2a96a19e962e')
check('exact machine contract bytes', sha256(machinePath) === '9d479ec45c1ae57bcff864968e534b6d803eb4338da87c535f0165abf5515089')
check('exact QA record bytes', sha256(qaPath) === '7749521dad99479c1b82800ee83a23c6a6f7752fa69bbfa4c39388159dfa9e59')
check('repair state is honest', machine.status === 'repair_candidate_under_independent_review')
check('R1 predecessor is exact', machine.supersedes_commit === '491ba15e19865a1522006ed42c0ccc4527460e9b')
check('adapter implementation remains closed', machine.authority.closed.includes('adapter_implementation'))
check('runtime and external actions remain closed', ['runtime_connection', 'supabase_change', 'customer_data', 'external_research', 'model_call', 'external_send', 'deployment', 'merge', 'release'].every(value => machine.authority.closed.includes(value)))
check('session is server transport only', machine.transport.session_source === 'verified_server_transport_context' && machine.transport.session_in_json === false && machine.transport.session_persisted_or_logged === false)
check('request keyset is exact', JSON.stringify(machine.request.exact_keys) === JSON.stringify(['operation_id', 'requested_case_ref', 'operation_class', 'intent']))
check('unknown request fields hold without side effect', machine.request.unknown_fields_rejected === true && machine.request.invalid_result === 'invalid_command_hold' && machine.request.invalid_side_effect === false)

const operationNames = ['select_intervention', 'create_intervention', 'approve_intervention', 'record_answer', 'correct_answer', 'apply_lifecycle_transition', 'compile_release', 'use_release', 'create_enrichment_plan', 'record_enrichment_attempt']
check('operation enum is exact', JSON.stringify(Object.keys(machine.operations)) === JSON.stringify(operationNames))
for (const name of operationNames) {
  const operation = machine.operations[name]
  check(`operation complete: ${name}`, operation && typeof operation.actor === 'string' && Array.isArray(operation.intent_keys) && Number.isSafeInteger(operation.max_payload_bytes) && operation.max_payload_bytes > 0 && typeof operation.idempotency_scope === 'string' && typeof operation.read_set === 'string' && typeof operation.write_set === 'string' && typeof operation.result === 'string')
}
check('answer and correction have bounded human payloads', machine.operations.record_answer.intent_keys.includes('answer_value') && machine.operations.correct_answer.intent_keys.includes('replacement_value'))
check('visible consequence is durably referenced', machine.operations.approve_intervention.intent_keys.includes('visible_effect_receipt_ref') && machine.operations.record_answer.intent_keys.includes('visible_effect_receipt_ref'))
check('workspace is derived from case', machine.operation_registry.workspace_from_request === false)
check('operation replay is exact and conflict-safe', machine.operation_registry.exact_replay === 'return_original_result_bytes' && machine.operation_registry.changed_binding === 'operation_identity_conflict_hold' && machine.operation_registry.authority_rechecked_on_mutating_replay === true)
check('operation registry binds session, scope and result', machine.operation_registry.bindings.includes('live_session_id_hash') && machine.operation_registry.bindings.includes('case_derived_workspace') && machine.operation_registry.bindings.includes('intent_fingerprint') && machine.operation_registry.bindings.includes('original_result_fingerprint'))

const ownerKeys = ['identity_authority_and_audience', 'case_frame_and_requirement', 'sources_and_assertions', 'accepted_items_and_relationships', 'epistemic_policy', 'challenger_result', 'coverage_and_selector', 'intervention_answer_correction_lifecycle', 'release', 'enrichment_plan_and_receipts']
check('canonical owner map is complete', JSON.stringify(Object.keys(machine.canonical_owners)) === JSON.stringify(ownerKeys))
check('ingress cannot become a second Brain', machine.no_second_brain.ingress_projection_persistent_authority === false && machine.no_second_brain.cache_is_content_addressed_bounded_and_rebuildable === true && machine.no_second_brain.canonical_current_state_read_from_cache === false && machine.no_second_brain.shadow_brain_content_copy_allowed === false)
check('set seal shape is exact', JSON.stringify(machine.set_seal_shape) === JSON.stringify(['version', 'canonical_count', 'sha256_digest']))
check('canonical sets are exact', JSON.stringify(machine.set_seals) === JSON.stringify(['control_universe', 'applicable_controls', 'control_closure_edges', 'visible_sources', 'visible_assertions', 'accepted_brain_items', 'accepted_brain_relationships', 'route_capability_registry', 'receipt_chain_tips']))
check('unknown controls hold', machine.unknown_or_unclassified_control_result === 'control_completeness_hold')
check('candidate universe is complete', JSON.stringify(machine.candidate_contract.exact_routes) === JSON.stringify(['reuse', 'enrich', 'ask', 'session']) && machine.candidate_contract.exactly_once_each === true && machine.candidate_contract.ineligible_routes_retained === true && machine.candidate_contract.burden_server_derived === true && machine.candidate_contract.incomplete_result === 'candidate_completeness_hold')
check('snapshot fingerprint is dependency complete', machine.snapshot_fingerprint_components.length === 13 && machine.snapshot_fingerprint_components.includes('operation_and_intent') && machine.snapshot_fingerprint_components.includes('all_control_and_evidence_set_seals') && machine.snapshot_fingerprint_components.includes('complete_candidates_capability_seal_and_burden_policy') && machine.snapshot_fingerprint_components.includes('all_relevant_chain_tips') && machine.snapshot_fingerprint_components.includes('plan_state_and_terminal_flag'))
check('database protocol is serializable and single-function', machine.database_protocol.isolation === 'serializable' && machine.database_protocol.single_operation_procedure === true && machine.database_protocol.separate_data_api_reads === false)
check('database protocol locks case and plan', machine.database_protocol.lock_case_scope === true && machine.database_protocol.lock_plan_for_attempt === true)
check('database protocol rechecks time and CAS seals', machine.database_protocol.fresh_time_recheck_before_append === true && machine.database_protocol.compare_and_swap.length === 9)
check('serialization retry is bounded', machine.database_protocol.serialization_retries === 3 && machine.database_protocol.retry_exhausted_result === 'serialization_retry_hold')
check('durable uniqueness is exact', JSON.stringify(machine.uniqueness) === JSON.stringify(['operation_id', 'receipt_id', 'scoped_idempotency_identity', 'plan_fingerprint_and_attempt_ordinal', 'one_terminal_receipt_per_plan']))
check('write authority is least privilege', machine.write_authority.canonical_owner_roles_are_non_login === true && machine.write_authority.application_direct_dml === false && machine.write_authority.public_execute === false && machine.write_authority.anon_execute === false && machine.write_authority.authenticated_execute === false && machine.write_authority.broad_service_role_direct_dml === false && machine.write_authority.ingress_login === 'dedicated_least_privilege' && machine.write_authority.rls_is_append_provenance === false)
check('proof bridge is server-only and closed', machine.proof_bridge.server_only === true && machine.proof_bridge.browser_exported === false && machine.proof_bridge.caller_provenance_token_accepted === false && machine.proof_bridge.capability_source === 'successful_authoritative_resolver_closure')
check('proof bridge covers durable families', machine.proof_bridge.rehydrator_types.length === 8 && machine.proof_bridge.terminal_state_registered_before_plan_use === true && machine.proof_bridge.revives_expired_or_invalidated_state === false)
check('outbox handles uncertain delivery honestly', machine.outbox.external_call_inside_transaction === false && machine.outbox.unique_effect_id === true && machine.outbox.provider_idempotency_key === true && JSON.stringify(machine.outbox.outcomes) === JSON.stringify(['confirmed', 'failed', 'unknown']) && machine.outbox.unknown_auto_retry_without_provider_guarantee === false && machine.outbox.authority_rechecked_before_send === true)

const expectedLimits = {version: 'g24-ingress-limits-r2-v1', request_bytes: 65536, intent_bytes: 32768, answer_text_bytes: 16384, note_bytes: 8192, selected_rows: 8192, snapshot_bytes: 8388608, control_keys: 256, control_edges: 2048, control_depth: 32, visible_sources: 1024, visible_assertions: 4096, brain_items: 2048, brain_relationships: 4096, non_execution_receipts: 512, execution_receipts: 33, database_statement_ms: 5000, operation_transaction_ms: 8000, evaluator_ms: 1000, serialization_retries: 3}
check('initial limits are exact', JSON.stringify(machine.limits_policy) === JSON.stringify(expectedLimits))
check('limit failure is side-effect free', machine.limit_failure.checked_before_proportional_work === true && machine.limit_failure.kernel_envelope === false && machine.limit_failure.fabricated_receipt === false && machine.limit_failure.brain_mutation === false && machine.limit_failure.outbox_intent === false && machine.limit_failure.external_action === false)
check('fifteen attack families required', machine.required_attack_families === 15)
check('claim remains local repair contract only', machine.claim_limit === 'local_repair_contract_only')
check('human and machine parity names serializable boundary', contract.includes('under `SERIALIZABLE` isolation') && machine.database_protocol.isolation === 'serializable')
check('QA preserves implementation limit', qa.includes('No adapter, proof bridge, database procedure, schema, role, outbox'))
const emDash = String.fromCodePoint(0x2014)
check('R2 files contain no em dash', !contract.includes(emDash) && !qa.includes(emDash))

if (failures.length) {
  console.error(`G24 trusted ingress R2 failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: exact G24 trusted ingress R2 contract and executable invariants verified')
