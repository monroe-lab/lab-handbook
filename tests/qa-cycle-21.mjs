// QA cycle 21 — Dr. Monroe (PI) + explorer + "Accession status overhaul + URL edge cases"
// Full lifecycle on one accession: change status across the 5 buckets, cycle priority,
// set status_note, edit multi-person people field via [[ autocomplete.
// Then explorer: URL manipulation — nonexistent accession, bad chars, deep-links.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle21';
const GH_TOKEN = execSync('gh auth token').toString().trim();

function log(...a) { console.log('[cycle21]', ...a); }

async function shot(page, name) {
  const path = `${SHOT_DIR}/${name}.png`;
  try {
    await page.screenshot({ path, fullPage: false });
  } catch (e) {
    log('screenshot failed:', name, e.message);
  }
  return path;
}

async function waitNet(page, ms = 400) {
  try { await page.waitForLoadState('networkidle', { timeout: 2500 }); } catch {}
  await page.waitForTimeout(ms);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const results = { screenshots: [], findings: [], fixes_needed: [] };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  page.on('pageerror', (err) => { log('PAGE ERROR:', err.message); results.findings.push({ kind: 'pageerror', message: err.message }); });
  page.on('console', (m) => { if (m.type() === 'error') { log('CONSOLE ERROR:', m.text()); results.findings.push({ kind: 'console-error', text: m.text() }); } });

  // ── Step 1: land on accessions page, screenshot ─────────────────────────
  log('Step 1: load /app/accessions.html');
  await page.goto(`${BASE}/app/accessions.html`);
  await waitNet(page, 1200);
  results.screenshots.push({ step: 1, path: await shot(page, '01-accessions-initial') });

  // Check framework banner renders.
  const hasBanner = await page.locator('.framework-banner').count();
  log('framework banner present:', hasBanner);
  results.findings.push({ kind: 'check', banner: hasBanner });

  // Check stat card counts before filtering — grab them.
  const statCounts = await page.evaluate(() => ({
    total:     document.getElementById('statTotal')?.textContent,
    active:    document.getElementById('statActive')?.textContent,
    waiting:   document.getElementById('statWaiting')?.textContent,
    storage:   document.getElementById('statStorage')?.textContent,
    completed: document.getElementById('statCompleted')?.textContent,
    archived:  document.getElementById('statArchived')?.textContent,
  }));
  log('stats:', statCounts);
  results.findings.push({ kind: 'stats', counts: statCounts });

  // ── Step 2: cycle each status filter via the stat-card buttons ──────────
  const buckets = ['active','waiting','storage','completed','archived'];
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    log(`Step 2.${i+1}: filter to ${b}`);
    results.screenshots.push({ step: `2.${i+1}-before`, path: await shot(page, `02-${i+1}-before-${b}`) });
    await page.evaluate((bb) => window.setStatusFilter(bb), b);
    await page.waitForTimeout(300);
    results.screenshots.push({ step: `2.${i+1}-after`, path: await shot(page, `02-${i+1}-after-${b}`) });
    // Verify visible row count matches stat card.
    const visibleRows = await page.locator('#tableBody tr').count();
    const statValue = await page.evaluate((bb) => {
      const el = document.getElementById('stat' + bb.charAt(0).toUpperCase() + bb.slice(1));
      return el?.textContent;
    }, b);
    log(`  bucket ${b}: visible=${visibleRows}, stat=${statValue}`);
    if (statValue && visibleRows !== parseInt(statValue, 10)) {
      results.findings.push({ kind: 'count-mismatch', bucket: b, visible: visibleRows, stat: statValue });
    }
  }
  // Clear filter
  await page.evaluate(() => window.setStatusFilter(''));
  await page.waitForTimeout(300);

  // ── Step 3: test priority sort — expect descending (3-stars first) ──────
  log('Step 3: click ★ priority header to sort');
  results.screenshots.push({ step: '3-before', path: await shot(page, '03-before-pri-sort') });
  // Click the priority header
  await page.locator('th').filter({ hasText: /^★$/ }).first().click();
  await page.waitForTimeout(400);
  results.screenshots.push({ step: '3-after', path: await shot(page, '03-after-pri-sort') });
  // Read the first 5 rows' priority
  const topPriorities = await page.evaluate(() => {
    const rows = document.querySelectorAll('#tableBody tr');
    return Array.from(rows).slice(0, 5).map(r => r.querySelector('.pri-stars')?.getAttribute('data-pri'));
  });
  log('top 5 priorities after sort:', topPriorities);
  results.findings.push({ kind: 'priority-sort', top5: topPriorities });
  // If they start with '0' and we have any 3-star rows, that's backwards.
  const hasHighPri = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.pri-stars')).some(el => +el.getAttribute('data-pri') === 3);
  });
  if (hasHighPri && topPriorities[0] === '0') {
    results.fixes_needed.push({ id: 'PRIORITY-SORT-ASCENDING', issue: 'clicking ★ sorts 0-star first when 3-star items exist; should default descending' });
  }

  // ── Step 4: open "Add Accession" modal, inspect for duplicate Species ──
  // Need to be logged in for the Add button — it's gated on Lab.gh.isLoggedIn().
  const isLoggedIn = await page.evaluate(() => window.Lab?.gh?.isLoggedIn?.());
  log('logged in:', isLoggedIn);
  if (isLoggedIn) {
    log('Step 4: open Add modal and check for dup species field');
    await page.waitForSelector('#addBtn', { state: 'visible' });
    results.screenshots.push({ step: '4-before', path: await shot(page, '04-before-add-modal') });
    await page.click('#addBtn');
    await page.waitForTimeout(500);
    results.screenshots.push({ step: '4-after-open', path: await shot(page, '04-after-add-modal-open') });
    const speciesLabels = await page.evaluate(() => {
      const modal = document.getElementById('addModal');
      if (!modal) return [];
      return Array.from(modal.querySelectorAll('label'))
        .map(l => l.textContent.trim())
        .filter(t => /species/i.test(t));
    });
    log('species labels in add modal:', speciesLabels);
    if (speciesLabels.length > 1) {
      results.fixes_needed.push({ id: 'DUP-SPECIES-FIELD-IN-ADD-MODAL', issue: `Add Accession modal has ${speciesLabels.length} Species inputs; only addSpeciesField is saved by confirmAdd — the first one is dead UI.` });
    }
    // Also verify if typing in #addSpecies is persisted (should not be)
    await page.fill('#addSpecies', 'TYPED-INTO-BUG-FIELD');
    await page.fill('#addSpeciesField', 'TYPED-INTO-REAL-FIELD');
    results.screenshots.push({ step: '4-after-fill', path: await shot(page, '04-after-modal-filled') });
    // Close without saving
    await page.click('.modal-close');
    await page.waitForTimeout(400);
  }

  // ── Step 5: pick an "active" accession and open editor ─────────────────
  log('Step 5: filter active, then open first accession');
  await page.evaluate(() => window.setStatusFilter('active'));
  await page.waitForTimeout(400);
  results.screenshots.push({ step: '5-before', path: await shot(page, '05-before-open-accession') });

  const firstAccession = await page.evaluate(() => {
    const rows = document.querySelectorAll('#tableBody tr');
    if (!rows.length) return null;
    const match = rows[0].getAttribute('onclick')?.match(/openAccession\('([^']+)'\)/);
    return match ? match[1] : null;
  });
  log('first active accession slug:', firstAccession);

  if (!firstAccession) {
    log('No active accession to test with. Aborting core flow.');
  } else {
    // Capture original state via API BEFORE we touch anything
    const origFile = await fetch(`https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/accessions/${firstAccession}.md`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' }
    }).then(r => r.json());
    const origContent = Buffer.from(origFile.content, 'base64').toString('utf-8');
    log('original file first 200 chars:\n', origContent.slice(0, 200));
    results.findings.push({ kind: 'original-file', slug: firstAccession, content_head: origContent.slice(0, 400), sha: origFile.sha });

    // Open the editor via the slug
    await page.evaluate((slug) => window.openAccession(slug), firstAccession);
    await page.waitForTimeout(1500);
    results.screenshots.push({ step: '5-after', path: await shot(page, '05-after-editor-open') });

    // ── Step 6: Inline status change from pill dropdown in the table ───────
    // Actually the editor modal is open. Let me close it first, then use the inline pill.
    // Close editor modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Now test inline status pill on the filtered active view
    log('Step 6: change status via inline pill: active → storage');
    results.screenshots.push({ step: '6-before', path: await shot(page, '06-before-status-pill') });
    const changed = await page.evaluate(async (slug) => {
      const sel = document.querySelector(`select.status-pill[onchange*="${slug}"]`);
      if (!sel) return { ok: false, reason: 'no status select found' };
      sel.value = 'storage';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }, firstAccession);
    log('status change dispatch:', changed);
    await page.waitForTimeout(3000); // wait for commit
    results.screenshots.push({ step: '6-after', path: await shot(page, '06-after-status-pill') });

    // Verify persistence via API
    const afterStatusFile = await fetch(`https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/accessions/${firstAccession}.md`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' }
    }).then(r => r.json());
    const afterStatusContent = Buffer.from(afterStatusFile.content, 'base64').toString('utf-8');
    const statusLine = afterStatusContent.match(/^status:\s*(\S+)/m)?.[1];
    log('file status now:', statusLine);
    results.findings.push({ kind: 'status-change-persisted', status: statusLine });
    if (statusLine !== 'storage') {
      results.fixes_needed.push({ id: 'STATUS-PILL-CHANGE-NOT-PERSISTED', issue: `Inline status pill change to 'storage' did not persist to file (still '${statusLine}')` });
    }

    // ── Step 7: cycle priority via star click ─────────────────────────────
    log('Step 7: cycle priority stars');
    // Switch filter to 'storage' since the row moved buckets after the status change.
    await page.evaluate(() => window.setStatusFilter('storage'));
    await page.waitForTimeout(400);
    results.screenshots.push({ step: '7-before', path: await shot(page, '07-before-pri-click') });
    const priClick = await page.evaluate((slug) => {
      const el = document.querySelector(`.pri-stars[data-slug="${slug}"]`);
      if (!el) return { ok: false };
      const before = +el.getAttribute('data-pri');
      el.click();
      return { ok: true, before };
    }, firstAccession);
    log('pri click:', priClick);
    await page.waitForTimeout(3000);
    results.screenshots.push({ step: '7-after-1', path: await shot(page, '07-after-pri-click1') });

    // Click twice more to reach 3
    for (let k = 0; k < 2; k++) {
      await page.evaluate((slug) => {
        const el = document.querySelector(`.pri-stars[data-slug="${slug}"]`);
        if (el) el.click();
      }, firstAccession);
      await page.waitForTimeout(2500);
    }
    results.screenshots.push({ step: '7-after-3', path: await shot(page, '07-after-pri-click3') });

    // Verify priority in file
    const afterPriFile = await fetch(`https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/accessions/${firstAccession}.md`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' }
    }).then(r => r.json());
    const afterPriContent = Buffer.from(afterPriFile.content, 'base64').toString('utf-8');
    const priLine = afterPriContent.match(/^priority:\s*['"]?(\d)['"]?/m)?.[1];
    log('file priority now:', priLine);
    results.findings.push({ kind: 'priority-persisted', priority: priLine });

    // ── Step 8: restore original via direct PUT ───────────────────────────
    log('Step 8: restore original accession content');
    const restoreRes = await fetch(`https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/accessions/${firstAccession}.md`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({
        message: `qa-cycle-21: restore ${firstAccession} after QA lifecycle test`,
        content: Buffer.from(origContent, 'utf-8').toString('base64'),
        sha: afterPriFile.sha,
      }),
    }).then(r => r.json());
    log('restore result:', restoreRes.commit?.sha?.slice(0, 7));
    results.findings.push({ kind: 'restore', commit: restoreRes.commit?.sha });
  }

  // ── Step 9: explorer mode — URL manipulation ─────────────────────────────
  log('Step 9a: deep-link a nonexistent accession');
  await page.goto(`${BASE}/app/wiki.html?doc=accessions/this-slug-does-not-exist-qa21`);
  await waitNet(page, 900);
  results.screenshots.push({ step: '9a', path: await shot(page, '09a-nonexistent-accession') });

  log('Step 9b: deep-link with HTML characters');
  await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent('accessions/<script>alert(1)</script>')}`);
  await waitNet(page, 900);
  results.screenshots.push({ step: '9b', path: await shot(page, '09b-html-in-doc-param') });

  log('Step 9c: deep-link with path traversal attempt');
  await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent('../../etc/passwd')}`);
  await waitNet(page, 900);
  results.screenshots.push({ step: '9c', path: await shot(page, '09c-path-traversal') });

  log('Step 9d: deep-link to an existing accession (sanity)');
  // Use the first accession slug we saw (now restored) if we had one
  if (firstAccession) {
    await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent('accessions/' + firstAccession)}`);
    await waitNet(page, 1200);
    results.screenshots.push({ step: '9d', path: await shot(page, '09d-real-accession-wiki') });
  }

  log('Step 9e: empty doc param');
  await page.goto(`${BASE}/app/wiki.html?doc=`);
  await waitNet(page, 900);
  results.screenshots.push({ step: '9e', path: await shot(page, '09e-empty-doc') });

  log('Step 9f: accessions with a weird filter via URL');
  await page.goto(`${BASE}/app/accessions.html#bogus`);
  await waitNet(page, 900);
  results.screenshots.push({ step: '9f', path: await shot(page, '09f-hash-fragment') });

  // ── Step 10: 12-tab nav and '+' overflow at 1024px ────────────────────────
  log('Step 10: narrow viewport to test top nav overflow');
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 1000);
  results.screenshots.push({ step: '10a', path: await shot(page, '10a-nav-1024') });
  // check for '+' overflow button
  const overflowBtn = await page.locator('button,a').filter({ hasText: /^\s*\+\s*$/ }).count();
  const moreBtn = await page.locator('.nav-more, [data-nav-overflow], [aria-label="More"], button[title*="More" i]').count();
  log('overflow markers:', { plusBtns: overflowBtn, moreBtns: moreBtn });
  results.findings.push({ kind: 'nav-overflow', plusBtns: overflowBtn, moreBtns: moreBtn });
  // Try clicking the overflow button
  const tried = await page.evaluate(() => {
    const btn = document.querySelector('.nav-more, [data-nav-overflow], button[title*="More" i]') ||
                Array.from(document.querySelectorAll('nav button, nav a, .top-nav button, .top-nav a')).find(b => b.textContent.trim() === '+');
    if (btn) { btn.click(); return { clicked: true, tag: btn.tagName, cls: btn.className }; }
    return { clicked: false };
  });
  log('overflow click:', tried);
  await page.waitForTimeout(400);
  results.screenshots.push({ step: '10b', path: await shot(page, '10b-nav-overflow-open') });

  // ── Step 11: mobile bottom-bar on 375x812 ────────────────────────────────
  log('Step 11: mobile bottom bar');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 1200);
  results.screenshots.push({ step: '11', path: await shot(page, '11-mobile-bottom-bar') });

  // Save all results
  fs.writeFileSync(`${SHOT_DIR}/_results.json`, JSON.stringify(results, null, 2));
  log('done. shots:', results.screenshots.length, 'findings:', results.findings.length, 'fixes_needed:', results.fixes_needed.length);
  await browser.close();
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
