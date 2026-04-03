/* Monroe Lab – WYSIWYG Editor Modal
   Two modes:
   - popup: overlay modal for inventory items, people, projects, stocks
   - fullpage: replaces content area for protocols (called by protocols.html)

   Dependencies: shared.js, github-api.js, wikilinks.js
   CDN: Toast UI Editor (loaded on demand)
*/
(function() {
  'use strict';

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
      '.em-surface .toastui-editor-defaultUI-toolbar{border-bottom:1px solid var(--grey-200)!important;background:var(--grey-50)!important;padding:4px 8px!important}',
      '.em-surface .toastui-editor-toolbar-icons{border:none!important;border-radius:4px!important;width:32px!important;height:32px!important;background-color:transparent!important}',
      '.em-surface .toastui-editor-toolbar-icons:hover{background-color:var(--grey-200)!important}',
      '.em-surface .toastui-editor-ww-container{background:#fff!important}',
      '.em-surface .toastui-editor-contents{padding:24px 32px!important;font-family:Inter,sans-serif!important;font-size:15px!important;line-height:1.7!important;color:var(--grey-900)!important}',
      '.em-surface .toastui-editor-contents h1{font-size:26px!important;font-weight:700!important;margin-top:24px!important;margin-bottom:10px!important;border-bottom:2px solid var(--grey-200)!important;padding-bottom:8px!important}',
      '.em-surface .toastui-editor-contents h2{font-size:21px!important;font-weight:600!important;margin-top:20px!important;margin-bottom:8px!important}',
      '.em-surface .toastui-editor-contents h3{font-size:17px!important;font-weight:600!important;margin-top:16px!important}',
      '.em-surface .toastui-editor-contents table{border-collapse:collapse!important}',
      '.em-surface .toastui-editor-contents td,.em-surface .toastui-editor-contents th{border:1px solid var(--grey-300)!important;padding:8px 12px!important}',
      '.em-surface .toastui-editor-contents thead th{background:var(--grey-50)!important}',
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
      '.em-rendered table{border-collapse:collapse;width:100%}',
      '.em-rendered td,.em-rendered th{border:1px solid var(--grey-300);padding:8px 12px}',
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

  // Render markdown to HTML (with wikilink preprocessing)
  async function renderMarkdown(md) {
    await loadMarked();
    var processed = window.Lab.wikilinks ? window.Lab.wikilinks.preprocess(md) : md;
    return marked.parse(processed);
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
      var result = await gh.fetchFile(filePath);
      currentState.sha = result.sha;
      var parsed = window.Lab.parseFrontmatter(result.content);
      currentState.meta = parsed.meta;
      currentState.body = parsed.body;

      // Title
      var title = parsed.meta.title || filePath.split('/').pop().replace('.md', '');
      document.getElementById('em-title').textContent = title;

      // Show edit toggle if logged in
      if (gh.isLoggedIn()) {
        document.getElementById('em-edit-toggle').style.display = '';
      }

      // Render fields (read-only initially)
      renderFields(parsed.meta, false);

      // Render body
      var html = await renderMarkdown(parsed.body);
      var contentEl = document.getElementById('em-content');
      contentEl.innerHTML = '<div class="em-rendered">' + html + '</div>';

      // Process wikilinks in rendered content
      if (window.Lab.wikilinks) {
        await window.Lab.wikilinks.processRendered(contentEl);
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

    currentEditor = new toastui.Editor({
      el: editorEl,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: '300px',
      initialValue: currentState.body,
      usageStatistics: false,
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['table', 'link', 'image', 'code'],
      ],
    });
  }

  async function stopEditing() {
    if (!currentState) return;

    // Capture edited values before switching
    if (currentState.editing && currentEditor) {
      currentState.body = currentEditor.getMarkdown();
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

    // Get markdown from editor
    if (currentEditor) {
      currentState.body = currentEditor.getMarkdown();
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
      gh.clearObjectIndexCache();

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

  function insertLink(slug, title) {
    if (!linkModalEditor) return;
    // Insert wikilink directly in WYSIWYG mode using the HTML API
    // Avoid changeMode() which triggers infinite change→style loops
    var conf = window.Lab.types ? window.Lab.types.get(slug) : null;
    // Insert as raw text — the styler will convert it to a pill
    linkModalEditor.insertText('[[' + slug + ']]');
    linkModalEl.classList.remove('open');
    window.Lab.showToast('Linked: ' + title, 'success');
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
      window.Lab.gh.clearObjectIndexCache();
      insertLink(slug, name);
      window.Lab.showToast('Created: ' + name, 'success');
    } catch(e) {
      window.Lab.showToast('Failed: ' + e.message, 'error');
    }
  }

  // ── Style [[wikilinks]] in WYSIWYG contenteditable area ──
  var _styling = false; // guard against re-entrant calls
  async function styleWikilinksInEditor(containerEl) {
    if (_styling) return;
    _styling = true;
    // Ensure object index is loaded so we can look up types
    if (window.Lab.wikilinks && window.Lab.wikilinks.ensureLookup) {
      await window.Lab.wikilinks.ensureLookup();
    }
    try { _styleWikilinksInner(containerEl); } finally { _styling = false; }
  }
  function _styleWikilinksInner(containerEl) {
    var wwContainer = containerEl.querySelector('.toastui-editor-ww-container');
    if (!wwContainer) return;
    var walker = document.createTreeWalker(wwContainer, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(function(node) {
      var text = node.textContent;
      if (!text.match(/\[\[.+?\]\]/)) return;
      // Skip if already inside a styled wikilink span
      if (node.parentElement && node.parentElement.classList.contains('wk-pill')) return;

      var frag = document.createDocumentFragment();
      var remaining = text;
      var regex = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
      var match;
      var lastIndex = 0;

      while ((match = regex.exec(remaining)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(remaining.substring(lastIndex, match.index)));
        }
        // Create pill span — look up type for color
        var slug = match[1];
        var label = match[2] || slug;
        var objType = '_unknown';
        if (window.Lab.wikilinks && window.Lab.wikilinks._lookup) {
          var found = window.Lab.wikilinks._lookup(slug);
          if (found) { objType = found.type; label = match[2] || found.title || slug; }
        }
        var span = document.createElement('span');
        span.className = 'wk-pill';
        span.contentEditable = 'false';
        span.setAttribute('data-slug', slug);
        span.style.cssText = window.Lab.types.pillStyle(objType) + 'display:inline;cursor:default;';
        span.textContent = window.Lab.types.pillContent(objType, label);
        // Store raw text so getMarkdown() still returns [[slug]]
        span.setAttribute('data-raw', match[0]);
        frag.appendChild(span);
        lastIndex = regex.lastIndex;
      }
      // Remaining text after last match
      if (lastIndex < remaining.length) {
        frag.appendChild(document.createTextNode(remaining.substring(lastIndex)));
      }
      node.parentNode.replaceChild(frag, node);
    });
  }

  async function initFullpageEditor(containerEl, content, filePath, sha) {
    injectEditorCSS();
    await loadToast();

    // Calculate height: fill available space (viewport minus nav + edit bar)
    var rect = containerEl.getBoundingClientRect();
    var availableHeight = Math.max(500, window.innerHeight - rect.top - 40);

    var editor = new toastui.Editor({
      el: containerEl,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: availableHeight + 'px',
      initialValue: content,
      usageStatistics: false,
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['table', 'link', 'image', 'code'],
      ],
      events: {
        change: function() {
          if (typeof containerEl._onchange === 'function') containerEl._onchange();
          // Re-style wikilinks on content change (debounced)
          clearTimeout(containerEl._wikiTimer);
          containerEl._wikiTimer = setTimeout(function() { styleWikilinksInEditor(containerEl); }, 300);
        }
      }
    });

    // Style wikilinks in the WYSIWYG contenteditable area
    setTimeout(function() { styleWikilinksInEditor(containerEl); }, 200);

    // Inject "Insert" pill button ABOVE the editor, separate from Toast UI toolbar
    var editorUI = containerEl.querySelector('.toastui-editor-defaultUI');
    if (editorUI) {
      var insertBar = document.createElement('div');
      insertBar.style.cssText = 'display:flex;align-items:center;padding:6px 12px;border-bottom:1px solid var(--grey-200);background:var(--grey-50);gap:8px;';

      var insertBtn = document.createElement('button');
      insertBtn.type = 'button';
      insertBtn.style.cssText = 'background:#6a1b9a;color:#fff;border:none;border-radius:14px;padding:5px 14px 5px 10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;transition:background .15s;';
      insertBtn.innerHTML = '\uD83D\uDD17 Insert Link';
      insertBtn.title = 'Insert link to protocol, reagent, person, etc.';
      insertBtn.onmouseenter = function() { insertBtn.style.background = '#4a148c'; };
      insertBtn.onmouseleave = function() { insertBtn.style.background = '#6a1b9a'; };
      insertBtn.onclick = function(e) { e.preventDefault(); openLinkModal(editor); };

      var hint = document.createElement('span');
      hint.style.cssText = 'font-size:12px;color:var(--grey-400);';
      hint.textContent = 'Link protocols, reagents, people, and more';

      insertBar.appendChild(insertBtn);
      insertBar.appendChild(hint);
      editorUI.insertBefore(insertBar, editorUI.firstChild);
    }

    return {
      editor: editor,
      getMarkdown: function() { return editor.getMarkdown(); },
      save: async function(message) {
        var gh = window.Lab.gh;
        if (!gh || !gh.isLoggedIn()) throw new Error('Not signed in');
        var md = editor.getMarkdown();
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
  };
})();
