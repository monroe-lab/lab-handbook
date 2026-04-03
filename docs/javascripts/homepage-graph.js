// Homepage knowledge graph and recent updates
// Uses object-index.json for the graph, GitHub API for recent updates

(function() {
  var INDEX_URL = 'https://monroe-lab.github.io/lab-handbook/object-index.json';
  var REPO = 'monroe-lab/lab-handbook';
  var COMMITS_URL = 'https://api.github.com/repos/' + REPO + '/commits?per_page=20&path=docs';

  // Type config: color, icon, label
  var TYPE_CONFIG = {
    reagent:    { color: '#009688', label: 'Reagent', group: 'resource' },
    buffer:     { color: '#e65100', label: 'Buffer', group: 'resource' },
    consumable: { color: '#1565c0', label: 'Consumable', group: 'resource' },
    equipment:  { color: '#6a1b9a', label: 'Equipment', group: 'resource' },
    kit:        { color: '#00838f', label: 'Kit', group: 'resource' },
    chemical:   { color: '#009688', label: 'Chemical', group: 'resource' },
    enzyme:     { color: '#2e7d32', label: 'Enzyme', group: 'resource' },
    solution:   { color: '#e65100', label: 'Solution', group: 'resource' },
    seed:       { color: '#558b2f', label: 'Seed', group: 'stock' },
    glycerol_stock: { color: '#4527a0', label: 'Glycerol Stock', group: 'stock' },
    plasmid:    { color: '#ad1457', label: 'Plasmid', group: 'stock' },
    person:     { color: '#1565c0', label: 'Person', group: 'people' },
    project:    { color: '#e65100', label: 'Project', group: 'project' },
    protocol:   { color: '#6a1b9a', label: 'Protocol', group: 'protocol' },
    notebook:   { color: '#795548', label: 'Notebook', group: 'notebook' },
  };

  // Group config for category nodes
  var GROUP_CONFIG = {
    resource: { color: '#009688', label: 'Resources', radius: 28 },
    protocol: { color: '#6a1b9a', label: 'Protocols', radius: 28 },
    stock:    { color: '#4caf50', label: 'Stocks', radius: 22 },
    people:   { color: '#1565c0', label: 'People', radius: 22 },
    project:  { color: '#e65100', label: 'Projects', radius: 22 },
    notebook: { color: '#795548', label: 'Notebooks', radius: 22 },
  };

  function getToken() { return localStorage.getItem('github-token') || ''; }

  // ── Graph ──
  function buildGraph(objects) {
    var container = document.getElementById('knowledgeGraph');
    if (!container) return;

    var width = container.clientWidth;
    var height = 420;

    // Build nodes: one per category group, sized by count
    var groupCounts = {};
    var groupItems = {};
    objects.forEach(function(obj) {
      var conf = TYPE_CONFIG[obj.type];
      var group = conf ? conf.group : 'resource';
      groupCounts[group] = (groupCounts[group] || 0) + 1;
      if (!groupItems[group]) groupItems[group] = [];
      groupItems[group].push(obj);
    });

    // Create category nodes
    var nodes = [];
    var nodeMap = {};
    Object.keys(GROUP_CONFIG).forEach(function(gk) {
      var count = groupCounts[gk] || 0;
      if (count === 0) return;
      var gc = GROUP_CONFIG[gk];
      nodes.push({
        id: gk,
        label: gc.label + ' (' + count + ')',
        color: gc.color,
        radius: Math.max(18, Math.min(45, Math.sqrt(count) * 6)),
        count: count,
        isGroup: true,
      });
      nodeMap[gk] = true;
    });

    // Add individual item nodes for protocols (they're the most interesting to see)
    // and any type with fewer than 15 items
    var individualTypes = ['protocol', 'people', 'project', 'stock', 'notebook'];
    individualTypes.forEach(function(gk) {
      var items = groupItems[gk] || [];
      items.forEach(function(obj) {
        var conf = TYPE_CONFIG[obj.type] || { color: '#616161', group: gk };
        var slug = obj.path.replace(/\.md$/, '').split('/').pop();
        nodes.push({
          id: slug,
          label: obj.title || slug,
          color: conf.color,
          radius: 8,
          isGroup: false,
          group: gk,
          path: obj.path,
        });
      });
    });

    // Build links: individual items connect to their group
    var links = [];
    nodes.forEach(function(n) {
      if (!n.isGroup && n.group && nodeMap[n.group]) {
        links.push({ source: n.group, target: n.id });
      }
    });

    // Also link groups to each other (protocols use resources, etc.)
    if (nodeMap['protocol'] && nodeMap['resource']) links.push({ source: 'protocol', target: 'resource', strong: true });
    if (nodeMap['protocol'] && nodeMap['people']) links.push({ source: 'protocol', target: 'people', strong: true });
    if (nodeMap['protocol'] && nodeMap['stock']) links.push({ source: 'protocol', target: 'stock', strong: true });
    if (nodeMap['project'] && nodeMap['protocol']) links.push({ source: 'project', target: 'protocol', strong: true });
    if (nodeMap['notebook'] && nodeMap['protocol']) links.push({ source: 'notebook', target: 'protocol', strong: true });

    // Render with canvas for performance
    var canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.cssText = 'width:100%;height:' + height + 'px;cursor:grab;';
    container.innerHTML = '';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Simple force simulation
    var sim = {
      nodes: nodes,
      links: links,
      alpha: 1,
      centerX: width / 2,
      centerY: height / 2,
    };

    // Initialize positions
    nodes.forEach(function(n, i) {
      if (n.isGroup) {
        var angle = (i / Object.keys(GROUP_CONFIG).length) * Math.PI * 2;
        var r = Math.min(width, height) * 0.22;
        n.x = sim.centerX + Math.cos(angle) * r;
        n.y = sim.centerY + Math.sin(angle) * r;
      } else {
        var parent = nodes.find(function(p) { return p.id === n.group; });
        if (parent) {
          n.x = parent.x + (Math.random() - 0.5) * 100;
          n.y = parent.y + (Math.random() - 0.5) * 100;
        } else {
          n.x = sim.centerX + (Math.random() - 0.5) * width * 0.6;
          n.y = sim.centerY + (Math.random() - 0.5) * height * 0.6;
        }
      }
      n.vx = 0;
      n.vy = 0;
    });

    function tick() {
      sim.alpha *= 0.98;
      if (sim.alpha < 0.001) { draw(); return; }

      // Center gravity
      nodes.forEach(function(n) {
        n.vx += (sim.centerX - n.x) * 0.001;
        n.vy += (sim.centerY - n.y) * 0.001;
      });

      // Link forces
      links.forEach(function(l) {
        var s = nodes.find(function(n) { return n.id === l.source; }) || l.source;
        var t = nodes.find(function(n) { return n.id === l.target; }) || l.target;
        if (!s.x || !t.x) return;
        var dx = t.x - s.x, dy = t.y - s.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var targetDist = l.strong ? 120 : 60;
        var force = (dist - targetDist) * 0.003 * sim.alpha;
        var fx = dx / dist * force, fy = dy / dist * force;
        s.vx += fx; s.vy += fy;
        t.vx -= fx; t.vy -= fy;
      });

      // Repulsion between all nodes
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = b.x - a.x, dy = b.y - a.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var minDist = (a.radius + b.radius) * 1.8;
          if (dist < minDist) {
            var force = (minDist - dist) * 0.05 * sim.alpha;
            var fx = dx / dist * force, fy = dy / dist * force;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
      }

      // Apply velocity
      nodes.forEach(function(n) {
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        // Bounds
        n.x = Math.max(n.radius + 5, Math.min(width - n.radius - 5, n.x));
        n.y = Math.max(n.radius + 5, Math.min(height - n.radius - 5, n.y));
      });

      draw();
      requestAnimationFrame(tick);
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw links
      links.forEach(function(l) {
        var s = nodes.find(function(n) { return n.id === l.source; });
        var t = nodes.find(function(n) { return n.id === l.target; });
        if (!s || !t) return;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = l.strong ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)';
        ctx.lineWidth = l.strong ? 1.5 : 0.5;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(function(n) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = n.isGroup ? 0.9 : 0.65;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Labels for group nodes
        if (n.isGroup) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px Inter, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.label, n.x, n.y);
        }
      });
    }

    // Hover tooltip
    var tooltip = document.createElement('div');
    tooltip.style.cssText = 'display:none;position:absolute;background:#333;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;pointer-events:none;z-index:10;white-space:nowrap;font-family:Inter,-apple-system,sans-serif;';
    container.style.position = 'relative';
    container.appendChild(tooltip);

    canvas.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (width / rect.width);
      var my = (e.clientY - rect.top) * (height / rect.height);
      var hit = null;
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        var dx = mx - n.x, dy = my - n.y;
        if (dx * dx + dy * dy < n.radius * n.radius) { hit = n; break; }
      }
      if (hit && !hit.isGroup) {
        tooltip.textContent = hit.label;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 24) + 'px';
        canvas.style.cursor = 'pointer';
      } else if (hit && hit.isGroup) {
        tooltip.textContent = hit.label;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 24) + 'px';
        canvas.style.cursor = 'pointer';
      } else {
        tooltip.style.display = 'none';
        canvas.style.cursor = 'grab';
      }
    });

    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (width / rect.width);
      var my = (e.clientY - rect.top) * (height / rect.height);
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        var dx = mx - n.x, dy = my - n.y;
        if (dx * dx + dy * dy < n.radius * n.radius) {
          if (n.path) {
            window.location.href = '/lab-handbook/' + n.path.replace(/\.md$/, '/');
          } else if (n.isGroup) {
            var urlMap = {
              resource: 'resources/', protocol: 'wet-lab/',
              stock: 'stocks/', people: 'people/',
              project: 'projects/', notebook: 'notebook-app/',
            };
            if (urlMap[n.id]) window.location.href = '/lab-handbook/' + urlMap[n.id];
          }
          break;
        }
      }
    });

    tick();
  }

  // ── Recent Updates ──
  function loadRecentUpdates() {
    var container = document.getElementById('recentUpdates');
    if (!container) return;

    var headers = { 'Accept': 'application/vnd.github.v3+json' };
    var token = getToken();
    if (token) headers['Authorization'] = 'token ' + token;

    fetch(COMMITS_URL, { headers: headers })
      .then(function(r) { return r.json(); })
      .then(function(commits) {
        if (!Array.isArray(commits) || commits.length === 0) {
          container.innerHTML = '<p style="color:#9e9e9e;font-size:14px;">No recent updates found.</p>';
          return;
        }

        // Deduplicate by message, take first 8
        var seen = {};
        var unique = [];
        commits.forEach(function(c) {
          var msg = c.commit.message.split('\n')[0];
          if (!seen[msg] && !msg.startsWith('Merge') && unique.length < 8) {
            seen[msg] = true;
            unique.push(c);
          }
        });

        var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
        unique.forEach(function(c) {
          var msg = c.commit.message.split('\n')[0];
          var date = new Date(c.commit.author.date);
          var ago = timeAgo(date);
          var author = c.commit.author.name || 'Unknown';
          var avatarUrl = c.author ? c.author.avatar_url : '';
          var commitUrl = c.html_url;

          html += '<a href="' + commitUrl + '" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;text-decoration:none;color:inherit;transition:background .15s;background:rgba(0,0,0,0.02);">';
          if (avatarUrl) {
            html += '<img src="' + avatarUrl + '" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;" />';
          } else {
            html += '<div style="width:28px;height:28px;border-radius:50%;background:#e0e0e0;flex-shrink:0;"></div>';
          }
          html += '<div style="flex:1;min-width:0;">';
          html += '<div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(msg) + '</div>';
          html += '<div style="font-size:12px;color:#9e9e9e;">' + escHtml(author) + ' &middot; ' + ago + '</div>';
          html += '</div></a>';
        });
        html += '</div>';
        container.innerHTML = html;
      })
      .catch(function() {
        container.innerHTML = '<p style="color:#9e9e9e;font-size:14px;">Could not load recent updates.</p>';
      });
  }

  function timeAgo(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    return date.toLocaleDateString();
  }

  function escHtml(s) {
    var el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
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
      { label: 'Protocols', count: counts.protocol || 0, icon: 'menu_book', color: '#6a1b9a', href: '/lab-handbook/wet-lab/' },
      { label: 'Resources', count: counts.resource || 0, icon: 'science', color: '#009688', href: '/lab-handbook/resources/' },
      { label: 'Stocks', count: counts.stock || 0, icon: 'eco', color: '#4caf50', href: '/lab-handbook/stocks/' },
      { label: 'People', count: counts.people || 0, icon: 'person', color: '#1565c0', href: '/lab-handbook/people/' },
      { label: 'Projects', count: counts.project || 0, icon: 'folder_special', color: '#e65100', href: '/lab-handbook/projects/' },
      { label: 'Notebooks', count: counts.notebook || 0, icon: 'auto_stories', color: '#795548', href: '/lab-handbook/notebook-app/' },
    ];

    var html = '';
    stats.forEach(function(s) {
      html += '<a href="' + s.href + '" style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;text-decoration:none;color:inherit;background:rgba(0,0,0,0.03);transition:background .15s;flex:1;min-width:120px;">';
      html += '<span class="material-icons-outlined" style="color:' + s.color + ';font-size:22px;">' + s.icon + '</span>';
      html += '<div><div style="font-size:20px;font-weight:700;color:' + s.color + ';">' + s.count + '</div>';
      html += '<div style="font-size:12px;color:#757575;">' + s.label + '</div></div></a>';
    });
    el.innerHTML = html;
  }

  // ── Init ──
  function init() {
    // Load the graph only on the homepage
    if (!document.getElementById('knowledgeGraph')) return;

    fetch(INDEX_URL)
      .then(function(r) { return r.json(); })
      .then(function(objects) {
        buildGraph(objects);
        loadStats(objects);
      })
      .catch(function() {
        // Fallback: try GitHub API
        var headers = { 'Accept': 'application/vnd.github.v3+json' };
        var token = getToken();
        if (token) headers['Authorization'] = 'token ' + token;
        fetch('https://api.github.com/repos/' + REPO + '/contents/docs/object-index.json', { headers: headers })
          .then(function(r) { return r.json(); })
          .then(function(json) {
            var objects = JSON.parse(atob(json.content));
            buildGraph(objects);
            loadStats(objects);
          });
      });

    loadRecentUpdates();

    // Handle resize
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        fetch(INDEX_URL).then(function(r) { return r.json(); }).then(buildGraph);
      }, 300);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // MkDocs instant navigation
  if (typeof document$ !== 'undefined') {
    document$.subscribe(init);
  }
})();
