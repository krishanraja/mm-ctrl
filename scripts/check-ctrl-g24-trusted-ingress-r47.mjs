import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { materializedR47, materializedR47Output, r47SemanticAuthorityPaths, r47SemanticSourcePaths } from './materialize-ctrl-g24-trusted-ingress-r47.mjs'
import { materializedR46 } from './materialize-ctrl-g24-trusted-ingress-r46.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd(), machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r47.json', failures = []
const read = path => readFileSync(join(root, path), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const same = (left, right) => canonicalR44(left) === canonicalR44(right)
const ok = (name, condition) => { if (!condition) throw new Error(name) }
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const schemaAt = (contract, path, variant = 'UNAVAILABLE') => { const schema = get(contract, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }

function fingerprint(contract, schema, row) {
  const rule = get(contract, schema.fingerprint_ref), preimage = {}
  ok(`fingerprint schema ${schema.fingerprint_ref}`, rule?.preimage_order)
  for (const field of rule.preimage_order) { ok(`fingerprint operand ${field}`, field === 'domain_ascii' || Object.hasOwn(row, field)); preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field] }
  return { schema_ref: schema.fingerprint_ref, preimage, value: hash(preimage) }
}

function verifySoleIdentities(contract) {
  const target = contract.authority_operation_committed_target_identity_authority
  const receipt = contract.authority_operation_receipt_materialization_authority
  const artifact = contract.authority_operation_artifact_fingerprint_derivation_authority
  ok('R47 target authority', target.schema_version === 'ctrl.g24.authority-operation-committed-target-identity-authority.r47.v1' && target.active_normative_authority === true && target.row_version_ref_preimage_schema.domain_ascii === 'CTRL-G24-R47-COMMITTED-TARGET-ROW-VERSION')
  ok('R47 receipt authority', receipt.schema_version === 'ctrl.g24.authority-operation-receipt-materialization-authority.r47.v1' && receipt.active_normative_authority === true && receipt.receipt_ref_preimage_schema.domain_ascii === 'CTRL-G24-R47-AUTHORITY-OPERATION-RECEIPT-REF')
  ok('R47 artifact authority', artifact.schema_version === 'ctrl.g24.authority-operation-artifact-fingerprint-derivation-authority.r47.v1' && artifact.active_normative_authority === true)
  const expectedKinds = ['canonical_payload_content_address', 'payload_fingerprint', 'persisted_wrapper_fingerprint', 'registry_row_ref', 'hold_row_ref', 'nonce_receipt_ref', 'nonce_receipt_fingerprint', 'committed_target_row_version_ref', 'committed_target_row_content_address', 'committed_target_anchor_fingerprint', 'receipt_ref', 'receipt_precommit_fingerprint', 'receipt_final_fingerprint']
  const index = artifact.sole_active_identity_index
  ok('identity index unique and complete', same(index.map(row => row.identity_kind), expectedKinds) && new Set(index.map(row => row.identity_kind)).size === expectedKinds.length)
  const activeClaims = []
  function walk(value, path = '$') {
    if (!value || typeof value !== 'object') return
    if (value.active_normative_authority === true && Array.isArray(value.sole_active_identity_kinds)) for (const kind of value.sole_active_identity_kinds) activeClaims.push({ kind, path })
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
  }
  walk(contract)
  const expectedClaims = [...target.sole_active_identity_kinds.map(kind => ({ kind, path: '$.authority_operation_committed_target_identity_authority' })), ...receipt.sole_active_identity_kinds.map(kind => ({ kind, path: '$.authority_operation_receipt_materialization_authority' }))]
  ok('sole direct active claims', same(activeClaims.sort((a, b) => cp(`${a.kind}|${a.path}`, `${b.kind}|${b.path}`)), expectedClaims.sort((a, b) => cp(`${a.kind}|${a.path}`, `${b.kind}|${b.path}`))))
  ok('index points to sole active authority', index.every(row => get(contract, row.authority_path) !== undefined) && index.filter(row => row.identity_kind.startsWith('committed_target_')).every(row => row.authority_path === 'authority_operation_committed_target_identity_authority') && index.filter(row => row.identity_kind.startsWith('receipt_')).every(row => row.authority_path === 'authority_operation_receipt_materialization_authority'))
  ok('no stale active identity domains', !canonicalR44(target).includes('R45-COMMITTED-TARGET') && !canonicalR44(receipt).includes('R45-AUTHORITY-OPERATION-RECEIPT'))

  const fixture = contract.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed'), store = fixture.artifact_store_by_role
  const targetRow = store.committed_target_row.canonical_row_value
  const mutable = Object.fromEntries(Object.entries(targetRow).filter(([field]) => !['row_version_ref', 'anchor_fingerprint'].includes(field)))
  const rowVersionPreimage = { domain_ascii: target.row_version_ref_preimage_schema.domain_ascii, schema_version: target.row_version_ref_preimage_schema.schema_version, ordered_complete_mutable_authority_fields: Object.keys(mutable).sort(cp).map(field => ({ field, value: mutable[field] })) }
  ok('target row version formula parity', targetRow.row_version_ref === hash(rowVersionPreimage) && same(store.committed_target_row.normative_row_ref_preimage, rowVersionPreimage) && target.fixture_parity_row_version_ref === targetRow.row_version_ref)
  const targetDerived = fingerprint(contract, schemaAt(contract, store.committed_target_row.schema_ref, store.committed_target_row.schema_variant), targetRow)
  const targetBytes = canonicalR44(targetRow), targetBytesHash = sha(Buffer.from(targetBytes, 'utf8'))
  ok('target row content and fingerprint parity', targetRow.anchor_fingerprint === targetDerived.value && store.committed_target_row.recorded_fingerprint === targetDerived.value && store.committed_target_row.content_addressed_artifact_ref === targetBytesHash && target.fixture_parity_content_address === targetBytesHash && target.fixture_parity_fingerprint === targetDerived.value)

  const receiptRow = store.receipt.canonical_row_value, receiptSchema = schemaAt(contract, store.receipt.schema_ref, store.receipt.schema_variant)
  const receiptRefPreimage = { domain_ascii: receipt.receipt_ref_preimage_schema.domain_ascii, schema_version: receipt.receipt_ref_preimage_schema.schema_version, ordered_fields: receipt.receipt_ref_preimage_schema.ordered_fields.map(field => ({ field, value: receiptRow[field] })) }
  ok('receipt ref formula parity', receiptRow.receipt_ref === hash(receiptRefPreimage) && same(store.receipt.normative_row_ref_preimage, receiptRefPreimage) && receipt.fixture_parity_receipt_ref === receiptRow.receipt_ref)
  const precommitRule = get(contract, receipt.receipt_precommit_fingerprint_schema_ref), precommit = {}
  for (const field of precommitRule.preimage_order) precommit[field] = field === 'domain_ascii' ? precommitRule.domain_ascii : receiptRow[field]
  const final = fingerprint(contract, receiptSchema, receiptRow)
  ok('receipt fingerprints formula parity', receiptRow.receipt_precommit_fingerprint === hash(precommit) && receipt.fixture_parity_precommit_fingerprint === hash(precommit) && receiptRow.receipt_fingerprint === final.value && receipt.fixture_parity_final_fingerprint === final.value)
  ok('receipt downstream parity', store.result.payload_value.receipt_ref === receiptRow.receipt_ref && store.result.payload_value.receipt_precommit_fingerprint === receiptRow.receipt_precommit_fingerprint && store.registry.canonical_row_value.receipt_fingerprint === receiptRow.receipt_fingerprint)
}

function rescanFinalReferences(contract) {
  const paths = [...r47SemanticAuthorityPaths], sourcePaths = paths.filter(path => !['authority_runtime_semantic_manifest', 'authority_runtime_semantic_dependency_owner_map', 'authority_runtime_semantic_reference_owner_map', 'authority_runtime_semantic_reference_field_registry'].includes(path))
  ok('independent source paths pinned', same(sourcePaths, r47SemanticSourcePaths))
  const spec = contract.semantic_reference_field_specification, noSuffix = new Set(spec.exact_non_suffix_semantic_fields), refToken = key => /(^|_)(ref|refs)($|_)/.test(key)
  const aliases = { selected_session_operation_request_schema: 'request_schema', selected_session_operation_result_schema: 'operation_result_schema_derivation', selected_result_schema: 'operation_result_schema_derivation', 'authority_runtime_semantic_manifest.row_schema': 'authority_runtime_semantic_manifest_envelope_schema' }
  function owner(path) { let selected = ''; for (const authorityPath of paths) if ((path === authorityPath || path.startsWith(`${authorityPath}.`)) && authorityPath.length > selected.length) selected = authorityPath; return selected }
  function version(path) { let cursor = path; while (cursor) { const value = get(contract, cursor); if (value?.schema_version) return value.schema_version; const cut = cursor.lastIndexOf('.'); if (cut < 0) break; cursor = cursor.slice(0, cut) } return materializedR46.authority_runtime_semantic_manifest.rows.find(row => row.authority_path === path)?.authority_schema_version ?? 'ctrl.g24.semantic-authority.unversioned-frozen.v1' }
  const derivedTargetPaths = ['authority_runtime_semantic_manifest']
  const frozenTargetPaths = [...new Set(materializedR46.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.map(row => row.exact_target_path_or_UNAVAILABLE).filter(path => path !== 'UNAVAILABLE'))].sort(cp)
  function target(reference) {
    if (aliases[reference]) return { target: aliases[reference], runtime: 'pinned_semantic_alias' }
    const normalized = reference.replace(/^\$\./, '')
    if (normalized.includes('*')) return { target: 'UNAVAILABLE', runtime: 'discriminated_wildcard_reference' }
    if (sourcePaths.some(path => normalized === path || normalized.startsWith(`${path}.`)) || paths.some(path => normalized === path || normalized.startsWith(`${path}.`)) || derivedTargetPaths.includes(normalized) || frozenTargetPaths.includes(normalized)) return { target: normalized, runtime: 'UNAVAILABLE' }
    if (reference.includes('_or_') || reference.includes('|')) return { target: 'UNAVAILABLE', runtime: 'closed_discriminated_compound_reference' }
    return { target: 'UNAVAILABLE', runtime: 'runtime_identity_or_field_reference' }
  }
  const rows = [], keys = new Set()
  function add(source, fieldPath, fieldName, literal, reason) {
    const resolution = target(literal), selectedOwner = resolution.target === 'UNAVAILABLE' ? source : owner(resolution.target) || source, key = `${source}|${fieldPath}|${literal}`
    if (keys.has(key)) return
    keys.add(key)
    rows.push({ source_authority_path: source, field_path: fieldPath, field_name: fieldName, reference_kind: literal === 'UNAVAILABLE' ? 'exact_sentinel_reference' : resolution.target !== 'UNAVAILABLE' ? (fieldName.includes('schema') ? 'exact_nested_schema_reference' : 'exact_nested_semantic_reference') : resolution.runtime, reference_literal: literal, owner_authority_path: selectedOwner, expected_owner_schema_version: version(selectedOwner), exact_target_path_or_UNAVAILABLE: resolution.target, exact_target_schema_version_or_UNAVAILABLE: resolution.target === 'UNAVAILABLE' ? 'UNAVAILABLE' : version(resolution.target), runtime_identity_kind_or_UNAVAILABLE: resolution.target === 'UNAVAILABLE' ? resolution.runtime : 'UNAVAILABLE', specification_pattern_id: reason })
  }
  function walk(value, source, fieldPath = source) {
    if (!value || typeof value !== 'object') return
    for (const [key, item] of Object.entries(value)) {
      const next = `${fieldPath}.${key}`, selected = refToken(key) || noSuffix.has(key)
      if (selected) {
        if (Array.isArray(item)) { for (let index = 0; index < item.length; index += 1) if (typeof item[index] === 'string') add(source, `${next}.${index}`, key, item[index], refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix') }
        else if (typeof item === 'string') add(source, next, key, item, refToken(key) ? 'tokenized_ref_or_refs' : 'explicit_non_suffix')
      }
      if (typeof item === 'string') { const resolution = target(item); if (resolution.target !== 'UNAVAILABLE' && owner(resolution.target) !== source) add(source, next, key, item, 'semantic_value') }
      walk(item, source, next)
    }
  }
  for (const path of sourcePaths) if (path !== 'semantic_reference_field_specification') walk(get(contract, path), path)
  rows.sort((left, right) => cp(`${left.source_authority_path}|${left.field_path}|${left.reference_literal}`, `${right.source_authority_path}|${right.field_path}|${right.reference_literal}`))
  return { rows, sourcePaths }
}

function verifyFinalRegistryAndManifest(contract) {
  const registry = contract.authority_runtime_semantic_reference_field_registry, rescanned = rescanFinalReferences(contract)
  if (!(same(registry.exact_occurrence_rows, rescanned.rows) && registry.exact_expected_occurrence_count === rescanned.rows.length && rescanned.rows.length === 6449)) {
    const limit = Math.max(registry.exact_occurrence_rows.length, rescanned.rows.length)
    let first = -1
    for (let index = 0; index < limit; index += 1) if (!same(registry.exact_occurrence_rows[index], rescanned.rows[index])) { first = index; break }
    throw new Error(`final snapshot registry exact rows:stored=${registry.exact_occurrence_rows.length}:rescanned=${rescanned.rows.length}:first=${first}:stored_row=${canonicalR44(registry.exact_occurrence_rows[first])}:rescanned_row=${canonicalR44(rescanned.rows[first])}`)
  }
  const sourceObjects = Object.fromEntries(rescanned.sourcePaths.map(path => [path, get(contract, path)]))
  const sourceHash = hash({ domain_ascii: 'CTRL-G24-R47-FINAL-SEMANTIC-SOURCE-SNAPSHOT', exact_source_paths: rescanned.sourcePaths, source_objects: sourceObjects })
  ok('final immutable source snapshot', registry.source_snapshot_sha256 === sourceHash && contract.authority_runtime_semantic_reference_owner_map.source_snapshot_sha256 === sourceHash && contract.authority_runtime_semantic_dependency_owner_map.source_snapshot_sha256 === sourceHash && contract.authority_runtime_semantic_manifest.source_snapshot_sha256 === sourceHash)
  ok('generation order', same(registry.derivation_order, ['finalize_non_derived_semantic_authorities', 'capture_owned_immutable_source_snapshot', 'scan_exact_source_snapshot', 'derive_owner_graph', 'derive_content_dependency_and_transitive_hashes', 'derive_graph_hash', 'seal_manifest_envelope']) && registry.post_snapshot_source_mutation === 'forbidden')

  const prior = Object.fromEntries(materializedR46.authority_runtime_semantic_dependency_owner_map.rows.map(row => [row.authority_path, row.typed_owner_paths])), occurrence = {}
  for (const row of rescanned.rows) if (row.owner_authority_path !== row.source_authority_path) (occurrence[row.source_authority_path] ??= new Set()).add(row.owner_authority_path)
  const explicitEmptyDependencies = new Set(['materialization', 'schema_change_manifest', 'fixture_schema_validator', 'semantic_reference_field_specification'])
  const expectedOwners = r47SemanticAuthorityPaths.map(path => ({ authority_path: path, typed_owner_paths: [...new Set([...(explicitEmptyDependencies.has(path) ? [] : prior[path] ?? []), ...[...(occurrence[path] ?? [])]])].filter(owner => r47SemanticAuthorityPaths.includes(owner) && owner !== path).sort(cp), unqualified_legacy_alias_owner_path: path }))
  if (!same(contract.authority_runtime_semantic_dependency_owner_map.rows, expectedOwners)) {
    const actual = contract.authority_runtime_semantic_dependency_owner_map.rows
    let first = -1
    for (let index = 0; index < Math.max(actual.length, expectedOwners.length); index += 1) if (!same(actual[index], expectedOwners[index])) { first = index; break }
    throw new Error(`owner graph exact final rows:first=${first}:actual=${canonicalR44(actual[first])}:expected=${canonicalR44(expectedOwners[first])}`)
  }

  const manifest = contract.authority_runtime_semantic_manifest, hashContract = contract.authority_runtime_semantic_manifest_hash_contract, hashVersion = hashContract.schema_version
  const required = ['schema_version', 'type', 'snapshot_pipeline_ref', 'resource_limits_ref', 'hash_contract_ref', 'dependency_owner_map_ref', 'reference_field_specification_ref', 'reference_field_registry_ref', 'source_snapshot_sha256', 'exact_paths', 'rows', 'exact_expected_count', 'manifest_graph_sha256', 'manifest_envelope_seal_sha256']
  ok('full manifest envelope', same(Object.keys(manifest), required) && same(manifest.exact_paths, r47SemanticAuthorityPaths) && manifest.rows.length === 220)
  const contentHash = (path, value) => hash({ domain_ascii: hashContract.content_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, canonical_authority_snapshot: ownedSnapshotR44(value) })
  const dependencyHash = (path, scope, rows) => hash({ domain_ascii: hashContract.dependency_domain_ascii, manifest_hash_version: hashVersion, authority_path: path, dependency_scope: scope, canonical_sorted_dependency_rows: rows })
  const contentHashes = Object.fromEntries(r47SemanticAuthorityPaths.map(path => [path, contentHash(path, get(contract, path))])), graph = Object.fromEntries(expectedOwners.map(row => [row.authority_path, row.typed_owner_paths]))
  const transitive = path => { const seen = new Set(), visit = current => { for (const dependency of graph[current] ?? []) if (!seen.has(dependency)) { seen.add(dependency); visit(dependency) } }; visit(path); seen.delete(path); return [...seen].sort(cp) }
  for (const row of manifest.rows) {
    const direct = graph[row.authority_path], directRows = direct.map(path => ({ authority_path: path, authority_content_sha256: contentHashes[path] })), transitiveRows = transitive(row.authority_path).map(path => ({ authority_path: path, authority_content_sha256: contentHashes[path] }))
    ok(`manifest row ${row.authority_path}`, row.authority_content_sha256 === contentHashes[row.authority_path] && same(row.direct_dependency_paths, direct) && same(row.direct_dependency_content_hashes, directRows) && row.direct_dependency_set_sha256 === dependencyHash(row.authority_path, 'direct', directRows) && same(row.transitive_dependency_paths, transitiveRows.map(item => item.authority_path)) && same(row.transitive_dependency_content_hashes, transitiveRows) && row.transitive_dependency_set_sha256 === dependencyHash(row.authority_path, 'transitive', transitiveRows))
  }
  ok('manifest graph', manifest.manifest_graph_sha256 === hash({ domain_ascii: hashContract.graph_domain_ascii, manifest_hash_version: hashVersion, manifest_rows: manifest.rows }))
  const withoutSeal = { ...manifest }; delete withoutSeal.manifest_envelope_seal_sha256
  ok('manifest seal', manifest.manifest_envelope_seal_sha256 === hash({ domain_ascii: hashContract.envelope_domain_ascii, manifest_hash_version: hashVersion, manifest_without_envelope_seal: withoutSeal }))
  const envelope = contract.authority_runtime_semantic_manifest_envelope_schema
  ok('envelope resource and spec refs', envelope.properties.resource_limits_ref.const === 'canonical_snapshot_resource_limits' && envelope.properties.reference_field_specification_ref.const === 'semantic_reference_field_specification' && envelope.properties.reference_field_registry_ref.const === 'authority_runtime_semantic_reference_field_registry')
  ok('schema change final paths', contract.schema_change_manifest.changed_semantic_paths.includes('$.authority_operation_committed_target_identity_authority') && contract.schema_change_manifest.changed_semantic_paths.includes('$.authority_operation_receipt_materialization_authority') && contract.schema_change_manifest.changed_semantic_paths.includes('$.authority_runtime_semantic_manifest_envelope_schema'))
}

function verify(contract) {
  ok('identity', contract.schema_version === 'ctrl.g24.trusted-ingress.r47.effective.v1' && contract.supersedes.commit === '91053dd1997095e8eb6c92d2031dc03ec7c6684d' && contract.materialization.frozen_input.sha256 === '3a55d19ddfbfce31feb353620322e645f8d0f42bd287a3a87cefe6f36d0d0082')
  ok('no surface or action', same(contract.visible_surface_changes, []) && same(contract.external_actions_authorized, []))
  verifySoleIdentities(contract)
  verifyFinalRegistryAndManifest(contract)
}

if (read(machinePath) !== materializedR47Output) failures.push('machine differs from materializer')
const frozen = {
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r46.json': '3a55d19ddfbfce31feb353620322e645f8d0f42bd287a3a87cefe6f36d0d0082',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r46.md': '29daf79143a68257f391e830b9986e3808bb5772f6b1ea88b7a61c3adf14f83b',
  'project-documentation/ctrl-evolution/g24-trusted-ingress-r46-qa-record.md': '95bdfa5d742464d55225bc945817034158c4462550b2e72ba559c274275401c7',
  'scripts/check-ctrl-g24-trusted-ingress-r46.mjs': 'd549a1f6cd52f71e28a095e036c3d51ca7f0b0381aafda469e51e1c6718c4ff5',
  'scripts/materialize-ctrl-g24-trusted-ingress-r46.mjs': '09dd5971d017c9fc5c4e7811cd02d01eda08573559ca17d68320612f4746f3db',
}
for (const [path, expected] of Object.entries(frozen)) if (sha(read(path)) !== expected) failures.push(`frozen R46 changed:${path}`)
try { verify(materializedR47) } catch (error) { failures.push(`base:${error.stack}`) }
if (process.argv.includes('--base-only')) {
  if (failures.length) { for (const failure of failures) console.error(failure); process.exit(1) }
  console.log('ok: R47 base verification')
  process.exit(0)
}
function reject(name, mutation) { const candidate = structuredClone(materializedR47); mutation(candidate); try { verify(candidate); failures.push(`mutation accepted:${name}`) } catch {} }
const attacks = [
  ['parent', c => { c.supersedes.commit = '0'.repeat(40) }],
  ['visible', c => { c.visible_surface_changes.push('ui') }],
  ['external', c => { c.external_actions_authorized.push('deploy') }],
  ['stale target authority coexistence', c => { c.legacy_target_identity_authority = { active_normative_authority: true, sole_active_identity_kinds: ['committed_target_row_version_ref'], domain_ascii: 'CTRL-G24-R45-COMMITTED-TARGET-ROW-VERSION' } }],
  ['stale receipt authority coexistence', c => { c.legacy_receipt_identity_authority = { active_normative_authority: true, sole_active_identity_kinds: ['receipt_ref'], domain_ascii: 'CTRL-G24-R45-AUTHORITY-OPERATION-RECEIPT-REF' } }],
  ['duplicate identity kind', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.push(structuredClone(c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index[0])) }],
  ['target formula digest drift', c => { c.authority_operation_committed_target_identity_authority.row_version_ref_preimage_schema.domain_ascii = 'CTRL-G24-R47-DIFFERENT-TARGET' }],
  ['receipt formula digest drift', c => { c.authority_operation_receipt_materialization_authority.receipt_ref_preimage_schema.domain_ascii = 'CTRL-G24-R47-DIFFERENT-RECEIPT' }],
  ['stale registry 6407', c => { c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows = structuredClone(materializedR46.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows); c.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count = 6407 }],
  ['missing envelope resource ref', c => { delete c.authority_runtime_semantic_manifest_envelope_schema.properties.resource_limits_ref }],
  ['missing envelope spec ref', c => { delete c.authority_runtime_semantic_manifest_envelope_schema.properties.reference_field_specification_ref }],
  ['stale schema change paths', c => { c.schema_change_manifest.changed_semantic_paths = c.schema_change_manifest.changed_semantic_paths.filter(path => path !== '$.authority_operation_receipt_materialization_authority') }],
  ['post registry source mutation', c => { c.authority_operation_committed_target_projection_authority.valid_until_rule = 'changed_after_snapshot' }],
  ['owner map omission', c => { const row = c.authority_runtime_semantic_dependency_owner_map.rows.find(item => item.typed_owner_paths.length); row.typed_owner_paths = row.typed_owner_paths.slice(1) }],
  ['owner stale dependency', c => { c.authority_runtime_semantic_dependency_owner_map.rows[0].typed_owner_paths.push('authority_operation_receipt_materialization_authority') }],
  ['source snapshot drift', c => { c.authority_runtime_semantic_reference_field_registry.source_snapshot_sha256 = '0'.repeat(64) }],
  ['manifest content drift', c => { c.authority_runtime_semantic_manifest.rows[0].authority_content_sha256 = '0'.repeat(64) }],
  ['manifest graph drift', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '0'.repeat(64) }],
  ['manifest seal drift', c => { c.authority_runtime_semantic_manifest.manifest_envelope_seal_sha256 = '0'.repeat(64) }],
  ['committed target fixture parity', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.committed_target_row.canonical_row_value.valid_until = '2028-09-14T00:00:00.000Z' }],
  ['receipt fixture parity', c => { c.authority_operation_replay_restart_fixtures.fixtures[0].artifact_store_by_role.receipt.canonical_row_value.receipt_ref = '0'.repeat(64) }],
]
for (const [name, mutation] of attacks) reject(name, mutation)
const parent = spawnSync(process.execPath, ['scripts/check-ctrl-g24-trusted-ingress-r46.mjs'], { cwd: root, encoding: 'utf8' })
if (parent.status !== 0) failures.push(`frozen R46 checker failed:${parent.stderr || parent.stdout}`)
if (failures.length) { console.error(`R47 failed ${failures.length}`); for (const failure of failures) console.error(`- ${failure}`); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R47 and ${attacks.length} mutation probes verified`)
console.log('r47_sole_persisted_identity_kinds=13/13')
console.log('r47_semantic_reference_rows=6449/6449')
console.log('r47_dependency_owner_rows=220/220')
console.log('r47_manifest_rows=220/220')
console.log('r47_restart_fixtures=4/4')
console.log(`r47_machine_sha256=${sha(read(machinePath))}`)
