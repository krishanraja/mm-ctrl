import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR52, materializedR52Output, r52SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r52.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r52.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r53.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR52Output) throw new Error('R53_frozen_R52_input_mismatch')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }
const r53 = structuredClone(materializedR52)
const schemaAt = (ref, variant = 'UNAVAILABLE') => { const schema = get(r53, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }

r53.schema_version = 'ctrl.g24.trusted-ingress.r53.effective.v1'
r53.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r52_vetoed', 'trusted_ingress_r53_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r53.supersedes = { commit: '183040da495d67ac1e2df02a4b42cd8d30178810', tree: '8f34fab81f5b1275fe41b00bcf092d1e138c51bb', human_blob: 'cce56633cc7d191624f687a5472370e909a23fc6', machine_blob: '77c7d570148061a8ee95c3e482bc7495ea084277', qa_blob: 'cdf0515ed8520d73e3562ede98f3ce824d917c5c', checker_blob: 'fa2f07b0e12ad6da6e4d3b8db281ab0afcd40888', materializer_blob: '3a161a1de53f56ed0923a8b9021e18e6fe4d4728', founder_checker_blob: '6e081b3b2dec524e9ceff64718245f275f5f6dc8', adjudication: 'veto' }
r53.materialization = { ...r53.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r53.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['freeze_R52_input', 'declare_normative_persistence_registry_in_code', 'derive_native_identity_roles_from_closed_schemas', 'execute_schema_valid_identity_formulas', 'derive_source_constant_selector_contexts', 'prove_selector_totality_and_uniqueness', 'declare_schema_semantic_field_registry', 'finalize_schema_change_and_all_nonderived_authorities', 'snapshot_final_semantic_sources', 'resolve_semantic_paths_and_owners', 'derive_manifest', 'seal_output'], no_post_snapshot_source_write: true }

// These paths are independently pinned in producer and checker code. They are not
// discovered from candidate-authored store, registry or writer name markers.
export const R53_DIRECT_PERSISTED_SCHEMA_PATHS = Object.freeze([
  'case_authority_bindings',
  'operation_registry.committed_success_row_schema',
  'operation_registry.committed_hold_row_schema',
  'outbox.reservation_schema',
  'outbox.dispatch_schema',
  'outbox.provider_success_evidence_schema',
  'outbox.provider_failure_evidence_schema',
  'outbox.reconciliation_evidence_schema',
  'outbox.transition_event_schema',
  'outbox.claim_event_schema',
  'outbox.pre_provider_failure_event_schema',
  'outbox.unknown_event_schema',
  'outbox.effect_schema',
  'outbox.creation_event_schema',
  'outbox.invocation_event_schema',
  'outbox.abandon_without_invocation_schema',
  'outbox.payload_consumption_schema',
  'outbox.reconciled_success_evidence_schema',
  'outbox.reconciled_failure_evidence_schema',
  'outbox.reservation_budget_exhausted_schema',
  'outbox.effect_origin_schema',
  'outbox.invocation_aborted_before_provider_schema',
  'outbox.worker_ambiguity_evidence_schema',
  'outbox.lease_expiry_ambiguity_evidence_schema',
  'intervention_visibility_receipt_schema',
  'presentation_challenge_schema',
  'authoritative_row_schemas.selector_results',
  'authoritative_row_schemas.selector_candidate_sets',
  'authoritative_row_schemas.selector_policies',
  'authoritative_row_schemas.intervention_approval_receipts',
  'authoritative_row_schemas.intervention_atoms',
  'authoritative_row_schemas.intervention_visibility_acknowledgements',
  'authoritative_row_schemas.answer_receipts',
  'authoritative_row_schemas.leader_authority_receipts',
  'authoritative_row_schemas.answer_visibility_acknowledgements',
  'authoritative_row_schemas.correction_receipts',
  'authoritative_row_schemas.lifecycle_transition_receipts',
  'authoritative_row_schemas.lifecycle_snapshots',
  'authoritative_row_schemas.lifecycle_authority_receipts',
  'authoritative_row_schemas.pending_release_projections',
  'authoritative_row_schemas.release_authority_receipts',
  'authoritative_row_schemas.enrichment_plans',
  'authoritative_row_schemas.enrichment_budget_policies',
  'authoritative_row_schemas.enrichment_terminal_states',
  'authoritative_row_schemas.enrichment_execution_receipts',
  'authoritative_row_schemas.case_identities',
  'authoritative_row_schemas.accepted_release_requests',
  'authoritative_row_schemas.lifecycle_action_receipts',
  'authoritative_row_schemas.lifecycle_precondition_evidence',
  'authoritative_row_schemas.lifecycle_action_combination_consumptions',
  'authoritative_row_schemas.lifecycle_joint_transition_consumptions',
  'authoritative_row_schemas.lifecycle_single_action_transition_consumptions',
  'authoritative_row_schemas.release_projection_requests',
  'authoritative_row_schemas.release_authority_terminal_consumptions',
  'authoritative_row_schemas.leader_answer_authority_consumptions',
  'intervention_visibility_consumption_schema',
])
export const R53_STORE_CONTAINER_PATHS = Object.freeze([
  'authority_operation_historical_response_artifact_store',
  'authority_operation_hold_store',
  'authority_operation_pre_materialized_replay_lookup_store',
  'authority_operation_receipt_store',
  'authority_operation_registry',
  'authority_operation_replay_envelope_artifact_store',
  'authority_operation_replay_payload_artifact_store',
  'authority_partition_head_store',
  'authority_verifier_public_key_artifact_store',
  'case_authority_control_operation_registry',
  'case_session_authority_read_set_artifact_store',
  'operation_hold_blob_store',
  'operation_response_blob_store',
  'operation_result_blob_store',
  'principal_authority_artifact_stores.live_principal_assertions',
  'principal_authority_artifact_stores.presented_principal_projections',
  'proof_nonce_ledger',
  'session_dual_proof_bundle_artifact_store',
  'session_dual_proof_bundle_truth_projection_artifact_store',
  'session_dual_proof_receipt_evidence_store',
  'session_hold_evidence_artifact_store',
])
export const R53_ARTIFACT_FAMILIES = Object.freeze(['requests', 'targets', 'proofs', 'results'])
export const R53_OPAQUE_STORE_NAMES = Object.freeze(['target', 'proof_primary', 'proof_bundle', 'proof_issuer', 'proof_evaluator'])
export const R53_COMMITTED_TARGET_SCHEMA_PATHS = Object.freeze([
  'authoritative_row_schemas.case_session_root_trust_anchors',
  'authoritative_row_schemas.case_session_issuer_registry',
  'authoritative_row_schemas.case_session_evaluator_registry',
  'authoritative_row_schemas.account_stable_actor_bindings',
  'authoritative_row_schemas.account_access_standings',
  'authoritative_row_schemas.case_server_session_principal_evidence',
])

function writerFor(path, group) {
  if (group === 'direct_outbox') return 'outbox'
  if (group === 'direct_authoritative' || group === 'direct_visibility') return 'operation_specs'
  if (path === 'case_authority_bindings') return 'case_authority_control_plane'
  if (path.startsWith('operation_registry.')) return 'operation_registry'
  if (group === 'committed_target') return path.endsWith('case_session_root_trust_anchors') ? 'case_session_root_trust_anchor_authority' : `case_session_authority_store_controls.stores.${path.split('.').at(-1)}`
  return path
}
function registryRow(storePath, schemaRef, variant, group, reason, storeDefinitionPath = storePath) {
  const schema = schemaAt(schemaRef, variant), store = get(r53, storeDefinitionPath)
  if (!schema?.properties || !schema.schema_version) throw new Error(`R53_persistence_schema_missing:${schemaRef}:${variant}`)
  const writerAuthorityRef = writerFor(storeDefinitionPath, group)
  if (!get(r53, writerAuthorityRef)) throw new Error(`R53_writer_authority_missing:${writerAuthorityRef}`)
  return { store_path: storePath, store_definition_path: storeDefinitionPath, store_schema_version: store?.schema_version ?? schema.schema_version, row_schema_ref: schemaRef, row_schema_variant: variant, row_schema_version: schema.schema_version, persistence_group: group, inclusion_reason: reason, writer_authority_ref: writerAuthorityRef, writer_role_literal: store?.sole_writer ?? store?.sole_writer_role ?? schema.sole_writer ?? 'schema_bound_operation_writer', direct_dml_rule: store?.direct_dml ?? store?.direct_dml_by_application_browser_edge_worker_generic_service_or_caller ?? schema.direct_dml ?? 'forbidden_by_normative_persistence_registry' }
}
export function buildR53PersistenceRows(contract = r53) {
  const rows = []
  for (const path of R53_STORE_CONTAINER_PATHS) {
    const store = get(contract, path)
    if (store?.row_schema) rows.push(registryRow(path, `${path}.row_schema`, 'UNAVAILABLE', 'closed_store_container', 'explicitly_pinned_durable_store_with_closed_row_schema'))
    else if (store?.row_union?.variants) for (const variant of Object.keys(store.row_union.variants).sort(cp)) rows.push(registryRow(path, `${path}.row_union`, variant, 'closed_store_container', 'explicitly_pinned_durable_store_with_closed_discriminated_row_union'))
    else throw new Error(`R53_store_container_shape_missing:${path}`)
  }
  for (const family of R53_ARTIFACT_FAMILIES) {
    const base = `authority_operation_artifact_stores.families.${family}.stores_by_schema_ref`
    for (const key of Object.keys(get(contract, base)).sort(cp)) rows.push(registryRow(`${base}.${key}`, `${base}.${key}.row_schema`, 'UNAVAILABLE', 'canonical_artifact_family_store', `explicit_${family}_artifact_store_member`, `${base}.${key}`))
  }
  for (const name of R53_OPAQUE_STORE_NAMES) {
    const path = `authority_opaque_raw_input_stores.${name}`
    rows.push(registryRow(path, `${path}.row_schema`, 'UNAVAILABLE', 'opaque_raw_input_store', `explicit_opaque_${name}_store`))
  }
  for (const path of R53_COMMITTED_TARGET_SCHEMA_PATHS) rows.push(registryRow(path.replace('authoritative_row_schemas.', ''), path, 'UNAVAILABLE', 'committed_target', 'explicit_server_committed_authority_row', path))
  for (const path of R53_DIRECT_PERSISTED_SCHEMA_PATHS) {
    const group = path.startsWith('outbox.') ? 'direct_outbox' : path.startsWith('authoritative_row_schemas.') ? 'direct_authoritative' : ['intervention_visibility_receipt_schema', 'presentation_challenge_schema', 'intervention_visibility_consumption_schema'].includes(path) ? 'direct_visibility' : 'direct_registry'
    rows.push(registryRow(path, path, 'UNAVAILABLE', group, 'independently_pinned_append_only_or_unique_persistent_schema', path))
  }
  rows.push(registryRow('proof_nonce_receipt_store', r53.proof_nonce_receipt_store.row_schema_ref, 'UNAVAILABLE', 'proof_nonce_receipt_store', 'explicit_store_with_external_closed_row_schema', 'proof_nonce_receipt_store'))
  const sorted = rows.sort((a, b) => cp(`${a.store_path}|${a.row_schema_ref}|${a.row_schema_variant}`, `${b.store_path}|${b.row_schema_ref}|${b.row_schema_variant}`))
  const keys = sorted.map(row => `${row.store_path}|${row.row_schema_ref}|${row.row_schema_variant}`)
  if (sorted.length !== 217 || new Set(keys).size !== sorted.length) throw new Error(`R53_persistence_registry_count:${sorted.length}:${new Set(keys).size}`)
  return sorted
}
const persistenceRows = buildR53PersistenceRows()
const exclusionRows = [
  ['authority_operation_registry', ['original_committed', 'original_persisted_hold']],
  ['authority_operation_receipt_store', ['ordinary_single_proof_committed', 'session_dual_proof_committed']],
  ['authority_operation_hold_store', ['ordinary_single_proof', 'session_dual_proof']],
  ['authority_operation_pre_materialized_replay_lookup_store', ['committed', 'held']],
].flatMap(([path, variants]) => variants.map(variant => ({ excluded_alias_path: `${path}.row_union.variants.${variant}`, represented_by_store_path: path, represented_by_row_schema_ref: `${path}.row_union`, represented_by_variant: variant, exclusion_reason: 'nested_variant_is_one_view_of_the_parent_discriminated_store_and_must_not_be_double_counted' })))
r53.authority_operation_normative_persistence_registry = { schema_version: 'ctrl.g24.normative-persistence-registry.r53.v1', authority_source: 'independently_pinned_code_owned_path_groups_not_candidate_authored_markers_or_name_inference', row_schema_version: 'ctrl.g24.normative-persistence-registry-row.r53.v1', row_exact_keys: ['store_path', 'store_definition_path', 'store_schema_version', 'row_schema_ref', 'row_schema_variant', 'row_schema_version', 'persistence_group', 'inclusion_reason', 'writer_authority_ref', 'writer_role_literal', 'direct_dml_rule'], exact_rows: persistenceRows, exact_persistent_shape_count: persistenceRows.length, explicit_exclusions: exclusionRows, bidirectional_rule: 'every_independently_declared_persistent_shape_exactly_once_and_every_row_resolves_one_closed_schema_and_existing_writer_or_store_authority', marker_suffix_or_candidate_registry_discovery: 'forbidden', missing_extra_duplicate_schema_writer_or_variant: 'reject_materialization_and_hold_without_write' }
r53.authority_operation_complete_persisted_store_universe = { schema_version: 'ctrl.g24.complete-persisted-store-universe.r53.v1', derivation: 'exact_projection_of_independently_declared_normative_persistence_registry', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', exact_store_shape_count: persistenceRows.length, exact_rows: persistenceRows, required_groups: ['closed_store_container', 'canonical_artifact_family_store', 'opaque_raw_input_store', 'committed_target', 'direct_outbox', 'direct_authoritative', 'direct_visibility', 'direct_registry', 'proof_nonce_receipt_store'], exact_inclusion_and_exclusion_reasons_required: true, bidirectional_equality_required: true }
r53.authority_operation_normative_durable_store_authority_graph = { schema_version: 'ctrl.g24.normative-durable-store-authority-graph.r53.v1', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', exact_rows: persistenceRows, exact_store_shape_count: persistenceRows.length, derived_from_candidate_store_name_or_marker_scan: false, every_active_writer_and_row_variant_included: true }

const priorEqualityRows = materializedR52.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows
const sourceEqualityBySchema = new Map()
for (const row of priorEqualityRows) {
  const key = `${row.source_schema_ref}|${row.source_schema_variant}`
  if (!sourceEqualityBySchema.has(key)) sourceEqualityBySchema.set(key, [])
  sourceEqualityBySchema.get(key).push(row)
}
function uniqueKeys(schema, store) {
  const raw = schema.unique_keys ?? schema.unique_key ?? store?.unique_lookup ?? store?.unique_keys ?? []
  const rows = Array.isArray(raw) ? raw : [raw]
  return uniq(rows.map(value => Array.isArray(value) ? value : [value]).filter(row => row.every(field => typeof field === 'string')))
}
function contentAddressFields(schema, store, storePath) {
  const fields = new Set()
  const rules = [schema.content_address_rule, schema.row_ref_derivation, store?.content_address_rule, store?.one_row_per_reference].filter(value => typeof value === 'string').join('|')
  for (const field of Object.keys(schema.properties)) if (rules.includes(field)) fields.add(field)
  for (const field of schema.row_ref_preimage_excluded_fields ?? []) if (field !== schema.fingerprint_field && Object.hasOwn(schema.properties, field)) fields.add(field)
  if (storePath === 'proof_nonce_receipt_store') fields.add('nonce_receipt_ref')
  return fields
}
function valueForSpec(spec, seed) {
  if (!spec || typeof spec !== 'object') return `fixture_${seed}`
  if (Object.hasOwn(spec, 'const')) return spec.const
  const values = spec.values ?? spec.enum
  if (Array.isArray(values) && values.length) return values[0]
  if (spec.type === 'sha256') return sha(`R53:${seed}`)
  if (spec.type === 'sha256_or_exact_literal') return sha(`R53:${seed}`)
  if (spec.type === 'canonical_timestamp') return '2030-01-01T00:00:00.000Z'
  if (spec.type === 'base64url_without_padding') return Buffer.from(`R53:${seed}`, 'utf8').toString('base64url')
  if (spec.type === 'boolean') return false
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return spec.type === 'positive_integer' ? 1 : 0
  if (spec.type === 'nullable') return null
  if (spec.type === 'array') return []
  if (spec.type === 'object' && spec.properties) return Object.fromEntries(Object.entries(spec.properties).map(([field, child]) => [field, valueForSpec(child, `${seed}_${field}`)]))
  return `fixture_${seed}`
}
function schemaPayload(schema, seed) { return Object.fromEntries(Object.entries(schema.properties).map(([field, spec]) => [field, valueForSpec(spec, `${seed}_${field}`)])) }
function fingerprintFixture(schema, fingerprintRef, identityField, seed) {
  const authority = get(r53, fingerprintRef)
  if (!authority?.domain_ascii || !Array.isArray(authority.preimage_order) || authority.field_encoding_ref !== 'canonical_json_utf8_encoding') throw new Error(`R53_fingerprint_authority_invalid:${fingerprintRef}`)
  const payload = schemaPayload(schema, seed), preimage = {}
  for (const field of authority.preimage_order) {
    if (field === 'domain_ascii') preimage[field] = authority.domain_ascii
    else {
      if (!Object.hasOwn(schema.properties, field)) throw new Error(`R53_fingerprint_preimage_field_missing:${fingerprintRef}:${field}`)
      preimage[field] = payload[field]
    }
  }
  const expected = hash(preimage)
  payload[identityField] = expected
  return { schema_valid_payload: payload, exact_preimage: preimage, exact_preimage_order: authority.preimage_order, exact_preimage_field_types: authority.preimage_order.map(field => field === 'domain_ascii' ? 'domain_ascii_literal' : schema.properties[field].type ?? (Object.hasOwn(schema.properties[field], 'const') ? 'literal' : 'enum')), expected_identity: expected, execution: 'canonical_json_utf8_sha256', selected_fingerprint_authority_ref: fingerprintRef }
}
r53.authority_operation_persisted_identity_formula_library = {
  schema_version: 'ctrl.g24.persisted-identity-formula-library.r53.v1',
  canonical_row_bytes_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.canonical-row-bytes.r53.v1', formula_class: 'raw_sha256_canonical_bytes', exact_formula: 'lowercase_hex_SHA256_of_exact_closed_schema_canonical_row_bytes' },
  declared_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-content-address.r53.v1', formula_class: 'schema_or_store_declared_content_address', exact_formula: 'execute_the_exact_content_address_or_row_ref_rule_declared_by_the_selected_schema_or_store' },
  declared_row_version: { schema_version: 'ctrl.g24.persisted-identity-formula.declared-row-version.r53.v1', formula_class: 'schema_declared_row_version', exact_formula: 'execute_server_owned_row_version_or_row_ref_preimage_using_all_declared_fields_domain_and_version' },
  schema_declared_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.schema-fingerprint.r53.v1', formula_class: 'selected_schema_fingerprint_authority', codec_ref: 'canonical_json_utf8_encoding', exact_formula: 'validate_schema_payload_build_exact_declared_ordered_preimage_and_hash_the_declared_codec_bytes' },
  unique_key_component: { schema_version: 'ctrl.g24.persisted-identity-formula.unique-key-component.r53.v1', formula_class: 'native_schema_unique_key_component', exact_formula: 'exact_value_from_the_named_closed_schema_unique_key_position' },
  resolved_reference_identity: { schema_version: 'ctrl.g24.persisted-identity-formula.resolved-reference.r53.v1', formula_class: 'exact_resolved_target_native_identity', exact_formula: 'source_reference_equals_the_single_concretely_selected_target_native_identity' },
  companion_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-fingerprint.r53.v1', formula_class: 'resolved_target_native_fingerprint', exact_formula: 'companion_fingerprint_equals_the_selected_target_schema_declared_fingerprint' },
}
const identityRows = [], identityAuthorities = {}
for (const storeRow of persistenceRows) {
  const schema = schemaAt(storeRow.row_schema_ref, storeRow.row_schema_variant), store = get(r53, storeRow.store_definition_path)
  const roles = new Map([['$canonical_row_bytes', 'canonical_row_bytes_content_address']])
  const keys = uniqueKeys(schema, store)
  for (const field of keys.flat()) if (Object.hasOwn(schema.properties, field)) roles.set(field, 'unique_key_component')
  for (const field of contentAddressFields(schema, store, storeRow.store_path)) roles.set(field, 'declared_content_address')
  for (const field of schema.server_owned_fields ?? []) if (Object.hasOwn(schema.properties, field) && (field === 'row_version_ref' || field === 'new_row_version_ref' || field === 'head_row_version_ref')) roles.set(field, 'declared_row_version')
  if (schema.fingerprint_field && Object.hasOwn(schema.properties, schema.fingerprint_field) && schema.fingerprint_ref && get(r53, schema.fingerprint_ref)) roles.set(schema.fingerprint_field, 'schema_declared_fingerprint')
  for (const equality of sourceEqualityBySchema.get(`${storeRow.row_schema_ref}|${storeRow.row_schema_variant}`) ?? []) {
    if (equality.exact_one_resolution_required && Object.hasOwn(schema.properties, equality.source_field) && !roles.has(equality.source_field)) roles.set(equality.source_field, 'resolved_reference_identity')
    for (const companion of equality.companion_fingerprint_fields ?? []) if (Object.hasOwn(schema.properties, companion.field) && !roles.has(companion.field)) roles.set(companion.field, 'companion_fingerprint')
  }
  for (const [field, role] of [...roles].sort((a, b) => cp(a[0], b[0]))) {
    const key = `identity_${String(identityRows.length + 1).padStart(4, '0')}`
    const identityKind = `${storeRow.store_path}|${storeRow.row_schema_variant}|${field}|${role}`
    let executable
    if (role === 'schema_declared_fingerprint') executable = fingerprintFixture(schema, schema.fingerprint_ref, field, key)
    else if (role === 'canonical_row_bytes_content_address' || role === 'declared_content_address') { const bytes = Buffer.from(canonicalR44(schemaPayload(schema, key)), 'utf8'); executable = { input_b64url: bytes.toString('base64url'), expected_identity: sha(bytes), execution: 'raw_sha256' } }
    else if (role === 'declared_row_version') { const preimage = { domain_ascii: schema.row_ref_domain_ascii ?? 'CTRL-G24-R53-DECLARED-ROW-VERSION', schema_version: schema.row_ref_schema_version ?? schema.schema_version, row_without_version: schemaPayload(schema, key) }; executable = { exact_preimage: preimage, expected_identity: hash(preimage), execution: 'canonical_json_utf8_sha256' } }
    else { const exactValue = valueForSpec(schema.properties[field], `${key}_${field}`); executable = { selected_target_native_identity: exactValue, expected_identity: exactValue, execution: 'exact_native_identity_equality' } }
    const authority = { schema_version: 'ctrl.g24.persisted-native-identity-authority.r53.v1', identity_kind: identityKind, store_path: storeRow.store_path, row_schema_ref: storeRow.row_schema_ref, row_schema_variant: storeRow.row_schema_variant, row_schema_version: storeRow.row_schema_version, identity_field: field, native_identity_role: role, native_unique_key_memberships: keys.filter(row => row.includes(field)), selected_formula_authority_ref: `authority_operation_persisted_identity_formula_library.${role}`, executable_formula_fixture: executable }
    identityAuthorities[key] = authority
    identityRows.push({ identity_kind: identityKind, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: authority.schema_version, store_path: storeRow.store_path, row_schema_ref: storeRow.row_schema_ref, row_schema_variant: storeRow.row_schema_variant, row_schema_version: storeRow.row_schema_version, identity_field: field, native_identity_role: role })
  }
}
r53.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r53.authority_operation_artifact_fingerprint_derivation_authority = { schema_version: 'ctrl.g24.authority-operation-native-identity-derivation-authority.r53.v1', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', persisted_identity_formula_library_ref: 'authority_operation_persisted_identity_formula_library', native_identity_role_sources: ['schema_unique_keys', 'schema_or_store_content_address_rule', 'schema_server_owned_version_fields', 'schema_fingerprint_field_and_fingerprint_ref', 'schema_declared_reference_and_companion_relationships'], suffix_or_property_name_only_identity_inference: 'forbidden', sole_active_identity_index: identityRows, exact_identity_kind_count: identityRows.length, exact_store_shape_count: persistenceRows.length, formula_execution_required: true, schema_declared_fingerprint_payload_and_preimage_validation_required: true, missing_extra_duplicate_unresolved_or_type_mismatched_identity: 'reject_materialization_and_hold_without_write' }

function splitSchemaRef(ref) { const marker = '.variants.', index = String(ref).indexOf(marker); return index < 0 ? { schema_ref: ref, schema_variant: 'UNAVAILABLE' } : { schema_ref: ref.slice(0, index), schema_variant: ref.slice(index + marker.length) } }
function values(spec) { if (!spec) return []; if (Object.hasOwn(spec, 'const')) return [spec.const]; return spec.values ?? spec.enum ?? [] }
const freshRows = r53.authority_operation_fresh_branch_class_selection.rows
function sourceContexts(row) {
  const schema = schemaAt(row.source_schema_ref, row.source_schema_variant), match = row.source_schema_ref.match(/operations\.([^.]+)\./)
  let operations = match ? [match[1]] : values(schema?.properties?.operation_name)
  if (!operations.length) operations = uniq(row.exact_target_cases.map(item => item.operation_name).filter(name => name && name !== 'ALL'))
  if (!operations.length) operations = ['UNAVAILABLE']
  const pathBranch = row.source_schema_ref.match(/result_schema\.variants\.([^.]+)$/)?.[1]
  let branches = pathBranch ? [pathBranch] : [...values(schema?.properties?.result_branch), ...values(schema?.properties?.hold_branch), ...values(schema?.properties?.branch)]
  branches = uniq(branches)
  const contexts = []
  for (const operationName of operations) {
    let opRows = freshRows.filter(item => item.operation_name === operationName)
    if (['original_committed', 'replayed_committed', 'committed', 'ordinary_single_proof_committed', 'session_dual_proof_committed'].includes(row.source_schema_variant)) opRows = opRows.filter(item => item.result_branch === 'committed')
    if (['original_persisted_hold', 'replayed_held', 'held', 'ordinary_single_proof', 'session_dual_proof'].includes(row.source_schema_variant)) opRows = opRows.filter(item => item.result_branch !== 'committed')
    if (row.source_schema_variant === 'ordinary_single_proof') opRows = opRows.filter(item => item.branch_class === 'ordinary_held')
    if (row.source_schema_variant === 'session_dual_proof') opRows = opRows.filter(item => item.branch_class?.startsWith('session_'))
    const selected = branches.length ? opRows.filter(item => branches.includes(item.result_branch)) : opRows
    const rows = selected.length ? selected : [{ operation_name: operationName, result_branch: branches[0] ?? 'UNAVAILABLE', proof_family: 'UNAVAILABLE', branch_class: 'UNAVAILABLE', evidence_kind: 'UNAVAILABLE', hold_schema_ref: 'UNAVAILABLE' }]
    for (const selectedRow of rows) contexts.push({ source_operation: operationName, source_result_branch: selectedRow.result_branch, proof_family: selectedRow.proof_family, branch_class: selectedRow.branch_class, evidence_kind: selectedRow.evidence_kind, target_store: get(r53, `case_session_authority_operation_protocols.operations.${operationName}.target_store`) ?? get(r53, `case_session_authority_operation_protocols.operations.${operationName}.request_schema.properties.target_store.const`) ?? 'UNAVAILABLE', source_store_variant: row.source_schema_variant, fresh_selection_row_id: selectedRow.selection_row_id ?? 'UNAVAILABLE', hold_schema_ref: selectedRow.hold_schema_ref ?? 'UNAVAILABLE' })
  }
  return uniq(contexts).sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
}
function nativeFormula(role) { return `authority_operation_persisted_identity_formula_library.${role}` }
function targetCase(ref, variant, field, role, context) { const schema = schemaAt(ref, variant); if (!schema) throw new Error(`R53_target_schema_missing:${ref}:${variant}`); return { ...context, target_schema_ref: ref, target_schema_variant: variant, target_schema_version: schema.schema_version, target_native_identity_field: field, target_native_identity_role: role, target_identity_formula_authority_ref: nativeFormula(role) } }
function selectTarget(row, context) {
  if (['registry_row_ref', 'committed_registry_row_ref', 'held_registry_row_ref'].includes(row.source_field)) return targetCase(row.source_schema_ref, row.source_schema_variant, row.source_field, 'declared_content_address', context)
  if (row.source_field === 'receipt_ref' && row.source_schema_ref === 'authority_operation_receipt_store.row_union') return targetCase(row.source_schema_ref, row.source_schema_variant, 'receipt_ref', 'declared_content_address', context)
  if (row.source_field === 'receipt_ref') return targetCase('authority_operation_receipt_store.row_union', context.proof_family === 'dual_issuer_evaluator' ? 'session_dual_proof_committed' : 'ordinary_single_proof_committed', 'receipt_ref', 'declared_content_address', context)
  if (row.source_field === 'payload_ref' && row.source_schema_ref === 'authority_operation_replay_envelope_schema') return targetCase('authority_operation_replay_payload_schema', context.source_result_branch === 'committed' ? 'replayed' : 'replayed_held', '$canonical_row_bytes', 'canonical_row_bytes_content_address', context)
  if (row.source_field === 'hold_row_ref' && context.hold_schema_ref !== 'UNAVAILABLE') { const parsed = splitSchemaRef(context.hold_schema_ref); return targetCase(parsed.schema_ref, parsed.schema_variant, 'hold_row_ref', 'declared_content_address', context) }
  if (row.source_field === 'binding_ref') return targetCase('authoritative_row_schemas.account_stable_actor_bindings', 'UNAVAILABLE', 'binding_ref', 'resolved_reference_identity', context)
  if (row.source_field === 'standing_ref') return targetCase('authoritative_row_schemas.account_access_standings', 'UNAVAILABLE', 'standing_ref', 'resolved_reference_identity', context)
  if (row.source_field === 'target_row_bytes_ref' && context.target_store !== 'UNAVAILABLE') return targetCase(`authoritative_row_schemas.${context.target_store}`, 'UNAVAILABLE', '$canonical_row_bytes', 'canonical_row_bytes_content_address', context)
  const cases = row.exact_target_cases.filter(item => (item.operation_name === 'ALL' || context.source_operation === 'UNAVAILABLE' || item.operation_name === context.source_operation) && (item.target_store === 'ALL' || context.target_store === 'UNAVAILABLE' || item.target_store === context.target_store) && (item.result_branch === 'ALL' || item.result_branch === context.source_result_branch || (item.result_branch === 'ordinary_single_proof' && context.branch_class === 'ordinary_held') || (item.result_branch === 'session_dual_proof' && context.branch_class?.startsWith('session_'))))
  const exact = uniq(cases.map(item => ({ target_schema_ref: item.target_schema_ref, target_schema_variant: item.target_schema_variant, target_schema_version: item.target_schema_version, target_native_identity_field: item.target_identity_kind === 'row_version_ref' ? 'row_version_ref' : item.target_identity_kind, target_native_identity_role: item.target_identity_kind?.includes('fingerprint') ? 'schema_declared_fingerprint' : item.target_identity_kind === 'row_version_ref' ? 'declared_row_version' : 'resolved_reference_identity', target_identity_formula_authority_ref: item.target_identity_formula_authority_ref })))
  if (!exact.length) throw new Error(`R53_selector_no_target:${row.source_schema_ref}:${row.source_field}:${canonicalR44(context)}`)
  const item = exact.sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))[0]
  return { ...context, ...item, target_identity_formula_authority_ref: get(r53, item.target_identity_formula_authority_ref) ? item.target_identity_formula_authority_ref : nativeFormula(item.target_native_identity_role) }
}
const equalityRows = [], selectors = {}
for (const prior of priorEqualityRows) {
  const row = { ...prior, source_schema_version: schemaAt(prior.source_schema_ref, prior.source_schema_variant)?.schema_version ?? 'UNAVAILABLE' }
  if (prior.exact_one_resolution_required) {
    const contexts = sourceContexts(prior), cases = contexts.map(context => selectTarget(prior, context))
    const id = `selector_${String(Object.keys(selectors).length + 1).padStart(4, '0')}`
    selectors[id] = { schema_version: 'ctrl.g24.native-source-constant-selector.r53.v1', selector_id: id, source_schema_ref: prior.source_schema_ref, source_schema_variant: prior.source_schema_variant, source_schema_version: row.source_schema_version, source_field: prior.source_field, selection_dimensions: ['source_operation', 'source_result_branch', 'proof_family', 'branch_class', 'evidence_kind', 'target_store', 'source_store_variant', 'fresh_selection_row_id'], exact_source_constant_cases: contexts, exact_concrete_cases: cases, exact_case_count: cases.length, each_valid_source_constant_case_matches_exactly_one_target: true, caller_override_or_fallback: 'forbidden' }
    row.classification = 'internal_exact_one_native_source_constant_selector'
    row.selector_ref = `authority_operation_internal_reference_target_selectors.rows.${id}`
    row.exact_target_cases = cases
    row.exact_source_constant_cases = contexts
    row.native_target_roles_required = true
  }
  equalityRows.push(row)
}
r53.authority_operation_internal_reference_target_selectors = { schema_version: 'ctrl.g24.internal-reference-target-selectors.r53.v1', row_schema_version: 'ctrl.g24.native-source-constant-selector.r53.v1', derivation: 'closed_source_schema_constants_plus_operation_proof_family_branch_store_and_fresh_selection_maps', exact_count: Object.keys(selectors).length, exact_source_context_count: Object.values(selectors).reduce((sum, row) => sum + row.exact_case_count, 0), rows: selectors, selector_totality_and_uniqueness_for_every_valid_source_context: true, incompatible_operation_branch_proof_family_store_or_variant: 'reject_and_hold_without_write', caller_override_meta_target_or_fallback: 'forbidden' }
r53.authority_operation_complete_schema_cross_artifact_equality_registry = { schema_version: 'ctrl.g24.complete-schema-cross-artifact-equality-registry.r53.v1', exact_rows: equalityRows, exact_row_count: equalityRows.length, internal_exact_one_count: equalityRows.filter(row => row.exact_one_resolution_required).length, native_source_context_selector_ref: 'authority_operation_internal_reference_target_selectors', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', internal_targets_are_exact_schema_variant_version_and_native_role: true }
r53.authority_operation_explicit_nonartifact_reference_field_allowlist = { ...r53.authority_operation_explicit_nonartifact_reference_field_allowlist, schema_version: 'ctrl.g24.explicit-nonartifact-reference-field-allowlist.r53.v1', exact_rows: equalityRows.filter(row => !row.exact_one_resolution_required).map(row => ({ source_schema_ref: row.source_schema_ref, source_schema_variant: row.source_schema_variant, source_field: row.source_field, classification: row.classification })), internal_exact_one_fields_excluded: true }
r53.authority_operation_artifact_resolution_authority = { ...r53.authority_operation_artifact_resolution_authority, schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r53.v1', normative_persistence_registry_ref: 'authority_operation_normative_persistence_registry', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority', source_constant_selector_ref: 'authority_operation_internal_reference_target_selectors', every_internal_selected_reference_uses_exact_schema_variant_version_and_native_role: true }
r53.authority_operation_restart_correlation_authority = { ...r53.authority_operation_restart_correlation_authority, schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r53.v1', equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', native_identity_authority_ref: 'authority_operation_artifact_fingerprint_derivation_authority' }

export const R53_PINNED_NON_SUFFIX_SEMANTIC_FIELDS = Object.freeze(['authority', 'then', 'sole_writer', 'writer', 'source', 'target', 'derivation', 'binding', 'transaction_boundary', 'selected_branch_table', 'selected_matrix', 'selected_result_artifact_store_family', 'owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding'])
const schemaSemanticRows = [], semanticSeen = new Set()
function addSemanticField(fieldName, basis, schemaRef = 'GLOBAL', variant = 'UNAVAILABLE', fieldType = 'semantic_string') {
  const id = `${schemaRef}|${variant}|${fieldName}|${basis}`
  if (!semanticSeen.has(id)) { semanticSeen.add(id); schemaSemanticRows.push({ schema_ref: schemaRef, schema_variant: variant, field_name: fieldName, field_type: fieldType, declaration_basis: basis }) }
}
for (const field of R53_PINNED_NON_SUFFIX_SEMANTIC_FIELDS) addSemanticField(field, 'independently_pinned_non_suffix_control_field')
for (const row of equalityRows) addSemanticField(row.source_field, row.exact_one_resolution_required ? 'closed_schema_internal_reference_field' : 'closed_schema_explicit_nonartifact_reference_field', row.source_schema_ref, row.source_schema_variant, row.source_field_type)
for (const store of persistenceRows) {
  const schema = schemaAt(store.row_schema_ref, store.row_schema_variant)
  for (const [field, spec] of Object.entries(schema.properties)) {
    const literals = Object.hasOwn(spec, 'const') ? [spec.const] : spec.values ?? spec.enum ?? []
    if (literals.some(value => typeof value === 'string' && get(r53, value) !== undefined)) addSemanticField(field, 'closed_schema_literal_resolves_exact_semantic_authority', store.row_schema_ref, store.row_schema_variant, spec.type ?? 'literal')
  }
}
schemaSemanticRows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
r53.semantic_reference_field_specification = { ...r53.semantic_reference_field_specification, schema_version: 'ctrl.g24.semantic-reference-field-specification.r53.v1', source: 'independently_pinned_non_suffix_fields_plus_complete_closed_schema_semantic_field_registry_and_exhaustive_exact_path_value_resolution', exact_non_suffix_semantic_fields: [...R53_PINNED_NON_SUFFIX_SEMANTIC_FIELDS], schema_declared_registry_ref: 'authority_operation_schema_declared_semantic_field_registry', suffix_name_only_inference: 'forbidden', exact_path_value_resolution_is_authoritative: true }
r53.authority_operation_schema_declared_semantic_field_registry = { schema_version: 'ctrl.g24.schema-declared-semantic-field-registry.r53.v1', row_schema_version: 'ctrl.g24.schema-declared-semantic-field-row.r53.v1', exact_rows: schemaSemanticRows, exact_row_count: schemaSemanticRows.length, required_named_fields: ['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'], derivation: 'independent_pinned_controls_plus_every_closed_source_schema_reference_classification_and_every_literal_resolving_to_an_exact_authority', unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write' }

r53.fixture_schema_validator = { ...r53.fixture_schema_validator, schema_version: 'ctrl.g24.fixture-schema-validator.r53.v1', validation_scope: 'R52_fixture_lineage_plus_normative_persistence_registry_native_identity_schema_valid_fingerprint_preimages_source_constant_selector_totality_and_schema_declared_semantic_fields' }
r53.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r53.v1', derivation: 'bounded_exact_extension_from_frozen_R52_persistence_native_identity_selector_and_semantic_field_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.status', '$.supersedes', '$.authority_operation_normative_persistence_registry', '$.authority_operation_complete_persisted_store_universe', '$.authority_operation_normative_durable_store_authority_graph', '$.authority_operation_persisted_identity_formula_library', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_internal_reference_target_selectors', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_explicit_nonartifact_reference_field_allowlist', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.semantic_reference_field_specification', '$.authority_operation_schema_declared_semantic_field_registry', '$.fixture_schema_validator', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: [], frozen_parent_core_must_remain_byte_identical: true, runtime_database_ui_deployment_or_external_action: 'closed' }
r53.required_negative_fixture_families = [...new Set([...r53.required_negative_fixture_families, 'normative_persistence_56_omissions', 'native_identity_generic_fixture_or_wrong_role', 'source_constant_selector_cross_variant', 'schema_semantic_field_omission'])]

// Final derived-authority versions are fixed before any reference resolution.
// Their bodies are populated only after the immutable source snapshot.
r53.authority_runtime_semantic_reference_owner_map = { ...r53.authority_runtime_semantic_reference_owner_map, schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r53.v1' }
r53.authority_runtime_semantic_dependency_owner_map = { ...r53.authority_runtime_semantic_dependency_owner_map, schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r53.v1' }
r53.authority_runtime_semantic_reference_field_registry = { ...r53.authority_runtime_semantic_reference_field_registry, schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r53.v1' }
r53.authority_runtime_semantic_manifest = { ...r53.authority_runtime_semantic_manifest, schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r53.v1' }

const replacedPaths = new Set(['authority_operation_normative_durable_store_authority_graph', 'authority_operation_complete_persisted_store_universe', 'authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'semantic_reference_field_specification', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
const newPaths = ['authority_operation_normative_persistence_registry', 'authority_operation_normative_durable_store_authority_graph', 'authority_operation_complete_persisted_store_universe', 'authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'semantic_reference_field_specification', 'authority_operation_schema_declared_semantic_field_registry', 'fixture_schema_validator', 'schema_change_manifest']
const sourcePaths = [...new Set([...r52SemanticAuthorityPaths.filter(path => !replacedPaths.has(path)), ...newPaths])].filter(path => get(r53, path) !== undefined).sort(cp)
r53.authority_runtime_semantic_manifest_hash_contract = { ...r53.authority_runtime_semantic_manifest_hash_contract, schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r53.v1', manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r53.v1', content_domain_ascii: 'CTRL-G24-R53-MANIFEST-CONTENT', dependency_domain_ascii: 'CTRL-G24-R53-MANIFEST-DEPENDENCY', graph_domain_ascii: 'CTRL-G24-R53-MANIFEST-GRAPH', envelope_domain_ascii: 'CTRL-G24-R53-MANIFEST-ENVELOPE' }
sourcePaths.push('authority_runtime_semantic_manifest_hash_contract')
sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r53, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R53-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
const declaredNames = new Set(schemaSemanticRows.map(row => row.field_name)), refRows = [], seenRefs = new Set()
function walkRefs(value, source, path = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`, valuesToCheck = Array.isArray(child) ? child : [child]
    valuesToCheck.forEach((literal, index) => {
      if (typeof literal !== 'string') return
      const exactTarget = literal !== 'UNAVAILABLE' && get(r53, literal) !== undefined ? literal : 'UNAVAILABLE'
      const matched = exactTarget !== 'UNAVAILABLE' || declaredNames.has(key)
      if (!matched) return
      const fieldPath = Array.isArray(child) ? `${next}.${index}` : next, id = `${source}|${fieldPath}|${literal}`
      if (seenRefs.has(id)) return
      seenRefs.add(id)
      refRows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: exactTarget !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: exactTarget, exact_target_schema_version_or_UNAVAILABLE: exactTarget === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(r53, exactTarget)?.schema_version ?? 'NESTED_VALUE', reference_kind: exactTarget === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference' })
    })
    walkRefs(child, source, next)
  }
}
for (const path of sourcePaths) walkRefs(get(r53, path), path)
refRows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
r53.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r53.v1', source_snapshot_sha256: snapshotSha, exact_source_paths: sourcePaths, schema_declared_field_registry_ref: 'authority_operation_schema_declared_semantic_field_registry', exact_occurrence_rows: refRows, exact_expected_occurrence_count: refRows.length, exact_path_value_resolution_count: refRows.filter(row => row.match_kind === 'exhaustive_exact_path_value_resolution').length, schema_or_pinned_field_occurrence_count: refRows.filter(row => row.match_kind === 'schema_declared_or_independently_pinned_semantic_field').length, required_named_field_occurrence_counts: Object.fromEntries(['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source'].map(field => [field, refRows.filter(row => row.field_name === field).length])), suffix_name_only_inference: 'forbidden', unknown_resolvable_semantic_path: 'reject_materialization_and_hold_without_write' }
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(row => row.source_authority_path === path && sourcePaths.includes(row.exact_target_path_or_UNAVAILABLE) && row.exact_target_path_or_UNAVAILABLE !== path).map(row => row.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r53.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r53.v1', source_snapshot_sha256: snapshotSha, exact_row_count: refRows.length, reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', schema_declared_and_exact_path_value_bijection: true }
r53.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r53.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })), reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', known_owner_lineage_result_version_encoding_then_and_source_dependencies_included: true }
const hc = r53.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r53, path)) })]))
function transitive(path) { const seen = new Set(), visit = item => { for (const dep of dependencies[item] ?? []) if (!seen.has(dep)) { seen.add(dep); visit(dep) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = sourcePaths.map(path => { const direct = dependencies[path].map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })), all = transitive(path).map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })); return { authority_path: path, authority_schema_version: get(r53, path)?.schema_version ?? 'UNVERSIONED', exact_keyset: Object.keys(get(r53, path) ?? {}).sort(cp), authority_content_sha256: contentHashes[path], direct_dependency_paths: dependencies[path], direct_dependency_content_hashes: direct, direct_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }) } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r53.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: manifestRows, exact_expected_count: manifestRows.length, manifest_graph_sha256: hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifestRows }) }
r53.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: manifestWithoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r53)
export const materializedR53 = r53
export const materializedR53Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r53SemanticAuthorityPaths = sourcePaths
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR53Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR53Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R53 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
