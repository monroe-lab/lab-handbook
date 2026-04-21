// qa-cycle-10: Alex Chen + ui_critic + "Equipment move day"
//
// Scenario: Postdoc creates 3 QA test bottles parented to cabinet-flammable,
// then uses the editor's locations picker to move all 3 to cabinet-corrosive.
// Verifies that:
//  - The bottle's own popup breadcrumb / parent pill updates to the new chain
//  - The OLD parent (cabinet-flammable) popup loses the bottle from Contents
//  - The NEW parent (cabinet-corrosive) popup gains it
//  - The Lab Map tree filtered by RUN tag shows all 3 under the new cabinet
//
// ui_critic = before/after screenshots for every meaningful state change.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle10';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const REPO = 'monroe-lab/lab-handbook';
const RUN = 'qa10move' + Math.random().toString(36).slice(2, 6);
const log = [];

fs.mkdirSync(SHOT_DIR, { recursive: true });

async function shot(page, name) {
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log('  📸', name);
  return p;
}

async function gh(urlPath, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      'User-Agent': 'qa-cycle-10',
      Accept: 'application/vnd.github+json',
    },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const r = await fetch(`https://api.github.com${urlPath}`, opts);
  return r;
}

async function createBottleViaGh(slug, title, parent) {
  const path = `docs/stocks/${slug}.md`;
  const body = `---\ntype: bottle\ntitle: ${title}\nparent: ${parent}\nof: resources/ethanol-absolute\nquantity: 1\nunit: bottle\n---\n\nQA-10 test bottle.\n`;
  const r = await gh(`/repos/${REPO}/contents/${path}`, 'PUT', {
    message: `qa-cycle-10: seed ${slug}`,
    content: Buffer.from(body, 'utf-8').toString('base64'),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Failed to create ${slug}: ${r.status} ${txt.slice(0, 200)}`);
  }
  const j = await r.json();
  return { path, sha: j.content.sha };
}

async function deleteFileViaGh(filepath) {
  const r1 = await gh(`/repos/${REPO}/contents/${filepath}`);
  if (!r1.ok) return;
  const j = await r1.json();
  const r = await gh(`/repos/${REPO}/contents/${filepath}`, 'DELETE', {
    message: `qa-cycle-10: cleanup ${filepath}`,
    sha: j.sha,
  });
  return r.ok;
}

const BOTTLES = [
  { slug: `bottle-${RUN}-a`, title: `QA10 Move Test A (${RUN})` },
  { slug: `bottle-${RUN}-b`, title: `QA10 Move Test B (${RUN})` },
  { slug: `bottle-${RUN}-c`, title: `QA10 Move Test C (${RUN})` },
];
const SOURCE = 'locations/cabinet-flammable';
const DEST = 'locations/cabinet-corrosive';

async function main() {
  console.log('\n=== QA Cycle 10: Alex Chen + ui_critic + Equipment move day ===');
  console.log('RUN tag:', RUN);

  // ── Seed: create 3 bottles on cabinet-flammable via gh API ──
  console.log('\n[seed] Creating 3 QA bottles on cabinet-flammable via gh API…');
  const seeded = [];
  for (const b of BOTTLES) {
    const res = await createBottleViaGh(b.slug, b.title, SOURCE);
    seeded.push({ ...b, ...res });
    console.log('  +', b.slug);
  }
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('    [console.error]', msg.text().slice(0, 200));
  });

  // Helper: open a popup via Lab.editorModal.open and wait for the title to render
  async function openByPath(p, expectTitleSubstr) {
    await page.evaluate((path) => {
      if (window.Lab && window.Lab.editorModal && window.Lab.editorModal.open) {
        window.Lab.editorModal.open(path);
      } else {
        throw new Error('Lab.editorModal.open unavailable');
      }
    }, p);
    // Wait until the title element is no longer "Loading..." and matches expected
    await page.waitForFunction(({ expect }) => {
      const t = document.getElementById('em-title');
      if (!t || !t.textContent || t.textContent === 'Loading...') return false;
      if (expect && t.textContent.toLowerCase().indexOf(expect.toLowerCase()) === -1) return false;
      return true;
    }, { expect: expectTitleSubstr || '' }, { timeout: 10000 });
    await page.waitForTimeout(400);
  }

  // Helper: close popup via the X button (no Escape — Escape may misfire)
  async function closePopup() {
    await page.evaluate(() => {
      const btn = document.getElementById('em-close') || document.getElementById('em-cancel');
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
  }

  async function snapshotPopupContents() {
    return await page.evaluate(() => {
      const ov = document.querySelector('.em-overlay.open, .lab-modal-overlay');
      if (!ov) return { present: false };
      const title = document.getElementById('em-title')?.textContent.trim() || '';
      const childRows = Array.from(ov.querySelectorAll('.em-child-row'));
      const titles = childRows.map(el => {
        const t = el.querySelector('.ec-title');
        return (t || el).textContent.trim();
      }).filter(Boolean);
      return {
        present: true,
        popupTitle: title,
        contentsCount: titles.length,
        sample: titles.slice(0, 8),
        qaTitles: titles.filter(t => /QA10/i.test(t)),
      };
    });
  }

  // ── 01: Inventory baseline ──
  console.log('\n[01] Inventory baseline');
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await shot(page, 'step01-inventory-baseline.png');

  // ── 02: Lab Map baseline ──
  console.log('[02] Lab Map baseline');
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await shot(page, 'step02-labmap-baseline.png');

  // ── 03: Cabinet-flammable popup BEFORE moves ──
  console.log('[03] Cabinet-flammable popup BEFORE moves');
  await openByPath('docs/' + SOURCE + '.md', 'Flammable Cabinet');
  await shot(page, 'step03-flammable-before-moves.png');
  const flamBefore = await snapshotPopupContents();
  log.push({ step: 'flammable-before', ...flamBefore });
  console.log('  flammable BEFORE:', flamBefore);
  await closePopup();

  // ── 04: Cabinet-corrosive popup BEFORE moves ──
  console.log('[04] Cabinet-corrosive popup BEFORE moves');
  await openByPath('docs/' + DEST + '.md', 'Corrosive Cabinet');
  await shot(page, 'step04-corrosive-before-moves.png');
  const corrBefore = await snapshotPopupContents();
  log.push({ step: 'corrosive-before', ...corrBefore });
  console.log('  corrosive BEFORE:', corrBefore);
  await closePopup();

  // ── 05+: Move each bottle ──
  for (let i = 0; i < BOTTLES.length; i++) {
    const b = BOTTLES[i];
    const idx = String(i + 1).padStart(2, '0');
    console.log(`\n[05.${idx}] Move bottle ${b.slug}`);

    await openByPath(`docs/stocks/${b.slug}.md`, b.title);
    await shot(page, `step05-${idx}-bottle-popup-view.png`);

    const bcBefore = await page.evaluate(() => {
      const pp = document.querySelector('[data-parent-pill]');
      return {
        parentPillSlug: pp ? pp.getAttribute('data-parent-pill') : null,
        parentPillText: pp ? pp.textContent.trim() : null,
      };
    });
    log.push({ step: `bc-before-${b.slug}`, bcBefore });

    // Click Edit toggle
    await page.evaluate(() => {
      const btn = document.getElementById('em-edit-toggle');
      if (btn) btn.click();
    });
    // Wait for the parent picker trigger to render
    await page.waitForFunction(() => !!document.getElementById('em-parent-picker-trigger'), { timeout: 5000 });
    await page.waitForTimeout(300);
    await shot(page, `step05-${idx}-bottle-edit-mode.png`);

    // Open the picker dropdown
    await page.evaluate(() => {
      const trig = document.getElementById('em-parent-picker-trigger');
      if (trig) trig.click();
    });
    await page.waitForFunction(() => {
      const dd = document.getElementById('em-parent-picker-dropdown');
      return dd && dd.style.display !== 'none' && dd.querySelector('.lt-row, [data-slug]');
    }, { timeout: 5000 });
    await page.waitForTimeout(400);
    await shot(page, `step05-${idx}-picker-open.png`);

    // Filter to "corrosive"
    const filterSet = await page.evaluate(() => {
      const dd = document.getElementById('em-parent-picker-dropdown');
      if (!dd) return { ok: false, reason: 'no-dd' };
      const inp = dd.querySelector('input[type="search"], input.lt-filter');
      if (!inp) return { ok: false, reason: 'no-input', html: dd.innerHTML.slice(0, 400) };
      inp.value = 'corrosive';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      return { ok: true };
    });
    log.push({ step: `picker-filter-${b.slug}`, filterSet });
    await page.waitForTimeout(600);
    await shot(page, `step05-${idx}-picker-filtered.png`);

    // Click the cabinet-corrosive node by data-slug match
    const picked = await page.evaluate((destSlug) => {
      const dd = document.getElementById('em-parent-picker-dropdown');
      if (!dd) return { ok: false, reason: 'no-dd' };
      const rows = Array.from(dd.querySelectorAll('[data-slug]'));
      const exact = rows.find(r => r.getAttribute('data-slug') === destSlug);
      if (exact) {
        // Click the lt-row child (the row, not the wrapping node)
        const target = exact.querySelector('.lt-row') || exact;
        target.click();
        return { ok: true, mode: 'data-slug-exact', text: target.textContent.trim().slice(0, 60) };
      }
      // fallback: title text contains "corrosive cabinet"
      const titleEls = Array.from(dd.querySelectorAll('.lt-title'));
      const t = titleEls.find(el => /corrosive cabinet/i.test(el.textContent || ''));
      if (t) {
        const row = t.closest('.lt-row') || t;
        row.click();
        return { ok: true, mode: 'title-fallback', text: t.textContent.trim().slice(0, 60) };
      }
      return { ok: false, reason: 'no-match', dropdownText: dd.innerText.slice(0, 400) };
    }, DEST);
    log.push({ step: `picker-pick-${b.slug}`, picked });
    console.log('  picked:', picked);
    await page.waitForTimeout(500);
    await shot(page, `step05-${idx}-after-picker-pick.png`);

    // Verify hidden parent input updated
    const hiddenAfter = await page.evaluate(() => {
      const inp = document.querySelector('.em-field-input[data-key="parent"]');
      return inp ? inp.value : null;
    });
    log.push({ step: `hidden-after-${b.slug}`, hiddenAfter });
    console.log('  hidden parent value:', hiddenAfter);

    // Click Save
    await page.evaluate(() => {
      const btn = document.getElementById('em-save');
      if (btn) btn.click();
    });
    // Wait for save to finish — toast or em-save not disabled
    await page.waitForFunction(() => {
      const btn = document.getElementById('em-save');
      return btn && (btn.style.display === 'none' || !btn.disabled);
    }, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, `step05-${idx}-after-save.png`);

    // Re-open the bottle in view mode and verify parent pill
    await closePopup();
    await openByPath(`docs/stocks/${b.slug}.md`, b.title);
    await shot(page, `step05-${idx}-bottle-popup-after-save.png`);
    const bcAfter = await page.evaluate(() => {
      const pp = document.querySelector('[data-parent-pill]');
      const breadcrumb = Array.from(document.querySelectorAll('.em-breadcrumb, .em-trail'))
        .map(el => el.textContent.trim()).join(' | ');
      return {
        parentPillSlug: pp ? pp.getAttribute('data-parent-pill') : null,
        parentPillText: pp ? pp.textContent.trim() : null,
        breadcrumbText: breadcrumb,
      };
    });
    log.push({ step: `bc-after-${b.slug}`, bcAfter });
    console.log('  AFTER:', bcAfter);
    await closePopup();
  }

  // ── 06: Cabinet-flammable popup AFTER moves ──
  console.log('\n[06] Cabinet-flammable popup AFTER moves');
  await openByPath('docs/' + SOURCE + '.md', 'Flammable Cabinet');
  await shot(page, 'step06-flammable-after-moves.png');
  const flamAfter = await snapshotPopupContents();
  log.push({ step: 'flammable-after', ...flamAfter });
  console.log('  flammable AFTER:', flamAfter);
  await closePopup();

  // ── 07: Cabinet-corrosive popup AFTER moves ──
  console.log('[07] Cabinet-corrosive popup AFTER moves');
  await openByPath('docs/' + DEST + '.md', 'Corrosive Cabinet');
  await shot(page, 'step07-corrosive-after-moves.png');
  const corrAfter = await snapshotPopupContents();
  log.push({ step: 'corrosive-after', ...corrAfter });
  console.log('  corrosive AFTER:', corrAfter);
  await closePopup();

  // ── 08: Lab Map tree filtered by RUN tag ──
  console.log('[08] Lab Map filter by run tag');
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // Filter input is the lab-map's "Filter by name or slug…"
  await page.evaluate((tag) => {
    const candidates = document.querySelectorAll('input[placeholder*="ilter"], input[type="search"]');
    candidates.forEach(c => { c.value = tag; c.dispatchEvent(new Event('input', { bubbles: true })); });
  }, RUN);
  await page.waitForTimeout(900);
  await shot(page, 'step08-labmap-filtered-after-moves.png');
  const treeRows = await page.evaluate((tag) => {
    const all = Array.from(document.querySelectorAll('.lt-title'));
    return all.map(el => el.textContent.trim()).filter(t => new RegExp(tag, 'i').test(t)).slice(0, 20);
  }, RUN);
  log.push({ step: 'labmap-rows', treeRows });
  console.log('  matching rows:', treeRows);

  // ── 09: Inventory reload + search ──
  console.log('[09] Inventory reload + search');
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.evaluate((tag) => {
    const candidates = document.querySelectorAll('input[type="search"], input[placeholder*="earch"]');
    candidates.forEach(c => { c.value = tag; c.dispatchEvent(new Event('input', { bubbles: true })); });
  }, RUN);
  await page.waitForTimeout(700);
  await shot(page, 'step09-inventory-after-search.png');

  await browser.close();

  // ── Cleanup ──
  console.log('\n[cleanup] Deleting QA bottles…');
  for (const b of seeded) {
    try {
      await deleteFileViaGh(b.path);
      console.log('  -', b.slug);
    } catch (e) {
      console.log('  ! failed to delete', b.slug, e.message);
    }
  }

  fs.writeFileSync(path.join(SHOT_DIR, '_log.json'), JSON.stringify(log, null, 2));
  console.log('\n=== Cycle 10 done ===');
  console.log('Log entries:', log.length);
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  for (const b of BOTTLES) {
    try { await deleteFileViaGh(`docs/stocks/${b.slug}.md`); } catch {}
  }
  process.exit(1);
});
