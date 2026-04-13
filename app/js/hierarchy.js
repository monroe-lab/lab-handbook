/* Monroe Lab – Location hierarchy utilities

   Every object in the index may declare a `parent` (slug or [[wikilink]]) and a
   `position` (grid cell label, e.g. "A1"). This module walks those parent refs
   to build chains, collect children, and render breadcrumbs.

   The object-index is flat; hierarchy is computed client-side on first use and
   cached. Any patch to the index (save, delete) should call `invalidate()`.

   Usage:
     var chain = await Lab.hierarchy.parentChain('tube-pistachio-leaf-1');
     //   => ['room-robbins-0170', 'freezer-minus80-a', ..., 'tube-pistachio-leaf-1']
     var kids  = await Lab.hierarchy.childrenOf('box-pistachio-dna');
     var html  = await Lab.hierarchy.breadcrumbHTML('tube-pistachio-leaf-1');
*/
(function() {
  'use strict';

  var _graph = null;        // { slug: entry } — index keyed by slug
  var _childrenMap = null;  // { slug: [childSlug, ...] }
  var _warnings = [];       // parent-ref resolution warnings

  // Convert a docs/-relative path into a slug (strip .md, no docs/ prefix).
  function pathToSlug(p) {
    if (!p) return null;
    return p.replace(/^docs\//, '').replace(/\.md$/, '');
  }

  // Normalize a parent field value: strip [[ ]], .md, trim whitespace.
  // Returns null for empty / missing.
  function normalizeParent(v) {
    if (v == null) return null;
    var s = String(v).trim();
    if (!s) return null;
    // [[slug]] or [[slug|label]]
    var m = s.match(/^\[\[([^\[\]\|#]+?)(?:\|[^\[\]]*)?(?:#[^\[\]]*)?\]\]$/);
    if (m) s = m[1].trim();
    if (s.endsWith('.md')) s = s.slice(0, -3);
    s = s.replace(/^\//, '').replace(/\/+$/, '');
    return s || null;
  }

  // Resolve a parent field to an index entry. Tries exact slug first,
  // then basename match (matches how link-index resolves wikilinks).
  // Returns null if no match.
  function resolveParentSlug(parentField, graph) {
    var norm = normalizeParent(parentField);
    if (!norm) return null;
    if (graph[norm]) return norm;

    // Basename fallback — any slug whose last segment matches.
    var base = norm.split('/').pop().toLowerCase();
    var slugs = Object.keys(graph);
    for (var i = 0; i < slugs.length; i++) {
      var s = slugs[i];
      if (s.split('/').pop().toLowerCase() === base) return s;
    }
    return null;
  }

  async function build() {
    if (_graph) return _graph;
    _warnings = [];
    var index = await Lab.gh.fetchObjectIndex();
    var g = {};
    index.forEach(function(entry) {
      var slug = pathToSlug(entry.path);
      if (!slug) return;
      // shallow copy so we don't mutate the cached index
      var copy = {};
      Object.keys(entry).forEach(function(k) { copy[k] = entry[k]; });
      copy.slug = slug;
      g[slug] = copy;
    });

    // Resolve + normalize parent refs, build children map.
    var children = {};
    Object.keys(g).forEach(function(slug) {
      var e = g[slug];
      if (e.parent) {
        var resolved = resolveParentSlug(e.parent, g);
        if (resolved) {
          e.parentResolved = resolved;
          (children[resolved] = children[resolved] || []).push(slug);
        } else {
          e.parentResolved = null;
          _warnings.push({ slug: slug, parent: e.parent, reason: 'unresolved' });
        }
      }
    });

    _graph = g;
    _childrenMap = children;
    return g;
  }

  function invalidate() {
    _graph = null;
    _childrenMap = null;
    _warnings = [];
  }

  async function get(slug) {
    var g = await build();
    return g[slug] || null;
  }

  async function childrenOf(slug) {
    await build();
    var kids = _childrenMap[slug] || [];
    return kids.map(function(s) { return _graph[s]; });
  }

  // Walk parent chain from root → self. Cycle-safe.
  async function parentChain(slug) {
    var g = await build();
    var chain = [];
    var seen = {};
    var cur = slug;
    while (cur && g[cur] && !seen[cur]) {
      seen[cur] = true;
      chain.unshift(cur);
      cur = g[cur].parentResolved || null;
    }
    return chain;
  }

  // Render breadcrumb as HTML. Each crumb is a pill-styled link to the object.
  // Includes the current object at the end (bold, non-clickable).
  async function breadcrumbHTML(slug) {
    var g = await build();
    var chain = await parentChain(slug);
    if (!chain.length) return '';

    var base = (window.Lab && Lab.BASE) || '/lab-handbook/';
    var parts = chain.map(function(s, i) {
      var e = g[s];
      var title = e && (e.title || s.split('/').pop()) || s;
      var isLast = i === chain.length - 1;
      var type = (e && e.type) || 'container';
      var style = Lab.types.pillStyle(type);
      var icon = Lab.types.get(type).icon;
      if (isLast) {
        return '<span style="' + style + 'cursor:default;font-weight:600">' + icon + ' ' + escapeHTML(title) + '</span>';
      }
      return '<a href="#" data-crumb-slug="' + escapeHTML(s) + '" style="' + style + 'text-decoration:none" onclick="event.preventDefault();if(window.Lab&&Lab.editorModal)Lab.editorModal.open(\'docs/' + escapeHTML(s) + '.md\')">' + icon + ' ' + escapeHTML(title) + '</a>';
    });
    return '<div class="lab-breadcrumb" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0;font-size:13px">' +
      parts.join('<span style="color:#90a4ae">/</span>') +
      '</div>';
  }

  // Parse a grid declaration like "10x10", "8x12" into { rows, cols }.
  // Returns null for empty/malformed.
  function parseGrid(gridField) {
    if (!gridField) return null;
    var m = String(gridField).trim().match(/^(\d+)\s*[xX×]\s*(\d+)$/);
    if (!m) return null;
    var rows = parseInt(m[1], 10);
    var cols = parseInt(m[2], 10);
    if (!rows || !cols || rows > 50 || cols > 50) return null;
    return { rows: rows, cols: cols };
  }

  // Convert a grid position like "A1" into { row: 0, col: 0 } (zero-indexed).
  // Also accepts "1,1" or "1,1". Returns null if unparseable.
  function parsePosition(pos) {
    if (!pos) return null;
    var s = String(pos).trim().toUpperCase();
    var m = s.match(/^([A-Z])(\d+)$/);
    if (m) {
      return { row: m[1].charCodeAt(0) - 65, col: parseInt(m[2], 10) - 1, display: s };
    }
    m = s.match(/^(\d+)\s*,\s*(\d+)$/);
    if (m) {
      var r = parseInt(m[1], 10) - 1;
      var c = parseInt(m[2], 10) - 1;
      return { row: r, col: c, display: String.fromCharCode(65 + r) + (c + 1) };
    }
    return null;
  }

  function warnings() { return _warnings.slice(); }

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.hierarchy = {
    build: build,
    invalidate: invalidate,
    get: get,
    childrenOf: childrenOf,
    parentChain: parentChain,
    breadcrumbHTML: breadcrumbHTML,
    normalizeParent: normalizeParent,
    resolveParentSlug: function(v) { return build().then(function(g) { return resolveParentSlug(v, g); }); },
    parseGrid: parseGrid,
    parsePosition: parsePosition,
    warnings: warnings,
  };
})();
