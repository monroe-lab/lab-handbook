// R19 smoke test — accession schema overhaul.
// Verifies the live site after deploy.
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addInitScript(([tok]) => {
  try {
    localStorage.setItem('github-token', tok);
    sessionStorage.setItem('monroe-lab-auth', 'true');
  } catch (e) {}
}, [token]);
const page = await context.newPage();
const fails = [];

async function check(label, fn) {
  try { await fn(); console.log('PASS', label); }
  catch (e) { fails.push({ label, err: e.message }); console.log('FAIL', label, '—', e.message); }
}

// 1. Redirect from /sample-tracker/ lands on /app/accessions.html.
await check('old /sample-tracker/ redirects to accessions', async () => {
  await page.goto(`${BASE}/sample-tracker/`, { waitUntil: 'networkidle' });
  if (!page.url().includes('/app/accessions.html')) throw new Error('ended up at ' + page.url());
});

// 2. Accessions page loads the tracker table with ≥200 rows.
await check('accessions page lists 200+ rows', async () => {
  await page.goto(`${BASE}/app/accessions.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#tableBody tr', { timeout: 20000 });
  const rows = await page.$$eval('#tableBody tr', els => els.length);
  if (rows < 200) throw new Error(`only ${rows} rows`);
});

// 3. Stats show complete/in-progress/on-hold counts > 0 collectively.
await check('accessions stats render non-zero', async () => {
  const total = await page.$eval('#statTotal', el => parseInt(el.textContent, 10));
  if (!(total > 200)) throw new Error(`statTotal=${total}`);
});

// 4. FAB present on accessions page.
await check('accessions page loads issue-reporter FAB', async () => {
  await page.waitForSelector('#issue-reporter-btn', { timeout: 10000 });
});

// 5. Nav shows "Accessions" label, not "Samples".
await check('nav label reads "Accessions"', async () => {
  const labels = await page.$$eval('#lab-nav .lab-nav-tab span:last-child', els => els.map(e => e.textContent));
  if (!labels.includes('Accessions')) throw new Error('nav has: ' + labels.join(','));
  if (labels.includes('Samples')) throw new Error('stale "Samples" in nav');
});

// 6. Accession schema includes the new tracker fields.
await check('Lab.types schema registers accession_id + priority + current_blocker', async () => {
  await page.waitForFunction(() => window.Lab && Lab.types && Lab.types.getFields, { timeout: 15000 });
  const keys = await page.evaluate(() => Lab.types.getFields('accession').map(f => f.key));
  const want = ['accession_id', 'species', 'project', 'lead', 'sequencing_type', 'status', 'priority', 'current_blocker', 'detail_sheet_link'];
  const missing = want.filter(k => !keys.includes(k));
  if (missing.length) throw new Error('missing fields: ' + missing.join(',') + ' (got ' + keys.join(',') + ')');
});

// 7. The four new instance types are registered.
await check('instance types sample / extraction / library / pool registered', async () => {
  const result = await page.evaluate(() => {
    const types = ['sample','extraction','library','pool'];
    return types.map(t => ({ type: t, label: Lab.types.get(t).label, group: Lab.types.get(t).group, concept: Lab.types.isConceptType(t) }));
  });
  const miss = result.filter(r => r.label === 'Link' || r.group !== 'accessions' || r.concept !== false);
  if (miss.length) throw new Error('bad: ' + JSON.stringify(miss));
});

await browser.close();

if (fails.length) {
  console.log(`\n${fails.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll R19 smoke checks passed.');
