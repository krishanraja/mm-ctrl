import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const sourcePath = join(scriptDir, 'probe-ctrl-g25-rendered-standard-review-r121.mjs')
const scratchRoot = process.env.CTRL_SCRATCH_ROOT ?? join(homedir(), '.scratch')
mkdirSync(scratchRoot, { recursive: true })
const temporaryDirectory = mkdtempSync(join(scratchRoot, 'mm-ctrl-r122-wrapper-'))
const executablePath = join(temporaryDirectory, 'rendered-address-r122.mjs')
let source = readFileSync(sourcePath, 'utf8')

const rootsAnchor = `const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')`
const rootsReplacement = `const scriptDir = ${JSON.stringify(scriptDir)}
const root = ${JSON.stringify(root)}`
if (!source.includes(rootsAnchor)) throw new Error('r122_root_anchor_drift')
source = source.replace(rootsAnchor, rootsReplacement)

const secondOwnerAnchor = '      email_a: emailA,\n      password,'
if (!source.includes(secondOwnerAnchor)) throw new Error('r122_second_owner_anchor_drift')
source = source.replace(secondOwnerAnchor, '      email_a: emailA,\n      email_b: emailB,\n      password,')

const tryAnchor = `try {
  fixture = createFixture()`
const freezeHelper = `async function freezeReviewPackets(value) {
  const signIn = await fetch(\`\${url}/auth/v1/token?grant_type=password\`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: value.email_a, password: value.password }),
    signal: AbortSignal.timeout(60_000),
  })
  const session = await signIn.json()
  if (!signIn.ok || !session?.access_token) throw new Error('r122_fixture_sign_in_failed')
  const reviewIds = []
  for (const candidate of value.candidates) {
    const response = await fetch(\`\${url}/functions/v1/review-standard-change-v2\`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        Authorization: \`Bearer \${session.access_token}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'prepare',
        check_id: candidate.checkId,
        expected_result_sha256: candidate.resultHash,
      }),
      signal: AbortSignal.timeout(60_000),
    })
    const body = await response.json()
    if (!response.ok || !body?.result?.review_packet_id) {
      throw new Error(\`r122_packet_freeze_failed:\${response.status}\`)
    }
    reviewIds.push(body.result.review_packet_id)
  }
  return reviewIds
}

try {
  fixture = createFixture()
  fixture.reviewIds = await freezeReviewPackets(fixture)`
if (!source.includes(tryAnchor)) throw new Error('r122_fixture_freeze_anchor_drift')
source = source.replace(tryAnchor, freezeHelper)

source = source
  .replaceAll('mm-ctrl-r121-', 'mm-ctrl-r122-')
  .replaceAll('vite.r121.config.ts', 'vite.r122.config.ts')
  .replaceAll('g25-human-review-live-r121.spec.ts', 'g25-standard-review-address-r122.spec.ts')
  .replaceAll('VITE_R121_', 'VITE_R122_')
  .replaceAll('E2E_R121_', 'E2E_R122_')

const envAnchor = `      E2E_R122_EMAIL: fixture.email_a,
      E2E_R122_PASSWORD: fixture.password,
      E2E_R122_CANDIDATES: JSON.stringify(fixture.candidates),`
const envReplacement = `      E2E_R122_EMAIL_A: fixture.email_a,
      E2E_R122_EMAIL_B: fixture.email_b,
      E2E_R122_PASSWORD: fixture.password,
      E2E_R122_REVIEW_IDS: JSON.stringify(fixture.reviewIds),`
if (!source.includes(envAnchor)) throw new Error('r122_browser_env_anchor_drift')
source = source.replace(envAnchor, envReplacement)

const receiptAnchor = `  real_concurrent_stale_state: true,
  credentials_persisted: false,`
const receiptReplacement = `  stable_private_address: true,
  unknown_cross_owner_indistinguishable: true,
  credentials_persisted: false,`
if (!source.includes(receiptAnchor)) throw new Error('r122_receipt_anchor_drift')
source = source.replace(receiptAnchor, receiptReplacement)

try {
  writeFileSync(executablePath, source, 'utf8')
  const run = spawnSync(process.execPath, [executablePath], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (run.status !== 0) {
    if (run.stdout) process.stderr.write(run.stdout)
    if (run.stderr) process.stderr.write(run.stderr)
    throw new Error(`r122_hosted_browser_probe_failed:${run.status ?? 'unknown'}`)
  }
  const finalLine = run.stdout.trim().split(/\r?\n/).at(-1)
  const result = JSON.parse(finalLine)
  if (
    result.browser_tests_passed !== 3 ||
    result.stable_private_address !== true ||
    result.unknown_cross_owner_indistinguishable !== true ||
    Object.values(result.cleanup).some((value) => Number(value) !== 0)
  ) throw new Error('r122_hosted_browser_result_invalid')
  console.log(JSON.stringify(result))
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
