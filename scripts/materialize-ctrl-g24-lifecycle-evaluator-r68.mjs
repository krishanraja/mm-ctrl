import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const outputPath = 'project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68.json'
const sourcePath = 'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.mjs'
const r66Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'
const r67Path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-r66-acceptance-receipt-r67.json'
const sourceBytes = readFileSync(join(root, sourcePath))
const r66Bytes = readFileSync(join(root, r66Path))
const r67Bytes = readFileSync(join(root, r67Path))
const r66 = JSON.parse(r66Bytes)
const r67 = JSON.parse(r67Bytes)

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const gitBlob = bytes => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex')
const compareCodePoints = (left, right) => {
  const a = [...left].map(value => value.codePointAt(0))
  const b = [...right].map(value => value.codePointAt(0))
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return a.length - b.length
}
const canonical = value => {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error('R68_noncanonical_number')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) throw new Error('R68_noncanonical_value')
  return `{${Object.keys(value).sort(compareCodePoints).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
}
const fingerprint = value => sha256(Buffer.from(canonical(value), 'utf8'))

const operationClass = 'evaluate_lifecycle_preconditions'
const selectionAuthority = r66.authority_operation_evaluator_registry_selection
const selectionRecord = selectionAuthority.selection_records.find(record => record.operation_class === operationClass)
if (!selectionRecord) throw new Error('R68_R66_selection_record_missing')
const registry = r66.authority_operation_evaluator_export_parity_proof.complete_evaluator_registry_snapshot
const member = registry.snapshot_value.members[0]
const descriptor = r66.authority_operation_evaluator_export_parity_proof.evaluator_metadata_descriptor_artifact

const entrypoint = 'dispatchEvaluateLifecyclePreconditionsStructuralR68'
const exportAbi = {
  exact_export_names: [entrypoint],
  input_schema_version: 'ctrl.g24.executable-input.evaluate-lifecycle-preconditions.r68.v1',
  output_schema_version: 'ctrl.g24.executable-output.evaluate-lifecycle-preconditions.r68.v1',
  result_schema_version: 'ctrl.g24.result.evaluate-lifecycle-preconditions.r63.v1',
  allowed_statuses: ['hold', 'verified_not_runnable'],
  hold_code: 'evaluator_artifact_hold',
  writes: [],
  result: null,
  evidence_rows: [],
  semantic_success_branch: 'absent_and_forbidden',
}
const artifactCore = {
  source_path: sourcePath,
  source_git_blob_oid: gitBlob(sourceBytes),
  canonical_executable_bytes_sha256: sha256(sourceBytes),
  canonical_executable_bytes_length: sourceBytes.length,
  executable_content_ref: sha256(sourceBytes),
  module_format: 'ecmascript_module_utf8_import_free',
  entrypoint,
  export_abi: exportAbi,
}
const sourceLock = {
  schema_version: 'ctrl.g24.evaluator-source-lock.r68.v1',
  domain_ascii: 'CTRL-G24-EVALUATOR-SOURCE-LOCK-R68',
  canonical_encoding: 'unicode_codepoint_sorted_canonical_json_utf8',
  preimage: artifactCore,
}
const founderLockIdentity = fingerprint(sourceLock)

const inputProperties = {
  case_ref: { type: 'identifier', min_utf8_bytes: 1, max_utf8_bytes: 256 },
  evaluated_at: { type: 'canonical_timestamp' },
  intent: { schema_ref: 'operation_specs.evaluate_lifecycle_preconditions.intent', schema_version: 'ctrl.g24.intent.evaluate-lifecycle-preconditions.r13.v1' },
  operation_class: { const: operationClass },
  operation_id: { type: 'identifier', min_utf8_bytes: 1, max_utf8_bytes: 256 },
  schema_version: { const: exportAbi.input_schema_version },
  selected_result_schema_version: { const: exportAbi.result_schema_version },
  semantic_predicate_authority: { const: 'UNAVAILABLE' },
  snapshot_fingerprint: { type: 'sha256' },
  subject_ref: { type: 'identifier', min_utf8_bytes: 1, max_utf8_bytes: 256 },
  workspace_ref: { type: 'identifier', min_utf8_bytes: 1, max_utf8_bytes: 256 },
}
const outputProperties = {
  evidence_rows: { const: [] },
  hold_code: { const: 'evaluator_artifact_hold' },
  result: { const: null },
  schema_version: { const: exportAbi.output_schema_version },
  status: { type: 'enum', values: exportAbi.allowed_statuses },
  writes: { const: [] },
}

const machine = {
  schema_version: 'ctrl.g24.lifecycle-precondition-evaluator-structural-gate.r68.v1',
  round: 'R68',
  recorded_on: '2026-09-15',
  status: 'structural_executable_loading_mechanics_only',
  immutable_parent: {
    commit: 'fe4a4ee5780bc3ecf919766e89931987f97f4e30',
    tree: '94c6bf07a89196deab2bf3913e17dbaad9535968',
    r66_machine_sha256: r67.accepted_contract.machine_sha256,
    r66_machine_blob: r67.accepted_contract.blobs['project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r66.json'],
    r67_receipt_json_blob: '9da9ddf58886096bdb32789d57877b4818b3ed20',
    r67_receipt_markdown_blob: 'b271369ff25b8ce69b8a4b7b27502ccea224daa7',
    r67_checker_blob: '22b0a5fc2ac602bd34c5ced9def6b6266a49bcc9',
  },
  frozen_inputs: {
    r66_contract: { path: r66Path, sha256: sha256(r66Bytes) },
    r67_acceptance_receipt: { path: r67Path, sha256: sha256(r67Bytes) },
  },
  executable_artifact: {
    schema_version: 'ctrl.g24.evaluator-executable-artifact.r68.v1',
    ...artifactCore,
    founder_lock: {
      ...sourceLock,
      founder_lock_identity: founderLockIdentity,
      status: 'founder_lockable_candidate_not_runtime_authority',
    },
    descriptor_content_ref: descriptor.descriptor_content_ref,
    descriptor_bytes_sha256: descriptor.canonical_descriptor_bytes_sha256,
    descriptor_is_separate_compatibility_metadata_not_executable_code: true,
  },
  dispatch_input_schema: {
    schema_version: exportAbi.input_schema_version,
    type: 'object',
    exact_keys: Object.keys(inputProperties).sort(compareCodePoints),
    required: Object.keys(inputProperties).sort(compareCodePoints),
    additional_properties: false,
    properties: inputProperties,
  },
  dispatch_output_schema: {
    schema_version: exportAbi.output_schema_version,
    type: 'object',
    exact_keys: Object.keys(outputProperties).sort(compareCodePoints),
    required: Object.keys(outputProperties).sort(compareCodePoints),
    additional_properties: false,
    properties: outputProperties,
  },
  r66_selection_binding: {
    schema_version: 'ctrl.g24.evaluator-selection-binding.r68.v1',
    operation_class: operationClass,
    query_schema_version: selectionAuthority.selection_query_schema.schema_version,
    query_fingerprint: selectionRecord.query.selection_query_fingerprint,
    proof_schema_version: selectionAuthority.selection_proof_schema.schema_version,
    proof_fingerprint: selectionRecord.proof.selection_proof_fingerprint,
    policy_lineage_ref: selectionRecord.query.policy_lineage_ref,
    evaluated_at: selectionRecord.query.evaluated_at,
    snapshot_ref: registry.snapshot_content_ref,
    snapshot_sha256: registry.canonical_snapshot_bytes_sha256,
    registry_set_seal: registry.snapshot_value.evaluator_registry_set_seal.computed_set_seal,
    member_content_ref: member.member_content_ref,
    member_row_version_ref: member.member_row_version_ref,
    member_fingerprint: member.member_fingerprint,
    selected_result_schema_version: exportAbi.result_schema_version,
    proof_declares_metadata_selection_is_not_execution_authority: true,
    verified_before_executable_bytes_are_loaded: true,
  },
  isolated_harness: {
    schema_version: 'ctrl.g24.evaluator-isolated-harness.r68.v1',
    harness_path: 'scripts/run-ctrl-g24-lifecycle-evaluator-r68-harness.mjs',
    loader: 'data_url_from_exact_rehashed_executable_bytes_in_bounded_child_process',
    max_input_bytes: 65536,
    max_output_bytes: 65536,
    timeout_ms: 1500,
    exact_export_surface_required: true,
    static_imports: 'forbidden',
    dynamic_import_eval_function_constructor_and_ambient_io_time_random_process_or_global_escape: 'forbidden',
    invalid_artifact_selection_input_timeout_throw_oversize_or_nondeterminism: 'same_closed_no_write_evaluator_artifact_hold',
  },
  sample_dispatch_input: {
    schema_version: exportAbi.input_schema_version,
    operation_class: operationClass,
    operation_id: 'r68_structural_probe_001',
    workspace_ref: 'r68_workspace',
    subject_ref: 'r68_subject',
    case_ref: 'r68_case',
    snapshot_fingerprint: '1'.repeat(64),
    evaluated_at: selectionRecord.query.evaluated_at,
    intent: {
      transition_id: 'open_preparation',
      predecessor_lifecycle_version_ref: null,
      evidence_input_set_seal: '2'.repeat(64),
    },
    selected_result_schema_version: exportAbi.result_schema_version,
    semantic_predicate_authority: 'UNAVAILABLE',
  },
  expected_verified_dispatch_output: {
    schema_version: exportAbi.output_schema_version,
    status: 'verified_not_runnable',
    hold_code: 'evaluator_artifact_hold',
    writes: [],
    result: null,
    evidence_rows: [],
  },
  expected_hold_dispatch_output: {
    schema_version: exportAbi.output_schema_version,
    status: 'hold',
    hold_code: 'evaluator_artifact_hold',
    writes: [],
    result: null,
    evidence_rows: [],
  },
  static_reachability_boundary: {
    only_allowed_importers: [
      'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.test.ts',
      'scripts/run-ctrl-g24-lifecycle-evaluator-r68-harness.mjs',
      'scripts/check-ctrl-g24-lifecycle-evaluator-r68.mjs',
    ],
    forbidden_live_or_product_import_roots: ['src', 'supabase/functions'],
    explicit_exceptions_inside_supabase_functions: [
      'supabase/functions/_shared/g24-lifecycle-precondition-evaluator.r68.test.ts',
    ],
    no_import_from_g24_headless_crossing_decision_engine_ui_edge_or_deploy: true,
  },
  semantic_boundary: {
    executable_loading_mechanics: 'implemented_and_testable_in_R68',
    semantic_predicate_authority: 'UNAVAILABLE',
    typed_fact_bundle: 'not_defined_or_implemented',
    satisfied_or_success_branch: 'forbidden',
    r63_result_generation: 'forbidden',
    r13_evidence_row_generation: 'forbidden',
    live_registry_completeness: 'unproved',
    serializable_runtime_selection: 'unproved',
    database_write_and_restart_integration: 'unproved',
    runtime_edge_ui_deployment_or_external_action: 'none',
  },
  open_founder_decision: {
    schema_version: 'ctrl.g24.lifecycle-precondition-predicate-open-decision.r68.v1',
    status: 'open_not_decided_or_implemented',
    recommended_option: 'server_derived_closed_structured_trusted_read_set_with_13_discriminated_precondition_fact_variants',
    alternative_option: 'separately_governed_signed_satisfaction_assertions',
    rejected_option: 'opaque_human_text_presence_or_natural_language_interpretation_as_satisfaction',
    public_r63_intent_remains_unchanged_in_both_viable_options: true,
    result_or_evidence_success_branch_requires_separate_founder_choice_and_gate: true,
  },
  mutation_families: [
    'same_metadata_different_executable_bytes',
    'descriptor_as_code',
    'truncated_or_alternate_bytes',
    'hash_ref_or_length_splice',
    'wrong_missing_or_extra_entrypoint_or_export',
    'cross_operation_stale_policy_or_time_selection',
    'snapshot_set_seal_or_member_identity_splice',
    'timeout_throw_or_oversized_output',
    'prototype_accessor_cycle_or_unsupported_input',
    'nondeterministic_output',
    'live_or_product_import_reachability',
    'invented_semantic_success_result_or_evidence_write',
  ],
  migration_dependency_and_rollback: {
    package_dependency_change: 'none',
    package_lock_change: 'forbidden',
    database_migration_or_backfill: 'none',
    live_registry_mutation: 'none',
    runtime_route_ui_deploy_or_external_action: 'none',
    rollback: 'revert_the_single_R68_commit; R67_remains_the_accepted_metadata_only_checkpoint',
  },
}

export const materializedR68 = machine
export const materializedR68Output = `${JSON.stringify(machine, null, 2)}\n`

if (process.argv[1] && process.argv[1].endsWith('materialize-ctrl-g24-lifecycle-evaluator-r68.mjs')) {
  if (process.argv.includes('--check')) {
    const existing = readFileSync(join(root, outputPath), 'utf8')
    if (existing !== materializedR68Output) throw new Error('R68_materialized_output_mismatch')
    console.log(`ok: R68 materialization exact; source ${artifactCore.canonical_executable_bytes_sha256}; ${sourceBytes.length} bytes; lock ${founderLockIdentity}`)
  } else {
    writeFileSync(join(root, outputPath), materializedR68Output)
    console.log(`wrote ${outputPath}`)
  }
}
