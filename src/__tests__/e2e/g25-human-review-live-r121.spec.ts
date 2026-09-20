import { expect, test, type BrowserContext, type Page } from '@playwright/test'

interface Candidate {
  checkId: string
  resultHash: string
}

const baseUrl = process.env.E2E_R121_BASE_URL ?? ''
const supabaseUrl = process.env.E2E_R121_SUPABASE_URL ?? ''
const publishableKey = process.env.E2E_R121_SUPABASE_PUBLISHABLE_KEY ?? ''
const email = process.env.E2E_R121_EMAIL ?? ''
const password = process.env.E2E_R121_PASSWORD ?? ''
const candidates = JSON.parse(process.env.E2E_R121_CANDIDATES ?? '[]') as Candidate[]

function reviewUrl(candidate: Candidate) {
  const query = new URLSearchParams({
    check_id: candidate.checkId,
    result_sha256: candidate.resultHash,
  })
  return `${baseUrl}/?${query}`
}

async function installSession(context: BrowserContext, session: unknown) {
  const storageKey = 'sb-cgkcplcamsijghalintq-auth-token'
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, { key: storageKey, value: session })
}

async function expectReview(page: Page) {
  await expect(page.getByRole('heading', { name: 'Should this be your proposal rule?' })).toBeVisible()
}

test.beforeAll(() => {
  expect(baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  expect(supabaseUrl).toBe('https://cgkcplcamsijghalintq.supabase.co')
  expect(publishableKey.length).toBeGreaterThan(20)
  expect(email).toContain('@example.invalid')
  expect(password.length).toBeGreaterThan(20)
  expect(candidates).toHaveLength(4)
})

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ context, request }) => {
  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  expect(response.ok()).toBe(true)
  await installSession(context, await response.json())
})

test('renders the exact packet and freezes all reviews before a decision', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(reviewUrl(candidates[0]))
  await expectReview(page)

  for (const candidate of candidates.slice(1)) {
    const preparedPage = await context.newPage()
    await preparedPage.goto(reviewUrl(candidate))
    await expectReview(preparedPage)
    await preparedPage.close()
  }

  await page.getByRole('button', { name: 'See why' }).click()
  await expect(page.getByRole('dialog', { name: 'Why this came up' })).toContainText('The proof was present elsewhere.')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Make this my rule' })).toBeVisible()
})

test('approves and reverses on desktop while a mobile review becomes explicitly stale', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(reviewUrl(candidates[2]))
  await expectReview(page)

  const winningPage = await context.newPage()
  await winningPage.setViewportSize({ width: 1440, height: 900 })
  await winningPage.goto(reviewUrl(candidates[3]))
  await expectReview(winningPage)
  await winningPage.getByRole('button', { name: 'Make this my rule' }).click()
  await expect(winningPage.getByRole('heading', { name: 'Rule updated' })).toBeFocused()

  await page.getByRole('button', { name: 'Make this my rule' }).click()
  await expect(page.getByRole('heading', { name: 'This rule changed while you were reviewing it' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Make this my rule' })).toHaveCount(0)

  await winningPage.getByRole('button', { name: 'Put the old rule back' }).click()
  await winningPage.getByRole('button', { name: 'Restore the previous rule' }).click()
  await expect(winningPage.getByRole('heading', { name: 'Previous rule restored' })).toBeFocused()
})

test('keeps the authenticated mobile decision simple and rejects without changing the rule', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(reviewUrl(candidates[1]))
  await expectReview(page)
  await expect(page.getByRole('button', { name: 'Make this my rule' })).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Keep my current rule' })).toBeInViewport()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.getByRole('button', { name: 'Keep my current rule' }).click()
  await expect(page.getByRole('heading', { name: 'Current rule kept' })).toBeFocused()
})
