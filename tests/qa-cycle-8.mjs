/**
 * QA Cycle 8
 * Persona: Vianney Ahn (grad student)
 * Modifier: cross_linker (verify every link in both directions)
 * Scenario: "Concept+instance linking" — pick a reagent concept with ZERO
 *   existing physical bottle instances, create 2 bottles pointing at it via
 *   `of:`, place them on a shared location, then obsessively verify the
 *   link topology:
 *     - concept popup Contents column lists both new bottles (forward link)
 *     - inventory table groups the 2 bottles under the concept row
 *     - each bottle popup shows full breadcrumb + clickable Of + clickable Parent
 *     - click Of pill on bottle -> lands on concept (round-trip)
 *     - click Parent pill -> lands on location; location popup lists both as children
 *     - fetchLinkIndex reports the new backlinks on the concept
 *     - lab-map tree filter shows both bottles under the shared location
 *
 * Screenshot discipline: before+after EVERY meaningful action. Many screenshots.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle8';
const TS = Date.now().toString(36);
const LOC_SLUG = 'locations/cabinet-chemical'; // shared parent for both bottles

const cleanup = [];
const log = [];

function shot(page, step, label) {
  const path = `${SHOTS}/step${String(step).padStart(2, '0')}-${label}.png`;
  return page.screenshot({ path, fullPage: false }).then(() => path);
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
  page.setDefaultTimeout(15000);
  page.on('pageerror', (err) => console.log('  [page error]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/favicon|font/i.test(msg.text())) {
      console.log('  [console.error]', msg.text().slice(0, 220));
    }
  });

  let stepNum = 0;
  async function takeBeforeAfter(name, fn) {
    stepNum++;
    const before = await shot(page, stepNum, `before-${name}`);
    await fn();
    const after = await shot(page, stepNum, `after-${name}`);
    log.push({ step: stepNum, name, before, after });
    console.log(`  step ${stepNum}: ${name}`);
    return { before, after };
  }

  // ── STEP 1: Inventory page baseline ──
  console.log('STEP 1: Inventory baseline');
  stepNum++;
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const s1 = await shot(page, stepNum, 'inventory-baseline');
  log.push({ step: stepNum, name: 'inventory baseline', after: s1 });

  // ── STEP 2: Find a reagent concept with 0 bottle instances ──
  console.log('STEP 2: Pick a reagent concept with 0 bottle instances');
  const conceptPick = await page.evaluate(async () => {
    const idx = await Lab.gh.fetchObjectIndex();
    // idx is an array of { path, type, title, of, parent, ... } with path relative (no docs/ prefix)
    const entries = Array.isArray(idx) ? idx : Object.values(idx || {});
    const targeted = new Set();
    for (const e of entries) {
      if (!e || !e.path) continue;
      if (!e.path.startsWith('stocks/')) continue;
      const type = String(e.type || '').toLowerCase();
      if (type !== 'bottle' && type !== 'tube') continue;
      if (e.of) targeted.add(String(e.of).replace(/^docs\//, '').replace(/\.md$/, ''));
    }
    const reagents = [];
    for (const e of entries) {
      if (!e || !e.path) continue;
      if (!e.path.startsWith('resources/')) continue;
      const type = String(e.type || '').toLowerCase();
      if (!/reagent|chemical|buffer/.test(type)) continue;
      const slug = e.path.replace(/\.md$/, '');
      if (targeted.has(slug)) continue;
      reagents.push({ path: 'docs/' + slug + '.md', slug, title: e.title || slug, type: e.type });
    }
    reagents.sort((a, b) => a.title.localeCompare(b.title));
    return { totalReagents: reagents.length, targeted: targeted.size, sample: reagents.slice(0, 20), pick: reagents[Math.floor(Math.random() * Math.min(reagents.length, 15))] };
  });
  console.log('  zero-instance reagents found:', conceptPick.totalReagents, '| already targeted:', conceptPick.targeted);
  console.log('  picked:', conceptPick.pick && conceptPick.pick.title, conceptPick.pick && conceptPick.pick.slug);
  if (!conceptPick.pick) {
    console.log('  FATAL: no zero-instance concept found. Candidates first 10:', JSON.stringify(conceptPick.sample.slice(0, 10)));
    await browser.close();
    process.exit(1);
  }
  const CONCEPT_PATH = conceptPick.pick.path;
  const CONCEPT_SLUG = conceptPick.pick.slug; // e.g. resources/sodium-chloride
  const CONCEPT_TITLE = conceptPick.pick.title;
  const conceptSlugBase = CONCEPT_SLUG.replace(/^resources\//, '');
  const BOTTLE_A = `bottle-${conceptSlugBase}-qa8a-${TS}`;
  const BOTTLE_B = `bottle-${conceptSlugBase}-qa8b-${TS}`;
  const BOTTLE_A_PATH = `docs/stocks/${BOTTLE_A}.md`;
  const BOTTLE_B_PATH = `docs/stocks/${BOTTLE_B}.md`;

  // ── STEP 3: Open concept popup baseline (instance count = 0) ──
  await takeBeforeAfter('concept-popup-baseline', async () => {
    await page.evaluate((p) => Lab.editorModal.open(p), CONCEPT_PATH);
    await page.waitForTimeout(3000);
  });

  const baselineInstances = await page.evaluate((slug) => {
    const rows = document.querySelectorAll('.em-backlink-row, [data-slug]');
    const all = [];
    for (const r of rows) {
      const s = r.getAttribute('data-slug');
      if (!s) continue;
      all.push({ slug: s, text: r.textContent.trim().slice(0, 80) });
    }
    return { all, bottleSlugs: all.filter((x) => x.slug && (x.slug.startsWith('stocks/bottle-') || x.slug.startsWith('docs/stocks/bottle-'))) };
  }, CONCEPT_SLUG);
  console.log('  baseline Contents rows:', baselineInstances.all.length, '| bottle rows:', baselineInstances.bottleSlugs.length);

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);

  // ── STEP 4: Shared parent location popup baseline (cabinet-chemical) ──
  await takeBeforeAfter('location-popup-baseline', async () => {
    await page.evaluate((p) => Lab.editorModal.open(p), `docs/${LOC_SLUG}.md`);
    await page.waitForTimeout(3000);
  });
  const locBaseline = await page.evaluate(() => {
    const slugs = Array.from(document.querySelectorAll('[data-slug]')).map((a) => a.getAttribute('data-slug')).filter(Boolean);
    return { total: slugs.length, unique: Array.from(new Set(slugs)).length, sample: slugs.slice(0, 20) };
  });
  console.log('  location baseline children:', locBaseline.total, '| unique:', locBaseline.unique);
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);

  // ── STEP 5: Create bottle A ──
  console.log('STEP 5: Create bottle A');
  stepNum++;
  const s5a = await shot(page, stepNum, 'before-create-bottleA');
  const bottleAMeta = {
    type: 'bottle',
    title: `${CONCEPT_TITLE} (QA8 A)`,
    of: CONCEPT_SLUG,
    parent: LOC_SLUG,
    quantity: 500,
    unit: 'mL',
    lot: `QA8A-${TS.toUpperCase()}`,
    expiration: '2027-12-31',
    acquired: '2026-04-21',
    notes: 'QA cycle 8 test bottle A — concept+instance link verification. Auto-cleanup at end of cycle.',
    created_at: new Date().toISOString(),
    created_by: 'greymonroe',
  };
  const bottleAResult = await page.evaluate(async ({ path, meta, concept }) => {
    const body = `\n# ${meta.title}\n\nQA cycle 8 bottle A of [[${concept}]], stored on [[locations/cabinet-chemical]].\n\nLot: ${meta.lot} · Expires: ${meta.expiration}\n`;
    const fm = Lab.buildFrontmatter(meta, body);
    const saved = await Lab.gh.saveFile(path, fm, null, 'qa-cycle-8: create bottle A');
    Lab.gh.patchObjectIndex(path, meta);
    if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
    return { ok: true, sha: saved.sha };
  }, { path: BOTTLE_A_PATH, meta: bottleAMeta, concept: CONCEPT_SLUG });
  cleanup.push(BOTTLE_A_PATH);
  console.log('  bottle A created:', bottleAResult.sha && bottleAResult.sha.slice(0, 8));
  await page.waitForTimeout(1200);
  const s5b = await shot(page, stepNum, 'after-create-bottleA');
  log.push({ step: stepNum, name: 'create bottle A', before: s5a, after: s5b, note: BOTTLE_A_PATH });

  // ── STEP 6: Create bottle B ──
  console.log('STEP 6: Create bottle B');
  stepNum++;
  const s6a = await shot(page, stepNum, 'before-create-bottleB');
  const bottleBMeta = {
    type: 'bottle',
    title: `${CONCEPT_TITLE} (QA8 B)`,
    of: CONCEPT_SLUG,
    parent: LOC_SLUG,
    quantity: 250,
    unit: 'mL',
    lot: `QA8B-${TS.toUpperCase()}`,
    expiration: '2028-06-30',
    acquired: '2026-04-21',
    notes: 'QA cycle 8 test bottle B — sibling instance of bottle A. Auto-cleanup at end of cycle.',
    created_at: new Date().toISOString(),
    created_by: 'greymonroe',
  };
  const bottleBResult = await page.evaluate(async ({ path, meta, concept }) => {
    const body = `\n# ${meta.title}\n\nQA cycle 8 bottle B of [[${concept}]], stored on [[locations/cabinet-chemical]].\n\nLot: ${meta.lot} · Expires: ${meta.expiration}\n`;
    const fm = Lab.buildFrontmatter(meta, body);
    const saved = await Lab.gh.saveFile(path, fm, null, 'qa-cycle-8: create bottle B');
    Lab.gh.patchObjectIndex(path, meta);
    if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
    return { ok: true, sha: saved.sha };
  }, { path: BOTTLE_B_PATH, meta: bottleBMeta, concept: CONCEPT_SLUG });
  cleanup.push(BOTTLE_B_PATH);
  console.log('  bottle B created:', bottleBResult.sha && bottleBResult.sha.slice(0, 8));
  await page.waitForTimeout(1200);
  const s6b = await shot(page, stepNum, 'after-create-bottleB');
  log.push({ step: stepNum, name: 'create bottle B', before: s6a, after: s6b, note: BOTTLE_B_PATH });

  // ── STEP 7: Reopen concept popup - expect both bottles in Contents ──
  await takeBeforeAfter('concept-popup-after-2-bottles', async () => {
    await page.evaluate((p) => Lab.editorModal.open(p), CONCEPT_PATH);
    await page.waitForTimeout(3000);
  });

  const afterInstances = await page.evaluate((slugs) => {
    const rows = Array.from(document.querySelectorAll('.em-backlink-row, [data-slug]'));
    const all = rows.map((r) => ({
      slug: r.getAttribute('data-slug') || '',
      text: r.textContent.trim().slice(0, 120),
    })).filter((r) => r.slug);
    return {
      total: all.length,
      hasA: all.some((r) => r.slug.includes(slugs.a)),
      hasB: all.some((r) => r.slug.includes(slugs.b)),
      bottleRows: all.filter((r) => r.slug.startsWith('stocks/bottle-') || r.slug.startsWith('docs/stocks/bottle-')),
    };
  }, { a: BOTTLE_A, b: BOTTLE_B });
  console.log('  concept popup bottle rows after:', afterInstances.bottleRows.length, '| hasA:', afterInstances.hasA, '| hasB:', afterInstances.hasB);

  // ── STEP 8: Click bottle A from concept popup (test Contents click) ──
  console.log('STEP 8: Click bottle A from concept popup');
  stepNum++;
  const s8a = await shot(page, stepNum, 'before-click-bottleA-from-concept');
  const clickBA = await page.evaluate((slug) => {
    const rows = document.querySelectorAll('.em-backlink-row, [data-slug]');
    for (const r of rows) {
      const s = r.getAttribute('data-slug') || '';
      if (s.includes(slug)) {
        r.click();
        return { ok: true, slug: s };
      }
    }
    return { ok: false };
  }, BOTTLE_A);
  console.log('  click result:', clickBA);
  await page.waitForTimeout(2500);
  const s8b = await shot(page, stepNum, 'after-click-bottleA-from-concept');
  log.push({ step: stepNum, name: 'click bottle A from concept', before: s8a, after: s8b, note: JSON.stringify(clickBA) });

  // Capture breadcrumb + fields on bottle A
  const bottleAPopup = await page.evaluate(() => {
    const bc = document.querySelector('.em-breadcrumb, [class*="breadcrumb"]');
    const ofPill = document.querySelector('[data-of-pill], [data-of-slug]');
    const parentPill = document.querySelector('[data-parent-pill], [data-parent-slug]');
    return {
      breadcrumbText: bc ? bc.innerText.replace(/\s+/g, ' ').trim() : null,
      hasOfPill: Boolean(ofPill),
      hasParentPill: Boolean(parentPill),
    };
  });
  console.log('  bottle A breadcrumb:', bottleAPopup.breadcrumbText);
  console.log('  bottle A hasOfPill:', bottleAPopup.hasOfPill, '| hasParentPill:', bottleAPopup.hasParentPill);

  // ── STEP 9: Click the Of pill on bottle A to round-trip back to concept ──
  console.log('STEP 9: Click Of pill on bottle A → concept');
  stepNum++;
  const s9a = await shot(page, stepNum, 'before-click-of-pill');
  const ofClick = await page.evaluate(() => {
    // Try multiple possible selectors for the of-field pill
    const sels = ['[data-of-pill] a', '[data-of-pill]', '[data-of-slug]', '.em-fields [data-slug*="resources/"]'];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) {
        const slug = el.getAttribute('data-slug') || el.getAttribute('data-of-slug') || el.textContent.trim();
        el.click();
        return { ok: true, sel, slug };
      }
    }
    // Fallback: find any link whose slug starts with resources/
    const all = document.querySelectorAll('[data-slug]');
    for (const el of all) {
      const s = el.getAttribute('data-slug') || '';
      if (s.startsWith('resources/')) {
        el.click();
        return { ok: true, sel: '[data-slug^=resources/] fallback', slug: s };
      }
    }
    return { ok: false };
  });
  console.log('  of-pill click:', ofClick);
  await page.waitForTimeout(2500);
  const s9b = await shot(page, stepNum, 'after-click-of-pill');
  log.push({ step: stepNum, name: 'click of-pill on bottle A', before: s9a, after: s9b, note: JSON.stringify(ofClick) });

  // ── STEP 10: Click bottle B from concept popup ──
  console.log('STEP 10: Click bottle B from concept');
  stepNum++;
  const s10a = await shot(page, stepNum, 'before-click-bottleB-from-concept');
  const clickBB = await page.evaluate((slug) => {
    const rows = document.querySelectorAll('.em-backlink-row, [data-slug]');
    for (const r of rows) {
      const s = r.getAttribute('data-slug') || '';
      if (s.includes(slug)) {
        r.click();
        return { ok: true, slug: s };
      }
    }
    return { ok: false };
  }, BOTTLE_B);
  console.log('  click result:', clickBB);
  await page.waitForTimeout(2500);
  const s10b = await shot(page, stepNum, 'after-click-bottleB-from-concept');
  log.push({ step: stepNum, name: 'click bottle B from concept', before: s10a, after: s10b, note: JSON.stringify(clickBB) });

  const bottleBPopup = await page.evaluate(() => {
    const bc = document.querySelector('.em-breadcrumb, [class*="breadcrumb"]');
    return { breadcrumbText: bc ? bc.innerText.replace(/\s+/g, ' ').trim() : null };
  });
  console.log('  bottle B breadcrumb:', bottleBPopup.breadcrumbText);

  // ── STEP 11: Click parent pill on bottle B → location popup ──
  console.log('STEP 11: Click parent pill on bottle B → cabinet-chemical');
  stepNum++;
  const s11a = await shot(page, stepNum, 'before-click-parent-pill');
  const parentClick = await page.evaluate(() => {
    const sels = ['[data-parent-pill] a', '[data-parent-pill]', '[data-parent-slug]', '.em-fields [data-slug*="locations/"]'];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) {
        const slug = el.getAttribute('data-slug') || el.getAttribute('data-parent-slug') || el.textContent.trim();
        el.click();
        return { ok: true, sel, slug };
      }
    }
    const all = document.querySelectorAll('[data-slug]');
    for (const el of all) {
      const s = el.getAttribute('data-slug') || '';
      if (s === 'locations/cabinet-chemical' || s === 'docs/locations/cabinet-chemical') {
        el.click();
        return { ok: true, sel: 'fallback [data-slug]', slug: s };
      }
    }
    return { ok: false };
  });
  console.log('  parent-pill click:', parentClick);
  await page.waitForTimeout(2500);
  const s11b = await shot(page, stepNum, 'after-click-parent-pill');
  log.push({ step: stepNum, name: 'click parent-pill on bottle B', before: s11a, after: s11b, note: JSON.stringify(parentClick) });

  // ── STEP 12: Verify location popup lists both bottles ──
  const locAfter = await page.evaluate((slugs) => {
    const all = Array.from(document.querySelectorAll('[data-slug]')).map((el) => el.getAttribute('data-slug')).filter(Boolean);
    return {
      total: all.length,
      hasA: all.some((s) => s.includes(slugs.a)),
      hasB: all.some((s) => s.includes(slugs.b)),
    };
  }, { a: BOTTLE_A, b: BOTTLE_B });
  console.log('  cabinet-chemical after: hasA:', locAfter.hasA, '| hasB:', locAfter.hasB);
  stepNum++;
  const s12 = await shot(page, stepNum, 'location-popup-both-bottles');
  log.push({ step: stepNum, name: 'location popup with both bottles', after: s12, note: JSON.stringify(locAfter) });

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);

  // ── STEP 13: Verify link-index has both bottles as backlinks on concept ──
  console.log('STEP 13: Verify link index');
  const linkIndex = await page.evaluate(async (conceptSlug) => {
    const link = await Lab.gh.fetchLinkIndex();
    const refs = link[conceptSlug] || [];
    const sources = refs.map((r) => typeof r === 'string' ? r : (r.source || r.from || ''));
    return { total: sources.length, sources: sources.slice(0, 30) };
  }, CONCEPT_SLUG);
  const linkHasA = linkIndex.sources.some((s) => s.includes(BOTTLE_A));
  const linkHasB = linkIndex.sources.some((s) => s.includes(BOTTLE_B));
  console.log('  link-index on concept: total', linkIndex.total, '| hasA:', linkHasA, '| hasB:', linkHasB);

  // ── STEP 14: Inventory search for concept title — expect grouped row ──
  console.log('STEP 14: Inventory search');
  stepNum++;
  const s14a = await shot(page, stepNum, 'before-inventory-search-concept');
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const searchInput = await page.$('input[type="search"], input[placeholder*="earch" i], #search, input[name="q"]');
  if (searchInput) {
    await searchInput.fill(CONCEPT_TITLE.slice(0, 30));
    await page.waitForTimeout(1800);
  }
  const s14b = await shot(page, stepNum, 'after-inventory-search-concept');
  log.push({ step: stepNum, name: 'inventory search concept title', before: s14a, after: s14b });

  // Expand the concept row if it's a collapsible group — simulate click on its expand arrow if present
  stepNum++;
  const s14c = await shot(page, stepNum, 'inventory-rows-visible');
  const inventoryRows = await page.evaluate((qlike) => {
    const rows = Array.from(document.querySelectorAll('tr, [role="row"], .inv-row'));
    return rows.map((r) => ({
      text: r.textContent.trim().replace(/\s+/g, ' ').slice(0, 180),
      slug: r.getAttribute('data-slug') || r.getAttribute('data-path') || '',
    })).filter((r) => r.text.toLowerCase().includes(qlike.toLowerCase())).slice(0, 10);
  }, CONCEPT_TITLE.slice(0, 14));
  console.log('  inventory matched rows:', inventoryRows.length);
  log.push({ step: stepNum, name: 'inventory rows visible', after: s14c, note: JSON.stringify({ matchCount: inventoryRows.length }) });

  // ── STEP 15: Lab-map tree filter for "QA8" ──
  console.log('STEP 15: Lab map filter qa8');
  stepNum++;
  const s15a = await shot(page, stepNum, 'before-labmap-filter-qa8');
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const inp = document.getElementById('treeSearch');
    if (inp) {
      inp.value = 'QA8';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1500);
  const s15b = await shot(page, stepNum, 'after-labmap-filter-qa8');
  log.push({ step: stepNum, name: 'lab-map filter qa8', before: s15a, after: s15b });

  const labMapTree = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.tree-node, [data-slug]'));
    return nodes.map((n) => ({
      slug: n.getAttribute('data-slug') || '',
      text: (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
    })).filter((n) => n.slug.includes('qa8') || n.text.toLowerCase().includes('qa8')).slice(0, 20);
  });
  console.log('  labmap matches for qa8:', labMapTree.length);

  // ── STEP 16: open bottle A popup standalone to check pill colors, icons, Of rendering ──
  console.log('STEP 16: open bottle A popup directly');
  stepNum++;
  const s16a = await shot(page, stepNum, 'before-open-bottleA-direct');
  await page.evaluate((p) => Lab.editorModal.open(p), BOTTLE_A_PATH);
  await page.waitForTimeout(3000);
  const s16b = await shot(page, stepNum, 'after-open-bottleA-direct');
  log.push({ step: stepNum, name: 'open bottle A popup directly', before: s16a, after: s16b });

  const aPopupDetails = await page.evaluate(() => {
    const bc = document.querySelector('.em-breadcrumb, [class*="breadcrumb"]');
    const fieldRows = Array.from(document.querySelectorAll('.em-fields tr, .em-fields li, .em-field')).map((r) => r.innerText.replace(/\s+/g, ' ').trim());
    const ofPill = document.querySelector('[data-of-pill]');
    const ofPillInfo = ofPill ? {
      html: ofPill.outerHTML.slice(0, 400),
      hasChildAnchor: Boolean(ofPill.querySelector('a')),
      childClass: ofPill.firstElementChild ? ofPill.firstElementChild.className : '',
    } : null;
    return {
      breadcrumbText: bc ? bc.innerText.replace(/\s+/g, ' ').trim() : null,
      fieldRows: fieldRows.slice(0, 20),
      ofPill: ofPillInfo,
    };
  });
  console.log('  bottle A popup details:', JSON.stringify(aPopupDetails).slice(0, 400));

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);

  // ── STEP 17: Check backlink rendering on concept page (wiki) ──
  console.log('STEP 17: Wiki view of concept');
  stepNum++;
  const s17a = await shot(page, stepNum, 'before-wiki-concept');
  const conceptDocSlug = CONCEPT_SLUG; // e.g. resources/abc
  await page.goto(`${BASE}/app/wiki.html?doc=docs/${conceptDocSlug}.md`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const s17b = await shot(page, stepNum, 'after-wiki-concept');
  log.push({ step: stepNum, name: 'wiki view of concept', before: s17a, after: s17b });

  // ── CLEANUP ──
  console.log('\nCleanup: deleting test artifacts from GitHub...');
  for (const p of cleanup) {
    try {
      const sha = execSync(`gh api "repos/${REPO}/contents/${p}" --jq .sha`, { stdio: 'pipe' }).toString().trim();
      execSync(`gh api -X DELETE "repos/${REPO}/contents/${p}" -f message="qa-cycle-8: cleanup" -f sha="${sha}"`, { stdio: 'pipe' });
      console.log(`  deleted ${p}`);
    } catch (e) {
      console.log(`  FAILED to delete ${p}: ${e.message.slice(0, 150)}`);
    }
  }

  await browser.close();

  fs.writeFileSync(`${SHOTS}/_log.json`, JSON.stringify({
    ts: TS,
    concept: { path: CONCEPT_PATH, slug: CONCEPT_SLUG, title: CONCEPT_TITLE, instanceCountBefore: 0 },
    bottleA: BOTTLE_A_PATH,
    bottleB: BOTTLE_B_PATH,
    baselineInstanceRows: baselineInstances.bottleSlugs.length,
    afterInstanceRows: afterInstances.bottleRows.length,
    afterHasA: afterInstances.hasA,
    afterHasB: afterInstances.hasB,
    locBaseline: { total: locBaseline.total },
    locAfter,
    linkIndex: { total: linkIndex.total, hasA: linkHasA, hasB: linkHasB },
    bottleAPopup,
    bottleBPopup,
    aPopupDetails,
    inventoryRowMatches: inventoryRows.length,
    labMapMatchesForQa8: labMapTree.length,
    log,
    cleanup,
  }, null, 2));

  console.log(`\nDone. ${log.length} action entries, log at ${SHOTS}/_log.json`);
  console.log(`\nSummary:`);
  console.log(`  concept: ${CONCEPT_TITLE} (${CONCEPT_SLUG})`);
  console.log(`  baseline instance rows: ${baselineInstances.bottleSlugs.length} | after: ${afterInstances.bottleRows.length} | hasA/hasB: ${afterInstances.hasA}/${afterInstances.hasB}`);
  console.log(`  location cabinet-chemical: baseline ${locBaseline.total} / after hasA ${locAfter.hasA} hasB ${locAfter.hasB}`);
  console.log(`  link-index: total ${linkIndex.total} hasA ${linkHasA} hasB ${linkHasB}`);
})();
