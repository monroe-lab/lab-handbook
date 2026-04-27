/**
 * QA Cycle 64
 * Persona: Jordan Park (postdoc, protocol-focused)
 * Modifier: confused (clicks wrong things, types unclear name, double-saves)
 * Scenario: Rename + relink day
 *
 * The protocols app exposes a real "Rename" button. Clicking it pops a
 * Lab.modal.prompt asking for a new title. If the new slug differs from the
 * old, the app:
 *   1. Saves the file at the new slug, deletes the old one
 *   2. Updates the in-memory NAV + objectIndex + linkIndex patches
 *   3. Sweeps every other file that wikilinks to the old slug and rewrites
 *      `[[old-slug]]` and `[[dir/old-slug]]` → `[[new-slug]]`
 *
 * Confused-mode wrinkles:
 *   • Open Rename, hit Cancel without typing → no-op, file unchanged
 *   • Open Rename, type a title with punctuation + slash + ampersand + em-dash;
 *     slugify should normalize cleanly, no double-slug crash, no failed PUT
 *   • Try double-clicking the Rename button — `renameInFlight` should prevent
 *     a second prompt or 404 toast
 *   • Verify the inbound wikilink in a referring notebook entry got rewritten
 *     to the new slug — and renders with the NEW title in its pill
 *
 * Cleanup at end: deletes whatever path the protocol ended up at + the
 * notebook entry. Since rename moves the protocol, we track the *current*
 * path in a mutable ref.
 *
 * Screenshots BEFORE+AFTER every meaningful action. Each Read + evaluated.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle64';
fs.mkdirSync(SHOTS, { recursive: true });

const STAMP = Date.now().toString(36);
const ORIG_SLUG = `wet-lab/qa64-original-protocol-${STAMP}`;
const ORIG_PATH = `docs/${ORIG_SLUG}.md`;
const NOTE_SLUG = `notebooks/vianney-ahn/qa64-rename-test-${STAMP}`;
const NOTE_PATH = `docs/${NOTE_SLUG}.md`;
const ORIGINAL_TITLE = `QA64 Original Protocol ${STAMP}`;
const WEIRD_TITLE = `QA64 Renamed!! /yolo & "friends" — round 1 ${STAMP}`;
const FINAL_TITLE = `QA64 Final Renamed Protocol ${STAMP}`;

let stepN = 0;
async function shot(page, label) {
  stepN++;
  const path = `${SHOTS}/step${String(stepN).padStart(2, '0')}-${label}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log('  📸', path);
  return path;
}

async function ghPut(path, body, message) {
  const payload = { message, content: Buffer.from(body, 'utf-8').toString('base64'), branch: 'main' };
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status} ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=main`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function ghDelete(path, message) {
  const meta = await ghGet(path);
  if (!meta) {
    console.log(`  ⚠ cleanup ${path}: not found`);
    return;
  }
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha: meta.sha, branch: 'main' }),
  });
  if (!res.ok) console.log(`  ⚠ cleanup ${path}: DELETE → ${res.status} ${(await res.text()).slice(0, 200)}`);
  else console.log(`  🧹 deleted ${path}`);
}

// Slugify must match Lab.slugify() in app/js/shared.js
function slugify(name) {
  let s = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-');
  if (s.length > 80) s = s.slice(0, 80).replace(/-+$/, '');
  return s;
}

const cleanup = new Set(); // mutable: rename moves files, so track current path
const observations = [];
const bugs = [];
let pageErrors = [];

(async () => {
  console.log('▶ Cycle 64 — Jordan Park × confused × Rename + Relink');

  // ── Seed two files via GitHub API ──
  console.log('▶ Seed: protocol + notebook entry');
  const protoBody =
    `---\n` +
    `title: "${ORIGINAL_TITLE}"\n` +
    `type: protocol\n` +
    `---\n\n` +
    `# ${ORIGINAL_TITLE}\n\n` +
    `Disposable QA64 protocol used to test the rename + relink flow.\n\n` +
    `## Materials\n\n` +
    `- Sterile water\n- Pipette tips\n\n` +
    `## Steps\n\n` +
    `1. Mix\n2. Incubate\n3. Done\n`;
  await ghPut(ORIG_PATH, protoBody, `qa-cycle-64: seed protocol ${ORIG_SLUG}`);
  cleanup.add(ORIG_PATH);

  const noteBody =
    `---\n` +
    `title: "QA64 Rename Test Notebook ${STAMP}"\n` +
    `type: notebook\n` +
    `---\n\n` +
    `# QA64 Rename Test Notebook ${STAMP}\n\n` +
    `**Person:** Vianney Ahn\n\n` +
    `**Date:** 2026-04-27\n\n` +
    `## Plan\n\n` +
    `Today I am following the [[${ORIG_SLUG}]] protocol while QA tests its rename behavior.\n\n` +
    `Reference: [[${ORIG_SLUG}]] (used twice on purpose, to confirm both pills update).\n`;
  await ghPut(NOTE_PATH, noteBody, `qa-cycle-64: seed notebook ${NOTE_SLUG}`);
  cleanup.add(NOTE_PATH);

  console.log('▶ Wait 6s for GitHub eventual consistency on tree reads');
  await new Promise(r => setTimeout(r, 6000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // Pre-populate auth + localStorage patches so the seeded files are visible
  // to fetchObjectIndex/fetchLinkIndex without waiting for a deploy. Without
  // this, the wikilink sweep in renameDoc has no edges to rewrite (the
  // prebuilt link-index.json doesn't know about the just-PUT notebook yet).
  // This mirrors what the editor's patchObjectIndex/patchLinkIndex would do
  // when a real user creates a file via the UI.
  const seedData = {
    token: GH_TOKEN,
    now: Date.now(),
    origSlug: ORIG_SLUG,
    origTitle: ORIGINAL_TITLE,
    noteSlug: NOTE_SLUG,
    noteTitle: `QA64 Rename Test Notebook ${STAMP}`,
  };
  await context.addInitScript((d) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', d.token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
    // addInitScript runs on EVERY navigation. Only seed patches if no patches
    // exist yet — otherwise we'd clobber the rename's freshly-written
    // patchObjectIndex / patchLinkIndex entries on the next page load.
    // Use ".md" suffix on patch keys to match how the live patchObjectIndex
    // stores them (path includes .md). Mismatched key forms make the patches
    // invisible to applyLocalPatches' findIndex check.
    if (!localStorage.getItem('lab_index_patches')) {
      const objPatches = {};
      objPatches[d.origSlug + '.md'] = { _at: d.now, path: d.origSlug + '.md', title: d.origTitle, type: 'protocol' };
      objPatches[d.noteSlug + '.md'] = { _at: d.now, path: d.noteSlug + '.md', title: d.noteTitle, type: 'notebook' };
      localStorage.setItem('lab_index_patches', JSON.stringify(objPatches));
    }
    if (!localStorage.getItem('lab_link_index_patches')) {
      const linkPatches = {};
      linkPatches[d.noteSlug] = { targets: [d.origSlug] };
      localStorage.setItem('lab_link_index_patches', JSON.stringify(linkPatches));
    }
  }, seedData);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text().slice(0, 240);
      pageErrors.push(text);
      console.log('  PAGE-ERR:', text);
    }
  });

  // Helper: wait for inline-rendered doc on protocols/notebook apps.
  async function waitForRenderedDoc() {
    await page.waitForSelector('#renderedDoc', { timeout: 20000 });
    // pills haven't necessarily resolved yet, so wait a bit
    await page.waitForTimeout(1000);
  }

  try {

  // ── 1. Open notebook page — verify wikilink renders as pill with ORIGINAL title.
  console.log('▶ Step 1: open notebook entry, verify baseline pills');
  await page.goto(`${BASE}/app/notebooks.html?doc=${encodeURIComponent(NOTE_SLUG)}`, { waitUntil: 'networkidle' });
  await waitForRenderedDoc();
  await page.waitForFunction(() => {
    const pills = document.querySelectorAll('#renderedDoc a.object-pill');
    return pills.length >= 2;
  }, null, { timeout: 15000 }).catch(() => {});
  await shot(page, 'a01-notebook-baseline');

  const pillsBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#renderedDoc a.object-pill')).map(p => ({
      href: p.getAttribute('href') || '',
      text: (p.textContent || '').trim(),
    }));
  });
  console.log('  pills before rename:', JSON.stringify(pillsBefore));
  observations.push(`Pills before rename: ${JSON.stringify(pillsBefore)}`);
  if (pillsBefore.length < 2) {
    bugs.push({ id: 'CYCLE64-BASELINE-PILLS-MISSING', severity: 'functional', summary: `Expected 2 pills on notebook baseline, got ${pillsBefore.length}: ${JSON.stringify(pillsBefore)}` });
  }
  if (!pillsBefore.every(p => p.text.includes('Original'))) {
    bugs.push({ id: 'CYCLE64-BASELINE-PILL-WRONG-TITLE', severity: 'visual', summary: `Pill before rename did not show "Original". got: ${JSON.stringify(pillsBefore)}` });
  }

  // ── 2. Open the protocol via protocols.html ──
  console.log('▶ Step 2: open the protocol in protocols app');
  await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(ORIG_SLUG)}`, { waitUntil: 'networkidle' });
  await waitForRenderedDoc();
  await shot(page, 'a02-protocol-loaded');

  // Verify the Rename button is visible (logged-in)
  const renameBtnVisible = await page.locator('button:has-text("Rename")').isVisible().catch(() => false);
  console.log('  Rename button visible:', renameBtnVisible);
  if (!renameBtnVisible) {
    bugs.push({ id: 'CYCLE64-RENAME-BTN-MISSING', severity: 'functional', summary: 'Rename button not visible on logged-in protocol page.' });
  }

  // Confirm breadcrumb shows the original slug
  const breadcrumbBefore = await page.locator('.breadcrumb').first().textContent().catch(() => '');
  console.log('  breadcrumb before rename:', breadcrumbBefore);
  if (!breadcrumbBefore.includes(ORIG_SLUG)) {
    bugs.push({ id: 'CYCLE64-BREADCRUMB-WRONG', severity: 'visual', summary: `Protocol breadcrumb did not contain ${ORIG_SLUG}. got=${breadcrumbBefore}` });
  }

  // ── 3. Confused: click Rename, hit Cancel without typing. File should be unchanged. ──
  console.log('▶ Step 3: click Rename, then Cancel');
  await page.click('button:has-text("Rename")');
  await page.waitForSelector('.lab-modal-input', { timeout: 8000 });
  await page.waitForTimeout(300);
  await shot(page, 'a03-rename-modal-open');

  const promptDefault = await page.locator('.lab-modal-input').inputValue();
  console.log('  prompt defaultValue:', promptDefault);
  // The prompt should default to the existing slug (per renameDoc impl, it uses
  // currentDoc.split('/').pop() then NAV title if found). For a brand-new file
  // not yet in NAV (since we seeded via API) it'll fall back to the slug.
  // Either is acceptable.

  await page.click('.lab-modal-cancel');
  await page.waitForTimeout(600);
  await shot(page, 'a04-after-cancel');

  // Confirm file still exists at original path
  const stillThere = await ghGet(ORIG_PATH);
  if (!stillThere) {
    bugs.push({ id: 'CYCLE64-CANCEL-DELETED-FILE', severity: 'functional', summary: 'Cancel on rename modal deleted the file.' });
  } else {
    observations.push('Cancel on rename: file unchanged ✓');
  }

  // ── 4. Click Rename, type WEIRD title, then OK. ──
  console.log('▶ Step 4: rename to a punctuation-heavy title');
  await page.click('button:has-text("Rename")');
  await page.waitForSelector('.lab-modal-input', { timeout: 8000 });
  await page.waitForTimeout(200);
  await page.locator('.lab-modal-input').fill(WEIRD_TITLE);
  await shot(page, 'a05-weird-title-typed');

  // The protocols app's renameDoc creates new file (PUT) then deletes old (DELETE).
  // Watch for the PUT that creates the new path.
  const expectedWeirdSlug = slugify(WEIRD_TITLE);
  const expectedWeirdPath = `docs/wet-lab/${expectedWeirdSlug}.md`;
  console.log('  expected weird slug:', expectedWeirdSlug);
  console.log('  expected weird path:', expectedWeirdPath);

  const putWeird = page.waitForResponse(
    (resp) => resp.url().includes(`/contents/${expectedWeirdPath}`) && resp.request().method() === 'PUT',
    { timeout: 25000 },
  );

  // Confused: double-click OK. The renameInFlight guard should kick in.
  await page.click('.lab-modal-ok');
  // Try a second click — normally the modal is gone by now, but force it through
  await page.click('.lab-modal-ok', { force: true, timeout: 1000 }).catch(() => {});
  const putWeirdResp = await putWeird;
  console.log('  PUT weird status:', putWeirdResp.status());

  await page.waitForTimeout(2500);
  await shot(page, 'a06-after-weird-rename');

  // Verify breadcrumb updated
  const breadcrumbAfterWeird = await page.locator('.breadcrumb').first().textContent().catch(() => '');
  console.log('  breadcrumb after weird:', breadcrumbAfterWeird);
  const expectedWeirdDocPath = `wet-lab/${expectedWeirdSlug}`;
  if (!breadcrumbAfterWeird.includes(expectedWeirdSlug)) {
    bugs.push({ id: 'CYCLE64-BREADCRUMB-NOT-UPDATED', severity: 'visual', summary: `Breadcrumb did not update to new slug. expected to contain ${expectedWeirdSlug}, got=${breadcrumbAfterWeird}` });
  }

  // GitHub state: new file should exist at expectedWeirdPath, old file gone.
  const newWeirdFile = await ghGet(expectedWeirdPath);
  const oldFile = await ghGet(ORIG_PATH);
  if (!newWeirdFile) {
    bugs.push({ id: 'CYCLE64-NEW-FILE-MISSING', severity: 'functional', summary: `After rename, new file not at ${expectedWeirdPath}` });
  } else {
    observations.push(`Rename created new file at ${expectedWeirdPath} ✓`);
    cleanup.add(expectedWeirdPath); // track for cleanup
  }
  if (oldFile) {
    bugs.push({ id: 'CYCLE64-OLD-FILE-NOT-DELETED', severity: 'functional', summary: `After rename, old file at ${ORIG_PATH} was not deleted.` });
  } else {
    observations.push(`Rename deleted old file at ${ORIG_PATH} ✓`);
    cleanup.delete(ORIG_PATH); // already gone
  }

  if (newWeirdFile) {
    const rawNew = Buffer.from(newWeirdFile.content, 'base64').toString('utf-8');
    // YAML escapes backslashed inner quotes. Compare against the buildFrontmatter
    // form, which double-escapes embedded `"` to `\"`.
    const yamlEscWeird = WEIRD_TITLE.replace(/"/g, '\\"');
    if (!rawNew.includes(yamlEscWeird) && !rawNew.includes(WEIRD_TITLE)) {
      bugs.push({ id: 'CYCLE64-NEW-TITLE-NOT-PERSISTED', severity: 'functional', summary: `New file frontmatter does not contain WEIRD_TITLE. raw: ${rawNew.slice(0, 300)}` });
    }
    if (!rawNew.includes('# ' + WEIRD_TITLE)) {
      // The H1 rewrite might miss if old title contained regex special chars.
      // Original title was clean so the H1 should have been replaced.
      bugs.push({ id: 'CYCLE64-H1-NOT-REWRITTEN', severity: 'visual', summary: `H1 in body not updated to new title after rename. body slice: ${rawNew.slice(0, 400)}` });
    }
  }

  // ── 5. Wait for the background updateWikilinksAfterRename sweep to finish.
  //   It re-PUTs every referrer file. Watch for either a toast or a settled state.
  console.log('▶ Step 5: wait for background wikilink sweep on referrer files');
  // Poll the notebook file until its body contains the new slug or 15s passes.
  let sweepDone = false;
  let noteRaw = '';
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const noteFile = await ghGet(NOTE_PATH);
    if (!noteFile) break;
    noteRaw = Buffer.from(noteFile.content, 'base64').toString('utf-8');
    if (noteRaw.includes(`[[${expectedWeirdSlug}]]`) || noteRaw.includes(`[[wet-lab/${expectedWeirdSlug}]]`)) {
      sweepDone = true;
      console.log(`  sweep finished after ${i + 1}s`);
      break;
    }
  }
  if (!sweepDone) {
    bugs.push({ id: 'CYCLE64-WIKILINK-SWEEP-NOT-PERFORMED', severity: 'functional', summary: `Background wikilink sweep did not rewrite [[${ORIG_SLUG}]] → [[${expectedWeirdSlug}]] in notebook ${NOTE_SLUG} within 15s. Notebook raw: ${noteRaw.slice(0, 400)}` });
  } else {
    observations.push(`Wikilink sweep rewrote notebook references to new slug ✓`);
  }

  // ── 6. Reload notebook page — pill should resolve and show new (weird) title.
  console.log('▶ Step 6: reload notebook page, verify pill picks up new title');
  await page.evaluate(() => {
    // Clear caches so the in-memory localStorage patches don't mask a real bug.
    if (window.Lab && window.Lab.gh) {
      if (window.Lab.gh.clearObjectIndexCache) window.Lab.gh.clearObjectIndexCache();
    }
  });
  await page.goto(`${BASE}/app/notebooks.html?doc=${encodeURIComponent(NOTE_SLUG)}`, { waitUntil: 'networkidle' });
  await waitForRenderedDoc();
  await page.waitForFunction(() => document.querySelectorAll('#renderedDoc a.object-pill').length >= 1, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, 'a07-notebook-after-weird-rename');

  const pillsAfterWeird = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#renderedDoc a.object-pill')).map(p => ({
      href: p.getAttribute('href') || '',
      text: (p.textContent || '').trim(),
    }));
  });
  console.log('  pills after weird rename:', JSON.stringify(pillsAfterWeird));
  observations.push(`Pills after weird rename: ${JSON.stringify(pillsAfterWeird)}`);
  if (pillsAfterWeird.length === 0) {
    bugs.push({ id: 'CYCLE64-PILLS-LOST-AFTER-RENAME', severity: 'functional', summary: 'Notebook lost both pills after rename.' });
  } else {
    // Each pill href should reference the NEW slug (or its bare form)
    const stillPointsAtOld = pillsAfterWeird.some(p => p.href.includes(ORIG_SLUG));
    if (stillPointsAtOld) {
      bugs.push({ id: 'CYCLE64-PILL-HREF-NOT-REWRITTEN', severity: 'functional', summary: `Pill href still points at old slug after sweep: ${JSON.stringify(pillsAfterWeird)}` });
    }
    const wrongTitle = pillsAfterWeird.filter(p => !p.text.includes('Renamed') && !p.text.includes('round 1'));
    if (wrongTitle.length) {
      bugs.push({ id: 'CYCLE64-PILL-TEXT-WRONG', severity: 'visual', summary: `Pill text didn't update to new title (expected to contain "Renamed" or "round 1"). got: ${JSON.stringify(pillsAfterWeird)}` });
    }
  }

  // ── 7. Click the pill → should land on the renamed protocol's page.
  if (pillsAfterWeird.length > 0) {
    console.log('▶ Step 7: click pill to navigate');
    await page.click(`#renderedDoc a.object-pill`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await shot(page, 'a08-after-pill-nav');
    const urlAfterNav = page.url();
    console.log('  url after pill click:', urlAfterNav);
    if (!urlAfterNav.includes(expectedWeirdSlug)) {
      bugs.push({ id: 'CYCLE64-PILL-NAV-WRONG-URL', severity: 'functional', summary: `Pill click landed at unexpected url. expected to contain ${expectedWeirdSlug}, got=${urlAfterNav}` });
    }
  }

  // ── 8. Rename a SECOND time to a clean final title. ──
  // (We're already on the protocols page from step 7, OR re-navigate.)
  console.log('▶ Step 8: rename to final clean title');
  if (!page.url().includes('protocols.html')) {
    await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(`wet-lab/${expectedWeirdSlug}`)}`, { waitUntil: 'networkidle' });
    await waitForRenderedDoc();
  }
  await shot(page, 'a09-protocol-before-final-rename');

  await page.click('button:has-text("Rename")');
  await page.waitForSelector('.lab-modal-input', { timeout: 8000 });
  await page.locator('.lab-modal-input').fill(FINAL_TITLE);
  await shot(page, 'a10-final-title-typed');

  const expectedFinalSlug = slugify(FINAL_TITLE);
  const expectedFinalPath = `docs/wet-lab/${expectedFinalSlug}.md`;
  console.log('  expected final path:', expectedFinalPath);

  const putFinal = page.waitForResponse(
    (resp) => resp.url().includes(`/contents/${expectedFinalPath}`) && resp.request().method() === 'PUT',
    { timeout: 25000 },
  );
  await page.click('.lab-modal-ok');
  await putFinal;
  await page.waitForTimeout(2500);
  await shot(page, 'a11-after-final-rename');

  // Wait for sweep to update the notebook again
  let finalSweepDone = false;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const noteFile = await ghGet(NOTE_PATH);
    if (!noteFile) break;
    const raw = Buffer.from(noteFile.content, 'base64').toString('utf-8');
    if (raw.includes(`[[${expectedFinalSlug}]]`) || raw.includes(`[[wet-lab/${expectedFinalSlug}]]`)) {
      finalSweepDone = true;
      console.log(`  final sweep finished after ${i + 1}s`);
      break;
    }
  }
  if (!finalSweepDone) {
    bugs.push({ id: 'CYCLE64-FINAL-SWEEP-FAILED', severity: 'functional', summary: `Final rename did not propagate to notebook within 15s.` });
  }

  // Update cleanup tracking — old weird file should be gone
  cleanup.delete(`docs/wet-lab/${expectedWeirdSlug}.md`);
  cleanup.add(expectedFinalPath);

  // ── 9. Reload notebook → final pills should show FINAL title.
  console.log('▶ Step 9: final notebook check');
  await page.goto(`${BASE}/app/notebooks.html?doc=${encodeURIComponent(NOTE_SLUG)}`, { waitUntil: 'networkidle' });
  await waitForRenderedDoc();
  await page.waitForFunction(() => document.querySelectorAll('#renderedDoc a.object-pill').length >= 1, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, 'a12-notebook-final');

  const pillsFinal = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#renderedDoc a.object-pill')).map(p => ({
      href: p.getAttribute('href') || '',
      text: (p.textContent || '').trim(),
    }));
  });
  console.log('  pills final:', JSON.stringify(pillsFinal));
  observations.push(`Pills final: ${JSON.stringify(pillsFinal)}`);
  if (!pillsFinal.every(p => /Final/i.test(p.text))) {
    bugs.push({ id: 'CYCLE64-FINAL-PILL-WRONG-TITLE', severity: 'visual', summary: `Final pill text didn't include "Final". got: ${JSON.stringify(pillsFinal)}` });
  }

  // ── 10. Re-open the renamed protocol and verify backlinks pane lists the notebook. ──
  // Protocols app doesn't have a backlinks pane (the em-overlay does, but
  // protocols renders inline). Instead, we can verify via fetchLinkIndex
  // patches in localStorage that the edge points at the new slug.
  console.log('▶ Step 10: verify link-index patches reflect rewritten edges');
  const linkIdxState = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('lab_link_index_patches');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return { err: e.message }; }
  });
  console.log('  link-index patches keys:', linkIdxState ? Object.keys(linkIdxState).slice(0, 10) : null);
  observations.push(`link-index patches snapshot: ${JSON.stringify(linkIdxState).slice(0, 400)}`);

  // ── 11. Open the renamed protocol (em-overlay path) to check backlinks pane.
  // Inventory.html opens any object via doc=path and shows the em-overlay.
  // But protocols are typically not opened that way; their "popup" is the
  // protocols app's inline page. The em-overlay backlinks pane is for
  // non-location, non-container concept types — protocol is a concept-ish
  // type. Let's see if we can trigger the em-overlay for it from another page.
  console.log('▶ Step 11: try to open backlinks pane via wiki page (em-overlay)');
  await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent(`wet-lab/${expectedFinalSlug}`)}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);
  await shot(page, 'a13-wiki-page-after-rename');

  const overlayOpen = await page.locator('.em-overlay.open').count();
  if (overlayOpen > 0) {
    const backlinkRows = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.em-backlink-row[data-slug]')).map(r => ({
        slug: r.getAttribute('data-slug'),
      }));
    });
    console.log('  em-overlay backlinks:', JSON.stringify(backlinkRows));
    observations.push(`em-overlay backlinks for renamed protocol: ${JSON.stringify(backlinkRows)}`);
    if (!backlinkRows.some(r => r.slug && r.slug.includes(NOTE_SLUG))) {
      bugs.push({ id: 'CYCLE64-EM-OVERLAY-BACKLINK-MISSING', severity: 'functional', summary: `em-overlay backlinks pane on renamed protocol did not list notebook ${NOTE_SLUG}. rows=${JSON.stringify(backlinkRows)}` });
    }
  } else {
    observations.push('Wiki page did not open em-overlay popup for the protocol — protocols handle inline.');
  }

  } catch (err) {
    console.error('  ✗ test crashed:', err && err.stack || err);
    bugs.push({ id: 'CYCLE64-CRASH', severity: 'test-infra', summary: `Test threw: ${err && err.message}` });
    try { await shot(page, 'crash'); } catch(e) {}
  } finally {
    // ── Cleanup ──
    console.log('▶ Cleanup');
    for (const p of cleanup) {
      await ghDelete(p, `qa-cycle-64: cleanup ${p}`);
    }
    await browser.close();
  }

  console.log('\n=== CYCLE 64 SUMMARY ===');
  console.log('Bugs:', bugs.length);
  for (const b of bugs) console.log('  -', b.id, '(', b.severity, '):', b.summary);
  console.log('Observations:', observations.length);
  for (const o of observations) console.log('  -', o);
  console.log('Page errors:', pageErrors.length);
  for (const e of pageErrors) console.log('  -', e);
  console.log('Screenshots:', stepN);

  fs.writeFileSync(`${SHOTS}/summary.json`, JSON.stringify({
    cycle: 64,
    persona: 'Jordan Park',
    modifier: 'confused',
    bugs, observations, pageErrors,
    screenshots_count: stepN,
    orig_path: ORIG_PATH,
    weird_title: WEIRD_TITLE,
    final_title: FINAL_TITLE,
  }, null, 2));

  process.exit(bugs.length > 0 ? 1 : 0);
})();
