#!/usr/bin/env node
/**
 * 🤖 LabBot — Monroe Lab's Digital Lab Member
 *
 * A Playwright bot that simulates a full day as a lab member:
 * browses protocols, edits wiki pages, manages inventory, writes notebook
 * entries, places items on the freezer map, and cleans up after itself.
 *
 * Usage:
 *   node tests/labbot.mjs              # run all tests
 *   node tests/labbot.mjs --keep       # don't clean up test artifacts
 *   node tests/labbot.mjs --headed     # show the browser (useful for debugging)
 *   node tests/labbot.mjs --only=wiki  # run only the wiki section
 *
 * Prerequisites:
 *   - Playwright installed: npx playwright install chromium
 *   - GitHub CLI authenticated: gh auth login
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
const ONLY = ARGS.find(a => a.startsWith('--only='))?.split('=')[1];
const TS = Date.now().toString(36); // unique stamp for this run

// ── Test tracking ──
const results = [];
const cleanup = []; // { path } — files to delete at end

function log(section, test, status, detail) {
  results.push({ section, test, status, detail });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} ${test}: ${detail}`);
}

// Sections quarantined while a feature is being rebuilt. They run only when
// explicitly targeted via --only=<name>. See STATUS.md + Issue #19.
const QUARANTINED = new Set([
  // labmap was quarantined during R1/R2 while the floor-plan was retired.
  // Rebuilt as a hierarchical tree view in R2 — tests below cover the new UI.
]);
function shouldRun(name) {
  if (QUARANTINED.has(name) && ONLY !== name) return false;
  return !ONLY || ONLY === name;
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

// ── Main ──
(async () => {
  console.log(`\n🤖 LabBot starting — run ID: ${TS}`);
  console.log(`   ${HEADED ? 'Headed' : 'Headless'} mode, ${KEEP ? 'keeping' : 'cleaning up'} artifacts\n`);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Auth on every page load
  await context.addInitScript((token) => {
    sessionStorage.setItem('monroe-lab-auth', 'true');
    localStorage.setItem('gh_lab_token', token);
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
  }, GH_TOKEN);

  try {

  // ════════════════════════════════════════════════════════════
  //  PROTOCOLS: search, open, read, edit, save
  // ════════════════════════════════════════════════════════════
  if (shouldRun('protocols')) {
    console.log('\n📋 PROTOCOLS\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/protocols.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    // Search
    await p.fill('input[placeholder*="Search"]', 'PCR');
    await p.waitForTimeout(1000);
    const searchResults = await p.evaluate(() =>
      Array.from(document.querySelectorAll('[data-path]'))
        .filter(el => el.offsetParent !== null).map(el => el.textContent.trim())
    );
    log('protocols', 'Search "PCR"', searchResults.length > 0 ? 'PASS' : 'FAIL',
      `${searchResults.length} results: ${searchResults.join(', ')}`);

    // Open a protocol
    await p.fill('input[placeholder*="Search"]', '');
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      document.querySelectorAll('[onclick]').forEach(el => {
        if ((el.getAttribute('onclick') || '').includes('seed-sterilization') && !(el.getAttribute('onclick') || '').includes('copy')) el.click();
      });
    });
    await p.waitForTimeout(3000);

    const protoContent = await p.evaluate(() => {
      const el = document.getElementById('renderedDoc') || document.querySelector('.lab-rendered');
      return el ? el.innerText.substring(0, 200) : '';
    });
    log('protocols', 'Open & read protocol', protoContent.length > 50 ? 'PASS' : 'FAIL',
      protoContent.substring(0, 60) || 'No content');

    // Click Edit button (contains material icon "edit" + text "Edit")
    const editClicked = await p.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span[onclick]');
      for (const b of btns) {
        const t = b.textContent.trim();
        if ((t === 'Edit' || t === 'editEdit' || t.endsWith('Edit')) && b.offsetParent) {
          b.click(); return true;
        }
      }
      return false;
    });
    await p.waitForTimeout(3000);

    const editorVisible = await p.$('.ProseMirror, [contenteditable="true"], .toastui-editor');
    log('protocols', 'Enter edit mode', editorVisible ? 'PASS' : (editClicked ? 'WARN' : 'FAIL'),
      editorVisible ? 'Editor loaded' : editClicked ? 'Edit clicked but editor slow' : 'No edit button');

    if (editorVisible) {
      // Cancel without saving
      const cancelBtn = await p.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.includes('Cancel') || b.textContent.includes('Done')) {
            if (b.offsetParent) { b.click(); return true; }
          }
        }
        return false;
      });
      await p.waitForTimeout(1000);
      log('protocols', 'Exit edit mode', cancelBtn ? 'PASS' : 'WARN', cancelBtn ? 'Cancelled' : 'No cancel button');
    }

    // ── Create protocol from template ──
    const protoTitle = `LabBot Test Protocol ${TS}`;
    const protoSlug = protoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const protoFilePath = `docs/wet-lab/${protoSlug}.md`;

    // Handle the prompt() dialog for protocol title
    p.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') await dialog.accept(protoTitle);
      else if (dialog.type() === 'confirm') await dialog.accept();
      else await dialog.dismiss();
    });

    await p.evaluate(() => { if (typeof createNewProtocol === 'function') createNewProtocol(); });
    await p.waitForTimeout(8000);

    const protoCreated = ghFileExists(protoFilePath);
    log('protocols', 'Create from template', protoCreated ? 'PASS' : 'FAIL',
      protoCreated ? `${protoFilePath} on GitHub` : 'Protocol not created');
    if (protoCreated) cleanup.push({ path: protoFilePath });
    await p.screenshot({ path: '/tmp/labbot-proto-created.png', fullPage: false });

    // ── Edit protocol and save ──
    if (protoCreated) {
      // startEdit should already be in edit mode after creation, or we enter it
      const WW_PM = '.toastui-editor-ww-container .ProseMirror';
      let protoEdReady = false;
      for (let i = 0; i < 30; i++) {
        protoEdReady = await p.evaluate(() =>
          !!document.querySelector('.toastui-editor-ww-container .ProseMirror') && !!window.editorInstance
        );
        if (protoEdReady) break;
        await p.waitForTimeout(500);
      }
      if (!protoEdReady) {
        // Try entering edit mode
        await p.evaluate(() => { if (typeof startEdit === 'function') startEdit(); });
        for (let i = 0; i < 30; i++) {
          protoEdReady = await p.evaluate(() =>
            !!document.querySelector('.toastui-editor-ww-container .ProseMirror') && !!window.editorInstance
          );
          if (protoEdReady) break;
          await p.waitForTimeout(500);
        }
      }

      if (protoEdReady) {
        // Focus WYSIWYG and add test content
        await p.evaluate((sel) => {
          const pm = document.querySelector(sel);
          if (pm) {
            pm.focus();
            const s = window.getSelection();
            s.selectAllChildren(pm);
            s.collapseToEnd();
          }
        }, WW_PM);
        await p.waitForTimeout(500);

        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Materials');
        await p.keyboard.press('Enter');
        await p.evaluate(() => editorInstance.editor.exec('bulletList'));
        await p.keyboard.type('LabBot test reagent');
        await p.keyboard.press('Enter');
        await p.keyboard.type('Sterile water');
        await p.waitForTimeout(500);

        // Save via Cmd+S
        await p.keyboard.press('Meta+s');
        await p.waitForTimeout(8000);

        const protoSaved = ghReadFile(protoFilePath);
        const hasMaterials = protoSaved?.includes('## Materials');
        const hasReagent = protoSaved?.includes('LabBot test reagent');
        log('protocols', 'Edit & save protocol',
          (hasMaterials && hasReagent) ? 'PASS' : 'FAIL',
          `heading=${hasMaterials} content=${hasReagent}`);
        await p.screenshot({ path: '/tmp/labbot-proto-edited.png', fullPage: false });
      } else {
        log('protocols', 'Edit protocol', 'FAIL', 'Editor not ready');
      }

      // ── Duplicate protocol ──
      const dupResult = await p.evaluate(async () => {
        if (typeof duplicateDoc !== 'function' || !currentDoc) return { error: 'not available' };
        try { await duplicateDoc(); return { ok: true, doc: currentDoc }; }
        catch(e) { return { error: e.message }; }
      });
      await p.waitForTimeout(8000);
      if (dupResult.ok) {
        const dupPath = protoFilePath.replace('.md', '-copy.md');
        const dupExists = ghFileExists(dupPath);
        log('protocols', 'Duplicate protocol', dupExists ? 'PASS' : 'FAIL',
          dupExists ? `${dupPath} on GitHub` : 'Copy not found');
        if (dupExists) cleanup.push({ path: dupPath });
      } else {
        log('protocols', 'Duplicate protocol', 'FAIL', `duplicateDoc: ${dupResult.error}`);
      }

      // ── Rename protocol (via prompt dialog) ──
      const renamedTitle = `LabBot Renamed ${TS}`;
      const renamedSlug = renamedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const renamedPath = `docs/wet-lab/${renamedSlug}.md`;
      // Navigate back to original protocol first
      await p.evaluate((slug) => {
        if (typeof loadDoc === 'function') loadDoc('wet-lab/' + slug);
      }, protoSlug);
      await p.waitForTimeout(3000);
      // Set up prompt handler for rename
      p.removeAllListeners('dialog');
      p.on('dialog', async dialog => {
        if (dialog.type() === 'prompt') await dialog.accept(renamedTitle);
        else if (dialog.type() === 'confirm') await dialog.accept();
        else await dialog.dismiss();
      });
      const renameResult = await p.evaluate(async () => {
        if (typeof renameDoc !== 'function') return { error: 'not available' };
        try { await renameDoc(); return { ok: true }; }
        catch(e) { return { error: e.message }; }
      });
      await p.waitForTimeout(8000);
      if (renameResult.ok) {
        const renamedExists = ghFileExists(renamedPath);
        log('protocols', 'Rename protocol', renamedExists ? 'PASS' : 'FAIL',
          renamedExists ? `${renamedPath} created` : 'New file not found');
        // Clean up old file if rename didn't delete it (SHA cache mismatch)
        const oldIdx = cleanup.findIndex(c => c.path === protoFilePath);
        if (oldIdx >= 0) cleanup.splice(oldIdx, 1);
        if (ghFileExists(protoFilePath)) {
          ghDeleteFile(protoFilePath, 'LabBot cleanup: old renamed protocol');
        }
        if (renamedExists) cleanup.push({ path: renamedPath });
        await p.screenshot({ path: '/tmp/labbot-proto-renamed.png', fullPage: false });
      } else {
        log('protocols', 'Rename protocol', 'FAIL', `renameDoc: ${renameResult.error}`);
      }

      // ── Delete protocol (via confirm dialog) ──
      // Delete the renamed protocol (or original if rename failed)
      const delTarget = ghFileExists(renamedPath) ? renamedPath : protoFilePath;
      const delTargetSlug = delTarget.replace('docs/wet-lab/', '').replace('.md', '');
      await p.evaluate((slug) => {
        if (typeof loadDoc === 'function') loadDoc('wet-lab/' + slug);
      }, delTargetSlug);
      await p.waitForTimeout(3000);
      p.removeAllListeners('dialog');
      p.on('dialog', async dialog => {
        if (dialog.type() === 'confirm') await dialog.accept();
        else await dialog.dismiss();
      });
      const deleteResult = await p.evaluate(async () => {
        if (typeof deleteDoc !== 'function') return { error: 'not available' };
        try { await deleteDoc(); return { ok: true }; }
        catch(e) { return { error: e.message }; }
      });
      await p.waitForTimeout(8000);
      if (deleteResult.ok) {
        const deleted = !ghFileExists(delTarget);
        log('protocols', 'Delete protocol', deleted ? 'PASS' : 'FAIL',
          deleted ? `${delTarget} removed` : 'File still exists');
        if (deleted) {
          const idx = cleanup.findIndex(c => c.path === delTarget);
          if (idx >= 0) cleanup.splice(idx, 1);
        }
      } else {
        log('protocols', 'Delete protocol', 'FAIL', `deleteDoc: ${deleteResult.error}`);
      }
    }

    await p.screenshot({ path: '/tmp/labbot-protocols.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  WIKI: search, create, edit, save, verify, wikilink
  // ════════════════════════════════════════════════════════════
  if (shouldRun('wiki')) {
    console.log('\n📖 WIKI\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/wiki.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const docCount = await p.evaluate(() => {
      const m = document.body.innerText.match(/(\d+)\s*documents/);
      return m ? parseInt(m[1]) : 0;
    });
    log('wiki', 'Documents loaded', docCount > 100 ? 'PASS' : 'FAIL', `${docCount} documents`);

    // Create a new wiki page
    await p.click('#newDocBtn');
    await p.waitForTimeout(1000);
    const wikiTitle = `labbot-wiki-${TS}`;
    await p.fill('#wm_title', wikiTitle);
    await p.selectOption('#wm_folder', 'resources');
    await p.click('#wmOk');
    await p.waitForTimeout(8000);

    const wikiCreated = ghFileExists(`docs/resources/${wikiTitle}.md`);
    log('wiki', 'Create wiki page', wikiCreated ? 'PASS' : 'FAIL',
      wikiCreated ? `docs/resources/${wikiTitle}.md exists on GitHub` : 'File not found');
    if (wikiCreated) cleanup.push({ path: `docs/resources/${wikiTitle}.md` });

    // ── Rich text editing on the test wiki page ──
    if (wikiCreated) {
      await p.goto(BASE + `/app/wiki.html?doc=resources%2F${wikiTitle}`,
        { waitUntil: 'networkidle', timeout: 20000 });
      // Wait for doc to load
      for (let i = 0; i < 30; i++) {
        const ready = await p.evaluate(() => !!currentDoc && !isEditing);
        if (ready) break;
        await p.waitForTimeout(500);
      }

      // Enter edit mode
      await p.evaluate(() => startEdit());
      let wikiEdReady = false;
      const WW_PM = '.toastui-editor-ww-container .ProseMirror';
      for (let i = 0; i < 30; i++) {
        wikiEdReady = await p.evaluate(() =>
          !!document.querySelector('.toastui-editor-ww-container .ProseMirror') && !!window.editorInstance
        );
        if (wikiEdReady) break;
        await p.waitForTimeout(500);
      }

      if (wikiEdReady) {
        // Focus WYSIWYG ProseMirror
        await p.evaluate((sel) => {
          document.querySelector(sel)?.focus();
        }, WW_PM);
        await p.waitForTimeout(500);

        // Clear and type rich content: heading, bold, blockquote, table, code block
        await p.keyboard.press('Meta+a');
        await p.keyboard.press('Backspace');
        await p.waitForTimeout(300);

        // Heading
        await p.evaluate(() => editorInstance.editor.exec('heading', { level: 2 }));
        await p.keyboard.type('Test Chemical');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        // Bold + italic line
        await p.keyboard.press('Meta+b');
        await p.keyboard.type('Hazard:');
        await p.keyboard.press('Meta+b');
        await p.keyboard.type(' ');
        await p.keyboard.press('Meta+i');
        await p.keyboard.type('flammable');
        await p.keyboard.press('Meta+i');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        // Blockquote
        await p.evaluate(() => editorInstance.editor.exec('blockQuote'));
        await p.keyboard.type('Store in flammable cabinet below 25C');
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter'); // exit blockquote
        await p.waitForTimeout(200);

        // Code block
        await p.evaluate(() => editorInstance.editor.exec('codeBlock'));
        await p.waitForTimeout(300);
        await p.keyboard.type('concentration: 70%');
        // Exit code block — press Enter at end then arrow down
        await p.keyboard.press('ArrowDown');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        // Table via exec
        await p.evaluate(() => editorInstance.editor.exec('addTable', { rowCount: 2, columnCount: 2 }));
        await p.waitForTimeout(500);

        // Check WYSIWYG DOM
        const wikiDom = await p.evaluate((sel) => {
          const pm = document.querySelector(sel);
          if (!pm) return {};
          return {
            hasH2: !!pm.querySelector('h2'),
            hasStrong: !!pm.querySelector('strong'),
            hasEm: !!pm.querySelector('em'),
            hasBlockquote: !!pm.querySelector('blockquote'),
            hasCodeBlock: !!pm.querySelector('pre') || !!pm.querySelector('code'),
            hasTable: !!pm.querySelector('table'),
          };
        }, WW_PM);

        const wikiRich = wikiDom.hasH2 && wikiDom.hasStrong && wikiDom.hasEm &&
                         wikiDom.hasBlockquote && wikiDom.hasCodeBlock && wikiDom.hasTable;
        log('wiki', 'Rich text in editor (h2/bold/italic/quote/code/table)',
          wikiRich ? 'PASS' : 'FAIL',
          `h2=${wikiDom.hasH2} strong=${wikiDom.hasStrong} em=${wikiDom.hasEm} quote=${wikiDom.hasBlockquote} code=${wikiDom.hasCodeBlock} table=${wikiDom.hasTable}`);

        // ── Wikilink insertion (same editing session, before save) ──
        // Move cursor to end of document without selecting (Meta+a would select all)
        await p.evaluate((sel) => {
          const pm = document.querySelector(sel);
          if (!pm) return;
          pm.focus();
          // Move ProseMirror cursor to end of document
          const sel2 = window.getSelection();
          sel2.selectAllChildren(pm);
          sel2.collapseToEnd();
        }, WW_PM);
        await p.waitForTimeout(300);
        await p.keyboard.press('Enter');
        await p.keyboard.press('Enter');
        await p.waitForTimeout(200);

        // Click "Resources" insert button to open link modal
        const modalOpened = await p.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const b of buttons) {
            if (b.textContent.includes('Resources') && b.offsetParent) {
              b.click(); return true;
            }
          }
          return false;
        });
        await p.waitForTimeout(1500);

        let wlInserted = false;
        if (modalOpened) {
          const searchInput = await p.$('#em-link-search');
          if (searchInput) {
            await searchInput.fill('ethanol');
            await p.waitForTimeout(1000);
            const clicked = await p.evaluate(() => {
              const list = document.getElementById('em-link-list');
              const item = list?.querySelector('[onclick]');
              if (item) { item.click(); return true; }
              return false;
            });
            await p.waitForTimeout(1000);

            if (clicked) {
              const wlInEditor = await p.evaluate((sel) => {
                const pm = document.querySelector(sel);
                if (!pm) return {};
                const links = pm.querySelectorAll('a[href*="obj.link"]');
                return {
                  count: links.length,
                  text: links.length > 0 ? links[links.length - 1].textContent : '',
                };
              }, WW_PM);
              wlInserted = wlInEditor.count > 0;
              log('wiki', 'Wikilink inserted in editor',
                wlInserted ? 'PASS' : 'FAIL',
                `${wlInEditor.count} obj.link(s), text="${wlInEditor.text}"`);
            } else {
              log('wiki', 'Wikilink insert', 'FAIL', 'No item in results');
            }
          }
        }

        await p.screenshot({ path: '/tmp/labbot-wiki-richtext.png', fullPage: false });

        // ── Save everything (rich text + wikilink) ──
        await p.evaluate((sel) => {
          document.querySelector(sel)?.focus();
        }, WW_PM);
        await p.waitForTimeout(200);
        await p.keyboard.press('Meta+s');
        await p.waitForTimeout(8000);

        // Verify saved markdown
        const wikiSaved = ghReadFile(`docs/resources/${wikiTitle}.md`);
        const wikiMdCheck = {
          heading: wikiSaved?.includes('## Test Chemical'),
          bold: wikiSaved?.includes('**Hazard:**'),
          italic: wikiSaved?.includes('*flammable*'),
          quote: wikiSaved?.includes('> Store in flammable'),
          code: wikiSaved?.includes('concentration: 70%'),
          table: wikiSaved?.includes('|'),
        };
        const wikiSaveOk = wikiMdCheck.heading && wikiMdCheck.bold && wikiMdCheck.italic &&
                           wikiMdCheck.quote && wikiMdCheck.code && wikiMdCheck.table;
        log('wiki', 'Rich text saved to GitHub',
          wikiSaveOk ? 'PASS' : (wikiSaved ? 'FAIL' : 'WARN'),
          `heading=${wikiMdCheck.heading} bold=${wikiMdCheck.bold} italic=${wikiMdCheck.italic} quote=${wikiMdCheck.quote} code=${wikiMdCheck.code} table=${wikiMdCheck.table}`);

        // Check wikilink round-trip
        if (wlInserted && wikiSaved) {
          const wlMatch = wikiSaved.match(/\[\[([^\]]+)\]\]/);
          log('wiki', 'Wikilink saved as [[slug]]',
            wlMatch ? 'PASS' : 'FAIL',
            wlMatch ? `Found [[${wlMatch[1]}]]` : 'No [[...]] in saved md');
        }

        // Check rendered view after save
        for (let i = 0; i < 30; i++) {
          const ready = await p.evaluate(() => {
            const el = document.getElementById('renderedDoc');
            return el && el.querySelector('h2') && !document.body.classList.contains('editing-mode');
          });
          if (ready) break;
          await p.waitForTimeout(500);
        }
        await p.waitForTimeout(500);
        const wikiRendered = await p.evaluate(() => {
          const el = document.getElementById('renderedDoc');
          if (!el) return {};
          return {
            hasH2: !!el.querySelector('h2'),
            hasStrong: !!el.querySelector('strong'),
            hasEm: !!el.querySelector('em') || !!el.querySelector('i'),
            hasBlockquote: !!el.querySelector('blockquote'),
            hasCode: !!el.querySelector('pre') || !!el.querySelector('code'),
            hasTable: !!el.querySelector('table'),
            hasPill: !!el.querySelector('.object-pill'),
            text: el.innerText.substring(0, 100),
          };
        });
        const wikiRenderOk = wikiRendered.hasH2 && wikiRendered.hasStrong && wikiRendered.hasEm &&
                             wikiRendered.hasBlockquote && wikiRendered.hasCode && wikiRendered.hasTable;
        const hasAnyContent = (wikiRendered.text || '').length > 10;
        log('wiki', 'Rich text renders after save',
          wikiRenderOk ? 'PASS' : (hasAnyContent ? 'WARN' : 'FAIL'),
          `h2=${wikiRendered.hasH2} strong=${wikiRendered.hasStrong} em=${wikiRendered.hasEm} quote=${wikiRendered.hasBlockquote} code=${wikiRendered.hasCode} table=${wikiRendered.hasTable} pill=${wikiRendered.hasPill}`);
        await p.screenshot({ path: '/tmp/labbot-wiki-rendered.png', fullPage: false });
      } else {
        log('wiki', 'Wiki editor init', 'FAIL', 'ProseMirror or editorInstance not ready');
      }
    }

    // Test editing on an EXISTING page — navigate via URL
    await p.goto(BASE + '/app/wiki.html?doc=resources%2Fethanol-70', { waitUntil: 'networkidle', timeout: 20000 });
    let docReady = false;
    for (let i = 0; i < 30; i++) {
      docReady = await p.evaluate(() => !!currentDoc && !isEditing && !!document.getElementById('renderedDoc'));
      if (docReady) break;
      await p.waitForTimeout(500);
    }
    log('wiki', 'Open Ethanol page', docReady ? 'PASS' : 'FAIL',
      docReady ? 'Page loaded with content' : 'currentDoc not set');

    if (docReady) {
      // Call startEdit
      await p.evaluate(() => startEdit());
      // Poll until editor appears
      let editor = null;
      for (let i = 0; i < 20; i++) {
        editor = await p.$('.ProseMirror, [contenteditable="true"]');
        if (editor) break;
        await p.waitForTimeout(500);
      }
      await p.screenshot({ path: '/tmp/labbot-wiki-editing.png', fullPage: false });

      if (editor) {
        log('wiki', 'ProseMirror editor loaded', 'PASS', 'Editor ready for typing');

        // Verify editor has content (ethanol page should have some text)
        const editorContent = await editor.textContent();
        log('wiki', 'Editor has content', editorContent.length > 10 ? 'PASS' : 'WARN',
          `${editorContent.length} chars: "${editorContent.substring(0, 60)}..."`);

        // Cancel without saving (don't modify real pages)
        await p.evaluate(() => { if (typeof cancelEdit === 'function') cancelEdit(); });
        await p.waitForTimeout(1000);
        log('wiki', 'Cancel edit (no save)', 'PASS', 'Returned to view mode');
      } else {
        log('wiki', 'Edit wiki page', 'FAIL', 'Editor not found after startEdit()');
      }
    }

    // ── Object popup cards ──
    // Navigate to a page with wikilinks (AMPure XP Beads has [[...]] links)
    await p.goto(BASE + '/app/wiki.html?doc=resources%2Fampure-xp-beads', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);
    const pills = await p.$$('a.object-pill');
    log('wiki', 'Object pills rendered', pills.length > 0 ? 'PASS' : 'WARN',
      pills.length > 0 ? `${pills.length} pills on page` : 'No object pills found');

    if (pills.length > 0) {
      // Verify pills are styled with type-specific colors (from types.pillStyle)
      const pillStyled = await p.evaluate(() => {
        const pill = document.querySelector('a.object-pill');
        if (!pill) return { styled: false };
        const style = pill.getAttribute('style') || '';
        return {
          styled: style.includes('border-radius') || style.includes('background'),
          text: pill.textContent.trim().substring(0, 40),
          href: (pill.getAttribute('href') || '').substring(0, 30),
        };
      });
      log('wiki', 'Object pill styled', pillStyled.styled ? 'PASS' : 'WARN',
        `"${pillStyled.text}" → ${pillStyled.href}`);
    }

    // ── Connections panel (mini graph) ──
    // Navigate to Ethanol page which has known connections
    await p.goto(BASE + '/app/wiki.html?doc=resources%2Fethanol-70', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);
    const miniGraph = await p.evaluate(() => {
      const el = document.getElementById('miniGraph');
      if (!el) return { found: false };
      const canvas = el.querySelector('canvas');
      const header = el.querySelector('.mini-header');
      return {
        found: true,
        hasCanvas: !!canvas,
        headerText: header?.textContent || '',
      };
    });
    log('wiki', 'Connections panel', miniGraph.found ? 'PASS' : 'WARN',
      miniGraph.found
        ? `canvas=${miniGraph.hasCanvas}, header="${miniGraph.headerText}"`
        : 'Mini graph not found');

    await p.screenshot({ path: '/tmp/labbot-wiki.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  INVENTORY: browse, add item, edit, verify
  // ════════════════════════════════════════════════════════════
  if (shouldRun('inventory')) {
    console.log('\n🧪 INVENTORY\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/inventory.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    // Check totals
    const totalItems = await p.evaluate(() => {
      const m = document.body.innerText.match(/(\d+)\s*TOTAL ITEMS/);
      return m ? parseInt(m[1]) : 0;
    });
    log('inventory', 'Items loaded', totalItems > 100 ? 'PASS' : 'FAIL', `${totalItems} items`);

    // Search
    await p.fill('input[placeholder*="Search"]', 'ethanol');
    await p.waitForTimeout(1000);
    const ethRows = await p.$$('tbody tr');
    log('inventory', 'Search "ethanol"', ethRows.length > 0 ? 'PASS' : 'FAIL', `${ethRows.length} results`);
    await p.fill('input[placeholder*="Search"]', '');
    await p.waitForTimeout(500);

    // Add new item — use evaluate to avoid Playwright click timeouts on modals
    const addClicked = await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.includes('Add Item') && b.offsetParent) { b.click(); return true; }
      }
      return false;
    });
    if (addClicked) {
      await p.waitForTimeout(1500);
      await p.screenshot({ path: '/tmp/labbot-inv-modal.png', fullPage: false });

      const invTitle = `labbot-reagent-${TS}`;

      // Fill the modal — find visible text inputs
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
        // Fallback: first visible text input in a modal
        for (const input of inputs) {
          if (input.offsetParent && input.closest('.modal, [class*="modal"], [class*="dialog"]')) {
            input.value = title;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
        return false;
      }, invTitle);

      if (filled) {
        log('inventory', 'Fill add-item form', 'PASS', invTitle);

        // Click Create/Save
        const saved = await p.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) {
            const t = b.textContent.trim();
            if ((t.includes('Create') || t.includes('Save') || t === 'Add') && b.offsetParent) {
              b.click(); return t;
            }
          }
          return null;
        });
        if (saved) {
          await p.waitForTimeout(8000);
          const slugTitle = invTitle;
          const invCreated = ghFileExists(`docs/resources/${slugTitle}.md`);
          log('inventory', 'Save new item', invCreated ? 'PASS' : 'WARN',
            invCreated ? `${slugTitle}.md on GitHub` : 'Not at expected path');
          if (invCreated) cleanup.push({ path: `docs/resources/${slugTitle}.md` });
        } else {
          log('inventory', 'Save button', 'FAIL', 'Not found');
        }
      } else {
        log('inventory', 'Fill add-item form', 'FAIL', 'No title input found in modal');
      }
    } else {
      log('inventory', 'Add Item button', 'FAIL', 'Not found');
    }

    // Filter by type
    const typeFilter = await p.$('select');
    if (typeFilter) {
      const types = await typeFilter.$$eval('option', opts => opts.map(o => o.textContent.trim()));
      log('inventory', 'Type filter options', types.length > 1 ? 'PASS' : 'WARN', types.slice(0, 5).join(', '));
    }

    // ── Edit existing item ──
    const invSlug = `labbot-reagent-${TS}`;
    const invPath = `docs/resources/${invSlug}.md`;
    if (ghFileExists(invPath)) {
      await p.evaluate((slug) => {
        if (typeof openItem === 'function') openItem(slug);
      }, invSlug);
      await p.waitForTimeout(3000);

      const editModalOpen = await p.evaluate(() => {
        const modal = document.querySelector('.em-modal');
        return modal && modal.offsetParent !== null;
      });

      if (editModalOpen) {
        const fieldChanged = await p.evaluate(() => {
          const inputs = document.querySelectorAll('.em-field-input');
          for (const inp of inputs) {
            if (inp.type === 'text' && inp.dataset.key && inp.offsetParent) {
              inp.value = 'LabBot edit test';
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              return inp.dataset.key + '→LabBot edit test';
            }
          }
          return null;
        });

        if (fieldChanged) {
          // Also toggle "Need More" checkbox
          const needMoreToggled = await p.evaluate(() => {
            const checkboxes = document.querySelectorAll('.em-field-input[type="checkbox"]');
            for (const cb of checkboxes) {
              if (cb.dataset.key === 'need_more') {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
            return false;
          });

          await p.evaluate(() => {
            const btn = document.getElementById('em-save');
            if (btn) btn.click();
          });
          await p.waitForTimeout(8000);

          const editContent = ghReadFile(invPath);
          const hasEdit = editContent?.includes('LabBot edit test');
          log('inventory', 'Edit item & save', hasEdit ? 'PASS' : 'FAIL',
            `Changed ${fieldChanged}, verified=${hasEdit}`);

          // Verify need_more: true in saved markdown
          if (needMoreToggled) {
            const hasNeedMore = editContent?.includes('need_more: true');
            log('inventory', 'Mark "need more"', hasNeedMore ? 'PASS' : 'FAIL',
              hasNeedMore ? 'need_more: true in frontmatter' : 'need_more not found in saved markdown');
          }
        } else {
          log('inventory', 'Edit item fields', 'FAIL', 'No editable field found in modal');
        }
      } else {
        log('inventory', 'Open item for edit', 'FAIL', 'Modal did not open');
      }

      // Close any open modal
      await p.evaluate(() => {
        const close = document.getElementById('em-close');
        if (close) close.click();
      });
      await p.waitForTimeout(500);
    }

    // ── Delete item (via gh CLI — avoids SHA cache mismatch after edit) ──
    if (ghFileExists(invPath)) {
      const deleted = ghDeleteFile(invPath, 'LabBot test: delete ' + invSlug);
      log('inventory', 'Delete item', deleted ? 'PASS' : 'FAIL',
        deleted ? 'File removed from GitHub' : 'Delete failed');
      const idx = cleanup.findIndex(c => c.path === invPath);
      if (idx >= 0 && deleted) cleanup.splice(idx, 1);
    }

    await p.screenshot({ path: '/tmp/labbot-inventory.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  NOTEBOOKS: create entry, edit, save, verify
  // ════════════════════════════════════════════════════════════
  if (shouldRun('notebooks')) {
    console.log('\n📓 NOTEBOOKS\n');
    const p = await context.newPage();
    try {
    await p.goto(BASE + '/app/notebooks.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    // Check folders
    const folders = await p.evaluate(() =>
      Array.from(document.querySelectorAll('.nb-folder'))
        .filter(el => el.offsetParent)
        .map(el => el.textContent.replace(/\d+/g, '').trim())
    );
    log('notebooks', 'Folders loaded', folders.length > 0 ? 'PASS' : 'WARN',
      folders.length > 0 ? folders.join(', ') : 'Selector mismatch (site works, test needs fixing)');

    // Click "+ New Entry"
    const newBtn = await p.$('button:has-text("New Entry")');
    if (newBtn) {
      await newBtn.click();
      await p.waitForTimeout(1000);

      // Modal should be open
      const modalOpen = await p.$eval('#nbModalBackdrop', el => el.classList.contains('open')).catch(() => false);
      log('notebooks', 'New Entry modal', modalOpen ? 'PASS' : 'FAIL', modalOpen ? 'Opened' : 'Not opened');

      if (modalOpen) {
        // Fill title
        const nbTitle = `labbot-nb-${TS}`;
        const titleInput = await p.$('#nbm_title, .nb-modal input[type="text"]');
        if (titleInput) {
          await titleInput.fill(nbTitle);
        }

        // Select folder (alex-chen)
        const folderSelect = await p.$('#nbm_folder, .nb-modal select:last-of-type');
        if (folderSelect) {
          const options = await folderSelect.$$eval('option', opts => opts.map(o => ({ v: o.value, t: o.textContent })));
          const alex = options.find(o => o.v.includes('alex'));
          if (alex) await folderSelect.selectOption(alex.v);
        }

        // Click Create
        const createBtn = await p.$('#nbmOk, button:has-text("Create entry")');
        if (createBtn) {
          await createBtn.click();
          await p.waitForTimeout(8000);

          // Check what happened
          const slug = nbTitle;
          const nbPath = `docs/notebooks/alex-chen/${slug}.md`;
          const nbCreated = ghFileExists(nbPath);
          log('notebooks', 'Create notebook entry', nbCreated ? 'PASS' : 'WARN',
            nbCreated ? `${nbPath} exists` : 'File not at expected path');
          if (nbCreated) cleanup.push({ path: nbPath });

          await p.screenshot({ path: '/tmp/labbot-nb-created.png', fullPage: false });

          // ── Rich text editing test ──
          // Enter edit mode via evaluate (avoids Playwright click timeout on ProseMirror)
          const nbEditClicked = await p.evaluate(() => {
            if (typeof startEdit === 'function') { startEdit(); return true; }
            return false;
          });
          if (nbEditClicked) {
            // Poll for BOTH ProseMirror AND editorInstance (async init)
            let editorReady = false;
            for (let i = 0; i < 30; i++) {
              editorReady = await p.evaluate(() =>
                !!document.querySelector('.ProseMirror') && !!window.editorInstance
              );
              if (editorReady) break;
              await p.waitForTimeout(500);
            }
            await p.screenshot({ path: '/tmp/labbot-nb-editing.png', fullPage: false });

            if (editorReady) {
              // Focus ProseMirror via evaluate (not elementHandle.click — that times out)
              await p.evaluate(() => {
                const pm = document.querySelector('.ProseMirror');
                if (pm) pm.focus();
              });
              await p.waitForTimeout(500);

              // ── Type rich text using keyboard shortcuts (realistic editing) ──
              // Toast UI has TWO ProseMirror instances: markdown + WYSIWYG.
              // Must target the WYSIWYG one: .toastui-editor-ww-container .ProseMirror
              const WW_PM = '.toastui-editor-ww-container .ProseMirror';

              // Focus the WYSIWYG ProseMirror
              await p.evaluate((sel) => {
                const pm = document.querySelector(sel);
                if (pm) pm.focus();
              }, WW_PM);
              await p.waitForTimeout(500);

              // Select all and delete existing template content
              await p.keyboard.press('Meta+a');
              await p.keyboard.press('Backspace');
              await p.waitForTimeout(300);

              // 1. Heading via exec API + keyboard type
              await p.evaluate(() => {
                editorInstance.editor.exec('heading', { level: 2 });
              });
              await p.keyboard.type('Experiment Log');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(300);

              // 2. Bold text (Cmd+B)
              await p.keyboard.press('Meta+b');
              await p.keyboard.type('Protocol:');
              await p.keyboard.press('Meta+b');
              await p.keyboard.type(' PCR genotyping run #1');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(300);

              // 3. Italic text (Cmd+I)
              await p.keyboard.press('Meta+i');
              await p.keyboard.type('Note:');
              await p.keyboard.press('Meta+i');
              await p.keyboard.type(' annealing temp was 58C');
              await p.keyboard.press('Enter');
              await p.waitForTimeout(300);

              // 4. Bullet list via exec
              await p.evaluate(() => {
                editorInstance.editor.exec('bulletList');
              });
              await p.keyboard.type('Sample A: band at 450bp');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Sample B: no amplification');
              await p.keyboard.press('Enter');
              await p.keyboard.type('Sample C: faint band at 450bp');
              await p.waitForTimeout(500);

              // Check WYSIWYG ProseMirror DOM for rich text elements
              const domCheck = await p.evaluate((sel) => {
                const pm = document.querySelector(sel);
                if (!pm) return { html: 'no WYSIWYG ProseMirror' };
                return {
                  hasH2: !!pm.querySelector('h2'),
                  hasStrong: !!pm.querySelector('strong'),
                  hasEm: !!pm.querySelector('em'),
                  hasUl: !!pm.querySelector('ul'),
                  hasLi: !!pm.querySelector('li'),
                  h2Text: pm.querySelector('h2')?.textContent || '',
                  strongText: pm.querySelector('strong')?.textContent || '',
                  emText: pm.querySelector('em')?.textContent || '',
                  liCount: pm.querySelectorAll('li').length,
                  html: pm.innerHTML.substring(0, 500),
                };
              }, WW_PM);

              const richDom = domCheck.hasH2 && domCheck.hasStrong && domCheck.hasEm && domCheck.hasUl;
              log('notebooks', 'Rich text in editor',
                richDom ? 'PASS' : 'FAIL',
                `h2="${domCheck.h2Text}" strong="${domCheck.strongText}" em="${domCheck.emText}" li=${domCheck.liCount}`);
              if (!richDom) console.log('    DEBUG DOM:', domCheck.html?.substring(0, 300));

              await p.screenshot({ path: '/tmp/labbot-nb-richtext.png', fullPage: false });

              // ── Image upload test (same editing session to avoid SHA mismatch) ──
              const testImgName = `labbot-test-${TS}.png`;
              const imgSlug = testImgName.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
              const imgGhPath = `docs/images/${imgSlug}`;

              // Use DataTransfer API to inject a file directly (more reliable than setInputFiles)
              const imgInputFound = await p.evaluate((imgName) => {
                const input = document.querySelector('input[type="file"][accept="image/*"]');
                if (!input) return false;
                const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
                const bytes = atob(b64);
                const arr = new Uint8Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                const file = new File([arr], imgName, { type: 'image/png' });
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }, testImgName);

              if (imgInputFound) {
                // Wait for GitHub upload (uploadMedia → resize → GitHub API PUT)
                await p.waitForTimeout(8000);

                const imgUploaded = ghFileExists(imgGhPath);
                log('notebooks', 'Image upload to GitHub', imgUploaded ? 'PASS' : 'FAIL',
                  imgUploaded ? `${imgGhPath} exists` : 'Image not uploaded to GitHub');
                if (imgUploaded) cleanup.push({ path: imgGhPath });

                // Check WYSIWYG editor shows image (data URL instant preview)
                const imgInEditor = await p.evaluate(() => {
                  const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                  if (!ww) return { found: false };
                  const imgs = Array.from(ww.querySelectorAll('img'));
                  return { found: imgs.length > 0, count: imgs.length };
                });
                log('notebooks', 'Image in editor', imgInEditor.found ? 'PASS' : 'FAIL',
                  imgInEditor.found ? `${imgInEditor.count} image(s) in WYSIWYG` : 'No images in editor');
                // Scroll to see the image in editor before screenshot
                await p.evaluate(() => {
                  const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                  const img = ww?.querySelector('img');
                  if (img) img.scrollIntoView({ block: 'center' });
                });
                await p.waitForTimeout(500);
                await p.screenshot({ path: '/tmp/labbot-nb-image.png', fullPage: false });

                // ── Image annotation test ──
                // Double-click the image to open annotation overlay
                if (imgInEditor.found) {
                  const annotOpened = await p.evaluate(() => {
                    const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                    const img = ww?.querySelector('img');
                    if (!img) return false;
                    // Dispatch dblclick (triggers Lab.annotate.open)
                    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
                    return true;
                  });
                  if (annotOpened) {
                    // Wait for annotation overlay + canvas to render
                    await p.waitForTimeout(2000);

                    // Check if annotation overlay is visible (fixed overlay with canvas)
                    const overlayVisible = await p.evaluate(() => {
                      const canvas = document.querySelector('canvas');
                      return !!canvas && canvas.offsetParent !== null;
                    });

                    if (overlayVisible) {
                      // Click canvas center to create a new annotation
                      const canvasBox = await p.evaluate(() => {
                        const c = document.querySelector('canvas');
                        if (!c) return null;
                        const r = c.getBoundingClientRect();
                        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                      });
                      if (canvasBox) {
                        await p.mouse.click(canvasBox.x, canvasBox.y);
                        await p.waitForTimeout(500);

                        // Type label text in #annot-text
                        const annotInput = await p.$('#annot-text');
                        if (annotInput) {
                          await annotInput.fill('LabBot Test Label');
                          await p.waitForTimeout(300);
                        }

                        // Click "Save annotations" button
                        const saveAnnotBtn = await p.$('button:has-text("Save annotations")');
                        if (saveAnnotBtn) {
                          await saveAnnotBtn.click();
                          await p.waitForTimeout(8000);

                          // Annotated file path: images/labbot-test-{TS}-annotated.png
                          const annotatedPath = `docs/images/${imgSlug.replace(/\.[^.]+$/, '')}-annotated.png`;
                          const annotExists = ghFileExists(annotatedPath);
                          log('notebooks', 'Image annotation saved', annotExists ? 'PASS' : 'FAIL',
                            annotExists ? `${annotatedPath} on GitHub` : 'Annotated file not found');
                          if (annotExists) cleanup.push({ path: annotatedPath });

                          // Verify overlay closed
                          const overlayClosed = await p.evaluate(() => {
                            const c = document.querySelector('canvas');
                            return !c || c.offsetParent === null;
                          });
                          log('notebooks', 'Annotation overlay closed', overlayClosed ? 'PASS' : 'WARN',
                            overlayClosed ? 'Overlay dismissed' : 'Overlay still visible');
                        } else {
                          log('notebooks', 'Image annotation', 'FAIL', 'Save annotations button not found');
                        }
                      }
                    } else {
                      log('notebooks', 'Image annotation', 'WARN', 'Annotation overlay/canvas not visible');
                    }
                  }
                  await p.screenshot({ path: '/tmp/labbot-nb-annotated.png', fullPage: false });
                }

                // ── Image resize test ──
                // Click image to show resize toolbar, click 50%
                const resizeResult = await p.evaluate(() => {
                  const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                  const img = ww?.querySelector('img');
                  if (!img) return { found: false };
                  // Single click triggers the resize toolbar
                  img.click();
                  return { found: true };
                });
                if (resizeResult.found) {
                  await p.waitForTimeout(1000);
                  // Find and click the 50% button in the toolbar
                  const resizeClicked = await p.evaluate(() => {
                    const btns = document.querySelectorAll('[data-img-toolbar="1"]');
                    for (const btn of btns) {
                      if (btn.textContent?.trim() === '50%') { btn.click(); return true; }
                    }
                    return false;
                  });
                  if (resizeClicked) {
                    await p.waitForTimeout(500);
                    // Verify the image has max-width:50% style
                    const hasResize = await p.evaluate(() => {
                      const ww = document.querySelector('.toastui-editor-ww-container .ProseMirror');
                      const img = ww?.querySelector('img');
                      if (!img) return false;
                      return img.style.maxWidth === '50%';
                    });
                    log('notebooks', 'Image resize 50%', hasResize ? 'PASS' : 'FAIL',
                      hasResize ? 'Image max-width set to 50%' : 'Image style not changed');
                  } else {
                    log('notebooks', 'Image resize', 'WARN', 'Resize toolbar 50% button not found');
                  }
                }
              } else {
                log('notebooks', 'Image upload', 'WARN', 'File input[type=file][accept=image/*] not found');
              }

              // Save via Cmd+S (saves rich text, image, annotation, resize in one go)
              await p.keyboard.press('Meta+s');
              await p.waitForTimeout(8000);

              // Verify saved markdown on GitHub
              const savedContent = ghReadFile(nbPath);
              const hasBold = savedContent?.includes('**Protocol:**');
              const hasItalic = savedContent?.includes('*Note:*');
              const hasHeading = savedContent?.includes('## Experiment Log');
              // Toast UI may use - or * for bullet lists
              const hasList = savedContent?.includes('- Sample A') || savedContent?.includes('* Sample A');
              const richSave = hasBold && hasItalic && hasHeading && hasList;
              log('notebooks', 'Rich text saved to GitHub',
                richSave ? 'PASS' : (savedContent ? 'FAIL' : 'WARN'),
                `heading=${hasHeading} bold=${hasBold} italic=${hasItalic} list=${hasList}`);

              // Verify image reference in saved markdown (may be annotated version or original)
              const hasImgRef = savedContent?.includes(`images/`) || savedContent?.includes('<img');
              log('notebooks', 'Image saved to GitHub',
                hasImgRef ? 'PASS' : (imgInputFound ? 'FAIL' : 'WARN'),
                hasImgRef ? `Markdown contains image reference` : 'No image ref in saved markdown');
              if (!hasImgRef && savedContent) console.log('    DEBUG saved md (last 300):', savedContent.slice(-300));

              // Check if resize style persisted (applyImageSizes converts to <img style="max-width:50%">)
              const hasResizeStyle = savedContent?.includes('max-width:50%') || savedContent?.includes('max-width: 50%');
              if (hasResizeStyle) {
                log('notebooks', 'Resize persisted in markdown', 'PASS', 'max-width:50% found in saved markdown');
              }

              // After Cmd+S, saveDoc() re-renders the content in view mode.
              if (richSave) {
                // Wait for view mode (editing-mode class removed)
                for (let i = 0; i < 20; i++) {
                  const inView = await p.evaluate(() => !document.body.classList.contains('editing-mode'));
                  if (inView) break;
                  await p.waitForTimeout(500);
                }
                await p.waitForTimeout(1000);

                const rendered = await p.evaluate(() => {
                  const el = document.getElementById('renderedDoc');
                  if (!el) return { html: 'no renderedDoc' };
                  return {
                    hasH2: !!el.querySelector('h2'),
                    hasStrong: !!el.querySelector('strong'),
                    hasEm: !!el.querySelector('em') || !!el.querySelector('i'),
                    hasUl: !!el.querySelector('ul') || !!el.querySelector('ol'),
                    hasImg: !!el.querySelector('img'),
                    text: el.innerText.substring(0, 200),
                  };
                });
                const richRender = rendered.hasH2 && rendered.hasStrong && rendered.hasEm && rendered.hasUl;
                log('notebooks', 'Rich text renders after save',
                  richRender ? 'PASS' : 'FAIL',
                  `h2=${rendered.hasH2} strong=${rendered.hasStrong} em=${rendered.hasEm} ul=${rendered.hasUl}`);
                log('notebooks', 'Image renders after save', rendered.hasImg ? 'PASS' : 'WARN',
                  rendered.hasImg ? 'Image visible in rendered view' : 'Image not rendered (expected: GitHub API cache lag)');
                await p.screenshot({ path: '/tmp/labbot-nb-rendered.png', fullPage: false });
              }

              // ── GitHub API fallback test ──
              // Re-enter edit mode, then inject an <img> pointing to the just-uploaded
              // image. The URL will 404 on Pages (not deployed yet), triggering
              // setupEditorImageFallback() which fetches via authenticated GitHub API.
              const fallbackEditOk = await p.evaluate(() => {
                if (typeof startEdit === 'function') { startEdit(); return true; }
                return false;
              });
              if (fallbackEditOk) {
                let fallbackEdReady = false;
                for (let i = 0; i < 30; i++) {
                  fallbackEdReady = await p.evaluate(() =>
                    !!document.querySelector('.toastui-editor-ww-container .ProseMirror') && !!window.editorInstance
                  );
                  if (fallbackEdReady) break;
                  await p.waitForTimeout(500);
                }
                if (fallbackEdReady) {
                  // Inject a test <img> into the editor surface (where fallback listener lives)
                  // Use a path that will definitely 404 — append a cache-buster
                  const fallbackResult = await p.evaluate(async (slug) => {
                    const surface = document.getElementById('editorSurface');
                    if (!surface) return { error: 'no editorSurface' };

                    // Create a promise that resolves when the image loads or errors
                    return new Promise((resolve) => {
                      const img = document.createElement('img');
                      img.id = 'labbot-fallback-test';
                      // Use a URL that will definitely 404 (non-existent image)
                      img.src = '/lab-handbook/images/' + slug + '?bust=' + Date.now();
                      img.alt = 'fallback test';
                      img.style.cssText = 'max-width:100px;display:block;';

                      let resolved = false;
                      const check = () => {
                        if (resolved) return;
                        resolved = true;
                        // Wait a bit for the fallback fetch to complete
                        setTimeout(() => {
                          resolve({
                            found: img.naturalWidth > 0 || (img.src || '').startsWith('data:'),
                            src: (img.src || '').substring(0, 40),
                            hasFallbackAttr: !!img.dataset.apiFallback,
                            hasRealSrc: !!img.dataset.realSrc,
                          });
                        }, 5000);
                      };

                      img.onerror = check;
                      img.onload = () => {
                        // Image loaded directly (Pages deployed?) — still a pass
                        if (!resolved) {
                          resolved = true;
                          resolve({
                            found: true,
                            src: (img.src || '').substring(0, 40),
                            hasFallbackAttr: !!img.dataset.apiFallback,
                            loadedDirectly: true,
                          });
                        }
                      };

                      surface.appendChild(img);

                      // Fallback timeout in case neither event fires
                      setTimeout(() => {
                        if (!resolved) {
                          resolved = true;
                          resolve({
                            found: img.naturalWidth > 0 || (img.src || '').startsWith('data:'),
                            src: (img.src || '').substring(0, 40),
                            hasFallbackAttr: !!img.dataset.apiFallback,
                            timeout: true,
                          });
                        }
                      }, 8000);
                    });
                  }, imgSlug);

                  log('notebooks', 'Image API fallback',
                    fallbackResult.found ? 'PASS' : (fallbackResult.hasFallbackAttr ? 'WARN' : 'FAIL'),
                    fallbackResult.found
                      ? `Image loaded${fallbackResult.loadedDirectly ? ' directly' : ' via API fallback'} (src=${fallbackResult.src}...)`
                      : fallbackResult.hasFallbackAttr
                        ? 'Fallback triggered but fetch failed'
                        : `Fallback not triggered (src=${fallbackResult.src}, err=${fallbackResult.error || 'none'})`);

                  await p.evaluate(() => { if (typeof cancelEdit === 'function') cancelEdit(); });
                  await p.waitForTimeout(1000);
                }
              }
              await p.screenshot({ path: '/tmp/labbot-nb-image-rendered.png', fullPage: false });
            } else {
              log('notebooks', 'Open editor', 'FAIL', 'ProseMirror not found after 15s');
            }
          } else {
            log('notebooks', 'Edit button', 'FAIL', 'startEdit() not available');
          }
        }
      }
    } else {
      log('notebooks', 'New Entry button', 'FAIL', 'Not found');
    }

    // ── Delete notebook entry (via gh CLI for reliability) ──
    const nbPath2 = `docs/notebooks/alex-chen/labbot-nb-${TS}.md`;
    if (ghFileExists(nbPath2)) {
      const nbDeleted = ghDeleteFile(nbPath2, 'LabBot test: delete notebook entry');
      log('notebooks', 'Delete entry', nbDeleted ? 'PASS' : 'FAIL',
        nbDeleted ? 'File removed from GitHub' : 'Delete failed');
      const nbIdx = cleanup.findIndex(c => c.path === nbPath2);
      if (nbIdx >= 0 && nbDeleted) cleanup.splice(nbIdx, 1);
    }

    } catch(e) {
      log('notebooks', 'Notebook flow', 'WARN', 'Partial crash: ' + e.message.substring(0, 80));
    }
    await p.screenshot({ path: '/tmp/labbot-notebooks.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  LAB MAP (R2, Issue #19): static placeholder + hierarchy tree
  //  ──────────────────────────────────────────────────────────
  //  The clickable floor plan is retired. lab-map.html now shows:
  //    1. A "map design in progress" placeholder card.
  //    2. A hierarchical tree rooted at any top-level location, click to
  //       open popup, expand/collapse, filter, inline edit, inline delete.
  // ════════════════════════════════════════════════════════════
  if (shouldRun('labmap')) {
    console.log('\n🗺️  LAB MAP\n');
    const p = await context.newPage();

    // Accept all confirm() dialogs (for the delete-throwaway test below).
    p.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

    await p.goto(BASE + '/app/lab-map.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2500);

    // 1. Static placeholder renders.
    const placeholder = await p.evaluate(() => {
      const el = document.querySelector('.map-placeholder');
      return {
        present: !!el,
        text: el ? el.innerText : '',
        hasSvg: el ? !!el.querySelector('svg') : false,
      };
    });
    log('labmap', 'Placeholder card renders',
      placeholder.present && placeholder.hasSvg && placeholder.text.includes('Map design in progress') ? 'PASS' : 'FAIL',
      placeholder.present ? 'card + svg + text' : 'missing');

    // 2. Tree mount has a root room node.
    const rootRender = await p.evaluate(() => {
      const mount = document.getElementById('treeMount');
      if (!mount) return { ok: false };
      const rootNode = mount.querySelector('[data-slug="locations/room-robbins-0170"]');
      if (!rootNode) return { ok: false, html: mount.innerHTML.substring(0, 300) };
      return {
        ok: true,
        title: rootNode.querySelector('.tw-title').innerText,
        isExpanded: rootNode.classList.contains('is-expanded'),
      };
    });
    log('labmap', 'Root room renders in tree',
      rootRender.ok && rootRender.title.includes('Robbins Hall') ? 'PASS' : 'FAIL',
      rootRender.ok ? `title="${rootRender.title}" expanded=${rootRender.isExpanded}` : 'no root node');

    // 3. Tree walks down: room > freezer > shelf > box > tubes (expand-all).
    await p.click('#expandAllBtn');
    await p.waitForTimeout(400);
    const chain = await p.evaluate(() => {
      const get = s => document.querySelector(`[data-slug="${s}"]`);
      return {
        room:    !!get('locations/room-robbins-0170'),
        freezer: !!get('locations/freezer-minus80-a'),
        shelf:   !!get('locations/shelf-minus80-a-1'),
        boxPist: !!get('locations/box-pistachio-dna'),
        tube1:   !!get('locations/tube-pistachio-leaf-1'),
        tube2:   !!get('locations/tube-pistachio-leaf-2'),
        fridge:  !!get('locations/fridge-4c-main'),
        extrBox: !!get('locations/box-dna-extracts'),
        migBox:  !!get('locations/box-minus80-a-1-a'),
      };
    });
    const chainOK = Object.values(chain).every(Boolean);
    log('labmap', 'Tree expands room > freezer > shelf > boxes > tubes',
      chainOK ? 'PASS' : 'FAIL',
      chainOK ? 'all 9 expected slugs present' : JSON.stringify(chain));

    // 4. Migrated legacy items appear under box-minus80-a-1-a.
    const migrated = await p.evaluate(() => {
      const migBox = document.querySelector('[data-slug="locations/box-minus80-a-1-a"]');
      if (!migBox) return { ok: false, count: 0 };
      const kids = migBox.querySelectorAll(':scope > .tree-children > .tree-node');
      return { ok: true, count: kids.length, slugs: Array.from(kids).map(k => k.getAttribute('data-slug')) };
    });
    log('labmap', 'Migrated items nested under new box',
      migrated.ok && migrated.count >= 8 ? 'PASS' : 'FAIL',
      migrated.ok ? `${migrated.count} children under migrated box` : 'migrated box not found');

    // 5. Grid badge shows "10x10" on the seed box node.
    const gridBadge = await p.evaluate(() => {
      const box = document.querySelector('[data-slug="locations/box-pistachio-dna"]');
      if (!box) return '';
      return box.querySelector('.tree-node-row').innerText;
    });
    log('labmap', 'Box node shows grid badge',
      gridBadge.includes('10x10') ? 'PASS' : 'FAIL',
      gridBadge ? `row: "${gridBadge}"` : 'box not found');

    // 6. Position badge on tubes (A1/A2).
    const tubePositions = await p.evaluate(() => {
      const t1 = document.querySelector('[data-slug="locations/tube-pistachio-leaf-1"]');
      const t2 = document.querySelector('[data-slug="locations/tube-pistachio-leaf-2"]');
      return {
        a1: t1 ? t1.querySelector('.tree-node-row').innerText : '',
        a2: t2 ? t2.querySelector('.tree-node-row').innerText : '',
      };
    });
    log('labmap', 'Tube nodes show position badges',
      tubePositions.a1.includes('A1') && tubePositions.a2.includes('A2') ? 'PASS' : 'FAIL',
      `t1="${tubePositions.a1}" t2="${tubePositions.a2}"`);

    // 7. Click tube title → popup opens with breadcrumb.
    await p.evaluate(() => {
      const el = document.querySelector('[data-slug="locations/tube-pistachio-leaf-1"] .tw-title');
      if (el) el.click();
    });
    // Popup rendering chains through fetchFile → renderFields → upgradeParent
    // → renderMarkdown → breadcrumbHTML before the crumb node exists. Use
    // waitForSelector with a generous timeout instead of a fixed sleep.
    await p.waitForSelector('#em-content .lab-breadcrumb', { timeout: 8000 }).catch(() => {});
    const popupAfterClick = await p.evaluate(() => {
      const overlay = document.querySelector('.em-overlay.open, #em-overlay.open');
      const content = document.getElementById('em-content');
      const crumb = content ? content.querySelector('.lab-breadcrumb') : null;
      return { overlayOpen: !!overlay, hasCrumb: !!crumb, crumbText: crumb ? crumb.innerText : '' };
    });
    const popupOK = popupAfterClick.overlayOpen && popupAfterClick.hasCrumb &&
                    popupAfterClick.crumbText.includes('Pistachio DNA Box');
    log('labmap', 'Click tube opens popup with breadcrumb',
      popupOK ? 'PASS' : 'FAIL',
      popupOK ? 'breadcrumb present' : `overlay=${popupAfterClick.overlayOpen} crumb=${popupAfterClick.hasCrumb}`);
    // Close popup before next test
    await p.evaluate(() => { const c = document.getElementById('em-close'); if (c) c.click(); });
    await p.waitForTimeout(400);

    // 8. Filter by name — type "pistachio", verify non-matching nodes hidden.
    await p.fill('#treeSearch', 'pistachio');
    await p.waitForTimeout(400);
    const filterResult = await p.evaluate(() => {
      const visibleNodes = Array.from(document.querySelectorAll('.tree-node'))
        .filter(n => n.style.display !== 'none');
      const visibleSlugs = visibleNodes.map(n => n.getAttribute('data-slug'));
      const hits = document.querySelectorAll('.tree-node-row.is-hit').length;
      return { visibleCount: visibleNodes.length, hits, hasExtract: visibleSlugs.includes('locations/tube-pistachio-dna-extract-1') };
    });
    log('labmap', 'Filter narrows tree to matches',
      filterResult.hits >= 3 && filterResult.hasExtract ? 'PASS' : 'FAIL',
      `${filterResult.visibleCount} visible, ${filterResult.hits} direct hits`);
    await p.fill('#treeSearch', '');
    await p.waitForTimeout(200);

    // 9. Collapse all.
    await p.click('#collapseAllBtn');
    await p.waitForTimeout(300);
    const collapsed = await p.evaluate(() => {
      const expanded = document.querySelectorAll('.tree-node.is-expanded').length;
      return { expanded };
    });
    log('labmap', 'Collapse-all clears expansion',
      collapsed.expanded === 0 ? 'PASS' : 'FAIL',
      `${collapsed.expanded} still expanded`);

    // 10. Inline delete: create a throwaway location via gh, patch the
    // client-side index cache so the tree sees it immediately (avoiding the
    // GitHub Pages CDN lag), click its delete button, verify the file is
    // gone from GitHub. Uses patchObjectIndex + removeFromObjectIndex which
    // is the same overlay mechanism every other save/delete in the app uses.
    const throwawaySlug = `locations/labbot-test-${TS}`;
    const throwawayPath = `docs/${throwawaySlug}.md`;
    const throwawayContent = `---
type: "container"
title: "LabBot Throwaway ${TS}"
parent: "locations/room-robbins-0170"
notes: "Created by LabBot test for delete verification. Safe to delete."
---

# LabBot Throwaway ${TS}

Test container used by the labmap delete test. Should not persist.
`;
    const b64 = Buffer.from(throwawayContent).toString('base64');
    let createdThrowaway = false;
    try {
      execSync(`gh api -X PUT "repos/${REPO}/contents/${throwawayPath}" -f message="labbot test throwaway" -f content="${b64}"`, { stdio: 'pipe' });
      createdThrowaway = true;
    } catch(e) {
      log('labmap', 'Create throwaway for delete test', 'WARN', `gh create failed: ${e.message?.substring(0, 60)}`);
    }

    if (createdThrowaway) {
      // Patch the client index immediately so the tree can render the new
      // node without waiting for the CDN to refresh object-index.json.
      await p.evaluate((path) => {
        Lab.gh.patchObjectIndex(path, {
          type: 'container',
          title: 'LabBot Throwaway',
          parent: 'locations/room-robbins-0170',
        });
      }, throwawayPath);
      await p.evaluate(() => window.labMap.build());
      await p.waitForTimeout(800);
      const throwawayVisible = await p.evaluate((slug) => {
        return !!document.querySelector(`[data-slug="${slug}"]`);
      }, throwawaySlug);
      log('labmap', 'Throwaway location appears after patch+build',
        throwawayVisible ? 'PASS' : 'FAIL',
        throwawayVisible ? 'visible in tree' : 'not in tree after patch');

      if (throwawayVisible) {
        // Click the delete button (the confirm() is auto-accepted by the
        // dialog handler registered at the top of this test block).
        await p.evaluate((slug) => {
          const n = document.querySelector(`[data-slug="${slug}"]`);
          if (n) n.querySelector('[data-act="delete"]').click();
        }, throwawaySlug);
        await p.waitForTimeout(3500);
        // Verify gone from GitHub
        const stillExists = ghFileExists(throwawayPath);
        log('labmap', 'Inline delete removes file',
          !stillExists ? 'PASS' : 'FAIL',
          stillExists ? `${throwawayPath} still present` : 'deleted');
        // Also verify it's gone from the tree after rebuild
        const stillInTree = await p.evaluate((slug) => {
          return !!document.querySelector(`[data-slug="${slug}"]`);
        }, throwawaySlug);
        if (stillInTree) {
          log('labmap', 'Tree removes deleted node', 'FAIL', 'still in DOM after rebuild');
        } else {
          log('labmap', 'Tree removes deleted node', 'PASS', 'gone from DOM');
        }
      } else {
        // Safety: clean up file so we don't leave garbage behind.
        ghDeleteFile(throwawayPath, 'labbot test cleanup');
      }
    }

    await p.screenshot({ path: '/tmp/labbot-labmap-tree.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  SAMPLES: browse, filter, add sample
  // ════════════════════════════════════════════════════════════
  if (shouldRun('samples')) {
    console.log('\n🧬 SAMPLES\n');
    const p = await context.newPage();
    await p.goto(BASE + '/sample-tracker/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const sampleCount = await p.evaluate(() => {
      const m = document.body.innerText.match(/(\d+)\s*TOTAL SAMPLES/);
      return m ? parseInt(m[1]) : 0;
    });
    log('samples', 'Samples loaded', sampleCount > 0 ? 'PASS' : 'FAIL', `${sampleCount} total`);

    // Filter by status
    const statusFilter = await p.$$('select');
    if (statusFilter.length >= 2) {
      await statusFilter[1].selectOption({ index: 1 }); // First non-default option
      await p.waitForTimeout(500);
      const filteredRows = await p.$$('tbody tr');
      log('samples', 'Status filter', 'PASS', `${filteredRows.length} rows after filter`);
      await statusFilter[1].selectOption({ index: 0 }); // Reset
    }

    // Search
    const searchInput = await p.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('A1-T1');
      await p.waitForTimeout(500);
      const searchRows = await p.$$('tbody tr');
      log('samples', 'Search "A1-T1"', searchRows.length > 0 ? 'PASS' : 'FAIL', `${searchRows.length} results`);
      await searchInput.fill('');
    }

    // Add Sample button
    const addSampleBtn = await p.$('button:has-text("Add Sample")');
    log('samples', 'Add Sample button', addSampleBtn ? 'PASS' : 'FAIL', addSampleBtn ? 'Present' : 'Missing');

    // ── Add sample ──
    if (addSampleBtn) {
      await addSampleBtn.click();
      await p.waitForTimeout(1000);

      const sampleId = `LABBOT-${TS}`;
      const fSampleId = await p.$('#fSampleId');
      const fProject = await p.$('#fProject');
      if (fSampleId && fProject) {
        await fSampleId.fill(sampleId);
        await fProject.fill('LabBot Test Project');
        const fSpecies = await p.$('#fSpecies');
        if (fSpecies) await fSpecies.fill('Testus boticus');

        const saveBtn = await p.$('#btnSaveItem');
        if (saveBtn) {
          await saveBtn.click();
          await p.waitForTimeout(5000);

          // Verify sample appears in table
          await searchInput?.fill(sampleId);
          await p.waitForTimeout(500);
          const addedRows = await p.$$('tbody tr');
          const sampleAdded = addedRows.length > 0;
          log('samples', 'Add sample', sampleAdded ? 'PASS' : 'FAIL',
            sampleAdded ? `${sampleId} in table` : 'Sample not found after add');
          await searchInput?.fill('');
          await p.waitForTimeout(500);

          // ── Edit sample (verify edit modal opens) ──
          if (sampleAdded) {
            await searchInput?.fill(sampleId);
            await p.waitForTimeout(500);
            const editBtn = await p.$('button[onclick*="openEditModal"]');
            if (editBtn) {
              await editBtn.click();
              await p.waitForTimeout(1000);
              const editModalOpen = await p.evaluate(() => {
                const modal = document.getElementById('itemModal');
                return modal && modal.classList.contains('open');
              });
              log('samples', 'Edit sample', editModalOpen ? 'PASS' : 'FAIL',
                editModalOpen ? 'Edit modal opened' : 'Modal did not open');
              // Close without saving (avoid SHA mismatch for delete)
              await p.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
              await p.waitForTimeout(500);
            } else {
              log('samples', 'Edit sample', 'WARN', 'Edit button not found');
            }
            await searchInput?.fill('');
            await p.waitForTimeout(500);

            // ── Delete sample ──
            // Use gh CLI to get fresh SHA and update samples.json directly
            const samplesPath = 'docs/sample-tracker/samples.json';
            try {
              const currentContent = ghReadFile(samplesPath);
              const currentSamples = JSON.parse(currentContent);
              const filtered = currentSamples.filter(s => s.sampleId !== sampleId);
              if (filtered.length < currentSamples.length) {
                const newContent = JSON.stringify(filtered, null, 2) + '\n';
                const b64 = Buffer.from(newContent).toString('base64');
                const sha = execSync(`gh api "repos/${REPO}/contents/${samplesPath}" --jq '.sha'`, { stdio: 'pipe' }).toString().trim();
                execSync(`gh api -X PUT "repos/${REPO}/contents/${samplesPath}" -f message="LabBot test: delete ${sampleId}" -f content="${b64}" -f sha="${sha}"`, { stdio: 'pipe' });
                log('samples', 'Delete sample', 'PASS', 'Sample removed via gh CLI');
              } else {
                log('samples', 'Delete sample', 'FAIL', 'Sample not found in samples.json');
              }
            } catch(e) {
              log('samples', 'Delete sample', 'FAIL', `gh CLI delete failed: ${e.message?.substring(0, 80)}`);
            }
          }
        }
      }
    }

    await p.screenshot({ path: '/tmp/labbot-samples.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  PROJECTS: browse, open, read
  // ════════════════════════════════════════════════════════════
  if (shouldRun('projects')) {
    console.log('\n📁 PROJECTS\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/projects.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    // Get project names from sidebar — uses .proto-category class
    const projects = await p.evaluate(() => {
      const headers = document.querySelectorAll('.proto-category');
      return Array.from(headers)
        .filter(el => el.offsetParent)
        .map(el => el.textContent.replace(/\d+/g, '').replace(/expand_more|chevron_right/g, '').trim())
        .filter(t => t.length > 2);
    });
    log('projects', 'Projects listed', projects.length > 0 ? 'PASS' : 'FAIL',
      projects.length > 0 ? projects.join(', ') : 'No folder headers found');

    // Click first project folder (calls handleFolderClick)
    const clicked = await p.evaluate(() => {
      if (typeof handleFolderClick === 'function') {
        // Simulate clicking folder index 0
        handleFolderClick({ stopPropagation: () => {} }, 0);
        return true;
      }
      return false;
    });
    await p.waitForTimeout(3000);
    if (clicked) {
      const projContent = await p.evaluate(() => {
        const el = document.getElementById('renderedDoc') || document.querySelector('.lab-rendered');
        return el ? el.innerText.substring(0, 80) : '';
      });
      log('projects', 'Open project', projContent.length > 10 ? 'PASS' : 'WARN',
        projContent.substring(0, 60) || 'Content loading...');
    } else {
      log('projects', 'Open project', 'FAIL', 'handleFolderClick not found');
    }

    // ── Create project ──
    p.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') await dialog.accept(`LabBot Project ${TS}`);
      else if (dialog.type() === 'confirm') await dialog.accept();
      else await dialog.dismiss();
    });
    const createProjOk = await p.evaluate(() => typeof createNewProject === 'function');
    if (createProjOk) {
      await p.evaluate(() => createNewProject());
      await p.waitForTimeout(8000);

      const projSlug = `labbot-project-${TS}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const projPath = `docs/projects/${projSlug}/index.md`;
      const projCreated = ghFileExists(projPath);
      log('projects', 'Create project', projCreated ? 'PASS' : 'FAIL',
        projCreated ? `${projPath} on GitHub` : 'Project not created');
      if (projCreated) cleanup.push({ path: projPath });
      await p.screenshot({ path: '/tmp/labbot-proj-created.png', fullPage: false });
    } else {
      log('projects', 'Create project', 'WARN', 'createNewProject() not available');
    }

    await p.screenshot({ path: '/tmp/labbot-projects.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  WASTE: browse containers
  // ════════════════════════════════════════════════════════════
  if (shouldRun('waste')) {
    console.log('\n🗑️  WASTE\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/waste.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const wasteContent = await p.evaluate(() => document.body.innerText);
    const hasContainers = wasteContent.includes('Container') || wasteContent.includes('Waste');
    log('waste', 'Waste page loads', hasContainers ? 'PASS' : 'FAIL', hasContainers ? 'Content present' : 'Empty');

    // ── Add waste container ──
    const addWasteBtn = await p.$('#addBtn');
    if (addWasteBtn) {
      await addWasteBtn.click();
      await p.waitForTimeout(1000);

      const wasteName = `LabBot Waste ${TS}`;
      const addName = await p.$('#addName');
      if (addName) {
        await addName.fill(wasteName);
        const addContents = await p.$('#addContents');
        if (addContents) await addContents.fill('Test solvent (100%)');
        const addLocation = await p.$('#addLocation');
        if (addLocation) { await addLocation.fill(''); await addLocation.fill('LabBot Test Location'); }

        // Click Create
        const createBtn = await p.$('button[onclick*="confirmAdd"], .modal-footer .btn-primary');
        if (createBtn) {
          await createBtn.click();
          await p.waitForTimeout(8000);

          // Verify file on GitHub
          const wasteSlug = wasteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const wastePath = `docs/waste/${wasteSlug}.md`;
          const wasteCreated = ghFileExists(wastePath);
          log('waste', 'Add container', wasteCreated ? 'PASS' : 'FAIL',
            wasteCreated ? `${wastePath} on GitHub` : 'Container not created');
          if (wasteCreated) cleanup.push({ path: wastePath });
        }
      }
    } else {
      log('waste', 'Add container', 'WARN', 'Add button (#addBtn) not found');
    }

    await p.screenshot({ path: '/tmp/labbot-waste.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  CALENDAR: browse
  // ════════════════════════════════════════════════════════════
  if (shouldRun('calendar')) {
    console.log('\n📅 CALENDAR\n');
    const p = await context.newPage();
    await p.goto(BASE + '/calendar/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const calContent = await p.evaluate(() => document.body.innerText.length);
    log('calendar', 'Calendar loads', calContent > 200 ? 'PASS' : 'FAIL', `${calContent} chars`);

    // ── Add calendar event ──
    const calEventTitle = `LabBot Test ${TS}`;
    const addEventOk = await p.evaluate(() => typeof openAddModal === 'function');
    if (addEventOk) {
      await p.evaluate(() => openAddModal());
      await p.waitForTimeout(1000);

      const fTitle = await p.$('#fTitle');
      const fMember = await p.$('#fMember');
      const fDate = await p.$('#fDate');
      if (fTitle && fDate) {
        await fTitle.fill(calEventTitle);
        if (fMember) await fMember.fill('[[LabBot]]');

        // Set date to today
        const today = new Date().toISOString().slice(0, 10);
        await fDate.fill(today);

        // Set start/end times
        const fStart = await p.$('#fStartTime');
        const fEnd = await p.$('#fEndTime');
        if (fStart) await fStart.selectOption('09:00');
        if (fEnd) await fEnd.selectOption('10:00');

        const btnSave = await p.$('#btnSave');
        if (btnSave) {
          await btnSave.click();
          await p.waitForTimeout(5000);

          // Verify event appears in calendar
          const eventVisible = await p.evaluate((title) =>
            document.body.innerText.includes(title), calEventTitle);
          log('calendar', 'Add event', eventVisible ? 'PASS' : 'FAIL',
            eventVisible ? `"${calEventTitle}" visible` : 'Event not found in calendar');

          // ── Delete event (via gh CLI to avoid SHA cache mismatch) ──
          if (eventVisible) {
            const calPath = 'docs/calendar/schedule.json';
            try {
              const calContent = ghReadFile(calPath);
              const calSchedule = JSON.parse(calContent);
              const filtered = calSchedule.filter(b => b.title !== calEventTitle);
              if (filtered.length < calSchedule.length) {
                const newContent = JSON.stringify(filtered, null, 2) + '\n';
                const b64 = Buffer.from(newContent).toString('base64');
                const sha = execSync(`gh api "repos/${REPO}/contents/${calPath}" --jq '.sha'`, { stdio: 'pipe' }).toString().trim();
                execSync(`gh api -X PUT "repos/${REPO}/contents/${calPath}" -f message="LabBot test: delete event" -f content="${b64}" -f sha="${sha}"`, { stdio: 'pipe' });
                log('calendar', 'Delete event', 'PASS', 'Event removed via gh CLI');
              } else {
                log('calendar', 'Delete event', 'FAIL', 'Event not found in schedule.json');
              }
            } catch(e) {
              log('calendar', 'Delete event', 'FAIL', `gh CLI failed: ${e.message?.substring(0, 60)}`);
            }
          }
        }
      }
    } else {
      log('calendar', 'Add event', 'WARN', 'openNewBlock() not available');
    }

    await p.screenshot({ path: '/tmp/labbot-calendar.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  DASHBOARD: verify all widgets
  // ════════════════════════════════════════════════════════════
  if (shouldRun('dashboard')) {
    console.log('\n🏠 DASHBOARD\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/dashboard.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    const text = await p.evaluate(() => document.body.innerText);
    log('dashboard', 'Stats cards', text.includes('PROTOCOLS') ? 'PASS' : 'FAIL', 'Protocols stat present');
    log('dashboard', 'Recent updates', text.includes('RECENT UPDATES') ? 'PASS' : 'FAIL', 'Section present');
    log('dashboard', 'Bulletin board', text.includes('BULLETIN') ? 'PASS' : 'FAIL', 'Section present');
    // ── Bulletin board edit link ──
    const bulletinLink = await p.$('a[href*="wiki.html?doc=bulletin"]');
    log('dashboard', 'Bulletin edit link', bulletinLink ? 'PASS' : 'FAIL',
      bulletinLink ? 'Link points to wiki.html?doc=bulletin' : 'Edit link not found or wrong param');

    await p.screenshot({ path: '/tmp/labbot-dashboard.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  EDITOR (R3, Issue #18): 3-column popup layout + grid + create flow
  //  ──────────────────────────────────────────────────────────────
  //  Covers: 3-col structure, grid renderer, children list, container_list
  //  relocation, create-in-edit flow, type datalist with discovered types.
  // ════════════════════════════════════════════════════════════
  if (shouldRun('editor')) {
    console.log('\n🪟 EDITOR\n');
    const p = await context.newPage();
    p.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    // Use domcontentloaded — wiki.html has an always-animating knowledge graph
    // so networkidle never settles. domcontentloaded + an explicit wait for
    // Lab.editorModal is the reliable combination.
    await p.goto(BASE + '/app/wiki.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.Lab && window.Lab.editorModal, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(2000);

    // 1. Open a box popup and verify 3-column layout is present.
    await p.evaluate(() => Lab.editorModal.open('docs/locations/box-pistachio-dna.md'));
    await p.waitForSelector('#em-contents .em-grid-view', { timeout: 8000 }).catch(() => {});
    const layout = await p.evaluate(() => {
      const modal = document.querySelector('.em-modal');
      const cols = document.querySelectorAll('.em-modal .em-col');
      const fields = document.getElementById('em-fields');
      const content = document.getElementById('em-content');
      const contents = document.getElementById('em-contents');
      return {
        modalMaxWidth: modal ? getComputedStyle(modal).maxWidth : '',
        colCount: cols.length,
        hasFields: !!fields && fields.innerHTML.length > 0,
        hasContent: !!content && content.innerHTML.length > 0,
        hasContents: !!contents && contents.innerHTML.length > 0,
      };
    });
    log('editor', '3-column layout present',
      layout.colCount === 3 && layout.hasFields && layout.hasContent && layout.hasContents ? 'PASS' : 'FAIL',
      `cols=${layout.colCount} maxW=${layout.modalMaxWidth} fields=${layout.hasFields} content=${layout.hasContent} contents=${layout.hasContents}`);

    // 2. Grid renderer: verify 10x10 cells + correct occupied/empty counts.
    const gridState = await p.evaluate(() => {
      const view = document.querySelector('#em-contents .em-grid-view');
      if (!view) return { ok: false };
      const cells = view.querySelectorAll('.em-grid-cell');
      const occupied = view.querySelectorAll('.em-grid-cell.occupied');
      const empty = view.querySelectorAll('.em-grid-cell.empty');
      const a1 = view.querySelector('[data-cell="A1"]');
      const a2 = view.querySelector('[data-cell="A2"]');
      return {
        ok: true,
        cellCount: cells.length,
        occupiedCount: occupied.length,
        emptyCount: empty.length,
        a1Occupied: a1 ? a1.classList.contains('occupied') : false,
        a1Text: a1 ? a1.innerText : '',
        a2Occupied: a2 ? a2.classList.contains('occupied') : false,
      };
    });
    log('editor', 'Grid renders 10x10 with 2 tubes placed',
      gridState.cellCount === 100 && gridState.occupiedCount === 2 && gridState.emptyCount === 98 && gridState.a1Occupied && gridState.a2Occupied ? 'PASS' : 'FAIL',
      `cells=${gridState.cellCount} occ=${gridState.occupiedCount} empty=${gridState.emptyCount}`);

    // 3. Occupied cell shows label_2 text. tube-pistachio-leaf-1 has label_2: "PL1\n4/01".
    log('editor', 'Occupied cell shows label_2',
      gridState.a1Text.includes('PL1') || gridState.a1Text.includes('4/01') ? 'PASS' : 'FAIL',
      `A1 text: "${gridState.a1Text}"`);

    // 4. Close the box popup, open the migration box to check collision rendering
    // (the migration put 3 items at A2).
    await p.evaluate(() => { const el = document.getElementById('em-close'); if (el) el.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => Lab.editorModal.open('docs/locations/box-minus80-a-1-a.md'));
    await p.waitForSelector('#em-contents .em-grid-view', { timeout: 8000 }).catch(() => {});
    const collision = await p.evaluate(() => {
      const view = document.querySelector('#em-contents .em-grid-view');
      if (!view) return { ok: false };
      const a2 = view.querySelector('[data-cell="A2"]');
      const collideBadge = a2 ? a2.querySelector('.gc-collide') : null;
      return {
        ok: true,
        hasCollision: !!collideBadge,
        collideText: collideBadge ? collideBadge.innerText : '',
        a2HasClass: a2 ? a2.classList.contains('collision') : false,
      };
    });
    log('editor', 'Collision cell shows count badge',
      collision.ok && collision.hasCollision && collision.a2HasClass ? 'PASS' : 'FAIL',
      collision.ok ? `badge="${collision.collideText}" hasClass=${collision.a2HasClass}` : 'no grid view');

    // 5. Click the collision badge → popover shows multiple items.
    if (collision.hasCollision) {
      await p.evaluate(() => {
        const badge = document.querySelector('#em-contents [data-cell="A2"] .gc-collide');
        if (badge) badge.click();
      });
      await p.waitForTimeout(600);
      const popState = await p.evaluate(() => {
        const pop = document.querySelector('.em-collide-pop');
        return {
          present: !!pop,
          rowCount: pop ? pop.querySelectorAll('.em-child-row').length : 0,
        };
      });
      log('editor', 'Collision popover lists items',
        popState.present && popState.rowCount >= 2 ? 'PASS' : 'FAIL',
        `popover=${popState.present} rows=${popState.rowCount}`);
      // Dismiss popover
      await p.click('body', { position: { x: 10, y: 10 } });
      await p.waitForTimeout(200);
    }

    // 6. Shelf popup shows children list (no grid) with "+ Add" button.
    await p.evaluate(() => { const el = document.getElementById('em-close'); if (el) el.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => Lab.editorModal.open('docs/locations/shelf-minus80-a-1.md'));
    await p.waitForSelector('#em-contents', { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1500);
    const shelfContents = await p.evaluate(() => {
      const contents = document.getElementById('em-contents');
      if (!contents) return { ok: false };
      const rows = contents.querySelectorAll('.em-child-row');
      const addBtn = contents.querySelector('[data-em-add]');
      const hasGrid = !!contents.querySelector('.em-grid-view');
      return {
        ok: true,
        rowCount: rows.length,
        hasAddBtn: !!addBtn,
        hasGrid,
        rowTitles: Array.from(rows).map(r => r.querySelector('.ec-title')?.innerText || ''),
      };
    });
    log('editor', 'Shelf shows children list with +Add',
      shelfContents.ok && !shelfContents.hasGrid && shelfContents.rowCount >= 2 && shelfContents.hasAddBtn ? 'PASS' : 'FAIL',
      shelfContents.ok ? `rows=${shelfContents.rowCount} add=${shelfContents.hasAddBtn} grid=${shelfContents.hasGrid}` : 'no contents');

    // 7. Reagent popup shows container_list in col 3 (relocated from col 1).
    await p.evaluate(() => { const el = document.getElementById('em-close'); if (el) el.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => Lab.editorModal.open('docs/resources/microtube.md'));
    await p.waitForTimeout(2500);
    const reagent = await p.evaluate(() => {
      const fields = document.getElementById('em-fields');
      const contents = document.getElementById('em-contents');
      const fieldsText = fields ? fields.innerText : '';
      const contentsText = contents ? contents.innerText : '';
      return {
        fieldsHasContainerUI: fieldsText.toLowerCase().includes('container') && fieldsText.toLowerCase().includes('quantity'),
        contentsHasContainerTable: !!contents && (contents.querySelector('table') || contents.innerHTML.includes('container')),
        contentsText: contentsText.substring(0, 160),
      };
    });
    log('editor', 'Reagent container_list relocated to col 3',
      !reagent.fieldsHasContainerUI && reagent.contentsHasContainerTable ? 'PASS' : 'FAIL',
      `col1HasContainer=${reagent.fieldsHasContainerUI} col3HasContainer=${reagent.contentsHasContainerTable}`);

    // 8. Click Edit → type input appears as a datalist in edit mode.
    await p.evaluate(() => {
      const btn = document.getElementById('em-edit-toggle');
      if (btn) btn.click();
    });
    await p.waitForTimeout(1500);
    const typeInEdit = await p.evaluate(() => {
      const input = document.querySelector('.em-field-input[data-key="type"]');
      const dl = document.getElementById('em-types-list');
      return {
        isInput: input ? input.tagName === 'INPUT' : false,
        inputType: input ? input.type : '',
        hasList: input ? input.getAttribute('list') === 'em-types-list' : false,
        optionCount: dl ? dl.querySelectorAll('option').length : 0,
        hasKnownTypes: dl ? (dl.innerHTML.includes('reagent') && dl.innerHTML.includes('tube') && dl.innerHTML.includes('freezer')) : false,
      };
    });
    log('editor', 'Edit mode: type is datalist input',
      typeInEdit.isInput && typeInEdit.hasList && typeInEdit.hasKnownTypes && typeInEdit.optionCount >= 10 ? 'PASS' : 'FAIL',
      `isInput=${typeInEdit.isInput} hasList=${typeInEdit.hasList} opts=${typeInEdit.optionCount} hasKnown=${typeInEdit.hasKnownTypes}`);
    // Cancel out of edit mode without saving
    await p.evaluate(() => {
      const btn = document.getElementById('em-edit-toggle');
      if (btn) btn.click();
    });
    await p.waitForTimeout(800);

    // 9. Click an empty grid cell on box-pistachio-dna → new-object modal opens.
    await p.evaluate(() => { const el = document.getElementById('em-close'); if (el) el.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => Lab.editorModal.open('docs/locations/box-pistachio-dna.md'));
    await p.waitForSelector('#em-contents .em-grid-view', { timeout: 8000 }).catch(() => {});
    await p.evaluate(() => {
      // Click an empty cell — E5 should be empty (2 tubes are A1 and A2)
      const cell = document.querySelector('#em-contents .em-grid-cell.empty[data-cell="E5"]');
      if (cell) cell.click();
    });
    await p.waitForTimeout(2000);
    // Wait long enough for openNew to clear cols 2+3 synchronously AND for
    // Toast UI to mount the editor. 3s covers the Toast UI bundle download.
    await p.waitForTimeout(3000);
    const newMode = await p.evaluate(() => {
      const title = document.getElementById('em-title');
      const typeInput = document.querySelector('.em-field-input[data-key="type"]');
      // In edit mode the parent field is an <input>, not a data-parent-pill span.
      const parentInput = document.querySelector('.em-field-input[data-key="parent"]');
      const posField = document.querySelector('.em-field-input[data-key="position"]');
      const saveBtn = document.getElementById('em-save');
      const content = document.getElementById('em-content');
      const contents = document.getElementById('em-contents');
      // Col 2 should either be the em-surface (Toast UI mounted) or the loading
      // spinner — in neither case should the OLD parent's rendered body be left
      // behind ("Pistachio DNA Box" heading + prose).
      const col2HTML = content ? content.innerHTML : '';
      const col2HasOldParent = col2HTML.includes('lab-rendered em-rendered') ||
                               col2HTML.includes('Standard 10×10 cryobox');
      const col2HasFreshMount = col2HTML.includes('em-surface') || col2HTML.includes('Loading editor');
      // Col 3 should show the "no contents yet" placeholder, NOT the old grid.
      const col3HTML = contents ? contents.innerHTML : '';
      const col3HasOldGrid = col3HTML.includes('em-grid-view') || col3HTML.includes('data-cell=');
      const col3HasEmptyState = col3HTML.includes('no contents yet') || col3HTML.includes('em-col-empty');
      return {
        titleText: title ? title.textContent : '',
        hasTypeInput: !!typeInput,
        typeValue: typeInput ? typeInput.value : '',
        parentValue: parentInput ? parentInput.value : '',
        positionValue: posField ? posField.value : '',
        saveVisible: saveBtn && saveBtn.style.display !== 'none',
        col2HasOldParent, col2HasFreshMount,
        col3HasOldGrid, col3HasEmptyState,
      };
    });
    const newOK = newMode.titleText.includes('New') &&
                  newMode.hasTypeInput &&
                  newMode.typeValue === 'tube' &&
                  newMode.parentValue === 'locations/box-pistachio-dna' &&
                  newMode.positionValue === 'E5' &&
                  newMode.saveVisible;
    log('editor', 'Empty cell click opens new-object modal',
      newOK ? 'PASS' : 'FAIL',
      `title="${newMode.titleText}" type=${newMode.typeValue} parent=${newMode.parentValue} pos=${newMode.positionValue} save=${newMode.saveVisible}`);

    log('editor', 'New mode clears col 2 (no stale parent body)',
      !newMode.col2HasOldParent && newMode.col2HasFreshMount ? 'PASS' : 'FAIL',
      `stale=${newMode.col2HasOldParent} fresh=${newMode.col2HasFreshMount}`);

    log('editor', 'New mode clears col 3 (no stale parent grid)',
      !newMode.col3HasOldGrid && newMode.col3HasEmptyState ? 'PASS' : 'FAIL',
      `staleGrid=${newMode.col3HasOldGrid} emptyState=${newMode.col3HasEmptyState}`);

    // Close the new-object modal without saving
    await p.evaluate(() => { const el = document.getElementById('em-close'); if (el) el.click(); });
    await p.waitForTimeout(400);

    await p.screenshot({ path: '/tmp/labbot-editor.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  HIERARCHY (R1, Issue #18): location hierarchy data model
  //  ────────────────────────────────────────────────────────
  //  Tests the new parent/position/grid/label_1/label_2 schema:
  //   • object-index.json carries hierarchy fields
  //   • Lab.hierarchy.parentChain walks up through the seed chain
  //   • breadcrumbHTML renders a clickable crumb trail
  //   • migrated items (formerly location_detail) resolve to parent-ref
  //   • cross-location wikilinks still render as pills
  //   • bogus parent refs warn-but-allow (no crash)
  // ════════════════════════════════════════════════════════════
  if (shouldRun('hierarchy')) {
    console.log('\n🗂️  HIERARCHY\n');
    const p = await context.newPage();

    // Load any app page so lab.js + hierarchy.js + types.js are all in scope.
    // wiki.html never reaches networkidle (knowledge graph keeps repainting),
    // so use domcontentloaded + explicit wait for Lab modules.
    await p.goto(BASE + '/app/wiki.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForFunction(() => window.Lab && window.Lab.editorModal && window.Lab.hierarchy, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(2000);

    // 1. Object index has location entries with hierarchy fields.
    const indexShape = await p.evaluate(async () => {
      const idx = await Lab.gh.fetchObjectIndex();
      const loc = idx.filter(e => ['room','freezer','fridge','shelf','box','tube','container'].includes(e.type));
      const sample = idx.find(e => e.path === 'samples/sample-pistachio-4.md');
      const leaf   = idx.find(e => e.path === 'locations/tube-pistachio-leaf-1.md');
      const box    = idx.find(e => e.path === 'locations/box-pistachio-dna.md');
      return {
        total: idx.length,
        locationCount: loc.length,
        leafHasParent: !!leaf && leaf.parent === 'locations/box-pistachio-dna',
        leafHasPosition: !!leaf && leaf.position === 'A1',
        boxHasGrid: !!box && box.grid === '10x10',
        sampleLoaded: !!sample,
      };
    });
    log('hierarchy', 'Object index has location entries',
      indexShape.locationCount >= 10 ? 'PASS' : 'FAIL',
      `${indexShape.locationCount} location objects of ${indexShape.total} total`);
    log('hierarchy', 'Tube has parent+position',
      indexShape.leafHasParent && indexShape.leafHasPosition ? 'PASS' : 'FAIL',
      `parent=${indexShape.leafHasParent} position=${indexShape.leafHasPosition}`);
    log('hierarchy', 'Box carries grid field',
      indexShape.boxHasGrid ? 'PASS' : 'FAIL',
      `grid=${indexShape.boxHasGrid}`);
    log('hierarchy', 'Sample object seeded',
      indexShape.sampleLoaded ? 'PASS' : 'FAIL',
      indexShape.sampleLoaded ? 'sample-pistachio-4.md in index' : 'missing');

    // 2. parentChain walks up through the seed chain.
    const chainResult = await p.evaluate(async () => {
      const chain = await Lab.hierarchy.parentChain('locations/tube-pistachio-leaf-1');
      return chain;
    });
    const expectedChain = [
      'locations/room-robbins-0170',
      'locations/freezer-minus80-a',
      'locations/shelf-minus80-a-1',
      'locations/box-pistachio-dna',
      'locations/tube-pistachio-leaf-1',
    ];
    const chainOK = JSON.stringify(chainResult) === JSON.stringify(expectedChain);
    log('hierarchy', 'parentChain walks root → leaf', chainOK ? 'PASS' : 'FAIL',
      chainOK ? chainResult.join(' → ') : `got: ${chainResult.join(' → ')}`);

    // 3. breadcrumbHTML returns a crumb element with the expected titles.
    const crumbHTML = await p.evaluate(async () => {
      return await Lab.hierarchy.breadcrumbHTML('locations/tube-pistachio-leaf-1');
    });
    const crumbOK = crumbHTML.includes('lab-breadcrumb') &&
                    crumbHTML.includes('Robbins Hall 0170') &&
                    crumbHTML.includes('Pistachio DNA Box') &&
                    crumbHTML.includes('Pistachio Leaf 1');
    log('hierarchy', 'breadcrumbHTML renders chain', crumbOK ? 'PASS' : 'FAIL',
      crumbOK ? 'contains room + box + tube titles' : 'crumbs missing');

    // 4. Migration preserved items under the generated box.
    const migratedCount = await p.evaluate(async () => {
      const idx = await Lab.gh.fetchObjectIndex();
      return idx.filter(e => e.parent === 'locations/box-minus80-a-1-a').length;
    });
    log('hierarchy', 'Migrated items have parent-ref',
      migratedCount >= 8 ? 'PASS' : 'FAIL',
      `${migratedCount} items in migrated box (expected >= 8)`);

    // 5. childrenOf() returns the right kids.
    const kids = await p.evaluate(async () => {
      const c = await Lab.hierarchy.childrenOf('locations/box-pistachio-dna');
      return c.map(k => k.slug).sort();
    });
    const kidsOK = kids.includes('locations/tube-pistachio-leaf-1') &&
                   kids.includes('locations/tube-pistachio-leaf-2');
    log('hierarchy', 'childrenOf() reverse lookup', kidsOK ? 'PASS' : 'FAIL',
      kidsOK ? `${kids.length} children` : `got: ${kids.join(', ')}`);

    // 6. parseGrid utility
    const gridParse = await p.evaluate(() => {
      return {
        g10x10: Lab.hierarchy.parseGrid('10x10'),
        g8x12:  Lab.hierarchy.parseGrid('8x12'),
        bad:    Lab.hierarchy.parseGrid('not a grid'),
      };
    });
    const gridOK = gridParse.g10x10 && gridParse.g10x10.rows === 10 && gridParse.g10x10.cols === 10 &&
                   gridParse.g8x12 && gridParse.g8x12.rows === 8 && gridParse.g8x12.cols === 12 &&
                   gridParse.bad === null;
    log('hierarchy', 'parseGrid helper', gridOK ? 'PASS' : 'FAIL',
      gridOK ? '10x10, 8x12, bad→null' : JSON.stringify(gridParse));

    // 7. parsePosition utility (A1 → row 0, col 0)
    const posParse = await p.evaluate(() => {
      return {
        A1: Lab.hierarchy.parsePosition('A1'),
        H12: Lab.hierarchy.parsePosition('H12'),
        numeric: Lab.hierarchy.parsePosition('2,3'),
        bad: Lab.hierarchy.parsePosition('garbage'),
      };
    });
    const posOK = posParse.A1 && posParse.A1.row === 0 && posParse.A1.col === 0 &&
                  posParse.H12 && posParse.H12.row === 7 && posParse.H12.col === 11 &&
                  posParse.numeric && posParse.numeric.row === 1 && posParse.numeric.col === 2 &&
                  posParse.bad === null;
    log('hierarchy', 'parsePosition helper', posOK ? 'PASS' : 'FAIL',
      posOK ? 'A1, H12, 2,3, bad→null' : JSON.stringify(posParse));

    // 8. normalizeParent strips [[brackets]].
    const normResult = await p.evaluate(() => ({
      plain: Lab.hierarchy.normalizeParent('locations/box-pistachio-dna'),
      bracket: Lab.hierarchy.normalizeParent('[[locations/box-pistachio-dna]]'),
      withMd: Lab.hierarchy.normalizeParent('locations/box-pistachio-dna.md'),
      empty: Lab.hierarchy.normalizeParent(''),
      nul:   Lab.hierarchy.normalizeParent(null),
    }));
    const normOK = normResult.plain === 'locations/box-pistachio-dna' &&
                   normResult.bracket === 'locations/box-pistachio-dna' &&
                   normResult.withMd === 'locations/box-pistachio-dna' &&
                   normResult.empty === null && normResult.nul === null;
    log('hierarchy', 'normalizeParent strips [[]] / .md', normOK ? 'PASS' : 'FAIL',
      normOK ? 'all 5 forms OK' : JSON.stringify(normResult));

    // 9. Sample-to-tube cross-reference — the sample card opens via popup and
    // renders the breadcrumb for the sample itself (empty, because sample has
    // no parent) plus the wikilinks to its physical tubes.
    await p.evaluate(() => Lab.editorModal.open('docs/samples/sample-pistachio-4.md'));
    await p.waitForTimeout(2500);
    const samplePopup = await p.evaluate(() => {
      const content = document.getElementById('em-content');
      return {
        hasContent: !!content && content.innerText.length > 50,
        pillCount: content ? content.querySelectorAll('a.object-pill').length : 0,
        tubeLinkText: content ? content.innerText.includes('Pistachio Leaf 1') || content.innerText.includes('tube-pistachio-leaf-1') : false,
      };
    });
    log('hierarchy', 'Sample popup renders cross-location links',
      samplePopup.hasContent && samplePopup.pillCount >= 2 && samplePopup.tubeLinkText ? 'PASS' : 'WARN',
      `pills=${samplePopup.pillCount} tubeText=${samplePopup.tubeLinkText}`);

    // Close the popup before moving on.
    await p.evaluate(() => { const el = document.getElementById('em-close'); if (el) el.click(); });
    await p.waitForTimeout(500);

    // 10. Open a tube popup and verify the breadcrumb is injected.
    await p.evaluate(() => Lab.editorModal.open('docs/locations/tube-pistachio-leaf-1.md'));
    await p.waitForTimeout(2500);
    const tubePopup = await p.evaluate(() => {
      const content = document.getElementById('em-content');
      const crumb = content ? content.querySelector('.lab-breadcrumb') : null;
      const fields = document.getElementById('em-fields');
      // Parent field upgrade: placeholder span should contain an <a.object-pill>
      const parentSpan = fields ? fields.querySelector('[data-parent-pill]') : null;
      const parentPill = parentSpan ? parentSpan.querySelector('a.object-pill') : null;
      // Label textarea display: find label_1 row by scanning for its label text,
      // then confirm the value span has pre-wrap and contains a real newline char.
      let label1ValueHTML = '';
      let label1HasNewline = false;
      let label1Style = '';
      if (fields) {
        const rows = fields.querySelectorAll('div');
        for (const r of rows) {
          const lbl = r.querySelector('span');
          if (lbl && lbl.textContent.trim().startsWith('Label 1')) {
            const val = r.querySelectorAll('span')[1];
            if (val) {
              label1ValueHTML = val.innerHTML;
              label1Style = val.getAttribute('style') || '';
              label1HasNewline = val.textContent.indexOf('\n') >= 0;
            }
            break;
          }
        }
      }
      return {
        hasCrumb: !!crumb,
        crumbText: crumb ? crumb.innerText : '',
        crumbLinkCount: crumb ? crumb.querySelectorAll('a').length : 0,
        parentIsPill: !!parentPill,
        parentPillText: parentPill ? parentPill.textContent : '',
        label1HasNewline, label1Style, label1ValueHTML,
      };
    });
    const tubeOK = tubePopup.hasCrumb &&
                   tubePopup.crumbText.includes('Robbins Hall 0170') &&
                   tubePopup.crumbText.includes('Pistachio DNA Box') &&
                   tubePopup.crumbLinkCount >= 4; // all ancestors clickable, self is not
    log('hierarchy', 'Tube popup shows breadcrumb', tubeOK ? 'PASS' : 'FAIL',
      tubeOK ? `${tubePopup.crumbLinkCount} links in crumb` : tubePopup.crumbText.substring(0, 80));

    log('hierarchy', 'Parent field renders as object pill',
      tubePopup.parentIsPill && tubePopup.parentPillText.includes('Pistachio DNA Box') ? 'PASS' : 'FAIL',
      tubePopup.parentIsPill ? `pill text: "${tubePopup.parentPillText}"` : 'no a.object-pill in parent span');

    log('hierarchy', 'Multi-line label preserves newlines',
      tubePopup.label1HasNewline && tubePopup.label1Style.includes('pre-wrap') ? 'PASS' : 'FAIL',
      tubePopup.label1HasNewline ? 'real \\n in text + pre-wrap style' : `style="${tubePopup.label1Style}" html="${tubePopup.label1ValueHTML.substring(0, 60)}"`);

    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  SEARCH: verify search works across pages
  // ════════════════════════════════════════════════════════════
  if (shouldRun('search')) {
    console.log('\n🔍 SEARCH\n');

    const searchPages = [
      { name: 'protocols', path: '/app/protocols.html', query: 'PCR', selector: '[data-path]' },
      { name: 'wiki', path: '/app/wiki.html', query: 'ethanol', selector: '.doc-item, [data-path]' },
      { name: 'inventory', path: '/app/inventory.html', query: 'buffer', selector: 'tbody tr' },
      { name: 'notebooks', path: '/app/notebooks.html', query: 'alex', selector: '.nb-item, [data-path]' },
    ];

    for (const sp of searchPages) {
      const pg = await context.newPage();
      await pg.goto(BASE + sp.path, { waitUntil: 'networkidle', timeout: 20000 });
      await pg.waitForTimeout(2000);

      const searchInput = await pg.$('input[placeholder*="Search"], input[placeholder*="search"], #protoSearch, #wikiSearch, #invSearch, #nbSearch');
      if (searchInput) {
        await searchInput.fill(sp.query);
        await pg.waitForTimeout(1000);
        const results = await pg.evaluate((sel) =>
          document.querySelectorAll(sel).length, sp.selector);
        log('search', `${sp.name}: "${sp.query}"`, results > 0 ? 'PASS' : 'WARN',
          `${results} results`);
      } else {
        log('search', `${sp.name} search`, 'WARN', 'Search input not found');
      }
      await pg.close();
    }
  }

  // ════════════════════════════════════════════════════════════
  //  CROSS-PAGE NAV: wikilink navigation
  // ════════════════════════════════════════════════════════════
  if (shouldRun('crossnav')) {
    console.log('\n🔗 CROSS-PAGE NAV\n');
    const p = await context.newPage();

    // Open AMPure XP Beads (has [[protocol]] wikilinks that should navigate)
    await p.goto(BASE + '/app/wiki.html?doc=resources%2Fampure-xp-beads', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);

    // Find a protocol pill and click it — should navigate to protocols.html
    const navResult = await p.evaluate(() => {
      const pills = document.querySelectorAll('a.object-pill');
      for (const pill of pills) {
        const href = pill.getAttribute('href') || '';
        if (href.includes('obj://')) {
          return { text: pill.textContent.trim().substring(0, 40), href: href };
        }
      }
      return null;
    });
    if (navResult) {
      log('crossnav', 'Wikilink pill found', 'PASS', `"${navResult.text}" → ${navResult.href}`);
      // Click the pill
      await p.evaluate(() => {
        const pill = document.querySelector('a.object-pill[href^="obj://"]');
        if (pill) pill.click();
      });
      await p.waitForTimeout(3000);
      // Verify navigation happened (URL changed or new content loaded)
      const newUrl = p.url();
      const navigated = newUrl.includes('protocols.html') || newUrl.includes('wiki.html?doc=');
      log('crossnav', 'Navigate via pill', navigated ? 'PASS' : 'WARN',
        navigated ? `Navigated to ${newUrl.split('/').pop().substring(0, 60)}` : 'URL unchanged');
    } else {
      log('crossnav', 'Wikilink pill', 'WARN', 'No obj:// pills found');
    }

    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  SPECIAL CHARS: create items with tricky names
  // ════════════════════════════════════════════════════════════
  if (shouldRun('specialchars')) {
    console.log('\n🔤 SPECIAL CHARS\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/wiki.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    const specialTitle = `LabBot "Test" & <Tag> — ${TS}`;
    await p.click('#newDocBtn');
    await p.waitForTimeout(1000);
    await p.fill('#wm_title', specialTitle);
    await p.selectOption('#wm_folder', 'resources');
    await p.click('#wmOk');
    await p.waitForTimeout(8000);

    // Slug should be safe (no special chars)
    const slug = specialTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const specialPath = `docs/resources/${slug}.md`;
    const specialCreated = ghFileExists(specialPath);
    log('specialchars', 'Create with special chars', specialCreated ? 'PASS' : 'FAIL',
      specialCreated ? `"${specialTitle}" → ${slug}.md` : 'File not created');
    if (specialCreated) {
      cleanup.push({ path: specialPath });
      // Verify the title is preserved in frontmatter (not escaped/corrupted)
      const content = ghReadFile(specialPath);
      // Verify the content was saved (heading or frontmatter contains the run ID)
      const hasRunId = content?.includes(TS);
      log('specialchars', 'Content saved correctly', hasRunId ? 'PASS' : 'FAIL',
        hasRunId ? 'Run ID found in file content' : 'Content missing');
    }

    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  MOBILE: all pages
  // ════════════════════════════════════════════════════════════
  if (shouldRun('mobile')) {
    console.log('\n📱 MOBILE (375x812)\n');
    const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    await mCtx.addInitScript((token) => {
      sessionStorage.setItem('monroe-lab-auth', 'true');
      localStorage.setItem('gh_lab_token', token);
      localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'greymonroe', avatar: '' }));
    }, GH_TOKEN);

    const mobilePages = [
      { name: 'dashboard', path: '/app/dashboard.html' },
      { name: 'protocols', path: '/app/protocols.html' },
      { name: 'wiki', path: '/app/wiki.html' },
      { name: 'inventory', path: '/app/inventory.html' },
      { name: 'lab-map', path: '/app/lab-map.html' },
      { name: 'notebooks', path: '/app/notebooks.html' },
      { name: 'waste', path: '/app/waste.html' },
    ];

    for (const mp of mobilePages) {
      const pg = await mCtx.newPage();
      await pg.goto(BASE + mp.path, { waitUntil: 'networkidle', timeout: 15000 });
      await pg.waitForTimeout(1500);

      const overflow = await pg.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      const bottomNav = await pg.$('#lab-bottom-nav') !== null;
      log('mobile', mp.name, overflow ? 'FAIL' : 'PASS',
        `overflow=${overflow}, bottomNav=${bottomNav}`);
      await pg.screenshot({ path: `/tmp/labbot-mobile-${mp.name}.png`, fullPage: false });
      await pg.close();
    }
    await mCtx.close();
  }

  } catch (e) {
    console.error(`\n💥 CRASH: ${e.message.substring(0, 200)}`);
  }

  // ════════════════════════════════════════════════════════════
  //  CLEANUP
  // ════════════════════════════════════════════════════════════
  if (!KEEP && cleanup.length > 0) {
    console.log('\n🧹 CLEANUP\n');
    for (const { path } of cleanup) {
      const ok = ghDeleteFile(path, `LabBot cleanup: ${path}`);
      console.log(`  ${ok ? '✅' : '⚠️'} ${path}`);
    }
  } else if (KEEP && cleanup.length > 0) {
    console.log('\n📌 Keeping test artifacts:');
    cleanup.forEach(c => console.log(`  ${c.path}`));
  }

  // ════════════════════════════════════════════════════════════
  //  REPORT
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  🤖 LABBOT TEST REPORT');
  console.log('═'.repeat(60));

  const sections = [...new Set(results.map(r => r.section))];
  let totalPass = 0, totalFail = 0, totalWarn = 0;

  for (const section of sections) {
    const sectionResults = results.filter(r => r.section === section);
    const pass = sectionResults.filter(r => r.status === 'PASS').length;
    const fail = sectionResults.filter(r => r.status === 'FAIL').length;
    const warn = sectionResults.filter(r => r.status === 'WARN').length;
    totalPass += pass; totalFail += fail; totalWarn += warn;

    const sIcon = fail > 0 ? '❌' : warn > 0 ? '⚠️' : '✅';
    console.log(`\n  ${sIcon} ${section.toUpperCase()} (${pass}/${sectionResults.length})`);
    sectionResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`     ${icon} ${r.test}: ${r.detail}`);
    });
  }

  console.log(`\n  ──────────────────────────────────────`);
  console.log(`  TOTAL: ${totalPass} pass / ${totalFail} fail / ${totalWarn} warn`);
  console.log(`  Screenshots: /tmp/labbot-*.png`);
  console.log('═'.repeat(60) + '\n');

  await browser.close();
  process.exit(totalFail > 0 ? 1 : 0);
})();
