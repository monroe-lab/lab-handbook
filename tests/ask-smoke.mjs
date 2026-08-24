// Smoke test for the "Ask the handbook" assistant (app/js/ask.js).
// No real Gemini key needed: retrieval is tested directly (fully local),
// and the Gemini HTTP call is mocked via Playwright route interception to
// exercise the full ask flow including [[slug]] → pill rendering.
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const token = execSync('gh auth token', { encoding: 'utf8' }).trim();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addInitScript(([tok]) => {
  localStorage.setItem('gh_lab_token', tok);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe' }));
  sessionStorage.setItem('monroe-lab-auth', 'true');
  // Fake key/model so the panel skips setup and the mocked endpoint is used
  localStorage.setItem('gemini_api_key', 'TEST-KEY');
  localStorage.setItem('gemini_model', 'gemini-2.0-flash');
}, [token]);

// Mock the Gemini API: echo an answer citing a real slug
await context.route('**/generativelanguage.googleapis.com/**', async (route) => {
  if (route.request().url().includes(':generateContent')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'The agarose is in the flammable cabinet. See [[resources/agarose]].' }] } }],
      }),
    });
  } else {
    await route.continue();
  }
});

const page = await context.newPage();
const fails = [];
async function check(label, fn) {
  try { await fn(); console.log('PASS', label); }
  catch (e) { fails.push(label); console.log('FAIL', label, '—', e.message); }
}

await page.goto(`${BASE}/app/index.html`, { waitUntil: 'networkidle' });

await check('ask FAB renders on dashboard', async () => {
  await page.waitForSelector('#ask-fab', { timeout: 15000 });
});

await check('retrieval builds grounded context for "where is the agarose"', async () => {
  const ctx = await page.evaluate(() => Lab.ask._buildContext('where is the agarose'));
  if (!/SOURCE \[\[/.test(ctx)) throw new Error('no SOURCE blocks: ' + ctx.slice(0, 120));
  if (!/agarose/i.test(ctx)) throw new Error('agarose not retrieved');
});

await check('typo "ha5" fuzzy-retrieves hia5 sources', async () => {
  const ctx = await page.evaluate(() => Lab.ask._buildContext('what is ha5'));
  if (!/hia5/i.test(ctx)) throw new Error('hia5 not in fuzzy context: ' + ctx.slice(0, 200));
});

await check('panel opens and accepts a question', async () => {
  await page.click('#ask-fab');
  await page.waitForSelector('#ask-input', { timeout: 5000 });
  await page.fill('#ask-input', 'where is the agarose?');
  await page.click('#ask-send');
});

await check('mocked answer renders with clickable object pill', async () => {
  await page.waitForFunction(() =>
    [...document.querySelectorAll('#ask-log a.object-pill')].length > 0, undefined, { timeout: 15000 });
  const pill = await page.evaluate(() => {
    const a = document.querySelector('#ask-log a.object-pill');
    return { text: a.textContent.trim(), cursor: a.style.cursor };
  });
  if (!/agarose/i.test(pill.text)) throw new Error('pill text: ' + pill.text);
});

await check('key settings reachable from header', async () => {
  await page.click('#ask-key-btn');
  await page.waitForSelector('#ask-key-input', { timeout: 5000 });
});

await browser.close();
if (fails.length) { console.log(`\n${fails.length} FAILURE(S)`); process.exit(1); }
console.log('\nAll ask-assistant smoke checks passed.');
