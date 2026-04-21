import { chromium } from 'playwright';
import { execSync } from 'child_process';
const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const DIR = '/tmp/qa-screenshots/cycle4-verify';
import fs from 'fs';
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((t) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', t);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  await page.goto(`${BASE}/app/protocols.html?doc=wet-lab/extraction/qiagen-dneasy-extraction`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('a.object-pill')).find(a => /ethanol-absolute/.test(a.getAttribute('href') || ''));
    el && el.click();
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const r = document.querySelector('.em-overlay.open .em-col-contents .em-backlink-row[data-slug="stocks/bottle-ethanol-absolute"]');
    r && r.click();
  });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: `${DIR}/01-bottle-popup-of-is-pill.png` });
  console.log('Saved: 01-bottle-popup-of-is-pill.png');

  // Click the Of pill — should open the reagent popup
  const clickedOf = await page.evaluate(() => {
    const pill = document.querySelector('.em-overlay.open [data-of-pill] a.object-pill');
    if (!pill) return { clicked: false };
    pill.click();
    return { clicked: true, text: pill.textContent.trim() };
  });
  console.log('Clicked Of-pill:', clickedOf);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/02-after-click-of-navigates-to-concept.png` });

  const after = await page.evaluate(() => {
    const overlay = document.querySelector('.em-overlay.open');
    const title = overlay?.querySelector('#em-title')?.textContent.trim();
    const typePill = Array.from(overlay?.querySelectorAll('.em-col-fields .object-pill') || []).find(p => /Reagent/i.test(p.textContent))?.textContent.trim();
    return { title, typePill };
  });
  console.log('After click Of:', after);
  // Expect title to be "Ethanol Absolute" and type to be Reagent — confirms navigation from bottle → concept

  await browser.close();
})();
