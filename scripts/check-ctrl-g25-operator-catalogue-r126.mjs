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

const r125 = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-access-postgres-r125.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-catalogue-r126.json'))
const probe = read('scripts/probe-ctrl-g25-operator-catalogue-r126.mjs')

check(contract.depends_on.includes(r125.contract_id), 'R126 does not preserve the R125 database candidate')
check(contract.status === 'isolated_catalogue_read_smallest_identity_cut_confirmed', 'R126 overclaims a schema change')
check(contract.target.project_ref === 'cgkcplcamsijghalintq', 'R126 target is not the isolated project')
check(contract.target.production_project_ref === 'bkyuxvschuwngtcdhsyg' && contract.target.production_writes === 0, 'R126 production boundary drifted')
check(contract.smallest_additive_identity_cut.length === 2, 'R126 imports more than the smallest identity cut')
check(contract.smallest_additive_identity_cut.includes('private.brain_operator_principals'), 'stable operator principal table is missing from the cut')
check(contract.smallest_additive_identity_cut.includes('private.brain_operator_auth_links'), 'stable operator auth-link table is missing from the cut')
check(probe.includes("linkedRef !== isolatedProjectRef || linkedRef === productionProjectRef"), 'probe does not fail closed on project identity')
check(probe.includes("'supabase', 'gen', 'types', 'typescript', '--linked'"), 'probe does not use a read-only catalogue source')
check(probe.includes("!has('brain_operator_principals: {')"), 'probe does not verify the stable principal gap')
check(probe.includes("!has('brain_access_receipts: {')"), 'probe does not verify the receipt gap')
check(probe.includes("has('get_pending_standard_change_review_v4:')"), 'probe does not verify the R123 base')
check(!probe.includes('SUPABASE_ACCESS_TOKEN') && !probe.includes('PGPASSWORD'), 'probe contains a credential path')
check(!probe.includes('\u2014'), 'R126 probe contains an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R126 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R126 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-operator-catalogue-r126] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-catalogue-r126] PASS: isolated catalogue confirms the existing authority spine and the two-table stable operator identity gap without a database write')
