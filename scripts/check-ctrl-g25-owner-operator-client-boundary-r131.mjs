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

const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-owner-operator-client-boundary-r131.json'))
const owner = read(contract.artifacts.owner_adapter)
const operator = read(contract.artifacts.operator_adapter)
const ownerTests = read(contract.artifacts.owner_tests)
const operatorTests = read(contract.artifacts.operator_tests)

check(contract.status === 'strict_client_boundary_passed', 'R131 status drifted')
check(contract.owner_adapter.rpc === 'prepare_and_bind_standard_change_operator_projection_v1', 'R131 owner RPC drifted')
check(contract.operator_adapter.rpc === 'get_operator_pending_standard_change_review_v1', 'R131 operator RPC drifted')
check(contract.operator_adapter.allowed_item_fields.length === 5, 'R131 operator item is not five fields')
check(contract.operator_adapter.raw_packet_allowed === false && contract.operator_adapter.hash_allowed === false, 'R131 permits private operator material')
check(contract.operator_adapter.private_denial_reason_allowed === false, 'R131 leaks private denial reasons')
check(contract.owner_adapter.operator_access_granted === false && contract.owner_adapter.decision_authority_granted === false, 'R131 owner binding expands authority')
check(contract.verification.targeted_tests_passed === 10 && contract.verification.new_type_errors === 0, 'R131 verification count drifted')
check(contract.verification.customer_surface_changed === false && contract.verification.production_writes === 0, 'R131 changed a closed surface or production')

check(owner.includes("'prepare_and_bind_standard_change_operator_projection_v1'"), 'R131 owner adapter does not call the exact RPC')
check(owner.includes('.strict()') && owner.includes('workspace_id !== parsedInput.data.workspaceId'), 'R131 owner adapter does not reject drift and substitution')
check(operator.includes("'get_operator_pending_standard_change_review_v1'"), 'R131 operator adapter does not call the exact RPC')
check(operator.includes("reason: z.literal('not_available')"), 'R131 operator adapter exposes private denial reasons')
check(operator.includes('.strict()') && operator.includes("decision_authority_granted: z.literal(false)"), 'R131 operator adapter is not strict about authority')
check(ownerTests.includes('extra private material') && ownerTests.includes('another workspace'), 'R131 owner attacks are incomplete')
check(operatorTests.includes('packet or hash smuggled') && operatorTests.includes('private denial reason'), 'R131 operator attacks are incomplete')
check(!owner.includes('\u2014') && !operator.includes('\u2014'), 'R131 contains an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R131 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R131 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-owner-operator-client-boundary-r131] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-owner-operator-client-boundary-r131] PASS: the client accepts one owner action and one five-field operator view, nothing broader')
