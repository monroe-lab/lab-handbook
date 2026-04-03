/* Shared GitHub OAuth (Device Flow) for Monroe Lab Handbook
   All apps (inventory, sample tracker, feedback) use this single login. */
(function () {
  // ---- CONFIGURE: set your GitHub OAuth App client_id here ----
  var CLIENT_ID = "";  // Grey: create OAuth App at github.com/settings/developers, enable Device Flow
  var TOKEN_KEY = "gh_lab_token";
  var USER_KEY = "gh_lab_user";
  var SCOPE = "repo";

  /* expose globally so apps can use it */
  window.ghAuth = {
    getToken: function () { return localStorage.getItem(TOKEN_KEY) || ""; },
    getUser: function () { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } },
    isLoggedIn: function () { return !!localStorage.getItem(TOKEN_KEY); },
    logout: logout,
    login: startDeviceFlow,
    onLogin: null  // apps can set this callback
  };

  /* ---- inject header UI ---- */
  var css = document.createElement("style");
  css.textContent = [
    "#gh-auth-bar{display:flex;align-items:center;gap:8px;font-size:13px;font-family:'Inter',-apple-system,sans-serif}",
    "#gh-auth-bar img{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.3)}",
    "#gh-auth-bar .gh-user{color:#fff;font-weight:500;opacity:.9}",
    "#gh-auth-bar button{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s}",
    "#gh-auth-bar button:hover{background:rgba(255,255,255,.25)}",
    "#gh-auth-bar .gh-logout{background:transparent;border:none;opacity:.6;font-size:11px;padding:4px 8px}",
    "#gh-auth-bar .gh-logout:hover{opacity:1}",
    /* device flow modal */
    "#gh-device-modal{display:none;position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.6);align-items:center;justify-content:center}",
    "#gh-device-modal.open{display:flex}",
    "#gh-device-box{background:#fff;border-radius:12px;padding:2rem;max-width:400px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.3);font-family:'Inter',-apple-system,sans-serif}",
    "[data-md-color-scheme=slate] #gh-device-box{background:#2e2e2e;color:#e0e0e0}",
    "#gh-device-box h3{margin:0 0 .5rem;font-size:1.2rem}",
    "#gh-device-box .gh-code{font-size:2rem;font-weight:700;letter-spacing:.15em;color:#009688;margin:1rem 0;font-family:'Courier New',monospace}",
    "#gh-device-box p{color:#666;font-size:.9rem;margin:.5rem 0}",
    "[data-md-color-scheme=slate] #gh-device-box p{color:#aaa}",
    "#gh-device-box a{color:#009688;font-weight:600}",
    "#gh-device-box .gh-spinner{display:inline-block;width:16px;height:16px;border:2px solid #e0e0e0;border-top-color:#009688;border-radius:50%;animation:gh-spin .8s linear infinite;vertical-align:middle;margin-right:6px}",
    "@keyframes gh-spin{to{transform:rotate(360deg)}}",
    "#gh-device-box .gh-cancel{background:transparent;color:#616161;border:1px solid #e0e0e0;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-family:inherit;margin-top:1rem}",
  ].join("\n");
  document.head.appendChild(css);

  /* device flow modal */
  var modal = document.createElement("div");
  modal.id = "gh-device-modal";
  modal.innerHTML =
    '<div id="gh-device-box">' +
    '<h3>Sign in with GitHub</h3>' +
    '<p>Enter this code at:</p>' +
    '<p><a id="gh-verify-link" href="https://github.com/login/device" target="_blank">github.com/login/device</a></p>' +
    '<div class="gh-code" id="gh-user-code">----</div>' +
    '<p id="gh-poll-status"><span class="gh-spinner"></span> Waiting for authorization...</p>' +
    '<button class="gh-cancel" id="gh-cancel-flow">Cancel</button>' +
    '</div>';
  document.body.appendChild(modal);

  document.getElementById("gh-cancel-flow").addEventListener("click", function () {
    modal.classList.remove("open");
    pollAbort = true;
  });

  var pollAbort = false;

  /* ---- render auth state in header ---- */
  function renderAuthUI() {
    // Wait for MkDocs Material header to load
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
    } else if (CLIENT_ID) {
      bar.innerHTML = '<button onclick="ghAuth.login()">Sign in with GitHub</button>';
    } else {
      bar.innerHTML = '<span style="color:rgba(255,255,255,.5);font-size:11px">Auth not configured</span>';
    }

    // Insert into Material header
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

  /* ---- Device Flow ---- */
  async function startDeviceFlow() {
    if (!CLIENT_ID) {
      alert("GitHub OAuth not configured. Ask Grey to set up the OAuth App and add the client_id to github-auth.js.");
      return;
    }

    pollAbort = false;

    // Step 1: Request device code
    var resp = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, scope: SCOPE })
    });
    var data = await resp.json();

    if (!data.user_code) {
      alert("Failed to start login flow. Check OAuth App configuration.");
      return;
    }

    // Step 2: Show code to user
    document.getElementById("gh-user-code").textContent = data.user_code;
    document.getElementById("gh-verify-link").href = data.verification_uri;
    document.getElementById("gh-poll-status").innerHTML = '<span class="gh-spinner"></span> Waiting for authorization...';
    modal.classList.add("open");

    // Copy code to clipboard
    try { await navigator.clipboard.writeText(data.user_code); } catch (e) { /* fine */ }

    // Step 3: Poll for token
    var interval = (data.interval || 5) * 1000;
    var expires = Date.now() + (data.expires_in || 900) * 1000;

    while (Date.now() < expires && !pollAbort) {
      await new Promise(function (r) { setTimeout(r, interval); });
      if (pollAbort) break;

      try {
        var tokenResp = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code: data.device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code"
          })
        });
        var tokenData = await tokenResp.json();

        if (tokenData.access_token) {
          localStorage.setItem(TOKEN_KEY, tokenData.access_token);

          // Fetch user info
          var userResp = await fetch("https://api.github.com/user", {
            headers: { "Authorization": "token " + tokenData.access_token }
          });
          var userData = await userResp.json();
          localStorage.setItem(USER_KEY, JSON.stringify({
            login: userData.login,
            avatar: userData.avatar_url,
            name: userData.name || userData.login
          }));

          modal.classList.remove("open");
          renderAuthUI();
          if (window.ghAuth.onLogin) window.ghAuth.onLogin();
          return;
        }

        if (tokenData.error === "slow_down") {
          interval += 5000;
        }
        // "authorization_pending" is normal, keep polling
      } catch (e) {
        // network error, keep trying
      }
    }

    // Timed out or cancelled
    modal.classList.remove("open");
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    renderAuthUI();
    // Reload so apps pick up the logged-out state
    location.reload();
  }

  /* ---- init ---- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAuthUI);
  } else {
    renderAuthUI();
  }
  // Also re-render on MkDocs instant navigation
  if (typeof document$ !== "undefined") {
    document$.subscribe(function () { setTimeout(renderAuthUI, 100); });
  }
})();
