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

const r127 = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-migration-r127.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-hosted-lifecycle-r128.json'))
const probe = read('scripts/probe-ctrl-g25-operator-hosted-lifecycle-r128.mjs')

check(contract.depends_on.includes(r127.contract_id), 'R128 does not preserve the R127 migration boundary')
check(contract.status === 'isolated_authenticated_lifecycle_passed_zero_residue', 'R128 status drifted')
check(contract.target.project_ref === 'cgkcplcamsijghalintq', 'R128 target is not the isolated project')
check(contract.target.production_project_ref === 'bkyuxvschuwngtcdhsyg' && contract.target.production_writes === 0, 'R128 production boundary drifted')
check(contract.hosted.real_owner_candidate_conveyor === true, 'R128 used a demo-only review packet')
check(contract.hosted.allowed_http_status === 200 && contract.hosted.ready_count === 1, 'R128 did not prove one allowed hosted projection')
check(contract.hosted.returned_fields.length === 5 && !contract.hosted.returned_fields.includes('packet'), 'R128 returned more than the five-field allowlist')
check(contract.hosted.raw_packet_returned === false && contract.hosted.direct_raw_packet_hidden === true, 'R128 exposed the raw owner packet')
check(contract.hosted.direct_receipt_table_hidden === true, 'R128 exposed private access receipts')
check(contract.hosted.operator_decision_status === 404, 'R128 operator gained owner decision authority')
check(contract.hosted.cross_workspace.public_reason === 'not_available' && contract.hosted.cross_workspace.private_reason === 'operator_role_missing', 'R128 cross-workspace refusal lost public/private separation')
check(contract.hosted.revocation.public_reason === 'not_available' && contract.hosted.revocation.private_reason === 'audience_grant_revoked', 'R128 revocation did not take effect immediately')
check(contract.hosted.receipts.count === 3 && contract.hosted.receipts.hashes_valid === true, 'R128 receipts are incomplete or invalid')
check(contract.hosted.owner_standard_unchanged === true && contract.authority.active_standard_mutated === false, 'R128 mutated owner state')
check(Object.values(contract.cleanup).every((value) => value === 0), 'R128 fixture residue is not zero')

check(probe.includes("projectRef = 'cgkcplcamsijghalintq'") && probe.includes("productionProjectRef = 'bkyuxvschuwngtcdhsyg'"), 'R128 probe is not hard-pinned away from production')
check(probe.includes('probe-ctrl-g25-standard-change-owner-r116.mjs'), 'R128 probe does not use the real owner candidate conveyor')
check(probe.includes("rest('rpc/prepare_standard_change_review_v2'"), 'R128 probe does not require the complete human presentation')
check(probe.includes("rest('rpc/get_operator_pending_standard_change_review_v1'"), 'R128 probe does not use the hosted operator RPC')
check(probe.includes("invoke('review-standard-change'"), 'R128 probe does not attack owner decision authority')
check(probe.includes("'allowed', 'operator_role_missing', 'audience_grant_revoked'"), 'R128 probe does not verify exact private receipt reasons')
check(probe.includes('rawPacketHidden') && probe.includes('receiptTableHidden'), 'R128 probe does not test direct-table secrecy')
check(probe.includes('Object.values(cleanup).some'), 'R128 probe does not fail on fixture residue')
check(!probe.includes('console.log(password)') && !probe.includes('console.log(publishableKey)'), 'R128 probe prints transient credentials')
check(!probe.includes('SUPABASE_ACCESS_TOKEN') && !probe.includes('PGPASSWORD'), 'R128 probe contains a credential path')
check(!probe.includes('\u2014'), 'R128 probe contains an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R128 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R128 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-operator-hosted-lifecycle-r128] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-hosted-lifecycle-r128] PASS: the exact operator sees five useful fields, cannot decide, loses access immediately and leaves zero hosted fixture residue')
