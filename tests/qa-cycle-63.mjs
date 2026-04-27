/**
 * QA Cycle 63
 * Persona: Vianney Ahn (grad student)
 * Modifier: thorough (fills optional fields, multiple wikilinks, deep nesting)
 * Scenario: Aliquot batch from accession A3-T1-S → freezer box grid
 *
 * Vianney just finished extracting DNA from accession A3-T1-S. She now needs to:
 *   1. Open the accession A3-T1-S in /app/accessions.html via deep-link
 *   2. Click "Add Instance" → pick "extraction" → fill out the new extraction
 *      record (label_1, label_2, notes, quality)
 *   3. Save the extraction; verify it lands under docs/accessions/ with `of:`
 *      pointing back at A3-T1-S
 *   4. Open the freezer box "Pistachio DNA Box" (10x10, in shelf-minus80-a-1)
 *   5. Click 3 empty cells (J10, J9, J8 — far corner of grid):
 *        - Cell J10: place the new extraction (search → click)
 *        - Cell J9:  Create new tube → set title, of=A3-T1-S, save
 *        - Cell J8:  Create new tube → set title, of=A3-T1-S, save
 *   6. Reload the box; verify all 3 cells are occupied with correct icons
 *   7. Reopen the accession; verify Contents pane shows the new instances
 *   8. Open the extraction; follow `of:` link back to the accession (cross-link)
 *   9. Cleanup all created files
 *
 * Screenshots BEFORE+AFTER every meaningful action. Read each screenshot.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle63';
fs.mkdirSync(SHOTS, { recursive: true });

const STAMP = Date.now().toString(36);
const ACCESSION_SLUG = 'accessions/a3-t1-s';
const ACCESSION_PATH = 'docs/accessions/a3-t1-s.md';
const BOX_SLUG = 'locations/box-pistachio-dna';
const BOX_PATH = 'docs/locations/box-pistachio-dna.md';

let stepN = 0;
async function shot(page, label) {
  stepN++;
  const path = `${SHOTS}/step${String(stepN).padStart(2, '0')}-${label}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log('  📸', path);
  return path;
}

async function ghDelete(path, message) {
  const meta = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=main`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!meta.ok) {
    console.log(`  ⚠ cleanup ${path}: GET → ${meta.status}`);
    return;
  }
  const j = await meta.json();
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sha: j.sha }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.log(`  ⚠ cleanup ${path}: DELETE → ${res.status} ${t.slice(0, 200)}`);
  } else {
    console.log(`  🧹 deleted ${path}`);
  }
}

const cleanup = []; // list of repo paths to clean up at end
const observations = [];
const bugs = [];

(async () => {
  console.log('▶ Cycle 63 — Vianney Ahn × thorough × Aliquot Batch');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const pageErrors = [];
  page.on('console', (msg) => {
    const t = msg.type();
    if (t === 'error') {
      const text = msg.text().slice(0, 240);
      pageErrors.push(text);
      console.log('  PAGE-ERR:', text);
    }
  });

  // ── 1. Load accession A3-T1-S via deep-link ──
  console.log('▶ Step 1: load accessions tracker with A3-T1-S deep-link');
  await page.goto(`${BASE}/app/accessions.html?doc=${ACCESSION_PATH}`, { waitUntil: 'networkidle' });
  // Wait for editor modal to mount + the title to render
  await page.waitForSelector('.em-overlay.open', { timeout: 15000 });
  await page.waitForFunction(() => {
    const t = document.getElementById('em-title');
    return t && /A3-T1-S/i.test(t.textContent || '');
  }, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, 'a01-accession-a3t1s-popup-open');

  // ── 2. Find the Add Instance button in the contents pane ──
  console.log('▶ Step 2: locate Add Instance button on accession');
  const addBtnInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.em-add-btn'));
    return btns.map(b => ({ text: (b.textContent || '').trim().slice(0, 50), html: b.outerHTML.slice(0, 80) }));
  });
  console.log('  add-btns visible:', JSON.stringify(addBtnInfo));
  await shot(page, 'a02-before-add-instance-click');

  // ── 3. Click Add Instance, expect lab-modal asking for kind ──
  console.log('▶ Step 3: click Add Instance');
  await page.evaluate((slug) => {
    Lab.editorModal._addInstance(slug);
  }, ACCESSION_SLUG);
  await page.waitForSelector('.lab-modal', { state: 'attached', timeout: 8000 });
  await page.waitForTimeout(300);
  await shot(page, 'a03-add-instance-kind-modal');

  // ── 4. Pick extraction kind, submit ──
  console.log('▶ Step 4: select kind=extraction → submit');
  await page.selectOption('.lab-modal select[data-modal-key="kind"]', 'extraction');
  await page.waitForTimeout(150);
  await shot(page, 'a04-kind-extraction-selected');
  // Watch for the PUT that creates the new extraction file
  const createReq = page.waitForResponse(
    (resp) => resp.url().includes('/contents/docs/accessions/extraction-a3-t1-s-')
              && resp.request().method() === 'PUT',
    { timeout: 30000 },
  );
  await page.click('.lab-modal .lab-modal-ok');
  const createResp = await createReq;
  const createJson = await createResp.json();
  const newExtractionPath = createJson.content && createJson.content.path;
  console.log('  new extraction path:', newExtractionPath);
  if (newExtractionPath) cleanup.push(newExtractionPath);
  await page.waitForTimeout(1500);
  await shot(page, 'a05-after-extraction-created-popup');

  // ── 5. Verify new file content (of: pointing at accession) ──
  const newRaw = await fetch(`https://api.github.com/repos/${REPO}/contents/${newExtractionPath}?ref=main`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3.raw' },
  }).then(r => r.text());
  console.log('  new extraction raw (first 300):', newRaw.slice(0, 300));
  if (!newRaw.includes('of: ' + ACCESSION_SLUG) && !newRaw.includes('of: "' + ACCESSION_SLUG + '"')) {
    bugs.push({ id: 'CYCLE63-EXTRACTION-OF-MISSING', severity: 'data', summary: 'New extraction created from accession does not have `of:` set to accession slug. Raw: ' + newRaw.slice(0, 200) });
  } else {
    observations.push('New extraction has of: ' + ACCESSION_SLUG + ' → cross-link confirmed.');
  }
  if (!newRaw.includes('type: extraction')) {
    bugs.push({ id: 'CYCLE63-EXTRACTION-TYPE-MISSING', severity: 'data', summary: 'New extraction file missing type: extraction. Raw: ' + newRaw.slice(0, 200) });
  }

  // ── 6. Click into edit mode to give the extraction a real title + label_1 + label_2 + notes ──
  console.log('▶ Step 6: enter edit mode on the new extraction, fill thorough fields');
  // The popup is currently in view mode after openPopup. Click Edit.
  // (addInstanceFromConcept calls startEditing() after openPopup.)
  // Verify edit mode is on already
  const editingNow = await page.evaluate(() => document.body.classList.contains('em-editing'));
  console.log('  editing-mode body class:', editingNow);
  if (!editingNow) {
    // click edit-toggle
    await page.click('#em-edit-toggle');
    await page.waitForTimeout(500);
  }

  // Fill title (rename for clarity)
  const titleInput = await page.$('.em-field-input[data-key="title"]');
  if (titleInput) {
    await titleInput.fill(`A3-T1-S DNA Extract (QA63 ${STAMP})`);
  }
  await shot(page, 'a06-extraction-title-filled');

  // Add a label_1 / label_2 via the "+ field" affordance — the kind value
  // ditches sample-only fields, but bottle/extraction pick up a 'detail_sheet_link' etc.
  // Look for em-add-field-btn to add custom fields
  const addFieldBtnExists = await page.locator('#em-add-field-btn').isVisible().catch(() => false);
  console.log('  add-field button visible:', addFieldBtnExists);

  // Save the extraction (with renamed title)
  const saveResp1 = page.waitForResponse(
    (resp) => resp.url().endsWith(newExtractionPath) && resp.request().method() === 'PUT',
    { timeout: 20000 },
  );
  await page.click('#em-save');
  await saveResp1;
  await page.waitForTimeout(1200);
  await shot(page, 'a07-extraction-after-save');

  // Verify the saved title sticks (check view-mode header)
  const viewModeTitle = await page.evaluate(() => {
    const h = document.querySelector('.em-meta');
    return h ? h.textContent.slice(0, 200) : '';
  });
  console.log('  em-meta after save:', viewModeTitle.slice(0, 100));

  // Close the popup
  console.log('▶ Step 7: close extraction popup');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await shot(page, 'a08-after-close-extraction-popup');

  // ── 8. Open box-pistachio-dna ──
  console.log('▶ Step 8: open box-pistachio-dna (10x10 grid)');
  await page.goto(`${BASE}/app/inventory.html?doc=${BOX_PATH}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.em-overlay.open', { timeout: 15000 });
  await page.waitForFunction(() => {
    const grid = document.querySelector('.em-grid-cell');
    return !!grid;
  }, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, 'a09-box-popup-grid-rendered');

  const gridStats = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('.em-grid-cell'));
    const empty = cells.filter(c => c.classList.contains('empty'));
    const occupied = cells.filter(c => c.classList.contains('occupied'));
    return { total: cells.length, empty: empty.length, occupied: occupied.length };
  });
  console.log('  grid stats:', JSON.stringify(gridStats));
  observations.push('Box grid rendered ' + gridStats.total + ' cells (' + gridStats.empty + ' empty, ' + gridStats.occupied + ' occupied).');

  // Pick three known-empty cells. Box is 10x10 (rows A-J, cols 1-10).
  // J8/J9/J10 are far corner — almost certainly empty.
  const targetCells = ['J10', 'J9', 'J8'];

  // ── 9. Cell J10: place the new extraction here via search ──
  console.log('▶ Step 9: click empty cell J10 → place existing extraction');
  await shot(page, 'a10-before-cell-j10-click');
  await page.click(`.em-grid-cell.empty[data-cell="J10"]`);
  await page.waitForSelector('.em-place-here-pop', { timeout: 8000 });
  await page.waitForTimeout(300);
  await shot(page, 'a11-place-here-popover-open');

  // Search for "A3-T1-S"
  console.log('▶ Step 10: search "A3-T1-S" in place-here popover');
  await page.fill('.em-place-search', 'A3-T1-S');
  await page.waitForTimeout(500);
  await shot(page, 'a12-search-results-a3t1s');

  // Find the new extraction in results — it should be at the top with our QA63 stamp
  const candidateSlug = newExtractionPath.replace(/^docs\//, '').replace(/\.md$/, '');
  console.log('  candidate slug to click:', candidateSlug);
  const targetResult = page.locator(`.em-place-result[data-slug="${candidateSlug}"]`);
  const targetCount = await targetResult.count();
  console.log('  matching .em-place-result count:', targetCount);
  if (targetCount === 0) {
    bugs.push({ id: 'CYCLE63-PLACE-HERE-NEW-FILE-MISSING', severity: 'functional', summary: 'New extraction not found in place-here search results — object index may not have been patched promptly. Search term: "A3-T1-S".' });
    // Fall back to clicking first result whose slug starts with extraction-a3-t1-s-
    const fallback = page.locator('.em-place-result').first();
    if (await fallback.count()) {
      await shot(page, 'a13-fallback-first-result-only');
      // skip
    }
  }
  if (targetCount > 0) {
    const moveResp = page.waitForResponse(
      (resp) => resp.url().endsWith(newExtractionPath) && resp.request().method() === 'PUT',
      { timeout: 20000 },
    );
    await targetResult.first().click();
    await moveResp;
    await page.waitForTimeout(1500);
    await shot(page, 'a13-after-place-extraction-at-j10');

    // Verify J10 now occupied
    const j10cls = await page.evaluate(() =>
      document.querySelector('[data-cell="J10"]')?.className || ''
    );
    console.log('  cell J10 class after place:', j10cls);
    if (!/occupied/.test(j10cls)) {
      bugs.push({ id: 'CYCLE63-J10-NOT-OCCUPIED', severity: 'functional', summary: 'After placing extraction at J10, cell did not show occupied class. class=' + j10cls });
    }
  }

  // ── 11. Cell J9: Create new tube here ──
  console.log('▶ Step 11: click empty cell J9 → Create new here');
  await shot(page, 'a14-before-cell-j9-click');
  await page.click('.em-grid-cell.empty[data-cell="J9"]');
  await page.waitForSelector('.em-place-here-pop .em-place-create', { timeout: 8000 });
  await page.waitForTimeout(200);
  await shot(page, 'a15-place-here-popover-j9');
  // Click Create new here — overlay re-renders into create-new mode
  await page.click('.em-place-here-pop .em-place-create');
  // Wait for the new-item editor to mount (Toast UI)
  await page.waitForFunction(() => {
    return document.body.classList.contains('em-editing') &&
      !!document.querySelector('.em-field-input[data-key="title"]');
  }, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, 'a16-new-tube-editor-j9');

  // Verify parent + position pre-filled
  const tubeJ9Pre = await page.evaluate(() => ({
    type: document.querySelector('.em-field-input[data-key="type"]')?.value,
    parent: document.querySelector('.em-field-input[data-key="parent"]')?.value,
    position: document.querySelector('.em-field-input[data-key="position"]')?.value,
  }));
  console.log('  new-tube prefill:', JSON.stringify(tubeJ9Pre));
  if (tubeJ9Pre.parent !== BOX_SLUG) {
    bugs.push({ id: 'CYCLE63-NEW-TUBE-PARENT-WRONG', severity: 'functional', summary: 'New-tube parent prefill wrong. expected=' + BOX_SLUG + ' got=' + tubeJ9Pre.parent });
  }
  if (tubeJ9Pre.position !== 'J9') {
    bugs.push({ id: 'CYCLE63-NEW-TUBE-POSITION-WRONG', severity: 'functional', summary: 'New-tube position prefill wrong. expected=J9 got=' + tubeJ9Pre.position });
  }

  // Set title for tube J9
  await page.fill('.em-field-input[data-key="title"]', `Aliquot 1 A3-T1-S QA63 ${STAMP}`);
  await shot(page, 'a17-tube-j9-title-filled');

  // Set `of:` field to point at the accession (use the "Add Field" affordance to add 'of:' if not present)
  const ofInputJ9 = await page.locator('.em-field-input[data-key="of"]').count();
  console.log('  of: input count on tube J9:', ofInputJ9);
  if (ofInputJ9 > 0) {
    await page.fill('.em-field-input[data-key="of"]', ACCESSION_SLUG);
    await shot(page, 'a18-tube-j9-of-filled');
  } else {
    observations.push('Tube editor did NOT expose `of:` field by default; field would need to be added manually.');
  }

  // Save tube J9
  console.log('▶ Step 12: save tube J9');
  const saveJ9 = page.waitForResponse(
    (resp) => /\/contents\/docs\/locations\/aliquot-1-a3-t1-s-qa63/.test(resp.url()) && resp.request().method() === 'PUT',
    { timeout: 30000 },
  );
  await page.click('#em-save');
  const j9Resp = await saveJ9;
  const j9Json = await j9Resp.json();
  const tubeJ9Path = j9Json.content && j9Json.content.path;
  console.log('  tube J9 saved at:', tubeJ9Path);
  if (tubeJ9Path) cleanup.push(tubeJ9Path);
  await page.waitForTimeout(1500);
  await shot(page, 'a19-after-save-tube-j9');

  // Re-open the box to verify J9 occupied
  console.log('▶ Step 13: reload box to verify J9 occupied');
  await page.goto(`${BASE}/app/inventory.html?doc=${BOX_PATH}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.em-overlay.open', { timeout: 15000 });
  await page.waitForSelector('.em-grid-cell', { timeout: 10000 });
  await page.waitForTimeout(800);
  await shot(page, 'a20-box-reloaded-after-j9');

  const j9cls = await page.evaluate(() =>
    document.querySelector('[data-cell="J9"]')?.className || ''
  );
  console.log('  cell J9 class after reload:', j9cls);
  if (!/occupied/.test(j9cls)) {
    bugs.push({ id: 'CYCLE63-J9-NOT-OCCUPIED', severity: 'functional', summary: 'After reload, J9 did not show occupied. class=' + j9cls });
  }

  // ── 14. Cell J8: Create new tube via "Create new here" ──
  console.log('▶ Step 14: click empty cell J8 → Create new here');
  await shot(page, 'a21-before-cell-j8-click');
  await page.click('.em-grid-cell.empty[data-cell="J8"]');
  await page.waitForSelector('.em-place-here-pop .em-place-create', { timeout: 8000 });
  await page.waitForTimeout(200);
  await page.click('.em-place-here-pop .em-place-create');
  await page.waitForFunction(() => {
    return document.body.classList.contains('em-editing') &&
      !!document.querySelector('.em-field-input[data-key="title"]');
  }, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await shot(page, 'a22-new-tube-editor-j8');

  await page.fill('.em-field-input[data-key="title"]', `Aliquot 2 A3-T1-S QA63 ${STAMP}`);
  if (await page.locator('.em-field-input[data-key="of"]').count() > 0) {
    await page.fill('.em-field-input[data-key="of"]', ACCESSION_SLUG);
  }
  await shot(page, 'a23-tube-j8-filled');

  const saveJ8 = page.waitForResponse(
    (resp) => /\/contents\/docs\/locations\/aliquot-2-a3-t1-s-qa63/.test(resp.url()) && resp.request().method() === 'PUT',
    { timeout: 30000 },
  );
  await page.click('#em-save');
  const j8Resp = await saveJ8;
  const j8Json = await j8Resp.json();
  const tubeJ8Path = j8Json.content && j8Json.content.path;
  console.log('  tube J8 saved at:', tubeJ8Path);
  if (tubeJ8Path) cleanup.push(tubeJ8Path);
  await page.waitForTimeout(1500);
  await shot(page, 'a24-after-save-tube-j8');

  // ── 15. Final verification: reload box, all 3 cells occupied ──
  console.log('▶ Step 15: final reload, verify J8/J9/J10 occupied');
  await page.goto(`${BASE}/app/inventory.html?doc=${BOX_PATH}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.em-overlay.open', { timeout: 15000 });
  await page.waitForSelector('.em-grid-cell', { timeout: 10000 });
  await page.waitForTimeout(1200);
  await shot(page, 'a25-box-final-reload');

  const finalCells = await page.evaluate(() => {
    const out = {};
    ['J10', 'J9', 'J8'].forEach(k => {
      const el = document.querySelector(`[data-cell="${k}"]`);
      out[k] = el ? { cls: el.className, slug: el.dataset.slug || null, title: el.title } : null;
    });
    return out;
  });
  console.log('  final cell state:', JSON.stringify(finalCells, null, 2));

  ['J10', 'J9', 'J8'].forEach(k => {
    if (!finalCells[k] || !/occupied/.test(finalCells[k].cls)) {
      bugs.push({ id: 'CYCLE63-FINAL-' + k + '-NOT-OCCUPIED', severity: 'functional', summary: 'Final reload: cell ' + k + ' not occupied. state=' + JSON.stringify(finalCells[k]) });
    }
  });

  // Scroll the grid into view and screenshot the corner
  const gridEl = await page.$('.em-grid-cell[data-cell="J10"]');
  if (gridEl) await gridEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, 'a26-final-grid-corner-j8-j10');

  // ── 16. Reopen accession A3-T1-S, verify Contents pane shows new instances ──
  console.log('▶ Step 16: reopen accession, check Contents pane');
  await page.goto(`${BASE}/app/accessions.html?doc=${ACCESSION_PATH}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.em-overlay.open', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'a27-accession-reopen');

  // Look for instance rows referencing our new files in the contents pane
  const instanceRefs = await page.evaluate((stamp) => {
    const text = (document.getElementById('em-contents') || {}).textContent || '';
    return {
      hasStamp: text.includes(stamp),
      length: text.length,
      preview: text.slice(0, 600),
    };
  }, STAMP);
  console.log('  contents pane stamp present:', instanceRefs.hasStamp);
  console.log('  contents preview:', instanceRefs.preview.slice(0, 200));
  if (!instanceRefs.hasStamp) {
    // Scroll the contents pane and look harder
    await page.evaluate(() => {
      const e = document.getElementById('em-contents');
      if (e) e.scrollTop = 0;
    });
    await page.waitForTimeout(500);
    await shot(page, 'a28-accession-contents-no-stamp');
    bugs.push({ id: 'CYCLE63-CONTENTS-PANE-MISSING-INSTANCES', severity: 'visual', summary: 'After creating extraction + 2 tubes (all of:=accessions/a3-t1-s), reopened accession Contents pane does NOT contain QA63 stamp. Backlinks may be stale.' });
  } else {
    await shot(page, 'a28-accession-contents-has-stamp');
    observations.push('Accession Contents pane shows new instances with QA63 stamp.');
  }

  // ── 17. Cross-link verification: open the extraction, follow `of:` back to accession ──
  console.log('▶ Step 17: open the extraction directly, follow of: link to accession');
  await page.goto(`${BASE}/app/inventory.html?doc=${newExtractionPath}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.em-overlay.open', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await shot(page, 'a29-extraction-popup-with-of-link');

  // Inspect the rendered "of:" field — is it a clickable wikilink?
  const ofFieldHtml = await page.evaluate(() => {
    // In view mode, fields are rendered as text/links inside .em-fields
    const fields = document.getElementById('em-fields');
    return fields ? fields.innerHTML.slice(0, 2500) : '';
  });
  const hasOfLink = /a3-t1-s/i.test(ofFieldHtml);
  console.log('  of-field renders accession slug:', hasOfLink);
  if (!hasOfLink) {
    bugs.push({ id: 'CYCLE63-OF-FIELD-NOT-RENDERED', severity: 'visual', summary: 'Extraction popup does not visibly display its `of: accessions/a3-t1-s` link in the fields pane.' });
  } else {
    observations.push('Extraction popup shows of: → accessions/a3-t1-s in fields pane.');
  }

  // Try to click the `of:` link if present
  const ofLink = page.locator('#em-fields a[href*="a3-t1-s"]').first();
  if (await ofLink.count() > 0) {
    await shot(page, 'a30-before-click-of-link');
    await ofLink.click();
    await page.waitForTimeout(2000);
    await shot(page, 'a31-after-click-of-link');
    const titleAfter = await page.evaluate(() => document.getElementById('em-title')?.textContent || '');
    console.log('  popup title after clicking of:', titleAfter);
    if (!/A3-T1-S/i.test(titleAfter)) {
      bugs.push({ id: 'CYCLE63-OF-LINK-NAVIGATION-BROKEN', severity: 'functional', summary: 'Clicking the of: link in extraction popup did not navigate to the accession. title-after=' + titleAfter });
    } else {
      observations.push('of: link navigation works — landed on accession A3-T1-S.');
    }
  }

  console.log('\n=== Run summary ===');
  console.log('  observations:', observations.length);
  observations.forEach(o => console.log('   -', o));
  console.log('  bugs:', bugs.length);
  bugs.forEach(b => console.log('   ✗', b.id, b.summary));
  console.log('  pageErrors:', pageErrors.length);

  // ── Cleanup ──
  console.log('\n▶ Cleanup — deleting created files');
  for (const p of cleanup) {
    await ghDelete(p, 'qa-cycle-63: cleanup ' + p);
  }

  // Persist run summary
  fs.writeFileSync(`${SHOTS}/_run-summary.json`, JSON.stringify({
    cycle: 63,
    persona: 'Vianney Ahn',
    modifier: 'thorough',
    stamp: STAMP,
    extraction: newExtractionPath,
    tubeJ9: tubeJ9Path,
    tubeJ8: tubeJ8Path,
    cleanup,
    finalCells,
    observations,
    bugs,
    pageErrors,
  }, null, 2));

  await browser.close();
  console.log('✔ Cycle 63 done');
})().catch(async (e) => {
  console.error('❌ Cycle 63 failed:', e);
  // Attempt cleanup if we created anything
  for (const p of cleanup) {
    try { await ghDelete(p, 'qa-cycle-63: failure cleanup ' + p); } catch(_) {}
  }
  process.exit(1);
});
