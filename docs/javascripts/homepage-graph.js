// Homepage dashboard: graph, alerts, recent updates, bulletin
(function() {
  var INDEX_URL = 'https://monroe-lab.github.io/lab-handbook/object-index.json';
  var REPO = 'monroe-lab/lab-handbook';
  var COMMITS_URL = 'https://api.github.com/repos/' + REPO + '/commits?per_page=15&path=docs';
  var BULLETIN_URL = 'https://api.github.com/repos/' + REPO + '/contents/docs/bulletin.md';
  var BASE = '/lab-handbook/';

  var TYPE_CONFIG = {
    reagent: { color: '#009688', group: 'resource' }, buffer: { color: '#e65100', group: 'resource' },
    consumable: { color: '#1565c0', group: 'resource' }, equipment: { color: '#455a64', group: 'resource' },
    kit: { color: '#00838f', group: 'resource' }, chemical: { color: '#009688', group: 'resource' },
    enzyme: { color: '#2e7d32', group: 'resource' }, solution: { color: '#e65100', group: 'resource' },
    seed: { color: '#558b2f', group: 'stock' }, glycerol_stock: { color: '#4527a0', group: 'stock' },
    plasmid: { color: '#ad1457', group: 'stock' }, person: { color: '#1565c0', group: 'people' },
    project: { color: '#e65100', group: 'project' }, protocol: { color: '#6a1b9a', group: 'protocol' },
    notebook: { color: '#795548', group: 'notebook' },
  };

  var GROUP_CONFIG = {
    resource: { color: '#009688', label: 'Resources' },
    protocol: { color: '#6a1b9a', label: 'Protocols' },
    stock: { color: '#4caf50', label: 'Stocks' },
    people: { color: '#1565c0', label: 'People' },
    project: { color: '#e65100', label: 'Projects' },
    notebook: { color: '#795548', label: 'Notebooks' },
  };

  function getToken() { return localStorage.getItem('gh_lab_token') || localStorage.getItem('github-token') || ''; }
  function authHeaders() {
    var h = { 'Accept': 'application/vnd.github.v3+json' };
    var t = getToken();
    if (t) h['Authorization'] = 'token ' + t;
    return h;
  }
  function escHtml(s) { var el = document.createElement('span'); el.textContent = s; return el.innerHTML; }
  function timeAgo(date) {
    var s = Math.floor((new Date() - date) / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24); if (d < 30) return d + 'd ago';
    return date.toLocaleDateString();
  }

  // ── Stats ──
  function loadStats(objects) {
    var el = document.getElementById('graphStats');
    if (!el) return;
    var counts = {};
    objects.forEach(function(obj) {
      var conf = TYPE_CONFIG[obj.type];
      var group = conf ? conf.group : 'other';
      counts[group] = (counts[group] || 0) + 1;
    });
    var stats = [
      { label: 'Protocols', count: counts.protocol || 0, icon: 'menu_book', color: '#6a1b9a', href: BASE + 'wet-lab/' },
      { label: 'Resources', count: counts.resource || 0, icon: 'science', color: '#009688', href: BASE + 'resources/' },
      { label: 'Stocks', count: counts.stock || 0, icon: 'eco', color: '#4caf50', href: BASE + 'stocks/' },
      { label: 'People', count: counts.people || 0, icon: 'person', color: '#1565c0', href: BASE + 'people/' },
      { label: 'Projects', count: counts.project || 0, icon: 'folder_special', color: '#e65100', href: BASE + 'projects/' },
      { label: 'Notebooks', count: counts.notebook || 0, icon: 'auto_stories', color: '#795548', href: BASE + 'notebook-app/' },
    ];
    el.innerHTML = stats.map(function(s) {
      return '<a href="' + s.href + '" style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;text-decoration:none;color:inherit;background:rgba(0,0,0,0.03);transition:background .15s;flex:1;min-width:100px;">' +
        '<span class="material-icons-outlined" style="color:' + s.color + ';font-size:20px;">' + s.icon + '</span>' +
        '<div><div style="font-size:18px;font-weight:700;color:' + s.color + ';">' + s.count + '</div>' +
        '<div style="font-size:11px;color:#757575;">' + s.label + '</div></div></a>';
    }).join('');
  }

  // ── Alerts (low stock) ──
  function loadAlerts(objects) {
    var el = document.getElementById('alertsPanel');
    if (!el) return;
    var lowStock = objects.filter(function(obj) {
      return obj.low_stock_threshold && obj.quantity != null && obj.quantity <= obj.low_stock_threshold;
    });
    if (!lowStock.length) {
      el.innerHTML = '<div style="color:#43a047;display:flex;align-items:center;gap:6px;"><span class="material-icons-outlined" style="font-size:16px;">check_circle</span> All stock levels OK</div>';
      return;
    }
    el.innerHTML = lowStock.map(function(obj) {
      var slug = obj.path.replace(/\.md$/, '').split('/').pop();
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
        '<span class="material-icons-outlined" style="font-size:16px;color:#e65100;">warning</span>' +
        '<a href="' + BASE + 'resources/' + slug + '/" style="color:inherit;text-decoration:none;font-weight:500;">' + escHtml(obj.title) + '</a>' +
        '<span style="color:#e65100;font-size:12px;margin-left:auto;">' + obj.quantity + ' ' + (obj.unit || '') + '</span>' +
        '</div>';
    }).join('');
  }

  // ── Recent Updates ──
  function loadRecentUpdates() {
    var el = document.getElementById('recentUpdates');
    if (!el) return;
    fetch(COMMITS_URL, { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(commits) {
        if (!Array.isArray(commits) || !commits.length) {
          el.innerHTML = '<div style="color:#9e9e9e;">No recent updates.</div>';
          return;
        }
        var seen = {}, unique = [];
        commits.forEach(function(c) {
          var msg = c.commit.message.split('\n')[0];
          if (!seen[msg] && !msg.startsWith('Merge') && unique.length < 6) {
            seen[msg] = true; unique.push(c);
          }
        });
        el.innerHTML = unique.map(function(c) {
          var msg = c.commit.message.split('\n')[0];
          if (msg.length > 60) msg = msg.substring(0, 57) + '...';
          var date = new Date(c.commit.author.date);
          var author = c.commit.author.name || 'Unknown';
          return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">' +
            (c.author ? '<img src="' + c.author.avatar_url + '" style="width:22px;height:22px;border-radius:50%;">' : '<span class="material-icons-outlined" style="font-size:22px;color:#bdbdbd;">account_circle</span>') +
            '<div style="flex:1;min-width:0;"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">' + escHtml(msg) + '</div>' +
            '<div style="font-size:11px;color:#9e9e9e;">' + escHtml(author) + ' · ' + timeAgo(date) + '</div></div></div>';
        }).join('');
      })
      .catch(function() { el.innerHTML = '<div style="color:#9e9e9e;">Could not load updates.</div>'; });
  }

  // ── Bulletin ──
  function loadBulletin() {
    var el = document.getElementById('bulletinContent');
    if (!el) return;
    fetch(BULLETIN_URL, { headers: authHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.content) { el.innerHTML = 'No bulletin posted.'; return; }
        var md = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        // Strip frontmatter
        md = md.replace(/^---[\s\S]*?---\s*/, '');
        // Simple markdown rendering
        var html = md
          .replace(/^## (.+)$/gm, '<h4 style="margin:12px 0 6px;font-size:13px;font-weight:700;color:var(--md-default-fg-color,#212121);">$1</h4>')
          .replace(/^- \[x\] (.+)$/gm, '<div style="padding:2px 0;"><span style="color:#43a047;">&#10003;</span> <s style="color:#9e9e9e;">$1</s></div>')
          .replace(/^- \[ \] (.+)$/gm, '<div style="padding:2px 0;"><span style="color:#e65100;">&#9679;</span> $1</div>')
          .replace(/^- (.+)$/gm, '<div style="padding:2px 0;">$1</div>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/_(.+?)_/g, '<em>$1</em>');
        el.innerHTML = html;
      })
      .catch(function() { el.innerHTML = 'Could not load bulletin.'; });
  }

  // ── Graph (compact) ──
  function buildGraph(objects) {
    var container = document.getElementById('knowledgeGraph');
    if (!container) return;
    var width = container.clientWidth || 400;
    var height = 280;

    var groupCounts = {};
    objects.forEach(function(obj) {
      var conf = TYPE_CONFIG[obj.type];
      var group = conf ? conf.group : 'resource';
      groupCounts[group] = (groupCounts[group] || 0) + 1;
    });

    var nodes = [];
    Object.keys(GROUP_CONFIG).forEach(function(gk) {
      var count = groupCounts[gk] || 0;
      if (count === 0) return;
      var gc = GROUP_CONFIG[gk];
      nodes.push({
        id: gk, label: gc.label + ' (' + count + ')',
        color: gc.color,
        radius: Math.max(16, Math.min(40, Math.sqrt(count) * 5)),
        count: count,
      });
    });

    var links = [];
    var ids = nodes.map(function(n) { return n.id; });
    if (ids.indexOf('protocol') >= 0 && ids.indexOf('resource') >= 0) links.push({ source: 'protocol', target: 'resource' });
    if (ids.indexOf('protocol') >= 0 && ids.indexOf('people') >= 0) links.push({ source: 'protocol', target: 'people' });
    if (ids.indexOf('protocol') >= 0 && ids.indexOf('stock') >= 0) links.push({ source: 'protocol', target: 'stock' });
    if (ids.indexOf('project') >= 0 && ids.indexOf('protocol') >= 0) links.push({ source: 'project', target: 'protocol' });
    if (ids.indexOf('notebook') >= 0 && ids.indexOf('protocol') >= 0) links.push({ source: 'notebook', target: 'protocol' });

    var canvas = document.createElement('canvas');
    canvas.width = width * 2; canvas.height = height * 2;
    canvas.style.cssText = 'width:100%;height:' + height + 'px;cursor:pointer;';
    container.innerHTML = '';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    var cx = width / 2, cy = height / 2;
    nodes.forEach(function(n, i) {
      var angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      var r = Math.min(width, height) * 0.28;
      n.x = cx + Math.cos(angle) * r;
      n.y = cy + Math.sin(angle) * r;
      n.vx = 0; n.vy = 0;
    });

    var alpha = 1;
    function tick() {
      alpha *= 0.97;
      if (alpha < 0.002) { draw(); return; }
      nodes.forEach(function(n) { n.vx += (cx - n.x) * 0.002; n.vy += (cy - n.y) * 0.002; });
      links.forEach(function(l) {
        var s = nodes.find(function(n) { return n.id === l.source; });
        var t = nodes.find(function(n) { return n.id === l.target; });
        if (!s || !t) return;
        var dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx*dx+dy*dy) || 1;
        var f = (dist - 100) * 0.003 * alpha;
        s.vx += dx/dist*f; s.vy += dy/dist*f;
        t.vx -= dx/dist*f; t.vy -= dy/dist*f;
      });
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i+1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = b.x-a.x, dy = b.y-a.y, dist = Math.sqrt(dx*dx+dy*dy) || 1;
          var min = (a.radius+b.radius) * 2;
          if (dist < min) {
            var f = (min-dist) * 0.05 * alpha;
            a.vx -= dx/dist*f; a.vy -= dy/dist*f;
            b.vx += dx/dist*f; b.vy += dy/dist*f;
          }
        }
      }
      nodes.forEach(function(n) {
        n.vx *= 0.85; n.vy *= 0.85;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(n.radius+5, Math.min(width-n.radius-5, n.x));
        n.y = Math.max(n.radius+5, Math.min(height-n.radius-5, n.y));
      });
      draw();
      requestAnimationFrame(tick);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      links.forEach(function(l) {
        var s = nodes.find(function(n) { return n.id === l.source; });
        var t = nodes.find(function(n) { return n.id === l.target; });
        if (!s || !t) return;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = 'rgba(128,128,128,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();
      });
      nodes.forEach(function(n) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2);
        ctx.fillStyle = n.color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + Math.max(9, Math.min(11, n.radius * 0.5)) + 'px Inter,-apple-system,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, n.y);
      });
    }

    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = (e.clientX-rect.left)*(width/rect.width), my = (e.clientY-rect.top)*(height/rect.height);
      for (var i = nodes.length-1; i >= 0; i--) {
        var n = nodes[i], dx = mx-n.x, dy = my-n.y;
        if (dx*dx+dy*dy < n.radius*n.radius) {
          var map = { resource: 'resources/', protocol: 'wet-lab/', stock: 'stocks/', people: 'people/', project: 'projects/', notebook: 'notebook-app/' };
          if (map[n.id]) window.location.href = BASE + map[n.id];
          break;
        }
      }
    });

    tick();
  }

  // ── Init ──
  function init() {
    if (!document.getElementById('knowledgeGraph') && !document.getElementById('graphStats')) return;
    fetch(INDEX_URL)
      .then(function(r) { return r.json(); })
      .then(function(objects) {
        buildGraph(objects);
        loadStats(objects);
        loadAlerts(objects);
      })
      .catch(function() {
        fetch('https://api.github.com/repos/' + REPO + '/contents/docs/object-index.json', { headers: authHeaders() })
          .then(function(r) { return r.json(); })
          .then(function(json) {
            var objects = JSON.parse(atob(json.content));
            buildGraph(objects); loadStats(objects); loadAlerts(objects);
          });
      });
    loadRecentUpdates();
    loadBulletin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
  if (typeof document$ !== 'undefined') { document$.subscribe(init); }
})();
