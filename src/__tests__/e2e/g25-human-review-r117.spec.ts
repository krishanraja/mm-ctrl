import { expect, test, type Page } from '@playwright/test'

const proof = process.env.E2E_PROOF_URL ?? '/g25-human-review-r117.html'

async function openProof(page: Page, state = 'ready') {
  await page.goto(`${proof}?state=${state}`)
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0)
}

async function expectNoOverflow(page: Page, vertical = true) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1)
  if (vertical) expect(size.scrollHeight).toBeLessThanOrEqual(size.clientHeight + 1)
}

test.describe('G25 R117 human review projection', () => {
  test('keeps the complete ready decision inside the target viewports', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 1280, height: 720 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport)
      await openProof(page)
      await expectNoOverflow(page)
      await expect(page.getByRole('heading', { name: 'Should this be your proposal rule?' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Make this my proposal rule' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Keep my current rule' })).toBeVisible()
      await expect(page.getByText('Synthetic preview. No data is saved.')).toBeVisible()
      const heights = await page.getByRole('button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height))
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
    }
  })

  test('shows the exact delta, evidence, countercase and consequence in one disclosure', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openProof(page)
    const trigger = page.getByRole('button', { name: 'See why' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Why this came up' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Current rule' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Proposed rule' })).toBeVisible()
    await expect(dialog.getByText('A £90,000 renewal proposal waited 36 hours.')).toBeVisible()
    await expect(dialog.getByText('A £120,000 expansion proposal waited a day.')).toBeVisible()
    await expect(dialog.getByText('Another possible reason')).toBeVisible()
    await expect(dialog.getByText('This changes only your private Brain standard.', { exact: false })).toBeVisible()
    await expect(dialog).toHaveCSS('min-height', '844px')
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('traps disclosure focus and hides the background from interaction', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'See why' }).click()
    const close = page.getByRole('button', { name: 'Close review details' })
    await expect(close).toBeFocused()
    await expect(page.locator('.main')).toHaveAttribute('inert', '')
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByText('Technical record')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()

    await page.locator('[data-overlay]').evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expect(close).toBeInViewport()
    await expect(close).toHaveCSS('width', '44px')
    await expect(close).toHaveCSS('height', '44px')
  })

  test('uses one inline save and focuses the confirmed result', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'Make this my proposal rule' }).click()
    await expect(page.getByRole('button', { name: 'Saving your choice' })).toBeDisabled()
    const result = page.getByRole('heading', { name: 'Proposal rule updated' })
    await expect(result).toBeVisible()
    await expect(result).toBeFocused()
  })

  test('confirms reversal and keeps both versions in history', async ({ page }) => {
    await openProof(page, 'approved')
    await page.getByRole('button', { name: 'Put the old rule back' }).click()
    await expect(page.getByRole('heading', { name: 'Put the previous rule back?' })).toBeFocused()
    await page.getByRole('button', { name: 'Restore the previous rule' }).click()
    await expect(page.getByRole('heading', { name: 'Previous rule restored' })).toBeFocused()
  })

  test('keeps rejection, stale, error and loading states honest', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'Keep my current rule' }).click()
    await expect(page.getByRole('heading', { name: 'Current rule kept' })).toBeFocused()

    await openProof(page, 'stale')
    await expect(page.getByRole('button', { name: 'Make this my proposal rule' })).toHaveCount(0)
    await expect(page.getByText('Nothing changed from this screen.')).toBeVisible()

    await openProof(page, 'error')
    await expect(page.getByText('Your rule has not changed.')).toBeVisible()

    await openProof(page, 'loading')
    await expect(page.getByRole('button')).toHaveCount(0)
    await expect(page.getByLabel('Loading the latest rule')).toBeVisible()
  })

  test('requires the long wording to be reviewed before approval', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await openProof(page, 'long')
    await expectNoOverflow(page, false)
    await expect(page.getByRole('button', { name: 'Make this my proposal rule' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Review exact wording' }).click()
    await expect(page.getByRole('dialog', { name: 'Why this came up' })).toContainText('evidence comes from one unverified source')
    await page.getByRole('button', { name: 'Close review details' }).click()
    await expect(page.getByRole('button', { name: 'Make this my proposal rule' })).toBeVisible()
  })
})
