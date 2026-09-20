import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const isolatedProjectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const migrationVersion = '20260920190000'
const linkedRef = readFileSync(join(root, 'supabase/.temp/project-ref'), 'utf8').trim()

if (linkedRef !== isolatedProjectRef || linkedRef === productionProjectRef) {
  throw new Error(`R130 requires the exact isolated project link, received ${linkedRef || 'none'}`)
}

const runWindows = (command) => execFileSync(
  process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe',
  ['/d', '/s', '/c', command],
  { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
)
const types = process.platform === 'win32'
  ? runWindows('npx supabase gen types typescript --linked --schema public,private')
  : execFileSync('npx', ['supabase', 'gen', 'types', 'typescript', '--linked', '--schema', 'public,private'], {
      cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    })
const readbackRelativePath = 'supabase/tests/database/g25_owner_operator_projection_binding_r130_readback.sql'
const raw = process.platform === 'win32'
  ? runWindows(`npx supabase db query --linked --project-ref ${isolatedProjectRef} --output-format json --file ${readbackRelativePath}`)
  : execFileSync('npx', [
      'supabase', 'db', 'query', '--linked', '--project-ref', isolatedProjectRef,
      '--output-format', 'json', '--file', join(root, readbackRelativePath),
    ], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
const database = JSON.parse(raw).rows[0].result

const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}
const has = (value) => types.includes(value)

check(has('operator_projection_bound_at: string | null'), 'binding time column is missing')
check(has('operator_projection_bound_by: string | null'), 'binding owner column is missing')
check(has('prepare_and_bind_standard_change_operator_projection_v1:'), 'owner binding RPC is missing')
check(has('get_operator_pending_standard_change_review_v1:'), 'R127 operator queue was lost')
check(has('get_pending_standard_change_review_v4:'), 'R123 owner-private queue was lost')
check(database.binding_columns === 2, 'binding columns are not exact')
check(database.six_field_scope_constraint === true, 'six-field all-or-none constraint is missing')
check(database.authenticated_rpc_execute === true, 'authenticated owner cannot execute the binding RPC')
check(database.anonymous_rpc_execute === false, 'anonymous role can execute the binding RPC')
check(database.service_rpc_execute === false, 'service role can execute the binding RPC directly')
check(database.bound_packet_rows === 0, 'migration bound existing review packets')
check(database.r127_operator_tables === 2 && database.r127_operator_rpc === true, 'R127 operator membrane was damaged')
check(database.r123_owner_queue === true, 'R123 owner-private queue was damaged')
check(database.r115_tables === 5, 'R115 candidate conveyor tables were damaged')
check(database.migration_history_rows === 1, 'R130 migration history is not exact')

if (failures.length) {
  console.error(`[g25-owner-operator-projection-migration-r130] FAIL: ${failures.length} issue(s)`)
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
  operator_access_granted: false,
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
  hosted_fixture_residue: 0,
  inspection: 'isolated_catalogue_and_acl_readback',
}, null, 2)}\n`)
