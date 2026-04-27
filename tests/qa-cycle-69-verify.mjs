// QA cycle 69 verify: confirm the People row label/pills stay aligned
// after the editor-modal.js fix. Re-creates an accession with 2 people,
// opens the popup, screenshots the FIELDS column, deletes when done.

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle69-verify';
fs.mkdirSync(SHOTS, { recursive: true });

const STAMP = Math.random().toString(36).slice(2, 8);
const ACC_ID = `qa69v-${STAMP}`;
const SLUG = ACC_ID.toLowerCase();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript((token) => {
  sessionStorage.setItem('monroe-lab-auth', 'true');
  localStorage.setItem('gh_lab_token', token);
  localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
}, GH_TOKEN);

const page = await context.newPage();
page.setDefaultTimeout(20000);

let n = 0;
async function shot(name) {
  n++;
  const file = path.join(SHOTS, `verify-${String(n).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file });
  console.log('📸', file);
}

try {
  console.log(`verify accession: ${ACC_ID}`);

  // Use API to create the accession directly so we don't have to wait through
  // the full add flow — we just need a popup with 2 people values to verify
  // the fix.
  const fm = `---
type: "accession"
title: "${ACC_ID}"
accession_id: "${ACC_ID}"
species: "Pistacia vera"
project: "QA Cycle 69 Verify"
people: "[[grey-monroe]], [[mariele-lensink]]"
status: "active"
priority: "2"
last_updated: "2026-04-27"
status_note: "Two-person verify — pills should align with label"
---

# ${ACC_ID}

Verify accession created via API for cycle 69 People row alignment fix.
`;
  const createRes = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
    method: 'PUT',
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-69-verify', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'qa-cycle-69 verify fixture',
      content: Buffer.from(fm).toString('base64'),
    }),
  });
  if (!createRes.ok) throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`);
  console.log('  fixture created');

  // Wait briefly for index updates to settle
  await new Promise(r => setTimeout(r, 1500));

  // Open accessions page deep-linked to the fixture
  await page.goto(`${BASE}/app/accessions.html?doc=accessions/${SLUG}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#em-title:not(:has-text("Loading"))', { timeout: 25000 });
  await page.waitForTimeout(1500);
  await shot('popup-readonly');

  // Screenshot just the fields column
  const fields = page.locator('#em-col-fields, .em-col-fields').first();
  if (await fields.count()) {
    await fields.screenshot({ path: path.join(SHOTS, 'verify-02-fields-column.png') });
    console.log('📸 verify-02-fields-column.png');
  }

  // Cleanup: delete the fixture
  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-69-verify' }
  });
  const meta = await getRes.json();
  await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
    method: 'DELETE',
    headers: { Authorization: `token ${GH_TOKEN}`, 'User-Agent': 'qa-cycle-69-verify', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'qa-cycle-69 verify cleanup', sha: meta.sha }),
  });
  console.log('  fixture deleted');
  console.log('✅ verify done');
} catch (err) {
  console.error('❌ FAIL:', err.message);
  // best-effort cleanup
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
      headers: { Authorization: `token ${GH_TOKEN}` }
    });
    if (r.ok) {
      const d = await r.json();
      await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions/${SLUG}.md`, {
        method: 'DELETE',
        headers: { Authorization: `token ${GH_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'qa-cycle-69 verify failure cleanup', sha: d.sha }),
      });
    }
  } catch (e) {}
  throw err;
} finally {
  await browser.close();
}
