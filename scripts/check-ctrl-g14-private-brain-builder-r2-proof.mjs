import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:4189/g14-private-brain-builder-proof-r2.html';
const fixturePath = resolve('project-documentation/ctrl-evolution/design/g14-private-brain-builder-fixture.json');
const evidenceDir = resolve('project-documentation/ctrl-evolution/design/evidence');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
await mkdir(evidenceDir, { recursive: true });

let failures = 0;
const pass = message => console.log(`PASS ${message}`);
const fail = message => { failures += 1; console.error(`FAIL ${message}`); };
const expect = (message, condition) => condition ? pass(message) : fail(message);

const itemIds = new Set(fixture.brain_items.map(item => item.id));
const sourceIds = new Set(fixture.sources.map(source => source.id));
const allowedRelationships = new Set(['supports', 'in_tension_with', 'exemplifies', 'informs', 'qualifies']);

expect('fixture: explicitly synthetic', fixture.fixture_status === 'synthetic_demo' && fixture.customer.fixture_disclosure.includes('synthetic'));
expect('fixture: canonical item ids are unique', itemIds.size === fixture.brain_items.length);
expect('fixture: canonical source ids are unique', sourceIds.size === fixture.sources.length);
expect('fixture: every Brain item resolves its evidence', fixture.brain_items.every(item => item.source_refs.length && item.source_refs.every(id => sourceIds.has(id))));
expect('fixture: every relationship is typed and fully resolves', fixture.relationships.every(rel => itemIds.has(rel.from) && itemIds.has(rel.to) && allowedRelationships.has(rel.type) && rel.evidence_refs.length && rel.evidence_refs.every(id => sourceIds.has(id))));
expect('fixture: intervention resolves evidence and Brain meaning', fixture.intervention.evidence_refs.every(id => sourceIds.has(id)) && fixture.intervention.item_refs.every(id => itemIds.has(id)));
expect('fixture: private ask cannot mutate durable memory', fixture.private_ask.demo_response.durable_effect === 'none_until_session_evidence_returns');
expect('fixture: customer preview excludes operator-private evidence', fixture.customer_preview.source_refs.every(id => fixture.sources.find(source => source.id === id)?.audience === 'customer_private'));

const browser = await chromium.launch({ headless: true });
for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'networkidle' });

  expect(`${viewport.name}: page responds successfully`, response?.ok());
  expect(`${viewport.name}: synthetic fixture loads`, await page.locator('#content').isVisible());
  expect(`${viewport.name}: first frame leads with one direct intervention`, (await page.locator('#interventionTitle').textContent()).includes('Find the quality signal Maya sees first'));
  expect(`${viewport.name}: intervention directive is actionable`, (await page.locator('#interventionDirective').textContent()).includes('two launch directions that fail in different ways'));
  expect(`${viewport.name}: one primary preparation action is visible`, await page.getByRole('button', { name: /Prepare the session/ }).first().isVisible());
  const visibleCopy = await page.locator('body').innerText();
  expect(`${viewport.name}: founder-cited copy failures are absent`, !visibleCopy.includes('Let her show you what she notices') && !visibleCopy.includes('One move has earned the session'));
  expect(`${viewport.name}: opening avoids self-awarding system language`, !/\b(earned|deserves|powerful|intelligent)\b/i.test(await page.locator('[data-screen="now"]').innerText()));
  expect(`${viewport.name}: living map is not the opening screen`, await page.locator('[data-screen="brain"]').isHidden());
  expect(`${viewport.name}: no opening horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(evidenceDir, `g14-r2-${viewport.name}-now.png`), fullPage: false });

  await page.getByRole('button', { name: 'Why this plan?' }).click();
  const change = await page.locator('[data-screen="change"]').textContent();
  expect(`${viewport.name}: change receipt preserves old and new meaning`, change.includes('Weaker now') && change.includes('Supported now') && change.includes('fundamentally distrusts delegation') && change.includes('quality problems she sees early'));
  expect(`${viewport.name}: change receipt exposes exact source quote`, change.includes("I don't need the team to imitate me"));
  expect(`${viewport.name}: change receipt keeps an unresolved question`, change.includes('Open question') && change.includes('The next contrast tests this'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(evidenceDir, `g14-r2-${viewport.name}-change.png`), fullPage: false });

  await page.getByRole('button', { name: /Use the current read/ }).click();
  const prepare = await page.locator('[data-screen="prepare"]').textContent();
  expect(`${viewport.name}: session card has exact opening`, prepare.includes(fixture.intervention.exact_opening));
  expect(`${viewport.name}: session card has four listening signals`, await page.locator('#listenList li').count() === 4);
  expect(`${viewport.name}: session card supports reshape, rotation and rejection`, ['Reshape', 'Rotate', 'Reject the read'].every(label => prepare.includes(label)));
  expect(`${viewport.name}: session fallback does not require live listening`, prepare.includes('one-tap choice plus voice note'));

  await page.getByRole('button', { name: 'Reshape' }).click();
  expect(`${viewport.name}: reshape dialog opens with current words`, await page.locator('#reshapeDialog').evaluate(dialog => dialog.open) && await page.locator('#reshapeText').inputValue() === fixture.intervention.exact_opening);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Rotate' }).last().click();
  expect(`${viewport.name}: rotation offers causally different alternatives`, await page.locator('#optionList [data-alt]').count() === 2);
  await page.getByRole('button', { name: 'Close alternatives' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(evidenceDir, `g14-r2-${viewport.name}-prepare.png`), fullPage: false });

  await page.getByRole('button', { name: 'Ask the Brain privately' }).click();
  expect(`${viewport.name}: private ask opens without a generic chat shell`, await page.locator('#askDialog').evaluate(dialog => dialog.open));
  await page.locator('[data-suggestion="0"]').click();
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  const ask = await page.locator('#askAnswer').textContent();
  expect(`${viewport.name}: private ask produces evidence-bounded guidance`, ask.includes('Keep the two issues separate') && ask.includes('no durable effect') && ask.includes('3 sources'));
  await page.getByRole('button', { name: 'Close private ask' }).click();

  await page.getByRole('button', { name: 'Back to the session plan' }).click();
  await page.locator(`${viewport.name === 'mobile' ? '.mobile-nav' : '.rail-nav'} [data-go="brain"]`).click();
  expect(`${viewport.name}: living Brain renders all ten meanings`, await page.locator('.map-node').count() === 10);
  expect(`${viewport.name}: living Brain renders five typed edges`, await page.locator('.map-line').count() === 5);
  expect(`${viewport.name}: changed synthesis owns the initial selection`, await page.locator('.map-node[data-id="BI-105"]').evaluate(node => node.classList.contains('selected')));
  const truth = await page.locator('.truth-grid').textContent();
  expect(`${viewport.name}: selected meaning exposes standing, evidence, version and audience`, ['Standing', 'Evidence', 'Version', 'Audience'].every(label => truth.includes(label)));
  expect(`${viewport.name}: selected meaning exposes semantic relationships`, await page.locator('#relationList li').count() === 3);
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(evidenceDir, `g14-r2-${viewport.name}-brain.png`), fullPage: false });

  await page.locator(`${viewport.name === 'mobile' ? '.mobile-nav' : '.rail-nav'} [data-go="customer"]`).click();
  const customer = await page.locator('[data-screen="customer"]').textContent();
  expect(`${viewport.name}: customer projection is framed as preview-only`, customer.includes('Preview only') && customer.includes('Left outside'));
  expect(`${viewport.name}: customer projection excludes the operator note`, customer.includes("Krish's private note"));
  expect(`${viewport.name}: customer projection has no send or publish control`, await page.getByRole('button', { name: /send|publish/i }).count() === 0);
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(evidenceDir, `g14-r2-${viewport.name}-customer.png`), fullPage: false });

  for (const state of ['sparse', 'quiet', 'loading', 'stale', 'error', 'rejected']) {
    await page.goto(`${url}#${state}`, { waitUntil: 'networkidle' });
    expect(`${viewport.name}: ${state} state is visible and honest`, await page.locator('[data-screen="state"]').isVisible() && (await page.locator('#stateTitle').textContent()).trim().length > 12);
  }

  await page.goto(`${url}#now`, { waitUntil: 'networkidle' });
  let focusedControl = false;
  for (let step = 0; step < 4 && !focusedControl; step += 1) {
    await page.keyboard.press('Tab');
    focusedControl = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || !['BUTTON', 'INPUT', 'TEXTAREA'].includes(active.tagName)) return false;
      const style = getComputedStyle(active);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    });
  }
  expect(`${viewport.name}: keyboard focus is visible on an interactive control`, focusedControl);

  if (viewport.name === 'mobile') {
    const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons.map(button => ({ name: button.textContent.trim() || button.getAttribute('aria-label'), rect: button.getBoundingClientRect() })).filter(({ rect }) => rect.width < 42 || rect.height < 42).map(({ name, rect }) => ({ name, width: Math.round(rect.width), height: Math.round(rect.height) })));
    expect(`mobile: visible controls meet 42px touch target${undersized.length ? ` ${JSON.stringify(undersized)}` : ''}`, undersized.length === 0);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  expect(`${viewport.name}: deep-link survives refresh`, page.url().endsWith('#now') && await page.locator('[data-screen="now"]').isVisible());
  expect(`${viewport.name}: reduced-motion mode removes evidence animation`, await page.locator('.evidence-pulse').evaluate(node => getComputedStyle(node).display === 'none'));
  expect(`${viewport.name}: no console or page errors`, errors.length === 0);
  await context.close();
}
await browser.close();

if (failures) {
  console.error(`G14 R2 proof failed ${failures} check(s).`);
  process.exit(1);
}
console.log('G14 R2 Private Brain Builder proof passed.');
