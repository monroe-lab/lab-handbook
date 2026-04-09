/* Monroe Lab – Shared Navigation Bar
   Desktop: top bar with logo + tabs + auth
   Mobile (<768px): slim top bar (logo + auth) + fixed bottom tab bar with "More" popover
*/
(function() {
  'use strict';

  var BASE = (window.Lab && window.Lab.BASE) || '/lab-handbook/';

  var TABS = [
    { label: 'Wiki',      href: BASE + 'app/wiki.html',        icon: 'hub' },
    { label: 'Protocols', href: BASE + 'app/protocols.html',   icon: 'menu_book' },
    { label: 'Inventory', href: BASE + 'app/inventory.html',   icon: 'science' },
    { label: 'Projects',  href: BASE + 'app/projects.html',    icon: 'folder_special' },
    { label: 'Samples',   href: BASE + 'sample-tracker/',      icon: 'biotech' },
    { label: 'Notebooks', href: BASE + 'app/notebooks.html',   icon: 'edit_note' },
    { label: 'Calendar',  href: BASE + 'calendar/',            icon: 'calendar_month' },
    { label: 'Waste',     href: BASE + 'app/wiki.html?doc=waste/index', icon: 'delete' },
  ];

  // Bottom bar shows these tabs; the rest go in the "More" popover
  var BOTTOM_TABS = ['Wiki', 'Protocols', 'Notebooks', 'Inventory'];

  function getActiveTab() {
    var path = location.pathname;
    if (path.includes('/projects'))       return 'Projects';
    if (path.includes('/sample-tracker')) return 'Samples';
    if (path.includes('/notebook'))       return 'Notebooks';
    if (path.includes('/calendar'))       return 'Calendar';
    if (path.includes('/protocols'))      return 'Protocols';
    if (path.includes('/wiki'))           return 'Wiki';
    if (path.includes('/inventory'))      return 'Inventory';
    if (location.search.indexOf('doc=waste') !== -1) return 'Waste';
    if (path.includes('/graph'))          return '';
    if (path.match(/\/app\/(index\.html)?$/)) return 'Wiki';
    return '';
  }

  function render() {
    if (document.getElementById('lab-nav')) return;

    var active = getActiveTab();

    // ── Top nav bar ──
    var nav = document.createElement('nav');
    nav.id = 'lab-nav';
    nav.style.cssText = 'display:flex;align-items:center;background:#00796b;font-family:Inter,-apple-system,sans-serif;position:sticky;top:0;z-index:500;box-shadow:0 2px 4px rgba(0,0,0,.15);';

    // Logo
    var logo = document.createElement('a');
    logo.href = BASE + 'app/graph.html';
    logo.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 16px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;white-space:nowrap;flex-shrink:0;';
    logo.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">science</span><span>Monroe Lab</span>';
    nav.appendChild(logo);

    // Desktop tab row (hidden on mobile via CSS)
    var tabWrap = document.createElement('div');
    tabWrap.id = 'nav-tabs';
    tabWrap.style.cssText = 'display:flex;align-items:center;gap:0;flex:1;overflow-x:auto;-webkit-overflow-scrolling:touch;';

    TABS.forEach(function(t) {
      var a = document.createElement('a');
      var isActive = t.label === active;
      a.href = t.href;
      a.style.cssText = 'display:flex;align-items:center;gap:5px;padding:12px 14px;color:' + (isActive ? '#fff' : 'rgba(255,255,255,.7)') + ';text-decoration:none;font-size:13px;font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;border-bottom:2px solid ' + (isActive ? '#fff' : 'transparent') + ';transition:color .15s,border-color .15s;flex-shrink:0;';
      a.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">' + t.icon + '</span><span>' + t.label + '</span>';
      a.addEventListener('mouseenter', function() { if (!isActive) a.style.color = 'rgba(255,255,255,.9)'; });
      a.addEventListener('mouseleave', function() { if (!isActive) a.style.color = 'rgba(255,255,255,.7)'; });
      tabWrap.appendChild(a);
    });
    nav.appendChild(tabWrap);

    // Auth area
    var authArea = document.createElement('div');
    authArea.id = 'nav-auth';
    authArea.style.cssText = 'display:flex;align-items:center;gap:8px;padding:0 16px;flex-shrink:0;';
    nav.appendChild(authArea);

    document.body.insertBefore(nav, document.body.firstChild);
    renderAuth();

    // ── Bottom nav bar (mobile only) ──
    renderBottomNav(active);

    // ── Responsive styles ──
    var style = document.createElement('style');
    style.textContent =
      '@media(max-width:768px){' +
        '#nav-tabs{display:none!important}' +
        '#lab-bottom-nav{display:flex!important}' +
        'body{padding-bottom:var(--bottom-nav-height)}' +
      '}';
    document.head.appendChild(style);
  }

  // ── Bottom Nav ──
  function renderBottomNav(active) {
    var bottom = document.createElement('nav');
    bottom.id = 'lab-bottom-nav';
    bottom.style.cssText = 'display:none;position:fixed;bottom:0;left:0;right:0;height:56px;background:#fff;border-top:1px solid #e0e0e0;z-index:500;align-items:stretch;justify-content:space-around;box-shadow:0 -1px 4px rgba(0,0,0,.08);font-family:Inter,-apple-system,sans-serif;';

    // Primary tabs
    BOTTOM_TABS.forEach(function(label) {
      var tab = TABS.find(function(t) { return t.label === label; });
      if (!tab) return;
      var isActive = tab.label === active;
      var a = document.createElement('a');
      a.href = tab.href;
      a.style.cssText = bottomTabStyle(isActive);
      a.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">' + tab.icon + '</span><span style="font-size:10px;font-weight:500;margin-top:2px">' + tab.label + '</span>';
      bottom.appendChild(a);
    });

    // "More" button
    var moreActive = !BOTTOM_TABS.includes(active) && active !== '';
    var moreBtn = document.createElement('button');
    moreBtn.style.cssText = bottomTabStyle(moreActive).replace('text-decoration:none;', '') + 'border:none;background:none;cursor:pointer;font-family:inherit;';
    moreBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">more_horiz</span><span style="font-size:10px;font-weight:500;margin-top:2px">More</span>';
    moreBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMorePopover(bottom);
    });
    bottom.appendChild(moreBtn);

    document.body.appendChild(bottom);
  }

  function bottomTabStyle(isActive) {
    var color = isActive ? '#00796b' : '#757575';
    return 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-decoration:none;color:' + color + ';' +
      (isActive ? 'font-weight:600;' : '') +
      'transition:color .15s;-webkit-tap-highlight-color:transparent;';
  }

  function toggleMorePopover(bottomNav) {
    var existing = document.getElementById('nav-more-popover');
    if (existing) { existing.remove(); return; }

    var active = getActiveTab();
    var overflowTabs = TABS.filter(function(t) { return !BOTTOM_TABS.includes(t.label); });

    var popover = document.createElement('div');
    popover.id = 'nav-more-popover';
    popover.style.cssText = 'position:fixed;bottom:60px;right:8px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.18);z-index:600;min-width:180px;padding:8px 0;font-family:Inter,-apple-system,sans-serif;';

    overflowTabs.forEach(function(t) {
      var isActive = t.label === active;
      var a = document.createElement('a');
      a.href = t.href;
      a.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 20px;text-decoration:none;color:' + (isActive ? '#00796b' : '#424242') + ';font-size:14px;font-weight:' + (isActive ? '600' : '400') + ';';
      a.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">' + t.icon + '</span>' + t.label;
      popover.appendChild(a);
    });

    // Graph link
    var graphLink = document.createElement('a');
    graphLink.href = BASE + 'app/graph.html';
    graphLink.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 20px;text-decoration:none;color:#424242;font-size:14px;border-top:1px solid #e0e0e0;margin-top:4px;';
    graphLink.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">hub</span>Graph';
    popover.appendChild(graphLink);

    document.body.appendChild(popover);

    // Close on outside click
    function close(e) {
      if (!popover.contains(e.target)) {
        popover.remove();
        document.removeEventListener('click', close);
      }
    }
    setTimeout(function() { document.addEventListener('click', close); }, 0);
  }

  // ── Auth ──
  function renderAuth() {
    var gh = window.Lab && window.Lab.gh;
    var area = document.getElementById('nav-auth');
    if (!area || !gh) return;

    var user = gh.getUser();
    if (gh.isLoggedIn() && user) {
      area.innerHTML =
        '<img src="' + user.avatar + '" style="width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.3);object-fit:cover">' +
        '<span class="hide-mobile" style="color:#fff;font-size:13px;font-weight:500;opacity:.9">' + (window.Lab.escHtml ? window.Lab.escHtml(user.login) : user.login) + '</span>' +
        '<button id="nav-logout-btn" style="background:transparent;border:none;color:rgba(255,255,255,.6);font-size:11px;cursor:pointer;padding:4px 8px;font-family:inherit">Sign out</button>';
      document.getElementById('nav-logout-btn').addEventListener('click', function() { gh.logout(); });
    } else {
      area.innerHTML =
        '<button id="nav-login-btn" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Sign in with GitHub</button>';
      document.getElementById('nav-login-btn').addEventListener('click', function() { gh.login(); });
    }
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
