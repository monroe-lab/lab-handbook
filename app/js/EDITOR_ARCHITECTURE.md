# Editor & Viewer Architecture

This doc describes how the markdown editing/viewing system in the lab handbook actually works, and **why** the various hacks exist. None of this is obvious from the code — it's the result of a lot of incremental work to make editing feel natural (especially on phones, with images, with callouts, with tables). Read this before touching `editor-modal.js`, `renderMarkdown`, the image pipeline, or any of the page-level wrappers (`notebooks.html`, `protocols.html`, `projects.html`).

## High-level shape

There is **one** editor module: `app/js/editor-modal.js`. Everything that edits or renders markdown calls into it via `window.Lab.editorModal`:

| Export | Used by | Purpose |
|---|---|---|
| `open(filePath)` | `index.html`, `inventory.html`, `projects.html`, `graph.html` | Modal popup editor (overlay-style, for quick edits and object cards) |
| `initFullpage(container, content, filePath, sha)` | `notebooks.html`, `protocols.html` | Full-page Toast UI editor mounted into a host element. Returns `{ editor, getMarkdown, save }` |
| `renderMarkdown(md)` → HTML | All viewer pages | View-mode renderer (uses `marked`, NOT Toast UI) |
| `loadMarked()` | Eager preloaders | Loads the `marked` CDN script |

The **editor itself** is shared. The **page-level glue** around it (load file → render → start edit → save → re-render with cached images) is currently **duplicated** across `notebooks.html`, `protocols.html`, and `projects.html`. That's a known wart; see "Known structural issues" at the bottom.

## The two-parser problem

The single biggest source of subtle bugs is that **edit mode and view mode use different markdown parsers**:

- **Edit mode**: Toast UI Editor's internal CommonMark parser (strict).
- **View mode**: `marked` library with `{ breaks: true }` (loose: every newline becomes `<br>`).

These two engines have different opinions about:
- Trailing whitespace (Toast UI strips it → markdown hard breaks `  \n` are silently dropped on edit)
- Single newlines vs blank lines (Toast UI collapses, `marked` with `breaks:true` does not)
- HTML passthrough in tables
- Loose vs tight lists

**Concrete bug this caused** (2026-04-08): the daily-entry template used `**Person:** name  \n**Date:** ...`. The viewer rendered it as two lines (correct). The editor stripped the trailing whitespace on first save and the lines collapsed into one. Fix was to use a blank line between the fields. **The lesson**: never rely on Markdown hard breaks. Use blank lines = real paragraph breaks. They survive both parsers.

If you're tempted to "just swap `marked` for Toast UI's converter" to fix this once and for all: **don't, without reading the rest of this doc first.** Toast UI's converter does not know about our custom callouts, our wikilinks, our `obj://` / `inventory://` schemes, our YouTube/video placeholders, or our `<img style="max-width">` resize round-trip. Replacing the engine wholesale would break all of those. The right move is small, surgical fixes inside `renderMarkdown` (or content-side conventions like "always use blank lines").

## The image pipeline

This is the most load-bearing part of the system. **Every step here exists for a reason; do not "simplify" without understanding which reason.**

### Capture
- Hidden `<input type="file" accept="image/*">` mounted in the toolbar (`editor-modal.js:1296+`).
- A second hidden input with `capture="environment"` (`:1084+`) for the phone camera button — opens the rear camera directly so you can take a photo and have it land in the doc.

### Resize before upload
- `resizeImage(file)` (`:18`) runs the file through a `<canvas>` and re-encodes as JPEG at `IMG_QUALITY` if the original is large or has dimensions over `MAX_IMG_DIM`.
- Reason: phone photos are 4–10 MB. Uncompressed they choke the GitHub Contents API and inflate the repo. Resizing client-side keeps uploads fast and the repo small.

### Upload
- `uploadMedia(file, callback)` (`:1308`) and `triggerMobileUpload(file, editor, containerEl)` (`:1130`) base64-encode the resized file and PUT it to `docs/images/<slug>` via the GitHub Contents API.
- Slug = lowercase filename with non-`[a-z0-9._-]` collapsed to `-`.

### Insertion
- `editor.replaceSelection('\n![<slug>](images/<slug>)\n')`. Path is **relative** in the markdown so it works regardless of where the file lives.

### Instant preview before deploy (the "took forever" part)
The problem: GitHub Pages takes ~40s to redeploy. If we just inserted `![](images/foo.jpg)` and let the browser load it, the user would see a broken image until the deploy finished.

The solution is a multi-piece dance:

1. **`_dataUrlToPath` map** (`:1815`) — runtime-only mapping from `data:image/...` base64 URL → real repo path.
2. After upload, the editor swaps the rendered `<img>`'s `src` to the data URL (so it shows immediately) and stashes the real path in `dataset.realSrc`.
3. **`setupEditorImageFallback(containerEl)`** (`:1687`) — capture-phase `error` listener on the editor surface. If an `<img>` to `/lab-handbook/images/...` 404s (because it's not deployed yet), it fetches the file via the authenticated GitHub Contents API and substitutes a base64 data URL. Capture phase is required because Toast UI re-renders the editor surface lazily and we need to catch errors on dynamically-inserted images.
4. **`getMarkdownClean(editor)`** (`:1891`) — on save, `restoreDataUrls(md)` scans the markdown that ProseMirror gave us back. If ProseMirror has inlined any `data:image/...` URLs (which it does, because the user "sees" them as data URLs), we look them up in `_dataUrlToPath` and rewrite them back to the real `images/...` path. There's a prefix-match fallback (first 80 chars) because ProseMirror sometimes escapes characters in the URL.
5. **`unresolveImagePaths(md)`** strips the `/lab-handbook/` prefix back out so the saved markdown is portable across environments.

**Net effect**: the user takes a phone photo → it's resized → uploaded → inserted → previewed instantly via data URL → saved with a clean relative path → eventually deploys to Pages → next page load reads the real file. No flicker, no broken image, no "what just happened".

**Do not touch any of this without testing the full path on a phone.**

### Image resize
- `_imgSizes` (`:1812`) maps src → percent (`'25%'`, `'50%'`, etc).
- Click an image in the editor → a small toolbar appears with size buttons (`:1526+`).
- Toolbar is positioned via `getBoundingClientRect()` + `ww.scrollTop`, **not** appended next to the image, because ProseMirror does not allow arbitrary inline DOM children inside the editable area. Putting the toolbar inside `.toastui-editor-ww-container` (which is *outside* `.ProseMirror`) avoids ProseMirror nuking it.
- On save, `applyImageSizes(md)` (`:1817`) rewrites `![alt](src)` to `<img src="" alt="" style="max-width:N%">`.
- On load, `loadImageSizes(md)` (`:1733`) reverses it: scans `<img>` tags, extracts `max-width` from `style`, populates `_imgSizes`, converts back to `![alt](src)` for the editor.
- Matching is done by **filename**, not full path, because the path representation differs between sessions (annotation creates a new path, etc).

### Annotation
- Double-click an image → `Lab.annotate.open(img, callback)` (`app/js/annotate.js`).
- Annotation creates a new image file with a derived path and returns `(annotatedPath, dataUrl)`.
- The chunk at `editor-modal.js:1430-1473` then:
  1. Carries the size from old path to new path (`_imgSizes[annotatedPath] = oldSize`).
  2. Mode-switches `wysiwyg → markdown → setMarkdown → wysiwyg`. This is the only safe way to swap an image src — direct DOM manipulation on a ProseMirror node corrupts the document model.
  3. Re-applies the data-URL preview to the new annotated image so the user sees the annotation immediately.
  4. Re-applies sizes (because the swap recreates DOM nodes).

### Scroll lock
- ProseMirror has a habit of jumping the editor scroll position to the top whenever the document tree mutates (size change, src swap, mode change).
- `lockScroll()` (`:1488`) snapshots `scrollTop` on ProseMirror, the WW container, AND the page scroll element (`#protoMain` or `#nbMain`), then for the next 200ms it intercepts any `scroll` event on those elements and reverts to the snapshotted position.
- Without this, every image click would scroll the page to the top, which felt awful.

## The callout system (admonitions)

Two formats coexist:

- **Legacy**: `??? warning "Title"` followed by 4-space indented body. This is the old MkDocs admonition syntax inherited from the original lab handbook content.
- **Current**: `> ⚠️ **Title**` followed by `> body lines` (consecutive blockquote lines). One blank line ends the callout.

Why the migration: Toast UI has no idea what `???` is. It treats it as a heading (`???` = three question marks, parsed weird). Blockquote-with-emoji-prefix renders fine in Toast UI as a regular blockquote (no special highlighting in edit mode, but content is preserved correctly), and `renderMarkdown` upgrades it to a styled `<details>` callout in the viewer.

`migrateAdmonitions(md)` (`:196`) converts legacy `???` blocks to blockquote form **on edit**, so old content gets cleaned up the next time someone opens it. One-way migration.

`renderMarkdown` (`:220`) handles **both** formats:
1. Extracts legacy `???` blocks into placeholders (`<!--admonition-N-->`).
2. Extracts blockquote callouts via the regex at `:234`. Critical detail: matches `^> *<icon> \*\*<title>\*\*` followed by *consecutive* `>` lines. A blank line ends the match — that's how multiple callouts in a row stay separate.
3. Runs the rest through `marked`.
4. Re-injects each callout as a `<details class="admonition admonition-warning">` with the body parsed separately.

**The multi-line bleed fix** (`:238`):

```js
bodyMd = bodyMd.replace(/\n/g, '  \n');
```

Inside a callout body, every `\n` is replaced with `  \n` (markdown hard break) before being parsed. Without this, `marked` collapses consecutive lines into one paragraph, and a multi-line callout body looks like one giant run-on sentence. **This trick is the one place where we deliberately use hard breaks** — it's safe here because the body never goes through the editor (it's view-only post-processing).

Icons (`ADM_ICONS` at `:193`):
- `🔀` (variant) — variant/alternative
- `⚠️` (warning) — warning
- `ℹ️` (note) — note/info
- `💡` (tip) — tip

`CALLOUT_COLORS` at `:214` is the reverse map.

## The table system

Toast UI handles tables natively in WYSIWYG, but with two problems we had to fix:

1. **Empty header cells were uneditable**: clicking on the header row of a fresh table did nothing because the `<th>` was zero-height. Fixed with CSS at `editor-modal.js:120`:
   ```css
   .em-surface .toastui-editor-contents thead th {
     min-height: 32px !important;
     min-width: 60px !important;
     height: 32px !important;
     cursor: text !important;
   }
   ```
   The `min-height` and `cursor:text` make the header row feel clickable.

2. **Empty header cells got stripped on save**: completely empty `<th>` elements would be lost in the markdown round-trip. We inject a zero-width space (`\u200B`) into otherwise-empty header cells to keep them alive. On save, `getMarkdownClean()` (`:1894`) strips all zero-width spaces:
   ```js
   md = md.replace(/\u200B/g, '');
   ```

3. **Toast UI inserts `<br>` on empty lines, which breaks `marked`'s table parser**. `renderMarkdown` strips standalone `<br>` lines at `:245`:
   ```js
   processed = processed.replace(/^\s*<br>\s*$/gm, '');
   ```

4. **Long content overflows**: forced `table-layout: fixed`, `word-break: break-all`, `max-width: 0` on cells (`:118-119`). Without `max-width: 0`, `table-layout: fixed` doesn't actually fix column widths.

## Wikilink round-tripping

Toast UI has no idea what `[[wikilinks]]` are and mangles the double brackets. We work around this:

- **Before editor**: `wikilinksToLinks(md)` (`:1623`) converts `[[slug]]` → `[title](obj://slug)`. The `obj://` scheme is safe because Toast UI handles it as a regular link. Title comes from the object index lookup.
- **On save**: `linksToWikilinks(md)` (`:1650`) converts back. Detected by the `obj://` href.
- **In view mode**: `renderMarkdown` patches `obj://` links that ended up inside table cells (`:262`) because `marked` doesn't always parse them inside table cells correctly. After parsing, `Lab.wikilinks.processRendered(el)` walks the rendered DOM and converts `obj://` anchor elements into proper styled pills with popups. See `app/js/wikilinks.js`.

Same pattern for `inventory://`.

## Media embed round-tripping (YouTube + video)

Toast UI strips `<iframe>` and `<video>` tags in WYSIWYG. We work around it:

- **Before editor**: `mediaToPlaceholders(md)` (`:1775`) converts:
  - `<iframe src="youtube.com/embed/ID">` → `[![▶ YouTube video](https://img.youtube.com/vi/ID/mqdefault.jpg)](https://www.youtube.com/watch?v=ID)` — a clickable thumbnail link, which Toast UI handles fine.
  - `<video><source src="..."></video>` → `[🎬 Video: name](videofile://path)` — a placeholder link with a custom scheme.
- **On save**: `placeholdersToMedia(md)` (`:1788`) converts both back. There are duplicate regexes to handle "escaped versions from Toast UI" because ProseMirror sometimes inserts backslashes around `?` and `(`.

## Save flow (the duplicated glue)

Each consumer page (`notebooks.html`, `protocols.html`, `projects.html`) implements roughly this flow:

1. `loadDoc(path)`: fetch file via `Lab.gh.fetchFile`, run through `renderMarkdown`, dump into a `.X-rendered` div.
2. `startEdit()`: fetch again (or use cached body), call `Lab.editorModal.initFullpage(surface, content, filePath, sha)`, store the returned `editorInstance`.
3. `saveDoc()`:
   1. `var md = editorInstance.getMarkdown()` (which calls `getMarkdownClean` internally → strips ZWSP, restores data URLs, converts links to wikilinks, unresolves image paths, converts placeholders back to media, applies image sizes).
   2. **Capture loaded `<img>` srcs from the editor surface** before destroying the editor. This is the "instant render" trick at the page level: the rendered viewer also needs the data URLs because the file isn't deployed yet either.
   3. `Lab.gh.saveFile(filePath, md, sha, message)`.
   4. Re-render via `Lab.editorModal.renderMarkdown(md)`.
   5. Walk the rendered `<img>` tags and substitute the captured editor data URLs by filename. Without this, the just-saved view would briefly show broken images until the Pages deploy completes.

**This whole flow is currently duplicated in three files**. See "Known structural issues" below.

## Known structural issues / future work

1. **Two-parser problem (Toast UI + `marked`)** — root cause of view/edit drift. Fixing it wholesale (swap `marked` for Toast UI's converter) is risky because of all the round-trip hacks above. Surgical fixes inside `renderMarkdown` are the safer path.

2. **Page glue is duplicated**. `notebooks.html`, `protocols.html`, `projects.html` each carry their own ~150-line implementation of the load/render/edit/save/re-render flow. They are currently in sync by accident. Pulling this into a shared `Lab.editorModal.mountSurface(container, options)` would cut each consumer page in half and guarantee consistency. **Do this before adding more consumer pages.**

3. **Per-page rendered CSS is duplicated**. `.proto-rendered`, `.nb-rendered`, `.proj-section` each define h1/h2/table/code styles separately. Should be one shared `.lab-rendered` class.

4. **`renderMarkdown` is the only place where view-only logic lives**. If you change it, test:
   - Daily notebook entry (paragraph spacing)
   - A protocol with an image (image rendering, sizes)
   - A protocol with a callout (multi-line callout body, no bleed)
   - A protocol with a table (no `<br>` in table, header row editable in edit mode)
   - A doc with `[[wikilinks]]` inside a table cell
   - A doc with a YouTube embed and a local video
   - A doc with a `???` legacy admonition (should still render as styled callout)

5. **`getMarkdownClean` is the only place where save-side cleanup lives**. If you change it, test:
   - Save a doc with a freshly-uploaded image (data URL → real path)
   - Save a doc after annotating an image (size carries over)
   - Save a doc after resizing an image (max-width preserved)
   - Save a doc with an empty table header cell (ZWSP stripped, cell preserved)
   - Save a doc with a YouTube placeholder (round-trips back to iframe)

## Files

| File | Lines | Role |
|---|---|---|
| `app/js/editor-modal.js` | ~2080 | The whole editor: Toast UI loader, image pipeline, callout/table fixes, save round-trip, popup modal, fullpage mount, link insert modal, mobile sheet |
| `app/js/wikilinks.js` | ~205 | Post-rendering walker that converts `obj://` anchors to styled pills with popups |
| `app/js/annotate.js` | — | Image annotation UI (called from editor-modal on dblclick) |
| `app/js/shared.js` | ~275 | `Lab.escHtml`, `Lab.parseFrontmatter`, `Lab.buildFrontmatter`, `Lab.postProcessImages`, `Lab.showToast`, `Lab.gh` (GitHub API client) |
| `app/notebooks.html` | ~600 | Notebook page: sidebar tree + duplicated load/edit/save flow |
| `app/protocols.html` | ~1250 | Protocols page: sidebar + nav config + drag/drop + duplicated load/edit/save flow + rename/duplicate/delete |
| `app/projects.html` | ~380 | Projects page: section list + duplicated edit flow |
| `app/inventory.html` | — | Inventory: uses `Lab.editorModal.open()` for popup edits |
| `app/index.html` | — | Bulletin: uses `Lab.editorModal.open('docs/bulletin.md')` |
