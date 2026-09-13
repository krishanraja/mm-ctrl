import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const readBytes = relative => readFileSync(join(root, relative))
const read = relative => readBytes(relative).toString('utf8')
const sha256 = relative => createHash('sha256').update(readBytes(relative)).digest('hex')
const parse = relative => JSON.parse(read(relative))
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const r2Paths = {
  human: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r2.md',
  machine: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r2.json',
  qa: 'project-documentation/ctrl-evolution/g24-trusted-ingress-r2-qa-record.md',
}
const r3Paths = {
  human: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r3.md',
  machine: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r3.json',
  qa: 'project-documentation/ctrl-evolution/g24-trusted-ingress-r3-qa-record.md',
}
const r3Human = read(r3Paths.human)
const r3 = parse(r3Paths.machine)
const r3Qa = read(r3Paths.qa)

check('exact rejected R2 human bytes remain preserved', sha256(r2Paths.human) === '63ebf3a652a3a3a49febd493df0141942d9a51bc40fe893ecbcb2a96a19e962e')
check('exact rejected R2 machine bytes remain preserved', sha256(r2Paths.machine) === '9d479ec45c1ae57bcff864968e534b6d803eb4338da87c535f0165abf5515089')
check('exact rejected R2 QA bytes remain preserved', sha256(r2Paths.qa) === '7749521dad99479c1b82800ee83a23c6a6f7752fa69bbfa4c39388159dfa9e59')
check('exact R3 human bytes', sha256(r3Paths.human) === 'dc6d84e8aee45b3fcaa913a7b245cc8c4303f4deb319dd21ac98d6fb6d168cf0')
check('exact R3 machine bytes', sha256(r3Paths.machine) === 'd20eb7930836cad1dd42fec67c853ee2571baf348cb335317a7509f3700e9db7')
check('exact R3 QA bytes', sha256(r3Paths.qa) === '0a64cae0fa07e0a67a6b1ccc5a299439b40b426184c6b98ce192ebb1199b970b')

check('R3 state is honest', r3.status === 'second_repair_candidate_under_independent_review' && r3.claim_limit === 'unimplemented_local_repair_contract_only')
check('R3 exact predecessor', r3.supersedes_commit === '3f94599065528c52f59135a48f5d6c93494699f9')
check('R3 exact R2 inheritance', r3.inherits.human_sha256 === '63ebf3a652a3a3a49febd493df0141942d9a51bc40fe893ecbcb2a96a19e962e' && r3.inherits.machine_sha256 === '9d479ec45c1ae57bcff864968e534b6d803eb4338da87c535f0165abf5515089' && r3.inherits.qa_sha256 === '7749521dad99479c1b82800ee83a23c6a6f7752fa69bbfa4c39388159dfa9e59')
check('implementation and external authority remain closed', ['adapter_implementation', 'runtime_connection', 'supabase_change', 'customer_data', 'external_research', 'model_call', 'external_send', 'deployment', 'merge', 'release', 'legacy_backend_deletion'].every(value => r3.authority.closed.includes(value)))
check('scope stops at kernel seam', r3.scope.verified_headless_kernel_seam === true && ['leader_final_business_call', 'accepted_brain_learning', 'complete_portable_release', 'customer_messaging', 'continuing_relationship'].every(key => r3.scope[key] === false))

check('principal union exact', r3.principal_union.discriminator === 'principal_kind' && JSON.stringify(Object.keys(r3.principal_union.variants)) === JSON.stringify(['human_session', 'workload_identity']))
check('raw credentials never persist', r3.principal_union.raw_credentials_persisted_or_logged === false)
check('every request and replay reauthorizes', r3.principal_union.current_access_rechecked_on_every_request_and_replay === true)
check('human principal is transport-derived and stable-actor bound', JSON.stringify(r3.principal_union.variants.human_session.exact_keys) === JSON.stringify(['principal_kind', 'stable_actor_ref', 'session_instance_hash', 'actor_class', 'authority_version']) && r3.principal_union.variants.human_session.transport_derived === true && r3.principal_union.variants.human_session.additional_properties === false)
check('workload principal is transport-derived and stable-workload bound', JSON.stringify(r3.principal_union.variants.workload_identity.exact_keys) === JSON.stringify(['principal_kind', 'stable_workload_ref', 'credential_instance_hash', 'capability_class', 'capability_version']) && r3.principal_union.variants.workload_identity.transport_derived === true && r3.principal_union.variants.workload_identity.additional_properties === false)

check('canonical domain and frame exact', r3.canonical_grammar.domain_prefix === 'CTRL-G24-INGRESS-R3' && JSON.stringify(r3.canonical_grammar.fingerprint_frame) === JSON.stringify(['domain_prefix', 'nul', 'object_kind', 'nul', 'schema_version', 'nul', 'canonical_json_utf8']))
check('duplicate keys rejected before materialization', r3.canonical_grammar.duplicate_keys === 'reject_before_materialization')
check('identifiers have exact normalization and byte grammar', r3.canonical_grammar.identifier.normalization === 'NFC' && r3.canonical_grammar.identifier.must_equal_trimmed_value === true && r3.canonical_grammar.identifier.min_utf8_bytes === 1 && r3.canonical_grammar.identifier.max_utf8_bytes === 256 && r3.canonical_grammar.identifier.forbidden.length === 6)
check('human text is exact and unnormalized', r3.canonical_grammar.human_text.valid_unicode_scalar_only === true && r3.canonical_grammar.human_text.normalization === 'none' && r3.canonical_grammar.human_text.trim === false && r3.canonical_grammar.human_text.preserve_exact_value === true)
check('optional and null grammar exact', r3.canonical_grammar.optional === 'absent' && r3.canonical_grammar.null === 'forbidden_unless_field_explicitly_allows')
check('invalid fingerprint sentinel cannot become identity', r3.canonical_grammar.invalid_fingerprint_sentinel === '__g24_ingress_invalid__' && r3.canonical_grammar.sentinel_accepted_as_identity === false)

const operationNames = ['select_intervention', 'create_intervention', 'approve_intervention', 'record_answer', 'correct_answer', 'record_answer_transcription_repair', 'apply_lifecycle_transition', 'compile_release', 'use_release', 'create_enrichment_plan', 'record_enrichment_attempt']
check('request keyset exact', JSON.stringify(r3.request.exact_keys) === JSON.stringify(['operation_id', 'requested_case_ref', 'operation_class', 'intent']) && JSON.stringify(r3.request.required) === JSON.stringify(r3.request.exact_keys) && r3.request.additional_properties === false)
check('operation class exact', JSON.stringify(r3.request.properties.operation_class.values) === JSON.stringify(operationNames))
check('operations exact', JSON.stringify(Object.keys(r3.operations)) === JSON.stringify(operationNames))
for (const name of operationNames) {
  const operation = r3.operations[name]
  check(`operation ${name} has version`, typeof operation?.schema_version === 'string' && operation.schema_version.endsWith('.r3.v1'))
  check(`operation ${name} has closed actor classes`, Array.isArray(operation?.actor_classes) && operation.actor_classes.length > 0)
  check(`operation ${name} has closed intent`, operation?.intent?.type === 'object' && Array.isArray(operation.intent.required) && operation.intent.additional_properties === false && operation.intent.properties && typeof operation.intent.properties === 'object')
  check(`operation ${name} has bounded bytes`, Number.isSafeInteger(operation?.max_intent_bytes) && operation.max_intent_bytes > 0)
  check(`operation ${name} has exact effects`, Array.isArray(operation?.read_set) && operation.read_set.length > 0 && Array.isArray(operation?.write_set) && operation.write_set.length > 0)
  check(`operation ${name} has result and idempotency`, typeof operation?.result_schema === 'string' && operation.result_schema.endsWith('_or_hold') && typeof operation?.idempotency_scope === 'string')
}
check('answer kind exact', JSON.stringify(r3.shared_schemas.answer_kind.values) === JSON.stringify(['option', 'ranking', 'write_in', 'voice', 'unknown', 'defer', 'refuse', 'premise_wrong']))
check('answer value discrimination exact', r3.shared_schemas.answer_value_rules.option.required === true && r3.shared_schemas.answer_value_rules.ranking.unique === true && r3.shared_schemas.answer_value_rules.ranking.max_items === 5 && r3.shared_schemas.answer_value_rules.write_in.max_utf8_bytes === 16384 && r3.shared_schemas.answer_value_rules.voice.max_utf8_bytes === 16384 && ['unknown', 'defer', 'refuse', 'premise_wrong'].every(kind => r3.shared_schemas.answer_value_rules[kind].must_be_absent === true))
check('notes are optional absent and bounded', r3.shared_schemas.note.optional === true && r3.shared_schemas.note.null === false && r3.shared_schemas.note.max_utf8_bytes === 8192)
check('only named leader corrects semantic answer', JSON.stringify(r3.operations.correct_answer.actor_classes) === JSON.stringify(['named_leader']) && r3.operations.correct_answer.intent.cross_field_rules.includes('principal_is_subject_of_original_answer'))
check('operator repair only proposes', JSON.stringify(r3.operations.record_answer_transcription_repair.actor_classes) === JSON.stringify(['krish_operator']) && r3.operations.record_answer_transcription_repair.intent.cross_field_rules.includes('creates_subject_review_proposal_only') && JSON.stringify(r3.operations.record_answer_transcription_repair.forbidden_write_set) === JSON.stringify(['answer', 'case_effect', 'brain_item', 'brain_relationship']))
check('approval edit cross-rule exact', JSON.stringify(r3.operations.approve_intervention.intent.properties.decision.values) === JSON.stringify(['approve', 'edit', 'hold', 'suppress']) && r3.operations.approve_intervention.intent.cross_field_rules.includes('edited_content_ref_required_iff_decision_edit'))
check('lifecycle enum exact', r3.operations.apply_lifecycle_transition.intent.properties.transition_id.values.length === 13 && r3.operations.apply_lifecycle_transition.intent.properties.transition_id.values[0] === 'open_preparation' && r3.operations.apply_lifecycle_transition.intent.properties.transition_id.values[12] === 'open_new_preparation_after_close')
check('enrichment outcome cross-rule exact', JSON.stringify(r3.operations.record_enrichment_attempt.intent.properties.outcome_class.values) === JSON.stringify(['succeeded', 'failed']) && r3.operations.record_enrichment_attempt.intent.cross_field_rules.includes('source_ref_required_iff_outcome_succeeded'))

check('result union exact', r3.result_union.discriminator === 'status' && r3.result_union.additional_properties === false && JSON.stringify(Object.keys(r3.result_union.variants)) === JSON.stringify(['committed', 'replayed', 'held']))
for (const name of ['committed', 'replayed', 'held']) {
  const variant = r3.result_union.variants[name]
  check(`result ${name} keyset exact`, JSON.stringify(variant.exact_keys) === JSON.stringify(variant.required) && Object.keys(variant.properties).every(key => variant.exact_keys.includes(key)))
}
check('committed payload is exact and addressable', ['result_schema_version', 'result_payload_b64url', 'encrypted_result_bytes_ref', 'result_fingerprint', 'result_byte_length'].every(key => r3.result_union.variants.committed.exact_keys.includes(key)))
check('replay payload preserves original bytes', r3.result_union.payload_contract.replay_payload_bytes_equal_original_commit === true && r3.result_union.payload_contract.fingerprint_must_match === true && r3.result_union.payload_contract.byte_length_must_match === true && r3.result_union.payload_contract.schema_version_must_be_exported_by_attested_evaluator_abi === true && r3.result_union.payload_contract.implementer_defined_payload_shape === false)
check('replay distinguishes history from current standing', r3.result_union.variants.replayed.properties.historical_replay.const === true && r3.result_union.variants.replayed.properties.current_standing.const === false)
check('held result cannot leak or mutate', ['result_payload_b64url', 'encrypted_result_bytes_ref', 'receipt', 'outbox', 'mutation'].every(key => r3.result_union.variants.held.forbidden.includes(key)))
check('hold code universe is closed and unique', Array.isArray(r3.hold_codes) && r3.hold_codes.length === new Set(r3.hold_codes).size && ['invalid_command_hold', 'operation_identity_conflict_hold', 'replay_access_hold', 'evaluator_artifact_hold', 'serialization_retry_hold', 'outbox_unknown_hold'].every(code => r3.hold_codes.includes(code)))

check('registry identity excludes session instance', JSON.stringify(r3.operation_registry.identity_bindings) === JSON.stringify(['stable_principal_ref', 'case_derived_workspace', 'case_derived_subject', 'requested_case_ref', 'operation_class', 'intent_fingerprint']) && !r3.operation_registry.identity_bindings.includes('session_instance_hash'))
check('registry stores exact result material', ['immutable_canonical_result_ref', 'encrypted_result_bytes_ref', 'result_fingerprint', 'result_byte_length', 'result_schema_version', 'audience', 'retention_class', 'created_at'].every(key => r3.operation_registry.stored_result.includes(key)))
check('rotated credential can replay only after reauthorization', r3.operation_registry.credential_rotation_same_authorized_stable_principal === 'replay_allowed_after_reauthorization' && r3.operation_registry.every_replay_checks.length === 5)
check('authorized replay never reruns operation', r3.operation_registry.authorized_replay === 'return_original_canonical_result_bytes_without_rerun' && r3.operation_registry.unauthorized_replay === 'replay_access_hold_without_protected_bytes')

const setSeals = ['control_universe', 'applicable_controls', 'control_closure_edges', 'visible_sources', 'visible_assertions', 'accepted_brain_items', 'accepted_brain_relationships', 'route_capability_registry', 'receipt_chain_tips', 'evaluator_registry']
check('set seal universe exact', JSON.stringify(r3.set_seals) === JSON.stringify(setSeals))
check('set seal shape exact', JSON.stringify(r3.set_seal_schema.exact_keys) === JSON.stringify(['set_kind', 'set_schema_version', 'owner_lineage_version', 'canonical_member_count', 'sha256_digest', 'invalid_sentinel_status']) && r3.set_seal_schema.additional_properties === false)
check('set seal canonicalization exact', r3.set_seal_schema.digest_domain_template === 'g24:set-seal:r3:<set-kind>' && r3.set_seal_schema.members === 'sorted_unique_canonical_member_fingerprints' && ['duplicate_member', 'duplicate_identity_different_bytes', 'count_mismatch', 'invalid_member_fingerprint', 'unsupported_encoding'].every(key => r3.set_seal_schema[key] === 'invalid'))
check('snapshot and CAS use identical complete sets', JSON.stringify(r3.snapshot_and_cas.snapshot_set_seals) === JSON.stringify(setSeals) && JSON.stringify(r3.snapshot_and_cas.compare_and_swap_set_seals) === JSON.stringify(setSeals))
check('snapshot scalar versions exact', JSON.stringify(r3.snapshot_and_cas.scalar_versions) === JSON.stringify(['case_scope_version', 'engagement_version', 'plan_version']) && r3.snapshot_and_cas.aggregate_aliases_allowed === false)
check('candidate universe complete', JSON.stringify(r3.candidate_contract.exact_routes) === JSON.stringify(['reuse', 'enrich', 'ask', 'session']) && r3.candidate_contract.exactly_once_each === true && r3.candidate_contract.ineligible_routes_retained === true && r3.candidate_contract.burden_server_derived === true)

check('evaluator member and attestation exact', JSON.stringify(r3.evaluator_registry.member_exact_keys) === JSON.stringify(['evaluator_id', 'semantic_version', 'artifact_sha256', 'abi_version', 'policy_lineage_ref', 'active_from', 'active_until']) && JSON.stringify(r3.evaluator_registry.worker_attestation_exact_keys) === JSON.stringify(['evaluator_id', 'semantic_version', 'artifact_sha256', 'abi_version']))
check('evaluator mismatch holds before kernel', r3.evaluator_registry.worker_attestation_source === 'build_time_immutable' && r3.evaluator_registry.must_exactly_match_active_member === true && r3.evaluator_registry.failure === 'evaluator_artifact_hold' && r3.evaluator_registry.checked_before_kernel_execution === true)

const proofFamilies = ['selector_result', 'intervention_approval', 'answer', 'correction', 'lifecycle', 'pending_release_and_authority', 'enrichment_plan', 'execution_receipt']
const proofMethods = ['rehydrateSelectorResult', 'rehydrateInterventionApproval', 'rehydrateAnswer', 'rehydrateCorrection', 'rehydrateLifecycle', 'rehydratePendingReleaseAndAuthority', 'rehydrateEnrichmentPlan', 'rehydrateExecutionReceipt', 'registerTerminalPlanState', 'finalizeResultBytes']
check('proof registry is transaction local', r3.proof_bridge.registry_scope === 'database_transaction_draft_only' && r3.proof_bridge.default_process_registry_allowed_for_trusted_ingress === false)
check('proof capability is unforgeable and server-only', r3.proof_bridge.resolver_capability.source === 'successful_authoritative_resolver_closure' && r3.proof_bridge.resolver_capability.serializable === false && r3.proof_bridge.resolver_capability.exportable === false && r3.proof_bridge.resolver_capability.accepted_from_caller === false && r3.proof_bridge.resolver_capability.browser_available === false && r3.proof_bridge.browser_exports === false)
check('proof common bundle exact', JSON.stringify(r3.proof_bridge.canonical_bundle_common_exact_keys) === JSON.stringify(['bundle_schema_version', 'owner_family', 'workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'canonical_record_bytes', 'canonical_record_fingerprint', 'predecessor_chain_bytes', 'predecessor_chain_tip', 'current_set_seals', 'append_provenance_ref', 'evaluated_at']))
check('proof families exact and typed', JSON.stringify(Object.keys(r3.proof_bridge.owner_families)) === JSON.stringify(proofFamilies) && proofFamilies.every(family => r3.proof_bridge.owner_families[family].required_extension_keys.length > 0 && r3.proof_bridge.owner_families[family].output.endsWith('_or_hold')))
check('proof context methods exact', JSON.stringify(r3.proof_bridge.context_methods) === JSON.stringify(proofMethods))
check('abort poisoning is closed', r3.proof_bridge.kernel_mutations_before_commit === 'transaction_local_draft_only' && r3.proof_bridge.rollback_timeout_cancellation_serialization_failure === 'discard_entire_context' && r3.proof_bridge.post_commit_response_source === 'immutable_committed_result_record' && r3.proof_bridge.retry_source === 'fresh_context_from_canonical_database_state')
check('terminal state loaded before plan call', r3.proof_bridge.terminal_state_loaded_before_plan_call === true)

check('database protocol is serializable and atomic', r3.database_protocol.isolation === 'serializable' && r3.database_protocol.single_operation_procedure === true && r3.database_protocol.separate_data_api_reads === false && r3.database_protocol.database_append_before_external_observability === true)
check('database uniqueness decides winners', r3.database_protocol.uniqueness_decides_attempt_and_terminal_winners === true)
check('serialization retries bounded', r3.database_protocol.serialization_retries === 3 && r3.database_protocol.retry_exhausted_result === 'serialization_retry_hold')

check('outbox states exact', JSON.stringify(r3.outbox.states) === JSON.stringify(['pending', 'claimed', 'confirmed', 'failed', 'unknown']))
check('outbox transition universe exact', r3.outbox.transitions.length === 7 && r3.outbox.transitions.includes('pending_to_claimed_by_atomic_cas') && r3.outbox.transitions.includes('expired_claim_to_unknown_without_provider_idempotency'))
check('outbox claim is leased and fenced', r3.outbox.claim_predicate === 'state_pending_or_expired_claim_with_provider_guarantee_and_identical_key_and_bytes' && JSON.stringify(r3.outbox.claim_writes) === JSON.stringify(['worker_ref', 'lease_expires_at', 'attempt_ordinal', 'monotonic_fencing_token']) && r3.outbox.terminal_append_requires_current_fencing_token === true)
check('outbox crash outcomes are honest', r3.outbox.provider_success_before_confirmation_crash_with_idempotency === 'same_key_same_bytes_retry_allowed' && r3.outbox.provider_success_before_confirmation_crash_without_idempotency === 'unknown_no_automatic_resend' && r3.outbox.second_send_from_reconciliation === false)
check('outbox remains inactive', r3.outbox.external_call_authorized_in_phase === false)

const expectedLimitValues = { request_bytes: 65536, intent_bytes: 32768, answer_text_bytes: 16384, note_bytes: 8192, selected_rows: 8192, snapshot_bytes: 8388608, control_keys: 256, control_edges: 2048, control_depth: 32, visible_sources: 1024, visible_assertions: 4096, brain_items: 2048, brain_relationships: 4096, non_execution_receipts: 512, execution_receipts: 33, database_statement_ms: 5000, operation_transaction_ms: 8000, evaluator_ms: 1000, serialization_retries: 3 }
const expectedLimitOrder = ['request_bytes', 'intent_bytes', 'per_field_bytes', 'raw_collection_lengths', 'canonical_set_counts', 'snapshot_bytes', 'evaluator_time', 'database_statement_time', 'operation_transaction_time', 'serialization_retries']
check('limit values preserve R2 exactly', r3.limits_policy.version === 'g24-ingress-limits-r2-v1' && JSON.stringify(r3.limits_policy.values) === JSON.stringify(expectedLimitValues))
check('limit byte grammar exact', r3.limits_policy.byte_encoding === 'r3_canonical_utf8_after_duplicate_key_detection' && r3.limits_policy.human_text_encoding === 'exact_preserved_string_utf8' && r3.limits_policy.raw_collection_length_preflight_first === true)
check('limit evaluation order exact', JSON.stringify(r3.limits_policy.evaluation_order) === JSON.stringify(expectedLimitOrder) && r3.limits_policy.first_failure_wins === true)
check('every numeric limit has a closed hold code', JSON.stringify(Object.keys(r3.limits_policy.hold_code_by_limit)) === JSON.stringify(Object.keys(expectedLimitValues)) && Object.values(r3.limits_policy.hold_code_by_limit).every(code => r3.hold_codes.includes(code)))
check('limit failures have no side effects', Object.values(r3.limits_policy.failure_side_effects).every(value => value === false))

check('human and machine agree on ten seals', r3Human.includes('same ten set seals') && r3Human.includes('evaluator registry seal') && r3.set_seals.length === 10)
check('human and machine agree on exact payload replay', r3Human.includes('result_payload_b64url') && r3.result_union.payload_contract.replay_payload_bytes_equal_original_commit === true)
check('human and machine agree on transaction-local registry', r3Human.includes('transaction-local `G24ProofRegistry`') && r3.proof_bridge.registry_scope === 'database_transaction_draft_only')
check('human and machine agree on no operator rewrite', r3Human.includes('cannot mutate the answer, case effect or Brain') && r3.operations.record_answer_transcription_repair.forbidden_write_set.includes('answer'))
check('QA preserves implementation limit', r3Qa.includes('No code, endpoint, database function, schema, role, outbox, provider call, customer data path or runtime connection implements R3'))
const emDash = String.fromCodePoint(0x2014)
check('R3 files contain no em dash', !r3Human.includes(emDash) && !r3Qa.includes(emDash))

if (failures.length) {
  console.error(`G24 trusted ingress R3 failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: rejected R2 preserved and exact G24 trusted ingress R3 invariants verified')
