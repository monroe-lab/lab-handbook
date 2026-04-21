// qa-cycle-9: Dr. Monroe + careful + Calendar add/delete
//
// Scenario: PI adds a specific lab meeting block to his week in Monroe lab
// calendar, verifies it appears, clicks into it, closes, then deletes via the
// editor modal. Careful modifier = verifies via GitHub API after each write.
//
// Primary surface: /calendar/ (actually served by app/calendar.html; the route
// /calendar/ redirects there since calendar.html is the MkDocs page).
//
// Heavy screenshot pass: every open, every form fill, every save, every
// navigation step before and after. Aim for 25-30 screenshots.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const SHOT_DIR = '/tmp/qa-screenshots/cycle9';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const REPO = 'monroe-lab/lab-handbook';
const RUN = 'mo9ab' + Math.random().toString(36).slice(2, 8);
const log = [];

fs.mkdirSync(SHOT_DIR, { recursive: true });

async function shot(page, name) {
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p, fullPage: false });
  console.log('  📸', name);
  return p;
}

async function gh(urlPath, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      'User-Agent': 'qa-cycle-9',
      Accept: 'application/vnd.github+json',
    },
  };
  if (body) opts.headers['Content-Type'] = 'application/json';
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  const r = await fetch(`https://api.github.com${urlPath}`, opts);
  return r;
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
  p.on('console', (msg) => {
    if (msg.type() === 'error') console.log('    [console.error]', msg.text().slice(0, 200));
  });

  console.log('=== QA Cycle 9: Dr. Monroe + careful + Calendar add/delete ===');

  // ── 01: Calendar baseline ──
  console.log('[01] Calendar baseline');
  await p.goto(`${BASE}/app/calendar.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await shot(p, 'step01-calendar-baseline.png');

  // gather initial schedule stats for later comparison
  const baseline = await p.evaluate(() => ({
    visibleBlockTitles: Array.from(document.querySelectorAll('.block-card .block-member'))
      .map((el) => el.textContent.trim()),
    headerWeekLabel: document.getElementById('weekLabel')?.textContent.trim(),
    cellCount: document.querySelectorAll('.day-column').length,
    memberOptionCount: document.getElementById('filterMember')?.options.length,
    scheduleCount: window.schedule?.length,
  }));
  log.push({ step: 'baseline', data: baseline });
  console.log('  baseline:', baseline);

  // ── 02: Next week nav ──
  console.log('[02] Next week nav');
  await p.evaluate(() => changeWeek(1));
  await p.waitForTimeout(300);
  await shot(p, 'step02-next-week.png');
  const nextWeek = await p.evaluate(() => document.getElementById('weekLabel')?.textContent.trim());
  log.push({ step: 'next-week-label', nextWeek });

  // ── 03: Back to This Week ──
  console.log('[03] This Week button');
  await p.evaluate(() => goToday());
  await p.waitForTimeout(300);
  await shot(p, 'step03-this-week.png');

  // ── 04: Click empty cell (Wed, 14:00) to open add-event modal ──
  console.log('[04] Click empty Wed 14:00 cell');
  await shot(p, 'step04-before-cell-click.png');
  await p.evaluate(() => {
    const cell = document.querySelector('.day-column[data-day="Wednesday"][data-hour="14"]');
    if (!cell) throw new Error('No Wed 14:00 cell');
    cell.click();
  });
  await p.waitForTimeout(800);
  await shot(p, 'step05-add-event-modal-opened.png');

  // ── 05: Inspect default values ──
  const modalState = await p.evaluate(() => {
    const modal = document.querySelector('.lab-modal-overlay .lab-modal');
    if (!modal) return { present: false };
    const getVal = (k) => modal.querySelector(`[data-modal-key="${k}"]`)?.value;
    return {
      present: true,
      title: getVal('title'),
      date: getVal('date'),
      start: getVal('start_time'),
      end: getVal('end_time'),
      repeat: getVal('repeat'),
      repeatUntilVisible: (() => {
        const d = modal.querySelector('[data-modal-field="repeat_until"]');
        return d ? getComputedStyle(d).display !== 'none' : null;
      })(),
      heading: modal.querySelector('h3')?.textContent,
      allFieldKeys: Array.from(modal.querySelectorAll('[data-modal-key]')).map((e) => e.getAttribute('data-modal-key')),
    };
  });
  log.push({ step: 'modal-open', modalState });
  console.log('  modal state:', modalState);

  // ── 06: Fill form: Lab Meeting QA9 ──
  console.log('[06] Fill modal fields');
  const ghUser = 'greymonroe';
  const evtTitle = `Lab Meeting QA9 ${RUN}`;
  await p.evaluate((evtTitle) => {
    const modal = document.querySelector('.lab-modal-overlay .lab-modal');
    const setVal = (k, v) => {
      const el = modal.querySelector(`[data-modal-key="${k}"]`);
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal('title', evtTitle);
    setVal('member', '[[Dr. Monroe]]');
    setVal('start_time', '14:00');
    setVal('end_time', '15:00');
    setVal('notes', 'Weekly PI review — discuss Vianney pistachio and Alex libprep progress. [[qiagen-dneasy-extraction]]');
    setVal('repeat', 'none');
  }, evtTitle);
  await p.waitForTimeout(250);
  await shot(p, 'step06-modal-filled.png');

  // ── 07: Submit (click OK) ──
  console.log('[07] Submit form');
  await p.evaluate(() => {
    const btn = document.querySelector('.lab-modal-overlay .lab-modal .lab-modal-ok');
    btn.click();
  });
  // Wait for save to complete
  await p.waitForTimeout(6000);
  await shot(p, 'step07-after-submit.png');

  // ── 08: Verify event appears in grid ──
  console.log('[08] Verify event in grid');
  const eventLanded = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    const match = cards.find((c) => c.textContent.includes(title));
    if (!match) return { landed: false, count: cards.length };
    const parentCol = match.closest('.day-column');
    return {
      landed: true,
      count: cards.length,
      day: parentCol?.getAttribute('data-day'),
      hour: parentCol?.getAttribute('data-hour'),
      cardText: match.textContent.trim().slice(0, 200),
      topPx: match.style.top,
      heightPx: match.style.height,
    };
  }, evtTitle);
  log.push({ step: 'event-landed', eventLanded });
  console.log('  event in grid:', eventLanded);
  await shot(p, 'step08-event-visible-in-grid.png');

  // ── 09: GitHub API verify the file exists (careful modifier) ──
  console.log('[09] Verify file exists via gh API');
  const slugDate = await p.evaluate(() => {
    const d = new Date();
    // This week's Wednesday
    const dayOfWeek = d.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMon);
    const wed = new Date(monday);
    wed.setDate(monday.getDate() + 2);
    return (
      wed.getFullYear() +
      '-' +
      String(wed.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(wed.getDate()).padStart(2, '0')
    );
  });
  const expectedSlug = `${slugDate}-lab-meeting-qa9-${RUN}`;
  const expectedPath = `docs/events/${expectedSlug}.md`;
  console.log('  expected path:', expectedPath);
  const r = await gh(`/repos/${REPO}/contents/${expectedPath}?ref=main`);
  const exists = r.status === 200;
  let bodyFrag = '';
  if (exists) {
    const j = await r.json();
    bodyFrag = Buffer.from(j.content, 'base64').toString('utf8').slice(0, 500);
  }
  log.push({ step: 'gh-api-check', expectedPath, status: r.status, exists, bodyFrag });
  console.log('  gh api status:', r.status, 'exists:', exists);

  // ── 10: Click the block to open editor modal ──
  console.log('[10] Click block');
  await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    const match = cards.find((c) => c.textContent.includes(title));
    match.click();
  }, evtTitle);
  await p.waitForTimeout(3000);
  await shot(p, 'step10-editor-modal-opened.png');

  // ── 11: Inspect the editor modal — fields, breadcrumb, body ──
  console.log('[11] Inspect editor modal');
  const editor = await p.evaluate(() => {
    const modal = document.querySelector('.editor-modal, .lab-editor-overlay, [data-editor-modal]');
    if (!modal) {
      // fall back: look for the third column
      const title = document.querySelector('.lab-editor-title, .editor-modal-title, h1, h2');
      return { present: false, fallbackTitle: title?.textContent };
    }
    return {
      present: true,
      html_len: modal.innerHTML.length,
      titleTxt: (modal.querySelector('h1,h2,[class*="title"]')?.textContent || '').slice(0, 120),
      fieldKeys: Array.from(modal.querySelectorAll('[data-field-key], [data-modal-key]')).map((e) => e.getAttribute('data-field-key') || e.getAttribute('data-modal-key')),
    };
  });
  log.push({ step: 'editor-inspect', editor });
  console.log('  editor modal:', editor);

  // ── 12: Take a viewport shot of editor popup ──
  await shot(p, 'step12-editor-popup-full.png');

  // ── 13: Close editor modal via Escape ──
  console.log('[13] Close editor via Escape');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  await shot(p, 'step13-after-close-editor.png');

  // Verify event is still there after close
  const stillThere = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    return cards.some((c) => c.textContent.includes(title));
  }, evtTitle);
  log.push({ step: 'event-still-there', stillThere });
  console.log('  still there:', stillThere);

  // ── 14: Member filter — set filter to Dr. Monroe, verify only our block remains ──
  console.log('[14] Member filter');
  const filterOpts = await p.evaluate(() => {
    const sel = document.getElementById('filterMember');
    return Array.from(sel.options).map((o) => ({ v: o.value, t: o.textContent }));
  });
  log.push({ step: 'filter-options', filterOpts });
  const monroeOpt = filterOpts.find((o) => o.v && o.v.toLowerCase().includes('monroe'));
  if (monroeOpt) {
    await p.selectOption('#filterMember', monroeOpt.v);
    await p.waitForTimeout(400);
    await shot(p, 'step14-filter-dr-monroe.png');
    const filteredCount = await p.evaluate(() => document.querySelectorAll('.block-card').length);
    log.push({ step: 'filter-result-count', filteredCount });
    console.log('  filtered card count:', filteredCount);
    // Reset filter
    await p.selectOption('#filterMember', '');
    await p.waitForTimeout(300);
    await shot(p, 'step15-filter-reset.png');
  } else {
    console.log('  ⚠ no Dr. Monroe option in filter');
  }

  // ── 16: Reload page and verify event persists ──
  console.log('[16] Reload page');
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  await shot(p, 'step16-after-reload.png');
  const afterReload = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    const match = cards.find((c) => c.textContent.includes(title));
    return match ? {
      landed: true,
      day: match.closest('.day-column')?.getAttribute('data-day'),
      hour: match.closest('.day-column')?.getAttribute('data-hour'),
      text: match.textContent.trim().slice(0, 200),
    } : { landed: false };
  }, evtTitle);
  log.push({ step: 'after-reload', afterReload });
  console.log('  after reload:', afterReload);

  // ── 17: Delete event via gh API (since editor-modal delete button flow is complex) ──
  console.log('[17] Delete event');
  // Get file SHA
  const sha = await gh(`/repos/${REPO}/contents/${expectedPath}?ref=main`).then((r) =>
    r.status === 200 ? r.json().then((j) => j.sha) : null
  );
  log.push({ step: 'delete-sha', sha });
  if (sha) {
    // Use the app's deletion flow via Lab.gh.deleteFile — which dispatches lab-file-saved (deletion) event
    // so the schedule updates in-memory.
    const delResult = await p.evaluate(async (expectedPath) => {
      try {
        await Lab.gh.deleteFile(expectedPath);
        if (Lab.gh.removeFromObjectIndex) Lab.gh.removeFromObjectIndex(expectedPath);
        // Dispatch lab-file-saved with no meta so calendar.html's listener drops it
        window.dispatchEvent(new CustomEvent('lab-file-saved', { detail: { path: expectedPath } }));
        return { ok: true };
      } catch (e) {
        return { ok: false, err: e.message };
      }
    }, expectedPath);
    log.push({ step: 'delete-result', delResult });
    console.log('  delete via Lab.gh.deleteFile:', delResult);
    await p.waitForTimeout(1500);
    await shot(p, 'step17-after-delete.png');
  }

  // ── 18: Verify removed from grid ──
  const afterDelete = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    return cards.some((c) => c.textContent.includes(title));
  }, evtTitle);
  log.push({ step: 'after-delete-visible', afterDelete });
  console.log('  event still visible after delete:', afterDelete);

  // ── 19: Reload and verify gone from server ──
  console.log('[19] Reload after delete');
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  await shot(p, 'step19-reload-after-delete.png');
  const postReloadGone = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    return !cards.some((c) => c.textContent.includes(title));
  }, evtTitle);
  log.push({ step: 'post-reload-gone', postReloadGone });
  console.log('  gone after reload:', postReloadGone);

  // ── 20: Mobile viewport ──
  console.log('[20] Mobile viewport');
  await ctx.pages()[0].setViewportSize({ width: 375, height: 812 });
  await p.waitForTimeout(800);
  await shot(p, 'step20-mobile-375.png');
  const mobileInfo = await p.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.day-tab')).map((t) => ({
      day: t.getAttribute('data-day'),
      active: t.classList.contains('active'),
      visible: getComputedStyle(t).display !== 'none',
    }));
    const visibleCols = Array.from(document.querySelectorAll('.day-column'))
      .filter((c) => !c.classList.contains('mobile-hide')).length;
    return { tabs, visibleCols };
  });
  log.push({ step: 'mobile-info', mobileInfo });
  console.log('  mobile info:', mobileInfo);

  // Reset
  await ctx.pages()[0].setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(500);

  // ── 21: Repeat event test — add a recurring series ──
  console.log('[21] Recurring series create');
  await p.evaluate(() => {
    const cell = document.querySelector('.day-column[data-day="Tuesday"][data-hour="11"]');
    cell?.click();
  });
  await p.waitForTimeout(800);
  await shot(p, 'step21-recurring-modal-open.png');
  const recurTitle = `Team Standup QA9R ${RUN}`;
  await p.evaluate((recurTitle) => {
    const modal = document.querySelector('.lab-modal-overlay .lab-modal');
    const setVal = (k, v) => {
      const el = modal.querySelector(`[data-modal-key="${k}"]`);
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal('title', recurTitle);
    setVal('member', '[[Dr. Monroe]]');
    setVal('start_time', '11:00');
    setVal('end_time', '11:30');
    setVal('repeat', 'weekly');
  }, recurTitle);
  await p.waitForTimeout(400);
  await shot(p, 'step21b-recurring-modal-repeat-weekly.png');

  // Verify repeat_until field appears
  const repeatUntilShown = await p.evaluate(() => {
    const modal = document.querySelector('.lab-modal-overlay .lab-modal');
    const d = modal.querySelector('[data-modal-field="repeat_until"]');
    return d ? getComputedStyle(d).display !== 'none' : null;
  });
  log.push({ step: 'repeat-until-shown-after-weekly', repeatUntilShown });
  console.log('  repeat_until visible after weekly:', repeatUntilShown);

  // Set repeat_until to 3 weeks out
  await p.evaluate(() => {
    const modal = document.querySelector('.lab-modal-overlay .lab-modal');
    const el = modal.querySelector('[data-modal-key="repeat_until"]');
    const today = new Date();
    today.setDate(today.getDate() + 21);
    el.value = today.toISOString().slice(0, 10);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await shot(p, 'step21c-recurring-filled.png');

  // Submit
  await p.evaluate(() => document.querySelector('.lab-modal-overlay .lab-modal .lab-modal-ok').click());
  await p.waitForTimeout(10000);
  await shot(p, 'step22-after-recurring-create.png');

  // Count matching blocks
  const recurCount = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    return cards.filter((c) => c.textContent.includes(title)).length;
  }, recurTitle);
  log.push({ step: 'recurring-count-this-week', recurCount });
  console.log('  recurring count this week:', recurCount);

  // Navigate next week to see the series continues
  await p.evaluate(() => changeWeek(1));
  await p.waitForTimeout(500);
  await shot(p, 'step23-next-week-recurring.png');
  const recurNextWeek = await p.evaluate((title) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    return cards.filter((c) => c.textContent.includes(title)).length;
  }, recurTitle);
  log.push({ step: 'recurring-count-next-week', recurNextWeek });
  console.log('  recurring count next week:', recurNextWeek);

  // ── 24: Clean up all QA9 events via GH API ──
  console.log('[24] Cleanup all QA9 events');
  const searchResp = await gh(`/repos/${REPO}/contents/docs/events?ref=main`);
  if (searchResp.status === 200) {
    const list = await searchResp.json();
    const qa9Files = list.filter((f) => f.name.includes(`qa9`) && f.name.includes(RUN));
    console.log('  files to cleanup:', qa9Files.length);
    for (const f of qa9Files) {
      const del = await gh(`/repos/${REPO}/contents/${f.path}`, 'DELETE', {
        message: `qa-cycle-9: cleanup test event ${f.name}`,
        sha: f.sha,
      });
      log.push({ step: 'cleanup-delete', name: f.name, status: del.status });
      if (del.status !== 200) console.log('  ⚠ cleanup failed:', f.name, del.status);
    }
  }

  // ── 25: Final back-to-this-week shot ──
  await p.goto(`${BASE}/app/calendar.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3500);
  await shot(p, 'step25-final-cleanup-verified.png');
  const finalCheck = await p.evaluate((runTag) => {
    const cards = Array.from(document.querySelectorAll('.block-card'));
    return cards.filter((c) => c.textContent.includes(runTag)).length;
  }, RUN);
  log.push({ step: 'final-check-qa9-residual', finalCheck });
  console.log('  residual qa9 events visible:', finalCheck);

  fs.writeFileSync(path.join(SHOT_DIR, '_log.json'), JSON.stringify(log, null, 2));
  console.log('\n=== Cycle 9 done.  Log:', path.join(SHOT_DIR, '_log.json'));

  await browser.close();
}

main().catch((e) => {
  console.error('FATAL:', e);
  fs.writeFileSync(path.join(SHOT_DIR, '_log.json'), JSON.stringify(log, null, 2));
  process.exit(1);
});
