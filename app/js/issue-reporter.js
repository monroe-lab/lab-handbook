/* Monroe Lab – Floating Issue Reporter
   Adds a floating button (bottom-left) that opens a modal to submit GitHub issues.
   Auto-captures: page path, page title, timestamp, viewport size, user agent.
   Uses PAT from localStorage (gh_lab_token) to create issues via GitHub Issues API.
*/
(function() {
  'use strict';

  var REPO = 'monroe-lab/lab-handbook';
  var API = 'https://api.github.com';
  var TOKEN_KEY = 'gh_lab_token';

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

  function createButton() {
    var btn = document.createElement('button');
    btn.id = 'issue-reporter-btn';
    btn.setAttribute('aria-label', 'Report an issue');
    btn.textContent = '\u26A0\uFE0F';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '80px',
      left: '18px',
      zIndex: '9999',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: 'none',
      background: '#ef4444',
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

    var overlay = document.createElement('div');
    overlay.id = 'issue-reporter-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '10000',
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
      width: '400px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflow: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    var title = document.createElement('h3');
    title.textContent = 'Report an Issue';
    Object.assign(title.style, {
      margin: '0 0 16px',
      fontSize: '16px',
      fontWeight: '700',
      color: '#1a1a1a'
    });

    var label = document.createElement('label');
    label.textContent = 'Describe the problem:';
    Object.assign(label.style, {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '6px',
      color: '#555'
    });

    var textarea = document.createElement('textarea');
    textarea.id = 'issue-reporter-description';
    textarea.placeholder = 'What went wrong? What did you expect to happen?';
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
    submitBtn.textContent = 'Submit Issue';
    submitBtn.id = 'issue-reporter-submit';
    Object.assign(submitBtn.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      background: '#ef4444',
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
    modal.appendChild(meta);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    textarea.focus();

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });
    submitBtn.addEventListener('click', function() { submitIssue(textarea.value, submitBtn); });
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

  async function submitIssue(description, btn) {
    if (!description.trim()) {
      toast('Please describe the issue.', 'error');
      return;
    }

    var token = getToken();
    if (!token) {
      toast('You must be logged in to report an issue.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting...';
    btn.style.opacity = '0.7';

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

    var body = description.trim() + '\n\n---\n\n' + meta;

    try {
      var resp = await fetch(API + '/repos/' + REPO + '/issues', {
        method: 'POST',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '[Issue Report] ' + description.trim().slice(0, 80),
          body: body,
          labels: ['bug-report']
        })
      });

      if (!resp.ok) {
        var err = await resp.text();
        throw new Error('GitHub API ' + resp.status);
      }

      var issue = await resp.json();
      closeModal();
      toast('Issue #' + issue.number + ' created. Thank you!', 'success');
    } catch (e) {
      console.error('Issue reporter error:', e);
      btn.disabled = false;
      btn.textContent = 'Submit Issue';
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
