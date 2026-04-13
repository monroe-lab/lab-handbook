/* Monroe Lab – Rich Input Component
   Enhances any textarea with [[wikilink]] autocomplete and pill rendering.

   Usage:
     Lab.richInput.enhance(textareaElement)        — adds [[ autocomplete
     Lab.richInput.render(text, containerElement)   — renders text with pills
     Lab.richInput.getValue(textareaElement)        — gets raw text with [[slugs]]

   Dependencies: types.js, github-api.js (for object index)
*/
(function() {
  'use strict';

  var dropdownEl = null;
  var activeInput = null;
  var objectIndex = null;
  var objectLookup = null;
  var filterTimeout = null;

  // ── Styles (injected once) ──
  var stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    var s = document.createElement('style');
    s.textContent = [
      '.ri-dropdown{position:absolute;z-index:20000;background:#fff;border:1px solid var(--grey-300);border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);max-height:240px;overflow-y:auto;min-width:280px;display:none}',
      '.ri-dropdown.open{display:block}',
      '.ri-item{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--grey-100)}',
      '.ri-item:last-child{border-bottom:none}',
      '.ri-item:hover,.ri-item.selected{background:var(--teal-50)}',
      '.ri-item-icon{font-size:16px;width:24px;text-align:center;flex-shrink:0}',
      '.ri-item-name{font-weight:500;color:var(--grey-900)}',
      '.ri-item-meta{font-size:11px;color:var(--grey-500)}',
      '.ri-item-info{flex:1;min-width:0}',
      '.ri-hint{padding:8px 12px;font-size:12px;color:var(--grey-400);text-align:center}',
      '.ri-pill{display:inline-flex;align-items:center;gap:3px;padding:1px 8px 1px 5px;border-radius:16px;font-size:13px;font-weight:500;color:#fff;cursor:pointer;vertical-align:middle;text-decoration:none}',
      '.ri-pill:hover{opacity:.85}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Load object index ──
  async function ensureIndex() {
    if (objectIndex) return;
    var gh = window.Lab && window.Lab.gh;
    if (!gh) return;
    var idx = await gh.fetchObjectIndex();
    objectIndex = idx;
    objectLookup = {};
    idx.forEach(function(obj) {
      var slug = obj.path.replace(/\.md$/, '').split('/').pop();
      objectLookup[slug] = obj;
    });
  }

  // ── Create dropdown (singleton) ──
  function getDropdown() {
    if (dropdownEl) return dropdownEl;
    injectStyles();
    dropdownEl = document.createElement('div');
    dropdownEl.className = 'ri-dropdown';
    dropdownEl.id = 'ri-dropdown';
    document.body.appendChild(dropdownEl);

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (dropdownEl.classList.contains('open') && !dropdownEl.contains(e.target) && e.target !== activeInput) {
        closeDropdown();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && dropdownEl.classList.contains('open')) {
        closeDropdown();
      }
    });

    return dropdownEl;
  }

  function closeDropdown() {
    if (dropdownEl) dropdownEl.classList.remove('open');
    activeInput = null;
  }

  // ── Enhance a textarea ──
  function enhance(textarea) {
    if (textarea._riEnhanced) return;
    textarea._riEnhanced = true;
    injectStyles();

    textarea.addEventListener('input', function() {
      handleInput(textarea);
    });

    textarea.addEventListener('keydown', function(e) {
      if (!dropdownEl || !dropdownEl.classList.contains('open')) return;

      var items = dropdownEl.querySelectorAll('.ri-item');
      var selected = dropdownEl.querySelector('.ri-item.selected');
      var idx = Array.from(items).indexOf(selected);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) {
          if (selected) selected.classList.remove('selected');
          items[idx + 1].classList.add('selected');
          items[idx + 1].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) {
          if (selected) selected.classList.remove('selected');
          items[idx - 1].classList.add('selected');
          items[idx - 1].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (selected) {
          e.preventDefault();
          var slug = selected.dataset.slug;
          insertAtCursor(textarea, slug);
          closeDropdown();
        }
      }
    });
  }

  function handleInput(textarea) {
    var val = textarea.value;
    var pos = textarea.selectionStart;

    // Find [[ before cursor
    var before = val.substring(0, pos);
    var match = before.match(/\[\[([^\]]*?)$/);

    if (!match) {
      closeDropdown();
      return;
    }

    var query = match[1].toLowerCase();
    activeInput = textarea;

    // Debounce
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(function() {
      showSuggestions(textarea, query, match.index);
    }, 100);
  }

  async function showSuggestions(textarea, query, matchStart) {
    await ensureIndex();
    if (!objectIndex) return;

    var dd = getDropdown();
    var types = window.Lab.types;

    // Filter
    var results = objectIndex;
    if (query) {
      results = objectIndex.filter(function(obj) {
        return (obj.title || '').toLowerCase().includes(query) ||
               (obj.type || '').toLowerCase().includes(query) ||
               obj.path.toLowerCase().includes(query);
      });
    }
    results = results.slice(0, 15);

    if (!results.length) {
      dd.innerHTML = '<div class="ri-hint">No matches for "' + (window.Lab.escHtml ? window.Lab.escHtml(query) : query) + '"</div>';
    } else {
      dd.innerHTML = results.map(function(obj, i) {
        var slug = obj.path.replace(/\.md$/, '').split('/').pop();
        var conf = types ? types.get(obj.type) : { icon: '\uD83D\uDD17', label: obj.type, color: '#616161' };
        var meta = [conf.label];
        if (obj.location) meta.push(obj.location);
        return '<div class="ri-item' + (i === 0 ? ' selected' : '') + '" data-slug="' + slug + '" data-title="' + (window.Lab.escHtml ? window.Lab.escHtml(obj.title || slug) : slug) + '">' +
          '<span class="ri-item-icon" style="color:' + conf.color + '">' + (Lab.types.renderIcon ? Lab.types.renderIcon(conf.icon) : conf.icon) + '</span>' +
          '<div class="ri-item-info"><div class="ri-item-name">' + (window.Lab.escHtml ? window.Lab.escHtml(obj.title || slug) : slug) + '</div>' +
          '<div class="ri-item-meta">' + meta.join(' \u00B7 ') + '</div></div></div>';
      }).join('');

      // Click handlers
      dd.querySelectorAll('.ri-item').forEach(function(item) {
        item.addEventListener('click', function() {
          insertAtCursor(textarea, item.dataset.slug);
          closeDropdown();
        });
        item.addEventListener('mouseenter', function() {
          dd.querySelectorAll('.ri-item.selected').forEach(function(s) { s.classList.remove('selected'); });
          item.classList.add('selected');
        });
      });
    }

    // Position dropdown below the cursor
    var rect = textarea.getBoundingClientRect();
    dd.style.left = rect.left + 'px';
    dd.style.top = (rect.bottom + 4) + 'px';
    dd.style.width = Math.max(280, rect.width) + 'px';
    dd.classList.add('open');
  }

  function insertAtCursor(textarea, slug) {
    var val = textarea.value;
    var pos = textarea.selectionStart;
    var before = val.substring(0, pos);

    // Find the [[ and replace everything from [[ to cursor with [[slug]]
    var match = before.match(/\[\[([^\]]*?)$/);
    if (!match) return;

    var start = match.index;
    var after = val.substring(pos);
    var newVal = val.substring(0, start) + '[[' + slug + ']]' + after;
    textarea.value = newVal;

    // Move cursor after the inserted link
    var newPos = start + slug.length + 4; // [[ + slug + ]]
    textarea.selectionStart = textarea.selectionEnd = newPos;
    textarea.focus();

    // Trigger input event so frameworks/handlers know the value changed
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ── Render text with pills ──
  // Takes raw text containing [[slug]] and returns HTML with colored pills
  function renderText(text) {
    if (!text) return '';
    var esc = window.Lab.escHtml || function(s) { return s; };
    var types = window.Lab.types;

    return esc(text).replace(/\[\[([^\]]+?)\]\]/g, function(match, slug) {
      var obj = objectLookup ? objectLookup[slug] : null;
      var conf;
      if (obj && types) {
        conf = types.get(obj.type);
      } else {
        conf = { color: '#9e9e9e', icon: '\uD83D\uDD17', label: 'Link' };
      }
      var title = obj ? (obj.title || slug) : slug;
      var style = window.Lab.types ? window.Lab.types.pillStyle(obj ? obj.type : '_unknown') : 'background:' + conf.color + ';color:#fff;padding:1px 8px;border-radius:16px;font-size:13px;font-weight:500;';
      return '<span class="ri-pill" style="' + style + '" title="' + esc(conf.label) + '">' + (window.Lab.types ? window.Lab.types.pillContent(obj ? obj.type : '_unknown', title) : (Lab.types.renderIcon ? Lab.types.renderIcon(conf.icon) : conf.icon) + ' ' + esc(title)) + '</span>';
    });
  }

  // ── Render into a container ──
  // Replaces container innerHTML with rendered text (pills + plain text)
  function renderInto(text, container) {
    ensureIndex().then(function() {
      container.innerHTML = renderText(text);
    });
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.richInput = {
    enhance: enhance,
    renderText: renderText,
    renderInto: renderInto,
    ensureIndex: ensureIndex,
  };
})();
