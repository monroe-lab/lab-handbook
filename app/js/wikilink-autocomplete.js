/* Monroe Lab – Inline [[ autocomplete for the Toast UI WYSIWYG editor

   Detects when the user types `[[` in the editor and shows a floating
   dropdown of matching objects from the index. Filtering updates as the
   user types more characters. Arrow keys navigate, Enter/click inserts the
   canonical `[[slug]]` form (replacing the trigger text), Esc dismisses.

   The autocomplete is attached per-editor via `Lab.wikilinkAutocomplete.attach(editor, editorEl)`.
   Call `detach()` when the editor is torn down.

   Insertion strategy:
   1. Track the DOM Range from the `[[` trigger to the caret as the user types.
   2. On selection, replace the range with `[[slug]]` via execCommand('insertText').
   3. Round-trip the Toast UI mode (markdown → wysiwyg) to force re-parse so the
      new wikilink renders as an object pill immediately.
*/
(function() {
  'use strict';

  var MAX_RESULTS = 20;

  // Single global dropdown element, reused across editors.
  var dropdown = null;
  var state = null; // { editor, editorEl, triggerNode, triggerOffset, query, items, selectedIdx, onInput, onKeydown }

  // R6.5: Map of concept-slug → number of known instances pointing at it.
  // Built lazily from cached object index + link index. Used by renderItems
  // to badge concepts that have physical instances ("· 2 instances").
  // Counts:
  //   1. R5 bottles via `of:` frontmatter (the high-volume case)
  //   2. R1-style instance objects (location-types) whose body wikilinks
  //      point at the concept (via the link-index from R4)
  var _instanceMap = null;
  function buildInstanceMap() {
    var idx = (Lab.gh && Lab.gh._getCachedIndex && Lab.gh._getCachedIndex()) || [];
    var linkIdx = (Lab.gh && Lab.gh._getCachedLinkIndex && Lab.gh._getCachedLinkIndex()) || [];
    var map = {};
    // Pass 1: `of:` frontmatter (R5 bottles).
    idx.forEach(function(e) {
      if (!e.of) return;
      var ofSlug = String(e.of).replace(/^\[\[/, '').replace(/\]\]$/, '').replace(/\.md$/, '').replace(/^\.\//, '');
      if (!ofSlug) return;
      map[ofSlug] = (map[ofSlug] || 0) + 1;
    });
    // Pass 2: link-index edges from a location/instance type to a concept.
    // Build a quick type lookup so we only count edges originating from
    // instance-flavored types (tubes, boxes, containers, etc.) — otherwise
    // every protocol that mentions a reagent would inflate the count.
    var typeBySlug = {};
    idx.forEach(function(e) { typeBySlug[e.path.replace(/\.md$/, '')] = e.type; });
    var INSTANCE_TYPES = { tube: 1, box: 1, container: 1, freezer: 1, fridge: 1, shelf: 1, room: 1 };
    linkIdx.forEach(function(edge) {
      var srcType = typeBySlug[edge.source];
      if (!INSTANCE_TYPES[srcType]) return;
      // Avoid double-counting if the source already has an `of:` pointing
      // at the same target (would be a degenerate case for now).
      map[edge.target] = (map[edge.target] || 0) + 1;
    });
    return map;
  }
  function getInstanceMap() {
    if (_instanceMap) return _instanceMap;
    _instanceMap = buildInstanceMap();
    return _instanceMap;
  }
  function clearInstanceMap() { _instanceMap = null; }

  // ── DOM helpers ──

  function ensureDropdown() {
    if (dropdown) return dropdown;
    dropdown = document.createElement('div');
    dropdown.className = 'lab-wla-dropdown';
    dropdown.style.cssText = [
      'position:fixed',
      'z-index:10100',
      'background:#fff',
      'border:1px solid #cfd8dc',
      'border-radius:6px',
      'box-shadow:0 6px 20px rgba(0,0,0,.18)',
      'max-width:520px',
      'min-width:360px',
      'max-height:320px',
      'overflow-y:auto',
      'display:none',
      'font-family:Inter,system-ui,sans-serif',
      'font-size:13px',
    ].join(';');
    document.body.appendChild(dropdown);
    return dropdown;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Query + filter ──

  // Score an entry against the query. Lower score = better match.
  // Exact slug match wins; then title prefix; then title contains; then slug contains.
  function scoreEntry(entry, q) {
    if (!q) return 100;
    var slug = (entry.slug || '').toLowerCase();
    var title = (entry.title || '').toLowerCase();
    if (slug === q) return 0;
    if (title === q) return 1;
    if (title.startsWith(q)) return 10;
    if (slug.startsWith(q)) return 15;
    if (title.indexOf(q) >= 0) return 25;
    if (slug.indexOf(q) >= 0) return 30;
    var type = (entry.type || '').toLowerCase();
    if (type.indexOf(q) >= 0) return 50;
    return -1; // no match
  }

  async function filterEntries(query) {
    var q = (query || '').toLowerCase().trim();
    var idx = Lab.gh && Lab.gh._getCachedIndex && Lab.gh._getCachedIndex();
    if (!idx) {
      try { idx = await Lab.gh.fetchObjectIndex(); } catch(e) { idx = []; }
    }
    var scored = [];
    idx.forEach(function(entry) {
      var slug = entry.path.replace(/\.md$/, '');
      var s = scoreEntry({ slug: slug, title: entry.title, type: entry.type }, q);
      if (s >= 0) {
        scored.push({ entry: entry, slug: slug, score: s });
      }
    });
    scored.sort(function(a, b) { return a.score - b.score; });
    return scored.slice(0, MAX_RESULTS);
  }

  // Compute a short parent breadcrumb for display: last 3 segments of the
  // parent chain walked via Lab.hierarchy.
  async function breadcrumbFor(slug) {
    if (!Lab.hierarchy) return '';
    try {
      var chain = await Lab.hierarchy.parentChain(slug);
      if (!chain || chain.length <= 1) return '';
      var ancestors = chain.slice(0, -1); // drop self
      var titles = [];
      for (var i = 0; i < ancestors.length; i++) {
        var e = await Lab.hierarchy.get(ancestors[i]);
        titles.push((e && e.title) || ancestors[i].split('/').pop());
      }
      return titles.slice(-3).join(' / '); // last 3 segments
    } catch(e) { return ''; }
  }

  // ── Render + positioning ──

  // Render the dropdown contents. Explicit args (selectedIdx + onPick) so
  // this function works for BOTH the [[ contenteditable variant and the
  // plain text-input variant without them stepping on each other via
  // module-level `state` mutation.
  async function renderItems(items, selectedIdx, onPick) {
    selectedIdx = selectedIdx || 0;
    // R6.5: pull the instance-count map once per render, not per item.
    var instMap = (Lab.types && Lab.types.isConceptType) ? getInstanceMap() : {};
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var entry = items[i].entry;
      var slug = items[i].slug;
      var type = entry.type || 'container';
      var typeCfg = Lab.types.get(type);
      var icon = typeCfg.icon || '📄';
      var label = typeCfg.label || type;
      var crumb = await breadcrumbFor(slug);
      // R6.5: badge concepts that have known physical instances. Soft hint —
      // doesn't change the link target, just lets the writer notice that
      // there's a more specific thing they could have linked to instead.
      var instanceBadge = '';
      if (Lab.types.isConceptType(type)) {
        var n = instMap[slug] || 0;
        if (n > 0) {
          instanceBadge = ' <span style="display:inline-block;font-size:10px;font-weight:600;color:#00695c;background:#e0f2f1;padding:1px 6px;border-radius:8px;margin-left:4px;vertical-align:middle">' + n + ' instance' + (n === 1 ? '' : 's') + '</span>';
        }
      }
      html += '<div class="lab-wla-item" data-idx="' + i + '"' +
        (i === selectedIdx ? ' data-selected="1" style="background:#e0f2f1"' : '') +
        ' style="padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid #eceff1">' +
        '<span style="font-size:16px;flex-shrink:0">' + icon + '</span>' +
        '<span style="flex:1;min-width:0;overflow:hidden">' +
          '<div style="font-weight:600;color:#263238;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(entry.title || slug) + instanceBadge + '</div>' +
          '<div style="font-size:11px;color:#78909c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
            '<span style="color:' + typeCfg.color + '">' + escHtml(label) + '</span>' +
            (crumb ? ' · ' + escHtml(crumb) : '') +
          '</div>' +
        '</span>' +
      '</div>';
    }
    dropdown.innerHTML = html || '<div style="padding:12px;color:#90a4ae;font-style:italic">No matches</div>';

    // Click to select — `onPick` is variant-specific (applySelection for the
    // [[ variant, applyInputSelection for the plain-input variant).
    dropdown.querySelectorAll('.lab-wla-item').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        // mousedown (not click) so we fire before the editor loses focus
        e.preventDefault();
        var idx = parseInt(el.getAttribute('data-idx'), 10);
        if (onPick) onPick(idx);
      });
    });
  }

  function positionDropdown() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var range = sel.getRangeAt(0).cloneRange();
    range.collapse(false);
    var rect = range.getBoundingClientRect();
    // Fallback to caret node rect if the collapsed range has no box
    if (rect.width === 0 && rect.height === 0) {
      var node = range.startContainer;
      if (node && node.nodeType === 1) {
        rect = node.getBoundingClientRect();
      }
    }
    var top = rect.bottom + 4;
    var left = rect.left;
    // Keep within viewport
    var dropW = 420;
    if (left + dropW > window.innerWidth - 10) {
      left = window.innerWidth - dropW - 10;
    }
    if (top + 320 > window.innerHeight - 10) {
      // Flip above if there's no room below
      top = rect.top - 324;
    }
    dropdown.style.left = left + 'px';
    dropdown.style.top = top + 'px';
    dropdown.style.display = 'block';
  }

  // Hide the dropdown, but ONLY if the caller's variant currently owns it.
  // The [[ variant's blur handler must not clobber the input variant's
  // visible dropdown, and vice versa. `owner` is one of 'trigger' (the [[
  // contenteditable variant), 'input' (the attachToInput variant), or
  // null/undefined (unconditional hide — for Escape key, detach on close).
  function hide(callerOwner) {
    if (!dropdown) return;
    var currentOwner = dropdown.getAttribute('data-wla-owner');
    if (callerOwner && currentOwner && currentOwner !== callerOwner) {
      // Another variant owns the dropdown — leave it alone.
      return;
    }
    dropdown.style.display = 'none';
    dropdown.removeAttribute('data-wla-owner');
    if (state) {
      state.triggerNode = null;
      state.triggerOffset = -1;
      state.query = '';
      state.items = [];
      state.selectedIdx = 0;
    }
  }

  // ── Trigger detection ──

  // Look backward from the current caret through the text node to find `[[`
  // without an intervening `]]`. Returns { node, offset, query } or null.
  function findTrigger() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var range = sel.getRangeAt(0);
    if (!range.collapsed) return null;
    var node = range.startContainer;
    if (!node || node.nodeType !== 3) return null; // text node only
    var offset = range.startOffset;
    var text = node.textContent || '';
    var slice = text.substring(0, offset);
    // Last `[[` in slice, no `]]` between it and the end
    var openIdx = slice.lastIndexOf('[[');
    if (openIdx < 0) return null;
    var between = slice.substring(openIdx);
    if (between.indexOf(']]') >= 0) return null;
    var query = between.slice(2); // drop the `[[`
    // Don't trigger if query contains a newline or is too long
    if (query.indexOf('\n') >= 0) return null;
    if (query.length > 80) return null;
    return { node: node, offset: openIdx, query: query, caretOffset: offset };
  }

  async function onInput() {
    var t = findTrigger();
    if (!t) {
      hide();
      return;
    }
    state.triggerNode = t.node;
    state.triggerOffset = t.offset;
    state.caretOffset = t.caretOffset;
    state.query = t.query;
    state.items = await filterEntries(t.query);
    state.selectedIdx = 0;
    await renderItems(state.items, state.selectedIdx, applySelection);
    positionDropdown();
    dropdown.setAttribute('data-wla-owner', 'trigger');
  }

  function onKeydown(e) {
    if (!dropdown || dropdown.style.display === 'none') return;
    if (!state || !state.items || !state.items.length) {
      if (e.key === 'Escape') { e.preventDefault(); hide(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.selectedIdx = (state.selectedIdx + 1) % state.items.length;
      renderItems(state.items, state.selectedIdx, applySelection);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.selectedIdx = (state.selectedIdx - 1 + state.items.length) % state.items.length;
      renderItems(state.items, state.selectedIdx, applySelection);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      applySelection(state.selectedIdx);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    }
  }

  // ── Apply selected item ──

  function applySelection(idx) {
    if (!state || !state.items || idx < 0 || idx >= state.items.length) return;
    var slug = state.items[idx].slug;
    var node = state.triggerNode;
    var startOffset = state.triggerOffset;
    var endOffset = state.caretOffset;
    if (!node || startOffset < 0) { hide(); return; }

    // Select the `[[query` range in the DOM
    try {
      var range = document.createRange();
      range.setStart(node, startOffset);
      range.setEnd(node, endOffset);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      // Replace with [[slug]] — execCommand dispatches input events so Toast UI
      // (ProseMirror) syncs its state. Deprecated but the most compatible path
      // for contentEditable text insertion without a framework plugin.
      document.execCommand('insertText', false, '[[' + slug + ']]');
    } catch(e) {
      console.warn('wla: insert failed', e);
    }

    hide();

    // Round-trip the Toast UI mode so the just-inserted [[slug]] text is
    // parsed and rendered as an object pill. This mirrors the pattern used by
    // insertLink() in editor-modal.js for the "Insert link" modal.
    try {
      if (state && state.editor && state.editor.changeMode) {
        var ed = state.editor;
        setTimeout(function() {
          try {
            ed.changeMode('markdown');
            ed.changeMode('wysiwyg');
          } catch(e) { /* ignore */ }
        }, 20);
      }
    } catch(e) {}
  }

  // ── Attach / detach ──

  function attach(editor, editorEl) {
    if (!editor || !editorEl) return;
    ensureDropdown();
    detach(); // ensure only one active attachment
    // R6.5: warm both caches so the instance-count badge has data when
    // renderItems runs. Both calls are no-ops if already cached.
    if (Lab.gh) {
      if (Lab.gh.fetchObjectIndex) Lab.gh.fetchObjectIndex().then(clearInstanceMap);
      if (Lab.gh.fetchLinkIndex) Lab.gh.fetchLinkIndex().then(clearInstanceMap);
    }
    state = {
      editor: editor,
      editorEl: editorEl,
      triggerNode: null,
      triggerOffset: -1,
      caretOffset: -1,
      query: '',
      items: [],
      selectedIdx: 0,
    };
    // Toast UI keeps TWO ProseMirror instances in the DOM — one for markdown
    // mode (with syntax-highlighter spans) and one for WYSIWYG mode — only
    // one is visible at a time based on the active mode. We only care about
    // the WYSIWYG one because the popup edit flow is WYSIWYG by default.
    // Try the ww-container first, fall back to a generic `.ProseMirror` only
    // if the structure is different.
    var contentEl = editorEl.querySelector('.toastui-editor-ww-container .ProseMirror')
                 || editorEl.querySelector('.ProseMirror')
                 || editorEl;
    state.contentEl = contentEl;
    state._onInput = function() { onInput(); };
    state._onKeydown = onKeydown;
    // Pass 'trigger' so hide() only acts if this variant currently owns the
    // dropdown. Otherwise we'd clobber the input-variant's dropdown when the
    // user tabs from the body editor to the col 1 parent field.
    state._onBlur = function() { setTimeout(function() { hide('trigger'); }, 200); };
    contentEl.addEventListener('input', state._onInput);
    contentEl.addEventListener('keydown', state._onKeydown, true);
    contentEl.addEventListener('blur', state._onBlur);
  }

  function detach() {
    if (!state) return;
    var contentEl = state.contentEl;
    if (contentEl) {
      contentEl.removeEventListener('input', state._onInput);
      contentEl.removeEventListener('keydown', state._onKeydown, true);
      contentEl.removeEventListener('blur', state._onBlur);
    }
    // Only touch the dropdown if WE had opened it (state.items non-empty and
    // dropdown visible). Otherwise the attachToInput variant may have it open
    // and we'd step on its render.
    if (state.items && state.items.length) {
      hide();
    }
    state = null;
  }

  // ─────────────────────────────────────────────────────────────
  // attachToInput: plain-text-input variant of the autocomplete.
  //
  // For a single <input type="text"> (e.g. the `parent:` field in the popup's
  // col 1 fields panel), show a filterable dropdown whose entire input value
  // is the query. On selection, set the input's value to the picked slug and
  // fire an input event so collectFields picks it up on save.
  //
  // Filter options:
  //   - typeFilter: (optional) array of type names to restrict matches to.
  //     e.g. ['room','freezer','fridge','shelf','box','tube','container'] for
  //     the parent field (locations only).
  // ─────────────────────────────────────────────────────────────
  var inputState = null; // { inputEl, typeFilter, items, selectedIdx, onInput, onKeydown, onFocus, onBlur }

  function attachToInput(inputEl, opts) {
    if (!inputEl) return;
    ensureDropdown();
    detachInput();
    opts = opts || {};

    inputState = {
      inputEl: inputEl,
      typeFilter: opts.typeFilter || null,
      items: [],
      selectedIdx: 0,
    };

    async function refresh() {
      var q = (inputEl.value || '').toLowerCase().trim();
      var raw = await filterEntries(q);
      var filtered = raw;
      if (inputState.typeFilter && inputState.typeFilter.length) {
        filtered = raw.filter(function(r) {
          return inputState.typeFilter.indexOf((r.entry.type || '').toLowerCase()) >= 0;
        });
      }
      inputState.items = filtered;
      inputState.selectedIdx = 0;
      await renderItems(inputState.items, inputState.selectedIdx, applyInputSelection);
      // Position dropdown under the input
      var rect = inputEl.getBoundingClientRect();
      dropdown.style.left = rect.left + 'px';
      dropdown.style.top = (rect.bottom + 4) + 'px';
      dropdown.style.minWidth = Math.max(rect.width, 360) + 'px';
      dropdown.style.display = 'block';
      dropdown.setAttribute('data-wla-owner', 'input');
    }

    function applyInputSelection(idx) {
      if (!inputState || !inputState.items || idx < 0 || idx >= inputState.items.length) return;
      var slug = inputState.items[idx].slug;
      inputEl.value = slug;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      dropdown.style.display = 'none';
    }

    function onInputEvt() { refresh(); }
    function onFocus() { refresh(); }
    function onBlur() {
      // Only hide if this variant still owns the dropdown. Avoids clobbering
      // the [[ variant if the user tabbed from the parent input to the body.
      setTimeout(function() { hide('input'); }, 200);
    }
    function onKeydownEvt(e) {
      if (!dropdown || dropdown.style.display === 'none') return;
      if (!inputState.items || !inputState.items.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        inputState.selectedIdx = (inputState.selectedIdx + 1) % inputState.items.length;
        renderItems(inputState.items, inputState.selectedIdx, applyInputSelection);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        inputState.selectedIdx = (inputState.selectedIdx - 1 + inputState.items.length) % inputState.items.length;
        renderItems(inputState.items, inputState.selectedIdx, applyInputSelection);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        applyInputSelection(inputState.selectedIdx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dropdown.style.display = 'none';
      }
    }

    inputState._onInput = onInputEvt;
    inputState._onFocus = onFocus;
    inputState._onBlur = onBlur;
    inputState._onKeydown = onKeydownEvt;
    inputEl.addEventListener('input', onInputEvt);
    inputEl.addEventListener('focus', onFocus);
    inputEl.addEventListener('blur', onBlur);
    inputEl.addEventListener('keydown', onKeydownEvt);
  }

  function detachInput() {
    if (!inputState) return;
    var el = inputState.inputEl;
    if (el) {
      el.removeEventListener('input', inputState._onInput);
      el.removeEventListener('focus', inputState._onFocus);
      el.removeEventListener('blur', inputState._onBlur);
      el.removeEventListener('keydown', inputState._onKeydown);
    }
    if (dropdown) dropdown.style.display = 'none';
    inputState = null;
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.wikilinkAutocomplete = {
    attach: attach,
    detach: detach,
    attachToInput: attachToInput,
    detachInput: detachInput,
    // Exposed for tests
    _findTrigger: findTrigger,
    _filter: filterEntries,
    _applyIdx: applySelection,
  };
})();
