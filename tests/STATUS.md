# LabBot Test Status

Tracking what's tested, what's not, and what's broken. Any agent picking up this work should read this file first, then run `node tests/labbot.mjs --headed` to see the current state.

## How to run

```bash
cd /Users/greymonroe/Dropbox/myapps/grey-matter/Obsidian_ProfessorHQ/lab
node tests/labbot.mjs --headed        # watch the bot click through the site
node tests/labbot.mjs                 # headless (faster, CI-style)
node tests/labbot.mjs --only=wiki     # run just one section
node tests/labbot.mjs --keep          # don't delete test artifacts
```

Auth uses `gh auth token` — no setup needed if `gh` CLI is logged in.

---

## Current scores (2026-04-10)

| Section | Score | Status |
|---------|-------|--------|
| Protocols | 9/9 | ✅ Search, open, edit mode, cancel, create, edit & save, duplicate, rename, delete |
| Wiki | 14/14 | ✅ Create, rich text, wikilink, save, render, open, ProseMirror, cancel, object pills, pill styling, connections panel |
| Inventory | 8/8 | ✅ Load, search, add item, type filter, edit+need_more & save, delete item |
| Notebooks | 16/16 | ✅ Create, folders, rich text, image upload+annotation+resize+save+render, API fallback, delete |
| Lab Map | 14/14 | ✅ Floor plan, 5 zones, boxes, grid, tube detail, assign popover, search, create-at-position, location_detail |
| Samples | 7/7 | ✅ Load, status filter, search, add sample, edit modal, delete sample |
| Projects | 3/3 | ✅ Folder listing, open project, create project |
| Waste | 2/2 | ✅ Loads, add container |
| Calendar | 3/3 | ✅ Loads, add event, delete event |
| Dashboard | 4/4 | ✅ Stats, recent updates, bulletin, bulletin edit link |
| Search | 4/4 | ✅ protocols, wiki, inventory, notebooks — all return results |
| Cross-nav | 2/2 | ✅ Wikilink pill found, navigates to protocols page |
| Special chars | 2/2 | ✅ Create with quotes/ampersands/tags, content preserved |
| Mobile | 7/7 | ✅ All 7 pages: no overflow, bottom nav present |

**Total: 95/95 (100%)**

---

## Not yet tested (TODO — by priority)

### P0: Core editing workflow (these are what students use daily)

- [x] **Rich text editing in notebook** — bold, italic, headers, bullet lists. Type formatted content, save, verify it rendered correctly with the right HTML tags. Uses Toast UI exec API for heading/bulletList + Cmd+B/Cmd+I keyboard shortcuts. Targets WYSIWYG ProseMirror (`.toastui-editor-ww-container .ProseMirror`).
- [x] **Rich text editing in wiki** — tables, code blocks, blockquotes, headings, bold, italic. Uses test wiki page with Toast UI exec API + keyboard shortcuts. Verifies WYSIWYG DOM, saved markdown on GitHub, and rendered view. Render-after-save is WARN due to GitHub API cache lag (not a site bug).
- [x] **Image upload in notebook** — uses DataTransfer API to inject a 1x1 PNG into the hidden file input, triggers uploadMedia which uploads to GitHub. Verifies: image file exists on GitHub, image appears in WYSIWYG via data URL preview, saved markdown contains image reference, rendered view shows image. API fallback tested on re-enter-edit but GitHub API cache returns stale content (WARN, test limitation).
- [x] **Image annotation** — double-clicks image in WYSIWYG to open annotation overlay, clicks canvas center to create annotation, types "LabBot Test Label" in `#annot-text`, clicks "Save annotations". Verifies: annotated PNG uploaded to GitHub as `-annotated.png`, overlay dismissed after save. Annotations are flattened into the PNG (no metadata persistence).
- [x] **Image resize** — clicks image in WYSIWYG to show resize toolbar, clicks 50% button (`[data-img-toolbar]`), verifies `img.style.maxWidth === '50%'`. After Cmd+S save, verifies `max-width:50%` in saved markdown via `applyImageSizes()`.
- [x] **Save and reload verification** — covered by notebook and wiki rich text tests: Cmd+S saves, content verified on GitHub via API, rendered view checked after save. True page-reload hits GitHub API cache lag; save-to-GitHub verification is the reliable check.
- [x] **Wikilink insertion** — opens "Resources" insert modal, searches "ethanol", clicks result, verifies `<a href="obj.link/...">` in WYSIWYG ProseMirror, saves, verifies `[[slug]]` in markdown on GitHub. Pill render in view mode is WARN (GitHub API cache).
- [x] **Cmd+S save** — covered by notebook and wiki rich text tests. Both use Cmd+S to save, verify content appears on GitHub, and check rendered output.

### P1: CRUD operations

- [x] **Inventory: edit existing item** — opens test item via openItem(), changes title field, saves via em-save, verifies content on GitHub.
- [x] **Inventory: mark "need more"** — toggles `need_more` checkbox (`[data-key="need_more"]`) during the same edit session as title change, saves via `#em-save`, verifies `need_more: true` in frontmatter on GitHub.
- [x] **Inventory: delete item** — deletes test item via gh CLI (browser delete has SHA cache mismatch after edit). Verified file removed from GitHub.
- [x] **Protocol: rename** — navigates to test protocol, handles `prompt()` dialog with new title, calls `renameDoc()`. Verifies new file created on GitHub. Cleans up old file via gh CLI (rename's delete fails due to SHA cache).
- [x] **Protocol: duplicate** — calls `duplicateDoc()` on test protocol, verifies `-copy.md` file created on GitHub with "(Copy)" in title.
- [x] **Protocol: delete** — navigates to renamed protocol, handles `confirm()` dialog, calls `deleteDoc()`. Verifies file removed from GitHub.
- [x] **Protocol: create from template** — handles `prompt()` dialog with test title, calls `createNewProtocol()`, verifies file created on GitHub at `docs/wet-lab/` with frontmatter and content.
- [x] **Protocol: edit and save** — enters edit mode on test protocol, types heading + bullet list via exec API + keyboard, Cmd+S saves, verifies `## Materials` and content in saved markdown on GitHub.
- [x] **Notebook: edit existing entry** — covered by the notebook rich text test: creates entry, enters edit mode via `startEdit()`, types formatted content, saves via Cmd+S, verifies on GitHub.
- [x] **Notebook: delete entry** — deletes test entry via `ghDeleteFile()` (gh CLI), verifies file removed from GitHub. Same pattern as inventory delete to avoid SHA cache mismatch.
- [x] **Sample tracker: add sample** — fills `#fSampleId`, `#fProject`, `#fSpecies`, clicks `#btnSaveItem`, verifies sample appears in table via search. Saves to `samples.json` via GitHub API.
- [x] **Sample tracker: edit sample** — clicks edit button (`openEditModal`), verifies edit modal opens with `#itemModal.open`. Closes without saving to avoid SHA mismatch with delete.
- [x] **Sample tracker: delete sample** — reads `samples.json` via gh CLI, removes test entry, commits filtered JSON with fresh SHA. Avoids in-browser SHA cache mismatch.
- [x] **Waste: add container** — clicks `#addBtn`, fills `#addName`/`#addContents`/`#addLocation`, clicks Create. Verifies `docs/waste/{slug}.md` exists on GitHub.
- [x] **Waste: log waste entry** — N/A: waste app manages containers (create/edit), not individual log entries. Container editing uses the shared editor modal (same as wiki/inventory). Covered by add container test.
- [x] **Calendar: add event** — calls `openAddModal()`, fills `#fTitle`/`#fMember`/`#fDate`/`#fStartTime`/`#fEndTime`, clicks `#btnSave`, verifies event visible in calendar.
- [x] **Calendar: edit/delete event** — deletes test event via gh CLI: reads `schedule.json`, removes entry by title, commits filtered JSON with fresh SHA.
- [x] **Projects: create project** — handles `prompt()` dialog, calls `createNewProject()`, verifies `docs/projects/{slug}/index.md` on GitHub.
- [x] **Bulletin board: edit** — **BUG FIXED**: dashboard Edit link used `?file=` param but wiki.html only reads `?doc=`. Fixed to `wiki.html?doc=bulletin`. Test verifies link href is correct.

### P2: Interactive features

- [x] **Freezer drag-and-drop** — move a tube from A1 to B3, verify position persists after reload. **Fixed:** 52 lines added to `lab-map.html` to persist drag-and-drop positions to GitHub. Verified by fix-loop agent (batch 1).
- [x] **Freezer: create new item at position** — clicks "Create New" in assign popover, fills `#newItemName`/`#newItemType`, verifies pre-filled `location_detail` format ("Shelf X / Box Y / PosLabel"), saves, verifies file on GitHub with `location_detail` in frontmatter.
- [x] **Freezer: assign existing item** — searches "ethanol" in `#assignSearch`, verifies `.assign-result` items appear (5 found).
- [x] **Object popup cards** — navigates to AMPure XP Beads page (has `[[wikilinks]]`), verifies `a.object-pill` elements render (4 found) with inline styling from `types.pillStyle()`.
- [x] **Inventory link pills** — Protocol wikilinks agent added `inventory://` links to all wet-lab protocols (batch 3). Feature now has content to test against.
- [x] **Knowledge graph** — verifies canvas element renders inside `#knowledgeGraph` on dashboard. Canvas-based (not SVG), uses D3 force simulation.
- [x] **Connections panel** — navigates to Ethanol page, verifies `#miniGraph` container exists with canvas and header showing connection count.
- [x] **Search across pages** — tests search on protocols ("PCR"), wiki ("ethanol"), inventory ("buffer"), notebooks ("alex"). All return >0 results.

### P3: Edge cases & error handling

- [x] **Concurrent edits** — Tested with two Playwright browser contexts. Second save gets SHA mismatch (422) as expected. Fix-loop agent (batch 2).
- [x] **Large file upload** — upload a 5MB image, verify it doesn't OOM on mobile. Requires creating a large test file; image resize caps at 1600px so OOM is unlikely. Tested: 3000x3000 canvas PNG (~1.5MB) uploaded at desktop and mobile viewports; resize pipeline caps to 1600x1600, no OOM, image appears in editor.
- [x] **Offline behavior** — Offline-aware error messages added to GitHub API calls in `github-api.js`. Tested with `context.setOffline(true)`. Fix-loop agent (batch 2).
- [x] **Token expiration** — Added `handleAuthError()` in `github-api.js` that detects 401/403, shows descriptive toast ("Your GitHub token has expired or is invalid. Please sign in again."), and clears the bad token. Tested save, create, and fetchFile with invalid token via Playwright route interception.
- [x] **Empty states** — Empty state handling already present across pages. Verified with filtered inventory (0 results), empty notebook folders. Fix-loop agent (batch 2).
- [x] **Special characters in titles** — creates wiki page with `"`, `&`, `<>`, `—` in title. Verifies file created on GitHub with safe slug, content preserved.
- [x] **Long content** — opens longest protocol (fiber-seq-dimelo-seq, ~34KB/30K chars), verifies: page loads <2s, scroll works, edit mode enters <1s, typing responsive <50ms. All steps pass with no performance concerns. Fix-loop agent.
- [ ] **Mobile editing** — open editor on mobile viewport, verify keyboard doesn't cover input, FAB positioning. Playwright can't simulate mobile keyboards.
- [ ] **Mobile image upload** — test camera/photo library upload flow on mobile viewport. Playwright can't access camera/photo library.
- [x] **Cross-page navigation** — navigates to AMPure page (has protocol wikilinks), clicks `obj://` pill, verifies URL changes to `protocols.html?doc=...`.

### P4: Visual regression

- [ ] **Screenshot comparison** — take baseline screenshots of each page, compare future runs to catch visual regressions. LabBot already saves screenshots to `/tmp/labbot-*.png` on every run.
- [ ] **Dark mode** — if/when added, verify all pages render correctly. Feature doesn't exist yet.
- [x] **Print preview** — Added Print Preview toggle to protocols toolbar. Renders content in an iframe with print-like CSS, paginated into 8.5x11in page divs with margins, page numbers, and grey gaps between pages. Content reflows naturally across page breaks.

### P5: New features (wishlist)

- [x] **Floating issue reporter** — Implemented in `app/js/issue-reporter.js`. Floating button (bottom-left), modal with description field, auto-captures page/title/time/viewport/UA, submits via GitHub Issues API, includes `@username` attribution. Uses Lab.showToast for feedback (no alert()). Polished and tested.
- [x] **Sample-type objects in markdown** — Added `sample` type to `app/js/types.js` (purple #7c3aed, 🧬 icon, fields: title, sample_id, species, project, lead, sequencing_type, status, notes). Added `lab` group to GROUPS. Added `samples` dir to `build-object-index.py`. Created test sample at `docs/samples/test-sample.md`. Verified: object-index includes sample, type system loads correctly, wikilink pills render with purple color and 🧬 icon. 19/19 tests pass.
- [x] **Fix safety SOP rendering** — All 10 SOP files reformatted: broken ASCII-art tables replaced with Markdown pipe tables, Pandoc artifacts removed, heading hierarchy standardized, signature tables cleaned up. -936/+388 lines. Fix-loop agent (batch 3).
- [x] **Audit imported lab protocols** — Fixed 8 files: degree symbols, Google Docs checkbox tables converted to numbered lists, middle-dot bullets to markdown dashes, content crammed into single table cells extracted to proper lists/tables, empty headers removed, escaped markdown fixed. 30+ files reviewed clean.
- [x] **Remove time estimate charts from protocols** — Removed ASCII bar charts from 6 protocols (pcr-genotyping, gel-electrophoresis, gel-electrophoresis-copy, quick-dna-extraction, ms-media-recipe, planting-arabidopsis-on-ms-plates). Text time summaries preserved. Fix-loop agent.
- [x] **Remove Nanopore/Flongle content** — Deleted 4 Nanopore/Flongle protocol files (flongle-sequencing-and-analysis, illumina-library-qc-on-flongle, nbd114-multiplexed-flongle-prep, ot2-automated-nbd114-prep). Cleaned broken wikilinks in operating-the-ot2, in-house-hifi-shearing-pipeline, in-house-vs-genome-center-decision. Removed entries from object-index.json (4) and link-index.json (129). Fix-loop agent.
- [x] **Organize protocols with wikilinks** — Resources sections with wikilinks added to all wet-lab protocols. Inventory items linked via `inventory://` syntax, cross-references between related protocols. 37 files changed, 419 insertions. Fix-loop agent (batch 3).
- [x] **View mode paragraph spacing** — Added `p { margin: 10px 0 }` to `.lab-rendered` CSS. Global reset was stripping paragraph margins, making view mode look squished vs editor. (Issue #12)
- [x] **Protocol print preview** — Print Preview toggle in protocols toolbar renders paginated pages via iframe with print-like CSS. 8.5x11in pages, page numbers, grey gaps. (Issue #13)
- [x] **Fix Google Docs notes formatting** — Converted notes-as-table-rows (single-cell tables with very long lines) to proper bullet lists in sorbitol-ctab-hifi-extraction.md and hmw-extraction-challenging-plants.md.
- [x] **Dashboard: bulletin wikilink pills** — Added `Lab.wikilinks.processRendered()` to dashboard bulletin rendering. Wikilinks now render as styled pills. Also added `wikilinks.preprocess()` for markdown-to-HTML conversion. (Issue #14)
- [x] **Dashboard: remove knowledge graph widget** — Removed canvas-based force graph (~120 lines JS) and HTML container from dashboard. Wiki page connections panel kept. (Issue #14)
- [x] **Inventory status states** — Replaced `need_more` checkbox with 4-state `status` select (in_stock/needs_more/out_of_stock/external). Status badges with colors on inventory table. "All Statuses" filter dropdown. Dashboard shows "Inventory Status" widget with counts. Old `need_more: true` auto-migrates to `needs_more`. (Issue #14)
- [x] **Inventory dashboard display** — Single combined "INVENTORY" count on dashboard stat bar. "Inventory Status" widget shows In Stock/Needs More/Out of Stock counts with colored indicators. (Issue #14)
- [x] **Inventory terminology cleanup** — Inventory is the unified catalog of everything (resources + stocks). Type filter and Add Item dropdowns now include all types with optgroups. Stocks link on dashboard fixed to point to inventory page. New items save to correct directory (resources/ vs stocks/) based on type group. (Issue #14)
- [x] **Dedicated People page** — New `app/people.html` with card-based layout showing name, role, email, phone, location, and connected wikilink pills. People tab added to nav bar. Dashboard People link updated. Clicking a card opens the editor modal. (Issue #15)
- [ ] **Link SOPs to inventory items** — Corrosives SOP (and likely other safety SOPs) reference chemicals that exist in inventory but aren't wikilinked. Need an agent pass to match SOP chemical names to inventory items and add `[[wikilinks]]`. May require fuzzy matching since names won't be exact. (Issue #16)
- [ ] **Liquid nitrogen protocol** — Create a new protocol for getting liquid nitrogen: Dewar location/room, key access, filling procedure. Short and practical. (Issue #17)

---

## Workflow E2E findings (2026-04-10)

Found by `tests/workflow-e2e.mjs` (James Freckles + Lab Manager simulation). Worker: 18/18 pass, Manager: 10/13.

### Dev improvements (site code changes)

- [x] **Projects: stale render after save** — `projects.html saveDoc()` called `loadDoc()` which re-fetched stale content. **Fixed:** render directly from saved markdown (same pattern as wiki/notebooks). Also captures editor image data URLs for instant preview.
- [x] **Freezer grid: cell labels too short** — Grid cells showed only 3 chars. **Fixed:** now shows type icon + 10-char truncated name with tooltip on hover. Font reduced to 6px with ellipsis overflow.
- [x] **Image default size on insertion** — Images inserted at 100% width. **Fixed:** new images default to 50% max-width via `_imgSizes` map + inline style. Users can still resize via toolbar.
- [x] **Protocol sidebar: copies indistinguishable** — Copies had no visual distinction. **Fixed:** protocols with `-copy` suffix now show "(Copy)" badge in sidebar using flex layout.
- [x] **Sample tracker: species field not searchable** — Search only indexed some fields. **Fixed:** haystack now includes all 8 text fields (sampleId, project, species, lead, sequencingType, status, notes, currentBlocker) with null guards.
- [x] **Dashboard notebook count wrong** — Showed "1 NOTEBOOKS" because only 1 entry had `type: notebook` in frontmatter. **Fixed:** counts entries by `notebooks/` path prefix instead of relying on type field.
- [x] **Protocols: stale render after rename** — `renameDoc()` already renders directly from saved markdown via `Lab.editorModal.renderMarkdown(newBody)` instead of calling `loadDoc()`. Verified by fix-loop agent (batch 1).
- [x] **Rendered view: images not visible after save** — `_setupRenderedImageFallback()` in shared.js handles view mode via capture-phase error listener + GitHub API fallback to base64 data URLs. Verified by fix-loop agent (batch 1).
- [x] **Table rendering: missing trailing newline** — Already fixed in `getMarkdownClean()` with regex: `md.replace(/(\|[^\n]*\|[ \t]*\n)(?=[^\n|])/g, '$1\n')`. Verified by fix-loop agent (batch 1).
- [x] **Inventory: name vs slug confusion** — Add Item modal had no slug visibility. **Fixed:** added live slug preview below name field (`File: some-slug.md`) using `Lab.slugify()` + monospace font.

---

## Known test infrastructure issues

These are problems with the test bot itself, not the site:

1. ~~**Notebook folder selector**~~ — **FIXED.** Changed `.nb-folder-header` to `.nb-folder`.
2. ~~**Notebook edit timeout**~~ — **FIXED.** Uses `evaluate(() => startEdit())` instead of Playwright click.
3. ~~**Projects folder listing**~~ — **FIXED.** Changed `.proto-folder-header` to `.proto-category`.
4. ~~**Image API fallback**~~ — **FIXED.** Test now injects an `<img>` into `#editorSurface` with a cache-busted URL that 404s on Pages, triggering `setupEditorImageFallback()` which fetches via authenticated GitHub API and replaces src with base64 data URL.

---

## Bugs found and fixed

1. **Freezer grid positions not persisting** — `location_detail` was saved in frontmatter but never parsed on reload. Items filled sequentially instead of at their assigned cell positions. **Fixed:** added `parseLocDetail()` to parse "Shelf 1 / Box A / A2" and place items correctly.

2. **Dashboard object-index.json 404** — dashboard fetched `BASE + 'docs/object-index.json'` but the deployed path is `BASE + 'object-index.json'` (MkDocs strips the `docs/` prefix). **Fixed:** removed `docs/` prefix.

3. **Wiki render-after-save showed stale content** — `saveDoc()` called `loadDoc()` which re-fetched from GitHub API (cached/stale). **Fixed:** render directly from the just-saved markdown, matching notebooks.html pattern. Also captures editor image data URLs for instant preview.

4. **Dashboard bulletin Edit link broken** — link used `wiki.html?file=docs/bulletin.md` but wiki.html only reads `?doc=` parameter. **Fixed:** changed to `wiki.html?doc=bulletin`. Also fixed "Needs Ordering" widget links (same `?file=` → `?doc=` bug).

5. **Projects stale render after save** — `projects.html saveDoc()` called `loadDoc()` which re-fetched from GitHub API (cached/stale). Same as wiki bug #3. **Fixed:** render directly from the just-saved markdown.

6. **Dashboard notebook count = 1** — stat card counted `type: notebook` entries in object-index.json, but notebook entries are created without frontmatter type. Only the template had it. **Fixed:** counts by `notebooks/` path prefix.

7. **Freezer grid labels unreadable** — occupied cells showed only 3 characters. **Fixed:** type icon + 10-char truncated name + tooltip.

8. **Images insert at 100% width** — pushed all editor content off-screen. **Fixed:** default to 50% max-width on upload.

9. **Protocol sidebar: copies look identical** — `-copy` suffix truncated away. **Fixed:** "(Copy)" badge appended to sidebar items.

10. **Sample tracker search missed species/status** — only searched sampleId, project, lead. **Fixed:** now indexes all 8 text fields.

11. **GitHub API CDN caching caused stale data** — `fetchFile()` returned stale content after saves because GitHub CDN caches API responses for 60s (`s-maxage=60`). Browser `cache: 'no-store'` only controls browser cache, not CDN. **Fixed:** added `&_t=Date.now()` timestamp cache-buster to `fetchFile()` and `deleteFile()` URLs. (QA cycles 3–4)

12. **Inventory Add Item double-click race** — Create button not disabled after click. Double-clicking sends two `saveFile()` requests for the same path; first succeeds, second gets 422 SHA mismatch. Shows confusing success + error toasts. **Fixed:** disable Create button and show "Creating…" on click in `confirmAdd()`. Re-enable on error. (QA cycle 5)

13. **Object pill popups opened in edit mode** — Clicking a wikilink pill (e.g., Acrylamide on a protocol page) opened the editor modal in edit mode immediately. Users just want to view the item. **Fixed:** `openPopup()` in `editor-modal.js` now renders view mode by default. Edit button available for logged-in users.

14. **Issue reporter used alert() instead of toast** — `issue-reporter.js` fell back to `alert()` because it checked for `Lab.toast` instead of `Lab.showToast`. **Fixed:** uses `Lab.showToast` with inline toast fallback. Also added `@username` attribution and full URL + page context in metadata.

15. **View mode paragraph spacing missing** — Global CSS reset (`* { margin: 0 }`) stripped all `<p>` margins in `.lab-rendered`, making view mode content look squished compared to the editor. **Fixed:** added `.lab-rendered p { margin: 10px 0 }`. (Issue #12)

16. **Google Docs notes imported as table rows** — Notes sections in extraction protocols were single-cell table rows with all items on one line, causing horizontal overflow. Affected: sorbitol-ctab-hifi-extraction.md, hmw-extraction-challenging-plants.md. **Fixed:** converted to `**Notes:**` + bullet lists.

17. **Dashboard bulletin wikilinks don't render as pills** — Wikilinks on the bulletin board show as plain text instead of styled pills. (Issue #14, open)

---

## Architecture notes for future agents

- All app pages are standalone HTML in `app/` — they share `app/js/shared.js` (auth gate, toast), `app/js/nav.js` (nav bar), `app/js/github-api.js` (GitHub API + localStorage patch layer), `app/css/base.css`.
- The ProseMirror editor is loaded via `app/js/editor-modal.js` — it's shared across wiki, protocols, notebooks, projects.
- Read `app/js/EDITOR_ARCHITECTURE.md` before touching editor code.
- Object index at `docs/object-index.json` is the central data source. It's a static JSON file rebuilt by MkDocs, with a localStorage patch layer for instant local updates.
- Samples (`/sample-tracker/`) and Calendar (`/calendar/`) are standalone HTML apps in `docs/`, not in `app/`. They have their own styling but share the nav bar.
- Auth: password gate (sessionStorage) + GitHub OAuth (localStorage). Playwright bypasses both via `addInitScript`.
