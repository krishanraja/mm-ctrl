import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const isolatedProjectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const linkedRef = readFileSync(join(root, 'supabase/.temp/project-ref'), 'utf8').trim()

if (linkedRef !== isolatedProjectRef || linkedRef === productionProjectRef) {
  throw new Error(`R126 requires the exact isolated project link, received ${linkedRef || 'none'}`)
}

const types = process.platform === 'win32'
  ? execFileSync(
      process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe',
      ['/d', '/s', '/c', 'npx supabase gen types typescript --linked --schema public,private'],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    )
  : execFileSync(
      'npx',
      ['supabase', 'gen', 'types', 'typescript', '--linked', '--schema', 'public,private'],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    )

const has = (value) => types.includes(value)
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const table of ['brain_workspaces', 'brain_workspace_roles', 'brain_audience_grants', 'standard_change_review_packets']) {
  check(has(`${table}: {`), `required table missing: ${table}`)
}
for (const column of ['workspace_kind: string', 'lifecycle_state: string', 'granted_at: string', 'expires_at: string | null']) {
  check(has(column), `required authority column missing: ${column}`)
}

check(!has('brain_operator_principals: {'), 'stable operator principals unexpectedly exist')
check(!has('brain_operator_auth_links: {'), 'stable operator auth links unexpectedly exist')
check(!has('brain_access_receipts: {'), 'Brain access receipts unexpectedly exist')
check(!has('operator_projection_audience:'), 'review projection audience unexpectedly exists')
check(!has('operator_projection_purpose:'), 'review projection purpose unexpectedly exists')
check(!has('get_operator_pending_standard_change_review_v1:'), 'operator review RPC unexpectedly exists')
check(has('get_pending_standard_change_review_v4:'), 'R123 owner-private queue RPC is missing')

if (failures.length) {
  console.error(`[g25-operator-catalogue-r126] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  project_ref: linkedRef,
  production_project_ref: productionProjectRef,
  production_writes: 0,
  catalogue_sha256: createHash('sha256').update(types).digest('hex'),
  existing_authority_spine: {
    brain_workspaces: true,
    brain_workspace_roles: true,
    brain_audience_grants: true,
    workspace_lifecycle: true,
    role_granted_at: true,
    audience_expiry: true,
  },
  existing_review_spine: {
    standard_change_review_packets: true,
    owner_private_queue_v4: true,
  },
  missing_runtime_slice: {
    stable_operator_principals: true,
    stable_operator_auth_links: true,
    packet_workspace_subject_projection_binding: true,
    brain_access_receipts: true,
    operator_review_rpc: true,
  },
  smallest_additive_identity_cut: [
    'private.brain_operator_principals',
    'private.brain_operator_auth_links',
  ],
  inspection: 'read_only_supabase_generated_types',
}, null, 2)}\n`)
