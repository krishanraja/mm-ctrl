import { expect, test, type Page } from '@playwright/test'

const proof = '/g23-product-spine-r1.html'
const protectedPreviewEntry = process.env.E2E_PROTECTED_PREVIEW_ENTRY

async function openProof(page: Page, suffix = '') {
  await page.goto(`${proof}${suffix}`)
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0)
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G23 product spine R1', () => {
  test.beforeEach(async ({ page }) => {
    if (protectedPreviewEntry) {
      await page.goto(protectedPreviewEntry)
    }
  })

  test('states the whole product and keeps one active crossing', async ({ page }) => {
    await openProof(page)
    await expect(page.getByRole('heading', { name: 'Mindmake builds a private AI Brain with one leader in 30 days.' })).toBeVisible()
    await expect(page.getByText('Brain prepares', { exact: true })).toBeVisible()
    await expect(page.getByText('Krish challenges', { exact: true })).toBeVisible()
    await expect(page.getByText('Leader decides', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Which marketing roles still create value once AI can produce the first draft?' })).toBeVisible()
    await expect(page.getByText('Is this the product we are building?', { exact: true })).toHaveCount(1)
  })

  test('places the consequence at the crossing choice', async ({ page }) => {
    await openProof(page)
    const change = page.getByRole('button', { name: 'Changes here' })
    await change.click()
    await expect(change).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Changed for this decision')).toBeVisible()
    await expect(page.getByText('AI may own first drafts. A named human owns customer consequence and final release.')).toBeVisible()
  })

  test('opens deeper product layers without creating a second page', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'See why this has standing' }).click()
    await expect(page.locator('#brain-detail')).toHaveAttribute('open', '')
    await expect(page.getByText('Proposed use: people decision, not yet accepted')).toBeVisible()
    await page.getByText('What Krish controls backstage', { exact: true }).click()
    await expect(page.locator('#operator-detail')).toHaveAttribute('open', '')
    await expect(page.locator('#brain-detail')).not.toHaveAttribute('open', '')
  })

  test('renders honest quiet, sparse and contradiction states', async ({ page }) => {
    await openProof(page, '?state=quiet')
    await expect(page.getByRole('heading', { name: "Nothing has earned the leader's attention." })).toBeVisible()
    await openProof(page, '?state=sparse')
    await expect(page.getByRole('heading', { name: 'Useful enough to begin. Not enough to carry this judgement.' })).toBeVisible()
    await openProof(page, '?state=contradiction')
    await expect(page.getByRole('heading', { name: 'New evidence cuts against the proposed crossing.' })).toBeVisible()
  })

  test('preserves the product and one-tap action on a narrow phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openProof(page)
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('heading', { name: 'Mindmake builds a private AI Brain with one leader in 30 days.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Changes here' })).toBeVisible()
    const undersized = await page.locator('button:visible').evaluateAll(elements => elements.filter(element => {
      const rect = element.getBoundingClientRect()
      return rect.width < 40 || rect.height < 40
    }).map(element => element.textContent))
    expect(undersized).toEqual([])
  })
})
