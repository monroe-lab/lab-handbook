#!/usr/bin/env node
/**
 * QA Cycle 12 — Vianney Ahn (grad student) + thorough + "Photo-heavy notebook"
 *
 * Create a notebook entry under vianney-ahn with:
 *  - title + sections
 *  - 5 images uploaded via Lab.editorModal.uploadImageBlob
 *  - 2 images resized to 25% / 50%
 *  - save, reload, verify every image renders at the right size
 *  - scroll + screenshot each image area individually
 *
 * Thorough: fills every optional field, uploads multiple images, deeply linked
 * wikilinks. Tests the image pipeline end-to-end under multi-image load.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import zlib from 'zlib';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const CYCLE = 12;
const DIR = `/tmp/qa-screenshots/cycle${CYCLE}`;
const TS = Date.now().toString(36);
const TEST_NAME = `QA12 Photo Heavy Notebook ${TS}`;
const TEST_SLUG = `qa12-photo-heavy-${TS}`;
const TEST_FOLDER = 'vianney-ahn';
const TEST_PATH = `docs/notebooks/${TEST_FOLDER}/${TEST_SLUG}.md`;

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

// Minimal PNG maker to generate distinct test images
function makePngDataUrl(width, height, r, g, b) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const crc32 = (buf) => {
    let c, crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const off = y * (width * 3 + 1) + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }
  const idat = zlib.deflateSync(raw);
  const png = Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  return 'data:image/png;base64,' + png.toString('base64');
}

// 5 distinct test images — different sizes & colors so you can tell them apart in screenshots
const IMG_SPECS = [
  { label: 'plant', w: 200, h: 150, r: 64, g: 160, b: 72 },     // green (plant photo)
  { label: 'gel', w: 300, h: 120, r: 50, g: 50, b: 50 },         // dark grey (gel)
  { label: 'nanodrop', w: 250, h: 180, r: 30, g: 100, b: 180 },  // blue (nanodrop display)
  { label: 'tube-rack', w: 220, h: 140, r: 200, g: 180, b: 60 }, // yellow (tube rack)
  { label: 'freezer', w: 260, h: 160, r: 180, g: 220, b: 235 },  // light blue (freezer)
];
const IMG_DATA_URLS = IMG_SPECS.map(s => ({ ...s, dataUrl: makePngDataUrl(s.w, s.h, s.r, s.g, s.b) }));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await context.newPage();
page.setDefaultTimeout(20000);

page.on('pageerror', (e) => console.log('❌ pageerror:', e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('⚠ console.error:', msg.text().slice(0, 260));
});

const cleanupPaths = [];

try {
  // Step 1: Notebooks baseline
  await page.goto(`${BASE}/app/notebooks.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, 'notebooks-baseline');

  // Step 2: Open new-entry modal
  await shot(page, 'before-click-new-entry');
  await page.click('#newEntryBtn');
  await page.waitForSelector('#nbModal h3', { state: 'visible' });
  await page.waitForTimeout(250);
  await shot(page, 'new-entry-modal-open');

  // Step 3: Fill modal
  await page.selectOption('#nbm_type', 'blank');
  await page.selectOption('#nbm_folder', TEST_FOLDER);
  await page.fill('#nbm_name', TEST_SLUG);
  await shot(page, 'new-entry-modal-filled');

  await shot(page, 'before-click-create');
  await page.click('#nbmOk');
  await page.waitForFunction(
    () => location.search.includes('doc=') && document.querySelector('#renderedDoc, #editorSurface'),
    { timeout: 20000 }
  );
  await page.waitForTimeout(1200);
  await shot(page, 'after-create-loaded');
  cleanupPaths.push(TEST_PATH);

  // Step 4: enter edit mode
  await shot(page, 'before-click-edit');
  await page.click('button[onclick="startEdit()"]');
  await page.waitForFunction(() => !!window.editorInstance && !!window.editorInstance.editor, { timeout: 20000 });
  await page.waitForSelector('.toastui-editor-ww-container .ProseMirror[contenteditable="true"]', { timeout: 20000 });
  await page.waitForTimeout(800);
  await shot(page, 'editor-opened');

  // Step 5: set body markdown with 5 sections (thorough = every field filled)
  const bodyMd = [
    `# ${TEST_NAME}`,
    '',
    '**Person:** Vianney Ahn',
    '',
    '**Date:** 2026-04-21',
    '',
    '**Project:** Pistachio pangenome (cycle12 QA)',
    '',
    '## Plan',
    '',
    '- Document 5 parts of today\'s workflow end-to-end with photos',
    '- Resize the smaller images to match the canonical handbook look',
    '- Cross-link to the relevant protocol, sample, and freezer box',
    '',
    '## Protocol',
    '',
    'Followed [[qiagen-dneasy-extraction]] on 3 samples.',
    '',
    '## Samples & storage',
    '',
    'Primary sample: [[sample-pistachio-4]]. Aliquots placed in [[box-pistachio-dna]] on [[shelf-minus80-a-1]].',
    '',
    '## Observations',
    '',
    '> ⚠️ **Watch Out**',
    '> Yield on Pistachio 6 was 20% lower than expected — likely a pellet-loss event during the final ethanol wash.',
    '',
    '## Next steps',
    '',
    '- [ ] Re-extract Pistachio 6 with an extra spin',
    '- [ ] Library prep Friday',
    '',
    '## Images',
    '',
  ].join('\n');

  await page.evaluate((md) => {
    window.editorInstance.editor.setMarkdown(md);
  }, bodyMd);
  await page.waitForTimeout(500);
  await shot(page, 'editor-after-setmarkdown');

  // Step 6: Upload 5 images via Lab.editorModal.uploadImageBlob, then insert them
  const uploads = await page.evaluate(async ({ specs, testSlug }) => {
    const results = [];
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      const blob = Lab.editorModal.dataUrlToBlob(s.dataUrl);
      const res = await Lab.editorModal.uploadImageBlob(blob, `${testSlug}-${s.label}.png`);
      results.push({ label: s.label, path: res.path, slug: res.slug });
    }
    return results;
  }, { specs: IMG_DATA_URLS, testSlug: TEST_SLUG });
  console.log('uploads:', uploads);
  uploads.forEach(u => cleanupPaths.push('docs/' + u.path));

  // Step 7: Insert image markdown into the editor (append to existing)
  await page.evaluate((imgs) => {
    const ed = window.editorInstance.editor;
    const cur = ed.getMarkdown();
    const imgMd = imgs.map(i => `![${i.label}](${i.path})\n`).join('\n');
    ed.setMarkdown(cur + imgMd);
  }, uploads);
  await page.waitForTimeout(1500);
  await shot(page, 'editor-after-images-inserted');

  // Scroll to images in the editor to visualize
  await page.evaluate(() => {
    const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
    if (ww) ww.scrollTo(0, ww.scrollHeight);
  });
  await page.waitForTimeout(400);
  await shot(page, 'editor-scrolled-to-images');

  // Step 8: Resize two images programmatically — plant to 50%, gel to 25%
  // The _imgSizes map is internal. Poke it via the click handler by picking images by src.
  const resizeResult = await page.evaluate(({ plantPath, gelPath }) => {
    const pm = document.querySelector('.toastui-editor-ww-container .ProseMirror');
    const imgs = Array.from(pm.querySelectorAll('img'));
    const findBySrc = (partial) => imgs.find(i => (i.getAttribute('src') || '').includes(partial));
    const clickResize = (img, pct) => {
      if (!img) return false;
      // Simulate the handler: dispatch click then click the right pct button
      img.click();
      const tb = document.querySelector('[data-img-toolbar]');
      if (!tb) return false;
      const btn = Array.from(tb.querySelectorAll('button')).find(b => b.textContent.trim() === pct);
      if (!btn) return false;
      btn.click();
      return true;
    };
    const plant = findBySrc(plantPath.split('/').pop());
    const gel = findBySrc(gelPath.split('/').pop());
    const r1 = clickResize(plant, '50%');
    const r2 = clickResize(gel, '25%');
    return { plantResized: r1, gelResized: r2, imgCount: imgs.length };
  }, { plantPath: uploads[0].path, gelPath: uploads[1].path });
  console.log('resizeResult:', resizeResult);
  await page.waitForTimeout(500);
  await shot(page, 'editor-after-resizes');

  // Step 9: Save
  await shot(page, 'before-save');
  await page.click('#saveBtn');
  await page.waitForFunction(
    () => !document.getElementById('saveBtn') && !!document.getElementById('renderedDoc'),
    { timeout: 30000 }
  );
  await page.waitForTimeout(1500);
  await shot(page, 'after-save-rendered');

  // Step 10: Evaluate rendered metrics
  const renderedMetrics = await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    if (!root) return null;
    const h1 = root.querySelector('h1')?.textContent || '';
    const h2s = Array.from(root.querySelectorAll('h2')).map(h => h.textContent.trim());
    const pills = root.querySelectorAll('a[data-wikilink], .lab-object-pill, a.obj-pill').length;
    const imgs = Array.from(root.querySelectorAll('img')).map((i, idx) => ({
      idx,
      src: i.getAttribute('src') || '',
      naturalW: i.naturalWidth,
      naturalH: i.naturalHeight,
      clientW: i.clientWidth,
      clientH: i.clientHeight,
      styleMaxWidth: i.style.maxWidth,
      complete: i.complete,
    }));
    return { h1, h2s, pills, imgCount: imgs.length, imgs };
  });
  console.log('renderedMetrics:', JSON.stringify(renderedMetrics, null, 2));

  // Step 11: Scroll to each image and screenshot
  for (let i = 0; i < renderedMetrics.imgCount; i++) {
    await page.evaluate((idx) => {
      const imgs = document.querySelectorAll('#renderedDoc img');
      if (imgs[idx]) imgs[idx].scrollIntoView({ block: 'center' });
    }, i);
    await page.waitForTimeout(300);
    await shot(page, `after-save-image-${i + 1}`);
  }

  // Step 12: Reload
  await shot(page, 'before-reload');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#renderedDoc', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, 'after-reload-rendered');

  const reloadMetrics = await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    if (!root) return null;
    const h1 = root.querySelector('h1')?.textContent || '';
    const h2s = Array.from(root.querySelectorAll('h2')).map(h => h.textContent.trim());
    const imgs = Array.from(root.querySelectorAll('img')).map((i, idx) => ({
      idx,
      src: i.getAttribute('src') || '',
      naturalW: i.naturalWidth,
      naturalH: i.naturalHeight,
      clientW: i.clientWidth,
      clientH: i.clientHeight,
      styleMaxWidth: i.style.maxWidth,
      complete: i.complete,
    }));
    const pills = root.querySelectorAll('a[data-wikilink], .lab-object-pill, a.obj-pill').length;
    return { h1, h2s, imgCount: imgs.length, imgs, pills };
  });
  console.log('reloadMetrics:', JSON.stringify(reloadMetrics, null, 2));

  for (let i = 0; i < reloadMetrics.imgCount; i++) {
    await page.evaluate((idx) => {
      const imgs = document.querySelectorAll('#renderedDoc img');
      if (imgs[idx]) imgs[idx].scrollIntoView({ block: 'center' });
    }, i);
    await page.waitForTimeout(400);
    await shot(page, `after-reload-image-${i + 1}`);
  }

  // Step 13: Fetch the raw markdown to see how resizes are persisted
  const rawMd = await page.evaluate(async ({ testPath }) => {
    const res = await fetch(
      `https://api.github.com/repos/${Lab.gh.REPO}/contents/${testPath}?ref=${Lab.gh.BRANCH}`,
      { headers: { Authorization: 'Bearer ' + Lab.gh.getToken() } }
    );
    if (!res.ok) return { error: res.status };
    const j = await res.json();
    return { content: atob(j.content.replace(/\n/g, '')) };
  }, { testPath: TEST_PATH });
  console.log('raw markdown preview:', (rawMd.content || '').slice(0, 1500));

  // Step 14: Scroll to top + full-page screenshot
  await page.evaluate(() => {
    document.getElementById('nbMain')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await shot(page, 'after-reload-top-of-page');

  // Full-page final shot
  await page.screenshot({ path: `${DIR}/zz-full-page-final.png`, fullPage: true });
  console.log(`📸 full-page saved: zz-full-page-final.png`);

  // Log artifacts
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({
    test_path: TEST_PATH,
    test_slug: TEST_SLUG,
    uploads,
    rendered: renderedMetrics,
    reload: reloadMetrics,
    rawMd: (rawMd.content || '').slice(0, 2500),
    cleanupPaths,
    steps: log,
  }, null, 2));

  console.log('\n✅ cycle 12 completed — cleanup needed:');
  cleanupPaths.forEach(p => console.log('  ', p));
} catch (err) {
  console.error('❌ script failed:', err.message);
  console.error(err.stack);
  try { await shot(page, 'error-state'); } catch (e) {}
  fs.writeFileSync(`${DIR}/_error.txt`, err.stack || err.message);
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({ cleanupPaths, steps: log, error: err.message }, null, 2));
} finally {
  await browser.close();
}
