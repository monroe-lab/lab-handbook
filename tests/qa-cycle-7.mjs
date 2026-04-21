/**
 * QA Cycle 7
 * Persona: Alex Chen (postdoc, library prep / sequencing)
 * Modifier: ui_critic (heavy screenshot evaluation, visual coherence checks)
 * Scenario: "New freezer box day"
 *   - Create a new 10x10 box 'Library Prep Kit Storage mo<ts>' on shelf-minus80-a-1
 *   - Add 3 tubes at non-adjacent positions (A1, C5, J10) to stress grid rendering
 *     at top-left, middle, and bottom-right corners
 *   - Verify shelf children list picks up the new box
 *   - Verify box popup renders 10x10 grid (100 cells) with 3 occupied cells
 *   - Verify each tube's 5-level breadcrumb renders correctly (no dangling slash)
 *   - Cosmetic checks: nav truncation, breadcrumb formatting, type-pill colors
 *   - Verify top-nav width at 1440x900 — log if 'Lab Map' is still truncated
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle7';
const TS = Date.now().toString(36);

const BOX_SLUG = `box-libprep-kit-storage-${TS}`;
const TUBE_DEFS = [
  { slug: `tube-libprep-kapa-${TS}`, title: 'KAPA HyperPrep Tube', pos: 'A1', label2: 'KAPA\nA1' },
  { slug: `tube-libprep-nebnext-${TS}`, title: 'NEBNext Ultra II Tube', pos: 'C5', label2: 'NEB\nC5' },
  { slug: `tube-libprep-twist-${TS}`, title: 'Twist EF Library Tube', pos: 'J10', label2: 'TWST\nJ10' },
];

const cleanup = [];
const log = [];
let stepNum = 0;

fs.mkdirSync(SHOTS, { recursive: true });

async function shot(page, label, fullPage = false) {
  stepNum++;
  const num = String(stepNum).padStart(2, '0');
  const path = `${SHOTS}/${num}-${label}.png`;
  await page.screenshot({ path, fullPage });
  console.log(`  ${num} ${label}`);
  return path;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', (err) => console.log('  [page error]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/favicon|font/i.test(msg.text())) {
      console.log('  [console.error]', msg.text().slice(0, 200));
    }
  });

  // ── STEP 1: Lab map baseline ──
  console.log('\nSTEP 1: Lab map baseline');
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const s1 = await shot(page, 'lab-map-baseline');
  log.push({ step: stepNum, action: 'lab-map baseline load', path: s1 });

  // Also check top-nav label truncation explicitly
  const navLabels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.top-nav a, nav a, .nav-top a, header a'));
    return links.map((a) => ({
      text: a.textContent.trim(),
      width: a.getBoundingClientRect().width,
      href: a.getAttribute('href'),
    })).filter((x) => x.text.length > 0 && x.href);
  });
  console.log('  nav labels:', JSON.stringify(navLabels.filter(x => x.text.length < 20), null, 2).slice(0, 600));

  // ── STEP 2: Open existing shelf popup (pre-create) ──
  console.log('\nSTEP 2: Shelf popup baseline');
  await page.evaluate(() => Lab.editorModal.open('docs/locations/shelf-minus80-a-1.md'));
  await page.waitForTimeout(2500);
  const s2 = await shot(page, 'shelf-popup-baseline');
  const shelfBaseline = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.em-c3 a, .em-c3 [class*="link"], .em-backlinks a')).map(a => a.textContent.trim());
    const breadcrumb = document.querySelector('.em-breadcrumb, .em-bc, [class*="breadcrumb"]')?.innerText || '';
    return { titles: titles.slice(0, 30), breadcrumb };
  });
  console.log('  shelf baseline children:', shelfBaseline.titles.length, 'breadcrumb:', JSON.stringify(shelfBaseline.breadcrumb));
  log.push({ step: stepNum, action: 'open shelf-minus80-a-1 popup', path: s2, note: `children: ${shelfBaseline.titles.length}, breadcrumb: ${shelfBaseline.breadcrumb}` });

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(800);

  // ── STEP 3: Create new 10x10 box (Library Prep Kit Storage) ──
  console.log('\nSTEP 3: Create 10x10 box');
  const boxPath = `docs/locations/${BOX_SLUG}.md`;
  const boxMeta = {
    type: 'box',
    title: 'Library Prep Kit Storage',
    parent: 'locations/shelf-minus80-a-1',
    grid: '10x10',
    label_1: 'Library Prep Kits\n(NEB / KAPA / Twist)',
    label_2: 'LIB-PREP',
    notes: 'Cryobox holding single-tube library prep reagents at -80C. 10x10 = 100 positions.',
    created_at: new Date().toISOString(),
    created_by: 'greymonroe',
  };
  const s3a = await shot(page, 'before-create-box');
  const boxResult = await page.evaluate(async ({ path, meta }) => {
    const body = '\n# ' + meta.title + '\n\nLibrary prep kit reagents for [[samples/sample-pistachio-4]] and other sequencing projects. Stored on [[locations/shelf-minus80-a-1]] in [[locations/freezer-minus80-a]].\n\nSee the [[qiagen-dneasy-extraction]] protocol upstream and [[dna-quantification-qubit]] for QC.\n';
    const fm = Lab.buildFrontmatter(meta, body);
    const saved = await Lab.gh.saveFile(path, fm, null, 'qa-cycle-7: create libprep box');
    Lab.gh.patchObjectIndex(path, meta);
    if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
    return { ok: true, sha: saved.sha };
  }, { path: boxPath, meta: boxMeta });
  cleanup.push(boxPath);
  console.log('  box created:', boxResult);
  await page.waitForTimeout(2000);
  const s3b = await shot(page, 'after-create-box');
  log.push({ step: stepNum, action: 'create libprep box', path: s3b, note: `file: ${boxPath}` });

  // ── STEP 4: Reload lab-map, search 'libprep' ──
  console.log('\nSTEP 4: Reload + search lab-map for libprep');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const s4a = await shot(page, 'lab-map-post-box-create');
  await page.evaluate(() => {
    const inp = document.getElementById('treeSearch');
    if (inp) { inp.value = 'library prep'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(1500);
  const s4b = await shot(page, 'lab-map-search-libprep');
  log.push({ step: stepNum, action: 'reload + filter libprep', path: s4b });

  // ── STEP 5: Open empty box popup, verify 10x10 = 100 cells ──
  console.log('\nSTEP 5: Open empty box popup');
  const s5a = await shot(page, 'before-open-empty-box');
  await page.evaluate((p) => Lab.editorModal.open(p), boxPath);
  await page.waitForTimeout(3500);
  const s5b = await shot(page, 'empty-10x10-box-popup', true);
  const emptyGridInfo = await page.evaluate(() => {
    const cells = document.querySelectorAll('.em-grid-cell');
    const empty = document.querySelectorAll('.em-grid-cell.empty');
    const occ = document.querySelectorAll('.em-grid-cell.occupied');
    const hdr = document.querySelector('.em-grid-header, .em-grid-info')?.innerText || '';
    const breadcrumb = document.querySelector('.em-breadcrumb, [class*="breadcrumb"]')?.innerText || '';
    return {
      total: cells.length,
      empty: empty.length,
      occupied: occ.length,
      header: hdr.slice(0, 100),
      breadcrumb: breadcrumb.slice(0, 300),
    };
  });
  console.log('  empty grid:', JSON.stringify(emptyGridInfo));
  log.push({ step: stepNum, action: 'empty 10x10 box popup', path: s5b, note: JSON.stringify(emptyGridInfo) });

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(800);

  // ── STEP 6: Create 3 tubes at A1, C5, J10 ──
  console.log('\nSTEP 6: Create 3 tubes');
  for (let i = 0; i < TUBE_DEFS.length; i++) {
    const { slug, title, pos, label2 } = TUBE_DEFS[i];
    const path = `docs/locations/${slug}.md`;
    const meta = {
      type: 'tube',
      title,
      parent: `locations/${BOX_SLUG}`,
      position: pos,
      label_1: `${title}\nstored ${new Date().toISOString().slice(0, 10)}`,
      label_2: label2,
      notes: `${title} for library prep, position ${pos}.`,
      created_at: new Date().toISOString(),
      created_by: 'greymonroe',
    };
    await page.evaluate(async ({ path, meta }) => {
      const body = '\n# ' + meta.title + '\n\nReagent tube for library prep. Stored in [[locations/' + meta.parent.split('/').pop() + ']] at position ' + meta.position + '.\n';
      const fm = Lab.buildFrontmatter(meta, body);
      const saved = await Lab.gh.saveFile(path, fm, null, 'qa-cycle-7: create tube ' + meta.position);
      Lab.gh.patchObjectIndex(path, meta);
      if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
      return saved;
    }, { path, meta });
    cleanup.push(path);
    console.log(`  tube ${i + 1}/3 ${pos} — ${title}`);
  }
  const s6 = await shot(page, 'after-all-3-tubes-created');
  log.push({ step: stepNum, action: 'created 3 tubes at A1/C5/J10', path: s6 });

  // ── STEP 7: Reopen box popup; verify grid shows 3 occupied cells ──
  console.log('\nSTEP 7: Reopen box, verify 3 occupied cells');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const s7a = await shot(page, 'lab-map-post-tubes-reload');
  await page.evaluate((p) => Lab.editorModal.open(p), boxPath);
  await page.waitForTimeout(3500);
  const s7b = await shot(page, 'box-popup-with-3-tubes', true);
  const filled = await page.evaluate(() => {
    const occ = document.querySelectorAll('.em-grid-cell.occupied');
    const all = document.querySelectorAll('.em-grid-cell');
    const cells = Array.from(occ).map((el) => ({
      cell: el.getAttribute('data-cell'),
      slug: el.getAttribute('data-slug'),
      title: el.getAttribute('title'),
    }));
    const hdr = document.querySelector('.em-grid-header, .em-grid-info')?.innerText || '';
    const breadcrumb = document.querySelector('.em-breadcrumb, [class*="breadcrumb"]')?.innerText || '';
    return { total: all.length, occupied: occ.length, cells, header: hdr, breadcrumb };
  });
  console.log('  filled grid:', JSON.stringify(filled, null, 2).slice(0, 800));
  log.push({ step: stepNum, action: 'reopen box popup with 3 tubes', path: s7b, note: `${filled.occupied}/${filled.total} occupied, cells: ${filled.cells.map(c => c.cell).join(',')}` });

  // Scroll grid to bottom-right to ensure J10 visible, screenshot detail
  await page.evaluate(() => {
    const grid = document.querySelector('.em-grid, .em-grid-wrap');
    if (grid) grid.scrollTop = grid.scrollHeight;
  });
  await page.waitForTimeout(500);
  const s7c = await shot(page, 'box-popup-grid-scrolled-bottom');
  log.push({ step: stepNum, action: 'grid scrolled to J10 region', path: s7c });

  // ── STEP 8: Open one tube popup (middle one, C5), verify 5-level breadcrumb ──
  console.log('\nSTEP 8: Open tube C5 popup, verify breadcrumb');
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const s8a = await shot(page, 'before-tube-c5-popup');
  const tubeC5Path = `docs/locations/${TUBE_DEFS[1].slug}.md`;
  await page.evaluate((p) => Lab.editorModal.open(p), tubeC5Path);
  await page.waitForTimeout(2500);
  const s8b = await shot(page, 'tube-c5-popup-breadcrumb', true);
  const crumb = await page.evaluate(() => {
    const bc = document.querySelector('.em-breadcrumb, .em-bc, [class*="breadcrumb"]');
    const pills = bc ? Array.from(bc.querySelectorAll('[class*="pill"], a, span.em-crumb')).map((el) => ({
      text: el.textContent.trim(),
      cls: el.className,
    })) : [];
    const rawText = bc ? bc.innerText : '';
    // Look for dangling slash
    const trim = rawText.replace(/\s+/g, ' ').trim();
    const endsWithSlash = /\/\s*$/.test(trim);
    return { pills, rawText: trim, endsWithSlash };
  });
  console.log('  breadcrumb pills:', crumb.pills.length, '   text:', crumb.rawText);
  console.log('  endsWithSlash:', crumb.endsWithSlash);
  log.push({ step: stepNum, action: 'open tube C5 popup', path: s8b, note: `breadcrumb: ${crumb.rawText}, danglingSlash: ${crumb.endsWithSlash}` });

  // ── STEP 9: Open tube A1 (top-left corner) popup ──
  console.log('\nSTEP 9: Open tube A1 popup');
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const s9a = await shot(page, 'before-tube-a1-popup');
  const tubeA1Path = `docs/locations/${TUBE_DEFS[0].slug}.md`;
  await page.evaluate((p) => Lab.editorModal.open(p), tubeA1Path);
  await page.waitForTimeout(2500);
  const s9b = await shot(page, 'tube-a1-popup', true);
  log.push({ step: stepNum, action: 'open tube A1 popup', path: s9b });

  // ── STEP 10: Open tube J10 (bottom-right corner) popup ──
  console.log('\nSTEP 10: Open tube J10 popup');
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const s10a = await shot(page, 'before-tube-j10-popup');
  const tubeJ10Path = `docs/locations/${TUBE_DEFS[2].slug}.md`;
  await page.evaluate((p) => Lab.editorModal.open(p), tubeJ10Path);
  await page.waitForTimeout(2500);
  const s10b = await shot(page, 'tube-j10-popup', true);
  log.push({ step: stepNum, action: 'open tube J10 popup', path: s10b });

  // ── STEP 11: Re-open shelf popup — verify new box appears as child ──
  console.log('\nSTEP 11: Shelf popup post-create (verify box is child)');
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const s11a = await shot(page, 'before-shelf-popup-post-create');
  await page.evaluate(() => Lab.editorModal.open('docs/locations/shelf-minus80-a-1.md'));
  await page.waitForTimeout(2500);
  const s11b = await shot(page, 'shelf-popup-with-new-box', true);
  const shelfPost = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.em-c3 a, .em-backlinks a')).map((a) => a.textContent.trim());
    return { titles: links.slice(0, 30) };
  });
  console.log('  shelf children after create:', shelfPost.titles.length);
  log.push({ step: stepNum, action: 'shelf popup post-create', path: s11b, note: `children now: ${shelfPost.titles.length}` });

  // ── STEP 12: Cross-link: open box popup, click shelf pill to navigate up ──
  console.log('\nSTEP 12: Nav up via parent pill on box');
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  await page.evaluate((p) => Lab.editorModal.open(p), boxPath);
  await page.waitForTimeout(2500);
  const s12a = await shot(page, 'box-popup-for-nav-up');
  // Click the Parent pill
  const parentPillText = await page.evaluate(() => {
    const el = document.querySelector('[data-parent-pill], .em-parent-pill, .field-parent a, .em-fields a');
    return el ? el.textContent.trim() : null;
  });
  console.log('  parent pill text:', parentPillText);
  // Try to click the first link inside the parent field
  const clicked = await page.evaluate(() => {
    // Try multiple selectors for the parent link
    const cands = [
      ...document.querySelectorAll('.em-fields a[href*="shelf-minus80"]'),
      ...document.querySelectorAll('.em-field-parent a'),
      ...document.querySelectorAll('[data-parent-pill] a'),
    ];
    if (cands[0]) { cands[0].click(); return true; }
    return false;
  });
  if (clicked) {
    await page.waitForTimeout(2500);
    const s12b = await shot(page, 'after-click-parent-pill-navigates-to-shelf', true);
    log.push({ step: stepNum, action: 'click parent pill, navigate to shelf', path: s12b });
  } else {
    console.log('  could not find parent pill to click');
    const s12b = await shot(page, 'box-popup-nav-click-failed', true);
    log.push({ step: stepNum, action: 'attempted click parent pill — no target found', path: s12b });
  }

  // ── STEP 13: Final lab-map tree expanded showing full hierarchy ──
  console.log('\nSTEP 13: Final lab-map tree');
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const inp = document.getElementById('treeSearch');
    if (inp) { inp.value = 'libprep'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(1500);
  const s13 = await shot(page, 'final-lab-map-libprep-tree', true);
  log.push({ step: stepNum, action: 'final lab-map tree filtered libprep', path: s13 });

  // ── STEP 14: UI-critic detail — top nav zoom ──
  console.log('\nSTEP 14: Top-nav detail for truncation check');
  const navCheck = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('a'));
    const nav = all.filter((a) => {
      const r = a.getBoundingClientRect();
      return r.y < 50 && r.x > 100 && r.x < 1400;
    });
    return nav.map((a) => ({
      text: a.textContent.trim().replace(/\s+/g, ' '),
      width: Math.round(a.getBoundingClientRect().width),
      scrollW: a.scrollWidth,
      clientW: a.clientWidth,
      truncated: a.scrollWidth > a.clientWidth + 1,
    })).filter((x) => x.text);
  });
  console.log('  nav truncation check:', JSON.stringify(navCheck, null, 2).slice(0, 800));
  const s14 = await shot(page, 'top-nav-region-detail');
  log.push({ step: stepNum, action: 'top-nav truncation audit', path: s14, note: JSON.stringify(navCheck.filter((x) => x.truncated)) });

  // ── CLEANUP ──
  console.log('\nCleanup…');
  for (const p of cleanup) {
    try {
      const sha = execSync(`gh api "repos/${REPO}/contents/${p}" --jq .sha`, { stdio: 'pipe' }).toString().trim();
      execSync(`gh api -X DELETE "repos/${REPO}/contents/${p}" -f message="qa-cycle-7: cleanup" -f sha="${sha}"`, { stdio: 'pipe' });
      console.log(`  deleted ${p}`);
    } catch (e) {
      console.log(`  FAILED delete ${p}: ${e.message.slice(0, 120)}`);
    }
  }

  await browser.close();
  fs.writeFileSync(`${SHOTS}/_log.json`, JSON.stringify({ ts: TS, box_slug: BOX_SLUG, tubes: TUBE_DEFS, log, cleanup }, null, 2));
  console.log(`\nDone — ${log.length} log entries, screenshots in ${SHOTS}`);
})();
