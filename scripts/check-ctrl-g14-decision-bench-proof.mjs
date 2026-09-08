import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:4189/g14-decision-bench-proof-r1.html';
const fixturePath = resolve('project-documentation/ctrl-evolution/design/g14-private-brain-builder-fixture.json');
const proofPath = resolve('project-documentation/ctrl-evolution/design/g14-decision-bench-proof-r1.html');
const evidenceDir = resolve('project-documentation/ctrl-evolution/design/evidence');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const proofSource = await readFile(proofPath, 'utf8');
await mkdir(evidenceDir, { recursive: true });

let failures = 0;
const pass = message => console.log(`PASS ${message}`);
const fail = message => { failures += 1; console.error(`FAIL ${message}`); };
const expect = (message, condition) => condition ? pass(message) : fail(message);

const itemIds = new Set(fixture.brain_items.map(item => item.id));
const sourceIds = new Set(fixture.sources.map(source => source.id));
const allowedRelationships = new Set(['supports', 'in_tension_with', 'exemplifies', 'informs', 'qualifies']);

expect('source: no em dash characters', !proofSource.includes('—'));
expect('source: founder-cited copy failures are absent', !proofSource.includes('Let her show you what she notices') && !proofSource.includes('One move has earned the session'));
expect('source: proof contains no self-awarding vocabulary', !/\b(earned|deserves|powerful|intelligent)\b/i.test(proofSource));
expect('fixture: explicitly synthetic', fixture.fixture_status === 'synthetic_demo' && fixture.customer.fixture_disclosure.includes('synthetic'));
expect('fixture: item and source ids are unique', itemIds.size === fixture.brain_items.length && sourceIds.size === fixture.sources.length);
expect('fixture: relationships use only the five allowed types', fixture.relationships.every(rel => itemIds.has(rel.from) && itemIds.has(rel.to) && allowedRelationships.has(rel.type)));
expect('fixture: customer projection is customer private', fixture.customer_preview.source_refs.every(id => fixture.sources.find(source => source.id === id)?.audience === 'customer_private'));
expect('fixture: private ask has no durable effect', fixture.private_ask.demo_response.durable_effect === 'none_until_session_evidence_returns');

const browser = await chromium.launch({ headless: true });
for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'networkidle' });

  expect(`${viewport.name}: page responds successfully`, response?.ok());
  expect(`${viewport.name}: fixture-backed customer loads`, (await page.locator('#customerName').textContent()) === fixture.customer.display_name);
  expect(`${viewport.name}: decision is the first readable object`, (await page.locator('.decision-line').textContent()).includes('quality standard usable by the team'));
  const firstReadVisible = await page.getByText('the team misses early quality signals.').isVisible() && await page.getByText('Open question: what is the first warning sign?').isVisible();
  const nextMoveVisible = await page.locator('.action-panel').getByText('Two launch directions that fail differently.').isVisible();
  expect(`${viewport.name}: current read and gap are visible immediately`, firstReadVisible);
  expect(`${viewport.name}: next move follows the intended responsive hierarchy`, viewport.name === 'desktop' ? nextMoveVisible : !nextMoveVisible);
  expect(`${viewport.name}: current and historical meaning are both present`, await page.getByText('Other people cannot yet see the quality loss Maya sees.').isVisible() && await page.getByText('Maya fundamentally distrusts delegation.').isVisible());
  expect(`${viewport.name}: history is explicitly non-operative`, (await page.locator('.cell-button.history[data-row="session"]').textContent()).includes('Cannot guide the session'));
  expect(`${viewport.name}: no horizontal page overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  if (viewport.name === 'desktop') {
    const metrics = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      panels: [...document.querySelectorAll('.bench-grid > .panel')].map(panel => {
        const rect = panel.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, visible: getComputedStyle(panel).display !== 'none' };
      }),
      titleSize: parseFloat(getComputedStyle(document.querySelector('.decision-line')).fontSize)
    }));
    expect('desktop: primary frame has no page scroll', metrics.scrollHeight <= metrics.clientHeight);
    expect('desktop: all three work regions are visible inside the viewport', metrics.panels.length === 3 && metrics.panels.every(panel => panel.visible && panel.left >= 0 && panel.right <= 1440 && panel.top >= 0 && panel.bottom <= 900));
    expect('desktop: heading behaves as an object label, not a proclamation', metrics.titleSize <= 28);
  } else {
    expect('mobile: one work region is shown at a time', await page.locator('[data-mobile-panel].mobile-active').count() === 1 && await page.locator('.mobile-nav').isVisible());
  }

  await page.screenshot({ path: resolve(evidenceDir, `g14-bench-r1-${viewport.name}-compare.png`), fullPage: false });

  await page.locator('.cell-button.history[data-row="meaning"]').click();
  expect(`${viewport.name}: inspecting history cannot make it current`, (await page.locator('#selectionLabel').textContent()).includes('cannot guide') && await page.locator('.cell-button.current[data-row="meaning"]').evaluate(node => node.classList.contains('current')));

  if (viewport.name === 'mobile') await page.locator('.mobile-nav [data-mobile-target="evidence"]').click();
  expect(`${viewport.name}: focused Living Brain route renders five fixture-backed items`, await page.locator('.brain-node').count() === 5);
  await page.locator('.brain-node[data-node="BI-110"]').click();
  expect(`${viewport.name}: Brain inspection exposes an allowed typed relationship`, (await page.locator('#relType').textContent()).toLowerCase().includes('qualifies'));

  await page.locator('.source-row[data-source="SRC-105"]').click();
  expect(`${viewport.name}: source inspection exposes the exact fixture assertion`, (await page.locator('#sourceDialogQuote').textContent()).includes(fixture.sources.find(source => source.id === 'SRC-105').assertion));
  await page.getByRole('button', { name: 'Close source' }).click();
  await page.screenshot({ path: resolve(evidenceDir, `g14-bench-r1-${viewport.name}-evidence.png`), fullPage: false });

  if (viewport.name === 'mobile') await page.locator('.mobile-nav [data-mobile-target="action"]').click();
  await page.locator('#prepareMove').click();
  expect(`${viewport.name}: preparation uses the exact opening`, (await page.locator('#openingQuote').textContent()) === fixture.intervention.exact_opening);
  expect(`${viewport.name}: preparation includes all four listening signals`, await page.locator('#listenList li').count() === 4);
  expect(`${viewport.name}: fallback survives without a live session`, (await page.locator('#fallbackText').textContent()).includes('one-tap choice plus voice note'));
  await page.getByRole('button', { name: 'Close preparation' }).click();

  await page.getByRole('button', { name: 'Ask privately' }).first().click();
  expect(`${viewport.name}: private exploration is visibly non-durable`, (await page.locator('#askDialog').textContent()).includes('does not change the Brain'));
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  expect(`${viewport.name}: private response remains evidence-bounded`, (await page.locator('#askAnswer').textContent()).includes('no durable effect') && (await page.locator('#askAnswer').textContent()).includes('3 sources'));
  await page.getByRole('button', { name: 'Close private question' }).click();

  await page.locator('[aria-label="Preview customer view"]:visible').click();
  const projection = await page.locator('#customerDialog').textContent();
  expect(`${viewport.name}: customer projection is preview-only and omits the private assertion`, projection.includes('Preview only') && projection.includes("Krish's private note") && !projection.includes('Abstract questions produced principles'));
  await page.getByRole('button', { name: 'Close customer projection' }).click();
  await page.screenshot({ path: resolve(evidenceDir, `g14-bench-r1-${viewport.name}-action.png`), fullPage: false });

  for (const state of ['sparse', 'quiet', 'loading', 'stale', 'error', 'rejected']) {
    await page.goto(`${url}?state=${state}`, { waitUntil: 'networkidle' });
    expect(`${viewport.name}: ${state} state is visible and honest`, await page.locator('#stateCover').isVisible() && (await page.locator('#stateTitle').textContent()).trim().length > 12);
  }

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  expect(`${viewport.name}: keyboard focus is visible`, await page.evaluate(() => {
    const active = document.activeElement;
    const style = getComputedStyle(active);
    return ['BUTTON','INPUT','TEXTAREA'].includes(active?.tagName) && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  }));

  if (viewport.name === 'mobile') {
    const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { name: button.textContent.trim() || button.getAttribute('aria-label'), width: Math.round(rect.width), height: Math.round(rect.height) };
    }).filter(item => item.width < 42 || item.height < 42));
    expect(`mobile: visible controls meet 42px target${undersized.length ? ` ${JSON.stringify(undersized)}` : ''}`, undersized.length === 0);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  const reducedMotionTask = viewport.name === 'desktop'
    ? await page.locator('.decision-line').isVisible() && await page.locator('#prepareMove').isVisible()
    : await page.locator('.decision-line').isVisible() && await page.locator('[data-mobile-panel="compare"]').isVisible();
  expect(`${viewport.name}: reduced motion keeps the complete task`, reducedMotionTask);
  expect(`${viewport.name}: no console or page errors`, errors.length === 0);
  await context.close();
}

const zoomContext = await browser.newContext({ viewport: { width: 720, height: 450 } });
const zoomPage = await zoomContext.newPage();
await zoomPage.goto(url, { waitUntil: 'networkidle' });
expect('200 percent equivalent: interface uses the linear mobile structure', await zoomPage.locator('.mobile-nav').isVisible() && await zoomPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await zoomContext.close();
await browser.close();

if (failures) {
  console.error(`G14 Decision Bench proof failed ${failures} check(s).`);
  process.exit(1);
}
console.log('G14 Decision Bench R1 proof passed.');
