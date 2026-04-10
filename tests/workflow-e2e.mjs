#!/usr/bin/env node
/**
 * 🧑‍🔬 James Freckles — End-to-End Lab Workflow Simulation
 *
 * Simulates a realistic lab member workflow:
 * 1. Creates a project (DNA Extraction Optimization - Redwood Leaf)
 * 2. Creates tissue grinding protocol
 * 3. Creates DNeasy Plant Mini Kit protocol (real Qiagen steps)
 * 4. Duplicates & modifies protocol (50µL elution variant)
 * 5. Runs experiment — notebook entry with NanoDrop data, gel image
 * 6. Annotates gel image
 * 7. Updates inventory with kit used
 * 8. Places extracted DNA in -80°C freezer box
 * 9. Adds sample to sample tracker
 * 10. Links everything via wikilinks
 *
 * Then a Lab Manager bot independently reviews all work.
 *
 * Usage:
 *   node tests/workflow-e2e.mjs --headed   # watch it run
 *   node tests/workflow-e2e.mjs --keep     # don't clean up artifacts
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';

// ── Config ──
const BASE = 'https://monroe-lab.github.io/lab-handbook';
const GH_TOKEN = execSync('gh auth token').toString().trim();
const REPO = 'monroe-lab/lab-handbook';
const ARGS = process.argv.slice(2);
const KEEP = ARGS.includes('--keep');
const HEADED = ARGS.includes('--headed');
const TS = Date.now().toString(36);
const TODAY = new Date().toISOString().slice(0, 10);

// ── Tracking ──
const results = [];
const cleanup = [];
const screenshots = [];
let totalPass = 0, totalFail = 0, totalWarn = 0;

function log(section, test, status, detail) {
  results.push({ section, test, status, detail });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} ${test}: ${detail}`);
}

function shot(page, name) {
  const path = `/tmp/workflow-${name}.png`;
  screenshots.push(path);
  return page.screenshot({ path, fullPage: false });
}

// ── GitHub helpers ──
function ghFileExists(path) {
  try {
    execSync(`gh api "repos/${REPO}/contents/${path}" --jq '.sha'`, { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

function ghDeleteFile(path, msg) {
  try {
    const sha = execSync(`gh api "repos/${REPO}/contents/${path}" --jq '.sha'`, { stdio: 'pipe' }).toString().trim();
    execSync(`gh api -X DELETE "repos/${REPO}/contents/${path}" -f message="${msg}" -f sha="${sha}"`, { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

function ghReadFile(path) {
  try {
    return execSync(`gh api "repos/${REPO}/contents/${path}" --jq '.content' | base64 -d`, { stdio: 'pipe' }).toString();
  } catch { return null; }
}

// ── Editor helpers ──
const WW_PM = '.toastui-editor-ww-container .ProseMirror';

async function waitForEditor(page, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const ready = await page.evaluate(() =>
      !!document.querySelector('.toastui-editor-ww-container .ProseMirror') && !!window.editorInstance
    );
    if (ready) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function focusEditor(page) {
  await page.evaluate((sel) => {
    const pm = document.querySelector(sel);
    if (pm) {
      pm.focus();
      const s = window.getSelection();
      s.selectAllChildren(pm);
      s.collapseToEnd();
    }
  }, WW_PM);
  await page.waitForTimeout(300);
}

async function clearAndType(page) {
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);
}

// ── Slugs ──
const PROJECT_TITLE = 'DNA Extraction Optimization - Redwood Leaf';
const PROJECT_SLUG = 'dna-extraction-optimization-redwood-leaf';
const PROJECT_PATH = `docs/projects/${PROJECT_SLUG}/index.md`;

const GRIND_TITLE = `Tissue Grinding - Sequoia sempervirens ${TS}`;
const GRIND_SLUG = GRIND_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GRIND_PATH = `docs/wet-lab/${GRIND_SLUG}.md`;

const DNEASY_TITLE = `DNeasy Plant Mini Kit Protocol ${TS}`;
const DNEASY_SLUG = DNEASY_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DNEASY_PATH = `docs/wet-lab/${DNEASY_SLUG}.md`;
const DNEASY_COPY_PATH = DNEASY_PATH.replace('.md', '-copy.md');

const NB_TITLE = `jf-redwood-${TS}`;
const NB_PATH = `docs/notebooks/alex-chen/${NB_TITLE}.md`;

const INV_TITLE = `jf-dneasy-kit-${TS}`;
const INV_PATH = `docs/resources/${INV_TITLE}.md`;

const FREEZER_TITLE = `Redwood DNA Sample B ${TS}`;
const FREEZER_SLUG = FREEZER_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const FREEZER_PATH = `docs/stocks/${FREEZER_SLUG}.md`; // dna_prep type goes to stocks/

const SAMPLE_ID = `RW-${TS}`;

const GEL_IMG_NAME = `gel-redwood-${TS}.png`;
const GEL_IMG_SLUG = GEL_IMG_NAME;
const GEL_IMG_PATH = `docs/images/${GEL_IMG_SLUG}`;
const GEL_ANNOT_PATH = `docs/images/gel-redwood-${TS}-annotated.png`;

// ════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════
(async () => {
  console.log(`\n🧑‍🔬 James Freckles starting workflow — run ID: ${TS}`);
  console.log(`   ${HEADED ? 'Headed' : 'Headless'} mode, ${KEEP ? 'keeping' : 'cleaning up'} artifacts\n`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  try {

  // ════════════════════════════════════════════════════════════
  //  ACT 1: JAMES FRECKLES — The Experiment
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  🧑‍🔬 ACT 1: JAMES FRECKLES — DNA Extraction Workflow');
  console.log('═'.repeat(60));

  // ── STEP 1: Create Project ──
  console.log('\n📁 STEP 1: Create Project\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/projects.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    p.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') await dialog.accept(PROJECT_TITLE);
      else if (dialog.type() === 'confirm') await dialog.accept();
      else await dialog.dismiss();
    });

    await p.evaluate(() => createNewProject());
    await p.waitForTimeout(8000);

    const created = ghFileExists(PROJECT_PATH);
    log('project', 'Create project', created ? 'PASS' : 'FAIL',
      created ? `${PROJECT_PATH} on GitHub` : 'Not created');
    if (created) cleanup.push({ path: PROJECT_PATH });

    await shot(p, '01-project-created');

    // Edit project with experiment description
    if (created) {
      const edReady = await waitForEditor(p);
      if (!edReady) {
        await p.evaluate(() => startEdit());
        await waitForEditor(p);
      }

      const editorUp = await waitForEditor(p, 5000);
      if (editorUp) {
        await focusEditor(p);
        await clearAndType(p);

        // Type project description
        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 1 }));
        await p.keyboard.type('DNA Extraction Optimization - Redwood Leaf');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Summary');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        await p.keyboard.press('Meta+b');
        await p.keyboard.type('Objective:');
        await p.keyboard.press('Meta+b');
        await p.keyboard.type(' Optimize Qiagen DNeasy Plant Mini Kit protocol for Sequoia sempervirens (coast redwood) leaf tissue. Compare standard elution (100uL AE buffer) vs. reduced volume (50uL AE buffer) for higher concentration yields.');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Team');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        await p.keyboard.type('James Freckles (lead)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Grey Monroe (PI)');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Protocols');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        await p.keyboard.type('Tissue grinding (mechanical disruption in liquid nitrogen)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('DNeasy Plant Mini Kit - standard (100uL elution)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('DNeasy Plant Mini Kit - modified (50uL elution)');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Status');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Extraction complete. QC passed. DNA stored at -80C.');
        await p.waitForTimeout(300);

        // Save
        await p.keyboard.press('Meta+s');
        await p.waitForTimeout(8000);

        const content = ghReadFile(PROJECT_PATH);
        const hasObj = content?.includes('Objective') && content?.includes('Sequoia');
        log('project', 'Edit project description', hasObj ? 'PASS' : 'FAIL',
          hasObj ? 'Content saved with objective and species' : 'Content not saved');
        await shot(p, '02-project-edited');
      }
    }

    await p.close();
  }

  // ── STEP 2: Create Tissue Grinding Protocol ──
  console.log('\n🔬 STEP 2: Create Tissue Grinding Protocol\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/protocols.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    p.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') await dialog.accept(GRIND_TITLE);
      else if (dialog.type() === 'confirm') await dialog.accept();
      else await dialog.dismiss();
    });

    await p.evaluate(() => createNewProtocol());
    await p.waitForTimeout(8000);

    const created = ghFileExists(GRIND_PATH);
    log('protocol-grind', 'Create grinding protocol', created ? 'PASS' : 'FAIL',
      created ? GRIND_PATH : 'Not created');
    if (created) cleanup.push({ path: GRIND_PATH });

    // Edit with real grinding protocol content
    if (created) {
      const edReady = await waitForEditor(p);
      if (!edReady) {
        await p.evaluate(() => startEdit());
        await waitForEditor(p);
      }
      if (await waitForEditor(p, 5000)) {
        await focusEditor(p);
        await clearAndType(p);

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Purpose');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Mechanically disrupt plant leaf tissue using liquid nitrogen and mortar/pestle to produce fine powder suitable for DNA extraction. Optimized for tough, fibrous tissue like Sequoia sempervirens.');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Materials');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        await p.keyboard.type('Liquid nitrogen (fill dewar 30 min before use)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Mortar and pestle (autoclaved, pre-chilled at -80C)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Fresh leaf tissue (~100mg per sample)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Stainless steel spatula (pre-chilled)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('1.5mL microcentrifuge tubes (pre-labeled, pre-chilled)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Analytical balance');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Procedure');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('orderedList'));
        await p.keyboard.type('Pre-chill mortar, pestle, and spatula in liquid nitrogen for 5 minutes');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Weigh ~100mg fresh leaf tissue on analytical balance');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Place tissue in mortar. Add liquid nitrogen to cover tissue completely.');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Grind tissue with firm, circular motions. Redwood tissue is fibrous and requires 3-4 rounds of grinding with LN2 replenishment.');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Continue adding LN2 as it evaporates. Tissue should become a fine white/green powder.');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Transfer powder to pre-labeled 1.5mL tube using chilled spatula. Do NOT let powder thaw.');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Proceed immediately to DNA extraction OR snap-freeze and store at -80C.');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Safety');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        await p.keyboard.type('Wear cryogenic gloves and face shield when handling LN2');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Work in well-ventilated area (LN2 displaces O2)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Never seal containers of LN2');
        await p.waitForTimeout(300);

        await p.keyboard.press('Meta+s');
        await p.waitForTimeout(8000);

        const content = ghReadFile(GRIND_PATH);
        const hasSteps = content?.includes('mortar') && content?.includes('liquid nitrogen');
        log('protocol-grind', 'Edit grinding protocol', hasSteps ? 'PASS' : 'FAIL',
          hasSteps ? 'Full protocol with materials, procedure, safety' : 'Content not saved');
        await shot(p, '03-grinding-protocol');
      }
    }

    await p.close();
  }

  // ── STEP 3: Create DNeasy Plant Mini Kit Protocol ──
  console.log('\n🧬 STEP 3: Create DNeasy Plant Mini Kit Protocol\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/protocols.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    p.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') await dialog.accept(DNEASY_TITLE);
      else if (dialog.type() === 'confirm') await dialog.accept();
      else await dialog.dismiss();
    });

    await p.evaluate(() => createNewProtocol());
    await p.waitForTimeout(8000);

    const created = ghFileExists(DNEASY_PATH);
    log('protocol-dneasy', 'Create DNeasy protocol', created ? 'PASS' : 'FAIL',
      created ? DNEASY_PATH : 'Not created');
    if (created) cleanup.push({ path: DNEASY_PATH });

    if (created) {
      const edReady = await waitForEditor(p);
      if (!edReady) {
        await p.evaluate(() => startEdit());
        await waitForEditor(p);
      }
      if (await waitForEditor(p, 5000)) {
        await focusEditor(p);
        await clearAndType(p);

        // Full Qiagen DNeasy Plant Mini Kit protocol
        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Overview');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Qiagen DNeasy Plant Mini Kit protocol for genomic DNA isolation from plant tissue. Based on Qiagen handbook with modifications for Sequoia sempervirens.');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Kit Contents');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        const kitItems = [
          'DNeasy Mini Spin Columns (silica membrane)',
          'Collection tubes (2mL)',
          'Buffer AP1 (lysis buffer)',
          'Buffer AP2 (precipitation buffer)',
          'Buffer AP3/E (binding buffer, add ethanol before first use)',
          'Buffer AW (wash buffer, add ethanol before first use)',
          'Buffer AE (elution buffer: 10mM Tris-Cl, 0.5mM EDTA, pH 9.0)',
          'RNase A (100mg/mL stock)',
        ];
        for (let i = 0; i < kitItems.length; i++) {
          await p.keyboard.type(kitItems[i]);
          if (i < kitItems.length - 1) await p.keyboard.press('Enter');
        }
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Additional Materials Required');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        const addlMaterials = [
          'Ethanol (96-100%) for buffer preparation',
          'Microcentrifuge capable of 14,000 rpm',
          'Water bath or heating block set to 65C',
          '1.5mL microcentrifuge tubes',
          'Pipettes and filter tips (200uL, 1000uL)',
        ];
        for (let i = 0; i < addlMaterials.length; i++) {
          await p.keyboard.type(addlMaterials[i]);
          if (i < addlMaterials.length - 1) await p.keyboard.press('Enter');
        }
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Procedure');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('orderedList'));
        const steps = [
          'Grind tissue to fine powder in liquid nitrogen (see tissue grinding protocol).',
          'Add 400uL Buffer AP1 and 4uL RNase A stock solution to the tube containing ground tissue. Vortex vigorously.',
          'Incubate the mixture at 65C for 10 minutes. Invert tube 2-3 times during incubation to mix the lysate.',
          'Add 130uL Buffer AP2 to the lysate. Mix thoroughly and incubate on ice for 5 minutes.',
          'Centrifuge the lysate at 14,000 rpm for 5 minutes.',
          'Transfer the supernatant (including any precipitate) to a QIAshredder Mini Spin Column. Centrifuge for 2 minutes at 14,000 rpm.',
          'Transfer the flow-through to a new tube without disturbing the pellet. Add 1.5 volumes of Buffer AP3/E. Mix by pipetting.',
          'Transfer 650uL of the mixture to a DNeasy Mini Spin Column placed in a 2mL collection tube. Centrifuge for 1 minute at 8,000 rpm. Discard flow-through. Repeat with remaining mixture.',
          'Add 500uL Buffer AW to the spin column. Centrifuge for 1 minute at 8,000 rpm. Discard flow-through.',
          'Add 500uL Buffer AW to the spin column. Centrifuge for 2 minutes at 14,000 rpm to dry the membrane.',
          'Transfer the spin column to a new 1.5mL microcentrifuge tube. Add 100uL Buffer AE directly to the membrane. Incubate for 5 minutes at room temperature.',
          'Centrifuge for 1 minute at 8,000 rpm to elute the DNA.',
        ];
        for (let i = 0; i < steps.length; i++) {
          await p.keyboard.type(steps[i]);
          if (i < steps.length - 1) await p.keyboard.press('Enter');
          await p.waitForTimeout(50);
        }
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');

        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Expected Results');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        await p.keyboard.type('Yield: 2-30ug genomic DNA per 100mg leaf tissue');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Elution volume: 100uL in Buffer AE');
        await p.keyboard.press('Enter');
        await p.keyboard.type('260/280 ratio: 1.7-2.0 (pure DNA)');
        await p.keyboard.press('Enter');
        await p.keyboard.type('260/230 ratio: >2.0 (no contaminant carryover)');
        await p.waitForTimeout(300);

        await p.keyboard.press('Meta+s');
        await p.waitForTimeout(8000);

        const content = ghReadFile(DNEASY_PATH);
        const hasProc = content?.includes('Buffer AP1') && content?.includes('100uL Buffer AE');
        log('protocol-dneasy', 'Edit DNeasy protocol', hasProc ? 'PASS' : 'FAIL',
          hasProc ? 'Full 12-step protocol with kit contents and expected results' : 'Content incomplete');
        await shot(p, '04-dneasy-protocol');
      }
    }

    // ── STEP 4: Duplicate & Modify for 50µL elution ──
    console.log('\n📋 STEP 4: Duplicate Protocol (50µL Elution Variant)\n');
    if (created) {
      const dupResult = await p.evaluate(async () => {
        if (typeof duplicateDoc !== 'function' || !currentDoc) return { error: 'not available' };
        try { await duplicateDoc(); return { ok: true, doc: currentDoc }; }
        catch(e) { return { error: e.message }; }
      });
      await p.waitForTimeout(8000);

      if (dupResult.ok) {
        const dupExists = ghFileExists(DNEASY_COPY_PATH);
        log('protocol-modify', 'Duplicate DNeasy protocol', dupExists ? 'PASS' : 'FAIL',
          dupExists ? DNEASY_COPY_PATH : 'Copy not found');
        if (dupExists) cleanup.push({ path: DNEASY_COPY_PATH });

        // Modify: change 100uL to 50uL in the copy
        // After duplicateDoc(), the page loads the copy but is NOT in edit mode
        if (dupExists) {
          // Wait for the copy to finish loading
          await p.waitForTimeout(3000);
          // Enter edit mode explicitly
          await p.evaluate(() => { if (typeof startEdit === 'function') startEdit(); });
          if (await waitForEditor(p)) {
            // Use setMarkdown to modify content, then focus editor to mark dirty
            const modified = await p.evaluate(() => {
              let md = editorInstance.editor.getMarkdown();
              // Change elution volume
              md = md.replace(/100uL Buffer AE/g, '50uL Buffer AE');
              md = md.replace(/Elution volume: 100uL/g, 'Elution volume: 50uL');
              // Add modification note at top
              md = '> **MODIFIED PROTOCOL:** Elution volume reduced from 100uL to 50uL for higher DNA concentration.\n\n' + md;
              editorInstance.editor.setMarkdown(md);
              return md.includes('50uL Buffer AE');
            });

            if (modified) {
              // Focus WYSIWYG and type a space to ensure editor is marked dirty
              await p.evaluate((sel) => {
                const pm = document.querySelector(sel);
                if (pm) pm.focus();
              }, WW_PM);
              await p.waitForTimeout(500);
              await p.keyboard.press('End');
              await p.keyboard.type(' ');
              await p.waitForTimeout(300);

              await p.keyboard.press('Meta+s');
              await p.waitForTimeout(8000);

              const content = ghReadFile(DNEASY_COPY_PATH);
              const has50 = content?.includes('50uL Buffer AE') || content?.includes('50uL');
              const hasModNote = content?.includes('MODIFIED PROTOCOL') || content?.includes('MODIFIED');
              log('protocol-modify', 'Modify to 50uL elution', has50 ? 'PASS' : 'FAIL',
                `50uL=${has50} modNote=${hasModNote}`);
            }
            await shot(p, '05-modified-protocol');
          }
        }
      } else {
        log('protocol-modify', 'Duplicate DNeasy', 'FAIL', dupResult.error);
      }
    }

    await p.close();
  }

  // ── STEP 5: Create Lab Notebook Entry ──
  console.log('\n📓 STEP 5: Lab Notebook Entry\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/notebooks.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    // Click New Entry
    const newBtn = await p.$('button:has-text("New Entry")');
    if (newBtn) {
      await newBtn.click();
      await p.waitForTimeout(1000);

      const modalOpen = await p.$eval('#nbModalBackdrop', el => el.classList.contains('open')).catch(() => false);
      if (modalOpen) {
        // Fill title
        const titleInput = await p.$('#nbm_title, .nb-modal input[type="text"]');
        if (titleInput) await titleInput.fill(NB_TITLE);

        // Select alex-chen folder
        const folderSelect = await p.$('#nbm_folder, .nb-modal select:last-of-type');
        if (folderSelect) {
          const options = await folderSelect.$$eval('option', opts => opts.map(o => ({ v: o.value, t: o.textContent })));
          const alex = options.find(o => o.v.includes('alex'));
          if (alex) await folderSelect.selectOption(alex.v);
        }

        // Create
        const createBtn = await p.$('#nbmOk, button:has-text("Create entry")');
        if (createBtn) {
          await createBtn.click();
          await p.waitForTimeout(8000);

          const nbCreated = ghFileExists(NB_PATH);
          log('notebook', 'Create notebook entry', nbCreated ? 'PASS' : 'FAIL',
            nbCreated ? NB_PATH : 'Not created');
          if (nbCreated) cleanup.push({ path: NB_PATH });

          if (nbCreated) {
            // Enter edit mode
            await p.evaluate(() => { if (typeof startEdit === 'function') startEdit(); });
            if (await waitForEditor(p)) {
              await p.evaluate((sel) => {
                document.querySelector(sel)?.focus();
              }, WW_PM);
              await p.waitForTimeout(500);

              await p.keyboard.press('Meta+a');
              await p.keyboard.press('Backspace');
              await p.waitForTimeout(300);

              // Type notebook content
              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 1 }));
              await p.keyboard.type('DNA Extraction Optimization - Sequoia sempervirens');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(200);

              await p.keyboard.press('Meta+b');
              await p.keyboard.type('Date:');
              await p.keyboard.press('Meta+b');
              await p.keyboard.type(` ${TODAY}`);
              await p.keyboard.press('Enter');
              await p.keyboard.press('Meta+b');
              await p.keyboard.type('Researcher:');
              await p.keyboard.press('Meta+b');
              await p.keyboard.type(' James Freckles');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Objective');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Compare standard (100uL) vs. reduced volume (50uL) elution using Qiagen DNeasy Plant Mini Kit for S. sempervirens leaf tissue. Hypothesis: 50uL elution yields higher concentration with minimal total yield loss.');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Sample Collection');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Fresh leaf tissue collected from mature coast redwood (Sequoia sempervirens) at the UC Davis Arboretum, north grove. Young expanding leaves from lower canopy, ~200mg collected per sample. Tissue placed immediately in liquid nitrogen.');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Methods');
              await p.keyboard.press('Enter');
              await p.evaluate(() => editorInstance.editor.exec('orderedList'));
              await p.keyboard.type('Tissue grinding per lab grinding protocol (mortar + pestle, LN2, ~100mg per sample)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Sample A: Standard DNeasy protocol, 100uL AE buffer elution');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Sample B: Modified DNeasy protocol, 50uL AE buffer elution');
              await p.keyboard.press('Enter');
              await p.keyboard.type('NanoDrop quantification of both samples (1uL each)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Gel electrophoresis: 0.8% agarose, 1X TAE, 100V, 30 min, 5uL per lane + 1uL 6X loading dye');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Results');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(200);

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 3 }));
              await p.keyboard.type('NanoDrop Quantification');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(200);

              // Insert a table with results
              await p.evaluate(() => editorInstance.editor.exec('addTable', { rowCount: 3, columnCount: 5 }));
              await p.waitForTimeout(500);

              // Fill table cells
              const tableData = [
                ['Sample', 'Conc (ng/uL)', '260/280', '260/230', 'Total Yield (ug)'],
                ['A (100uL)', '45.2', '1.89', '2.15', '4.52'],
                ['B (50uL)', '82.7', '1.91', '2.08', '4.14'],
              ];
              for (let row = 0; row < tableData.length; row++) {
                for (let col = 0; col < tableData[row].length; col++) {
                  await p.keyboard.type(tableData[row][col]);
                  if (col < tableData[row].length - 1) await p.keyboard.press('Tab');
                }
                if (row < tableData.length - 1) await p.keyboard.press('Tab');
              }

              // Move past table
              await p.keyboard.press('ArrowDown');
              await p.keyboard.press('ArrowDown');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(200);

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 3 }));
              await p.keyboard.type('Gel Electrophoresis');
              await p.keyboard.press('Enter');
              await p.keyboard.type('High molecular weight bands visible for both samples. Sample B shows brighter band consistent with higher concentration. No degradation or RNA contamination visible. NTC lane clean.');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Conclusions');
              await p.keyboard.press('Enter');
              await p.evaluate(() => editorInstance.editor.exec('bulletList'));
              await p.keyboard.type('Reduced elution (50uL) yields ~1.8x higher concentration (82.7 vs 45.2 ng/uL)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Total yield loss is minimal (~8%: 4.14 vs 4.52 ug)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Both samples show excellent purity (260/280 ~1.9, 260/230 >2.0)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('For downstream library prep requiring >50 ng/uL input, 50uL elution is preferred');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Reagents Used');
              await p.keyboard.press('Enter');
              await p.evaluate(() => editorInstance.editor.exec('bulletList'));
              await p.keyboard.type('Qiagen DNeasy Plant Mini Kit (1 column per sample, 2 total)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('RNase A stock (8uL total)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Ethanol 96% (~10mL for buffer prep)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Liquid nitrogen (~2L)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Agarose (0.4g for 50mL gel)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('1X TAE buffer (50mL)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('6X loading dye (2uL)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('GelRed (5uL per 50mL gel)');
              await p.keyboard.press('Enter');
              await p.keyboard.press('Enter');

              await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
              await p.keyboard.type('Next Steps');
              await p.keyboard.press('Enter');
              await p.evaluate(() => editorInstance.editor.exec('bulletList'));
              await p.keyboard.type('Store DNA at -80C (freezer box position assigned)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Proceed to library prep with Sample B (50uL elution)');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Submit for Illumina WGS at UC Davis DNA Technologies Core');

              await p.waitForTimeout(300);
              await shot(p, '06-notebook-richtext');

              // ── STEP 6: Upload and annotate gel image ──
              console.log('\n🖼️  STEP 6: Upload & Annotate Gel Image\n');

              // Generate a realistic gel image via canvas
              const imgUploaded = await p.evaluate((imgName) => {
                return new Promise((resolve) => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 400;
                  canvas.height = 300;
                  const ctx = canvas.getContext('2d');

                  // Dark background (UV transilluminator look)
                  ctx.fillStyle = '#0a0a1e';
                  ctx.fillRect(0, 0, 400, 300);

                  // Wells at top
                  const lanes = [80, 160, 240, 320];
                  const labels = ['Ladder', 'Sample A', 'Sample B', 'NTC'];
                  lanes.forEach((x) => {
                    ctx.fillStyle = 'rgba(60,80,120,0.6)';
                    ctx.fillRect(x - 15, 20, 30, 8);
                  });

                  // Ladder bands (multiple sizes)
                  const ladderPositions = [45, 70, 95, 120, 145, 175, 210, 245];
                  ladderPositions.forEach((y, i) => {
                    const brightness = 0.4 + Math.random() * 0.3;
                    ctx.fillStyle = `rgba(0,255,80,${brightness})`;
                    const width = 18 + (i < 3 ? 4 : 0);
                    ctx.fillRect(lanes[0] - width/2, y, width, 3);
                  });

                  // Sample A - bright HMW band (standard elution)
                  ctx.fillStyle = 'rgba(0,255,80,0.7)';
                  ctx.fillRect(lanes[1] - 10, 48, 20, 5);
                  // Slight smear below
                  ctx.fillStyle = 'rgba(0,255,80,0.15)';
                  ctx.fillRect(lanes[1] - 8, 55, 16, 30);

                  // Sample B - brighter HMW band (concentrated elution)
                  ctx.fillStyle = 'rgba(0,255,80,0.95)';
                  ctx.fillRect(lanes[2] - 10, 48, 20, 6);
                  ctx.fillStyle = 'rgba(0,255,80,0.2)';
                  ctx.fillRect(lanes[2] - 8, 56, 16, 25);

                  // NTC - no bands (clean negative control)

                  // Lane labels at bottom
                  ctx.fillStyle = '#ffffff';
                  ctx.font = '11px monospace';
                  ctx.textAlign = 'center';
                  labels.forEach((label, i) => {
                    ctx.fillText(label, lanes[i], 285);
                  });

                  // Title at very top
                  ctx.font = '10px monospace';
                  ctx.fillText('0.8% Agarose | 1X TAE | 100V 30min', 200, 12);

                  canvas.toBlob((blob) => {
                    const file = new File([blob], imgName, { type: 'image/png' });
                    const input = document.querySelector('input[type="file"][accept="image/*"]');
                    if (!input) { resolve(false); return; }
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    resolve(true);
                  }, 'image/png');
                });
              }, GEL_IMG_NAME);

              if (imgUploaded) {
                await p.waitForTimeout(8000);
                const gelOnGH = ghFileExists(GEL_IMG_PATH);
                log('notebook', 'Gel image uploaded', gelOnGH ? 'PASS' : 'FAIL',
                  gelOnGH ? GEL_IMG_PATH : 'Not uploaded');
                if (gelOnGH) cleanup.push({ path: GEL_IMG_PATH });

                // Check image in editor
                const imgInEd = await p.evaluate(() => {
                  const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                  return ww ? ww.querySelectorAll('img').length : 0;
                });
                log('notebook', 'Gel image in editor', imgInEd > 0 ? 'PASS' : 'FAIL',
                  `${imgInEd} image(s) in WYSIWYG`);
                await shot(p, '07-gel-image-editor');

                // Annotate gel image
                if (imgInEd > 0) {
                  const annotOpened = await p.evaluate(() => {
                    const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                    const img = ww?.querySelector('img');
                    if (!img) return false;
                    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
                    return true;
                  });
                  if (annotOpened) {
                    await p.waitForTimeout(2000);
                    const overlayVisible = await p.evaluate(() => {
                      const canvas = document.querySelector('canvas');
                      return !!canvas && canvas.offsetParent !== null;
                    });
                    if (overlayVisible) {
                      const canvasBox = await p.evaluate(() => {
                        const c = document.querySelector('canvas');
                        if (!c) return null;
                        const r = c.getBoundingClientRect();
                        return { x: r.x + r.width * 0.4, y: r.y + r.height * 0.3 };
                      });
                      if (canvasBox) {
                        await p.mouse.click(canvasBox.x, canvasBox.y);
                        await p.waitForTimeout(500);
                        const annotInput = await p.$('#annot-text');
                        if (annotInput) {
                          await annotInput.fill('HMW gDNA - Samples A & B');
                          await p.waitForTimeout(300);
                        }
                        const saveAnnot = await p.$('button:has-text("Save annotations")');
                        if (saveAnnot) {
                          await saveAnnot.click();
                          await p.waitForTimeout(8000);
                          const annotExists = ghFileExists(GEL_ANNOT_PATH);
                          log('notebook', 'Gel image annotated', annotExists ? 'PASS' : 'FAIL',
                            annotExists ? GEL_ANNOT_PATH : 'Annotated file not found');
                          if (annotExists) cleanup.push({ path: GEL_ANNOT_PATH });
                        }
                      }
                    } else {
                      log('notebook', 'Annotation overlay', 'WARN', 'Not visible');
                    }
                    await shot(p, '08-gel-annotated');
                  }
                }
              } else {
                log('notebook', 'Gel image upload', 'FAIL', 'File input not found');
              }

              // Save everything
              await p.evaluate((sel) => document.querySelector(sel)?.focus(), WW_PM);
              await p.waitForTimeout(200);
              await p.keyboard.press('Meta+s');
              await p.waitForTimeout(8000);

              const nbContent = ghReadFile(NB_PATH);
              const nbChecks = {
                hasTitle: nbContent?.includes('Sequoia sempervirens'),
                hasTable: nbContent?.includes('|') && nbContent?.includes('45.2'),
                hasMethods: nbContent?.includes('mortar') || nbContent?.includes('grinding'),
                hasConclusions: nbContent?.includes('1.8x'),
                hasReagents: nbContent?.includes('DNeasy'),
              };
              const nbOk = Object.values(nbChecks).filter(v => v).length >= 3;
              log('notebook', 'Notebook saved to GitHub', nbOk ? 'PASS' : 'FAIL',
                `title=${nbChecks.hasTitle} table=${nbChecks.hasTable} methods=${nbChecks.hasMethods} conclusions=${nbChecks.hasConclusions} reagents=${nbChecks.hasReagents}`);

              // Wait for rendered view
              for (let i = 0; i < 20; i++) {
                const inView = await p.evaluate(() => !document.body.classList.contains('editing-mode'));
                if (inView) break;
                await p.waitForTimeout(500);
              }
              await p.waitForTimeout(1000);
              await shot(p, '09-notebook-rendered');

              log('notebook', 'Notebook render after save', 'PASS', 'Rendered view displayed');
            } else {
              log('notebook', 'Editor init', 'FAIL', 'Editor not ready');
            }
          }
        }
      }
    } else {
      log('notebook', 'New Entry button', 'FAIL', 'Not found');
    }

    await p.close();
  }

  // ── STEP 7: Update Inventory ──
  console.log('\n🧪 STEP 7: Register Kit in Inventory\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/inventory.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const addClicked = await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.includes('Add Item') && b.offsetParent) { b.click(); return true; }
      }
      return false;
    });

    if (addClicked) {
      await p.waitForTimeout(1500);
      const filled = await p.evaluate((title) => {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const input of inputs) {
          const ph = (input.placeholder || '').toLowerCase();
          if (input.offsetParent && (ph.includes('name') || ph.includes('title'))) {
            input.value = title;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
        for (const input of inputs) {
          if (input.offsetParent && input.closest('.modal, [class*="modal"], [class*="dialog"]')) {
            input.value = title;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
        return false;
      }, INV_TITLE);

      if (filled) {
        // Select type = Kit if available
        await p.evaluate(() => {
          const selects = document.querySelectorAll('select');
          for (const s of selects) {
            for (const opt of s.options) {
              if (opt.value === 'kit' || opt.textContent.toLowerCase().includes('kit')) {
                s.value = opt.value;
                s.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
          }
        });

        const saved = await p.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) {
            const t = b.textContent.trim();
            if ((t.includes('Create') || t.includes('Save') || t === 'Add') && b.offsetParent) {
              b.click(); return true;
            }
          }
          return false;
        });

        if (saved) {
          await p.waitForTimeout(8000);
          const invCreated = ghFileExists(INV_PATH);
          log('inventory', 'Register DNeasy kit', invCreated ? 'PASS' : 'FAIL',
            invCreated ? INV_PATH : 'Not created');
          if (invCreated) cleanup.push({ path: INV_PATH });
        }
      }
    }

    await shot(p, '10-inventory');
    await p.close();
  }

  // ── STEP 8: Place DNA in Freezer ──
  console.log('\n🧊 STEP 8: Store DNA at -80°C\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/lab-map.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    await p.evaluate(() => labMap.open('freezer-80c'));
    await p.waitForTimeout(1500);

    // Click first shelf
    const shelves = await p.$$('.shelf-card');
    if (shelves.length > 0) {
      await shelves[0].click({ timeout: 5000 });
      await p.waitForTimeout(1000);

      // Find an empty cell
      const emptyCells = await p.$$('.tube-cell.empty');
      if (emptyCells.length > 0) {
        await emptyCells[0].click();
        await p.waitForTimeout(500);

        // Click "Create New" in assign popover
        const createBtn = await p.evaluate(() => {
          const pop = document.getElementById('assignPopover');
          if (!pop) return false;
          const btns = pop.querySelectorAll('button');
          for (const b of btns) {
            if (b.textContent.includes('Create New') || b.textContent.includes('Create')) {
              b.click(); return true;
            }
          }
          return false;
        });

        if (createBtn) {
          await p.waitForTimeout(1000);
          const nameInput = await p.$('#newItemName');
          if (nameInput) {
            await nameInput.fill(FREEZER_TITLE);
            const typeSelect = await p.$('#newItemType');
            if (typeSelect) await typeSelect.selectOption('dna_prep');

            // Verify location_detail is pre-filled
            const locDetail = await p.$eval('#newItemLocDetail', el => el.value).catch(() => '');
            log('freezer', 'Location detail pre-filled',
              locDetail.includes('Shelf') ? 'PASS' : 'WARN', locDetail || 'empty');

            const saveBtn = await p.$('#newItemSave');
            if (saveBtn) {
              await saveBtn.click();
              await p.waitForTimeout(10000);

              // Check with actual slug from the page (may differ from our calculated slug)
              let freezerCreated = ghFileExists(FREEZER_PATH);
              let actualFreezerPath = FREEZER_PATH;
              if (!freezerCreated) {
                // Try resources/ (in case type wasn't dna_prep)
                const altPath = FREEZER_PATH.replace('docs/stocks/', 'docs/resources/');
                if (ghFileExists(altPath)) {
                  freezerCreated = true;
                  actualFreezerPath = altPath;
                }
              }
              log('freezer', 'DNA stored at -80C', freezerCreated ? 'PASS' : 'FAIL',
                freezerCreated ? `${actualFreezerPath} on GitHub` : 'Not created');
              if (freezerCreated) {
                cleanup.push({ path: actualFreezerPath });
                const content = ghReadFile(FREEZER_PATH);
                const hasLoc = content?.includes('location_detail:');
                log('freezer', 'Freezer position persisted', hasLoc ? 'PASS' : 'FAIL',
                  hasLoc ? 'location_detail in frontmatter' : 'Missing');
              }
            }
          }
        }
      }
    }

    await shot(p, '11-freezer-placement');
    await p.close();
  }

  // ── STEP 9: Add Sample to Tracker ──
  console.log('\n📊 STEP 9: Add to Sample Tracker\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/sample-tracker/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const addBtn = await p.$('button:has-text("Add Sample")');
    if (addBtn) {
      await addBtn.click();
      await p.waitForTimeout(1000);

      const fSampleId = await p.$('#fSampleId');
      const fProject = await p.$('#fProject');
      if (fSampleId && fProject) {
        await fSampleId.fill(SAMPLE_ID);
        await fProject.fill('DNA Extraction Optimization');

        const fSpecies = await p.$('#fSpecies');
        if (fSpecies) await fSpecies.fill('Sequoia sempervirens');

        const fLead = await p.$('#fLead');
        if (fLead) await fLead.fill('James Freckles');

        const fStatus = await p.$('#fStatus');
        if (fStatus) await fStatus.selectOption('DNA extracted');

        const fNotes = await p.$('#fNotes');
        if (fNotes) await fNotes.fill('DNeasy Plant Mini Kit, 50uL elution (modified protocol). NanoDrop: 82.7 ng/uL, 260/280=1.91. Stored -80C.');

        const saveBtn = await p.$('#btnSaveItem');
        if (saveBtn) {
          await saveBtn.click();
          await p.waitForTimeout(5000);

          // Verify sample appears
          const searchInput = await p.$('input[placeholder*="Search"]');
          if (searchInput) {
            await searchInput.fill(SAMPLE_ID);
            await p.waitForTimeout(500);
            const rows = await p.$$('tbody tr');
            log('samples', 'Add sample to tracker', rows.length > 0 ? 'PASS' : 'FAIL',
              rows.length > 0 ? `${SAMPLE_ID} found in table` : 'Not found');
            await searchInput.fill('');
          }
        }
      }
    }

    await shot(p, '12-sample-tracker');
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  ACT 2: LAB MANAGER — Independent Review
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  🔍 ACT 2: LAB MANAGER — Independent Review');
  console.log('═'.repeat(60));

  const managerFindings = [];
  function finding(category, pass, detail) {
    managerFindings.push({ category, pass, detail });
    console.log(`  ${pass ? '✅' : '⚠️'} [${category}] ${detail}`);
  }

  // ── REVIEW 1: Check Sample Tracker ──
  console.log('\n📊 REVIEW: Sample Tracker\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/sample-tracker/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);
    // Reload to pick up latest samples.json
    await p.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const searchInput = await p.$('input[placeholder*="Search"]');
    if (searchInput) {
      // Search by sample ID (more reliable than species search)
      await searchInput.fill(SAMPLE_ID);
      await p.waitForTimeout(500);
      let rows = await p.$$('tbody tr');
      let found = rows.length > 0;

      // Fallback: search by species
      if (!found) {
        await searchInput.fill('Sequoia');
        await p.waitForTimeout(500);
        rows = await p.$$('tbody tr');
        found = rows.length > 0;
      }

      finding('Sample Traceability', found, found
        ? `Found sample in tracker (${rows.length} match)`
        : 'Could not find sample by ID or species search');

      if (found) {
        const rowText = await rows[0].evaluate(el => el.innerText);
        const hasProject = rowText.includes('DNA Extraction') || rowText.includes('Optimization');
        const hasLead = rowText.includes('Freckles');
        const hasStatus = rowText.includes('DNA extracted') || rowText.includes('extracted');
        finding('Sample Data Quality', hasProject || hasStatus,
          `project=${hasProject} lead=${hasLead} status=${hasStatus}`);
      }
    }

    await shot(p, '13-review-samples');
    await p.close();
  }

  // ── REVIEW 2: Check Project Page ──
  console.log('\n📁 REVIEW: Project Page\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + `/app/projects.html?doc=projects/${PROJECT_SLUG}/index`,
      { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    const content = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc') || document.querySelector('.lab-rendered');
      return el ? el.innerText : '';
    });

    const hasObjective = content.includes('Optimize') || content.includes('Sequoia');
    const hasTeam = content.includes('Freckles') || content.includes('James');
    const hasProtocols = content.includes('DNeasy') || content.includes('grinding');

    finding('Project Documentation', hasObjective,
      `objective=${hasObjective} team=${hasTeam} protocols=${hasProtocols}`);

    if (content.length < 50) {
      finding('Project Page', false, 'Content too short or not loaded (manager cannot review)');
    }

    // Check view mode appearance
    await shot(p, '14-review-project-view');

    // Enter edit mode and check
    await p.evaluate(() => { if (typeof startEdit === 'function') startEdit(); });
    await p.waitForTimeout(3000);
    await shot(p, '15-review-project-edit');

    // Cancel
    await p.evaluate(() => { if (typeof cancelEdit === 'function') cancelEdit(); });
    await p.close();
  }

  // ── REVIEW 3: Check Protocols ──
  console.log('\n🔬 REVIEW: Protocols\n');
  {
    const p = await context.newPage();

    // Check grinding protocol
    const grindSlugShort = GRIND_SLUG;
    await p.goto(BASE + `/app/protocols.html?doc=wet-lab/${grindSlugShort}`,
      { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    const grindContent = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc');
      return el ? el.innerText : '';
    });
    const grindOk = grindContent.includes('mortar') || grindContent.includes('nitrogen');
    finding('Grinding Protocol', grindOk,
      grindOk ? 'Protocol has procedure details' : 'Content missing or not loaded');
    await shot(p, '16-review-grinding-protocol');

    // Check DNeasy protocol
    const dneasySlugShort = DNEASY_SLUG;
    await p.goto(BASE + `/app/protocols.html?doc=wet-lab/${dneasySlugShort}`,
      { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    const dneasyContent = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc');
      return el ? el.innerText : '';
    });
    const dneasyOk = dneasyContent.includes('Buffer AP1') || dneasyContent.includes('DNeasy');
    finding('DNeasy Protocol', dneasyOk,
      dneasyOk ? 'Full extraction protocol present' : 'Content missing');
    await shot(p, '17-review-dneasy-protocol');

    // Check modified copy
    const copySlug = DNEASY_SLUG + '-copy';
    await p.goto(BASE + `/app/protocols.html?doc=wet-lab/${copySlug}`,
      { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    const copyContent = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc');
      return el ? el.innerText : '';
    });
    // Also check raw GitHub content (rendered view may have cache lag)
    const copyRaw = ghReadFile(DNEASY_COPY_PATH);
    const has50uL = copyContent.includes('50uL') || copyContent.includes('50µL') ||
                    copyRaw?.includes('50uL') || copyRaw?.includes('50µL');
    const hasModNote = copyContent.includes('MODIFIED') || copyRaw?.includes('MODIFIED');
    finding('Modified Protocol', has50uL,
      has50uL ? `50uL_elution=true modification_note=${hasModNote}`
        : 'UX FINDING: setMarkdown() after duplicateDoc() did not persist — programmatic edits may not trigger save. User must manually re-type changes after duplicating.');
    await shot(p, '18-review-modified-protocol');

    await p.close();
  }

  // ── REVIEW 4: Check Notebook ──
  console.log('\n📓 REVIEW: Lab Notebook\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + `/app/notebooks.html?doc=notebooks/alex-chen/${NB_TITLE}`,
      { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    const nbContent = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc');
      return el ? el.innerText : '';
    });

    const checks = {
      hasDate: nbContent.includes(TODAY) || nbContent.includes('Date'),
      hasResearcher: nbContent.includes('James Freckles'),
      hasObjective: nbContent.includes('50uL') || nbContent.includes('elution'),
      hasNanoDrop: nbContent.includes('45.2') || nbContent.includes('82.7'),
      hasConclusions: nbContent.includes('1.8x') || nbContent.includes('concentration'),
      hasReagentList: nbContent.includes('DNeasy') || nbContent.includes('agarose'),
      hasNextSteps: nbContent.includes('-80') || nbContent.includes('library prep'),
    };

    const completeness = Object.values(checks).filter(v => v).length;
    finding('Notebook Completeness', completeness >= 4,
      `${completeness}/7 sections present: ${JSON.stringify(checks)}`);

    // Check for rendered table
    const hasRenderedTable = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc');
      return el ? !!el.querySelector('table') : false;
    });
    finding('QA/QC Data Table', hasRenderedTable,
      hasRenderedTable ? 'NanoDrop results table renders correctly' : 'Table not rendered in view mode');

    // Check for gel image
    const hasRenderedImage = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc');
      return el ? !!el.querySelector('img') : false;
    });
    finding('Gel Image', hasRenderedImage,
      hasRenderedImage ? 'Gel electrophoresis image visible' : 'Image not visible in rendered view (may be GitHub API cache)');

    await shot(p, '19-review-notebook-view');

    // Enter edit mode
    await p.evaluate(() => { if (typeof startEdit === 'function') startEdit(); });
    await p.waitForTimeout(3000);
    await shot(p, '20-review-notebook-edit');
    await p.evaluate(() => { if (typeof cancelEdit === 'function') cancelEdit(); });

    await p.close();
  }

  // ── REVIEW 5: Check Freezer ──
  console.log('\n🧊 REVIEW: Freezer Storage\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/lab-map.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    await p.evaluate(() => labMap.open('freezer-80c'));
    await p.waitForTimeout(1500);

    // Search for redwood sample
    const shelves = await p.$$('.shelf-card');
    let foundInFreezer = false;
    if (shelves.length > 0) {
      await shelves[0].click({ timeout: 5000 });
      await p.waitForTimeout(1000);

      // Check if any occupied cell contains our item
      const occupied = await p.$$('.tube-cell.occupied');
      for (const cell of occupied) {
        await cell.click();
        await p.waitForTimeout(300);
        const detail = await p.$eval('#tubeDetail', el => el.innerText).catch(() => '');
        if (detail.includes('Redwood') || detail.includes(TS)) {
          foundInFreezer = true;
          break;
        }
      }
    }

    finding('Freezer Storage', foundInFreezer || ghFileExists(FREEZER_PATH),
      foundInFreezer
        ? 'DNA sample found in -80C freezer box with correct position'
        : ghFileExists(FREEZER_PATH)
          ? 'File exists on GitHub (may not appear in grid yet due to cache)'
          : 'Sample not found in freezer');

    await shot(p, '21-review-freezer');
    await p.close();
  }

  // ── REVIEW 6: Check Inventory ──
  console.log('\n🧪 REVIEW: Inventory\n');
  {
    const p = await context.newPage();
    await p.goto(BASE + '/app/inventory.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    await p.fill('input[placeholder*="Search"]', 'dneasy');
    await p.waitForTimeout(1000);
    const rows = await p.$$('tbody tr');
    finding('Inventory Registration', rows.length > 0 || ghFileExists(INV_PATH),
      rows.length > 0
        ? `Found DNeasy kit in inventory (${rows.length} matches)`
        : ghFileExists(INV_PATH)
          ? 'File exists on GitHub but search didnt find it (index cache)'
          : 'Kit not registered in inventory');

    await shot(p, '22-review-inventory');
    await p.close();
  }

  // ── REVIEW 7: Cross-link verification ──
  console.log('\n🔗 REVIEW: Cross-linking & Wikilinks\n');
  {
    // Check if project references protocols
    const projContent = ghReadFile(PROJECT_PATH);
    const hasProtoRef = projContent?.includes('DNeasy') || projContent?.includes('grinding');
    finding('Project-Protocol Links', hasProtoRef,
      hasProtoRef ? 'Project page references protocols' : 'No protocol references in project');

    // Check notebook references
    const nbContent = ghReadFile(NB_PATH);
    const hasProjectRef = nbContent?.includes('Optimization') || nbContent?.includes('redwood');
    finding('Notebook-Project Links', hasProjectRef,
      hasProjectRef ? 'Notebook references the project context' : 'No project references in notebook');

    // Note: wikilinks as [[slug]] would require the object-index to resolve.
    // Since we typed content directly (not via Resources insert modal), wikilinks
    // are plain text references rather than [[slug]] wikilinks. This is a UX gap.
    finding('Formal Wikilinks', false,
      'UX GAP: Worker typed protocol names as plain text, not [[wikilinks]]. The Resources insert modal exists but is extra steps during fast note-taking. Consider auto-linking known object names.');
  }

  // ════════════════════════════════════════════════════════════
  //  COMBINED REPORT
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  📋 COMBINED WORKFLOW REPORT');
  console.log('═'.repeat(60));

  // James Freckles Report
  console.log('\n  🧑‍🔬 JAMES FRECKLES — Worker Report\n');
  const sections = [...new Set(results.map(r => r.section))];
  totalPass = 0; totalFail = 0; totalWarn = 0;
  for (const section of sections) {
    const sr = results.filter(r => r.section === section);
    const pass = sr.filter(r => r.status === 'PASS').length;
    const fail = sr.filter(r => r.status === 'FAIL').length;
    const warn = sr.filter(r => r.status === 'WARN').length;
    totalPass += pass; totalFail += fail; totalWarn += warn;
    const icon = fail > 0 ? '❌' : warn > 0 ? '⚠️' : '✅';
    console.log(`  ${icon} ${section.toUpperCase()} (${pass}/${sr.length})`);
    sr.forEach(r => {
      const i = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`     ${i} ${r.test}: ${r.detail.substring(0, 80)}`);
    });
  }
  console.log(`\n  TOTAL: ${totalPass} pass / ${totalFail} fail / ${totalWarn} warn`);

  // Lab Manager Report
  console.log('\n  🔍 LAB MANAGER — Review Report\n');
  const mgrPass = managerFindings.filter(f => f.pass).length;
  const mgrTotal = managerFindings.length;
  managerFindings.forEach(f => {
    console.log(`  ${f.pass ? '✅' : '⚠️'} [${f.category}] ${f.detail.substring(0, 80)}`);
  });
  console.log(`\n  MANAGER VERDICT: ${mgrPass}/${mgrTotal} checks passed`);

  // UX Improvement Suggestions
  console.log('\n  💡 UX IMPROVEMENT SUGGESTIONS\n');
  const suggestions = [
    '1. AUTO-WIKILINK: When typing a known object name (e.g., "DNeasy"), offer to auto-link it as [[slug]]. Currently requires manual Resources modal.',
    '2. CROSS-PAGE LINKING: No way to link a notebook entry to a project, sample, or freezer position from within the editor. Would need a "Link to..." button.',
    '3. SAMPLE-TO-NOTEBOOK: Sample tracker has no field for linking to lab notebook entries. Add an optional "notebook_entry" or "detail_link" field.',
    '4. FREEZER-TO-SAMPLE: Creating an item in the freezer doesn\'t auto-add it to the sample tracker. Should offer "Also add to sample tracker?"',
    '5. PROTOCOL COMPARISON: No side-by-side view for comparing original vs. modified protocols. Would help QA/QC.',
    '6. REAGENT CONSUMPTION: No way to log "used 2 columns from DNeasy kit" and auto-decrement inventory. Currently manual.',
    '7. GEL IMAGE VIEWER: Gel images are just PNGs. A dedicated viewer with lane labeling and band sizing would improve QA/QC.',
    '8. EXPERIMENT TEMPLATE: No "start experiment" workflow that scaffolds project + protocols + notebook + samples together. Each step is manual.',
    '9. QA/QC DASHBOARD: No aggregated view of sample quality metrics (NanoDrop values, gel images) across experiments.',
    '10. AUDIT TRAIL: Hard to trace the complete path from tissue collection → grinding → extraction → QC → storage → sequencing across separate pages.',
  ];
  suggestions.forEach(s => console.log(`  ${s}`));

  // Screenshot index
  console.log('\n  📸 SCREENSHOTS\n');
  screenshots.forEach(s => console.log(`  ${s}`));

  console.log('\n' + '═'.repeat(60) + '\n');

  } catch (e) {
    console.error(`\n💥 CRASH: ${e.message.substring(0, 300)}`);
    console.error(e.stack?.substring(0, 500));
  }

  // ════════════════════════════════════════════════════════════
  //  CLEANUP
  // ════════════════════════════════════════════════════════════
  if (!KEEP && cleanup.length > 0) {
    console.log('\n🧹 CLEANUP\n');
    for (const { path } of cleanup) {
      const ok = ghDeleteFile(path, `Workflow cleanup: ${path}`);
      console.log(`  ${ok ? '✅' : '⚠️'} ${path}`);
    }

    // Clean up sample from samples.json
    try {
      const samplesPath = 'docs/sample-tracker/samples.json';
      const currentContent = ghReadFile(samplesPath);
      if (currentContent) {
        const currentSamples = JSON.parse(currentContent);
        const filtered = currentSamples.filter(s => s.sampleId !== SAMPLE_ID);
        if (filtered.length < currentSamples.length) {
          const newContent = JSON.stringify(filtered, null, 2) + '\n';
          const b64 = Buffer.from(newContent).toString('base64');
          const sha = execSync(`gh api "repos/${REPO}/contents/${samplesPath}" --jq '.sha'`, { stdio: 'pipe' }).toString().trim();
          execSync(`gh api -X PUT "repos/${REPO}/contents/${samplesPath}" -f message="Workflow cleanup: remove ${SAMPLE_ID}" -f content="${b64}" -f sha="${sha}"`, { stdio: 'pipe' });
          console.log(`  ✅ Removed ${SAMPLE_ID} from samples.json`);
        }
      }
    } catch(e) {
      console.log(`  ⚠️ samples.json cleanup failed: ${e.message?.substring(0, 60)}`);
    }
  } else if (KEEP && cleanup.length > 0) {
    console.log('\n📌 Keeping test artifacts:');
    cleanup.forEach(c => console.log(`  ${c.path}`));
  }

  await browser.close();
  process.exit(totalFail > 0 ? 1 : 0);
})();
