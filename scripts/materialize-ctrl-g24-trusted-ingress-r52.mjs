import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { materializedR51, materializedR51Output, r51SemanticAuthorityPaths, encodeSignedPreimageR51 } from './materialize-ctrl-g24-trusted-ingress-r51.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const inputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r51.json'
const outputPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r52.json'
const inputBytes = readFileSync(join(root, inputPath), 'utf8')
if (inputBytes !== materializedR51Output) throw new Error('R52_frozen_R51_input_mismatch')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => String(path).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const r52 = structuredClone(materializedR51)
const schemaAt = (path, variant = 'UNAVAILABLE') => { const schema = get(r52, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const splitSchemaRef = ref => { const marker = '.variants.', index = ref.indexOf(marker); return index < 0 ? { schema_ref: ref, schema_variant: 'UNAVAILABLE' } : { schema_ref: ref.slice(0, index), schema_variant: ref.slice(index + marker.length) } }
const bump = value => typeof value === 'string' ? value.replace(/\.r\d+\.v(\d+)$/, '.r52.v$1') : value

r52.schema_version = 'ctrl.g24.trusted-ingress.r52.effective.v1'
r52.status = ['founder_locked_direction', 'headless_kernel_independently_verified', 'trusted_ingress_r1_through_r51_vetoed', 'trusted_ingress_r52_fully_materialized', 'independent_attack_required', 'no_adapter_or_runtime_connection']
r52.supersedes = { commit: 'bd64b937d6378896dd10b00e7a63460c97d21ad1', tree: '3e1315fa93f7715ce2245de3d732beb7b0bec696', human_blob: 'c6d84cb911bd7388b324068e65717c8fc4ce5bba', machine_blob: 'ca7c68ecc490db5e2a586a0edecdfd3a8167deb0', qa_blob: '8817e4e2cc34c766e3b9117765d64cd3f1ccbe92', checker_blob: '8d505e062fa6d6e12b594c765ae299acd0577c35', materializer_blob: 'd067227cfa86c8c5d79e91cb0e6ab1eabd15855a', founder_checker_blob: '44a3fb5d2019959b9138fb5276b227d2ec655668', adjudication: 'veto' }
r52.materialization = { ...r52.materialization, schema_version: 'ctrl.g24.trusted-ingress-materialization.r52.v1', frozen_input: { path: inputPath, sha256: sha(inputBytes) }, output_path: outputPath, strict_finalization_dag: ['freeze_R51_input', 'reconcile_every_declared_fingerprint_codec', 'derive_complete_durable_store_graph', 'derive_complete_persisted_identity_index', 'replace_meta_targets_with_concrete_selectors', 'traverse_every_selected_wrapper_row', 'finalize_schema_change_and_all_nonderived_authorities', 'snapshot_final_semantic_sources', 'scan_suffix_and_pinned_non_suffix_semantics', 'derive_owner_graph_and_manifest', 'seal_output'], no_post_snapshot_source_write: true }

// Fingerprint rules use the exact canonical JSON authority that generated their existing bytes.
// Signed proofs remain on the separate byte-level canonical field encoder.
r52.canonical_json_utf8_encoding = { ...r52.canonical_json_utf8_encoding, schema_version: 'ctrl.g24.canonical-json-utf8-encoding.r52.v1', fingerprint_authority_use: 'all_R52_fingerprint_rules_previously_ambiguously_labelled_canonical_field_encoding', proof_signature_use: 'forbidden' }
const fingerprintCodecRows = []
function reconcileCodecs(value, path = '$') {
  if (!value || typeof value !== 'object') return
  if (value.field_encoding_ref === 'canonical_field_encoding') {
    value.field_encoding_ref = 'canonical_json_utf8_encoding'
    if (value.schema_version) value.schema_version = bump(value.schema_version)
    if (value.digest) value.digest = 'sha256_of_exact_canonical_json_utf8_preimage'
    fingerprintCodecRows.push({ authority_path: path.slice(2), declaration_field: 'field_encoding_ref', prior_codec_ref: 'canonical_field_encoding', selected_codec_ref: 'canonical_json_utf8_encoding', exact_authority_schema_version: value.schema_version ?? 'NESTED_VALUE', preimage_order: value.preimage_order ?? value.ordered_preimage ?? [] })
  }
  if (value.canonical_encoding_ref === 'canonical_field_encoding' && !path.startsWith('$.proof_signed_preimages.')) {
    value.canonical_encoding_ref = 'canonical_json_utf8_encoding'
    if (value.schema_version) value.schema_version = bump(value.schema_version)
    fingerprintCodecRows.push({ authority_path: path.slice(2), declaration_field: 'canonical_encoding_ref', prior_codec_ref: 'canonical_field_encoding', selected_codec_ref: 'canonical_json_utf8_encoding', exact_authority_schema_version: value.schema_version ?? 'NESTED_VALUE', preimage_order: value.preimage_order ?? value.ordered_preimage ?? [] })
  }
  for (const [key, child] of Object.entries(value)) reconcileCodecs(child, `${path}.${key}`)
}
reconcileCodecs(r52)
fingerprintCodecRows.sort((a, b) => cp(a.authority_path, b.authority_path))
const proofCodecRows = Object.entries(r52.proof_signed_preimages).filter(([, rule]) => rule && typeof rule === 'object' && rule.canonical_encoding_ref).map(([family, rule]) => ({ family, authority_path: `proof_signed_preimages.${family}`, selected_codec_ref: rule.canonical_encoding_ref, schema_version: rule.schema_version, field_order: rule.field_order }))
r52.authority_operation_fingerprint_codec_audit = { schema_version: 'ctrl.g24.authority-operation-fingerprint-codec-audit.r52.v1', fingerprint_authority_count: fingerprintCodecRows.length, exact_rows: fingerprintCodecRows, selected_fingerprint_codec_ref: 'canonical_json_utf8_encoding', selected_fingerprint_codec_schema_version: r52.canonical_json_utf8_encoding.schema_version, proof_signature_codec_ref: 'canonical_field_encoding', proof_signature_rows: proofCodecRows, declared_codec_must_equal_computed_codec: true, mismatched_codec_count: 0 }

// The store universe is derived from the actual durable store authority graph in both directions.
function discoverDurableStoreRows(contract) {
  const rows = []
  function walk(value, parts = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    const path = parts.join('.'), rowSchema = value.row_schema, rowUnion = value.row_union
    const hasShape = Boolean(rowSchema?.properties || rowUnion?.variants)
    const durable = /(store|registry|ledger)/.test(path) || Object.hasOwn(value, 'sole_writer') || Object.hasOwn(value, 'direct_dml') || Object.hasOwn(value, 'one_row_per_reference') || Object.hasOwn(value, 'retention')
    if (hasShape && durable) {
      const variants = rowUnion ? Object.entries(rowUnion.variants) : [['UNAVAILABLE', rowSchema]]
      for (const [variant, schema] of variants) rows.push({ store_path: path, store_schema_version: value.schema_version ?? schema.schema_version, row_schema_ref: rowUnion ? `${path}.row_union` : `${path}.row_schema`, row_schema_variant: variant, row_schema_version: schema.schema_version, persistence_kind: rowUnion ? 'discriminated_row_union_variant' : 'closed_row', writer_authority: value.sole_writer ?? value.sole_writer_role ?? schema.sole_writer ?? 'schema_bound_store_writer', direct_dml_rule: value.direct_dml ?? value.direct_dml_by_application_browser_edge_worker_generic_service_or_caller ?? 'forbidden_by_store_authority' })
    }
    for (const [key, child] of Object.entries(value)) walk(child, [...parts, key])
  }
  walk(contract)
  const represented = new Set(rows.map(row => `${row.row_schema_ref}|${row.row_schema_variant}`))
  for (const schemaRef of contract.authority_operation_complete_active_persisted_schema_universe.committed_target_schema_refs) {
    if (!represented.has(`${schemaRef}|UNAVAILABLE`)) rows.push({ store_path: schemaRef.replace('authoritative_row_schemas.', ''), store_schema_version: get(contract, schemaRef).schema_version, row_schema_ref: schemaRef, row_schema_variant: 'UNAVAILABLE', row_schema_version: get(contract, schemaRef).schema_version, persistence_kind: 'authoritative_committed_target_row', writer_authority: 'ctrl_authority_operation_executor', direct_dml_rule: 'forbidden' })
  }
  return rows.sort((a, b) => cp(`${a.store_path}|${a.row_schema_variant}|${a.row_schema_version}`, `${b.store_path}|${b.row_schema_variant}|${b.row_schema_version}`))
}
const storeRows = discoverDurableStoreRows(r52)
r52.authority_operation_normative_durable_store_authority_graph = { schema_version: 'ctrl.g24.normative-durable-store-authority-graph.r52.v1', discovery_rule: 'recursive_closed_store_definition_scan_plus_complete_committed_target_store_set', positive_store_indicators: ['row_schema_or_row_union', 'store_registry_or_ledger_path_or_writer_DML_retention_authority'], exact_rows: storeRows, exact_store_shape_count: storeRows.length, bidirectional_equality_with_complete_persisted_store_universe: true, missing_extra_or_duplicate_store_shape: 'reject_materialization_and_hold_without_write' }
r52.authority_operation_complete_persisted_store_universe = { schema_version: 'ctrl.g24.complete-persisted-store-universe.r52.v1', derivation: 'exact_bidirectional_projection_of_authority_operation_normative_durable_store_authority_graph', store_authority_graph_ref: 'authority_operation_normative_durable_store_authority_graph', exact_store_shape_count: storeRows.length, exact_rows: storeRows, required_named_paths: ['operation_result_blob_store', 'operation_response_blob_store', 'operation_hold_blob_store', 'principal_authority_artifact_stores.live_principal_assertions', 'principal_authority_artifact_stores.presented_principal_projections', 'authority_partition_head_store', 'authority_operation_pre_materialized_replay_lookup_store'], every_active_writer_and_row_variant_included: true, discovery_by_hand_list_or_canonical_schema_ref_filter: 'forbidden' }

// Every persisted identity field gets one executable formula authority.
r52.authority_operation_persisted_identity_formula_library = {
  schema_version: 'ctrl.g24.persisted-identity-formula-library.r52.v1',
  payload_or_row_content_address: { schema_version: 'ctrl.g24.persisted-identity-formula.payload-or-row-content-address.r52.v1', formula_class: 'raw_sha256_canonical_bytes', exact_formula: 'lowercase_hex_SHA256_of_exact_selected_canonical_payload_or_row_bytes' },
  row_version_identity: { schema_version: 'ctrl.g24.persisted-identity-formula.row-version.r52.v1', formula_class: 'canonical_json_preimage_sha256', domain_ascii: 'CTRL-G24-R52-ROW-VERSION', exact_formula: 'SHA256_of_canonical_json_utf8_over_domain_store_schema_variant_and_complete_row_without_row_version_ref' },
  schema_declared_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.schema-fingerprint.r52.v1', formula_class: 'selected_schema_fingerprint_authority', codec_ref: 'canonical_json_utf8_encoding', exact_formula: 'resolve_selected_closed_schema_fingerprint_ref_and_hash_its_exact_preimage_order' },
  companion_fingerprint: { schema_version: 'ctrl.g24.persisted-identity-formula.companion-fingerprint.r52.v1', formula_class: 'referenced_artifact_or_row_fingerprint', exact_formula: 'exactly_equal_the_resolved_target_native_fingerprint' }
}
const identityRows = [], identityAuthorities = {}
for (const store of storeRows) {
  const schema = schemaAt(store.row_schema_ref, store.row_schema_variant), properties = schema?.properties ?? {}
  for (const field of Object.keys(properties).sort(cp)) {
    let identityClass
    if (field === 'artifact_ref' || field.endsWith('_bytes_ref') || field === 'nonce_receipt_ref' || field === 'receipt_ref' || field.endsWith('_row_ref')) identityClass = 'payload_or_row_content_address'
    else if (field.endsWith('_version_ref')) identityClass = 'row_version_identity'
    else if (field.endsWith('_fingerprint')) identityClass = field === schema.fingerprint_field ? 'schema_declared_fingerprint' : 'companion_fingerprint'
    else continue
    const key = `identity_${String(identityRows.length + 1).padStart(4, '0')}`, identityKind = `${store.store_path}|${store.row_schema_variant}|${field}`
    const exactFormulaAuthorityRef = identityClass === 'schema_declared_fingerprint' && schema.fingerprint_ref && get(r52, schema.fingerprint_ref) ? schema.fingerprint_ref : `authority_operation_persisted_identity_formula_library.${identityClass}`
    const sampleBytes = Buffer.from(`CTRL-G24-R52:${identityKind}`, 'utf8')
    const samplePreimage = { domain_ascii: 'CTRL-G24-R52-EXECUTABLE-IDENTITY-FIXTURE', store_path: store.store_path, row_schema_ref: store.row_schema_ref, row_schema_variant: store.row_schema_variant, identity_field: field, canonical_bytes_sha256: sha(sampleBytes) }
    const executable = identityClass === 'payload_or_row_content_address' ? { input_b64url: sampleBytes.toString('base64url'), expected_identity: sha(sampleBytes), execution: 'raw_sha256' } : { exact_preimage: samplePreimage, expected_identity: hash(samplePreimage), execution: 'canonical_json_utf8_sha256' }
    identityAuthorities[key] = { schema_version: 'ctrl.g24.persisted-identity-authority.r52.v1', identity_kind: identityKind, store_path: store.store_path, row_schema_ref: store.row_schema_ref, row_schema_variant: store.row_schema_variant, row_schema_version: store.row_schema_version, identity_field: field, identity_class: identityClass, exact_formula_authority_ref: exactFormulaAuthorityRef, executable_formula_fixture: executable }
    identityRows.push({ identity_kind: identityKind, exact_authority_ref: `authority_operation_complete_persisted_identity_authorities.${key}`, exact_authority_schema_version: 'ctrl.g24.persisted-identity-authority.r52.v1', store_path: store.store_path, row_schema_ref: store.row_schema_ref, row_schema_variant: store.row_schema_variant, row_schema_version: store.row_schema_version, identity_field: field, identity_class: identityClass })
  }
}
r52.authority_operation_complete_persisted_identity_authorities = identityAuthorities
r52.authority_operation_artifact_fingerprint_derivation_authority = { ...r52.authority_operation_artifact_fingerprint_derivation_authority, schema_version: 'ctrl.g24.authority-operation-artifact-fingerprint-derivation-authority.r52.v1', complete_persisted_store_universe_ref: 'authority_operation_complete_persisted_store_universe', persisted_identity_formula_library_ref: 'authority_operation_persisted_identity_formula_library', sole_active_identity_index: identityRows, exact_identity_kind_count: identityRows.length, exact_store_shape_count: storeRows.length, formula_execution_required: true, missing_extra_duplicate_or_unresolved_identity: 'reject_materialization_and_hold_without_write' }

function concreteTarget(ref, variant = 'UNAVAILABLE', identityKind = 'payload_or_row_content_address') {
  const schema = schemaAt(ref, variant)
  if (!schema) throw new Error(`R52_concrete_target_missing:${ref}:${variant}`)
  const formula = identityKind === 'row_version_ref' ? 'authority_operation_persisted_identity_formula_library.row_version_identity' : identityKind.includes('fingerprint') ? 'authority_operation_persisted_identity_formula_library.schema_declared_fingerprint' : 'authority_operation_persisted_identity_formula_library.payload_or_row_content_address'
  return { target_schema_ref: ref, target_schema_variant: variant, target_schema_version: schema.schema_version ?? 'NESTED_VALUE', target_identity_kind: identityKind, target_identity_formula_authority_ref: formula }
}
const storeByRowSchema = new Map(storeRows.map(row => [`${row.row_schema_ref}|${row.row_schema_variant}`, row]))
function wrapperTarget(row) {
  const store = storeByRowSchema.get(`${row.source_schema_ref}|${row.source_schema_variant}`) ?? storeByRowSchema.get(`${row.source_schema_ref}|UNAVAILABLE`)
  const definition = store && get(r52, store.store_path)
  const literal = definition?.canonical_schema_ref
  if (!literal || typeof literal !== 'string') return null
  const parsed = splitSchemaRef(literal)
  return concreteTarget(parsed.schema_ref, parsed.schema_variant, 'payload_content_address')
}
function operationTargets(row, kind) {
  const operations = r52.case_session_authority_operation_protocols.operations
  const names = row.operation_name && row.operation_name !== 'ALL' ? [row.operation_name] : Object.keys(operations)
  const targets = []
  for (const name of names) {
    const operation = operations[name]
    if (!operation) continue
    if (kind === 'target_intent') targets.push({ operation_name: name, result_branch: row.result_branch ?? 'ALL', target_store: operation.target_store ?? operation.request_schema.properties.target_store.const, ...concreteTarget(`case_session_authority_operation_protocols.operations.${name}.target_intent_schema`, 'UNAVAILABLE', 'payload_content_address') })
    if (kind === 'committed_target') {
      const targetRef = r52.authority_operation_complete_active_persisted_schema_universe.committed_target_schema_refs.find(ref => ref.endsWith(`.${operation.target_store ?? operation.request_schema.properties.target_store.const}`))
      if (targetRef) targets.push({ operation_name: name, result_branch: row.result_branch ?? 'ALL', target_store: operation.target_store ?? operation.request_schema.properties.target_store.const, ...concreteTarget(targetRef, 'UNAVAILABLE', 'row_version_ref') })
    }
    if (kind === 'proof') {
      const proofRef = operation.authority_proof_schema_ref
      if (proofRef && get(r52, proofRef)) targets.push({ operation_name: name, result_branch: row.result_branch ?? 'ALL', target_store: operation.target_store ?? operation.request_schema.properties.target_store.const, ...concreteTarget(proofRef, 'UNAVAILABLE', 'payload_content_address') })
    }
    if (kind === 'request') targets.push({ operation_name: name, result_branch: row.result_branch ?? 'ALL', target_store: operation.target_store ?? operation.request_schema.properties.target_store.const, ...concreteTarget(`case_session_authority_operation_protocols.operations.${name}.request_schema`, 'UNAVAILABLE', 'payload_content_address') })
    if (kind === 'result') {
      const branches = row.result_branch && row.result_branch !== 'ALL' && operation.result_schema.variants[row.result_branch] ? [row.result_branch] : Object.keys(operation.result_schema.variants)
      for (const branch of branches) targets.push({ operation_name: name, result_branch: branch, target_store: operation.target_store ?? operation.request_schema.properties.target_store.const, ...concreteTarget(`case_session_authority_operation_protocols.operations.${name}.result_schema`, branch, 'payload_content_address') })
    }
  }
  const seen = new Set()
  return targets.filter(item => { const key = canonicalR44(item); if (seen.has(key)) return false; seen.add(key); return true })
}
function concreteCases(row) {
  const directWrapper = row.source_field === 'artifact_ref' ? wrapperTarget(row) : null
  if (directWrapper) return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...directWrapper }]
  if (row.source_field === 'row_version_ref' && row.source_schema_ref.startsWith('authoritative_row_schemas.')) return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget(row.source_schema_ref, row.source_schema_variant, 'row_version_ref') }]
  if (row.source_field === 'binding_ref') return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget('authoritative_row_schemas.account_stable_actor_bindings', 'UNAVAILABLE', 'row_version_ref') }]
  if (row.source_field === 'standing_ref') return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget('authoritative_row_schemas.account_access_standings', 'UNAVAILABLE', 'row_version_ref') }]
  if (row.source_field.includes('nonce_receipt_ref')) return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget('proof_nonce_ledger.row_schema', 'UNAVAILABLE', 'nonce_receipt_ref') }]
  if (row.source_field === 'authority_proof_bytes_ref') return operationTargets(row, 'proof')
  if (row.source_field === 'bundle_ref') return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget('session_dual_proof_bundle_schema', 'UNAVAILABLE', 'payload_content_address') }]
  if (row.source_field === 'payload_ref') return [['replayed', 'committed'], ['replayed_held', 'held']].map(([variant, branch]) => ({ operation_name: row.operation_name ?? 'ALL', result_branch: branch, target_store: row.target_store ?? 'ALL', ...concreteTarget('authority_operation_replay_payload_schema', variant, 'payload_content_address') }))
  if (row.source_field === 'session_hold_evidence_ref') {
    const branch = row.result_branch
    if (branch === 'stale_head_hold' || branch === 'invalid_target_hold') return [{ operation_name: row.operation_name ?? 'ALL', result_branch: branch, target_store: row.target_store ?? 'ALL', ...concreteTarget('session_hold_evidence_schema', 'verified_consuming', 'payload_content_address') }]
    if (branch === 'authorization_hold' || branch === 'invalid_proof_hold' || branch === 'internal_failure_hold') return [{ operation_name: row.operation_name ?? 'ALL', result_branch: branch, target_store: row.target_store ?? 'ALL', ...concreteTarget('session_hold_evidence_schema', 'raw_non_consuming', 'payload_content_address') }]
    return ['stale_head_hold', 'invalid_target_hold'].map(resultBranch => ({ operation_name: row.operation_name ?? 'ALL', result_branch: resultBranch, target_store: row.target_store ?? 'ALL', ...concreteTarget('session_hold_evidence_schema', 'verified_consuming', 'payload_content_address') })).concat(['authorization_hold', 'invalid_proof_hold', 'internal_failure_hold'].map(resultBranch => ({ operation_name: row.operation_name ?? 'ALL', result_branch: resultBranch, target_store: row.target_store ?? 'ALL', ...concreteTarget('session_hold_evidence_schema', 'raw_non_consuming', 'payload_content_address') })))
  }
  if (row.source_field === 'target_evidence_ref') return operationTargets(row, 'target_intent')
  if (row.source_field === 'target_intent_bytes_ref') return operationTargets(row, 'target_intent')
  if (row.source_field === 'target_row_bytes_ref') return operationTargets(row, 'committed_target')
  if (row.source_field === 'target_row_version_ref' || row.source_field === 'committed_target_row_ref') return operationTargets(row, 'committed_target')
  if (row.source_field === 'request_artifact_ref' || row.source_field === 'request_bytes_ref') return operationTargets(row, 'request')
  if (row.source_field === 'result_bytes_ref' || row.source_field.endsWith('result_ref')) return operationTargets(row, 'result')
  if (row.source_field === 'historical_response_ref' || row.source_field === 'response_payload_ref') return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget('authority_operation_historical_response_schema', 'UNAVAILABLE', 'payload_content_address') }]
  const existing = row.target_schema_ref_or_UNAVAILABLE
  if (existing && existing !== 'UNAVAILABLE' && !String(existing).startsWith('DISCRIMINATED_BY_')) {
    const variant = row.target_schema_variant_or_UNAVAILABLE ?? 'UNAVAILABLE'
    if (String(variant).startsWith('DISCRIMINATED_BY_')) {
      const union = get(r52, existing)
      return Object.keys(union?.variants ?? {}).map(item => ({ operation_name: row.operation_name ?? 'ALL', result_branch: item, target_store: row.target_store ?? 'ALL', ...concreteTarget(existing, item, row.target_identity_kind_or_classification ?? 'payload_content_address') }))
    }
    return [{ operation_name: row.operation_name ?? 'ALL', result_branch: row.result_branch ?? 'ALL', target_store: row.target_store ?? 'ALL', ...concreteTarget(existing, variant, row.target_identity_kind_or_classification ?? 'payload_content_address') }]
  }
  return []
}
const equalityRows = [], selectorRows = {}
let selectorOrdinal = 0
for (const prior of r52.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows) {
  const exactOne = Boolean(prior.exact_one_resolution_required)
  if (prior.source_field === 'source_evidence_ref') {
    equalityRows.push({ source_schema_ref: prior.source_schema_ref, source_schema_variant: prior.source_schema_variant, source_field: prior.source_field, source_field_type: prior.source_field_type, classification: 'explicit_external_evidence_reference', exact_one_resolution_required: false, exact_target_cases: [], selector_ref: 'UNAVAILABLE', companion_bytes_fields: prior.companion_bytes_fields ?? [], companion_fingerprint_fields: prior.companion_fingerprint_fields ?? [] })
    continue
  }
  const cases = exactOne ? concreteCases(prior) : []
  if (exactOne && cases.length === 0) throw new Error(`R52_no_concrete_target:${prior.source_schema_ref}:${prior.source_schema_variant}:${prior.source_field}`)
  let selectorRef = 'UNAVAILABLE'
  if (exactOne) {
    const selectorId = `selector_${String(++selectorOrdinal).padStart(4, '0')}`
    selectorRef = `authority_operation_internal_reference_target_selectors.rows.${selectorId}`
    selectorRows[selectorId] = { schema_version: 'ctrl.g24.internal-reference-target-selector-row.r52.v1', selector_id: selectorId, source_schema_ref: prior.source_schema_ref, source_schema_variant: prior.source_schema_variant, source_field: prior.source_field, selection_dimensions: ['source_schema_ref', 'source_schema_variant', 'source_field', 'operation_name', 'result_branch', 'target_store', 'canonical_schema_ref_when_wrapper'], exact_concrete_cases: cases, exact_case_count: cases.length, selector_totality: true, selector_uniqueness: true, caller_override: 'forbidden' }
  }
  equalityRows.push({ source_schema_ref: prior.source_schema_ref, source_schema_variant: prior.source_schema_variant, source_field: prior.source_field, source_field_type: prior.source_field_type, classification: exactOne ? 'internal_exact_one_closed_concrete_selector' : prior.target_identity_kind_or_classification ?? 'explicit_nonartifact_or_semantic_schema_reference', exact_one_resolution_required: exactOne, exact_target_cases: cases, selector_ref: selectorRef, companion_bytes_fields: prior.companion_bytes_fields ?? [], companion_fingerprint_fields: prior.companion_fingerprint_fields ?? [], target_intent_fingerprint_required_when_present: Boolean(prior.target_intent_fingerprint_required_when_present) })
}
r52.authority_operation_internal_reference_target_selectors = { schema_version: 'ctrl.g24.internal-reference-target-selectors.r52.v1', row_schema_version: 'ctrl.g24.internal-reference-target-selector-row.r52.v1', exact_count: Object.keys(selectorRows).length, rows: selectorRows, candidates_must_be_concrete_schema_variant_version_and_formula: true, meta_container_or_DISCRIMINATED_BY_candidate: 'forbidden', selector_totality_and_uniqueness: 'required', cross_operation_or_store_substitution: 'reject_and_hold_without_write' }
r52.authority_operation_complete_schema_cross_artifact_equality_registry = { schema_version: 'ctrl.g24.complete-schema-cross-artifact-equality-registry.r52.v1', exact_rows: equalityRows, exact_row_count: equalityRows.length, internal_exact_one_count: equalityRows.filter(row => row.exact_one_resolution_required).length, internal_exact_one_unavailable_or_meta_target_count: equalityRows.filter(row => row.exact_one_resolution_required && (row.exact_target_cases.length === 0 || row.exact_target_cases.some(item => item.target_schema_ref === 'authority_operation_complete_active_persisted_schema_universe' || String(item.target_schema_variant).startsWith('DISCRIMINATED_BY_')))).length, internal_targets_are_exact_closed_and_formula_bound: true }
r52.authority_operation_explicit_nonartifact_reference_field_allowlist = { ...r52.authority_operation_explicit_nonartifact_reference_field_allowlist, schema_version: 'ctrl.g24.explicit-nonartifact-reference-field-allowlist.r52.v1', exact_rows: equalityRows.filter(row => !row.exact_one_resolution_required).map(row => ({ source_schema_ref: row.source_schema_ref, source_schema_variant: row.source_schema_variant, source_field: row.source_field, classification: row.classification })), internal_exact_one_fields_excluded: true }

const allFixtures = [...r52.authority_operation_replay_restart_fixtures.fixtures, r52.authority_operation_committed_receipt_identity_fixtures]
const wrapperTraversal = []
for (const fixture of allFixtures) for (const [role, artifact] of Object.entries(fixture.artifact_store_by_role)) if (artifact.fixture_wrapper_variant === 'content_addressed') {
  const literal = artifact.stored_row_value.canonical_schema_ref ?? artifact.payload_schema_ref, parsed = splitSchemaRef(literal), schema = schemaAt(parsed.schema_ref, parsed.schema_variant)
  wrapperTraversal.push({ fixture_id: fixture.fixture_id, artifact_role: role, wrapper_schema_version: artifact.selected_wrapper_schema_version ?? artifact.stored_row_schema_version ?? artifact.schema_version ?? 'UNAVAILABLE', canonical_schema_ref: literal, canonical_schema_reference_classification: literal === 'opaque_bounded_bytes' ? 'explicit_opaque_bytes_sentinel' : 'exact_semantic_schema_reference', exact_target_schema_ref: parsed.schema_ref, exact_target_schema_variant: parsed.schema_variant, exact_target_schema_version: schema?.schema_version ?? 'UNAVAILABLE', artifact_ref: artifact.stored_row_value.artifact_ref ?? artifact.ref, payload_bytes_sha256: artifact.payload_bytes_sha256, parsed_content_fingerprint: artifact.stored_row_value.parsed_content_fingerprint ?? artifact.payload_fingerprint, payload_fingerprint: artifact.payload_fingerprint, stored_row_value_in_validation_scope: true, exact_store_schema_version: artifact.selected_store_authority_schema_version ?? artifact.selected_store_schema_version ?? artifact.schema_version ?? 'UNAVAILABLE' })
}
wrapperTraversal.sort((a, b) => cp(`${a.fixture_id}|${a.artifact_role}`, `${b.fixture_id}|${b.artifact_role}`))
r52.authority_operation_fixture_wrapper_reference_traversal = { schema_version: 'ctrl.g24.fixture-wrapper-reference-traversal.r52.v1', exact_row_count: wrapperTraversal.length, rows: wrapperTraversal, canonical_schema_ref_is_semantic_schema_reference_not_artifact_reference: true, artifact_ref_selected_by_resolved_canonical_schema_ref: true, stored_row_value_and_payload_value_both_validated: true, zero_or_multiple_schema_resolution: 'reject_restart_and_hold_without_write' }
r52.authority_operation_artifact_resolution_authority = { ...r52.authority_operation_artifact_resolution_authority, schema_version: 'ctrl.g24.authority-operation-artifact-resolution-authority.r52.v1', wrapper_traversal_ref: 'authority_operation_fixture_wrapper_reference_traversal', store_universe_ref: 'authority_operation_complete_persisted_store_universe', equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', wrapper_row_values_are_in_validation_scope: true, exact_one_internal_resolution_has_no_UNAVAILABLE_or_meta_target: true }
r52.authority_operation_restart_correlation_authority = { ...r52.authority_operation_restart_correlation_authority, schema_version: 'ctrl.g24.authority-operation-restart-correlation-authority.r52.v1', wrapper_traversal_ref: 'authority_operation_fixture_wrapper_reference_traversal', equality_registry_ref: 'authority_operation_complete_schema_cross_artifact_equality_registry', exact_row_count: r52.authority_operation_restart_correlation_authority.rows.length }
r52.fixture_schema_validator = { ...r52.fixture_schema_validator, schema_version: 'ctrl.g24.fixture-schema-validator.r52.v1', validation_scope: 'payloads_stored_wrapper_rows_exact_field_encoded_signatures_declared_JSON_fingerprints_bidirectional_store_universe_identity_formulas_closed_selectors_and_restart_lineage' }

r52.schema_change_manifest = { schema_version: 'ctrl.g24.trusted-ingress-schema-change-manifest.r52.v1', derivation: 'bounded_exact_extension_from_frozen_R51_codec_store_selector_and_non_suffix_reference_closure', frozen_parent_sha256: sha(inputBytes), changed_semantic_paths: ['$', '$.materialization', '$.status', '$.supersedes', '$.canonical_json_utf8_encoding', '$.authority_operation_fingerprint_codec_audit', '$.authority_operation_normative_durable_store_authority_graph', '$.authority_operation_complete_persisted_store_universe', '$.authority_operation_persisted_identity_formula_library', '$.authority_operation_complete_persisted_identity_authorities', '$.authority_operation_artifact_fingerprint_derivation_authority', '$.authority_operation_internal_reference_target_selectors', '$.authority_operation_complete_schema_cross_artifact_equality_registry', '$.authority_operation_explicit_nonartifact_reference_field_allowlist', '$.authority_operation_fixture_wrapper_reference_traversal', '$.authority_operation_artifact_resolution_authority', '$.authority_operation_restart_correlation_authority', '$.fixture_schema_validator', '$.authority_runtime_semantic_manifest_hash_contract', '$.authority_runtime_semantic_reference_field_registry', '$.authority_runtime_semantic_reference_owner_map', '$.authority_runtime_semantic_dependency_owner_map', '$.authority_runtime_semantic_manifest', '$.schema_change_manifest'], removed_semantic_paths: ['$.authority_operation_internal_reference_target_discriminators'], frozen_parent_core_must_remain_byte_identical: true, runtime_database_ui_deployment_or_external_action: 'closed' }
r52.required_negative_fixture_families = [...new Set([...r52.required_negative_fixture_families, 'declared_fingerprint_codec_mismatch', 'issuer_nonce_codec_mismatch', 'durable_store_graph_omission', 'meta_discriminator_candidate', 'cross_operation_store_selector_substitution', 'non_suffix_then_or_source_reference_omission'])]
delete r52.authority_operation_internal_reference_target_discriminators

const replacedPaths = new Set(['authority_operation_complete_persisted_store_universe', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_discriminators', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_fixture_wrapper_reference_traversal', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
const newPaths = ['authority_operation_fingerprint_codec_audit', 'authority_operation_normative_durable_store_authority_graph', 'authority_operation_complete_persisted_store_universe', 'authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_fixture_wrapper_reference_traversal', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest']
const sourcePaths = [...new Set([...r51SemanticAuthorityPaths.filter(path => !replacedPaths.has(path)), ...newPaths])].filter(path => get(r52, path) !== undefined).sort(cp)
r52.authority_runtime_semantic_manifest_hash_contract = { ...r52.authority_runtime_semantic_manifest_hash_contract, schema_version: 'ctrl.g24.runtime-semantic-manifest-hash-contract.r52.v1', manifest_hash_version: 'ctrl.g24.runtime-semantic-manifest-hash.r52.v1', content_domain_ascii: 'CTRL-G24-R52-MANIFEST-CONTENT', dependency_domain_ascii: 'CTRL-G24-R52-MANIFEST-DEPENDENCY', graph_domain_ascii: 'CTRL-G24-R52-MANIFEST-GRAPH', envelope_domain_ascii: 'CTRL-G24-R52-MANIFEST-ENVELOPE' }
if (!sourcePaths.includes('authority_runtime_semantic_manifest_hash_contract')) sourcePaths.push('authority_runtime_semantic_manifest_hash_contract')
sourcePaths.sort(cp)
const sourceSnapshot = Object.fromEntries(sourcePaths.map(path => [path, ownedSnapshotR44(get(r52, path))]))
const snapshotSha = hash({ domain_ascii: 'CTRL-G24-R52-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: sourcePaths, values: sourceSnapshot })
const nonSuffix = new Set(r52.semantic_reference_field_specification.exact_non_suffix_semantic_fields)
const refRows = [], seenRefs = new Set()
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key) && !/(fingerprint|sha256)$/.test(key)
const exactTarget = value => typeof value === 'string' && value !== 'UNAVAILABLE' && get(r52, value) !== undefined ? value : 'UNAVAILABLE'
function walkRefs(value, source, path = source) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`, semanticField = refToken(key) || nonSuffix.has(key)
    if (semanticField) {
      const values = Array.isArray(child) ? child : [child]
      values.forEach((literal, index) => {
        if (typeof literal !== 'string') return
        const fieldPath = Array.isArray(child) ? `${next}.${index}` : next, id = `${source}|${fieldPath}|${literal}`
        if (seenRefs.has(id)) return
        seenRefs.add(id)
        const target = exactTarget(literal)
        refRows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: refToken(key) ? 'tokenized_reference_field' : 'pinned_non_suffix_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: target, exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(r52, target)?.schema_version ?? 'NESTED_VALUE', reference_kind: target === 'UNAVAILABLE' ? 'runtime_external_sentinel_or_closed_discriminator_literal' : 'exact_semantic_reference' })
      })
    }
    walkRefs(child, source, next)
  }
}
for (const path of sourcePaths) walkRefs(get(r52, path), path)
refRows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
r52.authority_runtime_semantic_reference_field_registry = { schema_version: 'ctrl.g24.runtime-semantic-reference-field-registry.r52.v1', source_snapshot_sha256: snapshotSha, exact_source_paths: sourcePaths, exact_occurrence_rows: refRows, exact_expected_occurrence_count: refRows.length, tokenized_suffix_vocabulary_ref: 'semantic_reference_field_specification.exact_patterns', pinned_non_suffix_field_vocabulary_ref: 'semantic_reference_field_specification.exact_non_suffix_semantic_fields', pinned_non_suffix_occurrence_count: refRows.filter(row => row.match_kind === 'pinned_non_suffix_semantic_field').length, exact_then_occurrence_count: refRows.filter(row => row.field_name === 'then').length, exact_source_occurrence_count: refRows.filter(row => row.field_name === 'source').length, derivation: 'independent_recursive_scan_of_final_R52_source_snapshot_using_suffix_and_every_pinned_non_suffix_field', unknown_reference_semantics: 'reject_materialization_and_hold_without_write' }
const dependencies = Object.fromEntries(sourcePaths.map(path => [path, [...new Set(refRows.filter(row => row.source_authority_path === path && sourcePaths.includes(row.exact_target_path_or_UNAVAILABLE) && row.exact_target_path_or_UNAVAILABLE !== path).map(row => row.exact_target_path_or_UNAVAILABLE))].sort(cp)]))
r52.authority_runtime_semantic_reference_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-reference-owner-map.r52.v1', source_snapshot_sha256: snapshotSha, exact_row_count: refRows.length, reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', suffix_and_non_suffix_bijection: true }
r52.authority_runtime_semantic_dependency_owner_map = { schema_version: 'ctrl.g24.runtime-semantic-dependency-owner-map.r52.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: sourcePaths.map(path => ({ authority_path: path, typed_owner_paths: dependencies[path] })), reference_registry_ref: 'authority_runtime_semantic_reference_field_registry', known_then_and_source_dependencies_included: true }
const hc = r52.authority_runtime_semantic_manifest_hash_contract
const contentHashes = Object.fromEntries(sourcePaths.map(path => [path, hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(get(r52, path)) })]))
function transitive(path) { const seen = new Set(), visit = item => { for (const dep of dependencies[item] ?? []) if (!seen.has(dep)) { seen.add(dep); visit(dep) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
const manifestRows = sourcePaths.map(path => { const direct = dependencies[path].map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })), all = transitive(path).map(dep => ({ authority_path: dep, authority_content_sha256: contentHashes[dep] })); return { authority_path: path, authority_schema_version: get(r52, path)?.schema_version ?? 'UNVERSIONED', exact_keyset: Object.keys(get(r52, path) ?? {}).sort(cp), authority_content_sha256: contentHashes[path], direct_dependency_paths: dependencies[path], direct_dependency_content_hashes: direct, direct_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), transitive_dependency_paths: all.map(row => row.authority_path), transitive_dependency_content_hashes: all, transitive_dependency_set_sha256: hash({ domain_ascii: hc.dependency_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: all }) } })
const manifestWithoutSeal = { schema_version: 'ctrl.g24.runtime-semantic-authority-manifest.r52.v1', source_snapshot_sha256: snapshotSha, exact_paths: sourcePaths, rows: manifestRows, exact_expected_count: manifestRows.length, manifest_graph_sha256: hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: manifestRows }) }
r52.authority_runtime_semantic_manifest = { ...manifestWithoutSeal, manifest_envelope_seal_sha256: hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: manifestWithoutSeal }) }

const finalSnapshot = ownedSnapshotR44(r52)
export const materializedR52 = r52
export const materializedR52Output = `${JSON.stringify(finalSnapshot, null, 2)}\n`
export const r52SemanticAuthorityPaths = sourcePaths
export const discoverDurableStoreRowsR52 = discoverDurableStoreRows
const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const mode = process.argv[2] ?? '--check'
  if (mode === '--write') { writeFileSync(join(root, outputPath), materializedR52Output); console.log(`wrote ${outputPath}`) }
  else if (mode === '--check') { if (readFileSync(join(root, outputPath), 'utf8') !== materializedR52Output) { console.error(`${outputPath} differs from materializer`); process.exit(1) } console.log(`ok: ${outputPath} is the exact fully materialized R52 effective contract`) }
  else throw new Error(`unsupported mode:${mode}`)
}
