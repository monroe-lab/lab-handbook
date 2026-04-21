#!/usr/bin/env node
/**
 * QA Cycle 5 Verify — confirm INDEX_KEYS fix
 *
 * Create another waste container thoroughly, then verify that the row in
 * the waste table immediately shows Contents, State, Days Held, and that
 * filters by Solid state + searches by "ethanol-contaminated" keep the
 * row visible.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const DIR = '/tmp/qa-screenshots/cycle5-verify';
const TS = Date.now().toString(36);
const TEST_NAME = `QA5V Ethanol-Contaminated Gloves ${TS}`;
const TEST_SLUG = `qa5v-ethanol-gloves-${TS}`;
const TEST_PATH = `docs/waste/${TEST_SLUG}.md`;

fs.mkdirSync(DIR, { recursive: true });

let stepN = 0;
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  await page.screenshot({ path: `${DIR}/${num}-${label}.png`, fullPage: false });
  console.log(`📸 ${num} ${label}`);
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

try {
  await page.goto(`${BASE}/app/waste.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#wasteTable', { state: 'visible' });
  await page.waitForTimeout(1000);
  await shot(page, 'waste-baseline');

  await page.click('#addBtn');
  await page.waitForSelector('#addModal.open');
  await page.fill('#addName', TEST_NAME);
  await page.fill('#addContents', 'Nitrile gloves contaminated with 100% ethanol absolute; kimwipes from RNA precipitation step');
  await page.selectOption('#addState', 'Solid');
  await page.fill('#addLocation', 'Robbins Hall 0170 / Flammable Cabinet');
  await shot(page, 'modal-filled');

  await page.click('button.btn-primary:has-text("Create")');
  await page.waitForFunction(() => !document.getElementById('addModal').classList.contains('open'));
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Capture row data
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
    };
  }, TEST_NAME);
  console.log('row after create (post-fix):', JSON.stringify(rowData));
  await shot(page, 'row-post-fix');

  // Filter by Solid — should KEEP the row
  await page.selectOption('#filterState', 'Solid');
  await page.waitForTimeout(500);
  const solidHit = await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    return rows.some(r => r.textContent.includes(name));
  }, TEST_NAME);
  console.log('Visible with Solid filter? →', solidHit);
  await shot(page, 'filter-solid-includes-qa5');

  // Search "ethanol-contaminated"
  await page.fill('#searchInput', 'ethanol-contaminated');
  await page.waitForTimeout(500);
  const searchHit = await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    return rows.some(r => r.textContent.includes(name));
  }, TEST_NAME);
  console.log('Visible with contents-search? →', searchHit);
  await shot(page, 'search-contents-includes-qa5');

  // After reload — data should persist via the localStorage overlay
  await page.fill('#searchInput', '');
  await page.selectOption('#filterState', '');
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#wasteTable', { state: 'visible' });
  await page.waitForTimeout(1200);
  const reloaded = await page.evaluate((name) => {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    const r = rows.find(row => row.textContent.includes(name));
    if (!r) return null;
    const cells = r.querySelectorAll('td');
    return {
      contents: cells[1]?.textContent.trim(),
      state: cells[2]?.textContent.trim(),
      days: cells[5]?.textContent.trim(),
    };
  }, TEST_NAME);
  console.log('After reload (overlay kept):', JSON.stringify(reloaded));
  await shot(page, 'reload-overlay-kept');

  fs.writeFileSync(`${DIR}/_result.json`, JSON.stringify({
    rowData, solidHit, searchHit, reloaded, testPath: TEST_PATH,
  }, null, 2));

  const pass =
    rowData && rowData.contents.includes('Nitrile gloves') &&
    rowData.state === 'Solid' &&
    rowData.days === '0 d' &&
    solidHit && searchHit &&
    reloaded && reloaded.contents.includes('Nitrile gloves') && reloaded.state === 'Solid';
  console.log(pass ? '✅ FIX VERIFIED' : '❌ FIX INCOMPLETE');

} finally {
  await browser.close();
  console.log('cleanup: gh api -X DELETE repos/monroe-lab/lab-handbook/contents/' + TEST_PATH);
}
