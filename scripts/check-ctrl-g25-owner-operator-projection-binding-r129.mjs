import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(join(root, file), 'utf8')
const hash = (file) => createHash('sha256').update(readFileSync(join(root, file))).digest('hex')
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-owner-operator-projection-binding-r129.json'))
const candidate = read(contract.artifacts.candidate)
const runner = read(contract.artifacts.runner)

check(contract.status === 'local_owner_binding_candidate_passed', 'R129 status drifted')
check(contract.operation.authenticated_owner_only === true, 'R129 is not owner-only')
check(contract.operation.presentation_and_binding_same_transaction === true, 'R129 split presentation from binding')
check(contract.operation.exact_retry_idempotent === true && contract.operation.first_binding_time_preserved === true, 'R129 retry contract drifted')
check(contract.operation.cross_workspace_rebind_denied === true && contract.operation.cross_owner_denied === true, 'R129 customer isolation drifted')
check(contract.authority.operator_roles_created === 0 && contract.authority.audience_grants_created === 0, 'R129 silently grants operator access')
check(contract.authority.decision_authority_granted === false && contract.authority.active_standard_mutated === false && contract.authority.notification_sent === false, 'R129 expanded owner authority')
check(contract.authority.production_writes === 0, 'R129 touched production')

check(candidate.includes('v_prepare_result := public.prepare_standard_change_review_v2('), 'R129 does not complete presentation in the same operation')
check(candidate.includes("raise exception 'standard_change_operator_projection_rebind_forbidden'"), 'R129 lost the immutable binding guard')
check(candidate.includes('operator_projection_bound_by = user_id'), 'R129 binding is not owned by the review owner')
check(candidate.includes("'operator_access_granted', false") && candidate.includes("'decision_authority_granted', false"), 'R129 implies operator or decision authority')
check(candidate.includes('grant execute on function public.prepare_and_bind_standard_change_operator_projection_v1') && candidate.includes('to authenticated'), 'R129 execute boundary drifted')
check(runner.includes('runNegativeControl') && runner.includes('mutated rebind guard still denied the attack'), 'R129 lacks the rebind mutation control')
check(runner.includes('roles_created: roleCount') && runner.includes('grants_created: grantCount'), 'R129 does not prove zero access grants')
check(runner.includes('first binding time') && runner.includes('partial_scope_denied'), 'R129 does not cover idempotency and all-or-none scope')
check(!candidate.includes('\u2014') && !runner.includes('\u2014'), 'R129 contains an em dash')

check(hash(contract.artifacts.candidate) === contract.artifacts.candidate_sha256, 'R129 candidate hash drifted')
check(hash(contract.artifacts.runner) === contract.artifacts.runner_sha256, 'R129 runner hash drifted')

if (failures.length) {
  console.error(`[g25-owner-operator-projection-binding-r129] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-owner-operator-projection-binding-r129] PASS: one owner action completes and immutably binds the useful projection without granting access')
