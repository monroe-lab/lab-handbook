/* Monroe Lab – Floating Feedback Button
   Adds a floating button (bottom-left) that opens a modal to submit feedback,
   ideas, suggestions, questions, or bug reports as GitHub issues.
   Auto-captures: page path, page title, timestamp, viewport size, user agent.
   Uses PAT from localStorage (gh_lab_token) to create issues via GitHub Issues API.
*/
(function() {
  'use strict';

  var REPO = 'monroe-lab/lab-handbook';
  var API = 'https://api.github.com';
  var TOKEN_KEY = 'gh_lab_token';
  // R11 #45: where attachments land in the repo. Kept OUTSIDE docs/ so
  // MkDocs doesn't try to index screenshots, and referenced via github.com
  // raw URLs in issue bodies so GitHub renders images inline.
  var ATTACH_DIR = 'issue-attachments';

  // Upload cap per attachment. GitHub contents API limits are 100 MB but
  // screenshots should never be that large, and a 5 MB cap keeps us out
  // of the range where base64 encoding gets slow in the browser.
  var MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

  // Queued attachments for the currently-open modal. Reset on modal open.
  var queuedFiles = [];

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

  function injectCSS() {
    if (document.getElementById('issue-reporter-css')) return;
    var s = document.createElement('style');
    s.id = 'issue-reporter-css';
    // R7 #23: hide the FAB whenever the user is editing (wiki full-page editor
    // sets body.editing-mode; editor-modal sets body.em-editing when it
    // enters edit state). Also hide while any other modal-like FAB-blocker is
    // open. Without this the red icon overlaps the toolbars/fabs in the
    // Toast UI editor on mobile.
    // R7 #34: on mobile the submit modal is bottom-anchored so the keyboard
    // doesn't cover the submit button.
    // qa-cycle-50: on mobile the FAB sits at right:18px / bottom:80px and
    // overlaps content in the bottom-right corner — the mobile "More" nav
    // popover (right:8px) and the open .em-overlay popup whose grid/list
    // extends to the viewport edge. Hide the FAB while either is open so it
    // can't obscure interactive content. Closes CYCLE49-MOBILE-FAB-OBSCURES-GRID.
    s.textContent =
      '@media (max-width: 768px){' +
      '  #issue-reporter-overlay{align-items:flex-start !important;padding-top:12px !important}' +
      '  #issue-reporter-modal{margin-top:0 !important;padding:16px !important}' +
      '  body:has(#nav-more-popover) #issue-reporter-btn,' +
      '  body:has(.em-overlay.open) #issue-reporter-btn{display:none !important}' +
      '}';
    document.head.appendChild(s);
  }

  function createButton() {
    injectCSS();
    var btn = document.createElement('button');
    btn.id = 'issue-reporter-btn';
    btn.setAttribute('aria-label', 'Share feedback');
    btn.textContent = '\uD83D\uDCA1';
    Object.assign(btn.style, {
      position: 'fixed',
      // Moved from bottom-left to bottom-right so the FAB doesn't cover
      // the leftmost data column of long inventory/waste tables. Stays
      // above the toast container (bottom:24px right:24px) so neither
      // obscures the other.
      bottom: '80px',
      right: '18px',
      // R7 #33: raise above editor-modal overlay (z:10000) so the button
      // stays reachable while looking at an item card inside a protocol.
      zIndex: '10001',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: 'none',
      background: '#3b82f6',
      color: '#fff',
      fontSize: '20px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform .15s, box-shadow .15s',
      lineHeight: '1'
    });
    btn.addEventListener('mouseenter', function() {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,.3)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = '';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)';
    });
    btn.addEventListener('click', openModal);
    document.body.appendChild(btn);
  }

  function openModal() {
    if (document.getElementById('issue-reporter-overlay')) return;
    queuedFiles = [];

    var overlay = document.createElement('div');
    overlay.id = 'issue-reporter-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      // R7 #33: above editor-modal overlay (z:10000) so the reporter modal
      // shows on top when the user submits from inside an item card popup.
      zIndex: '10002',
      background: 'rgba(0,0,0,.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    var modal = document.createElement('div');
    modal.id = 'issue-reporter-modal';
    Object.assign(modal.style, {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,.2)',
      padding: '24px',
      width: '440px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflow: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    var title = document.createElement('h3');
    title.textContent = 'Share Feedback';
    Object.assign(title.style, {
      margin: '0 0 16px',
      fontSize: '16px',
      fontWeight: '700',
      color: '#1a1a1a'
    });

    var label = document.createElement('label');
    label.textContent = 'What\u2019s on your mind?';
    Object.assign(label.style, {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '6px',
      color: '#555'
    });

    var textarea = document.createElement('textarea');
    textarea.id = 'issue-reporter-description';
    textarea.placeholder = 'Questions, ideas, suggestions, bug reports, improvement requests \u2014 anything goes.';
    Object.assign(textarea.style, {
      width: '100%',
      minHeight: '100px',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'vertical',
      boxSizing: 'border-box',
      outline: 'none'
    });
    textarea.addEventListener('focus', function() { textarea.style.borderColor = '#3b82f6'; });
    textarea.addEventListener('blur', function() { textarea.style.borderColor = '#ddd'; });

    // R11 #45: file attachment zone — drop a screenshot or pick a file.
    var attachWrap = document.createElement('div');
    attachWrap.style.cssText = 'margin-top:12px';

    var attachZone = document.createElement('div');
    attachZone.id = 'issue-reporter-dropzone';
    attachZone.style.cssText =
      'border:2px dashed #ddd;border-radius:8px;padding:14px;' +
      'text-align:center;color:#888;font-size:13px;cursor:pointer;' +
      'transition:background .15s,border-color .15s';
    attachZone.innerHTML =
      '<span class="material-icons-outlined" style="vertical-align:middle;color:#bbb;font-size:18px">attach_file</span>' +
      ' <span id="issue-reporter-dropzone-label">Drag a screenshot here or click to attach (max 5 MB each)</span>';

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'issue-reporter-file-input';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,application/pdf,.log,.txt,.json';
    fileInput.style.display = 'none';

    var attachList = document.createElement('div');
    attachList.id = 'issue-reporter-attach-list';
    attachList.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:6px';

    attachWrap.appendChild(attachZone);
    attachWrap.appendChild(fileInput);
    attachWrap.appendChild(attachList);

    attachZone.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function(e) {
      handleFiles(e.target.files, attachList);
      fileInput.value = ''; // reset so re-picking the same file re-fires
    });
    // Drag-drop on the zone itself
    attachZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      attachZone.style.background = '#f3f4f6';
      attachZone.style.borderColor = '#3b82f6';
    });
    attachZone.addEventListener('dragleave', function() {
      attachZone.style.background = '';
      attachZone.style.borderColor = '#ddd';
    });
    attachZone.addEventListener('drop', function(e) {
      e.preventDefault();
      attachZone.style.background = '';
      attachZone.style.borderColor = '#ddd';
      handleFiles(e.dataTransfer.files, attachList);
    });
    // Also accept paste anywhere in the modal (e.g. Cmd-V a screenshot).
    modal.addEventListener('paste', function(e) {
      if (!e.clipboardData) return;
      var items = e.clipboardData.items;
      if (!items) return;
      var files = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          var f = items[i].getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        handleFiles(files, attachList);
        e.preventDefault();
      }
    });

    var meta = document.createElement('div');
    Object.assign(meta.style, {
      fontSize: '11px',
      color: '#999',
      marginTop: '8px',
      marginBottom: '16px'
    });
    meta.textContent = location.pathname + location.search + ' | ' + new Date().toISOString().slice(0, 16);

    var btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px'
    });

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.id = 'issue-reporter-cancel';
    Object.assign(cancelBtn.style, {
      padding: '8px 16px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      background: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500'
    });

    var submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.id = 'issue-reporter-submit';
    Object.assign(submitBtn.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      background: '#3b82f6',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(submitBtn);

    modal.appendChild(title);
    modal.appendChild(label);
    modal.appendChild(textarea);
    modal.appendChild(attachWrap);
    modal.appendChild(meta);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    textarea.focus();

    cancelBtn.addEventListener('click', closeModal);
    // Only close when both mousedown and mouseup land on the overlay — prevents
    // accidental closes when dragging a text selection out of the modal.
    var _mdTarget = null;
    overlay.addEventListener('mousedown', function(e) { _mdTarget = e.target; });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay && _mdTarget === overlay) closeModal();
      _mdTarget = null;
    });
    submitBtn.addEventListener('click', function() { submitIssue(textarea.value, submitBtn); });
  }

  // R11 #45: validate + queue files for upload and render preview chips.
  function handleFiles(fileList, listEl) {
    if (!fileList || !fileList.length) return;
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      if (f.size > MAX_ATTACHMENT_BYTES) {
        toast(f.name + ' is too large (max 5 MB)', 'error');
        continue;
      }
      queuedFiles.push(f);
      renderAttachChip(f, listEl);
    }
  }

  function renderAttachChip(file, listEl) {
    var chip = document.createElement('div');
    chip.className = 'issue-reporter-attach-chip';
    chip.style.cssText =
      'display:inline-flex;align-items:center;gap:6px;' +
      'padding:4px 8px;background:#f3f4f6;border-radius:6px;' +
      'font-size:12px;color:#374151;max-width:180px';
    var icon = file.type.startsWith('image/') ? 'image' : 'insert_drive_file';
    var sizeKb = (file.size / 1024).toFixed(0);
    chip.innerHTML =
      '<span class="material-icons-outlined" style="font-size:14px;color:#6b7280">' + icon + '</span>' +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(file.name) + '</span>' +
      '<span style="color:#9ca3af">' + sizeKb + ' KB</span>' +
      '<button type="button" style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:0;font-size:14px;line-height:1">×</button>';
    var removeBtn = chip.querySelector('button');
    removeBtn.addEventListener('click', function() {
      var idx = queuedFiles.indexOf(file);
      if (idx >= 0) queuedFiles.splice(idx, 1);
      chip.remove();
    });
    listEl.appendChild(chip);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function closeModal() {
    var overlay = document.getElementById('issue-reporter-overlay');
    if (overlay) overlay.remove();
  }

  function toast(msg, type) {
    if (window.Lab && window.Lab.showToast) {
      window.Lab.showToast(msg, type || 'success');
    } else {
      // Inline toast fallback for pages without shared.js
      var el = document.createElement('div');
      var bg = type === 'error' ? '#ef4444' : '#22c55e';
      Object.assign(el.style, {
        position: 'fixed', top: '20px', right: '20px', zIndex: '10001',
        background: bg, color: '#fff', padding: '12px 20px', borderRadius: '8px',
        fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,.2)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'opacity .3s'
      });
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, 4000);
    }
  }

  function getUser() {
    try {
      var u = JSON.parse(localStorage.getItem('gh_lab_user') || '{}');
      return u.login || 'unknown';
    } catch(e) { return 'unknown'; }
  }

  // R11 #45: read a File as base64 (needed for the GitHub contents API upload).
  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() {
        // result is a data URL: "data:image/png;base64,AAAA..."
        var b64 = String(reader.result).split(',')[1] || '';
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Derive a slug-safe filename and commit an attachment to the repo via
  // the GitHub contents API. Returns a public-ish URL that renders inline
  // inside a GitHub issue (github.com blob URL, which auto-redirects to
  // raw for image types).
  async function uploadAttachment(file, token) {
    var b64 = await fileToBase64(file);
    var now = new Date();
    var y = now.getUTCFullYear();
    var m = String(now.getUTCMonth() + 1).padStart(2, '0');
    var stamp = now.getTime().toString(36);
    var safeName = file.name.toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'attachment';
    var path = ATTACH_DIR + '/' + y + '/' + m + '/' + stamp + '-' + safeName;
    var url = API + '/repos/' + REPO + '/contents/' + encodeURI(path);
    var resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Issue reporter attachment: ' + safeName,
        content: b64,
      })
    });
    if (!resp.ok) {
      throw new Error('Upload failed for ' + file.name + ' (HTTP ' + resp.status + ')');
    }
    var data = await resp.json();
    // GitHub issues render inline images from blob/raw URLs on the same
    // repo as long as the viewer has access to the repo. Prefer the
    // raw.githubusercontent.com URL because the regular blob URL wraps
    // images in the GitHub blob-view chrome.
    return {
      name: file.name,
      path: path,
      url: 'https://raw.githubusercontent.com/' + REPO + '/main/' + encodeURI(path),
      htmlUrl: (data.content && data.content.html_url) || null,
      isImage: file.type.startsWith('image/'),
    };
  }

  async function submitIssue(description, btn) {
    if (!description.trim()) {
      toast('Please write something before submitting.', 'error');
      return;
    }

    var token = getToken();
    if (!token) {
      toast('You must be logged in to submit feedback.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting...';
    btn.style.opacity = '0.7';

    try {
      // R11 #45: upload any queued attachments FIRST so we can embed their
      // URLs in the issue body. Sequential upload keeps the PAT rate-limit
      // footprint low and gives us clean error messages on partial failure.
      var uploadedAttachments = [];
      if (queuedFiles.length) {
        btn.textContent = 'Uploading ' + queuedFiles.length + ' file(s)...';
        for (var i = 0; i < queuedFiles.length; i++) {
          uploadedAttachments.push(await uploadAttachment(queuedFiles[i], token));
        }
        btn.textContent = 'Submitting...';
      }

      var user = getUser();
      var breadcrumb = document.querySelector('.breadcrumb, .doc-breadcrumb, [data-breadcrumb]');
      var heading = document.querySelector('h1');
      var context = (breadcrumb ? breadcrumb.textContent.trim() : '') || (heading ? heading.textContent.trim() : '');
      var meta = [
        '**Reported by:** @' + user,
        '**URL:** `' + location.href + '`',
        '**Context:** ' + (context || document.title),
        '**Time:** ' + new Date().toISOString(),
        '**Viewport:** ' + window.innerWidth + 'x' + window.innerHeight,
        '**User Agent:** `' + navigator.userAgent + '`'
      ].join('\n');

      // Build the attachment section as a markdown list. Images render
      // inline; other files link out to the GitHub blob view.
      var attachBlock = '';
      if (uploadedAttachments.length) {
        attachBlock = '\n\n---\n\n**Attachments:**\n\n' +
          uploadedAttachments.map(function(a) {
            if (a.isImage) {
              return '![' + a.name + '](' + a.url + ')';
            }
            return '[' + a.name + '](' + (a.htmlUrl || a.url) + ')';
          }).join('\n\n');
      }

      var body = description.trim() + '\n\n---\n\n' + meta + attachBlock;

      var resp = await fetch(API + '/repos/' + REPO + '/issues', {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '[Feedback] ' + description.trim().slice(0, 80),
          body: body,
          labels: ['feedback']
        })
      });

      if (!resp.ok) {
        var err = await resp.text();
        throw new Error('GitHub API ' + resp.status);
      }

      var issue = await resp.json();
      closeModal();
      var msg = 'Feedback submitted (#' + issue.number + ')';
      if (uploadedAttachments.length) msg += ' with ' + uploadedAttachments.length + ' attachment(s)';
      msg += '. Thanks!';
      toast(msg, 'success');
    } catch (e) {
      console.error('Issue reporter error:', e);
      btn.disabled = false;
      btn.textContent = 'Submit';
      btn.style.opacity = '1';
      toast('Failed to submit: ' + e.message, 'error');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
