import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF ?? ''
const url = process.env.CTRL_PROBE_SUPABASE_URL ?? ''
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY ?? ''
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD ?? ''
const isolatedProjectRef = 'cgkcplcamsijghalintq'

if (
  projectRef !== isolatedProjectRef ||
  url !== `https://${isolatedProjectRef}.supabase.co` ||
  publishableKey.length < 20 ||
  password.length < 20
) {
  console.error('Set the exact isolated project, transient public key and fixture password inputs.')
  process.exit(2)
}

const scratchRoot = process.env.CTRL_SCRATCH_ROOT ?? join(homedir(), '.scratch')
mkdirSync(scratchRoot, { recursive: true })
const temporaryDirectory = mkdtempSync(join(scratchRoot, 'mm-ctrl-r121-'))
const setupExecutable = join(temporaryDirectory, 'fixture-setup.mjs')
const sourcePath = join(scriptDir, 'probe-ctrl-g25-standard-change-owner-r116.mjs')
let viteProcess
let fixture
let browserPassed = false
let cleanupResult

const lit = (value) => `'${String(value).replaceAll("'", "''")}'`

function dbq(sql) {
  const executable = process.platform === 'win32' ? process.execPath : 'npx'
  const prefix = process.platform === 'win32'
    ? ['C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js']
    : []
  const run = spawnSync(executable, [...prefix,
    'supabase', 'db', 'query', '--linked', '--project-ref', projectRef,
    '--output-format', 'json', sql.trim().replace(/\r?\n/g, ' '),
  ], { encoding: 'utf8', cwd: root, maxBuffer: 16 * 1024 * 1024 })
  if (run.status !== 0) throw new Error('r121_database_query_failed')
  return JSON.parse(run.stdout).rows ?? []
}

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
      // The local proof server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200))
  }
  throw new Error('r121_preview_server_timeout')
}

function prepareFixtureSource() {
  let source = readFileSync(sourcePath, 'utf8')
  const series = 'from generate_series(1,3) ordinal;'
  const candidateLoop = 'for (const ordinal of [1, 2, 3]) candidates.push(await makeCandidate(tokenA, ordinal));'
  if (source.split(series).length - 1 !== 1) throw new Error('r121_fixture_series_anchor_drift')
  if (source.split(candidateLoop).length - 1 !== 1) throw new Error('r121_fixture_candidate_anchor_drift')
  source = source.replace(series, 'from generate_series(1,4) ordinal;')
  source = source.replace(candidateLoop, 'for (const ordinal of [1, 2, 3, 4]) candidates.push(await makeCandidate(tokenA, ordinal));')

  const cutStart = source.indexOf('  const prepared = [];')
  const success = '  probePassed = true;'
  const cutEnd = source.indexOf(success, cutStart)
  if (cutStart < 0 || cutEnd < 0) throw new Error('r121_fixture_cut_anchor_drift')
  const fixtureOutput = `  output = {
    fixture: {
      user_a: userA,
      user_b: userB,
      email_a: emailA,
      password,
      candidates: candidates.map((candidate) => ({
        checkId: candidate.checkId,
        resultHash: candidate.resultHash,
      })),
    },
  };
  probePassed = true;`
  source = source.slice(0, cutStart) + fixtureOutput + source.slice(cutEnd + success.length)
  const fixtureAssignment = '    output.fixture = {\n'
  if (source.split(fixtureAssignment).length - 1 !== 1) throw new Error('r121_fixture_output_anchor_drift')
  return source.replace(fixtureAssignment, '    output.fixture = {\n      ...output.fixture,\n')
}

function createFixture() {
  writeFileSync(setupExecutable, prepareFixtureSource(), 'utf8')
  const run = spawnSync(process.execPath, [setupExecutable], {
    cwd: root,
    env: { ...process.env, CTRL_PROBE_KEEP_FIXTURE: '1' },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (run.status !== 0) throw new Error(`r121_fixture_setup_failed:${run.status ?? 'unknown'}`)
  const finalLine = run.stdout.trim().split(/\r?\n/).at(-1)
  const parsed = JSON.parse(finalLine)
  const value = parsed.fixture
  if (
    !value ||
    value.password !== password ||
    !Array.isArray(value.candidates) ||
    value.candidates.length !== 4
  ) throw new Error('r121_fixture_result_invalid')
  return value
}

function cleanupFixture() {
  if (!fixture?.user_a || !fixture?.user_b) return null
  for (const id of [fixture.user_a, fixture.user_b]) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('r121_cleanup_identity_invalid')
  }
  dbq(`delete from auth.users where id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid);`)
  return dbq(`select
    (select count(*) from auth.users where id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as auth_users,
    (select count(*) from public.standard_change_review_packets where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as review_packets,
    (select count(*) from public.standard_change_owner_decisions where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as decisions,
    (select count(*) from public.standard_change_applications where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as applications,
    (select count(*) from public.standard_change_reversals where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as reversals,
    (select count(*) from public.standard_versions where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as versions,
    (select count(*) from public.generated_artifacts where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as artifacts,
    (select count(*) from public.criteria where user_id in (${lit(fixture.user_a)}::uuid,${lit(fixture.user_b)}::uuid))::int as criteria`)[0]
}

try {
  fixture = createFixture()
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  viteProcess = spawn(process.execPath, [
    join(root, 'node_modules/vite/bin/vite.js'),
    '--config', join(root, 'vite.r121.config.ts'),
    '--host', '127.0.0.1',
    '--port', String(port),
    '--strictPort',
  ], {
    cwd: root,
    env: {
      ...process.env,
      VITE_R121_SUPABASE_URL: url,
      VITE_R121_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    },
    stdio: 'ignore',
  })
  await waitForServer(baseUrl)

  const browser = spawnSync(process.execPath, [
    join(root, 'node_modules/@playwright/test/cli.js'),
    'test',
    'src/__tests__/e2e/g25-human-review-live-r121.spec.ts',
    '--project=chromium',
    '--workers=1',
  ], {
    cwd: root,
    env: {
      ...process.env,
      E2E_R121_BASE_URL: baseUrl,
      E2E_R121_SUPABASE_URL: url,
      E2E_R121_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      E2E_R121_EMAIL: fixture.email_a,
      E2E_R121_PASSWORD: fixture.password,
      E2E_R121_CANDIDATES: JSON.stringify(fixture.candidates),
    },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (browser.status !== 0) {
    if (browser.stdout) process.stderr.write(browser.stdout)
    if (browser.stderr) process.stderr.write(browser.stderr)
    throw new Error(`r121_browser_proof_failed:${browser.status ?? 'unknown'}`)
  }
  browserPassed = true
} finally {
  if (viteProcess && !viteProcess.killed) viteProcess.kill()
  cleanupResult = cleanupFixture()
  rmSync(temporaryDirectory, { recursive: true, force: true })
  if (cleanupResult && Object.values(cleanupResult).some((value) => Number(value) !== 0)) {
    throw new Error(`r121_cleanup_failed:${JSON.stringify(cleanupResult)}`)
  }
}

if (!browserPassed || !cleanupResult) throw new Error('r121_browser_or_cleanup_result_missing')
console.log(JSON.stringify({
  browser_tests_passed: 3,
  viewports: ['1440x900', '390x844'],
  authenticated_product_gateway: true,
  real_approval_and_reversal: true,
  real_rejection: true,
  real_concurrent_stale_state: true,
  credentials_persisted: false,
  cleanup: cleanupResult,
}))
