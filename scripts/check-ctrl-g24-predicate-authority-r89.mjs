import { createHash, createPublicKey, verify } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r89'
const sourceFiles = ['01-effective-resolution.json', '02-trust-and-context-program.json', '03-semantic-set-program.json', '04-interaction-program.json', '05-correction-program.json', '06-external-program.json', '07-executable-vectors.json']
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const checkEq = (name, actual, expected) => { if (actual !== expected) failures.push(`${name} expected=${expected} actual=${actual}`) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sorted = values => [...values].sort((a, b) => String(a).localeCompare(String(b), 'en', { usage: 'sort', sensitivity: 'variant' }))
const byteSorted = values => [...values].sort((a, b) => Buffer.from(String(a)).compare(Buffer.from(String(b))))
const unique = values => values.length === new Set(values).size
function finiteJson(value, seen = new WeakSet()) {
  try {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
    if (typeof value === 'number') return Number.isFinite(value)
    if (!value || typeof value !== 'object' || seen.has(value)) return false
    seen.add(value)
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || Object.keys(value).length !== value.length) return false
      const valid = value.every(item => finiteJson(item, seen)); seen.delete(value); return valid
    }
    if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false
    const descriptors = Object.getOwnPropertyDescriptors(value)
    if (Object.values(descriptors).some(descriptor => !Object.hasOwn(descriptor, 'value'))) return false
    const valid = Object.values(descriptors).every(descriptor => finiteJson(descriptor.value, seen)); seen.delete(value); return valid
  } catch { return false }
}
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
const validPath = path => Array.isArray(path) && path.length > 0 && path.every(key => typeof key === 'string' || Number.isInteger(key))
const setAt = (object, path, value) => { if (!finiteJson(object) || !validPath(path) || !finiteJson(value)) return false; let cursor = object; for (const key of path.slice(0, -1)) { if (!cursor || typeof cursor !== 'object' || !Object.hasOwn(cursor, key)) return false; cursor = cursor[key] } if (!cursor || typeof cursor !== 'object') return false; cursor[path.at(-1)] = clone(value); return true }
const deleteAt = (object, path) => { if (!finiteJson(object) || !validPath(path)) return false; let cursor = object; for (const key of path.slice(0, -1)) { if (!cursor || typeof cursor !== 'object' || !Object.hasOwn(cursor, key)) return false; cursor = cursor[key] } if (!cursor || typeof cursor !== 'object') return false; delete cursor[path.at(-1)]; return true }
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
  effective_resolution: ['schema_version', 'module_id', 'semantic_base', 'imported_exact_sections', 'r89_replacement_sections', 'inheritance_rule', 'unknown_or_conflicting_section', 'authority_still_closed'],
  trust_and_context_program: ['schema_version', 'module_id', 'canonicalization', 'fingerprint', 'exact_constants', 'trusted_authenticator_registry', 'authentication_event_required', 'answer_event_required', 'answer_state_transition_event_required', 'answer_state_revalidation_event_required', 'final_authority_event_required', 'normative_receipt_required', 'final_receipt_required', 'authority_proof_required', 'free_expression_confirmation_required', 'binding_context_required', 'rules', 'workload_or_model_issuer'],
  semantic_set_program: ['schema_version', 'module_id', 'profile_validation', 'derivation_registry', 'derived_profile_rules', 'fixture_authority_resolver', 'authoritative_source_record_required', 'authoritative_source_store', 'closed_predecessor_record_required', 'closed_predecessor_store', 'derivation_execution_rules', 'authoritative_conditional_state', 'conditional_dependency_rules', 'derived_fact_proof_required', 'derived_input_required', 'predicate_proof_required', 'dependency_result_required', 'disposition_classes', 'precedence', 'class_to_result', 'complete_set_rules', 'proof_may_apply_transition'],
  interaction_program: ['schema_version', 'module_id', 'session_state_required', 'unresolved_gap_set_required', 'question_reservation_required', 'krish_session_receipt_required', 'question_required', 'render_receipt_required', 'final_decision_render_required', 'transition_effect_required', 'final_render_rules', 'answer_state_record_required', 'answer_state_store_required', 'answer_state_root_required', 'answer_state_head_required', 'answer_state_snapshot_required', 'answer_state_rules', 'answer_state_store', 'answer_state_snapshot', 'free_expression_interpretation_required', 'free_expression_render_required', 'canonical_case_context_required', 'copy_limits', 'technical_vocabulary_forbidden', 'routing_rules', 'question_rules', 'judgement_contracts', 'default_surface'],
  correction_program: ['schema_version', 'module_id', 'authoritative_dependency_graph_required', 'edge_required', 'edge_kind_values', 'sealed_closure_required', 'member_required', 'repair_receipt_required', 'repair_action_values', 'terminal_status_values', 'authoritative_referent_required', 'authoritative_referent_store', 'authoritative_fixture_graphs', 'accepted_final_record_required', 'accepted_final_registry_required', 'accepted_final_challenge_required', 'descendant_block_required', 'revalidation_record_required', 'answer_state_repair_rules', 'validation_rules', 'receipt_current_steering_eligibility'],
  external_program: ['schema_version', 'module_id', 'authoritative_external_fact_policies', 'test_only_policy_registry', 'unsupported_external_assertion', 'states', 'event_required', 'protocols', 'lease_evidence_required', 'consume_evidence_required', 'ack_evidence_required', 'terminal_receipt_required', 'effective_terminal_receipts', 'test_only_terminal_receipts', 'transaction_registry_contract', 'first_compare_and_set', 'second_compare_and_set', 'transitions', 'guard_rules', 'retry', 'steering_state'],
  executable_vectors: ['schema_version', 'module_id', 'specimens', 'authentication_vectors', 'semantic_profile_vectors', 'normative_vectors', 'final_authority_vectors', 'predicate_vectors', 'question_vectors', 'routing_vectors', 'answer_state_vectors', 'correction_vectors', 'external_vectors']
}
for (const [id, keys] of Object.entries(expectedTopKeys)) check(`closed module ${id}`, exactKeys(modules[id], keys))
check('seven unique modules', Object.keys(modules).length === 7 && unique(Object.keys(modules)))
check('resolution records closed', resolution.imported_exact_sections.every(value => exactKeys(value, ['effective_section', 'path', 'json_pointer'])))
check('trust registry closed', trust.trusted_authenticator_registry.every(value => exactKeys(value, ['issuer_id', 'algorithm', 'public_key_spki_pem', 'allowed_methods', 'allowed_credentials']) && value.allowed_credentials.every(credential => exactKeys(credential, ['credential_id', 'named_human_id']))))
check('trust constants closed', exactKeys(trust.exact_constants, ['normative_receipt_type', 'normative_domain_separator', 'final_receipt_type', 'final_domain_separator', 'correction_domain_separator']))
check('semantic nested programs closed', exactKeys(semantic.profile_validation, ['schema_source', 'additional_fields', 'owner_binding_source', 'content_fingerprint', 'validity', 'accepted_brain_item', 'contrary_assertions', 'unregistered_dependency']) && semantic.derivation_registry.every(value => exactKeys(value, ['dependency_id', 'function_id', 'version', 'input_fact_kinds', 'freshness', 'non_widening'])) && exactKeys(semantic.disposition_classes, ['present', 'contradicted', 'missing', 'stale', 'unreadable', 'ambiguous', 'revoked']) && exactKeys(semantic.class_to_result, ['indeterminate', 'contradicted', 'present']) && exactKeys(semantic.authoritative_source_store, ['store_id', 'store_version', 'records']) && semantic.authoritative_source_store.records.every(value => exactKeys(value, semantic.authoritative_source_record_required)) && exactKeys(semantic.closed_predecessor_store, ['store_id', 'store_version', 'records']) && semantic.closed_predecessor_store.records.every(value => exactKeys(value, semantic.closed_predecessor_record_required)))
check('semantic conditional set sealed', fingerprint(semantic.authoritative_conditional_state, 'set_seal') === semantic.authoritative_conditional_state.set_seal)
check('interaction nested programs closed', exactKeys(interaction.copy_limits, ['heading', 'question', 'answer_option_each', 'unknown_option', 'free_expression_option', 'visible_consequence', 'optional_note_label', 'primary_action_label', 'total_visible_characters', 'answer_options']) && exactKeys(interaction.default_surface, ['heading_count', 'question_count', 'answer_control_group_count', 'optional_note_count', 'primary_action_count', 'automatic_follow_up_count', 'technical_label_count']) && same(interaction.transition_effect_required, ['transition_id', 'from_state', 'to_state', 'authority', 'invalidation', 'receipt', 'plain_language_action']) && exactKeys(interaction.answer_state_store, interaction.answer_state_store_required) && exactKeys(interaction.answer_state_snapshot, interaction.answer_state_snapshot_required) && interaction.answer_state_store.records.every(record => exactKeys(record, interaction.answer_state_record_required)) && interaction.answer_state_snapshot.history_roots.every(record => exactKeys(record, interaction.answer_state_root_required)) && interaction.answer_state_snapshot.history_heads.every(record => exactKeys(record, interaction.answer_state_head_required)) && interaction.judgement_contracts.every(contract => exactKeys(contract, ['contract_id', 'judgement_kind', 'dependency_ids', 'heading', 'question', 'visible_consequence', 'answers']) && contract.answers.every(answer => exactKeys(answer, ['option', 'effect_id', 'patch', 'transition_disposition']) && exactKeys(answer.patch, ['path', 'value']) && ['supports_transition', 'blocks_transition'].includes(answer.transition_disposition))))
check('correction authority fixtures closed', correction.authoritative_fixture_graphs.length >= 2 && correction.authoritative_fixture_graphs.every(fixture => exactKeys(fixture, ['graph', 'repairs']) && fixture.repairs.every(repair => exactKeys(repair, ['dependency_id', 'trigger_ref', 'challenged_proof_ref', 'dependency_use_ref', 'affected_artifact_ref', 'repair_action', 'history_preserved_ref', 'descendant_block_ref', 'terminal_status', 'resulting_version_ref']))))
check('correction referent store closed', exactKeys(correction.authoritative_referent_store, ['store_id', 'store_version', 'records']) && Array.isArray(correction.authoritative_referent_store.records) && correction.authoritative_referent_store.records.every(record => exactKeys(record, correction.authoritative_referent_required)) && unique(correction.authoritative_referent_store.records.map(record => record.ref)))
check('accepted final registry schemas closed', same(correction.accepted_final_registry_required, ['registry_id', 'records']) && Array.isArray(correction.accepted_final_record_required) && correction.accepted_final_record_required.length > 10 && Array.isArray(correction.accepted_final_challenge_required) && Array.isArray(correction.descendant_block_required) && Array.isArray(correction.revalidation_record_required) && Array.isArray(correction.answer_state_repair_rules) && correction.answer_state_repair_rules.length >= 7)
check('external nested programs closed', external.transitions.every(value => exactKeys(value, ['from', 'event_type', 'to', 'guard'])) && exactKeys(external.retry, ['new_nonce_on_retry', 'same_identity_same_bytes', 'same_identity_changed_bytes']) && exactKeys(external.transaction_registry_contract, ['store', 'idempotency_scope', 'consume_scope', 'atomic_compare_and_set', 'caller_supplied_registry', 'same_request_replay', 'cross_consumer_scope']))
check('vector specimen catalogue closed', exactKeys(specimens, ['authentication_events', 'answer_events', 'answer_state_transition_events', 'answer_state_revalidation_events', 'route_receipts', 'free_expressions', 'structured_interpretations', 'free_expression_renders', 'free_expression_confirmations', 'final_authority_events', 'decisions', 'case_context', 'question', 'empty_session', 'asked_session', 'binding_context', 'correction_graph', 'external_reservation', 'test_external_policy', 'test_consume_policy']))
check('R83 semantic base exact', same(resolution.semantic_base, { commit: '7ad53b0137a24b58b145f062883745030e198a01', tree: '2abfd1236f994d96671dd219b1e8988026e99db7', standing: 'vetoed_source_material_not_effective_authority' }))
check('R83 tree independently resolved', git(['rev-parse', `${resolution.semantic_base.commit}^{tree}`]) === resolution.semantic_base.tree)
check('R83 effective blob exact', git(['rev-parse', `${resolution.semantic_base.commit}:project-documentation/ctrl-evolution/g24-predicate-authority-r83/08-effective-contract.json`]) === '22fddaf5c8d0f453c7b2f70dc773ef4139c7316e')
check('single exact inheritance rule', resolution.inheritance_rule === 'only_named_exact_sections_are_imported_every_other_r83_rule_is_replaced' && resolution.unknown_or_conflicting_section === 'reject_contract')

const imports = Object.fromEntries(resolution.imported_exact_sections.map(record => [record.effective_section, pointer(gitJson(resolution.semantic_base.commit, record.path), record.json_pointer)]))
check('every judgement has one visible contract', imports.atomic_judgement_registry.every(judgement => interaction.judgement_contracts.filter(contract => contract.dependency_ids.includes(judgement.dependency_id) && contract.judgement_kind === judgement.judgement_kind).length === 1))
const authorityMaterial = { imports, trust_and_context_program: trust, semantic_set_program: semantic, interaction_program: interaction, correction_program: correction, external_program: external }
const authorityBundle = sha256(`${canonical(authorityMaterial)}\n`)
const expectedEffective = { schema_version: 'ctrl.g24.predicate-authority.r89.effective-contract.v1', authority_bundle_fingerprint: authorityBundle, ...imports, trust_and_context_program: trust, semantic_set_program: semantic, interaction_program: interaction, correction_program: correction, external_program: external, executable_vectors: vectors, authority_still_closed: resolution.authority_still_closed }
const effectiveBytes = readFileSync(join(root, `${directory}/08-effective-contract.json`))
check('effective contract independently assembled', effectiveBytes.toString('utf8') === `${canonical(expectedEffective)}\n`)
const manifest = readJson(`${directory}/00-manifest.json`)
const records = sourceFiles.map(file => { const path = `${directory}/${file}`; const bytes = readFileSync(join(root, path)); const value = JSON.parse(bytes); return { path, module_id: value.module_id, schema_version: value.schema_version, bytes: bytes.length, sha256: sha256(bytes) } })
check('manifest schema and authority metadata exact', manifest.schema_version === 'ctrl.g24.predicate-authority.r89.manifest.v1' && manifest.standing === 'bound_local_contract_candidate_no_runtime_authority' && manifest.decision_id === 'DEC-20260916-g24-predicate-authority-r75' && canonical(manifest.semantic_base) === canonical(resolution.semantic_base) && manifest.resolution_rule === resolution.inheritance_rule)
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
  if (!finiteJson(event) || !finiteJson(question) || !finiteJson(render) || typeof expectedHuman !== 'string' || typeof expectedOption !== 'string' || !exactKeys(event, trust.answer_event_required) || !exactKeys(question, interaction.question_required) || !exactKeys(render, interaction.render_receipt_required) || typeof event.issuer_signature_base64 !== 'string' || typeof event.answered_at !== 'string' || !Array.isArray(question.answer_options)) return false
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!issuer || !credential || credential.named_human_id !== expectedHuman || event.named_human_id !== expectedHuman || !issuer.allowed_methods.includes(event.method)) return false
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) && event.question_id === question.question_id && event.question_version === question.question_version && event.selected_option === expectedOption && question.answer_options.includes(expectedOption) && event.render_receipt_fingerprint === render.receipt_fingerprint && Date.parse(render.rendered_at) <= Date.parse(event.answered_at) } catch { return false }
}
function validateAnswerStateTransitionEvent(event, record, predecessor) {
  if (!finiteJson(event) || !finiteJson(record) || (predecessor !== null && !finiteJson(predecessor)) || !exactKeys(event, trust.answer_state_transition_event_required)) return false
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  const authentication = specimens.authentication_events[event.authentication_event_ref]
  const answer = specimens.answer_events[event.answer_ref] ?? specimens.free_expression_confirmations[event.answer_ref]
  if (!issuer || !credential || !authentication || !answer || credential.named_human_id !== event.named_human_id || answer.named_human_id !== event.named_human_id || !issuer.allowed_methods.includes(event.method) || validateAuthentication(authentication, event.named_human_id, event.authorized_at) !== 'valid' || authentication.session_id !== event.session_id || authentication.issuer_id !== event.issuer_id || authentication.credential_id !== event.credential_id || authentication.method !== event.method) return false
  const previousMatches = predecessor === null
    ? event.prior_state_id === null && event.prior_state_version === null && event.prior_state_fingerprint === null && event.action === 'admit' && event.issuer_sequence === 1
    : event.prior_state_id === predecessor.answer_state_id && event.prior_state_version === predecessor.state_version && event.prior_state_fingerprint === predecessor.state_fingerprint && event.issuer_sequence === predecessor.issuer_sequence + 1 && ['supersede', 'correct', 'withdraw', 'reanswer'].includes(event.action)
  const answerTime = answer.answered_at ?? answer.confirmed_at
  const actionMatches = event.action === 'admit' ? event.standing === 'current' : event.action === 'withdraw' ? event.standing === 'withdrawn' && predecessor !== null && event.answer_ref === predecessor.current_answer_ref : ['supersede', 'correct', 'reanswer'].includes(event.action) && event.standing === 'current'
  const recordMatches = event.route_ref === record.route_ref && event.question_id === record.question_id && event.question_version === record.question_version && event.new_state_id === record.answer_state_id && event.new_state_version === record.state_version && event.issuer_sequence === record.issuer_sequence && event.answer_ref === record.current_answer_ref && event.answer_fingerprint === record.current_answer_fingerprint && event.standing === record.standing && event.status_text === record.status_text && event.question_id === answer.question_id && event.question_version === answer.question_version && event.answer_fingerprint === hashValue(answer) && typeof answerTime === 'string' && Date.parse(answerTime) <= Date.parse(event.authorized_at)
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try {
    const signatureValid = verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64'))
    if (process.env.R89_DEBUG && !(previousMatches && actionMatches && recordMatches && signatureValid)) console.error('answer transition invalid', event.event_id, { previousMatches, actionMatches, recordMatches, signatureValid, answerTime, authorized_at: event.authorized_at })
    return previousMatches && actionMatches && recordMatches && signatureValid
  } catch { return false }
}
function validateAnswerStateRecord(record, predecessor) {
  if (!finiteJson(record) || !exactKeys(record, interaction.answer_state_record_required) || !Number.isInteger(record.issuer_sequence) || record.issuer_sequence < 1 || !['current', 'withdrawn'].includes(record.standing) || !Array.isArray(record.member_answer_refs) || !record.member_answer_refs.length || !record.member_answer_refs.every(value => typeof value === 'string') || !unique(record.member_answer_refs) || typeof record.status_text !== 'string' || record.status_text.length < 12 || record.status_text.length > 120) return false
  const answer = specimens.answer_events[record.current_answer_ref] ?? specimens.free_expression_confirmations[record.current_answer_ref]
  const transition = specimens.answer_state_transition_events[record.transition_event_ref]
  const predecessorMatches = predecessor === null
    ? record.predecessor_state_id === null && record.predecessor_state_version === null && record.predecessor_state_fingerprint === null && record.supersedes_answer_ref === null
    : record.predecessor_state_id === predecessor.answer_state_id && record.predecessor_state_version === predecessor.state_version && record.predecessor_state_fingerprint === predecessor.state_fingerprint && record.supersedes_answer_ref === predecessor.current_answer_ref
  return Boolean(answer && transition && predecessorMatches && answer.question_id === record.question_id && answer.question_version === record.question_version && hashValue(answer) === record.current_answer_fingerprint && record.member_answer_refs.includes(record.current_answer_ref) && same(record.member_answer_refs, byteSorted(record.member_answer_refs)) && record.member_set_seal === hashValue(record.member_answer_refs) && hashValue(transition) === record.transition_event_fingerprint && fingerprint(record, 'state_fingerprint') === record.state_fingerprint && validateAnswerStateTransitionEvent(transition, record, predecessor))
}
function validateAnswerStateSnapshot(store, snapshot) {
  if (!finiteJson(store) || !finiteJson(snapshot) || !exactKeys(store, interaction.answer_state_store_required) || !exactKeys(snapshot, interaction.answer_state_snapshot_required) || !Array.isArray(store.records) || !Array.isArray(snapshot.history_roots) || !Array.isArray(snapshot.history_heads)) return false
  if (fingerprint(store, 'store_fingerprint') !== store.store_fingerprint || snapshot.store_id !== store.store_id || snapshot.store_version !== store.store_version || snapshot.store_fingerprint !== store.store_fingerprint || fingerprint(snapshot, 'snapshot_fingerprint') !== snapshot.snapshot_fingerprint) return false
  if (!store.records.length || !unique(store.records.map(record => record.answer_state_id)) || !unique(store.records.map(record => record.transition_event_ref))) return false
  const keys = byteSorted([...new Set(store.records.map(record => `${record.route_ref}|${record.question_id}`))])
  if (!unique(snapshot.history_roots.map(record => `${record.route_ref}|${record.question_id}`)) || !unique(snapshot.history_heads.map(record => `${record.route_ref}|${record.question_id}`)) || !same(keys, byteSorted(snapshot.history_roots.map(record => `${record.route_ref}|${record.question_id}`))) || !same(keys, byteSorted(snapshot.history_heads.map(record => `${record.route_ref}|${record.question_id}`)))) return false
  for (const key of keys) {
    const [routeRef, questionId] = key.split('|'), ordered = store.records.filter(record => record.route_ref === routeRef && record.question_id === questionId).sort((a, b) => a.issuer_sequence - b.issuer_sequence)
    const root = snapshot.history_roots.find(record => record.route_ref === routeRef && record.question_id === questionId), head = snapshot.history_heads.find(record => record.route_ref === routeRef && record.question_id === questionId)
    if (!root || !head || !exactKeys(root, interaction.answer_state_root_required) || !exactKeys(head, interaction.answer_state_head_required) || ordered.length !== head.head_issuer_sequence || !unique(ordered.map(record => record.state_version)) || ordered.some((record, index) => record.issuer_sequence !== index + 1)) return false
    let answers = [], stateIds = [], stateFingerprints = []
    for (const [index, record] of ordered.entries()) {
      const predecessor = index === 0 ? null : ordered[index - 1]
      if (!validateAnswerStateRecord(record, predecessor)) return false
      answers = byteSorted([...new Set([...answers, record.current_answer_ref])]); stateIds.push(record.answer_state_id); stateFingerprints.push(record.state_fingerprint)
      if (!same(record.member_answer_refs, answers)) return false
    }
    const first = ordered[0], last = ordered.at(-1)
    if (root.question_version !== first.question_version || root.genesis_state_id !== first.answer_state_id || root.genesis_state_version !== first.state_version || root.genesis_state_fingerprint !== first.state_fingerprint) return false
    if (head.question_version !== last.question_version || head.head_state_id !== last.answer_state_id || head.head_state_version !== last.state_version || head.head_state_fingerprint !== last.state_fingerprint || !same(head.member_state_ids, stateIds) || !same(head.member_state_fingerprints, stateFingerprints) || head.member_set_seal !== hashValue({ state_ids: stateIds, state_fingerprints: stateFingerprints })) return false
  }
  return true
}
function resolveAnswerStateAgainstSnapshot(routeRef, questionId, answerRef, store, snapshot) {
  if (typeof routeRef !== 'string' || typeof questionId !== 'string' || typeof answerRef !== 'string' || !validateAnswerStateSnapshot(store, snapshot)) return { status: 'invalid', record: null }
  const headMeta = snapshot.history_heads.find(record => record.route_ref === routeRef && record.question_id === questionId)
  if (!headMeta) return { status: 'missing', record: null }
  const head = store.records.find(record => record.answer_state_id === headMeta.head_state_id && record.state_fingerprint === headMeta.head_state_fingerprint)
  if (!head) return { status: 'invalid', record: null }
  if (head.standing === 'withdrawn') return { status: 'missing', record: clone(head) }
  if (head.current_answer_ref !== answerRef) return { status: store.records.some(record => record.route_ref === routeRef && record.question_id === questionId && record.member_answer_refs.includes(answerRef)) ? 'stale' : 'missing', record: clone(head) }
  return { status: 'current', record: clone(head) }
}
function resolveAnswerState(routeRef, questionId, answerRef, store = interaction.answer_state_store) {
  return resolveAnswerStateAgainstSnapshot(routeRef, questionId, answerRef, store, interaction.answer_state_snapshot)
}
const answerAuthorityService = (() => {
  let store = clone(interaction.answer_state_store), snapshot = clone(interaction.answer_state_snapshot)
  const listeners = []
  const resolve = (routeRef, questionId, answerRef) => resolveAnswerStateAgainstSnapshot(routeRef, questionId, answerRef, store, snapshot)
  const advanceForConformance = (routeRef, questionId, answerRef, action = 'correct') => {
    if (!validateAnswerStateSnapshot(store, snapshot)) return false
    const candidateStore = clone(store), candidateSnapshot = clone(snapshot)
    const headMeta = candidateSnapshot.history_heads.find(record => record.route_ref === routeRef && record.question_id === questionId), prior = candidateStore.records.find(record => record.answer_state_id === headMeta?.head_state_id)
    if (action === 'correct' && prior?.standing === 'current' && prior.current_answer_ref === answerRef) return true
    const transition = Object.values(specimens.answer_state_transition_events).find(event => event.route_ref === routeRef && event.question_id === questionId && event.prior_state_fingerprint === prior?.state_fingerprint && event.answer_ref === answerRef && event.action === action)
    if (!prior || !transition) return false
    const members = byteSorted([...new Set([...prior.member_answer_refs, answerRef])])
    const next = { answer_state_id: transition.new_state_id, route_ref: routeRef, question_id: questionId, question_version: transition.question_version, state_version: transition.new_state_version, issuer_sequence: transition.issuer_sequence, current_answer_ref: answerRef, current_answer_fingerprint: transition.answer_fingerprint, supersedes_answer_ref: prior.current_answer_ref, standing: transition.standing, member_answer_refs: members, member_set_seal: hashValue(members), predecessor_state_id: prior.answer_state_id, predecessor_state_version: prior.state_version, predecessor_state_fingerprint: prior.state_fingerprint, transition_event_ref: transition.event_id, transition_event_fingerprint: hashValue(transition), status_text: transition.status_text, state_fingerprint: '' }
    next.state_fingerprint = fingerprint(next, 'state_fingerprint'); candidateStore.records.push(next); candidateStore.store_version = `answer-state-store-v${next.issuer_sequence}`; candidateStore.store_fingerprint = fingerprint(candidateStore, 'store_fingerprint')
    const group = candidateStore.records.filter(record => record.route_ref === routeRef && record.question_id === questionId).sort((a, b) => a.issuer_sequence - b.issuer_sequence)
    Object.assign(headMeta, { head_state_id: next.answer_state_id, head_state_version: next.state_version, head_state_fingerprint: next.state_fingerprint, head_issuer_sequence: next.issuer_sequence, member_state_ids: group.map(record => record.answer_state_id), member_state_fingerprints: group.map(record => record.state_fingerprint) }); headMeta.member_set_seal = hashValue({ state_ids: headMeta.member_state_ids, state_fingerprints: headMeta.member_state_fingerprints })
    candidateSnapshot.store_version = candidateStore.store_version; candidateSnapshot.store_fingerprint = candidateStore.store_fingerprint; candidateSnapshot.snapshot_fingerprint = fingerprint(candidateSnapshot, 'snapshot_fingerprint')
    if (!validateAnswerStateSnapshot(candidateStore, candidateSnapshot)) return false
    store = candidateStore; snapshot = candidateSnapshot
    for (const listener of listeners) listener(clone(prior), clone(next), clone(transition))
    return true
  }
  return Object.freeze({ resolve, advanceForConformance, selectForConformance: (routeRef, questionId, answerRef) => advanceForConformance(routeRef, questionId, answerRef, 'correct'), withdrawForConformance: (routeRef, questionId, answerRef) => advanceForConformance(routeRef, questionId, answerRef, 'withdraw'), reanswerForConformance: (routeRef, questionId, answerRef) => advanceForConformance(routeRef, questionId, answerRef, 'reanswer'), onAdvance: listener => listeners.push(listener), snapshotForConformance: () => ({ store: clone(store), snapshot: clone(snapshot) }), resetForConformance: () => { store = clone(interaction.answer_state_store); snapshot = clone(interaction.answer_state_snapshot) } })
})()
{
  const current = interaction.answer_state_store.records.find(record => record.issuer_sequence === 2), previous = interaction.answer_state_store.records.find(record => record.route_ref === current.route_ref && record.question_id === current.question_id && record.issuer_sequence === 1)
  checkEq('answer state current head resolves', resolveAnswerState(current.route_ref, current.question_id, current.current_answer_ref).status, 'current')
  checkEq('answer state previous answer is stale', resolveAnswerState(current.route_ref, current.question_id, previous.current_answer_ref).status, 'stale')
  answerAuthorityService.resetForConformance(); let rejectedAppendNotifications = 0; answerAuthorityService.onAdvance(() => { rejectedAppendNotifications += 1 })
  const correctionEvent = Object.values(specimens.answer_state_transition_events).find(event => event.question_id === current.question_id && event.action === 'correct' && event.answer_ref === previous.current_answer_ref), originalSignature = correctionEvent.issuer_signature_base64, beforeRejectedAppend = answerAuthorityService.snapshotForConformance()
  correctionEvent.issuer_signature_base64 = 'invalid-signature'
  check('invalid signed append is rejected', answerAuthorityService.selectForConformance(current.route_ref, current.question_id, previous.current_answer_ref) === false)
  correctionEvent.issuer_signature_base64 = originalSignature
  check('rejected append leaves byte-identical state and no listener effect', canonical(answerAuthorityService.snapshotForConformance()) === canonical(beforeRejectedAppend) && rejectedAppendNotifications === 0 && answerAuthorityService.resolve(current.route_ref, current.question_id, current.current_answer_ref).status === 'current')
  answerAuthorityService.resetForConformance(); check('signed withdrawal advances authority', answerAuthorityService.withdrawForConformance(current.route_ref, current.question_id, current.current_answer_ref)); checkEq('signed withdrawal safe-holds', answerAuthorityService.resolve(current.route_ref, current.question_id, current.current_answer_ref).status, 'missing')
  answerAuthorityService.resetForConformance(); check('signed correction advances authority', answerAuthorityService.selectForConformance(current.route_ref, current.question_id, previous.current_answer_ref)); checkEq('signed correction becomes current', answerAuthorityService.resolve(current.route_ref, current.question_id, previous.current_answer_ref).status, 'current'); checkEq('superseded answer becomes stale', answerAuthorityService.resolve(current.route_ref, current.question_id, current.current_answer_ref).status, 'stale')
  const truncated = clone(interaction.answer_state_store), group = truncated.records.filter(record => record.route_ref === current.route_ref && record.question_id === current.question_id); truncated.records = truncated.records.filter(record => record !== group[0]); const survivor = truncated.records.find(record => record.route_ref === current.route_ref && record.question_id === current.question_id); survivor.issuer_sequence = 1; survivor.predecessor_state_id = null; survivor.predecessor_state_version = null; survivor.predecessor_state_fingerprint = null; survivor.member_answer_refs = [survivor.current_answer_ref]; survivor.member_set_seal = hashValue(survivor.member_answer_refs); survivor.state_fingerprint = fingerprint(survivor, 'state_fingerprint'); truncated.store_fingerprint = fingerprint(truncated, 'store_fingerprint')
  checkEq('pinned snapshot rejects re-genesis and reseal', resolveAnswerState(current.route_ref, current.question_id, current.current_answer_ref, truncated).status, 'invalid')
  const middleDeleted = clone(interaction.answer_state_store); middleDeleted.records = middleDeleted.records.filter(record => record.answer_state_id !== current.answer_state_id); middleDeleted.store_fingerprint = fingerprint(middleDeleted, 'store_fingerprint'); checkEq('pinned snapshot rejects head deletion and reseal', resolveAnswerState(current.route_ref, current.question_id, current.current_answer_ref, middleDeleted).status, 'invalid')
  checkEq('resolver rejects null record without throwing', resolveAnswerState(current.route_ref, current.question_id, current.current_answer_ref, { ...clone(interaction.answer_state_store), records: [null] }).status, 'invalid')
  const accessor = {}; Object.defineProperty(accessor, 'route_ref', { get: () => { throw new Error('route trap') } }); checkEq('resolver rejects accessor record without throwing', resolveAnswerState(current.route_ref, current.question_id, current.current_answer_ref, { ...clone(interaction.answer_state_store), records: [accessor] }).status, 'invalid')
  const sparse = clone(interaction.answer_state_store); sparse.records = new Array(2); checkEq('resolver rejects sparse record array without throwing', resolveAnswerState(current.route_ref, current.question_id, current.current_answer_ref, sparse).status, 'invalid')
  const withdrawal = Object.values(specimens.answer_state_transition_events).find(event => event.question_id === current.question_id && event.action === 'withdraw'), withdrawalRecord = (() => { answerAuthorityService.resetForConformance(); answerAuthorityService.withdrawForConformance(current.route_ref, current.question_id, current.current_answer_ref); return answerAuthorityService.snapshotForConformance().store.records.at(-1) })()
  const unsigned = clone(withdrawal); unsigned.status_text = 'Your answer vanished.'; check('unsigned standing change rejected', validateAnswerStateTransitionEvent(unsigned, withdrawalRecord, current) === false)
  const crossHuman = clone(withdrawal); crossHuman.named_human_id = crossHuman.named_human_id === 'krish' ? 'leader-1' : 'krish'; check('cross-human withdrawal rejected', validateAnswerStateTransitionEvent(crossHuman, withdrawalRecord, current) === false)
  check('answer-state status stays concise and human-readable', Object.values(specimens.answer_state_transition_events).every(event => typeof event.status_text === 'string' && event.status_text.length >= 12 && event.status_text.length <= 120 && !/fingerprint|issuer_sequence|state_id/.test(event.status_text)))
  answerAuthorityService.resetForConformance()
}
for (const vector of vectors.answer_state_vectors) {
  answerAuthorityService.resetForConformance()
  const baseStore = clone(interaction.answer_state_store), baseSnapshot = clone(interaction.answer_state_snapshot)
  const current = baseStore.records.find(record => record.issuer_sequence === 2), previous = baseStore.records.find(record => record.route_ref === current.route_ref && record.question_id === current.question_id && record.issuer_sequence === 1)
  let result
  if (vector.mutation?.op === 'withdraw_current') {
    const advanced = answerAuthorityService.withdrawForConformance(current.route_ref, current.question_id, current.current_answer_ref)
    result = advanced ? answerAuthorityService.resolve(current.route_ref, current.question_id, current.current_answer_ref).status : 'invalid'
  } else {
    const store = clone(baseStore), snapshot = clone(baseSnapshot)
    let answerRef = current.current_answer_ref
    if (['use_previous', 'use_previous_after_current'].includes(vector.mutation?.op)) answerRef = previous.current_answer_ref
    if (vector.mutation?.op === 'duplicate_current') { store.records.push(clone(current)); store.store_fingerprint = fingerprint(store, 'store_fingerprint') }
    if (vector.mutation?.op === 'break_member_seal') { const head = store.records.find(record => record.answer_state_id === current.answer_state_id); head.member_set_seal = '0'.repeat(64); head.state_fingerprint = fingerprint(head, 'state_fingerprint'); store.store_fingerprint = fingerprint(store, 'store_fingerprint') }
    result = resolveAnswerStateAgainstSnapshot(current.route_ref, current.question_id, answerRef, store, snapshot).status
  }
  checkEq(`answer-state vector ${vector.id}`, result, vector.expected)
}
function validateFreeConfirmation(event, receipt, question, render, interpretation, interpretationRender) {
  const reject = reason => { if (process.env.R89_DEBUG) console.error('free confirmation reject', reason); return false }
  if (!finiteJson(event) || !finiteJson(receipt) || !finiteJson(question) || !finiteJson(render) || !finiteJson(interpretation) || !finiteJson(interpretationRender) || !exactKeys(event, trust.free_expression_confirmation_required) || !exactKeys(receipt, trust.normative_receipt_required) || !exactKeys(question, interaction.question_required) || !exactKeys(render, interaction.render_receipt_required) || typeof event.issuer_signature_base64 !== 'string' || !exactKeys(interpretation, interaction.free_expression_interpretation_required) || !exactKeys(interpretationRender, interaction.free_expression_render_required)) return reject('shape')
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  const text = specimens.free_expressions[receipt.free_expression_ref]
  if (!issuer || !credential || credential.named_human_id !== receipt.named_human_id || event.named_human_id !== receipt.named_human_id || event.authentication_event_ref !== receipt.authentication_event_ref || !issuer.allowed_methods.includes(event.method) || !text || !interpretation) return reject('issuer')
  if (fingerprint(interpretation, 'interpretation_fingerprint') !== interpretation.interpretation_fingerprint || fingerprint(interpretationRender, 'receipt_fingerprint') !== interpretationRender.receipt_fingerprint) return reject('fingerprint')
  const bindingChecks = {
    interpretation_free_expression: interpretation.free_expression_ref === receipt.free_expression_ref,
    interpretation_question: interpretation.question_id === question.question_id && interpretation.question_version === question.question_version,
    render_question: interpretationRender.question_id === question.question_id && interpretationRender.question_version === question.question_version,
    render_human: interpretationRender.named_human_id === receipt.named_human_id,
    render_expression: interpretationRender.free_expression_fingerprint === hashValue(text),
    render_interpretation: interpretationRender.plain_language_interpretation === interpretation.plain_language_interpretation && same(interpretationRender.decision_value, interpretation.decision_value) && interpretationRender.derived_effect_id === interpretation.derived_effect_id && interpretationRender.transition_disposition === interpretation.transition_disposition,
    render_consequence: interpretationRender.displayed_consequence_text === render.displayed_consequence_text
  }
  if (Object.values(bindingChecks).includes(false)) { if (process.env.R89_DEBUG) console.error(bindingChecks); return reject('binding') }
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) && event.question_id === question.question_id && event.question_version === question.question_version && event.free_expression_fingerprint === hashValue(text) && event.structured_interpretation_fingerprint === hashValue(interpretation) && event.interpretation_render_fingerprint === interpretationRender.receipt_fingerprint && event.decision_value_fingerprint === hashValue(interpretation.decision_value) && event.visible_consequence_fingerprint === hashValue(render.displayed_consequence_text) && Date.parse(render.rendered_at) <= Date.parse(interpretationRender.rendered_at) && Date.parse(interpretationRender.rendered_at) <= Date.parse(event.confirmed_at) && Date.parse(event.confirmed_at) <= Date.parse(receipt.issued_at) && Date.parse(event.confirmed_at) < Date.parse(receipt.valid_until) ? true : reject('signature_or_time') } catch { return reject('throw') }
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
  if (typeof dependencyId !== 'string') return null
  if (ownerById[dependencyId]) return ownerById[dependencyId]
  const rules = semantic.conditional_dependency_rules
  if (![rules.responsible_human_owner_prefix, rules.revisit_date_prefix].some(prefix => dependencyId.startsWith(prefix))) return null
  return { dependency_id: dependencyId, fact_kind: dependencyId.split(':')[0], canonical_owner: rules.canonical_owner, source_type: rules.source_type, issuer_fact_kind_rule: 'exact_conditional_dependency_kind', authority_policy_version: imports.owner_registry.registry_version }
}
function contextForTransition(transitionId) {
  if (typeof transitionId !== 'string' || !transitionById[transitionId]) return null
  const context = clone(semantic.fixture_authority_resolver.authoritative_context)
  if (transitionId === 'open_new_preparation_after_close') { context.purpose_id = 'purpose-new-1'; context.row_version = 'row-reopen-v1'; context.applicable_from = '2026-09-16T08:41:00Z' }
  return context
}
function resolveClosedPredecessor(transitionId) {
  if (transitionId !== 'open_new_preparation_after_close') return null
  const record = semantic.closed_predecessor_store.records.find(value => value.transition_id === transitionId)
  if (!record || !exactKeys(record, semantic.closed_predecessor_record_required) || fingerprint(record, 'record_fingerprint') !== record.record_fingerprint) return null
  const decision = specimens.decisions[record.decision_ref]
  if (!decision || hashValue(decision) !== record.decision_fingerprint || decision.case_id !== record.case_id) return null
  return clone(record)
}
function authoritativeAssertion(dependencyId, transitionId = 'open_preparation') {
  const resolver = semantic.fixture_authority_resolver
  const ref = `${resolver.assertion_ref_prefix}${dependencyId}`
  const bytes = Buffer.from(`${resolver.assertion_bytes_domain}:${transitionId}:${dependencyId}`, 'utf8')
  return { ref, bytes, content_fingerprint: sha256(bytes) }
}
function authoritativeDerivedInputs(dependencyId, transitionId = 'open_preparation') {
  const derivation = derivationById[dependencyId]
  if (!derivation) return []
  const context = contextForTransition(transitionId)
  if (!context) return []
  const predecessor = resolveClosedPredecessor(transitionId)
  return derivation.input_fact_kinds.map(factKind => clone(semantic.authoritative_source_store.records.find(record => record.fact_kind === factKind && record.purpose_id === context.purpose_id && (transitionId !== 'open_new_preparation_after_close' || record.predecessor_version === predecessor?.predecessor_version)))).filter(Boolean)
}
function executeDerivation(dependencyId, inputs, context, transitionId, at) {
  if (!Array.isArray(inputs) || !inputs.length || !inputs.every(input => input.value?.satisfied === true && input.subject_id === context.subject_id && input.case_id === context.case_id && input.purpose_id === context.purpose_id)) return false
  const byKind = Object.fromEntries(inputs.map(input => [input.fact_kind, input]))
  if (dependencyId === 'fresh_issuance_exists_where_required') {
    const grants = byKind.complete_current_grant_set?.value, issuance = byKind.grant_issuance_events?.value, boundaryRecord = byKind.lifecycle_transition_boundary, boundary = boundaryRecord?.value, predecessor = resolveClosedPredecessor(transitionId)
    const boundaryBindingValid = transitionId === 'open_new_preparation_after_close'
      ? Boolean(predecessor && boundary?.boundary_kind === 'closed_at' && boundary?.state_version === predecessor.predecessor_version && boundary?.boundary_time === predecessor.closed_at && boundaryRecord.predecessor_version === predecessor.predecessor_version)
      : Boolean(transitionId === 'resume_continuing' && boundary?.boundary_kind === 'paused_at' && typeof boundary?.state_version === 'string' && boundary.state_version.length > 0 && boundaryRecord.predecessor_version === null)
    return Boolean(boundaryBindingValid && issuance?.lifecycle_boundary_ref === boundaryRecord.source_ref && byKind.complete_current_grant_set.predecessor_version === boundaryRecord.predecessor_version && byKind.grant_issuance_events.predecessor_version === boundaryRecord.predecessor_version && same(byteSorted(grants?.grant_ids ?? []), byteSorted(issuance?.issued_grant_ids ?? [])) && Date.parse(byKind.grant_issuance_events.issuance_time) > Date.parse(boundary.boundary_time))
  }
  if (dependencyId === 'no_old_grant_can_revive') {
    const prior = byKind.complete_prior_grant_set?.value, revoked = byKind.complete_current_revocation_set?.value, predecessor = resolveClosedPredecessor(transitionId)
    return Boolean(predecessor && byKind.complete_prior_grant_set.predecessor_version === predecessor.predecessor_version && byKind.complete_current_revocation_set.predecessor_version === predecessor.predecessor_version && (prior?.grant_ids ?? []).every(id => (revoked?.revoked_grant_ids ?? []).includes(id)) && byKind.complete_current_revocation_set.revocation_epoch === predecessor.revocation_epoch)
  }
  if (dependencyId === 'old_expired_or_revoked_grants_unusable') {
    const current = byKind.complete_current_grant_set?.value, revoked = byKind.complete_current_revocation_set?.value
    return Array.isArray(current?.grant_ids) && same(current.grant_ids.map((id, index) => ({ id, status: current.statuses?.[index], expires_at: current.expires_at?.[index] })).filter(grant => grant.status === 'active' && Date.parse(at) < Date.parse(grant.expires_at) && !(revoked?.revoked_grant_ids ?? []).includes(grant.id)).map(grant => grant.id), current.grant_ids)
  }
  if (dependencyId === 'all_dependencies_fresh') {
    const boundaries = byKind.dependency_validity_boundaries?.value?.boundaries, expected = requiredDependencyIds(transitionId)?.filter(id => id !== dependencyId) ?? []
    return Array.isArray(boundaries) && boundaries.every(value => exactKeys(value, ['dependency_id', 'applicable_from', 'valid_until', 'standing']) && value.standing === 'current' && Date.parse(value.applicable_from) <= Date.parse(at) && Date.parse(at) < Date.parse(value.valid_until)) && unique(boundaries.map(value => value.dependency_id)) && same(byteSorted(boundaries.map(value => value.dependency_id)), byteSorted(expected)) && same(byteSorted(byKind.dependency_validity_boundaries.member_ids), byteSorted(expected))
  }
  if (dependencyId === 'checkpoint_integrity_valid') return byKind.current_checkpoint_version?.value?.checkpoint_version === byKind.checkpoint_evidence_set?.value?.checkpoint_version && (byKind.checkpoint_evidence_set?.value?.evidence_ids?.length ?? 0) > 0
  if (dependencyId === 'every_obligation_fulfilled_or_recorded_outstanding') {
    const complete = byKind.complete_close_obligation_set?.value?.obligation_ids ?? [], dispositions = byKind.obligation_dispositions?.value
    return same(byteSorted(complete), byteSorted([...(dispositions?.fulfilled_ids ?? []), ...(dispositions?.outstanding_ids ?? [])]))
  }
  if (dependencyId === 'subject_and_case_identities_exact') return byKind.current_subject_identity_binding?.value?.subject_id === context.subject_id && byKind.current_case_identity_binding?.value?.case_id === context.case_id
  return false
}
function buildProfile(dependencyId, transitionId = 'open_preparation') {
  const owner = resolveOwner(dependencyId)
  if (!owner) return null
  const derived = owner.canonical_owner === 'versioned_deterministic_derivation', derivation = derivationById[dependencyId], assertion = authoritativeAssertion(dependencyId, transitionId), resolver = semantic.fixture_authority_resolver
  const context = contextForTransition(transitionId)
  return {
    fact_kind: owner.fact_kind, authority_species: derived ? resolver.derived_authority_species : resolver.mechanical_authority_species, tenant_id: context.tenant_id, leader_id: context.leader_id, subject_id: context.subject_id, case_id: context.case_id, engagement_id: context.engagement_id, purpose_id: context.purpose_id, permitted_audience: clone(context.permitted_audience), consequence_class: context.consequence_class, allowed_uses: clone(context.allowed_uses), source_type: owner.source_type, source_identity: derived ? `${derivation.function_id}:inputs-1` : `${owner.canonical_owner}:row-1`, schema_version: context.schema_version, row_version: context.row_version, content_fingerprint: assertion.content_fingerprint, atomic_assertion_or_span_ref: assertion.ref, speaker_or_issuer: owner.canonical_owner, epistemic_basis: derived ? resolver.derived_epistemic_basis : resolver.mechanical_epistemic_basis, issuer_fact_kind_rule: owner.issuer_fact_kind_rule, authority_policy_version: imports.owner_registry.registry_version, applicable_from: context.applicable_from, valid_until: context.valid_until, contrary_assertion_refs: [], contrary_disposition: 'none', brain_item_ref: null, brain_item_version: null, brain_standing: 'not_applicable', derivation_function_id: derived ? derivation.function_id : null, derivation_version: derived ? derivation.version : null
  }
}
function buildDerivedProof(dependencyId, profile, transitionId = 'open_preparation') {
  const derivation = derivationById[dependencyId]
  if (!derivation) return null
  const inputs = authoritativeDerivedInputs(dependencyId, transitionId)
  const value = { dependency_id: dependencyId, function_id: derivation.function_id, function_version: derivation.version, input_receipts: inputs, input_set_seal: hashValue(inputs), output_profile_fingerprint: hashValue(profile), proof_fingerprint: '' }
  value.proof_fingerprint = fingerprint(value, 'proof_fingerprint'); return value
}
function validateProfile(dependencyId, profile, at, derivedProof = null, transitionId = 'open_preparation') {
  const schema = imports.semantic_profile_schema, owner = resolveOwner(dependencyId), resolver = semantic.fixture_authority_resolver
  if (typeof dependencyId !== 'string' || typeof at !== 'string' || typeof transitionId !== 'string' || !transitionById[transitionId] || !owner || !finiteJson(profile) || !exactKeys(profile, schema.required)) return 'shape_invalid'
  for (const [field, rule] of Object.entries(schema.fields)) {
    const value = profile[field]
    if (typeof rule === 'string' && !typeValidators[rule]?.(value)) return 'shape_invalid'
    if (rule.enum && !rule.enum.includes(value)) return 'shape_invalid'
  }
  const authoritativeProfile = buildProfile(dependencyId, transitionId)
  const derived = Boolean(derivationById[dependencyId]), assertion = authoritativeAssertion(dependencyId, transitionId)
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
    if (!derivedProof || !finiteJson(derivedProof) || !exactKeys(derivedProof, semantic.derived_fact_proof_required) || !Array.isArray(derivedProof.input_receipts) || !derivedProof.input_receipts.every(value => exactKeys(value, semantic.derived_input_required) && fingerprint(value, 'receipt_fingerprint') === value.receipt_fingerprint && value.set_seal === hashValue(value.member_ids)) || fingerprint(derivedProof, 'proof_fingerprint') !== derivedProof.proof_fingerprint || derivedProof.dependency_id !== dependencyId || derivedProof.function_id !== derivation.function_id || derivedProof.function_version !== derivation.version || derivedProof.output_profile_fingerprint !== hashValue(profile)) return 'derivation_invalid'
    const actualKinds = derivedProof.input_receipts.map(value => value.fact_kind)
    const inputChecks = { unique: unique(actualKinds), kinds: same(byteSorted(actualKinds), byteSorted(derivation.input_fact_kinds)), seal: derivedProof.input_set_seal === hashValue(derivedProof.input_receipts), authority: canonical(derivedProof.input_receipts) === canonical(authoritativeDerivedInputs(dependencyId, transitionId)), exact_proof: canonical(derivedProof) === canonical(buildDerivedProof(dependencyId, authoritativeProfile, transitionId)) }
    if (Object.values(inputChecks).includes(false)) { if (process.env.R89_DEBUG) { console.error('derivation input checks', dependencyId, inputChecks); if (dependencyId === 'all_dependencies_fresh') console.error('derivation input values', JSON.stringify(derivedProof.input_receipts), JSON.stringify(authoritativeDerivedInputs(dependencyId, transitionId))) } return 'derivation_input_set_invalid' }
    if (derivedProof.input_receipts.some(value => value.subject_id !== profile.subject_id || value.case_id !== profile.case_id || value.purpose_id !== profile.purpose_id || profile.permitted_audience.some(audience => !value.permitted_audience.includes(audience)) || profile.allowed_uses.some(use => !value.allowed_uses.includes(use)) || value.consequence_class !== profile.consequence_class) || !executeDerivation(dependencyId, derivedProof.input_receipts, profile, transitionId, at)) return 'derivation_non_widening_invalid'
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
  checkEq(`semantic profile vector ${vector.id}`, validateProfile(vector.dependency_id, profile, '2026-09-16T09:00:00Z', derivedProof), vector.expected)
}
{
  const resumeContext = contextForTransition('resume_continuing')
  const freshInputs = authoritativeDerivedInputs('fresh_issuance_exists_where_required', 'resume_continuing')
  check('fresh issuance derives from exact paused lifecycle boundary', executeDerivation('fresh_issuance_exists_where_required', freshInputs, resumeContext, 'resume_continuing', '2026-09-16T09:00:00Z'))
  const selfDeclaredBoundary = clone(freshInputs), boundary = selfDeclaredBoundary.find(value => value.fact_kind === 'lifecycle_transition_boundary')
  boundary.value.boundary_time = '2026-09-16T08:50:00Z'; boundary.receipt_fingerprint = fingerprint(boundary, 'receipt_fingerprint')
  check('self-declared lifecycle boundary cannot prove fresh issuance', executeDerivation('fresh_issuance_exists_where_required', selfDeclaredBoundary, resumeContext, 'resume_continuing', '2026-09-16T09:00:00Z') === false)
  const expiredGrantInputs = clone(freshInputs), grantSet = expiredGrantInputs.find(value => value.fact_kind === 'complete_current_grant_set')
  grantSet.value.expires_at = ['2026-09-16T08:59:59Z']; grantSet.receipt_fingerprint = fingerprint(grantSet, 'receipt_fingerprint')
  check('expired current grant cannot satisfy active grant derivation', executeDerivation('old_expired_or_revoked_grants_unusable', [grantSet, ...authoritativeDerivedInputs('old_expired_or_revoked_grants_unusable', 'resume_continuing').filter(value => value.fact_kind !== 'complete_current_grant_set')], resumeContext, 'resume_continuing', '2026-09-16T09:00:00Z') === false)
  const freshnessInputs = authoritativeDerivedInputs('all_dependencies_fresh', 'resume_continuing'), incompleteFreshness = clone(freshnessInputs)
  incompleteFreshness[0].value.boundaries.pop(); incompleteFreshness[0].member_ids.pop(); incompleteFreshness[0].set_seal = hashValue(incompleteFreshness[0].member_ids); incompleteFreshness[0].receipt_fingerprint = fingerprint(incompleteFreshness[0], 'receipt_fingerprint')
  check('incomplete freshness boundary cannot satisfy derivation', executeDerivation('all_dependencies_fresh', incompleteFreshness, resumeContext, 'resume_continuing', '2026-09-16T09:00:00Z') === false)
  check('unregistered derivation has no default success path', executeDerivation('unregistered_derivation', freshInputs, resumeContext, 'resume_continuing', '2026-09-16T09:00:00Z') === false)
}

function buildCaseContext() { const value = clone(specimens.case_context); value.context_fingerprint = fingerprint(value, 'context_fingerprint'); return value }
function buildSession(name, namedHumanId = 'leader-1') { const value = clone(specimens[name]); value.named_human_id = namedHumanId; value.session_id = namedHumanId === 'krish' ? 'session-2' : 'session-1'; value.state_fingerprint = fingerprint(value, 'state_fingerprint'); return value }
function questionVisibleStrings(question) { return [question.heading, question.question, ...question.answer_options, question.unknown_option, question.free_expression_option, question.visible_consequence, question.optional_note_label, question.primary_action_label] }
function contractForDependency(dependencyId) { return interaction.judgement_contracts.find(contract => contract.dependency_ids.includes(dependencyId)) }
function transitionForDependency(dependencyId) { return imports.transition_catalogue.find(transition => transition.normative_dependencies.includes(dependencyId))?.id ?? null }
function buildQuestionForDependency(dependencyId, transitionId = transitionForDependency(dependencyId)) {
  const registry = judgementById[dependencyId], contract = contractForDependency(dependencyId), transition = transitionById[transitionId]
  if (!registry || !contract || !transition || !transition.normative_dependencies.includes(dependencyId) || contract.judgement_kind !== registry.judgement_kind) return null
  const answerOptions = contract.answers.map(answer => answer.option)
  return { question_id: `question-${transitionId}-${dependencyId}`, question_version: 'qv1', case_id: 'case-1', decision_id: 'decision-1', transition_id: transitionId, named_answer_owner: roleHuman[registry.owner_role], dependency_id: dependencyId, requested_value_kind: registry.judgement_kind, heading: contract.heading, question: contract.question, answer_options: answerOptions, unknown_option: 'I do not know yet', free_expression_option: 'Something else', answer_effect_refs: Object.fromEntries(contract.answers.map(answer => [answer.option, answer.effect_id])), visible_consequence: contract.visible_consequence, optional_note_label: 'Add context', primary_action_label: 'Keep answer', optional_depth_ref: `why-${dependencyId}`, source_reason_ref: 'case-1-gap-3' }
}
check('reference question is exact generated contract', canonical(specimens.question) === canonical(buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value', 'continue_after_intensive_proof')))
function resolveAnswerEffect(question, option) {
  const contract = contractForDependency(question.dependency_id), answer = contract?.answers.find(value => value.option === option)
  return answer && question.answer_effect_refs[option] === answer.effect_id ? answer : null
}
function applyAnswerEffect(before, answer) {
  if (!before || !answer || !imports.accepted_decision_state_schema.material_paths.includes(answer.patch.path)) return null
  const after = clone(before); after[answer.patch.path] = clone(answer.patch.value); return after
}
function validateQuestion(question, session, caseContext, decisions = specimens.decisions) {
  if (!finiteJson(question) || !finiteJson(session) || !finiteJson(caseContext) || !finiteJson(decisions) || !exactKeys(decisions, Object.keys(specimens.decisions)) || !exactKeys(question, interaction.question_required) || !exactKeys(session, interaction.session_state_required) || !exactKeys(caseContext, interaction.canonical_case_context_required)) return 'shape_invalid'
  const visibleStringFields = ['question', 'heading', 'unknown_option', 'free_expression_option', 'visible_consequence', 'optional_note_label', 'primary_action_label']
  if (!visibleStringFields.every(field => typeof question[field] === 'string') || !Array.isArray(question.answer_options) || !question.answer_options.every(value => typeof value === 'string') || !question.answer_effect_refs || typeof question.answer_effect_refs !== 'object' || Array.isArray(question.answer_effect_refs) || !Array.isArray(session.question_receipt_ids) || !session.question_receipt_ids.every(value => typeof value === 'string') || !Number.isInteger(session.last_question_ordinal) || !Array.isArray(caseContext.case_terms) || !caseContext.case_terms.every(value => typeof value === 'string') || !Array.isArray(caseContext.required_question_concepts) || !caseContext.required_question_concepts.every(value => typeof value === 'string')) return 'shape_invalid'
  if (fingerprint(session, 'state_fingerprint') !== session.state_fingerprint || fingerprint(caseContext, 'context_fingerprint') !== caseContext.context_fingerprint) return 'context_invalid'
  const authoritativeSessionName = session.state_version === specimens.empty_session.state_version ? 'empty_session' : session.state_version === specimens.asked_session.state_version ? 'asked_session' : null
  if (!authoritativeSessionName || canonical(session) !== canonical(buildSession(authoritativeSessionName, question.named_answer_owner)) || canonical(caseContext) !== canonical(buildCaseContext())) return 'context_invalid'
  if (session.case_id !== caseContext.case_id || session.decision_id !== caseContext.decision_id || session.named_human_id !== question.named_answer_owner || question.case_id !== caseContext.case_id || question.decision_id !== caseContext.decision_id) return 'context_invalid'
  if (session.question_receipt_ids.length > 0 || session.last_question_ordinal > 0) return 'safe_hold_no_followup'
  const registry = judgementById[question.dependency_id]
  if (!registry || roleHuman[registry.owner_role] !== question.named_answer_owner || registry.judgement_kind !== question.requested_value_kind) return 'dependency_invalid'
  const expectedQuestion = buildQuestionForDependency(question.dependency_id, question.transition_id)
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
  const question = clone(buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value', 'continue_after_intensive_proof'))
  if (vector.mutation?.op === 'repeat_option') question.answer_options[0] = question.answer_options[0].repeat(vector.mutation.count)
  else if (vector.mutation) setAt(question, vector.mutation.path, vector.mutation.value)
  check(`question vector ${vector.id}`, validateQuestion(question, buildSession(vector.session), buildCaseContext()) === vector.expected)
}

function buildGapSet(dependencyIds, namedHumanId, transitionId) {
  const value = { case_id: 'case-1', decision_id: 'decision-1', transition_id: transitionId, named_human_id: namedHumanId, dependency_ids: byteSorted(dependencyIds), set_version: 'gap-set-v1', set_seal: '' }
  value.set_seal = fingerprint(value, 'set_seal')
  return value
}
const sessionAuthorityService = (() => {
  const issued = new Map(Object.values(specimens.route_receipts).map(receipt => [routeReceiptRef(receipt), clone(receipt)])), reservations = new Map(), proofBindings = new Map()
  const route = (gapSet, session, caseContext) => {
    if (!finiteJson(gapSet) || !exactKeys(gapSet, interaction.unresolved_gap_set_required) || !Array.isArray(gapSet.dependency_ids) || !gapSet.dependency_ids.length || !gapSet.dependency_ids.every(value => typeof value === 'string') || !unique(gapSet.dependency_ids) || fingerprint(gapSet, 'set_seal') !== gapSet.set_seal) return { status: 'shape_invalid' }
    if (!transitionById[gapSet.transition_id] || validateQuestion(buildQuestionForDependency(gapSet.dependency_ids[0], gapSet.transition_id), session, caseContext) !== 'valid') return { status: 'session_invalid' }
    if (gapSet.case_id !== session.case_id || gapSet.decision_id !== session.decision_id || gapSet.named_human_id !== session.named_human_id || gapSet.dependency_ids.some(id => roleHuman[judgementById[id]?.owner_role] !== gapSet.named_human_id || !transitionById[gapSet.transition_id].normative_dependencies.includes(id))) return { status: 'binding_invalid' }
    const key = `${gapSet.case_id}|${gapSet.decision_id}|${gapSet.transition_id}|${gapSet.named_human_id}|${session.state_version}`
    if (reservations.has(key)) return { status: 'already_reserved', receipt: clone(reservations.get(key)) }
    const ref = gapSet.dependency_ids.length === 1 ? `question-reservation-${gapSet.transition_id}-${gapSet.named_human_id}` : `krish-session-${gapSet.transition_id}-${gapSet.named_human_id}`, receipt = issued.get(ref)
    if (!receipt) return { status: 'authority_missing' }
    const dependencyBound = gapSet.dependency_ids.length === 1 ? receipt.dependency_id === gapSet.dependency_ids[0] : same(receipt.dependency_ids, gapSet.dependency_ids)
    if (!dependencyBound || receipt.gap_set_seal !== gapSet.set_seal || receipt.route_status !== 'issued' || receipt.facilitator_id !== 'krish') return { status: 'authority_invalid' }
    reservations.set(key, receipt)
    return { status: gapSet.dependency_ids.length === 1 ? 'direct_question_reserved' : 'krish_session_reserved', receipt: clone(receipt) }
  }
  const resolve = ref => [...reservations.values()].find(receipt => routeReceiptRef(receipt) === ref) ?? null
  const resolveIssued = ref => issued.has(ref) ? clone(issued.get(ref)) : null
  const bindToProof = (receipts, proofFingerprint) => {
    if (!Array.isArray(receipts) || typeof proofFingerprint !== 'string') return false
    for (const receipt of receipts) {
      const ref = routeReceiptRef(receipt), authoritative = resolve(ref), prior = proofBindings.get(ref)
      if (!authoritative || canonical(authoritative) !== canonical(receipt) || (prior && prior !== proofFingerprint)) return false
    }
    for (const receipt of receipts) proofBindings.set(routeReceiptRef(receipt), proofFingerprint)
    return true
  }
  return Object.freeze({ route, resolve, resolveIssued, bindToProof, resetForConformance: () => { reservations.clear(); proofBindings.clear() } })
})()
for (const vector of vectors.routing_vectors) {
  sessionAuthorityService.resetForConformance()
  const human = vector.named_human_id, transitionId = vector.transition_id ?? transitionForDependency(vector.dependency_ids[0]), gapSet = buildGapSet(vector.dependency_ids, human, transitionId), session = buildSession('empty_session', human)
  const first = sessionAuthorityService.route(gapSet, session, buildCaseContext())
  const actual = vector.repeat ? `${first.status}|${sessionAuthorityService.route(gapSet, session, buildCaseContext()).status}` : first.status
  check(`routing vector ${vector.id}`, actual === vector.expected)
}

const predecessorByTransition = Object.fromEntries(imports.transition_catalogue.map(transition => [transition.id, transition.id === 'open_new_preparation_after_close' ? 'closed-7' : `${transition.from}-7`]))
function bindingForTransition(transitionId, predicateFingerprint = 'c'.repeat(64), reconciledFingerprint = 'd'.repeat(64), finalRender = null) {
  const context = contextForTransition(transitionId)
  if (!context || !transitionById[transitionId]) return null
  return { subject_id: context.subject_id, case_id: context.case_id, purpose_id: context.purpose_id, permitted_audience: clone(context.permitted_audience), transition_id: transitionId, predecessor_version: predecessorByTransition[transitionId], predicate_proof_fingerprint: predicateFingerprint, reconciled_decision_fingerprint: reconciledFingerprint, final_render_fingerprint: finalRender?.receipt_fingerprint ?? null, reserved_transition_receipt_version: `reserve-${transitionId}`, render_receipt_ref: finalRender?.render_receipt_id ?? `render-${transitionId}`, displayed_consequence_text: finalRender?.displayed_consequence_text ?? 'Aperture House has one reviewed decision with clear evidence and review boundaries.', server_commit_time: '2026-09-16T09:00:00Z', authority_bundle_fingerprint: authorityBundle }
}
function humanGapSetForTransition(transitionId, namedHumanId) {
  const transition = typeof transitionId === 'string' ? transitionById[transitionId] : null
  if (!transition || typeof namedHumanId !== 'string') return null
  return buildGapSet(transition.normative_dependencies.filter(id => roleHuman[judgementById[id]?.owner_role] === namedHumanId), namedHumanId, transitionId)
}
function buildRouteReceipts(transitionId) {
  const transition = transitionById[transitionId]
  if (!transition) return null
  const receipts = {}
  for (const human of byteSorted([...new Set(transition.normative_dependencies.map(id => roleHuman[judgementById[id]?.owner_role]))])) {
    const gapSet = humanGapSetForTransition(transitionId, human), result = sessionAuthorityService.route(gapSet, buildSession('empty_session', human), buildCaseContext())
    if (!['direct_question_reserved', 'krish_session_reserved', 'already_reserved'].includes(result.status)) throw new Error(`route failed ${transitionId} ${human}`)
    receipts[human] = result.receipt
  }
  return receipts
}
function issuedRouteReceipts(transitionId) {
  const transition = transitionById[transitionId]
  if (!transition) return null
  const receipts = []
  for (const human of byteSorted([...new Set(transition.normative_dependencies.map(id => roleHuman[judgementById[id]?.owner_role]))])) {
    const gapSet = humanGapSetForTransition(transitionId, human)
    if (!gapSet || !gapSet.dependency_ids.length) return null
    const ref = gapSet.dependency_ids.length === 1 ? `question-reservation-${transitionId}-${human}` : `krish-session-${transitionId}-${human}`
    const receipt = sessionAuthorityService.resolveIssued(ref)
    if (!receipt) return null
    receipts.push(receipt)
  }
  return receipts
}
function routeReceiptRef(receipt) { return receipt?.reservation_id ?? receipt?.session_route_id ?? null }
function validateRouteReceipt(receipt, transitionId, namedHumanId) {
  if (!finiteJson(receipt) || !receipt || typeof receipt !== 'object' || Array.isArray(receipt) || typeof transitionId !== 'string' || !transitionById[transitionId] || typeof namedHumanId !== 'string') return false
  const gapSet = humanGapSetForTransition(transitionId, namedHumanId)
  if (!gapSet) return false
  const authoritative = sessionAuthorityService.resolve(routeReceiptRef(receipt)), issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === receipt.issuer_id)
  if (!gapSet.dependency_ids.length || !authoritative || canonical(authoritative) !== canonical(receipt) || !issuer || receipt.transition_id !== transitionId || receipt.named_human_id !== namedHumanId || receipt.case_id !== gapSet.case_id || receipt.decision_id !== gapSet.decision_id || receipt.gap_set_seal !== gapSet.set_seal || receipt.facilitator_id !== 'krish' || receipt.route_status !== 'issued' || !(Date.parse(receipt.issued_at) < Date.parse('2026-09-16T09:00:00Z'))) return false
  const fingerprintField = gapSet.dependency_ids.length === 1 ? 'reservation_fingerprint' : 'receipt_fingerprint', unsigned = clone(receipt); delete unsigned[fingerprintField]; delete unsigned.issuer_signature_base64
  let signatureValid = false
  try { signatureValid = verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(receipt.issuer_signature_base64, 'base64')) } catch { return false }
  if (!signatureValid || fingerprint(receipt, fingerprintField) !== receipt[fingerprintField]) return false
  if (gapSet.dependency_ids.length === 1) return exactKeys(receipt, interaction.question_reservation_required) && receipt.dependency_id === gapSet.dependency_ids[0] && receipt.session_state_version === 'session-v1' && receipt.reserved_ordinal === 1
  return exactKeys(receipt, interaction.krish_session_receipt_required) && same(receipt.dependency_ids, gapSet.dependency_ids) && receipt.route === 'one_krish_led_session' && same(receipt.agenda, gapSet.dependency_ids.map(id => contractForDependency(id)?.heading).filter(Boolean))
}
{
  sessionAuthorityService.resetForConformance()
  const transitionId = 'accept_intensive_proof', human = 'leader-1', gapSet = humanGapSetForTransition(transitionId, human)
  const issued = sessionAuthorityService.route(gapSet, buildSession('empty_session', human), buildCaseContext()).receipt
  const callerMinted = clone(issued); callerMinted.reservation_id = 'caller-minted-route'; callerMinted.reservation_fingerprint = fingerprint(callerMinted, 'reservation_fingerprint')
  check('caller-minted route receipt rejected', validateRouteReceipt(callerMinted, transitionId, human) === false)
  check('authoritative issued route receipt accepted', validateRouteReceipt(issued, transitionId, human) === true)
  check('route receipt binds to only one predicate proof', sessionAuthorityService.bindToProof([issued], 'proof-a') === true && sessionAuthorityService.bindToProof([issued], 'proof-b') === false)
  check('unknown primitive transition is rejected without throwing', validateRouteReceipt(issued, 'attacker-transition', human) === false && humanGapSetForTransition('attacker-transition', human) === null)
  sessionAuthorityService.resetForConformance()
  check('route receipt fails after authoritative reservation is absent', validateRouteReceipt(issued, transitionId, human) === false)
}
function buildRenderReceipt(question, routeReceipt, binding) {
  const renderedAt = question.transition_id === 'open_new_preparation_after_close' ? '2026-09-16T08:44:00Z' : '2026-09-16T08:30:00Z'
  const value = { render_receipt_id: `render-${question.transition_id}-${question.dependency_id}`, session_id: question.named_answer_owner === 'krish' ? 'session-2' : 'session-1', session_state_version: 'session-v1', question_id: question.question_id, question_version: question.question_version, dependency_id: question.dependency_id, named_human_id: question.named_answer_owner, transition_id: question.transition_id, predecessor_version: binding.predecessor_version, question_route_receipt_ref: routeReceiptRef(routeReceipt), gap_set_seal: routeReceipt.gap_set_seal, displayed_consequence_text: question.visible_consequence, question_payload_fingerprint: hashValue(question), rendered_at: renderedAt, receipt_fingerprint: '' }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  return value
}
function buildNormativeReceipt(question, selectedOption, humanId, authRef, answerEventRef, routeReceipt, binding) {
  const predecessor = resolveClosedPredecessor(question.transition_id), beforeRef = predecessor?.decision_ref ?? specimens.case_context.current_decision_ref, answerEffect = resolveAnswerEffect(question, selectedOption), afterRef = answerEffect ? `decision-effect:${answerEffect.effect_id}` : null
  const before = specimens.decisions[beforeRef], after = applyAnswerEffect(before, answerEffect)
  const changed = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  const render = buildRenderReceipt(question, routeReceipt, binding)
  const issuedAt = question.transition_id === 'open_new_preparation_after_close' ? '2026-09-16T08:46:00Z' : '2026-09-16T08:35:00Z'
  const value = {
    receipt_type: trust.exact_constants.normative_receipt_type, domain_separator: trust.exact_constants.normative_domain_separator, attestation_id: `att-${question.transition_id}-${question.dependency_id}`, question_id: question.question_id, question_version: question.question_version, dependency_id: question.dependency_id, named_human_id: humanId, transition_id: question.transition_id, predecessor_version: binding.predecessor_version, question_route_receipt_ref: routeReceiptRef(routeReceipt), gap_set_seal: routeReceipt.gap_set_seal, authentication_event_ref: authRef, answer_event_ref: answerEventRef ?? `answer-${question.transition_id}-${question.dependency_id}-${question.answer_options.indexOf(selectedOption) + 1}`, owned_judgement_kind: question.requested_value_kind, answer_status: 'selected', selected_option: selectedOption, free_expression_ref: null, free_expression_interpretation_ref: null, free_expression_interpretation_render_ref: null, free_expression_confirmation_ref: null, accepted_decision_before_ref: beforeRef, accepted_decision_before_fingerprint: hashValue(before), accepted_decision_after_ref: afterRef, accepted_decision_after_fingerprint: hashValue(after), accepted_decision_changed_paths: changed, render_receipt_ref: render.render_receipt_id, displayed_consequence_text: render.displayed_consequence_text, visible_consequence_fingerprint: hashValue(render.displayed_consequence_text), subject_id: binding.subject_id, case_id: binding.case_id, purpose_id: binding.purpose_id, permitted_audience: clone(binding.permitted_audience), authority_bundle_fingerprint: authorityBundle, issued_at: issuedAt, valid_until: '2026-09-16T09:35:00Z', receipt_fingerprint: ''
  }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  return { receipt: value, render }
}
function buildFreeNormativeReceipt(question, suffix, humanId, authRef, routeReceipt, binding) {
  const built = buildNormativeReceipt(question, question.answer_options[0], humanId, authRef, null, routeReceipt, binding), receipt = built.receipt
  const freeRef = `free-${suffix}`, interpretationRef = `interpretation-${suffix}`, interpretationRenderRef = `interpretation-render-${suffix}`, confirmationRef = `confirm-${suffix}`, interpretation = specimens.structured_interpretations[interpretationRef]
  const before = specimens.decisions[receipt.accepted_decision_before_ref], after = applyAnswerEffect(before, { effect_id: interpretation.derived_effect_id, patch: interpretation.decision_value, transition_disposition: interpretation.transition_disposition })
  receipt.answer_status = 'free_expression_confirmed'; receipt.selected_option = question.free_expression_option; receipt.answer_event_ref = null; receipt.free_expression_ref = freeRef; receipt.free_expression_interpretation_ref = interpretationRef; receipt.free_expression_interpretation_render_ref = interpretationRenderRef; receipt.free_expression_confirmation_ref = confirmationRef; receipt.accepted_decision_after_ref = `decision-interpretation:${interpretation.interpretation_id}`; receipt.accepted_decision_after_fingerprint = hashValue(after); receipt.accepted_decision_changed_paths = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path]))); receipt.issued_at = question.transition_id === 'open_new_preparation_after_close' ? '2026-09-16T08:46:00Z' : '2026-09-16T08:35:00Z'; receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint')
  return built
}
function validateRender(render, question) {
  return Boolean(finiteJson(render) && finiteJson(question) && exactKeys(render, interaction.render_receipt_required) && exactKeys(question, interaction.question_required) && fingerprint(render, 'receipt_fingerprint') === render.receipt_fingerprint && render.question_id === question.question_id && render.question_version === question.question_version && render.dependency_id === question.dependency_id && render.named_human_id === question.named_answer_owner && render.question_payload_fingerprint === hashValue(question) && render.displayed_consequence_text === question.visible_consequence)
}
function validateNormative(receipt, consumeAt, question, render, binding, routeReceipt) {
  if (!finiteJson(receipt) || !finiteJson(question) || !finiteJson(render) || !finiteJson(binding) || !finiteJson(routeReceipt) || !exactKeys(binding, trust.binding_context_required) || !exactKeys(receipt, trust.normative_receipt_required) || !Array.isArray(receipt.accepted_decision_changed_paths) || !receipt.accepted_decision_changed_paths.every(value => typeof value === 'string') || typeof consumeAt !== 'string') return 'shape_invalid'
  if (typeof receipt.attestation_id !== 'string' || receipt.attestation_id.length === 0) return 'shape_invalid'
  if (fingerprint(receipt, 'receipt_fingerprint') !== receipt.receipt_fingerprint) return 'fingerprint_invalid'
  if (receipt.receipt_type !== trust.exact_constants.normative_receipt_type || receipt.domain_separator !== trust.exact_constants.normative_domain_separator) return 'constant_invalid'
  if (!validateRender(render, question) || !validateRouteReceipt(routeReceipt, receipt.transition_id, receipt.named_human_id) || receipt.question_route_receipt_ref !== routeReceiptRef(routeReceipt) || receipt.gap_set_seal !== routeReceipt.gap_set_seal || render.question_route_receipt_ref !== receipt.question_route_receipt_ref || render.gap_set_seal !== receipt.gap_set_seal || render.transition_id !== receipt.transition_id || render.predecessor_version !== receipt.predecessor_version || receipt.render_receipt_ref !== render.render_receipt_id || receipt.question_id !== question.question_id || receipt.question_version !== question.question_version || receipt.displayed_consequence_text !== render.displayed_consequence_text || receipt.visible_consequence_fingerprint !== hashValue(render.displayed_consequence_text)) return 'render_binding_invalid'
  const expectedQuestion = buildQuestionForDependency(receipt.dependency_id, receipt.transition_id)
  const registry = judgementById[receipt.dependency_id], selected = receipt.answer_status === 'selected', free = receipt.answer_status === 'free_expression_confirmed'
  if (canonical(question) !== canonical(expectedQuestion) || !registry || (!selected && !free) || receipt.transition_id !== question.transition_id || receipt.predecessor_version !== binding.predecessor_version || receipt.dependency_id !== question.dependency_id || receipt.named_human_id !== question.named_answer_owner || receipt.owned_judgement_kind !== registry.judgement_kind || receipt.owned_judgement_kind !== question.requested_value_kind) return 'question_binding_invalid'
  const interpretation = free ? specimens.structured_interpretations[receipt.free_expression_interpretation_ref] : null
  const interpretationRender = free ? specimens.free_expression_renders[receipt.free_expression_interpretation_render_ref] : null
  const answerEffect = selected
    ? resolveAnswerEffect(question, receipt.selected_option)
    : interpretation && typeof interpretation.plain_language_interpretation === 'string' && interpretation.plain_language_interpretation.length > 0 && ['supports_transition', 'blocks_transition'].includes(interpretation.transition_disposition) && exactKeys(interpretation.decision_value, ['path', 'value']) && imports.accepted_decision_state_schema.material_paths.includes(interpretation.decision_value.path) ? { effect_id: interpretation.derived_effect_id, patch: interpretation.decision_value, transition_disposition: interpretation.transition_disposition } : null
  const expectedAfterRef = answerEffect ? (selected ? `decision-effect:${answerEffect.effect_id}` : `decision-interpretation:${interpretation.interpretation_id}`) : null
  if (selected && (!question.answer_options.includes(receipt.selected_option) || expectedAfterRef !== receipt.accepted_decision_after_ref || receipt.free_expression_ref !== null || receipt.free_expression_interpretation_ref !== null || receipt.free_expression_interpretation_render_ref !== null || receipt.free_expression_confirmation_ref !== null)) return 'question_binding_invalid'
  if (free && (receipt.selected_option !== question.free_expression_option || !receipt.free_expression_ref || !receipt.free_expression_interpretation_ref || !receipt.free_expression_interpretation_render_ref || !receipt.free_expression_confirmation_ref || !answerEffect || expectedAfterRef !== receipt.accepted_decision_after_ref || !validateFreeConfirmation(specimens.free_expression_confirmations[receipt.free_expression_confirmation_ref], receipt, question, render, interpretation, interpretationRender))) return 'free_confirmation_invalid'
  if (validateAuthentication(specimens.authentication_events[receipt.authentication_event_ref], receipt.named_human_id, consumeAt) !== 'valid') return 'authentication_invalid'
  const answerEvent = specimens.answer_events[receipt.answer_event_ref]
  if (selected && (!validateAnswerEvent(answerEvent, receipt.named_human_id, question, render, receipt.selected_option) || !(Date.parse(answerEvent.answered_at) <= Date.parse(receipt.issued_at) && Date.parse(receipt.issued_at) <= Date.parse(receipt.valid_until)))) return 'question_binding_invalid'
  for (const field of ['subject_id', 'case_id', 'purpose_id', 'permitted_audience', 'authority_bundle_fingerprint']) if (!same(receipt[field], binding[field])) return 'binding_invalid'
  const predecessor = resolveClosedPredecessor(receipt.transition_id), expectedBeforeRef = predecessor?.decision_ref ?? specimens.case_context.current_decision_ref
  if (receipt.accepted_decision_before_ref !== expectedBeforeRef) return 'decision_invalid'
  const before = specimens.decisions[receipt.accepted_decision_before_ref], after = applyAnswerEffect(before, answerEffect)
  if (!before || !after || hashValue(before) !== receipt.accepted_decision_before_fingerprint || hashValue(after) !== receipt.accepted_decision_after_fingerprint || before.case_id !== receipt.case_id || after.case_id !== receipt.case_id || before.decision_id !== question.decision_id || after.decision_id !== question.decision_id) { if (process.env.R89_DEBUG) console.error('normative decision invalid', { dependency_id: receipt.dependency_id, transition_id: receipt.transition_id, before_exists: Boolean(before), after_exists: Boolean(after), before_fingerprint: before && hashValue(before) === receipt.accepted_decision_before_fingerprint, after_fingerprint: after && hashValue(after) === receipt.accepted_decision_after_fingerprint, before_case: before?.case_id, receipt_case: receipt.case_id, after_case: after?.case_id, before_decision: before?.decision_id, question_decision: question.decision_id, after_decision: after?.decision_id }); return 'decision_invalid' }
  const changed = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  if (changed.length === 0 || !same(changed, byteSorted(receipt.accepted_decision_changed_paths))) return 'decision_invalid'
  if (!(Date.parse(render.rendered_at) <= Date.parse(receipt.issued_at) && Date.parse(receipt.issued_at) <= Date.parse(consumeAt) && Date.parse(consumeAt) < Date.parse(receipt.valid_until))) return 'expired'
  if (receipt.transition_id === 'open_new_preparation_after_close' && (!predecessor || receipt.predecessor_version !== predecessor.predecessor_version || !(Date.parse(receipt.issued_at) > Date.parse(predecessor.closed_at)))) return 'expired'
  return 'valid'
}
const binding = bindingForTransition('accept_intensive_proof')
for (const vector of vectors.normative_vectors) {
  const dependencyId = vector.dependency_id ?? 'leader_next_consequential_decision_or_evidenced_value', transitionId = vector.transition_id ?? transitionForDependency(dependencyId), question = buildQuestionForDependency(dependencyId, transitionId), selectedOption = question.answer_options[vector.option_index ?? 0], routeReceipts = buildRouteReceipts(transitionId), routeReceipt = routeReceipts[question.named_answer_owner], vectorBinding = bindingForTransition(transitionId), built = buildNormativeReceipt(question, selectedOption, question.named_answer_owner, question.named_answer_owner === 'krish' ? 'auth-2' : 'auth-1', null, routeReceipt, vectorBinding), receipt = built.receipt
  if (['free_expression_valid', 'free_expression_late', 'free_expression_mismatch'].includes(vector.mutation?.op)) {
    const interpretation = specimens.structured_interpretations['interpretation-1'], after = applyAnswerEffect(specimens.decisions[receipt.accepted_decision_before_ref], { effect_id: interpretation.derived_effect_id, patch: interpretation.decision_value })
    receipt.answer_status = 'free_expression_confirmed'; receipt.selected_option = question.free_expression_option; receipt.answer_event_ref = null; receipt.free_expression_ref = 'free-1'; receipt.free_expression_interpretation_ref = 'interpretation-1'; receipt.free_expression_interpretation_render_ref = 'interpretation-render-1'; receipt.free_expression_confirmation_ref = 'confirm-1'; receipt.accepted_decision_after_ref = `decision-interpretation:${interpretation.interpretation_id}`; receipt.accepted_decision_after_fingerprint = hashValue(after); receipt.accepted_decision_changed_paths = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(specimens.decisions[receipt.accepted_decision_before_ref][path], after[path])))
    receipt.issued_at = '2026-09-16T08:37:00Z'
    if (vector.mutation.op === 'free_expression_late') receipt.valid_until = '2026-09-16T08:35:30Z'
    if (vector.mutation.op === 'free_expression_mismatch') receipt.accepted_decision_after_ref = 'decision-effect:value-independent-quality'
  } else if (vector.mutation) setAt(receipt, vector.mutation.path, vector.mutation.value)
  receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint')
  checkEq(`normative vector ${vector.id}`, validateNormative(receipt, vector.consume_at ?? vectorBinding.server_commit_time, question, built.render, vectorBinding, routeReceipt), vector.expected)
}
{
  sessionAuthorityService.resetForConformance()
  const transitionId = 'continue_after_intensive_proof', question = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value', transitionId), routes = buildRouteReceipts(transitionId), binding = bindingForTransition(transitionId), built = buildNormativeReceipt(question, question.answer_options[0], 'leader-1', 'auth-1', null, routes['leader-1'], binding)
  built.receipt.transition_id = 'attacker-transition'
  built.receipt.receipt_fingerprint = fingerprint(built.receipt, 'receipt_fingerprint')
  check('normative validation rejects unknown primitive transition without throwing', validateNormative(built.receipt, binding.server_commit_time, question, built.render, binding, routes['leader-1']) === 'render_binding_invalid')
}

function plainDecisionValue(value) { return Array.isArray(value) ? value.join(', ') : String(value) }
const transitionActionById = Object.freeze({
  open_preparation: 'Krish will start private preparation for Aperture House.',
  accept_intensive_proof: 'Aperture House will begin the intensive proof.',
  close_preparation: 'Krish will close the preparation and discard unsent work.',
  continue_after_intensive_proof: 'Aperture House will continue beyond the intensive proof.',
  renew_continuing_period: 'Aperture House will renew the current period of work.',
  pause_intensive_proof: 'Aperture House will pause the intensive proof.',
  pause_continuing: 'Aperture House will pause the continuing work.',
  resume_continuing: 'Aperture House will resume the continuing work.',
  close_intensive_proof: 'Aperture House will begin closing the intensive proof.',
  close_continuing: 'Aperture House will begin closing the continuing work.',
  close_paused: 'Aperture House will begin closing the paused work.',
  complete_close: 'Aperture House will close this work.',
  open_new_preparation_after_close: 'Krish will start a new private preparation for Aperture House.'
})
function transitionEffect(transitionId) {
  const transition = transitionById[transitionId], plainLanguageAction = transitionActionById[transitionId]
  return transition && plainLanguageAction ? { transition_id: transition.id, from_state: transition.from, to_state: transition.to, authority: transition.authority, invalidation: transition.invalidation, receipt: transition.receipt, plain_language_action: plainLanguageAction } : null
}
function buildFinalDecisionRender(predicateProof) {
  const effect = transitionEffect(predicateProof.transition_id)
  if (!effect) return null
  const changed = predicateProof.reconciled_changed_paths.map(path => ({ path, before: specimens.decisions[predicateProof.decision_before_ref][path], after: predicateProof.reconciled_decision[path], plain_language: `${path.replaceAll('_', ' ')}: ${plainDecisionValue(predicateProof.reconciled_decision[path])}` }))
  const delta = changed.length ? ` ${changed.length} agreed decision change${changed.length === 1 ? '' : 's'} will travel with it.` : ' No decision fields change.'
  const value = { render_receipt_id: `final-render-${predicateProof.transition_id}`, transition_id: predicateProof.transition_id, subject_id: predicateProof.subject_id, case_id: predicateProof.case_id, purpose_id: predicateProof.purpose_id, predecessor_version: predecessorByTransition[predicateProof.transition_id], predicate_proof_fingerprint: predicateProof.proof_fingerprint, decision_before_fingerprint: predicateProof.decision_before_fingerprint, reconciled_decision: clone(predicateProof.reconciled_decision), reconciled_decision_fingerprint: predicateProof.reconciled_decision_fingerprint, changed_paths: clone(predicateProof.reconciled_changed_paths), changed_fields: changed, transition_effect: effect, displayed_consequence_text: `${effect.plain_language_action}${delta}`, rendered_at: '2026-09-16T08:52:00Z', receipt_fingerprint: '' }
  value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint'); return value
}
function validateFinalDecisionRender(render, proof) {
  if (!finiteJson(render) || !finiteJson(proof) || !exactKeys(render, interaction.final_decision_render_required) || !exactKeys(render.transition_effect, interaction.transition_effect_required) || !exactKeys(proof, semantic.predicate_proof_required) || fingerprint(render, 'receipt_fingerprint') !== render.receipt_fingerprint) return false
  const expected = buildFinalDecisionRender(proof)
  return Boolean(expected && canonical(render) === canonical(expected) && render.displayed_consequence_text.includes(render.transition_effect.plain_language_action) && !render.displayed_consequence_text.includes(proof.transition_id))
}
function buildFinalReceipt(transitionId, predicateProof) {
  if (!transitionById[transitionId] || !predicateProof || typeof predicateProof !== 'object' || Array.isArray(predicateProof)) return null
  const transition = transitionById[transitionId], render = buildFinalDecisionRender(predicateProof), context = bindingForTransition(transitionId, predicateProof.proof_fingerprint, predicateProof.reconciled_decision_fingerprint, render)
  if (!transition || !render || !context || !transition.final_authority || !Array.isArray(transition.final_authority.actor_roles)) return null
  const allowed = transition.final_authority.actor_roles.map(role => roleHuman[role])
  const humans = transition.final_authority.cardinality === 'all' ? byteSorted([...new Set(allowed)]) : [allowed[0]]
  const authorityProofs = humans.map(human => ({ named_human_id: human, authentication_event_ref: human === 'krish' ? 'auth-r89-repair-krish' : 'auth-r89-repair-leader', authority_event_ref: `final-authority-${transitionId}-${human}` }))
  const value = { receipt_type: trust.exact_constants.final_receipt_type, domain_separator: trust.exact_constants.final_domain_separator, authority_receipt_id: `final-${transitionId}`, authority_proofs: authorityProofs, transition_id: context.transition_id, subject_id: context.subject_id, case_id: context.case_id, purpose_id: context.purpose_id, permitted_audience: context.permitted_audience, predecessor_version: context.predecessor_version, predicate_proof_fingerprint: context.predicate_proof_fingerprint, reconciled_decision_fingerprint: context.reconciled_decision_fingerprint, final_render_fingerprint: context.final_render_fingerprint, authority_bundle_fingerprint: authorityBundle, render_receipt_ref: context.render_receipt_ref, displayed_consequence_text: context.displayed_consequence_text, visible_consequence_fingerprint: hashValue(context.displayed_consequence_text), reserved_transition_receipt_version: context.reserved_transition_receipt_version, server_commit_time: context.server_commit_time, valid_until: '2026-09-16T09:30:00Z', authority_receipt_fingerprint: '' }
  value.authority_receipt_fingerprint = fingerprint(value, 'authority_receipt_fingerprint')
  return { receipt: value, render }
}
if (process.env.R89_EMIT_FINAL_UNSIGNED === '1') {
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance()
  const emitted = {}
  for (const transitionId of Object.keys(transitionById)) {
    sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance()
    const built = buildPredicateProof(transitionId), final = buildFinalReceipt(transitionId, built.proof)
    for (const proof of final.receipt.authority_proofs) {
      const human = proof.named_human_id, authentication = specimens.authentication_events[proof.authentication_event_ref]
      emitted[proof.authority_event_ref] = { event_id: proof.authority_event_ref, named_human_id: human, credential_id: authentication.credential_id, session_id: authentication.session_id, method: authentication.method, issuer_id: authentication.issuer_id, transition_id: final.receipt.transition_id, subject_id: final.receipt.subject_id, case_id: final.receipt.case_id, purpose_id: final.receipt.purpose_id, permitted_audience: final.receipt.permitted_audience, predecessor_version: final.receipt.predecessor_version, predicate_proof_fingerprint: final.receipt.predicate_proof_fingerprint, reconciled_decision_fingerprint: final.receipt.reconciled_decision_fingerprint, authority_bundle_fingerprint: final.receipt.authority_bundle_fingerprint, render_receipt_ref: final.receipt.render_receipt_ref, visible_consequence_fingerprint: final.receipt.visible_consequence_fingerprint, reserved_transition_receipt_version: final.receipt.reserved_transition_receipt_version, authorized_at: '2026-09-16T08:51:00Z', issuer_signature_base64: '', final_render_fingerprint: final.receipt.final_render_fingerprint }
    }
  }
  console.log(`R89_UNSIGNED_FINALS=${JSON.stringify(emitted)}`)
  process.exit(0)
}
function validateFinalAuthorityEvent(event, proof, receipt) {
  const reject = reason => { if (process.env.R89_DEBUG) console.error('final authority reject', reason, proof?.authority_event_ref); return false }
  if (!finiteJson(event) || !finiteJson(proof) || !finiteJson(receipt) || !exactKeys(event, trust.final_authority_event_required) || !exactKeys(proof, trust.authority_proof_required) || typeof event.issuer_signature_base64 !== 'string') return reject('shape')
  const auth = specimens.authentication_events[proof.authentication_event_ref]
  const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id)
  const credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id)
  if (!issuer || !credential || credential.named_human_id !== proof.named_human_id || event.named_human_id !== proof.named_human_id || !issuer.allowed_methods.includes(event.method)) return reject('issuer')
  if (validateAuthentication(auth, proof.named_human_id, receipt.server_commit_time) !== 'valid' || auth.session_id !== event.session_id || auth.credential_id !== event.credential_id || auth.issuer_id !== event.issuer_id || auth.method !== event.method) return reject('authentication')
  const unsigned = clone(event); delete unsigned.issuer_signature_base64
  try { if (!verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64'))) return reject('signature') } catch { return reject('signature_throw') }
  for (const field of ['transition_id', 'subject_id', 'case_id', 'purpose_id', 'permitted_audience', 'predecessor_version', 'predicate_proof_fingerprint', 'reconciled_decision_fingerprint', 'final_render_fingerprint', 'authority_bundle_fingerprint', 'render_receipt_ref', 'visible_consequence_fingerprint', 'reserved_transition_receipt_version']) if (!same(event[field], receipt[field])) { if (process.env.R89_DEBUG) console.error('values', event[field], receipt[field]); return reject(`binding_${field}`) }
  return Date.parse(auth.issued_at) <= Date.parse(event.authorized_at) && Date.parse(event.authorized_at) <= Date.parse(receipt.server_commit_time) && Date.parse(event.authorized_at) < Date.parse(auth.valid_until) ? true : reject('time')
}
const acceptedFinalService = (() => {
  let records = [], challenges = [], blocks = [], repairs = [], revalidations = []
  const requestIdentity = receipt => `${receipt.transition_id}|${receipt.subject_id}|${receipt.case_id}|${receipt.reserved_transition_receipt_version}`
  const requestFingerprint = (receipt, predicateProof, evidence, finalRender, authorityEvents) => hashValue({ receipt, predicate_proof: predicateProof, evidence, final_render: finalRender, authority_events: authorityEvents })
  const acceptedId = identity => `accepted-${hashValue(identity).slice(0, 32)}`
  const resolve = (receipt, predicateProof, evidence, finalRender, authorityEvents) => {
    const identity = requestIdentity(receipt), existing = records.find(record => record.request_identity === identity)
    if (!existing) return { status: 'absent', record: null }
    return existing.request_fingerprint === requestFingerprint(receipt, predicateProof, evidence, finalRender, authorityEvents) ? { status: 'accepted', record: clone(existing) } : { status: 'collision', record: clone(existing) }
  }
  const canCommit = (receipt, predicateProof, evidence, finalRender, authorityEvents) => {
    const identity = requestIdentity(receipt), id = acceptedId(identity), requestFp = requestFingerprint(receipt, predicateProof, evidence, finalRender, authorityEvents)
    const byIdentity = records.find(record => record.request_identity === identity), byId = records.find(record => record.accepted_final_id === id || record.history_preserved_ref === id)
    return (!byIdentity || byIdentity.request_fingerprint === requestFp) && (!byId || byId.request_identity === identity)
  }
  const commit = (receipt, predicateProof, evidence, finalRender, authorityEvents) => {
    const identity = requestIdentity(receipt), requestFp = requestFingerprint(receipt, predicateProof, evidence, finalRender, authorityEvents)
    const existing = records.find(record => record.request_identity === identity)
    if (existing) return existing.request_fingerprint === requestFp
    if (!canCommit(receipt, predicateProof, evidence, finalRender, authorityEvents)) return false
    const id = acceptedId(identity), record = { accepted_final_id: id, request_identity: identity, request_fingerprint: requestFp, transition_id: receipt.transition_id, subject_id: receipt.subject_id, case_id: receipt.case_id, purpose_id: receipt.purpose_id, permitted_audience: receipt.permitted_audience, predecessor_version: receipt.predecessor_version, predicate_proof_fingerprint: predicateProof.proof_fingerprint, answer_state_head_fingerprints: byteSorted(predicateProof.answer_state_heads.map(head => head.state_fingerprint)), final_render_fingerprint: finalRender.receipt_fingerprint, final_authority_receipt_fingerprint: receipt.authority_receipt_fingerprint, accepted_at: receipt.server_commit_time, standing: 'accepted', current_steering_eligibility: true, history_preserved_ref: id, record_fingerprint: '' }
    record.record_fingerprint = fingerprint(record, 'record_fingerprint')
    if (!exactKeys(record, correction.accepted_final_record_required)) return false
    records.push(record); return true
  }
  const unresolvedChallenges = acceptedFinalId => challenges.filter(challenge => challenge.accepted_final_id === acceptedFinalId && !revalidations.some(record => record.challenge_ids.includes(challenge.challenge_id)))
  const unresolvedBlocks = () => blocks.filter(block => !revalidations.some(record => record.block_ids.includes(block.block_id)))
  const currentHeadFingerprints = openChallenges => {
    const authority = answerAuthorityService.snapshotForConformance()
    return byteSorted([...new Set(openChallenges.map(challenge => {
      const trigger = specimens.answer_state_transition_events[challenge.trigger_transition_ref]
      const head = authority.snapshot.history_heads.find(value => value.route_ref === trigger?.route_ref && value.question_id === trigger?.question_id)
      return authority.store.records.find(value => value.answer_state_id === head?.head_state_id)?.state_fingerprint
    }).filter(Boolean))])
  }
  const challengeAnswerHead = (prior, next, transition) => {
    for (const record of records.filter(value => value.answer_state_head_fingerprints.includes(prior.state_fingerprint))) {
      if (challenges.some(challenge => challenge.accepted_final_id === record.accepted_final_id && challenge.changed_head_fingerprint === prior.state_fingerprint)) continue
      const challengeId = `challenge-${hashValue(`${record.accepted_final_id}|${prior.state_fingerprint}|${next.state_fingerprint}`).slice(0, 32)}`, blockId = `block-${hashValue(`${record.accepted_final_id}|${challengeId}`).slice(0, 32)}`
      const statusText = transition.action === 'withdraw' ? 'Your earlier decision stays on record. Nothing else will move until you choose a new answer and review it with Krish.' : 'Your earlier decision stays on record. Nothing else will move until you review this change with Krish.'
      const challenge = { challenge_id: challengeId, accepted_final_id: record.accepted_final_id, accepted_record_fingerprint: record.record_fingerprint, trigger_transition_ref: transition.event_id, changed_head_fingerprint: prior.state_fingerprint, resulting_head_fingerprint: next.state_fingerprint, subject_id: record.subject_id, case_id: record.case_id, purpose_id: record.purpose_id, permitted_audience: record.permitted_audience, standing: 'challenged', current_steering_eligibility: false, status_text: statusText, challenged_at: transition.authorized_at, challenge_fingerprint: '' }; challenge.challenge_fingerprint = fingerprint(challenge, 'challenge_fingerprint')
      const block = { block_id: blockId, challenge_id: challengeId, accepted_final_id: record.accepted_final_id, subject_id: record.subject_id, case_id: record.case_id, purpose_id: record.purpose_id, permitted_audience: record.permitted_audience, standing: 'active', status_text: statusText, created_at: transition.authorized_at, block_fingerprint: '' }; block.block_fingerprint = fingerprint(block, 'block_fingerprint')
      const receipt = { receipt_type: 'ctrl.answer-state-repair.v1', domain_separator: trust.exact_constants.correction_domain_separator, repair_id: `repair-${hashValue(`${record.accepted_final_id}|${challengeId}`).slice(0, 32)}`, graph_head: challengeId, graph_epoch: next.issuer_sequence, dependency_set_seal: hashValue(record.answer_state_head_fingerprints), subject_id: record.subject_id, case_id: record.case_id, purpose_id: record.purpose_id, permitted_audience: record.permitted_audience, authority_bundle_fingerprint: authorityBundle, trigger_ref: transition.event_id, challenged_proof_ref: record.predicate_proof_fingerprint, dependency_id: `answer-state:${next.route_ref}|${next.question_id}`, dependency_fingerprint: prior.state_fingerprint, edge_kind: 'content_dependency', dependency_use_ref: record.accepted_final_id, affected_artifact_ref: record.final_authority_receipt_fingerprint, repair_action: 'require_human_review', history_preserved_ref: record.accepted_final_id, descendant_block_ref: blockId, fresh_reopen_authority_ref: null, terminal_status: 'review_required', current_steering_eligibility: false, resulting_version_ref: next.state_fingerprint, issued_at: transition.authorized_at, receipt_fingerprint: '' }
      receipt.receipt_fingerprint = fingerprint(receipt, 'receipt_fingerprint')
      const valid = exactKeys(challenge, correction.accepted_final_challenge_required) && fingerprint(challenge, 'challenge_fingerprint') === challenge.challenge_fingerprint && exactKeys(block, correction.descendant_block_required) && fingerprint(block, 'block_fingerprint') === block.block_fingerprint && exactKeys(receipt, correction.repair_receipt_required) && fingerprint(receipt, 'receipt_fingerprint') === receipt.receipt_fingerprint && receipt.history_preserved_ref === record.accepted_final_id && receipt.descendant_block_ref === block.block_id
      if (valid) { challenges.push(challenge); blocks.push(block); repairs.push(receipt) }
    }
  }
  const validateRevalidationEvent = (event, record, openChallenges) => {
    if (!finiteJson(event) || !exactKeys(event, trust.answer_state_revalidation_event_required)) return false
    const issuer = trust.trusted_authenticator_registry.find(value => value.issuer_id === event.issuer_id), credential = issuer?.allowed_credentials.find(value => value.credential_id === event.credential_id), authentication = specimens.authentication_events[event.authentication_event_ref]
    const transition = transitionById[record.transition_id], allowedHumans = transition.final_authority.actor_roles.map(role => roleHuman[role]), currentHeads = currentHeadFingerprints(openChallenges), challengeIds = byteSorted(openChallenges.map(challenge => challenge.challenge_id))
    if (!issuer || !credential || !authentication || credential.named_human_id !== event.named_human_id || !allowedHumans.includes(event.named_human_id) || !issuer.allowed_methods.includes(event.method) || validateAuthentication(authentication, event.named_human_id, event.authorized_at) !== 'valid' || authentication.session_id !== event.session_id || authentication.issuer_id !== event.issuer_id || authentication.credential_id !== event.credential_id || authentication.method !== event.method) return false
    if (event.accepted_request_identity !== record.request_identity || event.accepted_final_id !== record.accepted_final_id || !same(event.challenge_ids, challengeIds) || event.challenge_set_seal !== hashValue(challengeIds) || !same(event.current_answer_head_fingerprints, currentHeads) || event.action !== 'revalidate_after_answer_change' || event.subject_id !== record.subject_id || event.case_id !== record.case_id || event.purpose_id !== record.purpose_id || !same(event.permitted_audience, record.permitted_audience) || event.status_text !== 'You reviewed the change with Krish. Work can move again using your current answer.' || openChallenges.some(challenge => Date.parse(event.authorized_at) < Date.parse(challenge.challenged_at))) return false
    const unsigned = clone(event); delete unsigned.issuer_signature_base64
    try { return verify(null, Buffer.from(canonical(unsigned)), createPublicKey(issuer.public_key_spki_pem), Buffer.from(event.issuer_signature_base64, 'base64')) } catch { return false }
  }
  const unsignedRevalidationEvents = acceptedFinalId => {
    const record = records.find(value => value.accepted_final_id === acceptedFinalId), open = unresolvedChallenges(acceptedFinalId)
    if (!record || !open.length) return []
    const transition = transitionById[record.transition_id], humans = byteSorted([...new Set(transition.final_authority.actor_roles.map(role => roleHuman[role]))]), challengeIds = byteSorted(open.map(challenge => challenge.challenge_id)), currentHeads = currentHeadFingerprints(open)
    const challengeSeal = hashValue(challengeIds)
    return humans.map(human => { const authentication = specimens.authentication_events[human === 'krish' ? 'auth-r89-repair-krish' : 'auth-r89-repair-leader']; return { event_id: `revalidation-${acceptedFinalId}-${challengeSeal.slice(0, 12)}-${human}`, named_human_id: human, credential_id: authentication.credential_id, authentication_event_ref: authentication.event_id, session_id: authentication.session_id, method: authentication.method, issuer_id: authentication.issuer_id, accepted_request_identity: record.request_identity, accepted_final_id: acceptedFinalId, challenge_ids: challengeIds, challenge_set_seal: challengeSeal, current_answer_head_fingerprints: currentHeads, action: 'revalidate_after_answer_change', status_text: 'You reviewed the change with Krish. Work can move again using your current answer.', subject_id: record.subject_id, case_id: record.case_id, purpose_id: record.purpose_id, permitted_audience: record.permitted_audience, authorized_at: '2026-09-16T09:10:00Z', issuer_signature_base64: '' } })
  }
  const revalidate = events => {
    if (!finiteJson(events) || !Array.isArray(events) || !events.length) return false
    const eventRefsForRetry = byteSorted(events.map(event => event.event_id)), eventFingerprintsForRetry = eventRefsForRetry.map(ref => hashValue(events.find(event => event.event_id === ref)))
    const priorResolution = revalidations.find(value => same(value.event_refs, eventRefsForRetry) && same(value.event_fingerprints, eventFingerprintsForRetry))
    if (priorResolution) return true
    const record = records.find(value => value.accepted_final_id === events[0].accepted_final_id), open = record ? unresolvedChallenges(record.accepted_final_id) : []
    if (!record || !open.length) return false
    const transition = transitionById[record.transition_id], requiredHumans = byteSorted([...new Set(transition.final_authority.actor_roles.map(role => roleHuman[role]))])
    if (!same(byteSorted(events.map(event => event.named_human_id)), requiredHumans) || !unique(events.map(event => event.named_human_id)) || !events.every(event => validateRevalidationEvent(event, record, open))) return false
    const challengeIds = byteSorted(open.map(challenge => challenge.challenge_id)), blockIds = byteSorted(blocks.filter(block => challengeIds.includes(block.challenge_id)).map(block => block.block_id)), eventRefs = byteSorted(events.map(event => event.event_id)), eventFingerprints = eventRefs.map(ref => hashValue(events.find(event => event.event_id === ref)))
    const resolution = { revalidation_id: `revalidated-${hashValue(`${record.accepted_final_id}|${hashValue(challengeIds)}`).slice(0, 32)}`, accepted_final_id: record.accepted_final_id, accepted_request_identity: record.request_identity, event_refs: eventRefs, event_fingerprints: eventFingerprints, challenge_ids: challengeIds, challenge_set_seal: hashValue(challengeIds), block_ids: blockIds, current_answer_head_fingerprints: currentHeadFingerprints(open), standing: 'resolved', status_text: 'You reviewed the change with Krish. Work can move again using your current answer.', resolved_at: events[0].authorized_at, record_fingerprint: '' }; resolution.record_fingerprint = fingerprint(resolution, 'record_fingerprint')
    if (!exactKeys(resolution, correction.revalidation_record_required)) return false
    const existing = revalidations.find(value => value.revalidation_id === resolution.revalidation_id)
    if (existing) return canonical(existing) === canonical(resolution)
    revalidations.push(resolution); return true
  }
  const isBlocked = proof => unresolvedBlocks().some(block => block.subject_id === proof.subject_id && block.case_id === proof.case_id && block.purpose_id === proof.purpose_id && same(block.permitted_audience, proof.permitted_audience))
  return Object.freeze({ resolve, canCommit, commit, challengeAnswerHead, isBlocked, revalidate, unsignedRevalidationEvents, records: () => clone(records), challenges: () => clone(challenges), blocks: () => clone(blocks), repairs: () => clone(repairs), revalidations: () => clone(revalidations), resetForConformance: () => { records = []; challenges = []; blocks = []; repairs = []; revalidations = [] } })
})()
answerAuthorityService.onAdvance((prior, next, transition) => acceptedFinalService.challengeAnswerHead(prior, next, transition))
function validateFinal(receipt, predicateProof, evidence, finalRender, authorityEvents = specimens.final_authority_events) {
  if (!finiteJson(receipt) || !finiteJson(predicateProof) || !predicateProof || typeof predicateProof !== 'object' || Array.isArray(predicateProof) || !finiteJson(evidence) || !evidence || typeof evidence !== 'object' || Array.isArray(evidence) || !finiteJson(finalRender) || !finalRender || typeof finalRender !== 'object' || Array.isArray(finalRender) || !finiteJson(authorityEvents) || !authorityEvents || typeof authorityEvents !== 'object' || Array.isArray(authorityEvents) || !exactKeys(receipt, trust.final_receipt_required) || !Array.isArray(receipt.authority_proofs) || !receipt.authority_proofs.every(proof => exactKeys(proof, trust.authority_proof_required))) return 'shape_invalid'
  const accepted = acceptedFinalService.resolve(receipt, predicateProof, evidence, finalRender, authorityEvents)
  if (accepted.status === 'accepted') return 'accepted_replay'
  if (accepted.status === 'collision') return 'accepted_final_collision'
  if (validatePredicate(predicateProof, evidence) !== 'satisfied' || !validateFinalDecisionRender(finalRender, predicateProof)) return 'predicate_invalid'
  const context = bindingForTransition(predicateProof.transition_id, predicateProof.proof_fingerprint, predicateProof.reconciled_decision_fingerprint, finalRender)
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
  if (!acceptedFinalService.canCommit(receipt, predicateProof, evidence, finalRender, authorityEvents)) return 'accepted_final_collision'
  if (!sessionAuthorityService.bindToProof(predicateProof.route_receipts, predicateProof.proof_fingerprint)) return 'route_invalid'
  if (!acceptedFinalService.commit(receipt, predicateProof, evidence, finalRender, authorityEvents)) return 'accepted_final_collision'
  return 'valid'
}
if (process.env.R89_EMIT_REVALIDATION_UNSIGNED === '1') {
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const built = buildPredicateProof('accept_intensive_proof'), final = buildFinalReceipt('accept_intensive_proof', built.proof)
  const predicateSeeded = validatePredicate(built.proof, built.evidence)
  if (predicateSeeded !== 'satisfied') throw new Error(`cannot seed predicate for revalidation emission: ${predicateSeeded}`)
  const seeded = validateFinal(final.receipt, built.proof, built.evidence, final.render)
  if (seeded !== 'valid') throw new Error(`cannot seed accepted final for revalidation emission: ${seeded}`)
  const changed = clone(built), selections = { leader_accepts_exact_purpose_and_frame_version: 1, krish_accepts_exact_purpose_and_frame_version: 1 }
  if (!replaceProofNormativeOptions(changed, selections, true)) throw new Error('cannot seed signed correction for revalidation emission')
  const accepted = acceptedFinalService.records()[0], unsigned = acceptedFinalService.unsignedRevalidationEvents(accepted.accepted_final_id)
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const withdrawnBuilt = buildPredicateProof('accept_intensive_proof'), withdrawnFinal = buildFinalReceipt('accept_intensive_proof', withdrawnBuilt.proof)
  if (validateFinal(withdrawnFinal.receipt, withdrawnBuilt.proof, withdrawnBuilt.evidence, withdrawnFinal.render) !== 'valid') throw new Error('cannot seed withdrawal revalidation emission')
  const head = withdrawnBuilt.proof.answer_state_heads[0]
  if (!answerAuthorityService.withdrawForConformance(head.route_ref, head.question_id, head.current_answer_ref)) throw new Error('cannot seed withdrawal')
  const reanswer = Object.values(specimens.answer_state_transition_events).find(event => event.route_ref === head.route_ref && event.question_id === head.question_id && event.action === 'reanswer')
  if (!reanswer || !answerAuthorityService.reanswerForConformance(head.route_ref, head.question_id, reanswer.answer_ref)) throw new Error('cannot seed reanswer')
  const withdrawnAccepted = acceptedFinalService.records()[0], withdrawalUnsigned = acceptedFinalService.unsignedRevalidationEvents(withdrawnAccepted.accepted_final_id)
  if (!unsigned.length || !withdrawalUnsigned.length) throw new Error('no unsigned revalidation events emitted')
  console.log(`R89_UNSIGNED_REVALIDATIONS=${JSON.stringify([...unsigned, ...withdrawalUnsigned])}`)
  process.exit(0)
}
for (const vector of vectors.final_authority_vectors) {
  sessionAuthorityService.resetForConformance()
  answerAuthorityService.resetForConformance()
  acceptedFinalService.resetForConformance()
  const transitionId = vector.transition_id ?? 'accept_intensive_proof', builtPredicate = buildPredicateProof(transitionId), predicate = builtPredicate.proof, finalBuilt = buildFinalReceipt(transitionId, predicate), receipt = finalBuilt.receipt, finalRender = finalBuilt.render, authorityEvents = clone(specimens.final_authority_events)
  if (vector.mutation?.op === 'mutate_authority_event') setAt(authorityEvents[vector.mutation.event_ref], vector.mutation.path, vector.mutation.value)
  else if (vector.mutation?.op === 'drop_predicate_evidence') builtPredicate.evidence = null
  else if (vector.mutation?.op === 'mutate_final_render') { setAt(finalRender, vector.mutation.path, vector.mutation.value); finalRender.receipt_fingerprint = fingerprint(finalRender, 'receipt_fingerprint') }
  else if (vector.mutation) setAt(receipt, vector.mutation.path, vector.mutation.value)
  receipt.authority_receipt_fingerprint = fingerprint(receipt, 'authority_receipt_fingerprint')
  checkEq(`final vector ${vector.id}`, validateFinal(receipt, predicate, builtPredicate.evidence, finalRender, authorityEvents), vector.expected)
}
{
  sessionAuthorityService.resetForConformance()
  answerAuthorityService.resetForConformance()
  acceptedFinalService.resetForConformance()
  const builtPredicate = buildPredicateProof('accept_intensive_proof'), finalBuilt = buildFinalReceipt('accept_intensive_proof', builtPredicate.proof)
  finalBuilt.receipt.predicate_proof_fingerprint = '0'.repeat(64)
  finalBuilt.receipt.authority_receipt_fingerprint = fingerprint(finalBuilt.receipt, 'authority_receipt_fingerprint')
  check('final authority cannot name an orphan predicate hash', validateFinal(finalBuilt.receipt, builtPredicate.proof, builtPredicate.evidence, finalBuilt.render) === 'binding_invalid')
}
{
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const built = buildPredicateProof('accept_intensive_proof'), final = buildFinalReceipt('accept_intensive_proof', built.proof), badRender = clone(final.render)
  badRender.transition_effect.plain_language_action = 'Aperture House kept the current direction.'; badRender.receipt_fingerprint = fingerprint(badRender, 'receipt_fingerprint')
  check('rejected final render commits no route claim', validateFinal(final.receipt, built.proof, built.evidence, badRender) === 'predicate_invalid' && sessionAuthorityService.bindToProof(built.proof.route_receipts, 'alternate-proof-after-bad-render') === true)
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const builtAuthority = buildPredicateProof('accept_intensive_proof'), finalAuthority = buildFinalReceipt('accept_intensive_proof', builtAuthority.proof), emptyAuthority = {}
  check('rejected final authority commits no route claim', validateFinal(finalAuthority.receipt, builtAuthority.proof, builtAuthority.evidence, finalAuthority.render, emptyAuthority) === 'authority_invalid' && sessionAuthorityService.bindToProof(builtAuthority.proof.route_receipts, 'alternate-proof-after-bad-authority') === true)
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const accepted = buildPredicateProof('accept_intensive_proof'), acceptedFinal = buildFinalReceipt('accept_intensive_proof', accepted.proof)
  check('successful final is idempotent and blocks competing proof claim', validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, acceptedFinal.render) === 'valid' && validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, acceptedFinal.render) === 'accepted_replay' && sessionAuthorityService.bindToProof(accepted.proof.route_receipts, 'competing-proof') === false)
}
{
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const accepted = buildPredicateProof('accept_intensive_proof'), acceptedFinal = buildFinalReceipt('accept_intensive_proof', accepted.proof)
  checkEq('pre-correction final accepted', validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, acceptedFinal.render), 'valid')
  const immutableAcceptedBytes = canonical(acceptedFinalService.records()[0])
  const competing = clone(accepted), selections = { leader_accepts_exact_purpose_and_frame_version: 1, krish_accepts_exact_purpose_and_frame_version: 1 }
  check('post-final signed correction advances the answer authority', replaceProofNormativeOptions(competing, selections, true))
  checkEq('changed accepted predecessor blocks replacement proof pending review', validatePredicate(competing.proof, competing.evidence), 'predecessor_challenged')
  checkEq('changed accepted predecessor blocks the consumed proof', validatePredicate(accepted.proof, accepted.evidence), 'predecessor_challenged')
  checkEq('exact accepted retry resolves committed result before mutable authority', validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, acceptedFinal.render), 'accepted_replay')
  const changedRender = clone(acceptedFinal.render); changedRender.displayed_consequence_text += ' Changed after acceptance.'; changedRender.receipt_fingerprint = fingerprint(changedRender, 'receipt_fingerprint')
  checkEq('changed bytes under accepted identity collide', validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, changedRender), 'accepted_final_collision')
  const acceptedRecord = acceptedFinalService.records()[0], repairs = acceptedFinalService.repairs(), challenges = acceptedFinalService.challenges(), blocks = acceptedFinalService.blocks()
  check('accepted result is immutable while append-only challenge records control standing', canonical(acceptedRecord) === immutableAcceptedBytes && acceptedRecord.standing === 'accepted' && acceptedRecord.current_steering_eligibility === true && fingerprint(acceptedRecord, 'record_fingerprint') === acceptedRecord.record_fingerprint && challenges.length === 2 && blocks.length === 2)
  check('answer correction emits complete human-review repair receipts for every changed consumed head', repairs.length === 2 && repairs.every(receipt => exactKeys(receipt, correction.repair_receipt_required) && receipt.challenged_proof_ref === accepted.proof.proof_fingerprint && receipt.repair_action === 'require_human_review' && receipt.terminal_status === 'review_required' && receipt.current_steering_eligibility === false && receipt.descendant_block_ref && receipt.history_preserved_ref === acceptedRecord.history_preserved_ref && fingerprint(receipt, 'receipt_fingerprint') === receipt.receipt_fingerprint) && unique(repairs.map(receipt => receipt.dependency_fingerprint)))
  check('challenge and block copy truthfully preserve the committed decision while pausing descendants', challenges.every(value => exactKeys(value, correction.accepted_final_challenge_required) && value.status_text === 'Your earlier decision stays on record. Nothing else will move until you review this change with Krish.') && blocks.every(value => exactKeys(value, correction.descendant_block_required) && value.standing === 'active'))
  const successorBefore = buildPredicateProof('continue_after_intensive_proof')
  checkEq('actual successor predicate is blocked by challenged accepted predecessor', validatePredicate(successorBefore.proof, successorBefore.evidence), 'predecessor_challenged')
  const seal = hashValue(byteSorted(challenges.map(value => value.challenge_id))), revalidationEvents = Object.values(specimens.answer_state_revalidation_events).filter(value => value.challenge_set_seal === seal)
  const crossHuman = clone(revalidationEvents); if (crossHuman[0]) crossHuman[0].named_human_id = crossHuman[0].named_human_id === 'krish' ? 'leader-1' : 'krish'
  check('cross-human revalidation cannot reopen work', revalidationEvents.length === 2 && acceptedFinalService.revalidate(crossHuman) === false)
  check('exact signed human authority set revalidates changed answer heads', acceptedFinalService.revalidate(revalidationEvents))
  check('accepted final remains byte-identical after revalidation', canonical(acceptedFinalService.records()[0]) === immutableAcceptedBytes)
  check('revalidation resolution closes exact challenges and blocks', acceptedFinalService.revalidations().length === 1 && acceptedFinalService.revalidations()[0].challenge_set_seal === seal && same(acceptedFinalService.revalidations()[0].block_ids, byteSorted(blocks.map(value => value.block_id))))
  checkEq('actual successor predicate can proceed after signed revalidation', validatePredicate(successorBefore.proof, successorBefore.evidence), 'satisfied')
  check('byte-identical revalidation retry is idempotent', acceptedFinalService.revalidate(revalidationEvents))
  check('corrected competing proof cannot steal committed lifecycle route', sessionAuthorityService.bindToProof(competing.proof.route_receipts, competing.proof.proof_fingerprint) === false)
}
{
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const accepted = buildPredicateProof('accept_intensive_proof'), acceptedFinal = buildFinalReceipt('accept_intensive_proof', accepted.proof)
  checkEq('pre-withdrawal final accepted', validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, acceptedFinal.render), 'valid')
  const head = accepted.proof.answer_state_heads[0]
  check('post-final proof contains a consumed answer head', Boolean(head))
  if (head) {
    check('post-final signed withdrawal advances authority', answerAuthorityService.withdrawForConformance(head.route_ref, head.question_id, head.current_answer_ref))
    checkEq('withdrawn consumed answer blocks current proof', validatePredicate(accepted.proof, accepted.evidence), 'predecessor_challenged')
    checkEq('exact retry after withdrawal remains idempotently accepted', validateFinal(acceptedFinal.receipt, accepted.proof, accepted.evidence, acceptedFinal.render), 'accepted_replay')
    const challenge = acceptedFinalService.challenges()[0], successor = buildPredicateProof('continue_after_intensive_proof')
    check('withdrawal emits one truthful blocking repair path', acceptedFinalService.records()[0].standing === 'accepted' && acceptedFinalService.repairs().length === 1 && acceptedFinalService.repairs()[0].terminal_status === 'review_required' && challenge.status_text === 'Your earlier decision stays on record. Nothing else will move until you choose a new answer and review it with Krish.')
    checkEq('withdrawal blocks actual successor', validatePredicate(successor.proof, successor.evidence), 'predecessor_challenged')
    const reanswer = Object.values(specimens.answer_state_transition_events).find(event => event.route_ref === head.route_ref && event.question_id === head.question_id && event.action === 'reanswer')
    check('signed reanswer creates a current answer ready for review', Boolean(reanswer) && answerAuthorityService.reanswerForConformance(head.route_ref, head.question_id, reanswer.answer_ref) && answerAuthorityService.resolve(head.route_ref, head.question_id, reanswer.answer_ref).status === 'current')
    const seal = hashValue([challenge.challenge_id]), revalidationEvents = Object.values(specimens.answer_state_revalidation_events).filter(value => value.challenge_set_seal === seal)
    check('withdrawal remains blocked until exact signed review', validatePredicate(successor.proof, successor.evidence) === 'predecessor_challenged' && revalidationEvents.length === 2)
    check('signed post-reanswer review releases work', acceptedFinalService.revalidate(revalidationEvents))
    checkEq('successor proceeds after reanswer and review', validatePredicate(successor.proof, successor.evidence), 'satisfied')
  }
}
{
  sessionAuthorityService.resetForConformance(); answerAuthorityService.resetForConformance(); acceptedFinalService.resetForConformance()
  const first = buildPredicateProof('accept_intensive_proof'), firstFinal = buildFinalReceipt('accept_intensive_proof', first.proof)
  checkEq('first caller receipt identity accepted', validateFinal(firstFinal.receipt, first.proof, first.evidence, firstFinal.render), 'valid')
  const second = buildPredicateProof('continue_after_intensive_proof'), secondFinal = buildFinalReceipt('continue_after_intensive_proof', second.proof)
  secondFinal.receipt.authority_receipt_id = firstFinal.receipt.authority_receipt_id
  secondFinal.receipt.authority_receipt_fingerprint = fingerprint(secondFinal.receipt, 'authority_receipt_fingerprint')
  checkEq('duplicate caller receipt id cannot alias a distinct server-bound request', validateFinal(secondFinal.receipt, second.proof, second.evidence, secondFinal.render), 'valid')
  const acceptedIds = acceptedFinalService.records().map(value => value.accepted_final_id), histories = acceptedFinalService.records().map(value => value.history_preserved_ref)
  check('server-derived accepted and history ids stay unique despite duplicate caller id', acceptedIds.length === 2 && unique(acceptedIds) && unique(histories))
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
function answerEffectFromEvidence(item) {
  const receipt = item?.value, question = item?.question
  if (!receipt || !question) return null
  if (receipt.answer_status === 'selected') return resolveAnswerEffect(question, receipt.selected_option)
  const interpretation = specimens.structured_interpretations[receipt.free_expression_interpretation_ref]
  return interpretation && exactKeys(interpretation.decision_value, ['path', 'value']) && ['supports_transition', 'blocks_transition'].includes(interpretation.transition_disposition) ? { effect_id: interpretation.derived_effect_id, patch: interpretation.decision_value, transition_disposition: interpretation.transition_disposition } : null
}
function reconcileNormativeEvidence(transitionId, items) {
  const beforeRef = resolveClosedPredecessor(transitionId)?.decision_ref ?? specimens.case_context.current_decision_ref
  const before = specimens.decisions[beforeRef]
  if (!before || !Array.isArray(items)) return { status: 'invalid' }
  const effects = items.map(answerEffectFromEvidence)
  if (effects.some(effect => !effect)) return { status: 'invalid' }
  if (effects.some(effect => effect.transition_disposition === 'blocks_transition')) return { status: 'contradicted' }
  const byPath = new Map()
  for (const effect of effects) {
    const encoded = canonical(effect.patch.value)
    if (byPath.has(effect.patch.path) && byPath.get(effect.patch.path).encoded !== encoded) return { status: 'contradicted' }
    byPath.set(effect.patch.path, { encoded, value: clone(effect.patch.value) })
  }
  const after = clone(before)
  for (const [path, record] of [...byPath.entries()].sort(([a], [b]) => Buffer.from(a).compare(Buffer.from(b)))) after[path] = record.value
  const changedPaths = byteSorted(imports.accepted_decision_state_schema.material_paths.filter(path => !same(before[path], after[path])))
  return { status: 'present', beforeRef, beforeFingerprint: hashValue(before), after, afterFingerprint: hashValue(after), changedPaths }
}
function buildPredicateProof(transitionId) {
  const transition = transitionById[transitionId]
  if (!transition) return null
  const conditionalContext = authoritativeConditionalContext(transitionId), expectedIds = requiredDependencyIds(transitionId), vectorBinding = bindingForTransition(transitionId), routeByHuman = transition.normative_dependencies.length ? buildRouteReceipts(transitionId) : {}, predecessor = resolveClosedPredecessor(transitionId)
  const evidence = {}, results = []
  for (const id of expectedIds) {
    if (resolveOwner(id)) {
      const profile = buildProfile(id, transitionId), derivedProof = buildDerivedProof(id, profile, transitionId); const ref = `profile:${id}`; evidence[ref] = { kind: 'profile', dependency_id: id, value: { profile, derived_proof: derivedProof } }
      results.push({ dependency_id: id, disposition: 'present', evidence_ref: ref, evidence_fingerprint: hashValue(evidence[ref].value) })
    } else {
      const question = buildQuestionForDependency(id, transitionId), human = question.named_answer_owner, authRef = human === 'krish' ? 'auth-2' : 'auth-1', routeReceipt = routeByHuman[human], built = buildNormativeReceipt(question, question.answer_options[0], human, authRef, null, routeReceipt, vectorBinding)
      const ref = `receipt:${id}`; evidence[ref] = { kind: 'normative', dependency_id: id, value: built.receipt, question, render: built.render, route_receipt: routeReceipt }
      results.push({ dependency_id: id, disposition: 'present', evidence_ref: ref, evidence_fingerprint: hashValue(built.receipt) })
    }
  }
  const normativeItems = Object.values(evidence).filter(item => item.kind === 'normative'), reconciled = reconcileNormativeEvidence(transitionId, normativeItems)
  const answerStateHeads = normativeItems.map(item => answerAuthorityService.resolve(routeReceiptRef(item.route_receipt), item.question.question_id, item.value.answer_event_ref ?? item.value.free_expression_confirmation_ref)).filter(result => result.status === 'current').map(result => result.record).sort((a, b) => Buffer.from(a.answer_state_id).compare(Buffer.from(b.answer_state_id)))
  const beforeRef = predecessor?.decision_ref ?? specimens.case_context.current_decision_ref, before = specimens.decisions[beforeRef]
  const reconciledDecision = reconciled.status === 'present' ? reconciled.after : before
  const proof = { proof_id: `proof-${transitionId}`, transition_id: transitionId, conditional_context: conditionalContext, expected_dependency_ids: expectedIds, expected_dependency_set_seal: hashValue(expectedIds), dependency_results: results, decision_before_ref: beforeRef, decision_before_fingerprint: hashValue(before), decision_before_version: predecessor?.predecessor_version ?? null, previous_purpose_id: predecessor?.previous_purpose_id ?? null, closed_predecessor_record_ref: predecessor?.record_ref ?? null, closed_predecessor_record_fingerprint: predecessor?.record_fingerprint ?? null, reconciled_decision: reconciledDecision, reconciled_decision_fingerprint: hashValue(reconciledDecision), reconciled_changed_paths: reconciled.status === 'present' ? reconciled.changedPaths : [], route_receipts: byteSorted(Object.values(routeByHuman).map(routeReceiptRef)).map(ref => Object.values(routeByHuman).find(receipt => routeReceiptRef(receipt) === ref)), answer_state_heads: answerStateHeads, evaluation_time: vectorBinding.server_commit_time, subject_id: vectorBinding.subject_id, case_id: vectorBinding.case_id, purpose_id: vectorBinding.purpose_id, permitted_audience: vectorBinding.permitted_audience, authority_bundle_fingerprint: authorityBundle, proof_fingerprint: '' }
  proof.proof_fingerprint = fingerprint(proof, 'proof_fingerprint')
  return { proof, evidence }
}
check('every transition-taking builder rejects unknown primitive without throwing', bindingForTransition('attacker-transition') === null && buildPredicateProof('attacker-transition') === null && buildFinalReceipt('attacker-transition', {}) === null)
function refreshProofAnswerStateHeads(built) {
  const heads = []
  for (const item of Object.values(built.evidence).filter(value => value.kind === 'normative')) {
    const resolved = answerAuthorityService.resolve(routeReceiptRef(item.route_receipt), item.question.question_id, item.value.answer_event_ref ?? item.value.free_expression_confirmation_ref)
    if (resolved.status === 'current') heads.push(resolved.record)
  }
  built.proof.answer_state_heads = heads.sort((a, b) => Buffer.from(a.answer_state_id).compare(Buffer.from(b.answer_state_id)))
}
function replaceProofNormativeOptions(built, selections, makeCurrent = false) {
  const proof = built.proof, routes = Object.fromEntries(proof.route_receipts.map(receipt => [receipt.named_human_id, receipt])), vectorBinding = bindingForTransition(proof.transition_id)
  for (const [dependencyId, optionIndex] of Object.entries(selections)) {
    const result = proof.dependency_results.find(value => value.dependency_id === dependencyId), question = buildQuestionForDependency(dependencyId, proof.transition_id), human = question?.named_answer_owner, route = routes[human]
    if (!result || !question || !route || !Number.isInteger(optionIndex) || !question.answer_options[optionIndex]) return false
    const builtReceipt = buildNormativeReceipt(question, question.answer_options[optionIndex], human, human === 'krish' ? 'auth-2' : 'auth-1', null, route, vectorBinding)
    built.evidence[result.evidence_ref] = { kind: 'normative', dependency_id: dependencyId, value: builtReceipt.receipt, question, render: builtReceipt.render, route_receipt: route }
    result.evidence_fingerprint = hashValue(builtReceipt.receipt)
    if (makeCurrent) answerAuthorityService.selectForConformance(routeReceiptRef(route), question.question_id, builtReceipt.receipt.answer_event_ref)
  }
  const reconciled = reconcileNormativeEvidence(proof.transition_id, Object.values(built.evidence).filter(item => item.kind === 'normative'))
  if (reconciled.status !== 'present') return false
  proof.reconciled_decision = reconciled.after
  proof.reconciled_decision_fingerprint = hashValue(reconciled.after)
  proof.reconciled_changed_paths = reconciled.changedPaths
  refreshProofAnswerStateHeads(built)
  proof.proof_fingerprint = fingerprint(proof, 'proof_fingerprint')
  return true
}
function validatePredicate(proof, evidence) {
  if (!finiteJson(proof)) return 'proof_nonfinite'
  if (!finiteJson(evidence) || !evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return 'evidence_store_invalid'
  if (!exactKeys(proof, semantic.predicate_proof_required) || !Array.isArray(proof.dependency_results) || !Array.isArray(proof.answer_state_heads) || !proof.answer_state_heads.every(record => exactKeys(record, interaction.answer_state_record_required))) return 'proof_shape_invalid'
  if (fingerprint(proof, 'proof_fingerprint') !== proof.proof_fingerprint) return 'proof_fingerprint_invalid'
  if (typeof proof.proof_id !== 'string' || proof.proof_id.length === 0) return 'proof_invalid'
  if (typeof proof.transition_id !== 'string' || !transitionById[proof.transition_id]) return 'contract_invalid'
  const authoritativeContext = authoritativeConditionalContext(proof.transition_id), vectorBinding = bindingForTransition(proof.transition_id)
  if (canonical(proof.conditional_context) !== canonical(authoritativeContext)) return 'conditional_context_invalid'
  const expected = requiredDependencyIds(proof.transition_id)
  if (!expected || expected.length === 0) return 'contract_invalid'
  const actual = proof.dependency_results.map(value => value.dependency_id)
  const evidenceRefs = proof.dependency_results.map(value => value.evidence_ref)
  if (!proof.dependency_results.every(value => exactKeys(value, semantic.dependency_result_required)) || !unique(actual) || !unique(evidenceRefs) || !same(byteSorted(actual), expected) || !same(byteSorted(Object.keys(evidence)), byteSorted(evidenceRefs)) || !same(proof.expected_dependency_ids, expected) || proof.expected_dependency_set_seal !== hashValue(expected)) return 'set_mismatch'
  if (proof.subject_id !== vectorBinding.subject_id || proof.case_id !== vectorBinding.case_id || proof.purpose_id !== vectorBinding.purpose_id || !same(proof.permitted_audience, vectorBinding.permitted_audience) || proof.authority_bundle_fingerprint !== authorityBundle) return 'binding_invalid'
  if (acceptedFinalService.isBlocked(proof)) return 'predecessor_challenged'
  const expectedRouteReceipts = transitionById[proof.transition_id].normative_dependencies.length ? issuedRouteReceipts(proof.transition_id) : []
  const sortRoutes = values => [...values].sort((a, b) => Buffer.from(routeReceiptRef(a)).compare(Buffer.from(routeReceiptRef(b))))
  if (!Array.isArray(expectedRouteReceipts) || !Array.isArray(proof.route_receipts) || canonical(sortRoutes(proof.route_receipts)) !== canonical(sortRoutes(expectedRouteReceipts))) return 'route_invalid'
  const validatedNormativeItems = [], validatedAnswerHeads = []
  for (const result of proof.dependency_results) {
    const item = evidence[result.evidence_ref]
    const expectedKind = resolveOwner(result.dependency_id) ? 'profile' : judgementById[result.dependency_id] ? 'normative' : null
    if (!item || !finiteJson(item) || item.kind !== expectedKind || item.dependency_id !== result.dependency_id || !finiteJson(item.value) || hashValue(item.value) !== result.evidence_fingerprint || result.disposition !== 'present') return 'evidence_invalid'
    if (expectedKind === 'profile') {
      if (!item.value || typeof item.value !== 'object' || Array.isArray(item.value) || !item.value.profile) return 'evidence_invalid'
      const profileResult = validateProfile(result.dependency_id, item.value.profile, proof.evaluation_time, item.value.derived_proof, proof.transition_id)
      if (profileResult !== 'valid') { if (process.env.R89_DEBUG) console.error('predicate profile invalid', result.dependency_id, profileResult); return 'evidence_invalid' }
      const profile = item.value.profile
      if (profile.subject_id !== proof.subject_id || profile.case_id !== proof.case_id || profile.purpose_id !== proof.purpose_id || !same(profile.permitted_audience, proof.permitted_audience) || !profile.allowed_uses.includes('predicate_evaluation')) return 'evidence_invalid'
    }
    if (expectedKind === 'normative') {
      if (validateNormative(item.value, proof.evaluation_time, item.question, item.render, vectorBinding, item.route_receipt) !== 'valid') return 'evidence_invalid'
      const answerRef = item.value.answer_event_ref ?? item.value.free_expression_confirmation_ref, resolved = answerAuthorityService.resolve(routeReceiptRef(item.route_receipt), item.question.question_id, answerRef)
      if (resolved.status !== 'current') return 'answer_state_invalid'
      const claimed = proof.answer_state_heads.find(record => record.route_ref === resolved.record.route_ref && record.question_id === resolved.record.question_id)
      if (!claimed || canonical(claimed) !== canonical(resolved.record)) return 'answer_state_invalid'
      validatedAnswerHeads.push(resolved.record)
      validatedNormativeItems.push(item)
    }
  }
  if (!unique(validatedAnswerHeads.map(record => `${record.route_ref}|${record.question_id}`)) || canonical([...proof.answer_state_heads].sort((a, b) => Buffer.from(a.answer_state_id).compare(Buffer.from(b.answer_state_id)))) !== canonical([...validatedAnswerHeads].sort((a, b) => Buffer.from(a.answer_state_id).compare(Buffer.from(b.answer_state_id))))) return 'answer_state_invalid'
  const predecessor = resolveClosedPredecessor(proof.transition_id), beforeRef = predecessor?.decision_ref ?? specimens.case_context.current_decision_ref, before = specimens.decisions[beforeRef]
  if (!before || proof.decision_before_ref !== beforeRef || proof.decision_before_fingerprint !== hashValue(before)) return 'decision_invalid'
  if (proof.transition_id === 'open_new_preparation_after_close') {
    if (!predecessor || proof.decision_before_version !== predecessor.predecessor_version || proof.previous_purpose_id !== predecessor.previous_purpose_id || proof.closed_predecessor_record_ref !== predecessor.record_ref || proof.closed_predecessor_record_fingerprint !== predecessor.record_fingerprint || proof.purpose_id === predecessor.previous_purpose_id) return 'decision_invalid'
  } else if ([proof.decision_before_version, proof.previous_purpose_id, proof.closed_predecessor_record_ref, proof.closed_predecessor_record_fingerprint].some(value => value !== null)) return 'decision_invalid'
  const reconciled = reconcileNormativeEvidence(proof.transition_id, validatedNormativeItems)
  if (reconciled.status === 'contradicted') return 'contradicted'
  if (reconciled.status === 'invalid') return 'decision_invalid'
  const expectedDecision = reconciled.status === 'present' ? reconciled.after : before, expectedChanged = reconciled.status === 'present' ? reconciled.changedPaths : []
  if (canonical(proof.reconciled_decision) !== canonical(expectedDecision) || proof.reconciled_decision_fingerprint !== hashValue(expectedDecision) || !same(proof.reconciled_changed_paths, expectedChanged)) return 'decision_invalid'
  const classes = proof.dependency_results.map(value => semantic.disposition_classes[value.disposition] ?? 'indeterminate')
  let result = 'indeterminate'
  for (const className of semantic.precedence) if (classes.includes(className)) { result = semantic.class_to_result[className]; break }
  return result
}
for (const vector of vectors.predicate_vectors) {
  sessionAuthorityService.resetForConformance()
  answerAuthorityService.resetForConformance()
  acceptedFinalService.resetForConformance()
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
  if (vector.mutation?.op === 'set_normative_options') {
    const vectorBinding = bindingForTransition(vector.transition_id), routes = buildRouteReceipts(vector.transition_id)
    for (const [dependencyId, optionIndex] of Object.entries(vector.mutation.selections)) {
      const result = proof.dependency_results.find(value => value.dependency_id === dependencyId), question = buildQuestionForDependency(dependencyId, vector.transition_id), human = question.named_answer_owner, builtReceipt = buildNormativeReceipt(question, question.answer_options[optionIndex], human, human === 'krish' ? 'auth-2' : 'auth-1', null, routes[human], vectorBinding)
      built.evidence[result.evidence_ref] = { kind: 'normative', dependency_id: dependencyId, value: builtReceipt.receipt, question, render: builtReceipt.render, route_receipt: routes[human] }
      result.evidence_fingerprint = hashValue(builtReceipt.receipt)
      answerAuthorityService.selectForConformance(routeReceiptRef(routes[human]), question.question_id, builtReceipt.receipt.answer_event_ref)
    }
    refreshProofAnswerStateHeads(built)
  }
  if (vector.mutation?.op === 'remove_route_receipts') proof.route_receipts = []
  if (vector.mutation?.op === 'reuse_initial_review_receipt') {
    const dependencyId = 'krish_review_date', result = proof.dependency_results.find(value => value.dependency_id === dependencyId), question = buildQuestionForDependency(dependencyId, 'open_preparation'), routes = buildRouteReceipts('open_preparation'), initialBinding = bindingForTransition('open_preparation'), initial = buildNormativeReceipt(question, question.answer_options[0], 'krish', 'auth-2', null, routes.krish, initialBinding)
    built.evidence[result.evidence_ref] = { kind: 'normative', dependency_id: dependencyId, value: initial.receipt, question, render: initial.render, route_receipt: routes.krish }
    result.evidence_fingerprint = hashValue(initial.receipt)
  }
  if (vector.mutation?.op === 'tamper_derived_source_value') {
    const result = proof.dependency_results.find(value => built.evidence[value.evidence_ref]?.value?.derived_proof), item = built.evidence[result.evidence_ref], source = item.value.derived_proof.input_receipts[0]
    source.value.satisfied = false; source.receipt_fingerprint = fingerprint(source, 'receipt_fingerprint'); item.value.derived_proof.input_set_seal = hashValue(item.value.derived_proof.input_receipts); item.value.derived_proof.proof_fingerprint = fingerprint(item.value.derived_proof, 'proof_fingerprint'); result.evidence_fingerprint = hashValue(item.value)
  }
  if (['tamper_derived_source_issuance_time', 'tamper_derived_source_revocation_epoch', 'tamper_derived_source_member_set'].includes(vector.mutation?.op)) {
    const result = proof.dependency_results.find(value => built.evidence[value.evidence_ref]?.value?.derived_proof), item = built.evidence[result.evidence_ref], source = item.value.derived_proof.input_receipts[0]
    if (vector.mutation.op === 'tamper_derived_source_issuance_time') source.issuance_time = '2026-09-16T07:00:00Z'
    if (vector.mutation.op === 'tamper_derived_source_revocation_epoch') source.revocation_epoch = 'attacker-revocation-epoch'
    if (vector.mutation.op === 'tamper_derived_source_member_set') { source.member_ids = [...source.member_ids, 'attacker-member']; source.set_seal = hashValue(source.member_ids) }
    source.receipt_fingerprint = fingerprint(source, 'receipt_fingerprint'); item.value.derived_proof.input_set_seal = hashValue(item.value.derived_proof.input_receipts); item.value.derived_proof.proof_fingerprint = fingerprint(item.value.derived_proof, 'proof_fingerprint'); result.evidence_fingerprint = hashValue(item.value)
  }
  if (vector.mutation?.op === 'add_unreferenced_normative_evidence') built.evidence['orphan:unsigned-normative'] = { kind: 'normative', dependency_id: 'orphan', value: {}, question: {}, render: {}, route_receipt: {} }
  if (vector.mutation?.op === 'set_free_expression') {
    const dependencyId = vector.mutation.dependency_id, result = proof.dependency_results.find(value => value.dependency_id === dependencyId), question = buildQuestionForDependency(dependencyId, vector.transition_id), human = question.named_answer_owner, routes = buildRouteReceipts(vector.transition_id), vectorBinding = bindingForTransition(vector.transition_id), freeBuilt = buildFreeNormativeReceipt(question, vector.mutation.suffix, human, human === 'krish' ? 'auth-2' : 'auth-1', routes[human], vectorBinding)
    built.evidence[result.evidence_ref] = { kind: 'normative', dependency_id: dependencyId, value: freeBuilt.receipt, question, render: freeBuilt.render, route_receipt: routes[human] }
    result.evidence_fingerprint = hashValue(freeBuilt.receipt)
    answerAuthorityService.selectForConformance(routeReceiptRef(routes[human]), question.question_id, freeBuilt.receipt.free_expression_confirmation_ref)
    refreshProofAnswerStateHeads(built)
  }
  if (vector.mutation?.op === 'set_proof_field') setAt(proof, vector.mutation.path, vector.mutation.value)
  proof.proof_fingerprint = fingerprint(proof, 'proof_fingerprint')
  const predicateResult = validatePredicate(proof, built.evidence)
  checkEq(`predicate vector ${vector.id}`, predicateResult, vector.expected)
}
check('predicate cannot steer', semantic.proof_may_apply_transition === false)
check('predicate validation is pure and never issues resets or commits route authority', !/buildRouteReceipts|\.route\(|resetForConformance|bindToProof/.test(validatePredicate.toString()))
{
  const selections = { leader_accepts_exact_purpose_and_frame_version: 1, krish_accepts_exact_purpose_and_frame_version: 1 }
  sessionAuthorityService.resetForConformance()
  answerAuthorityService.resetForConformance()
  acceptedFinalService.resetForConformance()
  const first = buildPredicateProof('accept_intensive_proof'), competing = clone(first)
  check('competing proof fixture has a second valid decision', replaceProofNormativeOptions(competing, selections))
  check('authoritative current answer wins independent of validation order', validatePredicate(first.proof, first.evidence) === 'satisfied' && validatePredicate(competing.proof, competing.evidence) === 'answer_state_invalid' && validatePredicate(competing.proof, competing.evidence) === 'answer_state_invalid' && validatePredicate(first.proof, first.evidence) === 'satisfied')
  answerAuthorityService.resetForConformance()
  acceptedFinalService.resetForConformance()
  const firstAfterChange = buildPredicateProof('accept_intensive_proof'), competingCurrent = clone(firstAfterChange)
  check('authoritative source can advance to the competing answer', replaceProofNormativeOptions(competingCurrent, selections, true))
  check('new authoritative head wins independent of validation order', validatePredicate(competingCurrent.proof, competingCurrent.evidence) === 'satisfied' && validatePredicate(firstAfterChange.proof, firstAfterChange.evidence) === 'answer_state_invalid' && validatePredicate(firstAfterChange.proof, firstAfterChange.evidence) === 'answer_state_invalid' && validatePredicate(competingCurrent.proof, competingCurrent.evidence) === 'satisfied')
}

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
  if (!finiteJson(graph) || !finiteJson(closure) || !finiteJson(receipts)) return 'correction_nonfinite'
  if (!exactKeys(graph, correction.authoritative_dependency_graph_required) || !Array.isArray(graph.edges) || !graph.edges.every(value => exactKeys(value, correction.edge_required)) || fingerprint(graph, 'graph_fingerprint') !== graph.graph_fingerprint) return 'graph_or_binding_invalid'
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
  checkEq(`correction vector ${vector.id}`, validateCorrection(built.graph, built.closure, built.receipts), vector.expected)
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
    if (!finiteJson(eventTypes) || !Array.isArray(eventTypes) || !eventTypes.every(value => typeof value === 'string') || !['effective', 'test_lease', 'test_consume'].includes(mode) || (mutation !== null && mutation !== undefined && (!finiteJson(mutation) || !exactKeys(mutation, ['event', 'path', 'value']) || typeof mutation.event !== 'string' || !validPath(mutation.path)))) return 'shape_invalid'
    const reservation = clone(specimens.external_reservation), testMode = mode === 'test_lease' || mode === 'test_consume', policies = testMode ? external.test_only_policy_registry : external.authoritative_external_fact_policies
    const requestedProtocol = mode === 'test_consume' ? 'online_conditional_verify_and_consume' : reservation.protocol
    const preferred = policies.find(value => value.protocol === requestedProtocol)
    if (preferred) { reservation.protocol = preferred.protocol; reservation.policy_id = preferred.policy_id }
    const requestIdentity = `${mode}|${reservation.policy_id}|${reservation.idempotency_key}|${reservation.transaction_nonce}`
    const submittedRequestFingerprint = hashValue({ mode, event_types: eventTypes, mutation: mutation ?? null, canonical_request_fingerprint: reservation.canonical_request_fingerprint })
    if (seen.has(requestIdentity) && seen.get(requestIdentity) !== submittedRequestFingerprint) return 'collision'
    if (completed.has(requestIdentity)) return completed.get(requestIdentity).requestFingerprint === submittedRequestFingerprint ? completed.get(requestIdentity).result : 'collision'
    const stagedConsumed = new Set(consumed)
    let state = 'unreserved'
    for (const eventType of eventTypes) {
    const edge = externalTransitionByKey[`${state}|${eventType}`]
    if (!edge) return 'illegal_transition'
    if (edge.guard !== expectedGuardByEvent[eventType]) return 'guard_failed'
    const event = buildExternalEvent(eventType, state, reservation)
    if (mutation?.event === eventType) { if (!setAt(event, mutation.path, mutation.value)) return 'shape_invalid'; event.event_fingerprint = fingerprint(event, 'event_fingerprint') }
    const nullableTerminal = event.terminal_receipt_ref === null || typeof event.terminal_receipt_ref === 'string'
    const eventStrings = external.event_required.filter(field => !['protocol_evidence', 'maximum_clock_skew_seconds', 'terminal_receipt_ref'].includes(field))
    if (!finiteJson(event) || !exactKeys(event, external.event_required) || !eventStrings.every(field => typeof event[field] === 'string' && event[field].length > 0) || !nullableTerminal || fingerprint(event, 'event_fingerprint') !== event.event_fingerprint || event.event_type !== eventType || event.from_state !== state || !Number.isInteger(event.maximum_clock_skew_seconds) || event.maximum_clock_skew_seconds < 0) return 'guard_failed'
    if (!['immutable_lease_still_current', 'conditional_token_consumed'].includes(eventType) && (!exactKeys(event.protocol_evidence, external.ack_evidence_required) || event.protocol_evidence.acknowledged !== true)) return 'guard_failed'
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
      if (event.protocol !== 'online_conditional_verify_and_consume' || !sameReservationBindings(event, reservation, external.second_compare_and_set) || !validateConsumeEvidence(event, reservation) || stagedConsumed.has(consumeKey)) return 'guard_failed'
      stagedConsumed.add(consumeKey)
    }
    if (eventType === 'ack_lost_query_same_token_nonce' && !sameReservationBindings(event, reservation, ['external_identity', 'idempotency_key', 'transaction_nonce', 'canonical_request_fingerprint'])) return 'collision'
    if (['reservation_cancel_or_expire', 'local_commit_failed_release_or_expire', 'authority_mismatch', 'reconciliation_failed'].includes(eventType) && !validateTerminalReceipt(event, edge.to, testMode)) return 'guard_failed'
    state = edge.to
  }
    const result = testMode && state === 'finalized' ? 'test_finalized_non_authoritative' : state
    if (['finalized', 'test_finalized_non_authoritative', 'aborted', 'quarantined'].includes(result)) {
      seen.set(requestIdentity, submittedRequestFingerprint)
      consumed.clear(); for (const key of stagedConsumed) consumed.add(key)
      completed.set(requestIdentity, { requestFingerprint: submittedRequestFingerprint, result })
    }
    return result
  }
  return Object.freeze({ execute, resetForConformance: () => { seen.clear(); consumed.clear(); completed.clear() }, preconsumeForConformance: key => consumed.add(key) })
})()
for (const vector of vectors.external_vectors) {
  externalTransactionService.resetForConformance()
  if (vector.mutation?.op === 'preconsume_external_identity') externalTransactionService.preconsumeForConformance('test-policy-consume|test_external_fact|token-1')
  const mutation = vector.mutation?.op ? null : vector.mutation
  const first = externalTransactionService.execute(vector.events, vector.mode ?? 'effective', mutation)
  let actual = first
  if (vector.mutation?.op === 'double_consume') actual = `${first}|${externalTransactionService.execute(vector.events, vector.mode ?? 'effective', null)}`
  if (vector.mutation?.op === 'changed_bytes_replay') actual = `${first}|${externalTransactionService.execute(vector.events, vector.mode ?? 'effective', { event: 'commit_local_reservation', path: ['canonical_request_fingerprint'], value: '0'.repeat(64) })}`
  if (vector.mutation?.op === 'test_then_effective_replay') actual = `${first}|${externalTransactionService.execute(vector.events, 'effective', null)}`
  if (vector.mutation?.op === 'failed_consume_then_exact_retry') actual = `${first}|${externalTransactionService.execute(vector.events, vector.mode ?? 'effective', null)}`
  check(`external vector ${vector.id}`, actual === vector.expected)
}
check('external effective authority inactive', external.authoritative_external_fact_policies.length === 0 && external.unsupported_external_assertion === 'evidence_only_indeterminate')
check('only finalized steers', external.steering_state === 'finalized')
check('external sharing claim is honestly process-local', external.transaction_registry_contract.cross_consumer_scope === 'single_checker_process_only_no_runtime_or_cross_process_authority_claim')

let totalityProbeCount = 0
function totalityProbe(name, fn) {
  totalityProbeCount += 1
  try { check(`totality ${name}`, fn()) } catch { check(`totality ${name}`, false) }
}
for (const field of trust.authentication_event_required) totalityProbe(`authentication ${field}`, () => { const value = clone(specimens.authentication_events['auth-1']); value[field] = null; return validateAuthentication(value, 'leader-1', '2026-09-16T09:00:00Z') !== 'valid' })
{
  const transitionId = 'continue_after_intensive_proof', question = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value', transitionId), routes = buildRouteReceipts(transitionId), routeReceipt = routes['leader-1'], probeBinding = bindingForTransition(transitionId), render = buildRenderReceipt(question, routeReceipt, probeBinding), event = specimens.answer_events[`answer-${transitionId}-${question.dependency_id}-1`]
  for (const field of trust.answer_event_required) totalityProbe(`answer ${field}`, () => { const value = clone(event); value[field] = null; return validateAnswerEvent(value, 'leader-1', question, render, question.answer_options[0]) === false })
  for (const field of interaction.question_required) totalityProbe(`question ${field}`, () => { const value = clone(question); value[field] = null; return validateQuestion(value, buildSession('empty_session'), buildCaseContext()) !== 'valid' })
  for (const field of interaction.render_receipt_required) totalityProbe(`render ${field}`, () => { const value = clone(render); value[field] = null; return validateRender(value, question) === false })
  const built = buildNormativeReceipt(question, question.answer_options[0], 'leader-1', 'auth-1', null, routeReceipt, probeBinding)
  const selectedAnswerNullable = new Set(['free_expression_ref', 'free_expression_interpretation_ref', 'free_expression_interpretation_render_ref', 'free_expression_confirmation_ref'])
  for (const field of trust.normative_receipt_required) {
    if (selectedAnswerNullable.has(field)) continue
    totalityProbe(`normative ${field}`, () => { const value = clone(built.receipt); value[field] = null; if (field !== 'receipt_fingerprint') value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint'); return validateNormative(value, '2026-09-16T09:00:00Z', question, built.render, probeBinding, routeReceipt) !== 'valid' })
  }
}
{
  sessionAuthorityService.resetForConformance()
  const finalPredicate = buildPredicateProof('accept_intensive_proof'), finalBuilt = buildFinalReceipt('accept_intensive_proof', finalPredicate.proof), receipt = finalBuilt.receipt
  for (const field of trust.final_receipt_required) totalityProbe(`final receipt ${field}`, () => { const value = clone(receipt); value[field] = null; if (field !== 'authority_receipt_fingerprint') value.authority_receipt_fingerprint = fingerprint(value, 'authority_receipt_fingerprint'); return validateFinal(value, finalPredicate.proof, finalPredicate.evidence, finalBuilt.render) !== 'valid' })
  for (const field of trust.final_authority_event_required) totalityProbe(`final authority event ${field}`, () => { const proof = receipt.authority_proofs[0], value = clone(specimens.final_authority_events[proof.authority_event_ref]); value[field] = null; return validateFinalAuthorityEvent(value, proof, receipt) === false })
}
{
  const built = buildPredicateProof('open_new_preparation_after_close')
  for (const field of semantic.predicate_proof_required) totalityProbe(`predicate ${field}`, () => { const value = clone(built.proof); value[field] = null; if (field !== 'proof_fingerprint') value.proof_fingerprint = fingerprint(value, 'proof_fingerprint'); return validatePredicate(value, built.evidence) !== 'satisfied' })
}
{
  const built = buildCorrection('graph-9')
  for (const field of correction.authoritative_dependency_graph_required) totalityProbe(`correction graph ${field}`, () => { const value = clone(built.graph); value[field] = null; if (field !== 'graph_fingerprint') value.graph_fingerprint = fingerprint(value, 'graph_fingerprint'); return validateCorrection(value, built.closure, built.receipts) !== 'complete' })
  for (const field of correction.sealed_closure_required) totalityProbe(`correction closure ${field}`, () => { const value = clone(built.closure); value[field] = null; if (field !== 'dependency_set_seal') value.dependency_set_seal = fingerprint(value, 'dependency_set_seal'); return validateCorrection(built.graph, value, built.receipts) !== 'complete' })
  for (const field of correction.repair_receipt_required) totalityProbe(`correction receipt ${field}`, () => { const receipts = clone(built.receipts); receipts[0][field] = null; if (field !== 'receipt_fingerprint') receipts[0].receipt_fingerprint = fingerprint(receipts[0], 'receipt_fingerprint'); return validateCorrection(built.graph, built.closure, receipts) !== 'complete' })
}

// Whole-tuple hostile values prove each public validator rejects malformed companion
// arguments without throwing. These are intentionally not JSON fixtures because cyclic,
// accessor-backed and sparse values cannot be represented in the executable vector file.
{
  const cyclic = {}; cyclic.self = cyclic
  const accessor = {}; Object.defineProperty(accessor, 'value', { enumerable: true, get() { throw new Error('accessor evaluated') } })
  const sparse = new Array(2); sparse[1] = 'present'
  const hostile = [['null', null], ['cyclic', cyclic], ['accessor', accessor], ['sparse', sparse]]
  const transitionId = 'continue_after_intensive_proof', question = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value', transitionId), routes = buildRouteReceipts(transitionId), routeReceipt = routes['leader-1'], probeBinding = bindingForTransition(transitionId), render = buildRenderReceipt(question, routeReceipt, probeBinding), normative = buildNormativeReceipt(question, question.answer_options[0], 'leader-1', 'auth-1', null, routeReceipt, probeBinding)
  const profile = buildProfile('no_active_lifecycle_row'), derivedProfile = buildProfile('checkpoint_integrity_valid'), derivedProof = buildDerivedProof('checkpoint_integrity_valid', derivedProfile)
  const predicate = buildPredicateProof('accept_intensive_proof'), finalBuilt = buildFinalReceipt('accept_intensive_proof', predicate.proof), correctionBuilt = buildCorrection('graph-9')
  const interpretation = specimens.structured_interpretations['interpretation-1'], interpretationRender = specimens.free_expression_renders['interpretation-render-1'], confirmation = specimens.free_expression_confirmations['confirm-1']
  const validators = [
    ['authentication event', bad => validateAuthentication(bad, 'leader-1', '2026-09-16T09:00:00Z') !== 'valid'],
    ['answer event', bad => validateAnswerEvent(bad, 'leader-1', question, render, question.answer_options[0]) === false],
    ['answer question companion', bad => validateAnswerEvent(specimens.answer_events[`answer-${transitionId}-${question.dependency_id}-1`], 'leader-1', bad, render, question.answer_options[0]) === false],
    ['free confirmation event', bad => validateFreeConfirmation(bad, normative.receipt, question, render, interpretation, interpretationRender) === false],
    ['free confirmation receipt companion', bad => validateFreeConfirmation(confirmation, bad, question, render, interpretation, interpretationRender) === false],
    ['profile', bad => validateProfile('no_active_lifecycle_row', bad, '2026-09-16T09:00:00Z') !== 'valid'],
    ['derived proof companion', bad => validateProfile('checkpoint_integrity_valid', derivedProfile, '2026-09-16T09:00:00Z', bad) !== 'valid'],
    ['profile transition companion', bad => validateProfile('no_active_lifecycle_row', profile, '2026-09-16T09:00:00Z', null, bad) !== 'valid'],
    ['question', bad => validateQuestion(bad, buildSession('empty_session'), buildCaseContext()) !== 'valid'],
    ['question decision store companion', bad => validateQuestion(question, buildSession('empty_session'), buildCaseContext(), bad) !== 'valid'],
    ['render', bad => validateRender(bad, question) === false],
    ['render question companion', bad => validateRender(render, bad) === false],
    ['normative receipt', bad => validateNormative(bad, '2026-09-16T09:00:00Z', question, render, probeBinding, routeReceipt) !== 'valid'],
    ['normative binding companion', bad => validateNormative(normative.receipt, '2026-09-16T09:00:00Z', question, render, bad, routeReceipt) !== 'valid'],
    ['normative route companion', bad => validateNormative(normative.receipt, '2026-09-16T09:00:00Z', question, render, probeBinding, bad) !== 'valid'],
    ['final receipt', bad => validateFinal(bad, predicate.proof, predicate.evidence, finalBuilt.render) !== 'valid'],
    ['final predicate companion', bad => validateFinal(finalBuilt.receipt, bad, predicate.evidence, finalBuilt.render) !== 'valid'],
    ['final evidence companion', bad => validateFinal(finalBuilt.receipt, predicate.proof, bad, finalBuilt.render) !== 'valid'],
    ['final render companion', bad => validateFinal(finalBuilt.receipt, predicate.proof, predicate.evidence, bad) !== 'valid'],
    ['final authority store companion', bad => validateFinal(finalBuilt.receipt, predicate.proof, predicate.evidence, finalBuilt.render, bad) !== 'valid'],
    ['predicate proof', bad => validatePredicate(bad, predicate.evidence) !== 'satisfied'],
    ['predicate evidence store companion', bad => validatePredicate(predicate.proof, bad) !== 'satisfied'],
    ['correction graph', bad => validateCorrection(bad, correctionBuilt.closure, correctionBuilt.receipts) !== 'complete'],
    ['correction closure companion', bad => validateCorrection(correctionBuilt.graph, bad, correctionBuilt.receipts) !== 'complete'],
    ['correction receipt store companion', bad => validateCorrection(correctionBuilt.graph, correctionBuilt.closure, bad) !== 'complete']
  ]
  for (const [validatorName, validator] of validators) for (const [hostileName, hostileValue] of hostile) totalityProbe(`${validatorName} rejects ${hostileName}`, () => validator(hostileValue))
  totalityProbe('external malformed whole mutation', () => externalTransactionService.execute(['commit_local_reservation'], 'test_lease', { event: 'commit_local_reservation', path: null, value: 0 }) === 'shape_invalid')
  totalityProbe('external malformed event sequence companion', () => externalTransactionService.execute(sparse, 'test_lease', null) === 'shape_invalid')
  totalityProbe('external malformed mode companion', () => externalTransactionService.execute(['commit_local_reservation'], accessor, null) === 'shape_invalid')
  check('direct profile fixture remains valid after hostile probes', validateProfile('no_active_lifecycle_row', profile, '2026-09-16T09:00:00Z') === 'valid')
  check('derived profile fixture remains valid after hostile probes', validateProfile('checkpoint_integrity_valid', derivedProfile, '2026-09-16T09:00:00Z', derivedProof) === 'valid')
}

const vectorGroups = ['authentication_vectors', 'semantic_profile_vectors', 'normative_vectors', 'final_authority_vectors', 'predicate_vectors', 'question_vectors', 'routing_vectors', 'answer_state_vectors', 'correction_vectors', 'external_vectors']
const vectorIds = vectorGroups.flatMap(group => vectors[group].map(value => value.id))
check('all vector IDs globally unique', unique(vectorIds))
const transitionIds = imports.transition_catalogue.map(value => value.id)
const predicatePositiveIds = vectors.predicate_vectors.filter(value => value.mutation === null && value.expected === 'satisfied').map(value => value.transition_id)
const finalPositiveIds = vectors.final_authority_vectors.filter(value => value.mutation === null && value.expected === 'valid').map(value => value.transition_id)
check('predicate positives cover every transition exactly once', unique(predicatePositiveIds) && same(byteSorted(predicatePositiveIds), byteSorted(transitionIds)))
check('final positives cover every transition exactly once', unique(finalPositiveIds) && same(byteSorted(finalPositiveIds), byteSorted(transitionIds)))
for (const transition of imports.transition_catalogue) {
  sessionAuthorityService.resetForConformance()
  const built = buildPredicateProof(transition.id), render = buildFinalDecisionRender(built.proof), expectedEffect = transitionEffect(transition.id)
  check(`final render exposes exact lifecycle effect ${transition.id}`, exactKeys(render.transition_effect, interaction.transition_effect_required) && canonical(render.transition_effect) === canonical(expectedEffect) && render.displayed_consequence_text.startsWith(expectedEffect.plain_language_action))
  if (transition.to === 'paused' || transition.to === 'closing' || transition.to === 'closed') check(`pause or close copy cannot imply unchanged direction ${transition.id}`, !render.displayed_consequence_text.includes('kept the current direction'))
}
{
  const initial = buildQuestionForDependency('krish_review_date', 'open_preparation'), reopened = buildQuestionForDependency('krish_review_date', 'open_new_preparation_after_close')
  const reopenedRoutes = buildRouteReceipts('open_new_preparation_after_close'), reopenedBinding = bindingForTransition('open_new_preparation_after_close'), reopenedReceipt = buildNormativeReceipt(reopened, reopened.answer_options[0], 'krish', 'auth-2', null, reopenedRoutes.krish, reopenedBinding).receipt
  check('reopen review is a fresh transition-specific question', initial.question_id !== reopened.question_id && initial.transition_id !== reopened.transition_id)
  check('reopen review is issued strictly after close', Date.parse(reopenedReceipt.issued_at) > Date.parse('2026-09-16T08:40:00Z'))
}
check('mandatory vector bodies pinned', hashValue(Object.fromEntries(vectorGroups.map(group => [group, vectors[group]]))) === '6090f07c4506c8fca0ba7f41c67d4b8ca472dc115ce01d9a2f9d570102c30d5f')
if (process.argv.includes('--dump-signing-payloads')) {
  const answerEvents = {}, finalAuthorityEvents = {}, finalDecisionRenders = {}
  for (const transition of imports.transition_catalogue) {
    if (transition.normative_dependencies.length) {
      const routes = buildRouteReceipts(transition.id), eventBinding = bindingForTransition(transition.id)
      for (const dependencyId of transition.normative_dependencies) {
        const question = buildQuestionForDependency(dependencyId, transition.id), human = question.named_answer_owner, routeReceipt = routes[human], render = buildRenderReceipt(question, routeReceipt, eventBinding), auth = specimens.authentication_events[human === 'krish' ? 'auth-2' : 'auth-1']
        for (const [index, option] of question.answer_options.entries()) {
          const event = { event_id: `answer-${transition.id}-${dependencyId}-${index + 1}`, named_human_id: human, credential_id: auth.credential_id, session_id: auth.session_id, method: auth.method, issuer_id: auth.issuer_id, question_id: question.question_id, question_version: question.question_version, selected_option: option, render_receipt_fingerprint: render.receipt_fingerprint, answered_at: transition.id === 'open_new_preparation_after_close' ? '2026-09-16T08:45:00Z' : '2026-09-16T08:32:00Z' }
          answerEvents[event.event_id] = event
        }
      }
    }
    const proof = buildPredicateProof(transition.id).proof, finalBuilt = buildFinalReceipt(transition.id, proof), receipt = finalBuilt.receipt
    finalDecisionRenders[transition.id] = finalBuilt.render
    for (const authorityProof of receipt.authority_proofs) {
      const auth = specimens.authentication_events[authorityProof.authentication_event_ref]
      finalAuthorityEvents[authorityProof.authority_event_ref] = { event_id: authorityProof.authority_event_ref, named_human_id: authorityProof.named_human_id, credential_id: auth.credential_id, session_id: auth.session_id, method: auth.method, issuer_id: auth.issuer_id, transition_id: receipt.transition_id, subject_id: receipt.subject_id, case_id: receipt.case_id, purpose_id: receipt.purpose_id, permitted_audience: receipt.permitted_audience, predecessor_version: receipt.predecessor_version, predicate_proof_fingerprint: receipt.predicate_proof_fingerprint, reconciled_decision_fingerprint: receipt.reconciled_decision_fingerprint, final_render_fingerprint: receipt.final_render_fingerprint, authority_bundle_fingerprint: receipt.authority_bundle_fingerprint, render_receipt_ref: receipt.render_receipt_ref, visible_consequence_fingerprint: receipt.visible_consequence_fingerprint, reserved_transition_receipt_version: receipt.reserved_transition_receipt_version, authorized_at: '2026-09-16T08:55:00Z' }
    }
  }
  const referenceQuestion = buildQuestionForDependency('leader_next_consequential_decision_or_evidenced_value', 'continue_after_intensive_proof'), referenceRoutes = buildRouteReceipts('continue_after_intensive_proof'), referenceBinding = bindingForTransition('continue_after_intensive_proof'), referenceRender = buildRenderReceipt(referenceQuestion, referenceRoutes['leader-1'], referenceBinding)
  console.log(JSON.stringify({ authorityBundle, answerEvents, finalAuthorityEvents, finalDecisionRenders, referenceQuestion, referenceRender }))
  process.exit(0)
}
if (failures.length) {
  console.error(`R89 independent conformance failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`ok: R89 end-to-end bound contract; ${imports.transition_catalogue.length}/13 predicate and final transition paths; ${vectorGroups.reduce((sum, group) => sum + vectors[group].length, 0)} executable vectors; ${totalityProbeCount} generated totality probes`)
