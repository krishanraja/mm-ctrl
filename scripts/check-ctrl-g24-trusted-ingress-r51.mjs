import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR50Output } from './materialize-ctrl-g24-trusted-ingress-r50.mjs'
import { materializedR51, materializedR51Output } from './materialize-ctrl-g24-trusted-ingress-r51.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd(), path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r51.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const assert = (condition, label) => { if (!condition) throw new Error(label) }
const schemaAt = (c, path, variant = 'UNAVAILABLE') => { const schema = get(c, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }

// Independent implementation of the byte codec. This does not use the materializer encoder.
const uint32 = number => { const output = Buffer.alloc(4); output.writeUInt32BE(number); return output }
const uint64 = number => { assert(Number.isSafeInteger(number) && number >= 0, 'field_u64'); const output = Buffer.alloc(8); output.writeBigUInt64BE(BigInt(number)); return output }
const encodeString = value => { const bytes = Buffer.from(value, 'utf8'); return Buffer.concat([uint32(bytes.length), bytes]) }
function encodeValue(spec, value) {
  if (value === null) return Buffer.from([0])
  if (spec?.type === 'nullable') return Buffer.concat([Buffer.from([1]), encodeValue(spec.value_schema ?? { type: typeof value === 'string' ? 'identifier' : 'safe_nonnegative_integer' }, value)])
  if (spec?.type === 'sha256') { assert(typeof value === 'string' && /^[0-9a-f]{64}$/.test(value), 'field_sha256'); return Buffer.from(value, 'hex') }
  if (spec?.type === 'base64url_without_padding') { assert(typeof value === 'string' && !value.includes('='), 'field_base64url'); const bytes = Buffer.from(value, 'base64url'); assert(bytes.toString('base64url') === value, 'field_base64url_canonical'); return Buffer.concat([uint64(bytes.length), bytes]) }
  if (spec?.type === 'boolean' || typeof value === 'boolean') return Buffer.from([value ? 1 : 0])
  if (['integer', 'positive_integer', 'safe_nonnegative_integer', 'nonnegative_integer'].includes(spec?.type)) return uint64(value)
  if (spec?.type === 'finite_nonnegative_number') { assert(Number.isFinite(value) && value >= 0 && !Object.is(value, -0), 'field_number'); return encodeString(JSON.stringify(value)) }
  if (Array.isArray(value)) return Buffer.concat([uint64(value.length), ...value.map(item => encodeValue(spec.items, item))])
  if (typeof value === 'string') return encodeString(value)
  throw new Error(`field_unencodable:${spec?.type ?? typeof value}`)
}
function encodeSigned(c, family, proof) {
  const rule = c.proof_signed_preimages[family], schema = schemaAt(c, family === 'issuer' ? 'case_session_issuer_capability_proof_schema' : 'case_session_evaluator_capability_proof_schema')
  assert(rule.canonical_encoding_ref === 'canonical_field_encoding', `signed_encoding_ref:${family}`)
  return Buffer.concat(rule.field_order.map(field => encodeValue(field === 'domain_ascii' ? { const: rule.domain_ascii } : schema.properties[field], field === 'domain_ascii' ? rule.domain_ascii : proof[field])))
}
function fingerprint(c, schema, row) { const rule = get(c, schema.fingerprint_ref); assert(Array.isArray(rule?.preimage_order), `fingerprint_rule:${schema.fingerprint_ref}`); const preimage = {}; for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]; return hash(preimage) }

function collectStoreUniverse(c) {
  const canonical = c.authority_operation_complete_active_persisted_schema_universe.content_addressed_stores.map(row => ({ store_kind: 'canonical_content_store', store_path: row.store_path, store_schema_version: get(c, row.store_path)?.schema_version ?? row.wrapper_schema_version, payload_schema_ref: row.payload_schema_ref, payload_schema_version: get(c, row.payload_schema_ref)?.schema_version ?? 'DISCRIMINATED_VARIANT_SCHEMA', wrapper_schema_ref: row.wrapper_schema_ref, wrapper_schema_version: row.wrapper_schema_version }))
  const opaque = ['target', 'proof_primary', 'proof_issuer', 'proof_evaluator', 'proof_bundle'].map(name => { const store = c.authority_opaque_raw_input_stores[name]; return { store_kind: 'opaque_raw_input_store', store_path: `authority_opaque_raw_input_stores.${name}`, store_schema_version: store.schema_version, payload_schema_ref: 'OPAQUE_RAW_BYTES', payload_schema_version: 'OPAQUE_RAW_BYTES', wrapper_schema_ref: `authority_opaque_raw_input_stores.${name}.row_schema`, wrapper_schema_version: store.row_schema.schema_version } })
  const nonce = { store_kind: 'proof_nonce_persistence', store_path: 'proof_nonce_receipt_store', store_schema_version: c.proof_nonce_receipt_store.schema_version, payload_schema_ref: 'proof_nonce_receipt_payload_schema', payload_schema_version: c.proof_nonce_receipt_payload_schema.schema_version, wrapper_schema_ref: 'proof_nonce_ledger.row_schema', wrapper_schema_version: c.proof_nonce_ledger.row_schema.schema_version }
  const durable = [...Object.keys(c.authority_operation_registry.row_union.variants).map(variant => ({ store_kind: 'registry_row_variant', store_path: 'authority_operation_registry', row_schema_ref: 'authority_operation_registry.row_union', row_schema_variant: variant, row_schema_version: c.authority_operation_registry.row_union.variants[variant].schema_version })), ...Object.keys(c.authority_operation_hold_store.row_union.variants).map(variant => ({ store_kind: 'hold_row_variant', store_path: 'authority_operation_hold_store', row_schema_ref: 'authority_operation_hold_store.row_union', row_schema_variant: variant, row_schema_version: c.authority_operation_hold_store.row_union.variants[variant].schema_version })), ...Object.keys(c.authority_operation_receipt_store.row_union.variants).map(variant => ({ store_kind: 'receipt_row_variant', store_path: 'authority_operation_receipt_store', row_schema_ref: 'authority_operation_receipt_store.row_union', row_schema_variant: variant, row_schema_version: c.authority_operation_receipt_store.row_union.variants[variant].schema_version })), ...c.authority_operation_complete_active_persisted_schema_universe.committed_target_schema_refs.map(row_schema_ref => ({ store_kind: 'committed_target_row', store_path: row_schema_ref.replace('authoritative_row_schemas.', ''), row_schema_ref, row_schema_variant: 'UNAVAILABLE', row_schema_version: get(c, row_schema_ref).schema_version }))]
  return [...canonical, ...opaque, nonce, ...durable].sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
}

function validateContentArtifact(c, fixtureId, role, artifact) {
  if (artifact.fixture_wrapper_variant !== 'content_addressed') return
  const row = artifact.stored_row_value
  if (Object.hasOwn(row, 'canonical_schema_ref')) {
    assert(row.canonical_schema_ref === artifact.payload_schema_ref && get(c, row.canonical_schema_ref) !== undefined, `wrapper_schema_ref:${fixtureId}:${role}`)
    const schema = schemaAt(c, artifact.payload_schema_ref, artifact.payload_schema_variant ?? 'UNAVAILABLE'), bytes = canonicalR44(artifact.payload_value), bytesHash = sha(Buffer.from(bytes))
    assert(artifact.payload_canonical_bytes_utf8 === bytes && artifact.payload_bytes_sha256 === bytesHash && artifact.ref === bytesHash, `payload_bytes:${fixtureId}:${role}`)
    assert(row.artifact_ref === bytesHash && row.canonical_bytes_sha256 === bytesHash && Buffer.from(row.canonical_bytes_b64url, 'base64url').toString('utf8') === bytes, `wrapper_bytes:${fixtureId}:${role}`)
    assert(row.parsed_content_fingerprint === artifact.payload_fingerprint && row.artifact_fingerprint === fingerprint(c, get(c, c.authority_operation_complete_active_persisted_schema_universe.content_addressed_stores.find(store => store.payload_schema_ref === artifact.payload_schema_ref).wrapper_schema_ref), row), `wrapper_fingerprint:${fixtureId}:${role}`)
    assert(schema?.schema_version === artifact.payload_schema_version, `wrapper_payload_version:${fixtureId}:${role}`)
  } else if (Object.hasOwn(row, 'opaque_bytes_sha256')) {
    const bytes = Buffer.from(row.opaque_bytes_b64url, 'base64url')
    assert(row.artifact_ref === row.opaque_bytes_sha256 && row.opaque_bytes_sha256 === sha(bytes) && row.opaque_bytes_length === bytes.length, `opaque_wrapper:${fixtureId}:${role}`)
    assert(row.artifact_fingerprint === fingerprint(c, schemaAt(c, `authority_opaque_raw_input_stores.${role === 'raw_bundle' ? 'proof_bundle' : role === 'raw_evaluator_proof' ? 'proof_evaluator' : 'target'}.row_schema`), row), `opaque_wrapper_fp:${fixtureId}:${role}`)
  } else {
    const bytes = canonicalR44(artifact.payload_value), bytesHash = sha(Buffer.from(bytes))
    assert(artifact.payload_bytes_sha256 === bytesHash && artifact.ref === bytesHash && row.nonce_receipt_ref === bytesHash, `nonce_wrapper:${fixtureId}:${role}`)
    assert(row.nonce_receipt_fingerprint === fingerprint(c, c.proof_nonce_ledger.row_schema, row), `nonce_wrapper_fp:${fixtureId}:${role}`)
  }
}

function validateManifest(c) {
  const registry = c.authority_runtime_semantic_reference_field_registry, paths = registry.exact_source_paths, snapshot = Object.fromEntries(paths.map(path => [path, ownedSnapshotR44(get(c, path))])), snapshotSha = hash({ domain_ascii: 'CTRL-G24-R51-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_paths: paths, values: snapshot })
  assert(snapshotSha === registry.source_snapshot_sha256 && snapshotSha === c.authority_runtime_semantic_manifest.source_snapshot_sha256, 'manifest_snapshot')
  const hc = c.authority_runtime_semantic_manifest_hash_contract
  for (const row of c.authority_runtime_semantic_manifest.rows) assert(row.authority_content_sha256 === hash({ domain_ascii: hc.content_domain_ascii, manifest_hash_version: hc.manifest_hash_version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(c, row.authority_path)) }), `manifest_content:${row.authority_path}`)
  const without = { ...c.authority_runtime_semantic_manifest }; delete without.manifest_envelope_seal_sha256
  assert(c.authority_runtime_semantic_manifest.manifest_graph_sha256 === hash({ domain_ascii: hc.graph_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_rows: c.authority_runtime_semantic_manifest.rows }), 'manifest_graph')
  assert(c.authority_runtime_semantic_manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hc.envelope_domain_ascii, manifest_hash_version: hc.manifest_hash_version, manifest_without_envelope_seal: without }), 'manifest_seal')
}

function validate(c) {
  const codec = c.canonical_field_encoding
  assert(codec.schema_version === 'ctrl.g24.canonical-field-encoding.r51.v1' && codec.byte_order === 'big_endian' && codec.object_field_names_in_bytes === false && codec.sha256 === 'exact_32_raw_bytes_from_lowercase_hex', 'codec_authority')
  const fixture = c.authority_operation_committed_receipt_identity_fixtures, roles = fixture.artifact_store_by_role, evidence = c.authority_operation_signature_fixture_authority.evidence
  for (const family of ['issuer', 'evaluator']) {
    const proof = roles[`${family}_proof`], key = roles[`${family}_verifier_key`], bytes = encodeSigned(c, family, proof.payload_value), record = evidence.find(row => row.proof_role === family), signature = Buffer.from(proof.payload_value.signature_b64url, 'base64url'), publicKey = createPublicKey({ key: Buffer.from(key.payload_value.public_key_spki_der_b64url, 'base64url'), format: 'der', type: 'spki' })
    assert(record && record.encoding_ref === 'canonical_field_encoding' && record.signed_preimage_bytes_b64url === bytes.toString('base64url') && record.signed_preimage_bytes_length === bytes.length && record.signed_preimage_bytes_sha256 === sha(bytes), `signed_evidence:${family}`)
    assert(signature.length === 64 && verify(null, bytes, publicKey, signature), `signature_field_encoding:${family}`)
    const rule = c.proof_signed_preimages[family], json = {}; for (const field of rule.field_order) json[field] = field === 'domain_ascii' ? rule.domain_ascii : proof.payload_value[field]
    assert(!verify(null, Buffer.from(canonicalR44(json), 'utf8'), publicKey, signature), `signature_json_must_fail:${family}`)
  }
  const universe = collectStoreUniverse(c), declared = c.authority_operation_complete_persisted_store_universe
  assert(same(universe, declared.exact_rows) && declared.exact_store_shape_count === universe.length && declared.opaque_raw_store_count === 5 && declared.proof_nonce_store_count === 1, 'store_universe')
  const identityIndex = c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index, kinds = new Set(identityIndex.map(row => row.identity_kind))
  assert(kinds.size === identityIndex.length && identityIndex.length === c.authority_operation_artifact_fingerprint_derivation_authority.exact_identity_kind_count, 'identity_index')
  for (const row of identityIndex) { const authority = get(c, row.exact_authority_ref), fixture = authority?.executable_formula_fixture; assert(authority && fixture, `identity_authority:${row.identity_kind}`); if (authority.formula.formula_class === 'raw_sha256_bytes') assert(fixture.expected_identity === sha(Buffer.from(fixture.input_b64url, 'base64url')), `identity_raw:${row.identity_kind}`); else assert(fixture.expected_identity === hash(fixture.exact_preimage) && get(c, authority.formula.authority_ref), `identity_preimage:${row.identity_kind}`) }
  assert(universe.filter(row => row.store_kind === 'opaque_raw_input_store').every(row => kinds.has(`opaque_content_address:${row.wrapper_schema_ref}`) && kinds.has(`wrapper_fingerprint:${row.wrapper_schema_ref}`)), 'opaque_identity_index')
  assert(kinds.has('wrapper_fingerprint:proof_nonce_receipt_store'), 'nonce_wrapper_identity')
  const allFixtures = [...c.authority_operation_replay_restart_fixtures.fixtures, fixture], traversal = []
  for (const item of allFixtures) for (const [role, artifact] of Object.entries(item.artifact_store_by_role)) { validateContentArtifact(c, item.fixture_id, role, artifact); if (artifact.fixture_wrapper_variant === 'content_addressed') { const literal = artifact.stored_row_value.canonical_schema_ref ?? artifact.payload_schema_ref, schema = schemaAt(c, artifact.payload_schema_ref, artifact.payload_schema_variant ?? 'UNAVAILABLE'); traversal.push({ fixture_id: item.fixture_id, artifact_role: role, wrapper_schema_version: artifact.selected_wrapper_schema_version ?? artifact.stored_row_schema_version ?? artifact.schema_version ?? 'UNAVAILABLE', canonical_schema_ref: literal, exact_target_schema_version: get(c, literal)?.schema_version ?? schema?.schema_version ?? 'UNAVAILABLE', artifact_ref: artifact.stored_row_value.artifact_ref ?? artifact.ref, payload_bytes_sha256: artifact.payload_bytes_sha256, parsed_content_fingerprint: artifact.stored_row_value.parsed_content_fingerprint ?? artifact.payload_fingerprint, payload_fingerprint: artifact.payload_fingerprint, exact_store_schema_version: artifact.selected_store_authority_schema_version ?? artifact.selected_store_schema_version ?? artifact.schema_version ?? 'UNAVAILABLE' }) } }
  traversal.sort((a, b) => cp(`${a.fixture_id}|${a.artifact_role}`, `${b.fixture_id}|${b.artifact_role}`))
  assert(same(traversal, c.authority_operation_fixture_wrapper_reference_traversal.rows), 'wrapper_traversal')
  for (const row of traversal.filter(item => item.canonical_schema_ref !== 'opaque_bounded_bytes')) assert(get(c, row.canonical_schema_ref) !== undefined && row.exact_target_schema_version !== 'UNAVAILABLE', `wrapper_schema_target:${row.fixture_id}:${row.artifact_role}`)
  const equalities = c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows, discriminators = c.authority_operation_internal_reference_target_discriminators
  assert(equalities.length === c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows.length && equalities.filter(row => row.exact_one_resolution_required && row.target_schema_ref_or_UNAVAILABLE === 'UNAVAILABLE').length === 0 && c.authority_operation_complete_schema_cross_artifact_equality_registry.internal_exact_one_unavailable_target_count === 0, 'internal_target_closure')
  for (const row of equalities) {
    const schema = schemaAt(c, row.source_schema_ref, row.source_schema_variant); assert(schema?.properties?.[row.source_field], `equality_source:${row.source_schema_ref}:${row.source_field}`)
    if (row.exact_one_resolution_required && row.target_schema_ref_or_UNAVAILABLE === 'DISCRIMINATED_BY_CLOSED_R51_TARGET_TABLE') {
      const discriminator = get(c, row.closed_target_discriminator_ref_or_UNAVAILABLE)
      assert(discriminator && discriminator.source_schema_ref === row.source_schema_ref && discriminator.source_schema_variant === row.source_schema_variant && discriminator.source_field === row.source_field && discriminator.exact_candidate_targets.length > 0 && row.target_schema_version_or_UNAVAILABLE === discriminator.schema_version, `equality_discriminator:${row.source_schema_ref}:${row.source_field}`)
      if (discriminator.operation_name !== 'ALL') { const operation = c.case_session_authority_operation_protocols.operations[discriminator.operation_name]; assert(operation && discriminator.target_store === (operation.target_store ?? operation.request_schema.properties.target_store.const), `equality_discriminator_store:${row.source_schema_ref}:${row.source_field}`) }
      for (const candidate of discriminator.exact_candidate_targets) { const target = candidate.target_schema_variant === 'UNAVAILABLE' ? get(c, candidate.target_schema_ref) : candidate.target_schema_variant.startsWith('DISCRIMINATED_BY_') ? get(c, candidate.target_schema_ref) : schemaAt(c, candidate.target_schema_ref, candidate.target_schema_variant); assert(target && candidate.target_schema_version === (target.schema_version ?? 'NESTED_VALUE'), `equality_discriminator_target:${row.source_schema_ref}:${row.source_field}`) }
    } else if (row.target_schema_ref_or_UNAVAILABLE !== 'UNAVAILABLE' && row.target_schema_ref_or_UNAVAILABLE !== 'DISCRIMINATED_BY_CLOSED_R51_TARGET_TABLE') {
      const target = row.target_schema_variant_or_UNAVAILABLE === 'UNAVAILABLE' || row.target_schema_variant_or_UNAVAILABLE.startsWith('DISCRIMINATED_BY_') ? get(c, row.target_schema_ref_or_UNAVAILABLE) : schemaAt(c, row.target_schema_ref_or_UNAVAILABLE, row.target_schema_variant_or_UNAVAILABLE)
      assert(target && row.target_schema_version_or_UNAVAILABLE === (target.schema_version ?? 'NESTED_VALUE'), `equality_target:${row.source_schema_ref}:${row.source_field}`)
    }
  }
  assert(Object.keys(discriminators.rows).length === discriminators.exact_count, 'discriminator_count')
  const bundle = roles.bundle.payload_value, read = roles.authority_read_set.payload_value, receipt = roles.receipt.canonical_row_value, registry = roles.registry.canonical_row_value, replay = roles.replay_payload.payload_value
  for (const family of ['issuer', 'evaluator']) { const proof = roles[`${family}_proof`], nonce = roles[`${family}_nonce_receipt`]; assert(bundle[`${family}_proof_ref`] === proof.ref && bundle[`${family}_proof_bytes_sha256`] === proof.bytes_sha256 && bundle[`${family}_proof_fingerprint`] === proof.fingerprint, `bundle_proof:${family}`); assert(read[`${family}_proof_ref`] === proof.ref && read[`${family}_nonce_receipt_ref`] === nonce.ref && receipt[`${family}_proof_ref`] === proof.ref && receipt[`${family}_nonce_receipt_ref`] === nonce.ref, `authority_lineage:${family}`) }
  assert(registry.result_ref === roles.result.ref && registry.receipt_ref === receipt.receipt_ref && registry.historical_response_ref === roles.history.ref && replay.committed_registry_row_ref === registry.registry_row_ref && roles.replay_envelope.payload_value.payload_ref === roles.replay_payload.ref, 'restart_lineage')
  validateManifest(c)
  return { stores: universe.length, identities: identityIndex.length, wrappers: traversal.length, equalities: equalities.length, discriminators: discriminators.exact_count, semantic: c.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count, manifest: c.authority_runtime_semantic_manifest.exact_expected_count }
}

assert(readFileSync(join(root, 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r50.json'), 'utf8') === materializedR50Output, 'frozen_R50_exact')
assert(readFileSync(join(root, path), 'utf8') === materializedR51Output, 'exact_materialization')
const baseline = validate(materializedR51)
let attacks = 0
function attack(name, mutate) { const c = structuredClone(materializedR51); mutate(c); let rejected = false; try { validate(c) } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
attack('json_signature_substituted', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.signature_b64url = Buffer.alloc(64).toString('base64url') })
attack('field_encoding_weakened', c => { c.canonical_field_encoding.sha256 = 'uint32_utf8_hex' })
attack('signed_preimage_hash_changed', c => { c.authority_operation_signature_fixture_authority.evidence[0].signed_preimage_bytes_sha256 = '0'.repeat(64) })
attack('opaque_store_removed', c => { c.authority_operation_complete_persisted_store_universe.exact_rows = c.authority_operation_complete_persisted_store_universe.exact_rows.filter(row => row.store_path !== 'authority_opaque_raw_input_stores.proof_bundle') })
attack('opaque_identity_removed', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index = c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.filter(row => !row.identity_kind.includes('authority_opaque_raw_input_stores.proof_bundle')) })
attack('nonce_wrapper_identity_removed', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index = c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.filter(row => row.identity_kind !== 'wrapper_fingerprint:proof_nonce_receipt_store') })
attack('wrapper_schema_literal_zero_match', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.stored_row_value.canonical_schema_ref = 'missing.schema' })
attack('wrapper_artifact_ref_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.stored_row_value.artifact_ref = '0'.repeat(64) })
attack('wrapper_parsed_fingerprint_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.stored_row_value.parsed_content_fingerprint = '0'.repeat(64) })
attack('internal_target_unavailable', c => { const row = c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.exact_one_resolution_required); row.target_schema_ref_or_UNAVAILABLE = 'UNAVAILABLE' })
attack('discriminator_deleted', c => { const row = c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.closed_target_discriminator_ref_or_UNAVAILABLE !== 'UNAVAILABLE'); delete c.authority_operation_internal_reference_target_discriminators.rows[row.closed_target_discriminator_ref_or_UNAVAILABLE.split('.').at(-1)] })
attack('discriminator_target_version_stale', c => { const row = Object.values(c.authority_operation_internal_reference_target_discriminators.rows)[0]; row.exact_candidate_targets[0].target_schema_version = 'stale.v1' })
attack('bundle_proof_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.bundle.payload_value.issuer_proof_ref = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.evaluator_proof.ref })
attack('readset_nonce_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.authority_read_set.payload_value.issuer_nonce_receipt_ref = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.evaluator_nonce_receipt.ref })
attack('registry_history_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.registry.canonical_row_value.historical_response_ref = '0'.repeat(64) })
attack('manifest_source_mutation', c => { c.schema_change_manifest.runtime_database_ui_deployment_or_external_action = 'open' })

console.log(`ok: R51 exact; ${attacks} attacks; ${baseline.stores} store shapes; ${baseline.identities} identities; ${baseline.wrappers} stored wrappers; ${baseline.equalities} typed equalities; ${baseline.discriminators} internal discriminators; ${baseline.semantic} semantic refs; ${baseline.manifest} manifest rows; 2/2 field-encoded Ed25519 signatures`)
