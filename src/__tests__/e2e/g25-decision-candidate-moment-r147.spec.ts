import { expect, test, type Page } from '@playwright/test'

const route = '/preview/decision-candidate-moment'
const claim = 'The plan assumes customers will change more slowly than the category.'

async function openMoment(page: Page) {
  await page.goto(route)
  await expect(page.getByRole('heading', { name: claim })).toBeVisible()
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G25 decision candidate moment R147', () => {
  test('asks one plain question and keeps the evidence one layer down', async ({ page }) => {
    await openMoment(page)
    await expect(page.getByRole('heading')).toHaveCount(1)
    await expect(page.getByText('Does that sound right?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Change it' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'No, this is not right' })).toBeVisible()
    await expect(page.getByText('Three major customers adopted AI-led category research')).toHaveCount(0)

    await page.getByRole('button', { name: 'Why CTRL thinks this' }).click()
    await expect(page.getByText(/Three major customers adopted AI-led category research/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hide why' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('supports the three honest outcomes', async ({ page }) => {
    await openMoment(page)
    await page.getByRole('button', { name: 'Yes' }).click()
    await expect(page.getByText('This is now recorded as your answer.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: claim })).toBeVisible()
    await page.getByRole('button', { name: 'Change it' }).click()
    await page.getByLabel('Say what is true instead').fill('Customers are changing now, but our evidence is concentrated in one segment.')
    await page.getByRole('button', { name: 'Use my wording' }).click()
    await expect(page.getByText('Your wording replaced CTRL’s proposal as the answer.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: claim })).toBeVisible()
    await page.getByRole('button', { name: 'No, this is not right' }).click()
    await expect(page.getByText('CTRL will not use that proposal as your answer.')).toBeVisible()
  })

  test('fits the first decision on phone and desktop without undersized controls', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      await openMoment(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.getByRole('button', { name: 'Yes' })).toBeInViewport()
      await expect(page.getByRole('button', { name: 'Change it' })).toBeInViewport()
      await expect(page.getByRole('button', { name: 'No, this is not right' })).toBeInViewport()
      const undersized = await page.locator('.dcm button:visible').evaluateAll((elements) => elements.filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44
      }).map((element) => ({ text: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
      expect(undersized).toEqual([])
    }
  })
})
