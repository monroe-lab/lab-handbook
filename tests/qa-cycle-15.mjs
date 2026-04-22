#!/usr/bin/env node
/**
 * QA Cycle 15 — Alex Chen (postdoc) + impatient + "Rename + relink day"
 *
 * Scenario: create a protocol, create a notebook entry that wikilinks to it
 * with both bare [[slug]] and path-qualified [[dir/slug]] forms, rename the
 * protocol, then verify:
 *   1. protocol loads at new slug URL, title updated, sidebar updated
 *   2. old ?doc=<old-slug> URL behaves gracefully (not a silent blank screen)
 *   3. inbound wikilinks in the notebook were rewritten to the new slug
 *      (updateWikilinksAfterRename is wired up; verify it actually touches the files)
 *   4. backlinks panel on the renamed protocol's popup includes the notebook
 *
 * Impatient twist: double-click Rename, Escape mid-prompt, back-button from
 * the renamed page, reload mid-save.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const CYCLE = 15;
const DIR = `/tmp/qa-screenshots/cycle${CYCLE}`;
const TS = Date.now().toString(36);

const OLD_TITLE = `QA15 Initial Proto ${TS}`;
const OLD_SLUG = `qa15-initial-proto-${TS}`;
const PROTO_DIR = 'wet-lab';
const OLD_PROTO_DOC = `${PROTO_DIR}/${OLD_SLUG}`;
const OLD_PROTO_PATH = `docs/${OLD_PROTO_DOC}.md`;

const NEW_TITLE = `QA15 Renamed Proto ${TS}`;
const NEW_SLUG = `qa15-renamed-proto-${TS}`;
const NEW_PROTO_DOC = `${PROTO_DIR}/${NEW_SLUG}`;
const NEW_PROTO_PATH = `docs/${NEW_PROTO_DOC}.md`;

const NB_FOLDER = 'test-user';
const NB_SLUG = `qa15-rename-consumer-${TS}`;
const NB_PATH = `docs/notebooks/${NB_FOLDER}/${NB_SLUG}.md`;

fs.mkdirSync(DIR, { recursive: true });

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

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await context.newPage();
page.setDefaultTimeout(25000);

page.on('pageerror', (e) => console.log('❌ pageerror:', e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('⚠ console.error:', msg.text().slice(0, 220));
});

const cleanupPaths = [];
const findings = { bugs: [], fixes: [] };

try {
  // ───────────────────────────────────────────────
  // STEP 1 — protocols baseline
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/protocols.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, 'protocols-baseline');

  // ───────────────────────────────────────────────
  // STEP 2 — create a test protocol via gh.saveFile
  // ───────────────────────────────────────────────
  const protoBody = [
    `# ${OLD_TITLE}`,
    '',
    '*QA15 test protocol — disposable.*',
    '',
    '## Purpose',
    '',
    'Exercise rename + inbound wikilink rewrite pipeline.',
    '',
    '## Time estimate',
    '',
    '~10 min',
    '',
    '## Steps',
    '',
    '1. Create notebook wikilinking to this protocol.',
    '2. Rename protocol.',
    '3. Observe inbound links.',
  ].join('\n');

  const createRes = await page.evaluate(async ({ filePath, title, body }) => {
    const gh = window.Lab.gh;
    const content = Lab.buildFrontmatter({ title, type: 'protocol' }, body);
    const r = await gh.saveFile(filePath, content, null, 'QA15 create test protocol');
    gh.patchObjectIndex(filePath, { title, type: 'protocol' });
    gh.patchLinkIndex(filePath, body);
    return { sha: r.sha, path: filePath };
  }, { filePath: OLD_PROTO_PATH, title: OLD_TITLE, body: protoBody });
  console.log('proto create:', createRes);
  cleanupPaths.push(OLD_PROTO_PATH);

  await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(OLD_PROTO_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot(page, 'protocol-loaded-initial');

  const initialMeta = await page.evaluate(() => {
    const h1 = document.querySelector('#protoContent h1');
    const breadcrumb = document.querySelector('#protoContent .breadcrumb');
    return {
      h1: h1 ? h1.textContent.trim() : null,
      breadcrumb: breadcrumb ? breadcrumb.textContent.trim() : null,
      url: location.search,
    };
  });
  console.log('initialMeta:', initialMeta);

  // ───────────────────────────────────────────────
  // STEP 3 — create notebook entry via gh.saveFile with both wikilink styles
  // ───────────────────────────────────────────────
  const nbBody = [
    `# QA15 Rename Consumer ${TS}`,
    '',
    '**Person:** Alex Chen',
    '',
    '**Date:** 2026-04-22',
    '',
    '## Protocol used',
    '',
    `Ran [[${OLD_SLUG}]] on 3 samples today.`,
    '',
    '## Also referenced (path-qualified form)',
    '',
    `The same protocol, cited as [[${OLD_PROTO_DOC}]] for clarity.`,
    '',
    '## Results',
    '',
    'Routine, no anomalies.',
  ].join('\n');

  const nbCreateRes = await page.evaluate(async ({ filePath, title, body }) => {
    const gh = window.Lab.gh;
    const content = Lab.buildFrontmatter({ title, type: 'note' }, body);
    const r = await gh.saveFile(filePath, content, null, 'QA15 create consumer notebook');
    gh.patchObjectIndex(filePath, { title, type: 'note' });
    gh.patchLinkIndex(filePath, body);
    return { sha: r.sha, path: filePath };
  }, { filePath: NB_PATH, title: `QA15 Rename Consumer ${TS}`, body: nbBody });
  console.log('nb create:', nbCreateRes);
  cleanupPaths.push(NB_PATH);

  const NB_DOC = `notebooks/${NB_FOLDER}/${NB_SLUG}`;
  await page.goto(`${BASE}/app/notebooks.html?doc=${encodeURIComponent(NB_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#renderedDoc', { timeout: 20000 });
  await page.waitForTimeout(2000);
  await shot(page, 'nb-loaded-pre-rename');

  const nbPillStatePre = await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    if (!root) return { noRoot: true };
    const links = Array.from(root.querySelectorAll('a.object-pill, a[href^="obj://"]'));
    return {
      count: links.length,
      links: links.map(a => ({
        href: a.getAttribute('href') || '',
        text: a.textContent.trim(),
        cls: a.className,
        bg: a.style.background || getComputedStyle(a).backgroundColor,
        hasIcon: !!a.querySelector('.material-icons-outlined, svg, img'),
      })),
    };
  });
  console.log('nbPillState PRE rename:', JSON.stringify(nbPillStatePre, null, 2));

  await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const link = root && root.querySelector('a.object-pill, a[href^="obj://"]');
    if (link) link.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await shot(page, 'nb-first-pill-pre-rename');

  await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const links = root ? root.querySelectorAll('a.object-pill, a[href^="obj://"]') : [];
    if (links[1]) links[1].scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await shot(page, 'nb-second-pill-pre-rename');

  // ───────────────────────────────────────────────
  // STEP 4 — rename the protocol
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(OLD_PROTO_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot(page, 'proto-before-rename');

  // Stub prompt to auto-submit new title
  await page.evaluate((newTitle) => {
    window.__qa15_origPrompt = Lab.modal.prompt;
    Lab.modal.prompt = async function(opts) { return newTitle; };
  }, NEW_TITLE);

  await shot(page, 'proto-before-click-rename');

  // IMPATIENT behavior: double-click the Rename button
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => /rename/i.test((b.textContent || '').trim()));
    if (btn) { btn.click(); btn.click(); }
  });

  await page.waitForFunction(
    () => {
      const h1 = document.querySelector('#protoContent h1');
      return h1 && h1.textContent.includes('QA15 Renamed Proto');
    },
    { timeout: 30000 }
  );
  // give the bg updateWikilinksAfterRename a chance to complete
  await page.waitForTimeout(6000);
  await shot(page, 'proto-after-rename');

  cleanupPaths.splice(cleanupPaths.indexOf(OLD_PROTO_PATH), 1);
  cleanupPaths.push(NEW_PROTO_PATH);

  const postRenameMeta = await page.evaluate(() => {
    const h1 = document.querySelector('#protoContent h1');
    const breadcrumb = document.querySelector('#protoContent .breadcrumb');
    return {
      h1: h1 ? h1.textContent.trim() : null,
      breadcrumb: breadcrumb ? breadcrumb.textContent.trim() : null,
      url: location.search,
    };
  });
  console.log('postRenameMeta:', postRenameMeta);

  // ───────────────────────────────────────────────
  // STEP 5 — check sidebar reflects the new title
  // ───────────────────────────────────────────────
  await page.fill('#protoSearch', 'QA15');
  await page.waitForTimeout(600);
  await shot(page, 'sidebar-search-qa15');

  await page.fill('#protoSearch', '');
  await page.waitForTimeout(400);

  // ───────────────────────────────────────────────
  // STEP 6 — navigate the OLD slug deep-link — what happens?
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(OLD_PROTO_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await shot(page, 'proto-old-slug-deeplink');

  const oldSlugState = await page.evaluate(() => {
    const h1 = document.querySelector('#protoContent h1');
    const bodyText = (document.getElementById('protoContent') || document.body).innerText;
    const errorBanner = /failed to load|not found|404|no such/i.test(bodyText);
    return {
      h1: h1 ? h1.textContent.trim() : null,
      errorVisible: errorBanner,
      bodySnippet: bodyText.slice(0, 500),
    };
  });
  console.log('oldSlugState:', oldSlugState);

  // ───────────────────────────────────────────────
  // STEP 7 — reload notebook and check wikilinks post-rename
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/notebooks.html?doc=${encodeURIComponent(NB_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#renderedDoc', { timeout: 20000 });
  await page.waitForTimeout(3000);
  await shot(page, 'nb-loaded-post-rename');

  const nbPillStatePost = await page.evaluate((oldSlug) => {
    const root = document.getElementById('renderedDoc');
    if (!root) return { noRoot: true };
    const links = Array.from(root.querySelectorAll('a.object-pill, a[href^="obj://"]'));
    const lookupOld = (Lab.wikilinks && Lab.wikilinks._lookup) ? Lab.wikilinks._lookup(oldSlug) : null;
    return {
      count: links.length,
      links: links.map(a => ({
        href: a.getAttribute('href') || '',
        text: a.textContent.trim(),
        cls: a.className,
        bg: a.style.background || getComputedStyle(a).backgroundColor,
        hasIcon: !!a.querySelector('.material-icons-outlined, svg, img'),
      })),
      lookupOldSlug: lookupOld ? { title: lookupOld.title, type: lookupOld.type, path: lookupOld.path } : null,
    };
  }, OLD_SLUG);
  console.log('nbPillState POST rename:', JSON.stringify(nbPillStatePost, null, 2));

  await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const link = root && root.querySelector('a.object-pill, a[href^="obj://"]');
    if (link) link.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await shot(page, 'nb-first-pill-post-rename');

  await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const links = root ? root.querySelectorAll('a.object-pill, a[href^="obj://"]') : [];
    if (links[1]) links[1].scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await shot(page, 'nb-second-pill-post-rename');

  // Did updateWikilinksAfterRename rewrite the markdown?
  const liveNbBody = await page.evaluate(async (path) => {
    const f = await Lab.gh.fetchFile(path);
    return f ? f.content : null;
  }, NB_PATH);
  const hasOldSlug = liveNbBody && liveNbBody.includes(`[[${OLD_SLUG}]]`);
  const hasNewSlug = liveNbBody && liveNbBody.includes(`[[${NEW_SLUG}]]`);
  const hasOldPath = liveNbBody && liveNbBody.includes(`[[${OLD_PROTO_DOC}]]`);
  console.log('nb markdown post-rename:', { hasOldSlug, hasNewSlug, hasOldPath, len: liveNbBody && liveNbBody.length });

  // ───────────────────────────────────────────────
  // STEP 8 — click through the first pill, see what page it lands on
  // ───────────────────────────────────────────────
  await shot(page, 'nb-before-click-first-pill');
  const beforeClickUrl = await page.url();
  await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const link = root && root.querySelector('a.object-pill, a[href^="obj://"]');
    if (link) link.click();
  });
  await page.waitForTimeout(3500);
  await shot(page, 'after-click-first-pill');
  const afterClickUrl = await page.url();
  const afterClickH1 = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent.trim() : null;
  });
  console.log('pill click navigated from', beforeClickUrl, 'to', afterClickUrl, 'h1=', afterClickH1);

  // ───────────────────────────────────────────────
  // STEP 9 — backlinks panel on renamed protocol via editor-modal
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(NEW_PROTO_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot(page, 'renamed-proto-loaded');

  const popupState = await page.evaluate(async (newPath) => {
    if (!Lab.editorModal) return { noModal: true };
    await Lab.editorModal.open('docs/' + newPath);
    await new Promise(r => setTimeout(r, 1500));
    const popup = document.getElementById('editor-modal') || document.querySelector('.edit-modal-backdrop, .em-modal, [data-editor-modal]');
    if (!popup) return { noPopup: true };
    const bodyText = popup.innerText || '';
    const refLinks = Array.from(popup.querySelectorAll('a[href^="obj://"], a.object-pill')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href') || '',
    }));
    return {
      bodySnippet: bodyText.slice(0, 2000),
      refLinks,
      hasReferencesHeader: /references|referenced by|backlinks?/i.test(bodyText),
    };
  }, NEW_PROTO_DOC);
  console.log('popupState (renamed proto):', JSON.stringify(popupState, null, 2));
  await shot(page, 'renamed-proto-popup');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // ───────────────────────────────────────────────
  // STEP 10 — wiki.html?doc=<old-slug> deep-link behavior
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent(OLD_SLUG)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await shot(page, 'wiki-old-slug-deeplink');

  const wikiOldSlugState = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasError = /failed to load|404|not found/i.test(bodyText);
    return {
      hasError,
      url: location.search,
      bodySnippet: bodyText.slice(0, 500),
    };
  });
  console.log('wikiOldSlugState:', wikiOldSlugState);

  // ───────────────────────────────────────────────
  // STEP 11 — wiki.html?doc=<new-slug>
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/wiki.html?doc=${encodeURIComponent(NEW_SLUG)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await shot(page, 'wiki-new-slug-deeplink');

  // ───────────────────────────────────────────────
  // STEP 12 — labmap filter 'qa15'
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/lab-map.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot(page, 'lab-map-before-qa15-filter');

  const filterInput = await page.$('input[placeholder*="earch"], input[type="search"], #locationFilter, input#locFilter, input[placeholder*="Filter"]');
  if (filterInput) {
    await filterInput.fill('qa15');
    await page.waitForTimeout(1200);
    await shot(page, 'lab-map-filter-qa15');
  } else {
    console.log('No filter input located on lab-map.html — skipping');
  }

  // ───────────────────────────────────────────────
  // STEP 13 — impatient back-button from the renamed proto
  // ───────────────────────────────────────────────
  await page.goto(`${BASE}/app/protocols.html?doc=${encodeURIComponent(NEW_PROTO_DOC)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot(page, 'renamed-proto-before-back');

  await page.goBack({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot(page, 'after-back-button');

  // ───────────────────────────────────────────────
  // STEP 14 — final summary + findings
  // ───────────────────────────────────────────────
  const summary = {
    old_slug: OLD_SLUG,
    new_slug: NEW_SLUG,
    nb_path: NB_PATH,
    initialMeta,
    postRenameMeta,
    oldSlugState,
    pre_pill_count: nbPillStatePre && nbPillStatePre.count,
    post_pill_count: nbPillStatePost && nbPillStatePost.count,
    post_pill_links: nbPillStatePost && nbPillStatePost.links,
    lookup_old_slug_post: nbPillStatePost && nbPillStatePost.lookupOldSlug,
    nb_markdown_has_old_slug: hasOldSlug,
    nb_markdown_has_new_slug: hasNewSlug,
    nb_markdown_has_old_path: hasOldPath,
    pill_click_url_before: beforeClickUrl,
    pill_click_url_after: afterClickUrl,
    pill_click_h1_after: afterClickH1,
    wiki_old_slug_state: wikiOldSlugState,
    popup_ref_links: popupState && popupState.refLinks,
    popup_body_preview: popupState && popupState.bodySnippet ? popupState.bodySnippet.slice(0, 400) : null,
  };
  console.log('\n🔎 SUMMARY:', JSON.stringify(summary, null, 2));

  if (hasOldSlug && !hasNewSlug) {
    findings.bugs.push({
      id: 'RENAME-WIKILINK-REWRITE-FAILED',
      summary: 'After renaming a protocol, inbound wikilinks in other files still reference the old slug — updateWikilinksAfterRename did not rewrite them.',
    });
  }
  const popupRefsHasNb = popupState && Array.isArray(popupState.refLinks)
    && popupState.refLinks.some(r => /QA15 Rename Consumer/i.test(r.text) || /notebooks\//i.test(r.href));
  if (!popupRefsHasNb) {
    findings.bugs.push({
      id: 'RENAME-BACKLINKS-MISSING',
      summary: 'Renamed protocol popup does not list the notebook entry in its backlinks/references, even though the notebook still has a wikilink to it.',
    });
  }

  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({
    cycle: CYCLE,
    cleanupPaths,
    summary,
    findings,
    nbPillStatePre,
    nbPillStatePost,
    popupState,
    steps: log,
  }, null, 2));

  console.log('\n📋 cleanup paths:', cleanupPaths);
  console.log('\n🐞 bugs found:', findings.bugs.map(b => b.id));
} catch (err) {
  console.error('❌ script failed:', err.message);
  console.error(err.stack);
  try { await shot(page, 'error-state'); } catch (e) {}
  fs.writeFileSync(`${DIR}/_error.txt`, (err.stack || err.message) + '\n\ncleanupPaths=' + JSON.stringify(cleanupPaths));
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({ cleanupPaths, steps: log, error: err.message }, null, 2));
} finally {
  await browser.close();
}
