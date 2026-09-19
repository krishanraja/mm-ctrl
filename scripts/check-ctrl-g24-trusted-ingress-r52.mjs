import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR51Output, r51SemanticAuthorityPaths } from './materialize-ctrl-g24-trusted-ingress-r51.mjs'
import { materializedR52, materializedR52Output } from './materialize-ctrl-g24-trusted-ingress-r52.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r52.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...String(a)].map(c => c.codePointAt(0)), y = [...String(b)].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, dotted) => String(dotted).split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, ref, variant = 'UNAVAILABLE') => { const schema = get(contract, ref); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const u32 = number => { const out = Buffer.alloc(4); out.writeUInt32BE(number); return out }
const u64 = number => { assert(Number.isSafeInteger(number) && number >= 0, 'field_u64'); const out = Buffer.alloc(8); out.writeBigUInt64BE(BigInt(number)); return out }
const utf8 = value => { const bytes = Buffer.from(value, 'utf8'); return Buffer.concat([u32(bytes.length), bytes]) }
function encodeField(spec, value) {
  if (value === null) return Buffer.from([0])
  if (spec?.type === 'nullable') return Buffer.concat([Buffer.from([1]), encodeField(spec.value_schema ?? { type: typeof value === 'string' ? 'identifier' : 'safe_nonnegative_integer' }, value)])
  if (spec?.type === 'sha256') { assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), 'field_sha256'); return Buffer.from(value, 'hex') }
  if (spec?.type === 'base64url_without_padding') { assert(typeof value === 'string' && !value.includes('='), 'field_b64'); const bytes = Buffer.from(value, 'base64url'); assert(bytes.toString('base64url') === value, 'field_b64_canonical'); return Buffer.concat([u64(bytes.length), bytes]) }
  if (spec?.type === 'boolean' || typeof value === 'boolean') return Buffer.from([value ? 1 : 0])
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec?.type)) return u64(value)
  if (spec?.type === 'finite_nonnegative_number') { assert(Number.isFinite(value) && value >= 0 && !Object.is(value, -0), 'field_number'); return utf8(JSON.stringify(value)) }
  if (Array.isArray(value)) return Buffer.concat([u64(value.length), ...value.map(item => encodeField(spec?.items, item))])
  if (typeof value === 'string') return utf8(value)
  throw new Error(`field_unencodable:${spec?.type ?? typeof value}`)
}
function encodeProof(contract, family, proof) {
  const rule = contract.proof_signed_preimages[family]
  const schema = family === 'issuer' ? contract.case_session_issuer_capability_proof_schema : contract.case_session_evaluator_capability_proof_schema
  return Buffer.concat(rule.field_order.map(field => encodeField(field === 'domain_ascii' ? { const: rule.domain_ascii } : schema.properties[field], field === 'domain_ascii' ? rule.domain_ascii : proof[field])))
}

function discoverStores(contract) {
  const rows = []
  function walk(value, parts = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    const storePath = parts.join('.'), rowSchema = value.row_schema, rowUnion = value.row_union
    const hasShape = Boolean(rowSchema?.properties || rowUnion?.variants)
    const durable = /(store|registry|ledger)/.test(storePath) || Object.hasOwn(value, 'sole_writer') || Object.hasOwn(value, 'direct_dml') || Object.hasOwn(value, 'one_row_per_reference') || Object.hasOwn(value, 'retention')
    if (hasShape && durable) {
      for (const [variant, schema] of rowUnion ? Object.entries(rowUnion.variants) : [['UNAVAILABLE', rowSchema]]) rows.push({ store_path: storePath, store_schema_version: value.schema_version ?? schema.schema_version, row_schema_ref: rowUnion ? `${storePath}.row_union` : `${storePath}.row_schema`, row_schema_variant: variant, row_schema_version: schema.schema_version, persistence_kind: rowUnion ? 'discriminated_row_union_variant' : 'closed_row', writer_authority: value.sole_writer ?? value.sole_writer_role ?? schema.sole_writer ?? 'schema_bound_store_writer', direct_dml_rule: value.direct_dml ?? value.direct_dml_by_application_browser_edge_worker_generic_service_or_caller ?? 'forbidden_by_store_authority' })
    }
    for (const [key, child] of Object.entries(value)) walk(child, [...parts, key])
  }
  walk(contract)
  const represented = new Set(rows.map(row => `${row.row_schema_ref}|${row.row_schema_variant}`))
  for (const schemaRef of contract.authority_operation_complete_active_persisted_schema_universe.committed_target_schema_refs) if (!represented.has(`${schemaRef}|UNAVAILABLE`)) rows.push({ store_path: schemaRef.replace('authoritative_row_schemas.', ''), store_schema_version: get(contract, schemaRef).schema_version, row_schema_ref: schemaRef, row_schema_variant: 'UNAVAILABLE', row_schema_version: get(contract, schemaRef).schema_version, persistence_kind: 'authoritative_committed_target_row', writer_authority: 'ctrl_authority_operation_executor', direct_dml_rule: 'forbidden' })
  return rows.sort((a, b) => cp(`${a.store_path}|${a.row_schema_variant}|${a.row_schema_version}`, `${b.store_path}|${b.row_schema_variant}|${b.row_schema_version}`))
}

function directCodecRows(contract) {
  const fingerprint = [], proof = []
  function walk(value, path = '$') {
    if (!value || typeof value !== 'object') return
    if (Object.hasOwn(value, 'field_encoding_ref')) fingerprint.push({ path: path.slice(2), field: 'field_encoding_ref', codec: value.field_encoding_ref, version: value.schema_version ?? 'NESTED_VALUE', preimage_order: value.preimage_order ?? value.ordered_preimage ?? [] })
    if (Object.hasOwn(value, 'canonical_encoding_ref')) {
      const row = { path: path.slice(2), field: 'canonical_encoding_ref', codec: value.canonical_encoding_ref, version: value.schema_version ?? 'NESTED_VALUE', preimage_order: value.preimage_order ?? value.ordered_preimage ?? value.field_order ?? [] }
      if (path.startsWith('$.proof_signed_preimages.')) proof.push(row); else fingerprint.push(row)
    }
    for (const [key, child] of Object.entries(value)) {
      if (['authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'authority_operation_fingerprint_codec_audit'].includes(key) && path === '$') continue
      walk(child, `${path}.${key}`)
    }
  }
  walk(contract)
  return { fingerprint: fingerprint.sort((a, b) => cp(a.path, b.path)), proof: proof.sort((a, b) => cp(a.path, b.path)) }
}

function validateArtifacts(contract) {
  const fixtures = [...contract.authority_operation_replay_restart_fixtures.fixtures, contract.authority_operation_committed_receipt_identity_fixtures]
  let checked = 0
  for (const fixture of fixtures) for (const [role, artifact] of Object.entries(fixture.artifact_store_by_role)) {
    if (artifact.fixture_wrapper_variant !== 'content_addressed') continue
    const row = artifact.stored_row_value
    if (row?.opaque_bytes_sha256) {
      const raw = Buffer.from(row.opaque_bytes_b64url, 'base64url')
      assert(row.opaque_bytes_length === raw.length && row.opaque_bytes_sha256 === sha(raw) && row.artifact_ref === row.opaque_bytes_sha256 && artifact.ref === row.artifact_ref, `artifact_opaque:${fixture.fixture_id}:${role}`)
      checked += 1
      continue
    }
    const payloadBytes = canonicalR44(artifact.payload_value), payloadSha = sha(Buffer.from(payloadBytes, 'utf8'))
    assert(artifact.payload_canonical_bytes_utf8 === payloadBytes && artifact.payload_bytes_sha256 === payloadSha && artifact.ref === payloadSha, `artifact_payload:${fixture.fixture_id}:${role}`)
    if (row?.canonical_schema_ref) {
      assert(row.canonical_schema_ref === artifact.payload_schema_ref && get(contract, row.canonical_schema_ref), `artifact_schema:${fixture.fixture_id}:${role}`)
      assert(row.artifact_ref === payloadSha && row.canonical_bytes_sha256 === payloadSha && Buffer.from(row.canonical_bytes_b64url, 'base64url').toString('utf8') === payloadBytes, `artifact_wrapper:${fixture.fixture_id}:${role}`)
    }
    if (artifact.declared_payload_fingerprint_preimage) {
      const rule = get(contract, artifact.declared_payload_fingerprint_schema_ref)
      if (rule?.field_encoding_ref || rule?.canonical_encoding_ref) assert((rule.field_encoding_ref ?? rule.canonical_encoding_ref) === 'canonical_json_utf8_encoding', `artifact_codec:${fixture.fixture_id}:${role}`)
      assert(hash(artifact.declared_payload_fingerprint_preimage) === artifact.payload_fingerprint, `artifact_payload_fp:${fixture.fixture_id}:${role}`)
    }
    if (artifact.declared_wrapper_fingerprint_preimage) {
      const rule = get(contract, artifact.declared_wrapper_fingerprint_schema_ref)
      if (rule?.field_encoding_ref || rule?.canonical_encoding_ref) assert((rule.field_encoding_ref ?? rule.canonical_encoding_ref) === 'canonical_json_utf8_encoding', `wrapper_codec:${fixture.fixture_id}:${role}`)
      assert(hash(artifact.declared_wrapper_fingerprint_preimage) === (artifact.stored_row_fingerprint ?? artifact.fingerprint), `artifact_wrapper_fp:${fixture.fixture_id}:${role}`)
    }
    checked += 1
  }
  return checked
}

const replacedPaths = new Set(['authority_operation_complete_persisted_store_universe', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_discriminators', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_fixture_wrapper_reference_traversal', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'authority_runtime_semantic_manifest_hash_contract', 'authority_runtime_semantic_reference_field_registry', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_manifest', 'schema_change_manifest'])
const newPaths = ['authority_operation_fingerprint_codec_audit', 'authority_operation_normative_durable_store_authority_graph', 'authority_operation_complete_persisted_store_universe', 'authority_operation_persisted_identity_formula_library', 'authority_operation_complete_persisted_identity_authorities', 'authority_operation_artifact_fingerprint_derivation_authority', 'authority_operation_internal_reference_target_selectors', 'authority_operation_explicit_nonartifact_reference_field_allowlist', 'authority_operation_complete_schema_cross_artifact_equality_registry', 'authority_operation_fixture_wrapper_reference_traversal', 'authority_operation_artifact_resolution_authority', 'authority_operation_restart_correlation_authority', 'fixture_schema_validator', 'schema_change_manifest']
function expectedSourcePaths(contract) { const rows = [...new Set([...r51SemanticAuthorityPaths.filter(item => !replacedPaths.has(item)), ...newPaths, 'authority_runtime_semantic_manifest_hash_contract'])].filter(item => get(contract, item) !== undefined); return rows.sort(cp) }
function scanRefs(contract, sourcePaths) {
  const nonSuffix = new Set(contract.semantic_reference_field_specification.exact_non_suffix_semantic_fields), rows = [], seen = new Set()
  const refToken = key => /(^|_)(ref|refs)($|_)/.test(key) && !/(fingerprint|sha256)$/.test(key)
  function walk(value, source, path = source) {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const next = `${path}.${key}`, matched = refToken(key) || nonSuffix.has(key)
      if (matched) for (const [index, literal] of (Array.isArray(child) ? child : [child]).entries()) if (typeof literal === 'string') {
        const fieldPath = Array.isArray(child) ? `${next}.${index}` : next, id = `${source}|${fieldPath}|${literal}`
        if (!seen.has(id)) { seen.add(id); const target = literal !== 'UNAVAILABLE' && get(contract, literal) !== undefined ? literal : 'UNAVAILABLE'; rows.push({ source_authority_path: source, field_path: fieldPath, field_name: key, match_kind: refToken(key) ? 'tokenized_reference_field' : 'pinned_non_suffix_semantic_field', reference_literal: literal, exact_target_path_or_UNAVAILABLE: target, exact_target_schema_version_or_UNAVAILABLE: target === 'UNAVAILABLE' ? 'UNAVAILABLE' : get(contract, target)?.schema_version ?? 'NESTED_VALUE', reference_kind: target === 'UNAVAILABLE' ? 'runtime_external_sentinel_or_closed_discriminator_literal' : 'exact_semantic_reference' }) }
      }
      walk(child, source, next)
    }
  }
  for (const source of sourcePaths) walk(get(contract, source), source)
  return rows.sort((a, b) => cp(`${a.source_authority_path}|${a.field_path}|${a.reference_literal}`, `${b.source_authority_path}|${b.field_path}|${b.reference_literal}`))
}
function validateManifest(contract) {
  const registry = contract.authority_runtime_semantic_reference_field_registry, paths = expectedSourcePaths(contract)
  assert(same(paths, registry.exact_source_paths), 'manifest_source_paths')
  const snapshot = Object.fromEntries(paths.map(item => [item, ownedSnapshotR44(get(contract, item))])), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R52-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: paths, values: snapshot })
  assert(snapshotSha === registry.source_snapshot_sha256 && snapshotSha === contract.authority_runtime_semantic_manifest.source_snapshot_sha256, 'manifest_snapshot')
  const refs = scanRefs(contract, paths)
  assert(same(refs, registry.exact_occurrence_rows) && refs.length === registry.exact_expected_occurrence_count, 'semantic_reference_registry')
  assert(registry.exact_then_occurrence_count === refs.filter(row => row.field_name === 'then').length && registry.exact_then_occurrence_count > 0, 'semantic_then')
  assert(registry.exact_source_occurrence_count === refs.filter(row => row.field_name === 'source').length && registry.exact_source_occurrence_count > 0, 'semantic_source')
  const hc = contract.authority_runtime_semantic_manifest_hash_contract
  for (const row of contract.authority_runtime_semantic_manifest.rows) assert(row.authority_content_sha256 === hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(contract, row.authority_path)) }), `manifest_content:${row.authority_path}`)
  const without = { ...contract.authority_runtime_semantic_manifest }; delete without.manifest_envelope_seal_sha256
  assert(contract.authority_runtime_semantic_manifest.manifest_graph_sha256 === hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: contract.authority_runtime_semantic_manifest.rows }), 'manifest_graph')
  assert(contract.authority_runtime_semantic_manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: without }), 'manifest_seal')
  return refs.length
}

function validate(contract) {
  const codecRows = directCodecRows(contract), audit = contract.authority_operation_fingerprint_codec_audit
  assert(codecRows.fingerprint.length === 215 && codecRows.fingerprint.filter(row => row.field === 'field_encoding_ref').length === 205 && codecRows.fingerprint.every(row => row.codec === 'canonical_json_utf8_encoding'), 'fingerprint_codec_count_or_parity')
  assert(codecRows.proof.length === 4 && codecRows.proof.every(row => row.codec === 'canonical_field_encoding'), 'proof_codec_parity')
  const normalized = codecRows.fingerprint.map(row => ({ authority_path: row.path, declaration_field: row.field, prior_codec_ref: 'canonical_field_encoding', selected_codec_ref: row.codec, exact_authority_schema_version: row.version, preimage_order: row.preimage_order }))
  assert(audit.fingerprint_authority_count === 215 && same(normalized, audit.exact_rows) && audit.mismatched_codec_count === 0, 'codec_audit')
  const signatureFixture = contract.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role
  for (const family of ['issuer', 'evaluator']) {
    const proof = signatureFixture[`${family}_proof`], key = signatureFixture[`${family}_verifier_key`], bytes = encodeProof(contract, family, proof.payload_value), evidence = audit.proof_signature_rows.find(row => row.family === family)
    const publicKey = createPublicKey({ key: Buffer.from(key.payload_value.public_key_spki_der_b64url, 'base64url'), format: 'der', type: 'spki' }), signature = Buffer.from(proof.payload_value.signature_b64url, 'base64url')
    assert(evidence && evidence.selected_codec_ref === 'canonical_field_encoding', `proof_audit:${family}`)
    assert(signature.length === 64 && verify(null, bytes, publicKey, signature), `proof_signature:${family}`)
    const rule = contract.proof_signed_preimages[family], json = {}; for (const field of rule.field_order) json[field] = field === 'domain_ascii' ? rule.domain_ascii : proof.payload_value[field]
    assert(!verify(null, Buffer.from(canonicalR44(json), 'utf8'), publicKey, signature), `proof_json_rejected:${family}`)
  }
  const stores = discoverStores(contract), graph = contract.authority_operation_normative_durable_store_authority_graph, universe = contract.authority_operation_complete_persisted_store_universe
  assert(stores.length === 160 && same(stores, graph.exact_rows) && same(stores, universe.exact_rows) && graph.exact_store_shape_count === stores.length && universe.exact_store_shape_count === stores.length, 'store_universe')
  for (const required of universe.required_named_paths) assert(stores.some(row => row.store_path === required), `required_store:${required}`)
  assert(stores.filter(row => row.store_path === 'authority_operation_pre_materialized_replay_lookup_store').length === 2, 'replay_lookup_variants')
  const identities = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index
  assert(identities.length === contract.authority_operation_artifact_fingerprint_derivation_authority.exact_identity_kind_count && new Set(identities.map(row => row.identity_kind)).size === identities.length, 'identity_index')
  for (const row of identities) {
    const authority = get(contract, row.exact_authority_ref), formula = authority && get(contract, authority.exact_formula_authority_ref), fixture = authority?.executable_formula_fixture
    assert(authority && formula && fixture && authority.identity_kind === row.identity_kind, `identity_authority:${row.identity_kind}`)
    const computed = fixture.execution === 'raw_sha256' ? sha(Buffer.from(fixture.input_b64url, 'base64url')) : hash(fixture.exact_preimage)
    assert(computed === fixture.expected_identity, `identity_formula:${row.identity_kind}`)
  }
  for (const store of stores) {
    const schema = schemaAt(contract, store.row_schema_ref, store.row_schema_variant), fields = Object.keys(schema.properties).filter(field => field === 'artifact_ref' || field.endsWith('_bytes_ref') || field === 'nonce_receipt_ref' || field === 'receipt_ref' || field.endsWith('_row_ref') || field.endsWith('_version_ref') || field.endsWith('_fingerprint'))
    for (const field of fields) assert(identities.some(row => row.store_path === store.store_path && row.row_schema_variant === store.row_schema_variant && row.identity_field === field), `identity_coverage:${store.store_path}:${store.row_schema_variant}:${field}`)
  }
  const equalities = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows, selectors = contract.authority_operation_internal_reference_target_selectors
  assert(equalities.length === 782 && equalities.filter(row => row.exact_one_resolution_required).length === selectors.exact_count && contract.authority_operation_complete_schema_cross_artifact_equality_registry.internal_exact_one_unavailable_or_meta_target_count === 0, 'selector_count')
  for (const row of equalities) {
    const source = schemaAt(contract, row.source_schema_ref, row.source_schema_variant)
    assert(source?.properties?.[row.source_field], `selector_source:${row.source_schema_ref}:${row.source_field}`)
    if (!row.exact_one_resolution_required) continue
    const selector = get(contract, row.selector_ref)
    assert(selector && same(selector.exact_concrete_cases, row.exact_target_cases) && selector.exact_case_count === row.exact_target_cases.length && row.exact_target_cases.length > 0, `selector_binding:${row.source_schema_ref}:${row.source_field}`)
    const selectionKeys = new Set()
    for (const item of row.exact_target_cases) {
      assert(item.target_schema_ref !== 'authority_operation_complete_active_persisted_schema_universe' && !String(item.target_schema_variant).startsWith('DISCRIMINATED_BY_'), `selector_meta:${row.source_schema_ref}:${row.source_field}`)
      const target = schemaAt(contract, item.target_schema_ref, item.target_schema_variant)
      assert(target && item.target_schema_version === target.schema_version && get(contract, item.target_identity_formula_authority_ref), `selector_target:${row.source_schema_ref}:${row.source_field}`)
      const selection = canonicalR44({ operation_name: item.operation_name, result_branch: item.result_branch, target_store: item.target_store, target_schema_ref: item.target_schema_ref, target_schema_variant: item.target_schema_variant })
      assert(!selectionKeys.has(selection), `selector_duplicate:${row.source_schema_ref}:${row.source_field}`); selectionKeys.add(selection)
    }
  }
  const wrappers = []
  const fixtures = [...contract.authority_operation_replay_restart_fixtures.fixtures, contract.authority_operation_committed_receipt_identity_fixtures]
  for (const fixture of fixtures) for (const [role, artifact] of Object.entries(fixture.artifact_store_by_role)) if (artifact.fixture_wrapper_variant === 'content_addressed') {
    const literal = artifact.stored_row_value.canonical_schema_ref ?? artifact.payload_schema_ref, marker = '.variants.', index = literal.indexOf(marker), ref = index < 0 ? literal : literal.slice(0, index), variant = index < 0 ? 'UNAVAILABLE' : literal.slice(index + marker.length), target = schemaAt(contract, ref, variant)
    wrappers.push({ fixture_id: fixture.fixture_id, artifact_role: role, wrapper_schema_version: artifact.selected_wrapper_schema_version ?? artifact.stored_row_schema_version ?? artifact.schema_version ?? 'UNAVAILABLE', canonical_schema_ref: literal, canonical_schema_reference_classification: literal === 'opaque_bounded_bytes' ? 'explicit_opaque_bytes_sentinel' : 'exact_semantic_schema_reference', exact_target_schema_ref: ref, exact_target_schema_variant: variant, exact_target_schema_version: target?.schema_version ?? 'UNAVAILABLE', artifact_ref: artifact.stored_row_value.artifact_ref ?? artifact.ref, payload_bytes_sha256: artifact.payload_bytes_sha256, parsed_content_fingerprint: artifact.stored_row_value.parsed_content_fingerprint ?? artifact.payload_fingerprint, payload_fingerprint: artifact.payload_fingerprint, stored_row_value_in_validation_scope: true, exact_store_schema_version: artifact.selected_store_authority_schema_version ?? artifact.selected_store_schema_version ?? artifact.schema_version ?? 'UNAVAILABLE' })
  }
  wrappers.sort((a, b) => cp(`${a.fixture_id}|${a.artifact_role}`, `${b.fixture_id}|${b.artifact_role}`))
  assert(same(wrappers, contract.authority_operation_fixture_wrapper_reference_traversal.rows) && wrappers.filter(row => row.canonical_schema_reference_classification === 'exact_semantic_schema_reference').every(row => row.exact_target_schema_version !== 'UNAVAILABLE'), 'wrapper_traversal')
  const artifacts = validateArtifacts(contract)
  const refs = validateManifest(contract)
  return { stores: stores.length, identities: identities.length, equalities: equalities.length, selectors: selectors.exact_count, wrappers: wrappers.length, artifacts, refs, nonSuffix: contract.authority_runtime_semantic_reference_field_registry.pinned_non_suffix_occurrence_count, manifest: contract.authority_runtime_semantic_manifest.exact_expected_count }
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r51.json'), 'utf8') === materializedR51Output, 'frozen_R51_exact')
assert(readFileSync(join(root, path), 'utf8') === materializedR52Output, 'exact_materialization')
const baseline = validate(materializedR52)
let attacks = 0
function attack(name, mutate) { const contract = structuredClone(materializedR52); mutate(contract); let rejected = false; try { validate(contract) } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
attack('fingerprint_codec_mismatch', contract => { contract.fingerprint_schemas.presentation_challenge.field_encoding_ref = 'canonical_field_encoding' })
attack('fingerprint_codec_audit_laundered', contract => { contract.authority_operation_fingerprint_codec_audit.exact_rows.shift() })
attack('proof_codec_changed_to_json', contract => { contract.proof_signed_preimages.issuer.canonical_encoding_ref = 'canonical_json_utf8_encoding' })
attack('issuer_nonce_exact_mismatch', contract => { contract.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.nonce += '_changed' })
attack('issuer_signature_replaced_with_json_signature_shape', contract => { contract.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.signature_b64url = Buffer.alloc(64).toString('base64url') })
attack('result_blob_store_omitted', contract => { contract.authority_operation_complete_persisted_store_universe.exact_rows = contract.authority_operation_complete_persisted_store_universe.exact_rows.filter(row => row.store_path !== 'operation_result_blob_store') })
attack('principal_store_omitted_from_graph', contract => { contract.authority_operation_normative_durable_store_authority_graph.exact_rows = contract.authority_operation_normative_durable_store_authority_graph.exact_rows.filter(row => row.store_path !== 'principal_authority_artifact_stores.live_principal_assertions') })
attack('replay_lookup_variant_omitted', contract => { contract.authority_operation_complete_persisted_store_universe.exact_rows = contract.authority_operation_complete_persisted_store_universe.exact_rows.filter(row => !(row.store_path === 'authority_operation_pre_materialized_replay_lookup_store' && row.row_schema_variant === 'held')) })
attack('identity_formula_removed', contract => { const row = contract.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index[0]; delete contract.authority_operation_complete_persisted_identity_authorities[row.exact_authority_ref.split('.').at(-1)] })
attack('meta_selector_candidate', contract => { const row = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.exact_one_resolution_required); row.exact_target_cases[0].target_schema_ref = 'authority_operation_complete_active_persisted_schema_universe' })
attack('placeholder_selector_variant', contract => { const row = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.exact_one_resolution_required); row.exact_target_cases[0].target_schema_variant = 'DISCRIMINATED_BY_OPERATION' })
attack('cross_operation_request_substitution', contract => { const row = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.source_field === 'request_bytes_ref' && item.exact_one_resolution_required); row.exact_target_cases[0].target_schema_ref = 'case_session_authority_operation_protocols.operations.expire_server_session_principal.request_schema'; row.exact_target_cases[0].target_schema_version = contract.case_session_authority_operation_protocols.operations.expire_server_session_principal.request_schema.schema_version })
attack('selector_deleted', contract => { const row = contract.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.exact_one_resolution_required); delete contract.authority_operation_internal_reference_target_selectors.rows[row.selector_ref.split('.').at(-1)] })
attack('wrapper_schema_ref_zero_match', contract => { contract.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.stored_row_value.canonical_schema_ref = 'missing.schema' })
attack('wrapper_stored_value_not_validated', contract => { contract.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.stored_row_value.artifact_ref = '0'.repeat(64) })
attack('non_suffix_then_omitted', contract => { const rows = contract.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows; const index = rows.findIndex(row => row.field_name === 'then'); rows.splice(index, 1) })
attack('non_suffix_source_omitted', contract => { const rows = contract.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows; const index = rows.findIndex(row => row.field_name === 'source'); rows.splice(index, 1) })
attack('non_suffix_vocabulary_weakened', contract => { contract.semantic_reference_field_specification.exact_non_suffix_semantic_fields = contract.semantic_reference_field_specification.exact_non_suffix_semantic_fields.filter(field => field !== 'then') })
attack('manifest_source_mutation', contract => { contract.schema_change_manifest.runtime_database_ui_deployment_or_external_action = 'open' })

console.log(`ok: R52 exact; ${attacks} attacks; ${baseline.stores} durable store shapes; ${baseline.identities} identities; ${baseline.equalities} typed equalities; ${baseline.selectors} concrete selectors; ${baseline.wrappers} stored wrappers; ${baseline.artifacts} selected artifacts; ${baseline.refs} semantic refs; ${baseline.nonSuffix} pinned non-suffix refs; ${baseline.manifest} manifest rows; 205/205 fingerprint field codecs JSON; 10/10 other fingerprint codecs JSON; 4/4 proof signatures exact field encoding`)
