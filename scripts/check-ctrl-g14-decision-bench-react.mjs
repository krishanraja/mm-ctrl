import { spawn } from 'node:child_process'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const root = process.cwd()
const port = Number(process.env.G14_REACT_CHECK_PORT || 4192)
const routePath = '/operator/customers/SYN-CUST-014/decisions/INT-014'
const baseUrl = process.argv[2] || `http://127.0.0.1:${port}${routePath}`
const startsOwnServer = process.argv.length < 3
const evidenceDir = resolve(root, 'project-documentation/ctrl-evolution/design/evidence')
const featureDir = resolve(root, 'src/features/operator-brain')
const fixtureOpening = 'Which direction is closer to something you would put your name to, and what would still stop you shipping it?'
await mkdir(evidenceDir, { recursive: true })

let failures = 0
const pass = (message) => console.log(`PASS ${message}`)
const fail = (message) => { failures += 1; console.error(`FAIL ${message}`) }
const expect = async (message, condition) => (await condition) ? pass(message) : fail(message)

const featureFiles = (await readdir(featureDir)).filter((name) => /\.(ts|tsx|css)$/.test(name))
const featureText = (await Promise.all(featureFiles.map((name) => readFile(join(featureDir, name), 'utf8')))).join('\n')
await expect('feature has no Supabase client or Edge function dependency', !/supabase|invokeEdgeFunction/i.test(featureText))
await expect('feature copy contains no em dash', !featureText.includes('—'))
await expect('feature keeps every required honest state', ['sparse', 'quiet', 'loading', 'stale', 'error', 'rejected'].every((state) => featureText.includes(`${state}:`)))

const routerText = await readFile(resolve(root, 'src/router.tsx'), 'utf8')
const appText = await readFile(resolve(root, 'src/App.tsx'), 'utf8')
const indexText = await readFile(resolve(root, 'index.html'), 'utf8')
const splashText = await readFile(resolve(root, 'src/components/ui/splash-screen.tsx'), 'utf8')
await expect('route requires local development or the explicit synthetic preview flag', routerText.includes("import.meta.env.VITE_ENABLE_SYNTHETIC_DECISION_BENCH === '1'"))
await expect('route identity is locked to the synthetic fixture', routerText.includes("workspaceId === 'SYN-CUST-014'") && routerText.includes("decisionId === 'INT-014'"))
await expect('route is not included in authenticated prefetching', !routerText.match(/const imports:[\s\S]*operator-brain[\s\S]*for \(const fn/))
await expect('Decision Bench chunk warms during the one boot experience', routerText.includes("p.startsWith('/operator/customers/')") && routerText.includes("import('@/features/operator-brain/DecisionBenchPage')"))
await expect('static and React boot use the same Mindmaker ring', indexText.includes('data-boot-visual="mindmaker-ring"') && splashText.includes('data-boot-visual="mindmaker-ring"'))
await expect('local Decision Bench does not add a branded hold', appText.includes('isDecisionBenchPreview || splashShown ? 0 : 1500'))

let server
if (startsOwnServer) {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    env: { ...process.env, ROLLUP_DISABLE_NATIVE: '1', VITE_CACHE_DIR: join(tmpdir(), 'mm-ctrl-g14-react-check') },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let startupOutput = ''
  server.stdout.on('data', (chunk) => { startupOutput += chunk.toString() })
  server.stderr.on('data', (chunk) => { startupOutput += chunk.toString() })
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) break
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 250))
    }
  }
  try {
    const response = await fetch(baseUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error(startupOutput)
    throw new Error(`Decision Bench dev server did not start: ${error.message}`)
  }
}

const browser = await chromium.launch({ headless: true })

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await desktop.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByTestId('decision-bench').waitFor({ state: 'visible', timeout: 30000 })
  await expect('desktop route responds successfully', response?.ok())
  await expect('preview refuses search indexing', await page.locator('meta[name="robots"][content="noindex,nofollow,noarchive"]').count() === 1)
  await expect('desktop keeps all three work regions visible', await page.locator('.db-panel:visible').count() === 3)
  await expect('desktop uses the viewport without page scroll', await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1))
  await expect('desktop has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  await expect('desktop decision title stays compact', await page.locator('.db-decision-head h1').evaluate((element) => parseFloat(getComputedStyle(element).fontSize) <= 28))
  await expect('desktop surfaces exact current and discarded meanings', (await page.locator('.db-compare').innerText()).includes('Other people cannot yet see the quality loss Maya sees.') && (await page.locator('.db-compare').innerText()).includes('Maya fundamentally distrusts delegation.'))
  await expect('desktop shows the Mindmaker wordmark', await page.locator('.db-brand img[alt="Mindmaker"]').isVisible())
  const closedRailWidth = await page.locator('.db-rail').evaluate((element) => element.getBoundingClientRect().width)
  await page.locator('.db-rail').hover()
  await page.waitForTimeout(220)
  const openRailWidth = await page.locator('.db-rail').evaluate((element) => element.getBoundingClientRect().width)
  await expect('desktop sidebar expands and names every destination', closedRailWidth <= 72 && openRailWidth >= 230 && await page.getByText('Current against history').isVisible())
  await page.screenshot({ path: resolve(evidenceDir, 'g14-decision-bench-react-sidebar.png'), fullPage: false })
  await page.locator('.db-rail').getByRole('button', { name: 'Evidence' }).click()
  await expect('desktop sidebar controls change the active work region', await page.locator('.db-evidence.is-active-panel').count() === 1)
  await page.screenshot({ path: resolve(evidenceDir, 'g14-decision-bench-react-desktop.png'), fullPage: false })

  await page.locator('.db-source-row').first().click()
  await expect('source dialog shows the exact assertion', (await page.getByTestId('source-dialog').innerText()).includes("I don't need the team to imitate me. I need them to notice what I notice before I have to fix it."))
  await page.getByTestId('source-dialog').getByRole('button', { name: 'Close' }).click()

  await page.locator('.db-action-foot .db-primary').click()
  const prepareText = await page.getByTestId('prepare-dialog').innerText()
  await expect('preparation keeps the exact opening question', prepareText.includes(fixtureOpening))
  await expect('preparation keeps all four listening signals', await page.getByTestId('prepare-dialog').locator('li').count() === 4)
  await page.getByTestId('prepare-dialog').getByRole('button', { name: 'Close' }).click()

  await page.locator('.db-topbar [aria-label="Ask privately"]').click()
  await page.getByTestId('ask-dialog').getByRole('button', { name: 'Ask' }).click()
  await expect('private answer declares its non-durable effect', (await page.getByTestId('ask-dialog').innerText()).includes('no durable effect'))
  await page.getByTestId('ask-dialog').getByRole('button', { name: 'Close' }).click()

  await page.locator('.db-rail [aria-label="Preview customer view"]').click()
  const customerText = await page.getByTestId('customer-dialog').innerText()
  const customerBackground = await page.getByTestId('customer-dialog').evaluate((element) => getComputedStyle(element).backgroundColor)
  await expect('customer projection includes the approved customer-facing synthesis', customerText.includes('making the standard visible'))
  await expect('customer projection excludes the operator-private assertion', !customerText.includes('Abstract questions produced principles she later contradicted'))
  await expect('customer projection dialog is fully opaque', customerBackground === 'rgb(11, 21, 16)')
  await page.screenshot({ path: resolve(evidenceDir, 'g14-decision-bench-react-customer-dialog.png'), fullPage: false })
  await page.getByTestId('customer-dialog').getByRole('button', { name: 'Close' }).click()
  await expect('desktop has no page errors', pageErrors.length === 0 || pageErrors.join(' | '))
  await desktop.close()

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const mobilePage = await mobile.newPage()
  await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await mobilePage.getByTestId('decision-bench').waitFor({ state: 'visible', timeout: 30000 })
  await expect('mobile opens one work region at a time', await mobilePage.locator('.db-panel:visible').count() === 1)
  await expect('mobile has no horizontal overflow', await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  await mobilePage.screenshot({ path: resolve(evidenceDir, 'g14-decision-bench-react-mobile.png'), fullPage: false })
  await mobilePage.getByRole('button', { name: 'Evidence' }).last().click()
  await expect('mobile Evidence control reveals the evidence region', await mobilePage.locator('.db-evidence').isVisible() && await mobilePage.locator('.db-compare').isHidden())
  await mobilePage.getByRole('button', { name: 'Next move' }).click()
  await expect('mobile Next move control reveals the action region', await mobilePage.locator('.db-action').isVisible() && await mobilePage.locator('.db-evidence').isHidden())
  const navTargets = await mobilePage.locator('.db-mobile-nav button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height))
  await expect('mobile primary navigation meets 42px touch targets', navTargets.every((height) => height >= 42))
  await mobile.close()

  const lowHeight = await browser.newContext({ viewport: { width: 720, height: 450 }, reducedMotion: 'reduce' })
  const lowPage = await lowHeight.newPage()
  await lowPage.goto(baseUrl, { waitUntil: 'networkidle' })
  await lowPage.getByTestId('decision-bench').waitFor()
  await expect('low-height view reflows to one region without horizontal overflow', await lowPage.locator('.db-panel:visible').count() === 1 && await lowPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  await lowHeight.close()

  for (const state of ['sparse', 'quiet', 'loading', 'stale', 'error', 'rejected']) {
    const stateContext = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    const statePage = await stateContext.newPage()
    await statePage.goto(`${baseUrl}?state=${state}`, { waitUntil: 'networkidle' })
    await statePage.getByTestId(`state-${state}`).waitFor()
    await expect(`${state} state is honest and visible`, await statePage.getByTestId(`state-${state}`).isVisible())
    await stateContext.close()
  }

  const wrongContext = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const wrongPage = await wrongContext.newPage()
  const wrongUrl = baseUrl.replace('SYN-CUST-014', 'REAL-CUSTOMER')
  await wrongPage.goto(wrongUrl, { waitUntil: 'networkidle' })
  await wrongPage.getByText('Page not found').waitFor()
  await expect('wrong customer identity cannot enter the fixture route', await wrongPage.getByTestId('decision-bench').count() === 0 && await wrongPage.getByText('Page not found').isVisible())
  await wrongContext.close()
} finally {
  await browser.close()
  if (server && !server.killed) server.kill()
}

if (failures) {
  console.error(`G14 React Decision Bench failed ${failures} check(s).`)
  process.exit(1)
}

console.log('G14 React Decision Bench passed its local implementation gate.')
