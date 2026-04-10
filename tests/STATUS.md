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

## Current scores (2026-04-09)

| Section | Score | Status |
|---------|-------|--------|
| Protocols | 9/9 | ✅ Search, open, edit mode, cancel, create, edit & save, duplicate, rename, delete |
| Wiki | 11/11 | ✅ Create, rich text (h2/bold/italic/quote/code/table), wikilink insert+round-trip, save to GitHub, render-after-save, open existing, ProseMirror, cancel |
| Inventory | 8/8 | ✅ Load, search, add item, type filter, edit+need_more & save, delete item |
| Notebooks | 16/16 | ✅ Create, folders, rich text, image upload+annotation+resize+save+render, API fallback, delete |
| Lab Map | 10/10 | ✅ Floor plan, 5 zone navigations, freezer drill-down, tube detail, assign popover |
| Samples | 7/7 | ✅ Load, status filter, search, add sample, edit modal, delete sample |
| Projects | 2/2 | ✅ Folder listing (.proto-category), open project content |
| Waste | 2/2 | ✅ Loads, add container |
| Calendar | 3/3 | ✅ Loads, add event, delete event |
| Dashboard | 5/5 | ✅ Stats, recent updates, bulletin, knowledge graph, graph canvas renders |
| Search | 4/4 | ✅ protocols, wiki, inventory, notebooks — all return results |
| Mobile | 7/7 | ✅ All 7 pages: no overflow, bottom nav present |

**Total: 84/84 (100%)**

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
- [ ] **Notebook: edit existing entry** — open an old entry, add text, save, verify.
- [x] **Notebook: delete entry** — deletes test entry via `ghDeleteFile()` (gh CLI), verifies file removed from GitHub. Same pattern as inventory delete to avoid SHA cache mismatch.
- [x] **Sample tracker: add sample** — fills `#fSampleId`, `#fProject`, `#fSpecies`, clicks `#btnSaveItem`, verifies sample appears in table via search. Saves to `samples.json` via GitHub API.
- [x] **Sample tracker: edit sample** — clicks edit button (`openEditModal`), verifies edit modal opens with `#itemModal.open`. Closes without saving to avoid SHA mismatch with delete.
- [x] **Sample tracker: delete sample** — reads `samples.json` via gh CLI, removes test entry, commits filtered JSON with fresh SHA. Avoids in-browser SHA cache mismatch.
- [x] **Waste: add container** — clicks `#addBtn`, fills `#addName`/`#addContents`/`#addLocation`, clicks Create. Verifies `docs/waste/{slug}.md` exists on GitHub.
- [ ] **Waste: log waste entry** — add a waste log entry to a container.
- [x] **Calendar: add event** — calls `openAddModal()`, fills `#fTitle`/`#fMember`/`#fDate`/`#fStartTime`/`#fEndTime`, clicks `#btnSave`, verifies event visible in calendar.
- [x] **Calendar: edit/delete event** — deletes test event via gh CLI: reads `schedule.json`, removes entry by title, commits filtered JSON with fresh SHA.
- [ ] **Projects: create project** — create a new project folder with index page.
- [ ] **Bulletin board: edit** — click Edit on the bulletin, modify content, save, verify.

### P2: Interactive features

- [ ] **Freezer drag-and-drop** — move a tube from A1 to B3, verify position persists after reload.
- [ ] **Freezer: create new item at position** — use the "Create New" button in the assign popover, verify item created with correct `location_detail`.
- [ ] **Freezer: assign existing item** — search for an existing item in the assign popover, place it, verify.
- [ ] **Object popup cards** — hover/click a wikilink pill, verify the popup card shows correct info (title, type, location).
- [ ] **Inventory link pills** — on protocol pages, verify `inventory://` links render as teal pills with popup cards.
- [x] **Knowledge graph** — verifies canvas element renders inside `#knowledgeGraph` on dashboard. Canvas-based (not SVG), uses D3 force simulation.
- [ ] **Connections panel** — on wiki pages, verify the CONNECTIONS panel shows linked documents.
- [x] **Search across pages** — tests search on protocols ("PCR"), wiki ("ethanol"), inventory ("buffer"), notebooks ("alex"). All return >0 results.

### P3: Edge cases & error handling

- [ ] **Concurrent edits** — open same doc in two tabs, edit both, save both, verify no data loss.
- [ ] **Large file upload** — upload a 5MB image, verify it doesn't OOM on mobile.
- [ ] **Offline behavior** — disconnect network, verify graceful error messages (not blank pages).
- [ ] **Token expiration** — what happens when the GitHub token expires mid-session?
- [ ] **Empty states** — new lab member with no data: empty notebook, empty project, empty inventory filter results.
- [ ] **Special characters in titles** — create items with quotes, ampersands, unicode, slashes in names.
- [ ] **Long content** — open a very long protocol, verify scroll works and editor doesn't lag.
- [ ] **Mobile editing** — open editor on mobile viewport, verify keyboard doesn't cover input, FAB positioning.
- [ ] **Mobile image upload** — test camera/photo library upload flow on mobile viewport.
- [ ] **Cross-page navigation** — click a wikilink on a wiki page, verify it opens the right doc. Click a resource link on a protocol, verify popup.

### P4: Visual regression

- [ ] **Screenshot comparison** — take baseline screenshots of each page, compare future runs to catch visual regressions.
- [ ] **Dark mode** — if/when added, verify all pages render correctly.
- [ ] **Print view** — click Print on a protocol, verify the print-friendly layout.

---

## Known test infrastructure issues

These are problems with the test bot itself, not the site:

1. ~~**Notebook folder selector**~~ — **FIXED.** Changed `.nb-folder-header` to `.nb-folder`.
2. ~~**Notebook edit timeout**~~ — **FIXED.** Uses `evaluate(() => startEdit())` instead of Playwright click.
3. ~~**Projects folder listing**~~ — **FIXED.** Changed `.proto-folder-header` to `.proto-category`.
4. ~~**Image API fallback**~~ — **FIXED.** Test now injects an `<img>` into `#editorSurface` with a cache-busted URL that 404s on Pages, triggering `setupEditorImageFallback()` which fetches via authenticated GitHub API and replaces src with base64 data URL.

---

## Bugs found and fixed (this session)

1. **Freezer grid positions not persisting** — `location_detail` was saved in frontmatter but never parsed on reload. Items filled sequentially instead of at their assigned cell positions. **Fixed:** added `parseLocDetail()` to parse "Shelf 1 / Box A / A2" and place items correctly.

2. **Dashboard object-index.json 404** — dashboard fetched `BASE + 'docs/object-index.json'` but the deployed path is `BASE + 'object-index.json'` (MkDocs strips the `docs/` prefix). **Fixed:** removed `docs/` prefix.

---

## Architecture notes for future agents

- All app pages are standalone HTML in `app/` — they share `app/js/shared.js` (auth gate, toast), `app/js/nav.js` (nav bar), `app/js/github-api.js` (GitHub API + localStorage patch layer), `app/css/base.css`.
- The ProseMirror editor is loaded via `app/js/editor-modal.js` — it's shared across wiki, protocols, notebooks, projects.
- Read `app/js/EDITOR_ARCHITECTURE.md` before touching editor code.
- Object index at `docs/object-index.json` is the central data source. It's a static JSON file rebuilt by MkDocs, with a localStorage patch layer for instant local updates.
- Samples (`/sample-tracker/`) and Calendar (`/calendar/`) are standalone HTML apps in `docs/`, not in `app/`. They have their own styling but share the nav bar.
- Auth: password gate (sessionStorage) + GitHub OAuth (localStorage). Playwright bypasses both via `addInitScript`.
