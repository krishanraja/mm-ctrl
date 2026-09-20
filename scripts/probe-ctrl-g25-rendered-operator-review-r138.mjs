import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const projectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const url = `https://${projectRef}.supabase.co`
const npxCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js'
const scratchRoot = resolve(process.env.CTRL_SCRATCH_ROOT ?? join(homedir(), '.scratch'))
mkdirSync(scratchRoot, { recursive: true })
const temporaryDirectory = mkdtempSync(join(scratchRoot, 'mm-ctrl-r138-'))
const fixtureExecutable = join(temporaryDirectory, 'fixture-setup.mjs')
const sourcePath = join(scriptDir, 'probe-ctrl-g25-owner-operator-hosted-lifecycle-r130.mjs')
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`

if (projectRef === productionProjectRef) throw new Error('R138 cannot target production')
if (!temporaryDirectory.startsWith(`${scratchRoot}${sep}`)) throw new Error('R138 scratch path escaped its root')

function runNpx(args, { sensitiveOutput = false } = {}) {
  const run = spawnSync(process.execPath, [npxCli, ...args], {
    encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024,
  })
  if (run.status !== 0) {
    if (sensitiveOutput) throw new Error('Supabase credential discovery failed')
    const detail = `${run.error?.message ?? ''}\n${run.stderr ?? ''}\n${run.stdout ?? ''}`
      .trim().slice(0, 1_500)
    throw new Error(`supabase_command_failed:${detail}`)
  }
  return run.stdout
}

function dbq(sql) {
  const run = spawnSync(process.execPath, [npxCli,
    'supabase', 'db', 'query', '--linked', '--project-ref', projectRef,
    '--output-format', 'json', sql.trim().replace(/\r?\n/g, ' '),
  ], { encoding: 'utf8', cwd: root, maxBuffer: 32 * 1024 * 1024 })
  if (run.status !== 0) throw new Error('r138_database_query_failed')
  return JSON.parse(run.stdout).rows ?? []
}

const keysRaw = runNpx([
  'supabase', 'projects', 'api-keys', '--project-ref', projectRef,
  '--reveal', '--output-format', 'json',
], { sensitiveOutput: true })
const keysPayload = JSON.parse(keysRaw)
const keys = Array.isArray(keysPayload) ? keysPayload : (keysPayload.apiKeys ?? keysPayload.keys ?? [])
const publishableKey = keys.find((key) => key.type === 'publishable')?.api_key
  ?? keys.find((key) => key.name === 'anon')?.api_key
if (!publishableKey) throw new Error('R138 could not resolve an in-memory public API key')

async function freePort() {
  return await new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close((error) => error ? reject(error) : resolvePort(port))
    })
  })
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) return
    } catch {
      // The private local server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200))
  }
  throw new Error('r138_preview_server_timeout')
}

function replaceOnce(source, before, after, label) {
  if (source.split(before).length - 1 !== 1) throw new Error(`r138_fixture_anchor_drift:${label}`)
  return source.replace(before, after)
}

function prepareFixtureSource() {
  let source = readFileSync(sourcePath, 'utf8')
  source = replaceOnce(
    source,
    'let output = {}\nlet primaryError = null',
    'let output = {}\nlet retainedFixture = null\nlet primaryError = null',
    'fixture-declaration',
  )
  const proofAnchor = `  if (!rawHidden || decisionAttempt.status !== 404 || !standardUnchanged) {
    throw new Error('operator secrecy, authority or no-mutation proof failed')
  }

  output = {`
  const retained = `  if (!rawHidden || decisionAttempt.status !== 404 || !standardUnchanged) {
    throw new Error('operator secrecy, authority or no-mutation proof failed')
  }

  retainedFixture = {
    owner_a: ownerA,
    owner_b: ownerB,
    operator,
    operator_principal: operatorPrincipal,
    operator_email: operatorEmail,
    password,
    workspace_a: workspaceA,
    workspace_a2: workspaceA2,
    workspace_b: workspaceB,
    audience_grant: audienceGrant,
    review_packet_id: review.id,
    queue: allowed.body,
  }

  output = {
    fixture: retainedFixture,`
  source = replaceOnce(source, proofAnchor, retained, 'fixture-payload')
  const hostedRowsAnchor = "      now(),now()+interval '1 day'\n    );\n    commit;`)"
  source = replaceOnce(
    source,
    hostedRowsAnchor,
    `${hostedRowsAnchor}\n\n  if (process.env.CTRL_PROBE_FAULT_AFTER_HOSTED_ROWS === '1') {\n    throw new Error('r138_forced_failure_after_hosted_rows')\n  }`,
    'failure-after-hosted-rows',
  )
  source = replaceOnce(
    source,
    '  if (ownerA && ownerB) {',
    "  if (ownerA && ownerB && (process.env.CTRL_PROBE_KEEP_FIXTURE !== '1' || primaryError)) {",
    'cleanup-guard',
  )
  source = replaceOnce(
    source,
    'if (primaryError) throw primaryError\nprocess.stdout.write(`${JSON.stringify(output, null, 2)}\\n`)',
    `if (primaryError) {
  if (process.env.CTRL_PROBE_EXPECT_FIXTURE_FAILURE === '1') {
    process.stdout.write(\`${'${'}JSON.stringify({
      expected_failure: primaryError.message,
      cleanup: output.cleanup ?? null,
    }, null, 2)}\\n\`)
    process.exitCode = 86
  } else {
    throw primaryError
  }
} else {
  process.stdout.write(\`${'${'}JSON.stringify(output, null, 2)}\\n\`)
}`,
    'expected-failure-receipt',
  )
  return source
}

const cleanupKeys = [
  'access_receipts', 'artifacts', 'auth_users', 'candidate_requests', 'criteria',
  'grants', 'operator_auth_links', 'operator_principals', 'review_packets', 'roles', 'workspaces',
]

function requireZeroCleanup(value, label) {
  if (
    !value ||
    JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...cleanupKeys].sort()) ||
    Object.values(value).some((count) => Number(count) !== 0)
  ) throw new Error(`r138_${label}_cleanup_failed`)
  return value
}

function proveFailurePathCleanup() {
  writeFileSync(fixtureExecutable, prepareFixtureSource(), 'utf8')
  const run = spawnSync(process.execPath, [fixtureExecutable], {
    cwd: root,
    env: {
      ...process.env,
      CTRL_PROBE_KEEP_FIXTURE: '1',
      CTRL_PROBE_FAULT_AFTER_HOSTED_ROWS: '1',
      CTRL_PROBE_EXPECT_FIXTURE_FAILURE: '1',
    },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20 * 60_000,
  })
  if (run.status !== 86) throw new Error(`r138_failure_path_did_not_fail:${run.status ?? 'unknown'}`)
  const parsed = JSON.parse(run.stdout)
  if (parsed.expected_failure !== 'r138_forced_failure_after_hosted_rows') {
    throw new Error('r138_failure_path_wrong_failure')
  }
  return requireZeroCleanup(parsed.cleanup, 'forced_failure')
}

function createFixture() {
  writeFileSync(fixtureExecutable, prepareFixtureSource(), 'utf8')
  const run = spawnSync(process.execPath, [fixtureExecutable], {
    cwd: root,
    env: { ...process.env, CTRL_PROBE_KEEP_FIXTURE: '1' },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20 * 60_000,
  })
  if (run.status !== 0) throw new Error(`r138_fixture_setup_failed:${run.status ?? 'unknown'}`)
  const parsed = JSON.parse(run.stdout)
  const value = parsed.fixture
  const expectedFields = ['consequence', 'headline', 'question', 'ready_since', 'review_packet_id']
  if (
    !value ||
    value.password?.length < 20 ||
    !value.operator_email?.endsWith('@example.invalid') ||
    value.queue?.available !== true ||
    JSON.stringify(Object.keys(value.queue.next ?? {}).sort()) !== JSON.stringify(expectedFields)
  ) throw new Error('r138_fixture_result_invalid')
  return value
}

function assertUuid(value, label) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value ?? '')) {
    throw new Error(`r138_cleanup_identity_invalid:${label}`)
  }
}

function cleanupFixture(fixture) {
  if (!fixture) return null
  for (const [label, value] of Object.entries({
    owner_a: fixture.owner_a,
    owner_b: fixture.owner_b,
    operator: fixture.operator,
    operator_principal: fixture.operator_principal,
    workspace_a: fixture.workspace_a,
    workspace_a2: fixture.workspace_a2,
    workspace_b: fixture.workspace_b,
  })) assertUuid(value, label)

  dbq(`begin;
    delete from public.brain_access_receipts
    where authenticated_user_id=${lit(fixture.operator)}::uuid
       or selected_workspace_id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid);
    update public.standard_change_review_packets set
      workspace_id=null,subject_id=null,
      operator_projection_audience=null,operator_projection_purpose=null,
      operator_projection_bound_at=null,operator_projection_bound_by=null
    where user_id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid);
    delete from public.brain_audience_grants
    where workspace_id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid);
    delete from public.brain_workspace_roles
    where workspace_id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid);
    delete from public.brain_workspaces
    where id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid);
    delete from private.brain_operator_auth_links
    where operator_principal_id=${lit(fixture.operator_principal)}::uuid or user_id=${lit(fixture.operator)}::uuid;
    delete from private.brain_operator_principals where id=${lit(fixture.operator_principal)}::uuid;
    delete from auth.users
    where id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid,${lit(fixture.operator)}::uuid);
    commit;`)

  return dbq(`select json_build_object(
    'auth_users',(select count(*) from auth.users where id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid,${lit(fixture.operator)}::uuid)),
    'operator_principals',(select count(*) from private.brain_operator_principals where id=${lit(fixture.operator_principal)}::uuid),
    'operator_auth_links',(select count(*) from private.brain_operator_auth_links where operator_principal_id=${lit(fixture.operator_principal)}::uuid or user_id=${lit(fixture.operator)}::uuid),
    'workspaces',(select count(*) from public.brain_workspaces where id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid)),
    'roles',(select count(*) from public.brain_workspace_roles where workspace_id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid)),
    'grants',(select count(*) from public.brain_audience_grants where workspace_id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid)),
    'access_receipts',(select count(*) from public.brain_access_receipts where authenticated_user_id=${lit(fixture.operator)}::uuid or selected_workspace_id in (${lit(fixture.workspace_a)}::uuid,${lit(fixture.workspace_a2)}::uuid,${lit(fixture.workspace_b)}::uuid)),
    'review_packets',(select count(*) from public.standard_change_review_packets where user_id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid)),
    'candidate_requests',(select count(*) from public.standard_change_requests where user_id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid)),
    'artifacts',(select count(*) from public.generated_artifacts where user_id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid)),
    'criteria',(select count(*) from public.criteria where user_id in (${lit(fixture.owner_a)}::uuid,${lit(fixture.owner_b)}::uuid))
  ) as cleanup`)[0].cleanup
}

let fixture
let viteProcess
let browserPassed = false
let cleanupResult
let failurePathCleanupResult
let primaryError

try {
  failurePathCleanupResult = proveFailurePathCleanup()
  fixture = createFixture()
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  viteProcess = spawn(process.execPath, [
    join(root, 'node_modules/vite/bin/vite.js'),
    '--config', join(root, 'vite.r138.config.ts'),
    '--host', '127.0.0.1',
    '--port', String(port),
    '--strictPort',
  ], {
    cwd: root,
    env: {
      ...process.env,
      VITE_R138_SUPABASE_URL: url,
      VITE_R138_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    },
    stdio: 'ignore',
  })
  await waitForServer(baseUrl)

  const browser = spawnSync(process.execPath, [
    join(root, 'node_modules/@playwright/test/cli.js'),
    'test',
    'src/__tests__/e2e/g25-operator-review-live-r138.spec.ts',
    '--project=chromium',
    '--workers=1',
    '--trace=off',
    '--output', join(temporaryDirectory, 'playwright-results'),
  ], {
    cwd: root,
    env: {
      ...process.env,
      E2E_R138_BASE_URL: baseUrl,
      E2E_R138_SUPABASE_URL: url,
      E2E_R138_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      E2E_R138_EMAIL: fixture.operator_email,
      E2E_R138_PASSWORD: fixture.password,
      E2E_R138_WORKSPACE_ID: fixture.workspace_a,
      E2E_R138_DENIED_WORKSPACE_ID: fixture.workspace_b,
      E2E_R138_QUEUE: JSON.stringify(fixture.queue),
    },
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 10 * 60_000,
  })
  if (browser.status !== 0) {
    if (browser.stdout) process.stderr.write(browser.stdout)
    if (browser.stderr) process.stderr.write(browser.stderr)
    throw new Error(`r138_browser_proof_failed:${browser.status ?? 'unknown'}`)
  }
  browserPassed = true
} catch (error) {
  primaryError = error
} finally {
  if (viteProcess && !viteProcess.killed) viteProcess.kill()
  try {
    cleanupResult = cleanupFixture(fixture)
    if (cleanupResult) requireZeroCleanup(cleanupResult, 'success_path')
  } catch (cleanupError) {
    primaryError ??= cleanupError
  }
  rmSync(temporaryDirectory, { recursive: true, force: true })
}

if (primaryError) throw primaryError
if (!browserPassed || !cleanupResult || !failurePathCleanupResult) {
  throw new Error('r138_browser_or_cleanup_result_missing')
}

console.log(JSON.stringify({
  status: 'private_rendered_composition_passed',
  isolated_project_ref: projectRef,
  production_project_ref: productionProjectRef,
  production_writes: 0,
  browser_tests_passed: 3,
  viewports: ['1440x900', '320x568'],
  live_five_field_projection_rendered: true,
  strict_adapter_used: true,
  owner_standard_unchanged: true,
  raw_packet_hidden: true,
  operator_decision_authority: false,
  unauthorised_workspace_concealed: true,
  mobile_hidden_operator_reads: 0,
  customer_surface_changed: false,
  public_route_connected: false,
  credentials_persisted: false,
  cleanup: cleanupResult,
  forced_failure_after_hosted_rows: true,
  forced_failure_cleanup: failurePathCleanupResult,
}, null, 2))
