/* Monroe Lab – Shared Navigation Bar
   Desktop: top bar with logo + tabs + auth
   Mobile (<768px): slim top bar (logo + auth) + fixed bottom tab bar with "More" popover
*/
(function() {
  'use strict';

  var BASE = (window.Lab && window.Lab.BASE) || '/lab-handbook/';

  // #145: ordering per Grey's spec. Primary nav follows the 10-tab list he
  // called out; secondary items (Protocols, Waste) land in the "+" overflow
  // popover. The overflow popover is available on all widths — when the
  // browser is narrow enough that not every primary tab fits, the trailing
  // ones fall into the popover as well (see updateOverflow below).
  var TABS = [
    { label: 'Tutorials',  href: BASE + 'app/tutorials.html',  icon: 'play_circle' },
    { label: 'Notebooks',  href: BASE + 'app/notebooks.html',  icon: 'edit_note' },
    { label: 'Inventory',  href: BASE + 'app/inventory.html',  icon: 'science' },
    { label: 'Accessions', href: BASE + 'app/accessions.html', icon: 'fingerprint' },
    { label: 'Projects',   href: BASE + 'app/projects.html',   icon: 'folder_special' },
    { label: 'People',     href: BASE + 'app/people.html',     icon: 'people' },
    { label: 'Calendar',   href: BASE + 'app/calendar.html',   icon: 'calendar_month' },
    { label: 'Lab Map',    href: BASE + 'app/lab-map.html',    icon: 'map' },
    { label: 'Apps',       href: BASE + 'app/apps.html',       icon: 'extension' },
    { label: 'Wiki',       href: BASE + 'app/wiki.html',       icon: 'hub' },
  ];
  // Always-overflow: secondary tabs that live in the "+" popover only. Keep
  // Protocols discoverable but out of the primary bar so the 10 preferred
  // tabs breathe.
  var SECONDARY_TABS = [
    { label: 'Protocols',  href: BASE + 'app/protocols.html',  icon: 'menu_book' },
    { label: 'Waste',      href: BASE + 'app/waste.html',      icon: 'delete' },
  ];

  // Bottom bar shows these tabs; the rest go in the "More" popover
  var BOTTOM_TABS = ['Wiki', 'Notebooks', 'Inventory', 'Accessions'];

  function getActiveTab() {
    var path = location.pathname;
    if (path.includes('/dashboard'))      return 'Home';
    if (path.includes('/projects'))       return 'Projects';
    if (path.includes('/accessions') || path.includes('/sample-tracker')) return 'Accessions';
    if (path.includes('/notebook'))       return 'Notebooks';
    if (path.includes('/calendar'))       return 'Calendar';
    if (path.includes('/protocols'))      return 'Protocols';
    if (path.includes('/wiki'))           return 'Wiki';
    if (path.includes('/inventory'))      return 'Inventory';
    if (path.includes('/people'))         return 'People';
    if (path.includes('/waste'))          return 'Waste';
    if (path.includes('/tutorials'))      return 'Tutorials';
    if (path.includes('/lab-map'))        return 'Lab Map';
    if (path.includes('/apps') || path.includes('/solution-maker') || path.includes('/primer-designer') || path.includes('/plasmid-viewer')) return 'Apps';
    if (path.includes('/graph'))          return '';
    if (path.match(/\/app\/(index\.html)?$/)) return 'Home';
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
    logo.href = BASE + 'app/dashboard.html';
    logo.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 16px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;white-space:nowrap;flex-shrink:0;';
    logo.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">science</span><span>Monroe Lab</span>';
    nav.appendChild(logo);

    // Desktop tab row. `overflow:hidden` (not auto) — if tabs don't fit we
    // measure and hide trailing ones, surfacing them in the "+" popover.
    // No horizontal scrollbar, per #145.
    var tabWrap = document.createElement('div');
    tabWrap.id = 'nav-tabs';
    tabWrap.style.cssText = 'display:flex;align-items:center;gap:0;flex:1;min-width:0;overflow:hidden;';

    TABS.forEach(function(t) {
      var a = document.createElement('a');
      var isActive = t.label === active;
      a.href = t.href;
      a.className = 'lab-nav-tab';
      a.dataset.label = t.label;
      a.style.cssText = 'display:flex;align-items:center;gap:4px;padding:12px 8px;color:' + (isActive ? '#fff' : 'rgba(255,255,255,.7)') + ';text-decoration:none;font-size:13px;font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;border-bottom:2px solid ' + (isActive ? '#fff' : 'transparent') + ';transition:color .15s,border-color .15s;flex-shrink:0;';
      a.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">' + t.icon + '</span><span>' + t.label + '</span>';
      a.addEventListener('mouseenter', function() { if (!isActive) a.style.color = 'rgba(255,255,255,.9)'; });
      a.addEventListener('mouseleave', function() { if (!isActive) a.style.color = 'rgba(255,255,255,.7)'; });
      tabWrap.appendChild(a);
    });
    nav.appendChild(tabWrap);

    // Desktop "+" overflow button — always present. Shows SECONDARY_TABS
    // (Protocols, Waste) plus any primary tab the width pushed off-screen.
    // If the currently active page lives under an overflow tab, style the
    // button as active so the nav still communicates location.
    var isOverflowActive = SECONDARY_TABS.some(function(t) { return t.label === active; });
    var moreBtn = document.createElement('button');
    moreBtn.id = 'nav-desktop-more';
    moreBtn.type = 'button';
    moreBtn.title = 'More';
    moreBtn.style.cssText = 'display:flex;align-items:center;gap:4px;padding:12px 10px;color:' + (isOverflowActive ? '#fff' : 'rgba(255,255,255,.85)') + ';background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:' + (isOverflowActive ? '600' : '500') + ';flex-shrink:0;border-bottom:2px solid ' + (isOverflowActive ? '#fff' : 'transparent') + ';';
    moreBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:20px">add</span><span class="hide-mobile">More</span>';
    moreBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleDesktopMorePopover();
    });
    nav.appendChild(moreBtn);

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
        '#nav-desktop-more{display:none!important}' +
        '#lab-bottom-nav{display:flex!important}' +
        'body{padding-bottom:var(--bottom-nav-height)}' +
      '}' +
      '@media(min-width:769px) and (max-width:1280px){' +
        '#lab-nav .lab-nav-tab{padding:12px 6px!important;gap:3px!important}' +
      '}' +
      '.nav-hidden-tab{display:none!important}';
    document.head.appendChild(style);

    // Measure once the initial layout settles, then on every resize. #145:
    // as the viewport narrows, trailing tabs are pushed into the overflow
    // popover so nothing truncates or scrolls.
    setTimeout(updateOverflow, 0);
    window.addEventListener('resize', debounce(updateOverflow, 80));
  }

  // Hide trailing primary tabs when they don't fit, preserving the active
  // tab's visibility so the bar always shows where the user is. Hidden tabs
  // surface in the "+" popover alongside SECONDARY_TABS.
  function updateOverflow() {
    var tabWrap = document.getElementById('nav-tabs');
    if (!tabWrap) return;
    var tabs = Array.prototype.slice.call(tabWrap.querySelectorAll('.lab-nav-tab'));
    // Reset.
    tabs.forEach(function(el) { el.classList.remove('nav-hidden-tab'); });

    // Nothing to hide if everything already fits.
    if (tabWrap.scrollWidth <= tabWrap.clientWidth + 1) return;

    var active = getActiveTab();
    // Hide from the right, but always keep the currently active tab visible
    // — skip over it if it happens to be at the trailing position.
    for (var i = tabs.length - 1; i >= 0; i--) {
      if (tabs[i].dataset.label === active) continue;
      tabs[i].classList.add('nav-hidden-tab');
      if (tabWrap.scrollWidth <= tabWrap.clientWidth + 1) return;
    }
  }

  function debounce(fn, ms) {
    var t = null;
    return function() {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function toggleDesktopMorePopover() {
    var existing = document.getElementById('nav-desktop-more-popover');
    if (existing) { existing.remove(); return; }

    var active = getActiveTab();
    var tabWrap = document.getElementById('nav-tabs');
    var hiddenPrimary = [];
    if (tabWrap) {
      Array.prototype.forEach.call(tabWrap.querySelectorAll('.lab-nav-tab.nav-hidden-tab'), function(a) {
        var label = a.dataset.label;
        var tab = TABS.find(function(t) { return t.label === label; });
        if (tab) hiddenPrimary.push(tab);
      });
    }
    var allOverflow = hiddenPrimary.concat(SECONDARY_TABS);

    var anchor = document.getElementById('nav-desktop-more');
    var rect = anchor ? anchor.getBoundingClientRect() : { right: 24, bottom: 48 };

    var popover = document.createElement('div');
    popover.id = 'nav-desktop-more-popover';
    popover.style.cssText = 'position:fixed;top:' + rect.bottom + 'px;right:' + Math.max(8, (window.innerWidth - rect.right - 4)) + 'px;background:#fff;border-radius:10px;box-shadow:0 6px 28px rgba(0,0,0,.22);z-index:600;min-width:200px;padding:6px 0;font-family:Inter,-apple-system,sans-serif;';

    if (!allOverflow.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 16px;font-size:13px;color:#9e9e9e;font-style:italic';
      empty.textContent = 'No additional tabs.';
      popover.appendChild(empty);
    } else {
      allOverflow.forEach(function(t) {
        var isActive = t.label === active;
        var a = document.createElement('a');
        a.href = t.href;
        a.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 18px;text-decoration:none;color:' + (isActive ? '#00796b' : '#424242') + ';font-size:14px;font-weight:' + (isActive ? '600' : '400') + ';';
        a.innerHTML = '<span class="material-icons-outlined" style="font-size:20px;color:' + (isActive ? '#00796b' : '#757575') + '">' + t.icon + '</span>' + t.label;
        popover.appendChild(a);
      });
    }

    document.body.appendChild(popover);

    function close(e) {
      if (!popover.contains(e.target) && e.target !== anchor) {
        popover.remove();
        document.removeEventListener('click', close);
      }
    }
    setTimeout(function() { document.addEventListener('click', close); }, 0);
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
    // Mobile "More" includes every primary tab not in the bottom bar, plus
    // the always-overflow secondary tabs (Protocols, Waste).
    var overflowTabs = TABS.filter(function(t) { return !BOTTOM_TABS.includes(t.label); }).concat(SECONDARY_TABS);

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

    // R7 #25: removed redundant "Graph" link — it wasn't in the desktop nav
    // and duplicated the wiki graph tab. If we add a separate graph page
    // back, add it to TABS so it surfaces in both mobile and desktop.

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
      // R12 #42: avatar + login link to the profile page (gamification + stats).
      var profileHref = BASE + 'app/profile.html?user=' + encodeURIComponent(user.login);
      var loginEsc = window.Lab.escHtml ? window.Lab.escHtml(user.login) : user.login;
      area.innerHTML =
        '<a href="' + profileHref + '" id="nav-profile-link" title="View your profile" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">' +
          '<img src="' + user.avatar + '" style="width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.3);object-fit:cover">' +
          '<span class="hide-mobile" style="color:#fff;font-size:13px;font-weight:500;opacity:.9">' + loginEsc + '</span>' +
        '</a>' +
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
