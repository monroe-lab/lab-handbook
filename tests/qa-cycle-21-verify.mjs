// QA cycle 21 verify — confirm the 3 fixes landed on the live site:
//  1. Add Accession modal has exactly one "Species" label
//  2. Clicking ★ priority header defaults to DESCENDING
//  3. At 1024x800 viewport, every visible nav tab is fully inside tabWrap
//     (no clipping by overflow:hidden on the trailing tab)

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle21-verify';
const GH_TOKEN = execSync('gh auth token').toString().trim();

function log(...a) { console.log('[verify21]', ...a); }

async function shot(page, name) {
  const path = `${SHOT_DIR}/${name}.png`;
  try { await page.screenshot({ path, fullPage: false }); } catch {}
  return path;
}

async function waitNet(page, ms = 400) {
  try { await page.waitForLoadState('networkidle', { timeout: 2500 }); } catch {}
  await page.waitForTimeout(ms);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const verify = {};

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // ── Fix 1: Add Accession modal should have only 1 "Species" field ───────
  await page.goto(`${BASE}/app/accessions.html`);
  await waitNet(page, 1500);
  await page.waitForSelector('#addBtn', { state: 'visible' });
  await page.click('#addBtn');
  await page.waitForTimeout(500);
  await shot(page, '01-add-modal');
  const speciesLabels = await page.evaluate(() => {
    const modal = document.getElementById('addModal');
    return Array.from(modal.querySelectorAll('label'))
      .map(l => l.textContent.trim())
      .filter(t => /species/i.test(t));
  });
  verify.fix1_species_labels = speciesLabels;
  verify.fix1_pass = speciesLabels.length === 1;
  log('Fix 1 species labels:', speciesLabels, 'PASS:', verify.fix1_pass);
  await page.click('.modal-close');
  await page.waitForTimeout(300);

  // ── Fix 2: Clicking ★ header should sort priority DESCENDING ─────────────
  await shot(page, '02-before-sort');
  await page.locator('th').filter({ hasText: /^★$/ }).first().click();
  await page.waitForTimeout(400);
  await shot(page, '02-after-sort');
  const sortInfo = await page.evaluate(() => ({
    sortCol: window.sortCol,
    sortDir: window.sortDir,
    top5: Array.from(document.querySelectorAll('#tableBody tr'))
      .slice(0, 5)
      .map(r => r.querySelector('.pri-stars')?.getAttribute('data-pri')),
  }));
  verify.fix2_sort = sortInfo;
  verify.fix2_pass = sortInfo.sortCol === 'priority' && sortInfo.sortDir === -1;
  log('Fix 2 sort:', sortInfo, 'PASS:', verify.fix2_pass);

  // ── Fix 3: nav at 1024px — last visible tab should not overflow tabWrap ─
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 1500);
  await shot(page, '03-nav-1024');
  const overflowCheck = await page.evaluate(() => {
    const tabWrap = document.getElementById('nav-tabs');
    if (!tabWrap) return { err: 'no nav-tabs' };
    const containerRight = tabWrap.getBoundingClientRect().right;
    const tabs = Array.from(tabWrap.querySelectorAll('.lab-nav-tab'))
      .filter(t => !t.classList.contains('nav-hidden-tab'));
    const overflowing = tabs.filter(t => t.getBoundingClientRect().right > containerRight + 1);
    return {
      visible_labels: tabs.map(t => t.dataset.label),
      overflowing_labels: overflowing.map(t => t.dataset.label),
      containerRight,
      lastRight: tabs.length ? tabs[tabs.length - 1].getBoundingClientRect().right : null,
    };
  });
  verify.fix3_overflow = overflowCheck;
  verify.fix3_pass = overflowCheck.overflowing_labels?.length === 0;
  log('Fix 3 overflow:', overflowCheck, 'PASS:', verify.fix3_pass);

  // Open the More popover and confirm the hidden tabs are available
  const moreClicked = await page.evaluate(() => {
    const btn = document.getElementById('nav-desktop-more');
    if (!btn || btn.style.display === 'none') return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(400);
  await shot(page, '04-nav-more-open');
  const popoverItems = await page.evaluate(() => {
    const pop = document.getElementById('nav-desktop-more-popover');
    if (!pop) return null;
    return Array.from(pop.querySelectorAll('a')).map(a => a.textContent.trim());
  });
  verify.fix3_popover_items = popoverItems;
  verify.fix3_pass_popover = !!popoverItems && popoverItems.length > 0;
  log('Fix 3 popover:', popoverItems, 'moreClicked:', moreClicked);

  fs.writeFileSync(`${SHOT_DIR}/_verify.json`, JSON.stringify(verify, null, 2));
  const allPass = verify.fix1_pass && verify.fix2_pass && verify.fix3_pass && verify.fix3_pass_popover;
  log('Overall:', allPass ? 'PASS' : 'FAIL');
  log(verify);
  await browser.close();
  process.exit(allPass ? 0 : 2);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
