/**
 * QA Cycle 3 — verify dashboard sync fix
 * Toggle 2 items to needs_more, navigate to dashboard, verify the
 * Inventory Status card reflects the new state (counts + alert rows).
 * Cleanup both items back to in_stock at end.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle3-verify';
fs.mkdirSync(SHOTS, { recursive: true });

function shot(page, step, label) {
  const path = `${SHOTS}/${String(step).padStart(2, '0')}-${label}.png`;
  return page.screenshot({ path, fullPage: false }).then(() => path);
}

async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const json = await res.json();
  return { sha: json.sha, content: Buffer.from(json.content, 'base64').toString('utf8') };
}
async function ghPut(path, content, sha, message) {
  const body = { message, content: Buffer.from(content).toString('base64') };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
function flipStatusInFrontmatter(text, newStatus) {
  if (/^---[\s\S]*?^status:/m.test(text)) return text.replace(/(^---[\s\S]*?)^status:\s*\S.*$/m, `$1status: ${newStatus}`);
  return text.replace(/^---\n/, `---\nstatus: ${newStatus}\n`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
    // Clear any lingering patches from prior cycles so baseline is clean.
    localStorage.removeItem('lab:objectIndexPatches');
  }, GH_TOKEN);

  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (err) => console.log('  [page error]', err.message));

  // Dashboard baseline
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await shot(page, 0, 'dashboard-baseline');
  const baseline = await page.evaluate(() => {
    const el = document.getElementById('inventoryStatus');
    return {
      text: el ? el.innerText : null,
      alertCount: el ? el.querySelectorAll('.dash-list-item').length : 0,
    };
  });
  console.log('baseline:', JSON.stringify(baseline));

  // Go to inventory, pick 2 in_stock items
  await page.goto(`${BASE}/app/inventory.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  const picks = await page.evaluate(() => {
    const cands = inventory.filter((i) => i.status === 'in_stock');
    return cands.slice(0, 2).map((i) => ({ slug: i.slug, path: i.path, name: i.name }));
  });
  console.log('picks:', JSON.stringify(picks));

  // Toggle both to needs_more
  for (const p of picks) {
    await page.evaluate(async (s) => { await cycleStatus(s); await new Promise((r) => setTimeout(r, 1200)); }, p.slug);
    await page.waitForTimeout(1200);
  }
  await shot(page, 1, 'inventory-after-2-toggles');
  const invStats = await page.evaluate(() => ({
    in_stock: parseInt(document.getElementById('statInStock').textContent, 10),
    needs_more: parseInt(document.getElementById('statNeedsMore').textContent, 10),
    out_of_stock: parseInt(document.getElementById('statOutOfStock').textContent, 10),
  }));
  console.log('inventory stats:', JSON.stringify(invStats));

  // Navigate to dashboard — this is the test of the fix
  await page.goto(`${BASE}/app/dashboard.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await shot(page, 2, 'dashboard-after-fix');

  const post = await page.evaluate((pickSlugs) => {
    const el = document.getElementById('inventoryStatus');
    if (!el) return null;
    const text = el.innerText;
    const alerts = Array.from(el.querySelectorAll('.dash-list-item')).map((a) => ({
      text: a.innerText.trim(),
      href: a.querySelector('a')?.getAttribute('href') || null,
    }));
    const picksFound = pickSlugs.map((s) => alerts.some((a) => (a.href || '').includes(s)));
    return { text, alertCount: alerts.length, picksFound, alerts };
  }, picks.map((p) => p.slug));
  console.log('post (with fix):', JSON.stringify(post, null, 2));

  // Cleanup: restore both to in_stock
  for (const p of picks) {
    const rel = p.path.startsWith('docs/') ? p.path : `docs/${p.path}`;
    try {
      const { sha, content } = await ghGet(rel);
      const updated = flipStatusInFrontmatter(content, 'in_stock');
      if (updated !== content) {
        await ghPut(rel, updated, sha, `qa-cycle-3-verify cleanup: restore ${p.slug} to in_stock`);
        console.log(`  cleaned up ${p.slug}`);
      }
    } catch (e) {
      console.log(`  cleanup failed for ${p.slug}:`, e.message);
    }
  }

  const result = {
    baseline,
    picks,
    invStats,
    post,
    fixWorks: post && post.picksFound && post.picksFound.every((b) => b === true),
  };
  fs.writeFileSync(`${SHOTS}/_result.json`, JSON.stringify(result, null, 2));
  console.log('\nfixWorks:', result.fixWorks);

  await browser.close();
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
