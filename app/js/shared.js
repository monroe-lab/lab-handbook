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
    if (sessionStorage.getItem('monroe-lab-auth') === 'true') return;

    var gate = document.createElement('div');
    gate.id = 'password-gate';
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
    document.body.prepend(gate);

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
          gate.remove();
        } else {
          document.getElementById('pw-err').style.display = 'block';
          input.value = '';
          input.focus();
        }
      });
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

  // Parse YAML frontmatter from markdown content
  function parseFrontmatter(content) {
    var match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: content };
    var meta = {};
    match[1].split('\n').forEach(function(line) {
      var m = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
      if (m) {
        var val = m[2].trim();
        // Strip quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Parse numbers
        if (/^\d+(\.\d+)?$/.test(val)) val = parseFloat(val);
        meta[m[1]] = val;
      }
    });
    return { meta: meta, body: match[2] };
  }

  // Serialize metadata back to YAML frontmatter + body
  function buildFrontmatter(meta, body) {
    var lines = ['---'];
    Object.keys(meta).forEach(function(key) {
      var val = meta[key];
      if (val === undefined || val === null || val === '') return;
      if (typeof val === 'number') {
        lines.push(key + ': ' + val);
      } else {
        lines.push(key + ': "' + String(val).replace(/"/g, '\\"') + '"');
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

    // If image fails from Pages (not deployed yet), fetch via GitHub API
    el.querySelectorAll('img').forEach(function(img) {
      img.addEventListener('error', function() {
        if (img.dataset.retried) return;
        img.dataset.retried = '1';
        var src = img.getAttribute('src') || '';
        var relPath = src.replace(mediaBase, '');
        if (relPath.startsWith('images/') && window.Lab && window.Lab.gh && window.Lab.gh.isLoggedIn()) {
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
      });
    });
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
})();
