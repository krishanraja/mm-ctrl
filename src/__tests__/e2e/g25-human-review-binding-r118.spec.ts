import { expect, test, type Page } from '@playwright/test'

const route = process.env.E2E_R118_ROUTE ?? '/operator/reviews/SYN-REVIEW-118'
const protectedPreviewEntry = process.env.E2E_PROTECTED_PREVIEW_ENTRY

test.beforeEach(async ({ page }) => {
  if (protectedPreviewEntry) await page.goto(protectedPreviewEntry)
})

async function openReview(page: Page, suffix = '') {
  await page.goto(`${route}${suffix}`)
  await expect(page.getByRole('heading', { name: 'Should this be your proposal rule?' })).toBeVisible()
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G25 human review R118 product binding', () => {
  test('keeps the approved one-question hierarchy and centred actions', async ({ page }) => {
    await openReview(page)
    await expect(page.getByText('Review proposals above £250,000 or changes to the company promise.')).toBeVisible()
    const primary = page.getByRole('button', { name: 'Make this my rule' })
    const secondary = page.getByRole('button', { name: 'Keep my current rule' })
    await expect(primary).toBeVisible()
    await expect(secondary).toBeVisible()
    expect(await primary.evaluate((element) => getComputedStyle(element).justifyContent)).toBe('center')
    expect(await secondary.evaluate((element) => getComputedStyle(element).textAlign)).toBe('center')
    await expect(page.getByText('Synthetic preview. No data is saved.')).toBeVisible()
  })

  test('keeps exact evidence, countercase, risk and validation one layer down', async ({ page }) => {
    await openReview(page)
    const trigger = page.getByRole('button', { name: 'See why' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Why this came up' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close review details' })).toBeFocused()
    await expect(dialog).toContainText('A £90,000 renewal proposal waited 36 hours')
    await expect(dialog).toContainText('The team may be applying the current rule inconsistently.')
    await expect(dialog).toContainText('A lower-value proposal could still carry material brand risk.')
    await expect(dialog).toContainText('Inspect the next five proposals and every exception.')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('approves, confirms reversal and restores the previous rule', async ({ page }) => {
    await openReview(page)
    await page.getByRole('button', { name: 'Make this my rule' }).click()
    await expect(page.getByRole('heading', { name: 'Rule updated' })).toBeFocused()
    await page.getByRole('button', { name: 'Put the old rule back' }).click()
    await expect(page.getByRole('heading', { name: 'Put the previous rule back?' })).toBeFocused()
    await page.getByRole('button', { name: 'Restore the previous rule' }).click()
    await expect(page.getByRole('heading', { name: 'Previous rule restored' })).toBeFocused()
  })

  test('keeps stale and incomplete projections non-actionable', async ({ page }) => {
    await openReview(page, '?state=stale')
    await page.getByRole('button', { name: 'Make this my rule' }).click()
    await expect(page.getByRole('heading', { name: 'This rule changed while you were reviewing it' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Make this my rule' })).toHaveCount(0)

    await page.goto(`${route}?state=incomplete`)
    await expect(page.getByRole('heading', { name: 'We could not finish this review' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Make this my rule' })).toHaveCount(0)
  })

  test('survives the intended desktop, phone and 320px viewports', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      await openReview(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.getByRole('button', { name: 'Make this my rule' })).toBeInViewport()
      await expect(page.getByRole('button', { name: 'Keep my current rule' })).toBeInViewport()
      const undersized = await page.locator('.standard-review-experience button:visible').evaluateAll((elements) => elements.filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44
      }).map((element) => ({ text: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
      expect(undersized).toEqual([])
    }
  })
})
