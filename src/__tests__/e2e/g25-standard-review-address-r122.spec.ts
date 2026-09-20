import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test'

const baseUrl = process.env.E2E_R122_BASE_URL ?? ''
const supabaseUrl = process.env.E2E_R122_SUPABASE_URL ?? ''
const publishableKey = process.env.E2E_R122_SUPABASE_PUBLISHABLE_KEY ?? ''
const emailA = process.env.E2E_R122_EMAIL_A ?? ''
const emailB = process.env.E2E_R122_EMAIL_B ?? ''
const password = process.env.E2E_R122_PASSWORD ?? ''
const reviewIds = JSON.parse(process.env.E2E_R122_REVIEW_IDS ?? '[]') as string[]
const HOSTED_TIMEOUT = 20_000

function reviewUrl(reviewId: string) {
  return `${baseUrl}/operator/reviews/${reviewId}`
}

async function signIn(request: APIRequestContext, email: string) {
  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  expect(response.ok()).toBe(true)
  return await response.json()
}

async function installSession(context: BrowserContext, session: unknown) {
  const storageKey = 'sb-cgkcplcamsijghalintq-auth-token'
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, { key: storageKey, value: session })
}

test.beforeAll(() => {
  expect(baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  expect(supabaseUrl).toBe('https://cgkcplcamsijghalintq.supabase.co')
  expect(publishableKey.length).toBeGreaterThan(20)
  expect(emailA).toContain('@example.invalid')
  expect(emailB).toContain('@example.invalid')
  expect(password.length).toBeGreaterThan(20)
  expect(reviewIds).toHaveLength(4)
})

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ context, request }) => {
  await installSession(context, await signIn(request, emailA))
})

test('opens, approves and reverses from a stable private address', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(reviewUrl(reviewIds[0]))
  expect(new URL(page.url()).search).toBe('')
  await expect(page.getByRole('heading', { name: 'Should this be your proposal rule?' })).toBeVisible({ timeout: HOSTED_TIMEOUT })
  await page.getByRole('button', { name: 'See why' }).click()
  await expect(page.getByRole('dialog', { name: 'Why this came up' })).toContainText('The proof was present elsewhere.')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Make this my rule' }).click()
  await expect(page.getByRole('heading', { name: 'Rule updated' })).toBeFocused({ timeout: HOSTED_TIMEOUT })
  await page.getByRole('button', { name: 'Put the old rule back' }).click()
  await page.getByRole('button', { name: 'Restore the previous rule' }).click()
  await expect(page.getByRole('heading', { name: 'Previous rule restored' })).toBeFocused()
})

test('makes unknown and cross-owner addresses indistinguishable', async ({ page, browser, request }) => {
  const unknownId = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  await page.goto(reviewUrl(unknownId))
  await expect(page.getByRole('heading', { name: 'We could not finish this review' })).toBeFocused({ timeout: HOSTED_TIMEOUT })
  const unknownCopy = await page.locator('.sr-state-card').innerText()

  const foreignContext = await browser.newContext()
  await installSession(foreignContext, await signIn(request, emailB))
  const foreignPage = await foreignContext.newPage()
  await foreignPage.goto(reviewUrl(reviewIds[2]))
  await expect(foreignPage.getByRole('heading', { name: 'We could not finish this review' })).toBeFocused({ timeout: HOSTED_TIMEOUT })
  const foreignCopy = await foreignPage.locator('.sr-state-card').innerText()
  expect(foreignCopy).toBe(unknownCopy)
  await foreignContext.close()
})

test('keeps the stable-address rejection simple on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(reviewUrl(reviewIds[1]))
  await expect(page.getByRole('heading', { name: 'Should this be your proposal rule?' })).toBeVisible({ timeout: HOSTED_TIMEOUT })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.getByRole('button', { name: 'Keep my current rule' }).click()
  await expect(page.getByRole('heading', { name: 'Current rule kept' })).toBeFocused()
})
