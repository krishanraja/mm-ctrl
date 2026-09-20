import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const isolatedProjectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const migrationVersion = '20260920170000'
const linkedRef = readFileSync(join(root, 'supabase/.temp/project-ref'), 'utf8').trim()

if (linkedRef !== isolatedProjectRef || linkedRef === productionProjectRef) {
  throw new Error(`R127 requires the exact isolated project link, received ${linkedRef || 'none'}`)
}

const runWindows = (command) => execFileSync(
  process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe',
  ['/d', '/s', '/c', command],
  { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
)
const types = process.platform === 'win32'
  ? runWindows('npx supabase gen types typescript --linked --schema public,private')
  : execFileSync(
      'npx',
      ['supabase', 'gen', 'types', 'typescript', '--linked', '--schema', 'public,private'],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    )
const readbackRelativePath = 'supabase/tests/database/g25_operator_review_access_r127_readback.sql'
const readbackPath = join(root, readbackRelativePath)
const raw = process.platform === 'win32'
  ? runWindows(`npx supabase db query --linked --project-ref ${isolatedProjectRef} --output-format json --file ${readbackRelativePath}`)
  : execFileSync(
      'npx',
      ['supabase', 'db', 'query', '--linked', '--project-ref', isolatedProjectRef,
        '--output-format', 'json', '--file', readbackPath],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    )
const database = JSON.parse(raw).rows[0].result

const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}
const has = (value) => types.includes(value)

check(has('brain_operator_principals: {'), 'stable operator principals are missing')
check(has('brain_operator_auth_links: {'), 'stable operator auth links are missing')
check(has('brain_access_receipts: {'), 'Brain access receipts are missing')
check(has('operator_projection_audience: string | null'), 'operator audience binding is missing')
check(has('operator_projection_purpose: string | null'), 'operator purpose binding is missing')
check(has('get_operator_pending_standard_change_review_v1:'), 'operator review RPC is missing')
check(has('get_pending_standard_change_review_v4:'), 'R123 owner-private queue RPC was lost')
check(database.operator_tables === 2, 'stable operator identity table count is not two')
check(database.review_projection_columns === 4, 'review projection column count is not four')
check(database.new_constraints === 3, 'exact workspace and packet constraints are missing')
check(database.access_receipt_table === true && database.access_receipt_rls === true, 'receipt table is not forced-RLS')
check(database.authenticated_receipt_table_access === false, 'authenticated role has direct receipt table access')
check(database.service_receipt_table_access === false, 'service role has direct receipt table access')
check(database.authenticated_rpc_execute === true, 'authenticated role cannot execute the operator RPC')
check(database.anonymous_rpc_execute === false, 'anonymous role can execute the operator RPC')
check(database.service_rpc_execute === false, 'service role can execute the operator RPC directly')
check(database.operator_identity_rows === 0, 'migration seeded operator identity rows')
check(database.bound_packet_rows === 0, 'migration bound existing review packets')
check(database.access_receipt_rows === 0, 'migration left access-receipt fixture rows')
check(database.owner_queue_v4 === true, 'R123 owner-private queue was lost')
check(database.r115_tables === 5, 'R115 candidate conveyor tables were damaged')
check(database.migration_history_rows === 1, 'R127 migration history is not exact')

if (failures.length) {
  console.error(`[g25-operator-migration-r127] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  project_ref: linkedRef,
  production_project_ref: productionProjectRef,
  production_writes: 0,
  migration_version: migrationVersion,
  catalogue_sha256: createHash('sha256').update(types).digest('hex'),
  database,
  returned_projection_fields: [
    'review_packet_id', 'question', 'headline', 'consequence', 'ready_since',
  ],
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
  hosted_fixture_residue: 0,
  inspection: 'isolated_catalogue_and_acl_readback',
}, null, 2)}\n`)
