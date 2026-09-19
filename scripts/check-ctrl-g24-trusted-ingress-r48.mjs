import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR48, materializedR48Output } from './materialize-ctrl-g24-trusted-ingress-r48.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd(), file = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r48.json'
const bytes = readFileSync(join(root, file), 'utf8'), candidate = JSON.parse(bytes)
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
function assert(condition, code) { if (!condition) throw new Error(code) }
function schemaAt(c, path, variant = 'UNAVAILABLE') { const schema = get(c, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
function fingerprint(c, schema, row) { const rule = get(c, schema.fingerprint_ref), preimage = {}; assert(rule?.preimage_order, `fingerprint_rule:${schema.fingerprint_ref}`); for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]; return hash(preimage) }
function artifactSchema(c, artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? schemaAt(c, artifact.payload_schema_ref, artifact.payload_schema_variant) : schemaAt(c, artifact.schema_ref, artifact.schema_variant) }
function artifactValue(artifact) { return artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_value : artifact.canonical_row_value }
function identities(role, artifact) {
  const rows = []
  if (artifact.fixture_wrapper_variant === 'content_addressed') rows.push({ role, identity_kind: 'content_address', ref: artifact.ref, bytes_sha256: artifact.bytes_sha256, fingerprint: artifact.fingerprint })
  else { rows.push({ role, identity_kind: 'row_content_address', ref: artifact.content_addressed_artifact_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }); if (role === 'registry') rows.push({ role, identity_kind: 'registry_row_ref', ref: artifact.canonical_row_value.registry_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }); if (role === 'hold') rows.push({ role, identity_kind: 'hold_row_ref', ref: artifact.canonical_row_value.hold_row_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }); if (role === 'committed_target_row') rows.push({ role, identity_kind: 'row_version_ref', ref: artifact.canonical_row_value.row_version_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }); if (role === 'receipt') { rows.push({ role, identity_kind: 'receipt_precommit_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.canonical_row_value.receipt_precommit_fingerprint }); rows.push({ role, identity_kind: 'receipt_final_ref', ref: artifact.canonical_row_value.receipt_ref, bytes_sha256: artifact.canonical_row_bytes_sha256, fingerprint: artifact.recorded_fingerprint }) } }
  return rows
}
function companions(sourceRole, key, value) { if (key === 'response_payload_ref') return ['response_payload_bytes_sha256', 'result_fingerprint']; if (key === 'request_artifact_ref') return ['request_artifact_sha256', 'request_fingerprint']; if (key === 'result_ref') return ['result_bytes_sha256', 'result_fingerprint']; if (key === 'hold_result_ref') return ['hold_result_bytes_sha256', 'hold_result_fingerprint']; if (key === 'hold_row_ref') return [null, sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint']; if (key === 'receipt_ref') return [null, sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint']; if (key === 'committed_target_row_ref') return ['committed_target_row_bytes_sha256', 'committed_target_row_fingerprint']; if (key === 'target_row_version_ref') return [null, 'target_row_fingerprint']; if (key === 'held_registry_row_ref') return [null, 'held_registry_row_fingerprint']; if (key === 'committed_registry_row_ref') return [null, 'committed_registry_row_fingerprint']; const suffix = key.endsWith('_or_unavailable') ? '_or_unavailable' : '', base = key.replace(/_ref(_or_unavailable)?$/, ''); return [[`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(field => Object.hasOwn(value, field)) ?? null, `${base}_fingerprint${suffix}`] }
function roleStores(c) { return [...c.authority_operation_replay_restart_fixtures.fixtures.map(f => ({ fixture_id: f.fixture_id, store: f.artifact_store_by_role })), { fixture_id: c.authority_operation_committed_receipt_identity_fixtures.fixture_id, store: c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role }] }
function independentlyDeriveLineage(c) {
  const resolution = [], self = [], nonartifact = [], refToken = key => /(^|_)(ref|refs)($|_)/.test(key)
  for (const branch of roleStores(c)) {
    const targets = Object.entries(branch.store).flatMap(([role, artifact]) => identities(role, artifact))
    for (const [sourceRole, artifact] of Object.entries(branch.store)) {
      const schema = artifactSchema(c, artifact), value = artifactValue(artifact)
      if (!schema?.exact_keys || !value || typeof value !== 'object') continue
      assert(same(Object.keys(value).sort(cp), [...schema.exact_keys].sort(cp)), `selected_schema_keys:${branch.fixture_id}:${sourceRole}`)
      for (const field of schema.exact_keys.filter(refToken)) {
        const reference = value[field]
        if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonartifact.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_field: field, reference_literal: reference ?? null, classification: 'closed_null_or_unavailable_sentinel' }); continue }
        let matches = targets.filter(target => target.ref === reference), nonSelf = matches.filter(target => target.role !== sourceRole); if (nonSelf.length) matches = nonSelf
        if (!nonSelf.length && matches.length) { self.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
        if (!matches.length) { nonartifact.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_field: field, reference_literal: reference, classification: field.includes('schema_ref') ? 'closed_semantic_schema_reference' : 'closed_runtime_or_external_authority_identity' }); continue }
        if (matches.length > 1 && matches.every(target => target.role === 'receipt')) matches = matches.filter(target => target.identity_kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
        assert(matches.length === 1, `exact_one:${branch.fixture_id}:${sourceRole}:${field}:${matches.length}`)
        const target = matches[0], [bytesField, fpField] = companions(sourceRole, field, value), actualBytes = bytesField && Object.hasOwn(value, bytesField) ? value[bytesField] : 'UNAVAILABLE', actualFp = fpField && Object.hasOwn(value, fpField) ? value[fpField] : 'UNAVAILABLE'
        assert(actualBytes === 'UNAVAILABLE' || actualBytes === target.bytes_sha256, `companion_bytes:${branch.fixture_id}:${sourceRole}:${field}`)
        assert(actualFp === 'UNAVAILABLE' || actualFp === target.fingerprint, `companion_fp:${branch.fixture_id}:${sourceRole}:${field}`)
        resolution.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, source_schema_variant: artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant, source_field: field, target_role: target.role, target_identity_kind: target.identity_kind, reference, companion_bytes_field_or_UNAVAILABLE: actualBytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : bytesField, companion_bytes_sha256_or_UNAVAILABLE: actualBytes, companion_fingerprint_field_or_UNAVAILABLE: actualFp === 'UNAVAILABLE' ? 'UNAVAILABLE' : fpField, companion_fingerprint_or_UNAVAILABLE: actualFp, exact_match_count: 1 })
      }
    }
  }
  const sort = rows => rows.sort((a, b) => cp(`${a.fixture_id}|${a.source_role}|${a.source_field}`, `${b.fixture_id}|${b.source_role}|${b.source_field}`)); sort(resolution); sort(self); sort(nonartifact)
  const correlations = resolution.flatMap((row, index) => ['reference', 'companion_bytes_or_explicit_unavailable', 'companion_fingerprint_or_explicit_unavailable'].map(kind => ({ correlation_id: `r48:${String(index + 1).padStart(4, '0')}:${kind}`, ...row, correlation_kind: kind })))
  return { resolution, self, nonartifact, correlations, snapshot: hash(roleStores(c)) }
}
function validateArtifacts(c) {
  for (const branch of roleStores(c)) for (const [role, artifact] of Object.entries(branch.store)) {
    if (artifact.fixture_wrapper_variant === 'content_addressed') {
      const payloadBytes = artifact.payload_schema_ref === 'opaque_bounded_bytes' ? artifact.payload_canonical_bytes_utf8 : canonicalR44(artifact.payload_value), payloadHash = sha(Buffer.from(payloadBytes, 'utf8'))
      assert(payloadBytes === artifact.payload_canonical_bytes_utf8 && payloadHash === artifact.ref && payloadHash === artifact.bytes_sha256, `content_address:${branch.fixture_id}:${role}`)
      assert(artifact.stored_row_value.artifact_ref === artifact.ref || artifact.stored_row_value.nonce_receipt_ref === artifact.ref, `wrapper_ref:${branch.fixture_id}:${role}`)
      const rowSchema = findSchemaByVersion(c, artifact.selected_wrapper_schema_version)
      assert(fingerprint(c, rowSchema, artifact.stored_row_value) === artifact.stored_row_fingerprint, `wrapper_fp:${branch.fixture_id}:${role}`)
    } else {
      const rowBytes = canonicalR44(artifact.canonical_row_value), rowHash = sha(Buffer.from(rowBytes, 'utf8')), schema = schemaAt(c, artifact.schema_ref, artifact.schema_variant)
      assert(rowBytes === artifact.canonical_row_bytes_utf8 && rowHash === artifact.content_addressed_artifact_ref, `row_address:${branch.fixture_id}:${role}`)
      assert(fingerprint(c, schema, artifact.canonical_row_value) === artifact.recorded_fingerprint, `row_fp:${branch.fixture_id}:${role}`)
    }
  }
}
function findSchemaByVersion(c, version) { const found = []; const walk = value => { if (!value || typeof value !== 'object') return; if (value.schema_version === version && value.type === 'object' && value.properties) found.push(value); for (const child of Object.values(value)) walk(child) }; walk(c); const unique = [...new Set(found)]; assert(unique.length === 1, `schema_version:${version}:${unique.length}`); return unique[0] }
function validateReceiptVariant(c, variant, store) {
  const authority = c.authority_operation_receipt_materialization_authority.variants[variant], schema = schemaAt(c, 'authority_operation_receipt_store.row_union', variant), receipt = store.receipt.canonical_row_value
  assert(authority.receipt_schema_version === schema.schema_version, `receipt_schema_version:${variant}`)
  assert(authority.exact_receipt_ref_preimage_field_count === schema.receipt_ref_preimage_fields.length, `receipt_field_count:${variant}`)
  assert(same(authority.receipt_ref_preimage_schema.ordered_fields, schema.receipt_ref_preimage_fields), `receipt_order:${variant}`)
  const preimage = { domain_ascii: authority.receipt_ref_preimage_schema.domain_ascii, schema_version: schema.schema_version, variant, ordered_fields: schema.receipt_ref_preimage_fields.map(field => ({ field, value: receipt[field] })) }
  assert(hash(preimage) === receipt.receipt_ref, `receipt_ref:${variant}`)
  const preRule = get(c, schema.receipt_precommit_fingerprint_ref), pre = {}; for (const field of preRule.preimage_order) pre[field] = field === 'domain_ascii' ? preRule.domain_ascii : receipt[field]
  assert(hash(pre) === receipt.receipt_precommit_fingerprint, `receipt_precommit:${variant}`)
  assert(fingerprint(c, schema, receipt) === receipt.receipt_fingerprint, `receipt_final:${variant}`)
  assert(receipt.result_bytes_ref === store.result.ref && receipt.result_bytes_sha256 === store.result.bytes_sha256 && receipt.result_fingerprint === store.result.fingerprint, `receipt_result:${variant}`)
  assert(store.result.payload_value.receipt_ref === receipt.receipt_ref && store.result.payload_value.receipt_precommit_fingerprint === receipt.receipt_precommit_fingerprint, `result_receipt:${variant}`)
}
function validateIdentityIndex(c) {
  const observed = new Map(), add = (identity_kind, exact_authority_ref, source) => { const prior = observed.get(identity_kind); assert(!prior || (prior.exact_authority_ref === exact_authority_ref && prior.source === source), `duplicate_identity:${identity_kind}`); observed.set(identity_kind, { identity_kind, exact_authority_ref, source }) }
  for (const branch of roleStores(c)) for (const [role, artifact] of Object.entries(branch.store)) {
    if (artifact.fixture_wrapper_variant === 'content_addressed') {
      const schemaKey = `${artifact.payload_schema_ref}:${artifact.payload_schema_variant}`
      add(`content_address:${schemaKey}`, 'canonical_json_utf8_encoding.sha256_canonical_payload_bytes_utf8', 'final_persisted_content_artifact_schema')
      add(`payload_fingerprint:${schemaKey}`, artifact.declared_payload_fingerprint_schema_ref, 'final_persisted_content_artifact_schema')
      add(`wrapper_fingerprint:${artifact.selected_wrapper_schema_version}`, artifact.declared_wrapper_fingerprint_schema_ref, 'final_persisted_wrapper_schema')
      if (artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema') add(`nonce_receipt_ref:${artifact.selected_wrapper_schema_version}`, 'proof_nonce_ledger.row_schema.nonce_receipt_ref_content_address_rule', 'final_persisted_nonce_receipt_schema')
    } else {
      const schemaKey = `${artifact.schema_ref}:${artifact.schema_variant}`
      add(`row_content_address:${schemaKey}`, 'canonical_json_utf8_encoding.sha256_canonical_authority_row_bytes_utf8', 'final_persisted_authority_row_schema')
      add(`row_fingerprint:${schemaKey}`, artifact.fingerprint_schema_ref, 'final_persisted_authority_row_schema')
      if (role === 'registry') add(`registry_row_ref:${artifact.schema_variant}`, `${artifact.schema_ref}.variants.${artifact.schema_variant}.row_ref_preimage`, 'final_persisted_registry_variant')
      if (role === 'hold') add(`hold_row_ref:${artifact.schema_variant}`, `${artifact.schema_ref}.variants.${artifact.schema_variant}.row_ref_preimage`, 'final_persisted_hold_variant')
      if (role === 'committed_target_row') add(`row_version_ref:${artifact.schema_ref}`, `authority_operation_committed_target_identity_authority.variants.${artifact.canonical_row_value.target_store ?? artifact.schema_ref.split('.').at(-1)}`, 'final_persisted_committed_target_schema')
      if (role === 'receipt') { const variant = artifact.schema_variant; add(`receipt_ref:${variant}`, `authority_operation_receipt_materialization_authority.variants.${variant}.receipt_ref_preimage_schema`, 'active_committed_receipt_union_variant'); add(`receipt_precommit_fingerprint:${variant}`, `authority_operation_receipt_materialization_authority.variants.${variant}.receipt_precommit_fingerprint_schema_ref`, 'active_committed_receipt_union_variant'); add(`receipt_final_fingerprint:${variant}`, `authority_operation_receipt_materialization_authority.variants.${variant}.receipt_final_fingerprint_schema_ref`, 'active_committed_receipt_union_variant') }
    }
  }
  const expected = [...observed.values()].sort((a, b) => cp(a.identity_kind, b.identity_kind))
  assert(same(expected, c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index), 'identity_index')
  assert(expected.length === c.authority_operation_artifact_fingerprint_derivation_authority.exact_identity_kind_count, 'identity_count')
}
function validate(c) {
  assert(c.schema_version === 'ctrl.g24.trusted-ingress.r48.effective.v1', 'schema_version')
  assert(c.supersedes.commit === 'b32c3170aa1d8b87a1b18afedfe78fcf33e0fd69', 'parent_commit')
  assert(same(c.materialization.strict_finalization_dag, ['finalize_every_fixture_and_artifact_issuance', 'capture_immutable_final_role_stores', 'regenerate_selected_traversal_self_nonartifact_resolution_and_correlations', 'finalize_all_non_derived_semantic_authorities', 'capture_final_semantic_source_snapshot', 'regenerate_reference_registry_and_owner_graph', 'derive_manifest_hashes_and_seal']), 'finalization_dag')
  const variants = Object.keys(c.authority_operation_receipt_store.row_union.variants).filter(name => name.endsWith('_committed'))
  assert(same(variants, c.authority_operation_receipt_materialization_authority.exact_active_committed_variants), 'receipt_variant_coverage')
  assert(same(variants.sort(cp), Object.keys(c.authority_operation_receipt_materialization_authority.variants).sort(cp)), 'receipt_variant_authority_exact_keys')
  assert(variants.length === 2 && c.authority_operation_receipt_materialization_authority.exact_variant_count === 2, 'receipt_variant_count')
  validateArtifacts(c)
  const normal = c.authority_operation_replay_restart_fixtures.fixtures.find(f => f.fixture_id === 'restart_committed').artifact_store_by_role
  validateReceiptVariant(c, 'ordinary_single_proof_committed', normal)
  const session = c.authority_operation_committed_receipt_identity_fixtures, sessionStore = session.artifact_store_by_role
  assert(session.route_status === 'isolated_schema_derived_identity_fixture_not_an_operational_branch_claim', 'session_scope_honesty')
  assert(session.exact_required_roles.length === 17 && same(session.exact_required_roles, Object.keys(sessionStore)), 'session_roles')
  validateReceiptVariant(c, 'session_dual_proof_committed', sessionStore)
  for (const role of ['issuer_proof', 'evaluator_proof', 'bundle', 'issuer_nonce_receipt', 'evaluator_nonce_receipt', 'authority_read_set', 'receipt_evidence', 'registry', 'history', 'replay_payload', 'replay_envelope']) assert(sessionStore[role], `session_role:${role}`)
  assert(sessionStore.receipt.canonical_row_value.issuer_nonce_receipt_ref === sessionStore.issuer_nonce_receipt.ref && sessionStore.receipt.canonical_row_value.evaluator_nonce_receipt_ref === sessionStore.evaluator_nonce_receipt.ref, 'session_nonce_pair')
  assert(sessionStore.registry.canonical_row_value.receipt_ref === sessionStore.receipt.canonical_row_value.receipt_ref && sessionStore.registry.canonical_row_value.receipt_fingerprint === sessionStore.receipt.recorded_fingerprint, 'session_registry_receipt')
  assert(sessionStore.replay_payload.payload_value.committed_registry_row_ref === sessionStore.registry.canonical_row_value.registry_row_ref && sessionStore.replay_envelope.payload_value.payload_ref === sessionStore.replay_payload.ref, 'session_replay_lineage')
  const derived = independentlyDeriveLineage(c), traversal = c.authority_operation_selected_reference_traversal_authority, resolution = c.authority_operation_artifact_resolution_authority, correlations = c.authority_operation_restart_correlation_authority
  assert(derived.snapshot === traversal.final_role_store_snapshot_sha256 && derived.snapshot === resolution.final_role_store_snapshot_sha256 && derived.snapshot === correlations.final_role_store_snapshot_sha256, 'role_store_snapshot')
  assert(same(derived.self, traversal.self_identity_allowlist) && same(derived.nonartifact, traversal.non_artifact_reference_allowlist), 'traversal_lists')
  assert(same(derived.resolution, resolution.rows) && derived.resolution.length === resolution.exact_resolution_count, 'resolution_rows')
  assert(same(derived.correlations, correlations.rows) && derived.correlations.length === correlations.exact_row_count, 'correlation_rows')
  assert(correlations.exact_row_count === resolution.exact_resolution_count * 3, 'correlation_factor')
  validateIdentityIndex(c)
  assert(c.authority_runtime_semantic_reference_field_registry.source_snapshot_sha256 === c.authority_runtime_semantic_dependency_owner_map.source_snapshot_sha256, 'semantic_snapshot_join')
  assert(c.authority_runtime_semantic_manifest.rows.length === c.authority_runtime_semantic_manifest.exact_paths.length && c.authority_runtime_semantic_manifest.exact_expected_count === c.authority_runtime_semantic_manifest.rows.length, 'manifest_count')
  assert(c.visible_surface_changes.length === 0 && c.external_actions_authorized.length === 0, 'scope_boundary')
}

assert(bytes === materializedR48Output, 'exact_materialization')
assert(bytes === `${JSON.stringify(ownedSnapshotR44(materializedR48), null, 2)}\n`, 'owned_snapshot_output')
validate(candidate)
const attacks = []
function attack(name, mutate) { const copy = structuredClone(candidate); mutate(copy); let rejected = false; try { validate(copy) } catch { rejected = true } assert(rejected, `attack_accepted:${name}`); attacks.push(name) }
const fixtureRole = (c, fixture, role) => c.authority_operation_replay_restart_fixtures.fixtures.find(f => f.fixture_id === fixture).artifact_store_by_role[role]
for (const role of ['committed_target_row', 'receipt', 'result', 'history', 'registry', 'replay_payload', 'replay_envelope']) attack(`cascade_${role}`, c => { const a = fixtureRole(c, 'restart_committed', role); if (a.ref) a.ref = 'f'.repeat(64); else if (a.content_addressed_artifact_ref) a.content_addressed_artifact_ref = 'f'.repeat(64) })
attack('stale_15_resolution_rows', c => { c.authority_operation_artifact_resolution_authority.rows.splice(0, 15); c.authority_operation_artifact_resolution_authority.exact_resolution_count -= 15 })
attack('stale_3_self_rows', c => { c.authority_operation_selected_reference_traversal_authority.self_identity_allowlist.splice(0, 3); c.authority_operation_selected_reference_traversal_authority.exact_self_reference_count -= 3 })
attack('stale_45_correlation_rows', c => { c.authority_operation_restart_correlation_authority.rows.splice(0, 45); c.authority_operation_restart_correlation_authority.exact_row_count -= 45 })
attack('missing_session_receipt_variant', c => { delete c.authority_operation_receipt_materialization_authority.variants.session_dual_proof_committed })
attack('wrong_session_preimage_count', c => { c.authority_operation_receipt_materialization_authority.variants.session_dual_proof_committed.exact_receipt_ref_preimage_field_count = 24 })
attack('missing_session_receipt_role', c => { delete c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.receipt })
attack('hardcoded_identity_inventory', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.pop() })
attack('post_lineage_role_store_mutation', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.request.ref = 'e'.repeat(64) })
attack('session_nonce_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.receipt.canonical_row_value.issuer_nonce_receipt_ref = 'd'.repeat(64) })
attack('session_replay_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.replay_payload.payload_value.committed_registry_row_ref = 'c'.repeat(64) })
attack('duplicate_receipt_identity_authority', c => { c.authority_operation_receipt_materialization_authority.variants.shadow = structuredClone(c.authority_operation_receipt_materialization_authority.variants.ordinary_single_proof_committed) })
attack('semantic_snapshot_mismatch', c => { c.authority_runtime_semantic_dependency_owner_map.source_snapshot_sha256 = 'b'.repeat(64) })

console.log(`ok: ${file} exact R48 materialization and final fixture-first lineage closure`)
console.log(`ok: ${attacks.length}/${attacks.length} focused attacks rejected`)
console.log(`ok: ${candidate.authority_operation_artifact_resolution_authority.exact_resolution_count} exact-one references, ${candidate.authority_operation_restart_correlation_authority.exact_row_count} correlations, ${candidate.authority_operation_artifact_fingerprint_derivation_authority.exact_identity_kind_count} derived identity kinds`)
console.log(`ok: 2/2 committed receipt variants and isolated 17-role session committed identity fixture verified`)
console.log(`ok: ${candidate.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count} semantic references and ${candidate.authority_runtime_semantic_manifest.exact_expected_count} manifested authorities`)
