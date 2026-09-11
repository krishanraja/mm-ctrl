import { expect, test, type Page } from '@playwright/test'

const proof = '/g23-product-spine-r2.html'
const protectedPreviewEntry = process.env.E2E_PROTECTED_PREVIEW_ENTRY

async function openProof(page: Page) {
  await page.goto(proof)
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0)
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G23 product spine R2', () => {
  test.beforeEach(async ({ page }) => {
    if (protectedPreviewEntry) await page.goto(protectedPreviewEntry)
  })

  test('makes the thirty-day relationship part of the main read', async ({ page }) => {
    await openProof(page)
    await expect(page.getByRole('heading', { name: 'CTRL is a private AI Brain built with one leader over 30 days.' })).toBeVisible()
    for (const name of ['Arrives prepared', 'Works on the first real decision', 'Learns and repairs', 'Leaves owned']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible()
    }
  })

  test('shows the roles and the mechanism beyond AI or notes', async ({ page }) => {
    await openProof(page)
    await expect(page.getByText('Brain prepares', { exact: true })).toBeVisible()
    await expect(page.getByText('Krish challenges', { exact: true })).toBeVisible()
    await expect(page.getByText('Leader decides', { exact: true })).toBeVisible()
    await expect(page.getByText('This is more than AI with good notes.', { exact: true })).toBeVisible()
    await expect(page.getByText('A folder stores information.', { exact: false })).toBeVisible()
  })

  test('keeps the crossing as compact supporting proof, not a workflow', async ({ page }) => {
    await openProof(page)
    await expect(page.getByText('One small proof of the larger product', { exact: true })).toBeVisible()
    await expect(page.getByRole('button')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Which marketing roles still create value once AI can produce the first draft?' })).toBeVisible()
  })

  test('states exactly what approval locks and leaves open', async ({ page }) => {
    await openProof(page)
    await expect(page.getByText('Is this the product we are building?', { exact: true })).toHaveCount(1)
    await expect(page.getByText('A yes locks', { exact: true })).toBeVisible()
    await expect(page.getByText('Still open', { exact: true })).toBeVisible()
    await expect(page.getByText('The synthetic example, interface, visual system, final copy, implementation, data action, deployment, merge and release.')).toBeVisible()
  })

  test('preserves the whole proposition on a narrow phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openProof(page)
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('heading', { name: 'CTRL is a private AI Brain built with one leader over 30 days.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What happens in the 30 days' })).toBeVisible()
  })
})
