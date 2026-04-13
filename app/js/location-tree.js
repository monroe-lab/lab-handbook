/* Monroe Lab — Location hierarchy tree component (R6)
 *
 * Reusable tree renderer for location hierarchies. Powers both:
 *   1. The full lab-map page (`app/lab-map.html`) — actions, edit/delete,
 *      drag-and-drop re-parenting, search, expand/collapse.
 *   2. The locations picker in the editor's Insert Link Modal — read-only
 *      tree, click a node to insert a wikilink.
 *
 * Usage:
 *   Lab.locationTree.attach(mountEl, {
 *     mode: 'full' | 'picker',                    // default 'full'
 *     onOpen: function(slug) { ... },             // full mode: row click
 *     onEdit: function(slug) { ... },             // full mode: edit button
 *     onDelete: function(slug) { ... },           // full mode: delete button
 *     onPick: function(slug) { ... },             // picker mode: row click
 *     onReparent: async function(srcSlug, newParentSlug) { ... },
 *     draggable: boolean,                         // enable drag-drop
 *     showActions: boolean,                       // edit/delete buttons (full only)
 *     showSearch: boolean,                        // built-in filter input
 *     initialDepth: number,                       // default 2
 *     locationsOnly: boolean,                     // hide non-location types (default true)
 *   })
 *   → returns { refresh, destroy, filter, expand, collapseAll, getRoots, getOrphans }
 *
 * The component owns its own expand/collapse state, search filter, and
 * rendering. Callers handle the side effects (open popup, save reparent).
 */
(function() {
  'use strict';

  var LOC_TYPES = { room: 1, freezer: 1, fridge: 1, shelf: 1, box: 1, tube: 1, container: 1 };
  var LOC_ORDER = ['room', 'freezer', 'fridge', 'shelf', 'box', 'tube', 'container'];

  function attach(mount, opts) {
    if (!mount) throw new Error('Lab.locationTree.attach: mount element required');
    opts = opts || {};
    var mode = opts.mode || 'full';
    var initialDepth = typeof opts.initialDepth === 'number' ? opts.initialDepth : 2;
    var locationsOnly = opts.locationsOnly !== false;
    var showActions = opts.showActions !== false && mode === 'full';
    var showSearch = opts.showSearch !== false;
    var draggable = !!opts.draggable;
    // childFilter: optional predicate (typeName) → bool that gates which
    // descendants render. Default: in picker mode, restrict to location types
    // (so the picker doesn't list bottles parented to a cabinet etc.). In
    // full mode, show everything that has a parent in the tree.
    var childFilter = opts.childFilter || (mode === 'picker' && locationsOnly
      ? function(t) { return !!LOC_TYPES[t]; }
      : null);
    var esc = (window.Lab && window.Lab.escHtml) || function(s) { return String(s == null ? '' : s); };

    var graph = null;
    var childrenMap = null;
    var expanded = new Set();
    var seeded = false;   // R7 #21: only seed initialDepth expansion on first build
    var lastQuery = '';

    // ── DOM scaffolding ──
    mount.innerHTML = '';
    var toolbar = null;
    var searchInput = null;
    var treeMount = document.createElement('div');
    treeMount.className = 'lt-tree';

    if (showSearch) {
      toolbar = document.createElement('div');
      toolbar.className = 'lt-toolbar';
      toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;align-items:center';

      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Filter locations…';
      searchInput.className = 'lt-search';
      searchInput.style.cssText = 'flex:1;padding:6px 10px;border:1px solid var(--grey-300, #d1d5db);border-radius:4px;font-family:inherit;font-size:13px';
      searchInput.addEventListener('input', function(e) {
        lastQuery = (e.target.value || '').toLowerCase().trim();
        applyFilter(lastQuery);
      });
      toolbar.appendChild(searchInput);

      var expandAll = makeBtn('Expand all', function() {
        Object.keys(graph || {}).forEach(function(s) {
          if ((childrenMap[s] || []).length) expanded.add(s);
        });
        render();
      });
      var collapseAll = makeBtn('Collapse', function() {
        expanded.clear();
        render();
      });
      toolbar.appendChild(expandAll);
      toolbar.appendChild(collapseAll);
      mount.appendChild(toolbar);
    }
    mount.appendChild(treeMount);

    function makeBtn(label, onClick) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lt-btn';
      b.textContent = label;
      b.style.cssText = 'padding:6px 10px;border:1px solid var(--grey-300, #d1d5db);background:var(--grey-100, #f3f4f6);border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit';
      b.addEventListener('click', onClick);
      return b;
    }

    // ── Build the graph from the index ──
    async function build() {
      treeMount.innerHTML = '<div class="lt-loading" style="padding:24px;text-align:center;color:var(--grey-500)">Loading…</div>';
      if (window.Lab && window.Lab.hierarchy && window.Lab.hierarchy.invalidate) {
        Lab.hierarchy.invalidate();
      }
      graph = await Lab.hierarchy.build();
      childrenMap = {};
      Object.keys(graph).forEach(function(slug) {
        var e = graph[slug];
        if (!e.parentResolved) return;
        // Apply childFilter (if any) so e.g. bottles don't show up in the
        // locations picker. The lab-map full view leaves childFilter unset
        // and shows everything parented into the location hierarchy.
        if (childFilter && !childFilter(e.type)) return;
        (childrenMap[e.parentResolved] = childrenMap[e.parentResolved] || []).push(slug);
      });
      Object.keys(childrenMap).forEach(function(p) {
        childrenMap[p].sort(function(a, b) {
          var ea = graph[a], eb = graph[b];
          var pa = ea.position || '', pb = eb.position || '';
          if (pa !== pb) return pa < pb ? -1 : 1;
          var ta = (ea.title || a).toLowerCase();
          var tb = (eb.title || b).toLowerCase();
          return ta < tb ? -1 : ta > tb ? 1 : 0;
        });
      });
      // R7 #21: preserve the user's expanded set across refreshes (e.g. after
      // a drag-drop reparent or a delete). Drop any slugs that no longer exist
      // in the rebuilt graph so the Set doesn't leak forever.
      if (seeded) {
        var next = new Set();
        expanded.forEach(function(s) { if (graph[s]) next.add(s); });
        expanded = next;
      } else {
        seedInitialExpansion();
        seeded = true;
      }
      render();
    }

    function seedInitialExpansion() {
      var roots = findRoots();
      roots.forEach(function(r) { expandTo(r, initialDepth); });
    }
    function expandTo(slug, remaining) {
      if (remaining <= 0) return;
      expanded.add(slug);
      (childrenMap[slug] || []).forEach(function(k) { expandTo(k, remaining - 1); });
    }

    function findRoots() {
      var roots = [];
      Object.keys(graph).forEach(function(slug) {
        var e = graph[slug];
        if (locationsOnly && !LOC_TYPES[e.type]) return;
        if (e.parentResolved) return;
        // For locations-only mode, exclude things with no parent that aren't locations
        if (locationsOnly && !LOC_TYPES[e.type]) return;
        roots.push(slug);
      });
      roots.sort(function(a, b) {
        var ta = graph[a].type, tb = graph[b].type;
        var ia = LOC_ORDER.indexOf(ta);
        var ib = LOC_ORDER.indexOf(tb);
        if (ia === -1) ia = 999;
        if (ib === -1) ib = 999;
        if (ia !== ib) return ia - ib;
        return (graph[a].title || a).toLowerCase() < (graph[b].title || b).toLowerCase() ? -1 : 1;
      });
      return roots;
    }

    function findOrphans() {
      var orphans = [];
      Object.keys(graph).forEach(function(slug) {
        var e = graph[slug];
        if (!e.parent) return;
        if (e.parentResolved) return;
        if (locationsOnly && !LOC_TYPES[e.type]) return;
        orphans.push(slug);
      });
      return orphans;
    }

    // ── Render ──
    function render() {
      if (!graph) return;
      var roots = findRoots();
      if (!roots.length) {
        treeMount.innerHTML = '<div class="lt-empty" style="padding:24px;text-align:center;color:var(--grey-500)">No locations to show.</div>';
        return;
      }
      var html = '';
      roots.forEach(function(slug) { html += renderNode(slug, 0, false); });
      var orphans = findOrphans();
      if (orphans.length && mode === 'full') {
        html += '<div class="lt-orphans" style="margin-top:18px;padding-top:14px;border-top:2px dashed var(--grey-300, #d1d5db)">';
        html += '<h3 style="font-size:13px;color:var(--grey-700);margin:0 0 8px;font-weight:600">⚠ Unresolved parents (' + orphans.length + ')</h3>';
        orphans.forEach(function(slug) { html += renderNode(slug, 0, true); });
        html += '</div>';
      }
      treeMount.innerHTML = html;
      applyFilter(lastQuery);
    }

    function renderNode(slug, depth, isOrphan) {
      var e = graph[slug];
      if (!e) return '';
      var kids = childrenMap[slug] || [];
      var isLeaf = kids.length === 0;
      var isExpanded = expanded.has(slug);
      var type = e.type || 'container';
      var typeConfig = (window.Lab && Lab.types) ? Lab.types.get(type) : { icon: '📄', color: '#999' };
      var icon = typeConfig.icon || '📄';
      var title = e.title || slug.split('/').pop();
      // R6: emit both new lt-* and legacy tree-*/tw-* classnames so the
      // lab-map page's existing CSS + labbot's existing test selectors keep
      // working without having to be rewritten.
      var pos = e.position ? '<span class="lt-pos tw-pos" title="Position">' + esc(e.position) + '</span>' : '';
      var grid = e.grid ? '<span class="lt-grid tw-pos" title="Grid size" style="background:#e0f2f1;color:#00695c">' + esc(e.grid) + '</span>' : '';
      var count = kids.length ? '<span class="lt-count tw-count">' + kids.length + ' item' + (kids.length === 1 ? '' : 's') + '</span>' : '';
      var orphanBadge = isOrphan ? '<span class="lt-orphan-badge tw-pos" title="Parent ref does not resolve" style="background:#fff3e0;color:#e65100">orphan: ' + esc(e.parent || '') + '</span>' : '';
      var dragAttr = draggable ? ' draggable="true"' : '';

      var html = '<div class="lt-node tree-node' + (isExpanded ? ' is-expanded' : '') + '" data-slug="' + esc(slug) + '" data-depth="' + depth + '"' + dragAttr + '>';
      html += '<div class="lt-row tree-node-row' + (isLeaf ? ' is-leaf' : '') + '" data-act="open">';
      html += '<span class="lt-toggle tw-toggle material-icons-outlined" data-act="toggle" style="width:18px;height:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--grey-500,#9e9e9e);font-size:16px;cursor:pointer;transition:transform .12s;border-radius:3px;' + (isLeaf ? 'visibility:hidden' : '') + (isExpanded ? ';transform:rotate(90deg)' : '') + '">chevron_right</span>';
      html += '<span class="lt-icon tw-icon">' + icon + '</span>';
      html += '<span class="lt-title tw-title" title="' + esc(slug) + '">' + esc(title) + '</span>';
      html += pos + grid + count + orphanBadge;
      if (showActions) {
        html += '<span class="lt-actions tw-actions">';
        html += '<button type="button" data-act="edit" title="Edit"><span class="material-icons-outlined">edit</span></button>';
        html += '<button type="button" data-act="delete" class="lt-danger danger" title="Delete"><span class="material-icons-outlined">delete</span></button>';
        html += '</span>';
      }
      html += '</div>';
      if (!isLeaf) {
        html += '<div class="lt-children tree-children">';
        kids.forEach(function(k) { html += renderNode(k, depth + 1, false); });
        html += '</div>';
      }
      html += '</div>';
      return html;
    }

    // ── Click delegation (scoped to this mount) ──
    function onClick(e) {
      var actEl = e.target.closest('[data-act]');
      if (!actEl) return;
      var nodeEl = actEl.closest('.lt-node');
      if (!nodeEl) return;
      var slug = nodeEl.getAttribute('data-slug');
      var act = actEl.getAttribute('data-act');

      if (act === 'toggle') {
        e.stopPropagation();
        if (expanded.has(slug)) expanded.delete(slug);
        else expanded.add(slug);
        nodeEl.classList.toggle('is-expanded');
        // Update inline style on the toggle arrow (for pages without lab-map CSS)
        var toggleEl = actEl.closest('.lt-toggle') || actEl;
        toggleEl.style.transform = expanded.has(slug) ? 'rotate(90deg)' : '';
        return;
      }
      if (act === 'open') {
        e.stopPropagation();
        if (mode === 'picker') {
          if (typeof opts.onPick === 'function') opts.onPick(slug);
        } else {
          if (typeof opts.onOpen === 'function') opts.onOpen(slug);
        }
        return;
      }
      if (act === 'edit') {
        e.stopPropagation();
        if (typeof opts.onEdit === 'function') opts.onEdit(slug);
        return;
      }
      if (act === 'delete') {
        e.stopPropagation();
        if (typeof opts.onDelete === 'function') opts.onDelete(slug);
        return;
      }
    }
    treeMount.addEventListener('click', onClick);

    // ── Drag and drop (re-parenting) ──
    var dragging = null;
    function onDragStart(e) {
      var nodeEl = e.target.closest('.lt-node');
      if (!nodeEl) return;
      dragging = nodeEl.getAttribute('data-slug');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragging);
      nodeEl.classList.add('lt-dragging');
    }
    function onDragEnd(e) {
      var nodeEl = e.target.closest('.lt-node');
      if (nodeEl) nodeEl.classList.remove('lt-dragging');
      treeMount.querySelectorAll('.lt-drop-target').forEach(function(el) {
        el.classList.remove('lt-drop-target');
      });
      dragging = null;
    }
    function onDragOver(e) {
      if (!dragging) return;
      var nodeEl = e.target.closest('.lt-node');
      if (!nodeEl) return;
      var targetSlug = nodeEl.getAttribute('data-slug');
      if (targetSlug === dragging) return;
      // Prevent dropping on a descendant (cycle)
      if (isDescendantOf(targetSlug, dragging)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      treeMount.querySelectorAll('.lt-drop-target').forEach(function(el) {
        if (el !== nodeEl) el.classList.remove('lt-drop-target');
      });
      nodeEl.classList.add('lt-drop-target');
    }
    function onDrop(e) {
      if (!dragging) return;
      var nodeEl = e.target.closest('.lt-node');
      if (!nodeEl) return;
      var targetSlug = nodeEl.getAttribute('data-slug');
      if (targetSlug === dragging) return;
      if (isDescendantOf(targetSlug, dragging)) return;
      e.preventDefault();
      e.stopPropagation();
      var src = dragging;
      dragging = null;
      treeMount.querySelectorAll('.lt-drop-target, .lt-dragging').forEach(function(el) {
        el.classList.remove('lt-drop-target', 'lt-dragging');
      });
      if (typeof opts.onReparent === 'function') {
        // Defer to next tick so the visual cleanup paints first
        Promise.resolve().then(function() { opts.onReparent(src, targetSlug); });
      }
    }
    function isDescendantOf(maybeDescendant, ancestor) {
      // Walks up `maybeDescendant`'s parent chain — if it hits `ancestor`,
      // a drop would create a cycle.
      var cur = maybeDescendant;
      var seen = {};
      while (cur && graph[cur] && !seen[cur]) {
        if (cur === ancestor) return true;
        seen[cur] = true;
        cur = graph[cur].parentResolved || null;
      }
      return false;
    }
    if (draggable) {
      treeMount.addEventListener('dragstart', onDragStart);
      treeMount.addEventListener('dragend', onDragEnd);
      treeMount.addEventListener('dragover', onDragOver);
      treeMount.addEventListener('drop', onDrop);
    }

    // ── Filter ──
    function applyFilter(q) {
      if (!q) {
        treeMount.querySelectorAll('.lt-node').forEach(function(n) {
          n.style.display = '';
          var row = n.querySelector('.lt-row');
          if (row) row.classList.remove('is-hit');
        });
        return;
      }
      var hits = new Set();
      Object.keys(graph).forEach(function(slug) {
        var e = graph[slug];
        var hay = (slug + ' ' + (e.title || '') + ' ' + (e.type || '')).toLowerCase();
        if (hay.indexOf(q) !== -1) hits.add(slug);
      });
      var show = new Set();
      hits.forEach(function(slug) {
        var cur = slug;
        var seen = {};
        while (cur && graph[cur] && !seen[cur]) {
          seen[cur] = true;
          show.add(cur);
          cur = graph[cur].parentResolved || null;
        }
      });
      treeMount.querySelectorAll('.lt-node').forEach(function(n) {
        var slug = n.getAttribute('data-slug');
        var row = n.querySelector('.lt-row');
        if (show.has(slug)) {
          n.style.display = '';
          n.classList.add('is-expanded');
          if (row) {
            if (hits.has(slug)) row.classList.add('is-hit');
            else row.classList.remove('is-hit');
          }
        } else {
          n.style.display = 'none';
        }
      });
    }

    // Boot
    build();

    return {
      refresh: build,
      filter: applyFilter,
      expand: function(slug) { expanded.add(slug); render(); },
      collapseAll: function() { expanded.clear(); render(); },
      getRoots: function() { return findRoots(); },
      getOrphans: function() { return findOrphans(); },
      isExpanded: function(slug) { return expanded.has(slug); },
      destroy: function() {
        treeMount.removeEventListener('click', onClick);
        if (draggable) {
          treeMount.removeEventListener('dragstart', onDragStart);
          treeMount.removeEventListener('dragend', onDragEnd);
          treeMount.removeEventListener('dragover', onDragOver);
          treeMount.removeEventListener('drop', onDrop);
        }
        mount.innerHTML = '';
      },
    };
  }

  window.Lab = window.Lab || {};
  window.Lab.locationTree = { attach: attach };
})();
