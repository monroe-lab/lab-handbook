// #187 E2E: apply text color via the editor, verify it saves as a span,
// renders in view mode, and survives a second untouched edit/save cycle.
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const GH_TOKEN = execSync('gh auth token').toString().trim();
const API = 'https://api.github.com/repos/monroe-lab/lab-handbook/contents';
const FILE = 'docs/notebooks/barb-m/smoke-color-187.md';
const DOC = 'notebooks/barb-m/smoke-color-187';

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.error(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
};
const gh = async (path, opts = {}) => {
  const r = await fetch(`${API}/${path}?ref=main&_=${Date.now()}`, { headers: { Authorization: `Bearer ${GH_TOKEN}` }, ...opts });
  return r.ok ? r.json() : null;
};
const del = async () => {
  const f = await gh(FILE);
  if (f) await fetch(`${API}/${FILE}`, { method: 'DELETE', headers: { Authorization: `Bearer ${GH_TOKEN}` }, body: JSON.stringify({ message: 'cleanup', sha: f.sha }) });
};
await del();

const content = `---\ntype: notebook\ntitle: Color 187 Test\n---\n\n# Color 187 Test\n\ncolor me please\n`;
await fetch(`${API}/${FILE}`, { method: 'PUT', headers: { Authorization: `Bearer ${GH_TOKEN}` }, body: JSON.stringify({ message: 'color 187 scratch', content: Buffer.from(content).toString('base64') }) });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
await ctx.addInitScript((t) => { sessionStorage.setItem('monroe-lab-auth', 'true'); localStorage.setItem('gh_lab_token', t); }, GH_TOKEN);
const page = await ctx.newPage();

try {
  await page.goto('https://monroe-lab.github.io/lab-handbook/app/notebooks.html?doc=' + encodeURIComponent(DOC), { waitUntil: 'networkidle' });
  await page.waitForSelector('#renderedDoc', { timeout: 20000 });
  await page.click('button:has-text("Edit")');
  await page.waitForSelector('#editorSurface .toastui-editor-ww-container .ProseMirror', { timeout: 20000 });
  await page.waitForTimeout(1000);

  // 1. Plugin loaded + color command registered?
  const hasPlugin = await page.evaluate(() => !!(window.toastui && toastui.Editor.plugin && toastui.Editor.plugin.colorSyntax));
  check('color-syntax plugin loaded', hasPlugin);

  // 2. Toolbar shows a color button?
  const toolbarButtons = await page.$$eval('#editorSurface .toastui-editor-toolbar button', els => els.map(e => (e.className + ' ' + (e.getAttribute('aria-label') || '')).toLowerCase()));
  check('toolbar has color button', toolbarButtons.some(c => c.includes('color')), JSON.stringify(toolbarButtons));

  // 3. Select the paragraph text and apply color via the plugin command
  await page.evaluate(() => {
    const pm = document.querySelector('#editorSurface .toastui-editor-ww-container .ProseMirror');
    pm.focus();
  });
  await page.keyboard.press('ControlOrMeta+a');
  const applied = await page.evaluate(() => {
    try { window.editorInstance.editor.exec('color', { selectedColor: '#c62828' }); return 'ok'; }
    catch (e) { return e.message; }
  });
  check('color command executed', applied === 'ok', applied);
  await page.waitForTimeout(500);

  // 4. Save, fetch the file, expect a color span in the markdown
  await page.click('#saveBtn');
  await page.waitForTimeout(3000);
  let f = await gh(FILE);
  let saved = Buffer.from(f.content, 'base64').toString();
  check('saved markdown contains color span', /<span style="color:\s*#c62828">/i.test(saved),
    JSON.stringify(saved.slice(-250)));
  check('colored text intact', saved.includes('color me please'));

  // 5. View mode renders the color
  await page.waitForSelector('#renderedDoc', { timeout: 20000 });
  const viewColor = await page.$eval('#renderedDoc', el => {
    const s = el.querySelector('span[style*="color"]');
    return s ? getComputedStyle(s).color : null;
  });
  check('view mode renders red text', viewColor === 'rgb(198, 40, 40)', viewColor);

  // 6. Round-trip stability: open editor again, save untouched, span persists
  await page.click('button:has-text("Edit")');
  await page.waitForSelector('#editorSurface .toastui-editor-ww-container .ProseMirror', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.click('#saveBtn');
  await page.waitForTimeout(3000);
  f = await gh(FILE);
  saved = Buffer.from(f.content, 'base64').toString();
  check('span survives untouched edit/save cycle', /<span style="color:\s*#c62828">/i.test(saved),
    JSON.stringify(saved.slice(-250)));
} catch (e) {
  fail++;
  console.error('  FAIL (exception): ' + e.message);
} finally {
  await browser.close();
  await del();
  console.log('  (cleaned up)');
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
