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

const r126 = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-catalogue-r126.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-migration-r127.json'))
const migration = read('supabase/migrations/20260920170000_standard_change_operator_review_access.sql')
const probe = read('scripts/probe-ctrl-g25-operator-migration-r127.mjs')
const rollback = read('scripts/rollback-ctrl-g25-operator-review-access-r127.ps1')
const restore = read('scripts/restore-ctrl-g25-operator-review-access-r127.ps1')

check(contract.depends_on.includes(r126.contract_id), 'R127 does not preserve the R126 catalogue decision')
check(contract.status === 'isolated_migration_applied_rollback_restored', 'R127 status overclaims hosted behavioural proof')
check(contract.target.project_ref === 'cgkcplcamsijghalintq', 'R127 target is not the isolated project')
check(contract.target.production_project_ref === 'bkyuxvschuwngtcdhsyg' && contract.target.production_writes === 0, 'R127 production boundary drifted')
check(contract.migration.version === '20260920170000', 'R127 migration version drifted')
check(contract.live_readback.operator_tables === 2, 'R127 live identity table count is not two')
check(contract.live_readback.review_projection_columns === 4, 'R127 live projection column count is not four')
check(contract.live_readback.new_constraints === 3, 'R127 live constraint count is not three')
check(contract.live_readback.migration_history_rows === 1, 'R127 history row is not exact')
check(contract.live_readback.operator_identity_rows === 0 && contract.live_readback.bound_packet_rows === 0 && contract.live_readback.access_receipt_rows === 0, 'R127 left fixture residue')
check(contract.rollback.operator_tables === 0 && contract.rollback.review_projection_columns === 0 && contract.rollback.migration_history_rows === 0, 'R127 rollback was not clean')
check(contract.rollback.r115_preserved === true && contract.rollback.r123_owner_queue_preserved === true, 'R127 rollback damaged predecessor machinery')
check(contract.projection.returned_fields.length === 5 && !contract.projection.returned_fields.includes('packet'), 'R127 operator projection is not the five-field allowlist')
check(contract.authority.decision_authority_granted === false && contract.authority.active_standard_mutated === false && contract.authority.notification_sent === false, 'R127 read path implies authority, mutation or notification')

for (const table of ['brain_operator_principals', 'brain_operator_auth_links']) {
  check(migration.includes(`private.${table}`), `R127 migration is missing ${table}`)
}
for (const forbidden of ['brain_custody_assignments', 'brain_historical_principals', 'brain_subject_principals']) {
  check(!migration.includes(forbidden), `R127 imported out-of-scope identity machinery: ${forbidden}`)
}
check(migration.includes('operator_projection_audience') && migration.includes('operator_projection_purpose'), 'R127 migration is missing exact projection bindings')
check(migration.includes('standard_change_review_packets_operator_scope_all_or_none'), 'R127 migration does not keep legacy packets owner-only')
check(migration.includes('alter table public.brain_access_receipts force row level security'), 'R127 access receipts are not forced-RLS')
check(migration.includes('revoke all on table public.brain_access_receipts from public, anon, authenticated, service_role'), 'R127 receipts retain a direct table path')
check(migration.includes('grant execute on function public.get_operator_pending_standard_change_review_v1(uuid)\n  to authenticated'), 'R127 RPC is not authenticated-only')
check(migration.includes("'delivery_team_private'") && migration.includes("'standard_change_review_preparation'"), 'R127 exact audience-purpose pair drifted')
check(migration.includes("'materiality_inferred', false"), 'R127 queue invents materiality')
check(migration.includes("'decision_authority_granted', false") && migration.includes("'active_standard_mutated', false") && migration.includes("'notification_sent', false"), 'R127 response or receipt omits authority denials')
check(!migration.includes('\u2014'), 'R127 migration contains an em dash')

for (const source of [probe, rollback, restore]) {
  check(source.includes('cgkcplcamsijghalintq') && source.includes('bkyuxvschuwngtcdhsyg'), 'R127 operator is not hard-pinned away from production')
  check(!source.includes('SUPABASE_ACCESS_TOKEN') && !source.includes('PGPASSWORD'), 'R127 operator contains a credential path')
  check(!source.includes('\u2014'), 'R127 operator contains an em dash')
}
check(probe.includes('hosted_fixture_residue: 0'), 'R127 probe does not report zero fixture residue')
check(rollback.includes("'rolled_back'"), 'R127 rollback operator is incomplete')
check(restore.includes("'restored'"), 'R127 restore operator is incomplete')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R127 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R127 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-operator-review-migration-r127] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-review-migration-r127] PASS: isolated schema, ACL, rollback and restore preserve the five-field read-only operator boundary with zero fixture residue')
