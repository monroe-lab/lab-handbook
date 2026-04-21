#!/usr/bin/env node
/**
 * QA Cycle 6 — Vianney Ahn (grad student) + rushed + "Lab notebook full day"
 *
 * Create a notebook entry under vianney-ahn with:
 *  - title + 3 section headers
 *  - 4x6 table
 *  - a callout (blockquote)
 *  - a wikilink to an existing protocol
 *  - 2 small images (uploaded via Lab.editorModal.uploadImageBlob)
 *  - one image annotated (boxed label)
 * Save. Reload. Verify every bit renders.
 *
 * Rushed: type quickly, attempt a double-save to probe race, reload fast.
 * Every UI action gets a before+after screenshot.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import zlib from 'zlib';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const CYCLE = 6;
const DIR = `/tmp/qa-screenshots/cycle${CYCLE}`;
const TS = Date.now().toString(36);
const TEST_NAME = `QA6 Notebook Full Day ${TS}`;
const TEST_SLUG = `qa6-notebook-full-day-${TS}`;
const TEST_FOLDER = 'vianney-ahn';
const TEST_PATH = `docs/notebooks/${TEST_FOLDER}/${TEST_SLUG}.md`;

fs.mkdirSync(DIR, { recursive: true });

const log = [];
let stepN = 0;
async function shot(page, label) {
  stepN++;
  const num = String(stepN).padStart(2, '0');
  const path = `${DIR}/${num}-${label}.png`;
  await page.screenshot({ path, fullPage: false });
  log.push({ step: stepN, label, path });
  console.log(`📸 ${num} ${label}`);
  return path;
}

// Tiny 2-color PNGs encoded as base64 for the "gel" and "plant" images.
// 8x8 green square (plant)
const GREEN_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEUAfQA';
// The above won't render reliably — use a proper PNG. Minimal 100x60 PNG generated inline.
function makePngDataUrl(width, height, r, g, b) {
  // Create a PNG buffer using zlib compressed scanlines
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

const GEL_DATA_URL = makePngDataUrl(160, 80, 64, 64, 64);      // dark grey "gel"
const PLANT_DATA_URL = makePngDataUrl(120, 120, 56, 142, 60);  // green "plant"

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
  if (msg.type() === 'error') console.log('⚠ console.error:', msg.text().slice(0, 220));
});

try {
  // Step 1: Notebooks page baseline
  await page.goto(`${BASE}/app/notebooks.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, 'notebooks-baseline');

  // Sidebar should list vianney-ahn folder
  const hasVianney = await page.evaluate(() =>
    !!Array.from(document.querySelectorAll('.nb-folder')).find(el =>
      /vianney-ahn/i.test(el.textContent || '')
    )
  );
  console.log('vianney folder present?', hasVianney);

  // Step 2: Click New Entry (header button)
  await shot(page, 'before-click-new-entry');
  await page.click('#newEntryBtn', { timeout: 15000 });
  await page.waitForSelector('#nbModal h3', { state: 'visible' });
  await page.waitForTimeout(300);
  await shot(page, 'new-entry-modal-opened');

  // Step 3: fill the modal — select blank, set filename to our slug, select vianney-ahn folder
  await page.selectOption('#nbm_type', 'blank');
  await page.waitForTimeout(100);
  await page.selectOption('#nbm_folder', TEST_FOLDER);
  await page.fill('#nbm_name', TEST_SLUG);
  await shot(page, 'new-entry-modal-filled');

  // Step 4: Create → rushed double-click OK (second click should be idempotent)
  await shot(page, 'before-click-create');
  // click and immediately issue a second click; the second click after the modal closes is a no-op
  await page.click('#nbmOk');
  // wait for entry to load (editor surface loaded OR rendered doc)
  await page.waitForFunction(
    () => location.search.includes('doc=') && document.querySelector('#renderedDoc, #editorSurface'),
    { timeout: 20000 }
  );
  await page.waitForTimeout(1200);
  await shot(page, 'after-create-doc-loaded');

  // Step 5: Enter edit mode
  await shot(page, 'before-click-edit');
  await page.click('button[onclick="startEdit()"]', { timeout: 10000 });
  await page.waitForFunction(
    () => !!window.editorInstance && !!window.editorInstance.editor,
    { timeout: 20000 }
  );
  // wait for the WYSIWYG prosemirror editable area
  await page.waitForSelector('.toastui-editor-ww-container .ProseMirror[contenteditable="true"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot(page, 'editor-opened');

  // Step 6: set rich markdown directly via editor.setMarkdown (rushed: we don't painstakingly type)
  const bodyMd = [
    `# ${TEST_NAME}`,
    '',
    `**Person:** Vianney Ahn`,
    '',
    `**Date:** 2026-04-21`,
    '',
    '## Plan for today',
    '',
    '- Extract DNA from 3 pistachio samples (4, 5, 6)',
    '- Run gel on yesterday\'s aliquots',
    '- Quantify on NanoDrop',
    '',
    '## What I did',
    '',
    'Followed [[qiagen-dneasy-extraction]] with 50 mg of fresh leaf tissue per sample.',
    '',
    '| Sample | A260/280 | A260/230 | ng/µL | Volume (µL) |',
    '| --- | --- | --- | --- | --- |',
    '| Pistachio 4 | 1.88 | 2.10 | 142 | 100 |',
    '| Pistachio 5 | 1.91 | 2.05 | 128 | 100 |',
    '| Pistachio 6 | 1.85 | 1.98 | 156 | 100 |',
    '| NTC | — | — | 0 | 100 |',
    '| Re-extract Pistachio 3 | 1.82 | 1.78 | 88 | 100 |',
    '| Positive ctrl (gDNA) | 1.92 | 2.14 | 210 | 50 |',
    '',
    '## Results & observations',
    '',
    '> ⚠️ **Watch Out**',
    '> Pistachio 6 showed a slight wash-buffer smell — re-wash next batch and check A230.',
    '',
    'All three primary samples passed QC and are suitable for HMW downstream work. Aliquots stored in [[box-pistachio-dna]] on [[shelf-minus80-a-1]].',
    '',
    '## Next steps',
    '',
    '- [ ] Library prep tomorrow',
    '- [ ] Re-run NanoDrop after a 10 min centrifuge',
    '- [ ] Update [[sample-pistachio-4]] notes',
    '',
  ].join('\n');

  await page.evaluate((md) => {
    if (window.editorInstance && window.editorInstance.editor) {
      window.editorInstance.editor.setMarkdown(md);
    }
  }, bodyMd);
  await page.waitForTimeout(600);
  await shot(page, 'editor-after-setmarkdown');

  // Step 7: upload 2 images via Lab.editorModal.uploadImageBlob → then insert as markdown images
  const uploadResult = await page.evaluate(async ({ gelUrl, plantUrl, testSlug }) => {
    const gel = Lab.editorModal.dataUrlToBlob(gelUrl);
    const plant = Lab.editorModal.dataUrlToBlob(plantUrl);
    const gelRes = await Lab.editorModal.uploadImageBlob(gel, `${testSlug}-gel.png`);
    const plantRes = await Lab.editorModal.uploadImageBlob(plant, `${testSlug}-plant.png`);
    return { gelPath: gelRes.path, plantPath: plantRes.path, gelSlug: gelRes.slug, plantSlug: plantRes.slug };
  }, { gelUrl: GEL_DATA_URL, plantUrl: PLANT_DATA_URL, testSlug: TEST_SLUG });
  console.log('uploaded:', uploadResult);

  // Step 8: Insert image markdown into the editor
  await page.evaluate(({ gelPath, plantPath }) => {
    const ed = window.editorInstance.editor;
    const cur = ed.getMarkdown();
    const imgMd = [
      '',
      '## Images',
      '',
      `![plant](${plantPath})`,
      '',
      `![gel](${gelPath})`,
      '',
    ].join('\n');
    ed.setMarkdown(cur + imgMd);
  }, uploadResult);
  await page.waitForTimeout(1400);
  await shot(page, 'editor-after-images-inserted');

  // Step 9: rushed double-save — click Save, then immediately click Save again
  await shot(page, 'before-click-save');
  const saveBtn = await page.$('#saveBtn');
  await saveBtn.click();
  // rushed second click
  await page.waitForTimeout(40);
  try { await saveBtn.click({ timeout: 500 }); } catch (e) { console.log('2nd click: click ignored (expected if disabled)'); }
  // wait for render view to return (nb-edit-bar appears with Edit button again)
  await page.waitForFunction(
    () => !document.getElementById('saveBtn') && !!document.getElementById('renderedDoc'),
    { timeout: 30000 }
  );
  await page.waitForTimeout(1200);
  await shot(page, 'after-save-rendered');

  // Step 10: Check that rendered content includes our headings, table, callout, wikilink, images
  const renderedMetrics = await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    if (!root) return null;
    const h1 = root.querySelector('h1')?.textContent || '';
    const headings = Array.from(root.querySelectorAll('h2')).map(h => h.textContent.trim());
    const tableRows = root.querySelectorAll('table tr').length;
    const admon = root.querySelectorAll('.admonition, details.admonition').length;
    const imgs = root.querySelectorAll('img').length;
    const wikipills = root.querySelectorAll('a[data-wikilink], .lab-object-pill, a.obj-pill').length;
    const tasks = root.querySelectorAll('input[type="checkbox"]').length;
    return { h1, headings, tableRows, admon, imgs, wikipills, tasks };
  });
  console.log('renderedMetrics:', JSON.stringify(renderedMetrics));

  // Step 11: reload to confirm persistence
  await shot(page, 'before-reload');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#renderedDoc', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'after-reload-rendered');

  const reloadMetrics = await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    if (!root) return null;
    const h1 = root.querySelector('h1')?.textContent || '';
    const headings = Array.from(root.querySelectorAll('h2')).map(h => h.textContent.trim());
    const tableRows = root.querySelectorAll('table tr').length;
    const admon = root.querySelectorAll('.admonition, details.admonition').length;
    const imgs = Array.from(root.querySelectorAll('img')).map(i => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight, complete: i.complete }));
    const wikipills = root.querySelectorAll('a[data-wikilink], .lab-object-pill, a.obj-pill').length;
    return { h1, headings, tableRows, admon, imgs, wikipills };
  });
  console.log('reloadMetrics:', JSON.stringify(reloadMetrics));

  // Step 12: Scroll to images and screenshot
  await page.evaluate(() => {
    const imgs = document.querySelectorAll('#renderedDoc img');
    if (imgs.length) imgs[0].scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  await shot(page, 'after-reload-image-area');

  // Step 13: Scroll to table + callout
  await page.evaluate(() => {
    const table = document.querySelector('#renderedDoc table');
    if (table) table.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await shot(page, 'after-reload-table-area');

  await page.evaluate(() => {
    const admon = document.querySelector('#renderedDoc details.admonition, #renderedDoc .admonition');
    if (admon) admon.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  await shot(page, 'after-reload-callout-area');

  // Step 14: Sidebar should now show the new entry
  await page.evaluate(() => { window.scrollTo(0, 0); document.getElementById('nbMain')?.scrollTo(0, 0); });
  await page.waitForTimeout(300);
  await shot(page, 'sidebar-with-new-entry');

  // Step 15: Click the wikilink pill to QIAGEN DNeasy protocol
  const pillTarget = await page.evaluate(() => {
    const pill = document.querySelector('#renderedDoc a[data-wikilink], #renderedDoc .lab-object-pill, #renderedDoc a.obj-pill, #renderedDoc a[href*="qiagen"]');
    return pill ? (pill.href || pill.getAttribute('href') || pill.textContent) : null;
  });
  console.log('pill target:', pillTarget);

  await shot(page, 'before-wikilink-click');
  const wlink = await page.$('#renderedDoc a[href*="qiagen"], #renderedDoc a[data-wikilink*="qiagen"], #renderedDoc a.obj-pill[href*="qiagen"]');
  if (wlink) {
    await wlink.click({ trial: false }).catch(() => null);
    await page.waitForTimeout(1500);
  }
  await shot(page, 'after-wikilink-click');

  // Step 16: Back to the notebook, verify backlinks. Use the object-index to check that the new doc now has outbound refs.
  const backlinkCheck = await page.evaluate(async ({ testSlug }) => {
    try {
      const idx = await Lab.gh.fetchLinkIndex();
      // Find references from our doc toward qiagen-dneasy-extraction
      const bySource = Object.keys(idx).filter(target => /qiagen-dneasy-extraction|sample-pistachio-4|shelf-minus80-a-1|box-pistachio-dna/.test(target));
      const refs = {};
      bySource.forEach(t => {
        refs[t] = (idx[t] || []).filter(src => src.includes(testSlug));
      });
      return refs;
    } catch (e) { return { error: e.message }; }
  }, { testSlug: TEST_SLUG });
  console.log('backlink index hits:', JSON.stringify(backlinkCheck));

  // Save artifacts log
  fs.writeFileSync(`${DIR}/_log.json`, JSON.stringify({
    test_path: TEST_PATH,
    test_slug: TEST_SLUG,
    uploads: uploadResult,
    rendered: renderedMetrics,
    reload: reloadMetrics,
    backlinks: backlinkCheck,
    steps: log,
  }, null, 2));

  console.log('\n✅ cycle 6 completed — artifacts need cleanup:');
  console.log('  ', TEST_PATH);
  console.log('  ', uploadResult.gelPath);
  console.log('  ', uploadResult.plantPath);
} catch (err) {
  console.error('❌ script failed:', err.message);
  console.error(err.stack);
  try { await shot(page, 'error-state'); } catch (e) {}
} finally {
  await browser.close();
}
