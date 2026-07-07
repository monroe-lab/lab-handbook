// Regression test for the notebook "editing an entry deletes all my previously
// saved writing" bug.
//
// Root cause: GitHub's Contents API only inlines base64 for blobs up to 1 MB.
// For files between 1 MB and 100 MB it returns `encoding: "none"` and an EMPTY
// `content` string. Notebook entries with pasted screenshots (stored inline as
// base64 data URIs) routinely exceed 1 MB, so re-opening one for editing loaded
// a BLANK editor — and the next save then overwrote the real entry, wiping
// everything that had been written. See app/js/github-api.js fetchFile().
//
// The fix falls back to the Blobs API (base64 up to 100 MB) using the blob sha
// the Contents API still returns. This test exercises the REAL fetchFile via a
// vm sandbox with a mocked fetch and asserts:
//   1. a small file loads directly from the Contents API (unchanged behavior)
//   2. a >1 MB file (Contents API returns empty) is recovered from the Blobs API
//   3. the recovered content is byte-exact
//
// Run: node tests/large-file-fetch.test.mjs

import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function b64encode(str) { return Buffer.from(str, 'utf8').toString('base64'); }
// GitHub wraps blob base64 at 60 chars per line with \n — decodeGitHub must strip them.
function githubWrap(b64) { return b64.replace(/(.{60})/g, '$1\n'); }

// ── Minimal browser environment for the github-api.js IIFE ──
function makeSandbox(fetchImpl) {
  const store = {};
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  };
  localStorage.setItem('gh_lab_token', 'test-token'); // isLoggedIn() → true

  const win = {};
  win.Lab = {
    // Real decode/encode semantics from shared.js
    decodeGitHub: b64 => decodeURIComponent(escape(atob(String(b64).replace(/\n/g, '')))),
    encodeGitHub: content => btoa(unescape(encodeURIComponent(content))),
    showToast: () => {},
  };

  const sandbox = {
    window: win,
    localStorage,
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    navigator: { onLine: true },
    location: { search: '', href: '', origin: '', pathname: '' },
    fetch: fetchImpl,
    atob: s => Buffer.from(s, 'base64').toString('latin1'),
    btoa: s => Buffer.from(s, 'latin1').toString('base64'),
    escape, unescape, // legacy Node globals, matching browser
    decodeURIComponent, encodeURIComponent,
    URLSearchParams,
    Date, Math, console, Promise, TypeError, Error,
    setTimeout, clearTimeout,
  };
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function loadGh(fetchImpl) {
  const code = fs.readFileSync(path.join(repoRoot, 'app/js/github-api.js'), 'utf8');
  const sandbox = makeSandbox(fetchImpl);
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.Lab.gh;
}

function jsonResponse(obj, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(obj) });
}

let failures = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); }
  else { console.error('  ✗ ' + msg); failures++; }
}

// ── Test 1: small file loads directly from Contents API ──
{
  const body = '# Small entry\n\nJust a little text.\n';
  const calls = [];
  const gh = loadGh((url) => {
    calls.push(url);
    return jsonResponse({ encoding: 'base64', content: githubWrap(b64encode(body)), size: Buffer.byteLength(body), sha: 'small-sha' });
  });
  const res = await gh.fetchFile('docs/notebooks/x/small.md');
  console.log('Test 1 — small file (≤1 MB) loads from Contents API:');
  assert(res.content === body, 'content matches byte-exact');
  assert(res.sha === 'small-sha', 'sha returned');
  assert(calls.length === 1 && /\/contents\//.test(calls[0]), 'only the Contents API was called (no blob fallback)');
}

// ── Test 2: >1 MB file — Contents API empty, recovered via Blobs API ──
{
  // A realistic large notebook entry: text + a big inline base64 "image".
  const bigImage = 'A'.repeat(1_500_000);
  const body = '# 2026-07-06 — Percival Singson\n\n## What I did\n\nInstalled syri and minimap2.\n\n' +
               '![screenshot](data:image/png;base64,' + bigImage + ')\n\nAll my careful notes here.\n';
  const calls = [];
  const gh = loadGh((url) => {
    calls.push(url);
    if (/\/contents\//.test(url)) {
      // GitHub's Contents API for a 1–100 MB blob: empty content, encoding none, but sha+size present.
      return jsonResponse({ encoding: 'none', content: '', size: Buffer.byteLength(body), sha: 'big-blob-sha' });
    }
    if (/\/git\/blobs\//.test(url)) {
      assert(/\/git\/blobs\/big-blob-sha/.test(url), 'blob fetched by the sha from the Contents response');
      return jsonResponse({ encoding: 'base64', content: githubWrap(b64encode(body)) });
    }
    return jsonResponse({ message: 'unexpected url ' + url }, false, 404);
  });
  const res = await gh.fetchFile('docs/notebooks/percival-singson/2026-07-06.md');
  console.log('Test 2 — large file (>1 MB) recovered via Blobs API:');
  assert(res.content.length === body.length, 'full length recovered (' + res.content.length + ' chars) — not a blank editor');
  assert(res.content === body, 'content matches byte-exact (no silent wipe on next save)');
  assert(res.sha === 'big-blob-sha', 'blob sha returned for the subsequent save');
  assert(calls.some(u => /\/git\/blobs\//.test(u)), 'Blobs API fallback was used');
}

console.log('');
if (failures) { console.error(failures + ' assertion(s) FAILED'); process.exit(1); }
console.log('All large-file fetch regression tests passed.');
