import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex')
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-access-r124.json'))
const r123 = JSON.parse(read('project-documentation/ctrl-evolution/g25-pending-review-queue-r123.json'))
const evaluator = read('src/features/standard-review/operatorAccess.ts')
const tests = read('src/features/standard-review/operatorAccess.test.ts')
const brainSchema = read('supabase/migrations/20260908111121_brain_workspace_audience_canary.sql')
const reviewSchema = read('supabase/migrations/20260919110000_standard_change_owner_apply_reversal.sql')
const experienceReceipt = JSON.parse(read('project-documentation/ctrl-evolution/runs/g24-experience-g25-operator-review-access-r124/receipt.json'))

check(contract.depends_on.includes(r123.contract_id), 'R124 does not preserve the R123 dependency')
check(contract.status === 'headless_authority_contract_frozen_runtime_closed', 'R124 overclaims runtime access')
check(contract.reuses.existing_tables.includes('brain_workspace_roles'), 'R124 invents a second workspace membership system')
check(contract.reuses.existing_tables.includes('brain_audience_grants'), 'R124 invents a second audience grant system')
check(contract.schema_decisions.extend_in_place === 'standard_change_review_packets', 'R124 does not extend the review packet in place')
check(contract.schema_decisions.single_new_concept === 'brain_access_receipts', 'R124 does not define one general access receipt concept')
check(brainSchema.includes("role in ('owner', 'operator', 'contributor', 'viewer', 'approver')"), 'existing Brain schema no longer contains the operator role')
check(brainSchema.includes("'delivery_team_private'"), 'existing Brain schema no longer contains the delivery-team audience')
check(!reviewSchema.match(/standard_change_review_packets[\s\S]{0,2500}workspace_id/), 'R124 gap changed: review packets already appear workspace-bound')
check(evaluator.includes("OPERATOR_REVIEW_AUDIENCE = 'delivery_team_private'"), 'evaluator audience drifted')
check(evaluator.includes("OPERATOR_REVIEW_PURPOSE = 'standard_change_review_preparation'"), 'evaluator purpose drifted')
check(evaluator.includes("role.grantedBy !== input.workspace.ownerId"), 'operator role is not customer-owner granted')
check(evaluator.includes("grant.grantedBy !== input.workspace.ownerId"), 'audience grant is not customer-owner granted')
check(evaluator.includes('audience_grant_expiry_required') && evaluator.includes('audience_grant_expired'), 'finite grant expiry is not enforced')
check(evaluator.includes("capability: 'read_operator_safe_review_projection'"), 'allowed capability is not narrowly read-only')
check(evaluator.includes('decisionAuthorityGranted: false'), 'operator access can imply decision authority')
check(evaluator.includes('notificationSent: false'), 'operator access can imply notification')
check(evaluator.includes("publicReason: 'not_available'"), 'denials can reveal private resource existence')
check(tests.includes("it.each(deniedCases)"), 'adversarial access matrix is missing')
check((tests.match(/name: '/g) ?? []).length === 17, 'adversarial access matrix does not contain seventeen cases')
check(experienceReceipt.status === 'preflight' && experienceReceipt.approval_claims.length === 0, 'headless R124 experience receipt overclaims approval')
check(experienceReceipt.changed_surface_files.length === 1 && experienceReceipt.changed_surface_files[0] === 'src/features/standard-review/operatorAccess.ts', 'headless R124 experience receipt has the wrong surface boundary')
check(!`${evaluator}\n${tests}`.includes('service_role'), 'browser contract mentions service-role access')
check(!`${evaluator}\n${tests}`.includes('\u2014'), 'R124 executable artifacts contain an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R124 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R124 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-operator-review-access-r124] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-review-access-r124] PASS: operator review access is exact, finite, owner-granted, receipted and read-only while runtime access remains closed')
