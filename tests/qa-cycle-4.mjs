#!/usr/bin/env node
/**
 * QA Cycle 4: Kayla Torres (undergrad) + cross_linker + Cross-page wikilink crawl
 *
 * Walk from a protocol body into a reagent concept, then into a physical bottle,
 * then into the cabinet (parent), then into the room (grandparent). Screenshot
 * each step and verify breadcrumbs, pills, backlinks, contents.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const DIR = '/tmp/qa-screenshots/cycle4';
fs.mkdirSync(DIR, { recursive: true });

const log = [];
function record(step, path, shows) {
  log.push({ step, path, shows });
  console.log(`  📸 ${step} → ${path}`);
}
async function shot(page, step, name, shows) {
  const path = `${DIR}/${String(step).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  record(step, path, shows);
}
async function capturePopupState(page, label) {
  const state = await page.evaluate(() => {
    const overlay = document.querySelector('.em-overlay.open');
    if (!overlay) return { open: false };
    const title = overlay.querySelector('#em-title')?.textContent?.trim();
    const fieldsText = overlay.querySelector('.em-col-fields')?.innerText || '';
    const contentsText = overlay.querySelector('.em-col-contents')?.innerText || '';
    const bodyText = overlay.querySelector('.em-col-body')?.innerText?.slice(0, 400) || '';
    const crumbPills = Array.from(overlay.querySelectorAll('.em-col-body nav a, .em-col-body .breadcrumb a, .em-col-body .em-breadcrumb a, .em-col-body [class*="crumb"] a, .em-col-body [class*="crumb"] span')).map(el => el.textContent.trim()).filter(Boolean);
    const fieldsPillsText = Array.from(overlay.querySelectorAll('.em-col-fields .object-pill')).map(el => el.textContent.trim());
    const contentsSlugs = Array.from(overlay.querySelectorAll('.em-col-contents [data-slug]')).map(el => el.getAttribute('data-slug'));
    return { open: true, title, fieldsText: fieldsText.slice(0, 500), contentsText: contentsText.slice(0, 700), bodyText, crumbPills, fieldsPillsText, contentsSlugs };
  });
  console.log(`\n  [${label}]`, JSON.stringify(state, null, 2));
  return state;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', e => console.warn('PAGE ERROR:', e.message));

  const captured = {};

  try {
    console.log('\n=== CYCLE 4: Kayla + cross_linker + Cross-page wikilink crawl ===\n');

    // ── Step 1: Dashboard baseline ─────────────────────────────────────
    await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, 1, 'dashboard-baseline', 'Dashboard home view');

    // ── Step 2: Protocols list ─────────────────────────────────────────
    await page.goto(`${BASE}/app/protocols.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, 2, 'protocols-index', 'Protocols list page');

    // ── Step 3: Open QIAGEN DNeasy Plant Extraction protocol ───────────
    await page.goto(`${BASE}/app/protocols.html?doc=wet-lab/extraction/qiagen-dneasy-extraction`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await shot(page, 3, 'protocol-qiagen-loaded', 'Protocol body with wikilink pills');

    // ── Step 4: Click the Ethanol Absolute wikilink ────────────────────
    await shot(page, 4, 'protocol-before-click-ethanol', 'Before clicking Ethanol Absolute wikilink');
    const clickedEthanol = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('a.object-pill')).find(a => /ethanol-absolute/.test(a.getAttribute('href') || ''));
      if (!el) return { clicked: false };
      el.scrollIntoView({ block: 'center' });
      el.click();
      return { clicked: true, href: el.getAttribute('href') };
    });
    console.log('Clicked ethanol:', clickedEthanol);
    await page.waitForTimeout(2500);
    await shot(page, 5, 'reagent-popup-opened', 'Ethanol Absolute reagent popup');
    captured.reagent = await capturePopupState(page, 'reagent');

    // ── Step 5: Click physical bottle instance in Contents column ──────
    await shot(page, 6, 'reagent-contents-column', 'Reagent popup contents column');
    const clickedBottle = await page.evaluate(() => {
      const row = document.querySelector('.em-overlay.open .em-col-contents .em-backlink-row[data-slug="stocks/bottle-ethanol-absolute"]');
      if (!row) return { clicked: false };
      row.scrollIntoView({ block: 'center' });
      row.click();
      return { clicked: true, slug: row.getAttribute('data-slug') };
    });
    console.log('Clicked bottle:', clickedBottle);
    await page.waitForTimeout(2500);
    await shot(page, 7, 'bottle-popup-opened', 'Bottle popup — breadcrumb + parent + of');
    captured.bottle = await capturePopupState(page, 'bottle');

    // ── Step 6: Click Flammable Cabinet parent pill ────────────────────
    await shot(page, 8, 'bottle-before-click-cabinet', 'Bottle popup — about to click cabinet');
    const clickedCabinet = await page.evaluate(() => {
      const overlay = document.querySelector('.em-overlay.open');
      const pills = Array.from(overlay.querySelectorAll('.em-col-fields .object-pill'));
      for (const el of pills) {
        if (/Flammable Cabinet/i.test(el.textContent)) {
          el.scrollIntoView({ block: 'center' });
          el.click();
          return { clicked: true, via: 'fields-pill' };
        }
      }
      const bodyPill = Array.from(overlay.querySelectorAll('.em-col-body .object-pill')).find(el => /Flammable Cabinet/i.test(el.textContent));
      if (bodyPill) { bodyPill.click(); return { clicked: true, via: 'body-pill' }; }
      return { clicked: false };
    });
    console.log('Clicked cabinet:', clickedCabinet);
    await page.waitForTimeout(2500);
    await shot(page, 9, 'cabinet-popup-opened', 'Flammable Cabinet popup');
    captured.cabinet = await capturePopupState(page, 'cabinet');

    // ── Step 7: Click Robbins Hall 0170 parent pill from cabinet ───────
    await shot(page, 10, 'cabinet-before-click-room', 'Cabinet popup — about to click room');
    const clickedRoom = await page.evaluate(() => {
      const overlay = document.querySelector('.em-overlay.open');
      const pills = Array.from(overlay.querySelectorAll('.em-col-fields .object-pill'));
      for (const el of pills) {
        if (/Robbins/i.test(el.textContent)) {
          el.scrollIntoView({ block: 'center' });
          el.click();
          return { clicked: true, via: 'fields-pill' };
        }
      }
      return { clicked: false };
    });
    console.log('Clicked room:', clickedRoom);
    await page.waitForTimeout(2500);
    await shot(page, 11, 'room-popup-opened', 'Robbins Hall 0170 room popup');
    captured.room = await capturePopupState(page, 'room');

    // ── Step 8: Close popup stack ──────────────────────────────────────
    await shot(page, 12, 'room-before-close', 'About to close popups');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await shot(page, 13, 'all-popups-closed', 'After multiple Escapes');

    // ── Step 9: Lab map ────────────────────────────────────────────────
    await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await shot(page, 14, 'lab-map-initial', 'Lab map with hierarchical tree');

    const filterSel = 'input[placeholder*="filter" i], input[placeholder*="search" i], input[type="search"]';
    const filterEl = await page.$(filterSel);
    if (filterEl) {
      await filterEl.fill('ethanol');
      await page.waitForTimeout(1500);
      await shot(page, 15, 'lab-map-filter-ethanol', 'Lab map filter = "ethanol"');
      await filterEl.fill('flammable');
      await page.waitForTimeout(1500);
      await shot(page, 16, 'lab-map-filter-flammable', 'Lab map filter = "flammable"');
      await filterEl.fill('');
      await page.waitForTimeout(800);
    }

    // ── Step 10: Inventory page ────────────────────────────────────────
    await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot(page, 17, 'inventory-landing', 'Inventory page landing');

    const searchInput = await page.$('input[placeholder*="Search" i], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('ethanol absolute');
      await page.waitForTimeout(1200);
      await shot(page, 18, 'inventory-search-ethanol', 'Inventory filtered to ethanol absolute');
    }

    const openedInvPopup = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      for (const r of rows) {
        if (r.offsetParent && /Ethanol Absolute/i.test(r.textContent || '')) {
          r.click();
          return { clicked: true, text: r.textContent.trim().slice(0, 120) };
        }
      }
      return { clicked: false };
    });
    console.log('Inventory click:', openedInvPopup);
    await page.waitForTimeout(2000);
    await shot(page, 19, 'inventory-popup-opened', 'Popup opened from inventory row click');
    captured.inventoryPopup = await capturePopupState(page, 'inventoryPopup');

    // ── Step 11: Wiki page ─────────────────────────────────────────────
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.goto(`${BASE}/app/wiki.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, 20, 'wiki-landing', 'Wiki page landing');

    const wikiSearch = await page.$('input[placeholder*="Search" i], input[type="search"]');
    if (wikiSearch) {
      await wikiSearch.fill('flammable');
      await page.waitForTimeout(1200);
      await shot(page, 21, 'wiki-search-flammable', 'Wiki search = flammable');
    }

    fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({
      when: new Date().toISOString(),
      screenshots: log,
      captured,
    }, null, 2));
    console.log(`\nLog written to ${DIR}/_log.json`);
    console.log(`Screenshots: ${log.length}`);
  } catch (err) {
    console.error('TEST ERROR:', err.message);
    try { await shot(page, 99, 'error-state', 'Error: ' + err.message); } catch {}
    throw err;
  } finally {
    await browser.close();
  }
})();
