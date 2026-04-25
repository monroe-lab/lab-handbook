/**
 * QA Cycle 49
 * Persona: Vianney Ahn (grad student)
 * Modifier: adversarial (HTML/script injection, emoji, very long titles, weird positions)
 * Scenario: Aliquot day with adversarial instance names
 *   1. Open Accessions tracker, screenshot grid + concept/instance banner
 *   2. Search & open accession a1-t1-e (Kerman Somatic project)
 *   3. Click "Add instance" → pick "extraction" (creates docs/accessions/extraction-a1-t1-e-XXX.md)
 *   4. Adversarial: rename title to include <script>, &amp;, emoji, quotes, very long string
 *   5. Set parent location via picker → box-pistachio-dna (10x10 grid)
 *   6. Set position to A1
 *   7. Save
 *   8. Verify file persisted via GH API; verify title is sanitized in YAML (quoted)
 *   9. Repeat for a 2nd instance with even-weirder unicode + RTL marks at position B2
 *   10. Reopen accession popup → verify both instances appear under "INSTANCES IN LAB"
 *       with correct pill, parent label, and position
 *   11. Open box-pistachio-dna popup → verify the grid renders A1 + B2 occupied
 *       and the title text is HTML-escaped (no script execution)
 *   12. Cleanup: delete both extraction files via GH API
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'https://monroe-lab.github.io/lab-handbook';
const REPO = 'monroe-lab/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const SHOTS = '/tmp/qa-screenshots/cycle49';
fs.mkdirSync(SHOTS, { recursive: true });

const ACCESSION_SLUG = 'accessions/a1-t1-e';
const BOX_SLUG = 'locations/box-pistachio-dna';

// Two adversarial titles
const TITLES = [
  '<script>alert("XSS49")</script>🧪 ETOH 96% & "quoted" — emdash <b>BOLD</b> ' + 'a'.repeat(60),
  'Аккеѕѕіоп" 🇺🇸‎‮ weird-marks ‹›&\'<img src=x onerror=alert(1)> end',
];

let stepN = 0;
async function shot(page, label) {
  stepN++;
  const path = `${SHOTS}/step${String(stepN).padStart(2, '0')}-${label}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log('  📸', path);
  return path;
}

async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=main`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return null;
  const j = await res.json();
  j.decoded = Buffer.from(j.content, 'base64').toString('utf8');
  return j;
}

async function ghDelete(path, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sha }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`DELETE ${path} → ${res.status}: ${t.slice(0, 300)}`);
  }
}

async function listAccessionInstances() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/docs/accessions?ref=main`, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return [];
  return res.json();
}

const cleanup = []; // { path, sha }
const findings = [];

async function createOneInstance(page, title, position, label) {
  console.log(`▶ Creating instance: title=${title.slice(0,40)}…  position=${position}`);

  // ── click "Add instance" inside the open accession popup
  const conceptSlug = ACCESSION_SLUG;
  const beforeFiles = (await listAccessionInstances()).map(f => f.name);

  // Use the public API directly — cleaner than DOM scraping the button
  await page.evaluate(async (cs) => {
    if (Lab && Lab.editorModal && typeof Lab.editorModal._addInstance === 'function') {
      window.__addInstancePromise = Lab.editorModal._addInstance(cs);
    }
  }, conceptSlug);

  // Wait for the kind-picker form to appear
  await page.waitForTimeout(800);
  await shot(page, `${label}-kind-picker-open`);

  // The form modal has a select for "kind"; default = sample. Pick "extraction".
  await page.evaluate(() => {
    const sel = document.querySelector('.lab-modal select, select[name="kind"]');
    if (sel) {
      sel.value = 'extraction';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await shot(page, `${label}-kind-picker-extraction`);

  // Click submit
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.lab-modal button')].find(b => /create|submit|ok/i.test(b.textContent || ''));
    if (btn) btn.click();
  });
  // Wait for: file save (network) → patchIndex → openPopup (refetch) → startEditing (300ms) → focus parent (500ms)
  await page.waitForTimeout(2800);
  await shot(page, `${label}-after-create`);

  // Determine the new file path
  const afterFiles = (await listAccessionInstances()).map(f => f.name);
  const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
  if (!newFiles.length) throw new Error('no new accession instance file created');
  const newPath = `docs/accessions/${newFiles[0]}`;
  cleanup.push({ path: newPath });
  console.log('  new instance path:', newPath);

  // ── Set the title field with adversarial value
  console.log('  → set title to adversarial value');
  const titleInput = await page.$('.em-field-input[data-key="title"]');
  if (titleInput) {
    await titleInput.fill(title);
  } else {
    console.log('  ⚠ no title input found, using JS fallback');
    await page.evaluate((t) => {
      const inp = document.querySelector('.em-field-input[data-key="title"]');
      if (inp) {
        inp.value = t;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, title);
  }
  await shot(page, `${label}-title-filled`);

  // ── Open parent location picker (UI test path)
  const trigger = await page.$('#em-parent-picker-trigger');
  if (!trigger) throw new Error('no location picker trigger');
  await trigger.click();
  await page.waitForTimeout(700);
  await shot(page, `${label}-loc-picker-open`);

  // Search "pistachio" in picker
  const pickerSearch = await page.$('#em-parent-picker-dropdown .lt-toolbar input');
  if (pickerSearch) {
    await pickerSearch.fill('pistachio dna');
    await page.waitForTimeout(900);
    await shot(page, `${label}-loc-picker-pistachio`);
  }

  // Try to click via the picker UI; fall back to a direct hidden-field set if that fails.
  let pickedLoc = await page.evaluate((slug) => {
    const node = document.querySelector(`#em-parent-picker-dropdown .lt-node[data-slug="${slug}"]`);
    if (node) {
      const row = node.querySelector('.lt-row');
      if (row) { row.click(); return slug; }
    }
    const rows = document.querySelectorAll('#em-parent-picker-dropdown .lt-row');
    for (const r of rows) {
      const t = r.querySelector('.lt-title');
      if (t && /pistachio dna/i.test((t.textContent||'').trim())) {
        r.click();
        return 'fallback';
      }
    }
    return null;
  }, BOX_SLUG);

  if (!pickedLoc) {
    // Fallback: directly set the parent hidden input value, dispatch input
    console.log('  ⚠ picker UI click failed; setting parent value directly');
    pickedLoc = await page.evaluate((slug) => {
      const inp = document.querySelector('.em-field-input[data-key="parent"]');
      if (!inp) return null;
      inp.value = slug;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      // close dropdown if still open
      const drop = document.getElementById('em-parent-picker-dropdown');
      if (drop) drop.style.display = 'none';
      return 'direct ' + slug;
    }, BOX_SLUG);
  }
  console.log('  picked loc:', pickedLoc);
  await page.waitForTimeout(700);
  await shot(page, `${label}-loc-picker-picked`);

  // ── Set position
  console.log('  → set position to', position);
  const posInput = await page.$('.em-field-input[data-key="position"]');
  if (posInput) {
    await posInput.fill(position);
  } else {
    console.log('  ⚠ no position input found');
  }
  await shot(page, `${label}-position-filled`);

  // ── Save (click the real save button)
  console.log('  → save');
  await page.evaluate(() => {
    const b = document.getElementById('em-save');
    if (b) b.click();
  });
  await page.waitForTimeout(2400);
  await shot(page, `${label}-after-save`);

  // ── Verify file via API
  const file = await ghGet(newPath);
  if (!file) throw new Error('saved file not found via GH API');
  cleanup[cleanup.length - 1].sha = file.sha;
  const c = file.decoded;
  console.log('  ─── saved file ───');
  console.log(c.slice(0, 700));
  console.log('  ─── /saved file ───');
  const hasOf = /\nof:.*a1-t1-e/.test(c);
  const hasParent = /\nparent:.*pistachio-dna/.test(c);
  const hasPos = new RegExp('\\nposition:.*' + position.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(c);
  console.log(`  of:✓=${hasOf} parent:✓=${hasParent} position:✓=${hasPos}`);
  findings.push({
    instance: label,
    path: newPath,
    title_quoted_in_yaml: c.includes('title: "') || c.includes("title: '") || /title:\s*\|/.test(c),
    of_correct: hasOf,
    parent_correct: hasParent,
    position_correct: hasPos,
    body_first_line: c.split('\n').find(l => l.startsWith('# ')) || '',
  });

  // ── Close editor
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await shot(page, `${label}-editor-closed`);
  return newPath;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'vianneyahn', avatar: '' }));
  }, GH_TOKEN);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Catch alert dialogs (XSS would surface here)
  let dialogCount = 0;
  page.on('dialog', async (d) => {
    dialogCount++;
    console.log('  ❗ DIALOG:', d.type(), d.message());
    findings.push({ alert_caught: { type: d.type(), message: d.message() } });
    await d.dismiss();
  });
  page.on('pageerror', err => console.log('  💥 page error:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  🟠 console error:', msg.text().slice(0, 200));
  });

  try {
    // ── 1. Accessions tracker
    console.log('▶ 1. Open Accessions tracker');
    await page.goto(`${BASE}/app/accessions.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, 'accessions-tracker-loaded');

    // ── 2. Filter: search a1-t1-e
    console.log('▶ 2. Search for a1-t1-e');
    const searchInp = await page.$('input[type="search"], #searchInput, input[placeholder*="search" i]');
    if (searchInp) {
      await searchInp.fill('a1-t1-e');
      await page.waitForTimeout(700);
    }
    await shot(page, 'accessions-search-a1-t1-e');

    // ── 3. Open accession popup directly via openPopup
    console.log('▶ 3. Open accession popup');
    await page.evaluate((slug) => {
      if (Lab && Lab.editorModal && typeof Lab.editorModal.open === 'function') {
        Lab.editorModal.open('docs/' + slug + '.md');
      }
    }, ACCESSION_SLUG);
    await page.waitForTimeout(1500);
    await shot(page, 'accession-popup-open');
    await shot(page, 'accession-popup-with-instances');

    // ── 4. Create first instance
    await createOneInstance(page, TITLES[0], 'A1', 'inst1');

    // Reopen accession popup before second create — saving closed it
    await page.evaluate((slug) => {
      Lab.editorModal.open('docs/' + slug + '.md');
    }, ACCESSION_SLUG);
    await page.waitForTimeout(1500);
    await shot(page, 'accession-popup-after-1st');

    // ── 5. Create second instance
    await createOneInstance(page, TITLES[1], 'B2', 'inst2');

    // ── 6. Reopen accession popup; verify both instances appear
    console.log('▶ 6. Reopen accession popup');
    await page.evaluate((slug) => {
      Lab.editorModal.open('docs/' + slug + '.md');
    }, ACCESSION_SLUG);
    await page.waitForTimeout(1500);
    await shot(page, 'accession-popup-final');

    // Get the rendered backlinks (should include both instances + position)
    const instancesHtml = await page.evaluate(() => {
      const node = document.querySelector('#em-backlinks, .em-popup-backlinks, [class*="backlink"]');
      return node ? node.innerHTML.slice(0, 3000) : null;
    });
    console.log('  instances backlinks html (truncated):');
    console.log((instancesHtml || '<none>').slice(0, 1500));

    // ── 7. Open box popup; verify grid renders A1 and B2 occupied
    console.log('▶ 7. Open box popup, verify grid');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.evaluate((slug) => {
      Lab.editorModal.open('docs/' + slug + '.md');
    }, BOX_SLUG);
    await page.waitForTimeout(1700);
    await shot(page, 'box-popup-with-grid');

    // Grid cell A1 + B2 occupied check
    const gridResult = await page.evaluate(() => {
      const cells = document.querySelectorAll('.em-grid-cell[data-cell]');
      const occ = {};
      cells.forEach(c => {
        const k = c.dataset.cell;
        occ[k] = {
          occupied: c.classList.contains('occupied'),
          slug: c.dataset.slug || null,
          // We render text inside .gc-label
          labelHTML: (c.querySelector('.gc-label') || {}).innerHTML || '',
          labelText: (c.querySelector('.gc-label') || {}).textContent || '',
        };
      });
      return {
        total: cells.length,
        a1: occ['A1'] || null,
        b2: occ['B2'] || null,
      };
    });
    console.log('  grid:', JSON.stringify(gridResult, null, 2).slice(0, 800));

    // Zoom on grid by scrolling into the contents pane
    await page.evaluate(() => {
      const m = document.querySelector('.em-grid');
      if (m) m.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(300);
    await shot(page, 'box-grid-zoomed');

    // ── 8. Hover A1 to confirm tooltip shows the title
    const a1Cell = await page.$('.em-grid-cell[data-cell="A1"]');
    if (a1Cell) {
      await a1Cell.hover();
      await page.waitForTimeout(400);
      await shot(page, 'a1-hover');
      const titleAttr = await a1Cell.getAttribute('title');
      console.log('  A1 title attr:', (titleAttr || '').slice(0, 200));
      findings.push({ a1_title_attr: titleAttr });
    }

    // ── 9. Click A1 → should open the instance popup
    if (a1Cell) {
      await a1Cell.click();
      await page.waitForTimeout(1500);
      await shot(page, 'a1-instance-popup');
      const popupTitleText = await page.evaluate(() => {
        const t = document.querySelector('.em-popup-title, #em-popup-title, h1.em-title');
        return t ? t.textContent : null;
      });
      console.log('  A1 popup title text:', (popupTitleText || '').slice(0, 300));
      findings.push({ a1_popup_title_text: popupTitleText });
    }

    // ── 10. Mobile viewport sanity
    console.log('▶ 10. Mobile viewport sanity');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.evaluate((slug) => {
      Lab.editorModal.open('docs/' + slug + '.md');
    }, BOX_SLUG);
    await page.waitForTimeout(1700);
    await shot(page, 'box-mobile-grid');

    console.log('▶ scenario complete; dialogs caught:', dialogCount);
    findings.push({ total_alerts_caught: dialogCount });
  } catch (e) {
    console.log('❌ scenario error:', e.message);
    console.log(e.stack);
    await shot(page, 'ERROR');
  } finally {
    console.log('▶ cleanup');
    for (const item of cleanup) {
      try {
        let sha = item.sha;
        if (!sha) {
          const f = await ghGet(item.path);
          if (f) sha = f.sha;
        }
        if (sha) {
          await ghDelete(item.path, sha, 'qa-cycle-49 cleanup ' + item.path);
          console.log('  ✓ deleted', item.path);
        } else {
          console.log('  ⚠ no sha for', item.path);
        }
      } catch (e) {
        console.log('  ⚠ delete failed', item.path, e.message);
      }
    }
    await browser.close();
    console.log('--- FINDINGS ---');
    console.log(JSON.stringify(findings, null, 2));
  }
}

main().catch(e => { console.log('fatal:', e); process.exit(1); });
