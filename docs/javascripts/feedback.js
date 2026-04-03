/* Floating feedback widget — appends entries to docs/feedback.json via GitHub API */
(function () {
  // Prevent duplicate initialization from MkDocs instant navigation
  if (window._fbWidgetLoaded) return;
  window._fbWidgetLoaded = true;

  var REPO = "monroe-lab/lab-handbook";
  var FILE = "docs/feedback.json";
  var BRANCH = "main";

  /* ---- helpers ---- */
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function getToken() { return (window.ghAuth && window.ghAuth.getToken()) || ""; }

  /* ---- inject CSS ---- */
  var css = document.createElement("style");
  css.textContent = [
    "#fb-btn{position:fixed;bottom:24px;right:24px;z-index:9990;width:48px;height:48px;border-radius:50%;background:#009688;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .15s,background .15s;font-size:0}",
    "#fb-btn:hover{background:#00796b;transform:scale(1.08)}",
    "#fb-btn svg{width:24px;height:24px;fill:currentColor}",
    "#fb-overlay{display:none;position:fixed;inset:0;z-index:9991;background:rgba(0,0,0,.4)}",
    "#fb-panel{position:fixed;bottom:84px;right:24px;z-index:9992;width:340px;max-width:calc(100vw - 48px);background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:none;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#212121;overflow:hidden}",
    "[data-md-color-scheme=slate] #fb-panel{background:#2e2e2e;color:#e0e0e0}",
    "#fb-panel-hdr{background:#009688;color:#fff;padding:14px 18px;font-weight:600;font-size:14px;display:flex;align-items:center;gap:8px}",
    "#fb-panel-body{padding:16px 18px}",
    "#fb-panel label{font-size:12px;font-weight:600;display:block;margin:0 0 4px;color:#616161}",
    "[data-md-color-scheme=slate] #fb-panel label{color:#aaa}",
    "#fb-panel input,#fb-panel textarea{width:100%;padding:8px 10px;border:1.5px solid #e0e0e0;border-radius:6px;font-family:inherit;font-size:13px;box-sizing:border-box;background:inherit;color:inherit;margin-bottom:12px}",
    "#fb-panel textarea{min-height:90px;resize:vertical}",
    "#fb-panel input:focus,#fb-panel textarea:focus{outline:none;border-color:#009688}",
    "#fb-panel .fb-actions{display:flex;gap:8px;justify-content:flex-end}",
    "#fb-panel .fb-submit{background:#009688;color:#fff;border:none;border-radius:6px;padding:8px 18px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit}",
    "#fb-panel .fb-submit:hover{background:#00796b}",
    "#fb-panel .fb-submit:disabled{opacity:.5;cursor:default}",
    "#fb-panel .fb-cancel{background:transparent;color:#616161;border:1px solid #e0e0e0;border-radius:6px;padding:8px 14px;font-size:13px;cursor:pointer;font-family:inherit}",
    "#fb-toast{position:fixed;bottom:84px;right:24px;z-index:9993;background:#2e7d32;color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:500;font-family:'Inter',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.2);display:none;animation:fb-fade .3s}",
    "#fb-toast.err{background:#c62828}",
    "@keyframes fb-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
  ].join("\n");
  document.head.appendChild(css);

  /* ---- build DOM ---- */
  // FAB button
  var btn = document.createElement("button");
  btn.id = "fb-btn";
  btn.title = "Send feedback";
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
  document.body.appendChild(btn);

  // overlay
  var overlay = document.createElement("div");
  overlay.id = "fb-overlay";
  document.body.appendChild(overlay);

  // panel
  var panel = document.createElement("div");
  panel.id = "fb-panel";
  panel.innerHTML =
    '<div id="fb-panel-hdr"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> Feedback</div>' +
    '<div id="fb-panel-body">' +
    '<label for="fb-name">Name (optional)</label>' +
    '<input id="fb-name" placeholder="Anonymous" autocomplete="off">' +
    '<label for="fb-type">Type</label>' +
    '<select id="fb-type" style="width:100%;padding:8px 10px;border:1.5px solid #e0e0e0;border-radius:6px;font-size:13px;margin-bottom:12px;background:inherit;color:inherit;font-family:inherit">' +
    '<option value="feedback">General Feedback</option>' +
    '<option value="bug">Bug / Issue</option>' +
    '<option value="request">Feature Request</option>' +
    '<option value="improvement">Improvement</option>' +
    '<option value="question">Question</option>' +
    '</select>' +
    '<label for="fb-comment">Comment</label>' +
    '<textarea id="fb-comment" placeholder="What\'s on your mind?"></textarea>' +
    '<div class="fb-actions">' +
    '<button class="fb-cancel" id="fb-cancel">Cancel</button>' +
    '<button class="fb-submit" id="fb-submit">Submit</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(panel);

  // toast
  var toast = document.createElement("div");
  toast.id = "fb-toast";
  document.body.appendChild(toast);

  /* ---- open / close ---- */
  var open = false;
  function toggle() {
    open = !open;
    panel.style.display = open ? "block" : "none";
    overlay.style.display = open ? "block" : "none";
    if (open) document.getElementById("fb-comment").focus();
  }
  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", toggle);
  document.getElementById("fb-cancel").addEventListener("click", toggle);

  function showToast(msg, isErr) {
    toast.textContent = msg;
    toast.className = isErr ? "err" : "";
    toast.style.display = "block";
    setTimeout(function () { toast.style.display = "none"; }, 3000);
  }

  /* ---- submit ---- */
  document.getElementById("fb-submit").addEventListener("click", async function () {
    var comment = document.getElementById("fb-comment").value.trim();
    if (!comment) { showToast("Please enter a comment.", true); return; }

    var entry = {
      name: document.getElementById("fb-name").value.trim() || "Anonymous",
      type: document.getElementById("fb-type").value,
      page: location.pathname.replace(/\/lab-handbook\/?/, "/").replace(/\/$/, "") || "/",
      date: new Date().toISOString(),
      comment: comment
    };

    var submitBtn = document.getElementById("fb-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      var token = getToken();
      if (!token) {
        // No token — fall back to localStorage queue
        var queue = JSON.parse(localStorage.getItem("fb_queue") || "[]");
        queue.push(entry);
        localStorage.setItem("fb_queue", JSON.stringify(queue));
        showToast("Saved locally (no GitHub token). Ask Grey to sync.");
        toggle();
        return;
      }

      // Fetch existing feedback.json
      var headers = { "Authorization": "token " + token, "Accept": "application/vnd.github.v3+json" };
      var resp = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + FILE + "?ref=" + BRANCH, { headers: headers });

      var feedback, sha;
      if (resp.ok) {
        var data = await resp.json();
        sha = data.sha;
        feedback = JSON.parse(atob(data.content.replace(/\n/g, "")));
      } else if (resp.status === 404) {
        feedback = [];
        sha = null;
      } else {
        throw new Error("GitHub API error: " + resp.status);
      }

      feedback.push(entry);

      var body = {
        message: "Feedback: " + entry.type + " from " + entry.name + " on " + entry.page,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(feedback, null, 2)))),
        branch: BRANCH
      };
      if (sha) body.sha = sha;

      var putResp = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + FILE, {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: JSON.stringify(body)
      });

      if (!putResp.ok) throw new Error("Commit failed: " + putResp.status);

      showToast("Thanks! Feedback submitted.");
      toggle();
      document.getElementById("fb-comment").value = "";
      document.getElementById("fb-name").value = "";
      document.getElementById("fb-type").value = "feedback";

    } catch (err) {
      // Fallback to localStorage
      var queue = JSON.parse(localStorage.getItem("fb_queue") || "[]");
      queue.push(entry);
      localStorage.setItem("fb_queue", JSON.stringify(queue));
      showToast("Saved locally. (" + err.message + ")", true);
      toggle();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
})();
