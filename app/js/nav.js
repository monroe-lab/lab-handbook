/* Monroe Lab – Shared Navigation Bar */
(function() {
  'use strict';

  var BASE = (window.Lab && window.Lab.BASE) || '/lab-handbook/';

  var TABS = [
    { label: 'Dashboard', href: BASE + 'app/',                icon: 'dashboard' },
    { label: 'Protocols', href: BASE + 'app/protocols.html',   icon: 'menu_book' },
    { label: 'Inventory', href: BASE + 'app/inventory.html',   icon: 'science' },
    { label: 'Samples',   href: BASE + 'sample-tracker/',      icon: 'biotech' },
    { label: 'Notebooks', href: BASE + 'notebook-app/',        icon: 'edit_note' },
    { label: 'Calendar',  href: BASE + 'calendar/',            icon: 'calendar_month' },
  ];

  function getActiveTab() {
    var path = location.pathname;
    if (path.includes('/sample-tracker')) return 'Samples';
    if (path.includes('/notebook-app'))   return 'Notebooks';
    if (path.includes('/calendar'))       return 'Calendar';
    if (path.includes('/protocols'))      return 'Protocols';
    if (path.includes('/inventory'))      return 'Inventory';
    // Dashboard: match /app/ or /app/index.html
    if (path.match(/\/app\/(index\.html)?$/)) return 'Dashboard';
    return '';
  }

  function render() {
    if (document.getElementById('lab-nav')) return;

    var active = getActiveTab();
    var nav = document.createElement('nav');
    nav.id = 'lab-nav';
    nav.style.cssText = 'display:flex;align-items:center;background:#00796b;font-family:Inter,-apple-system,sans-serif;overflow-x:auto;position:sticky;top:0;z-index:500;box-shadow:0 2px 4px rgba(0,0,0,.15);';

    // Left: logo
    var logo = document.createElement('a');
    logo.href = BASE + 'app/';
    logo.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 16px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;white-space:nowrap;flex-shrink:0;';
    logo.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">science</span>Monroe Lab';
    nav.appendChild(logo);

    // Tabs
    var tabWrap = document.createElement('div');
    tabWrap.style.cssText = 'display:flex;align-items:center;gap:0;flex:1;overflow-x:auto;-webkit-overflow-scrolling:touch;';

    TABS.forEach(function(t) {
      var a = document.createElement('a');
      var isActive = t.label === active;
      a.href = t.href;
      a.style.cssText = 'display:flex;align-items:center;gap:5px;padding:12px 14px;color:' + (isActive ? '#fff' : 'rgba(255,255,255,.7)') + ';text-decoration:none;font-size:13px;font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;border-bottom:2px solid ' + (isActive ? '#fff' : 'transparent') + ';transition:color .15s,border-color .15s;flex-shrink:0;';
      a.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">' + t.icon + '</span><span class="nav-label">' + t.label + '</span>';
      a.addEventListener('mouseenter', function() { if (!isActive) a.style.color = 'rgba(255,255,255,.9)'; });
      a.addEventListener('mouseleave', function() { if (!isActive) a.style.color = 'rgba(255,255,255,.7)'; });
      tabWrap.appendChild(a);
    });
    nav.appendChild(tabWrap);

    // Right: auth
    var authArea = document.createElement('div');
    authArea.id = 'nav-auth';
    authArea.style.cssText = 'display:flex;align-items:center;gap:8px;padding:0 16px;flex-shrink:0;';
    nav.appendChild(authArea);

    document.body.insertBefore(nav, document.body.firstChild);
    renderAuth();

    // Responsive: hide labels on narrow screens
    var style = document.createElement('style');
    style.textContent = '@media(max-width:500px){.nav-label{display:none}}';
    document.head.appendChild(style);
  }

  function renderAuth() {
    var gh = window.Lab && window.Lab.gh;
    var area = document.getElementById('nav-auth');
    if (!area || !gh) return;

    var user = gh.getUser();
    if (gh.isLoggedIn() && user) {
      area.innerHTML =
        '<img src="' + user.avatar + '" style="width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.3);object-fit:cover">' +
        '<span style="color:#fff;font-size:13px;font-weight:500;opacity:.9">' + (window.Lab.escHtml ? window.Lab.escHtml(user.login) : user.login) + '</span>' +
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
