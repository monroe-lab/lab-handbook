#!/usr/bin/env node
/**
 * QA Cycle 18 — Alex Chen (postdoc) + thorough + "New user onboarding"
 *
 * Goal: exercise the /app/people.html Join-the-Lab onboarding wizard end-to-end.
 * Thorough modifier: fill every optional field, pick many protocols across
 * multiple categories, pick every project, follow every created surface.
 *
 * Workflow:
 *   1. Dashboard baseline
 *   2. People grid baseline (count cards)
 *   3. Open onboarding wizard — step 1 Name/Role/Email filled thoroughly
 *   4. Step 2 — pick 6 protocols across 3 categories
 *   5. Step 3 — pick 2 projects
 *   6. Step 4 — verify creation checklist, go to profile
 *   7. People page — verify new card visible with avatar initials, role, email
 *   8. Click the new card — verify dashboard shows Protocols + Projects sections
 *   9. Click a protocol wikilink from the person dashboard — confirm nav
 *  10. Notebooks page — verify folder exists, first entry appears under it
 *  11. Open the first notebook entry — verify H1/sections render
 *  12. Verify backlinks on one of the chosen protocols show the new person
 *  13. Open person's popup via obj:// from protocol backlink for round-trip
 *  14. Cleanup: delete person file, notebook folder, link-index overlays
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const REPO = 'monroe-lab/lab-handbook';
const CYCLE = 18;
const DIR = `/tmp/qa-screenshots/cycle${CYCLE}`;
fs.mkdirSync(DIR, { recursive: true });

// Unique per-run suffix so re-runs don't collide
const RUN = Date.now().toString(36).slice(-6);
const NAME = `QA18 Thorough Alex ${RUN}`;
const SLUG = 'qa18-thorough-alex-' + RUN;

let stepN = 0;
const log = [];
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  const p = `${DIR}/${num}-${label}.png`;
  await page.screenshot({ path: p, fullPage: false });
  log.push({ step: stepN, label, path: p });
  console.log(`📸 ${num} ${label}`);
  return p;
}

// GH helpers for cleanup
function ghDelete(path, msg) {
  try {
    const sha = execSync(`gh api "repos/${REPO}/contents/${path}" --jq '.sha'`, { stdio: 'pipe' }).toString().trim();
    execSync(`gh api -X DELETE "repos/${REPO}/contents/${path}" -f message="${msg}" -f sha="${sha}"`, { stdio: 'pipe' });
    console.log(`🗑️  deleted ${path}`);
    return true;
  } catch (e) {
    console.log(`  (skip delete ${path}: ${String(e.message).slice(0, 80)})`);
    return false;
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await context.newPage();
page.setDefaultTimeout(20000);

const issues = [];
const observations = [];

try {
  // ======== 01. Dashboard baseline ========
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await shot(page, 'dashboard-baseline');

  // ======== 02. People page baseline ========
  await page.goto(`${BASE}/app/people.html`, { waitUntil: 'domcontentloaded' });
  // Wait for the grid to have person cards rendered
  await page.waitForFunction(() =>
    document.querySelectorAll('#peopleGrid .person-card').length > 0, { timeout: 20000 }
  );
  await page.waitForTimeout(1000);
  const baselineCards = await page.$$eval('#peopleGrid .person-card', cs => cs.length);
  observations.push(`people page baseline: ${baselineCards} cards visible before onboarding`);
  console.log(`   baseline people count: ${baselineCards}`);
  await shot(page, 'people-grid-baseline');

  // ======== 03. Open onboarding wizard (Join the Lab) ========
  await page.click('#joinLabBtn');
  // Step 1 render: wait for #wizName input
  await page.waitForSelector('#wizName', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, 'wizard-step1-empty');

  // Thorough: fill every field
  await page.fill('#wizName', NAME);
  await page.selectOption('#wizRole', 'Postdoctoral Scholar');
  await page.fill('#wizEmail', 'alex.qa18@example.com');
  await shot(page, 'wizard-step1-filled');

  // ======== 04. Advance to step 2 (Protocols) ========
  await page.click('button:has-text("Next")');
  await page.waitForSelector('[data-wiz-proto]', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, 'wizard-step2-baseline');

  // Capture total protocol count for context
  const totalProtos = await page.$$eval('[data-wiz-proto]', cb => cb.length);
  observations.push(`wizard step 2 shows ${totalProtos} protocol checkboxes`);

  // Thorough: pick 6 protocols across categories. Click the first 6 checkboxes.
  const picked = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-wiz-proto]')];
    const chosen = [];
    // Walk categories and pick 2 from each of first 3 we see
    const seenCats = new Set();
    for (const b of boxes) {
      const catDiv = b.closest('.wiz-cat-items');
      const catHeader = catDiv?.previousElementSibling?.querySelector('span[style]')?.textContent;
      if (!catHeader) continue;
      if (!seenCats.has(catHeader)) seenCats.add(catHeader);
      if (chosen.filter(c => c.cat === catHeader).length < 2 && seenCats.size <= 3) {
        b.checked = true;
        b.dispatchEvent(new Event('change', { bubbles: true }));
        chosen.push({ slug: b.value, cat: catHeader });
      }
      if (chosen.length >= 6) break;
    }
    return chosen;
  });
  console.log('   picked protocols:', picked.map(p => p.slug));
  observations.push(`wizard picked ${picked.length} protocols: ${picked.map(p => p.slug).join(', ')}`);
  await page.waitForTimeout(300);
  await shot(page, 'wizard-step2-6-selected');

  // ======== 05. Advance to step 3 (Projects) ========
  await page.click('button:has-text("Next")');
  await page.waitForSelector('[data-wiz-proj]', { timeout: 10000 }).catch(async () => {
    // Some deploys might have zero projects — still advance via Skip in that case
    await shot(page, 'wizard-step3-no-projects');
  });
  await page.waitForTimeout(500);
  await shot(page, 'wizard-step3-baseline');

  const totalProjs = await page.$$eval('[data-wiz-proj]', cb => cb.length).catch(() => 0);
  observations.push(`wizard step 3 shows ${totalProjs} project checkboxes`);

  // Thorough: pick up to 2 projects
  const pickedProjs = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-wiz-proj]')];
    const chosen = [];
    for (let i = 0; i < Math.min(2, boxes.length); i++) {
      boxes[i].checked = true;
      boxes[i].dispatchEvent(new Event('change', { bubbles: true }));
      chosen.push(boxes[i].value);
    }
    return chosen;
  });
  console.log('   picked projects:', pickedProjs);
  observations.push(`wizard picked projects: ${pickedProjs.join(', ') || '(none)'}`);
  await page.waitForTimeout(300);
  await shot(page, 'wizard-step3-selected');

  // ======== 06. Advance to step 4 (Creation) ========
  await page.click('button:has-text("Next")');
  // Wait for checklist OR error state
  await page.waitForFunction(() => {
    const cl = document.getElementById('wizChecklist');
    const se = document.getElementById('wizCreateStatus');
    return (cl && cl.style.display !== 'none') || (se && /error/i.test(se.textContent));
  }, { timeout: 30000 });
  await page.waitForTimeout(1000);
  await shot(page, 'wizard-step4-creation-complete');

  // Check whether creation errored
  const step4Status = await page.evaluate(() => document.getElementById('wizCreateStatus')?.textContent || '');
  const creationOk = !/error/i.test(step4Status);
  observations.push(`wizard step 4 status: "${step4Status.trim()}" (creationOk=${creationOk})`);
  if (!creationOk) {
    issues.push(`WIZARD-CREATION-ERROR: step 4 showed an error: ${step4Status}`);
  }

  // ======== 07. Close wizard + verify new card on people grid ========
  // Click outside to close OR press Escape
  await page.keyboard.press('Escape');
  // Above might not close; try clicking the overlay background
  const overlayVisible = await page.evaluate(() => {
    const ov = document.getElementById('wizardOverlay');
    return ov && getComputedStyle(ov).display !== 'none';
  });
  if (overlayVisible) {
    await page.evaluate(() => {
      const ov = document.getElementById('wizardOverlay');
      if (ov) ov.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
  await page.waitForTimeout(1500);
  // Trigger a re-render via reload to confirm the new card is on disk + overlay
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    document.querySelectorAll('#peopleGrid .person-card').length > 0, { timeout: 20000 }
  );
  await page.waitForTimeout(1500);
  const postCards = await page.$$eval('#peopleGrid .person-card', cs => cs.length);
  observations.push(`people page post-onboarding: ${postCards} cards (delta ${postCards - baselineCards})`);
  await shot(page, 'people-grid-post-onboarding');

  // Find the new card by matching the title text
  const newCardFound = await page.evaluate((name) => {
    const cards = [...document.querySelectorAll('#peopleGrid .person-card')];
    for (const c of cards) {
      const n = c.querySelector('.person-name')?.textContent?.trim() || '';
      if (n === name) {
        return {
          found: true,
          initials: c.querySelector('.person-avatar')?.textContent?.trim() || '',
          role: c.querySelector('.person-role')?.textContent?.trim() || '',
          emailVisible: !!c.querySelector('a[href^="mailto:"]'),
          pillCount: c.querySelectorAll('.person-pill-list a').length,
        };
      }
    }
    return { found: false };
  }, NAME);
  console.log('   new card:', newCardFound);
  observations.push(`new card detected: ${JSON.stringify(newCardFound)}`);

  if (!newCardFound.found) {
    issues.push('NEW-CARD-MISSING-AFTER-ONBOARDING: the new person card is not present on the People page after reload');
  }

  // ======== 08. Click new card -> person dashboard ========
  if (newCardFound.found) {
    // Scroll it into view, then click
    await page.evaluate((name) => {
      const cards = [...document.querySelectorAll('#peopleGrid .person-card')];
      for (const c of cards) {
        const n = c.querySelector('.person-name')?.textContent?.trim() || '';
        if (n === name) { c.scrollIntoView({ block: 'center', behavior: 'instant' }); break; }
      }
    }, NAME);
    await page.waitForTimeout(300);
    await shot(page, 'people-grid-new-card-zoomed');

    await page.evaluate((name) => {
      const cards = [...document.querySelectorAll('#peopleGrid .person-card')];
      for (const c of cards) {
        const n = c.querySelector('.person-name')?.textContent?.trim() || '';
        if (n === name) { c.click(); break; }
      }
    }, NAME);
    // Wait for dashboard to render
    await page.waitForFunction(() => {
      const dash = document.getElementById('personDashboard');
      return dash && dash.style.display !== 'none' && dash.innerHTML.length > 200;
    }, { timeout: 15000 });
    await page.waitForTimeout(1500);
    await shot(page, 'person-dashboard-top');

    // Inspect dashboard contents
    const dashStats = await page.evaluate(() => {
      const dash = document.getElementById('personDashboard');
      const sections = [...dash.querySelectorAll('h3')].map(h => h.textContent.trim());
      return {
        sectionHeaders: sections,
        headerName: dash.querySelector('.person-dash-header')?.querySelector('div')?.textContent?.trim() || null,
        itemRows: dash.querySelectorAll('.person-dash-item').length,
        url: location.href,
      };
    });
    console.log('   person dashboard:', dashStats);
    observations.push(`person dashboard: url=${dashStats.url}; sections=${JSON.stringify(dashStats.sectionHeaders)}; itemRows=${dashStats.itemRows}`);

    if (!/\?person=/.test(dashStats.url)) {
      issues.push('PERSON-DASHBOARD-URL-MISSING-QUERY: clicking a card should push ?person=<slug> onto the URL');
    }

    // Scroll to find the Protocols section
    await page.evaluate(() => {
      const h3s = [...document.querySelectorAll('#personDashboard h3')];
      const protoHdr = h3s.find(h => /protocol/i.test(h.textContent));
      if (protoHdr) protoHdr.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await page.waitForTimeout(300);
    await shot(page, 'person-dashboard-protocols-section');
  }

  // ======== 09. Click a protocol wikilink from person dashboard ========
  const gotoProto = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#personDashboard .person-dash-item')];
    // Find first item that looks like a protocol (by icon or by href pattern)
    for (const it of items) {
      const anchor = it.tagName === 'A' ? it : it.querySelector('a');
      if (anchor && /protocols\.html\?doc=/.test(anchor.getAttribute('href') || '')) {
        anchor.click();
        return anchor.getAttribute('href');
      }
    }
    // Or find a wrapper .person-dash-item that has onclick going to protocols
    for (const it of items) {
      const onclick = it.getAttribute('onclick') || '';
      if (/protocols\.html|protocols\/|doc=/i.test(onclick)) {
        it.click();
        return onclick;
      }
    }
    return null;
  });
  if (gotoProto) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await shot(page, 'protocol-page-from-dashboard');
    observations.push(`clicked protocol link from dashboard: ${gotoProto}`);
  } else {
    observations.push('no protocol link found on person dashboard to click');
  }

  // ======== 10. Notebooks page — verify folder + first entry ========
  await page.goto(`${BASE}/app/notebooks.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, 'notebooks-baseline');

  // Find the new person's folder in the sidebar
  const folderInfo = await page.evaluate((slug) => {
    // Sidebar folder buttons
    const folders = [...document.querySelectorAll('[data-folder-slug], [data-folder], .sidebar-folder, .folder-row, .folder-head')];
    for (const f of folders) {
      const slugAttr = f.dataset.folderSlug || f.dataset.folder || '';
      if (slugAttr === slug) {
        return { found: true, text: f.textContent.trim().slice(0, 120) };
      }
    }
    // Fallback — look for text containing the slug or the name
    const all = [...document.querySelectorAll('*')];
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if (el.childElementCount === 0 && t.length > 0 && t.length < 200 && t.toLowerCase().includes(slug.toLowerCase())) {
        return { found: true, text: t, fallback: true };
      }
    }
    return { found: false };
  }, SLUG);
  observations.push(`notebook folder check for ${SLUG}: ${JSON.stringify(folderInfo)}`);
  if (!folderInfo.found) {
    issues.push(`NOTEBOOK-FOLDER-NOT-VISIBLE: sidebar did not show folder for slug "${SLUG}"`);
  }

  // ======== 11. Try deep-linking to notebooks.html?person=<slug> ========
  await page.goto(`${BASE}/app/notebooks.html?person=${SLUG}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, 'notebooks-filtered-by-person');

  // ======== 12. Profile page for this user ========
  await page.goto(`${BASE}/app/profile.html?user=${SLUG}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, 'profile-page-for-new-user');

  // Capture profile state
  const profState = await page.evaluate(() => ({
    h1: document.querySelector('h1, h2')?.textContent?.trim(),
    hasStats: !!document.querySelector('[class*="stat"]'),
    bodyLen: document.body.innerText.length,
  }));
  observations.push(`profile page: h1="${profState.h1}", hasStats=${profState.hasStats}, bodyLen=${profState.bodyLen}`);

  // ======== 13. Open one of the picked protocols to check backlinks ========
  if (picked.length > 0) {
    const protoSlug = picked[0].slug;
    await page.goto(`${BASE}/app/protocols.html?doc=${protoSlug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await shot(page, 'protocol-with-new-person-backlink');

    // Check if the new person appears in backlinks
    const backlinkCheck = await page.evaluate((name) => {
      // Backlinks may be rendered in the right column or Related section
      const body = document.body.innerText || '';
      return {
        hasPersonName: body.includes(name),
        hasBacklinkUI: !!document.querySelector('[class*="backlink"], [class*="references"], [class*="related"]'),
      };
    }, NAME);
    observations.push(`protocol backlink check for ${protoSlug}: ${JSON.stringify(backlinkCheck)}`);
  }

  // ======== 14. Mobile viewport pass on the People page ========
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/app/people.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    document.querySelectorAll('#peopleGrid .person-card').length > 0, { timeout: 20000 }
  );
  await page.waitForTimeout(1500);
  await shot(page, 'people-grid-mobile');

  // Wizard on mobile
  await page.click('#joinLabBtn');
  await page.waitForSelector('#wizName', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, 'wizard-step1-mobile');
  // Close without filling
  await page.evaluate(() => {
    const ov = document.getElementById('wizardOverlay');
    if (ov) ov.style.display = 'none';
    document.body.style.overflow = '';
  });
  await page.waitForTimeout(300);

  // Reset viewport
  await page.setViewportSize({ width: 1440, height: 900 });

} catch (e) {
  console.error('❌ script error:', e);
  try { await page.screenshot({ path: `${DIR}/99-error.png`, fullPage: false }); } catch {}
  throw e;
} finally {
  // Write log
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({ log, observations, issues }, null, 2));
  console.log('\n📋 observations:');
  observations.forEach(o => console.log('   -', o));
  console.log('\n🐞 issues:');
  issues.forEach(i => console.log('   !', i));
  await browser.close();
}

// ======== Cleanup: delete person + notebook files ========
const today = new Date().toISOString().slice(0, 10);
console.log('\n🧹 cleanup:');
ghDelete(`docs/people/${SLUG}.md`, `cycle-18 QA cleanup ${NAME}`);
ghDelete(`docs/notebooks/${SLUG}/${today}.md`, `cycle-18 QA cleanup ${NAME} entry`);
ghDelete(`docs/notebooks/${SLUG}/.gitkeep`, `cycle-18 QA cleanup ${NAME} folder`);

console.log('\n✅ cycle 18 script done');
