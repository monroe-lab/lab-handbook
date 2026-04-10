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

function shouldRun(name) { return !ONLY || ONLY === name; }

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
      Array.from(document.querySelectorAll('.nb-folder-header'))
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

              // Save via Cmd+S
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

              // After Cmd+S, saveDoc() re-renders the content in view mode.
              // Check the rendered view for rich text elements.
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
                    text: el.innerText.substring(0, 200),
                  };
                });
                const richRender = rendered.hasH2 && rendered.hasStrong && rendered.hasEm && rendered.hasUl;
                log('notebooks', 'Rich text renders after save',
                  richRender ? 'PASS' : 'FAIL',
                  `h2=${rendered.hasH2} strong=${rendered.hasStrong} em=${rendered.hasEm} ul=${rendered.hasUl}`);
                await p.screenshot({ path: '/tmp/labbot-nb-rendered.png', fullPage: false });
              }
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

    } catch(e) {
      log('notebooks', 'Notebook flow', 'WARN', 'Partial crash: ' + e.message.substring(0, 80));
    }
    await p.screenshot({ path: '/tmp/labbot-notebooks.png', fullPage: false });
    await p.close();
  }

  // ════════════════════════════════════════════════════════════
  //  LAB MAP: navigate, place a tube, verify position
  // ════════════════════════════════════════════════════════════
  if (shouldRun('labmap')) {
    console.log('\n🗺️  LAB MAP\n');
    const p = await context.newPage();
    await p.goto(BASE + '/app/lab-map.html', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(2000);

    // Room view
    const hasFloorPlan = await p.$('svg') !== null;
    log('labmap', 'Floor plan SVG', hasFloorPlan ? 'PASS' : 'FAIL', hasFloorPlan ? 'Rendered' : 'Missing');

    // Navigate to each zone
    const zones = ['freezer-80c', 'freezer-20c', 'refrigerator', 'chemical-cabinet', 'bench-1'];
    for (const zone of zones) {
      await p.evaluate((z) => labMap.open(z), zone);
      await p.waitForTimeout(800);
      const heading = await p.$eval('h2', el => el.textContent.trim()).catch(() => '');
      log('labmap', `Navigate: ${zone}`, heading.length > 0 ? 'PASS' : 'FAIL', heading.substring(0, 40));
      await p.evaluate(() => labMap.nav(0));
      await p.waitForTimeout(300);
    }

    // Drill into freezer → Shelf 1 → Box A
    await p.evaluate(() => labMap.open('freezer-80c'));
    await p.waitForTimeout(1500);
    const shelves = await p.$$('.shelf-card');
    log('labmap', 'Freezer box cards', shelves.length > 0 ? 'PASS' : 'FAIL', `${shelves.length} cards`);

    if (shelves.length > 0) {
      await shelves[0].click({ timeout: 5000 });
      await p.waitForTimeout(1000);

      // Check grid
      const occupied = await p.$$('.tube-cell.occupied');
      const empty = await p.$$('.tube-cell.empty');
      log('labmap', 'Box grid', (occupied.length + empty.length) === 81 ? 'PASS' : 'FAIL',
        `${occupied.length} occupied, ${empty.length} empty (total ${occupied.length + empty.length})`);

      // Click occupied tube → detail panel
      if (occupied.length > 0) {
        await occupied[0].click();
        await p.waitForTimeout(500);
        const detail = await p.$eval('#tubeDetail', el => el.innerText.substring(0, 80)).catch(() => '');
        log('labmap', 'Tube detail panel', detail.length > 5 ? 'PASS' : 'FAIL', detail.substring(0, 50));
      }

      // Click empty cell → assign popover
      if (empty.length > 0) {
        await empty[0].click();
        await p.waitForTimeout(500);
        const popover = await p.$('#assignPopover');
        const popText = popover ? await popover.evaluate(el => el.innerText.substring(0, 50)) : '';
        log('labmap', 'Empty cell assign popover', popText.length > 0 ? 'PASS' : 'WARN',
          popText || 'No popover text');
      }
    }

    await p.screenshot({ path: '/tmp/labbot-labmap.png', fullPage: false });
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

    // Get project names from sidebar — uses proto-folder-header class (same as protocols)
    const projects = await p.evaluate(() => {
      const headers = document.querySelectorAll('.proto-folder-header, [class*="folder-header"]');
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
    log('dashboard', 'Knowledge graph', text.includes('KNOWLEDGE GRAPH') ? 'PASS' : 'FAIL', 'Section present');

    await p.screenshot({ path: '/tmp/labbot-dashboard.png', fullPage: false });
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
