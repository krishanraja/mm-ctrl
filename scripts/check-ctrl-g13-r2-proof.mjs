import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:4189/g13-living-brain-proof-r2.html';
const fixturePath = resolve('project-documentation/ctrl-evolution/design/g13-demo-brain-fixture.json');
const evidenceDir = resolve('project-documentation/ctrl-evolution/design/evidence');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
await mkdir(evidenceDir, { recursive: true });

let failures = 0;
const pass = message => console.log(`PASS ${message}`);
const fail = message => { failures += 1; console.error(`FAIL ${message}`); };
const expect = (message, condition) => condition ? pass(message) : fail(message);

expect('fixture: authorised synthetic identity is present', fixture.fixture_status === 'synthetic_demo' && fixture.account.email === 'hello@krishraja.com');
expect('fixture: rich representative Brain contains 20 items', fixture.items.length === 20);
expect('fixture: all item ids are unique', new Set(fixture.items.map(item => item.id)).size === fixture.items.length);
expect('fixture: every item has source evidence', fixture.items.every(item => item.source_refs.length > 0 && item.source_refs.every(id => fixture.sources.some(source => source.id === id))));
expect('fixture: every relationship resolves exact items and evidence', fixture.relationships.every(rel => fixture.items.some(item => item.id === rel.from) && fixture.items.some(item => item.id === rel.to) && rel.evidence_refs.length > 0 && rel.evidence_refs.every(id => fixture.sources.some(source => source.id === id))));
expect('fixture: share portrait contains only explicitly shareable items', fixture.share_portrait.item_refs.every(id => fixture.items.find(item => item.id === id)?.shareable === true));
expect('fixture: portrait lenses resolve canonical items', fixture.portrait.lenses.every(lens => lens.item_refs.every(id => fixture.items.some(item => item.id === id))));

const browser = await chromium.launch({headless:true});
for (const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1440,height:900}]) {
  const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(url, {waitUntil:'networkidle'});

  expect(`${viewport.name}: page responds successfully`, response?.ok());
  expect(`${viewport.name}: synthetic Brain fixture loaded`, await page.locator('#content').isVisible());
  expect(`${viewport.name}: opening leads with personal becoming`, (await page.locator('#portraitHeadline').textContent()).includes('builder of judgement'));
  expect(`${viewport.name}: opening is not a work queue`, !(await page.locator('[data-screen="overview"]').textContent()).includes('tasks'));
  expect(`${viewport.name}: derived counts match fixture`, await page.locator('#itemCount').textContent() === '20' && await page.locator('#relationCount').textContent() === '18' && await page.locator('#correctionCount').textContent() === '3');
  expect(`${viewport.name}: no error overlay`, await page.locator('[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay').count() === 0);
  expect(`${viewport.name}: no opening horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({path:resolve(evidenceDir,`g13-r2-${viewport.name}-overview.png`),fullPage:false});

  await page.getByRole('button',{name:'See the shift'}).click();
  const shift = await page.locator('[data-screen="shift"]').textContent();
  expect(`${viewport.name}: earlier, now and becoming movement is visible`, shift.includes('Earlier') && shift.includes('Now') && shift.includes('Becoming'));
  expect(`${viewport.name}: compounding edge, tension and frontier are visible`, shift.includes('Possibility detection') && shift.includes('Private fluency versus shared capability') && shift.includes('Make judgement teachable'));
  await page.getByRole('button',{name:'Enter my Brain'}).click();
  await page.waitForTimeout(550);
  expect(`${viewport.name}: all 20 canonical map nodes render`, await page.locator('.brain-node').count() === 20);
  expect(`${viewport.name}: all 18 typed relationships render`, await page.locator('.map-line').count() === 18);
  expect(`${viewport.name}: central synthesis is selected`, await page.locator('.brain-node[data-id="BI-001"]').evaluate(node => node.classList.contains('selected')));
  const truthText = await page.locator('.truth-grid').textContent();
  expect(`${viewport.name}: transparency panel exposes standing, evidence, version and audience`, ['Standing','Evidence','Version','Audience'].every(label => truthText.includes(label)));
  await page.getByRole('button',{name:'Open the evidence'}).click();
  expect(`${viewport.name}: source identity and assertion are visible`, (await page.locator('.source-sheet').textContent()).includes('SRC-001') && (await page.locator('#sourceAssertion').textContent()).length > 40);
  expect(`${viewport.name}: correction history remains visible`, (await page.locator('#versionHistory').textContent()).includes('Earlier') && (await page.locator('#versionHistory').textContent()).includes('Current'));
  await page.getByRole('button',{name:'See it in my Brain'}).click();
  await page.getByRole('button',{name:'Share a portrait'}).click();
  await page.waitForTimeout(550);
  expect(`${viewport.name}: share preview states excluded private count`, (await page.locator('#privacyCount').textContent()).includes('8 private meanings'));
  expect(`${viewport.name}: share controls contain only six allowlisted items`, await page.locator('.share-pick').count() === 6);
  expect(`${viewport.name}: share preview has no external send control`, await page.getByRole('button',{name:/send|publish|share now/i}).count() === 0);
  expect(`${viewport.name}: no share-screen horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await page.screenshot({path:resolve(evidenceDir,`g13-r2-${viewport.name}-share.png`),fullPage:false});
  await page.getByRole('button',{name:'Cancel'}).click();
  await page.waitForTimeout(550);
  await page.screenshot({path:resolve(evidenceDir,`g13-r2-${viewport.name}-map.png`),fullPage:false});

  if (viewport.name === 'mobile') {
    const visibleNodes = await page.locator('.brain-node:visible').count();
    const visibleLines = await page.locator('.map-line:visible').count();
    expect('mobile: orientation layer is bounded to 12 nodes', visibleNodes === 12);
    expect('mobile: no semantic line ends at a hidden node', visibleLines === fixture.relationships.filter(rel => fixture.items.slice(0,12).some(item => item.id === rel.from) && fixture.items.slice(0,12).some(item => item.id === rel.to)).length);
    const undersized = await page.locator('button:visible').evaluateAll(buttons => buttons.map(button => ({name:button.textContent.trim(),rect:button.getBoundingClientRect()})).filter(({rect}) => rect.width < 42 || rect.height < 42).map(({name,rect}) => ({name,width:rect.width,height:rect.height})));
    expect(`mobile: visible controls meet 42px touch target${undersized.length ? ' ' + JSON.stringify(undersized) : ''}`, undersized.length === 0);
  }

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload({waitUntil:'networkidle'});
  expect(`${viewport.name}: hash state survives refresh`, page.url().endsWith('#map') && await page.locator('[data-screen="map"]').isVisible());
  expect(`${viewport.name}: reduced motion disables animation`, await page.locator('[data-screen="map"]').evaluate(element => getComputedStyle(element).animationName === 'none'));
  expect(`${viewport.name}: no console or page errors`, errors.length === 0);
  await context.close();
}
await browser.close();

if (failures) {
  console.error(`G13 R2 proof failed ${failures} check(s).`);
  process.exit(1);
}
console.log('G13 R2 personal Living Brain proof passed.');
