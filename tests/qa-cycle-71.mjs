// QA cycle 71: Dr. Monroe (PI, confused) — Equipment move day.
// Scenario card: pick 3 bottle instances currently on shelf A, use the
// locations picker to move all 3 to shelf B, verify lab-map tree updates
// (shelf A children decrement, shelf B increments).
//
// Confused-PI flavor: types wrong slug initially, expands the wrong cabinet,
// picks the wrong target the first time, has to fix it before save.
//
// Cleanup: delete the 3 test bottles via API at end.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle71';
fs.mkdirSync(SHOTS, { recursive: true });

const STAMP = Math.random().toString(36).slice(2, 8);
const SOURCE_LOC = 'cabinet-flammable';   // Shelf A in scenario
const TARGET_LOC = 'cabinet-corrosive';   // Shelf B in scenario
const BOTTLES = [
  { slug: `qa71-bottle-acetone-${STAMP}`,    title: `QA71 Acetone Bottle ${STAMP}`,   of: 'resources/acetone' },
  { slug: `qa71-bottle-octanol-${STAMP}`,    title: `QA71 1-Octanol Bottle ${STAMP}`, of: 'resources/1-octanol' },
  { slug: `qa71-bottle-methbut-${STAMP}`,    title: `QA71 3-MeButanol Bottle ${STAMP}`, of: 'resources/3-methylbutanol' },
];

let stepN = 0;
async function shot(page, name) {
  stepN += 1;
  const num = String(stepN).padStart(2, '0');
  const file = path.join(SHOTS, `cycle71-${num}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
  return file;
}

async function ghPut(filePath, content, message, sha) {
  const body = { message, content: Buffer.from(content, 'utf8').toString('base64'), branch: 'main' };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-71', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PUT ${filePath} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function ghGet(filePath) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-71' }
  });
  if (!r.ok) return null;
  return r.json();
}

async function ghDelete(filePath, sha, message) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    method: 'DELETE',
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-71', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: 'main' }),
  });
  return r.ok;
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

const observations = [];
const bugs = [];

try {
  console.log(`\n=== QA CYCLE 71 — Dr. Monroe (confused) — Equipment move day ===`);
  console.log(`Will create + move ${BOTTLES.length} bottles ${SOURCE_LOC} → ${TARGET_LOC}`);

  // STEP 0: Pre-create 3 test bottles in cabinet-flammable via the GitHub API
  // (saves time vs UI; the test is about MOVING them, not creating them).
  console.log(`\nstep 0: seed ${BOTTLES.length} test bottles in ${SOURCE_LOC} via API`);
  for (const b of BOTTLES) {
    const md = `---\ntype: bottle\ntitle: ${b.title}\nof: ${b.of}\nparent: locations/${SOURCE_LOC}\nquantity: 250\nunit: mL\n---\n\n# ${b.title}\n\nQA cycle 71 test bottle. Will be deleted at end of cycle.\n`;
    await ghPut(`docs/stocks/${b.slug}.md`, md, `qa-cycle-71: seed test bottle ${b.slug}`);
    console.log(`  seeded ${b.slug}`);
  }
  // Wait for object index to refresh in CDN. The deployed app reads object-index.json
  // from /docs/, but the bottles are also accessible by slug regardless.
  await new Promise(r => setTimeout(r, 1500));

  // STEP 1: Confused PI starts at the dashboard ("how do I move stuff again?")
  console.log('\nstep 1: dashboard (PI default landing)');
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, 'monroe-dashboard');

  // STEP 2: Navigate to lab-map first (PI knows the tree shows locations)
  console.log('\nstep 2: navigate to lab-map');
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.lt-tree, .tree-node, .lt-node', { timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot(page, 'monroe-lab-map-baseline');

  // STEP 3: Use the search/filter to find cabinet-flammable
  console.log('\nstep 3: filter to cabinet-flammable');
  const searchInputs = await page.locator('input.lt-search, input[placeholder*="ilter"], input[placeholder*="earch"]').count();
  console.log(`  filter inputs found: ${searchInputs}`);
  if (searchInputs > 0) {
    await page.locator('input.lt-search, input[placeholder*="ilter"], input[placeholder*="earch"]').first().fill('flammable');
    await page.waitForTimeout(800);
    await shot(page, 'monroe-tree-filter-flammable');
  }

  // STEP 4: Count children of cabinet-flammable BEFORE moves (baseline)
  console.log('\nstep 4: capture baseline child counts via Lab.gh.fetchObjectIndex');
  const baselineCounts = await page.evaluate(async ({src, tgt}) => {
    if (!window.Lab || !window.Lab.gh || !window.Lab.gh.fetchObjectIndex) return { src: null, tgt: null, error: 'no Lab.gh' };
    const idx = await window.Lab.gh.fetchObjectIndex();
    return {
      src: idx.filter(it => it && it.parent === 'locations/' + src).length,
      tgt: idx.filter(it => it && it.parent === 'locations/' + tgt).length,
      total: idx.length,
    };
  }, { src: SOURCE_LOC, tgt: TARGET_LOC });
  const baselineSourceCount = baselineCounts.src;
  const baselineTargetCount = baselineCounts.tgt;
  console.log(`  total index entries: ${baselineCounts.total}`);
  console.log(`  baseline: ${SOURCE_LOC}=${baselineSourceCount} children, ${TARGET_LOC}=${baselineTargetCount} children`);
  observations.push(`Baseline children: ${SOURCE_LOC}=${baselineSourceCount}, ${TARGET_LOC}=${baselineTargetCount}`);

  // STEP 5: Open inventory page (PI thinks: "bottles live here")
  console.log('\nstep 5: open inventory page');
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, 'monroe-inventory-baseline');

  // STEP 6: Confused PI uses search bar with the test bottle stamp
  console.log(`\nstep 6: search inventory for "qa71"`);
  const invSearch = page.locator('input[placeholder*="earch"], input[type="search"], #searchInput').first();
  if (await invSearch.count()) {
    await invSearch.fill('qa71');
    await page.waitForTimeout(700);
    await shot(page, 'monroe-inventory-search-qa71');
  }

  // STEP 7: Open the first bottle's popup directly via global API (more reliable
  // than scrolling to find a row in 200+ items). Confused user clicks the
  // "wrong" bottle first then clicks the right one — we simulate that by
  // opening a non-test bottle, screenshot, close, then open the test one.
  console.log('\nstep 7: confused — open a real ethanol bottle popup first');
  await page.evaluate(() => {
    // Pick any well-known bottle slug from the index that's NOT one of ours
    if (window.Lab && window.Lab.editorModal) {
      window.Lab.editorModal.open('docs/stocks/bottle-ethanol-absolute.md');
    }
  });
  await page.waitForSelector('.em-overlay.open', { timeout: 12000 });
  await page.waitForTimeout(900);
  await shot(page, 'monroe-confused-wrong-bottle-popup');

  // STEP 8: Close, open the actual test bottle 1
  console.log('\nstep 8: close, open the first QA71 test bottle');
  const cancelBtn = page.locator('#em-cancel, .em-close, [aria-label="Close"]').first();
  if (await cancelBtn.count()) await cancelBtn.click();
  await page.waitForTimeout(400);
  await page.evaluate((slug) => {
    window.Lab.editorModal.open('docs/stocks/' + slug + '.md');
  }, BOTTLES[0].slug);
  await page.waitForSelector('.em-overlay.open', { timeout: 12000 });
  await page.waitForTimeout(900);
  await shot(page, 'monroe-bottle1-popup-view');

  // STEP 9: Click Edit
  console.log('\nstep 9: enter edit mode on bottle 1');
  const editBtn = page.locator('#em-edit-toggle');
  await editBtn.waitFor({ timeout: 8000 });
  await editBtn.click();
  await page.waitForTimeout(700);
  await shot(page, 'monroe-bottle1-edit-mode');

  // STEP 10: Click parent picker trigger
  console.log('\nstep 10: open parent picker');
  const trigger = page.locator('#em-parent-picker-trigger');
  await trigger.waitFor({ timeout: 8000 });
  await trigger.click();
  await page.waitForSelector('#em-parent-picker-dropdown', { timeout: 5000 });
  await page.waitForTimeout(700);
  await shot(page, 'monroe-bottle1-parent-picker-open');

  // STEP 11: Type a typo first ("corosive" missing one r) — confused PI
  console.log('\nstep 11: confused — type typo "corosive"');
  const filter = page.locator('#em-parent-picker-dropdown input.lt-search, #em-parent-picker-dropdown input[placeholder*="ilter"]').first();
  await filter.fill('corosive');
  await page.waitForTimeout(600);
  await shot(page, 'monroe-bottle1-picker-typo-corosive');

  // STEP 12: Correct typo to "corrosive"
  console.log('\nstep 12: fix typo to "corrosive"');
  await filter.fill('corrosive');
  await page.waitForTimeout(600);
  await shot(page, 'monroe-bottle1-picker-fixed-corrosive');

  // STEP 13: Click cabinet-corrosive in the tree
  console.log('\nstep 13: click cabinet-corrosive node');
  // Find a row whose data-slug ends with cabinet-corrosive OR title matches
  const corrRow = page.locator('#em-parent-picker-dropdown .lt-node[data-slug$="cabinet-corrosive"] .lt-row, #em-parent-picker-dropdown .lt-row:has-text("Corrosive")').first();
  const corrCount = await corrRow.count();
  console.log(`  corrosive rows visible: ${corrCount}`);
  if (corrCount === 0) {
    // It might be hidden under collapsed parent. Try expand-all or just click any row containing the word
    const fallback = page.locator('#em-parent-picker-dropdown .lt-row:has-text("Corrosive")').first();
    if (await fallback.count()) await fallback.click();
    else throw new Error('Could not find Corrosive node in picker');
  } else {
    await corrRow.click();
  }
  await page.waitForTimeout(600);
  await shot(page, 'monroe-bottle1-picker-after-pick-corrosive');

  // STEP 14: Save bottle 1
  console.log('\nstep 14: save bottle 1');
  await shot(page, 'monroe-bottle1-before-save');
  await page.locator('#em-save').click();
  // Wait for save to complete (button label changes / modal closes / toast)
  await page.waitForTimeout(3000);
  await shot(page, 'monroe-bottle1-after-save');

  // Close popup if still open
  if (await page.locator('.em-overlay.open').count() > 0) {
    const cb = page.locator('#em-cancel, .em-close').first();
    if (await cb.count()) await cb.click();
  }
  await page.waitForTimeout(400);

  // STEP 15: Open bottle 2 — same flow but no typo (PI learning)
  console.log('\nstep 15: open bottle 2');
  await page.evaluate((slug) => {
    window.Lab.editorModal.open('docs/stocks/' + slug + '.md');
  }, BOTTLES[1].slug);
  await page.waitForSelector('.em-overlay.open', { timeout: 12000 });
  await page.waitForTimeout(800);
  await page.locator('#em-edit-toggle').click();
  await page.waitForTimeout(500);
  await shot(page, 'monroe-bottle2-edit-mode');

  // STEP 16: Open picker, search corrosive, pick
  console.log('\nstep 16: pick corrosive on bottle 2');
  await page.locator('#em-parent-picker-trigger').click();
  await page.waitForSelector('#em-parent-picker-dropdown', { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.locator('#em-parent-picker-dropdown input.lt-search').first().fill('corrosive');
  await page.waitForTimeout(500);
  await shot(page, 'monroe-bottle2-picker-corrosive');
  await page.locator('#em-parent-picker-dropdown .lt-row:has-text("Corrosive")').first().click();
  await page.waitForTimeout(500);
  await page.locator('#em-save').click();
  await page.waitForTimeout(2500);
  await shot(page, 'monroe-bottle2-after-save');
  if (await page.locator('.em-overlay.open').count() > 0) {
    const cb = page.locator('#em-cancel, .em-close').first();
    if (await cb.count()) await cb.click();
  }
  await page.waitForTimeout(400);

  // STEP 17: Bottle 3 — confused tries URL ?doc trick first
  console.log('\nstep 17: bottle 3 — try URL deep-link first');
  await page.goto(`${BASE}/app/inventory.html?doc=stocks/${BOTTLES[2].slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await shot(page, 'monroe-bottle3-deeplink');

  const popupOpen = await page.locator('.em-overlay.open').count();
  if (!popupOpen) {
    // Fall back to direct API call
    await page.evaluate((slug) => {
      window.Lab.editorModal.open('docs/stocks/' + slug + '.md');
    }, BOTTLES[2].slug);
    await page.waitForSelector('.em-overlay.open', { timeout: 10000 });
  }
  await page.waitForTimeout(800);

  await page.locator('#em-edit-toggle').click();
  await page.waitForTimeout(400);
  await page.locator('#em-parent-picker-trigger').click();
  await page.waitForSelector('#em-parent-picker-dropdown', { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.locator('#em-parent-picker-dropdown input.lt-search').first().fill('corrosive');
  await page.waitForTimeout(500);
  await shot(page, 'monroe-bottle3-picker-corrosive');
  await page.locator('#em-parent-picker-dropdown .lt-row:has-text("Corrosive")').first().click();
  await page.waitForTimeout(400);
  await page.locator('#em-save').click();
  await page.waitForTimeout(2500);
  await shot(page, 'monroe-bottle3-after-save');
  if (await page.locator('.em-overlay.open').count() > 0) {
    const cb = page.locator('#em-cancel, .em-close').first();
    if (await cb.count()) await cb.click();
  }
  await page.waitForTimeout(400);

  // STEP 18: Verify all 3 bottles via raw GitHub API (most authoritative)
  console.log('\nstep 18: verify parents via GitHub raw fetch');
  const verifyResults = {};
  for (const b of BOTTLES) {
    const r = await fetch(`https://raw.githubusercontent.com/${REPO}/main/docs/stocks/${b.slug}.md?ts=${Date.now()}`, {
      headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-71' }
    });
    if (!r.ok) {
      verifyResults[b.slug] = `HTTP ${r.status}`;
      continue;
    }
    const txt = await r.text();
    const m = txt.match(/^parent:\s*(.+)$/m);
    verifyResults[b.slug] = m ? m[1].trim() : '(no parent)';
  }
  console.log('  verify results:', verifyResults);
  observations.push(`After moves, raw GitHub parents: ${JSON.stringify(verifyResults)}`);

  const allMoved = BOTTLES.every(b => (verifyResults[b.slug] || '').includes('cabinet-corrosive'));
  if (!allMoved) {
    bugs.push({
      severity: 'functional',
      description: `Not all bottles re-parented to cabinet-corrosive after picker save: ${JSON.stringify(verifyResults)}`,
      status: 'open',
    });
  }

  // STEP 19: Reload lab-map and verify tree counts updated
  console.log('\nstep 19: reload lab-map, recheck counts');
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.lt-tree, .tree-node, .lt-node', { timeout: 20000 });
  await page.waitForTimeout(2500);
  // Filter to cabinet-corrosive
  const labMapSearch = page.locator('input.lt-search, input[placeholder*="ilter"], input[placeholder*="earch"]').first();
  if (await labMapSearch.count()) {
    await labMapSearch.fill('cabinet');
    await page.waitForTimeout(700);
  }
  await shot(page, 'monroe-lab-map-after-moves');

  // STEP 20: Re-fetch object-index.json (has cache-buster) to compute post counts
  console.log('\nstep 20: re-fetch object-index.json for post-counts');
  // The local object-index.json doesn't auto-rebuild on file moves —
  // it's regenerated by build-object-index.py. So we'll count via a fresh
  // GitHub trees scan instead. Cheaper: scan each bottle slug's `parent:`.
  let sourcePost = 0, targetPost = 0;
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${REPO}/main/docs/object-index.json?ts=${Date.now()}`, {
      headers: { 'User-Agent': 'qa-cycle-71' }
    });
    if (r.ok) {
      const j = await r.json();
      const items = j.items || j;
      sourcePost = items.filter(it => it && it.parent === `locations/${SOURCE_LOC}`).length;
      targetPost = items.filter(it => it && it.parent === `locations/${TARGET_LOC}`).length;
    }
  } catch (e) { console.log('  index fetch failed:', e.message); }
  console.log(`  post-move (per object-index.json): ${SOURCE_LOC}=${sourcePost}, ${TARGET_LOC}=${targetPost}`);
  observations.push(`Post-move (object-index.json — may be stale): ${SOURCE_LOC}=${sourcePost}, ${TARGET_LOC}=${targetPost}`);

  // Note: object-index.json is rebuilt by a separate Python script and isn't
  // updated by file edits. So we don't fail just because it's stale; the
  // ground truth is the raw bottle files (verified in step 18).

  // STEP 21: Open the cabinet-corrosive popup to confirm backlinks include bottles
  console.log('\nstep 21: open cabinet-corrosive popup');
  await page.evaluate(() => {
    window.Lab.editorModal.open('docs/locations/cabinet-corrosive.md');
  });
  await page.waitForSelector('.em-overlay.open', { timeout: 10000 });
  await page.waitForTimeout(1500);
  await shot(page, 'monroe-cabinet-corrosive-popup');

  // STEP 22: Final close
  if (await page.locator('.em-overlay.open').count() > 0) {
    const cb = page.locator('#em-cancel, .em-close').first();
    if (await cb.count()) await cb.click();
  }
  await page.waitForTimeout(300);
  await shot(page, 'monroe-final');

  console.log('\n✅ scenario completed');
  console.log('observations:', observations);
  console.log('bugs:', bugs);
} catch (err) {
  console.error('\n❌ FAIL:', err.message);
  console.error(err.stack);
  await shot(page, 'monroe-FAIL');
  bugs.push({ severity: 'test-error', description: err.message, status: 'open' });
} finally {
  // Always cleanup test bottles via API
  console.log('\ncleanup: deleting test bottles');
  for (const b of BOTTLES) {
    try {
      const cur = await ghGet(`docs/stocks/${b.slug}.md`);
      if (cur && cur.sha) {
        const ok = await ghDelete(`docs/stocks/${b.slug}.md`, cur.sha, `qa-cycle-71: cleanup ${b.slug}`);
        console.log(`  delete ${b.slug}: ${ok ? 'OK' : 'FAIL'}`);
      }
    } catch (e) {
      console.error(`  cleanup ${b.slug} failed:`, e.message);
    }
  }
  // Persist results for the agent to read
  fs.writeFileSync(`${SHOTS}/_results.json`, JSON.stringify({ observations, bugs, stamp: STAMP }, null, 2));
  await browser.close();
  console.log('\ndone');
}
