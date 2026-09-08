import { expect, test, type Page } from '@playwright/test'

const proof = '/g20-context-exchange-proof-r1.html'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
}

async function openProof(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(proof)
  await expect(page.getByRole('heading', { name: 'How can Maya make her quality standard usable by the team?' })).toBeVisible()
  expect(errors).toEqual([])
}

test.describe('G20 context exchange proof', () => {
  test('completes the synthetic capture, Claude handoff and attributed return loop', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 1440, height: 900 })
    await openProof(page)

    await page.getByRole('button', { name: 'Use a synthetic example' }).click()
    await expect(page.getByRole('heading', { name: 'Kept for Maya.' })).toBeVisible()
    await expect(page.getByText('No Brain meaning has been assumed')).toBeVisible()

    await page.getByRole('button', { name: /Prepare for Claude/ }).click()
    await expect(page.getByText('Claude will see')).toBeVisible()
    await expect(page.getByText('Stays in CTRL')).toBeVisible()
    await expect(page.getByText('Krish’s private note about team capability.')).toBeVisible()
    await expect(page.locator('.manifest-item')).toHaveCount(4)

    await page.getByRole('button', { name: /Use this context in Claude/ }).click()
    await expect(page.getByRole('heading', { name: 'Ready to use in Claude.' })).toBeVisible()
    await page.getByRole('button', { name: /Copy task starter/ }).click()
    await expect(page.getByRole('heading', { name: 'The starter is copied.' })).toBeVisible()
    await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain('CX-MAYA-014')

    await page.getByRole('button', { name: 'Bring result back' }).click()
    await expect(page.getByRole('heading', { name: 'What is worth keeping?' })).toBeVisible()
    await page.getByRole('button', { name: 'Use a synthetic result' }).click()
    await expect(page.getByRole('heading', { name: 'Kept as Claude’s suggestion.' })).toBeVisible()
    await expect(page.getByText('Claude suggestion · not Brain memory')).toBeVisible()
    await expect(page.locator('.provenance-grid')).toContainText('Maya’s words')
    await expect(page.locator('.provenance-grid')).toContainText('Krish’s judgement')
    await expect(page.locator('.provenance-grid')).toContainText('CTRL synthesis')
    await expect(page.locator('.provenance-grid')).toContainText('Claude suggestion')

    await page.getByRole('button', { name: /Finish exchange/ }).click()
    await expect(page.getByRole('heading', { name: 'What should Maya’s Brain hold?' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const vertical = await page.evaluate(() => ({ viewport: innerHeight, body: document.body.scrollHeight }))
    expect(vertical.body).toBeLessThanOrEqual(vertical.viewport)
  })

  test('ordinary paste is one gesture and preserves the exact source first', async ({ page }) => {
    await openProof(page)
    const input = page.getByLabel('Material to add for Maya')
    await input.evaluate((element, text) => {
      const transfer = new DataTransfer()
      transfer.setData('text/plain', text as string)
      element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: transfer }))
    }, 'Exact pasted customer wording.')
    await expect(page.getByRole('heading', { name: 'Kept for Maya.' })).toBeVisible()
    await expect(page.getByText('Exact pasted customer wording.')).toBeVisible()
    await expect(page.getByText('Unreviewed source')).toBeVisible()
  })

  test('link and file controls produce honest receipts', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'Add link' }).click()
    await page.getByPlaceholder('https://').fill('https://example.invalid/source')
    await page.getByRole('button', { name: 'Keep link' }).click()
    await expect(page.getByText('Saved link · just now')).toBeVisible()

    await page.getByRole('button', { name: 'Add something else' }).click()
    await page.locator('#file-input').setInputFiles({ name: 'maya-note.txt', mimeType: 'text/plain', buffer: Buffer.from('synthetic') })
    await expect(page.getByText(/maya-note\.txt/)).toBeVisible()
    await expect(page.getByText(/no extraction has been claimed/i)).toBeVisible()
  })

  test('failure states preserve the source and close the context boundary', async ({ page }) => {
    for (const [name, expected] of [
      ['duplicate', 'This source is already in Maya’s staging.'],
      ['delayed', 'The source is safe. Reading it is taking longer.'],
      ['expired', 'This context has expired.'],
      ['wrong', 'This exchange belongs to Maya.'],
    ] as const) {
      await page.goto(`${proof}?case=${name}`)
      await expect(page.getByRole('heading', { name: expected })).toBeVisible()
      await expect(page.locator('#receipt')).toContainText('CTRL')
    }
  })

  test('fits wide screen and remains usable at both mobile widths', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      await page.goto(proof)
      await expect(page.getByRole('heading', { name: 'What should Maya’s Brain hold?' })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      const targets = await page.locator('button:visible, a:visible, summary:visible').evaluateAll((elements) => elements.map((element) => {
        const box = element.getBoundingClientRect()
        return { label: element.textContent?.trim(), width: box.width, height: box.height }
      }))
      for (const target of targets) {
        expect(target.width, target.label).toBeGreaterThanOrEqual(44)
        expect(target.height, target.label).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('has a complete keyboard path and reduced-motion mode', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 844 })
    await openProof(page)
    await page.getByLabel('Material to add for Maya').focus()
    await page.keyboard.type('Typed with the keyboard')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Kept for Maya.' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
