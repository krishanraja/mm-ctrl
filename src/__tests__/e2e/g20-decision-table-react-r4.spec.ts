import { expect, test, type Page } from '@playwright/test'

const route = '/operator/customers/SYN-CUST-014/decisions/INT-014'

async function openDecision(page: Page, suffix = '') {
  await page.goto(`${route}${suffix}`)
  await expect(page.getByRole('heading', { name: 'How far should you rebuild marketing around AI?' })).toBeVisible()
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G20 Decision Table R4 React slice', () => {
  test('opens as the approved consequential decision instrument', async ({ page }) => {
    await openDecision(page)
    await expect(page.getByText('The bigger risk is rebuilding the team before someone else can apply your quality standard.')).toBeVisible()
    await expect(page.getByText('You judge best through real comparison.')).toBeVisible()
    await expect(page.getByText('Make quality clear without killing surprise.')).toBeVisible()
    await expect(page.getByText('Can your standard travel without your final rescue?')).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(3)
    await expect(page.getByRole('tab', { name: /Current best route Prove the system first/i })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('button', { name: /Design the test/i })).toBeVisible()
    await expect(page.getByText(/customer projection/i)).toHaveCount(0)
  })

  test('keeps one tap-first question at a time and adds it to the brief', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openDecision(page)
    await page.getByRole('button', { name: 'Ask three useful questions about this decision' }).click()
    await expect(page.getByRole('heading', { name: 'One question' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Before work goes out, what do you usually fix first?' })).toBeVisible()
    await expect(page.getByText('1 of 3')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep answer' })).toBeDisabled()
    await page.getByRole('button', { name: 'The proof' }).click()
    await page.getByRole('button', { name: 'Add a note' }).click()
    await page.getByRole('textbox', { name: 'Optional note' }).fill('The claim had no fresh customer evidence.')
    await page.getByRole('button', { name: 'Keep answer' }).click()
    await expect(page.getByRole('heading', { name: 'Before changing the team, which fact would you most want to know?' })).toBeVisible()
    await page.getByRole('button', { name: 'Which work customers value' }).click()
    await page.getByRole('button', { name: 'Find this for me' }).click()
    await expect(page.getByText('3 of 3')).toBeVisible()
    await page.getByRole('button', { name: 'One owner for the new measures' }).click()
    await page.getByRole('button', { name: 'Keep answer' }).click()
    await page.getByRole('button', { name: /Design the test/i }).click()
    await page.getByRole('button', { name: /Build the Claude brief/i }).click()
    await expect(page.locator('#brief-text')).toContainText('NEW DECISION-SHARPENING INPUTS')
    await expect(page.locator('#brief-text')).toContainText('The claim had no fresh customer evidence.')
    await page.getByRole('button', { name: /Copy complete brief/i }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('LEADER ANSWER')
    expect(copied).toContain('EVIDENCE REQUEST PENDING')
    expect(copied).toContain('PRIOR DECISION MATCH')
  })

  test('compares routes, carries a full Claude brief and judges the return', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openDecision(page)
    await page.getByRole('tab', { name: /Rebuild now/i }).click()
    await expect(page.getByText('Fits your appetite to move.')).toBeVisible()
    await page.getByRole('tab', { name: /Add tools gradually/i }).click()
    await expect(page.getByText('Conflicts with your current diagnosis.')).toBeVisible()
    await page.getByRole('button', { name: 'Show the strongest counter-case' }).click()
    await expect(page.getByText(/Distributed adoption may surface unexpected high-agency builders/)).toBeVisible()
    await page.getByRole('button', { name: /Design the test/i }).click()
    await page.getByRole('button', { name: /Build the Claude brief/i }).click()
    await page.getByRole('button', { name: /Copy complete brief/i }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    for (const section of ['DECISION', "MAYA'S CURRENT VIEW", 'SUPPORTED BRAIN READ', 'HOW MAYA JUDGES', 'IMPORTANT SYNTHETIC EVIDENCE', 'UNKNOWNS', 'DO NOT ASSUME', 'YOUR TASK']) {
      expect(copied).toContain(section)
    }
    expect(copied).not.toMatch(/CX-MAYA|capsule|reference [A-Z]{2}-/i)
    await page.getByRole('button', { name: 'Use the synthetic return' }).click()
    await expect(page.getByRole('heading', { name: 'Do not use this plan yet.' })).toBeVisible()
    await expect(page.getByText('This does not choose a real operating model.')).toBeVisible()
    await page.getByRole('button', { name: 'Finding 5' }).click()
    await expect(page.getByText('Keep this part.')).toBeVisible()
  })

  test('source and evidence controls work without persistence claims', async ({ page }) => {
    await openDecision(page)
    await page.getByRole('button', { name: '2 sources' }).first().click()
    await expect(page.getByRole('heading', { name: 'Why the Brain thinks this' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await page.getByRole('button', { name: 'Add evidence' }).click()
    await page.getByPlaceholder('Paste or type here').fill('The team challenged the pilot boundary.')
    await page.getByRole('button', { name: /Keep with this decision/i }).click()
    await expect(page.getByText('Kept with this decision as an unreviewed synthetic note.')).toBeVisible()
  })

  test('preserves the decision at desktop and mobile sizes', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      await openDecision(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.getByRole('tab')).toHaveCount(3)
      await expect(page.getByRole('button', { name: /Design the test/i })).toBeVisible()
      if (viewport.width === 390) await expect(page.getByRole('button', { name: /Design the test/i })).toBeInViewport()
      if (viewport.width === 1440) {
        const height = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight, viewport: innerHeight }))
        expect(height.scroll).toBeLessThanOrEqual(height.viewport + 1)
      }
      const undersized = await page.locator('.dt-shell button:visible, .dt-shell a:visible').evaluateAll((elements) => elements.filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width < 38 || rect.height < 38
      }).map((element) => ({ text: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
      expect(undersized).toEqual([])
    }
  })

  test('fails honestly for sparse, stale and wrong-customer states', async ({ page }) => {
    await openDecision(page, '?state=sparse')
    await expect(page.getByText(/does not yet know which positive signal/)).toBeVisible()
    await openDecision(page, '?state=stale')
    await expect(page.getByText(/cannot steer the decision until it is checked/)).toBeVisible()
    await openDecision(page, '?state=wrong')
    await page.getByRole('button', { name: /Design the test/i }).click()
    await page.getByRole('button', { name: /Build the Claude brief/i }).click()
    await expect(page.getByRole('button', { name: 'Return to Maya before copying' })).toBeDisabled()
    await expect(page.getByText(/belongs to a different selected customer/)).toBeVisible()
  })
})
