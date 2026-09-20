import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r79'
const manifestPath = `${directory}/00-manifest.json`
const failures = []
const check = (name, condition) => { if (!condition) failures.push(name) }
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const unique = values => values.length === new Set(values).size
const sorted = values => [...values].sort((left, right) => Buffer.from(left).compare(Buffer.from(right)))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const gitBytes = (commit, path) => execFileSync('git', ['show', `${commit}:${path}`], { cwd: root })
const gitText = (commit, path) => gitBytes(commit, path).toString('utf8')
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const canonicalValue = value => Array.isArray(value)
  ? value.map(canonicalValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]))
    : value
const canonical = value => `${JSON.stringify(canonicalValue(value), null, 2)}\n`

const R75 = 'e6494cda6fba4ce8209f99f1611ba3803de34370'
const R77 = '4ab418d7815c914eef155fd017ef362f1983b9a7'
const R78 = 'a645f13e11139b15596cd73f7b26eafb2a28a4a0'
const expectedModuleFiles = [
  '01-lineage-and-owner-policy.json',
  '02-closed-schemas.json',
  '03-transition-catalogue.json',
  '04-predicate-grammar.json',
  '05-human-interaction-contract.json',
  '06-external-finality-contract.json',
  '07-correction-closure-contract.json',
  '08-executable-vectors.json'
]
const modulePaths = expectedModuleFiles.map(file => `${directory}/${file}`)
const modules = Object.fromEntries(modulePaths.map(path => {
  const value = readJson(path)
  return [value.module_id, value]
}))

const exactLineage = {
  r75: {
    commit: R75,
    tree: '3e53f7ca69a0f01192f3e255471a17b81f05f313',
    decision_document_path: 'project-documentation/ctrl-evolution/g24-predicate-authority-founder-decision-r75.md',
    decision_document_blob: 'ee48e4b29d787ef3bbb17c9bf2e558cf7c2aebc6',
    decision_document_sha256: '83d2bc6fd6c1042e1fff83f29904abcc7d74bc130f388aa36933e19e40293410'
  },
  r77: {
    commit: R77,
    tree: '06733dcc7292583cad3463030e076a03a7a1bfb1',
    json_path: 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-lock-r77.json',
    json_blob: '3a9f328df9a1d334823746495aa87becf8a71de4',
    json_sha256: 'dc3380174cb3f1e87f20570beb67be53eebbb84d480647aeeb6a80dbb6cc2180',
    markdown_path: 'project-documentation/ctrl-evolution/g24-predicate-authority-r75-founder-lock-r77.md',
    markdown_blob: 'd1bfd0963154309901c3c7e0108baf410615dc72',
    markdown_sha256: '178a16485af5c9f20414f64bbe698d5f9b6dc4397b1c1986f2220be757a43c06'
  },
  r4_transition_catalogue: {
    commit: R75,
    path: 'project-documentation/ctrl-evolution/g24-product-system-contract-r4.json',
    blob: '1cb9a82a1368186925590309e6f1139be463588b',
    sha256: '58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c'
  },
  r78_vetoed_base: {
    commit: R78,
    tree: '74b6ed7be00ce959690dafa74c25d6393041a01d',
    bundle_fingerprint: '424f6eca0fd5707f15e59ce721834c334d4e910d5e1603a03a039dec7764e72f',
    standing: 'vetoed_design_catalogue_not_authority'
  }
}

const expectedAllowedFlow = [
  'lineage_and_owner_policy->closed_schemas',
  'lineage_and_owner_policy->transition_catalogue',
  'closed_schemas->executable_vectors',
  'transition_catalogue->predicate_grammar',
  'transition_catalogue->human_interaction_contract',
  'transition_catalogue->external_finality_contract',
  'predicate_grammar->executable_vectors',
  'human_interaction_contract->executable_vectors',
  'external_finality_contract->executable_vectors',
  'correction_closure_contract->executable_vectors'
]

const expectedClosedAuthority = [
  'semantic evaluator implementation',
  'result-producing lifecycle success branch',
  'runtime integration or live registry wiring',
  'database schema migration or production data change',
  'customer-facing UI',
  'external research model spend email or service mutation',
  'merge deployment release or production promotion',
  'legacy backend deletion',
  'cross-venture Supabase decision-ledger write'
]

const topKeys = {
  lineage_and_owner_policy: ['schema_version', 'module_id', 'supersedes_r78_sections', 'lineage', 'internal_owner_registry_version', 'external_authority_policy', 'runtime_owner_selection'],
  closed_schemas: ['schema_version', 'module_id', 'schema_dsl', 'schemas'],
  transition_catalogue: ['schema_version', 'module_id', 'supersedes_r78_sections', 'inherited_catalogue', 'transitions', 'composite_judgement_dependencies_allowed', 'authority_receipt_may_be_predicate_dependency'],
  predicate_grammar: ['schema_version', 'module_id', 'supersedes_r78_sections', 'grammar', 'aggregation', 'transition_rules', 'predicate_proof_may_apply_transition', 'final_authority_is_outside_predicate'],
  human_interaction_contract: ['schema_version', 'module_id', 'supersedes_r78_sections', 'atomic_judgement_registry', 'conditional_judgement_templates', 'direct_question_routing', 'accepted_decision_delta', 'unknown_rule', 'free_expression_rule', 'default_surface_budget'],
  external_finality_contract: ['schema_version', 'module_id', 'supersedes_r78_sections', 'common_external_bindings', 'protocols', 'strict_validity_expression', 'equality_result', 'states', 'edges', 'steering_state', 'local_transactions', 'retry', 'every_terminal_state_requires_protocol_specific_receipt'],
  correction_closure_contract: ['schema_version', 'module_id', 'supersedes_r78_sections', 'dependency_graph_proof', 'terminal_receipt_join', 'terminal_statuses', 'completion_requires', 'compensation_reopen_or_revalidation_requires_new_named_human_authority', 'history_rewrite'],
  executable_vectors: ['schema_version', 'module_id', 'standing', 'specimens', 'authentication_events', 'schema_vectors', 'predicate_vectors', 'routing_vectors', 'question_vectors', 'external_vectors', 'repair_vectors', 'transition_mutation_vectors']
}

for (const [id, expected] of Object.entries(topKeys)) check(`closed top-level keys ${id}`, same(sorted(Object.keys(modules[id] ?? {})), sorted(expected)))
check('module IDs unique and exact', unique(Object.keys(modules)) && same(sorted(Object.keys(modules)), sorted(Object.keys(topKeys))))

const lineage = modules.lineage_and_owner_policy
check('lineage module exact', same(lineage.lineage, exactLineage))
check('R75 tree independently resolved', git(['rev-parse', `${R75}^{tree}`]) === exactLineage.r75.tree)
check('R77 tree independently resolved', git(['rev-parse', `${R77}^{tree}`]) === exactLineage.r77.tree)
check('R78 tree independently resolved', git(['rev-parse', `${R78}^{tree}`]) === exactLineage.r78_vetoed_base.tree)
for (const record of [
  [R75, exactLineage.r75.decision_document_path, exactLineage.r75.decision_document_blob, exactLineage.r75.decision_document_sha256],
  [R77, exactLineage.r77.json_path, exactLineage.r77.json_blob, exactLineage.r77.json_sha256],
  [R77, exactLineage.r77.markdown_path, exactLineage.r77.markdown_blob, exactLineage.r77.markdown_sha256],
  [R75, exactLineage.r4_transition_catalogue.path, exactLineage.r4_transition_catalogue.blob, exactLineage.r4_transition_catalogue.sha256]
]) {
  const [commit, path, blob, digest] = record
  check(`Git blob exact ${path}`, git(['rev-parse', `${commit}:${path}`]) === blob)
  check(`Git SHA exact ${path}`, sha256(gitBytes(commit, path)) === digest)
}
const frozenR78Manifest = JSON.parse(gitText(R78, 'project-documentation/ctrl-evolution/g24-predicate-authority-r78/00-manifest.json'))
check('R78 base fingerprint independently read', frozenR78Manifest.bundle_fingerprint === exactLineage.r78_vetoed_base.bundle_fingerprint)
check('no external fact kind silently activated', lineage.external_authority_policy.authoritative_fact_kinds.length === 0 && lineage.external_authority_policy.default_for_every_external_assertion === 'evidence_only_indeterminate')
check('external activation requires exact founder policy', same(lineage.external_authority_policy.activation_requires, ['separate_founder_decision_id', 'exact_fact_kind', 'exact_issuer_identity', 'exact_source_registry_entry', 'exact_authority_policy_version', 'exact_protocol', 'exact_ttl_seconds', 'exact_maximum_clock_skew_seconds', 'independent_executable_verification']))
check('runtime owner selection forbidden', lineage.runtime_owner_selection === false)

const manifest = readJson(manifestPath)
const records = modulePaths.map(path => {
  const bytes = readFileSync(join(root, path))
  const parsed = JSON.parse(bytes.toString('utf8'))
  return { path, module_id: parsed.module_id, schema_version: parsed.schema_version, bytes: bytes.length, sha256: sha256(bytes) }
})
const manifestWithoutFingerprint = { ...manifest }
delete manifestWithoutFingerprint.bundle_fingerprint
check('manifest module records exact', canonical(manifest.modules) === canonical(records))
check('manifest flow exact', same(manifest.allowed_module_flow, expectedAllowedFlow))
check('manifest closed authority exact', same(manifest.authority_still_closed, expectedClosedAuthority))
check('manifest full fingerprint exact', manifest.bundle_fingerprint === sha256(Buffer.from(canonical(manifestWithoutFingerprint), 'utf8')))
const reversedRecords = [...modulePaths].reverse().sort((left, right) => Buffer.from(left).compare(Buffer.from(right))).map(path => {
  const bytes = readFileSync(join(root, path)); const parsed = JSON.parse(bytes.toString('utf8'))
  return { path, module_id: parsed.module_id, schema_version: parsed.schema_version, bytes: bytes.length, sha256: sha256(bytes) }
})
check('manifest records stable under reversed source order', same(records, reversedRecords))

const transitions = modules.transition_catalogue.transitions
const inheritedR4 = JSON.parse(gitText(R75, exactLineage.r4_transition_catalogue.path)).lifecycle_policy_replacement.transitions
const inheritedKeys = ['id', 'from', 'to', 'actor', 'authority', 'precondition', 'from_version_match', 'invalidation', 'receipt']
check('thirteen exact transition IDs', transitions.length === 13 && unique(transitions.map(value => value.id)))
check('inherited R4 transition semantics exact', transitions.every((value, index) => same(Object.fromEntries(inheritedKeys.map(key => [key, value[key]])), inheritedR4[index])))
check('transition nested keys closed', transitions.every(value => {
  const allowed = ['id', 'from', 'to', 'actor', 'authority', 'precondition', 'from_version_match', 'invalidation', 'receipt', 'server_dependencies', 'normative_dependencies', 'conditional_normative_rule', 'final_authority', 'audience_policy', 'post_close_obligations_survive']
  return Object.keys(value).every(key => allowed.includes(key))
}))

const expectedFinalAuthority = {
  open_preparation: { actor_roles: ['krish'], cardinality: 'all', receipt_type: 'final_transition_authority' },
  accept_intensive_proof: { actor_roles: ['named_leader', 'krish'], cardinality: 'all', receipt_type: 'final_transition_authority' },
  close_preparation: { actor_roles: ['krish', 'named_leader_via_krish_record'], cardinality: 'any_one', receipt_type: 'final_transition_authority', bounded_reason_values: ['cancelled', 'declined', 'withdrawn'] },
  continue_after_intensive_proof: { actor_roles: ['named_leader', 'krish'], cardinality: 'all', receipt_type: 'final_transition_authority' },
  renew_continuing_period: { actor_roles: ['named_leader', 'krish'], cardinality: 'all', receipt_type: 'final_transition_authority' },
  pause_intensive_proof: { actor_roles: ['named_leader', 'krish'], cardinality: 'any_one', receipt_type: 'final_transition_authority' },
  pause_continuing: { actor_roles: ['named_leader', 'krish'], cardinality: 'any_one', receipt_type: 'final_transition_authority' },
  resume_continuing: { actor_roles: ['named_leader', 'krish'], cardinality: 'all', receipt_type: 'final_transition_authority' },
  close_intensive_proof: { actor_roles: ['named_leader', 'krish'], cardinality: 'any_one', receipt_type: 'final_transition_authority' },
  close_continuing: { actor_roles: ['named_leader', 'krish'], cardinality: 'any_one', receipt_type: 'final_transition_authority' },
  close_paused: { actor_roles: ['named_leader', 'krish'], cardinality: 'any_one', receipt_type: 'final_transition_authority' },
  complete_close: { actor_roles: ['krish'], cardinality: 'all', receipt_type: 'final_transition_authority' },
  open_new_preparation_after_close: { actor_roles: ['krish'], cardinality: 'all', receipt_type: 'final_transition_authority' }
}
check('final authority graph exact', transitions.every(value => same(value.final_authority, expectedFinalAuthority[value.id])))

const expectedSemantics = {
  open_preparation: { server: ['no_active_lifecycle_row', 'subject_identity_valid', 'eligible_source_class_values_valid', 'private_preparation_audience_exact'], normative: ['krish_bounded_purpose', 'krish_allowed_source_classes', 'krish_review_date'], audience: 'named_subject_and_krish_only_no_external_or_customer_grant' },
  accept_intensive_proof: { server: ['current_preparation_exact', 'active_grant_set_complete', 'revocation_set_complete', 'checkpoint_exists'], normative: ['leader_accepts_exact_purpose_and_frame_version', 'krish_accepts_exact_purpose_and_frame_version'], audience: 'intersection_of_current_grants' },
  close_preparation: { server: ['current_preparation_exact'], normative: [], audience: 'intersection_of_current_grants' },
  continue_after_intensive_proof: { server: ['current_intensive_proof_period_exact', 'checkpoint_integrity_valid'], normative: ['leader_next_consequential_decision_or_evidenced_value', 'krish_next_consequential_decision_or_evidenced_value', 'leader_continuation_checkpoint', 'krish_continuation_checkpoint', 'leader_exit_or_revisit_condition', 'krish_exit_or_revisit_condition'], audience: 'intersection_of_current_grants' },
  renew_continuing_period: { server: ['current_continuing_period_exact', 'current_checkpoint_exact'], normative: ['leader_next_consequential_decision_or_evidenced_value', 'krish_next_consequential_decision_or_evidenced_value', 'leader_exit_or_revisit_condition', 'krish_exit_or_revisit_condition'], audience: 'intersection_of_current_grants' },
  pause_intensive_proof: { server: ['current_intensive_proof_period_exact'], normative: [], audience: 'intersection_of_current_grants' },
  pause_continuing: { server: ['current_continuing_period_exact'], normative: [], audience: 'intersection_of_current_grants' },
  resume_continuing: { server: ['current_paused_period_exact', 'subject_and_case_identities_exact', 'active_grant_set_complete', 'revocation_set_complete', 'audience_set_complete', 'all_dependencies_fresh', 'old_expired_or_revoked_grants_unusable', 'fresh_issuance_exists_where_required'], normative: ['leader_revalidates_purpose', 'krish_revalidates_purpose', 'leader_revalidates_next_value', 'krish_revalidates_next_value', 'leader_revalidates_checkpoint', 'krish_revalidates_checkpoint'], audience: 'intersection_of_current_grants' },
  close_intensive_proof: { server: ['current_intensive_proof_period_exact'], normative: [], audience: 'intersection_of_current_grants' },
  close_continuing: { server: ['current_continuing_period_exact'], normative: [], audience: 'intersection_of_current_grants' },
  close_paused: { server: ['current_paused_period_exact'], normative: [], audience: 'intersection_of_current_grants' },
  complete_close: { server: ['current_close_request_exact', 'close_obligation_set_exactly_access_correction_separate_release_close', 'every_obligation_fulfilled_or_recorded_outstanding'], normative: [], audience: 'closed_history_and_durable_obligation_audience_only' },
  open_new_preparation_after_close: { server: ['closed_predecessor_exact', 'prior_grant_set_complete', 'revocation_set_complete', 'no_old_grant_can_revive', 'private_preparation_audience_exact'], normative: ['krish_genuinely_new_purpose', 'krish_review_date'], audience: 'named_subject_and_krish_only_no_external_or_customer_grant' }
}
check('transition semantic arrays exact', transitions.every(value => same(value.server_dependencies, expectedSemantics[value.id].server) && same(value.normative_dependencies, expectedSemantics[value.id].normative) && value.audience_policy === expectedSemantics[value.id].audience))
check('authority receipts separate from predicates', modules.transition_catalogue.authority_receipt_may_be_predicate_dependency === false && transitions.every(value => !value.normative_dependencies.some(item => item.includes('authority_receipt'))))
check('complete close conditional obligations exact', same(transitions.find(value => value.id === 'complete_close').conditional_normative_rule, { for_each_genuine_outstanding_obligation: ['responsible_human_owner', 'revisit_date'], zero_outstanding_obligations_adds: [] }) && transitions.find(value => value.id === 'complete_close').post_close_obligations_survive === true)

const judgementRegistry = modules.human_interaction_contract.atomic_judgement_registry
const normativeIds = transitions.flatMap(value => value.normative_dependencies)
check('atomic judgement registry total and unique', unique(judgementRegistry.map(value => value.dependency_id)) && same(sorted([...new Set(normativeIds)]), sorted(judgementRegistry.map(value => value.dependency_id))))
check('atomic judgement kinds closed', judgementRegistry.every(value => ['purpose', 'decision_frame', 'meaningful_value', 'boundary', 'stop_condition', 'revisit_condition'].includes(value.judgement_kind)))
check('no composite judgement kinds', modules.transition_catalogue.composite_judgement_dependencies_allowed === false && judgementRegistry.every(value => !value.judgement_kind.includes('_and_')))

const grammar = modules.predicate_grammar
check('closed predicate grammar exact', same(grammar.grammar.root_ops, ['all_present']) && same(grammar.grammar.leaf_ops, ['dependency_disposition']) && grammar.predicate_proof_may_apply_transition === false && grammar.final_authority_is_outside_predicate === true)
check('predicate rule for every transition', same(grammar.transition_rules.map(value => value.transition_id), transitions.map(value => value.id)) && grammar.transition_rules.every(value => value.rule.op === 'all_present'))
function evaluatePredicate(dispositions) {
  if (dispositions.some(value => ['missing', 'stale', 'unreadable', 'ambiguous', 'revoked'].includes(value))) return 'indeterminate'
  if (dispositions.includes('contradicted')) return 'unsatisfied'
  if (dispositions.every(value => value === 'present')) return 'satisfied'
  return 'indeterminate'
}

const schemaModule = modules.closed_schemas
const schemas = schemaModule.schemas
check('schemas globally closed', schemaModule.schema_dsl.additional_fields_default === false)
check('schema definitions nested keys closed', Object.entries(schemas).every(([name, schema]) => {
  const allowed = name === 'accepted_decision_state' ? ['required', 'fields', 'material_paths'] : name === 'repair_receipt' ? ['required', 'fields'] : ['required', 'fields', 'cross_field_rules']
  return same(sorted(Object.keys(schema)), sorted(allowed)) && same(sorted(schema.required), sorted(Object.keys(schema.fields)))
}))
check('schema field rules closed', Object.values(schemas).every(schema => Object.values(schema.fields).every(rule => typeof rule === 'string' || (rule && typeof rule === 'object' && !Array.isArray(rule) && Object.keys(rule).length === 1 && ['const', 'enum'].includes(Object.keys(rule)[0])))))
const typeValidators = {
  nonempty_string: value => typeof value === 'string' && value.length > 0,
  nullable_string: value => value === null || typeof value === 'string',
  string_array: value => Array.isArray(value) && value.every(item => typeof item === 'string'),
  string_array_nonempty: value => Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string'),
  sha256: value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value),
  timestamp: value => typeof value === 'string' && !Number.isNaN(Date.parse(value)),
  integer_nonnegative: value => Number.isInteger(value) && value >= 0,
  sorted_unique_string_array: value => Array.isArray(value) && unique(value) && same(value, sorted(value)),
  sorted_unique_sha256_array: value => Array.isArray(value) && unique(value) && same(value, sorted(value)) && value.every(item => /^[0-9a-f]{64}$/.test(item)),
  answer_effect_map: value => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

function validateShape(schemaName, value) {
  const schema = schemas[schemaName]
  const errors = []
  if (!schema || !value || typeof value !== 'object' || Array.isArray(value)) return ['invalid_object']
  for (const field of schema.required) if (!Object.hasOwn(value, field)) errors.push('missing_field')
  for (const field of Object.keys(value)) if (!Object.hasOwn(schema.fields, field)) errors.push('unknown_field')
  for (const [field, rule] of Object.entries(schema.fields)) {
    if (!Object.hasOwn(value, field)) continue
    if (typeof rule === 'string') {
      if (!typeValidators[rule]?.(value[field])) errors.push('type_mismatch')
    } else if (Object.hasOwn(rule, 'const') && value[field] !== rule.const) errors.push('const_mismatch')
    else if (rule.enum && !rule.enum.includes(value[field])) errors.push('enum_mismatch')
  }
  if (schemaName === 'semantic_profile') {
    const derived = value.authority_species === 'derived_fact'
    if (derived !== Boolean(value.derivation_function_id && value.derivation_version)) errors.push('derivation_binding_invalid')
    if (value.brain_standing === 'accepted' && !(value.brain_item_ref && value.brain_item_version)) errors.push('brain_binding_invalid')
  }
  return [...new Set(errors)]
}

const vectors = modules.executable_vectors
const specimens = vectors.specimens
const clone = value => structuredClone(value)
const setAt = (object, path, value) => { let cursor = object; for (const key of path.slice(0, -1)) cursor = cursor[key]; cursor[path.at(-1)] = value }
const deleteAt = (object, path) => { let cursor = object; for (const key of path.slice(0, -1)) cursor = cursor[key]; delete cursor[path.at(-1)] }
function mutateSpecimen(value, mutation) {
  const result = clone(value)
  if (!mutation) return result
  if (mutation.op === 'add' || mutation.op === 'replace') setAt(result, mutation.path, clone(mutation.value))
  if (mutation.op === 'delete') deleteAt(result, mutation.path)
  if (mutation.op === 'free_text_without_confirmation') {
    result.structured_answer_value = null
    result.free_expression_ref = 'free-1'
    result.free_expression_confirmation_ref = null
  }
  return result
}

const bindingContext = {
  visible_consequence_fingerprint: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  named_roles: { named_leader: 'leader-1', krish: 'krish' }
}
function semanticReceiptErrors(schemaName, value) {
  const errors = validateShape(schemaName, value)
  if (schemaName === 'normative_attestation_receipt') {
    const event = vectors.authentication_events[value.actor_authentication_event_ref]
    if (!event || event.named_human_id !== value.named_human_id || event.fingerprint !== value.actor_authentication_event_fingerprint) errors.push('actor_provenance_invalid')
    if (value.visible_consequence_fingerprint !== bindingContext.visible_consequence_fingerprint) errors.push('binding_mismatch')
    if (value.free_expression_ref && !value.free_expression_confirmation_ref) errors.push('free_expression_unconfirmed')
    const allowedPaths = schemas.accepted_decision_state.material_paths
    if (!value.accepted_decision_changed_paths?.some(path => allowedPaths.includes(path))) errors.push('no_material_decision_delta')
  }
  if (schemaName === 'final_transition_authority_receipt') {
    const transition = transitions.find(item => item.id === value.transition_id)
    const expectedActors = transition.final_authority.actor_roles.map(role => bindingContext.named_roles[role] ?? role)
    if (transition.final_authority.cardinality === 'all' && !same(sorted(value.named_authority_ids ?? []), sorted(expectedActors))) errors.push('authority_actor_mismatch')
    if ((value.actor_authentication_event_refs ?? []).length !== (value.named_authority_ids ?? []).length) errors.push('authority_actor_mismatch')
  }
  if (schemaName === 'external_authority_proof' && lineage.external_authority_policy.authoritative_fact_kinds.length === 0) errors.push('external_policy_inactive')
  return [...new Set(errors)]
}

for (const vector of vectors.schema_vectors) {
  const value = mutateSpecimen(specimens[vector.specimen], vector.mutation)
  const errors = semanticReceiptErrors(vector.schema, value)
  check(`schema vector ${vector.id}`, vector.expected === 'valid' ? errors.length === 0 : errors.includes(vector.expected))
}
for (const vector of vectors.predicate_vectors) check(`predicate vector ${vector.id}`, evaluatePredicate(vector.dispositions) === vector.expected)

function route(unresolved) {
  if (unresolved.some(value => Array.isArray(value.requested_value_kind))) return 'reject_composite'
  const atoms = new Set(unresolved.map(value => `${value.named_human_id}:${value.requested_value_kind}`))
  if (atoms.size === 0) return 'no_customer_question'
  if (atoms.size === 1) return 'one_complete_question_atom'
  return 'safe_hold_or_one_krish_led_session_agenda'
}
for (const vector of vectors.routing_vectors) check(`routing vector ${vector.id}`, route(vector.unresolved) === vector.expected)

const materialPaths = schemas.accepted_decision_state.material_paths
function changedMaterialPaths(before, after) {
  return materialPaths.filter(path => !same(before[path], after[path]))
}
function validateQuestion(vector) {
  const question = mutateSpecimen(specimens[vector.question], vector.mutation)
  const before = specimens[vector.before]
  const shapeErrors = validateShape('question_atom', question)
  if (shapeErrors.length) return shapeErrors[0]
  if (question.case_id !== before.case_id) return 'cross_case_effect'
  const budget = modules.human_interaction_contract.default_surface_budget
  const counts = vector.surface_counts
  if (counts && (counts.headings > budget.primary_heading_count || counts.questions > budget.primary_question_count || counts.control_groups > budget.answer_control_group_count || counts.optional_notes > budget.optional_note_controls || counts.primary_actions > budget.primary_action_count || counts.automatic_next_copy > budget.automatic_next_question_copy || counts.technical_labels > budget.technical_labels)) return 'surface_budget_exceeded'
  for (const option of question.answer_options) {
    const after = vector.effect_override === 'same_as_before' ? before : specimens[question.answer_effects[option]]
    if (!after || after.case_id !== before.case_id || after.decision_id !== before.decision_id) return 'cross_case_effect'
    if (changedMaterialPaths(before, after).length < modules.human_interaction_contract.accepted_decision_delta.minimum_material_changed_paths) return 'no_material_decision_delta'
  }
  return 'valid'
}
for (const vector of vectors.question_vectors) check(`question vector ${vector.id}`, validateQuestion(vector) === vector.expected)

const external = modules.external_finality_contract
check('external protocol objects closed', Object.values(external.protocols).every(value => same(sorted(Object.keys(value)), sorted(['allowed_only_when', 'additional_bindings', 'external_finality', 'acknowledgement', 'second_local_cas_condition']))))
check('external local transaction objects closed', external.local_transactions.every(value => same(sorted(Object.keys(value)), sorted(['transaction_id', 'required_compare_and_set', 'write']))))
check('external common bindings complete', same(external.common_external_bindings, schemas.external_authority_proof.required.filter(field => field !== 'proof_type' && field !== 'single_use_token_id')))
check('strict external time exact', external.strict_validity_expression === 'server_transaction_time + maximum_clock_skew_seconds < valid_until' && external.equality_result === 'invalid')
check('two local CAS transactions exact', same(external.local_transactions.map(value => value.transaction_id), ['reserve_and_provisional_commit', 'finalize_after_external_finality']) && external.local_transactions[1].required_compare_and_set.includes('same_provisional_transition_version'))
check('protocol-specific finality distinct', external.protocols.immutable_authority_lease.external_finality !== external.protocols.online_conditional_verify_and_consume.external_finality)
check('retry nonce fixed', external.retry.new_nonce_on_retry === false)
for (const vector of vectors.external_vectors) {
  let actual
  if (Object.hasOwn(vector, 'transaction_time')) actual = vector.transaction_time + vector.maximum_clock_skew < vector.valid_until ? 'valid' : 'invalid'
  else if (Object.hasOwn(vector, 'same_key')) actual = vector.same_key && vector.same_nonce && vector.same_canonical_bytes ? external.retry.same_key_nonce_and_canonical_bytes : external.retry.same_key_or_nonce_with_changed_bytes
  else actual = vector.state === external.steering_state
  check(`external vector ${vector.id}`, Object.hasOwn(vector, 'expected_steering') ? actual === vector.expected_steering : actual === vector.expected)
}

const correction = modules.correction_closure_contract
check('correction nested contracts closed', same(sorted(Object.keys(correction.dependency_graph_proof)), sorted(['required_fields', 'edge_kinds_exact', 'duplicates', 'omissions', 'extras', 'stale_head'])) && same(sorted(Object.keys(correction.terminal_receipt_join)), sorted(['join_key', 'exactly_one_terminal_receipt_per_sealed_dependency', 'duplicate_receipt', 'missing_receipt', 'extra_receipt', 'count_equality_without_identity_equality'])))
check('correction statuses exact', same(correction.terminal_statuses, ['rebuilt', 'quarantined', 'review_required', 'unaffected_with_reason', 'erased']))
check('correction completion actions exact', ['every_content_permission_and_scope_dependency_traversed', 'every_sealed_dependency_has_exactly_one_terminal_receipt', 'no_extra_or_duplicate_terminal_receipt', 'no_eligible_current_path_retains_superseded_authority'].every(value => correction.completion_requires.includes(value)))
function validateRepair(vector) {
  const graph = clone(specimens[vector.graph])
  const receipts = clone(specimens[vector.receipts])
  if (vector.mutation?.op === 'remove_receipt') receipts.splice(receipts.findIndex(value => value.dependency_id === vector.mutation.dependency_id), 1)
  if (vector.mutation?.op === 'replace_receipt_dependency') {
    const receipt = receipts.find(value => value.dependency_id === vector.mutation.from)
    receipt.dependency_id = vector.mutation.to
    receipt.dependency_fingerprint = vector.mutation.to_fingerprint
  }
  if (vector.mutation?.op === 'add_extra_receipt') receipts.push({ ...receipts[0], dependency_id: vector.mutation.dependency_id, dependency_fingerprint: vector.mutation.dependency_fingerprint, receipt_fingerprint: 'efefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefef' })
  if (validateShape('repair_graph_proof', graph).length || receipts.some(value => validateShape('repair_receipt', value).length)) return 'schema_invalid'
  const expected = graph.sorted_dependency_ids.map((id, index) => `${id}:${graph.sorted_dependency_fingerprints[index]}`)
  const actual = receipts.map(value => `${value.dependency_id}:${value.dependency_fingerprint}`)
  if (!unique(actual)) return actual.length === expected.length ? 'reject_duplicate_and_missing' : 'reject_duplicate'
  if (actual.some(value => !expected.includes(value))) return 'reject_extra'
  if (expected.some(value => !actual.includes(value))) return 'repair_incomplete'
  return 'complete'
}
for (const vector of vectors.repair_vectors) check(`repair vector ${vector.id}`, validateRepair(vector) === vector.expected)

function mutateTransition(vector) {
  const candidate = clone(transitions.find(value => value.id === vector.transition_id))
  const mutation = vector.mutation
  if (mutation.op === 'add_server_dependency') candidate.server_dependencies.push(mutation.value)
  if (mutation.op === 'remove_normative_dependency') candidate.normative_dependencies = candidate.normative_dependencies.filter(value => value !== mutation.value)
  if (mutation.op === 'replace_server_dependency') candidate.server_dependencies = candidate.server_dependencies.map(value => value === mutation.from ? mutation.to : value)
  if (mutation.op === 'replace_audience_policy') candidate.audience_policy = mutation.value
  if (mutation.op === 'add_normative_dependency') candidate.normative_dependencies.push(mutation.value)
  const expected = expectedSemantics[candidate.id]
  return same(candidate.server_dependencies, expected.server) && same(candidate.normative_dependencies, expected.normative) && candidate.audience_policy === expected.audience ? 'valid' : 'catalogue_mismatch'
}
for (const vector of vectors.transition_mutation_vectors) check(`transition mutation ${vector.id}`, mutateTransition(vector) === vector.expected)

const allVectorIds = ['schema_vectors', 'predicate_vectors', 'routing_vectors', 'question_vectors', 'external_vectors', 'repair_vectors', 'transition_mutation_vectors'].flatMap(key => vectors[key].map(value => value.id))
check('all executable vector IDs unique', unique(allVectorIds))

if (failures.length) {
  console.error(`G24 R79 repaired machine contract failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ok: R79 independent conformance; exact lineage; ${transitions.length} transitions; ${Object.keys(schemas).length} closed schemas; ${allVectorIds.length} executable vectors; ${manifest.bundle_fingerprint}`)
