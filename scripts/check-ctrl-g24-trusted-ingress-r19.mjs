import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { materializedR19, materializedR19Output } from './materialize-ctrl-g24-trusted-ingress-r19.mjs'
const root = process.cwd()
const path = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r19.json'
const read = p => readFileSync(join(root, p), 'utf8')
const sha = p => createHash('sha256').update(read(p)).digest('hex')
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const failures = []
const exactClosed = s => { const k = Object.keys(s?.properties ?? {}); const o = s?.optional ?? []; return s?.type === 'object' && s.additional_properties === false && same(s.exact_keys, k) && same(s.required, k.filter(x => !o.includes(x))) }
const closedResolvable = s => { const k = Object.keys(s?.properties ?? {}); return s?.type === 'object' && s.additional_properties === false && k.length > 0 && same([...s.exact_keys].sort(), [...k].sort()) && (s.required ?? []).every(x => k.includes(x)) }
const resolveRef = (c, ref) => ref.split('.').reduce((v, part) => v?.[part], c)
function lifecycleHits(value, forbidden, pathValue = '$', hits = []) {
  const scan = (text, location) => {
    for (const token of forbidden) {
      let cursor = text.indexOf(token)
      while (cursor >= 0) {
        const tail = text.slice(cursor + token.length)
        const next = tail.slice(4, 5)
        const exactRef = token === 'predecessor_lifecycle_version' && tail.startsWith('_ref') && (next === '' || /[\s.,;:)\]]/.test(next))
        if (!exactRef) hits.push(`${location}:${token}`)
        cursor = text.indexOf(token, cursor + token.length)
      }
    }
  }
  if (Array.isArray(value)) value.forEach((item, i) => lifecycleHits(item, forbidden, `${pathValue}[${i}]`, hits))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) { scan(key, `${pathValue}.<key>`); lifecycleHits(item, forbidden, `${pathValue}.${key}`, hits) }
  else if (typeof value === 'string') scan(value, pathValue)
  return hits
}
function lifecycleClosureHits(c) { const x = structuredClone(c); const forbidden = [...x.lifecycle_vocabulary_contract.forbidden_exact_tokens]; x.lifecycle_vocabulary_contract.forbidden_exact_tokens = []; return lifecycleHits(x, forbidden) }
function declaredFailures(c) {
  const out = []
  const contract = c.declared_reference_resolution_contract
  const aliases = Object.fromEntries(Object.entries(contract.alias_schemas).map(([alias, ref]) => [alias, resolveRef(c, ref)]))
  const records = c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records
  for (const record of records) {
    const recordSchema = resolveRef(c, record.schema_ref)
    const recordAlias = `record_${record.record_name}`
    if (!closedResolvable(recordSchema) || aliases[recordAlias] !== recordSchema) out.push(`record:${record.record_name}`)
    const pairs = new Set()
    for (const join of record.joins) {
      if (!Array.isArray(join) || join.length !== 2) { out.push(`shape:${record.record_name}`); continue }
      const [left, right] = join
      const lp = left.split('.'); const rp = right.split('.')
      if (lp.length !== 2 || rp.length !== 2 || rp[0] !== 'record') out.push(`segments:${left}:${right}`)
      else {
        if (!aliases[lp[0]]?.properties?.[lp[1]]) out.push(`left:${left}`)
        if (!recordSchema.properties[rp[1]]) out.push(`right:${right}`)
      }
      const pair = JSON.stringify(join)
      if (pairs.has(pair)) out.push(`duplicate:${pair}`)
      pairs.add(pair)
    }
  }
  for (const [kind, binding] of Object.entries(c.outbox.payload_binding_map)) {
    const schema = resolveRef(c, binding.payload_schema_ref)
    if (!closedResolvable(schema)) { out.push(`payload_schema:${kind}`); continue }
    for (const field of [binding.payload_ref_field, binding.payload_fingerprint_field, binding.payload_effect_ref_field]) if (typeof field !== 'string' || field.includes('.') || !schema.properties[field]) out.push(`payload_field:${kind}:${field}`)
  }
  for (const transition of c.outbox.transition_table) {
    if (!closedResolvable(resolveRef(c, transition.event_schema_ref))) out.push(`transition:${transition.event_kind}`)
    if (transition.event_kind !== 'retry_after_no_invocation' && c.outbox.payload_binding_map[transition.event_kind]?.payload_schema_ref !== transition.event_schema_ref) out.push(`transition_disagreement:${transition.event_kind}`)
  }
  return out
}
function collect(c) {
  const f = []; const ok = (n, v) => { if (!v) f.push(n) }
  ok('identity', c.schema_version === 'ctrl.g24.trusted-ingress.r19.effective.v1' && c.materialization.frozen_input.sha256 === 'a6e8c78ab2a14979930b65b409350e377e8f9167268c741003257e952b5d8579')
  ok('public ABI', c.operation_names.length === 20 && c.operation_names.every(n => c.operation_specs[n].result_schema === c.result_payload_schemas[n].schema_version && c.evaluator_abi.operation_result_exports[n] === c.result_payload_schemas[n].schema_version))
  const receiptAuthority = c.release_terminal_receipt_authority ?? {}
  const terminalSchema = c.authoritative_row_schemas.release_authority_terminal_consumptions
  ok('terminal consumption sole receipt', receiptAuthority.sole_receipt_schema_ref === 'authoritative_row_schemas.release_authority_terminal_consumptions' && receiptAuthority.receipt_ref_field === 'release_authority_consumption_ref' && receiptAuthority.receipt_fingerprint_field === 'release_authority_consumption_fingerprint' && closedResolvable(terminalSchema) && receiptAuthority.atomicity.includes('one_serializable_transaction_or_none'))
  const branchEqualities = Object.values(receiptAuthority.branch_equalities ?? {})
  ok('both result branches bind receipt fingerprint', Object.keys(c.result_payload_schemas.use_release.variants).every(branch => c.result_payload_schemas.use_release.variants[branch].properties.terminal_consumption_fingerprint) && branchEqualities.length === 2 && branchEqualities.every(rows => rows.length === 2 && rows[1].includes('terminal_consumption_fingerprint')))
  ok('release branch table receipt exact', c.release_terminal_consumption_derivation.branch_table.every(row => row.terminal_receipt_schema_ref === receiptAuthority.sole_receipt_schema_ref && row.terminal_receipt_row_ref_field === receiptAuthority.receipt_ref_field && row.terminal_receipt_row_fingerprint_field === receiptAuthority.receipt_fingerprint_field && row.result_terminal_receipt_fingerprint_field === 'terminal_consumption_fingerprint'))
  ok('release receipt equality exact', c.release_terminal_consumption_derivation.exact_equalities.includes('consumption.release_authority_consumption_ref_equals_branch_extracted_terminal_receipt_ref_equals_committed_success.result_ref') && c.release_terminal_consumption_derivation.exact_equalities.includes('consumption.release_authority_consumption_fingerprint_equals_branch_extracted_terminal_consumption_fingerprint'))
  const replay = c.operation_registry.replayed_committed_derivation
  const replayEqualities = ['replay.operation_id_equals_success.operation_id','replay.operation_class_equals_success.operation_class','replay.exported_result_schema_version_equals_success.exported_result_schema_version','replay.selected_result_schema_version_equals_success.selected_result_schema_version','replay.successful_result_branch_equals_success.successful_result_branch','replay.result_payload_b64url_equals_result_blob.canonical_result_payload_b64url','replay.result_payload_fingerprint_equals_success.result_payload_fingerprint_equals_result_blob.result_payload_fingerprint','replay.result_payload_byte_length_equals_result_blob.canonical_result_payload_byte_length','replay.snapshot_fingerprint_equals_success.snapshot_fingerprint','replay.committed_at_equals_success.committed_at']
  ok('replay exact historical projection', same(replay.exact_historical_equalities, replayEqualities) && same(replay.replay_only_derivations, ['status_is_replayed_committed','replayed_at_is_current_database_transaction_timestamp','historical_replay_is_true','current_standing_is_false']) && replay.evaluator_execution === 'forbidden' && replay.protected_effect === 'forbidden' && c.response_union.replayed_committed_derivation_ref === 'operation_registry.replayed_committed_derivation')
  const life = c.authoritative_row_schemas.lifecycle_single_action_transition_consumptions
  const sem = c.authoritative_semantic_fingerprint_schemas.lifecycle_single_action_transition_consumptions
  const env = c.authoritative_row_fingerprint_schemas.lifecycle_single_action_transition_consumptions
  ok('lifecycle actor role fingerprinted', same(life.properties.actor_role.values, ['named_leader','krish']) && sem.preimage_order.at(-1) === 'actor_role' && env.preimage_order.at(-1) === 'actor_role' && sem.domain_ascii.endsWith('-R19') && env.domain_ascii.endsWith('-R19'))
  ok('lifecycle actor role resolves receipt', life.conditional_rules.includes('actor_role_equals_the_uniquely_resolved_consumed_lifecycle_action_receipt.actor_role_byte_for_byte') && c.lifecycle_single_action_role_derivation.exact_equalities.includes('consumption.actor_role_equals_action_receipt.actor_role') && c.lifecycle_single_action_role_derivation.named_leader_branch.includes('current_case_named_leader_ref') && c.lifecycle_single_action_role_derivation.krish_branch.includes('current_case_engagement_operator_ref'))
  ok('lifecycle proof branches join role', c.proof_authority.proof_family_resolution_map.lifecycle.conditional_cross_row_equalities.slice(0,2).every(x => x.equalities.at(-1)[0] === 'lifecycle_single_action_transition_consumptions.actor_role' && x.equalities.at(-1)[1].endsWith('.actor_role')))
  const control = c.case_authority_control_plane; const registry = c.case_authority_control_operation_registry
  const key = ['workspace_ref','subject_ref','case_ref','control_operation_id']
  ok('case one scoped key', same(control.idempotency_key, key) && same(registry.row_schema.unique_keys, [key]) && registry.admission_outcome_table.exact_key_ref === 'case_authority_control_plane.idempotency_key')
  ok('case actor bound request receipt', control.request_schema.properties.authenticated_actor_ref && registry.row_schema.properties.authenticated_actor_ref && c.fingerprint_schemas.case_authority_control_request.preimage_order.includes('authenticated_actor_ref') && c.fingerprint_schemas.case_authority_control_receipt.preimage_order.includes('authenticated_actor_ref') && registry.row_schema.conditional_rules[0].includes('authenticated_actor_ref'))
  const rows = registry.admission_outcome_table.rows
  ok('case admission exact', same(rows.map(r => [r.priority,r.result,r.write]), [[1,'replayed_committed',false],[2,'unauthorized_hold',false],[3,'collision_hold',false],[4,'unauthorized_hold',false],[5,'stale_authority_hold',false],[6,'committed','one_new_binding_and_one_registry_receipt_atomically']]) && registry.admission_outcome_table.evaluation.includes('before_any_current_case_or_compare_and_swap_evaluation') && registry.admission_outcome_table.exhaustive && registry.admission_outcome_table.first_match_exclusive)
  const result = c.case_authority_control_result_union
  ok('case result union closed', result.discriminator === 'status' && same(Object.keys(result.variants), ['committed','replayed_committed','collision_hold','unauthorized_hold','stale_authority_hold']) && Object.values(result.variants).every(exactClosed) && result.committed_and_replayed_equalities.includes('exact_registry_row') && result.hold_rule.includes('no_receipt'))
  ok('original actor replay only', registry.replay.includes('only_to_receipt.authenticated_actor_ref') && rows[0].guard.includes('authenticated_actor_ref_equals_receipt.authenticated_actor_ref') && rows[1].guard.includes('authenticated_actor_ref_differs'))
  ok('declared graph exact', declaredFailures(c).length === 0 && c.declared_reference_resolution_contract.path_grammar === 'exactly_two_identifier_segments_alias_dot_field' && c.declared_reference_resolution_contract.duplicate_identical_join_pairs === 'contract_invalid; repeated_left_or_right_fields_remain_legal_when_they_express_distinct_equalities')
  ok('lifecycle keys and values strict', lifecycleClosureHits(c).length === 0 && c.lifecycle_vocabulary_contract.predecessor_ref_exception.includes('hyphenated'))
  ok('R18 strengths preserved', Object.keys(c.operation_result_schema_derivation.discriminated_results).length === 2 && c.operation_registry.committed_success_blob_derivation.commit_atomicity.includes('one_serializable_transaction_or_none') && c.outbox.payload_binding_map.worker_ambiguity.actor_payload_equality && c.outbox.provider_call_gate.nonlease_final_recheck_failure_set.closed)
  ok('manifest', c.schema_change_manifest.derivation.includes('frozen_R18') && c.schema_change_manifest.dependency_parity_checks.length === 6 && c.schema_change_manifest.changes.every(x => x.current_version.includes('.r19.')))
  return f
}
if (read(path) !== materializedR19Output) failures.push('machine differs from generator')
if (sha('project-documentation/ctrl-evolution/g24-trusted-ingress-contract-r18.json') !== 'a6e8c78ab2a14979930b65b409350e377e8f9167268c741003257e952b5d8579') failures.push('frozen R18 changed')
for (const x of collect(materializedR19)) failures.push(x)
const mutations = [
  ['release receipt authority removed',c=>{delete c.release_terminal_receipt_authority}],
  ['release receipt ref invented',c=>{c.release_terminal_receipt_authority.receipt_ref_field='invented'}],
  ['release branch fingerprint removed',c=>{delete c.result_payload_schemas.use_release.variants.pending_delivery.properties.terminal_consumption_fingerprint}],
  ['release branch extraction invented',c=>{c.release_terminal_consumption_derivation.branch_table[0].terminal_receipt_row_ref_field='invented'}],
  ['release receipt equality removed',c=>{c.release_terminal_consumption_derivation.exact_equalities.pop()}],
  ['replay operation class detached',c=>{c.operation_registry.replayed_committed_derivation.exact_historical_equalities.splice(1,1)}],
  ['replay schema detached',c=>{c.operation_registry.replayed_committed_derivation.exact_historical_equalities.splice(2,1)}],
  ['replay branch detached',c=>{c.operation_registry.replayed_committed_derivation.exact_historical_equalities.splice(4,1)}],
  ['replay evaluator allowed',c=>{c.operation_registry.replayed_committed_derivation.evaluator_execution='allowed'}],
  ['lifecycle semantic role removed',c=>{c.authoritative_semantic_fingerprint_schemas.lifecycle_single_action_transition_consumptions.preimage_order.pop()}],
  ['lifecycle envelope role removed',c=>{c.authoritative_row_fingerprint_schemas.lifecycle_single_action_transition_consumptions.preimage_order.pop()}],
  ['lifecycle role made model',c=>{c.authoritative_row_schemas.lifecycle_single_action_transition_consumptions.properties.actor_role.values=['model']}],
  ['lifecycle role equality removed',c=>{c.lifecycle_single_action_role_derivation.exact_equalities.pop()}],
  ['case plane key loses subject',c=>{c.case_authority_control_plane.idempotency_key=['workspace_ref','case_ref','control_operation_id']}],
  ['case registry key loses subject',c=>{c.case_authority_control_operation_registry.row_schema.unique_keys=[[ 'workspace_ref','case_ref','control_operation_id' ]]}],
  ['case request actor removed',c=>{delete c.case_authority_control_plane.request_schema.properties.authenticated_actor_ref}],
  ['case receipt actor removed',c=>{delete c.case_authority_control_operation_registry.row_schema.properties.authenticated_actor_ref}],
  ['case request receipt equality removed',c=>{c.case_authority_control_operation_registry.row_schema.conditional_rules.shift()}],
  ['case replay current actor',c=>{c.case_authority_control_operation_registry.replay='current_actor'}],
  ['case replay after CAS',c=>{c.case_authority_control_operation_registry.admission_outcome_table.evaluation='after_compare_and_swap'}],
  ['case replay writes',c=>{c.case_authority_control_operation_registry.admission_outcome_table.rows[0].write=true}],
  ['case collision replays',c=>{c.case_authority_control_operation_registry.admission_outcome_table.rows[2].result='replayed_committed'}],
  ['case result union open',c=>{c.case_authority_control_result_union.variants.committed.additional_properties=true}],
  ['case result omits stale',c=>{delete c.case_authority_control_result_union.variants.stale_authority_hold}],
  ['declared right extra segment',c=>{c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0].joins[0][1]+='.evil'}],
  ['declared left extra segment',c=>{c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0].joins[0][0]+='.evil'}],
  ['declared duplicate join',c=>{const r=c.proof_authority.proof_family_resolution_map.pending_release_and_authority.external_authoritative_records[0];r.joins.push([...r.joins[0]])}],
  ['payload field dotted',c=>{c.outbox.payload_binding_map.worker_ambiguity.payload_ref_field='evidence_ref.evil'}],
  ['lifecycle property extended',c=>{c.bad={predecessor_lifecycle_version_ref_extra:'x'}}],
  ['lifecycle value hyphen suffix',c=>{c.bad='predecessor_lifecycle_version_ref-evil'}],
  ['atomic success weakened',c=>{c.operation_registry.committed_success_blob_derivation.commit_atomicity='eventual'}],
  ['ambiguity actor detached',c=>{delete c.outbox.payload_binding_map.worker_ambiguity.actor_payload_equality}],
  ['manifest erased',c=>{c.schema_change_manifest.dependency_parity_checks=[]}],
]
for (const [name, mutate] of mutations) { const c=structuredClone(materializedR19); mutate(c); if (collect(c).length===0) failures.push(`mutation accepted: ${name}`) }
if (failures.length) { console.error(`G24 trusted ingress R19 failed ${failures.length} check(s):`); failures.forEach(x=>console.error(`- ${x}`)); process.exit(1) }
console.log(`ok: fully materialized G24 trusted ingress R19 and ${mutations.length} mutation probes verified`)
console.log(`r19_machine_sha256=${sha(path)}`)
