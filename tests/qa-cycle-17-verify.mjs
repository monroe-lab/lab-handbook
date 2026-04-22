#!/usr/bin/env node
/**
 * QA Cycle 17 verification — tests the two fixes to sample-tracker.
 * Uses a local HTTP server so relative fetches work, and stubs data
 * via window-level sample injection.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import http from 'http';
import path from 'path';

const DOCS_DIR = '/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab/docs/sample-tracker';

const samplesStub = [
  { id: 1, sampleId: 'TEST-A1', project: 'verify', species: 'Test', lead: 'QA', sequencingType: 'HiFi', status: 'Sequencing in progress', priority: '', currentBlocker: '', lastUpdated: '2026-04-22', notes: 'verify 1', detailSheetLink: '' },
  { id: 2, sampleId: 'TEST-A2', project: 'verify', species: 'Test', lead: 'QA', sequencingType: 'HiFi', status: 'Complete', priority: '', currentBlocker: '', lastUpdated: '2026-04-22', notes: 'verify 2', detailSheetLink: '' },
  { id: 3, sampleId: 'OTHER-B1', project: 'other', species: 'Test', lead: 'QA', sequencingType: 'HiFi', status: 'Shearing', priority: '', currentBlocker: '', lastUpdated: '2026-04-22', notes: 'verify 3', detailSheetLink: '' },
];

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/' || u === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(DOCS_DIR, 'index.html')));
    return;
  }
  if (u === '/samples.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(samplesStub));
    return;
  }
  res.writeHead(404);
  res.end();
});

await new Promise((ok) => server.listen(0, () => ok()));
const port = server.address().port;
const URL = `http://localhost:${port}/index.html`;

const DIR = '/tmp/qa-screenshots/cycle17-verify';
fs.mkdirSync(DIR, { recursive: true });

let stepN = 0;
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  const p = `${DIR}/${num}-${label}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${num} ${label}`);
  return p;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10000);

// Abort the GitHub API call so it falls back to local samples.json
await page.route('https://api.github.com/**', route => route.abort());

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#sampleTable:not([style*="display: none"])', { timeout: 10000 });
  await page.waitForTimeout(600);
  await shot(page, 'baseline');

  // --- Test 1: "Sequencing in progress" pill not clipped ---
  const seqPill = await page.evaluate(() => {
    const s = document.querySelector('tr[data-id="1"] select.status-select');
    if (!s) return null;
    return {
      value: s.value,
      clientWidth: s.clientWidth,
      scrollWidth: s.scrollWidth,
      clipped: s.scrollWidth > s.clientWidth,
    };
  });
  console.log('Sequencing in progress pill dimensions:', seqPill);
  if (!seqPill) throw new Error('Row 1 not rendered');
  if (seqPill.clipped) {
    console.error(`❌ Clipped: ${seqPill.clientWidth}px visible but ${seqPill.scrollWidth}px needed`);
    process.exitCode = 1;
  } else {
    console.log(`✅ Fits (${seqPill.clientWidth}px ≥ ${seqPill.scrollWidth}px)`);
  }
  await shot(page, 'status-pill-fit');

  // --- Test 2: Bulk bar hides when filter removes all selected+visible rows ---
  // Select row 1
  await page.click('tr[data-id="1"] td.row-check input');
  await page.waitForTimeout(200);
  await shot(page, 'one-selected');
  const visible1 = await page.evaluate(() => document.getElementById('bulkBar').style.display !== 'none');
  console.log('Bulk bar visible after selecting 1 row:', visible1);
  if (!visible1) throw new Error('bulk bar should appear with 1 selection');

  // Simulate: user clears selection, filters to something that matches nothing
  // The bug showed: renderTable early-returns for empty results and never
  // calls updateBulkBar, so a stale bar persists.
  await page.evaluate(() => {
    selectedIds.clear();
    document.getElementById('searchInput').value = 'zzznomatch';
    renderTable();
  });
  await page.waitForTimeout(300);
  await shot(page, 'after-clear-selection-empty-filter');
  const visible2 = await page.evaluate(() => document.getElementById('bulkBar').style.display !== 'none');
  console.log('Bulk bar visible after clear+empty filter (expect false):', visible2);
  if (visible2) {
    console.error('❌ Bulk bar still visible — bug not fixed');
    process.exitCode = 1;
  } else {
    console.log('✅ Bulk bar correctly hidden');
  }

  // Edge: non-filter branch — select all, then remove all from samples
  await page.evaluate(() => { document.getElementById('searchInput').value = ''; renderTable(); });
  await page.click('#headerCheck');
  await page.waitForTimeout(200);
  const allCount = await page.evaluate(() => parseInt(document.getElementById('bulkCount').textContent, 10));
  console.log('Select-all count:', allCount);
  await shot(page, 'all-selected');

  // Now simulate bulk delete (remove samples + clear ids + renderTable)
  await page.evaluate(() => {
    samples = samples.filter(s => !selectedIds.has(s.id));
    selectedIds.clear();
    renderTable();
  });
  await page.waitForTimeout(300);
  await shot(page, 'after-bulk-delete-sim');
  const visible3 = await page.evaluate(() => document.getElementById('bulkBar').style.display !== 'none');
  console.log('Bulk bar visible after bulk-delete-all (expect false):', visible3);
  if (visible3) { console.error('❌ Bar still shown after delete all'); process.exitCode = 1; }
  else { console.log('✅ Bar hidden after delete all'); }

  console.log('\n✅ Verify run complete');
} catch (e) {
  console.error('ERR', e.message);
  await shot(page, 'ERROR');
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
