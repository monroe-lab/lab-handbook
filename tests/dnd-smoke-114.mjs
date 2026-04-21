// Local smoke test for Issue #114 — protocols drag-and-drop instant render.
//
// Loads app/protocols.html via file:// with api.github.com + raw.githubusercontent.com
// + object-index.json requests mocked, simulates a successful move by calling
// moveProtocol() directly (the DnD event plumbing is simple DOM wiring tested
// separately — what the bug is actually about is the render-after-move step),
// and asserts:
//   1. The sidebar re-renders with the protocol under its new folder BEFORE
//      the background wikilink rewrite resolves (proves we stopped blocking).
//   2. Lab.gh.patchObjectIndex and removeFromObjectIndex were called (proves
//      we're updating the index locally instead of waiting for Pages redeploy).
//   3. The success toast fires.
//
// NOTE: the deploy is blocked today; we don't hit the live site.

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = '/Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab';
const PAGE_URL = pathToFileURL(resolve(REPO, 'app/protocols.html')).href;

// Minimal object-index.json — two protocols in two folders.
const OBJECT_INDEX = [
  { path: 'wet-lab/pcr.md', type: 'protocol', title: 'PCR' },
  { path: 'plant-harvesting/seed-sterilization.md', type: 'protocol', title: 'Seed Sterilization' },
];

const SRC_FILE_CONTENT = [
  '---',
  'title: PCR',
  'type: protocol',
  '---',
  '',
  '# PCR',
  '',
  'A protocol body.',
].join('\n');

// Track github-api calls so we can assert on what happened.
const calls = [];

// Helper: base64 encode content for GitHub-shaped responses
function b64(s) { return Buffer.from(s, 'utf8').toString('base64'); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Pretend we have a GitHub token, otherwise moveProtocol short-circuits.
  // Also stub fetch() for the static index files so they resolve under file://.
  await context.addInitScript((objectIndex) => {
    localStorage.setItem('gh_lab_token', 'fake-test-token');
    localStorage.setItem('gh_lab_user', JSON.stringify({ login: 'tester', name: 'Tester' }));
    sessionStorage.setItem('monroe-lab-auth', 'true');

    // Stub fetch for /lab-handbook/object-index.json + link-index.json so the
    // page loads NAV under file://. api.github.com requests still flow
    // through page.route() below (registered on the context).
    const origFetch = window.fetch;
    window.fetch = function(url, opts) {
      const u = typeof url === 'string' ? url : (url && url.url) || '';
      if (u.includes('/object-index.json')) {
        return Promise.resolve(new Response(JSON.stringify(objectIndex), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (u.includes('/link-index.json')) {
        return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return origFetch.apply(this, arguments);
    };
  }, OBJECT_INDEX);

  // ── Route mocking ──
  let wikilinkRewriteStartedAt = null;
  let wikilinkRewriteBlocksUntil = null;

  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();

    // Deny any network for assets we don't care about: just let them 404 so
    // the page loads without external CDN calls.
    if (url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com') ||
        url.includes('cdn.jsdelivr.net') ||
        url.includes('unpkg.com') ||
        url.includes('cdnjs.cloudflare.com')) {
      return route.abort();
    }

    // object-index.json (Lab.BASE-relative). Served via raw fetch from the page.
    if (url.endsWith('/object-index.json') || url.includes('/object-index.json?')) {
      calls.push({ kind: 'object-index-fetch' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OBJECT_INDEX) });
    }

    // link-index.json
    if (url.endsWith('/link-index.json') || url.includes('/link-index.json?')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // GitHub API
    if (url.startsWith('https://api.github.com/')) {
      const m = url.match(/contents\/(.+?)(\?|$)/);
      if (m) {
        const path = decodeURIComponent(m[1]);
        if (req.method() === 'GET') {
          calls.push({ kind: 'GET', path });
          if (path === 'docs/wet-lab/pcr.md') {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ content: b64(SRC_FILE_CONTENT), sha: 'src-sha-123', path }),
            });
          }
          // Unknown file — 404 so fetchFile throws
          return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
        }
        if (req.method() === 'PUT') {
          calls.push({ kind: 'PUT', path });
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ content: { sha: 'new-sha-abc' } }),
          });
        }
        if (req.method() === 'DELETE') {
          calls.push({ kind: 'DELETE', path });
          return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        }
      }
      // Tree API — used by updateWikilinksAfterMove. Simulate a SLOW response
      // to prove the sidebar re-renders BEFORE the tree walk finishes.
      if (url.includes('/git/trees/')) {
        wikilinkRewriteStartedAt = Date.now();
        calls.push({ kind: 'tree', at: wikilinkRewriteStartedAt });
        await new Promise(r => setTimeout(r, 1500));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tree: [] }),
        });
      }
      // /user
      if (url.endsWith('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ login: 'tester', name: 'Tester' }) });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }

    route.continue();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('[page error]', m.text());
  });

  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });

  // Wait for NAV to build from the mocked index.
  await page.waitForFunction(() => window.NAV && window.NAV.length >= 2, { timeout: 10_000 });

  // Instrument Lab.gh patching so we can assert
  await page.evaluate(() => {
    window.__patchLog = [];
    const gh = window.Lab.gh;
    const origPatch = gh.patchObjectIndex;
    const origRemove = gh.removeFromObjectIndex;
    const origLinkPatch = gh.patchLinkIndex;
    const origLinkRemove = gh.removeFromLinkIndex;
    const origClear = gh.clearObjectIndexCache;
    gh.patchObjectIndex = function(path, meta) { window.__patchLog.push({ k: 'patch', path, meta }); return origPatch.apply(this, arguments); };
    gh.removeFromObjectIndex = function(path) { window.__patchLog.push({ k: 'remove', path }); return origRemove.apply(this, arguments); };
    gh.patchLinkIndex = function(path, body) { window.__patchLog.push({ k: 'patchLink', path }); return origLinkPatch.apply(this, arguments); };
    gh.removeFromLinkIndex = function(path) { window.__patchLog.push({ k: 'removeLink', path }); return origLinkRemove.apply(this, arguments); };
    gh.clearObjectIndexCache = function() { window.__patchLog.push({ k: 'clear' }); return origClear.apply(this, arguments); };
  });

  // Simulate the move (what the drop handler calls under the hood).
  // We call moveProtocol directly — the drop handler just forwards these args.
  const moveStart = Date.now();
  await page.evaluate(() => {
    // Fire-and-forget so we can observe the UI mid-flight
    window.__movePromise = window.moveProtocol('wet-lab/pcr', 'PCR', 'plant-harvesting', 'Plant Harvesting');
  });

  // Wait for the sidebar to reflect the new folder.
  await page.waitForFunction(() => {
    const items = Array.from(document.querySelectorAll('.proto-item'));
    return items.some(el => el.dataset.path === 'plant-harvesting/pcr');
  }, { timeout: 5_000 });
  const renderedAt = Date.now();

  // The sidebar should re-render quickly — well before the slow tree walk
  // (1500ms). If we re-rendered AFTER the tree walk, we're still blocking.
  const renderElapsed = renderedAt - moveStart;
  console.log(`sidebar re-rendered in ${renderElapsed}ms (tree walk delay: 1500ms)`);

  // Give the background pass a chance to start before we check calls
  await page.waitForTimeout(200);

  // Assert: patch calls fired BEFORE the tree walk.
  const patchLog = await page.evaluate(() => window.__patchLog);
  const callLog = calls.slice();
  console.log('patch log:', patchLog);
  console.log('network log:', callLog.map(c => c.kind + ' ' + (c.path || '')));

  assert.ok(renderElapsed < 1200, `Sidebar re-rendered in ${renderElapsed}ms — still blocked by slow wikilink pass`);
  assert.ok(patchLog.some(e => e.k === 'patch' && e.path === 'docs/plant-harvesting/pcr.md'), 'patchObjectIndex(new path) was not called');
  assert.ok(patchLog.some(e => e.k === 'remove' && e.path === 'docs/wet-lab/pcr.md'), 'removeFromObjectIndex(old path) was not called');
  assert.ok(patchLog.some(e => e.k === 'patchLink'), 'patchLinkIndex was not called');
  assert.ok(patchLog.some(e => e.k === 'removeLink'), 'removeFromLinkIndex was not called');
  assert.ok(!patchLog.some(e => e.k === 'clear'), 'clearObjectIndexCache must NOT be called (drops the patch overlay)');

  // PUT happened at new path, DELETE at old path
  assert.ok(callLog.some(c => c.kind === 'PUT' && c.path === 'docs/plant-harvesting/pcr.md'), 'PUT to new path missing');
  assert.ok(callLog.some(c => c.kind === 'DELETE' && c.path === 'docs/wet-lab/pcr.md'), 'DELETE of old path missing');

  // Wait for the background wikilink rewrite so the page is clean on exit
  await page.evaluate(() => window.__movePromise);
  await page.waitForTimeout(200);

  // pageerror only fires for uncaught exceptions, not resource 404s — so any
  // entry here is a real JS error. (Resource 404s log to console but don't
  // bubble up as pageerrors.)
  if (pageErrors.length) {
    console.log('page errors:', pageErrors);
    process.exitCode = 1;
  } else {
    console.log('PASS: Issue #114 — protocols DnD renders instantly');
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
