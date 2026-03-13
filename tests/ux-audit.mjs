/**
 * Puppeteer UX Audit — Mobile-first
 * Tests all pages for no-scroll compliance, page loads, favicon, and interactions.
 */

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const EMAIL = 'krish@themindmaker.ai';
const PASSWORD = 'admin';

const MOBILE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false };

const results = [];

function pass(t) { results.push({ t, s: 'PASS' }); console.log(`  \u2705 ${t}`); }
function fail(t, r) { results.push({ t, s: 'FAIL', r }); console.log(`  \u274C ${t}: ${r}`); }

async function checkNoScroll(page, name) {
  const info = await page.evaluate(() => ({
    bSH: document.body.scrollHeight,
    bCH: document.body.clientHeight,
    bOF: getComputedStyle(document.body).overflow,
    hOF: getComputedStyle(document.documentElement).overflow,
  }));
  const scrolls = info.bSH > info.bCH + 5 && info.bOF !== 'hidden' && info.hOF !== 'hidden';
  scrolls ? fail(`${name}: No scroll`, `scrollH=${info.bSH} clientH=${info.bCH} bodyOF=${info.bOF} htmlOF=${info.hOF}`) : pass(`${name}: No scroll`);
}

async function waitForApp(page) {
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 3000));
}

async function screenshot(page, name) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: false });
}

async function login(page) {
  console.log('\n  --- Login Flow ---');
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle2', timeout: 15000 });
  await waitForApp(page);
  await screenshot(page, 'auth-page');

  // Check auth page no-scroll
  await checkNoScroll(page, 'Auth');

  // Find email input by id
  const emailInput = await page.$('#email');
  if (!emailInput) {
    fail('Login: Email input', 'Not found');
    return false;
  }
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(EMAIL, { delay: 30 });

  const pwInput = await page.$('#password');
  if (!pwInput) {
    fail('Login: Password input', 'Not found');
    return false;
  }
  await pwInput.click({ clickCount: 3 });
  await pwInput.type(PASSWORD, { delay: 30 });

  await screenshot(page, 'auth-filled');

  // Submit
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
  } else {
    await pwInput.press('Enter');
  }

  // Wait for navigation
  try {
    await page.waitForFunction(
      () => window.location.pathname.includes('/dashboard'),
      { timeout: 12000 }
    );
    pass('Login: Navigated to dashboard');
    await new Promise(r => setTimeout(r, 2000)); // let dashboard load
    return true;
  } catch {
    const url = page.url();
    // Check if there's an error message on page
    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.text-destructive');
      return el ? el.textContent : null;
    });
    if (errorText) {
      fail('Login: Auth error', errorText);
    } else {
      fail('Login: Navigation', `Stuck at ${url}`);
    }
    await screenshot(page, 'auth-failed');
    return false;
  }
}

async function testPage(page, path, name) {
  console.log(`  Testing ${name}...`);
  try {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    pass(`${name}: Loads`);
    await checkNoScroll(page, name);
    await screenshot(page, name.toLowerCase().replace(/[\s()]+/g, '-'));
  } catch (e) {
    fail(`${name}: Load`, e.message);
  }
}

// === Main ===
(async () => {
  console.log('\n========================================');
  console.log('  Mindmaker UX Audit — Mobile First');
  console.log('========================================');

  try { mkdirSync('tests/screenshots', { recursive: true }); } catch {}

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE_URL, ['microphone']);

  // =====================
  // MOBILE TESTS
  // =====================
  console.log('\n--- MOBILE (390x844) ---');
  await page.setViewport(MOBILE);

  // Landing
  console.log('\n  --- Landing ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  await waitForApp(page);
  pass('Landing: Loads');
  await checkNoScroll(page, 'Landing');
  await screenshot(page, 'landing-mobile');

  // Favicon check
  const faviconHref = await page.evaluate(() => {
    const link = document.querySelector('link[rel="icon"][sizes="32x32"]');
    return link ? link.getAttribute('href') : null;
  });
  if (faviconHref && faviconHref.includes('favicon-32x32')) {
    pass('Favicon: Points to sized file');
  } else {
    fail('Favicon: Sized reference', `href=${faviconHref}`);
  }

  // Login
  const loggedIn = await login(page);

  if (loggedIn) {
    // Dashboard
    console.log('\n  --- Dashboard ---');
    await testPage(page, '/dashboard', 'Dashboard');

    // Detect if onboarding (GuidedFirstExperience) is showing
    const isOnboarding = await page.evaluate(() => {
      // Look for onboarding indicators: "Let's Go" button, welcome text, or gradient mic button
      const allText = document.body.innerText;
      return allText.includes("Let's Go") || allText.includes('Welcome') || allText.includes('Your AI-Powered');
    });

    if (isOnboarding) {
      pass('Dashboard: Onboarding flow detected (first-time user)');
      await screenshot(page, 'dashboard-onboarding');
      // Onboarding has its own no-scroll layout — verified by testPage above
      // Mic button and bottom nav only appear after onboarding is complete
    } else {
      // Check mic button on main dashboard
      const micBtn = await page.evaluate(() => {
        const svgs = document.querySelectorAll('svg');
        for (const svg of svgs) {
          if (svg.classList.contains('lucide-mic') || svg.querySelector('.lucide-mic')) {
            const btn = svg.closest('button');
            if (btn) {
              const rect = btn.getBoundingClientRect();
              return { found: true, visible: rect.width > 0 && rect.height > 0, y: rect.y };
            }
          }
        }
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const svg = btn.querySelector('svg');
          if (svg && btn.closest('.shadow-accent\\/20')) {
            const rect = btn.getBoundingClientRect();
            return { found: true, visible: rect.width > 0, y: rect.y };
          }
        }
        return { found: false };
      });
      if (micBtn.found && micBtn.visible) {
        pass('Dashboard: Mic button visible');
      } else if (micBtn.found) {
        fail('Dashboard: Mic button', 'Found but not visible');
      } else {
        fail('Dashboard: Mic button', 'Not found');
      }

      // Bottom nav
      const navCount = await page.evaluate(() => document.querySelectorAll('nav button').length);
      navCount >= 4 ? pass(`Bottom nav: ${navCount} buttons`) : fail('Bottom nav', `Only ${navCount} buttons`);

      // Check swipeable dots on dashboard
      const hasDots = await page.evaluate(() => {
        const dots = document.querySelectorAll('[class*="rounded-full"][class*="bg-accent"], [class*="rounded-full"][class*="bg-muted-foreground"]');
        return dots.length;
      });
      if (hasDots > 0) {
        pass(`Dashboard: Swipe dots found (${hasDots})`);
      }
    }

    // Other pages
    console.log('\n  --- Think ---');
    await testPage(page, '/think', 'Think');

    console.log('\n  --- Memory ---');
    await testPage(page, '/memory', 'Memory');

    console.log('\n  --- Export ---');
    await testPage(page, '/context', 'Export');

    console.log('\n  --- Profile ---');
    await testPage(page, '/profile', 'Profile');

    console.log('\n  --- Settings ---');
    await testPage(page, '/settings', 'Settings');
  }

  // =====================
  // DESKTOP TESTS
  // =====================
  console.log('\n--- DESKTOP (1440x900) ---');
  await page.setViewport(DESKTOP);

  console.log('\n  --- Landing (Desktop) ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  await waitForApp(page);
  await screenshot(page, 'landing-desktop');
  pass('Landing Desktop: Loads');

  if (loggedIn) {
    console.log('\n  --- Dashboard (Desktop) ---');
    await testPage(page, '/dashboard', 'Dashboard-Desktop');
  }

  await browser.close();

  // =====================
  // RESULTS
  // =====================
  console.log('\n========================================');
  console.log('  Results');
  console.log('========================================\n');

  const passed = results.filter(r => r.s === 'PASS').length;
  const failed = results.filter(r => r.s === 'FAIL').length;
  console.log(`  Total: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('  FAILURES:');
    results.filter(r => r.s === 'FAIL').forEach(r => console.log(`    - ${r.t}: ${r.r}`));
  }

  console.log('\n  Screenshots saved to tests/screenshots/\n');
  process.exit(failed > 0 ? 1 : 0);
})();
