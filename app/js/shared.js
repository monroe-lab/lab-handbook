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
    // Click-to-dismiss for impatient users; errors also dismiss on click.
    el.style.cursor = 'pointer';
    el.addEventListener('click', function() {
      el.style.opacity = '0';
      setTimeout(function() { el.remove(); }, 300);
    });
    container.appendChild(el);
    // Success toasts fade after 3s; errors linger 6s so Grey can read them;
    // info defaults to 4s. Explicit duration argument still overrides.
    if (duration == null) {
      duration = type === 'error' ? 6000 : type === 'success' ? 3000 : 4000;
    }
    setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, duration);
  }

  // ── Utility Functions ──
  // Strip Unicode bidi override / isolate control characters before HTML
  // escaping. Without this, an RLO (U+202E) inside a title flips the rest of
  // the string visually — a "Trojan Source" attack that lets malicious or
  // pasted text disguise itself in pills, breadcrumbs, and references panes.
  // We keep regular RTL letters (Arabic/Hebrew) intact and only strip the
  // 9 explicit bidi-formatting code points: LRE/RLE/PDF/LRO/RLO + LRI/RLI/FSI/PDI.
  var BIDI_CONTROL_RE = /[‪-‮⁦-⁩]/g;
  function escHtml(s) {
    var safe = String(s == null ? '' : s).replace(BIDI_CONTROL_RE, '');
    var d = document.createElement('div');
    d.textContent = safe;
    return d.innerHTML;
  }

  function slugify(name) {
    // Cap at 80 chars. Linux ext4 filenames max out at 255 bytes; GitHub Actions
    // runners on Ubuntu fail checkout if any tracked path exceeds that. macOS
    // APFS allows ~1000, so a long title commits locally but breaks the deploy.
    var s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-');
    if (s.length > 80) s = s.slice(0, 80).replace(/-+$/, '');
    return s;
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
    var rawIcon = (typeConfig && typeConfig.icon) || '';
    var typeIcon = (window.Lab.types && window.Lab.types.renderIcon) ? window.Lab.types.renderIcon(rawIcon) : rawIcon;
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
      function urlOrText(s) {
        var raw = String(s);
        if (/^https?:\/\//i.test(raw)) {
          return '<a href="' + escHtml(raw) + '" target="_blank" rel="noopener" ' +
            'style="color:#0d8ea2;text-decoration:none;word-break:break-all" ' +
            'title="' + escHtml(raw) + '">' + escHtml(raw) + '</a>';
        }
        return escHtml(raw);
      }
      if (Array.isArray(v)) {
        valStr = v.map(function(item) { return urlOrText(item); }).join(', ');
      } else if (typeof v === 'object') {
        return; // skip nested objects
      } else {
        valStr = urlOrText(v);
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

  // ── In-app modal dialogs ──
  // Replaces native confirm/prompt with styled modals. Returns a Promise.
  //
  // Lab.modal.confirm({ title, message, confirmText, danger }) → Promise<bool>
  // Lab.modal.prompt({ title, message, placeholder, defaultValue }) → Promise<string|null>
  // Lab.modal.form({ title, fields: [{key,label,type,default,placeholder,options}] }) → Promise<obj|null>

  var _modalZ = 11000; // above editor-modal overlay

  function _modalBase(innerHtml) {
    return new Promise(function(resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'lab-modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:' + _modalZ +
        ';background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:labModalFadeIn .15s ease';
      var modal = document.createElement('div');
      modal.className = 'lab-modal';
      modal.style.cssText = 'background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.2);' +
        'padding:24px;width:420px;max-width:90vw;max-height:80vh;overflow:auto;animation:labModalSlideIn .2s ease';
      modal.innerHTML = innerHtml;
      overlay.appendChild(modal);

      // Inject keyframe animation (once)
      if (!document.getElementById('lab-modal-keyframes')) {
        var css = document.createElement('style');
        css.id = 'lab-modal-keyframes';
        css.textContent =
          '@keyframes labModalFadeIn{from{opacity:0}to{opacity:1}}' +
          '@keyframes labModalSlideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}';
        document.head.appendChild(css);
      }

      // Prevent backdrop close on drag-out (same pattern as editor-modal)
      var _mdTarget = null;
      overlay.addEventListener('mousedown', function(e) { _mdTarget = e.target; });
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay && _mdTarget === overlay) { cleanup(null); }
        _mdTarget = null;
      });

      document.body.appendChild(overlay);

      // Focus first input
      var firstInput = modal.querySelector('input,textarea,select');
      if (firstInput) setTimeout(function() { firstInput.focus(); if (firstInput.select) firstInput.select(); }, 50);

      // Escape to cancel
      function onKey(e) { if (e.key === 'Escape') cleanup(null); }
      document.addEventListener('keydown', onKey);

      function cleanup(val) {
        document.removeEventListener('keydown', onKey);
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.remove(); }, 150);
        resolve(val);
      }

      // Expose cleanup to inner buttons
      modal._cleanup = cleanup;
    });
  }

  var _inputStyle = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;' +
    'font-family:inherit;box-sizing:border-box;outline:none;transition:border-color .15s;';
  var _btnBase = 'padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;';
  var _btnCancel = _btnBase + 'border:1px solid #ddd;background:#fff;color:#374151;';
  var _btnPrimary = _btnBase + 'border:none;background:#009688;color:#fff;';
  var _btnDanger = _btnBase + 'border:none;background:#ef4444;color:#fff;';

  var modal = {
    confirm: function(opts) {
      opts = opts || {};
      var title = opts.title || 'Confirm';
      var message = opts.message || 'Are you sure?';
      var confirmText = opts.confirmText || 'Confirm';
      var cancelText = opts.cancelText || 'Cancel';
      var danger = opts.danger;
      var btnStyle = danger ? _btnDanger : _btnPrimary;

      var html =
        '<h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1a1a">' + escapeHtml(title) + '</h3>' +
        '<p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.5;white-space:pre-wrap">' + escapeHtml(message) + '</p>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px">' +
          '<button class="lab-modal-cancel" style="' + _btnCancel + '">' + escapeHtml(cancelText) + '</button>' +
          '<button class="lab-modal-ok" style="' + btnStyle + '">' + escapeHtml(confirmText) + '</button>' +
        '</div>';

      return _modalBase(html).then(function(val) {
        // val is set by button clicks, null by backdrop/escape
        return val === true;
      });

      function escapeHtml(s) { return escHtml(s); }
    },

    prompt: function(opts) {
      opts = opts || {};
      var title = opts.title || '';
      var message = opts.message || '';
      var placeholder = opts.placeholder || '';
      var defaultValue = opts.defaultValue || '';

      var html =
        (title ? '<h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">' + escHtml(title) + '</h3>' : '') +
        (message ? '<p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.4">' + escHtml(message) + '</p>' : '') +
        '<input type="text" class="lab-modal-input" style="' + _inputStyle + 'margin-bottom:16px" ' +
          'placeholder="' + escHtml(placeholder) + '" value="' + escHtml(defaultValue) + '">' +
        '<div style="display:flex;justify-content:flex-end;gap:8px">' +
          '<button class="lab-modal-cancel" style="' + _btnCancel + '">Cancel</button>' +
          '<button class="lab-modal-ok" style="' + _btnPrimary + '">OK</button>' +
        '</div>';

      return _modalBase(html);
    },

    // Multi-field form. fields: [{key, label, type:'text'|'select'|'textarea', default, placeholder, options:[{value,label}]}]
    form: function(opts) {
      opts = opts || {};
      var title = opts.title || '';
      var message = opts.message || '';
      var fields = opts.fields || [];
      var submitText = opts.submitText || 'Create';

      var html = '';
      if (title) html += '<h3 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1a1a1a">' + escHtml(title) + '</h3>';
      if (message) html += '<p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.4">' + escHtml(message) + '</p>';

      fields.forEach(function(f) {
        var fieldId = 'lab-modal-field-' + escHtml(f.key);
        var hideStyle = f.show_when ? 'display:none;' : '';
        html += '<div id="' + fieldId + '" data-modal-field="' + escHtml(f.key) + '"' +
          (f.show_when ? ' data-show-when-key="' + escHtml(f.show_when.key) + '" data-show-when-value="' + escHtml(f.show_when.value) + '"' : '') +
          ' style="margin-bottom:12px;' + hideStyle + '">';
        html += '<label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px">' + escHtml(f.label || f.key) + '</label>';
        if (f.type === 'select' && f.options) {
          html += '<select data-modal-key="' + escHtml(f.key) + '" style="' + _inputStyle + '">';
          f.options.forEach(function(o) {
            var sel = (o.value === (f.default || '')) ? ' selected' : '';
            html += '<option value="' + escHtml(o.value) + '"' + sel + '>' + escHtml(o.label || o.value) + '</option>';
          });
          html += '</select>';
        } else if (f.type === 'textarea') {
          var taAttr = f.wikilinkAutocomplete ? ' data-wikilink-autocomplete="1"' : '';
          var minH = f.minHeight || '60px';
          // Monospace only when markdown-flavored (wikilinkAutocomplete implies body text).
          var taExtra = f.wikilinkAutocomplete
            ? 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5;'
            : '';
          html += '<textarea data-modal-key="' + escHtml(f.key) + '"' + taAttr + ' style="' + _inputStyle + 'min-height:' + minH + ';resize:vertical;' + taExtra + '" placeholder="' + escHtml(f.placeholder || '') + '">' + escHtml(f.default || '') + '</textarea>';
        } else if (f.type === 'date') {
          html += '<input type="date" data-modal-key="' + escHtml(f.key) + '" style="' + _inputStyle + '" ' +
            'value="' + escHtml(f.default || '') + '">';
        } else {
          var inAttr = f.wikilinkAutocomplete ? ' data-wikilink-autocomplete="1"' : '';
          html += '<input type="text" data-modal-key="' + escHtml(f.key) + '"' + inAttr + ' style="' + _inputStyle + '" ' +
            'placeholder="' + escHtml(f.placeholder || '') + '" value="' + escHtml(f.default || '') + '">';
        }
        html += '</div>';
      });

      html += '<div style="display:flex;justify-content:flex-end;gap:8px">' +
        '<button class="lab-modal-cancel" style="' + _btnCancel + '">Cancel</button>' +
        '<button class="lab-modal-ok" style="' + _btnPrimary + '">' + escHtml(submitText) + '</button>' +
      '</div>';

      return _modalBase(html);
    },
  };

  // Wire up buttons after modal is in DOM (delegated via MutationObserver
  // would be complex — instead, _modalBase returns a promise and we
  // override it here with button wiring in a microtask).
  var _origModalBase = _modalBase;
  _modalBase = function(html) {
    return new Promise(function(resolve) {
      _origModalBase(html).then(resolve);
      // Wire buttons after DOM insertion (next microtask)
      setTimeout(function() {
        var overlay = document.querySelector('.lab-modal-overlay:last-of-type');
        if (!overlay) return;
        var m = overlay.querySelector('.lab-modal');
        var cleanup = m._cleanup;

        var cancelBtn = m.querySelector('.lab-modal-cancel');
        var okBtn = m.querySelector('.lab-modal-ok');

        if (cancelBtn) cancelBtn.onclick = function() { cleanup(null); };

        if (okBtn) {
          okBtn.onclick = function() {
            // Check if it's a prompt (single input)
            var singleInput = m.querySelector('.lab-modal-input');
            if (singleInput) {
              cleanup(singleInput.value);
              return;
            }
            // Check if it's a form (multiple data-modal-key fields)
            var formFields = m.querySelectorAll('[data-modal-key]');
            if (formFields.length) {
              var result = {};
              formFields.forEach(function(f) {
                // Skip values from fields hidden by show_when — they're irrelevant
                var wrapper = f.closest('[data-modal-field]');
                if (wrapper && wrapper.style.display === 'none') {
                  result[f.getAttribute('data-modal-key')] = '';
                  return;
                }
                result[f.getAttribute('data-modal-key')] = f.value;
              });
              cleanup(result);
              return;
            }
            // It's a confirm
            cleanup(true);
          };
        }

        // Enter key submits prompt/form
        m.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (okBtn) okBtn.click();
          }
        });

        // Focus styling on inputs
        m.querySelectorAll('input,textarea,select').forEach(function(el) {
          el.addEventListener('focus', function() { el.style.borderColor = '#009688'; });
          el.addEventListener('blur', function() { el.style.borderColor = '#ddd'; });
        });

        // Wire wikilink [[ autocomplete on any field marked with
        // data-wikilink-autocomplete. Detach on modal cleanup so we don't
        // leak listeners onto elements that are about to be removed.
        if (window.Lab && Lab.wikilinkAutocomplete && Lab.wikilinkAutocomplete.attachTextInput) {
          var wlaFields = m.querySelectorAll('[data-wikilink-autocomplete]');
          wlaFields.forEach(function(el) { Lab.wikilinkAutocomplete.attachTextInput(el); });
          if (wlaFields.length) {
            var origCleanup = m._cleanup;
            m._cleanup = function(v) {
              wlaFields.forEach(function(el) { Lab.wikilinkAutocomplete.detachTextInput(el); });
              origCleanup(v);
            };
          }
        }

        // Conditional visibility: a field with data-show-when-key/value is shown
        // only when the controlling field's value matches. Used by the calendar
        // form to hide "Repeat Until" when "Does not repeat" is selected.
        var conditionals = m.querySelectorAll('[data-show-when-key]');
        if (conditionals.length) {
          var applyConditionals = function() {
            conditionals.forEach(function(div) {
              var ctlKey = div.getAttribute('data-show-when-key');
              var want = div.getAttribute('data-show-when-value');
              var ctl = m.querySelector('[data-modal-key="' + ctlKey + '"]');
              if (!ctl) return;
              // show_when_value can be a comma-separated list ("daily,weekly")
              var wants = want.split(',').map(function(s) { return s.trim(); });
              var match = wants.indexOf(ctl.value) !== -1;
              // Negation: prefix with ! to invert
              var negated = wants.length === 1 && wants[0].charAt(0) === '!';
              if (negated) match = ctl.value !== wants[0].slice(1);
              div.style.display = match ? '' : 'none';
            });
          };
          // Watch all controls referenced by show_when
          var ctlKeys = {};
          conditionals.forEach(function(div) {
            ctlKeys[div.getAttribute('data-show-when-key')] = true;
          });
          Object.keys(ctlKeys).forEach(function(k) {
            var ctl = m.querySelector('[data-modal-key="' + k + '"]');
            if (ctl) ctl.addEventListener('change', applyConditionals);
          });
          applyConditionals();
        }
      }, 0);
    });
  };

  // Turn a raw fetch/loadDoc error into a user-facing message.
  // - 404s say the document is missing (likely renamed/deleted) instead of
  //   exposing the full "docs/.../foo.md (HTTP 404)" path.
  // - Strips a redundant "Failed to load" prefix so callers can safely wrap
  //   the result in "Failed to load: …" without doubling up.
  function formatLoadError(err) {
    var raw = (err && err.message) ? err.message : String(err || '');
    if (/HTTP 404|\(404\)/.test(raw)) {
      return 'Document not found. It may have been renamed or deleted.';
    }
    return raw.replace(/^Failed to load\s+/i, '');
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
  window.Lab.formatLoadError = formatLoadError;
  window.Lab.modal = modal;
})();
