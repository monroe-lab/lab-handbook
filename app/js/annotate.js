/* Monroe Lab – Image Annotation Editor
   Click an image in the editor to add text annotations (gel labels, etc.)
   Saves flattened PNG as -annotated.png alongside the original. */
(function() {
  'use strict';

  var overlay = null;
  var canvas = null;
  var ctx = null;
  var baseImage = null;       // original Image object
  var annotations = [];       // [{text, x, y, color, size, rotation}]
  var shapes = [];            // [{type:'line'|'arrow'|'rect'|'ellipse', x1,y1,x2,y2, color, size}]
  var selectedIdx = -1;
  var dragging = false;
  var dragOffX = 0, dragOffY = 0;
  // mode: 'text' (default — click to add label, drag to move), 'line', 'arrow', 'rect', 'ellipse'
  var currentTool = { color: '#ffffff', size: 3, rotation: 0, mode: 'text' };
  var shapeDrawing = null;    // live in-progress shape during drag: {type, x1, y1, x2, y2, color, size}
  var cropMode = false;
  var cropStart = null;
  var cropRect = null; // {x, y, w, h} in canvas coords
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

    createOverlay();
    overlay.style.display = 'flex';
    annotations = [];
    shapes = [];
    shapeDrawing = null;
    selectedIdx = -1;
    currentTool.mode = 'text';
    updateToolButtons();

    // Load image fresh — no previous annotations loaded
    baseImage = new Image();
    baseImage.crossOrigin = 'anonymous';
    baseImage.onload = function() {
      fitCanvas();
      draw();
    };
    baseImage.onerror = function() {
      window.Lab.showToast('Could not load image', 'error');
      close();
    };
    var loadSrc = imgEl.src || (base + origSrc);
    baseImage.src = loadSrc;
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
    annotations = [];
    shapes = [];
    shapeDrawing = null;
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

    // Row 1.5: tool picker (text / line / arrow / rect / ellipse)
    var toolRow = document.createElement('div');
    toolRow.style.cssText = 'display:flex;align-items:center;gap:4px;padding:6px 12px;background:rgba(255,255,255,.08);border-radius:10px;width:fit-content;';
    var toolLabel = document.createElement('span');
    toolLabel.textContent = 'Tool:';
    toolLabel.style.cssText = 'color:rgba(255,255,255,.6);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-right:6px;';
    toolRow.appendChild(toolLabel);

    // Inline SVG icons for each tool (stroke currentColor so they follow button color).
    var ICONS = {
      text: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/></svg>',
      line: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>',
      arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="11 5 19 5 19 13"/></svg>',
      rect: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="1"/></svg>',
      ellipse: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="8" ry="6"/></svg>'
    };
    var TOOLS = [
      { mode: 'text', label: 'Text label' },
      { mode: 'line', label: 'Line' },
      { mode: 'arrow', label: 'Arrow' },
      { mode: 'rect', label: 'Rectangle' },
      { mode: 'ellipse', label: 'Ellipse' }
    ];
    TOOLS.forEach(function(t) {
      var tb = document.createElement('button');
      tb.type = 'button';
      tb.title = t.label;
      tb.dataset.tool = t.mode;
      tb.innerHTML = ICONS[t.mode];
      tb.style.cssText = 'padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      tb.onclick = function() {
        currentTool.mode = t.mode;
        // Leaving text mode? deselect any active annotation so its handle doesn't lure clicks.
        if (t.mode !== 'text') selectedIdx = -1;
        updateToolButtons();
        draw();
      };
      toolRow.appendChild(tb);
    });
    toolbarWrap.appendChild(toolRow);

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

    // Separator
    var sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:24px;background:rgba(255,255,255,.2);margin:0 4px;';
    toolbar.appendChild(sep);

    // Rotate image 90° buttons
    var imgRotGroup = document.createElement('div');
    imgRotGroup.style.cssText = 'display:flex;gap:2px;';
    [{ icon: 'rotate_left', deg: -90, title: 'Rotate image left' }, { icon: 'rotate_right', deg: 90, title: 'Rotate image right' }].forEach(function(r) {
      var rb = document.createElement('button');
      rb.type = 'button';
      rb.title = r.title;
      rb.innerHTML = '<span class="material-icons-outlined" style="font-size:18px">' + r.icon + '</span>';
      rb.style.cssText = 'padding:4px;border-radius:4px;border:1px solid rgba(77,182,172,.5);background:rgba(77,182,172,.15);color:#4db6ac;cursor:pointer;display:flex;';
      rb.onclick = function() { rotateImage(r.deg); };
      imgRotGroup.appendChild(rb);
    });
    toolbar.appendChild(imgRotGroup);

    // Crop button
    var cropBtn = document.createElement('button');
    cropBtn.type = 'button';
    cropBtn.id = 'annot-crop-btn';
    cropBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">crop</span> Crop';
    cropBtn.style.cssText = 'padding:4px 10px;border-radius:4px;border:1px solid rgba(77,182,172,.5);background:rgba(77,182,172,.15);color:#4db6ac;font-size:12px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;';
    cropBtn.onclick = function() {
      cropMode = !cropMode;
      cropRect = null;
      cropStart = null;
      cropBtn.style.background = cropMode ? 'rgba(77,182,172,.4)' : 'rgba(77,182,172,.15)';
      canvas.style.cursor = cropMode ? 'crosshair' : 'crosshair';
      draw();
    };
    toolbar.appendChild(cropBtn);

    // Apply crop button (hidden until crop rectangle drawn)
    var applyCropBtn = document.createElement('button');
    applyCropBtn.type = 'button';
    applyCropBtn.id = 'annot-apply-crop';
    applyCropBtn.innerHTML = '<span class="material-icons-outlined" style="font-size:16px">check</span> Apply';
    applyCropBtn.style.cssText = 'display:none;padding:4px 10px;border-radius:4px;border:none;background:#4db6ac;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;align-items:center;gap:4px;font-weight:500;';
    applyCropBtn.onclick = function() { applyCrop(); };
    toolbar.appendChild(applyCropBtn);

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

  function updateToolButtons() {
    if (!overlay) return;
    var btns = overlay.querySelectorAll('[data-tool]');
    btns.forEach(function(b) {
      if (b.dataset.tool === currentTool.mode) {
        b.style.background = 'rgba(77,182,172,.3)';
        b.style.borderColor = '#4db6ac';
        b.style.color = '#4db6ac';
      } else {
        b.style.background = 'transparent';
        b.style.borderColor = 'rgba(255,255,255,.25)';
        b.style.color = '#fff';
      }
    });
    // Swap the label input visibility / placeholder so the toolbar communicates mode.
    var ti = document.getElementById('annot-text');
    if (ti) {
      if (currentTool.mode === 'text') {
        ti.disabled = false;
        ti.placeholder = 'Label text...';
        ti.style.opacity = '1';
      } else {
        ti.disabled = true;
        ti.placeholder = 'Drag on image to draw ' + currentTool.mode + '...';
        ti.style.opacity = '.5';
      }
    }
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
  // Shape stroke width scales with the "size" %: line tool defaults to the
  // same S/M/L/XL slider as text, but the pixel width is smaller so shapes
  // look proportional next to typography. Multiplier chosen empirically.
  function shapeStrokePx(sizePct) {
    var pct = (sizePct != null ? sizePct : 3);
    // Text at size 3 (M) ≈ 3% of width for font size; shape stroke at ~25% of that
    // feels right: crisp but not cartoonish. Clamp to >=2px on tiny images.
    return Math.max(2, Math.round(canvas.width * pct / 100 * 0.25));
  }

  function drawShape(s) {
    ctx.save();
    ctx.strokeStyle = s.color || '#ffffff';
    ctx.fillStyle = s.color || '#ffffff';
    ctx.lineWidth = shapeStrokePx(s.size);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (s.type === 'line' || s.type === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      if (s.type === 'arrow') {
        // Arrowhead: two short strokes from endpoint angled back along the line.
        var dx = s.x2 - s.x1, dy = s.y2 - s.y1;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) {
          var headLen = Math.max(ctx.lineWidth * 3.5, Math.min(len * 0.25, 40));
          var angle = Math.atan2(dy, dx);
          var ha = Math.PI / 7; // ~25° — classic arrow look
          ctx.beginPath();
          ctx.moveTo(s.x2, s.y2);
          ctx.lineTo(s.x2 - headLen * Math.cos(angle - ha), s.y2 - headLen * Math.sin(angle - ha));
          ctx.moveTo(s.x2, s.y2);
          ctx.lineTo(s.x2 - headLen * Math.cos(angle + ha), s.y2 - headLen * Math.sin(angle + ha));
          ctx.stroke();
        }
      }
    } else if (s.type === 'rect') {
      var rx = Math.min(s.x1, s.x2), ry = Math.min(s.y1, s.y2);
      var rw = Math.abs(s.x2 - s.x1), rh = Math.abs(s.y2 - s.y1);
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (s.type === 'ellipse') {
      var cx = (s.x1 + s.x2) / 2, cy = (s.y1 + s.y2) / 2;
      var rxr = Math.abs(s.x2 - s.x1) / 2, ryr = Math.abs(s.y2 - s.y1) / 2;
      if (rxr > 0 && ryr > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rxr, ryr, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw() {
    if (!ctx || !baseImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);

    // Shapes first, so text labels sit on top.
    shapes.forEach(drawShape);
    if (shapeDrawing) drawShape(shapeDrawing);

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

    // Draw crop rectangle overlay
    if (cropMode && cropRect && cropRect.w > 0 && cropRect.h > 0) {
      // Dim everything outside the crop
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0, 0, canvas.width, cropRect.y);
      ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.h);
      ctx.fillRect(cropRect.x + cropRect.w, cropRect.y, canvas.width - cropRect.x - cropRect.w, cropRect.h);
      ctx.fillRect(0, cropRect.y + cropRect.h, canvas.width, canvas.height - cropRect.y - cropRect.h);
      // Crop border
      ctx.strokeStyle = '#4db6ac';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.setLineDash([]);
    }
  }

  // ── Image manipulation ──
  function rotateImage(deg) {
    if (!baseImage) return;
    var rad = deg * Math.PI / 180;
    var tmpCanvas = document.createElement('canvas');
    var tmpCtx = tmpCanvas.getContext('2d');
    if (Math.abs(deg) === 90) {
      tmpCanvas.width = canvas.height;
      tmpCanvas.height = canvas.width;
    } else {
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
    }
    tmpCtx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
    tmpCtx.rotate(rad);
    tmpCtx.drawImage(baseImage, -baseImage.naturalWidth / 2, -baseImage.naturalHeight / 2);

    // Transform annotation coordinates
    annotations.forEach(function(a) {
      var ox = a.x, oy = a.y;
      if (deg === 90) {
        a.x = canvas.height - oy;
        a.y = ox;
      } else if (deg === -90) {
        a.x = oy;
        a.y = canvas.width - ox;
      }
      a.rotation = (a.rotation || 0) + deg;
    });

    // Transform shape endpoints the same way.
    shapes.forEach(function(s) {
      var p1x = s.x1, p1y = s.y1, p2x = s.x2, p2y = s.y2;
      if (deg === 90) {
        s.x1 = canvas.height - p1y; s.y1 = p1x;
        s.x2 = canvas.height - p2y; s.y2 = p2x;
      } else if (deg === -90) {
        s.x1 = p1y; s.y1 = canvas.width - p1x;
        s.x2 = p2y; s.y2 = canvas.width - p2x;
      }
    });

    // Replace baseImage
    var newImg = new Image();
    newImg.onload = function() {
      baseImage = newImg;
      fitCanvas();
      draw();
    };
    newImg.src = tmpCanvas.toDataURL('image/png');
  }

  function applyCrop() {
    if (!cropRect || !baseImage) return;
    var r = cropRect;
    // Clamp to canvas bounds
    var x = Math.max(0, Math.round(r.x));
    var y = Math.max(0, Math.round(r.y));
    var w = Math.min(canvas.width - x, Math.round(r.w));
    var h = Math.min(canvas.height - y, Math.round(r.h));
    if (w < 10 || h < 10) return;

    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    var tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(baseImage, x, y, w, h, 0, 0, w, h);

    // Shift annotation coordinates
    annotations.forEach(function(a) {
      a.x -= x;
      a.y -= y;
    });
    // Remove annotations outside crop area
    annotations = annotations.filter(function(a) {
      return a.x >= -50 && a.x <= w + 50 && a.y >= -50 && a.y <= h + 50;
    });

    // Shift shapes too, then drop ones that ended up entirely outside.
    shapes.forEach(function(s) {
      s.x1 -= x; s.y1 -= y;
      s.x2 -= x; s.y2 -= y;
    });
    shapes = shapes.filter(function(s) {
      var inX = Math.max(s.x1, s.x2) >= -20 && Math.min(s.x1, s.x2) <= w + 20;
      var inY = Math.max(s.y1, s.y2) >= -20 && Math.min(s.y1, s.y2) <= h + 20;
      return inX && inY;
    });

    var newImg = new Image();
    newImg.onload = function() {
      baseImage = newImg;
      cropMode = false;
      cropRect = null;
      cropStart = null;
      var cropBtn = document.getElementById('annot-crop-btn');
      if (cropBtn) cropBtn.style.background = 'rgba(77,182,172,.15)';
      var applyBtn = document.getElementById('annot-apply-crop');
      if (applyBtn) applyBtn.style.display = 'none';
      fitCanvas();
      draw();
    };
    newImg.src = tmpCanvas.toDataURL('image/png');
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

    if (cropMode) {
      cropStart = { x: p.x, y: p.y };
      cropRect = { x: p.x, y: p.y, w: 0, h: 0 };
      return;
    }

    // Shape tools: start a new shape, preview during drag, commit on up.
    if (currentTool.mode !== 'text') {
      shapeDrawing = {
        type: currentTool.mode,
        x1: p.x, y1: p.y, x2: p.x, y2: p.y,
        color: currentTool.color,
        size: currentTool.size
      };
      selectedIdx = -1;
      draw();
      return;
    }

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
    if (cropMode && cropStart) {
      var p = canvasXY(e);
      cropRect = {
        x: Math.min(cropStart.x, p.x),
        y: Math.min(cropStart.y, p.y),
        w: Math.abs(p.x - cropStart.x),
        h: Math.abs(p.y - cropStart.y)
      };
      draw();
      return;
    }
    if (shapeDrawing) {
      var p = canvasXY(e);
      shapeDrawing.x2 = p.x;
      shapeDrawing.y2 = p.y;
      draw();
      return;
    }
    if (!dragging || selectedIdx < 0) return;
    var p = canvasXY(e);
    annotations[selectedIdx].x = p.x - dragOffX;
    annotations[selectedIdx].y = p.y - dragOffY;
    draw();
  }

  function onPointerUp() {
    dragging = false;
    if (shapeDrawing) {
      // Commit the shape if it has meaningful extent — filters out stray clicks.
      var dx = shapeDrawing.x2 - shapeDrawing.x1;
      var dy = shapeDrawing.y2 - shapeDrawing.y1;
      if (Math.sqrt(dx * dx + dy * dy) >= 4) {
        shapes.push(shapeDrawing);
      }
      shapeDrawing = null;
      draw();
    }
    if (cropMode && cropRect && cropRect.w > 10 && cropRect.h > 10) {
      var applyBtn = document.getElementById('annot-apply-crop');
      if (applyBtn) applyBtn.style.display = 'inline-flex';
    }
    cropStart = null;
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
    if (!baseImage || (!annotations.length && !shapes.length)) { close(); return; }
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

      // 2. Determine file paths — annotated version saved alongside original.
      // SAFETY NET for copy/paste images (#97 #98 #99): if the image was pasted
      // into the editor, origSrc is a "data:image/...;base64,AAAA..." URL rather
      // than a repo-relative path. String-manipulating a 2MB data URL into a
      // GitHub Contents API path produces a malformed fetch URL and throws
      // "Failed to fetch". Fix: detect data-URL srcs up front, upload the base
      // image to docs/images/<pasted-…> first, then compute the annotated path
      // from the new repo-relative path.
      var origRelative = origSrc; // e.g. "images/gel-photo.jpg"
      if (origRelative && origRelative.startsWith('data:')) {
        var em = window.Lab && window.Lab.editorModal;
        if (em && em.uploadImageBlob && em.dataUrlToBlob) {
          window.Lab.showToast('Uploading pasted image first...', 'info');
          var origBlob = em.dataUrlToBlob(origRelative);
          if (!origBlob) throw new Error('Could not decode pasted image');
          var uploaded = await em.uploadImageBlob(origBlob);
          // Use the new repo path as the canonical origSrc. Also leave a
          // _dataUrlToPath breadcrumb via the editor module so getMarkdownClean
          // can rewrite any remaining inline data URLs in the markdown.
          origRelative = uploaded.path; // "images/<slug>"
          origSrc = uploaded.path;
        } else {
          throw new Error('Editor module unavailable — reload the page');
        }
      }
      var cleanBase = origRelative.replace(/-annotated\.[^.]+$/, '').replace(/\.[^.]+$/, '');
      var annotatedPath = cleanBase + '-annotated.png';

      // 3. Upload flattened PNG (original image stays untouched)
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

      // 4. Callback with the annotated image path and data URL for immediate preview.
      // R7 #29: isolate the host's callback in its own try/catch so a
      // failure inside it (e.g. Toast UI setMarkdown, ProseMirror reflow)
      // can't block the modal from closing. Previously a thrown error
      // here left the annotation modal visible with the "Saved!" toast
      // already shown, forcing the user to click Cancel.
      var dataUrl = canvas.toDataURL('image/png');
      if (onSaveCallback) {
        try { onSaveCallback(annotatedPath, dataUrl); }
        catch(cbErr) { console.error('annotate: save callback error:', cbErr); }
      }

      window.Lab.showToast('Annotations saved!', 'success');
    } catch(e) {
      window.Lab.showToast('Save failed: ' + e.message, 'error');
      return;
    }
    // R7 #29: close unconditionally after the try — reached for both the
    // success path and any path that doesn't `return` out of the catch.
    close();
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
