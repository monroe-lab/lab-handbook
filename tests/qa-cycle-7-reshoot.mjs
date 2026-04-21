/**
 * Re-capture key views from cycle 7 without fullPage, since the source
 * data (box + tubes) was cleaned up, we just re-create small artifacts
 * quickly, re-shoot, then clean up again.
 *
 * Produces viewport-sized screenshots for popup views.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle7-reshoot';
const TS = Date.now().toString(36);
fs.mkdirSync(SHOTS, { recursive: true });

const BOX_SLUG = `box-libprep-v2-${TS}`;
const TUBE_DEFS = [
  { slug: `tube-libprep-v2-kapa-${TS}`, title: 'KAPA HyperPrep Tube', pos: 'A1', label2: 'KAPA\nA1' },
  { slug: `tube-libprep-v2-nebnext-${TS}`, title: 'NEBNext Ultra II Tube', pos: 'C5', label2: 'NEB\nC5' },
  { slug: `tube-libprep-v2-twist-${TS}`, title: 'Twist EF Library Tube', pos: 'J10', label2: 'TWST\nJ10' },
];

const cleanup = [];
let n = 0;
async function shot(page, label) {
  n++;
  const p = `${SHOTS}/${String(n).padStart(2,'0')}-${label}.png`;
  await page.screenshot({ path: p });
  return p;
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
  page.on('pageerror', (err) => console.log(' pageerr', err.message));

  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Create box
  const boxPath = `docs/locations/${BOX_SLUG}.md`;
  const boxMeta = {
    type: 'box', title: 'Library Prep Kit Storage v2',
    parent: 'locations/shelf-minus80-a-1', grid: '10x10',
    label_1: 'Library Prep Kits\n(NEB / KAPA / Twist)', label_2: 'LIB-PREP',
    notes: 'Re-shoot.', created_at: new Date().toISOString(), created_by: 'greymonroe',
  };
  await page.evaluate(async ({ path, meta }) => {
    const body = '\n# ' + meta.title + '\n\nLibrary prep reagents for [[samples/sample-pistachio-4]] on [[locations/shelf-minus80-a-1]] in [[locations/freezer-minus80-a]].\n';
    const fm = Lab.buildFrontmatter(meta, body);
    const saved = await Lab.gh.saveFile(path, fm, null, 'qa-cycle-7-reshoot: create box');
    Lab.gh.patchObjectIndex(path, meta);
    if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
    return saved;
  }, { path: boxPath, meta: boxMeta });
  cleanup.push(boxPath);

  // Create tubes
  for (const { slug, title, pos, label2 } of TUBE_DEFS) {
    const path = `docs/locations/${slug}.md`;
    const meta = {
      type: 'tube', title,
      parent: `locations/${BOX_SLUG}`, position: pos,
      label_1: `${title}\n${new Date().toISOString().slice(0, 10)}`, label_2: label2,
      notes: `tube ${pos}`, created_at: new Date().toISOString(), created_by: 'greymonroe',
    };
    await page.evaluate(async ({ path, meta }) => {
      const body = '\n# ' + meta.title + '\n\nIn [[locations/' + meta.parent.split('/').pop() + ']] at ' + meta.position + '.\n';
      const fm = Lab.buildFrontmatter(meta, body);
      await Lab.gh.saveFile(path, fm, null, 'qa-cycle-7-reshoot: create tube ' + meta.position);
      Lab.gh.patchObjectIndex(path, meta);
      if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
    }, { path, meta });
    cleanup.push(path);
  }

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Shot 1: box popup with 3 tubes
  await page.evaluate((p) => Lab.editorModal.open(p), boxPath);
  await page.waitForTimeout(3000);
  await shot(page, 'box-popup-with-3-tubes');

  // Shot 2: tube C5 popup
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const tubeC5Path = `docs/locations/${TUBE_DEFS[1].slug}.md`;
  await page.evaluate((p) => Lab.editorModal.open(p), tubeC5Path);
  await page.waitForTimeout(2000);
  await shot(page, 'tube-c5-popup');

  // Shot 3: tube A1 popup (top-left)
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const tubeA1Path = `docs/locations/${TUBE_DEFS[0].slug}.md`;
  await page.evaluate((p) => Lab.editorModal.open(p), tubeA1Path);
  await page.waitForTimeout(2000);
  await shot(page, 'tube-a1-popup');

  // Shot 4: tube J10 popup (bottom-right)
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  const tubeJ10Path = `docs/locations/${TUBE_DEFS[2].slug}.md`;
  await page.evaluate((p) => Lab.editorModal.open(p), tubeJ10Path);
  await page.waitForTimeout(2000);
  await shot(page, 'tube-j10-popup');

  // Shot 5: shelf popup with new box visible
  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);
  await page.evaluate(() => Lab.editorModal.open('docs/locations/shelf-minus80-a-1.md'));
  await page.waitForTimeout(2500);
  await shot(page, 'shelf-popup-with-libprep-box');

  // Cleanup
  for (const p of cleanup) {
    try {
      const sha = execSync(`gh api "repos/${REPO}/contents/${p}" --jq .sha`, { stdio: 'pipe' }).toString().trim();
      execSync(`gh api -X DELETE "repos/${REPO}/contents/${p}" -f message="qa-cycle-7-reshoot: cleanup" -f sha="${sha}"`, { stdio: 'pipe' });
      console.log(`deleted ${p}`);
    } catch (e) {
      console.log(`FAILED ${p}: ${e.message.slice(0, 120)}`);
    }
  }

  await browser.close();
  console.log(`Done — screenshots in ${SHOTS}`);
})();
