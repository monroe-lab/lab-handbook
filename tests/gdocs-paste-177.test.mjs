// Unit test for issue #177 — Google Docs paste mangles numbered lists.
//
// Exercises the googleDocsHtmlToMarkdown / walkHtmlForMarkdown logic against
// realistic clipboard HTML samples that Google Docs actually produces. The
// functions are duplicated below because editor-modal.js is loaded as a
// classic script (IIFE wrapped), not an ES module, so there's no clean
// import path. If you change the production functions, copy the changes
// in here and re-run: `cd /path/to/lab && node tests/gdocs-paste-177.test.mjs`.
//
// Requires: `npm install jsdom` (one-off, not part of the deploy).
import { JSDOM } from 'jsdom';

const dom = new JSDOM('');
global.DOMParser = dom.window.DOMParser;
global.Node = dom.window.Node;

// ─── Functions under test (mirror of app/js/editor-modal.js) ───

function googleDocsHtmlToMarkdown(html) {
  let doc;
  try { doc = new DOMParser().parseFromString(html, 'text/html'); }
  catch (e) { return ''; }
  if (!doc || !doc.body) return '';
  doc.body.querySelectorAll('b').forEach(function(b) {
    const style = (b.getAttribute('style') || '').toLowerCase().replace(/\s+/g, '');
    if (style.indexOf('font-weight:normal') !== -1 || style.indexOf('font-weight:400') !== -1) {
      const parent = b.parentNode;
      while (b.firstChild) parent.insertBefore(b.firstChild, b);
      parent.removeChild(b);
    }
  });
  doc.body.querySelectorAll('meta, style, script, link').forEach(function(el) { el.remove(); });
  let md = walkHtmlForMarkdown(doc.body, { listStack: [] });
  md = md.replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  return md;
}

function walkHtmlForMarkdown(node, ctx, inline) {
  let out = '';
  const children = node.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 3) {
      let t = child.nodeValue.replace(/[\t\n\r ]+/g, ' ');
      if (!inline && (out === '' || /\n$/.test(out))) t = t.replace(/^\s+/, '');
      out += t;
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = child.tagName.toLowerCase();
    let inner;
    switch (tag) {
      case 'p':
      case 'div':
        inner = walkHtmlForMarkdown(child, ctx, false).replace(/^\s+|\s+$/g, '');
        if (!inner) break;
        if (ctx.listStack.length) out += inner + '\n';
        else out += inner + '\n\n';
        break;
      case 'br': out += '\n'; break;
      case 'strong': case 'b':
        inner = walkHtmlForMarkdown(child, ctx, true);
        out += wrapInline(inner, '**');
        break;
      case 'em': case 'i':
        inner = walkHtmlForMarkdown(child, ctx, true);
        out += wrapInline(inner, '*');
        break;
      case 'u': case 'sub': case 'sup': case 'font':
        out += walkHtmlForMarkdown(child, ctx, true);
        break;
      case 'a':
        inner = walkHtmlForMarkdown(child, ctx, true).replace(/^\s+|\s+$/g, '');
        let href = child.getAttribute('href') || '';
        href = href.replace(/^https?:\/\/(?:www\.)?google\.com\/url\?q=([^&]+).*$/, function(m, u) {
          try { return decodeURIComponent(u); } catch (e) { return m; }
        });
        if (href && inner) out += '[' + inner + '](' + href + ')';
        else out += inner;
        break;
      case 'ol': case 'ul':
        ctx.listStack.push({ type: tag, index: 0 });
        inner = walkHtmlForMarkdown(child, ctx, false);
        ctx.listStack.pop();
        if (ctx.listStack.length === 0) out += '\n' + inner.replace(/\n+$/, '') + '\n\n';
        else out += inner;
        break;
      case 'li':
        const top = ctx.listStack[ctx.listStack.length - 1] || { type: 'ul', index: 0 };
        top.index++;
        const marker = top.type === 'ol' ? (top.index + '. ') : '- ';
        const indent = '   '.repeat(Math.max(0, ctx.listStack.length - 1));
        inner = walkHtmlForMarkdown(child, ctx, false).replace(/^\s+|\s+$/g, '');
        const lines = inner.split('\n');
        out += indent + marker + lines[0];
        for (let k = 1; k < lines.length; k++) out += '\n' + lines[k];
        out += '\n';
        break;
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        inner = walkHtmlForMarkdown(child, ctx, false).replace(/^\s+|\s+$/g, '');
        out += '\n' + '#'.repeat(parseInt(tag.charAt(1), 10)) + ' ' + inner + '\n\n';
        break;
      case 'code': out += '`' + walkHtmlForMarkdown(child, ctx, true) + '`'; break;
      case 'pre': out += '\n```\n' + child.textContent + '\n```\n\n'; break;
      case 'blockquote':
        inner = walkHtmlForMarkdown(child, ctx, false).replace(/^\s+|\s+$/g, '');
        out += inner.split('\n').map(function(l) { return '> ' + l; }).join('\n') + '\n\n';
        break;
      case 'hr': out += '\n---\n\n'; break;
      case 'span':
        const s = (child.getAttribute('style') || '').toLowerCase();
        const bold = /font-weight:\s*(?:bold|600|700|800|900)/.test(s);
        const italic = /font-style:\s*italic/.test(s);
        inner = walkHtmlForMarkdown(child, ctx, true);
        if (italic) inner = wrapInline(inner, '*');
        if (bold) inner = wrapInline(inner, '**');
        out += inner;
        break;
      default: out += walkHtmlForMarkdown(child, ctx, inline);
    }
  }
  return out;
}

function wrapInline(inner, delim) {
  const m = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m || !m[2]) return inner;
  return m[1] + delim + m[2] + delim + m[3];
}

// ─── Test fixtures ───

const fixtures = [
  {
    name: 'Real Google Docs numbered list paste',
    // What Google Docs actually puts on the clipboard for a numbered list.
    // The outer <b style="font-weight:normal"> is the offending wrapper.
    html: `<meta charset='utf-8'><b style="font-weight:normal" id="docs-internal-guid-abc123">
      <ol style="margin-top:0;margin-bottom:0;">
        <li><p dir="ltr"><span>Weigh 80 mg of tissue</span></p></li>
        <li><p dir="ltr"><span>Add 800 μL of Buffer AP1</span></p></li>
        <li><p dir="ltr"><span>Vortex and incubate at 65°C</span></p></li>
      </ol></b>`,
    expect: /^1\. Weigh 80 mg of tissue\n2\. Add 800 μL of Buffer AP1\n3\. Vortex and incubate at 65°C$/,
  },
  {
    name: 'Bullet list paste',
    html: `<meta charset='utf-8'><b style="font-weight:normal" id="docs-internal-guid-xyz">
      <ul>
        <li><p dir="ltr"><span>First item</span></p></li>
        <li><p dir="ltr"><span>Second item</span></p></li>
      </ul></b>`,
    expect: /^- First item\n- Second item$/,
  },
  {
    name: 'Inline bold via span style',
    html: `<meta charset='utf-8'><b style="font-weight:normal" id="docs-internal-guid-1">
      <p dir="ltr"><span>Mix with </span><span style="font-weight:700">800 μL</span><span> of buffer</span></p></b>`,
    expect: /^Mix with \*\*800 μL\*\* of buffer$/,
  },
  {
    name: 'Inline italic via span style',
    html: `<meta charset='utf-8'><b style="font-weight:normal" id="docs-internal-guid-1">
      <p dir="ltr"><span>The </span><span style="font-style:italic">in vivo</span><span> assay</span></p></b>`,
    expect: /^The \*in vivo\* assay$/,
  },
  {
    name: 'Hyperlink with Google redirect',
    html: `<b style="font-weight:normal" id="docs-internal-guid-1">
      <p dir="ltr"><span>See </span><a href="https://www.google.com/url?q=https://example.com/protocol&sa=D&source=editors"><span>the protocol</span></a></p></b>`,
    expect: /\[the protocol\]\(https:\/\/example\.com\/protocol\)/,
  },
  {
    name: 'Headings preserved',
    html: `<b style="font-weight:normal" id="docs-internal-guid-1">
      <h2 dir="ltr"><span>Materials</span></h2>
      <p dir="ltr"><span>Buffer A, Buffer B</span></p></b>`,
    expect: /## Materials\n\nBuffer A, Buffer B/,
  },
  {
    name: 'Nested ordered list',
    html: `<b style="font-weight:normal" id="docs-internal-guid-1">
      <ol>
        <li><p>Step one</p>
          <ol>
            <li><p>Sub-step a</p></li>
            <li><p>Sub-step b</p></li>
          </ol>
        </li>
        <li><p>Step two</p></li>
      </ol></b>`,
    expect: /1\. Step one\n   1\. Sub-step a\n   2\. Sub-step b\n2\. Step two/,
  },
  {
    name: 'Multiple paragraphs',
    html: `<b style="font-weight:normal" id="docs-internal-guid-1">
      <p dir="ltr"><span>First paragraph.</span></p>
      <p dir="ltr"><span>Second paragraph.</span></p>
      <p dir="ltr"><span>Third paragraph.</span></p></b>`,
    expect: /^First paragraph\.\n\nSecond paragraph\.\n\nThird paragraph\.$/,
  },
];

let pass = 0, fail = 0;
for (const fx of fixtures) {
  const out = googleDocsHtmlToMarkdown(fx.html);
  const ok = fx.expect.test(out);
  if (ok) { pass++; console.log('✓ ' + fx.name); }
  else {
    fail++;
    console.log('✗ ' + fx.name);
    console.log('  expected match: ' + fx.expect);
    console.log('  got:');
    console.log(out.split('\n').map(l => '    ' + JSON.stringify(l)).join('\n'));
  }
}

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
