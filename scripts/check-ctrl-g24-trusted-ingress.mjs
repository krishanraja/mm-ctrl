import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const contractPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract.md'
const machinePath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-contract.json'
const qaPath = 'project-documentation/ctrl-evolution/g24-trusted-ingress-qa-record.md'
const contract = read(contractPath)
const machine = JSON.parse(read(machinePath))
const qa = read(qaPath)
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

check('candidate state is honest', machine.status === 'candidate_under_independent_review')
check(
  'command surface is exactly bounded',
  JSON.stringify(machine.untrusted_command_allowlist) ===
    JSON.stringify(['operation_id', 'requested_case_ref', 'requested_operation_class', 'presented_session']),
)
check('unknown command fields are rejected', machine.untrusted_command_rules.unknown_fields_rejected === true)
check('caller cannot supply authority', machine.untrusted_command_rules.caller_material_authority_fields_used === false)
check('invalid command cannot create a side effect', machine.untrusted_command_rules.invalid_command_result === 'non_actionable_hold_without_side_effect')
check(
  'material fields are server resolved',
  machine.server_resolved.length === 11 &&
    machine.server_resolved.includes('complete_applicable_control_manifest_and_transitive_graph') &&
    machine.server_resolved.includes('database_trusted_time_transaction_identity_and_snapshot_revision'),
)
check('one snapshot required', machine.transaction_rules.one_consistent_snapshot === true)
check('partial snapshots cannot act', machine.transaction_rules.partial_snapshot_actionable === false)
check('prepared projection cannot act alone', machine.transaction_rules.prepared_envelope_is_action_authority === false)
check('check and use is atomic', machine.transaction_rules.atomic_recheck_before_use === true)
check('new applicability invalidates', machine.transaction_rules.newly_applicable_control_invalidates === true)
check('unrelated lineage remains independent', machine.transaction_rules.unrelated_lineage_invalidates === false)
check('matching JSON is not durable proof', machine.rehydration_rules.matching_json_is_proof === false)
check('rehydration requires canonical provenance', machine.rehydration_rules.requires_canonical_database_provenance === true)
check('invalid state cannot be revived', machine.rehydration_rules.can_revive_expired_or_invalidated_state === false)
check('plan allocation is atomic', machine.plan_finality.attempt_allocation_is_atomic === true)
check('plan budget is server derived', machine.plan_finality.budget_is_server_derived === true)
check('terminal finality survives restart', machine.plan_finality.terminal_state_survives_restart === true)
check('alternate history cannot reopen plan', machine.plan_finality.alternate_history_reopens_terminal_plan === false)
check('only one final attempt winner', machine.plan_finality.concurrent_last_attempt_has_multiple_winners === false)
check('only one terminal receipt', machine.plan_finality.concurrent_terminal_has_multiple_receipts === false)
check('twelve attack families required', machine.required_attack_families === 12)
check('claim remains local contract only', machine.claim_limit === 'local_architecture_contract_only')
check('hold returns no partial envelope', machine.hold_contract.partial_kernel_envelope_returned === false)
check('hold fabricates no receipt', machine.hold_contract.fabricated_receipt_returned === false)
check('hold causes no side effect', machine.hold_contract.brain_or_external_side_effect === false)
check('runtime stays closed', machine.authority.closed.includes('runtime_connection'))
check('Supabase mutation stays closed', machine.authority.closed.includes('supabase_branch_or_schema_change'))
check('external actions stay closed', ['deployment', 'merge', 'release'].every(value => machine.authority.closed.includes(value)))
check('human and model authority boundary stated', contract.includes('A model may propose a candidate but cannot make it eligible.'))
check('no partial trusted envelope', contract.includes('They never produce a partial trusted envelope.'))
check('QA preserves implementation limit', qa.includes('No adapter, database function, schema, branch'))
const emDash = String.fromCodePoint(0x2014)
check('new files contain no em dash', !contract.includes(emDash) && !qa.includes(emDash))

if (failures.length) {
  console.error(`G24 trusted ingress failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: G24 trusted canonical ingress authority, transaction, rehydration and terminal-finality contract passed')
