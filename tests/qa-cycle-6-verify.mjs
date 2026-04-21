#!/usr/bin/env node
/**
 * QA Cycle 6 verify — confirms two fixes from the qa-cycle-6 commit:
 *
 * 1. fetchTree localStorage overlay (TREE_PATCH_KEY): after creating a notebook
 *    entry, fetchTree() returns the new path immediately, even right after a
 *    full reload, without waiting for GitHub's git/trees cache to catch up.
 *
 * 2. notebooks.html save flow now calls patchObjectIndex + patchLinkIndex:
 *    the new entry shows up in the link-index overlay as a source pointing at
 *    its wikilink targets (sample-pistachio-4, qiagen-dneasy-extraction),
 *    so backlink panels on the targets refresh immediately.
 *
 * Kept in the repo as a regression harness.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const DIR = '/tmp/qa-screenshots/cycle6-verify';
fs.mkdirSync(DIR, { recursive: true });

const TS = Date.now().toString(36);
const SLUG = `qa6v-fix-verify-${TS}`;
const FOLDER = 'vianney-ahn';
const FILE_PATH = `docs/notebooks/${FOLDER}/${SLUG}.md`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await context.newPage();
page.setDefaultTimeout(20000);

let stepN = 0;
async function shot(name) {
  stepN++;
  const file = `${DIR}/${String(stepN).padStart(2,'0')}-${name}.png`;
  await page.screenshot({ path: file });
  console.log(`shot ${name}`);
  return file;
}

const results = { fixA: null, fixB: null };

try {
  // 1. Create entry via the UI (notebooks.html newEntry flow)
  await page.goto(`${BASE}/app/notebooks.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('baseline-vianney');

  // Capture the pre-creation count for VIANNEY AHN (sidebar)
  const preCount = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('.nb-folder-header, .folder-header, [data-folder]'));
    const v = headers.find(h => /vianney/i.test(h.textContent || ''));
    if (!v) return null;
    const m = (v.textContent || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  });
  console.log('pre-create count:', preCount);

  await page.click('#newEntryBtn');
  await page.waitForSelector('#nbModal h3', { state: 'visible' });
  await page.selectOption('#nbm_type', 'blank');
  await page.selectOption('#nbm_folder', FOLDER);
  await page.fill('#nbm_name', SLUG);
  await page.click('#nbmOk');
  await page.waitForFunction(() => location.search.includes('doc=') && document.querySelector('#renderedDoc'), { timeout: 20000 });
  await page.waitForTimeout(800);

  // Edit + add a wikilink to sample-pistachio-4 + save
  await page.click('button[onclick="startEdit()"]');
  await page.waitForFunction(() => !!(window.editorInstance && window.editorInstance.editor));
  await page.evaluate(() => {
    window.editorInstance.editor.setMarkdown([
      '# QA6 verify',
      '',
      'Backlink to [[sample-pistachio-4]] and [[qiagen-dneasy-extraction]].',
    ].join('\n'));
  });
  await page.waitForTimeout(400);
  await page.click('#saveBtn');
  await page.waitForFunction(() => !document.getElementById('saveBtn') && !!document.getElementById('renderedDoc'));
  await page.waitForTimeout(800);
  await shot('after-create-and-save');

  // 2. Reload + verify both overlays still produce the right answers
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('after-reload');

  // Fix A — fetchTree should include our new path even though git/trees may lag
  results.fixA = await page.evaluate(async (filePath) => {
    const files = await Lab.gh.fetchTree('docs');
    const sawIt = files.includes(filePath);
    const treePatches = JSON.parse(localStorage.getItem('lab_tree_patches') || '{}');
    return { sawIt, hasOverlayEntry: !!treePatches[filePath], overlayKind: treePatches[filePath] && treePatches[filePath].kind };
  }, FILE_PATH);
  console.log('FIX A (fetchTree overlay):', JSON.stringify(results.fixA));

  // Fix B — link index should list our entry as a source for both wikilink targets
  results.fixB = await page.evaluate(async (slug) => {
    const idx = await Lab.gh.fetchLinkIndex();
    const ourSource = `notebooks/vianney-ahn/${slug}`;
    const targetsHit = ['samples/sample-pistachio-4', 'sample-pistachio-4', 'wet-lab/qiagen-dneasy-extraction', 'qiagen-dneasy-extraction'];
    const hits = {};
    targetsHit.forEach(t => {
      const list = idx.filter(e => e.target === t || e.target.endsWith('/' + t));
      hits[t] = list.filter(e => e.source === ourSource || e.source.endsWith('/' + slug)).length;
    });
    const objIdx = await Lab.gh.fetchObjectIndex();
    const ourEntry = objIdx.find(e => e.path === `notebooks/vianney-ahn/${slug}.md`);
    return { hits, hasObjectEntry: !!ourEntry, objectEntry: ourEntry };
  }, SLUG);
  console.log('FIX B (link + object index):', JSON.stringify(results.fixB));

  // 3. Sidebar count should reflect the new entry (count went up)
  const postCount = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('.nb-folder-header, .folder-header, [data-folder]'));
    const v = headers.find(h => /vianney/i.test(h.textContent || ''));
    if (!v) return null;
    const m = (v.textContent || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  });
  console.log('post-reload count:', postCount, '(pre was', preCount, ')');
  results.sidebar = { pre: preCount, post: postCount, incremented: postCount !== null && preCount !== null && postCount > preCount };

  fs.writeFileSync(`${DIR}/_results.json`, JSON.stringify({ filePath: FILE_PATH, slug: SLUG, results }, null, 2));
  console.log('\n✅ verify complete. Need cleanup:', FILE_PATH);
} catch (err) {
  console.error('❌ verify failed:', err.message, err.stack);
  await shot('error-state');
} finally {
  await browser.close();
}
