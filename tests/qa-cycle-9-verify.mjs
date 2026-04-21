// qa-cycle-9-verify: CALENDAR-NO-INDEX-PATCH fix verify.
//
// Before fix: create an event, reload, event missing from the grid because
// calendar's openAddEvent didn't call patchObjectIndex and the static
// object-index.json hadn't been rebuilt on deploy yet.
//
// After fix: create an event, reload. fetchObjectIndex's localStorage overlay
// restores it and the event is visible in the grid. Also check that
// patchLinkIndex recorded the event's member wikilink.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle9-verify';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const REPO = 'monroe-lab/lab-handbook';
const RUN = 'mo9abv' + Math.random().toString(36).slice(2, 6);

fs.mkdirSync(SHOT_DIR, { recursive: true });
const log = [];

async function gh(urlPath, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      'User-Agent': 'qa-cycle-9-verify',
      Accept: 'application/vnd.github+json',
    },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return fetch(`https://api.github.com${urlPath}`, opts);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);
  const p = await ctx.newPage();
  p.setDefaultTimeout(20000);

  console.log('[01] Calendar baseline');
  await p.goto(`${BASE}/app/calendar.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${SHOT_DIR}/01-baseline.png` });

  // Create event on Wed 10:00
  const evtTitle = `Verify QA9V ${RUN}`;
  await p.evaluate(() => {
    const cell = document.querySelector('.day-column[data-day="Wednesday"][data-hour="10"]');
    cell.click();
  });
  await p.waitForTimeout(700);
  await p.evaluate((evtTitle) => {
    const modal = document.querySelector('.lab-modal-overlay .lab-modal');
    const setVal = (k, v) => {
      const el = modal.querySelector(`[data-modal-key="${k}"]`);
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal('title', evtTitle);
    setVal('member', '[[Dr. Monroe]]');
    setVal('start_time', '10:00');
    setVal('end_time', '11:00');
    setVal('notes', 'Verify note [[qiagen-dneasy-extraction]]');
    setVal('repeat', 'none');
  }, evtTitle);
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.lab-modal-overlay .lab-modal .lab-modal-ok').click());
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${SHOT_DIR}/02-after-create.png` });

  // Inspect localStorage patches to confirm the fix wrote to the overlay
  const patches = await p.evaluate(() => {
    const idxPatches = JSON.parse(localStorage.getItem('lab_index_patches') || '{}');
    const linkPatches = JSON.parse(localStorage.getItem('lab_link_index_patches') || '{}');
    const wasPatched = Object.keys(idxPatches).some((k) => k.startsWith('events/') && idxPatches[k].title?.includes('QA9V'));
    const linkPatched = Object.keys(linkPatches).some((k) => k.startsWith('events/') && /qa9v/i.test(k));
    return {
      indexPatchKeys: Object.keys(idxPatches).filter((k) => k.startsWith('events/')),
      wasPatched,
      linkPatched,
      linkTargetsForOurEvent: (() => {
        const key = Object.keys(linkPatches).find((k) => k.startsWith('events/') && /qa9v/i.test(k));
        return key ? linkPatches[key].targets : null;
      })(),
    };
  });
  log.push({ step: 'patches-in-storage', patches });
  console.log('  patches in storage:', JSON.stringify(patches, null, 2));

  // Reload and check event still there
  console.log('[02] Reload and verify');
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${SHOT_DIR}/03-after-reload.png` });

  const afterReload = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    const match = cards.find((c) => c.textContent.includes(title));
    if (!match) return { landed: false, cardCount: cards.length };
    const parentCol = match.closest('.day-column');
    return {
      landed: true,
      cardCount: cards.length,
      day: parentCol?.getAttribute('data-day'),
      hour: parentCol?.getAttribute('data-hour'),
      text: match.textContent.trim().slice(0, 200),
    };
  }, evtTitle);
  log.push({ step: 'after-reload', afterReload });
  console.log('  after reload:', afterReload);

  // Cleanup
  const expectedPath = `docs/events/${(await p.evaluate(() => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMon);
    const wed = new Date(monday);
    wed.setDate(monday.getDate() + 2);
    return wed.getFullYear() + '-' + String(wed.getMonth() + 1).padStart(2, '0') + '-' + String(wed.getDate()).padStart(2, '0');
  }))}-verify-qa9v-${RUN.toLowerCase()}.md`;
  const shaResp = await gh(`/repos/${REPO}/contents/${expectedPath}?ref=main`);
  if (shaResp.status === 200) {
    const j = await shaResp.json();
    const del = await gh(`/repos/${REPO}/contents/${expectedPath}`, 'DELETE', {
      message: `qa-cycle-9-verify: cleanup test event`,
      sha: j.sha,
    });
    log.push({ step: 'cleanup', status: del.status });
    console.log('  cleanup status:', del.status);
  } else {
    log.push({ step: 'cleanup', status: 'not-found', expectedPath });
    console.log('  cleanup: file not found at', expectedPath);
  }

  fs.writeFileSync(`${SHOT_DIR}/_log.json`, JSON.stringify(log, null, 2));
  await browser.close();

  const ok = afterReload.landed && patches.wasPatched && patches.linkPatched;
  console.log(ok ? '\n✅ FIX VERIFIED' : '\n❌ FIX BROKEN');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
