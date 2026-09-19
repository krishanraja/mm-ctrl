import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR52, materializedR52Output, r52SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r52.mjs'
import { materializedR53, materializedR53Output } from './materialize-ctrl-g24-trusted-ingress-r53.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r53.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, ref, variant = 'UNAVAILABLE') => { const schema = get(contract, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const uniq = rows => { const seen = new Set(); return rows.filter(row => { const key = canonicalR44(row); if (seen.has(key)) return false; seen.add(key); return true }) }

// This declaration is intentionally duplicated rather than imported from the
// producer. It is the checker-owned persistence authority.
const DIRECT = Object.freeze([
  'case_authority_bindings', 'operation_registry.committed_success_row_schema', 'operation_registry.committed_hold_row_schema',
  'outbox.reservation_schema', 'outbox.dispatch_schema', 'outbox.provider_success_evidence_schema', 'outbox.provider_failure_evidence_schema', 'outbox.reconciliation_evidence_schema', 'outbox.transition_event_schema', 'outbox.claim_event_schema', 'outbox.pre_provider_failure_event_schema', 'outbox.unknown_event_schema', 'outbox.effect_schema', 'outbox.creation_event_schema', 'outbox.invocation_event_schema', 'outbox.abandon_without_invocation_schema', 'outbox.payload_consumption_schema', 'outbox.reconciled_success_evidence_schema', 'outbox.reconciled_failure_evidence_schema', 'outbox.reservation_budget_exhausted_schema', 'outbox.effect_origin_schema', 'outbox.invocation_aborted_before_provider_schema', 'outbox.worker_ambiguity_evidence_schema', 'outbox.lease_expiry_ambiguity_evidence_schema',
  'intervention_visibility_receipt_schema', 'presentation_challenge_schema',
  'authoritative_row_schemas.selector_results', 'authoritative_row_schemas.selector_candidate_sets', 'authoritative_row_schemas.selector_policies', 'authoritative_row_schemas.intervention_approval_receipts', 'authoritative_row_schemas.intervention_atoms', 'authoritative_row_schemas.intervention_visibility_acknowledgements', 'authoritative_row_schemas.answer_receipts', 'authoritative_row_schemas.leader_authority_receipts', 'authoritative_row_schemas.answer_visibility_acknowledgements', 'authoritative_row_schemas.correction_receipts', 'authoritative_row_schemas.lifecycle_transition_receipts', 'authoritative_row_schemas.lifecycle_snapshots', 'authoritative_row_schemas.lifecycle_authority_receipts', 'authoritative_row_schemas.pending_release_projections', 'authoritative_row_schemas.release_authority_receipts', 'authoritative_row_schemas.enrichment_plans', 'authoritative_row_schemas.enrichment_budget_policies', 'authoritative_row_schemas.enrichment_terminal_states', 'authoritative_row_schemas.enrichment_execution_receipts', 'authoritative_row_schemas.case_identities', 'authoritative_row_schemas.accepted_release_requests', 'authoritative_row_schemas.lifecycle_action_receipts', 'authoritative_row_schemas.lifecycle_precondition_evidence', 'authoritative_row_schemas.lifecycle_action_combination_consumptions', 'authoritative_row_schemas.lifecycle_joint_transition_consumptions', 'authoritative_row_schemas.lifecycle_single_action_transition_consumptions', 'authoritative_row_schemas.release_projection_requests', 'authoritative_row_schemas.release_authority_terminal_consumptions', 'authoritative_row_schemas.leader_answer_authority_consumptions',
  'intervention_visibility_consumption_schema',
])
const CONTAINERS = Object.freeze(['authority_operation_historical_response_artifact_store', 'authority_operation_hold_store', 'authority_operation_pre_materialized_replay_lookup_store', 'authority_operation_receipt_store', 'authority_operation_registry', 'authority_operation_replay_envelope_artifact_store', 'authority_operation_replay_payload_artifact_store', 'authority_partition_head_store', 'authority_verifier_public_key_artifact_store', 'case_authority_control_operation_registry', 'case_session_authority_read_set_artifact_store', 'operation_hold_blob_store', 'operation_response_blob_store', 'operation_result_blob_store', 'principal_authority_artifact_stores.live_principal_assertions', 'principal_authority_artifact_stores.presented_principal_projections', 'proof_nonce_ledger', 'session_dual_proof_bundle_artifact_store', 'session_dual_proof_bundle_truth_projection_artifact_store', 'session_dual_proof_receipt_evidence_store', 'session_hold_evidence_artifact_store'])
const ARTIFACT_FAMILIES = Object.freeze(['requests', 'targets', 'proofs', 'results'])
const OPAQUE = Object.freeze(['target', 'proof_primary', 'proof_bundle', 'proof_issuer', 'proof_evaluator'])
const COMMITTED = Object.freeze(['authoritative_row_schemas.case_session_root_trust_anchors', 'authoritative_row_schemas.case_session_issuer_registry', 'authoritative_row_schemas.case_session_evaluator_registry', 'authoritative_row_schemas.account_stable_actor_bindings', 'authoritative_row_schemas.account_access_standings', 'authoritative_row_schemas.case_server_session_principal_evidence'])
const PINNED_NON_SUFFIX = Object.freeze(['authority', 'then', 'sole_writer', 'writer', 'source', 'target', 'derivation', 'binding', 'transaction_boundary', 'selected_branch_table', 'selected_matrix', 'selected_result_artifact_store_family', 'owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding'])

function expectedPersistenceKeys(contract) {
  const rows = []
  for (const path of CONTAINERS) {
    const store = get(contract, path)
    if (store?.row_schema) rows.push(`${path}|${path}.row_schema|UNAVAILABLE`)
    else if (store?.row_union?.variants) for (const variant of Object.keys(store.row_union.variants)) rows.push(`${path}|${path}.row_union|${variant}`)
    else throw new Error(`expected_container_missing:${path}`)
  }
  for (const family of ARTIFACT_FAMILIES) { const base = `authority_operation_artifact_stores.families.${family}.stores_by_schema_ref`; for (const key of Object.keys(get(contract, base))) rows.push(`${base}.${key}|${base}.${key}.row_schema|UNAVAILABLE`) }
  for (const name of OPAQUE) rows.push(`authority_opaque_raw_input_stores.${name}|authority_opaque_raw_input_stores.${name}.row_schema|UNAVAILABLE`)
  for (const schema of COMMITTED) rows.push(`${schema.replace('authoritative_row_schemas.', '')}|${schema}|UNAVAILABLE`)
  for (const schema of DIRECT) rows.push(`${schema}|${schema}|UNAVAILABLE`)
  rows.push(`proof_nonce_receipt_store|${contract.proof_nonce_receipt_store.row_schema_ref}|UNAVAILABLE`)
  return rows.sort(cp)
}
function validatePersistence(contract) {
  const registry = contract.authority_operation_normative_persistence_registry, rows = registry.exact_rows
  const actual = rows.map(row => `${row.store_path}|${row.row_schema_ref}|${row.row_schema_variant}`).sort(cp), expected = expectedPersistenceKeys(contract)
  assert(DIRECT.length === 56 && expected.length === 217, 'pinned_persistence_count')
  assert(rows.length === 217 && new Set(actual).size === 217 && same(actual, expected), 'persistence_registry_bijection')
  assert(registry.authority_source === 'independently_pinned_code_owned_path_groups_not_candidate_authored_markers_or_name_inference' && registry.marker_suffix_or_candidate_registry_discovery === 'forbidden', 'persistence_registry_authority')
  assert(registry.explicit_exclusions.length === 8, 'persistence_alias_exclusions')
  for (const row of rows) {
    const schema = schemaAt(contract, row.row_schema_ref, row.row_schema_variant)
    assert(schema?.properties && schema.schema_version === row.row_schema_version && schema.additional_properties === false, `persistence_schema:${row.row_schema_ref}:${row.row_schema_variant}`)
    assert(get(contract, row.writer_authority_ref), `persistence_writer:${row.writer_authority_ref}`)
    assert(typeof row.inclusion_reason === 'string' && row.inclusion_reason.length > 0 && typeof row.direct_dml_rule === 'string', `persistence_reason:${row.store_path}`)
  }
  assert(same(rows, contract.authority_operation_complete_persisted_store_universe.exact_rows) && same(rows, contract.authority_operation_normative_durable_store_authority_graph.exact_rows), 'persistence_projection_equality')
  return rows.length
}

function validateSpec(spec, value, label) {
  if (Object.hasOwn(spec, 'const')) return assert(value === spec.const, `${label}:const`)
  const choices = spec.values ?? spec.enum
  if (Array.isArray(choices)) return assert(choices.includes(value), `${label}:enum`)
  if (spec.type === 'sha256') return assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), `${label}:sha256`)
  if (spec.type === 'sha256_or_exact_literal') return assert(typeof value === 'string' && (/^[0-9a-f]{64}$/.test(value) || (spec.exact_literals ?? []).includes(value)), `${label}:sha_or_literal`)
  if (['identifier', 'canonical_timestamp', 'base64url_without_padding', 'literal'].includes(spec.type)) return assert(typeof value === 'string', `${label}:string`)
  if (spec.type === 'boolean') return assert(typeof value === 'boolean', `${label}:boolean`)
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer', 'finite_nonnegative_number'].includes(spec.type)) return assert(Number.isFinite(value) && Number.isInteger(value) && value >= (spec.type === 'positive_integer' ? 1 : 0), `${label}:number`)
  if (spec.type === 'nullable') return assert(value === null || value !== undefined, `${label}:nullable`)
  if (spec.type === 'array') return assert(Array.isArray(value), `${label}:array`)
  if (spec.type === 'object') return assert(value && typeof value === 'object' && !Array.isArray(value), `${label}:object`)
  assert(value !== undefined, `${label}:defined`)
}
function schemaUniqueKeys(schema, store) { const raw = schema.unique_keys ?? schema.unique_key ?? store?.unique_lookup ?? store?.unique_keys ?? []; return uniq((Array.isArray(raw) ? raw : [raw]).map(value => Array.isArray(value) ? value : [value]).filter(row => row.every(field => typeof field === 'string'))) }
function validateIdentities(contract) {
  const persistence = contract.authority_operation_normative_persistence_registry.exact_rows
  const index = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
  assert(index.length === 1229 && new Set(index.map(row => row.identity_kind)).size === index.length, 'native_identity_index_count')
  const indexed = new Set(index.map(row => `${row.store_path}|${row.row_schema_ref}|${row.row_schema_variant}|${row.identity_field}|${row.native_identity_role}`))
  for (const storeRow of persistence) {
    const schema = schemaAt(contract, storeRow.row_schema_ref, storeRow.row_schema_variant), store = get(contract, storeRow.store_definition_path), keys = schemaUniqueKeys(schema, store)
    assert(indexed.has(`${storeRow.store_path}|${storeRow.row_schema_ref}|${storeRow.row_schema_variant}|$canonical_row_bytes|canonical_row_bytes_content_address`), `canonical_row_identity:${storeRow.store_path}`)
    for (const fields of keys) for (const field of fields) assert(indexed.has(`${storeRow.store_path}|${storeRow.row_schema_ref}|${storeRow.row_schema_variant}|${field}|unique_key_component`) || index.some(row => row.store_path === storeRow.store_path && row.row_schema_variant === storeRow.row_schema_variant && row.identity_field === field), `unique_identity:${storeRow.store_path}:${field}`)
    if (schema.fingerprint_field && schema.fingerprint_ref && get(contract, schema.fingerprint_ref)) assert(indexed.has(`${storeRow.store_path}|${storeRow.row_schema_ref}|${storeRow.row_schema_variant}|${schema.fingerprint_field}|schema_declared_fingerprint`), `fingerprint_identity:${storeRow.store_path}`)
  }
  for (const row of index) {
    const authority = get(contract, row.exact_authority_ref), schema = schemaAt(contract, row.row_schema_ref, row.row_schema_variant), fixture = authority?.executable_formula_fixture, formula = authority && get(contract, authority.selected_formula_authority_ref)
    assert(authority && formula && schema && authority.identity_kind === row.identity_kind && authority.native_identity_role === row.native_identity_role, `identity_authority:${row.identity_kind}`)
    if (row.identity_field !== '$canonical_row_bytes') assert(schema.properties[row.identity_field], `identity_field:${row.identity_kind}`)
    if (row.native_identity_role === 'schema_declared_fingerprint') {
      assert(authority.selected_formula_authority_ref.endsWith('.schema_declared_fingerprint') && fixture.selected_fingerprint_authority_ref === schema.fingerprint_ref, `fingerprint_formula:${row.identity_kind}`)
      const fp = get(contract, schema.fingerprint_ref), payload = fixture.schema_valid_payload
      assert(same(Object.keys(payload).sort(cp), Object.keys(schema.properties).sort(cp)), `fingerprint_payload_keyset:${row.identity_kind}`)
      for (const [field, spec] of Object.entries(schema.properties)) validateSpec(spec, payload[field], `${row.identity_kind}:${field}`)
      const preimage = {}
      for (const field of fp.preimage_order) preimage[field] = field === 'domain_ascii' ? fp.domain_ascii : payload[field]
      assert(same(preimage, fixture.exact_preimage) && same(fp.preimage_order, fixture.exact_preimage_order) && fixture.exact_preimage_field_types.length === fp.preimage_order.length, `fingerprint_preimage:${row.identity_kind}`)
      assert(hash(preimage) === fixture.expected_identity && payload[row.identity_field] === fixture.expected_identity, `fingerprint_execution:${row.identity_kind}`)
    } else if (fixture.execution === 'raw_sha256') assert(sha(Buffer.from(fixture.input_b64url, 'base64url')) === fixture.expected_identity, `identity_raw:${row.identity_kind}`)
    else if (fixture.execution === 'canonical_json_utf8_sha256') assert(hash(fixture.exact_preimage) === fixture.expected_identity, `identity_hash:${row.identity_kind}`)
    else assert(fixture.execution === 'exact_native_identity_equality' && fixture.selected_target_native_identity === fixture.expected_identity, `identity_equality:${row.identity_kind}`)
  }
  return index.length
}

function contextKey(context) { return canonicalR44(Object.fromEntries(['source_operation', 'source_result_branch', 'proof_family', 'branch_class', 'evidence_kind', 'target_store', 'source_store_variant', 'fresh_selection_row_id', 'hold_schema_ref'].map(field => [field, context[field]]))) }
function validateSelector(contract, selector) {
  const schema = schemaAt(contract, selector.source_schema_ref, selector.source_schema_variant)
  assert(schema?.properties?.[selector.source_field] && selector.source_schema_version === schema.schema_version, `selector_source:${selector.selector_id}`)
  assert(selector.exact_source_constant_cases.length === selector.exact_concrete_cases.length && selector.exact_case_count === selector.exact_concrete_cases.length, `selector_count:${selector.selector_id}`)
  const targetByContext = new Map()
  for (const target of selector.exact_concrete_cases) {
    const key = contextKey(target)
    assert(!targetByContext.has(key), `selector_multiple:${selector.selector_id}`); targetByContext.set(key, target)
    const targetSchema = schemaAt(contract, target.target_schema_ref, target.target_schema_variant)
    assert(targetSchema && target.target_schema_version === targetSchema.schema_version && get(contract, target.target_identity_formula_authority_ref), `selector_target:${selector.selector_id}`)
    assert(!String(target.target_schema_ref).includes('complete_persisted') && !String(target.target_schema_variant).startsWith('DISCRIMINATED_BY_'), `selector_meta:${selector.selector_id}`)
    if (selector.source_field === 'hold_row_ref') {
      const expectedVariant = target.branch_class === 'ordinary_held' ? 'ordinary_single_proof' : target.branch_class?.startsWith('session_') ? 'session_dual_proof' : 'UNAVAILABLE'
      assert(target.target_schema_ref === 'authority_operation_hold_store.row_union' && target.target_schema_variant === expectedVariant, `selector_hold_variant:${selector.selector_id}`)
    }
    if (selector.source_field === 'binding_ref') assert(target.target_schema_ref === 'authoritative_row_schemas.account_stable_actor_bindings' && target.target_native_identity_field === 'binding_ref', `selector_binding_native:${selector.selector_id}`)
    if (selector.source_field === 'standing_ref') assert(target.target_schema_ref === 'authoritative_row_schemas.account_access_standings' && target.target_native_identity_field === 'standing_ref', `selector_standing_native:${selector.selector_id}`)
    if (selector.source_field === 'target_row_bytes_ref') assert(target.target_schema_ref === `authoritative_row_schemas.${target.target_store}` && target.target_native_identity_role === 'canonical_row_bytes_content_address', `selector_target_bytes:${selector.selector_id}`)
  }
  for (const context of selector.exact_source_constant_cases) {
    const target = targetByContext.get(contextKey(context))
    assert(target, `selector_zero:${selector.selector_id}`)
    if (context.source_operation !== 'UNAVAILABLE') {
      const op = get(contract, `case_session_authority_operation_protocols.operations.${context.source_operation}`)
      assert(op && (op.target_store ?? op.request_schema.properties.target_store.const) === context.target_store, `selector_operation_store:${selector.selector_id}`)
      const selected = contract.authority_operation_fresh_branch_class_selection.rows.find(row => row.selection_row_id === context.fresh_selection_row_id)
      assert(selected && selected.operation_name === context.source_operation && selected.result_branch === context.source_result_branch && selected.proof_family === context.proof_family && selected.branch_class === context.branch_class && selected.evidence_kind === context.evidence_kind, `selector_fresh_context:${selector.selector_id}`)
    }
  }
}
function validateSelectors(contract) {
  const authority = contract.authority_operation_internal_reference_target_selectors, rows = Object.values(authority.rows)
  assert(rows.length === 374 && authority.exact_count === rows.length && authority.exact_source_context_count === 2513, 'selector_authority_counts')
  for (const selector of rows) validateSelector(contract, selector)
  const equalityRows = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows
  assert(equalityRows.length === 782 && equalityRows.filter(row => row.exact_one_resolution_required).length === rows.length, 'equality_selector_count')
  for (const row of equalityRows.filter(row => row.exact_one_resolution_required)) { const selector = get(contract, row.selector_ref); assert(selector && same(row.exact_target_cases, selector.exact_concrete_cases) && same(row.exact_source_constant_cases, selector.exact_source_constant_cases), `equality_selector_binding:${row.selector_ref}`) }
  return { selectors: rows.length, contexts: authority.exact_source_context_count, equalities: equalityRows.length }
}

function expectedSourcePaths(contract) {
  const replaced = new Set(['authority_operation_normative_durable_store_authority_graph', 'authority_operation_complete_persisted_store_universe', 'authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'semantic_reference_field_specification', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
  const added = ['authority_operation_normative_persistence_registry', 'authority_operation_normative_durable_store_authority_graph', 'authority_operation_complete_persisted_store_universe', 'authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'semantic_reference_field_specification', 'authority_operation_schema_declared_semantic_field_registry', 'fixture_schema_validator', 'schema_change_manifest', 'authority_runtime_semantic_manifest_hash_contract']
  return [...new Set([...r52SemanticAuthorityPaths.filter(path => !replaced.has(path)), ...added])].filter(path => get(contract, path) !== undefined).sort(cp)
}
function expectedSemanticFieldRows(contract) {
  const rows = [], seen = new Set(), add = (field_name, declaration_basis, schema_ref = 'GLOBAL', schema_variant = 'UNAVAILABLE', field_type = 'semantic_string') => { const id = `${schema_ref}|${schema_variant}|${field_name}|${declaration_basis}`; if (!seen.has(id)) { seen.add(id); rows.push({ schema_ref, schema_variant, field_name, field_type, declaration_basis }) } }
  for (const field of PINNED_NON_SUFFIX) add(field, 'independently_pinned_non_suffix_control_field')
  for (const row of contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows) add(row.source_field, row.exact_one_resolution_required ? 'closed_schema_internal_reference_field' : 'closed_schema_explicit_nonartifact_reference_field', row.source_schema_ref, row.source_schema_variant, row.source_field_type)
  for (const store of contract.authority_operation_normative_persistence_registry.exact_rows) {
    const schema = schemaAt(contract, store.row_schema_ref, store.row_schema_variant)
    for (const [field, spec] of Object.entries(schema.properties)) { const literals = Object.hasOwn(spec, 'const') ? [spec.const] : spec.values ?? spec.enum ?? []; if (literals.some(value => typeof value === 'string' && get(contract, value) !== undefined)) add(field, 'closed_schema_literal_resolves_exact_semantic_authority', store.row_schema_ref, store.row_schema_variant, spec.type ?? 'literal') }
  }
  return rows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
}
function scanSemantic(contract, paths, fieldRows) {
  const names = new Set(fieldRows.map(row => row.field_name)), rows = [], seen = new Set()
  function walk(value, source, path = source) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const next = `${path}.${key}`, values = Array.isArray(child) ? child : [child]
      values.forEach((literal, index) => {
        if (typeof literal !== 'string') return
        const target = literal !== 'UNAVAILABLE' && get(contract, literal) !== undefined ? literal : 'UNAVAILABLE'
        if (target === 'UNAVAILABLE' && !names.has(key)) return
        const fieldPath = Array.isArray(child) ? `${next}.${index}` : next, id = `${source}|${fieldPath}|${literal}`
        if (!seen.has(id)) { seen.add(id); rows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: target !== 'UNAVAILABLE' ? 'exhaustive_exact_path_value_resolution' : 'schema_declared_or_independently_pinned_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: target, exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(contract, target)?.schema_version ?? 'NESTED_VALUE', reference_kind: target === 'UNAVAILABLE' ? 'declared_runtime_external_version_or_control_literal' : 'exact_semantic_reference' }) }
      })
      walk(child, source, next)
    }
  }
  for (const source of paths) walk(get(contract, source), source)
  return rows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
}
function validateSemanticAndManifest(contract) {
  const fields = expectedSemanticFieldRows(contract), declared = contract.authority_operation_schema_declared_semantic_field_registry
  assert(fields.length === 936 && same(fields, declared.exact_rows) && declared.exact_row_count === fields.length, 'semantic_field_registry')
  for (const field of ['owner_lineage_version_source', 'selected_result_schema_version', 'canonical_encoding', 'then', 'source']) assert(PINNED_NON_SUFFIX.includes(field) && declared.required_named_fields.includes(field), `semantic_required_field:${field}`)
  const paths = expectedSourcePaths(contract), registry = contract.authority_runtime_semantic_reference_field_registry
  assert(same(paths, registry.exact_source_paths), 'semantic_source_paths')
  const snapshot = Object.fromEntries(paths.map(path => [path, ownedSnapshotR44(get(contract, path))])), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R53-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: paths, values: snapshot })
  assert(snapshotSha === registry.source_snapshot_sha256 && snapshotSha === contract.authority_runtime_semantic_manifest.source_snapshot_sha256, 'semantic_snapshot')
  const refs = scanSemantic(contract, paths, fields)
  assert(refs.length === 43017 && same(refs, registry.exact_occurrence_rows) && refs.length === registry.exact_expected_occurrence_count, `semantic_occurrence_bijection:${refs.length}:${registry.exact_occurrence_rows.length}:${registry.exact_expected_occurrence_count}`)
  for (const [field, count] of Object.entries(registry.required_named_field_occurrence_counts)) assert(count === refs.filter(row => row.field_name === field).length && count > 0, `semantic_named_occurrences:${field}`)
  const hc = contract.authority_runtime_semantic_manifest_hash_contract, manifest = contract.authority_runtime_semantic_manifest
  assert(manifest.rows.length === 234 && same(paths, manifest.exact_paths), 'manifest_count_paths')
  for (const row of manifest.rows) assert(row.authority_content_sha256 === hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }), `manifest_content:${row.authority_path}`)
  const without = { ...manifest }; delete without.manifest_envelope_seal_sha256
  assert(manifest.manifest_graph_sha256 === hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifest.rows }), 'manifest_graph')
  assert(manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: without }), 'manifest_seal')
  return { fields: fields.length, refs: refs.length, manifest: manifest.rows.length }
}

function validateInherited(contract) {
  assert(same(contract.authority_operation_replay_restart_fixtures, materializedR52.authority_operation_replay_restart_fixtures), 'restart_fixtures_preserved')
  assert(same(contract.authority_operation_committed_receipt_identity_fixtures, materializedR52.authority_operation_committed_receipt_identity_fixtures), 'signed_fixtures_preserved')
  assert(same(contract.authority_operation_fixture_wrapper_reference_traversal, materializedR52.authority_operation_fixture_wrapper_reference_traversal), 'wrapper_traversal_preserved')
  const codec = contract.authority_operation_fingerprint_codec_audit
  assert(codec.fingerprint_authority_count === 215 && codec.mismatched_codec_count === 0 && codec.proof_signature_rows.length === 4, 'codec_audit_preserved')
  const u32 = number => { const out = Buffer.alloc(4); out.writeUInt32BE(number); return out }, u64 = number => { const out = Buffer.alloc(8); out.writeBigUInt64BE(BigInt(number)); return out }, utf8 = value => { const bytes = Buffer.from(value, 'utf8'); return Buffer.concat([u32(bytes.length), bytes]) }
  const encode = (spec, value) => { if (spec?.type === 'sha256') return Buffer.from(value, 'hex'); if (spec?.type === 'base64url_without_padding') { const b = Buffer.from(value, 'base64url'); return Buffer.concat([u64(b.length), b]) } if (spec?.type === 'boolean') return Buffer.from([value ? 1 : 0]); if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec?.type)) return u64(value); if (Array.isArray(value)) return Buffer.concat([u64(value.length), ...value.map(item => encode(spec.items, item))]); return utf8(value) }
  const fixtures = contract.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role
  for (const family of ['issuer', 'evaluator']) {
    const proof = fixtures[`${family}_proof`].payload_value, key = fixtures[`${family}_verifier_key`].payload_value, rule = contract.proof_signed_preimages[family], schema = family === 'issuer' ? contract.case_session_issuer_capability_proof_schema : contract.case_session_evaluator_capability_proof_schema
    const bytes = Buffer.concat(rule.field_order.map(field => encode(field === 'domain_ascii' ? {} : schema.properties[field], field === 'domain_ascii' ? rule.domain_ascii : proof[field])))
    assert(verify(null, bytes, createPublicKey({ key: Buffer.from(key.public_key_spki_der_b64url, 'base64url'), format: 'der', type: 'spki' }), Buffer.from(proof.signature_b64url, 'base64url')), `proof_signature:${family}`)
  }
}
function validate(contract) {
  assert(contract.schema_version === 'ctrl.g24.trusted-ingress.r53.effective.v1' && contract.schema_change_manifest.runtime_database_ui_deployment_or_external_action === 'closed', 'r53_identity_boundary')
  validateInherited(contract)
  const stores = validatePersistence(contract), identities = validateIdentities(contract), selector = validateSelectors(contract), semantic = validateSemanticAndManifest(contract)
  return { stores, identities, ...selector, ...semantic }
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r52.json'), 'utf8') === materializedR52Output, 'frozen_R52_exact')
assert(readFileSync(join(root, path), 'utf8') === materializedR53Output, 'exact_materialization')
const baseline = validate(materializedR53)
let attacks = 0
function attack(name, validator, mutate) { const contract = structuredClone(materializedR53); mutate(contract); let rejected = false; try { validator(contract) } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
for (const schemaPath of DIRECT) attack(`omitted_persistence:${schemaPath}`, validatePersistence, contract => { contract.authority_operation_normative_persistence_registry.exact_rows = contract.authority_operation_normative_persistence_registry.exact_rows.filter(row => row.row_schema_ref !== schemaPath); contract.authority_operation_complete_persisted_store_universe.exact_rows = contract.authority_operation_normative_persistence_registry.exact_rows; contract.authority_operation_normative_durable_store_authority_graph.exact_rows = contract.authority_operation_normative_persistence_registry.exact_rows })
const selectorSamples = Object.values(materializedR53.authority_operation_internal_reference_target_selectors.rows).slice(0, 125)
for (const selector of selectorSamples) attack(`incompatible_selector:${selector.selector_id}`, contract => validateSelector(contract, contract.authority_operation_internal_reference_target_selectors.rows[selector.selector_id]), contract => { contract.authority_operation_internal_reference_target_selectors.rows[selector.selector_id].exact_concrete_cases[0].target_schema_variant = 'INCOMPATIBLE_VARIANT' })
attack('persistence_extra_schema', validatePersistence, contract => { contract.authority_operation_normative_persistence_registry.exact_rows.push(structuredClone(contract.authority_operation_normative_persistence_registry.exact_rows[0])) })
attack('persistence_writer_missing', validatePersistence, contract => { contract.authority_operation_normative_persistence_registry.exact_rows[0].writer_authority_ref = 'missing.writer' })
attack('generic_six_field_fingerprint_fixture', validateIdentities, contract => { const row = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.find(item => item.native_identity_role === 'schema_declared_fingerprint'); get(contract, row.exact_authority_ref).executable_formula_fixture.exact_preimage = { domain_ascii: 'X', store_path: 'x', schema_ref: 'x', variant: 'x', field: 'x', value: 'x' } })
attack('fingerprint_preimage_order_changed', validateIdentities, contract => { const row = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.find(item => item.native_identity_role === 'schema_declared_fingerprint' && get(contract, item.exact_authority_ref).executable_formula_fixture.exact_preimage_order.length > 1); const fixture = get(contract, row.exact_authority_ref).executable_formula_fixture; fixture.exact_preimage_order = [...fixture.exact_preimage_order].reverse() })
attack('binding_ref_relabelled_row_version', validateSelectors, contract => { const selector = Object.values(contract.authority_operation_internal_reference_target_selectors.rows).find(item => item.source_field === 'binding_ref'); selector.exact_concrete_cases[0].target_native_identity_field = 'row_version_ref' })
attack('standing_ref_relabelled_row_version', validateSelectors, contract => { const selector = Object.values(contract.authority_operation_internal_reference_target_selectors.rows).find(item => item.source_field === 'standing_ref'); selector.exact_concrete_cases[0].target_native_identity_field = 'row_version_ref' })
attack('receipt_target_bytes_relabelled_row_version', validateSelectors, contract => { const selector = Object.values(contract.authority_operation_internal_reference_target_selectors.rows).find(item => item.source_field === 'target_row_bytes_ref'); selector.exact_concrete_cases[0].target_native_identity_role = 'declared_row_version' })
attack('selector_proof_family_splice', validateSelectors, contract => { const selector = Object.values(contract.authority_operation_internal_reference_target_selectors.rows).find(item => item.exact_source_constant_cases[0].proof_family !== 'UNAVAILABLE'); selector.exact_source_constant_cases[0].proof_family = 'forged_family' })
attack('semantic_owner_lineage_removed', validateSemanticAndManifest, contract => { contract.authority_operation_schema_declared_semantic_field_registry.exact_rows = contract.authority_operation_schema_declared_semantic_field_registry.exact_rows.filter(row => row.field_name !== 'owner_lineage_version_source') })
attack('semantic_selected_result_version_removed', validateSemanticAndManifest, contract => { contract.authority_operation_schema_declared_semantic_field_registry.exact_rows = contract.authority_operation_schema_declared_semantic_field_registry.exact_rows.filter(row => row.field_name !== 'selected_result_schema_version') })
attack('semantic_canonical_encoding_removed', validateSemanticAndManifest, contract => { contract.authority_operation_schema_declared_semantic_field_registry.exact_rows = contract.authority_operation_schema_declared_semantic_field_registry.exact_rows.filter(row => row.field_name !== 'canonical_encoding') })
attack('semantic_then_occurrence_removed', validateSemanticAndManifest, contract => { const rows = contract.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows; rows.splice(rows.findIndex(row => row.field_name === 'then'), 1) })
attack('semantic_source_occurrence_removed', validateSemanticAndManifest, contract => { const rows = contract.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows; rows.splice(rows.findIndex(row => row.field_name === 'source'), 1) })
attack('manifest_source_mutation', validateSemanticAndManifest, contract => { contract.schema_change_manifest.runtime_database_ui_deployment_or_external_action = 'open' })

console.log(`ok: R53 exact; ${attacks} attacks (${DIRECT.length} persistence omissions + ${selectorSamples.length} incompatible selector contexts); ${baseline.stores} normative persistent shapes; ${baseline.identities} native identities; ${baseline.equalities} typed equalities; ${baseline.selectors} selectors over ${baseline.contexts} source contexts; ${baseline.fields} schema semantic fields; ${baseline.refs} semantic refs; ${baseline.manifest} manifest rows; inherited R52 codec/signature/wrapper/restart fixtures preserved`)
