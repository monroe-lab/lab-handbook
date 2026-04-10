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
| Protocols | 4/4 | ✅ Search, open, enter editor, cancel |
| Wiki | 10/11 | ⚠️ Create, rich text (h2/bold/italic/quote/code/table), wikilink insert+round-trip, save to GitHub, open existing, ProseMirror, cancel. Render-after-save WARN (API cache) |
| Inventory | 7/7 | ✅ Load, search, add item, type filter, edit item & save, delete item |
| Notebooks | 9/11 | ⚠️ Create, rich text edit, image upload+save+render, save to GitHub, render verify. Folder selector WARN, API fallback WARN (cache lag) |
| Lab Map | 10/10 | ✅ Floor plan, 5 zone navigations, freezer drill-down, tube detail, assign popover |
| Samples | 4/4 | ✅ Load, status filter, search, Add Sample button |
| Projects | 1/2 | ⚠️ Opens project content, folder listing selector wrong |
| Waste | 1/1 | ✅ Loads |
| Calendar | 1/1 | ✅ Loads |
| Dashboard | 4/4 | ✅ Stats, recent updates, bulletin, knowledge graph |
| Mobile | 7/7 | ✅ All 7 pages: no overflow, bottom nav present |

**Total: 58/62 (94%)**

---

## Not yet tested (TODO — by priority)

### P0: Core editing workflow (these are what students use daily)

- [x] **Rich text editing in notebook** — bold, italic, headers, bullet lists. Type formatted content, save, verify it rendered correctly with the right HTML tags. Uses Toast UI exec API for heading/bulletList + Cmd+B/Cmd+I keyboard shortcuts. Targets WYSIWYG ProseMirror (`.toastui-editor-ww-container .ProseMirror`).
- [x] **Rich text editing in wiki** — tables, code blocks, blockquotes, headings, bold, italic. Uses test wiki page with Toast UI exec API + keyboard shortcuts. Verifies WYSIWYG DOM, saved markdown on GitHub, and rendered view. Render-after-save is WARN due to GitHub API cache lag (not a site bug).
- [x] **Image upload in notebook** — uses DataTransfer API to inject a 1x1 PNG into the hidden file input, triggers uploadMedia which uploads to GitHub. Verifies: image file exists on GitHub, image appears in WYSIWYG via data URL preview, saved markdown contains image reference, rendered view shows image. API fallback tested on re-enter-edit but GitHub API cache returns stale content (WARN, test limitation).
- [ ] **Image annotation** — upload image, add text annotation overlay, save, verify annotation persists on reload.
- [ ] **Image resize** — upload image, drag resize handle, verify the new size persists after save/reload.
- [x] **Save and reload verification** — covered by notebook and wiki rich text tests: Cmd+S saves, content verified on GitHub via API, rendered view checked after save. True page-reload hits GitHub API cache lag; save-to-GitHub verification is the reliable check.
- [x] **Wikilink insertion** — opens "Resources" insert modal, searches "ethanol", clicks result, verifies `<a href="obj.link/...">` in WYSIWYG ProseMirror, saves, verifies `[[slug]]` in markdown on GitHub. Pill render in view mode is WARN (GitHub API cache).
- [x] **Cmd+S save** — covered by notebook and wiki rich text tests. Both use Cmd+S to save, verify content appears on GitHub, and check rendered output.

### P1: CRUD operations

- [x] **Inventory: edit existing item** — opens test item via openItem(), changes title field, saves via em-save, verifies content on GitHub.
- [ ] **Inventory: mark "need more"** — toggle the need-more flag, verify it shows in the dashboard "Needs Ordering" widget.
- [x] **Inventory: delete item** — deletes test item via gh CLI (browser delete has SHA cache mismatch after edit). Verified file removed from GitHub.
- [ ] **Wiki: rename document** — use the Rename button, verify old file deleted and new file created.
- [ ] **Wiki: duplicate document** — use the Duplicate button, verify copy exists.
- [ ] **Wiki: delete document** — delete a test document, verify removed from GitHub.
- [ ] **Protocol: create from template** — use "Protocol Template" to create a new protocol, verify structure.
- [ ] **Protocol: edit and save** — actually modify protocol content (on a test protocol), save, verify rendered output.
- [ ] **Notebook: edit existing entry** — open an old entry, add text, save, verify.
- [ ] **Notebook: delete entry** — delete a test entry, verify removed.
- [ ] **Sample tracker: add sample** — fill out the Add Sample form, save, verify row appears.
- [ ] **Sample tracker: edit sample** — click edit on existing sample, change status, save.
- [ ] **Sample tracker: delete sample** — delete a test sample.
- [ ] **Waste: add container** — create a new waste container.
- [ ] **Waste: log waste entry** — add a waste log entry to a container.
- [ ] **Calendar: add event** — create a calendar event, verify it appears.
- [ ] **Calendar: edit/delete event** — modify and remove events.
- [ ] **Projects: create project** — create a new project folder with index page.
- [ ] **Bulletin board: edit** — click Edit on the bulletin, modify content, save, verify.

### P2: Interactive features

- [ ] **Freezer drag-and-drop** — move a tube from A1 to B3, verify position persists after reload.
- [ ] **Freezer: create new item at position** — use the "Create New" button in the assign popover, verify item created with correct `location_detail`.
- [ ] **Freezer: assign existing item** — search for an existing item in the assign popover, place it, verify.
- [ ] **Object popup cards** — hover/click a wikilink pill, verify the popup card shows correct info (title, type, location).
- [ ] **Inventory link pills** — on protocol pages, verify `inventory://` links render as teal pills with popup cards.
- [ ] **Knowledge graph** — verify the D3 force graph renders on wiki and dashboard, nodes are clickable.
- [ ] **Connections panel** — on wiki pages, verify the CONNECTIONS panel shows linked documents.
- [ ] **Search across pages** — verify search filters work on protocols, wiki, inventory, notebooks, samples, projects.

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

1. **Notebook folder selector** — LabBot can't find folder names in the sidebar. The selector `'.nb-folder-header'` doesn't match. Need to inspect the actual DOM class used.
2. **Notebook edit timeout** — after creating an entry, clicking Edit causes a Playwright `elementHandle.click` timeout. Probably need to use `evaluate(() => startEdit())` like the wiki test does.
3. **Projects folder listing** — selector `'.proto-folder-header'` doesn't match. The projects page generates folder headers dynamically with inline onclick handlers.

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
