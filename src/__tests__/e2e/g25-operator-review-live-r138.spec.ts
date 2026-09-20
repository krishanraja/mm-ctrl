import { expect, test, type BrowserContext, type Page } from '@playwright/test'

interface QueueProjection {
  available: true
  ready_count: number
  next: {
    review_packet_id: string
    question: string
    headline: string
    consequence: string
    ready_since: string
  }
}

const baseUrl = process.env.E2E_R138_BASE_URL ?? ''
const supabaseUrl = process.env.E2E_R138_SUPABASE_URL ?? ''
const publishableKey = process.env.E2E_R138_SUPABASE_PUBLISHABLE_KEY ?? ''
const email = process.env.E2E_R138_EMAIL ?? ''
const password = process.env.E2E_R138_PASSWORD ?? ''
const workspaceId = process.env.E2E_R138_WORKSPACE_ID ?? ''
const deniedWorkspaceId = process.env.E2E_R138_DENIED_WORKSPACE_ID ?? ''
const queue = JSON.parse(process.env.E2E_R138_QUEUE ?? '{}') as QueueProjection
const rpcPath = '/rest/v1/rpc/get_operator_pending_standard_change_review_v1'
const storageKey = 'sb-cgkcplcamsijghalintq-auth-token'

function operatorUrl(workspace: string) {
  return `${baseUrl}/?${new URLSearchParams({ workspace_id: workspace })}`
}

async function installSession(context: BrowserContext, session: unknown) {
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, { key: storageKey, value: session })
}

async function expectSessionIsEphemeral(page: Page) {
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBeNull()
}

async function signIn(context: BrowserContext, page: Page) {
  const response = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  expect(response.ok()).toBe(true)
  await installSession(context, await response.json())
}

test.beforeAll(() => {
  expect(baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  expect(supabaseUrl).toBe('https://cgkcplcamsijghalintq.supabase.co')
  expect(publishableKey.length).toBeGreaterThan(20)
  expect(email).toContain('@example.invalid')
  expect(password.length).toBeGreaterThan(20)
  expect(workspaceId).toMatch(/^[0-9a-f-]{36}$/i)
  expect(deniedWorkspaceId).toMatch(/^[0-9a-f-]{36}$/i)
  expect(queue.available).toBe(true)
  expect(Object.keys(queue.next).sort()).toEqual(['consequence', 'headline', 'question', 'ready_since', 'review_packet_id'])
})

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ context, page }) => {
  await signIn(context, page)
})

test('renders the exact five-field live projection once on the approved desktop instrument', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl })
  await page.setViewportSize({ width: 1440, height: 900 })
  let rpcCalls = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === rpcPath) rpcCalls += 1
  })

  await page.goto(operatorUrl(workspaceId))
  await expectSessionIsEphemeral(page)
  await expect(page.getByRole('heading', { name: 'How far should you rebuild marketing around AI?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: queue.next.question })).toBeVisible()
  await expect(page.getByText(queue.next.headline, { exact: false })).toBeVisible()
  await expect(page.getByText(queue.next.consequence, { exact: false })).toBeVisible()
  await expect(page.getByText('Maya decides.')).toBeVisible()
  expect(rpcCalls).toBe(1)

  await page.getByRole('button', { name: 'Copy question' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(queue.next.question)

  const visibleText = await page.locator('body').innerText()
  expect(visibleText).not.toContain(queue.next.review_packet_id)
  expect(visibleText.toLowerCase()).not.toContain('sha256')
  await expect(page.getByRole('button', { name: /approve|reject|make this my rule/i })).toHaveCount(0)
})

test('conceals an unauthorised workspace behind the same absent signal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(operatorUrl(deniedWorkspaceId))
  await expectSessionIsEphemeral(page)
  await expect(page.getByRole('heading', { name: 'How far should you rebuild marketing around AI?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: queue.next.question })).toHaveCount(0)
  await expect(page.getByText(/not available|forbidden|unauthorised|unauthorized/i)).toHaveCount(0)
})

test('keeps the approved phone session singular and makes no hidden operator read', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  let rpcCalls = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === rpcPath) rpcCalls += 1
  })

  await page.goto(operatorUrl(workspaceId))
  await expectSessionIsEphemeral(page)
  await expect(page.getByTestId('mobile-decision-session')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inspect basis' })).toBeVisible()
  await expect(page.getByText('7 linked sources')).toBeVisible()
  await expect(page.getByRole('heading', { name: queue.next.question })).toHaveCount(0)
  expect(rpcCalls).toBe(0)
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(size.width).toBe(size.clientWidth)
  expect(size.height).toBeLessThanOrEqual(size.clientHeight)
})
