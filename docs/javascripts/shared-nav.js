// Shared navigation bar for all standalone apps
// Injects consistent tabs matching the MkDocs site navigation
(function() {
  var BASE = '/lab-handbook/';

  var TABS = [
    { label: 'Home', href: BASE, icon: 'home' },
    { label: 'Protocols', href: BASE + 'wet-lab/', icon: 'menu_book' },
    { label: 'Bioinformatics', href: BASE + 'bioinformatics/', icon: 'computer' },
    { label: 'Inventory', href: BASE + 'resources/', icon: 'science' },
    { label: 'Lab', href: BASE + 'lab-management/', icon: 'hub' },
  ];

  // Determine which tab is active based on current URL
  function getActiveTab() {
    var path = location.pathname;
    if (path.includes('/editor/') || path.includes('/notebook-app/') || path.includes('/sample-tracker/') || path.includes('/calendar/') || path.includes('/lab-management/')) return 'Lab';
    if (path.includes('/inventory-app/') || path.includes('/resources/')) return 'Inventory';
    if (path.includes('/wet-lab/')) return 'Protocols';
    if (path.includes('/bioinformatics/')) return 'Bioinformatics';
    if (path === BASE || path === BASE + 'index.html') return 'Home';
    return '';
  }

  function inject() {
    // Don't inject if already present or inside MkDocs (which has its own tabs)
    if (document.getElementById('shared-nav')) return;
    // Don't inject in MkDocs pages (they have .md-header)
    if (document.querySelector('.md-header')) return;

    var active = getActiveTab();

    var nav = document.createElement('div');
    nav.id = 'shared-nav';
    nav.style.cssText = 'display:flex;align-items:center;gap:0;padding:0 16px;background:#00796b;font-family:Inter,-apple-system,sans-serif;overflow-x:auto;';

    var html = '';
    TABS.forEach(function(t) {
      var isActive = t.label === active;
      html += '<a href="' + t.href + '" style="display:flex;align-items:center;gap:5px;padding:10px 16px;color:' + (isActive ? '#fff' : 'rgba(255,255,255,.7)') + ';text-decoration:none;font-size:13px;font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;border-bottom:2px solid ' + (isActive ? '#fff' : 'transparent') + ';transition:color .15s;">';
      html += '<span class="material-icons-outlined" style="font-size:16px;">' + t.icon + '</span>';
      html += t.label + '</a>';
    });

    nav.innerHTML = html;

    // Insert after the app's own header, or at the top of body
    var header = document.querySelector('.header');
    if (header) {
      header.parentNode.insertBefore(nav, header.nextSibling);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
