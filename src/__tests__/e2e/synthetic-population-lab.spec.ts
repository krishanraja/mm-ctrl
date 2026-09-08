import { expect, test, type Page } from '@playwright/test'

const root = '/operator/lab/synthetic-population'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
}

test.describe('synthetic population lab', () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${root}/SYN-CUST-101`)
    await expect(page.getByTestId('synthetic-population-lab')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('is a no-scroll desktop instrument with working case navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Amina Bello' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const vertical = await page.evaluate(() => ({ viewport: window.innerHeight, body: document.body.scrollHeight }))
    expect(vertical.body).toBeLessThanOrEqual(vertical.viewport)

    await page.getByLabel('Next case: Theo Grant').click()
    await expect(page).toHaveURL(`${root}/SYN-CUST-102`)
    await expect(page.getByRole('heading', { level: 1, name: 'Theo Grant' })).toBeVisible()
  })

  test('contains long identity and long-token cases without horizontal clipping', async ({ page }) => {
    await page.goto(`${root}/SYN-CUST-107`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.goto(`${root}/SYN-CUST-126`)
    await page.getByText('Inspect source content').click()
    await expectNoHorizontalOverflow(page)
    await expect(page.locator('.spl-source-card details p')).toBeVisible()
  })

  test('supports keyboard search and case selection', async ({ page }) => {
    const search = page.getByPlaceholder('Search people or cases')
    await search.focus()
    await page.keyboard.type('Priya Raman')
    const result = page.getByRole('link', { name: /Priya Raman/ })
    await expect(result).toBeVisible()
    await result.focus()
    await expect(result).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Priya Raman' })).toBeVisible()
  })

  test('keeps script-shaped source content inert', async ({ page }) => {
    await page.goto(`${root}/SYN-CUST-132`)
    await page.getByText('Inspect source content').click()
    await expect(page.locator('.spl-source-card details p')).toContainText('<script>window.location=')
    await expect(page.locator('.spl-source-card script')).toHaveCount(0)
    await expect(page).toHaveURL(`${root}/SYN-CUST-132`)
  })

  test('preserves Arabic and mixed-direction content', async ({ page }) => {
    await page.goto(`${root}/SYN-CUST-106`)
    await page.getByText('Inspect source content').click()
    await expect(page.locator('.spl-source-card details p')).toContainText('للذكاء الاصطناعي')
    await expectNoHorizontalOverflow(page)
  })

  test('uses a practical mobile selector and allows vertical disclosure', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await expect(page.locator('#spl-account-select')).toBeVisible()
    await page.locator('#spl-account-select').selectOption('SYN-CUST-132')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expect(page.locator('.spl-rail')).toBeHidden()
  })

  test('remains usable in a reduced-motion compact viewport', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 720, height: 450 })
    await page.goto(`${root}/SYN-CUST-125`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#spl-account-select')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('fails closed for an unknown synthetic identity', async ({ page }) => {
    await page.goto(`${root}/SYN-CUST-999`)
    await expect(page.getByTestId('synthetic-population-lab')).toHaveCount(0)
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })
})
