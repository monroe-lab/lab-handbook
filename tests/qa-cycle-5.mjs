#!/usr/bin/env node
/**
 * QA Cycle 5 — Kayla Torres (undergrad) + thorough + "Waste container"
 *
 * Create a new waste container for ethanol-contaminated gloves. Thorough fill,
 * then verify: days-held starts at 0, the container shows up in the table,
 * stats update, it persists after reload, and it's visible on dashboard.
 * Every click/save/nav gets before+after screenshots.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const CYCLE = 5;
const DIR = `/tmp/qa-screenshots/cycle${CYCLE}`;
const TS = Date.now().toString(36);
const TEST_NAME = `QA5 Ethanol-Contaminated Gloves ${TS}`;
const TEST_SLUG = `qa5-ethanol-gloves-${TS}`;
const TEST_PATH = `docs/waste/${TEST_SLUG}.md`;

fs.mkdirSync(DIR, { recursive: true });

const log = [];
let stepN = 0;
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  const path = `${DIR}/${num}-${label}.png`;
  await page.screenshot({ path, fullPage: false });
  log.push({ step: stepN, label, path });
  console.log(`📸 ${num} ${label}`);
  return path;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await context.newPage();
page.setDefaultTimeout(20000);

page.on('pageerror', (e) => console.log('❌ pageerror:', e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('⚠ console.error:', msg.text().slice(0, 200));
});

try {
  // Step 1: Dashboard baseline
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, 'dashboard-baseline');

  // Step 2: Navigate to waste page
  await shot(page, 'before-nav-to-waste');
  await page.goto(`${BASE}/app/waste.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#wasteTable', { state: 'visible' });
  await page.waitForTimeout(1000);
  await shot(page, 'waste-page-baseline');

  // Capture baseline container count for later verification
  const baseline = await page.evaluate(() => ({
    total: document.getElementById('statTotal').textContent,
    ready: document.getElementById('statReady').textContent,
    overdue: document.getElementById('statOverdue').textContent,
    rowCount: document.querySelectorAll('#tableBody tr').length,
  }));
  console.log('baseline stats:', JSON.stringify(baseline));

  // Step 3: Click Add Container
  const addBtn = await page.$('#addBtn');
  const addBtnVisible = addBtn ? await addBtn.isVisible() : false;
  console.log('addBtn visible?', addBtnVisible);
  await shot(page, 'before-click-add');
  await page.click('#addBtn');
  await page.waitForSelector('#addModal.open', { timeout: 5000 });
  await page.waitForTimeout(400);
  await shot(page, 'add-modal-opened');

  // Step 4: Thorough fill — every field
  await page.fill('#addName', TEST_NAME);
  await page.fill('#addContents', 'Nitrile gloves contaminated with 100% ethanol absolute; also kimwipes and pipette tips from ethanol-based RNA precipitation step');
  await page.selectOption('#addState', 'Solid');
  await page.fill('#addLocation', 'Robbins Hall 0170 / Flammable Cabinet');
  await shot(page, 'add-modal-filled');

  // Step 5: Click Create
  await shot(page, 'before-click-create');
  const [, ] = await Promise.all([
    page.waitForFunction(() => !document.getElementById('addModal').classList.contains('open'), { timeout: 15000 }),
    page.click('button.btn-primary:has-text("Create")'),
  ]);
  await page.waitForTimeout(1500);
  await shot(page, 'after-create-editor-open');

  // Step 6: Editor modal should have opened — screenshot its state (fields + breadcrumb + title)
  const modal = await page.$('.editor-modal-overlay.open, #editor-modal-overlay.open, [class*="editor-modal"]');
  console.log('editor modal element found?', !!modal);
  await shot(page, 'editor-popup-freshly-created');

  // Step 7: Scroll the editor to capture full fields panel
  await page.evaluate(() => {
    const el = document.querySelector('.editor-modal-overlay, [data-role="editor-modal"]');
    if (el) el.scrollTop = 0;
  });
  await page.waitForTimeout(400);
  await shot(page, 'editor-popup-top');

  // Step 8: Try to close the editor modal with Escape
  await shot(page, 'before-escape-close');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await shot(page, 'after-escape-close');

  // Step 9: Verify the container appears in the table, check days held
  await page.waitForTimeout(1500);
  const rowData = await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    const r = rows.find(row => row.textContent.includes(name));
    if (!r) return null;
    const cells = r.querySelectorAll('td');
    return {
      name: cells[0]?.textContent.trim(),
      contents: cells[1]?.textContent.trim(),
      state: cells[2]?.textContent.trim(),
      location: cells[3]?.textContent.trim(),
      status: cells[4]?.textContent.trim(),
      days: cells[5]?.textContent.trim(),
      tag: cells[6]?.textContent.trim(),
    };
  }, TEST_NAME);
  console.log('row after create:', JSON.stringify(rowData));
  await shot(page, 'table-with-new-row');

  // Capture stats after create
  const afterCreate = await page.evaluate(() => ({
    total: document.getElementById('statTotal').textContent,
    ready: document.getElementById('statReady').textContent,
    overdue: document.getElementById('statOverdue').textContent,
    rowCount: document.querySelectorAll('#tableBody tr').length,
  }));
  console.log('after-create stats:', JSON.stringify(afterCreate));

  // Step 10: Filter by Solid
  await shot(page, 'before-filter-solid');
  await page.selectOption('#filterState', 'Solid');
  await page.waitForTimeout(500);
  await shot(page, 'after-filter-solid');

  // Step 11: Filter by status In Accumulation
  await page.selectOption('#filterStatus', 'in_accumulation');
  await page.waitForTimeout(500);
  await shot(page, 'after-filter-in-accumulation');

  // Step 12: Search
  await page.fill('#searchInput', 'ethanol-contaminated');
  await page.waitForTimeout(500);
  await shot(page, 'after-search-ethanol');

  // Step 13: Search specific to our test (slug-based)
  await page.fill('#searchInput', 'QA5 Ethanol');
  await page.waitForTimeout(500);
  await shot(page, 'after-search-qa5');

  // Step 14: Clear filters and click on the row to open editor
  await page.fill('#searchInput', '');
  await page.selectOption('#filterState', '');
  await page.selectOption('#filterStatus', '');
  await page.waitForTimeout(400);
  await shot(page, 'filters-cleared');

  // Step 15: Click the row to open the editor modal
  await shot(page, 'before-click-row');
  await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    const r = rows.find(row => row.textContent.includes(name));
    if (r) r.click();
  }, TEST_NAME);
  await page.waitForTimeout(1500);
  await shot(page, 'row-clicked-editor-open');

  // Step 16: Scroll down in editor for more fields
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, 'editor-scroll-top');

  // Step 17: Look for the wiki-style body rendering
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await shot(page, 'editor-closed-back-to-table');

  // Step 18: Reload to verify persistence (from GitHub / localStorage patch)
  await shot(page, 'before-reload');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#wasteTable', { state: 'visible' });
  await page.waitForTimeout(1200);
  await shot(page, 'after-reload-waste');

  const afterReload = await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    const r = rows.find(row => row.textContent.includes(name));
    const cells = r ? r.querySelectorAll('td') : [];
    return {
      found: !!r,
      days: cells[5]?.textContent.trim(),
      status: cells[4]?.textContent.trim(),
      total: document.getElementById('statTotal').textContent,
      rowCount: document.querySelectorAll('#tableBody tr').length,
    };
  }, TEST_NAME);
  console.log('after-reload:', JSON.stringify(afterReload));

  // Step 19: Open wiki page for the container
  await shot(page, 'before-nav-wiki');
  await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent(`waste/${TEST_SLUG}`)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await shot(page, 'wiki-view-container');

  // Step 20: Check lab-map — does a waste container appear as a child of Robbins Hall 0170?
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, 'lab-map-baseline');

  const filterInput = await page.$('#tree-filter, [placeholder*="filter" i], input[type="search"]');
  if (filterInput) {
    await filterInput.fill('QA5');
    await page.waitForTimeout(500);
    await shot(page, 'lab-map-filter-qa5');
  }

  // Step 21: Go back to dashboard — does the waste container show anywhere?
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, 'dashboard-after-create');

  // Step 22: Global search if present
  const searchBox = await page.$('input[placeholder*="search" i], input[placeholder*="Search" i]');
  if (searchBox) {
    await searchBox.fill('QA5');
    await page.waitForTimeout(800);
    await shot(page, 'dashboard-after-search');
  }

  // Save log file
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({
    test_name: TEST_NAME, test_slug: TEST_SLUG, test_path: TEST_PATH,
    baseline, rowData, afterCreate, afterReload, steps: log,
  }, null, 2));

} catch (e) {
  console.error('❌ Error during cycle:', e.message, e.stack);
  await shot(page, 'error-state');
  fs.writeFileSync(`${DIR}/_error.txt`, e.stack);
} finally {
  await browser.close();
  console.log(`\n✅ Cycle ${CYCLE} done. ${stepN} screenshots.`);
  console.log(`   Test file at: ${TEST_PATH}`);
  console.log(`   (Clean up via: gh api -X DELETE repos/monroe-lab/lab-handbook/contents/${TEST_PATH} -f "message=cleanup qa5" -f "sha=...")`);
}
