import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:4189/g15-brain-resolution-proof-r2.html';
const fixturePath = resolve('project-documentation/ctrl-evolution/design/g15-judgement-resolution-fixture.json');
const evidenceDir = resolve('project-documentation/ctrl-evolution/design/evidence');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
await mkdir(evidenceDir, { recursive: true });

let failures = 0;
const pass = message => console.log(`PASS ${message}`);
const fail = message => { failures += 1; console.error(`FAIL ${message}`); };
const expect = (message, condition) => condition ? pass(message) : fail(message);
const delegation = fixture.territories.find(item => item.id === 'JT-03');

expect('fixture: explicitly synthetic', fixture.fixture_status === 'synthetic_demo');
expect('fixture: delegation remains revising and unscored', delegation.state === 'revising' && delegation.score_internal === null);
expect('fixture: no delegation result is available', delegation.holdout_refs.length === 0 && delegation.transfer_refs.length === 0);

const browser = await chromium.launch({ headless: true });
for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'networkidle' });

  expect(`${viewport.name}: page responds`, response?.ok());
  expect(`${viewport.name}: canonical fixture validates`, await page.locator('body').getAttribute('data-fixture') === 'validated');
  expect(`${viewport.name}: change is the opening screen`, await page.locator('[data-screen="now"]').isVisible());
  expect(`${viewport.name}: opening headline is plain`, (await page.locator('#openingCopy h1').innerText()).trim() === 'Your Brain changed its mind.');
  const opening = await page.locator('#openingCopy').innerText();
  const openingWords = opening.trim().split(/\s+/).length;
  expect(`${viewport.name}: opening stays within 45 words (${openingWords})`, openingWords <= 45);
  expect(`${viewport.name}: opening explains the correction simply`, opening.includes('thought you hated handing work over') && opening.includes('see what good looks like first'));
  expect(`${viewport.name}: opening limit uses plain words`, opening.toLowerCase().includes('still testing this on new work'));
  expect(`${viewport.name}: opening has no banned internal jargon`, !/evaluation|transferable|held-out|calibration|dimension|score|complete/i.test(opening));
  expect(`${viewport.name}: one primary action`, await page.locator('#openingCopy .primary:visible').count() === 1);
  expect(`${viewport.name}: causal illustration is visible`, await page.locator('.story-card').isVisible());
  const illustration = await page.locator('.story-card').innerText();
  expect(`${viewport.name}: illustration labels old idea, correction and current idea`, ['OLD IDEA', 'YOU CORRECTED THIS', 'CURRENT IDEA'].every(text => illustration.includes(text)));
  expect(`${viewport.name}: illustration makes the route change explicit`, illustration.includes('WORK COMES BACK') && illustration.includes('THE TEAM CARRIES IT'));
  expect(`${viewport.name}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({ path: resolve(evidenceDir, `g15-r2-${viewport.name}-opening.png`), fullPage: false });

  await page.getByRole('button', { name: /Show me why/ }).click();
  expect(`${viewport.name}: evidence screen replaces the opening`, await page.locator('[data-screen="why"]').isVisible() && await page.locator('[data-screen="now"]').isHidden());
  expect(`${viewport.name}: two visual evidence moments carry the meaning`, await page.locator('.evidence-picture').count() === 2);
  const why = await page.locator('[data-screen="why"]').innerText();
  expect(`${viewport.name}: evidence summaries stay plain`, why.includes('Too many options came back for you to rescue') && why.includes('The team spots the problem before you fix it'));
  expect(`${viewport.name}: missing proof stays visible`, why.includes('not tested this on a new delegation decision yet'));
  await page.getByRole('button', { name: 'Read her exact words' }).click();
  expect(`${viewport.name}: exact-source dialog opens`, await page.locator('#sourceDialog').evaluate(dialog => dialog.open));
  const sources = await page.locator('#sourceDialog').innerText();
  expect(`${viewport.name}: exact canonical source words are preserved`, sources.includes(fixture.sources.find(item => item.id === 'SRC-101').assertion) && sources.includes(fixture.sources.find(item => item.id === 'SRC-105').assertion));
  await page.getByRole('button', { name: 'Close exact sources' }).click();
  await page.screenshot({ path: resolve(evidenceDir, `g15-r2-${viewport.name}-why.png`), fullPage: false });

  await page.getByRole('button', { name: /Test the new idea/ }).click();
  expect(`${viewport.name}: next test is one screen`, await page.locator('[data-screen="test"]').isVisible());
  expect(`${viewport.name}: two illustrated routes and Neither are present`, await page.locator('.route').count() === 2 && await page.locator('[data-choice="Neither"]').count() === 1);
  await page.locator('[data-choice="Route B"]').click();
  expect(`${viewport.name}: choice produces an honest local receipt`, await page.locator('#choiceReceipt').isVisible() && (await page.locator('#choiceReceipt').innerText()).includes('Brain has not changed'));
  await page.screenshot({ path: resolve(evidenceDir, `g15-r2-${viewport.name}-test.png`), fullPage: false });

  await page.goto(`${url}#now`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'That is still wrong' }).click();
  expect(`${viewport.name}: correction route remains available`, await page.locator('#correctionDialog').evaluate(dialog => dialog.open));
  await page.locator('#correctionText').fill('Synthetic correction note');
  await page.getByRole('button', { name: 'Preview my correction' }).click();
  expect(`${viewport.name}: correction remains local`, await page.locator('#correctionStatus').isVisible() && (await page.locator('#correctionStatus').innerText()).includes('has not changed'));
  await page.getByRole('button', { name: 'Close correction' }).click();

  for (const state of ['sparse', 'quiet', 'loading', 'stale', 'error', 'private']) {
    await page.goto(`${url}#${state}`, { waitUntil: 'networkidle' });
    expect(`${viewport.name}: ${state} state is visible and plain`, await page.locator('[data-screen="state"]').isVisible() && (await page.locator('#stateTitle').innerText()).trim().length > 8);
  }

  await page.goto(`${url}#now`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  expect(`${viewport.name}: staged choices do not persist`, await page.locator('#choiceReceipt').isHidden());
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
  expect(`${viewport.name}: reduced motion stops route animation`, await page.locator('.route-old').evaluate(node => parseFloat(getComputedStyle(node).animationDuration) <= 0.001));
  expect(`${viewport.name}: no console or page errors${errors.length ? ` ${JSON.stringify(errors)}` : ''}`, errors.length === 0);
  await context.close();
}
await browser.close();

if (failures) {
  console.error(`G15 R2 proof failed ${failures} check(s).`);
  process.exit(1);
}
console.log('G15 R2 Brain Resolution proof passed.');
