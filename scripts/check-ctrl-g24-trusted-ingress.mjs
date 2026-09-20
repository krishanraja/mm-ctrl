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
const r4Paths = {
  human: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r4.md',
  machine: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r4.json',
  qa: 'project-documentation/ctrl-evolution/g24-trusted-ingress-r4-qa-record.md',
}
const r5Paths = {
  human: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r5.md',
  machine: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r5.json',
  qa: 'project-documentation/ctrl-evolution/g24-trusted-ingress-r5-qa-record.md',
}
const r3Human = read(r3Paths.human)
const r3 = parse(r3Paths.machine)
const r3Qa = read(r3Paths.qa)
const r4Human = read(r4Paths.human)
const r4 = parse(r4Paths.machine)
const r4Qa = read(r4Paths.qa)
const r5Human = read(r5Paths.human)
const r5 = parse(r5Paths.machine)
const r5Qa = read(r5Paths.qa)

check('exact rejected R2 human bytes remain preserved', sha256(r2Paths.human) === '63ebf3a652a3a3a49febd493df0141942d9a51bc40fe893ecbcb2a96a19e962e')
check('exact rejected R2 machine bytes remain preserved', sha256(r2Paths.machine) === '9d479ec45c1ae57bcff864968e534b6d803eb4338da87c535f0165abf5515089')
check('exact rejected R2 QA bytes remain preserved', sha256(r2Paths.qa) === '7749521dad99479c1b82800ee83a23c6a6f7752fa69bbfa4c39388159dfa9e59')
check('exact R3 human bytes', sha256(r3Paths.human) === 'dc6d84e8aee45b3fcaa913a7b245cc8c4303f4deb319dd21ac98d6fb6d168cf0')
check('exact R3 machine bytes', sha256(r3Paths.machine) === 'd20eb7930836cad1dd42fec67c853ee2571baf348cb335317a7509f3700e9db7')
check('exact R3 QA bytes', sha256(r3Paths.qa) === '0a64cae0fa07e0a67a6b1ccc5a299439b40b426184c6b98ce192ebb1199b970b')
check('exact R4 human bytes', sha256(r4Paths.human) === '658e34cca78d9b35e8994078892a87ef2d97c45f0ec92d58dd68955dc04b5004')
check('exact R4 machine bytes', sha256(r4Paths.machine) === '4ff8bc3748deda96f94c2fac0ad5b698bd38200ce814b268c848ed8290973d59')
check('exact R4 QA bytes', sha256(r4Paths.qa) === '7f967c29f69d9e53b344e332d7c6edb5bc212d7bbdcd8038a0503a7c40f5d69f')
check('exact R5 human bytes', sha256(r5Paths.human) === '3943d577b901fab94921533da0ded46a823201708fd93665c4aa3e37749f8404')
check('exact R5 machine bytes', sha256(r5Paths.machine) === 'd3f4e5edb3b5bf10409300cc2ed25c55316c096e2da8fabc26ffc91f9aeadee8')
check('exact R5 QA bytes', sha256(r5Paths.qa) === '75ce3e4bd3a51f5a2a956e520c1732fb4f7e560e183ee4681f7c20e2542be22b')
check('exact R4 human bytes', sha256(r4Paths.human) === '658e34cca78d9b35e8994078892a87ef2d97c45f0ec92d58dd68955dc04b5004')
check('exact R4 machine bytes', sha256(r4Paths.machine) === '4ff8bc3748deda96f94c2fac0ad5b698bd38200ce814b268c848ed8290973d59')
check('exact R4 QA bytes', sha256(r4Paths.qa) === '7f967c29f69d9e53b344e332d7c6edb5bc212d7bbdcd8038a0503a7c40f5d69f')

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

const r4OperationNames = ['select_intervention', 'create_intervention', 'approve_intervention', 'record_answer', 'correct_answer', 'record_answer_transcription_repair', 'apply_lifecycle_transition', 'compile_release', 'use_release', 'create_enrichment_plan', 'record_enrichment_attempt']
const r4ProofFamilies = ['selector_result', 'intervention_approval', 'answer', 'correction', 'lifecycle', 'pending_release_and_authority', 'enrichment_plan', 'execution_receipt']
const r4SetSeals = ['control_universe', 'applicable_controls', 'control_closure_edges', 'visible_sources', 'visible_assertions', 'accepted_brain_items', 'accepted_brain_relationships', 'route_capability_registry', 'receipt_chain_tips', 'evaluator_registry', 'provider_capability_registry']
const r4LifecycleTransitions = ['open_preparation', 'accept_intensive_proof', 'close_preparation', 'continue_after_intensive_proof', 'renew_continuing_period', 'pause_intensive_proof', 'pause_continuing', 'resume_continuing', 'close_intensive_proof', 'close_continuing', 'close_paused', 'complete_close', 'open_new_preparation_after_close']
const r4LimitOrder = ['raw_transport_bytes', 'decompressed_bytes', 'json_tokens', 'json_nesting_depth', 'json_property_count', 'string_code_units', 'escape_sequences', 'request_bytes', 'intent_bytes', 'answer_text_bytes', 'note_bytes', 'selected_rows', 'control_keys', 'control_edges', 'control_depth', 'visible_sources', 'visible_assertions', 'brain_items', 'brain_relationships', 'non_execution_receipts', 'execution_receipts', 'snapshot_bytes', 'evaluator_ms', 'database_statement_ms', 'operation_transaction_ms', 'serialization_retries']
const r4NegativeFamilies = ['pre_admission_envelope', 'committed_hold_replay', 'approval_branch_effects', 'principal_operation_matrix', 'lifecycle_authority_matrix', 'result_payload_schemas', 'proof_bundle_schemas', 'evaluator_unique_active_and_artifact', 'set_seal_binary_framing', 'snapshot_cas_per_operation', 'resolver_binding_and_single_use', 'transaction_abort_poisoning', 'outbox_authority_and_payload', 'outbox_concurrency_and_crash', 'outbox_reconciliation', 'total_limit_order']

const collectR4Failures = candidate => {
  const found = []
  const assert = (name, condition) => {
    if (!condition) found.push(name)
  }
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)

  assert('identity', candidate.schema_version === 'ctrl.g24.trusted-canonical-ingress.r4.v1' && candidate.status === 'third_repair_candidate_under_independent_review')
  assert('predecessor', candidate.supersedes?.commit === '6e965e8a4b2011e881f737b0860e3d471fe0d4d5' && candidate.supersedes?.tree === '030bce8a96f3f83282c71cdee85bc11084030c09' && candidate.supersedes?.human_blob === '3c7c160af855a952c074af205a0bad870a6e6890' && candidate.supersedes?.machine_blob === '3998cd606c54fdd460758d7b594b26f0ed5ee071' && candidate.supersedes?.qa_blob === '3ec24916a042c8d21dfedeaed6d77edaeec74fc9' && candidate.supersedes?.checker_blob === 'de268afdb7726e523921f6deb7f0f7a7160a717f')
  assert('scope', candidate.scope?.verified_headless_kernel_seam === true && ['leader_final_business_call', 'accepted_brain_learning', 'complete_portable_release', 'customer_messaging', 'continuing_relationship', 'decision_quality_advantage', 'customer_comprehension_delight_or_value'].every(key => candidate.scope[key] === false))
  assert('closed authority', ['adapter_implementation', 'runtime_connection', 'supabase_change', 'customer_data', 'external_research', 'model_call', 'external_send', 'deployment', 'merge', 'release', 'legacy_backend_deletion'].every(value => candidate.authority?.closed?.includes(value)))

  assert('admission order', candidate.request_admission?.streaming_checks_before_materialization?.at(-1) === 'current_operation_authority' && same(candidate.request_admission?.admission_requires, ['authenticated_principal', 'valid_operation_id', 'valid_requested_case_ref', 'known_operation_class', 'exact_valid_intent', 'current_operation_authority']))
  assert('pre-admission has no operation row or echo', candidate.request_admission?.pre_admission_failure?.result === 'request_rejected' && candidate.request_admission.pre_admission_failure.operation_registry_row === false && candidate.request_admission.pre_admission_failure.echo_invalid_request_value === false && candidate.request_admission.pre_admission_failure.persist_invalid_request_value === false)
  assert('rejection schema cannot require request identity', same(candidate.request_rejected_schema?.exact_keys, ['status', 'correlation_id', 'rejection_code', 'evaluated_at']) && same(candidate.request_rejected_schema?.required, ['status', 'correlation_id', 'rejection_code', 'evaluated_at']) && candidate.request_rejected_schema?.additional_properties === false && ['operation_id', 'operation_class', 'requested_case_ref', 'intent'].every(key => candidate.request_rejected_schema?.forbidden?.includes(key)))
  assert('rejection codes bounded', candidate.rejection_codes?.includes('raw_transport_bytes_exceeded') && candidate.rejection_codes?.includes('duplicate_json_key') && candidate.rejection_codes?.includes('not_authorized') && candidate.rejection_codes?.includes('service_temporarily_unavailable'))

  assert('human principal closed', same(candidate.principal_schemas?.human_session?.properties?.actor_class?.values, ['krish_operator', 'authorized_operator', 'named_leader']) && candidate.principal_schemas?.human_session?.properties?.principal_kind?.const === 'human_session' && candidate.principal_schemas?.human_session?.additional_properties === false)
  assert('workload principal closed', same(candidate.principal_schemas?.workload_identity?.properties?.capability_class?.values, ['selector_executor', 'intervention_compiler', 'release_compiler', 'enrichment_planner', 'enrichment_worker', 'delivery_worker', 'outbox_lease_reaper', 'provider_reconciler']) && candidate.principal_schemas?.workload_identity?.properties?.principal_kind?.const === 'workload_identity' && candidate.principal_schemas?.workload_identity?.additional_properties === false)
  assert('case equality predicates', candidate.case_authority_bindings?.named_leader_predicate?.includes('equals_case_named_leader_ref') && candidate.case_authority_bindings?.krish_operator_predicate?.includes('equals_engagement_operator_ref') && candidate.case_authority_bindings?.authorized_operator_predicate?.includes('current_operator_grant_member'))
  assert('operation authority exact', same(Object.keys(candidate.operation_authority ?? {}), r4OperationNames) && same(candidate.operation_authority?.correct_answer, ['named_leader_predicate_and_subject_of_original_answer']) && same(candidate.operation_authority?.approve_intervention, ['krish_operator_predicate']))
  assert('workload predicates exact', same(Object.keys(candidate.workload_authority_predicates ?? {}), ['workload_selector_executor_predicate', 'workload_intervention_compiler_predicate', 'workload_release_compiler_predicate', 'workload_enrichment_planner_predicate', 'workload_enrichment_worker_predicate_and_matches_plan_assignment', 'workload_delivery_worker_predicate', 'workload_outbox_lease_reaper_predicate', 'workload_provider_reconciler_predicate']) && Object.values(candidate.workload_authority_predicates ?? {}).every(predicate => predicate.stable_workload_must_match_current_case_grant === true))
  assert('lifecycle authority exact', same(Object.keys(candidate.lifecycle_authority ?? {}).filter(key => key !== 'two_party_receipt_schema'), r4LifecycleTransitions) && r4LifecycleTransitions.every(key => Array.isArray(candidate.lifecycle_authority?.[key]) && candidate.lifecycle_authority[key].length === 1))
  assert('two-party lifecycle receipt exact', candidate.lifecycle_authority?.two_party_receipt_schema?.consumed_at_must_be_absent_before_use === true && candidate.lifecycle_authority?.two_party_receipt_schema?.consume_atomically_with_transition === true && candidate.lifecycle_authority?.accept_intensive_proof?.[0]?.includes('exact_case_actors_transition_and_predecessor'))

  assert('approval branches exact', same(Object.keys(candidate.approval_effects ?? {}).filter(key => key !== 'discriminator'), ['approve', 'edit', 'hold', 'suppress']) && candidate.approval_effects?.approve?.delivery_eligible === true && candidate.approval_effects?.edit?.write_set?.includes('new_immutable_intervention_atom_version') && candidate.approval_effects?.hold?.delivery_eligible === false && candidate.approval_effects?.hold?.standing === 'not_approved' && candidate.approval_effects?.suppress?.delivery_eligible === false && candidate.approval_effects?.suppress?.reselection_eligible === false)
  assert('approval nonapproval cannot issue approval receipt', !candidate.approval_effects?.hold?.write_set?.some(value => value.includes('approval_receipt')) && !candidate.approval_effects?.suppress?.write_set?.some(value => value.includes('approval_receipt')))

  assert('operation states exact', same(candidate.operation_registry?.durable_states, ['committed_success', 'committed_hold']) && same(candidate.operation_registry?.transaction_local_states, ['admitted_pending']) && candidate.operation_registry?.transaction_abort_leaves_registry_row === false)
  assert('committed hold replay exact', candidate.operation_registry?.post_admission_hold_consumes_operation_id === true && candidate.operation_registry?.reevaluate_committed_hold_with_same_operation_id === false && candidate.operation_registry?.fresh_evaluation_after_hold_requires_new_operation_id === true && candidate.operation_registry?.response_loss_recovery === 'reauthorize_then_return_exact_committed_success_or_hold')
  assert('replay reauthorizes', same(candidate.operation_registry?.every_replay_checks, ['current_authentication', 'current_operation_authority', 'case_membership', 'audience', 'retention_eligibility']))
  assert('failed replay does not mutate registry', candidate.operation_registry?.failed_replay_authority_result === 'request_rejected_not_authorized_without_registry_mutation_or_protected_bytes')
  assert('response union exact', same(candidate.response_union?.variants, ['request_rejected', 'committed', 'held', 'replayed_committed', 'replayed_held']) && same(Object.keys(candidate.response_union?.schemas ?? {}), ['request_rejected', 'committed', 'held', 'replayed_committed', 'replayed_held']))
  assert('held uses evaluation fingerprint', candidate.response_union?.schemas?.held?.exact_keys?.includes('evaluation_fingerprint') && !candidate.response_union?.schemas?.held?.exact_keys?.includes('snapshot_fingerprint') && candidate.response_union?.schemas?.replayed_held?.exact_keys?.includes('evaluation_fingerprint'))
  assert('held evaluation fingerprint is framed', candidate.held_evaluation_fingerprint?.domain_ascii === 'CTRL-G24-HELD-EVALUATION-R4' && candidate.held_evaluation_fingerprint?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && candidate.held_evaluation_fingerprint?.zero_known_dependencies_allowed === true)
  assert('success replay preserves exact payload', candidate.response_union?.replayed_success_payload_bytes_equal_original === true && candidate.response_union?.replayed_hold_code_and_committed_time_equal_original === true)

  assert('operation names exact', same(candidate.operation_names, r4OperationNames))
  assert('result schemas exact', same(Object.keys(candidate.result_payload_schemas ?? {}), r4OperationNames))
  for (const name of r4OperationNames) {
    const schema = candidate.result_payload_schemas?.[name]
    assert(`result schema ${name}`, typeof schema?.schema_version === 'string' && schema.schema_version.includes('.r4.v1') && (schema.additional_properties === false || schema.discriminator === 'decision'))
  }
  assert('approval result variants closed', same(Object.keys(candidate.result_payload_schemas?.approve_intervention?.variants ?? {}), ['approved', 'edited_and_approved', 'held_without_approval', 'suppressed_without_approval']) && Object.values(candidate.result_payload_schemas?.approve_intervention?.variants ?? {}).every(schema => schema.additional_properties === false))
  assert('transcription result cannot claim mutation', candidate.result_payload_schemas?.record_answer_transcription_repair?.properties?.changed_answer?.const === false && candidate.result_payload_schemas?.record_answer_transcription_repair?.properties?.changed_case_effect?.const === false && candidate.result_payload_schemas?.record_answer_transcription_repair?.properties?.changed_brain?.const === false)

  assert('evaluator result exports exact', same(Object.keys(candidate.evaluator_abi?.operation_result_exports ?? {}), r4OperationNames) && r4OperationNames.every(name => candidate.evaluator_abi?.operation_result_exports?.[name] === candidate.result_payload_schemas?.[name]?.schema_version))
  assert('evaluator proof exports exact', same(Object.keys(candidate.evaluator_abi?.proof_family_exports ?? {}), r4ProofFamilies) && r4ProofFamilies.every(name => candidate.evaluator_abi?.proof_family_exports?.[name] === candidate.proof_bundle_schemas?.extensions?.[name]?.schema_version))
  assert('evaluator bytes and unique activity closed', candidate.evaluator_abi?.manifest_sha256_must_match_loaded_immutable_manifest_bytes === true && candidate.evaluator_abi?.artifact_sha256_must_be_computed_from_loaded_immutable_evaluator_bytes === true && candidate.evaluator_abi?.overlapping_active_members_for_selection_key === 'registry_invalid' && candidate.evaluator_abi?.required_match_count === 1 && candidate.evaluator_abi?.checked_before_kernel_execution === true)
  assert('evaluator member fields typed', candidate.evaluator_abi?.registry_member_schema?.additional_properties === false && Object.keys(candidate.evaluator_abi?.registry_member_schema?.properties ?? {}).length === candidate.evaluator_abi?.registry_member_schema?.required?.length)
  assert('proof family names exact', same(candidate.proof_family_names, r4ProofFamilies) && same(Object.keys(candidate.proof_bundle_schemas?.extensions ?? {}), r4ProofFamilies))
  assert('proof envelope closed', same(candidate.proof_bundle_schemas?.envelope?.exact_keys, ['common', 'extension']) && candidate.proof_bundle_schemas?.envelope?.additional_properties === false)
  assert('proof common closed', candidate.proof_bundle_schemas?.common?.additional_properties === false && candidate.proof_bundle_schemas?.common?.exact_keys?.includes('canonical_record_bytes_b64url') && candidate.proof_bundle_schemas?.common?.exact_keys?.includes('current_set_seals'))
  assert('proof extensions closed and typed', r4ProofFamilies.every(name => candidate.proof_bundle_schemas?.extensions?.[name]?.additional_properties === false && Object.keys(candidate.proof_bundle_schemas.extensions[name].properties ?? {}).length === candidate.proof_bundle_schemas.extensions[name].required?.length && candidate.proof_bundle_schemas.extensions[name].authority_checks?.length > 0))

  assert('set seal universe exact', same(candidate.set_seals, r4SetSeals))
  assert('set seal objects exact', candidate.set_seal_object_schema?.additional_properties === false && same(candidate.all_eleven_set_seals?.exact_keys, r4SetSeals) && same(candidate.all_eleven_set_seals?.required, r4SetSeals) && candidate.all_eleven_set_seals?.additional_properties === false && candidate.all_eleven_set_seals?.property_key_must_equal_nested_set_kind === true)
  assert('set seal binary frame exact', candidate.set_seal_encoding?.domain_ascii === 'CTRL-G24-SET-SEAL-R4' && candidate.set_seal_encoding?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && same(candidate.set_seal_encoding?.preimage_order, ['domain_ascii', 'set_kind_framed', 'set_schema_version_framed', 'owner_lineage_version_framed', 'uint64_big_endian_member_count', 'sorted_unique_raw_sha256_member_bytes']) && candidate.set_seal_encoding?.member_fingerprint_encoding === '32_raw_bytes_from_lowercase_hex_sha256' && candidate.set_seal_encoding?.sort === 'ascending_unsigned_byte_lexicographic' && candidate.set_seal_encoding?.digest === 'sha256_of_exact_preimage')
  assert('set seal invalid cases closed', ['duplicates', 'duplicate_identity_different_bytes', 'invalid_member', 'count_mismatch', 'unsupported_encoding'].every(key => candidate.set_seal_encoding?.[key] === 'invalid_no_seal'))
  assert('snapshot map exact', same(Object.keys(candidate.snapshot_and_cas_by_operation ?? {}), r4OperationNames) && r4OperationNames.every(name => same(candidate.snapshot_and_cas_by_operation[name].set_seals, r4SetSeals)))
  assert('snapshot scalar map exact', r4OperationNames.every(name => same(Object.keys(candidate.snapshot_and_cas_by_operation?.[name]?.scalar_versions ?? {}), ['case_scope_version', 'engagement_version', 'plan_version']) && candidate.snapshot_and_cas_by_operation[name].scalar_versions.case_scope_version === 'current' && candidate.snapshot_and_cas_by_operation[name].scalar_versions.engagement_version === 'current' && candidate.snapshot_and_cas_by_operation[name].scalar_versions.plan_version === (name === 'record_enrichment_attempt' ? 'current' : 'not_applicable')))
  assert('snapshot and CAS cannot omit or alias', candidate.snapshot_cas_rule?.snapshot_and_final_compare_and_swap_use_exact_entry === true && candidate.snapshot_cas_rule?.aggregate_aliases_allowed === false)

  const resolverBindings = ['transaction_attempt_id', 'database_connection_nonce_hash', 'stable_principal_ref', 'case_ref', 'snapshot_fingerprint', 'canonical_bundle_digest', 'owner_family', 'expires_at']
  assert('resolver carries bundle and exact bindings', candidate.resolver_capability?.constructor === 'createG24IngressExecutionContext(resolverCapability)' && candidate.resolver_capability?.canonical_bundle_argument_separate === false && candidate.resolver_capability?.bundle_carried_inside_closure === true && same(candidate.resolver_capability?.internal_bindings, resolverBindings))
  assert('resolver is single use and terminally invalidated', candidate.resolver_capability?.single_use === true && same(candidate.resolver_capability?.invalidated_by, ['first_use', 'commit', 'rollback', 'timeout', 'cancellation', 'connection_loss']) && candidate.resolver_capability?.caller_serializable === false && candidate.resolver_capability?.browser_exported === false)
  assert('proof state cannot poison later transaction', candidate.proof_registry?.scope === 'transaction_local_draft_only' && candidate.proof_registry?.process_global_registry_used_by_ingress === false && candidate.proof_registry?.abort_behavior === 'discard_entire_execution_context' && candidate.proof_registry?.post_commit_response_source === 'immutable_committed_operation_row')

  assert('provider capability schema closed', candidate.provider_capability_schema?.additional_properties === false && candidate.provider_capability_schema?.properties?.idempotency_guaranteed?.type === 'boolean' && candidate.provider_capability_schema?.selection === 'exactly_one_half_open_active_member_for_provider_and_operation_and_time')
  assert('outbox states and authority exact', same(candidate.outbox?.states, ['pending', 'claimed', 'confirmed', 'failed', 'unknown']) && same(Object.keys(candidate.outbox?.actor_authority ?? {}), ['claim_and_send', 'expire_to_unknown', 'reconcile_unknown']))
  assert('outbox is leased and fenced', candidate.outbox?.claim?.atomic_compare_and_swap === true && candidate.outbox?.claim?.writes?.includes('lease_expires_at') && candidate.outbox?.claim?.writes?.includes('monotonic_fencing_token') && candidate.outbox?.claim?.second_live_claim === false && candidate.outbox?.stale_fence_can_transition === false)
  assert('outbox authority failure cannot call provider', same(candidate.outbox?.pre_provider_checks, ['current_effect_authority', 'exact_payload_fingerprint', 'exact_payload_bytes', 'exactly_one_current_provider_capability']) && candidate.outbox?.pre_provider_failure?.provider_called === false)
  assert('outbox transitions exact', candidate.outbox?.transitions?.length === 9 && candidate.outbox.transitions.some(item => item.from === 'claimed' && item.to === 'unknown' && item.requires.includes('no_current_idempotency_guarantee')) && candidate.outbox.transitions.some(item => item.from === 'claimed' && item.to === 'claimed' && item.requires.includes('ambiguous_provider_outcome') && item.requires.includes('provider_attempts_below_limit')) && candidate.outbox.transitions.filter(item => item.from === 'unknown').every(item => item.requires.includes('no_provider_call')) && candidate.outbox?.provider_attempt_limit === 3)
  assert('outbox reconciliation closed', candidate.outbox?.reconciliation_evidence_schema?.additional_properties === false && candidate.outbox?.reconciliation_evidence_schema?.properties?.payload_fingerprint?.type === 'sha256' && candidate.outbox?.unknown_auto_resend === false && candidate.outbox?.reconciliation_can_send === false && candidate.outbox?.external_call_authorized_in_phase === false)

  assert('limit order exact', same(candidate.limit_order, r4LimitOrder) && same(Object.keys(candidate.limits ?? {}), r4LimitOrder))
  assert('limits all exact and positive', r4LimitOrder.every(name => Number.isSafeInteger(candidate.limits?.[name]?.value) && candidate.limits[name].value > 0 && typeof candidate.limits[name].phase === 'string' && typeof candidate.limits[name].failure === 'string'))
  assert('raw limits precede materialization', r4LimitOrder.slice(0, 7).every(name => candidate.limits?.[name]?.phase === 'pre_admission_stream' && candidate.rejection_codes?.includes(candidate.limits[name].failure)))
  assert('post-admission hold codes closed', r4LimitOrder.slice(7).every(name => candidate.limits?.[name]?.phase.startsWith('post_admission_') && candidate.hold_codes?.includes(candidate.limits[name].failure)))
  assert('limit semantics exact', candidate.limit_semantics?.decompressed_equals_raw_under_identity_encoding === true && candidate.limit_semantics?.json_token_grammar === 'each_RFC8259_structural_string_number_true_false_or_null_token' && candidate.limit_semantics?.json_nesting_depth === 'root_container_depth_one_maximum_open_container_count' && candidate.limit_semantics?.json_property_count === 'total_object_member_count_across_document' && candidate.limit_semantics?.first_failure_in_total_order_wins === true && candidate.limit_semantics?.side_effect_before_limit_success === false)
  assert('negative families exact', same(candidate.required_negative_fixture_families, r4NegativeFamilies))
  assert('claim honest', candidate.claim_limit === 'unimplemented_local_repair_contract_only')
  return found
}

for (const failure of collectR4Failures(r4)) failures.push(`R4 ${failure}`)

const mutationProbes = [
  ['pre-admission identity echo', candidate => candidate.request_rejected_schema.forbidden.splice(0, 1)],
  ['approval hold standing', candidate => { candidate.approval_effects.hold.delivery_eligible = true }],
  ['principal actor universe', candidate => candidate.principal_schemas.human_session.properties.actor_class.values.push('generic_admin')],
  ['operation authority map', candidate => { candidate.operation_authority.correct_answer = ['krish_operator_predicate'] }],
  ['lifecycle authority map', candidate => { candidate.lifecycle_authority.accept_intensive_proof = ['krish_operator_predicate'] }],
  ['result schema map', candidate => { delete candidate.result_payload_schemas.correct_answer }],
  ['proof family schema', candidate => { candidate.proof_bundle_schemas.extensions.answer.additional_properties = true }],
  ['evaluator selection', candidate => { candidate.evaluator_abi.required_match_count = 2 }],
  ['seal frame', candidate => { candidate.set_seal_encoding.variable_field_frame = 'plain_concatenation' }],
  ['snapshot CAS set', candidate => candidate.snapshot_and_cas_by_operation.use_release.set_seals.pop()],
  ['resolver reuse', candidate => { candidate.resolver_capability.single_use = false }],
  ['abort poisoning', candidate => { candidate.proof_registry.process_global_registry_used_by_ingress = true }],
  ['outbox authority', candidate => { candidate.outbox.pre_provider_failure.provider_called = true }],
  ['outbox crash', candidate => { candidate.outbox.unknown_auto_resend = true }],
  ['outbox reconciliation', candidate => { candidate.outbox.reconciliation_can_send = true }],
  ['limit order', candidate => candidate.limit_order.reverse()],
]
for (const [name, mutate] of mutationProbes) {
  const candidate = structuredClone(r4)
  mutate(candidate)
  check(`R4 mutation rejected: ${name}`, collectR4Failures(candidate).length > 0)
}

check('R4 human and machine agree on request rejection', r4Human.includes('request_rejected') && r4.request_admission.pre_admission_failure.result === 'request_rejected')
check('R4 human and machine agree on eleven seals', r4Human.includes('R4 uses eleven seals') && r4.set_seals.length === 11)
check('R4 human and machine agree on single-use resolver', r4Human.includes('It can be consumed once') && r4.resolver_capability.single_use === true)
check('R4 QA preserves implementation limit', r4Qa.includes('No code, endpoint, database function, schema, role, proof bridge, outbox, provider call, customer data path or runtime connection implements R4'))
check('R4 files contain no em dash', !r4Human.includes(emDash) && !r4Qa.includes(emDash))

const r5SetSeals = [...r4SetSeals, 'operator_grants', 'workload_grants']
const r5ReplacementSections = [
  'use_release_result_and_invalidation',
  'set_seals_snapshot_and_compare_and_swap',
  'set_member_identity',
  'operation_registry_and_hold_fingerprint',
  'proof_lineage_bundle_and_semantic_binding',
  'fresh_execution_replay_lifecycle_and_edited_visibility',
  'limit_phases_outbox_attempts_and_success_evidence',
]
const r5IdentityProjections = {
  control_universe: ['control_id'],
  applicable_controls: ['control_id'],
  control_closure_edges: ['source_control_id', 'target_control_id', 'edge_kind'],
  visible_sources: ['source_ref'],
  visible_assertions: ['assertion_ref'],
  accepted_brain_items: ['item_ref'],
  accepted_brain_relationships: ['relationship_ref'],
  route_capability_registry: ['route_id', 'capability_ref'],
  receipt_chain_tips: ['chain_kind', 'scope_ref'],
  evaluator_registry: ['evaluator_id', 'policy_lineage_ref', 'active_from'],
  provider_capability_registry: ['provider_ref', 'operation_class', 'active_from'],
  operator_grants: ['grant_ref'],
  workload_grants: ['grant_ref'],
}
const r5DecodedFieldNames = {
  selector_result: ['candidate_set_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  intervention_approval: ['intervention_atom_bytes_b64url', 'approval_receipt_bytes_b64url', 'visible_effect_receipt_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  answer: ['answer_receipt_bytes_b64url', 'leader_authority_bytes_b64url', 'visible_effect_receipt_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  correction: ['answer_chain_bytes_b64url', 'correction_receipt_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  lifecycle: ['lifecycle_snapshot_bytes_b64url', 'authority_action_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  pending_release_and_authority: ['pending_release_bytes_b64url', 'release_authority_receipt_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  enrichment_plan: ['plan_bytes_b64url', 'budget_policy_bytes_b64url', 'terminal_state_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
  execution_receipt: ['execution_receipt_bytes_b64url', 'terminal_state_bytes_b64url', 'canonical_record_bytes_b64url', 'predecessor_chain_bytes_b64url'],
}

function collectR5Failures(candidate) {
  const found = []
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
  const assert = (name, condition) => {
    if (!condition) found.push(name)
  }

  assert('schema and status exact', candidate.schema_version === 'ctrl.g24.trusted-ingress.r5.v1' && candidate.status === 'fourth_repair_candidate_under_independent_review')
  assert('exact R4 predecessor', candidate.supersedes?.commit === '5e4ec8f6309a68542cd18b74e709d3490ec02b58' && candidate.supersedes?.human_sha256 === '658e34cca78d9b35e8994078892a87ef2d97c45f0ec92d58dd68955dc04b5004' && candidate.supersedes?.machine_sha256 === '4ff8bc3748deda96f94c2fac0ad5b698bd38200ce814b268c848ed8290973d59' && candidate.supersedes?.qa_sha256 === '7f967c29f69d9e53b344e332d7c6edb5bc212d7bbdcd8038a0503a7c40f5d69f')
  assert('inheritance exact and bounded', candidate.inheritance?.rule === 'all_r4_fields_remain_exact_except_named_replacements' && candidate.inheritance?.conflict_precedence === 'r5_named_replacement_wins' && candidate.inheritance?.unlisted_r4_field_reinterpretation === false && same(candidate.inheritance?.replaced_sections, r5ReplacementSections))
  assert('implementation and external authority remain closed', same(candidate.authority?.closed, ['adapter_implementation', 'runtime_connection', 'supabase_change', 'customer_data', 'external_research', 'model_call', 'external_send', 'deployment', 'merge', 'release', 'legacy_backend_deletion']))
  assert('scope remains honest', candidate.scope?.verified_headless_kernel_seam === true && ['leader_final_business_call', 'accepted_brain_learning', 'complete_portable_release', 'customer_messaging', 'continuing_relationship', 'intelligence', 'comprehension', 'delight', 'value'].every(key => candidate.scope?.[key] === false))
  assert('lifecycle recorder joins the closed workload universe only', same(candidate.workload_capability_class_override?.effective_values, ['selector_executor', 'intervention_compiler', 'release_compiler', 'enrichment_planner', 'enrichment_worker', 'delivery_worker', 'outbox_lease_reaper', 'provider_reconciler', 'lifecycle_authority_recorder']) && candidate.workload_capability_class_override?.all_other_r4_workload_principal_fields_unchanged === true && candidate.workload_capability_class_override?.new_class_authority === 'may_only_combine_matching_current_human_lifecycle_actions_into_joint_receipt' && candidate.workload_capability_class_override?.new_class_grant_source === 'current_case_workload_grants_set')

  assert('release use result is exact two-way union', candidate.release_use?.schema_version === 'ctrl.g24.result.use-release.r5.v1' && candidate.release_use?.discriminator === 'standing' && candidate.release_use?.additional_properties === false && same(Object.keys(candidate.release_use?.variants ?? {}), ['pending_delivery', 'invalidated_before_use']))
  assert('pending delivery writes exact release and outbox effects', same(candidate.release_use?.variants?.pending_delivery?.exact_keys, ['standing', 'release_use_receipt_ref', 'outbox_effect_ref']) && same(candidate.release_use?.variants?.pending_delivery?.required, ['standing', 'release_use_receipt_ref', 'outbox_effect_ref']) && candidate.release_use?.variants?.pending_delivery?.additional_properties === false && same(candidate.release_use?.variants?.pending_delivery?.write_set, ['release_use_receipt', 'outbox_effect']))
  const invalidated = candidate.release_use?.variants?.invalidated_before_use
  assert('invalidated result is closed and non-delivering', invalidated?.additional_properties === false && same(invalidated?.exact_keys, invalidated?.required) && invalidated?.properties?.standing?.const === 'invalidated_before_use' && invalidated?.properties?.delivery_eligible?.const === false && invalidated?.properties?.outbox_created?.const === false)
  assert('invalidated write set and forbidden effects exact', same(invalidated?.write_set, ['release_projection_invalidation_receipt']) && same(invalidated?.forbidden_write_set, ['release_use_receipt', 'outbox_effect', 'approval_receipt', 'delivery_receipt']))
  assert('release selection and rebuild safety exact', candidate.release_use?.selection === 'if_any_bound_controlling_watermark_differs_choose_invalidated_before_use_else_pending_delivery' && candidate.release_use?.selection_precedes_generic_snapshot_changed_hold_for_use_release === true && candidate.release_use?.concurrent_controlling_watermark_change === 'serializable_attempt_retries_then_selects_invalidated_before_use_against_current_state' && candidate.release_use?.unrelated_lineage_change_invalidates === false && candidate.release_use?.rebuild_confers_use_or_delivery_authority === false)
  const invalidationReceipt = candidate.release_use?.invalidation_receipt_schema
  assert('invalidation receipt keyset and properties exact', invalidationReceipt?.additional_properties === false && same(invalidationReceipt?.exact_keys, invalidationReceipt?.required) && same(invalidationReceipt?.exact_keys, Object.keys(invalidationReceipt?.properties ?? {})) && invalidationReceipt?.properties?.receipt_fingerprint?.type === 'sha256' && invalidationReceipt?.append_only === true && invalidationReceipt?.atomic_with_use_result === true)
  assert('effective evaluator ABI exports the R5 release result', candidate.evaluator_abi_override?.operation_result_exports?.use_release === candidate.release_use?.schema_version && candidate.evaluator_abi_override?.all_other_r4_operation_result_exports_unchanged === true && candidate.evaluator_abi_override?.all_r4_proof_family_exports_unchanged === true && candidate.evaluator_abi_override?.decoded_proof_payload_exports_added === 'one_closed_payload_schema_for_every_proof_decoded_field_binding' && candidate.evaluator_abi_override?.manifest_canonical_bytes_cover_r5_overrides_and_all_decoded_payload_exports === true && candidate.evaluator_abi_override?.manifest_sha256_recomputed_from_effective_r5_manifest === true && candidate.evaluator_abi_override?.worker_attestation_must_match_effective_r5_manifest === true)

  assert('thirteen set seals exact', same(candidate.set_seals, r5SetSeals))
  assert('identity projection universe and order exact', same(Object.keys(candidate.set_member_identity_projections ?? {}), r5SetSeals) && r5SetSeals.every(name => same(candidate.set_member_identity_projections?.[name], r5IdentityProjections[name])))
  assert('identity frame exact', candidate.set_member_identity_encoding?.domain_ascii === 'CTRL-G24-SET-MEMBER-IDENTITY-R5' && candidate.set_member_identity_encoding?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && same(candidate.set_member_identity_encoding?.preimage_order, ['domain_ascii', 'set_kind_framed', 'ordered_projection_values_framed']) && same(candidate.set_member_identity_encoding?.member_entry_order, ['identity_bytes_framed', 'raw_complete_record_sha256']))
  assert('duplicate identity behavior exact', candidate.set_member_identity_encoding?.duplicate_identity_same_bytes === 'invalid_no_seal' && candidate.set_member_identity_encoding?.duplicate_identity_different_bytes === 'invalid_no_seal' && candidate.set_member_identity_encoding?.missing_extra_null_noncanonical_or_unsupported_projection_field === 'invalid_no_seal')
  assert('R5 seal frame includes member identity', candidate.set_seal_encoding?.domain_ascii === 'CTRL-G24-SET-SEAL-R5' && candidate.set_seal_encoding?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && same(candidate.set_seal_encoding?.preimage_order, ['domain_ascii', 'set_kind_framed', 'set_schema_version_framed', 'owner_lineage_version_framed', 'uint64_big_endian_member_count', 'sorted_unique_member_entries']) && candidate.set_seal_encoding?.member_entry_ref === 'set_member_identity_encoding.member_entry_order')
  assert('snapshot binary preimage exact', candidate.snapshot?.domain_ascii === 'CTRL-G24-TRUSTED-SNAPSHOT-R5' && candidate.snapshot?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && candidate.snapshot?.hash_encoding === '32_raw_bytes_from_lowercase_hex_sha256' && candidate.snapshot?.integer_encoding === 'uint64_big_endian' && same(candidate.snapshot?.preimage_order, ['domain_ascii', 'operation_id_framed', 'operation_class_framed', 'request_fingerprint_raw', 'intent_fingerprint_raw', 'stable_principal_ref_framed', 'principal_authority_version_framed', 'thirteen_set_seal_objects_in_fixed_order', 'case_scope_version_framed', 'engagement_version_framed', 'plan_version_framed']))
  assert('snapshot uses all sets and scalars', candidate.snapshot?.set_order_ref === 'set_seals' && same(candidate.snapshot?.scalar_order, ['case_scope_version', 'engagement_version', 'plan_version']) && candidate.snapshot_and_cas?.every_operation_set_seals_ref === 'set_seals' && same(candidate.snapshot_and_cas?.every_operation_scalar_versions, ['case_scope_version', 'engagement_version', 'plan_version']) && candidate.snapshot_and_cas?.same_snapshot_and_final_cas_bytes === true)
  assert('snapshot CAS and grant revocation exact', candidate.snapshot?.final_compare_and_swap === 'recompute_exact_preimage_in_same_serializable_transaction_and_require_byte_equality' && candidate.snapshot?.any_set_or_scalar_change === 'snapshot_changed_hold' && candidate.snapshot?.aggregate_aliases_allowed === false && candidate.snapshot?.set_or_scalar_omission_allowed === false && candidate.snapshot?.grant_mutation_rule === 'operator_grants_or_workload_grants_change_advances_case_scope_version_in_same_authority_mutation')

  assert('operation registry unique key exact', same(candidate.operation_registry?.unique_key, ['workspace_ref', 'operation_id']) && same(candidate.operation_registry?.first_admission_bindings, ['stable_principal_ref', 'case_derived_subject', 'requested_case_ref', 'operation_class', 'request_fingerprint', 'intent_fingerprint']) && candidate.operation_registry?.same_key_different_binding === 'operation_identity_conflict_hold' && candidate.operation_registry?.credential_instance_part_of_identity === false)
  assert('serialization exhaustion has one noncommitting result', candidate.operation_registry?.serialization_exhaustion?.result === 'request_rejected' && candidate.operation_registry?.serialization_exhaustion?.code === 'service_temporarily_unavailable' && candidate.operation_registry?.serialization_exhaustion?.operation_registry_row === false && candidate.operation_registry?.serialization_exhaustion?.committed_hold === false && candidate.operation_registry?.serialization_exhaustion?.same_operation_id_may_retry === true && candidate.operation_registry?.serialization_retry_hold_exists === false)
  assert('held fingerprint covers fixed complete dependencies', candidate.held_evaluation_fingerprint?.domain_ascii === 'CTRL-G24-HELD-EVALUATION-R5' && same(candidate.held_evaluation_fingerprint?.preimage_order, ['domain_ascii', 'workspace_ref_framed', 'operation_id_framed', 'operation_class_framed', 'request_fingerprint_raw', 'intent_fingerprint_raw', 'hold_code_framed', 'thirteen_dependency_slots_in_set_order', 'three_scalar_slots_in_scalar_order']) && candidate.held_evaluation_fingerprint?.dependency_slots_ref === 'set_seals' && same(candidate.held_evaluation_fingerprint?.scalar_slots, ['case_scope_version', 'engagement_version', 'plan_version']) && candidate.held_evaluation_fingerprint?.slot_omission_allowed === false)
  assert('held invalid sentinel is domain separated per set', candidate.held_evaluation_fingerprint?.invalid_or_unavailable_slot?.domain_ascii === 'CTRL-G24-HELD-DEPENDENCY-SENTINEL-R5' && same(candidate.held_evaluation_fingerprint?.invalid_or_unavailable_slot?.preimage_order, ['domain_ascii', 'set_kind_framed', 'literal_invalid_or_unavailable_framed']) && candidate.held_evaluation_fingerprint?.invalid_or_unavailable_slot?.digest === 'sha256_of_exact_preimage')

  assert('proof genesis exact', candidate.proof_lineage?.genesis?.domain_ascii === 'CTRL-G24-PROOF-GENESIS-R5' && same(candidate.proof_lineage?.genesis?.preimage_order, ['domain_ascii', 'owner_family_framed']) && candidate.proof_lineage?.genesis?.digest === 'sha256_of_exact_preimage')
  assert('proof append exact', candidate.proof_lineage?.append?.domain_ascii === 'CTRL-G24-PROOF-CHAIN-R5' && same(candidate.proof_lineage?.append?.preimage_order, ['domain_ascii', 'owner_family_framed', 'predecessor_chain_tip_raw', 'canonical_record_fingerprint_raw', 'uint64_big_endian_append_ordinal']) && candidate.proof_lineage?.append?.first_predecessor === 'family_genesis' && candidate.proof_lineage?.append?.ordinal_starts_at === 1 && candidate.proof_lineage?.append?.ordinal_must_equal_exact_next === true)
  assert('proof bundle digest exact', candidate.proof_bundle?.domain_ascii === 'CTRL-G24-PROOF-BUNDLE-R5' && candidate.proof_bundle?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && same(candidate.proof_bundle?.preimage_order, ['domain_ascii', 'owner_family_framed', 'common_canonical_bytes_sha256_raw', 'extension_canonical_bytes_sha256_raw']) && candidate.proof_bundle?.canonical_json_grammar === 'r3_canonical_json_utf8')
  assert('decoded proof bytes are cryptographically and semantically bound', candidate.proof_bundle?.base64url_decoding_required_before_use === true && candidate.proof_bundle?.decoded_bytes_must_parse_as_declared_closed_schema === true && candidate.proof_bundle?.decoded_bytes_must_recanonicalize_byte_equal === true && candidate.proof_bundle?.decoded_canonical_record_sha256_must_equal_declared_fingerprint === true && candidate.proof_bundle?.common_and_extension_must_agree === true && same(candidate.proof_bundle?.required_common_equalities, ['workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'predecessor_chain_tip']) && candidate.proof_bundle?.required_authoritative_equalities?.includes('canonical_record_fingerprint'))
  const decoded = candidate.decoded_proof_record_envelope
  assert('decoded proof record envelope exact', decoded?.additional_properties === false && same(decoded?.exact_keys, decoded?.required) && same(decoded?.exact_keys, Object.keys(decoded?.properties ?? {})) && decoded?.properties?.authoritative_record_fingerprint?.type === 'sha256' && decoded?.canonical_bytes === 'r3_canonical_json_utf8' && decoded?.all_common_fields_equal_bundle_common === true && decoded?.record_ref_kind_and_fingerprint_equal_authoritative_row === true && decoded?.payload_equal_authoritative_row_projection === true)
  assert('every encoded proof field has an authoritative decoded binding', same(Object.keys(candidate.proof_decoded_field_bindings ?? {}), r4ProofFamilies) && r4ProofFamilies.every(family => same(Object.keys(candidate.proof_decoded_field_bindings?.[family] ?? {}), r5DecodedFieldNames[family]) && Object.entries(candidate.proof_decoded_field_bindings[family]).every(([field, binding]) => field.endsWith('_bytes_b64url') && Array.isArray(binding) && binding.length === 2)))
  assert('proof family semantic binding universe exact', same(Object.keys(candidate.proof_family_semantic_bindings ?? {}), r4ProofFamilies) && r4ProofFamilies.every(name => Array.isArray(candidate.proof_family_semantic_bindings?.[name]) && candidate.proof_family_semantic_bindings[name].length >= 3))

  assert('fresh and replay authority are separated', same(candidate.authority_phases?.fresh_execution_checks, ['current_authentication', 'current_exact_operation_authority', 'current_case_equality', 'current_operator_and_workload_grants', 'current_unconsumed_joint_lifecycle_receipt_when_required']) && same(candidate.authority_phases?.replay_disclosure_checks, ['current_authentication', 'stable_principal_current_case_eligibility', 'stable_principal_current_audience_eligibility', 'retention_eligibility']) && candidate.authority_phases?.replay_reruns_fresh_execution_authority === false && candidate.authority_phases?.replay_mutates === false && candidate.authority_phases?.replay_current_standing === false)
  const action = candidate.lifecycle_authority?.action_schema
  assert('lifecycle action receipt exact', action?.additional_properties === false && same(action?.exact_keys, action?.required) && same(action?.exact_keys, Object.keys(action?.properties ?? {})) && action?.properties?.actor_class?.values?.includes('named_leader') && action?.properties?.actor_class?.values?.includes('krish_operator') && action?.separately_authenticated === true && action?.append_only === true)
  const joint = candidate.lifecycle_authority?.joint_receipt_schema
  assert('joint lifecycle receipt exact', joint?.additional_properties === false && joint?.exact_keys?.length === 18 && joint?.required?.length === 17 && same(joint?.optional, ['consumed_at']) && same(joint?.exact_keys, Object.keys(joint?.properties ?? {})) && joint?.properties?.leader_action_fingerprint?.type === 'sha256' && joint?.properties?.operator_action_fingerprint?.type === 'sha256' && joint?.properties?.receipt_fingerprint?.type === 'sha256')
  assert('joint receipt issuance and consumption exact', same(joint?.combine_requires, ['exactly_one_current_leader_action', 'exactly_one_current_operator_action', 'same_case_ref', 'same_transition_id', 'same_predecessor_lifecycle_version', 'actors_equal_current_case_bindings', 'authority_versions_equal_current_case_bindings', 'both_actions_unexpired', 'current_lifecycle_authority_recorder_grant']) && joint?.recorder_can_invent_human_authority === false && joint?.consumed_at_must_be_absent_before_fresh_execution === true && joint?.consume_atomically_with_transition === true)
  assert('lifecycle recorder cannot grant or execute', candidate.lifecycle_authority?.recorder_workload?.capability_class === 'lifecycle_authority_recorder' && candidate.lifecycle_authority?.recorder_workload?.stable_workload_must_match_current_case_grant === true && candidate.lifecycle_authority?.recorder_workload?.can_execute_transition === false)
  assert('lifecycle issuance protocol is explicit and server resolved', same(Object.keys(candidate.lifecycle_authority?.issuance_protocol ?? {}), ['leader_action', 'operator_action', 'combine', 'each_step_serializable', 'caller_supplied_actor_or_authority_version', 'server_resolves_current_actor_authority_and_time', 'failed_step_writes', 'joint_receipt_single_use']) && candidate.lifecycle_authority?.issuance_protocol?.leader_action?.authenticated_principal === 'current_named_leader_human_session' && candidate.lifecycle_authority?.issuance_protocol?.operator_action?.authenticated_principal === 'current_engagement_operator_human_session' && candidate.lifecycle_authority?.issuance_protocol?.combine?.authenticated_principal === 'current_lifecycle_authority_recorder_workload' && candidate.lifecycle_authority?.issuance_protocol?.each_step_serializable === true && candidate.lifecycle_authority?.issuance_protocol?.caller_supplied_actor_or_authority_version === false && candidate.lifecycle_authority?.issuance_protocol?.server_resolves_current_actor_authority_and_time === true && candidate.lifecycle_authority?.issuance_protocol?.failed_step_writes === false && candidate.lifecycle_authority?.issuance_protocol?.joint_receipt_single_use === true)
  assert('edited approval visibility exact', same(candidate.edited_approval_visibility?.write_order, ['new_immutable_intervention_atom_version', 'new_visible_effect_receipt_bound_to_new_atom', 'new_approval_receipt_bound_to_new_atom']) && same(candidate.edited_approval_visibility?.binding_fields, ['intervention_atom_ref', 'intervention_atom_version', 'intervention_atom_content_fingerprint']) && candidate.edited_approval_visibility?.same_binding_required_for_visibility_and_approval === true && candidate.edited_approval_visibility?.pre_edit_visibility_receipt_reuse_allowed === false && candidate.edited_approval_visibility?.result_returns_new_visibility_receipt_ref === true)

  assert('limit order is inherited complete order', same(candidate.limit_order, r4LimitOrder))
  assert('all request-owned byte limits are pre-admission', same(Object.keys(candidate.limit_phase_overrides ?? {}), ['request_bytes', 'intent_bytes', 'answer_text_bytes', 'note_bytes', 'serialization_retries']) && ['request_bytes', 'intent_bytes', 'answer_text_bytes', 'note_bytes'].every(name => candidate.limit_phase_overrides?.[name]?.phase === 'pre_admission_canonical' && candidate.limit_phase_overrides[name].operation_registry_row === false && candidate.rejection_codes_added?.includes(candidate.limit_phase_overrides[name].failure)))
  assert('serialization limit is noncommitting service unavailable', candidate.limit_phase_overrides?.serialization_retries?.phase === 'pre_commit_transaction' && candidate.limit_phase_overrides?.serialization_retries?.failure === 'service_temporarily_unavailable' && candidate.limit_phase_overrides?.serialization_retries?.operation_registry_row === false)
  assert('removed ambiguous hold codes exact', same(candidate.hold_codes_removed, ['request_bytes_hold', 'intent_bytes_hold', 'answer_text_bytes_hold', 'note_bytes_hold', 'serialization_retry_hold']))
  assert('effective rejection codes are closed and unique', same(candidate.effective_rejection_codes, [...r4.rejection_codes, 'request_bytes_exceeded', 'intent_bytes_exceeded', 'answer_text_bytes_exceeded', 'note_bytes_exceeded']) && candidate.effective_rejection_codes.length === new Set(candidate.effective_rejection_codes).size)
  assert('effective hold codes remove every ambiguous outcome', same(candidate.effective_hold_codes, r4.hold_codes.filter(code => !candidate.hold_codes_removed.includes(code))) && candidate.effective_hold_codes.length === new Set(candidate.effective_hold_codes).size)
  assert('limit semantics produce one outcome', candidate.limit_semantics?.r3_max_annotations_consumed_only_by_r5_admission_engine === true && candidate.limit_semantics?.independent_schema_failure_from_r3_max_annotations === false && candidate.limit_semantics?.request_owned_content_limits_complete_before_admission === true && candidate.limit_semantics?.state_and_execution_limits_commit_hold_after_admission === true && candidate.limit_semantics?.first_failure_in_total_order_wins === true && candidate.limit_semantics?.one_input_one_limit_outcome === true && candidate.limit_semantics?.side_effect_before_all_applicable_limits_pass === false)

  const reservation = candidate.outbox_attempt?.reservation_schema
  assert('outbox attempt reservation schema exact', reservation?.additional_properties === false && reservation?.exact_keys?.length === 12 && reservation?.required?.length === 11 && same(reservation?.optional, ['outcome']) && same(reservation?.exact_keys, Object.keys(reservation?.properties ?? {})) && reservation?.properties?.attempt_ordinal?.maximum === 3)
  assert('outbox attempt outcome is discriminated', same(reservation?.properties?.state?.values, ['reserved', 'confirmed', 'definitively_failed', 'ambiguous']) && same(reservation?.cross_field_rules, ['outcome_absent_iff_state_reserved', 'outcome_required_iff_state_confirmed_definitively_failed_or_ambiguous', 'state_confirmed_requires_matching_provider_success_evidence']))
  assert('outbox attempts commit and count before call', same(candidate.outbox_attempt?.unique_key, ['outbox_effect_ref', 'attempt_ordinal']) && same(candidate.outbox_attempt?.reserve_cas_writes, ['attempt_reservation', 'committed_attempt_count_increment']) && candidate.outbox_attempt?.reservation_commits_before_provider_call === true && candidate.outbox_attempt?.provider_call_requires_reread_of_committed_reservation === true && candidate.outbox_attempt?.each_retry_requires_new_reservation === true)
  assert('crashes and leases cannot evade three-attempt ceiling', candidate.outbox_attempt?.crash_after_reservation_consumes_attempt === true && candidate.outbox_attempt?.lease_or_worker_change_resets_attempt_count === false && candidate.outbox_attempt?.maximum_committed_reservations === 3 && candidate.outbox_attempt?.provider_call_at_or_above_maximum === false)
  assert('ambiguous outcome rules exact', candidate.outbox_attempt?.ambiguous_without_current_idempotency_guarantee === 'unknown_no_automatic_resend' && candidate.outbox_attempt?.ambiguous_with_current_idempotency_guarantee_below_maximum === 'may_reserve_exact_next_attempt' && candidate.outbox_attempt?.ambiguous_with_current_idempotency_guarantee_at_maximum === 'unknown_no_automatic_resend')
  const success = candidate.provider_success_evidence_schema
  assert('provider success evidence schema exact', success?.additional_properties === false && same(success?.exact_keys, success?.required) && same(success?.exact_keys, Object.keys(success?.properties ?? {})) && success?.properties?.provider_receipt_bytes_fingerprint?.type === 'sha256' && success?.must_match_current_attempt_reservation === true && success?.only_evidence_allowing_confirmed === true)

  assert('negative fixture families exact', same(candidate.required_negative_fixture_families, ['release_use_invalidation', 'thirteen_set_snapshot_and_cas', 'set_member_identity_projection', 'registry_unique_key_and_exhaustion', 'complete_hold_fingerprint', 'proof_lineage_and_semantic_bytes', 'fresh_execution_vs_replay_disclosure', 'two_party_action_and_joint_receipts', 'edited_approval_visibility', 'single_limit_outcome', 'durable_outbox_attempt_reservation', 'provider_success_evidence']))
  assert('claim remains local and unimplemented', candidate.claim_limit === 'unimplemented_local_repair_contract_only')
  return found
}

for (const failure of collectR5Failures(r5)) failures.push(`R5 ${failure}`)

const r5MutationProbes = [
  ['release invalidation outbox', candidate => { candidate.release_use.variants.invalidated_before_use.properties.outbox_created.const = true }],
  ['release invalidation race precedence', candidate => { candidate.release_use.selection_precedes_generic_snapshot_changed_hold_for_use_release = false }],
  ['release invalidation receipt schema', candidate => { delete candidate.release_use.invalidation_receipt_schema.properties.receipt_fingerprint }],
  ['release evaluator export', candidate => { candidate.evaluator_abi_override.operation_result_exports.use_release = 'ctrl.g24.result.use-release.r4.v1' }],
  ['lifecycle recorder workload universe', candidate => candidate.workload_capability_class_override.effective_values.pop()],
  ['grant seal omitted', candidate => candidate.set_seals.pop()],
  ['snapshot principal authority version', candidate => candidate.snapshot.preimage_order.splice(6, 1)],
  ['set member identity projection', candidate => { candidate.set_member_identity_projections.evaluator_registry = ['evaluator_id'] }],
  ['duplicate identity accepted', candidate => { candidate.set_member_identity_encoding.duplicate_identity_different_bytes = 'accepted' }],
  ['registry unique scope', candidate => { candidate.operation_registry.unique_key = ['operation_id'] }],
  ['serialization second outcome', candidate => { candidate.operation_registry.serialization_exhaustion.committed_hold = true }],
  ['hold dependency omission', candidate => { candidate.held_evaluation_fingerprint.slot_omission_allowed = true }],
  ['proof genesis', candidate => { candidate.proof_lineage.genesis.domain_ascii = 'generic' }],
  ['proof bundle frame', candidate => candidate.proof_bundle.preimage_order.pop()],
  ['proof canonical fingerprint bypass', candidate => { candidate.proof_bundle.decoded_canonical_record_sha256_must_equal_declared_fingerprint = false }],
  ['decoded proof envelope authority', candidate => { candidate.decoded_proof_record_envelope.record_ref_kind_and_fingerprint_equal_authoritative_row = false }],
  ['decoded proof field binding', candidate => { delete candidate.proof_decoded_field_bindings.answer.answer_receipt_bytes_b64url }],
  ['replay reruns execution authority', candidate => { candidate.authority_phases.replay_reruns_fresh_execution_authority = true }],
  ['lifecycle required field deletion', candidate => candidate.lifecycle_authority.joint_receipt_schema.required.splice(0, 1)],
  ['lifecycle exact key deletion', candidate => candidate.lifecycle_authority.joint_receipt_schema.exact_keys.splice(0, 1)],
  ['lifecycle issuance server authority', candidate => { candidate.lifecycle_authority.issuance_protocol.caller_supplied_actor_or_authority_version = true }],
  ['edited visibility reuse', candidate => { candidate.edited_approval_visibility.pre_edit_visibility_receipt_reuse_allowed = true }],
  ['request limit changed to hold', candidate => { candidate.limit_phase_overrides.answer_text_bytes.phase = 'post_admission_canonical' }],
  ['removed hold code restored', candidate => candidate.effective_hold_codes.push('serialization_retry_hold')],
  ['outbox provider key changed on retry', candidate => { candidate.outbox_attempt.each_retry_requires_new_reservation = false }],
  ['outbox attempt commit removed', candidate => { candidate.outbox_attempt.reservation_commits_before_provider_call = false }],
  ['provider success fingerprint weakened', candidate => { candidate.provider_success_evidence_schema.properties.provider_receipt_bytes_fingerprint.type = 'boolean' }],
]
for (const [name, mutate] of r5MutationProbes) {
  const candidate = structuredClone(r5)
  mutate(candidate)
  check(`R5 mutation rejected: ${name}`, collectR5Failures(candidate).length > 0)
}

check('R5 human and machine agree on release invalidation', r5Human.includes('invalidated_before_use') && r5.release_use.variants.invalidated_before_use.properties.outbox_created.const === false)
check('R5 human and machine agree on thirteen seals', r5Human.includes('thirteen set seals') && r5.set_seals.length === 13)
check('R5 human and machine agree on fresh versus replay authority', r5Human.includes('Replay never reruns those one-time execution predicates') && r5.authority_phases.replay_reruns_fresh_execution_authority === false)
check('R5 human and machine agree on durable provider attempts', r5Human.includes('reservation and increment commit before the network call') && r5.outbox_attempt.reservation_commits_before_provider_call === true)
check('R5 QA preserves implementation limit', r5Qa.includes('No code, endpoint, database function, schema, role, proof bridge, outbox, provider call, customer data path or runtime connection implements R5'))
check('R5 files contain no em dash', !r5Human.includes(emDash) && !r5Qa.includes(emDash))

if (failures.length) {
  console.error(`G24 trusted ingress R5 failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: rejected R2 through R4 preserved; G24 trusted ingress R5 invariants and mutation probes verified')
