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

  // Frontmatter schemas by type
  var SCHEMAS = {
    reagent: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['reagent','buffer','consumable','equipment','kit','chemical','enzyme','solution'] },
      { key: 'location', label: 'Location', type: 'select', options: ['Chemical Cabinet','Corrosive Cabinet','Flammable Cabinet','Hazardous Cabinet','Refrigerator','Freezer -20C','Freezer -80C','Bench','Other'] },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['g','mL','L','kg','each','box','pack'] },
      { key: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number' },
    ],
    buffer: null, // same as reagent
    consumable: null,
    chemical: null,
    enzyme: null,
    solution: null,
    kit: null,
    equipment: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'hidden', value: 'equipment' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
    seed: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'hidden', value: 'seed' },
      { key: 'organism', label: 'Organism', type: 'text' },
      { key: 'stock_type', label: 'Stock Type', type: 'hidden', value: 'seed' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
    ],
    glycerol_stock: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'hidden', value: 'glycerol_stock' },
      { key: 'organism', label: 'Organism', type: 'text' },
      { key: 'stock_type', label: 'Stock Type', type: 'hidden', value: 'glycerol_stock' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
    ],
    person: [
      { key: 'title', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'hidden', value: 'person' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
    ],
    project: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'hidden', value: 'project' },
      { key: 'status', label: 'Status', type: 'select', options: ['active','completed','paused'] },
      { key: 'pi', label: 'PI', type: 'text' },
    ],
    protocol: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'hidden', value: 'protocol' },
    ],
  };

  // Resolve schema: types with null inherit from reagent
  function getSchema(type) {
    if (SCHEMAS[type]) return SCHEMAS[type];
    if (SCHEMAS[type] === null) return SCHEMAS.reagent;
    return SCHEMAS.reagent; // default fallback
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
      '.em-surface .toastui-editor-defaultUI{border:none!important;height:100%!important}',
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
      '.em-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}',
      '.em-overlay.open{opacity:1}',
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
        [{
          name: 'undo', tooltip: 'Undo', className: 'toastui-editor-toolbar-icons',
          text: '\u21A9', style: { backgroundImage: 'none', fontSize: '16px', fontWeight: 'bold' },
          command: 'undo'
        }, {
          name: 'redo', tooltip: 'Redo', className: 'toastui-editor-toolbar-icons',
          text: '\u21AA', style: { backgroundImage: 'none', fontSize: '16px', fontWeight: 'bold' },
          command: 'redo'
        }],
      ],
      events: {
        change: function() {
          if (typeof containerEl._onchange === 'function') containerEl._onchange();
        }
      }
    });

    // Handle undo/redo button clicks
    containerEl.addEventListener('click', function(e) {
      var btn = e.target.closest('.toastui-editor-toolbar-icons');
      if (!btn) return;
      var label = btn.getAttribute('aria-label') || '';
      if (label.includes('Undo')) document.execCommand('undo');
      else if (label.includes('Redo')) document.execCommand('redo');
    });

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
    SCHEMAS: SCHEMAS,
    getSchema: getSchema,
  };
})();
