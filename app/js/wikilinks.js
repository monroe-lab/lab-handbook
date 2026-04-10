/* Monroe Lab – Wikilink resolution: [[slug]] → colored pills with popup cards */
(function() {
  'use strict';

  // Type config: consumed from the unified type system (types.js)
  function getTypeConfig() { return window.Lab.types ? window.Lab.types.getTypeConfig() : {}; }
  function getConf(typeName) {
    if (window.Lab.types) return window.Lab.types.get(typeName);
    return { color: '#616161', icon: '\uD83D\uDD17', label: 'Link' };
  }
  var DEFAULT_CONFIG = { color: '#616161', icon: '\uD83D\uDD17', label: 'Link' };

  var objectLookup = null; // slug -> object data
  var popup = null;

  // ── Build lookup from object index ──
  async function ensureLookup() {
    if (objectLookup) return;
    var gh = window.Lab && window.Lab.gh;
    if (!gh) return;
    var index = await gh.fetchObjectIndex();
    objectLookup = {};
    index.forEach(function(obj) {
      var parts = obj.path.replace(/\.md$/, '').split('/');
      var last = parts[parts.length - 1];
      // For folder-style pages (e.g. projects/alfalfa-pangenome/index.md), the
      // canonical slug is the parent folder name, not "index".
      var slug = (last === 'index' && parts.length > 1) ? parts[parts.length - 2] : last;
      if (!objectLookup[slug]) objectLookup[slug] = obj;
      // Also index by full relative path (e.g., "wet-lab/pcr-genotyping")
      var relPath = obj.path.replace(/\.md$/, '');
      objectLookup[relPath] = obj;
    });
  }

  // ── Stage 1: Pre-process raw markdown before rendering ──
  // Convert [[slug]] to [slug](obj://slug) so marked.js creates <a> tags
  function preprocessWikilinks(markdown) {
    return markdown.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function(match, target, label) {
      var display = label || target.split('/').pop();
      return '[' + display + '](obj://' + target + ')';
    });
  }

  // ── Stage 2: Post-process rendered HTML ──
  // Find obj:// links and style as pills with click handlers
  async function processRenderedLinks(containerEl) {
    await ensureLookup();
    if (!objectLookup || !containerEl) return;

    // Find obj:// links — check both raw and URL-encoded forms
    var links = containerEl.querySelectorAll('a');
    links.forEach(function(link) {
      var href = link.getAttribute('href') || '';
      if (!href.startsWith('obj://') && !href.startsWith('obj%3A//')) return;
      if (link.classList.contains('object-pill')) return;

      var target = href.replace('obj://', '').replace('obj%3A//', '');
      var obj = objectLookup[target];

      // Also try just the last segment as slug
      if (!obj) {
        var slug = target.split('/').pop();
        obj = objectLookup[slug];
      }

      if (!obj) {
        // Unknown link — style as a plain grey pill
        link.classList.add('object-pill');
        link.style.cssText = window.Lab.types.pillStyle('_unknown') + 'cursor:default;';
        link.addEventListener('click', function(e) { e.preventDefault(); });
        return;
      }

      var conf = getConf(obj.type);
      link.classList.add('object-pill');
      link.style.cssText = window.Lab.types.pillStyle(obj.type);
      link.textContent = window.Lab.types.pillContent(obj.type, obj.title || target);

      link.addEventListener('click', function(e) {
        e.preventDefault();
        // If editor-modal is available, use it for popup editing
        if (window.Lab && window.Lab.editorModal && obj.type !== 'protocol') {
          window.Lab.editorModal.open('docs/' + obj.path);
        } else if (obj.type === 'protocol') {
          // Navigate to protocols app
          var base = (window.Lab && window.Lab.BASE) || '/lab-handbook/';
          var docPath = obj.path.replace(/\.md$/, '');
          location.href = base + 'app/protocols.html?doc=' + encodeURIComponent(docPath);
        } else {
          showPopup(obj, link);
        }
      });
    });

    // Also handle legacy inventory:// links
    var invLinks = containerEl.querySelectorAll('a[href^="inventory://"]');
    invLinks.forEach(function(link) {
      if (link.classList.contains('object-pill')) return;
      var id = parseInt(link.getAttribute('href').replace('inventory://', ''));
      var obj = null;
      var index = window.Lab && window.Lab.gh ? null : null;
      // Search by legacy ID
      if (objectLookup) {
        for (var key in objectLookup) {
          if (objectLookup[key].legacy_inventory_id === id) {
            obj = objectLookup[key];
            break;
          }
        }
      }
      if (!obj) return;

      link.classList.add('object-pill');
      link.style.cssText = window.Lab.types.pillStyle(obj.type);
      link.textContent = window.Lab.types.pillContent(obj.type, obj.title || 'Item #' + id);
      link.addEventListener('click', function(e) {
        e.preventDefault();
        showPopup(obj, link);
      });
    });
  }

  // ── Popup Card ──
  function createPopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'obj-popup';
    popup.style.cssText = 'display:none;position:fixed;z-index:99998;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:20px;max-width:380px;width:90%;font-family:Inter,-apple-system,sans-serif;';
    document.body.appendChild(popup);

    document.addEventListener('click', function(e) {
      if (popup.style.display !== 'none' && !popup.contains(e.target) && !e.target.closest('.object-pill')) {
        popup.style.display = 'none';
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') popup.style.display = 'none';
    });
    return popup;
  }

  function showPopup(obj, anchorEl) {
    var p = createPopup();
    var conf = getConf(obj.type);
    var isLow = obj.low_stock_threshold && obj.quantity != null && obj.quantity <= obj.low_stock_threshold;
    var itemStatus = obj.status ? obj.status : (obj.need_more ? 'needs_more' : 'in_stock');
    var _statusLabels = { in_stock: 'In Stock', needs_more: 'Needs More', out_of_stock: 'Out of Stock', external: 'External' };
    var _statusColors = { in_stock: '#22c55e', needs_more: '#f59e0b', out_of_stock: '#ef4444', external: '#3b82f6' };
    var esc = window.Lab ? window.Lab.escHtml : function(s) { return s; };

    var details = '';
    var fields = [
      ['Quantity', obj.quantity != null ? (obj.quantity + (obj.unit ? ' ' + obj.unit : '')) : null],
      ['Location', obj.location],
      ['Organism', obj.organism],
      ['Source', obj.source],
      ['Role', obj.role],
      ['Email', obj.email],
      ['CAS', obj.cas],
      ['Notes', obj.notes],
    ];
    fields.forEach(function(f) {
      if (f[1]) {
        details += '<span style="color:#9e9e9e;font-size:13px">' + f[0] + '</span><span style="font-weight:500">' + esc(String(f[1])) + '</span>';
      }
    });

    var buttons = '';
    var isResource = ['reagent','buffer','consumable','chemical','enzyme','solution','kit'].indexOf(obj.type) !== -1;
    if (isResource) {
      var sdsUrl = 'https://www.google.com/search?q=' + encodeURIComponent((obj.title || '') + ' SDS safety data sheet PDF');
      buttons += '<a href="' + sdsUrl + '" target="_blank" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#fff3e0;color:#e65100;text-decoration:none;font-size:13px;font-weight:500;">View SDS</a>';
    }

    // Edit button
    buttons += '<button onclick="if(window.Lab&&window.Lab.editorModal){window.Lab.editorModal.open(\'docs/' + obj.path + '\');document.getElementById(\'obj-popup\').style.display=\'none\';}" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#e0f2f1;color:#00796b;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit">Edit</button>';

    p.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
        '<div style="font-size:18px;font-weight:600;color:#212121;">' + conf.icon + ' ' + esc(obj.title || '') + '</div>' +
        '<button onclick="document.getElementById(\'obj-popup\').style.display=\'none\'" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9e9e9e;padding:0 0 0 8px;">&times;</button>' +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:#fff;background:' + conf.color + ';">' + conf.label + '</span>' +
        (itemStatus !== 'in_stock' ? ' <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:' + _statusColors[itemStatus] + ';background:' + _statusColors[itemStatus] + '18;">' + _statusLabels[itemStatus] + '</span>' : (isLow ? ' <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:#e65100;background:#fff3e0;">Low Stock</span>' : '')) +
      '</div>' +
      (details ? '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:14px;margin-bottom:16px;">' + details + '</div>' : '') +
      '<div style="display:flex;gap:8px;">' + buttons + '</div>';

    var rect = anchorEl.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = rect.left;
    if (top + 300 > window.innerHeight) top = rect.top - 308;
    if (left + 380 > window.innerWidth) left = window.innerWidth - 400;
    if (left < 10) left = 10;
    p.style.top = top + 'px';
    p.style.left = left + 'px';
    p.style.display = 'block';
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.wikilinks = {
    preprocess: preprocessWikilinks,
    processRendered: processRenderedLinks,
    ensureLookup: ensureLookup,
    clearLookup: function() { objectLookup = null; },
    _lookup: function(slug) { return objectLookup ? (objectLookup[slug] || null) : null; },
  };
})();
