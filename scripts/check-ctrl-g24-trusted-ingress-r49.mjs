import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR49, materializedR49Output } from './materialize-ctrl-g24-trusted-ingress-r49.mjs'
import { canonicalR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r49.json'
const sha = value => createHash('sha256').update(value).digest('hex')
const hash = value => sha(Buffer.from(canonicalR44(value), 'utf8'))
const cp = (a, b) => { const x = [...a].map(c => c.codePointAt(0)), y = [...b].map(c => c.codePointAt(0)); for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length }
const same = (a, b) => canonicalR44(a) === canonicalR44(b)
const get = (object, path) => path.split('.').reduce((value, key) => value && Object.hasOwn(value, key) ? value[key] : undefined, object)
const assert = (condition, label) => { if (!condition) throw new Error(label) }
const schemaAt = (c, path, variant = 'UNAVAILABLE') => { const schema = get(c, path); return variant === 'UNAVAILABLE' ? schema : schema?.variants?.[variant] }
const refToken = key => /(^|_)(ref|refs)($|_)/.test(key) && !/(fingerprint|sha256)$/.test(key)

function fingerprint(c, schema, row) {
  const rule = get(c, schema.fingerprint_ref)
  assert(rule?.preimage_order, `fingerprint_rule:${schema.fingerprint_ref}`)
  const preimage = {}
  for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]
  return hash(preimage)
}
function derivePayloadFingerprint(c, role, artifact) {
  const schemaRef = artifact.payload_schema_ref, variant = artifact.payload_schema_variant ?? 'UNAVAILABLE', schema = schemaAt(c, schemaRef, variant), payload = artifact.payload_value
  if (schema.fingerprint_field) return fingerprint(c, schema, payload)
  if (role === 'result') {
    const rule = c.case_session_authority_operation_protocols.operations[payload.operation_name].result_fingerprint, body = {}
    for (const field of schema.exact_keys) if (field !== 'result_fingerprint') body[field] = payload[field]
    return hash({ domain_ascii: rule.domain_ascii, operation_name: payload.operation_name, operation_id: payload.operation_id, branch: payload.branch, branch_specific_canonical_payload_sha256: hash(body) })
  }
  if (role === 'request') {
    const rule = c.case_session_authority_operation_protocols.operations[payload.operation_name].request_fingerprint, preimage = {}
    for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : payload[field]
    return hash(preimage)
  }
  if (schemaRef === 'proof_nonce_receipt_payload_schema') return fingerprint(c, c.proof_nonce_ledger.row_schema, artifact.stored_row_value)
  const bytesHash = sha(Buffer.from(canonicalR44(payload), 'utf8')), rule = get(c, artifact.declared_payload_fingerprint_schema_ref)
  assert(rule?.domain_ascii && same(rule.preimage_order, ['domain_ascii', 'schema_ref', 'canonical_bytes_sha256']), `generic_payload_rule:${artifact.declared_payload_fingerprint_schema_ref}`)
  return hash({ domain_ascii: rule.domain_ascii, schema_ref: schemaRef, canonical_bytes_sha256: bytesHash })
}
function selectedStore(c, schemaRef) {
  const found = []
  const walk = value => { if (!value || typeof value !== 'object') return; if (value.canonical_schema_ref === schemaRef && value.row_schema?.properties) found.push(value); for (const child of Object.values(value)) walk(child) }
  walk(c)
  const unique = [...new Set(found)]
  assert(unique.length === 1, `selected_store:${schemaRef}:${unique.length}`)
  return unique[0]
}
function validateArtifact(c, fixtureId, role, artifact) {
  if (artifact.fixture_wrapper_variant === 'content_addressed') {
    const schema = schemaAt(c, artifact.payload_schema_ref, artifact.payload_schema_variant ?? 'UNAVAILABLE')
    if (!schema?.exact_keys) {
      const bytes = artifact.payload_value, bytesHash = sha(Buffer.from(bytes, 'utf8')), rule = get(c, artifact.declared_payload_fingerprint_schema_ref), row = artifact.stored_row_value, preimage = {}
      for (const field of rule.preimage_order) preimage[field] = field === 'domain_ascii' ? rule.domain_ascii : row[field]
      const derived = hash(preimage)
      assert(artifact.payload_canonical_bytes_utf8 === bytes && artifact.ref === bytesHash && artifact.bytes_sha256 === bytesHash && row.artifact_ref === bytesHash && row.opaque_bytes_sha256 === bytesHash, `opaque_content:${fixtureId}:${role}`)
      assert(artifact.fingerprint === derived && artifact.payload_fingerprint === derived && row.artifact_fingerprint === derived, `opaque_fingerprint:${fixtureId}:${role}`)
      return
    }
    assert(schema?.exact_keys && same(Object.keys(artifact.payload_value).sort(cp), [...schema.exact_keys].sort(cp)), `payload_keys:${fixtureId}:${role}`)
    const bytes = canonicalR44(artifact.payload_value), bytesHash = sha(Buffer.from(bytes, 'utf8')), payloadFp = derivePayloadFingerprint(c, role, artifact)
    assert(artifact.payload_canonical_bytes_utf8 === bytes, `payload_bytes:${fixtureId}:${role}`)
    assert(artifact.ref === bytesHash && artifact.bytes_sha256 === bytesHash && artifact.payload_bytes_sha256 === bytesHash, `content_address:${fixtureId}:${role}`)
    assert(artifact.payload_fingerprint === payloadFp && artifact.fingerprint === payloadFp, `payload_fingerprint:${fixtureId}:${role}`)
    if (schema.fingerprint_field) assert(artifact.payload_value[schema.fingerprint_field] === payloadFp, `native_payload_fingerprint:${fixtureId}:${role}`)
    if (role === 'result') assert(artifact.payload_value.result_fingerprint === payloadFp, `native_result_fingerprint:${fixtureId}`)
    if (artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema') {
      const rowSchema = c.proof_nonce_ledger.row_schema, row = artifact.stored_row_value, wrapperFp = fingerprint(c, rowSchema, row)
      assert(row.nonce_receipt_ref === bytesHash && row.nonce_receipt_fingerprint === wrapperFp && artifact.stored_row_fingerprint === wrapperFp, `nonce_wrapper:${fixtureId}:${role}`)
      return
    }
    const store = selectedStore(c, artifact.payload_schema_ref), rowSchema = store.row_schema, row = artifact.stored_row_value
    assert(row.artifact_ref === bytesHash && row.canonical_schema_ref === artifact.payload_schema_ref && row.canonical_bytes_sha256 === bytesHash && row.parsed_content_fingerprint === payloadFp, `wrapper_bindings:${fixtureId}:${role}`)
    assert(row.canonical_bytes_b64url === Buffer.from(bytes, 'utf8').toString('base64url') && row.canonical_bytes_length === Buffer.byteLength(bytes), `wrapper_bytes:${fixtureId}:${role}`)
    const wrapperFp = fingerprint(c, rowSchema, row)
    assert(row[rowSchema.fingerprint_field] === wrapperFp && artifact.stored_row_fingerprint === wrapperFp, `wrapper_fingerprint:${fixtureId}:${role}`)
    return
  }
  const schema = schemaAt(c, artifact.schema_ref, artifact.schema_variant ?? 'UNAVAILABLE'), row = artifact.canonical_row_value
  assert(schema?.exact_keys && same(Object.keys(row).sort(cp), [...schema.exact_keys].sort(cp)), `row_keys:${fixtureId}:${role}`)
  const bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8')), rowFp = fingerprint(c, schema, row)
  assert(artifact.canonical_row_bytes_utf8 === bytes && artifact.canonical_row_bytes_sha256 === bytesHash && artifact.content_addressed_artifact_ref === bytesHash, `row_content:${fixtureId}:${role}`)
  assert(row[schema.fingerprint_field] === rowFp && artifact.recorded_fingerprint === rowFp, `row_fingerprint:${fixtureId}:${role}`)
  if (role === 'registry' || role === 'hold') {
    const field = role === 'registry' ? 'registry_row_ref' : 'hold_row_ref'
    const expected = hash({ domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: schema.row_ref_preimage_included_fields.map(name => ({ field: name, value: row[name] })) })
    assert(row[field] === expected, `row_ref:${fixtureId}:${role}`)
  }
  if (role === 'committed_target_row') {
    const store = artifact.schema_ref.split('.').at(-1), authority = c.authority_operation_committed_target_identity_authority.variants[store]
    assert(authority, `target_identity_authority:${store}`)
    const excluded = new Set(['row_version_ref', schema.fingerprint_field]), mutable = Object.keys(row).filter(name => !excluded.has(name)).sort(cp).map(field => ({ field, value: row[field] }))
    const expected = hash({ domain_ascii: authority.row_version_domain_ascii, schema_version: authority.row_version_schema_version, ordered_complete_mutable_authority_fields: mutable })
    assert(row.row_version_ref === expected, `target_row_version:${fixtureId}`)
  }
}

const externalFields = new Set(['account_binding_ref','account_binding_row_version_ref','account_ref','account_standing_ref','account_standing_row_version_ref','authority_proof_schema_ref','case_binding_ref','case_binding_row_version_ref','case_ref','decoded_target_workspace_ref','deployment_configuration_ref','dual_proof_bundle_schema_ref','evaluator_proof_schema_ref','evaluator_ref','evaluator_row_version_ref','evaluator_version_ref','evidence_ref','expected_head_row_version_ref','hold_schema_ref','issuer_proof_schema_ref','issuer_ref','issuer_row_version_ref','issuer_version_ref','live_principal_assertion_bytes_ref','pinned_runtime_attestor_ref','presented_principal_projection_bytes_ref','prior_anchor_version_ref','prior_row_version_ref','proof_ref','response_schema_ref','root_anchor_row_version_ref','selected_current_partition_workspace_ref','server_session_ref','session_evidence_ref','session_evidence_row_version_ref','session_ref','signer_1_ref','signer_2_ref','stable_actor_ref','target_intent_schema_ref','target_row_schema_ref','trust_anchor_ref','trust_anchor_version_ref','verifier_ref','verifier_version_ref','workspace_ref'])
const schemaFields = new Set(['authority_proof_schema_ref','dual_proof_bundle_schema_ref','evaluator_proof_schema_ref','hold_schema_ref','issuer_proof_schema_ref','response_schema_ref','target_intent_schema_ref','target_row_schema_ref'])
const optionalRawFields = new Set(['raw_bundle_ref_or_unavailable','raw_evaluator_proof_ref_or_unavailable','raw_issuer_proof_ref_or_unavailable','raw_proof_ref_or_unavailable','raw_target_ref_or_unavailable','session_hold_evidence_ref_or_unavailable'])
function identities(role, artifact) {
  if (artifact.fixture_wrapper_variant === 'content_addressed') return [{ role, kind: 'artifact_ref', ref: artifact.ref, bytes: artifact.bytes_sha256, fp: artifact.fingerprint }]
  const rows = [{ role, kind: 'row_content_address', ref: artifact.content_addressed_artifact_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint }]
  if (role === 'registry') rows.push({ role, kind: 'registry_row_ref', ref: artifact.canonical_row_value.registry_row_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint })
  if (role === 'hold') rows.push({ role, kind: 'hold_row_ref', ref: artifact.canonical_row_value.hold_row_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint })
  if (role === 'committed_target_row') rows.push({ role, kind: 'row_version_ref', ref: artifact.canonical_row_value.row_version_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint })
  if (role === 'receipt') { rows.push({ role, kind: 'receipt_precommit_ref', ref: artifact.canonical_row_value.receipt_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.canonical_row_value.receipt_precommit_fingerprint }); rows.push({ role, kind: 'receipt_final_ref', ref: artifact.canonical_row_value.receipt_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint }) }
  return rows
}
function companions(sourceRole, key, value) {
  if (key === 'response_payload_ref') return ['response_payload_bytes_sha256', 'result_fingerprint']
  if (key === 'request_artifact_ref') return ['request_artifact_sha256', 'request_fingerprint']
  if (key === 'result_ref') return ['result_bytes_sha256', 'result_fingerprint']
  if (key === 'hold_result_ref') return ['hold_result_bytes_sha256', 'hold_result_fingerprint']
  if (key === 'hold_row_ref') return [null, sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint']
  if (key === 'receipt_ref') return [null, sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint']
  if (key === 'committed_target_row_ref') return ['committed_target_row_bytes_sha256', 'committed_target_row_fingerprint']
  if (key === 'target_row_version_ref') return [null, 'target_row_fingerprint']
  if (key === 'held_registry_row_ref') return [null, 'held_registry_row_fingerprint']
  if (key === 'committed_registry_row_ref') return [null, 'committed_registry_row_fingerprint']
  const suffix = key.endsWith('_or_unavailable') ? '_or_unavailable' : '', base = key.replace(/_ref(_or_unavailable)?$/, '')
  return [[`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(candidate => Object.hasOwn(value, candidate)) ?? null, `${base}_fingerprint${suffix}`]
}
function deriveTraversal(c) {
  const session = c.authority_operation_committed_receipt_identity_fixtures
  const branches = [...c.authority_operation_replay_restart_fixtures.fixtures.map(f => ({ fixture_id: f.fixture_id, store: f.artifact_store_by_role })), { fixture_id: session.fixture_id, store: session.artifact_store_by_role }]
  const resolution = [], self = [], nonartifact = [], allow = []
  for (const branch of branches) {
    const all = Object.entries(branch.store).flatMap(([role, artifact]) => identities(role, artifact))
    for (const [sourceRole, artifact] of Object.entries(branch.store)) {
      const schemaRef = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_ref : artifact.schema_ref, variant = (artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_schema_variant : artifact.schema_variant) ?? 'UNAVAILABLE'
      const schema = schemaAt(c, schemaRef, variant), value = artifact.fixture_wrapper_variant === 'content_addressed' ? artifact.payload_value : artifact.canonical_row_value
      if (!schema?.exact_keys) continue
      for (const field of schema.exact_keys.filter(refToken)) {
        const reference = value[field]
        if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonartifact.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference ?? null, classification: 'closed_null_or_unavailable_sentinel' }); continue }
        let matches = all.filter(candidate => candidate.ref === reference), nonSelf = matches.filter(candidate => candidate.role !== sourceRole); if (nonSelf.length) matches = nonSelf
        if (!nonSelf.length && matches.length) { self.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
        if (matches.length > 1 && matches.every(candidate => candidate.role === 'receipt')) matches = matches.filter(candidate => candidate.kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
        if (!matches.length) {
          const classification = schemaFields.has(field) ? 'closed_semantic_schema_reference' : externalFields.has(field) ? 'closed_runtime_or_external_authority_identity' : optionalRawFields.has(field) ? 'closed_optional_raw_or_unavailable_identity' : null
          assert(classification, `unresolved_internal:${branch.fixture_id}:${sourceRole}:${schemaRef}:${field}`)
          const row = { source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, identity_kind: classification }; allow.push(row)
          nonartifact.push({ fixture_id: branch.fixture_id, source_role: sourceRole, ...row, reference_literal: reference, classification }); continue
        }
        assert(matches.length === 1, `multiple_reference:${branch.fixture_id}:${sourceRole}:${field}`)
        const target = matches[0], [bytesField, fpField] = companions(sourceRole, field, value), actualBytes = bytesField && Object.hasOwn(value, bytesField) ? value[bytesField] : 'UNAVAILABLE', actualFp = fpField && Object.hasOwn(value, fpField) ? value[fpField] : 'UNAVAILABLE'
        assert(actualBytes === 'UNAVAILABLE' || actualBytes === target.bytes, `reference_bytes:${branch.fixture_id}:${sourceRole}:${field}`)
        assert(actualFp === 'UNAVAILABLE' || actualFp === target.fp, `reference_fp:${branch.fixture_id}:${sourceRole}:${field}`)
        resolution.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, target_role: target.role, target_identity_kind: target.kind, reference, companion_bytes_field_or_UNAVAILABLE: actualBytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : bytesField, companion_bytes_sha256_or_UNAVAILABLE: actualBytes, companion_fingerprint_field_or_UNAVAILABLE: actualFp === 'UNAVAILABLE' ? 'UNAVAILABLE' : fpField, companion_fingerprint_or_UNAVAILABLE: actualFp, exact_match_count: 1 })
      }
    }
  }
  const sort = rows => rows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b))); sort(resolution); sort(self); sort(nonartifact)
  const uniqueAllow = new Map(); for (const row of allow) uniqueAllow.set(`${row.source_schema_ref}|${row.source_schema_variant}|${row.source_field}`, row)
  const correlations = resolution.flatMap((row, index) => ['reference', 'companion_bytes_or_explicit_unavailable', 'companion_fingerprint_or_explicit_unavailable'].map(kind => ({ correlation_id: `r49:${String(index + 1).padStart(4, '0')}:${kind}`, ...row, correlation_kind: kind })))
  return { branches, resolution, self, nonartifact, allow: sort([...uniqueAllow.values()]), correlations }
}
function collectStores(c) {
  const rows = [], seen = new Set()
  const walk = (value, path = '$') => { if (!value || typeof value !== 'object') return; if (typeof value.canonical_schema_ref === 'string' && value.row_schema?.properties) { const key = `${value.canonical_schema_ref}|${value.row_schema.schema_version}|${path}`; if (!seen.has(key)) { seen.add(key); rows.push({ store_path: path.replace(/^\$\.?/, ''), payload_schema_ref: value.canonical_schema_ref, wrapper_schema_version: value.row_schema.schema_version, wrapper_fingerprint_ref: value.row_schema.fingerprint_ref }) } } for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`) }
  walk(c); return rows.sort((a, b) => cp(`${a.payload_schema_ref}|${a.store_path}`, `${b.payload_schema_ref}|${b.store_path}`))
}
function schemaCompanions(schema, field) {
  const base = field.replace(/_ref(_or_unavailable)?$/, ''), suffix = field.endsWith('_or_unavailable') ? '_or_unavailable' : ''
  const bytes = [`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`, field === 'request_artifact_ref' ? 'request_artifact_sha256' : '', field === 'response_payload_ref' ? 'response_payload_bytes_sha256' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  const fps = [`${base}_fingerprint${suffix}`, field === 'hold_row_ref' ? 'hold_fingerprint' : '', field === 'receipt_ref' ? 'receipt_precommit_fingerprint' : '', field === 'response_payload_ref' ? 'result_fingerprint' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  return { bytes: [...new Set(bytes)].sort(cp), fingerprints: [...new Set(fps)].sort(cp) }
}
function validate(c) {
  assert(c.schema_version === 'ctrl.g24.trusted-ingress.r49.effective.v1', 'schema_version')
  assert(c.supersedes.commit === '840400dbceb9a561d86536b6742f7ffa2628eeb4' && c.supersedes.tree === '9305badda4913afe3ff38f144b243419e78554dd', 'frozen_parent')
  assert(c.visible_surface_changes.length === 0 && c.external_actions_authorized.length === 0, 'closed_boundary')
  const traversal = deriveTraversal(c)
  for (const branch of traversal.branches) for (const [role, artifact] of Object.entries(branch.store)) validateArtifact(c, branch.fixture_id, role, artifact)
  const session = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role, intent = session.target_intent, projection = session.bundle_truth_projection.payload_value, registry = session.registry.canonical_row_value, request = session.request.payload_value, receipt = session.receipt.canonical_row_value
  assert(registry.target_intent_bytes_ref === intent.ref && registry.target_intent_bytes_sha256 === intent.bytes_sha256 && registry.target_intent_fingerprint === intent.fingerprint, 'session_target_registry_triple')
  assert(request.target_intent_bytes_ref === intent.ref && request.target_intent_bytes_sha256 === intent.bytes_sha256, 'session_request_target')
  assert(projection.target_intent_bytes_ref === intent.ref && projection.target_intent_bytes_sha256 === intent.bytes_sha256, 'session_projection_target')
  assert([projection.decoded_target_workspace_ref, projection.selected_current_partition_workspace_ref, projection.workspace_ref].every(value => value === intent.payload_value.workspace_ref), 'session_workspace')
  const partitionFields = c.case_server_session_principal_evidence_partition_schema.exact_keys, targetPartitionFingerprint = hash({ domain_ascii: c.target_partition_fingerprint_schema.domain_ascii, target_store: 'case_server_session_principal_evidence', ordered_partition_field_names: partitionFields, ordered_partition_field_values: partitionFields.map(field => intent.payload_value[field]) })
  assert(request.target_partition_fingerprint === targetPartitionFingerprint && session.bundle.payload_value.target_partition_fingerprint === targetPartitionFingerprint && projection.target_partition_fingerprint === targetPartitionFingerprint, 'session_target_partition')
  const committedAt = Date.parse(receipt.server_committed_at)
  for (const role of ['issuer_proof', 'evaluator_proof']) { const proof = session[role].payload_value; assert(Date.parse(proof.issued_at) < committedAt && committedAt < Date.parse(proof.expires_at), `proof_window:${role}`); assert(proof.scope_partition_fingerprint === targetPartitionFingerprint, `proof_partition:${role}`) }
  for (const side of ['issuer', 'evaluator']) {
    const proof = session[`${side}_proof`], nonce = session[`${side}_nonce_receipt`], bundle = session.bundle.payload_value, readSet = session.authority_read_set.payload_value, evidence = session.receipt_evidence.payload_value
    assert(bundle[`${side}_proof_ref`] === proof.ref && bundle[`${side}_proof_bytes_sha256`] === proof.bytes_sha256 && bundle[`${side}_proof_fingerprint`] === proof.fingerprint, `bundle_proof:${side}`)
    assert(readSet[`${side}_proof_ref`] === proof.ref && readSet[`${side}_proof_fingerprint`] === proof.fingerprint && readSet[`${side}_nonce_receipt_ref`] === nonce.ref && readSet[`${side}_nonce_receipt_fingerprint`] === nonce.fingerprint, `readset:${side}`)
    assert(evidence[`${side}_proof_ref`] === proof.ref && evidence[`${side}_nonce_receipt_ref`] === nonce.ref, `receipt_evidence:${side}`)
    assert(receipt[`${side}_proof_ref`] === proof.ref && receipt[`${side}_nonce_receipt_ref`] === nonce.ref, `receipt_proof:${side}`)
  }
  assert(receipt.request_bytes_ref === session.request.ref && receipt.target_row_bytes_ref === session.committed_target_row.content_addressed_artifact_ref && receipt.result_bytes_ref === session.result.ref, 'session_receipt_core')
  assert(registry.request_bytes_ref === session.request.ref && registry.committed_target_row_ref === session.committed_target_row.canonical_row_value.row_version_ref && registry.result_ref === session.result.ref && registry.receipt_ref === receipt.receipt_ref && registry.historical_response_ref === session.history.ref, 'session_registry_core')
  assert(session.history.payload_value.result_ref === session.result.ref && session.replay_payload.payload_value.committed_registry_row_ref === registry.registry_row_ref && session.replay_envelope.payload_value.payload_ref === session.replay_payload.ref, 'session_replay_core')
  const rootFixture = c.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed').artifact_store_by_role
  assert(rootFixture.registry.canonical_row_value.target_intent_bytes_ref === rootFixture.target_intent.ref && rootFixture.registry.canonical_row_value.target_intent_fingerprint === rootFixture.target_intent.fingerprint, 'ordinary_target_registry_triple')

  const universe = c.authority_operation_complete_active_persisted_schema_universe, operations = Object.entries(c.case_session_authority_operation_protocols.operations)
  const requestSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.request_schema`).sort(cp), targetSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.target_intent_schema`).sort(cp), proofSchemas = ['case_session_root_bootstrap_proof_schema','case_session_root_admin_capability_proof_schema','case_session_issuer_capability_proof_schema','case_session_evaluator_capability_proof_schema'].sort(cp), resultSchemas = operations.flatMap(([name, operation]) => Object.keys(operation.result_schema.variants).map(variant => `case_session_authority_operation_protocols.operations.${name}.result_schema.variants.${variant}`)).sort(cp)
  const targetStores = [...new Set(operations.map(([, operation]) => operation.target_store ?? operation.request_schema.properties.target_store.const))].sort(cp), committedTargets = targetStores.map(store => `authoritative_row_schemas.${store}`).sort(cp), stores = collectStores(c), payloadSchemas = [...new Set(stores.map(row => row.payload_schema_ref))].sort(cp), payloadVariants = payloadSchemas.flatMap(schema_ref => { const schema = get(c, schema_ref); return schema?.variants ? Object.keys(schema.variants).map(variant => ({ schema_ref, variant })) : [{ schema_ref, variant: 'UNAVAILABLE' }] }).sort((a, b) => cp(`${a.schema_ref}|${a.variant}`, `${b.schema_ref}|${b.variant}`))
  assert(operations.length === 15 && same(universe.request_schema_refs, requestSchemas) && requestSchemas.length === 15, 'request_universe')
  assert(same(universe.target_schema_refs, targetSchemas) && targetSchemas.length === 15, 'target_universe')
  assert(same(universe.proof_schema_refs, proofSchemas) && proofSchemas.length === 4, 'proof_universe')
  assert(same(universe.result_schema_refs, resultSchemas) && resultSchemas.length === 90, 'result_universe')
  assert(same(universe.committed_target_schema_refs, committedTargets) && committedTargets.length === 6, 'committed_target_universe')
  const targetAuthorities = c.authority_operation_committed_target_identity_authority.variants
  assert(same(Object.keys(targetAuthorities).sort(cp), targetStores), 'target_identity_variant_set')
  assert(new Set(Object.values(targetAuthorities).map(row => row.row_version_domain_ascii)).size === targetStores.length, 'target_identity_domains_unique')
  for (const store of targetStores) assert(targetAuthorities[store].row_schema_ref === `authoritative_row_schemas.${store}` && targetAuthorities[store].row_version_schema_version.includes(store.replaceAll('_', '-')), `target_identity_binding:${store}`)
  assert(same(universe.content_addressed_stores, stores) && same(universe.persisted_payload_schema_refs, payloadSchemas) && same(universe.persisted_payload_variants, payloadVariants), 'store_universe')
  assert(universe.fixtures_are_exemplars_not_inventory_authority === true, 'fixture_inventory_boundary')
  const index = c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index, kinds = new Set(index.map(row => row.identity_kind))
  assert(kinds.size === index.length && index.length === c.authority_operation_artifact_fingerprint_derivation_authority.exact_identity_kind_count, 'identity_uniqueness')
  for (const row of index) { const authority = get(c, row.exact_authority_ref); assert(authority && authority.schema_version === row.exact_authority_schema_version, `identity_authority:${row.identity_kind}`); assert(authority.identity_kind === row.identity_kind && authority.persisted_schema_ref === row.persisted_schema_ref && authority.persisted_schema_variant === row.persisted_schema_variant, `identity_row_binding:${row.identity_kind}`) }
  assert(Object.keys(c.authority_operation_complete_persisted_identity_authorities).length === index.length, 'identity_authority_count')
  for (const schemaRef of [...requestSchemas, ...targetSchemas, ...proofSchemas, ...resultSchemas]) {
    const variantEntry = payloadVariants.find(row => row.schema_ref === schemaRef)
    assert(variantEntry, `active_schema_persisted:${schemaRef}`)
    assert(kinds.has(`content_address:${schemaRef}:${variantEntry.variant}`) && kinds.has(`payload_fingerprint:${schemaRef}:${variantEntry.variant}`), `active_schema_identities:${schemaRef}`)
  }
  for (const schemaRef of committedTargets) assert(kinds.has(`row_version_ref:${schemaRef}`), `target_identity:${schemaRef}`)
  for (const row of c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows) if (row.exact_target_path_or_UNAVAILABLE !== 'UNAVAILABLE') assert(get(c, row.exact_target_path_or_UNAVAILABLE) !== undefined, `semantic_exact_target:${row.field_path}`)

  const resolution = c.authority_operation_artifact_resolution_authority, selected = c.authority_operation_selected_reference_traversal_authority, correlations = c.authority_operation_restart_correlation_authority
  assert(same(resolution.rows, traversal.resolution) && resolution.exact_resolution_count === traversal.resolution.length, 'resolution_rebuild')
  assert(same(selected.self_identity_allowlist, traversal.self) && same(selected.non_artifact_reference_allowlist, traversal.nonartifact), 'traversal_rebuild')
  assert(same(c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows, traversal.allow), 'allowlist_rebuild')
  assert(same(correlations.rows, traversal.correlations) && correlations.exact_row_count === traversal.correlations.length, 'correlation_rebuild')
  const equalityRows = []
  for (const item of payloadVariants) { const schema = schemaAt(c, item.schema_ref, item.variant); for (const field of schema.exact_keys.filter(refToken)) { const found = schemaCompanions(schema, field); equalityRows.push({ source_schema_ref: item.schema_ref, source_schema_variant: item.variant, reference_field: field, companion_bytes_fields: found.bytes, companion_fingerprint_fields: found.fingerprints }) } }
  for (const item of universe.persisted_row_variants) { const schema = schemaAt(c, item.schema_ref, item.variant); for (const field of schema.exact_keys.filter(refToken)) { const found = schemaCompanions(schema, field); equalityRows.push({ source_schema_ref: item.schema_ref, source_schema_variant: item.variant, reference_field: field, companion_bytes_fields: found.bytes, companion_fingerprint_fields: found.fingerprints }) } }
  const uniqueEquality = new Map(); for (const row of equalityRows) uniqueEquality.set(`${row.source_schema_ref}|${row.source_schema_variant}|${row.reference_field}`, row)
  const expectedEquality = [...uniqueEquality.values()].sort((a, b) => cp(canonicalR44(a), canonicalR44(b)))
  assert(same(c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows, expectedEquality), 'complete_schema_equalities')
  assert(c.authority_operation_explicit_nonartifact_reference_field_allowlist.generic_unmatched_runtime_or_external_fallback === 'forbidden', 'no_generic_fallback')
  assert(c.authority_operation_complete_active_persisted_schema_universe.request_schema_count === 15 && c.authority_operation_complete_active_persisted_schema_universe.target_schema_count === 15 && c.authority_operation_complete_active_persisted_schema_universe.proof_schema_count === 4 && c.authority_operation_complete_active_persisted_schema_universe.result_schema_count === 90 && c.authority_operation_complete_active_persisted_schema_universe.committed_target_store_count === 6, 'universe_counts')
  assert(c.authority_runtime_semantic_manifest.exact_paths.length === c.authority_runtime_semantic_manifest.rows.length && c.authority_runtime_semantic_manifest.exact_expected_count === c.authority_runtime_semantic_manifest.rows.length, 'manifest_shape')
  return { refs: traversal.resolution.length, correlations: traversal.correlations.length, identities: index.length, equalities: expectedEquality.length, semantic: c.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count, manifest: c.authority_runtime_semantic_manifest.exact_expected_count }
}

assert(readFileSync(join(root, path), 'utf8') === materializedR49Output, 'exact_materialization')
assert(same(materializedR49, JSON.parse(readFileSync(join(root, path), 'utf8'))), 'parsed_materialization')
const baseline = validate(materializedR49)
let attacks = 0
function attack(name, mutate) { const candidate = structuredClone(materializedR49); mutate(candidate); let rejected = false; try { validate(candidate) } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
attack('registry_fabricated_target_ref', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.registry.canonical_row_value.target_intent_bytes_ref = 'a'.repeat(64) })
attack('registry_target_fingerprint_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.registry.canonical_row_value.target_intent_fingerprint = 'b'.repeat(64) })
attack('projection_workspace_mismatch', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.bundle_truth_projection.payload_value.workspace_ref = 'workspace_wrong' })
attack('target_partition_stale_after_workspace_change', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.target_intent.payload_value.workspace_ref = 'workspace_changed' })
attack('issuer_proof_expiry_boundary', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.expires_at = '2026-09-14T12:00:00.000Z' })
attack('evaluator_proof_issue_boundary', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.evaluator_proof.payload_value.issued_at = '2026-09-14T12:00:00.000Z' })
attack('generic_nonartifact_fallback', c => { c.authority_operation_explicit_nonartifact_reference_field_allowlist.generic_unmatched_runtime_or_external_fallback = 'allow' })
attack('allowlist_internal_target', c => { c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows.push({ source_schema_ref: 'authority_operation_registry.row_union', source_schema_variant: 'original_committed', source_field: 'target_intent_bytes_ref', identity_kind: 'closed_runtime_or_external_authority_identity' }) })
attack('missing_request_schema', c => { c.authority_operation_complete_active_persisted_schema_universe.request_schema_refs.pop() })
attack('missing_result_schema', c => { c.authority_operation_complete_active_persisted_schema_universe.result_schema_refs.pop() })
attack('missing_committed_target_store', c => { c.authority_operation_complete_active_persisted_schema_universe.committed_target_schema_refs.pop() })
attack('fixture_inventory_authority', c => { c.authority_operation_complete_active_persisted_schema_universe.fixtures_are_exemplars_not_inventory_authority = false })
attack('missing_identity_kind', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.pop() })
attack('duplicate_identity_kind', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.push(structuredClone(c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index[0])) })
attack('nonexistent_identity_authority', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index[0].exact_authority_ref = 'does.not.exist' })
attack('semantic_exact_target_missing', c => { const row = c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.find(item => item.exact_target_path_or_UNAVAILABLE !== 'UNAVAILABLE'); row.exact_target_path_or_UNAVAILABLE = 'does.not.exist' })
attack('incomplete_schema_equality', c => { c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.pop() })
attack('stale_resolution', c => { c.authority_operation_artifact_resolution_authority.rows.pop() })
attack('stale_correlation', c => { c.authority_operation_restart_correlation_authority.rows.pop() })
attack('bundle_proof_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.bundle.payload_value.issuer_proof_ref = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.evaluator_proof.ref })
attack('request_target_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.request.payload_value.target_intent_bytes_ref = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.result.ref })
attack('root_registry_target_fingerprint_missing', c => { const f = c.authority_operation_replay_restart_fixtures.fixtures.find(item => item.fixture_id === 'restart_committed').artifact_store_by_role; f.registry.canonical_row_value.target_intent_fingerprint = '0'.repeat(64) })
attack('target_identity_alias', c => { c.authority_operation_committed_target_identity_authority.variants.account_access_standings = structuredClone(c.authority_operation_committed_target_identity_authority.variants.account_stable_actor_bindings) })

console.log(`ok: R49 exact; ${attacks} attacks; ${baseline.refs} exact-one refs; ${baseline.correlations} correlations; ${baseline.identities} complete-universe identities; ${baseline.equalities} schema equalities; ${baseline.semantic} semantic refs; ${baseline.manifest} manifest rows`)
