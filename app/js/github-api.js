/* Monroe Lab – GitHub API & OAuth */
(function() {
  'use strict';

  var CLIENT_ID = 'Ov23li7RlMB84qZM8Sky';
  var TOKEN_PROXY = 'https://lab-handbook-auth.greymonroe.workers.dev';
  var REPO = 'monroe-lab/lab-handbook';
  var API = 'https://api.github.com';
  var BRANCH = 'main';
  var TOKEN_KEY = 'gh_lab_token';
  var USER_KEY = 'gh_lab_user';

  // ── Token / User ──
  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
  function isLoggedIn() { return !!getToken(); }

  function authHeaders() {
    var h = { 'Accept': 'application/vnd.github.v3+json' };
    var t = getToken();
    if (t) h['Authorization'] = 'token ' + t;
    return h;
  }

  // ── OAuth Web Flow ──
  function login() {
    sessionStorage.setItem('gh_auth_return', location.href);
    var state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('gh_auth_state', state);
    location.href = 'https://github.com/login/oauth/authorize' +
      '?client_id=' + CLIENT_ID +
      '&scope=repo' +
      '&state=' + state +
      '&redirect_uri=' + encodeURIComponent(location.origin + location.pathname);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    location.reload();
  }

  async function handleOAuthCallback() {
    var params = new URLSearchParams(location.search);
    var code = params.get('code');
    var state = params.get('state');
    if (!code) return false;

    var expected = sessionStorage.getItem('gh_auth_state');
    if (state !== expected) {
      console.error('OAuth state mismatch');
      cleanUrl();
      return false;
    }
    sessionStorage.removeItem('gh_auth_state');

    try {
      var resp = await fetch(TOKEN_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, client_id: CLIENT_ID })
      });
      var data = await resp.json();
      if (data.access_token) {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        var userResp = await fetch(API + '/user', {
          headers: { 'Authorization': 'token ' + data.access_token }
        });
        var userData = await userResp.json();
        localStorage.setItem(USER_KEY, JSON.stringify({
          login: userData.login,
          avatar: userData.avatar_url,
          name: userData.name || userData.login
        }));
      }
    } catch(e) {
      console.error('OAuth error', e);
    }

    var returnUrl = sessionStorage.getItem('gh_auth_return');
    sessionStorage.removeItem('gh_auth_return');
    if (returnUrl && returnUrl !== location.href) {
      location.href = returnUrl;
    } else {
      cleanUrl();
      location.reload();
    }
    return true;
  }

  function cleanUrl() {
    var url = new URL(location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    history.replaceState(null, '', url.toString());
  }

  // ── Offline detection ──
  function isOffline() { return typeof navigator !== 'undefined' && !navigator.onLine; }

  function offlineAwareFetch(url, options) {
    if (isOffline()) {
      return Promise.reject(new Error('You appear to be offline. Check your connection and try again.'));
    }
    return fetch(url, options).catch(function(e) {
      if (e instanceof TypeError && /fetch|network/i.test(e.message)) {
        throw new Error('Network error — you may be offline. Check your connection and try again.');
      }
      throw e;
    });
  }

  // ── Auth error detection ──
  function handleAuthError(resp) {
    if (resp.status === 401 || resp.status === 403) {
      // Clear the bad token so the user gets the sign-in gate on reload
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      var msg = 'Your GitHub token has expired or is invalid. Please sign in again.';
      if (window.Lab && window.Lab.showToast) {
        window.Lab.showToast(msg, 'error', 8000);
      }
      throw new Error(msg);
    }
  }

  // ── File Operations ──
  async function fetchFile(path) {
    var resp = await offlineAwareFetch(API + '/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH + '&_t=' + Date.now(), { headers: authHeaders(), cache: 'no-store' });
    if (!resp.ok) {
      handleAuthError(resp);
      throw new Error('Failed to load ' + path + ' (HTTP ' + resp.status + ')');
    }
    var data = await resp.json();
    return {
      content: window.Lab.decodeGitHub(data.content),
      sha: data.sha,
      path: path
    };
  }

  async function saveFile(path, content, sha, message) {
    var token = getToken();
    if (!token) throw new Error('Not signed in');
    var encoded = window.Lab.encodeGitHub(content);
    var body = { message: message || 'Update ' + path, content: encoded, branch: BRANCH };
    if (sha) body.sha = sha;

    var resp = await offlineAwareFetch(API + '/repos/' + REPO + '/contents/' + path, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      handleAuthError(resp);
      var err = await resp.json().catch(function() { return {}; });
      throw new Error(err.message || 'Save failed (HTTP ' + resp.status + ')');
    }
    var result = await resp.json();
    return { sha: result.content.sha };
  }

  async function deleteFile(path, sha, message) {
    var token = getToken();
    if (!token) throw new Error('Not signed in');

    // Get SHA if not provided
    if (!sha) {
      var resp = await offlineAwareFetch(API + '/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH + '&_t=' + Date.now(), { headers: authHeaders(), cache: 'no-store' });
      if (resp.ok) {
        var data = await resp.json();
        sha = data.sha;
      } else {
        handleAuthError(resp);
        throw new Error('File not found');
      }
    }

    var delResp = await offlineAwareFetch(API + '/repos/' + REPO + '/contents/' + path, {
      method: 'DELETE',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message || 'Delete ' + path, sha: sha, branch: BRANCH })
    });
    if (!delResp.ok) {
      handleAuthError(delResp);
      var err = await delResp.json().catch(function() { return {}; });
      throw new Error(err.message || 'Delete failed');
    }
  }

  async function fetchTree(path) {
    var resp = await offlineAwareFetch(API + '/repos/' + REPO + '/git/trees/' + BRANCH + '?recursive=1', { headers: authHeaders() });
    if (!resp.ok) {
      handleAuthError(resp);
      throw new Error('Failed to load tree');
    }
    var data = await resp.json();
    var files = data.tree.filter(function(t) { return t.type === 'blob'; }).map(function(t) { return t.path; });
    if (path) {
      files = files.filter(function(f) { return f.startsWith(path); });
    }
    return files;
  }

  // Object index cache
  var _objectIndex = null;
  var _objectIndexPromise = null;

  // Link index cache (R4, Issue #18): wikilink edges of the form
  //   [{ source: "wet-lab/pcr", target: "resources/ethanol" }, ...]
  // Used by the backlinks pane in the popup's col 3.
  var _linkIndex = null;
  var _linkIndexPromise = null;

  async function fetchLinkIndex() {
    if (_linkIndex) return _linkIndex;
    if (_linkIndexPromise) return _linkIndexPromise;
    _linkIndexPromise = (async function() {
      var base = window.Lab ? window.Lab.BASE : '/lab-handbook/';
      try {
        var resp = await fetch(base + 'link-index.json?_=' + Date.now());
        if (resp.ok) {
          _linkIndex = await resp.json();
          return _linkIndex;
        }
      } catch(e) {}
      _linkIndex = [];
      return _linkIndex;
    })();
    return _linkIndexPromise;
  }

  function clearLinkIndexCache() {
    _linkIndex = null;
    _linkIndexPromise = null;
  }

  // ── localStorage patch layer ──
  // Saves edits locally so they survive refresh without waiting for deploy
  var PATCH_KEY = 'lab_index_patches';
  var INDEX_KEYS = [
    'type', 'title', 'location', 'location_detail', 'quantity', 'unit', 'low_stock_threshold',
    'category', 'cas', 'notes', 'role', 'email', 'organism', 'stock_type',
    'source', 'genotype', 'status', 'pi', 'funding', 'date', 'author',
    'legacy_inventory_id', 'containers',
    'created_at', 'created_by', 'updated_at', 'need_more',
    // Location hierarchy (R1, Issue #18): parent is a slug (or [[wikilink]]),
    // position is a grid cell label, grid declares a container with rows x cols,
    // label_1 / label_2 are display labels (label_2 used in compact grid cells).
    'parent', 'position', 'grid', 'label_1', 'label_2',
    // R5: concept/instance fields
    'of', 'lot', 'expiration', 'acquired', 'level',
    // R7 #27: git mtime (unix timestamp) for recency ranking in inventory.
    'mtime'
  ];

  function getLocalPatches() {
    try { return JSON.parse(localStorage.getItem(PATCH_KEY)) || {}; } catch(e) { return {}; }
  }

  function applyLocalPatches(index) {
    var patches = getLocalPatches();
    var paths = Object.keys(patches);
    if (!paths.length) return index;

    var result = index.slice();
    paths.forEach(function(relPath) {
      var patch = patches[relPath];
      if (patch._deleted) {
        result = result.filter(function(e) { return e.path !== relPath; });
        return;
      }
      var idx = result.findIndex(function(e) { return e.path === relPath; });
      if (idx >= 0) {
        result[idx] = Object.assign({}, result[idx], patch);
      } else {
        result.push(patch);
      }
    });
    return result;
  }

  async function fetchObjectIndex() {
    if (_objectIndex) return _objectIndex;
    if (_objectIndexPromise) return _objectIndexPromise;

    _objectIndexPromise = (async function() {
      var raw = [];
      try {
        var base = window.Lab ? window.Lab.BASE : '/lab-handbook/';
        var resp = await fetch(base + 'object-index.json?_=' + Date.now());
        if (resp.ok) { raw = await resp.json(); }
      } catch(e) { /* fall through */ }

      if (!raw.length) {
        try {
          var result = await fetchFile('docs/object-index.json');
          raw = JSON.parse(result.content);
        } catch(e) {
          console.warn('Failed to load object index:', e);
        }
      }

      // Overlay any localStorage patches on top
      _objectIndex = applyLocalPatches(raw);
      return _objectIndex;
    })();

    return _objectIndexPromise;
  }

  function clearObjectIndexCache() {
    _objectIndex = null;
    _objectIndexPromise = null;
  }

  function patchObjectIndex(filePath, meta) {
    var relPath = filePath.replace(/^docs\//, '');
    var entry = { path: relPath };
    INDEX_KEYS.forEach(function(k) { if (meta[k] != null) entry[k] = meta[k]; });

    // Update in-memory cache immediately
    if (_objectIndex) {
      var idx = _objectIndex.findIndex(function(e) { return e.path === relPath; });
      if (idx >= 0) _objectIndex[idx] = entry; else _objectIndex.push(entry);
    }

    // Persist to localStorage so it survives refresh
    var patches = getLocalPatches();
    patches[relPath] = entry;
    try { localStorage.setItem(PATCH_KEY, JSON.stringify(patches)); } catch(e) {}

    // Clear wikilink lookup so it rebuilds with the new entry
    if (window.Lab && window.Lab.wikilinks && window.Lab.wikilinks.clearLookup) {
      window.Lab.wikilinks.clearLookup();
    }
  }

  function removeFromObjectIndex(filePath) {
    var relPath = filePath.replace(/^docs\//, '');
    if (_objectIndex) {
      _objectIndex = _objectIndex.filter(function(e) { return e.path !== relPath; });
    }
    var patches = getLocalPatches();
    patches[relPath] = { _deleted: true };
    try { localStorage.setItem(PATCH_KEY, JSON.stringify(patches)); } catch(e) {}
  }

  // Recent commits
  async function fetchRecentCommits(path, count) {
    var url = API + '/repos/' + REPO + '/commits?sha=' + BRANCH + '&per_page=' + (count || 10);
    if (path) url += '&path=' + path;
    var resp = await fetch(url, { headers: authHeaders() });
    if (!resp.ok) return [];
    return await resp.json();
  }

  // ── Init: handle OAuth callback ──
  if (location.search.includes('code=')) {
    handleOAuthCallback();
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.gh = {
    getToken: getToken,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    login: login,
    logout: logout,
    fetchFile: fetchFile,
    saveFile: saveFile,
    deleteFile: deleteFile,
    fetchTree: fetchTree,
    fetchObjectIndex: fetchObjectIndex,
    clearObjectIndexCache: clearObjectIndexCache,
    patchObjectIndex: patchObjectIndex,
    removeFromObjectIndex: removeFromObjectIndex,
    fetchRecentCommits: fetchRecentCommits,
    // Synchronous accessor for the already-loaded object-index. Used by the
    // editor-modal type datalist which runs inside renderFields (sync) and
    // can't await a fetch. Returns null if no fetch has completed yet.
    _getCachedIndex: function() { return _objectIndex; },
    _getCachedLinkIndex: function() { return _linkIndex; },
    fetchLinkIndex: fetchLinkIndex,
    clearLinkIndexCache: clearLinkIndexCache,
    REPO: REPO,
    BRANCH: BRANCH
  };
})();
