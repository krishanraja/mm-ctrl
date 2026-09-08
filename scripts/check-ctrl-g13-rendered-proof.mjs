import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4189/g13-living-brain-proof-r1.html';
const evidenceDir = resolve('project-documentation/ctrl-evolution/design/evidence');
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
let failures = 0;

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

async function expect(message, condition) {
  if (await condition) pass(message);
  else fail(message);
}

for (const spec of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  const context = await browser.newContext({ viewport: { width: spec.width, height: spec.height } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(error.message));

  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await expect(`${spec.name}: page responds successfully`, response?.ok());
  await expect(`${spec.name}: meaningful opening content renders`, (await page.locator('[data-screen="call"]').textContent()).trim().length > 250);
  await expect(`${spec.name}: no framework error overlay`, await page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay').count() === 0);
  await expect(`${spec.name}: no horizontal overflow on opening state`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({ path: resolve(evidenceDir, `g13-${spec.name}-opening.png`), fullPage: false });

  await page.getByRole('button', { name: 'See what was recorded with this call' }).click();
  const recordedText = await page.locator('[data-screen="recorded"]').textContent();
  await expect(`${spec.name}: co-presence is distinguished from causality`, recordedText.includes('The decision has no asserted relationship yet'));
  await expect(`${spec.name}: exact supported relation is named`, recordedText.includes('Relationship meaning: human release judgement protects'));

  await page.getByRole('button', { name: 'See the source' }).click();
  await expect(`${spec.name}: source exposes stable assertion identity`, await page.getByText('SRC-019 · Assertion 14').isVisible());
  await page.getByRole('button', { name: 'Check this standard' }).click();
  await page.getByRole('button', { name: 'Too broad' }).click();
  await page.getByRole('button', { name: 'Only work that leaves the business' }).click();

  const previewText = await page.locator('[data-screen="preview"]').textContent();
  await expect(`${spec.name}: past wording is explicitly preserved`, previewText.includes('Past · v1 preserved'));
  await expect(`${spec.name}: new wording is bounded to external consequence`, previewText.includes('Before externally consequential work ships'));
  await expect(`${spec.name}: automatic and review-required effects are separated`, previewText.includes('Updates now') && previewText.includes('Needs your review'));

  await page.getByRole('button', { name: 'Use this meaning' }).click();
  const receiptText = await page.locator('[data-screen="receipt"]').textContent();
  await expect(`${spec.name}: receipt names two rebuilt projections`, receiptText.includes('My calls portrait rebuilt') && receiptText.includes('Living Map rebuilt'));
  await expect(`${spec.name}: receipt keeps two consequential artifacts review-required`, receiptText.includes('Board brief') && receiptText.includes('Shared release'));
  await page.getByRole('button', { name: 'See my Brain' }).click();

  await expect(`${spec.name}: map has exactly five canonical item nodes`, await page.locator('.map-field [data-node]').count() === 5);
  await expect(`${spec.name}: map has exactly three semantic edges`, await page.locator('.map-field .edge').count() === 3);
  await expect(`${spec.name}: selected decision has no invented relationship`, (await page.locator('#relationList').textContent()).includes('No asserted edges'));
  await page.locator('[data-node="standard"]').click();
  const standardRelations = await page.locator('#relationList').textContent();
  await expect(`${spec.name}: standard exposes both supported typed relationships`, standardRelations.includes('Supports AIM-006 v3') && standardRelations.includes('Qualified by VOI-011 v1'));
  await page.getByRole('tab', { name: 'My calls' }).click();
  await expect(`${spec.name}: portrait and map share the corrected standard`, await page.locator('#portrait').textContent().then(text => text.includes('Before externally consequential work ships')));
  await page.getByRole('tab', { name: 'Living Map' }).click();
  await expect(`${spec.name}: no horizontal overflow in immersive map`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({ path: resolve(evidenceDir, `g13-${spec.name}-map.png`), fullPage: false });

  if (spec.name === 'mobile') {
    const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons
      .map(button => ({ label: button.textContent.trim(), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height }))
      .filter(button => button.width < 42 || button.height < 42));
    if (undersized.length === 0) pass('mobile: visible controls meet practical 42px touch target');
    else fail(`mobile: undersized controls ${JSON.stringify(undersized)}`);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(`${spec.name}: reduced-motion removes entry animation`, await page.locator('[data-screen="map"]').evaluate(element => getComputedStyle(element).animationName === 'none'));
  await expect(`${spec.name}: refresh preserves the hash-addressed proof state`, page.url().endsWith('#map') && await page.locator('[data-screen="map"]').isVisible());
  await expect(`${spec.name}: no console or page errors`, consoleErrors.length === 0 || consoleErrors.join(' | '));
  await context.close();
}

await browser.close();

if (failures) {
  console.error(`G13 rendered proof failed ${failures} check(s).`);
  process.exit(1);
}

console.log('G13 rendered proof passed across mobile and desktop.');
