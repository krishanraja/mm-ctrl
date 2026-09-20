import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR50, materializedR50Output } from './materialize-ctrl-g24-trusted-ingress-r50.mjs'
import { canonicalR44, ownedSnapshotR44 } from './materialize-ctrl-g24-trusted-ingress-r44.mjs'

const root = process.cwd(), path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r50.json'
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
  assert(rule?.domain_ascii && same(rule.preimage_order, ['domain_ascii', 'schema_ref', 'canonical_bytes_sha256']), `declared_payload_rule:${artifact.declared_payload_fingerprint_schema_ref}`)
  return hash({ domain_ascii: rule.domain_ascii, schema_ref: schemaRef, canonical_bytes_sha256: bytesHash })
}
function selectedStore(c, schemaRef) {
  const found = []
  const walk = value => { if (!value || typeof value !== 'object') return; if (value.canonical_schema_ref === schemaRef && value.row_schema?.properties) found.push(value); for (const child of Object.values(value)) walk(child) }
  walk(c); const unique = [...new Set(found)]
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
    const bytes = canonicalR44(artifact.payload_value), bytesHash = sha(Buffer.from(bytes, 'utf8')), payloadFingerprint = derivePayloadFingerprint(c, role, artifact)
    assert(artifact.payload_canonical_bytes_utf8 === bytes && artifact.ref === bytesHash && artifact.bytes_sha256 === bytesHash && artifact.payload_bytes_sha256 === bytesHash, `raw_payload_content_address:${fixtureId}:${role}`)
    assert(artifact.payload_fingerprint === payloadFingerprint && artifact.fingerprint === payloadFingerprint, `payload_fingerprint:${fixtureId}:${role}`)
    if (schema.fingerprint_field) assert(artifact.payload_value[schema.fingerprint_field] === payloadFingerprint, `native_payload_fingerprint:${fixtureId}:${role}`)
    if (role === 'result') assert(artifact.payload_value.result_fingerprint === payloadFingerprint, `native_result_fingerprint:${fixtureId}`)
    if (artifact.payload_schema_ref === 'proof_nonce_receipt_payload_schema') {
      const rowSchema = c.proof_nonce_ledger.row_schema, row = artifact.stored_row_value, rowFingerprint = fingerprint(c, rowSchema, row)
      assert(row.nonce_receipt_ref === bytesHash && row.nonce_receipt_fingerprint === rowFingerprint && artifact.stored_row_fingerprint === rowFingerprint, `nonce_receipt:${fixtureId}:${role}`)
      return
    }
    const store = selectedStore(c, artifact.payload_schema_ref), rowSchema = store.row_schema, row = artifact.stored_row_value
    assert(artifact.selected_wrapper_schema_version === rowSchema.schema_version && artifact.declared_wrapper_fingerprint_schema_ref === rowSchema.fingerprint_ref, `wrapper_authority:${fixtureId}:${role}`)
    assert(row.artifact_ref === bytesHash && row.canonical_schema_ref === artifact.payload_schema_ref && row.canonical_bytes_sha256 === bytesHash && row.parsed_content_fingerprint === payloadFingerprint, `wrapper_bindings:${fixtureId}:${role}`)
    assert(row.canonical_bytes_b64url === Buffer.from(bytes, 'utf8').toString('base64url') && row.canonical_bytes_length === Buffer.byteLength(bytes), `wrapper_bytes:${fixtureId}:${role}`)
    const wrapperFingerprint = fingerprint(c, rowSchema, row)
    assert(row[rowSchema.fingerprint_field] === wrapperFingerprint && artifact.stored_row_fingerprint === wrapperFingerprint, `wrapper_fingerprint:${fixtureId}:${role}`)
    return
  }
  const schema = schemaAt(c, artifact.schema_ref, artifact.schema_variant ?? 'UNAVAILABLE'), row = artifact.canonical_row_value
  assert(schema?.exact_keys && same(Object.keys(row).sort(cp), [...schema.exact_keys].sort(cp)), `row_keys:${fixtureId}:${role}`)
  const bytes = canonicalR44(row), bytesHash = sha(Buffer.from(bytes, 'utf8')), rowFingerprint = fingerprint(c, schema, row)
  assert(artifact.canonical_row_bytes_utf8 === bytes && artifact.canonical_row_bytes_sha256 === bytesHash && artifact.content_addressed_artifact_ref === bytesHash, `raw_row_content_address:${fixtureId}:${role}`)
  assert(row[schema.fingerprint_field] === rowFingerprint && artifact.recorded_fingerprint === rowFingerprint, `row_fingerprint:${fixtureId}:${role}`)
  if (row.registry_row_ref || row.hold_row_ref) {
    const field = row.registry_row_ref ? 'registry_row_ref' : 'hold_row_ref'
    const expected = hash({ domain_ascii: schema.row_ref_domain_ascii, schema_version: schema.row_ref_schema_version, ordered_fields: schema.row_ref_preimage_included_fields.map(name => ({ field: name, value: row[name] })) })
    assert(row[field] === expected, `row_ref:${fixtureId}:${role}`)
  }
  if (row.row_version_ref) {
    const store = artifact.schema_ref.split('.').at(-1), authority = c.authority_operation_committed_target_identity_authority.variants[store]
    assert(authority, `row_version_authority:${fixtureId}:${role}`)
    const mutable = Object.keys(row).filter(name => name !== 'row_version_ref' && name !== schema.fingerprint_field).sort(cp).map(field => ({ field, value: row[field] }))
    const expected = hash({ domain_ascii: authority.row_version_domain_ascii, schema_version: authority.row_version_schema_version, ordered_complete_mutable_authority_fields: mutable })
    assert(row.row_version_ref === expected, `row_version:${fixtureId}:${role}`)
  }
}

function validateIdentityFormulaFixture(c, authority) {
  const formula = authority.formula, fixture = authority.executable_formula_fixture
  if (formula.formula_class === 'raw_sha256_bytes') {
    assert(fixture.input_kind === 'raw_bytes' && fixture.expected_identity === sha(Buffer.from(fixture.input_b64url, 'base64url')), `identity_formula_raw:${authority.identity_kind}`)
    return
  }
  const rule = get(c, formula.authority_ref)
  assert(rule && fixture.input_kind === 'declared_canonical_preimage' && fixture.exact_authority_ref === formula.authority_ref, `identity_formula_ref:${authority.identity_kind}`)
  const preimage = fixture.exact_preimage, schema = schemaAt(c, authority.persisted_schema_ref, authority.persisted_schema_variant)
  if (Array.isArray(rule.preimage_order)) {
    assert(fixture.declared_rule_kind === 'ordered_fingerprint_preimage' && same(Object.keys(preimage), rule.preimage_order) && preimage.domain_ascii === rule.domain_ascii, `identity_formula_ordered:${authority.identity_kind}`)
  } else if (rule.receipt_ref_preimage_schema) {
    assert(fixture.declared_rule_kind === 'receipt_ref_preimage' && same(Object.keys(preimage), rule.receipt_ref_preimage_schema.exact_keys) && preimage.domain_ascii === rule.receipt_ref_preimage_schema.domain_ascii && preimage.schema_version === schema.schema_version && preimage.variant === authority.persisted_schema_variant, `identity_formula_receipt:${authority.identity_kind}`)
    assert(same(preimage.ordered_fields.map(row => row.field), rule.receipt_ref_preimage_schema.ordered_fields), `identity_formula_receipt_fields:${authority.identity_kind}`)
  } else if (Array.isArray(rule.row_ref_preimage_included_fields)) {
    assert(fixture.declared_rule_kind === 'durable_row_ref_preimage' && same(Object.keys(preimage), ['domain_ascii', 'schema_version', 'ordered_fields']) && preimage.domain_ascii === rule.row_ref_domain_ascii && preimage.schema_version === rule.row_ref_schema_version, `identity_formula_row_ref:${authority.identity_kind}`)
    assert(same(preimage.ordered_fields.map(row => row.field), rule.row_ref_preimage_included_fields), `identity_formula_row_ref_fields:${authority.identity_kind}`)
  } else if (Array.isArray(rule.row_version_preimage_exact_keys)) {
    const excluded = new Set(['row_version_ref', schema.fingerprint_field]), fields = schema.exact_keys.filter(field => !excluded.has(field)).sort(cp)
    assert(fixture.declared_rule_kind === 'committed_row_version_preimage' && same(Object.keys(preimage), rule.row_version_preimage_exact_keys) && preimage.domain_ascii === rule.row_version_domain_ascii && preimage.schema_version === rule.row_version_schema_version, `identity_formula_row_version:${authority.identity_kind}`)
    assert(same(preimage.ordered_complete_mutable_authority_fields.map(row => row.field), fields), `identity_formula_row_version_fields:${authority.identity_kind}`)
  } else assert(false, `identity_formula_unexecutable:${authority.identity_kind}`)
  assert(fixture.expected_identity === hash(preimage), `identity_formula_digest:${authority.identity_kind}`)
}

function collectStores(c) {
  const rows = [], seen = new Set()
  const walk = (value, path = '$') => { if (!value || typeof value !== 'object') return; if (typeof value.canonical_schema_ref === 'string' && value.row_schema?.properties) { const key = `${value.canonical_schema_ref}|${value.row_schema.schema_version}|${path}`; if (!seen.has(key)) { seen.add(key); rows.push({ store_path: path.replace(/^\$\.?/, ''), payload_schema_ref: value.canonical_schema_ref, wrapper_schema_ref: `${path.replace(/^\$\.?/, '')}.row_schema`, wrapper_schema_version: value.row_schema.schema_version, wrapper_fingerprint_ref: value.row_schema.fingerprint_ref }) } } for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`) }
  walk(c); return rows.sort((a, b) => cp(`${a.payload_schema_ref}|${a.store_path}`, `${b.payload_schema_ref}|${b.store_path}`))
}
function schemaCompanions(schema, field) {
  const exact = {
    target_intent_bytes_ref: [['target_intent_bytes_sha256'], Object.hasOwn(schema.properties, 'target_intent_fingerprint') ? ['target_intent_fingerprint'] : []],
    authority_proof_bytes_ref: [['authority_proof_bytes_sha256'], Object.hasOwn(schema.properties, 'authority_proof_fingerprint') ? ['authority_proof_fingerprint'] : []],
    dual_proof_bundle_bytes_ref: [['dual_proof_bundle_bytes_sha256'], ['dual_proof_bundle_fingerprint']],
    target_row_bytes_ref: [['target_row_bytes_sha256'], ['target_row_fingerprint']],
    request_bytes_ref: [['request_bytes_sha256'], ['request_fingerprint']],
    result_bytes_ref: [['result_bytes_sha256'], ['result_fingerprint']],
    historical_response_ref: [['historical_response_bytes_sha256'], ['historical_response_fingerprint']],
    stored_historical_response_ref: [['stored_historical_response_bytes_sha256'], ['stored_historical_response_fingerprint']],
    replay_response_ref: [['replay_response_bytes_sha256'], ['replay_response_fingerprint']]
  }
  if (exact[field]) return { bytes: exact[field][0].filter(name => Object.hasOwn(schema.properties, name)), fingerprints: exact[field][1].filter(name => Object.hasOwn(schema.properties, name)) }
  const base = field.replace(/_ref(_or_unavailable)?$/, ''), suffix = field.endsWith('_or_unavailable') ? '_or_unavailable' : ''
  const bytes = [`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`, field === 'request_artifact_ref' ? 'request_artifact_sha256' : '', field === 'response_payload_ref' ? 'response_payload_bytes_sha256' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  const fingerprints = [`${base}_fingerprint${suffix}`, field === 'hold_row_ref' ? 'hold_fingerprint' : '', field === 'receipt_ref' ? 'receipt_precommit_fingerprint' : '', field === 'response_payload_ref' ? 'result_fingerprint' : ''].filter(candidate => candidate && Object.hasOwn(schema.properties, candidate))
  return { bytes: [...new Set(bytes)].sort(cp), fingerprints: [...new Set(fingerprints)].sort(cp) }
}
function targetSchema(schema, field) {
  const constField = field === 'target_intent_bytes_ref' ? 'target_intent_schema_ref' : field === 'authority_proof_bytes_ref' ? 'authority_proof_schema_ref' : field === 'dual_proof_bundle_bytes_ref' ? 'dual_proof_bundle_schema_ref' : null
  if (constField && schema.properties[constField]?.const) return { ref: schema.properties[constField].const, variant: 'UNAVAILABLE' }
  const fixed = { issuer_proof_ref: 'case_session_issuer_capability_proof_schema', evaluator_proof_ref: 'case_session_evaluator_capability_proof_schema', dual_proof_bundle_ref: 'session_dual_proof_bundle_schema', bundle_truth_projection_ref: 'session_dual_proof_bundle_truth_projection_schema', authority_read_set_ref: 'case_session_authority_read_set_schema', receipt_evidence_ref: 'session_dual_proof_receipt_evidence_schema', historical_response_ref: 'authority_operation_historical_response_schema', stored_historical_response_ref: 'authority_operation_historical_response_schema', replay_response_ref: 'authority_operation_historical_response_schema' }
  if (fixed[field]) return { ref: fixed[field], variant: 'UNAVAILABLE' }
  if (field.includes('registry_row_ref')) return { ref: 'authority_operation_registry.row_union', variant: 'DISCRIMINATED_BY_DURABLE_STATE' }
  if (field.includes('hold_row_ref')) return { ref: 'authority_operation_hold_store.row_union', variant: 'DISCRIMINATED_BY_PROOF_FAMILY_AND_EVIDENCE_KIND' }
  if (field === 'receipt_ref') return { ref: 'authority_operation_receipt_store.row_union', variant: 'DISCRIMINATED_BY_PROOF_FAMILY' }
  if (field.includes('result_ref') || field === 'response_payload_ref') return { ref: 'case_session_authority_operation_protocols.operations', variant: 'DISCRIMINATED_BY_OPERATION_AND_RESULT_BRANCH' }
  if (field.includes('row_version_ref')) return { ref: 'authoritative_row_schemas', variant: 'DISCRIMINATED_BY_TARGET_STORE' }
  return { ref: 'UNAVAILABLE', variant: 'UNAVAILABLE' }
}
const schemaReferenceFields = new Set(['authority_proof_schema_ref','dual_proof_bundle_schema_ref','evaluator_proof_schema_ref','hold_schema_ref','issuer_proof_schema_ref','response_schema_ref','target_intent_schema_ref','target_row_schema_ref'])
const optionalRawFields = new Set(['raw_bundle_ref_or_unavailable','raw_evaluator_proof_ref_or_unavailable','raw_issuer_proof_ref_or_unavailable','raw_proof_ref_or_unavailable','raw_target_ref_or_unavailable','session_hold_evidence_ref_or_unavailable'])
const externalFields = new Set(['account_binding_ref','account_binding_row_version_ref','account_ref','account_standing_ref','account_standing_row_version_ref','case_binding_ref','case_binding_row_version_ref','case_ref','decoded_target_workspace_ref','deployment_configuration_ref','evaluator_ref','evaluator_row_version_ref','evaluator_version_ref','evidence_ref','expected_head_row_version_ref','issuer_ref','issuer_row_version_ref','issuer_version_ref','live_principal_assertion_bytes_ref','pinned_runtime_attestor_ref','presented_principal_projection_bytes_ref','prior_anchor_version_ref','prior_row_version_ref','proof_ref','root_anchor_row_version_ref','selected_current_partition_workspace_ref','server_session_ref','session_evidence_ref','session_evidence_row_version_ref','session_ref','signer_1_ref','signer_2_ref','stable_actor_ref','trust_anchor_ref','trust_anchor_version_ref','verifier_ref','verifier_version_ref','workspace_ref'])
function classifyField(field) { if (schemaReferenceFields.has(field)) return 'closed_semantic_schema_reference'; if (optionalRawFields.has(field)) return 'closed_optional_raw_or_unavailable_identity'; if (externalFields.has(field)) return 'closed_runtime_or_external_authority_identity'; return 'internal_content_artifact_or_authority_row_reference' }
function targetKind(field, classification) { if (classification !== 'internal_content_artifact_or_authority_row_reference') return classification; if (field.includes('registry_row_ref')) return 'registry_row_ref'; if (field.includes('hold_row_ref')) return 'hold_row_ref'; if (field.includes('row_version_ref')) return 'row_version_ref'; if (field === 'receipt_ref') return 'receipt_ref'; return 'payload_or_authority_row_content_address' }

function identities(role, artifact) {
  if (artifact.fixture_wrapper_variant === 'content_addressed') return [{ role, identity_kind: 'payload_content_address', ref: artifact.ref, bytes: artifact.bytes_sha256, fp: artifact.fingerprint }]
  const value = artifact.canonical_row_value, rows = [{ role, identity_kind: 'authority_row_content_address', ref: artifact.content_addressed_artifact_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint }]
  if (value.registry_row_ref) rows.push({ role, identity_kind: 'registry_row_ref', ref: value.registry_row_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint })
  if (value.hold_row_ref) rows.push({ role, identity_kind: 'hold_row_ref', ref: value.hold_row_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint })
  if (value.row_version_ref) rows.push({ role, identity_kind: 'row_version_ref', ref: value.row_version_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint })
  if (role === 'receipt') { rows.push({ role, identity_kind: 'receipt_precommit_ref', ref: value.receipt_ref, bytes: artifact.canonical_row_bytes_sha256, fp: value.receipt_precommit_fingerprint }); rows.push({ role, identity_kind: 'receipt_final_ref', ref: value.receipt_ref, bytes: artifact.canonical_row_bytes_sha256, fp: artifact.recorded_fingerprint }) }
  return rows
}
function companionNames(sourceRole, field, value) {
  if (field === 'target_intent_bytes_ref') return ['target_intent_bytes_sha256', Object.hasOwn(value, 'target_intent_fingerprint') ? 'target_intent_fingerprint' : null]
  if (field === 'authority_proof_bytes_ref') return ['authority_proof_bytes_sha256', Object.hasOwn(value, 'authority_proof_fingerprint') ? 'authority_proof_fingerprint' : null]
  if (field === 'dual_proof_bundle_bytes_ref') return ['dual_proof_bundle_bytes_sha256', 'dual_proof_bundle_fingerprint']
  if (field === 'target_row_bytes_ref') return ['target_row_bytes_sha256', 'target_row_fingerprint']
  if (field === 'request_bytes_ref') return ['request_bytes_sha256', 'request_fingerprint']
  if (field === 'result_bytes_ref') return ['result_bytes_sha256', 'result_fingerprint']
  if (field === 'historical_response_ref') return ['historical_response_bytes_sha256', 'historical_response_fingerprint']
  if (field === 'stored_historical_response_ref') return ['stored_historical_response_bytes_sha256', 'stored_historical_response_fingerprint']
  if (field === 'replay_response_ref') return ['replay_response_bytes_sha256', 'replay_response_fingerprint']
  if (field === 'response_payload_ref') return ['response_payload_bytes_sha256', 'result_fingerprint']
  if (field === 'request_artifact_ref') return ['request_artifact_sha256', 'request_fingerprint']
  if (field === 'result_ref') return ['result_bytes_sha256', 'result_fingerprint']
  if (field === 'hold_result_ref') return ['hold_result_bytes_sha256', 'hold_result_fingerprint']
  if (field === 'hold_row_ref') return [null, sourceRole === 'replay_payload' ? 'hold_row_fingerprint' : 'hold_fingerprint']
  if (field === 'receipt_ref') return [null, sourceRole === 'result' ? 'receipt_precommit_fingerprint' : 'receipt_fingerprint']
  if (field === 'committed_target_row_ref') return ['committed_target_row_bytes_sha256', 'committed_target_row_fingerprint']
  if (field === 'target_row_version_ref') return [null, 'target_row_fingerprint']
  if (field === 'held_registry_row_ref') return [null, 'held_registry_row_fingerprint']
  if (field === 'committed_registry_row_ref') return [null, 'committed_registry_row_fingerprint']
  const suffix = field.endsWith('_or_unavailable') ? '_or_unavailable' : '', base = field.replace(/_ref(_or_unavailable)?$/, '')
  return [[`${base}_bytes_sha256${suffix}`, `${base}_sha256${suffix}`].find(candidate => Object.hasOwn(value, candidate)) ?? null, `${base}_fingerprint${suffix}`]
}
function deriveTraversal(c, classificationRows) {
  const classificationMap = new Map(classificationRows.map(row => [`${row.source_schema_ref}|${row.source_schema_variant}|${row.source_field}`, row]))
  const session = c.authority_operation_committed_receipt_identity_fixtures, branches = [...c.authority_operation_replay_restart_fixtures.fixtures.map(f => ({ fixture_id: f.fixture_id, store: f.artifact_store_by_role })), { fixture_id: session.fixture_id, store: session.artifact_store_by_role }]
  const resolution = [], self = [], nonartifact = []
  for (const branch of branches) {
    const all = Object.entries(branch.store).flatMap(([role, artifact]) => identities(role, artifact))
    for (const [sourceRole, artifact] of Object.entries(branch.store)) {
      const content = artifact.fixture_wrapper_variant === 'content_addressed', schemaRef = content ? artifact.payload_schema_ref : artifact.schema_ref, variant = (content ? artifact.payload_schema_variant : artifact.schema_variant) ?? 'UNAVAILABLE', schema = schemaAt(c, schemaRef, variant), value = content ? artifact.payload_value : artifact.canonical_row_value
      if (!schema?.exact_keys) continue
      for (const field of schema.exact_keys.filter(refToken)) {
        const reference = value[field], classification = classificationMap.get(`${schemaRef}|${variant}|${field}`)
        assert(classification, `missing_classification:${schemaRef}:${variant}:${field}`)
        if (typeof reference !== 'string' || reference === 'UNAVAILABLE') { nonartifact.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference ?? null, classification: 'closed_null_or_unavailable_sentinel' }); continue }
        if ((field === 'hold_row_ref' && sourceRole === 'hold') || (field === 'registry_row_ref' && sourceRole === 'registry') || (field === 'row_version_ref' && ['committed_target_row','issuer_registry_row','evaluator_registry_row'].includes(sourceRole))) { self.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
        let matches = all.filter(candidate => candidate.ref === reference), nonSelf = matches.filter(candidate => candidate.role !== sourceRole); if (nonSelf.length) matches = nonSelf
        if (!nonSelf.length && matches.length) { self.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: 'explicit_self_identity_allowlist' }); continue }
        if (matches.length > 1 && matches.every(candidate => candidate.role === 'receipt')) matches = matches.filter(candidate => candidate.identity_kind === (sourceRole === 'result' ? 'receipt_precommit_ref' : 'receipt_final_ref'))
        if (field === 'hold_row_ref') matches = matches.filter(candidate => candidate.identity_kind === 'hold_row_ref' && candidate.role === 'hold')
        if (field === 'held_registry_row_ref' || field === 'committed_registry_row_ref') matches = matches.filter(candidate => candidate.identity_kind === 'registry_row_ref')
        if (field === 'target_row_version_ref') matches = matches.filter(candidate => candidate.identity_kind === 'row_version_ref')
        if (!matches.length) { assert(!classification.internal_exact_one_required, `unresolved_internal:${branch.fixture_id}:${sourceRole}:${field}`); nonartifact.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, reference_literal: reference, classification: classification.classification }); continue }
        assert(matches.length === 1, `multiple_reference:${branch.fixture_id}:${sourceRole}:${field}`)
        const target = matches[0], [bytesField, fingerprintField] = companionNames(sourceRole, field, value), actualBytes = bytesField && Object.hasOwn(value, bytesField) ? value[bytesField] : 'UNAVAILABLE', actualFingerprint = fingerprintField && Object.hasOwn(value, fingerprintField) ? value[fingerprintField] : 'UNAVAILABLE'
        assert(actualBytes === 'UNAVAILABLE' || actualBytes === target.bytes, `reference_bytes:${branch.fixture_id}:${sourceRole}:${field}`)
        assert(actualFingerprint === 'UNAVAILABLE' || actualFingerprint === target.fp, `reference_fingerprint:${branch.fixture_id}:${sourceRole}:${field}`)
        resolution.push({ fixture_id: branch.fixture_id, source_role: sourceRole, source_schema_ref: schemaRef, source_schema_variant: variant, source_field: field, target_role: target.role, target_identity_kind: target.identity_kind, reference, companion_bytes_field_or_UNAVAILABLE: actualBytes === 'UNAVAILABLE' ? 'UNAVAILABLE' : bytesField, companion_bytes_sha256_or_UNAVAILABLE: actualBytes, companion_fingerprint_field_or_UNAVAILABLE: actualFingerprint === 'UNAVAILABLE' ? 'UNAVAILABLE' : fingerprintField, companion_fingerprint_or_UNAVAILABLE: actualFingerprint, exact_match_count: 1 })
      }
    }
  }
  const sort = rows => rows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b))); sort(resolution); sort(self); sort(nonartifact)
  const correlations = resolution.flatMap((row, index) => ['reference','companion_bytes_or_explicit_unavailable','companion_fingerprint_or_explicit_unavailable'].map(kind => ({ correlation_id: `r50:${String(index + 1).padStart(4, '0')}:${kind}`, ...row, correlation_kind: kind })))
  return { branches, resolution, self, nonartifact, correlations }
}

function validateManifest(c) {
  const registry = c.authority_runtime_semantic_reference_field_registry, paths = registry.independently_declared_source_paths
  const candidate = structuredClone(c)
  for (const key of registry.excluded_self_derived_paths) delete candidate[key]
  const sourceSnapshot = ownedSnapshotR44(candidate)
  const expectedSnapshot = hash({ domain_ascii: registry.source_snapshot_domain_ascii, exact_source_paths: paths, source_objects: Object.fromEntries(paths.map(path => [path, get(sourceSnapshot, path)])) })
  assert(expectedSnapshot === registry.source_snapshot_sha256 && expectedSnapshot === c.authority_runtime_semantic_manifest.source_snapshot_sha256, 'final_source_snapshot')
  const contract = c.authority_runtime_semantic_manifest_hash_contract, version = contract.schema_version, manifest = c.authority_runtime_semantic_manifest
  const contentHashes = {}
  for (const row of manifest.rows) {
    const expected = hash({ domain_ascii: contract.content_domain_ascii, manifest_hash_version: version, authority_path: row.authority_path, canonical_authority_snapshot: ownedSnapshotR44(get(c, row.authority_path)) })
    assert(expected === row.authority_content_sha256, `manifest_content:${row.authority_path}`); contentHashes[row.authority_path] = expected
    const direct = row.direct_dependency_paths.map(path => ({ authority_path: path, authority_content_sha256: contentHashes[path] ?? manifest.rows.find(item => item.authority_path === path)?.authority_content_sha256 }))
    const transitive = row.transitive_dependency_paths.map(path => ({ authority_path: path, authority_content_sha256: contentHashes[path] ?? manifest.rows.find(item => item.authority_path === path)?.authority_content_sha256 }))
    assert(row.direct_dependency_set_sha256 === hash({ domain_ascii: contract.dependency_domain_ascii, manifest_hash_version: version, authority_path: row.authority_path, dependency_scope: 'direct', canonical_sorted_dependency_rows: direct }), `manifest_direct:${row.authority_path}`)
    assert(row.transitive_dependency_set_sha256 === hash({ domain_ascii: contract.dependency_domain_ascii, manifest_hash_version: version, authority_path: row.authority_path, dependency_scope: 'transitive', canonical_sorted_dependency_rows: transitive }), `manifest_transitive:${row.authority_path}`)
  }
  assert(manifest.manifest_graph_sha256 === hash({ domain_ascii: contract.graph_domain_ascii, manifest_hash_version: version, manifest_rows: manifest.rows }), 'manifest_graph')
  const { manifest_envelope_seal_sha256, ...withoutSeal } = manifest
  assert(manifest_envelope_seal_sha256 === hash({ domain_ascii: contract.envelope_domain_ascii, manifest_hash_version: version, manifest_without_envelope_seal: withoutSeal }), 'manifest_envelope')
}

function validate(c) {
  assert(c.schema_version === 'ctrl.g24.trusted-ingress.r50.effective.v1', 'schema_version')
  assert(c.supersedes.commit === '1443d76220ecfede1c11a0c3e327b1b66624538e' && c.supersedes.tree === '20878619501306f16c7c00011a11ad14337f3f74', 'frozen_parent')
  assert(c.visible_surface_changes.length === 0 && c.external_actions_authorized.length === 0, 'closed_boundary')
  const primitives = c.authority_operation_persisted_identity_primitives
  for (const name of ['canonical_payload_content_address','canonical_authority_row_content_address','nonce_receipt_content_address']) { const rule = primitives[name]; assert(rule.domain_prefix === 'NONE' && rule.digest === 'sha256' && rule.exact_formula.startsWith('sha256_raw_') && rule.preimage_exact_keys.length === 1, `raw_identity_primitive:${name}`) }
  assert(primitives.generic_payload_fingerprint.domain_ascii === 'CTRL-G24-R49-PERSISTED-PAYLOAD' && primitives.generic_payload_fingerprint.exact_formula === 'sha256_of_existing_domain_separated_canonical_preimage' && primitives.raw_sha256_must_not_equal_domain_separated_hash_by_substitution === true, 'identity_separation')

  const sessionFixture = c.authority_operation_committed_receipt_identity_fixtures, session = sessionFixture.artifact_store_by_role
  const branches = [...c.authority_operation_replay_restart_fixtures.fixtures.map(f => ({ fixture_id: f.fixture_id, store: f.artifact_store_by_role })), { fixture_id: sessionFixture.fixture_id, store: session }]
  for (const branch of branches) for (const [role, artifact] of Object.entries(branch.store)) validateArtifact(c, branch.fixture_id, role, artifact)
  for (const role of ['issuer','evaluator']) {
    const proof = session[`${role}_proof`], authority = session[`${role}_registry_row`], key = session[`${role}_verifier_key`], proofValue = proof.payload_value, row = authority.canonical_row_value
    assert(proofValue[`${role}_ref`] === row[`${role}_ref`] && proofValue[`${role}_row_version_ref`] === row.row_version_ref && proofValue[`${role}_registry_fingerprint`] === authority.recorded_fingerprint, `proof_authority_join:${role}`)
    assert(proofValue.verifier_ref === key.payload_value.verifier_ref && proofValue.verifier_version_ref === key.payload_value.verifier_version_ref && proofValue.verifier_artifact_sha256 === key.ref, `proof_key_join:${role}`)
    const signedRule = c.proof_signed_preimages[role], signedPreimage = {}; for (const field of signedRule.field_order) signedPreimage[field] = field === 'domain_ascii' ? signedRule.domain_ascii : proofValue[field]
    const publicKey = createPublicKey({ key: Buffer.from(key.payload_value.public_key_spki_der_b64url, 'base64url'), format: 'der', type: 'spki' }), signature = Buffer.from(proofValue.signature_b64url, 'base64url')
    assert(signature.length === 64 && verify(null, Buffer.from(canonicalR44(signedPreimage), 'utf8'), publicKey, signature), `proof_signature:${role}`)
    const committedAt = Date.parse(session.receipt.canonical_row_value.server_committed_at)
    assert(Date.parse(proofValue.issued_at) < committedAt && committedAt < Date.parse(proofValue.expires_at), `proof_window:${role}`)
    const readSet = session.authority_read_set.payload_value, projection = session.bundle_truth_projection.payload_value
    assert(readSet[`${role}_ref`] === row[`${role}_ref`] && readSet[`${role}_row_version_ref`] === row.row_version_ref && readSet[`${role}_registry_fingerprint`] === authority.recorded_fingerprint, `readset_authority_join:${role}`)
    assert(projection[`selected_${role}_authority_fingerprint`] === authority.recorded_fingerprint, `projection_authority_join:${role}`)
  }
  const projection = session.bundle_truth_projection.payload_value, intent = session.target_intent.payload_value
  assert(projection.workspace_ref === intent.workspace_ref && projection.decoded_target_workspace_ref === intent.workspace_ref && projection.selected_current_partition_workspace_ref === intent.workspace_ref, 'session_workspace')
  const partitionFields = c.case_server_session_principal_evidence_partition_schema.exact_keys, targetPartitionFingerprint = hash({ domain_ascii: c.target_partition_fingerprint_schema.domain_ascii, target_store: 'case_server_session_principal_evidence', ordered_partition_field_names: partitionFields, ordered_partition_field_values: partitionFields.map(field => intent[field]) })
  assert(projection.target_partition_fingerprint === targetPartitionFingerprint && session.bundle.payload_value.target_partition_fingerprint === targetPartitionFingerprint && session.request.payload_value.target_partition_fingerprint === targetPartitionFingerprint, 'session_partition')
  for (const field of ['issuer_nonce_subject_fingerprint','evaluator_nonce_subject_fingerprint','issuer_verifier_identity_fingerprint','evaluator_verifier_identity_fingerprint']) {
    const rule = c.session_dual_proof_projection_formula_table.formulas.find(item => item.projection_field === field), preimage = {}
    const role = field.startsWith('issuer') ? 'issuer' : 'evaluator', proof = session[`${role}_proof`].payload_value, row = session[`${role}_registry_row`]
    const values = role === 'issuer' ? { selected_issuer_ref: row.canonical_row_value.issuer_ref, selected_issuer_row_version_ref: row.canonical_row_value.row_version_ref, selected_issuer_registry_fingerprint: row.recorded_fingerprint, proof_verifier_ref: proof.verifier_ref, proof_verifier_version_ref: proof.verifier_version_ref, proof_verifier_artifact_sha256: proof.verifier_artifact_sha256 } : { selected_evaluator_ref: row.canonical_row_value.evaluator_ref, selected_evaluator_row_version_ref: row.canonical_row_value.row_version_ref, selected_evaluator_registry_fingerprint: row.recorded_fingerprint, proof_verifier_ref: proof.verifier_ref, proof_verifier_version_ref: proof.verifier_version_ref, proof_verifier_artifact_sha256: proof.verifier_artifact_sha256 }
    for (const key of rule.ordered_preimage) preimage[key] = key === 'domain_ascii' ? rule.domain_ascii : values[key]
    assert(projection[field] === hash(preimage) && session.bundle.payload_value[field] === hash(preimage), `projection_formula:${field}`)
  }
  assert(projection.selected_issuer_verifier_fingerprint === projection.issuer_verifier_identity_fingerprint && projection.selected_evaluator_verifier_fingerprint === projection.evaluator_verifier_identity_fingerprint, 'selected_verifier_formula_join')

  const universe = c.authority_operation_complete_active_persisted_schema_universe, operations = Object.entries(c.case_session_authority_operation_protocols.operations), stores = collectStores(c)
  const requestSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.request_schema`).sort(cp), targetSchemas = operations.map(([name]) => `case_session_authority_operation_protocols.operations.${name}.target_intent_schema`).sort(cp), proofSchemas = ['case_session_root_bootstrap_proof_schema','case_session_root_admin_capability_proof_schema','case_session_issuer_capability_proof_schema','case_session_evaluator_capability_proof_schema'].sort(cp), resultSchemas = operations.flatMap(([name, operation]) => Object.keys(operation.result_schema.variants).map(variant => `case_session_authority_operation_protocols.operations.${name}.result_schema.variants.${variant}`)).sort(cp)
  const targetStores = [...new Set(operations.map(([, operation]) => operation.target_store ?? operation.request_schema.properties.target_store.const))].sort(cp), committedTargets = targetStores.map(store => `authoritative_row_schemas.${store}`).sort(cp), payloadSchemas = [...new Set(stores.map(row => row.payload_schema_ref))].sort(cp), payloadVariants = payloadSchemas.flatMap(schema_ref => { const schema = get(c, schema_ref); return schema?.variants ? Object.keys(schema.variants).map(variant => ({ schema_ref, variant })) : [{ schema_ref, variant: 'UNAVAILABLE' }] }).sort((a, b) => cp(`${a.schema_ref}|${a.variant}`, `${b.schema_ref}|${b.variant}`)), wrappers = stores.map(row => ({ store_path: row.store_path, schema_ref: row.wrapper_schema_ref, variant: 'UNAVAILABLE', schema_version: row.wrapper_schema_version, fingerprint_ref: row.wrapper_fingerprint_ref }))
  assert(operations.length === 15 && requestSchemas.length === 15 && targetSchemas.length === 15 && proofSchemas.length === 4 && resultSchemas.length === 90 && committedTargets.length === 6, 'core_universe_counts')
  assert(same(universe.request_schema_refs, requestSchemas) && same(universe.target_schema_refs, targetSchemas) && same(universe.proof_schema_refs, proofSchemas) && same(universe.result_schema_refs, resultSchemas) && same(universe.committed_target_schema_refs, committedTargets), 'core_universe')
  assert(same(universe.content_addressed_stores, stores) && same(universe.persisted_payload_variants, payloadVariants) && same(universe.persisted_wrapper_schemas, wrappers), 'persisted_store_universe')
  const allSchemaEntries = [...payloadVariants, ...wrappers.map(row => ({ schema_ref: row.schema_ref, variant: 'UNAVAILABLE' })), ...universe.persisted_row_variants]
  const classificationRows = [], equalityRows = []
  for (const item of allSchemaEntries) {
    const schema = schemaAt(c, item.schema_ref, item.variant); if (!schema?.exact_keys) continue
    for (const field of schema.exact_keys.filter(refToken)) {
      const classification = classifyField(field), companions = schemaCompanions(schema, field)
      classificationRows.push({ source_schema_ref: item.schema_ref, source_schema_variant: item.variant, source_field: field, source_field_type: schema.properties[field]?.type ?? 'const', classification, internal_exact_one_required: classification === 'internal_content_artifact_or_authority_row_reference' })
      const target = targetSchema(schema, field)
      equalityRows.push({ source_schema_ref: item.schema_ref, source_schema_variant: item.variant, source_field: field, source_field_type: schema.properties[field]?.type ?? 'const', target_schema_ref_or_UNAVAILABLE: target.ref, target_schema_variant_or_UNAVAILABLE: target.variant, target_identity_kind_or_classification: targetKind(field, classification), exact_one_resolution_required: classification === 'internal_content_artifact_or_authority_row_reference', companion_bytes_fields: companions.bytes.map(name => ({ field: name, type: schema.properties[name]?.type ?? 'const' })), companion_fingerprint_fields: companions.fingerprints.map(name => ({ field: name, type: schema.properties[name]?.type ?? 'const' })), target_intent_fingerprint_required_when_present: field === 'target_intent_bytes_ref' && Object.hasOwn(schema.properties, 'target_intent_fingerprint') })
    }
  }
  const sort = rows => rows.sort((a, b) => cp(canonicalR44(a), canonicalR44(b))), classMap = new Map(), equalityMap = new Map()
  for (const row of classificationRows) classMap.set(`${row.source_schema_ref}|${row.source_schema_variant}|${row.source_field}`, row)
  for (const row of equalityRows) equalityMap.set(`${row.source_schema_ref}|${row.source_schema_variant}|${row.source_field}`, row)
  const expectedClassifications = sort([...classMap.values()]), expectedEqualities = sort([...equalityMap.values()])
  assert(same(c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows, expectedClassifications), 'full_schema_classification')
  assert(same(c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows, expectedEqualities), 'full_schema_typed_equalities')
  const issueIssuer = expectedClassifications.filter(row => row.source_schema_ref.endsWith('issue_case_session_issuer.request_schema'))
  assert(issueIssuer.length === 5 && issueIssuer.filter(row => row.internal_exact_one_required).length === 2 && issueIssuer.filter(row => row.classification === 'closed_semantic_schema_reference').length === 2 && issueIssuer.filter(row => row.classification === 'closed_runtime_or_external_authority_identity').length === 1, 'issue_issuer_five_refs')
  for (const row of expectedEqualities) { const schema = schemaAt(c, row.source_schema_ref, row.source_schema_variant); assert(Object.hasOwn(schema.properties, row.source_field), `equality_source:${row.source_schema_ref}:${row.source_field}`); assert(row.target_schema_ref_or_UNAVAILABLE === 'UNAVAILABLE' || row.target_schema_variant_or_UNAVAILABLE.startsWith('DISCRIMINATED_BY_') || get(c, row.target_schema_ref_or_UNAVAILABLE) !== undefined, `equality_target:${row.source_schema_ref}:${row.source_field}`); for (const companion of [...row.companion_bytes_fields, ...row.companion_fingerprint_fields]) assert(schema.properties[companion.field]?.type === companion.type || (schema.properties[companion.field]?.const !== undefined && companion.type === 'const'), `equality_companion:${row.source_schema_ref}:${companion.field}`) }

  const identityIndex = c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index, kinds = new Set(identityIndex.map(row => row.identity_kind))
  assert(kinds.size === identityIndex.length && identityIndex.length === c.authority_operation_artifact_fingerprint_derivation_authority.exact_identity_kind_count, 'identity_unique')
  assert(wrappers.every(wrapper => kinds.has(`wrapper_fingerprint:${wrapper.store_path}:${wrapper.schema_version}`)), 'wrapper_identity_complete')
  for (const row of identityIndex) {
    const authority = get(c, row.exact_authority_ref); assert(authority?.schema_version === row.exact_authority_schema_version && authority.identity_kind === row.identity_kind, `identity_authority:${row.identity_kind}`)
    validateIdentityFormulaFixture(c, authority)
  }
  assert(Object.keys(c.authority_operation_complete_persisted_identity_authorities).length === identityIndex.length, 'identity_count')

  const traversal = deriveTraversal(c, expectedClassifications), resolution = c.authority_operation_artifact_resolution_authority, selected = c.authority_operation_selected_reference_traversal_authority, correlations = c.authority_operation_restart_correlation_authority
  assert(same(resolution.rows, traversal.resolution) && resolution.exact_resolution_count === traversal.resolution.length, 'resolution_rebuild')
  assert(same(selected.self_identity_allowlist, traversal.self) && same(selected.non_artifact_reference_allowlist, traversal.nonartifact), 'traversal_rebuild')
  assert(same(correlations.rows, traversal.correlations) && correlations.exact_row_count === traversal.correlations.length, 'correlation_rebuild')
  for (const row of c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows) if (row.exact_target_path_or_UNAVAILABLE !== 'UNAVAILABLE') assert(get(c, row.exact_target_path_or_UNAVAILABLE) !== undefined, `semantic_target:${row.field_path}`)
  validateManifest(c)
  return { attacks: 0, stores: stores.length, wrappers: wrappers.length, identities: identityIndex.length, classifications: expectedClassifications.length, equalities: expectedEqualities.length, refs: traversal.resolution.length, correlations: traversal.correlations.length, semantic: c.authority_runtime_semantic_reference_field_registry.exact_expected_occurrence_count, manifest: c.authority_runtime_semantic_manifest.exact_expected_count }
}

assert(readFileSync(join(root, path), 'utf8') === materializedR50Output, 'exact_materialization')
assert(same(materializedR50, JSON.parse(readFileSync(join(root, path), 'utf8'))), 'parsed_materialization')
const baseline = validate(materializedR50)
let attacks = 0
function attack(name, mutate) { const candidate = structuredClone(materializedR50); mutate(candidate); let rejected = false; try { validate(candidate) } catch { rejected = true } assert(rejected, `attack_not_rejected:${name}`); attacks += 1 }
attack('payload_content_address_domain_laundering', c => { c.authority_operation_persisted_identity_primitives.canonical_payload_content_address.domain_prefix = 'CTRL-G24-EVIL' })
attack('row_content_address_domain_laundering', c => { c.authority_operation_persisted_identity_primitives.canonical_authority_row_content_address.exact_formula = 'sha256_domain_separated' })
attack('nonce_ref_domain_laundering', c => { c.authority_operation_persisted_identity_primitives.nonce_receipt_content_address.preimage_exact_keys.push('domain_ascii') })
attack('missing_wrapper_identity', c => { c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index = c.authority_operation_artifact_fingerprint_derivation_authority.sole_active_identity_index.filter(row => !row.identity_kind.startsWith('wrapper_fingerprint:')).slice(1) })
attack('identity_formula_fixture_resealed_wrong', c => { const row = Object.values(c.authority_operation_complete_persisted_identity_authorities)[0]; row.executable_formula_fixture.expected_identity = '0'.repeat(64) })
attack('identity_formula_declared_preimage_changed', c => { const row = Object.values(c.authority_operation_complete_persisted_identity_authorities).find(candidate => candidate.executable_formula_fixture.declared_rule_kind === 'ordered_fingerprint_preimage'); get(c, row.formula.authority_ref).preimage_order.push('invented_field') })
attack('issuer_signature_substitution', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.signature_b64url = Buffer.alloc(64).toString('base64url') })
attack('evaluator_key_substitution', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.evaluator_verifier_key.payload_value.public_key_spki_der_b64url = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_verifier_key.payload_value.public_key_spki_der_b64url })
attack('issuer_registry_fingerprint_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.issuer_registry_fingerprint = '1'.repeat(64) })
attack('readset_evaluator_registry_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.authority_read_set.payload_value.evaluator_registry_fingerprint = '2'.repeat(64) })
attack('projection_selected_issuer_splice', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.bundle_truth_projection.payload_value.selected_issuer_authority_fingerprint = '3'.repeat(64) })
attack('issuer_nonce_formula_substitution', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.bundle.payload_value.issuer_nonce_subject_fingerprint = '4'.repeat(64) })
attack('evaluator_verifier_formula_substitution', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.bundle_truth_projection.payload_value.evaluator_verifier_identity_fingerprint = '5'.repeat(64) })
attack('proof_expiry_boundary', c => { c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.issuer_proof.payload_value.expires_at = c.authority_operation_committed_receipt_identity_fixtures.artifact_store_by_role.receipt.canonical_row_value.server_committed_at })
attack('classification_missing_issue_ref', c => { c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows = c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows.filter(row => !(row.source_schema_ref.endsWith('issue_case_session_issuer.request_schema') && row.source_field === 'target_intent_bytes_ref')) })
attack('internal_ref_classified_external', c => { const row = c.authority_operation_explicit_nonartifact_reference_field_allowlist.exact_rows.find(item => item.internal_exact_one_required); row.classification = 'closed_runtime_or_external_authority_identity'; row.internal_exact_one_required = false })
attack('typed_equality_missing', c => { c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.pop() })
attack('typed_equality_companion_removed', c => { const row = c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.companion_bytes_fields.length); row.companion_bytes_fields = [] })
attack('target_intent_fingerprint_requirement_removed', c => { const row = c.authority_operation_complete_schema_cross_artifact_equality_registry.exact_rows.find(item => item.target_intent_fingerprint_required_when_present); row.target_intent_fingerprint_required_when_present = false })
attack('selected_resolution_missing', c => { c.authority_operation_artifact_resolution_authority.rows.pop() })
attack('selected_correlation_missing', c => { c.authority_operation_restart_correlation_authority.rows.pop() })
attack('manifest_source_after_snapshot_mutation', c => { c.schema_change_manifest.caller_writer_or_precedence_extensions = 'allowed' })
attack('manifest_content_hash_substitution', c => { c.authority_runtime_semantic_manifest.rows[0].authority_content_sha256 = '6'.repeat(64) })
attack('manifest_graph_substitution', c => { c.authority_runtime_semantic_manifest.manifest_graph_sha256 = '7'.repeat(64) })
attack('semantic_exact_target_missing', c => { const row = c.authority_runtime_semantic_reference_field_registry.exact_occurrence_rows.find(item => item.exact_target_path_or_UNAVAILABLE !== 'UNAVAILABLE'); row.exact_target_path_or_UNAVAILABLE = 'does.not.exist' })

console.log(`ok: R50 exact; ${attacks} attacks; ${baseline.stores} stores; ${baseline.wrappers} wrapper schemas; ${baseline.identities} executable identities; ${baseline.classifications} full-schema classifications; ${baseline.equalities} typed equalities; ${baseline.refs} exact-one refs; ${baseline.correlations} correlations; ${baseline.semantic} semantic refs; ${baseline.manifest} manifest rows; 2/2 Ed25519 signatures`)
