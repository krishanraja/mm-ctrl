import { expect, test, type Page } from '@playwright/test'

const proof = '/g22-whole-product-golden-path-r1.html'
const protectedPreviewEntry = process.env.E2E_PROTECTED_PREVIEW_ENTRY

async function openProof(page: Page, suffix = '?reset=1') {
  await page.goto(`${proof}${suffix}`)
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveText('Fixture unavailable')
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G22 whole-product golden-path R1', () => {
  test.beforeEach(async ({ page }) => {
    if (protectedPreviewEntry) await page.goto(protectedPreviewEntry)
  })

  test('opens on one consequential case with one concrete Maya question', async ({ page }) => {
    await openProof(page)
    await expect(page.getByRole('heading', { name: 'How far should Aperture House rebuild marketing around AI?' })).toBeVisible()
    await expect(page.getByText('£1,200,000')).toBeVisible()
    await expect(page.getByText('8 roles')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'More output could hide the same old bottleneck.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'If the pilot ships more work but Maya still has to redo the final version, has it worked?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Compare the routes' })).toBeDisabled()
    await page.getByRole('button', { name: 'Living Brain' }).click()
    await expect(page.getByText('No route is owned yet.')).toBeVisible()
    await expect(page.getByText('Later work changed')).toHaveCount(0)
    await expect(page.getByRole('button', { name: "Prepare Maya's copy" })).toHaveCount(0)
  })

  test('carries Maya answer through the call, correction, later work, Brain and portable copy', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'No', exact: true }).click()
    await expect(page.getByText('The first gate becomes independent launch quality, not output volume.')).toBeVisible()
    await page.getByRole('button', { name: 'Compare the routes' }).click()
    await expect(page.getByRole('heading', { name: 'Compare three real operating routes.' })).toBeVisible()
    await page.getByRole('tab', { name: /Prove the system first/ }).click()
    await page.getByRole('button', { name: 'Use this route' }).click()
    await expect(page.getByText('Maya keeps the final review for all marketing work.')).toBeVisible()
    await page.getByRole('button', { name: 'Not quite' }).click()
    await page.getByRole('button', { name: 'Launch work only' }).click()
    await expect(page.getByRole('heading', { name: 'The next preparation already knows the boundary.' })).toBeVisible()
    await expect(page.getByText("Final approval for launch work: Maya. Weekly work uses the agreed quality check without Maya's final review.")).toBeVisible()
    await page.getByRole('button', { name: 'Inspect the Living Brain' }).click()
    await expect(page.getByRole('heading', { name: 'What CTRL used, and what it changed.' })).toBeVisible()
    await expect(page.getByText('Corrected and accepted', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: "Prepare Maya's copy" }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download Brain copy' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('maya-chen-living-brain-v1.3.synthetic.json')
    await expect(page.getByText('Downloaded locally. The file is a self-describing synthetic Brain bundle.')).toBeVisible()
  })

  test('rejection prevents the proposed learning from changing later work', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: 'No', exact: true }).click()
    await page.getByRole('button', { name: 'Compare the routes' }).click()
    await page.getByRole('button', { name: 'Use this route' }).click()
    await page.getByRole('button', { name: 'Reject' }).click()
    await expect(page.getByRole('heading', { name: 'Maya rejected the interpretation.' })).toBeVisible()
    await expect(page.getByText('CTRL did not apply the rejected proposal.')).toBeVisible()
    await page.getByRole('button', { name: 'Inspect the Living Brain' }).click()
    await expect(page.getByText('The rejected proposal did not shape later work.')).toBeVisible()
  })

  test('quiet, sparse and stale states fail honestly', async ({ page }) => {
    await openProof(page, '?scenario=quiet')
    await expect(page.getByRole('heading', { name: 'Nothing needs Maya today.' })).toBeVisible()
    await openProof(page, '?scenario=sparse')
    await expect(page.getByRole('heading', { name: 'Not enough evidence to advise this call.' })).toBeVisible()
    await openProof(page, '?scenario=stale')
    await expect(page.getByRole('heading', { name: 'The scorecard is too old for this call.' })).toBeVisible()
  })

  test('mobile shows one immediate Maya action without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openProof(page)
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('heading', { name: 'If the pilot ships more work but Maya still has to redo the final version, has it worked?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'No', exact: true })).toBeInViewport()
    await expect(page.locator('.work-sheet')).toBeHidden()
    const undersized = await page.locator('button:visible').evaluateAll(elements => elements.filter(element => {
      const rect = element.getBoundingClientRect()
      return rect.width < 38 || rect.height < 38
    }).map(element => element.textContent))
    expect(undersized).toEqual([])
  })
})
