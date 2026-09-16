import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r80'
const sourceFiles = ['01-effective-resolution.json', '02-owner-registry.json', '03-authority-binding-program.json', '04-interaction-program.json', '05-predicate-program.json', '06-correction-program.json', '07-external-program.json', '08-executable-vectors.json']
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sorted = values => [...values].sort((a, b) => Buffer.from(a).compare(Buffer.from(b)))
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

const modules = Object.fromEntries(sourceFiles.map(file => { const value = readJson(`${directory}/${file}`); return [value.module_id, value] }))
const resolution = modules.effective_resolution
const owners = modules.owner_registry
const authority = modules.authority_binding_program
const interaction = modules.interaction_program
const predicate = modules.predicate_program
const correction = modules.correction_program
const external = modules.external_program
const vectors = modules.executable_vectors
const specimens = vectors.specimens

const expectedClosed = ['semantic evaluator implementation', 'result-producing lifecycle success branch', 'runtime integration or live registry wiring', 'database schema migration or production data change', 'customer-facing UI', 'external research model spend email or service mutation', 'merge deployment release or production promotion', 'legacy backend deletion', 'cross-venture Supabase decision-ledger write']
const expectedImports = [
  ['lineage', 'project-documentation/ctrl-evolution/g24-predicate-authority-r79/01-lineage-and-owner-policy.json', '/lineage', '5df59b9962d03cb22525d8684e91c3083fd931dd'],
  ['semantic_profile_schema', 'project-documentation/ctrl-evolution/g24-predicate-authority-r79/02-closed-schemas.json', '/schemas/semantic_profile', '18cc3242c843f6c32d7fbaad5f3f372a0ecfbf83'],
  ['accepted_decision_state_schema', 'project-documentation/ctrl-evolution/g24-predicate-authority-r79/02-closed-schemas.json', '/schemas/accepted_decision_state', '18cc3242c843f6c32d7fbaad5f3f372a0ecfbf83'],
  ['external_authority_proof_schema', 'project-documentation/ctrl-evolution/g24-predicate-authority-r79/02-closed-schemas.json', '/schemas/external_authority_proof', '18cc3242c843f6c32d7fbaad5f3f372a0ecfbf83'],
  ['transition_catalogue', 'project-documentation/ctrl-evolution/g24-predicate-authority-r79/03-transition-catalogue.json', '/transitions', 'af0325c67d59e108db7d5e08e2a3fb27401ebf9f'],
  ['atomic_judgement_registry', 'project-documentation/ctrl-evolution/g24-predicate-authority-r79/05-human-interaction-contract.json', '/atomic_judgement_registry', '1bf0bba015a13041dc6779253a71e7afb7470e49']
]
check('eight unique source modules', Object.keys(modules).length === 8 && unique(Object.keys(modules)))
check('R79 semantic base exact', same(resolution.semantic_base, { commit: 'ad64b1eb1b29b2b1a71c9917ae33b19da3c68417', tree: '22f57555d04cb73e3287397f0bc738e701663ebb', standing: 'vetoed_source_material_not_effective_authority' }))
check('R79 tree independently resolved', git(['rev-parse', 'ad64b1eb1b29b2b1a71c9917ae33b19da3c68417^{tree}']) === resolution.semantic_base.tree)
check('exact import catalogue', same(resolution.imported_exact_sections.map(x => [x.effective_section, x.path, x.json_pointer]), expectedImports.map(x => x.slice(0, 3))))
for (const [, path, , blob] of expectedImports) check(`exact frozen blob ${path}`, git(['rev-parse', `${resolution.semantic_base.commit}:${path}`]) === blob)
check('single coherent inheritance rule', resolution.inheritance_rule === 'only_imported_exact_sections_are_effective_no_other_r78_or_r79_semantic_rule_is_inherited' && resolution.unknown_or_conflicting_section === 'reject_contract')
check('authority closure exact', same(resolution.authority_still_closed, expectedClosed))

const imported = Object.fromEntries(resolution.imported_exact_sections.map(record => [record.effective_section, pointer(gitJson(resolution.semantic_base.commit, record.path), record.json_pointer)]))
const expectedEffective = { schema_version: 'ctrl.g24.predicate-authority.r80.effective-contract.v1', ...imported, owner_registry: owners, authority_binding_program: authority, interaction_program: interaction, predicate_program: predicate, correction_program: correction, external_program: external, executable_vectors: vectors, authority_still_closed: expectedClosed }
const effectiveBytes = readFileSync(join(root, `${directory}/09-effective-contract.json`))
check('effective contract independently assembled byte exact', effectiveBytes.toString('utf8') === `${canonical(expectedEffective)}\n`)
const manifest = readJson(`${directory}/00-manifest.json`)
const records = sourceFiles.map(file => { const path = `${directory}/${file}`; const bytes = readFileSync(join(root, path)); const value = JSON.parse(bytes); return { path, module_id: value.module_id, schema_version: value.schema_version, bytes: bytes.length, sha256: sha256(bytes) } })
check('manifest module records exact', canonical(manifest.modules) === canonical(records))
check('manifest effective bytes exact', canonical(manifest.effective_contract) === canonical({ path: `${directory}/09-effective-contract.json`, bytes: effectiveBytes.length, sha256: sha256(effectiveBytes) }))
const manifestNoFingerprint = { ...manifest }; delete manifestNoFingerprint.bundle_fingerprint
check('manifest full fingerprint exact', manifest.bundle_fingerprint === sha256(`${canonical(manifestNoFingerprint)}\n`))
check('manifest authority closed', same(manifest.authority_still_closed, expectedClosed) && manifest.standing === 'coherent_local_contract_candidate_no_runtime_authority')

const transitionServerIds = [...new Set(imported.transition_catalogue.flatMap(value => value.server_dependencies))]
check('owner registry exact totality', unique(owners.records.map(x => x.dependency_id)) && same(sorted(owners.records.map(x => x.dependency_id)), sorted(transitionServerIds)))
check('owner policy locked', owners.registry_version === 'ctrl.g24.r80.internal-owner-registry.v1' && owners.policy_rules.runtime_owner_substitution === 'reject' && owners.policy_rules.unregistered_dependency === 'indeterminate')
function profileFor(record, overrides = {}) {
  return { fact_kind: record.fact_kind, speaker_or_issuer: record.canonical_owner, source_type: record.source_type, issuer_fact_kind_rule: record.issuer_fact_kind_rule, authority_policy_version: owners.registry_version, ...overrides }
}
function validateOwner(dependencyId, profile) {
  const record = owners.records.find(x => x.dependency_id === dependencyId)
  if (!record) return 'unregistered_dependency'
  return profile.fact_kind === record.fact_kind && profile.speaker_or_issuer === record.canonical_owner && profile.source_type === record.source_type && profile.issuer_fact_kind_rule === record.issuer_fact_kind_rule && profile.authority_policy_version === owners.registry_version ? 'valid' : 'owner_policy_mismatch'
}
for (const vector of vectors.owner_vectors) { const record = owners.records.find(x => x.dependency_id === vector.dependency_id); check(`owner vector ${vector.id}`, validateOwner(vector.dependency_id, profileFor(record, vector.profile_overrides)) === vector.expected) }

const requiredKeysExact = (value, required) => value && typeof value === 'object' && !Array.isArray(value) && same(sorted(Object.keys(value)), sorted(required))
function validAuthentication(event, expectedHuman, expectedFingerprint, at) {
  if (!event || !requiredKeysExact(event, authority.schemas.authentication_event.required)) return false
  if (!authority.schemas.authentication_event.allowed_methods.includes(event.method) || event.named_human_id !== expectedHuman || event.event_fingerprint !== expectedFingerprint) return false
  return fingerprint(event, 'event_fingerprint') === event.event_fingerprint && Date.parse(event.issued_at) <= Date.parse(at) && Date.parse(at) < Date.parse(event.valid_until)
}
function mutateReceipt(base, mutation) {
  const value = clone(base)
  if (!mutation) return value
  if (mutation.op === 'replace') setAt(value, mutation.path, mutation.value)
  if (mutation.op === 'recompute_consequence_fingerprint') {
    value.visible_consequence_fingerprint = hashValue(value.displayed_consequence_text)
  }
  if (mutation.op === 'free_expression_fake_confirmation' || mutation.op === 'free_expression_valid_confirmation') {
    value.answer_status = 'free_expression_confirmed'; value.free_expression_ref = 'free-1'; value.free_expression_confirmation_ref = 'confirm-1'
    if (mutation.op === 'free_expression_fake_confirmation') value.free_expression_confirmation_ref = 'fake-confirmation'
  }
  if (Object.hasOwn(value, 'receipt_fingerprint')) value.receipt_fingerprint = fingerprint(value, 'receipt_fingerprint')
  if (Object.hasOwn(value, 'authority_receipt_fingerprint')) value.authority_receipt_fingerprint = fingerprint(value, 'authority_receipt_fingerprint')
  return value
}
const decisionMaterialPaths = imported.accepted_decision_state_schema.material_paths
function validateNormative(receipt) {
  const schema = authority.schemas.normative_attestation_receipt
  if (!requiredKeysExact(receipt, schema.required)) return 'receipt_shape_invalid'
  if (fingerprint(receipt, 'receipt_fingerprint') !== receipt.receipt_fingerprint) return 'receipt_fingerprint_invalid'
  if (!schema.answer_status_values.includes(receipt.answer_status)) return 'answer_status_invalid'
  const event = specimens.authentication_events[receipt.authentication_event_ref]
  if (!validAuthentication(event, receipt.named_human_id, receipt.authentication_event_fingerprint, receipt.issued_at)) return 'actor_authentication_invalid'
  const before = specimens.decisions[receipt.accepted_decision_before_ref], after = specimens.decisions[receipt.accepted_decision_after_ref]
  if (!before || !after || hashValue(before) !== receipt.accepted_decision_before_fingerprint || hashValue(after) !== receipt.accepted_decision_after_fingerprint) return 'decision_fingerprint_or_delta_mismatch'
  if (before.case_id !== after.case_id || before.decision_id !== after.decision_id || receipt.case_id !== before.case_id) return 'decision_fingerprint_or_delta_mismatch'
  const changed = sorted(decisionMaterialPaths.filter(path => !same(before[path], after[path])))
  if (changed.length === 0 || !same(changed, sorted(receipt.accepted_decision_changed_paths))) return 'decision_fingerprint_or_delta_mismatch'
  if (hashValue(receipt.displayed_consequence_text) !== receipt.visible_consequence_fingerprint) return 'consequence_fingerprint_mismatch'
  if (!(Date.parse(receipt.issued_at) < Date.parse(receipt.valid_until))) return 'authority_expired'
  if (receipt.answer_status === 'free_expression_confirmed') {
    const confirmation = specimens.free_expression_confirmations[receipt.free_expression_confirmation_ref]
    const text = specimens.free_expressions[receipt.free_expression_ref], interpretation = specimens.structured_interpretations[receipt.free_expression_ref]
    if (!confirmation || !text || !interpretation || !requiredKeysExact(confirmation, authority.schemas.free_expression_confirmation.required) || fingerprint(confirmation, 'confirmation_fingerprint') !== confirmation.confirmation_fingerprint || confirmation.named_human_id !== receipt.named_human_id || confirmation.authentication_event_ref !== receipt.authentication_event_ref || confirmation.free_expression_fingerprint !== hashValue(text) || confirmation.structured_interpretation_fingerprint !== hashValue(interpretation) || confirmation.visible_consequence_fingerprint !== receipt.visible_consequence_fingerprint || interpretation.answer_value !== receipt.structured_answer_value || interpretation.accepted_decision_after_ref !== receipt.accepted_decision_after_ref || !validAuthentication(event, receipt.named_human_id, receipt.authentication_event_fingerprint, confirmation.confirmed_at)) return 'free_expression_confirmation_invalid'
  }
  return 'valid'
}
const roleIds = { named_leader: 'leader-1', krish: 'krish', named_leader_via_krish_record: 'leader-1' }
function validateFinal(receipt) {
  const schema = authority.schemas.final_transition_authority_receipt
  if (!requiredKeysExact(receipt, schema.required)) return 'receipt_shape_invalid'
  if (fingerprint(receipt, 'authority_receipt_fingerprint') !== receipt.authority_receipt_fingerprint) return 'receipt_fingerprint_invalid'
  const transition = imported.transition_catalogue.find(x => x.id === receipt.transition_id)
  if (!transition) return 'authority_actor_or_authentication_invalid'
  const proofs = receipt.authority_proofs
  if (!Array.isArray(proofs) || !proofs.every(proof => requiredKeysExact(proof, schema.authority_proof_required))) return 'authority_actor_or_authentication_invalid'
  const allowed = transition.final_authority.actor_roles.map(role => roleIds[role])
  const actual = proofs.map(x => x.named_human_id)
  const actorSetValid = transition.final_authority.cardinality === 'all' ? same(sorted(actual), sorted(allowed)) : actual.length === 1 && allowed.includes(actual[0])
  if (!actorSetValid || !unique(actual) || !proofs.every(proof => validAuthentication(specimens.authentication_events[proof.authentication_event_ref], proof.named_human_id, proof.authentication_event_fingerprint, receipt.server_commit_time))) return 'authority_actor_or_authentication_invalid'
  if (hashValue(receipt.displayed_consequence_text) !== receipt.visible_consequence_fingerprint) return 'consequence_fingerprint_mismatch'
  if (!(Date.parse(receipt.server_commit_time) < Date.parse(receipt.valid_until))) return 'authority_expired'
  return 'valid'
}
for (const vector of vectors.authority_vectors) {
  const receipt = mutateReceipt(specimens[vector.specimen], vector.mutation)
  const actual = vector.kind === 'normative' ? validateNormative(receipt) : validateFinal(receipt)
  check(`authority vector ${vector.id}`, actual === vector.expected)
}

const judgementById = Object.fromEntries(imported.atomic_judgement_registry.map(value => [value.dependency_id, value]))
const ownerById = Object.fromEntries(owners.records.map(value => [value.dependency_id, value]))
function route(unresolved, alreadyAsked) {
  if (!unresolved.every(value => requiredKeysExact(value, interaction.unresolved_dependency_schema.required))) return 'dependency_shape_invalid'
  for (const value of unresolved) {
    const human = judgementById[value.dependency_id], server = ownerById[value.dependency_id]
    if (!human && !server) return 'reject_unknown_dependency'
    if (server) {
      if (value.resolution_owner !== 'server_verify_only') return 'dependency_owner_or_kind_mismatch'
      continue
    }
    if (value.resolution_owner !== 'human_answerable' || value.named_human_id !== roleIds[human.owner_role] || value.requested_value_kind !== human.judgement_kind) return 'dependency_owner_or_kind_mismatch'
  }
  if (unresolved.some(value => ownerById[value.dependency_id])) return 'system_or_krish_zero_questions'
  const atomicFacts = new Set(unresolved.map(value => `${value.case_id}:${value.decision_id}:${value.named_human_id}:${value.dependency_id}`))
  if (atomicFacts.size === 0) return 'no_customer_question'
  if (alreadyAsked) return 'safe_hold_no_automatic_followup'
  return atomicFacts.size === 1 ? 'one_question_candidate' : 'safe_hold_or_krish_led_session'
}
for (const vector of vectors.routing_vectors) check(`routing vector ${vector.id}`, route(vector.unresolved, vector.question_already_asked) === vector.expected)

function mutateQuestion(mutation) {
  const question = clone(specimens.question), decisions = clone(specimens.decisions)
  if (!mutation) return { question, decisions }
  if (mutation.op === 'replace') setAt(question, mutation.path, mutation.value)
  if (mutation.op === 'repeat_question') question.question = Array(mutation.count).fill(question.question).join(' ')
  if (mutation.op === 'replace_effect_case') decisions[mutation.effect].case_id = mutation.value
  return { question, decisions }
}
function validateQuestion(question, decisions) {
  const schema = interaction.question_payload_schema
  if (!requiredKeysExact(question, schema.required)) return 'question_shape_invalid'
  const registry = judgementById[question.dependency_id]
  if (!registry || roleIds[registry.owner_role] !== question.named_answer_owner || registry.judgement_kind !== question.requested_value_kind) return 'dependency_invalid'
  const lengthFields = schema.maximum_lengths
  if (Object.entries(lengthFields).some(([field, max]) => typeof question[field] !== 'string' || question[field].length > max) || !Array.isArray(question.answer_options) || question.answer_options.length > schema.maximum_answer_options || !unique(question.answer_options)) return 'copy_budget_exceeded'
  if (!question.case_specific_terms.some(term => typeof term === 'string' && term.length > 0 && question.question.toLocaleLowerCase().includes(term.toLocaleLowerCase()))) return 'case_specificity_missing'
  const before = decisions.before
  if (question.case_id !== before.case_id || question.decision_id !== before.decision_id) return 'effect_invalid'
  for (const option of question.answer_options) {
    const ref = question.answer_effect_refs[option], after = decisions[ref]
    if (!ref || !after || after.case_id !== before.case_id || after.decision_id !== before.decision_id || decisionMaterialPaths.filter(path => !same(before[path], after[path])).length === 0) return 'effect_invalid'
  }
  if (Object.hasOwn(question.answer_effect_refs, question.unknown_option) || Object.hasOwn(question.answer_effect_refs, question.free_expression_option) || Object.hasOwn(question, 'automatic_next_question')) return 'effect_invalid'
  return 'valid'
}
for (const vector of vectors.question_vectors) { const { question, decisions } = mutateQuestion(vector.mutation); check(`question vector ${vector.id}`, validateQuestion(question, decisions) === vector.expected) }
check('default surface is one clear interaction', same(interaction.default_surface, { heading_count: 1, question_count: 1, answer_control_group_count: 1, optional_note_count: 1, primary_action_count: 1, automatic_follow_up_count: 0, technical_label_count: 0 }))

function evaluatePredicate(program, dispositions) {
  if (!Array.isArray(dispositions) || dispositions.length === 0) return program.empty_required_dependency_set
  const classes = dispositions.map(value => program.disposition_classes[value] ?? program.unknown_disposition)
  for (const className of program.precedence) if (classes.includes(className)) return program.class_to_result[className]
  return program.unknown_disposition
}
for (const vector of vectors.predicate_vectors) check(`predicate vector ${vector.id}`, evaluatePredicate(predicate, vector.dispositions) === vector.expected)
for (const mutation of vectors.predicate_program_mutations) {
  const changed = clone(predicate); setAt(changed, mutation.path, mutation.value)
  check(`predicate mutation ${mutation.id}`, vectors.predicate_vectors.some(vector => evaluatePredicate(changed, vector.dispositions) !== vector.expected))
}
check('predicate evaluator cannot steer', predicate.proof_may_apply_transition === false && predicate.empty_required_dependency_set === 'reject_contract' && predicate.unknown_disposition === 'indeterminate')

const tupleKey = value => `${value.dependency_id}|${value.dependency_fingerprint}|${value.edge_kind}`
function repairSeal(graph) {
  const members = [...graph.members].sort((a, b) => Buffer.from(tupleKey(a)).compare(Buffer.from(tupleKey(b))))
  return hashValue({ domain_separator: correction.seal_program.domain_separator, graph_head: graph.graph_head, graph_epoch: graph.graph_epoch, members })
}
function mutateRepair(mutation) {
  const graph = clone(specimens.repair_graph), receipts = clone(specimens.repair_receipts)
  if (!mutation) return { graph, receipts }
  if (mutation.op === 'replace') setAt({ graph, receipts }, mutation.path, mutation.value)
  if (mutation.op === 'remove_member') graph.members = graph.members.filter(x => x.dependency_id !== mutation.dependency_id)
  if (mutation.op === 'duplicate_receipt') receipts.push(clone(receipts.find(x => x.dependency_id === mutation.dependency_id)))
  if (mutation.op === 'swap_member_fingerprints') {
    const left = graph.members.find(x => x.dependency_id === mutation.left), right = graph.members.find(x => x.dependency_id === mutation.right)
    ;[left.dependency_fingerprint, right.dependency_fingerprint] = [right.dependency_fingerprint, left.dependency_fingerprint]
  }
  return { graph, receipts }
}
function validateRepair(graph, receipts) {
  if (!requiredKeysExact(graph, correction.graph_schema.required) || !graph.members.every(member => requiredKeysExact(member, correction.graph_schema.member_required))) return 'graph_shape_invalid'
  const memberKeys = graph.members.map(tupleKey)
  if (!same(sorted([...new Set(graph.members.map(x => x.edge_kind))]), sorted(correction.graph_schema.edge_kind_values)) || !unique(memberKeys)) return 'edge_kind_or_membership_incomplete'
  if (repairSeal(graph) !== graph.dependency_set_seal) return 'seal_mismatch'
  if (!Array.isArray(receipts) || !receipts.every(receipt => requiredKeysExact(receipt, correction.receipt_schema.required) && correction.receipt_schema.terminal_status_values.includes(receipt.terminal_status) && receipt.current_steering_eligibility === false)) return 'receipt_shape_invalid'
  const receiptKeys = receipts.map(tupleKey)
  if (!unique(receiptKeys) || !same(sorted(receiptKeys), sorted(memberKeys))) return 'duplicate_or_extra_receipt'
  return 'complete'
}
for (const vector of vectors.correction_vectors) { const { graph, receipts } = mutateRepair(vector.mutation); check(`correction vector ${vector.id}`, validateRepair(graph, receipts) === vector.expected) }

const expectedStates = ['unreserved', 'reserved', 'external_confirmed', 'local_committed_pending_ack', 'finalized', 'aborted', 'quarantined']
const expectedFirstCas = ['transition_receipt_version', 'predecessor_version', 'source_heads', 'set_seals', 'revocation_epochs', 'human_authority_receipt_version', 'external_token_or_lease_identity', 'idempotency_key', 'transaction_nonce', 'visible_consequence_fingerprint']
const expectedSecondCas = ['same_provisional_transition_version', 'same_reserved_receipt_version', 'same_external_token_or_lease_identity', 'same_idempotency_key', 'same_transaction_nonce', 'same_visible_consequence_fingerprint', 'same_or_stricter_validity_boundary', 'protocol_specific_external_finality_evidence']
check('external authority remains inactive', external.authoritative_external_fact_kinds.length === 0 && external.unsupported_external_assertion === 'evidence_only_indeterminate')
check('external states exact', same(external.states, expectedStates) && external.steering_state === 'finalized' && same(external.terminal_states, ['finalized', 'aborted', 'quarantined']))
check('first CAS exact', same(external.first_compare_and_set, expectedFirstCas))
check('second CAS exact', same(external.second_compare_and_set, expectedSecondCas))
check('protocol finality distinct and exact', same(external.protocol_finality, { immutable_authority_lease: 'same_lease_revision_key_policy_fact_epoch_and_strict_validity_boundary_current_at_second_compare_and_set', online_conditional_verify_and_consume: 'same_single_use_token_consumed_for_same_reservation_nonce_transition_receipt_and_consequence_before_second_compare_and_set' }))
check('strict validity and retry exact', external.strict_validity === 'server_transaction_time + maximum_clock_skew_seconds < valid_until' && same(external.retry, { same_key_nonce_and_bytes: 'return_same_state', same_key_or_nonce_changed_bytes: 'reject_collision', new_nonce_on_retry: false }))
function executeExternal(events) {
  let state = 'unreserved'
  for (const event of events) {
    const edge = external.transitions.find(value => value.from === state && value.event === event)
    if (!edge) return 'illegal_transition'
    state = edge.to
  }
  return state
}
for (const vector of vectors.external_vectors) check(`external vector ${vector.id}`, executeExternal(vector.events) === vector.expected)
check('all vector IDs globally unique', unique(['owner_vectors', 'authority_vectors', 'routing_vectors', 'question_vectors', 'predicate_vectors', 'predicate_program_mutations', 'correction_vectors', 'external_vectors'].flatMap(group => vectors[group].map(value => value.id))))

if (failures.length) {
  console.error(`R80 independent conformance failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log(`ok: R80 coherent contract; ${imported.transition_catalogue.length} transitions; ${owners.records.length} server owners; ${['owner_vectors', 'authority_vectors', 'routing_vectors', 'question_vectors', 'predicate_vectors', 'predicate_program_mutations', 'correction_vectors', 'external_vectors'].reduce((sum, group) => sum + vectors[group].length, 0)} executable vectors`)
