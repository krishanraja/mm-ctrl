import { createHash, createPublicKey, verify } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r81'
const sourceFiles = ['01-effective-resolution.json', '02-trust-and-context-program.json', '03-semantic-set-program.json', '04-interaction-program.json', '05-correction-program.json', '06-external-program.json', '07-executable-vectors.json']
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sorted = values => [...values].sort((a, b) => String(a).localeCompare(String(b), 'en', { usage: 'sort', sensitivity: 'variant' }))
const byteSorted = values => [...values].sort((a, b) => Buffer.from(String(a)).compare(Buffer.from(String(b))))
const unique = values => values.length === new Set(values).size
const canonicalValue = value => Array.isArray(value) ? value.map(canonicalValue) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])])) : value
const canonical = value => JSON.stringify(canonicalValue(value))
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
  effective_resolution: ['schema_version', 'module_id', 'semantic_base', 'imported_exact_sections', 'r81_replacement_sections', 'inheritance_rule', 'unknown_or_conflicting_section', 'authority_still_closed'],
  trust_and_context_program: ['schema_version', 'module_id', 'canonicalization', 'fingerprint', 'exact_constants', 'trusted_authenticator_registry', 'authentication_event_required', 'answer_event_required', 'final_authority_event_required', 'normative_receipt_required', 'final_receipt_required', 'authority_proof_required', 'free_expression_confirmation_required', 'binding_context_required', 'rules', 'workload_or_model_issuer'],
  semantic_set_program: ['schema_version', 'module_id', 'profile_validation', 'derivation_registry', 'derived_profile_rules', 'derived_fact_proof_required', 'derived_input_required', 'predicate_proof_required', 'dependency_result_required', 'disposition_classes', 'precedence', 'class_to_result', 'complete_set_rules', 'proof_may_apply_transition'],
  interaction_program: ['schema_version', 'module_id', 'session_state_required', 'question_required', 'render_receipt_required', 'canonical_case_context_required', 'copy_limits', 'technical_vocabulary_forbidden', 'routing_rules', 'question_rules', 'default_surface'],
  correction_program: ['schema_version', 'module_id', 'authoritative_dependency_graph_required', 'edge_required', 'edge_kind_values', 'sealed_closure_required', 'member_required', 'repair_receipt_required', 'repair_action_values', 'terminal_status_values', 'validation_rules', 'receipt_current_steering_eligibility'],
  external_program: ['schema_version', 'module_id', 'authoritative_external_fact_policies', 'unsupported_external_assertion', 'states', 'event_required', 'protocols', 'first_compare_and_set', 'second_compare_and_set', 'transitions', 'guard_rules', 'retry', 'steering_state'],
  executable_vectors: ['schema_version', 'module_id', 'specimens', 'authentication_vectors', 'semantic_profile_vectors', 'normative_vectors', 'final_authority_vectors', 'predicate_vectors', 'question_vectors', 'correction_vectors', 'external_vectors']
}
for (const [id, keys] of Object.entries(expectedTopKeys)) check(`closed module ${id}`, exactKeys(modules[id], keys))
check('seven unique modules', Object.keys(modules).length === 7 && unique(Object.keys(modules)))
check('resolution records closed', resolution.imported_exact_sections.every(value => exactKeys(value, ['effective_section', 'path', 'json_pointer'])))
check('trust registry closed', trust.trusted_authenticator_registry.every(value => exactKeys(value, ['issuer_id', 'algorithm', 'public_key_spki_pem', 'allowed_methods', 'allowed_credentials']) && value.allowed_credentials.every(credential => exactKeys(credential, ['credential_id', 'named_human_id']))))
check('trust constants closed', exactKeys(trust.exact_constants, ['normative_receipt_type', 'normative_domain_separator', 'final_receipt_type', 'final_domain_separator', 'correction_domain_separator']))
check('semantic nested programs closed', exactKeys(semantic.profile_validation, ['schema_source', 'additional_fields', 'owner_binding_source', 'content_fingerprint', 'validity', 'accepted_brain_item', 'contrary_assertions', 'unregistered_dependency']) && semantic.derivation_registry.every(value => exactKeys(value, ['dependency_id', 'function_id', 'version', 'input_fact_kinds', 'freshness', 'non_widening'])) && exactKeys(semantic.disposition_classes, ['present', 'contradicted', 'missing', 'stale', 'unreadable', 'ambiguous', 'revoked']) && exactKeys(semantic.class_to_result, ['indeterminate', 'contradicted', 'present']))
check('interaction nested programs closed', exactKeys(interaction.copy_limits, ['heading', 'question', 'answer_option_each', 'unknown_option', 'free_expression_option', 'visible_consequence', 'optional_note_label', 'primary_action_label', 'total_visible_characters', 'answer_options']) && exactKeys(interaction.default_surface, ['heading_count', 'question_count', 'answer_control_group_count', 'optional_note_count', 'primary_action_count', 'automatic_follow_up_count', 'technical_label_count']))
check('external nested programs closed', external.transitions.every(value => exactKeys(value, ['from', 'event_type', 'to', 'guard'])) && exactKeys(external.retry, ['new_nonce_on_retry', 'same_identity_same_bytes', 'same_identity_changed_bytes']))
check('vector specimen catalogue closed', exactKeys(specimens, ['authentication_events', 'answer_events', 'free_expressions', 'structured_interpretations', 'free_expression_confirmations', 'final_authority_events', 'decisions', 'case_context', 'question', 'empty_session', 'asked_session', 'binding_context', 'correction_graph', 'external_reservation', 'test_external_policy', 'test_consume_policy']))
check('R80 semantic base exact', same(resolution.semantic_base, { commit: 'dff8efbe44c4b74a94746d1cf8a21257c382af17', tree: '1f2a08f1ee5da05e22117bcaefba1ec6d216732f', standing: 'vetoed_source_material_not_effective_authority' }))
check('R80 tree independently resolved', git(['rev-parse', `${resolution.semantic_base.commit}^{tree}`]) === resolution.semantic_base.tree)
check('R80 effective blob exact', git(['rev-parse', `${resolution.semantic_base.commit}:project-documentation/ctrl-evolution/g24-predicate-authority-r80/09-effective-contract.json`]) === '235f260e5c6131250f0d88f0dfbbcd56fb8ce98c')
check('single exact inheritance rule', resolution.inheritance_rule === 'only_named_exact_sections_are_imported_every_other_r80_rule_is_replaced' && resolution.unknown_or_conflicting_section === 'reject_contract')

const imports = Object.fromEntries(resolution.imported_exact_sections.map(record => [record.effective_section, pointer(gitJson(resolution.semantic_base.commit, record.path), record.json_pointer)]))
const authorityMaterial = { imports, trust_and_context_program: trust, semantic_set_program: semantic, interaction_program: interaction, correction_program: correction, external_program: external }
const authorityBundle = sha256(`${canonical(authorityMaterial)}\n`)
const expectedEffective = { schema_version: 'ctrl.g24.predicate-authority.r81.effective-contract.v1', authority_bundle_fingerprint: authorityBundle, ...imports, trust_and_context_program: trust, semantic_set_program: semantic, interaction_program: interaction, correction_program: correction, external_program: external, executable_vectors: vectors, authority_still_closed: resolution.authority_still_closed }
const effectiveBytes = readFileSync(join(root, `${directory}/08-effective-contract.json`))
check('effective contract independently assembled', effectiveBytes.toString('utf8') === `${canonical(expectedEffective)}\n`)
const manifest = readJson(`${directory}/00-manifest.json`)
const records = sourceFiles.map(file => { const path = `${directory}/${file}`; const bytes = readFileSync(join(root, path)); const value = JSON.parse(bytes); return { path, module_id: value.module_id, schema_version: value.schema_version, bytes: bytes.length, sha256: sha256(bytes) } })
check('manifest schema and authority metadata exact', manifest.schema_version === 'ctrl.g24.predicate-authority.r81.manifest.v1' && manifest.standing === 'bound_local_contract_candidate_no_runtime_authority' && manifest.decision_id === 'DEC-20260916-g24-predicate-authority-r75' && canonical(manifest.semantic_base) === canonical(resolution.semantic_base) && manifest.resolution_rule === resolution.inheritance_rule)
check('manifest records exact', canonical(manifest.modules) === canonical(records))
check('manifest effective exact', canonical(manifest.effective_contract) === canonical({ path: `${directory}/08-effective-contract.json`, bytes: effectiveBytes.length, sha256: sha256(effectiveBytes) }))
const manifestWithout = { ...manifest }; delete manifestWithout.bundle_fingerprint
check('manifest fingerprint exact', manifest.bundle_fingerprint === sha256(`${canonical(manifestWithout)}\n`))
check('canonical algorithm honestly names UTF-16 order', trust.canonicalization === 'recursive_utf16_code_unit_sorted_json_utf8_no_whitespace_finite_json_numbers_only' && same(Object.keys(canonicalValue({ '\uE000': 1, '😀': 2 })), ['😀', '\uE000']))

const ownerById = Object.fromEntries(imports.owner_registry.records.map(value => [value.dependency_id, value]))
const judgementById = Object.fromEntries(imports.atomic_judgement_registry.map(value => [value.dependency_id, value]))
const transitionById = Object.fromEntries(imports.transition_catalogue.map(value => [value.id, value]))
const roleHuman = { named_leader: 'leader-1', krish: 'krish', named_leader_via_krish_record: 'leader-1' }
function validateAuthentication(event, expectedHuman, at) {
  if (!exactKeys(event, trust.authentication_event_required)) return 'shape_invalid'
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  if (!issuer) return 'issuer_invalid'
  const credential = issuer.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!credential || credential.named_human_id !== event.named_human_id || event.named_human_id !== expectedHuman || !issuer.allowed_methods.includes(event.method)) return 'credential_invalid'
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  if (!verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64'))) return 'signature_invalid'
  if (!(Date.parse(event.issued_at) <= Date.parse(at) && Date.parse(at) < Date.parse(event.valid_until))) return 'expired'
  return 'valid'
}
function validateAnswerEvent(event, expectedHuman, question, render) {
  if (!event || !exactKeys(event, trust.answer_event_required)) return false
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!issuer || !credential || credential.named_human_id !== expectedHuman || event.named_human_id !== expectedHuman || !issuer.allowed_methods.includes(event.method)) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) && event.question_id === question.question_id && event.question_version === question.question_version && event.selected_option === question.answer_options[0] && event.render_receipt_fingerprint === render.receipt_fingerprint && Date.parse(render.rendered_at) <= Date.parse(event.answered_at)
}
function validateFreeConfirmation(event, receipt, question, render) {
  if (!event || !exactKeys(event, trust.free_expression_confirmation_required)) return false
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  const text = specimens.free_expressions[receipt.free_expression_ref], interpretation = specimens.structured_interpretations[receipt.free_expression_ref]
  if (!issuer || !credential || credential.named_human_id !== receipt.named_human_id || event.named_human_id !== receipt.named_human_id || event.authentication_event_ref !== receipt.authentication_event_ref || !issuer.allowed_methods.includes(event.method) || !text || !interpretation) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) && event.question_id === question.question_id && event.question_version === question.question_version && event.free_expression_fingerprint === hashValue(text) && event.structured_interpretation_fingerprint === hashValue(interpretation) && event.visible_consequence_fingerprint === hashValue(render.displayed_consequence_text) && interpretation.selected_option === receipt.selected_option && interpretation.accepted_decision_after_ref === receipt.accepted_decision_after_ref && Date.parse(render.rendered_at) <= Date.parse(event.confirmed_at) && Date.parse(event.confirmed_at) <= Date.parse(receipt.issued_at) && Date.parse(event.confirmed_at) < Date.parse(receipt.valid_until)
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
function buildProfile(dependencyId) {
  const owner = ownerById[dependencyId], derived = owner.canonical_owner === 'versioned_deterministic_derivation', derivation = derivationById[dependencyId]
  return {
    fact_kind: owner.fact_kind, authority_species: derived ? 'derived_fact' : 'mechanical_fact', tenant_id: 'tenant-1', leader_id: 'leader-1', subject_id: 'leader-1', case_id: 'case-1', engagement_id: 'engagement-1', purpose_id: 'purpose-1', permitted_audience: ['leader-1', 'krish'], consequence_class: 'consequential_internal', allowed_uses: ['predicate_evaluation'], source_type: owner.source_type, source_identity: derived ? `${derivation.function_id}:inputs-1` : `${owner.canonical_owner}:row-1`, schema_version: 'semantic-profile-v1', row_version: 'row-v1', content_fingerprint: hashValue(`${dependencyId}:assertion`), atomic_assertion_or_span_ref: `${dependencyId}:assertion`, speaker_or_issuer: owner.canonical_owner, epistemic_basis: derived ? 'deterministically_derived' : 'observed', issuer_fact_kind_rule: owner.issuer_fact_kind_rule, authority_policy_version: imports.owner_registry.registry_version, applicable_from: '2026-09-16T08:00:00Z', valid_until: '2026-09-16T10:00:00Z', contrary_assertion_refs: [], contrary_disposition: 'none', brain_item_ref: null, brain_item_version: null, brain_standing: 'not_applicable', derivation_function_id: derived ? derivation.function_id : null, derivation_version: derived ? derivation.version : null
  }
}
function buildDerivedProof(dependencyId, profile) {
  const derivation = derivationById[dependencyId]
  if (!derivation) return null
  const inputs = derivation.input_fact_kinds.map(fact_kind => ({ fact_kind, receipt_fingerprint: hashValue(`${fact_kind}:receipt`), subject_id: profile.subject_id, case_id: profile.case_id, purpose_id: profile.purpose_id, permitted_audience: ['leader-1', 'krish'], allowed_uses: ['predicate_evaluation'], consequence_class: profile.consequence_class, valid_until: '2026-09-16T10:00:00Z' }))
  const value = { dependency_id: dependencyId, function_id: derivation.function_id, function_version: derivation.version, input_receipts: inputs, input_set_seal: hashValue(inputs), output_profile_fingerprint: hashValue(profile), proof_fingerprint: '' }
  value.proof_fingerprint = fingerprint(value, 'proof_fingerprint'); return value
}
function validateProfile(dependencyId, profile, at, derivedProof = buildDerivedProof(dependencyId, profile)) {
  const schema = imports.semantic_profile_schema, owner = ownerById[dependencyId]
  if (!owner || !exactKeys(profile, schema.required)) return 'shape_invalid'
  for (const [field, rule] of Object.entries(schema.fields)) {
    const value = profile[field]
    if (typeof rule === 'string' && !typeValidators[rule]?.(value)) return 'shape_invalid'
    if (rule.enum && !rule.enum.includes(value)) return 'shape_invalid'
  }
  if (profile.fact_kind !== owner.fact_kind || profile.speaker_or_issuer !== owner.canonical_owner || profile.source_type !== owner.source_type || profile.issuer_fact_kind_rule !== owner.issuer_fact_kind_rule || profile.authority_policy_version !== imports.owner_registry.registry_version) return 'owner_invalid'
  if (!(Date.parse(profile.applicable_from) <= Date.parse(at) && Date.parse(at) < Date.parse(profile.valid_until))) return 'stale'
  const derivation = derivationById[dependencyId]
  if (derivation) {
    if (profile.authority_species !== 'derived_fact' || profile.epistemic_basis !== 'deterministically_derived' || profile.derivation_function_id !== derivation.function_id || profile.derivation_version !== derivation.version) return 'derivation_invalid'
    const inputAudience = ['leader-1', 'krish'], inputUses = ['predicate_evaluation']
    if (profile.permitted_audience.some(value => !inputAudience.includes(value)) || profile.allowed_uses.some(value => !inputUses.includes(value))) return 'derivation_non_widening_invalid'
    if (!derivedProof || !exactKeys(derivedProof, semantic.derived_fact_proof_required) || !derivedProof.input_receipts.every(value => exactKeys(value, semantic.derived_input_required)) || fingerprint(derivedProof, 'proof_fingerprint') !== derivedProof.proof_fingerprint || derivedProof.dependency_id !== dependencyId || derivedProof.function_id !== derivation.function_id || derivedProof.function_version !== derivation.version || derivedProof.output_profile_fingerprint !== hashValue(profile)) return 'derivation_invalid'
    const actualKinds = derivedProof.input_receipts.map(value => value.fact_kind)
    if (!unique(actualKinds) || !same(byteSorted(actualKinds), byteSorted(derivation.input_fact_kinds)) || derivedProof.input_set_seal !== hashValue(derivedProof.input_receipts)) return 'derivation_input_set_invalid'
    if (derivedProof.input_receipts.some(value => value.subject_id !== profile.subject_id || value.case_id !== profile.case_id || value.purpose_id !== profile.purpose_id || profile.permitted_audience.some(audience => !value.permitted_audience.includes(audience)) || profile.allowed_uses.some(use => !value.allowed_uses.includes(use)) || value.consequence_class !== profile.consequence_class)) return 'derivation_non_widening_invalid'
    const minimumValidity = Math.min(...derivedProof.input_receipts.map(value => Date.parse(value.valid_until)))
    if (!(Date.parse(at) < minimumValidity) || Date.parse(profile.valid_until) !== minimumValidity) return 'derivation_freshness_invalid'
  } else if (profile.derivation_function_id !== null || profile.derivation_version !== null) return 'derivation_invalid'
  return 'valid'
}
for (const vector of vectors.semantic_profile_vectors) {
  const profile = buildProfile(vector.dependency_id)
  const derivedProof = buildDerivedProof(vector.dependency_id, profile)
  if (vector.mutation?.op === 'delete') deleteAt(profile, vector.mutation.path)
  else if (vector.mutation?.op === 'remove_derived_input') { derivedProof.input_receipts.pop(); derivedProof.input_set_seal = hashValue(derivedProof.input_receipts); derivedProof.output_profile_fingerprint = hashValue(profile); derivedProof.proof_fingerprint = fingerprint(derivedProof, 'proof_fingerprint') }
  else if (vector.mutation?.op === 'expire_derived_input') { derivedProof.input_receipts[0].valid_until = '2026-09-16T08:30:00Z'; derivedProof.input_set_seal = hashValue(derivedProof.input_receipts); derivedProof.output_profile_fingerprint = hashValue(profile); derivedProof.proof_fingerprint = fingerprint(derivedProof, 'proof_fingerprint') }
  else if (vector.mutation) setAt(profile, vector.mutation.path, vector.mutation.value)
  check(`semantic profile vector ${vector.id}`, validateProfile(vector.dependency_id, profile, '2026-09-16T09:00:00Z', derivedProof) === vector.expected)
}

function buildCaseContext() { const value = clone(specimens.case_context); value.context_fingerprint = fingerprint(value, 'context_fingerprint'); return value }
function buildSession(name) { const value = clone(specimens[name]); value.state_fingerprint = fingerprint(value, 'state_fingerprint'); return value }
function questionVisibleStrings(question) { return [question.heading, question.question, ...question.answer_options, question.unknown_option, question.free_expression_option, question.visible_consequence, question.optional_note_label, question.primary_action_label] }
function validateQuestion(question, session, caseContext, decisions = specimens.decisions) {
  if (!exactKeys(question, interaction.question_required) || !exactKeys(session, interaction.session_state_required) || !exactKeys(caseContext, interaction.canonical_case_context_required)) return 'shape_invalid'
  if (fingerprint(session, 'state_fingerprint') !== session.state_fingerprint || fingerprint(caseContext, 'context_fingerprint') !== caseContext.context_fingerprint) return 'context_invalid'
  const authoritativeSessionName = session.state_version === specimens.empty_session.state_version ? 'empty_session' : session.state_version === specimens.asked_session.state_version ? 'asked_session' : null
  if (!authoritativeSessionName || canonical(session) !== canonical(buildSession(authoritativeSessionName)) || canonical(caseContext) !== canonical(buildCaseContext())) return 'context_invalid'
  if (session.case_id !== caseContext.case_id || session.decision_id !== caseContext.decision_id || session.named_human_id !== question.named_answer_owner || question.case_id !== caseContext.case_id || question.decision_id !== caseContext.decision_id) return 'context_invalid'
  if (session.question_receipt_ids.length > 0 || session.last_question_ordinal > 0) return 'safe_hold_no_followup'
  const registry = judgementById[question.dependency_id]
  if (!registry || roleHuman[registry.owner_role] !== question.named_answer_owner || registry.judgement_kind !== question.requested_value_kind) return 'dependency_invalid'
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
    const after = decisions[question.answer_effect_refs[option]]
    if (!after || before.case_id !== after.case_id || before.decision_id !== after.decision_id || imports.accepted_decision_state_schema.material_paths.every(path => same(before[path], after[path]))) return 'effect_invalid'
  }
  if (Object.hasOwn(question.answer_effect_refs, question.unknown_option) || Object.hasOwn(question.answer_effect_refs, question.free_expression_option)) return 'effect_invalid'
  return 'valid'
}
for (const vector of vectors.question_vectors) {
  const question = clone(specimens.question)
  if (vector.mutation?.op === 'repeat_option') question.answer_options[0] = question.answer_options[0].repeat(vector.mutation.count)
  else if (vector.mutation) setAt(question, vector.mutation.path, vector.mutation.value)
  check(`question vector ${vector.id}`, validateQuestion(question, buildSession(vector.session), buildCaseContext()) === vector.expected)
}

function buildRenderReceipt(question = specimens.question) {
  const value = { render_receipt_id: question.question_id === 'question-1' ? 'render-1' : `render-${question.dependency_id}`, session_id: question.named_answer_owner === 'krish' ? 'session-2' : 'session-1', session_state_version: 'session-v1', question_id: question.question_id, question_version: question.question_version, dependency_id: question.dependency_id, named_human_id: question.named_answer_owner, displayed_consequence_text: question.visible_consequence, question_payload_fingerprint: hashValue(question), rendered_at: '2026-09-16T08:30:00Z', receipt_fingerprint: '' }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  return value
}
function buildNormativeReceipt(question = specimens.question, selectedOption = specimens.question.answer_options[0], humanId = 'leader-1', authRef = 'auth-1') {
  const beforeRef = specimens.case_context.current_decision_ref, afterRef = question.answer_effect_refs[selectedOption]
  const before = specimens.decisions[beforeRef], after = specimens.decisions[afterRef]
  const changed = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  const render = buildRenderReceipt(question)
  const value = {
    receipt_type: trust.exact_constants.normative_receipt_type, domain_separator: trust.exact_constants.normative_domain_separator, attestation_id: `att-${question.dependency_id}`, question_id: question.question_id, question_version: question.question_version, dependency_id: question.dependency_id, named_human_id: humanId, authentication_event_ref: authRef, answer_event_ref: question.question_id === 'question-1' ? 'answer-1' : `answer-${question.dependency_id}`, owned_judgement_kind: question.requested_value_kind, answer_status: 'selected', selected_option: selectedOption, free_expression_ref: null, free_expression_confirmation_ref: null, accepted_decision_before_ref: beforeRef, accepted_decision_before_fingerprint: hashValue(before), accepted_decision_after_ref: afterRef, accepted_decision_after_fingerprint: hashValue(after), accepted_decision_changed_paths: changed, render_receipt_ref: render.render_receipt_id, displayed_consequence_text: render.displayed_consequence_text, visible_consequence_fingerprint: hashValue(render.displayed_consequence_text), subject_id: 'leader-1', case_id: 'case-1', purpose_id: 'purpose-1', permitted_audience: ['leader-1', 'krish'], authority_bundle_fingerprint: authorityBundle, issued_at: '2026-09-16T08:35:00Z', valid_until: '2026-09-16T09:35:00Z', receipt_fingerprint: ''
  }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  return { receipt: value, render }
}
function validateRender(render, question) {
  return exactKeys(render, interaction.render_receipt_required) && fingerprint(render, 'receipt_fingerprint') === render.receipt_fingerprint && render.question_id === question.question_id && render.question_version === question.question_version && render.dependency_id === question.dependency_id && render.named_human_id === question.named_answer_owner && render.question_payload_fingerprint === hashValue(question) && render.displayed_consequence_text === question.visible_consequence
}
function validateNormative(receipt, consumeAt, question, render, binding) {
  if (!exactKeys(receipt, trust.normative_receipt_required)) return 'shape_invalid'
  if (fingerprint(receipt, 'receipt_fingerprint') !== receipt.receipt_fingerprint) return 'fingerprint_invalid'
  if (receipt.receipt_type !== trust.exact_constants.normative_receipt_type || receipt.domain_separator !== trust.exact_constants.normative_domain_separator) return 'constant_invalid'
  if (!validateRender(render, question) || receipt.render_receipt_ref !== render.render_receipt_id || receipt.question_id !== question.question_id || receipt.question_version !== question.question_version || receipt.displayed_consequence_text !== render.displayed_consequence_text || receipt.visible_consequence_fingerprint !== hashValue(render.displayed_consequence_text)) return 'render_binding_invalid'
  const expectedQuestion = receipt.question_id === specimens.question.question_id ? specimens.question : buildQuestionForDependency(receipt.dependency_id)
  const registry = judgementById[receipt.dependency_id], selected = receipt.answer_status === 'selected', free = receipt.answer_status === 'free_expression_confirmed'
  if (canonical(question) !== canonical(expectedQuestion) || !registry || (!selected && !free) || receipt.dependency_id !== question.dependency_id || receipt.named_human_id !== question.named_answer_owner || receipt.owned_judgement_kind !== registry.judgement_kind || receipt.owned_judgement_kind !== question.requested_value_kind) return 'question_binding_invalid'
  if (selected && (!question.answer_options.includes(receipt.selected_option) || question.answer_effect_refs[receipt.selected_option] !== receipt.accepted_decision_after_ref || receipt.free_expression_ref !== null || receipt.free_expression_confirmation_ref !== null)) return 'question_binding_invalid'
  if (free && (receipt.selected_option !== question.free_expression_option || !receipt.free_expression_ref || !receipt.free_expression_confirmation_ref || !validateFreeConfirmation(specimens.free_expression_confirmations[receipt.free_expression_confirmation_ref], receipt, question, render))) return 'free_confirmation_invalid'
  if (validateAuthentication(specimens.authentication_events[receipt.authentication_event_ref], receipt.named_human_id, consumeAt) !== 'valid') return 'authentication_invalid'
  const answerEvent = specimens.answer_events[receipt.answer_event_ref]
  if (selected && (!validateAnswerEvent(answerEvent, receipt.named_human_id, question, render) || answerEvent.selected_option !== receipt.selected_option || !(Date.parse(answerEvent.answered_at) <= Date.parse(receipt.issued_at) && Date.parse(receipt.issued_at) <= Date.parse(receipt.valid_until)))) return 'question_binding_invalid'
  for (const field of ['subject_id', 'case_id', 'purpose_id', 'permitted_audience', 'authority_bundle_fingerprint']) if (!same(receipt[field], binding[field])) return 'binding_invalid'
  if (receipt.accepted_decision_before_ref !== specimens.case_context.current_decision_ref) return 'decision_invalid'
  const before = specimens.decisions[receipt.accepted_decision_before_ref], after = specimens.decisions[receipt.accepted_decision_after_ref]
  if (!before || !after || hashValue(before) !== receipt.accepted_decision_before_fingerprint || hashValue(after) !== receipt.accepted_decision_after_fingerprint || before.case_id !== receipt.case_id || after.case_id !== receipt.case_id || before.decision_id !== question.decision_id || after.decision_id !== question.decision_id) return 'decision_invalid'
  const changed = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  if (changed.length === 0 || !same(changed, byteSorted(receipt.accepted_decision_changed_paths))) return 'decision_invalid'
  if (!(Date.parse(render.rendered_at) <= Date.parse(receipt.issued_at) && Date.parse(receipt.issued_at) <= Date.parse(consumeAt) && Date.parse(consumeAt) < Date.parse(receipt.valid_until))) return 'expired'
  return 'valid'
}
const binding = { ...clone(specimens.binding_context), authority_bundle_fingerprint: authorityBundle }
for (const vector of vectors.normative_vectors) {
  const built = buildNormativeReceipt(), receipt = built.receipt
  if (vector.mutation?.op === 'free_expression_valid' || vector.mutation?.op === 'free_expression_late') {
    receipt.answer_status = 'free_expression_confirmed'; receipt.selected_option = specimens.question.free_expression_option; receipt.answer_event_ref = null; receipt.free_expression_ref = 'free-1'; receipt.free_expression_confirmation_ref = 'confirm-1'
    receipt.issued_at = '2026-09-16T08:37:00Z'
    if (vector.mutation.op === 'free_expression_late') receipt.valid_until = '2026-09-16T08:35:30Z'
  } else if (vector.mutation) setAt(receipt, vector.mutation.path, vector.mutation.value)
  receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint')
  check(`normative vector ${vector.id}`, validateNormative(receipt, vector.consume_at ?? binding.server_commit_time, specimens.question, built.render, binding) === vector.expected)
}

function buildFinalReceipt() {
  const value = { receipt_type: trust.exact_constants.final_receipt_type, domain_separator: trust.exact_constants.final_domain_separator, authority_receipt_id: 'final-1', authority_proofs: [{ named_human_id: 'leader-1', authentication_event_ref: 'auth-1', authority_event_ref: 'final-authority-leader-1' }, { named_human_id: 'krish', authentication_event_ref: 'auth-2', authority_event_ref: 'final-authority-krish' }], transition_id: binding.transition_id, subject_id: binding.subject_id, case_id: binding.case_id, purpose_id: binding.purpose_id, permitted_audience: binding.permitted_audience, predecessor_version: binding.predecessor_version, predicate_proof_fingerprint: binding.predicate_proof_fingerprint, authority_bundle_fingerprint: authorityBundle, render_receipt_ref: binding.render_receipt_ref, displayed_consequence_text: binding.displayed_consequence_text, visible_consequence_fingerprint: hashValue(binding.displayed_consequence_text), reserved_transition_receipt_version: binding.reserved_transition_receipt_version, server_commit_time: binding.server_commit_time, valid_until: '2026-09-16T09:30:00Z', authority_receipt_fingerprint: '' }
  value.authority_receipt_fingerprint = fingerprint(value, 'authority_receipt_fingerprint')
  return value
}
function validateFinalAuthorityEvent(event, proof, receipt) {
  if (!event || !exactKeys(event, trust.final_authority_event_required)) return false
  const auth = specimens.authentication_events[proof.authentication_event_ref]
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!issuer || !credential || credential.named_human_id !== proof.named_human_id || event.named_human_id !== proof.named_human_id || !issuer.allowed_methods.includes(event.method)) return false
  if (validateAuthentication(auth, proof.named_human_id, receipt.server_commit_time) !== 'valid' || auth.session_id !== event.session_id || auth.credential_id !== event.credential_id || auth.issuer_id !== event.issuer_id || auth.method !== event.method) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  if (!verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64'))) return false
  for (const field of ['transition_id', 'subject_id', 'case_id', 'purpose_id', 'permitted_audience', 'predecessor_version', 'predicate_proof_fingerprint', 'authority_bundle_fingerprint', 'render_receipt_ref', 'visible_consequence_fingerprint', 'reserved_transition_receipt_version']) if (!same(event[field], receipt[field])) return false
  return Date.parse(auth.issued_at) <= Date.parse(event.authorized_at) && Date.parse(event.authorized_at) <= Date.parse(receipt.server_commit_time) && Date.parse(event.authorized_at) < Date.parse(auth.valid_until)
}
function validateFinal(receipt, context, authorityEvents = specimens.final_authority_events) {
  if (!exactKeys(receipt, trust.final_receipt_required)) return 'shape_invalid'
  if (fingerprint(receipt, 'authority_receipt_fingerprint') !== receipt.authority_receipt_fingerprint) return 'fingerprint_invalid'
  if (receipt.receipt_type !== trust.exact_constants.final_receipt_type || receipt.domain_separator !== trust.exact_constants.final_domain_separator) return 'constant_invalid'
  for (const field of trust.binding_context_required) if (!same(receipt[field], context[field])) return 'binding_invalid'
  if (receipt.visible_consequence_fingerprint !== hashValue(receipt.displayed_consequence_text)) return 'binding_invalid'
  const transition = transitionById[receipt.transition_id], allowed = transition.final_authority.actor_roles.map(role => roleHuman[role]), actual = receipt.authority_proofs.map(value => value.named_human_id)
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

function requiredDependencyIds(transitionId, conditionalContext = { outstanding_obligation_ids: [] }) {
  const transition = transitionById[transitionId]
  if (!transition) return null
  const ids = [...transition.server_dependencies, ...transition.normative_dependencies]
  if (transitionId === 'complete_close') for (const id of conditionalContext.outstanding_obligation_ids ?? []) ids.push(`responsible_human_owner:${id}`, `revisit_date:${id}`)
  return byteSorted(ids)
}
function buildQuestionForDependency(dependencyId) {
  const registry = judgementById[dependencyId], human = roleHuman[registry.owner_role]
  const question = clone(specimens.question)
  question.question_id = `question-${dependencyId}`; question.question_version = 'qv1'; question.dependency_id = dependencyId; question.requested_value_kind = registry.judgement_kind; question.named_answer_owner = human
  return question
}
function buildPredicateProof(transitionId) {
  const conditionalContext = { outstanding_obligation_ids: [] }, expectedIds = requiredDependencyIds(transitionId, conditionalContext)
  const evidence = {}, results = []
  for (const id of expectedIds) {
    if (ownerById[id]) {
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
  if (!exactKeys(proof, semantic.predicate_proof_required) || fingerprint(proof, 'proof_fingerprint') !== proof.proof_fingerprint) return 'proof_invalid'
  const expected = requiredDependencyIds(proof.transition_id, proof.conditional_context)
  if (!expected || expected.length === 0) return 'contract_invalid'
  const actual = proof.dependency_results.map(value => value.dependency_id)
  if (!proof.dependency_results.every(value => exactKeys(value, semantic.dependency_result_required)) || !unique(actual) || !same(byteSorted(actual), expected) || !same(proof.expected_dependency_ids, expected) || proof.expected_dependency_set_seal !== hashValue(expected)) return 'set_mismatch'
  if (proof.subject_id !== binding.subject_id || proof.case_id !== binding.case_id || proof.purpose_id !== binding.purpose_id || !same(proof.permitted_audience, binding.permitted_audience) || proof.authority_bundle_fingerprint !== authorityBundle) return 'binding_invalid'
  for (const result of proof.dependency_results) {
    const item = evidence[result.evidence_ref]
    if (!item || item.dependency_id !== result.dependency_id || hashValue(item.value) !== result.evidence_fingerprint) return 'evidence_invalid'
    if (ownerById[result.dependency_id] && validateProfile(result.dependency_id, item.value.profile, proof.evaluation_time, item.value.derived_proof) !== 'valid') return 'evidence_invalid'
    if (judgementById[result.dependency_id] && validateNormative(item.value, proof.evaluation_time, item.question, item.render, binding) !== 'valid') return 'evidence_invalid'
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
  proof.proof_fingerprint = fingerprint(proof, 'proof_fingerprint')
  check(`predicate vector ${vector.id}`, validatePredicate(proof, built.evidence) === vector.expected)
}
check('predicate cannot steer', semantic.proof_may_apply_transition === false)

const tupleKey = value => `${value.dependency_id}|${value.dependency_fingerprint}|${value.edge_kind}`
function buildCorrection() {
  const graph = clone(specimens.correction_graph); graph.graph_fingerprint = fingerprint(graph, 'graph_fingerprint')
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
  const artifactByDependency = { 'dep-1': 'projection-1', 'dep-2': 'release-1', 'dep-3': 'permission-1' }
  const actionByDependency = { 'dep-1': 'rebuild_projection', 'dep-2': 'require_human_review', 'dep-3': 'quarantine_artifact' }
  const statusByDependency = { 'dep-1': 'rebuilt', 'dep-2': 'review_required', 'dep-3': 'quarantined' }
  const receipts = members.map(member => {
    const value = { receipt_type: 'correction_terminal', domain_separator: trust.exact_constants.correction_domain_separator, repair_id: 'repair-1', graph_head: graph.graph_head, graph_epoch: graph.graph_epoch, dependency_set_seal: closure.dependency_set_seal, subject_id: graph.subject_id, case_id: graph.case_id, purpose_id: graph.purpose_id, permitted_audience: graph.permitted_audience, trigger_ref: 'correction-1', challenged_proof_ref: 'proof-1', ...member, dependency_use_ref: `use-${member.dependency_id}`, affected_artifact_ref: artifactByDependency[member.dependency_id], repair_action: actionByDependency[member.dependency_id], history_preserved_ref: `history-${member.dependency_id}`, descendant_block_ref: `block-${member.dependency_id}`, fresh_reopen_authority_ref: 'not_reopened', terminal_status: statusByDependency[member.dependency_id], current_steering_eligibility: false, resulting_version_ref: member.dependency_id === 'dep-1' ? 'projection-2' : null, issued_at: '2026-09-16T09:05:00Z', receipt_fingerprint: '' }
    value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint'); return value
  })
  return { graph, closure, receipts, artifactByDependency }
}
function validateCorrection(graph, closure, receipts, artifactByDependency, authoritativeReceiptFingerprints) {
  if (!exactKeys(graph, correction.authoritative_dependency_graph_required) || !graph.edges.every(value => exactKeys(value, correction.edge_required)) || fingerprint(graph, 'graph_fingerprint') !== graph.graph_fingerprint) return 'graph_or_binding_invalid'
  const expectedBuilt = buildCorrection(), expected = expectedBuilt.closure
  if (graph.graph_head !== expectedBuilt.graph.graph_head || graph.graph_epoch !== expectedBuilt.graph.graph_epoch || graph.graph_fingerprint !== expectedBuilt.graph.graph_fingerprint) return 'graph_or_binding_invalid'
  if (!exactKeys(closure, correction.sealed_closure_required) || !closure.members.every(value => exactKeys(value, correction.member_required)) || !same(closure, expected) || fingerprint(closure, 'dependency_set_seal') !== closure.dependency_set_seal) return 'closure_or_receipt_mismatch'
  if (!receipts.every(value => exactKeys(value, correction.repair_receipt_required))) return 'receipt_or_steering_invalid'
  for (const receipt of receipts) {
    if (fingerprint(receipt, 'receipt_fingerprint') !== receipt.receipt_fingerprint) return 'receipt_fingerprint_invalid'
    if (receipt.receipt_type !== 'correction_terminal' || receipt.domain_separator !== trust.exact_constants.correction_domain_separator || !correction.repair_action_values.includes(receipt.repair_action) || !correction.terminal_status_values.includes(receipt.terminal_status) || receipt.current_steering_eligibility !== false) return 'receipt_or_steering_invalid'
    if (authoritativeReceiptFingerprints[tupleKey(receipt)] !== receipt.receipt_fingerprint) return 'authoritative_receipt_mismatch'
    for (const field of ['graph_head', 'graph_epoch', 'dependency_set_seal', 'subject_id', 'case_id', 'purpose_id', 'permitted_audience']) if (!same(receipt[field], closure[field])) return 'graph_or_binding_invalid'
    if (artifactByDependency[receipt.dependency_id] !== receipt.affected_artifact_ref || !receipt.history_preserved_ref || !receipt.descendant_block_ref || receipt.fresh_reopen_authority_ref !== 'not_reopened') return 'receipt_or_steering_invalid'
  }
  const memberKeys = closure.members.map(tupleKey), receiptKeys = receipts.map(tupleKey)
  if (!unique(receiptKeys) || !same(byteSorted(memberKeys), byteSorted(receiptKeys))) return 'closure_or_receipt_mismatch'
  return 'complete'
}
for (const vector of vectors.correction_vectors) {
  const built = buildCorrection()
  const authoritativeReceiptFingerprints = Object.fromEntries(built.receipts.map(value => [tupleKey(value), value.receipt_fingerprint]))
  if (vector.mutation?.op === 'remove_receipt') built.receipts = built.receipts.filter(value => value.dependency_id !== vector.mutation.dependency_id)
  if (vector.mutation?.op === 'tamper_receipt_without_rehash') built.receipts.find(value => value.dependency_id === vector.mutation.dependency_id)[vector.mutation.field] = vector.mutation.value
  if (vector.mutation?.op === 'tamper_receipt_and_rehash') { const receipt = built.receipts.find(value => value.dependency_id === vector.mutation.dependency_id); receipt[vector.mutation.field] = vector.mutation.value; receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint') }
  if (vector.mutation?.op === 'change_graph_epoch_only') built.graph.graph_epoch = vector.mutation.value
  if (vector.mutation?.op === 'set_current_steering') { const receipt = built.receipts.find(value => value.dependency_id === vector.mutation.dependency_id); receipt.current_steering_eligibility = vector.mutation.value; receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint') }
  check(`correction vector ${vector.id}`, validateCorrection(built.graph, built.closure, built.receipts, built.artifactByDependency, authoritativeReceiptFingerprints) === vector.expected)
}

const externalTransitionByKey = Object.fromEntries(external.transitions.map(value => [`${value.from}|${value.event_type}`, value]))
const expectedGuardByEvent = { commit_local_reservation: 'reservation_unique_and_first_compare_and_set_exact', acquire_bound_external_authority: 'active_exact_policy_and_bound_unexpired_token_or_lease', reservation_cancel_or_expire: 'valid_abort_terminal_receipt', commit_local_provisional: 'first_compare_and_set_exact_and_provisional_version_created', local_commit_failed_release_or_expire: 'valid_release_or_expiry_terminal_receipt', immutable_lease_still_current: 'lease_finality_and_second_compare_and_set_exact', conditional_token_consumed: 'single_use_token_finality_and_second_compare_and_set_exact', ack_lost_query_same_token_nonce: 'same_request_identity_and_no_steering', authority_mismatch: 'valid_quarantine_terminal_receipt', reconciliation_failed: 'valid_quarantine_terminal_receipt_and_descendant_block' }
check('external guard program exact and executable', external.transitions.every(value => value.guard === expectedGuardByEvent[value.event_type]))
function buildExternalEvent(eventType, fromState, reservation) {
  const terminal = ['reservation_cancel_or_expire', 'local_commit_failed_release_or_expire', 'authority_mismatch', 'reconciliation_failed'].includes(eventType)
  const value = { event_id: `event-${eventType}`, event_type: eventType, from_state: fromState, reservation_id: reservation.reservation_id, reserved_receipt_version: reservation.reserved_receipt_version, fact_kind: reservation.fact_kind, policy_id: reservation.policy_id, external_identity: reservation.external_identity, idempotency_key: reservation.idempotency_key, transaction_nonce: reservation.transaction_nonce, canonical_request_fingerprint: reservation.canonical_request_fingerprint, predecessor_version: reservation.predecessor_version, source_heads_seal: reservation.source_heads_seal, set_seals_fingerprint: reservation.set_seals_fingerprint, revocation_epochs_fingerprint: reservation.revocation_epochs_fingerprint, human_authority_receipt_fingerprint: reservation.human_authority_receipt_fingerprint, visible_consequence_fingerprint: reservation.visible_consequence_fingerprint, provisional_transition_version: reservation.provisional_transition_version, protocol: reservation.protocol, protocol_evidence: eventType === 'immutable_lease_still_current' ? { lease_revision: 'lease-1', policy_id: reservation.policy_id, fact_kind: reservation.fact_kind, external_identity: reservation.external_identity, current: true } : eventType === 'conditional_token_consumed' ? { token_id: reservation.external_identity, reservation_id: reservation.reservation_id, transaction_nonce: reservation.transaction_nonce, consumed_once: true } : { acknowledged: true }, server_transaction_time: reservation.server_transaction_time, valid_until: reservation.valid_until, maximum_clock_skew_seconds: reservation.maximum_clock_skew_seconds, terminal_receipt_ref: terminal ? `terminal-${eventType}` : null, event_fingerprint: '' }
  value.event_fingerprint = fingerprint(value, 'event_fingerprint'); return value
}
function sameReservationBindings(event, reservation, fields) { return fields.every(field => field === 'same_or_stricter_validity_boundary' ? Date.parse(event.valid_until) <= Date.parse(reservation.valid_until) : field === 'protocol_evidence' ? Boolean(event.protocol_evidence) : same(event[field], reservation[field])) }
function executeExternal(eventTypes, policy, mutation, consumed = new Set()) {
  const reservation = clone(specimens.external_reservation), policies = policy ? [policy] : [], seen = new Map()
  if (policy) reservation.protocol = policy.protocol
  let state = 'unreserved'
  for (const eventType of eventTypes) {
    const edge = externalTransitionByKey[`${state}|${eventType}`]
    if (!edge) return 'illegal_transition'
    if (edge.guard !== expectedGuardByEvent[eventType]) return 'guard_failed'
    const event = buildExternalEvent(eventType, state, reservation)
    if (mutation?.event === eventType) { setAt(event, mutation.path, mutation.value); event.event_fingerprint = fingerprint(event, 'event_fingerprint') }
    if (!exactKeys(event, external.event_required) || fingerprint(event, 'event_fingerprint') !== event.event_fingerprint || event.from_state !== state) return 'guard_failed'
    const identity = `${event.idempotency_key}|${event.transaction_nonce}`
    if (seen.has(identity) && seen.get(identity) !== event.canonical_request_fingerprint) return 'collision'
    seen.set(identity, event.canonical_request_fingerprint)
    if (eventType === 'commit_local_reservation' && !sameReservationBindings(event, reservation, external.first_compare_and_set)) return 'guard_failed'
    if (eventType === 'acquire_bound_external_authority') {
      const active = policies.find(value => value.policy_id === event.policy_id && value.fact_kind === event.fact_kind && value.external_identity === event.external_identity && value.protocol === event.protocol)
      if (!active) return 'policy_inactive'
      if (!(Date.parse(event.server_transaction_time) + event.maximum_clock_skew_seconds * 1000 < Date.parse(event.valid_until))) return 'guard_failed'
    }
    if (eventType === 'commit_local_provisional' && !sameReservationBindings(event, reservation, external.first_compare_and_set)) return 'guard_failed'
    if (eventType === 'immutable_lease_still_current') {
      if (event.protocol !== 'immutable_authority_lease' || !sameReservationBindings(event, reservation, external.second_compare_and_set) || event.protocol_evidence.current !== true || event.protocol_evidence.external_identity !== reservation.external_identity) return 'guard_failed'
    }
    if (eventType === 'conditional_token_consumed') {
      if (event.protocol !== 'online_conditional_verify_and_consume' || !sameReservationBindings(event, reservation, external.second_compare_and_set) || consumed.has(event.external_identity) || event.protocol_evidence.consumed_once !== true) return 'guard_failed'
      consumed.add(event.external_identity)
    }
    if (eventType === 'ack_lost_query_same_token_nonce' && !sameReservationBindings(event, reservation, ['external_identity', 'idempotency_key', 'transaction_nonce', 'canonical_request_fingerprint'])) return 'collision'
    if (['reservation_cancel_or_expire', 'local_commit_failed_release_or_expire', 'authority_mismatch', 'reconciliation_failed'].includes(eventType) && !event.terminal_receipt_ref) return 'guard_failed'
    state = edge.to
  }
  return state
}
for (const vector of vectors.external_vectors) {
  const policy = vector.policy === 'none' ? null : clone(specimens[vector.policy])
  const consumed = new Set(vector.mutation?.op === 'preconsume_external_identity' ? [specimens.external_reservation.external_identity] : [])
  check(`external vector ${vector.id}`, executeExternal(vector.events, policy, vector.mutation?.op ? null : vector.mutation, consumed) === vector.expected)
}
check('external effective authority inactive', external.authoritative_external_fact_policies.length === 0 && external.unsupported_external_assertion === 'evidence_only_indeterminate')
check('only finalized steers', external.steering_state === 'finalized')

const vectorGroups = ['authentication_vectors', 'semantic_profile_vectors', 'normative_vectors', 'final_authority_vectors', 'predicate_vectors', 'question_vectors', 'correction_vectors', 'external_vectors']
check('all vector IDs globally unique', unique(vectorGroups.flatMap(group => vectors[group].map(value => value.id))))
if (failures.length) {
  console.error(`R81 independent conformance failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`ok: R81 end-to-end bound contract; ${imports.transition_catalogue.length} transitions; ${vectorGroups.reduce((sum, group) => sum + vectors[group].length, 0)} executable vectors`)
