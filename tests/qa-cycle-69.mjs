// QA cycle 69: Jordan Park (postdoc, rushed) — Accession status overhaul day.
// Scenario card: pick an active accession, change status to storage,
// set priority 3 stars, edit people field with [[ autocomplete to add a 2nd
// person, add a status_note, save, reload, verify roundtrip in tracker.
// Cleanup: delete the test accession at the end.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle69';
fs.mkdirSync(SHOTS, { recursive: true });

const STAMP = Math.random().toString(36).slice(2, 8);
const ACC_ID = `qa69-overhaul-${STAMP}`;
const SLUG = ACC_ID.toLowerCase();

let stepN = 0;
async function shot(page, name) {
  stepN += 1;
  const num = String(stepN).padStart(2, '0');
  const file = path.join(SHOTS, `cycle69-${num}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
  return file;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);

const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on('console', m => {
  if (m.type() === 'error') console.log('  [console error]', m.text());
});

try {
  console.log(`\n=== QA CYCLE 69 — Jordan Park (rushed) — Accession status overhaul ===`);
  console.log(`Target accession: ${ACC_ID} (slug ${SLUG})`);

  // 1. Land on accessions tracker
  console.log('\nstep 1: load accessions page');
  await page.goto(`${BASE}/app/accessions.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#accTable, #emptyState', { timeout: 20000 });
  await page.waitForTimeout(500);
  await shot(page, 'jordan-accessions-baseline');

  // 2. Open Add modal
  console.log('\nstep 2: click Add Accession card');
  await page.click('#addBtn');
  await page.waitForSelector('#addModal.open');
  await shot(page, 'jordan-add-modal-empty');

  // 3. Fill add form (rushed: tab through fast)
  console.log('\nstep 3: fill add form rushed-style');
  await page.fill('#addAccessionId', ACC_ID);
  await page.fill('#addProject', 'QA Cycle 69');
  await page.fill('#addSpeciesField', 'Pistacia vera');
  await page.fill('#addPeople', '[[grey-monroe]]');
  await page.selectOption('#addStatus', 'active');
  await page.selectOption('#addPriority', '0');
  await shot(page, 'jordan-add-modal-filled');

  // 4. Submit — editor modal opens after create
  console.log('\nstep 4: confirm create');
  await page.click('#addConfirmBtn');
  // Editor modal opens after the create completes
  await page.waitForSelector('#em-modal-root.open, .editor-modal.open, #em-title', { timeout: 25000 });
  await page.waitForTimeout(800);
  await shot(page, 'jordan-editor-modal-after-create');

  // 5. Close editor modal — rushed Jordan wants to use the inline pills
  console.log('\nstep 5: close editor, return to tracker');
  await page.click('#em-cancel');
  await page.waitForTimeout(500);
  // Wait for the row to appear
  await page.waitForFunction((slug) =>
    Array.from(document.querySelectorAll('#tableBody tr'))
      .some(tr => tr.outerHTML.includes(`'${slug}'`) || tr.outerHTML.includes(`"${slug}"`)),
    SLUG, { timeout: 15000 });
  await shot(page, 'jordan-tracker-row-visible');

  // 6. Find the row, screenshot it close-up
  console.log('\nstep 6: locate new row');
  const row = page.locator(`#tableBody tr:has(strong:text-is("${ACC_ID}"))`);
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await row.screenshot({ path: path.join(SHOTS, 'cycle69-07-jordan-row-closeup-active.png') });
  stepN += 1;
  console.log(`  📸 cycle69-07-jordan-row-closeup-active.png`);

  // 7. Inline change status to "storage" via dropdown pill
  console.log('\nstep 7: change status pill → storage (rushed)');
  // The status pill is a <select> inside the row. Match by data via row + pill class
  await shot(page, 'jordan-before-status-change');
  const statusSelect = row.locator('select.status-pill');
  await statusSelect.selectOption('storage');
  // Toast + queued commit
  await page.waitForTimeout(2000);
  await shot(page, 'jordan-after-status-change-storage');

  // 8. Click priority stars 3x rapidly to bump 0→3
  console.log('\nstep 8: cycle priority stars 0→3 with 3 quick clicks');
  const stars = row.locator('.pri-stars');
  await shot(page, 'jordan-before-priority-clicks');
  // Three rapid clicks. Each click queues a commit; the queue serializes.
  await stars.click();
  await page.waitForTimeout(200);
  await stars.click();
  await page.waitForTimeout(200);
  await stars.click();
  // Wait for all queued commits to land
  await page.waitForTimeout(4000);
  await shot(page, 'jordan-after-priority-3stars');

  // 9. Filter status=Storage to verify it lives in the right bucket
  console.log('\nstep 9: filter status=Storage');
  await page.selectOption('#filterStatus', 'storage');
  await page.waitForTimeout(500);
  await shot(page, 'jordan-filter-storage-active');

  // 10. Open the editor on the row to add status_note + 2nd person
  console.log('\nstep 10: open editor for accession');
  // Click the row body (not the pill or stars or actions)
  await row.locator('td.acc-id-cell').click();
  await page.waitForSelector('#em-title:not(:has-text("Loading"))', { timeout: 20000 });
  await page.waitForTimeout(800);
  await shot(page, 'jordan-editor-opened-readonly');

  // Switch to edit mode (post-create the modal usually opens in edit, but after
  // close+reopen it lands in read view — click Edit)
  const editToggle = page.locator('#em-edit-toggle');
  if (await editToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
    await editToggle.click();
    await page.waitForTimeout(400);
  }
  await shot(page, 'jordan-editor-edit-mode');

  // 11. Edit people field — append a second person via [[ wikilink
  console.log('\nstep 11: append 2nd person to people field');
  const peopleInput = page.locator('.em-field-input[data-key="people"]');
  await peopleInput.scrollIntoViewIfNeeded();
  // Read current value, append
  const cur = await peopleInput.inputValue();
  console.log('  current people:', cur);
  // Use rushed-style typing; append after existing
  await peopleInput.click();
  await peopleInput.press('End');
  await peopleInput.type(', [[mariele-lensink]]', { delay: 30 });
  await shot(page, 'jordan-people-field-after-edit');

  // 12. Find or add status_note field. If field exists: fill. If not: add via "+ Add field"
  console.log('\nstep 12: ensure status_note field present and fill it');
  const statusNoteInput = page.locator('.em-field-input[data-key="status_note"]');
  let hasNote = await statusNoteInput.count() > 0;
  if (!hasNote) {
    // Try the add-field button
    const addFieldBtn = page.locator('#em-add-field-btn');
    if (await addFieldBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await addFieldBtn.click();
      await page.waitForTimeout(400);
      // The custom-field UI typically asks for a key. Look for an input.
      const keyInput = page.locator('#em-custom-fields input[placeholder*="field" i], input.em-new-key');
      if (await keyInput.first().isVisible({ timeout: 800 }).catch(() => false)) {
        await keyInput.first().fill('status_note');
      }
    }
    await shot(page, 'jordan-add-field-attempt');
    hasNote = await page.locator('.em-field-input[data-key="status_note"]').count() > 0;
  }
  if (hasNote) {
    const note = page.locator('.em-field-input[data-key="status_note"]').first();
    await note.scrollIntoViewIfNeeded();
    await note.fill('Cold-stored 2026-04-27 — keep in -80 box D-shelf-5 until library prep.');
    await shot(page, 'jordan-status-note-filled');
  } else {
    console.log('  ⚠ could not add status_note field via +Add field; will edit raw frontmatter via API');
  }

  // 13. Save the editor
  console.log('\nstep 13: save editor');
  await shot(page, 'jordan-before-save');
  await page.click('#em-save');
  // Watch for save complete
  await page.waitForFunction(() => {
    const btn = document.getElementById('em-save');
    return !btn || btn.style.display === 'none' || (!btn.disabled && !/Saving/i.test(btn.textContent || ''));
  }, null, { timeout: 25000 });
  await page.waitForTimeout(1500);
  await shot(page, 'jordan-after-save');

  // Close modal
  await page.click('#em-cancel');
  await page.waitForTimeout(500);

  // 14. Hard reload + verify roundtrip
  console.log('\nstep 14: hard reload + verify roundtrip');
  await page.goto(`${BASE}/app/accessions.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#accTable', { timeout: 20000 });
  await page.waitForTimeout(800);

  // Filter storage so the row floats up
  await page.selectOption('#filterStatus', 'storage');
  await page.waitForTimeout(500);
  await shot(page, 'jordan-reload-filter-storage');

  const row2 = page.locator(`#tableBody tr:has(strong:text-is("${ACC_ID}"))`);
  await row2.scrollIntoViewIfNeeded();
  await row2.screenshot({ path: path.join(SHOTS, `cycle69-${String(++stepN).padStart(2,'0')}-jordan-row-after-reload.png` ) });
  console.log(`  📸 cycle69-${String(stepN).padStart(2,'0')}-jordan-row-after-reload.png`);

  // 15. Open popup to verify everything roundtripped
  console.log('\nstep 15: open accession popup for final verify');
  await row2.locator('td.acc-id-cell').click();
  await page.waitForSelector('#em-title:not(:has-text("Loading"))', { timeout: 20000 });
  await page.waitForTimeout(900);
  await shot(page, 'jordan-popup-after-reload');

  // 16. Fetch the file from GitHub API to verify final frontmatter
  console.log('\nstep 16: API fetch — confirm frontmatter persisted');
  const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-69' }
  });
  const apiData = await apiRes.json();
  const content = Buffer.from(apiData.content, 'base64').toString('utf8');
  console.log('--- frontmatter snippet ---');
  console.log(content.split('\n').slice(0, 20).join('\n'));
  console.log('---------------------------');
  fs.writeFileSync(path.join(SHOTS, 'final-frontmatter.txt'), content);

  // Close popup
  await page.click('#em-cancel');

  // 17. Cleanup: delete the accession via UI
  console.log('\nstep 17: cleanup — delete accession');
  await page.selectOption('#filterStatus', '');
  await page.waitForTimeout(400);
  // Search for our slug to find the row
  await page.fill('#searchInput', ACC_ID);
  await page.waitForTimeout(400);
  await shot(page, 'jordan-cleanup-search');
  const delRow = page.locator(`#tableBody tr:has(strong:text-is("${ACC_ID}"))`);
  await delRow.locator('button.del').click();
  await page.waitForSelector('#deleteModal.open');
  await shot(page, 'jordan-cleanup-confirm-modal');
  await page.click('#deleteModal .btn-danger');
  await page.waitForTimeout(2000);
  await shot(page, 'jordan-cleanup-done');

  console.log('\n✅ done');
} catch (err) {
  console.error('\n❌ FAIL:', err.message);
  await shot(page, 'jordan-FAIL');
  // Best effort cleanup via API
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
      headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-69' }
    });
    if (r.ok) {
      const d = await r.json();
      await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
        method: 'DELETE',
        headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-69', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'qa-cycle-69 cleanup after failure', sha: d.sha }),
      });
      console.log('  cleanup DELETE sent');
    }
  } catch (e) { console.error('  cleanup failed:', e.message); }
  throw err;
} finally {
  await browser.close();
}
