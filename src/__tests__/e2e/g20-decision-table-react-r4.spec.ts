import { expect, test, type Page } from '@playwright/test'

const route = '/operator/customers/SYN-CUST-014/decisions/INT-014'
const protectedPreviewEntry = process.env.E2E_PROTECTED_PREVIEW_ENTRY

test.beforeEach(async ({ page }) => {
  if (protectedPreviewEntry) await page.goto(protectedPreviewEntry)
})

async function openDecision(page: Page, suffix = '') {
  await page.goto(`${route}${suffix}`)
  await expect(page.getByRole('heading', { name: /(?:How far should you rebuild marketing around AI\?|Should Aperture rebuild marketing around AI\?)/ })).toBeVisible()
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

  test('keeps the operator review signal truthful and quiet', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openDecision(page, '?review=ready')
    await expect(page.getByText('For your next session')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Should strong proposals move when the customer proof and three agreed quality checks are present?' })).toBeVisible()
    await page.getByRole('button', { name: 'Copy question' }).click()
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Question copied')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Should strong proposals move when the customer proof and three agreed quality checks are present?')

    await openDecision(page, '?review=empty')
    await expect(page.getByText('For your next session')).toHaveCount(0)
    await openDecision(page, '?review=unavailable')
    await expect(page.getByText('For your next session')).toHaveCount(0)
  })

  test('keeps one complete consequential turn inside a narrow phone viewport', async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      await openDecision(page, '?review=long')
      await expect(page.getByTestId('mobile-decision-session')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'What result would make this safe to scale?' })).toBeVisible()
      await expect(page.getByText('7 linked sources', { exact: true })).toBeVisible()
      await expect(page.getByText('For your next session')).toBeHidden()
      await expectNoHorizontalOverflow(page)
      const viewportFit = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight, viewport: innerHeight }))
      expect(viewportFit.scroll).toBeLessThanOrEqual(viewportFit.viewport + 1)
      const brand = page.getByRole('img', { name: 'Mindmake' })
      expect(await brand.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
      const targets = await page.locator('.mds button:visible').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height))
      expect(targets.every((height) => height >= 44)).toBe(true)
    }
  })

  test('answers, recalculates and keeps the human call separate on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await openDecision(page)
    await page.getByRole('button', { name: 'A customer result we can verify' }).click()
    await expect(page.getByText('Checking what this changes')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recommendation holds' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('mobile-decision-result')
    await expect(page.getByText('Saved in this session')).toBeVisible()
    await expect(page.getByTestId('mobile-decision-call')).toHaveCount(0)
    await page.getByRole('button', { name: 'Record my call' }).click()
    await expect(page.getByTestId('mobile-decision-call')).toBeVisible()
    await expect(page.getByText('Not recorded')).toBeVisible()
    await page.getByRole('button', { name: 'Run the proof first' }).click()
    await expect(page.getByRole('heading', { name: 'Run the proof first' })).toBeVisible()
    await expect(page.getByText('Held for this session only.', { exact: false })).toBeVisible()
    await expect(page.getByText(/has not written to a customer Brain or database/)).toBeVisible()
    await page.getByRole('button', { name: 'Change my call' }).click()
    await page.getByRole('button', { name: 'Leave this open' }).click()
    await expect(page.getByRole('heading', { name: 'Decision left open' })).toBeVisible()
    await expect(page.getByText('No human decision was recorded.', { exact: false })).toBeVisible()
  })

  test('opens the deeper basis as a separate full-screen layer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openDecision(page)
    await page.getByRole('button', { name: 'Inspect basis' }).click()
    const basis = page.getByTestId('mobile-decision-basis')
    await expect(basis).toBeVisible()
    await expect(basis.getByRole('heading', { name: /quality still depends on Maya/i })).toBeVisible()
    await expect(basis.getByRole('heading', { name: 'Evidence' })).toBeVisible()
    await expect(basis.getByRole('heading', { name: 'Routes considered' })).toBeVisible()
    await expect(basis.getByRole('heading', { name: 'Case against' })).toBeVisible()
    await basis.getByRole('button', { name: 'Back' }).click()
    await expect(basis).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Inspect basis' })).toBeFocused()
  })

  test('uses captured browser speech as an answer instead of a decorative voice control', async ({ page }) => {
    await page.addInitScript(() => {
      class FakeSpeechRecognition {
        continuous = false
        interimResults = false
        lang = ''
        maxAlternatives = 1
        onresult: ((event: unknown) => void) | null = null
        onerror: (() => void) | null = null
        onend: (() => void) | null = null
        start() {
          queueMicrotask(() => {
            this.onresult?.({ results: [{ 0: { transcript: 'A repeatable quality check' } }] })
            this.onend?.()
          })
        }
        abort() {}
      }
      ;(window as unknown as { SpeechRecognition: typeof FakeSpeechRecognition }).SpeechRecognition = FakeSpeechRecognition
    })
    await page.setViewportSize({ width: 320, height: 568 })
    await openDecision(page)
    await page.getByRole('button', { name: 'Say it instead' }).click()
    await expect(page.getByText('A repeatable quality check')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Still provisional' })).toBeVisible()
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
      if (viewport.width === 1440) {
        await expect(page.getByRole('tab')).toHaveCount(3)
        await expect(page.getByRole('button', { name: /Design the test/i })).toBeVisible()
        const height = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight, viewport: innerHeight }))
        expect(height.scroll).toBeLessThanOrEqual(height.viewport + 1)
      } else {
        await expect(page.getByRole('tab')).toHaveCount(0)
        await expect(page.getByRole('button', { name: /Design the test/i })).toBeHidden()
        await expect(page.getByTestId('mobile-decision-question')).toBeVisible()
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

  test('uses honest mobile projections for sparse, stale, conflicted, loading and failed data', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const states = [
      ['sparse', 'Needs evidence', 'There is not enough evidence'],
      ['stale', 'Stale', 'The previous recommendation is paused.'],
      ['conflicted', 'Evidence disagrees', 'Do not rebuild the whole function yet.'],
      ['loading', 'Updating', 'The previous view stays visible'],
      ['error', 'Update failed', 'No answer or decision has been lost.'],
    ] as const

    for (const [state, status, copy] of states) {
      await openDecision(page, `?state=${state}`)
      await expect(page.getByTestId('mobile-decision-status')).toHaveText(status)
      await expect(page.getByText(copy, { exact: false })).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }

    const actionableStates = [
      ['sparse', 'Evidence target set'],
      ['stale', 'Refresh target set'],
      ['conflicted', 'Conflict to resolve'],
    ] as const
    for (const [state, outcome] of actionableStates) {
      await openDecision(page, `?state=${state}`)
      await page.locator('.mds-choices button').first().click()
      await expect(page.getByRole('heading', { name: outcome })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Recommendation holds' })).toHaveCount(0)
    }

    await openDecision(page, '?state=stale')
    await page.getByRole('button', { name: 'Inspect basis' }).click()
    const staleBasis = page.getByTestId('mobile-decision-basis')
    await expect(staleBasis.getByRole('heading', { name: /recommendation is paused/i })).toBeVisible()
    await expect(staleBasis.getByText(/history, not a current recommendation/i)).toBeVisible()
    await expect(staleBasis.getByText('current view', { exact: false })).toHaveCount(0)
  })
})
