/* Monroe Lab – WYSIWYG Editor Modal
   Two modes:
   - popup: overlay modal for inventory items, people, projects, stocks
   - fullpage: replaces content area for protocols (called by protocols.html)

   Dependencies: shared.js, github-api.js, wikilinks.js
   CDN: Toast UI Editor (loaded on demand)
*/
(function() {
  'use strict';

  function isMobile() { return window.innerWidth <= 768; }

  var TOAST_CSS = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';
  var TOAST_JS = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
  var toastLoaded = false;
  var toastLoadPromise = null;

  // Field schemas come from the unified type system (types.js)
  function getSchema(type) {
    return window.Lab.types ? window.Lab.types.getFields(type) : [];
  }

  // ── Load Toast UI Editor on demand ──
  function loadToast() {
    if (toastLoaded) return Promise.resolve();
    if (toastLoadPromise) return toastLoadPromise;

    toastLoadPromise = new Promise(function(resolve, reject) {
      // CSS
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = TOAST_CSS;
      document.head.appendChild(link);

      // JS
      var script = document.createElement('script');
      script.src = TOAST_JS;
      script.onload = function() { toastLoaded = true; resolve(); };
      script.onerror = function() { reject(new Error('Failed to load Toast UI Editor')); };
      document.head.appendChild(script);
    });
    return toastLoadPromise;
  }

  // ── Toast UI Editor overrides (injected once) ──
  var editorCssInjected = false;
  function injectEditorCSS() {
    if (editorCssInjected) return;
    editorCssInjected = true;
    var style = document.createElement('style');
    style.textContent = [
      '.em-surface .toastui-editor-defaultUI{border:none!important}',
      '.em-surface .toastui-editor-defaultUI-toolbar{border-bottom:1px solid var(--grey-200)!important;background:var(--grey-50)!important;padding:4px 8px!important;overflow:visible!important}',
      '.em-surface .toastui-editor-toolbar{flex-wrap:wrap!important;overflow:visible!important;gap:2px 0!important}',
      '.em-surface .toastui-editor-toolbar-group{flex-wrap:wrap!important}',
      '.em-surface .toastui-editor-toolbar-icons{border:none!important;border-radius:4px!important;width:32px!important;height:32px!important;background-color:transparent!important}',
      '.em-surface .toastui-editor-toolbar-icons:hover{background-color:var(--grey-200)!important}',
      '.em-surface .toastui-editor-ww-container{background:#fff!important}',
      '.em-surface .toastui-editor-contents{padding:24px 32px!important;font-family:Inter,sans-serif!important;font-size:15px!important;line-height:1.7!important;color:var(--grey-900)!important}',
      '.em-surface .toastui-editor-contents h1{font-size:26px!important;font-weight:700!important;margin-top:24px!important;margin-bottom:10px!important;border-bottom:2px solid var(--grey-200)!important;padding-bottom:8px!important}',
      '.em-surface .toastui-editor-contents h2{font-size:21px!important;font-weight:600!important;margin-top:20px!important;margin-bottom:8px!important}',
      '.em-surface .toastui-editor-contents h3{font-size:17px!important;font-weight:600!important;margin-top:16px!important}',
      '.em-surface table,.em-surface .toastui-editor-contents table,.toastui-editor table{border-collapse:collapse!important;width:100%!important;table-layout:fixed!important}',
      '.em-surface td,.em-surface th,.em-surface .toastui-editor-contents td,.em-surface .toastui-editor-contents th,.toastui-editor td,.toastui-editor th{border:1px solid var(--grey-300)!important;padding:8px 12px!important;word-wrap:break-word!important;overflow-wrap:break-word!important;word-break:break-all!important;max-width:0!important}',
      '.em-surface .toastui-editor-contents thead th{background:var(--grey-50)!important;min-height:32px!important;min-width:60px!important;height:32px!important;cursor:text!important;color:var(--grey-900)!important}',
      '.em-surface .toastui-editor-contents thead th p{color:var(--grey-900)!important}',
      '.em-surface .toastui-editor-context-menu{display:none!important}',
      '.em-surface .toastui-editor-contents code{background:var(--grey-100)!important;padding:2px 6px!important;border-radius:4px!important;font-size:13px!important}',
      '.em-surface .toastui-editor-contents pre{background:var(--grey-900)!important;color:#e0e0e0!important;padding:16px!important;border-radius:8px!important;overflow-x:auto!important}',
      '.em-surface .toastui-editor-contents pre code{background:transparent!important;padding:0!important;color:inherit!important}',
      '.em-surface .toastui-editor-mode-switch{display:none!important}',
      // Popup modal styles
      '.em-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s}',
      '.em-overlay.open{opacity:1;pointer-events:auto}',
      '.em-modal{background:#fff;border-radius:12px;width:90%;max-width:620px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.2);transform:translateY(20px);transition:transform .2s}',
      '.em-overlay.open .em-modal{transform:translateY(0)}',
      '.em-modal-header{padding:16px 20px;border-bottom:1px solid var(--grey-200);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
      '.em-modal-header h2{font-size:17px;font-weight:600;margin:0}',
      '.em-modal-body{flex:1;overflow-y:auto;padding:0}',
      '.em-modal-footer{padding:12px 20px;border-top:1px solid var(--grey-200);display:flex;justify-content:flex-end;gap:8px;flex-shrink:0}',
      '.em-fields{padding:16px 20px;border-bottom:1px solid var(--grey-200)}',
      '.em-fields .form-row{display:flex;gap:12px}',
      '.em-fields .form-group{margin-bottom:12px}',
      '.em-rendered{padding:24px 32px;font-size:15px;line-height:1.7}',
      '.em-rendered h1{font-size:26px;font-weight:700;margin:20px 0 10px;border-bottom:2px solid var(--grey-200);padding-bottom:8px}',
      '.em-rendered h2{font-size:21px;font-weight:600;margin:18px 0 8px}',
      '.em-rendered h3{font-size:17px;font-weight:600;margin:14px 0 6px}',
      '.em-rendered table{border-collapse:collapse;width:100%;table-layout:fixed}',
      '.em-rendered td,.em-rendered th{border:1px solid var(--grey-300);padding:8px 12px;word-wrap:break-word;overflow-wrap:break-word;word-break:break-all}',
      '.em-rendered thead th{background:var(--grey-50)}',
      '.em-rendered code{background:var(--grey-100);padding:2px 6px;border-radius:4px;font-size:13px}',
      '.em-rendered pre{background:var(--grey-900);color:#e0e0e0;padding:16px;border-radius:8px;overflow-x:auto}',
      '.em-rendered pre code{background:transparent;padding:0;color:inherit}',
      '.em-rendered ul,.em-rendered ol{padding-left:24px;margin:8px 0}',
      '.em-rendered li{margin:4px 0}',
      '.em-rendered blockquote{border-left:4px solid var(--teal);padding:8px 16px;margin:12px 0;background:var(--teal-50);border-radius:0 8px 8px 0}',
      '.em-rendered img{max-width:100%;border-radius:8px;margin:8px 0}',
      '.em-rendered a{color:var(--teal-dark);text-decoration:underline}',
      '@media(max-width:768px){.em-modal{width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0}.em-fields .form-row{flex-direction:column;gap:0}.em-rendered{padding:16px}}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── marked.js loader ──
  var markedLoaded = false;
  var markedPromise = null;
  function loadMarked() {
    if (markedLoaded || (window.marked && window.marked.parse)) { markedLoaded = true; return Promise.resolve(); }
    if (markedPromise) return markedPromise;
    markedPromise = new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      s.onload = function() { markedLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return markedPromise;
  }

  // Preprocess admonitions: ??? variant "title" → <details> HTML
  // Supports ??? (collapsed) and ???+ (expanded)
  function preprocessAdmonitions(md) {
    // Match ??? or ???+ followed by type and optional "title", then indented block
    return md.replace(/^\?\?\?(\+?)\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, expanded, type, title, body) {
      var bodyMd = body.replace(/^    /gm, ''); // un-indent
      var openAttr = expanded ? ' open' : '';
      var typeClass = type || 'note';
      // We'll render the body markdown separately, but for now pass it through marked inline
      return '<details class="admonition admonition-' + typeClass + '"' + openAttr + '>' +
        '<summary>' + title + '</summary>\n\n' + bodyMd + '\n</details>\n\n';
    });
  }

  // ── Callout helpers ──
  // Callouts are stored as blockquotes with emoji prefixes: > ⚠️ **Title**
  // Toast UI handles blockquotes natively. renderMarkdown() renders them as
  // colored collapsible callouts in the read view.
  var ADM_ICONS = { variant: '\uD83D\uDD00', warning: '\u26A0\uFE0F', note: '\u2139\uFE0F', tip: '\uD83D\uDCA1' };

  // Convert legacy ??? syntax to blockquote format (one-way migration on edit)
  function migrateAdmonitions(md) {
    // Clean up broken remnants from previous conversion attempts
    md = md.replace(/<!-- adm-sep -->/g, '');
    md = md.replace(/\\> *(?:\uD83D\uDD00|\u26A0\uFE0F|\u2139\uFE0F|\uD83D\uDCA1)[^\n]*/gm, '');
    // Convert ??? blocks to blockquotes
    return md.replace(/^\?\?\?(\+?)\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, expanded, type, title, body) {
      var icon = ADM_ICONS[type] || '\u2139\uFE0F';
      var bodyLines = body.replace(/^    /gm, '').trimEnd();
      var lines = '> ' + icon + ' **' + title + '**';
      if (bodyLines) {
        lines += '\n' + bodyLines.split('\n').map(function(l) { return '> ' + l; }).join('\n');
      }
      return lines + '\n';
    });
  }

  // Render markdown to HTML (with wikilink + admonition preprocessing)
  // Supports both legacy ??? syntax AND blockquote callouts (> ⚠️ **Title**)
  var CALLOUT_COLORS = {
    '\uD83D\uDD00': 'variant',
    '\u26A0\uFE0F': 'warning',
    '\u2139\uFE0F': 'note',
    '\uD83D\uDCA1': 'tip',
  };
  async function renderMarkdown(md) {
    await loadMarked();
    var admonitions = [];

    // Extract legacy ??? blocks
    var processed = md.replace(/^\?\?\?(\+?)\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, expanded, type, title, body) {
      var bodyMd = body.replace(/^    /gm, '');
      var placeholder = '<!--admonition-' + admonitions.length + '-->';
      admonitions.push({ type: type, title: title, bodyMd: bodyMd });
      return placeholder + '\n\n';
    });

    // Extract blockquote callouts: > 🔀/⚠️/ℹ️/💡 **Title** followed by > body lines
    // Only captures consecutive > lines (NOT blank lines — those separate blockquotes)
    processed = processed.replace(/^> *(\uD83D\uDD00|\u26A0\uFE0F|\u2139\uFE0F|\uD83D\uDCA1) \*\*([^*]+)\*\* *\n((?:>.*\n?)*)/gm, function(match, icon, title, bodyBlock) {
      var type = CALLOUT_COLORS[icon] || 'note';
      var bodyMd = bodyBlock.replace(/^>\s?/gm, '').trim();
      // Preserve line breaks — markdown collapses consecutive lines into one paragraph
      bodyMd = bodyMd.replace(/\n/g, '  \n');
      var placeholder = '<!--admonition-' + admonitions.length + '-->';
      admonitions.push({ type: type, title: title.trim(), bodyMd: bodyMd });
      return placeholder + '\n\n';
    });

    // Strip standalone <br> tags that Toast UI inserts (breaks table parsing)
    processed = processed.replace(/^\s*<br>\s*$/gm, '');

    // Preprocess wikilinks
    processed = window.Lab.wikilinks ? window.Lab.wikilinks.preprocess(processed) : processed;
    var html = marked.parse(processed, { breaks: true });

    // Replace placeholders with rendered callouts
    admonitions.forEach(function(a, i) {
      var bodyProcessed = window.Lab.wikilinks ? window.Lab.wikilinks.preprocess(a.bodyMd) : a.bodyMd;
      var bodyHtml = marked.parse(bodyProcessed);
      var adHtml = '<details class="admonition admonition-' + (a.type || 'note') + '" open>' +
        '<summary>' + a.title + '</summary>' +
        (a.bodyMd.trim() ? '<div class="admonition-body">' + bodyHtml + '</div>' : '') + '</details>';
      html = html.replace('<!--admonition-' + i + '-->', adHtml);
    });

    // Fix obj:// and inventory:// links that marked didn't parse (e.g. inside table cells)
    html = html.replace(/\[([^\]]+)\]\(obj:\/\/([^)]+)\)/g, '<a href="obj://$2">$1</a>');
    html = html.replace(/\[([^\]]+)\]\(inventory:\/\/([^)]+)\)/g, '<a href="inventory://$2">$1</a>');

    // Open external links in new tab
    html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');

    return html;
  }

  // ── Popup Mode ──
  var overlayEl = null;
  var currentEditor = null;

  var currentState = null; // { path, sha, meta, body, editing }

  function createOverlay() {
    if (overlayEl) return overlayEl;
    injectEditorCSS();

    overlayEl = document.createElement('div');
    overlayEl.className = 'em-overlay';
    overlayEl.innerHTML =
      '<div class="em-modal">' +
        '<div class="em-modal-header">' +
          '<h2 id="em-title">Loading...</h2>' +
          '<button class="modal-close" id="em-close"><span class="material-icons-outlined">close</span></button>' +
        '</div>' +
        '<div class="em-modal-body">' +
          '<div id="em-fields" class="em-fields" style="display:none"></div>' +
          '<div id="em-content"></div>' +
        '</div>' +
        '<div class="em-modal-footer" id="em-footer">' +
          '<button class="btn btn-outline" id="em-cancel">Close</button>' +
          '<button class="btn btn-outline" id="em-edit-toggle" style="display:none"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>' +
          '<button class="btn btn-primary" id="em-save" style="display:none"><span class="material-icons-outlined" style="font-size:16px">save</span> Save</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlayEl);

    // Close handlers
    document.getElementById('em-close').onclick = close;
    document.getElementById('em-cancel').onclick = close;
    overlayEl.addEventListener('click', function(e) { if (e.target === overlayEl) close(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlayEl.classList.contains('open')) close();
    });

    // Edit toggle
    document.getElementById('em-edit-toggle').onclick = function() {
      if (currentState && !currentState.editing) {
        startEditing();
      } else {
        stopEditing();
      }
    };

    // Save
    document.getElementById('em-save').onclick = save;

    return overlayEl;
  }

  async function openPopup(filePath) {
    createOverlay();
    var gh = window.Lab.gh;
    if (!gh) { window.Lab.showToast('GitHub API not loaded', 'error'); return; }

    // Reset state
    currentState = { path: filePath, sha: null, meta: {}, body: '', editing: false };
    document.getElementById('em-title').textContent = 'Loading...';
    document.getElementById('em-fields').style.display = 'none';
    document.getElementById('em-fields').innerHTML = '';
    document.getElementById('em-content').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>';
    document.getElementById('em-edit-toggle').style.display = 'none';
    document.getElementById('em-save').style.display = 'none';
    overlayEl.classList.add('open');

    try {
      // Check localStorage cache first (written on save to avoid GitHub API delay)
      var cached = null;
      try {
        var fileCache = JSON.parse(localStorage.getItem('lab_file_cache')) || {};
        if (fileCache[filePath]) cached = fileCache[filePath];
      } catch(e) {}

      var result = await gh.fetchFile(filePath);
      currentState.sha = result.sha;

      // Use cached content if it's newer (GitHub API can lag after a commit)
      var content = result.content;
      if (cached && cached.savedAt && cached.content) {
        var age = Date.now() - cached.savedAt;
        if (age < 120000) content = cached.content; // use cache for up to 2 min
      }

      var parsed = window.Lab.parseFrontmatter(content);
      currentState.meta = parsed.meta;
      currentState.body = parsed.body;

      // Title
      var title = parsed.meta.title || filePath.split('/').pop().replace('.md', '');
      document.getElementById('em-title').textContent = title;

      // Show edit toggle
      if (gh.isLoggedIn()) {
        document.getElementById('em-edit-toggle').style.display = '';
      }

      // If logged in, go straight to edit mode
      if (gh.isLoggedIn()) {
        await startEditing();
      } else {
        // Read-only view for non-authenticated users
        renderFields(parsed.meta, false);
        var html = await renderMarkdown(parsed.body);
        var contentEl = document.getElementById('em-content');
        contentEl.innerHTML = '<div class="em-rendered">' + html + '</div>';
        if (window.Lab.wikilinks) {
          await window.Lab.wikilinks.processRendered(contentEl);
        }
      }
    } catch(e) {
      document.getElementById('em-content').innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><p>' + window.Lab.escHtml(e.message) + '</p></div>';
    }
  }

  function renderFields(meta, editable) {
    var type = meta.type || 'reagent';
    var schema = getSchema(type);
    if (!schema || schema.length === 0) {
      document.getElementById('em-fields').style.display = 'none';
      return;
    }

    var fieldsEl = document.getElementById('em-fields');
    fieldsEl.style.display = '';
    var html = '';

    // Group small fields into rows
    var row = [];
    schema.forEach(function(field) {
      if (field.type === 'hidden') return;

      var val = meta[field.key] !== undefined ? meta[field.key] : '';
      var id = 'em-f-' + field.key;

      if (editable) {
        var input = '';
        if (field.type === 'select') {
          input = '<select id="' + id + '" class="em-field-input" data-key="' + field.key + '">';
          (field.options || []).forEach(function(opt) {
            input += '<option value="' + opt + '"' + (String(val) === opt ? ' selected' : '') + '>' + opt + '</option>';
          });
          input += '</select>';
        } else if (field.type === 'number') {
          input = '<input type="number" id="' + id + '" class="em-field-input" data-key="' + field.key + '" value="' + val + '" step="any" min="0">';
        } else {
          input = '<input type="text" id="' + id + '" class="em-field-input" data-key="' + field.key + '" value="' + window.Lab.escHtml(String(val)) + '"' + (field.required ? ' required' : '') + '>';
        }
        var isSmall = field.type === 'number' || field.key === 'unit';
        if (isSmall) {
          row.push('<div class="form-group"><label>' + field.label + '</label>' + input + '</div>');
          if (row.length >= 3) {
            html += '<div class="form-row">' + row.join('') + '</div>';
            row = [];
          }
        } else {
          if (row.length) { html += '<div class="form-row">' + row.join('') + '</div>'; row = []; }
          html += '<div class="form-group"><label>' + field.label + '</label>' + input + '</div>';
        }
      } else {
        // Read-only display
        if (val === '' || val === undefined) return;
        html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px">' +
          '<span style="color:var(--grey-500);min-width:80px">' + field.label + '</span>' +
          '<span style="font-weight:500">' + window.Lab.escHtml(String(val)) + '</span>' +
          '</div>';
      }
    });
    if (row.length) html += '<div class="form-row">' + row.join('') + '</div>';

    fieldsEl.innerHTML = html;
  }

  async function startEditing() {
    if (!currentState) return;
    currentState.editing = true;

    // Switch fields to editable
    renderFields(currentState.meta, true);

    // Switch button states
    document.getElementById('em-edit-toggle').innerHTML = '<span class="material-icons-outlined" style="font-size:16px">visibility</span> View';
    document.getElementById('em-save').style.display = '';

    // Load Toast UI and init editor
    await loadToast();
    var contentEl = document.getElementById('em-content');
    contentEl.innerHTML = '<div class="em-surface" style="min-height:200px"></div>';
    var editorEl = contentEl.querySelector('.em-surface');

    // Convert [[wikilinks]] to standard links, resolve paths, and placeholder media before feeding to Toast UI
    var prepared = migrateAdmonitions(currentState.body);
    prepared = mediaToPlaceholders(prepared);
    prepared = loadImageSizes(prepared);
    prepared = await wikilinksToLinks(prepared);
    prepared = resolveImagePaths(prepared);

    currentEditor = new toastui.Editor({
      el: editorEl,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: '300px',
      initialValue: prepared,
      usageStatistics: false,
      toolbarItems: isMobile() ? [] :
        [['heading', 'bold', 'italic', 'strike'], ['hr', 'quote'], ['ul', 'ol', 'task'], ['table', 'link', 'code']],
    });

    // On mobile: hide native toolbar, add a toggle button to show it on demand
    if (isMobile()) setupMobileToolbarToggle(editorEl, editor);

    // Fix table header cells so they're editable, apply image sizes, set up image fallback
    setupEditorImageFallback(editorEl);
    setTimeout(function() {
      fixTableHeaders(editorEl);
      addTableContextMenu(editorEl, currentEditor);
      applyEditorImageSizes(editorEl);
      // Re-apply after images load (they may not exist in DOM yet at 300ms)
      setTimeout(function() { applyEditorImageSizes(editorEl); }, 700);
    }, 300);

    // Add category insert pills
    injectCategoryPills(editorEl, currentEditor);
  }

  async function stopEditing() {
    if (!currentState) return;

    // Capture edited values before switching
    if (currentState.editing && currentEditor) {
      currentState.body = getMarkdownClean(currentEditor);
      // Capture field values
      document.querySelectorAll('.em-field-input').forEach(function(input) {
        var key = input.dataset.key;
        var val = input.value;
        if (input.type === 'number' && val !== '') val = parseFloat(val);
        currentState.meta[key] = val;
      });
    }

    currentState.editing = false;
    currentEditor = null;

    // Switch back to read mode
    document.getElementById('em-edit-toggle').innerHTML = '<span class="material-icons-outlined" style="font-size:16px">edit</span> Edit';
    document.getElementById('em-save').style.display = 'none';

    renderFields(currentState.meta, false);

    var html = await renderMarkdown(currentState.body);
    var contentEl = document.getElementById('em-content');
    contentEl.innerHTML = '<div class="em-rendered">' + html + '</div>';
    if (window.Lab.wikilinks) {
      await window.Lab.wikilinks.processRendered(contentEl);
    }
  }

  async function save() {
    if (!currentState || !currentState.editing) return;
    var gh = window.Lab.gh;
    if (!gh || !gh.isLoggedIn()) { window.Lab.showToast('Sign in to save', 'error'); return; }

    // Collect field values
    document.querySelectorAll('.em-field-input').forEach(function(input) {
      var key = input.dataset.key;
      var val = input.value;
      if (input.type === 'number' && val !== '') val = parseFloat(val);
      currentState.meta[key] = val;
    });

    // Get markdown from editor (restore wikilink pills to [[slug]] syntax)
    if (currentEditor) {
      currentState.body = getMarkdownClean(currentEditor);
    }

    // Also include hidden fields from schema
    var schema = getSchema(currentState.meta.type || 'reagent');
    schema.forEach(function(f) {
      if (f.type === 'hidden' && f.value) {
        currentState.meta[f.key] = f.value;
      }
    });

    // Build full content
    var content = window.Lab.buildFrontmatter(currentState.meta, currentState.body);

    var saveBtn = document.getElementById('em-save');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">hourglass_empty</span> Saving...';

    try {
      var result = await gh.saveFile(currentState.path, content, currentState.sha,
        'Update ' + currentState.path.replace(/^docs\//, ''));
      currentState.sha = result.sha;
      window.Lab.showToast('Saved', 'success');

      // Cache the saved content locally so re-opening the item shows new values immediately
      try {
        var fileCache = JSON.parse(localStorage.getItem('lab_file_cache')) || {};
        fileCache[currentState.path] = { content: content, savedAt: Date.now() };
        localStorage.setItem('lab_file_cache', JSON.stringify(fileCache));
      } catch(e) {}

      // Update object index in-memory + localStorage (survives refresh without waiting for deploy)
      gh.patchObjectIndex(currentState.path, currentState.meta);

      // Fire custom event so parent app can refresh
      window.dispatchEvent(new CustomEvent('lab-file-saved', { detail: { path: currentState.path, meta: currentState.meta } }));

      // Switch back to view mode
      await stopEditing();
    } catch(e) {
      window.Lab.showToast('Save failed: ' + e.message, 'error');
    }

    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">save</span> Save';
  }

  function close() {
    if (overlayEl) {
      overlayEl.classList.remove('open');
    }
    if (currentEditor) {
      currentEditor = null;
    }
    currentState = null;
  }

  // ── Fullpage Mode (for protocols.html) ──
  // This is simpler: the protocols page manages its own layout.
  // We just provide the Toast UI init and save helpers.

  // Object link categories come from the unified type system (types.js)
  function getObjectTypes() { return window.Lab.types ? window.Lab.types.GROUPS : {}; }

  // ── Insert Link Modal ──
  var linkModalEl = null;
  var linkModalEditor = null;
  var linkModalCategory = null;
  var linkModalIndex = null;

  function createLinkModal() {
    if (linkModalEl) return linkModalEl;
    linkModalEl = document.createElement('div');
    linkModalEl.className = 'em-overlay';
    linkModalEl.id = 'em-link-modal';
    linkModalEl.style.zIndex = '10001';
    linkModalEl.innerHTML =
      '<div class="em-modal" style="max-width:560px">' +
        '<div class="em-modal-header">' +
          '<h2>Insert Object Link</h2>' +
          '<button class="modal-close" onclick="document.getElementById(\'em-link-modal\').classList.remove(\'open\')"><span class="material-icons-outlined">close</span></button>' +
        '</div>' +
        '<div class="em-modal-body" style="padding:0">' +
          '<div style="padding:12px 20px;border-bottom:1px solid var(--grey-200)">' +
            '<input type="text" id="em-link-search" placeholder="Search..." style="width:100%;padding:9px 12px;border:1px solid var(--grey-300);border-radius:var(--radius);font-family:inherit;font-size:14px;outline:none">' +
          '</div>' +
          '<div id="em-link-cats" style="display:flex;gap:6px;padding:12px 20px;flex-wrap:wrap"></div>' +
          '<div id="em-link-list" style="max-height:300px;overflow-y:auto;padding:0 20px 16px"></div>' +
          '<div id="em-link-create" style="display:none;padding:8px 20px 16px;border-top:1px solid var(--grey-200)">' +
            '<button class="btn btn-primary btn-sm" onclick="Lab.editorModal._createAndInsert()">Create "<span id="em-link-create-name"></span>" and insert</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    linkModalEl.addEventListener('click', function(e) { if (e.target === linkModalEl) linkModalEl.classList.remove('open'); });
    document.body.appendChild(linkModalEl);

    document.getElementById('em-link-search').addEventListener('input', filterLinkItems);

    return linkModalEl;
  }

  function openLinkModal(editor) {
    linkModalEditor = editor;
    createLinkModal();

    // Load index
    window.Lab.gh.fetchObjectIndex().then(function(idx) {
      linkModalIndex = idx;
      linkModalCategory = null;
      renderLinkCategories();
      document.getElementById('em-link-search').value = '';
      document.getElementById('em-link-list').innerHTML = '<div style="color:var(--grey-500);padding:16px;text-align:center">Select a category above</div>';
      document.getElementById('em-link-create').style.display = 'none';
      linkModalEl.classList.add('open');
      setTimeout(function() { document.getElementById('em-link-search').focus(); }, 100);
    });
  }

  function renderLinkCategories() {
    var el = document.getElementById('em-link-cats');
    el.innerHTML = Object.keys(getObjectTypes()).map(function(key) {
      var cfg = getObjectTypes()[key];
      var isActive = linkModalCategory === key;
      return '<button style="display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid ' + (isActive ? cfg.color : 'var(--grey-300)') + ';background:' + (isActive ? cfg.color + '15' : '#fff') + ';color:' + (isActive ? cfg.color : 'var(--grey-700)') + ';font-size:13px;font-weight:500;cursor:pointer;font-family:inherit" onclick="Lab.editorModal._selectCat(\'' + key + '\')">' +
        '<span class="material-icons-outlined" style="font-size:16px">' + cfg.icon + '</span>' + cfg.label + '</button>';
    }).join('');
  }

  function selectLinkCategory(key) {
    linkModalCategory = key;
    renderLinkCategories();
    document.getElementById('em-link-search').value = '';
    filterLinkItems();
  }

  function filterLinkItems() {
    if (!linkModalCategory || !linkModalIndex) return;
    var q = (document.getElementById('em-link-search').value || '').toLowerCase().trim();
    var cfg = getObjectTypes()[linkModalCategory];
    var items = linkModalIndex.filter(function(obj) { return cfg.types.indexOf(obj.type) !== -1; });
    if (q) {
      items = items.filter(function(obj) {
        return (obj.title || '').toLowerCase().includes(q) || (obj.type || '').toLowerCase().includes(q) || (obj.location || '').toLowerCase().includes(q);
      });
    }

    var list = document.getElementById('em-link-list');
    if (!items.length) {
      list.innerHTML = '<div style="color:var(--grey-500);padding:16px;text-align:center">No items found</div>';
    } else {
      var esc = window.Lab.escHtml;
      list.innerHTML = items.map(function(obj) {
        var slug = obj.path.replace(/\.md$/, '').split('/').pop();
        var meta = [obj.type || ''];
        if (obj.location) meta.push(obj.location);
        if (obj.quantity != null && obj.unit) meta.push(obj.quantity + ' ' + obj.unit);
        if (obj.role) meta.push(obj.role);
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--grey-100);cursor:pointer;border-radius:4px" onmouseover="this.style.background=\'var(--grey-50)\'" onmouseout="this.style.background=\'\'" onclick="Lab.editorModal._insertLink(\'' + esc(slug) + '\',\'' + esc(obj.title || slug) + '\')">' +
          '<span class="material-icons-outlined" style="font-size:20px;color:' + cfg.color + '">' + cfg.icon + '</span>' +
          '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500">' + esc(obj.title || slug) + '</div>' +
          '<div style="font-size:12px;color:var(--grey-500)">' + meta.map(esc).join(' \u00B7 ') + '</div></div></div>';
      }).join('');
    }

    // Show "create new" option
    var createEl = document.getElementById('em-link-create');
    if (q && cfg.dir && !items.some(function(obj) { return (obj.title || '').toLowerCase() === q; })) {
      document.getElementById('em-link-create-name').textContent = document.getElementById('em-link-search').value.trim();
      createEl.style.display = '';
    } else {
      createEl.style.display = 'none';
    }
  }

  var linkModalTextarea = null; // if linking into a textarea instead of Toast UI

  function insertLink(slug, title) {
    var wikitext = '[[' + slug + ']]';

    if (linkModalTextarea) {
      // Insert into a plain textarea
      var ta = linkModalTextarea;
      var pos = ta.selectionStart || ta.value.length;
      ta.value = ta.value.substring(0, pos) + wikitext + ta.value.substring(pos);
      ta.selectionStart = ta.selectionEnd = pos + wikitext.length;
      ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      linkModalTextarea = null;
    } else if (linkModalEditor) {
      // Switch to markdown mode to insert, then back to WYSIWYG so Toast UI
      // parses the link into a real <a> node (insertText just inserts raw text)
      linkModalEditor.changeMode('markdown');
      linkModalEditor.replaceSelection('[' + title + '](' + OBJ_LINK_PREFIX + slug + ')');
      linkModalEditor.changeMode('wysiwyg');
    }

    linkModalEl.classList.remove('open');
    window.Lab.showToast('Linked: ' + title, 'success');
  }

  function openLinkForTextarea(textarea, categoryKey) {
    linkModalTextarea = textarea;
    linkModalEditor = null;
    createLinkModal();
    window.Lab.gh.fetchObjectIndex().then(function(idx) {
      linkModalIndex = idx;
      linkModalCategory = categoryKey || null;
      renderLinkCategories();
      document.getElementById('em-link-search').value = '';
      if (categoryKey) {
        filterLinkItems();
      } else {
        document.getElementById('em-link-list').innerHTML = '<div style="color:var(--grey-500);padding:16px;text-align:center">Select a category above</div>';
      }
      document.getElementById('em-link-create').style.display = 'none';
      linkModalEl.classList.add('open');
      setTimeout(function() { document.getElementById('em-link-search').focus(); }, 100);
    });
  }

  async function createAndInsertLink() {
    var name = document.getElementById('em-link-search').value.trim();
    if (!name || !linkModalCategory) return;
    var cfg = getObjectTypes()[linkModalCategory];
    if (!cfg || !cfg.dir) return;

    var slug = window.Lab.slugify(name);
    var path = 'docs/' + cfg.dir + '/' + slug + '.md';
    var content = '---\ntype: ' + cfg.defaultType + '\ntitle: "' + name + '"\n---\n\n# ' + name + '\n';

    try {
      await window.Lab.gh.saveFile(path, content, null, 'Add ' + cfg.defaultType + ': ' + name);
      window.Lab.gh.patchObjectIndex(path, { type: cfg.defaultType, title: name });
      insertLink(slug, name);
      window.Lab.showToast('Created: ' + name, 'success');
      // Open the new item's editor so user can fill in details
      setTimeout(function() { openPopup(path); }, 300);
    } catch(e) {
      window.Lab.showToast('Failed: ' + e.message, 'error');
    }
  }

  // ── Mobile: strip all chrome, single floating + button with bottom sheet ──
  var _mobileSheet = null;
  var _mobileFab = null;
  var _mobileEditor = null;

  function setupMobileToolbarToggle(containerEl, editor) {
    _mobileEditor = editor;
    setTimeout(function() {
      var editorUI = containerEl.querySelector('.toastui-editor-defaultUI');
      if (!editorUI) return;

      // Hide ALL bars: toolbar, insert pills, media bar
      var toolbar = containerEl.querySelector('.toastui-editor-toolbar');
      if (toolbar) toolbar.style.display = 'none';

      // Hide insert + media bars when they get injected
      var hideInjected = new MutationObserver(function() {
        editorUI.querySelectorAll('div').forEach(function(d) {
          if (d.textContent.includes('Insert:') || d.textContent.includes('Media:')) {
            if (d.style.display !== 'none' && d !== toolbar && !d.closest('.mobile-sheet')) {
              d.style.display = 'none';
            }
          }
        });
      });
      hideInjected.observe(editorUI, { childList: true });
      // Also hide any already-injected bars
      setTimeout(function() {
        editorUI.querySelectorAll('div').forEach(function(d) {
          var text = d.textContent || '';
          if ((text.startsWith('Insert:') || text.startsWith('Media:')) && d !== toolbar && !d.closest('.mobile-sheet')) {
            d.style.display = 'none';
          }
        });
      }, 100);

      // Floating + button
      _mobileFab = document.createElement('button');
      _mobileFab.type = 'button';
      _mobileFab.innerHTML = '<span class="material-icons-outlined" style="font-size:24px">add</span>';
      _mobileFab.style.cssText = 'position:absolute;top:4px;right:4px;z-index:100;width:36px;height:36px;border-radius:50%;border:none;background:var(--teal);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);';
      _mobileFab.onclick = function(e) {
        e.preventDefault();
        toggleMobileSheet(containerEl, editor);
      };
      // Place inside the editor UI so it scrolls with content and avoids keyboard
      editorUI.style.position = 'relative';
      editorUI.appendChild(_mobileFab);

      // Clean up when editor is destroyed
      var observer = new MutationObserver(function() {
        if (!document.body.contains(containerEl)) {
          cleanupMobileSheet();
          observer.disconnect();
          hideInjected.disconnect();
        }
      });
      observer.observe(containerEl.parentNode || document.body, { childList: true });
    }, 400);
  }

  function cleanupMobileSheet() {
    if (_mobileFab) { _mobileFab.remove(); _mobileFab = null; }
    if (_mobileSheet) { _mobileSheet.remove(); _mobileSheet = null; }
    _mobileEditor = null;
  }

  function toggleMobileSheet(containerEl, editor) {
    if (_mobileSheet) {
      _mobileSheet.remove();
      _mobileSheet = null;
      return;
    }

    var sheet = document.createElement('div');
    sheet.className = 'mobile-sheet';
    sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.15);padding:16px 16px 24px;max-height:60vh;overflow-y:auto;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
    header.innerHTML = '<span style="font-weight:600;font-size:15px">Insert</span>';
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<span class="material-icons-outlined">close</span>';
    closeBtn.style.cssText = 'background:none;border:none;color:var(--grey-500);cursor:pointer;padding:4px;';
    closeBtn.onclick = function() { _mobileSheet.remove(); _mobileSheet = null; };
    header.appendChild(closeBtn);
    sheet.appendChild(header);

    // Grid of action buttons
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';

    function addAction(icon, label, color, onclick) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">' + icon + '</span><span>' + label + '</span>';
      btn.style.cssText = 'display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;border:1px solid var(--grey-200);background:#fff;color:' + (color || 'var(--grey-700)') + ';font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;text-align:left;';
      btn.onclick = function(e) {
        e.preventDefault();
        _mobileSheet.remove();
        _mobileSheet = null;
        onclick();
      };
      grid.appendChild(btn);
    }

    // Camera / Photo
    var camInput = document.createElement('input');
    camInput.type = 'file';
    camInput.accept = 'image/*';
    camInput.capture = 'environment';
    camInput.style.display = 'none';
    sheet.appendChild(camInput);
    camInput.onchange = function() {
      if (camInput.files[0]) triggerMobileUpload(camInput.files[0], editor, containerEl);
    };
    addAction('photo_camera', 'Take Photo', 'var(--teal-dark)', function() { camInput.click(); });

    // Image from library
    var imgInput = document.createElement('input');
    imgInput.type = 'file';
    imgInput.accept = 'image/*';
    imgInput.style.display = 'none';
    sheet.appendChild(imgInput);
    imgInput.onchange = function() {
      if (imgInput.files[0]) triggerMobileUpload(imgInput.files[0], editor, containerEl);
    };
    addAction('image', 'Image / GIF', 'var(--grey-700)', function() { imgInput.click(); });

    // Insert object types
    var groups = getObjectTypes();
    Object.keys(groups).forEach(function(key) {
      var g = groups[key];
      addAction(g.icon, g.label, g.color, function() {
        linkModalCategory = key;
        openLinkModal(editor);
        setTimeout(function() { selectLinkCategory(key); }, 50);
      });
    });

    sheet.appendChild(grid);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,.3);';
    backdrop.onclick = function() { _mobileSheet.remove(); _mobileSheet = null; };

    var wrapper = document.createElement('div');
    wrapper.appendChild(backdrop);
    wrapper.appendChild(sheet);
    _mobileSheet = wrapper;
    document.body.appendChild(wrapper);
  }

  function triggerMobileUpload(file, editor, containerEl) {
    if (!window.Lab.gh.isLoggedIn()) { window.Lab.showToast('Sign in to upload', 'error'); return; }
    var slug = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
    var path = 'docs/images/' + slug;
    var reader = new FileReader();
    reader.onload = async function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      try {
        window.Lab.showToast('Uploading...', 'info');
        var token = window.Lab.gh.getToken();
        var existingSha = null;
        try {
          var check = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/' + path + '?ref=' + window.Lab.gh.BRANCH, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (check.ok) existingSha = (await check.json()).sha;
        } catch(e) {}
        var putBody = { message: 'Upload ' + slug, content: base64, branch: window.Lab.gh.BRANCH };
        if (existingSha) putBody.sha = existingSha;
        var resp = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/' + path, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(putBody)
        });
        if (!resp.ok) throw new Error('Upload failed');
        window.Lab.showToast('Uploaded', 'success');
        // Insert into editor
        editor.changeMode('markdown');
        editor.replaceSelection('\n![' + slug + '](images/' + slug + ')\n');
        editor.changeMode('wysiwyg');
        // Show preview immediately
        setTimeout(function() {
          var ww = containerEl.querySelector('.toastui-editor-ww-container');
          if (ww) {
            ww.querySelectorAll('img').forEach(function(img) {
              if ((img.getAttribute('src') || '').includes(slug)) {
                img.dataset.realSrc = img.getAttribute('src');
                img.src = dataUrl;
              }
            });
          }
        }, 300);
      } catch(e) {
        window.Lab.showToast('Upload failed: ' + e.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  // ── Inject category insert pills above any Toast UI editor ──
  function injectCategoryPills(containerEl, editor) {
    var editorUI = containerEl.querySelector('.toastui-editor-defaultUI');
    if (!editorUI) return;

    var insertBar = document.createElement('div');
    insertBar.style.cssText = 'display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid var(--grey-200);background:var(--grey-50);gap:6px;flex-wrap:wrap;';

    var label = document.createElement('span');
    label.style.cssText = 'font-size:12px;color:var(--grey-500);margin-right:4px;white-space:nowrap;';
    label.textContent = 'Insert:';
    insertBar.appendChild(label);

    var groups = getObjectTypes();
    Object.keys(groups).forEach(function(key) {
      var g = groups[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:14px;border:1.5px solid ' + g.color + '40;background:' + g.color + '08;color:' + g.color + ';font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;';
      btn.innerHTML = '<span class="material-icons-outlined" style="font-size:15px">' + g.icon + '</span>' + g.label;
      btn.onmouseenter = function() { btn.style.background = g.color + '18'; };
      btn.onmouseleave = function() { btn.style.background = g.color + '08'; };
      btn.onclick = function(e) {
        e.preventDefault();
        linkModalCategory = key;
        openLinkModal(editor);
        setTimeout(function() { selectLinkCategory(key); }, 50);
      };
      insertBar.appendChild(btn);
    });

    editorUI.insertBefore(insertBar, editorUI.firstChild);

    // Inject callout icons into toolbar next to the blockquote (66) button
    var quoteBtn = editorUI.querySelector('.toastui-editor-toolbar-icons[aria-label="Blockquote"]') ||
                   editorUI.querySelector('button[data-tooltip="Blockquote"]');
    // Fallback: find the second toolbar group (hr, quote)
    if (!quoteBtn) {
      var groups = editorUI.querySelectorAll('.toastui-editor-toolbar-group');
      if (groups.length > 1) quoteBtn = groups[1].lastElementChild;
    }
    var calloutAnchor = quoteBtn ? quoteBtn.parentNode : editorUI.querySelector('.toastui-editor-toolbar');
    if (calloutAnchor) {
      var callouts = [
        { type: 'variant', label: 'Variant', icon: '\uD83D\uDD00' },
        { type: 'warning', label: 'Warning', icon: '\u26A0\uFE0F' },
        { type: 'note', label: 'Note', icon: '\u2139\uFE0F' },
        { type: 'tip', label: 'Tip', icon: '\uD83D\uDCA1' },
      ];
      callouts.forEach(function(c) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Insert ' + c.label + ' callout';
        btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:4px;border:none;background:transparent;font-size:16px;cursor:pointer;transition:background .15s;';
        btn.textContent = c.icon;
        btn.onmouseenter = function() { btn.style.background = 'var(--grey-200)'; };
        btn.onmouseleave = function() { btn.style.background = 'transparent'; };
        btn.onclick = function(e) {
          e.preventDefault();
          // insertText in WYSIWYG inserts literal text, not markdown.
          // Switch to markdown mode to insert, then switch back.
          editor.changeMode('markdown');
          editor.replaceSelection('\n\n> ' + c.icon + ' **' + c.label + '**\n\n');
          editor.changeMode('wysiwyg');
        };
        if (quoteBtn && quoteBtn.nextSibling) {
          calloutAnchor.insertBefore(btn, quoteBtn.nextSibling);
          quoteBtn = btn; // chain them after each other
        } else {
          calloutAnchor.appendChild(btn);
        }
      });
    }

    // Inject code block button after the last callout button (or after quote button)
    var codeBlockAnchor = quoteBtn || calloutAnchor;
    if (codeBlockAnchor) {
      var cbBtn = document.createElement('button');
      cbBtn.type = 'button';
      cbBtn.title = 'Insert code block';
      cbBtn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:4px;border:none;background:transparent;cursor:pointer;transition:background .15s;';
      cbBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:18px;color:var(--grey-600)">data_object</span>';
      cbBtn.onmouseenter = function() { cbBtn.style.background = 'var(--grey-200)'; };
      cbBtn.onmouseleave = function() { cbBtn.style.background = 'transparent'; };
      cbBtn.onclick = function(e) {
        e.preventDefault();
        editor.changeMode('markdown');
        editor.replaceSelection('\n\n```\n\n```\n\n');
        editor.changeMode('wysiwyg');
      };
      if (codeBlockAnchor.nextSibling) {
        codeBlockAnchor.parentNode.insertBefore(cbBtn, codeBlockAnchor.nextSibling);
      } else {
        codeBlockAnchor.parentNode.appendChild(cbBtn);
      }
    }

    // ── Media insert buttons (image/GIF, YouTube, video upload) ──
    var mediaBar = document.createElement('div');
    mediaBar.style.cssText = 'display:flex;align-items:center;padding:4px 12px;border-bottom:1px solid var(--grey-200);background:var(--grey-50);gap:6px;flex-wrap:wrap;';

    var mediaLabel = document.createElement('span');
    mediaLabel.style.cssText = 'font-size:12px;color:var(--grey-500);margin-right:4px;white-space:nowrap;';
    mediaLabel.textContent = 'Media:';
    mediaBar.appendChild(mediaLabel);

    var mediaBtnStyle = 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:14px;border:1.5px solid var(--grey-300);background:#fff;color:var(--grey-700);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;';

    // Hidden file inputs
    var imgInput = document.createElement('input');
    imgInput.type = 'file';
    imgInput.accept = 'image/*';
    imgInput.style.display = 'none';
    mediaBar.appendChild(imgInput);

    var vidInput = document.createElement('input');
    vidInput.type = 'file';
    vidInput.accept = 'video/mp4,video/webm,video/quicktime';
    vidInput.style.display = 'none';
    mediaBar.appendChild(vidInput);

    // Upload helper: reads file as base64, uploads to docs/images/ via GitHub API
    function uploadMedia(file, callback) {
      if (!window.Lab.gh.isLoggedIn()) { window.Lab.showToast('Sign in to upload', 'error'); return; }
      var slug = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
      var path = 'docs/images/' + slug;
      var reader = new FileReader();
      reader.onload = async function() {
        var dataUrl = reader.result; // full data:image/...;base64,...
        var base64 = dataUrl.split(',')[1];
        try {
          window.Lab.showToast('Uploading ' + file.name + '...', 'info');
          var token = window.Lab.gh.getToken();
          // Check if file exists (need SHA to update)
          var existingSha = null;
          try {
            var check = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/' + path + '?ref=' + window.Lab.gh.BRANCH, {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (check.ok) existingSha = (await check.json()).sha;
          } catch(e) {}
          var putBody = { message: 'Upload ' + slug, content: base64, branch: window.Lab.gh.BRANCH };
          if (existingSha) putBody.sha = existingSha;
          var resp = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/' + path, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(putBody)
          });
          if (!resp.ok) {
            var err = await resp.json().catch(function() { return {}; });
            throw new Error(err.message || 'Upload failed');
          }
          window.Lab.showToast('Uploaded: ' + slug, 'success');
          callback(slug, dataUrl);
        } catch(e) {
          window.Lab.showToast('Upload failed: ' + e.message, 'error');
        }
      };
      reader.readAsDataURL(file);
    }

    // Image/GIF button
    var imgBtn = document.createElement('button');
    imgBtn.type = 'button';
    imgBtn.style.cssText = mediaBtnStyle;
    imgBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:15px">image</span> Image / GIF';
    imgBtn.onmouseenter = function() { imgBtn.style.background = 'var(--grey-100)'; };
    imgBtn.onmouseleave = function() { imgBtn.style.background = '#fff'; };
    imgBtn.onclick = function(e) { e.preventDefault(); imgInput.click(); };
    imgInput.onchange = function() {
      if (!imgInput.files[0]) return;
      uploadMedia(imgInput.files[0], function(slug, dataUrl) {
        // Insert with the real path (for save), then swap src to data URL for instant preview
        editor.changeMode('markdown');
        editor.replaceSelection('\n\n![' + slug.replace(/\.[^.]+$/, '') + '](images/' + slug + ')\n\n');
        editor.changeMode('wysiwyg');
        // Show instant preview via data URL for the just-uploaded image.
        // We set img.src to the data URL so the user sees it immediately.
        setTimeout(function() {
          var ww = containerEl.querySelector('.toastui-editor-ww-container') || containerEl;
          ww.querySelectorAll('img').forEach(function(img) {
            var src = img.getAttribute('src') || '';
            if (src.includes(slug) && (!img.complete || img.naturalWidth === 0)) {
              img.dataset.realSrc = src;
              img.src = dataUrl;
            }
          });
        }, 300);
      });
      imgInput.value = '';
    };
    mediaBar.appendChild(imgBtn);

    // YouTube button
    var ytBtn = document.createElement('button');
    ytBtn.type = 'button';
    ytBtn.style.cssText = mediaBtnStyle;
    ytBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:15px">smart_display</span> YouTube';
    ytBtn.onmouseenter = function() { ytBtn.style.background = 'var(--grey-100)'; };
    ytBtn.onmouseleave = function() { ytBtn.style.background = '#fff'; };
    ytBtn.onclick = function(e) {
      e.preventDefault();
      var url = prompt('Paste YouTube URL:');
      if (!url) return;
      // Extract video ID from various YouTube URL formats
      var match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (!match) { window.Lab.showToast('Could not parse YouTube URL', 'error'); return; }
      var videoId = match[1];
      editor.changeMode('markdown');
      editor.replaceSelection('\n\n[![▶ YouTube video](https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg)](https://www.youtube.com/watch?v=' + videoId + ')\n\n');
      editor.changeMode('wysiwyg');
      window.Lab.showToast('YouTube video inserted', 'success');
    };
    mediaBar.appendChild(ytBtn);

    // Video upload button
    var vidBtn = document.createElement('button');
    vidBtn.type = 'button';
    vidBtn.style.cssText = mediaBtnStyle;
    vidBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:15px">videocam</span> Video file';
    vidBtn.onmouseenter = function() { vidBtn.style.background = 'var(--grey-100)'; };
    vidBtn.onmouseleave = function() { vidBtn.style.background = '#fff'; };
    vidBtn.onclick = function(e) { e.preventDefault(); vidInput.click(); };
    vidInput.onchange = function() {
      if (!vidInput.files[0]) return;
      var file = vidInput.files[0];
      if (file.size > 25 * 1024 * 1024) {
        window.Lab.showToast('Video too large (max 25 MB). Use YouTube for longer clips.', 'error');
        vidInput.value = '';
        return;
      }
      uploadMedia(file, function(slug) {
        editor.changeMode('markdown');
        editor.replaceSelection('\n\n[🎬 Video: ' + slug + '](videofile://images/' + slug + ')\n\n');
        editor.changeMode('wysiwyg');
      });
      vidInput.value = '';
    };
    mediaBar.appendChild(vidBtn);

    // Insert media bar after the category pills bar
    insertBar.parentNode.insertBefore(mediaBar, insertBar.nextSibling);

    // ── Image annotation: double-click an image in editor to annotate ──
    if (window.Lab && window.Lab.annotate) {
      setTimeout(function() {
        var ww = containerEl.querySelector('.toastui-editor-ww-container');
        if (!ww) return;
        ww.addEventListener('dblclick', function(e) {
          var img = e.target.closest('img');
          if (!img) return;
          e.preventDefault();
          window.Lab.annotate.open(img, function(annotatedPath, dataUrl) {
            // Save scroll position before mode switches reset it
            var scrollEl = ww.closest('.toastui-editor-ww-container') || ww.closest('.ProseMirror') || ww;
            var scrollTop = scrollEl.scrollTop;
            var mainScroll = document.getElementById('protoMain');
            var mainScrollTop = mainScroll ? mainScroll.scrollTop : 0;

            // Replace the image src in the editor with the annotated version
            editor.changeMode('markdown');
            var md = editor.getMarkdown();
            var oldSrc = img.dataset.realSrc || img.getAttribute('src') || '';
            var base = MEDIA_BASE;
            var relativeSrc = oldSrc.startsWith(base) ? oldSrc.slice(base.length) : oldSrc;
            // Carry over image size from old path to new annotated path
            var oldSize = getImageSize(relativeSrc);
            if (oldSize) {
              delete _imgSizes[relativeSrc];
              _imgSizes[annotatedPath] = oldSize;
            }
            // Replace the old image path with the annotated one
            md = md.replace(relativeSrc, annotatedPath);
            editor.setMarkdown(md);
            editor.changeMode('wysiwyg');
            // Track data URL → real path and show preview without corrupting ProseMirror
            _dataUrlToPath[dataUrl] = annotatedPath;
            setTimeout(function() {
              var imgs = ww.querySelectorAll('img');
              imgs.forEach(function(i) {
                if ((i.getAttribute('src') || '').includes(annotatedPath.split('/').pop())) {
                  i.dataset.realSrc = i.getAttribute('src');
                  i.src = dataUrl;
                }
              });
              // Re-apply sizes after annotation swap
              applyEditorImageSizes(containerEl);
              // Restore scroll position
              scrollEl.scrollTop = scrollTop;
              if (mainScroll) mainScroll.scrollTop = mainScrollTop;
            }, 300);
          });
        });
        // Image click: show resize/annotate toolbar
        var imgToolbar = null;
        ww.addEventListener('click', function(e) {
          var img = e.target.closest('img');
          // Remove existing toolbar
          if (imgToolbar) { imgToolbar.remove(); imgToolbar = null; }
          if (!img) return;

          imgToolbar = document.createElement('div');
          imgToolbar.style.cssText = 'position:absolute;display:flex;gap:4px;padding:4px 8px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.15);z-index:100;align-items:center;font-family:Inter,sans-serif;';

          // Size options
          var imgSrc = img.dataset.realSrc || img.getAttribute('src') || '';
          var currentSize = getImageSize(imgSrc) || '100%';
          [{ label: '25%', val: '25%' }, { label: '50%', val: '50%' }, { label: '75%', val: '75%' }, { label: '100%', val: '100%' }].forEach(function(s) {
            var isActive = currentSize === s.val || (!getImageSize(imgSrc) && s.val === '100%');
            var b = document.createElement('button');
            b.textContent = s.label;
            b.style.cssText = 'padding:3px 8px;border-radius:4px;border:1px solid var(--grey-300);background:' + (isActive ? 'var(--teal)' : '#fff') + ';color:' + (isActive ? '#fff' : 'var(--grey-700)') + ';font-size:11px;cursor:pointer;font-family:inherit;';
            b.onclick = function(ev) {
              ev.stopPropagation();
              // Visual resize in editor (DOM only — persisted on save via getMarkdownClean)
              img.style.setProperty('max-width', s.val, 'important');
              // Track resize for save — resolve data URLs to real paths
              var src = resolveRealSrc(img.dataset.realSrc || img.getAttribute('src') || '');
              var relSrc = src.startsWith(MEDIA_BASE) ? src.slice(MEDIA_BASE.length) : src;
              if (s.val === '100%') {
                delete _imgSizes[relSrc];
              } else {
                _imgSizes[relSrc] = s.val;
              }
              if (imgToolbar) { imgToolbar.remove(); imgToolbar = null; }
            };
            imgToolbar.appendChild(b);
          });

          // Annotate button
          var annBtn = document.createElement('button');
          annBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:14px">edit</span> Annotate';
          annBtn.style.cssText = 'padding:3px 8px;border-radius:4px;border:1px solid var(--teal);background:var(--teal-50);color:var(--teal-dark);font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px;margin-left:4px;';
          annBtn.onclick = function(ev) {
            ev.stopPropagation();
            if (imgToolbar) { imgToolbar.remove(); imgToolbar = null; }
            img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
          };
          imgToolbar.appendChild(annBtn);

          // Position below image
          var imgRect = img.getBoundingClientRect();
          var wwRect = ww.getBoundingClientRect();
          imgToolbar.style.left = (imgRect.left - wwRect.left) + 'px';
          imgToolbar.style.top = (imgRect.bottom - wwRect.top + 4) + 'px';
          ww.style.position = 'relative';
          ww.appendChild(imgToolbar);
        });

        // Add visual hint on hover
        ww.addEventListener('mouseover', function(e) {
          if (e.target.tagName === 'IMG') {
            e.target.style.outline = '3px dashed rgba(0,137,123,.5)';
            e.target.style.cursor = 'pointer';
            e.target.title = 'Click: resize. Double-click: annotate';
          }
        });
        ww.addEventListener('mouseout', function(e) {
          if (e.target.tagName === 'IMG') {
            e.target.style.outline = '';
            e.target.style.cursor = '';
            e.target.title = '';
          }
        });
      }, 500);
    }
  }

  // ── Wikilink round-tripping for Toast UI ──
  // Toast UI doesn't understand [[wikilinks]] and mangles the double brackets.
  // Solution: convert [[slug]] → [title](obj://slug) before feeding to the editor
  // (Toast UI handles standard markdown links perfectly), then convert back on save.

  // Pre-process: [[slug]] → [title](obj://slug) before editor init
  // Placeholder domain for obj:// links so Toast UI treats them as real links
  var OBJ_LINK_PREFIX = 'https://obj.link/';

  async function wikilinksToLinks(md) {
    // Ensure object index is loaded for title lookups
    if (window.Lab.wikilinks && window.Lab.wikilinks.ensureLookup) {
      await window.Lab.wikilinks.ensureLookup();
    }
    // Repair previously mangled obj:// links (escaped by Toast UI): \[text\]\(obj://slug\)
    // Content inside brackets may also have escaped chars like \- so use .+? (lazy dot)
    // Both ( and ) may be escaped as \( and \)
    md = md.replace(/\\\[(.+?)\\\]\\?\(obj:\/\/(.+?)\\?\)/g, function(m, t, s) {
      var slug = s.replace(/\\/g, '');
      return '[[' + slug + ']]';
    });
    // Also catch unescaped obj:// links saved from before
    md = md.replace(/\[([^\]]*)\]\(obj:\/\/([^)]+)\)/g, function(m, t, s) {
      return '[[' + s + ']]';
    });
    return md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function(match, slug, label) {
      var title = label || slug;
      if (window.Lab.wikilinks && window.Lab.wikilinks._lookup) {
        var found = window.Lab.wikilinks._lookup(slug);
        if (found) title = label || found.title || slug;
      }
      return '[' + title + '](' + OBJ_LINK_PREFIX + slug + ')';
    });
  }

  // Post-process: [title](https://obj.link/slug) → [[slug]] after getMarkdown()
  function linksToWikilinks(md) {
    // Match clean URLs
    var re = new RegExp('\\[([^\\]]*)\\]\\(' + OBJ_LINK_PREFIX.replace(/[/.]/g, '\\$&') + '([^)]+)\\)', 'g');
    md = md.replace(re, function(match, title, slug) {
      return '[[' + slug + ']]';
    });
    // Match escaped URLs from Toast UI (backslashes before dots, hyphens, parens)
    // e.g. \[BL21(DE3)\]\(https://obj\.link/bl21\-de3\-competent\-cells\)
    md = md.replace(/\\?\[([^\]]*)\]\\?\(https:\/\/obj\\?\.link\/((?:[^)\\]|\\.)+)\\?\)/g, function(m, title, slug) {
      return '[[' + slug.replace(/\\/g, '') + ']]';
    });
    return md;
  }

  // ── Image path round-tripping ──
  // Resolve relative image paths to full URLs before editor, convert back on save
  var MEDIA_BASE = (window.Lab && window.Lab.BASE) || '/lab-handbook/';

  function applyEditorImageSizes(containerEl) {
    if (!Object.keys(_imgSizes).length) return;
    function applyAll() {
      containerEl.querySelectorAll('img').forEach(function(img) {
        var src = img.getAttribute('src') || img.src || '';
        var w = getImageSize(src);
        if (w) img.style.setProperty('max-width', w, 'important');
      });
    }
    applyAll();
    // MutationObserver for Toast UI lazy rendering
    if (!containerEl._imgObserver) {
      containerEl._imgObserver = new MutationObserver(applyAll);
      containerEl._imgObserver.observe(containerEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    }
  }

  // Fallback for images that fail to load in the editor (not deployed to Pages yet).
  // Fetches via authenticated GitHub API and displays as data URL.
  function setupEditorImageFallback(containerEl) {
    if (containerEl._imgFallbackSetup) return;
    containerEl._imgFallbackSetup = true;
    containerEl.addEventListener('error', function(e) {
      var img = e.target;
      if (img.tagName !== 'IMG' || img.dataset.apiFallback) return;
      img.dataset.apiFallback = '1';
      var src = img.getAttribute('src') || '';
      // Extract relative path from the resolved URL
      var relPath = '';
      if (src.includes('/images/')) {
        relPath = 'images/' + src.split('/images/').pop();
      }
      if (relPath && window.Lab && window.Lab.gh && window.Lab.gh.isLoggedIn()) {
        fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/docs/' + relPath + '?ref=' + window.Lab.gh.BRANCH, {
          headers: { 'Authorization': 'Bearer ' + window.Lab.gh.getToken(), 'Accept': 'application/vnd.github.v3+json' }
        }).then(function(r) { return r.ok ? r.json() : null; }).then(function(data) {
          if (data && data.content) {
            var ext = relPath.split('.').pop().toLowerCase();
            var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            img.dataset.realSrc = src;
            img.src = 'data:' + mime + ';base64,' + data.content.replace(/\n/g, '');
          }
        }).catch(function() {});
      }
    }, true); // useCapture to catch errors on img elements
  }

  // Resolve a src to a real path (handles data URLs via mapping)
  function resolveRealSrc(src) {
    if (!src) return src;
    if (src.startsWith('data:') && _dataUrlToPath[src]) return _dataUrlToPath[src];
    return src;
  }

  // Look up size for an image src (match by filename since paths vary)
  function getImageSize(src) {
    if (!src) return null;
    src = resolveRealSrc(src);
    var fname = src.split('/').pop().split('?')[0];
    for (var key in _imgSizes) {
      if (key.split('/').pop() === fname) return _imgSizes[key];
    }
    return null;
  }

  function loadImageSizes(md) {
    // Parse existing <img> tags, extract max-width, convert to ![alt](src) for editor
    _imgSizes = {};
    md = md.replace(/<img\b([^>]*)>/gi, function(match, attrs) {
      var srcMatch = attrs.match(/src=["']([^"']+)["']/);
      var altMatch = attrs.match(/alt=["']([^"']+)["']/);
      var widthMatch = attrs.match(/max-width:\s*([^;"']+)/);
      var src = srcMatch ? srcMatch[1] : '';
      var alt = altMatch ? altMatch[1] : '';
      if (widthMatch) _imgSizes[src] = widthMatch[1].trim();
      return '![' + alt + '](' + src + ')';
    });
    return md;
  }

  function resolveImagePaths(md) {
    // ![alt](images/foo.jpg) → ![alt](/lab-handbook/images/foo.jpg)
    md = md.replace(/(!\[[^\]]*\]\()(?!http|data:|\/)([^)]+\))/g, function(m, prefix, rest) {
      return prefix + MEDIA_BASE + rest;
    });
    // Also resolve src="images/..." in HTML tags (video, source, img)
    md = md.replace(/(src=["'])(?!http|data:|\/)([^"']+["'])/g, function(m, prefix, rest) {
      return prefix + MEDIA_BASE + rest;
    });
    return md;
  }

  function unresolveImagePaths(md) {
    // ![alt](/lab-handbook/images/foo.jpg) → ![alt](images/foo.jpg)
    var escaped = MEDIA_BASE.replace(/[/.]/g, '\\$&');
    var re = new RegExp('(!\\[[^\\]]*\\]\\()' + escaped + '([^)]+\\))', 'g');
    md = md.replace(re, '$1$2');
    // Also unresolve src="/lab-handbook/..." in HTML tags
    var srcRe = new RegExp('(src=["\'])' + escaped + '([^"\']+["\'])', 'g');
    md = md.replace(srcRe, '$1$2');
    return md;
  }

  // ── Media embed round-tripping ──
  // Toast UI strips <iframe> and <video> in WYSIWYG. Convert to placeholder links
  // before editor, convert back on save.

  function mediaToPlaceholders(md) {
    // YouTube iframes → placeholder link with thumbnail
    md = md.replace(/<iframe[^>]*src=["']https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)["'][^>]*><\/iframe>/g, function(m, id) {
      return '[![▶ YouTube video](https://img.youtube.com/vi/' + id + '/mqdefault.jpg)](https://www.youtube.com/watch?v=' + id + ')';
    });
    // Local video tags → placeholder link
    md = md.replace(/<video[^>]*>[\s\S]*?<source\s+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/g, function(m, src) {
      var name = src.split('/').pop();
      return '[🎬 Video: ' + name + '](videofile://' + src + ')';
    });
    return md;
  }

  function placeholdersToMedia(md) {
    // YouTube thumbnail links → iframe
    md = md.replace(/\[!\[▶[^\]]*\]\(https:\/\/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]+)\/[^)]+\)\]\(https:\/\/www\.youtube\.com\/watch\?v=\1\)/g, function(m, id) {
      return '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>';
    });
    // Also catch escaped versions from Toast UI
    md = md.replace(/\[!\[▶[^\]]*\]\(https:\/\/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]+)\/[^)]+\)\]\\?\(https:\/\/www\.youtube\.com\/watch\?v=\1\\?\)/g, function(m, id) {
      return '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>';
    });
    // videofile:// placeholder links → video tag
    md = md.replace(/\[🎬 Video: [^\]]+\]\(videofile:\/\/([^)]+)\)/g, function(m, src) {
      var type = src.match(/\.webm$/i) ? 'video/webm' : 'video/mp4';
      return '<video controls style="max-width:100%;border-radius:8px;margin:12px 0"><source src="' + src + '" type="' + type + '">Your browser does not support video.</video>';
    });
    // Also catch escaped videofile:// from Toast UI
    md = md.replace(/\\?\[🎬 Video: [^\]]*\]\\?\(videofile:\/\/([^)]*(?:\\.[^)]*)*)\)/g, function(m, src) {
      src = src.replace(/\\/g, '');
      var type = src.match(/\.webm$/i) ? 'video/webm' : 'video/mp4';
      return '<video controls style="max-width:100%;border-radius:8px;margin:12px 0"><source src="' + src + '" type="' + type + '">Your browser does not support video.</video>';
    });
    return md;
  }

  // Track image resizes (src → width%) — applied on save
  var _imgSizes = {};

  // Track data URL → real path for images previewed via base64
  var _dataUrlToPath = {};

  function applyImageSizes(md) {
    Object.keys(_imgSizes).forEach(function(src) {
      var w = _imgSizes[src];
      var escaped = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Replace ![alt](src) with <img> tag
      var re = new RegExp('!\\[([^\\]]*)\\]\\(([^)]*' + escaped + '[^)]*)\\)');
      md = md.replace(re, function(m, alt, fullSrc) {
        return '<img src="' + fullSrc + '" alt="' + alt + '" style="max-width:' + w + '">';
      });
    });
    return md;
  }

  // Replace any data URLs that ProseMirror synced back into markdown with real paths.
  // ProseMirror may escape special chars in URLs, so we match broadly and use the
  // _dataUrlToPath map to find the right replacement. As a safety net, any data:image
  // URL in the output gets replaced even if we can't match it to a specific upload.
  function restoreDataUrls(md) {
    if (!Object.keys(_dataUrlToPath).length) return md;
    // Strategy: find image markdown with data: URLs. The base64 can be huge and may
    // contain escaped chars, so we match the opening and then find the closing paren.
    var result = '';
    var i = 0;
    while (i < md.length) {
      // Look for ![...]( followed by data:image
      var imgStart = md.indexOf('![', i);
      if (imgStart === -1) { result += md.substring(i); break; }
      result += md.substring(i, imgStart);
      // Find the ]( part
      var bracketClose = md.indexOf('](', imgStart);
      if (bracketClose === -1) { result += md.substring(imgStart); break; }
      var urlStart = bracketClose + 2;
      // Check if this is a data: URL
      var peek = md.substring(urlStart, urlStart + 12);
      if (peek.startsWith('data:image/') || peek.startsWith('data:image\\')) {
        // Find closing paren — scan forward, handling possible escapes
        var depth = 1;
        var j = urlStart;
        while (j < md.length && depth > 0) {
          if (md[j] === '(' && md[j-1] !== '\\') depth++;
          else if (md[j] === ')' && md[j-1] !== '\\') depth--;
          if (depth > 0) j++;
        }
        // j now points to the closing paren
        var dataUrl = md.substring(urlStart, j);
        var alt = md.substring(imgStart + 2, bracketClose);
        // Try to match this data URL to a known upload
        var clean = dataUrl.replace(/\\(.)/g, '$1');
        var realPath = null;
        if (_dataUrlToPath[clean]) {
          realPath = _dataUrlToPath[clean];
        } else {
          // Prefix match: first 80 chars should be enough to identify
          var prefix = clean.substring(0, 80);
          for (var key in _dataUrlToPath) {
            if (key.substring(0, 80) === prefix) { realPath = _dataUrlToPath[key]; break; }
          }
        }
        if (realPath) {
          result += '![' + alt + '](' + realPath + ')';
        } else {
          // Unknown data URL — still strip it to prevent save corruption
          result += '![' + alt + '](' + alt + ')';
        }
        i = j + 1;
      } else {
        // Not a data URL, keep as-is
        result += '![';
        i = imgStart + 2;
      }
    }
    return result;
  }

  function getMarkdownClean(editor) {
    var md = editor.getMarkdown();
    // Clean up zero-width spaces we injected into empty table header cells
    md = md.replace(/\u200B/g, '');
    md = restoreDataUrls(md);
    md = linksToWikilinks(md);
    md = unresolveImagePaths(md);
    md = placeholdersToMedia(md);
    md = applyImageSizes(md);
    return md;
  }

  // Toast UI's ProseMirror table plugin intercepts clicks on <th> cells
  // for column selection instead of placing cursor for editing.
  // Fix: add a click handler that forces cursor into the cell.
  function fixTableHeaders(containerEl) {
    var ww = containerEl.querySelector('.toastui-editor-ww-container');
    if (!ww || ww._thFixApplied) return;
    ww._thFixApplied = true;

    ww.addEventListener('click', function(e) {
      var th = e.target.closest('th');
      if (!th) return;

      // Find the editable paragraph inside the th
      var p = th.querySelector('p');
      if (!p) return;

      // Stop ProseMirror's table selection handler
      e.stopPropagation();

      // Place cursor at end of the paragraph
      var range = document.createRange();
      var sel = window.getSelection();
      if (p.childNodes.length > 0) {
        var lastChild = p.childNodes[p.childNodes.length - 1];
        if (lastChild.nodeType === Node.TEXT_NODE) {
          range.setStart(lastChild, lastChild.textContent.length);
        } else {
          range.setStartAfter(lastChild);
        }
      } else {
        range.setStart(p, 0);
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      p.focus();
    }, true); // capture phase — run before ProseMirror's handler
  }

  // Right-click context menu for table cells: add/remove rows and columns
  var _tableMenu = null;
  function addTableContextMenu(containerEl, editor) {
    var ww = containerEl.querySelector('.toastui-editor-ww-container');
    if (!ww || ww._tableMenuApplied) return;
    ww._tableMenuApplied = true;

    ww.addEventListener('contextmenu', function(e) {
      var cell = e.target.closest('td, th');
      if (!cell) return;
      e.preventDefault();

      // Remove old menu
      if (_tableMenu) _tableMenu.remove();

      var menu = document.createElement('div');
      _tableMenu = menu;
      menu.style.cssText = 'position:fixed;z-index:99999;background:#fff;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);padding:4px 0;min-width:180px;font-family:Inter,sans-serif;font-size:14px;';
      menu.innerHTML = [
        '<div class="tm-item" data-cmd="addRowToUp">Insert row above</div>',
        '<div class="tm-item" data-cmd="addRowToDown">Insert row below</div>',
        '<div class="tm-item" data-cmd="addColumnToLeft">Insert column left</div>',
        '<div class="tm-item" data-cmd="addColumnToRight">Insert column right</div>',
        '<div style="height:1px;background:#e0e0e0;margin:4px 0"></div>',
        '<div class="tm-item tm-danger" data-cmd="removeRow">Delete row</div>',
        '<div class="tm-item tm-danger" data-cmd="removeColumn">Delete column</div>',
        '<div class="tm-item tm-danger" data-cmd="removeTable">Delete table</div>',
      ].join('');

      // Style items
      menu.querySelectorAll('.tm-item').forEach(function(item) {
        item.style.cssText = 'padding:8px 16px;cursor:pointer;transition:background .1s;';
        if (item.classList.contains('tm-danger')) item.style.color = '#e53935';
        item.addEventListener('mouseenter', function() { item.style.background = '#f5f5f5'; });
        item.addEventListener('mouseleave', function() { item.style.background = ''; });
        item.addEventListener('click', function() {
          var cmd = item.dataset.cmd;
          editor.exec(cmd);
          menu.remove();
          _tableMenu = null;
        });
      });

      menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      menu.style.top = Math.min(e.clientY, window.innerHeight - 300) + 'px';
      document.body.appendChild(menu);

      // Close on click outside
      setTimeout(function() {
        document.addEventListener('click', function closeMenu() {
          if (_tableMenu) { _tableMenu.remove(); _tableMenu = null; }
          document.removeEventListener('click', closeMenu);
        });
      }, 0);
    });
  }

  async function initFullpageEditor(containerEl, content, filePath, sha) {
    injectEditorCSS();
    await loadToast();

    // Calculate height: fill available space (viewport minus nav + edit bar)
    var rect = containerEl.getBoundingClientRect();
    var availableHeight = Math.max(500, window.innerHeight - rect.top - 40);

    // Convert [[wikilinks]] to standard markdown links, resolve paths, placeholder media
    var prepared = migrateAdmonitions(content);
    prepared = mediaToPlaceholders(prepared);
    prepared = loadImageSizes(prepared);
    prepared = await wikilinksToLinks(prepared);
    prepared = resolveImagePaths(prepared);

    var editor = new toastui.Editor({
      el: containerEl,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: availableHeight + 'px',
      initialValue: prepared,
      usageStatistics: false,
      toolbarItems: isMobile() ? [] :
        [['heading', 'bold', 'italic', 'strike'], ['hr', 'quote'], ['ul', 'ol', 'task'], ['table', 'link', 'code']],
      events: {
        change: function() {
          if (typeof containerEl._onchange === 'function') containerEl._onchange();
          // Attach table header fix if a table was just inserted
          fixTableHeaders(containerEl);
        }
      }
    });

    // Fix table header cells so they're editable + add context menu + apply image sizes
    setupEditorImageFallback(containerEl);
    setTimeout(function() {
      fixTableHeaders(containerEl);
      addTableContextMenu(containerEl, editor);
      applyEditorImageSizes(containerEl);
      setTimeout(function() { applyEditorImageSizes(containerEl); }, 700);
    }, 300);

    // On mobile: strip all chrome, single floating + button
    // On desktop: show insert pills + media bar as usual
    if (isMobile()) {
      setupMobileToolbarToggle(containerEl, editor);
    }
    injectCategoryPills(containerEl, editor);

    return {
      editor: editor,
      getMarkdown: function() { return getMarkdownClean(editor); },
      save: async function(message) {
        var gh = window.Lab.gh;
        if (!gh || !gh.isLoggedIn()) throw new Error('Not signed in');
        var md = getMarkdownClean(editor);
        var result = await gh.saveFile(filePath, md, sha, message || 'Update ' + filePath.replace(/^docs\//, ''));
        sha = result.sha;
        gh.clearObjectIndexCache();
        return result;
      }
    };
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.editorModal = {
    open: openPopup,
    close: close,
    initFullpage: initFullpageEditor,
    loadMarked: loadMarked,
    renderMarkdown: renderMarkdown,
    getSchema: getSchema,
    // Expose for onclick handlers in link modal HTML
    _selectCat: selectLinkCategory,
    _insertLink: insertLink,
    _createAndInsert: createAndInsertLink,
    _openLinkForTextarea: openLinkForTextarea,
  };
})();
