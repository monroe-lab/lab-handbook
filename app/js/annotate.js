/* Monroe Lab – Image Annotation Editor
   Click an image in the editor to add text annotations (gel labels, etc.)
   Saves flattened PNG + JSON sidecar for re-editing. */
(function() {
  'use strict';

  var overlay = null;
  var canvas = null;
  var ctx = null;
  var baseImage = null;       // original Image object
  var annotations = [];       // [{text, x, y, color, size, rotation}]
  var selectedIdx = -1;
  var dragging = false;
  var dragOffX = 0, dragOffY = 0;
  var currentTool = { color: '#ffffff', size: 3, rotation: 0 }; // size is % of image width
  var origSrc = '';           // relative path of the original image
  var onSaveCallback = null;
  var scale = 1;              // canvas display scale

  // ── Public API ──
  function open(imgEl, saveCallback) {
    onSaveCallback = saveCallback;
    origSrc = imgEl.dataset.realSrc || imgEl.getAttribute('src') || '';
    // Strip base path to get relative path
    var base = (window.Lab && window.Lab.BASE) || '/lab-handbook/';
    if (origSrc.startsWith(base)) origSrc = origSrc.slice(base.length);

    // Check for existing annotations JSON (strip -annotated suffix if present)
    var annotBase = origSrc.replace(/-annotated\.[^.]+$/, '').replace(/\.[^.]+$/, '');
    var annotPath = annotBase + '.annotations.json';

    createOverlay();
    overlay.style.display = 'flex';
    annotations = [];
    selectedIdx = -1;

    // Load image
    baseImage = new Image();
    baseImage.crossOrigin = 'anonymous';
    baseImage.onload = async function() {
      fitCanvas();
      // Try loading existing annotations
      try {
        var gh = window.Lab && window.Lab.gh;
        if (gh) {
          var result = await gh.fetchFile('docs/' + annotPath);
          var data = JSON.parse(result.content);
          if (data.annotations && Array.isArray(data.annotations)) {
            annotations = data.annotations;
          } else if (Array.isArray(data)) {
            annotations = data;
          }
          // Load the ORIGINAL (un-annotated) image for clean re-editing
          if (data._originalSrc) {
            origSrc = data._originalSrc;
            var origImg = new Image();
            origImg.crossOrigin = 'anonymous';
            origImg.onload = function() { baseImage = origImg; fitCanvas(); draw(); };
            origImg.onerror = function() { draw(); }; // fall back to current image
            origImg.src = base + data._originalSrc;
          }
        }
      } catch(e) { /* no annotations yet, that's fine */ }
      draw();
    };
    baseImage.onerror = function() {
      window.Lab.showToast('Could not load image', 'error');
      close();
    };
    // Use the full URL for loading
    var loadSrc = imgEl.src || (base + origSrc);
    baseImage.src = loadSrc;
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
    annotations = [];
    selectedIdx = -1;
    baseImage = null;
  }

  // ── UI Construction ──
  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.85);flex-direction:column;align-items:center;justify-content:center;font-family:Inter,-apple-system,sans-serif;';

    // Toolbar wrapper
    var toolbarWrap = document.createElement('div');
    toolbarWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:12px;align-items:center;';

    // Row 1: text input + mode toggle
    var row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(255,255,255,.1);border-radius:10px;width:fit-content;';

    var textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.id = 'annot-text';
    textInput.placeholder = 'Label text...';
    textInput.style.cssText = 'padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font-size:14px;min-width:200px;flex:1;font-family:inherit;';
    row1.appendChild(textInput);

    toolbarWrap.appendChild(row1);

    // Row 2: colors, sizes, rotate, delete
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(255,255,255,.1);border-radius:10px;flex-wrap:wrap;justify-content:center;';

    var colors = [
      { hex: '#ffffff', label: 'White' },
      { hex: '#000000', label: 'Black' },
      { hex: '#ff1744', label: 'Red' },
      { hex: '#ffea00', label: 'Yellow' },
      { hex: '#00e676', label: 'Green' },
      { hex: '#2979ff', label: 'Blue' },
    ];
    colors.forEach(function(c) {
      var cb = document.createElement('button');
      cb.type = 'button';
      cb.title = c.label;
      cb.dataset.color = c.hex;
      cb.style.cssText = 'width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.5);cursor:pointer;background:' + c.hex + ';padding:0;';
      cb.onclick = function() {
        currentTool.color = c.hex;
        toolbar.querySelectorAll('[data-color]').forEach(function(b) { b.style.borderColor = 'rgba(255,255,255,.3)'; });
        cb.style.borderColor = '#fff';
        if (selectedIdx >= 0) { annotations[selectedIdx].color = c.hex; draw(); }
      };
      if (c.hex === currentTool.color) cb.style.borderColor = '#fff';
      toolbar.appendChild(cb);
    });

    // Size buttons (% of image width)
    var sizes = [{ label: 'S', val: 1.5 }, { label: 'M', val: 3 }, { label: 'L', val: 5 }, { label: 'XL', val: 8 }];
    var sizeGroup = document.createElement('div');
    sizeGroup.style.cssText = 'display:flex;gap:2px;margin-left:4px;';
    sizes.forEach(function(s) {
      var sb = document.createElement('button');
      sb.type = 'button';
      sb.textContent = s.label;
      sb.dataset.size = s.val;
      sb.style.cssText = 'padding:4px 8px;border-radius:4px;border:1px solid rgba(255,255,255,.3);background:' + (s.val === currentTool.size ? 'rgba(255,255,255,.25)' : 'transparent') + ';color:#fff;font-size:11px;cursor:pointer;font-family:inherit;';
      sb.onclick = function() {
        currentTool.size = s.val;
        sizeGroup.querySelectorAll('button').forEach(function(b) { b.style.background = 'transparent'; });
        sb.style.background = 'rgba(255,255,255,.25)';
        if (selectedIdx >= 0) { annotations[selectedIdx].size = s.val; draw(); }
      };
      sizeGroup.appendChild(sb);
    });
    toolbar.appendChild(sizeGroup);

    // Rotate buttons
    var rotGroup = document.createElement('div');
    rotGroup.style.cssText = 'display:flex;gap:2px;margin-left:4px;';
    [{ icon: 'rotate_left', deg: -15 }, { icon: 'rotate_right', deg: 15 }].forEach(function(r) {
      var rb = document.createElement('button');
      rb.type = 'button';
      rb.title = r.deg > 0 ? 'Rotate right' : 'Rotate left';
      rb.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">' + r.icon + '</span>';
      rb.style.cssText = 'padding:4px;border-radius:4px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;display:flex;';
      rb.onclick = function() {
        if (selectedIdx >= 0) {
          annotations[selectedIdx].rotation = (annotations[selectedIdx].rotation || 0) + r.deg;
          currentTool.rotation = annotations[selectedIdx].rotation;
          draw();
        }
      };
      rotGroup.appendChild(rb);
    });
    toolbar.appendChild(rotGroup);

    // Delete button
    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">delete</span>';
    delBtn.title = 'Delete selected';
    delBtn.style.cssText = 'padding:4px 8px;border-radius:4px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#ff5252;cursor:pointer;display:flex;align-items:center;margin-left:4px;';
    delBtn.onclick = function() {
      if (selectedIdx >= 0) { annotations.splice(selectedIdx, 1); selectedIdx = -1; draw(); }
    };
    toolbar.appendChild(delBtn);

    toolbarWrap.appendChild(toolbar);
    overlay.appendChild(toolbarWrap);

    // Canvas container
    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'position:relative;max-width:95vw;max-height:70vh;overflow:auto;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.4);';
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;cursor:crosshair;';
    canvasWrap.appendChild(canvas);
    overlay.appendChild(canvasWrap);
    ctx = canvas.getContext('2d');

    // Canvas events (mouse)
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    // Touch events
    canvas.addEventListener('touchstart', function(e) { e.preventDefault(); onPointerDown(touchToMouse(e)); }, { passive: false });
    canvas.addEventListener('touchmove', function(e) { e.preventDefault(); onPointerMove(touchToMouse(e)); }, { passive: false });
    canvas.addEventListener('touchend', function(e) { e.preventDefault(); onPointerUp(touchToMouse(e)); }, { passive: false });

    // Bottom buttons
    var btnBar = document.createElement('div');
    btnBar.style.cssText = 'display:flex;gap:10px;margin-top:12px;';

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:8px 20px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:14px;cursor:pointer;font-family:inherit;';
    cancelBtn.onclick = close;
    btnBar.appendChild(cancelBtn);

    var saveBtn = document.createElement('button');
    saveBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px;vertical-align:middle">save</span> Save annotations';
    saveBtn.style.cssText = 'padding:8px 20px;border-radius:6px;border:none;background:#00897b;color:#fff;font-size:14px;cursor:pointer;font-family:inherit;font-weight:500;';
    saveBtn.onclick = saveAnnotations;
    btnBar.appendChild(saveBtn);

    overlay.appendChild(btnBar);
    document.body.appendChild(overlay);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (overlay.style.display === 'none') return;
      if (e.key === 'Escape') close();
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdx >= 0 && document.activeElement !== textInput) {
        annotations.splice(selectedIdx, 1); selectedIdx = -1; draw();
        e.preventDefault();
      }
    });
  }

  function touchToMouse(e) {
    var touch = e.touches[0] || e.changedTouches[0];
    return { offsetX: touch.clientX - canvas.getBoundingClientRect().left, offsetY: touch.clientY - canvas.getBoundingClientRect().top };
  }

  function fitCanvas() {
    if (!baseImage) return;
    var maxW = Math.min(window.innerWidth * 0.95, baseImage.naturalWidth);
    var maxH = window.innerHeight * 0.7;
    scale = Math.min(maxW / baseImage.naturalWidth, maxH / baseImage.naturalHeight, 1);
    canvas.width = baseImage.naturalWidth;
    canvas.height = baseImage.naturalHeight;
    canvas.style.width = Math.round(baseImage.naturalWidth * scale) + 'px';
    canvas.style.height = Math.round(baseImage.naturalHeight * scale) + 'px';
  }

  // ── Drawing ──
  function draw() {
    if (!ctx || !baseImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);

    annotations.forEach(function(a, i) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.rotation) ctx.rotate(a.rotation * Math.PI / 180);

      // Size is stored as % of image width
      var pct = a.size || 3;
      var fontSize = Math.round(canvas.width * pct / 100);
      ctx.font = 'bold ' + fontSize + 'px Inter, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';

      var displayText = a.text || (i === selectedIdx ? '|' : '');
      if (!displayText) { ctx.restore(); return; }

      // Text outline for readability
      ctx.strokeStyle = a.color === '#000000' ? '#ffffff' : '#000000';
      ctx.lineWidth = Math.max(3, fontSize / 5);
      ctx.lineJoin = 'round';
      ctx.strokeText(displayText, 0, 0);

      // Fill
      ctx.fillStyle = a.color || '#ffffff';
      ctx.fillText(displayText, 0, 0);

      // Selection indicator
      if (i === selectedIdx) {
        var metrics = ctx.measureText(displayText);
        var pad = fontSize * 0.15;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = Math.max(2, fontSize / 10);
        ctx.setLineDash([fontSize / 4, fontSize / 6]);
        ctx.strokeRect(-pad, -fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }

  // ── Pointer events ──
  function canvasXY(e) {
    return { x: e.offsetX / scale, y: e.offsetY / scale };
  }

  function hitTest(px, py) {
    for (var i = annotations.length - 1; i >= 0; i--) {
      var a = annotations[i];
      var fontSize = Math.round(canvas.width * (a.size || 3) / 100);
      ctx.save();
      ctx.font = 'bold ' + fontSize + 'px Inter, -apple-system, sans-serif';
      var w = ctx.measureText(a.text).width;
      ctx.restore();
      var pad = fontSize * 0.3;
      if (px >= a.x - pad && px <= a.x + w + pad && py >= a.y - fontSize / 2 - pad && py <= a.y + fontSize / 2 + pad) {
        return i;
      }
    }
    return -1;
  }

  function selectAnnotation(idx) {
    selectedIdx = idx;
    if (idx >= 0) {
      var a = annotations[idx];
      document.getElementById('annot-text').value = a.text;
      // Inherit settings for next new annotation
      currentTool.color = a.color || currentTool.color;
      currentTool.size = a.size || currentTool.size;
      currentTool.rotation = a.rotation || 0;
    }
    draw();
  }

  function onPointerDown(e) {
    var p = canvasXY(e);
    var hit = hitTest(p.x, p.y);

    if (hit >= 0) {
      // Clicked on existing annotation → select and drag
      selectAnnotation(hit);
      dragging = true;
      dragOffX = p.x - annotations[hit].x;
      dragOffY = p.y - annotations[hit].y;
      canvas.style.cursor = 'grabbing';
    } else {
      // Clicked empty space → add new annotation (blank, inherits last settings)
      annotations.push({
        text: '',
        x: p.x,
        y: p.y,
        color: currentTool.color,
        size: currentTool.size,
        rotation: currentTool.rotation
      });
      selectedIdx = annotations.length - 1;
      var ti = document.getElementById('annot-text');
      ti.value = '';
      draw();
      // setTimeout so focus works after canvas mousedown
      setTimeout(function() { ti.focus(); }, 50);
    }
  }

  function onPointerMove(e) {
    if (!dragging || selectedIdx < 0) return;
    var p = canvasXY(e);
    annotations[selectedIdx].x = p.x - dragOffX;
    annotations[selectedIdx].y = p.y - dragOffY;
    draw();
  }

  function onPointerUp() {
    dragging = false;
    canvas.style.cursor = 'crosshair';
  }

  // ── Update text of selected annotation when input changes ──
  document.addEventListener('input', function(e) {
    if (e.target.id === 'annot-text' && selectedIdx >= 0) {
      annotations[selectedIdx].text = e.target.value;
      draw();
    }
  });

  // ── Save ──
  async function saveAnnotations() {
    if (!baseImage || !annotations.length) { close(); return; }
    if (!window.Lab.gh.isLoggedIn()) { window.Lab.showToast('Sign in to save', 'error'); return; }

    window.Lab.showToast('Saving annotations...', 'info');

    try {
      // Remove empty annotations and deselect before flattening
      annotations = annotations.filter(function(a) { return a.text && a.text.trim(); });
      selectedIdx = -1;
      draw();

      // 1. Flatten canvas to PNG blob
      var blob = await new Promise(function(resolve) { canvas.toBlob(resolve, 'image/png'); });
      var base64 = await blobToBase64(blob);

      // 2. Determine file paths
      var origRelative = origSrc; // e.g. "images/gel-photo.jpg"
      var cleanBase = origRelative.replace(/-annotated\.[^.]+$/, '').replace(/\.[^.]+$/, '');
      var annotatedPath = cleanBase + '-annotated.png';
      var jsonPath = cleanBase + '.annotations.json';

      // 3. Upload flattened PNG
      var token = window.Lab.gh.getToken();
      var existingSha = null;
      try {
        var existing = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/docs/' + annotatedPath + '?ref=' + window.Lab.gh.BRANCH, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (existing.ok) { existingSha = (await existing.json()).sha; }
      } catch(e) {}

      var putBody = { message: 'Annotate ' + annotatedPath, content: base64, branch: window.Lab.gh.BRANCH };
      if (existingSha) putBody.sha = existingSha;
      var resp = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/docs/' + annotatedPath, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(putBody)
      });
      if (!resp.ok) throw new Error('Failed to upload annotated image');

      // 4. Save annotation JSON (for re-editing)
      var jsonData = annotations.slice();
      // _originalSrc always points to the un-annotated original
      var originalSrc = origRelative.includes('-annotated') ? origRelative : origRelative;
      var jsonContent = JSON.stringify({ _originalSrc: originalSrc, annotations: jsonData }, null, 2);
      var jsonBase64 = btoa(unescape(encodeURIComponent(jsonContent)));

      var jsonSha = null;
      try {
        var existingJson = await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/docs/' + jsonPath + '?ref=' + window.Lab.gh.BRANCH, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (existingJson.ok) { jsonSha = (await existingJson.json()).sha; }
      } catch(e) {}

      var jsonPut = { message: 'Annotation data for ' + cleanBase, content: jsonBase64, branch: window.Lab.gh.BRANCH };
      if (jsonSha) jsonPut.sha = jsonSha;
      await fetch('https://api.github.com/repos/' + window.Lab.gh.REPO + '/contents/docs/' + jsonPath, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonPut)
      });

      // 5. Callback with the annotated image path and data URL for immediate preview
      var dataUrl = canvas.toDataURL('image/png');
      if (onSaveCallback) onSaveCallback(annotatedPath, dataUrl);

      window.Lab.showToast('Annotations saved!', 'success');
      close();
    } catch(e) {
      window.Lab.showToast('Save failed: ' + e.message, 'error');
    }
  }

  function blobToBase64(blob) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result.split(',')[1]); };
      reader.readAsDataURL(blob);
    });
  }

  // ── Exports ──
  window.Lab = window.Lab || {};
  window.Lab.annotate = {
    open: open,
    close: close
  };
})();
