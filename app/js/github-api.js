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

  // ── File Operations ──
  async function fetchFile(path) {
    var resp = await fetch(API + '/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH, { headers: authHeaders() });
    if (!resp.ok) throw new Error('Failed to load ' + path + ' (HTTP ' + resp.status + ')');
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

    var resp = await fetch(API + '/repos/' + REPO + '/contents/' + path, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
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
      var resp = await fetch(API + '/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH, { headers: authHeaders() });
      if (resp.ok) {
        var data = await resp.json();
        sha = data.sha;
      } else {
        throw new Error('File not found');
      }
    }

    var delResp = await fetch(API + '/repos/' + REPO + '/contents/' + path, {
      method: 'DELETE',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message || 'Delete ' + path, sha: sha, branch: BRANCH })
    });
    if (!delResp.ok) {
      var err = await delResp.json().catch(function() { return {}; });
      throw new Error(err.message || 'Delete failed');
    }
  }

  async function fetchTree(path) {
    var resp = await fetch(API + '/repos/' + REPO + '/git/trees/' + BRANCH + '?recursive=1', { headers: authHeaders() });
    if (!resp.ok) throw new Error('Failed to load tree');
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

  async function fetchObjectIndex() {
    if (_objectIndex) return _objectIndex;
    if (_objectIndexPromise) return _objectIndexPromise;

    _objectIndexPromise = (async function() {
      try {
        // Try direct fetch first (faster, no auth needed for public deploys)
        var base = window.Lab ? window.Lab.BASE : '/lab-handbook/';
        var resp = await fetch(base + 'object-index.json?_=' + Date.now());
        if (resp.ok) {
          _objectIndex = await resp.json();
          return _objectIndex;
        }
      } catch(e) { /* fall through */ }

      // Fallback to GitHub API
      try {
        var result = await fetchFile('docs/object-index.json');
        _objectIndex = JSON.parse(result.content);
        return _objectIndex;
      } catch(e) {
        console.warn('Failed to load object index:', e);
        _objectIndex = [];
        return _objectIndex;
      }
    })();

    return _objectIndexPromise;
  }

  function clearObjectIndexCache() {
    _objectIndex = null;
    _objectIndexPromise = null;
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
    fetchRecentCommits: fetchRecentCommits,
    REPO: REPO,
    BRANCH: BRANCH
  };
})();
