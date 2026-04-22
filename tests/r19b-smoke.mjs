// Smoke test for #144/#145/#146 + #143 + project-field fix.
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(([tok]) => {
  localStorage.setItem('github-token', tok);
  sessionStorage.setItem('monroe-lab-auth', 'true');
}, [token]);
const page = await context.newPage();
const fails = [];

async function check(label, fn) {
  try { await fn(); console.log('PASS', label); }
  catch (e) { fails.push({ label, err: e.message }); console.log('FAIL', label, '—', e.message); }
}

// 1. Nav shows the new order with Accessions in position 4, "More" button present.
await check('nav order + More button present', async () => {
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#lab-nav', { timeout: 10000 });
  const labels = await page.$$eval('#lab-nav .lab-nav-tab span:last-child', els => els.map(e => e.textContent));
  const expected = ['Tutorials','Notebooks','Inventory','Accessions','Projects','People','Calendar','Lab Map','Apps','Wiki'];
  for (let i = 0; i < expected.length; i++) {
    if (labels[i] !== expected[i]) throw new Error(`pos ${i}: got ${labels[i]}, want ${expected[i]}`);
  }
  const moreBtn = await page.$('#nav-desktop-more');
  if (!moreBtn) throw new Error('no desktop More button');
});

// 2. Protocols + Waste in overflow popover (programmatic — avoids click-hit-testing flakes).
await check('More popover contains Protocols and Waste', async () => {
  await page.evaluate(() => document.getElementById('nav-desktop-more').click());
  await page.waitForSelector('#nav-desktop-more-popover', { timeout: 5000 });
  const popoverLabels = await page.$$eval('#nav-desktop-more-popover a', els => els.map(e => e.textContent.trim()));
  if (!popoverLabels.some(l => l.includes('Protocols'))) throw new Error('no Protocols in popover: ' + popoverLabels.join(','));
  if (!popoverLabels.some(l => l.includes('Waste'))) throw new Error('no Waste in popover: ' + popoverLabels.join(','));
});

// 3. Accessions project column populated (project field fix).
await check('accessions project column populated for most rows', async () => {
  await page.goto(`${BASE}/app/accessions.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tableBody tr', { timeout: 15000 });
  const projectCells = await page.$$eval('#tableBody tr td:nth-child(3)', els => els.map(e => e.textContent.trim()));
  const withProject = projectCells.filter(t => t.length > 0);
  if (withProject.length < 20) throw new Error(`only ${withProject.length}/${projectCells.length} rows have a project`);
});

// 4. Inventory Add modal shows the two-step kind picker, not the old form.
//    Invoke addItem() directly to sidestep auth gating on the button.
await check('inventory add modal shows kind picker', async () => {
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.addItem === 'function', { timeout: 10000 });
  await page.evaluate(() => window.addItem());
  await page.waitForSelector('#addStepChoice', { state: 'visible', timeout: 5000 });
  const kindCards = await page.$$('#addStepChoice .add-kind-card');
  if (kindCards.length !== 2) throw new Error(`expected 2 kind cards, got ${kindCards.length}`);
  const conceptStepVisible = await page.$eval('#addStepConcept', el => window.getComputedStyle(el).display !== 'none');
  if (conceptStepVisible) throw new Error('concept step is visible before user picks a kind');
});

// 5. Picking "bottle" reveals the search panel with results.
await check('bottle picker surfaces existing concepts', async () => {
  await page.evaluate(() => window.chooseAddKind('bottle'));
  await page.waitForSelector('#bottleResults .bottle-pick-row', { timeout: 10000 });
  const rowCount = await page.$$eval('#bottleResults .bottle-pick-row', els => els.length);
  if (rowCount < 5) throw new Error(`only ${rowCount} rows in picker`);
});

// 6. Wiki pill filter no longer has max-height cap.
await check('wiki type-filter pills fully visible', async () => {
  await page.goto(`${BASE}/app/wiki.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#typeFilter .doc-type-chip', { timeout: 15000 });
  const style = await page.$eval('#typeFilter', el => {
    const cs = window.getComputedStyle(el);
    return { maxHeight: cs.maxHeight, overflowY: cs.overflowY };
  });
  // The fix removed max-height; computed should be 'none'.
  if (style.maxHeight !== 'none') throw new Error(`.doc-type-filter max-height=${style.maxHeight}`);
});

await browser.close();

if (fails.length) {
  console.log(`\n${fails.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll R19b smoke checks passed.');
