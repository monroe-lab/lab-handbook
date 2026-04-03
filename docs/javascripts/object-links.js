// Object link handler for rendered wiki pages
// Detects wikilinks to typed objects, renders as colored pills with popup cards
// Also handles legacy inventory:// links for backward compatibility

(function() {
  var INDEX_URL = 'https://monroe-lab.github.io/lab-handbook/object-index.json';
  var INVENTORY_APP = 'https://monroe-lab.github.io/lab-handbook/inventory-app/';
  var objectIndex = null;
  var objectLookup = null; // slug -> object data
  var popup = null;

  // Type display config: color, icon emoji, label
  var TYPE_CONFIG = {
    reagent:    { color: '#009688', icon: '\uD83E\uDDEA', label: 'Reagent' },
    buffer:     { color: '#e65100', icon: '\uD83E\uDDEA', label: 'Buffer/Solution' },
    consumable: { color: '#1565c0', icon: '\uD83D\uDCE6', label: 'Consumable' },
    equipment:  { color: '#455a64', icon: '\u2699\uFE0F',  label: 'Equipment' },
    kit:        { color: '#00838f', icon: '\uD83E\uDDF0', label: 'Kit' },
    chemical:   { color: '#009688', icon: '\uD83E\uDDEA', label: 'Chemical' },
    enzyme:     { color: '#2e7d32', icon: '\uD83E\uDDEC', label: 'Enzyme' },
    solution:   { color: '#e65100', icon: '\uD83E\uDDEA', label: 'Solution' },
    seed:       { color: '#558b2f', icon: '\uD83C\uDF31', label: 'Seed Stock' },
    glycerol_stock: { color: '#4527a0', icon: '\u2744\uFE0F', label: 'Glycerol Stock' },
    plasmid:    { color: '#ad1457', icon: '\uD83E\uDDEC', label: 'Plasmid' },
    agro_strain:{ color: '#558b2f', icon: '\uD83E\uDDA0', label: 'Agro Strain' },
    dna_prep:   { color: '#0277bd', icon: '\uD83E\uDDEC', label: 'DNA Prep' },
    person:     { color: '#1565c0', icon: '\uD83D\uDC64', label: 'Person' },
    project:    { color: '#e65100', icon: '\uD83D\uDCC1', label: 'Project' },
    protocol:   { color: '#6a1b9a', icon: '\uD83D\uDCD6', label: 'Protocol' },
    notebook:   { color: '#795548', icon: '\uD83D\uDCD3', label: 'Notebook' },
  };

  var DEFAULT_CONFIG = { color: '#616161', icon: '\uD83D\uDD17', label: 'Link' };

  function loadIndex() {
    if (objectIndex) return Promise.resolve(objectIndex);
    return fetch(INDEX_URL)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        objectIndex = data;
        objectLookup = {};
        data.forEach(function(obj) {
          var slug = obj.path.replace(/\.md$/, '').split('/').pop();
          objectLookup[slug] = obj;
        });
        return data;
      })
      .catch(function() {
        // Fallback: try GitHub API
        return fetch('https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/object-index.json')
          .then(function(r) { return r.json(); })
          .then(function(json) {
            var decoded = atob(json.content);
            objectIndex = JSON.parse(decoded);
            objectLookup = {};
            objectIndex.forEach(function(obj) {
              var slug = obj.path.replace(/\.md$/, '').split('/').pop();
              objectLookup[slug] = obj;
            });
            return objectIndex;
          });
      });
  }

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

    // Build detail rows
    var details = '';
    if (obj.quantity != null && obj.unit) {
      details += '<span style="color:#9e9e9e;">Quantity</span><span style="font-weight:500;">' + obj.quantity + ' ' + obj.unit + '</span>';
    } else if (obj.quantity != null) {
      details += '<span style="color:#9e9e9e;">Quantity</span><span style="font-weight:500;">' + obj.quantity + '</span>';
    }
    if (obj.location) {
      details += '<span style="color:#9e9e9e;">Location</span><span style="font-weight:500;">\uD83D\uDCCD ' + obj.location + '</span>';
    }
    if (obj.organism) {
      details += '<span style="color:#9e9e9e;">Organism</span><span style="font-weight:500;">' + obj.organism + '</span>';
    }
    if (obj.genotype) {
      details += '<span style="color:#9e9e9e;">Genotype</span><span style="font-weight:500;">' + obj.genotype + '</span>';
    }
    if (obj.source) {
      details += '<span style="color:#9e9e9e;">Source</span><span style="font-weight:500;">' + obj.source + '</span>';
    }
    if (obj.role) {
      details += '<span style="color:#9e9e9e;">Role</span><span style="font-weight:500;">' + obj.role + '</span>';
    }
    if (obj.email) {
      details += '<span style="color:#9e9e9e;">Email</span><span style="font-weight:500;">' + obj.email + '</span>';
    }
    if (obj.cas) {
      details += '<span style="color:#9e9e9e;">CAS</span><span style="font-weight:500;">' + obj.cas + '</span>';
    }
    if (obj.notes) {
      details += '<span style="color:#9e9e9e;">Notes</span><span>' + obj.notes + '</span>';
    }

    // Build action buttons
    var buttons = '';
    var isResource = ['reagent','buffer','consumable','chemical','enzyme','solution','kit'].indexOf(obj.type) !== -1;
    if (isResource) {
      var sdsUrl = 'https://www.google.com/search?q=' + encodeURIComponent(obj.title + ' SDS safety data sheet PDF');
      buttons =
        '<a href="' + sdsUrl + '" target="_blank" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#fff3e0;color:#e65100;text-decoration:none;font-size:13px;font-weight:500;">View SDS</a>' +
        '<a href="' + INVENTORY_APP + '" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#e0f2f1;color:#00796b;text-decoration:none;font-size:13px;font-weight:500;">Inventory App</a>';
    }

    // "View Page" button for all types
    var pageUrl = obj.path.replace(/\.md$/, '/');
    buttons += '<a href="' + pageUrl + '" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#e8eaf6;color:#283593;text-decoration:none;font-size:13px;font-weight:500;">View Page</a>';

    p.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
        '<div style="font-size:18px;font-weight:600;color:#212121;">' + conf.icon + ' ' + obj.title + '</div>' +
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

  function processLinks() {
    loadIndex().then(function() {
      if (!objectLookup) return;

      // Process all links in content area
      var contentEl = document.querySelector('.md-content');
      if (!contentEl) return;
      var links = contentEl.querySelectorAll('a');

      links.forEach(function(link) {
        // Skip already-processed links
        if (link.classList.contains('object-pill')) return;

        var href = link.getAttribute('href') || '';
        var obj = null;

        // Legacy inventory:// links
        if (href.indexOf('inventory://') === 0) {
          var id = parseInt(href.replace('inventory://', ''));
          for (var i = 0; i < objectIndex.length; i++) {
            if (objectIndex[i].legacy_inventory_id === id) {
              obj = objectIndex[i];
              break;
            }
          }
        } else {
          // Standard wikilinks rendered by roamlinks plugin
          // href looks like "../resources/ethanol-absolute/" or "../../resources/ms-basal-salt-mixture/"
          var match = href.match(/\/([^/]+)\/?$/);
          if (match) {
            var slug = match[1];
            obj = objectLookup[slug];
          }
        }

        if (!obj) return;

        var conf = TYPE_CONFIG[obj.type] || DEFAULT_CONFIG;

        // Style as colored pill
        link.classList.add('object-pill');
        link.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:' + conf.color + ';color:#fff;padding:2px 10px 2px 6px;border-radius:20px;font-size:13px;font-weight:500;text-decoration:none;cursor:pointer;vertical-align:middle;';
        link.textContent = conf.icon + ' ' + obj.title;

        link.addEventListener('click', function(e) {
          e.preventDefault();
          showPopup(obj, link);
        });
      });
    });
  }

  // ── Edit Button ──
  function addEditButton() {
    // Remove existing edit button if any (for instant nav)
    var existing = document.getElementById('page-edit-btn');
    if (existing) existing.remove();

    // Determine the file path from the page URL
    var canonical = document.querySelector('link[rel="canonical"]');
    var path = '';
    if (canonical) {
      var m = canonical.href.match(/\/lab-handbook\/(.+?)\/?\s*$/);
      if (m) path = m[1];
    }
    if (!path || path === '' || path === '/') return;

    // Convert URL path to file path: "wet-lab/pcr-genotyping" -> "docs/wet-lab/pcr-genotyping.md"
    var filePath = 'docs/' + path.replace(/\/$/, '') + '.md';
    // Handle index pages
    if (path.endsWith('/') || !path.includes('.')) {
      filePath = 'docs/' + path.replace(/\/$/, '') + '.md';
    }

    var editorUrl = '/lab-handbook/editor/?file=' + encodeURIComponent(filePath);

    var btn = document.createElement('a');
    btn.id = 'page-edit-btn';
    btn.href = editorUrl;
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;gap:6px;padding:10px 18px;border-radius:28px;background:#009688;color:#fff;text-decoration:none;font-family:Inter,-apple-system,sans-serif;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:background .15s;';
    btn.innerHTML = '<span style="font-size:18px;">&#9998;</span> Edit';
    btn.onmouseenter = function() { btn.style.background = '#00796b'; };
    btn.onmouseleave = function() { btn.style.background = '#009688'; };

    document.body.appendChild(btn);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { processLinks(); addEditButton(); });
  } else {
    processLinks();
    addEditButton();
  }

  // MkDocs Material instant navigation support
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function() { processLinks(); addEditButton(); });
  } else {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          processLinks();
          break;
        }
      }
    });
    var content = document.querySelector('.md-content');
    if (content) observer.observe(content, { childList: true, subtree: true });
  }
})();
