#!/usr/bin/env node
/**
 * QA Cycle 17 — Vianney Ahn (grad student) + careful + "Bulk sample tracker"
 *
 * Goal: exercise the sample-tracker add/filter/edit/bulk flow end-to-end.
 * Careful modifier: after every save, verify the rendered output (stats
 * counters, row content, filter options) and confirm the committed data
 * via GitHub contents API.
 *
 * Workflow:
 *   1. Baseline sample-tracker (screenshot empty/current state)
 *   2. Add 10 new samples via the Add Sample modal in rapid succession, each
 *      with varying status/priority/seqType
 *   3. Verify stats counters (Total/In Progress/Complete/On Hold) updated
 *   4. Filter by status (e.g. Shearing, Complete, On hold) one by one,
 *      screenshot results
 *   5. Click a sample row to open the sample card popup
 *   6. Bulk-select QA17-* rows and bulk-change status
 *   7. Bulk-delete QA17-* rows to clean up
 *   8. Read every screenshot and evaluate visually
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const CYCLE = 17;
const DIR = `/tmp/qa-screenshots/cycle${CYCLE}`;
fs.mkdirSync(DIR, { recursive: true });

const TAG = 'QA17'; // all samples created by this run start with this prefix

let stepN = 0;
const log = [];
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  const p = `${DIR}/${num}-${label}.png`;
  await page.screenshot({ path: p, fullPage: false });
  log.push({ step: stepN, label, path: p });
  console.log(`📸 ${num} ${label}`);
  return p;
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

const observations = [];
const issues = [];

async function go(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

// Helper: add a sample using the modal
async function addSample({ sampleId, project, species, lead, seqType, status, priority, blocker, notes }) {
  await page.click('.stat-add');
  await page.waitForSelector('#itemModal.open', { timeout: 5000 });
  await page.fill('#fSampleId', sampleId);
  await page.fill('#fProject', project);
  if (species) await page.fill('#fSpecies', species);
  if (lead) await page.fill('#fLead', lead);
  if (seqType) await page.selectOption('#fSeqType', seqType);
  if (status) await page.selectOption('#fStatus', status);
  if (priority) await page.selectOption('#fPriority', priority);
  if (blocker) await page.fill('#fBlocker', blocker);
  if (notes) await page.fill('#fNotes', notes);
  await page.click('#btnSaveItem');
  // Wait for modal to close (success) — modal removes .open class on success
  await page.waitForFunction(() => !document.getElementById('itemModal').classList.contains('open'), { timeout: 20000 });
  // Brief settle time for render
  await page.waitForTimeout(500);
}

try {
  // ======== 01. Dashboard nav reference ========
  await go(`${BASE}/app/dashboard.html`);
  await page.waitForTimeout(1500);
  await shot(page, 'dashboard-for-nav');

  // ======== 02. Navigate to sample tracker ========
  await go(`${BASE}/sample-tracker/`);
  await page.waitForSelector('#sampleTable', { timeout: 20000 });
  await page.waitForTimeout(1800);
  await shot(page, 'tracker-baseline');

  // Capture initial stats for careful verification
  const statsInitial = await page.evaluate(() => ({
    total: parseInt(document.getElementById('statTotal').textContent, 10),
    inProgress: parseInt(document.getElementById('statInProgress').textContent, 10),
    complete: parseInt(document.getElementById('statComplete').textContent, 10),
    onHold: parseInt(document.getElementById('statOnHold').textContent, 10),
  }));
  observations.push(`Stats initial: total=${statsInitial.total}, inProgress=${statsInitial.inProgress}, complete=${statsInitial.complete}, onHold=${statsInitial.onHold}`);

  // ======== 03. Open Add modal (before state) ========
  await page.click('.stat-add');
  await page.waitForSelector('#itemModal.open');
  await page.waitForTimeout(400);
  await shot(page, 'add-modal-open');
  await page.click('button.modal-close');
  await page.waitForFunction(() => !document.getElementById('itemModal').classList.contains('open'));
  await page.waitForTimeout(200);

  // ======== 04. Add 10 samples with varying statuses/priorities ========
  const runId = Date.now().toString(36);
  const newSamples = [
    { sampleId: `${TAG}-${runId}-A1`, project: `${TAG}-bulk`, species: 'Arabidopsis thaliana', lead: 'Vianney Ahn', seqType: 'HiFi',   status: 'Tissue collected',         priority: '⭐',  notes: 'bulk tracker QA: sample 1 (careful persona)' },
    { sampleId: `${TAG}-${runId}-A2`, project: `${TAG}-bulk`, species: 'Arabidopsis thaliana', lead: 'Vianney Ahn', seqType: 'HiFi',   status: 'DNA extracted',            priority: '',   notes: 'bulk tracker QA: sample 2' },
    { sampleId: `${TAG}-${runId}-A3`, project: `${TAG}-bulk`, species: 'Arabidopsis thaliana', lead: 'Vianney Ahn', seqType: 'WGS',    status: 'Needs QC',                 priority: '💎', notes: 'bulk tracker QA: sample 3' },
    { sampleId: `${TAG}-${runId}-A4`, project: `${TAG}-bulk`, species: 'Pistacia vera',        lead: 'Vianney Ahn', seqType: 'HiFi',   status: 'QC passed',                priority: '🌾', notes: 'bulk tracker QA: sample 4' },
    { sampleId: `${TAG}-${runId}-A5`, project: `${TAG}-bulk`, species: 'Pistacia vera',        lead: 'Vianney Ahn', seqType: 'HiFi',   status: 'Shearing',                 priority: '⭐',  notes: 'bulk tracker QA: sample 5' },
    { sampleId: `${TAG}-${runId}-A6`, project: `${TAG}-bulk`, species: 'Pistacia vera',        lead: 'Vianney Ahn', seqType: 'HiFi',   status: 'Library prep',             priority: '',   notes: 'bulk tracker QA: sample 6', blocker: 'Waiting for kit' },
    { sampleId: `${TAG}-${runId}-A7`, project: `${TAG}-bulk`, species: 'Medicago sativa',      lead: 'Vianney Ahn', seqType: 'HiFi',   status: 'Submitted',                priority: '',   notes: 'bulk tracker QA: sample 7' },
    { sampleId: `${TAG}-${runId}-A8`, project: `${TAG}-bulk`, species: 'Medicago sativa',      lead: 'Vianney Ahn', seqType: 'RNA-seq',status: 'Sequencing in progress',   priority: '',   notes: 'bulk tracker QA: sample 8' },
    { sampleId: `${TAG}-${runId}-A9`, project: `${TAG}-bulk`, species: 'Medicago sativa',      lead: 'Vianney Ahn', seqType: 'WGS',    status: 'Complete',                 priority: '',   notes: 'bulk tracker QA: sample 9' },
    { sampleId: `${TAG}-${runId}-AA`, project: `${TAG}-bulk`, species: 'Medicago sativa',      lead: 'Vianney Ahn', seqType: 'WGS',    status: 'On hold',                  priority: '',   notes: 'bulk tracker QA: sample 10', blocker: 'Insufficient tissue' },
  ];

  for (let i = 0; i < newSamples.length; i++) {
    const s = newSamples[i];
    try {
      await addSample(s);
      // screenshot after each add so we can see stats/filter/row updates
      if (i === 0 || i === 4 || i === 9) {
        await shot(page, `after-add-${String(i + 1).padStart(2, '0')}-${s.sampleId.slice(-2)}`);
      }
    } catch (e) {
      issues.push(`Add failed on ${s.sampleId}: ${e.message}`);
      await shot(page, `ERROR-add-${i + 1}`);
      // Try to close the modal and continue
      await page.evaluate(() => document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')));
      await page.waitForTimeout(300);
    }
  }

  // Give GitHub a moment to finish the last commit before we inspect
  await page.waitForTimeout(1500);

  // ======== 05. Verify stats reflect the adds (careful mode) ========
  await shot(page, 'tracker-after-all-adds');
  const statsAfter = await page.evaluate(() => ({
    total: parseInt(document.getElementById('statTotal').textContent, 10),
    inProgress: parseInt(document.getElementById('statInProgress').textContent, 10),
    complete: parseInt(document.getElementById('statComplete').textContent, 10),
    onHold: parseInt(document.getElementById('statOnHold').textContent, 10),
  }));
  observations.push(`Stats after adds: total=${statsAfter.total}, inProgress=${statsAfter.inProgress}, complete=${statsAfter.complete}, onHold=${statsAfter.onHold}`);

  // Expected deltas: +10 total, +8 inProgress (everything except Complete + On hold),
  // +1 complete (sample A9), +1 on hold (sample AA).
  const deltas = {
    total: statsAfter.total - statsInitial.total,
    inProgress: statsAfter.inProgress - statsInitial.inProgress,
    complete: statsAfter.complete - statsInitial.complete,
    onHold: statsAfter.onHold - statsInitial.onHold,
  };
  observations.push(`Stats deltas: total=+${deltas.total} (exp 10), inProgress=+${deltas.inProgress} (exp 8), complete=+${deltas.complete} (exp 1), onHold=+${deltas.onHold} (exp 1)`);
  if (deltas.total !== 10) issues.push(`FUNCTIONAL: Total stat delta wrong, expected +10 got +${deltas.total}`);
  if (deltas.onHold !== 1) issues.push(`FUNCTIONAL: On-hold delta wrong, expected +1 got +${deltas.onHold}`);
  if (deltas.complete !== 1) issues.push(`FUNCTIONAL: Complete delta wrong, expected +1 got +${deltas.complete}`);
  if (deltas.inProgress !== 8) issues.push(`FUNCTIONAL: In-progress delta wrong, expected +8 got +${deltas.inProgress}`);

  // ======== 06. Search to find our samples quickly ========
  await page.fill('#searchInput', TAG);
  await page.waitForTimeout(500);
  await shot(page, 'search-QA17-all-rows');
  const qa17Rows = await page.$$eval('table tbody tr', els => els.length);
  observations.push(`Rows with search='${TAG}': ${qa17Rows}`);
  if (qa17Rows !== 10) issues.push(`FUNCTIONAL: expected 10 rows with search='${TAG}' but got ${qa17Rows}`);

  // ======== 07. Filter by Status = "Shearing" ========
  await page.selectOption('#filterStatus', 'Shearing');
  await page.waitForTimeout(500);
  await shot(page, 'search-QA17-filter-shearing');
  const shearRows = await page.$$eval('table tbody tr', els => els.length);
  observations.push(`Rows after status=Shearing filter (combined with QA17 search): ${shearRows}`);
  if (shearRows !== 1) issues.push(`FUNCTIONAL: expected 1 shearing row with QA17 search, got ${shearRows}`);

  // ======== 08. Filter by Status = "Complete" ========
  await page.selectOption('#filterStatus', 'Complete');
  await page.waitForTimeout(500);
  await shot(page, 'search-QA17-filter-complete');
  const completeRows = await page.$$eval('table tbody tr', els => els.length);
  observations.push(`Rows after status=Complete + QA17: ${completeRows}`);
  if (completeRows !== 1) issues.push(`FUNCTIONAL: expected 1 Complete row with QA17 search, got ${completeRows}`);

  // ======== 09. Filter by Status = "On hold" ========
  await page.selectOption('#filterStatus', 'On hold');
  await page.waitForTimeout(500);
  await shot(page, 'search-QA17-filter-onhold');
  const onHoldRows = await page.$$eval('table tbody tr', els => els.length);
  observations.push(`Rows after status=On hold + QA17: ${onHoldRows}`);
  if (onHoldRows !== 1) issues.push(`FUNCTIONAL: expected 1 On hold row with QA17 search, got ${onHoldRows}`);

  // ======== 10. Clear status filter, re-search ========
  await page.selectOption('#filterStatus', '');
  await page.waitForTimeout(400);
  await shot(page, 'search-QA17-after-clear-filter');

  // ======== 11. Click the first QA17 sample row's sampleId link to open card ========
  const firstSampleId = `${TAG}-${runId}-A1`;
  // The header shows the sampleId in an <a>. Click it.
  await page.evaluate((sid) => {
    const anchors = document.querySelectorAll('#tableBody a');
    for (const a of anchors) {
      if (a.textContent.trim() === sid) { a.click(); return; }
    }
  }, firstSampleId);
  await page.waitForSelector('#sampleCardModal.open', { timeout: 5000 });
  await page.waitForTimeout(400);
  await shot(page, 'sample-card-popup');

  // Inspect card contents
  const cardText = await page.$eval('#sampleCardModal .modal-body', el => el.textContent);
  observations.push(`Sample card includes sampleId=${cardText.includes(firstSampleId)} seqType=HiFi=${cardText.includes('HiFi')} status=Tissue collected=${cardText.includes('Tissue collected')}`);

  // Close card
  await page.evaluate(() => document.getElementById('sampleCardModal').classList.remove('open'));
  await page.waitForTimeout(300);

  // ======== 12. Open the edit modal on first sample ========
  await page.evaluate((sid) => {
    const rows = [...document.querySelectorAll('#tableBody tr')];
    for (const r of rows) {
      if (r.textContent.includes(sid)) {
        const btn = r.querySelector('button[title="Edit full form"]');
        if (btn) btn.click();
        return;
      }
    }
  }, firstSampleId);
  await page.waitForSelector('#itemModal.open', { timeout: 5000 });
  await page.waitForTimeout(400);
  await shot(page, 'edit-modal-populated');
  // Close edit modal without changes
  await page.click('#itemModal button.modal-close');
  await page.waitForFunction(() => !document.getElementById('itemModal').classList.contains('open'));
  await page.waitForTimeout(300);

  // ======== 13. Select 3 rows for bulk-status change ========
  // Our rows are QA17-{runId}-A5 (Shearing), A6 (Library prep), A7 (Submitted)
  // Bulk-change them all to "Ready to submit".
  const bulkIds = [`${TAG}-${runId}-A5`, `${TAG}-${runId}-A6`, `${TAG}-${runId}-A7`];
  await page.evaluate((ids) => {
    const rows = [...document.querySelectorAll('#tableBody tr')];
    for (const r of rows) {
      const idEl = r.querySelector('a');
      if (!idEl) continue;
      if (ids.includes(idEl.textContent.trim())) {
        const cb = r.querySelector('td.row-check input[type="checkbox"]');
        if (cb && !cb.checked) cb.click();
      }
    }
  }, bulkIds);
  await page.waitForTimeout(400);
  await shot(page, 'bulk-3-selected');

  // Verify bulk bar is showing
  const bulkBarVisible = await page.evaluate(() => {
    const bar = document.getElementById('bulkBar');
    if (!bar) return false;
    return bar.style.display !== 'none';
  });
  observations.push(`Bulk bar visible after 3 selections: ${bulkBarVisible}`);
  if (!bulkBarVisible) issues.push(`FUNCTIONAL: bulk bar did not appear after selecting 3 rows`);

  // ======== 14. Bulk-change status to "Ready to submit" ========
  await page.selectOption('#bulkStatus', 'Ready to submit');
  await page.waitForTimeout(300);
  await shot(page, 'bulk-bar-status-selected');
  await page.click('button.bulk-btn:has-text("Apply")');
  // Wait for the commit to finish (toast appears, samples reload)
  await page.waitForTimeout(5000);
  await shot(page, 'after-bulk-status-apply');

  // Verify all 3 now show "Ready to submit"
  const bulkStatusOK = await page.evaluate((ids) => {
    const rows = [...document.querySelectorAll('#tableBody tr')];
    const found = {};
    for (const r of rows) {
      const a = r.querySelector('a');
      if (a && ids.includes(a.textContent.trim())) {
        const sel = r.querySelector('select.status-select');
        found[a.textContent.trim()] = sel ? sel.value : null;
      }
    }
    return found;
  }, bulkIds);
  observations.push(`After bulk status apply: ${JSON.stringify(bulkStatusOK)}`);
  for (const id of bulkIds) {
    if (bulkStatusOK[id] !== 'Ready to submit') {
      issues.push(`FUNCTIONAL: bulk status did not apply to ${id}, got "${bulkStatusOK[id]}"`);
    }
  }

  // ======== 15. Verify via GitHub contents API (careful mode) ========
  const ghState = execSync(
    `gh api repos/monroe-lab/lab-handbook/contents/docs/sample-tracker/samples.json`,
    { encoding: 'utf8' }
  );
  const gh = JSON.parse(ghState);
  const raw = Buffer.from(gh.content, 'base64').toString('utf8');
  const allSamples = JSON.parse(raw);
  const mySamples = allSamples.filter(s => (s.sampleId || '').startsWith(TAG));
  observations.push(`GitHub now has ${mySamples.length} QA17 samples (expected 10)`);
  if (mySamples.length !== 10) issues.push(`FUNCTIONAL: GitHub sample count mismatch after bulk change, got ${mySamples.length}`);
  const a5 = mySamples.find(s => s.sampleId === `${TAG}-${runId}-A5`);
  if (a5 && a5.status !== 'Ready to submit') {
    issues.push(`FUNCTIONAL: GitHub A5 status is "${a5?.status}" not "Ready to submit"`);
  }
  observations.push(`A5 on GitHub: status=${a5?.status} priority=${a5?.priority}`);

  // ======== 16. Bulk-select ALL QA17 rows for final cleanup ========
  // Keep the search filter at "QA17". Click the header checkbox to select all visible.
  await page.fill('#searchInput', TAG);
  await page.waitForTimeout(400);
  await shot(page, 'cleanup-all-QA17-visible');
  await page.click('#headerCheck');
  await page.waitForTimeout(500);
  await shot(page, 'cleanup-all-QA17-selected');
  const selectedCount = await page.evaluate(() => parseInt(document.getElementById('bulkCount').textContent, 10));
  observations.push(`Bulk count after Select All (filter=QA17): ${selectedCount}`);

  // ======== 17. Confirm delete via Playwright dialog handler ========
  page.once('dialog', d => d.accept());
  await page.click('button.bulk-btn.danger:has-text("Delete")');
  // Wait for the commit to complete
  await page.waitForTimeout(7000);
  await shot(page, 'after-bulk-delete');

  // Verify cleanup: no QA17 rows in UI
  await page.fill('#searchInput', TAG);
  await page.waitForTimeout(500);
  const leftoverRows = await page.$$eval('table tbody tr', els => els.length);
  observations.push(`Leftover QA17 rows after bulk delete: ${leftoverRows}`);
  if (leftoverRows !== 0) issues.push(`FUNCTIONAL: ${leftoverRows} QA17 rows still visible after bulk delete`);
  await shot(page, 'cleanup-confirmed-empty');

  // Verify via GitHub
  await new Promise(r => setTimeout(r, 2000));
  const gh2 = JSON.parse(execSync(
    `gh api repos/monroe-lab/lab-handbook/contents/docs/sample-tracker/samples.json`,
    { encoding: 'utf8' }
  ));
  const raw2 = Buffer.from(gh2.content, 'base64').toString('utf8');
  const allSamples2 = JSON.parse(raw2);
  const qaLeft = allSamples2.filter(s => (s.sampleId || '').startsWith(TAG));
  observations.push(`GitHub QA17 samples after cleanup: ${qaLeft.length} (expected 0)`);
  if (qaLeft.length > 0) issues.push(`FUNCTIONAL: ${qaLeft.length} QA17 samples left on GitHub after cleanup`);

  // ======== 18. Clear search, final state ========
  await page.fill('#searchInput', '');
  await page.waitForTimeout(400);
  await shot(page, 'tracker-final-state');

  // Final stats sanity
  const statsFinal = await page.evaluate(() => ({
    total: parseInt(document.getElementById('statTotal').textContent, 10),
    inProgress: parseInt(document.getElementById('statInProgress').textContent, 10),
    complete: parseInt(document.getElementById('statComplete').textContent, 10),
    onHold: parseInt(document.getElementById('statOnHold').textContent, 10),
  }));
  observations.push(`Stats final: total=${statsFinal.total} (initial was ${statsInitial.total})`);
  if (statsFinal.total !== statsInitial.total) {
    issues.push(`FUNCTIONAL: Final total ${statsFinal.total} does not equal initial ${statsInitial.total} after cleanup`);
  }

  console.log('\n=== OBSERVATIONS ===');
  observations.forEach(o => console.log('•', o));
  console.log('\n=== ISSUES ===');
  if (issues.length) issues.forEach(i => console.log('❗', i));
  else console.log('✅ none');
} catch (e) {
  console.error('SCRIPT ERROR:', e.message);
  console.error(e.stack);
  await shot(page, 'ERROR-state');
  issues.push(`SCRIPT ERROR: ${e.message}`);
} finally {
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({ steps: log, observations, issues }, null, 2));
  await browser.close();
  console.log(`\n✅ Done. ${stepN} screenshots. Log at ${DIR}/_log.json`);
}
