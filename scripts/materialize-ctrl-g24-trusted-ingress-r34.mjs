import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR33 } from './materialize-ctrl-g24-trusted-ingress-r33.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r33.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r34.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
const r34 = structuredClone(materializedR33)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fp = { type: 'sha256' }
const b64 = { type: 'base64url_without_padding' }
const uint = { type: 'safe_nonnegative_integer' }
const ts = { type: 'canonical_timestamp' }
function closed(version, properties, extras = {}) { const optional = extras.optional ?? []; const keys = Object.keys(properties); const value = { schema_version: version, type: 'object', exact_keys: keys, required: keys.filter(key => !optional.includes(key)), additional_properties: false, properties, ...extras }; if (!optional.length) delete value.optional; return value }
function add(schema, key, value, before) { const properties = {}; for (const [name, spec] of Object.entries(schema.properties)) { if (name === before) properties[key] = value; properties[name] = spec } if (!Object.hasOwn(properties, key)) properties[key] = value; schema.properties = properties; schema.exact_keys = Object.keys(properties); schema.required = schema.exact_keys.filter(name => !(schema.optional ?? []).includes(name)) }
function remove(schema, key) { delete schema.properties[key]; schema.exact_keys = schema.exact_keys.filter(value => value !== key); schema.required = schema.required.filter(value => value !== key); if (schema.optional) schema.optional = schema.optional.filter(value => value !== key) }
function bump(value) { return value?.replace(/\.r\d+\./, '.r34.') }
function fingerprint(domain, fields) { return { schema_version: `ctrl.g24.fingerprint.${domain.toLowerCase().replaceAll('ctrl-g24-', '')}.r34.v1`, domain_ascii: domain, field_encoding_ref: 'canonical_field_encoding', preimage_order: ['domain_ascii', ...fields], fingerprint_field_excluded_from_preimage: true, digest: 'sha256_of_exact_preimage' } }
function canonicalStore(family, schemaRef, maxBytes, index) { const suffix = index ? `-${index}` : ''; return { schema_version: `ctrl.g24.${family.replaceAll('_', '-')}${suffix}-artifact-store.r34.v1`, canonical_schema_ref: schemaRef, row_schema: closed(`ctrl.g24.${family.replaceAll('_', '-')}${suffix}-artifact-row.r34.v1`, { artifact_ref: fp, artifact_family: { const: family }, canonical_schema_ref: { const: schemaRef }, canonical_bytes_b64url: b64, canonical_bytes_length: uint, canonical_bytes_sha256: fp, parsed_content_fingerprint: fp, stored_at: ts, writer_role: { const: 'ctrl_authority_operation_executor' }, artifact_fingerprint: fp }, { append_only: true, unique_keys: [['artifact_ref'], ['artifact_family', 'canonical_schema_ref', 'canonical_bytes_sha256']], fingerprint_ref: 'fingerprint_schemas.authority_artifact_r31', fingerprint_field: 'artifact_fingerprint', max_canonical_bytes: maxBytes, canonical_validation: 'decode_base64url_verify_limit_exact_length_and_sha256_parse_exact_resolved_closed_schema_then_reencode_to_identical_canonical_bytes_and_recompute_parsed_content_fingerprint', content_address_rule: 'artifact_ref_equals_canonical_bytes_sha256', named_derivation_operands: [{ derivation: 'content_address_rule', operands: ['artifact_ref', 'canonical_bytes_sha256'] }] }), sole_writer: 'ctrl_authority_operation_executor', direct_dml: 'forbidden', retention: 'retain_while_any_registry_hold_receipt_replay_or_audit_reference_exists', restart_failure: 'hold_without_response_or_write' } }

r34.schema_version = 'ctrl.g24.trusted-ingress.r34.effective.v1'
r34.status = 'thirty_third_repair_candidate_under_independent_review'
r34.supersedes = { commit: 'a190ccf434c8a88ed4e87f667c12912f4e4af7b3', tree: '1815e5bde6877ac9fe5c5fbb4c0e561b5d8702a8', human_blob: 'eee9b31e0bff3854ab90d6c6fbff33cf40f64936', machine_blob: 'f4b37a63ec470070b6a5561c770bfb6055bfb391', qa_blob: 'feb1953289567efee6ef41136b7eedf19497c591', checker_blob: '85f918a872655c056397e5e9b9e40fc9a5275b69', materializer_blob: '58dffadf48afc023eb9bf54c7b731c55d41109c1', founder_checker_blob: 'b59d44cce676de387f9bc38693bfd0b37d90da9e', adjudication: 'veto' }
r34.materialization = { authority: 'this_complete_generated_effective_document', generator: 'scripts/materialize-ctrl-g24-trusted-ingress-r34.mjs', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, conceptual_overlay_allowed: false, runtime_inheritance_allowed: false, generated_document_must_equal_generator_output_byte_for_byte: true, generator_must_reject_undefined_values_before_serialization: true }

const operations = r34.case_session_authority_operation_protocols.operations
const operationNames = Object.keys(operations)
const heldBranches = ['authorization_hold', 'stale_head_hold', 'invalid_target_hold', 'invalid_proof_hold', 'internal_failure_hold']
const resultBranches = ['committed', ...heldBranches]
const resultSchemaRefs = []

// An outcome carries its semantic fingerprint, never the content address of its own bytes.
for (const [operationName, operation] of Object.entries(operations)) {
  const committed = operation.result_schema.variants.committed
  remove(committed, 'result_ref')
  committed.schema_version = bump(committed.schema_version)
  committed.exact_equalities = ['receipt_ref_and_receipt_precommit_fingerprint_equal_server_issued_precommit_identity', 'committed_outcome_contains_no_final_receipt_fingerprint_or_result_artifact_ref', 'outcome_fingerprint_precedes_canonical_outcome_bytes_and_content_address', 'result_artifact_ref_is_derived_only_after_exact_canonical_outcome_bytes_exist']
  for (const branch of heldBranches) {
    const held = operation.result_schema.variants[branch]
    remove(held, 'result_ref')
    held.schema_version = bump(held.schema_version)
    held.exact_equalities = ['hold_row_ref_resolves_exact_precommit_hold_identity', 'held_at_equals_precommit_hold_then_final_hold_then_held_registry', 'preoutcome_evidence_triple_when_present_is_exact_and_contains_no_outcome_or_final_hold_identity', 'outcome_operation_branch_and_operation_id_match_precommit_hold_identity', 'held_outcome_contains_no_result_artifact_ref', 'outcome_fingerprint_precedes_canonical_outcome_bytes_and_content_address']
  }
  operation.result_schema.schema_version = bump(operation.result_schema.schema_version)
  operation.result_fingerprint = fingerprint(`CTRL-G24-${operationName.replaceAll('_', '-').toUpperCase()}-RESULT-R34`, ['operation_name', 'operation_id', 'branch', 'branch_specific_canonical_payload_sha256'])
  operation.result_fingerprint.branch_payload_rule = 'hash_exact_selected_R34_variant_keys_in_schema_order_excluding_outcome_fingerprint_with_receipt_precommit_identity_on_committed_and_hold_row_ref_on_held_and_no_result_artifact_ref_in_any_variant'
  operation.schema_version = bump(operation.schema_version)
  for (const branch of resultBranches) resultSchemaRefs.push(`case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`)
}
r34.case_session_authority_operation_protocols.schema_version = 'ctrl.g24.case-session-authority-operation-protocols.r34.v1'

// Rebuild every result artifact store from the exact R34 outcome union.
const resultStores = {}
resultSchemaRefs.forEach((schemaRef, index) => { resultStores[`schema_${index + 1}`] = canonicalStore('results', schemaRef, 131072, index + 1) })
r34.authority_operation_artifact_stores.families.results = { schema_version: 'ctrl.g24.authority-artifact-family-results.r34.v1', expected_schema_refs: resultSchemaRefs, stores_by_schema_ref: resultStores }
r34.authority_operation_artifact_stores.schema_version = 'ctrl.g24.authority-operation-artifact-stores.r34.v1'

// Historical identity is sourced only from the selected content-addressed result artifact.
const history = r34.authority_operation_historical_response_schema
history.schema_version = 'ctrl.g24.authority-operation-historical-response.r34.v1'
history.properties.result_ref = fp
history.properties.result_bytes_sha256 = fp
history.exact_equalities = ['operation_and_branch_select_exactly_one_R34_matrix_row', 'result_ref_equals_selected_result_artifact_artifact_ref', 'result_bytes_sha256_equals_selected_result_artifact_canonical_bytes_sha256', 'result_fingerprint_equals_selected_result_artifact_decoded_outcome_fingerprint', 'response_payload_ref_and_hash_equal_selected_result_artifact_ref_and_canonical_bytes_sha256', 'all_fields_follow_exact_R34_structured_historical_response_bindings']
r34.fingerprint_schemas.authority_operation_historical_response_r34 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-HISTORICAL-RESPONSE-R34', history.exact_keys.filter(key => key !== 'response_fingerprint'))
history.fingerprint_ref = 'fingerprint_schemas.authority_operation_historical_response_r34'
delete r34.fingerprint_schemas.authority_operation_historical_response_r33
r34.authority_operation_historical_response_artifact_store = canonicalStore('authority_operation_historical_responses', 'authority_operation_historical_response_schema', 131072)

const responseMatrix = []
for (const [operationName, operation] of Object.entries(operations)) for (const branch of resultBranches) { const schema = operation.result_schema.variants[branch]; responseMatrix.push({ operation_name: operationName, result_branch: branch, response_schema_ref: `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`, response_schema_version: schema.schema_version }) }
r34.authority_operation_historical_response_schema_matrix = { schema_version: 'ctrl.g24.authority-operation-historical-response-schema-matrix.r34.v1', exact_expected_rows: 90, discriminator_order: ['operation_name', 'result_branch'], rows: responseMatrix, selection: 'exactly_one_row_or_hold_before_response_materialization', caller_schema_authority: 'none' }

// Registry rows bind the result artifact triple and already-materialized history.
const committedRegistry = r34.authority_operation_registry.row_union.variants.original_committed
const heldRegistry = r34.authority_operation_registry.row_union.variants.original_persisted_hold
committedRegistry.properties.result_ref = fp
heldRegistry.properties.hold_result_ref = fp
committedRegistry.schema_version = bump(committedRegistry.schema_version)
heldRegistry.schema_version = bump(heldRegistry.schema_version)
committedRegistry.exact_equalities = ['operation_name_operation_id_branch_result_artifact_history_and_receipt_triples_equal_exact_committed_outcome_artifacts', 'result_ref_equals_selected_result_artifact_artifact_ref', 'result_bytes_sha256_equals_selected_result_artifact_canonical_bytes_sha256', 'historical_response_triple_exists_before_registry_identity', 'registry_row_ref_is_canonical_content_address_of_exact_registry_identity_preimage']
heldRegistry.exact_equalities = ['operation_name_operation_id_hold_branch_hold_row_result_artifact_history_and_held_at_equal_exact_final_hold_and_artifacts', 'hold_result_ref_equals_selected_result_artifact_artifact_ref', 'hold_result_bytes_sha256_equals_selected_result_artifact_canonical_bytes_sha256', 'historical_response_triple_exists_before_registry_identity', 'session_hold_evidence_triple_or_ordinary_UNAVAILABLE_literals_equal_exact_final_hold']
r34.fingerprint_schemas.authority_operation_registry_committed_r34 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-COMMITTED-R34', committedRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
r34.fingerprint_schemas.authority_operation_registry_held_r34 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REGISTRY-HELD-R34', heldRegistry.exact_keys.filter(key => key !== 'registry_fingerprint'))
committedRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_committed_r34'
heldRegistry.fingerprint_ref = 'fingerprint_schemas.authority_operation_registry_held_r34'
delete r34.fingerprint_schemas.authority_operation_registry_committed_r33
delete r34.fingerprint_schemas.authority_operation_registry_held_r33
r34.authority_operation_registry.row_union.schema_version = 'ctrl.g24.authority-operation-registry-row-union.r34.v1'
r34.authority_operation_registry.schema_version = 'ctrl.g24.authority-operation-registry.r34.v1'

// Final receipt and hold identities follow history, without changing their precommit identities.
for (const [variantName, receipt] of Object.entries(r34.authority_operation_receipt_store.row_union.variants)) {
  const shortName = variantName.startsWith('ordinary') ? 'ordinary' : 'session'
  receipt.schema_version = bump(receipt.schema_version)
  receipt.finalization_rule = 'after_exact_result_artifact_and_historical_response_artifacts_exist_append_exact_result_triple_then_compute_final_receipt_fingerprint_without_changing_receipt_ref_or_precommit_fingerprint'
  receipt.exact_equalities = [...new Set(receipt.exact_equalities.concat(['result_bytes_ref_equals_selected_result_artifact_artifact_ref', 'result_bytes_sha256_equals_selected_result_artifact_canonical_bytes_sha256', 'historical_response_materialization_precedes_final_receipt_fingerprint']))]
  r34.fingerprint_schemas[`authority_operation_receipt_final_${shortName}_r34`] = fingerprint(`CTRL-G24-AUTHORITY-OPERATION-RECEIPT-FINAL-${shortName.toUpperCase()}-R34`, receipt.exact_keys.filter(key => key !== 'receipt_fingerprint'))
  receipt.fingerprint_ref = `fingerprint_schemas.authority_operation_receipt_final_${shortName}_r34`
  r34.authority_operation_receipt_precommit_identity_plans.variants[variantName].final_fingerprint_ref = receipt.fingerprint_ref
  delete r34.fingerprint_schemas[`authority_operation_receipt_final_${shortName}_r33`]
}
r34.authority_operation_receipt_store.row_union.schema_version = 'ctrl.g24.authority-operation-receipt-row-union.r34.v1'
r34.authority_operation_receipt_store.schema_version = 'ctrl.g24.authority-operation-receipt-store.r34.v1'
r34.authority_operation_receipt_precommit_identity_plans.schema_version = 'ctrl.g24.authority-operation-receipt-precommit-plans.r34.v1'

for (const [kind, hold] of Object.entries(r34.authority_operation_hold_store.row_union.variants)) {
  const shortName = kind.startsWith('ordinary') ? 'ordinary' : 'session'
  hold.schema_version = bump(hold.schema_version)
  hold.finalization_rule = 'after_exact_result_artifact_and_historical_response_artifacts_exist append exact result artifact triple then compute final hold fingerprint without changing hold_row_ref or held_at'
  hold.exact_equalities = [...new Set((hold.exact_equalities ?? []).concat(['result_ref_equals_selected_result_artifact_artifact_ref', 'result_bytes_sha256_equals_selected_result_artifact_canonical_bytes_sha256', 'historical_response_materialization_precedes_final_hold_fingerprint']))]
  r34.fingerprint_schemas[`authority_operation_hold_${shortName}_r34`] = fingerprint(`CTRL-G24-AUTHORITY-OPERATION-HOLD-${shortName.toUpperCase()}-R34`, hold.exact_keys.filter(key => key !== 'hold_fingerprint'))
  hold.fingerprint_ref = `fingerprint_schemas.authority_operation_hold_${shortName}_r34`
  delete r34.fingerprint_schemas[`authority_operation_hold_${shortName}_r33`]
}
r34.authority_operation_hold_store.row_union.schema_version = 'ctrl.g24.authority-operation-hold-row-union.r34.v1'
r34.authority_operation_hold_store.schema_version = 'ctrl.g24.authority-operation-hold-store.r34.v1'

// Replay never reads a content address from decoded outcome bytes.
const replayBindings = r34.authority_operation_replay_resolution_bindings
replayBindings.schema_version = 'ctrl.g24.authority-operation-replay-resolution-bindings.r34.v1'
replayBindings.historical_result_triple = [
  { payload_field: 'historical_result_ref', source_kind: 'selected_result_artifact', source_field: 'artifact_ref' },
  { payload_field: 'historical_result_bytes_sha256', source_kind: 'selected_result_artifact', source_field: 'canonical_bytes_sha256' },
  { payload_field: 'historical_result_fingerprint', source_kind: 'selected_result', source_field: 'result_fingerprint' },
]
replayBindings.operation_equalities = ['payload_operation_name_operation_id_and_branch_equal_authoritative_registry', 'historical_response_operation_name_operation_id_branch_result_artifact_ref_result_bytes_sha256_plus_result_fingerprint_equal_authoritative_registry', 'envelope_operation_name_operation_id_branch_and_replay_kind_equal_payload', 'returned_response_bytes_equal_exact_resolved_historical_response_artifact_bytes']
replayBindings.forbidden_sources = ['decoded_outcome.result_ref', 'caller.result_ref', 'unresolved_result_ref']
replayBindings.cross_artifact_splicing = 'reject_A_B_C_registry_result_artifact_history_or_hold_identity_mix_before_return'

const replayAuthority = r34.authority_operation_replay_registry_authority
replayAuthority.schema_version = 'ctrl.g24.authority-operation-replay-registry-authority.r34.v1'
replayAuthority.historical_response_equalities = {
  committed: [{ registry_field: 'operation_name', history_field: 'operation_name' }, { registry_field: 'operation_id', history_field: 'operation_id' }, { registry_field: 'result_branch', history_field: 'result_branch' }, { registry_field: 'result_ref', history_field: 'result_ref' }, { registry_field: 'result_bytes_sha256', history_field: 'result_bytes_sha256' }, { registry_field: 'result_fingerprint', history_field: 'result_fingerprint' }, { registry_field: 'historical_response_fingerprint', history_field: 'response_fingerprint' }],
  held: [{ registry_field: 'operation_name', history_field: 'operation_name' }, { registry_field: 'operation_id', history_field: 'operation_id' }, { registry_field: 'hold_branch', history_field: 'result_branch' }, { registry_field: 'hold_result_ref', history_field: 'result_ref' }, { registry_field: 'hold_result_bytes_sha256', history_field: 'result_bytes_sha256' }, { registry_field: 'hold_result_fingerprint', history_field: 'result_fingerprint' }, { registry_field: 'historical_response_fingerprint', history_field: 'response_fingerprint' }],
  result_artifact: [{ history_field: 'result_ref', artifact_field: 'artifact_ref' }, { history_field: 'result_bytes_sha256', artifact_field: 'canonical_bytes_sha256' }, { history_field: 'result_fingerprint', decoded_result_field: 'result_fingerprint' }, { history_field: 'response_payload_ref', artifact_field: 'artifact_ref' }, { history_field: 'response_payload_bytes_sha256', artifact_field: 'canonical_bytes_sha256' }],
  response_artifact: [{ registry_field: 'historical_response_ref', artifact_field: 'artifact_ref' }, { registry_field: 'historical_response_bytes_sha256', artifact_field: 'canonical_bytes_sha256' }, { registry_field: 'historical_response_fingerprint', decoded_history_field: 'response_fingerprint' }],
}
replayAuthority.source_precedence = ['resolve_exact_registry_row', 'resolve_exact_hold_row_when_held', 'resolve_exact_result_artifact', 'resolve_exact_historical_response_artifact', 'assemble_payload_only_from_resolved_authorities']
r34.authority_operation_replay_derivation.schema_version = 'ctrl.g24.authority-operation-replay-derivation.r34.v1'
r34.authority_operation_replay_derivation.return_rule = 'resolve_one_registry_identity_then_required_hold_result_artifact_history_payload_and_envelope_artifacts_then_return_exact_history_bytes'

for (const [variantName, payload] of Object.entries(r34.authority_operation_replay_payload_schema.variants)) {
  const shortName = variantName === 'replayed' ? 'committed' : 'held'
  payload.schema_version = bump(payload.schema_version)
  payload.exact_equalities = [`historical_result_ref_and_bytes_sha256_equal_exact_selected_result_artifact_and_fingerprint_equals_its_decoded_result_for_${shortName}_registry`]
  r34.fingerprint_schemas[`authority_operation_replay_payload_${shortName}_r34`] = fingerprint(`CTRL-G24-AUTHORITY-OPERATION-REPLAY-PAYLOAD-${shortName.toUpperCase()}-R34`, payload.exact_keys.filter(key => key !== 'payload_fingerprint'))
  payload.fingerprint_ref = `fingerprint_schemas.authority_operation_replay_payload_${shortName}_r34`
  delete r34.fingerprint_schemas[`authority_operation_replay_payload_${shortName}_r33`]
}
r34.authority_operation_replay_payload_schema.schema_version = 'ctrl.g24.authority-operation-replay-payload-union.r34.v1'
r34.authority_operation_replay_payload_artifact_store = canonicalStore('authority_operation_replay_payloads', 'authority_operation_replay_payload_schema', 131072)
const envelope = r34.authority_operation_replay_envelope_schema
envelope.schema_version = bump(envelope.schema_version)
envelope.exact_equalities = ['operation_name_operation_id_branch_and_replay_kind_equal_exact_payload', 'payload_ref_hash_and_fingerprint_resolve_exact_payload_artifact', 'response_ref_hash_and_fingerprint_equal_payload_history_and_resolve_exact_historical_response_artifact', 'returned_response_bytes_equal_resolved_historical_response_bytes']
r34.fingerprint_schemas.authority_operation_replay_envelope_r34 = fingerprint('CTRL-G24-AUTHORITY-OPERATION-REPLAY-ENVELOPE-R34', envelope.exact_keys.filter(key => key !== 'envelope_fingerprint'))
envelope.fingerprint_ref = 'fingerprint_schemas.authority_operation_replay_envelope_r34'
delete r34.fingerprint_schemas.authority_operation_replay_envelope_r33
r34.authority_operation_replay_envelope_artifact_store = canonicalStore('authority_operation_replay_envelopes', 'authority_operation_replay_envelope_schema', 131072)

// Exact binding coverage for every result branch.
const resultArtifactBindings = []
for (const [operationName, operation] of Object.entries(operations)) for (const branch of resultBranches) {
  const schemaRef = `case_session_authority_operation_protocols.operations.${operationName}.result_schema.variants.${branch}`
  const storeKey = `schema_${resultSchemaRefs.indexOf(schemaRef) + 1}`
  const registryVariant = branch === 'committed' ? 'original_committed' : 'original_persisted_hold'
  const registryRefField = branch === 'committed' ? 'result_ref' : 'hold_result_ref'
  const registryBytesField = branch === 'committed' ? 'result_bytes_sha256' : 'hold_result_bytes_sha256'
  const registryFingerprintField = branch === 'committed' ? 'result_fingerprint' : 'hold_result_fingerprint'
  resultArtifactBindings.push({ operation_name: operationName, result_branch: branch, result_schema_ref: schemaRef, result_schema_version: operation.result_schema.variants[branch].schema_version, result_fingerprint_field: 'result_fingerprint', forbidden_decoded_result_ref_field: 'result_ref', artifact_store_ref: `authority_operation_artifact_stores.families.results.stores_by_schema_ref.${storeKey}`, artifact_ref_field: 'artifact_ref', artifact_bytes_sha256_field: 'canonical_bytes_sha256', artifact_parsed_fingerprint_field: 'parsed_content_fingerprint', historical_response_fields: { result_ref: 'artifact_ref', result_bytes_sha256: 'canonical_bytes_sha256', result_fingerprint: 'decoded_result.result_fingerprint', response_payload_ref: 'artifact_ref', response_payload_bytes_sha256: 'canonical_bytes_sha256' }, registry_variant_ref: `authority_operation_registry.row_union.variants.${registryVariant}`, registry_fields: { [registryRefField]: 'artifact_ref', [registryBytesField]: 'canonical_bytes_sha256', [registryFingerprintField]: 'decoded_result.result_fingerprint' }, replay_fields: { historical_result_ref: 'artifact_ref', historical_result_bytes_sha256: 'canonical_bytes_sha256', historical_result_fingerprint: 'decoded_result.result_fingerprint' }, exact_type: 'sha256', all_sources_must_exist: true })
}
r34.authority_operation_result_artifact_binding_coverage = { schema_version: 'ctrl.g24.authority-operation-result-artifact-binding-coverage.r34.v1', exact_expected_bindings: 90, exact_committed_bindings: 15, exact_held_bindings: 75, rows: resultArtifactBindings, source_existence_required: true, source_and_local_type_parity_required: true, every_local_identity_field_has_exactly_one_source: true, missing_or_duplicate_binding_action: 'reject_materialization_and_hold_runtime' }

// The graph is generated from the same active identity rules used above.
const identityRules = {
  validated_precommit_material: { kind: 'validated_input', source_refs: ['authority_operation_receipt_precommit_identity_plans'], depends_on: [] },
  receipt_precommit_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_receipt_precommit_ordinary_r33', 'fingerprint_schemas.authority_operation_receipt_precommit_session_r33'], depends_on: ['validated_precommit_material'] },
  session_hold_evidence_fingerprint: { kind: 'fingerprint', source_refs: ['session_hold_evidence_schema'], depends_on: ['validated_precommit_material'] },
  hold_row_ref: { kind: 'content_address_over_precommit_hold_fields', source_refs: ['authority_operation_hold_store.row_union'], depends_on: ['validated_precommit_material', 'session_hold_evidence_fingerprint'] },
  result_fingerprint: { kind: 'fingerprint', source_refs: operationNames.map(name => `case_session_authority_operation_protocols.operations.${name}.result_fingerprint`), depends_on: ['receipt_precommit_fingerprint', 'hold_row_ref'] },
  result_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: resultSchemaRefs, depends_on: ['result_fingerprint'] },
  result_artifact_ref: { kind: 'content_address', source_refs: Object.keys(resultStores).map(key => `authority_operation_artifact_stores.families.results.stores_by_schema_ref.${key}.row_schema.content_address_rule`), depends_on: ['result_canonical_bytes_sha256'] },
  historical_response_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_historical_response_r34'], depends_on: ['result_artifact_ref', 'result_canonical_bytes_sha256', 'result_fingerprint'] },
  historical_response_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: ['authority_operation_historical_response_schema'], depends_on: ['historical_response_fingerprint'] },
  historical_response_artifact_ref: { kind: 'content_address', source_refs: ['authority_operation_historical_response_artifact_store.row_schema.content_address_rule'], depends_on: ['historical_response_canonical_bytes_sha256'] },
  final_receipt_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_receipt_final_ordinary_r34', 'fingerprint_schemas.authority_operation_receipt_final_session_r34'], depends_on: ['result_artifact_ref', 'result_fingerprint', 'historical_response_artifact_ref'] },
  final_hold_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_hold_ordinary_r34', 'fingerprint_schemas.authority_operation_hold_session_r34'], depends_on: ['hold_row_ref', 'result_artifact_ref', 'result_fingerprint', 'historical_response_artifact_ref'] },
  registry_row_ref: { kind: 'content_address_over_registry_identity_fields', source_refs: ['authority_operation_registry.row_union'], depends_on: ['historical_response_artifact_ref', 'final_receipt_fingerprint', 'final_hold_fingerprint'] },
  registry_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_registry_committed_r34', 'fingerprint_schemas.authority_operation_registry_held_r34'], depends_on: ['registry_row_ref', 'historical_response_artifact_ref', 'final_receipt_fingerprint', 'final_hold_fingerprint'] },
  replay_payload_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_replay_payload_committed_r34', 'fingerprint_schemas.authority_operation_replay_payload_held_r34'], depends_on: ['registry_row_ref', 'registry_fingerprint', 'result_artifact_ref', 'historical_response_artifact_ref'] },
  replay_payload_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: ['authority_operation_replay_payload_schema'], depends_on: ['replay_payload_fingerprint'] },
  replay_payload_artifact_ref: { kind: 'content_address', source_refs: ['authority_operation_replay_payload_artifact_store.row_schema.content_address_rule'], depends_on: ['replay_payload_canonical_bytes_sha256'] },
  replay_envelope_fingerprint: { kind: 'fingerprint', source_refs: ['fingerprint_schemas.authority_operation_replay_envelope_r34'], depends_on: ['replay_payload_artifact_ref', 'replay_payload_fingerprint', 'historical_response_artifact_ref'] },
  replay_envelope_canonical_bytes_sha256: { kind: 'canonical_bytes_sha256', source_refs: ['authority_operation_replay_envelope_schema'], depends_on: ['replay_envelope_fingerprint'] },
  replay_envelope_artifact_ref: { kind: 'content_address', source_refs: ['authority_operation_replay_envelope_artifact_store.row_schema.content_address_rule'], depends_on: ['replay_envelope_canonical_bytes_sha256'] },
}
const graphEdges = Object.entries(identityRules).flatMap(([target, rule]) => rule.depends_on.map(source => [source, target]))
r34.authority_operation_identity_derivation_rules = { schema_version: 'ctrl.g24.authority-operation-identity-derivation-rules.r34.v1', scope: 'all_active_authority_operation_result_history_receipt_hold_registry_and_replay_fingerprints_content_addresses_and_exact_identity_equalities', rules: identityRules, every_source_ref_must_resolve: true, every_fingerprint_preimage_field_must_resolve_to_selected_schema_or_declared_upstream_identity: true, every_content_address_operand_must_resolve_to_declared_store_field: true, exact_local_binding_coverage_ref: 'authority_operation_result_artifact_binding_coverage' }
r34.authority_operation_identity_dependency_graph = { schema_version: 'ctrl.g24.authority-operation-identity-dependency-graph.r34.v1', nodes: Object.keys(identityRules), edges: graphEdges, generated_from: 'authority_operation_identity_derivation_rules.rules.*.depends_on', branch_paths: { committed: ['validated_precommit_material', 'receipt_precommit_fingerprint', 'result_fingerprint', 'result_canonical_bytes_sha256', 'result_artifact_ref', 'historical_response_fingerprint', 'historical_response_canonical_bytes_sha256', 'historical_response_artifact_ref', 'final_receipt_fingerprint', 'registry_row_ref', 'registry_fingerprint', 'replay_payload_fingerprint', 'replay_payload_canonical_bytes_sha256', 'replay_payload_artifact_ref', 'replay_envelope_fingerprint', 'replay_envelope_canonical_bytes_sha256', 'replay_envelope_artifact_ref'], held: ['validated_precommit_material', 'session_hold_evidence_fingerprint', 'hold_row_ref', 'result_fingerprint', 'result_canonical_bytes_sha256', 'result_artifact_ref', 'historical_response_fingerprint', 'historical_response_canonical_bytes_sha256', 'historical_response_artifact_ref', 'final_hold_fingerprint', 'registry_row_ref', 'registry_fingerprint', 'replay_payload_fingerprint', 'replay_payload_canonical_bytes_sha256', 'replay_payload_artifact_ref', 'replay_envelope_fingerprint', 'replay_envelope_canonical_bytes_sha256', 'replay_envelope_artifact_ref'] }, generic_cycle_detection_required: true, exact_edge_closure_required: true, missing_reversed_or_extra_edge_action: 'reject_materialization_and_hold_runtime' }

r34.authority_operation_committed_issuance_dag = { schema_version: 'ctrl.g24.authority-operation-committed-issuance-dag.r34.v1', nodes: r34.authority_operation_identity_dependency_graph.branch_paths.committed, edges: r34.authority_operation_identity_dependency_graph.edges.filter(([source, target]) => r34.authority_operation_identity_dependency_graph.branch_paths.committed.includes(source) && r34.authority_operation_identity_dependency_graph.branch_paths.committed.includes(target)), result_artifact_precedes_history: true, history_precedes_final_receipt: true, history_precedes_registry: true, acyclic_required: true }
r34.authority_operation_hold_issuance_dag = { schema_version: 'ctrl.g24.authority-operation-hold-issuance-dag.r34.v1', nodes: r34.authority_operation_identity_dependency_graph.branch_paths.held, edges: r34.authority_operation_identity_dependency_graph.edges.filter(([source, target]) => r34.authority_operation_identity_dependency_graph.branch_paths.held.includes(source) && r34.authority_operation_identity_dependency_graph.branch_paths.held.includes(target)), evidence_precedes_hold_row_ref: true, result_artifact_precedes_history: true, history_precedes_final_hold: true, history_precedes_registry: true, acyclic_required: true }

r34.authority_operation_serializable_branch_transaction.schema_version = 'ctrl.g24.authority-operation-serializable-branch-transaction.r34.v1'
r34.authority_operation_serializable_branch_transaction.committed_issuance_dag_ref = 'authority_operation_committed_issuance_dag'
r34.authority_operation_serializable_branch_transaction.hold_issuance_dag_ref = 'authority_operation_hold_issuance_dag'
r34.authority_operation_serializable_branch_transaction.identity_dependency_graph_ref = 'authority_operation_identity_dependency_graph'
r34.authority_operation_serializable_branch_transaction.atomicity = 'precommit_material_then_outcome_fingerprint_then_outcome_artifact_then_history_then_final_receipt_or_hold_then_registry_then_replay_commit_or_none'
r34.authority_operation_serializable_branch_transaction.crash_rule = 'rollback_all_precommit_result_artifact_history_finalization_registry_replay_nonce_target_head_and_artifact_writes'

r34.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r34.v1', derivation: 'bounded_exact_extension_from_frozen_R33_to_R34_external_result_artifact_identity_exact_history_sources_mechanical_dependency_graph_and_complete_90_variant_binding_coverage', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.case_session_authority_operation_protocols', '$.authority_operation_artifact_stores.families.results', '$.authority_operation_historical_response_schema', '$.authority_operation_historical_response_schema_matrix', '$.authority_operation_historical_response_artifact_store', '$.authority_operation_registry', '$.authority_operation_receipt_store', '$.authority_operation_receipt_precommit_identity_plans', '$.authority_operation_hold_store', '$.authority_operation_replay_resolution_bindings', '$.authority_operation_replay_registry_authority', '$.authority_operation_replay_payload_schema', '$.authority_operation_replay_payload_artifact_store', '$.authority_operation_replay_envelope_schema', '$.authority_operation_replay_envelope_artifact_store', '$.authority_operation_result_artifact_binding_coverage', '$.authority_operation_identity_derivation_rules', '$.authority_operation_identity_dependency_graph', '$.authority_operation_committed_issuance_dag', '$.authority_operation_hold_issuance_dag', '$.authority_operation_serializable_branch_transaction'], recursive_same_version_semantic_change: 'forbidden', every_changed_or_new_semantic_object_has_r34_identifier: true, all_result_schema_refs: resultSchemaRefs, all_committed_result_schema_refs: resultSchemaRefs.filter(ref => ref.endsWith('.committed')), all_held_result_schema_refs: resultSchemaRefs.filter(ref => !ref.endsWith('.committed')), forbidden_result_payload_field: 'result_ref' }
r34.required_negative_fixture_families = [...new Set([...r34.required_negative_fixture_families, 'result_artifact_self_reference', 'held_decoded_result_ref', 'history_result_artifact_source', 'history_registry_dependency', 'identity_graph_exact_edge_closure', 'result_binding_source_type_coverage'])]
r34.visible_surface_changes = []
r34.external_actions_authorized = []

function rejectUndefined(value, path = '$') { if (value === undefined) throw new Error(`undefined:${path}`); if (Array.isArray(value)) value.forEach((item, index) => rejectUndefined(item, `${path}[${index}]`)); else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) rejectUndefined(item, `${path}.${key}`) }
rejectUndefined(r34)
export const materializedR34 = r34
export const materializedR34Output = `${JSON.stringify(r34, null, 2)}\n`
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) { const mode = process.argv[2] ?? '--check'; if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR34Output); console.log(`wrote ${outputPath}`) } else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR34Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R34 effective contract`) } else throw new Error(`unsupported mode:${mode}`) }
