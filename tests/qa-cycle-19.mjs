// QA cycle 19 — Kayla Torres (undergrad) + confused + Search every surface
// Exercises the per-page search inputs on inventory, protocols, notebooks, wiki,
// and waste. Tests a real query, a typo that should miss, and an empty string reset.
// Heavy before+after screenshot discipline.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle19';
const GH_TOKEN = execSync('gh auth token').toString().trim();

function log(...a) { console.log('[cycle19]', ...a); }

async function shot(page, name) {
  const path = `${SHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function waitNet(page, ms = 400) {
  try { await page.waitForLoadState('networkidle', { timeout: 2500 }); } catch {}
  await page.waitForTimeout(ms);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const results = { screenshots: [], findings: [] };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => log('PAGEERR', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') log('CONSOLE-ERR', m.text());
  });

  // ───── INVENTORY ─────
  log('step01 inventory baseline');
  await page.goto(`${BASE}/app/inventory.html`);
  await waitNet(page, 900);
  results.screenshots.push(await shot(page, 'step01-inventory-baseline'));

  log('step02 inventory search real term DNeasy');
  await page.fill('#searchInput', 'DNeasy');
  await waitNet(page, 400);
  const invDneasyRows = await page.$$eval('tbody tr', (rows) => rows.length);
  results.findings.push({ invDneasyRows });
  results.screenshots.push(await shot(page, 'step02-inventory-search-dneasy'));

  log('step03 inventory typo (DNeazy)');
  await page.fill('#searchInput', 'DNeazy');
  await waitNet(page, 400);
  const invTypoEmpty = await page.$$eval('.empty-state, tbody tr', (els) => {
    const hasEmpty = els.some((e) => e.classList.contains('empty-state'));
    const rows = els.filter((e) => e.tagName === 'TR').length;
    return { hasEmpty, rows };
  });
  results.findings.push({ invTypoEmpty });
  results.screenshots.push(await shot(page, 'step03-inventory-search-typo'));

  log('step04 inventory weird characters "💎💎💎"');
  await page.fill('#searchInput', '💎💎💎');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step04-inventory-search-emoji'));

  log('step05 inventory HTML-injection attempt');
  await page.fill('#searchInput', '<script>alert(1)</script>');
  await waitNet(page, 400);
  const alertFired = await page.evaluate(() => window.__alertFired === true);
  results.findings.push({ invXssAlert: alertFired });
  results.screenshots.push(await shot(page, 'step05-inventory-search-xss'));

  log('step06 inventory clear');
  await page.fill('#searchInput', '');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step06-inventory-search-cleared'));

  // ───── PROTOCOLS ─────
  log('step07 protocols baseline');
  await page.goto(`${BASE}/app/protocols.html`);
  await waitNet(page, 900);
  results.screenshots.push(await shot(page, 'step07-protocols-baseline'));

  log('step08 protocols search PCR');
  await page.fill('#protoSearch', 'PCR');
  await waitNet(page, 400);
  const protoPcrMatches = await page.$$eval('.proto-item', (els) => els.length);
  results.findings.push({ protoPcrMatches });
  results.screenshots.push(await shot(page, 'step08-protocols-search-pcr'));

  log('step09 protocols typo (Pcer)');
  await page.fill('#protoSearch', 'Pcer');
  await waitNet(page, 400);
  const protoEmpty = await page.$eval('body', (b) => !!b.querySelector('.empty-state'));
  results.findings.push({ protoEmpty });
  results.screenshots.push(await shot(page, 'step09-protocols-search-typo'));

  log('step10 protocols search extractiom (typo of extraction)');
  await page.fill('#protoSearch', 'extractiom');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step10-protocols-search-extractiom'));

  log('step11 protocols search autoclave (specific)');
  await page.fill('#protoSearch', 'autoclave');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step11-protocols-search-autoclave'));

  log('step12 protocols click autoclave result');
  const autoclaveLink = await page.$('.proto-item[data-path*="autoclave"]');
  if (autoclaveLink) {
    await autoclaveLink.click();
    await waitNet(page, 900);
  }
  results.screenshots.push(await shot(page, 'step12-protocols-autoclave-loaded'));

  // ───── NOTEBOOKS ─────
  log('step13 notebooks baseline');
  await page.goto(`${BASE}/app/notebooks.html`);
  await waitNet(page, 900);
  results.screenshots.push(await shot(page, 'step13-notebooks-baseline'));

  log('step14 notebooks search vianney');
  await page.fill('#nbSearch', 'vianney');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step14-notebooks-search-vianney'));

  log('step15 notebooks search XX-NO-MATCH-XX (empty)');
  await page.fill('#nbSearch', 'XX-NO-MATCH-XX');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step15-notebooks-search-nomatch'));

  log('step16 notebooks search with spaces and punctuation "2026 — v"');
  await page.fill('#nbSearch', '2026 — v');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step16-notebooks-search-special'));

  // ───── WIKI ─────
  log('step17 wiki baseline');
  await page.goto(`${BASE}/app/wiki.html`);
  await waitNet(page, 1400);
  results.screenshots.push(await shot(page, 'step17-wiki-baseline'));

  log('step18 wiki search ethanol');
  await page.fill('#docSearch', 'ethanol');
  await waitNet(page, 500);
  results.screenshots.push(await shot(page, 'step18-wiki-search-ethanol'));

  log('step19 wiki search typo ethnaol');
  await page.fill('#docSearch', 'ethnaol');
  await waitNet(page, 500);
  results.screenshots.push(await shot(page, 'step19-wiki-search-typo'));

  log('step20 wiki clear + search "safety"');
  await page.fill('#docSearch', 'safety');
  await waitNet(page, 500);
  results.screenshots.push(await shot(page, 'step20-wiki-search-safety'));

  // ───── WASTE ─────
  log('step21 waste baseline');
  await page.goto(`${BASE}/app/waste.html`);
  await waitNet(page, 900);
  results.screenshots.push(await shot(page, 'step21-waste-baseline'));

  log('step22 waste search paraquat');
  await page.fill('#searchInput', 'paraquat');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step22-waste-search-paraquat'));

  log('step23 waste typo paraqat');
  await page.fill('#searchInput', 'paraqat');
  await waitNet(page, 400);
  results.screenshots.push(await shot(page, 'step23-waste-search-typo'));

  // ───── DASHBOARD ─────
  log('step24 dashboard (no global search?)');
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 900);
  const hasGlobalSearch = await page.$('input[type=search], input[placeholder*=earch]');
  results.findings.push({ dashboardHasSearch: !!hasGlobalSearch });
  results.screenshots.push(await shot(page, 'step24-dashboard-baseline'));

  // ───── PEOPLE (carry-over FAB-NEAR-WIZARD-NEXT-MOBILE repro @ 375px) ─────
  log('step25 people mobile 375 baseline');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/app/people.html`);
  await waitNet(page, 900);
  results.screenshots.push(await shot(page, 'step25-people-mobile-baseline'));

  log('step26 open wizard on mobile — FAB next to Next button?');
  const joinBtn = await page.$('button:has-text("Join the Lab")');
  if (joinBtn) {
    await joinBtn.click();
    await waitNet(page, 600);
  }
  results.screenshots.push(await shot(page, 'step26-people-wizard-open-mobile'));

  // Evaluate overlap: check position of #issue-reporter-btn vs Next button
  const wizardMobileGeom = await page.evaluate(() => {
    const fab = document.querySelector('#issue-reporter-btn');
    const next = Array.from(document.querySelectorAll('button')).find((b) =>
      /next/i.test(b.textContent.trim())
    );
    const fabR = fab?.getBoundingClientRect();
    const nextR = next?.getBoundingClientRect();
    const overlap =
      !!fabR && !!nextR &&
      !(fabR.right < nextR.left || fabR.left > nextR.right || fabR.bottom < nextR.top || fabR.top > nextR.bottom);
    const near =
      !!fabR && !!nextR && Math.abs(fabR.left - nextR.right) < 30 && Math.abs(fabR.bottom - nextR.bottom) < 50;
    return { fabVisible: !!fab && fabR.width > 0, fabR, nextR, overlap, near };
  });
  results.findings.push({ wizardMobileGeom });

  log('step27 close wizard');
  const closeBtn = await page.$('#wizardOverlay button[aria-label*=lose], #wizardOverlay .close, #wizardOverlay [class*=close]');
  if (closeBtn) await closeBtn.click();
  await waitNet(page, 300);
  results.screenshots.push(await shot(page, 'step27-people-wizard-closed'));

  // ───── NOTEBOOKS ?person= repro (desktop) ─────
  log('step28 notebooks?person=vianney-ahn — does param filter?');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/app/notebooks.html?person=vianney-ahn`);
  await waitNet(page, 900);
  const notebooksPersonParamHonored = await page.evaluate(() => {
    // Did the URL param cause the sidebar to highlight or filter to vianney-ahn?
    const search = document.getElementById('nbSearch');
    const tree = document.getElementById('nbTree');
    const txt = tree ? tree.textContent : '';
    return {
      searchValue: search ? search.value : '',
      showsOtherFolders: /Barb M|Erik|Test User|Satoyo|Zi Ye/i.test(txt),
      showsVianney: /Vianney/i.test(txt),
    };
  });
  results.findings.push({ notebooksPersonParamHonored });
  results.screenshots.push(await shot(page, 'step28-notebooks-person-param'));

  await browser.close();

  fs.writeFileSync(`${SHOT_DIR}/_results.json`, JSON.stringify(results, null, 2));
  log('DONE. Screenshots:', results.screenshots.length);
  log('Findings:', JSON.stringify(results.findings, null, 2));
})();
