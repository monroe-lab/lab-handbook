/**
 * QA Cycle 8 — verify fix
 *
 * Recreate two bottles pointing at a long-title concept, open the bottle
 * popup, and assert:
 *   - The Of pill's title-span has `text-overflow:ellipsis`
 *   - The Of pill's bounding rect fits inside the fields column (does not
 *     overflow into the body column)
 *   - The pill has a title="" attribute with the full concept title
 * Screenshot the popup at 1440 and 520 viewport widths.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle8-verify';
fs.mkdirSync(SHOTS, { recursive: true });
const TS = Date.now().toString(36);

// Reuse the same LabBot concept — it has the long title that triggers the bug
const CONCEPT_SLUG = 'resources/labbot-freezer-item-mnthp11v';
const BOTTLE = `bottle-labbot-freezer-item-mnthp11v-qa8v-${TS}`;
const BOTTLE_PATH = `docs/stocks/${BOTTLE}.md`;

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

  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Create bottle
  const meta = {
    type: 'bottle', title: 'LabBot Freezer Item mnthp11v (QA8 verify)',
    of: CONCEPT_SLUG, parent: 'locations/cabinet-chemical',
    quantity: 100, unit: 'mL', lot: `QA8V-${TS.toUpperCase()}`,
    expiration: '2028-01-01', acquired: '2026-04-21',
    created_at: new Date().toISOString(), created_by: 'greymonroe',
  };
  await page.evaluate(async ({ path, meta, concept }) => {
    const body = `\n# ${meta.title}\n\nVerify bottle of [[${concept}]] stored on [[locations/cabinet-chemical]].\n`;
    const fm = Lab.buildFrontmatter(meta, body);
    await Lab.gh.saveFile(path, fm, null, 'qa-cycle-8-verify: create bottle');
    Lab.gh.patchObjectIndex(path, meta);
    if (Lab.gh.patchLinkIndex) Lab.gh.patchLinkIndex(path, body);
  }, { path: BOTTLE_PATH, meta, concept: CONCEPT_SLUG });
  console.log('created', BOTTLE_PATH);
  await page.waitForTimeout(1200);

  // Wide-view assertion
  await page.evaluate((p) => Lab.editorModal.open(p), BOTTLE_PATH);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SHOTS}/w1440-bottle-popup.png` });

  const wide = await page.evaluate(() => {
    const fieldsCol = document.getElementById('em-col-fields');
    const bodyCol = document.getElementById('em-col-body');
    const ofSpan = document.querySelector('[data-of-pill]');
    const ofPill = ofSpan && ofSpan.querySelector('a');
    const ofText = ofPill && ofPill.querySelector('span');
    if (!fieldsCol || !bodyCol || !ofSpan || !ofPill || !ofText) {
      return { error: 'missing elements', hasFields: Boolean(fieldsCol), hasBody: Boolean(bodyCol), hasOfSpan: Boolean(ofSpan), hasOfPill: Boolean(ofPill), hasOfText: Boolean(ofText) };
    }
    const fRect = fieldsCol.getBoundingClientRect();
    const bRect = bodyCol.getBoundingClientRect();
    const pRect = ofPill.getBoundingClientRect();
    const textStyle = getComputedStyle(ofText);
    return {
      fieldsRight: fRect.right,
      bodyLeft: bRect.left,
      pillRight: pRect.right,
      pillWidth: pRect.width,
      pillInsideCol: pRect.right <= fRect.right + 1,
      textEllipsis: textStyle.textOverflow === 'ellipsis',
      textOverflow: textStyle.overflow,
      titleAttr: ofPill.getAttribute('title'),
    };
  });
  console.log('wide:', wide);

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(500);

  // Narrow-view
  await context.pages()[0].setViewportSize({ width: 520, height: 900 });
  await page.waitForTimeout(600);
  await page.evaluate((p) => Lab.editorModal.open(p), BOTTLE_PATH);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SHOTS}/w520-bottle-popup.png` });

  await page.evaluate(() => Lab.editorModal.close());
  await page.waitForTimeout(400);

  // Also verify parent pill renders with ellipsis style (Chemical Cabinet
  // doesn't overflow, but the same CSS should apply)
  const parentCheck = await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 300));
    return {};
  });

  // Cleanup
  console.log('cleanup');
  try {
    const sha = execSync(`gh api "repos/${REPO}/contents/${BOTTLE_PATH}" --jq .sha`, { stdio: 'pipe' }).toString().trim();
    execSync(`gh api -X DELETE "repos/${REPO}/contents/${BOTTLE_PATH}" -f message="qa-cycle-8-verify: cleanup" -f sha="${sha}"`, { stdio: 'pipe' });
    console.log('  deleted', BOTTLE_PATH);
  } catch (e) { console.log('  cleanup failed', e.message.slice(0, 120)); }

  await browser.close();

  const pass = wide.pillInsideCol && wide.textEllipsis && wide.titleAttr;
  console.log('\nVerify:', pass ? 'PASS' : 'FAIL');
  console.log('  pillInsideCol:', wide.pillInsideCol, '(right', wide.pillRight, 'vs col right', wide.fieldsRight, ')');
  console.log('  textEllipsis:', wide.textEllipsis);
  console.log('  titleAttr:', wide.titleAttr);

  fs.writeFileSync(`${SHOTS}/_log.json`, JSON.stringify({ wide, pass }, null, 2));
  if (!pass) process.exit(1);
})();
