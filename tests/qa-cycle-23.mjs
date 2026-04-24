// QA cycle 23 — Kayla Torres (undergrad) + ui_critic modifier
// Scenario: Cross-page wikilink crawl.
// Path: dashboard → protocols list → DNeasy protocol → click [[ethanol-absolute]]
//       → chemical popup → bottle instance → parent cabinet → parent room
// UI-critic focus: verify pill color + icon for EACH hop. Screenshot before+after
// every meaningful action.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle23';
const GH_TOKEN = execSync('gh auth token').toString().trim();

function log(...a) { console.log('[cycle23]', ...a); }

async function shot(page, name) {
  const path = `${SHOT_DIR}/${name}.png`;
  try { await page.screenshot({ path, fullPage: false }); } catch (e) { log('screenshot failed:', name, e.message); }
  return path;
}

async function waitNet(page, ms = 500) {
  try { await page.waitForLoadState('networkidle', { timeout: 3000 }); } catch {}
  await page.waitForTimeout(ms);
}

// Inspect the currently-open editor-modal popup.
async function inspectPopup(page) {
  return await page.evaluate(() => {
    const overlay = document.querySelector('.em-overlay.open');
    if (!overlay) return null;
    const title = overlay.querySelector('#em-title')?.textContent?.trim() || null;
    // Parent pill (the only always-present object-pill inside the fields column)
    // The current object's type comes from the Type field value.
    const typeField = Array.from(overlay.querySelectorAll('.em-field-input'))
      .find(el => el.getAttribute('data-key') === 'type');
    const typeValue = typeField ? (typeField.value || typeField.textContent.trim()) : null;
    // Read-only Type row (view mode): look for .em-field-row containing "Type"
    let roType = null;
    const rows = Array.from(overlay.querySelectorAll('.em-field-row, .em-field'));
    for (const r of rows) {
      const label = r.querySelector('.em-field-label, label')?.textContent?.trim();
      if (label && /^\s*type\s*$/i.test(label)) {
        roType = r.querySelector('.em-field-value, .em-field-readonly')?.textContent?.trim() || null;
        break;
      }
    }
    // Scan all object-pills inside the popup and collect bg color + text + type class
    const pills = Array.from(overlay.querySelectorAll('.object-pill')).map(p => ({
      text: (p.textContent || '').trim(),
      bg: getComputedStyle(p).backgroundColor,
      border: getComputedStyle(p).borderColor,
      color: getComputedStyle(p).color,
      href: p.getAttribute('href'),
    }));
    // Breadcrumb HTML + text
    const crumb = overlay.querySelector('.em-breadcrumb, .em-crumb-wrapper, [class*="breadcrumb"]');
    const crumbText = crumb ? crumb.textContent.replace(/\s+/g, ' ').trim() : null;
    return { title, typeValue, roType, pills, crumbText };
  });
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const results = {
    cycle: 23,
    persona: 'Kayla Torres',
    modifier: 'ui_critic',
    task: 'Cross-page wikilink crawl: dashboard → protocol → chemical popup → bottle popup → cabinet popup → room popup. Verify pill colors + icons match types.js at every hop.',
    screenshots: [],
    findings: [],
    fixes_needed: [],
    hops: [],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (err) => { log('PAGE ERROR:', err.message); results.findings.push({ kind: 'pageerror', message: err.message }); });
  page.on('console', (m) => { if (m.type() === 'error') { log('CONSOLE ERROR:', m.text()); results.findings.push({ kind: 'console-error', text: m.text() }); } });

  // ── 1: Dashboard baseline ──────────────────────────────────────────────
  log('Step 1: Dashboard');
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 1400);
  results.screenshots.push({ step: 1, path: await shot(page, 'step01-dashboard') });

  // ── 2: Protocols page ──────────────────────────────────────────────────
  log('Step 2: Protocols');
  await page.goto(`${BASE}/app/protocols.html`);
  await waitNet(page, 1300);
  results.screenshots.push({ step: 2, path: await shot(page, 'step02-protocols') });

  // Type in the search field if any
  const searchLocator = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
  if (await searchLocator.count()) {
    await searchLocator.fill('DNeasy');
    await page.waitForTimeout(800);
    results.screenshots.push({ step: '2b', path: await shot(page, 'step02b-protocols-search-dneasy') });
  }

  // ── 3: DNeasy protocol via wiki.html ──────────────────────────────────
  log('Step 3: Open DNeasy protocol');
  await page.goto(`${BASE}/app/wiki.html?doc=wet-lab/extraction/qiagen-dneasy-extraction`);
  await waitNet(page, 1800);
  results.screenshots.push({ step: 3, path: await shot(page, 'step03-dneasy-protocol') });
  const protocolState = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim() || null;
    const pill = document.querySelector('.object-pill, .type-pill');
    const pillBg = pill ? getComputedStyle(pill).backgroundColor : null;
    const pillText = pill ? pill.textContent.trim() : null;
    const ethAnchor = Array.from(document.querySelectorAll('a')).find(a => (a.getAttribute('href') || '').includes('ethanol-absolute'));
    return { title, pillBg, pillText, hasEthAnchor: !!ethAnchor, ethHref: ethAnchor?.getAttribute('href'), ethStyle: ethAnchor?.getAttribute('style') };
  });
  log('protocol state:', protocolState);
  results.hops.push({ hop: 'protocol', state: protocolState });

  // ── 4: Click [[ethanol-absolute]] → chemical popup ─────────────────────
  log('Step 4: Click ethanol-absolute → chemical popup');
  results.screenshots.push({ step: '4a-before', path: await shot(page, 'step04a-before-click-ethanol') });
  const ethClick = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('a')).find(x => (x.getAttribute('href') || '').includes('ethanol-absolute'));
    if (a) { a.click(); return { ok: true, text: a.textContent.trim(), style: a.getAttribute('style')?.slice(0, 200), href: a.getAttribute('href') }; }
    return { ok: false };
  });
  log('eth click:', ethClick);
  await page.waitForTimeout(2000);
  results.screenshots.push({ step: '4b-after', path: await shot(page, 'step04b-chemical-popup') });
  const chemState = await inspectPopup(page);
  log('chemical popup state:', chemState);
  results.hops.push({ hop: 'chemical', state: chemState });
  // Visual verification: the chemical should have fa-atom in the Type row and purple pills around it
  // Expected: bg color of the chemical pill (would be on the link we clicked — but that's on the protocol page now behind popup)
  // Expected: pills within the popup that reference the chemical (like of:) should be purple
  if (chemState) {
    const hasPurplePill = chemState.pills.some(p => /rgba?\(\s*106,\s*27,\s*154/.test(p.bg) || /rgba?\(\s*106,\s*27,\s*154/.test(p.border));
    const hasOrangePill = chemState.pills.some(p => /rgba?\(\s*239,\s*108,\s*0/.test(p.bg) || /rgba?\(\s*239,\s*108,\s*0/.test(p.border));
    results.findings.push({ kind: 'chemical-popup-pills', hasPurplePill, hasOrangePill, pills: chemState.pills.slice(0, 5) });
  } else {
    results.fixes_needed.push({ id: 'CHEMICAL-POPUP-DID-NOT-OPEN', issue: `Clicking [[ethanol-absolute]] in protocol did not open an editor-modal popup. eth click result: ${JSON.stringify(ethClick)}` });
  }

  // ── 5: From chemical popup, click a bottle instance ────────────────────
  log('Step 5: Click bottle instance from chemical popup');
  results.screenshots.push({ step: '5a-before', path: await shot(page, 'step05a-before-click-bottle') });
  const bottleClick = await page.evaluate(() => {
    const overlay = document.querySelector('.em-overlay.open');
    if (!overlay) return { ok: false, reason: 'no popup open' };
    // Look at Contents/backlinks pane for bottle rows
    const rows = Array.from(overlay.querySelectorAll('.em-backlink-row, [data-slug]'));
    const bottleRow = rows.find(r => {
      const slug = r.getAttribute('data-slug') || '';
      return slug.includes('bottle-ethanol-absolute') || slug.includes('stocks/bottle-ethanol');
    });
    if (bottleRow) { bottleRow.click(); return { ok: true, slug: bottleRow.getAttribute('data-slug') }; }
    if (rows.length) { rows[0].click(); return { ok: true, fallback: true, slug: rows[0].getAttribute('data-slug') }; }
    return { ok: false, reason: 'no rows' };
  });
  log('bottle click:', bottleClick);
  await page.waitForTimeout(2000);
  results.screenshots.push({ step: '5b-after', path: await shot(page, 'step05b-bottle-popup') });
  const bottleState = await inspectPopup(page);
  log('bottle popup state:', bottleState);
  results.hops.push({ hop: 'bottle', state: bottleState });

  // ── 6: From bottle popup, click parent (cabinet-flammable) ────────────
  log('Step 6: Click parent cabinet');
  results.screenshots.push({ step: '6a-before', path: await shot(page, 'step06a-before-click-cabinet') });
  const cabClick = await page.evaluate(() => {
    const overlay = document.querySelector('.em-overlay.open');
    if (!overlay) return { ok: false, reason: 'no popup' };
    // The parent pill is an <a class="object-pill"> with a click handler.
    const pills = Array.from(overlay.querySelectorAll('.object-pill'));
    const cab = pills.find(p => {
      const t = (p.textContent || '').toLowerCase();
      return /flammable cabinet/.test(t) || /cabinet-flammable/.test(p.getAttribute('data-slug') || '');
    });
    if (cab) { cab.click(); return { ok: true, text: cab.textContent.trim().slice(0,50), bg: getComputedStyle(cab).backgroundColor }; }
    // Fallback: click crumb or field link
    const crumb = Array.from(overlay.querySelectorAll('a, [data-slug]')).find(el => {
      const s = (el.getAttribute('data-slug') || '') + ' ' + (el.getAttribute('href') || '');
      return /cabinet-flammable/.test(s);
    });
    if (crumb) { crumb.click(); return { ok: true, text: crumb.textContent.trim().slice(0,50) }; }
    return { ok: false, reason: 'no cabinet link found' };
  });
  log('cabinet click:', cabClick);
  await page.waitForTimeout(2000);
  results.screenshots.push({ step: '6b-after', path: await shot(page, 'step06b-cabinet-popup') });
  const cabState = await inspectPopup(page);
  log('cabinet popup state:', cabState);
  results.hops.push({ hop: 'cabinet', state: cabState });

  // ── 7: From cabinet popup, click parent (room-robbins-0170) ────────────
  log('Step 7: Click parent room');
  results.screenshots.push({ step: '7a-before', path: await shot(page, 'step07a-before-click-room') });
  const roomClick = await page.evaluate(() => {
    const overlay = document.querySelector('.em-overlay.open');
    if (!overlay) return { ok: false, reason: 'no popup' };
    const candidates = Array.from(overlay.querySelectorAll('.object-pill, a, [data-slug]'));
    const r = candidates.find(el => {
      const s = (el.getAttribute('data-slug') || '') + ' ' + (el.getAttribute('href') || '');
      const t = (el.textContent || '').toLowerCase();
      return /room-robbins/.test(s) || /robbins\s*(0170|170)/.test(t) || /robbins hall/.test(t);
    });
    if (r) { r.click(); return { ok: true, text: r.textContent.trim().slice(0, 50) }; }
    return { ok: false };
  });
  log('room click:', roomClick);
  await page.waitForTimeout(2000);
  results.screenshots.push({ step: '7b-after', path: await shot(page, 'step07b-room-popup') });
  const roomState = await inspectPopup(page);
  log('room popup state:', roomState);
  results.hops.push({ hop: 'room', state: roomState });

  // Close popups
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // ── 8: Inventory + pills ─────────────────────────────────────────────
  log('Step 8: Inventory page pills');
  await page.goto(`${BASE}/app/inventory.html`);
  await waitNet(page, 1800);
  results.screenshots.push({ step: '8a', path: await shot(page, 'step08a-inventory') });
  const invPills = await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.object-pill'));
    const byType = {};
    pills.slice(0, 200).forEach(p => {
      const cls = (p.className || '').toString();
      const bg = getComputedStyle(p).backgroundColor;
      const text = (p.textContent || '').trim().slice(0, 30);
      const key = bg;
      if (!byType[key]) byType[key] = [];
      byType[key].push(text);
    });
    return byType;
  });
  log('inventory pills by bg:', Object.keys(invPills).length, 'distinct bgs');
  results.findings.push({ kind: 'inventory-pills-by-bg', sample: invPills });

  // ── 9: Inventory orientation banner ─────────────────────────────────────
  const invBanner = await page.evaluate(() => {
    const b = document.querySelector('.framework-banner, .orientation-banner, [class*="banner"]');
    if (!b) return { present: false };
    const st = getComputedStyle(b);
    return { present: true, text: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 240), borderLeftColor: st.borderLeftColor, bg: st.backgroundColor };
  });
  log('inventory banner:', invBanner);
  results.findings.push({ kind: 'inventory-banner', state: invBanner });

  // ── 10: Accessions orientation banner ──────────────────────────────────
  log('Step 10: Accessions banner');
  await page.goto(`${BASE}/app/accessions.html`);
  await waitNet(page, 1500);
  results.screenshots.push({ step: '10a', path: await shot(page, 'step10a-accessions-banner') });
  const accBanner = await page.evaluate(() => {
    const b = document.querySelector('.framework-banner, .orientation-banner, [class*="banner"]');
    if (!b) return { present: false };
    const st = getComputedStyle(b);
    return { present: true, text: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 240), borderLeftColor: st.borderLeftColor, bg: st.backgroundColor };
  });
  log('accessions banner:', accBanner);
  results.findings.push({ kind: 'accessions-banner', state: accBanner });

  // ── 11: 12-tab overflow at 1024 ────────────────────────────────────────
  log('Step 11: nav overflow at 1024');
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 1500);
  results.screenshots.push({ step: '11a', path: await shot(page, 'step11a-nav-1024') });
  const moreClick = await page.evaluate(() => {
    // The '+' more button
    const nav = document.querySelector('nav, .top-nav, header nav, #topNav');
    if (!nav) return { found: false, reason: 'no nav' };
    const candidates = Array.from(nav.querySelectorAll('button, a'));
    const more = candidates.find(b => b.textContent.trim() === '+' || b.getAttribute('aria-label') === 'More' || (b.className || '').includes('more'));
    if (more) { more.click(); return { found: true, clicked: true, text: more.textContent.trim() }; }
    return { found: false, candidateCount: candidates.length };
  });
  log('more click:', moreClick);
  await page.waitForTimeout(500);
  results.screenshots.push({ step: '11b', path: await shot(page, 'step11b-nav-overflow-open') });

  // ── 12: Mobile viewport ────────────────────────────────────────────────
  log('Step 12: Mobile 375x812');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/app/dashboard.html`);
  await waitNet(page, 1200);
  results.screenshots.push({ step: '12a', path: await shot(page, 'step12a-mobile-dashboard') });
  await page.goto(`${BASE}/app/wiki.html?doc=wet-lab/extraction/qiagen-dneasy-extraction`);
  await waitNet(page, 1200);
  results.screenshots.push({ step: '12b', path: await shot(page, 'step12b-mobile-protocol') });

  // Save results
  fs.writeFileSync(`${SHOT_DIR}/_results.json`, JSON.stringify(results, null, 2));
  log('done. shots:', results.screenshots.length, 'findings:', results.findings.length, 'fixes_needed:', results.fixes_needed.length);
  await browser.close();
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
