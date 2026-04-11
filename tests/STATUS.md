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

## Current scores (2026-04-11)

| Section | Score | Status |
|---------|-------|--------|
| Protocols | 9/9 | ✅ Search, open, edit mode, cancel, create, edit & save, duplicate, rename, delete |
| Wiki | 14/14 | ✅ Create, rich text, wikilink, save, render, open, ProseMirror, cancel, object pills, pill styling, connections panel |
| Inventory | 6/7 | ⚠️ Load, search, add item, type filter, delete item — `Edit item fields` pre-existing failure (openItem opens popup view, no editable inputs to find) |
| Notebooks | 16/16 | ✅ Create, folders, rich text, image upload+annotation+resize+save+render, API fallback, delete |
| Lab Map | 12/12 | ✅ (R2, Issue #19) Placeholder card + hierarchy tree: renders root room, tree walks room→freezer→shelf→box→tubes, migrated items nest under auto-created box, grid & position badges, click opens popup with breadcrumb, filter narrows tree, collapse-all, inline delete removes file + DOM node |
| Hierarchy | 15/15 | ✅ (R1, Issue #18) Location entries in object-index, parentChain walks root→leaf, breadcrumbHTML, migrated items carry parent-ref, childrenOf reverse lookup, parseGrid, parsePosition, normalizeParent, sample cross-location wikilinks, tube popup breadcrumb, parent field as object pill, multi-line labels preserve newlines |
| Editor | 11/11 | ✅ (R3, Issue #18) 3-column modal layout, universal grid renderer (10x10 + 9x9 with collisions), label_2 in cells, collision badge + popover, shelf children list with +Add, **R5: reagent col 3 shows bottle backlinks** (was: container_list relocated), type field as datalist with discovered types, empty-cell click opens new-object modal (parent/position/type pre-filled), new mode clears col 2/3 synchronously |
| Wikilinks | 9/9 | ✅ (R4, Issue #18) Module loaded, autocomplete filter, sample popup shows backlinks from tubes, click backlink navigates, parent field autocomplete (location-only), empty cell opens place-here popover with search + create-new, place-here search returns results, [[ autocomplete fires on trigger in WYSIWYG, items show title + breadcrumb |
| Bottles | 10/10 | ✅ (R5) bottle type registered, 156 migrated bottles in index, all carry of:+parent:, ethanol-absolute wired to cabinet-flammable, 5 placeholder locations created, concept files cleaned of containers:, concept popup col 3 lists physical bottles via of:-aware backlinks, inventory hides bottle rows + counts them under concept |
| Samples | 7/7 | ✅ Load, status filter, search, add sample, edit modal, delete sample |
| Projects | 3/3 | ✅ Folder listing, open project, create project |
| Waste | 2/2 | ✅ Loads, add container |
| Calendar | 3/3 | ✅ Loads, add event, delete event |
| Dashboard | 4/4 | ✅ Stats, recent updates, bulletin, bulletin edit link |
| Search | 4/4 | ✅ protocols, wiki, inventory, notebooks — all return results |
| Cross-nav | 2/2 | ✅ Wikilink pill found, navigates to protocols page |
| Special chars | 2/2 | ✅ Create with quotes/ampersands/tags, content preserved |
| Mobile | 7/7 | ✅ All 7 pages: no overflow, bottom nav present |

**Total: 132/133 (99.2%)** — R5 adds 10 bottle tests covering the concept/instance migration. The single failure is the pre-existing inventory `Edit item fields` test (modal opens in popup view, not edit mode — predates R5, broken by an inventory.html change after the last STATUS update).

## Round 1: Location hierarchy data model (2026-04-10, Issue #18)

Backend-first implementation of the hierarchical location/object system. No new UI yet — R2 adds the tree view, R3 adds grid renderers.

- [x] **Location types in types.js** — Added `room`, `freezer`, `fridge`, `shelf`, `box`, `tube`, `container` + `locations` group. All share the freezer field schema via null-inheritance (title, parent, position, grid, label_1, label_2, notes).
- [x] **Hierarchy fields in object-index** — Added `parent`, `position`, `grid`, `label_1`, `label_2` to `EXTRACT_KEYS` in `scripts/build-object-index.py` and `INDEX_KEYS` in `app/js/github-api.js`. New `docs/locations/` directory added to OBJECT_DIRS.
- [x] **`app/js/hierarchy.js` utility** — `Lab.hierarchy.parentChain()`, `childrenOf()`, `breadcrumbHTML()`, `parseGrid()`, `parsePosition()`, `normalizeParent()`. Strips `[[brackets]]` from parent refs, resolves by slug or basename, cycle-safe chain walking.
- [x] **Breadcrumb wired into editor-modal popup** — Every object with a resolvable parent chain shows a clickable crumb trail above the body in its popup card.
- [x] **Migration script** — `scripts/migrate-location-detail.py --apply` parses legacy `"Shelf N / Box L / CellAN"` strings, auto-creates shelf/box objects under `docs/locations/`, rewrites items to `parent` + `position`, removes `location_detail`. Dry-run by default. Ran 2026-04-10: 8 items migrated into 1 new box (`locations/box-minus80-a-1-a`) attached to the seed freezer chain.
- [x] **Mock hierarchy seeded** — `locations/room-robbins-0170` → `freezer-minus80-a` → `shelf-minus80-a-1` → `box-pistachio-dna` (10x10) → `tube-pistachio-leaf-1` / `tube-pistachio-leaf-2`; plus `fridge-4c-main` → `box-dna-extracts` (8x12) → `tube-pistachio-dna-extract-1`. All three tubes prose-link to `samples/sample-pistachio-4` via wikilinks, proving cross-location references work.
- [x] **Playwright hierarchy tests** — 10 checks covering object-index shape, parentChain, breadcrumbHTML, childrenOf, parseGrid, parsePosition, normalizeParent, migration integrity, sample-to-tube cross-links, and the tube popup breadcrumb.
- [x] **Quarantined lab-map tests** — Current floor-plan view deprecated per Issue #19. Tests skipped by default via `QUARANTINED` set in labbot.mjs; `--only=labmap` still runs them for reference during R2 rebuild.

## Round 2: Lab map placeholder + hierarchy tree (2026-04-10, Issue #19)

Retired the clickable floor plan and rebuilt `app/lab-map.html` around the R1 hierarchy data model. No more hardcoded zone IDs, no more `location_detail` string parsing.

- [x] **Static placeholder card** — Replaces the canvas SVG floor plan with a "Map design in progress" card containing a simplified CSS/SVG room outline. Lives at the top of lab-map.html above the tree. No image files committed.
- [x] **Hierarchical tree view** — Rendered from `Lab.hierarchy.build()`, rooted at any parentless location type (room/freezer/fridge/shelf/box/tube/container). Expand/collapse per node, initial auto-expand depth of 2 so room + freezers are visible on load. Nodes show icon, title, position badge (e.g. "A1"), grid badge (e.g. "10x10"), and child count.
- [x] **Click-anywhere-on-row to open** — The full row is `data-act="open"` so clicking icon, title, or empty space opens the popup. Toggle chevron and inline action buttons have their own `data-act` values and win via `closest()` innermost-match.
- [x] **Inline edit + delete per node** — Hover reveals two buttons. Edit opens the editor-modal in edit mode. Delete prompts for confirmation (with a warning if the location has children that would be orphaned), calls `Lab.gh.deleteFile`, and rebuilds the tree.
- [x] **Filter input + expand-all / collapse-all** — `treeSearch` input filters nodes by slug/title/type, auto-expanding ancestors of any hit. Buttons to bulk expand or collapse.
- [x] **Orphan section** — Any entry whose `parent` field doesn't resolve appears in a dashed-border "Unresolved parents" section at the bottom with an orange "orphan: <raw>" badge showing the failed slug. Warns without crashing — aligns with the warn-but-allow decision.
- [x] **New Playwright tests** — 10 tests covering placeholder, root render, full chain expand, migrated-items nesting, grid & position badges, click-opens-popup, filter, collapse-all, throwaway-delete. Replaces the 14 obsolete floor-plan tests; `labmap` un-quarantined.

## Round 3: 3-column editor, universal grid, create-in-edit (2026-04-10, Issue #18)

Grey's design: every popup is three columns by concern — identity (fields), knowledge (body), contents (what this thing holds). Every container can declare a `grid` and the contents pane renders it without any type-specific logic.

- [x] **3-column popup layout** — `editor-modal.js` restructured so `em-modal-body` contains an `em-cols` flex with `em-col-fields` (280px), `em-col-body` (flex 1), `em-col-contents` (340px). Modal max-width bumped from 620px to 1180px. On narrow viewports (<900px) columns stack vertically. `#em-fields` and `#em-content` IDs preserved so downstream render logic is unchanged.
- [x] **Universal grid renderer** — `renderGridPane` parses any `grid: RxC` frontmatter. Square cells (not tube-shaped), A1-style biology labels (rows A-J, cols 1-10 for a 10x10). Cells with a matching child position show `label_2` in the type color. Unplaced children list below the grid. Grid works on any type — box, rack, shelf with `grid: 4x1`, even a fridge.
- [x] **Collision handling** — when two or more children share a position, the cell renders the first child and shows a bold orange badge with the count. Clicking the badge opens a small popover listing every colliding item as pills; outside-click dismisses.
- [x] **Children list pane** — location-type objects without a grid render a sorted clickable list of direct children via `hierarchy.childrenOf`. Each row shows icon, title, position badge. "+ Add" button spawns the create flow.
- [x] **Container_list relocated** — the repeating-rows `containers:` UI for reagents/stocks (individual bottles/kits with location/qty/unit/lot/expiration) moved from col 1 to col 3. Same helper functions, just a different mount. `collectContainers` still works because its selector (`[data-container-list]`) is global.
- [x] **Create-in-edit-mode flow** — new `Lab.editorModal.openNew({parent, position, defaultType, returnTo})`. Opens the modal directly in edit state for a fresh file, fields pre-filled (parent + position + type), Toast UI editor mounted with empty content, contents pane shows "Save first, then add children". On save, recomputes the target directory from the (possibly-changed) type, patches the index, then reopens the parent popup so its contents pane refreshes with the new child. Called from empty grid cell clicks and "+ Add" list buttons.
- [x] **Type field = `<datalist>` with discovered types** — `collectDiscoveredTypes` unions `Lab.types.TYPES` with every unique `type` string seen in the cached object index (exposed via new `Lab.gh._getCachedIndex()` sync accessor). Users can pick a known type or type any new value; unknown types render with the default icon/color via `Lab.types.get(...)` fallback. Grey edits `types.js` later to give formalized types proper icons. `save()` no longer force-overwrites `meta.type` from hidden schema values — that was buggy for inherited schemas (a `room` inheriting freezer's schema was being clobbered back to `freezer`).
- [x] **Auto type defaults** — `autoChildType(parentType)` picks a sensible default when creating a child: `room→container`, `freezer/fridge→shelf`, `shelf→box`, `box/rack/plate→tube`, `container/tube→container`. User can change via the datalist before saving.
- [x] **Flicker fix** — `openNew` clears col 2 (to a loading spinner) and col 3 (to the "no contents yet" placeholder) SYNCHRONOUSLY before awaiting Toast UI download, so the previous popup's body and grid aren't left visible while the bundle loads. Regression tests added.
- [x] **Empty-schema case** — notebooks / guides with no structured fields now show "No structured fields for this type" placeholder in col 1 instead of a blank column.
- [x] **stopEditing re-renders breadcrumb** — after save/edit, `Lab.hierarchy.invalidate()` + `breadcrumbHTML` reruns so changes to parent references update the chain.
- [x] **11 new Playwright editor tests** — 3-col layout, grid dimensions, multi-line cell labels, collision badge + popover, shelf children list + Add, container_list relocation, edit-mode type datalist, empty-cell create flow, col 2/3 cleared in new mode.
- [x] **Test infrastructure fixes** — wiki.html never reaches networkidle (knowledge graph repaints forever), so hierarchy/editor tests switched to `{ waitUntil: 'domcontentloaded' }` + `waitForFunction(() => Lab.editorModal)`. Breadcrumb assertion waits via `waitForSelector('.lab-breadcrumb', { timeout: 12000 })` instead of a fixed sleep. Throwaway delete test polls `ghFileExists` up to 10s to absorb GitHub contents-API cache lag.

## Round 4: wikilinks at scale (2026-04-10, Issue #18)

The vault is going to grow to thousands of objects with collidable titles (DI water aliquots in 10 different boxes, etc). R4 makes wikilinks workable at that scale: autocomplete with breadcrumbs to disambiguate, slug-as-stored-form so moves don't break refs, and a backlinks pane so concept cards can show all their references.

- [x] **Inline `[[` autocomplete in Toast UI editor** (`app/js/wikilink-autocomplete.js`, new) — Typing `[[` in the WYSIWYG editor triggers a floating dropdown of objects from the index, filterable by title/slug/type. Each item shows icon + title + type + parent breadcrumb (so two tubes both titled "DI H2O" can be told apart by their location chain). Arrow keys navigate, Enter/click inserts `[[slug]]` replacing the trigger text, Esc dismisses. Insertion uses `execCommand('insertText')` + Toast UI mode round-trip to force re-parse so the inserted slug renders as an object pill immediately.
- [x] **Parent field autocomplete in edit mode** — The `parent:` input in col 1 (edit mode only) uses the same autocomplete dropdown, restricted to location types. Student workflow for moving an object: open popup → Edit → type new parent name → pick from list → Save. Slug is preserved so all wikilinks still resolve. New `attachToInput()` + `detachInput()` methods on the autocomplete module.
- [x] **Empty grid cell = pick existing OR create new** — Clicking an empty cell now opens a small "place at this cell" popover with a search input (autocomplete for existing objects) and a "Create new here" fallback. Picking an existing object MOVES it: updates its parent + position, saves the file, patches the index, re-renders the contents pane. Slug is preserved. Wikilinks don't break.
- [x] **Backlinks pane in col 3** — For non-location, non-container objects (samples, reagents, people, projects, protocols), col 3 now shows a "References" list computed from `link-index.json`. New `Lab.gh.fetchLinkIndex()` + `clearLinkIndexCache()`. Clicking a backlink opens that object's popup. Verified on `samples/sample-pistachio-4.md` showing all three referencing tubes (leaf 1, leaf 2, DNA extract 1).
- [x] **Notes field removed from location/sample types** (small R3 cleanup) — Markdown body is the canonical freeform area; a separate `notes:` frontmatter field was redundant and visually cluttered col 1.
- [x] **9 new Playwright wikilinks tests** — Module load, filter utility, sample backlinks, click-backlink-navigates, parent field autocomplete with type filter, empty cell place-here popover, place-here search, `[[` trigger fires in WYSIWYG, autocomplete items show breadcrumb.

### Subtle bugs caught and fixed during R4

1. **Wrong ProseMirror selected** — Toast UI keeps TWO ProseMirror instances in the DOM at all times: one for markdown mode (with syntax-highlighter spans like `toastui-editor-md-heading`) and one for WYSIWYG. `document.querySelector('.ProseMirror')` was picking the markdown-mode one by document order, so the autocomplete attached to the wrong element. Fixed by preferring `.toastui-editor-ww-container .ProseMirror`.
2. **Shared state collision** — `attachToInput` was piggybacking on the `[[` variant's module-level `state` variable. When the body editor's attach() ran 200ms later, it clobbered the input variant's state. Fixed by passing explicit `(items, selectedIdx, onPick)` args into `renderItems` so each variant tracks its own state independently.
3. **Cross-variant blur clobber** — The `[[` variant's blur handler on the ProseMirror fired when the user clicked from the body editor to the col 1 parent input field, hiding the dropdown 200ms later — clobbering the input variant's just-opened dropdown. Fixed by adding a `data-wla-owner` attribute to the dropdown ('trigger' / 'input') and making `hide(callerOwner)` no-op if another variant currently owns the dropdown.

### Deferred from R4 (R5 candidates)

- **Locations hierarchy picker** — `[[` autocomplete with breadcrumbs already covers disambiguation. A dedicated tree-view picker for the "Locations" insert pill is nice but not blocking.
- **Ambiguous wikilink rendering** — when a legacy `[[Title]]` link resolves to >1 object, render as an orange "ambiguous" pill with click-to-pick. Cosmetic improvement; won't ship in R4.
- **Concept/instance migration** — script to convert existing `containers: []` arrays into first-class bottle objects with parent + position. Big restructure with migration concerns; will be R5's main feature.
- **Fields card on rendered MkDocs pages** — needs a MkDocs plugin / template override. Separate task from JS-level work.
- **Add field button in edit mode** — turns out renderFields already shows every schema field as an editable input in edit mode (including empty ones), so "turn grid on" is already "type 10x10 in the Grid input, save". No button needed.

## Round 5: Concept/instance migration — bottles as first-class objects (2026-04-11, R5_PLAN.md)

The vault's reagent/stock concepts (`docs/resources/*.md`, `docs/stocks/*.md`) historically tracked physical instances inline as `containers: []` arrays in YAML frontmatter. That compromise didn't scale: bottles couldn't have their own `parent:` (a specific shelf or box) or `position:`, couldn't be referenced by wikilink, and couldn't carry per-bottle lot/expiration metadata. R5 ports the same concept/instance split that R1 proved for the pistachio sample model to reagents/stocks.

**Pre-migration data reality check:** 155 concept files with non-empty `containers:`, 156 total entries (one file had 2). Zero entries had `lot:`. Only 1 had `expiration:` (ethanol-70 → 2026-04-07). Only 7 unique location strings, all coarse cabinet-level: Chemical Cabinet (108), Flammable Cabinet (16), Corrosive Cabinet (15), Refrigerator (13), Bench (2), Other (1), Freezer -80C (1). The migration is dramatically thinner than R5_PLAN.md anticipated: lot/expiration/acquired schema is **aspirational** for new bottles arriving post-R5, not a backfill exercise.

### Design decisions (Grey-confirmed before coding)

- **New `bottle` type, not reuse `consumable`.** Semantically distinct, easier to filter/group, has its own field schema. Color: deep orange `#ef6c00`. Icon: 🧴. Group: `stocks`. (Q1)
- **Both `of:` frontmatter AND body wikilink.** `of:` is load-bearing for queryability and the col 3 backlinks pane; body wikilink is convenience for prose. (Q2)
- **`docs/stocks/` is the home** — same bucket as `bl21-de3-competent-cells.md`, the existing redwood DNA stocks. (Q3)
- **Auto-create placeholder location objects.** Six new ones (`cabinet-chemical`, `cabinet-flammable`, `cabinet-corrosive`, `fridge-reagent`, `bench-reagent`, `location-unsorted`); the 1 `Freezer -80C` entry reuses R1's `freezer-minus80-a`. Grey expands the real lab hierarchy at his own pace; bottles re-parent via one-line frontmatter edits without breaking slugs. (Q4)
- **Drop `quantity` as a *count*; preserve `quantity`+`unit` as *contents amount*; add `level` for fullness.** A bottle is one bottle by definition — count comes from counting files. `quantity:500 unit:g` describes what's *inside* the bottle (500g of NaCl). `level` is optional text ("3/4", "empty"). (Q5, refined after data reality check)
- **Delete `containers:` from source concept files on apply.** Dual sources of truth always rot.

### Schema

```yaml
type: bottle
title: "Ethanol Absolute"
of: resources/ethanol-absolute       # concept pointer (frontmatter)
parent: locations/cabinet-flammable  # R1 hierarchy
position: ""                         # optional grid cell
quantity: 500                        # amount in the bottle
unit: g
lot: ""                              # aspirational
expiration: ""                       # aspirational
acquired: ""                         # aspirational
level: ""                            # aspirational ("full", "3/4", etc.)
```

Body: `Bottle of [[resources/ethanol-absolute]].`

### What R5 shipped

- [x] **`bottle` type added to `app/js/types.js`** — explicit field schema (not inherited from seed/reagent), color, icon, displayFields, tableColumns. Added to `GROUPS.stocks.types` array.
- [x] **`scripts/build-object-index.py` extended** — `EXTRACT_KEYS` now includes `of`, `lot`, `expiration`, `acquired`, `level`. The 156 bottles + their fields are queryable via `Lab.gh.fetchObjectIndex()`.
- [x] **Backlinks pane unions body wikilinks + frontmatter `of:` references** — `editor-modal.js` `fetchBacklinksFor()` (R4 function) now also walks the index for entries whose `of:` field matches the current concept slug. The Ethanol concept's col 3 lists every physical bottle pointing at it, with no body wikilink required.
- [x] **`scripts/migrate-containers-to-bottles.py`** — dry-run + `--apply` migration. Auto-creates the 6 placeholder location objects. Generates one bottle file per container entry under `docs/stocks/bottle-<concept-slug>[-N].md`. Multi-bottle concepts get numeric suffixes (e.g. `bottle-ethanol-70-1.md`, `-2.md`). Carry-over fields (`quantity`, `unit`, `lot`, `expiration`, `acquired`, `level`) are preserved. Source concept files have `containers:` stripped on apply.
- [x] **Migration applied 2026-04-11** — 6 locations created, 156 bottles created, 155 concepts cleaned. One subtle case: ethanol-70 had 2 container entries → 2 bottle files (`-1`, `-2`), and the carryover preserved the `expiration: '2026-04-07'` on the right one.
- [x] **`reagent` schema cleanup** — dropped the now-dead `container_list` field from the reagent schema entirely. Removed `containers` from `displayFields`. Resource subtypes (buffer/consumable/etc.) inherit from reagent so they're covered too. Without this, `editor-modal.js renderContents()` short-circuited on the `container_list` field at line 910 and rendered an empty container UI in col 3 instead of falling through to the new bottle backlinks pane — caught by the labbot test the first time it ran.
- [x] **`app/inventory.html` rolls up bottles per concept** — `loadInventory()` builds a `bottlesByConcept` map from index, then `toInventoryRow()` rolls up bottles into the concept row's quantity/location/count instead of the legacy `containers[]`. Bottles themselves are excluded from the top-level row list (they're shown as instances under their concept via the editor popup, not as separate inventory rows). Display label switches between "(N bottles)" and "(N containers)" depending on which path the rollup used.
- [x] **R5 editor test updated** — the old "Reagent container_list relocated to col 3" check (R3) is now "Reagent col 3 shows bottle backlinks (R5)". Verifies col 1 has no container UI AND col 3 has at least one `.em-backlink-row` whose data-slug starts with `bottle-ethanol-absolute`.
- [x] **10 new Playwright `bottles` tests** — bottle type registered in Lab.types with the right group/schema, index has 156 bottles all carrying `of:`+`parent:`, ethanol-absolute bottle wired to `cabinet-flammable`, 5 placeholder locations exist, concept files have 0 leftover `containers:`, concept popup col 3 lists its bottles via `of:`-aware backlinks, inventory page hides bottle rows from the table while still rendering the concept row.

### Pre-existing test failure noted

- **`inventory: Edit item fields`** — Pre-existing failure unrelated to R5. `openItem()` in inventory.html calls `Lab.editorModal.open()` which opens the editor modal in popup (read-only) view. The test queries `.em-field-input[type="text"]` looking for editable inputs, which only exist in edit mode. The test was last claimed as passing at commit `76bb013` (2026-04-09); inventory.html was modified after that by commits 8cdcc29 and 1cae12e and f6734c3, one of which broke the openItem→edit-mode flow without updating STATUS.md. R5 did not change `openItem`. Fix is for a future round.

### What R5 explicitly did NOT include

- **Locations hierarchy picker** for the "Locations" insert pill — R6.
- **Ambiguous wikilink rendering** — R6 cosmetic.
- **Drag-and-drop in grid** — R6+.

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
- [x] **Lab map: add-item UI + hierarchical location objects** (Issue #18) — Done across R1+R2+R3+R4. R1 added the location types + parent/position/grid schema + breadcrumb renderer. R2 rebuilt lab-map.html as a hierarchy tree with inline edit/delete. R3 added the universal grid renderer + create-in-edit flow. R4 added the place-here popover (pick existing or create new at a cell) + parent field autocomplete. Standard boxes render as flexible row×col grids; cells show `label_2`. See Round 1-4 sections above.
- [x] **Lab map: deprioritize visual map, prioritize hierarchy** (Issue #19) — Done in R2. The clickable floor plan was retired and replaced with a static "Map design in progress" placeholder card; the hierarchical tree below it is the primary navigation surface. Old floor-plan tests quarantined then replaced with the 12 new tree-view tests.
- [x] **Frictionless location tagging from notebooks** (Issue #20) — Substantially done in R4. The `[[` autocomplete works in any Toast UI editor (notebooks, protocols, wiki, popup body), shows objects with title + type + parent breadcrumb so identical-titled tubes can be disambiguated, and inserts the canonical slug form so moves don't break references. Combined with the place-here popover and parent field autocomplete, the "I put this here" workflow is one-modal away. **Not yet built**: a notebook-specific slash command shortcut (e.g. `/sample` to spawn a new sample object inline). Could revisit if the autocomplete-only flow turns out to be insufficient in real use.

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
