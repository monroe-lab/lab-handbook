#!/usr/bin/env node
/**
 * Verify cycle 12 fix: resized <img> should be block-level after save.
 * Scenario: heading `## Images`, then 2 resized + 3 regular images.
 * Expect saved markdown to have `## Images\n\n<img ...>` (blank line) NOT `## Images<img ...>`.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import zlib from 'zlib';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const CYCLE_DIR = '/tmp/qa-screenshots/cycle12-verify';
fs.mkdirSync(CYCLE_DIR, { recursive: true });
const TS = Date.now().toString(36);
const SLUG = `qa12-verify-${TS}`;
const PATH = `docs/notebooks/vianney-ahn/${SLUG}.md`;

function makePng(w, h, r, g, b) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const crc32 = (buf) => {
    let c, t = [];
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8]=8; ihdr[9]=2;
  const raw = Buffer.alloc((w*3+1)*h);
  for (let y = 0; y < h; y++) { raw[y*(w*3+1)] = 0; for (let x = 0; x < w; x++) { const o=y*(w*3+1)+1+x*3; raw[o]=r; raw[o+1]=g; raw[o+2]=b; } }
  return 'data:image/png;base64,' + Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript((tok) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', tok);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);
const page = await ctx.newPage();
page.setDefaultTimeout(20000);
page.on('pageerror', e => console.log('❌', e.message));

const cleanup = [PATH];

try {
  await page.goto(`${BASE}/app/notebooks.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('#newEntryBtn');
  await page.waitForSelector('#nbModal h3', { state: 'visible' });
  await page.selectOption('#nbm_type', 'blank');
  await page.selectOption('#nbm_folder', 'vianney-ahn');
  await page.fill('#nbm_name', SLUG);
  await page.click('#nbmOk');
  await page.waitForFunction(() => location.search.includes('doc=') && document.querySelector('#renderedDoc, #editorSurface'), { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.click('button[onclick="startEdit()"]');
  await page.waitForFunction(() => !!window.editorInstance && !!window.editorInstance.editor, { timeout: 20000 });
  await page.waitForSelector('.toastui-editor-ww-container .ProseMirror[contenteditable="true"]', { timeout: 20000 });
  await page.waitForTimeout(600);

  // Set simple body with one heading + image pattern
  await page.evaluate((md) => {
    window.editorInstance.editor.setMarkdown(md);
  }, '# Verify\n\n## Images\n');
  await page.waitForTimeout(300);

  // Upload + insert 5 images
  const IMGS = [
    { l: 'red',    url: makePng(200, 150, 200, 60, 60) },
    { l: 'blue',   url: makePng(200, 150, 60, 60, 200) },
    { l: 'green',  url: makePng(200, 150, 60, 200, 60) },
    { l: 'yellow', url: makePng(200, 150, 220, 220, 60) },
    { l: 'purple', url: makePng(200, 150, 160, 60, 200) },
  ];
  const uploads = await page.evaluate(async ({ imgs, slug }) => {
    const out = [];
    for (const im of imgs) {
      const blob = Lab.editorModal.dataUrlToBlob(im.url);
      const r = await Lab.editorModal.uploadImageBlob(blob, `${slug}-${im.l}.png`);
      out.push({ l: im.l, path: r.path });
    }
    return out;
  }, { imgs: IMGS, slug: SLUG });
  uploads.forEach(u => cleanup.push('docs/' + u.path));

  await page.evaluate((imgs) => {
    const ed = window.editorInstance.editor;
    const cur = ed.getMarkdown();
    const mdTail = imgs.map(i => `![${i.l}](${i.path})\n`).join('\n');
    ed.setMarkdown(cur + mdTail);
  }, uploads);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${CYCLE_DIR}/01-editor-before-resize.png` });

  // Resize red to 50%, blue to 25%
  const resized = await page.evaluate(({ redPath, bluePath }) => {
    const pm = document.querySelector('.toastui-editor-ww-container .ProseMirror');
    const imgs = Array.from(pm.querySelectorAll('img'));
    const findBy = (p) => imgs.find(i => (i.getAttribute('src') || '').includes(p.split('/').pop()));
    const resize = (img, pct) => {
      if (!img) return false;
      img.click();
      const tb = document.querySelector('[data-img-toolbar]');
      if (!tb) return false;
      const btn = Array.from(tb.querySelectorAll('button')).find(b => b.textContent.trim() === pct);
      if (!btn) return false;
      btn.click();
      return true;
    };
    return { red: resize(findBy(redPath), '50%'), blue: resize(findBy(bluePath), '25%') };
  }, { redPath: uploads[0].path, bluePath: uploads[1].path });
  console.log('resized:', resized);
  await page.waitForTimeout(300);

  // Save
  await page.click('#saveBtn');
  await page.waitForFunction(() => !document.getElementById('saveBtn') && !!document.getElementById('renderedDoc'), { timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${CYCLE_DIR}/02-after-save-rendered.png` });

  // Read raw markdown from GitHub
  const raw = await page.evaluate(async (p) => {
    const res = await fetch(
      `https://api.github.com/repos/${Lab.gh.REPO}/contents/${p}?ref=${Lab.gh.BRANCH}`,
      { headers: { Authorization: 'Bearer ' + Lab.gh.getToken() } }
    );
    if (!res.ok) return { error: res.status };
    const j = await res.json();
    return { content: atob(j.content.replace(/\n/g, '')) };
  }, PATH);
  console.log('raw markdown preview:');
  console.log(raw.content);

  // Assertions
  const assertions = [
    { name: 'no-heading-fusion', pass: !/##\s*Images\s*<img/.test(raw.content), details: 'heading must not fuse with img tag' },
    { name: 'blank-line-before-img', pass: /\n\n<img[^>]+red/.test(raw.content), details: 'blank line must precede first resized img' },
    { name: 'blank-line-after-img', pass: /red\.png[^>]*>\n\n/.test(raw.content), details: 'blank line must follow first resized img' },
    { name: 'red-at-50', pass: /red\.png[^>]*max-width:50%/.test(raw.content), details: 'red image at 50%' },
    { name: 'blue-at-25', pass: /blue\.png[^>]*max-width:25%/.test(raw.content), details: 'blue image at 25%' },
  ];

  console.log('\nAssertions:');
  assertions.forEach(a => console.log(`  ${a.pass ? '✅' : '❌'} ${a.name}: ${a.details}`));

  // Visual check: make sure the heading shows above the image, not below
  await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const h2 = Array.from(root.querySelectorAll('h2')).find(h => /Images/.test(h.textContent));
    const imgs = root.querySelectorAll('img');
    if (h2) h2.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${CYCLE_DIR}/03-heading-and-image-layout.png` });

  const layoutCheck = await page.evaluate(() => {
    const root = document.getElementById('renderedDoc');
    const h2 = Array.from(root.querySelectorAll('h2')).find(h => /Images/.test(h.textContent));
    if (!h2) return { error: 'no images h2' };
    const h2Rect = h2.getBoundingClientRect();
    const h2HasImg = !!h2.querySelector('img');
    const firstImgAfterH2 = (() => {
      let n = h2.nextElementSibling;
      while (n && !n.querySelector('img')) n = n.nextElementSibling;
      return n ? n.querySelector('img').getBoundingClientRect() : null;
    })();
    return { h2Top: h2Rect.top, h2Bottom: h2Rect.bottom, h2HasImgInside: h2HasImg, firstImgAfterH2 };
  });
  console.log('layoutCheck:', JSON.stringify(layoutCheck));

  fs.writeFileSync(`${CYCLE_DIR}/_log.json`, JSON.stringify({ slug: SLUG, path: PATH, uploads, assertions, layoutCheck, raw: raw.content, cleanup }, null, 2));

  console.log('\n✅ verify complete.');
  console.log('Cleanup paths:');
  cleanup.forEach(p => console.log('  ', p));
} catch (err) {
  console.error('❌ error:', err.message);
  console.error(err.stack);
  fs.writeFileSync(`${CYCLE_DIR}/_err.txt`, err.stack || err.message);
} finally {
  await browser.close();
}
