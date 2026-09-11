import { expect, test, type Page } from '@playwright/test'

const proof = '/g20-decision-table-proof-r3.html'
const protectedPreviewEntry = process.env.E2E_PROTECTED_PREVIEW_ENTRY

async function openProof(page: Page, suffix = '') {
  await page.goto(`${proof}${suffix}`)
  await expect(page.getByRole('heading', { name: 'How far should you rebuild marketing around AI?' })).toBeVisible()
}

async function expectNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1)
}

test.describe('G20 Decision Table R3 proof', () => {
  test.beforeEach(async ({ page }) => {
    if (protectedPreviewEntry) await page.goto(protectedPreviewEntry)
  })

  test('opens with the consequential decision and three personal recognitions', async ({ page }) => {
    await openProof(page)
    await expect(page.getByText('The bigger risk is rebuilding the team before someone else can apply your quality standard.')).toBeVisible()
    await expect(page.getByText('You judge best through real comparison.')).toBeVisible()
    await expect(page.getByText('Make quality clear without killing surprise.')).toBeVisible()
    await expect(page.getByText('Can your standard travel without your final rescue?')).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(3)
    await expect(page.getByRole('tab', { name: /Current best route Prove the system first/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ask three harder questions about this decision' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Design the test/ })).toBeVisible()
  })

  test('keeps harder questions optional, contextual and one at a time', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openProof(page)
    await page.getByRole('button', { name: 'Ask three harder questions about this decision' }).click()
    await expect(page.getByRole('heading', { name: 'What could change the call?' })).toBeVisible()
    await expect(page.getByText('YOU CAN ANSWER')).toBeVisible()
    await expect(page.getByText('1 of 3')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Think of the last piece of work you rescued. What did you notice before anyone else could name it?' })).toBeVisible()
    await page.getByRole('button', { name: 'Answer now' }).click()
    await page.getByRole('textbox', { name: 'Answer to the harder question' }).fill('The central claim could have belonged to any competitor.')
    await page.getByRole('button', { name: 'Keep answer' }).click()
    await expect(page.getByText('THE BRAIN CAN FIND')).toBeVisible()
    await expect(page.getByText('2 of 3')).toBeVisible()
    await expect(page.getByRole('heading', { name: /what predicted a strong result better/ })).toBeVisible()
    await page.getByRole('button', { name: 'Find this in the work' }).click()
    await expect(page.getByText(/compare campaign versions, your approval changes, customer response/)).toBeVisible()
    await page.getByRole('button', { name: 'Add evidence task' }).click()
    await expect(page.getByText('FROM AN EARLIER DECISION')).toBeVisible()
    await expect(page.getByText('3 of 3')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'A previous team redesign changed the structure but kept the old scorecard. What makes this pilot different?' })).toBeVisible()
    await page.getByRole('button', { name: 'Show the earlier pattern' }).click()
    await expect(page.getByText(/Synthetic decision DEC-MAYA-014/)).toBeVisible()
    await page.getByRole('button', { name: 'Keep with this decision' }).click()
    await page.getByRole('tab', { name: /Rebuild now/ }).click()
    await page.getByRole('button', { name: 'Ask three harder questions about this decision' }).click()
    await expect(page.getByRole('heading', { name: 'What quality failure would make a fast rebuild impossible to defend?' })).toBeVisible()
    await page.locator('#challenge-modal [data-close]').click()
    await page.getByRole('button', { name: /Design the test/ }).click()
    await page.getByRole('button', { name: /Build the Claude brief/ }).click()
    await expect(page.locator('#brief-text')).toContainText('NEW DECISION-SHARPENING INPUTS')
    await expect(page.locator('#brief-text')).toContainText('The central claim could have belonged to any competitor.')
    await page.getByRole('button', { name: /Copy complete brief/ }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('LEADER ANSWER')
    expect(copied).toContain('EVIDENCE REQUEST PENDING')
    expect(copied).toContain('PRIOR DECISION MATCH')
    expect(copied).toContain('Treat leader answers as direct input, pending evidence tasks as unknown, and prior-decision matches as prompts for scrutiny rather than proof.')
  })

  test('personal evidence changes the interpretation of each route', async ({ page }) => {
    await openProof(page)
    await page.getByRole('tab', { name: /Rebuild now/ }).click()
    await expect(page.getByText('Fits your appetite to move.')).toBeVisible()
    await expect(page.getByText(/automating output before your way of judging quality can travel/)).toBeVisible()
    await page.getByRole('tab', { name: /Add tools gradually/ }).click()
    await expect(page.getByText('Conflicts with your current diagnosis.')).toBeVisible()
    await page.getByRole('button', { name: 'Show the strongest counter-case' }).click()
    await expect(page.getByText(/Distributed adoption may surface unexpected high-agency builders/)).toBeVisible()
  })

  test('copies a complete standalone Claude brief and audits the returned plan', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openProof(page)
    await page.getByRole('button', { name: /Design the test/ }).click()
    await page.getByRole('button', { name: /Build the Claude brief/ }).click()
    await page.getByRole('button', { name: /Copy complete brief/ }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('DECISION')
    expect(copied).toContain("MAYA'S CURRENT VIEW")
    expect(copied).toContain('SUPPORTED BRAIN READ')
    expect(copied).toContain('HOW MAYA JUDGES')
    expect(copied).toContain('IMPORTANT SYNTHETIC EVIDENCE')
    expect(copied).toContain('UNKNOWNS')
    expect(copied).toContain('DO NOT ASSUME')
    expect(copied).toContain('YOUR TASK')
    expect(copied).not.toMatch(/CX-MAYA|capsule|reference [A-Z]{2}-/i)
    await page.getByRole('button', { name: 'Use the synthetic return' }).click()
    await expect(page.getByRole('heading', { name: 'Do not use this plan yet.' })).toBeVisible()
    await expect(page.getByText('This does not choose a real operating model.')).toBeVisible()
    await page.getByRole('button', { name: 'Finding 5' }).click()
    await expect(page.getByText('Keep this part.')).toBeVisible()
  })

  test('source and evidence capture controls do real work', async ({ page }) => {
    await openProof(page)
    await page.getByRole('button', { name: '2 sources' }).first().click()
    await expect(page.getByRole('heading', { name: 'Why the Brain thinks this' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await page.getByRole('button', { name: 'Add evidence' }).click()
    await page.getByPlaceholder('Paste or type here').fill('The team challenged the pilot boundary.')
    await page.getByRole('button', { name: /Keep with this decision/ }).click()
    await expect(page.getByText('Kept with this decision as an unreviewed synthetic note.')).toBeVisible()
  })

  test('mobile and desktop preserve the decision without horizontal overflow', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      await openProof(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.getByRole('tab')).toHaveCount(3)
      await expect(page.getByRole('button', { name: /Design the test/ })).toBeVisible()
      if (viewport.width === 390) await expect(page.getByRole('button', { name: /Design the test/ })).toBeInViewport()
      if (viewport.width === 1440) {
        const height = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight, viewport: innerHeight }))
        expect(height.scroll).toBeLessThanOrEqual(height.viewport + 1)
      }
      const undersized = await page.locator('button:visible, a:visible').evaluateAll(elements => elements.filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.width < 38 || rect.height < 38
      }).map(el => ({ text: el.textContent, rect: el.getBoundingClientRect().toJSON() })))
      expect(undersized).toEqual([])
    }
  })

  test('sparse, stale and wrong-customer states fail honestly', async ({ page }) => {
    await openProof(page, '?state=sparse')
    await expect(page.getByText(/does not yet know the positive signal/)).toBeVisible()
    await openProof(page, '?state=stale')
    await expect(page.getByText(/cannot steer the decision until it is checked/)).toBeVisible()
    await page.getByRole('button', { name: /Design the test/ }).click()
    await page.getByRole('button', { name: /Build the Claude brief/ }).click()
    await page.goto(`${proof}?state=wrong`)
    await page.getByRole('button', { name: /Design the test/ }).click()
    await page.getByRole('button', { name: /Build the Claude brief/ }).click()
    await expect(page.getByRole('button', { name: 'Return to Maya before copying' })).toBeDisabled()
    await expect(page.getByText(/belongs to a different selected customer/)).toBeVisible()
  })
})
