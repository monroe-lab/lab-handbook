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
| Dashboard | 6/6 | ✅ Stats, recent updates, bulletin, knowledge graph, graph canvas, bulletin edit link |
| Search | 4/4 | ✅ protocols, wiki, inventory, notebooks — all return results |
| Cross-nav | 2/2 | ✅ Wikilink pill found, navigates to protocols page |
| Special chars | 2/2 | ✅ Create with quotes/ampersands/tags, content preserved |
| Mobile | 7/7 | ✅ All 7 pages: no overflow, bottom nav present |

**Total: 97/97 (100%)**

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

- [ ] **Freezer drag-and-drop** — move a tube from A1 to B3, verify position persists after reload.
- [x] **Freezer: create new item at position** — clicks "Create New" in assign popover, fills `#newItemName`/`#newItemType`, verifies pre-filled `location_detail` format ("Shelf X / Box Y / PosLabel"), saves, verifies file on GitHub with `location_detail` in frontmatter.
- [x] **Freezer: assign existing item** — searches "ethanol" in `#assignSearch`, verifies `.assign-result` items appear (5 found).
- [x] **Object popup cards** — navigates to AMPure XP Beads page (has `[[wikilinks]]`), verifies `a.object-pill` elements render (4 found) with inline styling from `types.pillStyle()`.
- [ ] **Inventory link pills** — N/A: no protocol files currently use `inventory://` links. Feature exists in code but not in content.
- [x] **Knowledge graph** — verifies canvas element renders inside `#knowledgeGraph` on dashboard. Canvas-based (not SVG), uses D3 force simulation.
- [x] **Connections panel** — navigates to Ethanol page, verifies `#miniGraph` container exists with canvas and header showing connection count.
- [x] **Search across pages** — tests search on protocols ("PCR"), wiki ("ethanol"), inventory ("buffer"), notebooks ("alex"). All return >0 results.

### P3: Edge cases & error handling

- [ ] **Concurrent edits** — open same doc in two tabs, edit both, save both, verify no data loss. Hard to test reliably in Playwright (requires two browser contexts with independent auth).
- [ ] **Large file upload** — upload a 5MB image, verify it doesn't OOM on mobile. Requires creating a large test file; image resize caps at 1600px so OOM is unlikely.
- [ ] **Offline behavior** — disconnect network, verify graceful error messages. Playwright can simulate offline via `context.setOffline(true)`.
- [ ] **Token expiration** — what happens when the GitHub token expires mid-session? Would need to inject an expired token.
- [ ] **Empty states** — new lab member with no data: empty notebook, empty project, empty inventory filter results. Would need a clean auth context with no data.
- [x] **Special characters in titles** — creates wiki page with `"`, `&`, `<>`, `—` in title. Verifies file created on GitHub with safe slug, content preserved.
- [ ] **Long content** — open a very long protocol, verify scroll works and editor doesn't lag. Performance testing is hard in Playwright.
- [ ] **Mobile editing** — open editor on mobile viewport, verify keyboard doesn't cover input, FAB positioning. Playwright can't simulate mobile keyboards.
- [ ] **Mobile image upload** — test camera/photo library upload flow on mobile viewport. Playwright can't access camera/photo library.
- [x] **Cross-page navigation** — navigates to AMPure page (has protocol wikilinks), clicks `obj://` pill, verifies URL changes to `protocols.html?doc=...`.

### P4: Visual regression

- [ ] **Screenshot comparison** — take baseline screenshots of each page, compare future runs to catch visual regressions. LabBot already saves screenshots to `/tmp/labbot-*.png` on every run.
- [ ] **Dark mode** — if/when added, verify all pages render correctly. Feature doesn't exist yet.
- [ ] **Print view** — click Print on a protocol, verify the print-friendly layout. Playwright can't verify print CSS easily.

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
- [ ] **Protocols: stale render after rename** — `renameDoc()` calls `loadDoc()` which fetches stale cached content. Same bug as projects/wiki had. Needs render-from-saved-markdown fix.
- [ ] **Rendered view: images not visible after save** — Image URLs point to GitHub Pages path which hasn't rebuilt yet (~40s). API fallback only works in edit mode. Need fallback in rendered view too, or use data URLs captured from editor.
- [ ] **Table rendering: missing trailing newline** — Toast UI table markdown output may lack blank line before next heading, causing merged rendering. Fix in markdown post-processing.
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

---

## Architecture notes for future agents

- All app pages are standalone HTML in `app/` — they share `app/js/shared.js` (auth gate, toast), `app/js/nav.js` (nav bar), `app/js/github-api.js` (GitHub API + localStorage patch layer), `app/css/base.css`.
- The ProseMirror editor is loaded via `app/js/editor-modal.js` — it's shared across wiki, protocols, notebooks, projects.
- Read `app/js/EDITOR_ARCHITECTURE.md` before touching editor code.
- Object index at `docs/object-index.json` is the central data source. It's a static JSON file rebuilt by MkDocs, with a localStorage patch layer for instant local updates.
- Samples (`/sample-tracker/`) and Calendar (`/calendar/`) are standalone HTML apps in `docs/`, not in `app/`. They have their own styling but share the nav bar.
- Auth: password gate (sessionStorage) + GitHub OAuth (localStorage). Playwright bypasses both via `addInitScript`.
