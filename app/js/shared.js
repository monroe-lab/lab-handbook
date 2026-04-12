/* Monroe Lab – Shared utilities, password gate, toast system */
(function() {
  'use strict';

  // Base path for all app URLs
  var BASE = '/lab-handbook/';

  // For local dev: detect if running on localhost without /lab-handbook/ prefix
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    if (!location.pathname.startsWith('/lab-handbook/')) {
      BASE = '/';
    }
  }

  // ── Password Gate ──
  var PW_HASH = 'ba04be8e1a9800209d8b590583bea00720aa0b12c829b6df815a15a14a0d3532';

  function checkPasswordGate() {
    var pwDone = sessionStorage.getItem('monroe-lab-auth') === 'true';
    var ghDone = !!localStorage.getItem('gh_lab_token');

    // Both steps complete — no gate
    if (pwDone && ghDone) return;

    var gate = document.createElement('div');
    gate.id = 'password-gate';
    document.body.prepend(gate);

    if (!pwDone) {
      showPasswordStep(gate);
    } else {
      showGitHubStep(gate);
    }
  }

  function showPasswordStep(gate) {
    gate.innerHTML =
      '<div class="pw-box">' +
      '<h2>Monroe Lab</h2>' +
      '<p>Enter the lab password to continue.</p>' +
      '<form id="pw-form">' +
      '<input type="password" id="pw-input" placeholder="Password" autocomplete="off" autofocus>' +
      '<button type="submit">Enter</button>' +
      '</form>' +
      '<p class="pw-err" id="pw-err">Incorrect password. Try again.</p>' +
      '</div>';

    document.getElementById('pw-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var input = document.getElementById('pw-input');
      var msgBuf = new TextEncoder().encode(input.value);
      crypto.subtle.digest('SHA-256', msgBuf).then(function(buf) {
        var hash = Array.from(new Uint8Array(buf)).map(function(b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
        if (hash === PW_HASH) {
          sessionStorage.setItem('monroe-lab-auth', 'true');
          if (localStorage.getItem('gh_lab_token')) {
            gate.remove();
          } else {
            showGitHubStep(gate);
          }
        } else {
          document.getElementById('pw-err').style.display = 'block';
          input.value = '';
          input.focus();
        }
      });
    });
  }

  function showGitHubStep(gate) {
    gate.innerHTML =
      '<div class="pw-box" style="max-width:420px">' +
      '<span class="material-icons-outlined" style="font-size:48px;color:var(--teal);margin-bottom:12px;display:block">lock_open</span>' +
      '<h2>Sign in with GitHub</h2>' +
      '<p style="color:#666;font-size:0.95rem;line-height:1.5;margin-bottom:1.4rem">The lab handbook requires a GitHub account to load content and enable editing. If you just received an invitation from <strong>monroe-lab</strong>, accept it first, then sign in below.</p>' +
      '<button id="gh-gate-btn" style="width:100%;padding:0.75rem;background:#24292f;color:#fff;border:none;border-radius:6px;font-size:1rem;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px">' +
      '<svg height="20" width="20" viewBox="0 0 16 16" fill="#fff"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>' +
      'Sign in with GitHub</button>' +
      '</div>';

    document.getElementById('gh-gate-btn').addEventListener('click', function() {
      if (window.Lab && window.Lab.gh && window.Lab.gh.login) {
        window.Lab.gh.login();
      }
    });
  }

  // ── Toast Notifications ──
  function ensureToastContainer() {
    var c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(msg, type, duration) {
    var container = ensureToastContainer();
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    var icon = type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info';
    el.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">' + icon + '</span> ' + escHtml(msg);
    container.appendChild(el);
    setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, duration || 4000);
  }

  // ── Utility Functions ──
  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-');
  }

  function timeAgo(dateStr) {
    var d = new Date(dateStr);
    var now = new Date();
    var secs = Math.floor((now - d) / 1000);
    if (secs < 60) return 'just now';
    var mins = Math.floor(secs / 60);
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    return d.toLocaleDateString();
  }

  function decodeGitHub(base64Content) {
    var raw = atob(base64Content.replace(/\n/g, ''));
    return decodeURIComponent(escape(raw));
  }

  function encodeGitHub(content) {
    return btoa(unescape(encodeURIComponent(content)));
  }

  // Coerce a raw YAML scalar string to JS value.
  // Double-quoted strings support JSON-compatible escapes (\n, \t, \\, \",
  // \uXXXX) so multi-line label fields round-trip cleanly. Single-quoted
  // strings use YAML's '' → ' convention. Unquoted scalars are bare.
  function coerceScalar(val) {
    val = val.trim();
    if (val.length >= 2 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
      // JSON.parse handles all standard escape sequences. Fall back to naive
      // quote-stripping if the string isn't JSON-legal (e.g. raw backslashes).
      try { return JSON.parse(val); } catch(e) { return val.slice(1, -1); }
    }
    if (val.length >= 2 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
      return val.slice(1, -1).replace(/''/g, "'");
    }
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(val)) return parseFloat(val);
    return val;
  }

  // Parse YAML frontmatter from markdown content.
  // Supports scalars and one nested shape: a key whose value is a list of mappings, e.g.
  //   containers:
  //     - location: Bench
  //       quantity: 2
  //     - location: Freezer -20C
  //       quantity: 5
  function parseFrontmatter(content) {
    var match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: content };
    var meta = {};
    var lines = match[1].split('\n');
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      // List-of-mappings header: "key:" with no value, followed by "- key: val" lines
      // (either at column 0 or indented — both YAML styles are accepted).
      var header = line.match(/^(\w[\w_]*)\s*:\s*$/);
      if (header && i + 1 < lines.length && /^\s*-\s/.test(lines[i + 1])) {
        var listKey = header[1];
        var arr = [];
        i++;
        var current = null;
        while (i < lines.length && /^\s*(-\s|\s)/.test(lines[i]) && lines[i].trim() !== '') {
          var itemStart = lines[i].match(/^\s*-\s+(\w[\w_]*)\s*:\s*(.*)$/);
          var itemCont  = lines[i].match(/^\s+(\w[\w_]*)\s*:\s*(.*)$/);
          if (itemStart) {
            if (current) arr.push(current);
            current = {};
            current[itemStart[1]] = coerceScalar(itemStart[2]);
          } else if (itemCont && current) {
            current[itemCont[1]] = coerceScalar(itemCont[2]);
          }
          i++;
        }
        if (current) arr.push(current);
        meta[listKey] = arr;
        continue;
      }
      var m = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
      if (m) meta[m[1]] = coerceScalar(m[2]);
      i++;
    }
    return { meta: meta, body: match[2] };
  }

  // Serialize metadata back to YAML frontmatter + body. Supports scalars and
  // arrays of plain objects (rendered as a YAML list of mappings).
  function buildFrontmatter(meta, body) {
    var lines = ['---'];
    Object.keys(meta).forEach(function(key) {
      var val = meta[key];
      if (val === undefined || val === null || val === '') return;
      if (Array.isArray(val)) {
        if (val.length === 0) return;
        lines.push(key + ':');
        val.forEach(function(item) {
          if (item && typeof item === 'object') {
            var first = true;
            Object.keys(item).forEach(function(k) {
              var v = item[k];
              if (v === undefined || v === null || v === '') return;
              var serialized = (typeof v === 'number' || typeof v === 'boolean')
                ? String(v)
                : JSON.stringify(String(v));
              lines.push((first ? '  - ' : '    ') + k + ': ' + serialized);
              first = false;
            });
          }
        });
        return;
      }
      if (typeof val === 'number' || typeof val === 'boolean') {
        lines.push(key + ': ' + val);
      } else {
        // JSON.stringify handles all escapes (\n, \t, \\, \", \u....), which
        // YAML double-quoted strings also accept. Round-trips cleanly with
        // coerceScalar above.
        lines.push(key + ': ' + JSON.stringify(String(val)));
      }
    });
    lines.push('---');
    lines.push('');
    return lines.join('\n') + (body || '');
  }

  // ── Init ──
  function init() {
    checkPasswordGate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Image post-processing for rendered markdown ──
  // Resolves relative image/video paths and adds GitHub API fallback for private repos
  function postProcessImages(el) {
    if (!el) return;
    var mediaBase = BASE;

    // Resolve relative image paths to GitHub Pages URLs
    el.querySelectorAll('img').forEach(function(img) {
      var src = img.getAttribute('src') || '';
      if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
        img.src = mediaBase + src;
      }
    });

    // Resolve relative video paths
    el.querySelectorAll('video source, video').forEach(function(v) {
      var src = v.getAttribute('src') || '';
      if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
        v.src = mediaBase + src;
        if (v.parentElement && v.parentElement.tagName === 'VIDEO') v.parentElement.load();
      }
    });

    // If image fails from Pages (not deployed yet), fetch via GitHub API.
    // Use a capture-phase listener on the container so it catches errors from
    // images added later AND images that fail before per-element listeners
    // could be attached (race condition with innerHTML rendering).
    _setupRenderedImageFallback(el, mediaBase);
  }

  // ── Rendered-view image fallback (capture-phase, race-safe) ──
  // Attaches once per container. When any <img> inside fires an error,
  // fetches the image via the authenticated GitHub API and swaps in a data URL.
  function _setupRenderedImageFallback(containerEl, mediaBase) {
    if (!containerEl || containerEl._imgFallbackSetup) return;
    containerEl._imgFallbackSetup = true;

    function tryApiFallback(img) {
      if (img.dataset.apiFallback) return;
      img.dataset.apiFallback = '1';
      var src = img.getAttribute('src') || '';
      var relPath = '';
      if (src.includes('/images/')) {
        relPath = 'images/' + src.split('/images/').pop();
      } else if (mediaBase && src.startsWith(mediaBase)) {
        relPath = src.replace(mediaBase, '');
      }
      if (relPath && relPath.startsWith('images/') && window.Lab && window.Lab.gh && window.Lab.gh.isLoggedIn()) {
        fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/docs/' + relPath + '?ref=' + window.Lab.gh.BRANCH, {
          headers: { 'Authorization': 'Bearer ' + window.Lab.gh.getToken(), 'Accept': 'application/vnd.github.v3+json' }
        }).then(function(r) { return r.ok ? r.json() : null; }).then(function(data) {
          if (data && data.content) {
            var ext = relPath.split('.').pop().toLowerCase();
            var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            img.src = 'data:' + mime + ';base64,' + data.content.replace(/\n/g, '');
          }
        }).catch(function() {});
      }
    }

    // Capture-phase listener catches errors from future/dynamic images too
    containerEl.addEventListener('error', function(e) {
      if (e.target && e.target.tagName === 'IMG') tryApiFallback(e.target);
    }, true);

    // Retry any images that already failed before the listener was attached
    containerEl.querySelectorAll('img').forEach(function(img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
        tryApiFallback(img);
      }
    });
  }

  // ── Frontmatter metadata bar (#46) ──
  // Renders a compact row of pill-shaped field badges from a parsed
  // frontmatter object. Used by protocols, wiki, notebooks, and projects
  // to show type/author/dates/status in view mode. Fields that are empty,
  // or in the skip list (title is already the h1, legacy IDs are noise)
  // are omitted. Keeps the bar light — one line of pills, not a table.
  var FM_SKIP = { title: 1, legacy_inventory_id: 1, need_more: 1 };

  function renderFrontmatterBar(meta) {
    if (!meta || typeof meta !== 'object') return '';
    var keys = Object.keys(meta).filter(function(k) {
      if (FM_SKIP[k]) return false;
      var v = meta[k];
      if (v == null || v === '' || v === false) return false;
      return true;
    });
    if (!keys.length) return '';

    var typeConfig = (window.Lab && window.Lab.types && window.Lab.types.get)
      ? window.Lab.types.get(meta.type) : null;
    var typeColor = (typeConfig && typeConfig.color) || '#6b7280';
    var typeIcon = (typeConfig && typeConfig.icon) || '';
    var typeLabel = (typeConfig && typeConfig.label) || meta.type || '';

    var pills = [];
    if (meta.type) {
      pills.push(
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;' +
        'border-radius:12px;font-size:11px;font-weight:600;' +
        'background:' + typeColor + '15;color:' + typeColor + ';' +
        'border:1px solid ' + typeColor + '30">' +
        typeIcon + ' ' + escHtml(typeLabel) + '</span>'
      );
    }

    keys.forEach(function(k) {
      if (k === 'type') return;
      var v = meta[k];
      var label = k.replace(/_/g, ' ');
      var valStr;
      if (Array.isArray(v)) {
        valStr = v.map(function(item) { return escHtml(String(item)); }).join(', ');
      } else if (typeof v === 'object') {
        return; // skip nested objects
      } else {
        valStr = escHtml(String(v));
      }
      pills.push(
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;' +
        'border-radius:6px;font-size:11px;color:#4b5563;background:#f3f4f6">' +
        '<span style="font-weight:600;color:#9ca3af">' + escHtml(label) + '</span> ' + valStr + '</span>'
      );
    });

    return '<div class="frontmatter-bar" style="display:flex;flex-wrap:wrap;gap:6px;' +
      'padding:10px 0;margin-bottom:8px;font-family:inherit">' +
      pills.join('') + '</div>';
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.BASE = BASE;
  window.Lab.showToast = showToast;
  window.Lab.escHtml = escHtml;
  window.Lab.slugify = slugify;
  window.Lab.timeAgo = timeAgo;
  window.Lab.decodeGitHub = decodeGitHub;
  window.Lab.encodeGitHub = encodeGitHub;
  window.Lab.parseFrontmatter = parseFrontmatter;
  window.Lab.buildFrontmatter = buildFrontmatter;
  window.Lab.postProcessImages = postProcessImages;
  window.Lab.renderFrontmatterBar = renderFrontmatterBar;
})();
