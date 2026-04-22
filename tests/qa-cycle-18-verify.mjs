#!/usr/bin/env node
/**
 * QA Cycle 18 Verify — verifies three fixes live on deployed site:
 *   1. PEOPLE-CARD-PILLS-BARE-SLUG: connected pill on a person card uses
 *      the full path (e.g. `?doc=wet-lab/autoclave`), not bare slug.
 *   2. PERSON-DASHBOARD-IGNORES-FORWARD-LINKS: onboarded person's dashboard
 *      lists Protocols/Projects sections from their own wikilinks.
 *   3. Notebook count reads 1 (not 0) right after onboarding.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const REPO = 'monroe-lab/lab-handbook';
const DIR = `/tmp/qa-screenshots/cycle18-verify`;
fs.mkdirSync(DIR, { recursive: true });

const RUN = Date.now().toString(36).slice(-6);
const NAME = `QA18v Verify ${RUN}`;
const SLUG = 'qa18v-verify-' + RUN;

let stepN = 0;
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  const p = `${DIR}/${num}-${label}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${num} ${label}`);
  return p;
}

function ghDelete(path, msg) {
  try {
    const sha = execSync(`gh api "repos/${REPO}/contents/${path}" --jq '.sha'`, { stdio: 'pipe' }).toString().trim();
    execSync(`gh api -X DELETE "repos/${REPO}/contents/${path}" -f message="${msg}" -f sha="${sha}"`, { stdio: 'pipe' });
    console.log(`🗑️  deleted ${path}`);
    return true;
  } catch { return false; }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await context.newPage();
page.setDefaultTimeout(25000);

const results = {};

try {
  // ======== FIX 1 verification: pre-existing person card pill href ========
  await page.goto(`${BASE}/app/people.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    document.querySelectorAll('#peopleGrid .person-card').length > 0, { timeout: 25000 }
  );
  await page.waitForTimeout(1500);
  await shot(page, 'people-grid-baseline');

  // Find a known connected pill 'autoclave' or 'bench-cleanup' on any card.
  // Inspect its href to confirm it's now the full path, not bare slug.
  const pillCheck = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('#peopleGrid .person-pill-list a')];
    const results = [];
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      if (/autoclave/i.test(text) || /bench-cleanup/i.test(text) || /clean-bench/i.test(text)) {
        results.push({ text, href });
      }
      if (results.length >= 6) break;
    }
    return results;
  });
  console.log('   pill hrefs:', pillCheck);
  results.fix1 = {
    observed: pillCheck,
    allHaveFolder: pillCheck.length > 0 && pillCheck.every(p => p.href.includes('?doc=wet-lab/') || p.href.includes('?doc=lab-safety/')),
  };

  // Click one of the pills to confirm it actually loads
  if (pillCheck.length > 0) {
    await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('#peopleGrid .person-pill-list a')];
      for (const a of anchors) {
        if (/autoclave/i.test(a.textContent)) { a.click(); return; }
      }
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);
    await shot(page, 'autoclave-loaded-from-pill');

    const pageState = await page.evaluate(() => ({
      title: document.querySelector('#renderedDoc h1')?.textContent ||
             document.querySelector('.proto-content h1, .proto-content h2')?.textContent || null,
      hasError: document.body.innerText.includes('Document not found'),
      url: location.href,
    }));
    console.log('   autoclave page:', pageState);
    results.fix1.afterClick = pageState;
  }

  // ======== FIX 2+3 verification: create a fresh onboarding, inspect dashboard ========
  await page.goto(`${BASE}/app/people.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#joinLabBtn', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.click('#joinLabBtn');
  await page.waitForSelector('#wizName', { timeout: 10000 });
  await page.waitForTimeout(500);

  await page.fill('#wizName', NAME);
  await page.selectOption('#wizRole', 'Postdoctoral Scholar');
  await page.fill('#wizEmail', 'verify@example.com');
  await shot(page, 'wizard-step1-filled');

  // Next -> step 2, pick first 2 visible protocols
  await page.click('button:has-text("Next")');
  await page.waitForSelector('[data-wiz-proto]', { timeout: 10000 });
  await page.waitForTimeout(500);
  const pickedProtos = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-wiz-proto]')];
    const chosen = [];
    for (let i = 0; i < Math.min(2, boxes.length); i++) {
      boxes[i].checked = true;
      boxes[i].dispatchEvent(new Event('change', { bubbles: true }));
      chosen.push(boxes[i].value);
    }
    return chosen;
  });
  console.log('   verify picked protos:', pickedProtos);
  await shot(page, 'wizard-step2-picked');

  await page.click('button:has-text("Next")');
  await page.waitForSelector('[data-wiz-proj]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  const pickedProjs = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-wiz-proj]')];
    const chosen = [];
    for (let i = 0; i < Math.min(1, boxes.length); i++) {
      boxes[i].checked = true;
      boxes[i].dispatchEvent(new Event('change', { bubbles: true }));
      chosen.push(boxes[i].value);
    }
    return chosen;
  });
  console.log('   verify picked projs:', pickedProjs);
  await shot(page, 'wizard-step3-picked');

  // Next -> creation
  await page.click('button:has-text("Next")');
  await page.waitForFunction(() => {
    const cl = document.getElementById('wizChecklist');
    const se = document.getElementById('wizCreateStatus');
    return (cl && cl.style.display !== 'none') || (se && /error/i.test(se.textContent));
  }, { timeout: 30000 });
  await page.waitForTimeout(1000);
  await shot(page, 'wizard-step4-done');

  // Close wizard
  await page.evaluate(() => {
    const ov = document.getElementById('wizardOverlay');
    if (ov) ov.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Override the slug tracking: since we had Lab.slugify generate the slug,
  // compute it here for URL routing + cleanup:
  const trueSlug = await page.evaluate((name) => Lab.slugify(name), NAME);
  console.log('   true slug:', trueSlug);

  // Navigate to the person's dashboard
  await page.goto(`${BASE}/app/people.html?person=${trueSlug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const d = document.getElementById('personDashboard');
    return d && d.style.display !== 'none' && d.innerHTML.length > 200;
  }, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, 'person-dashboard-with-forward-links');

  // Read the stat counts
  const dashStats = await page.evaluate(() => {
    const dash = document.getElementById('personDashboard');
    const statNums = [...dash.querySelectorAll('div[style*="font-size:20px"]')].map(d => d.textContent.trim());
    const sections = [...dash.querySelectorAll('h3')].map(h => h.textContent.replace(/\s+/g, ' ').trim());
    return {
      statNums,
      sections,
      fullDashboardLen: dash.innerText.length,
    };
  });
  console.log('   dashboard stats:', dashStats);
  results.fix2 = {
    statNums: dashStats.statNums,
    sections: dashStats.sections,
  };
  // statNums order from code: Notebooks, Protocols, Events, Inventory, Locations, Projects
  if (dashStats.statNums.length >= 6) {
    results.fix2.notebookCount = parseInt(dashStats.statNums[0], 10);
    results.fix2.protocolCount = parseInt(dashStats.statNums[1], 10);
    results.fix2.projectCount = parseInt(dashStats.statNums[5], 10);
  }

  // Expand each section that exists to verify rows render
  await page.evaluate(() => {
    document.querySelectorAll('#personDashboard details').forEach(d => { d.open = true; });
  });
  await page.waitForTimeout(500);
  await shot(page, 'person-dashboard-sections-expanded');

  // Cleanup
  const today = new Date().toISOString().slice(0, 10);
  ghDelete(`docs/people/${trueSlug}.md`, `cycle-18 verify cleanup`);
  ghDelete(`docs/notebooks/${trueSlug}/${today}.md`, `cycle-18 verify cleanup`);
  ghDelete(`docs/notebooks/${trueSlug}/.gitkeep`, `cycle-18 verify cleanup`);

} catch (e) {
  console.error('❌ verify error:', e);
  try { await page.screenshot({ path: `${DIR}/99-error.png` }); } catch {}
  throw e;
} finally {
  fs.writeFileSync(`${DIR}/_results.json`, JSON.stringify(results, null, 2));
  console.log('\n📋 results:\n', JSON.stringify(results, null, 2));
  await browser.close();
}
