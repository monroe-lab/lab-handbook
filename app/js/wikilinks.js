/* Monroe Lab – Wikilink resolution: [[slug]] → colored pills with popup cards */
(function() {
  'use strict';

  // Type display config: color, icon emoji, label
  var TYPE_CONFIG = {
    reagent:       { color: '#009688', icon: '\uD83E\uDDEA', label: 'Reagent' },
    buffer:        { color: '#e65100', icon: '\uD83E\uDDEA', label: 'Buffer/Solution' },
    consumable:    { color: '#1565c0', icon: '\uD83D\uDCE6', label: 'Consumable' },
    equipment:     { color: '#455a64', icon: '\u2699\uFE0F',  label: 'Equipment' },
    kit:           { color: '#00838f', icon: '\uD83E\uDDF0', label: 'Kit' },
    chemical:      { color: '#009688', icon: '\uD83E\uDDEA', label: 'Chemical' },
    enzyme:        { color: '#2e7d32', icon: '\uD83E\uDDEC', label: 'Enzyme' },
    solution:      { color: '#e65100', icon: '\uD83E\uDDEA', label: 'Solution' },
    seed:          { color: '#558b2f', icon: '\uD83C\uDF31', label: 'Seed Stock' },
    glycerol_stock:{ color: '#4527a0', icon: '\u2744\uFE0F',  label: 'Glycerol Stock' },
    plasmid:       { color: '#ad1457', icon: '\uD83E\uDDEC', label: 'Plasmid' },
    agro_strain:   { color: '#558b2f', icon: '\uD83E\uDDA0', label: 'Agro Strain' },
    dna_prep:      { color: '#0277bd', icon: '\uD83E\uDDEC', label: 'DNA Prep' },
    person:        { color: '#1565c0', icon: '\uD83D\uDC64', label: 'Person' },
    project:       { color: '#e65100', icon: '\uD83D\uDCC1', label: 'Project' },
    protocol:      { color: '#6a1b9a', icon: '\uD83D\uDCD6', label: 'Protocol' },
    notebook:      { color: '#795548', icon: '\uD83D\uDCD3', label: 'Notebook' },
  };
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
      var slug = obj.path.replace(/\.md$/, '').split('/').pop();
      objectLookup[slug] = obj;
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

    var links = containerEl.querySelectorAll('a[href^="obj://"]');
    links.forEach(function(link) {
      if (link.classList.contains('object-pill')) return;

      var target = link.getAttribute('href').replace('obj://', '');
      var obj = objectLookup[target];

      // Also try just the last segment as slug
      if (!obj) {
        var slug = target.split('/').pop();
        obj = objectLookup[slug];
      }

      if (!obj) {
        // Unknown link — style as a plain grey pill
        link.classList.add('object-pill');
        link.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:#9e9e9e;color:#fff;padding:2px 10px 2px 6px;border-radius:20px;font-size:13px;font-weight:500;text-decoration:none;cursor:default;vertical-align:middle;';
        link.addEventListener('click', function(e) { e.preventDefault(); });
        return;
      }

      var conf = TYPE_CONFIG[obj.type] || DEFAULT_CONFIG;
      link.classList.add('object-pill');
      link.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:' + conf.color + ';color:#fff;padding:2px 10px 2px 6px;border-radius:20px;font-size:13px;font-weight:500;text-decoration:none;cursor:pointer;vertical-align:middle;';
      link.textContent = conf.icon + ' ' + (obj.title || target);

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

      var conf = TYPE_CONFIG[obj.type] || DEFAULT_CONFIG;
      link.classList.add('object-pill');
      link.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:' + conf.color + ';color:#fff;padding:2px 10px 2px 6px;border-radius:20px;font-size:13px;font-weight:500;text-decoration:none;cursor:pointer;vertical-align:middle;';
      link.textContent = conf.icon + ' ' + (obj.title || 'Item #' + id);
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
    var conf = TYPE_CONFIG[obj.type] || DEFAULT_CONFIG;
    var isLow = obj.low_stock_threshold && obj.quantity && obj.quantity <= obj.low_stock_threshold;
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
        (isLow ? ' <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:#e65100;background:#fff3e0;">Low Stock</span>' : '') +
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
    TYPE_CONFIG: TYPE_CONFIG,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    ensureLookup: ensureLookup
  };
})();
