import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'

const root = process.cwd()
const contract = JSON.parse(readFileSync(`${root}/project-documentation/ctrl-evolution/g25-consequential-migration-r145.json`, 'utf8'))
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const read = (relative) => readFileSync(`${root}/${relative}`, 'utf8')
const digest = (relative) => createHash('sha256').update(readFileSync(`${root}/${relative}`)).digest('hex')

check(contract.schema_version === 'ctrl.g25.consequential-migration.r145.v1', 'unexpected schema version')
check(contract.status === 'isolated_migration_replayed_twice_persisted_empty', 'unexpected status')
check(contract.isolated_project_ref === 'cgkcplcamsijghalintq', 'wrong isolated project')
check(contract.production_project_ref === 'bkyuxvschuwngtcdhsyg', 'wrong production project')
check(contract.production_contacted === false, 'production contact recorded')
check(contract.migration_version === '20260921100000', 'migration version changed')
check(contract.clean_replays === 2 && contract.rollback_zero_residue === true, 'two-replay rollback proof missing')
check(contract.final_state === 'applied_empty', 'isolated migration is not left applied and empty')
check(contract.catalogue_sha256 === '228f6d1df1a3b717b29a809212117fcadea0319fcb608bc4649dac17e4eee58d', 'catalogue digest drifted')

for (const [key, expected] of Object.entries({
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
})) check(contract.final_readback[key] === expected, `final readback drifted: ${key}`)

for (const name of ['candidate', 'migration', 'rollback', 'readback', 'probe', 'finding', 'qa']) {
  check(digest(contract.artifacts[name]) === contract.artifacts[`${name}_sha256`], `${name} hash mismatch`)
}
check(contract.artifacts.candidate_sha256 === contract.artifacts.migration_sha256, 'migration is not byte-identical to candidate')
check(read(contract.artifacts.candidate) === read(contract.artifacts.migration), 'migration payload differs from accepted candidate')

const migrationFiles = readdirSync(`${root}/supabase/migrations`).filter((name) => name.startsWith(`${contract.migration_version}_`))
check(migrationFiles.length === 1 && migrationFiles[0] === '20260921100000_consequential_work_spine.sql', 'migration version is missing or ambiguous')

const migration = read(contract.artifacts.migration)
const tables = [...migration.matchAll(/create table public\.([a-z0-9_]+)/gi)].map((match) => match[1])
const functions = [...migration.matchAll(/create or replace function\s+(?:private|public)\.([a-z0-9_]+)\s*\(/gi)].map((match) => match[1])
const triggers = [...migration.matchAll(/create trigger\s+([a-z0-9_]+)/gi)].map((match) => match[1])
check(tables.length === 14 && new Set(tables).size === 14, 'migration table inventory changed')
check(functions.length === 33 && new Set(functions).size === 32, 'migration routine inventory changed')
check(triggers.length === 49 && new Set(triggers).size === 49, 'migration trigger inventory changed')
check(!migration.includes('14200000-0000-4000-8000-000000000001'), 'migration contains canary fixture identity')

const rollback = read(contract.artifacts.rollback)
for (const table of tables) check(rollback.includes(`drop table if exists public.${table} cascade;`), `rollback misses table ${table}`)
for (const functionName of new Set(functions)) check(rollback.includes(`'${functionName}'`), `rollback misses routine ${functionName}`)
for (const indexName of ['brain_workspaces_scope_unique', 'brain_assertions_scope_unique']) {
  check(rollback.includes(`drop index if exists public.${indexName};`), `rollback misses shared index ${indexName}`)
}
check(rollback.startsWith('begin;') && rollback.trimEnd().endsWith('commit;'), 'rollback is not transactional')

const readback = read(contract.artifacts.readback)
for (const token of [
  "version = '20260921100000'",
  "has_table_privilege('service_role'",
  "has_function_privilege('authenticated'",
  "has_function_privilege('anon'",
  "has_function_privilege('service_role'",
  "sha256(convert_to",
  "('standard_change_requests')",
]) check(readback.includes(token), `readback misses ${token}`)

const probe = read(contract.artifacts.probe)
for (const token of [
  "linkedProjectRef !== isolatedProjectRef",
  "linkedProjectRef === productionProjectRef",
  "candidateSha256 !== migrationSha256",
  "queryFile(migrationPath)",
  "queryFile(canaryPath)",
  "queryFile(rollbackPath)",
  "repair('applied')",
  "repair('reverted')",
  "requireState(rolledBack, absentState, 'rollback')",
  "first.catalogue_sha256 !== second.catalogue_sha256",
  "production_contacted: false",
]) check(probe.includes(token), `probe misses ${token}`)
check(probe.split('queryFile(migrationPath)').length - 1 === 2, 'probe does not perform exactly two clean applications')
check(probe.split('queryFile(canaryPath)').length - 1 === 2, 'probe does not run the canary after both applications')

if (failures.length) {
  console.error(`[g25-consequential-migration-r145] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-consequential-migration-r145] PASS: exact migration replayed twice, rollback reached zero residue, isolated state is applied and empty')
