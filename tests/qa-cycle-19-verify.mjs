// QA cycle 19 verify — post-deploy confirmation of three fixes:
//  (a) notebooks.html honors ?person=<slug> (sidebar pre-filters to that folder)
//  (b) people.html hides #issue-reporter-btn while wizard overlay is open (375px)
//  (c) protocols.html + notebooks.html 0-result empty state shows search_off icon

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle19-verify';
const GH_TOKEN = execSync('gh auth token').toString().trim();

fs.mkdirSync(SHOT_DIR, { recursive: true });
const results = {};

function log(...a) { console.log('[cycle19-verify]', ...a); }

async function waitNet(page, ms = 400) {
  try { await page.waitForLoadState('networkidle', { timeout: 2500 }); } catch {}
  await page.waitForTimeout(ms);
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

  // ── FIX 1: notebooks?person=vianney-ahn ──
  log('01 notebooks?person=vianney-ahn');
  await page.goto(`${BASE}/app/notebooks.html?person=vianney-ahn`);
  await waitNet(page, 1200);
  await page.screenshot({ path: `${SHOT_DIR}/01-notebooks-person-vianney.png` });
  results.personParam = await page.evaluate(() => {
    const search = document.getElementById('nbSearch');
    const tree = document.getElementById('nbTree');
    const txt = tree ? tree.textContent : '';
    return {
      searchValue: search ? search.value : '',
      showsVianney: /vianney/i.test(txt),
      showsOtherFolders: /barb m|erik|test user|zi ye|grey monroe/i.test(txt),
    };
  });

  // ── FIX 2: wizard open hides issue-reporter FAB (375px) ──
  log('02 wizard open at 375px — FAB should be hidden');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/app/people.html`);
  await waitNet(page, 900);
  await page.screenshot({ path: `${SHOT_DIR}/02-people-mobile-baseline.png` });

  const joinBtn = await page.$('button:has-text("Join the Lab")');
  if (joinBtn) await joinBtn.click();
  await waitNet(page, 600);
  await page.screenshot({ path: `${SHOT_DIR}/03-wizard-open-fab-hidden.png` });

  results.wizardFabHidden = await page.evaluate(() => {
    const fab = document.querySelector('#issue-reporter-btn');
    if (!fab) return { fabExists: false, hidden: true };
    const cs = getComputedStyle(fab);
    return {
      fabExists: true,
      display: cs.display,
      hidden: cs.display === 'none',
      bodyHasClass: document.body.classList.contains('wizard-open'),
    };
  });

  // ── FIX 3: empty state icon (protocols) ──
  log('04 protocols empty state');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/app/protocols.html`);
  await waitNet(page, 900);
  await page.fill('#protoSearch', 'XXNOMATCHXX');
  await waitNet(page, 400);
  await page.screenshot({ path: `${SHOT_DIR}/04-protocols-empty-state.png` });
  results.protocolsEmpty = await page.evaluate(() => {
    const empty = document.querySelector('#protoTree .empty-state');
    if (!empty) return { hasEmptyState: false };
    const icon = empty.querySelector('.material-icons-outlined');
    return {
      hasEmptyState: true,
      iconText: icon ? icon.textContent : '',
      text: empty.textContent.trim(),
    };
  });

  // ── FIX 3b: empty state icon (notebooks) ──
  log('05 notebooks empty state');
  await page.goto(`${BASE}/app/notebooks.html`);
  await waitNet(page, 900);
  await page.fill('#nbSearch', 'XXNOMATCHXX');
  await waitNet(page, 400);
  await page.screenshot({ path: `${SHOT_DIR}/05-notebooks-empty-state.png` });
  results.notebooksEmpty = await page.evaluate(() => {
    const empty = document.querySelector('#nbTree .empty-state');
    if (!empty) return { hasEmptyState: false };
    const icon = empty.querySelector('.material-icons-outlined');
    return {
      hasEmptyState: true,
      iconText: icon ? icon.textContent : '',
      text: empty.textContent.trim(),
    };
  });

  await browser.close();
  fs.writeFileSync(`${SHOT_DIR}/_results.json`, JSON.stringify(results, null, 2));
  log('RESULTS', JSON.stringify(results, null, 2));
})();
