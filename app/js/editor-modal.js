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

  // Resize large images before upload (prevents mobile OOM crashes)
  // Returns a Promise<{dataUrl, base64}> with the resized JPEG
  var MAX_IMG_DIM = 1600;
  var IMG_QUALITY = 0.85;
  function resizeImage(file) {
    return new Promise(function(resolve) {
      // Skip non-images or small files (< 500KB)
      if (!file.type.startsWith('image/') || file.size < 500000) {
        var reader = new FileReader();
        reader.onload = function() {
          resolve({ dataUrl: reader.result, base64: reader.result.split(',')[1] });
        };
        reader.readAsDataURL(file);
        return;
      }

      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function() {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if (w <= MAX_IMG_DIM && h <= MAX_IMG_DIM && file.size < 2000000) {
          // Already small enough, use original
          var reader = new FileReader();
          reader.onload = function() {
            resolve({ dataUrl: reader.result, base64: reader.result.split(',')[1] });
          };
          reader.readAsDataURL(file);
          return;
        }
        // Scale down
        var scale = Math.min(MAX_IMG_DIM / w, MAX_IMG_DIM / h, 1);
        var nw = Math.round(w * scale);
        var nh = Math.round(h * scale);
        var canvas = document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        canvas.getContext('2d').drawImage(img, 0, 0, nw, nh);
        var dataUrl = canvas.toDataURL('image/jpeg', IMG_QUALITY);
        resolve({ dataUrl: dataUrl, base64: dataUrl.split(',')[1] });
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        // Fallback: read as-is
        var reader = new FileReader();
        reader.onload = function() {
          resolve({ dataUrl: reader.result, base64: reader.result.split(',')[1] });
        };
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  }

  // Shared blob→GitHub uploader used by the toolbar "Image" button, the
  // mobile camera button, the clipboard paste handler, and annotate.js.
  // Uploads to docs/images/<slug>; returns { slug, path, dataUrl, base64 }.
  // `path` is the markdown-ready relative path ("images/<slug>").
  // filenameHint is optional — if omitted, a timestamp-based slug is generated
  // from the blob's mime type.
  async function uploadImageBlob(blob, filenameHint) {
    if (!window.Lab.gh.isLoggedIn()) throw new Error('Not signed in');
    // Ensure we have a File so resizeImage() works (it reads .type and .size)
    var name = filenameHint;
    if (!name) {
      var ext = (blob.type && blob.type.split('/')[1]) || 'png';
      // Strip codec/parameters ("svg+xml" → "svg", "jpeg; charset=..." → "jpeg")
      ext = ext.split(';')[0].split('+')[0].replace(/[^a-z0-9]/gi, '') || 'png';
      if (ext === 'jpeg') ext = 'jpg';
      name = 'pasted-' + Date.now() + '.' + ext;
    }
    var file = (blob instanceof File) ? blob : new File([blob], name, { type: blob.type || 'image/png' });
    var slug = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
    if (slug.match(/\.(heic|heif)$/) || !slug.includes('.')) {
      slug = slug.replace(/\.[^.]*$/, '') + '.jpg';
    }
    var resized = await resizeImage(file);
    var token = window.Lab.gh.getToken();
    var repoPath = 'docs/images/' + slug;
    var existingSha = null;
    try {
      var check = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/' + repoPath + '?ref=' + window.Lab.gh.BRANCH, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (check.ok) existingSha = (await check.json()).sha;
    } catch(e) {}
    var putBody = { message: 'Upload ' + slug, content: resized.base64, branch: window.Lab.gh.BRANCH };
    if (existingSha) putBody.sha = existingSha;
    var resp = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/' + repoPath, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody)
    });
    if (!resp.ok) {
      var err = await resp.json().catch(function() { return {}; });
      throw new Error(err.message || 'Upload failed (HTTP ' + resp.status + ')');
    }
    return { slug: slug, path: 'images/' + slug, dataUrl: resized.dataUrl, base64: resized.base64 };
  }

  // Convert a data:image/...;base64,AAAA URL to a Blob so it can be uploaded.
  function dataUrlToBlob(dataUrl) {
    var m = /^data:([^;,]+)(?:;([^,]+))?,(.*)$/.exec(dataUrl || '');
    if (!m) return null;
    var mime = m[1] || 'image/png';
    var isBase64 = (m[2] || '').split(';').indexOf('base64') >= 0;
    var raw = isBase64 ? atob(m[3]) : decodeURIComponent(m[3]);
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

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
      // 3-column layout (R3). Desktop: wide modal with fields / body / contents.
      // Narrow: stack the three panes vertically.
      '.em-modal{background:#fff;border-radius:12px;width:95%;max-width:1180px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.2);transform:translateY(20px);transition:transform .2s}',
      '.em-overlay.open .em-modal{transform:translateY(0)}',
      '.em-modal-header{padding:16px 20px;border-bottom:1px solid var(--grey-200);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;gap:12px}',
      '.em-modal-header h2{font-size:17px;font-weight:600;margin:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}',
      '.em-modal-body{flex:1;overflow:hidden;padding:0;display:flex;flex-direction:column;min-height:0}',
      '.em-modal-footer{padding:12px 20px;border-top:1px solid var(--grey-200);display:flex;justify-content:flex-end;gap:8px;flex-shrink:0}',
      '.em-cols{flex:1;display:flex;min-height:0;overflow:hidden}',
      '.em-col{display:flex;flex-direction:column;min-height:0;min-width:0;overflow-y:auto}',
      '.em-col-fields{flex:0 0 300px;border-right:1px solid var(--grey-200);padding:16px 18px;background:#fafafa}',
      '.em-col-body{flex:1 1 auto;padding:0}',
      '.em-col-contents{flex:0 0 340px;border-left:1px solid var(--grey-200);padding:16px 18px;background:#fafafa}',
      '.em-col-heading{font-size:11px;font-weight:700;color:var(--grey-500);text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;display:flex;align-items:center;gap:6px}',
      '.em-col-empty{font-size:12px;color:var(--grey-400);font-style:italic;padding:8px 0}',
      '.em-fields{padding:0}',
      '.em-fields .form-row{display:flex;gap:12px}',
      '.em-fields .form-group{margin-bottom:12px}',
      '/* Modal rendered content: inherits .lab-rendered from base.css, overrides below */',
      '.em-rendered{padding:24px 32px}',
      '.em-rendered table{table-layout:fixed}',
      '.em-rendered td,.em-rendered th{word-wrap:break-word;overflow-wrap:break-word;word-break:break-all}',
      '.em-rendered a{text-decoration:underline}',
      // Contents pane: grid view
      '.em-grid-view{margin-top:6px}',
      '.em-grid-meta{font-size:11px;color:var(--grey-500);margin-bottom:8px}',
      '.em-grid{display:grid;gap:3px;background:var(--grey-200);padding:3px;border-radius:6px}',
      '.em-grid-cell{aspect-ratio:1;background:#fff;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;line-height:1.1;color:var(--grey-700);cursor:pointer;padding:2px;text-align:center;overflow:hidden;transition:transform .08s,box-shadow .08s;position:relative}',
      '.em-grid-cell:hover{transform:scale(1.08);box-shadow:0 2px 6px rgba(0,0,0,.2);z-index:2}',
      '.em-grid-cell.empty{background:#fff;border:1px dashed var(--grey-300);color:var(--grey-400)}',
      '.em-grid-cell.empty:hover{background:var(--teal-light);border-color:var(--teal);color:var(--teal-dark)}',
      '.em-grid-cell.occupied{font-weight:600}',
      '.em-grid-cell.collision{box-shadow:0 0 0 2px #ff6f00 inset}',
      '.em-grid-cell.occupied[draggable="true"]{cursor:grab}',
      '.em-grid-cell.occupied[draggable="true"]:active{cursor:grabbing}',
      '.em-grid-cell.em-grid-dragging{opacity:.4}',
      '.em-grid-cell.em-grid-drop{background:#e0f2f1!important;border:2px dashed #009688!important;color:#00695c!important}',
      '.em-grid-cell .gc-icon{font-size:12px;line-height:1}',
      '.em-grid-cell .gc-label{white-space:pre-line;overflow:hidden;max-height:22px;font-size:8px}',
      '.em-grid-cell .gc-collide{position:absolute;top:1px;right:2px;background:#ff6f00;color:#fff;font-size:9px;font-weight:700;padding:0 4px;border-radius:8px;line-height:14px}',
      '.em-grid-labels-row{display:grid;gap:3px;margin-bottom:2px;padding:0 3px}',
      '.em-grid-label-col{font-size:9px;color:var(--grey-500);text-align:center;font-weight:600}',
      '.em-grid-row{display:grid;gap:3px;align-items:center}',
      '.em-grid-label-row{font-size:9px;color:var(--grey-500);text-align:center;font-weight:600;padding:0 4px 0 3px}',
      '.em-unplaced{margin-top:12px;padding-top:8px;border-top:1px dashed var(--grey-300)}',
      '.em-unplaced h4{font-size:11px;color:var(--grey-500);margin:0 0 6px;text-transform:uppercase;letter-spacing:.3px}',
      '.em-unplaced .em-child-row{font-size:12px}',
      // Contents pane: children list
      '.em-child-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:5px;cursor:pointer;transition:background .08s}',
      '.em-child-row:hover{background:var(--grey-100)}',
      '.em-child-row .ec-icon{font-size:14px;flex-shrink:0}',
      '.em-child-row .ec-title{flex:1;font-size:13px;color:var(--grey-800);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.em-child-row .ec-pos{font-size:10px;color:var(--grey-500);background:#fff;border-radius:10px;padding:1px 6px;flex-shrink:0}',
      '.em-add-btn{width:100%;padding:8px 12px;font-size:12px;background:var(--teal-light);color:var(--teal-dark);border:1px dashed var(--teal);border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px}',
      '.em-add-btn:hover{background:#b2dfdb}',
      // Collision popover
      '.em-collide-pop{position:fixed;z-index:10050;background:#fff;border:1px solid var(--grey-300);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.18);padding:8px;max-width:260px}',
      '.em-collide-pop h5{font-size:11px;margin:0 0 6px;color:var(--grey-500);text-transform:uppercase}',
      '.em-collide-pop .em-child-row{padding:4px 6px}',
      '@media(max-width:900px){.em-cols{flex-direction:column;overflow-y:auto}.em-col{flex:none!important;max-height:none;overflow-y:visible}.em-col-fields{border-right:none;border-bottom:1px solid var(--grey-200);padding:14px 18px}.em-col-contents{border-left:none;border-top:1px solid var(--grey-200)}}',
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
  var ADM_ICONS = { variant: '\uD83D\uDD00', warning: '\u26A0\uFE0F', note: '\u2139\uFE0F', tip: '\uD83D\uDCA1', danger: '\uD83D\uDEA8' };

  // #154: make sure there's a paragraph (even empty) after the leading H1
  // so the cursor can land somewhere that isn't the title. Applies to every
  // object opened in edit mode. The returned string is safe to serialize
  // back to markdown without permanent damage: the " " (single-space
  // paragraph) round-trips through Toast UI as a blank <p> and getMarkdown
  // re-emits it, so saving doesn't strip the padding on subsequent opens.
  function ensureParagraphAfterHeading(md) {
    if (!md || typeof md !== 'string') return md || '';
    // Strip any trailing whitespace just so our append is predictable.
    var trimmed = md.replace(/\s+$/, '');
    // If the body ends with a heading line (nothing substantive after), tack
    // on a blank paragraph. The regex matches the final non-empty line and
    // inspects whether it's a heading.
    var lines = trimmed.split('\n');
    var lastNonEmpty = '';
    for (var i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) { lastNonEmpty = lines[i]; break; }
    }
    if (/^#{1,6}\s/.test(lastNonEmpty)) {
      return trimmed + '\n\n \n';
    }
    // If there's any body after the heading, leave as-is — user already has
    // a real paragraph to click into.
    return md;
  }

  // Convert legacy ??? syntax to blockquote format (one-way migration on edit)
  function migrateAdmonitions(md) {
    // Clean up broken remnants from previous conversion attempts
    md = md.replace(/<!-- adm-sep -->/g, '');
    md = md.replace(/\\> *(?:\uD83D\uDD00|\u26A0\uFE0F|\u2139\uFE0F|\uD83D\uDCA1|\uD83D\uDEA8)[^\n]*/gm, '');
    // Convert ??? blocks to blockquotes
    md = md.replace(/^\?\?\?(\+?)\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, expanded, type, title, body) {
      var icon = ADM_ICONS[type] || '\u2139\uFE0F';
      var bodyLines = body.replace(/^    /gm, '').trimEnd();
      var lines = '> ' + icon + ' **' + title + '**';
      if (bodyLines) {
        lines += '\n' + bodyLines.split('\n').map(function(l) { return '> ' + l; }).join('\n');
      }
      return lines + '\n';
    });
    // Convert !!! blocks to blockquotes
    md = md.replace(/^!!!\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, type, title, body) {
      var icon = ADM_ICONS[type] || '\u2139\uFE0F';
      var bodyLines = body.replace(/^    /gm, '').trimEnd();
      var lines = '> ' + icon + ' **' + title + '**';
      if (bodyLines) {
        lines += '\n' + bodyLines.split('\n').map(function(l) { return '> ' + l; }).join('\n');
      }
      return lines + '\n';
    });
    return md;
  }

  // Render markdown to HTML (with wikilink + admonition preprocessing)
  // Supports both legacy ??? syntax AND blockquote callouts (> ⚠️ **Title**)
  var CALLOUT_COLORS = {
    '\uD83D\uDD00': 'variant',
    '\u26A0\uFE0F': 'warning',
    '\u2139\uFE0F': 'note',
    '\uD83D\uDCA1': 'tip',
    '\uD83D\uDEA8': 'danger',
  };
  async function renderMarkdown(md) {
    await loadMarked();
    var admonitions = [];

    // Strip YAML frontmatter at the top of the doc so it doesn't render as
    // an HR + paragraph + HR. Tolerates --- or *** delimiters (Toast UI's
    // ProseMirror sometimes round-trips --- as ***, both being valid HRs)
    // and a possible blank line between the opening delimiter and the YAML.
    md = md.replace(/^(---|\*\*\*)\r?\n(?:\r?\n)?(?:[a-zA-Z_][\w-]*:[^\n]*\r?\n)+(---|\*\*\*)\r?\n?/, '');

    // Extract legacy ??? blocks
    var processed = md.replace(/^\?\?\?(\+?)\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, expanded, type, title, body) {
      var bodyMd = body.replace(/^    /gm, '');
      var placeholder = '<!--admonition-' + admonitions.length + '-->';
      admonitions.push({ type: type, title: title, bodyMd: bodyMd });
      return placeholder + '\n\n';
    });

    // Extract !!! blocks (MkDocs non-collapsible admonitions)
    processed = processed.replace(/^!!!\s+(\w+)\s+"([^"]+)"\n((?:    .+\n|\n)*)/gm, function(match, type, title, body) {
      var bodyMd = body.replace(/^    /gm, '');
      var placeholder = '<!--admonition-' + admonitions.length + '-->';
      admonitions.push({ type: type, title: title, bodyMd: bodyMd });
      return placeholder + '\n\n';
    });

    // Extract blockquote callouts: > 🔀/⚠️/ℹ️/💡 **Title** followed by > body lines
    // Only captures consecutive > lines (NOT blank lines — those separate blockquotes)
    processed = processed.replace(/^> *(\uD83D\uDD00|\u26A0\uFE0F|\u2139\uFE0F|\uD83D\uDCA1|\uD83D\uDEA8) \*\*([^*]+)\*\* *\n((?:>.*\n?)*)/gm, function(match, icon, title, bodyBlock) {
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

    // R10 #37: rescue `~token~` and `^token^` BEFORE marked runs. With
    // gfm enabled (default) marked eats single-tilde runs as strikethrough
    // and turns `~14~` into `<del>14</del>`, which would prevent us from
    // rendering explicit subscripts later. We swap in placeholders that
    // marked ignores and restore them as <sub>/<sup> after parsing.
    var subSupPlaceholders = [];
    var stashSubSup = function(prefix) {
      return function(_, token) {
        subSupPlaceholders.push({ kind: prefix, text: token });
        return '\u0000' + prefix + (subSupPlaceholders.length - 1) + '\u0000';
      };
    };
    processed = processed.replace(/~([0-9A-Za-z+\-]{1,10})~/g, stashSubSup('SUB'));
    processed = processed.replace(/\^([0-9A-Za-z+\-]{1,10})\^/g, stashSubSup('SUP'));

    // breaks:false matches Toast UI's CommonMark behavior — single newlines stay
    // in the same paragraph; blank lines separate paragraphs. Explicit hard breaks
    // ("  \n") still render as <br> in both viewer and editor. See EDITOR_ARCHITECTURE.md.
    var html = marked.parse(processed, { breaks: false });

    // Restore the sub/sup placeholders.
    html = html.replace(/\u0000(SUB|SUP)(\d+)\u0000/g, function(_, kind, idx) {
      var p = subSupPlaceholders[parseInt(idx, 10)];
      var tag = kind === 'SUB' ? 'sub' : 'sup';
      return '<' + tag + '>' + p.text + '</' + tag + '>';
    });

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

    // R10 #37: chemistry sub/superscript rendering. Two layers:
    //   1. Explicit `~text~` → <sub>, `^text^` → <sup> — standard Markdown
    //      extension syntax that anyone who wants rich chemistry can use.
    //   2. Auto-whitelist of common formulas (H2O, CO2, H2SO4, NaHCO3, …)
    //      gets its digits promoted to Unicode subscripts so existing
    //      chemistry text renders nicely with zero author effort.
    // Both layers run AFTER marked has rendered to HTML, and both skip
    // <code>, <pre>, and <a href="..."> contents so URLs, code blocks,
    // and inline literals are never rewritten.
    html = applyChemistryRendering(html);

    return html;
  }

  // ── R10 #37: chemistry rendering helpers ──
  // Whitelist of common lab chemistry formulas. Anything not in this list
  // is untouched by the auto-substitution layer; users who want arbitrary
  // subscripts can use the `~text~` syntax below. Keys must be exact-match
  // word-boundaried — `HCl` only matches `HCl`, never `HClO` etc.
  var CHEMISTRY_FORMULAS = {
    'H2O': 'H\u2082O',
    'H2O2': 'H\u2082O\u2082',
    'D2O': 'D\u2082O',
    'CO2': 'CO\u2082',
    'O2': 'O\u2082',
    'N2': 'N\u2082',
    'H2': 'H\u2082',
    'Cl2': 'Cl\u2082',
    'NH3': 'NH\u2083',
    'NH4': 'NH\u2084',
    'CH4': 'CH\u2084',
    'C2H5OH': 'C\u2082H\u2085OH',
    'C6H12O6': 'C\u2086H\u2081\u2082O\u2086',
    'H2SO4': 'H\u2082SO\u2084',
    'HNO3': 'HNO\u2083',
    'H3PO4': 'H\u2083PO\u2084',
    'MgCl2': 'MgCl\u2082',
    'CaCl2': 'CaCl\u2082',
    'CaCO3': 'CaCO\u2083',
    'NaHCO3': 'NaHCO\u2083',
    'Na2CO3': 'Na\u2082CO\u2083',
    'Na2SO4': 'Na\u2082SO\u2084',
    'K2SO4': 'K\u2082SO\u2084',
    'MgSO4': 'MgSO\u2084',
    'CuSO4': 'CuSO\u2084',
    'ZnSO4': 'ZnSO\u2084',
    'FeCl3': 'FeCl\u2083',
    'KNO3': 'KNO\u2083',
    'NH4Cl': 'NH\u2084Cl',
    'NH4NO3': 'NH\u2084NO\u2083',
    'KH2PO4': 'KH\u2082PO\u2084',
    'K2HPO4': 'K\u2082HPO\u2084',
    'Na2HPO4': 'Na\u2082HPO\u2084',
    'NaH2PO4': 'NaH\u2082PO\u2084',
  };

  // Pre-build one joined regex over all whitelist keys so we do a single
  // scan per text segment. Sorted by length desc so longer formulas match
  // before their shorter prefixes (e.g. H2SO4 before H2).
  var _chemFormulaRe = (function() {
    var keys = Object.keys(CHEMISTRY_FORMULAS).sort(function(a, b) { return b.length - a.length; });
    var escaped = keys.map(function(k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    // Boundaries: preceded by start or non-alphanumeric, followed by non-alphanumeric or end.
    // Using a lookahead for the trailing boundary so the match itself is just the formula.
    return new RegExp('(^|[^A-Za-z0-9])(' + escaped.join('|') + ')(?![A-Za-z0-9])', 'g');
  })();

  function applyChemistryRendering(html) {
    // Protect regions we must not touch: <pre>...</pre>, <code>...</code>,
    // <a ...>...</a> (URL attribute + link text), and every bare HTML tag.
    // The non-code segments that remain are the rendered text we can edit.
    var protectedRegions = [];
    var protect = function(match) {
      protectedRegions.push(match);
      return '\u0000CHEMPROT' + (protectedRegions.length - 1) + '\u0000';
    };
    var work = html
      .replace(/<pre[\s\S]*?<\/pre>/g, protect)
      .replace(/<code[\s\S]*?<\/code>/g, protect)
      .replace(/<a\s[^>]*?>[\s\S]*?<\/a>/g, protect)
      .replace(/<[^>]+>/g, protect);

    // Auto-whitelist formulas. The explicit `~text~` / `^text^` syntax is
    // handled as a pre-marked preprocessor in renderMarkdown() itself
    // (marked's GFM strikethrough would otherwise consume single tildes
    // before we got a chance to render them as subscripts).
    work = work.replace(_chemFormulaRe, function(m, pre, formula) {
      return pre + CHEMISTRY_FORMULAS[formula];
    });

    // Restore protected regions.
    work = work.replace(/\u0000CHEMPROT(\d+)\u0000/g, function(_, i) {
      return protectedRegions[parseInt(i, 10)];
    });
    return work;
  }

  // ── Popup Mode ──
  var overlayEl = null;
  var currentEditor = null;

  var currentState = null; // { path, sha, meta, body, editing }
  // R7 #32: nav stack so "box → tube → close" returns to the box instead
  // of dismissing to the root. Each entry is the file path string of the
  // previously-open popup. Pushed in openPopup() when there was already a
  // popup visible; popped by closeOrBack() (bound to the X and Close buttons).
  // Fully cleared on hard-close (Escape / outside click / saveWhenNew).
  var navStack = [];
  var isBackNavigation = false;

  function createOverlay() {
    if (overlayEl) return overlayEl;
    injectEditorCSS();

    overlayEl = document.createElement('div');
    overlayEl.className = 'em-overlay';
    // 3-column layout (R3): fields (left) / body (middle) / contents (right).
    // Each column scrolls independently on desktop; stacks vertically on narrow.
    // #em-fields and #em-content IDs are preserved so existing code (rendering,
    // Toast UI mount, wikilink processing) continues to work without changes.
    overlayEl.innerHTML =
      '<div class="em-modal">' +
        '<div class="em-modal-header">' +
          '<h2 id="em-title">Loading...</h2>' +
          '<button class="modal-close" id="em-close"><span class="material-icons-outlined">close</span></button>' +
        '</div>' +
        '<div class="em-modal-body">' +
          '<div class="em-cols">' +
            '<div class="em-col em-col-fields" id="em-col-fields">' +
              '<h4 class="em-col-heading"><span class="material-icons-outlined" style="font-size:13px">label</span> Fields</h4>' +
              '<div id="em-fields" class="em-fields"></div>' +
            '</div>' +
            '<div class="em-col em-col-body" id="em-col-body">' +
              '<div id="em-content"></div>' +
            '</div>' +
            '<div class="em-col em-col-contents" id="em-col-contents">' +
              '<h4 class="em-col-heading"><span class="material-icons-outlined" style="font-size:13px">inventory_2</span> Contents</h4>' +
              '<div id="em-contents"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="em-modal-footer" id="em-footer">' +
          '<button class="btn btn-outline" id="em-cancel">Close</button>' +
          '<button class="btn btn-outline" id="em-delete" style="display:none;color:var(--red,#ef4444)" title="Delete this object"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>' +
          '<button class="btn btn-outline" id="em-edit-toggle" style="display:none"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>' +
          '<button class="btn btn-primary" id="em-save" style="display:none"><span class="material-icons-outlined" style="font-size:16px">save</span> Save</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlayEl);

    // Close handlers
    // R7 #32: X and Close button go back-one-level if there's a nav stack,
    // so that "box → tube → close" returns to the box. Escape and outside
    // click are the full-dismiss escape hatches that blow the whole stack.
    document.getElementById('em-close').onclick = closeOrBack;
    document.getElementById('em-cancel').onclick = closeOrBack;
    // Only close when BOTH mousedown and mouseup happen on the overlay itself.
    // This prevents accidental closes when the user drags a text selection and
    // the cursor drifts outside the modal card on mouseup.
    var _overlayMousedownTarget = null;
    overlayEl.addEventListener('mousedown', function(e) { _overlayMousedownTarget = e.target; });
    overlayEl.addEventListener('click', function(e) {
      if (e.target === overlayEl && _overlayMousedownTarget === overlayEl) close();
      _overlayMousedownTarget = null;
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlayEl.classList.contains('open')) close();
    });

    // Delete — deletes the current object after confirmation.
    // Issue #104: events with a recurrence_id (members of a recurring series)
    // get a 3-button choice: this occurrence, entire series, or cancel.
    document.getElementById('em-delete').onclick = async function() {
      if (!currentState || !currentState.path) return;
      var title = (currentState.meta && currentState.meta.title) || currentState.path.split('/').pop();
      var meta = currentState.meta || {};
      var isRecurringEvent = meta.type === 'event' && meta.recurrence_id;

      if (isRecurringEvent) {
        // Custom 3-button modal (this/series/cancel) since Lab.modal.confirm is binary.
        var choice = await window.Lab.calendarDelete && window.Lab.calendarDelete.confirmRecurring
          ? await window.Lab.calendarDelete.confirmRecurring(title)
          : null;
        if (!choice || choice === 'cancel') return;
        try {
          if (choice === 'series') {
            var deleted = await window.Lab.calendarDelete.deleteSeries(meta.recurrence_id);
            if (Lab.hierarchy) Lab.hierarchy.invalidate();
            if (Lab.showToast) Lab.showToast('Deleted ' + deleted + ' events in series', 'success');
            // Dispatch one event per deleted path so the calendar refreshes
            // (the calendar's lab-file-saved listener removes by path).
            // The deleteSeries helper already cleans up the in-memory schedule.
          } else {
            // Single occurrence
            await Lab.gh.deleteFile(currentState.path);
            if (Lab.gh.removeFromObjectIndex) Lab.gh.removeFromObjectIndex(currentState.path);
            if (Lab.hierarchy) Lab.hierarchy.invalidate();
            if (Lab.showToast) Lab.showToast('Deleted: ' + title, 'success');
            window.dispatchEvent(new CustomEvent('lab-file-saved', { detail: { path: currentState.path } }));
          }
          closeOrBack();
        } catch(e) {
          if (Lab.showToast) Lab.showToast('Delete failed: ' + e.message, 'error');
        }
        return;
      }

      var confirmed = await Lab.modal.confirm({
        title: 'Delete Object',
        message: 'Delete "' + title + '"?\nThis cannot be undone.',
        confirmText: 'Delete',
        danger: true,
      });
      if (!confirmed) return;
      try {
        await Lab.gh.deleteFile(currentState.path);
        if (Lab.gh.removeFromObjectIndex) Lab.gh.removeFromObjectIndex(currentState.path);
        if (Lab.hierarchy) Lab.hierarchy.invalidate();
        if (Lab.showToast) Lab.showToast('Deleted: ' + title, 'success');
        window.dispatchEvent(new CustomEvent('lab-file-saved', { detail: { path: currentState.path } }));
        closeOrBack();
      } catch(e) {
        if (Lab.showToast) Lab.showToast('Delete failed: ' + e.message, 'error');
      }
    };

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

  // After renderFields writes a `<span data-parent-pill="slug">`,
  // `<span data-of-pill="slug">`, or `<span data-member-pill="slug">`
  // placeholder, this replaces the placeholder with a proper object pill
  // that navigates when clicked. If the slug can't be resolved in the
  // index, the placeholder stays as raw text.
  async function upgradeParentField() {
    var pills = document.querySelectorAll('[data-parent-pill], [data-of-pill], [data-member-pill]');
    if (!pills.length || !window.Lab.hierarchy) return;
    for (var i = 0; i < pills.length; i++) {
      var span = pills[i];
      var raw = span.getAttribute('data-parent-pill') ||
                span.getAttribute('data-of-pill') ||
                span.getAttribute('data-member-pill') || '';
      // For `of`/`member`, slugs are usually bare (e.g. "resources/ethanol-absolute"
      // or just a person name). normalizeParent handles already-normalized
      // slugs safely, so reuse it for all three fields.
      var norm = window.Lab.hierarchy.normalizeParent(raw);
      if (!norm) continue;
      var entry = await window.Lab.hierarchy.get(norm);
      // Member field wikilinks often use a display name like "Dr. Monroe"
      // rather than the file slug "people/dr-monroe". If the direct lookup
      // fails, fall back to searching the cached index for a person whose
      // title matches the raw display name (case-insensitive).
      if (!entry && span.hasAttribute('data-member-pill')) {
        try {
          var idx = window.Lab.gh && window.Lab.gh._getCachedIndex && window.Lab.gh._getCachedIndex();
          if (idx && idx.length) {
            var rawLower = String(raw).toLowerCase();
            var match = idx.find(function(e) {
              if (e.type !== 'person') return false;
              return String(e.title || '').toLowerCase() === rawLower;
            });
            if (match) {
              norm = String(match.path).replace(/\.md$/, '');
              entry = await window.Lab.hierarchy.get(norm);
            }
          }
        } catch(e) { /* non-fatal */ }
      }
      if (!entry) continue; // leave as raw text if unresolved
      var type = entry.type || 'container';
      var style = window.Lab.types.pillStyle(type);
      var rawIcon = window.Lab.types.get(type).icon;
      var icon = window.Lab.types.renderIcon ? window.Lab.types.renderIcon(rawIcon) : rawIcon;
      var title = entry.title || norm.split('/').pop();
      var pill = document.createElement('a');
      pill.href = 'javascript:void(0)';
      pill.className = 'object-pill';
      // Fields column is narrow (300px - 80px label = ~200px for value). Long
      // titles must truncate with ellipsis so the pill stays inside the column
      // instead of overflowing into the body. Icon stays visible; only the
      // title text shrinks + ellipsis.
      pill.setAttribute('style', style + 'max-width:100%;min-width:0;');
      pill.setAttribute('title', title);
      pill.innerHTML = icon + ' <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">' + escHtml(title) + '</span>';
      pill.addEventListener('click', function(slug) {
        return function(e) {
          e.preventDefault();
          openPopup('docs/' + slug + '.md');
        };
      }(norm));
      span.innerHTML = '';
      span.appendChild(pill);
    }
  }

  function escHtml(s) {
    return window.Lab.escHtml(String(s == null ? '' : s));
  }

  // Open the modal for creating a new object. Goes straight into edit mode
  // with fields pre-filled from the opts argument. The type field defaults
  // to opts.defaultType but the user can change it via the datalist.
  //
  // opts:
  //   parent       — slug of the parent object (optional)
  //   position     — grid cell like "A1" (optional, typically set when called
  //                  from an empty grid cell)
  //   defaultType  — initial type, auto-picked from parent (see autoChildType)
  //   returnTo     — path to reopen after save/close (optional; typically the
  //                  parent popup that spawned the create). If omitted, the
  //                  parent path is computed from opts.parent.
  async function openNew(opts) {
    opts = opts || {};
    createOverlay();
    if (!window.Lab.gh) { window.Lab.showToast('GitHub API not loaded', 'error'); return; }

    // R7 #32: push the current popup onto the nav stack so cancel/back
    // returns to it. Save-new already has its own returnTo flow that
    // clears navStack via close(), so there's no double-handling.
    if (currentState && currentState.path && overlayEl && overlayEl.classList.contains('open')) {
      navStack.push(currentState.path);
    }

    // Record where to return after save/close so the parent pane can refresh.
    var returnTo = opts.returnTo || (opts.parent ? 'docs/' + opts.parent + '.md' : null);

    var defaultType = opts.defaultType || 'container';
    // Suggest a slug from a placeholder title. User will edit both.
    var titleSeed = 'New ' + (Lab.types.get(defaultType).label || 'item');
    var slugSeed = titleSeed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    // Append a short timestamp suffix to avoid collisions; user can rename.
    var stamp = Date.now().toString(36);
    var newSlug = slugSeed + '-' + stamp;

    // Decide the directory: location types → docs/locations/, others → group dir.
    var group = Lab.types.get(defaultType).group;
    var dir = 'locations';
    var groupCfg = Lab.types.GROUPS[group];
    if (groupCfg && groupCfg.dir) dir = groupCfg.dir;
    var newPath = 'docs/' + dir + '/' + newSlug + '.md';

    // Seed meta with parent/position/type + creation stamps.
    var meta = {
      type: defaultType,
      title: titleSeed,
    };
    if (opts.parent)   meta.parent = opts.parent;
    if (opts.position) meta.position = opts.position;

    currentState = {
      path: newPath,
      sha: null,   // new file — saveFile will create without sha
      meta: meta,
      body: '',
      editing: true,
      isNew: true,
      returnTo: returnTo,
    };

    document.getElementById('em-title').textContent = 'New ' + (Lab.types.get(defaultType).label || 'item');
    overlayEl.classList.add('open');
    // R7 #23: openNew enters edit mode directly — set the body class now
    // so the issue FAB hides (close() will clear it).
    document.body.classList.add('em-editing');

    // Render fields in edit mode immediately.
    renderFields(meta, true);
    document.getElementById('em-edit-toggle').style.display = 'none';
    document.getElementById('em-delete').style.display = 'none';
    document.getElementById('em-save').style.display = '';

    // Clear cols 2 and 3 SYNCHRONOUSLY before awaiting Toast UI. Otherwise
    // the old popup's rendered body and contents pane stay visible while the
    // Toast UI bundle downloads, which looks like the previous object is
    // still open even though the title and fields have already updated.
    var contentEl = document.getElementById('em-content');
    contentEl.innerHTML = '<div class="em-surface" style="min-height:500px"><div class="loading-state" style="padding:40px;text-align:center;color:var(--grey-500)"><div class="spinner"></div><p>Loading editor…</p></div></div>';
    var contentsMount = document.getElementById('em-contents');
    if (contentsMount) contentsMount.innerHTML = '<div class="em-col-empty">This item has no contents yet. Save it first, then add children.</div>';

    // Mount an empty Toast UI editor in col 2.
    await loadToast();
    // Re-query the surface — user may have closed the modal while we were loading.
    var editorSurface = document.getElementById('em-content');
    if (!editorSurface || !overlayEl.classList.contains('open')) return;
    editorSurface.innerHTML = '<div class="em-surface" style="min-height:500px"></div>';
    var editorEl = editorSurface.querySelector('.em-surface');
    currentEditor = new toastui.Editor({
      el: editorEl,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: 'auto',
      minHeight: '500px',
      initialValue: '',
      usageStatistics: false,
      toolbarItems: isMobile() ? [] :
        [['heading', 'bold', 'italic', 'strike'], ['hr', 'quote'], ['ul', 'ol', 'task'], ['table', 'link', 'code']],
    });
    injectCategoryPills(editorEl, currentEditor);

    // Attach inline [[ autocomplete for openNew — same as startEditing.
    try {
      if (window.Lab.wikilinkAutocomplete) {
        setTimeout(function() {
          try { Lab.wikilinkAutocomplete.attach(currentEditor, editorEl); } catch(e) {}
        }, 200);
      }
    } catch(e) {}
  }

  async function openPopup(filePath) {
    createOverlay();
    var gh = window.Lab.gh;
    if (!gh) { window.Lab.showToast('GitHub API not loaded', 'error'); return; }

    // R7 #32: if there's already a popup open for a different file and
    // we're not arriving here via the back button, push the previous
    // path onto the nav stack so the user can walk back.
    if (!isBackNavigation && currentState && currentState.path && currentState.path !== filePath && overlayEl && overlayEl.classList.contains('open')) {
      navStack.push(currentState.path);
    }
    isBackNavigation = false;

    // Reset state
    currentState = { path: filePath, sha: null, meta: {}, body: '', editing: false };
    document.getElementById('em-title').textContent = 'Loading...';
    document.getElementById('em-fields').style.display = 'none';
    document.getElementById('em-fields').innerHTML = '';
    document.getElementById('em-content').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>';
    // R7 #30: reset the Edit/View toggle to "Edit" on every open. Without this,
    // if the user edits item A then opens item B directly (without first
    // clicking View to stop editing), the button still reads "View" while the
    // new popup is actually in view mode — confusing and inverted.
    var editToggleBtn = document.getElementById('em-edit-toggle');
    editToggleBtn.style.display = 'none';
    editToggleBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">edit</span> Edit';
    document.getElementById('em-save').style.display = 'none';
    document.getElementById('em-delete').style.display = 'none';
    // R7 #23: openPopup always enters view mode, so the em-editing body
    // class must not leak from a previous popup's edit state.
    document.body.classList.remove('em-editing');
    overlayEl.classList.add('open');

    try {
      // Check localStorage cache first (written on save to avoid GitHub API delay)
      var cached = null;
      try {
        var fileCache = JSON.parse(localStorage.getItem('lab_file_cache')) || {};
        if (fileCache[filePath]) cached = fileCache[filePath];
      } catch(e) {}

      // R6.5 fix: if fetchFile fails (e.g. cache-lag 404 right after a create),
      // fall back to the localStorage cache instead of showing an error state.
      // Without this the save() below runs with currentState.sha=null and
      // GitHub's PUT /contents rejects the update.
      var result = null;
      var fetchError = null;
      try {
        result = await gh.fetchFile(filePath);
      } catch(fetchErr) {
        fetchError = fetchErr;
      }
      if (result) {
        currentState.sha = result.sha;
      } else if (cached && cached.content) {
        currentState.sha = cached.sha || null;
      } else {
        throw fetchError || new Error('Failed to load ' + filePath);
      }

      // Use cached content if it's newer (GitHub API can lag after a commit).
      // Critically: also use the cached sha — the API may return the stale blob
      // sha, which would cause the next save to 409.
      var content = result ? result.content : cached.content;
      if (result && cached && cached.savedAt && cached.content) {
        var age = Date.now() - cached.savedAt;
        if (age < 120000) {
          content = cached.content;
          if (cached.sha) currentState.sha = cached.sha;
        }
      }

      var parsed = window.Lab.parseFrontmatter(content);
      currentState.meta = parsed.meta;
      currentState.body = parsed.body;

      // Title
      var title = parsed.meta.title || filePath.split('/').pop().replace('.md', '');
      document.getElementById('em-title').textContent = title;

      // Show edit/delete for logged-in users
      if (gh.isLoggedIn()) {
        document.getElementById('em-edit-toggle').style.display = '';
        document.getElementById('em-delete').style.display = '';
      }

      // Default to view mode — user clicks Edit to switch
      renderFields(parsed.meta, false);

      // Upgrade the `parent` read-only field into a real clickable object pill
      // (icon + title + opens parent popup on click). Done after renderFields
      // writes the placeholder span. If the slug doesn't resolve, leave as text.
      try {
        await upgradeParentField();
      } catch(e) { /* non-fatal */ }

      var html = await renderMarkdown(parsed.body);
      var contentEl = document.getElementById('em-content');

      // Breadcrumb for any object in the location hierarchy (parent ref chain).
      // Renders nothing for objects with no resolvable parent chain or for
      // root objects (chain length 1) where the breadcrumb would just repeat
      // the H1 title below it.
      var crumbHTML = '';
      try {
        if (window.Lab.hierarchy) {
          var slug = filePath.replace(/^docs\//, '').replace(/\.md$/, '');
          var chain = await window.Lab.hierarchy.parentChain(slug);
          // POPUP-BREADCRUMB-RACE-AFTER-SAVE (cycle 29): when a freshly-saved or
          // freshly-created object isn't yet in the cached object-index,
          // parentChain returns an empty / single-element chain even though
          // the file's `parent:` field is on disk. Patch the in-memory index
          // with our just-loaded meta and retry once so the breadcrumb renders
          // on the first popup view rather than waiting for a hard reload.
          if ((!chain || chain.length < 2) && parsed.meta && parsed.meta.parent && window.Lab.gh && window.Lab.gh.patchObjectIndex) {
            window.Lab.gh.patchObjectIndex(filePath, parsed.meta);
            chain = await window.Lab.hierarchy.parentChain(slug);
          }
          if (chain && chain.length > 1) {
            crumbHTML = await window.Lab.hierarchy.breadcrumbHTML(slug);
          }
        }
      } catch(e) { /* non-fatal */ }

      // #125: plain location cards often have no body content, which rendered
      // as empty whitespace under the title. Show an italic placeholder so the
      // reader knows the area is a description area that they can fill in.
      var bodyTextLen = (parsed.body || '').replace(/\s+/g, '').length;
      var bodyBlockHTML = bodyTextLen
        ? '<div class="lab-rendered em-rendered">' + html + '</div>'
        : '<div class="em-empty-body" style="color:var(--grey-500);font-style:italic;font-size:14px;padding:8px 0">No description yet. Click Edit to add notes, images, or links.</div>';
      contentEl.innerHTML = crumbHTML + bodyBlockHTML;
      if (window.Lab.wikilinks) {
        await window.Lab.wikilinks.processRendered(contentEl);
      }
      if (window.Lab.postProcessImages) {
        window.Lab.postProcessImages(contentEl);
      }

      // Contents column: grid / children list / container_list / empty.
      // Non-fatal on error so the popup still shows fields + body.
      try {
        await renderContents(currentState, false);
      } catch(e) { /* non-fatal */ console.warn('renderContents failed:', e); }
    } catch(e) {
      document.getElementById('em-content').innerHTML = '<div class="empty-state"><span class="material-icons-outlined">error</span><p>' + window.Lab.escHtml(e.message) + '</p></div>';
    }
  }

  // ── Container row rendering / collection ──
  var CONTAINER_LOCATIONS = ['Chemical Cabinet','Corrosive Cabinet','Flammable Cabinet','Hazardous Cabinet','Refrigerator','Freezer -20C','Freezer -80C','Bench','Other'];
  var CONTAINER_GRID = 'display:grid;grid-template-columns:1.5fr 0.7fr 0.7fr 1fr 1.2fr auto;gap:6px;align-items:center;';

  function renderContainerHeader() {
    var lbl = 'font-size:11px;color:var(--grey-500);text-transform:uppercase;letter-spacing:0.4px;padding:0 4px';
    return '<div style="' + CONTAINER_GRID + 'margin-bottom:2px">' +
      '<div style="' + lbl + '">Location</div>' +
      '<div style="' + lbl + '">Qty</div>' +
      '<div style="' + lbl + '">Unit</div>' +
      '<div style="' + lbl + '">Lot</div>' +
      '<div style="' + lbl + '">Expires</div>' +
      '<div></div>' +
      '</div>';
  }

  function renderContainerRow(fieldKey, c, idx) {
    c = c || {};
    var esc = window.Lab.escHtml;
    function selectHtml(name, opts, val) {
      return '<select data-cfield="' + name + '" style="padding:4px 6px;font-size:13px">' +
        '<option value=""></option>' +
        opts.map(function(o) { return '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
        '</select>';
    }
    return '<div class="em-container-row" data-idx="' + idx + '" style="' + CONTAINER_GRID + 'margin-bottom:4px">' +
      selectHtml('location', CONTAINER_LOCATIONS, c.location || '') +
      '<input type="number" data-cfield="quantity" value="' + esc(String(c.quantity == null ? '' : c.quantity)) + '" placeholder="Qty" step="any" min="0" style="padding:4px 6px;font-size:13px">' +
      '<input type="text" data-cfield="unit" value="' + esc(c.unit || '') + '" placeholder="units" style="padding:4px 6px;font-size:13px">' +
      '<input type="text" data-cfield="lot" value="' + esc(c.lot || '') + '" placeholder="Lot #" style="padding:4px 6px;font-size:13px">' +
      '<input type="date" data-cfield="expiration" value="' + esc(c.expiration || '') + '" title="Expiration date" style="padding:4px 6px;font-size:13px">' +
      '<button type="button" onclick="Lab.editorModal._removeContainer(this)" title="Remove" style="background:none;border:none;color:var(--grey-500);cursor:pointer;padding:2px"><span class="material-icons-outlined" style="font-size:18px">close</span></button>' +
      '</div>';
  }

  function addContainerRow(fieldKey) {
    var wrap = document.getElementById('em-containers-' + fieldKey);
    if (!wrap) return;
    var idx = wrap.querySelectorAll('.em-container-row').length;
    // Insert before the (non-existent) end; header is the wrap's first child if present
    wrap.insertAdjacentHTML('beforeend', renderContainerRow(fieldKey, {}, idx));
  }

  function removeContainerRow(btn) {
    var row = btn.closest('.em-container-row');
    if (row) row.remove();
  }

  function collectContainers(meta) {
    document.querySelectorAll('[data-container-list]').forEach(function(wrap) {
      var key = wrap.getAttribute('data-container-list');
      var rows = wrap.querySelectorAll('.em-container-row');
      var arr = [];
      rows.forEach(function(r) {
        var c = {};
        r.querySelectorAll('[data-cfield]').forEach(function(input) {
          var k = input.getAttribute('data-cfield');
          var v = input.value;
          if (v === '') return;
          if (input.type === 'number') v = parseFloat(v);
          c[k] = v;
        });
        if (Object.keys(c).length) arr.push(c);
      });
      meta[key] = arr;
    });
  }

  // Discovered types: all known TYPES plus every unique `type` string seen in
  // the current object index. Used to populate the type datalist so the set
  // of choices grows as users create new kinds of things. Unknown types that
  // appear in the dropdown get the default icon/color until someone hard-codes
  // an entry in types.js.
  function collectDiscoveredTypes() {
    var known = Object.keys(Lab.types.TYPES || {});
    var set = {};
    known.forEach(function(k) { set[k] = true; });
    try {
      // gh.fetchObjectIndex returns a promise, but there's a synchronous
      // shortcut: the underlying cache is already populated by the time any
      // popup opens (lab.js loads github-api.js before editor-modal.js, and
      // every page that uses the modal has already called fetchObjectIndex
      // to render its own content). Falling back to known-only is fine.
      var idx = Lab.gh && Lab.gh.__cache;
      if (!idx && window.Lab && window.Lab.hierarchy) {
        // hierarchy.build() caches in its own module; we can read the graph
        // indirectly by querying resolveParentSlug for a sentinel, but the
        // cleaner path is just the array approach below.
      }
    } catch(e) {}
    // Fallback: pull from the object index if it's available synchronously.
    // We attached it to Lab.gh inside fetchObjectIndex via `_objectIndex`.
    // Use a private hook that reads the cached array without awaiting.
    var cached = (Lab.gh && typeof Lab.gh._getCachedIndex === 'function')
      ? Lab.gh._getCachedIndex() : null;
    if (Array.isArray(cached)) {
      cached.forEach(function(e) {
        if (e && e.type) set[String(e.type)] = true;
      });
    }
    var out = Object.keys(set).sort();
    return out;
  }

  function renderFields(meta, editable) {
    var type = meta.type || 'reagent';
    var schema = getSchema(type);
    var fieldsEl = document.getElementById('em-fields');
    fieldsEl.style.display = '';
    if (!schema || schema.length === 0) {
      fieldsEl.innerHTML = '<div class="em-col-empty">No structured fields for this type.</div>';
      return;
    }
    var html = '';

    // Discovered types: union of known TYPES and any type string seen in
    // the current object index. Used to populate the datalist below so users
    // can pick any existing value (or type a fresh one to create a new type).
    var discoveredTypes = collectDiscoveredTypes();

    // Always render the `type` field as a datalist input at the top — even if
    // the schema declared it as hidden. This gives R3's "any type, extensible"
    // UX. The datalist is shared across fields so we only emit it once.
    var hasTypeField = schema.some(function(f) { return f.key === 'type'; });
    var typeShown = false;
    if (hasTypeField) {
      var currentType = meta.type || (type);
      if (editable) {
        // #149: the old "flat grid of 25 pills" was overwhelming. Default to
        // showing the current type alone, with a "Change type" link that
        // expands the full picker on demand. The expanded picker keeps the
        // same context filter (instance vs concept, location vs generic)
        // and also exposes a free-text input for ad-hoc types — type any
        // string, click "Use", and it's saved as this object's type.
        var currentTc = Lab.types.get(currentType);
        var currentStyle = Lab.types.pillStyle(currentType);
        html += '<div class="form-group"><label>Type</label>';
        html += '<input type="hidden" id="em-f-type" class="em-field-input" data-key="type" value="' + escHtml(currentType) + '">';
        html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
        html +=   '<span id="em-type-current" style="' + currentStyle + ';font-size:12px;padding:4px 10px;border-radius:12px;font-weight:500;display:inline-flex;align-items:center;gap:5px">' +
                    Lab.types.renderIcon(currentTc.icon) + ' ' + escHtml(currentTc.label || currentType) +
                  '</span>';
        html +=   '<button type="button" id="em-type-toggle" style="border:none;background:transparent;color:var(--teal-dark,#00695c);cursor:pointer;font-family:inherit;font-size:12px;padding:2px 6px;border-radius:4px;display:inline-flex;align-items:center;gap:2px">' +
                    'Change type <span class="material-icons-outlined" style="font-size:14px" id="em-type-toggle-icon">expand_more</span>' +
                  '</button>';
        html += '</div>';

        // Expanded picker — hidden until "Change type" is clicked.
        html += '<div id="em-type-picker-expand" style="display:none;margin-top:8px;padding:10px;border:1px solid var(--grey-200,#e5e7eb);border-radius:8px;background:var(--grey-50,#fafafa)">';
        html +=   '<div id="em-type-picker" style="display:flex;flex-wrap:wrap;gap:4px">';
        var groups = Lab.types.GROUPS || {};
        var isInstance = !!meta.of;
        var instanceTypes = { bottle: 1, tube: 1, container: 1, sample: 1, extraction: 1, library: 1, pool: 1 };
        var hideFromInstances = { protocol: 1, person: 1, project: 1, notebook: 1, event: 1, guide: 1, waste_container: 1 };
        var currentTypeMeta = Lab.types.get(currentType);
        var currentIsLocation = currentTypeMeta && currentTypeMeta.group === 'locations';
        Object.keys(groups).forEach(function(gk) {
          var g = groups[gk];
          (g.types || []).forEach(function(t) {
            if (t !== currentType) {
              if (isInstance && hideFromInstances[t]) return;
              if (!isInstance && !currentIsLocation && instanceTypes[t]) return;
            }
            var tc = Lab.types.get(t);
            var sel = (t === currentType);
            html += '<button type="button" data-type-pick="' + escHtml(t) + '"' +
              ' style="' + Lab.types.pillStyle(t) +
              ';cursor:pointer;border:2px solid ' + (sel ? tc.color || '#333' : 'transparent') +
              ';opacity:' + (sel ? '1' : '0.6') +
              ';font-size:11px;padding:3px 8px;border-radius:12px;transition:opacity .15s,border-color .15s' +
              '">' + Lab.types.renderIcon(tc.icon) + ' ' + escHtml(tc.label || t) + '</button>';
          });
        });
        html += '</div>';
        // Ad-hoc type row: free-text input + "Use" button so users can
        // save any string as the type. The object-index will carry it and
        // future datalists will surface it via collectDiscoveredTypes,
        // which is how it "becomes permanent" (matches #149 ask).
        html += '<div style="display:flex;gap:6px;margin-top:10px;align-items:center">' +
                  '<span style="font-size:11px;color:var(--grey-500);flex-shrink:0">Custom:</span>' +
                  '<input type="text" id="em-type-custom" placeholder="type anything, then Use" autocomplete="off" ' +
                    'style="flex:1;padding:5px 8px;border:1px solid var(--grey-300,#d1d5db);border-radius:4px;font-size:12px;font-family:inherit;outline:none">' +
                  '<button type="button" id="em-type-custom-apply" ' +
                    'style="padding:5px 10px;font-size:11px;background:var(--teal,#009688);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:inherit;font-weight:600">Use</button>' +
                '</div>';
        html += '<div style="font-size:10px;color:var(--grey-500);margin-top:6px">Custom types are saved on the object and become available on other items via type autocomplete.</div>';
        html += '</div>';
        html += '</div>';
      } else {
        var tc = Lab.types.get(currentType);
        var style = Lab.types.pillStyle(currentType);
        html += '<div style="display:flex;gap:8px;margin-bottom:10px;font-size:14px;align-items:center">' +
          '<span style="color:var(--grey-500);min-width:80px">Type</span>' +
          '<span style="' + style + '">' + Lab.types.renderIcon(tc.icon) + ' ' + escHtml(tc.label || currentType) + '</span>' +
          '</div>';
      }
      typeShown = true;
    }

    // Wikilink field — always visible, read-only, with copy icon
    if (currentState && currentState.path) {
      var _wlSlug = currentState.path.replace(/^docs\//, '').replace(/\.md$/, '');
      var _wl = '[[' + _wlSlug + ']]';
      html += '<div style="display:flex;gap:8px;margin-bottom:8px;font-size:13px;align-items:center">' +
        '<span style="color:var(--grey-400);min-width:80px">Link</span>' +
        '<code class="em-wikilink-display" style="font-family:monospace;font-size:12px;background:var(--grey-100);padding:2px 8px;border-radius:4px;color:var(--grey-600);user-select:all">' + escHtml(_wl) + '</code>' +
        '<button type="button" class="em-copy-wikilink" title="Copy wikilink" style="border:none;background:none;cursor:pointer;padding:2px;line-height:1">' +
          '<span class="material-icons-outlined" style="font-size:16px;color:var(--grey-400)">content_copy</span>' +
        '</button></div>';
    }

    // Group small fields into rows
    var row = [];
    schema.forEach(function(field) {
      // Skip hidden fields (including the "hidden" form of the type field —
      // we already rendered type as a datalist above).
      if (field.type === 'hidden') return;
      if (field.key === 'type' && typeShown) return;

      var val = meta[field.key] !== undefined ? meta[field.key] : (field.default !== undefined ? field.default : '');
      var id = 'em-f-' + field.key;

      // Read-only audit metadata: shown in view mode and edit mode, never edited
      if (field.type === 'meta_readonly') {
        if (val === '' || val === undefined || val === null) return;
        if (row.length) { html += '<div class="form-row">' + row.join('') + '</div>'; row = []; }
        var displayVal = String(val);
        if (field.key === 'created_at' || field.key === 'updated_at') {
          var d = new Date(val);
          if (!isNaN(d.getTime())) displayVal = d.toLocaleString();
        }
        html += '<div style="display:flex;gap:8px;margin-bottom:4px;font-size:12px;color:var(--grey-500)">' +
          '<span style="min-width:80px">' + field.label + '</span>' +
          '<span>' + window.Lab.escHtml(displayVal) + '</span></div>';
        return;
      }

      // Container list: repeating rows of {location, quantity, unit, lot, expiration}.
      // As of R3 these render into the Contents column (col 3) via renderContents()
      // below. Skip them here so they don't appear in the Fields column too.
      if (field.type === 'container_list') {
        return;
      }

      if (editable) {
        var input = '';
        // Parent field: render a custom location-picker widget instead of text input
        if (field.key === 'parent') {
          var parentVal = window.Lab.escHtml(String(val));
          var displayText = val ? String(val).split('/').pop().replace(/-/g, ' ') : 'Click to select location…';
          input =
            '<input type="hidden" id="' + id + '" class="em-field-input" data-key="parent" value="' + parentVal + '">' +
            '<div id="em-parent-picker-trigger" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--grey-300,#d1d5db);border-radius:6px;cursor:pointer;background:#fff;min-height:38px;font-size:14px;font-family:inherit;transition:border-color .15s">' +
              '<span class="material-icons-outlined" style="font-size:18px;color:var(--grey-400,#9ca3af);flex-shrink:0">account_tree</span>' +
              '<span id="em-parent-picker-label" style="flex:1;color:' + (val ? 'var(--grey-800,#1f2937)' : 'var(--grey-400,#9ca3af)') + ';font-weight:' + (val ? '500' : '400') + '">' + escHtml(displayText) + '</span>' +
              (val ? '<button type="button" id="em-parent-picker-clear" style="border:none;background:none;cursor:pointer;padding:2px;display:flex;align-items:center"><span class="material-icons-outlined" style="font-size:16px;color:var(--grey-400)">close</span></button>' : '') +
              '<span class="material-icons-outlined" style="font-size:16px;color:var(--grey-400,#9ca3af);flex-shrink:0">expand_more</span>' +
            '</div>' +
            // #150: big, easy-to-scan popover. Actual width/height set in
            // openParentDropdown so it can react to viewport; the inline
            // style here is just a visible fallback if sizing JS fails.
            '<div id="em-parent-picker-dropdown" style="display:none;position:fixed;z-index:12000;background:#fff;border:1px solid var(--grey-200,#e5e7eb);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.22);width:620px;max-height:70vh;overflow:hidden;display:none;flex-direction:column"></div>';
          if (row.length) { html += '<div class="form-row">' + row.join('') + '</div>'; row = []; }
          html += '<div class="form-group"><label>' + field.label + '</label>' + input + '</div>';
          return;
        }
        // Of field: text input with datalist autocomplete over concept slugs.
        // R20 (#165): accessions must be in the picker for sample/extraction/
        // library/pool (and tubes, which can also point at an accession when
        // they're storing tissue or extract). For bottles, `of:` still
        // points at a reagent/stock concept, not an accession.
        if (field.key === 'of') {
          var ofVal = window.Lab.escHtml(String(val));
          var listId = 'em-of-datalist';
          var ofType = meta.type || type;
          var conceptDirs;
          if (ofType === 'bottle') {
            // Bottles belong to reagents/stocks only.
            conceptDirs = { resources: 1, stocks: 1 };
          } else if (ofType === 'sample' || ofType === 'extraction' || ofType === 'library' || ofType === 'pool') {
            // Biological-instance types: the parent concept is always an accession.
            conceptDirs = { accessions: 1 };
          } else if (ofType === 'tube') {
            // Tubes are generic containers — they can hold reagents, stock
            // aliquots, or tissue/DNA for an accession.
            conceptDirs = { accessions: 1, samples: 1, resources: 1, stocks: 1 };
          } else {
            conceptDirs = { accessions: 1, samples: 1, resources: 1, stocks: 1 };
          }
          var cachedOfIdx = (window.Lab.gh && window.Lab.gh._getCachedIndex && window.Lab.gh._getCachedIndex()) || [];
          var ofOptions = [];
          var seenOf = {};
          cachedOfIdx.forEach(function(e) {
            if (!e || !e.path) return;
            var firstDir = e.path.split('/')[0];
            if (!conceptDirs[firstDir]) return;
            var slug = e.path.replace(/\.md$/, '');
            if (seenOf[slug]) return;
            seenOf[slug] = 1;
            ofOptions.push({ slug: slug, title: e.title || '' });
          });
          var datalistHtml = '<datalist id="' + listId + '">' +
            ofOptions.map(function(o) {
              return '<option value="' + window.Lab.escHtml(o.slug) + '">' +
                window.Lab.escHtml(o.title) + '</option>';
            }).join('') + '</datalist>';
          input = '<input type="text" id="' + id + '" class="em-field-input" data-key="of"' +
            ' list="' + listId + '" value="' + ofVal + '"' +
            (field.placeholder ? ' placeholder="' + window.Lab.escHtml(field.placeholder) + '"' : '') +
            ' autocomplete="off">' + datalistHtml;
          if (row.length) { html += '<div class="form-row">' + row.join('') + '</div>'; row = []; }
          html += '<div class="form-group"><label>' + field.label + '</label>' + input + '</div>';
          return;
        }
        if (field.type === 'select') {
          input = '<select id="' + id + '" class="em-field-input" data-key="' + field.key + '">';
          (field.options || []).forEach(function(opt) {
            input += '<option value="' + opt + '"' + (String(val) === opt ? ' selected' : '') + '>' + opt + '</option>';
          });
          input += '</select>';
        } else if (field.type === 'checkbox') {
          input = '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0">' +
            '<input type="checkbox" id="' + id + '" class="em-field-input" data-key="' + field.key + '"' + (val ? ' checked' : '') + ' style="width:18px;height:18px;cursor:pointer">' +
            '<span style="font-size:14px;font-weight:500;color:var(--grey-700)">' + field.label + '</span></label>';
        } else if (field.type === 'number') {
          input = '<input type="number" id="' + id + '" class="em-field-input" data-key="' + field.key + '" value="' + val + '" step="any" min="0">';
        } else if (field.type === 'textarea') {
          // Multi-line values (labels, notes). Auto-growing height per value.
          var rows = Math.max(2, Math.min(6, String(val).split('\n').length + 1));
          input = '<textarea id="' + id + '" class="em-field-input" data-key="' + field.key + '" rows="' + rows + '"' +
            ' style="width:100%;font-family:inherit;font-size:14px;padding:6px 8px;border:1px solid var(--grey-300);border-radius:4px;resize:vertical">' +
            window.Lab.escHtml(String(val)) + '</textarea>';
        } else {
          input = '<input type="text" id="' + id + '" class="em-field-input" data-key="' + field.key + '" value="' + window.Lab.escHtml(String(val)) + '"' + (field.required ? ' required' : '') + '>';
        }
        if (field.type === 'checkbox') {
          if (row.length) { html += '<div class="form-row">' + row.join('') + '</div>'; row = []; }
          html += input;
          return;
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
        if (field.type === 'checkbox') {
          if (!val) return;
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px">' +
            '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:#c62828;background:#ffebee;">' + field.label + '</span>' +
            '</div>';
          return;
        }
        if (val === '' || val === undefined) return;

        // Parent field: render as a placeholder pill; async upgrade in openPopup
        // replaces it with a real object pill (with icon, title, and click handler).
        // If the parent slug can't be resolved later, the placeholder stays as raw text.
        if (field.key === 'parent') {
          var parentSlug = window.Lab.escHtml(String(val));
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:center;min-width:0">' +
            '<span style="color:var(--grey-500);min-width:80px;flex-shrink:0">' + field.label + '</span>' +
            '<span data-parent-pill="' + parentSlug + '" style="font-weight:500;min-width:0;flex:1 1 auto;overflow:hidden">' + parentSlug + '</span>' +
            '</div>';
          return;
        }

        // Of field: same treatment as parent — a slug that points at another
        // object (a concept, for instances like bottle/tube). Upgraded to a
        // clickable pill so the fields column can traverse instance → concept.
        if (field.key === 'of') {
          var ofSlug = window.Lab.escHtml(String(val));
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:center;min-width:0">' +
            '<span style="color:var(--grey-500);min-width:80px;flex-shrink:0">' + field.label + '</span>' +
            '<span data-of-pill="' + ofSlug + '" style="font-weight:500;min-width:0;flex:1 1 auto;overflow:hidden">' + ofSlug + '</span>' +
            '</div>';
          return;
        }

        // Member field (events): the value is a free-text string that may
        // contain one or more `[[wikilinks]]` to people. Render each wikilink
        // as a placeholder pill so upgradeParentField can swap it for a real
        // person pill. Plain text outside the wikilinks is preserved verbatim.
        if (field.key === 'member') {
          var raw = String(val);
          var pieces = [];
          var re = /\[\[([^\]]+)\]\]/g;
          var lastIdx = 0;
          var m;
          while ((m = re.exec(raw)) !== null) {
            if (m.index > lastIdx) pieces.push({ kind: 'text', text: raw.slice(lastIdx, m.index) });
            var slug = m[1].split('|')[0].trim();
            pieces.push({ kind: 'pill', slug: slug });
            lastIdx = m.index + m[0].length;
          }
          if (lastIdx < raw.length) pieces.push({ kind: 'text', text: raw.slice(lastIdx) });
          if (!pieces.length) pieces.push({ kind: 'text', text: raw });
          var inner = pieces.map(function(p) {
            if (p.kind === 'pill') {
              var s = window.Lab.escHtml(p.slug);
              return '<span data-member-pill="' + s + '" style="font-weight:500">' + s + '</span>';
            }
            return window.Lab.escHtml(p.text);
          }).join(' ');
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:center;min-width:0;flex-wrap:wrap">' +
            '<span style="color:var(--grey-500);min-width:80px;flex-shrink:0">' + field.label + '</span>' +
            '<span style="font-weight:500;min-width:0;flex:1 1 auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center">' + inner + '</span>' +
            '</div>';
          return;
        }

        // Textarea values (multi-line labels, notes): preserve line breaks
        // with pre-wrap instead of collapsing to a single line. label_1 / label_2
        // are deliberately multi-line for grid cell display.
        if (field.type === 'textarea') {
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:flex-start">' +
            '<span style="color:var(--grey-500);min-width:80px;padding-top:1px">' + field.label + '</span>' +
            '<span style="font-weight:500;white-space:pre-wrap;line-height:1.35">' + window.Lab.escHtml(String(val)) + '</span>' +
            '</div>';
          return;
        }

        // People (multi-person) field: split on `/` or `,` (preserving any
        // [[wikilinks]]) and render each as its own pill so the popup matches
        // the accessions tracker table cell. Plain names render as label-only
        // pills; wikilinks become clickable person-card links.
        if (field.key === 'people') {
          var raw = String(val);
          var parts = [];
          var buf = '';
          var depth = 0;
          for (var pi = 0; pi < raw.length; pi++) {
            var ch = raw[pi], nxt = raw[pi + 1];
            if (ch === '[' && nxt === '[') { depth++; buf += '[['; pi++; continue; }
            if (ch === ']' && nxt === ']') { depth = Math.max(0, depth - 1); buf += ']]'; pi++; continue; }
            if (depth === 0 && (ch === ',' || ch === '/')) { parts.push(buf); buf = ''; continue; }
            buf += ch;
          }
          if (buf) parts.push(buf);
          parts = parts.map(function(p) { return p.trim(); }).filter(Boolean);
          var pillsHtml = parts.map(function(p) {
            var m = p.match(/^\[\[(.+?)\]\]$/);
            if (m) {
              var slug = m[1];
              var lbl = slug.split('/').pop().replace(/-/g, ' ');
              return '<a href="wiki.html?doc=' + encodeURIComponent('people/' + slug.replace(/^people\//, '')) +
                '" style="display:inline-block;padding:2px 10px;border-radius:12px;background:var(--teal-light,#b2dfdb);color:var(--teal-dark,#00695c);font-size:12px;font-weight:500;text-decoration:none">' +
                escHtml(lbl) + '</a>';
            }
            return '<span style="display:inline-block;padding:2px 10px;border-radius:12px;background:var(--grey-100,#f3f4f6);color:var(--grey-700,#374151);font-size:12px;font-weight:500">' +
              escHtml(p) + '</span>';
          }).join(' ');
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:center;flex-wrap:wrap">' +
            '<span style="color:var(--grey-500);min-width:80px;flex-shrink:0">' + field.label + '</span>' +
            '<span style="display:flex;gap:4px;flex-wrap:wrap;flex:1 1 auto">' + pillsHtml + '</span>' +
            '</div>';
          return;
        }

        // Priority (accession 0-3 stars): render as ★ glyphs to match the
        // accessions tracker table (avoids "Priority (stars) 2" looking like a
        // raw number when the rest of the app shows ★★).
        if (field.key === 'priority') {
          var n = Math.max(0, Math.min(3, parseInt(val, 10) || 0));
          var starHtml = '<span style="color:#f59e0b;letter-spacing:1px">' +
            '★'.repeat(n) + '<span style="color:var(--grey-300,#d1d5db)">' + '★'.repeat(3 - n) + '</span></span>';
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:center">' +
            '<span style="color:var(--grey-500);min-width:80px">' + field.label + '</span>' +
            '<span style="font-weight:500;font-size:15px">' + starHtml + '</span>' +
            '</div>';
          return;
        }

        // Status field: render as a pill in view mode. Reagent statuses cycle
        // on click (in_stock → needs_more → out_of_stock); waste and other
        // statuses render as read-only pills. Unknown slugs get title-cased so
        // a raw 'in_accumulation' never appears in the popup.
        if (field.key === 'status' && field.options) {
          var statusColors = {
            in_stock: '#22c55e', needs_more: '#f59e0b', out_of_stock: '#ef4444', external: '#3b82f6',
            in_accumulation: '#f59e0b', ready_for_pickup: '#f9a825', picked_up: '#6b7280',
          };
          var statusLabels = {
            in_stock: 'In Stock', needs_more: 'Needs More', out_of_stock: 'Out of Stock', external: 'External',
            in_accumulation: 'In Accumulation', ready_for_pickup: 'Ready for Pickup', picked_up: 'Picked Up',
          };
          var isCycleable = ['in_stock','needs_more','out_of_stock','external'].indexOf(val) !== -1;
          var sColor = statusColors[val] || '#6b7280';
          var sLabel = statusLabels[val] || String(val).replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          var cls = isCycleable ? 'em-status-toggle' : 'em-status-pill';
          var cursor = isCycleable ? 'pointer' : 'default';
          var titleAttr = isCycleable ? ' title="Click to change status"' : '';
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px;align-items:center">' +
            '<span style="color:var(--grey-500);min-width:80px">' + field.label + '</span>' +
            '<span class="' + cls + '" data-status="' + escHtml(val) + '" style="display:inline-block;padding:3px 12px;border-radius:14px;font-size:12px;font-weight:600;background:' + sColor + '18;color:' + sColor + ';border:1.5px solid ' + sColor + '40;cursor:' + cursor + '"' + titleAttr + '>' + escHtml(sLabel) + '</span>' +
            '</div>';
          return;
        }

        html += '<div style="display:flex;gap:8px;margin-bottom:6px;font-size:14px">' +
          '<span style="color:var(--grey-500);min-width:80px">' + field.label + '</span>' +
          '<span style="font-weight:500">' + window.Lab.escHtml(String(val)) + '</span>' +
          '</div>';
      }
    });
    if (row.length) html += '<div class="form-row">' + row.join('') + '</div>';

    // Add custom field button (edit mode only)
    if (editable) {
      html += '<div id="em-custom-fields"></div>';
      html += '<button type="button" class="em-add-btn" id="em-add-field-btn" style="margin-top:8px">' +
        '<span class="material-icons-outlined" style="font-size:14px">add</span> Add field</button>';
    }

    fieldsEl.innerHTML = html;

    // Wire wikilink copy button
    fieldsEl.querySelectorAll('.em-copy-wikilink').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (!currentState || !currentState.path) return;
        var slug = currentState.path.replace(/^docs\//, '').replace(/\.md$/, '');
        var wl = '[[' + slug + ']]';
        navigator.clipboard.writeText(wl).then(function() {
          if (Lab.showToast) Lab.showToast('Copied: ' + wl, 'success');
        }).catch(function() {
          if (Lab.showToast) Lab.showToast('Copied: ' + wl, 'success');
        });
      });
    });

    // Wire "Add field" button (edit mode)
    if (editable) {
      var addFieldBtn = document.getElementById('em-add-field-btn');
      if (addFieldBtn) {
        addFieldBtn.addEventListener('click', async function() {
          var result = await Lab.modal.form({
            title: 'Add Custom Field',
            fields: [
              { key: 'fieldName', label: 'Field name', placeholder: 'e.g. volume, concentration, notes' },
              { key: 'fieldValue', label: 'Value', placeholder: 'e.g. 100 mL, 50 mg/mL' },
            ],
            submitText: 'Add',
          });
          if (!result || !result.fieldName || !result.fieldName.trim()) return;
          var key = result.fieldName.trim().toLowerCase().replace(/\s+/g, '_');
          var val = result.fieldValue || '';
          // Add to the custom fields area
          var container = document.getElementById('em-custom-fields');
          if (container) {
            var id = 'em-f-custom-' + key;
            container.insertAdjacentHTML('beforeend',
              '<div class="form-group"><label>' + escHtml(result.fieldName.trim()) + '</label>' +
              '<input type="text" id="' + id + '" class="em-field-input" data-key="' + escHtml(key) + '" value="' + escHtml(val) + '">' +
              '</div>');
          }
        });
      }
    }

    // Wire status toggle (view mode) — cycles through in_stock → needs_more → out_of_stock
    if (!editable) {
      var statusCycle = ['in_stock', 'needs_more', 'out_of_stock'];
      var statusColors = { in_stock: '#22c55e', needs_more: '#f59e0b', out_of_stock: '#ef4444' };
      var statusLabels = { in_stock: 'In Stock', needs_more: 'Needs More', out_of_stock: 'Out of Stock' };
      fieldsEl.querySelectorAll('.em-status-toggle').forEach(function(badge) {
        badge.addEventListener('click', async function() {
          if (!currentState || !currentState.path) return;
          var cur = badge.getAttribute('data-status');
          var idx = statusCycle.indexOf(cur);
          var next = statusCycle[(idx + 1) % statusCycle.length];
          try {
            var file = await Lab.gh.fetchFile(currentState.path);
            var parsed = Lab.parseFrontmatter(file.content);
            parsed.meta.status = next;
            delete parsed.meta.need_more;
            var content = Lab.buildFrontmatter(parsed.meta, parsed.body);
            await Lab.gh.saveFile(currentState.path, content, file.sha, 'Status: ' + next);
            Lab.gh.patchObjectIndex(currentState.path, parsed.meta);
            currentState.meta.status = next;
            // Update badge visually
            badge.setAttribute('data-status', next);
            badge.textContent = statusLabels[next] || next;
            var c = statusColors[next] || '#999';
            badge.style.background = c + '18';
            badge.style.color = c;
            badge.style.borderColor = c + '40';
            if (Lab.showToast) Lab.showToast((currentState.meta.title || '') + ': ' + (statusLabels[next] || next), 'success');
          } catch(e) {
            if (Lab.showToast) Lab.showToast('Failed: ' + e.message, 'error');
          }
        });
      });
    }

    // Wire type picker pill buttons (edit mode)
    if (editable) {
      // Apply a selected type: update the hidden input, refresh the summary
      // pill at the top of the form, and re-highlight the corresponding
      // option in the expanded picker. Shared by built-in pills and the
      // ad-hoc custom-type input below.
      function applyPickedType(t) {
        if (!t) return;
        var hidden = document.getElementById('em-f-type');
        if (hidden) hidden.value = t;
        // Update the summary pill
        var cur = document.getElementById('em-type-current');
        if (cur) {
          var tc = Lab.types.get(t);
          cur.style.cssText = Lab.types.pillStyle(t) + ';font-size:12px;padding:4px 10px;border-radius:12px;font-weight:500;display:inline-flex;align-items:center;gap:5px';
          cur.innerHTML = Lab.types.renderIcon(tc.icon) + ' ' + escHtml(tc.label || t);
        }
        // Refresh pill highlights
        fieldsEl.querySelectorAll('[data-type-pick]').forEach(function(b) {
          var isSel = b.getAttribute('data-type-pick') === t;
          var btc = Lab.types.get(b.getAttribute('data-type-pick'));
          b.style.borderColor = isSel ? (btc.color || '#333') : 'transparent';
          b.style.opacity = isSel ? '1' : '0.6';
        });
      }
      fieldsEl.querySelectorAll('[data-type-pick]').forEach(function(btn) {
        btn.addEventListener('click', function() { applyPickedType(btn.getAttribute('data-type-pick')); });
      });

      // #149 collapse/expand toggle for the full picker
      var typeToggle = document.getElementById('em-type-toggle');
      if (typeToggle) {
        typeToggle.addEventListener('click', function() {
          var panel = document.getElementById('em-type-picker-expand');
          var icon = document.getElementById('em-type-toggle-icon');
          if (!panel) return;
          var willOpen = panel.style.display === 'none';
          panel.style.display = willOpen ? 'block' : 'none';
          if (icon) icon.textContent = willOpen ? 'expand_less' : 'expand_more';
        });
      }

      // #149 ad-hoc custom type. Any non-empty string gets saved as the
      // object's type. Because `collectDiscoveredTypes` in this module
      // unions the registered TYPES with every type string observed in the
      // object index, saving a custom type here makes it show up in future
      // pickers/datalists — effectively creating a new type on the fly.
      var customInput = document.getElementById('em-type-custom');
      var customApply = document.getElementById('em-type-custom-apply');
      function commitCustomType() {
        var v = (customInput && customInput.value || '').trim();
        if (!v) return;
        // Normalize to lowercase_underscore so it plays nicely with the
        // rest of the type machinery (getType, isConceptType, etc).
        var norm = v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        if (!norm) return;
        applyPickedType(norm);
        if (Lab.showToast) Lab.showToast('Type set to "' + norm + '" — will be saved on next Save', 'success');
      }
      if (customApply) customApply.addEventListener('click', commitCustomType);
      if (customInput) customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); commitCustomType(); }
      });
    }

    // R6: Wire the parent location picker tree dropdown (edit mode only).
    // Replaces the old text-input + autocomplete + browse-modal pattern with
    // a single click-to-open tree dropdown anchored below the trigger field.
    if (editable) {
      var parentHidden = fieldsEl.querySelector('.em-field-input[data-key="parent"]');
      var trigger = document.getElementById('em-parent-picker-trigger');
      var dropdown = document.getElementById('em-parent-picker-dropdown');
      var label = document.getElementById('em-parent-picker-label');
      var clearBtn = document.getElementById('em-parent-picker-clear');
      var _parentTreeInstance = null;
      var _parentDropdownOpen = false;

      // Helper: update the trigger display after a selection or clear
      function updateParentDisplay(slug) {
        if (!label || !trigger) return;
        if (slug) {
          // Set a temporary slug-based name, then upgrade to real title via hierarchy
          var displayName = slug.split('/').pop().replace(/-/g, ' ');
          label.textContent = displayName;
          label.style.color = 'var(--grey-800,#1f2937)';
          label.style.fontWeight = '500';
          // Add clear button if missing
          if (!document.getElementById('em-parent-picker-clear')) {
            var cb = document.createElement('button');
            cb.type = 'button';
            cb.id = 'em-parent-picker-clear';
            cb.style.cssText = 'border:none;background:none;cursor:pointer;padding:2px;display:flex;align-items:center';
            cb.innerHTML = '<span class="material-icons-outlined" style="font-size:16px;color:var(--grey-400)">close</span>';
            cb.addEventListener('click', function(ev) {
              ev.stopPropagation();
              parentHidden.value = '';
              parentHidden.dispatchEvent(new Event('input', { bubbles: true }));
              updateParentDisplay('');
            });
            // Insert before the expand_more icon
            var chevron = trigger.querySelector('[style*="expand_more"]') || trigger.lastElementChild;
            trigger.insertBefore(cb, chevron);
            clearBtn = cb;
          }
          // Build breadcrumb asynchronously — always show proper title(s)
          if (window.Lab && Lab.hierarchy) {
            Lab.hierarchy.parentChain(slug).then(function(chain) {
              if (!chain || !chain.length) return;
              Lab.hierarchy.build().then(function(g) {
                var parts = chain.map(function(s) {
                  var e = g[s];
                  return (e && e.title) || s.split('/').pop().replace(/-/g, ' ');
                });
                label.textContent = parts.join(' > ');
              });
            });
          }
        } else {
          label.textContent = 'Click to select location…';
          label.style.color = 'var(--grey-400,#9ca3af)';
          label.style.fontWeight = '400';
          if (clearBtn) { clearBtn.remove(); clearBtn = null; }
        }
      }

      function closeParentDropdown() {
        if (dropdown) dropdown.style.display = 'none';
        _parentDropdownOpen = false;
        if (_parentTreeInstance) {
          _parentTreeInstance.destroy();
          _parentTreeInstance = null;
        }
      }

      function openParentDropdown() {
        if (!dropdown || !trigger) return;
        // #150: big popover. Fixed at 620px wide (or 92vw if narrower
        // viewport), ~70vh tall, always shown as a flex-column so the tree
        // body scrolls independently of the toolbar/search input. Anchors
        // below-left of the trigger when it fits, flips to above or shifts
        // right to stay in the viewport otherwise.
        var rect = trigger.getBoundingClientRect();
        var dropWidth = Math.min(620, Math.floor(window.innerWidth * 0.92));
        var dropHeight = Math.min(Math.floor(window.innerHeight * 0.7), 640);

        var left = rect.left;
        if (left + dropWidth > window.innerWidth - 16) {
          left = Math.max(8, window.innerWidth - dropWidth - 16);
        }
        var top = rect.bottom + 6;
        var spaceBelow = window.innerHeight - rect.bottom - 12;
        var spaceAbove = rect.top - 12;
        // If not enough below AND more above, flip it.
        if (spaceBelow < 280 && spaceAbove > spaceBelow) {
          top = Math.max(8, rect.top - dropHeight - 6);
        } else if (spaceBelow < dropHeight) {
          dropHeight = Math.max(300, spaceBelow);
        }

        dropdown.style.display = 'flex';
        dropdown.style.flexDirection = 'column';
        dropdown.style.top = top + 'px';
        dropdown.style.left = left + 'px';
        dropdown.style.width = dropWidth + 'px';
        dropdown.style.height = dropHeight + 'px';
        dropdown.style.maxHeight = dropHeight + 'px';
        dropdown.innerHTML = '';
        _parentDropdownOpen = true;

        var styleTag = document.createElement('style');
        styleTag.textContent =
          '#em-parent-picker-dropdown .lt-node { user-select:none; }' +
          '#em-parent-picker-dropdown .lt-row { display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;cursor:pointer;transition:background .1s; }' +
          '#em-parent-picker-dropdown .lt-row:hover { background:var(--grey-50,#f9fafb); }' +
          '#em-parent-picker-dropdown .lt-row.is-hit { background:var(--teal-light,#e0f2f1); }' +
          '#em-parent-picker-dropdown .lt-toggle { width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;color:var(--grey-700,#424242);background:var(--grey-100,#f5f5f5);border:1px solid var(--grey-300,#cfd8dc);border-radius:4px;cursor:pointer;font-size:16px;flex-shrink:0;transition:background .12s; }' +
          '#em-parent-picker-dropdown .lt-toggle:hover { background:var(--teal,#009688);color:#fff;border-color:var(--teal,#009688); }' +
          '#em-parent-picker-dropdown .lt-node.is-expanded > .lt-row .lt-toggle { transform:rotate(90deg); }' +
          '#em-parent-picker-dropdown .lt-icon { font-size:17px;flex-shrink:0; }' +
          '#em-parent-picker-dropdown .lt-title { font-size:14px;font-weight:500;color:var(--grey-800,#1f2937);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }' +
          '#em-parent-picker-dropdown .lt-count { font-size:11px;color:var(--grey-500,#6b7280);flex-shrink:0; }' +
          '#em-parent-picker-dropdown .lt-pos { font-size:11px;color:var(--grey-600);padding:1px 7px;background:var(--grey-100,#f3f4f6);border-radius:10px;flex-shrink:0; }' +
          '#em-parent-picker-dropdown .lt-children { padding-left:26px; }' +
          '#em-parent-picker-dropdown .lt-node:not(.is-expanded) > .lt-children { display:none; }' +
          '#em-parent-picker-dropdown .lt-node.is-expanded > .lt-children { display:block; }' +
          '#em-parent-picker-dropdown .lt-toolbar { padding:10px 14px;border-bottom:1px solid var(--grey-200,#e5e7eb);background:var(--grey-50,#f9fafb);display:flex;gap:8px;align-items:center;flex-shrink:0; }' +
          '#em-parent-picker-dropdown .lt-toolbar input { flex:1;padding:8px 12px;border:1px solid var(--grey-300,#d1d5db);border-radius:6px;font-size:13px;font-family:inherit;outline:none; }' +
          '#em-parent-picker-dropdown .lt-toolbar input:focus { border-color:var(--teal,#009688); }' +
          '#em-parent-picker-dropdown .lt-toolbar button { padding:6px 10px;font-size:12px;border:1px solid var(--grey-300,#d1d5db);background:#fff;border-radius:6px;cursor:pointer;font-family:inherit;color:var(--grey-700,#374151); }' +
          '#em-parent-picker-dropdown .lt-toolbar button:hover { background:var(--grey-100,#f3f4f6); }' +
          '#em-parent-picker-dropdown .lt-tree { flex:1;overflow-y:auto;padding:6px 10px 10px; }';
        dropdown.appendChild(styleTag);

        var treeWrap = document.createElement('div');
        treeWrap.style.cssText = 'flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden';
        dropdown.appendChild(treeWrap);

        _parentTreeInstance = Lab.locationTree.attach(treeWrap, {
          mode: 'picker',
          showSearch: true,
          showActions: false,
          draggable: false,
          locationsOnly: true,
          // #158: start fully collapsed so the user sees top-level rooms
          // without any children pre-expanded. They can drill down or use
          // filter/expand-all to get further.
          initialDepth: 0,
          onPick: function(slug) {
            parentHidden.value = slug;
            parentHidden.dispatchEvent(new Event('input', { bubbles: true }));
            updateParentDisplay(slug);
            closeParentDropdown();
            if (Lab.showToast) Lab.showToast('Location: ' + slug.split('/').pop().replace(/-/g, ' '), 'success');
          },
        });
      }

      if (trigger) {
        trigger.addEventListener('click', function(ev) {
          // Don't toggle if clicking clear button
          if (ev.target.closest('#em-parent-picker-clear')) return;
          if (_parentDropdownOpen) closeParentDropdown();
          else openParentDropdown();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          parentHidden.value = '';
          parentHidden.dispatchEvent(new Event('input', { bubbles: true }));
          updateParentDisplay('');
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', function _parentOutsideClick(ev) {
        if (!_parentDropdownOpen) return;
        if (trigger && trigger.contains(ev.target)) return;
        if (dropdown && dropdown.contains(ev.target)) return;
        closeParentDropdown();
      });

      // Close dropdown when the fields column scrolls (position:fixed won't follow)
      var fieldsCol = trigger ? trigger.closest('.em-col') : null;
      if (fieldsCol) {
        fieldsCol.addEventListener('scroll', function() {
          if (_parentDropdownOpen) closeParentDropdown();
        });
      }

      // Update display with breadcrumb for the initial value
      if (parentHidden && parentHidden.value) {
        updateParentDisplay(parentHidden.value);
      }
    }
  }

  // ── Contents column (R3) ──
  //
  // Renders col 3 for the current object based on what it "contains":
  //   1. A `grid` field → rows×cols cell grid with position badges + label_2.
  //   2. A location-type object without a grid → clickable list of children.
  //   3. A container_list schema field → the repeating-rows UI (resources, stocks).
  //   4. Anything else → "No contents" placeholder.
  //
  // Every contents pane that can hold children has an "+ Add" button at the
  // bottom which spawns the create-in-edit-mode flow (openNew below) with the
  // parent slug pre-filled.
  async function renderContents(state, editable) {
    var mount = document.getElementById('em-contents');
    if (!mount) return;
    var meta = state.meta || {};
    var type = meta.type || '';
    var schema = getSchema(type);

    // Container list (resources/stocks) — existing repeating-rows UI
    var containerListField = schema.find ? schema.find(function(f) { return f.type === 'container_list'; }) : null;
    if (containerListField) {
      mount.innerHTML = renderContainerListPane(containerListField, meta, editable);
      return;
    }

    // Grid or children list for location-type objects (and anything else that
    // declares a grid or has children in the hierarchy).
    var slug = state.path ? state.path.replace(/^docs\//, '').replace(/\.md$/, '') : null;
    var hasGrid = !!meta.grid;
    var children = [];
    if (slug && window.Lab.hierarchy) {
      try {
        children = await Lab.hierarchy.childrenOf(slug);
      } catch(e) { children = []; }
    }

    if (hasGrid) {
      mount.innerHTML = renderGridPane(meta, children, slug);
      bindGridHandlers(slug, meta);
      return;
    }

    var isLocationType = Lab.types.get(type).group === 'locations';
    if (isLocationType || children.length) {
      mount.innerHTML = renderChildrenListPane(children, slug, type);
      bindChildrenListHandlers(slug, type);
      return;
    }

    // R4 Phase 7: backlinks pane for non-location, non-container types.
    // Shows everything that wikilinks to this object (from link-index.json).
    // Covers the "Ethanol is referenced from many protocols" case.
    var backlinks = await fetchBacklinksFor(slug);
    if (backlinks.length) {
      mount.innerHTML = renderBacklinksPane(backlinks);
      bindBacklinksHandlers();
      return;
    }

    mount.innerHTML = '<div class="em-col-empty">No references to this object yet.</div>';
  }

  // ── Backlinks (R4 Phase 7) ──
  //
  // Filter the cached link-index for edges targeting this slug. Each returned
  // row carries the source entry's title + type for rich rendering.
  async function fetchBacklinksFor(slug) {
    if (!slug || !window.Lab.gh || !window.Lab.gh.fetchLinkIndex) return [];
    try {
      var edges = await Lab.gh.fetchLinkIndex();
      var idx = Lab.gh._getCachedIndex() || (await Lab.gh.fetchObjectIndex());
      var byPath = {};
      idx.forEach(function(e) { byPath[e.path.replace(/\.md$/, '')] = e; });
      var results = [];
      // 1. R5: frontmatter `of:` pointers FIRST — these carry rich instance
      //    data (quantity, unit, parent) that body-wikilink edges lack.
      //    Processing them first ensures they win deduplication.
      for (var j = 0; j < idx.length; j++) {
        var entry = idx[j];
        if (!entry.of) continue;
        var ofRaw = String(entry.of).trim();
        ofRaw = ofRaw.replace(/^\[\[/, '').replace(/\]\]$/, '');
        ofRaw = ofRaw.replace(/^\.\//, '').replace(/\.md$/, '');
        if (ofRaw !== slug) continue;
        var entrySlug = entry.path.replace(/\.md$/, '');
        var parentSlug = entry.parent || entry.location;
        var parentEntry = parentSlug ? byPath[String(parentSlug).replace(/\.md$/, '')] : null;
        results.push({
          slug: entrySlug,
          title: entry.title || entrySlug.split('/').pop(),
          type: entry.type || 'bottle',
          isInstance: true,
          quantity: entry.quantity,
          unit: entry.unit,
          parent: parentSlug,
          parentTitle: parentEntry && parentEntry.title ? parentEntry.title : null,
          lot: entry.lot,
          expiration: entry.expiration,
        });
      }
      // 2. Body wikilinks pointing at this slug.
      for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        if (edge.target !== slug) continue;
        var source = byPath[edge.source];
        results.push({
          slug: edge.source,
          title: (source && source.title) || edge.source.split('/').pop(),
          type: (source && source.type) || 'container',
        });
      }
      // Dedupe by slug + sort by title
      var seen = {};
      results = results.filter(function(r) {
        if (seen[r.slug]) return false;
        seen[r.slug] = true;
        return true;
      });
      results.sort(function(a, b) {
        return (a.title || '').toLowerCase() < (b.title || '').toLowerCase() ? -1 : 1;
      });
      return results;
    } catch(e) {
      return [];
    }
  }

  function renderBacklinksPane(backlinks) {
    // Split instances from other references. An entry is an "instance":
    //   • bottle (R5 reagent/stock physical record), OR
    //   • carried `of:` pointing at this concept (isInstance flag), OR
    //   • R19: sample / extraction / library / pool / tube (physical records
    //     under an accession — these often link via body wikilinks rather
    //     than `of:`, especially the legacy tubes that predate the `of:`
    //     convention, so we classify them by type too).
    var INSTANCE_TYPES = { bottle: 1, sample: 1, extraction: 1, library: 1, pool: 1, tube: 1 };
    var instances = backlinks.filter(function(b) { return INSTANCE_TYPES[b.type] || b.isInstance; });
    var others    = backlinks.filter(function(b) { return !INSTANCE_TYPES[b.type] && !b.isInstance; });

    var html = '';

    // Instances section (show first — "where is this?")
    if (instances.length) {
      html += '<div style="font-size:11px;color:var(--grey-500);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px">' +
        instances.length + ' instance' + (instances.length === 1 ? '' : 's') + ' in lab</div>';
      // Detect title+parent collisions so siblings on the same shelf with
      // identical titles (e.g. two Ethanol 70% bottles both on `bench`) get
      // a disambiguator instead of looking like duplicate rows.
      var instanceCollisionCounts = {};
      instances.forEach(function(b) {
        var key = (b.title || '') + '|' + (b.parent || '');
        instanceCollisionCounts[key] = (instanceCollisionCounts[key] || 0) + 1;
      });

      instances.forEach(function(b) {
        var tc = Lab.types.get(b.type || 'bottle');
        var meta = [];
        if (b.quantity && b.unit) meta.push(b.quantity + ' ' + b.unit);
        if (b.parent) {
          var parentLabel = b.parentTitle || b.parent.split('/').pop().replace(/-/g, ' ');
          meta.push(parentLabel);
        }
        var collisionKey = (b.title || '') + '|' + (b.parent || '');
        if (instanceCollisionCounts[collisionKey] > 1) {
          var disamb = b.lot ? ('lot ' + b.lot) :
            b.expiration ? ('exp ' + b.expiration) :
            b.slug ? ('#' + b.slug.split('/').pop().split('-').pop()) : '';
          if (disamb) meta.push(disamb);
        }
        html += '<div class="em-backlink-row" data-slug="' + escHtml(b.slug) + '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:5px;cursor:pointer;transition:background .08s">' +
          '<span style="font-size:14px;flex-shrink:0">' + Lab.types.renderIcon(tc.icon) + '</span>' +
          '<span style="flex:1;min-width:0;overflow:hidden">' +
            '<div style="font-size:13px;font-weight:500;color:var(--grey-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(b.title) + '</div>' +
            (meta.length ? '<div style="font-size:11px;color:var(--grey-500)">' + escHtml(meta.join(' \u00B7 ')) + '</div>' : '') +
          '</span></div>';
      });
    }

    // Add Instance button for concept items
    if (currentState && currentState.meta) {
      var curType = currentState.meta.type || '';
      if (Lab.types.isConceptType && Lab.types.isConceptType(curType) && curType !== 'protocol' && curType !== 'project' && curType !== 'person') {
        var conceptSlug = (currentState.path || '').replace(/^docs\//, '').replace(/\.md$/, '');
        html += '<button type="button" class="em-add-btn" onclick="Lab.editorModal._addInstance(\'' + escHtml(conceptSlug) + '\')" style="margin:6px 0">' +
          '<span class="material-icons-outlined" style="font-size:14px">add</span> Add instance</button>';
      }
    }

    // Other references
    if (others.length) {
      html += '<div style="font-size:11px;color:var(--grey-500);margin:' + (instances.length ? '12px' : '0') + ' 0 4px;text-transform:uppercase;letter-spacing:0.4px">' +
        others.length + ' reference' + (others.length === 1 ? '' : 's') + '</div>';
      others.forEach(function(b) {
        var tc = Lab.types.get(b.type || 'container');
        html += '<div class="em-backlink-row" data-slug="' + escHtml(b.slug) + '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:5px;cursor:pointer;transition:background .08s">' +
          '<span style="font-size:14px;flex-shrink:0">' + Lab.types.renderIcon(tc.icon) + '</span>' +
          '<span style="flex:1;min-width:0;overflow:hidden">' +
            '<div style="font-size:13px;font-weight:500;color:var(--grey-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(b.title) + '</div>' +
            '<div style="font-size:11px;color:var(--grey-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              '<span style="color:' + tc.color + '">' + escHtml(tc.label || b.type) + '</span>' +
            '</div>' +
          '</span></div>';
      });
    }

    if (!instances.length && !others.length) {
      html += '<div style="color:var(--grey-500);padding:8px;font-size:13px">No references yet</div>';
    }

    return html;
  }

  function bindBacklinksHandlers() {
    var mount = document.getElementById('em-contents');
    if (!mount) return;
    mount.querySelectorAll('.em-backlink-row[data-slug]').forEach(function(row) {
      row.addEventListener('click', function() {
        var slug = row.dataset.slug;
        if (slug) openPopup('docs/' + slug + '.md');
      });
      row.addEventListener('mouseenter', function() { row.style.background = 'var(--grey-100)'; });
      row.addEventListener('mouseleave', function() { row.style.background = ''; });
    });
  }

  // Container list section for the Contents column. Re-uses the existing
  // renderContainerHeader / renderContainerRow helpers so the format is
  // identical to before — it's just living in col 3 instead of col 1.
  function renderContainerListPane(field, meta, editable) {
    var containers = Array.isArray(meta[field.key]) ? meta[field.key] : [];
    if (editable) {
      return '<div data-container-list="' + field.key + '">' +
        '<div style="font-size:12px;color:var(--grey-500);margin-bottom:6px">Individual bottles, boxes, or kits</div>' +
        (containers.length ? renderContainerHeader() : '') +
        '<div class="em-containers" id="em-containers-' + field.key + '">' +
          containers.map(function(c, idx) { return renderContainerRow(field.key, c, idx); }).join('') +
        '</div>' +
        '<button type="button" class="em-add-btn" onclick="Lab.editorModal._addContainer(\'' + field.key + '\')">' +
          '<span class="material-icons-outlined" style="font-size:14px">add</span> Add container</button>' +
        '</div>';
    }
    if (!containers.length) {
      return '<div class="em-col-empty">No individual containers logged.</div>';
    }
    return '<table style="width:100%;font-size:12px;border-collapse:collapse">' +
      '<thead><tr style="color:var(--grey-500);text-align:left"><th style="padding:4px 4px">Location</th><th style="padding:4px 4px">Qty</th><th style="padding:4px 4px">Lot</th><th style="padding:4px 4px">Expires</th></tr></thead>' +
      '<tbody>' +
      containers.map(function(c) {
        return '<tr><td style="padding:4px 4px">' + escHtml(c.location || '') + '</td>' +
          '<td style="padding:4px 4px">' + escHtml(String(c.quantity == null ? '' : c.quantity)) + (c.unit ? ' ' + escHtml(c.unit) : '') + '</td>' +
          '<td style="padding:4px 4px">' + escHtml(c.lot || '') + '</td>' +
          '<td style="padding:4px 4px">' + escHtml(c.expiration || '') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  // Grid renderer. rows × cols of square cells. Cells with a matching child
  // position show label_2 (fallback title) on the type color. Collisions get
  // a badge with a click-popover. Empty cells are clickable to open create-new
  // at that position. Items outside the grid or without a position list below.
  function renderGridPane(meta, children, parentSlug) {
    var parsed = Lab.hierarchy.parseGrid(meta.grid);
    if (!parsed) {
      return '<div class="em-col-empty">Grid value "' + escHtml(meta.grid) + '" is not valid. Use formats like "10x10" or "8x12".</div>';
    }
    var rows = parsed.rows, cols = parsed.cols;

    // Bucket children by position string
    var buckets = {}; // "A1" -> [entry, entry]
    var unplaced = [];
    children.forEach(function(c) {
      var p = Lab.hierarchy.parsePosition(c.position);
      if (!p || p.row < 0 || p.row >= rows || p.col < 0 || p.col >= cols) {
        unplaced.push(c);
        return;
      }
      var key = String.fromCharCode(65 + p.row) + String(p.col + 1);
      (buckets[key] = buckets[key] || []).push(c);
    });

    var html = '<div class="em-grid-view">';
    html += '<div class="em-grid-meta">' + rows + ' × ' + cols + ' · ' + children.length + ' item' + (children.length === 1 ? '' : 's') + '</div>';

    // Column labels (numbers across top). Grid template: empty cell at col 0
    // for the row label, then cols columns of equal width.
    var colTemplate = '22px repeat(' + cols + ', minmax(0, 1fr))';
    html += '<div class="em-grid-labels-row" style="grid-template-columns:' + colTemplate + '">';
    html += '<div></div>'; // corner
    for (var c = 0; c < cols; c++) {
      html += '<div class="em-grid-label-col">' + (c + 1) + '</div>';
    }
    html += '</div>';

    for (var r = 0; r < rows; r++) {
      var rowLabel = String.fromCharCode(65 + r);
      html += '<div class="em-grid-row" style="grid-template-columns:' + colTemplate + ';margin-bottom:3px">';
      html += '<div class="em-grid-label-row">' + rowLabel + '</div>';
      for (var c2 = 0; c2 < cols; c2++) {
        var key = rowLabel + (c2 + 1);
        var bucket = buckets[key];
        if (bucket && bucket.length) {
          var first = bucket[0];
          var tc = Lab.types.get(first.type || 'container');
          var bg = tc.color + '30';
          var border = tc.color + '80';
          var label2 = (first.label_2 && String(first.label_2).trim()) || first.title || '';
          var collideBadge = bucket.length > 1 ? '<span class="gc-collide" data-collide-key="' + key + '">' + bucket.length + '</span>' : '';
          var collClass = bucket.length > 1 ? ' collision' : '';
          // R6: occupied cells are draggable so users can move items between
          // grid cells in the same box. Drop is handled in bindGridHandlers.
          html += '<div class="em-grid-cell occupied' + collClass + '" data-cell="' + key + '" data-slug="' + escHtml(first.slug) + '" draggable="true" title="' + escHtml(first.title || '') + '" style="background:' + bg + ';border:1px solid ' + border + ';color:' + tc.color + '">' +
            collideBadge +
            '<span class="gc-icon">' + Lab.types.renderIcon(tc.icon) + '</span>' +
            '<span class="gc-label">' + escHtml(String(label2).substring(0, 24)) + '</span>' +
          '</div>';
        } else {
          html += '<div class="em-grid-cell empty" data-cell="' + key + '" data-empty="1" title="Empty cell ' + key + ' (click to add)">' +
            '<span style="font-size:9px">' + key + '</span>' +
          '</div>';
        }
      }
      html += '</div>';
    }

    // Unplaced list
    if (unplaced.length) {
      html += '<div class="em-unplaced">';
      html += '<h4>Unplaced (' + unplaced.length + ')</h4>';
      unplaced.forEach(function(c) { html += renderChildRow(c); });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function bindGridHandlers(parentSlug, meta) {
    var mount = document.getElementById('em-contents');
    if (!mount) return;
    mount.querySelectorAll('.em-grid-cell').forEach(function(cell) {
      cell.addEventListener('click', function(e) {
        // Collision badge — show a popover listing every item at this cell
        if (e.target.classList && e.target.classList.contains('gc-collide')) {
          e.stopPropagation();
          showCollidePopover(cell, parentSlug, meta);
          return;
        }
        if (cell.dataset.empty) {
          // Empty cell → "place at this cell" popover with pick-existing
          // (autocomplete) and create-new options. R4 Phase 4.
          var cellKey = cell.dataset.cell;
          showPlaceHerePopover(cell, parentSlug, cellKey, meta);
          return;
        }
        // Occupied → open the child's popup
        var slug = cell.dataset.slug;
        if (slug) openPopup('docs/' + slug + '.md');
      });
    });

    // R6: drag-and-drop within a single grid. Drop on an empty cell moves
    // the dragged child via moveObjectHere() (same parent, new cell). Drop
    // on an occupied cell is rejected — user must clear the target first.
    // Cross-grid drag is out of scope for R6.
    var dragSlug = null;
    mount.querySelectorAll('.em-grid-cell.occupied[draggable="true"]').forEach(function(cell) {
      cell.addEventListener('dragstart', function(e) {
        dragSlug = cell.dataset.slug;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragSlug);
        cell.classList.add('em-grid-dragging');
      });
      cell.addEventListener('dragend', function() {
        cell.classList.remove('em-grid-dragging');
        mount.querySelectorAll('.em-grid-drop').forEach(function(el) {
          el.classList.remove('em-grid-drop');
        });
        dragSlug = null;
      });
    });
    mount.querySelectorAll('.em-grid-cell.empty').forEach(function(cell) {
      cell.addEventListener('dragover', function(e) {
        if (!dragSlug) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('em-grid-drop');
      });
      cell.addEventListener('dragleave', function() {
        cell.classList.remove('em-grid-drop');
      });
      cell.addEventListener('drop', function(e) {
        if (!dragSlug) return;
        e.preventDefault();
        e.stopPropagation();
        var srcSlug = dragSlug;
        var newCell = cell.dataset.cell;
        dragSlug = null;
        cell.classList.remove('em-grid-drop');
        // Same parent, new cell. moveObjectHere() handles the save +
        // index patch + grid re-render.
        moveObjectHere(srcSlug, parentSlug, newCell);
      });
    });

    // Unplaced children rows
    mount.querySelectorAll('.em-unplaced .em-child-row[data-slug]').forEach(function(row) {
      row.addEventListener('click', function() {
        openPopup('docs/' + row.dataset.slug + '.md');
      });
    });
  }

  // ── Place-here popover (R4 Phase 4) ──
  //
  // Opens at an empty grid cell. The user can either:
  //   (a) Search for an existing object and pick it → move it here (update
  //       its parent + position, save to GitHub).
  //   (b) Click "Create new here" → openNew() with parent + position pre-filled.
  //
  // The pick path avoids duplicating objects when a student just wants to
  // relocate something — the slug is preserved, so every existing wikilink
  // keeps pointing at the same file.
  var _placeHerePop = null;
  function dismissPlaceHerePopover() {
    if (_placeHerePop) {
      _placeHerePop.remove();
      _placeHerePop = null;
      document.removeEventListener('click', _placeHereOutside);
    }
  }
  function _placeHereOutside(e) {
    if (_placeHerePop && !_placeHerePop.contains(e.target)) {
      dismissPlaceHerePopover();
    }
  }

  function showPlaceHerePopover(cellEl, parentSlug, cellKey, parentMeta) {
    dismissPlaceHerePopover();
    var pop = document.createElement('div');
    pop.className = 'em-place-here-pop';
    pop.style.cssText = [
      'position:fixed',
      'z-index:10050',
      'background:#fff',
      'border:1px solid var(--grey-300)',
      'border-radius:8px',
      'box-shadow:0 6px 20px rgba(0,0,0,.18)',
      'width:340px',
      'padding:12px',
    ].join(';');
    pop.innerHTML =
      '<div style="font-size:11px;color:var(--grey-500);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px">Place at ' + escHtml(cellKey) + '</div>' +
      '<input type="text" class="em-place-search" placeholder="Search existing objects…" style="width:100%;padding:6px 10px;font-size:13px;border:1px solid var(--grey-300);border-radius:4px;font-family:inherit;margin-bottom:8px">' +
      '<div class="em-place-results" style="max-height:220px;overflow-y:auto;margin-bottom:8px;font-size:12px"></div>' +
      '<button type="button" class="em-place-create" style="width:100%;padding:8px 12px;font-size:12px;background:var(--teal-light);color:var(--teal-dark);border:1px dashed var(--teal);border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600">' +
        '<span class="material-icons-outlined" style="font-size:14px;vertical-align:middle">add</span> Create new here' +
      '</button>';

    document.body.appendChild(pop);
    var rect = cellEl.getBoundingClientRect();
    var left = Math.min(rect.right + 8, window.innerWidth - 350);
    var top = Math.min(rect.top, window.innerHeight - 340);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    _placeHerePop = pop;

    var searchEl = pop.querySelector('.em-place-search');
    var resultsEl = pop.querySelector('.em-place-results');
    var createEl = pop.querySelector('.em-place-create');

    async function refreshResults() {
      var q = (searchEl.value || '').toLowerCase().trim();
      var idx = Lab.gh._getCachedIndex() || (await Lab.gh.fetchObjectIndex());
      var scored = [];
      idx.forEach(function(entry) {
        var slug = entry.path.replace(/\.md$/, '');
        if (slug === parentSlug) return; // can't move a thing into itself
        var title = (entry.title || '').toLowerCase();
        var sl = slug.toLowerCase();
        var type = (entry.type || '').toLowerCase();
        if (!q) {
          scored.push({ entry: entry, slug: slug, score: 50 });
          return;
        }
        if (title === q || sl === q) { scored.push({ entry: entry, slug: slug, score: 0 }); return; }
        if (title.startsWith(q)) { scored.push({ entry: entry, slug: slug, score: 10 }); return; }
        if (sl.startsWith(q))    { scored.push({ entry: entry, slug: slug, score: 15 }); return; }
        if (title.indexOf(q) >= 0) { scored.push({ entry: entry, slug: slug, score: 25 }); return; }
        if (sl.indexOf(q) >= 0)    { scored.push({ entry: entry, slug: slug, score: 30 }); return; }
        if (type.indexOf(q) >= 0)  { scored.push({ entry: entry, slug: slug, score: 50 }); return; }
      });
      scored.sort(function(a, b) { return a.score - b.score; });
      scored = scored.slice(0, 12);
      var html = '';
      for (var i = 0; i < scored.length; i++) {
        var s = scored[i];
        var tc = Lab.types.get(s.entry.type || 'container');
        html += '<div class="em-place-result" data-slug="' + escHtml(s.slug) + '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer">' +
          '<span style="font-size:14px">' + Lab.types.renderIcon(tc.icon) + '</span>' +
          '<span style="flex:1;min-width:0;overflow:hidden">' +
            '<div style="font-weight:600;color:var(--grey-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(s.entry.title || s.slug) + '</div>' +
            '<div style="font-size:11px;color:var(--grey-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              '<span style="color:' + tc.color + '">' + escHtml(tc.label || s.entry.type) + '</span>' +
              (s.entry.parent ? ' · in ' + escHtml(s.entry.parent) : '') +
            '</div>' +
          '</span>' +
        '</div>';
      }
      resultsEl.innerHTML = html || '<div style="color:var(--grey-500);padding:10px;text-align:center;font-style:italic">No matches</div>';
      resultsEl.querySelectorAll('.em-place-result').forEach(function(el) {
        el.addEventListener('mouseenter', function() { el.style.background = 'var(--grey-100)'; });
        el.addEventListener('mouseleave', function() { el.style.background = ''; });
        el.addEventListener('click', async function() {
          var targetSlug = el.getAttribute('data-slug');
          await moveObjectHere(targetSlug, parentSlug, cellKey);
          dismissPlaceHerePopover();
        });
      });
    }

    refreshResults();
    searchEl.addEventListener('input', refreshResults);
    searchEl.focus();

    createEl.addEventListener('click', function() {
      dismissPlaceHerePopover();
      openNew({
        parent: parentSlug,
        position: cellKey,
        defaultType: autoChildType(parentMeta.type),
      });
    });

    // Outside click dismisses — defer the listener so this click doesn't trip it.
    setTimeout(function() { document.addEventListener('click', _placeHereOutside); }, 0);
  }

  // Move an existing object into the current parent + cell. Updates the
  // target file's frontmatter, saves it, patches the index, and re-renders
  // the current popup's contents pane.
  async function moveObjectHere(targetSlug, newParentSlug, newCellKey) {
    if (!targetSlug || !newParentSlug) return;
    var targetPath = 'docs/' + targetSlug + '.md';
    try {
      var file = await Lab.gh.fetchFile(targetPath);
      var parsed = window.Lab.parseFrontmatter(file.content);
      parsed.meta.parent = newParentSlug;
      parsed.meta.position = newCellKey;
      var newContent = window.Lab.buildFrontmatter(parsed.meta, parsed.body);
      var msg = 'Move ' + targetSlug + ' to ' + newParentSlug + '/' + newCellKey;
      var result = await Lab.gh.saveFile(targetPath, newContent, file.sha, msg);
      Lab.gh.patchObjectIndex(targetPath, parsed.meta);
      if (window.Lab.hierarchy) Lab.hierarchy.invalidate();
      if (window.Lab.showToast) Lab.showToast('Moved to ' + newCellKey, 'success');
      // Refresh the current popup's contents pane so the grid shows the new occupant.
      if (currentState) await renderContents(currentState, false);
    } catch(e) {
      if (window.Lab.showToast) Lab.showToast('Move failed: ' + e.message, 'error');
      console.error(e);
    }
  }

  // Popover listing every child at a collision cell (bucket.length > 1).
  // Rendered as a floating element next to the cell; dismissed on outside click.
  var _activeCollidePop = null;
  function showCollidePopover(cellEl, parentSlug, meta) {
    dismissCollidePopover();
    var cellKey = cellEl.dataset.cell;
    // Re-fetch the bucket so we don't rely on a stale closure.
    Lab.hierarchy.childrenOf(parentSlug).then(function(children) {
      var bucket = children.filter(function(c) {
        var p = Lab.hierarchy.parsePosition(c.position);
        if (!p) return false;
        var k = String.fromCharCode(65 + p.row) + String(p.col + 1);
        return k === cellKey;
      });
      if (!bucket.length) return;
      var pop = document.createElement('div');
      pop.className = 'em-collide-pop';
      var html = '<h5>' + bucket.length + ' items at cell ' + cellKey + '</h5>';
      bucket.forEach(function(c) { html += renderChildRow(c); });
      pop.innerHTML = html;
      document.body.appendChild(pop);
      var rect = cellEl.getBoundingClientRect();
      var popW = 260;
      var left = Math.min(rect.right + 6, window.innerWidth - popW - 10);
      var top = Math.min(rect.top, window.innerHeight - 200);
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
      pop.querySelectorAll('.em-child-row[data-slug]').forEach(function(row) {
        row.addEventListener('click', function() {
          dismissCollidePopover();
          openPopup('docs/' + row.dataset.slug + '.md');
        });
      });
      _activeCollidePop = pop;
      // Outside click dismisses — set after the current click finishes bubbling.
      setTimeout(function() {
        document.addEventListener('click', _outsideCollideHandler);
      }, 0);
    });
  }
  function _outsideCollideHandler(e) {
    if (_activeCollidePop && !_activeCollidePop.contains(e.target)) {
      dismissCollidePopover();
    }
  }
  function dismissCollidePopover() {
    if (_activeCollidePop) {
      _activeCollidePop.remove();
      _activeCollidePop = null;
      document.removeEventListener('click', _outsideCollideHandler);
    }
  }

  // Children list pane (for locations without a grid, and anywhere we want
  // to show direct hierarchy children). Each row is clickable; "+ Add" at the
  // bottom opens the create-new flow scoped to this parent.
  function renderChildrenListPane(children, parentSlug, parentType) {
    var html = '';
    if (!children.length) {
      html += '<div class="em-col-empty">No children yet.</div>';
    } else {
      // Sort by position (letter+number) then title
      children = children.slice().sort(function(a, b) {
        var pa = a.position || '', pb = b.position || '';
        if (pa !== pb) return pa < pb ? -1 : 1;
        var ta = (a.title || a.slug || '').toLowerCase();
        var tb = (b.title || b.slug || '').toLowerCase();
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      });
      // Find titles that collide among siblings so we can disambiguate with a
      // subtitle (lot/expiration/slug tail). Only shown for colliders.
      var titleCounts = {};
      children.forEach(function(c) {
        var t = (c.title || c.slug || '').toLowerCase();
        titleCounts[t] = (titleCounts[t] || 0) + 1;
      });
      children.forEach(function(c) {
        var t = (c.title || c.slug || '').toLowerCase();
        var subtitle = '';
        if (titleCounts[t] > 1) {
          var bits = [];
          if (c.lot) bits.push('lot ' + c.lot);
          if (c.expiration) bits.push('exp ' + c.expiration);
          if (!bits.length && c.slug) bits.push(c.slug.split('/').pop());
          subtitle = bits.join(' · ');
        }
        html += renderChildRow(c, subtitle);
      });
    }
    html += '<button type="button" class="em-add-btn" data-em-add="1">' +
      '<span class="material-icons-outlined" style="font-size:16px">add</span> Add item</button>';
    return html;
  }

  function renderChildRow(entry, subtitle) {
    if (!entry) return '';
    var type = entry.type || 'container';
    var tc = Lab.types.get(type);
    var pos = entry.position ? '<span class="ec-pos">' + escHtml(entry.position) + '</span>' : '';
    var titleHTML = escHtml(entry.title || entry.slug || '');
    if (subtitle) {
      titleHTML += '<span style="color:var(--grey-500);font-weight:400;font-size:11px;margin-left:6px">' + escHtml(subtitle) + '</span>';
    }
    return '<div class="em-child-row" data-slug="' + escHtml(entry.slug || '') + '">' +
      '<span class="ec-icon">' + Lab.types.renderIcon(tc.icon) + '</span>' +
      '<span class="ec-title" title="' + escHtml(entry.slug || '') + '">' + titleHTML + '</span>' +
      pos +
      '</div>';
  }

  function bindChildrenListHandlers(parentSlug, parentType) {
    var mount = document.getElementById('em-contents');
    if (!mount) return;
    mount.querySelectorAll('.em-child-row[data-slug]').forEach(function(row) {
      row.addEventListener('click', function() {
        var slug = row.dataset.slug;
        if (slug) openPopup('docs/' + slug + '.md');
      });
    });
    var addBtn = mount.querySelector('[data-em-add]');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        openNew({
          parent: parentSlug,
          defaultType: autoChildType(parentType),
        });
      });
    }
  }

  // Given a parent type, pick a sensible default type for a new child.
  // This is "auto" (Grey's choice, option a): one default per parent type,
  // user can change it before saving.
  function autoChildType(parentType) {
    switch (parentType) {
      case 'room':      return 'container'; // generic furniture — user picks specific
      case 'freezer':
      case 'fridge':    return 'shelf';
      case 'shelf':     return 'box';
      case 'box':       return 'tube';
      case 'tube':      return 'container';
      case 'container': return 'container';
      default:          return 'container';
    }
  }

  async function startEditing() {
    if (!currentState) return;
    currentState.editing = true;
    // R7 #23: body class so the issue-reporter FAB hides while we're
    // editing (same mechanism as wiki.html's body.editing-mode).
    document.body.classList.add('em-editing');

    // Switch fields to editable
    renderFields(currentState.meta, true);

    // Switch button states
    document.getElementById('em-edit-toggle').innerHTML = '<span class="material-icons-outlined" style="font-size:16px">close</span> Cancel';
    document.getElementById('em-save').style.display = '';
    document.getElementById('em-delete').style.display = 'none';

    // Load Toast UI and init editor
    await loadToast();
    var contentEl = document.getElementById('em-content');
    contentEl.innerHTML = '<div class="em-surface" style="min-height:500px"></div>';
    var editorEl = contentEl.querySelector('.em-surface');

    // Convert [[wikilinks]] to standard links, resolve paths, and placeholder media before feeding to Toast UI
    var prepared = migrateAdmonitions(currentState.body);
    prepared = mediaToPlaceholders(prepared);
    prepared = loadImageSizes(prepared);
    prepared = await wikilinksToLinks(prepared);
    prepared = resolveImagePaths(prepared, currentState ? currentState.path : null);
    // #154: if the body is just `# Title` with nothing after, give the user
    // a blank paragraph to type into instead of cornering them inside the H1.
    // Matches the daily-notebook template fix (#143) but applies to every
    // object type that opens into edit mode.
    prepared = ensureParagraphAfterHeading(prepared);

    currentEditor = new toastui.Editor({
      el: editorEl,
      initialEditType: 'wysiwyg',
      hideModeSwitch: true,
      previewStyle: 'vertical',
      height: 'auto',
      minHeight: '500px',
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

    // Attach the inline [[ autocomplete (R4 Phase 1) to the WYSIWYG surface.
    // Fires when the user types `[[` anywhere in the editor, shows a filterable
    // dropdown of objects from the index, inserts `[[slug]]` on selection.
    try {
      if (window.Lab.wikilinkAutocomplete) {
        // Small delay lets the ProseMirror DOM settle before we look up the
        // contentEditable node to attach listeners to.
        setTimeout(function() {
          try { Lab.wikilinkAutocomplete.attach(currentEditor, editorEl); } catch(e) {}
        }, 200);
      }
    } catch(e) {}

    // Re-render the Contents column in editable mode. container_list becomes
    // an editable repeating-rows widget; grid/children-list stay read-only
    // for now (editing positions happens via the child objects themselves).
    try {
      await renderContents(currentState, true);
    } catch(e) { /* non-fatal */ }
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
        if (input.type === 'checkbox') { val = input.checked; }
        else if (input.type === 'number' && val !== '') val = parseFloat(val);
        currentState.meta[key] = val;
      });
      collectContainers(currentState.meta);
    }

    currentState.editing = false;
    currentEditor = null;
    // R7 #23: drop the body class so the issue-reporter FAB becomes
    // reachable again in view mode.
    document.body.classList.remove('em-editing');

    // Detach the inline [[ autocomplete (R4) — no editor to listen to anymore.
    try { if (window.Lab.wikilinkAutocomplete) Lab.wikilinkAutocomplete.detach(); } catch(e) {}

    // Switch back to read mode
    document.getElementById('em-edit-toggle').innerHTML = '<span class="material-icons-outlined" style="font-size:16px">edit</span> Edit';
    document.getElementById('em-save').style.display = 'none';
    document.getElementById('em-delete').style.display = '';

    renderFields(currentState.meta, false);

    // Re-upgrade parent field pill after switching back to view mode.
    try { await upgradeParentField(); } catch(e) {}

    var html = await renderMarkdown(currentState.body);
    var contentEl = document.getElementById('em-content');

    // Re-render breadcrumb (post-edit the parent may have changed). Skip for
    // root objects — same rationale as openPopup.
    var crumbHTML = '';
    try {
      if (window.Lab.hierarchy && currentState.path) {
        Lab.hierarchy.invalidate();
        var slug = currentState.path.replace(/^docs\//, '').replace(/\.md$/, '');
        var chain = await Lab.hierarchy.parentChain(slug);
        if (chain && chain.length > 1) {
          crumbHTML = await Lab.hierarchy.breadcrumbHTML(slug);
        }
      }
    } catch(e) {}

    contentEl.innerHTML = crumbHTML + '<div class="lab-rendered em-rendered">' + html + '</div>';
    if (window.Lab.wikilinks) {
      await window.Lab.wikilinks.processRendered(contentEl);
    }

    // Refresh contents column
    try { await renderContents(currentState, false); } catch(e) {}
  }

  async function save() {
    if (!currentState || !currentState.editing) return;
    var gh = window.Lab.gh;
    if (!gh || !gh.isLoggedIn()) { window.Lab.showToast('Sign in to save', 'error'); return; }

    // Collect field values
    document.querySelectorAll('.em-field-input').forEach(function(input) {
      var key = input.dataset.key;
      var val = input.value;
      if (input.type === 'checkbox') { val = input.checked; }
      else if (input.type === 'number' && val !== '') val = parseFloat(val);
      currentState.meta[key] = val;
    });
    collectContainers(currentState.meta);

    // Get markdown from editor (restore wikilink pills to [[slug]] syntax)
    if (currentEditor) {
      currentState.body = getMarkdownClean(currentEditor);
    }

    // Also include hidden fields from schema. The `type` key is deliberately
    // skipped here even if the schema declares type as a hidden field with a
    // fixed value — in R3 the type is a user-editable datalist input (see
    // renderFields), and force-overwriting it from the schema would clobber
    // the user's pick (and break the inherited-schema case where a `room`
    // object inherits freezer's schema whose hidden value is `freezer`).
    var schema = getSchema(currentState.meta.type || 'reagent');
    schema.forEach(function(f) {
      if (f.key === 'type') return;
      if (f.type === 'hidden' && f.value) {
        currentState.meta[f.key] = f.value;
      }
    });

    // Audit stamps: always update updated_at; backfill created_at/created_by for legacy items
    var nowIso = new Date().toISOString();
    currentState.meta.updated_at = nowIso;
    if (!currentState.meta.created_at) currentState.meta.created_at = nowIso;
    if (!currentState.meta.created_by) {
      var u = window.Lab.gh && window.Lab.gh.getUser && window.Lab.gh.getUser();
      if (u && u.login) currentState.meta.created_by = u.login;
    }

    // Build full content
    var content = window.Lab.buildFrontmatter(currentState.meta, currentState.body);

    var saveBtn = document.getElementById('em-save');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">hourglass_empty</span> Saving...';

    var isNew = !!currentState.isNew;
    var returnTo = currentState.returnTo;

    // If this is a new object, recompute the target directory based on the
    // user's chosen type. openNew picked an initial dir from the defaultType,
    // but the datalist input may have moved the user to a different type —
    // in which case the file should land in that group's dir instead.
    //
    // Also derive the slug from meta.title so wikilinks like [[foo-bar-baz]]
    // are predictable. Falls back to new-<type>-<timestamp> only when title
    // is empty. Collisions against the cached object-index get -2, -3, etc.
    if (isNew) {
      var grp = Lab.types.get(currentState.meta.type || 'container').group;
      var newDir = (Lab.types.GROUPS[grp] && Lab.types.GROUPS[grp].dir) || 'locations';
      var titleForSlug = (currentState.meta.title || '').trim();
      var baseSlug = titleForSlug ? Lab.slugify(titleForSlug) : '';
      if (!baseSlug) {
        baseSlug = 'new-' + (currentState.meta.type || 'item') + '-' + Date.now().toString(36);
      }
      // Resolve collisions via the cached object-index (sync, no round-trip).
      var cachedIdxForSlug = (gh._getCachedIndex && gh._getCachedIndex()) || [];
      var takenPaths = {};
      cachedIdxForSlug.forEach(function(e) { if (e && e.path) takenPaths[e.path] = 1; });
      var candidate = baseSlug;
      var targetRel = newDir + '/' + candidate + '.md';
      var suffix = 2;
      while (takenPaths[targetRel]) {
        candidate = baseSlug + '-' + suffix;
        targetRel = newDir + '/' + candidate + '.md';
        suffix++;
      }
      currentState.path = 'docs/' + targetRel;
    }

    // R6.5: Scoped title uniqueness check for concept types.
    // Refuses to save a second concept card with the same title in the same
    // type. Bottles + locations + legacy stocks are exempt — see
    // Lab.types.isConceptType for the rule. The check uses the cached index;
    // if no index is loaded yet (rare) the check is skipped to avoid blocking
    // the save on a network round-trip.
    var saveType = currentState.meta.type;
    var saveTitle = (currentState.meta.title || '').trim();
    if (saveType && saveTitle && Lab.types.isConceptType(saveType)) {
      var cachedIdx = (gh._getCachedIndex && gh._getCachedIndex()) || null;
      if (cachedIdx && cachedIdx.length) {
        var collisions = cachedIdx.filter(function(e) {
          if (e.type !== saveType) return false;
          if (!e.title || String(e.title).trim().toLowerCase() !== saveTitle.toLowerCase()) return false;
          // Don't count the file we're currently saving.
          var entryPath = 'docs/' + e.path;
          if (entryPath === currentState.path) return false;
          return true;
        });
        if (collisions.length) {
          var existing = collisions[0].path;
          window.Lab.showToast(
            'A ' + saveType + ' titled "' + saveTitle + '" already exists at ' + existing + '. Pick a different title or open the existing one.',
            'error'
          );
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">save</span> Save';
          return;
        }
      }
    }

    var commitMsg = (isNew ? 'Create ' : 'Update ') + currentState.path.replace(/^docs\//, '');

    try {
      var result = await gh.saveFile(currentState.path, content, currentState.sha, commitMsg);
      currentState.sha = result.sha;
      window.Lab.showToast(isNew ? 'Created' : 'Saved', 'success');

      // Cache the saved content + sha locally so re-opening the item shows new values
      // immediately and avoids a stale-sha conflict if the GitHub API hasn't caught up.
      try {
        var fileCache = JSON.parse(localStorage.getItem('lab_file_cache')) || {};
        fileCache[currentState.path] = { content: content, sha: result.sha, savedAt: Date.now() };
        localStorage.setItem('lab_file_cache', JSON.stringify(fileCache));
      } catch(e) {}

      // Update object index in-memory + localStorage (survives refresh without waiting for deploy)
      gh.patchObjectIndex(currentState.path, currentState.meta);
      // Mirror the body's wikilinks into the link-index so backlinks for
      // newly-edited or freshly-created files appear immediately in the
      // referenced object's popup, instead of waiting for the next deploy.
      if (gh.patchLinkIndex) gh.patchLinkIndex(currentState.path, currentState.body || '');
      if (window.Lab.hierarchy) Lab.hierarchy.invalidate();

      // Fire custom event so parent app can refresh
      window.dispatchEvent(new CustomEvent('lab-file-saved', {
        detail: { path: currentState.path, meta: currentState.meta, isNew: isNew }
      }));

      if (isNew && returnTo) {
        // After a successful create, reopen the parent popup so the user sees
        // the new child in the contents pane. Brief delay gives Toast UI a
        // chance to tear down cleanly.
        currentState.isNew = false;
        close();
        setTimeout(function() { openPopup(returnTo); }, 80);
      } else if (isNew) {
        // No parent to return to — just close and let the caller handle UI.
        close();
      } else {
        // Standard update: switch back to view mode.
        await stopEditing();
      }
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
    // R7 #32: a hard close blows away the nav history — Escape / outside
    // click are explicit "dismiss everything" gestures.
    navStack = [];
    isBackNavigation = false;
    // R7 #23: make sure the em-editing body class is cleared whenever we
    // close — openNew may have set it before the user hit Cancel, and a
    // stale class would keep the issue FAB hidden after close.
    document.body.classList.remove('em-editing');
    // Detach the inline [[ autocomplete (R4) so its DOM listeners don't leak
    // across popup opens.
    try { if (window.Lab.wikilinkAutocomplete) Lab.wikilinkAutocomplete.detach(); } catch(e) {}
    currentState = null;
  }

  // R7 #32: bound to X + footer Close buttons. Pops one level off the nav
  // stack if there's a parent to return to, else hard-closes. This way
  // "box → tube → X" returns you to the box popup instead of dismissing
  // all the way out to the page.
  function closeOrBack() {
    if (navStack.length > 0) {
      var prev = navStack.pop();
      isBackNavigation = true;
      // Tear down just the editor/autocomplete attachments before re-open
      // (openPopup would otherwise see a live state from the current popup
      // and try to push it onto the stack — isBackNavigation guards that).
      if (currentEditor) currentEditor = null;
      try { if (window.Lab.wikilinkAutocomplete) Lab.wikilinkAutocomplete.detach(); } catch(e) {}
      document.body.classList.remove('em-editing');
      openPopup(prev);
      return;
    }
    close();
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
      linkModalCategory = '_all';
      renderLinkCategories();
      document.getElementById('em-link-search').value = '';
      document.getElementById('em-link-list').innerHTML = '<div style="color:var(--grey-500);padding:16px;text-align:center">Type to search across all categories</div>';
      document.getElementById('em-link-create').style.display = 'none';
      linkModalEl.classList.add('open');
      setTimeout(function() { document.getElementById('em-link-search').focus(); }, 100);
    });
  }

  function renderLinkCategories() {
    var el = document.getElementById('em-link-cats');
    // "Search All" pseudo-tab first
    var isAll = linkModalCategory === '_all';
    var html = '<button style="display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid ' + (isAll ? '#333' : 'var(--grey-300)') + ';background:' + (isAll ? '#33315' : '#fff') + ';color:' + (isAll ? '#333' : 'var(--grey-700)') + ';font-size:13px;font-weight:500;cursor:pointer;font-family:inherit" onclick="Lab.editorModal._selectCat(\'_all\')">' +
      '<span class="material-icons-outlined" style="font-size:16px">search</span>Search All</button>';
    html += Object.keys(getObjectTypes()).map(function(key) {
      var cfg = getObjectTypes()[key];
      var isActive = linkModalCategory === key;
      return '<button style="display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:20px;border:1px solid ' + (isActive ? cfg.color : 'var(--grey-300)') + ';background:' + (isActive ? cfg.color + '15' : '#fff') + ';color:' + (isActive ? cfg.color : 'var(--grey-700)') + ';font-size:13px;font-weight:500;cursor:pointer;font-family:inherit" onclick="Lab.editorModal._selectCat(\'' + key + '\')">' +
        '<span class="material-icons-outlined" style="font-size:16px">' + cfg.icon + '</span>' + cfg.label + '</button>';
    }).join('');
    el.innerHTML = html;
  }

  // R6: when the user picks the Locations category we render a hierarchy
  // tree (via Lab.locationTree) into #em-link-list instead of a flat list.
  // The shared #em-link-search input becomes the tree filter.
  var linkModalLocationTree = null;

  function selectLinkCategory(key) {
    // Tear down any previous tree before swapping categories.
    if (linkModalLocationTree && linkModalLocationTree.destroy) {
      linkModalLocationTree.destroy();
      linkModalLocationTree = null;
    }
    linkModalCategory = key;
    renderLinkCategories();
    document.getElementById('em-link-search').value = '';
    filterLinkItems();
  }

  function filterLinkItems() {
    if (!linkModalCategory || !linkModalIndex) return;
    var q = (document.getElementById('em-link-search').value || '').toLowerCase().trim();
    var cfg = getObjectTypes()[linkModalCategory];

    // "Search All" — global search across every type
    if (linkModalCategory === '_all') {
      document.getElementById('em-link-create').style.display = 'none';
      var list = document.getElementById('em-link-list');
      if (!q) {
        list.innerHTML = '<div style="color:var(--grey-500);padding:16px;text-align:center">Type to search across all categories</div>';
        return;
      }
      // Score-based matching: split query into words, count matches per item
      var words = q.split(/\s+/).filter(Boolean);
      var scored = [];
      linkModalIndex.forEach(function(obj) {
        var haystack = ((obj.title || '') + ' ' + (obj.type || '') + ' ' + (obj.path || '') + ' ' + (obj.location || '')).toLowerCase();
        var hits = 0;
        words.forEach(function(w) { if (haystack.includes(w)) hits++; });
        if (hits > 0) scored.push({ obj: obj, score: hits });
      });
      scored.sort(function(a, b) { return b.score - a.score; });
      var items = scored.slice(0, 50);
      if (!items.length) {
        list.innerHTML = '<div style="color:var(--grey-500);padding:16px;text-align:center">No results for "' + window.Lab.escHtml(q) + '"</div>';
        return;
      }
      var esc = window.Lab.escHtml;
      list.innerHTML = items.map(function(s) {
        var obj = s.obj;
        var slug = obj.path.replace(/\.md$/, '');
        var displaySlug = slug.split('/').pop();
        var tc = window.Lab.types.get(obj.type || '');
        var meta = [tc.label || obj.type || ''];
        if (obj.location) meta.push(obj.location);
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--grey-100);cursor:pointer;border-radius:4px" onmouseover="this.style.background=\'var(--grey-50)\'" onmouseout="this.style.background=\'\'" onclick="Lab.editorModal._insertLink(\'' + esc(slug) + '\',\'' + esc(obj.title || displaySlug) + '\')">' +
          '<span style="' + window.Lab.types.pillStyle(obj.type) + 'font-size:11px;padding:2px 6px;border-radius:8px">' + Lab.types.renderIcon(tc.icon) + '</span>' +
          '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500">' + esc(obj.title || displaySlug) + '</div>' +
          '<div style="font-size:12px;color:var(--grey-500)">' + meta.map(esc).join(' \u00B7 ') + '</div></div></div>';
      }).join('');
      return;
    }

    // R6: Locations category renders a hierarchy tree picker, not a flat list.
    if (linkModalCategory === 'locations') {
      var list = document.getElementById('em-link-list');
      // Hide the "create new" button — locations are picked from the tree.
      document.getElementById('em-link-create').style.display = 'none';
      // First call: mount the tree. Subsequent calls just push the filter.
      if (!linkModalLocationTree) {
        list.innerHTML = '';
        list.style.maxHeight = '380px';
        linkModalLocationTree = Lab.locationTree.attach(list, {
          mode: 'picker',
          showSearch: false,            // shared #em-link-search drives filter
          showActions: false,
          draggable: false,
          locationsOnly: true,
          initialDepth: 2,
          onPick: function(slug) {
            // Pull the title out of the index for the toast.
            var entry = (linkModalIndex || []).find(function(o) {
              return o.path === slug + '.md' || o.path === slug;
            });
            insertLink(slug, (entry && entry.title) || slug.split('/').pop());
          },
        });
      }
      linkModalLocationTree.filter(q);
      return;
    }

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

      // Floating button bar (top-right of editor)
      var fabBar = document.createElement('div');
      fabBar.className = 'mobile-fab-bar';
      fabBar.style.cssText = 'position:absolute;top:4px;right:4px;z-index:100;display:flex;gap:6px;';

      // Cancel button
      var cancelFab = document.createElement('button');
      cancelFab.type = 'button';
      cancelFab.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">close</span>';
      cancelFab.style.cssText = 'width:34px;height:34px;border-radius:50%;border:none;background:#fff;color:var(--grey-600);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);';
      cancelFab.title = 'Cancel';
      cancelFab.onclick = function(e) {
        e.preventDefault();
        // Find and click the real cancel button
        var realBtn = document.querySelector('[onclick*="cancelEdit"]');
        if (realBtn) realBtn.click();
      };
      fabBar.appendChild(cancelFab);

      // Save button
      var saveFab = document.createElement('button');
      saveFab.type = 'button';
      saveFab.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">save</span>';
      saveFab.style.cssText = 'width:34px;height:34px;border-radius:50%;border:none;background:var(--teal);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);';
      saveFab.title = 'Save';
      saveFab.onclick = function(e) {
        e.preventDefault();
        var realBtn = document.getElementById('saveBtn') || document.getElementById('saveNewBtn');
        if (realBtn) realBtn.click();
      };
      fabBar.appendChild(saveFab);

      // R15 #28: Format toggle button (Aa icon) — opens a horizontal row
      // of text-formatting buttons (bold, italic, headings, lists, link,
      // code) that call Toast UI's exec() API. Scoped to mobile edit mode
      // only; desktop still uses the native Toast UI toolbar.
      var formatFab = document.createElement('button');
      formatFab.type = 'button';
      formatFab.className = 'mobile-format-toggle';
      formatFab.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">text_format</span>';
      formatFab.style.cssText = 'width:34px;height:34px;border-radius:50%;border:none;background:#fff;color:var(--teal-dark);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);';
      formatFab.title = 'Text formatting';
      formatFab.onclick = function(e) {
        e.preventDefault();
        toggleMobileFormatBar(containerEl, editor);
      };
      fabBar.appendChild(formatFab);

      // + Insert button
      _mobileFab = document.createElement('button');
      _mobileFab.type = 'button';
      _mobileFab.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">add</span>';
      _mobileFab.style.cssText = 'width:34px;height:34px;border-radius:50%;border:none;background:var(--teal);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);';
      _mobileFab.onclick = function(e) {
        e.preventDefault();
        toggleMobileSheet(containerEl, editor);
      };
      fabBar.appendChild(_mobileFab);

      editorUI.style.position = 'relative';
      editorUI.appendChild(fabBar);

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

  // R15 #28: Format bar element — separate from _mobileSheet so users can
  // toggle the format row independently of the + Insert sheet.
  var _mobileFormatBar = null;

  function cleanupMobileSheet() {
    if (_mobileFab) {
      var bar = _mobileFab.closest('.mobile-fab-bar');
      if (bar) bar.remove();
      _mobileFab = null;
    }
    if (_mobileSheet) { _mobileSheet.remove(); _mobileSheet = null; }
    if (_mobileFormatBar) { _mobileFormatBar.remove(); _mobileFormatBar = null; }
    _mobileEditor = null;
  }

  // R15 #28: Mobile text-formatting toolbar. Clicking the Aa format button
  // in the fab bar opens a compact horizontal strip of buttons that each
  // call Toast UI's exec() API for the corresponding formatter. Positioned
  // just below the fab bar at the top-right of the editor. Buttons: Bold,
  // Italic, H2, H3, Bullet list, Numbered list, Code, Blockquote. Link /
  // images / object links live in the + Insert sheet — this bar is
  // strictly text styles.
  function toggleMobileFormatBar(containerEl, editor) {
    if (_mobileFormatBar) {
      _mobileFormatBar.remove();
      _mobileFormatBar = null;
      return;
    }

    var bar = document.createElement('div');
    bar.className = 'mobile-format-bar';
    // Sits below the fab bar (top:4 + 34 + 6 = 44px) and anchors to the
    // right edge of the editor. Semi-opaque white with a shadow so text
    // under it stays legible during the brief hover.
    bar.style.cssText =
      'position:absolute;top:44px;right:4px;z-index:101;' +
      'display:flex;gap:4px;padding:4px;' +
      'background:rgba(255,255,255,.98);border-radius:8px;' +
      'box-shadow:0 2px 12px rgba(0,0,0,.18);' +
      'flex-wrap:nowrap';

    function addFormatBtn(label, title, onClick) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mobile-format-btn';
      b.innerHTML = label;
      b.title = title;
      b.style.cssText =
        'min-width:32px;height:32px;border-radius:6px;border:none;' +
        'background:transparent;color:#262626;' +
        'font-size:14px;font-weight:600;cursor:pointer;' +
        'padding:0 6px;display:flex;align-items:center;justify-content:center;' +
        'font-family:inherit';
      b.addEventListener('mouseenter', function() { b.style.background = '#f3f4f6'; });
      b.addEventListener('mouseleave', function() { b.style.background = 'transparent'; });
      b.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        try { onClick(); } catch(err) { console.error('mobile format:', err); }
      };
      bar.appendChild(b);
    }

    // Each handler refocuses the WYSIWYG editor first so Toast UI's exec
    // applies to the correct ProseMirror instance (markdown mode + WYSIWYG
    // both live in the DOM at the same time).
    function withFocus(fn) {
      return function() {
        var ww = containerEl.querySelector('.toastui-editor-ww-container .ProseMirror');
        if (ww) ww.focus();
        fn();
      };
    }

    addFormatBtn('<b>B</b>', 'Bold',        withFocus(function() { editor.exec('bold'); }));
    addFormatBtn('<i>I</i>', 'Italic',      withFocus(function() { editor.exec('italic'); }));
    addFormatBtn('H2',       'Heading 2',   withFocus(function() { editor.exec('heading', { level: 2 }); }));
    addFormatBtn('H3',       'Heading 3',   withFocus(function() { editor.exec('heading', { level: 3 }); }));
    addFormatBtn('<span style="font-size:18px;line-height:1">\u2022</span>', 'Bullet list',   withFocus(function() { editor.exec('bulletList'); }));
    addFormatBtn('1.',       'Numbered list', withFocus(function() { editor.exec('orderedList'); }));
    addFormatBtn('<code style="font-size:12px">&lt;/&gt;</code>', 'Inline code', withFocus(function() { editor.exec('code'); }));
    addFormatBtn('<span style="font-size:16px;line-height:1">\u201D</span>', 'Blockquote', withFocus(function() { editor.exec('blockQuote'); }));

    var editorUI = containerEl.querySelector('.toastui-editor-defaultUI');
    if (editorUI) {
      editorUI.style.position = 'relative';
      editorUI.appendChild(bar);
      _mobileFormatBar = bar;
    }
  }

  function toggleMobileSheet(containerEl, editor) {
    if (_mobileSheet) {
      _mobileSheet.remove();
      _mobileSheet = null;
      return;
    }

    var sheet = document.createElement('div');
    sheet.className = 'mobile-sheet';
    // z-index must sit above the issue-reporter FAB (10001) so the sheet
    // doesn't get occluded by the floating lightbulb button at bottom-right.
    sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:10050;background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.15);padding:16px 16px 24px;max-height:60vh;overflow-y:auto;';

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
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:10049;background:rgba(0,0,0,.3);';
    // Only close when both mousedown and mouseup land on the backdrop.
    var _sheetMdTarget = null;
    backdrop.addEventListener('mousedown', function(e) { _sheetMdTarget = e.target; });
    backdrop.addEventListener('click', function(e) {
      if (_sheetMdTarget === backdrop) { _mobileSheet.remove(); _mobileSheet = null; }
      _sheetMdTarget = null;
    });

    var wrapper = document.createElement('div');
    wrapper.appendChild(backdrop);
    wrapper.appendChild(sheet);
    _mobileSheet = wrapper;
    document.body.appendChild(wrapper);
  }

  async function triggerMobileUpload(file, editor, containerEl) {
    if (!window.Lab.gh.isLoggedIn()) { window.Lab.showToast('Sign in to upload', 'error'); return; }
    var slug = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
    // Force .jpg extension for camera photos (may come as .heic or no extension)
    if (slug.match(/\.(heic|heif)$/) || !slug.includes('.')) slug = slug.replace(/\.[^.]*$/, '') + '.jpg';
    var path = 'docs/images/' + slug;
    try {
      window.Lab.showToast('Processing...', 'info');
      var resized = await resizeImage(file);
      var dataUrl = resized.dataUrl;
      var base64 = resized.base64;
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
    } catch(e) {
      window.Lab.showToast('Failed: ' + e.message, 'error');
    }
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

    // Inject callout icons into toolbar next to the blockquote (66) button (desktop only)
    var quoteBtn = null;
    if (!isMobile()) {
    quoteBtn = editorUI.querySelector('.toastui-editor-toolbar-icons[aria-label="Blockquote"]') ||
                   editorUI.querySelector('button[data-tooltip="Blockquote"]');
    if (!quoteBtn) {
      var groups = editorUI.querySelectorAll('.toastui-editor-toolbar-group');
      if (groups.length > 1) quoteBtn = groups[1].lastElementChild;
    }
    }
    var calloutAnchor = quoteBtn ? quoteBtn.parentNode : (!isMobile() ? editorUI.querySelector('.toastui-editor-toolbar') : null);
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

    // Upload helper: resizes image, uploads to docs/images/ via GitHub API
    async function uploadMedia(file, callback) {
      if (!window.Lab.gh.isLoggedIn()) { window.Lab.showToast('Sign in to upload', 'error'); return; }
      var slug = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
      var path = 'docs/images/' + slug;
      try {
        var resized = await resizeImage(file);
        var dataUrl = resized.dataUrl;
        var base64 = resized.base64;
        window.Lab.showToast('Uploading ' + file.name + '...', 'info');
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
        if (!resp.ok) {
          var err = await resp.json().catch(function() { return {}; });
          throw new Error(err.message || 'Upload failed');
        }
        window.Lab.showToast('Uploaded: ' + slug, 'success');
        callback(slug, dataUrl);
      } catch(e) {
        window.Lab.showToast('Upload failed: ' + e.message, 'error');
      }
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
        // Default new images to 50% width
        _imgSizes['images/' + slug] = '50%';
        // Show instant preview via data URL for the just-uploaded image.
        // We set img.src to the data URL so the user sees it immediately.
        setTimeout(function() {
          var ww = containerEl.querySelector('.toastui-editor-ww-container') || containerEl;
          ww.querySelectorAll('img').forEach(function(img) {
            var src = img.getAttribute('src') || '';
            if (src.includes(slug) && (!img.complete || img.naturalWidth === 0)) {
              img.dataset.realSrc = src;
              img.src = dataUrl;
              img.style.setProperty('max-width', '50%', 'important');
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
    ytBtn.onclick = async function(e) {
      e.preventDefault();
      var url = await Lab.modal.prompt({ title: 'YouTube Video', message: 'Paste a YouTube URL:', placeholder: 'https://www.youtube.com/watch?v=...' });
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

    // ── Clipboard paste: intercept image data and upload to docs/images/ ──
    // Toast UI's default paste handler inserts images as inline base64 data URLs
    // in the markdown. That bloats the file (a 2MB photo becomes a 2.6MB markdown
    // blob in git) AND breaks image annotation: annotate.js constructs the
    // annotated file path by string-manipulating the src, which explodes when
    // the src is a 2MB data URL ("Failed to fetch"). Fix: snatch the image blob
    // off the clipboard before Toast UI sees it, upload via the GitHub API, and
    // insert a normal `![slug](images/slug)` reference — identical to what the
    // toolbar Image button produces. (#97 #98 #99)
    setTimeout(function() {
      var pasteTarget = containerEl.querySelector('.toastui-editor-ww-container') ||
                        containerEl.querySelector('.ProseMirror') ||
                        containerEl;
      if (!pasteTarget || pasteTarget._pasteHandlerSetup) return;
      pasteTarget._pasteHandlerSetup = true;
      pasteTarget.addEventListener('paste', function(e) {
        var cd = e.clipboardData;
        if (!cd) return;
        // Find the first image item; skip text-only pastes.
        var imgFile = null;
        if (cd.files && cd.files.length) {
          for (var i = 0; i < cd.files.length; i++) {
            if (cd.files[i].type && cd.files[i].type.startsWith('image/')) { imgFile = cd.files[i]; break; }
          }
        }
        if (!imgFile && cd.items) {
          for (var j = 0; j < cd.items.length; j++) {
            if (cd.items[j].kind === 'file' && cd.items[j].type && cd.items[j].type.startsWith('image/')) {
              imgFile = cd.items[j].getAsFile(); break;
            }
          }
        }
        if (!imgFile) return; // Let Toast UI handle non-image pastes normally.
        e.preventDefault();
        e.stopPropagation();
        if (!window.Lab.gh.isLoggedIn()) { window.Lab.showToast('Sign in to paste images', 'error'); return; }
        window.Lab.showToast('Uploading pasted image...', 'info');
        // Build a stable-ish filename so multiple pastes don't collide.
        var ext = (imgFile.type && imgFile.type.split('/')[1]) || 'png';
        ext = ext.split(';')[0].split('+')[0].replace(/[^a-z0-9]/gi, '') || 'png';
        if (ext === 'jpeg') ext = 'jpg';
        var base = (imgFile.name && imgFile.name !== 'image.png' ? imgFile.name.replace(/\.[^.]+$/, '') : 'pasted');
        var hint = base + '-' + Date.now() + '.' + ext;
        uploadImageBlob(imgFile, hint).then(function(res) {
          var slug = res.slug;
          var dataUrl = res.dataUrl;
          editor.changeMode('markdown');
          editor.replaceSelection('\n\n![' + slug.replace(/\.[^.]+$/, '') + '](' + res.path + ')\n\n');
          editor.changeMode('wysiwyg');
          // Default new images to 50% width (matches toolbar Image button behavior).
          _imgSizes[res.path] = '50%';
          // Show instant preview via data URL until the Pages redeploy completes.
          setTimeout(function() {
            var ww = containerEl.querySelector('.toastui-editor-ww-container') || containerEl;
            ww.querySelectorAll('img').forEach(function(img) {
              var src = img.getAttribute('src') || '';
              if (src.includes(slug) && (!img.complete || img.naturalWidth === 0)) {
                img.dataset.realSrc = src;
                img.src = dataUrl;
                img.style.setProperty('max-width', '50%', 'important');
              }
            });
          }, 300);
          window.Lab.showToast('Pasted image uploaded', 'success');
        }).catch(function(err) {
          console.error('paste upload failed:', err);
          window.Lab.showToast('Paste upload failed: ' + (err && err.message || err), 'error');
        });
      }, true); // capture phase — run before Toast UI's own listener
    }, 400);

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
        // Toolbar appended to ww (outside ProseMirror editable content)
        // Positioned using getBoundingClientRect + scroll offset for reliability
        var imgToolbar = null;
        var imgToolbarImg = null;
        ww.style.position = 'relative';

        // Lock scroll to prevent ProseMirror from jumping to top
        // Instead of racing with setTimeout, we intercept scroll events
        var _scrollLock = false;
        var _lockTargets = [];
        var _lockPositions = {};

        function lockScroll() {
          var pm = ww.querySelector('.ProseMirror') || ww;
          var mainEl = document.getElementById('protoMain') || document.getElementById('nbMain');
          _lockTargets = [pm, ww];
          if (mainEl) _lockTargets.push(mainEl);
          _lockPositions = {};
          _lockTargets.forEach(function(el, i) { _lockPositions[i] = el.scrollTop; });
          _scrollLock = true;
          // Auto-unlock after 200ms
          setTimeout(function() { unlockScroll(); }, 200);
        }

        function unlockScroll() {
          _scrollLock = false;
        }

        function onScrollLock(e) {
          if (!_scrollLock) return;
          var idx = _lockTargets.indexOf(e.target);
          if (idx >= 0 && _lockPositions[idx] !== undefined) {
            e.target.scrollTop = _lockPositions[idx];
          }
        }

        // Attach scroll listeners to catch and revert ProseMirror's scroll
        setTimeout(function() {
          var pm = ww.querySelector('.ProseMirror') || ww;
          var mainEl = document.getElementById('protoMain') || document.getElementById('nbMain');
          [pm, ww].concat(mainEl ? [mainEl] : []).forEach(function(el) {
            el.addEventListener('scroll', onScrollLock, { passive: false });
          });
        }, 100);

        function clearImgToolbar() {
          if (imgToolbar) { imgToolbar.remove(); imgToolbar = null; }
          if (imgToolbarImg) { imgToolbarImg.style.outline = ''; imgToolbarImg = null; }
        }

        ww.addEventListener('click', function(e) {
          var img = e.target.closest('img');

          // Clicking toolbar buttons — don't dismiss
          if (e.target.closest('[data-img-toolbar]')) return;

          // Lock scroll to prevent ProseMirror jump
          lockScroll();

          // Clear previous
          clearImgToolbar();
          if (!img) return;

          // Highlight the image
          imgToolbarImg = img;
          img.style.outline = '3px dashed rgba(0,137,123,.5)';

          imgToolbar = document.createElement('div');
          imgToolbar.setAttribute('data-img-toolbar', '1');
          imgToolbar.style.cssText = 'position:absolute;display:flex;gap:4px;padding:4px 8px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.15);z-index:100;align-items:center;font-family:Inter,sans-serif;flex-wrap:wrap;';

          // Size options
          var imgSrc = img.dataset.realSrc || img.getAttribute('src') || '';
          var currentSize = getImageSize(imgSrc) || '100%';
          [{ label: '25%', val: '25%' }, { label: '50%', val: '50%' }, { label: '75%', val: '75%' }, { label: '100%', val: '100%' }].forEach(function(s) {
            var isActive = currentSize === s.val || (!getImageSize(imgSrc) && s.val === '100%');
            var b = document.createElement('button');
            b.textContent = s.label;
            b.setAttribute('data-img-toolbar', '1');
            b.style.cssText = 'padding:3px 8px;border-radius:4px;border:1px solid var(--grey-300);background:' + (isActive ? 'var(--teal)' : '#fff') + ';color:' + (isActive ? '#fff' : 'var(--grey-700)') + ';font-size:11px;cursor:pointer;font-family:inherit;';
            b.onclick = function(ev) {
              ev.stopPropagation();
              ev.preventDefault();
              lockScroll();
              img.style.setProperty('max-width', s.val, 'important');
              var src = resolveRealSrc(img.dataset.realSrc || img.getAttribute('src') || '');
              var relSrc = src.startsWith(MEDIA_BASE) ? src.slice(MEDIA_BASE.length) : src;
              if (s.val === '100%') { delete _imgSizes[relSrc]; } else { _imgSizes[relSrc] = s.val; }
              clearImgToolbar();
            };
            imgToolbar.appendChild(b);
          });

          // Annotate button
          var annBtn = document.createElement('button');
          annBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:14px">edit</span> Annotate';
          annBtn.setAttribute('data-img-toolbar', '1');
          annBtn.style.cssText = 'padding:3px 8px;border-radius:4px;border:1px solid var(--teal);background:var(--teal-50);color:var(--teal-dark);font-size:11px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px;margin-left:4px;';
          annBtn.onclick = function(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            clearImgToolbar();
            img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
          };
          imgToolbar.appendChild(annBtn);

          // Position above image using getBoundingClientRect + ww scroll
          var imgRect = img.getBoundingClientRect();
          var wwRect = ww.getBoundingClientRect();
          var topPos = imgRect.top - wwRect.top + ww.scrollTop - 40;
          var leftPos = imgRect.left - wwRect.left + ww.scrollLeft;
          imgToolbar.style.left = Math.max(0, leftPos) + 'px';
          imgToolbar.style.top = Math.max(0, topPos) + 'px';
          ww.appendChild(imgToolbar);

        });

        // Hover hints (desktop only — on mobile the click outline is enough)
        if (!isMobile()) {
          ww.addEventListener('mouseover', function(e) {
            if (e.target.tagName === 'IMG') {
              e.target.style.outline = '3px dashed rgba(0,137,123,.5)';
              e.target.style.cursor = 'pointer';
              e.target.title = 'Click: resize. Double-click: annotate';
            }
          });
          ww.addEventListener('mouseout', function(e) {
            if (e.target.tagName === 'IMG') {
              if (!imgToolbar) e.target.style.outline = '';
              e.target.style.cursor = '';
              e.target.title = '';
            }
          });
        }
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

  function resolveImagePaths(md, docPath) {
    // Compute the document's directory for relative path resolution.
    // docPath e.g. "docs/plant-harvesting/poplar-leaf-collection.md"
    // → docDir = "plant-harvesting/"
    var docDir = '';
    if (docPath) {
      var parts = docPath.replace(/^docs\//, '').split('/');
      parts.pop(); // remove filename
      if (parts.length) docDir = parts.join('/') + '/';
    }
    // ![alt](images/foo.jpg) → ![alt](/lab-handbook/plant-harvesting/images/foo.jpg)
    md = md.replace(/(!\[[^\]]*\]\()(?!http|data:|\/)([^)]+\))/g, function(m, prefix, rest) {
      return prefix + MEDIA_BASE + docDir + rest;
    });
    // Also resolve src="images/..." in HTML tags (video, source, img)
    md = md.replace(/(src=["'])(?!http|data:|\/)([^"']+["'])/g, function(m, prefix, rest) {
      return prefix + MEDIA_BASE + docDir + rest;
    });
    return md;
  }

  function unresolveImagePaths(md) {
    // ![alt](/lab-handbook/plant-harvesting/images/foo.jpg) → ![alt](images/foo.jpg)
    // Strip the MEDIA_BASE prefix from all image/media paths.
    // Use a simple approach: replace /lab-handbook/ prefix from all markdown image and src paths.
    var base = MEDIA_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp('(!\\[[^\\]]*\\]\\()' + base + '([^)]+\\))', 'g');
    md = md.replace(re, '$1$2');
    var srcRe = new RegExp('(src=["\'])' + base + '([^"\']+["\'])', 'g');
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
      // Replace ![alt](src) with <img> tag. Wrap with blank lines so the tag
      // is its own block — otherwise a preceding heading (## Foo\n![img]) fuses
      // the <img> into the heading when rendered, since ProseMirror can emit
      // heading + image as adjacent lines without a blank-line separator.
      var re = new RegExp('!\\[([^\\]]*)\\]\\(([^)]*' + escaped + '[^)]*)\\)');
      md = md.replace(re, function(m, alt, fullSrc) {
        return '\n\n<img src="' + fullSrc + '" alt="' + alt + '" style="max-width:' + w + '">\n\n';
      });
    });
    // Collapse runs of 3+ newlines back to a single blank line.
    md = md.replace(/\n{3,}/g, '\n\n');
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
    // Ensure a blank line after tables before the next block element.
    // Matches a table row (line containing |) immediately followed by a
    // non-empty, non-table line (no blank line in between).
    md = md.replace(/(\|[^\n]*\|[ \t]*\n)(?=[^\n|])/g, '$1\n');
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
    prepared = resolveImagePaths(prepared, filePath);

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
    openNew: openNew,
    close: close,
    initFullpage: initFullpageEditor,
    loadMarked: loadMarked,
    renderMarkdown: renderMarkdown,
    getSchema: getSchema,
    uploadImageBlob: uploadImageBlob,
    dataUrlToBlob: dataUrlToBlob,
    // Expose for onclick handlers in link modal HTML
    _selectCat: selectLinkCategory,
    _insertLink: insertLink,
    _createAndInsert: createAndInsertLink,
    _openLinkForTextarea: openLinkForTextarea,
    _addContainer: addContainerRow,
    _removeContainer: removeContainerRow,
    _addInstance: addInstanceFromConcept,
  };

  // Create a new instance record from a concept item.
  //
  // Concept → default instance type mapping:
  //   • reagent / chemical / buffer / consumable / …  → bottle   (R5)
  //   • accession                                      → sample   (R19)  but
  //     prompt for sample/extraction/library/pool so the user can pick the
  //     right physical record — all four are legal children of an accession.
  //
  // The new file lands alongside its concept's group (bottles under
  // docs/stocks/, accession instances under docs/accessions/) and gets
  // `of:` pre-filled so it shows up in the concept's instance pane on
  // next open.
  async function addInstanceFromConcept(conceptSlug) {
    if (!conceptSlug) return;
    var conceptEntry = null;
    var idx = Lab.gh._getCachedIndex ? Lab.gh._getCachedIndex() : null;
    if (idx) {
      conceptEntry = idx.find(function(e) {
        return e.path.replace(/\.md$/, '') === conceptSlug;
      });
    }
    var conceptTitle = (conceptEntry && conceptEntry.title) || conceptSlug.split('/').pop();
    var conceptType  = conceptEntry && conceptEntry.type;

    var instanceType = 'bottle';
    var instanceDir = 'stocks';
    var filePrefix = 'bottle-';

    if (conceptType === 'accession') {
      // Ask which kind of physical record. Default to 'sample' since a leaf
      // collection is the earliest point in the pipeline.
      var pick = await Lab.modal.form({
        title: 'New instance of ' + conceptTitle,
        message: 'Pick the kind of physical record to create under this accession.',
        fields: [
          { key: 'kind', label: 'Kind', type: 'select', default: 'sample', options: [
            { value: 'sample',     label: '🌿  Sample (leaf / tissue / seed collection)' },
            { value: 'extraction', label: '🧪  Extraction (DNA / RNA)' },
            { value: 'library',    label: '📖  Library (sequencing prep)' },
            { value: 'pool',       label: '🔀  Pool (multiplexed libraries)' },
          ] },
        ],
        submitText: 'Create',
      });
      if (!pick) return;
      instanceType = pick.kind;
      instanceDir = 'accessions';
      filePrefix = pick.kind + '-';
    }

    var shortConcept = conceptSlug.split('/').pop();
    var slug = instanceDir + '/' + filePrefix + shortConcept + '-' + Math.random().toString(36).slice(2, 8);
    var path = 'docs/' + slug + '.md';
    var content = Lab.buildFrontmatter({
      type: instanceType,
      title: conceptTitle,
      of: conceptSlug,
    }, '\n# ' + conceptTitle + '\n');
    try {
      await Lab.gh.saveFile(path, content, null, 'New instance of ' + conceptTitle);
      Lab.gh.patchObjectIndex(path, { type: instanceType, title: conceptTitle, of: conceptSlug });
      if (Lab.hierarchy) Lab.hierarchy.invalidate();
      window.dispatchEvent(new CustomEvent('lab-file-saved', { detail: { path: path } }));
      await openPopup(path);
      setTimeout(function() {
        startEditing();
        setTimeout(function() {
          var parentInput = document.querySelector('.em-field-input[data-key="parent"]');
          if (parentInput) parentInput.focus();
        }, 500);
      }, 300);
      if (Lab.showToast) Lab.showToast('Created — fill in the details', 'success');
    } catch(e) {
      if (Lab.showToast) Lab.showToast('Failed: ' + e.message, 'error');
    }
  }
})();
