// Inventory link handler for rendered wiki pages
// Detects inventory:// links, fetches inventory data, shows popup on click

(function() {
  var INVENTORY_URL = 'https://monroe-lab.github.io/lab-handbook/inventory-app/inventory.json';
  var INVENTORY_APP = 'https://monroe-lab.github.io/lab-handbook/inventory-app/';
  var inventoryData = null;
  var popup = null;

  // Fetch inventory data
  function loadInventory() {
    if (inventoryData) return Promise.resolve(inventoryData);
    return fetch(INVENTORY_URL)
      .then(function(r) { return r.json(); })
      .then(function(data) { inventoryData = data; return data; })
      .catch(function() {
        // Fallback: try GitHub API
        return fetch('https://api.github.com/repos/monroe-lab/lab-handbook/contents/docs/inventory-app/inventory.json')
          .then(function(r) { return r.json(); })
          .then(function(json) {
            var decoded = atob(json.content);
            inventoryData = JSON.parse(decoded);
            return inventoryData;
          });
      });
  }

  function createPopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'inv-popup';
    popup.style.cssText = 'display:none;position:fixed;z-index:99998;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:20px;max-width:380px;width:90%;font-family:Inter,-apple-system,sans-serif;';
    document.body.appendChild(popup);

    // Close on click outside
    document.addEventListener('click', function(e) {
      if (popup.style.display !== 'none' && !popup.contains(e.target) && !e.target.closest('a[href^="inventory://"]')) {
        popup.style.display = 'none';
      }
    });
    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') popup.style.display = 'none';
    });

    return popup;
  }

  function showPopup(item, anchorEl) {
    var p = createPopup();
    var isLow = item.lowStockThreshold && item.quantity <= item.lowStockThreshold;
    var sdsUrl = 'https://www.google.com/search?q=' + encodeURIComponent(item.name + ' SDS safety data sheet PDF');

    var catColors = {
      'Reagent': '#009688',
      'Consumable': '#1565c0',
      'Equipment': '#6a1b9a',
      'Buffer/Solution': '#e65100',
      'Other': '#616161'
    };
    var catColor = catColors[item.category] || '#616161';

    p.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">' +
        '<div style="font-size:18px;font-weight:600;color:#212121;">' + item.name + '</div>' +
        '<button onclick="document.getElementById(\'inv-popup\').style.display=\'none\'" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9e9e9e;padding:0 0 0 8px;">&times;</button>' +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:#fff;background:' + catColor + ';">' + item.category + '</span>' +
        (isLow ? ' <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;color:#e65100;background:#fff3e0;">Low Stock</span>' : '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:14px;margin-bottom:16px;">' +
        '<span style="color:#9e9e9e;">Quantity</span><span style="font-weight:500;">' + item.quantity + ' ' + item.unit + '</span>' +
        '<span style="color:#9e9e9e;">Location</span><span style="font-weight:500;">\u{1F4CD} ' + item.location + '</span>' +
        (item.notes ? '<span style="color:#9e9e9e;">Notes</span><span>' + item.notes + '</span>' : '') +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<a href="' + sdsUrl + '" target="_blank" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#fff3e0;color:#e65100;text-decoration:none;font-size:13px;font-weight:500;">View SDS</a>' +
        '<a href="' + INVENTORY_APP + '" style="flex:1;text-align:center;padding:8px;border-radius:6px;background:#e0f2f1;color:#00796b;text-decoration:none;font-size:13px;font-weight:500;">Inventory App</a>' +
      '</div>';

    // Position near the anchor
    var rect = anchorEl.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = rect.left;

    // Keep on screen
    if (top + 300 > window.innerHeight) top = rect.top - 308;
    if (left + 380 > window.innerWidth) left = window.innerWidth - 400;
    if (left < 10) left = 10;

    p.style.top = top + 'px';
    p.style.left = left + 'px';
    p.style.display = 'block';
  }

  // Style inventory links and handle clicks
  function processLinks() {
    var links = document.querySelectorAll('a[href^="inventory://"]');
    if (links.length === 0) return;

    loadInventory().then(function(data) {
      links.forEach(function(link) {
        var id = parseInt(link.getAttribute('href').replace('inventory://', ''));
        var item = data.find(function(i) { return i.id === id; });

        // Style as pill
        link.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:#009688;color:#fff;padding:2px 10px 2px 6px;border-radius:20px;font-size:13px;font-weight:500;text-decoration:none;cursor:pointer;';
        if (item) {
          link.textContent = '\u{1F9EA} ' + item.name;
        }

        link.addEventListener('click', function(e) {
          e.preventDefault();
          if (item) showPopup(item, link);
        });
      });
    });
  }

  // Run on page load and on MkDocs instant navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processLinks);
  } else {
    processLinks();
  }

  // MkDocs Material instant navigation support
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function() { processLinks(); });
  } else {
    // Fallback: observe DOM changes for instant navigation
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
