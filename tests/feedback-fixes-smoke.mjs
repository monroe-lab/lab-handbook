// E2E smoke test for the 2026-08-20 feedback fixes:
//   #184 — Enter-created blank gaps survive the save round-trip (nbsp spacers)
//   #179/#182 — Rename/Move modal on notebook entries (title edit in place)
// Runs against the live deployed site, creates a scratch entry in the barb-m
// demo notebook, and deletes it at the end.
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const GH_TOKEN = execSync('gh auth token').toString().trim();
const BASE = 'https://monroe-lab.github.io/lab-handbook';
const API = 'https://api.github.com/repos/monroe-lab/lab-handbook/contents';
const SLUG = 'smoke-feedback-fixes';
const FILE = `docs/notebooks/barb-m/${SLUG}.md`;

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.error(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
};

const ghFetch = async (path, opts = {}) => {
  const r = await fetch(`${API}/${path}?ref=main&_=${Date.now()}`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json', ...(opts.headers || {}) },
    ...opts,
  });
  return r.ok ? r.json() : null;
};

const cleanup = async () => {
  const f = await ghFetch(FILE);
  if (f) {
    await fetch(`${API}/${FILE}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${GH_TOKEN}` },
      body: JSON.stringify({ message: 'smoke test cleanup', sha: f.sha }),
    });
    console.log('  (cleaned up scratch entry)');
  }
};

await cleanup(); // in case a previous run died

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
await ctx.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
}, GH_TOKEN);
const page = await ctx.newPage();

try {
  // ── Create scratch entry via API, open it ──
  const content = `---\ntype: notebook\ntitle: Smoke Feedback Fixes\n---\n\n# Smoke Feedback Fixes\n\nfirst paragraph\n\nlast paragraph\n`;
  await fetch(`${API}/${FILE}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${GH_TOKEN}` },
    body: JSON.stringify({ message: 'smoke test scratch entry', content: Buffer.from(content).toString('base64') }),
  });

  await page.goto(`${BASE}/app/notebooks.html?doc=${encodeURIComponent('notebooks/barb-m/' + SLUG)}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#renderedDoc', { timeout: 20000 });

  // ── #179/#182: Rename button exists and edits the title in place ──
  const renameBtn = page.locator('button:has-text("Rename")');
  check('#182 Rename button present', await renameBtn.count() > 0);
  await renameBtn.click();
  await page.waitForSelector('.lab-modal input[data-modal-key="title"]', { timeout: 5000 });
  check('#179 folder select present in modal', await page.locator('.lab-modal select[data-modal-key="folder"]').count() > 0);
  await page.fill('.lab-modal input[data-modal-key="title"]', 'Smoke Renamed Title');
  await page.click('.lab-modal .lab-modal-ok');
  await page.waitForTimeout(2500);
  let f = await ghFetch(FILE);
  let saved = Buffer.from(f.content, 'base64').toString();
  check('#182 frontmatter title updated', /title: "?Smoke Renamed Title"?/.test(saved), saved.slice(0, 120));
  check('#182 H1 updated to match', saved.includes('# Smoke Renamed Title'));

  // ── #184: blank gaps typed in the editor survive save ──
  await page.click('button:has-text("Edit")');
  await page.waitForSelector('#editorSurface .toastui-editor-ww-container .ProseMirror', { timeout: 20000 });
  // Place cursor at end of the document and add gap + text
  await page.evaluate(() => {
    const pm = document.querySelector('#editorSurface .toastui-editor-ww-container .ProseMirror');
    pm.focus();
    const sel = window.getSelection();
    sel.selectAllChildren(pm);
    sel.collapseToEnd();
  });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('after the gap');
  await page.click('#saveBtn');
  await page.waitForTimeout(3000);
  f = await ghFetch(FILE);
  saved = Buffer.from(f.content, 'base64').toString();
  const hasSpacer = /\n \n/.test(saved) || /\n&nbsp;\n/.test(saved);
  check('#184 gap preserved as nbsp spacer paragraph', hasSpacer,
    'saved tail: ' + JSON.stringify(saved.slice(-200)));
  check('#184 typed text present after gap', saved.includes('after the gap'));
  check('#184 no raw <br> lines left in saved markdown', !/^\s*<br\s*\/?>\s*$/m.test(saved));
} catch (e) {
  fail++;
  console.error('  FAIL (exception): ' + e.message);
} finally {
  await browser.close();
  await cleanup();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
