import { readFile } from 'node:fs/promises'

const migrationPath = new URL('../supabase/migrations/20260908111121_brain_workspace_audience_canary.sql', import.meta.url)
const hardeningPath = new URL('../supabase/migrations/20260908112440_brain_anonymous_session_and_fk_hardening.sql', import.meta.url)
const initPlanPath = new URL('../supabase/migrations/20260908112746_brain_rls_initplan_hardening.sql', import.meta.url)
const testPath = new URL('../supabase/tests/database/brain_workspace_audience_canary.test.sql', import.meta.url)
const migration = await readFile(migrationPath, 'utf8')
const hardening = await readFile(hardeningPath, 'utf8')
const initPlan = await readFile(initPlanPath, 'utf8')
const test = await readFile(testPath, 'utf8')

let failures = 0
const check = (message, condition) => {
  if (condition) console.log(`PASS ${message}`)
  else {
    failures += 1
    console.error(`FAIL ${message}`)
  }
}

const tables = [
  'brain_workspaces',
  'brain_workspace_roles',
  'brain_audience_grants',
  'brain_sources',
  'brain_assertions',
  'brain_items',
  'brain_item_versions',
  'brain_item_version_assertions',
  'brain_relationships',
  'brain_relationship_versions',
  'brain_relationship_version_assertions',
]

for (const table of tables) {
  check(`${table} exists in the migration`, migration.includes(`create table public.${table}`))
  check(`${table} enables RLS`, migration.includes(`alter table public.${table} enable row level security`))
  check(`${table} forces RLS`, migration.includes(`alter table public.${table} force row level security`))
  check(`${table} revokes broad browser access`, migration.includes(`revoke all on table public.${table} from anon, authenticated`))
  check(`${table} grants authenticated read only`, migration.includes(`grant select on table public.${table} to authenticated`))
}

check('anon receives no Brain table grant', !/grant\s+\w[\s\S]{0,80}brain_\w+\s+to\s+anon/i.test(migration))
check('authenticated receives no Brain write grant', !/grant\s+(?:insert|update|delete|all)[\s\S]{0,80}brain_\w+\s+to\s+authenticated/i.test(migration))
check('workspace access requires active membership', migration.includes('role_row.revoked_at is null'))
check('content access requires an active audience grant', migration.includes('grant_row.audience = brain_sources.audience') && migration.includes('grant_row.expires_at > now()'))
check('anonymous-auth sessions fail closed in every Brain policy', (hardening.match(/is_anonymous/g) || []).length === tables.length)
check('JWT policy checks are initialized once per statement', (initPlan.match(/select auth\.jwt\(\)/g) || []).length === tables.length)
check('anonymous-auth closure is exercised transactionally', test.includes('Anonymous-auth session did not fail closed'))
check('live advisor foreign-key findings have covering indexes', (hardening.match(/create index brain_/g) || []).length === 18)
check('sources and assertions are encrypted at rest', migration.includes('content_ciphertext text') && migration.includes('statement_ciphertext text not null'))
check('one current item version is enforced', migration.includes('brain_item_versions_one_current'))
check('one current relationship version is enforced', migration.includes('brain_relationship_versions_one_current'))
check('current relationships require current endpoints', migration.includes('Current Brain relationships require current endpoint versions'))
check('item evidence cannot widen audience', migration.includes('Brain item evidence cannot cross workspace or audience boundaries'))
check('relationship evidence cannot widen audience', migration.includes('Brain relationship evidence cannot cross workspace or audience boundaries'))
check('held and trusted items require support', migration.includes('Current held or trusted Brain item versions require supporting evidence'))
check('every semantic relationship requires evidence', migration.includes('Brain relationship versions require evidence'))
check('migration does not mutate legacy memory or decision rows', !/(insert\s+into|update|delete\s+from)\s+public\.(user_memory|memory_edges|decision_cases|decision_evidence)/i.test(migration))
check('test is transactional and leaves no residue', test.trimStart().startsWith('begin;') && test.trimEnd().endsWith('rollback;'))
check('test covers owner, operator, second workspace and grant-only identities', ['Subject A audience boundary failed', 'Operator audience boundary failed', 'Subject B workspace boundary failed', 'Audience grant without workspace membership did not fail closed'].every((value) => test.includes(value)))
check('test covers authenticated and anonymous write/read closure', test.includes('Authenticated write unexpectedly succeeded') && test.includes("has_table_privilege('anon'"))
check('test covers the evidence audience ceiling', test.includes('Cross-audience item evidence unexpectedly succeeded'))
check('migrations and test contain no em dash', !migration.includes('—') && !hardening.includes('—') && !initPlan.includes('—') && !test.includes('—'))

if (failures > 0) {
  console.error(`Brain canary contract failed with ${failures} issue(s).`)
  process.exit(1)
}

console.log(`Brain canary contract passed for ${tables.length} fail-closed tables.`)
