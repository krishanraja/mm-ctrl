import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR6Output, materializedR6Path } from './materialize-ctrl-g24-trusted-ingress-r6.mjs'

const root = process.cwd()
const readBytes = relative => readFileSync(join(root, relative))
const read = relative => readBytes(relative).toString('utf8')
const sha256 = relative => createHash('sha256').update(readBytes(relative)).digest('hex')
const parse = relative => JSON.parse(read(relative))
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const paths = {
  human: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r6.md',
  machine: materializedR6Path,
  qa: 'project-documentation/ctrl-evolution/g24-trusted-ingress-r6-qa-record.md',
  r5Human: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r5.md',
  r5Machine: 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r5.json',
  r5Qa: 'project-documentation/ctrl-evolution/g24-trusted-ingress-r5-qa-record.md',
}
const human = read(paths.human)
const r6 = parse(paths.machine)
const qa = read(paths.qa)

const operationNames = [
  'select_intervention', 'create_intervention', 'stage_intervention_edit', 'record_intervention_visibility',
  'approve_intervention', 'record_answer', 'correct_answer', 'record_answer_transcription_repair',
  'record_leader_lifecycle_action', 'record_operator_lifecycle_action', 'combine_lifecycle_authority',
  'apply_lifecycle_transition', 'compile_release', 'use_release', 'create_enrichment_plan', 'record_enrichment_attempt',
]
const setSeals = [
  'control_universe', 'applicable_controls', 'control_closure_edges', 'visible_sources', 'visible_assertions',
  'accepted_brain_items', 'accepted_brain_relationships', 'route_capability_registry', 'receipt_chain_tips',
  'evaluator_registry', 'provider_capability_registry', 'operator_grants', 'workload_grants',
]
const proofFamilies = ['selector_result', 'intervention_approval', 'answer', 'correction', 'lifecycle', 'pending_release_and_authority', 'enrichment_plan', 'execution_receipt']
const watermarkKinds = [
  'identity_version', 'subject_version', 'workspace_version', 'authority_version', 'permission_version',
  'audience_version', 'purpose_version', 'sensitivity_version', 'validity_version', 'retention_state_version',
  'lifecycle_version', 'accepted_decision_frame_version', 'decision_requirement_version', 'evidence_coverage_version',
  'trusted_cutoff', 'epistemic_policy_version', 'independent_challenger_result_version', 'canonical_source_versions',
  'canonical_assertion_versions', 'canonical_brain_versions',
]

function exactClosedSchema(schema, requiredKeys = schema?.exact_keys) {
  return schema?.type === 'object' && schema?.additional_properties === false && same(schema?.exact_keys, requiredKeys) && same(Object.keys(schema?.properties ?? {}), schema?.exact_keys)
}

function validFingerprintRule(rule, domain, fields) {
  return rule?.domain_ascii === domain &&
    rule?.variable_field_frame === 'uint32_big_endian_byte_length_then_field_bytes' &&
    rule?.field_encoding === 'schema_type_canonical_bytes' &&
    rule?.hash_field_encoding === '32_raw_bytes_from_lowercase_hex_sha256' &&
    rule?.integer_encoding === 'uint64_big_endian' &&
    rule?.optional_absent_encoding === 'uint32_big_endian_length_zero_with_no_value_bytes' &&
    same(rule?.preimage_order, ['domain_ascii', ...fields]) &&
    rule?.fingerprint_field_excluded_from_preimage === true &&
    rule?.digest === 'sha256_of_exact_preimage'
}

function collectFailures(candidate) {
  const found = []
  const assert = (name, condition) => {
    if (!condition) found.push(name)
  }

  assert('effective identity exact', candidate.schema_version === 'ctrl.g24.trusted-ingress.r6.effective.v1' && candidate.status === 'fifth_repair_candidate_under_independent_review' && candidate.claim_limit === 'unimplemented_local_effective_contract_only')
  assert('R5 frozen predecessor exact', candidate.supersedes?.commit === '32b378582c18316ac3fb156ae82df60b3f29bb9b' && candidate.supersedes?.tree === '05a29d2d038700d9e8b5c2b6509ad68bb797369b' && candidate.supersedes?.human_blob === '80a6ca30e17fcf98cb137f272aeeda83b046dcb3' && candidate.supersedes?.machine_blob === 'b20653edc02055b7253cc86261a849f9ec416b5e' && candidate.supersedes?.qa_blob === '821e0e3e069e90f6d2bfcd1905eae79cc18980b5' && candidate.supersedes?.checker_blob === 'c60650832d5b693ad44446fb5f2ee3ba8acdc3f1' && candidate.supersedes?.adjudication === 'veto')
  assert('machine document is the only effective authority', candidate.materialization?.authority === 'this_complete_generated_effective_document' && candidate.materialization?.conceptual_overlay_allowed === false && candidate.materialization?.runtime_inheritance_allowed === false && candidate.materialization?.generated_document_must_equal_generator_output_byte_for_byte === true && candidate.resolution?.effective_contract_is_fully_materialized === true && candidate.resolution?.no_runtime_merge_or_inheritance === true)
  assert('historical source bytes exact', candidate.materialization?.historical_inputs?.r3_sha256 === 'd20eb7930836cad1dd42fec67c853ee2571baf348cb335317a7509f3700e9db7' && candidate.materialization?.historical_inputs?.r4_sha256 === '4ff8bc3748deda96f94c2fac0ad5b698bd38200ce814b268c848ed8290973d59')
  assert('external authority closed', same(candidate.authority?.closed, ['adapter_implementation', 'runtime_connection', 'supabase_change', 'customer_data', 'external_research', 'model_call', 'external_send', 'deployment', 'merge', 'release', 'legacy_backend_deletion']))
  assert('scope honest', candidate.scope?.verified_headless_kernel_seam === true && ['leader_final_business_call', 'accepted_brain_learning', 'complete_portable_release', 'customer_messaging', 'continuing_relationship', 'intelligence', 'comprehension', 'delight', 'value'].every(key => candidate.scope?.[key] === false))

  assert('canonical grammar fully materialized', candidate.canonical_grammar?.domain_prefix === 'CTRL-G24-INGRESS-R3' && candidate.base_types?.source === 'materialized_from_exact_r3_canonical_grammar' && candidate.base_types?.identifier?.max_utf8_bytes === 256 && candidate.base_types?.human_text?.preserve_exact_value === true && candidate.request_schema?.additional_properties === false)
  assert('sixteen operations exact everywhere', same(candidate.operation_names, operationNames) && same(Object.keys(candidate.operation_specs ?? {}), operationNames) && same(Object.keys(candidate.operation_authority ?? {}), operationNames) && same(Object.keys(candidate.result_payload_schemas ?? {}), operationNames) && same(Object.keys(candidate.evaluator_abi?.operation_result_exports ?? {}), operationNames) && same(Object.keys(candidate.snapshot_and_cas_by_operation ?? {}), operationNames))
  assert('request operation enum exact', same(candidate.request_schema?.properties?.operation_class?.values, operationNames))
  assert('every operation has closed intent, result, idempotency and effects', operationNames.every(name => {
    const spec = candidate.operation_specs?.[name]
    const result = candidate.result_payload_schemas?.[name]
    return spec?.intent?.additional_properties === false && same(Object.keys(spec.intent.properties ?? {}), spec.intent.exact_keys) && spec.intent.required.every(key => spec.intent.exact_keys.includes(key)) && (spec.intent.optional ?? []).every(key => spec.intent.exact_keys.includes(key)) && spec?.idempotency_scope === 'workspace_ref_and_operation_id' && Array.isArray(spec?.read_set) && Array.isArray(spec?.write_set) && spec?.result_schema === result?.schema_version && candidate.evaluator_abi.operation_result_exports[name] === result?.schema_version
  }))
  assert('workload universe includes only exact recorder addition', same(candidate.principal_schemas?.workload_identity?.properties?.capability_class?.values, ['selector_executor', 'intervention_compiler', 'release_compiler', 'enrichment_planner', 'enrichment_worker', 'delivery_worker', 'outbox_lease_reaper', 'provider_reconciler', 'lifecycle_authority_recorder']) && candidate.workload_authority_predicates?.workload_lifecycle_authority_recorder_predicate?.permitted_operation === 'combine_lifecycle_authority' && candidate.workload_authority_predicates?.workload_lifecycle_authority_recorder_predicate?.can_invent_human_authority === false && candidate.workload_authority_predicates?.workload_lifecycle_authority_recorder_predicate?.can_execute_transition === false)

  assert('edit is staged and cannot self-approve', candidate.approval_effects?.edit_and_approve_in_one_operation_allowed === false && same(candidate.approval_effects?.staged_edit_flow, ['stage_intervention_edit_commits_new_nonapproved_atom', 'record_intervention_visibility_commits_receipt_after_same_operator_is_presented_exact_atom', 'later_approve_intervention_consumes_exact_unconsumed_visibility_receipt']) && candidate.operation_specs?.stage_intervention_edit?.forbidden_write_set?.includes('approval_receipt') && candidate.operation_specs?.stage_intervention_edit?.forbidden_write_set?.includes('visible_effect_receipt'))
  assert('approval decision no longer contains edit', same(candidate.operation_specs?.approve_intervention?.intent?.properties?.decision?.values, ['approve', 'hold', 'suppress']) && same(Object.keys(candidate.result_payload_schemas?.approve_intervention?.variants ?? {}), ['approved', 'held_without_approval', 'suppressed_without_approval']))
  assert('visibility receipt is exact, single use and atom bound', candidate.intervention_visibility_receipt_schema?.additional_properties === false && same(candidate.intervention_visibility_receipt_schema?.optional, ['consumed_at']) && candidate.intervention_visibility_receipt_schema?.properties?.atom_content_fingerprint?.type === 'sha256' && candidate.intervention_visibility_receipt_schema?.consumed_once_by_exact_approval === true && same(candidate.intervention_visibility_receipt_schema?.unique_keys, [['case_ref', 'viewer_actor_ref', 'presentation_nonce']]))
  assert('approved result returns exact consumed visibility identity', candidate.result_payload_schemas?.approve_intervention?.variants?.approved?.properties?.consumed_visible_effect_receipt_ref?.type === 'identifier' && candidate.result_payload_schemas?.approve_intervention?.variants?.approved?.properties?.atom_content_fingerprint?.type === 'sha256')

  const action = candidate.lifecycle_authority?.action_schema
  const joint = candidate.lifecycle_authority?.joint_receipt_schema
  assert('lifecycle action schema exact and bounded', exactClosedSchema(action) && action?.properties?.expires_at?.type === 'canonical_timestamp' && action?.properties?.action_fingerprint?.type === 'sha256' && same(action?.unique_keys, [['case_ref', 'stable_actor_ref', 'nonce']]) && action?.ttl_seconds === 900 && action?.expires_at_derivation === 'server_issued_at_plus_exact_900_seconds' && action?.append_only === true)
  assert('joint lifecycle receipt exact and single pair', joint?.type === 'object' && joint?.additional_properties === false && same(joint?.exact_keys, Object.keys(joint?.properties ?? {})) && same(joint?.optional, ['consumed_at']) && same(joint?.unique_keys, [['leader_action_ref', 'operator_action_ref']]) && joint?.ttl_seconds === 900 && joint?.properties?.receipt_fingerprint?.type === 'sha256')
  assert('lifecycle combine is atomic and cannot reuse actions', candidate.lifecycle_authority?.combine_transaction?.isolation === 'serializable' && candidate.lifecycle_authority?.combine_transaction?.both_actions_not_previously_combined === true && candidate.lifecycle_authority?.combine_transaction?.action_pair_unique === true && candidate.lifecycle_authority?.combine_transaction?.marks_both_actions_combined_atomically === true && candidate.lifecycle_authority?.combine_transaction?.failed_combine_writes === false)
  assert('lifecycle fresh execution and replay separated', candidate.lifecycle_authority?.fresh_transition_requires_unconsumed_joint_receipt === true && candidate.lifecycle_authority?.joint_receipt_consumed_atomically_with_transition === true && candidate.lifecycle_authority?.replay_uses_disclosure_authority_not_joint_receipt === true)

  assert('registry unique key and bindings exact', same(candidate.operation_registry?.unique_key, ['workspace_ref', 'operation_id']) && same(candidate.operation_registry?.first_admission_bindings, ['stable_principal_ref', 'case_derived_subject', 'requested_case_ref', 'operation_class', 'request_fingerprint', 'intent_fingerprint']))
  assert('identity conflict is nonmutating rejection', candidate.operation_registry?.same_key_different_binding === 'request_rejected_operation_identity_conflict_without_registry_mutation_or_protected_bytes' && candidate.rejection_codes?.includes('operation_identity_conflict') && !candidate.hold_codes?.includes('operation_identity_conflict_hold'))
  assert('replay envelope preserves payload not whole response', candidate.operation_registry?.replay_payload_bytes_equal_original_commit === true && candidate.operation_registry?.replay_whole_response_bytes_equal_original_commit === false && same(candidate.operation_registry?.replay_envelope_adds, ['replayed_at', 'historical_replay', 'current_standing']) && candidate.operation_registry?.replay_current_standing === false && candidate.operation_registry?.replay_mutates === false && candidate.response_union?.replayed_success_payload_bytes_equal_original === true && candidate.response_union?.replayed_whole_response_bytes_equal_original === false && candidate.response_union?.replay_envelope_is_distinct_and_non_authoritative === true)
  assert('replay uses disclosure authority only', same(candidate.operation_registry?.replay_disclosure_checks, ['current_authentication', 'stable_principal_current_case_eligibility', 'stable_principal_current_audience_eligibility', 'retention_eligibility']) && !candidate.operation_registry.replay_disclosure_checks.includes('current_operation_authority'))
  assert('serialization exhaustion only rejects without row', candidate.operation_registry?.serialization_exhaustion?.result === 'request_rejected' && candidate.operation_registry?.serialization_exhaustion?.code === 'service_temporarily_unavailable' && candidate.operation_registry?.serialization_exhaustion?.operation_registry_row === false && candidate.operation_registry?.serialization_exhaustion?.committed_hold === false && candidate.operation_registry?.serialization_exhaustion?.same_operation_id_may_retry === true && !candidate.hold_codes?.includes('serialization_retry_hold'))

  assert('watermark universe exact, complete and extensible', same(candidate.controlling_watermarks?.base_kinds_in_canonical_order, watermarkKinds) && candidate.controlling_watermarks?.additional_kind_grammar?.prefix === 'applicable_control/' && candidate.controlling_watermarks?.additional_kind_grammar?.suffix === 'canonical_control_id_from_current_applicable_control_closure' && candidate.controlling_watermarks?.additional_kind_grammar?.unknown_or_nonapplicable_control_id === 'control_completeness_hold' && candidate.controlling_watermarks?.canonical_order === 'all_base_kinds_in_declared_order_then_additional_kinds_by_ascending_unsigned_utf8_bytes' && candidate.controlling_watermarks?.completeness === 'every_base_kind_exactly_once_and_every_current_applicable_control_id_exactly_once' && candidate.controlling_watermarks?.unknown_or_duplicate_kind === 'control_completeness_hold')
  assert('watermark member union exact', candidate.controlling_watermarks?.member_schema?.discriminator === 'kind_class' && same(Object.keys(candidate.controlling_watermarks?.member_schema?.variants ?? {}), ['base', 'applicable_control']) && exactClosedSchema(candidate.controlling_watermarks?.member_schema?.variants?.base) && exactClosedSchema(candidate.controlling_watermarks?.member_schema?.variants?.applicable_control) && same(candidate.controlling_watermarks?.member_schema?.variants?.base?.properties?.kind?.values, watermarkKinds) && same(candidate.controlling_watermarks?.member_schema?.variants?.applicable_control?.cross_field_rules, ['kind_equals_literal_applicable_control_slash_plus_control_id', 'control_id_exists_in_current_applicable_control_closure']))
  assert('watermark set fingerprint exact', candidate.controlling_watermarks?.set_fingerprint?.domain_ascii === 'CTRL-G24-CONTROLLING-WATERMARK-SET-R6' && candidate.controlling_watermarks?.set_fingerprint?.variable_field_frame === 'uint32_big_endian_byte_length_then_utf8_bytes' && same(candidate.controlling_watermarks?.set_fingerprint?.preimage_order, ['domain_ascii', 'uint64_big_endian_member_count', 'members_in_canonical_order_each_as_kind_class_kind_control_id_or_absent_lineage_ref_version_ref_framed']) && candidate.controlling_watermarks?.set_fingerprint?.complete_base_and_applicable_control_kinds_required_exactly_once === true && candidate.controlling_watermarks?.set_fingerprint?.digest === 'sha256_of_exact_preimage')
  const invalidation = candidate.release_invalidation
  assert('release invalidation precedence and comparison exact', invalidation?.selection_precedence === 'before_generic_snapshot_changed_hold_for_use_release' && invalidation?.concurrent_controlling_change === 'serializable_retry_then_reselect_against_current_state' && invalidation?.comparison === 'bound_and_current_complete_watermark_sets_by_kind_lineage_ref_and_version_ref')
  assert('projection version type consistent', candidate.result_payload_schemas?.compile_release?.properties?.projection_version_ref?.type === 'identifier' && candidate.result_payload_schemas?.use_release?.variants?.invalidated_before_use?.properties?.projection_version_ref?.type === 'identifier' && invalidation?.invalidation_receipt_schema?.properties?.projection_version_ref?.type === 'identifier')
  assert('release invalidation finality exact', same(invalidation?.invalidation_receipt_schema?.unique_keys, [['pending_projection_ref', 'projection_version_ref']]) && invalidation?.same_projection_version_after_invalidation === 'return_existing_invalidation_result_without_new_receipt_or_outbox' && same(invalidation?.invalidated_write_set, ['release_projection_invalidation_receipt']) && invalidation?.invalidated_forbidden_write_set?.includes('outbox_effect') && invalidation?.rebuild_confers_use_or_delivery_authority === false)

  assert('thirteen set universe exact', same(candidate.set_seals, setSeals) && candidate.all_eleven_set_seals === undefined && same(candidate.all_thirteen_set_seals?.exact_keys, setSeals) && same(candidate.all_thirteen_set_seals?.required, setSeals) && candidate.all_thirteen_set_seals?.additional_properties === false)
  assert('set identity projections exact universe', same(Object.keys(candidate.set_member_identity_projections ?? {}), setSeals) && setSeals.every(name => Array.isArray(candidate.set_member_identity_projections[name]) && candidate.set_member_identity_projections[name].length > 0))
  assert('set identity rejects every duplicate', candidate.set_member_identity_encoding?.domain_ascii === 'CTRL-G24-SET-MEMBER-IDENTITY-R6' && candidate.set_member_identity_encoding?.duplicate_identity_same_bytes === 'invalid_no_seal' && candidate.set_member_identity_encoding?.duplicate_identity_different_bytes === 'invalid_no_seal')
  assert('set seal digest exact', candidate.set_seal_encoding?.domain_ascii === 'CTRL-G24-SET-SEAL-R6' && candidate.set_seal_encoding?.digest === 'sha256_of_exact_preimage' && candidate.set_seal_encoding?.member_entry_ref === 'set_member_identity_encoding.member_entry_order')
  assert('snapshot digest and preimage exact', candidate.snapshot_encoding?.domain_ascii === 'CTRL-G24-TRUSTED-SNAPSHOT-R6' && candidate.snapshot_encoding?.digest === 'sha256_of_exact_preimage' && same(candidate.snapshot_encoding?.set_order, setSeals) && candidate.snapshot_encoding?.preimage_order?.includes('principal_authority_version_framed'))
  assert('all operations snapshot and CAS all thirteen sets', operationNames.every(name => same(candidate.snapshot_and_cas_by_operation?.[name]?.set_seals, setSeals)) && candidate.snapshot_cas_rule?.snapshot_and_final_compare_and_swap_use_exact_encoding === 'snapshot_encoding' && candidate.snapshot_cas_rule?.same_serializable_transaction === true && candidate.snapshot_cas_rule?.aggregate_aliases_allowed === false)
  assert('grant mutations force scalar and seal CAS', candidate.scalar_version_rule?.grant_mutation_advances_case_scope_version_atomically === true && setSeals.includes('operator_grants') && setSeals.includes('workload_grants'))
  assert('held fingerprint has every fixed dependency', candidate.held_evaluation_fingerprint?.domain_ascii === 'CTRL-G24-HELD-EVALUATION-R6' && candidate.held_evaluation_fingerprint?.digest === 'sha256_of_exact_preimage' && same(candidate.held_evaluation_fingerprint?.dependency_slots, setSeals) && candidate.held_evaluation_fingerprint?.slot_omission_allowed === false && validFingerprintRule(candidate.held_evaluation_fingerprint?.invalid_or_unavailable_slot, 'CTRL-G24-HELD-DEPENDENCY-SENTINEL-R6', ['set_kind_framed', 'literal_invalid_or_unavailable_framed']))

  assert('proof schema universe exact', same(candidate.proof_family_names, proofFamilies) && same(Object.keys(candidate.proof_bundle_schemas?.extensions ?? {}), proofFamilies) && exactClosedSchema(candidate.proof_bundle_schemas?.common))
  assert('proof common has references not opaque bytes', same(candidate.proof_bundle_schemas?.common?.exact_keys, ['bundle_schema_version', 'owner_family', 'workspace_ref', 'subject_ref', 'case_ref', 'snapshot_fingerprint', 'canonical_record_ref', 'canonical_record_fingerprint', 'predecessor_chain_tip', 'append_ordinal', 'current_set_seals', 'append_provenance_ref', 'evaluated_at']) && !candidate.proof_bundle_schemas.common.exact_keys.some(key => key.includes('bytes_b64url')))
  assert('proof extensions closed and contain no opaque bytes', proofFamilies.every(name => exactClosedSchema(candidate.proof_bundle_schemas?.extensions?.[name]) && !candidate.proof_bundle_schemas.extensions[name].exact_keys.some(key => key.includes('bytes'))))
  assert('proof exports exact', proofFamilies.every(name => candidate.evaluator_abi?.proof_family_exports?.[name] === candidate.proof_bundle_schemas?.extensions?.[name]?.schema_version))
  assert('proof genesis and append hashes exact', validFingerprintRule(candidate.proof_lineage?.genesis, 'CTRL-G24-PROOF-GENESIS-R6', ['owner_family_framed']) && validFingerprintRule(candidate.proof_lineage?.append, 'CTRL-G24-PROOF-CHAIN-R6', ['owner_family_framed', 'predecessor_chain_tip_raw', 'canonical_record_fingerprint_raw', 'uint64_big_endian_append_ordinal']) && candidate.proof_lineage?.append?.first_predecessor === 'family_genesis' && candidate.proof_lineage?.append?.ordinal_must_equal_exact_next === true)
  assert('proof bundle digest exact', validFingerprintRule(candidate.proof_bundle_digest, 'CTRL-G24-PROOF-BUNDLE-R6', ['owner_family_framed', 'common_canonical_bytes_sha256_raw', 'extension_canonical_bytes_sha256_raw']))
  assert('proof authority is server-only and row exact', candidate.proof_authority?.caller_supplied_proof_bundle_allowed === false && candidate.proof_authority?.browser_serializable_proof_bundle_allowed === false && candidate.proof_authority?.bundle_built_server_side_from_authoritative_rows === true && candidate.proof_authority?.every_ref_and_fingerprint_resolved_in_same_transaction === true && candidate.proof_authority?.every_resolved_row_fingerprint_recomputed_and_equal === true && candidate.proof_authority?.workspace_subject_case_snapshot_and_chain_equal_across_all_rows === true && same(Object.keys(candidate.proof_authority?.extension_constraints ?? {}), proofFamilies) && proofFamilies.every(name => candidate.proof_authority.extension_constraints[name].length > 0))

  const fingerprintExpectations = {
    release_invalidation_receipt: ['CTRL-G24-RELEASE-INVALIDATION-R6', Object.keys(candidate.release_invalidation?.invalidation_receipt_schema?.properties ?? {}).filter(key => key !== 'receipt_fingerprint').map(key => `${key}_canonical`)],
    lifecycle_authority_action: ['CTRL-G24-LIFECYCLE-ACTION-R6', Object.keys(action?.properties ?? {}).filter(key => key !== 'action_fingerprint').map(key => `${key}_canonical`)],
    lifecycle_joint_authority_receipt: ['CTRL-G24-LIFECYCLE-JOINT-R6', Object.keys(joint?.properties ?? {}).filter(key => key !== 'receipt_fingerprint').map(key => `${key}_canonical`)],
    intervention_visibility_receipt: ['CTRL-G24-INTERVENTION-VISIBILITY-R6', Object.keys(candidate.intervention_visibility_receipt_schema?.properties ?? {}).filter(key => key !== 'receipt_fingerprint').map(key => `${key}_canonical`)],
    outbox_attempt: ['CTRL-G24-OUTBOX-ATTEMPT-R6', Object.keys(candidate.outbox?.attempt_schema?.properties ?? {}).filter(key => key !== 'attempt_fingerprint').map(key => `${key}_canonical`)],
    provider_success_evidence: ['CTRL-G24-PROVIDER-SUCCESS-R6', Object.keys(candidate.outbox?.provider_success_evidence_schema?.properties ?? {}).filter(key => key !== 'evidence_fingerprint').map(key => `${key}_canonical`)],
    provider_reconciliation_evidence: ['CTRL-G24-PROVIDER-RECONCILIATION-R6', Object.keys(candidate.outbox?.reconciliation_evidence_schema?.properties ?? {}).filter(key => key !== 'evidence_fingerprint').map(key => `${key}_canonical`)],
  }
  assert('all authority fingerprint schemas exact', same(Object.keys(candidate.fingerprint_schemas ?? {}), Object.keys(fingerprintExpectations)) && Object.entries(fingerprintExpectations).every(([name, [domain, fields]]) => validFingerprintRule(candidate.fingerprint_schemas?.[name], domain, fields)))

  assert('request-owned limits are pre-admission rejections', ['request_bytes', 'intent_bytes', 'answer_text_bytes', 'note_bytes'].every(name => candidate.limits?.[name]?.phase === 'pre_admission_canonical' && candidate.rejection_codes?.includes(candidate.limits[name].failure) && !candidate.hold_codes?.includes(candidate.limits[name].failure)))
  assert('serialization limit is noncommitting service unavailable', candidate.limits?.serialization_retries?.phase === 'pre_commit_transaction' && candidate.limits?.serialization_retries?.failure === 'service_temporarily_unavailable' && candidate.limit_semantics?.serialization_exhaustion_commits_hold === false)
  assert('limit system has one outcome', candidate.limit_semantics?.r3_max_annotations_consumed_only_by_r6_admission_engine === true && candidate.limit_semantics?.independent_schema_failure_from_r3_max_annotations === false && candidate.limit_semantics?.request_owned_content_limits_complete_before_admission === true && candidate.limit_semantics?.one_input_one_limit_outcome === true && candidate.limit_semantics?.side_effect_before_limit_success === false)

  const outbox = candidate.outbox
  assert('outbox actor authority and prechecks survive', same(Object.keys(outbox?.actor_authority ?? {}), ['claim_and_send', 'expire_to_unknown', 'reconcile_unknown']) && same(outbox?.pre_provider_checks, ['current_effect_authority', 'exact_payload_fingerprint', 'exact_payload_bytes', 'exactly_one_current_provider_capability']) && outbox?.pre_provider_failure?.provider_called === false)
  assert('outbox attempt schema exact and typed', outbox?.attempt_schema?.type === 'object' && outbox?.attempt_schema?.additional_properties === false && same(outbox?.attempt_schema?.exact_keys, Object.keys(outbox?.attempt_schema?.properties ?? {})) && outbox?.attempt_schema?.properties?.attempt_ordinal?.maximum === 3 && outbox?.attempt_schema?.properties?.dispatched_at?.type === 'canonical_timestamp' && outbox?.attempt_schema?.properties?.attempt_fingerprint?.type === 'sha256')
  assert('reservation dur stelleable and capped before dispatch', outbox?.reservation?.atomic_compare_and_swap === true && same(outbox?.reservation?.reads, ['current_outbox_state', 'current_fencing_token', 'current_lease_owner', 'current_lease_expiry', 'committed_attempt_count']) && same(outbox?.reservation?.writes, ['attempt_reservation', 'committed_attempt_count_increment']) && outbox?.reservation?.commits_before_dispatch === true && same(outbox?.reservation?.allowed_ordinals, [1, 2, 3]) && outbox?.reservation?.fourth_reservation_allowed === false)
  assert('dispatch is one durable transition per reservation', outbox?.dispatch?.transition === 'reserved_to_dispatched' && outbox?.dispatch?.atomic_compare_and_swap === true && outbox?.dispatch?.exact_once_per_reservation === true && outbox?.dispatch?.commits_before_provider_call === true && outbox?.dispatch?.reuse_dispatched_reservation_for_provider_call === false && same(outbox?.dispatch?.provider_call_allowed_ordinals, [1, 2, 3]) && outbox?.dispatch?.fourth_provider_call_allowed === false)
  assert('dispatch repeats full authority checks', same(outbox?.dispatch?.rechecks, ['current_fencing_token', 'current_lease_owner', 'unexpired_lease', 'current_effect_authority', 'exact_payload_fingerprint', 'exact_payload_bytes', 'exactly_one_current_provider_capability']) && outbox?.dispatch?.crash_after_dispatch_before_or_during_call === 'attempt_becomes_ambiguous_and_is_never_reused')
  assert('retry cannot evade identity or count', outbox?.retry?.requires_new_reservation === true && outbox?.retry?.all_attempts_same_provider_operation_key_and_payload === true && outbox?.retry?.ambiguous_without_current_idempotency_guarantee === 'outbox_unknown_no_automatic_resend' && outbox?.retry?.ambiguous_with_current_idempotency_guarantee_and_attempts_below_three === 'reserve_exact_next_attempt' && outbox?.retry?.ambiguous_at_three_attempts === 'outbox_unknown_no_automatic_resend' && outbox?.retry?.lease_or_worker_change_resets_attempt_count === false)
  assert('provider success evidence exact', exactClosedSchema(outbox?.provider_success_evidence_schema) && outbox?.provider_success_evidence_schema?.properties?.provider_receipt_bytes_fingerprint?.type === 'sha256' && outbox?.provider_success_evidence_schema?.must_match_exact_dispatched_attempt === true && outbox?.provider_success_evidence_schema?.only_evidence_allowing_confirmed === true)
  assert('reconciliation stays non-sending and fingerprinted', outbox?.reconciliation_evidence_schema?.fingerprint_ref === 'fingerprint_schemas.provider_reconciliation_evidence' && outbox?.reconciliation_evidence_schema?.must_match_exact_outbox_effect_and_latest_dispatched_attempt === true && outbox?.unknown_auto_resend === false && outbox?.reconciliation_can_send === false && outbox?.external_call_authorized_in_phase === false)

  assert('negative fixture families exact', same(candidate.required_negative_fixture_families, ['complete_effective_materialization', 'staged_edit_visibility_and_later_approval', 'registered_lifecycle_authority_issuance', 'release_watermark_invalidation_identity_and_finality', 'registry_replay_conflict_and_serialization_exhaustion', 'thirteen_set_snapshot_and_cas', 'set_member_identity_projection', 'complete_hold_fingerprint', 'proof_reference_and_authoritative_row_binding', 'fresh_execution_vs_replay_disclosure', 'authority_record_fingerprint_preimages', 'single_limit_outcome', 'outbox_reserved_dispatched_single_call', 'provider_success_evidence']))
  return found
}

check('generated machine bytes exact', read(paths.machine) === materializedR6Output)
check('exact R6 human bytes', sha256(paths.human) === 'c7f0eaeb7a84f6420d2d58a853380342d3fea39f5f6078f5172f14d80cd2fe59')
check('exact R6 machine bytes', sha256(paths.machine) === '4f636f58fa721c665bbca96e11702451b8454081ed72068d14169cb364eb36a6')
check('exact R6 QA bytes', sha256(paths.qa) === '281a8ca1a8e6c78348f1ab09b568b5babe8f1eb0a030a4259ac97b8eadfa9f29')
check('exact R6 materializer bytes', sha256('scripts/materialize-ctrl-g24-trusted-ingress-r6.mjs') === '79e6a6fbceba43958c1a7d256c34437e3c8ea628a8d4a2197ad22eb40812030a')
check('exact rejected R5 human remains preserved', sha256(paths.r5Human) === '3943d577b901fab94921533da0ded46a823201708fd93665c4aa3e37749f8404')
check('exact rejected R5 machine remains preserved', sha256(paths.r5Machine) === 'd3f4e5edb3b5bf10409300cc2ed25c55316c096e2da8fabc26ffc91f9aeadee8')
check('exact rejected R5 QA remains preserved', sha256(paths.r5Qa) === '75ce3e4bd3a51f5a2a956e520c1732fb4f7e560e183ee4681f7c20e2542be22b')
for (const failure of collectFailures(r6)) failures.push(`R6 ${failure}`)

const mutationProbes = [
  ['conceptual overlay', candidate => { candidate.materialization.conceptual_overlay_allowed = true }],
  ['operation omission', candidate => candidate.operation_names.pop()],
  ['request operation omission', candidate => candidate.request_schema.properties.operation_class.values.pop()],
  ['unregistered lifecycle write', candidate => { delete candidate.operation_specs.combine_lifecycle_authority }],
  ['edit restored into approval', candidate => candidate.operation_specs.approve_intervention.intent.properties.decision.values.push('edit')],
  ['stage self-visibility', candidate => candidate.operation_specs.stage_intervention_edit.forbidden_write_set.splice(0, 1)],
  ['visibility receipt reusable', candidate => { candidate.intervention_visibility_receipt_schema.consumed_once_by_exact_approval = false }],
  ['lifecycle expiry weakened', candidate => { candidate.lifecycle_authority.action_schema.properties.expires_at.type = 'boolean' }],
  ['lifecycle pair reused', candidate => { candidate.lifecycle_authority.combine_transaction.action_pair_unique = false }],
  ['registry key weakened', candidate => { candidate.operation_registry.unique_key = ['operation_id'] }],
  ['identity conflict mutates', candidate => { candidate.operation_registry.same_key_different_binding = 'replace_existing_row' }],
  ['replay reruns operation authority', candidate => candidate.operation_registry.replay_disclosure_checks.push('current_operation_authority')],
  ['whole replay byte contradiction', candidate => { candidate.operation_registry.replay_whole_response_bytes_equal_original_commit = true }],
  ['serialization committed hold', candidate => { candidate.operation_registry.serialization_exhaustion.committed_hold = true }],
  ['watermark type weakened', candidate => { candidate.result_payload_schemas.use_release.variants.invalidated_before_use.properties.projection_version_ref.type = 'boolean' }],
  ['watermark order removed', candidate => candidate.controlling_watermarks.base_kinds_in_canonical_order.reverse()],
  ['applicable control watermark completeness removed', candidate => { candidate.controlling_watermarks.completeness = 'base_only' }],
  ['invalidation uniqueness removed', candidate => { candidate.release_invalidation.invalidation_receipt_schema.unique_keys = [] }],
  ['set grant omitted', candidate => candidate.set_seals.pop()],
  ['set duplicate accepted', candidate => { candidate.set_member_identity_encoding.duplicate_identity_different_bytes = 'accepted' }],
  ['snapshot MD5', candidate => { candidate.snapshot_encoding.digest = 'md5' }],
  ['snapshot authority version omitted', candidate => candidate.snapshot_encoding.preimage_order.splice(6, 1)],
  ['CAS read set omitted', candidate => candidate.snapshot_and_cas_by_operation.use_release.set_seals.pop()],
  ['held dependency omitted', candidate => candidate.held_evaluation_fingerprint.dependency_slots.pop()],
  ['proof opaque bytes restored', candidate => candidate.proof_bundle_schemas.common.exact_keys.push('canonical_record_bytes_b64url')],
  ['proof append MD5', candidate => { candidate.proof_lineage.append.digest = 'md5' }],
  ['proof row equality removed', candidate => { candidate.proof_authority.every_resolved_row_fingerprint_recomputed_and_equal = false }],
  ['proof constraint garbage', candidate => { candidate.proof_authority.extension_constraints.selector_result = [] }],
  ['fingerprint self inclusion', candidate => { candidate.fingerprint_schemas.lifecycle_authority_action.fingerprint_field_excluded_from_preimage = false }],
  ['success evidence weakened', candidate => { candidate.outbox.provider_success_evidence_schema.properties.provider_receipt_bytes_fingerprint.type = 'boolean' }],
  ['request limit moved after admission', candidate => { candidate.limits.answer_text_bytes.phase = 'post_admission_canonical' }],
  ['outbox CAS reads removed', candidate => { candidate.outbox.reservation.reads = [] }],
  ['dispatch transition removed', candidate => { candidate.outbox.dispatch.atomic_compare_and_swap = false }],
  ['third call forbidden', candidate => { candidate.outbox.dispatch.provider_call_allowed_ordinals = [1, 2] }],
  ['dispatched reservation reused', candidate => { candidate.outbox.dispatch.reuse_dispatched_reservation_for_provider_call = true }],
  ['provider rechecks removed', candidate => { candidate.outbox.dispatch.rechecks = [] }],
  ['lease resets count', candidate => { candidate.outbox.retry.lease_or_worker_change_resets_attempt_count = true }],
]
for (const [name, mutate] of mutationProbes) {
  const candidate = structuredClone(r6)
  mutate(candidate)
  check(`R6 mutation rejected: ${name}`, collectFailures(candidate).length > 0)
}

check('human and machine agree on full materialization', human.includes('no conceptual overlay and no runtime inheritance') && r6.materialization.conceptual_overlay_allowed === false)
check('human and machine agree on staged edit', human.includes('stage_intervention_edit') && r6.approval_effects.edit_and_approve_in_one_operation_allowed === false)
check('human and machine agree on replay envelope', human.includes('distinct R4 replay envelope') && r6.operation_registry.replay_whole_response_bytes_equal_original_commit === false)
check('human and machine agree on dispatched state', human.includes('atomically changes that reservation from `reserved` to `dispatched` exactly once') && r6.outbox.dispatch.exact_once_per_reservation === true)
check('QA preserves implementation boundary', qa.includes('No adapter, schema, database procedure, runtime connection, proof resolver, outbox worker or external call implements R6'))
check('R6 prose contains no em dash', !human.includes('—') && !qa.includes('—'))

if (failures.length) {
  console.error(`G24 trusted ingress R6 failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: fully materialized G24 trusted ingress R6 and ${mutationProbes.length} mutation probes verified`)
