import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const isolatedProjectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const migrationVersion = '20260921100000'
const linkedProjectRef = readFileSync(path.join(root, 'supabase/.temp/project-ref'), 'utf8').trim()
const candidatePath = 'supabase/candidates/g25_consequential_work_spine_r142.sql'
const migrationPath = 'supabase/migrations/20260921100000_consequential_work_spine.sql'
const rollbackPath = 'scripts/rollback-ctrl-g25-consequential-work-spine-r145.sql'
const readbackPath = 'supabase/tests/database/g25_consequential_work_spine_r145_readback.sql'
const canaryPath = 'supabase/tests/database/g25_consequential_work_spine_r142.test.sql'

if (linkedProjectRef !== isolatedProjectRef || linkedProjectRef === productionProjectRef) {
  throw new Error(`R145 refuses linked project ${linkedProjectRef || '<missing>'}`)
}

const digest = (relativePath) => createHash('sha256')
  .update(readFileSync(path.join(root, relativePath)))
  .digest('hex')

const candidateSha256 = digest(candidatePath)
const migrationSha256 = digest(migrationPath)
if (candidateSha256 !== migrationSha256) {
  throw new Error('R145 migration payload is not byte-identical to the accepted R142 candidate')
}

const npxCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js')
function runCli(args, { allowFailure = false } = {}) {
  const result = spawnSync(process.execPath, [npxCli, 'supabase', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  })
  if (!allowFailure && result.status !== 0) {
    throw new Error(`R145 Supabase command failed (${args.join(' ')}):\n${result.stderr}\n${result.stdout}`)
  }
  return result
}

function queryFile(relativePath) {
  return runCli([
    'db', 'query', '--linked', '--project-ref', isolatedProjectRef,
    '--output-format', 'json', '--file', relativePath,
  ])
}

function readback() {
  const output = queryFile(readbackPath).stdout
  const parsed = JSON.parse(output)
  return parsed.rows[0].result
}

function repair(status, { allowFailure = false } = {}) {
  return runCli([
    'migration', 'repair', migrationVersion, '--status', status,
    '--linked', '--project-ref', isolatedProjectRef, '--yes', '--output-format', 'json',
  ], { allowFailure })
}

function requireState(actual, expected, label) {
  const failures = []
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) failures.push(`${key}: expected ${JSON.stringify(value)}, received ${JSON.stringify(actual[key])}`)
  }
  if (failures.length) throw new Error(`R145 ${label} readback failed:\n- ${failures.join('\n- ')}`)
}

const absentState = {
  candidate_tables: 0,
  candidate_routines: 0,
  candidate_triggers: 0,
  rls_enabled_tables: 0,
  rls_forced_tables: 0,
  candidate_rows: 0,
  shared_scope_indexes: 0,
  service_select_tables: 0,
  service_insert_tables: 0,
  ordinary_table_privileges: 0,
  authenticated_rpc_execute: false,
  anonymous_rpc_execute: false,
  service_rpc_execute: false,
  migration_history_rows: 0,
  r115_tables: 5,
}

const appliedState = {
  candidate_tables: 14,
  candidate_routines: 33,
  candidate_triggers: 49,
  rls_enabled_tables: 14,
  rls_forced_tables: 14,
  candidate_rows: 0,
  shared_scope_indexes: 2,
  service_select_tables: 14,
  service_insert_tables: 12,
  ordinary_table_privileges: 0,
  authenticated_rpc_execute: false,
  anonymous_rpc_execute: false,
  service_rpc_execute: true,
  migration_history_rows: 1,
  r115_tables: 5,
}

let finalApplied = false
const passes = []
try {
  const initial = readback()
  requireState(initial, absentState, 'initial zero-residue')

  queryFile(migrationPath)
  repair('applied')
  queryFile(canaryPath)
  const first = readback()
  requireState(first, appliedState, 'first replay')
  passes.push({ replay: 1, catalogue_sha256: first.catalogue_sha256 })

  queryFile(rollbackPath)
  repair('reverted')
  const rolledBack = readback()
  requireState(rolledBack, absentState, 'rollback')

  queryFile(migrationPath)
  repair('applied')
  queryFile(canaryPath)
  const second = readback()
  requireState(second, appliedState, 'second replay')
  passes.push({ replay: 2, catalogue_sha256: second.catalogue_sha256 })

  if (first.catalogue_sha256 !== second.catalogue_sha256) {
    throw new Error('R145 catalogue changed between clean replays')
  }
  finalApplied = true

  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    project_ref: isolatedProjectRef,
    production_project_ref: productionProjectRef,
    production_contacted: false,
    migration_version: migrationVersion,
    candidate_sha256: candidateSha256,
    migration_sha256: migrationSha256,
    clean_replays: 2,
    rollback_zero_residue: true,
    final_state: 'applied_empty',
    catalogue_sha256: second.catalogue_sha256,
    passes,
    final_readback: second,
  }, null, 2)}\n`)
} catch (error) {
  if (!finalApplied) {
    queryFile(rollbackPath)
    repair('reverted', { allowFailure: true })
    const cleanup = readback()
    requireState(cleanup, absentState, 'failure cleanup')
  }
  throw error
}
