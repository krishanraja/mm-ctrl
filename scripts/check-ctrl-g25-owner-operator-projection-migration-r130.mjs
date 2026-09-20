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

const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-owner-operator-projection-migration-r130.json'))
const migration = read(contract.artifacts.migration)
const hostedProbe = read(contract.artifacts.hosted_probe)
const rollback = read(contract.artifacts.rollback_sql)

check(contract.status === 'isolated_owner_to_operator_lifecycle_passed_zero_residue', 'R130 status drifted')
check(contract.target.project_ref === 'cgkcplcamsijghalintq', 'R130 target is not the isolated project')
check(contract.target.production_project_ref === 'bkyuxvschuwngtcdhsyg' && contract.target.production_writes === 0, 'R130 production boundary drifted')
check(contract.migration.rollback_rehearsed === true && contract.migration.restore_rehearsed === true, 'R130 recovery was not rehearsed')
check(contract.migration.r115_tables_preserved === 5 && contract.migration.r123_owner_queue_preserved === true && contract.migration.r127_operator_membrane_preserved === true, 'R130 damaged a predecessor')
check(contract.hosted.presentation_and_binding_same_transaction === true, 'R130 split owner preparation from binding')
check(contract.hosted.exact_retry_idempotent === true && contract.hosted.first_binding_time_preserved === true, 'R130 idempotency drifted')
check(contract.hosted.cross_workspace_rebind_denied === true && contract.hosted.cross_owner_denied === true, 'R130 customer isolation drifted')
check(contract.hosted.roles_created_by_binding === 0 && contract.hosted.grants_created_by_binding === 0, 'R130 binding silently granted access')
check(contract.hosted.returned_fields.length === 5 && contract.hosted.raw_packet_returned === false && contract.hosted.direct_raw_packet_hidden === true, 'R130 operator projection expanded')
check(contract.hosted.operator_decision_status === 404 && contract.hosted.owner_standard_unchanged === true, 'R130 operator gained owner authority')
check(Object.values(contract.cleanup).every((value) => value === 0), 'R130 hosted fixture residue is not zero')

check(migration.includes('operator_projection_bound_by = user_id'), 'R130 owner binding constraint drifted')
check(migration.includes('v_prepare_result := public.prepare_standard_change_review_v2('), 'R130 no longer completes presentation atomically')
check(migration.includes("raise exception 'standard_change_operator_projection_rebind_forbidden'"), 'R130 lost the immutable rebind guard')
check(hostedProbe.includes("projectRef = 'cgkcplcamsijghalintq'") && hostedProbe.includes("productionProjectRef = 'bkyuxvschuwngtcdhsyg'"), 'R130 hosted probe is not hard-pinned away from production')
check(hostedProbe.includes("rest(\n    'rpc/prepare_and_bind_standard_change_operator_projection_v1'"), 'R130 hosted probe does not use the owner RPC')
check(hostedProbe.includes("rest('rpc/get_operator_pending_standard_change_review_v1'"), 'R130 hosted probe does not cross the operator membrane')
check(hostedProbe.includes("invoke('review-standard-change'"), 'R130 hosted probe does not attack owner decision authority')
check(hostedProbe.includes('Object.values(cleanup).some'), 'R130 hosted probe does not fail on fixture residue')
check(rollback.includes('drop function if exists public.prepare_and_bind_standard_change_operator_projection_v1') && rollback.includes('drop column if exists operator_projection_bound_by'), 'R130 rollback is incomplete')
check(!migration.includes('\u2014') && !hostedProbe.includes('\u2014'), 'R130 contains an em dash')
check(!hostedProbe.includes('console.log(password)') && !hostedProbe.includes('console.log(publishableKey)'), 'R130 hosted probe prints transient credentials')
check(!hostedProbe.includes('SUPABASE_ACCESS_TOKEN') && !hostedProbe.includes('PGPASSWORD'), 'R130 hosted probe contains a credential path')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R130 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R130 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-owner-operator-projection-migration-r130] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-owner-operator-projection-migration-r130] PASS: one owner action feeds the five-field operator queue without granting decision authority')
