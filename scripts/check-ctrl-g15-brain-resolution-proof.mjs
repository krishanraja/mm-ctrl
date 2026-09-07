import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:4189/g15-brain-resolution-proof-r1.html';
const fixturePath = resolve('project-documentation/ctrl-evolution/design/g15-judgement-resolution-fixture.json');
const evidenceDir = resolve('project-documentation/ctrl-evolution/design/evidence');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
await mkdir(evidenceDir, { recursive: true });

let failures = 0;
const pass = message => console.log(`PASS ${message}`);
const fail = message => { failures += 1; console.error(`FAIL ${message}`); };
const expect = (message, condition) => condition ? pass(message) : fail(message);

const delegation = fixture.territories.find(item => item.id === 'JT-03');
const privateTerritory = fixture.territories.find(item => item.id === 'JT-04');
expect('fixture: explicitly synthetic', fixture.fixture_status === 'synthetic_demo' && fixture.disclosure.includes('synthetic'));
expect('fixture: delegation is revising and unscored', delegation.state === 'revising' && delegation.score_internal === null);
expect('fixture: no delegation holdout may be implied', delegation.holdout_refs.length === 0 && delegation.transfer_refs.length === 0);
expect('fixture: private territory is intentional scope', privateTerritory.scope_status === 'intentionally_out_of_scope' && privateTerritory.score_internal === null);
expect('fixture: strong handcrafted baseline remains unrun', fixture.baselines.some(item => item.name === 'strong handcrafted context' && item.status === 'not_yet_run'));

const browser = await chromium.launch({ headless: true });
for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'networkidle' });

  expect(`${viewport.name}: page responds`, response?.ok());
  expect(`${viewport.name}: canonical fixture validates`, await page.locator('body').getAttribute('data-fixture') === 'validated');
  expect(`${viewport.name}: current receipt is the opening surface`, await page.locator('[data-screen="receipt"]').isVisible());
  expect(`${viewport.name}: first frame leads with the corrected interpretation`, (await page.locator('#receiptTitle').textContent()).trim() === 'Delegation looks different now.');
  const opening = await page.locator('.hero').innerText();
  expect(`${viewport.name}: opening preserves correction and current reading`, opening.includes('fundamentally resist delegation weakened') && opening.includes('evaluation standard is still hard to transfer'));
  expect(`${viewport.name}: opening states the held-out limit`, opening.includes('has not yet survived a held-out operating decision'));
  expect(`${viewport.name}: no visible percentage or completion language`, !(await page.locator('body').innerText()).includes('%') && !/complete|completion|level up/i.test(opening));
  expect(`${viewport.name}: one opening primary action`, await page.locator('.hero .primary:visible').count() === 1);
  expect(`${viewport.name}: no opening horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({ path: resolve(evidenceDir, `g15-r1-${viewport.name}-receipt.png`), fullPage: false });

  await page.getByRole('button', { name: /See what changed/ }).click();
  expect(`${viewport.name}: before and now are disclosed`, await page.locator('#changeSection').isVisible());
  const change = await page.locator('#changeSection').innerText();
  expect(`${viewport.name}: prior and current interpretations are exact`, change.includes('You fundamentally resist delegation') && change.includes('evaluation standard remains hard to transfer'));
  expect(`${viewport.name}: prior meaning is preserved rather than erased`, change.toLowerCase().includes('replaced, preserved in the record'));

  await page.getByRole('button', { name: /Why did this change/ }).click();
  const why = await page.locator('#whySection').innerText();
  expect(`${viewport.name}: exact canonical sources are shown`, why.includes('SRC-101') && why.includes('SRC-105') && why.includes('COR-02'));
  expect(`${viewport.name}: source assertions match the canonical fixture`, why.includes(fixture.sources.find(item => item.id === 'SRC-101').assertion) && why.includes(fixture.sources.find(item => item.id === 'SRC-105').assertion));
  expect(`${viewport.name}: unavailable delegation evidence remains unavailable`, why.includes('No held-out delegation decision exists yet'));

  await page.getByRole('button', { name: /Shape the next test/ }).click();
  expect(`${viewport.name}: proposed contrast is visible`, await page.locator('#testSection').isVisible());
  expect(`${viewport.name}: two plausible briefs and refusal are offered`, await page.locator('[data-choice]').count() === 3 && (await page.locator('#testSection').innerText()).includes('Neither is ready'));
  await page.locator('[data-choice="Brief A"]').click();
  expect(`${viewport.name}: contrast creates a provisional local receipt only`, await page.locator('#stageReceipt').isVisible() && (await page.locator('#stageReceipt').innerText()).includes('Nothing changes until it is tested against real work'));
  await page.screenshot({ path: resolve(evidenceDir, `g15-r1-${viewport.name}-evidence.png`), fullPage: true });

  await page.getByRole('button', { name: /Too broad or wrong/ }).click();
  expect(`${viewport.name}: correction is available without mutating current truth`, await page.locator('#correctionDialog').evaluate(dialog => dialog.open));
  await page.locator('[data-correction="Wrong cause"]').click();
  await page.locator('#correctionText').fill('Synthetic correction note');
  await page.getByRole('button', { name: 'Preview the correction' }).click();
  expect(`${viewport.name}: correction remains local and explicit`, await page.locator('#correctionStatus').isVisible() && (await page.locator('#correctionStatus').innerText()).includes('Nothing has been written'));
  await page.getByRole('button', { name: 'Close correction' }).click();

  for (const state of ['sparse', 'quiet', 'loading', 'stale', 'error', 'private']) {
    await page.goto(`${url}#${state}`, { waitUntil: 'networkidle' });
    expect(`${viewport.name}: ${state} state is honest`, await page.locator('[data-screen="state"]').isVisible() && (await page.locator('#stateTitle').innerText()).trim().length > 12);
  }

  await page.goto(`${url}#receipt`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  expect(`${viewport.name}: staged contrast does not persist across reload`, await page.locator('#stageReceipt').isHidden());
  let focusedControl = false;
  for (let step = 0; step < 7 && !focusedControl; step += 1) {
    await page.keyboard.press('Tab');
    focusedControl = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || !['BUTTON', 'TEXTAREA'].includes(active.tagName)) return false;
      const style = getComputedStyle(active);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    });
  }
  expect(`${viewport.name}: keyboard focus is visible`, focusedControl);

  if (viewport.name === 'mobile') {
    const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons.map(button => ({ name: button.textContent.trim() || button.getAttribute('aria-label'), rect: button.getBoundingClientRect() })).filter(({ rect }) => rect.width < 42 || rect.height < 42).map(({ name, rect }) => ({ name, width: Math.round(rect.width), height: Math.round(rect.height) })));
    expect(`mobile: visible controls meet 42px touch target${undersized.length ? ` ${JSON.stringify(undersized)}` : ''}`, undersized.length === 0);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  expect(`${viewport.name}: deep link survives reload`, page.url().endsWith('#receipt') && await page.locator('[data-screen="receipt"]').isVisible());
  expect(`${viewport.name}: reduced motion removes receipt animation`, await page.locator('.receipt-section').first().evaluate(node => parseFloat(getComputedStyle(node).animationDuration) <= 0.001));
  expect(`${viewport.name}: no console or page errors`, errors.length === 0);
  await context.close();
}
await browser.close();

if (failures) {
  console.error(`G15 R1 proof failed ${failures} check(s).`);
  process.exit(1);
}
console.log('G15 R1 Brain Resolution proof passed.');
