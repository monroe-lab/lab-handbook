/* Shared GitHub OAuth (Web Flow) for Monroe Lab Handbook
   All apps (inventory, sample tracker, feedback) use this single login. */
(function () {
  var CLIENT_ID = "Ov23li7RlMB84qZM8Sky";
  // Cloudflare Worker URL for token exchange (keeps client_secret server-side)
  var TOKEN_PROXY = "https://lab-handbook-auth.greymonroe.workers.dev";
  var TOKEN_KEY = "gh_lab_token";
  var USER_KEY = "gh_lab_user";
  var SCOPE = "repo";
  var REDIRECT_URI = location.origin + location.pathname;

  /* expose globally so apps can use it */
  window.ghAuth = {
    getToken: function () { return localStorage.getItem(TOKEN_KEY) || ""; },
    getUser: function () { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } },
    isLoggedIn: function () { return !!localStorage.getItem(TOKEN_KEY); },
    logout: logout,
    login: startLogin,
    onLogin: null
  };

  /* ---- inject header UI ---- */
  var css = document.createElement("style");
  css.textContent = [
    "#gh-auth-bar{display:flex;align-items:center;gap:8px;font-size:13px;font-family:'Inter',-apple-system,sans-serif}",
    "#gh-auth-bar img{width:24px!important;height:24px!important;max-width:24px!important;max-height:24px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,.3)!important;object-fit:cover}",
    "#gh-auth-bar .gh-user{color:#fff;font-weight:500;opacity:.9}",
    "#gh-auth-bar button{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s}",
    "#gh-auth-bar button:hover{background:rgba(255,255,255,.25)}",
    "#gh-auth-bar .gh-logout{background:transparent;border:none;opacity:.6;font-size:11px;padding:4px 8px}",
    "#gh-auth-bar .gh-logout:hover{opacity:1}",
  ].join("\n");
  document.head.appendChild(css);

  /* ---- render auth state in header ---- */
  function renderAuthUI() {
    var existing = document.getElementById("gh-auth-bar");
    if (existing) existing.remove();

    var bar = document.createElement("div");
    bar.id = "gh-auth-bar";

    var user = window.ghAuth.getUser();
    if (window.ghAuth.isLoggedIn() && user) {
      bar.innerHTML =
        '<img src="' + user.avatar + '" alt="">' +
        '<span class="gh-user">' + user.login + '</span>' +
        '<button class="gh-logout" onclick="ghAuth.logout()">Sign out</button>';
    } else if (CLIENT_ID && TOKEN_PROXY) {
      bar.innerHTML = '<button onclick="ghAuth.login()">Sign in with GitHub</button>';
    } else if (CLIENT_ID && !TOKEN_PROXY) {
      bar.innerHTML = '<span style="color:rgba(255,255,255,.5);font-size:11px">Auth proxy not configured</span>';
    }

    var header = document.querySelector(".md-header__inner");
    if (header) {
      var spacer = header.querySelector(".md-header__title");
      if (spacer && spacer.nextSibling) {
        header.insertBefore(bar, spacer.nextSibling);
      } else {
        header.appendChild(bar);
      }
    }
  }

  /* ---- Web Application Flow ---- */
  function startLogin() {
    // Save current page so we can return after auth
    sessionStorage.setItem("gh_auth_return", location.href);

    // Generate random state for CSRF protection
    var state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("gh_auth_state", state);

    // Redirect to GitHub authorization
    var authUrl = "https://github.com/login/oauth/authorize" +
      "?client_id=" + CLIENT_ID +
      "&scope=" + SCOPE +
      "&state=" + state +
      "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);

    location.href = authUrl;
  }

  /* ---- Handle OAuth callback (code in URL) ---- */
  async function handleCallback() {
    var params = new URLSearchParams(location.search);
    var code = params.get("code");
    var state = params.get("state");

    if (!code) return;

    // Verify state to prevent CSRF
    var expectedState = sessionStorage.getItem("gh_auth_state");
    if (state !== expectedState) {
      console.error("OAuth state mismatch");
      cleanUrl();
      return;
    }
    sessionStorage.removeItem("gh_auth_state");

    try {
      // Exchange code for token via our Cloudflare Worker proxy
      var resp = await fetch(TOKEN_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, client_id: CLIENT_ID })
      });
      var data = await resp.json();

      if (data.access_token) {
        localStorage.setItem(TOKEN_KEY, data.access_token);

        // Fetch user info
        var userResp = await fetch("https://api.github.com/user", {
          headers: { "Authorization": "token " + data.access_token }
        });
        var userData = await userResp.json();
        localStorage.setItem(USER_KEY, JSON.stringify({
          login: userData.login,
          avatar: userData.avatar_url,
          name: userData.name || userData.login
        }));

        renderAuthUI();
        if (window.ghAuth.onLogin) window.ghAuth.onLogin();
      } else {
        console.error("OAuth token exchange failed", data);
      }
    } catch (e) {
      console.error("OAuth error", e);
    }

    // Clean URL and return to original page
    var returnUrl = sessionStorage.getItem("gh_auth_return");
    sessionStorage.removeItem("gh_auth_return");
    if (returnUrl && returnUrl !== location.href) {
      location.href = returnUrl;
    } else {
      cleanUrl();
    }
  }

  function cleanUrl() {
    var url = new URL(location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    history.replaceState(null, "", url.toString());
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    renderAuthUI();
    location.reload();
  }

  /* ---- init ---- */
  function init() {
    // Check if this is an OAuth callback
    if (location.search.includes("code=")) {
      handleCallback();
    }
    renderAuthUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  // Re-render on MkDocs instant navigation
  if (typeof document$ !== "undefined") {
    document$.subscribe(function () { setTimeout(renderAuthUI, 100); });
  }
})();
