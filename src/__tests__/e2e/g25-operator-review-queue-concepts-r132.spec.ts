import { expect, test } from '@playwright/test'

const path = '/g25-operator-review-queue-concepts-r132.html'
const candidates = ['a', 'b', 'c'] as const

test.describe('R132 operator review queue concepts', () => {
  for (const candidate of candidates) {
    test(`${candidate} keeps the five-field signal legible without leaking machinery`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`${path}?candidate=${candidate}&state=ready${candidate === 'c' ? '&open=1' : ''}`)
      await expect(page.getByText('Should strong proposals move when the customer proof and three agreed quality checks are present?')).toBeVisible()
      await expect(page.getByText('Maya decides.')).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/packet|sha256|confidence|deploy|permission/i)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(overflow).toBe(false)
      const undersized = await page.locator('button:visible').evaluateAll((buttons) => buttons.filter((button) => {
        const bounds = button.getBoundingClientRect()
        return bounds.width < 44 || bounds.height < 44
      }).length)
      expect(undersized).toBe(0)
    })

    test(`${candidate} keeps empty and unavailable publicly indistinguishable`, async ({ page }) => {
      await page.goto(`${path}?candidate=${candidate}&state=empty`)
      const emptyText = (await page.locator('#app').innerText()).replace(/\s+/g, ' ').trim()
      await page.goto(`${path}?candidate=${candidate}&state=unavailable`)
      const unavailableText = (await page.locator('#app').innerText()).replace(/\s+/g, ' ').trim()
      expect(unavailableText).toBe(emptyText)
      await expect(page.getByText(candidate === 'c' ? 'Nothing waiting' : 'Nothing needs Maya right now.')).toBeVisible()
    })

    test(`${candidate} reflows long valid copy at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(`${path}?candidate=${candidate}&state=long${candidate === 'c' ? '&open=1' : ''}`)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(overflow).toBe(false)
      await expect(page.getByRole('button', { name: 'Copy question' })).toBeAttached()
    })
  }

  test('candidate c restores focus when the dialog closes', async ({ page }) => {
    await page.goto(`${path}?candidate=c&state=ready`)
    const trigger = page.getByRole('button', { name: 'One discussion for Maya' })
    await trigger.focus()
    await trigger.press('Enter')
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('the only useful action copies the exact question', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`${path}?candidate=b&state=ready`)
    await page.getByRole('button', { name: 'Copy question' }).click()
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
      'Should strong proposals move when the customer proof and three agreed quality checks are present?',
    )
  })
})
