/**
 * QA cycle 7 verify
 * Confirm breadcrumb dangling-slash fix (commit 25c4999).
 *
 * Strategy: create a deep hierarchy (box under shelf under freezer under room),
 * then open the tube popup at THREE viewport widths:
 *   - 1440 (normal): chain fits on one line, no wrap
 *   - 900 (narrow-ish): chain likely wraps to 2 lines
 *   - 520 (very narrow): chain likely wraps to 3+ lines
 *
 * At each width, inspect:
 *   - Does any line end with a standalone "/" (dangling slash)?
 *   - Do all .lab-breadcrumb pair groups have both a separator (except first)
 *     and a pill?
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle7-verify';
const TS = Date.now().toString(36);
fs.mkdirSync(SHOTS, { recursive: true });

const BOX_SLUG = `box-libprep-verify-${TS}`;
const TUBE_SLUG = `tube-libprep-verify-${TS}`;
const cleanup = [];

async function snap(page, label) {
  const p = `${SHOTS}/${label}.png`;
  await page.screenshot({ path: p });
  return p;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Single context, reused across viewports so the localStorage overlay
  // (patchObjectIndex + patchLinkIndex) persists across size changes.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const boxPath = `docs/locations/${BOX_SLUG}.md`;
  const tubePath = `docs/locations/${TUBE_SLUG}.md`;

  await page.evaluate(async ({ boxPath, tubePath, boxSlug }) => {
    const boxMeta = { type: 'box', title: 'Library Prep Kit Storage (verify)', parent: 'locations/shelf-minus80-a-1', grid: '10x10', label_1: 'LP verify', notes: 'temp' };
    const boxBody = '\n# ' + boxMeta.title + '\n\nOn [[locations/shelf-minus80-a-1]].\n';
    await Lab.gh.saveFile(boxPath, Lab.buildFrontmatter(boxMeta, boxBody), null, 'qa-cycle-7-verify box');
    Lab.gh.patchObjectIndex(boxPath, boxMeta);
    Lab.gh.patchLinkIndex(boxPath, boxBody);

    const tubeMeta = { type: 'tube', title: 'NEBNext Ultra II Tube (verify)', parent: 'locations/' + boxSlug, position: 'C5', label_1: 'verify' };
    const tubeBody = '\n# ' + tubeMeta.title + '\n\nIn [[locations/' + boxSlug + ']] at C5.\n';
    await Lab.gh.saveFile(tubePath, Lab.buildFrontmatter(tubeMeta, tubeBody), null, 'qa-cycle-7-verify tube');
    Lab.gh.patchObjectIndex(tubePath, tubeMeta);
    Lab.gh.patchLinkIndex(tubePath, tubeBody);
  }, { boxPath, tubePath, boxSlug: BOX_SLUG });
  cleanup.push(boxPath, tubePath);

  const widths = [1440, 900, 520];
  const results = [];

  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(300);
    // Close any open modal from previous iteration
    await page.evaluate(() => { if (window.Lab && Lab.editorModal) Lab.editorModal.close(); });
    await page.waitForTimeout(400);
    await page.evaluate((p) => Lab.editorModal.open(p), tubePath);
    await page.waitForTimeout(3000);
    await snap(page, `w${w}-tube-popup`);

    const info = await page.evaluate(() => {
      const bc = document.querySelector('.lab-breadcrumb');
      if (!bc) return { error: 'no breadcrumb' };
      const rect = bc.getBoundingClientRect();
      const lines = {}; // y-bucket => items ordered
      // Walk only the immediate child pair-groups, not the internal separators
      const pairs = Array.from(bc.children);
      pairs.forEach((p) => {
        const r = p.getBoundingClientRect();
        const yKey = Math.round(r.top);
        if (!lines[yKey]) lines[yKey] = [];
        const sep = p.querySelector('span') && p.querySelector('span').textContent === '/' ? '/' : null;
        // Figure out if this group has separator
        const hasSep = Array.from(p.children).some((c) => c.textContent.trim() === '/');
        const text = p.innerText.replace(/\s+/g, ' ').trim();
        lines[yKey].push({ text, hasSep, left: r.left, right: r.right });
      });
      // For each line, check if it ends with just "/"
      const lineSummaries = Object.keys(lines).sort((a, b) => +a - +b).map((k) => {
        const items = lines[k];
        const lastItem = items[items.length - 1];
        const endsWithOrphanSlash = /\/\s*$/.test(lastItem.text) && !/[\w)]/.test(lastItem.text.replace(/\/\s*$/, ''));
        return {
          y: +k,
          items: items.map((i) => i.text),
          lastItemText: lastItem.text,
          endsWithOrphanSlash,
        };
      });
      return {
        fullText: bc.innerText.replace(/\s+/g, ' ').trim(),
        bbox: { w: Math.round(rect.width), h: Math.round(rect.height) },
        lines: lineSummaries,
        pairCount: pairs.length,
      };
    });
    results.push({ width: w, ...info });
    console.log(`w=${w}:`, JSON.stringify(info, null, 2).slice(0, 900));
  }

  // Cleanup
  for (const p of cleanup) {
    try {
      const sha = execSync(`gh api "repos/${REPO}/contents/${p}" --jq .sha`, { stdio: 'pipe' }).toString().trim();
      execSync(`gh api -X DELETE "repos/${REPO}/contents/${p}" -f message="qa-cycle-7-verify: cleanup" -f sha="${sha}"`, { stdio: 'pipe' });
      console.log(`deleted ${p}`);
    } catch (e) {
      console.log(`FAILED ${p}: ${e.message.slice(0, 120)}`);
    }
  }

  await browser.close();
  fs.writeFileSync(`${SHOTS}/_results.json`, JSON.stringify(results, null, 2));
  const orphans = results.flatMap((r) => (r.lines || []).filter((l) => l.endsWithOrphanSlash).map((l) => ({ width: r.width, line: l })));
  console.log('\nOrphan slashes found:', orphans.length);
  if (orphans.length) console.log(JSON.stringify(orphans, null, 2));
  console.log(`Results in ${SHOTS}`);
})();
