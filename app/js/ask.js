/* Monroe Lab – Ask the Handbook (floating chat assistant)
   A chat bubble on every page. Questions are answered by a free-tier
   Google Gemini Flash model, grounded in the site's own data:
   Lab.search retrieves relevant pages, Lab.hierarchy supplies location
   chains, and the model composes a short answer citing [[slugs]] that
   render as the usual clickable object pills.

   The LLM never browses on its own — retrieval is deterministic and
   local (search-index.json / object-index.json), so a small free model
   is enough. API key: each member pastes a free Gemini key once
   (aistudio.google.com/apikey), stored in localStorage like the GitHub
   PAT. No key ever ships in the repo.
*/
(function() {
  'use strict';

  var KEY_STORE = 'gemini_api_key';
  var MODEL_STORE = 'gemini_model';
  var API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
  // Fallbacks only — setup picks the newest plain "gemini-N.N-flash" the
  // key's account serves (from ListModels). Google also 404s models that are
  // listed but closed to new users, naming the replacement in the error;
  // callGemini parses that and auto-switches (self-healing on deprecation).
  var PREFERRED_MODELS = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  var history = [];   // [{role: 'user'|'model', text}] — session only
  var busy = false;

  function esc(s) { return window.Lab && Lab.escHtml ? Lab.escHtml(s) : String(s); }

  // ── Retrieval: build grounded context for a question ──
  async function buildContext(question) {
    var hits = await Lab.search.query(question, { limit: 8 });
    var index = await Lab.gh.fetchObjectIndex();
    var byPath = {};
    index.forEach(function(e) { byPath[e.path.replace(/\.md$/, '')] = e; });

    var blocks = [];
    for (var i = 0; i < hits.length; i++) {
      var hit = hits[i];
      var slug = hit.path.replace(/\.md$/, '');
      var entry = byPath[slug] || {};
      var lines = ['SOURCE [[' + slug + ']] — "' + (hit.title || slug) + '" (type: ' + (entry.type || hit.type || 'page') + ')'];
      ['status', 'quantity', 'unit', 'location', 'cas', 'people', 'project', 'due', 'role', 'email', 'expiration', 'position'].forEach(function(k) {
        if (entry[k] != null && entry[k] !== '') lines.push('  ' + k + ': ' + entry[k]);
      });
      // Physical location chain (room > freezer > shelf > box)
      if (entry.parent) {
        try {
          var chain = await Lab.hierarchy.parentChain(slug);
          var g = await Lab.hierarchy.build();
          if (chain.length > 1) {
            lines.push('  located in: ' + chain.slice(0, -1).map(function(s) {
              return (g[s] && g[s].title) || s.split('/').pop();
            }).join(' > '));
          }
        } catch (e) { /* hierarchy optional */ }
      }
      if (hit.snippet) lines.push('  excerpt: ' + hit.snippet.replace(/<\/?mark>/g, '').replace(/&\w+;/g, ' '));
      blocks.push(lines.join('\n'));
    }
    return blocks.join('\n\n');
  }

  // ── Gemini call ──
  async function callGemini(question, context) {
    var key = localStorage.getItem(KEY_STORE);
    var model = localStorage.getItem(MODEL_STORE) || PREFERRED_MODELS[1];
    var instructions =
      'You are the Monroe Lab handbook assistant. Answer the lab member\'s question ' +
      'using ONLY the SOURCES below (extracted from the lab wiki: inventory, protocols, ' +
      'locations, people, projects). Rules:\n' +
      '- Be brief: 1-3 sentences for lookups. Answer the question directly first.\n' +
      '- Cite sources inline by writing their [[slug]] token exactly as given (double brackets). ' +
      'Cite every object you mention.\n' +
      '- For "where is X" questions, give the physical location chain from "located in".\n' +
      '- If the sources do not contain the answer, say you could not find it in the handbook ' +
      'and suggest what to search for instead. Never invent facts, quantities, or locations.\n';

    var convo = history.slice(-6).map(function(t) {
      return { role: t.role, parts: [{ text: t.text }] };
    });
    convo.push({
      role: 'user',
      parts: [{ text: instructions + '\nSOURCES:\n' + (context || '(no matching pages found)') + '\n\nQUESTION: ' + question }]
    });

    var body = JSON.stringify({ contents: convo, generationConfig: { temperature: 0.2, maxOutputTokens: 800 } });
    var resp = await fetch(API_BASE + '/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body
    });
    if (!resp.ok) {
      var errText = '';
      try { errText = (await resp.json()).error.message; } catch (e) {}
      // Deprecated-model 404s name the replacement ("update your code to use
      // models/gemini-X-flash") — switch to it and retry once.
      var repl = resp.status === 404 && errText.match(/use\s+models\/([\w.-]+)/i);
      if (repl && repl[1] !== model) {
        localStorage.setItem(MODEL_STORE, repl[1]);
        resp = await fetch(API_BASE + '/models/' + repl[1] + ':generateContent?key=' + encodeURIComponent(key), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body
        });
        if (!resp.ok) {
          try { errText = (await resp.json()).error.message; } catch (e2) {}
          throw new Error('Gemini API error ' + resp.status + (errText ? ': ' + errText : ''));
        }
      } else {
        throw new Error('Gemini API error ' + resp.status + (errText ? ': ' + errText : ''));
      }
    }
    var data = await resp.json();
    var parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    var text = (parts || []).map(function(p) { return p.text || ''; }).join('');
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  // ── Key setup: validate + pick a served flash model ──
  async function setupKey(key) {
    var resp = await fetch(API_BASE + '/models?key=' + encodeURIComponent(key));
    if (!resp.ok) throw new Error('Key rejected (HTTP ' + resp.status + '). Check it at aistudio.google.com/apikey');
    var data = await resp.json();
    var names = (data.models || []).map(function(m) { return (m.name || '').replace(/^models\//, ''); });
    // Prefer the NEWEST plain "gemini-N.N-flash" (older ones can be listed
    // yet closed to new users), then the static preference list.
    var versioned = names
      .map(function(n) { var m = n.match(/^gemini-(\d+(?:\.\d+)?)-flash$/); return m && { name: n, v: parseFloat(m[1]) }; })
      .filter(Boolean)
      .sort(function(a, b) { return b.v - a.v; });
    var model = versioned.length ? versioned[0].name : null;
    for (var i = 0; i < PREFERRED_MODELS.length && !model; i++) {
      if (names.indexOf(PREFERRED_MODELS[i]) >= 0) model = PREFERRED_MODELS[i];
    }
    if (!model) model = names.filter(function(n) { return /flash/.test(n) && !/lite|8b|image|tts|live|thinking/.test(n); })[0];
    if (!model) throw new Error('No Gemini Flash model available on this key');
    localStorage.setItem(KEY_STORE, key);
    localStorage.setItem(MODEL_STORE, model);
    return model;
  }

  // ── Rendering ──
  function renderAnswer(container, text) {
    // minimal markdown: bold + line breaks; then wikilinks → pills
    var html = esc(text)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function(m, target, label) {
        return '<a href="obj://' + esc(target) + '">' + esc(label || target.split('/').pop()) + '</a>';
      })
      .replace(/\n/g, '<br>');
    container.innerHTML = html;
    if (window.Lab.wikilinks && Lab.wikilinks.processRendered) {
      Lab.wikilinks.processRendered(container);
    }
  }

  // ── UI ──
  var panelEl = null;

  function fabHtml() {
    var btn = document.createElement('button');
    btn.id = 'ask-fab';
    btn.title = 'Ask the handbook';
    btn.innerHTML = '<span class="material-icons-outlined" style="font-size:22px">forum</span>';
    btn.style.cssText = 'position:fixed;right:24px;bottom:132px;z-index:9000;width:48px;height:48px;border-radius:50%;' +
      'background:#00796b;color:#fff;border:none;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.25);' +
      'display:flex;align-items:center;justify-content:center;';
    if (window.innerWidth < 768) { btn.style.bottom = '188px'; btn.style.right = '18px'; }
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
  }

  function togglePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; return; }
    panelEl = document.createElement('div');
    panelEl.id = 'ask-panel';
    var mobile = window.innerWidth < 768;
    panelEl.style.cssText = mobile
      ? 'position:fixed;left:8px;right:8px;bottom:70px;top:15%;z-index:9001;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;'
      : 'position:fixed;right:24px;bottom:190px;z-index:9001;width:390px;max-height:65vh;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;';
    panelEl.innerHTML =
      '<div style="background:#00796b;color:#fff;padding:10px 14px;display:flex;align-items:center;gap:8px;flex-shrink:0">' +
        '<span class="material-icons-outlined" style="font-size:18px">forum</span>' +
        '<b style="font-size:14px;flex:1">Ask the handbook</b>' +
        '<button id="ask-key-btn" title="API key settings" style="background:none;border:none;color:#fff;cursor:pointer;padding:2px"><span class="material-icons-outlined" style="font-size:17px">key</span></button>' +
        '<button id="ask-close" style="background:none;border:none;color:#fff;cursor:pointer;padding:2px"><span class="material-icons-outlined" style="font-size:18px">close</span></button>' +
      '</div>' +
      '<div id="ask-log" style="flex:1;overflow-y:auto;padding:12px;font-size:13.5px;line-height:1.45;min-height:120px"></div>' +
      '<div id="ask-inputrow" style="border-top:1px solid #e0e0e0;padding:8px;display:flex;gap:6px;flex-shrink:0">' +
        '<input id="ask-input" type="text" placeholder="e.g. where is the agarose?" autocomplete="off" ' +
          'style="flex:1;border:1px solid #cfd8dc;border-radius:8px;padding:8px 10px;font-size:13.5px;font-family:inherit">' +
        '<button id="ask-send" style="background:#00796b;color:#fff;border:none;border-radius:8px;padding:0 14px;cursor:pointer;font-weight:600">Ask</button>' +
      '</div>';
    document.body.appendChild(panelEl);
    panelEl.querySelector('#ask-close').addEventListener('click', togglePanel);
    panelEl.querySelector('#ask-key-btn').addEventListener('click', function() { showKeySetup(true); });
    var input = panelEl.querySelector('#ask-input');
    var send = function() {
      var q = input.value.trim();
      if (q) { input.value = ''; ask(q); }
    };
    panelEl.querySelector('#ask-send').addEventListener('click', send);
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });

    if (!localStorage.getItem(KEY_STORE)) showKeySetup(false);
    else {
      replayHistory();
      if (!history.length) addMsg('model', 'Hi! Ask me anything from the lab handbook: where things are, how much we have, protocols, people, projects.');
      input.focus();
    }
  }

  function showKeySetup(allowCancel) {
    var log = panelEl.querySelector('#ask-log');
    log.innerHTML =
      '<div style="padding:4px 2px;color:#37474f">' +
      '<b>One-time setup.</b> This assistant uses Google Gemini\'s free tier. ' +
      'Get a free API key (no credit card):<br>' +
      '1. Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:#00796b">aistudio.google.com/apikey</a><br>' +
      '2. Sign in with any Google account, click <b>Create API key</b><br>' +
      '3. Paste it here:<br>' +
      '<input id="ask-key-input" type="password" placeholder="AIza..." style="width:100%;box-sizing:border-box;margin:8px 0;border:1px solid #cfd8dc;border-radius:8px;padding:8px 10px;font-family:inherit">' +
      '<button id="ask-key-save" style="background:#00796b;color:#fff;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-weight:600">Save key</button> ' +
      (allowCancel ? '<button id="ask-key-cancel" style="background:none;border:1px solid #cfd8dc;border-radius:8px;padding:7px 14px;cursor:pointer">Cancel</button>' : '') +
      '<div id="ask-key-msg" style="margin-top:8px;font-size:12.5px;color:#c62828"></div>' +
      '</div>';
    var saveBtn = log.querySelector('#ask-key-save');
    saveBtn.addEventListener('click', async function() {
      var key = log.querySelector('#ask-key-input').value.trim();
      var msg = log.querySelector('#ask-key-msg');
      if (!key) return;
      saveBtn.disabled = true;
      msg.style.color = '#37474f';
      msg.textContent = 'Checking key…';
      try {
        var model = await setupKey(key);
        msg.style.color = '#2e7d32';
        msg.textContent = 'Key works! Using ' + model + '.';
        setTimeout(function() { log.innerHTML = ''; replayHistory(); addMsg('model', 'All set. Ask away!'); panelEl.querySelector('#ask-input').focus(); }, 700);
      } catch (err) {
        saveBtn.disabled = false;
        msg.style.color = '#c62828';
        msg.textContent = err.message;
      }
    });
    var cancel = log.querySelector('#ask-key-cancel');
    if (cancel) cancel.addEventListener('click', function() { log.innerHTML = ''; replayHistory(); });
  }

  function addMsg(role, text) {
    var log = panelEl && panelEl.querySelector('#ask-log');
    if (!log) return null;
    var div = document.createElement('div');
    div.style.cssText = role === 'user'
      ? 'background:#e0f2f1;border-radius:12px 12px 3px 12px;padding:7px 11px;margin:5px 0 5px 40px;color:#263238'
      : 'background:#f5f5f5;border-radius:12px 12px 12px 3px;padding:7px 11px;margin:5px 40px 5px 0;color:#263238';
    if (role === 'user') div.textContent = text; else renderAnswer(div, text);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function replayHistory() {
    history.forEach(function(t) { addMsg(t.role, t.text); });
  }

  async function ask(question) {
    if (busy) return;
    busy = true;
    addMsg('user', question);
    history.push({ role: 'user', text: question });
    var thinking = addMsg('model', '…');
    try {
      var context = await buildContext(question);
      var answer = await callGemini(question, context);
      history.push({ role: 'model', text: answer });
      renderAnswer(thinking, answer);
    } catch (err) {
      thinking.textContent = '⚠️ ' + err.message;
      console.error('ask failed:', err);
      // A 400/403 usually means a bad or revoked key — offer re-setup
      if (/40[03]/.test(err.message)) {
        var re = document.createElement('a');
        re.textContent = ' Update API key';
        re.href = '#';
        re.style.color = '#00796b';
        re.addEventListener('click', function(e) { e.preventDefault(); showKeySetup(true); });
        thinking.appendChild(re);
      }
    } finally {
      busy = false;
      var log = panelEl && panelEl.querySelector('#ask-log');
      if (log) log.scrollTop = log.scrollHeight;
    }
  }

  // ── Boot: only on gated app pages, after shared.js is up ──
  function boot() {
    if (!window.Lab || !Lab.search || !Lab.gh) return;
    if (document.getElementById('ask-fab')) return;
    fabHtml();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.Lab = window.Lab || {};
  window.Lab.ask = { open: togglePanel, _buildContext: buildContext };
})();
