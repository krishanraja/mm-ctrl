import { createHash, createPublicKey, verify } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r83'
const sourceFiles = ['01-effective-resolution.json', '02-trust-and-context-program.json', '03-semantic-set-program.json', '04-interaction-program.json', '05-correction-program.json', '06-external-program.json', '07-executable-vectors.json']
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sorted = values => [...values].sort((a, b) => String(a).localeCompare(String(b), 'en', { usage: 'sort', sensitivity: 'variant' }))
const byteSorted = values => [...values].sort((a, b) => Buffer.from(String(a)).compare(Buffer.from(String(b))))
const unique = values => values.length === new Set(values).size
const finiteJson = value => value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (Array.isArray(value) && value.every(finiteJson)) || (value && typeof value === 'object' && Object.values(value).every(finiteJson))
const canonicalValue = value => Array.isArray(value) ? value.map(canonicalValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])])) : value
const canonical = value => { if (!finiteJson(value)) throw new TypeError('non-finite or non-JSON value'); return JSON.stringify(canonicalValue(value)) }
const sha256 = bytes => createHash('sha256').update(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, 'utf8')).digest('hex')
const hashValue = value => sha256(canonical(value))
const fingerprint = (value, excluded) => { const copy = structuredClone(value); delete copy[excluded]; return hashValue(copy) }
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const gitBytes = (commit, path) => execFileSync('git', ['show', `${commit}:${path}`], { cwd: root })
const gitJson = (commit, path) => JSON.parse(gitBytes(commit, path).toString('utf8'))
const pointer = (value, path) => path.split('/').slice(1).reduce((cursor, token) => cursor[token.replaceAll('~1', '/').replaceAll('~0', '~')], value)
const clone = value => structuredClone(value)
const setAt = (object, path, value) => { let cursor = object; for (const key of path.slice(0, -1)) cursor = cursor[key]; cursor[path.at(-1)] = clone(value) }
const deleteAt = (object, path) => { let cursor = object; for (const key of path.slice(0, -1)) cursor = cursor[key]; delete cursor[path.at(-1)] }
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && same(byteSorted(Object.keys(value)), byteSorted(keys))

const modules = Object.fromEntries(sourceFiles.map(file => { const value = readJson(`${directory}/${file}`); return [value.module_id, value] }))
const resolution = modules.effective_resolution
const trust = modules.trust_and_context_program
const semantic = modules.semantic_set_program
const interaction = modules.interaction_program
const correction = modules.correction_program
const external = modules.external_program
const vectors = modules.executable_vectors
const specimens = vectors.specimens

const expectedTopKeys = {
  effective_resolution: ['schema_version', 'module_id', 'semantic_base', 'imported_exact_sections', 'r83_replacement_sections', 'inheritance_rule', 'unknown_or_conflicting_section', 'authority_still_closed'],
  trust_and_context_program: ['schema_version', 'module_id', 'canonicalization', 'fingerprint', 'exact_constants', 'trusted_authenticator_registry', 'authentication_event_required', 'answer_event_required', 'final_authority_event_required', 'normative_receipt_required', 'final_receipt_required', 'authority_proof_required', 'free_expression_confirmation_required', 'binding_context_required', 'rules', 'workload_or_model_issuer'],
  semantic_set_program: ['schema_version', 'module_id', 'profile_validation', 'derivation_registry', 'derived_profile_rules', 'fixture_authority_resolver', 'authoritative_conditional_state', 'conditional_dependency_rules', 'derived_fact_proof_required', 'derived_input_required', 'predicate_proof_required', 'dependency_result_required', 'disposition_classes', 'precedence', 'class_to_result', 'complete_set_rules', 'proof_may_apply_transition'],
  interaction_program: ['schema_version', 'module_id', 'session_state_required', 'unresolved_gap_set_required', 'question_reservation_required', 'krish_session_receipt_required', 'question_required', 'render_receipt_required', 'free_expression_interpretation_required', 'free_expression_render_required', 'canonical_case_context_required', 'copy_limits', 'technical_vocabulary_forbidden', 'routing_rules', 'question_rules', 'judgement_contracts', 'default_surface'],
  correction_program: ['schema_version', 'module_id', 'authoritative_dependency_graph_required', 'edge_required', 'edge_kind_values', 'sealed_closure_required', 'member_required', 'repair_receipt_required', 'repair_action_values', 'terminal_status_values', 'authoritative_referent_required', 'authoritative_referent_store', 'authoritative_fixture_graphs', 'validation_rules', 'receipt_current_steering_eligibility'],
  external_program: ['schema_version', 'module_id', 'authoritative_external_fact_policies', 'test_only_policy_registry', 'unsupported_external_assertion', 'states', 'event_required', 'protocols', 'lease_evidence_required', 'consume_evidence_required', 'terminal_receipt_required', 'effective_terminal_receipts', 'test_only_terminal_receipts', 'transaction_registry_contract', 'first_compare_and_set', 'second_compare_and_set', 'transitions', 'guard_rules', 'retry', 'steering_state'],
  executable_vectors: ['schema_version', 'module_id', 'specimens', 'authentication_vectors', 'semantic_profile_vectors', 'normative_vectors', 'final_authority_vectors', 'predicate_vectors', 'question_vectors', 'routing_vectors', 'correction_vectors', 'external_vectors']
}
for (const [id, keys] of Object.entries(expectedTopKeys)) check(`closed module ${id}`, exactKeys(modules[id], keys))
check('seven unique modules', Object.keys(modules).length === 7 && unique(Object.keys(modules)))
check('resolution records closed', resolution.imported_exact_sections.every(value => exactKeys(value, ['effective_section', 'path', 'json_pointer'])))
check('trust registry closed', trust.trusted_authenticator_registry.every(value => exactKeys(value, ['issuer_id', 'algorithm', 'public_key_spki_pem', 'allowed_methods', 'allowed_credentials']) && value.allowed_credentials.every(credential => exactKeys(credential, ['credential_id', 'named_human_id']))))
check('trust constants closed', exactKeys(trust.exact_constants, ['normative_receipt_type', 'normative_domain_separator', 'final_receipt_type', 'final_domain_separator', 'correction_domain_separator']))
check('semantic nested programs closed', exactKeys(semantic.profile_validation, ['schema_source', 'additional_fields', 'owner_binding_source', 'content_fingerprint', 'validity', 'accepted_brain_item', 'contrary_assertions', 'unregistered_dependency']) && semantic.derivation_registry.every(value => exactKeys(value, ['dependency_id', 'function_id', 'version', 'input_fact_kinds', 'freshness', 'non_widening'])) && exactKeys(semantic.disposition_classes, ['present', 'contradicted', 'missing', 'stale', 'unreadable', 'ambiguous', 'revoked']) && exactKeys(semantic.class_to_result, ['indeterminate', 'contradicted', 'present']))
check('semantic conditional set sealed', fingerprint(semantic.authoritative_conditional_state, 'set_seal') === semantic.authoritative_conditional_state.set_seal)
check('interaction nested programs closed', exactKeys(interaction.copy_limits, ['heading', 'question', 'answer_option_each', 'unknown_option', 'free_expression_option', 'visible_consequence', 'optional_note_label', 'primary_action_label', 'total_visible_characters', 'answer_options']) && exactKeys(interaction.default_surface, ['heading_count', 'question_count', 'answer_control_group_count', 'optional_note_count', 'primary_action_count', 'automatic_follow_up_count', 'technical_label_count']) && interaction.judgement_contracts.every(contract => exactKeys(contract, ['contract_id', 'judgement_kind', 'dependency_ids', 'heading', 'question', 'visible_consequence', 'answers']) && contract.answers.every(answer => exactKeys(answer, ['option', 'effect_id', 'patch']) && exactKeys(answer.patch, ['path', 'value']))))
check('correction authority fixtures closed', correction.authoritative_fixture_graphs.length >= 2 && correction.authoritative_fixture_graphs.every(fixture => exactKeys(fixture, ['graph', 'repairs']) && fixture.repairs.every(repair => exactKeys(repair, ['dependency_id', 'trigger_ref', 'challenged_proof_ref', 'dependency_use_ref', 'affected_artifact_ref', 'repair_action', 'history_preserved_ref', 'descendant_block_ref', 'terminal_status', 'resulting_version_ref']))))
check('correction referent store closed', exactKeys(correction.authoritative_referent_store, ['store_id', 'store_version', 'records']) && Array.isArray(correction.authoritative_referent_store.records) && correction.authoritative_referent_store.records.every(record => exactKeys(record, correction.authoritative_referent_required)) && unique(correction.authoritative_referent_store.records.map(record => record.ref)))
check('external nested programs closed', external.transitions.every(value => exactKeys(value, ['from', 'event_type', 'to', 'guard'])) && exactKeys(external.retry, ['new_nonce_on_retry', 'same_identity_same_bytes', 'same_identity_changed_bytes']) && exactKeys(external.transaction_registry_contract, ['store', 'idempotency_scope', 'consume_scope', 'atomic_compare_and_set', 'caller_supplied_registry', 'same_request_replay', 'cross_consumer_scope']))
check('vector specimen catalogue closed', exactKeys(specimens, ['authentication_events', 'answer_events', 'free_expressions', 'structured_interpretations', 'free_expression_renders', 'free_expression_confirmations', 'final_authority_events', 'decisions', 'case_context', 'question', 'empty_session', 'asked_session', 'binding_context', 'correction_graph', 'external_reservation', 'test_external_policy', 'test_consume_policy']))
check('R82 semantic base exact', same(resolution.semantic_base, { commit: '85572b6fc591e7fc3700567ab6903f7a7b7e3e0c', tree: '135d3910ed98e9e2b2648bf9253584cc372cee89', standing: 'vetoed_source_material_not_effective_authority' }))
check('R82 tree independently resolved', git(['rev-parse', `${resolution.semantic_base.commit}^{tree}`]) === resolution.semantic_base.tree)
check('R82 effective blob exact', git(['rev-parse', `${resolution.semantic_base.commit}:project-documentation/ctrl-evolution/g24-predicate-authority-r82/08-effective-contract.json`]) === '6677b3178bdff57b2df49675b7fdefcaf20dca93')
check('single exact inheritance rule', resolution.inheritance_rule === 'only_named_exact_sections_are_imported_every_other_r82_rule_is_replaced' && resolution.unknown_or_conflicting_section === 'reject_contract')

const imports = Object.fromEntries(resolution.imported_exact_sections.map(record => [record.effective_section, pointer(gitJson(resolution.semantic_base.commit, record.path), record.json_pointer)]))
check('every judgement has one visible contract', imports.atomic_judgement_registry.every(judgement => interaction.judgement_contracts.filter(contract => contract.dependency_ids.includes(judgement.dependency_id) && contract.judgement_kind === judgement.judgement_kind).length === 1))
const authorityMaterial = { imports, trust_and_context_program: trust, semantic_set_program: semantic, interaction_program: interaction, correction_program: correction, external_program: external }
const authorityBundle = sha256(`${canonical(authorityMaterial)}\n`)
const expectedEffective = { schema_version: 'ctrl.g24.predicate-authority.r83.effective-contract.v1', authority_bundle_fingerprint: authorityBundle, ...imports, trust_and_context_program: trust, semantic_set_program: semantic, interaction_program: interaction, correction_program: correction, external_program: external, executable_vectors: vectors, authority_still_closed: resolution.authority_still_closed }
const effectiveBytes = readFileSync(join(root, `${directory}/08-effective-contract.json`))
check('effective contract independently assembled', effectiveBytes.toString('utf8') === `${canonical(expectedEffective)}\n`)
const manifest = readJson(`${directory}/00-manifest.json`)
const records = sourceFiles.map(file => { const path = `${directory}/${file}`; const bytes = readFileSync(join(root, path)); const value = JSON.parse(bytes); return { path, module_id: value.module_id, schema_version: value.schema_version, bytes: bytes.length, sha256: sha256(bytes) } })
check('manifest schema and authority metadata exact', manifest.schema_version === 'ctrl.g24.predicate-authority.r83.manifest.v1' && manifest.standing === 'bound_local_contract_candidate_no_runtime_authority' && manifest.decision_id === 'DEC-20260916-g24-predicate-authority-r75' && canonical(manifest.semantic_base) === canonical(resolution.semantic_base) && manifest.resolution_rule === resolution.inheritance_rule)
check('manifest records exact', canonical(manifest.modules) === canonical(records))
check('manifest effective exact', canonical(manifest.effective_contract) === canonical({ path: `${directory}/08-effective-contract.json`, bytes: effectiveBytes.length, sha256: sha256(effectiveBytes) }))
const manifestWithout = { ...manifest }; delete manifestWithout.bundle_fingerprint
check('manifest fingerprint exact', manifest.bundle_fingerprint === sha256(`${canonical(manifestWithout)}\n`))
check('canonical algorithm honestly names UTF-16 order', trust.canonicalization === 'recursive_utf16_code_unit_sorted_json_utf8_no_whitespace_finite_json_numbers_only' && same(Object.keys(canonicalValue({ '\uE000': 1, '😀': 2 })), ['😀', '\uE000']))
check('non-finite values cannot canonicalize', (() => { try { canonical({ value: Number.NaN }); return false } catch { return true } })())

const ownerById = Object.fromEntries(imports.owner_registry.records.map(value => [value.dependency_id, value]))
const judgementById = Object.fromEntries(imports.atomic_judgement_registry.map(value => [value.dependency_id, value]))
const transitionById = Object.fromEntries(imports.transition_catalogue.map(value => [value.id, value]))
const roleHuman = { named_leader: 'leader-1', krish: 'krish', named_leader_via_krish_record: 'leader-1' }
function validateAuthentication(event, expectedHuman, at) {
  if (!finiteJson(event) || !exactKeys(event, trust.authentication_event_required) || typeof event.issuer_signature_base64 !== 'string' || typeof event.issued_at !== 'string' || typeof event.valid_until !== 'string' || typeof at !== 'string') return 'shape_invalid'
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  if (!issuer) return 'issuer_invalid'
  const credential = issuer.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!credential || credential.named_human_id !== event.named_human_id || event.named_human_id !== expectedHuman || !issuer.allowed_methods.includes(event.method)) return 'credential_invalid'
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { if (!verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64'))) return 'signature_invalid' } catch { return 'signature_invalid' }
  if (!(Date.parse(event.issued_at) <= Date.parse(at) && Date.parse(at) < Date.parse(event.valid_until))) return 'expired'
  return 'valid'
}
function validateAnswerEvent(event, expectedHuman, question, render, expectedOption) {
  if (!finiteJson(event) || !exactKeys(event, trust.answer_event_required) || typeof event.issuer_signature_base64 !== 'string' || typeof event.answered_at !== 'string') return false
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!issuer || !credential || credential.named_human_id !== expectedHuman || event.named_human_id !== expectedHuman || !issuer.allowed_methods.includes(event.method)) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) && event.question_id === question.question_id && event.question_version === question.question_version && event.selected_option === expectedOption && question.answer_options.includes(expectedOption) && event.render_receipt_fingerprint === render.receipt_fingerprint && Date.parse(render.rendered_at) <= Date.parse(event.answered_at) } catch { return false }
}
function validateFreeConfirmation(event, receipt, question, render, interpretation, interpretationRender) {
  if (!finiteJson(event) || !exactKeys(event, trust.free_expression_confirmation_required) || typeof event.issuer_signature_base64 !== 'string' || !finiteJson(interpretation) || !finiteJson(interpretationRender) || !exactKeys(interpretation, interaction.free_expression_interpretation_required) || !exactKeys(interpretationRender, interaction.free_expression_render_required)) return false
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  const text = specimens.free_expressions[receipt.free_expression_ref]
  if (!issuer || !credential || credential.named_human_id !== receipt.named_human_id || event.named_human_id !== receipt.named_human_id || event.authentication_event_ref !== receipt.authentication_event_ref || !issuer.allowed_methods.includes(event.method) || !text || !interpretation) return false
  if (fingerprint(interpretation, 'interpretation_fingerprint') !== interpretation.interpretation_fingerprint || fingerprint(interpretationRender, 'receipt_fingerprint') !== interpretationRender.receipt_fingerprint) return false
  if (interpretation.free_expression_ref !== receipt.free_expression_ref || interpretation.question_id !== question.question_id || interpretation.question_version !== question.question_version || interpretationRender.question_id !== question.question_id || interpretationRender.question_version !== question.question_version || interpretationRender.named_human_id !== receipt.named_human_id || interpretationRender.free_expression_fingerprint !== hashValue(text) || interpretationRender.plain_language_interpretation !== interpretation.plain_language_interpretation || !same(interpretationRender.decision_value, interpretation.decision_value) || interpretationRender.derived_effect_id !== interpretation.derived_effect_id || interpretationRender.displayed_consequence_text !== render.displayed_consequence_text) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) && event.question_id === question.question_id && event.question_version === question.question_version && event.free_expression_fingerprint === hashValue(text) && event.structured_interpretation_fingerprint === hashValue(interpretation) && event.interpretation_render_fingerprint === interpretationRender.receipt_fingerprint && event.decision_value_fingerprint === hashValue(interpretation.decision_value) && event.visible_consequence_fingerprint === hashValue(render.displayed_consequence_text) && Date.parse(render.rendered_at) <= Date.parse(interpretationRender.rendered_at) && Date.parse(interpretationRender.rendered_at) <= Date.parse(event.confirmed_at) && Date.parse(event.confirmed_at) <= Date.parse(receipt.issued_at) && Date.parse(event.confirmed_at) < Date.parse(receipt.valid_until) } catch { return false }
}
for (const vector of vectors.authentication_vectors) {
  const event = clone(specimens.authentication_events['auth-1']); if (vector.mutation) setAt(event, vector.mutation.path, vector.mutation.value)
  check(`authentication vector ${vector.id}`, validateAuthentication(event, event.named_human_id, '2026-09-16T09:00:00Z') === vector.expected)
}
check('no workload issuer registered', trust.workload_or_model_issuer === 'forbidden' && !trust.trusted_authenticator_registry.some(value => /model|workload/i.test(value.issuer_id)))

const typeValidators = {
  nonempty_string: value => typeof value === 'string' && value.length > 0,
  nullable_string: value => value === null || typeof value === 'string',
  string_array: value => Array.isArray(value) && value.every(item => typeof item === 'string'),
  string_array_nonempty: value => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string'),
  sha256: value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value),
  timestamp: value => typeof value === 'string' && !Number.isNaN(Date.parse(value))
}
const derivationById = Object.fromEntries(semantic.derivation_registry.map(value => [value.dependency_id, value]))
function resolveOwner(dependencyId) {
  if (ownerById[dependencyId]) return ownerById[dependencyId]
  const rules = semantic.conditional_dependency_rules
  if (![rules.responsible_human_owner_prefix, rules.revisit_date_prefix].some(prefix => dependencyId.startsWith(prefix))) return null
  return { dependency_id: dependencyId, fact_kind: dependencyId.split(':')[0], canonical_owner: rules.canonical_owner, source_type: rules.source_type, issuer_fact_kind_rule: 'exact_conditional_dependency_kind', authority_policy_version: imports.owner_registry.registry_version }
}
function authoritativeAssertion(dependencyId) {
  const resolver = semantic.fixture_authority_resolver
  const ref = `${resolver.assertion_ref_prefix}${dependencyId}`
  const bytes = Buffer.from(`${resolver.assertion_bytes_domain}:${dependencyId}`, 'utf8')
  return { ref, bytes, content_fingerprint: sha256(bytes) }
}
function authoritativeDerivedInputs(dependencyId) {
  const derivation = derivationById[dependencyId]
  if (!derivation) return []
  const context = semantic.fixture_authority_resolver.authoritative_context
  return derivation.input_fact_kinds.map(fact_kind => {
    const base = { fact_kind, subject_id: context.subject_id, case_id: context.case_id, purpose_id: context.purpose_id, permitted_audience: context.permitted_audience, allowed_uses: context.allowed_uses, consequence_class: context.consequence_class, valid_until: context.valid_until }
    return { fact_kind, receipt_fingerprint: hashValue({ domain: semantic.fixture_authority_resolver.derived_input_receipt_domain, ...base }), subject_id: base.subject_id, case_id: base.case_id, purpose_id: base.purpose_id, permitted_audience: base.permitted_audience, allowed_uses: base.allowed_uses, consequence_class: base.consequence_class, valid_until: base.valid_until }
  })
}
function buildProfile(dependencyId) {
  const owner = resolveOwner(dependencyId), derived = owner.canonical_owner === 'versioned_deterministic_derivation', derivation = derivationById[dependencyId], assertion = authoritativeAssertion(dependencyId), resolver = semantic.fixture_authority_resolver
  const context = resolver.authoritative_context
  return {
    fact_kind: owner.fact_kind, authority_species: derived ? resolver.derived_authority_species : resolver.mechanical_authority_species, tenant_id: context.tenant_id, leader_id: context.leader_id, subject_id: context.subject_id, case_id: context.case_id, engagement_id: context.engagement_id, purpose_id: context.purpose_id, permitted_audience: clone(context.permitted_audience), consequence_class: context.consequence_class, allowed_uses: clone(context.allowed_uses), source_type: owner.source_type, source_identity: derived ? `${derivation.function_id}:inputs-1` : `${owner.canonical_owner}:row-1`, schema_version: context.schema_version, row_version: context.row_version, content_fingerprint: assertion.content_fingerprint, atomic_assertion_or_span_ref: assertion.ref, speaker_or_issuer: owner.canonical_owner, epistemic_basis: derived ? resolver.derived_epistemic_basis : resolver.mechanical_epistemic_basis, issuer_fact_kind_rule: owner.issuer_fact_kind_rule, authority_policy_version: imports.owner_registry.registry_version, applicable_from: context.applicable_from, valid_until: context.valid_until, contrary_assertion_refs: [], contrary_disposition: 'none', brain_item_ref: null, brain_item_version: null, brain_standing: 'not_applicable', derivation_function_id: derived ? derivation.function_id : null, derivation_version: derived ? derivation.version : null
  }
}
function buildDerivedProof(dependencyId, profile) {
  const derivation = derivationById[dependencyId]
  if (!derivation) return null
  const inputs = authoritativeDerivedInputs(dependencyId)
  const value = { dependency_id: dependencyId, function_id: derivation.function_id, function_version: derivation.version, input_receipts: inputs, input_set_seal: hashValue(inputs), output_profile_fingerprint: hashValue(profile), proof_fingerprint: '' }
  value.proof_fingerprint = fingerprint(value, 'proof_fingerprint'); return value
}
function validateProfile(dependencyId, profile, at, derivedProof = buildDerivedProof(dependencyId, profile)) {
  const schema = imports.semantic_profile_schema, owner = resolveOwner(dependencyId), resolver = semantic.fixture_authority_resolver
  if (!owner || !finiteJson(profile) || !exactKeys(profile, schema.required)) return 'shape_invalid'
  for (const [field, rule] of Object.entries(schema.fields)) {
    const value = profile[field]
    if (typeof rule === 'string' && !typeValidators[rule]?.(value)) return 'shape_invalid'
    if (rule.enum && !rule.enum.includes(value)) return 'shape_invalid'
  }
  const authoritativeProfile = buildProfile(dependencyId)
  const derived = Boolean(derivationById[dependencyId]), assertion = authoritativeAssertion(dependencyId)
  if (profile.fact_kind !== owner.fact_kind || profile.speaker_or_issuer !== owner.canonical_owner || profile.source_type !== owner.source_type || profile.issuer_fact_kind_rule !== owner.issuer_fact_kind_rule || profile.authority_policy_version !== imports.owner_registry.registry_version || profile.authority_species !== (derived ? resolver.derived_authority_species : resolver.mechanical_authority_species) || profile.epistemic_basis !== (derived ? resolver.derived_epistemic_basis : resolver.mechanical_epistemic_basis)) return 'owner_invalid'
  if (profile.atomic_assertion_or_span_ref !== assertion.ref || profile.content_fingerprint !== assertion.content_fingerprint) return 'content_invalid'
  if (profile.brain_item_ref !== null || profile.brain_item_version !== null || profile.brain_standing !== 'not_applicable') return 'brain_standing_invalid'
  if (!same(profile.contrary_assertion_refs, []) || profile.contrary_disposition !== 'none') return 'contrary_assertion_invalid'
  if (!(Date.parse(profile.applicable_from) <= Date.parse(at) && Date.parse(at) < Date.parse(profile.valid_until))) return 'stale'
  const derivation = derivationById[dependencyId]
  if (derivation) {
    if (profile.authority_species !== 'derived_fact' || profile.epistemic_basis !== 'deterministically_derived' || profile.derivation_function_id !== derivation.function_id || profile.derivation_version !== derivation.version) return 'derivation_invalid'
    const inputAudience = ['leader-1', 'krish'], inputUses = ['predicate_evaluation']
    if (profile.permitted_audience.some(value => !inputAudience.includes(value)) || profile.allowed_uses.some(value => !inputUses.includes(value))) return 'derivation_non_widening_invalid'
    if (!derivedProof || !finiteJson(derivedProof) || !exactKeys(derivedProof, semantic.derived_fact_proof_required) || !Array.isArray(derivedProof.input_receipts) || !derivedProof.input_receipts.every(value => exactKeys(value, semantic.derived_input_required)) || fingerprint(derivedProof, 'proof_fingerprint') !== derivedProof.proof_fingerprint || derivedProof.dependency_id !== dependencyId || derivedProof.function_id !== derivation.function_id || derivedProof.function_version !== derivation.version || derivedProof.output_profile_fingerprint !== hashValue(profile)) return 'derivation_invalid'
    const actualKinds = derivedProof.input_receipts.map(value => value.fact_kind)
    if (!unique(actualKinds) || !same(byteSorted(actualKinds), byteSorted(derivation.input_fact_kinds)) || derivedProof.input_set_seal !== hashValue(derivedProof.input_receipts) || canonical(derivedProof.input_receipts) !== canonical(authoritativeDerivedInputs(dependencyId)) || canonical(derivedProof) !== canonical(buildDerivedProof(dependencyId, authoritativeProfile))) return 'derivation_input_set_invalid'
    if (derivedProof.input_receipts.some(value => value.subject_id !== profile.subject_id || value.case_id !== profile.case_id || value.purpose_id !== profile.purpose_id || profile.permitted_audience.some(audience => !value.permitted_audience.includes(audience)) || profile.allowed_uses.some(use => !value.allowed_uses.includes(use)) || value.consequence_class !== profile.consequence_class)) return 'derivation_non_widening_invalid'
    const minimumValidity = Math.min(...derivedProof.input_receipts.map(value => Date.parse(value.valid_until)))
    if (!(Date.parse(at) < minimumValidity) || Date.parse(profile.valid_until) !== minimumValidity) return 'derivation_freshness_invalid'
  } else if (profile.derivation_function_id !== null || profile.derivation_version !== null) return 'derivation_invalid'
  if (!authoritativeProfile || canonical(profile) !== canonical(authoritativeProfile)) return 'authority_record_mismatch'
  return 'valid'
}
for (const vector of vectors.semantic_profile_vectors) {
  const profile = buildProfile(vector.dependency_id)
  const derivedProof = buildDerivedProof(vector.dependency_id, profile)
  if (vector.mutation?.op === 'delete') deleteAt(profile, vector.mutation.path)
  else if (vector.mutation?.op === 'self_promote_brain') { profile.brain_item_ref = 'invented-item'; profile.brain_item_version = 'invented-version'; profile.brain_standing = 'accepted' }
  else if (vector.mutation?.op === 'invent_contrary') { profile.contrary_assertion_refs = ['invented-contrary']; profile.contrary_disposition = 'none' }
  else if (vector.mutation?.op === 'remove_derived_input') { derivedProof.input_receipts.pop(); derivedProof.input_set_seal = hashValue(derivedProof.input_receipts); derivedProof.output_profile_fingerprint = hashValue(profile); derivedProof.proof_fingerprint = fingerprint(derivedProof, 'proof_fingerprint') }
  else if (vector.mutation?.op === 'expire_derived_input') { derivedProof.input_receipts[0].valid_until = '2026-09-16T08:30:00Z'; derivedProof.input_set_seal = hashValue(derivedProof.input_receipts); derivedProof.output_profile_fingerprint = hashValue(profile); derivedProof.proof_fingerprint = fingerprint(derivedProof, 'proof_fingerprint') }
  else if (vector.mutation?.op === 'invent_derived_receipt') { derivedProof.input_receipts[0].receipt_fingerprint = '0'.repeat(64); derivedProof.input_set_seal = hashValue(derivedProof.input_receipts); derivedProof.output_profile_fingerprint = hashValue(profile); derivedProof.proof_fingerprint = fingerprint(derivedProof, 'proof_fingerprint') }
  else if (vector.mutation?.op === 'cross_context' || vector.mutation?.op === 'cross_context_derived') {
    Object.assign(profile, { tenant_id: 'tenant-attacker', leader_id: 'leader-attacker', subject_id: 'subject-attacker', case_id: 'case-attacker', purpose_id: 'purpose-attacker', permitted_audience: ['public'], allowed_uses: ['publish'], source_identity: 'attacker:row-9', row_version: 'row-attacker' })
    if (derivedProof) { derivedProof.output_profile_fingerprint = hashValue(profile); derivedProof.proof_fingerprint = fingerprint(derivedProof, 'proof_fingerprint') }
  }
  else if (vector.mutation) setAt(profile, vector.mutation.path, vector.mutation.value)
  check(`semantic profile vector ${vector.id}`, validateProfile(vector.dependency_id, profile, '2026-09-16T09:00:00Z', derivedProof) === vector.expected)
}

function buildCaseContext() { const value = clone(specimens.case_context); value.context_fingerprint = fingerprint(value, 'context_fingerprint'); return value }
function buildSession(name, namedHumanId = 'leader-1') { const value = clone(specimens[name]); value.named_human_id = namedHumanId; value.session_id = namedHumanId === 'krish' ? 'session-2' : 'session-1'; value.state_fingerprint = fingerprint(value, 'state_fingerprint'); return value }
function questionVisibleStrings(question) { return [question.heading, question.question, ...question.answer_options, question.unknown_option, question.free_expression_option, question.visible_consequence, question.optional_note_label, question.primary_action_label] }
function contractForDependency(dependencyId) { return interaction.judgement_contracts.find(contract => contract.dependency_ids.includes(dependencyId)) }
function buildQuestionForDependency(dependencyId) {
  const registry = judgementById[dependencyId], contract = contractForDependency(dependencyId)
  if (!registry || !contract || contract.judgement_kind !== registry.judgement_kind) return null
  const answerOptions = contract.answers.map(answer => answer.option)
  return { question_id: dependencyId === 'leader_next_consequential_decision_or_evidenced_value' ? 'question-1' : `question-${dependencyId}`, question_version: 'qv1', case_id: 'case-1', decision_id: 'decision-1', named_answer_owner: roleHuman[registry.owner_role], dependency_id: dependencyId, requested_value_kind: registry.judgement_kind, heading: contract.heading, question: contract.question, answer_options: answerOptions, unknown_option: 'I do not know yet', free_expression_option: 'Something else', answer_effect_refs: Object.fromEntries(contract.answers.map(answer => [answer.option, answer.effect_id])), visible_consequence: contract.visible_consequence, optional_note_label: 'Add context', primary_action_label: 'Keep answer', optional_depth_ref: `why-${dependencyId}`, source_reason_ref: 'case-1-gap-3' }
}
check('reference question is exact generated contract', canonical(specimens.question) === canonical(buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value')))
function resolveAnswerEffect(question, option) {
  const contract = contractForDependency(question.dependency_id), answer = contract?.answers.find(value => value.option === option)
  return answer && question.answer_effect_refs[option] === answer.effect_id ? answer : null
}
function applyAnswerEffect(before, answer) {
  if (!before || !answer || !imports.accepted_decision_state_schema.material_paths.includes(answer.patch.path)) return null
  const after = clone(before); after[answer.patch.path] = clone(answer.patch.value); return after
}
function validateQuestion(question, session, caseContext, decisions = specimens.decisions) {
  if (!finiteJson(question) || !finiteJson(session) || !finiteJson(caseContext) || !exactKeys(question, interaction.question_required) || !exactKeys(session, interaction.session_state_required) || !exactKeys(caseContext, interaction.canonical_case_context_required)) return 'shape_invalid'
  const visibleStringFields = ['question', 'heading', 'unknown_option', 'free_expression_option', 'visible_consequence', 'optional_note_label', 'primary_action_label']
  if (!visibleStringFields.every(field => typeof question[field] === 'string') || !Array.isArray(question.answer_options) || !question.answer_options.every(value => typeof value === 'string') || !question.answer_effect_refs || typeof question.answer_effect_refs !== 'object' || Array.isArray(question.answer_effect_refs) || !Array.isArray(session.question_receipt_ids) || !session.question_receipt_ids.every(value => typeof value === 'string') || !Number.isInteger(session.last_question_ordinal) || !Array.isArray(caseContext.case_terms) || !caseContext.case_terms.every(value => typeof value === 'string') || !Array.isArray(caseContext.required_question_concepts) || !caseContext.required_question_concepts.every(value => typeof value === 'string')) return 'shape_invalid'
  if (fingerprint(session, 'state_fingerprint') !== session.state_fingerprint || fingerprint(caseContext, 'context_fingerprint') !== caseContext.context_fingerprint) return 'context_invalid'
  const authoritativeSessionName = session.state_version === specimens.empty_session.state_version ? 'empty_session' : session.state_version === specimens.asked_session.state_version ? 'asked_session' : null
  if (!authoritativeSessionName || canonical(session) !== canonical(buildSession(authoritativeSessionName, question.named_answer_owner)) || canonical(caseContext) !== canonical(buildCaseContext())) return 'context_invalid'
  if (session.case_id !== caseContext.case_id || session.decision_id !== caseContext.decision_id || session.named_human_id !== question.named_answer_owner || question.case_id !== caseContext.case_id || question.decision_id !== caseContext.decision_id) return 'context_invalid'
  if (session.question_receipt_ids.length > 0 || session.last_question_ordinal > 0) return 'safe_hold_no_followup'
  const registry = judgementById[question.dependency_id]
  if (!registry || roleHuman[registry.owner_role] !== question.named_answer_owner || registry.judgement_kind !== question.requested_value_kind) return 'dependency_invalid'
  const expectedQuestion = buildQuestionForDependency(question.dependency_id)
  if (!expectedQuestion) return 'dependency_invalid'
  const lower = question.question.toLocaleLowerCase()
  if (caseContext.case_terms.filter(term => lower.includes(term.toLocaleLowerCase())).length < 2) return 'case_specificity_missing'
  if (!caseContext.required_question_concepts.some(term => lower.includes(term.toLocaleLowerCase()))) return 'required_concept_missing'
  const limits = interaction.copy_limits
  for (const [field, limit] of Object.entries(limits)) {
    if (field === 'total_visible_characters' || field === 'answer_options') continue
    if (field === 'answer_option_each') { if (question.answer_options.some(value => value.length > limit)) return 'copy_budget_exceeded'; continue }
    if (question[field]?.length > limit) return 'copy_budget_exceeded'
  }
  if (question.answer_options.length > limits.answer_options || questionVisibleStrings(question).reduce((sum, value) => sum + value.length, 0) > limits.total_visible_characters) return 'copy_budget_exceeded'
  if (questionVisibleStrings(question).some(value => interaction.technical_vocabulary_forbidden.some(term => value.toLocaleLowerCase().includes(term)))) return 'technical_vocabulary'
  if (!same(byteSorted(Object.keys(question.answer_effect_refs)), byteSorted(question.answer_options))) return 'effect_invalid'
  const before = decisions[caseContext.current_decision_ref]
  for (const option of question.answer_options) {
    const after = applyAnswerEffect(before, resolveAnswerEffect(question, option))
    if (!after || before.case_id !== after.case_id || before.decision_id !== after.decision_id || imports.accepted_decision_state_schema.material_paths.every(path => same(before[path], after[path]))) return 'effect_invalid'
  }
  if (Object.hasOwn(question.answer_effect_refs, question.unknown_option) || Object.hasOwn(question.answer_effect_refs, question.free_expression_option)) return 'effect_invalid'
  if (canonical(question) !== canonical(expectedQuestion)) return 'dependency_invalid'
  return 'valid'
}
for (const vector of vectors.question_vectors) {
  const question = clone(buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value'))
  if (vector.mutation?.op === 'repeat_option') question.answer_options[0] = question.answer_options[0].repeat(vector.mutation.count)
  else if (vector.mutation) setAt(question, vector.mutation.path, vector.mutation.value)
  check(`question vector ${vector.id}`, validateQuestion(question, buildSession(vector.session), buildCaseContext()) === vector.expected)
}

function buildGapSet(dependencyIds, namedHumanId) {
  const value = { case_id: 'case-1', decision_id: 'decision-1', named_human_id: namedHumanId, dependency_ids: byteSorted(dependencyIds), set_version: 'gap-set-v1', set_seal: '' }
  value.set_seal = fingerprint(value, 'set_seal')
  return value
}
const sessionAuthorityService = (() => {
  const reservations = new Map()
  const route = (gapSet, session, caseContext) => {
    if (!finiteJson(gapSet) || !exactKeys(gapSet, interaction.unresolved_gap_set_required) || !Array.isArray(gapSet.dependency_ids) || !gapSet.dependency_ids.length || !gapSet.dependency_ids.every(value => typeof value === 'string') || !unique(gapSet.dependency_ids) || fingerprint(gapSet, 'set_seal') !== gapSet.set_seal) return { status: 'shape_invalid' }
    if (validateQuestion(buildQuestionForDependency(gapSet.dependency_ids[0]), session, caseContext) !== 'valid') return { status: 'session_invalid' }
    if (gapSet.case_id !== session.case_id || gapSet.decision_id !== session.decision_id || gapSet.named_human_id !== session.named_human_id || gapSet.dependency_ids.some(id => roleHuman[judgementById[id]?.owner_role] !== gapSet.named_human_id)) return { status: 'binding_invalid' }
    const key = `${gapSet.case_id}|${gapSet.decision_id}|${gapSet.named_human_id}|${session.state_version}`
    if (reservations.has(key)) return { status: 'already_reserved', receipt: clone(reservations.get(key)) }
    if (gapSet.dependency_ids.length === 1) {
      const receipt = { reservation_id: `question-reservation-${gapSet.named_human_id}`, case_id: gapSet.case_id, decision_id: gapSet.decision_id, named_human_id: gapSet.named_human_id, dependency_id: gapSet.dependency_ids[0], session_state_version: session.state_version, gap_set_seal: gapSet.set_seal, reserved_ordinal: 1, reservation_fingerprint: '' }
      receipt.reservation_fingerprint = fingerprint(receipt, 'reservation_fingerprint'); reservations.set(key, receipt)
      return { status: 'direct_question_reserved', receipt: clone(receipt) }
    }
    const receipt = { session_route_id: `krish-session-${gapSet.named_human_id}`, case_id: gapSet.case_id, decision_id: gapSet.decision_id, named_human_id: gapSet.named_human_id, dependency_ids: clone(gapSet.dependency_ids), gap_set_seal: gapSet.set_seal, agenda: gapSet.dependency_ids.map(id => contractForDependency(id)?.heading).filter(Boolean), route: 'one_krish_led_session', receipt_fingerprint: '' }
    receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint'); reservations.set(key, receipt)
    return { status: 'krish_session_reserved', receipt: clone(receipt) }
  }
  return Object.freeze({ route, resetForConformance: () => reservations.clear() })
})()
for (const vector of vectors.routing_vectors) {
  sessionAuthorityService.resetForConformance()
  const human = vector.named_human_id, gapSet = buildGapSet(vector.dependency_ids, human), session = buildSession('empty_session', human)
  const first = sessionAuthorityService.route(gapSet, session, buildCaseContext())
  const actual = vector.repeat ? `${first.status}|${sessionAuthorityService.route(gapSet, session, buildCaseContext()).status}` : first.status
  check(`routing vector ${vector.id}`, actual === vector.expected)
}

function buildRenderReceipt(question = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value')) {
  const value = { render_receipt_id: question.question_id === 'question-1' ? 'render-1' : `render-${question.dependency_id}`, session_id: question.named_answer_owner === 'krish' ? 'session-2' : 'session-1', session_state_version: 'session-v1', question_id: question.question_id, question_version: question.question_version, dependency_id: question.dependency_id, named_human_id: question.named_answer_owner, displayed_consequence_text: question.visible_consequence, question_payload_fingerprint: hashValue(question), rendered_at: '2026-09-16T08:30:00Z', receipt_fingerprint: '' }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  return value
}
function buildNormativeReceipt(question = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value'), selectedOption = question.answer_options[0], humanId = 'leader-1', authRef = 'auth-1', answerEventRef = null) {
  const beforeRef = specimens.case_context.current_decision_ref, answerEffect = resolveAnswerEffect(question, selectedOption), afterRef = answerEffect ? `decision-effect:${answerEffect.effect_id}` : null
  const before = specimens.decisions[beforeRef], after = applyAnswerEffect(before, answerEffect)
  const changed = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  const render = buildRenderReceipt(question)
  const value = {
    receipt_type: trust.exact_constants.normative_receipt_type, domain_separator: trust.exact_constants.normative_domain_separator, attestation_id: `att-${question.dependency_id}`, question_id: question.question_id, question_version: question.question_version, dependency_id: question.dependency_id, named_human_id: humanId, authentication_event_ref: authRef, answer_event_ref: answerEventRef ?? `answer-${question.dependency_id}-${question.answer_options.indexOf(selectedOption) + 1}`, owned_judgement_kind: question.requested_value_kind, answer_status: 'selected', selected_option: selectedOption, free_expression_ref: null, free_expression_interpretation_ref: null, free_expression_interpretation_render_ref: null, free_expression_confirmation_ref: null, accepted_decision_before_ref: beforeRef, accepted_decision_before_fingerprint: hashValue(before), accepted_decision_after_ref: afterRef, accepted_decision_after_fingerprint: hashValue(after), accepted_decision_changed_paths: changed, render_receipt_ref: render.render_receipt_id, displayed_consequence_text: render.displayed_consequence_text, visible_consequence_fingerprint: hashValue(render.displayed_consequence_text), subject_id: 'leader-1', case_id: 'case-1', purpose_id: 'purpose-1', permitted_audience: ['leader-1', 'krish'], authority_bundle_fingerprint: authorityBundle, issued_at: '2026-09-16T08:35:00Z', valid_until: '2026-09-16T09:35:00Z', receipt_fingerprint: ''
  }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  return { receipt: value, render }
}
function validateRender(render, question) {
  return finiteJson(render) && exactKeys(render, interaction.render_receipt_required) && fingerprint(render, 'receipt_fingerprint') === render.receipt_fingerprint && render.question_id === question.question_id && render.question_version === question.question_version && render.dependency_id === question.dependency_id && render.named_human_id === question.named_answer_owner && render.question_payload_fingerprint === hashValue(question) && render.displayed_consequence_text === question.visible_consequence
}
function validateNormative(receipt, consumeAt, question, render, binding) {
  if (!finiteJson(receipt) || !finiteJson(question) || !finiteJson(render) || !finiteJson(binding) || !exactKeys(receipt, trust.normative_receipt_required) || !Array.isArray(receipt.accepted_decision_changed_paths) || !receipt.accepted_decision_changed_paths.every(value => typeof value === 'string') || typeof consumeAt !== 'string') return 'shape_invalid'
  if (typeof receipt.attestation_id !== 'string' || receipt.attestation_id.length === 0) return 'shape_invalid'
  if (fingerprint(receipt, 'receipt_fingerprint') !== receipt.receipt_fingerprint) return 'fingerprint_invalid'
  if (receipt.receipt_type !== trust.exact_constants.normative_receipt_type || receipt.domain_separator !== trust.exact_constants.normative_domain_separator) return 'constant_invalid'
  if (!validateRender(render, question) || receipt.render_receipt_ref !== render.render_receipt_id || receipt.question_id !== question.question_id || receipt.question_version !== question.question_version || receipt.displayed_consequence_text !== render.displayed_consequence_text || receipt.visible_consequence_fingerprint !== hashValue(render.displayed_consequence_text)) return 'render_binding_invalid'
  const expectedQuestion = buildQuestionForDependency(receipt.dependency_id)
  const registry = judgementById[receipt.dependency_id], selected = receipt.answer_status === 'selected', free = receipt.answer_status === 'free_expression_confirmed'
  if (canonical(question) !== canonical(expectedQuestion) || !registry || (!selected && !free) || receipt.dependency_id !== question.dependency_id || receipt.named_human_id !== question.named_answer_owner || receipt.owned_judgement_kind !== registry.judgement_kind || receipt.owned_judgement_kind !== question.requested_value_kind) return 'question_binding_invalid'
  const interpretation = free ? specimens.structured_interpretations[receipt.free_expression_interpretation_ref] : null
  const interpretationRender = free ? specimens.free_expression_renders[receipt.free_expression_interpretation_render_ref] : null
  const answerEffect = selected
    ? resolveAnswerEffect(question, receipt.selected_option)
    : interpretation && typeof interpretation.plain_language_interpretation === 'string' && interpretation.plain_language_interpretation.length > 0 && exactKeys(interpretation.decision_value, ['path', 'value']) && imports.accepted_decision_state_schema.material_paths.includes(interpretation.decision_value.path) ? { effect_id: interpretation.derived_effect_id, patch: interpretation.decision_value } : null
  const expectedAfterRef = answerEffect ? (selected ? `decision-effect:${answerEffect.effect_id}` : `decision-interpretation:${interpretation.interpretation_id}`) : null
  if (selected && (!question.answer_options.includes(receipt.selected_option) || expectedAfterRef !== receipt.accepted_decision_after_ref || receipt.free_expression_ref !== null || receipt.free_expression_interpretation_ref !== null || receipt.free_expression_interpretation_render_ref !== null || receipt.free_expression_confirmation_ref !== null)) return 'question_binding_invalid'
  if (free && (receipt.selected_option !== question.free_expression_option || !receipt.free_expression_ref || !receipt.free_expression_interpretation_ref || !receipt.free_expression_interpretation_render_ref || !receipt.free_expression_confirmation_ref || !answerEffect || expectedAfterRef !== receipt.accepted_decision_after_ref || !validateFreeConfirmation(specimens.free_expression_confirmations[receipt.free_expression_confirmation_ref], receipt, question, render, interpretation, interpretationRender))) return 'free_confirmation_invalid'
  if (validateAuthentication(specimens.authentication_events[receipt.authentication_event_ref], receipt.named_human_id, consumeAt) !== 'valid') return 'authentication_invalid'
  const answerEvent = specimens.answer_events[receipt.answer_event_ref]
  if (selected && (!validateAnswerEvent(answerEvent, receipt.named_human_id, question, render, receipt.selected_option) || !(Date.parse(answerEvent.answered_at) <= Date.parse(receipt.issued_at) && Date.parse(receipt.issued_at) <= Date.parse(receipt.valid_until)))) return 'question_binding_invalid'
  for (const field of ['subject_id', 'case_id', 'purpose_id', 'permitted_audience', 'authority_bundle_fingerprint']) if (!same(receipt[field], binding[field])) return 'binding_invalid'
  if (receipt.accepted_decision_before_ref !== specimens.case_context.current_decision_ref) return 'decision_invalid'
  const before = specimens.decisions[receipt.accepted_decision_before_ref], after = applyAnswerEffect(before, answerEffect)
  if (!before || !after || hashValue(before) !== receipt.accepted_decision_before_fingerprint || hashValue(after) !== receipt.accepted_decision_after_fingerprint || before.case_id !== receipt.case_id || after.case_id !== receipt.case_id || before.decision_id !== question.decision_id || after.decision_id !== question.decision_id) return 'decision_invalid'
  const changed = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  if (changed.length === 0 || !same(changed, byteSorted(receipt.accepted_decision_changed_paths))) return 'decision_invalid'
  if (!(Date.parse(render.rendered_at) <= Date.parse(receipt.issued_at) && Date.parse(receipt.issued_at) <= Date.parse(consumeAt) && Date.parse(consumeAt) < Date.parse(receipt.valid_until))) return 'expired'
  return 'valid'
}
const binding = { ...clone(specimens.binding_context), authority_bundle_fingerprint: authorityBundle }
for (const vector of vectors.normative_vectors) {
  const dependencyId = vector.dependency_id ?? 'leader_next_consequential_decision_or_evidenced_value', question = buildQuestionForDependency(dependencyId), selectedOption = question.answer_options[vector.option_index ?? 0], built = buildNormativeReceipt(question, selectedOption, question.named_answer_owner, question.named_answer_owner === 'krish' ? 'auth-2' : 'auth-1'), receipt = built.receipt
  if (['free_expression_valid', 'free_expression_late', 'free_expression_mismatch'].includes(vector.mutation?.op)) {
    const interpretation = specimens.structured_interpretations['interpretation-1'], after = applyAnswerEffect(specimens.decisions[receipt.accepted_decision_before_ref], { effect_id: interpretation.derived_effect_id, patch: interpretation.decision_value })
    receipt.answer_status = 'free_expression_confirmed'; receipt.selected_option = question.free_expression_option; receipt.answer_event_ref = null; receipt.free_expression_ref = 'free-1'; receipt.free_expression_interpretation_ref = 'interpretation-1'; receipt.free_expression_interpretation_render_ref = 'interpretation-render-1'; receipt.free_expression_confirmation_ref = 'confirm-1'; receipt.accepted_decision_after_ref = `decision-interpretation:${interpretation.interpretation_id}`; receipt.accepted_decision_after_fingerprint = hashValue(after); receipt.accepted_decision_changed_paths = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(specimens.decisions[receipt.accepted_decision_before_ref][path], after[path])))
    receipt.issued_at = '2026-09-16T08:37:00Z'
    if (vector.mutation.op === 'free_expression_late') receipt.valid_until = '2026-09-16T08:35:30Z'
    if (vector.mutation.op === 'free_expression_mismatch') receipt.accepted_decision_after_ref = 'decision-effect:value-independent-quality'
  } else if (vector.mutation) setAt(receipt, vector.mutation.path, vector.mutation.value)
  receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint')
  check(`normative vector ${vector.id}`, validateNormative(receipt, vector.consume_at ?? binding.server_commit_time, question, built.render, binding) === vector.expected)
}

function buildFinalReceipt() {
  const value = { receipt_type: trust.exact_constants.final_receipt_type, domain_separator: trust.exact_constants.final_domain_separator, authority_receipt_id: 'final-1', authority_proofs: [{ named_human_id: 'leader-1', authentication_event_ref: 'auth-1', authority_event_ref: 'final-authority-leader-1' }, { named_human_id: 'krish', authentication_event_ref: 'auth-2', authority_event_ref: 'final-authority-krish' }], transition_id: binding.transition_id, subject_id: binding.subject_id, case_id: binding.case_id, purpose_id: binding.purpose_id, permitted_audience: binding.permitted_audience, predecessor_version: binding.predecessor_version, predicate_proof_fingerprint: binding.predicate_proof_fingerprint, authority_bundle_fingerprint: authorityBundle, render_receipt_ref: binding.render_receipt_ref, displayed_consequence_text: binding.displayed_consequence_text, visible_consequence_fingerprint: hashValue(binding.displayed_consequence_text), reserved_transition_receipt_version: binding.reserved_transition_receipt_version, server_commit_time: binding.server_commit_time, valid_until: '2026-09-16T09:30:00Z', authority_receipt_fingerprint: '' }
  value.authority_receipt_fingerprint = fingerprint(value, 'authority_receipt_fingerprint')
  return value
}
function validateFinalAuthorityEvent(event, proof, receipt) {
  if (!finiteJson(event) || !finiteJson(proof) || !finiteJson(receipt) || !exactKeys(event, trust.final_authority_event_required) || !exactKeys(proof, trust.authority_proof_required) || typeof event.issuer_signature_base64 !== 'string') return false
  const auth = specimens.authentication_events[proof.authentication_event_ref]
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!issuer || !credential || credential.named_human_id !== proof.named_human_id || event.named_human_id !== proof.named_human_id || !issuer.allowed_methods.includes(event.method)) return false
  if (validateAuthentication(auth, proof.named_human_id, receipt.server_commit_time) !== 'valid' || auth.session_id !== event.session_id || auth.credential_id !== event.credential_id || auth.issuer_id !== event.issuer_id || auth.method !== event.method) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { if (!verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64'))) return false } catch { return false }
  for (const field of ['transition_id', 'subject_id', 'case_id', 'purpose_id', 'permitted_audience', 'predecessor_version', 'predicate_proof_fingerprint', 'authority_bundle_fingerprint', 'render_receipt_ref', 'visible_consequence_fingerprint', 'reserved_transition_receipt_version']) if (!same(event[field], receipt[field])) return false
  return Date.parse(auth.issued_at) <= Date.parse(event.authorized_at) && Date.parse(event.authorized_at) <= Date.parse(receipt.server_commit_time) && Date.parse(event.authorized_at) < Date.parse(auth.valid_until)
}
function validateFinal(receipt, context, authorityEvents = specimens.final_authority_events) {
  if (!finiteJson(receipt) || !finiteJson(context) || !finiteJson(authorityEvents) || !exactKeys(receipt, trust.final_receipt_required) || !Array.isArray(receipt.authority_proofs) || !receipt.authority_proofs.every(proof => exactKeys(proof, trust.authority_proof_required))) return 'shape_invalid'
  if (typeof receipt.authority_receipt_id !== 'string' || receipt.authority_receipt_id.length === 0) return 'shape_invalid'
  if (fingerprint(receipt, 'authority_receipt_fingerprint') !== receipt.authority_receipt_fingerprint) return 'fingerprint_invalid'
  if (receipt.receipt_type !== trust.exact_constants.final_receipt_type || receipt.domain_separator !== trust.exact_constants.final_domain_separator) return 'constant_invalid'
  for (const field of trust.binding_context_required) if (!same(receipt[field], context[field])) return 'binding_invalid'
  if (receipt.visible_consequence_fingerprint !== hashValue(receipt.displayed_consequence_text)) return 'binding_invalid'
  const transition = transitionById[receipt.transition_id]
  if (!transition || !transition.final_authority || !Array.isArray(transition.final_authority.actor_roles)) return 'binding_invalid'
  const allowed = transition.final_authority.actor_roles.map(role => roleHuman[role]), actual = receipt.authority_proofs.map(value => value.named_human_id)
  const actorsValid = transition.final_authority.cardinality === 'all' ? same(byteSorted(actual), byteSorted(allowed)) : actual.length === 1 && allowed.includes(actual[0])
  if (!actorsValid || !unique(actual) || !receipt.authority_proofs.every(proof => exactKeys(proof, trust.authority_proof_required) && validateFinalAuthorityEvent(authorityEvents[proof.authority_event_ref], proof, receipt))) return 'authority_invalid'
  if (!(Date.parse(receipt.server_commit_time) < Date.parse(receipt.valid_until))) return 'expired'
  return 'valid'
}
for (const vector of vectors.final_authority_vectors) {
  const receipt = buildFinalReceipt(), authorityEvents = clone(specimens.final_authority_events)
  if (vector.mutation?.op === 'mutate_authority_event') setAt(authorityEvents[vector.mutation.event_ref], vector.mutation.path, vector.mutation.value)
  else if (vector.mutation) setAt(receipt, vector.mutation.path, vector.mutation.value)
  receipt.authority_receipt_fingerprint = fingerprint(receipt, 'authority_receipt_fingerprint')
  check(`final vector ${vector.id}`, validateFinal(receipt, binding, authorityEvents) === vector.expected)
}

function authoritativeConditionalContext(transitionId) {
  if (transitionId !== 'complete_close') return { state_version: 'not_applicable', outstanding_obligation_ids: [], set_seal: hashValue([]) }
  return clone(semantic.authoritative_conditional_state)
}
function requiredDependencyIds(transitionId) {
  const transition = transitionById[transitionId]
  if (!transition) return null
  const ids = [...transition.server_dependencies, ...transition.normative_dependencies]
  if (transitionId === 'complete_close') for (const id of semantic.authoritative_conditional_state.outstanding_obligation_ids) ids.push(`responsible_human_owner:${id}`, `revisit_date:${id}`)
  return byteSorted(ids)
}
function buildPredicateProof(transitionId) {
  const conditionalContext = authoritativeConditionalContext(transitionId), expectedIds = requiredDependencyIds(transitionId)
  const evidence = {}, results = []
  for (const id of expectedIds) {
    if (resolveOwner(id)) {
      const profile = buildProfile(id), derivedProof = buildDerivedProof(id, profile); const ref = `profile:${id}`; evidence[ref] = { kind: 'profile', dependency_id: id, value: { profile, derived_proof: derivedProof } }
      results.push({ dependency_id: id, disposition: 'present', evidence_ref: ref, evidence_fingerprint: hashValue(evidence[ref].value) })
    } else {
      const question = buildQuestionForDependency(id), human = question.named_answer_owner, authRef = human === 'krish' ? 'auth-2' : 'auth-1', built = buildNormativeReceipt(question, question.answer_options[0], human, authRef)
      const ref = `receipt:${id}`; evidence[ref] = { kind: 'normative', dependency_id: id, value: built.receipt, question, render: built.render }
      results.push({ dependency_id: id, disposition: 'present', evidence_ref: ref, evidence_fingerprint: hashValue(built.receipt) })
    }
  }
  const proof = { proof_id: `proof-${transitionId}`, transition_id: transitionId, conditional_context: conditionalContext, expected_dependency_ids: expectedIds, expected_dependency_set_seal: hashValue(expectedIds), dependency_results: results, evaluation_time: binding.server_commit_time, subject_id: binding.subject_id, case_id: binding.case_id, purpose_id: binding.purpose_id, permitted_audience: binding.permitted_audience, authority_bundle_fingerprint: authorityBundle, proof_fingerprint: '' }
  proof.proof_fingerprint = fingerprint(proof, 'proof_fingerprint')
  return { proof, evidence }
}
function validatePredicate(proof, evidence) {
  if (!finiteJson(proof) || !exactKeys(proof, semantic.predicate_proof_required) || !Array.isArray(proof.dependency_results) || fingerprint(proof, 'proof_fingerprint') !== proof.proof_fingerprint) return 'proof_invalid'
  if (typeof proof.proof_id !== 'string' || proof.proof_id.length === 0) return 'proof_invalid'
  const authoritativeContext = authoritativeConditionalContext(proof.transition_id)
  if (canonical(proof.conditional_context) !== canonical(authoritativeContext)) return 'conditional_context_invalid'
  const expected = requiredDependencyIds(proof.transition_id)
  if (!expected || expected.length === 0) return 'contract_invalid'
  const actual = proof.dependency_results.map(value => value.dependency_id)
  if (!proof.dependency_results.every(value => exactKeys(value, semantic.dependency_result_required)) || !unique(actual) || !same(byteSorted(actual), expected) || !same(proof.expected_dependency_ids, expected) || proof.expected_dependency_set_seal !== hashValue(expected)) return 'set_mismatch'
  if (proof.subject_id !== binding.subject_id || proof.case_id !== binding.case_id || proof.purpose_id !== binding.purpose_id || !same(proof.permitted_audience, binding.permitted_audience) || proof.authority_bundle_fingerprint !== authorityBundle) return 'binding_invalid'
  for (const result of proof.dependency_results) {
    const item = evidence[result.evidence_ref]
    const expectedKind = resolveOwner(result.dependency_id) ? 'profile' : judgementById[result.dependency_id] ? 'normative' : null
    if (!item || !finiteJson(item) || item.kind !== expectedKind || item.dependency_id !== result.dependency_id || !finiteJson(item.value) || hashValue(item.value) !== result.evidence_fingerprint || result.disposition !== 'present') return 'evidence_invalid'
    if (expectedKind === 'profile') {
      if (!item.value || typeof item.value !== 'object' || Array.isArray(item.value) || !item.value.profile) return 'evidence_invalid'
      if (validateProfile(result.dependency_id, item.value.profile, proof.evaluation_time, item.value.derived_proof) !== 'valid') return 'evidence_invalid'
      const profile = item.value.profile
      if (profile.subject_id !== proof.subject_id || profile.case_id !== proof.case_id || profile.purpose_id !== proof.purpose_id || !same(profile.permitted_audience, proof.permitted_audience) || !profile.allowed_uses.includes('predicate_evaluation')) return 'evidence_invalid'
    }
    if (expectedKind === 'normative' && validateNormative(item.value, proof.evaluation_time, item.question, item.render, binding) !== 'valid') return 'evidence_invalid'
  }
  const classes = proof.dependency_results.map(value => semantic.disposition_classes[value.disposition] ?? 'indeterminate')
  for (const className of semantic.precedence) if (classes.includes(className)) return semantic.class_to_result[className]
  return 'indeterminate'
}
for (const vector of vectors.predicate_vectors) {
  const built = buildPredicateProof(vector.transition_id), proof = built.proof
  if (vector.mutation?.op === 'keep_first_result') proof.dependency_results = proof.dependency_results.slice(0, 1)
  if (vector.mutation?.op === 'add_extra_result') proof.dependency_results.push({ dependency_id: 'invented', disposition: 'present', evidence_ref: 'invented', evidence_fingerprint: '0'.repeat(64) })
  if (vector.mutation?.op === 'duplicate_first_result') proof.dependency_results.push(clone(proof.dependency_results[0]))
  if (vector.mutation?.op === 'set_first_disposition') proof.dependency_results[0].disposition = vector.mutation.value
  if (vector.mutation?.op === 'set_conditional_empty') proof.conditional_context = { state_version: 'attacker', outstanding_obligation_ids: [], set_seal: hashValue([]) }
  if (vector.mutation?.op === 'relabel_first_evidence_kind') built.evidence[proof.dependency_results[0].evidence_ref].kind = built.evidence[proof.dependency_results[0].evidence_ref].kind === 'profile' ? 'normative' : 'profile'
  if (vector.mutation?.op === 'cross_context_first_profile') {
    const result = proof.dependency_results.find(value => built.evidence[value.evidence_ref]?.kind === 'profile'), item = built.evidence[result.evidence_ref]
    Object.assign(item.value.profile, { tenant_id: 'tenant-attacker', leader_id: 'leader-attacker', subject_id: 'subject-attacker', case_id: 'case-attacker', purpose_id: 'purpose-attacker', permitted_audience: ['public'], allowed_uses: ['publish'], source_identity: 'attacker:row-9', row_version: 'row-attacker' })
    if (item.value.derived_proof) { item.value.derived_proof.output_profile_fingerprint = hashValue(item.value.profile); item.value.derived_proof.proof_fingerprint = fingerprint(item.value.derived_proof, 'proof_fingerprint') }
    result.evidence_fingerprint = hashValue(item.value)
  }
  proof.proof_fingerprint = fingerprint(proof, 'proof_fingerprint')
  check(`predicate vector ${vector.id}`, validatePredicate(proof, built.evidence) === vector.expected)
}
check('predicate cannot steer', semantic.proof_may_apply_transition === false)

const tupleKey = value => `${value.dependency_id}|${value.dependency_fingerprint}|${value.edge_kind}`
const correctionAuthorityService = (() => {
  const graphByHead = new Map(correction.authoritative_fixture_graphs.map(fixture => [fixture.graph.graph_head, clone(fixture)]))
  const referentByRef = new Map(correction.authoritative_referent_store.records.map(record => [record.ref, clone(record)]))
  return Object.freeze({
    resolveGraph: graphHead => graphByHead.has(graphHead) ? clone(graphByHead.get(graphHead)) : null,
    resolveReferent: ref => referentByRef.has(ref) ? clone(referentByRef.get(ref)) : null
  })
})()
function buildCorrection(graphHead = 'graph-9') {
  const fixture = correctionAuthorityService.resolveGraph(graphHead)
  if (!fixture) return null
  const graph = clone(fixture.graph)
  const reachable = new Set(), queue = [...graph.root_dependency_ids]
  while (queue.length) {
    const current = queue.shift()
    for (const edge of graph.edges.filter(value => value.from_dependency_id === current)) {
      const key = tupleKey({ dependency_id: edge.to_dependency_id, dependency_fingerprint: edge.to_dependency_fingerprint, edge_kind: edge.edge_kind })
      if (!reachable.has(key)) { reachable.add(key); queue.push(edge.to_dependency_id) }
    }
  }
  const members = byteSorted([...reachable]).map(key => { const [dependency_id, dependency_fingerprint, edge_kind] = key.split('|'); return { dependency_id, dependency_fingerprint, edge_kind } })
  const closure = { graph_head: graph.graph_head, graph_epoch: graph.graph_epoch, subject_id: graph.subject_id, case_id: graph.case_id, purpose_id: graph.purpose_id, permitted_audience: graph.permitted_audience, root_dependency_ids: graph.root_dependency_ids, members, dependency_set_seal: '' }
  closure.dependency_set_seal = fingerprint(closure, 'dependency_set_seal')
  const receipts = members.map(member => {
    const repair = fixture.repairs.find(value => value.dependency_id === member.dependency_id)
    if (!repair) throw new Error(`missing authoritative repair ${member.dependency_id}`)
    const value = { receipt_type: 'correction_terminal', domain_separator: trust.exact_constants.correction_domain_separator, repair_id: `repair-${graph.graph_head}`, graph_head: graph.graph_head, graph_epoch: graph.graph_epoch, dependency_set_seal: closure.dependency_set_seal, subject_id: graph.subject_id, case_id: graph.case_id, purpose_id: graph.purpose_id, permitted_audience: graph.permitted_audience, authority_bundle_fingerprint: authorityBundle, trigger_ref: repair.trigger_ref, challenged_proof_ref: repair.challenged_proof_ref, ...member, dependency_use_ref: repair.dependency_use_ref, affected_artifact_ref: repair.affected_artifact_ref, repair_action: repair.repair_action, history_preserved_ref: repair.history_preserved_ref, descendant_block_ref: repair.descendant_block_ref, fresh_reopen_authority_ref: 'not_reopened', terminal_status: repair.terminal_status, current_steering_eligibility: false, resulting_version_ref: repair.resulting_version_ref, issued_at: '2026-09-16T09:05:00Z', receipt_fingerprint: '' }
    value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint'); return value
  })
  return { graph, closure, receipts }
}
function validateCorrection(graph, closure, receipts) {
  if (!finiteJson(graph) || !finiteJson(closure) || !finiteJson(receipts) || !exactKeys(graph, correction.authoritative_dependency_graph_required) || !Array.isArray(graph.edges) || !graph.edges.every(value => exactKeys(value, correction.edge_required)) || fingerprint(graph, 'graph_fingerprint') !== graph.graph_fingerprint) return 'graph_or_binding_invalid'
  const expectedBuilt = buildCorrection(graph.graph_head)
  if (!expectedBuilt || canonical(graph) !== canonical(expectedBuilt.graph)) return 'graph_or_binding_invalid'
  if (!exactKeys(closure, correction.sealed_closure_required) || !Array.isArray(closure.members) || !closure.members.every(value => exactKeys(value, correction.member_required)) || !same(closure, expectedBuilt.closure) || fingerprint(closure, 'dependency_set_seal') !== closure.dependency_set_seal) return 'closure_or_receipt_mismatch'
  if (!Array.isArray(receipts) || !receipts.every(value => exactKeys(value, correction.repair_receipt_required))) return 'receipt_or_steering_invalid'
  const expectedByTuple = Object.fromEntries(expectedBuilt.receipts.map(value => [tupleKey(value), value]))
  const requiredReferent = (ref, kind, currentState, effect) => {
    const record = correctionAuthorityService.resolveReferent(ref)
    return record && exactKeys(record, correction.authoritative_referent_required) && record.kind === kind && record.graph_head === graph.graph_head && record.subject_id === graph.subject_id && record.case_id === graph.case_id && record.purpose_id === graph.purpose_id && same(record.permitted_audience, graph.permitted_audience) && record.current_state === currentState && record.effect === effect
  }
  for (const receipt of receipts) {
    if (fingerprint(receipt, 'receipt_fingerprint') !== receipt.receipt_fingerprint) return 'receipt_fingerprint_invalid'
    if (receipt.receipt_type !== 'correction_terminal' || receipt.domain_separator !== trust.exact_constants.correction_domain_separator || receipt.authority_bundle_fingerprint !== authorityBundle || !correction.repair_action_values.includes(receipt.repair_action) || !correction.terminal_status_values.includes(receipt.terminal_status) || receipt.current_steering_eligibility !== false) return 'receipt_or_steering_invalid'
    if (!requiredReferent(receipt.trigger_ref, 'correction_trigger', 'accepted', 'invalidates_challenged_dependencies') || !requiredReferent(receipt.challenged_proof_ref, 'challenged_proof', 'challenged', 'cannot_steer') || !requiredReferent(receipt.dependency_use_ref, 'dependency_use', 'superseded', 'cannot_steer') || !requiredReferent(receipt.affected_artifact_ref, 'affected_artifact', 'affected', 'repair_required') || !requiredReferent(receipt.history_preserved_ref, 'history_record', 'immutable_preserved', 'preserves_superseded_version') || !requiredReferent(receipt.descendant_block_ref, 'descendant_block', 'active', 'blocks_descendant_steering') || (receipt.resulting_version_ref !== null && !requiredReferent(receipt.resulting_version_ref, 'resulting_version', 'current', 'replaces_affected_artifact'))) return 'referent_invalid'
    if (!expectedByTuple[tupleKey(receipt)] || canonical(receipt) !== canonical(expectedByTuple[tupleKey(receipt)])) return 'authoritative_receipt_mismatch'
    for (const field of ['graph_head', 'graph_epoch', 'dependency_set_seal', 'subject_id', 'case_id', 'purpose_id', 'permitted_audience']) if (!same(receipt[field], closure[field])) return 'graph_or_binding_invalid'
    if (receipt.fresh_reopen_authority_ref !== 'not_reopened') return 'receipt_or_steering_invalid'
  }
  const memberKeys = closure.members.map(tupleKey), receiptKeys = receipts.map(tupleKey)
  if (!unique(receiptKeys) || !same(byteSorted(memberKeys), byteSorted(receiptKeys))) return 'closure_or_receipt_mismatch'
  return 'complete'
}
for (const vector of vectors.correction_vectors) {
  const built = buildCorrection(vector.mutation?.op === 'use_graph' ? vector.mutation.graph_head : 'graph-9')
  if (vector.mutation?.op === 'remove_receipt') built.receipts = built.receipts.filter(value => value.dependency_id !== vector.mutation.dependency_id)
  if (vector.mutation?.op === 'tamper_receipt_without_rehash') built.receipts.find(value => value.dependency_id === vector.mutation.dependency_id)[vector.mutation.field] = vector.mutation.value
  if (vector.mutation?.op === 'tamper_receipt_and_rehash') { const receipt = built.receipts.find(value => value.dependency_id === vector.mutation.dependency_id); receipt[vector.mutation.field] = vector.mutation.value; receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint') }
  if (vector.mutation?.op === 'change_graph_epoch_only') built.graph.graph_epoch = vector.mutation.value
  if (vector.mutation?.op === 'set_current_steering') { const receipt = built.receipts.find(value => value.dependency_id === vector.mutation.dependency_id); receipt.current_steering_eligibility = vector.mutation.value; receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint') }
  check(`correction vector ${vector.id}`, validateCorrection(built.graph, built.closure, built.receipts) === vector.expected)
}

const externalTransitionByKey = Object.fromEntries(external.transitions.map(value => [`${value.from}|${value.event_type}`, value]))
const expectedGuardByEvent = { commit_local_reservation: 'reservation_unique_and_first_compare_and_set_exact', acquire_bound_external_authority: 'active_exact_policy_and_bound_unexpired_token_or_lease', reservation_cancel_or_expire: 'valid_abort_terminal_receipt', commit_local_provisional: 'first_compare_and_set_exact_and_provisional_version_created', local_commit_failed_release_or_expire: 'valid_release_or_expiry_terminal_receipt', immutable_lease_still_current: 'lease_finality_and_second_compare_and_set_exact', conditional_token_consumed: 'single_use_token_finality_and_second_compare_and_set_exact', ack_lost_query_same_token_nonce: 'same_request_identity_and_no_steering', authority_mismatch: 'valid_quarantine_terminal_receipt', reconciliation_failed: 'valid_quarantine_terminal_receipt_and_descendant_block' }
check('external guard program exact and executable', external.transitions.every(value => value.guard === expectedGuardByEvent[value.event_type]))
function buildExternalEvent(eventType, fromState, reservation) {
  const terminal = ['reservation_cancel_or_expire', 'local_commit_failed_release_or_expire', 'authority_mismatch', 'reconciliation_failed'].includes(eventType)
  const value = { event_id: `event-${eventType}`, event_type: eventType, from_state: fromState, reservation_id: reservation.reservation_id, reserved_receipt_version: reservation.reserved_receipt_version, fact_kind: reservation.fact_kind, policy_id: reservation.policy_id, external_identity: reservation.external_identity, idempotency_key: reservation.idempotency_key, transaction_nonce: reservation.transaction_nonce, canonical_request_fingerprint: reservation.canonical_request_fingerprint, predecessor_version: reservation.predecessor_version, source_heads_seal: reservation.source_heads_seal, set_seals_fingerprint: reservation.set_seals_fingerprint, revocation_epochs_fingerprint: reservation.revocation_epochs_fingerprint, human_authority_receipt_fingerprint: reservation.human_authority_receipt_fingerprint, visible_consequence_fingerprint: reservation.visible_consequence_fingerprint, provisional_transition_version: reservation.provisional_transition_version, protocol: reservation.protocol, protocol_evidence: eventType === 'immutable_lease_still_current' ? { lease_revision: 'lease-1', policy_id: reservation.policy_id, fact_kind: reservation.fact_kind, external_identity: reservation.external_identity, reservation_id: reservation.reservation_id, transaction_nonce: reservation.transaction_nonce, reserved_receipt_version: reservation.reserved_receipt_version, visible_consequence_fingerprint: reservation.visible_consequence_fingerprint, revocation_epoch: reservation.revocation_epochs_fingerprint, valid_until: reservation.valid_until, current: true } : eventType === 'conditional_token_consumed' ? { token_id: reservation.external_identity, policy_id: reservation.policy_id, fact_kind: reservation.fact_kind, reservation_id: reservation.reservation_id, transaction_nonce: reservation.transaction_nonce, reserved_receipt_version: reservation.reserved_receipt_version, visible_consequence_fingerprint: reservation.visible_consequence_fingerprint, consumed_at: reservation.server_transaction_time, consumed_once: true } : { acknowledged: true }, server_transaction_time: reservation.server_transaction_time, valid_until: reservation.valid_until, maximum_clock_skew_seconds: reservation.maximum_clock_skew_seconds, terminal_receipt_ref: terminal ? `terminal-${eventType}` : null, event_fingerprint: '' }
  value.event_fingerprint = fingerprint(value, 'event_fingerprint'); return value
}
function sameReservationBindings(event, reservation, fields) { return fields.every(field => field === 'same_or_stricter_validity_boundary' ? Date.parse(event.valid_until) <= Date.parse(reservation.valid_until) : field === 'protocol_evidence' ? true : same(event[field], reservation[field])) }
function validateTerminalReceipt(event, targetState, testMode) {
  const receipts = testMode ? external.test_only_terminal_receipts : external.effective_terminal_receipts
  const receipt = receipts.find(value => value.receipt_id === event.terminal_receipt_ref)
  return Boolean(receipt && exactKeys(receipt, external.terminal_receipt_required) && fingerprint(receipt, 'receipt_fingerprint') === receipt.receipt_fingerprint && receipt.event_type === event.event_type && receipt.reservation_id === event.reservation_id && receipt.transaction_nonce === event.transaction_nonce && receipt.reserved_receipt_version === event.reserved_receipt_version && receipt.terminal_state === targetState && receipt.history_preserved === true && receipt.descendant_blocked === true)
}
function validateLeaseEvidence(event, reservation) {
  const evidence = event.protocol_evidence
  return finiteJson(evidence) && exactKeys(evidence, external.lease_evidence_required) && evidence.lease_revision === 'lease-1' && evidence.policy_id === reservation.policy_id && evidence.fact_kind === reservation.fact_kind && evidence.external_identity === reservation.external_identity && evidence.reservation_id === reservation.reservation_id && evidence.transaction_nonce === reservation.transaction_nonce && evidence.reserved_receipt_version === reservation.reserved_receipt_version && evidence.visible_consequence_fingerprint === reservation.visible_consequence_fingerprint && evidence.revocation_epoch === reservation.revocation_epochs_fingerprint && evidence.valid_until === reservation.valid_until && evidence.current === true
}
function validateConsumeEvidence(event, reservation) {
  const evidence = event.protocol_evidence
  return finiteJson(evidence) && exactKeys(evidence, external.consume_evidence_required) && evidence.token_id === reservation.external_identity && evidence.policy_id === reservation.policy_id && evidence.fact_kind === reservation.fact_kind && evidence.reservation_id === reservation.reservation_id && evidence.transaction_nonce === reservation.transaction_nonce && evidence.reserved_receipt_version === reservation.reserved_receipt_version && evidence.visible_consequence_fingerprint === reservation.visible_consequence_fingerprint && evidence.consumed_at === event.server_transaction_time && evidence.consumed_once === true
}
const externalTransactionService = (() => {
  const seen = new Map(), consumed = new Set(), completed = new Map()
  const execute = (eventTypes, mode, mutation) => {
    if (!Array.isArray(eventTypes) || !eventTypes.every(value => typeof value === 'string') || !['effective', 'test_lease', 'test_consume'].includes(mode)) return 'shape_invalid'
    const reservation = clone(specimens.external_reservation), testMode = mode === 'test_lease' || mode === 'test_consume', policies = testMode ? external.test_only_policy_registry : external.authoritative_external_fact_policies
    const requestedProtocol = mode === 'test_consume' ? 'online_conditional_verify_and_consume' : reservation.protocol
    const preferred = policies.find(value => value.protocol === requestedProtocol)
    if (preferred) { reservation.protocol = preferred.protocol; reservation.policy_id = preferred.policy_id }
    const requestIdentity = `${reservation.idempotency_key}|${reservation.transaction_nonce}`
    if (completed.has(requestIdentity)) return completed.get(requestIdentity).requestFingerprint === reservation.canonical_request_fingerprint ? completed.get(requestIdentity).result : 'collision'
    let state = 'unreserved'
    for (const eventType of eventTypes) {
    const edge = externalTransitionByKey[`${state}|${eventType}`]
    if (!edge) return 'illegal_transition'
    if (edge.guard !== expectedGuardByEvent[eventType]) return 'guard_failed'
    const event = buildExternalEvent(eventType, state, reservation)
    if (mutation?.event === eventType) { setAt(event, mutation.path, mutation.value); event.event_fingerprint = fingerprint(event, 'event_fingerprint') }
    const nullableTerminal = event.terminal_receipt_ref === null || typeof event.terminal_receipt_ref === 'string'
    const eventStrings = external.event_required.filter(field => !['protocol_evidence', 'maximum_clock_skew_seconds', 'terminal_receipt_ref'].includes(field))
    if (!finiteJson(event) || !exactKeys(event, external.event_required) || !eventStrings.every(field => typeof event[field] === 'string' && event[field].length > 0) || !nullableTerminal || fingerprint(event, 'event_fingerprint') !== event.event_fingerprint || event.event_type !== eventType || event.from_state !== state || !Number.isInteger(event.maximum_clock_skew_seconds) || event.maximum_clock_skew_seconds < 0) return 'guard_failed'
    const identity = `${event.idempotency_key}|${event.transaction_nonce}`
    if (seen.has(identity) && seen.get(identity) !== event.canonical_request_fingerprint) return 'collision'
    seen.set(identity, event.canonical_request_fingerprint)
    if (eventType === 'commit_local_reservation' && !sameReservationBindings(event, reservation, external.first_compare_and_set)) return 'guard_failed'
    if (eventType === 'acquire_bound_external_authority') {
      const active = policies.find(value => value.policy_id === event.policy_id && value.fact_kind === event.fact_kind && value.external_identity === event.external_identity && value.protocol === event.protocol && value.valid_until === event.valid_until && value.maximum_clock_skew_seconds === event.maximum_clock_skew_seconds)
      if (!active) return 'policy_inactive'
      if (!(Date.parse(event.server_transaction_time) + event.maximum_clock_skew_seconds * 1000 < Date.parse(event.valid_until))) return 'guard_failed'
    }
    if (eventType === 'commit_local_provisional' && !sameReservationBindings(event, reservation, external.first_compare_and_set)) return 'guard_failed'
    if (eventType === 'immutable_lease_still_current') {
      if (event.protocol !== 'immutable_authority_lease' || !sameReservationBindings(event, reservation, external.second_compare_and_set) || !validateLeaseEvidence(event, reservation) || !(Date.parse(event.server_transaction_time) + event.maximum_clock_skew_seconds * 1000 < Date.parse(event.protocol_evidence.valid_until))) return 'guard_failed'
    }
    if (eventType === 'conditional_token_consumed') {
      const consumeKey = `${event.policy_id}|${event.fact_kind}|${event.external_identity}`
      if (event.protocol !== 'online_conditional_verify_and_consume' || !sameReservationBindings(event, reservation, external.second_compare_and_set) || !validateConsumeEvidence(event, reservation) || consumed.has(consumeKey)) return 'guard_failed'
      consumed.add(consumeKey)
    }
    if (eventType === 'ack_lost_query_same_token_nonce' && !sameReservationBindings(event, reservation, ['external_identity', 'idempotency_key', 'transaction_nonce', 'canonical_request_fingerprint'])) return 'collision'
    if (['reservation_cancel_or_expire', 'local_commit_failed_release_or_expire', 'authority_mismatch', 'reconciliation_failed'].includes(eventType) && !validateTerminalReceipt(event, edge.to, testMode)) return 'guard_failed'
    state = edge.to
  }
    const result = testMode && state === 'finalized' ? 'test_finalized_non_authoritative' : state
    if (['finalized', 'test_finalized_non_authoritative', 'aborted', 'quarantined'].includes(result)) completed.set(requestIdentity, { requestFingerprint: reservation.canonical_request_fingerprint, result })
    return result
  }
  return Object.freeze({ execute, resetForConformance: () => { seen.clear(); consumed.clear(); completed.clear() }, preconsumeForConformance: key => consumed.add(key) })
})()
for (const vector of vectors.external_vectors) {
  externalTransactionService.resetForConformance()
  if (vector.mutation?.op === 'preconsume_external_identity') externalTransactionService.preconsumeForConformance('test-policy-consume|test_external_fact|token-1')
  const mutation = vector.mutation?.op ? null : vector.mutation
  const first = externalTransactionService.execute(vector.events, vector.mode ?? 'effective', mutation)
  const actual = vector.mutation?.op === 'double_consume' ? `${first}|${externalTransactionService.execute(vector.events, vector.mode ?? 'effective', null)}` : first
  check(`external vector ${vector.id}`, actual === vector.expected)
}
check('external effective authority inactive', external.authoritative_external_fact_policies.length === 0 && external.unsupported_external_assertion === 'evidence_only_indeterminate')
check('only finalized steers', external.steering_state === 'finalized')

let totalityProbeCount = 0
function totalityProbe(name, fn) {
  totalityProbeCount += 1
  try { check(`totality ${name}`, fn()) } catch { check(`totality ${name}`, false) }
}
for (const field of trust.authentication_event_required) totalityProbe(`authentication ${field}`, () => { const value = clone(specimens.authentication_events['auth-1']); value[field] = null; return validateAuthentication(value, 'leader-1', '2026-09-16T09:00:00Z') !== 'valid' })
{
  const question = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value'), render = buildRenderReceipt(question), event = specimens.answer_events[`answer-${question.dependency_id}-1`]
  for (const field of trust.answer_event_required) totalityProbe(`answer ${field}`, () => { const value = clone(event); value[field] = null; return validateAnswerEvent(value, 'leader-1', question, render, question.answer_options[0]) === false })
  for (const field of interaction.question_required) totalityProbe(`question ${field}`, () => { const value = clone(question); value[field] = null; return validateQuestion(value, buildSession('empty_session'), buildCaseContext()) !== 'valid' })
  for (const field of interaction.render_receipt_required) totalityProbe(`render ${field}`, () => { const value = clone(render); value[field] = null; return validateRender(value, question) === false })
  const built = buildNormativeReceipt(question)
  const selectedAnswerNullable = new Set(['free_expression_ref', 'free_expression_interpretation_ref', 'free_expression_interpretation_render_ref', 'free_expression_confirmation_ref'])
  for (const field of trust.normative_receipt_required) {
    if (selectedAnswerNullable.has(field)) continue
    totalityProbe(`normative ${field}`, () => { const value = clone(built.receipt); value[field] = null; if (field !== 'receipt_fingerprint') value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint'); return validateNormative(value, '2026-09-16T09:00:00Z', question, built.render, binding) !== 'valid' })
  }
}
{
  const receipt = buildFinalReceipt()
  for (const field of trust.final_receipt_required) totalityProbe(`final receipt ${field}`, () => { const value = clone(receipt); value[field] = null; if (field !== 'authority_receipt_fingerprint') value.authority_receipt_fingerprint = fingerprint(value, 'authority_receipt_fingerprint'); return validateFinal(value, binding) !== 'valid' })
  for (const field of trust.final_authority_event_required) totalityProbe(`final authority event ${field}`, () => { const proof = receipt.authority_proofs[0], value = clone(specimens.final_authority_events[proof.authority_event_ref]); value[field] = null; return validateFinalAuthorityEvent(value, proof, receipt) === false })
}
{
  const built = buildPredicateProof('open_preparation')
  for (const field of semantic.predicate_proof_required) totalityProbe(`predicate ${field}`, () => { const value = clone(built.proof); value[field] = null; if (field !== 'proof_fingerprint') value.proof_fingerprint = fingerprint(value, 'proof_fingerprint'); return validatePredicate(value, built.evidence) !== 'satisfied' })
}
{
  const built = buildCorrection('graph-9')
  for (const field of correction.authoritative_dependency_graph_required) totalityProbe(`correction graph ${field}`, () => { const value = clone(built.graph); value[field] = null; if (field !== 'graph_fingerprint') value.graph_fingerprint = fingerprint(value, 'graph_fingerprint'); return validateCorrection(value, built.closure, built.receipts) !== 'complete' })
  for (const field of correction.sealed_closure_required) totalityProbe(`correction closure ${field}`, () => { const value = clone(built.closure); value[field] = null; if (field !== 'dependency_set_seal') value.dependency_set_seal = fingerprint(value, 'dependency_set_seal'); return validateCorrection(built.graph, value, built.receipts) !== 'complete' })
  for (const field of correction.repair_receipt_required) totalityProbe(`correction receipt ${field}`, () => { const receipts = clone(built.receipts); receipts[0][field] = null; if (field !== 'receipt_fingerprint') receipts[0].receipt_fingerprint = fingerprint(receipts[0], 'receipt_fingerprint'); return validateCorrection(built.graph, built.closure, receipts) !== 'complete' })
}

const vectorGroups = ['authentication_vectors', 'semantic_profile_vectors', 'normative_vectors', 'final_authority_vectors', 'predicate_vectors', 'question_vectors', 'routing_vectors', 'correction_vectors', 'external_vectors']
const vectorIds = vectorGroups.flatMap(group => vectors[group].map(value => value.id))
check('all vector IDs globally unique', unique(vectorIds))
check('mandatory vector bodies pinned', hashValue(Object.fromEntries(vectorGroups.map(group => [group, vectors[group]]))) === '275139946cd6af6ccec6485e704fd60a66028ad201bccd3fbad673e76e4439d9')
if (failures.length) {
  console.error(`R83 independent conformance failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`ok: R83 end-to-end bound contract; ${imports.transition_catalogue.length} transitions; ${vectorGroups.reduce((sum, group) => sum + vectors[group].length, 0)} executable vectors; ${totalityProbeCount} generated totality probes`)
